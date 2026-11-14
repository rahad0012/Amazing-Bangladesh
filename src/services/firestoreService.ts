/**
 * Firestore Data Access Layer (DAL)
 * Centralized service for reading and writing to Firebase Firestore
 * Collections: divisions, districts, categories, tourist_spots, articles, admins, site_settings
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseDb';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { 
  CATEGORIES,
  type Division, 
  type District, 
  type Category, 
  type TouristSpot, 
  type Article 
} from '../data/bangladeshData';
import {
  DEFAULT_LEGAL_PAGES,
  normalizeLegalPagesConfig,
  type LegalPagesConfig
} from './legalPagesDefaults';

export const COLLECTIONS = {
  DIVISIONS: 'divisions',
  DISTRICTS: 'districts',
  CATEGORIES: 'categories',
  TOURIST_SPOTS: 'tourist_spots',
  ARTICLES: 'articles',
  ADMINS: 'admins',
  SITE_SETTINGS: 'site_settings',
  NEWSLETTER_SUBSCRIBERS: 'newsletter_subscribers'
} as const;

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

/**
 * Deduplicate division records fetched from Firestore by normalized slug/id/name_en
 * and sort them in canonical order without injecting duplicate entries.
 */
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

export class FirestoreService {
  private static readonly CACHE_TTL_MS = 120_000;
  private static readonly readCache = new Map<string, { value: unknown; expiresAt: number }>();
  private static readonly inFlight = new Map<string, Promise<unknown>>();

