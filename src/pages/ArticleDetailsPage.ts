/**
 * Dynamic Travel Article Details Page Controller
 * URLs: /travel-guides/:slug/
 *
 * Page Structure:
 *  1. Breadcrumb
 *  2. Article title
 *  3. Short introduction
 *  4. Cover image
 *  5. Author and publication date
 *  6. Estimated reading time, calculated from article content
 *  7. Article content (safely rendered headings, paragraphs, lists, images, links, blockquotes)
 *  8. Table of contents for long articles
 *  9. Related district or tourist destination links
 * 10. Related articles (reusing renderArticleCard)
 * 11. Social share buttons
 * 12. Copy article URL button
 * 13. Global Footer (rendered by layout shell)
 *
 * Strictly displays published articles from Firestore and never inserts fake article content when missing.
 */

import {
  type Article,
  type District,
  type Division,
  type TouristSpot
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl } from '../utils/formatUtils';
import {
  renderBreadcrumbs,
  renderArticleCard,
  formatArticlePublishedDate,
  getArticlePrimaryCategory,
  resolveArticleDistrict
} from '../components';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export interface ArticleDetailPageProps {
  lang: Language;
  requestedSlug: string;
  article: Article | null;
  allArticles: Article[];
  districts: District[];
  divisions: Division[];
  spots: TouristSpot[];
  isLoading: boolean;
  error: string | null;
}

export interface TocItem {
  id: string;
  level: number;
  text: string;
}

export interface ParsedArticleContent {
  html: string;
  toc: TocItem[];
  wordCount: number;
}

const FALLBACK_ARTICLE_COVER =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1400&q=80';

function sanitizeSafeUrl(rawUrl: string): string | null {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Render inline markdown syntax cleanly after HTML-escaping text:
 *  - Images ![alt](url)
 *  - Links [text](url)
 *  - Bold **text**
 *  - Italic *text*
 *  - Inline code `code`
 */
function renderInlineMarkdown(rawLine: string): string {
  // Extract markdown images and links using placeholders before escaping HTML
  const tokens: string[] = [];
  let working = rawLine.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
    const safeUrl = sanitizeSafeUrl(url);
    if (!safeUrl) return escapeHtml(alt);
    const token = `__MD_TOKEN_${tokens.length}__`;
    tokens.push(
      `<figure class="my-4 text-center"><img src="${escapeHtml(optimizeImageUrl(safeUrl, 1000))}" alt="${escapeHtml(alt)}" class="img-fluid rounded-4 shadow-sm border" loading="lazy" decoding="async">${alt ? `<figcaption class="small text-muted mt-2">${escapeHtml(alt)}</figcaption>` : ''}</figure>`
    );
    return token;
  });

  working = working.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
    const safeUrl = sanitizeSafeUrl(url);
    if (!safeUrl) return escapeHtml(label);
    const isExternal = /^https?:\/\//i.test(safeUrl) && !safeUrl.startsWith(window.location.origin);
    const token = `__MD_TOKEN_${tokens.length}__`;
    tokens.push(
      `<a href="${escapeHtml(safeUrl)}" class="text-secondary-bd fw-semibold text-decoration-underline"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(label)}</a>`
    );
    return token;
  });

  let escaped = escapeHtml(working);
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="px-1 py-0 rounded bg-light text-primary-bd border small">$1</code>');
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return escaped.replace(/__MD_TOKEN_(\d+)__/g, (_m, idx) => tokens[Number(idx)] || '');
}

const ALLOWED_HTML_TAGS = new Set([
  'P',
  'H2',
  'H3',
  'H4',
  'H5',
  'UL',
  'OL',
  'LI',
  'STRONG',
  'B',
  'EM',
  'I',
  'BLOCKQUOTE',
  'A',
  'IMG',
  'BR',
  'HR',
  'CODE',
  'PRE',
  'FIGURE',
  'FIGCAPTION'
]);

/**
 * Safely sanitize allowlisted HTML content using DOMParser if the CMS document uses HTML markup.
 */
