/**
 * Dynamic District Details Page Template (Reusable for all 64 Districts)
 * URLs: /districts/dhaka/, /districts/coxs-bazar/, /districts/jamalpur/, etc.
 * Fetches district details, parent division, published tourist spots, and related guides from Firestore.
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

export interface DistrictDetailPageProps {
  lang: Language;
  requestedSlug: string;
  district: District | null;
  division: Division | null;
  siblingDistricts: District[];
  spots: TouristSpot[];
  categories: Category[];
  articles: Article[];
  bookmarkedIds: Set<string>;
  isLoading: boolean;
  error: string | null;
}

const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80';

const POPULAR_DISTRICT_LINKS: ReadonlyArray<{ slug: string; nameBn: string; nameEn: string }> = [
  { slug: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka' },
  { slug: 'coxs-bazar', nameBn: 'কক্সবাজার', nameEn: "Cox's Bazar" },
  { slug: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet' },
  { slug: 'bandarban', nameBn: 'বান্দরবান', nameEn: 'Bandarban' },
  { slug: 'rangamati', nameBn: 'রাঙামাটি', nameEn: 'Rangamati' },
  { slug: 'bagerhat', nameBn: 'বাগেরহাট', nameEn: 'Bagerhat' },
  { slug: 'patuakhali', nameBn: 'পটুয়াখালী', nameEn: 'Patuakhali' },
  { slug: 'netrokona', nameBn: 'নেত্রকোনা', nameEn: 'Netrokona' }
];

export function renderDistrictDetailPage(props: DistrictDetailPageProps): string {
  const {
    lang,
    requestedSlug,
    district,
    division,
    siblingDistricts,
    spots,
    categories,
    articles,
    bookmarkedIds,
    isLoading,
    error
  } = props;

  const isBn = lang === 'bn';

  if (isLoading) {
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'বাংলাদেশের ৬৪ জেলা', labelEn: '64 Districts', url: '/districts/' },
              { labelBn: 'লোড হচ্ছে...', labelEn: 'Loading...' }
            ],
            lang
          )}
        </div>
      </div>
      <section class="hero-wrapper" style="min-height: 290px; padding: 3rem 0;">
        <div class="container placeholder-glow">
          <span class="placeholder col-3 bg-warning rounded-pill mb-3" style="height: 24px;"></span>
          <h1 class="placeholder col-6 bg-light rounded mb-3" style="height: 44px;"></h1>
          <p class="placeholder col-8 bg-light rounded opacity-50" style="height: 20px;"></p>
        </div>
      </section>
      <div class="container py-5">
        <div class="row g-4">
          ${renderCardSkeleton(3, 'col-lg-4 col-md-6 mb-4')}
        </div>
      </div>
    `;
  }

  if (error || !district) {
    const cleanSlug = escapeHtml(requestedSlug || '');
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'বাংলাদেশের ৬৪ জেলা', labelEn: '64 Districts', url: '/districts/' },
              { labelBn: 'পাওয়া যায়নি', labelEn: 'Not Found' }
            ],
            lang
          )}
        </div>
      </div>
      <div class="container py-5">
        ${error
          ? renderErrorState({
              title: isBn ? 'জেলার তথ্য লোড করা যায়নি' : 'Failed to load district details',
              message: error,
              retryActionId: 'district-detail-retry-btn',
              lang
            })
          : `
            <div class="bg-white rounded-4 border shadow-sm p-4 p-md-5 text-center my-3">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning-emphasis mb-3" style="width: 72px; height: 72px;">
                <i class="bi bi-geo-alt fs-1"></i>
              </div>
              <span class="d-block badge bg-light text-secondary border mx-auto mb-2" style="width: fit-content;">
                404 • /districts/${cleanSlug}/
              </span>
              <h1 class="fw-bold text-primary-bd mb-2 h2">
                ${isBn ? 'দুঃখিত, এই জেলাটি খুঁজে পাওয়া যায়নি' : 'District Not Found'}
              </h1>
              <p class="text-muted mx-auto mb-4" style="max-width: 580px;">
                ${isBn
                  ? `"${cleanSlug}" নামে বাংলাদেশের কোনো প্রকাশিত জেলা পাওয়া যায়নি। অনুগ্রহ করে সকল ৬৪ জেলার ডিরেক্টরিতে ফিরে যান অথবা নিচের জনপ্রিয় জেলাসমূহ থেকে একটি নির্বাচন করুন।`
                  : `No published administrative district matched "${cleanSlug}". Return to the complete 64-district directory or select a popular destination below.`}
              </p>
              <div class="d-flex flex-wrap justify-content-center gap-2 mb-4">
                <a href="/districts/" class="btn btn-primary-bd px-4 py-2 rounded-pill">
                  <i class="bi bi-grid-fill me-2"></i>${isBn ? 'সকল ৬৪ জেলা দেখুন' : 'Back to All 64 Districts'}
                </a>
                <a href="/divisions/" class="btn btn-outline-bd px-4 py-2 rounded-pill">
                  <i class="bi bi-diagram-3 me-2"></i>${isBn ? '৮টি বিভাগ' : '8 Divisions'}
                </a>
              </div>
              <hr class="my-4">
              <div class="small text-secondary fw-semibold mb-3">
                ${isBn ? 'জনপ্রিয় পর্যটন জেলাসমূহ:' : 'Popular Districts in Bangladesh:'}
              </div>
              <div class="d-flex flex-wrap justify-content-center gap-2">
                ${POPULAR_DISTRICT_LINKS.map(item => `
                  <a href="/districts/${item.slug}/" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
                    ${isBn ? item.nameBn : item.nameEn}
                  </a>
                `).join('')}
              </div>
            </div>
          `}
      </div>
    `;
  }

  const primaryName = isBn ? district.name_bn : district.name_en;
  const secondaryName = isBn ? district.name_en : district.name_bn;
  const desc = isBn ? district.description_bn : district.description_en;
  const famousFor = isBn ? district.famous_for_bn : district.famous_for_en;
  const divName = division ? (isBn ? division.name_bn : division.name_en) : district.division_id;
  const divSlug = encodeURIComponent((division?.slug || division?.id || district.division_id).toLowerCase());
  const heroImg = optimizeImageUrl(district.image_url || FALLBACK_HERO_IMAGE, 1600);
  const heroThumb = optimizeImageUrl(district.image_url || FALLBACK_HERO_IMAGE, 900);

  const publishedSpots = spots
    .filter(s => s.is_published !== false)
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || (b.rating || 0) - (a.rating || 0));

  const relatedGuides = articles
    .filter(a => {
      if (a.is_published === false) return false;
      const distId = district.id.toLowerCase();
      const distSlug = (district.slug || '').toLowerCase();
      if (a.related_district_id && (a.related_district_id.toLowerCase() === distId || a.related_district_id.toLowerCase() === distSlug)) {
        return true;
      }
      const searchable = `${a.title_en} ${a.title_bn} ${a.excerpt_en} ${a.excerpt_bn}`.toLowerCase();
      return searchable.includes(district.name_en.toLowerCase()) || searchable.includes(district.name_bn.toLowerCase());
    })
    .slice(0, 3);

  const nearbyDistricts = siblingDistricts
    .filter(d => d.id !== district.id && d.is_published !== false)
    .slice(0, 6);

  return `
    <!-- 1. Breadcrumb Navigation -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [
            { labelBn: 'বাংলাদেশের ৬৪ জেলা', labelEn: '64 Districts', url: '/districts/' },
            ...(division
              ? [{ labelBn: `${division.name_bn} বিভাগ`, labelEn: `${division.name_en} Division`, url: `/divisions/${divSlug}/` }]
              : []),
            { labelBn: district.name_bn, labelEn: district.name_en }
          ],
          lang
        )}
      </div>
    </div>

    <!-- 2. District Hero Banner -->
    <section
      class="hero-wrapper"
      style="min-height: 380px; padding: 3.25rem 0; background: linear-gradient(135deg, rgba(18, 60, 50, 0.93) 0%, rgba(28, 89, 72, 0.80) 100%), url('${heroImg}') center/cover no-repeat;"
    >
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-7">
            <div class="d-flex flex-wrap gap-2 mb-3">
              <a href="/districts/" class="btn btn-outline-light btn-sm rounded-pill px-3">
                <i class="bi bi-arrow-left me-1"></i>${isBn ? 'সকল ৬৪ জেলা' : 'All 64 Districts'}
              </a>
              <a href="/divisions/${divSlug}/" class="btn btn-warning btn-sm text-dark fw-semibold rounded-pill px-3">
                <i class="bi bi-diagram-3-fill me-1"></i>${escapeHtml(divName)} ${isBn ? 'বিভাগ' : 'Division'}
              </a>
            </div>

            <h1 class="hero-title mb-2">
              ${escapeHtml(primaryName)} ${isBn ? 'জেলা' : 'District'}
            </h1>
            <p class="fs-5 text-warning fw-semibold mb-3 opacity-90">
              ${escapeHtml(secondaryName)} ${isBn ? 'District' : 'জেলা'}
            </p>
            <p class="hero-subtitle mb-4">${escapeHtml(desc)}</p>

            <div class="p-3 rounded-3 text-white" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);">
              <div class="small text-warning fw-bold mb-1">
                <i class="bi bi-award-fill me-1"></i>${isBn ? 'বিশেষ পরিচিতি ও বিখ্যাত:' : 'Famous For & Specialties:'}
              </div>
              <div class="small text-white">${escapeHtml(famousFor)}</div>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="rounded-4 overflow-hidden shadow-lg border border-light border-opacity-25 bg-dark">
              <div class="position-relative" style="height: 220px;">
                <img
                  src="${heroThumb}"
                  alt="${escapeHtml(district.name_en)} (${escapeHtml(district.name_bn)})"
                  class="w-100 h-100"
                  style="object-fit: cover;"
                  loading="eager"
                  decoding="async"
                  onerror="this.onerror=null;this.src='${FALLBACK_HERO_IMAGE}';"
                >
                <div class="position-absolute bottom-0 start-0 end-0 p-3" style="background: linear-gradient(transparent, rgba(18, 60, 50, 0.92));">
                  <div class="small text-warning fw-semibold">
                    <i class="bi bi-pin-map-fill me-1"></i>${escapeHtml(district.name_bn)} — ${escapeHtml(district.name_en)}
                  </div>
                </div>
              </div>
              <div class="p-3 text-white" style="background: rgba(18, 60, 50, 0.95);">
                <div class="row g-2 text-center">
                  <div class="col-6 border-end border-light border-opacity-25">
                    <div class="fs-5 fw-bold text-warning">${escapeHtml(divName)}</div>
                    <div class="small text-white-50">${isBn ? 'প্রশাসনিক বিভাগ' : 'Division'}</div>
                  </div>
                  <div class="col-6">
                    <div class="fs-4 fw-bold text-warning">${formatLocalizedNumber(publishedSpots.length || district.popular_spots_count || 0, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'জনপ্রিয় স্থান' : 'Popular Spots'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Tourist Attractions in This District -->
    <section class="container py-5" id="district-spots-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'ভ্রমণ গন্তব্য' : 'Destinations'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? `${primaryName} জেলার দর্শনীয় স্থানসমূহ` : `Tourist Attractions in ${primaryName} District`}
          </h2>
          <p class="text-muted mb-0">
            ${isBn
              ? `${district.name_bn} (${district.name_en}) জেলার তালিকাভুক্ত ও প্রকাশিত পর্যটন কেন্দ্রসমূহ।`
              : `Published landmarks and curated travel destinations across ${district.name_en} (${district.name_bn}) District.`}
          </p>
        </div>
        <a href="/divisions/${divSlug}/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
          <i class="bi bi-compass me-1"></i>${isBn ? `${divName} বিভাগের সব গন্তব্য` : `All ${divName} Attractions`}
        </a>
      </div>

      ${publishedSpots.length === 0 ? `
        ${renderEmptyState({
          titleBn: `${district.name_bn} জেলার নির্দিষ্ট স্পট এখনো যুক্ত হয়নি`,
          titleEn: `No Published Spots Listed Yet for ${district.name_en}`,
          descBn: `আপনি ${divName} বিভাগের সকল জনপ্রিয় দর্শনীয় স্থান ঘুরে দেখতে পারেন অথবা অ্যাডমিন সিএমএস থেকে নতুন স্পট যুক্ত করতে পারেন।`,
          descEn: `Explore top attractions across ${divName} Division while detailed destination guides for ${district.name_en} are updated in Firestore.`,
          icon: 'bi-pin-map',
          lang
        })}
      ` : `
        <div class="row g-4">
          ${publishedSpots
            .map(spot => {
              const category = categories.find(c => spot.category_ids?.includes(c.id));
              return renderDestinationCard({
                spot,
                division: division || undefined,
                district,
                category,
                isBookmarked: bookmarkedIds.has(spot.id),
                lang
              });
            })
            .join('')}
        </div>
      `}
    </section>

    ${relatedGuides.length > 0 ? `
      <section class="container py-4 pb-5" id="district-guides-section">
        <div class="mb-4">
          <span class="badge bg-secondary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'ভ্রমণ সহায়িকা' : 'Travel Guides'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? `${primaryName} সম্পর্কিত ভ্রমণ নিবন্ধ` : `Travel Guides for ${primaryName}`}
          </h2>
        </div>
        <div class="row g-4">
          ${relatedGuides
            .map(art => `
              <div class="col-lg-4 col-md-6">
                <article class="card-travel h-100 d-flex flex-column">
                  <div class="card-travel-img-box" style="height: 185px;">
                    <img
                      src="${optimizeImageUrl(art.image_url, 600)}"
                      alt="${escapeHtml(isBn ? art.title_bn : art.title_en)}"
                      class="card-travel-img"
                      loading="lazy"
                      decoding="async"
                      onerror="this.onerror=null;this.src='${FALLBACK_HERO_IMAGE}';"
                    >
                  </div>
                  <div class="card-travel-body d-flex flex-column flex-grow-1">
                    <h3 class="h6 fw-bold text-primary-bd mb-2">${escapeHtml(isBn ? art.title_bn : art.title_en)}</h3>
                    <p class="small text-secondary flex-grow-1">${escapeHtml(isBn ? art.excerpt_bn : art.excerpt_en)}</p>
                    <button class="btn btn-outline-bd btn-sm w-100 mt-auto article-detail-btn" data-article-id="${escapeHtml(art.id)}">
                      <i class="bi bi-book-half me-1"></i>${isBn ? 'বিস্তারিত পড়ুন' : 'Read Guide'}
                    </button>
                  </div>
                </article>
              </div>
            `)
            .join('')}
        </div>
      </section>
    ` : ''}

    ${nearbyDistricts.length > 0 ? `
      <section class="container py-4 pb-5">
        <div class="bg-white rounded-4 border shadow-sm p-4">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h3 class="h5 fw-bold text-primary-bd mb-0">
              <i class="bi bi-geo-alt-fill text-warning me-2"></i>
              ${isBn ? `${divName} বিভাগের অন্যান্য জেলা` : `Other Districts in ${divName} Division`}
            </h3>
            <a href="/districts/" class="small fw-semibold text-secondary-bd text-decoration-none">
              ${isBn ? 'সকল ৬৪ জেলা দেখুন →' : 'View All 64 Districts →'}
            </a>
          </div>
          <div class="d-flex flex-wrap gap-2">
            ${nearbyDistricts.map(d => `
              <a href="/districts/${encodeURIComponent((d.slug || d.id).toLowerCase())}/" class="btn btn-sm btn-outline-bd rounded-pill px-3">
                ${escapeHtml(isBn ? `${d.name_bn} (${d.name_en})` : `${d.name_en} (${d.name_bn})`)}
              </a>
            `).join('')}
          </div>
        </div>
      </section>
    ` : ''}
  `;
}
