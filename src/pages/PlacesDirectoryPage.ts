/**
 * All Tourist Destinations Directory Page Controller
 * URL: /places/
 * Displays published tourist destinations from Firestore tourist_spots collection
 * with bilingual name search (Bengali/English), division filter, district filter,
 * category filter, reset filters, pagination, loading skeletons, empty & error states.
 */

import {
  type Division,
  type District,
  type Category,
  type TouristSpot
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';
import { matchesBilingualQuery } from '../utils/searchUtils';
import {
  renderBreadcrumbs,
  renderDestinationCard
} from '../components';
import { FirestoreService } from '../services';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export const PLACES_PER_PAGE = 9;

export interface PlacesDirectoryPageProps {
  lang: Language;
  divisions: Division[];
  districts: District[];
  categories: Category[];
  spots: TouristSpot[];
  bookmarkedIds: Set<string>;
  searchQuery: string;
  divisionFilter: string;
  districtFilter: string;
  categoryFilter: string;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

const HERO_BG_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80';

function normalizeKey(value: string): string {
  return (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function findMatchedDivision(
  spotOrDistDivisionId: string,
  divisions: Division[]
): Division | undefined {
  const target = (spotOrDistDivisionId || '').trim().toLowerCase();
  const normalizedTarget = normalizeKey(target);
  if (!target) return undefined;
  return divisions.find(
    d =>
      d.id.toLowerCase() === target ||
      (!!d.slug && d.slug.toLowerCase() === target) ||
      normalizeKey(d.id) === normalizedTarget ||
      (!!d.slug && normalizeKey(d.slug) === normalizedTarget)
  );
}

function findMatchedDistrict(
  spotDistrictId: string,
  districts: District[]
): District | undefined {
  const target = (spotDistrictId || '').trim().toLowerCase();
  const normalizedTarget = normalizeKey(target);
  if (!target) return undefined;
  return districts.find(
    d =>
      d.id.toLowerCase() === target ||
      (!!d.slug && d.slug.toLowerCase() === target) ||
      normalizeKey(d.id) === normalizedTarget ||
      (!!d.slug && normalizeKey(d.slug) === normalizedTarget)
  );
}

export function matchesSpotDivision(
  spot: TouristSpot,
  divisionFilter: string,
  divisions: Division[]
): boolean {
  if (!divisionFilter || divisionFilter === 'all') return true;
  const target = divisionFilter.trim().toLowerCase();
  const spotDiv = (spot.division_id || '').trim().toLowerCase();
  if (spotDiv === target || normalizeKey(spotDiv) === normalizeKey(target)) return true;
  const matchedDiv = findMatchedDivision(divisionFilter, divisions);
  if (!matchedDiv) return false;
  return (
    spotDiv === matchedDiv.id.toLowerCase() ||
    (!!matchedDiv.slug && spotDiv === matchedDiv.slug.toLowerCase()) ||
    normalizeKey(spotDiv) === normalizeKey(matchedDiv.id) ||
    (!!matchedDiv.slug && normalizeKey(spotDiv) === normalizeKey(matchedDiv.slug))
  );
}

export function matchesSpotDistrict(
  spot: TouristSpot,
  districtFilter: string,
  districts: District[]
): boolean {
  if (!districtFilter || districtFilter === 'all') return true;
  const target = districtFilter.trim().toLowerCase();
  const spotDist = (spot.district_id || '').trim().toLowerCase();
  if (spotDist === target || normalizeKey(spotDist) === normalizeKey(target)) return true;
  const matchedDist = findMatchedDistrict(districtFilter, districts);
  if (!matchedDist) return false;
  return (
    spotDist === matchedDist.id.toLowerCase() ||
    (!!matchedDist.slug && spotDist === matchedDist.slug.toLowerCase()) ||
    normalizeKey(spotDist) === normalizeKey(matchedDist.id) ||
    (!!matchedDist.slug && normalizeKey(spotDist) === normalizeKey(matchedDist.slug))
  );
}

export function matchesSpotCategory(
  spot: TouristSpot,
  categoryFilter: string,
  categories: Category[]
): boolean {
  if (!categoryFilter || categoryFilter === 'all') return true;
  const target = categoryFilter.trim().toLowerCase();
  const normalizedTarget = normalizeKey(target);
  const spotCats = Array.isArray(spot.category_ids)
    ? spot.category_ids.map(c => c.trim().toLowerCase())
    : [];
  if (spotCats.some(c => c === target || normalizeKey(c) === normalizedTarget)) return true;
  const matchedCat = categories.find(
    c =>
      c.id.toLowerCase() === target ||
      (!!c.slug && c.slug.toLowerCase() === target) ||
      normalizeKey(c.id) === normalizedTarget ||
      (!!c.slug && normalizeKey(c.slug) === normalizedTarget)
  );
  if (!matchedCat) return false;
  return FirestoreService.doesSpotMatchCategory(spot, matchedCat);
}

export function getFilteredSpots(
  spots: TouristSpot[],
  divisions: Division[],
  districts: District[],
  categories: Category[],
  searchQuery: string,
  divisionFilter: string,
  districtFilter: string,
  categoryFilter: string
): TouristSpot[] {
  const publishedSpots = spots.filter(s => s.is_published === true);
  const hasQuery = searchQuery.trim().length > 0;

  return publishedSpots.filter(spot => {
    if (!matchesSpotDivision(spot, divisionFilter, divisions)) {
      return false;
    }
    if (!matchesSpotDistrict(spot, districtFilter, districts)) {
      return false;
    }
    if (!matchesSpotCategory(spot, categoryFilter, categories)) {
      return false;
    }
    if (hasQuery) {
      if (!matchesBilingualQuery(searchQuery, [spot.name_bn, spot.name_en, spot.slug])) {
        return false;
      }
    }
    return true;
  });
}

function getPaginationTokens(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const tokens: Array<number | 'ellipsis'> = [1];
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  if (windowStart > 2) tokens.push('ellipsis');
  for (let p = windowStart; p <= windowEnd; p++) {
    tokens.push(p);
  }
  if (windowEnd < totalPages - 1) tokens.push('ellipsis');
  tokens.push(totalPages);
  return tokens;
}

function renderPaginationControls(
  currentPage: number,
  totalPages: number,
  lang: Language
): string {
  if (totalPages <= 1) return '';
  const isBn = lang === 'bn';
  const tokens = getPaginationTokens(currentPage, totalPages);

  return `
    <nav aria-label="${isBn ? 'দর্শনীয় স্থান পাতা নেভিগেশন' : 'Destinations pagination'}" class="mt-4 pt-2 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
      <div class="small text-secondary fw-medium">
        ${isBn
          ? `পাতা ${formatLocalizedNumber(currentPage, lang)} / ${formatLocalizedNumber(totalPages, lang)}`
          : `Page ${currentPage} of ${totalPages}`}
      </div>
      <ul class="pagination pagination-md mb-0 flex-wrap justify-content-center gap-1">
        <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
          <button
            type="button"
            class="page-link rounded-3 px-3"
            id="places-page-prev"
            ${currentPage <= 1 ? 'disabled aria-disabled="true"' : ''}
            aria-label="${isBn ? 'পূর্ববর্তী পাতা' : 'Previous page'}"
          >
            <i class="bi bi-chevron-left me-1"></i>${isBn ? 'পূর্ববর্তী' : 'Prev'}
          </button>
        </li>
        ${tokens
          .map(token =>
            token === 'ellipsis'
              ? `<li class="page-item disabled" aria-hidden="true"><span class="page-link rounded-3 border-0 bg-transparent text-muted px-2">…</span></li>`
              : `
                <li class="page-item ${token === currentPage ? 'active' : ''}">
                  <button
                    type="button"
                    class="page-link rounded-3 px-3 places-page-btn ${token === currentPage ? 'bg-primary-bd border-success text-white fw-bold' : ''}"
                    data-page="${token}"
                    aria-current="${token === currentPage ? 'page' : 'false'}"
                  >
                    ${formatLocalizedNumber(token, lang)}
                  </button>
                </li>
              `
          )
          .join('')}
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
          <button
            type="button"
            class="page-link rounded-3 px-3"
            id="places-page-next"
            ${currentPage >= totalPages ? 'disabled aria-disabled="true"' : ''}
            aria-label="${isBn ? 'পরবর্তী পাতা' : 'Next page'}"
          >
            ${isBn ? 'পরবর্তী' : 'Next'}<i class="bi bi-chevron-right ms-1"></i>
          </button>
        </li>
      </ul>
    </nav>
  `;
}

export function renderPlacesResultsRegion(props: PlacesDirectoryPageProps): string {
  const {
    lang,
    divisions,
    districts,
    categories,
    spots,
    bookmarkedIds,
    searchQuery,
    divisionFilter,
    districtFilter,
    categoryFilter,
    currentPage,
    isLoading,
    error
  } = props;

  const isBn = lang === 'bn';
  const publishedDivisions = divisions.filter(d => d.is_published !== false);
  const publishedDistricts = districts.filter(d => d.is_published !== false);
  const publishedCategories = categories.filter(c => c.is_published !== false);
  const publishedSpots = spots.filter(s => s.is_published === true);

  const filteredSpots = getFilteredSpots(
    publishedSpots,
    publishedDivisions,
    publishedDistricts,
    publishedCategories,
    searchQuery,
    divisionFilter,
    districtFilter,
    categoryFilter
  );

  const totalItems = filteredSpots.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PLACES_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * PLACES_PER_PAGE;
  const endIndex = Math.min(startIndex + PLACES_PER_PAGE, totalItems);
  const paginatedSpots = filteredSpots.slice(startIndex, endIndex);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    (divisionFilter !== 'all' && divisionFilter !== '') ||
    (districtFilter !== 'all' && districtFilter !== '') ||
    (categoryFilter !== 'all' && categoryFilter !== '');

  const selectedDivObj =
    divisionFilter !== 'all'
      ? findMatchedDivision(divisionFilter, publishedDivisions)
      : undefined;
  const selectedDistObj =
    districtFilter !== 'all'
      ? findMatchedDistrict(districtFilter, publishedDistricts)
      : undefined;
  const selectedCatObj =
    categoryFilter !== 'all'
      ? publishedCategories.find(
          c =>
            c.id.toLowerCase() === categoryFilter.toLowerCase() ||
            (!!c.slug && c.slug.toLowerCase() === categoryFilter.toLowerCase()) ||
            normalizeKey(c.id) === normalizeKey(categoryFilter)
        )
      : undefined;

  const activeScopeParts: string[] = [];
  if (selectedDivObj) activeScopeParts.push(isBn ? selectedDivObj.name_bn : selectedDivObj.name_en);
  if (selectedDistObj) activeScopeParts.push(isBn ? selectedDistObj.name_bn : selectedDistObj.name_en);
  if (selectedCatObj) activeScopeParts.push(isBn ? selectedCatObj.name_bn : selectedCatObj.name_en);

  return `
    <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
      <div>
        <span class="badge bg-primary-bd text-white px-3 py-1 rounded-pill mb-2">
          ${activeScopeParts.length > 0
            ? escapeHtml(activeScopeParts.join(' • '))
            : (isBn ? 'প্রকাশিত দর্শনীয় স্থান' : 'Published Destinations')}
        </span>
        <h2 class="fw-bold text-primary-bd mb-1">
          ${isBn ? 'জনপ্রিয় ভ্রমণ গন্তব্যের তালিকা' : 'Explore Tourist Destinations'}
        </h2>
        <p class="text-muted mb-0" aria-live="polite">
          ${isLoading
            ? (isBn ? 'ফায়ারস্টোর থেকে দর্শনীয় স্থান লোড হচ্ছে...' : 'Loading published destinations from Firestore...')
            : totalItems === 0
              ? (isBn ? 'কোনো দর্শনীয় স্থান পাওয়া যায়নি' : 'No matching tourist destinations found')
              : (isBn
                  ? `মোট ${formatLocalizedNumber(totalItems, lang)}টি প্রকাশিত স্থানের মধ্যে ${formatLocalizedNumber(startIndex + 1, lang)}–${formatLocalizedNumber(endIndex, lang)}টি প্রদর্শিত হচ্ছে`
                  : `Showing ${startIndex + 1}–${endIndex} of ${totalItems} published destination${totalItems === 1 ? '' : 's'}`)}
        </p>
      </div>

      <div class="d-flex gap-2 flex-wrap">
        <a href="/divisions/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
          <i class="bi bi-grid-fill me-1"></i>${isBn ? '৮ বিভাগ' : '8 Divisions'}
        </a>
        <a href="/districts/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
          <i class="bi bi-geo-alt-fill me-1"></i>${isBn ? '৬৪ জেলা' : '64 Districts'}
        </a>
      </div>
    </div>

    ${isLoading ? `
      <div class="row g-4" aria-label="${isBn ? 'দর্শনীয় স্থান লোড হচ্ছে' : 'Loading tourist destinations'}">
        ${renderCardSkeleton(6, 'col-lg-4 col-md-6 mb-4')}
      </div>
    ` : error ? `
      ${renderErrorState({
        title: isBn ? 'দর্শনীয় স্থানের তথ্য লোড করা যায়নি' : 'Could not load tourist destinations',
        message: error,
        retryActionId: 'places-retry-btn',
        lang
      })}
    ` : paginatedSpots.length === 0 ? `
      ${renderEmptyState({
        titleBn: 'কোনো দর্শনীয় স্থান পাওয়া যায়নি',
        titleEn: 'No Tourist Destinations Found',
        descBn: hasActiveFilters
          ? 'আপনার অনুসন্ধান বা নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো প্রকাশিত দর্শনীয় স্থান পাওয়া যায়নি। ফিল্টার রিসেট করে সকল স্থান দেখুন।'
          : 'এই মুহূর্তে ফায়ারস্টোরে কোনো প্রকাশিত দর্শনীয় স্থান নেই।',
        descEn: hasActiveFilters
          ? 'No published destinations matched your current search or filter selection. Reset filters to browse all available destinations.'
          : 'There are currently no published tourist destinations stored in Firestore.',
        actionTextBn: hasActiveFilters ? 'সব ফিল্টার রিসেট করুন' : 'পুনরায় লোড করুন',
        actionTextEn: hasActiveFilters ? 'Reset All Filters' : 'Reload Destinations',
        actionId: hasActiveFilters ? 'places-empty-reset-btn' : 'places-retry-btn',
        icon: 'bi-compass',
        lang
      })}
    ` : `
      <div class="row g-4">
        ${paginatedSpots
          .map(spot => {
            const division = findMatchedDivision(spot.division_id, publishedDivisions);
            const district = findMatchedDistrict(spot.district_id, publishedDistricts);
            const matchedCategories = (spot.category_ids || [])
              .map(cid =>
                publishedCategories.find(
                  c =>
                    c.id.toLowerCase() === cid.toLowerCase() ||
                    (!!c.slug && c.slug.toLowerCase() === cid.toLowerCase()) ||
                    normalizeKey(c.id) === normalizeKey(cid)
                )
              )
              .filter((c): c is Category => Boolean(c));

            // Prioritize active category filter as primary badge if present on the spot
            const orderedCategories = selectedCatObj
              ? [
                  ...matchedCategories.filter(c => c.id === selectedCatObj.id),
                  ...matchedCategories.filter(c => c.id !== selectedCatObj.id)
                ]
              : matchedCategories;

            return renderDestinationCard({
              spot,
              division,
              district,
              category: orderedCategories[0],
              categories: orderedCategories,
              isBookmarked: bookmarkedIds.has(spot.id),
              lang,
              colClass: 'col-lg-4 col-md-6 mb-4'
            });
          })
          .join('')}
      </div>

      ${renderPaginationControls(safePage, totalPages, lang)}
    `}
  `;
}

export function renderAllPlacesPage(props: PlacesDirectoryPageProps): string {
  const {
    lang,
    divisions,
    districts,
    categories,
    spots,
    searchQuery,
    divisionFilter,
    districtFilter,
    categoryFilter
  } = props;

  const isBn = lang === 'bn';
  const publishedDivisions = divisions.filter(d => d.is_published !== false);
  const publishedDistricts = districts.filter(d => d.is_published !== false);
  const publishedCategories = categories.filter(c => c.is_published !== false);
  const publishedSpots = spots.filter(s => s.is_published === true);

  // Scoped districts for the district dropdown when a division is selected
  const availableDistricts = (divisionFilter && divisionFilter !== 'all'
    ? publishedDistricts.filter(dist => {
        const matchedDiv = findMatchedDivision(divisionFilter, publishedDivisions);
        const distDiv = (dist.division_id || '').toLowerCase();
        if (distDiv === divisionFilter.toLowerCase() || normalizeKey(distDiv) === normalizeKey(divisionFilter)) {
          return true;
        }
        if (!matchedDiv) return false;
        return (
          distDiv === matchedDiv.id.toLowerCase() ||
          (!!matchedDiv.slug && distDiv === matchedDiv.slug.toLowerCase()) ||
          normalizeKey(distDiv) === normalizeKey(matchedDiv.id)
        );
      })
    : publishedDistricts
  ).slice().sort((a, b) =>
    isBn
      ? a.name_bn.localeCompare(b.name_bn, 'bn')
      : a.name_en.localeCompare(b.name_en, 'en')
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    (divisionFilter !== 'all' && divisionFilter !== '') ||
    (districtFilter !== 'all' && districtFilter !== '') ||
    (categoryFilter !== 'all' && categoryFilter !== '');

  return `
    <!-- 1. Breadcrumb Navigation -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [{ labelBn: 'দর্শনীয় স্থান', labelEn: 'Tourist Destinations' }],
          lang
        )}
      </div>
    </div>

    <!-- 2. Hero Heading & Introduction -->
    <section
      class="hero-wrapper"
      style="min-height: 360px; padding: 3.25rem 0 4.25rem; background: linear-gradient(135deg, rgba(18, 60, 50, 0.93) 0%, rgba(28, 89, 72, 0.84) 100%), url('${HERO_BG_IMAGE}') center/cover no-repeat;"
    >
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-8">
            <div class="hero-pill-badge">
              <i class="bi bi-compass-fill"></i>
              <span>${isBn ? 'অফিসিয়াল ভ্রমণ ডিরেক্টরি' : 'Official Tourist Destinations Directory'}</span>
            </div>
            <h1 class="hero-title mb-2">
              ${isBn ? 'বাংলাদেশের সকল দর্শনীয় স্থান' : 'All Tourist Destinations of Bangladesh'}
            </h1>
            <p class="fs-5 text-warning fw-semibold mb-3 opacity-90">
              ${isBn ? 'Explore All Tourist Destinations of Bangladesh' : 'বাংলাদেশের সকল প্রকাশিত দর্শনীয় স্থানসমূহ'}
            </p>
            <p class="hero-subtitle mb-0">
              ${isBn
                ? 'কক্সবাজারের বিস্তীর্ণ সমুদ্র সৈকত ও সুন্দরবনের ম্যানগ্রোভ অরণ্য থেকে শুরু করে সিলেটের চা বাগান, পার্বত্য উপত্যকা এবং শতাব্দী প্রাচীন ঐতিহাসিক স্থাপত্য—বিভাগ, জেলা ও ক্যাটাগরি অনুযায়ী বাংলাদেশের সেরা ভ্রমণ গন্তব্যসমূহ খুঁজুন।'
                : 'Discover Bangladesh’s most iconic tourist destinations—from coastal coral islands and mangrove waterways to emerald tea gardens, waterfalls, and UNESCO heritage monuments. Search in Bengali or English and combine division, district, and category filters.'}
            </p>
          </div>

          <div class="col-lg-4">
            <div class="p-4 rounded-4 text-white" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(217, 164, 65, 0.35);">
              <div class="row g-3 text-center">
                <div class="col-4">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedSpots.length, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'গন্তব্য' : 'Places'}</div>
                </div>
                <div class="col-4">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedDivisions.length || 8, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'বিভাগ' : 'Divisions'}</div>
                </div>
                <div class="col-4">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedCategories.length, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'ক্যাটাগরি' : 'Categories'}</div>
                </div>
              </div>
              <hr class="border-light opacity-25 my-3">
              <div class="d-flex justify-content-between align-items-center small text-white-50">
                <span><i class="bi bi-database-check text-warning me-1"></i>${isBn ? 'তথ্যসূত্র' : 'Collection'}</span>
                <span class="fw-semibold text-white">${isBn ? 'ক্লাউড ফায়ারস্টোর' : 'Firestore tourist_spots'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3, 4, 5, 6. Search Bar, Division Filter, District Filter, Category Filter & Reset -->
    <div class="container">
      <div class="search-card-wrapper">
        <div class="row g-3 align-items-end">
          <!-- 3. Search Bar -->
          <div class="col-lg-4 col-md-6">
            <label for="places-search-input" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-search me-1"></i>${isBn ? 'গন্তব্যের নাম খুঁজুন (বাংলা বা ইংরেজি)' : 'Search Destination Name (Bengali / English)'}
            </label>
            <div class="search-input-group position-relative">
              <i class="bi bi-search search-icon-inside"></i>
              <input
                type="text"
                class="form-control pe-5"
                id="places-search-input"
                placeholder="${isBn ? 'যেমন: সুন্দরবন, Sajek, কক্সবাজার, Lalbagh...' : 'e.g., Sundarbans, সাজেক, Cox\'s Bazar, লালবাগ...'}"
                value="${escapeHtml(searchQuery)}"
                autocomplete="off"
                aria-label="${isBn ? 'বাংলা বা ইংরেজিতে দর্শনীয় স্থান খুঁজুন' : 'Search tourist destinations in Bengali or English'}"
              >
              <button
                type="button"
                id="places-clear-search-btn"
                class="btn btn-sm border-0 position-absolute top-50 end-0 translate-middle-y me-1 text-secondary ${searchQuery.trim() ? '' : 'd-none'}"
                aria-label="${isBn ? 'অনুসন্ধান মুছুন' : 'Clear search'}"
                title="${isBn ? 'অনুসন্ধান মুছুন' : 'Clear search'}"
              >
                <i class="bi bi-x-circle-fill"></i>
              </button>
            </div>
          </div>

          <!-- 4. Division Filter -->
          <div class="col-lg-2 col-md-6 col-sm-6">
            <label for="places-division-select" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-diagram-3 me-1"></i>${isBn ? 'বিভাগ' : 'Division'}
            </label>
            <select
              class="form-select"
              id="places-division-select"
              style="padding: 0.72rem 0.9rem; border-radius: 10px;"
              aria-label="${isBn ? 'বিভাগ অনুযায়ী ফিল্টার' : 'Filter by division'}"
            >
              <option value="all" ${divisionFilter === 'all' ? 'selected' : ''}>
                ${isBn ? 'সকল বিভাগ' : 'All Divisions'}
              </option>
              ${publishedDivisions
                .map(div => `
                  <option value="${escapeHtml(div.id)}" ${divisionFilter === div.id || divisionFilter === div.slug ? 'selected' : ''}>
                    ${escapeHtml(isBn ? div.name_bn : div.name_en)}
                  </option>
                `)
                .join('')}
            </select>
          </div>

          <!-- 5. District Filter -->
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label for="places-district-select" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-geo-alt me-1"></i>${isBn ? 'জেলা' : 'District'}
            </label>
            <select
              class="form-select"
              id="places-district-select"
              style="padding: 0.72rem 0.9rem; border-radius: 10px;"
              aria-label="${isBn ? 'জেলা অনুযায়ী ফিল্টার' : 'Filter by district'}"
            >
              <option value="all" ${districtFilter === 'all' ? 'selected' : ''}>
                ${isBn
                  ? `সকল জেলা (${formatLocalizedNumber(availableDistricts.length, lang)})`
                  : `All Districts (${availableDistricts.length})`}
              </option>
              ${availableDistricts
                .map(dist => `
                  <option value="${escapeHtml(dist.id)}" ${districtFilter === dist.id || districtFilter === dist.slug ? 'selected' : ''}>
                    ${escapeHtml(isBn ? dist.name_bn : dist.name_en)}
                  </option>
                `)
                .join('')}
            </select>
          </div>

          <!-- 6. Category Filter -->
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label for="places-category-select" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-tags me-1"></i>${isBn ? 'ক্যাটাগরি' : 'Category'}
            </label>
            <select
              class="form-select"
              id="places-category-select"
              style="padding: 0.72rem 0.9rem; border-radius: 10px;"
              aria-label="${isBn ? 'ক্যাটাগরি অনুযায়ী ফিল্টার' : 'Filter by category'}"
            >
              <option value="all" ${categoryFilter === 'all' ? 'selected' : ''}>
                ${isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}
              </option>
              ${publishedCategories
                .map(cat => `
                  <option value="${escapeHtml(cat.id)}" ${categoryFilter === cat.id || categoryFilter === cat.slug ? 'selected' : ''}>
                    ${escapeHtml(isBn ? cat.name_bn : cat.name_en)}
                  </option>
                `)
                .join('')}
            </select>
          </div>

          <!-- Reset Filters Button -->
          <div class="col-lg-2 col-md-4 col-sm-6 d-flex align-items-center">
            <button
              type="button"
              class="btn ${hasActiveFilters ? 'btn-accent' : 'btn-outline-bd'} w-100 py-2"
              style="min-height: 46px; border-radius: 10px;"
              id="places-reset-filters-btn"
              ${!hasActiveFilters ? 'disabled' : ''}
            >
              <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? 'রিসেট' : 'Reset'}
            </button>
          </div>
        </div>

        <!-- Quick Category Pills (Synced with Category Filter Dropdown) -->
        ${publishedCategories.length > 0 ? `
          <div class="d-flex align-items-center gap-2 overflow-x-auto pb-1 mt-3" style="scrollbar-width: thin;">
            <button
              type="button"
              class="filter-pill ${categoryFilter === 'all' ? 'active' : ''}"
              data-places-cat-filter="all"
            >
              <i class="bi bi-stars"></i> ${isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}
            </button>
            ${publishedCategories
              .map(cat => {
                const isActive =
                  categoryFilter.toLowerCase() === cat.id.toLowerCase() ||
                  (!!cat.slug && categoryFilter.toLowerCase() === cat.slug.toLowerCase());
                return `
                  <button
                    type="button"
                    class="filter-pill ${isActive ? 'active' : ''}"
                    data-places-cat-filter="${escapeHtml(cat.id)}"
                  >
                    <i class="bi ${escapeHtml(cat.icon || 'bi-tag')}"></i>
                    <span>${escapeHtml(isBn ? cat.name_bn : cat.name_en)}</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        ` : ''}
      </div>
    </div>

    <!-- 7 & 8. Tourist Spot Grid + Pagination / Loading / Empty / Error States -->
    <section class="container py-5" id="places-directory-grid">
      <div id="places-results-region">
        ${renderPlacesResultsRegion(props)}
      </div>
    </section>
  `;
}
