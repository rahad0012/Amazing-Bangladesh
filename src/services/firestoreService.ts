/**
 * Firestore Data Access Layer (DAL) Facade
 * Delegates to dedicated modular collection services while preserving backward-compatible APIs:
 * - divisionsService.ts
 * - districtsService.ts
 * - categoriesService.ts
 * - touristSpotsService.ts
 * - articlesService.ts
 * - adminsService.ts
 * - siteSettingsService.ts
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import type {
  Article,
  Category,
  District,
  Division,
  TouristSpot
} from '../data/bangladeshData';
import {
  COLLECTIONS,
  deleteCollectionDoc,
  getCollectionDocById,
  invalidateFirestoreCache,
  listCollectionDocs,
  upsertCollectionDoc
} from './firestoreBase';
import {
  CANONICAL_DIVISION_ORDER,
  DivisionsService,
  normalizeFirestoreDivisions
} from './divisionsService';
import {
  DistrictsService,
  normalizeDistrictAdministrativeDivision
} from './districtsService';
import {
  CANONICAL_CATEGORY_ORDER,
  CATEGORY_SLUG_ALIASES,
  CategoriesService,
  doesSpotMatchCategory,
  normalizePublishedCategories
} from './categoriesService';
import {
  SPOT_SLUG_ALIASES,
  TouristSpotsService,
  normalizePublishedSpots
} from './touristSpotsService';
import {
  ArticlesService,
  normalizePublishedArticles
} from './articlesService';
import { SiteSettingsService } from './siteSettingsService';
import {
  DEFAULT_LEGAL_PAGES,
  normalizeLegalPagesConfig,
  type LegalPagesConfig
} from './legalPagesDefaults';

export {
  COLLECTIONS,
  CANONICAL_DIVISION_ORDER,
  CANONICAL_CATEGORY_ORDER,
  normalizeFirestoreDivisions,
  DEFAULT_LEGAL_PAGES,
  normalizeLegalPagesConfig,
  type LegalPagesConfig
};

export class FirestoreService {
  static readonly SPOT_SLUG_ALIASES = SPOT_SLUG_ALIASES;
  static readonly CATEGORY_SLUG_ALIASES = CATEGORY_SLUG_ALIASES;

  static invalidateCache(keyPrefix?: string): void {
    invalidateFirestoreCache(keyPrefix);
  }

  static async getCollectionItems<T>(
    collectionName: string,
    publishedOnly: boolean = false
  ): Promise<T[]> {
    return listCollectionDocs<T>(collectionName, { publishedOnly });
  }

  static async getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    return getCollectionDocById<T>(collectionName, id);
  }

  static async saveDocument<T extends { id: string }>(
    collectionName: string,
    item: T
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await upsertCollectionDoc<T>(collectionName, item, true);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message:
          error?.code === 'permission-denied'
            ? 'Admin authorization required to write to database.'
            : error?.message || 'Database write failed.'
      };
    }
  }

  static async deleteDocument(
    collectionName: string,
    id: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await deleteCollectionDoc(collectionName, id);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message:
          error?.code === 'permission-denied'
            ? 'Admin authorization required to delete records.'
            : error?.message || 'Delete operation failed.'
      };
    }
  }

  static normalizeDistrictAdministrativeDivision(districts: District[]): District[] {
    return normalizeDistrictAdministrativeDivision(districts);
  }

  static async getAllPublishedDistricts(): Promise<District[]> {
    return DistrictsService.getPublished();
  }

  static async getDistrictBySlug(slug: string): Promise<District | null> {
    return DistrictsService.getBySlug(slug);
  }

  static async getDivisionBySlug(slug: string): Promise<Division | null> {
    return DivisionsService.getBySlug(slug);
  }

  static async getDistrictsByDivision(divisionId: string): Promise<District[]> {
    return DistrictsService.getByDivision(divisionId, true);
  }

  static async getPublishedSpotsByDivision(divisionId: string): Promise<TouristSpot[]> {
    return TouristSpotsService.getByDivision(divisionId);
  }

  static async getPublishedSpotsByDistrict(districtId: string): Promise<TouristSpot[]> {
    return TouristSpotsService.getByDistrict(districtId);
  }

  static normalizePublishedArticles(articles: Article[]): Article[] {
    return normalizePublishedArticles(articles);
  }

  static async getPublishedArticles(): Promise<Article[]> {
    return ArticlesService.getPublished();
  }

  static async getArticleBySlug(slug: string): Promise<Article | null> {
    return ArticlesService.getBySlug(slug);
  }

  static normalizePublishedSpots(spots: TouristSpot[]): TouristSpot[] {
    return normalizePublishedSpots(spots);
  }

  static normalizePublishedCategories(items: Category[]): Category[] {
    return normalizePublishedCategories(items);
  }

  static doesSpotMatchCategory(spot: TouristSpot, category: Category): boolean {
    return doesSpotMatchCategory(spot, category);
  }

  static async getAllPublishedCategories(): Promise<Category[]> {
    return CategoriesService.getPublished();
  }

  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    return CategoriesService.getBySlug(slug);
  }

  static async getAllPublishedSpots(): Promise<TouristSpot[]> {
    return TouristSpotsService.getPublished();
  }

  static async getSpotBySlug(slug: string): Promise<TouristSpot | null> {
    return TouristSpotsService.getBySlug(slug);
  }

  static async getSpotsByLocation(
    divisionId?: string,
    districtId?: string
  ): Promise<TouristSpot[]> {
    return TouristSpotsService.getByLocation(divisionId, districtId);
  }

  static async subscribeNewsletter(
    email: string,
    lang: string = 'bn'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const docRef = doc(db, COLLECTIONS.NEWSLETTER_SUBSCRIBERS, subId);
      await setDoc(docRef, {
        id: subId,
        email: cleanEmail,
        lang: lang === 'en' ? 'en' : 'bn',
        subscribed_at: new Date().toISOString()
      });
      return { success: true };
    } catch (error: any) {
      console.warn('Newsletter firestore registration failed, saving locally:', error);
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

  static async getLegalPagesSettings(): Promise<LegalPagesConfig | null> {
    return SiteSettingsService.getLegalPagesSettings();
  }

  static async saveLegalPagesSettings(
    config: LegalPagesConfig
  ): Promise<{ success: boolean; message?: string }> {
    return SiteSettingsService.saveLegalPagesSettings(config);
  }
}
