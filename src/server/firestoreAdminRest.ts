import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Division, District } from '../data/bangladeshData';
import {
  validateBangladeshGeographyDataset,
  type GeographyValidationReport
} from '../data/geographyValidator';

export type ImportStatusMode = 'preserve' | 'published' | 'draft';

export interface FirebaseProjectTarget {
  projectId: string;
  firestoreDatabaseId: string;
}

export interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
  project_id?: string;
}

export interface ExistingDocIndex {
  ids: Set<string>;
  slugToId: Map<string, string>;
  createdAtById: Map<string, string>;
}

export interface GeographyFirestoreDiff {
  existingDivisionsCount: number;
  existingDistrictsCount: number;
  existingDivisionIds: string[];
  missingDivisionIds: string[];
  existingDistrictIds: string[];
  missingDistrictIds: string[];
  divisionSlugCollisions: Array<{ datasetId: string; existingDocId: string; slug: string }>;
  districtSlugCollisions: Array<{ datasetId: string; existingDocId: string; slug: string }>;
  readyToImport: boolean;
}

export interface GeographyInspectionResult {
  report: GeographyValidationReport;
  firestoreDiff: GeographyFirestoreDiff;
  target: FirebaseProjectTarget;
}

export interface GeographyImportExecutionResult {
  success: boolean;
  target: FirebaseProjectTarget;
  statusMode: ImportStatusMode;
  confirmOverwrite: boolean;
  report: GeographyValidationReport;
  createdDivisions: number;
  createdDistricts: number;
  overwrittenDivisions: number;
  overwrittenDistricts: number;
  skippedExistingDivisions: number;
  skippedExistingDistricts: number;
  slugCollisions: Array<{ collection: 'divisions' | 'districts'; datasetId: string; existingDocId: string; slug: string }>;
  importedAt: string;
}

type FirestoreRestValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreRestValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreRestValue> } };

interface FirestoreRestDocument {
  name: string;
  fields?: Record<string, FirestoreRestValue>;
}

export function loadFirebaseProjectTarget(): FirebaseProjectTarget {
  let projectId = (process.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  let firestoreDatabaseId = '(default)';

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
        projectId?: string;
        firestoreDatabaseId?: string;
      };
      if (parsed.projectId) projectId = parsed.projectId.trim();
      if (parsed.firestoreDatabaseId) firestoreDatabaseId = parsed.firestoreDatabaseId.trim();
    }
  } catch (err) {
    console.warn('[geography-import] Could not read firebase-applet-config.json:', err instanceof Error ? err.message : err);
  }

  if (!projectId) {
    throw new Error('Firebase projectId is not configured in firebase-applet-config.json or VITE_FIREBASE_PROJECT_ID.');
  }

  return { projectId, firestoreDatabaseId };
}

function getFirestoreBaseUrl(target: FirebaseProjectTarget): string {
  const project = encodeURIComponent(target.projectId);
  const database = encodeURIComponent(target.firestoreDatabaseId || '(default)');
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/${database}`;
}

function toFirestoreValue(val: unknown): FirestoreRestValue | undefined {
  if (val === undefined) return undefined;
  if (val === null) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { nullValue: null };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    const values: FirestoreRestValue[] = [];
    for (const item of val) {
      const encoded = toFirestoreValue(item);
      if (encoded !== undefined) values.push(encoded);
    }
    return { arrayValue: { values } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, FirestoreRestValue> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      const encoded = toFirestoreValue(v);
      if (encoded !== undefined) fields[k] = encoded;
    }
    return { mapValue: { fields } };
  }
  return undefined;
}

function toFirestoreFields(obj: Record<string, unknown>): Record<string, FirestoreRestValue> {
  const fields: Record<string, FirestoreRestValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    const converted = toFirestoreValue(value);
    if (converted !== undefined) {
      fields[key] = converted;
    }
  }
  return fields;
}

function readStringField(fields: Record<string, FirestoreRestValue> | undefined, key: string): string {
  const val = fields?.[key];
  if (val && 'stringValue' in val && typeof val.stringValue === 'string') {
    return val.stringValue;
  }
  return '';
}

function extractDocId(docName: string): string {
  const parts = docName.split('/');
  return parts[parts.length - 1] || '';
}

export function loadServiceAccountFromEnv(): ServiceAccountCredentials | null {
  const rawJson = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (rawJson) {
    const parsed = JSON.parse(rawJson) as Partial<ServiceAccountCredentials>;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing client_email or private_key.');
    }
    return parsed as ServiceAccountCredentials;
  }

  const credPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  if (credPath) {
    const resolved = path.resolve(process.cwd(), credPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`GOOGLE_APPLICATION_CREDENTIALS file not found: ${resolved}`);
    }
    const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8')) as Partial<ServiceAccountCredentials>;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error(`Service account JSON at ${resolved} is missing client_email or private_key.`);
    }
    return parsed as ServiceAccountCredentials;
  }

  return null;
}

export async function mintServiceAccountAccessToken(sa: ServiceAccountCredentials): Promise<string> {
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: tokenUri,
      iat: nowSec,
      exp: nowSec + 3600
    })
  ).toString('base64url');

  const signingInput = `${header}.${claims}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(sa.private_key.replace(/\\n/g, '\n')).toString('base64url');
  const assertion = `${signingInput}.${signature}`;

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });

  const resp = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(10000)
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`OAuth2 token exchange failed (${resp.status}): ${errText.slice(0, 300)}`);
  }

  const json = (await resp.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error('OAuth2 token exchange did not return an access_token.');
  }
  return json.access_token;
}

