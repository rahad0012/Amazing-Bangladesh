/**
 * Divisions Collection Service (divisions)
 * Full CRUD, slug/ID lookup, pagination, filtering, and bilingual localization.
 */

import { collection, getDocs, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import type { Division } from '../data/bangladeshData';
import type { Language } from '../utils/langUtils';
import {
  COLLECTIONS,
  OperationType,
  createCollectionDoc,
  deleteCollectionDoc,
  getCollectionDocById,
  getLocalizedField,
  handleFirestoreError,
  invalidateFirestoreCache,
  isPermissionDeniedError,
  listCollectionDocs,
  queryCollectionPaginated,
  updateCollectionDoc,
  upsertCollectionDoc,
  type PaginatedQueryResult
} from './firestoreBase';

export const CANONICAL_DIVISION_ORDER = [
  'dhaka',
  'chattogram',
  'rajshahi',
  'khulna',
  'barishal',
  'sylhet',
  'rangpur',
  'mymensingh'
] as const;

export interface LocalizedDivision extends Division {
  localized_name: string;
  localized_description: string;
  localized_headquarters: string;
}

export interface DivisionsQueryOptions {
  publishedOnly?: boolean;
  searchQuery?: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
  lang?: Language;
}

export function normalizeFirestoreDivisions(items: Division[]): Division[] {
  const seen = new Set<string>();
  const unique: Division[] = [];

  for (const div of items) {
    const key = (div.slug || div.id || div.name_en || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(div);
  }

  return unique.sort((a, b) => {
    const keyA = (a.slug || a.id || a.name_en || '').toLowerCase();
    const keyB = (b.slug || b.id || b.name_en || '').toLowerCase();
    const idxA = CANONICAL_DIVISION_ORDER.indexOf(keyA as any);
    const idxB = CANONICAL_DIVISION_ORDER.indexOf(keyB as any);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a.order ?? 99) - (b.order ?? 99);
  });
}

export function localizeDivision(division: Division, lang: Language): LocalizedDivision {
  return {
    ...division,
    localized_name: getLocalizedField(division, 'name', lang),
    localized_description: getLocalizedField(division, 'description', lang),
    localized_headquarters: getLocalizedField(division, 'headquarters', lang)
  };
}

export const DivisionsService = {
  async getAll(bypassCache: boolean = false): Promise<Division[]> {
    const items = await listCollectionDocs<Division>(COLLECTIONS.DIVISIONS, {
      publishedOnly: false,
      bypassCache
    });
    return normalizeFirestoreDivisions(items);
  },

  async getPublished(bypassCache: boolean = false): Promise<Division[]> {
    const items = await listCollectionDocs<Division>(COLLECTIONS.DIVISIONS, {
      publishedOnly: true,
      bypassCache
    });
    return normalizeFirestoreDivisions(items);
  },

  async getById(id: string): Promise<Division | null> {
    return getCollectionDocById<Division>(COLLECTIONS.DIVISIONS, id);
  },

  async getBySlug(slug: string): Promise<Division | null> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) return null;

    try {
      const colRef = collection(db, COLLECTIONS.DIVISIONS);
      const q = query(
        colRef,
        where('slug', '==', normalizedSlug),
        where('is_published', '==', true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Division;
      }

      const publishedDivisions = await DivisionsService.getPublished();
      return (
        publishedDivisions.find(
          div =>
            (div.slug && div.slug.trim().toLowerCase() === normalizedSlug) ||
            div.id.trim().toLowerCase() === normalizedSlug ||
            div.id.trim().toLowerCase() === normalizedSlug.replace(/-/g, '_')
        ) || null
      );
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.DIVISIONS);
      }
      throw error;
    }
  },

  async queryPaginated(options: DivisionsQueryOptions = {}): Promise<PaginatedQueryResult<Division>> {
    const filters = options.publishedOnly !== false
      ? [{ field: 'is_published', op: '==' as const, value: true }]
      : [];
    const qText = (options.searchQuery || '').trim().toLowerCase();

    return queryCollectionPaginated<Division>({
      collectionName: COLLECTIONS.DIVISIONS,
      filters,
      orderByField: 'order',
      orderDirection: 'asc',
      pageSize: options.pageSize ?? 12,
      cursor: options.cursor ?? null,
      clientFilter: qText
        ? (div) =>
            div.name_en.toLowerCase().includes(qText) ||
            div.name_bn.toLowerCase().includes(qText) ||
            (div.headquarters_en || '').toLowerCase().includes(qText) ||
            (div.slug || '').toLowerCase().includes(qText)
        : undefined
    });
  },

  async create(division: Division): Promise<Division> {
    return createCollectionDoc<Division>(COLLECTIONS.DIVISIONS, division);
  },

  async update(id: string, updates: Partial<Division>): Promise<void> {
    await updateCollectionDoc<Division>(COLLECTIONS.DIVISIONS, id, updates);
  },

  async save(division: Division): Promise<Division> {
    return upsertCollectionDoc<Division>(COLLECTIONS.DIVISIONS, division, true);
  },

  async remove(id: string): Promise<void> {
    await deleteCollectionDoc(COLLECTIONS.DIVISIONS, id);
    invalidateFirestoreCache(`col:${COLLECTIONS.DIVISIONS}`);
  },

  localize: localizeDivision
};