function parseAndSanitizeHtmlContent(rawHtml: string): ParsedArticleContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const toc: TocItem[] = [];
  let headingCounter = 0;

  const sanitizeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as Element;
    const tag = el.tagName.toUpperCase();

    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED') {
      return '';
    }

    const inner = Array.from(el.childNodes).map(sanitizeNode).join('');

    if (tag === 'H1') {
      const id = `article-sec-${headingCounter++}`;
      const plainText = (el.textContent || '').trim();
      if (plainText) toc.push({ id, level: 2, text: plainText });
      return `<h2 id="${id}" class="h4 fw-bold text-primary-bd mt-4 mb-3 pt-2">${inner}</h2>`;
    }

    if (!ALLOWED_HTML_TAGS.has(tag)) {
      return inner;
    }

    if (tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5') {
      const level = Number(tag.slice(1));
      const id = `article-sec-${headingCounter++}`;
      const plainText = (el.textContent || '').trim();
      if (plainText) toc.push({ id, level, text: plainText });
      const cls = level <= 2 ? 'h4 fw-bold text-primary-bd mt-4 mb-3 pt-2' : 'h5 fw-bold text-primary-bd mt-3 mb-2 pt-1';
      return `<h${level} id="${id}" class="${cls}">${inner}</h${level}>`;
    }

    if (tag === 'A') {
      const safeHref = sanitizeSafeUrl(el.getAttribute('href') || '');
      if (!safeHref) return inner;
      const isExternal = /^https?:\/\//i.test(safeHref) && !safeHref.startsWith(window.location.origin);
      return `<a href="${escapeHtml(safeHref)}" class="text-secondary-bd fw-semibold text-decoration-underline"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>${inner}</a>`;
    }

    if (tag === 'IMG') {
      const safeSrc = sanitizeSafeUrl(el.getAttribute('src') || '');
      if (!safeSrc) return '';
      const alt = el.getAttribute('alt') || '';
      return `<img src="${escapeHtml(optimizeImageUrl(safeSrc, 1000))}" alt="${escapeHtml(alt)}" class="img-fluid rounded-4 shadow-sm border my-3" loading="lazy" decoding="async">`;
    }

    if (tag === 'BLOCKQUOTE') {
      return `<blockquote class="border-start border-4 border-warning bg-light-subtle px-4 py-3 rounded-end-3 my-3 fst-italic text-primary-bd">${inner}</blockquote>`;
    }

    if (tag === 'P') {
      return `<p class="mb-3 lh-lg text-secondary">${inner}</p>`;
    }

    if (tag === 'UL') return `<ul class="mb-3 ps-4 lh-lg text-secondary">${inner}</ul>`;
    if (tag === 'OL') return `<ol class="mb-3 ps-4 lh-lg text-secondary">${inner}</ol>`;
    if (tag === 'LI') return `<li class="mb-1">${inner}</li>`;
    if (tag === 'BR') return '<br>';
    if (tag === 'HR') return '<hr class="my-4 opacity-25">';

    const lower = tag.toLowerCase();
    return `<${lower}>${inner}</${lower}>`;
  };

  const html = Array.from(doc.body.childNodes).map(sanitizeNode).join('');
  const plain = (doc.body.textContent || '').trim();
  const wordCount = plain ? plain.split(/\s+/).filter(Boolean).length : 0;

  return { html, toc, wordCount };
}

/**
 * Safely parse Markdown or allowlisted HTML article content into structured HTML + TOC headings + wordCount.
 */
