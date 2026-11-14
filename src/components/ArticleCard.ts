/**
 * Reusable Travel Guide / Article Card Component
 * Editorial magazine card showing cover image, title, excerpt, publication date,
 * author, related district link (if applicable), category badge, and Read More trigger.
 * Strictly renders authentic Firestore data — never invents fake authors or publication dates.
 */

import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleCategoryDefinition,
  type District
} from '../data/bangladeshData';
import { type Language } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';

export interface ArticleCardOptions {
  article: Article;
  lang: Language;
  districts?: District[];
  categoryLabelOverride?: ArticleCategoryDefinition | null;
}

/**
 * Format an authentic ISO or YYYY-MM-DD publication date cleanly in Bengali or English.
 * Returns empty string if no valid publication date exists (never invents fake dates).
 */
export function formatArticlePublishedDate(publishedAt: string | undefined, lang: Language): string {
  if (!publishedAt || !publishedAt.trim()) return '';
  const timestamp = Date.parse(publishedAt.trim());
  if (Number.isNaN(timestamp)) return '';

  try {
    return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(timestamp));
  } catch {
    return publishedAt.trim();
  }
}

/**
 * Resolve primary article category from explicit category_id or article metadata/tags
 */
export function getArticlePrimaryCategory(article: Article): ArticleCategoryDefinition | null {
  const explicitId = (article.category_id || '').trim().toLowerCase();
  if (explicitId) {
    const direct = ARTICLE_CATEGORIES.find(
      c => c.id === explicitId || c.name_en.toLowerCase() === explicitId
    );
    if (direct) return direct;
  }

  const text = [
    ...(Array.isArray(article.tags) ? article.tags : []),
    article.title_en || '',
    article.title_bn || '',
    article.excerpt_en || '',
    article.excerpt_bn || ''
  ]
    .join(' ')
    .toLowerCase();

  if (/\b(budget|cheap|backpack|cost|affordable)\b|বাজেট|সাশ্রয়ী/.test(text)) {
    return ARTICLE_CATEGORIES.find(c => c.id === 'budget-travel') || null;
  }
  if (/\b(family|kids|children|parents)\b|পরিবার|শিশু/.test(text)) {
    return ARTICLE_CATEGORIES.find(c => c.id === 'family-travel') || null;
  }
  if (/\b(season|monsoon|winter|summer|rainy)\b|মৌসুম|বর্ষা|শীত/.test(text)) {
    return ARTICLE_CATEGORIES.find(c => c.id === 'seasonal-travel') || null;
  }
  if (/\b(history|historical|heritage|archaeolog|mughal|ancient|fort|mosque)\b|ঐতিহ্য|ঐতিহাসিক|ইতিহাস/.test(text)) {
    return ARTICLE_CATEGORIES.find(c => c.id === 'historical-travel') || null;
  }
  if (/\b(adventure|safari|wildlife|trek|hiking|expedition|forest|mangrove)\b|রোমাঞ্চ|অ্যাডভেঞ্চার|ট্রেকিং|বন্যপ্রাণী/.test(text)) {
    return ARTICLE_CATEGORIES.find(c => c.id === 'adventure-travel') || null;
  }
  if (/\b(tip|tips|etiquette|safety|food|cuisine|delicac|packing|permit)\b|টিপস|নিরাপত্তা|খাবার|রসনা/.test(text)) {
    return ARTICLE_CATEGORIES.find(c => c.id === 'travel-tips') || null;
  }
  if (/\b(itinerary|guide|destination|plan|day|tour)\b|গাইড|সহায়িকা|পরিকল্পনা/.test(text)) {
    return ARTICLE_CATEGORIES.find(c => c.id === 'destination-guides') || null;
  }

  return null;
}

/**
 * Resolve matching District object from published districts list if related_district_id is set
 */
export function resolveArticleDistrict(
  article: Article,
  districts: District[] = []
): District | null {
  const relId = (article.related_district_id || '').trim().toLowerCase();
  if (!relId) return null;
  return (
    districts.find(
      d =>
        d.is_published !== false &&
        (d.id.toLowerCase() === relId ||
          (!!d.slug && d.slug.toLowerCase() === relId))
    ) || null
  );
}

const FALLBACK_ARTICLE_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=900&q=80';

