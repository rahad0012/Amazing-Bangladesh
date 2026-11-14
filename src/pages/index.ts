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
  { id: 'divisions', titleBn: 'বিভাগসমূহ', titleEn: 'Divisions', slug: '/divisions/' },
  { id: 'districts', titleBn: '৬৪ জেলা গাইড', titleEn: '64 Districts', slug: '/districts/' },
  { id: 'categories', titleBn: 'ক্যাটাগরি', titleEn: 'Categories', slug: '/categories/' },
  { id: 'spots', titleBn: 'দর্শনীয় স্থান', titleEn: 'Destinations', slug: '/places/' },
  { id: 'guides', titleBn: 'ভ্রমণ নির্দেশিকা', titleEn: 'Travel Guides', slug: '/travel-guides/' },
  { id: 'search', titleBn: 'অনুসন্ধান', titleEn: 'Search', slug: '/search/' },
  { id: 'about', titleBn: 'আমাদের সম্পর্কে', titleEn: 'About Us', slug: '/about/' },
  { id: 'contact', titleBn: 'যোগাযোগ', titleEn: 'Contact', slug: '/contact/' },
  { id: 'privacy-policy', titleBn: 'গোপনীয়তা নীতি', titleEn: 'Privacy Policy', slug: '/privacy-policy/' },
  { id: 'terms', titleBn: 'ব্যবহারের শর্তাবলী', titleEn: 'Terms & Conditions', slug: '/terms-and-conditions/' },
  { id: 'planner', titleBn: 'ট্যুর প্ল্যানার', titleEn: 'Trip Planner', slug: '#planner' },
  { id: 'saved', titleBn: 'পছন্দের তালিকা', titleEn: 'Saved Places', slug: '#saved' },
  { id: 'admin', titleBn: 'সিএমএস অ্যাডমিন', titleEn: 'Admin CMS', slug: '#cms' }
];

export * from './DivisionsPage';
export * from './DivisionDetailsPage';
export * from './DistrictsDirectoryPage';
export * from './DistrictDetailsPage';
export * from './PlacesDirectoryPage';
export * from './SpotDetailsPage';
export * from './CategoriesPage';
export * from './TravelGuidesPage';
export * from './ArticleDetailsPage';
export * from './SearchPage';
export * from './StaticInfoPages';
