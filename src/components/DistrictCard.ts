/**
 * Reusable District Card Component
 * Represents one of the 64 official administrative districts of Bangladesh
 * Includes district cover photography, Bengali & English names, division badge, famous-for tag, and explore CTA
 */

import { District, Division } from '../data/bangladeshData';
import { Language } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';

const FALLBACK_DISTRICT_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=600&q=80';

export interface DistrictCardProps {
  district: District;
  division?: Division;
  spotCount?: number;
  lang: Language;
  mode?: 'navigate' | 'filter';
  colClass?: string;
}

export function renderDistrictCard(props: DistrictCardProps): string {
  const { district, division, lang, mode = 'filter', colClass = 'col-xl-3 col-lg-4 col-md-6 mb-4' } = props;
  const isBn = lang === 'bn';
  const primaryName = isBn ? district.name_bn : district.name_en;
  const secondaryName = isBn ? district.name_en : district.name_bn;
  const famousFor = isBn ? district.famous_for_bn : district.famous_for_en;
  const desc = isBn ? district.description_bn : district.description_en;
  const divName = isBn ? division?.name_bn : division?.name_en;
  const famousLabel = isBn ? 'বিখ্যাত' : 'Famous for';
  const exploreLabel = mode === 'navigate'
    ? (isBn ? 'জেলা বিস্তারিত' : 'Explore District')
    : (isBn ? 'দর্শনীয় স্থান দেখুন' : 'Explore Spots');
  const slug = encodeURIComponent((district.slug || district.id).toLowerCase());
  const detailHref = `/districts/${slug}/`;
  const imageUrl = district.image_url || FALLBACK_DISTRICT_IMAGE;

  const coverBlock = `
    <div class="position-relative" style="height: 155px; overflow: hidden; background: #e2e8f0;">
      <img 
        src="${optimizeImageUrl(imageUrl, 500)}" 
        alt="${escapeHtml(district.name_en)} (${escapeHtml(district.name_bn)})" 
        class="w-100 h-100" 
        style="object-fit: cover;"
        loading="lazy"
        decoding="async"
        onerror="this.onerror=null;this.src='${FALLBACK_DISTRICT_IMAGE}';"
      >
      <div class="position-absolute top-0 end-0 m-2">
        <span class="badge bg-secondary-bd text-white small shadow-sm">${escapeHtml(divName || district.division_id)}</span>
      </div>
      <div class="position-absolute bottom-0 start-0 w-100 p-2 px-3" style="background: linear-gradient(transparent, rgba(18, 60, 50, 0.92));">
        <h5 class="fw-bold text-white mb-0 lh-sm" style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${escapeHtml(primaryName)}</h5>
        <div class="small text-warning fw-medium" style="font-size: 0.78rem; text-shadow: 0 1px 2px rgba(0,0,0,0.75);">
          ${escapeHtml(secondaryName)}
        </div>
      </div>
    </div>
  `;

  return `
    <div class="${colClass}">
      <article class="district-card-mini h-100 d-flex flex-column shadow-sm rounded-4 overflow-hidden bg-white border">
        ${mode === 'navigate'
          ? `<a href="${detailHref}" class="text-decoration-none d-block district-detail-link" data-district-slug="${slug}" aria-label="${escapeHtml(district.name_en)} (${escapeHtml(district.name_bn)})">${coverBlock}</a>`
          : coverBlock}

        <div class="p-3 d-flex flex-column flex-grow-1">
          <div class="d-flex justify-content-between align-items-center gap-2 mb-2 pb-1 border-bottom border-light-subtle">
            <span class="small fw-semibold text-primary-bd">${escapeHtml(district.name_bn)}</span>
            <span class="small text-muted">${escapeHtml(district.name_en)}</span>
          </div>
          <div class="small text-muted mb-2">
            <i class="bi bi-award-fill text-warning me-1"></i>
            <strong>${famousLabel}:</strong> <span class="text-dark">${escapeHtml(famousFor)}</span>
          </div>
          <p class="small text-secondary mb-3 flex-grow-1" style="font-size: 0.85rem; line-height: 1.45;">
            ${escapeHtml(desc)}
          </p>
          ${mode === 'navigate'
            ? `<a href="${detailHref}" class="btn btn-primary-bd btn-sm w-100 district-detail-link mt-auto" data-district-slug="${slug}">
                <i class="bi bi-compass me-1"></i>${exploreLabel}
              </a>`
            : `<button type="button" class="btn btn-outline-bd btn-sm w-100 district-explore-btn mt-auto" data-district-id="${escapeHtml(district.id)}">
                <i class="bi bi-compass me-1"></i>${exploreLabel}
              </button>`}
        </div>
      </article>
    </div>
  `;
}

