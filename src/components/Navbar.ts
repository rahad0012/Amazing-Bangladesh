/**
 * Reusable Responsive Navbar Component
 * Features: Brand logo, Navigation links, Quick Search, Saved Places counter, Language Switcher
 */

import { Language } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';

export interface NavbarOptions {
  lang: Language;
  activeNav: string;
  savedCount: number;
}

export function renderNavbar(options: NavbarOptions): string {
  const isBn = options.lang === 'bn';
  const brandTitle = isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh';
  const brandSubtitle = isBn ? 'অফিসিয়াল পর্যটন পোর্টাল' : 'Official Tourism Portal';
  const navHome = isBn ? 'মূলপাতা' : 'Home';
  const navDivisions = isBn ? 'বিভাগসমূহ (৮)' : '8 Divisions';
  const navDistricts = isBn ? '৬৪ জেলা' : '64 Districts';
  const navCategories = isBn ? 'ক্যাটাগরি' : 'Categories';
  const navSpots = isBn ? 'দর্শনীয় স্থান' : 'Attractions';
  const navGuides = isBn ? 'ভ্রমণ নির্দেশিকা' : 'Travel Guides';
  const navPlanner = isBn ? 'ট্যুর প্ল্যানার' : 'Trip Planner';
  const langLabel = isBn ? 'English' : 'বাংলা';
  const savedLabel = isBn ? 'পছন্দ' : 'Saved';
  const searchLabel = isBn ? 'অনুসন্ধান' : 'Search';

  return `
    <nav class="navbar navbar-expand-xl site-navbar" id="main-nav" aria-label="Main Navigation">
      <div class="container">
        <a class="navbar-brand navbar-brand-logo me-2" href="/" id="brand-link">
          <span class="brand-icon-wrap text-warning flex-shrink-0"><i class="bi bi-compass-fill" aria-hidden="true"></i></span>
          <div class="d-flex flex-column lh-1 brand-text-wrap">
            <span class="brand-title-text fw-bold text-truncate" id="brand-title">${escapeHtml(brandTitle)}</span>
            <small class="text-white-50 brand-subtitle-text text-truncate" id="brand-subtitle">${escapeHtml(brandSubtitle)}</small>
          </div>
          <span class="navbar-brand-badge d-none d-sm-inline-block d-xl-none d-xxl-inline-block ms-1 flex-shrink-0">Official</span>
        </a>

        <button 
          class="navbar-toggler site-navbar-toggler text-white border-0 ms-auto" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarContent" 
          aria-controls="navbarContent" 
          aria-expanded="false" 
          aria-label="${isBn ? 'নেভিগেশন মেনু খুলুন বা বন্ধ করুন' : 'Toggle navigation'}"
          id="navbar-toggler-btn"
        >
          <i class="bi bi-list fs-2" aria-hidden="true"></i>
        </button>

        <div class="collapse navbar-collapse site-navbar-collapse" id="navbarContent">
          <ul class="navbar-nav me-auto mb-2 mb-xl-0 ms-xl-2 ms-xxl-3 pt-3 pt-xl-0 gap-1">
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'home' ? 'active' : ''}" href="/" data-nav="home" id="nav-item-home" ${options.activeNav === 'home' ? 'aria-current="page"' : ''}>
                <span>${escapeHtml(navHome)}</span>
                <i class="bi bi-chevron-right d-xl-none opacity-50 small" aria-hidden="true"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'divisions' || options.activeNav === 'division-detail' ? 'active' : ''}" href="/divisions/" data-nav="divisions" id="nav-item-divisions" ${options.activeNav === 'divisions' || options.activeNav === 'division-detail' ? 'aria-current="page"' : ''}>
                <span>${escapeHtml(navDivisions)}</span>
                <i class="bi bi-chevron-right d-xl-none opacity-50 small" aria-hidden="true"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'districts' || options.activeNav === 'district-detail' ? 'active' : ''}" href="/districts/" data-nav="districts" id="nav-item-districts" ${options.activeNav === 'districts' || options.activeNav === 'district-detail' ? 'aria-current="page"' : ''}>
                <span>${escapeHtml(navDistricts)}</span>
                <i class="bi bi-chevron-right d-xl-none opacity-50 small" aria-hidden="true"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'categories' || options.activeNav === 'category-detail' ? 'active' : ''}" href="/categories/" data-nav="categories" id="nav-item-categories" ${options.activeNav === 'categories' || options.activeNav === 'category-detail' ? 'aria-current="page"' : ''}>
                <span>${escapeHtml(navCategories)}</span>
                <i class="bi bi-chevron-right d-xl-none opacity-50 small" aria-hidden="true"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'spots' || options.activeNav === 'spot-detail' ? 'active' : ''}" href="/places/" data-nav="spots" id="nav-item-spots" ${options.activeNav === 'spots' || options.activeNav === 'spot-detail' ? 'aria-current="page"' : ''}>
                <span>${escapeHtml(navSpots)}</span>
                <i class="bi bi-chevron-right d-xl-none opacity-50 small" aria-hidden="true"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'guides' || options.activeNav === 'guide-detail' ? 'active' : ''}" href="/travel-guides/" data-nav="guides" id="nav-item-guides" ${options.activeNav === 'guides' || options.activeNav === 'guide-detail' ? 'aria-current="page"' : ''}>
                <span>${escapeHtml(navGuides)}</span>
                <i class="bi bi-chevron-right d-xl-none opacity-50 small" aria-hidden="true"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'planner' ? 'active' : ''}" href="/#planner" data-nav="planner" id="nav-item-planner" ${options.activeNav === 'planner' ? 'aria-current="page"' : ''}>
                <span>${escapeHtml(navPlanner)}</span>
                <i class="bi bi-chevron-right d-xl-none opacity-50 small" aria-hidden="true"></i>
              </a>
            </li>
          </ul>

          <div class="navbar-actions d-flex flex-wrap align-items-center gap-2 pt-3 pb-2 pt-xl-0 pb-xl-0 mt-2 mt-xl-0 flex-shrink-0">
            <!-- Navbar Global Search Link -->
            <a href="/search/" class="btn btn-outline-light btn-sm rounded-pill navbar-action-btn d-inline-flex align-items-center justify-content-center ${options.activeNav === 'search' ? 'active bg-warning text-dark border-warning' : ''}" id="btn-nav-search" data-nav="search" title="${escapeHtml(searchLabel)}" aria-label="${escapeHtml(searchLabel)}" ${options.activeNav === 'search' ? 'aria-current="page"' : ''}>
              <i class="bi bi-search ${options.activeNav === 'search' ? 'text-dark' : 'text-warning'}" aria-hidden="true"></i>
              <span class="d-xl-none ms-1">${escapeHtml(searchLabel)}</span>
            </a>

            <!-- Saved Favorites Trigger -->
            <button type="button" class="btn btn-outline-light btn-sm rounded-pill px-3 position-relative d-inline-flex align-items-center justify-content-center navbar-action-btn" id="btn-saved-places" title="${escapeHtml(savedLabel)}" aria-label="${escapeHtml(savedLabel)} (${options.savedCount})">
              <i class="bi bi-bookmark-heart text-danger" aria-hidden="true"></i>
              <span id="label-saved-text" class="d-inline d-xl-none d-xxl-inline ms-1">${escapeHtml(savedLabel)}</span>
              <span class="badge bg-danger ms-1" id="saved-badge-count">${options.savedCount}</span>
            </button>

            <!-- Language Switcher in Navbar -->
            <button type="button" class="lang-switcher-btn flex-shrink-0" id="lang-switcher" aria-label="${isBn ? 'Switch website language to English' : 'ওয়েবসাইটের ভাষা বাংলায় পরিবর্তন করুন'}">
              <i class="bi bi-translate" aria-hidden="true"></i>
              <span id="lang-btn-text">${escapeHtml(langLabel)}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `;
}
