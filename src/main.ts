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
  renderDivisionCard, 
  renderDestinationCard, 
  renderDistrictCard, 
  renderCategoryPill 
} from './components';

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
  activeView: 'home' | 'divisions' | 'districts' | 'spots' | 'guides' | 'planner' | 'saved' | 'cms';
  divisionFilter: string;
  categoryFilter: string;
  searchQuery: string;
  selectedDivisionId: string | null;
  selectedDistrictId: string | null;
  bookmarkedIds: Set<string>;
  currentUser: User | null;
  activeDistrictTabDivision: string;
  itineraryResult: string | null;
}

// Initial State
const state: AppState = {
  lang: getCurrentLanguage(),
  activeView: 'home',
  divisionFilter: 'all',
  categoryFilter: 'all',
  searchQuery: '',
  selectedDivisionId: null,
  selectedDistrictId: null,
  bookmarkedIds: new Set<string>(JSON.parse(localStorage.getItem('bd_tourism_bookmarks') || '[]')),
  currentUser: null,
  activeDistrictTabDivision: 'all',
  itineraryResult: null
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

// Synchronize SEO meta tags, title, and canonical URLs dynamically
export function updateDynamicSeo(pageTitle?: string, metaDesc?: string, hashRoute?: string): void {
  const isBn = state.lang === 'bn';
  const defaultTitle = isBn 
    ? 'অপরূপ বাংলাদেশ | Beautiful Bangladesh - Official Tourism Portal' 
    : 'Beautiful Bangladesh - Official Tourism Portal & Travel Guide';
  const defaultDesc = isBn
    ? 'বাংলাদেশের ৮টি বিভাগ, ৬৪টি জেলা, দর্শনীয় স্থান, ঐতিহাসিক ঐতিহ্য এবং প্রাকৃতিক সৌন্দর্যের তথ্যবহুল গাইড।'
    : 'Discover Bangladesh\'s 8 administrative divisions, 64 districts, natural wonders, UNESCO World Heritage sites, and curated travel itineraries in Bengali and English.';

  const finalTitle = pageTitle ? `${pageTitle} | ${isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh'}` : defaultTitle;
  const finalDesc = metaDesc || defaultDesc;

  document.title = finalTitle;

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', finalDesc);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', finalTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', finalDesc);

  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute('content', finalTitle);

  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.setAttribute('content', finalDesc);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const base = 'https://bangladesh-tourism.netlify.app/';
    canonical.setAttribute('href', hashRoute ? `${base}#${hashRoute}` : base);
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

// Switch Language and retain current view and context
function switchLanguage(): void {
  state.lang = state.lang === 'bn' ? 'en' : 'bn';
  setLanguagePreference(state.lang);
  document.body.className = state.lang === 'en' ? 'lang-en' : 'lang-bn';
  document.documentElement.lang = state.lang;
  updateStaticNavbarTranslations();
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

  if (navHome) navHome.textContent = t('nav_home');
  if (navDiv) navDiv.textContent = t('nav_divisions');
  if (navDist) navDist.textContent = t('nav_districts');
  if (navSpots) navSpots.textContent = t('nav_spots');
  if (navGuides) navGuides.textContent = t('nav_guides');
  if (navPlanner) navPlanner.textContent = t('nav_planner');
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
  const spot = cmsStore.spots.find(s => s.id === spotId);
  if (!spot) return;

  const modalContainer = document.getElementById('spotModalContent');
  if (!modalContainer) return;

  const isBn = state.lang === 'bn';
  const division = cmsStore.divisions.find(d => d.id === spot.division_id);
  const district = cmsStore.districts.find(d => d.id === spot.district_id);
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
        <span class="text-white-50 small"><i class="bi bi-star-fill text-warning me-1"></i>${spot.rating} / 5.0</span>
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
          <li class="breadcrumb-item"><a href="#" class="text-secondary-bd">${t('nav_home')}</a></li>
          <li class="breadcrumb-item"><a href="#division-${division?.id || ''}" class="text-secondary-bd">${escapeHtml(isBn ? division?.name_bn || '' : division?.name_en || '')}</a></li>
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

// ============================================================================
// MAIN RENDER FUNCTION (Handles Portal vs CMS)
// ============================================================================
function renderApp(): void {
  const root = document.getElementById('app-root');
  if (!root) return;

  const isBn = state.lang === 'bn';

  // 1. Render CMS Dashboard if activeView is 'cms'
  if (state.activeView === 'cms') {
    root.innerHTML = renderCmsDashboard(
      state.lang, 
      () => {
        state.activeView = 'home';
        renderApp();
      },
      () => renderApp()
    );
    attachCmsEventListeners();
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
    <!-- Hero Section -->
    <section class="hero-wrapper">
      <div class="container">
        <div class="row align-items-center">
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
              <a href="#divisions" class="btn btn-accent px-4 py-2 rounded-pill">
                <i class="bi bi-grid-fill me-2"></i>${t('nav_divisions')}
              </a>
              <a href="#districts" class="btn btn-outline-light px-4 py-2 rounded-pill">
                <i class="bi bi-geo-alt-fill me-2"></i>${t('nav_districts')}
              </a>
              <button class="btn btn-warning px-4 py-2 rounded-pill text-dark fw-bold" id="hero-btn-cms">
                <i class="bi bi-gear-fill me-2"></i>${isBn ? 'সিএমএস অ্যাডমিন পোর্টাল' : 'Open CMS Portal'}
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
        <div class="text-secondary small fw-semibold">
          ${isBn ? `মোট ${filteredSpots.length}টি স্থান প্রদর্শিত` : `Showing ${filteredSpots.length} attractions`}
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
            const division = cmsStore.divisions.find(d => d.id === spot.division_id);
            const district = cmsStore.districts.find(d => d.id === spot.district_id);
            const isBookmarked = state.bookmarkedIds.has(spot.id);
            return renderDestinationCard({
              spot,
              division,
              district,
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
        <div class="text-muted small">
          ${isBn ? `প্রদর্শিত জেলা: ${filteredDistricts.length} / ${publishedDistricts.length}` : `Districts showing: ${filteredDistricts.length} / ${publishedDistricts.length}`}
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

  // Division Card Click Action
  document.querySelectorAll('.division-card-action').forEach(card => {
    card.addEventListener('click', () => {
      const divId = card.getAttribute('data-division-id');
      if (divId) {
        state.activeDistrictTabDivision = divId;
        state.divisionFilter = divId;
        renderApp();
        const distSection = document.getElementById('districts');
        if (distSection) distSection.scrollIntoView({ behavior: 'smooth' });
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

// Deep-link routing based on URL hash (e.g. #spot-sundarbans, #division-chattogram, #cms)
function handleHashRoute(): void {
  const hash = window.location.hash.trim();
  if (!hash) {
    updateDynamicSeo();
    return;
  }

  if (hash === '#cms') {
    state.activeView = 'cms';
    renderApp();
    updateDynamicSeo(
      state.lang === 'bn' ? 'সিএমএস অ্যাডমিন পোর্টাল' : 'CMS Admin Dashboard',
      'Administrative Content Management System for Bangladesh Tourism Portal',
      'cms'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (hash.startsWith('#spot-')) {
    const spotId = hash.replace('#spot-', '');
    const spot = cmsStore.spots.find(s => s.id === spotId);
    if (spot) {
      if (state.activeView === 'cms') {
        state.activeView = 'home';
        renderApp();
      }
      openSpotModal(spot.id, false);
      return;
    }
  }

  if (hash.startsWith('#division-')) {
    const divId = hash.replace('#division-', '');
    const div = cmsStore.divisions.find(d => d.id === divId);
    if (div) {
      if (state.activeView === 'cms') {
        state.activeView = 'home';
      }
      state.activeDistrictTabDivision = div.id;
      state.divisionFilter = div.id;
      renderApp();
      const isBn = state.lang === 'bn';
      updateDynamicSeo(
        isBn ? div.name_bn : div.name_en,
        isBn ? div.description_bn : div.description_en,
        `division-${div.id}`
      );
      const distSection = document.getElementById('districts');
      if (distSection) distSection.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  }

  if (hash === '#districts') {
    if (state.activeView === 'cms') {
      state.activeView = 'home';
      renderApp();
    }
    const distSection = document.getElementById('districts');
    if (distSection) distSection.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (hash === '#divisions') {
    if (state.activeView === 'cms') {
      state.activeView = 'home';
      renderApp();
    }
    const divSection = document.getElementById('divisions');
    if (divSection) divSection.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (hash === '#spots') {
    if (state.activeView === 'cms') {
      state.activeView = 'home';
      renderApp();
    }
    const spotsSection = document.getElementById('spots');
    if (spotsSection) spotsSection.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (hash === '#guides') {
    if (state.activeView === 'cms') {
      state.activeView = 'home';
      renderApp();
    }
    const guidesSection = document.getElementById('guides');
    if (guidesSection) guidesSection.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (hash === '#planner') {
    if (state.activeView === 'cms') {
      state.activeView = 'home';
      renderApp();
    }
    const plannerSection = document.getElementById('planner');
    if (plannerSection) plannerSection.scrollIntoView({ behavior: 'smooth' });
    return;
  }
}

// Global Static Event Listeners & Accessibility Hooks
function initializeGlobalEventListeners(): void {
  // Language Switcher Button
  document.getElementById('lang-switcher')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchLanguage();
  });

  // Saved Destinations Trigger
  document.getElementById('btn-saved-places')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeView = state.activeView === 'saved' ? 'home' : 'saved';
    renderApp();
    const spotsSection = document.getElementById('spots');
    if (spotsSection) spotsSection.scrollIntoView({ behavior: 'smooth' });
  });

  // Admin Portal / CMS Toggle Trigger
  document.getElementById('btn-admin-portal')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeView = state.activeView === 'cms' ? 'home' : 'cms';
    if (state.activeView === 'cms') {
      window.location.hash = 'cms';
    } else {
      history.replaceState(null, '', window.location.pathname);
      updateDynamicSeo();
    }
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Navbar link triggers
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', (e) => {
      const navTarget = link.getAttribute('data-nav');
      document.querySelectorAll('.nav-link-custom').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      if (state.activeView === 'cms') {
        state.activeView = 'home';
      }

      if (navTarget === 'home') {
        state.divisionFilter = 'all';
        state.categoryFilter = 'all';
        state.searchQuery = '';
        history.replaceState(null, '', window.location.pathname);
        updateDynamicSeo();
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Brand link
  document.getElementById('brand-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeView = 'home';
    state.divisionFilter = 'all';
    state.categoryFilter = 'all';
    state.searchQuery = '';
    history.replaceState(null, '', window.location.pathname);
    updateDynamicSeo();
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Listen for spot details modal close to reset URL hash and restore canonical SEO
  const spotModalEl = document.getElementById('spotDetailsModal');
  spotModalEl?.addEventListener('hidden.bs.modal', () => {
    if (window.location.hash.startsWith('#spot-')) {
      history.replaceState(null, '', window.location.pathname);
    }
    updateDynamicSeo();
  });

  // Accessibility: Keyboard Escape key closes any active modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal.show');
      openModals.forEach(modalEl => {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
        if (bsModal) bsModal.hide();
      });
    }
  });

  // Listen for hash changes to navigate dynamically without page reload
  window.addEventListener('hashchange', () => {
    handleHashRoute();
  });
}

// App Initialization
async function initializeApp(): Promise<void> {
  console.info('Initializing Bangladesh Tourism Portal & CMS...');
  
  document.body.className = state.lang === 'en' ? 'lang-en' : 'lang-bn';
  document.documentElement.lang = state.lang;
  updateStaticNavbarTranslations();
  updateSavedBadgeCount();
  updateDynamicSeo();

  // Test Firebase connection
  testConnection();

  // Listen to Auth State
  onAuthStateChanged(auth, (user) => {
    state.currentUser = user;
    if (user) {
      console.info('Authenticated user:', user.email);
    }
  });

  // Render initial application UI
  renderApp();

  // Bind global UI triggers & Accessibility hooks
  initializeGlobalEventListeners();

  // Handle deep-link routes on boot
  handleHashRoute();
}

// Boot up
document.addEventListener('DOMContentLoaded', initializeApp);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initializeApp();
}
