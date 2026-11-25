/**
 * Dynamic Tourist Spot Details Page Template (Reusable for every published destination)
 * URLs: /places/:slug/ (e.g., /places/saint-martins-island/, /places/sajek-valley/, /places/lalbagh-fort-ahsan-manzil/)
 * Strictly loads published tourist spots only and never invents unverified costs, fees, hours, or schedules.
 */

import {
  type Division,
  type District,
  type Category,
  type TouristSpot,
  type Article
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';
import {
  renderBreadcrumbs,
  renderDestinationCard
} from '../components';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export interface SpotDetailPageProps {
  lang: Language;
  requestedSlug: string;
  spot: TouristSpot | null;
  division: Division | null;
  district: District | null;
  categories: Category[];
  nearbySpots: TouristSpot[];
  articles: Article[];
  bookmarkedIds: Set<string>;
  galleryIndex: number;
  isLoading: boolean;
  error: string | null;
  adSlotHtml?: string;
}

const FALLBACK_SPOT_HERO =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80';

const FEATURED_DIRECTORY_LINKS: ReadonlyArray<{ slug: string; nameBn: string; nameEn: string }> = [
  { slug: 'coxs-bazar-sea-beach', nameBn: 'কক্সবাজার সমুদ্র সৈকত', nameEn: "Cox's Bazar Sea Beach" },
  { slug: 'sajek-valley', nameBn: 'সাজেক ভ্যালি', nameEn: 'Sajek Valley' },
  { slug: 'sundarbans-mangrove-forest', nameBn: 'সুন্দরবন ম্যানগ্রোভ বন', nameEn: 'Sundarbans Mangrove Forest' },
  { slug: 'saint-martins-island', nameBn: 'সেন্টমার্টিন প্রবাল দ্বীপ', nameEn: "Saint Martin's Coral Island" },
  { slug: 'lalbagh-fort-ahsan-manzil', nameBn: 'লালবাগ কেল্লা ও আহসান মঞ্জিল', nameEn: 'Lalbagh Fort & Ahsan Manzil' },
  { slug: 'ratargul-swamp-forest', nameBn: 'রাতারগুল সোয়াম্প ফরেস্ট', nameEn: 'Ratargul Swamp Forest' }
];

export function getSpotGalleryImages(spot: TouristSpot): string[] {
  const candidates = [spot.image_url, ...(Array.isArray(spot.gallery_urls) ? spot.gallery_urls : [])]
    .map(u => (typeof u === 'string' ? u.trim() : ''))
    .filter(u => u.length > 0);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const url of candidates) {
    if (!seen.has(url)) {
      seen.add(url);
      unique.push(url);
    }
  }
  return unique.length > 0 ? unique : [FALLBACK_SPOT_HERO];
}

function isValidHttpUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function renderUnavailableNotice(textBn: string, textEn: string, lang: Language): string {
  const isBn = lang === 'bn';
  return `
    <div class="d-flex align-items-start gap-2 text-muted small fst-italic mb-0">
      <i class="bi bi-info-circle text-secondary mt-1 flex-shrink-0" aria-hidden="true"></i>
      <span>${escapeHtml(isBn ? textBn : textEn)}</span>
    </div>
  `;
}

