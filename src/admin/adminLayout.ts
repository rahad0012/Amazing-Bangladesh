/**
 * Admin Layout Component
 * Dedicated CMS layout architecture completely separated from the public tourist portal
 */

import { Language } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';

export type AdminTab = 'overview' | 'divisions' | 'districts' | 'categories' | 'spots' | 'articles' | 'media';

export interface AdminLayoutOptions {
  activeTab: AdminTab;
  lang: Language;
  userEmail?: string | null;
  counts: {
    divisions: number;
    districts: number;
    categories: number;
    spots: number;
    articles: number;
    media: number;
  };
  contentHtml: string;
}

export function renderAdminLayout(options: AdminLayoutOptions): string {
  const { activeTab, lang, userEmail, counts, contentHtml } = options;
  const isBn = lang === 'bn';

  return `
    <div class="cms-container">
      <div class="container-fluid px-lg-5">
        <!-- Admin Shell Header -->
        <header class="cms-header-card">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold">
                  <i class="bi bi-shield-lock-fill me-1"></i>${isBn ? 'সিএমএস অ্যাডমিন' : 'Admin CMS Portal'}
                </span>
                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                  <i class="bi bi-cloud-check-fill me-1"></i>Firestore Connected
                </span>
              </div>
              <h2 class="fw-bold text-primary-bd mb-0 mt-1">
                ${isBn ? 'বাংলাদেশ পর্যটন কন্টেন্ট ম্যানেজমেন্ট সিস্টেম' : 'Bangladesh Tourism Content Management System'}
              </h2>
              <small class="text-muted">
                ${isBn ? '৮ বিভাগ, ৬৪ জেলা এবং দর্শনীয় স্থানসমূহের অফিসিয়াল ডাটাবেস অ্যাডমিন প্যানেল' : 'Official database management for divisions, districts, and curated destinations'}
              </small>
            </div>

            <div class="d-flex align-items-center gap-2">
              <div class="text-end d-none d-md-block me-2">
                <small class="text-muted d-block">${isBn ? 'অ্যাডমিন ইউজার' : 'Authorized Admin'}</small>
                <span class="fw-semibold small text-primary-bd">${escapeHtml(userEmail || 'bluesky90987@gmail.com')}</span>
              </div>

              <button class="btn btn-outline-bd btn-sm px-3" id="cms-exit-btn">
                <i class="bi bi-arrow-left me-1"></i>${isBn ? 'পাবলিক পোর্টালে ফিরুন' : 'Back to Public Portal'}
              </button>
            </div>
          </div>
        </header>

        <!-- Admin Navigation Tabs -->
        <nav class="cms-nav-tabs" aria-label="CMS Modules">
          <button class="cms-nav-btn ${activeTab === 'overview' ? 'active' : ''}" data-cms-tab="overview">
            <i class="bi bi-speedometer2"></i>
            <span>${isBn ? 'ওভারভিউ ড্যাশবোর্ড' : 'Overview'}</span>
          </button>
          <button class="cms-nav-btn ${activeTab === 'divisions' ? 'active' : ''}" data-cms-tab="divisions">
            <i class="bi bi-diagram-3"></i>
            <span>${isBn ? 'বিভাগসমূহ' : 'Divisions'}</span>
            <span class="badge ${activeTab === 'divisions' ? 'bg-white text-dark' : 'bg-secondary text-white'} ms-1">${counts.divisions}</span>
          </button>
          <button class="cms-nav-btn ${activeTab === 'districts' ? 'active' : ''}" data-cms-tab="districts">
            <i class="bi bi-geo-alt"></i>
            <span>${isBn ? 'জেলাসমূহ' : 'Districts'}</span>
            <span class="badge ${activeTab === 'districts' ? 'bg-white text-dark' : 'bg-secondary text-white'} ms-1">${counts.districts}</span>
          </button>
          <button class="cms-nav-btn ${activeTab === 'categories' ? 'active' : ''}" data-cms-tab="categories">
            <i class="bi bi-tags"></i>
            <span>${isBn ? 'ক্যাটাগরি' : 'Categories'}</span>
            <span class="badge ${activeTab === 'categories' ? 'bg-white text-dark' : 'bg-secondary text-white'} ms-1">${counts.categories}</span>
          </button>
          <button class="cms-nav-btn ${activeTab === 'spots' ? 'active' : ''}" data-cms-tab="spots">
            <i class="bi bi-pin-map"></i>
            <span>${isBn ? 'দর্শনীয় স্থান' : 'Tourist Spots'}</span>
            <span class="badge ${activeTab === 'spots' ? 'bg-white text-dark' : 'bg-secondary text-white'} ms-1">${counts.spots}</span>
          </button>
          <button class="cms-nav-btn ${activeTab === 'articles' ? 'active' : ''}" data-cms-tab="articles">
            <i class="bi bi-journal-text"></i>
            <span>${isBn ? 'ভ্রমণ নির্দেশিকা' : 'Articles'}</span>
            <span class="badge ${activeTab === 'articles' ? 'bg-white text-dark' : 'bg-secondary text-white'} ms-1">${counts.articles}</span>
          </button>
          <button class="cms-nav-btn ${activeTab === 'media' ? 'active' : ''}" data-cms-tab="media">
            <i class="bi bi-images"></i>
            <span>${isBn ? 'মিডিয়া ফাইলস' : 'Media Library'}</span>
            <span class="badge ${activeTab === 'media' ? 'bg-white text-dark' : 'bg-secondary text-white'} ms-1">${counts.media}</span>
          </button>
        </nav>

        <!-- Main Dynamic Admin Content Area -->
        <main id="cms-main-content">
          ${contentHtml}
        </main>
      </div>
    </div>
  `;
}
