/**
 * Bangladesh Tourism Platform - Main Application Controller
 * Technology Stack: HTML5, CSS3, Bootstrap 5, Vanilla TypeScript / ES6+, Firebase Firestore & Auth
 * Integrated with Complete Content Management System (Modules 1-6)
 */

import { 
  type Division, 
  type District, 
  type TouristSpot, 
  type Article, 
  type Category,
  type MediaItem 
} from './data/bangladeshData';

import { 
  cmsStore, 
  saveDivision, 
  deleteDivision, 
  saveDistrict, 
  deleteDistrict, 
  saveCategory, 
  deleteCategory, 
  saveTouristSpot, 
  deleteTouristSpot, 
  saveArticle, 
  deleteArticle, 
  saveMediaItem, 
  deleteMediaItem, 
  canWriteAdmin,
  type CmsTab 
} from './cms/cmsState';

import { 
  renderCmsDashboard, 
  showToast, 
  showConfirmModal 
} from './cms/cmsViews';

import { 
  openDivisionFormModal, 
  openDistrictFormModal, 
  openCategoryFormModal, 
  openSpotFormModal, 
  openArticleFormModal, 
  openMediaUploadModal,
  openImagePreviewModal 
} from './cms/cmsModals';

import { 
  type Language, 
  getCurrentLanguage, 
  setLanguagePreference, 
  getTranslation 
} from './i18n';

import { 
  renderNavbar,
  renderFooter,
  renderDivisionCard, 
  renderDestinationCard, 
  renderDistrictCard, 
  renderCategoryPill 
} from './components';

import {
  renderAllDivisionsPage,
  renderDivisionDetailPage,
  renderAllDistrictsPage,
  renderDistrictDetailPage,
  renderAllPlacesPage,
  getFilteredDistricts,
  getFilteredSpots,
  DISTRICTS_PER_PAGE,
  PLACES_PER_PAGE
} from './pages';

import {
  FirestoreService,
  COLLECTIONS,
  CANONICAL_DIVISION_ORDER,
  normalizeFirestoreDivisions
} from './services';

import {
  parseCurrentRoute,
  navigateToPath,
  updateCanonicalAndSeo,
  updateStructuredData
} from './utils/urlUtils';

import { 
  auth, 
  db, 
  loginWithGoogle, 
  logoutUser, 
  testConnection, 
  handleFirestoreError, 
  OperationType,
  uploadImageFile 
} from './firebase';

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs 
} from 'firebase/firestore';

import { onAuthStateChanged, type User } from 'firebase/auth';

// Application State Interface
interface AppState {
  lang: Language;
  activeView: 'home' | 'divisions' | 'division-detail' | 'districts' | 'district-detail' | 'spots' | 'guides' | 'planner' | 'saved' | 'cms';
  divisionFilter: string;
  categoryFilter: string;
  searchQuery: string;
  divisionsSearchQuery: string;
  districtsSearchQuery: string;
  districtsDivisionFilter: string;
  districtsCurrentPage: number;
  placesSearchQuery: string;
  placesDivisionFilter: string;
  placesDistrictFilter: string;
  placesCategoryFilter: string;
  placesCurrentPage: number;
  selectedDivisionId: string | null;
  selectedDistrictId: string | null;
  bookmarkedIds: Set<string>;
  currentUser: User | null;
  activeDistrictTabDivision: string;
  itineraryResult: string | null;
  firestoreLoading: boolean;
  firestoreError: string | null;
  firestoreHydrated: boolean;
  divisionDetailSlug: string | null;
  divisionDetailLoading: boolean;
  divisionDetailError: string | null;
  divisionDetailNotFound: boolean;
  divisionDetailDivision: Division | null;
  divisionDetailDistricts: District[];
  divisionDetailSpots: TouristSpot[];
  divisionDetailArticles: Article[];
  divisionDetailDistrictFilterId: string | null;
  districtDetailSlug: string | null;
  districtDetailLoading: boolean;
  districtDetailError: string | null;
  districtDetailNotFound: boolean;
  districtDetailDistrict: District | null;
  districtDetailDivision: Division | null;
  districtDetailSiblingDistricts: District[];
  districtDetailSpots: TouristSpot[];
  districtDetailArticles: Article[];
  heroSlideIndex: number;
}

interface HeroSlide {
  imageUrl: string;
  labelBn: string;
  labelEn: string;
}

const HERO_SLIDES: ReadonlyArray<HeroSlide> = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80',
    labelBn: 'কক্সবাজার সমুদ্র সৈকত • চট্টগ্রাম',
    labelEn: "Cox's Bazar Sea Beach • Chattogram"
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    labelBn: 'সাজেক ভ্যালি মেঘের রাজ্য • রাঙামাটি',
    labelEn: 'Sajek Cloud Valley • Rangamati'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
    labelBn: 'সুন্দরবন ম্যানগ্রোভ অরণ্য • খুলনা',
    labelEn: 'Sundarbans Mangrove Forest • Khulna'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=1600&q=80',
    labelBn: 'শ্রীমঙ্গল সবুজ চা বাগান • সিলেট',
    labelEn: 'Sreemangal Tea Gardens • Sylhet'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1600&q=80',
    labelBn: 'লালবাগ কেল্লা ও পুরান ঢাকা • ঢাকা',
    labelEn: 'Lalbagh Fort & Old Dhaka • Dhaka'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80',
    labelBn: 'কুয়াকাটা সাগরকন্যা সৈকত • বরিশাল',
    labelEn: 'Kuakata Sunrise & Sunset Beach • Barishal'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    labelBn: 'সেন্টমার্টিন প্রবাল দ্বীপ • কক্সবাজার',
    labelEn: "Saint Martin's Coral Island • Bay of Bengal"
  }
];

let heroCarouselTimer: number | null = null;
let heroCarouselPaused = false;

// Initial State
const state: AppState = {
  lang: getCurrentLanguage(),
  activeView: 'home',
  divisionFilter: 'all',
  categoryFilter: 'all',
  searchQuery: '',
  divisionsSearchQuery: '',
  districtsSearchQuery: '',
  districtsDivisionFilter: 'all',
  districtsCurrentPage: 1,
  placesSearchQuery: '',
  placesDivisionFilter: 'all',
  placesDistrictFilter: 'all',
  placesCategoryFilter: 'all',
  placesCurrentPage: 1,
  selectedDivisionId: null,
  selectedDistrictId: null,
  bookmarkedIds: new Set<string>(JSON.parse(localStorage.getItem('bd_tourism_bookmarks') || '[]')),
  currentUser: null,
  activeDistrictTabDivision: 'all',
  itineraryResult: null,
  firestoreLoading: false,
  firestoreError: null,
  firestoreHydrated: false,
  divisionDetailSlug: null,
  divisionDetailLoading: false,
  divisionDetailError: null,
  divisionDetailNotFound: false,
  divisionDetailDivision: null,
  divisionDetailDistricts: [],
  divisionDetailSpots: [],
  divisionDetailArticles: [],
  divisionDetailDistrictFilterId: null,
  districtDetailSlug: null,
  districtDetailLoading: false,
  districtDetailError: null,
  districtDetailNotFound: false,
  districtDetailDistrict: null,
  districtDetailDivision: null,
  districtDetailSiblingDistricts: [],
  districtDetailSpots: [],
  districtDetailArticles: [],
  heroSlideIndex: 0
};

// Bootstrap modal helpers
function getBootstrapModal(id: string): any {
  const el = document.getElementById(id);
  if (!el) return null;
  const bootstrap = (window as any).bootstrap;
  if (bootstrap && bootstrap.Modal) {
    return bootstrap.Modal.getOrCreateInstance(el);
  }
  return null;
}

// Escape HTML to prevent XSS in dynamic renders
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Convert image URLs to optimized WebP format with responsive parameters
export function optimizeImageUrl(url: string, width: number = 800): string {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', '80');
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
}

// Synchronize SEO meta tags, title, canonical URLs, and structured data dynamically
export function updateDynamicSeo(pageTitle?: string, metaDesc?: string, routePath?: string): void {
  const isBn = state.lang === 'bn';
  const defaultTitle = isBn 
    ? 'অপরূপ বাংলাদেশ | Beautiful Bangladesh - Official Tourism Portal' 
    : 'Beautiful Bangladesh - Official Tourism Portal & Travel Guide';
  const defaultDesc = isBn
    ? 'বাংলাদেশের ৮টি বিভাগ, ৬৪টি জেলা, দর্শনীয় স্থান, ঐতিহাসিক ঐতিহ্য এবং প্রাকৃতিক সৌন্দর্যের তথ্যবহুল গাইড।'
    : 'Discover Bangladesh\'s 8 administrative divisions, 64 districts, natural wonders, UNESCO World Heritage sites, and curated travel itineraries in Bengali and English.';

  let resolvedTitle = pageTitle ? `${pageTitle} | ${isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh'}` : defaultTitle;
  let resolvedDesc = metaDesc || defaultDesc;
  let resolvedPath = routePath;

  if (!pageTitle && state.activeView === 'divisions') {
    resolvedTitle = isBn
      ? 'বাংলাদেশের ৮ বিভাগ | অপরূপ বাংলাদেশ'
      : 'Explore the 8 Divisions of Bangladesh | Beautiful Bangladesh';
    resolvedDesc = isBn
      ? 'বাংলাদেশের ৮টি প্রশাসনিক বিভাগ—ঢাকা, চট্টগ্রাম, রাজশাহী, খুলনা, বরিশাল, সিলেট, রংপুর ও ময়মনসিংহের জেলা সংখ্যা, ভৌগোলিক পরিচয় ও দর্শনীয় স্থান।'
      : 'Explore all 8 administrative divisions of Bangladesh—Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, and Mymensingh—with district counts and top destinations.';
    resolvedPath = '/divisions/';

    const publishedDivs = cmsStore.divisions.filter(d => d.is_published !== false);
    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: isBn ? 'বাংলাদেশের ৮ বিভাগ' : 'Explore the 8 Divisions of Bangladesh',
          description: resolvedDesc,
          url: `${window.location.origin}/divisions/`,
          inLanguage: state.lang
        },
        {
          '@type': 'ItemList',
          itemListElement: publishedDivs.map((div, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: isBn ? div.name_bn : div.name_en,
            url: `${window.location.origin}/divisions/${div.slug || div.id}/`
          }))
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: isBn ? 'বাংলাদেশের ৮ বিভাগ' : '8 Divisions', item: `${window.location.origin}/divisions/` }
          ]
        }
      ]
    });
  } else if (!pageTitle && state.activeView === 'division-detail' && state.selectedDivisionId) {
    const div = state.divisionDetailDivision;
    if (div) {
      const divName = isBn ? div.name_bn : div.name_en;
      resolvedTitle = isBn
        ? `${divName} বিভাগ (${div.name_en}) - জেলা ও দর্শনীয় স্থান | অপরূপ বাংলাদেশ`
        : `${divName} Division (${div.name_bn}) - Districts & Attractions | Beautiful Bangladesh`;
      resolvedDesc = isBn ? div.description_bn : div.description_en;
      resolvedPath = `/divisions/${div.slug || div.id}/`;

      updateStructuredData({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TouristDestination',
            name: `${div.name_en} Division (${div.name_bn})`,
            description: resolvedDesc,
            url: `${window.location.origin}/divisions/${div.slug || div.id}/`
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
              { '@type': 'ListItem', position: 2, name: isBn ? 'বাংলাদেশের ৮ বিভাগ' : '8 Divisions', item: `${window.location.origin}/divisions/` },
              { '@type': 'ListItem', position: 3, name: divName, item: `${window.location.origin}/divisions/${div.slug || div.id}/` }
            ]
          }
        ]
      });
    } else if (state.divisionDetailNotFound || !state.divisionDetailLoading) {
      resolvedTitle = isBn
        ? 'বিভাগটি পাওয়া যায়নি | অপরূপ বাংলাদেশ'
        : 'Division Not Found | Beautiful Bangladesh';
      resolvedDesc = isBn
        ? 'অনুরোধকৃত বিভাগটি খুঁজে পাওয়া যায়নি। বাংলাদেশের ৮টি বিভাগের সম্পূর্ণ তালিকা দেখুন।'
        : 'The requested Bangladesh administrative division could not be found. Browse all 8 official divisions.';
      resolvedPath = `/divisions/${encodeURIComponent(state.selectedDivisionId)}/`;
      updateStructuredData(null);
    }
  } else if (!pageTitle && state.activeView === 'districts') {
    const publishedDistricts = cmsStore.districts.filter(d => d.is_published !== false);
    resolvedTitle = isBn
      ? 'বাংলাদেশের ৬৪ জেলা ডিরেক্টরি | অপরূপ বাংলাদেশ'
      : 'All 64 Districts of Bangladesh Directory | Beautiful Bangladesh';
    resolvedDesc = isBn
      ? 'বাংলাদেশের ৮টি বিভাগের অধীন সকল ৬৪টি জেলার বাংলা ও ইংরেজি নাম, পরিচিতি, ঐতিহ্যবাহী খাবার ও দর্শনীয় স্থানের সম্পূর্ণ তালিকা।'
      : 'Browse the complete official directory of all 64 districts in Bangladesh across 8 divisions with search, division filtering, and local guides.';
    resolvedPath = '/districts/';

    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: isBn ? 'বাংলাদেশের ৬৪ জেলা' : 'All 64 Districts of Bangladesh',
          description: resolvedDesc,
          url: `${window.location.origin}/districts/`,
          inLanguage: state.lang
        },
        {
          '@type': 'ItemList',
          numberOfItems: publishedDistricts.length,
          itemListElement: publishedDistricts.slice(0, 16).map((dist, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: isBn ? `${dist.name_bn} (${dist.name_en})` : `${dist.name_en} (${dist.name_bn})`,
            url: `${window.location.origin}/districts/${dist.slug || dist.id}/`
          }))
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: isBn ? 'বাংলাদেশের ৬৪ জেলা' : '64 Districts', item: `${window.location.origin}/districts/` }
          ]
        }
      ]
    });
  } else if (!pageTitle && state.activeView === 'district-detail' && state.selectedDistrictId) {
    const dist = state.districtDetailDistrict;
    const div = state.districtDetailDivision;
    if (dist) {
      const distName = isBn ? dist.name_bn : dist.name_en;
      const distSlug = dist.slug || dist.id;
      resolvedTitle = isBn
        ? (dist.seo_title_bn || `${distName} জেলা (${dist.name_en}) - ভ্রমণ ও দর্শনীয় স্থান | অপরূপ বাংলাদেশ`)
        : (dist.seo_title_en || `${distName} District (${dist.name_bn}) - Travel Guide & Attractions | Beautiful Bangladesh`);
      resolvedDesc = isBn
        ? (dist.seo_description_bn || dist.description_bn)
        : (dist.seo_description_en || dist.description_en);
      resolvedPath = `/districts/${distSlug}/`;

      updateStructuredData({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TouristDestination',
            name: `${dist.name_en} District (${dist.name_bn})`,
            description: resolvedDesc,
            url: `${window.location.origin}/districts/${distSlug}/`
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
              { '@type': 'ListItem', position: 2, name: isBn ? 'বাংলাদেশের ৬৪ জেলা' : '64 Districts', item: `${window.location.origin}/districts/` },
              ...(div ? [{
                '@type': 'ListItem',
                position: 3,
                name: isBn ? div.name_bn : div.name_en,
                item: `${window.location.origin}/divisions/${div.slug || div.id}/`
              }] : []),
              {
                '@type': 'ListItem',
                position: div ? 4 : 3,
                name: distName,
                item: `${window.location.origin}/districts/${distSlug}/`
              }
            ]
          }
        ]
      });
    } else if (state.districtDetailNotFound || !state.districtDetailLoading) {
      resolvedTitle = isBn
        ? 'জেলাটি পাওয়া যায়নি | অপরূপ বাংলাদেশ'
        : 'District Not Found | Beautiful Bangladesh';
      resolvedDesc = isBn
        ? 'অনুরোধকৃত জেলাটি খুঁজে পাওয়া যায়নি। বাংলাদেশের সকল ৬৪টি জেলার সম্পূর্ণ তালিকা দেখুন।'
        : 'The requested Bangladesh administrative district could not be found. Browse all 64 districts.';
      resolvedPath = `/districts/${encodeURIComponent(state.selectedDistrictId)}/`;
      updateStructuredData(null);
    }
  } else if (!pageTitle && state.activeView === 'spots') {
    const publishedSpots = cmsStore.spots.filter(s => s.is_published === true);
    resolvedTitle = isBn
      ? 'বাংলাদেশের সকল দর্শনীয় স্থান ডিরেক্টরি | অপরূপ বাংলাদেশ'
      : 'All Tourist Destinations of Bangladesh | Beautiful Bangladesh';
    resolvedDesc = isBn
      ? 'বাংলাদেশের ৮টি বিভাগ ও ৬৪ জেলার সকল প্রকাশিত দর্শনীয় স্থান, সমুদ্র সৈকত, পাহাড়, জলপ্রপাত ও ঐতিহাসিক স্থাপত্য বিভাগ, জেলা ও ক্যাটাগরি অনুযায়ী খুঁজুন।'
      : 'Explore all published tourist destinations across Bangladesh—filter by division, district, and category, or search seamlessly in Bengali and English.';
    resolvedPath = '/places/';

    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: isBn ? 'বাংলাদেশের সকল দর্শনীয় স্থান' : 'All Tourist Destinations of Bangladesh',
          description: resolvedDesc,
          url: `${window.location.origin}/places/`,
          inLanguage: state.lang
        },
        {
          '@type': 'ItemList',
          numberOfItems: publishedSpots.length,
          itemListElement: publishedSpots.slice(0, 12).map((spot, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: isBn ? `${spot.name_bn} (${spot.name_en})` : `${spot.name_en} (${spot.name_bn})`,
            url: `${window.location.origin}/places/#spot-${spot.id}`
          }))
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: isBn ? 'দর্শনীয় স্থান' : 'Tourist Destinations', item: `${window.location.origin}/places/` }
          ]
        }
      ]
    });
  } else if (!pageTitle) {
    updateStructuredData(null);
  }

  updateCanonicalAndSeo(resolvedTitle, resolvedDesc, resolvedPath);
}

