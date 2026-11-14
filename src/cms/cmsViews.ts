/**
 * CMS Views & Interactive UI Components
 * Complete CRUD Management Modules 1-6
 */

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
} from './cmsState';

import { 
  type Division, 
  type District, 
  type Category, 
  type TouristSpot, 
  type Article, 
  type MediaItem 
} from '../data/bangladeshData';

import { getTranslation, type Language } from '../i18n';
import { uploadImageFile } from '../firebase';

// Helper for Bootstrap Modal instance
function getBsModal(id: string): any {
  const el = document.getElementById(id);
  if (!el) return null;
  const bs = (window as any).bootstrap;
  if (bs && bs.Modal) {
    return bs.Modal.getOrCreateInstance(el);
  }
  return null;
}

// Toast Notification
export function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
  const container = document.getElementById('cmsToastContainer');
  if (!container) return;

  const toastId = 'toast_' + Date.now();
  const bgClass = type === 'success' ? 'bg-success text-white' : (type === 'error' ? 'bg-danger text-white' : 'bg-warning text-dark');
  const icon = type === 'success' ? 'bi-check-circle-fill' : (type === 'error' ? 'bi-exclamation-octagon-fill' : 'bi-exclamation-triangle-fill');

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon} fs-5"></i>
          <div>${message}</div>
        </div>
        <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', toastHtml);
  const toastEl = document.getElementById(toastId);
  if (toastEl && (window as any).bootstrap) {
    const bsToast = new (window as any).bootstrap.Toast(toastEl, { delay: 4000 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }
}

// Slug generator helper
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Confirmation / Blocker Modal
export function showConfirmModal(options: {
  title: string;
  message: string;
  isBlocked?: boolean;
  onConfirm?: () => void;
  lang: Language;
}): void {
  const container = document.getElementById('cmsConfirmModalContent');
  if (!container) return;

  const isBn = options.lang === 'bn';

  container.innerHTML = `
    <div class="modal-travel-header ${options.isBlocked ? 'bg-danger' : 'bg-primary-bd'} text-white d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold mb-0">
        <i class="bi ${options.isBlocked ? 'bi-shield-slash-fill' : 'bi-exclamation-triangle-fill'} me-2"></i>
        ${options.title}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body p-4">
      ${options.isBlocked ? `
        <div class="alert alert-danger d-flex align-items-center gap-3 mb-0">
          <i class="bi bi-x-circle-fill fs-2"></i>
          <div>${options.message}</div>
        </div>
      ` : `
        <p class="text-secondary mb-0">${options.message}</p>
      `}
    </div>
    <div class="modal-footer bg-light">
      ${options.isBlocked ? `
        <button type="button" class="btn btn-secondary btn-sm px-4" data-bs-dismiss="modal">
          ${isBn ? 'বুঝেছি (বন্ধ করুন)' : 'Dismiss'}
        </button>
      ` : `
        <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">
          ${isBn ? 'বাতিল' : 'Cancel'}
        </button>
        <button type="button" class="btn btn-danger btn-sm px-3" id="btn-modal-confirm-action">
          <i class="bi bi-trash-fill me-1"></i>${isBn ? 'হ্যাঁ, নিশ্চিতভাবে মুছুন' : 'Confirm Delete'}
        </button>
      `}
    </div>
  `;

  if (!options.isBlocked && options.onConfirm) {
    document.getElementById('btn-modal-confirm-action')?.addEventListener('click', () => {
      const modal = getBsModal('cmsConfirmModal');
      if (modal) modal.hide();
      options.onConfirm!();
    });
  }

  const modal = getBsModal('cmsConfirmModal');
  if (modal) modal.show();
}

// Render Main CMS Shell
export function renderCmsDashboard(lang: Language, onExitCms: () => void, onRefresh: () => void): string {
  const isBn = lang === 'bn';
  const t = (k: string) => getTranslation(k, lang);

  // Compute stats
  const totalDivisions = cmsStore.divisions.length;
  const totalDistricts = cmsStore.districts.length;
  const totalSpots = cmsStore.spots.length;
  const totalArticles = cmsStore.articles.length;
  const totalCategories = cmsStore.categories.length;
  const totalMedia = cmsStore.media.length;

  const publishedSpots = cmsStore.spots.filter(s => s.is_published).length;
  const draftSpots = totalSpots - publishedSpots;

  return `
    <div class="cms-container">
      <div class="container">
        <!-- Top CMS Header -->
        <div class="cms-header-card">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-warning text-dark fw-bold px-2 py-1">CMS Admin</span>
                <span class="badge bg-success-subtle text-success border border-success-subtle">
                  <i class="bi bi-shield-check me-1"></i>${isBn ? 'পূর্ণ একসেস সক্রিয়' : 'Full Permissions Active'}
                </span>
              </div>
              <h3 class="fw-bold text-primary-bd mb-1">${t('cms_title')}</h3>
              <p class="text-secondary small mb-0">${t('cms_subtitle')}</p>
            </div>

            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-bd btn-sm rounded-pill px-3" id="cms-exit-btn">
                <i class="bi bi-arrow-left-circle me-1"></i>${t('cms_view_website')}
              </button>
            </div>
          </div>
        </div>

        <!-- Module Navigation Tabs -->
        <div class="cms-nav-tabs">
          <button class="cms-nav-btn ${cmsStore.activeTab === 'overview' ? 'active' : ''}" data-cms-tab="overview">
            <i class="bi bi-speedometer2"></i>${t('cms_tab_overview')}
          </button>
          <button class="cms-nav-btn ${cmsStore.activeTab === 'divisions' ? 'active' : ''}" data-cms-tab="divisions">
            <i class="bi bi-grid-1x2"></i>${t('cms_tab_divisions')} (${totalDivisions})
          </button>
          <button class="cms-nav-btn ${cmsStore.activeTab === 'districts' ? 'active' : ''}" data-cms-tab="districts">
            <i class="bi bi-geo-alt"></i>${t('cms_tab_districts')} (${totalDistricts})
          </button>
          <button class="cms-nav-btn ${cmsStore.activeTab === 'categories' ? 'active' : ''}" data-cms-tab="categories">
            <i class="bi bi-tags"></i>${t('cms_tab_categories')} (${totalCategories})
          </button>
          <button class="cms-nav-btn ${cmsStore.activeTab === 'spots' ? 'active' : ''}" data-cms-tab="spots">
            <i class="bi bi-compass"></i>${t('cms_tab_spots')} (${totalSpots})
          </button>
          <button class="cms-nav-btn ${cmsStore.activeTab === 'articles' ? 'active' : ''}" data-cms-tab="articles">
            <i class="bi bi-journal-text"></i>${t('cms_tab_articles')} (${totalArticles})
          </button>
          <button class="cms-nav-btn ${cmsStore.activeTab === 'media' ? 'active' : ''}" data-cms-tab="media">
            <i class="bi bi-images"></i>${t('cms_tab_media')} (${totalMedia})
          </button>
        </div>

        <!-- Tab Content -->
        <div id="cms-tab-content-area">
          ${renderTabContent(lang, onRefresh)}
        </div>
      </div>
    </div>
  `;
}

// Router for Active Tab
function renderTabContent(lang: Language, onRefresh: () => void): string {
  switch (cmsStore.activeTab) {
    case 'overview':
      return renderOverviewTab(lang);
    case 'divisions':
      return renderDivisionsModule(lang);
    case 'districts':
      return renderDistrictsModule(lang);
    case 'categories':
      return renderCategoriesModule(lang);
    case 'spots':
      return renderTouristSpotsModule(lang);
    case 'articles':
      return renderArticlesModule(lang);
    case 'media':
      return renderMediaModule(lang);
    default:
      return renderOverviewTab(lang);
  }
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================
function renderOverviewTab(lang: Language): string {
  const isBn = lang === 'bn';

  return `
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-lg-3">
        <div class="cms-stat-box d-flex align-items-center gap-3">
          <div class="cms-stat-icon bg-success-subtle text-success">
            <i class="bi bi-grid-fill"></i>
          </div>
          <div>
            <div class="fs-4 fw-bold text-primary-bd">${cmsStore.divisions.length}</div>
            <div class="small text-muted">${isBn ? 'প্রশাসনিক বিভাগ' : 'Divisions'}</div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-lg-3">
        <div class="cms-stat-box d-flex align-items-center gap-3">
          <div class="cms-stat-icon bg-warning-subtle text-warning-emphasis">
            <i class="bi bi-geo-alt-fill"></i>
          </div>
          <div>
            <div class="fs-4 fw-bold text-primary-bd">${cmsStore.districts.length}</div>
            <div class="small text-muted">${isBn ? 'অফিসিয়াল জেলা' : 'Official Districts'}</div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-lg-3">
        <div class="cms-stat-box d-flex align-items-center gap-3">
          <div class="cms-stat-icon bg-info-subtle text-info-emphasis">
            <i class="bi bi-pin-map-fill"></i>
          </div>
          <div>
            <div class="fs-4 fw-bold text-primary-bd">${cmsStore.spots.length}</div>
            <div class="small text-muted">${isBn ? 'দর্শনীয় স্থান' : 'Tourist Spots'}</div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-lg-3">
        <div class="cms-stat-box d-flex align-items-center gap-3">
          <div class="cms-stat-icon bg-primary-subtle text-primary">
            <i class="bi bi-journal-richtext"></i>
          </div>
          <div>
            <div class="fs-4 fw-bold text-primary-bd">${cmsStore.articles.length}</div>
            <div class="small text-muted">${isBn ? 'ভ্রমণ গাইড ও ব্লগ' : 'Travel Guides'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions Banner -->
    <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      <h5 class="fw-bold text-primary-bd mb-3">
        <i class="bi bi-lightning-charge-fill text-warning me-2"></i>
        ${isBn ? 'দ্রুত কনটেন্ট তৈরি ও ম্যানেজমেন্ট অ্যাকশন' : 'Quick Content Management Actions'}
      </h5>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-outline-bd btn-sm py-2 px-3" data-quick-action="add-spot">
          <i class="bi bi-plus-circle me-1"></i>${isBn ? '+ দর্শনীয় স্থান যোগ করুন' : '+ Add Tourist Spot'}
        </button>
        <button class="btn btn-outline-bd btn-sm py-2 px-3" data-quick-action="add-district">
          <i class="bi bi-plus-circle me-1"></i>${isBn ? '+ জেলা যোগ করুন' : '+ Add District'}
        </button>
        <button class="btn btn-outline-bd btn-sm py-2 px-3" data-quick-action="add-division">
          <i class="bi bi-plus-circle me-1"></i>${isBn ? '+ বিভাগ যোগ করুন' : '+ Add Division'}
        </button>
        <button class="btn btn-outline-bd btn-sm py-2 px-3" data-quick-action="add-article">
          <i class="bi bi-plus-circle me-1"></i>${isBn ? '+ ভ্রমণ গাইড লিখুন' : '+ Write Travel Guide'}
        </button>
        <button class="btn btn-outline-bd btn-sm py-2 px-3" data-quick-action="add-media">
          <i class="bi bi-cloud-arrow-up me-1"></i>${isBn ? '+ নতুন ছবি আপলোড' : '+ Upload Image'}
        </button>
        <button class="btn btn-outline-bd btn-sm py-2 px-3" data-quick-action="edit-legal">
          <i class="bi bi-file-earmark-text me-1"></i>${isBn ? 'আইনি পাতা সম্পাদনা ও পর্যালোচনা' : 'Edit & Review Legal Pages'}
        </button>
      </div>
    </div>

    <!-- System & Firestore Live Status -->
    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
          <h6 class="fw-bold text-primary-bd mb-2">
            <i class="bi bi-database-check text-success me-2"></i>
            ${isBn ? 'ক্লাউড ফায়ারস্টোর লাইভ স্ট্যাটাস' : 'Cloud Firestore Database Status'}
          </h6>
          <p class="small text-muted mb-3">
            Firestore Database: <code>ai-studio-bangladeshtouris-f1470a1c-bd36-4ff0-915f-d2c78f8a06c2</code>
          </p>
          <div class="p-3 rounded bg-light border small">
            <div class="d-flex justify-content-between mb-1">
              <span>Divisions in Memory / DB:</span>
              <span class="fw-bold">${cmsStore.divisions.length}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span>Districts in Memory / DB:</span>
              <span class="fw-bold">${cmsStore.districts.length}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span>Tourist Spots in Memory / DB:</span>
              <span class="fw-bold">${cmsStore.spots.length}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span>Media Assets in Storage:</span>
              <span class="fw-bold">${cmsStore.media.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
          <h6 class="fw-bold text-primary-bd mb-2">
            <i class="bi bi-shield-lock-fill text-warning me-2"></i>
            ${isBn ? 'আইনি পাতা ও রিলেশনশিপ নীতি' : 'Legal Review Status & Integrity Policy'}
          </h6>
          <p class="small text-muted mb-3">
            ${isBn 
              ? 'গোপনীয়তা নীতি এবং ব্যবহারের শর্তাবলী প্রকাশের পূর্বে আইনি পর্যালোচনা ও অনুমোদন আবশ্যক। সিএমএস থেকে বাংলা ও ইংরেজি উভয় সংস্করণ সম্পাদনা করা যায়।' 
              : 'Privacy Policy and Terms & Conditions are fully editable in Bengali and English and should be reviewed before formal publication.'}
          </p>
          <div class="d-flex flex-wrap gap-2 mb-3">
            <span class="badge ${cmsStore.legalPages.privacy_reviewed ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'} py-2 px-3">
              <i class="bi ${cmsStore.legalPages.privacy_reviewed ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1"></i>
              ${isBn ? 'গোপনীয়তা নীতি:' : 'Privacy Policy:'}
              ${cmsStore.legalPages.privacy_reviewed ? (isBn ? 'পর্যালোচিত' : 'Reviewed') : (isBn ? 'পর্যালোচনা বাকি' : 'Needs Review')}
            </span>
            <span class="badge ${cmsStore.legalPages.terms_reviewed ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'} py-2 px-3">
              <i class="bi ${cmsStore.legalPages.terms_reviewed ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1"></i>
              ${isBn ? 'ব্যবহারের শর্তাবলী:' : 'Terms:'}
              ${cmsStore.legalPages.terms_reviewed ? (isBn ? 'পর্যালোচিত' : 'Reviewed') : (isBn ? 'পর্যালোচনা বাকি' : 'Needs Review')}
            </span>
          </div>
          <span class="badge bg-success-subtle text-success border border-success-subtle py-2">
            <i class="bi bi-check2-all me-1"></i>Zero-Orphan Architecture Active
          </span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MODULE 1: DIVISION MANAGEMENT
// ============================================================================
function renderDivisionsModule(lang: Language): string {
  const isBn = lang === 'bn';
  const t = (k: string) => getTranslation(k, lang);

  // Search filter
  let list = cmsStore.divisions.filter(d => {
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return d.name_en.toLowerCase().includes(q) || d.name_bn.toLowerCase().includes(q) || d.headquarters_en.toLowerCase().includes(q);
  });

  // Pagination
  const total = list.length;
  const totalPages = Math.ceil(total / cmsStore.itemsPerPage) || 1;
  const page = Math.min(cmsStore.currentPage, totalPages);
  const start = (page - 1) * cmsStore.itemsPerPage;
  const paginated = list.slice(start, start + cmsStore.itemsPerPage);

  return `
    <div class="cms-table-card">
      <div class="cms-table-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="d-flex align-items-center gap-2">
          <input 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="${t('cms_search_records')}" 
            value="${cmsStore.searchQuery}" 
            id="cms-search-input"
            style="min-width: 260px;"
          >
          <span class="badge bg-light text-dark border small">${t('cms_total_records')} ${total}</span>
        </div>

        <button class="btn btn-accent btn-sm px-3" id="cms-btn-add-division">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'নতুন বিভাগ যোগ করুন' : 'Add Division'}
        </button>
      </div>

      <div class="table-responsive">
        <table class="table cms-table table-hover align-middle">
          <thead>
            <tr>
              <th>Image</th>
              <th>English Name</th>
              <th>বাংলা নাম</th>
              <th>Slug</th>
              <th>Headquarters</th>
              <th>Districts</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paginated.length === 0 ? `
              <tr>
                <td colspan="8" class="text-center py-4 text-muted">${t('no_results_title')}</td>
              </tr>
            ` : paginated.map(div => {
              const childDistricts = cmsStore.districts.filter(d => d.division_id === div.id);
              return `
                <tr>
                  <td>
                    <img src="${div.image_url}" class="rounded-2" style="width: 48px; height: 36px; object-fit: cover;" alt="cover">
                  </td>
                  <td class="fw-bold text-primary-bd">${div.name_en}</td>
                  <td>${div.name_bn}</td>
                  <td><code>${div.slug}</code></td>
                  <td>${isBn ? div.headquarters_bn : div.headquarters_en}</td>
                  <td>
                    <span class="badge bg-secondary-bd text-white">${childDistricts.length}</span>
                  </td>
                  <td>
                    <span class="${div.is_published ? 'badge-published' : 'badge-draft'}">
                      <i class="bi ${div.is_published ? 'bi-check-circle' : 'bi-pause-circle'}"></i>
                      ${div.is_published ? t('cms_status_published') : t('cms_status_draft')}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-division="${div.id}" title="${t('cms_edit')}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-division="${div.id}" title="${t('cms_toggle_status')}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-division="${div.id}" title="${t('cms_delete')}">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      ${renderPaginationFooter(page, totalPages, total, lang)}
    </div>
  `;
}

// ============================================================================
// MODULE 2: DISTRICT MANAGEMENT
// ============================================================================
function renderDistrictsModule(lang: Language): string {
  const isBn = lang === 'bn';
  const t = (k: string) => getTranslation(k, lang);

  let list = cmsStore.districts.filter(dist => {
    if (cmsStore.filterDivision !== 'all' && dist.division_id !== cmsStore.filterDivision) {
      return false;
    }
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return dist.name_en.toLowerCase().includes(q) || dist.name_bn.toLowerCase().includes(q) || dist.famous_for_en.toLowerCase().includes(q);
  });

  const total = list.length;
  const totalPages = Math.ceil(total / cmsStore.itemsPerPage) || 1;
  const page = Math.min(cmsStore.currentPage, totalPages);
  const start = (page - 1) * cmsStore.itemsPerPage;
  const paginated = list.slice(start, start + cmsStore.itemsPerPage);

  return `
    <div class="cms-table-card">
      <div class="cms-table-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <input 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="${t('cms_search_records')}" 
            value="${cmsStore.searchQuery}" 
            id="cms-search-input"
            style="min-width: 220px;"
          >
          <select class="form-select form-select-sm" id="cms-filter-division" style="width: auto;">
            <option value="all">${isBn ? 'সকল বিভাগ' : 'All Divisions'}</option>
            ${cmsStore.divisions.map(d => `
              <option value="${d.id}" ${cmsStore.filterDivision === d.id ? 'selected' : ''}>
                ${isBn ? d.name_bn : d.name_en}
              </option>
            `).join('')}
          </select>
          <span class="badge bg-light text-dark border small">${t('cms_total_records')} ${total}</span>
        </div>

        <button class="btn btn-accent btn-sm px-3" id="cms-btn-add-district">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'নতুন জেলা যোগ করুন' : 'Add District'}
        </button>
      </div>

      <div class="table-responsive">
        <table class="table cms-table table-hover align-middle">
          <thead>
            <tr>
              <th>Image</th>
              <th>District (EN)</th>
              <th>জেলা (বাংলা)</th>
              <th>Division</th>
              <th>Famous For</th>
              <th>Coordinates</th>
              <th>Spots</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paginated.length === 0 ? `
              <tr>
                <td colspan="9" class="text-center py-4 text-muted">${t('no_results_title')}</td>
              </tr>
            ` : paginated.map(dist => {
              const div = cmsStore.divisions.find(d => d.id === dist.division_id);
              const spotsCount = cmsStore.spots.filter(s => s.district_id === dist.id).length;
              return `
                <tr>
                  <td>
                    <img src="${dist.image_url}" class="rounded-2" style="width: 44px; height: 32px; object-fit: cover;" alt="thumb">
                  </td>
                  <td class="fw-bold text-primary-bd">${dist.name_en}</td>
                  <td>${dist.name_bn}</td>
                  <td>
                    <span class="badge bg-primary-bd text-white small">${isBn ? div?.name_bn : div?.name_en}</span>
                  </td>
                  <td class="small text-truncate" style="max-width: 160px;">${isBn ? dist.famous_for_bn : dist.famous_for_en}</td>
                  <td class="small text-muted">
                    ${dist.latitude && dist.longitude ? `${dist.latitude.toFixed(2)}, ${dist.longitude.toFixed(2)}` : '<span class="text-muted">N/A</span>'}
                  </td>
                  <td>
                    <span class="badge bg-light text-dark border">${spotsCount}</span>
                  </td>
                  <td>
                    <span class="${dist.is_published ? 'badge-published' : 'badge-draft'}">
                      ${dist.is_published ? t('cms_status_published') : t('cms_status_draft')}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-district="${dist.id}" title="${t('cms_edit')}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-district="${dist.id}" title="${t('cms_toggle_status')}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-district="${dist.id}" title="${t('cms_delete')}">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${renderPaginationFooter(page, totalPages, total, lang)}
    </div>
  `;
}

// ============================================================================
// MODULE 3: CATEGORY MANAGEMENT
// ============================================================================
function renderCategoriesModule(lang: Language): string {
  const isBn = lang === 'bn';
  const t = (k: string) => getTranslation(k, lang);

  let list = cmsStore.categories.filter(c => {
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return c.name_en.toLowerCase().includes(q) || c.name_bn.toLowerCase().includes(q);
  });

  const total = list.length;
  const totalPages = Math.ceil(total / cmsStore.itemsPerPage) || 1;
  const page = Math.min(cmsStore.currentPage, totalPages);
  const start = (page - 1) * cmsStore.itemsPerPage;
  const paginated = list.slice(start, start + cmsStore.itemsPerPage);

  return `
    <div class="cms-table-card">
      <div class="cms-table-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="d-flex align-items-center gap-2">
          <input 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="${t('cms_search_records')}" 
            value="${cmsStore.searchQuery}" 
            id="cms-search-input"
            style="min-width: 240px;"
          >
          <span class="badge bg-light text-dark border small">${t('cms_total_records')} ${total}</span>
        </div>

        <button class="btn btn-accent btn-sm px-3" id="cms-btn-add-category">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'নতুন ক্যাটাগরি যোগ করুন' : 'Add Category'}
        </button>
      </div>

      <div class="table-responsive">
        <table class="table cms-table table-hover align-middle">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Category (EN)</th>
              <th>ক্যাটাগরি (বাংলা)</th>
              <th>Slug</th>
              <th>Spots Count</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paginated.length === 0 ? `
              <tr>
                <td colspan="7" class="text-center py-4 text-muted">${t('no_results_title')}</td>
              </tr>
            ` : paginated.map(cat => {
              const spotsCount = cmsStore.spots.filter(s => s.category_ids && s.category_ids.includes(cat.id)).length;
              return `
                <tr>
                  <td>
                    <span class="fs-5 text-primary-bd"><i class="bi ${cat.icon || 'bi-tag'}"></i></span>
                  </td>
                  <td class="fw-bold text-primary-bd">${cat.name_en}</td>
                  <td>${cat.name_bn}</td>
                  <td><code>${cat.slug}</code></td>
                  <td><span class="badge bg-secondary-bd text-white">${spotsCount}</span></td>
                  <td>
                    <span class="${cat.is_published ? 'badge-published' : 'badge-draft'}">
                      ${cat.is_published ? t('cms_status_published') : t('cms_status_draft')}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-category="${cat.id}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-category="${cat.id}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-category="${cat.id}">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${renderPaginationFooter(page, totalPages, total, lang)}
    </div>
  `;
}

// ============================================================================
// MODULE 4: TOURIST SPOT MANAGEMENT
// ============================================================================
function renderTouristSpotsModule(lang: Language): string {
  const isBn = lang === 'bn';
  const t = (k: string) => getTranslation(k, lang);

  let list = cmsStore.spots.filter(s => {
    if (cmsStore.filterDivision !== 'all' && s.division_id !== cmsStore.filterDivision) {
      return false;
    }
    if (cmsStore.filterCategory !== 'all' && (!s.category_ids || !s.category_ids.includes(cmsStore.filterCategory))) {
      return false;
    }
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return s.name_en.toLowerCase().includes(q) || s.name_bn.toLowerCase().includes(q) || s.short_desc_en.toLowerCase().includes(q);
  });

  const total = list.length;
  const totalPages = Math.ceil(total / cmsStore.itemsPerPage) || 1;
  const page = Math.min(cmsStore.currentPage, totalPages);
  const start = (page - 1) * cmsStore.itemsPerPage;
  const paginated = list.slice(start, start + cmsStore.itemsPerPage);

  return `
    <div class="cms-table-card">
      <div class="cms-table-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <input 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="${t('cms_search_records')}" 
            value="${cmsStore.searchQuery}" 
            id="cms-search-input"
            style="min-width: 200px;"
          >
          <select class="form-select form-select-sm" id="cms-filter-division" style="width: auto;">
            <option value="all">${isBn ? 'সকল বিভাগ' : 'All Divisions'}</option>
            ${cmsStore.divisions.map(d => `
              <option value="${d.id}" ${cmsStore.filterDivision === d.id ? 'selected' : ''}>
                ${isBn ? d.name_bn : d.name_en}
              </option>
            `).join('')}
          </select>
          <select class="form-select form-select-sm" id="cms-filter-category" style="width: auto;">
            <option value="all">${isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
            ${cmsStore.categories.map(c => `
              <option value="${c.id}" ${cmsStore.filterCategory === c.id ? 'selected' : ''}>
                ${isBn ? c.name_bn : c.name_en}
              </option>
            `).join('')}
          </select>
          <span class="badge bg-light text-dark border small">${t('cms_total_records')} ${total}</span>
        </div>

        <button class="btn btn-accent btn-sm px-3" id="cms-btn-add-spot">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'নতুন দর্শনীয় স্থান যোগ করুন' : 'Add Tourist Spot'}
        </button>
      </div>

      <div class="table-responsive">
        <table class="table cms-table table-hover align-middle">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name (EN & BN)</th>
              <th>District & Division</th>
              <th>Categories</th>
              <th>Rating</th>
              <th>Featured</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paginated.length === 0 ? `
              <tr>
                <td colspan="8" class="text-center py-4 text-muted">${t('no_results_title')}</td>
              </tr>
            ` : paginated.map(spot => {
              const div = cmsStore.divisions.find(d => d.id === spot.division_id);
              const dist = cmsStore.districts.find(d => d.id === spot.district_id);
              return `
                <tr>
                  <td>
                    <img src="${spot.image_url}" class="rounded-2" style="width: 48px; height: 36px; object-fit: cover;" alt="cover">
                  </td>
                  <td>
                    <div class="fw-bold text-primary-bd">${spot.name_en}</div>
                    <div class="small text-muted">${spot.name_bn}</div>
                  </td>
                  <td>
                    <div class="small fw-semibold">${isBn ? dist?.name_bn : dist?.name_en}</div>
                    <small class="text-muted">${isBn ? div?.name_bn : div?.name_en}</small>
                  </td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      ${(spot.category_ids || []).map(cid => {
                        const cat = cmsStore.categories.find(c => c.id === cid);
                        return `<span class="badge bg-light text-dark border small">${isBn ? cat?.name_bn : cat?.name_en}</span>`;
                      }).join('')}
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-warning-subtle text-warning-emphasis">
                      <i class="bi bi-star-fill text-warning me-1"></i>${spot.rating}
                    </span>
                  </td>
                  <td>
                    ${spot.is_featured 
                      ? '<span class="badge bg-accent-bd text-dark"><i class="bi bi-check-lg"></i> Featured</span>' 
                      : '<span class="text-muted small">Standard</span>'}
                  </td>
                  <td>
                    <span class="${spot.is_published ? 'badge-published' : 'badge-draft'}">
                      ${spot.is_published ? t('cms_status_published') : t('cms_status_draft')}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-spot="${spot.id}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-spot="${spot.id}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-spot="${spot.id}">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${renderPaginationFooter(page, totalPages, total, lang)}
    </div>
  `;
}

// ============================================================================
// MODULE 5: TRAVEL GUIDE MANAGEMENT
// ============================================================================
function renderArticlesModule(lang: Language): string {
  const isBn = lang === 'bn';
  const t = (k: string) => getTranslation(k, lang);

  let list = cmsStore.articles.filter(a => {
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return a.title_en.toLowerCase().includes(q) || a.title_bn.toLowerCase().includes(q) || a.author_en.toLowerCase().includes(q);
  });

  const total = list.length;
  const totalPages = Math.ceil(total / cmsStore.itemsPerPage) || 1;
  const page = Math.min(cmsStore.currentPage, totalPages);
  const start = (page - 1) * cmsStore.itemsPerPage;
  const paginated = list.slice(start, start + cmsStore.itemsPerPage);

  return `
    <div class="cms-table-card">
      <div class="cms-table-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="d-flex align-items-center gap-2">
          <input 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="${t('cms_search_records')}" 
            value="${cmsStore.searchQuery}" 
            id="cms-search-input"
            style="min-width: 240px;"
          >
          <span class="badge bg-light text-dark border small">${t('cms_total_records')} ${total}</span>
        </div>

        <button class="btn btn-accent btn-sm px-3" id="cms-btn-add-article">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'নতুন ভ্রমণ গাইড তৈরি করুন' : 'Write Travel Guide'}
        </button>
      </div>

      <div class="table-responsive">
        <table class="table cms-table table-hover align-middle">
          <thead>
            <tr>
              <th>Cover</th>
              <th>Article Title</th>
              <th>Author</th>
              <th>Read Time</th>
              <th>Related District</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paginated.length === 0 ? `
              <tr>
                <td colspan="7" class="text-center py-4 text-muted">${t('no_results_title')}</td>
              </tr>
            ` : paginated.map(art => {
              const dist = cmsStore.districts.find(d => d.id === art.related_district_id);
              return `
                <tr>
                  <td>
                    <img src="${art.image_url}" class="rounded-2" style="width: 48px; height: 36px; object-fit: cover;" alt="cover">
                  </td>
                  <td>
                    <div class="fw-bold text-primary-bd">${art.title_en}</div>
                    <div class="small text-muted">${art.title_bn}</div>
                  </td>
                  <td>${isBn ? art.author_bn : art.author_en}</td>
                  <td><span class="badge bg-light text-dark border">${isBn ? art.read_time_bn : art.read_time_en}</span></td>
                  <td>${dist ? (isBn ? dist.name_bn : dist.name_en) : 'All Bangladesh'}</td>
                  <td>
                    <span class="${art.is_published ? 'badge-published' : 'badge-draft'}">
                      ${art.status === 'scheduled' ? t('cms_status_scheduled') : (art.is_published ? t('cms_status_published') : t('cms_status_draft'))}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-article="${art.id}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-article="${art.id}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-article="${art.id}">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${renderPaginationFooter(page, totalPages, total, lang)}
    </div>
  `;
}

// ============================================================================
// MODULE 6: IMAGE MANAGER
// ============================================================================
function renderMediaModule(lang: Language): string {
  const isBn = lang === 'bn';
  const t = (k: string) => getTranslation(k, lang);

  return `
    <!-- Upload Dropzone Card -->
    <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 class="fw-bold text-primary-bd mb-1">
            <i class="bi bi-cloud-arrow-up-fill text-accent-bd me-2"></i>
            ${isBn ? 'ফায়ারবেস স্টোরেজ ও মিডিয়া লাইব্রেরি' : 'Firebase Storage & Media Library'}
          </h5>
          <p class="small text-muted mb-0">
            ${isBn 
              ? 'জেপিজি, পিএনজি, ওয়েবপি ফাইল আপলোড করুন (সর্বোচ্চ সাইজ ৫ মেগাবাইট)। দ্বিভাষিক অল্ট-টেক্সট যোগ করুন।' 
              : 'Upload JPG, PNG, WEBP, SVG files (Max 5MB). Set bilingual alternative text.'}
          </p>
        </div>
      </div>

      <div class="cms-dropzone" id="cms-media-dropzone">
        <i class="bi bi-images text-secondary-bd" style="font-size: 2.75rem;"></i>
        <h6 class="fw-bold text-primary-bd mt-2 mb-1">
          ${isBn ? 'এখানে ছবি ড্র্যাগ ও ড্রপ করুন অথবা ক্লিক করে নির্বাচন করুন' : 'Drag & drop image files here, or click to browse'}
        </h6>
        <p class="small text-muted mb-3">Supported formats: JPG, PNG, WEBP, GIF, SVG (Up to 5MB)</p>
        <input type="file" id="cms-media-file-input" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" class="d-none">
        <button class="btn btn-outline-bd btn-sm px-4" id="cms-media-browse-btn">
          <i class="bi bi-folder2-open me-1"></i>${isBn ? 'ফাইল বেছে নিন' : 'Browse Files'}
        </button>
      </div>
    </div>

    <!-- Media Library Grid -->
    <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
      <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
        <span class="fw-bold text-primary-bd">${isBn ? 'সংরক্ষিত ছবি গ্যালারি' : 'Saved Image Assets'} (${cmsStore.media.length})</span>
        <small class="text-muted">${isBn ? 'যেকোনো ছবির ইউআরএল কপি করতে ক্লিক করুন' : 'Click "Copy URL" to use in destinations'}</small>
      </div>

      <div class="cms-media-grid">
        ${cmsStore.media.map(item => `
          <div class="cms-media-card">
            <img src="${item.url}" class="cms-media-thumb" alt="${item.alt_en}" data-preview-img="${item.url}" title="Click to preview">
            <div class="cms-media-body">
              <div class="small fw-semibold text-truncate text-primary-bd" title="${item.file_name}">${item.file_name}</div>
              <div class="text-muted" style="font-size: 0.75rem;">
                ${(item.file_size / 1024).toFixed(0)} KB • ${new Date(item.uploaded_at).toLocaleDateString()}
              </div>
              <div class="cms-media-actions">
                <button class="btn btn-outline-secondary btn-sm py-0 px-2" style="font-size: 0.75rem;" data-copy-url="${item.url}">
                  <i class="bi bi-link-45deg me-1"></i>Copy URL
                </button>
                <button class="btn btn-outline-danger btn-sm py-0 px-2" style="font-size: 0.75rem;" data-delete-media="${item.id}">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Pagination Component Helper
function renderPaginationFooter(page: number, totalPages: number, total: number, lang: Language): string {
  const isBn = lang === 'bn';
  const t = (k: string) => getTranslation(k, lang);

  return `
    <div class="p-3 border-top bg-light d-flex flex-wrap justify-content-between align-items-center gap-2 small">
      <div class="text-muted">
        ${t('cms_showing_page')} <strong>${page}</strong> / <strong>${totalPages}</strong> (${t('cms_total_records')} ${total})
      </div>
      <div class="d-flex gap-1">
        <button class="btn btn-outline-secondary btn-sm" id="cms-btn-prev" ${page <= 1 ? 'disabled' : ''}>
          <i class="bi bi-chevron-left me-1"></i>${t('cms_prev_page')}
        </button>
        <button class="btn btn-outline-secondary btn-sm" id="cms-btn-next" ${page >= totalPages ? 'disabled' : ''}>
          ${t('cms_next_page')}<i class="bi bi-chevron-right ms-1"></i>
        </button>
      </div>
    </div>
  `;
}
