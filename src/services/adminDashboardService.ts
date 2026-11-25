/**
 * Admin Dashboard Firestore Data & Settings Service
 * Fetches live statistics, recent content updates, recently added tourist spots,
 * audit activity logs, SEO settings, Website settings, and Admins registry directly from Firestore.
 */

import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import type {
  Article,
  Category,
  District,
  Division,
  MediaItem,
  TouristSpot
} from '../data/bangladeshData';
import { COLLECTIONS } from './firestoreBase';
import { DivisionsService } from './divisionsService';
import { DistrictsService } from './districtsService';
import { CategoriesService } from './categoriesService';
import { TouristSpotsService } from './touristSpotsService';
import { ArticlesService } from './articlesService';
import { AdminsService, type AdminRecord } from './adminsService';
import {
  DEFAULT_ADS_SETTINGS,
  DEFAULT_SEO_SETTINGS,
  DEFAULT_WEBSITE_SETTINGS,
  normalizeAdsSettings,
  SiteSettingsService,
  type AdsSettingsConfig,
  type SeoSettingsConfig,
  type WebsiteSettingsConfig
} from './siteSettingsService';
import type { LegalPagesConfig } from './legalPagesDefaults';
import { isVerifiedAdminActive, getVerifiedAdminSession } from './adminAuthService';

export {
  DEFAULT_ADS_SETTINGS,
  DEFAULT_SEO_SETTINGS,
  DEFAULT_WEBSITE_SETTINGS,
  type AdsSettingsConfig,
  type SeoSettingsConfig,
  type WebsiteSettingsConfig
};

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
    | 'admin'
    | 'seo_settings'
    | 'website_settings'
    | 'ads_settings'
    | 'legal_pages'
    | 'auth';
  entity_id: string;
  entity_title: string;
  actor_uid: string;
  actor_email: string;
  details?: string;
  timestamp: string;
}

export interface AdminDashboardSnapshot {
  stats: AdminDashboardStats;
  divisions: Division[];
  districts: District[];
  categories: Category[];
  spots: TouristSpot[];
  articles: Article[];
  media: MediaItem[];
  admins: AdminRecord[];
  recentSpots: TouristSpot[];
  recentUpdates: RecentContentUpdateItem[];
  recentActivity: AdminAuditLogEntry[];
  auditLogStatus: 'available' | 'rules_pending' | 'error';
  seoSettings: SeoSettingsConfig;
  websiteSettings: WebsiteSettingsConfig;
  adsSettings: AdsSettingsConfig;
  legalPages: LegalPagesConfig | null;
  syncedAt: string;
}

export interface AdminDashboardRuntimeState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  errorMessage: string | null;
  lastSyncedAt: string | null;
  stats: AdminDashboardStats | null;
  admins: AdminRecord[];
  recentSpots: TouristSpot[];
  recentUpdates: RecentContentUpdateItem[];
  recentActivity: AdminAuditLogEntry[];
  auditLogStatus: 'available' | 'rules_pending' | 'error';
  seoSettings: SeoSettingsConfig;
  websiteSettings: WebsiteSettingsConfig;
  adsSettings: AdsSettingsConfig;
  savingSeo: boolean;
  savingWebsite: boolean;
  savingAds: boolean;
}

export const adminDashboardState: AdminDashboardRuntimeState = {
  status: 'idle',
  errorMessage: null,
  lastSyncedAt: null,
  stats: null,
  admins: [],
  recentSpots: [],
  recentUpdates: [],
  recentActivity: [],
  auditLogStatus: 'available',
  seoSettings: { ...DEFAULT_SEO_SETTINGS },
  websiteSettings: { ...DEFAULT_WEBSITE_SETTINGS },
  adsSettings: normalizeAdsSettings(DEFAULT_ADS_SETTINGS),
  savingSeo: false,
  savingWebsite: false,
  savingAds: false
};

export function resetAdminDashboardState(): void {
  adminDashboardState.status = 'idle';
  adminDashboardState.errorMessage = null;
  adminDashboardState.lastSyncedAt = null;
  adminDashboardState.stats = null;
  adminDashboardState.admins = [];
  adminDashboardState.recentSpots = [];
  adminDashboardState.recentUpdates = [];
  adminDashboardState.recentActivity = [];
  adminDashboardState.auditLogStatus = 'available';
  adminDashboardState.savingSeo = false;
  adminDashboardState.savingWebsite = false;
  adminDashboardState.savingAds = false;
}