// Helper to find division by id, slug, or english name
function findDivisionBySlugOrId(slugOrId: string | null): Division | null {
  if (!slugOrId) return null;
  const target = slugOrId.trim().toLowerCase();
  return (
    cmsStore.divisions.find(
      d =>
        d.id.toLowerCase() === target ||
        (d.slug && d.slug.toLowerCase() === target) ||
        d.name_en.toLowerCase() === target
    ) || null
  );
}

// Helper to find district by id, slug, or english name
function findDistrictBySlugOrId(slugOrId: string | null): District | null {
  if (!slugOrId) return null;
  const target = slugOrId.trim().toLowerCase();
  return (
    cmsStore.districts.find(
      d =>
        d.id.toLowerCase() === target ||
        (d.slug && d.slug.toLowerCase() === target) ||
        d.name_en.toLowerCase() === target
    ) || null
  );
}

// Hydrate divisions, districts, spots, and categories from Firestore without duplicating existing entries
async function loadPortalDataFromFirestore(force: boolean = false): Promise<void> {
  if (state.firestoreLoading) return;
  if (state.firestoreHydrated && !force) return;

  state.firestoreLoading = true;
  state.firestoreError = null;
  renderApp();

  try {
    const [fsDivisions, fsDistricts, fsSpots, fsCategories, fsArticles] = await Promise.all([
      FirestoreService.getCollectionItems<Division>(COLLECTIONS.DIVISIONS, true),
      FirestoreService.getAllPublishedDistricts(),
      FirestoreService.getAllPublishedSpots(),
      FirestoreService.getCollectionItems<Category>(COLLECTIONS.CATEGORIES, true),
      FirestoreService.getPublishedArticles()
    ]);

    if (fsDivisions.length > 0) {
      cmsStore.divisions = normalizeFirestoreDivisions(fsDivisions);
    }

    if (fsDistricts.length > 0) {
      cmsStore.districts = fsDistricts;
    }

    if (fsSpots.length > 0) {
      cmsStore.spots = fsSpots;
    }

    if (fsCategories.length > 0) {
      const seenCats = new Set<string>();
      cmsStore.categories = fsCategories.filter(c => {
        const key = (c.id || c.slug || '').toLowerCase();
        if (!key || seenCats.has(key)) return false;
        seenCats.add(key);
        return true;
      });
    }

    if (fsArticles.length > 0) {
      const seenArticles = new Set<string>();
      cmsStore.articles = fsArticles.filter(a => {
        const key = (a.id || a.slug || '').toLowerCase();
        if (!key || seenArticles.has(key)) return false;
        seenArticles.add(key);
        return true;
      });
    }

    state.firestoreHydrated = true;
  } catch (err: any) {
    console.warn('Could not load portal data from Firestore:', err);
    state.firestoreError =
      err instanceof Error ? err.message : 'Unable to retrieve division data from Firestore.';
  } finally {
    state.firestoreLoading = false;
    updateDynamicSeo();
    renderApp();
  }
}

// Targeted Firestore loader for Dynamic Division Details Page (/divisions/:slug/)
async function loadDivisionDetailFromFirestore(slugOrId: string, force: boolean = false): Promise<void> {
  const normalizedSlug = slugOrId.trim().toLowerCase();
  if (!normalizedSlug) {
    state.divisionDetailSlug = '';
    state.divisionDetailDivision = null;
    state.divisionDetailDistricts = [];
    state.divisionDetailSpots = [];
    state.divisionDetailArticles = [];
    state.divisionDetailNotFound = true;
    state.divisionDetailLoading = false;
    state.divisionDetailError = null;
    updateDynamicSeo();
    renderApp();
    return;
  }

  if (
    !force &&
    state.divisionDetailSlug === normalizedSlug &&
    !state.divisionDetailLoading &&
    (state.divisionDetailDivision || state.divisionDetailNotFound)
  ) {
    return;
  }

  state.divisionDetailSlug = normalizedSlug;
  state.divisionDetailLoading = true;
  state.divisionDetailError = null;
  state.divisionDetailNotFound = false;
  state.divisionDetailDistrictFilterId = null;
  renderApp();

  try {
    let resolvedDivision = await FirestoreService.getDivisionBySlug(normalizedSlug);
    let divisionDistricts: District[] = [];
    let divisionSpots: TouristSpot[] = [];
    let publishedArticles: Article[] = [];

    if (resolvedDivision) {
      const divId = resolvedDivision.id;
      const divSlug = resolvedDivision.slug;

      const [fsDistrictsPrimary, fsSpotsPrimary, fsArticles, fsCategories] = await Promise.all([
        FirestoreService.getDistrictsByDivision(divId),
        FirestoreService.getPublishedSpotsByDivision(divId),
        FirestoreService.getPublishedArticles(),
        FirestoreService.getCollectionItems<Category>(COLLECTIONS.CATEGORIES, true)
      ]);

      let fsDistricts = fsDistrictsPrimary;
      if (fsDistricts.length === 0 && divSlug && divSlug.toLowerCase() !== divId.toLowerCase()) {
        fsDistricts = await FirestoreService.getDistrictsByDivision(divSlug);
      }

      let fsSpots = fsSpotsPrimary;
      if (fsSpots.length === 0 && divSlug && divSlug.toLowerCase() !== divId.toLowerCase()) {
        fsSpots = await FirestoreService.getPublishedSpotsByDivision(divSlug);
      }

      // If Firestore sub-collections are completely empty (unseeded), fall back cleanly to local division records without duplicating
      if (fsDistricts.length > 0) {
        divisionDistricts = fsDistricts;
      } else {
        const allDistCheck = await FirestoreService.getCollectionItems<District>(COLLECTIONS.DISTRICTS, true);
        if (allDistCheck.length === 0) {
          divisionDistricts = cmsStore.districts.filter(
            d =>
              d.is_published !== false &&
              (d.division_id.toLowerCase() === divId.toLowerCase() ||
                (!!divSlug && d.division_id.toLowerCase() === divSlug.toLowerCase()))
          );
        } else {
          divisionDistricts = FirestoreService.normalizeDistrictAdministrativeDivision(allDistCheck).filter(
            d =>
              d.division_id.toLowerCase() === divId.toLowerCase() ||
              (!!divSlug && d.division_id.toLowerCase() === divSlug.toLowerCase())
          );
        }
      }

      if (fsSpots.length > 0) {
        divisionSpots = fsSpots;
      } else {
        const allSpotsCheck = await FirestoreService.getCollectionItems<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, true);
        if (allSpotsCheck.length === 0) {
          divisionSpots = cmsStore.spots.filter(
            s =>
              s.is_published !== false &&
              (s.division_id.toLowerCase() === divId.toLowerCase() ||
                (!!divSlug && s.division_id.toLowerCase() === divSlug.toLowerCase()))
          );
        } else {
          divisionSpots = allSpotsCheck.filter(
            s =>
              s.division_id.toLowerCase() === divId.toLowerCase() ||
              (!!divSlug && s.division_id.toLowerCase() === divSlug.toLowerCase())
          );
        }
      }

      if (fsArticles.length > 0) {
        publishedArticles = fsArticles;
      } else {
        publishedArticles = cmsStore.articles.filter(a => a.is_published !== false);
      }

      if (fsCategories.length > 0) {
        cmsStore.categories = fsCategories;
      }
    } else {
      // Check if Firestore divisions collection has any published docs
      const allFsDivs = await FirestoreService.getCollectionItems<Division>(COLLECTIONS.DIVISIONS, true);
      if (allFsDivs.length > 0) {
        // Firestore is populated and slug did not match any published division
        cmsStore.divisions = normalizeFirestoreDivisions(allFsDivs);
        resolvedDivision = null;
      } else {
        // Unseeded Firestore: allow canonical fallback ONLY for valid official division slugs
        const isCanonical = CANONICAL_DIVISION_ORDER.includes(normalizedSlug as any);
        const localMatch = findDivisionBySlugOrId(normalizedSlug);
        if (localMatch && localMatch.is_published !== false && (isCanonical || CANONICAL_DIVISION_ORDER.includes((localMatch.slug || localMatch.id).toLowerCase() as any))) {
          resolvedDivision = localMatch;
          const divId = resolvedDivision.id.toLowerCase();
          const divSlug = (resolvedDivision.slug || '').toLowerCase();
          divisionDistricts = cmsStore.districts.filter(
            d =>
              d.is_published !== false &&
              (d.division_id.toLowerCase() === divId || (!!divSlug && d.division_id.toLowerCase() === divSlug))
          );
          divisionSpots = cmsStore.spots.filter(
            s =>
              s.is_published !== false &&
              (s.division_id.toLowerCase() === divId || (!!divSlug && s.division_id.toLowerCase() === divSlug))
          );
          publishedArticles = cmsStore.articles.filter(a => a.is_published !== false);
        } else {
          resolvedDivision = null;
        }
      }
    }

    if (!resolvedDivision) {
      state.divisionDetailDivision = null;
      state.divisionDetailDistricts = [];
      state.divisionDetailSpots = [];
      state.divisionDetailArticles = [];
      state.divisionDetailNotFound = true;
    } else {
      state.divisionDetailDivision = resolvedDivision;
      state.divisionDetailDistricts = FirestoreService.normalizeDistrictAdministrativeDivision(divisionDistricts);
      state.divisionDetailSpots = divisionSpots;
      state.divisionDetailArticles = publishedArticles;
      state.divisionDetailNotFound = false;
    }
  } catch (err: any) {
    console.warn(`Could not load division details for "${normalizedSlug}":`, err);
    state.divisionDetailError =
      err instanceof Error ? err.message : 'Unable to retrieve division details from Firestore.';
    state.divisionDetailDivision = null;
  } finally {
    state.divisionDetailLoading = false;
    updateDynamicSeo();
    renderApp();
  }
}

