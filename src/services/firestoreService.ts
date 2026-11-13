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
import { db } from '../config/firebaseConfig';
import { handleFirestoreError, OperationType } from '../firebase';
import { 
  type Division, 
  type District, 
  type Category, 
  type TouristSpot, 
  type Article 
} from '../data/bangladeshData';

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
  /**
   * Fetch all documents from a collection with optional published filter
   */
  static async getCollectionItems<T>(
    collectionName: string, 
    publishedOnly: boolean = false
  ): Promise<T[]> {
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
   * Fetch published travel guide articles from Firestore
   */
  static async getPublishedArticles(): Promise<Article[]> {
    return FirestoreService.getCollectionItems<Article>(COLLECTIONS.ARTICLES, true);
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

  /**
   * Fetch all published tourist spots from Firestore tourist_spots collection
   */
  static async getAllPublishedSpots(): Promise<TouristSpot[]> {
    const raw = await FirestoreService.getCollectionItems<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, true);
    return FirestoreService.normalizePublishedSpots(raw);
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
}
