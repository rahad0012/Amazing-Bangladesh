/**
 * Bilingual Indexed Global Search Engine & Filtering Utilities
 *
 * Search Architecture & Firestore Considerations:
 * ----------------------------------------------
 * Cloud Firestore does NOT natively support unrestricted multi-field full-text search
 * (for example, case-insensitive infix/substring queries across arbitrary Bengali and
 * English fields, multi-keyword scoring, or logical OR across multiple collections).
 * Native Firestore queries are limited to exact equality, prefix range bounds (>= / <=),
 * and single-field array-contains lookups on explicitly indexed fields.
 *
 * Strategy Implemented Here (Zero-Extra-Read Indexed Client Search):
 * 1. Single Session Hydration: Published documents from `divisions`, `districts`,
 *    `categories`, `tourist_spots`, and `articles` are fetched from Firestore once per
 *    session (respecting `is_published == true` security rules) and cached in memory.
 *    Typing, filtering, viewing suggestions, paginating, and browser Back/Forward
 *    navigation perform ZERO additional Firestore reads.
 * 2. Memoized Normalized Search Index: `buildGlobalSearchIndex()` pre-processes all
 *    published entities into structured `SearchIndexEntry` documents with Unicode NFC
 *    normalization, safe punctuation folding, and weighted field buckets (titles,
 *    geographic parent names, category tags, and summaries).
 * 3. Safe Special-Character & Bilingual Support: Handles Bengali script (\u0980-\u09FF),
 *    apostrophes/hyphens ("Cox's Bazar" vs "coxs bazar"), and regex/HTML metacharacters
 *    safely without throwing or introducing XSS vectors.
 *
 * Recommended External Service for Larger-Scale Production Growth:
 * ---------------------------------------------------------------
 * If the portal expands beyond a few thousand documents (e.g., user-generated reviews,
 * hundreds of travel articles, or hotel/guide listings), synchronize Firestore
 * collections via Cloud Functions or the official Firebase Extension to a dedicated
 * search engine such as **Algolia**, **Typesense**, or **Meilisearch** for sub-10ms
 * typo-tolerant full-text search, Bengali stemming, and server-side faceted pagination.
 */

import {
  ARTICLE_CATEGORIES,
  type Article,
  type Category,
  type District,
  type Division,
  type TouristSpot
} from '../data/bangladeshData';
import { escapeHtml } from './formatUtils';
import { type Language } from './langUtils';

export type SearchResultType = 'division' | 'district' | 'spot' | 'guide' | 'category';
export type SearchTypeFilter = 'all' | SearchResultType;

export interface SearchIndexEntry {
  uid: string;
  id: string;
  slug: string;
  type: SearchResultType;
  titleBn: string;
  titleEn: string;
  shortDescBn: string;
  shortDescEn: string;
  imageUrl?: string;
  icon?: string;
  divisionId?: string;
  divisionNameBn?: string;
  divisionNameEn?: string;
  districtId?: string;
  districtNameBn?: string;
  districtNameEn?: string;
  categoryTokens: string[];
  detailUrl: string;
  publishedAt?: string;
  // Pre-normalized search buckets
  normTitle: string;
  normTitleFolded: string;
  normLocation: string;
  normKeywords: string;
  normBody: string;
  normAll: string;
  normAllFolded: string;
}

export interface GlobalSearchIndex {
  signature: string;
  entries: SearchIndexEntry[];
  divisionsMap: Map<string, Division>;
  districtsMap: Map<string, District>;
  categoriesMap: Map<string, Category>;
  divisionHasCategory: Map<string, Set<string>>;
  districtHasCategory: Map<string, Set<string>>;
}

export interface SearchDatasetInput {
  divisions: Division[];
  districts: District[];
  categories: Category[];
  spots: TouristSpot[];
  articles: Article[];
}

export interface SearchQueryParams {
  query: string;
  typeFilter: SearchTypeFilter;
  divisionFilter: string;
  categoryFilter: string;
  lang: Language;
}

export interface ScoredSearchResult {
  entry: SearchIndexEntry;
  score: number;
}

export interface GlobalSearchExecutionResult {
  items: ScoredSearchResult[];
  typeCounts: Record<SearchTypeFilter, number>;
  totalIndexed: number;
}

