/**
 * CMS State & Reactive Data Store
 * Keeps in-memory collections synchronized with dedicated Firebase collection services.
 * Ensures Firestore writes succeed before finalizing store state and rolls back on failure.
 */

import {
  cmsStore,
  persistStore,
  getMediaReferences,
  type CmsTab,
  type MediaReferenceInfo,
  type CmsStore
} from './cmsStore';
import { FirestoreService } from '../services/firestoreService';
import { DivisionsService } from '../services/divisionsService';
import { DistrictsService } from '../services/districtsService';
import { CategoriesService } from '../services/categoriesService';
import { TouristSpotsService } from '../services/touristSpotsService';
import { ArticlesService } from '../services/articlesService';
import { AdminsService, type AdminRecord, type AdminRole } from '../services/adminsService';
import { SiteSettingsService } from '../services/siteSettingsService';
import { seedInitialTourismDataToFirestore, type SeedResultSummary } from '../services/seedFirestoreService';

export {
  cmsStore,
  persistStore,
  getMediaReferences,
  type CmsTab,
  type MediaReferenceInfo,
  type CmsStore
};

import {
  db,
  handleFirestoreError,
  OperationType,
  deleteStorageFile
} from '../firebase';
import { getVerifiedAdminSession, isVerifiedAdminActive } from '../services/adminAuthService';
import {
  adminDashboardState,
  recordAdminAuditLog,
  type AdminDashboardSnapshot
} from '../services/adminDashboardService';
import {
  normalizeLegalPagesConfig,
  type LegalPagesConfig
} from '../services/legalPagesDefaults';

import {
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';

import type {
  Division,
  District,
  Category,
  TouristSpot,
  Article,
  MediaItem
} from '../data/bangladeshData';

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

function handleWriteError(err: any, operationType: OperationType, path: string): never {
  if (
    err?.code === 'permission-denied' ||
    (err instanceof Error && err.message.includes('Missing or insufficient permissions'))
  ) {
    handleFirestoreError(err, operationType, path);
  }
  throw err;
}

// Synchronize CMS store with real Firestore collections fetched for Admin Dashboard
export function syncCmsStoreFromAdminSnapshot(snapshot: AdminDashboardSnapshot): void {
  if (snapshot.divisions.length > 0) cmsStore.divisions = snapshot.divisions;
  if (snapshot.districts.length > 0) cmsStore.districts = snapshot.districts;
  if (snapshot.categories.length > 0) cmsStore.categories = snapshot.categories;
  if (snapshot.spots.length > 0) cmsStore.spots = snapshot.spots;
  if (snapshot.articles.length > 0) cmsStore.articles = snapshot.articles;
  if (snapshot.media.length > 0) cmsStore.media = snapshot.media;
  if (snapshot.legalPages) cmsStore.legalPages = snapshot.legalPages;

  adminDashboardState.stats = snapshot.stats;
  adminDashboardState.admins = snapshot.admins;
  adminDashboardState.recentSpots = snapshot.recentSpots;
  adminDashboardState.recentUpdates = snapshot.recentUpdates;
  adminDashboardState.recentActivity = snapshot.recentActivity;
  adminDashboardState.auditLogStatus = snapshot.auditLogStatus;
  adminDashboardState.seoSettings = snapshot.seoSettings;
  adminDashboardState.websiteSettings = snapshot.websiteSettings;
  adminDashboardState.lastSyncedAt = snapshot.syncedAt;
  adminDashboardState.status = 'loaded';
  adminDashboardState.errorMessage = null;
}

// Check verified administrator write privileges (strictly backed by server-verified Firebase session)
export function canWriteAdmin(): boolean {
  return isVerifiedAdminActive();
}

function assertAdminAccess(): void {
  if (!canWriteAdmin()) {
    throw new Error('ADMIN_UNAUTHORIZED');
  }
}

// ============================================================================
// CRUD Operations via Dedicated Collection Services + Audit Logging
// ============================================================================

// 1. Division CRUD
export async function saveDivision(division: Division): Promise<void> {
  assertAdminAccess();
  const idx = cmsStore.divisions.findIndex(d => d.id === division.id);
  const isEdit = idx !== -1;
  const now = new Date().toISOString();

  const existing = isEdit ? cmsStore.divisions[idx] : undefined;
  const payload = stripUndefined({
    ...division,
    created_at: existing?.created_at || division.created_at || now,
    updated_at: now
  });

  await DivisionsService.save(payload);

  if (isEdit) {
    cmsStore.divisions[idx] = payload;
  } else {
    cmsStore.divisions.unshift(payload);
  }
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: isEdit ? 'update' : 'create',
    entityType: 'division',
    entityId: payload.id,
    entityTitle: payload.name_en || payload.name_bn,
    details: `Status: ${payload.is_published ? 'Published' : 'Draft'}`
  });
}

