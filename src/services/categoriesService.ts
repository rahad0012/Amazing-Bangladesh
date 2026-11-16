/**
 * Categories Collection Service (categories)
 * Full CRUD, slug/alias resolution, pagination, filtering, and bilingual localization.
 */

import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { CATEGORIES, type Category, type TouristSpot } from '../data/bangladeshData';
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
  type PaginatedQueryResult
} from './firestoreBase';

export const CANONICAL_CATEGORY_ORDER = [
  'beaches',
  'hills',
  'waterfalls',
  'forests',
  'historical',
  'archaeological',
  'religious',
  'lakes',
  'islands',
  'parks',
  'wildlife',
  'rivers'
] as const;

export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  hills: 'hills-and-mountains',
  hills_and_mountains: 'hills-and-mountains',
  historical: 'historical-places',
  historical_places: 'historical-places',
  archaeological: 'archaeological-sites',
  archaeological_sites: 'archaeological-sites',
  religious: 'religious-places',
  religious_places: 'religious-places'
};

export interface LocalizedCategory extends Category {
  localized_name: string;
  localized_description: string;
}

export interface CategoriesQueryOptions {
  publishedOnly?: boolean;
  searchQuery?: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}

function normalizeCategoryToken(value: string): string {
  return (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function normalizePublishedCategories(items: Category[]): Category[] {
  const publishedRaw = items.filter(c => c.is_published === true);
  if (publishedRaw.length === 0) {
    return [...CATEGORIES].filter(c => c.is_published === true);
  }

  const seenKeys = new Set<string>();
  const unique: Category[] = [];

  for (const cat of publishedRaw) {
    const rawId = (cat.id || '').trim().toLowerCase();
    const rawSlug = (cat.slug || '').trim().toLowerCase();
    const canonical = CATEGORIES.find(
      c =>
        c.id.toLowerCase() === rawId ||
        c.slug.toLowerCase() === rawSlug ||
        c.slug.toLowerCase() === (CATEGORY_SLUG_ALIASES[rawSlug] || '') ||
        c.slug.toLowerCase() === (CATEGORY_SLUG_ALIASES[rawId] || '')
    );

    const dedupeKey = canonical ? canonical.id : rawId || rawSlug;
    if (!dedupeKey || seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    const merged: Category = canonical
      ? {
          ...cat,
          id: cat.id || canonical.id,
          slug:
            !rawSlug || rawSlug === 'hills' || rawSlug === 'historical' || rawSlug === 'religious'
              ? canonical.slug
              : cat.slug,
          name_en: cat.name_en === 'Hills' ? canonical.name_en : cat.name_en || canonical.name_en,
          name_bn:
            cat.name_bn === 'পাহাড় ও উপত্যকা'
              ? canonical.name_bn
              : cat.name_bn || canonical.name_bn,
          icon: cat.icon || canonical.icon,
          image_url: cat.image_url || canonical.image_url,
          description_en: cat.description_en || canonical.description_en,
          description_bn: cat.description_bn || canonical.description_bn,
          is_published: true
        }
      : {
          ...cat,
          slug: rawSlug || rawId,
          icon: cat.icon || 'bi-compass',
          is_published: true
        };

    unique.push(merged);
  }

  if (unique.length <= 8) {
    for (const canonical of CATEGORIES) {
      if (!seenKeys.has(canonical.id)) {
        seenKeys.add(canonical.id);
        unique.push(canonical);
      }
    }
  }

  return unique.sort((a, b) => {
    const idxA = CANONICAL_CATEGORY_ORDER.indexOf(a.id.toLowerCase() as any);
    const idxB = CANONICAL_CATEGORY_ORDER.indexOf(b.id.toLowerCase() as any);
    const normA = idxA === -1 ? 99 : idxA;
    const normB = idxB === -1 ? 99 : idxB;
    if (normA !== normB) return normA - normB;
    return (a.name_en || '').localeCompare(b.name_en || '');
  });
}

export function doesSpotMatchCategory(spot: TouristSpot, category: Category): boolean {
  if (spot.is_published !== true || !Array.isArray(spot.category_ids)) return false;

  const candidateTokens = new Set<string>([
    category.id.trim().toLowerCase(),
    normalizeCategoryToken(category.id),
    (category.slug || '').trim().toLowerCase(),
    normalizeCategoryToken(category.slug || '')
  ]);

  for (const [alias, targetSlug] of Object.entries(CATEGORY_SLUG_ALIASES)) {
    if (
      targetSlug === (category.slug || '').toLowerCase() ||
      alias === category.id.toLowerCase()
    ) {
      candidateTokens.add(alias);
      candidateTokens.add(targetSlug);
      candidateTokens.add(normalizeCategoryToken(alias));
      candidateTokens.add(normalizeCategoryToken(targetSlug));
    }
  }

  return spot.category_ids.some(cid => {
    const clean = (cid || '').trim().toLowerCase();
    const norm = normalizeCategoryToken(clean);
    return candidateTokens.has(clean) || candidateTokens.has(norm);
  });
}

export function localizeCategory(category: Category, lang: Language): LocalizedCategory {
  return {
    ...category,
    localized_name: getLocalizedField(category, 'name', lang),
    localized_description: getLocalizedField(category, 'description', lang)
  };
}

export const CategoriesService = {
  async getAll(bypassCache: boolean = false): Promise<Category[]> {
    return listCollectionDocs<Category>(COLLECTIONS.CATEGORIES, {
      publishedOnly: false,
      bypassCache
    });
  },

  async getPublished(bypassCache: boolean = false): Promise<Category[]> {
    const raw = await listCollectionDocs<Category>(COLLECTIONS.CATEGORIES, {
      publishedOnly: true,
      bypassCache
    });
    return normalizePublishedCategories(raw);
  },

  async getById(id: string): Promise<Category | null> {
    return getCollectionDocById<Category>(COLLECTIONS.CATEGORIES, id);
  },

  async getBySlug(slug: string): Promise<Category | null> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) return null;

    try {
      const publishedCategories = await CategoriesService.getPublished();
      const aliasTarget =
        CATEGORY_SLUG_ALIASES[normalizedSlug] ||
        CATEGORY_SLUG_ALIASES[normalizeCategoryToken(normalizedSlug)];
      const normalizedToken = normalizeCategoryToken(normalizedSlug);

      return (
        publishedCategories.find(cat => {
          const catId = cat.id.trim().toLowerCase();
          const catSlug = (cat.slug || '').trim().toLowerCase();
          return (
            catSlug === normalizedSlug ||
            catId === normalizedSlug ||
            normalizeCategoryToken(catId) === normalizedToken ||
            normalizeCategoryToken(catSlug) === normalizedToken ||
            (!!aliasTarget && (catSlug === aliasTarget || catId === aliasTarget))
          );
        }) || null
      );
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CATEGORIES);
      }
      throw error;
    }
  },

  async queryPaginated(options: CategoriesQueryOptions = {}): Promise<PaginatedQueryResult<Category>> {
    const filters = options.publishedOnly !== false
      ? [{ field: 'is_published', op: '==' as const, value: true }]
      : [];
    const qText = (options.searchQuery || '').trim().toLowerCase();

    return queryCollectionPaginated<Category>({
      collectionName: COLLECTIONS.CATEGORIES,
      filters,
      orderByField: 'name_en',
      orderDirection: 'asc',
      pageSize: options.pageSize ?? 12,
      cursor: options.cursor ?? null,
      clientFilter: qText
        ? (cat) =>
            cat.name_en.toLowerCase().includes(qText) ||
            cat.name_bn.toLowerCase().includes(qText) ||
            (cat.slug || '').toLowerCase().includes(qText)
        : undefined
    });
  },

  async create(category: Category): Promise<Category> {
    return createCollectionDoc<Category>(COLLECTIONS.CATEGORIES, category);
  },

  async update(id: string, updates: Partial<Category>): Promise<void> {
    await updateCollectionDoc<Category>(COLLECTIONS.CATEGORIES, id, updates);
  },

  async save(category: Category): Promise<Category> {
    return upsertCollectionDoc<Category>(COLLECTIONS.CATEGORIES, category, true);
  },

  async remove(id: string): Promise<void> {
    await deleteCollectionDoc(COLLECTIONS.CATEGORIES, id);
  },

  localize: localizeCategory
};