export function renderArticleCard(options: ArticleCardOptions): string {
  const { article, lang, districts = [] } = options;
  const isBn = lang === 'bn';

  const title = (isBn ? article.title_bn : article.title_en) || article.title_en || article.title_bn;
  const excerpt =
    (isBn ? article.excerpt_bn : article.excerpt_en) || article.excerpt_en || article.excerpt_bn || '';
  const author = (isBn ? article.author_bn : article.author_en) || article.author_en || article.author_bn || '';
  const readTime =
    (isBn ? article.read_time_bn : article.read_time_en) || article.read_time_en || article.read_time_bn || '';
  const formattedDate = formatArticlePublishedDate(article.published_at, lang);
  const category = options.categoryLabelOverride ?? getArticlePrimaryCategory(article);
  const relatedDistrict = resolveArticleDistrict(article, districts);
  const imgUrl = optimizeImageUrl(article.image_url || FALLBACK_ARTICLE_IMAGE, 750);

  const articleSlug = encodeURIComponent((article.slug || article.id).toLowerCase());
  const articleHref = `/travel-guides/${articleSlug}/`;

  return `
    <article class="card-travel article-card-editorial h-100 d-flex flex-column">
      <a
        href="${articleHref}"
        class="card-travel-img-box d-block text-decoration-none article-detail-link"
        data-article-slug="${escapeHtml((article.slug || article.id).toLowerCase())}"
        style="height: 210px;"
      >
        <img
          src="${imgUrl}"
          alt="${escapeHtml(title)}"
          class="card-travel-img"
          loading="lazy"
          decoding="async"
        >
        ${category ? `
          <span class="card-badge-division">
            <i class="bi ${escapeHtml(category.icon)} text-warning me-1"></i>${escapeHtml(isBn ? category.name_bn : category.name_en)}
          </span>
        ` : ''}
        ${readTime ? `
          <span class="card-badge-rating">
            <i class="bi bi-clock me-1 text-primary-bd"></i>${escapeHtml(readTime)}
          </span>
        ` : ''}
      </a>

      <div class="card-travel-body d-flex flex-column flex-grow-1">
        <!-- Editorial Meta Row: Publication Date & Author (only shown if present in Firestore) -->
        ${(formattedDate || author) ? `
          <div class="d-flex flex-wrap align-items-center gap-2 small text-muted mb-2">
            ${formattedDate ? `
              <span class="d-inline-flex align-items-center">
                <i class="bi bi-calendar3 me-1 text-warning"></i>${escapeHtml(formattedDate)}
              </span>
            ` : ''}
            ${(formattedDate && author) ? '<span aria-hidden="true">•</span>' : ''}
            ${author ? `
              <span class="d-inline-flex align-items-center text-truncate" style="max-width: 210px;">
                <i class="bi bi-person-fill me-1 text-secondary-bd"></i>${escapeHtml(author)}
              </span>
            ` : ''}
          </div>
        ` : ''}

        <h3 class="card-travel-title fs-5 mb-2">
          <a
            href="${articleHref}"
            class="text-decoration-none text-primary-bd article-detail-link"
            data-article-slug="${escapeHtml((article.slug || article.id).toLowerCase())}"
          >${escapeHtml(title)}</a>
        </h3>
        <p class="card-travel-desc small text-secondary flex-grow-1 mb-3">${escapeHtml(excerpt)}</p>

        ${relatedDistrict ? `
          <div class="mb-3">
            <a
              href="/districts/${encodeURIComponent((relatedDistrict.slug || relatedDistrict.id).toLowerCase())}/"
              class="badge bg-light text-primary-bd border text-decoration-none fw-semibold px-2 py-1 district-detail-link"
              data-district-slug="${escapeHtml((relatedDistrict.slug || relatedDistrict.id).toLowerCase())}"
            >
              <i class="bi bi-geo-alt-fill text-warning me-1"></i>${escapeHtml(isBn ? `${relatedDistrict.name_bn} জেলা` : `${relatedDistrict.name_en} District`)}
            </a>
          </div>
        ` : ''}

        <div class="pt-2 border-top d-flex justify-content-between align-items-center gap-2 mt-auto">
          <div class="d-flex flex-wrap gap-1 overflow-hidden" style="max-height: 24px;">
            ${(article.tags || []).slice(0, 2).map(tag => `
              <span class="badge bg-light text-muted border fw-normal">${escapeHtml(tag)}</span>
            `).join('')}
          </div>
          <a
            href="${articleHref}"
            class="btn btn-sm btn-primary-bd px-3 rounded-pill flex-shrink-0 text-decoration-none article-detail-link"
            data-article-slug="${escapeHtml((article.slug || article.id).toLowerCase())}"
          >
            ${isBn ? 'বিস্তারিত পড়ুন' : 'Read More'} <i class="bi bi-arrow-right ms-1"></i>
          </a>
        </div>
      </div>
    </article>
  `;
}
