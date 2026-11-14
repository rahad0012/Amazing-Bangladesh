/**
 * Travel Guides & Blog Page Controller (/travel-guides/)
 * Editorial travel magazine layout featuring:
 *  1. Breadcrumb & Editorial Hero Section with Search
 *  2. Featured Travel Article Spotlight
 *  3. Category Filters (7 Canonical Article Categories)
 *  4. Latest Travel Guides Grid (chronological, published only)
 *  5. Pagination
 *  6. Popular Travel Articles Shelf (from published Firestore articles)
 *  7. Newsletter Subscription Section
 *  8. Global Footer
 *
 * Strictly fetches published articles from Firestore and never invents
 * fake author identities, fake publication dates, or fake articles.
 */

import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleCategoryDefinition,
  type District
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';
import {
  renderBreadcrumbs,
  renderArticleCard,
  renderNewsletter,
  formatArticlePublishedDate,
  getArticlePrimaryCategory,
  resolveArticleDistrict
} from '../components';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export const GUIDES_PER_PAGE = 6;

export interface TravelGuidesPageProps {
  lang: Language;
  articles: Article[];
  districts: District[];
  searchQuery: string;
  categoryFilter: string;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

const GUIDES_HERO_BG =
  'https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=1600&q=80';

const FALLBACK_ARTICLE_IMG =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1200&q=80';

const CATEGORY_MATCH_RULES: Record<ArticleCategoryDefinition['id'], RegExp> = {
  'travel-tips': /\b(tip|tips|etiquette|safety|food|cuisine|delicac|packing|permit)\b|টিপস|নিরাপত্তা|খাবার|রসনা/,
  'budget-travel': /\b(budget|cheap|backpack|cost|affordable|economical)\b|বাজেট|সাশ্রয়ী/,
  'family-travel': /\b(family|kids|children|parents|friendly)\b|পরিবার|শিশু/,
  'adventure-travel': /\b(adventure|safari|wildlife|trek|hiking|expedition|forest|mangrove|eco-tourism)\b|রোমাঞ্চ|অ্যাডভেঞ্চার|ট্রেকিং|বন্যপ্রাণী/,
  'historical-travel': /\b(history|historical|heritage|archaeolog|mughal|ancient|fort|mosque|culture)\b|ঐতিহ্য|ঐতিহাসিক|ইতিহাস|সংস্কৃতি/,
  'destination-guides': /\b(itinerary|guide|destination|plan|day|tour|sundarbans|sajek|coxs)\b|গাইড|সহায়িকা|পরিকল্পনা|ভ্রমণ/,
  'seasonal-travel': /\b(season|seasonal|monsoon|winter|summer|rainy)\b|মৌসুম|বর্ষা|শীত/
};

/**
 * Check if an article belongs to one of the 7 article categories.
 * Uses explicit article.category_id when provided, or deterministic metadata/tag matching.
 */
export function doesArticleMatchCategory(article: Article, categoryId: string): boolean {
  if (!categoryId || categoryId === 'all') return true;
  const target = categoryId.trim().toLowerCase();

  if (article.category_id && article.category_id.trim().toLowerCase() === target) {
    return true;
  }

  const primary = getArticlePrimaryCategory(article);
  if (primary && primary.id === target) {
    return true;
  }

  const rule = CATEGORY_MATCH_RULES[target as ArticleCategoryDefinition['id']];
  if (!rule) return false;

  const searchable = [
    ...(Array.isArray(article.tags) ? article.tags : []),
    article.title_en || '',
    article.title_bn || '',
    article.excerpt_en || '',
    article.excerpt_bn || ''
  ]
    .join(' ')
    .toLowerCase();

  return rule.test(searchable);
}

/**
 * Filter published articles by bilingual title/excerpt search and category filter
 */
export function getFilteredPublishedArticles(
  articles: Article[],
  searchQuery: string,
  categoryFilter: string
): Article[] {
  const published = articles.filter(a => a.is_published === true && a.status !== 'draft');
  const q = searchQuery.trim().toLowerCase();

  return published.filter(article => {
    if (!doesArticleMatchCategory(article, categoryFilter)) {
      return false;
    }

    if (q) {
      const matchTitleEn = (article.title_en || '').toLowerCase().includes(q);
      const matchTitleBn = (article.title_bn || '').toLowerCase().includes(q);
      const matchExcerptEn = (article.excerpt_en || '').toLowerCase().includes(q);
      const matchExcerptBn = (article.excerpt_bn || '').toLowerCase().includes(q);
      const matchTags = (article.tags || []).some(tag => tag.toLowerCase().includes(q));
      if (!matchTitleEn && !matchTitleBn && !matchExcerptEn && !matchExcerptBn && !matchTags) {
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

function renderGuidesPagination(
  currentPage: number,
  totalPages: number,
  lang: Language
): string {
  if (totalPages <= 1) return '';
  const isBn = lang === 'bn';
  const tokens = getPaginationTokens(currentPage, totalPages);

  return `
    <nav aria-label="${isBn ? 'ভ্রমণ গাইড পাতা নেভিগেশন' : 'Travel guides pagination'}" class="mt-4 pt-2 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
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
            id="guides-page-prev"
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
                    class="page-link rounded-3 px-3 guides-page-btn ${token === currentPage ? 'bg-primary-bd border-success text-white fw-bold' : ''}"
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
            id="guides-page-next"
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

function renderFeaturedArticleSpotlight(
  article: Article,
  districts: District[],
  lang: Language
): string {
  const isBn = lang === 'bn';
  const title = (isBn ? article.title_bn : article.title_en) || article.title_en || article.title_bn;
  const excerpt =
    (isBn ? article.excerpt_bn : article.excerpt_en) || article.excerpt_en || article.excerpt_bn || '';
  const author = (isBn ? article.author_bn : article.author_en) || article.author_en || article.author_bn || '';
  const readTime =
    (isBn ? article.read_time_bn : article.read_time_en) || article.read_time_en || article.read_time_bn || '';
  const formattedDate = formatArticlePublishedDate(article.published_at, lang);
  const category = getArticlePrimaryCategory(article);
  const relatedDistrict = resolveArticleDistrict(article, districts);
  const coverImg = optimizeImageUrl(article.image_url || FALLBACK_ARTICLE_IMG, 1200);

  return `
    <section class="container mb-5" id="featured-guide-section" aria-labelledby="featured-guide-heading">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
          <span class="badge bg-warning text-dark px-3 py-1 rounded-pill fw-semibold mb-1">
            <i class="bi bi-stars me-1"></i>${isBn ? 'ফিচার্ড ভ্রমণ নিবন্ধ' : 'Featured Travel Article'}
          </span>
          <h2 class="h4 fw-bold text-primary-bd mb-0" id="featured-guide-heading">
            ${isBn ? 'সম্পাদকের নির্বাচিত বিশেষ গাইড' : 'Editorial Spotlight'}
          </h2>
        </div>
      </div>

      <article class="featured-article-card bg-white rounded-4 border shadow-sm overflow-hidden">
        <div class="row g-0 align-items-stretch">
          <div class="col-lg-6 position-relative" style="min-height: 280px;">
            <img
              src="${coverImg}"
              alt="${escapeHtml(title)}"
              class="w-100 h-100 object-fit-cover"
              style="min-height: 280px; max-height: 410px;"
              loading="eager"
              decoding="async"
            >
            ${category ? `
              <span class="position-absolute top-0 start-0 m-3 badge bg-primary-bd text-white px-3 py-2 rounded-pill shadow-sm">
                <i class="bi ${escapeHtml(category.icon)} text-warning me-1"></i>${escapeHtml(isBn ? category.name_bn : category.name_en)}
              </span>
            ` : ''}
          </div>

          <div class="col-lg-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
            <div class="d-flex flex-wrap align-items-center gap-3 small text-muted mb-3">
              ${formattedDate ? `
                <span><i class="bi bi-calendar3 text-warning me-1"></i>${escapeHtml(formattedDate)}</span>
              ` : ''}
              ${author ? `
                <span><i class="bi bi-person-fill text-secondary-bd me-1"></i>${escapeHtml(author)}</span>
              ` : ''}
              ${readTime ? `
                <span><i class="bi bi-clock text-primary-bd me-1"></i>${escapeHtml(readTime)}</span>
              ` : ''}
            </div>

            <h3 class="fw-bold text-primary-bd mb-3" style="font-size: clamp(1.35rem, 2.4vw, 1.85rem); line-height: 1.35;">
              <a
                href="/travel-guides/${encodeURIComponent((article.slug || article.id).toLowerCase())}/"
                class="text-decoration-none text-primary-bd article-detail-link"
                data-article-slug="${escapeHtml((article.slug || article.id).toLowerCase())}"
              >${escapeHtml(title)}</a>
            </h3>

            <p class="text-secondary mb-4 lh-lg">
              ${escapeHtml(excerpt)}
            </p>

            ${relatedDistrict ? `
              <div class="mb-4">
                <a
                  href="/districts/${encodeURIComponent((relatedDistrict.slug || relatedDistrict.id).toLowerCase())}/"
                  class="badge bg-light text-primary-bd border px-3 py-2 text-decoration-none fw-semibold district-detail-link"
                  data-district-slug="${escapeHtml((relatedDistrict.slug || relatedDistrict.id).toLowerCase())}"
                >
                  <i class="bi bi-geo-alt-fill text-warning me-1"></i>${isBn ? `সম্পর্কিত জেলা: ${escapeHtml(relatedDistrict.name_bn)}` : `Related District: ${escapeHtml(relatedDistrict.name_en)}`}
                </a>
              </div>
            ` : ''}

            <div class="d-flex flex-wrap align-items-center gap-3 mt-auto">
              <a
                href="/travel-guides/${encodeURIComponent((article.slug || article.id).toLowerCase())}/"
                class="btn btn-primary-bd px-4 py-2 rounded-pill fw-semibold text-decoration-none article-detail-link"
                data-article-slug="${escapeHtml((article.slug || article.id).toLowerCase())}"
              >
                <i class="bi bi-book-half me-2"></i>${isBn ? 'সম্পূর্ণ গাইড পড়ুন' : 'Read Full Article'}
              </a>
              ${(article.tags || []).slice(0, 3).map(tag => `
                <span class="badge bg-light text-secondary border">${escapeHtml(tag)}</span>
              `).join('')}
            </div>
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderPopularArticlesSection(
  articles: Article[],
  districts: District[],
  lang: Language
): string {
  if (articles.length === 0) return '';
  const isBn = lang === 'bn';

  // Deterministically order published articles by editorial richness (linked district/spot + published date) without fake view numbers
  const popular = [...articles]
    .sort((a, b) => {
      const scoreA = (a.related_spot_id ? 2 : 0) + (a.related_district_id ? 1 : 0);
      const scoreB = (b.related_spot_id ? 2 : 0) + (b.related_district_id ? 1 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.published_at || '').localeCompare(a.published_at || '');
    })
    .slice(0, 3);

  return `
    <section class="container mb-5" id="popular-guides-section" aria-labelledby="popular-guides-heading">
      <div class="bg-white rounded-4 border p-4 shadow-sm">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
          <div>
            <span class="small text-uppercase fw-bold text-warning letter-spacing-1">
              <i class="bi bi-bookmark-star-fill me-1"></i>${isBn ? 'জনপ্রিয় ভ্রমণ নিবন্ধ' : 'Popular Travel Articles'}
            </span>
            <h2 class="h4 fw-bold text-primary-bd mb-0 mt-1" id="popular-guides-heading">
              ${isBn ? 'ভ্রমণকারীদের পছন্দের শীর্ষ গাইডসমূহ' : 'Most Recommended Travel Reads'}
            </h2>
          </div>
          <span class="small text-muted">
            ${isBn
              ? `${formatLocalizedNumber(popular.length, lang)}টি নির্বাচিত প্রকাশনা`
              : `${popular.length} curated editorial picks`}
          </span>
        </div>

        <div class="row g-3">
          ${popular
            .map((art, index) => {
              const title = (isBn ? art.title_bn : art.title_en) || art.title_en || art.title_bn;
              const author = (isBn ? art.author_bn : art.author_en) || art.author_en || art.author_bn || '';
              const dateLabel = formatArticlePublishedDate(art.published_at, lang);
              const category = getArticlePrimaryCategory(art);
              const relDistrict = resolveArticleDistrict(art, districts);

              return `
                <div class="col-lg-4">
                  <div class="popular-article-item h-100 p-3 rounded-3 border bg-light-subtle d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="badge bg-primary-bd text-warning rounded-pill px-2 py-1 fw-bold">
                          ${formatLocalizedNumber(index + 1, lang)}
                        </span>
                        ${category ? `
                          <span class="small fw-semibold text-secondary-bd">
                            ${escapeHtml(isBn ? category.name_bn : category.name_en)}
                          </span>
                        ` : ''}
                      </div>

                      <div class="d-flex gap-3 align-items-start mb-2">
                        <img
                          src="${optimizeImageUrl(art.image_url || FALLBACK_ARTICLE_IMG, 300)}"
                          alt="${escapeHtml(title)}"
                          class="rounded-3 object-fit-cover flex-shrink-0"
                          style="width: 76px; height: 76px;"
                          loading="lazy"
                          decoding="async"
                        >
                        <div class="min-w-0">
                          <h3 class="h6 fw-bold text-primary-bd mb-1" style="line-height: 1.4;">
                            <a
                              href="/travel-guides/${encodeURIComponent((art.slug || art.id).toLowerCase())}/"
                              class="text-decoration-none text-primary-bd article-detail-link"
                              data-article-slug="${escapeHtml((art.slug || art.id).toLowerCase())}"
                            >${escapeHtml(title)}</a>
                          </h3>
                          <div class="small text-muted d-flex flex-wrap gap-2">
                            ${author ? `<span>${escapeHtml(author)}</span>` : ''}
                            ${(author && dateLabel) ? '<span>•</span>' : ''}
                            ${dateLabel ? `<span>${escapeHtml(dateLabel)}</span>` : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="d-flex justify-content-between align-items-center pt-2 border-top mt-2 gap-2">
                      ${relDistrict ? `
                        <a
                          href="/districts/${encodeURIComponent((relDistrict.slug || relDistrict.id).toLowerCase())}/"
                          class="small text-secondary-bd text-decoration-none fw-medium district-detail-link text-truncate"
                          data-district-slug="${escapeHtml((relDistrict.slug || relDistrict.id).toLowerCase())}"
                        >
                          <i class="bi bi-geo-alt me-1 text-warning"></i>${escapeHtml(isBn ? relDistrict.name_bn : relDistrict.name_en)}
                        </a>
                      ` : '<span></span>'}
                      <a
                        href="/travel-guides/${encodeURIComponent((art.slug || art.id).toLowerCase())}/"
                        class="btn btn-link btn-sm p-0 text-primary-bd fw-bold text-decoration-none article-detail-link flex-shrink-0"
                        data-article-slug="${escapeHtml((art.slug || art.id).toLowerCase())}"
                      >
                        ${isBn ? 'পড়ুন' : 'Read More'} <i class="bi bi-arrow-right"></i>
                      </a>
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    </section>
  `;
}

/**
 * Render Filtered Results Region (Latest Travel Guides + Pagination)
 * Can be updated independently on search typing so input focus stays intact.
 */
export function renderTravelGuidesResultsRegion(props: TravelGuidesPageProps): string {
  const {
    lang,
    articles,
    districts,
    searchQuery,
    categoryFilter,
    currentPage,
    isLoading,
    error
  } = props;
  const isBn = lang === 'bn';

  if (isLoading && articles.length === 0) {
    return `
      <div class="row g-4 py-2">
        ${renderCardSkeleton(6)}
      </div>
    `;
  }

  if (error && articles.length === 0) {
    return renderErrorState({
      title: isBn ? 'ভ্রমণ গাইড লোড করা যায়নি' : 'Unable to Load Travel Guides',
      message: error,
      retryActionId: 'guides-retry-btn',
      lang
    });
  }

  const publishedArticles = articles.filter(a => a.is_published === true && a.status !== 'draft');
  const filteredArticles = getFilteredPublishedArticles(
    publishedArticles,
    searchQuery,
    categoryFilter
  );

  const totalMatches = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / GUIDES_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * GUIDES_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(startIdx, startIdx + GUIDES_PER_PAGE);

  const activeCategoryObj =
    categoryFilter && categoryFilter !== 'all'
      ? ARTICLE_CATEGORIES.find(c => c.id === categoryFilter)
      : null;

  const hasActiveFilters =
    searchQuery.trim().length > 0 || (categoryFilter !== 'all' && categoryFilter !== '');

  return `
    <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
      <div>
        <span class="badge bg-secondary-bd text-white px-3 py-1 rounded-pill mb-2">
          <i class="bi bi-journal-richtext me-1"></i>${isBn ? 'সর্বশেষ ভ্রমণ নির্দেশিকা' : 'Latest Travel Guides'}
        </span>
        <h2 class="h3 fw-bold text-primary-bd mb-1" id="latest-guides-heading">
          ${activeCategoryObj
            ? escapeHtml(isBn ? activeCategoryObj.name_bn : activeCategoryObj.name_en)
            : (isBn ? 'সর্বশেষ প্রকাশিত ভ্রমণ গাইড ও প্রবন্ধ' : 'Latest Published Travel Guides & Stories')}
        </h2>
        <p class="text-muted small mb-0">
          ${isBn
            ? `মোট ${formatLocalizedNumber(totalMatches, lang)}টি প্রকাশিত ভ্রমণ গাইড প্রদর্শিত হচ্ছে`
            : `Showing ${totalMatches} published travel ${totalMatches === 1 ? 'guide' : 'guides'}`}
        </p>
      </div>

      ${totalMatches > 0 ? `
        <div class="small text-muted">
          ${isBn
            ? `দেখানো হচ্ছে ${formatLocalizedNumber(startIdx + 1, lang)}–${formatLocalizedNumber(Math.min(startIdx + paginatedArticles.length, totalMatches), lang)}`
            : `Showing ${startIdx + 1}–${Math.min(startIdx + paginatedArticles.length, totalMatches)} of ${totalMatches}`}
        </div>
      ` : ''}
    </div>

    ${paginatedArticles.length === 0 ? `
      <div class="bg-white rounded-4 border p-4 p-md-5 text-center shadow-sm">
        ${renderEmptyState({
          titleBn: hasActiveFilters ? 'কোনো ভ্রমণ গাইড পাওয়া যায়নি' : 'এখনও কোনো ভ্রমণ গাইড প্রকাশিত হয়নি',
          titleEn: hasActiveFilters ? 'No Matching Travel Guides Found' : 'No Travel Guides Published Yet',
          descBn: hasActiveFilters
            ? 'অনুসন্ধান শব্দ বা ক্যাটাগরি পরিবর্তন করে আবার চেষ্টা করুন।'
            : 'খুব শীঘ্রই ফায়ারস্টোর ডাটাবেসে নতুন ভ্রমণ গাইড যুক্ত করা হবে।',
          descEn: hasActiveFilters
            ? 'Try adjusting your search keywords or selecting another article category.'
            : 'New curated travel guides will appear here once published in Firestore.',
          icon: 'bi-journal-x',
          lang
        })}
        ${hasActiveFilters ? `
          <button type="button" class="btn btn-primary-bd rounded-pill px-4 mt-2" id="guides-empty-reset-btn">
            <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? 'সব ফিল্টার রিসেট করুন' : 'Reset All Filters'}
          </button>
        ` : ''}
      </div>
    ` : `
      <div class="row g-4" id="guides-directory-grid">
        ${paginatedArticles
          .map(article => `
            <div class="col-lg-4 col-md-6">
              ${renderArticleCard({
                article,
                lang,
                districts,
                categoryLabelOverride: activeCategoryObj ?? undefined
              })}
            </div>
          `)
          .join('')}
      </div>
      ${renderGuidesPagination(safePage, totalPages, lang)}
    `}
  `;
}

/**
 * Render Full Travel Guides & Blog Page (/travel-guides/)
 */
export function renderTravelGuidesPage(props: TravelGuidesPageProps): string {
  const { lang, articles, districts, searchQuery, categoryFilter, isLoading, error } = props;
  const isBn = lang === 'bn';

  const publishedArticles = articles.filter(a => a.is_published === true && a.status !== 'draft');
  const featuredArticle = publishedArticles.length > 0 ? publishedArticles[0] : null;
  const hasActiveFilters =
    searchQuery.trim().length > 0 || (categoryFilter !== 'all' && categoryFilter !== '');

  return `
    <!-- 1. Breadcrumb -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [{ labelBn: 'ভ্রমণ নির্দেশিকা ও ব্লগ', labelEn: 'Travel Guides & Blog' }],
          lang
        )}
      </div>
    </div>

    <!-- 2. Editorial Hero Section -->
    <header
      class="editorial-hero position-relative text-white overflow-hidden py-5 mb-5"
      style="background: linear-gradient(125deg, rgba(18, 60, 50, 0.94) 0%, rgba(28, 89, 72, 0.88) 55%, rgba(18, 60, 50, 0.92) 100%), url('${GUIDES_HERO_BG}') center/cover no-repeat;"
    >
      <div class="container py-lg-4 position-relative" style="z-index: 2;">
        <div class="row align-items-center g-4">
          <div class="col-lg-8">
            <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style="background: rgba(217, 164, 65, 0.2); border: 1px solid rgba(217, 164, 65, 0.55); color: #f7e4be;">
              <i class="bi bi-journal-bookmark-fill text-warning"></i>
              <span class="small fw-semibold">
                ${isBn ? 'বাংলাদেশ ভ্রমণ ম্যাগাজিন ও সহায়িকা' : 'Bangladesh Travel Magazine & Editorial Guides'}
              </span>
            </div>
            <h1 class="display-5 fw-bold text-white mb-3" style="line-height: 1.25;">
              ${isBn ? 'ভ্রমণ নির্দেশিকা, গল্প ও রুট গাইড' : 'Travel Guides, Stories & Route Journals'}
            </h1>
            <p class="lead text-white-50 mb-4" style="max-width: 680px;">
              ${isBn
                ? 'বাংলাদেশের পাহাড়, সমুদ্র, ম্যানগ্রোভ অরণ্য, ঐতিহাসিক স্থাপত্য ও মৌসুমি ভ্রমণের খাঁটি ও নির্ভরযোগ্য নির্দেশিকা।'
                : 'Curated destination handbooks, seasonal itineraries, heritage walks, and practical travel tips across Bangladesh.'}
            </p>

            <!-- Search Bar -->
            <div class="bg-white rounded-4 p-2 shadow-lg" style="max-width: 620px;">
              <div class="input-group input-group-lg align-items-center">
                <span class="input-group-text bg-transparent border-0 text-primary-bd ps-3">
                  <i class="bi bi-search"></i>
                </span>
                <input
                  type="search"
                  id="guides-search-input"
                  class="form-control border-0 shadow-none"
                  value="${escapeHtml(searchQuery)}"
                  placeholder="${isBn ? 'গাইডের শিরোনাম বা বিষয় খুঁজুন (বাংলা / English)...' : 'Search article titles in Bengali or English...'}"
                  aria-label="${isBn ? 'ভ্রমণ গাইড অনুসন্ধান' : 'Search travel guides'}"
                >
                <button
                  type="button"
                  id="guides-clear-search-btn"
                  class="btn btn-link text-muted text-decoration-none ${searchQuery.trim() ? '' : 'd-none'}"
                  aria-label="${isBn ? 'অনুসন্ধান মুছুন' : 'Clear search'}"
                >
                  <i class="bi bi-x-circle-fill fs-5"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="p-4 rounded-4 text-white" style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.16);">
              <div class="row g-3 text-center">
                <div class="col-6">
                  <div class="h3 fw-bold text-warning mb-0">
                    ${formatLocalizedNumber(publishedArticles.length, lang)}
                  </div>
                  <div class="small text-white-50">
                    ${isBn ? 'প্রকাশিত গাইড' : 'Published Guides'}
                  </div>
                </div>
                <div class="col-6">
                  <div class="h3 fw-bold text-warning mb-0">
                    ${formatLocalizedNumber(ARTICLE_CATEGORIES.length, lang)}
                  </div>
                  <div class="small text-white-50">
                    ${isBn ? 'ভ্রমণ ক্যাটাগরি' : 'Editorial Topics'}
                  </div>
                </div>
              </div>
              <hr class="border-light opacity-25 my-3">
              <p class="small text-white-50 mb-0">
                <i class="bi bi-patch-check-fill text-warning me-1"></i>
                ${isBn
                  ? 'প্রতিটি প্রবন্ধ দ্বিভাষিক (বাংলা ও ইংরেজি) ও জেলাভিত্তিক তথ্যের সাথে যুক্ত।'
                  : 'Every guide supports bilingual reading and links directly to verified district profiles.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 3. Featured Travel Article (shown when no search/filter narrows the showcase) -->
    ${!isLoading && !error && featuredArticle && !hasActiveFilters
      ? renderFeaturedArticleSpotlight(featuredArticle, districts, lang)
      : ''}

    <!-- 4. Popular Travel Articles -->
    ${!isLoading && !error && publishedArticles.length > 0
      ? renderPopularArticlesSection(publishedArticles, districts, lang)
      : ''}

    <!-- 5. Category Filters -->
    <section class="container mb-4" id="guides-category-filters" aria-label="${isBn ? 'নিবন্ধ ক্যাটাগরি ফিল্টার' : 'Article category filters'}">
      <div class="bg-white rounded-4 border p-3 p-md-4 shadow-sm">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 class="h6 fw-bold text-primary-bd mb-0">
            <i class="bi bi-funnel-fill text-warning me-2"></i>
            ${isBn ? 'বিষয়ভিত্তিক ক্যাটাগরি অনুযায়ী ফিল্টার করুন' : 'Browse by Travel Category'}
          </h2>
          <button
            type="button"
            id="guides-reset-filters-btn"
            class="btn btn-sm ${hasActiveFilters ? 'btn-accent' : 'btn-outline-bd'} rounded-pill px-3"
            ${hasActiveFilters ? '' : 'disabled'}
          >
            <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? 'ফিল্টার রিসেট' : 'Reset Filters'}
          </button>
        </div>

        <div class="d-flex flex-wrap gap-2">
          <button
            type="button"
            class="filter-pill guides-cat-btn ${categoryFilter === 'all' ? 'active' : ''}"
            data-guide-cat="all"
            aria-pressed="${categoryFilter === 'all' ? 'true' : 'false'}"
          >
            <i class="bi bi-grid-fill"></i>
            <span>${isBn ? 'সব গাইড' : 'All Guides'}</span>
            <span class="badge ${categoryFilter === 'all' ? 'bg-warning text-dark' : 'bg-light text-secondary border'} rounded-pill">
              ${formatLocalizedNumber(publishedArticles.length, lang)}
            </span>
          </button>

          ${ARTICLE_CATEGORIES.map(cat => {
            const count = publishedArticles.filter(art => doesArticleMatchCategory(art, cat.id)).length;
            const isActive = categoryFilter === cat.id;
            return `
              <button
                type="button"
                class="filter-pill guides-cat-btn ${isActive ? 'active' : ''}"
                data-guide-cat="${escapeHtml(cat.id)}"
                aria-pressed="${isActive ? 'true' : 'false'}"
              >
                <i class="bi ${escapeHtml(cat.icon)}"></i>
                <span>${escapeHtml(isBn ? cat.name_bn : cat.name_en)}</span>
                <span class="badge ${isActive ? 'bg-warning text-dark' : 'bg-light text-secondary border'} rounded-pill">
                  ${formatLocalizedNumber(count, lang)}
                </span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- 6 & 7. Latest Travel Guides Grid + Pagination -->
    <section class="container pb-4" id="guides-results-region" aria-live="polite">
      ${renderTravelGuidesResultsRegion(props)}
    </section>

    <!-- 8. Newsletter Section -->
    ${renderNewsletter(lang)}
  `;
}