export function renderSpotDetailPage(props: SpotDetailPageProps): string {
  const {
    lang,
    requestedSlug,
    spot,
    division,
    district,
    categories,
    nearbySpots,
    articles,
    bookmarkedIds,
    galleryIndex,
    isLoading,
    error,
    adSlotHtml
  } = props;

  const isBn = lang === 'bn';

  if (isLoading) {
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'দর্শনীয় স্থান', labelEn: 'Tourist Destinations', url: '/places/' },
              { labelBn: 'লোড হচ্ছে...', labelEn: 'Loading...' }
            ],
            lang
          )}
        </div>
      </div>
      <section class="hero-wrapper" style="min-height: 360px; padding: 3.5rem 0;">
        <div class="container placeholder-glow">
          <span class="placeholder col-3 bg-warning rounded-pill mb-3" style="height: 24px;"></span>
          <h1 class="placeholder col-7 bg-light rounded mb-3" style="height: 46px;"></h1>
          <p class="placeholder col-5 bg-light rounded opacity-50 mb-4" style="height: 22px;"></p>
          <div class="d-flex gap-2">
            <span class="placeholder col-2 bg-light rounded-pill opacity-50" style="height: 36px;"></span>
            <span class="placeholder col-2 bg-light rounded-pill opacity-50" style="height: 36px;"></span>
          </div>
        </div>
      </section>
      <div class="container py-5">
        <div class="row g-4">
          <div class="col-lg-8 placeholder-glow">
            <div class="bg-white rounded-4 border p-4 mb-4">
              <span class="placeholder col-4 mb-3" style="height: 28px;"></span>
              <span class="placeholder col-12 mb-2"></span>
              <span class="placeholder col-11 mb-2"></span>
              <span class="placeholder col-9"></span>
            </div>
            <div class="row g-4">
              ${renderCardSkeleton(2, 'col-md-6 mb-3')}
            </div>
          </div>
          <div class="col-lg-4 placeholder-glow">
            <div class="bg-white rounded-4 border p-4">
              <span class="placeholder col-6 mb-3" style="height: 24px;"></span>
              <span class="placeholder col-12 mb-2"></span>
              <span class="placeholder col-10 mb-2"></span>
              <span class="placeholder col-8"></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (error || !spot || spot.is_published !== true) {
    const cleanSlug = escapeHtml(requestedSlug || '');
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'দর্শনীয় স্থান', labelEn: 'Tourist Destinations', url: '/places/' },
              { labelBn: 'পাওয়া যায়নি', labelEn: 'Not Found' }
            ],
            lang
          )}
        </div>
      </div>
      <div class="container py-5">
        ${error
          ? renderErrorState({
              title: isBn ? 'গন্তব্যের তথ্য লোড করা যায়নি' : 'Failed to load destination details',
              message: error,
              retryActionId: 'spot-detail-retry-btn',
              lang
            })
          : `
            <div class="bg-white rounded-4 border shadow-sm p-4 p-md-5 text-center my-3">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning-emphasis mb-3" style="width: 72px; height: 72px;">
                <i class="bi bi-compass fs-1"></i>
              </div>
              <span class="d-block badge bg-light text-secondary border mx-auto mb-2" style="width: fit-content;">
                404 • /places/${cleanSlug}/
              </span>
              <h1 class="fw-bold text-primary-bd mb-2 h2">
                ${isBn ? 'দুঃখিত, এই দর্শনীয় স্থানটি খুঁজে পাওয়া যায়নি' : 'Tourist Destination Not Found'}
              </h1>
              <p class="text-muted mx-auto mb-4" style="max-width: 600px;">
                ${isBn
                  ? `"${cleanSlug}" নামে কোনো প্রকাশিত দর্শনীয় স্থান আমাদের বর্তমান তালিকাভুক্ত নেই অথবা এখনো প্রকাশিত হয়নি। সকল দর্শনীয় স্থানের ডিরেক্টরিতে ফিরে যান অথবা নিচের জনপ্রিয় গন্তব্যগুলো দেখুন।`
                  : `No published tourist destination matched "${cleanSlug}". Return to the complete destinations directory or explore one of the published landmarks below.`}
              </p>
              <div class="d-flex flex-wrap justify-content-center gap-2 mb-4">
                <a href="/places/" class="btn btn-primary-bd px-4 py-2 rounded-pill">
                  <i class="bi bi-compass me-2"></i>${isBn ? 'সকল দর্শনীয় স্থান' : 'All Tourist Destinations'}
                </a>
                <a href="/districts/" class="btn btn-outline-bd px-4 py-2 rounded-pill">
                  <i class="bi bi-geo-alt me-2"></i>${isBn ? '৬৪ জেলা ডিরেক্টরি' : '64 Districts'}
                </a>
              </div>
              <hr class="my-4">
              <div class="small text-secondary fw-semibold mb-3">
                ${isBn ? 'প্রকাশিত জনপ্রিয় দর্শনীয় স্থানসমূহ:' : 'Published Popular Destinations:'}
              </div>
              <div class="d-flex flex-wrap justify-content-center gap-2">
                ${FEATURED_DIRECTORY_LINKS.map(item => `
                  <a href="/places/${item.slug}/" class="btn btn-sm btn-outline-secondary rounded-pill px-3 spot-detail-link" data-spot-slug="${item.slug}">
                    ${isBn ? item.nameBn : item.nameEn}
                  </a>
                `).join('')}
              </div>
            </div>
          `}
      </div>
    `;
  }

  const nameBn = spot.name_bn || spot.name_en;
  const nameEn = spot.name_en || spot.name_bn;
  const primaryName = isBn ? nameBn : nameEn;
  const secondaryName = isBn ? nameEn : nameBn;

  const shortDesc = (isBn ? spot.short_desc_bn : spot.short_desc_en) || spot.short_desc_en || spot.short_desc_bn || '';
  const overviewText = (isBn ? spot.overview_bn : spot.overview_en) || spot.overview_en || spot.overview_bn || '';
  const historyText = (isBn ? spot.history_bn : spot.history_en) || spot.history_en || spot.history_bn || '';
  const howToReachText = (isBn ? spot.how_to_go_bn : spot.how_to_go_en) || spot.how_to_go_en || spot.how_to_go_bn || '';
  const bestTimeText = (isBn ? spot.best_time_bn : spot.best_time_en) || spot.best_time_en || spot.best_time_bn || '';
  const tipsText = (isBn ? spot.tips_bn : spot.tips_en) || spot.tips_en || spot.tips_bn || '';
  const estimatedCostText = (isBn ? spot.estimated_cost_bn : spot.estimated_cost_en) || spot.estimated_cost_en || spot.estimated_cost_bn || '';
  const entryFeeText = (isBn ? spot.entry_fee_bn : spot.entry_fee_en) || spot.entry_fee_en || spot.entry_fee_bn || '';
  const openingHoursText = (isBn ? spot.opening_hours_bn : spot.opening_hours_en) || spot.opening_hours_en || spot.opening_hours_bn || '';

  const divSlug = division ? encodeURIComponent((division.slug || division.id).toLowerCase()) : '';
  const distSlug = district ? encodeURIComponent((district.slug || district.id).toLowerCase()) : '';
  const divName = division ? (isBn ? division.name_bn : division.name_en) : spot.division_id;
  const distName = district ? (isBn ? district.name_bn : district.name_en) : spot.district_id;

  const spotCategories = categories.filter(
    c =>
      c.is_published !== false &&
      Array.isArray(spot.category_ids) &&
      spot.category_ids.some(cid => cid.toLowerCase() === c.id.toLowerCase() || (c.slug && cid.toLowerCase() === c.slug.toLowerCase()))
  );

  const galleryImages = getSpotGalleryImages(spot);
  const safeGalleryIndex = ((galleryIndex % galleryImages.length) + galleryImages.length) % galleryImages.length;
  const activeGalleryImg = galleryImages[safeGalleryIndex];
  const coverHeroImg = optimizeImageUrl(spot.image_url || activeGalleryImg, 1600);
  const hasMapsUrl = isValidHttpUrl(spot.google_maps_url);
  const isBookmarked = bookmarkedIds.has(spot.id);

  // Related published attractions (same district prioritized, then same division)
  const publishedNearby = nearbySpots
    .filter(s => s.is_published === true && s.id !== spot.id)
    .sort((a, b) => {
      const aSameDist = a.district_id?.toLowerCase() === spot.district_id?.toLowerCase() ? 1 : 0;
      const bSameDist = b.district_id?.toLowerCase() === spot.district_id?.toLowerCase() ? 1 : 0;
      if (bSameDist !== aSameDist) return bSameDist - aSameDist;
      return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
    })
    .slice(0, 3);

  // Related published travel guides
  const relatedGuides = articles
    .filter(a => {
      if (a.is_published === false) return false;
      if (a.related_spot_id && (a.related_spot_id.toLowerCase() === spot.id.toLowerCase() || a.related_spot_id.toLowerCase() === (spot.slug || '').toLowerCase())) {
        return true;
      }
      if (
        a.related_district_id &&
        district &&
        (a.related_district_id.toLowerCase() === district.id.toLowerCase() ||
          (district.slug && a.related_district_id.toLowerCase() === district.slug.toLowerCase()))
      ) {
        return true;
      }
      const searchable = `${a.title_en} ${a.title_bn} ${a.excerpt_en} ${a.excerpt_bn}`.toLowerCase();
      return (
        searchable.includes(nameEn.toLowerCase()) ||
        searchable.includes(nameBn.toLowerCase()) ||
        (district ? searchable.includes(district.name_en.toLowerCase()) || searchable.includes(district.name_bn.toLowerCase()) : false)
      );
    })
    .slice(0, 3);

  return `
    <!-- 1. Breadcrumb Navigation -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [
            { labelBn: 'দর্শনীয় স্থান', labelEn: 'Tourist Destinations', url: '/places/' },
            ...(division
              ? [{ labelBn: `${division.name_bn} বিভাগ`, labelEn: `${division.name_en} Division`, url: `/divisions/${divSlug}/` }]
              : []),
            ...(district
              ? [{ labelBn: `${district.name_bn} জেলা`, labelEn: `${district.name_en} District`, url: `/districts/${distSlug}/` }]
              : []),
            { labelBn: nameBn, labelEn: nameEn }
          ],
          lang
        )}
      </div>
    </div>

    <!-- 2 & 3. Large Destination Cover Image & Bilingual Name Header -->
    <section
      class="hero-wrapper position-relative"
      style="min-height: 430px; padding: 3.5rem 0; background: linear-gradient(135deg, rgba(18, 60, 50, 0.90) 0%, rgba(18, 60, 50, 0.72) 55%, rgba(28, 89, 72, 0.85) 100%), url('${coverHeroImg}') center/cover no-repeat;"
    >
      <div class="container">
        <div class="row align-items-end g-4">
          <div class="col-lg-8">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
              <a href="/places/" class="btn btn-outline-light btn-sm rounded-pill px-3">
                <i class="bi bi-arrow-left me-1"></i>${isBn ? 'সকল দর্শনীয় স্থান' : 'All Destinations'}
              </a>
              ${district ? `
                <a href="/districts/${distSlug}/" class="btn btn-warning btn-sm text-dark fw-semibold rounded-pill px-3">
                  <i class="bi bi-geo-alt-fill me-1"></i>${escapeHtml(distName)}
                </a>
              ` : ''}
              ${division ? `
                <a href="/divisions/${divSlug}/" class="badge bg-light bg-opacity-25 text-white border border-light border-opacity-25 text-decoration-none px-3 py-2 rounded-pill">
                  <i class="bi bi-diagram-3 me-1"></i>${escapeHtml(divName)} ${isBn ? 'বিভাগ' : 'Division'}
                </a>
              ` : ''}
            </div>

            <!-- Bilingual Destination Name (Bengali & English) -->
            <h1 class="hero-title mb-2" id="spot-detail-heading">
              ${escapeHtml(primaryName)}
            </h1>
            <p class="fs-4 text-warning fw-semibold mb-3 opacity-95" id="spot-detail-secondary-name">
              ${escapeHtml(secondaryName)}
            </p>
            ${shortDesc ? `
              <p class="hero-subtitle mb-4" style="max-width: 720px;">
                ${escapeHtml(shortDesc)}
              </p>
            ` : ''}

            <!-- 6. Destination Category Badges -->
            ${spotCategories.length > 0 ? `
              <div class="d-flex flex-wrap gap-2 mb-3" aria-label="${isBn ? 'গন্তব্যের ধরন' : 'Destination categories'}">
                ${spotCategories.map(cat => {
                  const catSlug = encodeURIComponent((cat.slug || cat.id).toLowerCase());
                  return `
                    <a
                      href="/categories/${catSlug}/"
                      class="badge bg-white text-primary-bd text-decoration-none px-3 py-2 rounded-pill shadow-sm category-detail-link"
                      data-category-slug="${catSlug}"
                    >
                      <i class="bi ${escapeHtml(cat.icon || 'bi-tag')} text-success me-1"></i>
                      ${escapeHtml(isBn ? cat.name_bn : cat.name_en)}
                    </a>
                  `;
                }).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Share, Copy Link & Save Actions -->
          <div class="col-lg-4 d-flex flex-column align-items-lg-end gap-2">
            <div class="d-flex flex-wrap gap-2 justify-content-lg-end">
              <button
                type="button"
                class="btn ${isBookmarked ? 'btn-danger' : 'btn-outline-light'} btn-sm rounded-pill px-3 fw-semibold"
                id="spot-detail-bookmark-btn"
                data-spot-id="${escapeHtml(spot.id)}"
                aria-pressed="${isBookmarked ? 'true' : 'false'}"
              >
                <i class="bi ${isBookmarked ? 'bi-heart-fill' : 'bi-heart'} me-1"></i>
                ${isBookmarked ? (isBn ? 'সংরক্ষিত' : 'Saved') : (isBn ? 'সংরক্ষণ করুন' : 'Save')}
              </button>
              <button
                type="button"
                class="btn btn-outline-light btn-sm rounded-pill px-3 fw-semibold"
                id="spot-share-btn"
              >
                <i class="bi bi-share-fill me-1"></i>${isBn ? 'শেয়ার করুন' : 'Share'}
              </button>
              <button
                type="button"
                class="btn btn-warning btn-sm text-dark rounded-pill px-3 fw-semibold"
                id="spot-copy-link-btn"
              >
                <i class="bi bi-link-45deg me-1"></i>${isBn ? 'লিংক কপি' : 'Copy Link'}
              </button>
            </div>
            <div class="small text-white-50 text-lg-end mt-1">
              <i class="bi bi-translate me-1"></i>
              ${escapeHtml(nameBn)} • ${escapeHtml(nameEn)}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Destination Content & Practical Information -->
    <div class="container py-5">
      <div class="row g-4">
        <!-- Left Main Column -->
        <div class="col-lg-8">
          <!-- 4. Accessible Image Gallery -->
          <section class="bg-white rounded-4 border shadow-sm p-3 p-md-4 mb-4" aria-labelledby="spot-gallery-heading">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 class="h5 fw-bold text-primary-bd mb-0" id="spot-gallery-heading">
                <i class="bi bi-images text-warning me-2"></i>${isBn ? 'ফটোগ্যালারি' : 'Photo Gallery'}
              </h2>
              <span class="badge bg-light text-secondary border px-3 py-1 rounded-pill" id="spot-gallery-counter" aria-live="polite">
                ${formatLocalizedNumber(safeGalleryIndex + 1, lang)} / ${formatLocalizedNumber(galleryImages.length, lang)}
              </span>
            </div>

            <div
              class="position-relative rounded-4 overflow-hidden bg-dark mb-3"
              id="spot-gallery-viewer"
              tabindex="0"
              role="region"
              aria-roledescription="carousel"
              aria-label="${escapeHtml(primaryName)} ${isBn ? 'ছবির গ্যালারি' : 'photo gallery'}"
              style="height: 390px;"
            >
              <img
                id="spot-gallery-active-img"
                src="${optimizeImageUrl(activeGalleryImg, 1200)}"
                alt="${escapeHtml(primaryName)} (${escapeHtml(secondaryName)}) - ${isBn ? 'ছবি' : 'Photo'} ${safeGalleryIndex + 1}"
                class="w-100 h-100"
                style="object-fit: cover;"
                loading="eager"
                decoding="async"
                onerror="this.onerror=null;this.src='${FALLBACK_SPOT_HERO}';"
              >

              ${galleryImages.length > 1 ? `
                <button
                  type="button"
                  id="spot-gallery-prev"
                  class="btn btn-dark bg-opacity-75 border border-light border-opacity-25 rounded-circle position-absolute top-50 start-0 translate-middle-y ms-3 d-flex align-items-center justify-content-center"
                  style="width: 42px; height: 42px;"
                  aria-label="${isBn ? 'আগের ছবি' : 'Previous image'}"
                >
                  <i class="bi bi-chevron-left text-white"></i>
                </button>
                <button
                  type="button"
                  id="spot-gallery-next"
                  class="btn btn-dark bg-opacity-75 border border-light border-opacity-25 rounded-circle position-absolute top-50 end-0 translate-middle-y me-3 d-flex align-items-center justify-content-center"
                  style="width: 42px; height: 42px;"
                  aria-label="${isBn ? 'পরের ছবি' : 'Next image'}"
                >
                  <i class="bi bi-chevron-right text-white"></i>
                </button>
              ` : ''}

              <button
                type="button"
                id="spot-gallery-zoom-btn"
                data-zoom-url="${escapeHtml(activeGalleryImg)}"
                class="btn btn-light btn-sm rounded-pill px-3 position-absolute bottom-0 end-0 m-3 shadow-sm fw-semibold"
                aria-label="${isBn ? 'বড় করে ছবি দেখুন' : 'View full-size photo'}"
              >
                <i class="bi bi-arrows-fullscreen me-1"></i>${isBn ? 'বড় করে দেখুন' : 'Full View'}
              </button>
            </div>

            ${galleryImages.length > 1 ? `
              <div class="d-flex flex-wrap gap-2" role="group" aria-label="${isBn ? 'গ্যালারি থাম্বনেইল' : 'Gallery thumbnails'}">
                ${galleryImages.map((url, idx) => {
                  const isActive = idx === safeGalleryIndex;
                  return `
                    <button
                      type="button"
                      class="btn p-0 border-2 rounded-3 overflow-hidden spot-gallery-thumb ${isActive ? 'border-success shadow-sm' : 'border-transparent opacity-75'}"
                      data-gallery-index="${idx}"
                      aria-pressed="${isActive ? 'true' : 'false'}"
                      aria-label="${escapeHtml(primaryName)} ${isBn ? 'ছবি' : 'photo'} ${idx + 1}"
                      style="width: 88px; height: 62px;"
                    >
                      <img
                        src="${optimizeImageUrl(url, 300)}"
                        alt="${escapeHtml(primaryName)} ${idx + 1}"
                        class="w-100 h-100"
                        style="object-fit: cover;"
                        loading="lazy"
                        decoding="async"
                        onerror="this.onerror=null;this.src='${FALLBACK_SPOT_HERO}';"
                      >
                    </button>
                  `;
                }).join('')}
              </div>
            ` : `
              <p class="small text-muted mb-0">
                <i class="bi bi-camera me-1"></i>
                ${isBn ? 'প্রকাশিত প্রধান কভার ছবি প্রদর্শিত হচ্ছে।' : 'Displaying the published primary destination photograph.'}
              </p>
            `}
          </section>

          <!-- 5. Overview, Detailed Description & Heritage -->
          <section class="bg-white rounded-4 border shadow-sm p-4 mb-4" aria-labelledby="spot-overview-heading">
            <h2 class="h4 fw-bold text-primary-bd mb-3" id="spot-overview-heading">
              <i class="bi bi-card-text text-warning me-2"></i>${isBn ? 'পরিচিতি ও বিস্তারিত বিবরণ' : 'Overview & Detailed Description'}
            </h2>
            ${overviewText
              ? `<p class="text-secondary mb-4" style="line-height: 1.8; white-space: pre-line;">${escapeHtml(overviewText)}</p>`
              : `<div class="mb-4">${renderUnavailableNotice('এই স্থানের বিস্তারিত বিবরণ এখনো যুক্ত করা হয়নি।', 'Detailed overview for this destination is currently unavailable.', lang)}</div>`}

            <hr class="my-3">
            <h3 class="h5 fw-bold text-primary-bd mb-2">
              <i class="bi bi-hourglass-split text-warning me-2"></i>${isBn ? 'ইতিহাস ও ঐতিহ্য' : 'History & Heritage'}
            </h3>
            ${historyText
              ? `<p class="text-secondary mb-0" style="line-height: 1.75; white-space: pre-line;">${escapeHtml(historyText)}</p>`
              : renderUnavailableNotice('এই স্থানের ইতিহাস সম্পর্কিত তথ্য এখনো যুক্ত হয়নি।', 'Historical background information is not currently available.', lang)}
          </section>

          <!-- 9. How to Reach & 10. Best Time to Visit -->
          <div class="row g-4 mb-4">
            <div class="col-md-6">
              <section class="bg-white rounded-4 border shadow-sm p-4 h-100" aria-labelledby="spot-reach-heading">
                <h2 class="h5 fw-bold text-primary-bd mb-3" id="spot-reach-heading">
                  <i class="bi bi-signpost-split-fill text-warning me-2"></i>${isBn ? 'কীভাবে যাবেন' : 'How to Reach'}
                </h2>
                ${howToReachText
                  ? `<p class="text-secondary small mb-0" style="line-height: 1.75; white-space: pre-line;">${escapeHtml(howToReachText)}</p>`
                  : renderUnavailableNotice('যাতায়াত নির্দেশিকা এখনো যাচাইকৃত অবস্থায় উপলব্ধ নয়।', 'Verified directions on how to reach this destination are currently unavailable.', lang)}
              </section>
            </div>

            <div class="col-md-6">
              <section class="bg-white rounded-4 border shadow-sm p-4 h-100" aria-labelledby="spot-besttime-heading">
                <h2 class="h5 fw-bold text-primary-bd mb-3" id="spot-besttime-heading">
                  <i class="bi bi-calendar-check-fill text-warning me-2"></i>${isBn ? 'ভ্রমণের সেরা সময়' : 'Best Time to Visit'}
                </h2>
                ${bestTimeText
                  ? `<p class="text-secondary small mb-0" style="line-height: 1.75; white-space: pre-line;">${escapeHtml(bestTimeText)}</p>`
                  : renderUnavailableNotice('ভ্রমণের সেরা সময় সম্পর্কিত তথ্য বর্তমানে উপলব্ধ নয়।', 'Best time to visit information is currently unavailable.', lang)}
              </section>
            </div>
          </div>

          ${adSlotHtml || ''}

          <!-- 14. Important Travel Tips -->
          <section class="rounded-4 border border-warning-subtle bg-warning-subtle p-4 mb-4" aria-labelledby="spot-tips-heading">
            <h2 class="h5 fw-bold text-dark mb-2" id="spot-tips-heading">
              <i class="bi bi-lightbulb-fill text-warning me-2"></i>${isBn ? 'গুরুত্বপূর্ণ ভ্রমণ পরামর্শ ও সতর্কতা' : 'Important Travel Tips'}
            </h2>
            ${tipsText
              ? `<p class="text-dark small mb-0" style="line-height: 1.75; white-space: pre-line;">${escapeHtml(tipsText)}</p>`
              : renderUnavailableNotice('এই গন্তব্যের জন্য নির্দিষ্ট ভ্রমণ পরামর্শ এখনো যুক্ত হয়নি।', 'Specific travel tips for this destination are not currently available.', lang)}
          </section>
        </div>

        <!-- Right Sidebar: Location, Category, Maps, Cost, Entry Fee & Hours -->
        <div class="col-lg-4">
          <!-- 6 & 7. District, Division & Category Card -->
          <section class="bg-white rounded-4 border shadow-sm p-4 mb-4" aria-labelledby="spot-location-heading">
            <h2 class="h5 fw-bold text-primary-bd mb-3" id="spot-location-heading">
              <i class="bi bi-geo-alt-fill text-warning me-2"></i>${isBn ? 'ভৌগোলিক অবস্থান ও ক্যাটাগরি' : 'Location & Categories'}
            </h2>

            <div class="d-flex flex-column gap-3 mb-3">
              <div class="p-3 rounded-3 bg-light border">
                <div class="small text-muted mb-1">${isBn ? 'প্রশাসনিক বিভাগ' : 'Division'}</div>
                ${division
                  ? `<a href="/divisions/${divSlug}/" class="fw-bold text-primary-bd text-decoration-none d-flex align-items-center justify-content-between">
                      <span>${escapeHtml(division.name_bn)} (${escapeHtml(division.name_en)})</span>
                      <i class="bi bi-arrow-right-short fs-5"></i>
                    </a>`
                  : `<span class="fw-semibold text-secondary">${escapeHtml(spot.division_id)}</span>`}
              </div>

              <div class="p-3 rounded-3 bg-light border">
                <div class="small text-muted mb-1">${isBn ? 'জেলা' : 'District'}</div>
                ${district
                  ? `<a href="/districts/${distSlug}/" class="fw-bold text-primary-bd text-decoration-none d-flex align-items-center justify-content-between">
                      <span>${escapeHtml(district.name_bn)} (${escapeHtml(district.name_en)})</span>
                      <i class="bi bi-arrow-right-short fs-5"></i>
                    </a>`
                  : `<span class="fw-semibold text-secondary">${escapeHtml(spot.district_id)}</span>`}
              </div>
            </div>

            <div>
              <div class="small text-muted fw-semibold mb-2">${isBn ? 'গন্তব্যের ধরন (ক্যাটাগরি)' : 'Destination Category'}</div>
              ${spotCategories.length > 0 ? `
                <div class="d-flex flex-wrap gap-2">
                  ${spotCategories.map(cat => `
                    <a
                      href="/places/?category=${encodeURIComponent(cat.id)}"
                      class="badge bg-success-subtle text-success border border-success-subtle text-decoration-none px-3 py-2 rounded-pill"
                    >
                      <i class="bi ${escapeHtml(cat.icon || 'bi-tag')} me-1"></i>
                      ${escapeHtml(isBn ? `${cat.name_bn} (${cat.name_en})` : `${cat.name_en} (${cat.name_bn})`)}
                    </a>
                  `).join('')}
                </div>
              ` : renderUnavailableNotice('ক্যাটাগরি এখনো নির্ধারণ করা হয়নি।', 'Category information is currently unavailable.', lang)}
            </div>
          </section>

          <!-- 8. Google Maps Location -->
          <section class="bg-white rounded-4 border shadow-sm p-4 mb-4" aria-labelledby="spot-maps-heading">
            <h2 class="h5 fw-bold text-primary-bd mb-3" id="spot-maps-heading">
              <i class="bi bi-map-fill text-warning me-2"></i>${isBn ? 'গুগল ম্যাপস অবস্থান' : 'Google Maps Location'}
            </h2>
            ${hasMapsUrl ? `
              <p class="small text-secondary mb-3">
                ${isBn
                  ? 'সরাসরি গুগল ম্যাপসে এই স্থানের অবস্থান ও দিকনির্দেশনা দেখুন।'
                  : 'Open the verified Google Maps location to view coordinates and directions.'}
              </p>
              <a
                href="${escapeHtml(spot.google_maps_url || '')}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-primary-bd w-100 rounded-pill fw-semibold"
                id="spot-google-maps-link"
              >
                <i class="bi bi-box-arrow-up-right me-2"></i>${isBn ? 'গুগল ম্যাপসে খুলুন' : 'Open in Google Maps'}
              </a>
            ` : `
              <div class="p-3 rounded-3 bg-light border">
                ${renderUnavailableNotice(
                  'এই গন্তব্যের যাচাইকৃত গুগল ম্যাপস লিংক বর্তমানে উপলব্ধ নয়।',
                  'A verified Google Maps location link is not currently available for this destination.',
                  lang
                )}
              </div>
            `}
          </section>

          <!-- 11, 12, 13. Verified Practical Details (Estimated Cost, Entry Fee, Opening Hours) -->
          <section class="bg-white rounded-4 border shadow-sm p-4 mb-4" aria-labelledby="spot-practical-heading">
            <h2 class="h5 fw-bold text-primary-bd mb-3" id="spot-practical-heading">
              <i class="bi bi-clipboard-check-fill text-warning me-2"></i>${isBn ? 'ব্যবহারিক তথ্য (যাচাইকৃত)' : 'Verified Visitor Info'}
            </h2>

            <!-- 11. Estimated Travel Cost -->
            <div class="p-3 rounded-3 bg-light border mb-3">
              <div class="small fw-bold text-primary-bd mb-1">
                <i class="bi bi-wallet2 text-success me-1"></i>${isBn ? 'সম্ভাব্য ভ্রমণ ব্যয়' : 'Estimated Travel Cost'}
              </div>
              ${estimatedCostText
                ? `<p class="small text-dark mb-0">${escapeHtml(estimatedCostText)}</p>`
                : renderUnavailableNotice(
                    'যাচাইকৃত সম্ভাব্য ভ্রমণ ব্যয়ের তথ্য বর্তমানে উপলব্ধ নয়। যাত্রার আগে বর্তমান ভাড়া ও খরচ যাচাই করে নিন।',
                    'Verified estimated travel cost is currently unavailable. Please confirm current transport and stay rates before traveling.',
                    lang
                  )}
            </div>

            <!-- 12. Entry Fee -->
            <div class="p-3 rounded-3 bg-light border mb-3">
              <div class="small fw-bold text-primary-bd mb-1">
                <i class="bi bi-ticket-perforated text-success me-1"></i>${isBn ? 'প্রবেশ ফি' : 'Entry Fee'}
              </div>
              ${entryFeeText
                ? `<p class="small text-dark mb-0">${escapeHtml(entryFeeText)}</p>`
                : renderUnavailableNotice(
                    'যাচাইকৃত প্রবেশ ফি সম্পর্কিত তথ্য বর্তমানে উপলব্ধ নয়।',
                    'Verified entry fee information is currently unavailable.',
                    lang
                  )}
            </div>

            <!-- 13. Opening Hours -->
            <div class="p-3 rounded-3 bg-light border mb-0">
              <div class="small fw-bold text-primary-bd mb-1">
                <i class="bi bi-clock text-success me-1"></i>${isBn ? 'পরিদর্শনের সময়সূচি' : 'Opening Hours'}
              </div>
              ${openingHoursText
                ? `<p class="small text-dark mb-0">${escapeHtml(openingHoursText)}</p>`
                : renderUnavailableNotice(
                    'যাচাইকৃত পরিদর্শন সময়সূচি বর্তমানে উপলব্ধ নয় অথবা মৌসুম ও স্থানীয় নিয়মের ওপর নির্ভরশীল।',
                    'Verified opening hours are currently unavailable or subject to local seasonal access.',
                    lang
                  )}
            </div>
          </section>
        </div>
      </div>

      <!-- 15. Nearby Attractions -->
      <section class="pt-4 mt-2" id="spot-nearby-section" aria-labelledby="spot-nearby-heading">
        <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
          <div>
            <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 rounded-pill mb-2">
              ${isBn ? 'আশেপাশের গন্তব্য' : 'Explore Nearby'}
            </span>
            <h2 class="h3 fw-bold text-primary-bd mb-1" id="spot-nearby-heading">
              ${isBn ? 'নিকটবর্তী দর্শনীয় স্থানসমূহ' : 'Nearby Attractions'}
            </h2>
            <p class="text-muted mb-0">
              ${isBn
                ? `${distName} এবং ${divName} বিভাগের অন্যান্য প্রকাশিত পর্যটন কেন্দ্র।`
                : `Other published attractions in ${distName} and ${divName} Division.`}
            </p>
          </div>
          <a href="/places/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
            <i class="bi bi-grid me-1"></i>${isBn ? 'সকল দর্শনীয় স্থান' : 'All Destinations'}
          </a>
        </div>

        ${publishedNearby.length === 0 ? `
          ${renderEmptyState({
            titleBn: 'এই এলাকায় এখনো অতিরিক্ত প্রকাশিত গন্তব্য যুক্ত হয়নি',
            titleEn: 'No Additional Nearby Attractions Listed Yet',
            descBn: 'সকল দর্শনীয় স্থানের ডিরেক্টরি থেকে বাংলাদেশের অন্যান্য জনপ্রিয় গন্তব্য ঘুরে দেখুন।',
            descEn: 'Browse the complete tourist destinations directory to discover more places across Bangladesh.',
            icon: 'bi-compass',
            lang
          })}
        ` : `
          <div class="row g-4">
            ${publishedNearby.map(nearSpot => {
              const nearCats = categories.filter(c => nearSpot.category_ids?.includes(c.id));
              return renderDestinationCard({
                spot: nearSpot,
                division: nearSpot.division_id === division?.id ? division : undefined,
                district: nearSpot.district_id === district?.id ? district : undefined,
                category: nearCats[0],
                categories: nearCats,
                isBookmarked: bookmarkedIds.has(nearSpot.id),
                lang
              });
            }).join('')}
          </div>
        `}
      </section>

      <!-- 16. Related Travel Guides -->
      <section class="pt-4 mt-3" id="spot-guides-section" aria-labelledby="spot-guides-heading">
        <div class="mb-4">
          <span class="badge bg-secondary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'ভ্রমণ সহায়িকা' : 'Travel Guides'}
          </span>
          <h2 class="h3 fw-bold text-primary-bd mb-1" id="spot-guides-heading">
            ${isBn ? 'সম্পর্কিত ভ্রমণ গাইড ও নিবন্ধ' : 'Related Travel Guides'}
          </h2>
        </div>

        ${relatedGuides.length === 0 ? `
          <div class="bg-white rounded-4 border p-4 text-muted small">
            <i class="bi bi-journal-text text-secondary me-2"></i>
            ${isBn
              ? 'এই গন্তব্যের জন্য নির্দিষ্ট প্রকাশিত ভ্রমণ গাইড এখনো যুক্ত হয়নি।'
              : 'No dedicated published travel guides are currently linked to this destination.'}
          </div>
        ` : `
          <div class="row g-4">
            ${relatedGuides.map(art => `
              <div class="col-lg-4 col-md-6">
                <article class="card-travel h-100 d-flex flex-column">
                  <div class="card-travel-img-box" style="height: 185px;">
                    <img
                      src="${optimizeImageUrl(art.image_url, 600)}"
                      alt="${escapeHtml(isBn ? art.title_bn : art.title_en)}"
                      class="card-travel-img"
                      loading="lazy"
                      decoding="async"
                      onerror="this.onerror=null;this.src='${FALLBACK_SPOT_HERO}';"
                    >
                  </div>
                  <div class="card-travel-body d-flex flex-column flex-grow-1 p-3">
                    <div class="small text-muted mb-2">
                      <i class="bi bi-clock me-1"></i>${escapeHtml(isBn ? art.read_time_bn : art.read_time_en)}
                    </div>
                    <h3 class="h6 fw-bold text-primary-bd mb-2">${escapeHtml(isBn ? art.title_bn : art.title_en)}</h3>
                    <p class="small text-secondary flex-grow-1">${escapeHtml(isBn ? art.excerpt_bn : art.excerpt_en)}</p>
                    <a
                      href="/travel-guides/${encodeURIComponent((art.slug || art.id).toLowerCase())}/"
                      class="btn btn-outline-bd btn-sm w-100 mt-auto text-decoration-none article-detail-link"
                      data-article-slug="${escapeHtml((art.slug || art.id).toLowerCase())}"
                    >
                      <i class="bi bi-book-half me-1"></i>${isBn ? 'বিস্তারিত পড়ুন' : 'Read Guide'}
                    </a>
                  </div>
                </article>
              </div>
            `).join('')}
          </div>
        `}
      </section>
    </div>
  `;
}