// Targeted Firestore loader for Dynamic District Details Page (/districts/:slug/)
async function loadDistrictDetailFromFirestore(slugOrId: string, force: boolean = false): Promise<void> {
  const normalizedSlug = slugOrId.trim().toLowerCase();
  if (!normalizedSlug) {
    state.districtDetailSlug = '';
    state.districtDetailDistrict = null;
    state.districtDetailDivision = null;
    state.districtDetailSiblingDistricts = [];
    state.districtDetailSpots = [];
    state.districtDetailArticles = [];
    state.districtDetailNotFound = true;
    state.districtDetailLoading = false;
    state.districtDetailError = null;
    updateDynamicSeo();
    renderApp();
    return;
  }

  if (
    !force &&
    state.districtDetailSlug === normalizedSlug &&
    !state.districtDetailLoading &&
    (state.districtDetailDistrict || state.districtDetailNotFound)
  ) {
    return;
  }

  state.districtDetailSlug = normalizedSlug;
  state.districtDetailLoading = true;
  state.districtDetailError = null;
  state.districtDetailNotFound = false;
  renderApp();

  try {
    let resolvedDistrict = await FirestoreService.getDistrictBySlug(normalizedSlug);
    let resolvedDivision: Division | null = null;
    let siblingDistricts: District[] = [];
    let districtSpots: TouristSpot[] = [];
    let publishedArticles: Article[] = [];

    if (!resolvedDistrict) {
      // Check if Firestore districts collection is populated; only fall back to local official list if empty
      const allFsDistricts = await FirestoreService.getAllPublishedDistricts();
      if (allFsDistricts.length > 0) {
        cmsStore.districts = allFsDistricts;
        resolvedDistrict =
          allFsDistricts.find(
            d =>
              d.id.toLowerCase() === normalizedSlug ||
              (d.slug && d.slug.toLowerCase() === normalizedSlug)
          ) || null;
      } else {
        const localMatch = findDistrictBySlugOrId(normalizedSlug);
        if (localMatch && localMatch.is_published !== false) {
          resolvedDistrict = localMatch;
        }
      }
    }

    if (resolvedDistrict) {
      const distId = resolvedDistrict.id;
      const divId = resolvedDistrict.division_id;

      const [fsDiv, fsSiblings, fsSpots, fsArticles, fsCategories] = await Promise.all([
        FirestoreService.getDivisionBySlug(divId),
        FirestoreService.getDistrictsByDivision(divId),
        FirestoreService.getPublishedSpotsByDistrict(distId),
        FirestoreService.getPublishedArticles(),
        FirestoreService.getCollectionItems<Category>(COLLECTIONS.CATEGORIES, true)
      ]);

      resolvedDivision = fsDiv || findDivisionBySlugOrId(divId);

      if (fsSiblings.length > 0) {
        siblingDistricts = fsSiblings;
      } else {
        siblingDistricts = cmsStore.districts.filter(
          d => d.is_published !== false && d.division_id.toLowerCase() === divId.toLowerCase()
        );
      }

      if (fsSpots.length > 0) {
        districtSpots = fsSpots;
      } else {
        const allFsSpots = await FirestoreService.getCollectionItems<TouristSpot>(COLLECTIONS.TOURIST_SPOTS, true);
        if (allFsSpots.length === 0) {
          districtSpots = cmsStore.spots.filter(
            s =>
              s.is_published !== false &&
              (s.district_id.toLowerCase() === distId.toLowerCase() ||
                (!!resolvedDistrict?.slug && s.district_id.toLowerCase() === resolvedDistrict.slug.toLowerCase()))
          );
        } else {
          districtSpots = allFsSpots.filter(
            s =>
              s.district_id.toLowerCase() === distId.toLowerCase() ||
              (!!resolvedDistrict?.slug && s.district_id.toLowerCase() === resolvedDistrict.slug.toLowerCase())
          );
        }
      }

      publishedArticles = fsArticles.length > 0 ? fsArticles : cmsStore.articles.filter(a => a.is_published !== false);
      if (fsCategories.length > 0) {
        cmsStore.categories = fsCategories;
      }
    }

    if (!resolvedDistrict) {
      state.districtDetailDistrict = null;
      state.districtDetailDivision = null;
      state.districtDetailSiblingDistricts = [];
      state.districtDetailSpots = [];
      state.districtDetailArticles = [];
      state.districtDetailNotFound = true;
    } else {
      state.districtDetailDistrict = resolvedDistrict;
      state.districtDetailDivision = resolvedDivision;
      state.districtDetailSiblingDistricts = FirestoreService.normalizeDistrictAdministrativeDivision(siblingDistricts);
      state.districtDetailSpots = districtSpots;
      state.districtDetailArticles = publishedArticles;
      state.districtDetailNotFound = false;
    }
  } catch (err: any) {
    console.warn(`Could not load district details for "${normalizedSlug}":`, err);
    state.districtDetailError =
      err instanceof Error ? err.message : 'Unable to retrieve district details from Firestore.';
    state.districtDetailDistrict = null;
  } finally {
    state.districtDetailLoading = false;
    updateDynamicSeo();
    renderApp();
  }
}

// Helper to t() strings
function t(key: string): string {
  return getTranslation(key, state.lang);
}

// Save bookmarks
function toggleBookmark(spotId: string): void {
  if (state.bookmarkedIds.has(spotId)) {
    state.bookmarkedIds.delete(spotId);
  } else {
    state.bookmarkedIds.add(spotId);
  }
  localStorage.setItem('bd_tourism_bookmarks', JSON.stringify(Array.from(state.bookmarkedIds)));
  updateSavedBadgeCount();
  renderApp();
}

function updateSavedBadgeCount(): void {
  const badge = document.getElementById('saved-badge-count');
  if (badge) {
    badge.textContent = String(state.bookmarkedIds.size);
  }
}

function renderLayoutShell(): void {
  const navbarRoot = document.getElementById('navbar-root');
  if (navbarRoot) {
    navbarRoot.innerHTML = renderNavbar({
      lang: state.lang,
      activeNav: state.activeView,
      savedCount: state.bookmarkedIds.size
    });
    initializeNavbarEventListeners();
  }

  const footerRoot = document.getElementById('footer-root');
  if (footerRoot) {
    footerRoot.innerHTML = renderFooter(state.lang);
  }
}

// Switch Language and retain current view and context
function switchLanguage(): void {
  state.lang = state.lang === 'bn' ? 'en' : 'bn';
  setLanguagePreference(state.lang);
  document.body.className = state.lang === 'en' ? 'lang-en' : 'lang-bn';
  document.documentElement.lang = state.lang;
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
}

// Update static text in navbar and footer
function updateStaticNavbarTranslations(): void {
  const isBn = state.lang === 'bn';
  const brandTitle = document.getElementById('brand-title');
  const brandSubtitle = document.getElementById('brand-subtitle');
  if (brandTitle) brandTitle.textContent = isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh';
  if (brandSubtitle) brandSubtitle.textContent = isBn ? 'অফিসিয়াল পর্যটন পোর্টাল' : 'Official Tourism Portal';

  const navHome = document.getElementById('nav-item-home');
  const navDiv = document.getElementById('nav-item-divisions');
  const navDist = document.getElementById('nav-item-districts');
  const navSpots = document.getElementById('nav-item-spots');
  const navGuides = document.getElementById('nav-item-guides');
  const navPlanner = document.getElementById('nav-item-planner');
  const langBtnText = document.getElementById('lang-btn-text');
  const savedText = document.getElementById('label-saved-text');
  const adminText = document.getElementById('label-admin-text');

  const setNavLabel = (el: HTMLElement | null, text: string) => {
    if (!el) return;
    const span = el.querySelector('span');
    if (span) {
      span.textContent = text;
    } else {
      el.textContent = text;
    }
  };

  setNavLabel(navHome, t('nav_home'));
  setNavLabel(navDiv, t('nav_divisions'));
  setNavLabel(navDist, t('nav_districts'));
  setNavLabel(navSpots, t('nav_spots'));
  setNavLabel(navGuides, t('nav_guides'));
  setNavLabel(navPlanner, t('nav_planner'));
  if (langBtnText) langBtnText.textContent = isBn ? 'English' : 'বাংলা';
  if (savedText) savedText.textContent = isBn ? 'পছন্দ' : 'Saved';
  if (adminText) adminText.textContent = isBn ? 'সিএমএস অ্যাডমিন' : 'Admin CMS';

  // Footer translations
  const fBrand = document.getElementById('footer-brand-title');
  const fDesc = document.getElementById('footer-about-desc');
  const fNavH = document.getElementById('footer-nav-heading');
  const fEmH = document.getElementById('footer-emergency-title');
  const fDbH = document.getElementById('footer-db-status-title');
  const fCopy = document.getElementById('footer-copyright');

  if (fBrand) fBrand.textContent = isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh';
  if (fDesc) fDesc.textContent = t('footer_about_text');
  if (fNavH) fNavH.textContent = isBn ? 'গুরুত্বপূর্ণ লিংক' : 'Quick Navigation';
  if (fEmH) fEmH.textContent = t('footer_emergency_heading');
  if (fDbH) fDbH.textContent = isBn ? 'সিস্টেম ও ডাটাবেস' : 'System & Cloud Storage';
  if (fCopy) fCopy.textContent = t('copyright');
}

// Open Spot Details Modal with Deep Link & SEO integration
function openSpotModal(spotId: string, updateHash: boolean = true): void {
  const spot =
    state.divisionDetailSpots.find(s => s.id === spotId) ||
    state.districtDetailSpots.find(s => s.id === spotId) ||
    cmsStore.spots.find(s => s.id === spotId);
  if (!spot) return;

  const modalContainer = document.getElementById('spotModalContent');
  if (!modalContainer) return;

  const isBn = state.lang === 'bn';
  const division =
    (state.divisionDetailDivision?.id === spot.division_id ? state.divisionDetailDivision : null) ||
    (state.districtDetailDivision?.id === spot.division_id ? state.districtDetailDivision : null) ||
    cmsStore.divisions.find(d => d.id === spot.division_id || d.slug === spot.division_id);
  const district =
    state.divisionDetailDistricts.find(d => d.id === spot.district_id) ||
    (state.districtDetailDistrict?.id === spot.district_id ? state.districtDetailDistrict : null) ||
    cmsStore.districts.find(d => d.id === spot.district_id);
  const isBookmarked = state.bookmarkedIds.has(spot.id);

  if (updateHash) {
    history.replaceState(null, '', `#spot-${spot.id}`);
  }
  updateDynamicSeo(
    isBn ? spot.name_bn : spot.name_en,
    isBn ? spot.short_desc_bn : spot.short_desc_en,
    `spot-${spot.id}`
  );

  modalContainer.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <div>
        <span class="spot-modal-badge me-2 text-white bg-warning text-dark px-2 py-1 rounded">
          <i class="bi bi-geo-alt-fill me-1"></i>${escapeHtml(isBn ? district?.name_bn || '' : district?.name_en || '')}, ${escapeHtml(isBn ? division?.name_bn || '' : division?.name_en || '')}
        </span>
        ${typeof spot.rating === 'number' && Number.isFinite(spot.rating) && spot.rating > 0
          ? `<span class="text-white-50 small"><i class="bi bi-star-fill text-warning me-1"></i>${spot.rating} / 5.0</span>`
          : ''}
      </div>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <div class="position-relative" style="height: 320px; overflow: hidden; background: #222;">
      <img src="${optimizeImageUrl(spot.image_url, 1200)}" alt="${escapeHtml(isBn ? spot.name_bn : spot.name_en)}" class="w-100 h-100 object-fit-cover" loading="lazy" decoding="async">
      <div class="position-absolute bottom-0 start-0 end-0 p-3" style="background: linear-gradient(transparent, rgba(18, 60, 50, 0.95));">
        <h3 class="text-white fw-bold mb-1">${escapeHtml(isBn ? spot.name_bn : spot.name_en)}</h3>
        <p class="text-white-50 small mb-0">${escapeHtml(isBn ? spot.short_desc_bn : spot.short_desc_en)}</p>
      </div>
    </div>

    <div class="modal-body p-4">
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb small">
          <li class="breadcrumb-item"><a href="/" class="text-secondary-bd" data-bs-dismiss="modal">${t('nav_home')}</a></li>
          <li class="breadcrumb-item"><a href="/divisions/${division?.slug || division?.id || ''}/" class="text-secondary-bd" data-bs-dismiss="modal">${escapeHtml(isBn ? division?.name_bn || '' : division?.name_en || '')}</a></li>
          <li class="breadcrumb-item active" aria-current="page">${escapeHtml(isBn ? district?.name_bn || '' : district?.name_en || '')}</li>
        </ol>
      </nav>

      <div class="mb-4">
        <h5 class="fw-bold text-primary-bd mb-2"><i class="bi bi-card-text text-accent-bd me-2"></i>${t('overview_heading')}</h5>
        <p class="text-secondary">${escapeHtml(isBn ? spot.overview_bn : spot.overview_en)}</p>
      </div>

      <div class="mb-4">
        <h5 class="fw-bold text-primary-bd mb-2"><i class="bi bi-hourglass-split text-accent-bd me-2"></i>${t('history_heading')}</h5>
        <p class="text-secondary">${escapeHtml(isBn ? spot.history_bn : spot.history_en)}</p>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="p-3 rounded-3 bg-light border h-100">
            <h6 class="fw-bold text-primary-bd mb-2"><i class="bi bi-signpost-2 text-warning me-2"></i>${t('how_to_reach')}</h6>
            <p class="small text-secondary mb-0">${escapeHtml(isBn ? spot.how_to_go_bn : spot.how_to_go_en)}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-3 rounded-3 bg-light border h-100">
            <h6 class="fw-bold text-primary-bd mb-2"><i class="bi bi-calendar-check text-warning me-2"></i>${t('best_time')}</h6>
            <p class="small text-secondary mb-0">${escapeHtml(isBn ? spot.best_time_bn : spot.best_time_en)}</p>
          </div>
        </div>
      </div>

      <div class="p-3 rounded-3 bg-warning-subtle border border-warning mb-4">
        <h6 class="fw-bold text-dark mb-1"><i class="bi bi-lightbulb-fill text-warning me-2"></i>${t('travel_tips')}</h6>
        <p class="small text-dark mb-0">${escapeHtml(isBn ? spot.tips_bn : spot.tips_en)}</p>
      </div>

      ${spot.google_maps_url ? `
        <div class="mb-4">
          <a href="${escapeHtml(spot.google_maps_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-bd btn-sm">
            <i class="bi bi-map me-1"></i>${isBn ? 'গুগল ম্যাপসে অবস্থান দেখুন' : 'View on Google Maps'}
          </a>
        </div>
      ` : ''}

      ${spot.gallery_urls && spot.gallery_urls.length > 0 ? `
        <div class="mb-3">
          <h6 class="fw-bold text-primary-bd mb-2"><i class="bi bi-images text-accent-bd me-2"></i>${isBn ? 'ফটোগ্যালারি' : 'Photo Gallery'}</h6>
          <div class="row g-2">
            ${spot.gallery_urls.map(url => `
              <div class="col-6">
                <img src="${optimizeImageUrl(url, 600)}" class="rounded-3 w-100" style="height: 140px; object-fit: cover;" alt="${escapeHtml(isBn ? spot.name_bn : spot.name_en)} Gallery Photo" loading="lazy" decoding="async">
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <div class="modal-footer bg-light d-flex justify-content-between">
      <button class="btn btn-outline-danger btn-sm" id="modal-bookmark-btn">
        <i class="bi ${isBookmarked ? 'bi-heart-fill' : 'bi-heart'} me-1"></i>
        ${isBookmarked ? t('saved_place') : t('save_place')}
      </button>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" id="modal-share-btn">
          <i class="bi bi-share me-1"></i>${t('share_btn')}
        </button>
        <button type="button" class="btn btn-primary-bd btn-sm px-3" data-bs-dismiss="modal">
          ${t('close')}
        </button>
      </div>
    </div>
  `;

  document.getElementById('modal-bookmark-btn')?.addEventListener('click', () => {
    toggleBookmark(spot.id);
    openSpotModal(spot.id, false);
  });

  document.getElementById('modal-share-btn')?.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast(t('link_copied'), 'success');
    }
  });

  const modal = getBootstrapModal('spotDetailsModal');
  if (modal) modal.show();
}

// Open Travel Guide Article Modal
function openArticleModal(articleId: string): void {
  const article =
    state.divisionDetailArticles.find(a => a.id === articleId) ||
    state.districtDetailArticles.find(a => a.id === articleId) ||
    cmsStore.articles.find(a => a.id === articleId);
  if (!article) return;

  const modalContainer = document.getElementById('spotModalContent');
  if (!modalContainer) return;

  const isBn = state.lang === 'bn';
  const title = isBn ? article.title_bn : article.title_en;
  const excerpt = isBn ? article.excerpt_bn : article.excerpt_en;
  const content = isBn ? article.content_bn : article.content_en;
  const author = isBn ? article.author_bn : article.author_en;
  const readTime = isBn ? article.read_time_bn : article.read_time_en;

  modalContainer.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <span class="badge bg-warning text-dark px-2 py-1 rounded">
          <i class="bi bi-journal-richtext me-1"></i>${isBn ? 'ভ্রমণ গাইড' : 'Travel Guide'}
        </span>
        <span class="text-white-50 small"><i class="bi bi-clock me-1"></i>${escapeHtml(readTime)}</span>
      </div>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <div class="position-relative" style="height: 280px; overflow: hidden; background: #123C32;">
      <img src="${optimizeImageUrl(article.image_url, 1200)}" alt="${escapeHtml(title)}" class="w-100 h-100 object-fit-cover" loading="lazy" decoding="async">
      <div class="position-absolute bottom-0 start-0 end-0 p-3" style="background: linear-gradient(transparent, rgba(18, 60, 50, 0.95));">
        <h3 class="text-white fw-bold mb-1">${escapeHtml(title)}</h3>
        <div class="text-white-50 small">
          <i class="bi bi-person me-1"></i>${escapeHtml(author)} • ${escapeHtml(article.published_at || '')}
        </div>
      </div>
    </div>

    <div class="modal-body p-4">
      <p class="lead fs-6 fw-semibold text-primary-bd mb-3">${escapeHtml(excerpt)}</p>
      <div class="text-secondary mb-4" style="white-space: pre-line; line-height: 1.75;">${escapeHtml(content)}</div>

      ${article.tags && article.tags.length > 0 ? `
        <div class="d-flex flex-wrap gap-2">
          ${article.tags.map(tag => `<span class="badge bg-light text-secondary border">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
    </div>

    <div class="modal-footer bg-light d-flex justify-content-between">
      <button class="btn btn-outline-secondary btn-sm" id="article-modal-share-btn">
        <i class="bi bi-share me-1"></i>${t('share_btn')}
      </button>
      <button type="button" class="btn btn-primary-bd btn-sm px-3" data-bs-dismiss="modal">
        ${t('close')}
      </button>
    </div>
  `;

  document.getElementById('article-modal-share-btn')?.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast(t('link_copied'), 'success');
    }
  });

  const modal = getBootstrapModal('spotDetailsModal');
  if (modal) modal.show();
}

