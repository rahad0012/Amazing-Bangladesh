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

import { cmsStore, type CmsTab } from './cms/cmsStore';

import { 
  type Language, 
  getCurrentLanguage, 
  setLanguagePreference, 
  getTranslation 
} from './i18n';
import { toBengaliNumerals, formatLocalizedNumber } from './utils/langUtils';

import { 
  renderNavbar,
  renderFooter,
  renderDivisionCard, 
  renderDestinationCard, 
  renderDistrictCard, 
  renderCategoryPill,
  renderNewsletter
} from './components';

import { renderAllDivisionsPage } from './pages/DivisionsPage';
import { renderDivisionDetailPage } from './pages/DivisionDetailsPage';
import {
  renderAllDistrictsPage,
  getFilteredDistricts,
  DISTRICTS_PER_PAGE
} from './pages/DistrictsDirectoryPage';
import { renderDistrictDetailPage } from './pages/DistrictDetailsPage';
import {
  renderAllPlacesPage,
  renderPlacesResultsRegion,
  getFilteredSpots,
  PLACES_PER_PAGE
} from './pages/PlacesDirectoryPage';
import {
  renderSpotDetailPage,
  getSpotGalleryImages
} from './pages/SpotDetailsPage';
import {
  renderAllCategoriesPage,
  renderCategoryDetailPage,
  getFilteredCategorySpots,
  CATEGORY_SPOTS_PER_PAGE
} from './pages/CategoriesPage';
import {
  renderTravelGuidesPage,
  renderTravelGuidesResultsRegion,
  getFilteredPublishedArticles,
  GUIDES_PER_PAGE
} from './pages/TravelGuidesPage';
import { renderArticleDetailPage } from './pages/ArticleDetailsPage';
import {
  renderSearchPage,
  renderSearchResultsRegion,
  renderSearchSuggestionsDropdown,
  SEARCH_RESULTS_PER_PAGE
} from './pages/SearchPage';
import {
  renderAboutPage,
  renderContactPage,
  renderPrivacyPolicyPage,
  renderTermsAndConditionsPage,
  type ContactFormState
} from './pages/StaticInfoPages';
import type { AdminLoginFeedback } from './pages/AdminLoginPage';

import {
  FirestoreService,
  COLLECTIONS,
  CANONICAL_DIVISION_ORDER,
  normalizeFirestoreDivisions
} from './services/firestoreService';
import { testConnection } from './config/firebaseDb';
import {
  SiteSettingsService,
  DEFAULT_WEBSITE_SETTINGS,
  DEFAULT_SEO_SETTINGS,
  DEFAULT_ADS_SETTINGS,
  DEFAULT_HERO_SLIDES,
  AD_SLOT_META,
  normalizeAdsSettings,
  getActiveHeroSlides,
  type AdNetworkType,
  type AdSlotConfig,
  type AdSlotKey,
  type AdsSettingsConfig,
  type HeroBannerSlide,
  type WebsiteSettingsConfig,
  type SeoSettingsConfig
} from './services/siteSettingsService';
import type { VerifiedAdminSession } from './services/adminAuthService';

import {
  parseCurrentRoute,
  getAdminRouteForTab,
  buildSearchRouteUrl,
  navigateToPath,
  updateCanonicalAndSeo,
  updateStructuredData
} from './utils/urlUtils';

import {
  buildGlobalSearchIndex,
  executeIndexedGlobalSearch,
  getSearchSuggestions,
  sanitizeSearchInput,
  type SearchTypeFilter
} from './utils/searchUtils';

import { escapeHtml, optimizeImageUrl } from './utils/formatUtils';
import { showToast } from './utils/stateFeedback';
import {
  renderAdSlotHtml,
  hydrateRenderedAdSlots,
  syncGlobalAdScripts
} from './utils/adsRenderer';

import { type User } from 'firebase/auth';

export { escapeHtml, optimizeImageUrl };

// Application State Interface
interface AppState {
  lang: Language;
  activeView: 'home' | 'divisions' | 'division-detail' | 'districts' | 'district-detail' | 'categories' | 'category-detail' | 'spots' | 'spot-detail' | 'guides' | 'guide-detail' | 'search' | 'about' | 'contact' | 'privacy-policy' | 'terms' | 'planner' | 'saved' | 'cms' | 'admin-login';
  divisionFilter: string;
  categoryFilter: string;
  searchQuery: string;
  searchPageQuery: string;
  searchPageTypeFilter: SearchTypeFilter;
  searchPageDivisionFilter: string;
  searchPageCategoryFilter: string;
  searchPageCurrentPage: number;
  divisionsSearchQuery: string;
  districtsSearchQuery: string;
  districtsDivisionFilter: string;
  districtsCurrentPage: number;
  placesSearchQuery: string;
  placesDivisionFilter: string;
  placesDistrictFilter: string;
  placesCategoryFilter: string;
  placesCurrentPage: number;
  guidesSearchQuery: string;
  guidesCategoryFilter: string;
  guidesCurrentPage: number;
  selectedDivisionId: string | null;
  selectedDistrictId: string | null;
  bookmarkedIds: Set<string>;
  currentUser: User | null;
  activeDistrictTabDivision: string;
  plannerDaysMode: '3' | '5' | '7' | '10' | '14' | 'custom';
  plannerCustomDays: number;
  plannerSelectedCategoryIds: string[];
  plannerSelectionCustomized: boolean;
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
  spotDetailSlug: string | null;
  spotDetailLoading: boolean;
  spotDetailError: string | null;
  spotDetailNotFound: boolean;
  spotDetailSpot: TouristSpot | null;
  spotDetailDivision: Division | null;
  spotDetailDistrict: District | null;
  spotDetailNearbySpots: TouristSpot[];
  spotDetailArticles: Article[];
  spotDetailGalleryIndex: number;
  categoryDetailSlug: string | null;
  categoryDetailLoading: boolean;
  categoryDetailError: string | null;
  categoryDetailNotFound: boolean;
  categoryDetailCategory: Category | null;
  categoryDetailSpots: TouristSpot[];
  categoryDetailDivisionFilter: string;
  categoryDetailDistrictFilter: string;
  categoryDetailCurrentPage: number;
  guideDetailSlug: string | null;
  guideDetailLoading: boolean;
  guideDetailError: string | null;
  guideDetailNotFound: boolean;
  guideDetailArticle: Article | null;
  contactForm: ContactFormState;
  heroSlideIndex: number;
  adminAuthStatus: 'checking' | 'authenticated' | 'unauthenticated' | 'unauthorized' | 'expired';
  adminSession: VerifiedAdminSession | null;
  adminLoginEmail: string;
  adminLoginRememberSession: boolean;
  adminLoginShowPassword: boolean;
  adminLoginSubmitting: boolean;
  adminLoginFeedback: AdminLoginFeedback | null;
  websiteSettings: WebsiteSettingsConfig;
  seoSettings: SeoSettingsConfig;
  adsSettings: AdsSettingsConfig;
}

let heroCarouselTimer: number | null = null;
let heroCarouselPaused = false;

