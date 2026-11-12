/**
 * Reusable Navbar Component
 * Features: Brand logo, Navigation links, Saved Places counter, Language Switcher, Admin Portal trigger
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
  const navDistricts = isBn ? '৬৪ জেলা গাইড' : '64 Districts';
  const navSpots = isBn ? 'দর্শনীয় স্থান' : 'Attractions';
  const navGuides = isBn ? 'ভ্রমণ নির্দেশিকা' : 'Travel Guides';
  const navPlanner = isBn ? 'ট্যুর প্ল্যানার' : 'Trip Planner';
  const langLabel = isBn ? 'English' : 'বাংলা';
  const savedLabel = isBn ? 'পছন্দ' : 'Saved';
  const adminLabel = isBn ? 'অ্যাডমিন' : 'Admin';

  return `
    <nav class="navbar navbar-expand-lg site-navbar sticky-top" id="main-nav" aria-label="Main Navigation">
      <div class="container">
        <a class="navbar-brand navbar-brand-logo" href="#" id="brand-link">
          <span class="fs-4 text-warning"><i class="bi bi-compass-fill"></i></span>
          <div class="d-flex flex-column lh-1">
            <span class="fs-5 fw-bold" id="brand-title">${escapeHtml(brandTitle)}</span>
            <small class="text-white-50 fs-8" id="brand-subtitle">${escapeHtml(brandSubtitle)}</small>
          </div>
          <span class="navbar-brand-badge ms-2">Official</span>
        </a>

        <button 
          class="navbar-toggler text-white border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarContent" 
          aria-controls="navbarContent" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <i class="bi bi-list fs-2"></i>
        </button>

        <div class="collapse navbar-collapse" id="navbarContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-1">
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'home' ? 'active' : ''}" href="#" data-nav="home" id="nav-item-home">
                ${escapeHtml(navHome)}
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'divisions' ? 'active' : ''}" href="#divisions" data-nav="divisions" id="nav-item-divisions">
                ${escapeHtml(navDivisions)}
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'districts' ? 'active' : ''}" href="#districts" data-nav="districts" id="nav-item-districts">
                ${escapeHtml(navDistricts)}
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'spots' ? 'active' : ''}" href="#spots" data-nav="spots" id="nav-item-spots">
                ${escapeHtml(navSpots)}
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'guides' ? 'active' : ''}" href="#guides" data-nav="guides" id="nav-item-guides">
                ${escapeHtml(navGuides)}
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link-custom ${options.activeNav === 'planner' ? 'active' : ''}" href="#planner" data-nav="planner" id="nav-item-planner">
                ${escapeHtml(navPlanner)}
              </a>
            </li>
          </ul>

          <div class="d-flex align-items-center gap-2 mt-3 mt-lg-0">
            <!-- Saved Favorites Trigger -->
            <button class="btn btn-outline-light btn-sm rounded-pill px-3 position-relative" id="btn-saved-places" title="${savedLabel}">
              <i class="bi bi-bookmark-heart text-danger"></i>
              <span id="label-saved-text" class="d-none d-xl-inline ms-1">${escapeHtml(savedLabel)}</span>
              <span class="badge bg-danger ms-1" id="saved-badge-count">${options.savedCount}</span>
            </button>

            <!-- Language Switcher in Navbar -->
            <button class="lang-switcher-btn" id="lang-switcher" aria-label="Switch Language">
              <i class="bi bi-translate"></i>
              <span id="lang-btn-text">${escapeHtml(langLabel)}</span>
            </button>

            <!-- Admin / Firebase Portal Trigger -->
            <button class="btn btn-warning btn-sm fw-semibold rounded-pill px-3 text-dark" id="btn-admin-portal" title="Admin CMS">
              <i class="bi bi-shield-lock-fill me-1"></i>
              <span id="label-admin-text">${escapeHtml(adminLabel)}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `;
}
