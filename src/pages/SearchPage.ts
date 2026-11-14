/**
 * Dedicated Global Search Page Controller (/search/)
 *
 * Searches across all 5 published portal scopes:
 *  - Divisions (/divisions/:slug/)
 *  - Districts (/districts/:slug/)
 *  - Tourist Spots (/places/:slug/)
 *  - Travel Guides (/travel-guides/:slug/)
 *  - Categories (/categories/:slug/)
 *
 * Uses the memoized indexed search strategy in `src/utils/searchUtils.ts` so
 * live suggestions, keyword queries, filters, pagination, and Back/Forward
 * history navigation execute with zero extra Firestore reads after initial hydration.
 */

import {
  type Article,
  type Category,
  type District,
  type Division,
  type TouristSpot
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl, truncateText } from '../utils/formatUtils';
import {
  buildGlobalSearchIndex,
  executeIndexedGlobalSearch,
  highlightSearchMatchHtml,
  type SearchIndexEntry,
  type SearchResultType,
  type SearchTypeFilter
} from '../utils/searchUtils';
import { renderBreadcrumbs } from '../components';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export const SEARCH_RESULTS_PER_PAGE = 12;

export interface SearchPageProps {
  lang: Language;
  divisions: Division[];
  districts: District[];
  categories: Category[];
  spots: TouristSpot[];
  articles: Article[];
  query: string;
  typeFilter: SearchTypeFilter;
  divisionFilter: string;
  categoryFilter: string;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

const SEARCH_HERO_BG =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80';

interface ResultTypeMeta {
  labelBn: string;
  labelEn: string;
  icon: string;
  badgeClass: string;
  ctaBn: string;
  ctaEn: string;
}

const RESULT_TYPE_META: Record<SearchResultType, ResultTypeMeta> = {
  spot: {
    labelBn: 'দর্শনীয় স্থান',
    labelEn: 'Tourist Spot',
    icon: 'bi-geo-alt-fill',
    badgeClass: 'bg-success-subtle text-success border border-success-subtle',
    ctaBn: 'গন্তব্যের বিস্তারিত',
    ctaEn: 'View Destination'
  },
  district: {
    labelBn: 'জেলা',
    labelEn: 'District',
    icon: 'bi-map-fill',
    badgeClass: 'bg-primary-subtle text-primary border border-primary-subtle',
    ctaBn: 'জেলা গাইড দেখুন',
    ctaEn: 'Explore District'
  },
  division: {
    labelBn: 'বিভাগ',
    labelEn: 'Division',
    icon: 'bi-grid-fill',
    badgeClass: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
    ctaBn: 'বিভাগীয় পাতা',
    ctaEn: 'Explore Division'
  },
  guide: {
    labelBn: 'ভ্রমণ নির্দেশিকা',
    labelEn: 'Travel Guide',
    icon: 'bi-journal-richtext',
    badgeClass: 'bg-info-subtle text-info-emphasis border border-info-subtle',
    ctaBn: 'সম্পূর্ণ নিবন্ধ পড়ুন',
    ctaEn: 'Read Guide'
  },
  category: {
    labelBn: 'ক্যাটাগরি',
    labelEn: 'Category',
    icon: 'bi-tags-fill',
    badgeClass: 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle',
    ctaBn: 'ক্যাটাগরি দেখুন',
    ctaEn: 'Browse Category'
  }
};

const POPULAR_KEYWORDS: ReadonlyArray<{ bn: string; en: string }> = [
  { bn: 'কক্সবাজার', en: "Cox's Bazar" },
  { bn: 'সুন্দরবন', en: 'Sundarbans' },
  { bn: 'সাজেক ভ্যালি', en: 'Sajek Valley' },
  { bn: 'সিলেট', en: 'Sylhet' },
  { bn: 'সেন্টমার্টিন', en: "Saint Martin's" },
  { bn: 'লালবাগ কেল্লা', en: 'Lalbagh Fort' },
  { bn: 'সমুদ্র সৈকত', en: 'Beaches' }
];

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

function renderSearchPagination(
  currentPage: number,
  totalPages: number,
  lang: Language
): string {
  if (totalPages <= 1) return '';
  const isBn = lang === 'bn';
  const tokens = getPaginationTokens(currentPage, totalPages);

  return `
    <nav aria-label="${isBn ? 'অনুসন্ধান ফলাফলের পাতা নেভিগেশন' : 'Search results pagination'}" class="mt-4 pt-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
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
            id="search-page-prev"
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
                    class="page-link rounded-3 search-page-btn"
                    data-page="${token}"
                    ${token === currentPage ? 'aria-current="page"' : ''}
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
            id="search-page-next"
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
 * Render live autocomplete search suggestions dropdown (role="listbox").
 */
export function renderSearchSuggestionsDropdown(
  suggestions: SearchIndexEntry[],
  query: string,
  lang: Language,
  activeIndex: number = -1
): string {
  const isBn = lang === 'bn';
  const hasQuery = query.trim().length > 0;

  if (suggestions.length === 0) {
    if (!hasQuery) return '';
    return `
      <div class="p-3 text-center text-muted small">
        <i class="bi bi-search me-1"></i>
        ${isBn
          ? `"${escapeHtml(query.trim())}"-এর জন্য তাৎক্ষণিক কোনো সাজেশন নেই। এন্টার চাপুন বা ফিল্টার পরিবর্তন করুন।`
          : `No instant suggestions for "${escapeHtml(query.trim())}". Press Search to check full results.`}
      </div>
    `;
  }

  return `
    <div class="px-3 py-2 bg-light border-bottom d-flex justify-content-between align-items-center small text-muted">
      <span class="fw-semibold">
        <i class="bi ${hasQuery ? 'bi-lightning-charge-fill text-warning' : 'bi-stars text-warning'} me-1"></i>
        ${hasQuery
          ? (isBn ? 'তাৎক্ষণিক অনুসন্ধান সাজেশন' : 'Instant Suggestions')
          : (isBn ? 'জনপ্রিয় গন্তব্য ও গাইড' : 'Popular Destinations & Guides')}
      </span>
      <span class="d-none d-sm-inline" style="font-size: 0.75rem;">
        ${isBn ? 'ক্লিক করে সরাসরি দেখুন' : 'Select to open or search'}
      </span>
    </div>
    <div class="list-group list-group-flush" role="listbox">
      ${suggestions
        .map((entry, idx) => {
          const meta = RESULT_TYPE_META[entry.type];
          const primaryTitle = isBn ? entry.titleBn : entry.titleEn;
          const secondaryTitle = isBn ? entry.titleEn : entry.titleBn;
          const locationLabel =
            entry.type === 'spot' || entry.type === 'guide'
              ? [
                  isBn ? entry.districtNameBn : entry.districtNameEn,
                  isBn ? entry.divisionNameBn : entry.divisionNameEn
                ]
                  .filter(Boolean)
                  .join(', ')
              : entry.type === 'district'
                ? (isBn ? `${entry.divisionNameBn || ''} বিভাগ` : `${entry.divisionNameEn || ''} Division`)
                : '';

          return `
            <div
              class="list-group-item list-group-item-action d-flex align-items-center justify-content-between gap-2 px-3 py-2 search-suggestion-item ${idx === activeIndex ? 'active' : ''}"
              role="option"
              aria-selected="${idx === activeIndex ? 'true' : 'false'}"
              data-suggestion-index="${idx}"
              data-suggestion-url="${escapeHtml(entry.detailUrl)}"
              data-suggestion-query="${escapeHtml(primaryTitle)}"
            >
              <a
                href="${escapeHtml(entry.detailUrl)}"
                class="d-flex align-items-center gap-3 text-decoration-none text-reset flex-grow-1 min-w-0 search-suggestion-link"
                data-suggestion-url="${escapeHtml(entry.detailUrl)}"
              >
                ${entry.imageUrl ? `
                  <img
                    src="${optimizeImageUrl(entry.imageUrl, 160)}"
                    alt="${escapeHtml(primaryTitle)}"
                    class="rounded-2 object-fit-cover flex-shrink-0 border"
                    style="width: 44px; height: 44px;"
                    loading="lazy"
                    decoding="async"
                  >
                ` : `
                  <span class="rounded-2 bg-primary-bd text-warning d-inline-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px;">
                    <i class="bi ${escapeHtml(entry.icon || meta.icon)}"></i>
                  </span>
                `}
                <div class="min-w-0 flex-grow-1">
                  <div class="fw-semibold text-primary-bd text-truncate small">
                    ${hasQuery ? highlightSearchMatchHtml(primaryTitle, query) : escapeHtml(primaryTitle)}
                    ${secondaryTitle && secondaryTitle.toLowerCase() !== primaryTitle.toLowerCase()
                      ? `<span class="text-muted fw-normal ms-1">(${escapeHtml(secondaryTitle)})</span>`
                      : ''}
                  </div>
                  <div class="d-flex flex-wrap align-items-center gap-2 mt-1" style="font-size: 0.76rem;">
                    <span class="badge ${meta.badgeClass} px-2 py-0">
                      <i class="bi ${meta.icon} me-1"></i>${isBn ? meta.labelBn : meta.labelEn}
                    </span>
                    ${locationLabel ? `<span class="text-muted text-truncate"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(locationLabel)}</span>` : ''}
                  </div>
                </div>
              </a>
              <button
                type="button"
                class="btn btn-sm btn-light border rounded-pill px-2 py-1 flex-shrink-0 search-fill-keyword-btn"
                data-fill-keyword="${escapeHtml(primaryTitle)}"
                title="${isBn ? 'এই শব্দ দিয়ে খুঁজুন' : 'Search this keyword'}"
                aria-label="${isBn ? `${primaryTitle} শব্দ দিয়ে খুঁজুন` : `Search for ${primaryTitle}`}"
              >
                <i class="bi bi-arrow-up-left small"></i>
              </button>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderSearchResultCard(
  entry: SearchIndexEntry,
  query: string,
  lang: Language
): string {
  const isBn = lang === 'bn';
  const meta = RESULT_TYPE_META[entry.type];
  const primaryTitle = (isBn ? entry.titleBn : entry.titleEn) || entry.titleEn || entry.titleBn;
  const secondaryTitle = isBn ? entry.titleEn : entry.titleBn;
  const rawDesc = (isBn ? entry.shortDescBn : entry.shortDescEn) || entry.shortDescEn || entry.shortDescBn || '';
  const truncatedDesc = truncateText(rawDesc, 130);

  const locationParts: string[] = [];
  if (entry.type === 'spot' || entry.type === 'guide') {
    const distName = isBn ? entry.districtNameBn : entry.districtNameEn;
    const divName = isBn ? entry.divisionNameBn : entry.divisionNameEn;
    if (distName) locationParts.push(distName);
    if (divName) locationParts.push(isBn ? `${divName} বিভাগ` : `${divName} Division`);
  } else if (entry.type === 'district') {
    const divName = isBn ? entry.divisionNameBn : entry.divisionNameEn;
    if (divName) locationParts.push(isBn ? `${divName} বিভাগ` : `${divName} Division`);
  } else if (entry.type === 'division') {
    locationParts.push(isBn ? 'প্রশাসনিক বিভাগ • বাংলাদেশ' : 'Administrative Division • Bangladesh');
  } else if (entry.type === 'category') {
    locationParts.push(isBn ? 'পর্যটন ক্যাটাগরি' : 'Tourism Category');
  }
  const locationText = locationParts.join(' • ');

  return `
    <div class="col-lg-4 col-md-6">
      <article class="card-travel search-result-card h-100">
        <a href="${escapeHtml(entry.detailUrl)}" class="card-travel-img-box d-block text-decoration-none">
          ${entry.imageUrl ? `
            <img
              src="${optimizeImageUrl(entry.imageUrl, 700)}"
              alt="${escapeHtml(primaryTitle)}"
              class="card-travel-img"
              loading="lazy"
              decoding="async"
            >
          ` : `
            <div class="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white" style="background: linear-gradient(135deg, #123C32 0%, #1C5948 100%);">
              <i class="bi ${escapeHtml(entry.icon || meta.icon)} text-warning" style="font-size: 3rem;"></i>
              <span class="small text-white-50 mt-2 fw-semibold">${isBn ? meta.labelBn : meta.labelEn}</span>
            </div>
          `}
          <span class="card-badge-division">
            <i class="bi ${meta.icon} text-warning me-1"></i>${isBn ? meta.labelBn : meta.labelEn}
          </span>
        </a>

        <div class="card-travel-body">
          <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span class="badge ${meta.badgeClass} rounded-pill px-2 py-1">
              <i class="bi ${meta.icon} me-1"></i>${isBn ? meta.labelBn : meta.labelEn}
            </span>
          </div>

          <h3 class="card-travel-title mb-1">
            <a href="${escapeHtml(entry.detailUrl)}" class="text-decoration-none text-primary-bd">
              ${highlightSearchMatchHtml(primaryTitle, query)}
            </a>
          </h3>

          ${secondaryTitle && secondaryTitle.trim().toLowerCase() !== primaryTitle.trim().toLowerCase() ? `
            <div class="small text-muted mb-2">${highlightSearchMatchHtml(secondaryTitle, query)}</div>
          ` : ''}

          ${locationText ? `
            <div class="card-travel-location mb-2">
              <i class="bi bi-geo-alt-fill text-warning flex-shrink-0"></i>
              <span>${highlightSearchMatchHtml(locationText, query)}</span>
            </div>
          ` : ''}

          ${truncatedDesc ? `
            <p class="card-travel-desc mb-3">${highlightSearchMatchHtml(truncatedDesc, query)}</p>
          ` : '<div class="flex-grow-1"></div>'}

          <div class="mt-auto pt-2 border-top">
            <a
              href="${escapeHtml(entry.detailUrl)}"
              class="btn btn-outline-bd btn-sm w-100 rounded-pill fw-semibold"
            >
              ${isBn ? meta.ctaBn : meta.ctaEn} <i class="bi bi-arrow-right ms-1"></i>
            </a>
          </div>
        </div>
      </article>
    </div>
  `;
}

/**
 * Render the dynamic results region (type filters with live counts + cards + pagination + empty/loading/error).
 * Kept separate from the input hero so debounced typing never interrupts input focus or Bengali IME composition.
 */
export function renderSearchResultsRegion(props: SearchPageProps): string {
  const {
    lang,
    divisions,
    districts,
    categories,
    spots,
    articles,
    query,
    typeFilter,
    divisionFilter,
    categoryFilter,
    currentPage,
    isLoading,
    error
  } = props;
  const isBn = lang === 'bn';

  if (isLoading && spots.length === 0 && districts.length === 0) {
    return `
      <div class="row g-4 mt-1">
        ${Array.from({ length: 6 }, () => `<div class="col-lg-4 col-md-6">${renderCardSkeleton()}</div>`).join('')}
      </div>
    `;
  }

  if (error) {
    return renderErrorState({
      title: isBn ? 'অনুসন্ধান ডাটা লোড করা যায়নি' : 'Unable to Load Search Index',
      message: error,
      retryActionId: 'search-retry-btn',
      lang
    });
  }

  const index = buildGlobalSearchIndex({
    divisions,
    districts,
    categories,
    spots,
    articles
  });

  const result = executeIndexedGlobalSearch(index, {
    query,
    typeFilter,
    divisionFilter,
    categoryFilter,
    lang
  });

  const totalMatched = result.items.length;
  const totalPages = Math.max(1, Math.ceil(totalMatched / SEARCH_RESULTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * SEARCH_RESULTS_PER_PAGE;
  const pagedItems = result.items.slice(startIdx, startIdx + SEARCH_RESULTS_PER_PAGE);

  const typeFilterOptions: Array<{
    id: SearchTypeFilter;
    labelBn: string;
    labelEn: string;
    icon: string;
    count: number;
  }> = [
    { id: 'all', labelBn: 'সব ফলাফল', labelEn: 'All Results', icon: 'bi-stars', count: result.typeCounts.all },
    { id: 'spot', labelBn: 'দর্শনীয় স্থান', labelEn: 'Tourist Spots', icon: 'bi-geo-alt-fill', count: result.typeCounts.spot },
    { id: 'district', labelBn: 'জেলা', labelEn: 'Districts', icon: 'bi-map-fill', count: result.typeCounts.district },
    { id: 'division', labelBn: 'বিভাগ', labelEn: 'Divisions', icon: 'bi-grid-fill', count: result.typeCounts.division },
    { id: 'guide', labelBn: 'ভ্রমণ নির্দেশিকা', labelEn: 'Travel Guides', icon: 'bi-journal-richtext', count: result.typeCounts.guide },
    { id: 'category', labelBn: 'ক্যাটাগরি', labelEn: 'Categories', icon: 'bi-tags-fill', count: result.typeCounts.category }
  ];

  const cleanQuery = query.trim();

  return `
    <!-- Result Type Filter Pills -->
    <div class="d-flex align-items-center gap-2 overflow-x-auto pb-2 mb-4" role="tablist" aria-label="${isBn ? 'ফলাফলের ধরন ফিল্টার' : 'Filter by result type'}">
      ${typeFilterOptions
        .map(opt => {
          const isActive = typeFilter === opt.id;
          return `
            <button
              type="button"
              role="tab"
              aria-selected="${isActive ? 'true' : 'false'}"
              class="filter-pill search-type-filter-btn ${isActive ? 'active' : ''}"
              data-search-type="${opt.id}"
            >
              <i class="bi ${opt.icon}"></i>
              <span>${isBn ? opt.labelBn : opt.labelEn}</span>
              <span class="badge ${isActive ? 'bg-warning text-dark' : 'bg-light text-secondary border'} rounded-pill ms-1">
                ${formatLocalizedNumber(opt.count, lang)}
              </span>
            </button>
          `;
        })
        .join('')}
    </div>

    <!-- Results Count & Status Bar -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 pb-2 border-bottom">
      <div class="text-secondary small fw-semibold">
        ${totalMatched > 0
          ? (isBn
              ? `${cleanQuery ? `"<strong>${escapeHtml(cleanQuery)}</strong>" এর জন্য ` : ''}মোট ${formatLocalizedNumber(totalMatched, lang)}টি ফলাফলের মধ্যে ${formatLocalizedNumber(startIdx + 1, lang)}–${formatLocalizedNumber(startIdx + pagedItems.length, lang)} প্রদর্শিত হচ্ছে`
              : `Showing ${startIdx + 1}–${startIdx + pagedItems.length} of ${totalMatched} results${cleanQuery ? ` for "<strong>${escapeHtml(cleanQuery)}</strong>"` : ''}`)
          : (isBn
              ? `${cleanQuery ? `"<strong>${escapeHtml(cleanQuery)}</strong>" এর জন্য ` : ''}কোনো ফলাফল পাওয়া যায়নি`
              : `No results found${cleanQuery ? ` for "<strong>${escapeHtml(cleanQuery)}</strong>"` : ''}`)}
      </div>
      <div class="small text-muted">
        <i class="bi bi-database-check text-success me-1"></i>
        ${isBn
          ? `মোট ${formatLocalizedNumber(result.totalIndexed, lang)}টি প্রকাশিত রেকর্ড থেকে অনুসন্ধান`
          : `Indexed across ${result.totalIndexed} published entries`}
      </div>
    </div>

    ${pagedItems.length === 0 ? `
      <div class="bg-white rounded-4 border shadow-sm p-4 p-md-5 text-center my-3">
        ${renderEmptyState({
          titleBn: 'আপনার অনুসন্ধানের সাথে কোনো ফলাফল মেলেনি',
          titleEn: 'No Matching Results Found',
          descBn: cleanQuery
            ? `"${escapeHtml(cleanQuery)}" শব্দ বা নির্বাচিত ফিল্টারের সাথে মিল রয়েছে এমন কোনো বিভাগ, জেলা, দর্শনীয় স্থান, ভ্রমণ গাইড বা ক্যাটাগরি পাওয়া যায়নি। বানান যাচাই করুন অথবা নিচের জনপ্রিয় শব্দ ব্যবহার করে দেখুন।`
            : 'নির্বাচিত বিভাগ, ক্যাটাগরি বা ধরনের ফিল্টারের সাথে কোনো ফলাফল মেলেনি। অনুগ্রহ করে ফিল্টার রিসেট করে আবার চেষ্টা করুন।',
          descEn: cleanQuery
            ? `No published division, district, tourist spot, travel guide, or category matched "${escapeHtml(cleanQuery)}" with the active filters. Try checking spelling or resetting filters.`
            : 'No entries matched the selected division, category, or result type filters. Try resetting your filters.',
          icon: 'bi-search',
          lang
        })}

        <div class="d-flex flex-wrap justify-content-center gap-2 mt-3 mb-4">
          ${POPULAR_KEYWORDS.slice(0, 5)
            .map(kw => {
              const label = isBn ? kw.bn : kw.en;
              return `
                <button
                  type="button"
                  class="btn btn-light border btn-sm rounded-pill px-3 search-quick-chip-btn"
                  data-quick-query="${escapeHtml(label)}"
                >
                  <i class="bi bi-search text-warning me-1"></i>${escapeHtml(label)}
                </button>
              `;
            })
            .join('')}
        </div>

        <button type="button" class="btn btn-primary-bd rounded-pill px-4 py-2 fw-semibold" id="search-empty-reset-btn">
          <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? 'সব ফিল্টার ও অনুসন্ধান রিসেট করুন' : 'Reset Search & Filters'}
        </button>
      </div>
    ` : `
      <div class="row g-4" id="search-results-grid">
        ${pagedItems.map(item => renderSearchResultCard(item.entry, cleanQuery, lang)).join('')}
      </div>
      ${renderSearchPagination(safePage, totalPages, lang)}
    `}
  `;
}

export function renderSearchPage(props: SearchPageProps): string {
  const {
    lang,
    divisions,
    categories,
    query,
    typeFilter,
    divisionFilter,
    categoryFilter
  } = props;
  const isBn = lang === 'bn';

  const publishedDivisions = divisions.filter(d => d.is_published !== false);
  const publishedCategories = categories.filter(c => c.is_published === true);
  const hasActiveFilters =
    query.trim().length > 0 ||
    typeFilter !== 'all' ||
    divisionFilter !== 'all' ||
    categoryFilter !== 'all';

  return `
    <!-- Breadcrumb -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [
            {
              labelBn: 'গ্লোবাল অনুসন্ধান',
              labelEn: 'Global Search'
            }
          ],
          lang
        )}
      </div>
    </div>

    <!-- Search Hero Header -->
    <section
      class="py-5 text-white position-relative overflow-hidden"
      style="background: linear-gradient(135deg, rgba(18, 60, 50, 0.94) 0%, rgba(28, 89, 72, 0.88) 100%), url('${optimizeImageUrl(SEARCH_HERO_BG, 1600)}') center/cover no-repeat;"
    >
      <div class="container position-relative" style="z-index: 2;">
        <div class="mx-auto text-center" style="max-width: 820px;">
          <span class="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold mb-3">
            <i class="bi bi-compass-fill me-1"></i>
            ${isBn ? 'সমন্বিত দ্বিভাষিক অনুসন্ধান' : 'Unified Bilingual Portal Search'}
          </span>
          <h1 class="display-5 fw-bold text-white mb-3">
            ${isBn ? 'বাংলাদেশের সব গন্তব্য ও গাইড খুঁজুন' : 'Search All of Beautiful Bangladesh'}
          </h1>
          <p class="lead text-white-50 mb-4">
            ${isBn
              ? '৮টি বিভাগ, ৬৪টি জেলা, প্রকাশিত দর্শনীয় স্থান, ভ্রমণ নির্দেশিকা এবং পর্যটন ক্যাটাগরি—একই সাথে বাংলা ও ইংরেজিতে অনুসন্ধান করুন।'
              : 'Search across all 8 divisions, 64 districts, curated tourist spots, travel guides, and tourism categories in Bengali and English.'}
          </p>
        </div>

        <!-- Interactive Search Form & Live Suggestions Box -->
        <div class="mx-auto position-relative" style="max-width: 860px; z-index: 30;">
          <form id="search-page-form" class="bg-white rounded-4 p-2 p-md-3 shadow-lg border" role="search">
            <div class="row g-2 align-items-center">
              <div class="col-md">
                <div class="search-input-group position-relative">
                  <i class="bi bi-search search-icon-inside"></i>
                  <input
                    type="search"
                    class="form-control border-0 bg-light"
                    id="search-page-input"
                    value="${escapeHtml(query)}"
                    maxlength="120"
                    autocomplete="off"
                    aria-label="${isBn ? 'বাংলা বা ইংরেজিতে গন্তব্য, জেলা, বিভাগ বা গাইড খুঁজুন' : 'Search divisions, districts, tourist spots, travel guides, or categories'}"
                    aria-autocomplete="list"
                    aria-controls="search-suggestions-box"
                    aria-expanded="false"
                    placeholder="${isBn
                      ? 'লিখুন যেমন: কক্সবাজার, সাজেক, সুন্দরবন, Sylhet, Beaches...'
                      : "Search e.g. Cox's Bazar, Sundarbans, সাজেক, Sylhet, Beaches..."}"
                  >
                  <button
                    type="button"
                    id="search-page-clear-btn"
                    class="btn btn-sm btn-link text-muted position-absolute top-50 end-0 translate-middle-y me-1 ${query.trim() ? '' : 'd-none'}"
                    aria-label="${isBn ? 'অনুসন্ধান মুছুন' : 'Clear search query'}"
                  >
                    <i class="bi bi-x-circle-fill"></i>
                  </button>
                </div>
              </div>
              <div class="col-md-auto d-grid">
                <button
                  type="submit"
                  id="search-page-submit-btn"
                  class="btn btn-accent px-4 py-2 rounded-3 fw-bold"
                >
                  <i class="bi bi-search me-1"></i>${isBn ? 'অনুসন্ধান' : 'Search'}
                </button>
              </div>
            </div>
          </form>