// Initial State
const state: AppState = {
  lang: getCurrentLanguage(),
  activeView: 'home',
  divisionFilter: 'all',
  categoryFilter: 'all',
  searchQuery: '',
  searchPageQuery: '',
  searchPageTypeFilter: 'all',
  searchPageDivisionFilter: 'all',
  searchPageCategoryFilter: 'all',
  searchPageCurrentPage: 1,
  divisionsSearchQuery: '',
  districtsSearchQuery: '',
  districtsDivisionFilter: 'all',
  districtsCurrentPage: 1,
  placesSearchQuery: '',
  placesDivisionFilter: 'all',
  placesDistrictFilter: 'all',
  placesCategoryFilter: 'all',
  placesCurrentPage: 1,
  guidesSearchQuery: '',
  guidesCategoryFilter: 'all',
  guidesCurrentPage: 1,
  selectedDivisionId: null,
  selectedDistrictId: null,
  bookmarkedIds: new Set<string>(JSON.parse(localStorage.getItem('bd_tourism_bookmarks') || '[]')),
  currentUser: null,
  activeDistrictTabDivision: 'all',
  plannerDaysMode: '7',
  plannerCustomDays: 10,
  plannerSelectedCategoryIds: ['beaches', 'hills', 'forests', 'historical'],
  plannerSelectionCustomized: false,
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
  spotDetailSlug: null,
  spotDetailLoading: false,
  spotDetailError: null,
  spotDetailNotFound: false,
  spotDetailSpot: null,
  spotDetailDivision: null,
  spotDetailDistrict: null,
  spotDetailNearbySpots: [],
  spotDetailArticles: [],
  spotDetailGalleryIndex: 0,
  categoryDetailSlug: null,
  categoryDetailLoading: false,
  categoryDetailError: null,
  categoryDetailNotFound: false,
  categoryDetailCategory: null,
  categoryDetailSpots: [],
  categoryDetailDivisionFilter: 'all',
  categoryDetailDistrictFilter: 'all',
  categoryDetailCurrentPage: 1,
  guideDetailSlug: null,
  guideDetailLoading: false,
  guideDetailError: null,
  guideDetailNotFound: false,
  guideDetailArticle: null,
  contactForm: {
    name: '',
    email: '',
    subject: '',
    message: '',
    isSubmitting: false,
    submittedReferenceId: null,
    submittedMessage: null,
    errorMessage: null,
    fieldErrors: {}
  },
  heroSlideIndex: 0,
  adminAuthStatus: 'checking',
  adminSession: null,
  adminLoginEmail: '',
  adminLoginRememberSession: false,
  adminLoginShowPassword: false,
  adminLoginSubmitting: false,
  adminLoginFeedback: null,
  websiteSettings: { ...DEFAULT_WEBSITE_SETTINGS },
  seoSettings: { ...DEFAULT_SEO_SETTINGS },
  adsSettings: normalizeAdsSettings(DEFAULT_ADS_SETTINGS)
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

// Lazy-loaded Admin/CMS Runtime (keeps Firebase Auth, Storage & CRUD UI out of initial public bundle)
type AdminRuntimeModule = typeof import('./admin/adminRuntime');
let adminRuntime: AdminRuntimeModule | null = null;
let adminRuntimePromise: Promise<AdminRuntimeModule> | null = null;
let adminLifecycleSubscribed = false;

async function ensureAdminRuntime(): Promise<AdminRuntimeModule> {
  if (adminRuntime) return adminRuntime;
  if (!adminRuntimePromise) {
    adminRuntimePromise = import('./admin/adminRuntime').then((mod) => {
      adminRuntime = mod;
      if (!adminLifecycleSubscribed) {
        adminLifecycleSubscribed = true;
        mod.subscribeAdminAuthLifecycle({
          onTokenRefreshedOrSignedOut: (user) => {
            state.currentUser = user;
            if (!user) {
              state.adminSession = null;
              state.adminAuthStatus = 'unauthenticated';
              if (state.activeView === 'cms') {
                navigateToAdminLogin('expired', true);
              }
            }
          }
        });
      }
      return mod;
    });
  }
  return adminRuntimePromise;
}

// Synchronize SEO meta tags, title, canonical URLs, and structured data dynamically
export function updateDynamicSeo(pageTitle?: string, metaDesc?: string, routePath?: string): void {
  const isBn = state.lang === 'bn';
  const seo = state.seoSettings || DEFAULT_SEO_SETTINGS;
  const defaultTitle = isBn
    ? (seo.default_title_bn || 'অপরূপ বাংলাদেশ | Beautiful Bangladesh - Official Tourism Portal')
    : (seo.default_title_en || 'Beautiful Bangladesh - Official Tourism Portal & Travel Guide');
  const defaultDesc = isBn
    ? (seo.meta_description_bn || '৮টি বিভাগ এবং ৬৪টি জেলার নদী, পাহাড়, অরণ্য, প্রাচীন প্রত্নতত্ত্ব ও ঐতিহাসিক স্থানসমূহের তথ্যবহুল ডিজিটাল মানচিত্র।')
    : (seo.meta_description_en || 'An authentic travel companion covering natural wonders, historical heritage, and cultural journeys across all 8 divisions and 64 districts.');
  const titleSuffix = isBn
    ? (seo.title_suffix_bn || 'অপরূপ বাংলাদেশ')
    : (seo.title_suffix_en || 'Beautiful Bangladesh');

  let resolvedTitle = pageTitle ? `${pageTitle} | ${titleSuffix}` : defaultTitle;
  let resolvedDesc = metaDesc || defaultDesc;
  let resolvedPath = routePath;
  let resolvedOgType: 'website' | 'article' = 'website';
  let resolvedImage: string | undefined = seo.og_image_url || undefined;

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
        ? (div.seo_title_bn || `${divName} বিভাগ (${div.name_en}) - জেলা ও দর্শনীয় স্থান | অপরূপ বাংলাদেশ`)
        : (div.seo_title_en || `${divName} Division (${div.name_bn}) - Districts & Attractions | Beautiful Bangladesh`);
      resolvedDesc = isBn
        ? (div.seo_description_bn || div.description_bn)
        : (div.seo_description_en || div.description_en);
      resolvedPath = `/divisions/${div.slug || div.id}/`;
      resolvedImage = div.image_url || undefined;

      updateStructuredData({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TouristDestination',
            name: `${div.name_en} Division (${div.name_bn})`,
            description: resolvedDesc,
            image: div.image_url || undefined,
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
      resolvedImage = dist.image_url || undefined;

      updateStructuredData({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TouristDestination',
            name: `${dist.name_en} District (${dist.name_bn})`,
            description: resolvedDesc,
            image: dist.image_url || undefined,
            geo:
              typeof dist.latitude === 'number' && typeof dist.longitude === 'number'
                ? {
                    '@type': 'GeoCoordinates',
                    latitude: dist.latitude,
                    longitude: dist.longitude
                  }
                : undefined,
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
            url: `${window.location.origin}/places/${spot.slug || spot.id}/`
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
  } else if (!pageTitle && state.activeView === 'spot-detail' && state.spotDetailSlug !== null) {
    const spot = state.spotDetailSpot;
    const div = state.spotDetailDivision;
    const dist = state.spotDetailDistrict;
    if (spot && spot.is_published === true) {
      const spotSlug = spot.slug || spot.id;
      const primaryName = isBn ? spot.name_bn : spot.name_en;
      const secondaryName = isBn ? spot.name_en : spot.name_bn;
      const distName = dist ? (isBn ? dist.name_bn : dist.name_en) : '';
      resolvedTitle = isBn
        ? (spot.seo_title_bn || `${primaryName} (${secondaryName})${distName ? `, ${distName}` : ''} | অপরূপ বাংলাদেশ`)
        : (spot.seo_title_en || `${primaryName} (${secondaryName})${distName ? `, ${distName}` : ''} | Beautiful Bangladesh`);
      resolvedDesc = isBn
        ? (spot.seo_description_bn || spot.short_desc_bn || spot.overview_bn || defaultDesc)
        : (spot.seo_description_en || spot.short_desc_en || spot.overview_en || defaultDesc);
      resolvedPath = `/places/${spotSlug}/`;

      const canonicalSpotUrl = `${window.location.origin}/places/${spotSlug}/`;
      const breadcrumbItems: Array<Record<string, unknown>> = [
        { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
        { '@type': 'ListItem', position: 2, name: isBn ? 'দর্শনীয় স্থান' : 'Tourist Destinations', item: `${window.location.origin}/places/` }
      ];
      if (div) {
        breadcrumbItems.push({
          '@type': 'ListItem',
          position: breadcrumbItems.length + 1,
          name: isBn ? div.name_bn : div.name_en,
          item: `${window.location.origin}/divisions/${div.slug || div.id}/`
        });
      }
      if (dist) {
        breadcrumbItems.push({
          '@type': 'ListItem',
          position: breadcrumbItems.length + 1,
          name: isBn ? dist.name_bn : dist.name_en,
          item: `${window.location.origin}/districts/${dist.slug || dist.id}/`
        });
      }
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: breadcrumbItems.length + 1,
        name: primaryName,
        item: canonicalSpotUrl
      });

      resolvedImage = spot.image_url || undefined;

      updateStructuredData({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TouristAttraction',
            name: spot.name_en,
            alternateName: spot.name_bn,
            description: resolvedDesc,
            url: canonicalSpotUrl,
            image: spot.image_url || undefined,
            isAccessibleForFree: undefined,
            containedInPlace: dist
              ? {
                  '@type': 'AdministrativeArea',
                  name: `${dist.name_en}${div ? `, ${div.name_en} Division` : ''}`
                }
              : undefined
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems
          }
        ]
      });
    } else if (state.spotDetailNotFound || !state.spotDetailLoading) {
      resolvedTitle = isBn
        ? 'দর্শনীয় স্থানটি পাওয়া যায়নি | অপরূপ বাংলাদেশ'
        : 'Tourist Destination Not Found | Beautiful Bangladesh';
      resolvedDesc = isBn
        ? 'অনুরোধকৃত দর্শনীয় স্থানটি খুঁজে পাওয়া যায়নি। বাংলাদেশের সকল প্রকাশিত দর্শনীয় স্থানের তালিকা দেখুন।'
        : 'The requested tourist destination could not be found. Browse all published tourist spots across Bangladesh.';
      resolvedPath = `/places/${encodeURIComponent(state.spotDetailSlug || '')}/`;
      updateStructuredData(null);
    }
  } else if (!pageTitle && state.activeView === 'categories') {
    const publishedCats = cmsStore.categories.filter(c => c.is_published === true);
    resolvedTitle = isBn
      ? 'বাংলাদেশের পর্যটন ক্যাটাগরি সমূহ | অপরূপ বাংলাদেশ'
      : 'Tourist Categories of Bangladesh | Beautiful Bangladesh';
    resolvedDesc = isBn
      ? 'সমুদ্র সৈকত, পাহাড় ও পর্বত, ঝর্ণা, বন, ঐতিহাসিক ও প্রত্নতাত্ত্বিক নিদর্শন, ধর্মীয় স্থান, হ্রদ, দ্বীপ, পার্ক, বন্যপ্রাণী ও নদীভিত্তিক বাংলাদেশের সকল পর্যটন ক্যাটাগরি অন্বেষণ করুন।'
      : 'Discover Bangladesh across 12 travel categories: beaches, hills and mountains, waterfalls, forests, historical places, archaeological sites, religious places, lakes, islands, parks, wildlife, and rivers.';
    resolvedPath = '/categories/';

    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: isBn ? 'বাংলাদেশের পর্যটন ক্যাটাগরি সমূহ' : 'Tourist Categories of Bangladesh',
          description: resolvedDesc,
          url: `${window.location.origin}/categories/`,
          inLanguage: state.lang
        },
        {
          '@type': 'ItemList',
          numberOfItems: publishedCats.length,
          itemListElement: publishedCats.map((cat, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: isBn ? `${cat.name_bn} (${cat.name_en})` : `${cat.name_en} (${cat.name_bn})`,
            url: `${window.location.origin}/categories/${cat.slug || cat.id}/`
          }))
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: isBn ? 'ক্যাটাগরি সমূহ' : 'Categories', item: `${window.location.origin}/categories/` }
          ]
        }
      ]
    });
  } else if (!pageTitle && state.activeView === 'category-detail' && state.categoryDetailSlug !== null) {
    const cat = state.categoryDetailCategory;
    if (cat && cat.is_published === true) {
      const catSlug = (cat.slug || cat.id).toLowerCase();
      const primaryName = isBn ? cat.name_bn : cat.name_en;
      const secondaryName = isBn ? cat.name_en : cat.name_bn;
      resolvedTitle = isBn
        ? `${primaryName} (${secondaryName}) - দর্শনীয় স্থান | অপরূপ বাংলাদেশ`
        : `${primaryName} (${secondaryName}) Destinations | Beautiful Bangladesh`;
      resolvedDesc = (isBn ? cat.description_bn : cat.description_en) || cat.description_en || cat.description_bn || defaultDesc;
      resolvedPath = `/categories/${catSlug}/`;

      const canonicalCatUrl = `${window.location.origin}/categories/${catSlug}/`;
      resolvedImage = cat.image_url || undefined;

      updateStructuredData({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            name: `${cat.name_en} (${cat.name_bn})`,
            description: resolvedDesc,
            url: canonicalCatUrl,
            inLanguage: state.lang
          },
          {
            '@type': 'ItemList',
            numberOfItems: state.categoryDetailSpots.length,
            itemListElement: state.categoryDetailSpots.slice(0, 12).map((spot, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: isBn ? `${spot.name_bn} (${spot.name_en})` : `${spot.name_en} (${spot.name_bn})`,
              url: `${window.location.origin}/places/${spot.slug || spot.id}/`
            }))
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
              { '@type': 'ListItem', position: 2, name: isBn ? 'ক্যাটাগরি সমূহ' : 'Categories', item: `${window.location.origin}/categories/` },
              { '@type': 'ListItem', position: 3, name: primaryName, item: canonicalCatUrl }
            ]
          }
        ]
      });
    } else if (state.categoryDetailNotFound || !state.categoryDetailLoading) {
      resolvedTitle = isBn
        ? 'ক্যাটাগরিটি পাওয়া যায়নি | অপরূপ বাংলাদেশ'
        : 'Category Not Found | Beautiful Bangladesh';
      resolvedDesc = isBn
        ? 'অনুরোধকৃত পর্যটন ক্যাটাগরিটি খুঁজে পাওয়া যায়নি। বাংলাদেশের সকল পর্যটন ক্যাটাগরি দেখুন।'
        : 'The requested tourism category could not be found. Browse all published tourism categories.';
      resolvedPath = `/categories/${encodeURIComponent(state.categoryDetailSlug || '')}/`;
      updateStructuredData(null);
    }
  } else if (!pageTitle && state.activeView === 'guides') {
    const publishedArticles = cmsStore.articles.filter(a => a.is_published === true && a.status !== 'draft');
    resolvedTitle = isBn
      ? 'ভ্রমণ নির্দেশিকা, গল্প ও ব্লগ | অপরূপ বাংলাদেশ'
      : 'Bangladesh Travel Guides, Stories & Blog | Beautiful Bangladesh';
    resolvedDesc = isBn
      ? 'বাংলাদেশের দর্শনীয় স্থান, বাজেট ও পারিবারিক ভ্রমণ টিপস, অ্যাডভেঞ্চার, ঐতিহাসিক ভ্রমণ ও মৌসুমি ভ্রমণ নির্দেশিকা বাংলা ও ইংরেজিতে পড়ুন।'
      : 'Explore curated Bangladesh travel guides, destination handbooks, budget & family travel tips, adventure journals, and seasonal itineraries in Bengali and English.';
    resolvedPath = '/travel-guides/';

    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Blog',
          name: isBn ? 'বাংলাদেশ ভ্রমণ নির্দেশিকা ও ব্লগ' : 'Bangladesh Travel Guides & Blog',
          description: resolvedDesc,
          url: `${window.location.origin}/travel-guides/`,
          inLanguage: state.lang
        },
        {
          '@type': 'ItemList',
          numberOfItems: publishedArticles.length,
          itemListElement: publishedArticles.slice(0, 12).map((art, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: isBn ? `${art.title_bn} (${art.title_en})` : `${art.title_en} (${art.title_bn})`,
            url: `${window.location.origin}/travel-guides/${encodeURIComponent((art.slug || art.id).toLowerCase())}/`
          }))
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: isBn ? 'ভ্রমণ নির্দেশিকা' : 'Travel Guides', item: `${window.location.origin}/travel-guides/` }
          ]
        }
      ]
    });
  } else if (!pageTitle && state.activeView === 'guide-detail' && state.guideDetailSlug !== null) {
    const art = state.guideDetailArticle;
    if (art && art.is_published === true && art.status !== 'draft') {
      const artSlug = (art.slug || art.id).toLowerCase();
      const artTitle = (isBn ? art.title_bn : art.title_en) || art.title_en || art.title_bn;
      const artExcerpt = (isBn ? art.excerpt_bn : art.excerpt_en) || art.excerpt_en || art.excerpt_bn || defaultDesc;
      const artAuthor = (isBn ? art.author_bn : art.author_en) || art.author_en || art.author_bn || '';
      const canonicalArtUrl = `${window.location.origin}/travel-guides/${encodeURIComponent(artSlug)}/`;

      resolvedTitle = isBn
        ? (art.seo_title_bn || `${artTitle} | ভ্রমণ নির্দেশিকা | অপরূপ বাংলাদেশ`)
        : (art.seo_title_en || `${artTitle} | Travel Guide | Beautiful Bangladesh`);
      resolvedDesc = isBn
        ? (art.seo_description_bn || artExcerpt)
        : (art.seo_description_en || artExcerpt);
      resolvedPath = `/travel-guides/${encodeURIComponent(artSlug)}/`;
      resolvedOgType = 'article';
      resolvedImage = art.image_url || undefined;

      const relDist = art.related_district_id
        ? cmsStore.districts.find(d => d.id.toLowerCase() === art.related_district_id.toLowerCase())
        : undefined;

      updateStructuredData({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            headline: artTitle,
            alternativeHeadline: isBn ? art.title_en : art.title_bn,
            description: resolvedDesc,
            image: art.image_url || undefined,
            datePublished: art.published_at || undefined,
            dateModified: art.updated_at || art.published_at || undefined,
            author: artAuthor
              ? {
                  '@type': 'Person',
                  name: artAuthor
                }
              : undefined,
            inLanguage: state.lang,
            keywords: Array.isArray(art.tags) && art.tags.length > 0 ? art.tags.join(', ') : undefined,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': canonicalArtUrl
            },
            about: relDist
              ? {
                  '@type': 'Place',
                  name: `${relDist.name_en} (${relDist.name_bn})`
                }
              : undefined
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
              { '@type': 'ListItem', position: 2, name: isBn ? 'ভ্রমণ নির্দেশিকা' : 'Travel Guides', item: `${window.location.origin}/travel-guides/` },
              { '@type': 'ListItem', position: 3, name: artTitle, item: canonicalArtUrl }
            ]
          }
        ]
      });
    } else if (state.guideDetailNotFound || !state.guideDetailLoading) {
      resolvedTitle = isBn
        ? 'ভ্রমণ নিবন্ধটি পাওয়া যায়নি | অপরূপ বাংলাদেশ'
        : 'Travel Article Not Found | Beautiful Bangladesh';
      resolvedDesc = isBn
        ? 'অনুরোধকৃত ভ্রমণ নিবন্ধটি খুঁজে পাওয়া যায়নি। বাংলাদেশের সকল প্রকাশিত ভ্রমণ নির্দেশিকা দেখুন।'
        : 'The requested travel article could not be found. Browse all published Bangladesh travel guides.';
      resolvedPath = `/travel-guides/${encodeURIComponent(state.guideDetailSlug || '')}/`;
      updateStructuredData(null);
    }
  } else if (!pageTitle && state.activeView === 'search') {
    const cleanQ = state.searchPageQuery.trim();
    resolvedTitle = cleanQ
      ? (isBn
          ? `"${cleanQ}" অনুসন্ধান ফলাফল | অপরূপ বাংলাদেশ`
          : `Search results for "${cleanQ}" | Beautiful Bangladesh`)
      : (isBn
          ? 'গ্লোবাল অনুসন্ধান — বিভাগ, জেলা, দর্শনীয় স্থান ও গাইড | অপরূপ বাংলাদেশ'
          : 'Global Search — Divisions, Districts, Spots & Guides | Beautiful Bangladesh');
    resolvedDesc = isBn
      ? 'বাংলাদেশের ৮টি বিভাগ, ৬৪টি জেলা, দর্শনীয় স্থান, ভ্রমণ নির্দেশিকা এবং পর্যটন ক্যাটাগরি একসাথে বাংলা ও ইংরেজিতে অনুসন্ধান করুন।'
      : 'Search across all 8 divisions, 64 districts, curated tourist spots, travel guides, and categories across Bangladesh in Bengali and English.';
    resolvedPath = buildSearchRouteUrl({
      q: state.searchPageQuery,
      type: state.searchPageTypeFilter,
      division: state.searchPageDivisionFilter,
      category: state.searchPageCategoryFilter,
      page: state.searchPageCurrentPage
    });

    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SearchResultsPage',
          name: resolvedTitle,
          description: resolvedDesc,
          url: `${window.location.origin}${resolvedPath}`,
          inLanguage: state.lang
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: isBn ? 'গ্লোবাল অনুসন্ধান' : 'Global Search', item: `${window.location.origin}/search/` }
          ]
        }
      ]
    });
  } else if (!pageTitle && state.activeView === 'about') {
    resolvedTitle = isBn
      ? 'আমাদের সম্পর্কে — লক্ষ্য, দৃষ্টিভঙ্গি ও পর্যটন অঙ্গীকার | অপরূপ বাংলাদেশ'
      : 'About Us — Mission, Vision & Travel Accuracy | Beautiful Bangladesh';
    resolvedDesc = isBn
      ? 'অপরূপ বাংলাদেশ পোর্টালের লক্ষ্য, দৃষ্টিভঙ্গি এবং বাংলাদেশের ৮ বিভাগ ও ৬৪ জেলার নির্ভুল দ্বিভাষিক পর্যটন তথ্য প্রদানের অঙ্গীকার সম্পর্কে জানুন।'
      : 'Learn about Beautiful Bangladesh—our mission, vision, bilingual coverage of all 8 divisions and 64 districts, and commitment to verified travel facts.';
    resolvedPath = '/about/';

    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'AboutPage',
          name: resolvedTitle,
          description: resolvedDesc,
          url: `${window.location.origin}/about/`,
          inLanguage: state.lang
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: isBn ? 'আমাদের সম্পর্কে' : 'About Us', item: `${window.location.origin}/about/` }
          ]
        }
      ]
    });
  } else if (!pageTitle && state.activeView === 'contact') {
    resolvedTitle = isBn
      ? 'যোগাযোগ করুন — মতামত ও তথ্য সংশোধন | অপরূপ বাংলাদেশ'
      : 'Contact Us — Inquiries & Editorial Corrections | Beautiful Bangladesh';
    resolvedDesc = isBn
      ? 'ভ্রমণ সংক্রান্ত প্রশ্ন, দর্শনীয় স্থানের তথ্য হালনাগাদ অথবা মতামত জানাতে অপরূপ বাংলাদেশ পোর্টালের নিরাপদ যোগাযোগ ফর্ম ব্যবহার করুন।'
      : 'Contact the Beautiful Bangladesh team with travel questions, destination updates, or feedback through our secure contact form.';
    resolvedPath = '/contact/';

    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ContactPage',
          name: resolvedTitle,
          description: resolvedDesc,
          url: `${window.location.origin}/contact/`,
          inLanguage: state.lang
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: isBn ? 'যোগাযোগ' : 'Contact Us', item: `${window.location.origin}/contact/` }
          ]
        }
      ]
    });
  } else if (!pageTitle && state.activeView === 'privacy-policy') {
    const docTitle = isBn ? cmsStore.legalPages.privacy_title_bn : cmsStore.legalPages.privacy_title_en;
    resolvedTitle = `${docTitle} | ${isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh'}`;
    resolvedDesc = isBn
      ? 'অপরূপ বাংলাদেশ পোর্টালের তথ্য সংগ্রহ, লোকাল স্টোরেজ, নিউজলেটার, তৃতীয় পক্ষের সেবা ও ডাটা সুরক্ষা সম্পর্কিত গোপনীয়তা নীতি।'
      : 'Privacy Policy detailing information collection, local storage, newsletter subscriptions, third-party services, and data protection on Beautiful Bangladesh.';
    resolvedPath = '/privacy-policy/';

    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: docTitle,
          description: resolvedDesc,
          url: `${window.location.origin}/privacy-policy/`,
          inLanguage: state.lang
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: docTitle, item: `${window.location.origin}/privacy-policy/` }
          ]
        }
      ]
    });
  } else if (!pageTitle && state.activeView === 'terms') {
    const docTitle = isBn ? cmsStore.legalPages.terms_title_bn : cmsStore.legalPages.terms_title_en;
    resolvedTitle = `${docTitle} | ${isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh'}`;
    resolvedDesc = isBn
      ? 'অপরূপ বাংলাদেশ পোর্টাল ব্যবহারের নিয়মাবলী, তথ্যের নির্ভুলতা ও ভ্রমণ সতর্কতা, কপিরাইট, বহিঃসংযোগ ও দায়বদ্ধতার শর্তাবলী।'
      : 'Terms and Conditions governing website usage, content and travel information disclaimers, copyright, external links, and limitation of liability.';
    resolvedPath = '/terms-and-conditions/';

    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: docTitle,
          description: resolvedDesc,
          url: `${window.location.origin}/terms-and-conditions/`,
          inLanguage: state.lang
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` },
            { '@type': 'ListItem', position: 2, name: docTitle, item: `${window.location.origin}/terms-and-conditions/` }
          ]
        }
      ]
    });
  } else if (!pageTitle && state.activeView === 'admin-login') {
    resolvedTitle = isBn
      ? 'নিরাপদ অ্যাডমিন লগইন | অপরূপ বাংলাদেশ'
      : 'Secure Admin Login | Beautiful Bangladesh';
    resolvedDesc = isBn
      ? 'বাংলাদেশ পর্যটন সিএমএস অ্যাডমিন পোর্টালের নিরাপদ প্রবেশদ্বার।'
      : 'Secure administrator authentication portal for Beautiful Bangladesh CMS.';
    resolvedPath = '/admin/login/';
    updateStructuredData(null);
  } else if (!pageTitle && state.activeView === 'cms') {
    const tabTitleMap: Record<CmsTab, { en: string; bn: string }> = {
      overview: { en: 'Admin Dashboard Overview', bn: 'অ্যাডমিন ড্যাশবোর্ড ওভারভিউ' },
      divisions: { en: 'Divisions Management', bn: 'বিভাগ ব্যবস্থাপনা' },
      districts: { en: 'Districts Management', bn: 'জেলা ব্যবস্থাপনা' },
      categories: { en: 'Categories Management', bn: 'ক্যাটাগরি ব্যবস্থাপনা' },
      spots: { en: 'Tourist Spots Management', bn: 'দর্শনীয় স্থান ব্যবস্থাপনা' },
      articles: { en: 'Travel Guides Management', bn: 'ভ্রমণ গাইড ব্যবস্থাপনা' },
      media: { en: 'Image Manager', bn: 'ইমেজ ম্যানেজার' },
      'hero-banners': { en: 'Hero Banner Images', bn: 'হিরো ব্যানার ইমেজ' },
      'ads-settings': { en: 'Ads Control Panel', bn: 'বিজ্ঞাপন নিয়ন্ত্রণ প্যানেল' },
      'seo-settings': { en: 'SEO Settings', bn: 'এসইও সেটিংস' },
      'website-settings': { en: 'Website Settings', bn: 'ওয়েবসাইট সেটিংস' }
    };
    const activeLabels = tabTitleMap[cmsStore.activeTab] || tabTitleMap.overview;
    resolvedTitle = isBn
      ? `${activeLabels.bn} | অপরূপ বাংলাদেশ`
      : `${activeLabels.en} | Beautiful Bangladesh`;
    resolvedDesc = isBn
      ? 'বাংলাদেশ পর্যটন কন্টেন্ট ম্যানেজমেন্ট সিস্টেম ড্যাশবোর্ড।'
      : 'Administrative Content Management System for Beautiful Bangladesh.';
    resolvedPath = getAdminRouteForTab(cmsStore.activeTab);
    updateStructuredData(null);
  } else if (!pageTitle) {
    resolvedPath = resolvedPath || '/';
    updateStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh',
          alternateName: isBn ? 'Beautiful Bangladesh' : 'অপরূপ বাংলাদেশ',
          url: `${window.location.origin}/`,
          inLanguage: ['bn', 'en'],
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}/search/?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'TouristDestination',
          name: isBn ? 'বাংলাদেশ' : 'Bangladesh',
          description: resolvedDesc,
          url: `${window.location.origin}/`,
          touristType: ['Nature Lovers', 'Cultural Travelers', 'Heritage Explorers', 'Beach Travelers']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isBn ? 'মূলপাতা' : 'Home', item: `${window.location.origin}/` }
          ]
        }
      ]
    });
  }

  let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
  if (state.activeView === 'admin-login' || state.activeView === 'cms') {
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, nofollow';
  } else if (state.seoSettings?.robots_index === 'noindex, nofollow') {
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, nofollow';
  } else if (robotsMeta) {
    robotsMeta.remove();
  }

  updateCanonicalAndSeo(resolvedTitle, resolvedDesc, resolvedPath, {
    ogType: resolvedOgType,
    imageUrl: resolvedImage,
    lang: state.lang
  });
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

// Helper to find published tourist spot by slug, id, or deterministic alias
function findPublishedSpotBySlugOrId(slugOrId: string | null, pool: TouristSpot[] = cmsStore.spots): TouristSpot | null {
  if (!slugOrId) return null;
  const target = slugOrId.trim().toLowerCase();
  const aliasTarget = FirestoreService.SPOT_SLUG_ALIASES[target];
  return (
    pool.find(
      s =>
        s.is_published === true &&
        (s.slug?.toLowerCase() === target ||
          s.id.toLowerCase() === target ||
          (!!aliasTarget && (s.slug?.toLowerCase() === aliasTarget || s.id.toLowerCase() === aliasTarget)))
    ) || null
  );
}

// Helper to find published category by slug, id, or canonical alias
function findPublishedCategoryBySlugOrId(slugOrId: string | null, pool: Category[] = cmsStore.categories): Category | null {
  if (!slugOrId) return null;
  const target = slugOrId.trim().toLowerCase();
  const aliasTarget = FirestoreService.CATEGORY_SLUG_ALIASES[target];
  return (
    pool.find(
      c =>
        c.is_published === true &&
        (c.slug?.toLowerCase() === target ||
          c.id.toLowerCase() === target ||
          (!!aliasTarget && (c.slug?.toLowerCase() === aliasTarget || c.id.toLowerCase() === aliasTarget)))
    ) || null
  );
}

// Hydrate divisions, districts, spots, and categories from Firestore without duplicating existing entries
async function loadPortalDataFromFirestore(force: boolean = false): Promise<void> {
  if (state.firestoreLoading) return;
  if (state.firestoreHydrated && !force) return;

  state.firestoreLoading = true;
  state.firestoreError = null;
  if (state.activeView !== 'admin-login' && state.activeView !== 'cms') {
    renderApp();
  }

  try {
    const [fsDivisions, fsDistricts, fsSpots, fsCategories, fsArticles, publicSettings] = await Promise.all([
      FirestoreService.getCollectionItems<Division>(COLLECTIONS.DIVISIONS, true),
      FirestoreService.getAllPublishedDistricts(),
      FirestoreService.getAllPublishedSpots(),
      FirestoreService.getAllPublishedCategories(),
      FirestoreService.getPublishedArticles(),
      SiteSettingsService.getAllPublicSettings()
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
      cmsStore.categories = fsCategories;
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

    state.websiteSettings = publicSettings.website;
    state.seoSettings = publicSettings.seo;
    state.adsSettings = publicSettings.ads;
    if (publicSettings.legal) {
      cmsStore.legalPages = publicSettings.legal;
    }

    state.firestoreHydrated = true;
  } catch (err: any) {
    console.warn('Could not load portal data from Firestore:', err);
    state.firestoreError =
      err instanceof Error ? err.message : 'Unable to retrieve division data from Firestore.';
  } finally {
    state.firestoreLoading = false;
    updateDynamicSeo();
    if (state.activeView !== 'admin-login' && state.activeView !== 'cms') {
      renderLayoutShell();
      renderApp();
    }
  }
}

let divisionDetailRequestSeq = 0;
let districtDetailRequestSeq = 0;
let spotDetailRequestSeq = 0;
let categoryDetailRequestSeq = 0;
let articleDetailRequestSeq = 0;

// Targeted Firestore loader for Dynamic Division Details Page (/divisions/:slug/)
async function loadDivisionDetailFromFirestore(slugOrId: string, force: boolean = false): Promise<void> {
  const normalizedSlug = slugOrId.trim().toLowerCase();
  if (!normalizedSlug) {
    divisionDetailRequestSeq += 1;
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

  const loadedDivisionMatches = Boolean(
    state.divisionDetailDivision &&
      (state.divisionDetailDivision.slug?.trim().toLowerCase() === normalizedSlug ||
        state.divisionDetailDivision.id.trim().toLowerCase() === normalizedSlug)
  );

  if (
    !force &&
    state.divisionDetailSlug === normalizedSlug &&
    !state.divisionDetailLoading &&
    (loadedDivisionMatches || state.divisionDetailNotFound)
  ) {
    return;
  }

  const requestId = ++divisionDetailRequestSeq;
  if (state.divisionDetailSlug !== normalizedSlug || !loadedDivisionMatches) {
    state.divisionDetailDivision = null;
    state.divisionDetailDistricts = [];
    state.divisionDetailSpots = [];
    state.divisionDetailArticles = [];
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
        FirestoreService.getAllPublishedCategories()
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

    if (requestId !== divisionDetailRequestSeq) return;
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
    if (requestId !== divisionDetailRequestSeq) return;
    console.warn(`Could not load division details for "${normalizedSlug}":`, err);
    state.divisionDetailError =
      err instanceof Error ? err.message : 'Unable to retrieve division details from Firestore.';
    state.divisionDetailDivision = null;
  } finally {
    if (requestId !== divisionDetailRequestSeq) return;
    state.divisionDetailLoading = false;
    updateDynamicSeo();
    renderApp();
  }
}

// Targeted Firestore loader for Dynamic District Details Page (/districts/:slug/)
async function loadDistrictDetailFromFirestore(slugOrId: string, force: boolean = false): Promise<void> {
  const normalizedSlug = slugOrId.trim().toLowerCase();
  if (!normalizedSlug) {
    districtDetailRequestSeq += 1;
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

  const loadedDistrictMatches = Boolean(
    state.districtDetailDistrict &&
      (state.districtDetailDistrict.slug?.trim().toLowerCase() === normalizedSlug ||
        state.districtDetailDistrict.id.trim().toLowerCase() === normalizedSlug)
  );

  if (
    !force &&
    state.districtDetailSlug === normalizedSlug &&
    !state.districtDetailLoading &&
    (loadedDistrictMatches || state.districtDetailNotFound)
  ) {
    return;
  }

  const requestId = ++districtDetailRequestSeq;
  if (state.districtDetailSlug !== normalizedSlug || !loadedDistrictMatches) {
    state.districtDetailDistrict = null;
    state.districtDetailDivision = null;
    state.districtDetailSiblingDistricts = [];
    state.districtDetailSpots = [];
    state.districtDetailArticles = [];
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
        FirestoreService.getAllPublishedCategories()
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

    if (requestId !== districtDetailRequestSeq) return;
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
    if (requestId !== districtDetailRequestSeq) return;
    console.warn(`Could not load district details for "${normalizedSlug}":`, err);
    state.districtDetailError =
      err instanceof Error ? err.message : 'Unable to retrieve district details from Firestore.';
    state.districtDetailDistrict = null;
  } finally {
    if (requestId !== districtDetailRequestSeq) return;
    state.districtDetailLoading = false;
    updateDynamicSeo();
    renderApp();
  }
}

// Targeted Firestore loader for Dynamic Tourist Spot Details Page (/places/:slug/)
async function loadSpotDetailFromFirestore(slugOrId: string, force: boolean = false): Promise<void> {
  const normalizedSlug = slugOrId.trim().toLowerCase();
  if (!normalizedSlug) {
    spotDetailRequestSeq += 1;
    state.spotDetailSlug = '';
    state.spotDetailSpot = null;
    state.spotDetailDivision = null;
    state.spotDetailDistrict = null;
    state.spotDetailNearbySpots = [];
    state.spotDetailArticles = [];
    state.spotDetailNotFound = true;
    state.spotDetailLoading = false;
    state.spotDetailError = null;
    updateDynamicSeo();
    renderApp();
    return;
  }

  const aliasTarget = FirestoreService.SPOT_SLUG_ALIASES[normalizedSlug];
  const loadedSpotMatches = Boolean(
    state.spotDetailSpot &&
      (state.spotDetailSpot.slug?.trim().toLowerCase() === normalizedSlug ||
        state.spotDetailSpot.id.trim().toLowerCase() === normalizedSlug ||
        (!!aliasTarget &&
          (state.spotDetailSpot.slug?.trim().toLowerCase() === aliasTarget ||
            state.spotDetailSpot.id.trim().toLowerCase() === aliasTarget)))
  );

  if (
    !force &&
    state.spotDetailSlug === normalizedSlug &&
    !state.spotDetailLoading &&
    (loadedSpotMatches || state.spotDetailNotFound)
  ) {
    return;
  }

  const requestId = ++spotDetailRequestSeq;
  if (state.spotDetailSlug !== normalizedSlug || !loadedSpotMatches) {
    state.spotDetailSpot = null;
    state.spotDetailDivision = null;
    state.spotDetailDistrict = null;
    state.spotDetailNearbySpots = [];
    state.spotDetailArticles = [];
  }
  state.spotDetailSlug = normalizedSlug;
  state.spotDetailLoading = true;
  state.spotDetailError = null;
  state.spotDetailNotFound = false;
  state.spotDetailGalleryIndex = 0;
  renderApp();

  try {
    let resolvedSpot = await FirestoreService.getSpotBySlug(normalizedSlug);
    let allFsSpots: TouristSpot[] = [];

    if (!resolvedSpot) {
      allFsSpots = await FirestoreService.getAllPublishedSpots();
      if (allFsSpots.length > 0) {
        cmsStore.spots = allFsSpots;
        resolvedSpot = findPublishedSpotBySlugOrId(normalizedSlug, allFsSpots);
      } else {
        resolvedSpot = findPublishedSpotBySlugOrId(normalizedSlug, cmsStore.spots);
      }
    }

    if (requestId !== spotDetailRequestSeq) return;
    if (!resolvedSpot || resolvedSpot.is_published !== true) {
      state.spotDetailSpot = null;
      state.spotDetailDivision = null;
      state.spotDetailDistrict = null;
      state.spotDetailNearbySpots = [];
      state.spotDetailArticles = [];
      state.spotDetailNotFound = true;
    } else {
      const [fsDiv, fsDist, fsDivSpots, fsCategories, fsArticles] = await Promise.all([
        FirestoreService.getDivisionBySlug(resolvedSpot.division_id),
        FirestoreService.getDistrictBySlug(resolvedSpot.district_id),
        FirestoreService.getPublishedSpotsByDivision(resolvedSpot.division_id),
        FirestoreService.getAllPublishedCategories(),
        FirestoreService.getPublishedArticles()
      ]);

      const resolvedDivision = fsDiv || findDivisionBySlugOrId(resolvedSpot.division_id);
      const resolvedDistrict = fsDist || findDistrictBySlugOrId(resolvedSpot.district_id);

      let nearbyCandidates: TouristSpot[] = [];
      if (fsDivSpots.length > 0) {
        nearbyCandidates = fsDivSpots.filter(s => s.is_published === true && s.id !== resolvedSpot!.id);
      } else if (allFsSpots.length > 0) {
        nearbyCandidates = allFsSpots.filter(
          s => s.is_published === true && s.id !== resolvedSpot!.id && s.division_id.toLowerCase() === resolvedSpot!.division_id.toLowerCase()
        );
      } else {
        const fsAllFallback = await FirestoreService.getAllPublishedSpots();
        if (fsAllFallback.length > 0) {
          cmsStore.spots = fsAllFallback;
          nearbyCandidates = fsAllFallback.filter(
            s => s.is_published === true && s.id !== resolvedSpot!.id && s.division_id.toLowerCase() === resolvedSpot!.division_id.toLowerCase()
          );
        } else {
          nearbyCandidates = cmsStore.spots.filter(
            s => s.is_published === true && s.id !== resolvedSpot!.id && s.division_id.toLowerCase() === resolvedSpot!.division_id.toLowerCase()
          );
        }
      }

      if (requestId !== spotDetailRequestSeq) return;
      if (fsCategories.length > 0) {
        cmsStore.categories = fsCategories;
      }

      state.spotDetailSpot = resolvedSpot;
      state.spotDetailDivision = resolvedDivision;
      state.spotDetailDistrict = resolvedDistrict;
      state.spotDetailNearbySpots = nearbyCandidates;
      state.spotDetailArticles = fsArticles.length > 0 ? fsArticles : cmsStore.articles.filter(a => a.is_published !== false);
      state.spotDetailNotFound = false;
    }
  } catch (err: any) {
    if (requestId !== spotDetailRequestSeq) return;
    console.warn(`Could not load tourist spot details for "${normalizedSlug}":`, err);
    state.spotDetailError =
      err instanceof Error ? err.message : 'Unable to retrieve destination details from Firestore.';
    state.spotDetailSpot = null;
  } finally {
    if (requestId !== spotDetailRequestSeq) return;
    state.spotDetailLoading = false;
    updateDynamicSeo();
    renderApp();
  }
}

// Targeted Firestore loader for Dynamic Category Details Page (/categories/:slug/)
async function loadCategoryDetailFromFirestore(slugOrId: string, force: boolean = false): Promise<void> {
  const normalizedSlug = slugOrId.trim().toLowerCase();
  if (!normalizedSlug) {
    categoryDetailRequestSeq += 1;
    state.categoryDetailSlug = '';
    state.categoryDetailCategory = null;
    state.categoryDetailSpots = [];
    state.categoryDetailNotFound = true;
    state.categoryDetailLoading = false;
    state.categoryDetailError = null;
    updateDynamicSeo();
    renderApp();
    return;
  }

  const catAliasTarget = FirestoreService.CATEGORY_SLUG_ALIASES[normalizedSlug];
  const loadedCategoryMatches = Boolean(
    state.categoryDetailCategory &&
      (state.categoryDetailCategory.slug?.trim().toLowerCase() === normalizedSlug ||
        state.categoryDetailCategory.id.trim().toLowerCase() === normalizedSlug ||
        (!!catAliasTarget &&
          (state.categoryDetailCategory.slug?.trim().toLowerCase() === catAliasTarget ||
            state.categoryDetailCategory.id.trim().toLowerCase() === catAliasTarget)))
  );

  if (
    !force &&
    state.categoryDetailSlug === normalizedSlug &&
    !state.categoryDetailLoading &&
    (loadedCategoryMatches || state.categoryDetailNotFound)
  ) {
    return;
  }

  const requestId = ++categoryDetailRequestSeq;
  if (state.categoryDetailSlug !== normalizedSlug || !loadedCategoryMatches) {
    state.categoryDetailCategory = null;
    state.categoryDetailSpots = [];
  }
  state.categoryDetailSlug = normalizedSlug;
  state.categoryDetailLoading = true;
  state.categoryDetailError = null;
  state.categoryDetailNotFound = false;
  renderApp();

  try {
    const [resolvedCategory, fsSpots, fsDivisions, fsDistricts, fsCategories] = await Promise.all([
      FirestoreService.getCategoryBySlug(normalizedSlug),
      FirestoreService.getAllPublishedSpots(),
      FirestoreService.getCollectionItems<Division>(COLLECTIONS.DIVISIONS, true),
      FirestoreService.getAllPublishedDistricts(),
      FirestoreService.getAllPublishedCategories()
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
      cmsStore.categories = fsCategories;
    }

    const activeCategory =
      resolvedCategory ||
      findPublishedCategoryBySlugOrId(normalizedSlug, cmsStore.categories);

    if (requestId !== categoryDetailRequestSeq) return;
    if (!activeCategory || activeCategory.is_published !== true) {
      state.categoryDetailCategory = null;
      state.categoryDetailSpots = [];
      state.categoryDetailNotFound = true;
    } else {
      const spotPool = fsSpots.length > 0 ? fsSpots : cmsStore.spots;
      state.categoryDetailCategory = activeCategory;
      state.categoryDetailSpots = spotPool.filter(
        s => s.is_published === true && FirestoreService.doesSpotMatchCategory(s, activeCategory)
      );
      state.categoryDetailNotFound = false;
      state.firestoreHydrated = true;
    }
  } catch (err: any) {
    if (requestId !== categoryDetailRequestSeq) return;
    console.warn(`Could not load category details for "${normalizedSlug}":`, err);
    state.categoryDetailError =
      err instanceof Error ? err.message : 'Unable to retrieve category details from Firestore.';
    state.categoryDetailCategory = null;
    state.categoryDetailSpots = [];
  } finally {
    if (requestId !== categoryDetailRequestSeq) return;
    state.categoryDetailLoading = false;
    updateDynamicSeo();
    renderApp();
  }
}

// Targeted Firestore loader for Dynamic Travel Article Details Page (/travel-guides/:slug/)
async function loadArticleDetailFromFirestore(slugOrId: string, force: boolean = false): Promise<void> {
  const normalizedSlug = slugOrId.trim().toLowerCase();
  if (!normalizedSlug) {
    articleDetailRequestSeq += 1;
    state.guideDetailSlug = '';
    state.guideDetailArticle = null;
    state.guideDetailNotFound = true;
    state.guideDetailLoading = false;
    state.guideDetailError = null;
    updateDynamicSeo();
    renderApp();
    return;
  }

  const loadedArticleMatches = Boolean(
    state.guideDetailArticle &&
      (state.guideDetailArticle.slug?.trim().toLowerCase() === normalizedSlug ||
        state.guideDetailArticle.id.trim().toLowerCase() === normalizedSlug)
  );

  if (
    !force &&
    state.guideDetailSlug === normalizedSlug &&
    !state.guideDetailLoading &&
    (loadedArticleMatches || state.guideDetailNotFound)
  ) {
    return;
  }

  const requestId = ++articleDetailRequestSeq;
  if (state.guideDetailSlug !== normalizedSlug || !loadedArticleMatches) {
    state.guideDetailArticle = null;
  }
  state.guideDetailSlug = normalizedSlug;
  state.guideDetailLoading = true;
  state.guideDetailError = null;
  state.guideDetailNotFound = false;
  renderApp();

  try {
    const [resolvedArticle, fsArticles, fsDivisions, fsDistricts, fsSpots] = await Promise.all([
      FirestoreService.getArticleBySlug(normalizedSlug),
      FirestoreService.getPublishedArticles(),
      FirestoreService.getCollectionItems<Division>(COLLECTIONS.DIVISIONS, true),
      FirestoreService.getAllPublishedDistricts(),
      FirestoreService.getAllPublishedSpots()
    ]);

    if (requestId !== articleDetailRequestSeq) return;
    if (fsDivisions.length > 0) {
      cmsStore.divisions = normalizeFirestoreDivisions(fsDivisions);
    }
    if (fsDistricts.length > 0) {
      cmsStore.districts = fsDistricts;
    }
    if (fsSpots.length > 0) {
      cmsStore.spots = fsSpots;
    }
    if (fsArticles.length > 0) {
      cmsStore.articles = fsArticles;
    }

    let finalArticle: Article | null = resolvedArticle;

    // Only allow local seed fallback when Firestore articles collection is completely unseeded
    if (!finalArticle && fsArticles.length === 0) {
      finalArticle =
        cmsStore.articles.find(
          art =>
            art.is_published === true &&
            art.status !== 'draft' &&
            ((art.slug && art.slug.trim().toLowerCase() === normalizedSlug) ||
              art.id.trim().toLowerCase() === normalizedSlug)
        ) || null;
    }

    if (!finalArticle || finalArticle.is_published !== true || finalArticle.status === 'draft') {
      state.guideDetailArticle = null;
      state.guideDetailNotFound = true;
    } else {
      state.guideDetailArticle = finalArticle;
      state.guideDetailNotFound = false;
      state.firestoreHydrated = true;
    }
  } catch (err: any) {
    if (requestId !== articleDetailRequestSeq) return;
    console.warn(`Could not load travel article for "${normalizedSlug}":`, err);
    state.guideDetailError =
      err instanceof Error ? err.message : 'Unable to retrieve travel article from Firestore.';
    state.guideDetailArticle = null;
  } finally {
    if (requestId !== articleDetailRequestSeq) return;
    state.guideDetailLoading = false;
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
  const footerRoot = document.getElementById('footer-root');

  if (state.activeView === 'admin-login' || state.activeView === 'cms') {
    if (navbarRoot) navbarRoot.innerHTML = '';
    if (footerRoot) footerRoot.innerHTML = '';
    syncGlobalAdScripts(state.adsSettings, false);
    return;
  }

  if (navbarRoot) {
    navbarRoot.innerHTML = renderNavbar({
      lang: state.lang,
      activeNav: state.activeView,
      savedCount: state.bookmarkedIds.size
    });
    initializeNavbarEventListeners();
  }

  if (footerRoot) {
    const footerAdHtml = renderAdSlotHtml('footer_banner', state.adsSettings, state.lang);
    footerRoot.innerHTML = `${footerAdHtml}${renderFooter(state.lang)}`;
    document.getElementById('btn-admin-portal')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.activeView === 'cms') {
        state.activeView = 'home';
        navigateToPath('/');
        renderLayoutShell();
        updateDynamicSeo();
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      void openProtectedAdminRoute(true);
    });
    hydrateRenderedAdSlots(state.adsSettings, true);
  }
  const win = window as Window & { __bdMountVisitorAds?: () => void };
  if (typeof win.__bdMountVisitorAds === 'function') {
    win.__bdMountVisitorAds();
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
  const navCats = document.getElementById('nav-item-categories');
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
  setNavLabel(navCats, t('nav_categories'));
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
    state.spotDetailArticles.find(a => a.id === articleId) ||
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

function getResolvedPlannerDays(): number {
  if (state.plannerDaysMode === 'custom') {
    return Math.max(1, Math.min(30, Math.round(state.plannerCustomDays || 10)));
  }
  const parsed = parseInt(state.plannerDaysMode, 10);
  return Math.max(1, Math.min(30, Number.isFinite(parsed) ? parsed : 7));
}

interface ParsedPostCost {
  min: number;
  max: number;
  isFree: boolean;
}

function normalizeCostDigits(text: string): string {
  const bnMap: Record<string, string> = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9'
  };
  return text
    .replace(/[০-৯]/g, ch => bnMap[ch] || ch)
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumericToken(token: string): number | null {
  const cleaned = token.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? Math.round(num) : null;
}

// Parse single amount or min-max range from a spot's post text (estimated_cost / entry_fee)
function parsePostCostText(rawText?: string): ParsedPostCost | null {
  if (!rawText || !rawText.trim()) return null;
  const normalized = normalizeCostDigits(rawText);

  // 1. Explicit range (e.g. "4,000 - 6,000", "৳3500-5000", "1500 থেকে 2500 টাকা")
  const rangeRegex = /(?:(?:৳|bdt|tk\.?|taka|টাকা)\s*)?(\d[\d,]*)\s*(?:-|to|থেকে)\s*(?:(?:৳|bdt|tk\.?|taka|টাকা)\s*)?(\d[\d,]*)(?!\s*(?:দিন|রাত|জন|ঘণ্টা|ঘন্টা|কিমি|days?|nights?|persons?|hours?|km)(?=$|[\s,.;:()/-]))/i;
  const rangeMatch = normalized.match(rangeRegex);
  if (rangeMatch) {
    const a = parseNumericToken(rangeMatch[1]);
    const b = parseNumericToken(rangeMatch[2]);
    if (a !== null && b !== null) {
      return { min: Math.min(a, b), max: Math.max(a, b), isFree: a === 0 && b === 0 };
    }
  }

  // 2. Currency-tagged numbers (e.g. "৳ 3,500", "500 টাকা", "BDT 2500", "50 টাকা / 200 টাকা")
  const currencyValues: number[] = [];
  const prefixCurrencyRegex = /(?:৳|bdt|tk\.?|taka)\s*(\d[\d,]*)/gi;
  const suffixCurrencyRegex = /(\d[\d,]*)\s*(?:৳|bdt|tk\.?|taka|টাকা)/gi;
  let match: RegExpExecArray | null;
  while ((match = prefixCurrencyRegex.exec(normalized)) !== null) {
    const val = parseNumericToken(match[1]);
    if (val !== null) currencyValues.push(val);
  }
  while ((match = suffixCurrencyRegex.exec(normalized)) !== null) {
    const val = parseNumericToken(match[1]);
    if (val !== null) currencyValues.push(val);
  }
  if (currencyValues.length > 0) {
    const min = Math.min(...currencyValues);
    const max = Math.max(...currencyValues);
    return { min, max, isFree: min === 0 && max === 0 };
  }

  // 3. Free entry indicators with no positive currency numbers
  if (/(free|no fee|no entry|বিনামূল্যে|ফ্রি|টিকিট ফ্রি|প্রবেশ ফ্রি)/i.test(normalized)) {
    return { min: 0, max: 0, isFree: true };
  }

  // 4. Fallback: standalone numbers after stripping obvious non-currency unit phrases
  const withoutUnits = normalized.replace(
    /\d[\d,]*\s*(?:দিন|রাত|জন|ঘণ্টা|ঘন্টা|মিনিট|কিমি|days?|nights?|persons?|people|hours?|hrs?|mins?|km)(?=$|[\s,.;:()/-])/gi,
    ' '
  );
  const plainValues: number[] = [];
  const plainRegex = /\d[\d,]*/g;
  while ((match = plainRegex.exec(withoutUnits)) !== null) {
    const val = parseNumericToken(match[0]);
    if (val !== null) plainValues.push(val);
  }
  if (plainValues.length > 0) {
    const min = Math.min(...plainValues);
    const max = Math.max(...plainValues);
    return { min, max, isFree: min === 0 && max === 0 };
  }

  return null;
}

function formatBdtRange(min: number, max: number, isBn: boolean): string {
  const langKey = isBn ? 'bn' : 'en';
  if (min === 0 && max === 0) {
    return isBn ? 'বিনামূল্যে (৳ ০)' : 'Free (BDT 0)';
  }
  const minStr = formatLocalizedNumber(min, langKey);
  const maxStr = formatLocalizedNumber(max, langKey);
  if (min === max) {
    return isBn ? `৳ ${minStr}` : `BDT ${minStr}`;
  }
  return isBn ? `৳ ${minStr} – ${maxStr}` : `BDT ${minStr} – ${maxStr}`;
}

function getPublishedPlannerCategories(): Category[] {
  return cmsStore.categories.filter(c => c.is_published !== false);
}

function getResolvedPlannerCategoryIds(publishedCategories: Category[] = getPublishedPlannerCategories()): string[] {
  const validIds = new Set(publishedCategories.map(c => c.id));
  const selected = state.plannerSelectedCategoryIds.filter(id => validIds.has(id));
  if (selected.length > 0 || state.plannerSelectionCustomized) {
    return selected;
  }
  return publishedCategories.slice(0, Math.min(4, publishedCategories.length)).map(c => c.id);
}

function spotMatchesCategory(spot: TouristSpot, cat: Category): boolean {
  if (!Array.isArray(spot.category_ids)) return false;
  const catIdLower = cat.id.toLowerCase();
  const catSlugLower = (cat.slug || '').toLowerCase();
  return spot.category_ids.some(cid => {
    const c = cid.toLowerCase();
    return c === catIdLower || (catSlugLower !== '' && c === catSlugLower);
  });
}

function isMeaningfulCostText(raw?: string): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return !/^(?:-|–|—|n\/a|na|none|null|undefined|উল্লেখ নেই|তথ্য নেই|যাচাইকৃত না হলে ফাঁকা রাখুন|leave blank if unverified)$/i.test(
    trimmed
  );
}

function getSpotStayWeight(spot: TouristSpot, cat: Category): number {
  const catId = (cat.id || '').toLowerCase();
  const ids = Array.isArray(spot.category_ids) ? spot.category_ids.map(x => x.toLowerCase()) : [];
  const hasAny = (list: string[]) => list.includes(catId) || ids.some(id => list.includes(id));

  let weight = 1.4;
  if (hasAny(['hills', 'forests', 'islands'])) {
    weight = 2.8;
  } else if (hasAny(['beaches', 'lakes'])) {
    weight = 2.4;
  } else if (hasAny(['rivers', 'wildlife'])) {
    weight = 1.9;
  } else if (hasAny(['historical', 'archaeological', 'waterfalls'])) {
    weight = 1.5;
  } else {
    weight = 1.2;
  }

  if (spot.is_featured) weight += 0.6;
  if ((spot.rating || 0) >= 4.7) weight += 0.3;
  return weight;
}

// Allocate totalDays across stops using weighted largest-remainder apportionment (every stop >= 1 day)
function allocateStayDays(
  stops: Array<{ spot: TouristSpot; matchedCategory: Category }>,
  totalDays: number
): number[] {
  const count = stops.length;
  if (count === 0) return [];
  if (totalDays <= count) {
    return stops.map((_, i) => (i < totalDays ? 1 : 0));
  }

  const allocated = new Array<number>(count).fill(1);
  const remaining = totalDays - count;
  const weights = stops.map(item => getSpotStayWeight(item.spot, item.matchedCategory));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0) || count;

  const quotas = weights.map((w, index) => {
    const exact = (remaining * w) / totalWeight;
    const base = Math.floor(exact);
    allocated[index] += base;
    return { index, remainder: exact - base, weight: w };
  });

  const leftover = remaining - quotas.reduce((sum, q) => sum + Math.floor((remaining * q.weight) / totalWeight), 0);
  quotas.sort((a, b) => (b.remainder !== a.remainder ? b.remainder - a.remainder : b.weight - a.weight));

  for (let i = 0; i < leftover; i++) {
    allocated[quotas[i % quotas.length].index] += 1;
  }
  return allocated;
}

// Generate Multi-Category Trip Itinerary with Stay-Duration Grouping & Post-Sourced Cost Estimation
function generateTripPlan(days: number, selectedCategoryIds: string[]): string {
  const isBn = state.lang === 'bn';
  const totalDays = Math.max(1, Math.min(30, Math.round(days || 7)));
  const fmtNum = (n: number) => (isBn ? toBengaliNumerals(String(n)) : String(n));

  const publishedCategories = getPublishedPlannerCategories();
  const selectedCategories = publishedCategories.filter(c => selectedCategoryIds.includes(c.id));

  if (selectedCategories.length === 0) {
    return `
      <div class="text-center py-4 px-2">
        <i class="bi bi-ui-checks-grid fs-2 text-warning d-block mb-2" aria-hidden="true"></i>
        <div class="fw-bold text-primary-bd mb-1">
          ${isBn ? 'কমপক্ষে একটি ভ্রমণ ক্যাটাগরি নির্বাচন করুন' : 'Select at least one travel category'}
        </div>
        <p class="small text-muted mb-0">
          ${isBn
            ? 'বাম পাশ থেকে আপনার পছন্দের এক বা একাধিক ক্যাটাগরি (অথবা "সবগুলো নির্বাচন") বাছাই করুন—তাহলে পোস্টের তথ্য অনুযায়ী ভ্রমণ পরিকল্পনা ও সম্ভাব্য খরচ দেখতে পাবেন।'
            : 'Choose one or more categories (or "Select All") on the left to generate an itinerary and post-based cost estimate.'}
        </p>
      </div>
    `;
  }

  const publishedSpots = cmsStore.spots
    .filter(s => s.is_published !== false)
    .sort((a, b) => {
      const featDiff = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
      if (featDiff !== 0) return featDiff;
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (a.name_en || '').localeCompare(b.name_en || '');
    });

  // Cap target stops so multi-day trips (e.g. 14 or 30 days) recommend multi-day stays instead of 1-day rushing
  const targetMaxStops =
    totalDays <= 5
      ? totalDays
      : Math.min(totalDays, Math.max(Math.min(totalDays, selectedCategories.length), Math.ceil(totalDays / 2)));

  // Round-robin selection across chosen categories for balanced multi-category coverage
  const categoryQueues = selectedCategories.map(cat => ({
    cat,
    spots: publishedSpots.filter(spot => spotMatchesCategory(spot, cat))
  }));

  const selectedStops: Array<{ spot: TouristSpot; matchedCategory: Category }> = [];
  const usedSpotIds = new Set<string>();

  let progressed = true;
  while (selectedStops.length < targetMaxStops && progressed) {
    progressed = false;
    for (const queue of categoryQueues) {
      if (selectedStops.length >= targetMaxStops) break;
      const nextSpot = queue.spots.find(s => !usedSpotIds.has(s.id));
      if (nextSpot) {
        usedSpotIds.add(nextSpot.id);
        selectedStops.push({ spot: nextSpot, matchedCategory: queue.cat });
        progressed = true;
      }
    }
  }

  if (selectedStops.length === 0) {
    const selectedNames = selectedCategories.map(c => escapeHtml(isBn ? c.name_bn : c.name_en)).join(', ');
    return `
      <div class="text-center py-4 px-2">
        <i class="bi bi-geo-alt fs-2 text-secondary d-block mb-2" aria-hidden="true"></i>
        <div class="fw-bold text-primary-bd mb-1">
          ${isBn ? 'নির্বাচিত ক্যাটাগরিতে এখনো কোনো প্রকাশিত গন্তব্য পোস্ট নেই' : 'No published destination posts found for the selected categories'}
        </div>
        <p class="small text-muted mb-0">
          ${isBn
            ? `নির্বাচিত ক্যাটাগরি: ${selectedNames}। অনুগ্রহ করে আরও ক্যাটাগরি নির্বাচন করুন অথবা অ্যাডমিন প্যানেল থেকে গন্তব্য পোস্ট প্রকাশ করুন।`
            : `Selected: ${selectedNames}. Please select additional categories or publish destination posts in the CMS.`}
        </p>
      </div>
    `;
  }

  // Group geographically by division order so consecutive stays follow a practical route
  const divisionOrderMap = new Map<string, number>();
  CANONICAL_DIVISION_ORDER.forEach((divId, idx) => divisionOrderMap.set(divId.toLowerCase(), idx));

  const sortedStops = [...selectedStops].sort((a, b) => {
    const aOrder = divisionOrderMap.get((a.spot.division_id || '').toLowerCase()) ?? 99;
    const bOrder = divisionOrderMap.get((b.spot.division_id || '').toLowerCase()) ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return getSpotStayWeight(b.spot, b.matchedCategory) - getSpotStayWeight(a.spot, a.matchedCategory);
  });

  const dayAllocations = allocateStayDays(sortedStops, totalDays);

  interface StayBlock {
    spot: TouristSpot;
    matchedCategory: Category;
    stayDays: number;
    startDay: number;
    endDay: number;
  }

  const stayBlocks: StayBlock[] = [];
  let cursorDay = 1;
  sortedStops.forEach((item, index) => {
    const stayDays = dayAllocations[index] || 0;
    if (stayDays <= 0) return;
    stayBlocks.push({
      spot: item.spot,
      matchedCategory: item.matchedCategory,
      stayDays,
      startDay: cursorDay,
      endDay: cursorDay + stayDays - 1
    });
    cursorDay += stayDays;
  });

  // Aggregate post-sourced cost data across unique destinations in the plan
  let estMinTotal = 0;
  let estMaxTotal = 0;
  let estCount = 0;
  let feeMinTotal = 0;
  let feeMaxTotal = 0;
  let feeCount = 0;
  let postsWithNumericCost = 0;

  for (const { spot } of stayBlocks) {
    const rawEst = (isBn ? spot.estimated_cost_bn : spot.estimated_cost_en) || spot.estimated_cost_bn || spot.estimated_cost_en || '';
    const rawFee = (isBn ? spot.entry_fee_bn : spot.entry_fee_en) || spot.entry_fee_bn || spot.entry_fee_en || '';
    const estText = isMeaningfulCostText(rawEst) ? rawEst.trim() : '';
    const feeText = isMeaningfulCostText(rawFee) ? rawFee.trim() : '';
    const parsedEst = parsePostCostText(estText);
    const parsedFee = parsePostCostText(feeText);

    if (parsedEst || parsedFee) postsWithNumericCost++;

    if (parsedEst) {
      estMinTotal += parsedEst.min;
      estMaxTotal += parsedEst.max;
      estCount++;
    }
    if (parsedFee) {
      feeMinTotal += parsedFee.min;
      feeMaxTotal += parsedFee.max;
      feeCount++;
    }
  }

  const combinedMin = estMinTotal + feeMinTotal;
  const combinedMax = estMaxTotal + feeMaxTotal;
  const missingCostCount = stayBlocks.length - postsWithNumericCost;

  // Category-wise day distribution summary
  const categoryDayTotals = new Map<string, { cat: Category; days: number }>();
  for (const block of stayBlocks) {
    const existing = categoryDayTotals.get(block.matchedCategory.id);
    if (existing) {
      existing.days += block.stayDays;
    } else {
      categoryDayTotals.set(block.matchedCategory.id, { cat: block.matchedCategory, days: block.stayDays });
    }
  }

  const isAllSelected = selectedCategories.length === publishedCategories.length && publishedCategories.length > 0;
  const categorySummaryLabel = isAllSelected
    ? (isBn ? `সবগুলো ক্যাটাগরি (${fmtNum(selectedCategories.length)}টি)` : `All Categories (${selectedCategories.length})`)
    : selectedCategories.length <= 2
      ? selectedCategories.map(c => (isBn ? c.name_bn : c.name_en)).join(' + ')
      : isBn
        ? `${selectedCategories.slice(0, 2).map(c => c.name_bn).join(', ')} ও আরও ${fmtNum(selectedCategories.length - 2)}টি`
        : `${selectedCategories.slice(0, 2).map(c => c.name_en).join(', ')} + ${selectedCategories.length - 2} more`;

  const planTitle = isBn
    ? `${fmtNum(totalDays)} দিনের ভ্রমণ ও অবস্থান পরিকল্পনা • ${categorySummaryLabel}`
    : `${totalDays}-Day Stay & Route Plan • ${categorySummaryLabel}`;

  const categoryBreakdownHtml = `
    <div class="d-flex flex-wrap align-items-center gap-1 mb-3">
      <span class="badge bg-primary-bd text-white">
        ${isBn
          ? `${fmtNum(stayBlocks.length)}টি স্থানে মোট ${fmtNum(totalDays)} দিন`
          : `${totalDays} Days across ${stayBlocks.length} Places`}
      </span>
      ${Array.from(categoryDayTotals.values())
        .map(
          entry => `
            <span class="badge bg-light text-dark border small fw-normal">
              <i class="bi ${escapeHtml(entry.cat.icon || 'bi-tag')} text-success me-1" aria-hidden="true"></i>${escapeHtml(
                isBn ? entry.cat.name_bn : entry.cat.name_en
              )}: <strong>${isBn ? `${fmtNum(entry.days)} দিন` : `${entry.days}d`}</strong>
            </span>
          `
        )
        .join('')}
    </div>
  `;

  let costSummaryHtml = '';
  if (postsWithNumericCost > 0) {
    costSummaryHtml = `
      <div class="planner-budget-summary mb-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div class="fw-bold text-primary-bd small">
            <i class="bi bi-cash-stack text-success me-1" aria-hidden="true"></i>
            ${isBn ? 'পোস্টের তথ্য অনুযায়ী সম্ভাব্য খরচ' : 'Estimated Cost (From Post Data)'}
          </div>
          <span class="badge bg-white text-secondary border small">
            ${isBn
              ? `${fmtNum(postsWithNumericCost)}/${fmtNum(stayBlocks.length)}টি পোস্ট থেকে প্রাপ্ত`
              : `From ${postsWithNumericCost}/${stayBlocks.length} posts`}
          </span>
        </div>
        <div class="row g-2">
          <div class="col-sm-4">
            <div class="planner-budget-metric">
              <div class="planner-budget-label">${isBn ? 'মোট সম্ভাব্য খরচ' : 'Estimated Total'}</div>
              <div class="planner-budget-value text-primary-bd">${escapeHtml(formatBdtRange(combinedMin, combinedMax, isBn))}</div>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="planner-budget-metric">
              <div class="planner-budget-label">${isBn ? 'ভ্রমণ ও থাকা-খাওয়া' : 'Trip Cost (Posts)'}</div>
              <div class="planner-budget-value text-dark">
                ${estCount > 0 ? escapeHtml(formatBdtRange(estMinTotal, estMaxTotal, isBn)) : `<span class="text-muted fw-normal">${isBn ? 'উল্লেখ নেই' : 'Not listed'}</span>`}
              </div>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="planner-budget-metric">
              <div class="planner-budget-label">${isBn ? 'মোট প্রবেশ ফি' : 'Entry Fees (Posts)'}</div>
              <div class="planner-budget-value text-dark">
                ${feeCount > 0 ? escapeHtml(formatBdtRange(feeMinTotal, feeMaxTotal, isBn)) : `<span class="text-muted fw-normal">${isBn ? 'উল্লেখ নেই' : 'Not listed'}</span>`}
              </div>
            </div>
          </div>
        </div>
        <div class="small text-muted mt-2" style="font-size: 0.78rem;">
          <i class="bi bi-info-circle me-1" aria-hidden="true"></i>
          ${missingCostCount > 0
            ? (isBn
                ? `এই রুটের ${fmtNum(stayBlocks.length)}টি গন্তব্যের মধ্যে ${fmtNum(missingCostCount)}টি পোস্টে এখনো খরচের তথ্য যুক্ত করা হয়নি।`
                : `${missingCostCount} of ${stayBlocks.length} destination posts in this route do not have cost info entered yet.`)
            : (isBn
                ? `রুটের সকল ${fmtNum(stayBlocks.length)}টি গন্তব্য পোস্টের খরচের তথ্য হিসাব করা হয়েছে।`
                : `Includes cost info from all ${stayBlocks.length} destination posts in this route.`)}
        </div>
      </div>
    `;
  } else {
    costSummaryHtml = `
      <div class="planner-budget-summary planner-budget-empty mb-3">
        <div class="fw-bold text-primary-bd small mb-1">
          <i class="bi bi-cash-coin text-warning me-1" aria-hidden="true"></i>
          ${isBn ? 'সম্ভাব্য খরচ ও প্রবেশ ফি' : 'Estimated Cost & Entry Fee'}
        </div>
        <div class="small text-secondary mb-0">
          ${isBn
            ? 'এই রুটের গন্তব্য পোস্টগুলোতে এখনো "সম্ভাব্য খরচ" বা "প্রবেশ ফি" যুক্ত করা হয়নি।'
            : 'Estimated cost or entry fee has not been added to the destination posts in this route yet.'}
        </div>
      </div>
    `;
  }

  const itemsHtml = stayBlocks
    .map(block => {
      const { spot, matchedCategory, stayDays, startDay, endDay } = block;
      const spotName = isBn ? (spot.name_bn || spot.name_en) : (spot.name_en || spot.name_bn);
      const spotSlug = encodeURIComponent((spot.slug || spot.id).toLowerCase());
      const dist = cmsStore.districts.find(d => d.id === spot.district_id);
      const div = cmsStore.divisions.find(d => d.id === spot.division_id);
      const distName = dist ? (isBn ? dist.name_bn : dist.name_en) : spot.district_id;
      const divName = div ? (isBn ? div.name_bn : div.name_en) : '';
      const locationText = divName ? `${distName}, ${divName}` : distName;
      const catName = isBn ? matchedCategory.name_bn : matchedCategory.name_en;

      const dayRangeBadge =
        stayDays === 1
          ? isBn
            ? `দিন ${fmtNum(startDay)} (১ দিন)`
            : `Day ${startDay} (1 Day)`
          : isBn
            ? `দিন ${fmtNum(startDay)}–${fmtNum(endDay)} (${fmtNum(stayDays)} দিন)`
            : `Days ${startDay}–${endDay} (${stayDays} Days)`;

      const stayNote =
        stayDays >= 3
          ? isBn
            ? `এখানে ${fmtNum(stayDays)} দিন থাকলে মূল আকর্ষণ ও আশপাশ ভালোভাবে ঘুরে দেখা যাবে`
            : `Recommended ${stayDays}-day stay to explore highlights & surroundings comfortably`
          : stayDays === 2
            ? isBn
              ? `২ দিন থাকার উপযোগী (মূল স্পট ও রাত্রিযাপন)`
              : `2-day stay for relaxed sightseeing & overnight`
            : isBn
              ? `১ দিনের সংক্ষিপ্ত ভ্রমণ`
              : `1-day focused visit`;

      const rawEst = (isBn ? spot.estimated_cost_bn : spot.estimated_cost_en) || spot.estimated_cost_bn || spot.estimated_cost_en || '';
      const rawFee = (isBn ? spot.entry_fee_bn : spot.entry_fee_en) || spot.entry_fee_bn || spot.entry_fee_en || '';
      const estText = isMeaningfulCostText(rawEst) ? rawEst.trim() : '';
      const feeText = isMeaningfulCostText(rawFee) ? rawFee.trim() : '';

      let postCostLine = '';
      if (estText || feeText) {
        const parts: string[] = [];
        if (estText) {
          parts.push(`${isBn ? 'সম্ভাব্য খরচ' : 'Est. cost'}: <strong>${escapeHtml(estText)}</strong>`);
        }
        if (feeText) {
          parts.push(`${isBn ? 'প্রবেশ ফি' : 'Entry fee'}: <strong>${escapeHtml(feeText)}</strong>`);
        }
        postCostLine = `
          <div class="planner-spot-cost mt-1">
            <i class="bi bi-receipt-cutoff text-success me-1" aria-hidden="true"></i>${parts.join(' • ')}
          </div>
        `;
      } else {
        postCostLine = `
          <div class="planner-spot-cost text-muted mt-1">
            <i class="bi bi-dash-circle me-1" aria-hidden="true"></i>${isBn ? 'পোস্টে খরচের তথ্য যুক্ত নেই' : 'Cost not listed in post'}
          </div>
        `;
      }

      return `
        <div class="planner-day-item">
          <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
            <div>
              <span class="badge bg-primary-bd text-white me-2">${escapeHtml(dayRangeBadge)}</span>
              <a
                href="/places/${spotSlug}/"
                class="fw-bold text-primary-bd text-decoration-none spot-detail-link"
                data-spot-slug="${spotSlug}"
                data-spot-id="${escapeHtml(spot.id)}"
              >${escapeHtml(spotName)}</a>
              <span class="text-muted small ms-1">(${escapeHtml(locationText)})</span>
            </div>
            <span class="badge bg-light text-secondary border small">
              <i class="bi ${escapeHtml(matchedCategory.icon || 'bi-tag')} me-1" aria-hidden="true"></i>${escapeHtml(catName)}
            </span>
          </div>
          <div class="planner-stay-note text-secondary mt-1">
            <i class="bi bi-calendar2-check text-primary-bd me-1" aria-hidden="true"></i>${escapeHtml(stayNote)}
          </div>
          ${postCostLine}
        </div>
      `;
    })
    .join('');

  return `
    <div class="fw-bold text-primary-bd mb-2">${escapeHtml(planTitle)}</div>
    ${categoryBreakdownHtml}
    ${costSummaryHtml}
    <div class="small text-dark planner-itinerary-list">
      ${itemsHtml}
    </div>
  `;
}

function stopHeroCarousel(): void {
  if (heroCarouselTimer !== null) {
    window.clearInterval(heroCarouselTimer);
    heroCarouselTimer = null;
  }
}

function setHeroSlide(index: number): void {
  const heroSlides = getActiveHeroSlides(state.websiteSettings);
  const total = heroSlides.length;
  if (total === 0) return;
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
    const slide = heroSlides[nextIndex];
    captionEl.textContent = state.lang === 'bn' ? slide.label_bn : slide.label_en;
  }
}

function startHeroCarousel(): void {
  stopHeroCarousel();
  heroCarouselPaused = false;
  const carouselEl = document.getElementById('hero-carousel');
  const heroSlides = getActiveHeroSlides(state.websiteSettings);
  if (!carouselEl || heroSlides.length <= 1) return;

  heroCarouselTimer = window.setInterval(() => {
    if (!heroCarouselPaused && document.visibilityState !== 'hidden' && document.getElementById('hero-carousel')) {
      setHeroSlide(state.heroSlideIndex + 1);
    }
  }, 4000);
}

// ============================================================================
// MAIN RENDER FUNCTION (Handles Portal vs CMS)
// ============================================================================
function renderApp(): void {
  renderAppContent();
  const isPublicView = state.activeView !== 'admin-login' && state.activeView !== 'cms';
  hydrateRenderedAdSlots(state.adsSettings, isPublicView);
}

function renderAppContent(): void {
  const root = document.getElementById('app-root');
  if (!root) return;

  stopHeroCarousel();
  const isBn = state.lang === 'bn';

  // 0. Render Dedicated Secure Admin Login Page (/admin/login/)
  if (state.activeView === 'admin-login') {
    if (!adminRuntime) {
      root.innerHTML = `
        <div class="admin-login-shell d-flex align-items-center justify-content-center min-vh-100" role="status" aria-live="polite">
          <div class="text-center text-white">
            <div class="spinner-border text-light mb-3" style="width: 2.5rem; height: 2.5rem;" aria-hidden="true"></div>
            <p class="mb-0">${isBn ? 'অ্যাডমিন পোর্টাল লোড হচ্ছে...' : 'Loading Admin Portal...'}</p>
          </div>
        </div>
      `;
      void ensureAdminRuntime().then(() => renderApp());
      return;
    }
    root.innerHTML = adminRuntime.renderAdminLoginPage({
      lang: state.lang,
      email: state.adminLoginEmail,
      rememberSession: state.adminLoginRememberSession,
      isSubmitting: state.adminLoginSubmitting,
      showPassword: state.adminLoginShowPassword,
      feedback: state.adminLoginFeedback
    });
    attachAdminLoginEventListeners();
    return;
  }

  // 1. Render Protected CMS Dashboard (/admin/) ONLY after verified admin session succeeds
  if (state.activeView === 'cms') {
    if (!adminRuntime) {
      root.innerHTML = `
        <div class="admin-login-shell d-flex align-items-center justify-content-center min-vh-100" role="status" aria-live="polite">
          <div class="text-center text-white">
            <div class="spinner-border text-light mb-3" style="width: 2.5rem; height: 2.5rem;" aria-hidden="true"></div>
            <p class="mb-0">${isBn ? 'সেশন যাচাই করা হচ্ছে...' : 'Verifying administrator session...'}</p>
          </div>
        </div>
      `;
      void ensureAdminRuntime().then(() => renderApp());
      return;
    }

    if (state.adminAuthStatus === 'checking') {
      root.innerHTML = adminRuntime.renderAdminVerifyingGate(state.lang);
      return;
    }

    if (!adminRuntime.isVerifiedAdminActive() || !state.adminSession) {
      navigateToAdminLogin('unauthorized', true);
      return;
    }

    root.innerHTML = adminRuntime.renderCmsDashboard(
      state.lang, 
      () => {
        state.activeView = 'home';
        navigateToPath('/');
        renderLayoutShell();
        updateDynamicSeo();
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
      error: state.firestoreError,
      adSlotHtml: renderAdSlotHtml('directory_top', state.adsSettings, state.lang)
    });
    attachPlacesPageEventListeners();
    return;
  }

  // 7. Render Dedicated Dynamic Tourist Spot Details Page (/places/:slug/)
  if (state.activeView === 'spot-detail') {
    root.innerHTML = renderSpotDetailPage({
      lang: state.lang,
      requestedSlug: state.spotDetailSlug || '',
      spot: state.spotDetailSpot,
      division: state.spotDetailDivision,
      district: state.spotDetailDistrict,
      categories: cmsStore.categories,
      nearbySpots: state.spotDetailNearbySpots,
      articles: state.spotDetailArticles,
      bookmarkedIds: state.bookmarkedIds,
      galleryIndex: state.spotDetailGalleryIndex,
      isLoading: state.spotDetailLoading,
      error: state.spotDetailError,
      adSlotHtml: renderAdSlotHtml('spot_detail_mid', state.adsSettings, state.lang, { compact: true })
    });
    attachSpotDetailPageEventListeners();
    return;
  }

  // 8. Render Dedicated Category Discovery Page (/categories/)
  if (state.activeView === 'categories') {
    root.innerHTML = renderAllCategoriesPage({
      lang: state.lang,
      categories: cmsStore.categories,
      spots: cmsStore.spots,
      isLoading: state.firestoreLoading,
      error: state.firestoreError
    });
    attachCategoriesPageEventListeners();
    return;
  }

  // 9. Render Dedicated Dynamic Category Details Page (/categories/:slug/)
  if (state.activeView === 'category-detail') {
    root.innerHTML = renderCategoryDetailPage({
      lang: state.lang,
      requestedSlug: state.categoryDetailSlug || '',
      category: state.categoryDetailCategory,
      divisions: cmsStore.divisions,
      districts: cmsStore.districts,
      categories: cmsStore.categories,
      spots: state.categoryDetailSpots,
      bookmarkedIds: state.bookmarkedIds,
      divisionFilter: state.categoryDetailDivisionFilter,
      districtFilter: state.categoryDetailDistrictFilter,
      currentPage: state.categoryDetailCurrentPage,
      isLoading: state.categoryDetailLoading,
      error: state.categoryDetailError
    });
    attachCategoryDetailPageEventListeners();
    return;
  }

  // 10. Render Dedicated Travel Guides & Blog Page (/travel-guides/)
  if (state.activeView === 'guides') {
    root.innerHTML = renderTravelGuidesPage({
      lang: state.lang,
      articles: cmsStore.articles,
      districts: cmsStore.districts.filter(d => d.is_published !== false),
      searchQuery: state.guidesSearchQuery,
      categoryFilter: state.guidesCategoryFilter,
      currentPage: state.guidesCurrentPage,
      isLoading: state.firestoreLoading,
      error: state.firestoreError,
      adSlotHtml: renderAdSlotHtml('directory_top', state.adsSettings, state.lang)
    });
    attachTravelGuidesPageEventListeners();
    return;
  }

  // 11. Render Dedicated Dynamic Travel Article Details Page (/travel-guides/:slug/)
  if (state.activeView === 'guide-detail') {
    root.innerHTML = renderArticleDetailPage({
      lang: state.lang,
      requestedSlug: state.guideDetailSlug || '',
      article: state.guideDetailArticle,
      allArticles: cmsStore.articles,
      districts: cmsStore.districts.filter(d => d.is_published !== false),
      divisions: cmsStore.divisions.filter(d => d.is_published !== false),
      spots: cmsStore.spots.filter(s => s.is_published === true),
      isLoading: state.guideDetailLoading,
      error: state.guideDetailError,
      adSlotHtml: renderAdSlotHtml('article_detail_mid', state.adsSettings, state.lang)
    });
    attachArticleDetailPageEventListeners();
    return;
  }

  // 12. Render Dedicated Global Search Page (/search/)
  if (state.activeView === 'search') {
    root.innerHTML = renderSearchPage({
      lang: state.lang,
      divisions: cmsStore.divisions,
      districts: cmsStore.districts,
      categories: cmsStore.categories,
      spots: cmsStore.spots,
      articles: cmsStore.articles,
      query: state.searchPageQuery,
      typeFilter: state.searchPageTypeFilter,
      divisionFilter: state.searchPageDivisionFilter,
      categoryFilter: state.searchPageCategoryFilter,
      currentPage: state.searchPageCurrentPage,
      isLoading: state.firestoreLoading,
      error: state.firestoreError
    });
    attachSearchPageEventListeners();
    return;
  }

  // 13. Render Static Info & Legal Pages (/about/, /contact/, /privacy-policy/, /terms-and-conditions/)
  if (state.activeView === 'about') {
    root.innerHTML = renderAboutPage({
      lang: state.lang,
      divisionsCount: cmsStore.divisions.filter(d => d.is_published !== false).length,
      districtsCount: cmsStore.districts.filter(d => d.is_published !== false).length,
      spotsCount: cmsStore.spots.filter(s => s.is_published === true).length,
      categoriesCount: cmsStore.categories.filter(c => c.is_published === true).length,
      articlesCount: cmsStore.articles.filter(a => a.is_published === true && a.status !== 'draft').length
    });
    return;
  }

  if (state.activeView === 'contact') {
    root.innerHTML = renderContactPage({
      lang: state.lang,
      contactEmail: state.websiteSettings.contact_email || cmsStore.legalPages.contact_email,
      formState: state.contactForm
    });
    attachContactPageEventListeners();
    return;
  }

  if (state.activeView === 'privacy-policy') {
    root.innerHTML = renderPrivacyPolicyPage({
      lang: state.lang,
      legalPages: cmsStore.legalPages
    });
    attachLegalPageEventListeners();
    return;
  }

  if (state.activeView === 'terms') {
    root.innerHTML = renderTermsAndConditionsPage({
      lang: state.lang,
      legalPages: cmsStore.legalPages
    });
    attachLegalPageEventListeners();
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

  const hasCustomHeroHeading = isBn
    ? state.websiteSettings.hero_heading_bn !== DEFAULT_WEBSITE_SETTINGS.hero_heading_bn
    : state.websiteSettings.hero_heading_en !== DEFAULT_WEBSITE_SETTINGS.hero_heading_en;
  const hasCustomHeroSubtitle = isBn
    ? state.websiteSettings.hero_subtitle_bn !== DEFAULT_WEBSITE_SETTINGS.hero_subtitle_bn
    : state.websiteSettings.hero_subtitle_en !== DEFAULT_WEBSITE_SETTINGS.hero_subtitle_en;

  const heroSlides = getActiveHeroSlides(state.websiteSettings);
  const activeHeroIdx = ((state.heroSlideIndex % heroSlides.length) + heroSlides.length) % heroSlides.length;
  state.heroSlideIndex = activeHeroIdx;

  // Render Public Portal HTML
  root.innerHTML = `
    ${state.websiteSettings.maintenance_mode ? `
      <div class="alert alert-warning rounded-0 mb-0 py-2 text-center small fw-semibold border-bottom" role="status">
        <i class="bi bi-tools me-2"></i>
        ${isBn
          ? 'পোর্টাল রক্ষণাবেক্ষণ সতর্কতা: কিছু তথ্য ও ছবি হালনাগাদ করা হচ্ছে।'
          : 'Portal Maintenance Notice: Content updates and database synchronization are currently in progress.'}
      </div>
    ` : ''}
    <!-- Hero Section with Sliding Background Carousel -->
    <section class="hero-wrapper hero-with-carousel" id="hero-carousel">
      <div class="hero-bg-slides" aria-hidden="true">
        ${heroSlides.map((slide, idx) => `
          <div class="hero-bg-slide ${idx === activeHeroIdx ? 'active' : ''}">
            <img
              src="${optimizeImageUrl(slide.image_url, 1600)}"
              alt="${escapeHtml(isBn ? slide.label_bn : slide.label_en)}"
              class="hero-bg-img"
              loading="eager"
              fetchpriority="${idx === 0 ? 'high' : 'auto'}"
              decoding="async"
              onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80';"
            >
          </div>
        `).join('')}
      </div>

      <div class="container hero-content-layer">
        <div class="row align-items-center g-3">
          <div class="col-lg-9">
            <div class="hero-pill-badge">
              <i class="bi bi-compass"></i>
              <span>${t('hero_badge')}</span>
            </div>
            <h1 class="hero-title mb-2">
              ${hasCustomHeroHeading
                ? escapeHtml(isBn ? state.websiteSettings.hero_heading_bn : state.websiteSettings.hero_heading_en)
                : `${t('hero_title_1')}<br><span>${t('hero_title_2')}</span>`}
            </h1>
            <p class="hero-subtitle mb-3">
              ${hasCustomHeroSubtitle
                ? escapeHtml(isBn ? state.websiteSettings.hero_subtitle_bn : state.websiteSettings.hero_subtitle_en)
                : t('hero_subtitle')}
            </p>

            <div class="d-flex flex-wrap gap-2">
              <a href="/divisions/" class="btn btn-accent px-4 py-2 rounded-pill" id="hero-btn-divisions">
                <i class="bi bi-grid-fill me-2"></i>${t('nav_divisions')}
              </a>
              <a href="/districts/" class="btn btn-outline-light px-4 py-2 rounded-pill" id="hero-btn-districts">
                <i class="bi bi-geo-alt-fill me-2"></i>${t('nav_districts')}
              </a>
            </div>
          </div>
        </div>

        <div class="hero-carousel-center-wrap d-flex flex-column align-items-center justify-content-center gap-2 mt-3">
          <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill" style="background: rgba(18, 60, 50, 0.72); border: 1px solid rgba(255, 255, 255, 0.2);">
            <i class="bi bi-geo-alt-fill text-warning small"></i>
            <span class="hero-slide-caption" id="hero-slide-caption">
              ${escapeHtml(isBn ? heroSlides[activeHeroIdx].label_bn : heroSlides[activeHeroIdx].label_en)}
            </span>
          </div>

          <div class="hero-carousel-controls" id="hero-carousel-controls" role="region" aria-label="${isBn ? 'হিরো ইমেজ স্লাইডার' : 'Hero image carousel controls'}">
            <button type="button" class="hero-carousel-nav-btn" id="hero-prev-btn" aria-label="${isBn ? 'আগের ছবি' : 'Previous slide'}">
              <i class="bi bi-chevron-left"></i>
            </button>
            <div class="hero-carousel-dots">
              ${heroSlides.map((slide, idx) => `
                <button
                  type="button"
                  class="hero-carousel-dot ${idx === activeHeroIdx ? 'active' : ''}"
                  data-hero-slide="${idx}"
                  aria-label="${escapeHtml(isBn ? slide.label_bn : slide.label_en)}"
                  aria-current="${idx === activeHeroIdx ? 'true' : 'false'}"
                ></button>
              `).join('')}
            </div>
            <button type="button" class="hero-carousel-nav-btn" id="hero-next-btn" aria-label="${isBn ? 'পরের ছবি' : 'Next slide'}">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Floating Global Search & Filter Bar Component -->
    <div class="container">
      <div class="search-card-wrapper">
        <div class="row g-3 align-items-center">
          <div class="col-lg-6">
            <div class="input-group">
              <div class="search-input-group flex-grow-1">
                <i class="bi bi-search search-icon-inside"></i>
                <input 
                  type="text" 
                  class="form-control" 
                  id="global-search-input" 
                  placeholder="${t('search_placeholder')}" 
                  aria-label="${escapeHtml(t('search_placeholder'))}"
                  value="${escapeHtml(state.searchQuery)}"
                >
              </div>
              <button
                type="button"
                id="home-global-search-go-btn"
                class="btn btn-primary-bd px-3 fw-semibold"
                title="${isBn ? 'গ্লোবাল সার্চ পাতায় যান' : 'Open Global Search Page'}"
              >
                <i class="bi bi-arrow-right-circle me-1 d-none d-sm-inline" aria-hidden="true"></i>${isBn ? 'সব খুঁজুন' : 'Search All'}
              </button>
            </div>
          </div>
          <div class="col-sm-6 col-lg-3">
            <select class="form-select" id="filter-division-select" aria-label="${escapeHtml(t('filter_all_divisions'))}" style="padding: 0.75rem 1rem; border-radius: 10px;">
              <option value="all">${t('filter_all_divisions')}</option>
              ${publishedDivisions.map(d => `
                <option value="${d.id}" ${state.divisionFilter === d.id ? 'selected' : ''}>
                  ${isBn ? d.name_bn : d.name_en} (${d.districts_count} ${t('districts_count_label')})
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-sm-6 col-lg-3">
            <select class="form-select" id="filter-category-select" aria-label="${escapeHtml(t('filter_all_categories'))}" style="padding: 0.75rem 1rem; border-radius: 10px;">
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

    ${renderAdSlotHtml('home_banner', state.adsSettings, state.lang)}

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
          <i class="bi bi-compass text-muted" style="font-size: 3.5rem;" aria-hidden="true"></i>
          <h3 class="h4 fw-bold text-primary-bd mt-3">${t('no_results_title')}</h3>
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

    ${renderAdSlotHtml('home_mid', state.adsSettings, state.lang)}

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

            ${(() => {
              const plannerCategories = getPublishedPlannerCategories();
              const resolvedCategoryIds = getResolvedPlannerCategoryIds(plannerCategories);
              const selectedSet = new Set(resolvedCategoryIds);
              const fmtPlannerCount = (n: number) => (isBn ? toBengaliNumerals(String(n)) : String(n));
              return `
            <form id="trip-planner-form">
              <div class="mb-3">
                <label for="planner-days-select" class="form-label fw-bold text-primary-bd small">${t('planner_days')}</label>
                <select class="form-select" id="planner-days-select">
                  <option value="3" ${state.plannerDaysMode === '3' ? 'selected' : ''}>${isBn ? '৩ দিন (সাপ্তাহিক ছুটি)' : '3 Days (Weekend Short Trip)'}</option>
                  <option value="5" ${state.plannerDaysMode === '5' ? 'selected' : ''}>${isBn ? '৫ দিন (মাঝারি ভ্রমণ)' : '5 Days (Mid-Length Explorer)'}</option>
                  <option value="7" ${state.plannerDaysMode === '7' ? 'selected' : ''}>${isBn ? '৭ দিন (গোল্ডেন রুট)' : '7 Days (Golden Route)'}</option>
                  <option value="10" ${state.plannerDaysMode === '10' ? 'selected' : ''}>${isBn ? '১০ দিন (সম্পূর্ণ বাংলাদেশ দর্শন)' : '10 Days (Grand Bangladesh Tour)'}</option>
                  <option value="14" ${state.plannerDaysMode === '14' ? 'selected' : ''}>${isBn ? '১৪ দিন (মহা-ভ্রমণ: দেশজুড়ে)' : '14 Days (Ultimate Cross-Country)'}</option>
                  <option value="custom" ${state.plannerDaysMode === 'custom' ? 'selected' : ''}>${isBn ? 'নিজের মতো দিন সংখ্যা (১–৩০ দিন)' : 'Custom Days (1–30 Days)'}</option>
                </select>
              </div>

              <div class="mb-3 ${state.plannerDaysMode === 'custom' ? '' : 'd-none'}" id="planner-custom-days-wrap">
                <label for="planner-custom-days" class="form-label fw-bold text-primary-bd small">
                  ${isBn ? 'দিন সংখ্যা লিখুন (১ থেকে ৩০ দিন)' : 'Enter Number of Days (1 to 30)'}
                </label>
                <input
                  type="number"
                  class="form-control"
                  id="planner-custom-days"
                  min="1"
                  max="30"
                  value="${state.plannerCustomDays}"
                >
              </div>

              <div class="mb-4">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <label class="form-label fw-bold text-primary-bd small mb-0">
                    ${t('planner_vibe')}
                    <span class="text-muted fw-normal">(${isBn ? 'একাধিক নির্বাচন করুন' : 'Multi-select'})</span>
                  </label>
                  <div class="d-flex align-items-center gap-1">
                    <span class="badge bg-light text-primary-bd border" id="planner-cats-count-badge">
                      ${isBn
                        ? `${fmtPlannerCount(selectedSet.size)}/${fmtPlannerCount(plannerCategories.length)}টি`
                        : `${selectedSet.size}/${plannerCategories.length}`}
                    </span>
                    <button type="button" class="btn btn-sm btn-outline-bd py-0 px-2" id="planner-cats-select-all" style="font-size: 0.76rem;">
                      ${isBn ? 'সবগুলো নির্বাচন' : 'Select All'}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" id="planner-cats-clear" style="font-size: 0.76rem;">
                      ${isBn ? 'পরিষ্কার' : 'Clear'}
                    </button>
                  </div>
                </div>
                <div class="planner-cat-grid" id="planner-category-grid" role="group" aria-label="${escapeHtml(t('planner_vibe'))}">
                  ${plannerCategories.map(cat => {
                    const checked = selectedSet.has(cat.id);
                    return `
                      <label class="planner-cat-chip ${checked ? 'active' : ''}">
                        <input
                          type="checkbox"
                          class="planner-cat-checkbox"
                          name="planner-category"
                          value="${escapeHtml(cat.id)}"
                          ${checked ? 'checked' : ''}
                        >
                        <i class="bi ${escapeHtml(cat.icon || 'bi-tag')}" aria-hidden="true"></i>
                        <span>${escapeHtml(isBn ? cat.name_bn : cat.name_en)}</span>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>

              <button type="submit" class="btn btn-primary-bd w-100 py-2">
                <i class="bi bi-lightning-charge-fill me-1" aria-hidden="true"></i>${t('generate_plan')}
              </button>
            </form>
          </div>

          <div class="col-lg-7">
            <div class="p-4 rounded-3 bg-light border h-100 d-flex flex-column justify-content-center">
              <h3 class="h5 fw-bold text-primary-bd mb-3">
                <i class="bi bi-journal-bookmark-fill text-warning me-2" aria-hidden="true"></i>
                ${isBn ? 'প্রস্তাবিত ভ্রমণ পথ ও সম্ভাব্য খরচ' : 'Recommended Route & Estimated Cost'}
              </h3>
              <div id="planner-output-box" class="p-3 rounded bg-white border">
                ${generateTripPlan(getResolvedPlannerDays(), resolvedCategoryIds)}
              </div>
            </div>
          </div>
              `;
            })()}
        </div>
      </div>
    </section>

    <!-- SECTION 5: Travel Guides & Articles -->
    <section class="container py-5" id="guides">
      <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <span class="badge bg-secondary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'ভ্রমণ ব্লগ ও ফিচার' : 'Featured Articles'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">${t('section_guides_title')}</h2>
          <p class="text-muted mb-0">${t('section_guides_desc')}</p>
        </div>
        <a href="/travel-guides/" class="btn btn-outline-bd rounded-pill px-4 fw-semibold">
          <i class="bi bi-journal-richtext me-1" aria-hidden="true"></i>${isBn ? 'সকল ভ্রমণ গাইড দেখুন' : 'View All Travel Guides'}
        </a>
      </div>

      <div class="row g-4">
        ${publishedArticles.map(art => `
          <div class="col-lg-4 col-md-6">
            <article class="card-travel">
              <div class="card-travel-img-box" style="height: 180px;">
                <img src="${optimizeImageUrl(art.image_url, 600)}" alt="${escapeHtml(isBn ? art.title_bn : art.title_en)}" class="card-travel-img" loading="lazy" decoding="async">
                <span class="card-badge-rating">
                  <i class="bi bi-clock me-1" aria-hidden="true"></i>${escapeHtml(isBn ? art.read_time_bn : art.read_time_en)}
                </span>
              </div>
              <div class="card-travel-body">
                <div class="small text-muted mb-2">
                  <i class="bi bi-person me-1" aria-hidden="true"></i>${escapeHtml(isBn ? art.author_bn : art.author_en)}
                </div>
                <h3 class="h5 card-travel-title" style="font-size: 1.1rem;">
                  <a
                    href="/travel-guides/${encodeURIComponent((art.slug || art.id).toLowerCase())}/"
                    class="text-decoration-none text-primary-bd article-detail-link"
                    data-article-slug="${escapeHtml((art.slug || art.id).toLowerCase())}"
                  >${escapeHtml(isBn ? art.title_bn : art.title_en)}</a>
                </h3>
                <p class="card-travel-desc small">${escapeHtml(isBn ? art.excerpt_bn : art.excerpt_en)}</p>
                <div class="d-flex justify-content-between align-items-center gap-2 mt-auto pt-2 border-top">
                  <div class="d-flex flex-wrap gap-1">
                    ${art.tags.slice(0, 2).map(tag => `<span class="badge bg-light text-secondary border small">${escapeHtml(tag)}</span>`).join('')}
                  </div>
                  <a
                    href="/travel-guides/${encodeURIComponent((art.slug || art.id).toLowerCase())}/"
                    class="btn btn-sm btn-link text-primary-bd fw-bold text-decoration-none p-0 flex-shrink-0 article-detail-link"
                    data-article-slug="${escapeHtml((art.slug || art.id).toLowerCase())}"
                  >
                    ${isBn ? 'পড়ুন' : 'Read More'} <i class="bi bi-arrow-right" aria-hidden="true"></i>
                  </a>
                </div>
              </div>
            </article>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- SECTION 6: Newsletter Subscription -->
    ${renderNewsletter(state.lang)}
  `;

  attachPublicPortalEventListeners();
}

// Attach Event Listeners to Public Portal
function attachPublicPortalEventListeners(): void {
  // Hero Carousel controls & auto-slide
  const heroCarousel = document.getElementById('hero-carousel');
  if (heroCarousel) {
    startHeroCarousel();
    const heroControls = document.getElementById('hero-carousel-controls');
    heroControls?.addEventListener('mouseenter', () => { heroCarouselPaused = true; });
    heroControls?.addEventListener('mouseleave', () => { heroCarouselPaused = false; });
    heroControls?.addEventListener('focusin', () => { heroCarouselPaused = true; });
    heroControls?.addEventListener('focusout', () => { heroCarouselPaused = false; });

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

  // Global Search input on Homepage
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
    searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        state.searchPageQuery = sanitizeSearchInput(searchInput.value);
        state.searchPageTypeFilter = 'all';
        state.searchPageDivisionFilter = state.divisionFilter || 'all';
        state.searchPageCategoryFilter = state.categoryFilter || 'all';
        state.searchPageCurrentPage = 1;
        openSearchPage(true);
      }
    });
  }

  document.getElementById('home-global-search-go-btn')?.addEventListener('click', () => {
    const currentInput = document.getElementById('global-search-input') as HTMLInputElement | null;
    state.searchPageQuery = sanitizeSearchInput(currentInput?.value ?? state.searchQuery);
    state.searchPageTypeFilter = 'all';
    state.searchPageDivisionFilter = state.divisionFilter || 'all';
    state.searchPageCategoryFilter = state.categoryFilter || 'all';
    state.searchPageCurrentPage = 1;
    openSearchPage(true);
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

  // Trip planner form controls & submission
  const daysSelectEl = document.getElementById('planner-days-select') as HTMLSelectElement | null;
  const customDaysWrapEl = document.getElementById('planner-custom-days-wrap');
  const customDaysInputEl = document.getElementById('planner-custom-days') as HTMLInputElement | null;
  const plannerCategoryCheckboxes = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[name="planner-category"]')
  );
  const plannerCountBadge = document.getElementById('planner-cats-count-badge');
  const plannerOutBox = document.getElementById('planner-output-box');

  const syncPlannerCategoryUiAndOutput = () => {
    const selectedIds: string[] = [];
    for (const cb of plannerCategoryCheckboxes) {
      const chip = cb.closest('.planner-cat-chip');
      if (cb.checked) {
        selectedIds.push(cb.value);
        chip?.classList.add('active');
      } else {
        chip?.classList.remove('active');
      }
    }
    state.plannerSelectedCategoryIds = selectedIds;
    state.plannerSelectionCustomized = true;

    if (plannerCountBadge) {
      const totalCats = plannerCategoryCheckboxes.length;
      plannerCountBadge.textContent =
        state.lang === 'bn'
          ? `${toBengaliNumerals(String(selectedIds.length))}/${toBengaliNumerals(String(totalCats))}টি`
          : `${selectedIds.length}/${totalCats}`;
    }

    const days = getResolvedPlannerDays();
    state.itineraryResult = generateTripPlan(days, selectedIds);
    if (plannerOutBox) {
      plannerOutBox.innerHTML = state.itineraryResult;
    }
  };

  daysSelectEl?.addEventListener('change', () => {
    const val = (daysSelectEl.value || '7') as AppState['plannerDaysMode'];
    state.plannerDaysMode = val;
    if (customDaysWrapEl) {
      customDaysWrapEl.classList.toggle('d-none', val !== 'custom');
    }
    syncPlannerCategoryUiAndOutput();
  });

  customDaysInputEl?.addEventListener('input', () => {
    const parsed = parseInt(customDaysInputEl.value || '10', 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 30) {
      state.plannerCustomDays = parsed;
      syncPlannerCategoryUiAndOutput();
    }
  });

  for (const cb of plannerCategoryCheckboxes) {
    cb.addEventListener('change', () => {
      syncPlannerCategoryUiAndOutput();
    });
  }

  document.getElementById('planner-cats-select-all')?.addEventListener('click', () => {
    for (const cb of plannerCategoryCheckboxes) {
      cb.checked = true;
    }
    syncPlannerCategoryUiAndOutput();
  });

  document.getElementById('planner-cats-clear')?.addEventListener('click', () => {
    for (const cb of plannerCategoryCheckboxes) {
      cb.checked = false;
    }
    syncPlannerCategoryUiAndOutput();
  });

  document.getElementById('trip-planner-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const mode = (daysSelectEl?.value || '7') as AppState['plannerDaysMode'];
    state.plannerDaysMode = mode;
    if (mode === 'custom') {
      const customVal = parseInt(customDaysInputEl?.value || '10', 10);
      state.plannerCustomDays = Math.max(1, Math.min(30, Number.isFinite(customVal) ? customVal : 10));
      if (customDaysInputEl) customDaysInputEl.value = String(state.plannerCustomDays);
    }

    const selectedIds = plannerCategoryCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
    if (selectedIds.length === 0) {
      showToast(
        state.lang === 'bn'
          ? 'অনুগ্রহ করে কমপক্ষে ১টি ক্যাটাগরি নির্বাচন করুন।'
          : 'Please select at least 1 category.',
        'warning'
      );
    }
    syncPlannerCategoryUiAndOutput();
  });

  // Article Read More buttons
  document.querySelectorAll('.article-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const articleId = btn.getAttribute('data-article-id');
      if (articleId) openArticleModal(articleId);
    });
  });

  // Newsletter form submission
  attachNewsletterFormListener();
}