// Generate Trip Itinerary
function generateTripPlan(days: number, vibe: string): string {
  const isBn = state.lang === 'bn';
  if (days <= 3) {
    if (vibe === 'beach') {
      return isBn 
        ? `<strong>৩ দিনের সৈকত ও মেরিন ড্রাইভ ট্রিপ:</strong><br>
           • দিন ১: কক্সবাজার পৌঁছে কলাতলী ও লাবণী সৈকত দর্শন, সূর্যাস্ত উপভোগ।<br>
           • দিন ২: মেরিন ড্রাইভ ধরে হিমছড়ি ঝর্ণা ও ইনানী পাথুরে সৈকত ভ্রমণ।<br>
           • দিন ৩: রাখাইন মার্কেট ও স্থানীয় শুঁটকি বাজার পরিদর্শন শেষে প্রত্যাবর্তন।`
        : `<strong>3 Days Beach & Marine Drive Getaway:</strong><br>
           • Day 1: Arrive in Cox's Bazar, visit Laboni & Kolatoli beach, sunset stroll.<br>
           • Day 2: Drive the 80km Marine Drive to Himchari waterfalls & Inani coral stones.<br>
           • Day 3: Visit local Burmese market, seafood delicacies, and departure.`;
    } else if (vibe === 'hills') {
      return isBn
        ? `<strong>৩ দিনের সাজেক ভ্যালি মেঘযাত্রা:</strong><br>
           • দিন ১: খাগড়াছড়ি পৌঁছে চান্দের গাড়িতে সাজেক ভ্যালি যাত্রা, রুইলুই পাড়ায় সূর্যাস্ত।<br>
           • দিন ২: ভোরে হেলিপ্যাডে মেঘের সাগর দর্শন, কংলাক পাহাড় চূড়ায় ট্র্যাকিং।<br>
           • দিন ৩: আলুটিলা রহস্যময় গুহা ও রিছাং ঝর্ণা পরিদর্শন করে ফেরা।`
        : `<strong>3 Days Sajek Cloud Valley Retreat:</strong><br>
           • Day 1: Arrive in Khagrachhari, safari jeep to Sajek Valley, sunset at Ruilui.<br>
           • Day 2: Sunrise sea-of-clouds at Helipad, trek to Kanglak Para highest peak.<br>
           • Day 3: Explore mysterious Alutila Cave & Richhang waterfall before return.`;
    } else {
      return isBn
        ? `<strong>৩ দিনের শ্রীমঙ্গল চা বাগান ও বৃষ্টিবন:</strong><br>
           • দিন ১: ট্রেনে শ্রীমঙ্গল পৌঁছে ফিনলে চা বাগানের আঁকাবাঁকা মেঠোপথে সাইক্লিং।<br>
           • দিন ২: সকালে লাউয়াছড়া রেইনফরেস্টে ট্র্যাকিং ও নীলকণ্ঠের ৭ রঙের চা পরখ।<br>
           • দিন ৩: মাধবকুণ্ড জলপ্রপাত ও বাইক্কা বিলের জলজ পাখিরালয় ভ্রমণ।`
        : `<strong>3 Days Sreemangal Tea Estates & Rainforest:</strong><br>
           • Day 1: Train to Sreemangal, cycle through scenic tea garden paths.<br>
           • Day 2: Morning trek at Lawachara National Park & taste 7-layer tea.<br>
           • Day 3: Visit Madhabkunda waterfall & Baikka Beel wetland sanctuary.`;
    }
  } else {
    return isBn
      ? `<strong>৭ দিনের সোনালী বাংলাদেশ ট্র্যাকিং ও কালচারাল ট্যুর:</strong><br>
         • দিন ১-২: পুরান ঢাকা (লালবাগ কেল্লা, আহসান মঞ্জিল, তারা মসজিদ) ও সোনারগাঁও পানাম নগর।<br>
         • দিন ৩-৪: শ্রীমঙ্গলের চা বাগান, লাউয়াছড়া রেইনফরেস্ট এবং সিলেটের রাতারগুল সোয়াম্প ফরেস্ট।<br>
         • দিন ৫-৭: আইকনিক ট্রেনে কক্সবাজার, ইনানী প্রবাল সৈকত ও টেকনাফ মেরিন ড্রাইভ রোমাঞ্চ।`
      : `<strong>7 Days Golden Bangladesh Tour:</strong><br>
         • Day 1-2: Historic Old Dhaka (Lalbagh Fort, Ahsan Manzil) & Sonargaon Panam City.<br>
         • Day 3-4: Sreemangal tea estates, Lawachara rainforest & Ratargul swamp forest in Sylhet.<br>
         • Day 5-7: Scenic train to Cox's Bazar, Inani beach safari & Marine Drive exploration.`;
  }
}

function stopHeroCarousel(): void {
  if (heroCarouselTimer !== null) {
    window.clearInterval(heroCarouselTimer);
    heroCarouselTimer = null;
  }
}