export function parseSafeArticleContent(rawContent: string): ParsedArticleContent {
  const trimmed = (rawContent || '').trim();
  if (!trimmed) {
    return { html: '', toc: [], wordCount: 0 };
  }

  // Detect intentional HTML block markup vs Markdown / plain text
  if (/<(p|h[1-6]|ul|ol|li|blockquote|figure)\b[^>]*>/i.test(trimmed)) {
    return parseAndSanitizeHtmlContent(trimmed);
  }

  const lines = trimmed.replace(/\r\n/g, '\n').split('\n');
  const htmlChunks: string[] = [];
  const toc: TocItem[] = [];
  let headingCounter = 0;

  let listType: 'ul' | 'ol' | null = null;
  let paragraphLines: string[] = [];
  let quoteLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const joined = paragraphLines.map(l => renderInlineMarkdown(l)).join('<br>');
    htmlChunks.push(`<p class="mb-3 lh-lg text-secondary">${joined}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listType) return;
    htmlChunks.push(`</${listType}>`);
    listType = null;
  };

  const flushQuote = () => {
    if (quoteLines.length === 0) return;
    const joined = quoteLines.map(l => renderInlineMarkdown(l)).join('<br>');
    htmlChunks.push(
      `<blockquote class="border-start border-4 border-warning bg-light-subtle px-4 py-3 rounded-end-3 my-3 fst-italic text-primary-bd">${joined}</blockquote>`
    );
    quoteLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flushParagraph();
      flushList();
      flushQuote();
      htmlChunks.push('<hr class="my-4 opacity-25">');
      continue;
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      const rawLevel = headingMatch[1].length;
      const semanticLevel = Math.min(4, Math.max(2, rawLevel === 1 ? 2 : rawLevel));
      const headingText = headingMatch[2].trim();
      const id = `article-sec-${headingCounter++}`;
      toc.push({ id, level: semanticLevel, text: headingText });
      const cls =
        semanticLevel <= 2
          ? 'h4 fw-bold text-primary-bd mt-4 mb-3 pt-2 border-bottom pb-2'
          : 'h5 fw-bold text-primary-bd mt-4 mb-2';
      htmlChunks.push(`<h${semanticLevel} id="${id}" class="${cls}">${renderInlineMarkdown(headingText)}</h${semanticLevel}>`);
      continue;
    }

    // Standalone Markdown image line ![alt](url)
    const standaloneImg = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (standaloneImg) {
      flushParagraph();
      flushList();
      flushQuote();
      htmlChunks.push(renderInlineMarkdown(line));
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      flushParagraph();
      flushList();
      quoteLines.push(line.replace(/^>\s?/, ''));
      continue;
    }
    flushQuote();

    // Unordered list (- item or * item)
    const ulMatch = line.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (listType === 'ol') flushList();
      if (!listType) {
        listType = 'ul';
        htmlChunks.push('<ul class="mb-3 ps-4 lh-lg text-secondary">');
      }
      htmlChunks.push(`<li class="mb-1">${renderInlineMarkdown(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list (1. item)
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (listType === 'ul') flushList();
      if (!listType) {
        listType = 'ol';
        htmlChunks.push('<ol class="mb-3 ps-4 lh-lg text-secondary">');
      }
      htmlChunks.push(`<li class="mb-1">${renderInlineMarkdown(olMatch[1])}</li>`);
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  flushQuote();

  const plainText = trimmed
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`\-]/g, ' ');
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  return {
    html: htmlChunks.join('\n'),
    toc,
    wordCount
  };
}

/**
 * Calculate estimated reading time dynamically from article content word count.
 */
export function calculateEstimatedReadingTime(
  contentText: string,
  excerptText: string,
  titleText: string,
  lang: Language
): { minutes: number; label: string } {
  const combined = `${titleText || ''} ${excerptText || ''} ${contentText || ''}`
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`\-]/g, ' ')
    .trim();

  const words = combined ? combined.split(/\s+/).filter(Boolean).length : 0;
  // Standard editorial speed ~180 words per minute (works well for both Bengali & English)
  const minutes = Math.max(1, Math.ceil(words / 180));
  const label =
    lang === 'bn'
      ? `${formatLocalizedNumber(minutes, 'bn')} মিনিট পঠন`
      : `${minutes} min read`;

  return { minutes, label };
}

/**
 * Select related published articles (matching category, district, or shared tags), excluding current article.
 */
function getRelatedPublishedArticles(
  current: Article,
  allArticles: Article[]
): Article[] {
  const currentCategory = getArticlePrimaryCategory(current)?.id || current.category_id || '';
  const currentDistrict = (current.related_district_id || '').trim().toLowerCase();
  const currentTags = new Set((current.tags || []).map(t => t.trim().toLowerCase()));

  return allArticles
    .filter(a => a.is_published === true && a.status !== 'draft' && a.id !== current.id)
    .map(candidate => {
      let score = 0;
      const candCategory = getArticlePrimaryCategory(candidate)?.id || candidate.category_id || '';
      if (currentCategory && candCategory === currentCategory) score += 3;
      if (currentDistrict && (candidate.related_district_id || '').trim().toLowerCase() === currentDistrict) {
        score += 4;
      }
      for (const tag of candidate.tags || []) {
        if (currentTags.has(tag.trim().toLowerCase())) score += 2;
      }
      return { candidate, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.candidate.published_at || '').localeCompare(a.candidate.published_at || '');
    })
    .slice(0, 3)
    .map(item => item.candidate);
}

/**
 * Resolve related Tourist Spots linked via related_spot_id or related_district_id.
 */
function getRelatedSpotsForArticle(
  article: Article,
  spots: TouristSpot[],
  district: District | null
): TouristSpot[] {
  const publishedSpots = spots.filter(s => s.is_published === true);
  const matched: TouristSpot[] = [];
  const seen = new Set<string>();

  const spotRef = (article.related_spot_id || '').trim().toLowerCase();
  if (spotRef) {
    const directSpot = publishedSpots.find(
      s => s.id.toLowerCase() === spotRef || (!!s.slug && s.slug.toLowerCase() === spotRef)
    );
    if (directSpot) {
      seen.add(directSpot.id);
      matched.push(directSpot);
    }
  }

  if (district) {
    const distId = district.id.toLowerCase();
    const distSlug = (district.slug || '').toLowerCase();
    for (const s of publishedSpots) {
      if (seen.has(s.id)) continue;
      const sDist = (s.district_id || '').toLowerCase();
      if (sDist === distId || (!!distSlug && sDist === distSlug)) {
        seen.add(s.id);
        matched.push(s);
      }
      if (matched.length >= 3) break;
    }
  }

  return matched.slice(0, 3);
}

export function renderArticleDetailPage(props: ArticleDetailPageProps): string {
  const {
    lang,
    requestedSlug,
    article,
    allArticles,
    districts,
    divisions,
    spots,
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
              { labelBn: 'ভ্রমণ নির্দেশিকা', labelEn: 'Travel Guides', url: '/travel-guides/' },
              { labelBn: 'লোড হচ্ছে...', labelEn: 'Loading...' }
            ],
            lang
          )}
        </div>
      </div>
      <div class="container py-5">
        <div class="row g-4">
          <div class="col-lg-8 placeholder-glow">
            <span class="placeholder col-3 bg-warning rounded-pill mb-3" style="height: 24px;"></span>
            <h1 class="placeholder col-10 mb-3" style="height: 44px;"></h1>
            <p class="placeholder col-8 mb-4" style="height: 22px;"></p>
            <div class="placeholder col-12 rounded-4 mb-4" style="height: 360px;"></div>
            <div class="bg-white rounded-4 border p-4">
              <span class="placeholder col-12 mb-2"></span>
              <span class="placeholder col-11 mb-2"></span>
              <span class="placeholder col-10 mb-2"></span>
              <span class="placeholder col-8"></span>
            </div>
          </div>
          <div class="col-lg-4 placeholder-glow">
            <div class="bg-white rounded-4 border p-4 mb-4">
              <span class="placeholder col-6 mb-3" style="height: 24px;"></span>
              <span class="placeholder col-12 mb-2"></span>
              <span class="placeholder col-10"></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (error) {
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'ভ্রমণ নির্দেশিকা', labelEn: 'Travel Guides', url: '/travel-guides/' },
              { labelBn: 'ত্রুটি', labelEn: 'Error' }
            ],
            lang
          )}
        </div>
      </div>
      <div class="container py-5">
        ${renderErrorState({
          title: isBn ? 'ভ্রমণ নিবন্ধ লোড করা যায়নি' : 'Unable to Load Travel Article',
          message: error,
          retryActionId: 'article-detail-retry-btn',
          lang
        })}
      </div>
    `;
  }

  // Missing or unpublished document: never fabricate fake article content
  if (!article || article.is_published !== true || article.status === 'draft') {
    const recentPublished = allArticles
      .filter(a => a.is_published === true && a.status !== 'draft')
      .slice(0, 3);

    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'ভ্রমণ নির্দেশিকা', labelEn: 'Travel Guides', url: '/travel-guides/' },
              { labelBn: 'নিবন্ধ পাওয়া যায়নি', labelEn: 'Article Not Found' }
            ],
            lang
          )}
        </div>
      </div>

      <section class="container py-5">
        <div class="bg-white rounded-4 border shadow-sm p-4 p-md-5 text-center mx-auto" style="max-width: 720px;">
          ${renderEmptyState({
            titleBn: 'প্রকাশিত ভ্রমণ নিবন্ধটি পাওয়া যায়নি',
            titleEn: 'Published Travel Article Not Found',
            descBn: `অনুরোধকৃত ঠিকানা "${requestedSlug}"-এ কোনো প্রকাশিত ভ্রমণ নিবন্ধ ফায়ারস্টোর ডাটাবেসে পাওয়া যায়নি অথবা এটি এখনো প্রকাশিত হয়নি।`,
            descEn: `No published travel article matching "${requestedSlug}" was found in Firestore, or the article is not currently published.`,
            icon: 'bi-journal-x',
            lang
          })}
          <div class="mt-3">
            <a href="/travel-guides/" class="btn btn-primary-bd rounded-pill px-4 py-2 fw-semibold">
              <i class="bi bi-arrow-left me-2"></i>${isBn ? 'সকল ভ্রমণ নির্দেশিকা দেখুন' : 'Browse All Travel Guides'}
            </a>
          </div>
        </div>

        ${recentPublished.length > 0 ? `
          <div class="mt-5">
            <h2 class="h4 fw-bold text-primary-bd mb-3 text-center">
              ${isBn ? 'সাম্প্রতিক প্রকাশিত ভ্রমণ নির্দেশিকা' : 'Recently Published Travel Guides'}
            </h2>
            <div class="row g-4">
              ${recentPublished
                .map(art => `
                  <div class="col-lg-4 col-md-6">
                    ${renderArticleCard({ article: art, lang, districts })}
                  </div>
                `)
                .join('')}
            </div>
          </div>
        ` : ''}
      </section>
    `;
  }

  const title = (isBn ? article.title_bn : article.title_en) || article.title_en || article.title_bn;
  const secondaryTitle = isBn ? article.title_en : article.title_bn;
  const excerpt =
    (isBn ? article.excerpt_bn : article.excerpt_en) || article.excerpt_en || article.excerpt_bn || '';
  const rawContent =
    (isBn ? article.content_bn : article.content_en) || article.content_en || article.content_bn || '';
  const author = (isBn ? article.author_bn : article.author_en) || article.author_en || article.author_bn || '';
  const formattedDate = formatArticlePublishedDate(article.published_at, lang);
  const category = getArticlePrimaryCategory(article);
  const relatedDistrict = resolveArticleDistrict(article, districts);
  const relatedDivision = relatedDistrict
    ? divisions.find(
        d =>
          d.id.toLowerCase() === relatedDistrict.division_id.toLowerCase() ||
          (!!d.slug && d.slug.toLowerCase() === relatedDistrict.division_id.toLowerCase())
      ) || null
    : null;
  const relatedSpots = getRelatedSpotsForArticle(article, spots, relatedDistrict);
  const relatedArticles = getRelatedPublishedArticles(article, allArticles);

  const parsedContent = parseSafeArticleContent(rawContent);
  const readingTime = calculateEstimatedReadingTime(rawContent, excerpt, title, lang);
  const coverImage = optimizeImageUrl(article.image_url || FALLBACK_ARTICLE_COVER, 1400);

  const articleSlug = encodeURIComponent((article.slug || article.id).toLowerCase());
  const canonicalUrl = `${window.location.origin}/travel-guides/${articleSlug}/`;
  const encodedUrl = encodeURIComponent(canonicalUrl);
  const encodedTitle = encodeURIComponent(title);

  // Show Table of Contents for long articles or structured articles with >= 2 headings
  const showToc = parsedContent.toc.length >= 2;

  return `
    <!-- 1. Breadcrumb -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [
            { labelBn: 'ভ্রমণ নির্দেশিকা', labelEn: 'Travel Guides', url: '/travel-guides/' },
            { labelBn: article.title_bn || title, labelEn: article.title_en || title }
          ],
          lang
        )}
      </div>
    </div>

    <article class="pb-5" itemscope itemtype="https://schema.org/Article">
      <!-- 2, 3, 5, 6. Editorial Article Header -->
      <header class="bg-white border-bottom py-4 py-lg-5">
        <div class="container">
          <div class="mx-auto" style="max-width: 960px;">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
              ${category ? `
                <span class="badge bg-primary-bd text-white px-3 py-2 rounded-pill fw-semibold">
                  <i class="bi ${escapeHtml(category.icon)} text-warning me-1"></i>${escapeHtml(isBn ? category.name_bn : category.name_en)}
                </span>
              ` : ''}
              <span class="badge bg-light text-primary-bd border px-3 py-2 rounded-pill fw-semibold">
                <i class="bi bi-clock-history text-warning me-1"></i>${escapeHtml(readingTime.label)}
              </span>
              ${relatedDistrict ? `
                <a
                  href="/districts/${encodeURIComponent((relatedDistrict.slug || relatedDistrict.id).toLowerCase())}/"
                  class="badge bg-warning-subtle text-dark border border-warning-subtle px-3 py-2 rounded-pill text-decoration-none fw-semibold district-detail-link"
                  data-district-slug="${escapeHtml((relatedDistrict.slug || relatedDistrict.id).toLowerCase())}"
                >
                  <i class="bi bi-geo-alt-fill text-danger me-1"></i>${escapeHtml(isBn ? `${relatedDistrict.name_bn} জেলা` : `${relatedDistrict.name_en} District`)}
                </a>
              ` : ''}
            </div>

            <!-- 2. Article Title -->
            <h1 class="display-6 fw-bold text-primary-bd mb-2" itemprop="headline" style="line-height: 1.3;">
              ${escapeHtml(title)}
            </h1>
            ${secondaryTitle && secondaryTitle.trim().toLowerCase() !== title.trim().toLowerCase() ? `
              <p class="text-muted fw-medium mb-3">${escapeHtml(secondaryTitle)}</p>
            ` : ''}

            <!-- 3. Short Introduction -->
            ${excerpt ? `
              <p class="lead text-secondary mb-4 lh-base" itemprop="description">
                ${escapeHtml(excerpt)}
              </p>
            ` : ''}

            <!-- 5. Author, Publication Date & Share Toolbar -->
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 border-top">
              <div class="d-flex flex-wrap align-items-center gap-3 small text-muted">
                ${author ? `
                  <span class="d-inline-flex align-items-center fw-semibold text-primary-bd" itemprop="author" itemscope itemtype="https://schema.org/Person">
                    <span class="rounded-circle bg-primary-bd text-warning d-inline-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                      <i class="bi bi-person-fill"></i>
                    </span>
                    <span itemprop="name">${escapeHtml(author)}</span>
                  </span>
                ` : ''}
                ${formattedDate ? `
                  <span class="d-inline-flex align-items-center">
                    <i class="bi bi-calendar3 text-warning me-1"></i>
                    <time datetime="${escapeHtml(article.published_at)}" itemprop="datePublished">${escapeHtml(formattedDate)}</time>
                  </span>
                ` : ''}
                <span class="d-inline-flex align-items-center">
                  <i class="bi bi-book me-1 text-secondary-bd"></i>
                  ${isBn
                    ? `${formatLocalizedNumber(parsedContent.wordCount, lang)} শব্দ`
                    : `${parsedContent.wordCount} words`}
                </span>
              </div>

              <!-- 11 & 12. Quick Share & Copy URL -->
              <div class="d-flex flex-wrap align-items-center gap-2">
                <button
                  type="button"
                  id="article-copy-url-btn"
                  class="btn btn-outline-bd btn-sm rounded-pill px-3 fw-semibold"
                >
                  <i class="bi bi-link-45deg me-1"></i><span>${isBn ? 'লিংক কপি' : 'Copy Link'}</span>
                </button>
                <button
                  type="button"
                  id="article-native-share-btn"
                  class="btn btn-primary-bd btn-sm rounded-pill px-3 fw-semibold"
                >
                  <i class="bi bi-share-fill me-1"></i>${isBn ? 'শেয়ার' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- 4. Cover Image -->
      <div class="container mt-4">
        <div class="mx-auto" style="max-width: 960px;">
          <figure class="rounded-4 overflow-hidden shadow-sm border bg-light mb-0" style="max-height: 480px;">
            <img
              src="${coverImage}"
              alt="${escapeHtml(title)}"
              class="w-100 h-100 object-fit-cover"
              style="max-height: 480px;"
              itemprop="image"
              loading="eager"
              decoding="async"
            >
          </figure>
        </div>
      </div>

      <!-- Main Editorial Body + Sidebar -->
      <div class="container mt-4 mt-lg-5">
        <div class="mx-auto" style="max-width: 1120px;">
          <div class="row g-4 g-lg-5">
            <!-- Left / Main Article Column -->
            <div class="col-lg-8">
              ${showToc ? `
                <!-- 8. Inline Table of Contents (Mobile & Tablet) -->
                <nav class="d-lg-none bg-white rounded-4 border p-4 mb-4 shadow-sm" aria-label="${isBn ? 'সূচিপত্র' : 'Table of contents'}">
                  <h2 class="h6 fw-bold text-primary-bd mb-3">
                    <i class="bi bi-list-nested text-warning me-2"></i>${isBn ? 'সূচিপত্র' : 'Table of Contents'}
                  </h2>
                  <ul class="list-unstyled mb-0 d-flex flex-column gap-2 small">
                    ${parsedContent.toc
                      .map(item => `
                        <li class="${item.level >= 3 ? 'ps-3' : ''}">
                          <a href="#${escapeHtml(item.id)}" class="text-decoration-none text-secondary-bd fw-medium article-toc-link">
                            <i class="bi bi-chevron-right small me-1 text-warning"></i>${escapeHtml(item.text)}
                          </a>
                        </li>
                      `)
                      .join('')}
                  </ul>
                </nav>
              ` : ''}

              <!-- 7. Formatted Article Content -->
              <div class="bg-white rounded-4 border shadow-sm p-4 p-md-5 article-prose-body" itemprop="articleBody">
                ${parsedContent.html || `
                  <p class="text-muted fst-italic mb-0">
                    ${isBn
                      ? 'এই নিবন্ধটির বিস্তারিত বিষয়বস্তু এখনো যুক্ত করা হয়নি।'
                      : 'Detailed content for this article is not currently available.'}
                  </p>
                `}

                ${article.tags && article.tags.length > 0 ? `
                  <div class="pt-4 mt-4 border-top d-flex flex-wrap align-items-center gap-2">
                    <span class="small fw-bold text-muted me-1">
                      <i class="bi bi-tags-fill text-warning me-1"></i>${isBn ? 'ট্যাগসমূহ:' : 'Tags:'}
                    </span>
                    ${article.tags
                      .map(tag => `<span class="badge bg-light text-secondary border px-2 py-1">${escapeHtml(tag)}</span>`)
                      .join('')}
                  </div>
                ` : ''}

                <!-- 11 & 12. Bottom Social Share & Copy URL Strip -->
                <div class="mt-4 pt-4 border-top">
                  <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                      <h2 class="h6 fw-bold text-primary-bd mb-1">
                        ${isBn ? 'এই ভ্রমণ গাইডটি শেয়ার করুন' : 'Share This Travel Guide'}
                      </h2>
                      <p class="small text-muted mb-0">
                        ${isBn ? 'সহযাত্রীদের সাথে নিবন্ধটির লিংক শেয়ার করুন।' : 'Share this guide with fellow travelers.'}
                      </p>
                    </div>
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <a
                        href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-outline-primary btn-sm rounded-pill px-3"
                        aria-label="Share on Facebook"
                      >
                        <i class="bi bi-facebook me-1"></i>Facebook
                      </a>
                      <a
                        href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-outline-dark btn-sm rounded-pill px-3"
                        aria-label="Share on X"
                      >
                        <i class="bi bi-twitter-x me-1"></i>X
                      </a>
                      <a
                        href="https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-outline-success btn-sm rounded-pill px-3"
                        aria-label="Share on WhatsApp"
                      >
                        <i class="bi bi-whatsapp me-1"></i>WhatsApp
                      </a>
                      <button
                        type="button"
                        id="article-copy-url-btn-bottom"
                        class="btn btn-accent btn-sm rounded-pill px-3 fw-semibold"
                      >
                        <i class="bi bi-clipboard-check me-1"></i>${isBn ? 'লিংক কপি করুন' : 'Copy URL'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Editorial Sidebar -->
            <aside class="col-lg-4">
              <div class="d-flex flex-column gap-4 sticky-lg-top" style="top: 90px; z-index: 10;">
                ${showToc ? `
                  <!-- 8. Desktop Sticky Table of Contents -->
                  <nav class="d-none d-lg-block bg-white rounded-4 border shadow-sm p-4" aria-label="${isBn ? 'সূচিপত্র' : 'Table of contents'}">
                    <h2 class="h6 fw-bold text-primary-bd mb-3 pb-2 border-bottom">
                      <i class="bi bi-list-nested text-warning me-2"></i>${isBn ? 'এই নিবন্ধে যা থাকছে' : 'Table of Contents'}
                    </h2>
                    <ul class="list-unstyled mb-0 d-flex flex-column gap-2 small">
                      ${parsedContent.toc
                        .map(item => `
                          <li class="${item.level >= 3 ? 'ps-3' : ''}">
                            <a href="#${escapeHtml(item.id)}" class="text-decoration-none text-secondary-bd fw-medium article-toc-link d-inline-flex align-items-start gap-1">
                              <i class="bi bi-chevron-right small mt-1 text-warning flex-shrink-0"></i>
                              <span>${escapeHtml(item.text)}</span>
                            </a>
                          </li>
                        `)
                        .join('')}
                    </ul>
                  </nav>
                ` : ''}

                <!-- 9. Related District & Tourist Destination Links -->
                ${(relatedDistrict || relatedSpots.length > 0) ? `
                  <div class="bg-white rounded-4 border shadow-sm p-4">
                    <h2 class="h6 fw-bold text-primary-bd mb-3 pb-2 border-bottom">
                      <i class="bi bi-geo-alt-fill text-warning me-2"></i>${isBn ? 'সম্পর্কিত জেলা ও গন্তব্য' : 'Related Destinations'}
                    </h2>

                    ${relatedDistrict ? `
                      <a
                        href="/districts/${encodeURIComponent((relatedDistrict.slug || relatedDistrict.id).toLowerCase())}/"
                        class="d-flex align-items-center justify-content-between p-3 rounded-3 border bg-light-subtle text-decoration-none mb-3 district-detail-link"
                        data-district-slug="${escapeHtml((relatedDistrict.slug || relatedDistrict.id).toLowerCase())}"
                      >
                        <div>
                          <div class="small text-muted">
                            ${relatedDivision
                              ? escapeHtml(isBn ? `${relatedDivision.name_bn} বিভাগ` : `${relatedDivision.name_en} Division`)
                              : (isBn ? 'সম্পর্কিত জেলা' : 'Related District')}
                          </div>
                          <div class="fw-bold text-primary-bd">
                            ${escapeHtml(isBn ? `${relatedDistrict.name_bn} জেলা` : `${relatedDistrict.name_en} District`)}
                          </div>
                        </div>
                        <i class="bi bi-arrow-right-circle-fill text-warning fs-5"></i>
                      </a>
                    ` : ''}

                    ${relatedSpots.length > 0 ? `
                      <div class="d-flex flex-column gap-2">
                        <div class="small fw-semibold text-muted">
                          ${isBn ? 'উল্লেখযোগ্য দর্শনীয় স্থান:' : 'Featured Tourist Spots:'}
                        </div>
                        ${relatedSpots
                          .map(sp => {
                            const spSlug = encodeURIComponent((sp.slug || sp.id).toLowerCase());
                            return `
                              <a
                                href="/places/${spSlug}/"
                                class="d-flex align-items-center gap-3 p-2 rounded-3 border text-decoration-none spot-detail-link hover-lift"
                                data-spot-slug="${escapeHtml((sp.slug || sp.id).toLowerCase())}"
                              >
                                <img
                                  src="${optimizeImageUrl(sp.image_url, 200)}"
                                  alt="${escapeHtml(isBn ? sp.name_bn : sp.name_en)}"
                                  class="rounded-2 object-fit-cover flex-shrink-0"
                                  style="width: 52px; height: 52px;"
                                  loading="lazy"
                                  decoding="async"
                                >
                                <div class="min-w-0 flex-grow-1">
                                  <div class="fw-semibold text-primary-bd small text-truncate">
                                    ${escapeHtml(isBn ? sp.name_bn : sp.name_en)}
                                  </div>
                                  <div class="text-muted" style="font-size: 0.78rem;">
                                    ${isBn ? 'বিস্তারিত গাইড দেখুন' : 'View destination guide'} <i class="bi bi-arrow-right"></i>
                                  </div>
                                </div>
                              </a>
                            `;
                          })
                          .join('')}
                      </div>
                    ` : ''}
                  </div>
                ` : ''}

                <!-- Back to All Travel Guides CTA -->
                <div class="p-4 rounded-4 text-white shadow-sm" style="background: linear-gradient(135deg, #123C32 0%, #1C5948 100%);">
                  <h2 class="h6 fw-bold text-warning mb-2">
                    <i class="bi bi-journal-bookmark-fill me-2"></i>${isBn ? 'আরও ভ্রমণ নির্দেশিকা' : 'Explore More Guides'}
                  </h2>
                  <p class="small text-white-50 mb-3">
                    ${isBn
                      ? 'বাজেট ভ্রমণ, পরিবার নিয়ে ভ্রমণ, ঐতিহাসিক ও মৌসুমি গাইড একসাথে দেখুন।'
                      : 'Browse budget tips, family itineraries, adventure stories, and seasonal guides across Bangladesh.'}
                  </p>
                  <a href="/travel-guides/" class="btn btn-warning btn-sm rounded-pill px-3 fw-bold text-dark">
                    <i class="bi bi-grid-fill me-1"></i>${isBn ? 'সকল ভ্রমণ গাইড' : 'All Travel Guides'}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <!-- 10. Related Articles -->
      ${relatedArticles.length > 0 ? `
        <section class="container mt-5 pt-4 border-top" aria-labelledby="related-articles-heading">
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
            <div>
              <span class="badge bg-secondary-bd text-white px-3 py-1 rounded-pill mb-2">
                ${isBn ? 'আরও পড়ুন' : 'Continue Reading'}
              </span>
              <h2 class="h3 fw-bold text-primary-bd mb-0" id="related-articles-heading">
                ${isBn ? 'সম্পর্কিত ভ্রমণ নিবন্ধ ও গাইড' : 'Related Travel Articles'}
              </h2>
            </div>
            <a href="/travel-guides/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
              ${isBn ? 'সব গাইড দেখুন' : 'All Guides'} <i class="bi bi-arrow-right ms-1"></i>
            </a>
          </div>

          <div class="row g-4">
            ${relatedArticles
              .map(relArt => `
                <div class="col-lg-4 col-md-6">
                  ${renderArticleCard({ article: relArt, lang, districts })}
                </div>
              `)
              .join('')}
          </div>
        </section>
      ` : ''}
    </article>
  `;
}