// ============================================================================
// ADMIN AUTHENTICATION CONTROLLERS & ROUTE GUARDS (/admin/login/ & /admin/)
// ============================================================================
function getAdminFeedbackForReason(
  reason: 'unauthorized' | 'expired' | 'signed_out' | 'error',
  customMessage?: string
): AdminLoginFeedback {
  const isBn = state.lang === 'bn';
  switch (reason) {
    case 'expired':
      return {
        type: 'warning',
        message:
          customMessage ||
          (isBn
            ? 'আপনার অ্যাডমিন সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে পুনরায় সাইন-ইন করুন।'
            : 'Your administrator session has expired. Please sign in again.')
      };
    case 'unauthorized':
      return {
        type: 'error',
        message:
          customMessage ||
          (isBn
            ? 'প্রবেশাধিকার সংরক্ষিত। অ্যাডমিন ড্যাশবোর্ড দেখতে অনুমোদিত অ্যাডমিন অ্যাকাউন্ট দিয়ে সাইন-ইন করুন।'
            : 'Administrator authorization is required to access the management dashboard.')
      };
    case 'signed_out':
      return {
        type: 'success',
        message:
          customMessage ||
          (isBn
            ? 'আপনি নিরাপদে অ্যাডমিন পোর্টাল থেকে সাইন-আউট হয়েছেন।'
            : 'You have been securely signed out of the administrator portal.')
      };
    case 'error':
      return {
        type: 'error',
        message:
          customMessage ||
          (isBn
            ? 'সেশন যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।'
            : 'Unable to verify administrator session. Please sign in again.')
      };
  }
}

