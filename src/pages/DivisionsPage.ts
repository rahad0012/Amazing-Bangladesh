/**
 * All Divisions Page & Division Details Page Controller
 * URL: /divisions/ and /divisions/:slug/
 * Retrieves live division, district, category, and destination data from Firestore
 */

import {
  type Division,
  type District,
  type Category,
  type TouristSpot
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl, formatAreaSqKm } from '../utils/formatUtils';
import {
  renderBreadcrumbs,
  renderDivisionCard,
  renderDestinationCard
} from '../components';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export interface AllDivisionsPageProps {
  lang: Language;
  divisions: Division[];
  districts: District[];
  spots: TouristSpot[];
  categories: Category[];
  bookmarkedIds: Set<string>;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const HERO_BG_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80';

export function renderAllDivisionsPage(props: AllDivisionsPageProps): string {
  const {
    lang,
    divisions,
    districts,
    spots,
    categories,
    bookmarkedIds,
    searchQuery,
    isLoading,
    error
  } = props;

  const isBn = lang === 'bn';
  const heroTitle = isBn ? 'বাংলাদেশের ৮ বিভাগ' : 'Explore the 8 Divisions of Bangladesh';
  const heroBadge = isBn ? 'প্রশাসনিক ও পর্যটন মানচিত্র' : 'Official Regional Guide';
  const heroIntro = isBn
    ? 'প্রমত্তা পদ্মা-মেঘনা-যমুনার পলিমাটি থেকে শুরু করে সুন্দরবনের গহিন ম্যানগ্রোভ, সিলেটের সবুজ চা বাগান, পার্বত্য চট্টগ্রামের মেঘের উপত্যকা এবং বঙ্গোপসাগরের সোনালী সৈকত—বাংলাদেশের প্রতিটি প্রশাসনিক বিভাগের স্বতন্ত্র ভৌগোলিক সৌন্দর্য, জেলা তালিকা ও প্রধান পর্যটন আকর্ষণসমূহ অন্বেষণ করুন।'
    : 'Journey across Bangladesh’s eight distinct administrative divisions—from historic Mughal capitals and emerald tea valleys to the Sundarbans mangrove delta, misty hill tracts, and the world’s longest unbroken sea beach.';

  const publishedDivisions = divisions.filter(d => d.is_published !== false);
  const q = searchQuery.trim().toLowerCase();
  const filteredDivisions = q
    ? publishedDivisions.filter(d =>
        d.name_en.toLowerCase().includes(q) ||
        d.name_bn.toLowerCase().includes(q) ||
        d.description_en.toLowerCase().includes(q) ||
        d.description_bn.toLowerCase().includes(q) ||
        d.headquarters_en.toLowerCase().includes(q) ||
        d.headquarters_bn.toLowerCase().includes(q)
      )
    : publishedDivisions;

  const totalDistrictsCount = publishedDivisions.reduce(
    (sum, div) => sum + (div.districts_count || 0),
    0
  ) || districts.filter(d => d.is_published !== false).length;
  const totalAreaSqKm = publishedDivisions.reduce(
    (sum, div) => sum + (div.area_sq_km || 0),
    0
  );

  // Pick related travel destinations across divisions (featured first, up to 6)
  const publishedSpots = spots.filter(s => s.is_published !== false);
  const relatedSpots = [...publishedSpots]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || (b.rating || 0) - (a.rating || 0))
    .slice(0, 6);

  return `
    <!-- 1. Breadcrumb Navigation -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [{ labelBn: 'বাংলাদেশের ৮ বিভাগ', labelEn: '8 Divisions' }],
          lang
        )}
      </div>
    </div>

    <!-- 2 & 3. Hero Section with Title & Short Bilingual Introduction -->
    <section
      class="hero-wrapper"
      style="min-height: 390px; padding: 3.5rem 0 4.5rem; background: linear-gradient(135deg, rgba(18, 60, 50, 0.94) 0%, rgba(28, 89, 72, 0.85) 100%), url('${HERO_BG_IMAGE}') center/cover no-repeat;"
    >
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-8">
            <div class="hero-pill-badge">
              <i class="bi bi-diagram-3-fill"></i>
              <span>${escapeHtml(heroBadge)}</span>
            </div>
            <h1 class="hero-title mb-3">${escapeHtml(heroTitle)}</h1>
            <p class="hero-subtitle mb-4">${escapeHtml(heroIntro)}</p>
            <div class="d-flex flex-wrap gap-2">
              <a href="#divisions-grid-section" class="btn btn-accent px-4 py-2 rounded-pill">
                <i class="bi bi-grid-fill me-2"></i>${isBn ? 'বিভাগসমূহ দেখুন' : 'Browse Divisions'}
              </a>
              <a href="#related-destinations-section" class="btn btn-outline-light px-4 py-2 rounded-pill">
                <i class="bi bi-compass me-2"></i>${isBn ? 'সম্পর্কিত গন্তব্যসমূহ' : 'Related Destinations'}
              </a>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="p-4 rounded-4 text-white" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(217, 164, 65, 0.35);">
              <div class="row g-3 text-center">
                <div class="col-4">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedDivisions.length || 8, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'বিভাগ' : 'Divisions'}</div>
                </div>
                <div class="col-4">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(totalDistrictsCount || 64, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'জেলা' : 'Districts'}</div>
                </div>
                <div class="col-4">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedSpots.length, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'গন্তব্য' : 'Spots'}</div>
                </div>
              </div>
              ${totalAreaSqKm > 0 ? `
                <hr class="border-light opacity-25 my-3">
                <div class="d-flex justify-content-between align-items-center small text-white-50">
                  <span><i class="bi bi-rulers text-warning me-1"></i>${isBn ? 'মোট আয়তন' : 'Total Area'}</span>
                  <span class="fw-semibold text-white">${formatAreaSqKm(Math.round(totalAreaSqKm), lang)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Floating Search / Filter Bar for Divisions -->
    <div class="container">
      <div class="search-card-wrapper">
        <div class="row g-3 align-items-center">
          <div class="col-lg-8">
            <div class="search-input-group">
              <i class="bi bi-search search-icon-inside"></i>
              <input
                type="text"
                class="form-control"
                id="divisions-search-input"
                placeholder="${isBn ? 'বিভাগের নাম, সদর দপ্তর বা বৈশিষ্ট্য দিয়ে খুঁজুন (যেমন: সিলেট, চট্টগ্রাম)...' : 'Search divisions by name, headquarters, or highlights (e.g., Sylhet, Chattogram)...'}"
                value="${escapeHtml(searchQuery)}"
                aria-label="${isBn ? 'বিভাগ অনুসন্ধান' : 'Search divisions'}"
              >
            </div>
          </div>
          <div class="col-lg-4 d-flex justify-content-lg-end align-items-center gap-2">
            <span class="text-secondary small fw-semibold">
              ${isLoading
                ? (isBn ? 'ফায়ারস্টোর থেকে লোড হচ্ছে...' : 'Loading from Firestore...')
                : (isBn
                    ? `${formatLocalizedNumber(filteredDivisions.length, lang)}টি বিভাগ প্রদর্শিত`
                    : `Showing ${filteredDivisions.length} division${filteredDivisions.length === 1 ? '' : 's'}`)}
            </span>
            ${searchQuery.trim() ? `
              <button class="btn btn-outline-bd btn-sm" id="divisions-clear-search-btn">
                <i class="bi bi-x-circle me-1"></i>${isBn ? 'মুছুন' : 'Clear'}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- 4-8. All 8 Divisions Responsive Image-Card Grid -->
    <section class="container py-5" id="divisions-grid-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill mb-2">
            ${isBn ? '৮টি প্রশাসনিক বিভাগ' : 'All 8 Administrative Divisions'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? 'বিভাগ নির্বাচন করে বিস্তারিত জানুন' : 'Choose a Division to Explore'}
          </h2>
          <p class="text-muted mb-0">
            ${isBn
              ? 'প্রতিটি বিভাগে ক্লিক করে জেলার তালিকা, ঐতিহ্যবাহী স্থান ও ভ্রমণ নির্দেশিকা দেখুন।'
              : 'Select any division below to view its districts, landmarks, and curated travel destinations.'}
          </p>
        </div>
      </div>

      ${isLoading ? `
        <div class="row g-4" aria-label="Loading divisions">
          ${renderCardSkeleton(8, 'col-lg-3 col-md-6 mb-4')}
        </div>
      ` : error ? `
        ${renderErrorState({
          title: isBn ? 'বিভাগের তথ্য লোড করা যায়নি' : 'Could not load divisions',
          message: error,
          retryActionId: 'divisions-retry-btn',
          lang
        })}
      ` : filteredDivisions.length === 0 ? `
        ${renderEmptyState({
          titleBn: 'কোনো বিভাগ পাওয়া যায়নি',
          titleEn: 'No Divisions Found',
          descBn: 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো বিভাগ পাওয়া যায়নি অথবা বর্তমানে কোনো প্রকাশিত বিভাগ নেই।',
          descEn: 'No published divisions matched your current search criteria. Try clearing your filter or reloading from Firestore.',
          actionTextBn: searchQuery.trim() ? 'অনুসন্ধান মুছুন' : 'পুনরায় লোড করুন',
          actionTextEn: searchQuery.trim() ? 'Clear Search' : 'Reload Divisions',
          actionId: searchQuery.trim() ? 'divisions-empty-clear-btn' : 'divisions-retry-btn',
          icon: 'bi-diagram-3',
          lang
        })}
      ` : `
        <div class="row g-4">
          ${filteredDivisions
            .map(div => {
              const computedDistrictCount =
                div.districts_count ||
                districts.filter(
                  dist =>
                    dist.is_published !== false &&
                    (dist.division_id === div.id || (!!div.slug && dist.division_id === div.slug))
                ).length;
              return renderDivisionCard({
                division: { ...div, districts_count: computedDistrictCount },
                lang,
                ctaLabel: isBn ? 'ঘুরে দেখুন' : 'Explore'
              });
            })
            .join('')}
        </div>
      `}
    </section>

    <!-- 9. Related Travel Destinations Section -->
    <section class="container py-4 pb-5" id="related-destinations-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'জনপ্রিয় ভ্রমণ আকর্ষণ' : 'Curated Highlights'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? 'সম্পর্কিত ভ্রমণ গন্তব্যসমূহ' : 'Related Travel Destinations'}
          </h2>
          <p class="text-muted mb-0">
            ${isBn
              ? 'বাংলাদেশের ৮টি বিভাগের জনপ্রিয় ইউনেস্কো ঐতিহ্য, সৈকত, পাহাড় ও প্রাকৃতিক গন্তব্যসমূহ।'
              : 'Discover signature UNESCO heritage sites, beaches, valleys, and natural wonders across the 8 divisions.'}
          </p>
        </div>
        <a href="/places/" class="btn btn-outline-bd btn-sm rounded-pill px-3" data-portal-link="/places/">
          <i class="bi bi-arrow-right-circle me-1"></i>${isBn ? 'সকল দর্শনীয় স্থান' : 'View All Attractions'}
        </a>
      </div>

      ${isLoading ? `
        <div class="row g-4">
          ${renderCardSkeleton(3, 'col-lg-4 col-md-6 mb-4')}
        </div>
      ` : relatedSpots.length === 0 ? `
        ${renderEmptyState({
          titleBn: 'কোনো গন্তব্য পাওয়া যায়নি',
          titleEn: 'No Related Destinations Found',
          descBn: 'এই মুহূর্তে কোনো প্রকাশিত পর্যটন গন্তব্য পাওয়া যায়নি।',
          descEn: 'There are currently no published tourist destinations available.',
          icon: 'bi-pin-map',
          lang
        })}
      ` : `
        <div class="row g-4">
          ${relatedSpots
            .map(spot => {
              const division = divisions.find(
                d => d.id === spot.division_id || (!!d.slug && d.slug === spot.division_id)
              );
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
  `;
}
