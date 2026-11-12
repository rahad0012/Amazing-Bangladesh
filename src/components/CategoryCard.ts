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
  const placesLabel = isBn ? 'টি স্থান' : 'Places';

  return `
    <div class="col-md-4 col-sm-6 mb-3">
      <div class="p-3 bg-white rounded-3 border h-100 shadow-sm cursor-pointer category-card-action" data-cat-filter="${category.id}">
        <div class="d-flex align-items-center gap-3">
          <div class="p-3 rounded-circle bg-success-subtle text-success fs-4">
            <i class="bi ${escapeHtml(category.icon)}"></i>
          </div>
          <div>
            <h6 class="fw-bold text-primary-bd mb-0">${escapeHtml(name)}</h6>
            <span class="badge bg-light text-secondary border small">${count} ${placesLabel}</span>
          </div>
        </div>
        <p class="small text-muted mt-2 mb-0">${escapeHtml(desc)}</p>
      </div>
    </div>
  `;
}
