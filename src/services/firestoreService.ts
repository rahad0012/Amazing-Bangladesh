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