export async function deleteDivision(divisionId: string): Promise<{ success: boolean; message?: string }> {
  assertAdminAccess();
  const childDistricts = cmsStore.districts.filter(d => d.division_id === divisionId);
  if (childDistricts.length > 0) {
    const districtNames = childDistricts.map(d => d.name_en).slice(0, 5).join(', ');
    const more = childDistricts.length > 5 ? ` and ${childDistricts.length - 5} more` : '';
    return {
      success: false,
      message: `Cannot delete division because ${childDistricts.length} district(s) depend on it (${districtNames}${more}). Please reassign or delete dependent districts first.`
    };
  }

  const target = cmsStore.divisions.find(d => d.id === divisionId);
  await DivisionsService.remove(divisionId);

  cmsStore.divisions = cmsStore.divisions.filter(d => d.id !== divisionId);
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: 'delete',
    entityType: 'division',
    entityId: divisionId,
    entityTitle: target?.name_en || divisionId
  });
  return { success: true };
}

// 2. District CRUD
export async function saveDistrict(district: District): Promise<void> {
  assertAdminAccess();
  const idx = cmsStore.districts.findIndex(d => d.id === district.id);
  const isEdit = idx !== -1;
  const now = new Date().toISOString();

  const existing = isEdit ? cmsStore.districts[idx] : undefined;
  const payload = stripUndefined({
    ...district,
    created_at: existing?.created_at || district.created_at || now,
    updated_at: now
  });

  await DistrictsService.save(payload);

  if (isEdit) {
    cmsStore.districts[idx] = payload;
  } else {
    cmsStore.districts.unshift(payload);
  }
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: isEdit ? 'update' : 'create',
    entityType: 'district',
    entityId: payload.id,
    entityTitle: payload.name_en || payload.name_bn,
    details: `Status: ${payload.is_published ? 'Published' : 'Draft'}`
  });
}

export async function deleteDistrict(districtId: string): Promise<{ success: boolean; message?: string }> {
  assertAdminAccess();
  const childSpots = cmsStore.spots.filter(s => s.district_id === districtId);
  if (childSpots.length > 0) {
    const spotNames = childSpots.map(s => s.name_en).slice(0, 5).join(', ');
    const more = childSpots.length > 5 ? ` and ${childSpots.length - 5} more` : '';
    return {
      success: false,
      message: `Cannot delete district because ${childSpots.length} tourist spot(s) are located in it (${spotNames}${more}). Please reassign or remove these spots first.`
    };
  }

  const target = cmsStore.districts.find(d => d.id === districtId);
  await DistrictsService.remove(districtId);

  cmsStore.districts = cmsStore.districts.filter(d => d.id !== districtId);
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: 'delete',
    entityType: 'district',
    entityId: districtId,
    entityTitle: target?.name_en || districtId
  });
  return { success: true };
}

// 3. Category CRUD
export async function saveCategory(category: Category): Promise<void> {
  assertAdminAccess();
  const idx = cmsStore.categories.findIndex(c => c.id === category.id);
  const isEdit = idx !== -1;
  const now = new Date().toISOString();

  const existing = isEdit ? cmsStore.categories[idx] : undefined;
  const payload = stripUndefined({
    ...category,
    created_at: existing?.created_at || category.created_at || now,
    updated_at: now
  });

  await CategoriesService.save(payload);

  if (isEdit) {
    cmsStore.categories[idx] = payload;
  } else {
    cmsStore.categories.push(payload);
  }
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: isEdit ? 'update' : 'create',
    entityType: 'category',
    entityId: payload.id,
    entityTitle: payload.name_en || payload.name_bn,
    details: `Status: ${payload.is_published ? 'Published' : 'Draft'}`
  });
}