  static invalidateCache(keyPrefix?: string): void {
    if (!keyPrefix) {
      FirestoreService.readCache.clear();
      return;
    }
    for (const key of FirestoreService.readCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        FirestoreService.readCache.delete(key);
      }
    }
  }

  private static async cachedFetch<R>(cacheKey: string, fetcher: () => Promise<R>): Promise<R> {
    const now = Date.now();
    const hit = FirestoreService.readCache.get(cacheKey);
    if (hit && hit.expiresAt > now) {
      return hit.value as R;
    }
    const existingFlight = FirestoreService.inFlight.get(cacheKey);
    if (existingFlight) {
      return existingFlight as Promise<R>;
    }
    const task = fetcher()
      .then(result => {
        FirestoreService.readCache.set(cacheKey, {
          value: result,
          expiresAt: Date.now() + FirestoreService.CACHE_TTL_MS
        });
        return result;
      })
      .finally(() => {
        FirestoreService.inFlight.delete(cacheKey);
      });
    FirestoreService.inFlight.set(cacheKey, task);
    return task;
  }

  /**
   * Fetch all documents from a collection with optional published filter
   */
  static async getCollectionItems<T>(
    collectionName: string, 
    publishedOnly: boolean = false
  ): Promise<T[]> {
    const cacheKey = `col:${collectionName}:${publishedOnly ? 'pub' : 'all'}`;
    return FirestoreService.cachedFetch<T[]>(cacheKey, async () => {
      try {
        const colRef = collection(db, collectionName);
        let q = query(colRef);
        if (publishedOnly) {
          q = query(colRef, where('is_published', '==', true));
        }
        const snapshot = await getDocs(q);
        const items: T[] = [];
        snapshot.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        return items;
      } catch (error: any) {
        if (
          error?.code === 'permission-denied' ||
          (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
        ) {
          handleFirestoreError(error, OperationType.LIST, collectionName);
        }
        console.warn(`Firestore read failed for ${collectionName}:`, error?.message || error);
        throw error;
      }
    });
  }

  /**
   * Fetch a single document by ID
   */
  static async getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (error: any) {
      console.error(`Error fetching document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Save or update a document with timestamp
   */
  static async saveDocument<T extends { id: string }>(
    collectionName: string, 
    item: T
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const docRef = doc(db, collectionName, item.id);
      const payload: any = {
        ...item,
        updated_at: new Date().toISOString()
      };
      await setDoc(docRef, payload, { merge: true });
      FirestoreService.invalidateCache();
      return { success: true };
    } catch (error: any) {
      console.error(`Error saving document to ${collectionName}:`, error);
      return { 
        success: false, 
        message: error?.code === 'permission-denied' 
          ? 'Admin authorization required to write to database.' 
          : error?.message || 'Database write failed.' 
      };
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(
    collectionName: string, 
    id: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      FirestoreService.invalidateCache();
      return { success: true };
    } catch (error: any) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      return { 
        success: false, 
        message: error?.code === 'permission-denied' 
          ? 'Admin authorization required to delete records.' 
          : error?.message || 'Delete operation failed.' 
      };
    }
  }

  /**
   * Normalize district administrative relationships (e.g., Jamalpur belongs to Mymensingh division)
   * and sort deterministically by canonical division order then district English name.
   */
  static normalizeDistrictAdministrativeDivision(districts: District[]): District[] {
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

  /**
   * Fetch all published districts from Firestore, normalized and canonically sorted
   */
  static async getAllPublishedDistricts(): Promise<District[]> {
    const raw = await FirestoreService.getCollectionItems<District>(COLLECTIONS.DISTRICTS, true);
    return FirestoreService.normalizeDistrictAdministrativeDivision(raw);
  }

  /**
   * Fetch a single published district document from Firestore by slug (with ID fallback)
   */
  static async getDistrictBySlug(slug: string): Promise<District | null> {
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
        const normalized = FirestoreService.normalizeDistrictAdministrativeDivision([
          { id: docSnap.id, ...docSnap.data() } as District
        ]);
        return normalized[0] || null;
      }

      // Fallback: check direct document IDs (e.g., 'dhaka_dist' or 'coxs_bazar' or slug match)
      const candidateIds = Array.from(
        new Set([
          normalizedSlug,
          `${normalizedSlug}_dist`,
          normalizedSlug.replace(/-/g, '_')
        ])
      ).filter(id => /^[a-zA-Z0-9_-]+$/.test(id));

      for (const candId of candidateIds) {
        const docRef = doc(db, COLLECTIONS.DISTRICTS, candId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as District;
          if (data.is_published !== false) {
            return FirestoreService.normalizeDistrictAdministrativeDivision([data])[0] || data;
          }
        }
      }

      return null;
    } catch (error: any) {
      if (
        error?.code === 'permission-denied' ||
        (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
      ) {
        handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.DISTRICTS}/${normalizedSlug}`);
      }
      console.warn(`Error fetching district by slug "${normalizedSlug}":`, error?.message || error);
      throw error;
    }
  }

  /**
   * Fetch a single published division document from Firestore by slug (with ID fallback)
   */
  static async getDivisionBySlug(slug: string): Promise<Division | null> {
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

      // Fallback: check direct document ID if slug matches doc ID and conforms to safe ID regex
      if (/^[a-zA-Z0-9_-]+$/.test(normalizedSlug)) {
        const docRef = doc(db, COLLECTIONS.DIVISIONS, normalizedSlug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Division;
          if (data.is_published !== false) {
            return data;
          }
        }
      }

      return null;
    } catch (error: any) {
      if (
        error?.code === 'permission-denied' ||
        (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
      ) {
        handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.DIVISIONS}/${normalizedSlug}`);
      }
      console.warn(`Error fetching division by slug "${normalizedSlug}":`, error?.message || error);
      throw error;
    }
  }

  /**
   * Fetch all published districts belonging to a division using division_id
   */
  static async getDistrictsByDivision(divisionId: string): Promise<District[]> {
    try {
      const colRef = collection(db, COLLECTIONS.DISTRICTS);
      const q = query(
        colRef,
        where('division_id', '==', divisionId),
        where('is_published', '==', true)
      );
      const snapshot = await getDocs(q);
      const items: District[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as District);
      });
      return FirestoreService.normalizeDistrictAdministrativeDivision(items);
    } catch (error: any) {
      if (
        error?.code === 'permission-denied' ||
        (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
      ) {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.DISTRICTS);
      }
      console.warn(`Error fetching districts for division "${divisionId}":`, error?.message || error);
      throw error;
    }
  }

  /**
   * Fetch all published tourist spots belonging to a division
   */
  static async getPublishedSpotsByDivision(divisionId: string): Promise<TouristSpot[]> {
    try {
      const colRef = collection(db, COLLECTIONS.TOURIST_SPOTS);
      const q = query(
        colRef,
        where('division_id', '==', divisionId),
        where('is_published', '==', true)
      );
      const snapshot = await getDocs(q);
      const spots: TouristSpot[] = [];
      snapshot.forEach(docSnap => {
        spots.push({ id: docSnap.id, ...docSnap.data() } as TouristSpot);
      });
      return spots;
    } catch (error: any) {
      if (
        error?.code === 'permission-denied' ||
        (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
      ) {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.TOURIST_SPOTS);
      }
      console.warn(`Error fetching spots for division "${divisionId}":`, error?.message || error);
      throw error;
    }
  }

  /**
   * Fetch all published tourist spots belonging to a district
   */
  static async getPublishedSpotsByDistrict(districtId: string): Promise<TouristSpot[]> {
    try {
      const colRef = collection(db, COLLECTIONS.TOURIST_SPOTS);
      const q = query(
        colRef,
        where('district_id', '==', districtId),
        where('is_published', '==', true)
      );
      const snapshot = await getDocs(q);
      const spots: TouristSpot[] = [];
      snapshot.forEach(docSnap => {
        spots.push({ id: docSnap.id, ...docSnap.data() } as TouristSpot);
      });
      return spots;
    } catch (error: any) {
      if (
        error?.code === 'permission-denied' ||
        (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
      ) {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.TOURIST_SPOTS);
      }
      console.warn(`Error fetching spots for district "${districtId}":`, error?.message || error);
      throw error;
    }
  }

  /**
   * Deduplicate and deterministically sort published articles chronologically
   * without inventing fake authors or publication dates.
   */
  static normalizePublishedArticles(articles: Article[]): Article[] {
    const seen = new Set<string>();
    const published = articles.filter(a => {
      if (a.is_published !== true || a.status === 'draft') return false;
      const key = (a.id || a.slug || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return published.sort((a, b) => {
      const timeA = a.published_at ? Date.parse(a.published_at) : NaN;
      const timeB = b.published_at ? Date.parse(b.published_at) : NaN;
      const validA = !Number.isNaN(timeA);
      const validB = !Number.isNaN(timeB);
      if (validA && validB && timeB !== timeA) return timeB - timeA;
      if (validA && !validB) return -1;
      if (!validA && validB) return 1;
      return (a.title_en || a.title_bn || '').localeCompare(b.title_en || b.title_bn || '');
    });
  }

  /**
   * Fetch published travel guide articles from Firestore
   */
  static async getPublishedArticles(): Promise<Article[]> {
    const raw = await FirestoreService.getCollectionItems<Article>(COLLECTIONS.ARTICLES, true);
    return FirestoreService.normalizePublishedArticles(raw);
  }

  /**
   * Fetch a single published travel article from Firestore by URL slug (strictly is_published == true)
   * Never calls getDoc on non-existent docs and never returns draft/unpublished articles.
   */
  static async getArticleBySlug(slug: string): Promise<Article | null> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) return null;

    try {
      const colRef = collection(db, COLLECTIONS.ARTICLES);
      const q = query(
        colRef,
        where('slug', '==', normalizedSlug),
        where('is_published', '==', true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        for (const docSnap of snapshot.docs) {
          const data = { id: docSnap.id, ...docSnap.data() } as Article;
          if (data.is_published === true && data.status !== 'draft') {
            return data;
          }
        }
      }

      // Fallback: check published collection list for case-insensitive slug or ID match
      const allPublished = await FirestoreService.getPublishedArticles();
      return (
        allPublished.find(
          art =>
            (art.slug && art.slug.trim().toLowerCase() === normalizedSlug) ||
            art.id.trim().toLowerCase() === normalizedSlug
        ) || null
      );
    } catch (error: any) {
      if (
        error?.code === 'permission-denied' ||
        (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
      ) {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ARTICLES);
      }
      console.warn(`Error fetching article by slug "${normalizedSlug}":`, error?.message || error);
      throw error;
    }
  }

  /**
   * Deduplicate and deterministically sort published tourist spots
   * without inventing destinations or ratings.
   */
  static normalizePublishedSpots(spots: TouristSpot[]): TouristSpot[] {
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

  static readonly SPOT_SLUG_ALIASES: Record<string, string> = {
    'saint-martin': 'saint-martins-island',
    'st-martin': 'saint-martins-island',
    'lalbagh-fort': 'lalbagh-fort-ahsan-manzil',
    'ahsan-manzil': 'lalbagh-fort-ahsan-manzil',
    'coxs-bazar': 'coxs-bazar-sea-beach',
    'sundarbans': 'sundarbans-mangrove-forest',
    'kuakata': 'kuakata-sea-beach',
    'ratargul': 'ratargul-swamp-forest',
    'tanguar-haor': 'tanguar-haor-shimul-bagan',
    'birishiri': 'birishiri-ceramic-hills-someshwari',
    'sreemangal': 'sreemangal-tea-lawachara',
    'srimangal': 'sreemangal-tea-lawachara',
    'madhabkunda': 'madhabkunda-waterfall',
    'paharpur': 'somapura-mahavihara-paharpur',
    'somapura-mahavihara': 'somapura-mahavihara-paharpur',
    'sixty-dome-mosque': 'sixty-dome-mosque-bagerhat',
    'shat-gombuj': 'sixty-dome-mosque-bagerhat'
  };

  static readonly CATEGORY_SLUG_ALIASES: Record<string, string> = {
    'hills': 'hills-and-mountains',
    'hills_and_mountains': 'hills-and-mountains',
    'historical': 'historical-places',
    'historical_places': 'historical-places',
    'archaeological': 'archaeological-sites',
    'archaeological_sites': 'archaeological-sites',
    'religious': 'religious-places',
    'religious_places': 'religious-places'
  };

  private static normalizeCategoryToken(value: string): string {
    return (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  /**
   * Deduplicate published categories from Firestore, enrich legacy seeded docs
   * with missing cover images / SEO slugs, and merge the 4 newly defined canonical
   * categories if Firestore still holds only the legacy <=8 seed.
   */
  static normalizePublishedCategories(items: Category[]): Category[] {
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
          c.slug.toLowerCase() === (FirestoreService.CATEGORY_SLUG_ALIASES[rawSlug] || '') ||
          c.slug.toLowerCase() === (FirestoreService.CATEGORY_SLUG_ALIASES[rawId] || '')
      );

      const dedupeKey = canonical ? canonical.id : (rawId || rawSlug);
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
            name_en: cat.name_en === 'Hills' ? canonical.name_en : (cat.name_en || canonical.name_en),
            name_bn: cat.name_bn === 'পাহাড় ও উপত্যকা' ? canonical.name_bn : (cat.name_bn || canonical.name_bn),
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

    // If Firestore holds only the legacy <=8 category seed, complete the 12 canonical categories without duplicating existing ones
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

  /**
   * Match a published tourist spot against a category by id, slug, or canonical alias
   */
  static doesSpotMatchCategory(spot: TouristSpot, category: Category): boolean {
    if (spot.is_published !== true || !Array.isArray(spot.category_ids)) return false;

    const candidateTokens = new Set<string>([
      category.id.trim().toLowerCase(),
      FirestoreService.normalizeCategoryToken(category.id),
      (category.slug || '').trim().toLowerCase(),
      FirestoreService.normalizeCategoryToken(category.slug || '')
    ]);

    for (const [alias, targetSlug] of Object.entries(FirestoreService.CATEGORY_SLUG_ALIASES)) {
      if (
        targetSlug === (category.slug || '').toLowerCase() ||
        alias === category.id.toLowerCase()
      ) {
        candidateTokens.add(alias);
        candidateTokens.add(targetSlug);
        candidateTokens.add(FirestoreService.normalizeCategoryToken(alias));
        candidateTokens.add(FirestoreService.normalizeCategoryToken(targetSlug));
      }
    }

    return spot.category_ids.some(cid => {
      const clean = (cid || '').trim().toLowerCase();
      const norm = FirestoreService.normalizeCategoryToken(clean);
      return candidateTokens.has(clean) || candidateTokens.has(norm);
    });
  }

  /**
   * Fetch all published categories from Firestore categories collection
   */
  static async getAllPublishedCategories(): Promise<Category[]> {
    const raw = await FirestoreService.getCollectionItems<Category>(COLLECTIONS.CATEGORIES, true);
    return FirestoreService.normalizePublishedCategories(raw);
  }

  /**
   * Fetch a single published category from Firestore by URL slug or canonical alias
   * Uses collection query where('is_published', '==', true) so Firestore rules never reject non-existent docs
   */
  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) return null;

    try {
      const publishedCategories = await FirestoreService.getAllPublishedCategories();
      const aliasTarget =
        FirestoreService.CATEGORY_SLUG_ALIASES[normalizedSlug] ||
        FirestoreService.CATEGORY_SLUG_ALIASES[FirestoreService.normalizeCategoryToken(normalizedSlug)];
      const normalizedToken = FirestoreService.normalizeCategoryToken(normalizedSlug);

      return (
        publishedCategories.find(cat => {
          const catId = cat.id.trim().toLowerCase();
          const catSlug = (cat.slug || '').trim().toLowerCase();
          return (
            catSlug === normalizedSlug ||
            catId === normalizedSlug ||
            FirestoreService.normalizeCategoryToken(catId) === normalizedToken ||
            FirestoreService.normalizeCategoryToken(catSlug) === normalizedToken ||
            (!!aliasTarget && (catSlug === aliasTarget || catId === aliasTarget))
          );
        }) || null
      );
    } catch (error: any) {
      if (
        error?.code === 'permission-denied' ||
        (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
      ) {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CATEGORIES);
      }
      console.warn(`Error fetching category by slug "${normalizedSlug}":`, error?.message || error);
      throw error;
    }
  }

  /**
   * Fetch all published tourist spots from Firestore tourist_spots collection
   */
  static async getAllPublishedSpots(): Promise<TouristSpot[]> {
    const raw = await FirestoreService.getCollectionItems<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, true);
    return FirestoreService.normalizePublishedSpots(raw);
  }

  /**
   * Fetch a single published tourist spot from Firestore by URL slug (strictly is_published == true)
   */
  static async getSpotBySlug(slug: string): Promise<TouristSpot | null> {
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

      const aliasSlug = FirestoreService.SPOT_SLUG_ALIASES[normalizedSlug];
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
    } catch (error: any) {
      if (
        error?.code === 'permission-denied' ||
        (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
      ) {
        handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.TOURIST_SPOTS}/${normalizedSlug}`);
      }
      console.warn(`Error fetching tourist spot by slug "${normalizedSlug}":`, error?.message || error);
      throw error;
    }
  }

  /**
   * Fetch tourist spots by district or division
   */
  static async getSpotsByLocation(
    divisionId?: string, 
    districtId?: string
  ): Promise<TouristSpot[]> {
    try {
      const colRef = collection(db, COLLECTIONS.TOURIST_SPOTS);
      let q = query(colRef, where('is_published', '==', true));
      if (divisionId && divisionId !== 'all') {
        q = query(q, where('division_id', '==', divisionId));
      }
      if (districtId && districtId !== 'all') {
        q = query(q, where('district_id', '==', districtId));
      }
      const snapshot = await getDocs(q);
      const spots: TouristSpot[] = [];
      snapshot.forEach(docSnap => spots.push({ id: docSnap.id, ...docSnap.data() } as TouristSpot));
      return spots;
    } catch (error: any) {
      console.warn('Error fetching spots by location:', error?.message || error);
      return [];
    }
  }

  /**
   * Register a newsletter subscriber
   */
  static async subscribeNewsletter(
    email: string, 
    lang: string = 'bn'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      // Generate clean valid subId from timestamp and hash
      const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const docRef = doc(db, COLLECTIONS.NEWSLETTER_SUBSCRIBERS, subId);
      await setDoc(docRef, {
        id: subId,
        email: cleanEmail,
        lang,
        subscribed_at: new Date().toISOString()
      });
      return { success: true };
    } catch (error: any) {
      console.warn('Newsletter firestore registration failed, saving locally:', error);
      // Local fallback for offline/restricted mode
      try {
        const localSubs = JSON.parse(localStorage.getItem('bd_tourism_subscribers') || '[]');
        localSubs.push({ email, lang, subscribed_at: new Date().toISOString() });
        localStorage.setItem('bd_tourism_subscribers', JSON.stringify(localSubs));
        return { success: true };
      } catch {
        return { success: false, message: error?.message || 'Subscription failed' };
      }
    }
  }

  /**
   * Fetch editable legal pages configuration from site_settings/legal_pages
   */
  static async getLegalPagesSettings(): Promise<LegalPagesConfig | null> {
    return FirestoreService.cachedFetch<LegalPagesConfig | null>('doc:site_settings:legal_pages', async () => {
      try {
        const docRef = doc(db, COLLECTIONS.SITE_SETTINGS, 'legal_pages');
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          return null;
        }
        return normalizeLegalPagesConfig(docSnap.data() as Partial<LegalPagesConfig>);
      } catch (error: any) {
        if (
          error?.code === 'permission-denied' ||
          (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
        ) {
          handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.SITE_SETTINGS}/legal_pages`);
        }
        console.warn('Could not load legal pages config from Firestore:', error?.message || error);
        return null;
      }
    });
  }

  /**
   * Save editable legal pages configuration to site_settings/legal_pages
   */
  static async saveLegalPagesSettings(
    config: LegalPagesConfig
  ): Promise<{ success: boolean; message?: string }> {
    const normalized = normalizeLegalPagesConfig({
      ...config,
      updated_at: new Date().toISOString()
    });
    try {
      const docRef = doc(db, COLLECTIONS.SITE_SETTINGS, 'legal_pages');
      await setDoc(docRef, normalized, { merge: true });
      FirestoreService.invalidateCache('doc:site_settings:legal_pages');
      return { success: true };
    } catch (error: any) {
      console.warn('Firestore legal pages save note:', error?.message || error);
      return {
        success: false,
        message:
          error?.code === 'permission-denied'
            ? 'Admin authorization required to persist legal document changes to Firestore.'
            : error?.message || 'Could not save legal document settings.'
      };
    }
  }
}

export { DEFAULT_LEGAL_PAGES, normalizeLegalPagesConfig, type LegalPagesConfig };
