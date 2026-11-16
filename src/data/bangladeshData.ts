/**
 * Complete Official Administrative Data and Tourist Content for Bangladesh
 * All 8 Divisions, 64 Districts, Categories, Verified Tourist Spots, and Articles
 */

export interface Division {
  id: string;
  name_en: string;
  name_bn: string;
  slug: string;
  description_en: string;
  description_bn: string;
  headquarters_en: string;
  headquarters_bn: string;
  area_sq_km: number;
  districts_count: number;
  image_url: string;
  thumbnail_url?: string;
  seo_title_en?: string;
  seo_title_bn?: string;
  seo_description_en?: string;
  seo_description_bn?: string;
  is_published: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface District {
  id: string;
  division_id: string;
  name_en: string;
  name_bn: string;
  slug: string;
  description_en: string;
  description_bn: string;
  famous_for_en: string;
  famous_for_bn: string;
  image_url: string;
  latitude?: number;
  longitude?: number;
  seo_title_en?: string;
  seo_title_bn?: string;
  seo_description_en?: string;
  seo_description_bn?: string;
  is_published: boolean;
  popular_spots_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name_en: string;
  name_bn: string;
  slug: string;
  icon: string;
  image_url?: string;
  description_en: string;
  description_bn: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TouristSpot {
  id: string;
  division_id: string;
  district_id: string;
  category_ids: string[];
  name_en: string;
  name_bn: string;
  slug: string;
  short_desc_en: string;
  short_desc_bn: string;
  overview_en: string;
  overview_bn: string;
  history_en: string;
  history_bn: string;
  how_to_go_en: string;
  how_to_go_bn: string;
  best_time_en: string;
  best_time_bn: string;
  tips_en: string;
  tips_bn: string;
  image_url: string;
  gallery_urls: string[];
  google_maps_url?: string;
  estimated_cost_en?: string;
  estimated_cost_bn?: string;
  entry_fee_en?: string;
  entry_fee_bn?: string;
  opening_hours_en?: string;
  opening_hours_bn?: string;
  seo_title_en?: string;
  seo_title_bn?: string;
  seo_description_en?: string;
  seo_description_bn?: string;
  rating: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Article {
  id: string;
  title_en: string;
  title_bn: string;
  slug: string;
  excerpt_en: string;
  excerpt_bn: string;
  content_en: string;
  content_bn: string;
  author_en: string;
  author_bn: string;
  image_url: string;
  category_id?: string;
  read_time_en: string;
  read_time_bn: string;
  related_district_id: string;
  related_spot_id?: string;
  tags: string[];
  seo_title_en?: string;
  seo_title_bn?: string;
  seo_description_en?: string;
  seo_description_bn?: string;
  is_published: boolean;
  status?: 'published' | 'draft' | 'scheduled';
  scheduled_at?: string;
  published_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleCategoryDefinition {
  id:
    | 'travel-tips'
    | 'budget-travel'
    | 'family-travel'
    | 'adventure-travel'
    | 'historical-travel'
    | 'destination-guides'
    | 'seasonal-travel';
  name_en: string;
  name_bn: string;
  icon: string;
  description_en: string;
  description_bn: string;
}

export const ARTICLE_CATEGORIES: ReadonlyArray<ArticleCategoryDefinition> = [
  {
    id: 'travel-tips',
    name_en: 'Travel Tips',
    name_bn: 'ভ্রমণ টিপস',
    icon: 'bi-lightbulb-fill',
    description_en: 'Practical packing, permit, safety, and local etiquette advice.',
    description_bn: 'নিরাপদ ভ্রমণ, অনুমতি, প্যাকিং ও স্থানীয় আচরণবিধি সংক্রান্ত ব্যবহারিক পরামর্শ।'
  },
  {
    id: 'budget-travel',
    name_en: 'Budget Travel',
    name_bn: 'বাজেট ভ্রমণ',
    icon: 'bi-wallet2',
    description_en: 'Cost-effective transport routes, stays, and value itineraries.',
    description_bn: 'সাশ্রয়ী যাতায়াত রুট, আবাসন ও কম খরচে ভ্রমণের কার্যকর পরিকল্পনা।'
  },
  {
    id: 'family-travel',
    name_en: 'Family Travel',
    name_bn: 'পরিবার নিয়ে ভ্রমণ',
    icon: 'bi-people-fill',
    description_en: 'Comfortable, kid-friendly, and accessible trips for families.',
    description_bn: 'পরিবার ও শিশুদের উপযোগী আরামদায়ক এবং নিরাপদ ভ্রমণ গন্তব্য ও নির্দেশিকা।'
  },
  {
    id: 'adventure-travel',
    name_en: 'Adventure Travel',
    name_bn: 'অ্যাডভেঞ্চার ভ্রমণ',
    icon: 'bi-compass-fill',
    description_en: 'Hill treks, mangrove safaris, boat expeditions, and outdoor thrills.',
    description_bn: 'পাহাড়ি ট্রেকিং, ম্যানগ্রোভ সাফারি, জলপথ অভিযান ও রোমাঞ্চকর ভ্রমণ গল্প।'
  },
  {
    id: 'historical-travel',
    name_en: 'Historical Travel',
    name_bn: 'ঐতিহাসিক ভ্রমণ',
    icon: 'bi-bank2',
    description_en: 'Heritage walks, archaeological ruins, mosques, and cultural history.',
    description_bn: 'প্রাচীন ঐতিহ্য, প্রত্নতাত্ত্বিক নিদর্শন, ঐতিহাসিক স্থাপত্য ও সাংস্কৃতিক ইতিহাস।'
  },
  {
    id: 'destination-guides',
    name_en: 'Destination Guides',
    name_bn: 'গন্তব্য গাইড',
    icon: 'bi-map-fill',
    description_en: 'In-depth route plans and complete handbooks for Bangladesh regions.',
    description_bn: 'বাংলাদেশের উল্লেখযোগ্য গন্তব্যগুলোর বিস্তারিত রুট প্ল্যান ও সম্পূর্ণ ভ্রমণ সহায়িকা।'
  },
  {
    id: 'seasonal-travel',
    name_en: 'Seasonal Travel',
    name_bn: 'মৌসুমি ভ্রমণ',
    icon: 'bi-cloud-sun-fill',
    description_en: 'Monsoon haor cruises, winter hill escapes, and seasonal calendars.',
    description_bn: 'বর্ষার হাওর, শীতের পাহাড় ও ঋতুভেদে ভ্রমণের সেরা সময়সূচি ও প্রস্তুতি।'
  }
];

export interface MediaItem {
  id: string;
  url: string;
  file_name: string;
  alt_en: string;
  alt_bn: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  updated_at?: string;
}

// 8 Official Administrative Divisions
export const DIVISIONS: Division[] = [
  {
    id: "dhaka",
    name_en: "Dhaka",
    name_bn: "ঢাকা",
    slug: "dhaka",
    description_en: "Central administrative division of Bangladesh along the Buriganga and Padma rivers, comprising 13 districts including the capital city.",
    description_bn: "বুড়িগঙ্গা ও পদ্মা নদীর অববাহিকায় অবস্থিত বাংলাদেশের কেন্দ্রীয় বিভাগ, যা রাজধানী ঢাকাসহ ১৩টি জেলা নিয়ে গঠিত।",
    headquarters_en: "Dhaka",
    headquarters_bn: "ঢাকা",
    area_sq_km: 20593.74,
    districts_count: 13,
    image_url: "",
    thumbnail_url: "",
    seo_title_en: "Dhaka Division (ঢাকা) - 13 Districts & Heritage | Beautiful Bangladesh",
    seo_title_bn: "ঢাকা বিভাগ - ১৩টি জেলা ও ভ্রমণ পরিচিতি | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore all 13 districts of Dhaka Division including Dhaka, Gazipur, Narayanganj, Tangail, and Kishoreganj with verified travel and heritage highlights.",
    seo_description_bn: "ঢাকা বিভাগের অন্তর্ভুক্ত ঢাকা, গাজীপুর, নারায়ণগঞ্জ, টাঙ্গাইল ও কিশোরগঞ্জসহ সকল ১৩টি জেলার পরিচিতি ও ঐতিহাসিক নিদর্শন।",
    is_published: true,
    order: 1
  },
  {
    id: "chattogram",
    name_en: "Chattogram",
    name_bn: "চট্টগ্রাম",
    slug: "chattogram",
    description_en: "Southeastern division of Bangladesh uniting Bay of Bengal coastlines, Cox's Bazar, and the Chittagong Hill Tracts across 11 districts.",
    description_bn: "বঙ্গোপসাগরের উপকূল, কক্সবাজার এবং পার্বত্য চট্টগ্রামের পাহাড়ি অঞ্চল নিয়ে ১১টি জেলাসমৃদ্ধ বাংলাদেশের দক্ষিণ-পূর্বাঞ্চলীয় বিভাগ।",
    headquarters_en: "Chattogram",
    headquarters_bn: "চট্টগ্রাম",
    area_sq_km: 33908.55,
    districts_count: 11,
    image_url: "",
    thumbnail_url: "",
    seo_title_en: "Chattogram Division (চট্টগ্রাম) - 11 Districts, Beaches & Hills | Beautiful Bangladesh",
    seo_title_bn: "চট্টগ্রাম বিভাগ - ১১টি জেলা, সমুদ্র ও পাহাড় | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover all 11 districts of Chattogram Division including Cox's Bazar, Bandarban, Rangamati, Khagrachhari, and Cumilla.",
    seo_description_bn: "কক্সবাজার, বান্দরবান, রাঙামাটি, খাগড়াছড়ি ও কুমিল্লাসহ চট্টগ্রাম বিভাগের ১১টি জেলার ভ্রমণ ও ভৌগোলিক পরিচিতি।",
    is_published: true,
    order: 2
  },
  {
    id: "sylhet",
    name_en: "Sylhet",
    name_bn: "সিলেট",
    slug: "sylhet",
    description_en: "Northeastern division of 4 districts characterized by tea estates, Surma-Kushiyara floodplains, freshwater swamp forests, and haor wetlands.",
    description_bn: "চা বাগান, সুরমা-কুশিয়ারা নদী অববাহিকা, জলমগ্ন সোয়াম্প বন ও বিস্তীর্ণ হাওরবেষ্টিত ৪টি জেলা নিয়ে গঠিত উত্তর-পূর্বাঞ্চলীয় বিভাগ।",
    headquarters_en: "Sylhet",
    headquarters_bn: "সিলেট",
    area_sq_km: 12635.22,
    districts_count: 4,
    image_url: "",
    thumbnail_url: "",
    seo_title_en: "Sylhet Division (সিলেট) - 4 Districts, Tea Estates & Haors | Beautiful Bangladesh",
    seo_title_bn: "সিলেট বিভাগ - ৪টি জেলা, চা বাগান ও হাওর | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore the 4 districts of Sylhet Division—Sylhet, Moulvibazar, Habiganj, and Sunamganj—featuring tea valleys, Lawachara, and Tanguar Haor.",
    seo_description_bn: "সিলেট, মৌলভীবাজার, হবিগঞ্জ ও সুনামগঞ্জ—সিলেট বিভাগের ৪টি জেলার চা বাগান, লাউয়াছড়া ও টাঙ্গুয়ার হাওরের পরিচিতি।",
    is_published: true,
    order: 3
  },
  {
    id: "khulna",
    name_en: "Khulna",
    name_bn: "খুলনা",
    slug: "khulna",
    description_en: "Southwestern deltaic division of 10 districts, gateway to the UNESCO Sundarbans mangrove forest and historic Khalifatabad mosque heritage.",
    description_bn: "ইউনেস্কো বিশ্ব ঐতিহ্য সুন্দরবন ও ঐতিহাসিক মসজিদ স্থাপত্যসমৃদ্ধ ১০টি জেলা নিয়ে গঠিত দক্ষিণ-পশ্চিমাঞ্চলীয় বিভাগ।",
    headquarters_en: "Khulna",
    headquarters_bn: "খুলনা",
    area_sq_km: 22284.22,
    districts_count: 10,
    image_url: "",
    thumbnail_url: "",
    seo_title_en: "Khulna Division (খুলনা) - 10 Districts & Sundarbans Gateway | Beautiful Bangladesh",
    seo_title_bn: "খুলনা বিভাগ - ১০টি জেলা ও সুন্দরবন প্রবেশদ্বার | অপরূপ বাংলাদেশ",
    seo_description_en: "Browse all 10 districts of Khulna Division including Khulna, Bagerhat, Satkhira, Jashore, Kushtia, and Meherpur.",
    seo_description_bn: "খুলনা, বাগেরহাট, সাতক্ষীরা, যশোর, কুষ্টিয়া ও মেহেরপুরসহ খুলনা বিভাগের ১০টি জেলার ভ্রমণ ও ঐতিহাসিক তথ্য।",
    is_published: true,
    order: 4
  },
  {
    id: "rajshahi",
    name_en: "Rajshahi",
    name_bn: "রাজশাহী",
    slug: "rajshahi",
    description_en: "Northwestern Barind division along the Padma and Jamuna rivers comprising 8 districts rich in archaeological ruins and mango orchards.",
    description_bn: "পদ্মা ও যমুনা অববাহিকা এবং প্রাচীন বরেন্দ্র ভূমির ৮টি জেলা নিয়ে গঠিত প্রত্নতাত্ত্বিক নিদর্শন ও আম্রকাননসমৃদ্ধ বিভাগ।",
    headquarters_en: "Rajshahi",
    headquarters_bn: "রাজশাহী",
    area_sq_km: 18153.08,
    districts_count: 8,
    image_url: "",
    thumbnail_url: "",
    seo_title_en: "Rajshahi Division (রাজশাহী) - 8 Districts & Ancient Heritage | Beautiful Bangladesh",
    seo_title_bn: "রাজশাহী বিভাগ - ৮টি জেলা ও প্রাচীন ঐতিহ্য | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover all 8 districts of Rajshahi Division including Rajshahi, Bogura, Naogaon, Natore, Pabna, and Chapainawabganj.",
    seo_description_bn: "রাজশাহী, বগুড়া, নওগাঁ, নাটোর, পাবনা ও চাঁপাইনবাবগঞ্জসহ রাজশাহী বিভাগের ৮টি জেলার পরিচিতি।",
    is_published: true,
    order: 5
  },
  {
    id: "barishal",
    name_en: "Barishal",
    name_bn: "বরিশাল",
    slug: "barishal",
    description_en: "Southern riverine and coastal division of 6 districts crisscrossed by estuaries, island waterways, and Kuakata on the Bay of Bengal.",
    description_bn: "নদী, খাল, দ্বীপাঞ্চল ও কুয়াকাটা সমুদ্র সৈকতসমৃদ্ধ ৬টি জেলা নিয়ে গঠিত বাংলাদেশের দক্ষিণাঞ্চলীয় বিভাগ।",
    headquarters_en: "Barishal",
    headquarters_bn: "বরিশাল",
    area_sq_km: 13225.20,
    districts_count: 6,
    image_url: "",
    thumbnail_url: "",
    seo_title_en: "Barishal Division (বরিশাল) - 6 Riverine & Coastal Districts | Beautiful Bangladesh",
    seo_title_bn: "বরিশাল বিভাগ - ৬টি নদীমাতৃক ও উপকূলীয় জেলা | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore all 6 districts of Barishal Division—Barishal, Patuakhali, Bhola, Pirojpur, Barguna, and Jhalakathi.",
    seo_description_bn: "বরিশাল, পটুয়াখালী, ভোলা, পিরোজপুর, বরগুনা ও ঝালকাঠি—বরিশাল বিভাগের ৬টি জেলার সম্পূর্ণ পরিচিতি।",
    is_published: true,
    order: 6
  },
  {
    id: "rangpur",
    name_en: "Rangpur",
    name_bn: "রংপুর",
    slug: "rangpur",
    description_en: "Northernmost division of 8 districts across the Teesta and Brahmaputra plains, home to Kantajew Temple, Tajhat Palace, and Tentulia.",
    description_bn: "তিস্তা ও ব্রহ্মপুত্র অববাহিকার ৮টি জেলা নিয়ে গঠিত দেশের উত্তরবঙ্গ বিভাগ, যা কান্তজিউ মন্দির, তাজহাট ও তেঁতুলিয়ার জন্য পরিচিত।",
    headquarters_en: "Rangpur",
    headquarters_bn: "রংপুর",
    area_sq_km: 16184.99,
    districts_count: 8,
    image_url: "",
    thumbnail_url: "",
    seo_title_en: "Rangpur Division (রংপুর) - 8 Northern Districts | Beautiful Bangladesh",
    seo_title_bn: "রংপুর বিভাগ - উত্তরবঙ্গের ৮টি জেলা ও দর্শনীয় স্থান | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore all 8 districts of Rangpur Division including Rangpur, Dinajpur, Panchagarh, Thakurgaon, and Nilphamari.",
    seo_description_bn: "রংপুর, দিনাজপুর, পঞ্চগড়, ঠাকুরগাঁও ও নীলফামারীসহ রংপুর বিভাগের সকল ৮টি জেলার বিস্তারিত পরিচিতি।",
    is_published: true,
    order: 7
  },
  {
    id: "mymensingh",
    name_en: "Mymensingh",
    name_bn: "ময়মনসিংহ",
    slug: "mymensingh",
    description_en: "North-central division of 4 districts bounded by the Garo foothills and Old Brahmaputra River, noted for Mymensingh Gitika and Birishiri.",
    description_bn: "পুরাতন ব্রহ্মপুত্র নদ ও গারো পাহাড়ের পাদদেশে অবস্থিত ৪টি জেলা নিয়ে গঠিত বিভাগ, যা মৈমনসিংহ গীতিকা ও বিরিশিরির জন্য খ্যাত।",
    headquarters_en: "Mymensingh",
    headquarters_bn: "ময়মনসিংহ",
    area_sq_km: 10584.06,
    districts_count: 4,
    image_url: "",
    thumbnail_url: "",
    seo_title_en: "Mymensingh Division (ময়মনসিংহ) - 4 Districts & Foothills | Beautiful Bangladesh",
    seo_title_bn: "ময়মনসিংহ বিভাগ - ৪টি জেলা ও গারো পাহাড় | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover the 4 districts of Mymensingh Division—Mymensingh, Netrokona, Sherpur, and Jamalpur—along with Birishiri and Madhutila.",
    seo_description_bn: "ময়মনসিংহ, নেত্রকোনা, শেরপুর ও জামালপুর—ময়মনসিংহ বিভাগের ৪টি জেলার ঐতিহ্য ও প্রাকৃতিক সৌন্দর্য।",
    is_published: true,
    order: 8
  }
];

// All 64 Official Districts of Bangladesh (Accurately partitioned by Division)
export const DISTRICTS: District[] = [
  // Dhaka Division (13 districts)
  {
    id: "dhaka_dist",
    division_id: "dhaka",
    name_en: "Dhaka",
    name_bn: "ঢাকা",
    slug: "dhaka",
    description_en: "The capital district of Bangladesh along the Buriganga River, home to Lalbagh Fort, Ahsan Manzil, and historic Old Dhaka.",
    description_bn: "বুড়িগঙ্গা নদীর তীরে অবস্থিত বাংলাদেশের রাজধানী জেলা, যেখানে লালবাগ কেল্লা, আহসান মঞ্জিল ও ঐতিহাসিক পুরান ঢাকা অবস্থিত।",
    famous_for_en: "Lalbagh Fort, Ahsan Manzil, Dhakai Biryani & Bakarkhani",
    famous_for_bn: "লালবাগ কেল্লা, আহসান মঞ্জিল, ঢাকাই বিরিয়ানি ও বাকরখানি",
    image_url: "",
    seo_title_en: "Dhaka District (ঢাকা) - Heritage & Travel Guide | Beautiful Bangladesh",
    seo_title_bn: "ঢাকা জেলা - ইতিহাস, দর্শনীয় স্থান ও ভ্রমণ গাইড | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Dhaka District in Dhaka Division: Lalbagh Fort, Ahsan Manzil, Old Dhaka culinary heritage, and cultural landmarks.",
    seo_description_bn: "ঢাকা জেলার লালবাগ কেল্লা, আহসান মঞ্জিল, ঐতিহাসিক স্থাপনা ও ভ্রমণ সংক্রান্ত তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "gazipur",
    division_id: "dhaka",
    name_en: "Gazipur",
    name_bn: "গাজীপুর",
    slug: "gazipur",
    description_en: "District just north of Dhaka featuring Bhawal National Park's Sal forests and the Turag–Shitalakshya river basin.",
    description_bn: "ঢাকার উত্তরে অবস্থিত জেলা, যা ভাওয়াল জাতীয় উদ্যানের শালবন ও তুরাগ-শীতলক্ষ্যা অববাহিকার জন্য পরিচিত।",
    famous_for_en: "Bhawal National Park & Sal Forest Heritage",
    famous_for_bn: "ভাওয়াল জাতীয় উদ্যান ও শালবন",
    image_url: "",
    seo_title_en: "Gazipur District (গাজীপুর) - Bhawal Forest & Travel Guide | Beautiful Bangladesh",
    seo_title_bn: "গাজীপুর জেলা - ভাওয়াল উদ্যান ও ভ্রমণ গাইড | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Gazipur District in Dhaka Division, including Bhawal National Park, Sal forests, and nearby natural retreats.",
    seo_description_bn: "ঢাকা বিভাগের গাজীপুর জেলার ভাওয়াল জাতীয় উদ্যান, শালবন ও দর্শনীয় স্থানের তথ্য।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "narayanganj",
    division_id: "dhaka",
    name_en: "Narayanganj",
    name_bn: "নারায়ণগঞ্জ",
    slug: "narayanganj",
    description_en: "River port district on the Shitalakshya River containing historic Sonargaon, Panam Nagar, and traditional Jamdani weaving.",
    description_bn: "শীতলক্ষ্যা তীরবর্তী ঐতিহাসিক জেলা, যেখানে প্রাচীন সোনারগাঁও, পানাম নগর ও ঐতিহ্যবাহী জামদানি বয়নশিল্প অবস্থিত।",
    famous_for_en: "Sonargaon Panam Nagar & Jamdani Weaving",
    famous_for_bn: "সোনারগাঁও পানাম নগর ও জামদানি শিল্প",
    image_url: "",
    seo_title_en: "Narayanganj District (নারায়ণগঞ্জ) - Sonargaon & Jamdani | Beautiful Bangladesh",
    seo_title_bn: "নারায়ণগঞ্জ জেলা - সোনারগাঁও, পানাম নগর ও জামদানি | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Narayanganj District in Dhaka Division, home to historic Sonargaon, Panam City, and UNESCO-recognized Jamdani craft.",
    seo_description_bn: "নারায়ণগঞ্জ জেলার প্রাচীন সোনারগাঁও, পানাম নগর ও জামদানি ঐতিহ্য সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "tangail",
    division_id: "dhaka",
    name_en: "Tangail",
    name_bn: "টাঙ্গাইল",
    slug: "tangail",
    description_en: "Home to traditional Tangail handloom sarees, Porabari Chamcham, the 17th-century Atia Mosque, and Madhupur National Park.",
    description_bn: "ঐতিহ্যবাহী টাঙ্গাইল তাঁতের শাড়ি, পোড়াবাড়ির চমচম, ১৭শ শতাব্দীর আতিয়া মসজিদ ও মধুপুর শালবনের জন্য পরিচিত জেলা।",
    famous_for_en: "Tangail Handloom Sarees, Atia Mosque & Porabari Chamcham",
    famous_for_bn: "টাঙ্গাইল শাড়ি, আতিয়া মসজিদ ও পোড়াবাড়ির চমচম",
    image_url: "",
    seo_title_en: "Tangail District (টাঙ্গাইল) - Handloom Heritage & Madhupur | Beautiful Bangladesh",
    seo_title_bn: "টাঙ্গাইল জেলা - তাঁতশিল্প, আতিয়া মসজিদ ও মধুপুর | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Tangail District in Dhaka Division: Atia Mosque, Madhupur forest, Tangail sarees, and Porabari Chamcham.",
    seo_description_bn: "টাঙ্গাইল জেলার আতিয়া মসজিদ, মধুপুর বনাঞ্চল ও ঐতিহ্যবাহী তাঁতশিল্প সম্পর্কে বিস্তারিত জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "kishoreganj",
    division_id: "dhaka",
    name_en: "Kishoreganj",
    name_bn: "কিশোরগঞ্জ",
    slug: "kishoreganj",
    description_en: "Haor-basin district featuring Nikli and Ashtagram wetlands, Isa Khan's Jangalbari Fort, and Chandrabati's temple heritage.",
    description_bn: "নিকলী ও অষ্টগ্রাম হাওর, ঈশা খাঁর জঙ্গলবাড়ি দুর্গ ও মধ্যযুগীয় কবি চন্দ্রাবতীর স্মৃতিবিজড়িত হাওর-সমৃদ্ধ জেলা।",
    famous_for_en: "Nikli & Ashtagram Haors, Jangalbari Fort & Ashtagram Cheese",
    famous_for_bn: "নিকলী ও অষ্টগ্রাম হাওর, জঙ্গলবাড়ি ও অষ্টগ্রামের পনির",
    image_url: "",
    seo_title_en: "Kishoreganj District (কিশোরগঞ্জ) - Nikli Haor & Heritage | Beautiful Bangladesh",
    seo_title_bn: "কিশোরগঞ্জ জেলা - নিকলী হাওর ও জঙ্গলবাড়ি ঐতিহ্য | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Kishoreganj District in Dhaka Division, known for Nikli Haor, Ashtagram wetlands, and Jangalbari Fort.",
    seo_description_bn: "কিশোরগঞ্জ জেলার নিকলী হাওর, অষ্টগ্রাম পনির ও ঐতিহাসিক জঙ্গলবাড়ি দুর্গ সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "manikganj",
    division_id: "dhaka",
    name_en: "Manikganj",
    name_bn: "মানিকগঞ্জ",
    slug: "manikganj",
    description_en: "Riverine district west of Dhaka featuring Baliati Palace, Teota Jamidar Bari, and winter date palm jaggery.",
    description_bn: "ঢাকার পশ্চিমে অবস্থিত নদীবিধৌত জেলা, যেখানে বালিয়াটি জমিদার প্রাসাদ, তেওতা জমিদার বাড়ি ও শীতের খেজুর গুড় অবস্থিত।",
    famous_for_en: "Baliati Palace, Teota Jamidar Bari & Date Palm Jaggery",
    famous_for_bn: "বালিয়াটি প্রাসাদ, তেওতা জমিদার বাড়ি ও খেজুরের গুড়",
    image_url: "",
    seo_title_en: "Manikganj District (মানিকগঞ্জ) - Baliati Palace & Heritage | Beautiful Bangladesh",
    seo_title_bn: "মানিকগঞ্জ জেলা - বালিয়াটি প্রাসাদ ও তেওতা ঐতিহ্য | অপরূপ বাংলাদেশ",
    seo_description_en: "Visit Manikganj District in Dhaka Division: Baliati Zamindar Palace, Teota estate, and Padma riverfront plains.",
    seo_description_bn: "মানিকগঞ্জ জেলার বালিয়াটি প্রাসাদ, তেওতা জমিদার বাড়ি ও ভ্রমণ তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "munshiganj",
    division_id: "dhaka",
    name_en: "Munshiganj",
    name_bn: "মুন্সীগঞ্জ",
    slug: "munshiganj",
    description_en: "Historic Bikrampur region along the Padma and Meghna rivers, featuring Idrakpur Fort and Mawa on the Padma Bridge corridor.",
    description_bn: "পদ্মা ও মেঘনা বিধৌত প্রাচীন বিক্রমপুর অঞ্চল, যেখানে ইদ্রাকপুর দুর্গ ও পদ্মা সেতুর মাওয়া প্রান্ত অবস্থিত।",
    famous_for_en: "Bikrampur Heritage, Idrakpur Fort & Padma Riverfront",
    famous_for_bn: "বিক্রমপুর ঐতিহ্য, ইদ্রাকপুর দুর্গ ও মাওয়া পদ্মা তীর",
    image_url: "",
    seo_title_en: "Munshiganj District (মুন্সীগঞ্জ) - Bikrampur & Idrakpur Fort | Beautiful Bangladesh",
    seo_title_bn: "মুন্সীগঞ্জ জেলা - বিক্রমপুর ও ইদ্রাকপুর দুর্গ | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Munshiganj District in Dhaka Division: ancient Bikrampur, Idrakpur Fort, and the Padma River crossing at Mawa.",
    seo_description_bn: "মুন্সীগঞ্জ জেলার প্রাচীন বিক্রমপুর ঐতিহ্য, ইদ্রাকপুর কেল্লা ও পদ্মা নদী সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "narsingdi",
    division_id: "dhaka",
    name_en: "Narsingdi",
    name_bn: "নরসিংদী",
    slug: "narsingdi",
    description_en: "Site of the ancient Wari-Bateshwar archaeological excavations, Meghna River floodplains, and traditional Sagar Kola cultivation.",
    description_bn: "প্রাচীন উয়ারী-বটেশ্বর প্রত্নতাত্ত্বিক নিদর্শন, মেঘনা নদীর অববাহিকা ও ঐতিহ্যবাহী অমৃত সাগর কলার জন্য পরিচিত জেলা।",
    famous_for_en: "Wari-Bateshwar Archaeological Site & Amrit Sagar Banana",
    famous_for_bn: "উয়ারী-বটেশ্বর প্রত্নক্ষেত্র ও অমৃত সাগর কলা",
    image_url: "",
    seo_title_en: "Narsingdi District (নরসিংদী) - Wari-Bateshwar Ruins | Beautiful Bangladesh",
    seo_title_bn: "নরসিংদী জেলা - উয়ারী-বটেশ্বর ও সাগর কলা | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Narsingdi District in Dhaka Division, home to the Wari-Bateshwar archaeological site and Meghna riverbanks.",
    seo_description_bn: "নরসিংদী জেলার উয়ারী-বটেশ্বর প্রত্নতাত্ত্বিক নিদর্শন ও মেঘনা তীরবর্তী পরিচিতি জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "faridpur",
    division_id: "dhaka",
    name_en: "Faridpur",
    name_bn: "ফরিদপুর",
    slug: "faridpur",
    description_en: "Padma-basin district associated with rural poet Jasimuddin's ancestral home in Ambikapur and the shrine of Shah Farid.",
    description_bn: "পদ্মা নদী বিধৌত জেলা, যেখানে অম্বিকাপুরে পল্লিকবি জসীম উদ্দীনের পৈতৃক বাড়ি ও শাহ ফরিদের মাজার অবস্থিত।",
    famous_for_en: "Poet Jasimuddin Memorial & River Char Landscapes",
    famous_for_bn: "পল্লিকবি জসীম উদ্দীনের বাড়ি ও পদ্মার চরাঞ্চল",
    image_url: "",
    seo_title_en: "Faridpur District (ফরিদপুর) - Jasimuddin Heritage & Padma | Beautiful Bangladesh",
    seo_title_bn: "ফরিদপুর জেলা - কবি জসীম উদ্দীন স্মৃতি ও পদ্মা তীর | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Faridpur District in Dhaka Division: Poet Jasimuddin's Ambikapur home, heritage sites, and Padma river plains.",
    seo_description_bn: "ফরিদপুর জেলার পল্লিকবি জসীম উদ্দীনের স্মৃতিবাড়ি ও ঐতিহাসিক স্থাপনা সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "gopalganj",
    division_id: "dhaka",
    name_en: "Gopalganj",
    name_bn: "গোপালগঞ্জ",
    slug: "gopalganj",
    description_en: "Southern Dhaka Division district along the Madhumati River, housing Tungipara Memorial Complex and rural wetland beels.",
    description_bn: "মধুমতি নদীর তীরে অবস্থিত ঢাকা বিভাগের দক্ষিণ-পশ্চিম অংশের জেলা, যেখানে টুঙ্গিপাড়া ও গ্রামীণ বিল অঞ্চল অবস্থিত।",
    famous_for_en: "Tungipara Heritage & Madhumati River",
    famous_for_bn: "টুঙ্গিপাড়া ও মধুমতি নদী",
    image_url: "",
    seo_title_en: "Gopalganj District (গোপালগঞ্জ) - Tungipara & Madhumati | Beautiful Bangladesh",
    seo_title_bn: "গোপালগঞ্জ জেলা - টুঙ্গিপাড়া ও মধুমতি নদী | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Gopalganj District in Dhaka Division along the Madhumati River, including Tungipara and rural riverine wetlands.",
    seo_description_bn: "ঢাকা বিভাগের গোপালগঞ্জ জেলার টুঙ্গিপাড়া, মধুমতি নদী ও আঞ্চলিক পরিচিতি জানুন।",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "madaripur",
    division_id: "dhaka",
    name_en: "Madaripur",
    name_bn: "মাদারীপুর",
    slug: "madaripur",
    description_en: "Deltaic district along the Arial Khan River known for Shakuni Lake and traditional date palm patali jaggery.",
    description_bn: "আড়িয়াল খাঁ নদীর তীরবর্তী জেলা, যা শকুনী লেক ও ঐতিহ্যবাহী খেজুরের পাটালি গুড়ের জন্য পরিচিত।",
    famous_for_en: "Shakuni Lake & Palm Patali Gur",
    famous_for_bn: "শকুনী লেক ও পাটালি গুড়",
    image_url: "",
    seo_title_en: "Madaripur District (মাদারীপুর) - Shakuni Lake & Arial Khan | Beautiful Bangladesh",
    seo_title_bn: "মাদারীপুর জেলা - শকুনী লেক ও পাটালি গুড় | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Madaripur District in Dhaka Division, featuring Shakuni Lake, Arial Khan waterways, and local culinary heritage.",
    seo_description_bn: "মাদারীপুর জেলার শকুনী লেক, আড়িয়াল খাঁ নদী ও স্থানীয় ঐতিহ্য সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "rajbari",
    division_id: "dhaka",
    name_en: "Rajbari",
    name_bn: "রাজবাড়ী",
    slug: "rajbari",
    description_en: "Padma-river district connected with Goalanda Ghat river history, Mir Mosharraf Hossain's heritage at Padamdi, and Pangsha Chamcham.",
    description_bn: "গোয়ালন্দ ঘাটের ইতিহাস, পদমদীতে মীর মশাররফ হোসেনের স্মৃতিকেন্দ্র এবং পাংশার চমচমের জন্য পরিচিত পদ্মাপাড়ের জেলা।",
    famous_for_en: "Mir Mosharraf Memorial & Goalanda River Heritage",
    famous_for_bn: "মীর মশাররফ স্মৃতিকেন্দ্র ও গোয়ালন্দ ঘাট ঐতিহ্য",
    image_url: "",
    seo_title_en: "Rajbari District (রাজবাড়ী) - Goalanda & Literary Heritage | Beautiful Bangladesh",
    seo_title_bn: "রাজবাড়ী জেলা - মীর মশাররফ স্মৃতি ও গোয়ালন্দ | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Rajbari District in Dhaka Division: Mir Mosharraf Hossain Memorial at Padamdi and the historic Padma confluence.",
    seo_description_bn: "রাজবাড়ী জেলার মীর মশাররফ হোসেন স্মৃতিকেন্দ্র, গোয়ালন্দ ও পদ্মা নদী সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "shariatpur",
    division_id: "dhaka",
    name_en: "Shariatpur",
    name_bn: "শরীয়তপুর",
    slug: "shariatpur",
    description_en: "Named after reformist Haji Shariatullah, located at the southern Zajira approach of the Padma Bridge between the Padma and Meghna rivers.",
    description_bn: "হাজী শরীয়তুল্লাহর নামে নামকরণকৃত এবং পদ্মা-মেঘনা পরিবেষ্টিত জেলা, যেখানে পদ্মা সেতুর দক্ষিণ জাজিরা প্রান্ত অবস্থিত।",
    famous_for_en: "Padma Bridge Zajira Point & Rudrakar Math",
    famous_for_bn: "পদ্মা সেতু জাজিরা প্রান্ত ও রুদ্রকর মঠ",
    image_url: "",
    seo_title_en: "Shariatpur District (শরীয়তপুর) - Padma Riverfront & Heritage | Beautiful Bangladesh",
    seo_title_bn: "শরীয়তপুর জেলা - পদ্মা সেতু জাজিরা ও ঐতিহাসিক স্থান | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Shariatpur District in Dhaka Division, featuring the Padma Bridge Zajira corridor and Rudrakar heritage.",
    seo_description_bn: "শরীয়তপুর জেলার পদ্মা সেতু সংযোগ, রুদ্রকর মঠ ও নদীতীরবর্তী পরিচিতি জানুন।",
    is_published: true,
    popular_spots_count: 2
  },

  // Chattogram Division (11 districts)
  {
    id: "coxs_bazar",
    division_id: "chattogram",
    name_en: "Cox's Bazar",
    name_bn: "কক্সবাজার",
    slug: "coxs-bazar",
    description_en: "Coastal district home to the world's longest unbroken natural sandy beach, Himchari cliffs, Inani Beach, and Saint Martin's Island.",
    description_bn: "বিশ্বের দীর্ঘতম অবিচ্ছিন্ন প্রাকৃতিক বালুকাময় সমুদ্র সৈকত, হিমছড়ি, ইনানী ও সেন্টমার্টিন প্রবাল দ্বীপসমৃদ্ধ উপকূলীয় জেলা।",
    famous_for_en: "World's Longest Sea Beach & Saint Martin's Island",
    famous_for_bn: "দীর্ঘতম সমুদ্র সৈকত ও সেন্টমার্টিন প্রবাল দ্বীপ",
    image_url: "",
    seo_title_en: "Cox's Bazar District (কক্সবাজার) - Sea Beach & Coral Island | Beautiful Bangladesh",
    seo_title_bn: "কক্সবাজার জেলা - সমুদ্র সৈকত, ইনানী ও সেন্টমার্টিন | অপরূপ বাংলাদেশ",
    seo_description_en: "Plan a trip to Cox's Bazar District in Chattogram Division: Cox's Bazar Sea Beach, Marine Drive, Himchari, Inani, and Saint Martin's.",
    seo_description_bn: "কক্সবাজার জেলার সমুদ্র সৈকত, মেরিন ড্রাইভ, হিমছড়ি, ইনানী ও সেন্টমার্টিন দ্বীপ ভ্রমণের সম্পূর্ণ গাইড।",
    is_published: true,
    popular_spots_count: 10
  },
  {
    id: "chattogram_dist",
    division_id: "chattogram",
    name_en: "Chattogram",
    name_bn: "চট্টগ্রাম",
    slug: "chattogram",
    description_en: "Maritime port city district featuring Patenga Beach, Foy's Lake, Shrine of Bayazid Bostami, Sitakunda hills, and Karnaphuli River.",
    description_bn: "বন্দরনগরী চট্টগ্রাম জেলায় পতেঙ্গা সমুদ্র সৈকত, ফয়'স লেক, সীতাকুণ্ড পাহাড় ও কর্ণফুলী নদীর মোহনা অবস্থিত।",
    famous_for_en: "Patenga Sea Beach, Sitakunda Hills & Mezban Cuisine",
    famous_for_bn: "পতেঙ্গা সৈকত, সীতাকুণ্ড পাহাড় ও মেজবানি ঐতিহ্য",
    image_url: "",
    seo_title_en: "Chattogram District (চট্টগ্রাম) - Port City, Patenga & Hills | Beautiful Bangladesh",
    seo_title_bn: "চট্টগ্রাম জেলা - বন্দরনগরী, পতেঙ্গা ও সীতাকুণ্ড | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Chattogram District: Patenga Beach, Foy's Lake, Sitakunda eco-hills, and maritime heritage.",
    seo_description_bn: "চট্টগ্রাম জেলার পতেঙ্গা সৈকত, ফয়'স লেক, সীতাকুণ্ড ও কর্ণফুলী তীরের দর্শনীয় স্থানসমূহ দেখুন।",
    is_published: true,
    popular_spots_count: 7
  },
  {
    id: "bandarban",
    division_id: "chattogram",
    name_en: "Bandarban",
    name_bn: "বান্দরবান",
    slug: "bandarban",
    description_en: "Chittagong Hill Tracts district known for Nilgiri, Keokradong, Boga Lake, Nafakhum waterfall, and indigenous hill communities.",
    description_bn: "পার্বত্য চট্টগ্রামের পাহাড়ি জেলা, যেখানে নীলগিরি, কেওক্রাডং, বগা লেক, নাফাখুম জলপ্রপাত ও বৈচিত্র্যময় নৃগোষ্ঠীর সংস্কৃতি রয়েছে।",
    famous_for_en: "Nilgiri, Boga Lake, Keokradong & Nafakhum Waterfall",
    famous_for_bn: "নীলগিরি, বগা লেক, কেওক্রাডং ও নাফাখুম জলপ্রপাত",
    image_url: "",
    seo_title_en: "Bandarban District (বান্দরবান) - Hill Peaks, Boga Lake & Waterfalls | Beautiful Bangladesh",
    seo_title_bn: "বান্দরবান জেলা - নীলগিরি, বগা লেক ও জলপ্রপাত | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Bandarban District in Chattogram Division: Nilgiri, Boga Lake, Keokradong, Sangu River, and Nafakhum Waterfall.",
    seo_description_bn: "বান্দরবান জেলার নীলগিরি, বগা লেক, নাফাখুম ঝর্ণা ও পাহাড়ি ভ্রমণের বিস্তারিত তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "rangamati",
    division_id: "chattogram",
    name_en: "Rangamati",
    name_bn: "রাঙামাটি",
    slug: "rangamati",
    description_en: "Hill district centered on Kaptai Lake, Hanging Bridge, Shuvolong Waterfall, and Sajek Valley in Baghaichhari Upazila.",
    description_bn: "কাপ্তাই হ্রদ, ঝুলন্ত সেতু, শুভলং ঝর্ণা এবং বাঘাইছড়ি উপজেলার অন্তর্ভুক্ত সাজেক ভ্যালিসমৃদ্ধ পার্বত্য জেলা।",
    famous_for_en: "Kaptai Lake, Sajek Valley & Hanging Bridge",
    famous_for_bn: "কাপ্তাই হ্রদ, সাজেক ভ্যালি ও ঝুলন্ত সেতু",
    image_url: "",
    seo_title_en: "Rangamati District (রাঙামাটি) - Kaptai Lake & Sajek Valley | Beautiful Bangladesh",
    seo_title_bn: "রাঙামাটি জেলা - কাপ্তাই হ্রদ, সাজেক ভ্যালি ও ঝুলন্ত সেতু | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Rangamati District in Chattogram Division: Kaptai Lake, Hanging Bridge, Shuvolong Waterfall, and Sajek Valley.",
    seo_description_bn: "রাঙামাটি জেলার কাপ্তাই হ্রদ, সাজেক ভ্যালি, শুভলং ঝর্ণা ও ঝুলন্ত সেতুর ভ্রমণ গাইড পড়ুন।",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "khagrachhari",
    division_id: "chattogram",
    name_en: "Khagrachhari",
    name_bn: "খাগড়াছড়ি",
    slug: "khagrachhari",
    description_en: "Northern Chittagong Hill Tracts district featuring Alutila natural cave, Richhang Waterfall, and main road access toward Sajek.",
    description_bn: "প্রাকৃতিক আলুটিলা গুহা, রিছাং ঝর্ণা এবং সাজেক ভ্যালি গমনের প্রধান সড়ক পথসমৃদ্ধ পার্বত্য জেলা।",
    famous_for_en: "Alutila Cave & Richhang Waterfall",
    famous_for_bn: "আলুটিলা গুহা ও রিছাং ঝর্ণা",
    image_url: "",
    seo_title_en: "Khagrachhari District (খাগড়াছড়ি) - Alutila Cave & Richhang | Beautiful Bangladesh",
    seo_title_bn: "খাগড়াছড়ি জেলা - আলুটিলা গুহা ও রিছাং ঝর্ণা | অপরূপ বাংলাদেশ",
    seo_description_en: "Visit Khagrachhari District in Chattogram Division: Alutila Cave, Richhang Waterfall, and hill viewpoints.",
    seo_description_bn: "খাগড়াছড়ি জেলার আলুটিলা গুহা, রিছাং ঝর্ণা ও পাহাড়ি পর্যটন কেন্দ্র সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "cumilla",
    division_id: "chattogram",
    name_en: "Cumilla",
    name_bn: "কুমিল্লা",
    slug: "cumilla",
    description_en: "Historic district home to Mainamati's 8th-century Shalban Vihara Buddhist ruins, Dharmasagar tank, Khadi textiles, and Rasmalai.",
    description_bn: "ময়নামতির অষ্টম শতকের শালবন বৌদ্ধ বিহার, ধর্মসাগর দিঘি, খাদি বস্ত্র এবং ঐতিহ্যবাহী রসমালাইয়ের জন্য প্রসিদ্ধ জেলা।",
    famous_for_en: "Shalban Vihara, Khadi Textiles & Rasmalai",
    famous_for_bn: "শালবন বিহার, খাদি বস্ত্র ও কুমিল্লার রসমালাই",
    image_url: "",
    seo_title_en: "Cumilla District (কুমিল্লা) - Mainamati Shalban Vihara & Heritage | Beautiful Bangladesh",
    seo_title_bn: "কুমিল্লা জেলা - ময়নামতি শালবন বিহার ও ঐতিহ্য | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Cumilla District in Chattogram Division: Mainamati archaeological ruins, Shalban Vihara, Dharmasagar, and Rasmalai.",
    seo_description_bn: "কুমিল্লা জেলার ময়নামতি শালবন বিহার, ধর্মসাগর ও ঐতিহাসিক নিদর্শন সম্পর্কে বিস্তারিত জানুন।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "brahmanbaria",
    division_id: "chattogram",
    name_en: "Brahmanbaria",
    name_bn: "ব্রাহ্মণবাড়িয়া",
    slug: "brahmanbaria",
    description_en: "Cultural center linked with Ustad Alauddin Khan's musical heritage, Kalbhairav Temple, and its famed Chhanamukhi sweet.",
    description_bn: "ওস্তাদ আলাউদ্দিন খাঁর সঙ্গীত ঐতিহ্য, কালভৈরব মন্দির এবং ঐতিহ্যবাহী ছানামুখী মিষ্টির জন্য সুপরিচিত জেলা।",
    famous_for_en: "Classical Music Heritage & Chhanamukhi Sweet",
    famous_for_bn: "সঙ্গীত ঐতিহ্য ও ছানামুখী মিষ্টি",
    image_url: "",
    seo_title_en: "Brahmanbaria District (ব্রাহ্মণবাড়িয়া) - Music Heritage & Chhanamukhi | Beautiful Bangladesh",
    seo_title_bn: "ব্রাহ্মণবাড়িয়া জেলা - সঙ্গীত ঐতিহ্য ও ছানামুখী | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Brahmanbaria District in Chattogram Division: classical music legacy of Ustad Alauddin Khan, Titas river, and Chhanamukhi.",
    seo_description_bn: "ব্রাহ্মণবাড়িয়া জেলার সঙ্গীত ঐতিহ্য, তিতাস নদী ও ছানামুখী মিষ্টির পরিচিতি জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "feni",
    division_id: "chattogram",
    name_en: "Feni",
    name_bn: "ফেনী",
    slug: "feni",
    description_en: "Southeastern district featuring the Muhuri Irrigation Project and regulator, Bijoy Singh Dighi, and coastal plains.",
    description_bn: "মনোরম মুহুরী সেচ প্রকল্প ও রেগুলেটর, ঐতিহাসিক বিজয় সিংহ দিঘি ও সমতল ভূপ্রকৃতির জন্য পরিচিত জেলা।",
    famous_for_en: "Muhuri Project & Bijoy Singh Dighi",
    famous_for_bn: "মুহুরী প্রজেক্ট ও বিজয় সিংহ দিঘি",
    image_url: "",
    seo_title_en: "Feni District (ফেনী) - Muhuri Project & Bijoy Singh Dighi | Beautiful Bangladesh",
    seo_title_bn: "ফেনী জেলা - মুহুরী প্রজেক্ট ও বিজয় সিংহ দিঘি | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Feni District in Chattogram Division including the Muhuri Dam Project and Bijoy Singh Dighi.",
    seo_description_bn: "চট্টগ্রাম বিভাগের ফেনী জেলার মুহুরী প্রজেক্ট ও বিজয় সিংহ দিঘির পরিচিতি জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "noakhali",
    division_id: "chattogram",
    name_en: "Noakhali",
    name_bn: "নোয়াখালী",
    slug: "noakhali",
    description_en: "Coastal district featuring Nijhum Dwip island wildlife sanctuary at Hatiya, Gandhi Ashram at Joyag, and 18th-century Bajra Shahi Mosque.",
    description_bn: "হাতিয়ার নিঝুম দ্বীপ বন্যপ্রাণী অভয়ারণ্য, জয়াগের গান্ধী আশ্রম ও ১৮শ শতাব্দীর বজরা শাহী মসজিদসমৃদ্ধ উপকূলীয় জেলা।",
    famous_for_en: "Nijhum Dwip Deer Sanctuary, Bajra Mosque & Gandhi Ashram",
    famous_for_bn: "নিঝুম দ্বীপ, বজরা শাহী মসজিদ ও গান্ধী আশ্রম",
    image_url: "",
    seo_title_en: "Noakhali District (নোয়াখালী) - Nijhum Dwip & Bajra Mosque | Beautiful Bangladesh",
    seo_title_bn: "নোয়াখালী জেলা - নিঝুম দ্বীপ ও বজরা শাহী মসজিদ | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Noakhali District in Chattogram Division: Nijhum Dwip National Park, Bajra Shahi Mosque, and Gandhi Ashram.",
    seo_description_bn: "নোয়াখালী জেলার নিঝুম দ্বীপ, বজরা শাহী মসজিদ ও গান্ধী আশ্রম সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "lakshmipur",
    division_id: "chattogram",
    name_en: "Lakshmipur",
    name_bn: "লক্ষ্মীপুর",
    slug: "lakshmipur",
    description_en: "Lower Meghna estuary district known for Dalal Bazar Jamidar Bari, Khoa Sagar Dighi, and riverine fisheries.",
    description_bn: "নিম্ন মেঘনা মোহনাতীরবর্তী জেলা, যা দালাল বাজার জমিদার বাড়ি, খোয়া সাগর দিঘি ও মেঘনার ইলিশের জন্য পরিচিত।",
    famous_for_en: "Dalal Bazar Jamidar Bari & Meghna Estuary",
    famous_for_bn: "দালাল বাজার জমিদার বাড়ি ও মেঘনার ইলিশ",
    image_url: "",
    seo_title_en: "Lakshmipur District (লক্ষ্মীপুর) - Dalal Bazar & Meghna River | Beautiful Bangladesh",
    seo_title_bn: "লক্ষ্মীপুর জেলা - দালাল বাজার ও মেঘনা মোহনা | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Lakshmipur District in Chattogram Division: Dalal Bazar Jamidar Bari, Khoa Sagar Dighi, and Meghna estuary.",
    seo_description_bn: "লক্ষ্মীপুর জেলার দালাল বাজার জমিদার বাড়ি, খোয়া সাগর দিঘি ও মেঘনা তীরের তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "chandpur",
    division_id: "chattogram",
    name_en: "Chandpur",
    name_bn: "চাঁদপুর",
    slug: "chandpur",
    description_en: "River-port district situated at the Padma–Meghna–Dakatia confluence (Boro Station Mohona) and celebrated for Padma-Meghna Hilsa.",
    description_bn: "পদ্মা, মেঘনা ও ডাকাতিয়া নদীর মোহনায় (বড় স্টেশন মোলহেড) অবস্থিত এবং রূপালী ইলিশের জন্য বিখ্যাত নদীবন্দর জেলা।",
    famous_for_en: "Three-River Confluence (Mohona) & Hilsa Fish",
    famous_for_bn: "তিন নদীর মোহনা ও চাঁদপুরের ইলিশ",
    image_url: "",
    seo_title_en: "Chandpur District (চাঁদপুর) - River Confluence & Hilsa Capital | Beautiful Bangladesh",
    seo_title_bn: "চাঁদপুর জেলা - তিন নদীর মোহনা ও রূপালী ইলিশ | অপরূপ বাংলাদেশ",
    seo_description_en: "Visit Chandpur District in Chattogram Division at the Padma-Meghna-Dakatia confluence and discover Bangladesh's Hilsa hub.",
    seo_description_bn: "চাঁদপুর জেলার বড় স্টেশন তিন নদীর মোহনা ও ইলিশ ঐতিহ্য সম্পর্কে বিস্তারিত জানুন।",
    is_published: true,
    popular_spots_count: 3
  },

  // Sylhet Division (4 districts)
  {
    id: "sylhet_dist",
    division_id: "sylhet",
    name_en: "Sylhet",
    name_bn: "সিলেট",
    slug: "sylhet",
    description_en: "Northeastern cultural hub housing Hazrat Shah Jalal's shrine, Ratargul Freshwater Swamp Forest, Jaflong, and Bisnakhandi.",
    description_bn: "হযরত শাহজালাল (রহ.)-এর মাজার, রাতারগুল সোয়াম্প ফরেস্ট, জাফলং ও বিছনাকান্দিসমৃদ্ধ উত্তর-পূর্বাঞ্চলের প্রধান পর্যটন জেলা।",
    famous_for_en: "Ratargul Swamp Forest, Jaflong & Sufi Shrines",
    famous_for_bn: "রাতারগুল সোয়াম্প ফরেস্ট, জাফলং ও শাহজালাল মাজার",
    image_url: "",
    seo_title_en: "Sylhet District (সিলেট) - Ratargul, Jaflong & Tea Gardens | Beautiful Bangladesh",
    seo_title_bn: "সিলেট জেলা - রাতারগুল, জাফলং ও চা বাগান | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Sylhet District: Ratargul Swamp Forest, Jaflong stone river, Bisnakhandi, and historic tea gardens.",
    seo_description_bn: "সিলেট জেলার রাতারগুল, জাফলং, বিছনাকান্দি ও দর্শনীয় স্থানগুলোর বিস্তারিত ভ্রমণ নির্দেশিকা।",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "moulvibazar",
    division_id: "sylhet",
    name_en: "Moulvibazar",
    name_bn: "মৌলভীবাজার",
    slug: "moulvibazar",
    description_en: "Tea-garden heartland including Sreemangal, Lawachara National Park rainforest, Madhabkunda Waterfall, and Baikka Beel wetland.",
    description_bn: "শ্রীমঙ্গলের বিস্তীর্ণ চা বাগান, লাউয়াছড়া জাতীয় উদ্যান, মাধবকুণ্ড জলপ্রপাত ও বাইক্কা বিল পাখির অভয়াশ্রমের জেলা।",
    famous_for_en: "Sreemangal Tea Gardens, Lawachara & Madhabkunda",
    famous_for_bn: "শ্রীমঙ্গল চা বাগান, লাউয়াছড়া ও মাধবকুণ্ড জলপ্রপাত",
    image_url: "",
    seo_title_en: "Moulvibazar District (মৌলভীবাজার) - Sreemangal & Lawachara | Beautiful Bangladesh",
    seo_title_bn: "মৌলভীবাজার জেলা - শ্রীমঙ্গল, লাউয়াছড়া ও মাধবকুণ্ড | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Moulvibazar District in Sylhet Division: Sreemangal tea estates, Lawachara rainforest, Baikka Beel, and Madhabkunda.",
    seo_description_bn: "মৌলভীবাজার জেলার শ্রীমঙ্গল, লাউয়াছড়া জাতীয় উদ্যান ও মাধবকুণ্ড জলপ্রপাতের ভ্রমণ তথ্য।",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "habiganj",
    division_id: "sylhet",
    name_en: "Habiganj",
    name_bn: "হবিগঞ্জ",
    slug: "habiganj",
    description_en: "Home to Satchari National Park, Rema-Kalenga Wildlife Sanctuary, and tea-covered hillocks along the Khowai River basin.",
    description_bn: "সাতছড়ি জাতীয় উদ্যান, রেমা-কালেঙ্গা বন্যপ্রাণী অভয়ারণ্য এবং খোয়াই নদী অববাহিকার চা বাগান ও পাহাড়ি টিলাসমৃদ্ধ জেলা।",
    famous_for_en: "Satchari National Park & Rema-Kalenga Sanctuary",
    famous_for_bn: "সাতছড়ি জাতীয় উদ্যান ও রেমা-কালেঙ্গা অভয়ারণ্য",
    image_url: "",
    seo_title_en: "Habiganj District (হবিগঞ্জ) - Satchari & Rema-Kalenga | Beautiful Bangladesh",
    seo_title_bn: "হবিগঞ্জ জেলা - সাতছড়ি ও রেমা-কালেঙ্গা অভয়ারণ্য | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Habiganj District in Sylhet Division featuring Satchari National Park, Rema-Kalenga Sanctuary, and green tea valleys.",
    seo_description_bn: "হবিগঞ্জ জেলার সাতছড়ি জাতীয় উদ্যান ও রেমা-কালেঙ্গা বন্যপ্রাণী অভয়ারণ্য সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "sunamganj",
    division_id: "sylhet",
    name_en: "Sunamganj",
    name_bn: "সুনামগঞ্জ",
    slug: "sunamganj",
    description_en: "Home to the Ramsar-listed Tanguar Haor wetland, Jadukata River, Niladri Lake, Shimul Bagan, and mystic bard Hason Raja's legacy.",
    description_bn: "রামসার সাইট টাঙ্গুয়ার হাওর, যাদুকাটা নদী, নীলাদ্রি লেক, শিমুল বাগান ও মরমী কবি হাছন রাজার স্মৃতিবিজড়িত হাওর জেলা।",
    famous_for_en: "Tanguar Haor, Jadukata River & Niladri Lake",
    famous_for_bn: "টাঙ্গুয়ার হাওর, যাদুকাটা নদী ও নীলাদ্রি লেক",
    image_url: "",
    seo_title_en: "Sunamganj District (সুনামগঞ্জ) - Tanguar Haor & Jadukata | Beautiful Bangladesh",
    seo_title_bn: "সুনামগঞ্জ জেলা - টাঙ্গুয়ার হাওর, যাদুকাটা ও নীলাদ্রি | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Sunamganj District in Sylhet Division: Tanguar Haor Ramsar wetland, Jadukata River, Shimul Bagan, and Niladri Lake.",
    seo_description_bn: "সুনামগঞ্জ জেলার টাঙ্গুয়ার হাওর, যাদুকাটা নদী ও নীলাদ্রি লেক ভ্রমণের বিস্তারিত নির্দেশিকা।",
    is_published: true,
    popular_spots_count: 6
  },

  // Khulna Division (10 districts)
  {
    id: "khulna_dist",
    division_id: "khulna",
    name_en: "Khulna",
    name_bn: "খুলনা",
    slug: "khulna",
    description_en: "Southwestern river port on the Rupsha–Bhairab rivers and primary embarkation gateway for eco-cruises into the Sundarbans.",
    description_bn: "রূপসা-ভৈরব নদের তীরবর্তী নদীবন্দর জেলা এবং সুন্দরবন ভ্রমণের প্রধান প্রবেশদ্বার।",
    famous_for_en: "Sundarbans Gateway, Rupsha River & Chuijhal Cuisine",
    famous_for_bn: "সুন্দরবন প্রবেশদ্বার, রূপসা নদী ও চুইঝাল রন্ধন",
    image_url: "",
    seo_title_en: "Khulna District (খুলনা) - Sundarbans Gateway & Rupsha | Beautiful Bangladesh",
    seo_title_bn: "খুলনা জেলা - সুন্দরবনের প্রবেশদ্বার ও রূপসা | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Khulna District: primary gateway for Sundarbans mangrove expeditions, Rupsha riverfront, and regional heritage.",
    seo_description_bn: "খুলনা জেলার সুন্দরবন প্রবেশপথ, রূপসা নদী ও ঐতিহ্যবাহী চুইঝাল সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "bagerhat",
    division_id: "khulna",
    name_en: "Bagerhat",
    name_bn: "বাগেরহাট",
    slug: "bagerhat",
    description_en: "Historic Mosque City of Khalifatabad (UNESCO World Heritage), featuring the 15th-century Sixty Dome Mosque and eastern Sundarbans.",
    description_bn: "ইউনেস্কো বিশ্ব ঐতিহ্য ঐতিহাসিক মসজিদের শহর খলিফাতাবাদ, ১৫শ শতকের ষাট গম্বুজ মসজিদ ও পূর্ব সুন্দরবনের অংশসমৃদ্ধ জেলা।",
    famous_for_en: "Sixty Dome Mosque (Shat Gombuj) & Khan Jahan Ali Shrine",
    famous_for_bn: "ষাট গম্বুজ মসজিদ ও হযরত খানজাহান আলীর মাজার",
    image_url: "",
    seo_title_en: "Bagerhat District (বাগেরহাট) - Sixty Dome Mosque (UNESCO) | Beautiful Bangladesh",
    seo_title_bn: "বাগেরহাট জেলা - ইউনেস্কো ঐতিহ্য ষাট গম্বুজ মসজিদ | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Bagerhat District in Khulna Division: UNESCO Sixty Dome Mosque, Khan Jahan Ali heritage, and Mongla Sundarbans gateway.",
    seo_description_bn: "বাগেরহাট জেলার ইউনেস্কো বিশ্ব ঐতিহ্য ষাট গম্বুজ মসজিদ ও ঐতিহাসিক স্থাপনাসমূহের তথ্য।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "satkhira",
    division_id: "khulna",
    name_en: "Satkhira",
    name_bn: "সাতক্ষীরা",
    slug: "satkhira",
    description_en: "Southwestern border district encompassing the western Sundarbans range (Munshiganj–Kalagachhia), famed for wild mangrove honey.",
    description_bn: "সুন্দরবনের পশ্চিম রেঞ্জের প্রবেশপথ ও ম্যানগ্রোভ বনের খাঁটি মধুর জন্য খ্যাত দক্ষিণ-পশ্চিমাঞ্চলের সীমান্তবর্তী জেলা।",
    famous_for_en: "Western Sundarbans Range & Wild Mangrove Honey",
    famous_for_bn: "পশ্চিম সুন্দরবন ও সুন্দরবনের খাঁটি মধু",
    image_url: "",
    seo_title_en: "Satkhira District (সাতক্ষীরা) - Western Sundarbans & Honey | Beautiful Bangladesh",
    seo_title_bn: "সাতক্ষীরা জেলা - পশ্চিম সুন্দরবন ও মধু ঐতিহ্য | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Satkhira District in Khulna Division, gateway to the western Sundarbans mangrove creeks and natural honey.",
    seo_description_bn: "সাতক্ষীরা জেলার সুন্দরবন সংযোগস্থল ও আঞ্চলিক পরিচিতি সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "jashore",
    division_id: "khulna",
    name_en: "Jashore",
    name_bn: "যশোর",
    slug: "jashore",
    description_en: "Historic district featuring poet Michael Madhusudan Dutt's Sagardari residence along the Kapotakkha River and date palm jaggery.",
    description_bn: "কপোতাক্ষ নদের তীরে মহাকবি মাইকেল মধুসূদন দত্তের স্মৃতিবিজড়িত সাগরদাঁড়ি এবং খাঁটি খেজুর গুড়ের জন্য পরিচিত জেলা।",
    famous_for_en: "Sagardari Madhusudan Memorial & Date Palm Jaggery",
    famous_for_bn: "সাগরদাঁড়ি মধুসূদন পল্লী ও যশোরের খেজুর গুড়",
    image_url: "",
    seo_title_en: "Jashore District (যশোর) - Sagardari & Date Jaggery | Beautiful Bangladesh",
    seo_title_bn: "যশোর জেলা - সাগরদাঁড়ি ও খেজুরের গুড় | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Jashore District in Khulna Division: Sagardari memorial of Michael Madhusudan Dutt, Gadkhali floriculture, and date palm jaggery.",
    seo_description_bn: "যশোর জেলার সাগরদাঁড়ি মধুসূদন স্মৃতিপল্লী ও খেজুর গুড়ের ঐতিহ্য সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "kushtia",
    division_id: "khulna",
    name_en: "Kushtia",
    name_bn: "কুষ্টিয়া",
    slug: "kushtia",
    description_en: "Cultural district housing mystic Baul philosopher Fakir Lalon Shah's shrine at Chheuria and Rabindranath Tagore's Shilaidaha Kuthibari.",
    description_bn: "ছেউড়িয়ায় বাউল সম্রাট ফকির লালন শাহের আখড়াবাড়ি এবং বিশ্বকবি রবীন্দ্রনাথ ঠাকুরের শিলাইদহ কুঠিবাড়ির জন্য খ্যাত জেলা।",
    famous_for_en: "Lalon Shah Akhra & Shilaidaha Kuthibari",
    famous_for_bn: "লালন শাহের মাজার ও শিলাইদহ কুঠিবাড়ি",
    image_url: "",
    seo_title_en: "Kushtia District (কুষ্টিয়া) - Lalon Shrine & Shilaidaha Kuthibari | Beautiful Bangladesh",
    seo_title_bn: "কুষ্টিয়া জেলা - লালন মাজার ও শিলাইদহ কুঠিবাড়ি | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Kushtia District in Khulna Division: Fakir Lalon Shah's Akhrabari, Shilaidaha Tagore Kuthibari, and Baul heritage.",
    seo_description_bn: "কুষ্টিয়া জেলার লালন আখড়াবাড়ি, শিলাইদহ কুঠিবাড়ি ও সাংস্কৃতিক ঐতিহ্য সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "jhenaidah",
    division_id: "khulna",
    name_en: "Jhenaidah",
    name_bn: "ঝিনাইদহ",
    slug: "jhenaidah",
    description_en: "Known for the historic Barobazar sultanate mosques, Naldanga temple complex, and Miyar Dalan heritage.",
    description_bn: "বারোবাজারের সুলতানি আমলের প্রাচীন মসজিদসমূহ, নলডাঙ্গা মন্দির কমপ্লেক্স ও মিয়ার দালানের জন্য পরিচিত জেলা।",
    famous_for_en: "Barobazar Sultanate Mosques & Naldanga Heritage",
    famous_for_bn: "বারোবাজারের প্রাচীন মসজিদ ও নলডাঙ্গা মন্দির",
    image_url: "",
    seo_title_en: "Jhenaidah District (ঝিনাইদহ) - Barobazar Mosques & Heritage | Beautiful Bangladesh",
    seo_title_bn: "ঝিনাইদহ জেলা - বারোবাজার মসজিদ ও নলডাঙ্গা ঐতিহ্য | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Jhenaidah District in Khulna Division featuring Barobazar Sultanate mosques and Naldanga archaeological remains.",
    seo_description_bn: "ঝিনাইদহ জেলার বারোবাজারের ঐতিহাসিক মসজিদসমূহ ও দর্শনীয় স্থান সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "magura",
    division_id: "khulna",
    name_en: "Magura",
    name_bn: "মাগুরা",
    slug: "magura",
    description_en: "District situated along the Nabaganga and Kumar rivers, noted for Raja Sitaram Ray's remains at Mohammadpur and Katyayani Puja.",
    description_bn: "নবগঙ্গা ও কুমার নদ বিধৌত জেলা, যা মহম্মদপুরে রাজা সীতারাম রায়ের প্রাসাদাবশেষ ও কাত্যায়নী উৎসবের জন্য পরিচিত।",
    famous_for_en: "Katyayani Festival & Mohammadpur Heritage",
    famous_for_bn: "কাত্যায়নী উৎসব ও মহম্মদপুর ঐতিহ্য",
    image_url: "",
    seo_title_en: "Magura District (মাগুরা) - Cultural Heritage & Nabaganga | Beautiful Bangladesh",
    seo_title_bn: "মাগুরা জেলা - কাত্যায়নী উৎসব ও ঐতিহাসিক পরিচিতি | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Magura District in Khulna Division, known for Katyayani festival and Raja Sitaram Ray heritage at Mohammadpur.",
    seo_description_bn: "মাগুরা জেলার কাত্যায়নী উৎসব ও ঐতিহাসিক মহম্মদপুর নিদর্শন সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "narail",
    division_id: "khulna",
    name_en: "Narail",
    name_bn: "নড়াইল",
    slug: "narail",
    description_en: "Birthplace of master painter SM Sultan on the Chitra River and known for traditional otter-assisted river fishing.",
    description_bn: "চিত্রা নদীর তীরে বরেণ্য চিত্রশিল্পী এস এম সুলতানের স্মৃতিকেন্দ্র ও ঐতিহ্যবাহী ভোঁদড় দিয়ে মাছ শিকারের জন্য পরিচিত জেলা।",
    famous_for_en: "SM Sultan Memorial Complex & Chitra River",
    famous_for_bn: "এস এম সুলতান কমপ্লেক্স ও চিত্রা নদী",
    image_url: "",
    seo_title_en: "Narail District (নড়াইল) - SM Sultan Heritage & Chitra River | Beautiful Bangladesh",
    seo_title_bn: "নড়াইল জেলা - এস এম সুলতান স্মৃতিকেন্দ্র ও চিত্রা নদী | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Narail District in Khulna Division along the Chitra River, home to the SM Sultan Art Gallery and memorial.",
    seo_description_bn: "নড়াইল জেলার এস এম সুলতান কমপ্লেক্স ও চিত্রা নদীর ঐতিহ্য সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "chuadanga",
    division_id: "khulna",
    name_en: "Chuadanga",
    name_bn: "চুয়াডাঙ্গা",
    slug: "chuadanga",
    description_en: "Home to the historic Carew & Co. sugar mill complex at Darshana (established 1938) and agricultural plains along the Mathabhanga River.",
    description_bn: "দর্শনায় ১৯৩৮ সালে প্রতিষ্ঠিত ঐতিহাসিক কেরু অ্যান্ড কোং চিনিকল ও মাথাভাঙ্গা নদী অববাহিকার কৃষিনির্ভর জেলা।",
    famous_for_en: "Darshana Carew & Co. (1938) & Mathabhanga River",
    famous_for_bn: "দর্শনা কেরু অ্যান্ড কোং ও মাথাভাঙ্গা নদী",
    image_url: "",
    seo_title_en: "Chuadanga District (চুয়াডাঙ্গা) - Darshana Heritage & Plains | Beautiful Bangladesh",
    seo_title_bn: "চুয়াডাঙ্গা জেলা - দর্শনা কেরু অ্যান্ড কোং ও ভ্রমণ তথ্য | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Chuadanga District in Khulna Division, home to Darshana's historic Carew & Co. complex and Mathabhanga river plains.",
    seo_description_bn: "চুয়াডাঙ্গা জেলার দর্শনা কেরু অ্যান্ড কোং চিনিকল ও আঞ্চলিক পরিচিতি জানুন।",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "meherpur",
    division_id: "khulna",
    name_en: "Meherpur",
    name_bn: "মেহেরপুর",
    slug: "meherpur",
    description_en: "Historic district housing the Mujibnagar Memorial Complex at Baidyanathtala where Bangladesh's first provisional government took oath in 1971.",
    description_bn: "১৯৭১ সালে স্বাধীন বাংলাদেশের প্রথম অস্থায়ী সরকার শপথ গ্রহণের ঐতিহাসিক স্থান মুজিবনগর স্মৃতিসৌধসমৃদ্ধ জেলা।",
    famous_for_en: "Mujibnagar Liberation Memorial & Amjhupi Nilkuthi",
    famous_for_bn: "মুজিবনগর স্মৃতিসৌধ ও আমঝুপি নীলকুঠি",
    image_url: "",
    seo_title_en: "Meherpur District (মেহেরপুর) - Mujibnagar Memorial Complex | Beautiful Bangladesh",
    seo_title_bn: "মেহেরপুর জেলা - ঐতিহাসিক মুজিবনগর স্মৃতিসৌধ | অপরূপ বাংলাদেশ",
    seo_description_en: "Visit Meherpur District in Khulna Division, featuring the historic 1971 Mujibnagar Memorial Complex and Amjhupi Nilkuthi.",
    seo_description_bn: "মেহেরপুর জেলার ঐতিহাসিক মুজিবনগর স্মৃতিসৌধ কমপ্লেক্স ও আমঝুপি নীলকুঠির তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 3
  },

  // Rajshahi Division (8 districts)
  {
    id: "rajshahi_dist",
    division_id: "rajshahi",
    name_en: "Rajshahi",
    name_bn: "রাজশাহী",
    slug: "rajshahi",
    description_en: "Padma-river Silk City housing the Varendra Research Museum, Puthia Temple Complex, Bagha Mosque, and expansive mango orchards.",
    description_bn: "পদ্মাতীরের রেশম নগরী, যেখানে বরেন্দ্র গবেষণা জাদুঘর, পুঠিয়া রাজবাড়ি-মন্দির, বাঘা মসজিদ ও আমবাগান অবস্থিত।",
    famous_for_en: "Varendra Museum, Puthia Temples & Rajshahi Silk",
    famous_for_bn: "বরেন্দ্র জাদুঘর, পুঠিয়া মন্দির কমপ্লেক্স ও রাজশাহী সিল্ক",
    image_url: "",
    seo_title_en: "Rajshahi District (রাজশাহী) - Puthia Temples, Varendra Museum & Silk | Beautiful Bangladesh",
    seo_title_bn: "রাজশাহী জেলা - পুঠিয়া মন্দির, বরেন্দ্র জাদুঘর ও সিল্ক | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Rajshahi District: Varendra Research Museum, Puthia Temple Complex, Bagha Mosque, Padma riverfront, and silk heritage.",
    seo_description_bn: "রাজশাহী জেলার বরেন্দ্র গবেষণা জাদুঘর, পুঠিয়া রাজবাড়ি ও বাঘা মসজিদ ভ্রমণের গাইড।",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "bogura",
    division_id: "rajshahi",
    name_en: "Bogura",
    name_bn: "বগুড়া",
    slug: "bogura",
    description_en: "Ancient archaeological heartland housing Mahasthangarh (Pundranagar) and Vasu Bihar along with renowned Bogura sweet curd.",
    description_bn: "প্রাচীন পুণ্ড্রনগরখ্যাত মহাস্থানগড়, ভাসু বিহার ও সুস্বাদু বগুড়ার দইয়ের জন্য বিশ্বজুড়ে পরিচিত উত্তরবঙ্গের জেলা।",
    famous_for_en: "Mahasthangarh Citadel & Bogurar Doi",
    famous_for_bn: "মহাস্থানগড় প্রত্নস্থল ও বগুড়ার দই",
    image_url: "",
    seo_title_en: "Bogura District (বগুড়া) - Mahasthangarh & Bogurar Doi | Beautiful Bangladesh",
    seo_title_bn: "বগুড়া জেলা - মহাস্থানগড় ও ঐতিহ্যবাহী বগুড়ার দই | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Bogura District in Rajshahi Division: Mahasthangarh ancient citadel, Govinda Bhita, Vasu Bihar, and Bogura curd.",
    seo_description_bn: "বগুড়া জেলার প্রাচীন মহাস্থানগড়, ভাসু বিহার ও বগুড়ার দই সম্পর্কে বিস্তারিত জানুন।",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "naogaon",
    division_id: "rajshahi",
    name_en: "Naogaon",
    name_bn: "নওগাঁ",
    slug: "naogaon",
    description_en: "Home to the UNESCO World Heritage Somapura Mahavihara at Paharpur, 16th-century Kusumba Mosque, and Tagore's Patisar Kuthibari.",
    description_bn: "ইউনেস্কো বিশ্ব ঐতিহ্য পাহাড়পুর সোমপুর মহাবিহার, ১৬শ শতকের কুসুম্বা মসজিদ ও পতিসর রবীন্দ্র কাছারি বাড়ির জেলা।",
    famous_for_en: "Paharpur Somapura Mahavihara (UNESCO) & Kusumba Mosque",
    famous_for_bn: "পাহাড়পুর সোমপুর মহাবিহার ও কুসুম্বা মসজিদ",
    image_url: "",
    seo_title_en: "Naogaon District (নওগাঁ) - Paharpur Mahavihara (UNESCO) & Kusumba | Beautiful Bangladesh",
    seo_title_bn: "নওগাঁ জেলা - পাহাড়পুর বৌদ্ধবিহার ও কুসুম্বা মসজিদ | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Naogaon District in Rajshahi Division: UNESCO Somapura Mahavihara at Paharpur, Kusumba Mosque, and Patisar.",
    seo_description_bn: "নওগাঁ জেলার ইউনেস্কো ঐতিহ্য পাহাড়পুর সোমপুর মহাবিহার ও কুসুম্বা মসজিদ ভ্রমণের গাইড।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "natore",
    division_id: "rajshahi",
    name_en: "Natore",
    name_bn: "নাটোর",
    slug: "natore",
    description_en: "Heritage district featuring Rani Bhabani's Natore Rajbari, Uttara Ganabhaban, Chalan Beel wetlands, and Kachagolla sweet.",
    description_bn: "রানী ভবানীর নাটোর রাজবাড়ি, উত্তরা গণভবন, চলন বিল জলাভূমি ও ঐতিহ্যবাহী কাঁচাগোল্লা মিষ্টির জন্য সুপরিচিত জেলা।",
    famous_for_en: "Uttara Ganabhaban, Natore Rajbari & Kachagolla",
    famous_for_bn: "উত্তরা গণভবন, নাটোর রাজবাড়ি ও কাঁচাগোল্লা",
    image_url: "",
    seo_title_en: "Natore District (নাটোর) - Uttara Ganabhaban, Rajbari & Kachagolla | Beautiful Bangladesh",
    seo_title_bn: "নাটোর জেলা - উত্তরা গণভবন, রাজবাড়ি ও কাঁচাগোল্লা | অপরূপ বাংলাদেশ",
    seo_description_en: "Visit Natore District in Rajshahi Division: Uttara Ganabhaban, Rani Bhabani Palace, Chalan Beel, and Kachagolla.",
    seo_description_bn: "নাটোর জেলার উত্তরা গণভবন, রানী ভবানী রাজবাড়ি, চলন বিল ও কাঁচাগোল্লা সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "pabna",
    division_id: "rajshahi",
    name_en: "Pabna",
    name_bn: "পাবনা",
    slug: "pabna",
    description_en: "Home to the historic Hardinge Bridge and Lalon Shah Bridge over the Padma River, Jor Bangla Temple, and Suchitra Sen Memorial.",
    description_bn: "পদ্মা নদীর ওপর ঐতিহাসিক হার্ডিঞ্জ ব্রিজ ও লালন শাহ সেতু, জোড় বাংলা মন্দির এবং সুচিত্রা সেন স্মৃতি সংগ্রহশালার জন্য পরিচিত।",
    famous_for_en: "Hardinge Bridge, Jor Bangla Temple & Suchitra Sen Memorial",
    famous_for_bn: "হার্ডিঞ্জ ব্রিজ, জোড় বাংলা মন্দির ও সুচিত্রা সেন স্মৃতিকেন্দ্র",
    image_url: "",
    seo_title_en: "Pabna District (পাবনা) - Hardinge Bridge & Jor Bangla Temple | Beautiful Bangladesh",
    seo_title_bn: "পাবনা জেলা - হার্ডিঞ্জ ব্রিজ ও জোড় বাংলা মন্দির | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Pabna District in Rajshahi Division: historic Hardinge Bridge, Lalon Shah Bridge, Jor Bangla Temple, and Suchitra Sen Memorial.",
    seo_description_bn: "পাবনা জেলার ঐতিহাসিক হার্ডিঞ্জ ব্রিজ, লালন শাহ সেতু ও জোড় বাংলা মন্দির সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "sirajganj",
    division_id: "rajshahi",
    name_en: "Sirajganj",
    name_bn: "সিরাজগঞ্জ",
    slug: "sirajganj",
    description_en: "Jamuna-bank district anchored by the Jamuna Multipurpose Bridge, Hatikumrul Navaratna Temple, and handloom weaving clusters.",
    description_bn: "যমুনা বহুমুখী সেতু, ঐতিহাসিক হাটিকুমরুল নবরত্ন মন্দির ও ঐতিহ্যবাহী তাঁতশিল্পসমৃদ্ধ যমুনা তীরবর্তী জেলা।",
    famous_for_en: "Jamuna Bridge, Navaratna Temple & Handloom Weaving",
    famous_for_bn: "যমুনা সেতু, নবরত্ন মন্দির ও তাঁতশিল্প",
    image_url: "",
    seo_title_en: "Sirajganj District (সিরাজগঞ্জ) - Navaratna Temple & Handloom | Beautiful Bangladesh",
    seo_title_bn: "সিরাজগঞ্জ জেলা - নবরত্ন মন্দির ও যমুনা তীর | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Sirajganj District in Rajshahi Division featuring the Hatikumrul Navaratna Temple, Jamuna Riverfront, and handloom weaving.",
    seo_description_bn: "সিরাজগঞ্জ জেলার হাটিকুমরুল নবরত্ন মন্দির, যমুনা সেতু ও তাঁতশিল্প সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "chapainawabganj",
    division_id: "rajshahi",
    name_en: "Chapainawabganj",
    name_bn: "চাঁপাইনবাবগঞ্জ",
    slug: "chapainawabganj",
    description_en: "Westernmost mango-producing district housing the Sultanate-era Choto Sona Mosque and Tohakhana monuments near historic Gaur.",
    description_bn: "বাংলাদেশের অন্যতম প্রধান আম উৎপাদনকারী জেলা এবং সুলতানি আমলের ছোট সোনা মসজিদ ও তোহাখানা কমপ্লেক্সের ঐতিহাসিক স্থান।",
    famous_for_en: "Choto Sona Mosque & Mango Orchards",
    famous_for_bn: "ছোট সোনা মসজিদ ও আমবাগান",
    image_url: "",
    seo_title_en: "Chapainawabganj District (চাঁপাইনবাবগঞ্জ) - Choto Sona Mosque & Mangoes | Beautiful Bangladesh",
    seo_title_bn: "চাঁপাইনবাবগঞ্জ জেলা - ছোট সোনা মসজিদ ও আমের রাজ্য | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Chapainawabganj District in Rajshahi Division: Sultanate-era Choto Sona Mosque, Tohakhana, and famous mango orchards.",
    seo_description_bn: "চাঁপাইনবাবগঞ্জ জেলার ঐতিহাসিক ছোট সোনা মসজিদ ও আম ঐতিহ্য সম্পর্কে বিস্তারিত জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "joypurhat",
    division_id: "rajshahi",
    name_en: "Joypurhat",
    name_bn: "জয়পুরহাট",
    slug: "joypurhat",
    description_en: "Barind district featuring Lokma Rajbari in Panchbibi, the Pagla Dewan Liberation War memorial, and Barshivalaya temple heritage.",
    description_bn: "বরেন্দ্র অঞ্চলের ঐতিহাসিক লকমা রাজবাড়ি, পাগলা দেওয়ান বধ্যভূমি স্মৃতিসৌধ ও বারশিবালয় মন্দিরের জন্য পরিচিত জেলা।",
    famous_for_en: "Lokma Rajbari & Pagla Dewan Liberation Memorial",
    famous_for_bn: "লকমা রাজবাড়ি ও পাগলা দেওয়ান স্মৃতিসৌধ",
    image_url: "",
    seo_title_en: "Joypurhat District (জয়পুরহাট) - Lokma Rajbari & Barind Heritage | Beautiful Bangladesh",
    seo_title_bn: "জয়পুরহাট জেলা - লকমা রাজবাড়ি ও পাগলা দেওয়ান | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Joypurhat District in Rajshahi Division including Lokma Rajbari and the Pagla Dewan Liberation War memorial.",
    seo_description_bn: "জয়পুরহাট জেলার লকমা রাজবাড়ি ও ঐতিহাসিক নিদর্শন সম্পর্কে বিস্তারিত জানুন।",
    is_published: true,
    popular_spots_count: 2
  },

  // Barishal Division (6 districts)
  {
    id: "barishal_dist",
    division_id: "barishal",
    name_en: "Barishal",
    name_bn: "বরিশাল",
    slug: "barishal",
    description_en: "Riverine hub on the Kirtankhola River featuring Durga Sagar Dighi, Guthia Baitul Aman Mosque, and historic Epiphany Church.",
    description_bn: "কীর্তনখোলা নদীর তীরবর্তী ঐতিহ্যবাহী জেলা, যেখানে দুর্গাসাগর দিঘি, গুঠিয়া বায়তুল আমান মসজিদ ও অক্সফোর্ড মিশন গির্জা অবস্থিত।",
    famous_for_en: "Durga Sagar Dighi, Guthia Mosque & Kirtankhola River",
    famous_for_bn: "দুর্গাসাগর দিঘি, গুঠিয়া মসজিদ ও কীর্তনখোলা নদী",
    image_url: "",
    seo_title_en: "Barishal District (বরিশাল) - Durga Sagar, Guthia Mosque & Rivers | Beautiful Bangladesh",
    seo_title_bn: "বরিশাল জেলা - দুর্গাসাগর, গুঠিয়া মসজিদ ও কীর্তনখোলা | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Barishal District in Barishal Division: Durga Sagar Dighi, Guthia Baitul Aman Mosque, and Kirtankhola waterways.",
    seo_description_bn: "বরিশাল জেলার দুর্গাসাগর দিঘি, গুঠিয়া মসজিদ ও কীর্তনখোলা তীরের ভ্রমণ তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "patuakhali",
    division_id: "barishal",
    name_en: "Patuakhali",
    name_bn: "পটুয়াখালী",
    slug: "patuakhali",
    description_en: "Coastal district housing Kuakata Sea Beach, where sunrise and sunset appear over the Bay of Bengal, plus Rakhine heritage and Sonar Char.",
    description_bn: "সাগরকন্যা কুয়াকাটা সমুদ্র সৈকত (সূর্যোদয় ও সূর্যাস্তের বেলাভূমি), রাখাইন পল্লী এবং সোনার চর দ্বীপসমৃদ্ধ উপকূলীয় জেলা।",
    famous_for_en: "Kuakata Sea Beach (Sunrise & Sunset) & Rakhine Heritage",
    famous_for_bn: "কুয়াকাটা সমুদ্র সৈকত ও রাখাইন ঐতিহ্য",
    image_url: "",
    seo_title_en: "Patuakhali District (পটুয়াখালী) - Kuakata Sea Beach & Sonar Char | Beautiful Bangladesh",
    seo_title_bn: "পটুয়াখালী জেলা - কুয়াকাটা সমুদ্র সৈকত ও সোনার চর | অপরূপ বাংলাদেশ",
    seo_description_en: "Plan a visit to Patuakhali District in Barishal Division: Kuakata Sunrise & Sunset Sea Beach, Fatrar Char, and Rakhine heritage.",
    seo_description_bn: "পটুয়াখালী জেলার কুয়াকাটা সমুদ্র সৈকত, সোনার চর ও রাখাইন সংস্কৃতি সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "bhola",
    division_id: "barishal",
    name_en: "Bhola",
    name_bn: "ভোলা",
    slug: "bhola",
    description_en: "Bangladesh's largest offshore island district surrounded by the Meghna estuary, home to Monpura Island and Char Kukri Mukri sanctuary.",
    description_bn: "মেঘনা মোহনাবেষ্টিত বাংলাদেশের বৃহত্তম দ্বীপ জেলা, যেখানে মনপুরা দ্বীপ ও চর কুকরি মুকরি বন্যপ্রাণী অভয়ারণ্য অবস্থিত।",
    famous_for_en: "Monpura Island & Char Kukri Mukri Wildlife Reserve",
    famous_for_bn: "মনপুরা দ্বীপ ও চর কুকরি মুকরি অভয়ারণ্য",
    image_url: "",
    seo_title_en: "Bhola District (ভোলা) - Monpura Island & Char Kukri Mukri | Beautiful Bangladesh",
    seo_title_bn: "ভোলা জেলা - মনপুরা দ্বীপ ও চর কুকরি মুকরি | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Bhola District in Barishal Division: Monpura Island, Char Kukri Mukri wildlife sanctuary, and the Meghna estuary.",
    seo_description_bn: "ভোলা জেলার মনপুরা দ্বীপ ও চর কুকরি মুকরি বন্যপ্রাণী অভয়ারণ্যের ভ্রমণ তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "pirojpur",
    division_id: "barishal",
    name_en: "Pirojpur",
    name_bn: "পিরোজপুর",
    slug: "pirojpur",
    description_en: "Riverine delta district featuring the Atghor and Kuriana guava orchards in Nesarabad, Rayerkathi Jamidar Bari, and Baleshwar River.",
    description_bn: "নেছারাবাদের আটঘর-কুড়িয়ানার পেয়ারা বাগান, রায়েরকাঠি জমিদার বাড়ি ও বলেশ্বর নদীসমৃদ্ধ নদীমাতৃক জেলা।",
    famous_for_en: "Atghor-Kuriana Guava Orchards & Rayerkathi Jamidar Bari",
    famous_for_bn: "আটঘর-কুড়িয়ানা পেয়ারা বাগান ও রায়েরকাঠি জমিদার বাড়ি",
    image_url: "",
    seo_title_en: "Pirojpur District (পিরোজপুর) - Kuriana Orchards & Rayerkathi | Beautiful Bangladesh",
    seo_title_bn: "পিরোজপুর জেলা - আটঘর-কুড়িয়ানা ও রায়েরকাঠি | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Pirojpur District in Barishal Division: Atghor-Kuriana guava backwaters in Nesarabad and Rayerkathi Jamidar Bari.",
    seo_description_bn: "পিরোজপুর জেলার আটঘর-কুড়িয়ানা পেয়ারা বাগান ও রায়েরকাঠি জমিদার বাড়ি সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "barguna",
    division_id: "barishal",
    name_en: "Barguna",
    name_bn: "বরগুনা",
    slug: "barguna",
    description_en: "Coastal district featuring Haringhata Eco-Tourism Forest, Shubho Sandhya Sea Beach at Taltoli, and the Payra River estuary.",
    description_bn: "হরিণঘাটা ইকোট্যুরিজম বন, তালতলীর শুভ সন্ধ্যা সমুদ্র সৈকত এবং পায়রা নদীর মোহনাসমৃদ্ধ উপকূলীয় জেলা।",
    famous_for_en: "Haringhata Eco-Forest & Shubho Sandhya Sea Beach",
    famous_for_bn: "হরিণঘাটা বন ও শুভ সন্ধ্যা সমুদ্র সৈকত",
    image_url: "",
    seo_title_en: "Barguna District (বরগুনা) - Haringhata Forest & Shubho Sandhya Beach | Beautiful Bangladesh",
    seo_title_bn: "বরগুনা জেলা - হরিণঘাটা বন ও শুভ সন্ধ্যা সৈকত | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Barguna District in Barishal Division: Haringhata Eco-Tourism Forest, Shubho Sandhya Beach at Taltoli, and Payra estuary.",
    seo_description_bn: "বরগুনা জেলার হরিণঘাটা ইকোট্যুরিজম বন ও তালতলীর শুভ সন্ধ্যা সৈকত সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "jhalakathi",
    division_id: "barishal",
    name_en: "Jhalakathi",
    name_bn: "ঝালকাঠি",
    slug: "jhalakathi",
    description_en: "Riverine district renowned for the Bhimruli floating guava market, Kirtipasha Jamidar Bari, and the Sugandha River.",
    description_bn: "ভিমরুলির ঐতিহ্যবাহী ভাসমান পেয়ারা বাজার, কীর্তিপাশা জমিদার বাড়ি ও সুগন্ধা নদীর তীরবর্তী জনপদ।",
    famous_for_en: "Bhimruli Floating Guava Market & Kirtipasha Jamidar Bari",
    famous_for_bn: "ভিমরুলি ভাসমান পেয়ারা বাজার ও কীর্তিপাশা জমিদার বাড়ি",
    image_url: "",
    seo_title_en: "Jhalakathi District (ঝালকাঠি) - Bhimruli Floating Market | Beautiful Bangladesh",
    seo_title_bn: "ঝালকাঠি জেলা - ভিমরুলি ভাসমান পেয়ারা বাজার ও কীর্তিপাশা | অপরূপ বাংলাদেশ",
    seo_description_en: "Visit Jhalakathi District in Barishal Division: Bhimruli's historic floating guava market on the backwater canals and Kirtipasha.",
    seo_description_bn: "ঝালকাঠি জেলার ভিমরুলি ভাসমান পেয়ারা বাজার ও কীর্তিপাশা জমিদার বাড়ি সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 3
  },

  // Rangpur Division (8 districts)
  {
    id: "rangpur_dist",
    division_id: "rangpur",
    name_en: "Rangpur",
    name_bn: "রংপুর",
    slug: "rangpur",
    description_en: "Northern cultural center featuring the neoclassical Tajhat Palace, Carmichael College, Pairaband (Begum Rokeya birthplace), and Haribhanga mangoes.",
    description_bn: "ঐতিহাসিক তাজহাট রাজবাড়ি, কারমাইকেল কলেজ, পায়রাবন্দ (বেগম রোকেয়ার জন্মভূমি) এবং সুমিষ্ট হাঁড়িভাঙা আমের জেলা।",
    famous_for_en: "Tajhat Palace, Pairaband & Haribhanga Mangoes",
    famous_for_bn: "তাজহাট রাজবাড়ি, পায়রাবন্দ ও হাঁড়িভাঙা আম",
    image_url: "",
    seo_title_en: "Rangpur District (রংপুর) - Tajhat Palace & Haribhanga Mangoes | Beautiful Bangladesh",
    seo_title_bn: "রংপুর জেলা - তাজহাট রাজবাড়ি, পায়রাবন্দ ও হাঁড়িভাঙা আম | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Rangpur District: Tajhat Zamindar Palace, Begum Rokeya Memorial at Pairaband, Shatranji weaving, and Haribhanga mangoes.",
    seo_description_bn: "রংপুর জেলার তাজহাট রাজবাড়ি, বেগম রোকেয়া স্মৃতিকেন্দ্র ও ঐতিহ্য সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "dinajpur",
    division_id: "rangpur",
    name_en: "Dinajpur",
    name_bn: "দিনাজপুর",
    slug: "dinajpur",
    description_en: "Home to the 18th-century Kantajew Terracotta Temple, historic Ramsagar artificial lake, Nayabad Mosque, and Bedana lychees.",
    description_bn: "১৮শ শতাব্দীর অনুপম টেরাকোটাসমৃদ্ধ কান্তজিউ মন্দির, রামসাগর দিঘি, নয়াবাদ মসজিদ ও বেদানা লিচুর জন্য বিখ্যাত জেলা।",
    famous_for_en: "Kantajew Terracotta Temple, Ramsagar & Lychees",
    famous_for_bn: "কান্তজিউ মন্দির, রামসাগর দিঘি ও দিনাজপুরের লিচু",
    image_url: "",
    seo_title_en: "Dinajpur District (দিনাজপুর) - Kantajew Temple & Ramsagar | Beautiful Bangladesh",
    seo_title_bn: "দিনাজপুর জেলা - কান্তজিউ মন্দির ও রামসাগর দিঘি | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Dinajpur District in Rangpur Division: 18th-century Kantajew Terracotta Temple, Ramsagar National Park, and Nayabad Mosque.",
    seo_description_bn: "দিনাজপুর জেলার কান্তজিউ মন্দির, রামসাগর দিঘি ও ঐতিহাসিক স্থানসমূহের ভ্রমণ তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "panchagarh",
    division_id: "rangpur",
    name_en: "Panchagarh",
    name_bn: "পঞ্চগড়",
    slug: "panchagarh",
    description_en: "Northernmost district at Banglabandha and Tentulia, featuring flatland tea gardens, the Rocks Museum, and clear-season Kanchenjunga views.",
    description_bn: "তেঁতুলিয়া ও বাংলাবান্ধা সীমান্ত, সমতলের সবুজ চা বাগান, রক্স মিউজিয়াম ও শরৎ-হেমন্তে কাঞ্চনজঙ্ঘা দৃশ্যের জেলা।",
    famous_for_en: "Tentulia Tea Gardens & Kanchenjunga Horizon",
    famous_for_bn: "তেঁতুলিয়া সমতল চা বাগান ও কাঞ্চনজঙ্ঘা দর্শন",
    image_url: "",
    seo_title_en: "Panchagarh District (পঞ্চগড়) - Tentulia Tea Gardens & Kanchenjunga | Beautiful Bangladesh",
    seo_title_bn: "পঞ্চগড় জেলা - তেঁতুলিয়া চা বাগান ও কাঞ্চনজঙ্ঘা | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Panchagarh District in Rangpur Division: Tentulia flatland tea gardens, Banglabandha Zero Point, and Kanchenjunga viewpoints.",
    seo_description_bn: "পঞ্চগড় জেলার তেঁতুলিয়া সমতল চা বাগান, বাংলাবান্ধা ও কাঞ্চনজঙ্ঘা দর্শনের তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "thakurgaon",
    division_id: "rangpur",
    name_en: "Thakurgaon",
    name_bn: "ঠাকুরগাঁও",
    slug: "thakurgaon",
    description_en: "Northwestern plains district known for the historic Baliadangi Balia Mosque, Haripur Rajbari, and Tangon River basin.",
    description_bn: "ঐতিহাসিক বালিয়া মসজিদ, হরিপুর রাজবাড়ি ও টাঙ্গন নদী অববাহিকাসমৃদ্ধ উত্তরবঙ্গের কৃষিপ্রধান জেলা।",
    famous_for_en: "Balia Mosque & Haripur Rajbari",
    famous_for_bn: "বালিয়া মসজিদ ও হরিপুর রাজবাড়ি",
    image_url: "",
    seo_title_en: "Thakurgaon District (ঠাকুরগাঁও) - Balia Mosque & Haripur Rajbari | Beautiful Bangladesh",
    seo_title_bn: "ঠাকুরগাঁও জেলা - বালিয়া মসজিদ ও হরিপুর রাজবাড়ি | অপরূপ বাংলাদেশ",
    seo_description_en: "Visit Thakurgaon District in Rangpur Division featuring the historic Balia Mosque, Haripur Rajbari, and rural northern landscapes.",
    seo_description_bn: "ঠাকুরগাঁও জেলার বালিয়া মসজিদ ও হরিপুর রাজবাড়ির ঐতিহাসিক তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "gaibandha",
    division_id: "rangpur",
    name_en: "Gaibandha",
    name_bn: "গাইবান্ধা",
    slug: "gaibandha",
    description_en: "Brahmaputra-river plains district known for Vardhan Kuthi estate, Balashi Ghat riverfront, and traditional Rasmanjari sweet.",
    description_bn: "ব্রহ্মপুত্র নদী তীরবর্তী জেলা, যা গোবিন্দগঞ্জের বর্ধনকুঠি, বালাসীঘাট ও ঐতিহ্যবাহী রসমঞ্জরি মিষ্টির জন্য পরিচিত।",
    famous_for_en: "Vardhan Kuthi & Gaibandha Rasmanjari",
    famous_for_bn: "বর্ধনকুঠি ও গাইবান্ধার রসমঞ্জরি",
    image_url: "",
    seo_title_en: "Gaibandha District (গাইবান্ধা) - Vardhan Kuthi & Rasmanjari | Beautiful Bangladesh",
    seo_title_bn: "গাইবান্ধা জেলা - বর্ধনকুঠি ও রসমঞ্জরি | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Gaibandha District in Rangpur Division: Vardhan Kuthi heritage, Brahmaputra char landscapes, and Gaibandha Rasmanjari.",
    seo_description_bn: "গাইবান্ধা জেলার বর্ধনকুঠি ও সুস্বাদু রসমঞ্জরি সম্পর্কে বিস্তারিত জানুন।",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "kurigram",
    division_id: "rangpur",
    name_en: "Kurigram",
    name_bn: "কুড়িগ্রাম",
    slug: "kurigram",
    description_en: "Northeastern Rangpur Division district crisscrossed by the Dharla, Brahmaputra, and Dudhkumar rivers, housing historic Chandamari Mosque.",
    description_bn: "ধরলা, ব্রহ্মপুত্র ও দুধকুমার নদী বিধৌত জেলা, যেখানে ঐতিহাসিক চান্দামারী মসজিদ ও চিলমারী নদীবন্দর অবস্থিত।",
    famous_for_en: "Dharla & Brahmaputra Rivers & Chandamari Mosque",
    famous_for_bn: "ধরলা-ব্রহ্মপুত্র নদী ও চান্দামারী মসজিদ",
    image_url: "",
    seo_title_en: "Kurigram District (কুড়িগ্রাম) - Dharla River & Chandamari Mosque | Beautiful Bangladesh",
    seo_title_bn: "কুড়িগ্রাম জেলা - ধরলা নদী ও চান্দামারী মসজিদ | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Kurigram District in Rangpur Division along the Dharla and Brahmaputra rivers, including Chilmari and Chandamari Mosque.",
    seo_description_bn: "কুড়িগ্রাম জেলার ধরলা নদী, চিলমারী বন্দর ও চান্দামারী মসজিদের পরিচিতি জানুন।",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "lalmonirhat",
    division_id: "rangpur",
    name_en: "Lalmonirhat",
    name_bn: "লালমনিরহাট",
    slug: "lalmonirhat",
    description_en: "Northern Teesta-basin district featuring the Teesta Barrage at Hatibandha and the Tin Bigha Corridor at Patgram.",
    description_bn: "তিস্তা অববাহিকার জেলা, যেখানে হাতীবান্ধার তিস্তা ব্যারেজ ও পাটগ্রামের ঐতিহাসিক তিন বিঘা করিডোর অবস্থিত।",
    famous_for_en: "Teesta Barrage & Tin Bigha Corridor",
    famous_for_bn: "তিস্তা ব্যারেজ ও তিন বিঘা করিডোর",
    image_url: "",
    seo_title_en: "Lalmonirhat District (লালমনিরহাট) - Teesta Barrage & Tin Bigha | Beautiful Bangladesh",
    seo_title_bn: "লালমনিরহাট জেলা - তিস্তা ব্যারেজ ও তিন বিঘা করিডোর | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Lalmonirhat District in Rangpur Division: Teesta Barrage irrigation project and Tin Bigha Corridor at Patgram.",
    seo_description_bn: "লালমনিরহাট জেলার তিস্তা ব্যারেজ প্রকল্প ও তিন বিঘা করিডোর সম্পর্কে বিস্তারিত জানুন।",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "nilphamari",
    division_id: "rangpur",
    name_en: "Nilphamari",
    name_bn: "নীলফামারী",
    slug: "nilphamari",
    description_en: "Home to the mosaic-tiled Chini Mosque and historic railway workshop town of Saidpur alongside the Teesta canal network.",
    description_bn: "চীনা মাটির টুকরায় অলংকৃত চিনি মসজিদ, ঐতিহাসিক সৈয়দপুর রেলওয়ে শহর ও নীলসাগর দিঘিসমৃদ্ধ জেলা।",
    famous_for_en: "Chini Mosque, Nilsagar & Saidpur Railway Heritage",
    famous_for_bn: "চিনি মসজিদ, নীলসাগর ও সৈয়দপুর রেলওয়ে ঐতিহ্য",
    image_url: "",
    seo_title_en: "Nilphamari District (নীলফামারী) - Chini Mosque & Nilsagar | Beautiful Bangladesh",
    seo_title_bn: "নীলফামারী জেলা - চিনি মসজিদ ও নীলসাগর | অপরূপ বাংলাদেশ",
    seo_description_en: "Visit Nilphamari District in Rangpur Division: Saidpur's Chini Mosque, railway heritage, and Nilsagar wetland.",
    seo_description_bn: "নীলফামারী জেলার সৈয়দপুর চিনি মসজিদ ও নীলসাগর দিঘির ভ্রমণ তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 3
  },

  // Mymensingh Division (4 districts)
  {
    id: "mymensingh_dist",
    division_id: "mymensingh",
    name_en: "Mymensingh",
    name_bn: "ময়মনসিংহ",
    slug: "mymensingh",
    description_en: "Cultural district along the Old Brahmaputra River featuring Shashi Lodge, Zainul Abedin Art Museum, BAU Botanical Garden, and Muktagacha Monda.",
    description_bn: "পুরাতন ব্রহ্মপুত্র নদের তীরে অবস্থিত জেলা, যেখানে শশী লজ, জয়নুল আবেদিন সংগ্রহশালা ও মুক্তাগাছার মণ্ডা অবস্থিত।",
    famous_for_en: "Shashi Lodge, Zainul Abedin Museum & Muktagacha Monda",
    famous_for_bn: "শশী লজ, জয়নুল সংগ্রহশালা ও মুক্তাগাছার মণ্ডা",
    image_url: "",
    seo_title_en: "Mymensingh District (ময়মনসিংহ) - Shashi Lodge & Brahmaputra | Beautiful Bangladesh",
    seo_title_bn: "ময়মনসিংহ জেলা - শশী লজ, জয়নুল সংগ্রহশালা ও মুক্তাগাছার মণ্ডা | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Mymensingh District: Shashi Lodge, Alexander Castle, Zainul Abedin Sangrahashala, BAU Botanical Garden, and Muktagacha Monda.",
    seo_description_bn: "ময়মনসিংহ জেলার শশী লজ, জয়নুল আবেদিন সংগ্রহশালা ও মুক্তাগাছার মণ্ডার ঐতিহ্য জানুন।",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "netrokona",
    division_id: "mymensingh",
    name_en: "Netrokona",
    name_bn: "নেত্রকোনা",
    slug: "netrokona",
    description_en: "Home to Birishiri's white clay hills and turquoise mineral lake at Bijoypur, the Someshwari River, and eastern haor edges.",
    description_bn: "সুসং দুর্গাপুরের বিরিশিরি চীনামাটির পাহাড়, বিজয়পুর নীল জলের হ্রদ, সোমেশ্বরী নদী ও হাওর প্রান্তের জন্য বিখ্যাত জেলা।",
    famous_for_en: "Birishiri White Clay Hills & Someshwari River",
    famous_for_bn: "বিরিশিরি চীনামাটির পাহাড় ও সোমেশ্বরী নদী",
    image_url: "",
    seo_title_en: "Netrokona District (নেত্রকোনা) - Birishiri & Someshwari River | Beautiful Bangladesh",
    seo_title_bn: "নেত্রকোনা জেলা - বিরিশিরি চীনামাটির পাহাড় ও সোমেশ্বরী | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Netrokona District in Mymensingh Division: Birishiri white ceramic clay hills, Someshwari River, and Susang Durgapur.",
    seo_description_bn: "নেত্রকোনা জেলার বিরিশিরি চীনামাটির পাহাড় ও সোমেশ্বরী নদীর ভ্রমণ গাইড পড়ুন।",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "sherpur",
    division_id: "mymensingh",
    name_en: "Sherpur",
    name_bn: "শেরপুর",
    slug: "sherpur",
    description_en: "Border hill district at the Garo foothills containing Gajni Abokash Center, Madhutila Eco Park, and traditional Chhanapora sweets.",
    description_bn: "গারো পাহাড়ের পাদদেশে অবস্থিত জেলা, যেখানে গজনী অবকাশ কেন্দ্র, মধুটিলা ইকোপার্ক ও ঐতিহ্যবাহী ছানাপোড়া মিষ্টি রয়েছে।",
    famous_for_en: "Gajni Abokash Center & Madhutila Eco Park",
    famous_for_bn: "গজনী অবকাশ ও মধুটিলা ইকোপার্ক",
    image_url: "",
    seo_title_en: "Sherpur District (শেরপুর) - Gajni & Madhutila Garo Foothills | Beautiful Bangladesh",
    seo_title_bn: "শেরপুর জেলা - গজনী অবকাশ ও মধুটিলা ইকোপার্ক | অপরূপ বাংলাদেশ",
    seo_description_en: "Explore Sherpur District in Mymensingh Division at the Garo foothills: Gajni Abokash, Madhutila Eco Park, and Garo heritage.",
    seo_description_bn: "শেরপুর জেলার গজনী অবকাশ কেন্দ্র ও মধুটিলা ইকোপার্ক ভ্রমণের তথ্য জানুন।",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "jamalpur",
    division_id: "mymensingh",
    name_en: "Jamalpur",
    name_bn: "জামালপুর",
    slug: "jamalpur",
    description_en: "Mymensingh Division district along the Jamuna and Old Brahmaputra rivers, celebrated for hand-stitched Nakshi Kantha embroidery.",
    description_bn: "যমুনা ও পুরাতন ব্রহ্মপুত্র নদের অববাহিকায় অবস্থিত ময়মনসিংহ বিভাগের জেলা, যা হাতে সেলাই করা নকশিকাঁথা শিল্পের জন্য খ্যাত।",
    famous_for_en: "Nakshi Kantha Hand Embroidery & Jamuna Riverfront",
    famous_for_bn: "হাতে বোনা নকশিকাঁথা ও যমুনা নদী তীর",
    image_url: "",
    seo_title_en: "Jamalpur District (জামালপুর) - Nakshi Kantha Heritage & Jamuna | Beautiful Bangladesh",
    seo_title_bn: "জামালপুর জেলা - নকশিকাঁথা শিল্প ও যমুনা অববাহিকা | অপরূপ বাংলাদেশ",
    seo_description_en: "Discover Jamalpur District in Mymensingh Division, renowned for traditional Nakshi Kantha embroidery and Jamuna river plains.",
    seo_description_bn: "জামালপুর জেলার ঐতিহ্যবাহী নকশিকাঁথা শিল্প ও যমুনা নদীর পরিচিতি সম্পর্কে জানুন।",
    is_published: true,
    popular_spots_count: 3
  }
];

// Tourism Categories (All 12 Canonical Categories)
export const CATEGORIES: Category[] = [
  {
    id: "beaches",
    name_en: "Beaches",
    name_bn: "সমুদ্র সৈকত",
    slug: "beaches",
    icon: "bi-water",
    image_url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80",
    description_en: "World's longest unbroken natural sandy beaches and dramatic sea shores along the Bay of Bengal.",
    description_bn: "বিশ্বের দীর্ঘতম ১২০ কিমি প্রাকৃতিক সৈকত ও বঙ্গোপসাগরের নয়নাভিরাম সাগরবেলা।",
    is_published: true
  },
  {
    id: "hills",
    name_en: "Hills and Mountains",
    name_bn: "পাহাড় ও পর্বত",
    slug: "hills-and-mountains",
    icon: "bi-triangle",
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    description_en: "Rolling cloud kingdoms, emerald Chittagong Hill Tracts peaks, and tranquil mountain trails.",
    description_bn: "মেঘের উপত্যকা, সুউচ্চ সবুজ পার্বত্য চূড়া ও শান্ত পাহাড়ি ট্রেইল।",
    is_published: true
  },
  {
    id: "waterfalls",
    name_en: "Waterfalls",
    name_bn: "ঝর্ণা ও জলপ্রপাত",
    slug: "waterfalls",
    icon: "bi-droplet-half",
    image_url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80",
    description_en: "Majestic cascades tumbling down forested gorges, emerald hills, and rocky canyons.",
    description_bn: "পাহাড়ের গহীনে সতেজ গর্জনশীল জলপ্রপাত ও স্নিগ্ধ পাহাড়ি ঝর্ণা।",
    is_published: true
  },
  {
    id: "forests",
    name_en: "Forests",
    name_bn: "বন ও অরণ্য",
    slug: "forests",
    icon: "bi-tree",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    description_en: "The UNESCO Sundarbans mangrove, freshwater swamp forests, and tropical rainforests.",
    description_bn: "বিশ্ব ঐতিহ্য সুন্দরবন ম্যানগ্রোভ, সোয়াম্প ফরেস্ট ও চিরহরিৎ বৃষ্টিবন।",
    is_published: true
  },
  {
    id: "historical",
    name_en: "Historical Places",
    name_bn: "ঐতিহাসিক স্থান",
    slug: "historical-places",
    icon: "bi-bank",
    image_url: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    description_en: "Centuries-old Mughal citadels, heritage palaces, zamindar estates, and colonial landmarks.",
    description_bn: "শতবর্ষী মুঘল কেল্লা, রাজবাড়ি, জমিদার প্রাসাদ ও ঐতিহাসিক স্থাপত্য।",
    is_published: true
  },
  {
    id: "archaeological",
    name_en: "Archaeological Sites",
    name_bn: "প্রত্নতাত্ত্বিক নিদর্শন",
    slug: "archaeological-sites",
    icon: "bi-columns-gap",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    description_en: "Ancient Buddhist mahaviharas, Mahasthangarh citadels, and intricate terracotta ruins.",
    description_bn: "প্রাচীন বৌদ্ধ মহাবিহার, মহাস্থানগড় দুর্গনগরী ও টেরাকোটা প্রত্নস্থল।",
    is_published: true
  },
  {
    id: "religious",
    name_en: "Religious Places",
    name_bn: "ধর্মীয় স্থান",
    slug: "religious-places",
    icon: "bi-stars",
    image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    description_en: "UNESCO Sixty Dome Mosque, venerable sufi shrines, historic temples, and monasteries.",
    description_bn: "ইউনেস্কো ষাট গম্বুজ মসজিদ, সুফি দরগাহ, ঐতিহাসিক মন্দির ও বৌদ্ধ প্যাগোডা।",
    is_published: true
  },
  {
    id: "lakes",
    name_en: "Lakes",
    name_bn: "হ্রদ ও হাওর",
    slug: "lakes",
    icon: "bi-tsunami",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
    description_en: "Limitless watery horizons of Tanguar Haor, Kaptai Lake, Bogakain, and scenic lagoons.",
    description_bn: "টাঙ্গুয়ার হাওরের দিগন্তবিস্তৃত জলরাশি, কাপ্তাই হ্রদ ও পাহাড়ি লেক।",
    is_published: true
  },
  {
    id: "islands",
    name_en: "Islands",
    name_bn: "দ্বীপ",
    slug: "islands",
    icon: "bi-compass",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    description_en: "Pristine coral shores of Saint Martin's, tranquil Nijhum Dwip, and estuarine islets.",
    description_bn: "সেন্ট মার্টিন প্রবাল দ্বীপ, নিঝুম দ্বীপ ও বঙ্গোপসাগর মোহনার দ্বীপরাজি।",
    is_published: true
  },
  {
    id: "parks",
    name_en: "Parks",
    name_bn: "উদ্যান ও পার্ক",
    slug: "parks",
    icon: "bi-flower1",
    image_url: "https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=800&q=80",
    description_en: "Lush botanical gardens, national eco-parks, tea-valley reserves, and urban green sanctuaries.",
    description_bn: "জাতীয় উদ্যান, ইকোপার্ক, বোটানিক্যাল গার্ডেন ও সবুজ প্রাকৃতিক অভয়ারণ্য।",
    is_published: true
  },
  {
    id: "wildlife",
    name_en: "Wildlife",
    name_bn: "বন্যপ্রাণী ও অভয়ারণ্য",
    slug: "wildlife",
    icon: "bi-feather",
    image_url: "https://images.unsplash.com/photo-1535262412227-85541e910204?auto=format&fit=crop&w=800&q=80",
    description_en: "Habitats of the Royal Bengal Tiger, hoolock gibbons, spotted deer, and migratory wetland birds.",
    description_bn: "রয়েল বেঙ্গল টাইগার, উল্লুক, চিত্রা হরিণ ও অতিথি পাখির নিরাপদ আবাসস্থল।",
    is_published: true
  },
  {
    id: "rivers",
    name_en: "Rivers",
    name_bn: "নদী ও নৌভ্রমণ",
    slug: "rivers",
    icon: "bi-moisture",
    image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
    description_en: "Mighty Padma, Meghna, Jamuna, and crystal-clear Someshwari and Jadukata river voyages.",
    description_bn: "পদ্মা, মেঘনা, যমুনা এবং স্বচ্ছ সোমেশ্বরী ও যাদুকাটা নদীর নৌ-অভিযাত্রা।",
    is_published: true
  }
];

// Rich Tourist Spots across Bangladesh
export const TOURIST_SPOTS: TouristSpot[] = [
  {
    id: "madhabkunda_waterfall",
    division_id: "sylhet",
    district_id: "moulvibazar",
    category_ids: ["waterfalls"],
    name_en: "Madhabkunda Waterfall",
    name_bn: "মাধবকুণ্ড জলপ্রপাত",
    slug: "madhabkunda-waterfall",
    short_desc_en: "One of the most prominent waterfalls in Bangladesh tumbling down 200 feet amidst lush hills.",
    short_desc_bn: "পাহাড়ের বুক চিরে নেমে আসা প্রায় ২০০ ফুট উচ্চতার অপরূপ প্রাকৃতিক জলপ্রপাত।",
    overview_en: "Surrounded by emerald green hill slopes, tea estates, and betel leaf gardens, Madhabkunda is a breathtaking 61-meter natural cascade. The roaring spray, cool breeze, and rocky plunge pool make it a favorite destination.",
    overview_bn: "মৌলভীবাজারের বড়লেখা উপজেলায় অবস্থিত মাধবকুণ্ড জলপ্রপাত প্রকৃতির এক অপার বিস্ময়। সুউচ্চ পাথুরে পাহাড় থেকে সশব্দে আছড়ে পড়া জলরাশি এবং চারপাশের সবুজ চা বাগানের দৃশ্য চোখ জুড়ায়।",
    history_en: "Geologically sculpted over millennia, this natural waterfall has attracted nature lovers and travelers for centuries.",
    history_bn: "প্রাকৃতিক পাথুরে খাড়ির মধ্য দিয়ে যুগ যুগ ধরে প্রবহমান এই জলপ্রপাতটি সিলেটের অন্যতম প্রাচীন পর্যটন আকর্ষণ।",
    how_to_go_en: "Take a train or bus to Kulaura or Moulvibazar, then hire a taxi or CNG to Madhabkunda eco-park entrance.",
    how_to_go_bn: "ঢাকা থেকে ট্রেনে কুলাউড়া স্টেশনে নেমে সেখান থেকে সিএনজি বা মাইক্রোবাসে সহজেই মাধবকুণ্ড ইকোপার্কে যাওয়া যায়।",
    best_time_en: "July to November during monsoon and post-monsoon when the water volume is at its peak.",
    best_time_bn: "জুলাই থেকে নভেম্বর (বর্ষা ও বর্ষা পরবর্তী সময়ে যখন জলপ্রপাতের জলধারা সবচেয়ে বেগবান থাকে)।",
    tips_en: "Wear slip-resistant shoes as boulders near the plunge pool are mossy. Do not venture past safety barriers.",
    tips_bn: "পাথুরে পিচ্ছিল স্থানে সাবধানে পা ফেলুন এবং সতর্কতামূলক চিহ্ন মেনে চলুন।",
    image_url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-14T10:00:00Z"
  },
  {
    id: "sundarbans",
    division_id: "khulna",
    district_id: "bagerhat",
    category_ids: ["forests"],
    name_en: "Sundarbans Mangrove Forest",
    name_bn: "সুন্দরবন ম্যানগ্রোভ বন",
    slug: "sundarbans-mangrove-forest",
    short_desc_en: "The world's largest contiguous mangrove forest and home of the Royal Bengal Tiger.",
    short_desc_bn: "বিশ্বের বৃহত্তম একক ম্যানগ্রোভ অরণ্য এবং রয়েল বেঙ্গল টাইগারের প্রাকৃতিক আবাসভূমি।",
    overview_en: "A UNESCO World Heritage Site spanning across southern Bangladesh, the Sundarbans is a labyrinth of tidal waterways, mudflats, and salt-tolerant mangrove forests. It supports vibrant populations of Royal Bengal Tigers, Estuarine Crocodiles, Ganges River Dolphins, and hundreds of bird species.",
    overview_bn: "ইউনেস্কো ঘোষিত বিশ্ব ঐতিহ্য সুন্দরবন বাংলাদেশের দক্ষিণাঞ্চল জুড়ে বিস্তৃত এক চিরসবুজ প্রাকৃতিক বিস্ময়। এটি জোয়ার-ভাটার নোনা পানির খাল, ঘন ম্যানগ্রোভ উদ্ভিজ্জ ও রাজকীয় রয়েল বেঙ্গল টাইগার, কুমির ও চিত্রা হরিণের অভয়ারণ্য।",
    history_en: "Recognized as a reserved forest in 1875 by the British colonial administration and inscribed as a UNESCO World Heritage site in 1997 for its irreplaceable ecological value.",
    history_bn: "১৮৭৫ সালে সুন্দরবনকে সংরক্ষিত বন ঘোষণা করা হয় এবং ১৯৯৭ সালে এটি ইউনেস্কোর বিশ্ব ঐতিহ্য স্থান হিসেবে স্বীকৃতি লাভ করে।",
    how_to_go_en: "Board a domestic flight or express train to Khulna or Jashore. From Khulna or Mongla port, board licensed multiday tourist cruise ships equipped with safety gear and forest armed guards.",
    how_to_go_bn: "ঢাকা থেকে আকাশপথ বা ট্রেনে খুলনা বা যশোরে যান। সেখান থেকে মোংলা বন্দর পৌঁছে অনুমোদিত বন বিভাগীয় লাইসেন্সধারী পর্যটক জাহাজে করে ৩-৪ দিনের সুন্দরবন প্যাকেজ সফরে অংশ নিন।",
    best_time_en: "November to March (pleasant cool weather, calm waters, optimal wildlife spotting).",
    best_time_bn: "নভেম্বর থেকে মার্চ (আরামদায়ক শীতকালীন আবহাওয়া, শান্ত নদী এবং বন্যপ্রাণী দেখার সেরা সময়)।",
    tips_en: "Book through certified tour operators only. Never step into the forest without armed forest guards. Carry eco-friendly reusable bottles and mosquito repellent.",
    tips_bn: "সর্বদা বন বিভাগের অনুমোদিত গাইডের সাথে চলুন। প্লাস্টিক বর্জ্য ফেলবেন না। সানগ্লাস ও মসকিউটো রিপেলেন্ট সাথে রাখুন।",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1535262412227-85541e910204?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-15T10:00:00Z"
  },
  {
    id: "coxs_bazar_beach",
    division_id: "chattogram",
    district_id: "coxs_bazar",
    category_ids: ["beaches"],
    name_en: "Cox's Bazar Sea Beach",
    name_bn: "কক্সবাজার সমুদ্র সৈকত",
    slug: "coxs-bazar-sea-beach",
    short_desc_en: "The world's longest unbroken natural sandy sea beach stretching 120 kilometers.",
    short_desc_bn: "বিশ্বের দীর্ঘতম ১২০ কিলোমিটার অবিচ্ছিন্ন প্রাকৃতিক বালুকাময় সমুদ্র সৈকত।",
    overview_en: "Cox's Bazar is Bangladesh's tourism crown jewel. Stretching continuously from Kolatoli to Teknaf, it offers golden sands, roaring ocean waves, scenic Marine Drive flanked by emerald hills, and breathtaking evening sunsets over the Bay of Bengal.",
    overview_bn: "বঙ্গোপসাগরের উত্তাল ঢেউ আর সোনালী বালুর হাতছানি নিয়ে গড়ে উঠেছে কক্সবাজার সমুদ্র সৈকত। এটি একাধারে কলাতলী, সুগন্ধা, লাবণী, ইনানী ও হিমছড়ির মনোমুগ্ধকর মেরিন ড্রাইভের সাথে যুক্ত।",
    history_en: "Named after Captain Hiram Cox, an officer of the British East India Company who served as superintendent of Palongkee (now Cox's Bazar) in 1798 and resettled refugees.",
    history_bn: "ব্রিটিশ ইস্ট ইন্ডিয়া কোম্পানির কর্মকর্তা ক্যাপ্টেন হিরাম কক্সের নামানুসারে এই শহরের নামকরণ হয়, যিনি ১৭৯৮ সালে পালংকিতে পুনর্বাসনের দায়িত্ব পালন করেছিলেন।",
    how_to_go_en: "Direct flights operate daily from Dhaka to Cox's Bazar Airport. Alternatively, express scenic trains connect Dhaka directly with Cox's Bazar Iconic Railway Station in approximately 8 hours.",
    how_to_go_bn: "ঢাকা থেকে সরাসরি বিমান অথবা নবনির্মিত আইকনিক কক্সবাজার রেলওয়ে স্টেশনগামী কক্সবাজার এক্সপ্রেস ও পর্যটক এক্সপ্রেসে সহজে পৌঁছানো যায়।",
    best_time_en: "October to April for pleasant beach weather; July to September for dramatic monsoon waves.",
    best_time_bn: "অক্টোবর থেকে এপ্রিল মনোরম সৈকত আবহাওয়া উপভোগের সেরা সময়; বর্ষাকালে ঢেউয়ের রূপ দেখার জন্য জুলাই-আগস্ট উপযুক্ত।",
    tips_en: "Drive along the 80km Marine Drive road to Inani. Bathe only in designated zones supervised by lifeguards. Try fresh red snapper and pomfret at beach shacks.",
    tips_bn: "মেরিন ড্রাইভ দিয়ে ইনানী ও হিমছড়িতে খোলা জিপ বা সিএনজি নিয়ে ঘুরুন। লাইফগার্ড চিহ্নিত স্থানেই সাঁতার কাটুন। রূপচাঁদা ও টুনা ফ্রাই উপভোগ করুন।",
    image_url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-16T10:00:00Z"
  },
  {
    id: "sajek_valley",
    division_id: "chattogram",
    district_id: "rangamati",
    category_ids: ["hills"],
    name_en: "Sajek Valley",
    name_bn: "সাজেক ভ্যালি",
    slug: "sajek-valley",
    short_desc_en: "The Queen of Hills and Cloud Kingdom situated 1,800 feet above sea level.",
    short_desc_bn: "মেঘের রাজ্য হিসেবে পরিচিত ১৮০০ ফুট উঁচুতে অবস্থিত অপূর্ব মেঘমল্লারের উপত্যকা।",
    overview_en: "Nestled in the remote hill tracts of Rangamati near the Mizoram border, Sajek is famed for rolling morning sea-of-clouds, wooden eco-cottages on ridge lines, stunning views of Kanglak and Helipad peaks, and peaceful tribal hamlets.",
    overview_bn: "রাঙামাটির বাঘাইছড়ি উপজেলায় অবস্থিত সাজেক ভ্যালি মেঘ ছোঁয়ার এক অপার্থিব ঠিকানা। সকালের সমুদ্রের মতো ভাসমান মেঘ, পাহাড়ের শৈলশিরার কাঠের কটেজ ও কংলাক পাহাড়ের দৃশ্য পর্যটকদের মুগ্ধ করে।",
    history_en: "Historically home to the Lushai and Tripura ethnic communities, Sajek was connected to Khagrachhari via paved border roads by the Bangladesh Army Engineering Corps in recent decades.",
    history_bn: "লুসাই ও ত্রিপুরা জনগোষ্ঠীর আদি বাসভূমি। সাম্প্রতিক বছরগুলোতে বাংলাদেশ সেনাবাহিনীর মাধ্যমে নির্মিত দৃষ্টিনন্দন পাহাড়ি রাস্তার মাধ্যমে এটি দেশের শীর্ষ পর্যটন গন্তব্যে পরিণত হয়।",
    how_to_go_en: "Travel from Dhaka to Khagrachhari by AC bus. From Khagrachhari town, hire a local 4-wheel drive 'Chander Gari' (open safari jeep) under Army escort departs at 10 AM and 3 PM.",
    how_to_go_bn: "ঢাকা থেকে বাসে খাগড়াছড়ি। সেখান থেকে জিপ বা 'চান্দের গাড়ি' নিয়ে সেনাবাহিনীর নিরাপত্তা এসকর্টের সাথে সাজেক পৌঁছাতে প্রায় ৩ ঘণ্টা সময় লাগে।",
    best_time_en: "July to November (highest cloud density and lush emerald hill slopes).",
    best_time_bn: "জুলাই থেকে নভেম্বর (সবচেয়ে বেশি মেঘ ও ঘন সবুজ পাহাড় দেখার সেরা সময়)।",
    tips_en: "Book hillside cottages well in advance. Rise at 5:30 AM to watch the sea of white clouds sweeping below the verandahs. Trek up to Kanglak Para peak for 360-degree views.",
    tips_bn: "কটেজ আগে থেকেই বুকিং করে রাখুন। ভোরে হেলিপ্যাডে দাঁড়িয়ে মেঘের ওড়াউড়ি দেখুন এবং কংলাক পাড়ায় ট্র্যাকিং করুন। বাঁশের তৈরি খাবার উপভোগ করুন।",
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-17T10:00:00Z"
  },
  {
    id: "srimangal_tea_gardens",
    division_id: "sylhet",
    district_id: "moulvibazar",
    category_ids: ["forests"],
    name_en: "Sreemangal & Lawachara Rainforest",
    name_bn: "শ্রীমঙ্গল চা বাগান ও লাউয়াছড়া রেইনফরেস্ট",
    slug: "sreemangal-tea-lawachara",
    short_desc_en: "The Tea Capital of Bangladesh with terraced green estates, rainforest, and 7-layer tea.",
    short_desc_bn: "সবুজ গালিচায় মোড়ানো চা বাগান, রেইনফরেস্ট ও বিখ্যাত সাত রঙের চায়ের রাজধানী।",
    overview_en: "Sreemangal boasts over 40 rolling tea gardens, rubber estates, and pine orchards. Right alongside sits the Lawachara National Park, a semi-evergreen rainforest teeming with endangered Western Hoolock Gibbons, barking deer, and exotic birdlife.",
    overview_bn: "চা কন্যা শ্রীমঙ্গল বাংলাদেশের চা শিল্পের প্রাণকেন্দ্র। দিগন্ত বিস্তৃত সবুজের কার্পেট বিছানো চা বাগান এবং পাশেই লাউয়াছড়া জাতীয় উদ্যান যেখানে বিলুপ্তপ্রায় উল্লুক ও বন্যপ্রাণীর পদচারণা রয়েছে।",
    history_en: "Commercial tea planting in Sreemangal began in the mid-19th century under James Finlay and other pioneer planters, turning the region into one of the world's highest-yielding tea hubs.",
    history_bn: "উনিশ শতকের মাঝামাঝি সময়ে ব্রিটিশ চা রোপণকারীদের মাধ্যমে শ্রীমঙ্গলে বাণিজ্যিক চা চাষ শুরু হয়, যা আজ বৈশ্বিক চা উৎপাদনে অনন্য স্থান দখল করে আছে।",
    how_to_go_en: "Take the Parabat, Jayantika, or Kalani Express train from Dhaka directly to Sreemangal Station (approx 4.5 hours), or travel via highway by bus or car.",
    how_to_go_bn: "ঢাকা কমলাপুর থেকে পারাবত বা জয়ন্তিকা এক্সপ্রেস ট্রেনে সরাসরি শ্রীমঙ্গল নামা যায় (প্রায় ৪ ঘণ্টা)। এরপর অটোরিকশা বা জিপ নিয়ে চা বাগান ঘুরে দেখা যায়।",
    best_time_en: "September to March for pleasant cycling and walking; June to August for fresh green tea leaves flush.",
    best_time_bn: "সেপ্টেম্বর থেকে মার্চ মনোরম আবহাওয়া এবং সাইক্লিংয়ের জন্য আদর্শ; বর্ষায় চায়ের নতুন কুঁড়ির সতেজ রূপ চোখ জুড়ায়।",
    tips_en: "Rent a bicycle to ride through narrow paths inside tea gardens. Taste the legendary Nilkantha 7-layer tea in Manipuri Para.",
    tips_bn: "চা বাগানের মেঠোপথে সাইকেল চালান। নীলকণ্ঠ টি কেবিনের বিখ্যাত সাত রঙের চা পরখ করে দেখুন। লাউয়াছড়ায় স্থানীয় ট্র্যাকিং গাইড নিন।",
    image_url: "https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-18T10:00:00Z"
  },
  {
    id: "saint_martins_island",
    division_id: "chattogram",
    district_id: "coxs_bazar",
    category_ids: ["islands", "beaches"],
    name_en: "Saint Martin's Coral Island",
    name_bn: "সেন্টমার্টিন প্রবাল দ্বীপ",
    slug: "saint-martins-island",
    short_desc_en: "The only coral reef island in Bangladesh, fringed with coconut palms and turquoise sea.",
    short_desc_bn: "বাংলাদেশের একমাত্র প্রবাল দ্বীপ, নারকেল কুঞ্জ এবং নীল জলরাশির অপরূপ স্বর্গ।",
    overview_en: "Located in the northeastern Bay of Bengal, Narikel Jinjira (Saint Martin's Island) is famous for living coral reefs, azure waters, fresh green coconuts, crystal starry night skies, and the attached tiny rocky islet Chera Dwip.",
    overview_bn: "বঙ্গোপসাগরের বুকে জেগে থাকা অপরূপ নারিকেল জিঞ্জিরা বা সেন্টমার্টিন দ্বীপ। প্রবাল প্রাচীর, স্বচ্ছ নীল সমুদ্র, গাঙচিল ও ছেঁড়াদ্বীপের প্রবাল পাথরের সৈকত একে অনন্য করেছে।",
    history_en: "Inhabited by Arab sailors and fishermen dating back to the 18th century, it was later surveyed and named after Saint Martin, a former British governor of Chittagong.",
    history_bn: "১৮ শতকে আরব নাবিকদের মাধ্যমে পরিচিতি লাভ করে। প্রচুর নারিকেল গাছের কারণে স্থানীয়ভাবে এর নাম ছিল নারিকেল জিঞ্জিরা।",
    how_to_go_en: "From Cox's Bazar or Teknaf, authorized cruise ships (Keari Sindbad, Bay One, etc.) operate scenic voyages to Saint Martin's island during the tourist season.",
    how_to_go_bn: "কক্সবাজার বা টেকনাফ থেকে সরকার অনুমোদিত নিরাপদ বিলাসবহুল জাহাজে করে বঙ্গোপসাগর পাড়ি দিয়ে প্রায় আড়াই ঘণ্টায় সেন্টমার্টিন পৌঁছানো যায়।",
    best_time_en: "November to February (government regulated tourist season with calm seas).",
    best_time_bn: "নভেম্বর থেকে ফেব্রুয়ারি (অনুমোদিত পর্যটন মৌসুম যখন সাগর শান্ত থাকে)।",
    tips_en: "Do not collect or step on live corals. Rent a bicycle to circle the island. Walk across the sandspit to Chera Dwip during low tide.",
    tips_bn: "প্রবাল পাথর ও শামুক-ঝিনুক সৈকত থেকে তুলবেন না। রাতে দ্বীপের খোলা আকাশে তারা দেখা এক অনন্য অভিজ্ঞতা। সামুদ্রিক তাজা মাছ পরখ করুন।",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-19T10:00:00Z"
  },
  {
    id: "ratargul_swamp_forest",
    division_id: "sylhet",
    district_id: "sylhet_dist",
    category_ids: ["forests", "lakes"],
    name_en: "Ratargul Freshwater Swamp Forest",
    name_bn: "রাতারগুল সোয়াম্প ফরেস্ট",
    slug: "ratargul-swamp-forest",
    short_desc_en: "The Amazon of Bangladesh: the country's only freshwater submerged swamp forest.",
    short_desc_bn: "বাংলার আমাজন খ্যাত দেশের একমাত্র মিঠাপানির জলমগ্ন সোয়াম্প ফরেস্ট।",
    overview_en: "Fed by the Gowain river and rainwater from Indian hills, Ratargul is submerged 20 to 30 feet in monsoon, turning water lilies, Koroch trees, and hanging canopies into an otherworldly wonderland explored exclusively by traditional silent wooden dinghies.",
    overview_bn: "গোয়াইন নদীর তীরে অবস্থিত রাতারগুল বর্ষাকালে ২০-৩০ ফুট পানিতে নিমজ্জিত হয়। হিজল ও কড়চ গাছের পানির নিচ থেকে জেগে ওঠা ডালপালা যেন এক রূপকথার দৃশ্য সৃষ্টি করে।",
    history_en: "Recognized as a protected special biodiversity reserve by the Department of Forestry in 1973, covering around 504 acres.",
    history_bn: "১৯৭৩ সালে বন বিভাগ কর্তৃক এটি সংরক্ষিত বিশেষ জীববৈচিত্র্য বন হিসেবে ঘোষিত হয় এবং এর আয়তন প্রায় ৫০৪ একর।",
    how_to_go_en: "From Sylhet city (Amberkhana), take a CNG auto-rickshaw to Motorghat (approx 45 minutes). Hire a local non-motorized wooden boat from the jetty.",
    how_to_go_bn: "সিলেট আম্বরখানা থেকে সিএনজি নিয়ে মোটরঘাট বা রাতারগুল পয়েন্টে যান। সেখান থেকে সরকার নির্ধারিত ভাড়ায় ইঞ্জিনবিহীন কাঠের ডিঙ্গি নৌকা ভাড়া নিন।",
    best_time_en: "July to October (monsoon and post-monsoon when the forest is completely flooded).",
    best_time_bn: "জুলাই থেকে অক্টোবর (বর্ষা মৌসুমে যখন পুরো বনটি পানিতে ডুবে থাকে)।",
    tips_en: "Use hand-rowed silent boats rather than motor boats to preserve wildlife tranquility. Climb the watchtower for a canopy view.",
    tips_bn: "বনের নীরবতা বজায় রাখতে বৈঠাচালিত নৌকা বেছে নিন। ওয়াচটাওয়ারে উঠে চারপাশের সবুজের দৃশ্য ক্যামেরাবন্দী করুন।",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-20T10:00:00Z"
  },
  {
    id: "paharpur_somapura",
    division_id: "rajshahi",
    district_id: "naogaon",
    category_ids: ["historical"],
    name_en: "Somapura Mahavihara (Paharpur)",
    name_bn: "সোমপুর মহাবিহার (পাহাড়পুর)",
    slug: "somapura-mahavihara-paharpur",
    short_desc_en: "UNESCO World Heritage 8th-century Buddhist monastery, one of the greatest in Asia.",
    short_desc_bn: "৮ম শতাব্দীর এশিয়ার অন্যতম বৃহত্তম প্রাচীন বৌদ্ধ বিহার ও ইউনেস্কো বিশ্ব ঐতিহ্য।",
    overview_en: "Built during the Pala Empire, this 27-acre quadrangle monastic complex features 177 residential cells and a colossal cruciform central temple adorned with intricate terracotta plaques illustrating folklore, deities, and daily life.",
    overview_bn: "পাল বংশের দ্বিতীয় রাজা ধর্মপাল দেব কর্তৃক প্রতিষ্ঠিত এই সুবিশাল বৌদ্ধবিহার ২৭ একর এলাকা জুড়ে বিস্তৃত। এর কেন্দ্রীয় মন্দিরের দেওয়ালের টেরাকোটার কাজ প্রাচীন ভারতীয় শিল্পের অনন্য নিদর্শন।",
    history_en: "Founded around 781–821 CE by King Dharmapala, it served as a monumental center of learning where scholars including Atisa Dipankara resided, before being designated a UNESCO site in 1985.",
    history_bn: "৭৮১-৮২১ খ্রিস্টাব্দে পাল সম্রাট ধর্মপাল এটি নির্মাণ করেন। ১৯৮৫ সালে ইউনেস্কো এটিকে বিশ্ব ঐতিহ্যবাহী স্থান হিসেবে ঘোষণা করে।",
    how_to_go_en: "From Dhaka, take an intercity train to Joypurhat or Shantahar junction, then hire an auto-rickshaw or taxi for 10 km to Paharpur.",
    how_to_go_bn: "ঢাকা থেকে আন্তঃনগর ট্রেনে জয়পুরহাট বা সান্তাহার জংশন। সেখান থেকে সিএনজি বা গাড়িতে মাত্র ১০ কিলোমিটার দূরে পাহাড়পুর বৌদ্ধবিহার।",
    best_time_en: "November to February for mild pleasant weather.",
    best_time_bn: "নভেম্বর থেকে ফেব্রুয়ারি (শীতের মনোরম আবহাওয়া)।",
    tips_en: "Visit the onsite archaeological museum exhibiting sculptures and copperplates. Hire an official certified monument guide.",
    tips_bn: "সংলগ্ন জাদুঘরে রক্ষিত শতবর্ষী প্রত্নতাত্ত্বিক ভাস্কর্য ও তাম্রশাসনগুলো পরিদর্শন করুন।",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    is_featured: false,
    is_published: true,
    created_at: "2026-01-21T10:00:00Z"
  },
  {
    id: "sixty_dome_mosque",
    division_id: "khulna",
    district_id: "bagerhat",
    category_ids: ["historical", "religious"],
    name_en: "Sixty Dome Mosque (Shat Gombuj)",
    name_bn: "ষাট গম্বুজ মসজিদ",
    slug: "sixty-dome-mosque-bagerhat",
    short_desc_en: "15th-century UNESCO World Heritage brick mosque with 77 domes and Tughlaq architecture.",
    short_desc_bn: "১৫ শতকের ইউনেস্কো বিশ্ব ঐতিহ্য লাল ইটের ৭৭টি গম্বুজবিশিষ্ট ঐতিহাসিক মসজিদ।",
    overview_en: "Founded by saint-general Khan Jahan Ali in Khalifatabad (Bagerhat), the Sixty Dome Mosque actually features 77 domes supported by 60 stone pillars. Its tapered brick fortress walls reflect remarkable Bengal Sultanate architectural mastery.",
    overview_bn: "হযরত খানজাহান আলী (রহ.) কর্তৃক প্রতিষ্ঠিত খলিফাতাবাদের এই অনুপম স্থাপত্যে ৬০টি পাথরের স্তম্ভের ওপর ৭৭টি সুদৃশ্য গম্বুজ রয়েছে। ১৯৮৫ সালে এটি ইউনেস্কোর বিশ্ব ঐতিহ্য স্বীকৃতি পায়।",
    history_en: "Constructed in the mid-15th century and served as both a grand congregation mosque and administrative courtroom.",
    history_bn: "১৫ শতকের মাঝামাঝি সময়ে নির্মিত এই সুবিশাল মসজিদটি তৎকালীন সময়ে নামাযের পাশাপাশি দরবার হল হিসেবে ব্যবহৃত হতো।",
    how_to_go_en: "Located 5 km outside Bagerhat town and 40 km from Khulna city, accessible easily via highway buses and taxis.",
    how_to_go_bn: "খুলনা শহর থেকে মাত্র ৪০ কিমি এবং বাগেরহাট জেলা সদর থেকে ৫ কিমি দূরে মহাসড়কের পাশেই অবস্থিত।",
    best_time_en: "October to March.",
    best_time_bn: "অক্টোবর থেকে মার্চ মাস।",
    tips_en: "Visit nearby Khan Jahan Ali's shrine and Ghora Dighi lake in the same afternoon circuit.",
    tips_bn: "মসজিদ সংলগ্ন ঘোড়া দিঘি এবং খানজাহান আলীর মাজার একই সাথে পরিদর্শন করুন।",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    is_featured: false,
    is_published: true,
    created_at: "2026-01-22T10:00:00Z"
  },
  {
    id: "kuakata_beach",
    division_id: "barishal",
    district_id: "patuakhali",
    category_ids: ["beaches"],
    name_en: "Kuakata Sea Beach (Daughter of the Sea)",
    name_bn: "কুয়াকাটা সমুদ্র সৈকত (সাগরকন্যা)",
    slug: "kuakata-sea-beach",
    short_desc_en: "Unique beach where both sunrise and sunset can be observed unobstructed over the Bay of Bengal.",
    short_desc_bn: "একই সৈকতে দাঁড়িয়ে দিগন্তে সূর্যোদয় ও সূর্যাস্ত দেখার বিরল প্রাকৃতিক বেলাভূমি।",
    overview_en: "Known as 'Sagor Konna' (Daughter of the Sea), Kuakata offers an 18-kilometer panoramic beach, the tranquil mangrove forest of Fatrar Bon, the historic water well of the Rakhine settlers, and centuries-old Buddhist statues.",
    overview_bn: "পটুয়াখালী জেলার সর্বদক্ষিণে অবস্থিত কুয়াকাটা সৈকত থেকে সূর্যোদয় এবং সূর্যাস্ত উভয়েরই পূর্ণ দৃশ্য অবলোকন করা যায়। রাখাইন পল্লী, বৌদ্ধ মন্দির এবং প্রাচীন কুয়ার ইতিহাস এখানে সমৃদ্ধ।",
    history_en: "Settled by Rakhine people expelled from Arakan in 1784, who dug traditional wells ('Kua') in search of freshwater along the shore, giving the place its name 'Kuakata'.",
    history_bn: "১৭৮৪ সালে আরাকান থেকে বিতাড়িত রাখাইন জনগোষ্ঠীর সদস্যরা মিষ্টি পানির জন্য সৈকত তীরে কুয়া (কূপ) খনন করেন, যেখান থেকে 'কুয়াকাটা' নামের উৎপত্তি।",
    how_to_go_en: "With the Padma Bridge and Lebukhali Bridge open, modern AC buses run directly from Dhaka to Kuakata in only 6 hours. Luxury river cruise launches also connect Dhaka to Patuakhali.",
    how_to_go_bn: "পদ্মা সেতু উদ্বোধনের পর ঢাকা থেকে মাত্র ৬ ঘণ্টায় সরাসরি বাসে কুয়াকাটা পৌঁছানো যায়। বিলাসবহুল লঞ্চে বরিশাল বা পটুয়াখালী হয়েও যাওয়া যায়।",
    best_time_en: "October to March.",
    best_time_bn: "অক্টোবর থেকে মার্চ।",
    tips_en: "Wake early at 5:00 AM to see the sunrise at Gongamati point, then head to Lebur Char for the sunset.",
    tips_bn: "সূর্যোদয়ের জন্য গঙ্গামতির চরে এবং সূর্যাস্তের জন্য লেবুর চরে যান। তাজা কাঁকড়া ও সামুদ্রিক মাছের বারবিকিউ উপভোগ করুন।",
    image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-23T10:00:00Z"
  },
  {
    id: "lalbagh_fort",
    division_id: "dhaka",
    district_id: "dhaka_dist",
    category_ids: ["historical"],
    name_en: "Lalbagh Fort & Ahsan Manzil",
    name_bn: "লালবাগ কেল্লা ও আহসান মঞ্জিল",
    slug: "lalbagh-fort-ahsan-manzil",
    short_desc_en: "17th-century Mughal fort complex with Pari Bibi's tomb and the Pink Palace on Buriganga river.",
    short_desc_bn: "১৭ শতকের মুঘল কেল্লা, পরী বিবির মাজার এবং বুড়িগঙ্গা তীরের ঐতিহাসিক গোলাপী প্রাসাদ।",
    overview_en: "Lalbagh Fort is an incomplete 17th-century Mughal fortification built by Prince Muhammad Azam, showcasing a three-domed mosque, the magnificent tomb of Pari Bibi with white marble, and a secret hamamkhana. Nearby Ahsan Manzil was the official residence and seat of the Nawabs of Dhaka.",
    overview_bn: "মুঘল সুবেদার শাহজাদা মুহাম্মদ আজম কর্তৃক ১৬৭৮ সালে নির্মিত লালবাগ কেল্লা এবং বুড়িগঙ্গার তীরে নবাবদের ঐতিহাসিক বাসভবন আহসান মঞ্জিল পুরান ঢাকার শ্রেষ্ঠ আকর্ষণ।",
    history_en: "Construction began in 1678 CE and was halted when beloved daughter Pari Bibi passed away suddenly within the fort.",
    history_bn: "১৬৭৮ সালে শাহজাদা আজম এর নির্মাণ শুরু করেন। পরবর্তীতে শায়েস্তা খাঁ-র কন্যা পরী বিবির আকস্মিক মৃত্যুর পর কাজ অসমাপ্ত রাখা হয়।",
    how_to_go_en: "Located in Old Dhaka (Lalbagh), accessible by ride-sharing cars, CNG rickshaws, and metro rail to Press Club followed by rickshaw.",
    how_to_go_bn: "পুরান ঢাকার লালবাগে অবস্থিত। সিএনজি বা রিকশায় লালবাগ কেল্লা ও আহসান মঞ্জিল একই দিনে পরিদর্শন করা যায়।",
    best_time_en: "All year round (closed on Sundays and national holidays).",
    best_time_bn: "সারা বছরই পরিদর্শনযোগ্য (রবিবার ও সরকারি ছুটির দিনে জাদুঘর বন্ধ থাকে)।",
    tips_en: "Savor authentic Old Dhaka Kacchi Biryani and Laban at traditional dining halls nearby on Nazimuddin Road.",
    tips_bn: "কেল্লা পরিদর্শনের পর পুরান ঢাকার ঐতিহ্যবাহী কাচ্চি বিরিয়ানি, বাকরখানি ও বোরহানি পরখ করুন।",
    image_url: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-24T10:00:00Z"
  },
  {
    id: "tanguar_haor",
    division_id: "sylhet",
    district_id: "sunamganj",
    category_ids: ["lakes"],
    name_en: "Tanguar Haor & Shimul Bagan",
    name_bn: "টাঙ্গুয়ার হাওর ও রক্তিম শিমুল বাগান",
    slug: "tanguar-haor-shimul-bagan",
    short_desc_en: "UNESCO Ramsar wetland wilderness with houseboat cruising and blooming crimson silk-cotton trees.",
    short_desc_bn: "ইউনেস্কো রামসার সাইট টাঙ্গুয়ার হাওরের হাউসবোট ক্রুজ এবং যাদুকাটার তীরে শিমুল বাগান।",
    overview_en: "A unique wetland ecosystem spreading across 100 square kilometers below the Meghalaya hills. In monsoon it transforms into a sea of crystal blue water where wooden luxury houseboats cruise peacefully; in spring, nearby Shimul Bagan ignites with thousands of blazing crimson blossoms.",
    overview_bn: "ভারতের মেঘালয় পাহাড়ের পাদদেশে অবস্থিত এক স্বর্গীয় জলভূমি। বর্ষায় এটি পরিণত হয় সুবিশাল নীল সাগরে, যেখানে আধুনিক সুযোগ-সুবিধা সম্পন্ন হাউসবোটে রাত কাটানো ভ্রমণপিপাসুদের প্রিয় অভিজ্ঞতা।",
    history_en: "Declared Bangladesh's second Ramsar wetland site of international ecological importance in the year 2000.",
    history_bn: "২০০০ সালে এটি আন্তর্জাতিকভাবে গুরুত্বপূর্ণ ইউনেস্কো রামসার জলাভূমি এলাকা হিসেবে ঘোষিত হয়।",
    how_to_go_en: "Bus from Dhaka to Sunamganj town. From Sunamganj, take a CNG to Tahirpur boat ghat to board pre-booked wooden cruise houseboats.",
    how_to_go_bn: "ঢাকা থেকে বাসে সুনামগঞ্জ শহর। সেখান থেকে সিএনজিতে তাহিরপুর ঘাট গিয়ে আগে থেকে বুক করা হাউসবোটে উঠুন।",
    best_time_en: "July to October for houseboating; February to March for blooming red Shimul flowers.",
    best_time_bn: "জুলাই থেকে অক্টোবর হাউসবোটে জলভ্রমণের জন্য সেরা; ফেব্রুয়ারি-মার্চে রক্তিম শিমুল ফুলের মেলা দেখার উপযুক্ত সময়।",
    tips_en: "Opt for an overnight houseboat stay with local culinary fish platters. Carry life vests for swimming in the crystal waters of Niladri Lake.",
    tips_bn: "হাওরে এক বা দুই রাত হাউসবোটে কাটান। নিলাদ্রি লেক এবং যাদুকাটা নদীর স্বচ্ছ পানিতে স্নান করার সময় লাইফ জ্যাকেট ব্যবহার করুন।",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    is_featured: true,
    is_published: true,
    created_at: "2026-01-25T10:00:00Z"
  },
  {
    id: "birishiri_ceramic_hills",
    division_id: "mymensingh",
    district_id: "netrokona",
    category_ids: ["hills", "lakes"],
    name_en: "Birishiri Ceramic Hills & Someshwari",
    name_bn: "বিরিশিরি চীনামাটির পাহাড় ও সোমেশ্বরী",
    slug: "birishiri-ceramic-hills-someshwari",
    short_desc_en: "White clay hills surrounding a turquoise lake beside the tranquil Someshwari river.",
    short_desc_bn: "নীল জলের হ্রদ ঘেরা সাদা চীনামাটির পাহাড় এবং শান্ত স্বচ্ছ সোমেশ্বরী নদী।",
    overview_en: "Located in Durgapur near the Meghalayan border, Birishiri is famous for its picturesque turquoise blue lake cradled by chalk-white ceramic clay mounds, traditional Garo ethnic culture, and the Ranikhong church on the hilltop.",
    overview_bn: "নেত্রকোনার সুসং দুর্গাপুরে অবস্থিত বিরিশিরির প্রধান আকর্ষণ সাদা চীনামাটির পাহাড়ের কোল ঘেঁষা স্বচ্ছ নীল জলের হ্রদ, রানীখং মিশন ও গারো কালচারাল একাডেমি।",
    history_en: "The white china clay deposits discovered here in the 1960s supplied raw materials for ceramics across Bangladesh, carving out the dramatic landscape.",
    history_bn: "১৯৬০-এর দশকে আবিষ্কৃত এই চীনামাটির খনি থেকে বাণিজ্যিক মাটি উত্তোলনের ফলে তৈরি হয়েছে দৃষ্টিনন্দন নীল জলের কৃত্রিম হ্রদ ও সাদা পাহাড়।",
    how_to_go_en: "Take a direct bus or train from Dhaka to Netrokona or Jaria Jhanjail, then take a CNG or local motor-rickshaw across the Someshwari river to Durgapur.",
    how_to_go_bn: "ঢাকা থেকে বাসে বা ট্রেনে ময়মনসিংহ হয়ে সুসং দুর্গাপুর পৌঁছানো যায়। সোমেশ্বরী নদী পার হয়ে রিকশা বা মোটরসাইকেলে বিজয়পুর চীনামাটির পাহাড়ে যাওয়া যায়।",
    best_time_en: "October to March (dry season when the water turns brightest turquoise).",
    best_time_bn: "অক্টোবর থেকে মার্চ (শীতকালে যখন সোমেশ্বরী নদী শান্ত থাকে এবং হ্রদের পানি গাঢ় নীল দেখায়)।",
    tips_en: "Cross the Someshwari river on wooden boat and visit the Garo cultural academy in Durgapur.",
    tips_bn: "নদী পার হয়ে বিজয়পুর সীমান্তে চীনামাটির পাহাড় দেখুন এবং পাহাড়ে দাঁড়িয়ে মেঘালয়ের দৃশ্য উপভোগ করুন।",
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    is_featured: false,
    is_published: true,
    created_at: "2026-01-26T10:00:00Z"
  }
];

// Featured Articles & Travel Guides
export const ARTICLES: Article[] = [
  {
    id: "guide_sundarbans_safari",
    title_en: "The Ultimate Guide to Exploring the Sundarbans",
    title_bn: "সুন্দরবন ভ্রমণ সহায়িকা: রয়েল বেঙ্গল টাইগারের দেশে রোমাঞ্চ",
    slug: "ultimate-guide-sundarbans-safari",
    excerpt_en: "Everything you need to know about planning a responsible wildlife cruise in the world's largest mangrove forest.",
    excerpt_bn: "বিশ্বের বৃহত্তম ম্যানগ্রোভ অরণ্যে ক্রুজ পরিকল্পনা, নিরাপত্তা নিয়মাবলী ও বন্যপ্রাণী দেখার পরিপূর্ণ গাইড।",
    content_en: "Cruising through the labyrinthine creeks of the Sundarbans is a life-changing experience. Learn about permits, best vessels, Katka wildlife sanctuary, and listening to the calls of spotted deer.",
    content_bn: "সুন্দরবনের শ্বাসমূলের বন আর জোয়ার-ভাটার শান্ত জলপথে ভেসে চলা যেন এক ভিন্ন জগতের অনুভূতি। কটকা অভয়ারণ্য, হারবাড়িয়া ও করমজল পয়েন্ট ঘুরে দেখার বিস্তারিত টিপস।",
    author_en: "Tourism Board Travel Desk",
    author_bn: "বাংলাদেশ ট্যুরিজম বোর্ড ডেস্ক",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    read_time_en: "6 min read",
    read_time_bn: "৬ মিনিট পঠন",
    related_district_id: "bagerhat",
    related_spot_id: "sundarbans",
    tags: ["Sundarbans", "Wildlife", "Eco-Tourism"],
    is_published: true,
    published_at: "2026-01-10"
  },
  {
    id: "guide_7day_bangladesh_itinerary",
    title_en: "7 Days in Beautiful Bangladesh: The Perfect Golden Itinerary",
    title_bn: "বাংলাদেশে ৭ দিনের সেরা ভ্রমণ পরিকল্পনা: রাজধানী থেকে পাহাড় ও সমুদ্র",
    slug: "7-days-bangladesh-golden-itinerary",
    excerpt_en: "A step-by-step 7-day travel plan covering Old Dhaka, Sylhet tea estates, and Cox's Bazar beach.",
    excerpt_bn: "পুরান ঢাকার ঐতিহ্য, শ্রীমঙ্গলের চা বাগান ও কক্সবাজারের সৈকত নিয়ে ৭ দিনের নিখুঁত ভ্রমণ পরিকল্পনা।",
    content_en: "Day 1-2: Explore historic Mughal Dhaka and Panam City. Day 3-4: Journey to Sreemangal tea estates and Lawachara rainforest. Day 5-7: Cox's Bazar beach and scenic Marine Drive sunset.",
    content_bn: "দিন ১-২: পুরান ঢাকা ও সোনারগাঁও পানাম নগর। দিন ৩-৪: শ্রীমঙ্গলের সবুজ চা বাগান ও লাউয়াছড়া। দিন ৫-৭: কক্সবাজার সমুদ্র সৈকত ও মেরিন ড্রাইভে মুক্ত বাতাস।",
    author_en: "Tanvir Rahman",
    author_bn: "তানভীর রহমান",
    image_url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80",
    read_time_en: "8 min read",
    read_time_bn: "৮ মিনিট পঠন",
    related_district_id: "coxs_bazar",
    related_spot_id: "coxs_bazar_beach",
    tags: ["Itinerary", "Travel Guide", "Best of BD"],
    is_published: true,
    published_at: "2026-01-12"
  },
  {
    id: "guide_culinary_delicacies",
    title_en: "Culinary Map of Bangladesh: 64 Districts and Famous Delicacies",
    title_bn: "বাংলাদেশের রসনা বিলাস: জেলাভিত্তিক ঐতিহ্যবাহী খাবারের রোমাঞ্চ",
    slug: "culinary-map-64-districts-food",
    excerpt_en: "Discover why Comilla is famous for Rasmalai, Bogura for sweet curd, and Chittagong for Mezban beef.",
    excerpt_bn: "কুমিল্লার রসমালাই, বগুড়ার দই, চট্টগ্রামের মেজবানি মাংস থেকে চাঁদপুরের রূপালী ইলিশের বিস্তারিত ইতিহাস।",
    content_en: "Food is the gateway to culture in Bangladesh. Every administrative district takes pride in signature gastronomic delights perfected over generations.",
    content_bn: "প্রতিটি জেলার রয়েছে নিজস্ব ইতিহাস ও রসনার গল্প। স্থানীয় খাঁটি স্বাদ খুঁজে পাওয়ার গোপন টিপস জেনে নিন এই গাইড থেকে।",
    author_en: "Food & Culture Cell",
    author_bn: "খাদ্য ও সংস্কৃতি গবেষক দল",
    image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    read_time_en: "5 min read",
    read_time_bn: "৫ মিনিট পঠন",
    related_district_id: "dhaka_dist",
    tags: ["Food", "Culture", "Cuisine"],
    is_published: true,
    published_at: "2026-01-14"
  }
];

// Curated Media Assets for Image Manager
export const MEDIA_ITEMS: MediaItem[] = [
  {
    id: "media_sundarbans_1",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    file_name: "sundarbans_mangrove_canopy.jpg",
    alt_en: "Lush green Sundarbans mangrove forest waterways and tiger habitat",
    alt_bn: "সুন্দরবনের শ্বাসমূলের বন এবং শান্ত জলপথের দৃশ্য",
    file_size: 428000,
    mime_type: "image/jpeg",
    uploaded_at: "2026-01-15T09:30:00Z"
  },
  {
    id: "media_coxsbazar_1",
    url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1200&q=80",
    file_name: "coxs_bazar_sunset_beach.jpg",
    alt_en: "Cox's Bazar golden sand shoreline during sunset over Bay of Bengal",
    alt_bn: "কক্সবাজার সমুদ্র সৈকতে অপরূপ সূর্যাস্তের দৃশ্য",
    file_size: 512000,
    mime_type: "image/jpeg",
    uploaded_at: "2026-01-16T14:20:00Z"
  },
  {
    id: "media_sajek_1",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    file_name: "sajek_valley_sea_of_clouds.jpg",
    alt_en: "Sajek Valley panoramic mountain ridges floating in clouds",
    alt_bn: "সাজেক ভ্যালির মেঘের সমুদ্র ও পাহাড়ি শৈলশিরা",
    file_size: 389000,
    mime_type: "image/jpeg",
    uploaded_at: "2026-01-17T11:15:00Z"
  },
  {
    id: "media_sreemangal_1",
    url: "https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=1200&q=80",
    file_name: "sreemangal_tea_estate.jpg",
    alt_en: "Sreemangal lush rolling green tea garden terrace hills",
    alt_bn: "শ্রীমঙ্গলের সবুজ চা বাগানের বিস্তীর্ণ রূপ",
    file_size: 460000,
    mime_type: "image/jpeg",
    uploaded_at: "2026-01-18T08:45:00Z"
  },
  {
    id: "media_lalbagh_1",
    url: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80",
    file_name: "lalbagh_fort_dhaka.jpg",
    alt_en: "Mughal architecture of Lalbagh Fort and Pari Bibi Tomb in Old Dhaka",
    alt_bn: "পুরান ঢাকার লালবাগ কেল্লা এবং পরী বিবির মাজার",
    file_size: 395000,
    mime_type: "image/jpeg",
    uploaded_at: "2026-01-20T16:10:00Z"
  },
  {
    id: "media_kuakata_1",
    url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    file_name: "kuakata_panoramic_beach.jpg",
    alt_en: "Kuakata panoramic beach where sunrise and sunset can be viewed",
    alt_bn: "কুয়াকাটা সাগরকন্যা সমুদ্র সৈকত",
    file_size: 478000,
    mime_type: "image/jpeg",
    uploaded_at: "2026-01-22T10:05:00Z"
  }
];

