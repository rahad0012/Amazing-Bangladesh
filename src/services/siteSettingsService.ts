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

export type AdNetworkType = 'adsense' | 'adsterra' | 'custom_code' | 'banner_image';

export type AdSlotKey =
  | 'home_banner'
  | 'home_mid'
  | 'directory_top'
  | 'spot_detail_mid'
  | 'article_detail_mid'
  | 'footer_banner';

export interface AdSlotConfig {
  enabled: boolean;
  network: AdNetworkType;
  code: string;
  image_url: string;
  link_url: string;
  alt_text: string;
}

export interface AdsSettingsConfig {
  id: 'ads_settings';
  ads_enabled: boolean;
  adsense_enabled: boolean;
  adsense_client_id: string;
  adsense_auto_ads: boolean;
  adsterra_enabled: boolean;
  adsterra_global_script: string;
  custom_head_script: string;
  ads_txt_content: string;
  show_ad_label: boolean;
  slots: Record<AdSlotKey, AdSlotConfig>;
  updated_at: string;
  updated_by?: string;
}

export const AD_SLOT_META: Array<{
  key: AdSlotKey;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  recommendedSize: string;
}> = [
  {
    key: 'home_banner',
    titleBn: 'হোমপেজ টপ ব্যানার',
    titleEn: 'Homepage Top Banner',
    descBn: 'সার্চ ও পরিসংখ্যান ব্যানারের নিচে প্রদর্শিত হবে।',
    descEn: 'Displayed below the search & stats banner on the homepage.',
    recommendedSize: '728×90 / Responsive'
  },
  {
    key: 'home_mid',
    titleBn: 'হোমপেজ মিড সেকশন',
    titleEn: 'Homepage Mid Section',
    descBn: 'জনপ্রিয় দর্শনীয় স্থান ও ৬৪ জেলা সেকশনের মাঝখানে।',
    descEn: 'Placed between Featured Destinations and 64 Districts sections.',
    recommendedSize: '728×90 / Native Banner'
  },
  {
    key: 'directory_top',
    titleBn: 'ডিরেক্টরি ও সার্চ পেজ',
    titleEn: 'Directory & Search Pages',
    descBn: 'সকল দর্শনীয় স্থান, বিভাগ, জেলা, ভ্রমণ গাইড ও সার্চ পেজে।',
    descEn: 'Shown on Places, Divisions, Districts, Travel Guides, and Search pages.',
    recommendedSize: '728×90 / 300×250'
  },
  {
    key: 'spot_detail_mid',
    titleBn: 'দর্শনীয় স্থান ডিটেইলস পেজ',
    titleEn: 'Tourist Spot Detail Page',
    descBn: 'প্রতিটি দর্শনীয় স্থানের বিস্তারিত পেজের ভেতরে।',
    descEn: 'Rendered inside individual tourist spot detail pages.',
    recommendedSize: 'Responsive / In-Article'
  },
  {
    key: 'article_detail_mid',
    titleBn: 'ভ্রমণ গাইড ও আর্টিকেল পেজ',
    titleEn: 'Travel Guide Article Page',
    descBn: 'ব্লগ ও ভ্রমণ গাইড পড়ার পেজের ভেতরে।',
    descEn: 'Rendered inside travel guide & blog article pages.',
    recommendedSize: 'In-Article / 300×250'
  },
  {
    key: 'footer_banner',
    titleBn: 'ফুটার টপ ব্যানার (সব পাবলিক পেজ)',
    titleEn: 'Above Footer (All Public Pages)',
    descBn: 'প্রতিটি পাবলিক পেজের ফুটারের ঠিক উপরে প্রদর্শিত হবে।',
    descEn: 'Displayed above the site footer across all public routes.',
    recommendedSize: '728×90 / 320×50 Mobile'
  }
];

function createEmptyAdSlot(): AdSlotConfig {
  return {
    enabled: false,
    network: 'adsense',
    code: '',
    image_url: '',
    link_url: '',
    alt_text: ''
  };
}

export function createDefaultAdSlots(): Record<AdSlotKey, AdSlotConfig> {
  return {
    home_banner: createEmptyAdSlot(),
    home_mid: createEmptyAdSlot(),
    directory_top: createEmptyAdSlot(),
    spot_detail_mid: createEmptyAdSlot(),
    article_detail_mid: createEmptyAdSlot(),
    footer_banner: createEmptyAdSlot()
  };
}

export const DEFAULT_ADS_SETTINGS: AdsSettingsConfig = {
  id: 'ads_settings',
  ads_enabled: false,
  adsense_enabled: false,
  adsense_client_id: '',
  adsense_auto_ads: false,
  adsterra_enabled: false,
  adsterra_global_script: '',
  custom_head_script: '',
  ads_txt_content: '',
  show_ad_label: true,
  slots: createDefaultAdSlots(),
  updated_at: ''
};

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

