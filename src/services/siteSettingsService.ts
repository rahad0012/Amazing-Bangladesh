/**
 * Site Settings Collection Service (site_settings)
 * Manages website_settings, seo_settings, and legal_pages documents with caching and bilingual helpers.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import type { Language } from '../utils/langUtils';
import {
  COLLECTIONS,
  OperationType,
  cachedFirestoreFetch,
  getLocalizedField,
  handleFirestoreError,
  invalidateFirestoreCache,
  isPermissionDeniedError,
  stripUndefined
} from './firestoreBase';
import {
  DEFAULT_LEGAL_PAGES,
  normalizeLegalPagesConfig,
  type LegalPagesConfig
} from './legalPagesDefaults';

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

export interface HeroBannerSlide {
  id: string;
  image_url: string;
  label_bn: string;
  label_en: string;
}

export const DEFAULT_HERO_SLIDES: HeroBannerSlide[] = [
  {
    id: 'slide_coxs_bazar',
    image_url: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80',
    label_bn: 'কক্সবাজার সমুদ্র সৈকত • চট্টগ্রাম',
    label_en: "Cox's Bazar Sea Beach • Chattogram"
  },
  {
    id: 'slide_sajek',
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    label_bn: 'সাজেক ভ্যালি মেঘের রাজ্য • রাঙামাটি',
    label_en: 'Sajek Cloud Valley • Rangamati'
  },
  {
    id: 'slide_sundarbans',
    image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
    label_bn: 'সুন্দরবন ম্যানগ্রোভ অরণ্য • খুলনা',
    label_en: 'Sundarbans Mangrove Forest • Khulna'
  },
  {
    id: 'slide_sreemangal',
    image_url: 'https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=1600&q=80',
    label_bn: 'শ্রীমঙ্গল সবুজ চা বাগান • সিলেট',
    label_en: 'Sreemangal Tea Gardens • Sylhet'
  },
  {
    id: 'slide_lalbagh',
    image_url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1600&q=80',
    label_bn: 'লালবাগ কেল্লা ও পুরান ঢাকা • ঢাকা',
    label_en: 'Lalbagh Fort & Old Dhaka • Dhaka'
  },
  {
    id: 'slide_kuakata',
    image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80',
    label_bn: 'কুয়াকাটা সাগরকন্যা সৈকত • বরিশাল',
    label_en: 'Kuakata Sunrise & Sunset Beach • Barishal'
  },
  {
    id: 'slide_saint_martin',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    label_bn: 'সেন্টমার্টিন প্রবাল দ্বীপ • কক্সবাজার',
    label_en: "Saint Martin's Coral Island • Bay of Bengal"
  }
];

export interface WebsiteSettingsConfig {
  id: 'website_settings';
  site_title_en: string;
  site_title_bn: string;
  hero_heading_en: string;
  hero_heading_bn: string;
  hero_subtitle_en: string;
  hero_subtitle_bn: string;
  hero_slides?: HeroBannerSlide[];
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
    'An authentic travel companion covering natural wonders, historical heritage, and cultural journeys across all 8 divisions and 64 districts.',
  meta_description_bn:
    '৮টি বিভাগ এবং ৬৪টি জেলার নদী, পাহাড়, অরণ্য, প্রাচীন প্রত্নতত্ত্ব ও ঐতিহাসিক স্থানসমূহের তথ্যবহুল ডিজিটাল মানচিত্র।',
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
  hero_slides: DEFAULT_HERO_SLIDES.map(slide => ({ ...slide })),
  contact_email: 'info@tourism.gov.bd',
  tourist_helpline: '+880 1320-163599',
  default_language: 'bn',
  maintenance_mode: false,
  updated_at: ''
};

export function sanitizeHeroSlides(rawSlides: unknown): HeroBannerSlide[] {
  if (!Array.isArray(rawSlides)) return [];
  const cleaned: HeroBannerSlide[] = [];
  for (let i = 0; i < rawSlides.length && cleaned.length < 15; i++) {
    const item = rawSlides[i] as Partial<HeroBannerSlide> | null | undefined;
    if (!item || typeof item !== 'object') continue;
    const imageUrl = typeof item.image_url === 'string' ? item.image_url.trim().slice(0, 2000) : '';
    if (!imageUrl || imageUrl.length < 5) continue;
    const rawId = typeof item.id === 'string' ? item.id.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) : '';
    const labelBn = typeof item.label_bn === 'string' ? item.label_bn.trim().slice(0, 160) : '';
    const labelEn = typeof item.label_en === 'string' ? item.label_en.trim().slice(0, 160) : '';
    cleaned.push({
      id: rawId || `hero_slide_${cleaned.length + 1}`,
      image_url: imageUrl,
      label_bn: labelBn || labelEn || 'বাংলাদেশ ভ্রমণ ব্যানার',
      label_en: labelEn || labelBn || 'Bangladesh Tourism Banner'
    });
  }
  return cleaned;
}

export function getActiveHeroSlides(settings?: Partial<WebsiteSettingsConfig> | null): HeroBannerSlide[] {
  const sanitized = sanitizeHeroSlides(settings?.hero_slides);
  if (sanitized.length > 0) return sanitized;
  return DEFAULT_HERO_SLIDES.map(slide => ({ ...slide }));
}

const LEGACY_SEEDED_META_DESC_EN =
  "Discover Bangladesh's 8 administrative divisions, 64 districts, natural wonders, UNESCO World Heritage sites, and curated travel itineraries in Bengali and English.";
const LEGACY_SEEDED_META_DESC_BN =
  'বাংলাদেশের ৮টি বিভাগ, ৬৪টি জেলা, প্রাকৃতিক বিস্ময়, ইউনেস্কো বিশ্ব ঐতিহ্য এবং নির্ভরযোগ্য ভ্রমণ নির্দেশিকা জানুন বাংলা ও ইংরেজিতে।';

export function normalizeSeoSettings(raw?: Partial<SeoSettingsConfig> | null): SeoSettingsConfig {
  const rawDescEn = typeof raw?.meta_description_en === 'string' ? raw.meta_description_en.trim() : '';
  const rawDescBn = typeof raw?.meta_description_bn === 'string' ? raw.meta_description_bn.trim() : '';
  return {
    ...DEFAULT_SEO_SETTINGS,
    ...(raw || {}),
    id: 'seo_settings',
    meta_description_en:
      !rawDescEn || rawDescEn === LEGACY_SEEDED_META_DESC_EN
        ? DEFAULT_SEO_SETTINGS.meta_description_en
        : rawDescEn,
    meta_description_bn:
      !rawDescBn || rawDescBn === LEGACY_SEEDED_META_DESC_BN
        ? DEFAULT_SEO_SETTINGS.meta_description_bn
        : rawDescBn,
    robots_index: raw?.robots_index === 'noindex, nofollow' ? 'noindex, nofollow' : 'index, follow'
  };
}

export function normalizeWebsiteSettings(raw?: Partial<WebsiteSettingsConfig> | null): WebsiteSettingsConfig {
  const sanitizedSlides = sanitizeHeroSlides(raw?.hero_slides);
  return {
    ...DEFAULT_WEBSITE_SETTINGS,
    ...(raw || {}),
    id: 'website_settings',
    hero_slides: sanitizedSlides.length > 0 ? sanitizedSlides : DEFAULT_HERO_SLIDES.map(slide => ({ ...slide })),
    default_language: raw?.default_language === 'en' ? 'en' : 'bn',
    maintenance_mode: Boolean(raw?.maintenance_mode)
  };
}

export function localizeWebsiteSettings(settings: WebsiteSettingsConfig, lang: Language) {
  return {
    siteTitle: getLocalizedField(settings, 'site_title', lang),
    heroHeading: getLocalizedField(settings, 'hero_heading', lang),
    heroSubtitle: getLocalizedField(settings, 'hero_subtitle', lang),
    contactEmail: settings.contact_email,
    touristHelpline: settings.tourist_helpline,
    maintenanceMode: settings.maintenance_mode,
    defaultLanguage: settings.default_language
  };
}

export function localizeSeoSettings(settings: SeoSettingsConfig, lang: Language) {
  return {
    defaultTitle: getLocalizedField(settings, 'default_title', lang),
    titleSuffix: getLocalizedField(settings, 'title_suffix', lang),
    metaDescription: getLocalizedField(settings, 'meta_description', lang),
    canonicalBaseUrl: settings.canonical_base_url,
    ogImageUrl: settings.og_image_url,
    robotsIndex: settings.robots_index,
    twitterHandle: settings.twitter_handle
  };
}

export const SiteSettingsService = {
  async getWebsiteSettings(bypassCache: boolean = false): Promise<WebsiteSettingsConfig> {
    const fetcher = async (): Promise<WebsiteSettingsConfig> => {
      try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'website_settings'));
        if (!docSnap.exists()) return { ...DEFAULT_WEBSITE_SETTINGS };
        return normalizeWebsiteSettings(docSnap.data() as Partial<WebsiteSettingsConfig>);
      } catch (error) {
        if (isPermissionDeniedError(error)) {
          handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.SITE_SETTINGS}/website_settings`);
        }
        return { ...DEFAULT_WEBSITE_SETTINGS };
      }
    };
    if (bypassCache) return fetcher();
    return cachedFirestoreFetch('doc:site_settings:website_settings', fetcher);
  },

  async saveWebsiteSettings(
    config: Omit<WebsiteSettingsConfig, 'id' | 'updated_at'> & { updated_at?: string }
  ): Promise<WebsiteSettingsConfig> {
    const normalized = stripUndefined(
      normalizeWebsiteSettings({
        ...config,
        updated_at: new Date().toISOString()
      })
    );
    try {
      await setDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'website_settings'), normalized, { merge: true });
      invalidateFirestoreCache('doc:site_settings:website_settings');
      return normalized;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SITE_SETTINGS}/website_settings`);
      }
      throw error;
    }
  },

  async getSeoSettings(bypassCache: boolean = false): Promise<SeoSettingsConfig> {
    const fetcher = async (): Promise<SeoSettingsConfig> => {
      try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'seo_settings'));
        if (!docSnap.exists()) return { ...DEFAULT_SEO_SETTINGS };
        return normalizeSeoSettings(docSnap.data() as Partial<SeoSettingsConfig>);
      } catch (error) {
        if (isPermissionDeniedError(error)) {
          handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.SITE_SETTINGS}/seo_settings`);
        }
        return { ...DEFAULT_SEO_SETTINGS };
      }
    };
    if (bypassCache) return fetcher();
    return cachedFirestoreFetch('doc:site_settings:seo_settings', fetcher);
  },

  async saveSeoSettings(
    config: Omit<SeoSettingsConfig, 'id' | 'updated_at'> & { updated_at?: string }
  ): Promise<SeoSettingsConfig> {
    const normalized = stripUndefined(
      normalizeSeoSettings({
        ...config,
        updated_at: new Date().toISOString()
      })
    );
    try {
      await setDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'seo_settings'), normalized, { merge: true });
      invalidateFirestoreCache('doc:site_settings:seo_settings');
      return normalized;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SITE_SETTINGS}/seo_settings`);
      }
      throw error;
    }
  },

  async getLegalPagesSettings(bypassCache: boolean = false): Promise<LegalPagesConfig | null> {
    const fetcher = async (): Promise<LegalPagesConfig | null> => {
      try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'legal_pages'));
        if (!docSnap.exists()) return null;
        return normalizeLegalPagesConfig(docSnap.data() as Partial<LegalPagesConfig>);
      } catch (error) {
        if (isPermissionDeniedError(error)) {
          handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.SITE_SETTINGS}/legal_pages`);
        }
        console.warn('Could not load legal pages config from Firestore:', error);
        return null;
      }
    };
    if (bypassCache) return fetcher();
    return cachedFirestoreFetch('doc:site_settings:legal_pages', fetcher);
  },

  async saveLegalPagesSettings(config: LegalPagesConfig): Promise<{ success: boolean; message?: string }> {
    const normalized = stripUndefined(
      normalizeLegalPagesConfig({
        ...config,
        updated_at: new Date().toISOString()
      })
    );
    try {
      await setDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'legal_pages'), normalized, { merge: true });
      invalidateFirestoreCache('doc:site_settings:legal_pages');
      return { success: true };
    } catch (error: any) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SITE_SETTINGS}/legal_pages`);
      }
      return {
        success: false,
        message: error?.message || 'Could not save legal document settings.'
      };
    }
  },

  async getAllPublicSettings(): Promise<{
    website: WebsiteSettingsConfig;
    seo: SeoSettingsConfig;
    legal: LegalPagesConfig;
  }> {
    const [website, seo, legal] = await Promise.all([
      SiteSettingsService.getWebsiteSettings(),
      SiteSettingsService.getSeoSettings(),
      SiteSettingsService.getLegalPagesSettings()
    ]);
    return {
      website,
      seo,
      legal: legal || { ...DEFAULT_LEGAL_PAGES }
    };
  },

  localizeWebsite: localizeWebsiteSettings,
  localizeSeo: localizeSeoSettings
};
