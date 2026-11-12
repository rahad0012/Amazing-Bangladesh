/**
 * Page Controllers Export
 * Prepares the architectural foundation for public destination pages
 */

export interface PageMetadata {
  id: string;
  titleBn: string;
  titleEn: string;
  slug: string;
}

export const CORE_PAGES: PageMetadata[] = [
  { id: 'home', titleBn: 'মূলপাতা', titleEn: 'Home', slug: '/' },
  { id: 'divisions', titleBn: 'বিভাগসমূহ', titleEn: 'Divisions', slug: '#divisions' },
  { id: 'districts', titleBn: '৬৪ জেলা গাইড', titleEn: '64 Districts', slug: '#districts' },
  { id: 'spots', titleBn: 'শীর্ষ দর্শনীয় স্থান', titleEn: 'Attractions', slug: '#spots' },
  { id: 'guides', titleBn: 'ভ্রমণ নির্দেশিকা', titleEn: 'Travel Guides', slug: '#guides' },
  { id: 'planner', titleBn: 'ট্যুর প্ল্যানার', titleEn: 'Trip Planner', slug: '#planner' },
  { id: 'saved', titleBn: 'পছন্দের তালিকা', titleEn: 'Saved Places', slug: '#saved' },
  { id: 'admin', titleBn: 'সিএমএস অ্যাডমিন', titleEn: 'Admin CMS', slug: '#cms' }
];
