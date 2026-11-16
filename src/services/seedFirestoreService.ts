/**
 * Admin-Only Firestore Seeding Service
 * Allows an authorized administrator to populate initial divisions, districts, categories,
 * tourist_spots, articles, media, and default site_settings into Cloud Firestore without overwriting existing records.
 */

import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import {
  ARTICLES,
  CATEGORIES,
  DISTRICTS,
  DIVISIONS,
  MEDIA_ITEMS,
  TOURIST_SPOTS
} from '../data/bangladeshData';
import { validateBangladeshGeographyDataset } from '../data/geographyValidator';
import { isVerifiedAdminActive } from './adminAuthService';
import {
  COLLECTIONS,
  OperationType,
  handleFirestoreError,
  invalidateFirestoreCache,
  isPermissionDeniedError,
  stripUndefined
} from './firestoreBase';
import { DEFAULT_LEGAL_PAGES } from './legalPagesDefaults';
import { DEFAULT_SEO_SETTINGS, DEFAULT_WEBSITE_SETTINGS } from './siteSettingsService';

export interface SeedResultSummary {
  createdCount: number;
  skippedCount: number;
  details: Record<string, { created: number; existing: number }>;
}

interface ExistingCollectionIndex {
  ids: Set<string>;
  slugs: Set<string>;
}

async function getExistingCollectionIndex(collectionName: string): Promise<ExistingCollectionIndex> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    const ids = new Set<string>();
    const slugs = new Set<string>();
    snap.forEach(d => {
      ids.add(d.id);
      const data = d.data() as { slug?: unknown };
      if (typeof data?.slug === 'string' && data.slug.trim()) {
        slugs.add(data.slug.trim().toLowerCase());
      }
    });
    return { ids, slugs };
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
    throw error;
  }
}

export async function seedInitialTourismDataToFirestore(): Promise<SeedResultSummary> {
  if (!isVerifiedAdminActive()) {
    throw new Error('ADMIN_UNAUTHORIZED');
  }

  const geoValidation = validateBangladeshGeographyDataset(DIVISIONS, DISTRICTS);
  if (!geoValidation.valid) {
    throw new Error(`Geography dataset validation failed: ${geoValidation.errors[0] || 'Invalid structure'}`);
  }

  const now = new Date().toISOString();
  const [divIdx, distIdx, catIdx, spotIdx, artIdx, mediaIdx, settingsIdx] = await Promise.all([
    getExistingCollectionIndex(COLLECTIONS.DIVISIONS),
    getExistingCollectionIndex(COLLECTIONS.DISTRICTS),
    getExistingCollectionIndex(COLLECTIONS.CATEGORIES),
    getExistingCollectionIndex(COLLECTIONS.TOURIST_SPOTS),
    getExistingCollectionIndex(COLLECTIONS.ARTICLES),
    getExistingCollectionIndex(COLLECTIONS.MEDIA),
    getExistingCollectionIndex(COLLECTIONS.SITE_SETTINGS)
  ]);

  const pendingWrites: Array<{ collectionName: string; id: string; data: Record<string, any> }> = [];
  const details: Record<string, { created: number; existing: number }> = {
    divisions: { created: 0, existing: divIdx.ids.size },
    districts: { created: 0, existing: distIdx.ids.size },
    categories: { created: 0, existing: catIdx.ids.size },
    tourist_spots: { created: 0, existing: spotIdx.ids.size },
    articles: { created: 0, existing: artIdx.ids.size },
    media: { created: 0, existing: mediaIdx.ids.size },
    site_settings: { created: 0, existing: settingsIdx.ids.size }
  };

  for (const div of DIVISIONS) {
    const slugKey = div.slug.trim().toLowerCase();
    if (!divIdx.ids.has(div.id) && !divIdx.slugs.has(slugKey)) {
      details.divisions.created += 1;
      pendingWrites.push({
        collectionName: COLLECTIONS.DIVISIONS,
        id: div.id,
        data: stripUndefined({ ...div, created_at: div.created_at || now, updated_at: now })
      });
    }
  }

  for (const dist of DISTRICTS) {
    const slugKey = dist.slug.trim().toLowerCase();
    if (!distIdx.ids.has(dist.id) && !distIdx.slugs.has(slugKey)) {
      details.districts.created += 1;
      pendingWrites.push({
        collectionName: COLLECTIONS.DISTRICTS,
        id: dist.id,
        data: stripUndefined({ ...dist, created_at: dist.created_at || now, updated_at: now })
      });
    }
  }

  for (const cat of CATEGORIES) {
    if (!catIdx.ids.has(cat.id)) {
      details.categories.created += 1;
      pendingWrites.push({
        collectionName: COLLECTIONS.CATEGORIES,
        id: cat.id,
        data: stripUndefined({ ...cat, created_at: cat.created_at || now, updated_at: now })
      });
    }
  }

  for (const spot of TOURIST_SPOTS) {
    if (!spotIdx.ids.has(spot.id)) {
      details.tourist_spots.created += 1;
      pendingWrites.push({
        collectionName: COLLECTIONS.TOURIST_SPOTS,
        id: spot.id,
        data: stripUndefined({ ...spot, created_at: spot.created_at || now, updated_at: now })
      });
    }
  }

  for (const art of ARTICLES) {
    if (!artIdx.ids.has(art.id)) {
      details.articles.created += 1;
      pendingWrites.push({
        collectionName: COLLECTIONS.ARTICLES,
        id: art.id,
        data: stripUndefined({ ...art, created_at: art.created_at || now, updated_at: now })
      });
    }
  }

  for (const m of MEDIA_ITEMS) {
    if (!mediaIdx.ids.has(m.id)) {
      details.media.created += 1;
      pendingWrites.push({
        collectionName: COLLECTIONS.MEDIA,
        id: m.id,
        data: stripUndefined({ ...m, uploaded_at: m.uploaded_at || now, updated_at: now })
      });
    }
  }

  if (!settingsIdx.ids.has('website_settings')) {
    details.site_settings.created += 1;
    pendingWrites.push({
      collectionName: COLLECTIONS.SITE_SETTINGS,
      id: 'website_settings',
      data: stripUndefined({ ...DEFAULT_WEBSITE_SETTINGS, updated_at: now })
    });
  }
  if (!settingsIdx.ids.has('seo_settings')) {
    details.site_settings.created += 1;
    pendingWrites.push({
      collectionName: COLLECTIONS.SITE_SETTINGS,
      id: 'seo_settings',
      data: stripUndefined({ ...DEFAULT_SEO_SETTINGS, updated_at: now })
    });
  }
  if (!settingsIdx.ids.has('legal_pages')) {
    details.site_settings.created += 1;
    pendingWrites.push({
      collectionName: COLLECTIONS.SITE_SETTINGS,
      id: 'legal_pages',
      data: stripUndefined({ ...DEFAULT_LEGAL_PAGES, updated_at: now })
    });
  }

  // Commit in chunks of 400 (Firestore batch limit is 500)
  for (let i = 0; i < pendingWrites.length; i += 400) {
    const chunk = pendingWrites.slice(i, i + 400);
    const batch = writeBatch(db);
    for (const item of chunk) {
      batch.set(doc(db, item.collectionName, item.id), item.data);
    }
    try {
      await batch.commit();
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.WRITE, 'batch_seed');
      }
      throw error;
    }
  }

  invalidateFirestoreCache();

  const totalExisting = Object.values(details).reduce((acc, d) => acc + d.existing, 0);
  return {
    createdCount: pendingWrites.length,
    skippedCount: totalExisting,
    details
  };
}
