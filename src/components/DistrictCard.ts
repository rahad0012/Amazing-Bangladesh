/**
 * Reusable District Card Component
 * Represents one of the 64 official administrative districts of Bangladesh
 * Includes district cover photography, division badge, famous-for tag, and explore CTA
 */

import { District, Division } from '../data/bangladeshData';
import { Language } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';

export interface DistrictCardProps {
  district: District;
  division?: Division;
  spotCount: number;
  lang: Language;
}

export function renderDistrictCard(props: DistrictCardProps): string {
  const { district, division, spotCount, lang } = props;
  const isBn = lang === 'bn';
  const name = isBn ? district.name_bn : district.name_en;
  const famousFor = isBn ? district.famous_for_bn : district.famous_for_en;
  const desc = isBn ? district.description_bn : district.description_en;
  const divName = isBn ? division?.name_bn : division?.name_en;
  const famousLabel = isBn ? 'বিখ্যাত' : 'Famous for';
  const exploreLabel = isBn ? 'দর্শনীয় স্থান দেখুন' : 'Explore Spots';
  const imageUrl = district.image_url || 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=600&q=80';

  return `
    <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
      <div class="district-card-mini h-100 d-flex flex-column shadow-sm rounded-4 overflow-hidden bg-white border">
        <div class="position-relative" style="height: 140px; overflow: hidden; background: #e2e8f0;">
          <img 
            src="${optimizeImageUrl(imageUrl, 500)}" 
            alt="${escapeHtml(name)}" 
            class="w-100 h-100" 
            style="object-fit: cover;"
            loading="lazy"
            decoding="async"
          >
          <div class="position-absolute top-0 end-0 m-2">
            <span class="badge bg-secondary-bd text-white small shadow-sm">${escapeHtml(divName || '')}</span>
          </div>
          <div class="position-absolute bottom-0 start-0 w-100 p-2" style="background: linear-gradient(transparent, rgba(18, 60, 50, 0.9));">
            <h5 class="fw-bold text-white mb-0 ps-1" style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${escapeHtml(name)}</h5>
          </div>
        </div>

        <div class="p-3 d-flex flex-column flex-grow-1">
          <div class="small text-muted mb-2">
            <i class="bi bi-award-fill text-warning me-1"></i>
            <strong>${famousLabel}:</strong> <span class="text-dark">${escapeHtml(famousFor)}</span>
          </div>
          <p class="small text-secondary mb-3 flex-grow-1" style="font-size: 0.85rem; line-height: 1.45;">
            ${escapeHtml(desc)}
          </p>
          <button class="btn btn-outline-bd btn-sm w-100 district-explore-btn mt-auto" data-district-id="${district.id}">
            <i class="bi bi-compass me-1"></i>${exploreLabel} (${spotCount})
          </button>
        </div>
      </div>
    </div>
  `;
}