function parseSortableTime(value?: string): number {
  if (!value || typeof value !== 'string') return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
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

async function fetchAllMediaDocs(): Promise<MediaItem[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.MEDIA));
    const docs: MediaItem[] = [];
    snapshot.forEach(docSnap => {
      docs.push({ id: docSnap.id, ...docSnap.data() } as MediaItem);
    });
    return docs;
  } catch (error: any) {
    if (
      error?.code === 'permission-denied' ||
      (error instanceof Error && error.message.includes('Missing or insufficient permissions'))
    ) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.MEDIA);
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

  const [divisions, districts, categories, spots, articles, media, admins] = await Promise.all([
    DivisionsService.getAll(true),
    DistrictsService.getAll(true),
    CategoriesService.getAll(true),
    TouristSpotsService.getAll(true),
    ArticlesService.getAll(true),
    fetchAllMediaDocs(),
    AdminsService.listAll(true).catch(() => [])
  ]);

  const [seoSettings, websiteSettings, legalPages, adsSettings] = await Promise.all([
    SiteSettingsService.getSeoSettings(true),
    SiteSettingsService.getWebsiteSettings(true),
    SiteSettingsService.getLegalPagesSettings(true),
    SiteSettingsService.getAdsSettings(true)
  ]);

  let recentActivity: AdminAuditLogEntry[] = [];
  let auditLogStatus: 'available' | 'rules_pending' | 'error' = 'available';
  try {
    const auditQuery = query(
      collection(db, COLLECTIONS.ADMIN_AUDIT_LOGS),
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

  return {
    stats,
    divisions,
    districts,
    categories,
    spots,
    articles,
    media,
    admins,
    recentSpots: buildRecentSpots(spots),
    recentUpdates: buildRecentUpdates(divisions, districts, categories, spots, articles),
    recentActivity,
    auditLogStatus,
    seoSettings,
    websiteSettings,
    adsSettings,
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
    await setDoc(doc(db, COLLECTIONS.ADMIN_AUDIT_LOGS, logId), payload);
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
  const saved = await SiteSettingsService.saveSeoSettings({
    ...config,
    updated_by: session?.email || auth.currentUser?.email || ''
  });

  adminDashboardState.seoSettings = saved;
  await recordAdminAuditLog({
    action: 'settings_update',
    entityType: 'seo_settings',
    entityId: 'seo_settings',
    entityTitle: 'Global SEO Settings',
    details: `Robots: ${saved.robots_index}`
  });

  return saved;
}

export async function saveWebsiteSettings(
  config: Omit<WebsiteSettingsConfig, 'id' | 'updated_at' | 'updated_by'>
): Promise<WebsiteSettingsConfig> {
  if (!isVerifiedAdminActive()) {
    throw new Error('ADMIN_UNAUTHORIZED');
  }
  const session = getVerifiedAdminSession();
  const saved = await SiteSettingsService.saveWebsiteSettings({
    ...config,
    updated_by: session?.email || auth.currentUser?.email || ''
  });

  adminDashboardState.websiteSettings = saved;
  await recordAdminAuditLog({
    action: 'settings_update',
    entityType: 'website_settings',
    entityId: 'website_settings',
    entityTitle: 'Website Settings',
    details: `Default lang: ${saved.default_language}, Maintenance: ${saved.maintenance_mode ? 'On' : 'Off'}`
  });

  return saved;
}

export async function saveAdsSettings(
  config: Omit<AdsSettingsConfig, 'id' | 'updated_at' | 'updated_by'>
): Promise<AdsSettingsConfig> {
  if (!isVerifiedAdminActive()) {
    throw new Error('ADMIN_UNAUTHORIZED');
  }
  await auth.currentUser?.getIdToken(true).catch(() => undefined);
  const session = getVerifiedAdminSession();
  const saved = await SiteSettingsService.saveAdsSettings({
    ...config,
    updated_by: session?.email || auth.currentUser?.email || ''
  });

  adminDashboardState.adsSettings = saved;
  const activeSlotsCount = Object.values(saved.slots).filter(s => s.enabled).length;
  await recordAdminAuditLog({
    action: 'settings_update',
    entityType: 'ads_settings',
    entityId: 'ads_settings',
    entityTitle: 'Advertisement Control Settings',
    details: `Master: ${saved.ads_enabled ? 'ON' : 'OFF'}, AdSense: ${saved.adsense_enabled ? 'ON' : 'OFF'}, Adsterra: ${saved.adsterra_enabled ? 'ON' : 'OFF'}, Slots: ${activeSlotsCount}/6`
  });

  return saved;
}
