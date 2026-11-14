/**
 * CMS Views & Interactive UI Components
 * Professional Admin Dashboard Overview + Complete CRUD Management Modules + SEO & Website Settings
 */

import { 
  cmsStore, 
  canWriteAdmin,
  getMediaReferences,
  type CmsTab 
} from './cmsState';

import {
  adminDashboardState,
  type AdminAuditLogEntry,
  type RecentContentUpdateItem
} from '../services/adminDashboardService';

import { ARTICLE_CATEGORIES } from '../data/bangladeshData';

import { getTranslation, type Language } from '../i18n';
import { getVerifiedAdminSession } from '../services/adminAuthService';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';
import { showToast } from '../utils/stateFeedback';

export { showToast };

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
        ${escapeHtml(options.title)}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body p-4">
      ${options.isBlocked ? `
        <div class="alert alert-danger d-flex align-items-center gap-3 mb-0">
          <i class="bi bi-x-circle-fill fs-2"></i>
          <div>${escapeHtml(options.message)}</div>
        </div>
      ` : `
        <p class="text-secondary mb-0">${escapeHtml(options.message)}</p>
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

function formatAdminDate(iso?: string, lang: Language = 'en'): string {
  if (!iso) return lang === 'bn' ? 'তারিখ নেই' : 'No date';
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return lang === 'bn' ? 'তারিখ নেই' : 'No date';
  return new Date(parsed).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatShortDate(iso?: string, lang: Language = 'en'): string {
  if (!iso) return '—';
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return '—';
  return new Date(parsed).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getTabMeta(tab: CmsTab, lang: Language): { title: string; subtitle: string } {
  const isBn = lang === 'bn';
  switch (tab) {
    case 'overview':
      return {
        title: isBn ? 'অ্যাডমিন ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview',
        subtitle: isBn
          ? 'ফায়ারস্টোর ডাটাবেসের রিয়েল-টাইম পরিসংখ্যান, সাম্প্রতিক পরিবর্তন ও কনটেন্ট অবস্থা'
          : 'Live Firestore database metrics, publication status, and recent editorial updates'
      };
    case 'divisions':
      return {
        title: isBn ? 'বিভাগ ব্যবস্থাপনা' : 'Divisions',
        subtitle: isBn ? 'বাংলাদেশের প্রশাসনিক বিভাগসমূহ তৈরি ও সম্পাদনা করুন' : 'Manage administrative divisions across Bangladesh'
      };
    case 'districts':
      return {
        title: isBn ? 'জেলা ব্যবস্থাপনা' : 'Districts',
        subtitle: isBn ? '৬৪ জেলার বিবরণ, ভৌগোলিক অবস্থান ও এসইও তথ্য পরিচালনা করুন' : 'Manage district profiles, coordinates, and metadata'
      };
    case 'categories':
      return {
        title: isBn ? 'ক্যাটাগরি ব্যবস্থাপনা' : 'Categories',
        subtitle: isBn ? 'পর্যটন আকর্ষণের ধরন ও শ্রেণিবিন্যাস পরিচালনা করুন' : 'Organize tourism categories and discovery filters'
      };
    case 'spots':
      return {
        title: isBn ? 'দর্শনীয় স্থানসমূহ' : 'Tourist Spots',
        subtitle: isBn ? 'দর্শনীয় স্থানের তথ্য, ভ্রমণ নির্দেশনা ও প্রকাশনা অবস্থা পরিচালনা করুন' : 'Curate, publish, or draft tourist destinations'
      };
    case 'articles':
      return {
        title: isBn ? 'ভ্রমণ গাইড ও নিবন্ধ' : 'Travel Guides',
        subtitle: isBn ? 'দ্বিভাষিক ভ্রমণ নির্দেশিকা, গল্প ও সময়সূচি পরিচালনা করুন' : 'Manage bilingual travel guides, itineraries, and publication status'
      };
    case 'media':
      return {
        title: isBn ? 'ইমেজ ম্যানেজার' : 'Image Manager',
        subtitle: isBn ? 'ফায়ারবেস স্টোরেজ ও মিডিয়া সম্পদ আপলোড এবং পরিচালনা করুন' : 'Upload and organize destination photography and assets'
      };
    case 'seo-settings':
      return {
        title: isBn ? 'এসইও সেটিংস' : 'SEO Settings',
        subtitle: isBn ? 'মেটা শিরোনাম, বিবরণ, ক্যানোনিকাল ইউআরএল ও ইন্ডেক্সিং কনফিগারেশন' : 'Configure global search engine metadata, Open Graph, and indexing defaults'
      };
    case 'website-settings':
      return {
        title: isBn ? 'ওয়েবসাইট সেটিংস' : 'Website Settings',
        subtitle: isBn ? 'পোর্টালের সাধারণ পরিচিতি, হেল্পলাইন ও আইনি নথি পরিচালনা করুন' : 'Configure portal branding, contact info, language defaults, and legal pages'
      };
  }
}

// Render Main Responsive Admin Workspace Shell
export function renderCmsDashboard(lang: Language, _onExitCms: () => void, onRefresh: () => void): string {
  const isBn = lang === 'bn';
  const session = getVerifiedAdminSession();

  if (!canWriteAdmin() || !session) {
    return '';
  }

  const activeTab = cmsStore.activeTab;
  const meta = getTabMeta(activeTab, lang);
  const loadedStats = adminDashboardState.status === 'loaded' ? adminDashboardState.stats : null;

  const navItems: Array<{
    tab: CmsTab;
    icon: string;
    labelEn: string;
    labelBn: string;
    count?: number | null;
  }> = [
    { tab: 'overview', icon: 'bi-speedometer2', labelEn: 'Dashboard', labelBn: 'ড্যাশবোর্ড' },
    { tab: 'divisions', icon: 'bi-grid-1x2', labelEn: 'Divisions', labelBn: 'বিভাগসমূহ', count: loadedStats?.totalDivisions ?? null },
    { tab: 'districts', icon: 'bi-geo-alt', labelEn: 'Districts', labelBn: 'জেলাসমূহ', count: loadedStats?.totalDistricts ?? null },
    { tab: 'categories', icon: 'bi-tags', labelEn: 'Categories', labelBn: 'ক্যাটাগরি', count: loadedStats?.totalCategories ?? null },
    { tab: 'spots', icon: 'bi-compass', labelEn: 'Tourist Spots', labelBn: 'দর্শনীয় স্থান', count: loadedStats?.totalSpots ?? null },
    { tab: 'articles', icon: 'bi-journal-text', labelEn: 'Travel Guides', labelBn: 'ভ্রমণ গাইড', count: loadedStats?.totalArticles ?? null },
    { tab: 'media', icon: 'bi-images', labelEn: 'Image Manager', labelBn: 'ইমেজ ম্যানেজার', count: loadedStats?.totalMedia ?? null }
  ];

  const settingsItems: Array<{
    tab: CmsTab;
    icon: string;
    labelEn: string;
    labelBn: string;
  }> = [
    { tab: 'seo-settings', icon: 'bi-search', labelEn: 'SEO Settings', labelBn: 'এসইও সেটিংস' },
    { tab: 'website-settings', icon: 'bi-sliders', labelEn: 'Website Settings', labelBn: 'ওয়েবসাইট সেটিংস' }
  ];

  return `
    <div class="admin-workspace" id="admin-workspace">
      <div class="admin-sidebar-backdrop" id="admin-sidebar-backdrop" aria-hidden="true"></div>

      <!-- Responsive Left Sidebar -->
      <aside class="admin-sidebar" id="admin-sidebar" aria-label="${isBn ? 'অ্যাডমিন নেভিগেশন' : 'Admin Navigation'}">
        <div class="admin-sidebar-header">
          <a href="/admin/dashboard/" class="admin-sidebar-brand text-decoration-none" data-cms-tab="overview">
            <span class="admin-sidebar-logo">
              <i class="bi bi-compass-fill"></i>
            </span>
            <span class="min-w-0">
              <span class="d-block fw-bold text-white text-truncate" style="font-size: 0.98rem;">
                ${isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh'}
              </span>
              <span class="d-block text-white-50 text-truncate" style="font-size: 0.76rem;">
                ${isBn ? 'অ্যাডমিন কনসোল' : 'Admin Console'}
              </span>
            </span>
          </a>
          <button
            type="button"
            class="btn btn-sm text-white-50 d-lg-none admin-sidebar-close"
            id="admin-sidebar-close-btn"
            aria-label="${isBn ? 'মেনু বন্ধ করুন' : 'Close navigation menu'}"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <nav class="admin-sidebar-nav" aria-label="${isBn ? 'প্রধান বিভাগ' : 'Content & Operations'}">
          <div class="admin-sidebar-section-label">
            ${isBn ? 'কনটেন্ট ম্যানেজমেন্ট' : 'Content Management'}
          </div>
          ${navItems
            .map(
              item => `
            <button
              type="button"
              class="admin-nav-link ${activeTab === item.tab ? 'active' : ''}"
              data-cms-tab="${item.tab}"
            >
              <span class="admin-nav-link-inner">
                <i class="bi ${item.icon}" aria-hidden="true"></i>
                <span class="text-truncate">${isBn ? item.labelBn : item.labelEn}</span>
              </span>
              ${
                item.count !== undefined && item.count !== null
                  ? `<span class="admin-nav-count tabular-nums">${item.count}</span>`
                  : ''
              }
            </button>
          `
            )
            .join('')}

          <div class="admin-sidebar-divider"></div>
          <div class="admin-sidebar-section-label">
            ${isBn ? 'কনফিগারেশন' : 'Configuration'}
          </div>
          ${settingsItems
            .map(
              item => `
            <button
              type="button"
              class="admin-nav-link ${activeTab === item.tab ? 'active' : ''}"
              data-cms-tab="${item.tab}"
            >
              <span class="admin-nav-link-inner">
                <i class="bi ${item.icon}" aria-hidden="true"></i>
                <span class="text-truncate">${isBn ? item.labelBn : item.labelEn}</span>
              </span>
            </button>
          `
            )
            .join('')}

          <div class="admin-sidebar-divider"></div>
          <button type="button" class="admin-nav-link admin-nav-logout" id="cms-signout-btn">
            <span class="admin-nav-link-inner">
              <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
              <span>${isBn ? 'লগআউট' : 'Logout'}</span>
            </span>
          </button>
        </nav>

        <div class="admin-sidebar-footer">
          <div class="admin-sidebar-user mb-2">
            <div class="small text-white-50">${isBn ? 'প্রবেশকৃত অ্যাডমিন' : 'Signed in as'}</div>
            <div class="small fw-semibold text-white text-truncate" title="${escapeHtml(session.email || '')}">
              ${escapeHtml(session.email || 'Administrator')}
            </div>
          </div>
          <button type="button" class="btn btn-sm w-100 admin-public-site-btn" id="cms-exit-btn">
            <i class="bi bi-box-arrow-up-right me-1"></i>${isBn ? 'পাবলিক পোর্টাল দেখুন' : 'View Public Site'}
          </button>
        </div>
      </aside>

      <!-- Main Admin Content Shell -->
      <div class="admin-main-shell">
        <header class="admin-topbar">
          <div class="d-flex align-items-center gap-3 min-w-0">
            <button
              type="button"
              class="btn btn-outline-secondary d-lg-none admin-mobile-menu-btn"
              id="admin-sidebar-toggle-btn"
              aria-label="${isBn ? 'নেভিগেশন খুলুন' : 'Open navigation menu'}"
              aria-controls="admin-sidebar"
              aria-expanded="false"
            >
              <i class="bi bi-list fs-5"></i>
            </button>
            <div class="min-w-0">
              <nav aria-label="breadcrumb" class="admin-breadcrumb text-truncate">
                <span>${isBn ? 'অ্যাডমিন' : 'Admin'}</span>
                <span class="mx-1 text-muted" aria-hidden="true">/</span>
                <span class="fw-semibold text-primary-bd">${escapeHtml(meta.title)}</span>
              </nav>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2 shrink-0">
            ${
              adminDashboardState.lastSyncedAt
                ? `<span class="d-none d-xl-inline small text-muted tabular-nums me-2">
                     ${isBn ? 'সর্বশেষ সিঙ্ক:' : 'Synced:'} ${escapeHtml(formatAdminDate(adminDashboardState.lastSyncedAt, lang))}
                   </span>`
                : ''
            }
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm text-nowrap"
              id="admin-refresh-dashboard-btn"
              ${adminDashboardState.status === 'loading' ? 'disabled' : ''}
            >
              <i class="bi bi-arrow-clockwise ${adminDashboardState.status === 'loading' ? 'spin-icon' : ''} me-1"></i>
              <span class="d-none d-sm-inline">${isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm text-nowrap"
              id="admin-lang-toggle-btn"
            >
              ${isBn ? 'English' : 'বাংলা'}
            </button>
          </div>
        </header>

        <main class="admin-workspace-content">
          <div class="admin-page-heading mb-4">
            <h1 class="h4 fw-bold text-primary-bd mb-1">${escapeHtml(meta.title)}</h1>
            <p class="text-muted small mb-0">${escapeHtml(meta.subtitle)}</p>
          </div>

          <div id="cms-tab-content-area">
            ${renderTabContent(lang, onRefresh)}
          </div>
        </main>
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
    case 'seo-settings':
      return renderSeoSettingsModule(lang);
    case 'website-settings':
      return renderWebsiteSettingsModule(lang);
    default:
      return renderOverviewTab(lang);
  }
}

// ============================================================================
// OVERVIEW TAB (REAL FIRESTORE STATS, LOADING, ERROR & OPERATIONAL TABLES)
// ============================================================================
function renderOverviewLoadingSkeleton(): string {
  return `
    <div class="row g-3 mb-4" aria-busy="true" aria-label="Loading dashboard statistics">
      ${Array.from({ length: 8 })
        .map(
          () => `
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="admin-kpi-card">
            <div class="admin-skeleton admin-skeleton-sm mb-3" style="width: 48%;"></div>
            <div class="admin-skeleton admin-skeleton-lg mb-2" style="width: 36%;"></div>
            <div class="admin-skeleton admin-skeleton-xs" style="width: 70%;"></div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    <div class="row g-4">
      <div class="col-12 col-xl-6">
        <div class="admin-panel-card p-4">
          <div class="admin-skeleton admin-skeleton-sm mb-3" style="width: 45%;"></div>
          ${Array.from({ length: 4 })
            .map(() => `<div class="admin-skeleton admin-skeleton-row mb-2"></div>`)
            .join('')}
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="admin-panel-card p-4">
          <div class="admin-skeleton admin-skeleton-sm mb-3" style="width: 45%;"></div>
          ${Array.from({ length: 4 })
            .map(() => `<div class="admin-skeleton admin-skeleton-row mb-2"></div>`)
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function renderOverviewErrorState(lang: Language, errorMessage: string): string {
  const isBn = lang === 'bn';
  return `
    <div class="admin-panel-card p-4 p-md-5 text-center" role="alert">
      <div class="admin-error-icon mx-auto mb-3">
        <i class="bi bi-exclamation-triangle-fill"></i>
      </div>
      <h2 class="h5 fw-bold text-primary-bd mb-2">
        ${isBn ? 'ফায়ারস্টোর পরিসংখ্যান লোড করা যায়নি' : 'Unable to Fetch Firestore Statistics'}
      </h2>
      <p class="text-muted small mx-auto mb-4" style="max-width: 520px;">
        ${escapeHtml(errorMessage)}
      </p>
      <div class="d-flex justify-content-center gap-2 flex-wrap">
        <button type="button" class="btn btn-primary-bd px-4" id="admin-dashboard-retry-btn">
          <i class="bi bi-arrow-clockwise me-2"></i>${isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry Firestore Sync'}
        </button>
      </div>
    </div>
  `;
}

function renderOverviewTab(lang: Language): string {
  const isBn = lang === 'bn';

  if (adminDashboardState.status === 'idle' || adminDashboardState.status === 'loading') {
    return renderOverviewLoadingSkeleton();
  }

  if (adminDashboardState.status === 'error' || !adminDashboardState.stats) {
    return renderOverviewErrorState(
      lang,
      adminDashboardState.errorMessage ||
        (isBn
          ? 'ক্লাউড ফায়ারস্টোর থেকে তথ্য সংগ্রহের সময় একটি ত্রুটি হয়েছে।'
          : 'An unexpected error occurred while reading live metrics from Cloud Firestore.')
    );
  }

  const stats = adminDashboardState.stats;
  const spotPublishedPct =
    stats.totalSpots > 0 ? Math.round((stats.publishedSpots / stats.totalSpots) * 100) : 0;
  const articlePublishedPct =
    stats.totalArticles > 0 ? Math.round((stats.publishedArticles / stats.totalArticles) * 100) : 0;

  const kpiCards: Array<{
    label: string;
    value: number;
    meta: string;
    tab: CmsTab;
    tone: 'neutral' | 'success' | 'warning';
  }> = [
    {
      label: isBn ? 'মোট বিভাগ' : 'Total Divisions',
      value: stats.totalDivisions,
      meta: isBn
        ? `${stats.publishedDivisions} প্রকাশিত · ${stats.draftDivisions} খসড়া`
        : `${stats.publishedDivisions} published · ${stats.draftDivisions} draft`,
      tab: 'divisions',
      tone: 'neutral'
    },
    {
      label: isBn ? 'মোট জেলা' : 'Total Districts',
      value: stats.totalDistricts,
      meta: isBn
        ? `${stats.publishedDistricts} প্রকাশিত · ${stats.draftDistricts} খসড়া`
        : `${stats.publishedDistricts} published · ${stats.draftDistricts} draft`,
      tab: 'districts',
      tone: 'neutral'
    },
    {
      label: isBn ? 'মোট দর্শনীয় স্থান' : 'Total Tourist Spots',
      value: stats.totalSpots,
      meta: isBn
        ? `${stats.totalCategories}টি ক্যাটাগরিতে বিন্যস্ত`
        : `Across ${stats.totalCategories} categories`,
      tab: 'spots',
      tone: 'neutral'
    },
    {
      label: isBn ? 'প্রকাশিত দর্শনীয় স্থান' : 'Published Tourist Spots',
      value: stats.publishedSpots,
      meta: isBn ? `মোট স্থানের ${spotPublishedPct}%` : `${spotPublishedPct}% of total spots`,
      tab: 'spots',
      tone: 'success'
    },
    {
      label: isBn ? 'খসড়া দর্শনীয় স্থান' : 'Draft Tourist Spots',
      value: stats.draftSpots,
      meta: isBn ? 'প্রকাশনার অপেক্ষায়' : 'Pending editorial review',
      tab: 'spots',
      tone: stats.draftSpots > 0 ? 'warning' : 'neutral'
    },
    {
      label: isBn ? 'মোট নিবন্ধ ও গাইড' : 'Total Articles',
      value: stats.totalArticles,
      meta: isBn
        ? `${stats.draftArticles} খসড়া · ${stats.scheduledArticles} নির্ধারিত`
        : `${stats.draftArticles} draft · ${stats.scheduledArticles} scheduled`,
      tab: 'articles',
      tone: 'neutral'
    },
    {
      label: isBn ? 'প্রকাশিত নিবন্ধ' : 'Published Articles',
      value: stats.publishedArticles,
      meta: isBn ? `মোট নিবন্ধের ${articlePublishedPct}%` : `${articlePublishedPct}% live on portal`,
      tab: 'articles',
      tone: 'success'
    },
    {
      label: isBn ? 'মিডিয়া লাইব্রেরি' : 'Media Assets',
      value: stats.totalMedia,
      meta: isBn ? 'ফায়ারস্টোর নিবন্ধিত ছবি' : 'Registered image records',
      tab: 'media',
      tone: 'neutral'
    }
  ];

  const statusRows = [
    {
      label: isBn ? 'প্রশাসনিক বিভাগ' : 'Divisions',
      total: stats.totalDivisions,
      published: stats.publishedDivisions,
      draft: stats.draftDivisions,
      tab: 'divisions' as CmsTab
    },
    {
      label: isBn ? 'জেলা সমূহ' : 'Districts',
      total: stats.totalDistricts,
      published: stats.publishedDistricts,
      draft: stats.draftDistricts,
      tab: 'districts' as CmsTab
    },
    {
      label: isBn ? 'ক্যাটাগরি' : 'Categories',
      total: stats.totalCategories,
      published: stats.publishedCategories,
      draft: stats.totalCategories - stats.publishedCategories,
      tab: 'categories' as CmsTab
    },
    {
      label: isBn ? 'দর্শনীয় স্থান' : 'Tourist Spots',
      total: stats.totalSpots,
      published: stats.publishedSpots,
      draft: stats.draftSpots,
      tab: 'spots' as CmsTab
    },
    {
      label: isBn ? 'ভ্রমণ গাইড ও নিবন্ধ' : 'Travel Articles',
      total: stats.totalArticles,
      published: stats.publishedArticles,
      draft: stats.draftArticles + stats.scheduledArticles,
      tab: 'articles' as CmsTab
    }
  ];

  const recentSpots = adminDashboardState.recentSpots;
  const recentUpdates = adminDashboardState.recentUpdates;
  const recentActivity = adminDashboardState.recentActivity;

  return `
    <!-- Real Firestore KPI Statistics Grid -->
    <section aria-label="${isBn ? 'ফায়ারস্টোর পরিসংখ্যান' : 'Firestore Statistics'}" class="mb-4">
      <div class="row g-3">
        ${kpiCards
          .map(
            card => `
          <div class="col-12 col-sm-6 col-xl-3">
            <button type="button" class="admin-kpi-card text-start w-100" data-cms-tab="${card.tab}">
              <div class="admin-kpi-label">${escapeHtml(card.label)}</div>
              <div class="admin-kpi-value tabular-nums ${
                card.tone === 'success' ? 'text-success' : card.tone === 'warning' ? 'text-warning-emphasis' : 'text-primary-bd'
              }">
                ${card.value}
              </div>
              <div class="admin-kpi-meta tabular-nums">${escapeHtml(card.meta)}</div>
            </button>
          </div>
        `
          )
          .join('')}
      </div>
    </section>

    <!-- Quick Action Buttons -->
    <section class="admin-panel-card p-3 p-md-4 mb-4" aria-label="${isBn ? 'দ্রুত কার্যক্রম' : 'Quick Actions'}">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 class="h6 fw-bold text-primary-bd mb-0">
          ${isBn ? 'দ্রুত কনটেন্ট ও কনফিগারেশন অ্যাকশন' : 'Quick Actions'}
        </h2>
        <span class="small text-muted">
          ${isBn ? 'সরাসরি নতুন রেকর্ড বা সেটিংস খুলুন' : 'Create records or open configuration'}
        </span>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-primary-bd btn-sm px-3 text-nowrap" data-quick-action="add-spot">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'দর্শনীয় স্থান যোগ' : 'Add Tourist Spot'}
        </button>
        <button type="button" class="btn btn-outline-bd btn-sm px-3 text-nowrap" data-quick-action="add-district">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'জেলা যোগ' : 'Add District'}
        </button>
        <button type="button" class="btn btn-outline-bd btn-sm px-3 text-nowrap" data-quick-action="add-division">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'বিভাগ যোগ' : 'Add Division'}
        </button>
        <button type="button" class="btn btn-outline-bd btn-sm px-3 text-nowrap" data-quick-action="add-article">
          <i class="bi bi-pencil-square me-1"></i>${isBn ? 'ভ্রমণ গাইড লিখুন' : 'Write Travel Guide'}
        </button>
        <button type="button" class="btn btn-outline-bd btn-sm px-3 text-nowrap" data-quick-action="add-media">
          <i class="bi bi-cloud-arrow-up me-1"></i>${isBn ? 'ছবি আপলোড' : 'Upload Image'}
        </button>
        <button type="button" class="btn btn-outline-secondary btn-sm px-3 text-nowrap" data-cms-tab="seo-settings">
          <i class="bi bi-search me-1"></i>${isBn ? 'এসইও সেটিংস' : 'SEO Settings'}
        </button>
        <button type="button" class="btn btn-outline-secondary btn-sm px-3 text-nowrap" data-cms-tab="website-settings">
          <i class="bi bi-sliders me-1"></i>${isBn ? 'ওয়েবসাইট সেটিংস' : 'Website Settings'}
        </button>
        <button type="button" class="btn btn-outline-secondary btn-sm px-3 text-nowrap" data-quick-action="edit-legal">
          <i class="bi bi-file-earmark-text me-1"></i>${isBn ? 'আইনি পাতা' : 'Legal Pages'}
        </button>
      </div>
    </section>

    <!-- Content Status Overview + Legal Compliance -->
    <section class="row g-4 mb-4">
      <div class="col-12 col-xl-8">
        <div class="admin-panel-card h-100 overflow-hidden">
          <div class="admin-panel-header">
            <h2 class="h6 fw-bold text-primary-bd mb-0">
              ${isBn ? 'কনটেন্ট স্ট্যাটাস ওভারভিউ' : 'Content Status Overview'}
            </h2>
            <span class="small text-muted">${isBn ? 'লাইভ ফায়ারস্টোর ডাটা' : 'Live Firestore counts'}</span>
          </div>
          <div class="table-responsive">
            <table class="table admin-data-table align-middle mb-0">
              <thead>
                <tr>
                  <th>${isBn ? 'সংগ্রহ / মডিউল' : 'Collection'}</th>
                  <th class="text-end">${isBn ? 'মোট' : 'Total'}</th>
                  <th class="text-end">${isBn ? 'প্রকাশিত' : 'Published'}</th>
                  <th class="text-end">${isBn ? 'খসড়া' : 'Draft / Pending'}</th>
                  <th style="min-width: 150px;">${isBn ? 'প্রকাশনার হার' : 'Coverage'}</th>
                </tr>
              </thead>
              <tbody>
                ${statusRows
                  .map(row => {
                    const pct = row.total > 0 ? Math.round((row.published / row.total) * 100) : 0;
                    return `
                    <tr>
                      <td>
                        <button type="button" class="btn btn-link p-0 text-decoration-none fw-semibold text-primary-bd" data-cms-tab="${row.tab}">
                          ${escapeHtml(row.label)}
                        </button>
                      </td>
                      <td class="text-end fw-semibold tabular-nums">${row.total}</td>
                      <td class="text-end text-success fw-semibold tabular-nums">${row.published}</td>
                      <td class="text-end text-muted tabular-nums">${row.draft}</td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="progress flex-grow-1" style="height: 6px; background-color: #e8ece8;">
                            <div
                              class="progress-bar bg-success"
                              role="progressbar"
                              style="width: ${pct}%"
                              aria-valuenow="${pct}"
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <span class="small text-muted tabular-nums" style="min-width: 36px; text-align: right;">${pct}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-4">
        <div class="admin-panel-card h-100 p-4 d-flex flex-column justify-content-between">
          <div>
            <h2 class="h6 fw-bold text-primary-bd mb-2">
              ${isBn ? 'পোর্টাল কনফিগারেশন ও অনুমোদন' : 'Site Governance & Settings'}
            </h2>
            <p class="small text-muted mb-3">
              ${
                isBn
                  ? 'আইনি নথি, অনুসন্ধান ইঞ্জিন ইন্ডেক্সিং এবং মূল পোর্টালের অবস্থা।'
                  : 'Current legal review flags, search indexing mode, and portal availability.'
              }
            </p>

            <div class="admin-kv-list">
              <div class="admin-kv-row">
                <span class="text-muted small">${isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</span>
                <span class="${cmsStore.legalPages.privacy_reviewed ? 'badge-published' : 'badge-draft'}">
                  <i class="bi ${cmsStore.legalPages.privacy_reviewed ? 'bi-check-circle' : 'bi-clock'}"></i>
                  ${cmsStore.legalPages.privacy_reviewed ? (isBn ? 'পর্যালোচিত' : 'Reviewed') : (isBn ? 'পর্যালোচনা বাকি' : 'Needs Review')}
                </span>
              </div>
              <div class="admin-kv-row">
                <span class="text-muted small">${isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms & Conditions'}</span>
                <span class="${cmsStore.legalPages.terms_reviewed ? 'badge-published' : 'badge-draft'}">
                  <i class="bi ${cmsStore.legalPages.terms_reviewed ? 'bi-check-circle' : 'bi-clock'}"></i>
                  ${cmsStore.legalPages.terms_reviewed ? (isBn ? 'পর্যালোচিত' : 'Reviewed') : (isBn ? 'পর্যালোচনা বাকি' : 'Needs Review')}
                </span>
              </div>
              <div class="admin-kv-row">
                <span class="text-muted small">${isBn ? 'সার্চ ইন্ডেক্সিং' : 'Search Indexing'}</span>
                <span class="small fw-semibold font-mono text-primary-bd">
                  ${escapeHtml(adminDashboardState.seoSettings.robots_index)}
                </span>
              </div>
              <div class="admin-kv-row">
                <span class="text-muted small">${isBn ? 'রক্ষণাবেক্ষণ মোড' : 'Maintenance Mode'}</span>
                <span class="small fw-semibold ${adminDashboardState.websiteSettings.maintenance_mode ? 'text-warning-emphasis' : 'text-success'}">
                  ${
                    adminDashboardState.websiteSettings.maintenance_mode
                      ? (isBn ? 'সক্রিয়' : 'Enabled')
                      : (isBn ? 'লাইভ (স্বাভাবিক)' : 'Live')
                  }
                </span>
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-3 pt-3 border-top">
            <button type="button" class="btn btn-outline-bd btn-sm flex-grow-1" data-quick-action="edit-legal">
              ${isBn ? 'আইনি নথি সম্পাদনা' : 'Edit Legal Pages'}
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" data-cms-tab="website-settings">
              ${isBn ? 'সেটিংস' : 'Settings'}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Recently Added Tourist Spots & Recent Content Updates -->
    <section class="row g-4 mb-4">
      <div class="col-12 col-xl-6">
        <div class="admin-panel-card h-100 overflow-hidden">
          <div class="admin-panel-header">
            <h2 class="h6 fw-bold text-primary-bd mb-0">
              ${isBn ? 'সাম্প্রতিক যোগ করা দর্শনীয় স্থান' : 'Recently Added Tourist Spots'}
            </h2>
            <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold" data-cms-tab="spots">
              ${isBn ? 'সকল দেখুন' : 'View All'}
            </button>
          </div>
          ${
            recentSpots.length === 0
              ? `
            <div class="p-4 text-center">
              <p class="text-muted small mb-3">
                ${isBn ? 'ফায়ারস্টোরে এখনো কোনো দর্শনীয় স্থান যুক্ত হয়নি।' : 'No tourist spots found in Firestore yet.'}
              </p>
              <button type="button" class="btn btn-primary-bd btn-sm" data-quick-action="add-spot">
                <i class="bi bi-plus-lg me-1"></i>${isBn ? 'প্রথম দর্শনীয় স্থান যোগ করুন' : 'Add First Tourist Spot'}
              </button>
            </div>
          `
              : `
            <div class="table-responsive">
              <table class="table admin-data-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>${isBn ? 'স্থান' : 'Destination'}</th>
                    <th>${isBn ? 'অবস্থান' : 'Location'}</th>
                    <th>${isBn ? 'অবস্থা' : 'Status'}</th>
                    <th class="text-end">${isBn ? 'তারিখ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentSpots
                    .map(spot => {
                      const dist = cmsStore.districts.find(d => d.id === spot.district_id);
                      const div = cmsStore.divisions.find(d => d.id === spot.division_id);
                      const spotDate = spot.created_at || spot.updated_at;
                      return `
                      <tr>
                        <td>
                          <button type="button" class="btn btn-link p-0 text-start text-decoration-none fw-semibold text-primary-bd" data-overview-edit-spot="${escapeHtml(spot.id)}">
                            ${escapeHtml(isBn ? spot.name_bn || spot.name_en : spot.name_en || spot.name_bn)}
                          </button>
                          <div class="small text-muted tabular-nums">
                            ${typeof spot.rating === 'number' ? `${spot.rating.toFixed(1)} ★` : '—'}
                          </div>
                        </td>
                        <td class="small text-muted">
                          ${escapeHtml((isBn ? dist?.name_bn : dist?.name_en) || spot.district_id)}
                          <span aria-hidden="true">·</span>
                          ${escapeHtml((isBn ? div?.name_bn : div?.name_en) || spot.division_id)}
                        </td>
                        <td>
                          <span class="${spot.is_published ? 'badge-published' : 'badge-draft'}">
                            <i class="bi ${spot.is_published ? 'bi-check-circle' : 'bi-pause-circle'}"></i>
                            ${spot.is_published ? (isBn ? 'প্রকাশিত' : 'Published') : (isBn ? 'খসড়া' : 'Draft')}
                          </span>
                        </td>
                        <td class="text-end small text-muted tabular-nums text-nowrap">
                          ${escapeHtml(formatShortDate(spotDate, lang))}
                        </td>
                      </tr>
                    `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div class="admin-panel-card h-100 overflow-hidden">
          <div class="admin-panel-header">
            <h2 class="h6 fw-bold text-primary-bd mb-0">
              ${isBn ? 'সাম্প্রতিক কনটেন্ট হালনাগাদ' : 'Recent Content Updates'}
            </h2>
            <span class="small text-muted">${isBn ? 'সর্বশেষ সম্পাদিত' : 'By timestamp'}</span>
          </div>
          ${
            recentUpdates.length === 0
              ? `
            <div class="p-4 text-center">
              <p class="text-muted small mb-0">
                ${
                  isBn
                    ? 'ফায়ারস্টোর ডকুমেন্টে এখনো কোনো হালনাগাদ টাইমস্ট্যাম্প পাওয়া যায়নি।'
                    : 'No timestamped content updates recorded in Firestore yet.'
                }
              </p>
            </div>
          `
              : `
            <div class="table-responsive">
              <table class="table admin-data-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>${isBn ? 'কনটেন্ট' : 'Item'}</th>
                    <th>${isBn ? 'ধরন' : 'Type'}</th>
                    <th>${isBn ? 'অবস্থা' : 'Status'}</th>
                    <th class="text-end">${isBn ? 'হালনাগাদ' : 'Updated'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentUpdates
                    .map(item => {
                      const typeLabel = formatEntityKindLabel(item.entityType, lang);
                      const statusBadge =
                        item.status === 'published'
                          ? `<span class="badge-published"><i class="bi bi-check-circle"></i>${isBn ? 'প্রকাশিত' : 'Published'}</span>`
                          : item.status === 'scheduled'
                            ? `<span class="badge-draft"><i class="bi bi-calendar-event"></i>${isBn ? 'নির্ধারিত' : 'Scheduled'}</span>`
                            : `<span class="badge-draft"><i class="bi bi-pause-circle"></i>${isBn ? 'খসড়া' : 'Draft'}</span>`;
                      return `
                      <tr>
                        <td>
                          <button type="button" class="btn btn-link p-0 text-start text-decoration-none fw-semibold text-primary-bd" data-cms-tab="${item.targetTab}">
                            ${escapeHtml(isBn ? item.titleBn || item.titleEn : item.titleEn || item.titleBn)}
                          </button>
                        </td>
                        <td class="small text-muted text-nowrap">${escapeHtml(typeLabel)}</td>
                        <td>${statusBadge}</td>
                        <td class="text-end small text-muted tabular-nums text-nowrap">
                          ${escapeHtml(formatShortDate(item.timestamp, lang))}
                        </td>
                      </tr>
                    `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>
      </div>
    </section>

    <!-- Recent Administrative Activity (Audit Log) -->
    <section class="admin-panel-card overflow-hidden" aria-label="${isBn ? 'সাম্প্রতিক অ্যাডমিন কার্যক্রম' : 'Recent Administrative Activity'}">
      <div class="admin-panel-header">
        <div>
          <h2 class="h6 fw-bold text-primary-bd mb-0">
            ${isBn ? 'সাম্প্রতিক অ্যাডমিনিস্ট্রেটিভ অ্যাক্টিভিটি (অডিট লগ)' : 'Recent Administrative Activity'}
          </h2>
        </div>
        <span class="small text-muted">
          ${isBn ? 'সংগ্রহ: admin_audit_logs' : 'Collection: admin_audit_logs'}
        </span>
      </div>
      ${renderAuditActivityBody(recentActivity, adminDashboardState.auditLogStatus, lang)}
    </section>
  `;
}

function formatEntityKindLabel(kind: RecentContentUpdateItem['entityType'], lang: Language): string {
  const isBn = lang === 'bn';
  switch (kind) {
    case 'division':
      return isBn ? 'বিভাগ' : 'Division';
    case 'district':
      return isBn ? 'জেলা' : 'District';
    case 'category':
      return isBn ? 'ক্যাটাগরি' : 'Category';
    case 'spot':
      return isBn ? 'দর্শনীয় স্থান' : 'Tourist Spot';
    case 'article':
      return isBn ? 'ভ্রমণ গাইড' : 'Article';
  }
}

function formatAuditActionLabel(action: AdminAuditLogEntry['action'], lang: Language): string {
  const isBn = lang === 'bn';
  switch (action) {
    case 'create':
      return isBn ? 'তৈরি' : 'Created';
    case 'update':
      return isBn ? 'হালনাগাদ' : 'Updated';
    case 'delete':
      return isBn ? 'মুছে ফেলা' : 'Deleted';
    case 'publish':
      return isBn ? 'প্রকাশিত' : 'Published';
    case 'unpublish':
      return isBn ? 'অপ্রকাশিত' : 'Unpublished';
    case 'settings_update':
      return isBn ? 'সেটিংস পরিবর্তন' : 'Settings Updated';
    case 'login':
      return isBn ? 'সাইন ইন' : 'Signed In';
    case 'logout':
      return isBn ? 'সাইন আউট' : 'Signed Out';
  }
}

function renderAuditActivityBody(
  logs: AdminAuditLogEntry[],
  auditLogStatus: 'available' | 'rules_pending' | 'error',
  lang: Language
): string {
  const isBn = lang === 'bn';

  if (logs.length === 0) {
    if (auditLogStatus === 'rules_pending') {
      return `
        <div class="p-4 text-center">
          <p class="small text-muted mb-0">
            ${
              isBn
                ? 'ক্লাউড ফায়ারস্টোরে অডিট লগ সক্রিয় করতে আপডেটকৃত firestore.rules ডিপ্লয় করুন। আপনার বর্তমান সেশনের কার্যক্রম স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।'
                : 'Audit logging is wired in the app; deploy the updated firestore.rules to persist and query historical admin_audit_logs in Cloud Firestore.'
            }
          </p>
        </div>
      `;
    }
    return `
      <div class="p-4 text-center">
        <p class="small text-muted mb-0">
          ${
            isBn
              ? 'এখনো কোনো প্রশাসনিক অডিট লগ সংরক্ষিত হয়নি। কনটেন্ট তৈরি, সম্পাদনা বা সেটিংস পরিবর্তনের পর এখানে রেকর্ড দেখা যাবে।'
              : 'No administrative audit logs recorded yet. Content mutations and settings changes will appear here.'
          }
        </p>
      </div>
    `;
  }

  return `
    <div class="table-responsive">
      <table class="table admin-data-table align-middle mb-0">
        <thead>
          <tr>
            <th>${isBn ? 'সময়' : 'Timestamp'}</th>
            <th>${isBn ? 'অ্যাডমিন' : 'Administrator'}</th>
            <th>${isBn ? 'কার্যক্রম' : 'Action'}</th>
            <th>${isBn ? 'বিষয়বস্তু' : 'Target'}</th>
            <th>${isBn ? 'বিবরণ' : 'Details'}</th>
          </tr>
        </thead>
        <tbody>
          ${logs
            .map(
              log => `
            <tr>
              <td class="small text-muted tabular-nums text-nowrap">${escapeHtml(formatAdminDate(log.timestamp, lang))}</td>
              <td class="small fw-medium">${escapeHtml(log.actor_email)}</td>
              <td class="small fw-semibold text-primary-bd text-nowrap">${escapeHtml(formatAuditActionLabel(log.action, lang))}</td>
              <td class="small">
                <span class="fw-semibold">${escapeHtml(log.entity_title)}</span>
                <span class="text-muted"> · ${escapeHtml(log.entity_type)}</span>
              </td>
              <td class="small text-muted">${escapeHtml(log.details || '—')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================================
// SEO SETTINGS MODULE
// ============================================================================
function renderSeoSettingsModule(lang: Language): string {
  const isBn = lang === 'bn';
  const seo = adminDashboardState.seoSettings;
  const saving = adminDashboardState.savingSeo;

  return `
    <div class="admin-panel-card p-4">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-4 border-bottom">
        <div>
          <h2 class="h6 fw-bold text-primary-bd mb-1">
            ${isBn ? 'গ্লোবাল সার্চ ইঞ্জিন অপ্টিমাইজেশন (SEO)' : 'Global Search Engine Optimization (SEO)'}
          </h2>
          <p class="small text-muted mb-0">
            ${
              isBn
                ? 'ফায়ারস্টোর সংগ্রহ: site_settings/seo_settings'
                : 'Persisted in Cloud Firestore at site_settings/seo_settings'
            }
          </p>
        </div>
        ${
          seo.updated_at
            ? `<span class="small text-muted tabular-nums">
                 ${isBn ? 'সর্বশেষ সংরক্ষণ:' : 'Last saved:'} ${escapeHtml(formatAdminDate(seo.updated_at, lang))}
               </span>`
            : ''
        }
      </div>

      <form id="form-admin-seo-settings">
        <div class="row g-3">
          <div class="col-md-6">
            <label for="seo-default-title-en" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'ডিফল্ট সাইট শিরোনাম (ইংরেজি)' : 'Default Site Title (English)'}
            </label>
            <input type="text" class="form-control" id="seo-default-title-en" value="${escapeHtml(seo.default_title_en)}" required maxlength="160">
          </div>
          <div class="col-md-6">
            <label for="seo-default-title-bn" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'ডিফল্ট সাইট শিরোনাম (বাংলা)' : 'Default Site Title (Bengali)'}
            </label>
            <input type="text" class="form-control" id="seo-default-title-bn" value="${escapeHtml(seo.default_title_bn)}" required maxlength="160">
          </div>

          <div class="col-md-6">
            <label for="seo-suffix-en" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'শিরোনাম সাফিক্স (ইংরেজি)' : 'Title Suffix (English)'}
            </label>
            <input type="text" class="form-control" id="seo-suffix-en" value="${escapeHtml(seo.title_suffix_en)}" maxlength="80">
          </div>
          <div class="col-md-6">
            <label for="seo-suffix-bn" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'শিরোনাম সাফিক্স (বাংলা)' : 'Title Suffix (Bengali)'}
            </label>
            <input type="text" class="form-control" id="seo-suffix-bn" value="${escapeHtml(seo.title_suffix_bn)}" maxlength="80">
          </div>

          <div class="col-md-6">
            <label for="seo-meta-desc-en" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'মেটা বিবরণ (ইংরেজি)' : 'Default Meta Description (English)'}
            </label>
            <textarea class="form-control" id="seo-meta-desc-en" rows="3" maxlength="320" required>${escapeHtml(seo.meta_description_en)}</textarea>
          </div>
          <div class="col-md-6">
            <label for="seo-meta-desc-bn" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'মেটা বিবরণ (বাংলা)' : 'Default Meta Description (Bengali)'}
            </label>
            <textarea class="form-control" id="seo-meta-desc-bn" rows="3" maxlength="320" required>${escapeHtml(seo.meta_description_bn)}</textarea>
          </div>

          <div class="col-md-6">
            <label for="seo-canonical-url" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'ক্যানোনিকাল বেস ইউআরএল' : 'Canonical Base URL'}
            </label>
            <input type="url" class="form-control" id="seo-canonical-url" value="${escapeHtml(seo.canonical_base_url)}" required>
          </div>
          <div class="col-md-6">
            <label for="seo-og-image" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'ডিফল্ট ওপেন গ্রাফ ছবি (URL)' : 'Default OG Share Image URL'}
            </label>
            <input type="url" class="form-control" id="seo-og-image" value="${escapeHtml(seo.og_image_url)}">
          </div>

          <div class="col-md-6">
            <label for="seo-robots-index" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'রোবটস ইন্ডেক্সিং নির্দেশনা' : 'Search Engine Indexing (Robots)'}
            </label>
            <select class="form-select" id="seo-robots-index">
              <option value="index, follow" ${seo.robots_index === 'index, follow' ? 'selected' : ''}>index, follow (Public Searchable)</option>
              <option value="noindex, nofollow" ${seo.robots_index === 'noindex, nofollow' ? 'selected' : ''}>noindex, nofollow (Hidden from Search)</option>
            </select>
          </div>
          <div class="col-md-6">
            <label for="seo-twitter-handle" class="form-label small fw-semibold text-primary-bd">
              ${isBn ? 'টুইটার / এক্স হ্যান্ডেল' : 'Twitter / X Handle'}
            </label>
            <input type="text" class="form-control" id="seo-twitter-handle" value="${escapeHtml(seo.twitter_handle)}" maxlength="60">
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
          <button type="submit" class="btn btn-primary-bd px-4" ${saving ? 'disabled' : ''}>
            ${
              saving
                ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}`
                : `<i class="bi bi-check2-circle me-1"></i>${isBn ? 'এসইও সেটিংস সংরক্ষণ করুন' : 'Save SEO Settings'}`
            }
          </button>
        </div>
      </form>
    </div>
  `;
}

// ============================================================================
// WEBSITE SETTINGS MODULE
// ============================================================================
function renderWebsiteSettingsModule(lang: Language): string {
  const isBn = lang === 'bn';
  const site = adminDashboardState.websiteSettings;
  const saving = adminDashboardState.savingWebsite;

  return `
    <div class="row g-4">
      <div class="col-12 col-xl-8">
        <div class="admin-panel-card p-4">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-4 border-bottom">
            <div>
              <h2 class="h6 fw-bold text-primary-bd mb-1">
                ${isBn ? 'সাধারণ ওয়েবসাইট কনফিগারেশন' : 'General Website Configuration'}
              </h2>
              <p class="small text-muted mb-0">
                ${
                  isBn
                    ? 'ফায়ারস্টোর সংগ্রহ: site_settings/website_settings'
                    : 'Persisted in Cloud Firestore at site_settings/website_settings'
                }
              </p>
            </div>
            ${
              site.updated_at
                ? `<span class="small text-muted tabular-nums">
                     ${isBn ? 'সর্বশেষ সংরক্ষণ:' : 'Last saved:'} ${escapeHtml(formatAdminDate(site.updated_at, lang))}
                   </span>`
                : ''
            }
          </div>

          <form id="form-admin-website-settings">
            <div class="row g-3">
              <div class="col-md-6">
                <label for="site-title-en" class="form-label small fw-semibold text-primary-bd">
                  ${isBn ? 'পোর্টালের নাম (ইংরেজি)' : 'Portal Name (English)'}
                </label>
                <input type="text" class="form-control" id="site-title-en" value="${escapeHtml(site.site_title_en)}" required maxlength="120">
              </div>
              <div class="col-md-6">
                <label for="site-title-bn" class="form-label small fw-semibold text-primary-bd">
                  ${isBn ? 'পোর্টালের নাম (বাংলা)' : 'Portal Name (Bengali)'}
                </label>
                <input type="text" class="form-control" id="site-title-bn" value="${escapeHtml(site.site_title_bn)}" required maxlength="120">
              </div>

              <div class="col-md-6">
                <label for="site-hero-heading-en" class="form-label small fw-semibold text-primary-bd">
                  ${isBn ? 'হিরো শিরোনাম (ইংরেজি)' : 'Hero Heading (English)'}
                </label>
                <input type="text" class="form-control" id="site-hero-heading-en" value="${escapeHtml(site.hero_heading_en)}" maxlength="200">
              </div>
              <div class="col-md-6">
                <label for="site-hero-heading-bn" class="form-label small fw-semibold text-primary-bd">
                  ${isBn ? 'হিরো শিরোনাম (বাংলা)' : 'Hero Heading (Bengali)'}
                </label>
                <input type="text" class="form-control" id="site-hero-heading-bn" value="${escapeHtml(site.hero_heading_bn)}" maxlength="200">
              </div>

              <div class="col-md-6">
                <label for="site-hero-subtitle-en" class="form-label small fw-semibold text-primary-bd">
                  ${isBn ? 'হিরো উপ-শিরোনাম (ইংরেজি)' : 'Hero Subtitle (English)'}
                </label>
                <textarea class="form-control" id="site-hero-subtitle-en" rows="2" maxlength="300">${escapeHtml(site.hero_subtitle_en)}</textarea>
              </div>
              <div class="col-md-6">
                <label for="site-hero-subtitle-bn" class="form-label small fw-semibold text-primary-bd">
                  ${isBn ? 'হিরো উপ-শিরোনাম (বাংলা)' : 'Hero Subtitle (Bengali)'}
                </label>
                <textarea class="form-control" id="site-hero-subtitle-bn" rows="2" maxlength="300">${escapeHtml(site.hero_subtitle_bn)}</textarea>
              </div>

              <div class="col-md-6">
                <label for="site-contact-email" class="form-label small fw-semibold text-primary-bd">
                  ${isBn ? 'অফিসিয়াল যোগাযোগ ইমেইল' : 'Official Contact Email'}
                </label>
                <input type="email" class="form-control" id="site-contact-email" value="${escapeHtml(site.contact_email)}" required>
              </div>
              <div class="col-md-6">
                <label for="site-helpline" class="form-label small fw-semibold text-primary-bd">
                  ${isBn ? 'ট্যুরিস্ট পুলিশ হেল্পলাইন' : 'Tourist Helpline'}
                </label>
                <input type="text" class="form-control" id="site-helpline" value="${escapeHtml(site.tourist_helpline)}" maxlength="60">
              </div>

              <div class="col-md-6">
                <label for="site-default-lang" class="form-label small fw-semibold text-primary-bd">
                  ${isBn ? 'ডিফল্ট ভাষা' : 'Default Portal Language'}
                </label>
                <select class="form-select" id="site-default-lang">
                  <option value="bn" ${site.default_language === 'bn' ? 'selected' : ''}>বাংলা (Bengali)</option>
                  <option value="en" ${site.default_language === 'en' ? 'selected' : ''}>English</option>
                </select>
              </div>
              <div class="col-md-6 d-flex align-items-end">
                <div class="form-check mb-2">
                  <input class="form-check-input" type="checkbox" id="site-maintenance-mode" ${site.maintenance_mode ? 'checked' : ''}>
                  <label class="form-check-label small fw-semibold text-primary-bd" for="site-maintenance-mode">
                    ${isBn ? 'রক্ষণাবেক্ষণ মোড সক্রিয় করুন' : 'Enable Maintenance Mode Notice'}
                  </label>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button type="submit" class="btn btn-primary-bd px-4" ${saving ? 'disabled' : ''}>
                ${
                  saving
                    ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}`
                    : `<i class="bi bi-check2-circle me-1"></i>${isBn ? 'ওয়েবসাইট সেটিংস সংরক্ষণ করুন' : 'Save Website Settings'}`
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-12 col-xl-4">
        <div class="admin-panel-card p-4">
          <h2 class="h6 fw-bold text-primary-bd mb-2">
            ${isBn ? 'আইনি নথি ব্যবস্থাপনা' : 'Legal Pages Management'}
          </h2>
          <p class="small text-muted mb-3">
            ${
              isBn
                ? 'গোপনীয়তা নীতি এবং ব্যবহারের শর্তাবলী বাংলা ও ইংরেজিতে সম্পাদনা ও পর্যালোচনা অনুমোদন করুন।'
                : 'Review and edit bilingual Privacy Policy and Terms & Conditions stored in site_settings/legal_pages.'
            }
          </p>
          <div class="admin-kv-list mb-3">
            <div class="admin-kv-row">
              <span class="small text-muted">${isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</span>
              <span class="${cmsStore.legalPages.privacy_reviewed ? 'badge-published' : 'badge-draft'}">
                ${cmsStore.legalPages.privacy_reviewed ? (isBn ? 'পর্যালোচিত' : 'Reviewed') : (isBn ? 'পর্যালোচনা বাকি' : 'Needs Review')}
              </span>
            </div>
            <div class="admin-kv-row">
              <span class="small text-muted">${isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms & Conditions'}</span>
              <span class="${cmsStore.legalPages.terms_reviewed ? 'badge-published' : 'badge-draft'}">
                ${cmsStore.legalPages.terms_reviewed ? (isBn ? 'পর্যালোচিত' : 'Reviewed') : (isBn ? 'পর্যালোচনা বাকি' : 'Needs Review')}
              </span>
            </div>
          </div>
          <button type="button" class="btn btn-outline-bd btn-sm w-100" data-quick-action="edit-legal">
            <i class="bi bi-file-earmark-text me-1"></i>${isBn ? 'আইনি নথি এডিটর খুলুন' : 'Open Legal Pages Editor'}
          </button>
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

  // Search & status filter
  let list = cmsStore.divisions.filter(d => {
    if (cmsStore.filterStatus === 'published' && !d.is_published) return false;
    if (cmsStore.filterStatus === 'draft' && d.is_published) return false;
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return (
      d.name_en.toLowerCase().includes(q) ||
      d.name_bn.toLowerCase().includes(q) ||
      d.headquarters_en.toLowerCase().includes(q) ||
      (d.slug || '').toLowerCase().includes(q)
    );
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
        <div class="d-flex flex-wrap align-items-center gap-2">
          <input 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="${t('cms_search_records')}" 
            aria-label="${escapeHtml(t('cms_search_records'))}"
            value="${escapeHtml(cmsStore.searchQuery)}" 
            id="cms-search-input"
            style="min-width: 240px;"
          >
          <select class="form-select form-select-sm" id="cms-filter-status" aria-label="${isBn ? 'অবস্থা অনুযায়ী ফিল্টার' : 'Filter by status'}" style="width: auto;">
            <option value="all" ${cmsStore.filterStatus === 'all' ? 'selected' : ''}>${isBn ? 'সকল অবস্থা' : 'All Statuses'}</option>
            <option value="published" ${cmsStore.filterStatus === 'published' ? 'selected' : ''}>${t('cms_status_published')}</option>
            <option value="draft" ${cmsStore.filterStatus === 'draft' ? 'selected' : ''}>${t('cms_status_draft')}</option>
          </select>
          <span class="small text-muted tabular-nums">${t('cms_total_records')} ${total}</span>
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
                    <img src="${escapeHtml(optimizeImageUrl(div.image_url, 160))}" class="rounded-2" style="width: 48px; height: 36px; object-fit: cover;" alt="${escapeHtml(div.name_en)}" loading="lazy" decoding="async">
                  </td>
                  <td class="fw-bold text-primary-bd">${escapeHtml(div.name_en)}</td>
                  <td>${escapeHtml(div.name_bn)}</td>
                  <td><code>${escapeHtml(div.slug)}</code></td>
                  <td>${escapeHtml(isBn ? div.headquarters_bn : div.headquarters_en)}</td>
                  <td class="tabular-nums fw-semibold">${childDistricts.length}</td>
                  <td>
                    <span class="${div.is_published ? 'badge-published' : 'badge-draft'}">
                      <i class="bi ${div.is_published ? 'bi-check-circle' : 'bi-pause-circle'}"></i>
                      ${div.is_published ? t('cms_status_published') : t('cms_status_draft')}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-division="${escapeHtml(div.id)}" title="${t('cms_edit')}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-division="${escapeHtml(div.id)}" title="${t('cms_toggle_status')}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-division="${escapeHtml(div.id)}" title="${t('cms_delete')}">
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
// MODULE 2: DISTRICT MANAGEMENT
// ============================================================================
function renderDistrictsModule(lang: Language): string {
  const isBn = lang === 'bn';
  const t = (k: string) => getTranslation(k, lang);

  let list = cmsStore.districts.filter(dist => {
    if (cmsStore.filterDivision !== 'all' && dist.division_id !== cmsStore.filterDivision) {
      return false;
    }
    if (cmsStore.filterStatus === 'published' && !dist.is_published) return false;
    if (cmsStore.filterStatus === 'draft' && dist.is_published) return false;
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return (
      dist.name_en.toLowerCase().includes(q) ||
      dist.name_bn.toLowerCase().includes(q) ||
      dist.famous_for_en.toLowerCase().includes(q) ||
      (dist.slug || '').toLowerCase().includes(q)
    );
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
            aria-label="${escapeHtml(t('cms_search_records'))}"
            value="${escapeHtml(cmsStore.searchQuery)}" 
            id="cms-search-input"
            style="min-width: 210px;"
          >
          <select class="form-select form-select-sm" id="cms-filter-division" aria-label="${isBn ? 'বিভাগ অনুযায়ী ফিল্টার' : 'Filter by division'}" style="width: auto;">
            <option value="all">${isBn ? 'সকল বিভাগ' : 'All Divisions'}</option>
            ${cmsStore.divisions.map(d => `
              <option value="${escapeHtml(d.id)}" ${cmsStore.filterDivision === d.id ? 'selected' : ''}>
                ${escapeHtml(isBn ? d.name_bn : d.name_en)}
              </option>
            `).join('')}
          </select>
          <select class="form-select form-select-sm" id="cms-filter-status" aria-label="${isBn ? 'অবস্থা অনুযায়ী ফিল্টার' : 'Filter by status'}" style="width: auto;">
            <option value="all" ${cmsStore.filterStatus === 'all' ? 'selected' : ''}>${isBn ? 'সকল অবস্থা' : 'All Statuses'}</option>
            <option value="published" ${cmsStore.filterStatus === 'published' ? 'selected' : ''}>${t('cms_status_published')}</option>
            <option value="draft" ${cmsStore.filterStatus === 'draft' ? 'selected' : ''}>${t('cms_status_draft')}</option>
          </select>
          <span class="small text-muted tabular-nums">${t('cms_total_records')} ${total}</span>
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
                    <img src="${escapeHtml(optimizeImageUrl(dist.image_url, 160))}" class="rounded-2" style="width: 44px; height: 32px; object-fit: cover;" alt="${escapeHtml(dist.name_en)}" loading="lazy" decoding="async">
                  </td>
                  <td class="fw-bold text-primary-bd">${escapeHtml(dist.name_en)}</td>
                  <td>${escapeHtml(dist.name_bn)}</td>
                  <td class="small fw-medium">${escapeHtml((isBn ? div?.name_bn : div?.name_en) || dist.division_id)}</td>
                  <td class="small text-truncate" style="max-width: 160px;">${escapeHtml(isBn ? dist.famous_for_bn : dist.famous_for_en)}</td>
                  <td class="small text-muted tabular-nums">
                    ${dist.latitude && dist.longitude ? `${dist.latitude.toFixed(2)}, ${dist.longitude.toFixed(2)}` : '<span class="text-muted">N/A</span>'}
                  </td>
                  <td class="tabular-nums fw-semibold">${spotsCount}</td>
                  <td>
                    <span class="${dist.is_published ? 'badge-published' : 'badge-draft'}">
                      ${dist.is_published ? t('cms_status_published') : t('cms_status_draft')}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-district="${escapeHtml(dist.id)}" title="${t('cms_edit')}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-district="${escapeHtml(dist.id)}" title="${t('cms_toggle_status')}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-district="${escapeHtml(dist.id)}" title="${t('cms_delete')}">
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
    if (cmsStore.filterStatus === 'published' && !c.is_published) return false;
    if (cmsStore.filterStatus === 'draft' && c.is_published) return false;
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return (
      c.name_en.toLowerCase().includes(q) ||
      c.name_bn.toLowerCase().includes(q) ||
      (c.slug || '').toLowerCase().includes(q)
    );
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
            aria-label="${escapeHtml(t('cms_search_records'))}"
            value="${escapeHtml(cmsStore.searchQuery)}" 
            id="cms-search-input"
            style="min-width: 240px;"
          >
          <select class="form-select form-select-sm" id="cms-filter-status" aria-label="${isBn ? 'অবস্থা অনুযায়ী ফিল্টার' : 'Filter by status'}" style="width: auto;">
            <option value="all" ${cmsStore.filterStatus === 'all' ? 'selected' : ''}>${isBn ? 'সকল অবস্থা' : 'All Statuses'}</option>
            <option value="published" ${cmsStore.filterStatus === 'published' ? 'selected' : ''}>${t('cms_status_published')}</option>
            <option value="draft" ${cmsStore.filterStatus === 'draft' ? 'selected' : ''}>${t('cms_status_draft')}</option>
          </select>
          <span class="small text-muted tabular-nums">${t('cms_total_records')} ${total}</span>
        </div>

        <button class="btn btn-accent btn-sm px-3" id="cms-btn-add-category">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'নতুন ক্যাটাগরি যোগ করুন' : 'Add Category'}
        </button>
      </div>

      <div class="table-responsive">
        <table class="table cms-table table-hover align-middle">
          <thead>
            <tr>
              <th>Media / Icon</th>
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
                    <div class="d-flex align-items-center gap-2">
                      ${
                        cat.image_url
                          ? `<img src="${escapeHtml(optimizeImageUrl(cat.image_url, 160))}" class="rounded-2" style="width: 44px; height: 32px; object-fit: cover;" alt="${escapeHtml(cat.name_en)}" loading="lazy" decoding="async">`
                          : ''
                      }
                      <span class="fs-5 text-primary-bd"><i class="bi ${escapeHtml(cat.icon || 'bi-tag')}"></i></span>
                    </div>
                  </td>
                  <td class="fw-bold text-primary-bd">${escapeHtml(cat.name_en)}</td>
                  <td>${escapeHtml(cat.name_bn)}</td>
                  <td><code>${escapeHtml(cat.slug)}</code></td>
                  <td class="tabular-nums fw-semibold">${spotsCount}</td>
                  <td>
                    <span class="${cat.is_published ? 'badge-published' : 'badge-draft'}">
                      ${cat.is_published ? t('cms_status_published') : t('cms_status_draft')}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-category="${escapeHtml(cat.id)}" title="${t('cms_edit')}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-category="${escapeHtml(cat.id)}" title="${t('cms_toggle_status')}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-category="${escapeHtml(cat.id)}" title="${t('cms_delete')}">
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
    if (cmsStore.filterStatus === 'published' && !s.is_published) return false;
    if (cmsStore.filterStatus === 'draft' && s.is_published) return false;
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return (
      s.name_en.toLowerCase().includes(q) ||
      s.name_bn.toLowerCase().includes(q) ||
      s.short_desc_en.toLowerCase().includes(q) ||
      (s.slug || '').toLowerCase().includes(q)
    );
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
            aria-label="${escapeHtml(t('cms_search_records'))}"
            value="${escapeHtml(cmsStore.searchQuery)}" 
            id="cms-search-input"
            style="min-width: 190px;"
          >
          <select class="form-select form-select-sm" id="cms-filter-division" aria-label="${isBn ? 'বিভাগ অনুযায়ী ফিল্টার' : 'Filter by division'}" style="width: auto;">
            <option value="all">${isBn ? 'সকল বিভাগ' : 'All Divisions'}</option>
            ${cmsStore.divisions.map(d => `
              <option value="${escapeHtml(d.id)}" ${cmsStore.filterDivision === d.id ? 'selected' : ''}>
                ${escapeHtml(isBn ? d.name_bn : d.name_en)}
              </option>
            `).join('')}
          </select>
          <select class="form-select form-select-sm" id="cms-filter-category" aria-label="${isBn ? 'ক্যাটাগরি অনুযায়ী ফিল্টার' : 'Filter by category'}" style="width: auto;">
            <option value="all">${isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
            ${cmsStore.categories.map(c => `
              <option value="${escapeHtml(c.id)}" ${cmsStore.filterCategory === c.id ? 'selected' : ''}>
                ${escapeHtml(isBn ? c.name_bn : c.name_en)}
              </option>
            `).join('')}
          </select>
          <select class="form-select form-select-sm" id="cms-filter-status" aria-label="${isBn ? 'অবস্থা অনুযায়ী ফিল্টার' : 'Filter by status'}" style="width: auto;">
            <option value="all" ${cmsStore.filterStatus === 'all' ? 'selected' : ''}>${isBn ? 'সকল অবস্থা' : 'All Statuses'}</option>
            <option value="published" ${cmsStore.filterStatus === 'published' ? 'selected' : ''}>${t('cms_status_published')}</option>
            <option value="draft" ${cmsStore.filterStatus === 'draft' ? 'selected' : ''}>${t('cms_status_draft')}</option>
          </select>
          <span class="small text-muted tabular-nums">${t('cms_total_records')} ${total}</span>
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
              const galleryCount = Array.isArray(spot.gallery_urls) ? spot.gallery_urls.length : 0;
              return `
                <tr>
                  <td>
                    <img src="${escapeHtml(optimizeImageUrl(spot.image_url, 160))}" class="rounded-2" style="width: 48px; height: 36px; object-fit: cover;" alt="${escapeHtml(spot.name_en)}" loading="lazy" decoding="async">
                    ${galleryCount > 0 ? `<div class="text-muted mt-1" style="font-size: 0.7rem;">+${galleryCount} ${isBn ? 'গ্যালারি' : 'gallery'}</div>` : ''}
                  </td>
                  <td>
                    <div class="fw-bold text-primary-bd">${escapeHtml(spot.name_en)}</div>
                    <div class="small text-muted">${escapeHtml(spot.name_bn)}</div>
                  </td>
                  <td>
                    <div class="small fw-semibold">${escapeHtml((isBn ? dist?.name_bn : dist?.name_en) || spot.district_id)}</div>
                    <small class="text-muted">${escapeHtml((isBn ? div?.name_bn : div?.name_en) || spot.division_id)}</small>
                  </td>
                  <td class="small text-muted">
                    ${(spot.category_ids || []).map(cid => {
                      const cat = cmsStore.categories.find(c => c.id === cid);
                      return escapeHtml((isBn ? cat?.name_bn : cat?.name_en) || cid);
                    }).join(' · ')}
                  </td>
                  <td class="tabular-nums fw-semibold">
                    <i class="bi bi-star-fill text-warning me-1"></i>${spot.rating}
                  </td>
                  <td class="small">
                    ${spot.is_featured 
                      ? `<span class="fw-semibold text-primary-bd">${isBn ? 'ফিচার্ড' : 'Featured'}</span>` 
                      : `<span class="text-muted">${isBn ? 'সাধারণ' : 'Standard'}</span>`}
                  </td>
                  <td>
                    <span class="${spot.is_published ? 'badge-published' : 'badge-draft'}">
                      ${spot.is_published ? t('cms_status_published') : t('cms_status_draft')}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-spot="${escapeHtml(spot.id)}" title="${t('cms_edit')}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-spot="${escapeHtml(spot.id)}" title="${t('cms_toggle_status')}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-spot="${escapeHtml(spot.id)}" title="${t('cms_delete')}">
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
    const resolvedStatus = a.status || (a.is_published ? 'published' : 'draft');
    if (cmsStore.filterStatus === 'published' && resolvedStatus !== 'published') return false;
    if (cmsStore.filterStatus === 'draft' && resolvedStatus !== 'draft') return false;
    if (cmsStore.filterStatus === 'scheduled' && resolvedStatus !== 'scheduled') return false;
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return (
      a.title_en.toLowerCase().includes(q) ||
      a.title_bn.toLowerCase().includes(q) ||
      a.author_en.toLowerCase().includes(q) ||
      (a.slug || '').toLowerCase().includes(q)
    );
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
            aria-label="${escapeHtml(t('cms_search_records'))}"
            value="${escapeHtml(cmsStore.searchQuery)}" 
            id="cms-search-input"
            style="min-width: 220px;"
          >
          <select class="form-select form-select-sm" id="cms-filter-status" aria-label="${isBn ? 'অবস্থা অনুযায়ী ফিল্টার' : 'Filter by status'}" style="width: auto;">
            <option value="all" ${cmsStore.filterStatus === 'all' ? 'selected' : ''}>${isBn ? 'সকল অবস্থা' : 'All Statuses'}</option>
            <option value="published" ${cmsStore.filterStatus === 'published' ? 'selected' : ''}>${t('cms_status_published')}</option>
            <option value="draft" ${cmsStore.filterStatus === 'draft' ? 'selected' : ''}>${t('cms_status_draft')}</option>
            <option value="scheduled" ${cmsStore.filterStatus === 'scheduled' ? 'selected' : ''}>${t('cms_status_scheduled')}</option>
          </select>
          <span class="small text-muted tabular-nums">${t('cms_total_records')} ${total}</span>
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
              <th>Article Title & Category</th>
              <th>Author</th>
              <th>Read Time</th>
              <th>Connected Destinations</th>
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
              const spot = cmsStore.spots.find(s => s.id === art.related_spot_id);
              const artCat = ARTICLE_CATEGORIES.find(c => c.id === art.category_id);
              const isScheduled = art.status === 'scheduled';
              return `
                <tr>
                  <td>
                    <img src="${escapeHtml(optimizeImageUrl(art.image_url, 160))}" class="rounded-2" style="width: 48px; height: 36px; object-fit: cover;" alt="${escapeHtml(art.title_en)}" loading="lazy" decoding="async">
                  </td>
                  <td>
                    <div class="fw-bold text-primary-bd">${escapeHtml(art.title_en)}</div>
                    <div class="small text-muted">${escapeHtml(art.title_bn)}</div>
                    ${artCat ? `<div class="text-muted mt-1" style="font-size: 0.72rem;"><i class="bi ${escapeHtml(artCat.icon)} me-1"></i>${escapeHtml(isBn ? artCat.name_bn : artCat.name_en)}</div>` : ''}
                  </td>
                  <td>${escapeHtml(isBn ? art.author_bn : art.author_en)}</td>
                  <td class="small text-muted">${escapeHtml(isBn ? art.read_time_bn : art.read_time_en)}</td>
                  <td class="small">
                    <div>${dist ? escapeHtml(isBn ? dist.name_bn : dist.name_en) : (isBn ? 'সমগ্র বাংলাদেশ' : 'All Bangladesh')}</div>
                    ${spot ? `<div class="text-muted" style="font-size: 0.75rem;"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(isBn ? spot.name_bn : spot.name_en)}</div>` : ''}
                  </td>
                  <td>
                    <span class="${art.is_published && !isScheduled ? 'badge-published' : 'badge-draft'}">
                      ${isScheduled ? t('cms_status_scheduled') : (art.is_published ? t('cms_status_published') : t('cms_status_draft'))}
                    </span>
                    ${isScheduled && art.scheduled_at ? `<div class="text-muted mt-1 tabular-nums" style="font-size: 0.7rem;">${escapeHtml(art.scheduled_at.slice(0, 16).replace('T', ' '))}</div>` : ''}
                  </td>
                  <td class="text-end">
                    <button class="cms-action-btn me-1" data-edit-article="${escapeHtml(art.id)}" title="${t('cms_edit')}">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="cms-action-btn me-1" data-toggle-article="${escapeHtml(art.id)}" title="${t('cms_toggle_status')}">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="cms-action-btn btn-delete text-danger" data-delete-article="${escapeHtml(art.id)}" title="${t('cms_delete')}">
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

  // Filter by search query & usage status
  const filteredMedia = cmsStore.media.filter(item => {
    const refs = getMediaReferences(item.url);
    if (cmsStore.filterStatus === 'unused' && refs.length > 0) return false;
    if (cmsStore.filterStatus === 'in-use' && refs.length === 0) return false;
    if (!cmsStore.searchQuery.trim()) return true;
    const q = cmsStore.searchQuery.toLowerCase();
    return (
      item.file_name.toLowerCase().includes(q) ||
      item.alt_en.toLowerCase().includes(q) ||
      item.alt_bn.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q)
    );
  });

  const total = filteredMedia.length;
  const totalPages = Math.ceil(total / cmsStore.itemsPerPage) || 1;
  const page = Math.min(cmsStore.currentPage, totalPages);
  const start = (page - 1) * cmsStore.itemsPerPage;
  const paginated = filteredMedia.slice(start, start + cmsStore.itemsPerPage);

  return `
    <!-- Upload Dropzone Card -->
    <div class="admin-panel-card p-4 mb-4">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h5 class="fw-bold text-primary-bd mb-1">
            <i class="bi bi-cloud-arrow-up-fill text-accent-bd me-2"></i>
            ${isBn ? 'ফায়ারবেস স্টোরেজ ও মিডিয়া লাইব্রেরি' : 'Firebase Storage & Media Library'}
          </h5>
          <p class="small text-muted mb-0">
            ${isBn 
              ? 'জেপিজি, পিএনজি, ওয়েবপি, জিআইএফ বা এসভিজি ফাইল আপলোড করুন (সর্বোচ্চ ৫ মেগাবাইট)। দ্বিভাষিক অল্ট-টেক্সট যোগ করুন।' 
              : 'Upload JPG, PNG, WEBP, GIF, or SVG files (Max 5MB). Set bilingual alternative text and delete unused assets safely.'}
          </p>
        </div>
        <button class="btn btn-accent btn-sm px-3" id="cms-btn-add-media">
          <i class="bi bi-plus-lg me-1"></i>${isBn ? 'বিবরণসহ ছবি আপলোড' : 'Upload with Alt Text'}
        </button>
      </div>

      <div class="cms-dropzone" id="cms-media-dropzone">
        <i class="bi bi-images text-secondary-bd" style="font-size: 2.75rem;"></i>
        <h6 class="fw-bold text-primary-bd mt-2 mb-1">
          ${isBn ? 'এখানে ছবি ড্র্যাগ ও ড্রপ করুন অথবা ক্লিক করে নির্বাচন করুন' : 'Drag & drop image files here, or click to browse'}
        </h6>
        <p class="small text-muted mb-3">Supported formats: JPG, PNG, WEBP, GIF, SVG (Up to 5MB)</p>
        <input type="file" id="cms-media-file-input" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" class="d-none">
        <button type="button" class="btn btn-outline-bd btn-sm px-4" id="cms-media-browse-btn">
          <i class="bi bi-folder2-open me-1"></i>${isBn ? 'ফাইল বেছে নিন' : 'Browse Files'}
        </button>
      </div>
    </div>

    <!-- Media Library Grid -->
    <div class="admin-panel-card overflow-hidden">
      <div class="cms-table-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <input 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="${isBn ? 'ফাইল বা অল্ট-টেক্সট খুঁজুন...' : 'Search filename or alt text...'}" 
            aria-label="${isBn ? 'ফাইল বা অল্ট-টেক্সট খুঁজুন' : 'Search filename or alt text'}"
            value="${escapeHtml(cmsStore.searchQuery)}" 
            id="cms-search-input"
            style="min-width: 220px;"
          >
          <select class="form-select form-select-sm" id="cms-filter-status" aria-label="${isBn ? 'ব্যবহার অবস্থা অনুযায়ী ফিল্টার' : 'Filter by usage status'}" style="width: auto;">
            <option value="all" ${cmsStore.filterStatus === 'all' ? 'selected' : ''}>${isBn ? 'সকল ছবি' : 'All Images'}</option>
            <option value="unused" ${cmsStore.filterStatus === 'unused' ? 'selected' : ''}>${isBn ? 'অব্যবহৃত (নিরাপদ মুছুন)' : 'Unused Only'}</option>
            <option value="in-use" ${cmsStore.filterStatus === 'in-use' ? 'selected' : ''}>${isBn ? 'ব্যবহৃত হচ্ছে' : 'In Use'}</option>
          </select>
          <span class="small text-muted tabular-nums">${t('cms_total_records')} ${total}</span>
        </div>
        <small class="text-muted">${isBn ? 'যেকোনো ছবির ইউআরএল কপি বা অল্ট-টেক্সট সম্পাদনা করুন' : 'Preview, copy URL, edit bilingual alt text, or safely remove unused assets'}</small>
      </div>

      ${
        paginated.length === 0
          ? `<div class="text-center py-5 text-muted">${t('no_results_title')}</div>`
          : `
            <div class="cms-media-grid">
              ${paginated.map(item => {
                const refs = getMediaReferences(item.url);
                const isUnused = refs.length === 0;
                return `
                  <div class="cms-media-card">
                    <img 
                      src="${escapeHtml(optimizeImageUrl(item.url, 400))}" 
                      class="cms-media-thumb" 
                      alt="${escapeHtml(item.alt_en)}" 
                      loading="lazy"
                      decoding="async"
                      data-preview-img="${escapeHtml(item.url)}" 
                      data-preview-media-id="${escapeHtml(item.id)}" 
                      title="${isBn ? 'বড় করে দেখুন' : 'Click to preview'}"
                    >
                    <div class="cms-media-body">
                      <div class="small fw-semibold text-truncate text-primary-bd" title="${escapeHtml(item.file_name)}">${escapeHtml(item.file_name)}</div>
                      <div class="text-muted text-truncate mt-1" style="font-size: 0.74rem;" title="${escapeHtml(item.alt_en)}">
                        <strong>EN:</strong> ${escapeHtml(item.alt_en)}
                      </div>
                      <div class="text-muted text-truncate" style="font-size: 0.74rem;" title="${escapeHtml(item.alt_bn)}">
                        <strong>BN:</strong> ${escapeHtml(item.alt_bn)}
                      </div>
                      <div class="d-flex justify-content-between align-items-center text-muted tabular-nums mt-1" style="font-size: 0.72rem;">
                        <span>${(item.file_size / 1024).toFixed(0)} KB · ${new Date(item.uploaded_at).toLocaleDateString()}</span>
                        <span class="fw-semibold ${isUnused ? 'text-success' : 'text-primary-bd'}">
                          ${isUnused ? (isBn ? 'অব্যবহৃত' : 'Unused') : `${isBn ? 'ব্যবহৃত' : 'Used in'} (${refs.length})`}
                        </span>
                      </div>
                      <div class="cms-media-actions mt-2 pt-2 border-top d-flex justify-content-between align-items-center gap-1">
                        <div class="d-flex gap-1">
                          <button class="btn btn-outline-secondary btn-sm py-0 px-2" style="font-size: 0.74rem;" data-edit-media="${escapeHtml(item.id)}" title="${t('cms_edit')}">
                            <i class="bi bi-pencil me-1"></i>${isBn ? 'অল্ট' : 'Alt'}
                          </button>
                          <button class="btn btn-outline-secondary btn-sm py-0 px-2" style="font-size: 0.74rem;" data-copy-url="${escapeHtml(item.url)}" title="Copy URL">
                            <i class="bi bi-link-45deg me-1"></i>URL
                          </button>
                        </div>
                        <button 
                          class="btn ${isUnused ? 'btn-outline-danger' : 'btn-outline-secondary'} btn-sm py-0 px-2" 
                          style="font-size: 0.74rem;" 
                          data-delete-media="${escapeHtml(item.id)}" 
                          title="${isUnused ? (isBn ? 'নিরাপদে মুছুন' : 'Delete unused image') : (isBn ? 'ব্যবহৃত হচ্ছে — ব্যবহার তালিকা দেখুন' : 'In use — click to view references')}"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `
      }

      ${renderPaginationFooter(page, totalPages, total, lang)}
    </div>
  `;
}

// Pagination Component Helper
function renderPaginationFooter(page: number, totalPages: number, total: number, lang: Language): string {
  const t = (k: string) => getTranslation(k, lang);

  return `
    <div class="p-3 border-top bg-light d-flex flex-wrap justify-content-between align-items-center gap-2 small">
      <div class="text-muted tabular-nums">
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
