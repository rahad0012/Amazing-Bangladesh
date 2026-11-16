/**
 * Shared Firestore Base Utilities, Caching, Bilingual Retrieval, Error Handling & Pagination
 * Uses only the lightweight Firestore instance from ../config/firebaseDb.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type OrderByDirection,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type WhereFilterOp
} from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import type { Language } from '../utils/langUtils';

export const COLLECTIONS = {
  DIVISIONS: 'divisions',
  DISTRICTS: 'districts',
  CATEGORIES: 'categories',
  TOURIST_SPOTS: 'tourist_spots',
  ARTICLES: 'articles',
  ADMINS: 'admins',
  SITE_SETTINGS: 'site_settings',
  MEDIA: 'media',
  ADMIN_AUDIT_LOGS: 'admin_audit_logs',
  NEWSLETTER_SUBSCRIBERS: 'newsletter_subscribers'
} as const;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface AuthInfoSnapshot {
  userId?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  isAnonymous?: boolean | null;
  tenantId?: string | null;
  providerInfo?: {
    providerId?: string | null;
    email?: string | null;
  }[];
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: AuthInfoSnapshot;
}

type AuthInfoProvider = () => AuthInfoSnapshot | undefined;
let registeredAuthInfoProvider: AuthInfoProvider | null = null;

export function registerAuthInfoProvider(provider: AuthInfoProvider): void {
  registeredAuthInfoProvider = provider;
}

export function isPermissionDeniedError(error: unknown): boolean {
  const code = typeof (error as { code?: unknown })?.code === 'string'
    ? (error as { code: string }).code
    : '';
  if (code === 'permission-denied') return true;
  if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
    return true;
  }
  return false;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: registeredAuthInfoProvider?.() || {}
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isValidDocId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
}

export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

/**
 * Bilingual content retrieval helper with automatic cross-language fallback.
 * Looks up `${baseField}_${lang}` first and falls back to the alternate language.
 */
export function getLocalizedField(
  record: Record<string, any> | null | undefined,
  baseField: string,
  lang: Language
): string {
  if (!record) return '';
  const primary = record[`${baseField}_${lang}`];
  if (typeof primary === 'string' && primary.trim().length > 0) {
    return primary;
  }
  const fallbackLang: Language = lang === 'bn' ? 'en' : 'bn';
  const fallback = record[`${baseField}_${fallbackLang}`];
  return typeof fallback === 'string' ? fallback : '';
}

// ============================================================================
// Read Cache & In-Flight Deduplication (Minimizes Firestore Read Quota Usage)
// ============================================================================

const DEFAULT_CACHE_TTL_MS = 120_000;
const readCache = new Map<string, { value: unknown; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export function invalidateFirestoreCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    readCache.clear();
    return;
  }
  for (const key of readCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      readCache.delete(key);
    }
  }
}

export async function cachedFirestoreFetch<R>(
  cacheKey: string,
  fetcher: () => Promise<R>,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): Promise<R> {
  const now = Date.now();
  const hit = readCache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return hit.value as R;
  }

  const existingFlight = inFlightRequests.get(cacheKey);
  if (existingFlight) {
    return existingFlight as Promise<R>;
  }

  const task = fetcher()
    .then(result => {
      readCache.set(cacheKey, {
        value: result,
        expiresAt: Date.now() + ttlMs
      });
      return result;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, task);
  return task;
}

// ============================================================================
// Generic CRUD & Cursor-Based Pagination Primitives
// ============================================================================

export interface WhereFilterClause {
  field: string;
  op: WhereFilterOp;
  value: unknown;
}

export interface PaginatedQueryOptions<T> {
  collectionName: string;
  filters?: WhereFilterClause[];
  orderByField?: string;
  orderDirection?: OrderByDirection;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
  /** Optional client-side predicate for substring/multi-field search over fetched page */
  clientFilter?: (item: T) => boolean;
}

export interface PaginatedQueryResult<T> {
  items: T[];
  nextCursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  pageSize: number;
}

export async function queryCollectionPaginated<T>(
  options: PaginatedQueryOptions<T>
): Promise<PaginatedQueryResult<T>> {
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 12, 100));
  const constraints: QueryConstraint[] = [];

  for (const f of options.filters || []) {
    constraints.push(where(f.field, f.op, f.value));
  }
  if (options.orderByField) {
    constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
  }
  if (options.cursor) {
    constraints.push(startAfter(options.cursor));
  }
  // Fetch pageSize + 1 to detect whether another page exists without an extra count() query
  constraints.push(limit(pageSize + 1));

  try {
    const q = query(collection(db, options.collectionName), ...constraints);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

    let items = pageDocs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as T));
    if (options.clientFilter) {
      items = items.filter(options.clientFilter);
    }

    return {
      items,
      nextCursor: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
      hasMore,
      pageSize
    };
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.LIST, options.collectionName);
    }
    throw error;
  }
}

