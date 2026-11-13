/**
 * Reusable Division Card Component
 * Represents one of the 8 official administrative divisions of Bangladesh
 */

import { Division } from '../data/bangladeshData';
import { Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl, formatAreaSqKm } from '../utils/formatUtils';

export interface DivisionCardProps {
  division: Division;
  lang: Language;
  ctaLabel?: string;
}

const FALLBACK_DIVISION_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=600&q=80';

export function renderDivisionCard(props: DivisionCardProps): string {
  const { division, lang, ctaLabel } = props;
  const isBn = lang === 'bn';
  const name = isBn ? division.name_bn : division.name_en;
  const desc = isBn ? division.description_bn : division.description_en;
  const hq = isBn ? division.headquarters_bn : division.headquarters_en;
  const districtCountLabel = isBn ? 'টি জেলা' : 'Districts';
  const localizedDistrictCount = formatLocalizedNumber(division.districts_count, lang);
  const exploreLabel = ctaLabel || (isBn ? 'ঘুরে দেখুন' : 'Explore');
  const slug = encodeURIComponent(division.slug || division.id);
  const imageSrc = optimizeImageUrl(division.image_url || division.thumbnail_url || FALLBACK_DIVISION_IMAGE, 600);

  return `
    <div class="col-lg-3 col-md-6 mb-4">
      <article class="card-travel division-card-action h-100" data-division-id="${escapeHtml(division.id)}" data-division-slug="${escapeHtml(division.slug || division.id)}" style="cursor: pointer;">
        <div class="card-travel-img-box">
          <img 
            src="${imageSrc}" 
            alt="${escapeHtml(name)} - ${escapeHtml(hq)}" 
            class="card-travel-img" 
            loading="lazy" 
            decoding="async"
            onerror="this.onerror=null;this.src='${FALLBACK_DIVISION_IMAGE}';"
          >
          <span class="card-badge-division">
            <i class="bi bi-geo-alt me-1"></i>${localizedDistrictCount} ${districtCountLabel}
          </span>
          <span class="card-badge-rating">
            <i class="bi bi-building me-1"></i>${escapeHtml(hq)}
          </span>
        </div>
        <div class="card-travel-body">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
            <h3 class="card-travel-title mb-0" style="font-size: 1.18rem;">${escapeHtml(isBn ? division.name_bn : division.name_en)}</h3>
            <span class="badge bg-light text-secondary border small">${escapeHtml(isBn ? division.name_en : division.name_bn)}</span>
          </div>
          <div class="card-travel-location">
            <i class="bi bi-rulers"></i> ${formatAreaSqKm(division.area_sq_km, lang)}
          </div>
          <p class="card-travel-desc small">${escapeHtml(desc)}</p>
          <a 
            href="/divisions/${slug}/" 
            class="btn btn-primary-bd btn-sm w-100 mt-auto division-explore-link" 
            data-division-id="${escapeHtml(division.id)}"
            data-division-slug="${escapeHtml(division.slug || division.id)}"
          >
            <i class="bi bi-compass me-1"></i>${escapeHtml(exploreLabel)}
          </a>
        </div>
      </article>
    </div>
  `;
}
