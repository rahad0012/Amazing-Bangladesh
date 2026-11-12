/**
 * Reusable Category Card & Interactive Filter Pill Component
 */

import { Category } from '../data/bangladeshData';
import { Language } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';

export interface CategoryComponentProps {
  category: Category;
  isActive: boolean;
  lang: Language;
}

export function renderCategoryPill(props: CategoryComponentProps): string {
  const { category, isActive, lang } = props;
  const isBn = lang === 'bn';
  const name = isBn ? category.name_bn : category.name_en;

  return `
    <button 
      class="filter-pill ${isActive ? 'active' : ''}" 
      data-cat-filter="${category.id}"
      aria-pressed="${isActive}"
    >
      <i class="bi ${escapeHtml(category.icon)}"></i> ${escapeHtml(name)}
    </button>
  `;
}

export function renderCategoryGridCard(category: Category, count: number, lang: Language): string {
  const isBn = lang === 'bn';
  const name = isBn ? category.name_bn : category.name_en;
  const desc = isBn ? category.description_bn : category.description_en;
  const placesLabel = isBn ? 'টি স্থান' : 'Destinations';
  const exploreLabel = isBn ? 'ঘুরে দেখুন' : 'Explore';

  return `
    <div class="col-xl-3 col-lg-4 col-sm-6 mb-4">
      <div 
        class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden category-card-action" 
        data-cat-filter="${category.id}" 
        style="cursor: pointer; transition: transform 0.25s ease, box-shadow 0.25s ease;"
        role="button"
        tabindex="0"
      >
        <div class="position-relative" style="height: 140px; background: #123C32;">
          ${category.image_url ? `
            <img src="${category.image_url}" alt="${escapeHtml(name)}" class="w-100 h-100" style="object-fit: cover; opacity: 0.75;" loading="lazy">
            <div class="position-absolute top-0 start-0 w-100 h-100" style="background: linear-gradient(to top, rgba(18, 60, 50, 0.95), rgba(18, 60, 50, 0.3));"></div>
          ` : `
            <div class="w-100 h-100" style="background: linear-gradient(135deg, #123C32 0%, #1C5948 100%);"></div>
          `}
          <div class="position-absolute bottom-0 start-0 p-3 d-flex align-items-center gap-2">
            <div class="rounded-circle bg-warning text-dark fs-5 shadow-sm d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
              <i class="bi ${escapeHtml(category.icon)}"></i>
            </div>
            <h5 class="fw-bold text-white mb-0" style="text-shadow: 0 2px 4px rgba(0,0,0,0.6);">${escapeHtml(name)}</h5>
          </div>
        </div>
        <div class="card-body p-3 d-flex flex-column">
          <p class="small text-muted mb-3 flex-grow-1" style="font-size: 0.88rem; line-height: 1.5;">${escapeHtml(desc)}</p>
          <div class="d-flex justify-content-between align-items-center pt-2 border-top">
            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
              ${count} ${placesLabel}
            </span>
            <span class="small fw-semibold text-primary-bd">
              ${exploreLabel} <i class="bi bi-arrow-right"></i>
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}
