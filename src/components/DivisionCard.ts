/**
 * Reusable Division Card Component
 * Represents one of the 8 official administrative divisions of Bangladesh
 */

import { Division } from '../data/bangladeshData';
import { Language } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl, formatAreaSqKm } from '../utils/formatUtils';

export interface DivisionCardProps {
  division: Division;
  lang: Language;
}

export function renderDivisionCard(props: DivisionCardProps): string {
  const { division, lang } = props;
  const isBn = lang === 'bn';
  const name = isBn ? division.name_bn : division.name_en;
  const desc = isBn ? division.description_bn : division.description_en;
  const hq = isBn ? division.headquarters_bn : division.headquarters_en;
  const districtCountLabel = isBn ? 'টি জেলা' : 'Districts';
  const exploreLabel = isBn ? 'জেলাসমূহ দেখুন' : 'Explore Districts';

  return `
    <div class="col-lg-3 col-md-6 mb-4">
      <div class="card-travel division-card-action" data-division-id="${division.id}" style="cursor: pointer;">
        <div class="card-travel-img-box">
          <img 
            src="${optimizeImageUrl(division.image_url, 600)}" 
            alt="${escapeHtml(name)} - ${escapeHtml(hq)}" 
            class="card-travel-img" 
            loading="lazy" 
            decoding="async"
          >
          <span class="card-badge-division">
            <i class="bi bi-geo-alt me-1"></i>${division.districts_count} ${districtCountLabel}
          </span>
          <span class="card-badge-rating">
            <i class="bi bi-building me-1"></i>${escapeHtml(hq)}
          </span>
        </div>
        <div class="card-travel-body">
          <h4 class="card-travel-title">${escapeHtml(name)}</h4>
          <div class="card-travel-location">
            <i class="bi bi-rulers"></i> ${formatAreaSqKm(division.area_sq_km, lang)}
          </div>
          <p class="card-travel-desc small">${escapeHtml(desc)}</p>
          <button class="btn btn-outline-bd btn-sm w-100 mt-auto">
            <i class="bi bi-arrow-right-circle me-1"></i>${exploreLabel} (${division.districts_count})
          </button>
        </div>
      </div>
    </div>
  `;
}
