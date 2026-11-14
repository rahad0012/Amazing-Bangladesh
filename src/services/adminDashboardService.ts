/**
 * Admin Dashboard Firestore Data & Settings Service
 * Fetches live statistics, recent content updates, recently added tourist spots,
 * audit activity logs, SEO settings, and Website settings directly from Firestore.
 * Never fabricates statistics or trusts client-side role flags.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  type Article,
  type Category,
  type District,
  type Division,
  type MediaItem,
  type TouristSpot
} from '../data/bangladeshData';
import { COLLECTIONS, normalizeFirestoreDivisions } from './firestoreService';
import { normalizeLegalPagesConfig, type LegalPagesConfig } from './legalPagesDefaults';
import { isVerifiedAdminActive, getVerifiedAdminSession } from './adminAuthService';

export interface AdminDashboardStats {
  totalDivisions: number;
  publishedDivisions: number;
  draftDivisions: number;
  totalDistricts: number;
  publishedDistricts: number;
  draftDistricts: number;
  totalCategories: number;
  publishedCategories: number;
  totalSpots: number;
  publishedSpots: number;
  draftSpots: number;
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  scheduledArticles: number;
  totalMedia: number;
}

export type ContentEntityKind = 'division' | 'district' | 'category' | 'spot' | 'article';

export interface RecentContentUpdateItem {
  id: string;
  entityType: ContentEntityKind;
  titleEn: string;
  titleBn: string;
  status: 'published' | 'draft' | 'scheduled';
  timestamp: string;
  targetTab: 'divisions' | 'districts' | 'categories' | 'spots' | 'articles';
}

export interface AdminAuditLogEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'settings_update' | 'login' | 'logout';
  entity_type:
    | 'division'
    | 'district'
    | 'category'
    | 'tourist_spot'
    | 'article'
    | 'media'
    | 'seo_settings'
    | 'website_settings'
    | 'legal_pages'
    | 'auth';
  entity_id: string;
  entity_title: string;
  actor_uid: string;
  actor_email: string;
  details?: string;
  timestamp: string;
}

export interface SeoSettingsConfig {
  id: 'seo_settings';
  default_title_en: string;
  default_title_bn: string;
  title_suffix_en: string;
  title_suffix_bn: string;
  meta_description_en: string;
  meta_description_bn: string;
  canonical_base_url: string;
  og_image_url: string;
  robots_index: 'index, follow' | 'noindex, nofollow';
  twitter_handle: string;
  updated_at: string;
  updated_by?: string;
}

export interface WebsiteSettingsConfig {
  id: 'website_settings';
  site_title_en: string;
  site_title_bn: string;
  hero_heading_en: string;
  hero_heading_bn: string;
  hero_subtitle_en: string;
  hero_subtitle_bn: string;
  contact_email: string;
  tourist_helpline: string;
  default_language: 'bn' | 'en';
  maintenance_mode: boolean;
  updated_at: string;
  updated_by?: string;
}

export const DEFAULT_SEO_SETTINGS: SeoSettingsConfig = {
  id: 'seo_settings',
  default_title_en: 'Beautiful Bangladesh - Official Tourism Portal',
  default_title_bn: 'অপরূপ বাংলাদেশ | Beautiful Bangladesh - অফিসিয়াল পর্যটন পোর্টাল',
  title_suffix_en: 'Beautiful Bangladesh',
  title_suffix_bn: 'অপরূপ বাংলাদেশ',
  meta_description_en:
    "Discover Bangladesh's 8 administrative divisions, 64 districts, natural wonders, UNESCO World Heritage sites, and curated travel itineraries in Bengali and English.",
  meta_description_bn:
    'বাংলাদেশের ৮টি বিভাগ, ৬৪টি জেলা, প্রাকৃতিক বিস্ময়, ইউনেস্কো বিশ্ব ঐতিহ্য এবং নির্ভরযোগ্য ভ্রমণ নির্দেশিকা জানুন বাংলা ও ইংরেজিতে।',
  canonical_base_url: 'https://bangladesh-tourism.netlify.app',
  og_image_url:
    'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1200&q=80',
  robots_index: 'index, follow',
  twitter_handle: '@BeautifulBD',
  updated_at: ''
};

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettingsConfig = {
  id: 'website_settings',
  site_title_en: 'Beautiful Bangladesh',
  site_title_bn: 'অপরূপ বাংলাদেশ',
  hero_heading_en: 'Discover the Untold Beauty of Bangladesh',
  hero_heading_bn: 'আবিষ্কার করুন অপরূপ বাংলার অদেখা সৌন্দর্য',
  hero_subtitle_en: 'Official Bilingual Guide to 8 Divisions, 64 Districts & Heritage Landmarks',
  hero_subtitle_bn: '৮ বিভাগ, ৬৪ জেলা এবং ঐতিহ্যবাহী দর্শনীয় স্থানের নির্ভরযোগ্য দ্বিভাষিক পোর্টাল',
  contact_email: 'info@tourism.gov.bd',
  tourist_helpline: '+880 1320-163599',
  default_language: 'bn',
  maintenance_mode: false,
  updated_at: ''
};

export interface AdminDashboardSnapshot {
  stats: AdminDashboardStats;
  divisions: Division[];
  districts: District[];
  categories: Category[];
  spots: TouristSpot[];
  articles: Article[];
  media: MediaItem[];
  recentSpots: TouristSpot[];
  recentUpdates: RecentContentUpdateItem[];
  recentActivity: AdminAuditLogEntry[];
  auditLogStatus: 'available' | 'rules_pending' | 'error';
  seoSettings: SeoSettingsConfig;
  websiteSettings: WebsiteSettingsConfig;
  legalPages: LegalPagesConfig | null;
  syncedAt: string;
}

export interface AdminDashboardRuntimeState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  errorMessage: string | null;
  lastSyncedAt: string | null;
  stats: AdminDashboardStats | null;
  recentSpots: TouristSpot[];
  recentUpdates: RecentContentUpdateItem[];
  recentActivity: AdminAuditLogEntry[];
  auditLogStatus: 'available' | 'rules_pending' | 'error';
  seoSettings: SeoSettingsConfig;
  websiteSettings: WebsiteSettingsConfig;
  savingSeo: boolean;
  savingWebsite: boolean;
}

export const adminDashboardState: AdminDashboardRuntimeState = {
  status: 'idle',
  errorMessage: null,
  lastSyncedAt: null,
  stats: null,
  recentSpots: [],
  recentUpdates: [],
  recentActivity: [],
  auditLogStatus: 'available',
  seoSettings: { ...DEFAULT_SEO_SETTINGS },
  websiteSettings: { ...DEFAULT_WEBSITE_SETTINGS },
  savingSeo: false,
  savingWebsite: false
};

export function resetAdminDashboardState(): void {
  adminDashboardState.status = 'idle';
  adminDashboardState.errorMessage = null;
  adminDashboardState.lastSyncedAt = null;
  adminDashboardState.stats = null;
  adminDashboardState.recentSpots = [];
  adminDashboardState.recentUpdates = [];
  adminDashboardState.recentActivity = [];
  adminDashboardState.auditLogStatus = 'available';
  adminDashboardState.savingSeo = false;
  adminDashboardState.savingWebsite = false;
}

function parseSortableTime(value?: string): number {
  if (!value || typeof value !== 'string') return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeSeoSettings(raw?: Partial<SeoSettingsConfig> | null): SeoSettingsConfig {
  return {
    ...DEFAULT_SEO_SETTINGS,
    ...(raw || {}),
    id: 'seo_settings',
    robots_index: raw?.robots_index === 'noindex, nofollow' ? 'noindex, nofollow' : 'index, follow'
  };
}

function normalizeWebsiteSettings(raw?: Partial<WebsiteSettingsConfig> | null): WebsiteSettingsConfig {
  return {
    ...DEFAULT_WEBSITE_SETTINGS,
    ...(raw || {}),
    id: 'website_settings',
    default_language: raw?.default_language === 'en' ? 'en' : 'bn',
    maintenance_mode: Boolean(raw?.maintenance_mode)
  };
}

export function buildRecentUpdates(
  divisions: Division[],
  districts: District[],
  categories: Category[],
  spots: TouristSpot[],
  articles: Article[]
): RecentContentUpdateItem[] {
  const updates: RecentContentUpdateItem[] = [];

  for (const div of divisions) {
    const ts = div.updated_at || div.created_at || '';
    if (!ts) continue;
    updates.push({
      id: div.id,
      entityType: 'division',
      titleEn: div.name_en,
      titleBn: div.name_bn,
      status: div.is_published ? 'published' : 'draft',
      timestamp: ts,
      targetTab: 'divisions'
    });
  }

  for (const dist of districts) {
    const ts = dist.updated_at || dist.created_at || '';
    if (!ts) continue;
    updates.push({
      id: dist.id,
      entityType: 'district',
      titleEn: dist.name_en,
      titleBn: dist.name_bn,
      status: dist.is_published ? 'published' : 'draft',
      timestamp: ts,
      targetTab: 'districts'
    });
  }

  for (const cat of categories) {
    const ts = cat.updated_at || cat.created_at || '';
    if (!ts) continue;
    updates.push({
      id: cat.id,
      entityType: 'category',
      titleEn: cat.name_en,
      titleBn: cat.name_bn,
      status: cat.is_published ? 'published' : 'draft',
      timestamp: ts,
      targetTab: 'categories'
    });
  }

  for (const spot of spots) {
    const ts = spot.updated_at || spot.created_at || '';
    if (!ts) continue;
    updates.push({
      id: spot.id,
      entityType: 'spot',
      titleEn: spot.name_en,
      titleBn: spot.name_bn,
      status: spot.is_published ? 'published' : 'draft',
      timestamp: ts,
      targetTab: 'spots'
    });
  }

  for (const art of articles) {
    const ts = art.updated_at || art.published_at || art.created_at || '';
    if (!ts) continue;
    const status: 'published' | 'draft' | 'scheduled' =
      art.status === 'scheduled'
        ? 'scheduled'
        : art.is_published && art.status !== 'draft'
          ? 'published'
          : 'draft';
    updates.push({
      id: art.id,
      entityType: 'article',
      titleEn: art.title_en,
      titleBn: art.title_bn,
      status,
      timestamp: ts,
      targetTab: 'articles'
    });
  }

  return updates
    .sort((a, b) => parseSortableTime(b.timestamp) - parseSortableTime(a.timestamp))
    .slice(0, 8);
}

export function buildRecentSpots(spots: TouristSpot[]): TouristSpot[] {
  return [...spots]
    .sort((a, b) => {
      const timeA = parseSortableTime(a.created_at || a.updated_at);
      const timeB = parseSortableTime(b.created_at || b.updated_at);
      if (timeB !== timeA) return timeB - timeA;
      return (a.name_en || '').localeCompare(b.name_en || '');
    })
    .slice(0, 6);
}

async function fetchAllCollectionDocs<T>(collectionName: string): Promise<T[]> {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const docs: T[] = [];
    snapshot.forEach(docSnap => {
      docs.push({ id: docSnap.id, ...docSnap.data() } as T);
    });
    return docs;
  } catch (error: any) {
    if (
      error?.code === 'permission-denied' ||
      (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
    ) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
    throw error;
  }
}

export function computeDashboardStatsFromCollections(params: {
  divisions: Division[];
  districts: District[];
  categories: Category[];
  spots: TouristSpot[];
  articles: Article[];
  media: MediaItem[];
}): AdminDashboardStats {
  const { divisions, districts, categories, spots, articles, media } = params;

  const publishedDivisions = divisions.filter(d => d.is_published === true).length;
  const publishedDistricts = districts.filter(d => d.is_published === true).length;
  const publishedCategories = categories.filter(c => c.is_published === true).length;
  const publishedSpots = spots.filter(s => s.is_published === true).length;
  const draftSpots = spots.length - publishedSpots;

  const publishedArticles = articles.filter(a => a.is_published === true && a.status !== 'draft').length;
  const scheduledArticles = articles.filter(a => a.status === 'scheduled' && a.is_published !== true).length;
  const draftArticles = Math.max(0, articles.length - publishedArticles - scheduledArticles);

  return {
    totalDivisions: divisions.length,
    publishedDivisions,
    draftDivisions: divisions.length - publishedDivisions,
    totalDistricts: districts.length,
    publishedDistricts,
    draftDistricts: districts.length - publishedDistricts,
    totalCategories: categories.length,
    publishedCategories,
    totalSpots: spots.length,
    publishedSpots,
    draftSpots,
    totalArticles: articles.length,
    publishedArticles,
    draftArticles,
    scheduledArticles,
    totalMedia: media.length
  };
}

export async function fetchAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  if (!isVerifiedAdminActive()) {
    throw new Error('ADMIN_UNAUTHORIZED');
  }

  const [rawDivisions, rawDistricts, categories, spots, articles, media] = await Promise.all([
    fetchAllCollectionDocs<Division>(COLLECTIONS.DIVISIONS),
    fetchAllCollectionDocs<District>(COLLECTIONS.DISTRICTS),
    fetchAllCollectionDocs<Category>(COLLECTIONS.CATEGORIES),
    fetchAllCollectionDocs<TouristSpot>(COLLECTIONS.TOURIST_SPOTS),
    fetchAllCollectionDocs<Article>(COLLECTIONS.ARTICLES),
    fetchAllCollectionDocs<MediaItem>('media')
  ]);

  const divisions = rawDivisions.length > 0 ? normalizeFirestoreDivisions(rawDivisions) : [];
  const districts = rawDistricts;

  const [seoDoc, websiteDoc, legalDoc] = await Promise.all([
    getDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'seo_settings')).catch(() => null),
    getDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'website_settings')).catch(() => null),
    getDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'legal_pages')).catch(() => null)
  ]);

  let recentActivity: AdminAuditLogEntry[] = [];
  let auditLogStatus: 'available' | 'rules_pending' | 'error' = 'available';
  try {
    const auditQuery = query(
      collection(db, 'admin_audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(12)
    );
    const auditSnap = await getDocs(auditQuery);
    auditSnap.forEach(docSnap => {
      recentActivity.push({ id: docSnap.id, ...docSnap.data() } as AdminAuditLogEntry);
    });
  } catch (err: any) {
    if (
      err?.code === 'permission-denied' ||
      (err instanceof Error && err.message.includes('Missing or insufficient permissions'))
    ) {
      auditLogStatus = 'rules_pending';
    } else {
      auditLogStatus = 'error';
    }
  }

  const stats = computeDashboardStatsFromCollections({
    divisions,
    districts,
    categories,
    spots,
    articles,
    media
  });

  const seoSettings = normalizeSeoSettings(
    seoDoc && seoDoc.exists() ? (seoDoc.data() as Partial<SeoSettingsConfig>) : null
  );
  const websiteSettings = normalizeWebsiteSettings(
    websiteDoc && websiteDoc.exists() ? (websiteDoc.data() as Partial<WebsiteSettingsConfig>) : null
  );
  const legalPages =
    legalDoc && legalDoc.exists()
      ? normalizeLegalPagesConfig(legalDoc.data() as Partial<LegalPagesConfig>)
      : null;

  return {
    stats,
    divisions,
    districts,
    categories,
    spots,
    articles,
    media,
    recentSpots: buildRecentSpots(spots),
    recentUpdates: buildRecentUpdates(divisions, districts, categories, spots, articles),
    recentActivity,
    auditLogStatus,
    seoSettings,
    websiteSettings,
    legalPages,
    syncedAt: new Date().toISOString()
  };
}

export async function recordAdminAuditLog(params: {
  action: AdminAuditLogEntry['action'];
  entityType: AdminAuditLogEntry['entity_type'];
  entityId: string;
  entityTitle: string;
  details?: string;
}): Promise<void> {
  if (!isVerifiedAdminActive()) return;
  const user = auth.currentUser;
  const session = getVerifiedAdminSession();
  const actorUid = user?.uid || session?.uid;
  const actorEmail = (user?.email || session?.email || 'admin').slice(0, 160);
  if (!actorUid) return;

  const logId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entry: AdminAuditLogEntry = {
    id: logId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: (params.entityId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128) || 'unknown',
    entity_title: (params.entityTitle || 'Untitled').slice(0, 300),
    actor_uid: actorUid,
    actor_email: actorEmail,
    details: params.details ? params.details.slice(0, 500) : undefined,
    timestamp: new Date().toISOString()
  };

  const payload: Record<string, string> = {
    id: entry.id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    entity_title: entry.entity_title,
    actor_uid: entry.actor_uid,
    actor_email: entry.actor_email,
    timestamp: entry.timestamp
  };
  if (entry.details) {
    payload.details = entry.details;
  }

  adminDashboardState.recentActivity = [entry, ...adminDashboardState.recentActivity].slice(0, 12);

  try {
    await setDoc(doc(db, 'admin_audit_logs', logId), payload);
    adminDashboardState.auditLogStatus = 'available';
  } catch (err: any) {
    if (
      err?.code === 'permission-denied' ||
      (err instanceof Error && err.message.includes('Missing or insufficient permissions'))
    ) {
      adminDashboardState.auditLogStatus = 'rules_pending';
    }
  }
}

export async function saveSeoSettings(
  config: Omit<SeoSettingsConfig, 'id' | 'updated_at' | 'updated_by'>
): Promise<SeoSettingsConfig> {
  if (!isVerifiedAdminActive()) {
    throw new Error('ADMIN_UNAUTHORIZED');
  }
  const session = getVerifiedAdminSession();
  const normalized = normalizeSeoSettings({
    ...config,
    updated_at: new Date().toISOString(),
    updated_by: session?.email || auth.currentUser?.email || ''
  });

  try {
    await setDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'seo_settings'), normalized, { merge: true });
  } catch (error: any) {
    if (
      error?.code === 'permission-denied' ||
      (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
    ) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SITE_SETTINGS}/seo_settings`);
    }
    throw error;
  }

  adminDashboardState.seoSettings = normalized;
  await recordAdminAuditLog({
    action: 'settings_update',
    entityType: 'seo_settings',
    entityId: 'seo_settings',
    entityTitle: 'Global SEO Settings',
    details: `Robots: ${normalized.robots_index}`
  });

  return normalized;
}

export async function saveWebsiteSettings(
  config: Omit<WebsiteSettingsConfig, 'id' | 'updated_at' | 'updated_by'>
): Promise<WebsiteSettingsConfig> {
  if (!isVerifiedAdminActive()) {
    throw new Error('ADMIN_UNAUTHORIZED');
  }
  const session = getVerifiedAdminSession();
  const normalized = normalizeWebsiteSettings({
    ...config,
    updated_at: new Date().toISOString(),
    updated_by: session?.email || auth.currentUser?.email || ''
  });

  try {
    await setDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'website_settings'), normalized, { merge: true });
  } catch (error: any) {
    if (
      error?.code === 'permission-denied' ||
      (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
    ) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SITE_SETTINGS}/website_settings`);
    }
    throw error;
  }

  adminDashboardState.websiteSettings = normalized;
  await recordAdminAuditLog({
    action: 'settings_update',
    entityType: 'website_settings',
    entityId: 'website_settings',
    entityTitle: 'Website Settings',
    details: `Default lang: ${normalized.default_language}, Maintenance: ${normalized.maintenance_mode ? 'On' : 'Off'}`
  });

  return normalized;
}
