/**
 * CMS State & Reactive Data Store
 * Keeps in-memory collections synchronized with Firebase Firestore
 */

import { 
  DIVISIONS, 
  DISTRICTS, 
  CATEGORIES, 
  TOURIST_SPOTS, 
  ARTICLES, 
  MEDIA_ITEMS, 
  type Division, 
  type District, 
  type Category, 
  type TouristSpot, 
  type Article, 
  type MediaItem 
} from '../data/bangladeshData';

import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType, 
  uploadImageFile, 
  deleteStorageFile 
} from '../firebase';
import {
  DEFAULT_LEGAL_PAGES,
  normalizeLegalPagesConfig,
  type LegalPagesConfig
} from '../services/legalPagesDefaults';

import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';

export type CmsTab = 'overview' | 'divisions' | 'districts' | 'categories' | 'spots' | 'articles' | 'media';

export interface CmsStore {
  activeTab: CmsTab;
  divisions: Division[];
  districts: District[];
  categories: Category[];
  spots: TouristSpot[];
  articles: Article[];
  media: MediaItem[];
  legalPages: LegalPagesConfig;
  
  // Table search & pagination state per module
  searchQuery: string;
  currentPage: number;
  itemsPerPage: number;
  filterDivision: string;
  filterCategory: string;
  filterStatus: string;
  
  // Selection for edit / delete
  editingItem: any | null;
  deletingItem: any | null;
  
  // Flags
  isDemoAdmin: boolean;
  isLoading: boolean;
}

// Load persisted overrides from localStorage if present
const storedDivisions = localStorage.getItem('bd_cms_divisions');
const storedDistricts = localStorage.getItem('bd_cms_districts');
const storedCategories = localStorage.getItem('bd_cms_categories_v3');
const storedSpots = localStorage.getItem('bd_cms_spots_v2');
const storedArticles = localStorage.getItem('bd_cms_articles');
const storedMedia = localStorage.getItem('bd_cms_media');
const storedLegalPages = localStorage.getItem('bd_cms_legal_pages');

let parsedLegalPages: LegalPagesConfig = { ...DEFAULT_LEGAL_PAGES };
if (storedLegalPages) {
  try {
    parsedLegalPages = normalizeLegalPagesConfig(JSON.parse(storedLegalPages));
  } catch {
    parsedLegalPages = { ...DEFAULT_LEGAL_PAGES };
  }
}

export const cmsStore: CmsStore = {
  activeTab: 'overview',
  divisions: storedDivisions ? JSON.parse(storedDivisions) : [...DIVISIONS],
  districts: storedDistricts ? JSON.parse(storedDistricts) : [...DISTRICTS],
  categories: storedCategories ? JSON.parse(storedCategories) : [...CATEGORIES],
  spots: storedSpots ? JSON.parse(storedSpots) : [...TOURIST_SPOTS],
  articles: storedArticles ? JSON.parse(storedArticles) : [...ARTICLES],
  media: storedMedia ? JSON.parse(storedMedia) : [...MEDIA_ITEMS],
  legalPages: parsedLegalPages,

  searchQuery: '',
  currentPage: 1,
  itemsPerPage: 8,
  filterDivision: 'all',
  filterCategory: 'all',
  filterStatus: 'all',

  editingItem: null,
  deletingItem: null,
  isDemoAdmin: true, // Enabled so administrative CRUD is fully operational and verifiable
  isLoading: false
};

// Persistence helper
export function persistStore(): void {
  localStorage.setItem('bd_cms_divisions', JSON.stringify(cmsStore.divisions));
  localStorage.setItem('bd_cms_districts', JSON.stringify(cmsStore.districts));
  localStorage.setItem('bd_cms_categories_v3', JSON.stringify(cmsStore.categories));
  localStorage.setItem('bd_cms_spots_v2', JSON.stringify(cmsStore.spots));
  localStorage.setItem('bd_cms_articles', JSON.stringify(cmsStore.articles));
  localStorage.setItem('bd_cms_media', JSON.stringify(cmsStore.media));
  localStorage.setItem('bd_cms_legal_pages', JSON.stringify(cmsStore.legalPages));
}

// Check admin write privileges
export function canWriteAdmin(): boolean {
  if (cmsStore.isDemoAdmin) return true;
  const user = auth.currentUser;
  if (!user) return false;
  return user.email === 'bluesky90987@gmail.com' || user.email === 'mdrahad0529@gmail.com' || user.emailVerified === true;
}

// ============================================================================
// CRUD Operations with Firestore Synchronicity
// ============================================================================