async function listExistingCollectionDocs(
  target: FirebaseProjectTarget,
  collectionName: 'divisions' | 'districts',
  bearerToken: string
): Promise<ExistingDocIndex> {
  const ids = new Set<string>();
  const slugToId = new Map<string, string>();
  const createdAtById = new Map<string, string>();
  const baseUrl = getFirestoreBaseUrl(target);
  let pageToken = '';

  do {
    const url = new URL(`${baseUrl}/documents/${collectionName}`);
    url.searchParams.set('pageSize', '300');
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(
        `Failed to inspect Firestore collection "${collectionName}" (${resp.status}): ${errText.slice(0, 240)}`
      );
    }

    const data = (await resp.json()) as {
      documents?: FirestoreRestDocument[];
      nextPageToken?: string;
    };

    for (const d of data.documents || []) {
      const docId = extractDocId(d.name);
      if (!docId) continue;
      ids.add(docId);
      const slug = readStringField(d.fields, 'slug').trim().toLowerCase();
      if (slug && !slugToId.has(slug)) {
        slugToId.set(slug, docId);
      }
      const createdAt = readStringField(d.fields, 'created_at').trim();
      if (createdAt) {
        createdAtById.set(docId, createdAt);
      }
    }

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return { ids, slugToId, createdAtById };
}

export function applyStatusMode(
  divisions: Division[],
  districts: District[],
  statusMode: ImportStatusMode
): { divisions: Division[]; districts: District[] } {
  if (statusMode === 'preserve') {
    return {
      divisions: divisions.map(d => ({ ...d })),
      districts: districts.map(d => ({ ...d }))
    };
  }
  const isPublished = statusMode === 'published';
  return {
    divisions: divisions.map(d => ({ ...d, is_published: isPublished })),
    districts: districts.map(d => ({ ...d, is_published: isPublished }))
  };
}

export async function inspectGeographyAgainstFirestore(
  divisions: Division[],
  districts: District[],
  bearerToken: string,
  statusMode: ImportStatusMode = 'preserve'
): Promise<GeographyInspectionResult> {
  const target = loadFirebaseProjectTarget();
  const adjusted = applyStatusMode(divisions, districts, statusMode);
  const report = validateBangladeshGeographyDataset(adjusted.divisions, adjusted.districts);

  const [divIndex, distIndex] = await Promise.all([
    listExistingCollectionDocs(target, 'divisions', bearerToken),
    listExistingCollectionDocs(target, 'districts', bearerToken)
  ]);

  const existingDivisionIds: string[] = [];
  const missingDivisionIds: string[] = [];
  const divisionSlugCollisions: Array<{ datasetId: string; existingDocId: string; slug: string }> = [];

  for (const div of adjusted.divisions) {
    if (divIndex.ids.has(div.id)) {
      existingDivisionIds.push(div.id);
    } else {
      const ownerDocId = divIndex.slugToId.get(div.slug.trim().toLowerCase());
      if (ownerDocId && ownerDocId !== div.id) {
        divisionSlugCollisions.push({ datasetId: div.id, existingDocId: ownerDocId, slug: div.slug });
      } else {
        missingDivisionIds.push(div.id);
      }
    }
  }

  const existingDistrictIds: string[] = [];
  const missingDistrictIds: string[] = [];
  const districtSlugCollisions: Array<{ datasetId: string; existingDocId: string; slug: string }> = [];

  for (const dist of adjusted.districts) {
    if (distIndex.ids.has(dist.id)) {
      existingDistrictIds.push(dist.id);
    } else {
      const ownerDocId = distIndex.slugToId.get(dist.slug.trim().toLowerCase());
      if (ownerDocId && ownerDocId !== dist.id) {
        districtSlugCollisions.push({ datasetId: dist.id, existingDocId: ownerDocId, slug: dist.slug });
      } else {
        missingDistrictIds.push(dist.id);
      }
    }
  }

  return {
    report,
    target,
    firestoreDiff: {
      existingDivisionsCount: divIndex.ids.size,
      existingDistrictsCount: distIndex.ids.size,
      existingDivisionIds,
      missingDivisionIds,
      existingDistrictIds,
      missingDistrictIds,
      divisionSlugCollisions,
      districtSlugCollisions,
      readyToImport:
        report.valid && divisionSlugCollisions.length === 0 && districtSlugCollisions.length === 0
    }
  };
}

interface FirestoreCommitWrite {
  update: {
    name: string;
    fields: Record<string, FirestoreRestValue>;
  };
  currentDocument?: {
    exists: boolean;
  };
}

