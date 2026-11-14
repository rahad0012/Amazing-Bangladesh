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
  categories?: Category[];
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
    categories,
    isBookmarked,
    lang,
    colClass = 'col-lg-4 col-md-6 mb-4'
  } = props;
  const isBn = lang === 'bn';
  const name = (isBn ? spot.name_bn : spot.name_en) || spot.name_en || spot.name_bn || '';
  const shortDesc = (isBn ? spot.short_desc_bn : spot.short_desc_en) || spot.short_desc_en || spot.short_desc_bn || '';
  const divisionName = (isBn ? division?.name_bn : division?.name_en) || division?.name_en || division?.name_bn || '';
  const districtName = (isBn ? district?.name_bn : district?.name_en) || district?.name_en || district?.name_bn || '';
  const locationLabel = [districtName, divisionName].filter(Boolean).join(', ');
  const resolvedCategories: Category[] =
    categories && categories.length > 0
      ? categories
      : category
        ? [category]
        : [];
  const primaryCategory = resolvedCategories[0];
  const extraCategoriesCount = Math.max(0, resolvedCategories.length - 1);
  const categoryName = primaryCategory
    ? ((isBn ? primaryCategory.name_bn : primaryCategory.name_en) || primaryCategory.name_en || primaryCategory.name_bn || '')
    : '';
  const detailLabel = isBn ? 'বিস্তারিত দেখুন' : 'View Details';
  const saveLabel = isBn ? 'পছন্দের তালিকায় রাখুন' : 'Save Place';
  const hasRating = typeof spot.rating === 'number' && Number.isFinite(spot.rating) && spot.rating > 0;
  const spotSlug = encodeURIComponent((spot.slug || spot.id).toLowerCase());
  const detailHref = `/places/${spotSlug}/`;
  const imgSrc = optimizeImageUrl(spot.image_url, 600) || FALLBACK_SPOT_IMAGE;

  return `
    <div class="${colClass}">
      <article class="card-travel h-100 d-flex flex-column" data-spot-card="${escapeHtml(spot.id)}">
        <div class="card-travel-img-box position-relative">
          <a href="${detailHref}" class="d-block w-100 h-100 text-decoration-none spot-detail-link" data-spot-slug="${spotSlug}" data-spot-id="${escapeHtml(spot.id)}" aria-label="${escapeHtml(name)}">
            <img 
              src="${imgSrc}" 
              alt="${escapeHtml(name)}${districtName ? ` - ${escapeHtml(districtName)}` : ''}" 
              class="card-travel-img" 
              loading="lazy" 
              decoding="async"
              onerror="this.onerror=null;this.src='${FALLBACK_SPOT_IMAGE}';"
            >
          </a>
          ${locationLabel ? `
            <span class="card-badge-division">
              <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${escapeHtml(locationLabel)}
            </span>
          ` : ''}
          ${hasRating ? `
            <span class="card-badge-rating">
              <i class="bi bi-star-fill text-warning me-1" aria-hidden="true"></i>${spot.rating}
            </span>
          ` : ''}
          <button 
            type="button"
            class="card-bookmark-btn ${isBookmarked ? 'active' : ''}" 
            data-spot-bookmark="${escapeHtml(spot.id)}" 
            title="${escapeHtml(saveLabel)}"
            aria-label="${escapeHtml(saveLabel)}"
            aria-pressed="${isBookmarked ? 'true' : 'false'}"
          >
            <i class="bi ${isBookmarked ? 'bi-heart-fill' : 'bi-heart'}" aria-hidden="true"></i>
          </button>
        </div>

        <div class="card-travel-body d-flex flex-column flex-grow-1 p-3">
          <div class="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
            ${categoryName ? `
              <div class="d-flex align-items-center gap-1 flex-wrap">
                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                  <i class="bi ${escapeHtml(primaryCategory?.icon || 'bi-tag')} me-1" aria-hidden="true"></i>${escapeHtml(categoryName)}
                </span>
                ${extraCategoriesCount > 0 ? `
                  <span class="badge bg-light text-secondary border px-2 py-1 small" title="${escapeHtml(resolvedCategories.slice(1).map(c => isBn ? c.name_bn : c.name_en).join(', '))}">
                    +${extraCategoriesCount}
                  </span>
                ` : ''}
              </div>
            ` : '<span></span>'}
            ${districtName ? `
              <div class="small text-muted d-flex align-items-center">
                <i class="bi bi-pin-map-fill text-warning me-1" aria-hidden="true"></i>
                <span>${escapeHtml(districtName)}</span>
              </div>
            ` : ''}
          </div>

          <h3 class="h5 card-travel-title fw-bold mb-2">
            <a href="${detailHref}" class="text-decoration-none text-reset spot-detail-link" data-spot-slug="${spotSlug}" data-spot-id="${escapeHtml(spot.id)}">
              ${escapeHtml(name)}
            </a>
          </h3>
          <p class="card-travel-desc small text-secondary flex-grow-1 mb-3">${escapeHtml(shortDesc)}</p>

          <a href="${detailHref}" class="btn btn-primary-bd btn-sm w-100 mt-auto spot-detail-link" data-spot-slug="${spotSlug}" data-spot-id="${escapeHtml(spot.id)}">
            <i class="bi bi-info-circle me-1" aria-hidden="true"></i>${escapeHtml(detailLabel)}
          </a>
        </div>
      </article>
    </div>
  `;
}
