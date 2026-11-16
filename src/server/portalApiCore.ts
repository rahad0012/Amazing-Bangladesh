import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DISTRICTS, DIVISIONS } from '../data/bangladeshData.ts';
import {
  executeGeographyImport,
  inspectGeographyAgainstFirestore,
  type ImportStatusMode
} from './firestoreAdminRest.ts';

export interface PublicFirebaseServerConfig {
  projectId: string;
  firestoreDatabaseId: string;
}

export interface ApiRequestInput {
  method: string;
  path: string;
  query: Record<string, string | undefined>;
  headers: Record<string, string | undefined>;
  body: unknown;
  clientIp: string;
  fallbackFirebaseConfig?: Partial<PublicFirebaseServerConfig>;
}

export interface ApiResponseOutput {
  status: number;
  headers?: Record<string, string>;
  body: Record<string, unknown>;
}

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  lang?: unknown;
  website?: unknown;
}

interface StoredContactRecord {
  referenceId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  lang: 'bn' | 'en';
  receivedAt: string;
  deliveryMode: 'webhook' | 'email-api' | 'recorded';
}

interface VerifiedFirebaseTokenPayload {
  aud: string;
  iss: string;
  sub: string;
  exp: number;
  iat: number;
  auth_time: number;
  email?: string;
  email_verified?: boolean;
  admin?: unknown;
  isAdmin?: unknown;
  role?: unknown;
  [key: string]: unknown;
}

class TokenVerificationError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const ADMIN_VERIFY_MAX_REQUESTS = 120;
const MAX_RATE_LIMIT_KEYS = 2000;

const rateLimitMap = new Map<string, number[]>();
const adminRateLimitMap = new Map<string, number[]>();
const recentContactQueue: StoredContactRecord[] = [];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const GOOGLE_SECURE_TOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

const BOOTSTRAPPED_ADMIN_EMAILS = new Set<string>([
  'mdrahad0529@gmail.com',
  'bluesky90987@gmail.com',
  ...(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
]);

let cachedGoogleCerts: { certs: Record<string, string>; expiresAt: number } = {
  certs: {},
  expiresAt: 0
};

const NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache'
};

export function loadPublicFirebaseConfig(
  fallback?: Partial<PublicFirebaseServerConfig>
): PublicFirebaseServerConfig {
  let projectId = (process.env.VITE_FIREBASE_PROJECT_ID || fallback?.projectId || '').trim();
  let firestoreDatabaseId = (fallback?.firestoreDatabaseId || '(default)').trim() || '(default)';

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
    console.warn('[auth] Could not parse firebase-applet-config.json:', err instanceof Error ? err.message : err);
  }

  return { projectId, firestoreDatabaseId };
}

async function getGooglePublicCerts(forceRefresh: boolean = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && Object.keys(cachedGoogleCerts.certs).length > 0 && now < cachedGoogleCerts.expiresAt) {
    return cachedGoogleCerts.certs;
  }

  const resp = await fetch(GOOGLE_SECURE_TOKEN_CERTS_URL, {
    method: 'GET',
    signal: AbortSignal.timeout(8000)
  });

  if (!resp.ok) {
    throw new Error(`Unable to fetch Google public certificates (${resp.status})`);
  }

  const certs = (await resp.json()) as Record<string, string>;
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Math.max(60, parseInt(maxAgeMatch[1], 10)) : 3600;

  cachedGoogleCerts = {
    certs,
    expiresAt: now + maxAgeSeconds * 1000
  };
  return certs;
}

