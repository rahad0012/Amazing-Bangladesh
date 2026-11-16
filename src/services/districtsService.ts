/**
 * Districts Collection Service (districts)
 * Full CRUD, division filtering, cursor pagination, slug lookup, and bilingual localization.
 */

import { collection, getDocs, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import type { District } from '../data/bangladeshData';
import type { Language } from '../utils/langUtils';
import { CANONICAL_DIVISION_ORDER } from './divisionsService';
import {
  COLLECTIONS,
  OperationType,
  createCollectionDoc,
  deleteCollectionDoc,
  getCollectionDocById,
  getLocalizedField,
  handleFirestoreError,
  isPermissionDeniedError,
  listCollectionDocs,
  queryCollectionPaginated,
  updateCollectionDoc,
  upsertCollectionDoc,
  type PaginatedQueryResult,
  type WhereFilterClause
} from './firestoreBase';

export interface LocalizedDistrict extends District {
  localized_name: string;
  localized_description: string;
  localized_famous_for: string;
}

export interface DistrictsQueryOptions {
  divisionId?: string;
  publishedOnly?: boolean;
  searchQuery?: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
  lang?: Language;
}

export function normalizeDistrictAdministrativeDivision(districts: District[]): District[] {
  const seen = new Set<string>();
  return districts
    .filter(d => {
      const key = (d.id || d.slug || '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(d => {
      if ((d.id === 'jamalpur' || d.slug === 'jamalpur') && d.division_id === 'jamalpur') {
        return { ...d, division_id: 'mymensingh' };
      }
      return d;
    })
    .sort((a, b) => {
      const divIdxA = CANONICAL_DIVISION_ORDER.indexOf((a.division_id || '').toLowerCase() as any);
      const divIdxB = CANONICAL_DIVISION_ORDER.indexOf((b.division_id || '').toLowerCase() as any);
      const normA = divIdxA === -1 ? 99 : divIdxA;
      const normB = divIdxB === -1 ? 99 : divIdxB;
      if (normA !== normB) return normA - normB;
      return (a.name_en || '').localeCompare(b.name_en || '');
    });
}

export function localizeDistrict(district: District, lang: Language): LocalizedDistrict {
  return {
    ...district,
    localized_name: getLocalizedField(district, 'name', lang),
    localized_description: getLocalizedField(district, 'description', lang),
    localized_famous_for: getLocalizedField(district, 'famous_for', lang)
  };
}

export const DistrictsService = {
  async getAll(bypassCache: boolean = false): Promise<District[]> {
    const raw = await listCollectionDocs<District>(COLLECTIONS.DISTRICTS, {
      publishedOnly: false,
      bypassCache
    });
    return normalizeDistrictAdministrativeDivision(raw);
  },

  async getPublished(bypassCache: boolean = false): Promise<District[]> {
    const raw = await listCollectionDocs<District>(COLLECTIONS.DISTRICTS, {
      publishedOnly: true,
      bypassCache
    });
    return normalizeDistrictAdministrativeDivision(raw);
  },

  async getByDivision(divisionId: string, publishedOnly: boolean = true): Promise<District[]> {
    const cleanDiv = (divisionId || '').trim();
    if (!cleanDiv || cleanDiv === 'all') {
      return publishedOnly ? DistrictsService.getPublished() : DistrictsService.getAll();
    }
    const items = await listCollectionDocs<District>(COLLECTIONS.DISTRICTS, {
      publishedOnly,
      filters: [{ field: 'division_id', op: '==', value: cleanDiv }]
    });
    return normalizeDistrictAdministrativeDivision(items);
  },

  async getById(id: string): Promise<District | null> {
    return getCollectionDocById<District>(COLLECTIONS.DISTRICTS, id);
  },

  async getBySlug(slug: string): Promise<District | null> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) return null;

    try {
      const colRef = collection(db, COLLECTIONS.DISTRICTS);
      const q = query(
        colRef,
        where('slug', '==', normalizedSlug),
        where('is_published', '==', true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const normalized = normalizeDistrictAdministrativeDivision([
          { id: docSnap.id, ...docSnap.data() } as District
        ]);
        return normalized[0] || null;
      }

      const publishedDistricts = await DistrictsService.getPublished();
      const candidateKeys = new Set([
        normalizedSlug,
        `${normalizedSlug}_dist`,
        normalizedSlug.replace(/-/g, '_'),
        normalizedSlug.replace(/_/g, '-')
      ]);
      return (
        publishedDistricts.find(dist => {
          const distId = dist.id.trim().toLowerCase();
          const distSlug = (dist.slug || '').trim().toLowerCase();
          return candidateKeys.has(distId) || (!!distSlug && candidateKeys.has(distSlug));
        }) || null
      );
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.DISTRICTS);
      }
      throw error;
    }
  },

  async queryPaginated(options: DistrictsQueryOptions = {}): Promise<PaginatedQueryResult<District>> {
    const filters: WhereFilterClause[] = [];
    if (options.publishedOnly !== false) {
      filters.push({ field: 'is_published', op: '==', value: true });
    }
    if (options.divisionId && options.divisionId !== 'all') {
      filters.push({ field: 'division_id', op: '==', value: options.divisionId });
    }
    const qText = (options.searchQuery || '').trim().toLowerCase();

    return queryCollectionPaginated<District>({
      collectionName: COLLECTIONS.DISTRICTS,
      filters,
      orderByField: 'name_en',
      orderDirection: 'asc',
      pageSize: options.pageSize ?? 16,
      cursor: options.cursor ?? null,
      clientFilter: qText
        ? (dist) =>
            dist.name_en.toLowerCase().includes(qText) ||
            dist.name_bn.toLowerCase().includes(qText) ||
            (dist.famous_for_en || '').toLowerCase().includes(qText) ||
            (dist.famous_for_bn || '').toLowerCase().includes(qText) ||
            (dist.slug || '').toLowerCase().includes(qText)
        : undefined
    });
  },

  async create(district: District): Promise<District> {
    return createCollectionDoc<District>(COLLECTIONS.DISTRICTS, district);
  },

  async update(id: string, updates: Partial<District>): Promise<void> {
    await updateCollectionDoc<District>(COLLECTIONS.DISTRICTS, id, updates);
  },

  async save(district: District): Promise<District> {
    return upsertCollectionDoc<District>(COLLECTIONS.DISTRICTS, district, true);
  },

  async remove(id: string): Promise<void> {
    await deleteCollectionDoc(COLLECTIONS.DISTRICTS, id);
  },

  localize: localizeDistrict
};