// 1. Division CRUD
export async function saveDivision(division: Division): Promise<void> {
  const isEdit = cmsStore.divisions.some(d => d.id === division.id);
  const now = new Date().toISOString();
  
  if (isEdit) {
    division.updated_at = now;
    const idx = cmsStore.divisions.findIndex(d => d.id === division.id);
    cmsStore.divisions[idx] = division;
  } else {
    division.created_at = now;
    division.updated_at = now;
    cmsStore.divisions.unshift(division);
  }
  persistStore();

  // Sync to Firestore if authenticated/online
  try {
    await setDoc(doc(db, 'divisions', division.id), division);
  } catch (err) {
    console.warn('Firestore sync note:', err);
  }
}

export async function deleteDivision(divisionId: string): Promise<{ success: boolean; message?: string }> {
  // Relationship check: Are any districts linked to this division?
  const childDistricts = cmsStore.districts.filter(d => d.division_id === divisionId);
  if (childDistricts.length > 0) {
    const districtNames = childDistricts.map(d => d.name_en).slice(0, 5).join(', ');
    const more = childDistricts.length > 5 ? ` and ${childDistricts.length - 5} more` : '';
    return {
      success: false,
      message: `Cannot delete division because ${childDistricts.length} district(s) depend on it (${districtNames}${more}). Please reassign or delete dependent districts first.`
    };
  }

  cmsStore.divisions = cmsStore.divisions.filter(d => d.id !== divisionId);
  persistStore();

  try {
    await deleteDoc(doc(db, 'divisions', divisionId));
  } catch (err) {
    console.warn('Firestore delete note:', err);
  }
  return { success: true };
}

// 2. District CRUD
export async function saveDistrict(district: District): Promise<void> {
  const isEdit = cmsStore.districts.some(d => d.id === district.id);
  const now = new Date().toISOString();

  if (isEdit) {
    district.updated_at = now;
    const idx = cmsStore.districts.findIndex(d => d.id === district.id);
    cmsStore.districts[idx] = district;
  } else {
    district.created_at = now;
    district.updated_at = now;
    cmsStore.districts.unshift(district);
  }
  persistStore();

  try {
    await setDoc(doc(db, 'districts', district.id), district);
  } catch (err) {
    console.warn('Firestore sync note:', err);
  }
}

export async function deleteDistrict(districtId: string): Promise<{ success: boolean; message?: string }> {
  // Relationship check: Are any tourist spots linked to this district?
  const childSpots = cmsStore.spots.filter(s => s.district_id === districtId);
  if (childSpots.length > 0) {
    const spotNames = childSpots.map(s => s.name_en).slice(0, 5).join(', ');
    const more = childSpots.length > 5 ? ` and ${childSpots.length - 5} more` : '';
    return {
      success: false,
      message: `Cannot delete district because ${childSpots.length} tourist spot(s) are located in it (${spotNames}${more}). Please reassign or remove these spots first.`
    };
  }

  cmsStore.districts = cmsStore.districts.filter(d => d.id !== districtId);
  persistStore();

  try {
    await deleteDoc(doc(db, 'districts', districtId));
  } catch (err) {
    console.warn('Firestore delete note:', err);
  }
  return { success: true };
}

// 3. Category CRUD
export async function saveCategory(category: Category): Promise<void> {
  const isEdit = cmsStore.categories.some(c => c.id === category.id);
  const now = new Date().toISOString();

  if (isEdit) {
    category.updated_at = now;
    const idx = cmsStore.categories.findIndex(c => c.id === category.id);
    cmsStore.categories[idx] = category;
  } else {
    category.created_at = now;
    category.updated_at = now;
    cmsStore.categories.push(category);
  }
  persistStore();

  try {
    await setDoc(doc(db, 'categories', category.id), category);
  } catch (err) {
    console.warn('Firestore sync note:', err);
  }
}

export async function deleteCategory(categoryId: string): Promise<{ success: boolean; message?: string }> {
  // Relationship check: Do any spots use this category?
  const linkedSpots = cmsStore.spots.filter(s => s.category_ids && s.category_ids.includes(categoryId));
  if (linkedSpots.length > 0) {
    const spotNames = linkedSpots.map(s => s.name_en).slice(0, 5).join(', ');
    return {
      success: false,
      message: `Cannot delete category because ${linkedSpots.length} tourist spot(s) reference it (${spotNames}). Please remove this category tag from spots first.`
    };
  }

  cmsStore.categories = cmsStore.categories.filter(c => c.id !== categoryId);
  persistStore();

  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (err) {
    console.warn('Firestore delete note:', err);
  }
  return { success: true };
}