export async function deleteCategory(categoryId: string): Promise<{ success: boolean; message?: string }> {
  assertAdminAccess();
  const linkedSpots = cmsStore.spots.filter(s => s.category_ids && s.category_ids.includes(categoryId));
  if (linkedSpots.length > 0) {
    const spotNames = linkedSpots.map(s => s.name_en).slice(0, 5).join(', ');
    return {
      success: false,
      message: `Cannot delete category because ${linkedSpots.length} tourist spot(s) reference it (${spotNames}). Please remove this category tag from spots first.`
    };
  }

  const target = cmsStore.categories.find(c => c.id === categoryId);
  await CategoriesService.remove(categoryId);

  cmsStore.categories = cmsStore.categories.filter(c => c.id !== categoryId);
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: 'delete',
    entityType: 'category',
    entityId: categoryId,
    entityTitle: target?.name_en || categoryId
  });
  return { success: true };
}

// 4. Tourist Spot CRUD
export async function saveTouristSpot(spot: TouristSpot): Promise<void> {
  assertAdminAccess();
  const idx = cmsStore.spots.findIndex(s => s.id === spot.id);
  const isEdit = idx !== -1;
  const now = new Date().toISOString();

  const existing = isEdit ? cmsStore.spots[idx] : undefined;
  const payload = stripUndefined({
    ...spot,
    created_at: existing?.created_at || spot.created_at || now,
    updated_at: now
  });

  await TouristSpotsService.save(payload);

  if (isEdit) {
    cmsStore.spots[idx] = payload;
  } else {
    cmsStore.spots.unshift(payload);
  }
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: isEdit ? 'update' : 'create',
    entityType: 'tourist_spot',
    entityId: payload.id,
    entityTitle: payload.name_en || payload.name_bn,
    details: `Status: ${payload.is_published ? 'Published' : 'Draft'}`
  });
}

export async function deleteTouristSpot(spotId: string): Promise<{ success: boolean }> {
  assertAdminAccess();
  const target = cmsStore.spots.find(s => s.id === spotId);
  await TouristSpotsService.remove(spotId);

  cmsStore.spots = cmsStore.spots.filter(s => s.id !== spotId);
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: 'delete',
    entityType: 'tourist_spot',
    entityId: spotId,
    entityTitle: target?.name_en || spotId
  });
  return { success: true };
}

// 5. Travel Guide / Article CRUD
export async function saveArticle(article: Article): Promise<void> {
  assertAdminAccess();
  const idx = cmsStore.articles.findIndex(a => a.id === article.id);
  const isEdit = idx !== -1;
  const now = new Date().toISOString();

  const existing = isEdit ? cmsStore.articles[idx] : undefined;
  const payload = stripUndefined({
    ...article,
    created_at: existing?.created_at || article.created_at || now,
    updated_at: now
  });

  await ArticlesService.save(payload);

  if (isEdit) {
    cmsStore.articles[idx] = payload;
  } else {
    cmsStore.articles.unshift(payload);
  }
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: isEdit ? 'update' : 'create',
    entityType: 'article',
    entityId: payload.id,
    entityTitle: payload.title_en || payload.title_bn,
    details: `Status: ${payload.is_published ? 'Published' : payload.status || 'Draft'}`
  });
}

export async function deleteArticle(articleId: string): Promise<{ success: boolean }> {
  assertAdminAccess();
  const target = cmsStore.articles.find(a => a.id === articleId);
  await ArticlesService.remove(articleId);

  cmsStore.articles = cmsStore.articles.filter(a => a.id !== articleId);
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: 'delete',
    entityType: 'article',
    entityId: articleId,
    entityTitle: target?.title_en || articleId
  });
  return { success: true };
}

// 6. Media Item CRUD
export async function saveMediaItem(item: MediaItem): Promise<void> {
  assertAdminAccess();
  const idx = cmsStore.media.findIndex(m => m.id === item.id);
  const isEdit = idx !== -1;
  const now = new Date().toISOString();

  const existing = isEdit ? cmsStore.media[idx] : undefined;
  const payload = stripUndefined({
    ...item,
    uploaded_at: existing?.uploaded_at || item.uploaded_at || now,
    updated_at: now
  });

  try {
    await setDoc(doc(db, 'media', payload.id), payload);
  } catch (err: any) {
    handleWriteError(err, OperationType.WRITE, `media/${payload.id}`);
  }

  if (isEdit) {
    cmsStore.media[idx] = payload;
  } else {
    cmsStore.media.unshift(payload);
  }
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: isEdit ? 'update' : 'create',
    entityType: 'media',
    entityId: payload.id,
    entityTitle: payload.file_name || payload.id
  });
}