function setHeroSlide(index: number): void {
  const total = HERO_SLIDES.length;
  const nextIndex = ((index % total) + total) % total;
  state.heroSlideIndex = nextIndex;

  const slides = document.querySelectorAll('#hero-carousel .hero-bg-slide');
  slides.forEach((el, idx) => {
    el.classList.toggle('active', idx === nextIndex);
  });

  const dots = document.querySelectorAll('#hero-carousel .hero-carousel-dot');
  dots.forEach((dot, idx) => {
    const isActive = idx === nextIndex;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  const captionEl = document.getElementById('hero-slide-caption');
  if (captionEl) {
    const slide = HERO_SLIDES[nextIndex];
    captionEl.textContent = state.lang === 'bn' ? slide.labelBn : slide.labelEn;
  }
}

function startHeroCarousel(): void {
  stopHeroCarousel();
  const carouselEl = document.getElementById('hero-carousel');
  if (!carouselEl) return;

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  heroCarouselTimer = window.setInterval(() => {
    if (!heroCarouselPaused && document.getElementById('hero-carousel')) {
      setHeroSlide(state.heroSlideIndex + 1);
    }
  }, 4500);
}

// ============================================================================
// MAIN RENDER FUNCTION (Handles Portal vs CMS)
// ============================================================================
function renderApp(): void {
  const root = document.getElementById('app-root');
  if (!root) return;

  stopHeroCarousel();
  const isBn = state.lang === 'bn';

  // 1. Render CMS Dashboard if activeView is 'cms'
  if (state.activeView === 'cms') {
    root.innerHTML = renderCmsDashboard(
      state.lang, 
      () => {
        state.activeView = 'home';
        navigateToPath('/');
        renderLayoutShell();
        renderApp();
      },
      () => renderApp()
    );
    attachCmsEventListeners();
    return;
  }

  // 2. Render Dedicated All Divisions Page (/divisions/)
  if (state.activeView === 'divisions') {
    root.innerHTML = renderAllDivisionsPage({
      lang: state.lang,
      divisions: cmsStore.divisions,
      districts: cmsStore.districts,
      spots: cmsStore.spots,
      categories: cmsStore.categories,
      bookmarkedIds: state.bookmarkedIds,
      searchQuery: state.divisionsSearchQuery,
      isLoading: state.firestoreLoading,
      error: state.firestoreError
    });
    attachDivisionsPageEventListeners();
    return;
  }

  // 3. Render Dedicated Division Details Page (/divisions/:slug/)
  if (state.activeView === 'division-detail') {
    root.innerHTML = renderDivisionDetailPage({
      lang: state.lang,
      requestedSlug: state.selectedDivisionId || state.divisionDetailSlug || '',
      division: state.divisionDetailDivision,
      districts: state.divisionDetailDistricts,
      spots: state.divisionDetailSpots,
      categories: cmsStore.categories,
      articles: state.divisionDetailArticles,
      bookmarkedIds: state.bookmarkedIds,
      selectedDistrictFilterId: state.divisionDetailDistrictFilterId,
      isLoading: state.divisionDetailLoading,
      error: state.divisionDetailError
    });
    attachDivisionsPageEventListeners();
    return;
  }

  // 4. Render Dedicated All 64 Districts Directory Page (/districts/)
  if (state.activeView === 'districts') {
    root.innerHTML = renderAllDistrictsPage({
      lang: state.lang,
      divisions: cmsStore.divisions,
      districts: cmsStore.districts,
      spots: cmsStore.spots,
      searchQuery: state.districtsSearchQuery,
      divisionFilter: state.districtsDivisionFilter,
      currentPage: state.districtsCurrentPage,
      isLoading: state.firestoreLoading,
      error: state.firestoreError
    });
    attachDistrictsPageEventListeners();
    return;
  }

  // 5. Render Dedicated Dynamic District Details Page (/districts/:slug/)
  if (state.activeView === 'district-detail') {
    root.innerHTML = renderDistrictDetailPage({
      lang: state.lang,
      requestedSlug: state.selectedDistrictId || state.districtDetailSlug || '',
      district: state.districtDetailDistrict,
      division: state.districtDetailDivision,
      siblingDistricts: state.districtDetailSiblingDistricts,
      spots: state.districtDetailSpots,
      categories: cmsStore.categories,
      articles: state.districtDetailArticles,
      bookmarkedIds: state.bookmarkedIds,
      isLoading: state.districtDetailLoading,
      error: state.districtDetailError
    });
    attachDistrictDetailPageEventListeners();
    return;
  }

  // 6. Render Dedicated All Tourist Destinations Directory (/places/)
  if (state.activeView === 'spots') {
    root.innerHTML = renderAllPlacesPage({
      lang: state.lang,
      divisions: cmsStore.divisions,
      districts: cmsStore.districts,
      categories: cmsStore.categories,
      spots: cmsStore.spots,
      bookmarkedIds: state.bookmarkedIds,
      searchQuery: state.placesSearchQuery,
      divisionFilter: state.placesDivisionFilter,
      districtFilter: state.placesDistrictFilter,
      categoryFilter: state.placesCategoryFilter,
      currentPage: state.placesCurrentPage,
      isLoading: state.firestoreLoading,
      error: state.firestoreError
    });
    attachPlacesPageEventListeners();
    return;
  }

  // 2. Otherwise Render Public Portal (Read directly from CMS Store, respecting published status!)
  const publishedDivisions = cmsStore.divisions.filter(d => d.is_published);
  const publishedDistricts = cmsStore.districts.filter(d => d.is_published);
  const publishedSpots = cmsStore.spots.filter(s => s.is_published);
  const publishedArticles = cmsStore.articles.filter(a => a.is_published);
  const publishedCategories = cmsStore.categories.filter(c => c.is_published);

  // Filter Spots based on search, division, and category
  let filteredSpots = publishedSpots.filter(spot => {
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      const matchName = spot.name_en.toLowerCase().includes(q) || spot.name_bn.toLowerCase().includes(q);
      const matchDesc = spot.short_desc_en.toLowerCase().includes(q) || spot.short_desc_bn.toLowerCase().includes(q);
      const division = cmsStore.divisions.find(d => d.id === spot.division_id);
      const district = cmsStore.districts.find(d => d.id === spot.district_id);
      const matchGeo = (division?.name_en.toLowerCase().includes(q) || division?.name_bn.toLowerCase().includes(q)) ||
                       (district?.name_en.toLowerCase().includes(q) || district?.name_bn.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchGeo) return false;
    }
    if (state.divisionFilter !== 'all' && spot.division_id !== state.divisionFilter) {
      return false;
    }
    if (state.categoryFilter !== 'all' && !spot.category_ids.includes(state.categoryFilter)) {
      return false;
    }
    if (state.activeView === 'saved' && !state.bookmarkedIds.has(spot.id)) {
      return false;
    }
    return true;
  });

  // Filter Districts
  let filteredDistricts = publishedDistricts.filter(dist => {
    if (state.activeDistrictTabDivision !== 'all' && dist.division_id !== state.activeDistrictTabDivision) {
      return false;
    }
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      const matchName = dist.name_en.toLowerCase().includes(q) || dist.name_bn.toLowerCase().includes(q);
      const matchFamous = dist.famous_for_en.toLowerCase().includes(q) || dist.famous_for_bn.toLowerCase().includes(q);
      if (!matchName && !matchFamous) return false;
    }
    return true;
  });

  // Render Public Portal HTML
  root.innerHTML = `
    <!-- Hero Section with Sliding Background Carousel -->
    <section class="hero-wrapper hero-with-carousel" id="hero-carousel">
      <div class="hero-bg-slides" aria-hidden="true">
        ${HERO_SLIDES.map((slide, idx) => `
          <div class="hero-bg-slide ${idx === state.heroSlideIndex ? 'active' : ''}">
            <img
              src="${optimizeImageUrl(slide.imageUrl, 1600)}"
              alt="${escapeHtml(isBn ? slide.labelBn : slide.labelEn)}"
              class="hero-bg-img"
              loading="${idx === 0 || idx === state.heroSlideIndex ? 'eager' : 'lazy'}"
              decoding="async"
              onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80';"
            >
          </div>
        `).join('')}
      </div>

      <div class="container hero-content-layer">
        <div class="row align-items-end g-4">
          <div class="col-lg-8">
            <div class="hero-pill-badge">
              <i class="bi bi-compass"></i>
              <span>${t('hero_badge')}</span>
            </div>
            <h1 class="hero-title mb-3">
              ${t('hero_title_1')}<br>
              <span>${t('hero_title_2')}</span>
            </h1>
            <p class="hero-subtitle mb-4">
              ${t('hero_subtitle')}
            </p>

            <div class="d-flex flex-wrap gap-2">
              <a href="/divisions/" class="btn btn-accent px-4 py-2 rounded-pill" id="hero-btn-divisions">
                <i class="bi bi-grid-fill me-2"></i>${t('nav_divisions')}
              </a>
              <a href="/districts/" class="btn btn-outline-light px-4 py-2 rounded-pill" id="hero-btn-districts">
                <i class="bi bi-geo-alt-fill me-2"></i>${t('nav_districts')}
              </a>
              <button class="btn btn-warning px-4 py-2 rounded-pill text-dark fw-bold" id="hero-btn-cms">
                <i class="bi bi-gear-fill me-2"></i>${isBn ? 'সিএমএস অ্যাডমিন পোর্টাল' : 'Open CMS Portal'}
              </button>
            </div>
          </div>

          <div class="col-lg-4 d-flex flex-column align-items-lg-end gap-2">
            <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill" style="background: rgba(18, 60, 50, 0.72); border: 1px solid rgba(255, 255, 255, 0.2);">
              <i class="bi bi-geo-alt-fill text-warning small"></i>
              <span class="hero-slide-caption" id="hero-slide-caption">
                ${escapeHtml(isBn ? HERO_SLIDES[state.heroSlideIndex].labelBn : HERO_SLIDES[state.heroSlideIndex].labelEn)}
              </span>
            </div>

            <div class="hero-carousel-controls" role="region" aria-label="${isBn ? 'হিরো ইমেজ স্লাইডার' : 'Hero image carousel controls'}">
              <button type="button" class="hero-carousel-nav-btn" id="hero-prev-btn" aria-label="${isBn ? 'আগের ছবি' : 'Previous slide'}">
                <i class="bi bi-chevron-left"></i>
              </button>
              <div class="hero-carousel-dots">
                ${HERO_SLIDES.map((slide, idx) => `
                  <button
                    type="button"
                    class="hero-carousel-dot ${idx === state.heroSlideIndex ? 'active' : ''}"
                    data-hero-slide="${idx}"
                    aria-label="${escapeHtml(isBn ? slide.labelBn : slide.labelEn)}"
                    aria-current="${idx === state.heroSlideIndex ? 'true' : 'false'}"
                  ></button>
                `).join('')}
              </div>
              <button type="button" class="hero-carousel-nav-btn" id="hero-next-btn" aria-label="${isBn ? 'পরের ছবি' : 'Next slide'}">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Floating Global Search & Filter Bar Component -->
    <div class="container">
      <div class="search-card-wrapper">
        <div class="row g-3 align-items-center">
          <div class="col-lg-6">
            <div class="search-input-group">
              <i class="bi bi-search search-icon-inside"></i>
              <input 
                type="text" 
                class="form-control" 
                id="global-search-input" 
                placeholder="${t('search_placeholder')}" 
                value="${state.searchQuery}"
              >
            </div>
          </div>
          <div class="col-sm-6 col-lg-3">
            <select class="form-select" id="filter-division-select" style="padding: 0.75rem 1rem; border-radius: 10px;">
              <option value="all">${t('filter_all_divisions')}</option>
              ${publishedDivisions.map(d => `
                <option value="${d.id}" ${state.divisionFilter === d.id ? 'selected' : ''}>
                  ${isBn ? d.name_bn : d.name_en} (${d.districts_count} ${t('districts_count_label')})
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-sm-6 col-lg-3">
            <select class="form-select" id="filter-category-select" style="padding: 0.75rem 1rem; border-radius: 10px;">
              <option value="all">${t('filter_all_categories')}</option>
              ${publishedCategories.map(c => `
                <option value="${c.id}" ${state.categoryFilter === c.id ? 'selected' : ''}>
                  ${isBn ? c.name_bn : c.name_en}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Category Pills Bar -->
        <div class="d-flex align-items-center gap-2 overflow-x-auto pb-1 mt-3" style="scrollbar-width: thin;">
          <button class="filter-pill ${state.categoryFilter === 'all' ? 'active' : ''}" data-cat-filter="all">
            <i class="bi bi-stars"></i> ${t('filter_all_categories')}
          </button>
          ${publishedCategories.map(c => renderCategoryPill({
            category: c,
            isActive: state.categoryFilter === c.id,
            lang: state.lang
          })).join('')}
        </div>
      </div>
    </div>

    <!-- Official Administrative Stats Banner -->
    <section class="container my-5">
      <div class="stats-banner shadow-sm">
        <div class="row g-4 text-center">
          <div class="col-6 col-md-3">
            <div class="stat-number">${publishedDivisions.length}</div>
            <div class="fw-semibold mt-1">${t('stat_divisions')}</div>
            <small class="text-white-50">Divisions</small>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-number">${publishedDistricts.length}</div>
            <div class="fw-semibold mt-1">${t('stat_districts')}</div>
            <small class="text-white-50">Districts</small>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-number">${publishedSpots.length}</div>
            <div class="fw-semibold mt-1">${t('stat_spots')}</div>
            <small class="text-white-50">Curated Spots</small>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-number">১২০+</div>
            <div class="fw-semibold mt-1">${t('stat_beach')}</div>
            <small class="text-white-50">Cox's Bazar Beach</small>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 1: Administrative Divisions -->
    <section class="container py-4" id="divisions">
      <div class="d-flex justify-content-between align-items-end mb-4">
        <div>
          <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'প্রশাসনিক কাঠামো' : 'Official Administrative Structure'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">${t('section_divisions_title')}</h2>
          <p class="text-muted mb-0">${t('section_divisions_desc')}</p>
        </div>
      </div>

      <div class="row g-4">
        ${publishedDivisions.map(div => renderDivisionCard({
          division: div,
          lang: state.lang
        })).join('')}
      </div>
    </section>

    <!-- SECTION 2: Top Attractions / Filtered Spots -->
    <section class="container py-5" id="spots">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 rounded-pill mb-2">
            ${state.activeView === 'saved' ? (isBn ? 'সংরক্ষিত স্থানসমূহ' : 'Saved Collection') : (isBn ? 'অনুপম গন্তব্য' : 'Featured Destinations')}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${state.activeView === 'saved' ? t('nav_saved') : t('section_featured_spots_title')}
          </h2>
          <p class="text-muted mb-0">${t('section_featured_spots_desc')}</p>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span class="text-secondary small fw-semibold">
            ${isBn ? `মোট ${filteredSpots.length}টি স্থান প্রদর্শিত` : `Showing ${filteredSpots.length} attractions`}
          </span>
          <a href="/places/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
            <i class="bi bi-compass me-1"></i>${isBn ? 'সকল দর্শনীয় স্থান' : 'All Destinations'}
          </a>
        </div>
      </div>

      ${filteredSpots.length === 0 ? `
        <div class="text-center py-5 bg-white rounded-4 border p-4 my-3">
          <i class="bi bi-compass text-muted" style="font-size: 3.5rem;"></i>
          <h4 class="fw-bold text-primary-bd mt-3">${t('no_results_title')}</h4>
          <p class="text-muted max-w-md mx-auto">${t('no_results_desc')}</p>
          <button class="btn btn-outline-bd btn-sm px-4" id="reset-filters-btn">
            ${t('clear_search')}
          </button>
        </div>
      ` : `
        <div class="row g-4">
          ${filteredSpots.map(spot => {
            const division = cmsStore.divisions.find(d => d.id === spot.division_id || d.slug === spot.division_id);
            const district = cmsStore.districts.find(d => d.id === spot.district_id || d.slug === spot.district_id);
            const category = cmsStore.categories.find(c => spot.category_ids?.includes(c.id));
            const isBookmarked = state.bookmarkedIds.has(spot.id);
            return renderDestinationCard({
              spot,
              division,
              district,
              category,
              isBookmarked,
              lang: state.lang
            });
          }).join('')}
        </div>
      `}
    </section>

    <!-- SECTION 3: All Districts Directory (Organized by Division Tabs) -->
    <section class="container py-5" id="districts">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-primary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'বাংলাদেশের ৬৪ জেলা' : '64 Districts of Bangladesh'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">${t('section_districts_title')}</h2>
          <p class="text-muted mb-0">${t('section_districts_desc')}</p>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span class="text-muted small">
            ${isBn ? `প্রদর্শিত জেলা: ${filteredDistricts.length} / ${publishedDistricts.length}` : `Districts showing: ${filteredDistricts.length} / ${publishedDistricts.length}`}
          </span>
          <a href="/districts/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
            <i class="bi bi-grid-3x3-gap-fill me-1"></i>${isBn ? 'সকল ৬৪ জেলা পাতা' : 'Full Directory'}
          </a>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2 overflow-x-auto pb-2 mb-4" style="scrollbar-width: thin;">
        <button class="filter-pill ${state.activeDistrictTabDivision === 'all' ? 'active' : ''}" data-dist-tab="all">
          ${t('filter_all_divisions')} (${publishedDistricts.length})
        </button>
        ${publishedDivisions.map(d => {
          const count = publishedDistricts.filter(dist => dist.division_id === d.id).length;
          return `
            <button class="filter-pill ${state.activeDistrictTabDivision === d.id ? 'active' : ''}" data-dist-tab="${d.id}">
              ${isBn ? d.name_bn : d.name_en} (${count})
            </button>
          `;
        }).join('')}
      </div>

      <div class="row g-3">
        ${filteredDistricts.map(dist => {
          const div = cmsStore.divisions.find(d => d.id === dist.division_id);
          const spotsInDist = publishedSpots.filter(s => s.district_id === dist.id).length;
          return renderDistrictCard({
            district: dist,
            division: div,
            spotCount: spotsInDist,
            lang: state.lang
          });
        }).join('')}
      </div>
    </section>

    <!-- SECTION 4: Interactive Smart Trip Planner -->
    <section class="container py-5" id="planner">
      <div class="p-4 p-md-5 rounded-4 shadow-sm border bg-white">
        <div class="row g-4 align-items-center">
          <div class="col-lg-5">
            <span class="badge bg-warning text-dark px-3 py-1 rounded-pill mb-2 fw-semibold">
              <i class="bi bi-map-fill me-1"></i>${t('planner_title')}
            </span>
            <h2 class="fw-bold text-primary-bd mb-2">${t('planner_title')}</h2>
            <p class="text-secondary mb-4">${t('planner_desc')}</p>

            <form id="trip-planner-form">
              <div class="mb-3">
                <label class="form-label fw-bold text-primary-bd small">${t('planner_days')}</label>
                <select class="form-select" id="planner-days-select">
                  <option value="3">${isBn ? '৩ দিন (সাপ্তাহিক ছুটি)' : '3 Days (Weekend Short Trip)'}</option>
                  <option value="7" selected>${isBn ? '৭ দিন (গোল্ডেন রুট)' : '7 Days (Golden Route)'}</option>
                  <option value="10">${isBn ? '১০ দিন (সম্পূর্ণ বাংলাদেশ দর্শন)' : '10 Days (Grand Bangladesh Tour)'}</option>
                </select>
              </div>

              <div class="mb-4">
                <label class="form-label fw-bold text-primary-bd small">${t('planner_vibe')}</label>
                <select class="form-select" id="planner-vibe-select">
                  <option value="beach">${t('vibe_beach')}</option>
                  <option value="hills">${t('vibe_hills')}</option>
                  <option value="nature" selected>${t('vibe_nature')}</option>
                  <option value="heritage">${t('vibe_heritage')}</option>
                </select>
              </div>

              <button type="submit" class="btn btn-primary-bd w-100 py-2">
                <i class="bi bi-lightning-charge-fill me-1"></i>${t('generate_plan')}
              </button>
            </form>
          </div>

          <div class="col-lg-7">
            <div class="p-4 rounded-3 bg-light border h-100 d-flex flex-column justify-content-center">
              <h5 class="fw-bold text-primary-bd mb-3">
                <i class="bi bi-journal-bookmark-fill text-warning me-2"></i>
                ${isBn ? 'প্রস্তাবিত ভ্রমণ পথ ও রুটিন' : 'Recommended Route & Plan'}
              </h5>
              <div id="planner-output-box" class="p-3 rounded bg-white border">
                ${state.itineraryResult || generateTripPlan(7, 'nature')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 5: Travel Guides & Articles -->
    <section class="container py-5" id="guides">
      <div class="d-flex justify-content-between align-items-end mb-4">
        <div>
          <span class="badge bg-secondary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'ভ্রমণ ব্লগ ও ফিচার' : 'Featured Articles'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">${t('section_guides_title')}</h2>
          <p class="text-muted mb-0">${t('section_guides_desc')}</p>
        </div>
      </div>

      <div class="row g-4">
        ${publishedArticles.map(art => `
          <div class="col-lg-4 col-md-6">
            <div class="card-travel">
              <div class="card-travel-img-box" style="height: 180px;">
                <img src="${optimizeImageUrl(art.image_url, 600)}" alt="${escapeHtml(isBn ? art.title_bn : art.title_en)}" class="card-travel-img" loading="lazy" decoding="async">
                <span class="card-badge-rating">
                  <i class="bi bi-clock me-1"></i>${escapeHtml(isBn ? art.read_time_bn : art.read_time_en)}
                </span>
              </div>
              <div class="card-travel-body">
                <div class="small text-muted mb-2">
                  <i class="bi bi-person me-1"></i>${escapeHtml(isBn ? art.author_bn : art.author_en)}
                </div>
                <h5 class="card-travel-title" style="font-size: 1.1rem;">
                  ${escapeHtml(isBn ? art.title_bn : art.title_en)}
                </h5>
                <p class="card-travel-desc small">${escapeHtml(isBn ? art.excerpt_bn : art.excerpt_en)}</p>
                <div class="d-flex flex-wrap gap-1 mt-auto">
                  ${art.tags.map(tag => `<span class="badge bg-light text-secondary border small">${escapeHtml(tag)}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  attachPublicPortalEventListeners();
}

// Attach Event Listeners to Public Portal
function attachPublicPortalEventListeners(): void {
  // Hero Carousel controls & auto-slide
  const heroCarousel = document.getElementById('hero-carousel');
  if (heroCarousel) {
    startHeroCarousel();
    heroCarousel.addEventListener('mouseenter', () => { heroCarouselPaused = true; });
    heroCarousel.addEventListener('mouseleave', () => { heroCarouselPaused = false; });

    document.getElementById('hero-prev-btn')?.addEventListener('click', () => {
      setHeroSlide(state.heroSlideIndex - 1);
      startHeroCarousel();
    });
    document.getElementById('hero-next-btn')?.addEventListener('click', () => {
      setHeroSlide(state.heroSlideIndex + 1);
      startHeroCarousel();
    });
    heroCarousel.querySelectorAll('[data-hero-slide]').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-hero-slide') || '0', 10);
        setHeroSlide(idx);
        startHeroCarousel();
      });
    });
  }

  // Global Search input
  const searchInput = document.getElementById('global-search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = (e.target as HTMLInputElement).value;
      renderApp();
      const newSearchInput = document.getElementById('global-search-input') as HTMLInputElement;
      if (newSearchInput) {
        newSearchInput.focus();
        newSearchInput.setSelectionRange(newSearchInput.value.length, newSearchInput.value.length);
      }
    });
  }

  // Hero CMS button
  document.getElementById('hero-btn-cms')?.addEventListener('click', () => {
    state.activeView = 'cms';
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Division select filter
  const divSelect = document.getElementById('filter-division-select') as HTMLSelectElement;
  if (divSelect) {
    divSelect.addEventListener('change', (e) => {
      state.divisionFilter = (e.target as HTMLSelectElement).value;
      renderApp();
    });
  }

  // Category select filter
  const catSelect = document.getElementById('filter-category-select') as HTMLSelectElement;
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      state.categoryFilter = (e.target as HTMLSelectElement).value;
      renderApp();
    });
  }

  // Category Pills filter
  document.querySelectorAll('[data-cat-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat-filter') || 'all';
      state.categoryFilter = cat;
      renderApp();
    });
  });

  // Hero 8 Divisions CTA
  document.getElementById('hero-btn-divisions')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAllDivisionsPage();
  });

  // Division Card Click Action -> Open Division Details Page
  document.querySelectorAll('.division-card-action').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const divSlug = card.getAttribute('data-division-slug') || card.getAttribute('data-division-id');
      if (divSlug) {
        openDivisionDetailPage(divSlug);
      }
    });
  });

  // District tabs
  document.querySelectorAll('[data-dist-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const divId = tab.getAttribute('data-dist-tab') || 'all';
      state.activeDistrictTabDivision = divId;
      renderApp();
    });
  });

  // District Explore spots click
  document.querySelectorAll('.district-explore-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const distId = btn.getAttribute('data-district-id');
      const dist = cmsStore.districts.find(d => d.id === distId);
      if (dist) {
        state.searchQuery = state.lang === 'bn' ? dist.name_bn : dist.name_en;
        renderApp();
        const spotsSection = document.getElementById('spots');
        if (spotsSection) spotsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Spot details modal buttons
  document.querySelectorAll('.spot-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const spotId = btn.getAttribute('data-spot-id');
      if (spotId) openSpotModal(spotId);
    });
  });

  // Spot bookmark buttons
  document.querySelectorAll('[data-spot-bookmark]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spotId = btn.getAttribute('data-spot-bookmark');
      if (spotId) toggleBookmark(spotId);
    });
  });

  // Reset filters button
  document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
    state.searchQuery = '';
    state.divisionFilter = 'all';
    state.categoryFilter = 'all';
    state.activeView = 'home';
    renderApp();
  });

  // Trip planner form submission
  document.getElementById('trip-planner-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const daysSelect = document.getElementById('planner-days-select') as HTMLSelectElement;
    const vibeSelect = document.getElementById('planner-vibe-select') as HTMLSelectElement;
    const days = parseInt(daysSelect?.value || '7', 10);
    const vibe = vibeSelect?.value || 'nature';
    state.itineraryResult = generateTripPlan(days, vibe);
    const outBox = document.getElementById('planner-output-box');
    if (outBox) {
      outBox.innerHTML = state.itineraryResult;
    }
  });
}

// ============================================================================
// ATTACH CMS DASHBOARD & CRUD EVENT LISTENERS (MODULES 1 TO 6)
// ============================================================================
function attachCmsEventListeners(): void {
  // Exit CMS button
  document.getElementById('cms-exit-btn')?.addEventListener('click', () => {
    state.activeView = 'home';
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Tab switching
  document.querySelectorAll('[data-cms-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-cms-tab') as CmsTab;
      cmsStore.activeTab = tab;
      cmsStore.searchQuery = '';
      cmsStore.currentPage = 1;
      cmsStore.filterDivision = 'all';
      cmsStore.filterCategory = 'all';
      renderApp();
    });
  });

  // Quick Action triggers in Overview
  document.querySelectorAll('[data-quick-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.getAttribute('data-quick-action');
      if (act === 'add-division') openDivisionFormModal(undefined, state.lang, renderApp);
      if (act === 'add-district') openDistrictFormModal(undefined, state.lang, renderApp);
      if (act === 'add-spot') openSpotFormModal(undefined, state.lang, renderApp);
      if (act === 'add-article') openArticleFormModal(undefined, state.lang, renderApp);
      if (act === 'add-media') openMediaUploadModal(state.lang, renderApp);
    });
  });

  // Search input in table
  const searchInput = document.getElementById('cms-search-input') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    cmsStore.searchQuery = (e.target as HTMLInputElement).value;
    cmsStore.currentPage = 1;
    renderApp();
    const newIn = document.getElementById('cms-search-input') as HTMLInputElement;
    if (newIn) {
      newIn.focus();
      newIn.setSelectionRange(newIn.value.length, newIn.value.length);
    }
  });

  // Table filters
  const divFilter = document.getElementById('cms-filter-division') as HTMLSelectElement;
  divFilter?.addEventListener('change', () => {
    cmsStore.filterDivision = divFilter.value;
    cmsStore.currentPage = 1;
    renderApp();
  });

  const catFilter = document.getElementById('cms-filter-category') as HTMLSelectElement;
  catFilter?.addEventListener('change', () => {
    cmsStore.filterCategory = catFilter.value;
    cmsStore.currentPage = 1;
    renderApp();
  });

  // Pagination Prev/Next
  document.getElementById('cms-btn-prev')?.addEventListener('click', () => {
    if (cmsStore.currentPage > 1) {
      cmsStore.currentPage--;
      renderApp();
    }
  });

  document.getElementById('cms-btn-next')?.addEventListener('click', () => {
    cmsStore.currentPage++;
    renderApp();
  });

  // --------------------------------------------------------------------------
  // Module 1: Division CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-division')?.addEventListener('click', () => {
    openDivisionFormModal(undefined, state.lang, renderApp);
  });

  document.querySelectorAll('[data-edit-division]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-division');
      const div = cmsStore.divisions.find(d => d.id === id);
      if (div) openDivisionFormModal(div, state.lang, renderApp);
    });
  });

  document.querySelectorAll('[data-toggle-division]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-toggle-division');
      const div = cmsStore.divisions.find(d => d.id === id);
      if (div) {
        div.is_published = !div.is_published;
        await saveDivision(div);
        showToast(`Division "${div.name_en}" is now ${div.is_published ? 'Published' : 'Draft'}.`, 'success');
        renderApp();
      }
    });
  });

  document.querySelectorAll('[data-delete-division]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-division');
      const div = cmsStore.divisions.find(d => d.id === id);
      if (!div) return;

      // Check relationship against districts
      const childDistricts = cmsStore.districts.filter(d => d.division_id === div.id);
      if (childDistricts.length > 0) {
        const names = childDistricts.map(d => d.name_en).slice(0, 4).join(', ');
        const extra = childDistricts.length > 4 ? ` and ${childDistricts.length - 4} more` : '';
        showConfirmModal({
          title: 'Deletion Blocked: Relational Dependency',
          message: `Cannot delete division "${div.name_en}" because ${childDistricts.length} official districts depend on it (${names}${extra}). Please reassign or delete these districts first to prevent orphaned records.`,
          isBlocked: true,
          lang: state.lang
        });
      } else {
        showConfirmModal({
          title: 'Delete Division',
          message: `Are you sure you want to permanently delete division "${div.name_en}" (${div.name_bn})? This action cannot be undone.`,
          lang: state.lang,
          onConfirm: async () => {
            const res = await deleteDivision(div.id);
            if (res.success) {
              showToast(`Division "${div.name_en}" deleted successfully.`, 'success');
              renderApp();
            } else {
              showToast(res.message || 'Could not delete division', 'error');
            }
          }
        });
      }
    });
  });

  // --------------------------------------------------------------------------
  // Module 2: District CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-district')?.addEventListener('click', () => {
    openDistrictFormModal(undefined, state.lang, renderApp);
  });

  document.querySelectorAll('[data-edit-district]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-district');
      const dist = cmsStore.districts.find(d => d.id === id);
      if (dist) openDistrictFormModal(dist, state.lang, renderApp);
    });
  });

  document.querySelectorAll('[data-toggle-district]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-toggle-district');
      const dist = cmsStore.districts.find(d => d.id === id);
      if (dist) {
        dist.is_published = !dist.is_published;
        await saveDistrict(dist);
        showToast(`District "${dist.name_en}" is now ${dist.is_published ? 'Published' : 'Draft'}.`, 'success');
        renderApp();
      }
    });
  });

  document.querySelectorAll('[data-delete-district]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-district');
      const dist = cmsStore.districts.find(d => d.id === id);
      if (!dist) return;

      const childSpots = cmsStore.spots.filter(s => s.district_id === dist.id);
      if (childSpots.length > 0) {
        const names = childSpots.map(s => s.name_en).slice(0, 3).join(', ');
        showConfirmModal({
          title: 'Deletion Blocked: Relational Dependency',
          message: `Cannot delete district "${dist.name_en}" because ${childSpots.length} tourist spot(s) are located in it (${names}). Please delete or reassign these tourist destinations first.`,
          isBlocked: true,
          lang: state.lang
        });
      } else {
        showConfirmModal({
          title: 'Delete District',
          message: `Are you sure you want to permanently delete district "${dist.name_en}"?`,
          lang: state.lang,
          onConfirm: async () => {
            const res = await deleteDistrict(dist.id);
            if (res.success) {
              showToast(`District "${dist.name_en}" deleted.`, 'success');
              renderApp();
            } else {
              showToast(res.message || 'Error deleting district', 'error');
            }
          }
        });
      }
    });
  });

  // --------------------------------------------------------------------------
  // Module 3: Category CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-category')?.addEventListener('click', () => {
    openCategoryFormModal(undefined, state.lang, renderApp);
  });

  document.querySelectorAll('[data-edit-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-category');
      const cat = cmsStore.categories.find(c => c.id === id);
      if (cat) openCategoryFormModal(cat, state.lang, renderApp);
    });
  });

  document.querySelectorAll('[data-toggle-category]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-toggle-category');
      const cat = cmsStore.categories.find(c => c.id === id);
      if (cat) {
        cat.is_published = !cat.is_published;
        await saveCategory(cat);
        showToast(`Category "${cat.name_en}" status updated.`, 'success');
        renderApp();
      }
    });
  });

  document.querySelectorAll('[data-delete-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-category');
      const cat = cmsStore.categories.find(c => c.id === id);
      if (!cat) return;

      const linkedSpots = cmsStore.spots.filter(s => s.category_ids && s.category_ids.includes(cat.id));
      if (linkedSpots.length > 0) {
        showConfirmModal({
          title: 'Deletion Blocked: Active Reference',
          message: `Cannot delete category "${cat.name_en}" because ${linkedSpots.length} tourist spot(s) are assigned to it. Please remove this category assignment from the spots first.`,
          isBlocked: true,
          lang: state.lang
        });
      } else {
        showConfirmModal({
          title: 'Delete Category',
          message: `Are you sure you want to delete category "${cat.name_en}"?`,
          lang: state.lang,
          onConfirm: async () => {
            await deleteCategory(cat.id);
            showToast(`Category "${cat.name_en}" deleted.`, 'success');
            renderApp();
          }
        });
      }
    });
  });

  // --------------------------------------------------------------------------
  // Module 4: Tourist Spot CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-spot')?.addEventListener('click', () => {
    openSpotFormModal(undefined, state.lang, renderApp);
  });

  document.querySelectorAll('[data-edit-spot]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-spot');
      const spot = cmsStore.spots.find(s => s.id === id);
      if (spot) openSpotFormModal(spot, state.lang, renderApp);
    });
  });

  document.querySelectorAll('[data-toggle-spot]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-toggle-spot');
      const spot = cmsStore.spots.find(s => s.id === id);
      if (spot) {
        spot.is_published = !spot.is_published;
        await saveTouristSpot(spot);
        showToast(`Tourist Spot "${spot.name_en}" is now ${spot.is_published ? 'Published' : 'Draft'}.`, 'success');
        renderApp();
      }
    });
  });

  document.querySelectorAll('[data-delete-spot]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-spot');
      const spot = cmsStore.spots.find(s => s.id === id);
      if (!spot) return;

      showConfirmModal({
        title: 'Delete Tourist Spot',
        message: `Are you sure you want to permanently delete destination "${spot.name_en}"?`,
        lang: state.lang,
        onConfirm: async () => {
          await deleteTouristSpot(spot.id);
          showToast(`Tourist Spot "${spot.name_en}" deleted.`, 'success');
          renderApp();
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // Module 5: Travel Guide / Article CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-article')?.addEventListener('click', () => {
    openArticleFormModal(undefined, state.lang, renderApp);
  });

  document.querySelectorAll('[data-edit-article]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-article');
      const art = cmsStore.articles.find(a => a.id === id);
      if (art) openArticleFormModal(art, state.lang, renderApp);
    });
  });

  document.querySelectorAll('[data-toggle-article]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-toggle-article');
      const art = cmsStore.articles.find(a => a.id === id);
      if (art) {
        art.is_published = !art.is_published;
        art.status = art.is_published ? 'published' : 'draft';
        await saveArticle(art);
        showToast(`Article "${art.title_en}" is now ${art.is_published ? 'Published' : 'Draft'}.`, 'success');
        renderApp();
      }
    });
  });

  document.querySelectorAll('[data-delete-article]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-article');
      const art = cmsStore.articles.find(a => a.id === id);
      if (!art) return;

      showConfirmModal({
        title: 'Delete Travel Guide',
        message: `Are you sure you want to delete guide "${art.title_en}"?`,
        lang: state.lang,
        onConfirm: async () => {
          await deleteArticle(art.id);
          showToast(`Article "${art.title_en}" deleted.`, 'success');
          renderApp();
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // Module 6: Image Manager Handlers
  // --------------------------------------------------------------------------
  const dropzone = document.getElementById('cms-media-dropzone');
  const fileInput = document.getElementById('cms-media-file-input') as HTMLInputElement;
  const browseBtn = document.getElementById('cms-media-browse-btn');

  browseBtn?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput?.click();
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone?.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFileUpload(fileInput.files[0]);
    }
  });

  async function handleFileUpload(file: File) {
    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      showToast('Invalid file format. Please upload JPEG, PNG, WEBP, GIF, or SVG.', 'error');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds 5MB limit. Please compress the image.', 'error');
      return;
    }

    showToast('Uploading image to Firebase Storage...', 'warning');
    try {
      const url = await uploadImageFile(file, 'media_library');
      const newItem: MediaItem = {
        id: 'media_' + Date.now(),
        url: url,
        file_name: file.name,
        alt_en: file.name.replace(/\.[^/.]+$/, ''),
        alt_bn: 'বাংলাদেশের পর্যটন ছবি',
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString()
      };
      await saveMediaItem(newItem);
      showToast('Image uploaded and registered successfully!', 'success');
      renderApp();
    } catch (err: any) {
      showToast(err.message || 'Image upload error', 'error');
    }
  }

  // Copy Image URL button
  document.querySelectorAll('[data-copy-url]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.getAttribute('data-copy-url');
      if (url && navigator.clipboard) {
        navigator.clipboard.writeText(url);
        showToast('Image URL copied to clipboard!', 'success');
      }
    });
  });

  // Image zoom preview
  document.querySelectorAll('[data-preview-img]').forEach(img => {
    img.addEventListener('click', () => {
      const url = img.getAttribute('data-preview-img');
      if (url) openImagePreviewModal(url);
    });
  });

  // Delete media item
  document.querySelectorAll('[data-delete-media]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-delete-media');
      const item = cmsStore.media.find(m => m.id === id);
      if (!item) return;

      showConfirmModal({
        title: 'Delete Image Asset',
        message: `Are you sure you want to delete image "${item.file_name}"? If any destination cards reference this image URL, they may show missing media.`,
        lang: state.lang,
        onConfirm: async () => {
          const res = await deleteMediaItem(item.id);
          showToast('Image asset deleted.', 'success');
          if (res.warning) showToast(res.warning, 'warning');
          renderApp();
        }
      });
    });
  });
}

// Navigation helpers for All Divisions (/divisions/) and Division Details (/divisions/:slug/)
function dismissOpenSpotModal(): void {
  const modalEl = document.getElementById('spotDetailsModal');
  if (modalEl && modalEl.classList.contains('show')) {
    const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    if (bsModal) bsModal.hide();
  }
}

function openAllDivisionsPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'divisions';
  state.selectedDivisionId = null;
  if (pushUrl) {
    navigateToPath('/divisions/');
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

function openDivisionDetailPage(slugOrId: string, pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  const knownDivision = findDivisionBySlugOrId(slugOrId);
  const targetSlug = (knownDivision?.slug || knownDivision?.id || slugOrId).trim().toLowerCase();
  state.activeView = 'division-detail';
  state.selectedDivisionId = targetSlug;
  state.divisionDetailDistrictFilterId = null;
  if (pushUrl) {
    navigateToPath(`/divisions/${encodeURIComponent(targetSlug)}/`);
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadDivisionDetailFromFirestore(targetSlug);
}

function openAllDistrictsPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'districts';
  state.selectedDistrictId = null;
  if (pushUrl) {
    navigateToPath('/districts/');
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

function openDistrictDetailPage(slugOrId: string, pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  const knownDistrict = findDistrictBySlugOrId(slugOrId);
  const targetSlug = (knownDistrict?.slug || knownDistrict?.id || slugOrId).trim().toLowerCase();
  state.activeView = 'district-detail';
  state.selectedDistrictId = targetSlug;
  if (pushUrl) {
    navigateToPath(`/districts/${encodeURIComponent(targetSlug)}/`);
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadDistrictDetailFromFirestore(targetSlug);
}

function openAllPlacesPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'spots';
  if (pushUrl) {
    navigateToPath('/places/');
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

// Event Listeners for All Divisions & Division Details Pages
function attachDivisionsPageEventListeners(): void {
  const searchInput = document.getElementById('divisions-search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.divisionsSearchQuery = (e.target as HTMLInputElement).value;
      renderApp();
      const restored = document.getElementById('divisions-search-input') as HTMLInputElement;
      if (restored) {
        restored.focus();
        restored.setSelectionRange(restored.value.length, restored.value.length);
      }
    });
  }

  document.getElementById('divisions-clear-search-btn')?.addEventListener('click', () => {
    state.divisionsSearchQuery = '';
    renderApp();
  });

  document.getElementById('divisions-empty-clear-btn')?.addEventListener('click', () => {
    state.divisionsSearchQuery = '';
    renderApp();
  });

  document.getElementById('divisions-retry-btn')?.addEventListener('click', () => {
    loadPortalDataFromFirestore(true);
  });

  document.getElementById('division-detail-retry-btn')?.addEventListener('click', () => {
    loadDivisionDetailFromFirestore(state.selectedDivisionId || state.divisionDetailSlug || '', true);
  });

  document.getElementById('back-to-divisions-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAllDivisionsPage();
  });

  document.querySelectorAll('.division-home-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      state.activeView = 'home';
      navigateToPath('/');
      renderLayoutShell();
      updateDynamicSeo();
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Clicking a division card or Explore Division CTA opens its details page
  document.querySelectorAll('.division-card-action').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = card.getAttribute('data-division-slug') || card.getAttribute('data-division-id');
      if (slug) {
        openDivisionDetailPage(slug);
      }
    });
  });

  // Back to all divisions link inside detail page
  document.querySelectorAll('.division-back-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openAllDivisionsPage();
    });
  });

  // Spot details modal & bookmark buttons on Related Destinations / Division Spots
  document.querySelectorAll('.spot-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const spotId = btn.getAttribute('data-spot-id');
      if (spotId) openSpotModal(spotId);
    });
  });

  document.querySelectorAll('[data-spot-bookmark]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spotId = btn.getAttribute('data-spot-bookmark');
      if (spotId) toggleBookmark(spotId);
    });
  });

  // Travel Guide / Article details modal trigger
  document.querySelectorAll('.article-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const articleId = btn.getAttribute('data-article-id');
      if (articleId) openArticleModal(articleId);
    });
  });

  // District explore buttons on Division Details Page filter spots for that district right on the page
  document.querySelectorAll('.district-explore-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const distId = btn.getAttribute('data-district-id');
      if (distId && state.activeView === 'division-detail') {
        state.divisionDetailDistrictFilterId = distId;
        renderApp();
        setTimeout(() => {
          document.getElementById('division-spots-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 40);
      }
    });
  });

  [
    'clear-district-spot-filter-btn',
    'clear-district-spot-filter-btn-2',
    'clear-district-spot-filter-empty-btn'
  ].forEach(btnId => {
    document.getElementById(btnId)?.addEventListener('click', () => {
      state.divisionDetailDistrictFilterId = null;
      renderApp();
    });
  });
}

// Event Listeners for All 64 Districts Directory (/districts/)
function attachDistrictsPageEventListeners(): void {
  const searchInput = document.getElementById('districts-search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.districtsSearchQuery = (e.target as HTMLInputElement).value;
      state.districtsCurrentPage = 1;
      renderApp();
      const restored = document.getElementById('districts-search-input') as HTMLInputElement;
      if (restored) {
        restored.focus();
        restored.setSelectionRange(restored.value.length, restored.value.length);
      }
    });
  }

  const divisionSelect = document.getElementById('districts-division-select') as HTMLSelectElement;
  if (divisionSelect) {
    divisionSelect.addEventListener('change', (e) => {
      state.districtsDivisionFilter = (e.target as HTMLSelectElement).value || 'all';
      state.districtsCurrentPage = 1;
      renderApp();
    });
  }

  const resetAllDistrictFilters = () => {
    state.districtsSearchQuery = '';
    state.districtsDivisionFilter = 'all';
    state.districtsCurrentPage = 1;
    renderApp();
  };

  document.getElementById('districts-reset-filters-btn')?.addEventListener('click', resetAllDistrictFilters);
  document.getElementById('districts-empty-reset-btn')?.addEventListener('click', resetAllDistrictFilters);

  document.getElementById('districts-retry-btn')?.addEventListener('click', () => {
    loadPortalDataFromFirestore(true);
  });

  const scrollToDistrictGrid = () => {
    setTimeout(() => {
      document.getElementById('districts-directory-grid')?.scrollIntoView({ behavior: 'smooth' });
    }, 30);
  };

  document.getElementById('districts-page-prev')?.addEventListener('click', () => {
    if (state.districtsCurrentPage > 1) {
      state.districtsCurrentPage -= 1;
      renderApp();
      scrollToDistrictGrid();
    }
  });

  document.getElementById('districts-page-next')?.addEventListener('click', () => {
    const publishedDivisions = cmsStore.divisions.filter(d => d.is_published !== false);
    const filtered = getFilteredDistricts(
      cmsStore.districts,
      publishedDivisions,
      state.districtsSearchQuery,
      state.districtsDivisionFilter
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / DISTRICTS_PER_PAGE));
    if (state.districtsCurrentPage < totalPages) {
      state.districtsCurrentPage += 1;
      renderApp();
      scrollToDistrictGrid();
    }
  });

  document.querySelectorAll('.district-page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPage = parseInt(btn.getAttribute('data-page') || '1', 10);
      if (!Number.isNaN(targetPage) && targetPage !== state.districtsCurrentPage) {
        state.districtsCurrentPage = targetPage;
        renderApp();
        scrollToDistrictGrid();
      }
    });
  });

  document.querySelectorAll('.district-detail-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = link.getAttribute('data-district-slug');
      if (slug) {
        openDistrictDetailPage(decodeURIComponent(slug));
      }
    });
  });
}

// Event Listeners for Dynamic District Details Page (/districts/:slug/)
function attachDistrictDetailPageEventListeners(): void {
  document.getElementById('district-detail-retry-btn')?.addEventListener('click', () => {
    loadDistrictDetailFromFirestore(state.selectedDistrictId || state.districtDetailSlug || '', true);
  });

  document.querySelectorAll('.spot-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const spotId = btn.getAttribute('data-spot-id');
      if (spotId) openSpotModal(spotId);
    });
  });

  document.querySelectorAll('[data-spot-bookmark]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spotId = btn.getAttribute('data-spot-bookmark');
      if (spotId) toggleBookmark(spotId);
    });
  });

  document.querySelectorAll('.article-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const articleId = btn.getAttribute('data-article-id');
      if (articleId) openArticleModal(articleId);
    });
  });
}

// Event Listeners for All Tourist Destinations Directory (/places/)
function attachPlacesPageEventListeners(): void {
  const searchInput = document.getElementById('places-search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.placesSearchQuery = (e.target as HTMLInputElement).value;
      state.placesCurrentPage = 1;
      renderApp();
      const restored = document.getElementById('places-search-input') as HTMLInputElement;
      if (restored) {
        restored.focus();
        restored.setSelectionRange(restored.value.length, restored.value.length);
      }
    });
  }

  const divisionSelect = document.getElementById('places-division-select') as HTMLSelectElement;
  if (divisionSelect) {
    divisionSelect.addEventListener('change', (e) => {
      const newDivision = (e.target as HTMLSelectElement).value || 'all';
      state.placesDivisionFilter = newDivision;
      // If selected district no longer belongs to chosen division, reset district filter
      if (newDivision !== 'all' && state.placesDistrictFilter !== 'all') {
        const selectedDist = cmsStore.districts.find(
          d =>
            d.id.toLowerCase() === state.placesDistrictFilter.toLowerCase() ||
            (!!d.slug && d.slug.toLowerCase() === state.placesDistrictFilter.toLowerCase())
        );
        const matchedDiv = cmsStore.divisions.find(
          div =>
            div.id.toLowerCase() === newDivision.toLowerCase() ||
            (!!div.slug && div.slug.toLowerCase() === newDivision.toLowerCase())
        );
        const belongs =
          selectedDist &&
          (selectedDist.division_id.toLowerCase() === newDivision.toLowerCase() ||
            (!!matchedDiv &&
              (selectedDist.division_id.toLowerCase() === matchedDiv.id.toLowerCase() ||
                (!!matchedDiv.slug && selectedDist.division_id.toLowerCase() === matchedDiv.slug.toLowerCase()))));
        if (!belongs) {
          state.placesDistrictFilter = 'all';
        }
      }
      state.placesCurrentPage = 1;
      renderApp();
    });
  }

  const districtSelect = document.getElementById('places-district-select') as HTMLSelectElement;
  if (districtSelect) {
    districtSelect.addEventListener('change', (e) => {
      state.placesDistrictFilter = (e.target as HTMLSelectElement).value || 'all';
      state.placesCurrentPage = 1;
      renderApp();
    });
  }

  const categorySelect = document.getElementById('places-category-select') as HTMLSelectElement;
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      state.placesCategoryFilter = (e.target as HTMLSelectElement).value || 'all';
      state.placesCurrentPage = 1;
      renderApp();
    });
  }

  document.querySelectorAll('[data-places-cat-filter]').forEach(pill => {
    pill.addEventListener('click', () => {
      state.placesCategoryFilter = pill.getAttribute('data-places-cat-filter') || 'all';
      state.placesCurrentPage = 1;
      renderApp();
    });
  });

  const resetAllPlacesFilters = () => {
    state.placesSearchQuery = '';
    state.placesDivisionFilter = 'all';
    state.placesDistrictFilter = 'all';
    state.placesCategoryFilter = 'all';
    state.placesCurrentPage = 1;
    renderApp();
  };

  document.getElementById('places-reset-filters-btn')?.addEventListener('click', resetAllPlacesFilters);
  document.getElementById('places-empty-reset-btn')?.addEventListener('click', resetAllPlacesFilters);

  document.getElementById('places-retry-btn')?.addEventListener('click', () => {
    loadPortalDataFromFirestore(true);
  });

  const scrollToPlacesGrid = () => {
    setTimeout(() => {
      document.getElementById('places-directory-grid')?.scrollIntoView({ behavior: 'smooth' });
    }, 30);
  };

  document.getElementById('places-page-prev')?.addEventListener('click', () => {
    if (state.placesCurrentPage > 1) {
      state.placesCurrentPage -= 1;
      renderApp();
      scrollToPlacesGrid();
    }
  });

  document.getElementById('places-page-next')?.addEventListener('click', () => {
    const filtered = getFilteredSpots(
      cmsStore.spots,
      cmsStore.divisions.filter(d => d.is_published !== false),
      cmsStore.districts.filter(d => d.is_published !== false),
      cmsStore.categories.filter(c => c.is_published !== false),
      state.placesSearchQuery,
      state.placesDivisionFilter,
      state.placesDistrictFilter,
      state.placesCategoryFilter
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PLACES_PER_PAGE));
    if (state.placesCurrentPage < totalPages) {
      state.placesCurrentPage += 1;
      renderApp();
      scrollToPlacesGrid();
    }
  });

  document.querySelectorAll('.places-page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPage = parseInt(btn.getAttribute('data-page') || '1', 10);
      if (!Number.isNaN(targetPage) && targetPage !== state.placesCurrentPage) {
        state.placesCurrentPage = targetPage;
        renderApp();
        scrollToPlacesGrid();
      }
    });
  });

  document.querySelectorAll('.spot-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const spotId = btn.getAttribute('data-spot-id');
      if (spotId) openSpotModal(spotId);
    });
  });

  document.querySelectorAll('[data-spot-bookmark]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spotId = btn.getAttribute('data-spot-bookmark');
      if (spotId) toggleBookmark(spotId);
    });
  });
}

// Deep-link routing based on URL path (/divisions/, /divisions/:slug/, /districts/, /districts/:slug/) and hash (#spot-..., #cms)
function handleHashRoute(): void {
  const parsed = parseCurrentRoute();

  if (parsed.type === 'divisions') {
    if (state.activeView === 'divisions') return;
    openAllDivisionsPage(false);
    return;
  }

  if (parsed.type === 'division' && parsed.id) {
    if (state.activeView === 'division-detail' && state.selectedDivisionId === parsed.id) return;
    openDivisionDetailPage(parsed.id, false);
    return;
  }

  if (parsed.type === 'districts') {
    if (state.activeView === 'districts') return;
    openAllDistrictsPage(false);
    return;
  }

  if (parsed.type === 'district' && parsed.id) {
    if (state.activeView === 'district-detail' && state.selectedDistrictId === parsed.id) return;
    openDistrictDetailPage(parsed.id, false);
    return;
  }

  if (parsed.type === 'spots') {
    if (state.activeView === 'spots') return;
    openAllPlacesPage(false);
    return;
  }

  if (parsed.type === 'cms') {
    state.activeView = 'cms';
    renderLayoutShell();
    renderApp();
    updateDynamicSeo(
      state.lang === 'bn' ? 'সিএমএস অ্যাডমিন পোর্টাল' : 'CMS Admin Dashboard',
      'Administrative Content Management System for Bangladesh Tourism Portal',
      'cms'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (parsed.type === 'spot' && parsed.id) {
    const spot = cmsStore.spots.find(s => s.id === parsed.id);
    if (spot) {
      if (state.activeView !== 'home') {
        state.activeView = 'home';
        renderLayoutShell();
        renderApp();
      }
      openSpotModal(spot.id, false);
      return;
    }
  }

  if (parsed.type === 'home') {
    if (state.activeView !== 'home' && state.activeView !== 'saved') {
      state.activeView = 'home';
      renderLayoutShell();
      renderApp();
    }
    updateDynamicSeo();
    return;
  }

  // Section anchors on home page (#districts, #spots, #guides, #planner)
  if (state.activeView !== 'home') {
    state.activeView = 'home';
    renderLayoutShell();
    renderApp();
  }
  updateDynamicSeo();
  const sectionEl = document.getElementById(parsed.type);
  if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
}

function closeMobileNavbar(): void {
  const collapseEl = document.getElementById('navbarContent');
  if (!collapseEl || !collapseEl.classList.contains('show')) return;
  const bootstrap = (window as any).bootstrap;
  if (bootstrap?.Collapse) {
    bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
  } else {
    collapseEl.classList.remove('show');
  }
}

// Bind Navbar Event Listeners (called whenever navbar is rendered)
function initializeNavbarEventListeners(): void {
  // Language Switcher Button
  document.getElementById('lang-switcher')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeMobileNavbar();
    switchLanguage();
  });

  // Quick Search Trigger in Navbar
  document.getElementById('btn-nav-search')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeMobileNavbar();
    if (state.activeView === 'divisions') {
      const divSearch = document.getElementById('divisions-search-input') as HTMLInputElement;
      if (divSearch) {
        divSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => divSearch.focus(), 300);
        return;
      }
    }
    if (state.activeView === 'districts') {
      const distSearch = document.getElementById('districts-search-input') as HTMLInputElement;
      if (distSearch) {
        distSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => distSearch.focus(), 300);
        return;
      }
    }
    if (state.activeView === 'spots') {
      const placesSearch = document.getElementById('places-search-input') as HTMLInputElement;
      if (placesSearch) {
        placesSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => placesSearch.focus(), 300);
        return;
      }
    }
    if (state.activeView !== 'home') {
      state.activeView = 'home';
      navigateToPath('/');
      renderLayoutShell();
      renderApp();
    }
    const searchInput = document.getElementById('global-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => searchInput.focus(), 300);
    }
  });

  // Saved Destinations Trigger
  document.getElementById('btn-saved-places')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeMobileNavbar();
    state.activeView = state.activeView === 'saved' ? 'home' : 'saved';
    navigateToPath('/');
    renderLayoutShell();
    renderApp();
    const spotsSection = document.getElementById('spots');
    if (spotsSection) spotsSection.scrollIntoView({ behavior: 'smooth' });
  });

  // Admin Portal / CMS Toggle Trigger
  document.getElementById('btn-admin-portal')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeMobileNavbar();
    state.activeView = state.activeView === 'cms' ? 'home' : 'cms';
    if (state.activeView === 'cms') {
      navigateToPath('/#cms');
    } else {
      navigateToPath('/');
      updateDynamicSeo();
    }
    renderLayoutShell();
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Navbar link triggers
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', (e) => {
      const navTarget = link.getAttribute('data-nav');
      closeMobileNavbar();
      if (navTarget === 'divisions') {
        e.preventDefault();
        openAllDivisionsPage();
        return;
      }

      if (navTarget === 'districts') {
        e.preventDefault();
        openAllDistrictsPage();
        return;
      }

      if (navTarget === 'spots') {
        e.preventDefault();
        openAllPlacesPage();
        return;
      }

      if (navTarget === 'home') {
        e.preventDefault();
        state.activeView = 'home';
        state.divisionFilter = 'all';
        state.categoryFilter = 'all';
        state.searchQuery = '';
        navigateToPath('/');
        renderLayoutShell();
        updateDynamicSeo();
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (navTarget) {
        e.preventDefault();
        if (state.activeView !== 'home') {
          state.activeView = 'home';
          navigateToPath(`/#${navTarget}`);
          renderLayoutShell();
          updateDynamicSeo();
          renderApp();
          setTimeout(() => {
            document.getElementById(navTarget)?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        } else {
          navigateToPath(`/#${navTarget}`);
          setTimeout(() => {
            document.getElementById(navTarget)?.scrollIntoView({ behavior: 'smooth' });
          }, 80);
        }
      }
    });
  });

  // Brand link
  document.getElementById('brand-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeMobileNavbar();
    state.activeView = 'home';
    state.divisionFilter = 'all';
    state.categoryFilter = 'all';
    state.searchQuery = '';
    navigateToPath('/');
    renderLayoutShell();
    updateDynamicSeo();
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Global Static Event Listeners & Accessibility Hooks
function initializeGlobalEventListeners(): void {
  // Global SPA link interception for /divisions/, /divisions/:slug/, footer, and breadcrumbs
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest('a');
    if (!target) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || target.target === '_blank') return;

    const href = target.getAttribute('href');
    if (!href) return;

    // Ignore clicks already handled by navbar or division cards
    if (target.closest('#navbar-root') || target.classList.contains('division-card-action') || target.classList.contains('division-explore-link')) {
      return;
    }

    if (href === '/divisions/' || href === '/divisions') {
      e.preventDefault();
      openAllDivisionsPage();
      return;
    }

    if (href.startsWith('/divisions/')) {
      const slug = href.replace('/divisions/', '').replace(/\/+$/, '');
      if (slug) {
        e.preventDefault();
        openDivisionDetailPage(decodeURIComponent(slug));
        return;
      }
    }

    if (href === '/districts/' || href === '/districts') {
      e.preventDefault();
      openAllDistrictsPage();
      return;
    }

    if (href.startsWith('/districts/')) {
      const slug = href.replace('/districts/', '').replace(/\/+$/, '');
      if (slug) {
        e.preventDefault();
        openDistrictDetailPage(decodeURIComponent(slug));
        return;
      }
    }

    if (href === '/places/' || href === '/places') {
      e.preventDefault();
      openAllPlacesPage();
      return;
    }

    if (href === '/' || href === '#') {
      if (target.closest('.breadcrumb-custom') || target.closest('.site-footer') || href === '/') {
        e.preventDefault();
        state.activeView = 'home';
        navigateToPath('/');
        renderLayoutShell();
        updateDynamicSeo();
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (href.startsWith('#') && href.length > 1) {
      const el = document.getElementById(href.slice(1));
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    if (href.startsWith('/#')) {
      e.preventDefault();
      const anchor = href.replace('/#', '');
      state.activeView = 'home';
      navigateToPath(`/#${anchor}`);
      renderLayoutShell();
      updateDynamicSeo();
      renderApp();
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  });

  // Listen for spot details modal close to reset URL hash and restore canonical SEO
  const spotModalEl = document.getElementById('spotDetailsModal');
  spotModalEl?.addEventListener('hidden.bs.modal', () => {
    if (window.location.hash.startsWith('#spot-')) {
      history.replaceState(null, '', window.location.pathname || '/');
    }
    updateDynamicSeo();
  });

  // Close mobile navbar when clicking outside of it
  document.addEventListener('click', (e) => {
    const targetEl = e.target as HTMLElement | null;
    if (targetEl && !targetEl.closest('#main-nav')) {
      closeMobileNavbar();
    }
  });

  // Accessibility: Keyboard Escape key closes any active modal or open mobile navbar
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileNavbar();
      const openModals = document.querySelectorAll('.modal.show');
      openModals.forEach(modalEl => {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
        if (bsModal) bsModal.hide();
      });
    }
  });

  // Listen for browser back/forward and hash changes to navigate dynamically
  window.addEventListener('popstate', () => {
    handleHashRoute();
  });
  window.addEventListener('hashchange', () => {
    handleHashRoute();
  });
}

