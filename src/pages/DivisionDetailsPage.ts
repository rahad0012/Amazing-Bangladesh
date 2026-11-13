/**
 * Dynamic Division Details Page Template (Reusable for all 8 Divisions)
 * URLs: /divisions/dhaka/, /divisions/chattogram/, /divisions/sylhet/, /divisions/khulna/, etc.
 * Fetches division, districts, published tourist spots, and travel guides from Firestore
 */

import {
  type Division,
  type District,
  type Category,
  type TouristSpot,
  type Article
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml, optimizeImageUrl, formatAreaSqKm } from '../utils/formatUtils';
import {
  renderBreadcrumbs,
  renderDestinationCard,
  renderDistrictCard
} from '../components';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export interface DivisionDetailPageProps {
  lang: Language;
  requestedSlug: string;
  division: Division | null;
  districts: District[];
  spots: TouristSpot[];
  categories: Category[];
  articles: Article[];
  bookmarkedIds: Set<string>;
  selectedDistrictFilterId?: string | null;
  isLoading: boolean;
  error: string | null;
}

interface RegionalOverviewContent {
  geography_bn: string;
  geography_en: string;
  rivers_bn: string;
  rivers_en: string;
  climate_bn: string;
  climate_en: string;
  culture_bn: string;
  culture_en: string;
  heritage_highlights_bn: string[];
  heritage_highlights_en: string[];
}

const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1600&q=80';