function dismissOpenAdminModals(): void {
  ['cmsCrudModal', 'cmsConfirmModal', 'cmsImagePreviewModal'].forEach(modalId => {
    const modalEl = document.getElementById(modalId);
    if (modalEl && modalEl.classList.contains('show')) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    }
  });
}

function navigateToAdminLogin(
  reason?: 'unauthorized' | 'expired' | 'signed_out' | 'error',
  replaceUrl: boolean = false,
  customMessage?: string
): void {
  dismissOpenAdminModals();
  state.activeView = 'admin-login';
  state.adminLoginSubmitting = false;
  state.adminLoginFeedback = reason ? getAdminFeedbackForReason(reason, customMessage) : null;
  navigateToPath('/admin/login/', replaceUrl);
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAdminSidebarDrawer(): void {
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  const toggleBtn = document.getElementById('admin-sidebar-toggle-btn');
  sidebar?.classList.remove('open');
  backdrop?.classList.remove('open');
  toggleBtn?.setAttribute('aria-expanded', 'false');
}

function openAdminSidebarDrawer(): void {
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  const toggleBtn = document.getElementById('admin-sidebar-toggle-btn');
  sidebar?.classList.add('open');
  backdrop?.classList.add('open');
  toggleBtn?.setAttribute('aria-expanded', 'true');
}

let adminDashboardLoadPromise: Promise<void> | null = null;

async function loadAdminDashboardData(force: boolean = false, silent: boolean = false): Promise<void> {
  const rt = await ensureAdminRuntime();
  if (!rt.isVerifiedAdminActive()) return;
  if (adminDashboardLoadPromise && !force) {
    return adminDashboardLoadPromise;
  }
  if (rt.adminDashboardState.status === 'loaded' && !force) {
    return;
  }

  if (!silent || rt.adminDashboardState.status !== 'loaded') {
    rt.adminDashboardState.status = 'loading';
    rt.adminDashboardState.errorMessage = null;
    if (state.activeView === 'cms') {
      renderApp();
    }
  }

  const task = (async () => {
    try {
      const snapshot = await rt.fetchAdminDashboardSnapshot();
      snapshot.districts = FirestoreService.normalizeDistrictAdministrativeDivision(snapshot.districts);
      rt.syncCmsStoreFromAdminSnapshot(snapshot);
      state.websiteSettings = snapshot.websiteSettings;
      state.seoSettings = snapshot.seoSettings;
      state.adsSettings = snapshot.adsSettings;
      state.firestoreHydrated = true;
    } catch (err: any) {
      if (err?.message === 'ADMIN_UNAUTHORIZED') {
        void handleAdminSessionExpired();
        return;
      }
      if (!silent || rt.adminDashboardState.status !== 'loaded') {
        rt.adminDashboardState.status = 'error';
        rt.adminDashboardState.errorMessage =
          err instanceof Error
            ? err.message
            : state.lang === 'bn'
              ? 'ফায়ারস্টোর থেকে ড্যাশবোর্ডের পরিসংখ্যান আনা যায়নি।'
              : 'Failed to retrieve live statistics from Cloud Firestore.';
      }
    } finally {
      adminDashboardLoadPromise = null;
      if (state.activeView === 'cms') {
        renderApp();
      }
    }
  })();

  adminDashboardLoadPromise = task;
  await task;
}

async function handleAdminSessionExpired(): Promise<void> {
  const rt = await ensureAdminRuntime();
  rt.resetAdminDashboardState();
  await rt.secureAdminSignOut();
  state.adminSession = null;
  state.adminAuthStatus = 'expired';
  state.currentUser = null;
  if (state.activeView === 'cms') {
    navigateToAdminLogin('expired', true);
  }
}

async function openAdminLoginPage(pushUrl: boolean = true): Promise<void> {
  const win = window as Window & { __bdVisitorStaticAdsLoaded?: boolean };
  if (win.__bdVisitorStaticAdsLoaded) {
    if (pushUrl) {
      window.location.assign('/admin/login/');
    } else {
      window.location.replace('/admin/login/');
    }
    return;
  }
  if (pushUrl) {
    navigateToPath('/admin/login/');
  }
  state.activeView = 'admin-login';
  state.adminLoginSubmitting = false;
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();

  const rt = await ensureAdminRuntime();
  if (state.activeView !== 'admin-login') return;

  // If already signed in as a verified admin, redirect straight to Admin Dashboard
  const outcome = await rt.verifyCurrentAdminSession(false, () => {
    void handleAdminSessionExpired();
  });

  if (state.activeView !== 'admin-login') return;

  if (outcome.status === 'authenticated') {
    state.adminSession = outcome.session;
    state.adminAuthStatus = 'authenticated';
    state.currentUser = rt.auth.currentUser;
    state.adminLoginFeedback = null;
    state.activeView = 'cms';
    navigateToPath(getAdminRouteForTab(cmsStore.activeTab), true);
    renderLayoutShell();
    updateDynamicSeo();
    renderApp();
    void loadAdminDashboardData(false);
  } else if (outcome.status === 'expired') {
    state.adminSession = null;
    state.adminAuthStatus = 'expired';
    state.adminLoginFeedback = getAdminFeedbackForReason('expired');
    renderApp();
  } else if (outcome.status === 'unauthorized') {
    state.adminSession = null;
    state.adminAuthStatus = 'unauthorized';
    state.adminLoginFeedback = getAdminFeedbackForReason('unauthorized', rt.mapAdminAuthError({ code: outcome.code || 'NOT_AUTHORIZED' }, state.lang));
    renderApp();
  } else {
    state.adminSession = null;
    state.adminAuthStatus = 'unauthenticated';
    renderApp();
  }
}

async function openProtectedAdminRoute(pushUrl: boolean = true, initialTab?: CmsTab): Promise<void> {
  if (initialTab) {
    cmsStore.activeTab = initialTab;
  }
  const targetAdminPath = getAdminRouteForTab(cmsStore.activeTab);
  const win = window as Window & { __bdVisitorStaticAdsLoaded?: boolean };
  if (win.__bdVisitorStaticAdsLoaded) {
    if (pushUrl) {
      window.location.assign(targetAdminPath);
    } else {
      window.location.replace(targetAdminPath);
    }
    return;
  }
  state.activeView = 'cms';
  state.adminAuthStatus = 'checking';
  if (pushUrl) {
    navigateToPath(targetAdminPath);
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();

  const rt = await ensureAdminRuntime();
  if (state.activeView !== 'cms') return;

  const outcome = await rt.verifyCurrentAdminSession(false, () => {
    void handleAdminSessionExpired();
  });

  if (state.activeView !== 'cms') return;

  if (outcome.status === 'authenticated') {
    state.adminSession = outcome.session;
    state.adminAuthStatus = 'authenticated';
    state.currentUser = rt.auth.currentUser;
    state.adminLoginFeedback = null;
    navigateToPath(getAdminRouteForTab(cmsStore.activeTab), true);
    renderLayoutShell();
    updateDynamicSeo();
    renderApp();
    void loadAdminDashboardData(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  state.adminSession = null;
  state.currentUser = rt.auth.currentUser;
  if (outcome.status === 'expired') {
    state.adminAuthStatus = 'expired';
    navigateToAdminLogin('expired', true);
  } else if (outcome.status === 'unauthorized') {
    state.adminAuthStatus = 'unauthorized';
    navigateToAdminLogin('unauthorized', true, rt.mapAdminAuthError({ code: outcome.code || 'NOT_AUTHORIZED' }, state.lang));
  } else if (outcome.status === 'error') {
    state.adminAuthStatus = 'unauthenticated';
    navigateToAdminLogin('error', true, outcome.message);
  } else {
    state.adminAuthStatus = 'unauthenticated';
    navigateToAdminLogin(undefined, true);
  }
}

function attachAdminLoginEventListeners(): void {
  const rt = adminRuntime;
  if (!rt) return;

  const emailInput = document.getElementById('admin-login-email') as HTMLInputElement | null;
  const passwordInput = document.getElementById('admin-login-password') as HTMLInputElement | null;
  const togglePwdBtn = document.getElementById('admin-toggle-password') as HTMLButtonElement | null;
  const rememberCheckbox = document.getElementById('admin-remember-session') as HTMLInputElement | null;
  const loginForm = document.getElementById('admin-login-form') as HTMLFormElement | null;
  const langBtn = document.getElementById('admin-login-lang-btn');
  const backLink = document.getElementById('admin-login-back-link');

  emailInput?.addEventListener('input', () => {
    state.adminLoginEmail = emailInput.value;
  });

  rememberCheckbox?.addEventListener('change', () => {
    state.adminLoginRememberSession = rememberCheckbox.checked;
  });

  togglePwdBtn?.addEventListener('click', () => {
    if (!passwordInput) return;
    state.adminLoginShowPassword = !state.adminLoginShowPassword;
    passwordInput.type = state.adminLoginShowPassword ? 'text' : 'password';
    const isBn = state.lang === 'bn';
    const label = state.adminLoginShowPassword
      ? (isBn ? 'পাসওয়ার্ড লুকান' : 'Hide password')
      : (isBn ? 'পাসওয়ার্ড দেখুন' : 'Show password');
    togglePwdBtn.setAttribute('aria-label', label);
    togglePwdBtn.setAttribute('aria-pressed', state.adminLoginShowPassword ? 'true' : 'false');
    togglePwdBtn.setAttribute('title', label);
    const icon = togglePwdBtn.querySelector('i');
    if (icon) {
      icon.className = `bi ${state.adminLoginShowPassword ? 'bi-eye-slash' : 'bi-eye'}`;
    }
  });

  langBtn?.addEventListener('click', () => {
    const typedPassword = passwordInput?.value || '';
    switchLanguage();
    const restoredPwd = document.getElementById('admin-login-password') as HTMLInputElement | null;
    if (restoredPwd && typedPassword) {
      restoredPwd.value = typedPassword;
    }
  });

  backLink?.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeView = 'home';
    state.adminLoginFeedback = null;
    navigateToPath('/');
    renderLayoutShell();
    updateDynamicSeo();
    renderApp();
    if (!state.firestoreHydrated) {
      void loadPortalDataFromFirestore();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.adminLoginSubmitting) return;

    const rawEmail = (emailInput?.value || '').trim();
    const rawPassword = passwordInput?.value || '';
    const remember = Boolean(rememberCheckbox?.checked);

    state.adminLoginEmail = rawEmail;
    state.adminLoginRememberSession = remember;

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      state.adminLoginFeedback = {
        type: 'error',
        message: rt.mapAdminAuthError({ code: 'auth/invalid-email' }, state.lang)
      };
      renderApp();
      document.getElementById('admin-login-email')?.focus();
      return;
    }

    if (!rawPassword) {
      state.adminLoginFeedback = {
        type: 'error',
        message: rt.mapAdminAuthError({ code: 'auth/missing-password' }, state.lang)
      };
      renderApp();
      document.getElementById('admin-login-password')?.focus();
      return;
    }

    state.adminLoginSubmitting = true;
    state.adminLoginFeedback = null;
    renderApp();

    try {
      const session = await rt.signInAdminWithEmailPassword(rawEmail, rawPassword, remember, () => {
        void handleAdminSessionExpired();
      });

      state.adminLoginSubmitting = false;
      state.adminLoginShowPassword = false;
      state.adminSession = session;
      state.adminAuthStatus = 'authenticated';
      state.currentUser = rt.auth.currentUser;
      state.adminLoginFeedback = null;
      state.activeView = 'cms';
      cmsStore.activeTab = 'overview';

      navigateToPath('/admin/dashboard/');
      renderLayoutShell();
      updateDynamicSeo();
      renderApp();
      void rt.recordAdminAuditLog({
        action: 'login',
        entityType: 'auth',
        entityId: session.uid,
        entityTitle: session.email || 'Administrator',
        details: 'Verified Firebase Admin Session'
      });
      void loadAdminDashboardData(true);
      showToast(
        state.lang === 'bn'
          ? 'অ্যাডমিন পোর্টালে সফলভাবে লগইন সম্পন্ন হয়েছে।'
          : 'Signed in to Administrator Dashboard.',
        'success'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      state.adminLoginSubmitting = false;
      state.adminSession = null;
      state.adminAuthStatus = 'unauthenticated';
      state.currentUser = null;
      state.adminLoginFeedback = {
        type: 'error',
        message: rt.mapAdminAuthError(err, state.lang)
      };
      renderApp();
    }
  });
}

// ============================================================================
// ATTACH CMS DASHBOARD & CRUD EVENT LISTENERS (MODULES 1 TO 6)
// ============================================================================
function attachCmsEventListeners(): void {
  const rt = adminRuntime;
  if (!rt) return;

  const ensureSession = (): boolean => {
    if (!rt.isVerifiedAdminActive()) {
      void handleAdminSessionExpired();
      return false;
    }
    return true;
  };

  // Responsive Sidebar Drawer Controls
  document.getElementById('admin-sidebar-toggle-btn')?.addEventListener('click', () => {
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar?.classList.contains('open')) {
      closeAdminSidebarDrawer();
    } else {
      openAdminSidebarDrawer();
    }
  });
  document.getElementById('admin-sidebar-close-btn')?.addEventListener('click', closeAdminSidebarDrawer);
  document.getElementById('admin-sidebar-backdrop')?.addEventListener('click', closeAdminSidebarDrawer);

  // Dashboard Refresh & Retry triggers
  document.getElementById('admin-refresh-dashboard-btn')?.addEventListener('click', () => {
    if (!ensureSession()) return;
    void loadAdminDashboardData(true);
  });
  document.getElementById('admin-dashboard-retry-btn')?.addEventListener('click', () => {
    if (!ensureSession()) return;
    void loadAdminDashboardData(true);
  });

  // Language switcher inside Admin Topbar
  document.getElementById('admin-lang-toggle-btn')?.addEventListener('click', () => {
    switchLanguage();
  });

  // Exit CMS button (return to public portal while keeping session active)
  document.getElementById('cms-exit-btn')?.addEventListener('click', () => {
    closeAdminSidebarDrawer();
    state.activeView = 'home';
    navigateToPath('/');
    renderLayoutShell();
    updateDynamicSeo();
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Secure Sign Out button
  document.getElementById('cms-signout-btn')?.addEventListener('click', async () => {
    closeAdminSidebarDrawer();
    await rt.recordAdminAuditLog({
      action: 'logout',
      entityType: 'auth',
      entityId: state.adminSession?.uid || 'admin',
      entityTitle: state.adminSession?.email || 'Administrator'
    }).catch(() => undefined);
    rt.resetAdminDashboardState();
    await rt.secureAdminSignOut();
    state.adminSession = null;
    state.adminAuthStatus = 'unauthenticated';
    state.currentUser = null;
    navigateToAdminLogin('signed_out');
  });

  // Tab switching (sidebar links, KPI cards, overview shortcuts)
  document.querySelectorAll('[data-cms-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!ensureSession()) return;
      const tab = (btn.getAttribute('data-cms-tab') as CmsTab) || 'overview';
      closeAdminSidebarDrawer();
      cmsStore.activeTab = tab;
      cmsStore.searchQuery = '';
      cmsStore.currentPage = 1;
      cmsStore.filterDivision = 'all';
      cmsStore.filterCategory = 'all';
      cmsStore.filterStatus = 'all';
      navigateToPath(getAdminRouteForTab(tab));
      updateDynamicSeo();
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (rt.adminDashboardState.status === 'idle') {
        void loadAdminDashboardData(false);
      }
    });
  });

  const onCmsMutationSaved = (): void => {
    renderApp();
    void loadAdminDashboardData(true, true);
  };

  // Quick Action triggers in Overview & Settings
  document.querySelectorAll('[data-quick-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const act = btn.getAttribute('data-quick-action');
      if (act === 'add-division') rt.openDivisionFormModal(undefined, state.lang, onCmsMutationSaved);
      if (act === 'add-district') rt.openDistrictFormModal(undefined, state.lang, onCmsMutationSaved);
      if (act === 'add-spot') rt.openSpotFormModal(undefined, state.lang, onCmsMutationSaved);
      if (act === 'add-article') rt.openArticleFormModal(undefined, state.lang, onCmsMutationSaved);
      if (act === 'add-media') rt.openMediaUploadModal(state.lang, onCmsMutationSaved);
      if (act === 'edit-legal') rt.openLegalPagesModal('privacy', state.lang, onCmsMutationSaved);
    });
  });

  // Overview "Recently Added Tourist Spots" quick edit links
  document.querySelectorAll('[data-overview-edit-spot]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-overview-edit-spot');
      const spot = cmsStore.spots.find(s => s.id === id);
      if (spot) rt.openSpotFormModal(spot, state.lang, onCmsMutationSaved);
    });
  });

  // SEO Settings Form Handler
  document.getElementById('form-admin-seo-settings')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ensureSession() || rt.adminDashboardState.savingSeo) return;

    const defaultTitleEn = (document.getElementById('seo-default-title-en') as HTMLInputElement)?.value.trim() || '';
    const defaultTitleBn = (document.getElementById('seo-default-title-bn') as HTMLInputElement)?.value.trim() || '';
    const titleSuffixEn = (document.getElementById('seo-suffix-en') as HTMLInputElement)?.value.trim() || '';
    const titleSuffixBn = (document.getElementById('seo-suffix-bn') as HTMLInputElement)?.value.trim() || '';
    const metaDescEn = (document.getElementById('seo-meta-desc-en') as HTMLTextAreaElement)?.value.trim() || '';
    const metaDescBn = (document.getElementById('seo-meta-desc-bn') as HTMLTextAreaElement)?.value.trim() || '';
    const canonicalBaseUrl = (document.getElementById('seo-canonical-url') as HTMLInputElement)?.value.trim() || '';
    const ogImageUrl = (document.getElementById('seo-og-image') as HTMLInputElement)?.value.trim() || '';
    const robotsIndex = ((document.getElementById('seo-robots-index') as HTMLSelectElement)?.value === 'noindex, nofollow'
      ? 'noindex, nofollow'
      : 'index, follow') as 'index, follow' | 'noindex, nofollow';
    const twitterHandle = (document.getElementById('seo-twitter-handle') as HTMLInputElement)?.value.trim() || '';

    if (!defaultTitleEn || !defaultTitleBn || !metaDescEn || !metaDescBn || !canonicalBaseUrl) {
      showToast(
        state.lang === 'bn'
          ? 'অনুগ্রহ করে সকল বাধ্যতামূলক এসইও তথ্য পূরণ করুন।'
          : 'Please complete all required SEO fields.',
        'error'
      );
      return;
    }

    rt.adminDashboardState.savingSeo = true;
    renderApp();

    try {
      const savedSeo = await rt.saveSeoSettings({
        default_title_en: defaultTitleEn,
        default_title_bn: defaultTitleBn,
        title_suffix_en: titleSuffixEn,
        title_suffix_bn: titleSuffixBn,
        meta_description_en: metaDescEn,
        meta_description_bn: metaDescBn,
        canonical_base_url: canonicalBaseUrl,
        og_image_url: ogImageUrl,
        robots_index: robotsIndex,
        twitter_handle: twitterHandle
      });
      state.seoSettings = savedSeo;
      updateDynamicSeo();
      showToast(
        state.lang === 'bn'
          ? 'এসইও সেটিংস ফায়ারস্টোরে সংরক্ষিত হয়েছে।'
          : 'SEO settings saved to Cloud Firestore.',
        'success'
      );
    } catch (err: any) {
      if (err?.message === 'ADMIN_UNAUTHORIZED') {
        void handleAdminSessionExpired();
        return;
      }
      showToast(err?.message || 'Failed to save SEO settings.', 'error');
    } finally {
      rt.adminDashboardState.savingSeo = false;
      renderApp();
    }
  });

  // Website Settings Form Handler
  document.getElementById('form-admin-website-settings')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ensureSession() || rt.adminDashboardState.savingWebsite) return;

    const siteTitleEn = (document.getElementById('site-title-en') as HTMLInputElement)?.value.trim() || '';
    const siteTitleBn = (document.getElementById('site-title-bn') as HTMLInputElement)?.value.trim() || '';
    const heroHeadingEn = (document.getElementById('site-hero-heading-en') as HTMLInputElement)?.value.trim() || '';
    const heroHeadingBn = (document.getElementById('site-hero-heading-bn') as HTMLInputElement)?.value.trim() || '';
    const heroSubtitleEn = (document.getElementById('site-hero-subtitle-en') as HTMLTextAreaElement)?.value.trim() || '';
    const heroSubtitleBn = (document.getElementById('site-hero-subtitle-bn') as HTMLTextAreaElement)?.value.trim() || '';
    const contactEmail = (document.getElementById('site-contact-email') as HTMLInputElement)?.value.trim() || '';
    const touristHelpline = (document.getElementById('site-helpline') as HTMLInputElement)?.value.trim() || '';
    const defaultLang = ((document.getElementById('site-default-lang') as HTMLSelectElement)?.value === 'en'
      ? 'en'
      : 'bn') as 'bn' | 'en';
    const maintenanceMode = Boolean((document.getElementById('site-maintenance-mode') as HTMLInputElement)?.checked);

    if (!siteTitleEn || !siteTitleBn || !contactEmail) {
      showToast(
        state.lang === 'bn'
          ? 'পোর্টালের নাম ও যোগাযোগের ইমেইল আবশ্যক।'
          : 'Portal name and contact email are required.',
        'error'
      );
      return;
    }

    rt.adminDashboardState.savingWebsite = true;
    renderApp();

    try {
      const savedSite = await rt.saveWebsiteSettings({
        site_title_en: siteTitleEn,
        site_title_bn: siteTitleBn,
        hero_heading_en: heroHeadingEn,
        hero_heading_bn: heroHeadingBn,
        hero_subtitle_en: heroSubtitleEn,
        hero_subtitle_bn: heroSubtitleBn,
        hero_slides: getActiveHeroSlides(rt.adminDashboardState.websiteSettings),
        contact_email: contactEmail,
        tourist_helpline: touristHelpline,
        default_language: defaultLang,
        maintenance_mode: maintenanceMode
      });
      state.websiteSettings = savedSite;
      showToast(
        state.lang === 'bn'
          ? 'ওয়েবসাইট সেটিংস ফায়ারস্টোরে সংরক্ষিত হয়েছে।'
          : 'Website settings saved to Cloud Firestore.',
        'success'
      );
    } catch (err: any) {
      if (err?.message === 'ADMIN_UNAUTHORIZED') {
        void handleAdminSessionExpired();
        return;
      }
      showToast(err?.message || 'Failed to save website settings.', 'error');
    } finally {
      rt.adminDashboardState.savingWebsite = false;
      renderApp();
    }
  });

  // Ads Control Settings Handlers (`ads-settings` tab)
  const syncAdToggleLabels = (): void => {
    const isBn = state.lang === 'bn';
    const masterChk = document.getElementById('ads-master-enabled') as HTMLInputElement | null;
    const adsenseChk = document.getElementById('ads-adsense-enabled') as HTMLInputElement | null;
    const adsterraChk = document.getElementById('ads-adsterra-enabled') as HTMLInputElement | null;

    if (masterChk) {
      const box = document.getElementById('ads-master-switch-box');
      if (box) {
        box.classList.toggle('bg-success-subtle', masterChk.checked);
        box.classList.toggle('border-success-subtle', masterChk.checked);
        box.classList.toggle('bg-light', !masterChk.checked);
      }
      const badgeText = masterChk.checked
        ? (isBn ? 'সাইট বিজ্ঞাপন: চালু' : 'Global Ads: ON')
        : (isBn ? 'সাইট বিজ্ঞাপন: বন্ধ' : 'Global Ads: OFF');
      ['ads-top-status-badge', 'ads-master-status-badge'].forEach(id => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.className = masterChk.checked ? 'badge-published' : 'badge-draft';
        badge.textContent = badgeText;
      });
    }

    if (adsenseChk) {
      const lbl = document.getElementById('ads-adsense-enabled-label');
      if (lbl) lbl.textContent = adsenseChk.checked ? (isBn ? 'চালু' : 'ON') : (isBn ? 'বন্ধ' : 'OFF');
    }

    if (adsterraChk) {
      const lbl = document.getElementById('ads-adsterra-enabled-label');
      if (lbl) lbl.textContent = adsterraChk.checked ? (isBn ? 'চালু' : 'ON') : (isBn ? 'বন্ধ' : 'OFF');
    }
  };

  const ensureNetworkAndMasterSynced = (network?: string, autoEnableMaster: boolean = false): void => {
    if (network === 'adsense') {
      const adsenseChk = document.getElementById('ads-adsense-enabled') as HTMLInputElement | null;
      if (adsenseChk && !adsenseChk.checked) adsenseChk.checked = true;
    } else if (network === 'adsterra') {
      const adsterraChk = document.getElementById('ads-adsterra-enabled') as HTMLInputElement | null;
      if (adsterraChk && !adsterraChk.checked) adsterraChk.checked = true;
    }
    if (autoEnableMaster) {
      const masterChk = document.getElementById('ads-master-enabled') as HTMLInputElement | null;
      if (masterChk && !masterChk.checked) masterChk.checked = true;
    }
    syncAdToggleLabels();
  };

  document.getElementById('ads-master-enabled')?.addEventListener('change', syncAdToggleLabels);
  document.getElementById('ads-adsense-enabled')?.addEventListener('change', syncAdToggleLabels);
  document.getElementById('ads-adsterra-enabled')?.addEventListener('change', syncAdToggleLabels);

  document.getElementById('ads-adsense-client-id')?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value.trim();
    if (/^ca-pub-\d{8,24}$/i.test(val)) {
      ensureNetworkAndMasterSynced('adsense', false);
    }
  });

  document.getElementById('ads-adsense-auto-ads')?.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).checked) {
      ensureNetworkAndMasterSynced('adsense', true);
    }
  });

  document.getElementById('ads-adsterra-global-script')?.addEventListener('input', (e) => {
    if ((e.target as HTMLTextAreaElement).value.trim().length > 0) {
      ensureNetworkAndMasterSynced('adsterra', false);
    }
  });

  document.querySelectorAll('[data-ad-slot-network]').forEach(sel => {
    sel.addEventListener('change', () => {
      const slotKey = sel.getAttribute('data-ad-slot-network');
      if (!slotKey) return;
      const network = (sel as HTMLSelectElement).value;
      const isBanner = network === 'banner_image';
      document.querySelector(`[data-ad-slot-code-wrap="${slotKey}"]`)?.classList.toggle('d-none', isBanner);
      document.querySelector(`[data-ad-slot-banner-wrap="${slotKey}"]`)?.classList.toggle('d-none', !isBanner);
      const slotEnabled = (document.querySelector(`[data-ad-slot-enabled="${slotKey}"]`) as HTMLInputElement | null)?.checked;
      if (slotEnabled) {
        ensureNetworkAndMasterSynced(network, false);
      }
    });
  });

  document.querySelectorAll('[data-ad-slot-enabled]').forEach(chk => {
    chk.addEventListener('change', () => {
      const slotKey = chk.getAttribute('data-ad-slot-enabled');
      if (!slotKey) return;
      const checked = Boolean((chk as HTMLInputElement).checked);
      const card = document.querySelector(`[data-ad-slot-card="${slotKey}"]`);
      card?.classList.toggle('is-enabled', checked);
      if (checked) {
        const network = (document.querySelector(`[data-ad-slot-network="${slotKey}"]`) as HTMLSelectElement | null)?.value;
        ensureNetworkAndMasterSynced(network, true);
      }
    });
  });

  document.querySelectorAll('[data-ad-slot-code]').forEach(area => {
    area.addEventListener('input', () => {
      const slotKey = area.getAttribute('data-ad-slot-code');
      if (!slotKey) return;
      if ((area as HTMLTextAreaElement).value.trim().length > 0) {
        const network = (document.querySelector(`[data-ad-slot-network="${slotKey}"]`) as HTMLSelectElement | null)?.value;
        ensureNetworkAndMasterSynced(network, false);
      }
    });
  });

  const collectAdsSettingsFromDom = (): Omit<AdsSettingsConfig, 'id' | 'updated_at' | 'updated_by'> => {
    const slots = {} as Record<AdSlotKey, AdSlotConfig>;
    for (const meta of AD_SLOT_META) {
      const enabled = Boolean(
        (document.querySelector(`[data-ad-slot-enabled="${meta.key}"]`) as HTMLInputElement | null)?.checked
      );
      const network = ((document.querySelector(`[data-ad-slot-network="${meta.key}"]`) as HTMLSelectElement | null)
        ?.value || 'adsense') as AdNetworkType;
      const code =
        (document.querySelector(`[data-ad-slot-code="${meta.key}"]`) as HTMLTextAreaElement | null)?.value.trim() || '';
      const imageUrl =
        (document.querySelector(`[data-ad-slot-image="${meta.key}"]`) as HTMLInputElement | null)?.value.trim() || '';
      const linkUrl =
        (document.querySelector(`[data-ad-slot-link="${meta.key}"]`) as HTMLInputElement | null)?.value.trim() || '';
      const altText =
        (document.querySelector(`[data-ad-slot-alt="${meta.key}"]`) as HTMLInputElement | null)?.value.trim() || '';

      slots[meta.key] = {
        enabled,
        network,
        code,
        image_url: imageUrl,
        link_url: linkUrl,
        alt_text: altText
      };
    }

    return {
      ads_enabled: Boolean((document.getElementById('ads-master-enabled') as HTMLInputElement | null)?.checked),
      show_ad_label: Boolean((document.getElementById('ads-show-label') as HTMLInputElement | null)?.checked),
      adsense_enabled: Boolean((document.getElementById('ads-adsense-enabled') as HTMLInputElement | null)?.checked),
      adsense_client_id:
        (document.getElementById('ads-adsense-client-id') as HTMLInputElement | null)?.value.trim() || '',
      adsense_auto_ads: Boolean((document.getElementById('ads-adsense-auto-ads') as HTMLInputElement | null)?.checked),
      adsterra_enabled: Boolean((document.getElementById('ads-adsterra-enabled') as HTMLInputElement | null)?.checked),
      adsterra_global_script:
        (document.getElementById('ads-adsterra-global-script') as HTMLTextAreaElement | null)?.value.trim() || '',
      custom_head_script:
        (document.getElementById('ads-custom-head-script') as HTMLTextAreaElement | null)?.value.trim() || '',
      ads_txt_content:
        (document.getElementById('ads-txt-content') as HTMLTextAreaElement | null)?.value.trim() || '',
      slots
    };
  };

  const persistAdsSettingsFromForm = async (
    payload: Omit<AdsSettingsConfig, 'id' | 'updated_at' | 'updated_by'>,
    successMsg: string
  ): Promise<void> => {
    if (!ensureSession() || rt.adminDashboardState.savingAds) return;
    rt.adminDashboardState.savingAds = true;
    renderApp();

    try {
      const savedAds = await rt.saveAdsSettings(payload);
      state.adsSettings = savedAds;
      syncGlobalAdScripts(state.adsSettings, false);
      showToast(successMsg, 'success');
    } catch (err: any) {
      if (err?.message === 'ADMIN_UNAUTHORIZED') {
        void handleAdminSessionExpired();
        return;
      }
      const rawMsg = typeof err?.message === 'string' ? err.message : '';
      const isPermDenied = rawMsg.includes('Missing or insufficient permissions') || err?.code === 'permission-denied';
      showToast(
        isPermDenied
          ? (state.lang === 'bn'
              ? 'Firestore Security Rules অনুমতি দেয়নি! কনসোল থেকে পুরো নতুন firestore.rules ফাইলটি Publish করুন।'
              : 'Firestore permission denied for site_settings/ads_settings. Publish the full updated firestore.rules in Cloud Console.')
          : (rawMsg || 'Failed to save ads settings.'),
        'error'
      );
    } finally {
      rt.adminDashboardState.savingAds = false;
      renderApp();
    }
  };

  document.getElementById('form-admin-ads-settings')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const collected = collectAdsSettingsFromDom();
    if (
      collected.adsense_enabled &&
      collected.adsense_client_id &&
      !/^ca-pub-\d{8,24}$/i.test(collected.adsense_client_id)
    ) {
      showToast(
        state.lang === 'bn'
          ? 'AdSense Publisher ID অবশ্যই "ca-pub-" দিয়ে শুরু হতে হবে (যেমন: ca-pub-1234567890123456)।'
          : 'AdSense Publisher ID must start with "ca-pub-" followed by digits.',
        'error'
      );
      return;
    }

    await persistAdsSettingsFromForm(
      collected,
      state.lang === 'bn'
        ? 'বিজ্ঞাপন সেটিংস ফায়ারস্টোরে সংরক্ষিত হয়েছে।'
        : 'Advertisement settings saved to Cloud Firestore.'
    );
  });

  document.querySelectorAll('[data-ads-turn-off-all]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession() || rt.adminDashboardState.savingAds) return;
      const collected = collectAdsSettingsFromDom();
      collected.ads_enabled = false;
      void persistAdsSettingsFromForm(
        collected,
        state.lang === 'bn'
          ? 'সম্পূর্ণ ওয়েবসাইটের সকল বিজ্ঞাপন বন্ধ করা হয়েছে।'
          : 'All advertisements across the website have been turned off.'
      );
    });
  });

  // Hero Banners Management Handlers (`hero-banners` tab)
  const collectHeroSlidesFromDom = (): HeroBannerSlide[] => {
    const rows = Array.from(document.querySelectorAll('#hero-banners-list [data-hero-slide-row]'));
    if (rows.length === 0) {
      return getActiveHeroSlides(rt.adminDashboardState.websiteSettings);
    }
    const collected: HeroBannerSlide[] = [];
    rows.forEach((row, i) => {
      const idxAttr = row.getAttribute('data-hero-slide-row') || String(i);
      const slideId = row.getAttribute('data-hero-slide-id') || `hero_slide_${i + 1}`;
      const urlVal =
        (row.querySelector(`[data-hero-url="${idxAttr}"]`) as HTMLInputElement | null)?.value.trim() || '';
      const labelBn =
        (row.querySelector(`[data-hero-label-bn="${idxAttr}"]`) as HTMLInputElement | null)?.value.trim() || '';
      const labelEn =
        (row.querySelector(`[data-hero-label-en="${idxAttr}"]`) as HTMLInputElement | null)?.value.trim() || '';
      if (urlVal) {
        collected.push({
          id: slideId,
          image_url: urlVal.slice(0, 2000),
          label_bn: (labelBn || labelEn || 'বাংলাদেশ ভ্রমণ ব্যানার').slice(0, 160),
          label_en: (labelEn || labelBn || 'Bangladesh Tourism Banner').slice(0, 160)
        });
      }
    });
    return collected;
  };

  const persistHeroSlides = async (nextSlides: HeroBannerSlide[], successMessage: string): Promise<void> => {
    if (!ensureSession() || rt.adminDashboardState.savingWebsite) return;
    if (nextSlides.length === 0) {
      showToast(
        state.lang === 'bn'
          ? 'অন্তত ১টি হিরো ব্যানার ইমেজ রাখতে হবে।'
          : 'At least 1 hero banner slide is required.',
        'error'
      );
      return;
    }

    const currentSite = rt.adminDashboardState.websiteSettings;
    rt.adminDashboardState.savingWebsite = true;
    renderApp();

    try {
      const savedSite = await rt.saveWebsiteSettings({
        site_title_en: currentSite.site_title_en,
        site_title_bn: currentSite.site_title_bn,
        hero_heading_en: currentSite.hero_heading_en,
        hero_heading_bn: currentSite.hero_heading_bn,
        hero_subtitle_en: currentSite.hero_subtitle_en,
        hero_subtitle_bn: currentSite.hero_subtitle_bn,
        hero_slides: nextSlides.slice(0, 15),
        contact_email: currentSite.contact_email,
        tourist_helpline: currentSite.tourist_helpline,
        default_language: currentSite.default_language,
        maintenance_mode: currentSite.maintenance_mode
      });
      state.websiteSettings = savedSite;
      state.heroSlideIndex = 0;
      showToast(successMessage, 'success');
    } catch (err: any) {
      if (err?.message === 'ADMIN_UNAUTHORIZED') {
        void handleAdminSessionExpired();
        return;
      }
      showToast(err?.message || 'Failed to save hero banner slides.', 'error');
    } finally {
      rt.adminDashboardState.savingWebsite = false;
      renderApp();
    }
  };

  const renderNewHeroPreview = (url: string): void => {
    const box = document.getElementById('new-hero-preview-box');
    if (!box) return;
    const cleanUrl = url.trim();
    const isValidUrl =
      cleanUrl.startsWith('http://') ||
      cleanUrl.startsWith('https://') ||
      cleanUrl.startsWith('/api/media/');
    if (!cleanUrl || !isValidUrl) {
      box.innerHTML = `
        <i class="bi bi-image fs-3 mb-1"></i>
        <span class="small">${state.lang === 'bn' ? 'ছবির প্রিভিউ এবং পিক্সেল সাইজ এখানে দেখা যাবে' : 'Image preview & pixel dimensions will appear here'}</span>
      `;
      return;
    }

    const displayUrl = optimizeImageUrl(cleanUrl, 800);
    box.innerHTML = `
      <div class="position-relative w-100" style="height: 108px;">
        <img id="new-hero-preview-img" src="${escapeHtml(displayUrl)}" alt="Banner Preview" class="w-100 h-100 rounded-2" style="object-fit: contain;">
        <span id="new-hero-preview-dim" class="position-absolute bottom-0 end-0 m-1 badge bg-dark bg-opacity-75 tabular-nums d-none"></span>
      </div>
    `;
    const previewImg = document.getElementById('new-hero-preview-img') as HTMLImageElement | null;
    const dimBadge = document.getElementById('new-hero-preview-dim');
    if (previewImg && dimBadge) {
      previewImg.addEventListener('load', () => {
        if (previewImg.naturalWidth > 0 && previewImg.naturalHeight > 0) {
          dimBadge.textContent = `${previewImg.naturalWidth} × ${previewImg.naturalHeight} px`;
          dimBadge.classList.remove('d-none');
        }
      });
    }
  };

  const newHeroUrlInput = document.getElementById('new-hero-slide-url') as HTMLInputElement | null;
  newHeroUrlInput?.addEventListener('input', () => {
    renderNewHeroPreview(newHeroUrlInput.value);
  });

  const newHeroMediaPick = document.getElementById('new-hero-media-pick') as HTMLSelectElement | null;
  newHeroMediaPick?.addEventListener('change', () => {
    if (newHeroMediaPick.value && newHeroUrlInput) {
      newHeroUrlInput.value = newHeroMediaPick.value;
      renderNewHeroPreview(newHeroMediaPick.value);
    }
  });

  const newHeroFileInput = document.getElementById('new-hero-file-input') as HTMLInputElement | null;
  const newHeroUploadBtn = document.getElementById('btn-new-hero-upload') as HTMLButtonElement | null;
  newHeroUploadBtn?.addEventListener('click', () => newHeroFileInput?.click());
  newHeroFileInput?.addEventListener('change', async () => {
    if (!ensureSession() || !newHeroFileInput.files || !newHeroFileInput.files[0]) return;
    const file = newHeroFileInput.files[0];
    const check = rt.validateImageFile(file);
    if (!check.valid) {
      showToast(check.error || 'Invalid image file.', 'error');
      newHeroFileInput.value = '';
      return;
    }

    try {
      if (newHeroUploadBtn) {
        newHeroUploadBtn.disabled = true;
        newHeroUploadBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${state.lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}`;
      }
      const downloadUrl = await rt.uploadImageFile(file, 'settings');
      if (newHeroUrlInput) {
        newHeroUrlInput.value = downloadUrl;
        renderNewHeroPreview(downloadUrl);
      }
      showToast(
        state.lang === 'bn'
          ? 'ছবি সফলভাবে আপলোড হয়েছে। এখন যোগ বাটনে ক্লিক করে সংরক্ষণ করুন।'
          : 'Image uploaded successfully. Click Add & Save Hero Banner to publish.',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Image upload failed.', 'error');
    } finally {
      if (newHeroUploadBtn) {
        newHeroUploadBtn.disabled = false;
        newHeroUploadBtn.innerHTML = `<i class="bi bi-cloud-arrow-up me-1"></i>${state.lang === 'bn' ? 'ফাইল আপলোড' : 'Upload File'}`;
      }
      newHeroFileInput.value = '';
    }
  });

  document.getElementById('form-add-hero-banner')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ensureSession() || rt.adminDashboardState.savingWebsite) return;

    const url = (document.getElementById('new-hero-slide-url') as HTMLInputElement)?.value.trim() || '';
    const labelBn = (document.getElementById('new-hero-label-bn') as HTMLInputElement)?.value.trim() || '';
    const labelEn = (document.getElementById('new-hero-label-en') as HTMLInputElement)?.value.trim() || '';

    if (
      !url ||
      (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/api/media/'))
    ) {
      showToast(
        state.lang === 'bn'
          ? 'বৈধ HTTPS ইমেজ ইউআরএল দিন বা ফাইল আপলোড করুন।'
          : 'Please enter a valid HTTPS image URL or upload an image file.',
        'error'
      );
      return;
    }

    const currentSlides = collectHeroSlidesFromDom();
    if (currentSlides.length >= 15) {
      showToast(
        state.lang === 'bn'
          ? 'সর্বোচ্চ ১৫টি হিরো ব্যানার যোগ করা যাবে।'
          : 'Maximum limit of 15 hero banners reached.',
        'error'
      );
      return;
    }

    const newSlide: HeroBannerSlide = {
      id: `hero_slide_${Date.now()}`,
      image_url: url.slice(0, 2000),
      label_bn: (labelBn || labelEn || 'বাংলাদেশ ভ্রমণ ব্যানার').slice(0, 160),
      label_en: (labelEn || labelBn || 'Bangladesh Tourism Banner').slice(0, 160)
    };

    await persistHeroSlides(
      [...currentSlides, newSlide],
      state.lang === 'bn'
        ? 'নতুন হিরো ব্যানার ইমেজ যোগ ও সংরক্ষণ করা হয়েছে।'
        : 'New hero banner slide added and saved.'
    );
  });

  // Live dimensions & URL preview on existing hero slides
  document.querySelectorAll('[data-hero-preview-img]').forEach(el => {
    const img = el as HTMLImageElement;
    const idx = img.getAttribute('data-hero-preview-img');
    const badge = idx !== null ? document.querySelector(`[data-hero-dim-badge="${idx}"]`) : null;
    const updateBadge = () => {
      if (badge && img.naturalWidth > 0 && img.naturalHeight > 0) {
        badge.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;
        badge.classList.remove('d-none');
      }
    };
    if (img.complete) updateBadge();
    img.addEventListener('load', updateBadge);
  });

  document.querySelectorAll('[data-hero-url]').forEach(input => {
    input.addEventListener('input', () => {
      const idx = input.getAttribute('data-hero-url');
      const val = (input as HTMLInputElement).value.trim();
      const img = idx !== null ? (document.querySelector(`[data-hero-preview-img="${idx}"]`) as HTMLImageElement | null) : null;
      if (img && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/api/media/'))) {
        img.src = optimizeImageUrl(val, 800);
      }
    });
  });

  document.querySelectorAll('[data-hero-upload-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-hero-upload-btn');
      const fileInput = idx !== null ? (document.querySelector(`[data-hero-file-input="${idx}"]`) as HTMLInputElement | null) : null;
      fileInput?.click();
    });
  });

  document.querySelectorAll('[data-hero-file-input]').forEach(input => {
    const fileInput = input as HTMLInputElement;
    fileInput.addEventListener('change', async () => {
      if (!ensureSession() || !fileInput.files || !fileInput.files[0]) return;
      const idxAttr = fileInput.getAttribute('data-hero-file-input');
      const idx = idxAttr ? parseInt(idxAttr, 10) : -1;
      const file = fileInput.files[0];
      const check = rt.validateImageFile(file);
      if (!check.valid) {
        showToast(check.error || 'Invalid image file.', 'error');
        fileInput.value = '';
        return;
      }

      const replaceBtn = document.querySelector(`[data-hero-upload-btn="${idxAttr}"]`) as HTMLButtonElement | null;
      try {
        if (replaceBtn) {
          replaceBtn.disabled = true;
          replaceBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
        }
        const downloadUrl = await rt.uploadImageFile(file, 'settings');
        const slides = collectHeroSlidesFromDom();
        if (idx >= 0 && idx < slides.length) {
          slides[idx] = { ...slides[idx], image_url: downloadUrl };
          await persistHeroSlides(
            slides,
            state.lang === 'bn'
              ? `স্লাইড #${idx + 1}-এর ব্যানার ছবি পরিবর্তন ও সংরক্ষণ করা হয়েছে।`
              : `Slide #${idx + 1} image replaced and saved.`
          );
        }
      } catch (err: any) {
        showToast(err?.message || 'Image upload failed.', 'error');
      } finally {
        if (replaceBtn) {
          replaceBtn.disabled = false;
          replaceBtn.innerHTML = `<i class="bi bi-upload me-1"></i>${state.lang === 'bn' ? 'ছবি পরিবর্তন' : 'Replace'}`;
        }
        fileInput.value = '';
      }
    });
  });

  document.querySelectorAll('[data-hero-move-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-hero-move-up') || '-1', 10);
      const slides = collectHeroSlidesFromDom();
      if (idx <= 0 || idx >= slides.length) return;
      [slides[idx - 1], slides[idx]] = [slides[idx], slides[idx - 1]];
      void persistHeroSlides(
        slides,
        state.lang === 'bn' ? 'স্লাইডের ক্রম আপডেট ও সংরক্ষণ করা হয়েছে।' : 'Hero slide order updated.'
      );
    });
  });

  document.querySelectorAll('[data-hero-move-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-hero-move-down') || '-1', 10);
      const slides = collectHeroSlidesFromDom();
      if (idx < 0 || idx >= slides.length - 1) return;
      [slides[idx], slides[idx + 1]] = [slides[idx + 1], slides[idx]];
      void persistHeroSlides(
        slides,
        state.lang === 'bn' ? 'স্লাইডের ক্রম আপডেট ও সংরক্ষণ করা হয়েছে।' : 'Hero slide order updated.'
      );
    });
  });

  document.querySelectorAll('[data-hero-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-hero-delete') || '-1', 10);
      const slides = collectHeroSlidesFromDom();
      if (slides.length <= 1 || idx < 0 || idx >= slides.length) return;
      rt.showConfirmModal({
        title: state.lang === 'bn' ? 'হিরো ব্যানার স্লাইড মুছুন' : 'Remove Hero Banner Slide',
        message:
          state.lang === 'bn'
            ? `আপনি কি নিশ্চিতভাবে স্লাইড #${idx + 1} ("${slides[idx].label_bn}") মুছে ফেলতে চান?`
            : `Are you sure you want to remove slide #${idx + 1} ("${slides[idx].label_en}")?`,
        lang: state.lang,
        onConfirm: async () => {
          const next = slides.filter((_, i) => i !== idx);
          await persistHeroSlides(
            next,
            state.lang === 'bn' ? 'হিরো ব্যানার স্লাইড মুছে ফেলা হয়েছে।' : 'Hero banner slide removed.'
          );
        }
      });
    });
  });

  document.getElementById('btn-hero-reset-defaults')?.addEventListener('click', () => {
    if (!ensureSession()) return;
    rt.showConfirmModal({
      title: state.lang === 'bn' ? 'ডিফল্ট ব্যানার রিস্টোর' : 'Reset Default Hero Banners',
      message:
        state.lang === 'bn'
          ? 'বর্তমান কাস্টম স্লাইডগুলোর পরিবর্তে ডিফল্ট ৭টি বাংলাদেশ পর্যটন ব্যানার রিস্টোর করতে চান?'
          : 'Restore the 7 default Bangladesh hero banner slides?',
      lang: state.lang,
      onConfirm: async () => {
        await persistHeroSlides(
          DEFAULT_HERO_SLIDES.map(s => ({ ...s })),
          state.lang === 'bn' ? 'ডিফল্ট হিরো ব্যানার স্লাইড রিস্টোর করা হয়েছে।' : 'Default hero banners restored.'
        );
      }
    });
  });

  document.getElementById('btn-hero-save-all')?.addEventListener('click', () => {
    const slides = collectHeroSlidesFromDom();
    void persistHeroSlides(
      slides,
      state.lang === 'bn'
        ? 'সকল হিরো ব্যানার পরিবর্তন ফায়ারস্টোরে সংরক্ষিত হয়েছে।'
        : 'All hero banner changes saved to Cloud Firestore.'
    );
  });

  // Authorized Admins Management (`admins` collection)
  document.getElementById('form-add-admin-user')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ensureSession()) return;
    const uid = (document.getElementById('new-admin-uid') as HTMLInputElement)?.value.trim() || '';
    const email = (document.getElementById('new-admin-email') as HTMLInputElement)?.value.trim() || '';
    const role = ((document.getElementById('new-admin-role') as HTMLSelectElement)?.value || 'admin') as
      | 'admin'
      | 'super_admin'
      | 'editor';
    if (!uid || !email) {
      showToast(
        state.lang === 'bn' ? 'UID এবং ইমেইল উভয়ই আবশ্যক।' : 'Firebase Auth UID and email are required.',
        'error'
      );
      return;
    }
    try {
      await rt.saveAdminRecord({ uid, email, role });
      showToast(
        state.lang === 'bn' ? 'অ্যাডমিন রেকর্ড সফলভাবে সংরক্ষিত হয়েছে।' : `Admin "${email}" added successfully.`,
        'success'
      );
      void loadAdminDashboardData(true, true);
      renderApp();
    } catch (err: any) {
      if (err?.message === 'ADMIN_UNAUTHORIZED') {
        void handleAdminSessionExpired();
        return;
      }
      showToast(err?.message || 'Could not save admin record.', 'error');
    }
  });

  document.querySelectorAll('[data-delete-admin-uid]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const uid = btn.getAttribute('data-delete-admin-uid') || '';
      const record = rt.adminDashboardState.admins.find(a => a.uid === uid);
      if (!uid) return;
      rt.showConfirmModal({
        title: state.lang === 'bn' ? 'অ্যাডমিন অপসারণ' : 'Remove Administrator',
        message:
          state.lang === 'bn'
            ? `আপনি কি নিশ্চিতভাবে "${record?.email || uid}" এর অ্যাডমিন অধিকার অপসারণ করতে চান?`
            : `Are you sure you want to remove administrator access for "${record?.email || uid}"?`,
        lang: state.lang,
        onConfirm: async () => {
          try {
            await rt.deleteAdminRecord(uid);
            showToast(
              state.lang === 'bn' ? 'অ্যাডমিন অপসারণ করা হয়েছে।' : 'Administrator removed.',
              'success'
            );
            void loadAdminDashboardData(true, true);
            renderApp();
          } catch (err: any) {
            if (err?.message === 'ADMIN_UNAUTHORIZED') {
              void handleAdminSessionExpired();
              return;
            }
            showToast(err?.message || 'Could not remove administrator.', 'error');
          }
        }
      });
    });
  });

  // Firestore Dataset Seeder Buttons (Website Settings, Overview, and Divisions tabs)
  const triggerSeedMissingDataset = async (
    btn: HTMLButtonElement | null,
    ensureAllEightDivisionsPublished: boolean = false
  ): Promise<void> => {
    if (!ensureSession()) return;
    const originalHtml = btn?.innerHTML || '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${
        state.lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing to Firestore...'
      }`;
    }
    try {
      const result = await rt.seedFirestoreFromCms({ ensureAllEightDivisionsPublished });
      showToast(
        state.lang === 'bn'
          ? `ফায়ারস্টোর সিঙ্ক সম্পন্ন: ${result.createdCount}টি নতুন যোগ, ${result.updatedCount}টি প্রকাশিত, ${result.skippedCount}টি বিদ্যমান ছিল।`
          : `Firestore sync complete: ${result.createdCount} created, ${result.updatedCount} published, ${result.skippedCount} skipped.`,
        'success'
      );
      await loadAdminDashboardData(true, true);
      await loadPortalDataFromFirestore(true);
      renderApp();
    } catch (err: any) {
      if (err?.message === 'ADMIN_UNAUTHORIZED') {
        void handleAdminSessionExpired();
        return;
      }
      showToast(err?.message || 'Could not seed Firestore dataset.', 'error');
    } finally {
      if (btn && document.body.contains(btn)) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }
  };

  document.getElementById('btn-seed-firestore-data')?.addEventListener('click', (e) => {
    void triggerSeedMissingDataset(e.currentTarget as HTMLButtonElement, false);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-seed-missing-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      void triggerSeedMissingDataset(btn, true);
    });
  });

  // Verified 8 Divisions & 64 Districts Geography Validation & Safe Importer
  interface GeoReportApiResponse {
    success: boolean;
    message?: string;
    report?: import('./admin/adminRuntime').GeographyValidationReport;
    firestoreDiff?: {
      existingDivisionsCount: number;
      existingDistrictsCount: number;
      existingDivisionIds: string[];
      missingDivisionIds: string[];
      existingDistrictIds: string[];
      missingDistrictIds: string[];
      divisionSlugCollisions: Array<{ datasetId: string; existingDocId: string; slug: string }>;
      districtSlugCollisions: Array<{ datasetId: string; existingDocId: string; slug: string }>;
      readyToImport: boolean;
    };
  }

  let lastGeoInspection: GeoReportApiResponse | null = null;

  const renderGeoReportPanel = (data: GeoReportApiResponse): void => {
    const panel = document.getElementById('cms-geo-report-panel');
    if (!panel || !data.report || !data.firestoreDiff) return;
    const r = data.report;
    const diff = data.firestoreDiff;
    const isBn = state.lang === 'bn';
    const collisionCount = diff.divisionSlugCollisions.length + diff.districtSlugCollisions.length;

    panel.classList.remove('d-none');
    panel.innerHTML = `
      <div class="p-3 rounded-3 border bg-light">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="badge ${r.valid ? 'bg-success' : 'bg-danger'}">
              ${r.valid ? (isBn ? 'ভ্যালিডেশন পাস' : 'VALIDATION PASSED') : (isBn ? 'ত্রুটি পাওয়া গেছে' : 'VALIDATION FAILED')}
            </span>
            <span class="small fw-semibold text-primary-bd tabular-nums">
              ${r.divisionsCount} ${isBn ? 'বিভাগ' : 'Divisions'} · ${r.districtsCount} ${isBn ? 'জেলা' : 'Districts'}
            </span>
          </div>
          <span class="small text-muted tabular-nums">
            ${isBn ? 'বিদ্যমান:' : 'In Firestore:'} ${diff.existingDivisionsCount} div / ${diff.existingDistrictsCount} dist ·
            ${isBn ? 'নতুন অনুপস্থিত:' : 'Missing to Insert:'} <strong>${diff.missingDivisionIds.length}</strong> div / <strong>${diff.missingDistrictIds.length}</strong> dist
          </span>
        </div>

        <div class="row g-2 mb-3 small">
          <div class="col-md-4">
            <div class="bg-white p-2 rounded border">
              <div class="text-muted">${isBn ? 'ডুপ্লিকেট আইডি / স্লাগ' : 'Duplicate IDs / Slugs'}</div>
              <div class="fw-bold ${r.checks.noDuplicateDivisionIds && r.checks.noDuplicateDistrictIds && r.checks.noDuplicateDivisionSlugs && r.checks.noDuplicateDistrictSlugs ? 'text-success' : 'text-danger'}">
                ${r.checks.noDuplicateDivisionIds && r.checks.noDuplicateDistrictIds && r.checks.noDuplicateDivisionSlugs && r.checks.noDuplicateDistrictSlugs ? '0 (Unique)' : 'Duplicates Detected'}
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="bg-white p-2 rounded border">
              <div class="text-muted">${isBn ? 'অভিভাবক বিভাগ ও সম্পর্ক' : 'Parent Division Links'}</div>
              <div class="fw-bold ${r.checks.allDistrictsMappedToValidDivision && r.checks.officialDivisionCountsMatch ? 'text-success' : 'text-danger'}">
                ${r.checks.allDistrictsMappedToValidDivision && r.checks.officialDivisionCountsMatch ? '64 / 64 Official Match' : 'Mismatch Detected'}
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="bg-white p-2 rounded border">
              <div class="text-muted">${isBn ? 'ফায়ারস্টোর স্লাগ সংঘর্ষ' : 'Firestore Slug Collisions'}</div>
              <div class="fw-bold ${collisionCount === 0 ? 'text-success' : 'text-warning'}">
                ${collisionCount === 0 ? '0 (Clean)' : `${collisionCount} Collision(s)`}
              </div>
            </div>
          </div>
        </div>

        ${r.errors.length > 0 ? `
          <div class="alert alert-danger small py-2 mb-3">
            <strong>Validation Errors:</strong>
            <ul class="mb-0 ps-3">${r.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}</ul>
          </div>
        ` : ''}

        <div class="table-responsive">
          <table class="table table-sm table-bordered bg-white mb-0 small">
            <thead class="table-light">
              <tr>
                <th>Division</th>
                <th>ID</th>
                <th class="text-end">Expected</th>
                <th class="text-end">Actual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${r.divisionBreakdown.map(row => `
                <tr>
                  <td>${escapeHtml(isBn ? row.nameBn : row.nameEn)}</td>
                  <td><code>${escapeHtml(row.divisionId)}</code></td>
                  <td class="text-end tabular-nums">${row.expectedDistricts}</td>
                  <td class="text-end tabular-nums">${row.actualDistricts}</td>
                  <td>
                    <span class="${row.status === 'valid' ? 'text-success fw-semibold' : 'text-danger fw-semibold'}">
                      ${row.status === 'valid' ? 'OK' : 'Mismatch'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const fetchGeoValidationReport = async (statusMode: string): Promise<GeoReportApiResponse | null> => {
    const idToken = await rt.auth.currentUser?.getIdToken(false);
    if (!idToken) {
      void handleAdminSessionExpired();
      return null;
    }
    const resp = await fetch(`/api/admin/geography/report?status=${encodeURIComponent(statusMode)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${idToken}` }
    });
    const json = (await resp.json()) as GeoReportApiResponse;
    if (resp.status === 401 || resp.status === 403) {
      void handleAdminSessionExpired();
      return null;
    }
    if (!resp.ok || !json.success) {
      throw new Error(json.message || 'Could not validate geography dataset.');
    }
    lastGeoInspection = json;
    renderGeoReportPanel(json);
    return json;
  };

  const executeGeoImportRequest = async (confirmOverwrite: boolean, statusMode: string): Promise<void> => {
    const idToken = await rt.auth.currentUser?.getIdToken(false);
    if (!idToken) {
      void handleAdminSessionExpired();
      return;
    }
    const resp = await fetch('/api/admin/geography/import', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirmImport: true,
        confirmOverwrite,
        statusMode
      })
    });
    const json = (await resp.json()) as {
      success?: boolean;
      message?: string;
      createdDivisions?: number;
      createdDistricts?: number;
      overwrittenDivisions?: number;
      overwrittenDistricts?: number;
      skippedExistingDivisions?: number;
      skippedExistingDistricts?: number;
    };
    if (resp.status === 401 || resp.status === 403) {
      void handleAdminSessionExpired();
      return;
    }
    if (!resp.ok || !json.success) {
      throw new Error(json.message || 'Geography import failed.');
    }
    showToast(
      state.lang === 'bn'
        ? `ইম্পোর্ট সম্পন্ন: নতুন ${json.createdDivisions ?? 0} বিভাগ ও ${json.createdDistricts ?? 0} জেলা যোগ হয়েছে, আপডেট ${json.overwrittenDivisions ?? 0} বিভাগ / ${json.overwrittenDistricts ?? 0} জেলা।`
        : `Geography import complete: created ${json.createdDivisions ?? 0} division(s) & ${json.createdDistricts ?? 0} district(s); updated ${json.overwrittenDivisions ?? 0} / ${json.overwrittenDistricts ?? 0}.`,
      'success'
    );
    await loadAdminDashboardData(true, true);
    await loadPortalDataFromFirestore(true);
    renderApp();
  };

  document.getElementById('btn-geo-validate-report')?.addEventListener('click', async () => {
    if (!ensureSession()) return;
    const statusMode = (document.getElementById('cms-geo-status-mode') as HTMLSelectElement)?.value || 'preserve';
    const btn = document.getElementById('btn-geo-validate-report') as HTMLButtonElement | null;
    if (btn) btn.disabled = true;
    try {
      await fetchGeoValidationReport(statusMode);
    } catch (err: any) {
      showToast(err?.message || 'Validation report failed.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById('btn-geo-import-missing')?.addEventListener('click', async () => {
    if (!ensureSession()) return;
    const statusMode = (document.getElementById('cms-geo-status-mode') as HTMLSelectElement)?.value || 'preserve';
    try {
      const inspection = lastGeoInspection || (await fetchGeoValidationReport(statusMode));
      if (!inspection?.report?.valid || !inspection.firestoreDiff) {
        showToast('Fix validation errors before importing.', 'error');
        return;
      }
      const { missingDivisionIds, missingDistrictIds } = inspection.firestoreDiff;
      if (missingDivisionIds.length === 0 && missingDistrictIds.length === 0) {
        showToast(
          state.lang === 'bn'
            ? 'সকল ৮টি বিভাগ ও ৬৪টি জেলা ইতোমধ্যেই ফায়ারস্টোরে বিদ্যমান (কোনো ওভাররাইট করা হয়নি)।'
            : 'All 8 divisions and 64 districts already exist in Firestore (nothing overwritten).',
          'success'
        );
        return;
      }
      rt.showConfirmModal({
        title: state.lang === 'bn' ? 'নতুন বিভাগ ও জেলা ইম্পোর্ট নিশ্চিত করুন' : 'Confirm Missing Geography Import',
        message:
          state.lang === 'bn'
            ? `ভ্যালিডেশন পাস হয়েছে। ফায়ারস্টোরে ${missingDivisionIds.length}টি অনুপস্থিত বিভাগ এবং ${missingDistrictIds.length}টি অনুপস্থিত জেলা যোগ করা হবে। কোনো বিদ্যমান ডকুমেন্ট পরিবর্তন করা হবে না।`
            : `Validation passed. Insert ${missingDivisionIds.length} missing division(s) and ${missingDistrictIds.length} missing district(s) into Firestore? Existing records will NOT be modified.`,
        lang: state.lang,
        onConfirm: async () => {
          try {
            await executeGeoImportRequest(false, statusMode);
          } catch (err: any) {
            showToast(err?.message || 'Could not import geography records.', 'error');
          }
        }
      });
    } catch (err: any) {
      showToast(err?.message || 'Could not inspect Firestore before import.', 'error');
    }
  });

  document.getElementById('btn-geo-import-overwrite')?.addEventListener('click', async () => {
    if (!ensureSession()) return;
    const statusMode = (document.getElementById('cms-geo-status-mode') as HTMLSelectElement)?.value || 'preserve';
    try {
      const inspection = lastGeoInspection || (await fetchGeoValidationReport(statusMode));
      if (!inspection?.report?.valid) {
        showToast('Fix validation errors before importing.', 'error');
        return;
      }
      rt.showConfirmModal({
        title: state.lang === 'bn' ? 'সতর্কতা: বিদ্যমান ডকুমেন্ট ওভাররাইট' : 'Confirm Overwrite of Existing Documents',
        message:
          state.lang === 'bn'
            ? `আপনি কি নিশ্চিতভাবে যাচাইকৃত ৮ বিভাগ ও ৬৪ জেলা দিয়ে ফায়ারস্টোরের বিদ্যমান রেকর্ডগুলো আপডেট (ওভাররাইট) করতে চান? কাস্টম এডিট করা নাম/বিবরণ/ছবি প্রতিস্থাপিত হতে পারে।`
            : `Explicit confirmation required: Overwrite existing division (${inspection.firestoreDiff?.existingDivisionIds.length ?? 0}) and district (${inspection.firestoreDiff?.existingDistrictIds.length ?? 0}) documents in Firestore with the verified dataset?`,
        lang: state.lang,
        onConfirm: async () => {
          try {
            await executeGeoImportRequest(true, statusMode);
          } catch (err: any) {
            showToast(err?.message || 'Could not overwrite geography records.', 'error');
          }
        }
      });
    } catch (err: any) {
      showToast(err?.message || 'Could not inspect Firestore before overwrite.', 'error');
    }
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

  const statusFilter = document.getElementById('cms-filter-status') as HTMLSelectElement;
  statusFilter?.addEventListener('change', () => {
    cmsStore.filterStatus = statusFilter.value;
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

  const runProtectedMutation = async (action: () => Promise<void>): Promise<void> => {
    if (!ensureSession()) return;
    try {
      await action();
    } catch (err: any) {
      if (err?.message === 'ADMIN_UNAUTHORIZED') {
        void handleAdminSessionExpired();
        return;
      }
      showToast(err?.message || 'Unable to complete administrative action.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Module 1: Division CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-division')?.addEventListener('click', () => {
    if (!ensureSession()) return;
    rt.openDivisionFormModal(undefined, state.lang, onCmsMutationSaved);
  });

  document.querySelectorAll('[data-edit-division]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-edit-division');
      const div = cmsStore.divisions.find(d => d.id === id);
      if (div) rt.openDivisionFormModal(div, state.lang, onCmsMutationSaved);
    });
  });

  document.querySelectorAll('[data-toggle-division]').forEach(btn => {
    btn.addEventListener('click', () => {
      void runProtectedMutation(async () => {
        const id = btn.getAttribute('data-toggle-division');
        const div = cmsStore.divisions.find(d => d.id === id);
        if (div) {
          const nextPublished = !div.is_published;
          await rt.saveDivision({ ...div, is_published: nextPublished });
          showToast(`Division "${div.name_en}" is now ${nextPublished ? 'Published' : 'Draft'}.`, 'success');
          onCmsMutationSaved();
        }
      });
    });
  });

  document.querySelectorAll('[data-delete-division]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-delete-division');
      const div = cmsStore.divisions.find(d => d.id === id);
      if (!div) return;

      // Check relationship against districts
      const childDistricts = cmsStore.districts.filter(d => d.division_id === div.id);
      if (childDistricts.length > 0) {
        const names = childDistricts.map(d => d.name_en).slice(0, 4).join(', ');
        const extra = childDistricts.length > 4 ? ` and ${childDistricts.length - 4} more` : '';
        rt.showConfirmModal({
          title: 'Deletion Blocked: Relational Dependency',
          message: `Cannot delete division "${div.name_en}" because ${childDistricts.length} official districts depend on it (${names}${extra}). Please reassign or delete these districts first to prevent orphaned records.`,
          isBlocked: true,
          lang: state.lang
        });
      } else {
        rt.showConfirmModal({
          title: 'Delete Division',
          message: `Are you sure you want to permanently delete division "${div.name_en}" (${div.name_bn})? This action cannot be undone.`,
          lang: state.lang,
          onConfirm: async () => {
            await runProtectedMutation(async () => {
              const res = await rt.deleteDivision(div.id);
              if (res.success) {
                showToast(`Division "${div.name_en}" deleted successfully.`, 'success');
                onCmsMutationSaved();
              } else {
                showToast(res.message || 'Could not delete division', 'error');
              }
            });
          }
        });
      }
    });
  });

  // --------------------------------------------------------------------------
  // Module 2: District CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-district')?.addEventListener('click', () => {
    if (!ensureSession()) return;
    rt.openDistrictFormModal(undefined, state.lang, onCmsMutationSaved);
  });

  document.querySelectorAll('[data-edit-district]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-edit-district');
      const dist = cmsStore.districts.find(d => d.id === id);
      if (dist) rt.openDistrictFormModal(dist, state.lang, onCmsMutationSaved);
    });
  });

  document.querySelectorAll('[data-toggle-district]').forEach(btn => {
    btn.addEventListener('click', () => {
      void runProtectedMutation(async () => {
        const id = btn.getAttribute('data-toggle-district');
        const dist = cmsStore.districts.find(d => d.id === id);
        if (dist) {
          const nextPublished = !dist.is_published;
          await rt.saveDistrict({ ...dist, is_published: nextPublished });
          showToast(`District "${dist.name_en}" is now ${nextPublished ? 'Published' : 'Draft'}.`, 'success');
          onCmsMutationSaved();
        }
      });
    });
  });

  document.querySelectorAll('[data-delete-district]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-delete-district');
      const dist = cmsStore.districts.find(d => d.id === id);
      if (!dist) return;

      const childSpots = cmsStore.spots.filter(s => s.district_id === dist.id);
      if (childSpots.length > 0) {
        const names = childSpots.map(s => s.name_en).slice(0, 3).join(', ');
        rt.showConfirmModal({
          title: 'Deletion Blocked: Relational Dependency',
          message: `Cannot delete district "${dist.name_en}" because ${childSpots.length} tourist spot(s) are located in it (${names}). Please delete or reassign these tourist destinations first.`,
          isBlocked: true,
          lang: state.lang
        });
      } else {
        rt.showConfirmModal({
          title: 'Delete District',
          message: `Are you sure you want to permanently delete district "${dist.name_en}"?`,
          lang: state.lang,
          onConfirm: async () => {
            await runProtectedMutation(async () => {
              const res = await rt.deleteDistrict(dist.id);
              if (res.success) {
                showToast(`District "${dist.name_en}" deleted.`, 'success');
                onCmsMutationSaved();
              } else {
                showToast(res.message || 'Error deleting district', 'error');
              }
            });
          }
        });
      }
    });
  });

  // --------------------------------------------------------------------------
  // Module 3: Category CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-category')?.addEventListener('click', () => {
    if (!ensureSession()) return;
    rt.openCategoryFormModal(undefined, state.lang, onCmsMutationSaved);
  });

  document.querySelectorAll('[data-edit-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-edit-category');
      const cat = cmsStore.categories.find(c => c.id === id);
      if (cat) rt.openCategoryFormModal(cat, state.lang, onCmsMutationSaved);
    });
  });

  document.querySelectorAll('[data-toggle-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      void runProtectedMutation(async () => {
        const id = btn.getAttribute('data-toggle-category');
        const cat = cmsStore.categories.find(c => c.id === id);
        if (cat) {
          const nextPublished = !cat.is_published;
          await rt.saveCategory({ ...cat, is_published: nextPublished });
          showToast(`Category "${cat.name_en}" status updated.`, 'success');
          onCmsMutationSaved();
        }
      });
    });
  });

  document.querySelectorAll('[data-delete-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-delete-category');
      const cat = cmsStore.categories.find(c => c.id === id);
      if (!cat) return;

      const linkedSpots = cmsStore.spots.filter(s => s.category_ids && s.category_ids.includes(cat.id));
      if (linkedSpots.length > 0) {
        rt.showConfirmModal({
          title: 'Deletion Blocked: Active Reference',
          message: `Cannot delete category "${cat.name_en}" because ${linkedSpots.length} tourist spot(s) are assigned to it. Please remove this category assignment from the spots first.`,
          isBlocked: true,
          lang: state.lang
        });
      } else {
        rt.showConfirmModal({
          title: 'Delete Category',
          message: `Are you sure you want to delete category "${cat.name_en}"?`,
          lang: state.lang,
          onConfirm: async () => {
            await runProtectedMutation(async () => {
              await rt.deleteCategory(cat.id);
              showToast(`Category "${cat.name_en}" deleted.`, 'success');
              onCmsMutationSaved();
            });
          }
        });
      }
    });
  });

  // --------------------------------------------------------------------------
  // Module 4: Tourist Spot CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-spot')?.addEventListener('click', () => {
    if (!ensureSession()) return;
    rt.openSpotFormModal(undefined, state.lang, onCmsMutationSaved);
  });

  document.querySelectorAll('[data-edit-spot]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-edit-spot');
      const spot = cmsStore.spots.find(s => s.id === id);
      if (spot) rt.openSpotFormModal(spot, state.lang, onCmsMutationSaved);
    });
  });

  document.querySelectorAll('[data-toggle-spot]').forEach(btn => {
    btn.addEventListener('click', () => {
      void runProtectedMutation(async () => {
        const id = btn.getAttribute('data-toggle-spot');
        const spot = cmsStore.spots.find(s => s.id === id);
        if (spot) {
          const nextPublished = !spot.is_published;
          await rt.saveTouristSpot({ ...spot, is_published: nextPublished });
          showToast(`Tourist Spot "${spot.name_en}" is now ${nextPublished ? 'Published' : 'Draft'}.`, 'success');
          onCmsMutationSaved();
        }
      });
    });
  });

  document.querySelectorAll('[data-delete-spot]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-delete-spot');
      const spot = cmsStore.spots.find(s => s.id === id);
      if (!spot) return;

      rt.showConfirmModal({
        title: 'Delete Tourist Spot',
        message: `Are you sure you want to permanently delete destination "${spot.name_en}"?`,
        lang: state.lang,
        onConfirm: async () => {
          await runProtectedMutation(async () => {
            await rt.deleteTouristSpot(spot.id);
            showToast(`Tourist Spot "${spot.name_en}" deleted.`, 'success');
            onCmsMutationSaved();
          });
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // Module 5: Travel Guide / Article CRUD Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-article')?.addEventListener('click', () => {
    if (!ensureSession()) return;
    rt.openArticleFormModal(undefined, state.lang, onCmsMutationSaved);
  });

  document.querySelectorAll('[data-edit-article]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-edit-article');
      const art = cmsStore.articles.find(a => a.id === id);
      if (art) rt.openArticleFormModal(art, state.lang, onCmsMutationSaved);
    });
  });

  document.querySelectorAll('[data-toggle-article]').forEach(btn => {
    btn.addEventListener('click', () => {
      void runProtectedMutation(async () => {
        const id = btn.getAttribute('data-toggle-article');
        const art = cmsStore.articles.find(a => a.id === id);
        if (art) {
          const nextPublished = !art.is_published;
          await rt.saveArticle({
            ...art,
            is_published: nextPublished,
            status: nextPublished ? 'published' : 'draft',
            published_at: nextPublished ? (art.published_at || new Date().toISOString()) : art.published_at
          });
          showToast(`Article "${art.title_en}" is now ${nextPublished ? 'Published' : 'Draft'}.`, 'success');
          onCmsMutationSaved();
        }
      });
    });
  });

  document.querySelectorAll('[data-delete-article]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-delete-article');
      const art = cmsStore.articles.find(a => a.id === id);
      if (!art) return;

      rt.showConfirmModal({
        title: 'Delete Travel Guide',
        message: `Are you sure you want to delete guide "${art.title_en}"?`,
        lang: state.lang,
        onConfirm: async () => {
          await runProtectedMutation(async () => {
            await rt.deleteArticle(art.id);
            showToast(`Article "${art.title_en}" deleted.`, 'success');
            onCmsMutationSaved();
          });
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // Module 6: Image Manager Handlers
  // --------------------------------------------------------------------------
  document.getElementById('cms-btn-add-media')?.addEventListener('click', () => {
    if (!ensureSession()) return;
    rt.openMediaUploadModal(state.lang, onCmsMutationSaved);
  });

  const dropzone = document.getElementById('cms-media-dropzone');
  const fileInput = document.getElementById('cms-media-file-input') as HTMLInputElement;
  const browseBtn = document.getElementById('cms-media-browse-btn');

  browseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!ensureSession()) return;
    fileInput?.click();
  });
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== browseBtn) {
      if (!ensureSession()) return;
      fileInput?.click();
    }
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      void handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      void handleFileUpload(fileInput.files[0]);
    }
  });

  const handleFileUpload = async (file: File): Promise<void> => {
    if (!ensureSession()) return;
    const activeRt = adminRuntime;
    if (!activeRt) return;
    const validation = activeRt.validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid image file.', 'error');
      if (fileInput) fileInput.value = '';
      return;
    }

    showToast('Uploading image to Firebase Storage...', 'warning');
    try {
      const url = await activeRt.uploadImageFile(file, 'media_library');
      const now = new Date().toISOString();
      const newItem: MediaItem = {
        id: 'media_' + Date.now(),
        url: url,
        file_name: file.name,
        alt_en: file.name.replace(/\.[^/.]+$/, ''),
        alt_bn: 'বাংলাদেশের পর্যটন ছবি',
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: now,
        updated_at: now
      };
      await activeRt.saveMediaItem(newItem);
      showToast('Image uploaded and registered successfully!', 'success');
      onCmsMutationSaved();
    } catch (err: any) {
      if (err?.message === 'ADMIN_UNAUTHORIZED') {
        void handleAdminSessionExpired();
        return;
      }
      showToast(err.message || 'Image upload error', 'error');
    } finally {
      if (fileInput) fileInput.value = '';
    }
  }

  // Edit Media Alt Text button
  document.querySelectorAll('[data-edit-media]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-edit-media');
      const item = cmsStore.media.find(m => m.id === id);
      if (item) rt.openMediaEditModal(item, state.lang, onCmsMutationSaved);
    });
  });

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
      const mediaId = img.getAttribute('data-preview-media-id');
      const item = mediaId
        ? cmsStore.media.find(m => m.id === mediaId)
        : cmsStore.media.find(m => m.url === url);
      if (url) rt.openImagePreviewModal(url, item);
    });
  });

  // Safe Unused-Only Delete Media Item
  document.querySelectorAll('[data-delete-media]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!ensureSession()) return;
      const id = btn.getAttribute('data-delete-media');
      const item = cmsStore.media.find(m => m.id === id);
      if (!item) return;

      const refs = rt.getMediaReferences(item.url);
      if (refs.length > 0) {
        const refSummary = refs
          .map(r => `${r.entityType}: ${r.title}`)
          .slice(0, 4)
          .join(', ');
        const extra = refs.length > 4 ? ` and ${refs.length - 4} more` : '';
        rt.showConfirmModal({
          title: state.lang === 'bn' ? 'মুছে ফেলা সম্ভব নয়: ছবিটি ব্যবহৃত হচ্ছে' : 'Deletion Blocked: Image In Use',
          message:
            state.lang === 'bn'
              ? `"${item.file_name}" ছবিটি বর্তমানে ${refs.length}টি কনটেন্টে ব্যবহৃত হচ্ছে (${refSummary}${extra})। নিরাপদে মুছে ফেলতে আগে সেগুলো থেকে ছবির লিংক পরিবর্তন করুন।`
              : `Cannot delete "${item.file_name}" because it is currently referenced by ${refs.length} record(s) (${refSummary}${extra}). Replace or remove those image references first.`,
          isBlocked: true,
          lang: state.lang
        });
        return;
      }

      rt.showConfirmModal({
        title: state.lang === 'bn' ? 'অব্যবহৃত ছবি মুছুন' : 'Delete Unused Image Asset',
        message:
          state.lang === 'bn'
            ? `আপনি কি নিশ্চিতভাবে অব্যবহৃত ছবি "${item.file_name}" স্থায়ীভাবে মুছে ফেলতে চান?`
            : `Are you sure you want to permanently delete unused image "${item.file_name}"?`,
        lang: state.lang,
        onConfirm: async () => {
          await runProtectedMutation(async () => {
            const res = await rt.deleteMediaItem(item.id);
            if (!res.success) {
              rt.showConfirmModal({
                title: state.lang === 'bn' ? 'মুছে ফেলা সম্ভব নয়' : 'Deletion Blocked',
                message: res.message || 'This image is still referenced in active content.',
                isBlocked: true,
                lang: state.lang
              });
              return;
            }
            showToast('Unused image asset deleted safely.', 'success');
            if (res.message) showToast(res.message, 'warning');
            onCmsMutationSaved();
          });
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

function openSpotDetailPage(slugOrId: string, pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  const knownSpot = findPublishedSpotBySlugOrId(slugOrId);
  const targetSlug = (knownSpot?.slug || slugOrId).trim().toLowerCase();
  const isDifferentSlug = state.spotDetailSlug !== targetSlug;
  state.activeView = 'spot-detail';
  if (isDifferentSlug) {
    state.spotDetailSpot = null;
    state.spotDetailDivision = null;
    state.spotDetailDistrict = null;
    state.spotDetailNearbySpots = [];
    state.spotDetailArticles = [];
    state.spotDetailNotFound = false;
    state.spotDetailError = null;
  }
  state.spotDetailSlug = targetSlug;
  state.spotDetailGalleryIndex = 0;
  if (pushUrl) {
    navigateToPath(`/places/${encodeURIComponent(targetSlug)}/`);
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadSpotDetailFromFirestore(targetSlug, isDifferentSlug);
}

function openAllCategoriesPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'categories';
  if (pushUrl) {
    navigateToPath('/categories/');
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

function openCategoryDetailPage(slugOrId: string, pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  const knownCat = findPublishedCategoryBySlugOrId(slugOrId);
  const targetSlug = (knownCat?.slug || knownCat?.id || slugOrId).trim().toLowerCase();
  const isDifferentSlug = state.categoryDetailSlug !== targetSlug;
  state.activeView = 'category-detail';
  if (isDifferentSlug) {
    state.categoryDetailCategory = null;
    state.categoryDetailSpots = [];
    state.categoryDetailNotFound = false;
    state.categoryDetailError = null;
  }
  state.categoryDetailSlug = targetSlug;
  state.categoryDetailDivisionFilter = 'all';
  state.categoryDetailDistrictFilter = 'all';
  state.categoryDetailCurrentPage = 1;
  if (pushUrl) {
    navigateToPath(`/categories/${encodeURIComponent(targetSlug)}/`);
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadCategoryDetailFromFirestore(targetSlug, isDifferentSlug);
}

function openTravelGuidesPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'guides';
  if (pushUrl) {
    navigateToPath('/travel-guides/');
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

function openArticleDetailPage(slugOrId: string, pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  const normalizedInput = slugOrId.trim().toLowerCase();
  const known = cmsStore.articles.find(
    a =>
      a.is_published === true &&
      a.status !== 'draft' &&
      ((a.slug && a.slug.trim().toLowerCase() === normalizedInput) ||
        a.id.trim().toLowerCase() === normalizedInput)
  );
  const targetSlug = (known?.slug || normalizedInput).trim().toLowerCase();
  const isDifferentSlug = state.guideDetailSlug !== targetSlug;
  state.activeView = 'guide-detail';
  if (isDifferentSlug) {
    state.guideDetailArticle = null;
    state.guideDetailNotFound = false;
    state.guideDetailError = null;
  }
  state.guideDetailSlug = targetSlug;
  if (pushUrl) {
    navigateToPath(`/travel-guides/${encodeURIComponent(targetSlug)}/`);
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadArticleDetailFromFirestore(targetSlug, isDifferentSlug);
}

const VALID_SEARCH_TYPES = new Set<SearchTypeFilter>(['all', 'spot', 'district', 'division', 'guide', 'category']);

function applySearchParamsFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const rawQ = params.get('q') ?? '';
  const rawType = (params.get('type') || 'all').trim().toLowerCase() as SearchTypeFilter;
  const rawDivision = (params.get('division') || 'all').trim();
  const rawCategory = (params.get('category') || 'all').trim();
  const rawPage = parseInt(params.get('page') || '1', 10);

  state.searchPageQuery = sanitizeSearchInput(rawQ);
  state.searchPageTypeFilter = VALID_SEARCH_TYPES.has(rawType) ? rawType : 'all';
  state.searchPageDivisionFilter = rawDivision || 'all';
  state.searchPageCategoryFilter = rawCategory || 'all';
  state.searchPageCurrentPage = !Number.isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;
}

function syncSearchUrlAndSeo(replace: boolean = false): void {
  const nextUrl = buildSearchRouteUrl({
    q: state.searchPageQuery,
    type: state.searchPageTypeFilter,
    division: state.searchPageDivisionFilter,
    category: state.searchPageCategoryFilter,
    page: state.searchPageCurrentPage
  });
  navigateToPath(nextUrl, replace);
  updateDynamicSeo();
}

function openSearchPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'search';
  if (pushUrl) {
    const nextUrl = buildSearchRouteUrl({
      q: state.searchPageQuery,
      type: state.searchPageTypeFilter,
      division: state.searchPageDivisionFilter,
      category: state.searchPageCategoryFilter,
      page: state.searchPageCurrentPage
    });
    navigateToPath(nextUrl, false);
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

function openAboutPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'about';
  if (pushUrl) {
    navigateToPath('/about/');
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

function openContactPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'contact';
  if (pushUrl) {
    navigateToPath('/contact/');
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

function openPrivacyPolicyPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'privacy-policy';
  if (pushUrl) {
    navigateToPath('/privacy-policy/');
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

function openTermsPage(pushUrl: boolean = true): void {
  dismissOpenSpotModal();
  state.activeView = 'terms';
  if (pushUrl) {
    navigateToPath('/terms-and-conditions/');
  }
  renderLayoutShell();
  updateDynamicSeo();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!state.firestoreHydrated) {
    loadPortalDataFromFirestore();
  }
}

function validateContactFormClient(lang: Language): Record<string, string> {
  const isBn = lang === 'bn';
  const errors: Record<string, string> = {};
  const name = state.contactForm.name.trim();
  const email = state.contactForm.email.trim();
  const subject = state.contactForm.subject.trim();
  const message = state.contactForm.message.trim();

  if (name.length < 2 || name.length > 120) {
    errors.name = isBn
      ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (২ থেকে ১২০ অক্ষর)।'
      : 'Please enter your name (2 to 120 characters).';
  }
  if (!email || email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = isBn
      ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।'
      : 'Please enter a valid email address.';
  }
  if (subject.length < 3 || subject.length > 180) {
    errors.subject = isBn
      ? 'অনুগ্রহ করে বার্তার বিষয় লিখুন (কমপক্ষে ৩ অক্ষর)।'
      : 'Please enter a subject (at least 3 characters).';
  }
  if (message.length < 10 || message.length > 4000) {
    errors.message = isBn
      ? 'অনুগ্রহ করে বিস্তারিত বার্তা লিখুন (কমপক্ষে ১০ অক্ষর)।'
      : 'Please enter your message (between 10 and 4000 characters).';
  }
  return errors;
}

function attachContactPageEventListeners(): void {
  const nameInput = document.getElementById('contact-name') as HTMLInputElement | null;
  const emailInput = document.getElementById('contact-email') as HTMLInputElement | null;
  const subjectInput = document.getElementById('contact-subject') as HTMLInputElement | null;
  const messageInput = document.getElementById('contact-message') as HTMLTextAreaElement | null;
  const websiteInput = document.getElementById('contact-website') as HTMLInputElement | null;
  const charCountEl = document.getElementById('contact-char-count');

  const clearFieldError = (field: string, inputEl: HTMLElement | null) => {
    if (state.contactForm.fieldErrors[field]) {
      delete state.contactForm.fieldErrors[field];
      inputEl?.classList.remove('is-invalid');
      const errEl = document.getElementById(`contact-${field}-error`);
      if (errEl) errEl.textContent = '';
    }
  };

  nameInput?.addEventListener('input', () => {
    state.contactForm.name = nameInput.value;
    clearFieldError('name', nameInput);
  });

  emailInput?.addEventListener('input', () => {
    state.contactForm.email = emailInput.value;
    clearFieldError('email', emailInput);
  });

  subjectInput?.addEventListener('input', () => {
    state.contactForm.subject = subjectInput.value;
    clearFieldError('subject', subjectInput);
  });

  messageInput?.addEventListener('input', () => {
    state.contactForm.message = messageInput.value;
    clearFieldError('message', messageInput);
    if (charCountEl) {
      charCountEl.textContent = `${messageInput.value.length} / 4000`;
    }
  });

  document.querySelectorAll('.contact-subject-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const subj = btn.getAttribute('data-subject') || '';
      if (subj && subjectInput) {
        subjectInput.value = subj;
        state.contactForm.subject = subj;
        clearFieldError('subject', subjectInput);
        subjectInput.focus();
      }
    });
  });

  document.getElementById('contact-reset-success-btn')?.addEventListener('click', () => {
    state.contactForm = {
      name: '',
      email: '',
      subject: '',
      message: '',
      isSubmitting: false,
      submittedReferenceId: null,
      submittedMessage: null,
      errorMessage: null,
      fieldErrors: {}
    };
    renderApp();
  });

  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.contactForm.isSubmitting) return;

    state.contactForm.name = nameInput?.value || '';
    state.contactForm.email = emailInput?.value || '';
    state.contactForm.subject = subjectInput?.value || '';
    state.contactForm.message = messageInput?.value || '';
    state.contactForm.errorMessage = null;

    const clientErrors = validateContactFormClient(state.lang);
    if (Object.keys(clientErrors).length > 0) {
      state.contactForm.fieldErrors = clientErrors;
      renderApp();
      const firstInvalidKey = Object.keys(clientErrors)[0];
      document.getElementById(`contact-${firstInvalidKey}`)?.focus();
      return;
    }

    state.contactForm.fieldErrors = {};
    state.contactForm.isSubmitting = true;
    renderApp();

    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.contactForm.name.trim(),
          email: state.contactForm.email.trim(),
          subject: state.contactForm.subject.trim(),
          message: state.contactForm.message.trim(),
          website: websiteInput?.value || '',
          lang: state.lang
        })
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data?.success) {
        if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
          state.contactForm.fieldErrors = data.fieldErrors;
        }
        state.contactForm.errorMessage =
          data?.message ||
          (state.lang === 'bn'
            ? 'দুঃখিত, বার্তাটি পাঠানো যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Unable to send your message right now. Please try again.');
        state.contactForm.isSubmitting = false;
        renderApp();
        return;
      }

      state.contactForm = {
        name: '',
        email: '',
        subject: '',
        message: '',
        isSubmitting: false,
        submittedReferenceId: data.referenceId || 'CONFIRMED',
        submittedMessage: data.message || null,
        errorMessage: null,
        fieldErrors: {}
      };
      renderApp();
    } catch {
      state.contactForm.isSubmitting = false;
      state.contactForm.errorMessage =
        state.lang === 'bn'
          ? 'নেটওয়ার্ক সংযোগজনিত সমস্যার কারণে বার্তা পাঠানো যায়নি। পুনরায় চেষ্টা করুন।'
          : 'A network error occurred while submitting your message. Please try again.';
      renderApp();
    }
  });
}

function attachLegalPageEventListeners(): void {
  document.querySelectorAll('.legal-edit-trigger').forEach(btn => {
    btn.addEventListener('click', async () => {
      const docType = btn.getAttribute('data-legal-doc') === 'terms' ? 'terms' : 'privacy';
      const rt = await ensureAdminRuntime();
      rt.openLegalPagesModal(docType, state.lang, () => {
        updateDynamicSeo();
        renderApp();
      });
    });
  });

  document.getElementById('legal-copy-url-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(
        state.lang === 'bn' ? 'পেজ লিংক কপি করা হয়েছে!' : 'Page URL copied to clipboard!',
        'success'
      );
    } catch {
      showToast(
        state.lang === 'bn' ? 'লিংক কপি করা যায়নি।' : 'Could not copy link automatically.',
        'warning'
      );
    }
  });

  document.getElementById('legal-print-btn')?.addEventListener('click', () => {
    window.print();
  });

  document.querySelectorAll('.legal-toc-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = (link.getAttribute('href') || '').replace(/^#/, '');
      const el = targetId ? document.getElementById(targetId) : null;
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
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

function applyPlacesQueryParamsFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  const division = params.get('division');
  const district = params.get('district');
  const category = params.get('category');
  const pageParam = params.get('page');

  if (q !== null) state.placesSearchQuery = q;
  if (division) state.placesDivisionFilter = division;
  if (district) state.placesDistrictFilter = district;
  if (category) state.placesCategoryFilter = category;
  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10);
    if (!Number.isNaN(parsedPage) && parsedPage >= 1) {
      state.placesCurrentPage = parsedPage;
    }
  }
}

function syncPlacesFilterControlsState(): void {
  const hasActiveFilters =
    state.placesSearchQuery.trim().length > 0 ||
    (state.placesDivisionFilter !== 'all' && state.placesDivisionFilter !== '') ||
    (state.placesDistrictFilter !== 'all' && state.placesDistrictFilter !== '') ||
    (state.placesCategoryFilter !== 'all' && state.placesCategoryFilter !== '');

  const resetBtn = document.getElementById('places-reset-filters-btn') as HTMLButtonElement | null;
  if (resetBtn) {
    resetBtn.disabled = !hasActiveFilters;
    resetBtn.classList.toggle('btn-accent', hasActiveFilters);
    resetBtn.classList.toggle('btn-outline-bd', !hasActiveFilters);
  }

  const clearSearchBtn = document.getElementById('places-clear-search-btn');
  if (clearSearchBtn) {
    clearSearchBtn.classList.toggle('d-none', state.placesSearchQuery.trim().length === 0);
  }
}

function attachPlacesResultsEventListeners(): void {
  const resetAllPlacesFilters = () => {
    state.placesSearchQuery = '';
    state.placesDivisionFilter = 'all';
    state.placesDistrictFilter = 'all';
    state.placesCategoryFilter = 'all';
    state.placesCurrentPage = 1;
    renderApp();
  };

  document.getElementById('places-empty-reset-btn')?.addEventListener('click', resetAllPlacesFilters);

  document.getElementById('places-retry-btn')?.addEventListener('click', () => {
    loadPortalDataFromFirestore(true);
  });

  const scrollToPlacesGrid = () => {
    setTimeout(() => {
      document.getElementById('places-directory-grid')?.scrollIntoView({ behavior: 'smooth' });
    }, 30);
  };

  const getPlacesTotalPages = () => {
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
    return Math.max(1, Math.ceil(filtered.length / PLACES_PER_PAGE));
  };

  document.getElementById('places-page-prev')?.addEventListener('click', () => {
    const totalPages = getPlacesTotalPages();
    const safeCurrent = Math.min(Math.max(1, state.placesCurrentPage), totalPages);
    if (safeCurrent > 1) {
      state.placesCurrentPage = safeCurrent - 1;
      renderApp();
      scrollToPlacesGrid();
    }
  });

  document.getElementById('places-page-next')?.addEventListener('click', () => {
    const totalPages = getPlacesTotalPages();
    const safeCurrent = Math.min(Math.max(1, state.placesCurrentPage), totalPages);
    if (safeCurrent < totalPages) {
      state.placesCurrentPage = safeCurrent + 1;
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

function refreshPlacesResultsOnly(): void {
  const resultsRegion = document.getElementById('places-results-region');
  if (!resultsRegion) {
    renderApp();
    return;
  }
  resultsRegion.innerHTML = renderPlacesResultsRegion({
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
  syncPlacesFilterControlsState();
  attachPlacesResultsEventListeners();
}

// Event Listeners for All Tourist Destinations Directory (/places/)
function attachPlacesPageEventListeners(): void {
  const searchInput = document.getElementById('places-search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.placesSearchQuery = (e.target as HTMLInputElement).value;
      state.placesCurrentPage = 1;
      refreshPlacesResultsOnly();
    });
  }

  document.getElementById('places-clear-search-btn')?.addEventListener('click', () => {
    state.placesSearchQuery = '';
    state.placesCurrentPage = 1;
    const input = document.getElementById('places-search-input') as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.focus();
    }
    refreshPlacesResultsOnly();
  });

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

  document.getElementById('places-reset-filters-btn')?.addEventListener('click', () => {
    state.placesSearchQuery = '';
    state.placesDivisionFilter = 'all';
    state.placesDistrictFilter = 'all';
    state.placesCategoryFilter = 'all';
    state.placesCurrentPage = 1;
    renderApp();
  });

  attachPlacesResultsEventListeners();
}

// Event Listeners for Dynamic Tourist Spot Details Page (/places/:slug/)
function attachSpotDetailPageEventListeners(): void {
  document.getElementById('spot-detail-retry-btn')?.addEventListener('click', () => {
    loadSpotDetailFromFirestore(state.spotDetailSlug || '', true);
  });

  const spot = state.spotDetailSpot;
  if (spot) {
    const galleryImages = getSpotGalleryImages(spot);
    const isBn = state.lang === 'bn';
    const primaryName = isBn ? spot.name_bn : spot.name_en;
    const secondaryName = isBn ? spot.name_en : spot.name_bn;

    const updateGalleryDisplay = (nextIdx: number) => {
      const total = galleryImages.length;
      const safeIdx = ((nextIdx % total) + total) % total;
      state.spotDetailGalleryIndex = safeIdx;
      const activeUrl = galleryImages[safeIdx];

      const activeImg = document.getElementById('spot-gallery-active-img') as HTMLImageElement | null;
      if (activeImg) {
        activeImg.src = optimizeImageUrl(activeUrl, 1200);
        activeImg.alt = `${primaryName} (${secondaryName}) - ${isBn ? 'ছবি' : 'Photo'} ${safeIdx + 1}`;
      }

      const counterEl = document.getElementById('spot-gallery-counter');
      if (counterEl) {
        counterEl.textContent = `${isBn ? (safeIdx + 1).toLocaleString('bn-BD') : safeIdx + 1} / ${isBn ? total.toLocaleString('bn-BD') : total}`;
      }

      const zoomBtn = document.getElementById('spot-gallery-zoom-btn');
      if (zoomBtn) {
        zoomBtn.setAttribute('data-zoom-url', activeUrl);
      }

      document.querySelectorAll('.spot-gallery-thumb').forEach(btn => {
        const idx = parseInt(btn.getAttribute('data-gallery-index') || '0', 10);
        const isActive = idx === safeIdx;
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        btn.classList.toggle('border-success', isActive);
        btn.classList.toggle('shadow-sm', isActive);
        btn.classList.toggle('border-transparent', !isActive);
        btn.classList.toggle('opacity-75', !isActive);
      });
    };

    document.getElementById('spot-gallery-prev')?.addEventListener('click', () => {
      updateGalleryDisplay(state.spotDetailGalleryIndex - 1);
    });

    document.getElementById('spot-gallery-next')?.addEventListener('click', () => {
      updateGalleryDisplay(state.spotDetailGalleryIndex + 1);
    });

    document.querySelectorAll('.spot-gallery-thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-gallery-index') || '0', 10);
        if (!Number.isNaN(idx)) {
          updateGalleryDisplay(idx);
        }
      });
    });

    document.getElementById('spot-gallery-viewer')?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (galleryImages.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateGalleryDisplay(state.spotDetailGalleryIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateGalleryDisplay(state.spotDetailGalleryIndex + 1);
      }
    });

    document.getElementById('spot-gallery-zoom-btn')?.addEventListener('click', async () => {
      const url = document.getElementById('spot-gallery-zoom-btn')?.getAttribute('data-zoom-url') || galleryImages[state.spotDetailGalleryIndex];
      if (url) {
        const rt = await ensureAdminRuntime();
        rt.openImagePreviewModal(url);
      }
    });

    document.getElementById('spot-detail-bookmark-btn')?.addEventListener('click', () => {
      toggleBookmark(spot.id);
    });

    const canonicalUrl = `${window.location.origin}/places/${encodeURIComponent((spot.slug || spot.id).toLowerCase())}/`;

    const copyLinkToClipboard = async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(canonicalUrl);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = canonicalUrl;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
        }
        showToast(t('link_copied'), 'success');
      } catch {
        showToast(isBn ? 'লিংক কপি করা যায়নি।' : 'Could not copy link to clipboard.', 'error');
      }
    };

    document.getElementById('spot-copy-link-btn')?.addEventListener('click', () => {
      copyLinkToClipboard();
    });

    document.getElementById('spot-share-btn')?.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: primaryName,
            text: isBn ? spot.short_desc_bn : spot.short_desc_en,
            url: canonicalUrl
          });
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
        }
      }
      await copyLinkToClipboard();
    });
  }

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

// Event Listeners for Category Discovery Page (/categories/)
function attachCategoriesPageEventListeners(): void {
  document.getElementById('categories-retry-btn')?.addEventListener('click', () => {
    loadPortalDataFromFirestore(true);
  });

  document.querySelectorAll('.category-detail-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = link.getAttribute('data-category-slug');
      if (slug) {
        openCategoryDetailPage(decodeURIComponent(slug));
      }
    });
  });
}

// Event Listeners for Dynamic Category Details Page (/categories/:slug/)
function attachCategoryDetailPageEventListeners(): void {
  document.getElementById('category-detail-retry-btn')?.addEventListener('click', () => {
    loadCategoryDetailFromFirestore(state.categoryDetailSlug || '', true);
  });

  document.getElementById('category-empty-all-btn')?.addEventListener('click', () => {
    openAllCategoriesPage();
  });

  const resetCategoryFilters = () => {
    state.categoryDetailDivisionFilter = 'all';
    state.categoryDetailDistrictFilter = 'all';
    state.categoryDetailCurrentPage = 1;
    renderApp();
  };

  document.getElementById('category-reset-filters-btn')?.addEventListener('click', resetCategoryFilters);
  document.getElementById('category-empty-reset-btn')?.addEventListener('click', resetCategoryFilters);

  const divisionSelect = document.getElementById('category-division-select') as HTMLSelectElement | null;
  if (divisionSelect) {
    divisionSelect.addEventListener('change', (e) => {
      const newDivision = (e.target as HTMLSelectElement).value || 'all';
      state.categoryDetailDivisionFilter = newDivision;
      if (newDivision !== 'all' && state.categoryDetailDistrictFilter !== 'all') {
        const selectedDist = cmsStore.districts.find(
          d =>
            d.id.toLowerCase() === state.categoryDetailDistrictFilter.toLowerCase() ||
            (!!d.slug && d.slug.toLowerCase() === state.categoryDetailDistrictFilter.toLowerCase())
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
          state.categoryDetailDistrictFilter = 'all';
        }
      }
      state.categoryDetailCurrentPage = 1;
      renderApp();
    });
  }

  const districtSelect = document.getElementById('category-district-select') as HTMLSelectElement | null;
  if (districtSelect) {
    districtSelect.addEventListener('change', (e) => {
      state.categoryDetailDistrictFilter = (e.target as HTMLSelectElement).value || 'all';
      state.categoryDetailCurrentPage = 1;
      renderApp();
    });
  }

  const scrollToCategoryGrid = () => {
    setTimeout(() => {
      document.getElementById('category-spots-grid')?.scrollIntoView({ behavior: 'smooth' });
    }, 30);
  };

  const getCategoryTotalPages = () => {
    const filtered = getFilteredCategorySpots(
      state.categoryDetailSpots,
      state.categoryDetailCategory,
      cmsStore.divisions.filter(d => d.is_published !== false),
      cmsStore.districts.filter(d => d.is_published !== false),
      state.categoryDetailDivisionFilter,
      state.categoryDetailDistrictFilter
    );
    return Math.max(1, Math.ceil(filtered.length / CATEGORY_SPOTS_PER_PAGE));
  };

  document.getElementById('category-page-prev')?.addEventListener('click', () => {
    const totalPages = getCategoryTotalPages();
    const safeCurrent = Math.min(Math.max(1, state.categoryDetailCurrentPage), totalPages);
    if (safeCurrent > 1) {
      state.categoryDetailCurrentPage = safeCurrent - 1;
      renderApp();
      scrollToCategoryGrid();
    }
  });

  document.getElementById('category-page-next')?.addEventListener('click', () => {
    const totalPages = getCategoryTotalPages();
    const safeCurrent = Math.min(Math.max(1, state.categoryDetailCurrentPage), totalPages);
    if (safeCurrent < totalPages) {
      state.categoryDetailCurrentPage = safeCurrent + 1;
      renderApp();
      scrollToCategoryGrid();
    }
  });

  document.querySelectorAll('.category-page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPage = parseInt(btn.getAttribute('data-page') || '1', 10);
      if (!Number.isNaN(targetPage) && targetPage !== state.categoryDetailCurrentPage) {
        state.categoryDetailCurrentPage = targetPage;
        renderApp();
        scrollToCategoryGrid();
      }
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

function attachNewsletterFormListener(): void {
  const form = document.getElementById('newsletter-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isBn = state.lang === 'bn';
    const emailInput = document.getElementById('newsletter-email-input') as HTMLInputElement | null;
    const submitBtn = document.getElementById('newsletter-submit-btn') as HTMLButtonElement | null;
    const spinner = document.getElementById('newsletter-btn-spinner');
    const feedback = document.getElementById('newsletter-feedback-msg');

    const email = (emailInput?.value || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      if (feedback) {
        feedback.className = 'small mt-2 text-warning fw-semibold';
        feedback.textContent = isBn
          ? 'দয়া করে একটি সঠিক ইমেইল ঠিকানা লিখুন।'
          : 'Please enter a valid email address.';
      }
      emailInput?.focus();
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    spinner?.classList.remove('d-none');

    try {
      const res = await FirestoreService.subscribeNewsletter(email, state.lang);
      if (res.success) {
        if (feedback) {
          feedback.className = 'small mt-2 text-warning fw-semibold';
          feedback.textContent = isBn
            ? 'সাবস্ক্রাইব করার জন্য ধন্যবাদ! নতুন ভ্রমণ গাইড আপনার ইমেইলে পৌঁছে যাবে।'
            : 'Thank you for subscribing! You will receive our latest travel guides.';
        }
        if (emailInput) emailInput.value = '';
        showToast(
          isBn ? 'নিউজলেটার সাবস্ক্রিপশন সফল হয়েছে!' : 'Subscribed to travel newsletter!',
          'success'
        );
      } else {
        if (feedback) {
          feedback.className = 'small mt-2 text-danger fw-semibold';
          feedback.textContent =
            res.message ||
            (isBn ? 'সাবস্ক্রিপশন সম্পন্ন করা যায়নি।' : 'Subscription could not be completed.');
        }
      }
    } catch {
      if (feedback) {
        feedback.className = 'small mt-2 text-danger fw-semibold';
        feedback.textContent = isBn
          ? 'নেটওয়ার্ক সমস্যার কারণে সাবস্ক্রিপশন সম্পন্ন হয়নি।'
          : 'Network error while subscribing. Please try again.';
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      spinner?.classList.add('d-none');
    }
  });
}

function syncGuidesFilterControlsState(): void {
  const hasActiveFilters =
    state.guidesSearchQuery.trim().length > 0 ||
    (state.guidesCategoryFilter !== 'all' && state.guidesCategoryFilter !== '');

  const resetBtn = document.getElementById('guides-reset-filters-btn') as HTMLButtonElement | null;
  if (resetBtn) {
    resetBtn.disabled = !hasActiveFilters;
    resetBtn.classList.toggle('btn-accent', hasActiveFilters);
    resetBtn.classList.toggle('btn-outline-bd', !hasActiveFilters);
  }

  const clearBtn = document.getElementById('guides-clear-search-btn');
  if (clearBtn) {
    clearBtn.classList.toggle('d-none', state.guidesSearchQuery.trim().length === 0);
  }
}

function attachGuidesResultsEventListeners(): void {
  const resetGuidesFilters = () => {
    state.guidesSearchQuery = '';
    state.guidesCategoryFilter = 'all';
    state.guidesCurrentPage = 1;
    renderApp();
  };

  document.getElementById('guides-empty-reset-btn')?.addEventListener('click', resetGuidesFilters);

  document.getElementById('guides-retry-btn')?.addEventListener('click', () => {
    loadPortalDataFromFirestore(true);
  });

  const scrollToGuidesGrid = () => {
    setTimeout(() => {
      document.getElementById('guides-results-region')?.scrollIntoView({ behavior: 'smooth' });
    }, 30);
  };

  const getGuidesTotalPages = () => {
    const filtered = getFilteredPublishedArticles(
      cmsStore.articles,
      state.guidesSearchQuery,
      state.guidesCategoryFilter
    );
    return Math.max(1, Math.ceil(filtered.length / GUIDES_PER_PAGE));
  };

  document.getElementById('guides-page-prev')?.addEventListener('click', () => {
    const totalPages = getGuidesTotalPages();
    const safeCurrent = Math.min(Math.max(1, state.guidesCurrentPage), totalPages);
    if (safeCurrent > 1) {
      state.guidesCurrentPage = safeCurrent - 1;
      renderGuidesResultsOnly();
      scrollToGuidesGrid();
    }
  });

  document.getElementById('guides-page-next')?.addEventListener('click', () => {
    const totalPages = getGuidesTotalPages();
    const safeCurrent = Math.min(Math.max(1, state.guidesCurrentPage), totalPages);
    if (safeCurrent < totalPages) {
      state.guidesCurrentPage = safeCurrent + 1;
      renderGuidesResultsOnly();
      scrollToGuidesGrid();
    }
  });

  document.querySelectorAll('.guides-page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPage = parseInt(btn.getAttribute('data-page') || '1', 10);
      if (!Number.isNaN(targetPage) && targetPage !== state.guidesCurrentPage) {
        state.guidesCurrentPage = targetPage;
        renderGuidesResultsOnly();
        scrollToGuidesGrid();
      }
    });
  });

  document.querySelectorAll('.article-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const articleId = btn.getAttribute('data-article-id');
      if (articleId) openArticleModal(articleId);
    });
  });
}

function renderGuidesResultsOnly(): void {
  const resultsRegion = document.getElementById('guides-results-region');
  if (!resultsRegion) {
    renderApp();
    return;
  }

  resultsRegion.innerHTML = renderTravelGuidesResultsRegion({
    lang: state.lang,
    articles: cmsStore.articles,
    districts: cmsStore.districts.filter(d => d.is_published !== false),
    searchQuery: state.guidesSearchQuery,
    categoryFilter: state.guidesCategoryFilter,
    currentPage: state.guidesCurrentPage,
    isLoading: state.firestoreLoading,
    error: state.firestoreError
  });

  syncGuidesFilterControlsState();
  attachGuidesResultsEventListeners();
}

// Event Listeners for Travel Guides & Blog Page (/travel-guides/)
function attachTravelGuidesPageEventListeners(): void {
  const searchInput = document.getElementById('guides-search-input') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.guidesSearchQuery = (e.target as HTMLInputElement).value;
      state.guidesCurrentPage = 1;
      renderGuidesResultsOnly();
    });
  }

  document.getElementById('guides-clear-search-btn')?.addEventListener('click', () => {
    state.guidesSearchQuery = '';
    state.guidesCurrentPage = 1;
    const input = document.getElementById('guides-search-input') as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.focus();
    }
    renderGuidesResultsOnly();
  });

  document.getElementById('guides-reset-filters-btn')?.addEventListener('click', () => {
    state.guidesSearchQuery = '';
    state.guidesCategoryFilter = 'all';
    state.guidesCurrentPage = 1;
    renderApp();
  });

  document.querySelectorAll('.guides-cat-btn[data-guide-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.getAttribute('data-guide-cat') || 'all';
      state.guidesCategoryFilter = catId;
      state.guidesCurrentPage = 1;
      renderApp();
    });
  });

  attachGuidesResultsEventListeners();
  attachNewsletterFormListener();
}

// Event Listeners for Dynamic Travel Article Details Page (/travel-guides/:slug/)
function attachArticleDetailPageEventListeners(): void {
  const isBn = state.lang === 'bn';

  document.getElementById('article-detail-retry-btn')?.addEventListener('click', () => {
    loadArticleDetailFromFirestore(state.guideDetailSlug || '', true);
  });

  // Table of contents smooth anchor scrolling
  document.querySelectorAll('.article-toc-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#') && href.length > 1) {
        const targetEl = document.getElementById(href.slice(1));
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  const canonicalUrl =
    state.guideDetailArticle
      ? `${window.location.origin}/travel-guides/${encodeURIComponent((state.guideDetailArticle.slug || state.guideDetailArticle.id).toLowerCase())}/`
      : window.location.href;

  const copyArticleUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(canonicalUrl);
      } else {
        const temp = document.createElement('input');
        temp.value = canonicalUrl;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      showToast(t('link_copied'), 'success');
    } catch {
      showToast(isBn ? 'লিংক কপি করা যায়নি' : 'Could not copy link', 'error');
    }
  };

  document.getElementById('article-copy-url-btn')?.addEventListener('click', copyArticleUrl);
  document.getElementById('article-copy-url-btn-bottom')?.addEventListener('click', copyArticleUrl);

  const shareBtn = document.getElementById('article-native-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const art = state.guideDetailArticle;
      if (art && navigator.share) {
        try {
          await navigator.share({
            title: (isBn ? art.title_bn : art.title_en) || art.title_en,
            text: (isBn ? art.excerpt_bn : art.excerpt_en) || art.excerpt_en,
            url: canonicalUrl
          });
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
        }
      }
      await copyArticleUrl();
    });
  }
}

let searchDebounceTimer: number | null = null;
let searchSuggestionActiveIdx = -1;

function syncSearchResetButtonState(): void {
  const hasActiveFilters =
    state.searchPageQuery.trim().length > 0 ||
    state.searchPageTypeFilter !== 'all' ||
    state.searchPageDivisionFilter !== 'all' ||
    state.searchPageCategoryFilter !== 'all';

  const resetBtn = document.getElementById('search-reset-filters-btn') as HTMLButtonElement | null;
  if (resetBtn) {
    resetBtn.disabled = !hasActiveFilters;
    resetBtn.classList.toggle('btn-accent', hasActiveFilters);
    resetBtn.classList.toggle('btn-outline-bd', !hasActiveFilters);
  }

  const clearBtn = document.getElementById('search-page-clear-btn');
  if (clearBtn) {
    clearBtn.classList.toggle('d-none', state.searchPageQuery.trim().length === 0);
  }
}

function attachSearchResultsEventListeners(): void {
  document.getElementById('search-retry-btn')?.addEventListener('click', () => {
    loadPortalDataFromFirestore(true);
  });

  const resetAllSearchFilters = () => {
    if (searchDebounceTimer !== null) {
      window.clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
    state.searchPageQuery = '';
    state.searchPageTypeFilter = 'all';
    state.searchPageDivisionFilter = 'all';
    state.searchPageCategoryFilter = 'all';
    state.searchPageCurrentPage = 1;
    syncSearchUrlAndSeo(false);
    renderApp();
  };

  document.getElementById('search-empty-reset-btn')?.addEventListener('click', resetAllSearchFilters);

  document.querySelectorAll('.search-type-filter-btn[data-search-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextType = (btn.getAttribute('data-search-type') || 'all') as SearchTypeFilter;
      if (nextType !== state.searchPageTypeFilter) {
        state.searchPageTypeFilter = nextType;
        state.searchPageCurrentPage = 1;
        syncSearchUrlAndSeo(false);
        refreshSearchResultsOnly();
      }
    });
  });

  document.querySelectorAll('.search-quick-chip-btn[data-quick-query]').forEach(btn => {
    btn.addEventListener('click', () => {
      const kw = sanitizeSearchInput(btn.getAttribute('data-quick-query') || '');
      if (searchDebounceTimer !== null) {
        window.clearTimeout(searchDebounceTimer);
        searchDebounceTimer = null;
      }
      state.searchPageQuery = kw;
      state.searchPageCurrentPage = 1;
      const input = document.getElementById('search-page-input') as HTMLInputElement | null;
      if (input) input.value = kw;
      syncSearchUrlAndSeo(false);
      refreshSearchResultsOnly();
    });
  });

  const scrollToSearchResults = () => {
    setTimeout(() => {
      document.getElementById('search-results-region')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  const getSearchTotalPages = () => {
    const index = buildGlobalSearchIndex({
      divisions: cmsStore.divisions,
      districts: cmsStore.districts,
      categories: cmsStore.categories,
      spots: cmsStore.spots,
      articles: cmsStore.articles
    });
    const res = executeIndexedGlobalSearch(index, {
      query: state.searchPageQuery,
      typeFilter: state.searchPageTypeFilter,
      divisionFilter: state.searchPageDivisionFilter,
      categoryFilter: state.searchPageCategoryFilter,
      lang: state.lang
    });
    return Math.max(1, Math.ceil(res.items.length / SEARCH_RESULTS_PER_PAGE));
  };

  document.getElementById('search-page-prev')?.addEventListener('click', () => {
    const totalPages = getSearchTotalPages();
    const safeCurrent = Math.min(Math.max(1, state.searchPageCurrentPage), totalPages);
    if (safeCurrent > 1) {
      state.searchPageCurrentPage = safeCurrent - 1;
      syncSearchUrlAndSeo(false);
      refreshSearchResultsOnly();
      scrollToSearchResults();
    }
  });

  document.getElementById('search-page-next')?.addEventListener('click', () => {
    const totalPages = getSearchTotalPages();
    const safeCurrent = Math.min(Math.max(1, state.searchPageCurrentPage), totalPages);
    if (safeCurrent < totalPages) {
      state.searchPageCurrentPage = safeCurrent + 1;
      syncSearchUrlAndSeo(false);
      refreshSearchResultsOnly();
      scrollToSearchResults();
    }
  });

  document.querySelectorAll('.search-page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPage = parseInt(btn.getAttribute('data-page') || '1', 10);
      if (!Number.isNaN(targetPage) && targetPage !== state.searchPageCurrentPage) {
        state.searchPageCurrentPage = targetPage;
        syncSearchUrlAndSeo(false);
        refreshSearchResultsOnly();
        scrollToSearchResults();
      }
    });
  });
}

function refreshSearchResultsOnly(): void {
  const region = document.getElementById('search-results-region');
  if (!region) {
    renderApp();
    return;
  }

  region.innerHTML = renderSearchResultsRegion({
    lang: state.lang,
    divisions: cmsStore.divisions,
    districts: cmsStore.districts,
    categories: cmsStore.categories,
    spots: cmsStore.spots,
    articles: cmsStore.articles,
    query: state.searchPageQuery,
    typeFilter: state.searchPageTypeFilter,
    divisionFilter: state.searchPageDivisionFilter,
    categoryFilter: state.searchPageCategoryFilter,
    currentPage: state.searchPageCurrentPage,
    isLoading: state.firestoreLoading,
    error: state.firestoreError
  });

  syncSearchResetButtonState();
  attachSearchResultsEventListeners();
}

// Event Listeners for Global Search Page (/search/)
function attachSearchPageEventListeners(): void {
  const form = document.getElementById('search-page-form') as HTMLFormElement | null;
  const input = document.getElementById('search-page-input') as HTMLInputElement | null;
  const suggestionsBox = document.getElementById('search-suggestions-box');
  let isComposing = false;

  const hideSuggestions = () => {
    searchSuggestionActiveIdx = -1;
    if (suggestionsBox) {
      suggestionsBox.classList.add('d-none');
    }
    input?.setAttribute('aria-expanded', 'false');
  };

  const showAndRenderSuggestions = (rawQuery: string) => {
    if (!suggestionsBox) return;
    const index = buildGlobalSearchIndex({
      divisions: cmsStore.divisions,
      districts: cmsStore.districts,
      categories: cmsStore.categories,
      spots: cmsStore.spots,
      articles: cmsStore.articles
    });
    const suggestions = getSearchSuggestions(index, rawQuery, state.lang, 7);
    const html = renderSearchSuggestionsDropdown(suggestions, rawQuery, state.lang, searchSuggestionActiveIdx);
    if (!html) {
      hideSuggestions();
      return;
    }

    suggestionsBox.innerHTML = html;
    suggestionsBox.classList.remove('d-none');
    input?.setAttribute('aria-expanded', 'true');

    suggestionsBox.querySelectorAll('.search-fill-keyword-btn[data-fill-keyword]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const kw = sanitizeSearchInput(btn.getAttribute('data-fill-keyword') || '');
        if (searchDebounceTimer !== null) {
          window.clearTimeout(searchDebounceTimer);
          searchDebounceTimer = null;
        }
        state.searchPageQuery = kw;
        state.searchPageCurrentPage = 1;
        if (input) {
          input.value = kw;
          input.focus();
        }
        hideSuggestions();
        syncSearchUrlAndSeo(false);
        refreshSearchResultsOnly();
      });
    });
  };

  const commitDebouncedSearch = (rawVal: string) => {
    if (searchDebounceTimer !== null) {
      window.clearTimeout(searchDebounceTimer);
    }
    const cleanVal = sanitizeSearchInput(rawVal);
    searchDebounceTimer = window.setTimeout(() => {
      searchDebounceTimer = null;
      state.searchPageQuery = cleanVal;
      state.searchPageCurrentPage = 1;
      syncSearchUrlAndSeo(true);
      refreshSearchResultsOnly();
    }, 260);
  };

  if (input) {
    input.addEventListener('focus', () => {
      searchSuggestionActiveIdx = -1;
      showAndRenderSuggestions(input.value);
    });

    input.addEventListener('compositionstart', () => {
      isComposing = true;
    });

    input.addEventListener('compositionend', () => {
      isComposing = false;
      searchSuggestionActiveIdx = -1;
      showAndRenderSuggestions(input.value);
      commitDebouncedSearch(input.value);
    });

    input.addEventListener('input', () => {
      const clearBtn = document.getElementById('search-page-clear-btn');
      if (clearBtn) {
        clearBtn.classList.toggle('d-none', input.value.trim().length === 0);
      }
      if (isComposing) return;
      searchSuggestionActiveIdx = -1;
      showAndRenderSuggestions(input.value);
      commitDebouncedSearch(input.value);
    });

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!suggestionsBox || suggestionsBox.classList.contains('d-none')) return;
      const items = suggestionsBox.querySelectorAll('.search-suggestion-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchSuggestionActiveIdx = (searchSuggestionActiveIdx + 1) % items.length;
        items.forEach((el, idx) => {
          const active = idx === searchSuggestionActiveIdx;
          el.classList.toggle('active', active);
          el.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchSuggestionActiveIdx = (searchSuggestionActiveIdx - 1 + items.length) % items.length;
        items.forEach((el, idx) => {
          const active = idx === searchSuggestionActiveIdx;
          el.classList.toggle('active', active);
          el.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      } else if (e.key === 'Escape') {
        hideSuggestions();
      } else if (e.key === 'Enter' && searchSuggestionActiveIdx >= 0) {
        const selectedEl = items[searchSuggestionActiveIdx] as HTMLElement | undefined;
        const targetLink = selectedEl?.querySelector('a.search-suggestion-link') as HTMLAnchorElement | null;
        if (targetLink) {
          e.preventDefault();
          hideSuggestions();
          targetLink.click();
        }
      }
    });
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (searchDebounceTimer !== null) {
      window.clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
    state.searchPageQuery = sanitizeSearchInput(input?.value ?? '');
    state.searchPageCurrentPage = 1;
    hideSuggestions();
    syncSearchUrlAndSeo(false);
    refreshSearchResultsOnly();
  });

  document.getElementById('search-page-clear-btn')?.addEventListener('click', () => {
    if (searchDebounceTimer !== null) {
      window.clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
    state.searchPageQuery = '';
    state.searchPageCurrentPage = 1;
    if (input) {
      input.value = '';
      input.focus();
    }
    hideSuggestions();
    syncSearchUrlAndSeo(false);
    refreshSearchResultsOnly();
  });

  const divisionSelect = document.getElementById('search-division-select') as HTMLSelectElement | null;
  divisionSelect?.addEventListener('change', (e) => {
    state.searchPageDivisionFilter = (e.target as HTMLSelectElement).value || 'all';
    state.searchPageCurrentPage = 1;
    syncSearchUrlAndSeo(false);
    refreshSearchResultsOnly();
  });

  const categorySelect = document.getElementById('search-category-select') as HTMLSelectElement | null;
  categorySelect?.addEventListener('change', (e) => {
    state.searchPageCategoryFilter = (e.target as HTMLSelectElement).value || 'all';
    state.searchPageCurrentPage = 1;
    syncSearchUrlAndSeo(false);
    refreshSearchResultsOnly();
  });

  document.getElementById('search-reset-filters-btn')?.addEventListener('click', () => {
    if (searchDebounceTimer !== null) {
      window.clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
    state.searchPageQuery = '';
    state.searchPageTypeFilter = 'all';
    state.searchPageDivisionFilter = 'all';
    state.searchPageCategoryFilter = 'all';
    state.searchPageCurrentPage = 1;
    syncSearchUrlAndSeo(false);
    renderApp();
  });

  // Hero quick search chips
  document.querySelectorAll('.search-quick-chip-btn[data-quick-query]').forEach(btn => {
    btn.addEventListener('click', () => {
      const kw = sanitizeSearchInput(btn.getAttribute('data-quick-query') || '');
      if (searchDebounceTimer !== null) {
        window.clearTimeout(searchDebounceTimer);
        searchDebounceTimer = null;
      }
      state.searchPageQuery = kw;
      state.searchPageCurrentPage = 1;
      if (input) input.value = kw;
      hideSuggestions();
      syncSearchUrlAndSeo(false);
      refreshSearchResultsOnly();
    });
  });

  attachSearchResultsEventListeners();
}

// Deep-link routing based on URL path (/divisions/, /divisions/:slug/, /districts/, /districts/:slug/, /search/) and hash (#spot-..., #cms)
function handleHashRoute(): void {
  const parsed = parseCurrentRoute();

  if (parsed.type === 'search') {
    const prevQ = state.searchPageQuery;
    const prevType = state.searchPageTypeFilter;
    const prevDiv = state.searchPageDivisionFilter;
    const prevCat = state.searchPageCategoryFilter;
    const prevPage = state.searchPageCurrentPage;
    applySearchParamsFromUrl();
    if (
      state.activeView === 'search' &&
      prevQ === state.searchPageQuery &&
      prevType === state.searchPageTypeFilter &&
      prevDiv === state.searchPageDivisionFilter &&
      prevCat === state.searchPageCategoryFilter &&
      prevPage === state.searchPageCurrentPage
    ) {
      return;
    }
    openSearchPage(false);
    return;
  }

  if (parsed.type === 'about') {
    if (state.activeView === 'about') return;
    openAboutPage(false);
    return;
  }

  if (parsed.type === 'contact') {
    if (state.activeView === 'contact') return;
    openContactPage(false);
    return;
  }

  if (parsed.type === 'privacy-policy') {
    if (state.activeView === 'privacy-policy') return;
    openPrivacyPolicyPage(false);
    return;
  }

  if (parsed.type === 'terms') {
    if (state.activeView === 'terms') return;
    openTermsPage(false);
    return;
  }

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

  if (parsed.type === 'categories') {
    if (state.activeView === 'categories') return;
    openAllCategoriesPage(false);
    return;
  }

  if (parsed.type === 'category-detail' && parsed.id) {
    if (state.activeView === 'category-detail' && state.categoryDetailSlug === parsed.id) return;
    openCategoryDetailPage(parsed.id, false);
    return;
  }

  if (parsed.type === 'guides') {
    if (state.activeView === 'guides') return;
    openTravelGuidesPage(false);
    return;
  }

  if (parsed.type === 'guide-detail' && parsed.id) {
    if (state.activeView === 'guide-detail' && state.guideDetailSlug === parsed.id) return;
    openArticleDetailPage(parsed.id, false);
    return;
  }

  if (parsed.type === 'spots') {
    if (state.activeView === 'spots') return;
    applyPlacesQueryParamsFromUrl();
    openAllPlacesPage(false);
    return;
  }

  if (parsed.type === 'spot-detail' && parsed.id) {
    if (state.activeView === 'spot-detail' && state.spotDetailSlug === parsed.id) return;
    openSpotDetailPage(parsed.id, false);
    return;
  }

  if (parsed.type === 'admin-login') {
    void openAdminLoginPage(false);
    return;
  }

  if (parsed.type === 'cms') {
    const requestedTab = (parsed.id as CmsTab) || 'overview';
    void openProtectedAdminRoute(false, requestedTab);
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

  // Quick Search Trigger in Navbar -> Navigate to /search/ (or focus if already there)
  document.getElementById('btn-nav-search')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeMobileNavbar();
    if (state.activeView === 'search') {
      const pageSearch = document.getElementById('search-page-input') as HTMLInputElement | null;
      if (pageSearch) {
        pageSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => pageSearch.focus(), 200);
      }
      return;
    }
    openSearchPage(true);
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

  // Navbar link triggers
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', (e) => {
      const navTarget = link.getAttribute('data-nav');
      closeMobileNavbar();
      if (navTarget === 'search') {
        e.preventDefault();
        openSearchPage(true);
        return;
      }

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

      if (navTarget === 'categories') {
        e.preventDefault();
        openAllCategoriesPage();
        return;
      }

      if (navTarget === 'spots') {
        e.preventDefault();
        openAllPlacesPage();
        return;
      }

      if (navTarget === 'guides') {
        e.preventDefault();
        openTravelGuidesPage();
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

    if (href.startsWith('/places/?')) {
      e.preventDefault();
      navigateToPath(href);
      state.placesSearchQuery = '';
      state.placesDivisionFilter = 'all';
      state.placesDistrictFilter = 'all';
      state.placesCategoryFilter = 'all';
      state.placesCurrentPage = 1;
      applyPlacesQueryParamsFromUrl();
      openAllPlacesPage(false);
      return;
    }

    if (href === '/categories/' || href === '/categories') {
      e.preventDefault();
      openAllCategoriesPage();
      return;
    }

    if (href.startsWith('/categories/')) {
      const slug = href.replace('/categories/', '').replace(/\/+$/, '').split('/')[0];
      if (slug) {
        e.preventDefault();
        openCategoryDetailPage(decodeURIComponent(slug));
        return;
      }
    }

    if (href.startsWith('/places/')) {
      const slug = href.replace('/places/', '').replace(/\/+$/, '').split('/')[0];
      if (slug) {
        e.preventDefault();
        openSpotDetailPage(decodeURIComponent(slug));
        return;
      }
    }

    if (href === '/travel-guides/' || href === '/travel-guides') {
      e.preventDefault();
      openTravelGuidesPage();
      return;
    }

    if (href.startsWith('/travel-guides/')) {
      const slug = href.replace('/travel-guides/', '').replace(/\/+$/, '').split('/')[0];
      if (slug) {
        e.preventDefault();
        openArticleDetailPage(decodeURIComponent(slug));
        return;
      }
    }

    if (href === '/search/' || href === '/search' || href.startsWith('/search/?')) {
      e.preventDefault();
      navigateToPath(href.startsWith('/search/?') ? href : '/search/');
      applySearchParamsFromUrl();
      openSearchPage(false);
      return;
    }

    if (href === '/about/' || href === '/about') {
      e.preventDefault();
      openAboutPage();
      return;
    }

    if (href === '/contact/' || href === '/contact') {
      e.preventDefault();
      openContactPage();
      return;
    }

    if (href === '/privacy-policy/' || href === '/privacy-policy') {
      e.preventDefault();
      openPrivacyPolicyPage();
      return;
    }

    if (href === '/terms-and-conditions/' || href === '/terms-and-conditions') {
      e.preventDefault();
      openTermsPage();
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

  // Close mobile navbar and search suggestions when clicking outside
  document.addEventListener('click', (e) => {
    const targetEl = e.target as HTMLElement | null;
    if (targetEl && !targetEl.closest('#main-nav')) {
      closeMobileNavbar();
    }
    if (
      state.activeView === 'search' &&
      targetEl &&
      !targetEl.closest('#search-page-form') &&
      !targetEl.closest('#search-suggestions-box')
    ) {
      searchSuggestionActiveIdx = -1;
      document.getElementById('search-suggestions-box')?.classList.add('d-none');
      document.getElementById('search-page-input')?.setAttribute('aria-expanded', 'false');
    }
  });

  // Accessibility: Keyboard Escape key closes any active modal, mobile navbar, or admin drawer
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileNavbar();
      closeAdminSidebarDrawer();
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
  void testConnection();
  
  // Ensure official administrative district relationships (e.g. Jamalpur -> Mymensingh) even with cached localStorage
  cmsStore.districts = FirestoreService.normalizeDistrictAdministrativeDivision(cmsStore.districts);

  document.body.className = state.lang === 'en' ? 'lang-en' : 'lang-bn';
  document.documentElement.lang = state.lang;

  // Re-verify active admin session when browser tab regains focus
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.activeView === 'cms' && adminRuntime) {
      void adminRuntime.verifyCurrentAdminSession(false, () => {
        void handleAdminSessionExpired();
      }).then(outcome => {
        if (state.activeView === 'cms' && outcome.status !== 'authenticated') {
          void handleAdminSessionExpired();
        }
      });
    }
  });

  // Resolve initial route (/admin/login/, /admin/, /divisions/, /districts/, or /)
  const initialRoute = parseCurrentRoute();
  if (initialRoute.type === 'admin-login') {
    state.activeView = 'admin-login';
    state.adminAuthStatus = 'checking';
  } else if (initialRoute.type === 'divisions') {
    state.activeView = 'divisions';
  } else if (initialRoute.type === 'division' && initialRoute.id) {
    state.activeView = 'division-detail';
    state.selectedDivisionId = initialRoute.id;
  } else if (initialRoute.type === 'districts') {
    state.activeView = 'districts';
  } else if (initialRoute.type === 'district' && initialRoute.id) {
    state.activeView = 'district-detail';
    state.selectedDistrictId = initialRoute.id;
  } else if (initialRoute.type === 'categories') {
    state.activeView = 'categories';
  } else if (initialRoute.type === 'category-detail' && initialRoute.id) {
    state.activeView = 'category-detail';
    state.categoryDetailSlug = initialRoute.id;
  } else if (initialRoute.type === 'spots') {
    state.activeView = 'spots';
    applyPlacesQueryParamsFromUrl();
  } else if (initialRoute.type === 'spot-detail' && initialRoute.id) {
    state.activeView = 'spot-detail';
    state.spotDetailSlug = initialRoute.id;
  } else if (initialRoute.type === 'guides') {
    state.activeView = 'guides';
  } else if (initialRoute.type === 'guide-detail' && initialRoute.id) {
    state.activeView = 'guide-detail';
    state.guideDetailSlug = initialRoute.id;
  } else if (initialRoute.type === 'search') {
    state.activeView = 'search';
    applySearchParamsFromUrl();
  } else if (initialRoute.type === 'about') {
    state.activeView = 'about';
  } else if (initialRoute.type === 'contact') {
    state.activeView = 'contact';
  } else if (initialRoute.type === 'privacy-policy') {
    state.activeView = 'privacy-policy';
  } else if (initialRoute.type === 'terms') {
    state.activeView = 'terms';
  } else if (initialRoute.type === 'cms') {
    state.activeView = 'cms';
    state.adminAuthStatus = 'checking';
    cmsStore.activeTab = (initialRoute.id as CmsTab) || 'overview';
  }

  renderLayoutShell();
  updateStaticNavbarTranslations();
  updateSavedBadgeCount();
  updateDynamicSeo();

  // Bind global UI triggers & Accessibility hooks
  initializeGlobalEventListeners();

  if (initialRoute.type === 'admin-login') {
    await openAdminLoginPage(false);
  } else if (initialRoute.type === 'cms') {
    await openProtectedAdminRoute(false, (initialRoute.id as CmsTab) || 'overview');
  } else if (initialRoute.type === 'division' && initialRoute.id) {
    void SiteSettingsService.getAdsSettings().then(ads => {
      state.adsSettings = ads;
      if (state.activeView !== 'cms' && state.activeView !== 'admin-login') {
        renderLayoutShell();
        renderApp();
      }
    });
    await loadDivisionDetailFromFirestore(initialRoute.id, true);
  } else if (initialRoute.type === 'district' && initialRoute.id) {
    void SiteSettingsService.getAdsSettings().then(ads => {
      state.adsSettings = ads;
      if (state.activeView !== 'cms' && state.activeView !== 'admin-login') {
        renderLayoutShell();
        renderApp();
      }
    });
    await loadDistrictDetailFromFirestore(initialRoute.id, true);
  } else if (initialRoute.type === 'category-detail' && initialRoute.id) {
    void SiteSettingsService.getAdsSettings().then(ads => {
      state.adsSettings = ads;
      if (state.activeView !== 'cms' && state.activeView !== 'admin-login') {
        renderLayoutShell();
        renderApp();
      }
    });
    await loadCategoryDetailFromFirestore(initialRoute.id, true);
  } else if (initialRoute.type === 'spot-detail' && initialRoute.id) {
    void SiteSettingsService.getAdsSettings().then(ads => {
      state.adsSettings = ads;
      if (state.activeView !== 'cms' && state.activeView !== 'admin-login') {
        renderLayoutShell();
        renderApp();
      }
    });
    await loadSpotDetailFromFirestore(initialRoute.id, true);
  } else if (initialRoute.type === 'guide-detail' && initialRoute.id) {
    void SiteSettingsService.getAdsSettings().then(ads => {
      state.adsSettings = ads;
      if (state.activeView !== 'cms' && state.activeView !== 'admin-login') {
        renderLayoutShell();
        renderApp();
      }
    });
    await loadArticleDetailFromFirestore(initialRoute.id, true);
  } else {
    // Fetch live division & destination data from Firestore (renders loading state while in flight)
    await loadPortalDataFromFirestore();
    renderLayoutShell();
  }

  // Handle deep-linked spot modal on /places/#spot-...
  if (initialRoute.type === 'spots' && window.location.hash.startsWith('#spot-')) {
    const spotId = window.location.hash.replace(/^#spot-/, '').trim();
    if (spotId) {
      openSpotModal(spotId, false);
    }
  }

  // Handle any post-hydration deep-link anchors/modals
  if (
    initialRoute.type !== 'admin-login' &&
    initialRoute.type !== 'cms' &&
    initialRoute.type !== 'divisions' &&
    initialRoute.type !== 'division' &&
    initialRoute.type !== 'districts' &&
    initialRoute.type !== 'district' &&
    initialRoute.type !== 'categories' &&
    initialRoute.type !== 'category-detail' &&
    initialRoute.type !== 'spots' &&
    initialRoute.type !== 'spot-detail' &&
    initialRoute.type !== 'guides' &&
    initialRoute.type !== 'guide-detail' &&
    initialRoute.type !== 'search' &&
    initialRoute.type !== 'about' &&
    initialRoute.type !== 'contact' &&
    initialRoute.type !== 'privacy-policy' &&
    initialRoute.type !== 'terms' &&
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
