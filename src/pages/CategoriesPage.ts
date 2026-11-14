/**
 * Tourist Categories Discovery & Dynamic Category Details Page Controllers
 * URLs:
 *  - /categories/ (Category Discovery Page across all 12 categories)
 *  - /categories/:slug/ (Dynamic Category Details with division/district filters & pagination)
 * Strictly loads published categories & published tourist spots from Firestore.
 * Never invents destinations or duplicates category grids across pages.
 */

import {
  type Division,
  type District,
  type Category,
  type TouristSpot
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';
import { FirestoreService } from '../services';
import {
  renderBreadcrumbs,
  renderCategoryGridCard,
  renderDestinationCard
} from '../components';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export const CATEGORY_SPOTS_PER_PAGE = 9;

export interface CategoriesPageProps {
  lang: Language;
  categories: Category[];
  spots: TouristSpot[];
  isLoading: boolean;
  error: string | null;
}

export interface CategoryDetailPageProps {
  lang: Language;
  requestedSlug: string;
  category: Category | null;
  divisions: Division[];
  districts: District[];
  categories: Category[];
  spots: TouristSpot[];
  bookmarkedIds: Set<string>;
  divisionFilter: string;
  districtFilter: string;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

const CATEGORIES_HERO_BG =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80';

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

function matchesSpotDivision(
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

function matchesSpotDistrict(
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

export function getFilteredCategorySpots(
  spots: TouristSpot[],
  category: Category | null,
  divisions: Division[],
  districts: District[],
  divisionFilter: string,
  districtFilter: string
): TouristSpot[] {
  if (!category || category.is_published !== true) return [];
  return spots.filter(spot => {
    if (spot.is_published !== true) return false;
    if (!FirestoreService.doesSpotMatchCategory(spot, category)) return false;
    if (!matchesSpotDivision(spot, divisionFilter, divisions)) return false;
    if (!matchesSpotDistrict(spot, districtFilter, districts)) return false;
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

function renderCategoryPagination(
  currentPage: number,
  totalPages: number,
  lang: Language
): string {
  if (totalPages <= 1) return '';
  const isBn = lang === 'bn';
  const tokens = getPaginationTokens(currentPage, totalPages);

  return `
    <nav aria-label="${isBn ? 'ক্যাটাগরি গন্তব্য পাতা নেভিগেশন' : 'Category destinations pagination'}" class="mt-4 pt-2 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
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
            id="category-page-prev"
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
                    class="page-link rounded-3 px-3 category-page-btn ${token === currentPage ? 'bg-primary-bd border-success text-white fw-bold' : ''}"
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
            id="category-page-next"
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

/**
 * 1. Category Discovery Page (/categories/)
 */
export function renderAllCategoriesPage(props: CategoriesPageProps): string {
  const { lang, categories, spots, isLoading, error } = props;
  const isBn = lang === 'bn';

  const publishedCategories = categories.filter(c => c.is_published === true);
  const publishedSpots = spots.filter(s => s.is_published === true);

  return `
    <!-- 1. Breadcrumb -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [{ labelBn: 'ক্যাটাগরি সমূহ', labelEn: 'Categories' }],
          lang
        )}
      </div>
    </div>

    <!-- 2. Category Hero Section -->
    <section
      class="hero-wrapper"
      style="min-height: 340px; padding: 3.25rem 0; background: linear-gradient(135deg, rgba(18, 60, 50, 0.93) 0%, rgba(28, 89, 72, 0.85) 100%), url('${CATEGORIES_HERO_BG}') center/cover no-repeat;"
    >
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-8">
            <div class="hero-pill-badge">
              <i class="bi bi-tags-fill"></i>
              <span>${isBn ? 'ভ্রমণ ক্যাটাগরি ডিরেক্টরি' : 'Travel Category Discovery'}</span>
            </div>
            <h1 class="hero-title mb-2">
              ${isBn ? 'ভ্রমণের ধরন অনুযায়ী বাংলাদেশ' : 'Explore Bangladesh by Category'}
            </h1>
            <p class="fs-5 text-warning fw-semibold mb-3 opacity-90">
              ${isBn ? 'Discover Beaches, Hills, Waterfalls, Forests, Heritage & More' : 'সমুদ্র সৈকত, পাহাড়, ঝর্ণা, বন, ঐতিহ্য ও প্রাকৃতিক বৈচিত্র্য'}
            </p>
            <p class="hero-subtitle mb-0">
              ${isBn
                ? 'সমুদ্র সৈকত, মেঘের পাহাড়, জলপ্রপাত, ম্যানগ্রোভ অরণ্য, ঐতিহাসিক ও প্রত্নতাত্ত্বিক নিদর্শন, ধর্মীয় স্থান, হাওর-হ্রদ, প্রবাল দ্বীপ, পার্ক, বন্যপ্রাণী ও নদীভিত্তিক গন্তব্যসমূহ ক্যাটাগরি অনুযায়ী ঘুরে দেখুন।'
                : 'Browse Bangladesh’s diverse landscapes and heritage across twelve curated tourism categories—from coastal beaches, misty hills, and cascading waterfalls to ancient archaeological sites, parks, wildlife sanctuaries, and scenic rivers.'}
            </p>
          </div>

          <div class="col-lg-4">
            <div class="p-4 rounded-4 text-white" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(217, 164, 65, 0.35);">
              <div class="row g-3 text-center">
                <div class="col-6">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedCategories.length, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'প্রকাশিত ক্যাটাগরি' : 'Categories'}</div>
                </div>
                <div class="col-6">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedSpots.length, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'প্রকাশিত গন্তব্য' : 'Published Spots'}</div>
                </div>
              </div>
              <hr class="border-light opacity-25 my-3">
              <div class="d-flex justify-content-between align-items-center small text-white-50">
                <span><i class="bi bi-database-check text-warning me-1"></i>${isBn ? 'তথ্যসূত্র' : 'Firestore'}</span>
                <span class="fw-semibold text-white">categories & tourist_spots</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3-7. Category Grid with Images, Bilingual Titles, Descriptions, Spot Counts & Explore Buttons -->
    <section class="container py-5" id="categories-discovery-grid">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'সকল ভ্রমণ ক্যাটাগরি' : 'All Travel Categories'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? 'পছন্দের ক্যাটাগরি নির্বাচন করুন' : 'Choose Your Travel Style'}
          </h2>
          <p class="text-muted mb-0">
            ${isBn
              ? 'প্রতিটি ক্যাটাগরিতে ক্লিক করে সংশ্লিষ্ট সকল প্রকাশিত দর্শনীয় স্থান, বিভাগ ও জেলা অনুযায়ী ফিল্টার করুন।'
              : 'Select any category to inspect all associated published destinations with division and district filtering.'}
          </p>
        </div>

        <a href="/places/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
          <i class="bi bi-compass me-1"></i>${isBn ? 'সকল দর্শনীয় স্থান' : 'All Destinations'}
        </a>
      </div>

      ${isLoading ? `
        <div class="row g-4" aria-label="${isBn ? 'ক্যাটাগরি লোড হচ্ছে' : 'Loading categories'}">
          ${renderCardSkeleton(8, 'col-xl-3 col-lg-4 col-sm-6 mb-4')}
        </div>
      ` : error ? `
        ${renderErrorState({
          title: isBn ? 'ক্যাটাগরি লোড করা যায়নি' : 'Could not load categories',
          message: error,
          retryActionId: 'categories-retry-btn',
          lang
        })}
      ` : publishedCategories.length === 0 ? `
        ${renderEmptyState({
          titleBn: 'কোনো প্রকাশিত ক্যাটাগরি পাওয়া যায়নি',
          titleEn: 'No Published Categories Found',
          descBn: 'এই মুহূর্তে ফায়ারস্টোরে কোনো প্রকাশিত ক্যাটাগরি নেই। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
          descEn: 'There are currently no published categories in Firestore. Please try reloading.',
          actionTextBn: 'পুনরায় লোড করুন',
          actionTextEn: 'Reload Categories',
          actionId: 'categories-retry-btn',
          icon: 'bi-tags',
          lang
        })}
      ` : `
        <div class="row g-4">
          ${publishedCategories
            .map(cat => {
              const spotCount = publishedSpots.filter(spot =>
                FirestoreService.doesSpotMatchCategory(spot, cat)
              ).length;
              return renderCategoryGridCard(cat, spotCount, lang);
            })
            .join('')}
        </div>
      `}
    </section>
  `;
}

export function renderCategorySpotsResultsRegion(props: CategoryDetailPageProps): string {
  const {
    lang,
    category,
    divisions,
    districts,
    categories,
    spots,
    bookmarkedIds,
    divisionFilter,
    districtFilter,
    currentPage,
    isLoading,
    error
  } = props;

  const isBn = lang === 'bn';
  if (!category) return '';

  const publishedDivisions = divisions.filter(d => d.is_published !== false);
  const publishedDistricts = districts.filter(d => d.is_published !== false);
  const publishedCategories = categories.filter(c => c.is_published !== false);

  const filteredSpots = getFilteredCategorySpots(
    spots,
    category,
    publishedDivisions,
    publishedDistricts,
    divisionFilter,
    districtFilter
  );

  const totalItems = filteredSpots.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / CATEGORY_SPOTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * CATEGORY_SPOTS_PER_PAGE;
  const endIndex = Math.min(startIndex + CATEGORY_SPOTS_PER_PAGE, totalItems);
  const paginatedSpots = filteredSpots.slice(startIndex, endIndex);

  const hasActiveFilters =
    (divisionFilter !== 'all' && divisionFilter !== '') ||
    (districtFilter !== 'all' && districtFilter !== '');

  return `
    <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
      <div>
        <h2 class="fw-bold text-primary-bd mb-1">
          ${isBn
            ? `${escapeHtml(category.name_bn)} — প্রকাশিত দর্শনীয় স্থান`
            : `${escapeHtml(category.name_en)} — Published Destinations`}
        </h2>
        <p class="text-muted mb-0" aria-live="polite">
          ${isLoading
            ? (isBn ? 'ফায়ারস্টোর থেকে দর্শনীয় স্থান লোড হচ্ছে...' : 'Loading published destinations from Firestore...')
            : totalItems === 0
              ? (isBn ? 'এই ফিল্টারে কোনো প্রকাশিত দর্শনীয় স্থান পাওয়া যায়নি' : 'No published destinations found for this selection')
              : (isBn
                  ? `মোট ${formatLocalizedNumber(totalItems, lang)}টি প্রকাশিত স্থানের মধ্যে ${formatLocalizedNumber(startIndex + 1, lang)}–${formatLocalizedNumber(endIndex, lang)}টি প্রদর্শিত হচ্ছে`
                  : `Showing ${startIndex + 1}–${endIndex} of ${totalItems} published destination${totalItems === 1 ? '' : 's'}`)}
        </p>
      </div>

      <a href="/places/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
        <i class="bi bi-compass me-1"></i>${isBn ? 'সকল দর্শনীয় স্থান' : 'All Destinations'}
      </a>
    </div>

    ${isLoading ? `
      <div class="row g-4" aria-label="${isBn ? 'দর্শনীয় স্থান লোড হচ্ছে' : 'Loading destinations'}">
        ${renderCardSkeleton(6, 'col-lg-4 col-md-6 mb-4')}
      </div>
    ` : error ? `
      ${renderErrorState({
        title: isBn ? 'গন্তব্যের তথ্য লোড করা যায়নি' : 'Could not load category destinations',
        message: error,
        retryActionId: 'category-detail-retry-btn',
        lang
      })}
    ` : paginatedSpots.length === 0 ? `
      ${renderEmptyState({
        titleBn: 'এই ক্যাটাগরিতে কোনো দর্শনীয় স্থান পাওয়া যায়নি',
        titleEn: 'No Published Spots Found',
        descBn: hasActiveFilters
          ? 'নির্বাচিত বিভাগ বা জেলা ফিল্টারে এই ক্যাটাগরির কোনো প্রকাশিত দর্শনীয় স্থান নেই। ফিল্টার রিসেট করে আবার দেখুন।'
          : 'এই মুহূর্তে এই ক্যাটাগরির অধীনে কোনো প্রকাশিত দর্শনীয় স্থান যুক্ত হয়নি। অনুগ্রহ করে অন্যান্য ক্যাটাগরি বা সকল দর্শনীয় স্থান দেখুন।',
        descEn: hasActiveFilters
          ? 'No published destinations in this category matched your division or district filter. Reset filters to view all spots in this category.'
          : 'There are currently no published tourist spots assigned to this category in Firestore. Explore other categories or browse all destinations.',
        actionTextBn: hasActiveFilters ? 'ফিল্টার রিসেট করুন' : 'সকল ক্যাটাগরি দেখুন',
        actionTextEn: hasActiveFilters ? 'Reset Filters' : 'Browse All Categories',
        actionId: hasActiveFilters ? 'category-empty-reset-btn' : 'category-empty-all-btn',
        icon: category.icon || 'bi-compass',
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

            const orderedCategories = [
              category,
              ...matchedCategories.filter(c => c.id !== category.id)
            ];

            return renderDestinationCard({
              spot,
              division,
              district,
              category,
              categories: orderedCategories,
              isBookmarked: bookmarkedIds.has(spot.id),
              lang,
              colClass: 'col-lg-4 col-md-6 mb-4'
            });
          })
          .join('')}
      </div>

      ${renderCategoryPagination(safePage, totalPages, lang)}
    `}
  `;
}

/**
 * 2. Dynamic Category Details Page (/categories/:slug/)
 */
export function renderCategoryDetailPage(props: CategoryDetailPageProps): string {
  const {
    lang,
    requestedSlug,
    category,
    divisions,
    districts,
    spots,
    divisionFilter,
    districtFilter,
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
              { labelBn: 'ক্যাটাগরি সমূহ', labelEn: 'Categories', url: '/categories/' },
              { labelBn: 'লোড হচ্ছে...', labelEn: 'Loading...' }
            ],
            lang
          )}
        </div>
      </div>
      <section class="hero-wrapper" style="min-height: 320px; padding: 3.25rem 0;">
        <div class="container placeholder-glow">
          <span class="placeholder col-3 bg-warning rounded-pill mb-3" style="height: 24px;"></span>
          <h1 class="placeholder col-6 bg-light rounded mb-3" style="height: 44px;"></h1>
          <p class="placeholder col-8 bg-light rounded opacity-50" style="height: 22px;"></p>
        </div>
      </section>
      <div class="container py-5">
        <div class="row g-4">
          ${renderCardSkeleton(6, 'col-lg-4 col-md-6 mb-4')}
        </div>
      </div>
    `;
  }

  if (error || !category || category.is_published !== true) {
    const cleanSlug = escapeHtml(requestedSlug || '');
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'ক্যাটাগরি সমূহ', labelEn: 'Categories', url: '/categories/' },
              { labelBn: 'পাওয়া যায়নি', labelEn: 'Not Found' }
            ],
            lang
          )}
        </div>
      </div>
      <div class="container py-5">
        ${error
          ? renderErrorState({
              title: isBn ? 'ক্যাটাগরির তথ্য লোড করা যায়নি' : 'Failed to load category details',
              message: error,
              retryActionId: 'category-detail-retry-btn',
              lang
            })
          : `
            <div class="bg-white rounded-4 border shadow-sm p-4 p-md-5 text-center my-3">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning-emphasis mb-3" style="width: 72px; height: 72px;">
                <i class="bi bi-tags fs-1"></i>
              </div>
              <span class="d-block badge bg-light text-secondary border mx-auto mb-2" style="width: fit-content;">
                404 • /categories/${cleanSlug}/
              </span>
              <h1 class="fw-bold text-primary-bd mb-2 h2">
                ${isBn ? 'দুঃখিত, এই ক্যাটাগরিটি খুঁজে পাওয়া যায়নি' : 'Category Not Found'}
              </h1>
              <p class="text-muted mx-auto mb-4" style="max-width: 580px;">
                ${isBn
                  ? `"${cleanSlug}" নামে কোনো প্রকাশিত পর্যটন ক্যাটাগরি আমাদের তালিকাভুক্ত নেই। সকল ক্যাটাগরি পাতায় ফিরে গিয়ে পছন্দের ক্যাটাগরি নির্বাচন করুন।`
                  : `No published tourism category matched "${cleanSlug}". Return to the Categories directory to browse all available travel categories.`}
              </p>
              <div class="d-flex flex-wrap justify-content-center gap-2">
                <a href="/categories/" class="btn btn-primary-bd px-4 py-2 rounded-pill">
                  <i class="bi bi-grid-fill me-2"></i>${isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}
                </a>
                <a href="/places/" class="btn btn-outline-bd px-4 py-2 rounded-pill">
                  <i class="bi bi-compass me-2"></i>${isBn ? 'সকল দর্শনীয় স্থান' : 'All Tourist Destinations'}
                </a>
              </div>
            </div>
          `}
      </div>
    `;
  }

  const nameBn = category.name_bn || category.name_en;
  const nameEn = category.name_en || category.name_bn;
  const primaryName = isBn ? nameBn : nameEn;
  const secondaryName = isBn ? nameEn : nameBn;
  const desc = (isBn ? category.description_bn : category.description_en) || category.description_en || category.description_bn || '';
  const coverImage = optimizeImageUrl(category.image_url || CATEGORIES_HERO_BG, 1600) || CATEGORIES_HERO_BG;

  const publishedDivisions = divisions.filter(d => d.is_published !== false);
  const publishedDistricts = districts.filter(d => d.is_published !== false);
  const categoryTotalSpots = spots.filter(
    s => s.is_published === true && FirestoreService.doesSpotMatchCategory(s, category)
  );

  // Scoped districts dropdown when a division filter is active
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
    (divisionFilter !== 'all' && divisionFilter !== '') ||
    (districtFilter !== 'all' && districtFilter !== '');

  return `
    <!-- 1. Breadcrumb -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [
            { labelBn: 'ক্যাটাগরি সমূহ', labelEn: 'Categories', url: '/categories/' },
            { labelBn: nameBn, labelEn: nameEn }
          ],
          lang
        )}
      </div>
    </div>

    <!-- 2. Selected Category Information Hero -->
    <section
      class="hero-wrapper"
      style="min-height: 330px; padding: 3rem 0 4rem; background: linear-gradient(135deg, rgba(18, 60, 50, 0.92) 0%, rgba(28, 89, 72, 0.84) 100%), url('${escapeHtml(coverImage)}') center/cover no-repeat;"
    >
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-8">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
              <a href="/categories/" class="btn btn-outline-light btn-sm rounded-pill px-3">
                <i class="bi bi-arrow-left me-1"></i>${isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}
              </a>
              <span class="hero-pill-badge mb-0">
                <i class="bi ${escapeHtml(category.icon || 'bi-tags-fill')}"></i>
                <span>${isBn ? 'ভ্রমণ ক্যাটাগরি' : 'Travel Category'}</span>
              </span>
            </div>

            <h1 class="hero-title mb-2" id="category-detail-heading">
              ${escapeHtml(primaryName)}
            </h1>
            <p class="fs-4 text-warning fw-semibold mb-3 opacity-95">
              ${escapeHtml(secondaryName)}
            </p>
            <p class="hero-subtitle mb-0">
              ${escapeHtml(desc)}
            </p>
          </div>

          <div class="col-lg-4">
            <div class="p-4 rounded-4 text-white" style="background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(10px); border: 1px solid rgba(217, 164, 65, 0.35);">
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="rounded-circle bg-warning text-dark fs-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 54px; height: 54px;">
                  <i class="bi ${escapeHtml(category.icon || 'bi-compass')}" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="fs-2 fw-bold text-warning lh-1">${formatLocalizedNumber(categoryTotalSpots.length, lang)}</div>
                  <div class="small text-white-50 mt-1">${isBn ? 'প্রকাশিত দর্শনীয় স্থান' : 'Published Tourist Spots'}</div>
                </div>
              </div>
              <hr class="border-light opacity-25 my-2">
              <div class="small text-white-50 d-flex justify-content-between">
                <span>${isBn ? 'উপলব্ধ বিভাগ' : 'Divisions Covered'}</span>
                <span class="fw-semibold text-white">
                  ${formatLocalizedNumber(new Set(categoryTotalSpots.map(s => s.division_id)).size, lang)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Division & District Filter Bar -->
    <div class="container">
      <div class="search-card-wrapper">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label for="category-division-select" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-diagram-3 me-1"></i>${isBn ? 'বিভাগ অনুযায়ী ফিল্টার' : 'Filter by Division'}
            </label>
            <select
              class="form-select"
              id="category-division-select"
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

          <div class="col-md-5">
            <label for="category-district-select" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-geo-alt me-1"></i>${isBn ? 'জেলা অনুযায়ী ফিল্টার' : 'Filter by District'}
            </label>
            <select
              class="form-select"
              id="category-district-select"
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

          <div class="col-md-2 d-flex align-items-center">
            <button
              type="button"
              class="btn ${hasActiveFilters ? 'btn-accent' : 'btn-outline-bd'} w-100 py-2"
              style="min-height: 46px; border-radius: 10px;"
              id="category-reset-filters-btn"
              ${!hasActiveFilters ? 'disabled' : ''}
            >
              <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? 'রিসেট' : 'Reset'}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Published Category Spots Grid & Pagination -->
    <section class="container py-5" id="category-spots-grid">
      <div id="category-results-region">
        ${renderCategorySpotsResultsRegion(props)}
      </div>
    </section>
  `;
}