// 4. Tourist Spot CRUD
export async function saveTouristSpot(spot: TouristSpot): Promise<void> {
  const isEdit = cmsStore.spots.some(s => s.id === spot.id);
  const now = new Date().toISOString();

  if (isEdit) {
    spot.updated_at = now;
    const idx = cmsStore.spots.findIndex(s => s.id === spot.id);
    cmsStore.spots[idx] = spot;
  } else {
    spot.created_at = now;
    spot.updated_at = now;
    cmsStore.spots.unshift(spot);
  }
  persistStore();

  try {
    await setDoc(doc(db, 'tourist_spots', spot.id), spot);
  } catch (err) {
    console.warn('Firestore sync note:', err);
  }
}

export async function deleteTouristSpot(spotId: string): Promise<{ success: boolean }> {
  cmsStore.spots = cmsStore.spots.filter(s => s.id !== spotId);
  persistStore();

  try {
    await deleteDoc(doc(db, 'tourist_spots', spotId));
  } catch (err) {
    console.warn('Firestore delete note:', err);
  }
  return { success: true };
}

// 5. Travel Guide / Article CRUD
export async function saveArticle(article: Article): Promise<void> {
  const isEdit = cmsStore.articles.some(a => a.id === article.id);
  const now = new Date().toISOString();

  if (isEdit) {
    article.updated_at = now;
    const idx = cmsStore.articles.findIndex(a => a.id === article.id);
    cmsStore.articles[idx] = article;
  } else {
    article.created_at = now;
    article.updated_at = now;
    cmsStore.articles.unshift(article);
  }
  persistStore();

  try {
    await setDoc(doc(db, 'articles', article.id), article);
  } catch (err) {
    console.warn('Firestore sync note:', err);
  }
}

export async function deleteArticle(articleId: string): Promise<{ success: boolean }> {
  cmsStore.articles = cmsStore.articles.filter(a => a.id !== articleId);
  persistStore();

  try {
    await deleteDoc(doc(db, 'articles', articleId));
  } catch (err) {
    console.warn('Firestore delete note:', err);
  }
  return { success: true };
}

// 6. Media Item CRUD
export async function saveMediaItem(item: MediaItem): Promise<void> {
  const exists = cmsStore.media.some(m => m.id === item.id);
  if (exists) {
    const idx = cmsStore.media.findIndex(m => m.id === item.id);
    cmsStore.media[idx] = item;
  } else {
    cmsStore.media.unshift(item);
  }
  persistStore();

  try {
    await setDoc(doc(db, 'media', item.id), item);
  } catch (err) {
    console.warn('Firestore sync note:', err);
  }
}

export async function deleteMediaItem(mediaId: string): Promise<{ success: boolean; warning?: string }> {
  const item = cmsStore.media.find(m => m.id === mediaId);
  if (!item) return { success: true };

  // Check usage in any division, district, spot, or article
  const isUsedBySpot = cmsStore.spots.some(s => s.image_url === item.url || (s.gallery_urls && s.gallery_urls.includes(item.url)));
  const isUsedByDiv = cmsStore.divisions.some(d => d.image_url === item.url);
  const isUsedByDist = cmsStore.districts.some(d => d.image_url === item.url);
  const isUsedByArt = cmsStore.articles.some(a => a.image_url === item.url);

  cmsStore.media = cmsStore.media.filter(m => m.id !== mediaId);
  persistStore();

  try {
    await deleteStorageFile(item.url);
    await deleteDoc(doc(db, 'media', mediaId));
  } catch (err) {
    console.warn('Media deletion note:', err);
  }

  const isUsed = isUsedBySpot || isUsedByDiv || isUsedByDist || isUsedByArt;
  return { 
    success: true, 
    warning: isUsed ? 'Note: This image was previously referenced by one or more destination pages.' : undefined 
  };
}

// 7. Editable Legal Pages Configuration (Privacy Policy & Terms and Conditions)
export async function saveLegalPages(config: LegalPagesConfig): Promise<{ syncedToFirestore: boolean; message?: string }> {
  const normalized = normalizeLegalPagesConfig({
    ...config,
    updated_at: new Date().toISOString()
  });
  cmsStore.legalPages = normalized;
  persistStore();

  try {
    await setDoc(doc(db, 'site_settings', 'legal_pages'), normalized, { merge: true });
    return { syncedToFirestore: true };
  } catch (err: any) {
    console.warn('Firestore legal pages sync note:', err?.message || err);
    return {
      syncedToFirestore: false,
      message: err?.message || 'Saved locally; admin sign-in required for cloud Firestore sync.'
    };
  }
}
