/**
 * Articles / Travel Guides Collection Service (articles)
 * Full CRUD, category/status/destination filtering, cursor pagination, slug lookup, and bilingual localization.
 */

import { collection, getDocs, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import type { Article } from '../data/bangladeshData';
import type { Language } from '../utils/langUtils';
import {
  COLLECTIONS,
  OperationType,
  createCollectionDoc,
  deleteCollectionDoc,
  getCollectionDocById,
  getLocalizedField,
  handleFirestoreError,
  isPermissionDeniedError,
  listCollectionDocs,
  queryCollectionPaginated,
  updateCollectionDoc,
  upsertCollectionDoc,
  type PaginatedQueryResult,
  type WhereFilterClause
} from './firestoreBase';

export interface LocalizedArticle extends Article {
  localized_title: string;
  localized_excerpt: string;
  localized_content: string;
  localized_author: string;
  localized_read_time: string;
}

export interface ArticlesQueryOptions {
  categoryId?: string;
  status?: 'published' | 'draft' | 'scheduled';
  relatedDistrictId?: string;
  relatedSpotId?: string;
  publishedOnly?: boolean;
  searchQuery?: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}

export function normalizePublishedArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  const published = articles.filter(a => {
    if (a.is_published !== true || a.status === 'draft') return false;
    const key = (a.id || a.slug || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return published.sort((a, b) => {
    const timeA = a.published_at ? Date.parse(a.published_at) : NaN;
    const timeB = b.published_at ? Date.parse(b.published_at) : NaN;
    const validA = !Number.isNaN(timeA);
    const validB = !Number.isNaN(timeB);
    if (validA && validB && timeB !== timeA) return timeB - timeA;
    if (validA && !validB) return -1;
    if (!validA && validB) return 1;
    return (a.title_en || a.title_bn || '').localeCompare(b.title_en || b.title_bn || '');
  });
}

export function localizeArticle(article: Article, lang: Language): LocalizedArticle {
  return {
    ...article,
    localized_title: getLocalizedField(article, 'title', lang),
    localized_excerpt: getLocalizedField(article, 'excerpt', lang),
    localized_content: getLocalizedField(article, 'content', lang),
    localized_author: getLocalizedField(article, 'author', lang),
    localized_read_time: getLocalizedField(article, 'read_time', lang)
  };
}

export const ArticlesService = {
  async getAll(bypassCache: boolean = false): Promise<Article[]> {
    return listCollectionDocs<Article>(COLLECTIONS.ARTICLES, {
      publishedOnly: false,
      bypassCache
    });
  },

  async getPublished(bypassCache: boolean = false): Promise<Article[]> {
    const raw = await listCollectionDocs<Article>(COLLECTIONS.ARTICLES, {
      publishedOnly: true,
      bypassCache
    });
    return normalizePublishedArticles(raw);
  },

  async getById(id: string): Promise<Article | null> {
    return getCollectionDocById<Article>(COLLECTIONS.ARTICLES, id);
  },

  async getBySlug(slug: string): Promise<Article | null> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) return null;

    try {
      const colRef = collection(db, COLLECTIONS.ARTICLES);
      const q = query(
        colRef,
        where('slug', '==', normalizedSlug),
        where('is_published', '==', true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        for (const docSnap of snapshot.docs) {
          const data = { id: docSnap.id, ...docSnap.data() } as Article;
          if (data.is_published === true && data.status !== 'draft') {
            return data;
          }
        }
      }

      const allPublished = await ArticlesService.getPublished();
      return (
        allPublished.find(
          art =>
            (art.slug && art.slug.trim().toLowerCase() === normalizedSlug) ||
            art.id.trim().toLowerCase() === normalizedSlug
        ) || null
      );
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ARTICLES);
      }
      throw error;
    }
  },

  async queryPaginated(options: ArticlesQueryOptions = {}): Promise<PaginatedQueryResult<Article>> {
    const filters: WhereFilterClause[] = [];
    if (options.publishedOnly !== false) {
      filters.push({ field: 'is_published', op: '==', value: true });
    }
    if (options.categoryId && options.categoryId !== 'all') {
      filters.push({ field: 'category_id', op: '==', value: options.categoryId });
    }
    if (options.status) {
      filters.push({ field: 'status', op: '==', value: options.status });
    }
    if (options.relatedDistrictId) {
      filters.push({ field: 'related_district_id', op: '==', value: options.relatedDistrictId });
    }
    if (options.relatedSpotId) {
      filters.push({ field: 'related_spot_id', op: '==', value: options.relatedSpotId });
    }

    const qText = (options.searchQuery || '').trim().toLowerCase();

    return queryCollectionPaginated<Article>({
      collectionName: COLLECTIONS.ARTICLES,
      filters,
      orderByField: 'published_at',
      orderDirection: 'desc',
      pageSize: options.pageSize ?? 9,
      cursor: options.cursor ?? null,
      clientFilter: qText
        ? (art) =>
            art.title_en.toLowerCase().includes(qText) ||
            art.title_bn.toLowerCase().includes(qText) ||
            (art.excerpt_en || '').toLowerCase().includes(qText) ||
            (art.excerpt_bn || '').toLowerCase().includes(qText) ||
            (art.slug || '').toLowerCase().includes(qText)
        : undefined
    });
  },

  async create(article: Article): Promise<Article> {
    return createCollectionDoc<Article>(COLLECTIONS.ARTICLES, article);
  },

  async update(id: string, updates: Partial<Article>): Promise<void> {
    await updateCollectionDoc<Article>(COLLECTIONS.ARTICLES, id, updates);
  },

  async save(article: Article): Promise<Article> {
    return upsertCollectionDoc<Article>(COLLECTIONS.ARTICLES, article, true);
  },

  async remove(id: string): Promise<void> {
    await deleteCollectionDoc(COLLECTIONS.ARTICLES, id);
  },

  localize: localizeArticle
};