async function commitFirestoreWrites(
  target: FirebaseProjectTarget,
  writes: FirestoreCommitWrite[],
  bearerToken: string
): Promise<void> {
  if (writes.length === 0) return;
  const baseUrl = getFirestoreBaseUrl(target);

  for (let i = 0; i < writes.length; i += 300) {
    const chunk = writes.slice(i, i + 300);
    const resp = await fetch(`${baseUrl}/documents:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ writes: chunk }),
      signal: AbortSignal.timeout(20000)
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`Firestore batch commit failed (${resp.status}): ${errText.slice(0, 320)}`);
    }
  }
}

export async function executeGeographyImport(params: {
  divisions: Division[];
  districts: District[];
  bearerToken: string;
  confirmImport: boolean;
  confirmOverwrite?: boolean;
  statusMode?: ImportStatusMode;
}): Promise<GeographyImportExecutionResult> {
  const {
    divisions,
    districts,
    bearerToken,
    confirmImport,
    confirmOverwrite = false,
    statusMode = 'preserve'
  } = params;

  if (!confirmImport) {
    throw new Error('Import confirmation is required before writing to Firestore.');
  }

  const target = loadFirebaseProjectTarget();
  const adjusted = applyStatusMode(divisions, districts, statusMode);
  const report = validateBangladeshGeographyDataset(adjusted.divisions, adjusted.districts);
  if (!report.valid) {
    throw new Error(
      `Geography dataset failed pre-import validation (${report.errors.length} error(s)): ${report.errors[0]}`
    );
  }

  const [divIndex, distIndex] = await Promise.all([
    listExistingCollectionDocs(target, 'divisions', bearerToken),
    listExistingCollectionDocs(target, 'districts', bearerToken)
  ]);

  const now = new Date().toISOString();
  const docRoot = `projects/${target.projectId}/databases/${target.firestoreDatabaseId || '(default)'}/documents`;
  const writes: FirestoreCommitWrite[] = [];
  const slugCollisions: GeographyImportExecutionResult['slugCollisions'] = [];

  let createdDivisions = 0;
  let overwrittenDivisions = 0;
  let skippedExistingDivisions = 0;

  for (const div of adjusted.divisions) {
    const existsById = divIndex.ids.has(div.id);
    const slugOwnerId = divIndex.slugToId.get(div.slug.trim().toLowerCase());

    if (!existsById && slugOwnerId && slugOwnerId !== div.id) {
      slugCollisions.push({
        collection: 'divisions',
        datasetId: div.id,
        existingDocId: slugOwnerId,
        slug: div.slug
      });
      skippedExistingDivisions += 1;
      continue;
    }

    if (existsById && !confirmOverwrite) {
      skippedExistingDivisions += 1;
      continue;
    }

    const payload: Record<string, unknown> = {
      ...div,
      created_at: (existsById ? divIndex.createdAtById.get(div.id) : undefined) || div.created_at || now,
      updated_at: now
    };

    const write: FirestoreCommitWrite = {
      update: {
        name: `${docRoot}/divisions/${div.id}`,
        fields: toFirestoreFields(payload)
      }
    };

    if (!existsById) {
      // Server-side atomic duplicate prevention guard
      write.currentDocument = { exists: false };
      createdDivisions += 1;
    } else {
      overwrittenDivisions += 1;
    }

    writes.push(write);
  }

  let createdDistricts = 0;
  let overwrittenDistricts = 0;
  let skippedExistingDistricts = 0;

  for (const dist of adjusted.districts) {
    const existsById = distIndex.ids.has(dist.id);
    const slugOwnerId = distIndex.slugToId.get(dist.slug.trim().toLowerCase());

    if (!existsById && slugOwnerId && slugOwnerId !== dist.id) {
      slugCollisions.push({
        collection: 'districts',
        datasetId: dist.id,
        existingDocId: slugOwnerId,
        slug: dist.slug
      });
      skippedExistingDistricts += 1;
      continue;
    }

    if (existsById && !confirmOverwrite) {
      skippedExistingDistricts += 1;
      continue;
    }

    const payload: Record<string, unknown> = {
      ...dist,
      created_at: (existsById ? distIndex.createdAtById.get(dist.id) : undefined) || dist.created_at || now,
      updated_at: now
    };

    const write: FirestoreCommitWrite = {
      update: {
        name: `${docRoot}/districts/${dist.id}`,
        fields: toFirestoreFields(payload)
      }
    };

    if (!existsById) {
      // Server-side atomic duplicate prevention guard
      write.currentDocument = { exists: false };
      createdDistricts += 1;
    } else {
      overwrittenDistricts += 1;
    }

    writes.push(write);
  }

  await commitFirestoreWrites(target, writes, bearerToken);

  return {
    success: true,
    target,
    statusMode,
    confirmOverwrite,
    report,
    createdDivisions,
    createdDistricts,
    overwrittenDivisions,
    overwrittenDistricts,
    skippedExistingDivisions,
    skippedExistingDistricts,
    slugCollisions,
    importedAt: now
  };
}