          <!-- Live Suggestions Dropdown -->
          <div
            id="search-suggestions-box"
            class="search-suggestions-dropdown bg-white text-dark rounded-4 shadow-lg border overflow-hidden mt-2 d-none"
          ></div>

          <!-- Popular Quick Search Chips -->
          <div class="d-flex flex-wrap justify-content-center align-items-center gap-2 mt-3">
            <span class="small text-white-50 me-1">
              ${isBn ? 'জনপ্রিয় খোঁজ:' : 'Try searching:'}
            </span>
            ${POPULAR_KEYWORDS.map(kw => {
              const label = isBn ? kw.bn : kw.en;
              return `
                <button
                  type="button"
                  class="btn btn-sm rounded-pill px-3 text-white border border-light border-opacity-25 search-quick-chip-btn"
                  style="background: rgba(255,255,255,0.12);"
                  data-quick-query="${escapeHtml(label)}"
                >
                  ${escapeHtml(label)}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- Main Search Workspace -->
    <section class="container py-4 py-lg-5">
      <!-- Division & Category Dropdown Filters -->
      <div class="bg-white rounded-4 border shadow-sm p-3 p-md-4 mb-4">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label for="search-division-select" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-grid-fill text-warning me-1"></i>${isBn ? 'বিভাগ অনুযায়ী ফিল্টার' : 'Filter by Division'}
            </label>
            <select id="search-division-select" class="form-select rounded-3">
              <option value="all">${isBn ? 'সকল বিভাগ (৮টি)' : 'All Divisions (8)'}</option>
              ${publishedDivisions
                .map(
                  div => `
                    <option value="${escapeHtml(div.id)}" ${divisionFilter.toLowerCase() === div.id.toLowerCase() || (!!div.slug && divisionFilter.toLowerCase() === div.slug.toLowerCase()) ? 'selected' : ''}>
                      ${escapeHtml(isBn ? `${div.name_bn} বিভাগ` : `${div.name_en} Division`)}
                    </option>
                  `
                )
                .join('')}
            </select>
          </div>

          <div class="col-md-5">
            <label for="search-category-select" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-tags-fill text-warning me-1"></i>${isBn ? 'ক্যাটাগরি অনুযায়ী ফিল্টার' : 'Filter by Category'}
            </label>
            <select id="search-category-select" class="form-select rounded-3">
              <option value="all">${isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
              ${publishedCategories
                .map(
                  cat => `
                    <option value="${escapeHtml(cat.slug || cat.id)}" ${categoryFilter.toLowerCase() === cat.id.toLowerCase() || (!!cat.slug && categoryFilter.toLowerCase() === cat.slug.toLowerCase()) ? 'selected' : ''}>
                      ${escapeHtml(isBn ? cat.name_bn : cat.name_en)}
                    </option>
                  `
                )
                .join('')}
            </select>
          </div>

          <div class="col-md-2 d-grid">
            <button
              type="button"
              id="search-reset-filters-btn"
              class="btn ${hasActiveFilters ? 'btn-accent' : 'btn-outline-bd'} rounded-3 fw-semibold"
              ${hasActiveFilters ? '' : 'disabled'}
            >
              <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? 'রিসেট' : 'Reset'}
            </button>
          </div>
        </div>
      </div>

      <!-- Dynamic Results Region -->
      <div id="search-results-region">
        ${renderSearchResultsRegion(props)}
      </div>
    </section>
  `;
}