// App Initialization
let appInitialized = false;
async function initializeApp(): Promise<void> {
  if (appInitialized) return;
  appInitialized = true;
  console.info('Initializing Bangladesh Tourism Portal & CMS...');
  
  // Ensure official administrative district relationships (e.g. Jamalpur -> Mymensingh) even with cached localStorage
  cmsStore.districts = FirestoreService.normalizeDistrictAdministrativeDivision(cmsStore.districts);

  document.body.className = state.lang === 'en' ? 'lang-en' : 'lang-bn';
  document.documentElement.lang = state.lang;

  // Test Firebase connection
  testConnection();

  // Listen to Auth State
  onAuthStateChanged(auth, (user) => {
    state.currentUser = user;
    if (user) {
      console.info('Authenticated user:', user.email);
    }
  });

  // Resolve initial route (/divisions/, /divisions/:slug/, /districts/, /districts/:slug/, or /)
  const initialRoute = parseCurrentRoute();
  if (initialRoute.type === 'divisions') {
    state.activeView = 'divisions';
  } else if (initialRoute.type === 'division' && initialRoute.id) {
    state.activeView = 'division-detail';
    state.selectedDivisionId = initialRoute.id;
  } else if (initialRoute.type === 'districts') {
    state.activeView = 'districts';
  } else if (initialRoute.type === 'district' && initialRoute.id) {
    state.activeView = 'district-detail';
    state.selectedDistrictId = initialRoute.id;
  } else if (initialRoute.type === 'spots') {
    state.activeView = 'spots';
  } else if (initialRoute.type === 'cms') {
    state.activeView = 'cms';
  }

  renderLayoutShell();
  updateStaticNavbarTranslations();
  updateSavedBadgeCount();
  updateDynamicSeo();

  // Bind global UI triggers & Accessibility hooks
  initializeGlobalEventListeners();

  if (initialRoute.type === 'division' && initialRoute.id) {
    await loadDivisionDetailFromFirestore(initialRoute.id, true);
  } else if (initialRoute.type === 'district' && initialRoute.id) {
    await loadDistrictDetailFromFirestore(initialRoute.id, true);
  } else {
    // Fetch live division & destination data from Firestore (renders loading state while in flight)
    await loadPortalDataFromFirestore();
  }

  // Handle any post-hydration deep-link anchors/modals
  if (
    initialRoute.type !== 'divisions' &&
    initialRoute.type !== 'division' &&
    initialRoute.type !== 'districts' &&
    initialRoute.type !== 'district' &&
    initialRoute.type !== 'spots' &&
    initialRoute.type !== 'home'
  ) {
    handleHashRoute();
  }
}

// Boot up
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