async function verifyFirebaseIdToken(
  idToken: string,
  config: PublicFirebaseServerConfig
): Promise<VerifiedFirebaseTokenPayload> {
  if (!config.projectId) {
    throw new TokenVerificationError(500, 'SERVER_MISCONFIGURED', 'Firebase project ID is not configured.');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Malformed authentication token.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header: { alg?: string; kid?: string };
  let payload: VerifiedFirebaseTokenPayload;

  try {
    header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Unable to decode authentication token.');
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Unsupported token algorithm or key ID.');
  }

  let certs = await getGooglePublicCerts(false);
  let certPem = certs[header.kid];
  if (!certPem) {
    certs = await getGooglePublicCerts(true);
    certPem = certs[header.kid];
  }
  if (!certPem) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Unrecognized token signing certificate.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const signatureValid = verifier.verify(certPem, Buffer.from(encodedSignature, 'base64url'));
  if (!signatureValid) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Invalid token signature.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${config.projectId}`;

  if (payload.aud !== config.projectId || payload.iss !== expectedIssuer) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Token audience or issuer mismatch.');
  }

  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Token subject is invalid.');
  }

  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new TokenVerificationError(401, 'SESSION_EXPIRED', 'Your administrator session has expired. Please sign in again.');
  }

  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 60) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Token issued-at timestamp is invalid.');
  }

  if (typeof payload.auth_time !== 'number' || payload.auth_time > nowSec + 60) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Token authentication timestamp is invalid.');
  }

  return payload;
}

async function checkFirestoreAdminDocument(
  uid: string,
  idToken: string,
  config: PublicFirebaseServerConfig
): Promise<boolean> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) return false;

  const projectId = encodeURIComponent(config.projectId);
  const databaseId = encodeURIComponent(config.firestoreDatabaseId || '(default)');
  const docId = encodeURIComponent(uid);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/admins/${docId}`;

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!resp.ok) {
      return false;
    }

    const docData = (await resp.json()) as {
      fields?: {
        role?: { stringValue?: string };
      };
    };

    const role = (docData.fields?.role?.stringValue || 'admin').toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'editor';
  } catch {
    return false;
  }
}

