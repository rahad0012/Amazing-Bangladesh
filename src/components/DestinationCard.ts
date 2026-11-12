/**
 * Reusable Destination / Tourist Spot Card Component
 */

import { TouristSpot, Division, District } from '../data/bangladeshData';
import { Language } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';

export interface DestinationCardProps {
  spot: TouristSpot;
  division?: Division;
  district?: District;
  isBookmarked: boolean;
  lang: Language;
}

export function renderDestinationCard(props: DestinationCardProps): string {
  const { spot, division, district, isBookmarked, lang } = props;
  const isBn = lang === 'bn';
  const name = isBn ? spot.name_bn : spot.name_en;
  const shortDesc = isBn ? spot.short_desc_bn : spot.short_desc_en;
  const divisionName = isBn ? division?.name_bn : division?.name_en;
  const districtName = isBn ? district?.name_bn : district?.name_en;
  const detailLabel = isBn ? 'বিস্তারিত দেখুন' : 'View Details';
  const saveLabel = isBn ? 'পছন্দের তালিকায় রাখুন' : 'Save Place';

  return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="card-travel" data-spot-card="${spot.id}">
        <div class="card-travel-img-box">
          <img 
            src="${optimizeImageUrl(spot.image_url, 600)}" 
            alt="${escapeHtml(name)} - ${escapeHtml(districtName || '')}" 
            class="card-travel-img" 
            loading="lazy" 
            decoding="async"
          >
          <span class="card-badge-division">
            <i class="bi bi-geo-alt me-1"></i>${escapeHtml(districtName || '')}, ${escapeHtml(divisionName || '')}
          </span>
          <span class="card-badge-rating">
            <i class="bi bi-star-fill text-warning"></i> ${spot.rating}
          </span>
          <button 
            class="card-bookmark-btn ${isBookmarked ? 'active' : ''}" 
            data-spot-bookmark="${spot.id}" 
            title="${saveLabel}"
            aria-label="${saveLabel}"
          >
            <i class="bi ${isBookmarked ? 'bi-heart-fill' : 'bi-heart'}"></i>
          </button>
        </div>
        <div class="card-travel-body">
          <h4 class="card-travel-title">${escapeHtml(name)}</h4>
          <div class="card-travel-location">
            <i class="bi bi-pin-map text-warning"></i>
            <span>${escapeHtml(districtName || '')}</span>
          </div>
          <p class="card-travel-desc">${escapeHtml(shortDesc)}</p>
          <button class="btn btn-primary-bd btn-sm w-100 mt-auto spot-detail-btn" data-spot-id="${spot.id}">
            <i class="bi bi-info-circle me-1"></i>${detailLabel}
          </button>
        </div>
      </div>
    </div>
  `;
}