const MAX_QUERY_LENGTH = 120;

const CATEGORY_ALIASES: Record<string, string> = {
  hills: 'hills-and-mountains',
  hills_and_mountains: 'hills-and-mountains',
  historical: 'historical-places',
  historical_places: 'historical-places',
  archaeological: 'archaeological-sites',
  archaeological_sites: 'archaeological-sites',
  religious: 'religious-places',
  religious_places: 'religious-places'
};

/**
 * Normalize raw search input safely (Unicode NFC, bounded length, control chars stripped).
 */
export function sanitizeSearchInput(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .normalize('NFC')
    .slice(0, MAX_QUERY_LENGTH);
  return cleaned;
}

export function normalizeSearchTerm(str: string): string {
  if (!str) return '';
  return sanitizeSearchInput(str).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Fold common punctuation (apostrophes, hyphens, slashes) so e.g.
 * "coxs bazar", "cox's bazar", and "saint-martin" match cleanly.
 */
export function foldPunctuation(str: string): string {
  return normalizeSearchTerm(str)
    .replace(/['’`ʻʼʹ]/g, '')
    .replace(/[-_/.,:;!?()[\]{}"“”'‘’\\|@#$%^&*+=<>~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeSearchTerms(query: string): string[] {
  const norm = normalizeSearchTerm(query);
  if (!norm) return [];
  const rawTokens = norm.split(/\s+/).filter(Boolean);
  const foldedTokens = foldPunctuation(query).split(/\s+/).filter(Boolean);
  return Array.from(new Set([...rawTokens, ...foldedTokens])).slice(0, 12);
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safely highlight search terms inside HTML-escaped text.
 * Escapes all text first so special characters or XSS payloads never render as markup.
 */
export function highlightSearchMatchHtml(rawText: string, query: string): string {
  const safeText = escapeHtml(rawText || '');
  const cleanQuery = normalizeSearchTerm(query);
  if (!safeText || !cleanQuery || cleanQuery.length < 2) {
    return safeText;
  }

  const rawWords = cleanQuery
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2)
    .slice(0, 5);

  if (rawWords.length === 0) return safeText;

  // Escape regex metacharacters from HTML-escaped tokens
  const escapedWords = rawWords
    .map(w => escapeRegExp(escapeHtml(w)))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (escapedWords.length === 0) return safeText;

  try {
    const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    return safeText.replace(pattern, '<mark class="search-highlight">$1</mark>');
  } catch {
    return safeText;
  }
}

export function matchesBilingualQuery(
  query: string,
  fields: Array<string | undefined | null>
): boolean {
  const q = normalizeSearchTerm(query);
  if (!q) return true;
  const qFolded = foldPunctuation(q);

  for (const field of fields) {
    if (!field) continue;
    const normField = normalizeSearchTerm(field);
    if (normField.includes(q)) return true;
    if (qFolded && foldPunctuation(normField).includes(qFolded)) return true;
  }
  return false;
}

export function filterArrayByQuery<T>(
  items: T[],
  query: string,
  extractFields: (item: T) => Array<string | undefined | null>
): T[] {
  if (!query.trim()) return items;
  return items.filter(item => matchesBilingualQuery(query, extractFields(item)));
}

function normalizeCatToken(val: string): string {
  return (val || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function expandCategoryTokens(values: Array<string | undefined | null>): string[] {
  const tokens = new Set<string>();
  for (const raw of values) {
    if (!raw) continue;
    const lower = raw.trim().toLowerCase();
    const norm = normalizeCatToken(lower);
    if (lower) tokens.add(lower);
    if (norm) tokens.add(norm);
    const alias = CATEGORY_ALIASES[lower] || CATEGORY_ALIASES[norm];
    if (alias) {
      tokens.add(alias);
      tokens.add(normalizeCatToken(alias));
    }
    for (const [k, v] of Object.entries(CATEGORY_ALIASES)) {
      if (v === lower || normalizeCatToken(v) === norm) {
        tokens.add(k);
        tokens.add(normalizeCatToken(k));
      }
    }
  }
  return Array.from(tokens);
}

let cachedIndex: GlobalSearchIndex | null = null;

/**
 * Build or return a memoized search index across all 5 published datasets.
 */
export function buildGlobalSearchIndex(dataset: SearchDatasetInput): GlobalSearchIndex {
  const publishedDivisions = dataset.divisions.filter(d => d.is_published !== false);
  const publishedDistricts = dataset.districts.filter(d => d.is_published !== false);
  const publishedCategories = dataset.categories.filter(c => c.is_published === true);
  const publishedSpots = dataset.spots.filter(s => s.is_published === true);
  const publishedArticles = dataset.articles.filter(a => a.is_published === true && a.status !== 'draft');

  const signature = [
    publishedDivisions.map(d => `${d.id}:${d.updated_at || ''}`).join(','),
    publishedDistricts.map(d => `${d.id}:${d.updated_at || ''}`).join(','),
    publishedCategories.map(c => `${c.id}:${c.updated_at || ''}`).join(','),
    publishedSpots.map(s => `${s.id}:${s.updated_at || ''}`).join(','),
    publishedArticles.map(a => `${a.id}:${a.updated_at || ''}`).join(',')
  ].join('|');

  if (cachedIndex && cachedIndex.signature === signature) {
    return cachedIndex;
  }

  const divisionsMap = new Map<string, Division>();
  for (const div of publishedDivisions) {
    divisionsMap.set(div.id.toLowerCase(), div);
    if (div.slug) divisionsMap.set(div.slug.toLowerCase(), div);
  }

  const districtsMap = new Map<string, District>();
  for (const dist of publishedDistricts) {
    districtsMap.set(dist.id.toLowerCase(), dist);
    if (dist.slug) districtsMap.set(dist.slug.toLowerCase(), dist);
  }

  const categoriesMap = new Map<string, Category>();
  for (const cat of publishedCategories) {
    for (const tok of expandCategoryTokens([cat.id, cat.slug])) {
      categoriesMap.set(tok, cat);
    }
  }

  const divisionHasCategory = new Map<string, Set<string>>();
  const districtHasCategory = new Map<string, Set<string>>();

  for (const spot of publishedSpots) {
    const spotCatTokens = expandCategoryTokens(spot.category_ids || []);
    const divKey = (spot.division_id || '').trim().toLowerCase();
    const distKey = (spot.district_id || '').trim().toLowerCase();

    if (divKey) {
      const divObj = divisionsMap.get(divKey);
      const canonicalDivKeys = [divKey, divObj?.id.toLowerCase(), divObj?.slug?.toLowerCase()].filter(
        Boolean
      ) as string[];
      for (const dk of canonicalDivKeys) {
        if (!divisionHasCategory.has(dk)) divisionHasCategory.set(dk, new Set<string>());
        const set = divisionHasCategory.get(dk)!;
        spotCatTokens.forEach(t => set.add(t));
      }
    }

    if (distKey) {
      const distObj = districtsMap.get(distKey);
      const canonicalDistKeys = [distKey, distObj?.id.toLowerCase(), distObj?.slug?.toLowerCase()].filter(
        Boolean
      ) as string[];
      for (const dk of canonicalDistKeys) {
        if (!districtHasCategory.has(dk)) districtHasCategory.set(dk, new Set<string>());
        const set = districtHasCategory.get(dk)!;
        spotCatTokens.forEach(t => set.add(t));
      }
    }
  }

  const entries: SearchIndexEntry[] = [];

  // 1. Divisions
  for (const div of publishedDivisions) {
    const slug = (div.slug || div.id).toLowerCase();
    const normTitle = normalizeSearchTerm(`${div.name_bn} ${div.name_en} ${div.slug || ''}`);
    const normLocation = normalizeSearchTerm(`${div.headquarters_bn || ''} ${div.headquarters_en || ''} বিভাগ division`);
    const normKeywords = normalizeSearchTerm(`${div.name_bn} বিভাগ ${div.name_en} division`);
    const normBody = normalizeSearchTerm(`${div.description_bn || ''} ${div.description_en || ''}`);
    const normAll = `${normTitle} ${normLocation} ${normKeywords} ${normBody}`.trim();

    entries.push({
      uid: `division:${div.id}`,
      id: div.id,
      slug,
      type: 'division',
      titleBn: div.name_bn,
      titleEn: div.name_en,
      shortDescBn: div.description_bn || '',
      shortDescEn: div.description_en || '',
      imageUrl: div.image_url || div.thumbnail_url,
      divisionId: div.id,
      divisionNameBn: div.name_bn,
      divisionNameEn: div.name_en,
      categoryTokens: Array.from(divisionHasCategory.get(div.id.toLowerCase()) || []),
      detailUrl: `/divisions/${encodeURIComponent(slug)}/`,
      normTitle,
      normTitleFolded: foldPunctuation(normTitle),
      normLocation,
      normKeywords,
      normBody,
      normAll,
      normAllFolded: foldPunctuation(normAll)
    });
  }

  // 2. Districts
  for (const dist of publishedDistricts) {
    const slug = (dist.slug || dist.id).toLowerCase();
    const divObj = divisionsMap.get((dist.division_id || '').toLowerCase());
    const normTitle = normalizeSearchTerm(`${dist.name_bn} ${dist.name_en} ${dist.slug || ''}`);
    const normLocation = normalizeSearchTerm(
      `${divObj?.name_bn || ''} ${divObj?.name_en || ''} জেলা district`
    );
    const normKeywords = normalizeSearchTerm(`${dist.famous_for_bn || ''} ${dist.famous_for_en || ''}`);
    const normBody = normalizeSearchTerm(`${dist.description_bn || ''} ${dist.description_en || ''}`);
    const normAll = `${normTitle} ${normLocation} ${normKeywords} ${normBody}`.trim();

    entries.push({
      uid: `district:${dist.id}`,
      id: dist.id,
      slug,
      type: 'district',
      titleBn: dist.name_bn,
      titleEn: dist.name_en,
      shortDescBn: dist.description_bn || dist.famous_for_bn || '',
      shortDescEn: dist.description_en || dist.famous_for_en || '',
      imageUrl: dist.image_url,
      divisionId: divObj?.id || dist.division_id,
      divisionNameBn: divObj?.name_bn,
      divisionNameEn: divObj?.name_en,
      districtId: dist.id,
      districtNameBn: dist.name_bn,
      districtNameEn: dist.name_en,
      categoryTokens: Array.from(districtHasCategory.get(dist.id.toLowerCase()) || []),
      detailUrl: `/districts/${encodeURIComponent(slug)}/`,
      normTitle,
      normTitleFolded: foldPunctuation(normTitle),
      normLocation,
      normKeywords,
      normBody,
      normAll,
      normAllFolded: foldPunctuation(normAll)
    });
  }

  // 3. Tourist Spots
  for (const spot of publishedSpots) {
    const slug = (spot.slug || spot.id).toLowerCase();
    const divObj = divisionsMap.get((spot.division_id || '').toLowerCase());
    const distObj = districtsMap.get((spot.district_id || '').toLowerCase());
    const catObjs = (spot.category_ids || [])
      .map(cid => categoriesMap.get(normalizeCatToken(cid)) || categoriesMap.get(cid.toLowerCase()))
      .filter(Boolean) as Category[];
    const catNames = catObjs.map(c => `${c.name_bn} ${c.name_en}`).join(' ');

    const normTitle = normalizeSearchTerm(`${spot.name_bn} ${spot.name_en} ${spot.slug || ''}`);
    const normLocation = normalizeSearchTerm(
      `${distObj?.name_bn || ''} ${distObj?.name_en || ''} ${divObj?.name_bn || ''} ${divObj?.name_en || ''}`
    );
    const normKeywords = normalizeSearchTerm(
      `${catNames} ${(spot.category_ids || []).join(' ')} ${spot.best_time_bn || ''} ${spot.best_time_en || ''}`
    );
    const normBody = normalizeSearchTerm(
      `${spot.short_desc_bn || ''} ${spot.short_desc_en || ''} ${spot.overview_bn || ''} ${spot.overview_en || ''}`
    );
    const normAll = `${normTitle} ${normLocation} ${normKeywords} ${normBody}`.trim();

    entries.push({
      uid: `spot:${spot.id}`,
      id: spot.id,
      slug,
      type: 'spot',
      titleBn: spot.name_bn,
      titleEn: spot.name_en,
      shortDescBn: spot.short_desc_bn || spot.overview_bn || '',
      shortDescEn: spot.short_desc_en || spot.overview_en || '',
      imageUrl: spot.image_url,
      divisionId: divObj?.id || spot.division_id,
      divisionNameBn: divObj?.name_bn,
      divisionNameEn: divObj?.name_en,
      districtId: distObj?.id || spot.district_id,
      districtNameBn: distObj?.name_bn,
      districtNameEn: distObj?.name_en,
      categoryTokens: expandCategoryTokens(spot.category_ids || []),
      detailUrl: `/places/${encodeURIComponent(slug)}/`,
      normTitle,
      normTitleFolded: foldPunctuation(normTitle),
      normLocation,
      normKeywords,
      normBody,
      normAll,
      normAllFolded: foldPunctuation(normAll)
    });
  }

  // 4. Travel Guides (Articles)
  for (const art of publishedArticles) {
    const slug = (art.slug || art.id).toLowerCase();
    const distObj = art.related_district_id
      ? districtsMap.get(art.related_district_id.toLowerCase())
      : undefined;
    const divObj = distObj ? divisionsMap.get((distObj.division_id || '').toLowerCase()) : undefined;
    const relatedSpot = art.related_spot_id
      ? publishedSpots.find(
          s =>
            s.id.toLowerCase() === art.related_spot_id!.toLowerCase() ||
            (!!s.slug && s.slug.toLowerCase() === art.related_spot_id!.toLowerCase())
        )
      : undefined;
    const artCatDef = art.category_id
      ? ARTICLE_CATEGORIES.find(c => c.id === art.category_id)
      : undefined;

    const inheritedSpotCats = relatedSpot ? expandCategoryTokens(relatedSpot.category_ids || []) : [];
    const guideCatTokens = expandCategoryTokens([
      ...(art.tags || []),
      art.category_id || '',
      ...inheritedSpotCats
    ]);

    const normTitle = normalizeSearchTerm(`${art.title_bn} ${art.title_en} ${art.slug || ''}`);
    const normLocation = normalizeSearchTerm(
      `${distObj?.name_bn || ''} ${distObj?.name_en || ''} ${divObj?.name_bn || ''} ${divObj?.name_en || ''}`
    );
    const normKeywords = normalizeSearchTerm(
      `${(art.tags || []).join(' ')} ${artCatDef?.name_bn || ''} ${artCatDef?.name_en || ''} ${art.author_bn || ''} ${art.author_en || ''}`
    );
    const normBody = normalizeSearchTerm(`${art.excerpt_bn || ''} ${art.excerpt_en || ''}`);
    const normAll = `${normTitle} ${normLocation} ${normKeywords} ${normBody}`.trim();

    entries.push({
      uid: `guide:${art.id}`,
      id: art.id,
      slug,
      type: 'guide',
      titleBn: art.title_bn,
      titleEn: art.title_en,
      shortDescBn: art.excerpt_bn || '',
      shortDescEn: art.excerpt_en || '',
      imageUrl: art.image_url,
      divisionId: divObj?.id,
      divisionNameBn: divObj?.name_bn,
      divisionNameEn: divObj?.name_en,
      districtId: distObj?.id,
      districtNameBn: distObj?.name_bn,
      districtNameEn: distObj?.name_en,
      categoryTokens: guideCatTokens,
      detailUrl: `/travel-guides/${encodeURIComponent(slug)}/`,
      publishedAt: art.published_at,
      normTitle,
      normTitleFolded: foldPunctuation(normTitle),
      normLocation,
      normKeywords,
      normBody,
      normAll,
      normAllFolded: foldPunctuation(normAll)
    });
  }

  // 5. Categories
  for (const cat of publishedCategories) {
    const slug = (cat.slug || cat.id).toLowerCase();
    const catTokens = expandCategoryTokens([cat.id, cat.slug]);
    const normTitle = normalizeSearchTerm(`${cat.name_bn} ${cat.name_en} ${cat.slug || ''}`);
    const normLocation = 'ক্যাটাগরি category';
    const normKeywords = normalizeSearchTerm(`${cat.name_bn} ${cat.name_en} ${cat.id}`);
    const normBody = normalizeSearchTerm(`${cat.description_bn || ''} ${cat.description_en || ''}`);
    const normAll = `${normTitle} ${normLocation} ${normKeywords} ${normBody}`.trim();

    entries.push({
      uid: `category:${cat.id}`,
      id: cat.id,
      slug,
      type: 'category',
      titleBn: cat.name_bn,
      titleEn: cat.name_en,
      shortDescBn: cat.description_bn || '',
      shortDescEn: cat.description_en || '',
      imageUrl: cat.image_url,
      icon: cat.icon,
      categoryTokens: catTokens,
      detailUrl: `/categories/${encodeURIComponent(slug)}/`,
      normTitle,
      normTitleFolded: foldPunctuation(normTitle),
      normLocation,
      normKeywords,
      normBody,
      normAll,
      normAllFolded: foldPunctuation(normAll)
    });
  }

  cachedIndex = {
    signature,
    entries,
    divisionsMap,
    districtsMap,
    categoriesMap,
    divisionHasCategory,
    districtHasCategory
  };

  return cachedIndex;
}

function matchesDivisionFilter(
  entry: SearchIndexEntry,
  divisionFilter: string,
  index: GlobalSearchIndex
): boolean {
  if (!divisionFilter || divisionFilter === 'all') return true;
  const target = divisionFilter.trim().toLowerCase();
  const divObj = index.divisionsMap.get(target);
  const candidateKeys = new Set<string>([
    target,
    ...(divObj ? [divObj.id.toLowerCase(), (divObj.slug || '').toLowerCase()] : [])
  ]);

  if (entry.type === 'category') {
    // Include category if at least one published spot in the chosen division uses this category
    for (const dk of candidateKeys) {
      const catSet = index.divisionHasCategory.get(dk);
      if (catSet && entry.categoryTokens.some(tok => catSet.has(tok))) {
        return true;
      }
    }
    return false;
  }

  const entryDiv = (entry.divisionId || '').trim().toLowerCase();
  if (entryDiv && candidateKeys.has(entryDiv)) return true;

  if (entry.type === 'guide' && divObj) {
    // Allow guides explicitly referencing the division in title/keywords when not tied to one district
    return (
      entry.normTitle.includes(divObj.name_en.toLowerCase()) ||
      entry.normTitle.includes(divObj.name_bn.toLowerCase()) ||
      entry.normKeywords.includes(divObj.name_en.toLowerCase()) ||
      entry.normKeywords.includes(divObj.name_bn.toLowerCase())
    );
  }

  return false;
}

function matchesCategoryFilter(
  entry: SearchIndexEntry,
  categoryFilter: string,
  index: GlobalSearchIndex
): boolean {
  if (!categoryFilter || categoryFilter === 'all') return true;
  const target = categoryFilter.trim().toLowerCase();
  const catObj = index.categoriesMap.get(target) || index.categoriesMap.get(normalizeCatToken(target));
  const filterTokens = expandCategoryTokens([target, catObj?.id, catObj?.slug]);

  if (entry.categoryTokens.some(tok => filterTokens.includes(tok))) {
    return true;
  }

  if (entry.type === 'guide' && catObj) {
    return (
      entry.normAll.includes(catObj.name_en.toLowerCase()) ||
      entry.normAll.includes(catObj.name_bn.toLowerCase())
    );
  }

  return false;
}

/**
 * Score an entry against a normalized query & tokens.
 * Returns 0 when the entry does not match.
 */
function scoreEntryForQuery(entry: SearchIndexEntry, rawQuery: string, lang: Language): number {
  const normQ = normalizeSearchTerm(rawQuery);
  const foldedQ = foldPunctuation(rawQuery);

  // When query is empty (browsing with filters), assign deterministic baseline priority
  if (!normQ) {
    const typeBasePriority: Record<SearchResultType, number> = {
      spot: 50,
      district: 40,
      division: 35,
      guide: 30,
      category: 25
    };
    return typeBasePriority[entry.type];
  }

  const primaryTitle = normalizeSearchTerm(lang === 'bn' ? entry.titleBn : entry.titleEn);
  const secondaryTitle = normalizeSearchTerm(lang === 'bn' ? entry.titleEn : entry.titleBn);
  const primaryFolded = foldPunctuation(primaryTitle);
  const secondaryFolded = foldPunctuation(secondaryTitle);

  let score = 0;

  // Exact full title match
  if (primaryTitle === normQ || secondaryTitle === normQ || (foldedQ && (primaryFolded === foldedQ || secondaryFolded === foldedQ))) {
    score += 140;
  } else if (
    primaryTitle.startsWith(normQ) ||
    secondaryTitle.startsWith(normQ) ||
    (foldedQ && (primaryFolded.startsWith(foldedQ) || secondaryFolded.startsWith(foldedQ)))
  ) {
    score += 95;
  } else if (
    entry.normTitle.includes(normQ) ||
    (foldedQ && entry.normTitleFolded.includes(foldedQ))
  ) {
    score += 65;
  }

  if (entry.normLocation.includes(normQ)) {
    score += 32;
  }

  if (entry.normKeywords.includes(normQ)) {
    score += 28;
  }

  if (entry.normBody.includes(normQ)) {
    score += 15;
  }

  // Multi-word / token matching when full phrase wasn't an exact contiguous hit
  if (score === 0) {
    const words = foldPunctuation(rawQuery).split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      const allWordsMatched = words.every(
        w => entry.normAll.includes(w) || entry.normAllFolded.includes(w)
      );
      if (!allWordsMatched) return 0;

      for (const w of words) {
        if (entry.normTitle.includes(w) || entry.normTitleFolded.includes(w)) {
          score += 30;
        } else if (entry.normLocation.includes(w) || entry.normKeywords.includes(w)) {
          score += 18;
        } else {
          score += 10;
        }
      }
    }
  }

  if (score === 0) return 0;

  // Subtle deterministic boost for spots/divisions/districts on tie
  const typeTieBonus: Record<SearchResultType, number> = {
    spot: 5,
    division: 4,
    district: 3,
    guide: 2,
    category: 1
  };
  return score + typeTieBonus[entry.type];
}

/**
 * Execute an indexed search across Divisions, Districts, Tourist Spots, Travel Guides, and Categories.
 */
export function executeIndexedGlobalSearch(
  index: GlobalSearchIndex,
  params: SearchQueryParams
): GlobalSearchExecutionResult {
  const typeCounts: Record<SearchTypeFilter, number> = {
    all: 0,
    spot: 0,
    district: 0,
    division: 0,
    guide: 0,
    category: 0
  };

  const preTypeMatched: ScoredSearchResult[] = [];

  for (const entry of index.entries) {
    if (!matchesDivisionFilter(entry, params.divisionFilter, index)) continue;
    if (!matchesCategoryFilter(entry, params.categoryFilter, index)) continue;

    const score = scoreEntryForQuery(entry, params.query, params.lang);
    if (score <= 0) continue;

    typeCounts.all += 1;
    typeCounts[entry.type] += 1;
    preTypeMatched.push({ entry, score });
  }

  const filteredByType =
    params.typeFilter && params.typeFilter !== 'all'
      ? preTypeMatched.filter(r => r.entry.type === params.typeFilter)
      : preTypeMatched;

  filteredByType.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const titleA = params.lang === 'bn' ? a.entry.titleBn : a.entry.titleEn;
    const titleB = params.lang === 'bn' ? b.entry.titleBn : b.entry.titleEn;
    return titleA.localeCompare(titleB);
  });

  return {
    items: filteredByType,
    typeCounts,
    totalIndexed: index.entries.length
  };
}

/**
 * Get fast live search suggestions from the cached index (0 Firestore reads).
 */
export function getSearchSuggestions(
  index: GlobalSearchIndex,
  rawQuery: string,
  lang: Language,
  limit: number = 7
): SearchIndexEntry[] {
  const normQ = normalizeSearchTerm(rawQuery);
  if (!normQ) {
    // Suggest a balanced curated set of popular indexed published entries
    const popularSpots = index.entries.filter(e => e.type === 'spot').slice(0, 3);
    const popularDistricts = index.entries.filter(e => e.type === 'district').slice(0, 2);
    const popularGuides = index.entries.filter(e => e.type === 'guide').slice(0, 1);
    const popularCats = index.entries.filter(e => e.type === 'category').slice(0, 1);
    return [...popularSpots, ...popularDistricts, ...popularGuides, ...popularCats].slice(0, limit);
  }

  const scored: ScoredSearchResult[] = [];
  for (const entry of index.entries) {
    const score = scoreEntryForQuery(entry, normQ, lang);
    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.entry);
}
