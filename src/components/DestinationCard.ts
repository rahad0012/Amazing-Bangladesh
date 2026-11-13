/**
 * Reusable Destination / Tourist Spot Card Component
 * Includes Image, Spot Name, District Name, Category Badge, Short Description, Details Link, Bookmark Toggle
 */

import { TouristSpot, Division, District, Category } from '../data/bangladeshData';
import { Language } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';

export interface DestinationCardProps {
  spot: TouristSpot;
  division?: Division;
  district?: District;
  category?: Category;
  isBookmarked: boolean;
  lang: Language;
  colClass?: string;
}

const FALLBACK_SPOT_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=600&q=80';

export function renderDestinationCard(props: DestinationCardProps): string {
  const {
    spot,
    division,
    district,
    category,
    isBookmarked,
    lang,
    colClass = 'col-lg-4 col-md-6 mb-4'
  } = props;
  const isBn = lang === 'bn';
  const name = isBn ? spot.name_bn : spot.name_en;
  const shortDesc = isBn ? spot.short_desc_bn : spot.short_desc_en;
  const divisionName = (isBn ? division?.name_bn : division?.name_en) || '';
  const districtName = (isBn ? district?.name_bn : district?.name_en) || '';
  const locationLabel = [districtName, divisionName].filter(Boolean).join(', ');
  const categoryName = category ? (isBn ? category.name_bn : category.name_en) : '';
  const detailLabel = isBn ? 'বিস্তারিত দেখুন' : 'View Details';
  const saveLabel = isBn ? 'পছন্দের তালিকায় রাখুন' : 'Save Place';
  const hasRating = typeof spot.rating === 'number' && Number.isFinite(spot.rating) && spot.rating > 0;
  const imgSrc = optimizeImageUrl(spot.image_url, 600) || FALLBACK_SPOT_IMAGE;

  return `
    <div class="${colClass}">
      <div class="card-travel h-100 d-flex flex-column" data-spot-card="${escapeHtml(spot.id)}">
        <div class="card-travel-img-box position-relative">
          <img 
            src="${imgSrc}" 
            alt="${escapeHtml(name)}${districtName ? ` - ${escapeHtml(districtName)}` : ''}" 
            class="card-travel-img" 
            loading="lazy" 
            decoding="async"
            onerror="this.onerror=null;this.src='${FALLBACK_SPOT_IMAGE}';"
          >
          ${locationLabel ? `
            <span class="card-badge-division">
              <i class="bi bi-geo-alt me-1"></i>${escapeHtml(locationLabel)}
            </span>
          ` : ''}
          ${hasRating ? `
            <span class="card-badge-rating">
              <i class="bi bi-star-fill text-warning me-1"></i>${spot.rating}
            </span>
          ` : ''}
          <button 
            class="card-bookmark-btn ${isBookmarked ? 'active' : ''}" 
            data-spot-bookmark="${escapeHtml(spot.id)}" 
            title="${escapeHtml(saveLabel)}"
            aria-label="${escapeHtml(saveLabel)}"
          >
            <i class="bi ${isBookmarked ? 'bi-heart-fill' : 'bi-heart'}"></i>
          </button>
        </div>

        <div class="card-travel-body d-flex flex-column flex-grow-1 p-3">
          <div class="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
            ${categoryName ? `
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                <i class="bi ${escapeHtml(category?.icon || 'bi-tag')} me-1"></i>${escapeHtml(categoryName)}
              </span>
            ` : '<span></span>'}
            ${districtName ? `
              <div class="small text-muted d-flex align-items-center">
                <i class="bi bi-pin-map-fill text-warning me-1"></i>
                <span>${escapeHtml(districtName)}</span>
              </div>
            ` : ''}
          </div>

          <h4 class="card-travel-title fw-bold mb-2">${escapeHtml(name)}</h4>
          <p class="card-travel-desc small text-secondary flex-grow-1 mb-3">${escapeHtml(shortDesc)}</p>

          <button class="btn btn-primary-bd btn-sm w-100 mt-auto spot-detail-btn" data-spot-id="${escapeHtml(spot.id)}">
            <i class="bi bi-info-circle me-1"></i>${escapeHtml(detailLabel)}
          </button>
        </div>
      </div>
    </div>
  `;
}
