/**
 * Reusable District Card Component
 * Represents one of the 64 official administrative districts of Bangladesh
 */

import { District, Division } from '../data/bangladeshData';
import { Language } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';

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
  const exploreLabel = isBn ? 'দর্শনীয় স্থান' : 'Explore Spots';

  return `
    <div class="col-xl-3 col-lg-4 col-md-6 mb-3">
      <div class="district-card-mini">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="fw-bold text-primary-bd mb-0">${escapeHtml(name)}</h5>
          <span class="badge bg-secondary-bd text-white small">${escapeHtml(divName || '')}</span>
        </div>
        <div class="small text-muted mb-2">
          <i class="bi bi-award text-warning me-1"></i>
          <strong>${famousLabel}:</strong> ${escapeHtml(famousFor)}
        </div>
        <p class="small text-secondary mb-3 flex-grow-1" style="font-size: 0.85rem;">
          ${escapeHtml(desc)}
        </p>
        <button class="btn btn-outline-bd btn-sm w-100 district-explore-btn" data-district-id="${district.id}">
          <i class="bi bi-compass me-1"></i>${exploreLabel} (${spotCount})
        </button>
      </div>
    </div>
  `;
}
