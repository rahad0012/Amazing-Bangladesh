/**
 * Tourist Spots Collection Service (tourist_spots)
 * Full CRUD, location/category filtering, cursor-based pagination, slug lookup, and bilingual localization.
 */

import { collection, getDocs, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import type { TouristSpot } from '../data/bangladeshData';
import type { Language } from '../utils/langUtils';
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

export const SPOT_SLUG_ALIASES: Record<string, string> = {
  'saint-martin': 'saint-martins-island',
  'st-martin': 'saint-martins-island',
  'lalbagh-fort': 'lalbagh-fort-ahsan-manzil',
  'ahsan-manzil': 'lalbagh-fort-ahsan-manzil',
  'coxs-bazar': 'coxs-bazar-sea-beach',
  sundarbans: 'sundarbans-mangrove-forest',
  kuakata: 'kuakata-sea-beach',
  ratargul: 'ratargul-swamp-forest',
  'tanguar-haor': 'tanguar-haor-shimul-bagan',
  birishiri: 'birishiri-ceramic-hills-someshwari',
  sreemangal: 'sreemangal-tea-lawachara',
  srimangal: 'sreemangal-tea-lawachara',
  madhabkunda: 'madhabkunda-waterfall',
  paharpur: 'somapura-mahavihara-paharpur',
  'somapura-mahavihara': 'somapura-mahavihara-paharpur',
  'sixty-dome-mosque': 'sixty-dome-mosque-bagerhat',
  'shat-gombuj': 'sixty-dome-mosque-bagerhat'
};

export interface LocalizedTouristSpot extends TouristSpot {
  localized_name: string;
  localized_short_desc: string;
  localized_overview: string;
  localized_history: string;
  localized_how_to_go: string;
  localized_best_time: string;
  localized_tips: string;
  localized_estimated_cost: string;
  localized_entry_fee: string;
  localized_opening_hours: string;
}

export interface TouristSpotsQueryOptions {
  divisionId?: string;
  districtId?: string;
  categoryId?: string;
  featuredOnly?: boolean;
  publishedOnly?: boolean;
  searchQuery?: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}

export function normalizePublishedSpots(spots: TouristSpot[]): TouristSpot[] {
  const seen = new Set<string>();
  const published = spots.filter(s => {
    if (s.is_published !== true) return false;
    const key = (s.id || s.slug || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return published.sort((a, b) => {
    const featDiff = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
    if (featDiff !== 0) return featDiff;
    const ratingA = typeof a.rating === 'number' && Number.isFinite(a.rating) ? a.rating : 0;
    const ratingB = typeof b.rating === 'number' && Number.isFinite(b.rating) ? b.rating : 0;
    if (ratingB !== ratingA) return ratingB - ratingA;
    return (a.name_en || '').localeCompare(b.name_en || '');
  });
}

export function localizeTouristSpot(spot: TouristSpot, lang: Language): LocalizedTouristSpot {
  return {
    ...spot,
    localized_name: getLocalizedField(spot, 'name', lang),
    localized_short_desc: getLocalizedField(spot, 'short_desc', lang),
    localized_overview: getLocalizedField(spot, 'overview', lang) || getLocalizedField(spot, 'short_desc', lang),
    localized_history: getLocalizedField(spot, 'history', lang),
    localized_how_to_go: getLocalizedField(spot, 'how_to_go', lang),
    localized_best_time: getLocalizedField(spot, 'best_time', lang),
    localized_tips: getLocalizedField(spot, 'tips', lang),
    localized_estimated_cost: getLocalizedField(spot, 'estimated_cost', lang),
    localized_entry_fee: getLocalizedField(spot, 'entry_fee', lang),
    localized_opening_hours: getLocalizedField(spot, 'opening_hours', lang)
  };
}

export const TouristSpotsService = {
  async getAll(bypassCache: boolean = false): Promise<TouristSpot[]> {
    return listCollectionDocs<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, {
      publishedOnly: false,
      bypassCache
    });
  },

  async getPublished(bypassCache: boolean = false): Promise<TouristSpot[]> {
    const raw = await listCollectionDocs<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, {
      publishedOnly: true,
      bypassCache
    });
    return normalizePublishedSpots(raw);
  },

  async getFeatured(): Promise<TouristSpot[]> {
    const published = await TouristSpotsService.getPublished();
    return published.filter(s => s.is_featured === true);
  },

  async getByDivision(divisionId: string): Promise<TouristSpot[]> {
    const items = await listCollectionDocs<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, {
      publishedOnly: true,
      filters: [{ field: 'division_id', op: '==', value: divisionId }]
    });
    return normalizePublishedSpots(items);
  },

  async getByDistrict(districtId: string): Promise<TouristSpot[]> {
    const items = await listCollectionDocs<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, {
      publishedOnly: true,
      filters: [{ field: 'district_id', op: '==', value: districtId }]
    });
    return normalizePublishedSpots(items);
  },

  async getByLocation(divisionId?: string, districtId?: string): Promise<TouristSpot[]> {
    const filters: WhereFilterClause[] = [];
    if (divisionId && divisionId !== 'all') {
      filters.push({ field: 'division_id', op: '==', value: divisionId });
    }
    if (districtId && districtId !== 'all') {
      filters.push({ field: 'district_id', op: '==', value: districtId });
    }
    const items = await listCollectionDocs<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, {
      publishedOnly: true,
      filters
    });
    return normalizePublishedSpots(items);
  },

  async getById(id: string): Promise<TouristSpot | null> {
    return getCollectionDocById<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, id);
  },

  async getBySlug(slug: string): Promise<TouristSpot | null> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) return null;

    try {
      const colRef = collection(db, COLLECTIONS.TOURIST_SPOTS);
      const q = query(
        colRef,
        where('slug', '==', normalizedSlug),
        where('is_published', '==', true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = { id: docSnap.id, ...docSnap.data() } as TouristSpot;
        if (data.is_published === true) return data;
      }

      const aliasSlug = SPOT_SLUG_ALIASES[normalizedSlug];
      if (aliasSlug) {
        const aliasQuery = query(
          colRef,
          where('slug', '==', aliasSlug),
          where('is_published', '==', true)
        );
        const aliasSnap = await getDocs(aliasQuery);
        if (!aliasSnap.empty) {
          const docSnap = aliasSnap.docs[0];
          const data = { id: docSnap.id, ...docSnap.data() } as TouristSpot;
          if (data.is_published === true) return data;
        }
      }

      return null;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.TOURIST_SPOTS}/${normalizedSlug}`);
      }
      throw error;
    }
  },

  async queryPaginated(options: TouristSpotsQueryOptions = {}): Promise<PaginatedQueryResult<TouristSpot>> {
    const filters: WhereFilterClause[] = [];
    if (options.publishedOnly !== false) {
      filters.push({ field: 'is_published', op: '==', value: true });
    }
    if (options.divisionId && options.divisionId !== 'all') {
      filters.push({ field: 'division_id', op: '==', value: options.divisionId });
    }
    if (options.districtId && options.districtId !== 'all') {
      filters.push({ field: 'district_id', op: '==', value: options.districtId });
    }
    if (options.categoryId && options.categoryId !== 'all') {
      filters.push({ field: 'category_ids', op: 'array-contains', value: options.categoryId });
    }
    if (options.featuredOnly) {
      filters.push({ field: 'is_featured', op: '==', value: true });
    }

    const qText = (options.searchQuery || '').trim().toLowerCase();

    return queryCollectionPaginated<TouristSpot>({
      collectionName: COLLECTIONS.TOURIST_SPOTS,
      filters,
      orderByField: 'name_en',
      orderDirection: 'asc',
      pageSize: options.pageSize ?? 12,
      cursor: options.cursor ?? null,
      clientFilter: qText
        ? (spot) =>
            spot.name_en.toLowerCase().includes(qText) ||
            spot.name_bn.toLowerCase().includes(qText) ||
            (spot.short_desc_en || '').toLowerCase().includes(qText) ||
            (spot.short_desc_bn || '').toLowerCase().includes(qText) ||
            (spot.slug || '').toLowerCase().includes(qText)
        : undefined
    });
  },

  async create(spot: TouristSpot): Promise<TouristSpot> {
    return createCollectionDoc<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, spot);
  },

  async update(id: string, updates: Partial<TouristSpot>): Promise<void> {
    await updateCollectionDoc<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, id, updates);
  },

  async save(spot: TouristSpot): Promise<TouristSpot> {
    return upsertCollectionDoc<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, spot, true);
  },

  async remove(id: string): Promise<void> {
    await deleteCollectionDoc(COLLECTIONS.TOURIST_SPOTS, id);
  },

  localize: localizeTouristSpot
};
