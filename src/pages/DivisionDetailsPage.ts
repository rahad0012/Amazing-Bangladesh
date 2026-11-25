/**
 * Dynamic Division Details Page Template (Reusable for all 8 Divisions)
 * URLs: /divisions/dhaka/, /divisions/chattogram/, /divisions/sylhet/, /divisions/khulna/, etc.
 * Fetches division, districts, published tourist spots, and travel guides from Firestore
 */

import {
  getDivisionRegionalOverviewFallback,
  type Division,
  type District,
  type Category,
  type TouristSpot,
  type Article
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl, formatAreaSqKm } from '../utils/formatUtils';
import {
  renderBreadcrumbs,
  renderDestinationCard,
  renderDistrictCard
} from '../components';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export interface DivisionDetailPageProps {
  lang: Language;
  requestedSlug: string;
  division: Division | null;
  districts: District[];
  spots: TouristSpot[];
  categories: Category[];
  articles: Article[];
  bookmarkedIds: Set<string>;
  selectedDistrictFilterId?: string | null;
  isLoading: boolean;
  error: string | null;
}

const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80';

const OFFICIAL_DIVISION_LINKS: ReadonlyArray<{ slug: string; nameBn: string; nameEn: string }> = [
  { slug: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka' },
  { slug: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram' },
  { slug: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi' },
  { slug: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna' },
  { slug: 'barishal', nameBn: 'বরিশাল', nameEn: 'Barishal' },
  { slug: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet' },
  { slug: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur' },
  { slug: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh' }
];

function matchesDivisionRef(division: Division, ref?: string): boolean {
  if (!ref) return false;
  const target = ref.trim().toLowerCase();
  return (
    target === division.id.toLowerCase() ||
    (!!division.slug && target === division.slug.toLowerCase()) ||
    target === division.name_en.toLowerCase()
  );
}

function getRelevantTravelGuides(
  division: Division,
  divDistricts: District[],
  divSpots: TouristSpot[],
  articles: Article[]
): { guides: Article[]; isFallbackToNational: boolean } {
  const publishedArticles = articles.filter(a => a.is_published !== false);
  if (publishedArticles.length === 0) {
    return { guides: [], isFallbackToNational: false };
  }

  const districtIds = new Set(divDistricts.map(d => d.id.toLowerCase()));
  const spotIds = new Set(divSpots.map(s => s.id.toLowerCase()));
  const keywords = [
    division.id.toLowerCase(),
    (division.slug || '').toLowerCase(),
    division.name_en.toLowerCase(),
    division.name_bn.toLowerCase(),
    ...divDistricts.map(d => d.name_en.toLowerCase()),
    ...divDistricts.map(d => d.name_bn.toLowerCase()),
    ...divSpots.map(s => s.name_en.toLowerCase()),
    ...divSpots.map(s => s.name_bn.toLowerCase())
  ].filter(Boolean);

  const matched = publishedArticles.filter(article => {
    if (article.related_district_id && districtIds.has(article.related_district_id.toLowerCase())) {
      return true;
    }
    if (article.related_spot_id && spotIds.has(article.related_spot_id.toLowerCase())) {
      return true;
    }
    const searchable = [
      article.title_en,
      article.title_bn,
      article.excerpt_en,
      article.excerpt_bn,
      article.content_en,
      article.content_bn,
      ...(article.tags || [])
    ]
      .join(' ')
      .toLowerCase();
    return keywords.some(kw => kw.length > 2 && searchable.includes(kw));
  });

  if (matched.length > 0) {
    return { guides: matched, isFallbackToNational: false };
  }

  return { guides: publishedArticles.slice(0, 3), isFallbackToNational: true };
}

export function renderDivisionDetailPage(props: DivisionDetailPageProps): string {
  const {
    lang,
    requestedSlug,
    division,
    districts,
    spots,
    categories,
    articles,
    bookmarkedIds,
    selectedDistrictFilterId,
    isLoading,
    error
  } = props;

  const isBn = lang === 'bn';

  // Loading State
  if (isLoading) {
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'বাংলাদেশের ৮ বিভাগ', labelEn: '8 Divisions', url: '/divisions/' },
              { labelBn: 'লোড হচ্ছে...', labelEn: 'Loading...' }
            ],
            lang
          )}
        </div>
      </div>
      <section class="hero-wrapper" style="min-height: 300px; padding: 3rem 0;">
        <div class="container">
          <div class="placeholder-glow">
            <span class="placeholder col-3 bg-warning rounded-pill mb-3" style="height: 24px;"></span>
            <h1 class="placeholder col-6 bg-light rounded mb-3" style="height: 44px;"></h1>
            <p class="placeholder col-8 bg-light rounded opacity-50" style="height: 20px;"></p>
          </div>
        </div>
      </section>
      <div class="container py-5">
        <div class="row g-4">
          ${renderCardSkeleton(6, 'col-lg-4 col-md-6 mb-4')}
        </div>
      </div>
    `;
  }

  // Error or Missing Document / Invalid Slug State
  if (error || !division) {
    const cleanSlug = escapeHtml(requestedSlug || '');
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'বাংলাদেশের ৮ বিভাগ', labelEn: '8 Divisions', url: '/divisions/' },
              { labelBn: 'পাওয়া যায়নি', labelEn: 'Not Found' }
            ],
            lang
          )}
        </div>
      </div>
      <div class="container py-5">
        ${error
          ? renderErrorState({
              title: isBn ? 'বিভাগের তথ্য লোড করা যায়নি' : 'Failed to load division details',
              message: error,
              retryActionId: 'division-detail-retry-btn',
              lang
            })
          : `
            <div class="bg-white rounded-4 border shadow-sm p-4 p-md-5 text-center my-3">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning-emphasis mb-3" style="width: 72px; height: 72px;">
                <i class="bi bi-signpost-split fs-1"></i>
              </div>
              <span class="d-block badge bg-light text-secondary border mx-auto mb-2" style="width: fit-content;">
                404 • /divisions/${cleanSlug}/
              </span>
              <h1 class="fw-bold text-primary-bd mb-2 h2">
                ${isBn ? 'দুঃখিত, এই বিভাগটি খুঁজে পাওয়া যায়নি' : 'Division Not Found'}
              </h1>
              <p class="text-muted mx-auto mb-4" style="max-width: 580px;">
                ${isBn
                  ? `"${cleanSlug}" নামে বাংলাদেশের কোনো প্রশাসনিক বিভাগ পাওয়া যায়নি অথবা নথিটি বর্তমানে অপ্রকাশিত রয়েছে। নিচের বৈধ বিভাগসমূহ থেকে একটি বেছে নিন অথবা সকল বিভাগের পাতায় ফিরে যান।`
                  : `No published administrative division matched the slug "${cleanSlug}". Please verify the URL or select one of Bangladesh's 8 official divisions below.`}
              </p>
              <div class="d-flex flex-wrap justify-content-center gap-2 mb-4">
                <a href="/divisions/" class="btn btn-primary-bd px-4 py-2 rounded-pill" id="back-to-divisions-btn">
                  <i class="bi bi-grid-fill me-2"></i>${isBn ? 'সকল ৮ বিভাগ দেখুন' : 'Back to All 8 Divisions'}
                </a>
                <a href="/" class="btn btn-outline-bd px-4 py-2 rounded-pill division-home-link">
                  <i class="bi bi-house me-2"></i>${isBn ? 'মূলপাতায় ফিরুন' : 'Return Home'}
                </a>
              </div>
              <hr class="my-4">
              <div class="small text-secondary fw-semibold mb-3">
                ${isBn ? 'বাংলাদেশের ৮টি অফিসিয়াল বিভাগ:' : 'Official Divisions of Bangladesh:'}
              </div>
              <div class="d-flex flex-wrap justify-content-center gap-2">
                ${OFFICIAL_DIVISION_LINKS.map(item => `
                  <a href="/divisions/${item.slug}/" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
                    ${isBn ? item.nameBn : item.nameEn}
                  </a>
                `).join('')}
              </div>
            </div>
          `}
      </div>
    `;
  }

  // Resolved Division Metadata
  const divSlugKey = (division.slug || division.id || '').toLowerCase();
  const primaryName = isBn ? division.name_bn : division.name_en;
  const secondaryName = isBn ? division.name_en : division.name_bn;
  const divDesc = isBn ? division.description_bn : division.description_en;
  const divHq = isBn ? division.headquarters_bn : division.headquarters_en;
  const heroImg = optimizeImageUrl(division.image_url || FALLBACK_HERO_IMAGE, 1600);
  const heroThumb = optimizeImageUrl(division.image_url || FALLBACK_HERO_IMAGE, 900);

  // Districts & Spots filtered cleanly to this division
  const divDistricts = districts.filter(
    d => d.is_published !== false && matchesDivisionRef(division, d.division_id)
  );
  const allDivSpots = [...spots]
    .filter(s => s.is_published !== false && matchesDivisionRef(division, s.division_id))
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || (b.rating || 0) - (a.rating || 0));

  const activeFilterDistrict = selectedDistrictFilterId
    ? divDistricts.find(d => d.id === selectedDistrictFilterId) || null
    : null;

  const displayedSpots = activeFilterDistrict
    ? allDivSpots.filter(s => s.district_id === activeFilterDistrict.id)
    : allDivSpots;

  // Regional Geographic & Cultural Overview (Firestore fields override local official summary if present)
  const overviewFallback = getDivisionRegionalOverviewFallback(divSlugKey);
  const geographyText =
    (isBn ? division.geography_bn : division.geography_en)?.trim() ||
    (isBn ? overviewFallback?.geography_bn : overviewFallback?.geography_en) ||
    divDesc ||
    '';
  const cultureText =
    (isBn ? division.culture_bn : division.culture_en)?.trim() ||
    (isBn ? overviewFallback?.culture_bn : overviewFallback?.culture_en) ||
    '';
  const riversText =
    (isBn ? division.rivers_bn : division.rivers_en)?.trim() ||
    (isBn ? overviewFallback?.rivers_bn : overviewFallback?.rivers_en) ||
    '';
  const climateText =
    (isBn ? division.climate_bn : division.climate_en)?.trim() ||
    (isBn ? overviewFallback?.climate_bn : overviewFallback?.climate_en) ||
    '';
  const savedHighlights = isBn ? division.heritage_highlights_bn : division.heritage_highlights_en;
  const fallbackHighlights = isBn
    ? overviewFallback?.heritage_highlights_bn || []
    : overviewFallback?.heritage_highlights_en || [];
  const regionalHighlights =
    Array.isArray(savedHighlights) && savedHighlights.length > 0 ? savedHighlights : fallbackHighlights;

  // Aggregate unique famous-for cultural/culinary highlights from official districts
  const districtSpecialties = Array.from(
    new Set(
      divDistricts
        .map(d => (isBn ? d.famous_for_bn : d.famous_for_en))
        .filter(Boolean)
    )
  ).slice(0, 6);

  // Related Travel Guides
  const { guides: relatedGuides, isFallbackToNational } = getRelevantTravelGuides(
    division,
    divDistricts,
    allDivSpots,
    articles
  );

  const officialDistrictCount = division.districts_count || divDistricts.length;

  return `
    <!-- 1. Breadcrumb Navigation -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [
            { labelBn: 'বাংলাদেশের ৮ বিভাগ', labelEn: '8 Divisions', url: '/divisions/' },
            { labelBn: division.name_bn, labelEn: division.name_en }
          ],
          lang
        )}
      </div>
    </div>

    <!-- 2, 3 & 4. Division Hero Image, Bilingual Name (Bengali & English), and Introduction -->
    <section
      class="hero-wrapper"
      style="min-height: 410px; padding: 3.5rem 0; background: linear-gradient(135deg, rgba(18, 60, 50, 0.93) 0%, rgba(28, 89, 72, 0.80) 100%), url('${heroImg}') center/cover no-repeat;"
    >
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-7">
            <a href="/divisions/" class="btn btn-outline-light btn-sm rounded-pill px-3 mb-3 division-back-link">
              <i class="bi bi-arrow-left me-1"></i>${isBn ? 'সকল ৮ বিভাগ' : 'All 8 Divisions'}
            </a>

            <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
              <span class="hero-pill-badge mb-0">
                <i class="bi bi-building"></i>
                <span>${isBn ? 'বিভাগীয় সদর:' : 'Headquarters:'} ${escapeHtml(divHq)}</span>
              </span>
              <span class="badge bg-warning text-dark px-3 py-2 rounded-pill fw-semibold">
                ${escapeHtml(division.name_bn)} • ${escapeHtml(division.name_en)}
              </span>
            </div>

            <h1 class="hero-title mb-2">
              ${escapeHtml(primaryName)} ${isBn ? 'বিভাগ' : 'Division'}
            </h1>
            <p class="fs-5 text-warning fw-semibold mb-3 opacity-90">
              ${escapeHtml(secondaryName)} ${isBn ? 'Division' : 'বিভাগ'}
            </p>
            <p class="hero-subtitle mb-4">${escapeHtml(divDesc)}</p>

            <div class="d-flex flex-wrap gap-2">
              <a href="#division-districts-section" class="btn btn-accent px-4 py-2 rounded-pill">
                <i class="bi bi-geo-alt-fill me-1"></i>${formatLocalizedNumber(divDistricts.length || officialDistrictCount, lang)} ${isBn ? 'টি জেলা দেখুন' : 'Districts'}
              </a>
              <a href="#division-spots-section" class="btn btn-outline-light px-4 py-2 rounded-pill">
                <i class="bi bi-compass me-1"></i>${isBn ? 'দর্শনীয় স্থান' : 'Attractions'} (${formatLocalizedNumber(allDivSpots.length, lang)})
              </a>
              <a href="#division-guides-section" class="btn btn-outline-light px-3 py-2 rounded-pill">
                <i class="bi bi-journal-richtext me-1"></i>${isBn ? 'ভ্রমণ গাইড' : 'Travel Guides'}
              </a>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="rounded-4 overflow-hidden shadow-lg border border-light border-opacity-25 bg-dark">
              <div class="position-relative" style="height: 220px;">
                <img
                  src="${heroThumb}"
                  alt="${escapeHtml(division.name_en)} (${escapeHtml(division.name_bn)}) Division Panorama"
                  class="w-100 h-100"
                  style="object-fit: cover;"
                  loading="eager"
                  decoding="async"
                  onerror="this.onerror=null;this.src='${FALLBACK_HERO_IMAGE}';"
                >
                <div class="position-absolute bottom-0 start-0 end-0 p-3" style="background: linear-gradient(transparent, rgba(18, 60, 50, 0.92));">
                  <div class="small text-warning fw-semibold">
                    <i class="bi bi-pin-map-fill me-1"></i>${escapeHtml(division.name_bn)} — ${escapeHtml(division.name_en)}
                  </div>
                </div>
              </div>
              <div class="p-3 text-white" style="background: rgba(18, 60, 50, 0.95);">
                <div class="row g-2 text-center">
                  <div class="col-4">
                    <div class="fs-4 fw-bold text-warning">${formatLocalizedNumber(officialDistrictCount, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'জেলা' : 'Districts'}</div>
                  </div>
                  <div class="col-4 border-start border-end border-light border-opacity-25">
                    <div class="fs-4 fw-bold text-warning">${formatLocalizedNumber(allDivSpots.length, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'দর্শনীয় স্থান' : 'Attractions'}</div>
                  </div>
                  <div class="col-4">
                    <div class="fs-5 fw-bold text-warning pt-1">${formatAreaSqKm(division.area_sq_km, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'আয়তন' : 'Total Area'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. Geographic and Cultural Overview -->
    <section class="container py-5" id="division-overview-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill mb-2">
            <i class="bi bi-globe-asia-australia me-1"></i>${isBn ? 'আঞ্চলিক পরিচিতি' : 'Regional Profile'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? `${primaryName} বিভাগের ভৌগোলিক ও সাংস্কৃতিক পরিচয়` : `Geographic & Cultural Overview of ${primaryName}`}
          </h2>
          <p class="text-muted mb-0">
            ${isBn
              ? `${division.name_bn} (${division.name_en}) অঞ্চলের ভূপ্রকৃতি, নদ-নদী, ঐতিহ্য ও সাংস্কৃতিক বৈচিত্র্য।`
              : `Topography, river systems, living traditions, and heritage across ${division.name_en} (${division.name_bn}) Division.`}
          </p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="bg-white rounded-4 border shadow-sm p-4 h-100">
            <div class="d-flex align-items-center gap-2 mb-3">
              <div class="rounded-3 bg-success-subtle text-success p-2 d-inline-flex align-items-center justify-content-center">
                <i class="bi bi-map-fill fs-5"></i>
              </div>
              <h3 class="h5 fw-bold text-primary-bd mb-0">
                ${isBn ? 'ভৌগোলিক অবস্থান ও প্রকৃতি' : 'Geography & Natural Landscape'}
              </h3>
            </div>
            ${geographyText
              ? `<p class="text-secondary mb-3">${escapeHtml(geographyText)}</p>`
              : `<p class="text-muted small mb-3">${isBn ? 'ভৌগোলিক তথ্য এখনো যুক্ত করা হয়নি।' : 'Geographic overview has not been added yet.'}</p>`}

            ${riversText ? `
              <div class="p-3 rounded-3 bg-light border mb-2">
                <div class="small fw-bold text-primary-bd mb-1">
                  <i class="bi bi-water text-info me-1"></i>${isBn ? 'প্রধান নদ-নদী ও জলপথ:' : 'Major Rivers & Waterways:'}
                </div>
                <div class="small text-secondary">${escapeHtml(riversText)}</div>
              </div>
            ` : ''}
            ${climateText ? `
              <div class="p-3 rounded-3 bg-light border">
                <div class="small fw-bold text-primary-bd mb-1">
                  <i class="bi bi-sun text-warning me-1"></i>${isBn ? 'ভ্রমণের সেরা মৌসুম:' : 'Best Season to Visit:'}
                </div>
                <div class="small text-secondary">${escapeHtml(climateText)}</div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="col-lg-6">
          <div class="bg-white rounded-4 border shadow-sm p-4 h-100">
            <div class="d-flex align-items-center gap-2 mb-3">
              <div class="rounded-3 bg-warning-subtle text-warning-emphasis p-2 d-inline-flex align-items-center justify-content-center">
                <i class="bi bi-stars fs-5"></i>
              </div>
              <h3 class="h5 fw-bold text-primary-bd mb-0">
                ${isBn ? 'সংস্কৃতি, ঐতিহ্য ও জীবনধারা' : 'Culture, Heritage & Traditions'}
              </h3>
            </div>
            ${cultureText
              ? `<p class="text-secondary mb-3">${escapeHtml(cultureText)}</p>`
              : `<p class="text-muted small mb-3">${isBn ? 'সাংস্কৃতিক পরিচিতি এখনো যুক্ত করা হয়নি।' : 'Cultural overview has not been added yet.'}</p>`}

            ${regionalHighlights.length > 0 ? `
              <div class="mb-3">
                <div class="small fw-bold text-primary-bd mb-2">
                  <i class="bi bi-award text-warning me-1"></i>${isBn ? 'উল্লেখযোগ্য সাংস্কৃতিক ও ঐতিহ্যবাহী আকর্ষণ:' : 'Signature Cultural Highlights:'}
                </div>
                <div class="d-flex flex-wrap gap-2">
                  ${regionalHighlights.map(item => `
                    <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                      ${escapeHtml(item)}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${districtSpecialties.length > 0 ? `
              <div class="pt-2 border-top">
                <div class="small fw-bold text-primary-bd mb-2">
                  <i class="bi bi-cup-hot text-accent-bd me-1"></i>${isBn ? 'জেলাভিত্তিক বিখ্যাত ঐতিহ্য ও খাবার:' : 'District Culinary & Craft Specialties:'}
                </div>
                <div class="small text-secondary">${districtSpecialties.map(s => escapeHtml(s)).join(' • ')}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </section>

    <!-- 6 & 7. All Districts Belonging to This Division & District Cards with Images -->
    <section class="container py-4 pb-5" id="division-districts-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-primary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${formatLocalizedNumber(divDistricts.length, lang)} ${isBn ? 'টি অফিসিয়াল জেলা' : 'Official Districts'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? `${primaryName} বিভাগের সকল জেলাসমূহ` : `All Districts of ${primaryName} Division`}
          </h2>
          <p class="text-muted mb-0">
            ${isBn
              ? `${division.name_bn} বিভাগের প্রশাসনিক কাঠামোভুক্ত প্রতিটি জেলার পরিচিতি, বিখ্যাত ঐতিহ্য ও দর্শনীয় স্থান।`
              : `Complete official administrative directory of all ${divDistricts.length} districts in ${division.name_en} Division.`}
          </p>
        </div>
        ${activeFilterDistrict ? `
          <button class="btn btn-outline-bd btn-sm rounded-pill px-3" id="clear-district-spot-filter-btn">
            <i class="bi bi-x-circle me-1"></i>${isBn ? 'সকল জেলার স্পট দেখুন' : 'Show All Division Spots'}
          </button>
        ` : ''}
      </div>

      ${divDistricts.length === 0 ? `
        ${renderEmptyState({
          titleBn: 'কোনো জেলা পাওয়া যায়নি',
          titleEn: 'No Districts Listed',
          descBn: 'এই বিভাগের জেলাসমূহের তথ্য ফায়ারস্টোরে পাওয়া যায়নি।',
          descEn: 'No published district records were found for this division.',
          icon: 'bi-geo-alt',
          lang
        })}
      ` : `
        <div class="row g-3">
          ${divDistricts
            .map(dist => {
              const spotsInDist = allDivSpots.filter(s => s.district_id === dist.id).length;
              return renderDistrictCard({
                district: dist,
                division,
                spotCount: spotsInDist,
                lang
              });
            })
            .join('')}
        </div>
      `}
    </section>

    <!-- 8. Popular Tourist Attractions in This Division -->
    <section class="container py-4 pb-5" id="division-spots-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'শীর্ষ দর্শনীয় স্থান' : 'Popular Attractions'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${activeFilterDistrict
              ? (isBn
                  ? `${activeFilterDistrict.name_bn} জেলার দর্শনীয় স্থানসমূহ`
                  : `Tourist Attractions in ${activeFilterDistrict.name_en} District`)
              : (isBn
                  ? `${primaryName} বিভাগের জনপ্রিয় দর্শনীয় স্থানসমূহ`
                  : `Popular Tourist Attractions in ${primaryName}`)}
          </h2>
          <p class="text-muted mb-0">
            ${activeFilterDistrict
              ? (isBn
                  ? `${activeFilterDistrict.name_bn} জেলার প্রকাশিত পর্যটন গন্তব্যসমূহ নিচে প্রদর্শিত হচ্ছে।`
                  : `Showing published attractions located in ${activeFilterDistrict.name_en} District.`)
              : (isBn
                  ? `${division.name_bn} বিভাগের প্রকৃতি, ঐতিহাসিক স্থাপনা ও নির্বাচিত ভ্রমণ আকর্ষণ।`
                  : `Explore top-rated landmarks, eco-reserves, and cultural treasures across ${division.name_en} Division.`)}
          </p>
        </div>
        ${activeFilterDistrict ? `
          <button class="btn btn-outline-bd btn-sm rounded-pill px-3" id="clear-district-spot-filter-btn-2">
            <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? `${primaryName} বিভাগের সব স্পট` : `All ${primaryName} Attractions`}
          </button>
        ` : ''}
      </div>

      ${displayedSpots.length === 0 ? `
        ${renderEmptyState({
          titleBn: activeFilterDistrict
            ? `${activeFilterDistrict.name_bn} জেলায় প্রকাশিত স্পট নেই`
            : 'এই বিভাগে কোনো প্রকাশিত স্পট পাওয়া যায়নি',
          titleEn: activeFilterDistrict
            ? `No Published Spots Listed in ${activeFilterDistrict.name_en}`
            : 'No Published Attractions Found in This Division',
          descBn: activeFilterDistrict
            ? 'এই জেলার নির্দিষ্ট স্পট এখনো যুক্ত হয়নি। পুরো বিভাগের দর্শনীয় স্থানসমূহ দেখতে ফিল্টার মুছুন।'
            : 'এই বিভাগের দর্শনীয় স্থানের তালিকা শীঘ্রই ফায়ারস্টোরে যুক্ত করা হবে।',
          descEn: activeFilterDistrict
            ? 'Clear the district filter to explore all published tourist attractions in this division.'
            : 'Curated destinations for this division are being updated in Firestore.',
          actionTextBn: activeFilterDistrict ? 'সকল স্পট দেখুন' : undefined,
          actionTextEn: activeFilterDistrict ? 'View All Division Spots' : undefined,
          actionId: activeFilterDistrict ? 'clear-district-spot-filter-empty-btn' : undefined,
          icon: 'bi-pin-map',
          lang
        })}
      ` : `
        <div class="row g-4">
          ${displayedSpots
            .map(spot => {
              const district = districts.find(d => d.id === spot.district_id);
              const category = categories.find(c => spot.category_ids?.includes(c.id));
              return renderDestinationCard({
                spot,
                division,
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

    <!-- 9. Related Travel Guides -->
    <section class="container py-4 pb-5" id="division-guides-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-secondary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${isFallbackToNational
              ? (isBn ? 'নির্বাচিত বাংলাদেশ ভ্রমণ গাইড' : 'Featured Bangladesh Guides')
              : (isBn ? `${primaryName} ভ্রমণ সহায়িকা` : `${primaryName} Travel Guides`)}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? 'সম্পর্কিত ভ্রমণ নির্দেশিকা ও নিবন্ধ' : 'Related Travel Guides'}
          </h2>
          <p class="text-muted mb-0">
            ${isFallbackToNational
              ? (isBn
                  ? `${division.name_bn} ভ্রমণের পাশাপাশি দেশব্যাপী ভ্রমণ পরিকল্পনা ও রন্ধনশিল্প গাইড পড়ুন।`
                  : `Recommended nationwide itineraries, eco-travel tips, and cultural guides to complement your ${division.name_en} journey.`)
              : (isBn
                  ? `${division.name_bn} বিভাগের গন্তব্য, রুট ও অভিজ্ঞতার ওপর বিশেষজ্ঞ ভ্রমণ নিবন্ধ।`
                  : `Curated articles, itineraries, and cultural stories connected to ${division.name_en} Division.`)}
          </p>
        </div>
        <a href="/travel-guides/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
          <i class="bi bi-journal-text me-1"></i>${isBn ? 'সকল ভ্রমণ গাইড' : 'All Travel Guides'}
        </a>
      </div>

      ${relatedGuides.length === 0 ? `
        ${renderEmptyState({
          titleBn: 'কোনো ভ্রমণ গাইড পাওয়া যায়নি',
          titleEn: 'No Related Travel Guides Found',
          descBn: 'এই বিভাগের জন্য ভ্রমণ নির্দেশিকা শীঘ্রই প্রকাশ করা হবে।',
          descEn: 'Travel guides for this region will be published soon.',
          icon: 'bi-journal-richtext',
          lang
        })}
      ` : `
        <div class="row g-4">
          ${relatedGuides
            .map(art => `
              <div class="col-lg-4 col-md-6">
                <article class="card-travel h-100 d-flex flex-column">
                  <div class="card-travel-img-box" style="height: 190px;">
                    <img
                      src="${optimizeImageUrl(art.image_url, 600)}"
                      alt="${escapeHtml(isBn ? art.title_bn : art.title_en)}"
                      class="card-travel-img"
                      loading="lazy"
                      decoding="async"
                      onerror="this.onerror=null;this.src='${FALLBACK_HERO_IMAGE}';"
                    >
                    <span class="card-badge-rating">
                      <i class="bi bi-clock me-1"></i>${escapeHtml(isBn ? art.read_time_bn : art.read_time_en)}
                    </span>
                  </div>
                  <div class="card-travel-body d-flex flex-column flex-grow-1">
                    <div class="small text-muted mb-2 d-flex justify-content-between align-items-center">
                      <span><i class="bi bi-person me-1"></i>${escapeHtml(isBn ? art.author_bn : art.author_en)}</span>
                      <span>${escapeHtml(art.published_at || '')}</span>
                    </div>
                    <h3 class="card-travel-title fw-bold mb-2" style="font-size: 1.08rem;">
                      ${escapeHtml(isBn ? art.title_bn : art.title_en)}
                    </h3>
                    <p class="card-travel-desc small flex-grow-1 mb-3">
                      ${escapeHtml(isBn ? art.excerpt_bn : art.excerpt_en)}
                    </p>
                    <div class="d-flex flex-wrap gap-1 mb-3">
                      ${(art.tags || []).slice(0, 3).map(tag => `
                        <span class="badge bg-light text-secondary border small">${escapeHtml(tag)}</span>
                      `).join('')}
                    </div>
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
            `)
            .join('')}
        </div>
      `}
    </section>
  `;
}
