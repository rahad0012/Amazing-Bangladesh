/**
 * Reusable Category Card & Interactive Filter Pill Component
 */

import { Category } from '../data/bangladeshData';
import { Language } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';

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
  const nameBn = category.name_bn || category.name_en;
  const nameEn = category.name_en || category.name_bn;
  const primaryName = isBn ? nameBn : nameEn;
  const secondaryName = isBn ? nameEn : nameBn;
  const desc = (isBn ? category.description_bn : category.description_en) || category.description_en || category.description_bn || '';
  const slug = encodeURIComponent((category.slug || category.id).toLowerCase());
  const detailHref = `/categories/${slug}/`;
  const formattedCount = isBn ? count.toLocaleString('bn-BD') : String(count);
  const placesLabel = isBn ? 'টি প্রকাশিত স্থান' : (count === 1 ? 'Published Spot' : 'Published Spots');
  const exploreLabel = isBn ? 'ক্যাটাগরি ঘুরে দেখুন' : 'Explore Category';
  const fallbackImg = 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80';
  const coverImg = category.image_url || fallbackImg;

  return `
    <div class="col-xl-3 col-lg-4 col-sm-6 mb-4">
      <article class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden category-card-action bg-white">
        <a href="${detailHref}" class="d-block position-relative text-decoration-none category-detail-link" data-category-slug="${slug}" style="height: 175px; background: #123C32;" aria-label="${escapeHtml(nameBn)} / ${escapeHtml(nameEn)}">
          <img
            src="${escapeHtml(optimizeImageUrl(coverImg, 600) || fallbackImg)}"
            alt="${escapeHtml(primaryName)} (${escapeHtml(secondaryName)})"
            class="w-100 h-100"
            style="object-fit: cover; transition: transform 0.35s ease;"
            loading="lazy"
            decoding="async"
            onerror="this.onerror=null;this.src='${fallbackImg}';"
          >
          <div class="position-absolute top-0 start-0 w-100 h-100" style="background: linear-gradient(to top, rgba(18, 60, 50, 0.94) 8%, rgba(18, 60, 50, 0.35) 60%, rgba(18, 60, 50, 0.15) 100%);"></div>

          <div class="position-absolute top-0 end-0 m-3">
            <span class="badge bg-dark bg-opacity-75 text-warning border border-warning border-opacity-25 px-2 py-1 rounded-pill small">
              ${escapeHtml(formattedCount)} ${escapeHtml(placesLabel)}
            </span>
          </div>

          <div class="position-absolute bottom-0 start-0 end-0 p-3 d-flex align-items-center gap-2">
            <div class="rounded-circle bg-warning text-dark fs-5 shadow-sm d-flex align-items-center justify-content-center flex-shrink-0" style="width: 42px; height: 42px;">
              <i class="bi ${escapeHtml(category.icon || 'bi-compass')}" aria-hidden="true"></i>
            </div>
            <div class="min-w-0">
              <h3 class="h5 fw-bold text-white mb-0 text-truncate" style="text-shadow: 0 2px 4px rgba(0,0,0,0.6);">${escapeHtml(primaryName)}</h3>
              <div class="small text-warning fw-semibold text-truncate">${escapeHtml(secondaryName)}</div>
            </div>
          </div>
        </a>

        <div class="card-body p-3 d-flex flex-column">
          <p class="small text-secondary mb-3 flex-grow-1" style="font-size: 0.9rem; line-height: 1.55;">${escapeHtml(desc)}</p>
          <div class="d-flex justify-content-between align-items-center pt-2 border-top mb-3 small">
            <span class="text-muted">
              <i class="bi bi-geo-alt-fill text-success me-1"></i>${escapeHtml(formattedCount)} ${escapeHtml(placesLabel)}
            </span>
          </div>
          <a
            href="${detailHref}"
            class="btn btn-primary-bd btn-sm w-100 mt-auto category-detail-link"
            data-category-slug="${slug}"
          >
            <span>${escapeHtml(exploreLabel)}</span>
            <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
          </a>
        </div>
      </article>
    </div>
  `;
}