function normalizeAdSlot(rawSlot?: Partial<AdSlotConfig> | null): AdSlotConfig {
  const validNetworks: AdNetworkType[] = ['adsense', 'adsterra', 'custom_code', 'banner_image'];
  const network = validNetworks.includes(rawSlot?.network as AdNetworkType)
    ? (rawSlot!.network as AdNetworkType)
    : 'adsense';
  return {
    enabled: Boolean(rawSlot?.enabled),
    network,
    code: typeof rawSlot?.code === 'string' ? rawSlot.code.trim().slice(0, 10000) : '',
    image_url: typeof rawSlot?.image_url === 'string' ? rawSlot.image_url.trim().slice(0, 2000) : '',
    link_url: typeof rawSlot?.link_url === 'string' ? rawSlot.link_url.trim().slice(0, 2000) : '',
    alt_text: typeof rawSlot?.alt_text === 'string' ? rawSlot.alt_text.trim().slice(0, 200) : ''
  };
}

export function normalizeAdsSettings(raw?: Partial<AdsSettingsConfig> | null): AdsSettingsConfig {
  const defaults = createDefaultAdSlots();
  const rawSlots = (raw?.slots || {}) as Partial<Record<AdSlotKey, Partial<AdSlotConfig>>>;
  return {
    id: 'ads_settings',
    ads_enabled: Boolean(raw?.ads_enabled),
    adsense_enabled: Boolean(raw?.adsense_enabled),
    adsense_client_id: typeof raw?.adsense_client_id === 'string' ? raw.adsense_client_id.trim().slice(0, 64) : '',
    adsense_auto_ads: Boolean(raw?.adsense_auto_ads),
    adsterra_enabled: Boolean(raw?.adsterra_enabled),
    adsterra_global_script:
      typeof raw?.adsterra_global_script === 'string' ? raw.adsterra_global_script.trim().slice(0, 10000) : '',
    custom_head_script:
      typeof raw?.custom_head_script === 'string' ? raw.custom_head_script.trim().slice(0, 8000) : '',
    ads_txt_content:
      typeof raw?.ads_txt_content === 'string' ? raw.ads_txt_content.trim().slice(0, 12000) : '',
    show_ad_label: raw?.show_ad_label !== undefined ? Boolean(raw.show_ad_label) : true,
    slots: {
      home_banner: normalizeAdSlot(rawSlots.home_banner || defaults.home_banner),
      home_mid: normalizeAdSlot(rawSlots.home_mid || defaults.home_mid),
      directory_top: normalizeAdSlot(rawSlots.directory_top || defaults.directory_top),
      spot_detail_mid: normalizeAdSlot(rawSlots.spot_detail_mid || defaults.spot_detail_mid),
      article_detail_mid: normalizeAdSlot(rawSlots.article_detail_mid || defaults.article_detail_mid),
      footer_banner: normalizeAdSlot(rawSlots.footer_banner || defaults.footer_banner)
    },
    updated_at: typeof raw?.updated_at === 'string' ? raw.updated_at.slice(0, 64) : '',
    updated_by: typeof raw?.updated_by === 'string' ? raw.updated_by.slice(0, 180) : undefined
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

  async getAdsSettings(bypassCache: boolean = false): Promise<AdsSettingsConfig> {
    const fetchFromFirestore = async (): Promise<AdsSettingsConfig> => {
      const docSnap = await getDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'ads_settings'));
      if (!docSnap.exists()) return normalizeAdsSettings(DEFAULT_ADS_SETTINGS);
      return normalizeAdsSettings(docSnap.data() as Partial<AdsSettingsConfig>);
    };

    try {
      if (bypassCache) {
        return await fetchFromFirestore();
      }
      return await cachedFirestoreFetch('doc:site_settings:ads_settings', fetchFromFirestore, 30_000);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        console.warn(
          'Ads settings read denied by Firestore rules (deploy updated firestore.rules to enable public ads_settings read).'
        );
      } else {
        console.warn('Could not load ads settings from Firestore:', error);
      }
      return normalizeAdsSettings(DEFAULT_ADS_SETTINGS);
    }
  },

  async saveAdsSettings(
    config: Omit<AdsSettingsConfig, 'id' | 'updated_at'> & { updated_at?: string }
  ): Promise<AdsSettingsConfig> {
    const normalized = stripUndefined(
      normalizeAdsSettings({
        ...config,
        updated_at: new Date().toISOString()
      })
    );
    try {
      await setDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'ads_settings'), normalized);
      invalidateFirestoreCache('doc:site_settings:ads_settings');
      return normalized;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SITE_SETTINGS}/ads_settings`);
      }
      throw error;
    }
  },

  async getAllPublicSettings(): Promise<{
    website: WebsiteSettingsConfig;
    seo: SeoSettingsConfig;
    legal: LegalPagesConfig;
    ads: AdsSettingsConfig;
  }> {
    const [website, seo, legal, ads] = await Promise.all([
      SiteSettingsService.getWebsiteSettings(),
      SiteSettingsService.getSeoSettings(),
      SiteSettingsService.getLegalPagesSettings(),
      SiteSettingsService.getAdsSettings().catch(() => normalizeAdsSettings(DEFAULT_ADS_SETTINGS))
    ]);
    return {
      website,
      seo,
      legal: legal || { ...DEFAULT_LEGAL_PAGES },
      ads
    };
  },

  localizeWebsite: localizeWebsiteSettings,
  localizeSeo: localizeSeoSettings
};