const OFFICIAL_DIVISION_LINKS: ReadonlyArray<{ slug: string; nameBn: string; nameEn: string }> = [
  { slug: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka' },
  { slug: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram' },
  { slug: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi' },
  { slug: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna' },
  { slug: 'barishal', nameBn: 'বরিশাল', nameEn: 'Barishal' },
  { slug: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet' },
  { slug: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur' },
  { slug: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh' }
];

const REGIONAL_OVERVIEW_MAP: Record<string, RegionalOverviewContent> = {
  dhaka: {
    geography_bn:
      'বাংলাদেশের কেন্দ্রস্থলে অবস্থিত ঢাকা বিভাগ পদ্মা, যমুনা, মেঘনা, শীতলক্ষ্যা, বুড়িগঙ্গা ও ধলেশ্বরী নদীর উর্বর পলিমাটির সমভূমি এবং মধুপুর গড়ের লাল মাটির টিলা নিয়ে গঠিত। রাজধানী ঢাকা ছাড়াও গাজীপুর, নারায়ণগঞ্জ, সোনারগাঁও ও টাঙ্গাইল অঞ্চল দেশের অর্থনৈতিক ও যোগাযোগ কেন্দ্রবিন্দু।',
    geography_en:
      'Situated at the heart of Bangladesh, Dhaka Division spans fertile alluvial floodplains woven by the Padma, Jamuna, Buriganga, Shitalakshya, and Dhaleshwari rivers alongside the elevated red-soil terraces of the Madhupur Tract.',
    rivers_bn: 'বুড়িগঙ্গা, পদ্মা, যমুনা, শীতলক্ষ্যা, ধলেশ্বরী, আড়িয়াল খাঁ',
    rivers_en: 'Buriganga, Padma, Jamuna, Shitalakshya, Dhaleshwari, Arial Khan',
    climate_bn: 'অক্টোবর–মার্চ (শীত ও বসন্তে ঐতিহাসিক স্থাপনা ও নদীভ্রমণের সেরা সময়)',
    climate_en: 'October–March (cool dry season ideal for heritage walks and river cruises)',
    culture_bn:
      'সুলতানি ও মুঘল স্থাপত্য, ঐতিহ্যবাহী জামদানি বয়নশিল্প, টাঙ্গাইলের তাঁতশিল্প, পুরান ঢাকার রসনাবিলাস (কাচ্চি বিরিয়ানি ও বাকরখানি) এবং পহেলা বৈশাখ ও একুশের সাংস্কৃতিক চেতনা এই বিভাগের প্রাণ।',
    culture_en:
      'Renowned for Mughal and Bengal Sultanate architecture, UNESCO-recognized Jamdani weaving, Tangail handloom sarees, Old Dhaka culinary traditions, and vibrant literary and performing arts festivals.',
    heritage_highlights_bn: ['লালবাগ কেল্লা ও আহসান মঞ্জিল', 'সোনারগাঁও পানাম নগর', 'জামদানি ও টাঙ্গাইল তাঁত ঐতিহ্য', 'ভাওয়াল ও মধুপুর শালবন'],
    heritage_highlights_en: ['Lalbagh Fort & Ahsan Manzil', 'Historic Sonargaon Panam City', 'Jamdani & Tangail Handloom Craft', 'Bhawal & Madhupur Sal Forests']
  },
  chattogram: {
    geography_bn:
      'চট্টগ্রাম বিভাগ বাংলাদেশের দক্ষিণ-পূর্বাঞ্চল জুড়ে বিস্তৃত—যেখানে একদিকে বঙ্গোপসাগরের ১২০ কিলোমিটার দীর্ঘ সমুদ্র সৈকত ও প্রবাল দ্বীপ সেন্টমার্টিন, অন্যদিকে রাঙামাটি, বান্দরবান ও খাগড়াছড়ির সুউচ্চ সবুজ পাহাড়, গিরিখাত ও কাপ্তাই হ্রদ অবস্থিত।',
    geography_en:
      'Stretching across southeastern Bangladesh, Chattogram Division unites coastal plains and the 120 km Bay of Bengal shoreline with the dramatic folded mountain ridges, waterfalls, and Kaptai Lake of the Chittagong Hill Tracts.',
    rivers_bn: 'কর্ণফুলী, সাঙ্গু, মাতামুহুরী, হালদা, ফেনী, গোমতী, মেঘনা মোহনা',
    rivers_en: 'Karnaphuli, Sangu, Matamuhuri, Halda, Feni, Gomati, Meghna Estuary',
    climate_bn: 'নভেম্বর–মার্চ (সমুদ্র ও দ্বীপ ভ্রমণ); জুলাই–অক্টোবর (পাহাড়ে মেঘ ও ঝর্ণা)',
    climate_en: 'Nov–Mar for beaches & coral islands; Jul–Oct for misty hill peaks & waterfalls',
    culture_bn:
      'বন্দরনগরীর সমুদ্রবাণিজ্যের ইতিহাস, ঐতিহ্যবাহী মেজবানি ভোজন, চাকমা-মারমা-ত্রিপুরা-বমসহ বৈচিত্র্যময় ক্ষুদ্র নৃগোষ্ঠীর বিজু-সাংগ্রাই-বৈসাবি উৎসব, পুঁথি সাহিত্য এবং পাহাড়ি জুম ও হস্তশিল্প এই অঞ্চলকে অনন্য করেছে।',
    culture_en:
      'Shaped by centuries of maritime trade, famous Mezban feasts, Buddhist monasteries, and the rich cultural tapestry of Chakma, Marma, Tripura, and Bawm hill communities celebrating Boisabi.',
    heritage_highlights_bn: ['কক্সবাজার ও সেন্টমার্টিন প্রবাল দ্বীপ', 'সাজেক ভ্যালি ও বান্দরবান গিরিশৃঙ্গ', 'ময়নামতি প্রাচীন বৌদ্ধ বিহার', 'ঐতিহ্যবাহী মেজবানি ও পাহাড়ি সংস্কৃতি'],
    heritage_highlights_en: ['Cox’s Bazar & Saint Martin’s Island', 'Sajek Valley & Bandarban Peaks', 'Mainamati Ancient Buddhist Ruins', 'Mezban Heritage & Hill Textiles']
  },
  sylhet: {
    geography_bn:
      'দেশের উত্তর-পূর্বাঞ্চলের সিলেট বিভাগ টিলা ও পাহাড়ের পাদদেশ, মৌলভীবাজার-হবিগঞ্জের সবুজ চা বাগান, পাথুরে স্বচ্ছ নদী জাফলং-বিছনাকান্দি এবং সুনামগঞ্জের বিশাল টাঙ্গুয়ার ও হাকালুকি হাওর জলাভূমি নিয়ে গঠিত।',
    geography_en:
      'Tucked in the northeast beneath the Meghalaya foothills, Sylhet Division is defined by undulating tea-terraced hillocks, crystal stone-bed rivers, subtropical rainforests, and vast seasonal wetlands known as haors.',
    rivers_bn: 'সুরমা, কুশিয়ারা, পিয়াইন, গোয়াইন, যাদুকাটা, মনু, খোয়াই',
    rivers_en: 'Surma, Kushiyara, Piyain, Gowain, Jadukata, Manu, Khowai',
    climate_bn: 'জুলাই–অক্টোবর (হাওর ও জলমগ্ন বনের জন্য); নভেম্বর–ফেব্রুয়ারি (চা বাগান ও অতিথি পাখি)',
    climate_en: 'Jul–Oct for flooded swamp forests & haor cruises; Nov–Feb for tea estates & birdwatching',
    culture_bn:
      'হযরত শাহজালাল (রহ.) ও শাহপরান (রহ.)-এর পুণ্যভূমি, মরমী কবি হাসন রাজা, বাউল সম্রাট শাহ আবদুল করিম ও রাধারমণের লোকগান, মণিপুরী নৃত্য-তাঁতশিল্প এবং সাতকড়া ও চায়ের আতিথেয়তা সিলেটের অনন্য পরিচয়।',
    culture_en:
      'Celebrated as a spiritual sanctuary of Sufi shrines and mystic baul poetry (Hason Raja & Shah Abdul Karim), alongside Manipuri classical dance, handloom crafts, and legendary tea hospitality.',
    heritage_highlights_bn: ['টাঙ্গুয়ার হাওর রামসার জলাভূমি', 'রাতারগুল জলমগ্ন সোয়াম্প বন', 'শ্রীমঙ্গল চা বাগান ও লাউয়াছড়া', 'জাফলং ও মণিপুরী সংস্কৃতি'],
    heritage_highlights_en: ['Tanguar Haor Ramsar Wetland', 'Ratargul Freshwater Swamp Forest', 'Sreemangal Tea & Lawachara Park', 'Jaflong & Manipuri Heritage']
  },
  khulna: {
    geography_bn:
      'বাংলাদেশের দক্ষিণ-পশ্চিমাঞ্চলের খুলনা বিভাগ গাঙ্গেয় ব-দ্বীপের সমভূমি এবং দক্ষিণে বিশ্বের বৃহত্তম একক ম্যানগ্রোভ অরণ্য সুন্দরবনের জোয়ার-ভাটার জটিল নদী-খাল ও দ্বীপাঞ্চল নিয়ে গঠিত।',
    geography_en:
      'Covering southwestern Bangladesh along the Ganges Delta, Khulna Division transitions from fertile riverine plains to the tidal creeks, mudflats, and mangrove islands of the UNESCO-listed Sundarbans.',
    rivers_bn: 'ভৈরব, রূপসা, পশুর, গড়াই, মধুমতি, কপোতাক্ষ, বলেশ্বর',
    rivers_en: 'Bhairab, Rupsha, Pashur, Gorai, Madhumati, Kopotakkho, Baleshwar',
    climate_bn: 'নভেম্বর–মার্চ (সুন্দরবন ইকো-ক্রুজ ও ঐতিহাসিক মসজিদ দর্শনের আদর্শ মৌসুম)',
    climate_en: 'November–March (calm winter tides ideal for Sundarbans wildlife safaris & heritage tours)',
    culture_bn:
      'বাগেরহাটের সুলতানি যুগের খলিফাতাবাদ মসজিদ নগরী, বিশ্বকবি রবীন্দ্রনাথ ঠাকুরের শিলাইদহ কুঠিবাড়ি, মহাকবি মাইকেল মধুসূদন দত্ত ও ফকির লালন শাহ-র কুষ্টিয়া আখড়াবাড়ি এবং চুইঝাল ও গলদা-বাগদা রন্ধনশিল্প এ অঞ্চলের গর্ব।',
    culture_en:
      'Steeped in Khan Jahan Ali’s 15th-century mosque city of Khalifatabad, Lalon Fakir’s mystic Baul heritage in Kushtia, Rabindranath Tagore’s Shilaidaha Kuthibari, and famed Chuijhal cuisine.',
    heritage_highlights_bn: ['সুন্দরবন ইউনেস্কো বিশ্ব ঐতিহ্য', 'ষাট গম্বুজ মসজিদ (খলিফাতাবাদ)', 'লালন আখড়াবাড়ি ও শিলাইদহ কুঠিবাড়ি', 'জলজ ম্যানগ্রোভ ও বাউল ঐতিহ্য'],
    heritage_highlights_en: ['UNESCO Sundarbans Mangrove', 'Sixty Dome Mosque (Bagerhat)', 'Lalon Shrine & Tagore Kuthibari', 'Baul Music & Chuijhal Gastronomy']
  },
  rajshahi: {
    geography_bn:
      'উত্তর-পশ্চিমাঞ্চলের রাজশাহী বিভাগ পদ্মা ও যমুনা নদী বিধৌত এবং প্রাচীন বরেন্দ্র ভূমির উচ্চ লালমাটি, চলনবিল জলাভূমি ও সমতল উর্বর কৃষিজমি নিয়ে বিস্তৃত।',
    geography_en:
      'Located in northwestern Bangladesh, Rajshahi Division encompasses the elevated Pleistocene terraces of the ancient Barind Tract, the vast Chalan Beel wetlands, and the fertile Padma–Jamuna river basins.',
    rivers_bn: 'পদ্মা, যমুনা, আত্রাই, মহানন্দা, করতোয়া, বড়াল',
    rivers_en: 'Padma, Jamuna, Atrai, Mahananda, Karatoya, Baral',
    climate_bn: 'নভেম্বর–ফেব্রুয়ারি (প্রত্নস্থল ভ্রমণ); মে–জুলাই (চাঁপাইনবাবগঞ্জ ও রাজশাহীর আম উৎসব)',
    climate_en: 'Nov–Feb for archaeological heritage; May–Jul for the famed mango harvest season',
    culture_bn:
      'পুণ্ড্রবর্ধনের মহাস্থানগড়, পাহাড়পুর সোমপুর মহাবিহার, পুঠিয়া রাজবাড়ি ও পোড়ামাটির মন্দির, রাজশাহী রেশম শিল্প, গম্ভীরা লোকসংগীত এবং বগুড়ার দই ও আমের ঐতিহ্য এই বিভাগকে বাংলাদেশের সাংস্কৃতিক শিকড়ে পরিণত করেছে।',
    culture_en:
      'Cradle of ancient Bengal civilization featuring Mahasthangarh, Paharpur Somapura Mahavihara, Puthia terracotta temples, fine Rajshahi silk weaving, Gambhira folk theatre, and Bogura’s famous sweet curd.',
    heritage_highlights_bn: ['সোমপুর মহাবিহার (ইউনেস্কো ঐতিহ্য)', 'মহাস্থানগড় ও বেহুলার বাসরঘর', 'পুঠিয়া রাজবাড়ি ও মন্দির নগরী', 'রাজশাহী সিল্ক, আম ও বগুড়ার দই'],
    heritage_highlights_en: ['Somapura Mahavihara (UNESCO)', 'Ancient Mahasthangarh Citadel', 'Puthia Temple Complex', 'Rajshahi Silk, Mangoes & Curd']
  },
  barishal: {
    geography_bn:
      'দক্ষিণাঞ্চলের বরিশাল বিভাগ অসংখ্য নদী-শাখানদী, খাল ও দ্বীপের জালিকায় বোনা ‘বাংলার ভেনিস’—যেখানে উত্তরে মেঘনা-কীর্তনখোলার মোহনা এবং দক্ষিণে পটুয়াখালী ও ভোলার বঙ্গোপসাগর উপকূল অবস্থিত।',
    geography_en:
      'Known as the Venice of Bengal, Barishal Division is an intricate coastal delta crisscrossed by mighty estuaries, tranquil canals, river islands like Bhola, and the sandy shores of Kuakata on the Bay of Bengal.',
    rivers_bn: 'কীর্তনখোলা, মেঘনা, তেতুলিয়া, বিষখালী, বলেশ্বর, আড়িয়াল খাঁ, সন্ধ্যা',
    rivers_en: 'Kirtankhola, Meghna, Tetulia, Bishkhali, Baleshwar, Arial Khan, Sandhya',
    climate_bn: 'অক্টোবর–মার্চ (কুয়াকাটা সৈকত ও নদীবিহার); জুলাই–সেপ্টেম্বর (ভাসমান পেয়ারা বাজার)',
    climate_en: 'Oct–Mar for coastal beaches & river cruises; Jul–Sep for the floating guava markets',
    culture_bn:
      'ভিমরুলি ও আটঘর কুড়িয়ানার শতবর্ষী ভাসমান নৌকা বাজার, শাপলার বিল সাতলা, কুয়াকাটার রাখাইন সংস্কৃতি, কবি জীবনানন্দ দাশ ও কামিনী রায়ের সাহিত্যঐতিহ্য এবং বালাম চাল ও ইলিশ মাছের সংস্কৃতি এ অঞ্চলের প্রাণ।',
    culture_en:
      'Famous for century-old floating guava & vegetable markets in Jhalokati, Satla water-lily wetlands, Rakhine coastal heritage in Kuakata, literary legacy of Jibanananda Das, and abundant river Hilsa.',
    heritage_highlights_bn: ['কুয়াকাটা সূর্যোদয়-সূর্যাস্ত সৈকত', 'ভিমরুলি ভাসমান পেয়ারা বাজার', 'সাতলা লাল শাপলা বিল ও দুর্গাসাগর', 'গুঠিয়া মসজিদ ও মিয়াবাড়ি'],
    heritage_highlights_en: ['Kuakata Sunrise & Sunset Beach', 'Bhimruli Floating Guava Market', 'Satla Red Water-Lily Wetlands', 'Guthia Mosque & River Heritage']
  },
  rangpur: {
    geography_bn:
      'দেশের উত্তরাঞ্চলের রংপুর বিভাগ হিমালয়ের পাদদেশীয় সমভূমি, তিস্তা, ব্রহ্মপুত্র ও ধরলার অববাহিকা এবং পঞ্চগড়-তেঁতুলিয়ার সুবিস্তৃত সমতল চা বাগান ও শস্যক্ষেত্র নিয়ে গঠিত—যেখান থেকে পরিষ্কার শরৎ ও শীতে কাঞ্চনজঙ্ঘার চূড়া দেখা যায়।',
    geography_en:
      'Set on the sub-Himalayan piedmont plains of northern Bangladesh, Rangpur Division is watered by the Teesta, Brahmaputra, and Karatoya rivers, offering flat-land tea gardens in Panchagarh with clear-day views of Kanchenjunga.',
    rivers_bn: 'তিস্তা, ব্রহ্মপুত্র, ধরলা, করতোয়া, দুধকুমার, মহানন্দা, পুনর্ভবা',
    rivers_en: 'Teesta, Brahmaputra, Dharla, Karatoya, Dudhkumar, Mahananda, Punarbhaba',
    climate_bn: 'অক্টোবর–ফেব্রুয়ারি (কাঞ্চনজঙ্ঘা দর্শন, কান্তজিউ মন্দির ও রাজবাড়ি ভ্রমণের সেরা সময়)',
    climate_en: 'October–February (crisp northern skies for Kanchenjunga vistas & heritage exploration)',
    culture_bn:
      'দিনাজপুরের অষ্টাদশ শতকের কান্তজিউ টেরাকোটা মন্দির, রংপুরের তাজহাট রাজবাড়ি, নারী জাগরণের অগ্রদূত বেগম রোকেয়ার জন্মভূমি পায়রাবন্দ, ভাওয়াইয়া সংগীত ও শতরঞ্জি বুননশিল্প উত্তরবঙ্গের অমূল্য ঐতিহ্য।',
    culture_en:
      'Celebrated for the intricate terracotta craftsmanship of Kantajew Temple, Tajhat Palace, Begum Rokeya’s birthplace at Pairaband, soulful Bhawaiya folk songs, and traditional Shatranji handwoven rugs.',
    heritage_highlights_bn: ['কান্তজিউ টেরাকোটা মন্দির (দিনাজপুর)', 'তাজহাট জমিদার বাড়ি ও পায়রাবন্দ', 'তেঁতুলিয়া সমতল চা বাগান ও কাঞ্চনজঙ্ঘা', 'ভাওয়াইয়া সংগীত ও শতরঞ্জি শিল্প'],
    heritage_highlights_en: ['Kantajew Terracotta Temple', 'Tajhat Palace & Pairaband', 'Tetulia Tea Gardens & Kanchenjunga', 'Bhawaiya Folk & Shatranji Crafts']
  },
  mymensingh: {
    geography_bn:
      'ব্রহ্মপুত্র নদের অববাহিকায় অবস্থিত ময়মনসিংহ বিভাগ উত্তরে ভারতের মেঘালয় গারো পাহাড়ের পাদদেশ, নেত্রকোনার বিরিশিরি চীনামাটির পাহাড়, সোমেশ্বরী-কংস নদী ও শেরপুরের গজনী-মধুটিলা বনাঞ্চল দ্বারা সমৃদ্ধ।',
    geography_en:
      'Bordered by Meghalaya’s Garo Hills to the north and bisected by the Old Brahmaputra River, Mymensingh Division blends wooded foothill valleys, Susang Durgapur’s white ceramic clay hills, and riverine floodplains.',
    rivers_bn: 'পুরাতন ব্রহ্মপুত্র, সোমেশ্বরী, কংস, যমুনা, ভোগাই, ঝিনাই',
    rivers_en: 'Old Brahmaputra, Someshwari, Kangsha, Jamuna, Bhogai, Jhinai',
    climate_bn: 'অক্টোবর–মার্চ (বিরিশিরি নীল হ্রদ, গারো পাহাড় ও হাওর প্রান্ত ভ্রমণের সেরা সময়)',
    climate_en: 'October–March (ideal dry season when Birishiri’s lake glows bright turquoise)',
    culture_bn:
      'মৈমনসিংহ গীতিকা ও মহুয়া-মলুয়ার লোকসাহিত্য, শিল্পাচার্য জয়নুল আবেদিন সংগ্রহশালা, শশী লজ, গারো-হাজং-কোচ আদিবাসীদের ওয়ানগালা উৎসব এবং মুক্তাগাছার মণ্ডা ও নকশিকাঁথা এই বিভাগের সাংস্কৃতিক ঐশ্বর্য।',
    culture_en:
      'Home to the classic Mymensingh Gitika ballads, Zainul Abedin Sangrahashala, Shashi Lodge, Garo and Hajong indigenous Wangala harvest traditions, Nakshi Kantha embroidery, and famous Muktagacha Monda.',
    heritage_highlights_bn: ['বিরিশিরি চীনামাটির পাহাড় ও সোমেশ্বরী', 'শশী লজ ও জয়নুল আবেদিন সংগ্রহশালা', 'মৈমনসিংহ গীতিকা ও গারো সংস্কৃতি', 'মধুটিলা-গজনী ও মুক্তাগাছার মণ্ডা'],
    heritage_highlights_en: ['Birishiri Clay Hills & Someshwari', 'Shashi Lodge & Zainul Art Museum', 'Mymensingh Gitika & Garo Culture', 'Gajni Forest & Muktagacha Monda']
  }
};

function matchesDivisionRef(division: Division, ref?: string): boolean {
  if (!ref) return false;
  const target = ref.trim().toLowerCase();
  return (
    target === division.id.toLowerCase() ||
    (!!division.slug && target === division.slug.toLowerCase()) ||
    target === division.name_en.toLowerCase()
  );
}

function getRelevantTravelGuides(
  division: Division,
  divDistricts: District[],
  divSpots: TouristSpot[],
  articles: Article[]
): { guides: Article[]; isFallbackToNational: boolean } {
  const publishedArticles = articles.filter(a => a.is_published !== false);
  if (publishedArticles.length === 0) {
    return { guides: [], isFallbackToNational: false };
  }

  const districtIds = new Set(divDistricts.map(d => d.id.toLowerCase()));
  const spotIds = new Set(divSpots.map(s => s.id.toLowerCase()));
  const keywords = [
    division.id.toLowerCase(),
    (division.slug || '').toLowerCase(),
    division.name_en.toLowerCase(),
    division.name_bn.toLowerCase(),
    ...divDistricts.map(d => d.name_en.toLowerCase()),
    ...divDistricts.map(d => d.name_bn.toLowerCase()),
    ...divSpots.map(s => s.name_en.toLowerCase()),
    ...divSpots.map(s => s.name_bn.toLowerCase())
  ].filter(Boolean);

  const matched = publishedArticles.filter(article => {
    if (article.related_district_id && districtIds.has(article.related_district_id.toLowerCase())) {
      return true;
    }
    if (article.related_spot_id && spotIds.has(article.related_spot_id.toLowerCase())) {
      return true;
    }
    const searchable = [
      article.title_en,
      article.title_bn,
      article.excerpt_en,
      article.excerpt_bn,
      article.content_en,
      article.content_bn,
      ...(article.tags || [])
    ]
      .join(' ')
      .toLowerCase();
    return keywords.some(kw => kw.length > 2 && searchable.includes(kw));
  });

  if (matched.length > 0) {
    return { guides: matched, isFallbackToNational: false };
  }

  return { guides: publishedArticles.slice(0, 3), isFallbackToNational: true };
}

export function renderDivisionDetailPage(props: DivisionDetailPageProps): string {
  const {
    lang,
    requestedSlug,
    division,
    districts,
    spots,
    categories,
    articles,
    bookmarkedIds,
    selectedDistrictFilterId,
    isLoading,
    error
  } = props;

  const isBn = lang === 'bn';

  // Loading State
  if (isLoading) {
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'বাংলাদেশের ৮ বিভাগ', labelEn: '8 Divisions', url: '/divisions/' },
              { labelBn: 'লোড হচ্ছে...', labelEn: 'Loading...' }
            ],
            lang
          )}
        </div>
      </div>
      <section class="hero-wrapper" style="min-height: 300px; padding: 3rem 0;">
        <div class="container">
          <div class="placeholder-glow">
            <span class="placeholder col-3 bg-warning rounded-pill mb-3" style="height: 24px;"></span>
            <h1 class="placeholder col-6 bg-light rounded mb-3" style="height: 44px;"></h1>
            <p class="placeholder col-8 bg-light rounded opacity-50" style="height: 20px;"></p>
          </div>
        </div>
      </section>
      <div class="container py-5">
        <div class="row g-4">
          ${renderCardSkeleton(6, 'col-lg-4 col-md-6 mb-4')}
        </div>
      </div>
    `;
  }

  // Error or Missing Document / Invalid Slug State
  if (error || !division) {
    const cleanSlug = escapeHtml(requestedSlug || '');
    return `
      <div class="bg-white border-bottom">
        <div class="container py-2">
          ${renderBreadcrumbs(
            [
              { labelBn: 'বাংলাদেশের ৮ বিভাগ', labelEn: '8 Divisions', url: '/divisions/' },
              { labelBn: 'পাওয়া যায়নি', labelEn: 'Not Found' }
            ],
            lang
          )}
        </div>
      </div>
      <div class="container py-5">
        ${error
          ? renderErrorState({
              title: isBn ? 'বিভাগের তথ্য লোড করা যায়নি' : 'Failed to load division details',
              message: error,
              retryActionId: 'division-detail-retry-btn',
              lang
            })
          : `
            <div class="bg-white rounded-4 border shadow-sm p-4 p-md-5 text-center my-3">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning-emphasis mb-3" style="width: 72px; height: 72px;">
                <i class="bi bi-signpost-split fs-1"></i>
              </div>
              <span class="d-block badge bg-light text-secondary border mx-auto mb-2" style="width: fit-content;">
                404 • /divisions/${cleanSlug}/
              </span>
              <h1 class="fw-bold text-primary-bd mb-2 h2">
                ${isBn ? 'দুঃখিত, এই বিভাগটি খুঁজে পাওয়া যায়নি' : 'Division Not Found'}
              </h1>
              <p class="text-muted mx-auto mb-4" style="max-width: 580px;">
                ${isBn
                  ? `"${cleanSlug}" নামে বাংলাদেশের কোনো প্রশাসনিক বিভাগ পাওয়া যায়নি অথবা নথিটি বর্তমানে অপ্রকাশিত রয়েছে। নিচের বৈধ বিভাগসমূহ থেকে একটি বেছে নিন অথবা সকল বিভাগের পাতায় ফিরে যান।`
                  : `No published administrative division matched the slug "${cleanSlug}". Please verify the URL or select one of Bangladesh's 8 official divisions below.`}
              </p>
              <div class="d-flex flex-wrap justify-content-center gap-2 mb-4">
                <a href="/divisions/" class="btn btn-primary-bd px-4 py-2 rounded-pill" id="back-to-divisions-btn">
                  <i class="bi bi-grid-fill me-2"></i>${isBn ? 'সকল ৮ বিভাগ দেখুন' : 'Back to All 8 Divisions'}
                </a>
                <a href="/" class="btn btn-outline-bd px-4 py-2 rounded-pill division-home-link">
                  <i class="bi bi-house me-2"></i>${isBn ? 'মূলপাতায় ফিরুন' : 'Return Home'}
                </a>
              </div>
              <hr class="my-4">
              <div class="small text-secondary fw-semibold mb-3">
                ${isBn ? 'বাংলাদেশের ৮টি অফিসিয়াল বিভাগ:' : 'Official Divisions of Bangladesh:'}
              </div>
              <div class="d-flex flex-wrap justify-content-center gap-2">
                ${OFFICIAL_DIVISION_LINKS.map(item => `
                  <a href="/divisions/${item.slug}/" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
                    ${isBn ? item.nameBn : item.nameEn}
                  </a>
                `).join('')}
              </div>
            </div>
          `}
      </div>
    `;
  }

  // Resolved Division Metadata
  const divSlugKey = (division.slug || division.id || '').toLowerCase();
  const primaryName = isBn ? division.name_bn : division.name_en;
  const secondaryName = isBn ? division.name_en : division.name_bn;
  const divDesc = isBn ? division.description_bn : division.description_en;
  const divHq = isBn ? division.headquarters_bn : division.headquarters_en;
  const heroImg = optimizeImageUrl(division.image_url || FALLBACK_HERO_IMAGE, 1600);
  const heroThumb = optimizeImageUrl(division.image_url || FALLBACK_HERO_IMAGE, 900);

  // Districts & Spots filtered cleanly to this division
  const divDistricts = districts.filter(
    d => d.is_published !== false && matchesDivisionRef(division, d.division_id)
  );
  const allDivSpots = [...spots]
    .filter(s => s.is_published !== false && matchesDivisionRef(division, s.division_id))
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || (b.rating || 0) - (a.rating || 0));

  const activeFilterDistrict = selectedDistrictFilterId
    ? divDistricts.find(d => d.id === selectedDistrictFilterId) || null
    : null;

  const displayedSpots = activeFilterDistrict
    ? allDivSpots.filter(s => s.district_id === activeFilterDistrict.id)
    : allDivSpots;

  // Regional Geographic & Cultural Overview (Firestore optional fields override local official summary if present)
  const overviewFallback = REGIONAL_OVERVIEW_MAP[divSlugKey] || REGIONAL_OVERVIEW_MAP.dhaka;
  const divisionAny = division as Division & {
    geography_bn?: string;
    geography_en?: string;
    culture_bn?: string;
    culture_en?: string;
  };
  const geographyText = isBn
    ? divisionAny.geography_bn || overviewFallback.geography_bn
    : divisionAny.geography_en || overviewFallback.geography_en;
  const cultureText = isBn
    ? divisionAny.culture_bn || overviewFallback.culture_bn
    : divisionAny.culture_en || overviewFallback.culture_en;
  const riversText = isBn ? overviewFallback.rivers_bn : overviewFallback.rivers_en;
  const climateText = isBn ? overviewFallback.climate_bn : overviewFallback.climate_en;
  const regionalHighlights = isBn
    ? overviewFallback.heritage_highlights_bn
    : overviewFallback.heritage_highlights_en;

  // Aggregate unique famous-for cultural/culinary highlights from official districts
  const districtSpecialties = Array.from(
    new Set(
      divDistricts
        .map(d => (isBn ? d.famous_for_bn : d.famous_for_en))
        .filter(Boolean)
    )
  ).slice(0, 6);

  // Related Travel Guides
  const { guides: relatedGuides, isFallbackToNational } = getRelevantTravelGuides(
    division,
    divDistricts,
    allDivSpots,
    articles
  );

  const officialDistrictCount = division.districts_count || divDistricts.length;

  return `
    <!-- 1. Breadcrumb Navigation -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [
            { labelBn: 'বাংলাদেশের ৮ বিভাগ', labelEn: '8 Divisions', url: '/divisions/' },
            { labelBn: division.name_bn, labelEn: division.name_en }
          ],
          lang
        )}
      </div>
    </div>

    <!-- 2, 3 & 4. Division Hero Image, Bilingual Name (Bengali & English), and Introduction -->
    <section
      class="hero-wrapper"
      style="min-height: 410px; padding: 3.5rem 0; background: linear-gradient(135deg, rgba(18, 60, 50, 0.93) 0%, rgba(28, 89, 72, 0.80) 100%), url('${heroImg}') center/cover no-repeat;"
    >
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-7">
            <a href="/divisions/" class="btn btn-outline-light btn-sm rounded-pill px-3 mb-3 division-back-link">
              <i class="bi bi-arrow-left me-1"></i>${isBn ? 'সকল ৮ বিভাগ' : 'All 8 Divisions'}
            </a>

            <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
              <span class="hero-pill-badge mb-0">
                <i class="bi bi-building"></i>
                <span>${isBn ? 'বিভাগীয় সদর:' : 'Headquarters:'} ${escapeHtml(divHq)}</span>
              </span>
              <span class="badge bg-warning text-dark px-3 py-2 rounded-pill fw-semibold">
                ${escapeHtml(division.name_bn)} • ${escapeHtml(division.name_en)}
              </span>
            </div>

            <h1 class="hero-title mb-2">
              ${escapeHtml(primaryName)} ${isBn ? 'বিভাগ' : 'Division'}
            </h1>
            <p class="fs-5 text-warning fw-semibold mb-3 opacity-90">
              ${escapeHtml(secondaryName)} ${isBn ? 'Division' : 'বিভাগ'}
            </p>
            <p class="hero-subtitle mb-4">${escapeHtml(divDesc)}</p>

            <div class="d-flex flex-wrap gap-2">
              <a href="#division-districts-section" class="btn btn-accent px-4 py-2 rounded-pill">
                <i class="bi bi-geo-alt-fill me-1"></i>${formatLocalizedNumber(divDistricts.length || officialDistrictCount, lang)} ${isBn ? 'টি জেলা দেখুন' : 'Districts'}
              </a>
              <a href="#division-spots-section" class="btn btn-outline-light px-4 py-2 rounded-pill">
                <i class="bi bi-compass me-1"></i>${isBn ? 'দর্শনীয় স্থান' : 'Attractions'} (${formatLocalizedNumber(allDivSpots.length, lang)})
              </a>
              <a href="#division-guides-section" class="btn btn-outline-light px-3 py-2 rounded-pill">
                <i class="bi bi-journal-richtext me-1"></i>${isBn ? 'ভ্রমণ গাইড' : 'Travel Guides'}
              </a>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="rounded-4 overflow-hidden shadow-lg border border-light border-opacity-25 bg-dark">
              <div class="position-relative" style="height: 220px;">
                <img
                  src="${heroThumb}"
                  alt="${escapeHtml(division.name_en)} (${escapeHtml(division.name_bn)}) Division Panorama"
                  class="w-100 h-100"
                  style="object-fit: cover;"
                  loading="eager"
                  decoding="async"
                  onerror="this.onerror=null;this.src='${FALLBACK_HERO_IMAGE}';"
                >
                <div class="position-absolute bottom-0 start-0 end-0 p-3" style="background: linear-gradient(transparent, rgba(18, 60, 50, 0.92));">
                  <div class="small text-warning fw-semibold">
                    <i class="bi bi-pin-map-fill me-1"></i>${escapeHtml(division.name_bn)} — ${escapeHtml(division.name_en)}
                  </div>
                </div>
              </div>
              <div class="p-3 text-white" style="background: rgba(18, 60, 50, 0.95);">
                <div class="row g-2 text-center">
                  <div class="col-4">
                    <div class="fs-4 fw-bold text-warning">${formatLocalizedNumber(officialDistrictCount, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'জেলা' : 'Districts'}</div>
                  </div>
                  <div class="col-4 border-start border-end border-light border-opacity-25">
                    <div class="fs-4 fw-bold text-warning">${formatLocalizedNumber(allDivSpots.length, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'দর্শনীয় স্থান' : 'Attractions'}</div>
                  </div>
                  <div class="col-4">
                    <div class="fs-5 fw-bold text-warning pt-1">${formatAreaSqKm(division.area_sq_km, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'আয়তন' : 'Total Area'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. Geographic and Cultural Overview -->
    <section class="container py-5" id="division-overview-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill mb-2">
            <i class="bi bi-globe-asia-australia me-1"></i>${isBn ? 'আঞ্চলিক পরিচিতি' : 'Regional Profile'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? `${primaryName} বিভাগের ভৌগোলিক ও সাংস্কৃতিক পরিচয়` : `Geographic & Cultural Overview of ${primaryName}`}
          </h2>
          <p class="text-muted mb-0">
            ${isBn
              ? `${division.name_bn} (${division.name_en}) অঞ্চলের ভূপ্রকৃতি, নদ-নদী, ঐতিহ্য ও সাংস্কৃতিক বৈচিত্র্য।`
              : `Topography, river systems, living traditions, and heritage across ${division.name_en} (${division.name_bn}) Division.`}
          </p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="bg-white rounded-4 border shadow-sm p-4 h-100">
            <div class="d-flex align-items-center gap-2 mb-3">
              <div class="rounded-3 bg-success-subtle text-success p-2 d-inline-flex align-items-center justify-content-center">
                <i class="bi bi-map-fill fs-5"></i>
              </div>
              <h3 class="h5 fw-bold text-primary-bd mb-0">
                ${isBn ? 'ভৌগোলিক অবস্থান ও প্রকৃতি' : 'Geography & Natural Landscape'}
              </h3>
            </div>
            <p class="text-secondary mb-3">${escapeHtml(geographyText)}</p>

            <div class="p-3 rounded-3 bg-light border mb-2">
              <div class="small fw-bold text-primary-bd mb-1">
                <i class="bi bi-water text-info me-1"></i>${isBn ? 'প্রধান নদ-নদী ও জলপথ:' : 'Major Rivers & Waterways:'}
              </div>
              <div class="small text-secondary">${escapeHtml(riversText)}</div>
            </div>
            <div class="p-3 rounded-3 bg-light border">
              <div class="small fw-bold text-primary-bd mb-1">
                <i class="bi bi-sun text-warning me-1"></i>${isBn ? 'ভ্রমণের সেরা মৌসুম:' : 'Best Season to Visit:'}
              </div>
              <div class="small text-secondary">${escapeHtml(climateText)}</div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="bg-white rounded-4 border shadow-sm p-4 h-100">
            <div class="d-flex align-items-center gap-2 mb-3">
              <div class="rounded-3 bg-warning-subtle text-warning-emphasis p-2 d-inline-flex align-items-center justify-content-center">
                <i class="bi bi-stars fs-5"></i>
              </div>
              <h3 class="h5 fw-bold text-primary-bd mb-0">
                ${isBn ? 'সংস্কৃতি, ঐতিহ্য ও জীবনধারা' : 'Culture, Heritage & Traditions'}
              </h3>
            </div>
            <p class="text-secondary mb-3">${escapeHtml(cultureText)}</p>

            <div class="mb-3">
              <div class="small fw-bold text-primary-bd mb-2">
                <i class="bi bi-award text-warning me-1"></i>${isBn ? 'উল্লেখযোগ্য সাংস্কৃতিক ও ঐতিহ্যবাহী আকর্ষণ:' : 'Signature Cultural Highlights:'}
              </div>
              <div class="d-flex flex-wrap gap-2">
                ${regionalHighlights.map(item => `
                  <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                    ${escapeHtml(item)}
                  </span>
                `).join('')}
              </div>
            </div>

            ${districtSpecialties.length > 0 ? `
              <div class="pt-2 border-top">
                <div class="small fw-bold text-primary-bd mb-2">
                  <i class="bi bi-cup-hot text-accent-bd me-1"></i>${isBn ? 'জেলাভিত্তিক বিখ্যাত ঐতিহ্য ও খাবার:' : 'District Culinary & Craft Specialties:'}
                </div>
                <div class="small text-secondary">${districtSpecialties.map(s => escapeHtml(s)).join(' • ')}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </section>

    <!-- 6 & 7. All Districts Belonging to This Division & District Cards with Images -->
    <section class="container py-4 pb-5" id="division-districts-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-primary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${formatLocalizedNumber(divDistricts.length, lang)} ${isBn ? 'টি অফিসিয়াল জেলা' : 'Official Districts'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? `${primaryName} বিভাগের সকল জেলাসমূহ` : `All Districts of ${primaryName} Division`}
          </h2>
          <p class="text-muted mb-0">
            ${isBn
              ? `${division.name_bn} বিভাগের প্রশাসনিক কাঠামোভুক্ত প্রতিটি জেলার পরিচিতি, বিখ্যাত ঐতিহ্য ও দর্শনীয় স্থান।`
              : `Complete official administrative directory of all ${divDistricts.length} districts in ${division.name_en} Division.`}
          </p>
        </div>
        ${activeFilterDistrict ? `
          <button class="btn btn-outline-bd btn-sm rounded-pill px-3" id="clear-district-spot-filter-btn">
            <i class="bi bi-x-circle me-1"></i>${isBn ? 'সকল জেলার স্পট দেখুন' : 'Show All Division Spots'}
          </button>
        ` : ''}
      </div>

      ${divDistricts.length === 0 ? `
        ${renderEmptyState({
          titleBn: 'কোনো জেলা পাওয়া যায়নি',
          titleEn: 'No Districts Listed',
          descBn: 'এই বিভাগের জেলাসমূহের তথ্য ফায়ারস্টোরে পাওয়া যায়নি।',
          descEn: 'No published district records were found for this division.',
          icon: 'bi-geo-alt',
          lang
        })}
      ` : `
        <div class="row g-3">
          ${divDistricts
            .map(dist => {
              const spotsInDist = allDivSpots.filter(s => s.district_id === dist.id).length;
              return renderDistrictCard({
                district: dist,
                division,
                spotCount: spotsInDist,
                lang
              });
            })
            .join('')}
        </div>
      `}
    </section>

    <!-- 8. Popular Tourist Attractions in This Division -->
    <section class="container py-4 pb-5" id="division-spots-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 rounded-pill mb-2">
            ${isBn ? 'শীর্ষ দর্শনীয় স্থান' : 'Popular Attractions'}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${activeFilterDistrict
              ? (isBn
                  ? `${activeFilterDistrict.name_bn} জেলার দর্শনীয় স্থানসমূহ`
                  : `Tourist Attractions in ${activeFilterDistrict.name_en} District`)
              : (isBn
                  ? `${primaryName} বিভাগের জনপ্রিয় দর্শনীয় স্থানসমূহ`
                  : `Popular Tourist Attractions in ${primaryName}`)}
          </h2>
          <p class="text-muted mb-0">
            ${activeFilterDistrict
              ? (isBn
                  ? `${activeFilterDistrict.name_bn} জেলার প্রকাশিত পর্যটন গন্তব্যসমূহ নিচে প্রদর্শিত হচ্ছে।`
                  : `Showing published attractions located in ${activeFilterDistrict.name_en} District.`)
              : (isBn
                  ? `${division.name_bn} বিভাগের প্রকৃতি, ঐতিহাসিক স্থাপনা ও নির্বাচিত ভ্রমণ আকর্ষণ।`
                  : `Explore top-rated landmarks, eco-reserves, and cultural treasures across ${division.name_en} Division.`)}
          </p>
        </div>
        ${activeFilterDistrict ? `
          <button class="btn btn-outline-bd btn-sm rounded-pill px-3" id="clear-district-spot-filter-btn-2">
            <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? `${primaryName} বিভাগের সব স্পট` : `All ${primaryName} Attractions`}
          </button>
        ` : ''}
      </div>

      ${displayedSpots.length === 0 ? `
        ${renderEmptyState({
          titleBn: activeFilterDistrict
            ? `${activeFilterDistrict.name_bn} জেলায় প্রকাশিত স্পট নেই`
            : 'এই বিভাগে কোনো প্রকাশিত স্পট পাওয়া যায়নি',
          titleEn: activeFilterDistrict
            ? `No Published Spots Listed in ${activeFilterDistrict.name_en}`
            : 'No Published Attractions Found in This Division',
          descBn: activeFilterDistrict
            ? 'এই জেলার নির্দিষ্ট স্পট এখনো যুক্ত হয়নি। পুরো বিভাগের দর্শনীয় স্থানসমূহ দেখতে ফিল্টার মুছুন।'
            : 'এই বিভাগের দর্শনীয় স্থানের তালিকা শীঘ্রই ফায়ারস্টোরে যুক্ত করা হবে।',
          descEn: activeFilterDistrict
            ? 'Clear the district filter to explore all published tourist attractions in this division.'
            : 'Curated destinations for this division are being updated in Firestore.',
          actionTextBn: activeFilterDistrict ? 'সকল স্পট দেখুন' : undefined,
          actionTextEn: activeFilterDistrict ? 'View All Division Spots' : undefined,
          actionId: activeFilterDistrict ? 'clear-district-spot-filter-empty-btn' : undefined,
          icon: 'bi-pin-map',
          lang
        })}
      ` : `
        <div class="row g-4">
          ${displayedSpots
            .map(spot => {
              const district = districts.find(d => d.id === spot.district_id);
              const category = categories.find(c => spot.category_ids?.includes(c.id));
              return renderDestinationCard({
                spot,
                division,
                district,
                category,
                isBookmarked: bookmarkedIds.has(spot.id),
                lang
              });
            })
            .join('')}
        </div>
      `}
    </section>

    <!-- 9. Related Travel Guides -->
    <section class="container py-4 pb-5" id="division-guides-section">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-secondary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${isFallbackToNational
              ? (isBn ? 'নির্বাচিত বাংলাদেশ ভ্রমণ গাইড' : 'Featured Bangladesh Guides')
              : (isBn ? `${primaryName} ভ্রমণ সহায়িকা` : `${primaryName} Travel Guides`)}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? 'সম্পর্কিত ভ্রমণ নির্দেশিকা ও নিবন্ধ' : 'Related Travel Guides'}
          </h2>
          <p class="text-muted mb-0">
            ${isFallbackToNational
              ? (isBn
                  ? `${division.name_bn} ভ্রমণের পাশাপাশি দেশব্যাপী ভ্রমণ পরিকল্পনা ও রন্ধনশিল্প গাইড পড়ুন।`
                  : `Recommended nationwide itineraries, eco-travel tips, and cultural guides to complement your ${division.name_en} journey.`)
              : (isBn
                  ? `${division.name_bn} বিভাগের গন্তব্য, রুট ও অভিজ্ঞতার ওপর বিশেষজ্ঞ ভ্রমণ নিবন্ধ।`
                  : `Curated articles, itineraries, and cultural stories connected to ${division.name_en} Division.`)}
          </p>
        </div>
        <a href="/#guides" class="btn btn-outline-bd btn-sm rounded-pill px-3">
          <i class="bi bi-journal-text me-1"></i>${isBn ? 'সকল ভ্রমণ গাইড' : 'All Travel Guides'}
        </a>
      </div>

      ${relatedGuides.length === 0 ? `
        ${renderEmptyState({
          titleBn: 'কোনো ভ্রমণ গাইড পাওয়া যায়নি',
          titleEn: 'No Related Travel Guides Found',
          descBn: 'এই বিভাগের জন্য ভ্রমণ নির্দেশিকা শীঘ্রই প্রকাশ করা হবে।',
          descEn: 'Travel guides for this region will be published soon.',
          icon: 'bi-journal-richtext',
          lang
        })}
      ` : `
        <div class="row g-4">
          ${relatedGuides
            .map(art => `
              <div class="col-lg-4 col-md-6">
                <article class="card-travel h-100 d-flex flex-column">
                  <div class="card-travel-img-box" style="height: 190px;">
                    <img
                      src="${optimizeImageUrl(art.image_url, 600)}"
                      alt="${escapeHtml(isBn ? art.title_bn : art.title_en)}"
                      class="card-travel-img"
                      loading="lazy"
                      decoding="async"
                      onerror="this.onerror=null;this.src='${FALLBACK_HERO_IMAGE}';"
                    >
                    <span class="card-badge-rating">
                      <i class="bi bi-clock me-1"></i>${escapeHtml(isBn ? art.read_time_bn : art.read_time_en)}
                    </span>
                  </div>
                  <div class="card-travel-body d-flex flex-column flex-grow-1">
                    <div class="small text-muted mb-2 d-flex justify-content-between align-items-center">
                      <span><i class="bi bi-person me-1"></i>${escapeHtml(isBn ? art.author_bn : art.author_en)}</span>
                      <span>${escapeHtml(art.published_at || '')}</span>
                    </div>
                    <h3 class="card-travel-title fw-bold mb-2" style="font-size: 1.08rem;">
                      ${escapeHtml(isBn ? art.title_bn : art.title_en)}
                    </h3>
                    <p class="card-travel-desc small flex-grow-1 mb-3">
                      ${escapeHtml(isBn ? art.excerpt_bn : art.excerpt_en)}
                    </p>
                    <div class="d-flex flex-wrap gap-1 mb-3">
                      ${(art.tags || []).slice(0, 3).map(tag => `
                        <span class="badge bg-light text-secondary border small">${escapeHtml(tag)}</span>
                      `).join('')}
                    </div>
                    <button class="btn btn-outline-bd btn-sm w-100 mt-auto article-detail-btn" data-article-id="${escapeHtml(art.id)}">
                      <i class="bi bi-book-half me-1"></i>${isBn ? 'বিস্তারিত পড়ুন' : 'Read Guide'}
                    </button>
                  </div>
                </article>
              </div>
            `)
            .join('')}
        </div>
      `}
    </section>
  `;
}