async function resolveAdminAuthorization(
  idToken: string,
  payload: VerifiedFirebaseTokenPayload,
  config: PublicFirebaseServerConfig
): Promise<{ authorized: true; authSource: 'custom_claim' | 'firestore_admin_doc' | 'verified_admin_email' } | { authorized: false }> {
  if (
    payload.admin === true ||
    payload.isAdmin === true ||
    payload.role === 'admin' ||
    payload.role === 'super_admin'
  ) {
    return { authorized: true, authSource: 'custom_claim' };
  }

  const hasFirestoreDoc = await checkFirestoreAdminDocument(payload.sub, idToken, config);
  if (hasFirestoreDoc) {
    return { authorized: true, authSource: 'firestore_admin_doc' };
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (email && payload.email_verified === true && BOOTSTRAPPED_ADMIN_EMAILS.has(email)) {
    return { authorized: true, authSource: 'verified_admin_email' };
  }

  return { authorized: false };
}

function pruneRateLimitStore(store: Map<string, number[]>, now: number): void {
  for (const [key, timestamps] of store.entries()) {
    const active = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    if (active.length === 0) {
      store.delete(key);
    } else if (active.length !== timestamps.length) {
      store.set(key, active);
    }
  }
  if (store.size > MAX_RATE_LIMIT_KEYS) {
    const excess = store.size - MAX_RATE_LIMIT_KEYS;
    let removed = 0;
    for (const key of store.keys()) {
      store.delete(key);
      removed += 1;
      if (removed >= excess) break;
    }
  }
}

function isRateLimited(
  ip: string,
  store: Map<string, number[]> = rateLimitMap,
  max: number = RATE_LIMIT_MAX_REQUESTS
): boolean {
  const now = Date.now();
  if (store.size > 500) {
    pruneRateLimitStore(store, now);
  }
  const history = (store.get(ip) || []).filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (history.length >= max) {
    store.set(ip, history);
    return true;
  }
  history.push(now);
  store.set(ip, history);
  return false;
}

function generateReferenceId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BDM-${datePart}-${randomPart}`;
}

function sanitizeText(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
    : '';
}

async function forwardContactSubmission(record: StoredContactRecord): Promise<'webhook' | 'email-api' | 'recorded'> {
  const webhookUrl = (process.env.CONTACT_WEBHOOK_URL || '').trim();
  if (webhookUrl) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(webhookUrl);
    } catch {
      throw new Error('Configured CONTACT_WEBHOOK_URL is invalid.');
    }
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error('Configured CONTACT_WEBHOOK_URL must use http or https.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'BeautifulBangladeshPortal/1.0'
    };
    const token = (process.env.CONTACT_WEBHOOK_TOKEN || '').trim();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const resp = await fetch(parsedUrl.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: 'beautiful-bangladesh-portal',
        ...record
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!resp.ok) {
      throw new Error(`Upstream webhook responded with status ${resp.status}`);
    }
    return 'webhook';
  }

  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const recipientEmail = (process.env.CONTACT_RECIPIENT_EMAIL || '').trim();
  if (resendApiKey && recipientEmail) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || 'Beautiful Bangladesh <onboarding@resend.dev>',
        to: [recipientEmail],
        reply_to: record.email,
        subject: `[Portal Contact ${record.referenceId}] ${record.subject}`,
        text: [
          `Reference ID: ${record.referenceId}`,
          `Submitted At: ${record.receivedAt}`,
          `Language: ${record.lang}`,
          `Name: ${record.name}`,
          `Email: ${record.email}`,
          `Subject: ${record.subject}`,
          '',
          record.message
        ].join('\n')
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!resp.ok) {
      throw new Error(`Email service responded with status ${resp.status}`);
    }
    return 'email-api';
  }

  return 'recorded';
}

function getHeader(headers: Record<string, string | undefined>, name: string): string {
  const target = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === target && typeof v === 'string') {
      return v;
    }
  }
  return '';
}

function extractBearerToken(headers: Record<string, string | undefined>): string {
  const authHeader = getHeader(headers, 'authorization');
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return tokenMatch?.[1]?.trim() || '';
}

export async function handleApiRequest(input: ApiRequestInput): Promise<ApiResponseOutput> {
  const method = input.method.toUpperCase();
  const pathNormalized = input.path.replace(/\/+$/, '') || '/';
  const config = loadPublicFirebaseConfig(input.fallbackFirebaseConfig);

  if (method === 'GET' && pathNormalized === '/api/health') {
    return {
      status: 200,
      body: { ok: true, service: 'beautiful-bangladesh-portal' }
    };
  }

  if (method === 'POST' && pathNormalized === '/api/admin/verify') {
    if (isRateLimited(input.clientIp, adminRateLimitMap, ADMIN_VERIFY_MAX_REQUESTS)) {
      return {
        status: 429,
        headers: NO_STORE_HEADERS,
        body: {
          authorized: false,
          code: 'RATE_LIMITED',
          message: 'Too many authentication verification requests. Please wait a moment and try again.'
        }
      };
    }

    const idToken = extractBearerToken(input.headers);
    if (!idToken) {
      return {
        status: 401,
        headers: NO_STORE_HEADERS,
        body: {
          authorized: false,
          code: 'UNAUTHENTICATED',
          message: 'Missing administrator authentication token.'
        }
      };
    }

    try {
      const payload = await verifyFirebaseIdToken(idToken, config);
      const authResult = await resolveAdminAuthorization(idToken, payload, config);

      if (!authResult.authorized) {
        return {
          status: 403,
          headers: NO_STORE_HEADERS,
          body: {
            authorized: false,
            code: 'NOT_AUTHORIZED',
            message: 'Access denied. This account does not have administrator privileges.'
          }
        };
      }

      return {
        status: 200,
        headers: NO_STORE_HEADERS,
        body: {
          authorized: true,
          uid: payload.sub,
          email: typeof payload.email === 'string' ? payload.email : null,
          emailVerified: payload.email_verified === true,
          role: 'admin',
          authSource: authResult.authSource,
          expiresAt: payload.exp * 1000,
          verifiedAt: Date.now()
        }
      };
    } catch (err) {
      if (err instanceof TokenVerificationError) {
        return {
          status: err.status,
          headers: NO_STORE_HEADERS,
          body: {
            authorized: false,
            code: err.code,
            message: err.message
          }
        };
      }
      console.error('[admin-verify] Unexpected verification failure:', err instanceof Error ? err.message : err);
      return {
        status: 503,
        headers: NO_STORE_HEADERS,
        body: {
          authorized: false,
          code: 'VERIFICATION_UNAVAILABLE',
          message: 'Unable to verify administrator credentials right now. Please try again.'
        }
      };
    }
  }

  if (method === 'POST' && pathNormalized === '/api/admin/logout') {
    return {
      status: 200,
      headers: NO_STORE_HEADERS,
      body: { success: true }
    };
  }

  if (method === 'GET' && pathNormalized === '/api/admin/geography/report') {
    if (isRateLimited(input.clientIp, adminRateLimitMap, ADMIN_VERIFY_MAX_REQUESTS)) {
      return {
        status: 429,
        headers: NO_STORE_HEADERS,
        body: {
          success: false,
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a moment and try again.'
        }
      };
    }

    const idToken = extractBearerToken(input.headers);
    if (!idToken) {
      return {
        status: 401,
        headers: NO_STORE_HEADERS,
        body: {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Missing administrator authentication token.'
        }
      };
    }

    try {
      const payload = await verifyFirebaseIdToken(idToken, config);
      const authResult = await resolveAdminAuthorization(idToken, payload, config);
      if (!authResult.authorized) {
        return {
          status: 403,
          headers: NO_STORE_HEADERS,
          body: {
            success: false,
            code: 'NOT_AUTHORIZED',
            message: 'Access denied. Administrator privileges are required.'
          }
        };
      }

      const rawStatus = (input.query.status || 'preserve').trim().toLowerCase();
      const statusMode: ImportStatusMode =
        rawStatus === 'published' || rawStatus === 'draft' ? rawStatus : 'preserve';

      const inspection = await inspectGeographyAgainstFirestore(
        DIVISIONS,
        DISTRICTS,
        idToken,
        statusMode,
        config
      );
      return {
        status: 200,
        headers: NO_STORE_HEADERS,
        body: {
          success: true,
          ...inspection
        }
      };
    } catch (err) {
      if (err instanceof TokenVerificationError) {
        return {
          status: err.status,
          headers: NO_STORE_HEADERS,
          body: { success: false, code: err.code, message: err.message }
        };
      }
      console.error('[geography-report] Failed:', err instanceof Error ? err.message : err);
      return {
        status: 502,
        headers: NO_STORE_HEADERS,
        body: {
          success: false,
          code: 'GEOGRAPHY_REPORT_FAILED',
          message: err instanceof Error ? err.message : 'Unable to generate geography validation report.'
        }
      };
    }
  }

  if (method === 'POST' && pathNormalized === '/api/admin/geography/import') {
    if (isRateLimited(input.clientIp, adminRateLimitMap, ADMIN_VERIFY_MAX_REQUESTS)) {
      return {
        status: 429,
        headers: NO_STORE_HEADERS,
        body: {
          success: false,
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a moment and try again.'
        }
      };
    }

    const idToken = extractBearerToken(input.headers);
    if (!idToken) {
      return {
        status: 401,
        headers: NO_STORE_HEADERS,
        body: {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Missing administrator authentication token.'
        }
      };
    }

    try {
      const payload = await verifyFirebaseIdToken(idToken, config);
      const authResult = await resolveAdminAuthorization(idToken, payload, config);
      if (!authResult.authorized) {
        return {
          status: 403,
          headers: NO_STORE_HEADERS,
          body: {
            success: false,
            code: 'NOT_AUTHORIZED',
            message: 'Access denied. Administrator privileges are required.'
          }
        };
      }

      const body = (input.body || {}) as {
        confirmImport?: unknown;
        confirmOverwrite?: unknown;
        statusMode?: unknown;
      };

      if (body.confirmImport !== true) {
        return {
          status: 400,
          headers: NO_STORE_HEADERS,
          body: {
            success: false,
            code: 'CONFIRMATION_REQUIRED',
            message: 'Explicit confirmation (confirmImport: true) is required after reviewing the validation report.'
          }
        };
      }

      const statusMode: ImportStatusMode =
        body.statusMode === 'published' || body.statusMode === 'draft' ? body.statusMode : 'preserve';
      const confirmOverwrite = body.confirmOverwrite === true;

      const result = await executeGeographyImport({
        divisions: DIVISIONS,
        districts: DISTRICTS,
        bearerToken: idToken,
        confirmImport: true,
        confirmOverwrite,
        statusMode,
        targetOverride: config
      });

      console.info(
        `[geography-import] actor=${payload.email || payload.sub} createdDiv=${result.createdDivisions} createdDist=${result.createdDistricts} overwrittenDiv=${result.overwrittenDivisions} overwrittenDist=${result.overwrittenDistricts}`
      );

      return {
        status: 200,
        headers: NO_STORE_HEADERS,
        body: result as unknown as Record<string, unknown>
      };
    } catch (err) {
      if (err instanceof TokenVerificationError) {
        return {
          status: err.status,
          headers: NO_STORE_HEADERS,
          body: { success: false, code: err.code, message: err.message }
        };
      }
      console.error('[geography-import] Failed:', err instanceof Error ? err.message : err);
      return {
        status: 502,
        headers: NO_STORE_HEADERS,
        body: {
          success: false,
          code: 'GEOGRAPHY_IMPORT_FAILED',
          message: err instanceof Error ? err.message : 'Unable to execute geography import.'
        }
      };
    }
  }

  if (method === 'POST' && pathNormalized === '/api/contact') {
    const body = (input.body || {}) as ContactPayload;
    const lang: 'bn' | 'en' = body.lang === 'en' ? 'en' : 'bn';
    const isBn = lang === 'bn';

    const honeypot = sanitizeText(body.website);
    if (honeypot) {
      return {
        status: 200,
        body: {
          success: true,
          referenceId: generateReferenceId(),
          receivedAt: new Date().toISOString(),
          message: isBn
            ? 'আপনার বার্তাটি গ্রহণ করা হয়েছে।'
            : 'Your message has been received.'
        }
      };
    }

    if (isRateLimited(input.clientIp)) {
      return {
        status: 429,
        body: {
          success: false,
          code: 'RATE_LIMITED',
          message: isBn
            ? 'অল্প সময়ে অনেকগুলো অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
            : 'Too many requests from your connection. Please wait a few minutes before submitting again.'
        }
      };
    }

    const name = sanitizeText(body.name);
    const email = sanitizeText(body.email).toLowerCase();
    const subject = sanitizeText(body.subject);
    const message = sanitizeText(body.message);

    const fieldErrors: Record<string, string> = {};

    if (name.length < 2 || name.length > 120) {
      fieldErrors.name = isBn
        ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (২ থেকে ১২০ অক্ষরের মধ্যে)।'
        : 'Please provide your name (between 2 and 120 characters).';
    }

    if (!email || email.length > 180 || !EMAIL_REGEX.test(email)) {
      fieldErrors.email = isBn
        ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।'
        : 'Please enter a valid email address.';
    }

    if (subject.length < 3 || subject.length > 180) {
      fieldErrors.subject = isBn
        ? 'অনুগ্রহ করে বার্তার বিষয় লিখুন (কমপক্ষে ৩ অক্ষর)।'
        : 'Please enter a subject (at least 3 characters).';
    }

    if (message.length < 10 || message.length > 4000) {
      fieldErrors.message = isBn
        ? 'অনুগ্রহ করে বিস্তারিত বার্তা লিখুন (১০ থেকে ৪০০০ অক্ষরের মধ্যে)।'
        : 'Please enter your message (between 10 and 4000 characters).';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        status: 400,
        body: {
          success: false,
          code: 'VALIDATION_ERROR',
          fieldErrors,
          message: isBn
            ? 'অনুগ্রহ করে ফর্মের সকল তথ্য সঠিকভাবে পূরণ করুন।'
            : 'Please check the highlighted form fields and try again.'
        }
      };
    }

    const referenceId = generateReferenceId();
    const receivedAt = new Date().toISOString();

    const record: StoredContactRecord = {
      referenceId,
      name,
      email,
      subject,
      message,
      lang,
      receivedAt,
      deliveryMode: 'recorded'
    };

    try {
      const deliveryMode = await forwardContactSubmission(record);
      record.deliveryMode = deliveryMode;
      recentContactQueue.push(record);
      if (recentContactQueue.length > 200) {
        recentContactQueue.shift();
      }

      console.info(
        `[contact] Accepted ${referenceId} (${deliveryMode}) subject="${subject.slice(0, 60)}"`
      );

      return {
        status: 200,
        body: {
          success: true,
          referenceId,
          receivedAt,
          deliveryMode,
          message: isBn
            ? 'আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। আমাদের টিম পর্যালোচনা করে শীঘ্রই যোগাযোগ করবে।'
            : 'Your message has been sent successfully. Our editorial team will review it and reply shortly.'
        }
      };
    } catch (err) {
      console.error('[contact] Delivery failure:', err instanceof Error ? err.message : err);
      return {
        status: 502,
        body: {
          success: false,
          code: 'DELIVERY_FAILED',
          message: isBn
            ? 'সার্ভারের মাধ্যমে বার্তা পাঠাতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
            : 'We could not deliver your message right now due to a server relay issue. Please try again shortly.'
        }
      };
    }
  }

  return {
    status: 404,
    body: { success: false, message: 'API route not found' }
  };
}