export async function deleteMediaItem(
  mediaId: string
): Promise<{ success: boolean; message?: string; references?: MediaReferenceInfo[] }> {
  assertAdminAccess();
  const item = cmsStore.media.find(m => m.id === mediaId);
  if (!item) return { success: true };

  const references = getMediaReferences(item.url);
  if (references.length > 0) {
    const refList = references
      .slice(0, 4)
      .map(r => `${r.entityType}: ${r.title}`)
      .join(', ');
    const more = references.length > 4 ? ` and ${references.length - 4} more` : '';
    return {
      success: false,
      references,
      message: `Cannot delete "${item.file_name}" because it is currently used by ${references.length} content item(s) (${refList}${more}). Replace or remove the image reference before deleting.`
    };
  }

  try {
    await deleteStorageFile(item.url);
    await deleteDoc(doc(db, 'media', mediaId));
  } catch (err: any) {
    handleWriteError(err, OperationType.DELETE, `media/${mediaId}`);
  }

  cmsStore.media = cmsStore.media.filter(m => m.id !== mediaId);
  persistStore();
  FirestoreService.invalidateCache();

  void recordAdminAuditLog({
    action: 'delete',
    entityType: 'media',
    entityId: mediaId,
    entityTitle: item.file_name || mediaId
  });

  return { success: true };
}

// 7. Editable Legal Pages Configuration (Privacy Policy & Terms and Conditions)
export async function saveLegalPages(config: LegalPagesConfig): Promise<{ syncedToFirestore: boolean; message?: string }> {
  assertAdminAccess();
  const normalized = stripUndefined(
    normalizeLegalPagesConfig({
      ...config,
      updated_at: new Date().toISOString()
    })
  );

  const result = await SiteSettingsService.saveLegalPagesSettings(normalized);
  if (!result.success) {
    return {
      syncedToFirestore: false,
      message: result.message || 'Could not sync legal pages configuration to Firestore.'
    };
  }

  cmsStore.legalPages = normalized;
  persistStore();

  void recordAdminAuditLog({
    action: 'settings_update',
    entityType: 'legal_pages',
    entityId: 'legal_pages',
    entityTitle: 'Legal Pages Configuration'
  });
  return { syncedToFirestore: true };
}

// 8. Admin Users Registry CRUD (admins collection)
export async function saveAdminRecord(input: {
  uid: string;
  email: string;
  role: AdminRole;
  isEdit?: boolean;
}): Promise<AdminRecord> {
  assertAdminAccess();
  const saved = input.isEdit
    ? await AdminsService.update(input.uid, { email: input.email, role: input.role })
    : await AdminsService.create({ uid: input.uid, email: input.email, role: input.role });

  const idx = adminDashboardState.admins.findIndex(a => a.uid === saved.uid);
  if (idx !== -1) {
    adminDashboardState.admins[idx] = saved;
  } else {
    adminDashboardState.admins.unshift(saved);
  }

  void recordAdminAuditLog({
    action: idx !== -1 ? 'update' : 'create',
    entityType: 'admin',
    entityId: saved.uid,
    entityTitle: saved.email,
    details: `Role: ${saved.role}`
  });

  return saved;
}

export async function deleteAdminRecord(uid: string): Promise<{ success: boolean; message?: string }> {
  assertAdminAccess();
  const currentUid = getVerifiedAdminSession()?.uid;
  if (currentUid && uid === currentUid) {
    return {
      success: false,
      message: 'You cannot remove your own currently signed-in administrator account.'
    };
  }

  const target = adminDashboardState.admins.find(a => a.uid === uid);
  await AdminsService.remove(uid, currentUid);
  adminDashboardState.admins = adminDashboardState.admins.filter(a => a.uid !== uid);

  void recordAdminAuditLog({
    action: 'delete',
    entityType: 'admin',
    entityId: uid,
    entityTitle: target?.email || uid
  });

  return { success: true };
}

// 9. Admin-Only Batched Initial Dataset Seeder
export async function seedFirestoreFromCms(): Promise<SeedResultSummary> {
  assertAdminAccess();
  const summary = await seedInitialTourismDataToFirestore();
  void recordAdminAuditLog({
    action: 'create',
    entityType: 'website_settings',
    entityId: 'firestore_seed',
    entityTitle: 'Initial Tourism Dataset Seed',
    details: `Created ${summary.createdCount} documents, skipped ${summary.skippedCount} existing`
  });
  return summary;
}
