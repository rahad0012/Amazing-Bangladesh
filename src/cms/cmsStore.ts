/**
 * Lightweight CMS Store & Reactive Client State
 * Separated from admin mutation/auth services so public routes never bundle Admin/CMS UI or Firebase Auth/Storage SDKs.
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
  DEFAULT_LEGAL_PAGES,
  normalizeLegalPagesConfig,
  type LegalPagesConfig
} from '../services/legalPagesDefaults';

export type CmsTab =
  | 'overview'
  | 'divisions'
  | 'districts'
  | 'categories'
  | 'spots'
  | 'articles'
  | 'media'
  | 'hero-banners'
  | 'seo-settings'
  | 'website-settings'
  | 'ads-settings';

export interface MediaReferenceInfo {
  entityType: 'Division' | 'District' | 'Category' | 'Tourist Spot' | 'Travel Guide';
  id: string;
  title: string;
}

export interface CmsStore {
  activeTab: CmsTab;
  divisions: Division[];
  districts: District[];
  categories: Category[];
  spots: TouristSpot[];
  articles: Article[];
  media: MediaItem[];
  legalPages: LegalPagesConfig;

  searchQuery: string;
  currentPage: number;
  itemsPerPage: number;
  filterDivision: string;
  filterCategory: string;
  filterStatus: string;

  editingItem: any | null;
  deletingItem: any | null;
  isLoading: boolean;
}

function safeParseJsonArray<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [...fallback];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}

let parsedLegalPages: LegalPagesConfig = { ...DEFAULT_LEGAL_PAGES };
try {
  const storedLegalPages = localStorage.getItem('bd_cms_legal_pages');
  if (storedLegalPages) {
    parsedLegalPages = normalizeLegalPagesConfig(JSON.parse(storedLegalPages));
  }
} catch {
  parsedLegalPages = { ...DEFAULT_LEGAL_PAGES };
}

export const cmsStore: CmsStore = {
  activeTab: 'overview',
  divisions: safeParseJsonArray('bd_cms_divisions', DIVISIONS),
  districts: safeParseJsonArray('bd_cms_districts', DISTRICTS),
  categories: safeParseJsonArray('bd_cms_categories_v3', CATEGORIES),
  spots: safeParseJsonArray('bd_cms_spots_v2', TOURIST_SPOTS),
  articles: safeParseJsonArray('bd_cms_articles', ARTICLES),
  media: safeParseJsonArray('bd_cms_media', MEDIA_ITEMS),
  legalPages: parsedLegalPages,

  searchQuery: '',
  currentPage: 1,
  itemsPerPage: 8,
  filterDivision: 'all',
  filterCategory: 'all',
  filterStatus: 'all',

  editingItem: null,
  deletingItem: null,
  isLoading: false
};

export function persistStore(): void {
  localStorage.setItem('bd_cms_divisions', JSON.stringify(cmsStore.divisions));
  localStorage.setItem('bd_cms_districts', JSON.stringify(cmsStore.districts));
  localStorage.setItem('bd_cms_categories_v3', JSON.stringify(cmsStore.categories));
  localStorage.setItem('bd_cms_spots_v2', JSON.stringify(cmsStore.spots));
  localStorage.setItem('bd_cms_articles', JSON.stringify(cmsStore.articles));
  localStorage.setItem('bd_cms_media', JSON.stringify(cmsStore.media));
  localStorage.setItem('bd_cms_legal_pages', JSON.stringify(cmsStore.legalPages));
}

export function getMediaReferences(imageUrl: string): MediaReferenceInfo[] {
  const normalizedUrl = (imageUrl || '').trim();
  if (!normalizedUrl) return [];
  const refs: MediaReferenceInfo[] = [];

  for (const d of cmsStore.divisions) {
    if (d.image_url === normalizedUrl || d.thumbnail_url === normalizedUrl) {
      refs.push({ entityType: 'Division', id: d.id, title: d.name_en || d.name_bn });
    }
  }
  for (const dist of cmsStore.districts) {
    if (dist.image_url === normalizedUrl) {
      refs.push({ entityType: 'District', id: dist.id, title: dist.name_en || dist.name_bn });
    }
  }
  for (const cat of cmsStore.categories) {
    if (cat.image_url === normalizedUrl) {
      refs.push({ entityType: 'Category', id: cat.id, title: cat.name_en || cat.name_bn });
    }
  }
  for (const spot of cmsStore.spots) {
    if (
      spot.image_url === normalizedUrl ||
      (Array.isArray(spot.gallery_urls) && spot.gallery_urls.includes(normalizedUrl))
    ) {
      refs.push({ entityType: 'Tourist Spot', id: spot.id, title: spot.name_en || spot.name_bn });
    }
  }
  for (const art of cmsStore.articles) {
    if (art.image_url === normalizedUrl) {
      refs.push({ entityType: 'Travel Guide', id: art.id, title: art.title_en || art.title_bn });
    }
  }
  return refs;
}