export async function listCollectionDocs<T>(
  collectionName: string,
  options?: {
    publishedOnly?: boolean;
    filters?: WhereFilterClause[];
    cacheKey?: string;
    bypassCache?: boolean;
  }
): Promise<T[]> {
  const publishedOnly = options?.publishedOnly ?? false;
  const cacheKey =
    options?.cacheKey ||
    `col:${collectionName}:${publishedOnly ? 'pub' : 'all'}:${JSON.stringify(options?.filters || [])}`;

  const runQuery = async (): Promise<T[]> => {
    try {
      const constraints: QueryConstraint[] = [];
      if (publishedOnly) {
        constraints.push(where('is_published', '==', true));
      }
      for (const f of options?.filters || []) {
        constraints.push(where(f.field, f.op, f.value));
      }
      const q = query(collection(db, collectionName), ...constraints);
      const snapshot = await getDocs(q);
      const items: T[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as T);
      });
      return items;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      }
      throw error;
    }
  };

  if (options?.bypassCache) {
    return runQuery();
  }
  return cachedFirestoreFetch<T[]>(cacheKey, runQuery);
}

export async function getCollectionDocById<T>(
  collectionName: string,
  id: string,
  options?: { cacheKey?: string; bypassCache?: boolean }
): Promise<T | null> {
  if (!isValidDocId(id)) return null;

  const cacheKey = options?.cacheKey || `doc:${collectionName}:${id}`;
  const fetcher = async (): Promise<T | null> => {
    try {
      const docSnap = await getDoc(doc(db, collectionName, id));
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.GET, `${collectionName}/${id}`);
      }
      throw error;
    }
  };

  if (options?.bypassCache) {
    return fetcher();
  }
  return cachedFirestoreFetch<T | null>(cacheKey, fetcher);
}

export async function createCollectionDoc<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<T> {
  if (!isValidDocId(data.id)) {
    throw new Error(`Invalid document ID for ${collectionName}: "${data.id}"`);
  }
  const now = new Date().toISOString();
  const payload = stripUndefined({
    ...data,
    created_at: (data as Record<string, any>).created_at || now,
    updated_at: now
  }) as T;

  try {
    await setDoc(doc(db, collectionName, data.id), payload);
    invalidateFirestoreCache(`col:${collectionName}`);
    invalidateFirestoreCache(`doc:${collectionName}:${data.id}`);
    return payload;
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.CREATE, `${collectionName}/${data.id}`);
    }
    throw error;
  }
}

export async function updateCollectionDoc<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  updates: Partial<T>
): Promise<void> {
  if (!isValidDocId(id)) {
    throw new Error(`Invalid document ID for ${collectionName}: "${id}"`);
  }
  const payload = stripUndefined({
    ...updates,
    updated_at: new Date().toISOString()
  });

  try {
    await updateDoc(doc(db, collectionName, id), payload as DocumentData);
    invalidateFirestoreCache(`col:${collectionName}`);
    invalidateFirestoreCache(`doc:${collectionName}:${id}`);
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
    throw error;
  }
}

export async function upsertCollectionDoc<T extends { id: string }>(
  collectionName: string,
  data: T,
  merge: boolean = true
): Promise<T> {
  if (!isValidDocId(data.id)) {
    throw new Error(`Invalid document ID for ${collectionName}: "${data.id}"`);
  }
  const now = new Date().toISOString();
  const payload = stripUndefined({
    ...data,
    created_at: (data as Record<string, any>).created_at || now,
    updated_at: now
  }) as T;

  try {
    await setDoc(doc(db, collectionName, data.id), payload, { merge });
    invalidateFirestoreCache(`col:${collectionName}`);
    invalidateFirestoreCache(`doc:${collectionName}:${data.id}`);
    return payload;
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${data.id}`);
    }
    throw error;
  }
}

export async function deleteCollectionDoc(collectionName: string, id: string): Promise<void> {
  if (!isValidDocId(id)) {
    throw new Error(`Invalid document ID for ${collectionName}: "${id}"`);
  }
  try {
    await deleteDoc(doc(db, collectionName, id));
    invalidateFirestoreCache(`col:${collectionName}`);
    invalidateFirestoreCache(`doc:${collectionName}:${id}`);
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
    throw error;
  }
}
