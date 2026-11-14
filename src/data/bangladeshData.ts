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
    description_en: "The historic capital region and bustling cultural heartland situated along the Buriganga river, boasting Mughal architecture and historic heritage.",
    description_bn: "ঐতিহাসিক বুড়িগঙ্গা নদীর তীরে অবস্থিত বাংলাদেশের রাজধানী অঞ্চল, যা সমৃদ্ধ মুঘল স্থাপত্য ও শতবর্ষী ঐতিহ্যের কেন্দ্রবিন্দু।",
    headquarters_en: "Dhaka",
    headquarters_bn: "ঢাকা",
    area_sq_km: 20593.74,
    districts_count: 13,
    image_url: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=400&q=80",
    is_published: true,
    order: 1
  },
  {
    id: "chattogram",
    name_en: "Chattogram",
    name_bn: "চট্টগ্রাম",
    slug: "chattogram",
    description_en: "The premier maritime and coastal gateway adorned with the world's longest unbroken natural sea beach, lush hill tracts, and serene coastal islands.",
    description_bn: "বিশ্বের দীর্ঘতম অবিচ্ছিন্ন সমুদ্র সৈকত, মনোরম পাহাড়ি অঞ্চল ও মনোরম প্রবাল দ্বীপের সমন্বয়ে গঠিত বাংলাদেশের বন্দর ও পর্যটন রাজধানী।",
    headquarters_en: "Chattogram",
    headquarters_bn: "চট্টগ্রাম",
    area_sq_km: 33908.55,
    districts_count: 11,
    image_url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=400&q=80",
    is_published: true,
    order: 2
  },
  {
    id: "sylhet",
    name_en: "Sylhet",
    name_bn: "সিলেট",
    slug: "sylhet",
    description_en: "The enchanting land of emerald tea gardens, crystal-clear stone rivers, wetland haors, and the sacred shrines of revered Sufi saints.",
    description_bn: "দুটি পাতা একটি কুঁড়ির সবুজ শ্যামল চা বাগান, স্বচ্ছ পানির পাথুরে নদী, হাওরের বিস্তার এবং পুণ্যভূমি হিসেবে খ্যাত পর্যটন অঞ্চল।",
    headquarters_en: "Sylhet",
    headquarters_bn: "সিলেট",
    area_sq_km: 12635.22,
    districts_count: 4,
    image_url: "https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=400&q=80",
    is_published: true,
    order: 3
  },
  {
    id: "khulna",
    name_en: "Khulna",
    name_bn: "খুলনা",
    slug: "khulna",
    description_en: "Gateway to the UNESCO World Heritage Sundarbans, the world's largest mangrove forest and home of the majestic Royal Bengal Tiger.",
    description_bn: "ইউনেস্কো বিশ্ব ঐতিহ্য সুন্দরবনের প্রবেশদ্বার, বিশ্বের বৃহত্তম ম্যানগ্রোভ বন এবং বিখ্যাত রয়েল বেঙ্গল টাইগারের প্রাকৃতিক আবাসস্থল।",
    headquarters_en: "Khulna",
    headquarters_bn: "খুলনা",
    area_sq_km: 22284.22,
    districts_count: 10,
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80",
    is_published: true,
    order: 4
  },
  {
    id: "rajshahi",
    name_en: "Rajshahi",
    name_bn: "রাজশাহী",
    slug: "rajshahi",
    description_en: "The historic Silk City along the Padma river, celebrated for sweet mangoes, medieval terracotta temples, and ancient Buddhist heritage sites.",
    description_bn: "পদ্মাপাড়ের রেশম নগরী, বিশ্বখ্যাত সুস্বাদু আম, প্রাচীন বৌদ্ধ বিহার এবং অপূর্ব টেরাকোটা মন্দিরের জন্য পরিচিত ঐতিহাসিক অঞ্চল।",
    headquarters_en: "Rajshahi",
    headquarters_bn: "রাজশাহী",
    area_sq_km: 18153.08,
    districts_count: 8,
    image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80",
    is_published: true,
    order: 5
  },
  {
    id: "barishal",
    name_en: "Barishal",
    name_bn: "বরিশাল",
    slug: "barishal",
    description_en: "The Venice of Bengal, interwoven with meandering river networks, floating guava markets, and the panoramic Kuakata sea beach.",
    description_bn: "বাংলার ভেনিসখ্যাত নদীমাতৃক শস্যভাণ্ডার, ভাসমান পেয়ারা বাজার এবং সূর্যোদয় ও সূর্যাস্তের অপূর্ব বেলাভূমি কুয়াকাটা।",
    headquarters_en: "Barishal",
    headquarters_bn: "বরিশাল",
    area_sq_km: 13225.20,
    districts_count: 6,
    image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=80",
    is_published: true,
    order: 6
  },
  {
    id: "rangpur",
    name_en: "Rangpur",
    name_bn: "রংপুর",
    slug: "rangpur",
    description_en: "The northern agricultural expanse renowned for the magnificent Tajhat Palace, Kantajew Temple terracotta, and the Tea gardens of Tentulia.",
    description_bn: "ঐতিহাসিক তাজহাট রাজবাড়ি, কান্তজিউ মন্দিরের অনুপম পোড়ামাটির কারুকাজ এবং তেঁতুলিয়ার সমতল চা বাগানের উত্তরবঙ্গের প্রাণকেন্দ্র।",
    headquarters_en: "Rangpur",
    headquarters_bn: "রংপুর",
    area_sq_km: 16184.99,
    districts_count: 8,
    image_url: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=400&q=80",
    is_published: true,
    order: 7
  },
  {
    id: "mymensingh",
    name_en: "Mymensingh",
    name_bn: "ময়মনসিংহ",
    slug: "mymensingh",
    description_en: "Rich in folkloric Gitika heritage, serene ceramic hills, crystal Someshwari river, and Garo hills along the northern border.",
    description_bn: "ময়মনসিংহ গীতিকার গৌরবময় লোকঐতিহ্য, বিরিশিরির চীনামাটির পাহাড়, শান্ত সোমেশ্বরী নদী ও গারো পাহাড় ঘেরা নান্দনিক ভূপ্রকৃতি।",
    headquarters_en: "Mymensingh",
    headquarters_bn: "ময়মনসিংহ",
    area_sq_km: 10584.06,
    districts_count: 4,
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
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
    description_en: "The energetic capital city with 400 years of Mughal and British history, Lalbagh Fort, Ahsan Manzil, and old street food.",
    description_bn: "চারশত বছরের সমৃদ্ধ মুঘল ও ব্রিটিশ ঐতিহ্য, লালবাগ কেল্লা, আহসান মঞ্জিল এবং পুরান ঢাকার বিখ্যাত খাবারের রাজধানী।",
    famous_for_en: "Lalbagh Fort, Ahsan Manzil, Dhakai Biryani & Bakarkhani",
    famous_for_bn: "লালবাগ কেল্লা, আহসান মঞ্জিল, ঢাকাই বিরিয়ানি ও বাকরখানি",
    image_url: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "gazipur",
    division_id: "dhaka",
    name_en: "Gazipur",
    name_bn: "গাজীপুর",
    slug: "gazipur",
    description_en: "Famous for Bhawal National Park, sprawling eco-resorts, and dense Sal forests located just north of the capital.",
    description_bn: "ভাওয়াল জাতীয় উদ্যান, ঐতিহ্যবাহী শালবন এবং অসংখ্য মনোরম ইকো-রিসোর্টের জন্য জনপ্রিয়।",
    famous_for_en: "Bhawal National Park & Luxury Eco Resorts",
    famous_for_bn: "ভাওয়াল জাতীয় উদ্যান ও ইকো রিসোর্ট",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "narayanganj",
    division_id: "dhaka",
    name_en: "Narayanganj",
    name_bn: "নারায়ণগঞ্জ",
    slug: "narayanganj",
    description_en: "Ancient capital Sonargaon, the mysterious Panam City, and the Folk Art Museum celebrating centuries of Muslin and Jamdani weaving.",
    description_bn: "প্রাচীন বাংলার রাজধানী সোনারগাঁও, ঐতিহ্যবাহী পানাম নগর এবং জামদানি শাড়ির ইতিহাস।",
    famous_for_en: "Panam Nagar & Jamdani Weaving",
    famous_for_bn: "পানাম নগর ও জামদানি শিল্প",
    image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "tangail",
    division_id: "dhaka",
    name_en: "Tangail",
    name_bn: "টাঙ্গাইল",
    slug: "tangail",
    description_en: "Home to the world-famous Tangail Saree, Porabari Chamcham sweet, Atia Mosque, and the scenic Madhupur national forest.",
    description_bn: "ঐতিহ্যবাহী টাঙ্গাইল শাড়ি, পোড়াবাড়ির চমচম, আতিয়া মসজিদ এবং মধুপুরের শালবনের জন্য বিখ্যাত।",
    famous_for_en: "Porabari Chamcham & Tangail Handloom Sarees",
    famous_for_bn: "পোড়াবাড়ির চমচম ও টাঙ্গাইল তাঁতের শাড়ি",
    image_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "kishoreganj",
    division_id: "dhaka",
    name_en: "Kishoreganj",
    name_bn: "কিশোরগঞ্জ",
    slug: "kishoreganj",
    description_en: "Land of Nikli and Ashtagram Haor wetlands, historic Isa Khan Jangalbari Fort, and the ancient Chandrabati Shiva Temple.",
    description_bn: "নিকলী ও অষ্টগ্রামের দিগন্তজোড়া হাওর, ঈশা খাঁর জঙ্গলবাড়ি কেল্লা ও চন্দ্রাবতীর শিব মন্দির।",
    famous_for_en: "Nikli Haor All-Weather Road & Cheese",
    famous_for_bn: "নিকলী হাওর, অল ওয়েদার সড়ক ও অষ্টগ্রাম পনির",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "manikganj",
    division_id: "dhaka",
    name_en: "Manikganj",
    name_bn: "মানিকগঞ্জ",
    slug: "manikganj",
    description_en: "Home to the grand Baliati Palace, Teota Jamidar Bari, and the renowned sweet date molasses (Jhuligunr).",
    description_bn: "নান্দনিক বালিয়াটি জমিদার প্রাসাদ, তেওতা জমিদার বাড়ি এবং খাঁটি খেজুরের গুড়ের জন্য বিখ্যাত।",
    famous_for_en: "Baliati Palace & Date Palm Jaggery",
    famous_for_bn: "বালিয়াটি প্রাসাদ ও খেজুরের ঝোলা গুড়",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "munshiganj",
    division_id: "dhaka",
    name_en: "Munshiganj",
    name_bn: "মুন্সীগঞ্জ",
    slug: "munshiganj",
    description_en: "Ancient Bikrampur, birthplace of scholar Atish Dipankar, Idrakpur Fort, and the northern ramp of the monumental Padma Bridge.",
    description_bn: "প্রাচীন বিক্রমপুর, অতীশ দীপঙ্করের জন্মভূমি, ইদ্রাকপুর কেল্লা এবং পদ্মা সেতুর উত্তর প্রান্ত।",
    famous_for_en: "Bikrampur Heritage & Padma Riverfront",
    famous_for_bn: "প্রাচীন বিক্রমপুর ঐতিহ্য ও পদ্মা তীর",
    image_url: "https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "narsingdi",
    division_id: "dhaka",
    name_en: "Narsingdi",
    name_bn: "নরসিংদী",
    slug: "narsingdi",
    description_en: "Location of the 2,500-year-old Wari-Bateshwar archaeological civilization, the Dream Holiday park, and luscious sweet bananas.",
    description_bn: "আড়াই হাজার বছরের প্রাচীন উয়ারী-বটেশ্বর প্রত্নতাত্ত্বিক নিদর্শন এবং সাগর কলার জন্য পরিচিত।",
    famous_for_en: "Wari-Bateshwar Ancient Ruins & Sagar Kola",
    famous_for_bn: "উয়ারী-বটেশ্বর প্রত্নক্ষেত্র ও অমৃত সাগর কলা",
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "faridpur",
    division_id: "dhaka",
    name_en: "Faridpur",
    name_bn: "ফরিদপুর",
    slug: "faridpur",
    description_en: "Revered spiritual land of Saint Shah Farid, poet Jasimuddin's memorial, and historic Padma river floodplains.",
    description_bn: "পল্লিকবি জসীম উদ্দীনের স্মৃতিবিজড়িত জেলা, শাহ ফরিদ (রহ.)-এর মাজার এবং ঐতিহ্যবাহী পদ্মার চরাঞ্চল।",
    famous_for_en: "Poet Jasimuddin Residence & River Char Tourism",
    famous_for_bn: "পল্লিকবি জসীম উদ্দীনের বাড়ি ও চরাঞ্চল",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "gopalganj",
    division_id: "dhaka",
    name_en: "Gopalganj",
    name_bn: "গোপালগঞ্জ",
    slug: "gopalganj",
    description_en: "Tungipara mausoleum of the Father of the Nation Bangabandhu Sheikh Mujibur Rahman and scenic Modhumoti river.",
    description_bn: "টুঙ্গিপাড়ায় জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমানের সমাধিসৌধ এবং মধুমতি নদীর মনোরম দৃশ্য।",
    famous_for_en: "Tungipara Complex & Modhumoti River",
    famous_for_bn: "টুঙ্গিপাড়া সমাধিসৌধ ও মধুমতি নদী",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "madaripur",
    division_id: "dhaka",
    name_en: "Madaripur",
    name_bn: "মাদারীপুর",
    slug: "madaripur",
    description_en: "Historic Shakuni Lake, Aoliapur mosque, and traditional date molasses production.",
    description_bn: "ঐতিহাসিক শকুনী লেক, আউলিয়াপুর নীলকুঠি ও ঐতিহ্যবাহী সুস্বাদু খেজুরের পাটালি গুড়।",
    famous_for_en: "Shakuni Lake & Palm Patali Gur",
    famous_for_bn: "শকুনী লেক ও পাটালি গুড়",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "rajbari",
    division_id: "dhaka",
    name_en: "Rajbari",
    name_bn: "রাজবাড়ী",
    slug: "rajbari",
    description_en: "Celebrated for the world-class Chamcham sweet of Pangsha, Mir Mosharraf Hossain memorial, and Padma confluence.",
    description_bn: "পাংশার সুস্বাদু চমচম, ঔপন্যাসিক মীর মশাররফ হোসেনের স্মৃতিসৌধ ও পদ্মার সংযোগস্থল।",
    famous_for_en: "Mir Mosharraf Memorial & Pangsha Chamcham",
    famous_for_bn: "মীর মশাররফ স্মৃতি কেন্দ্র ও চমচম",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "shariatpur",
    division_id: "dhaka",
    name_en: "Shariatpur",
    name_bn: "শরীয়তপুর",
    slug: "shariatpur",
    description_en: "Named after Haji Shariatullah, famous for the southern landing hub of the Padma Bridge and Fatehpur Jamidar Bari.",
    description_bn: "হাজী শরীয়তুল্লাহর স্মৃতিবিজড়িত, পদ্মা সেতুর দক্ষিণ জাজিরা সংযোগ এবং ফতেহপুর জমিদার বাড়ি।",
    famous_for_en: "Padma Bridge Jazira Point & Fatehpur Palace",
    famous_for_bn: "পদ্মা সেতু জাজিরা পয়েন্ট ও ফতেহপুর জমিদার বাড়ি",
    image_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80",
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
    description_en: "Home to the world's longest unbroken natural sandy sea beach (120 km), Marine Drive, Himchari, Inani, and Saint Martin's coral island.",
    description_bn: "বিশ্বের দীর্ঘতম ১২০ কিমি অবিচ্ছিন্ন বালুকাময় সমুদ্র সৈকত, মেরিন ড্রাইভ, হিমছড়ি, ইনানী ও প্রবাল দ্বীপ সেন্টমার্টিন।",
    famous_for_en: "World's Longest Sea Beach & Coral Islands",
    famous_for_bn: "বিশ্বের দীর্ঘতম সমুদ্র সৈকত ও সেন্টমার্টিন দ্বীপ",
    image_url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 10
  },
  {
    id: "chattogram_dist",
    division_id: "chattogram",
    name_en: "Chattogram",
    name_bn: "চট্টগ্রাম",
    slug: "chattogram",
    description_en: "The commercial capital with Patenga beach, Foy's Lake, Shrine of Bayazid Bostami, and the Karnaphuli river tunnel.",
    description_bn: "বাণিজ্যিক রাজধানী পতেঙ্গা সমুদ্র সৈকত, ফয়'স লেক, বায়েজিদ বোস্তামীর মাজার ও কর্ণফুলী নদীর টানেল।",
    famous_for_en: "Patenga Sea Beach, Foy's Lake & Mezban Beef",
    famous_for_bn: "পতেঙ্গা সৈকত, ফয়'স লেক ও ঐতিহ্যবাহী মেজবানি মাংস",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 7
  },
  {
    id: "bandarban",
    division_id: "chattogram",
    name_en: "Bandarban",
    name_bn: "বান্দরবান",
    slug: "bandarban",
    description_en: "The breathtaking roof of Bangladesh with Nilgiri, Keokradong, Saka Haphong, Nafakhum waterfall, and indigenous cultural villages.",
    description_bn: "মেঘের দেশে নীলগিরি, কেওক্রাডং চূড়া, নাফাখুম জলপ্রপাত ও বিভিন্ন আদিবাসী সংস্কৃতির রূপময় মিলনমেলা।",
    famous_for_en: "Nilgiri, Keokradong & Nafakhum Waterfall",
    famous_for_bn: "নীলগিরি, কেওক্রাডং ও নাফাখুম জলপ্রপাত",
    image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "rangamati",
    division_id: "chattogram",
    name_en: "Rangamati",
    name_bn: "রাঙামাটি",
    slug: "rangamati",
    description_en: "The Lake City surrounded by hills, featuring the vast Kaptai Lake, Hanging Bridge, Shuvolong Waterfall, and Sajek Valley.",
    description_bn: "পাহাড় ও কাপ্তাই হ্রদে ঘেরা হ্রদকন্যা, ঝুলন্ত সেতু, শুভলং ঝর্ণা এবং মেঘের উপত্যকা সাজেক ভ্যালি।",
    famous_for_en: "Kaptai Lake, Sajek Valley & Hanging Bridge",
    famous_for_bn: "কাপ্তাই লেক, সাজেক ভ্যালি ও ঝুলন্ত সেতু",
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "khagrachhari",
    division_id: "chattogram",
    name_en: "Khagrachhari",
    name_bn: "খাগড়াছড়ি",
    slug: "khagrachhari",
    description_en: "Land of mystifying Alutila Cave with dark mystery, Richhang Waterfall, and the gateway to the cloud kingdom of Sajek.",
    description_bn: "রহস্যময় আলুটিলা গুহা, রিছাং ঝর্ণা, তারেং এবং সাজেক ভ্যালির অন্যতম প্রধান প্রবেশদ্বার।",
    famous_for_en: "Alutila Cave & Richhang Waterfall",
    famous_for_bn: "আলুটিলা গুহা ও রিছাং ঝর্ণা",
    image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "cumilla",
    division_id: "chattogram",
    name_en: "Cumilla",
    name_bn: "কুমিল্লা",
    slug: "cumilla",
    description_en: "Famous for the 8th-century Shalban Vihara at Mainamati, Dharmasagar lake, Khadi handloom fabric, and world-renowned Matri Bhander Rasmalai.",
    description_bn: "৮ম শতাব্দীর শালবন বৌদ্ধ বিহার, ধর্মসাগর দিঘি, খাদি বস্ত্র এবং মাতৃভাণ্ডারের অতুলনীয় রসমালাই।",
    famous_for_en: "Shalban Vihara & Matri Bhander Rasmalai",
    famous_for_bn: "শালবন বিহার ও মাতৃভাণ্ডারের রসমালাই",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "brahmanbaria",
    division_id: "chattogram",
    name_en: "Brahmanbaria",
    name_bn: "ব্রাহ্মণবাড়িয়া",
    slug: "brahmanbaria",
    description_en: "The cultural heart of classical music, Ustad Alauddin Khan memorial, Kalbhairav temple, and Chanar Muktargacha sweets.",
    description_bn: "ওস্তাদ আলাউদ্দিন খাঁর সুরের রাজধানী, সুবিশাল কালভৈরব মন্দির এবং ছানামুখীর সুখ্যাতি।",
    famous_for_en: "Musical Heritage & Chanar Muktargacha Sweet",
    famous_for_bn: "সঙ্গীত ঐতিহ্য ও ছানামুখী মিষ্টি",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "feni",
    division_id: "chattogram",
    name_en: "Feni",
    name_bn: "ফেনী",
    slug: "feni",
    description_en: "Famous for the scenic Muhuri Dam and Regulator, Bijoy Singh Dighi, and green riverside picnic destinations.",
    description_bn: "মনোরম মুহুরী সেচ প্রকল্প ও রেগুলেটর, ঐতিহাসিক বিজয় সিংহ দিঘি ও নদী তীরবর্তী পর্যটন।",
    famous_for_en: "Muhuri Dam Project & Bijoy Singh Dighi",
    famous_for_bn: "মুহুরী প্রজেক্ট ও বিজয় সিংহ দিঘি",
    image_url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "noakhali",
    division_id: "chattogram",
    name_en: "Noakhali",
    name_bn: "নোয়াখালী",
    slug: "noakhali",
    description_en: "Renowned for Nijhum Dwip island with spotted deer herds, Gandhi Ashram at Joyag, and Bajra Shahi Mosque.",
    description_bn: "চিত্রা হরিণের অভয়ারণ্য নিঝুম দ্বীপ, জয়োগ গান্ধী আশ্রম ও ঐতিহাসিক বজরা শাহী মসজিদ।",
    famous_for_en: "Nijhum Dwip Deer Sanctuary & Gandhi Ashram",
    famous_for_bn: "নিঝুম দ্বীপ হরিণ অভয়ারণ্য ও গান্ধী আশ্রম",
    image_url: "https://images.unsplash.com/photo-1535262412227-85541e910204?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "lakshmipur",
    division_id: "chattogram",
    name_en: "Lakshmipur",
    name_bn: "লক্ষ্মীপুর",
    slug: "lakshmipur",
    description_en: "Famous for the Dalal Bazar Jamidar Bari, Khoa Sagordighi, and fresh Hilsa fish from the lower Meghna estuary.",
    description_bn: "ঐতিহাসিক দালাল বাজার জমিদার বাড়ি, খোয়া সাগর দিঘি ও মেঘনার রূপালী ইলিশ।",
    famous_for_en: "Dalal Bazar Palace & Meghna Hilsa",
    famous_for_bn: "দালাল বাজার প্রাসাদ ও মেঘনার ইলিশ",
    image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "chandpur",
    division_id: "chattogram",
    name_en: "Chandpur",
    name_bn: "চাঁদপুর",
    slug: "chandpur",
    description_en: "The Hilsa Capital of Bangladesh at the majestic confluence (Mohona) of Padma, Meghna, and Dakatia rivers.",
    description_bn: "ইলিশের রাজধানী, পদ্মা-মেঘনা-ডাকাতিয়া নদীর মোহনা এবং ঐতিহ্যবাহী রিভারফ্রন্ট ওয়াকওয়ে।",
    famous_for_en: "Three River Confluence (Mohona) & Pure Hilsa",
    famous_for_bn: "তিন নদীর মোহনা ও চাঁদপুরের রূপালী ইলিশ",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
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
    description_en: "Sacred land of Hazrat Shah Jalal & Shah Paran shrines, Ratargul Freshwater Swamp Forest, Bisnakhandi, and Jaflong stone river.",
    description_bn: "হযরত শাহজালাল ও শাহপরাণের মাজার, রাতারগুল সোয়াম্প ফরেস্ট, বিছনাকান্দি ও জাফলং।",
    famous_for_en: "Ratargul Swamp Forest, Jaflong & Holy Shrines",
    famous_for_bn: "রাতারগুল সোয়াম্প ফরেস্ট, জাফলং ও পুণ্যতীর্থ",
    image_url: "https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "moulvibazar",
    division_id: "sylhet",
    name_en: "Moulvibazar",
    name_bn: "মৌলভীবাজার",
    slug: "moulvibazar",
    description_en: "The Tea Capital Sreemangal with rolling tea estates, Lawachara Rainforest, Madhabkunda Waterfall, and Baikka Beel bird sanctuary.",
    description_bn: "শ্রীমঙ্গলের সুবিশাল চা বাগান, লাউয়াছড়া রেইনফরেস্ট, মাধবকুণ্ড জলপ্রপাত ও বাইক্কা বিলের অতিথি পাখি।",
    famous_for_en: "Sreemangal Tea Capital & Lawachara Forest",
    famous_for_bn: "শ্রীমঙ্গল চা বাগান ও লাউয়াছড়া জাতীয় উদ্যান",
    image_url: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 8
  },
  {
    id: "habiganj",
    division_id: "sylhet",
    name_en: "Habiganj",
    name_bn: "হবিগঞ্জ",
    slug: "habiganj",
    description_en: "Celebrated for the Rema-Kalenga Wildlife Sanctuary, Satchari National Park, and luxury hills eco-resorts.",
    description_bn: "রেমা-কালেঙ্গা বন্যপ্রাণী অভয়ারণ্য, সাতছড়ি জাতীয় উদ্যান ও সবুজ পাহাড়ি রিসোর্ট।",
    famous_for_en: "Satchari National Park & Rema-Kalenga Sanctuary",
    famous_for_bn: "সাতছড়ি জাতীয় উদ্যান ও রেমা-কালেঙ্গা",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "sunamganj",
    division_id: "sylhet",
    name_en: "Sunamganj",
    name_bn: "সুনামগঞ্জ",
    slug: "sunamganj",
    description_en: "The Ramsar site Tanguar Haor, blooming Shimul Bagan, Jadukata river, Barek Tila, and the musical heritage of mystic bard Hason Raja.",
    description_bn: "ইউনেস্কো রামসার সাইট টাঙ্গুয়ার হাওর, রক্তিম শিমুল বাগান, যাদুকাটা নদী ও বাউল সম্রাট হাছন রাজার স্মৃতি।",
    famous_for_en: "Tanguar Haor, Shimul Bagan & Jadukata River",
    famous_for_bn: "টাঙ্গুয়ার হাওর, শিমুল বাগান ও যাদুকাটা নদী",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
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
    description_en: "Industrial hub and principal jumping-off port for boat safaris deep into the Sundarbans Mangrove Forest and Rupsha river.",
    description_bn: "সুন্দরবন ক্রুজ সাফারির প্রধান প্রবেশদ্বার, রূপসা নদী তীর ও ঐতিহাসিক খানজাহান আলীর ঐতিহ্য।",
    famous_for_en: "Sundarbans Gateway & Rupsha Riverfront",
    famous_for_bn: "সুন্দরবন প্রবেশদ্বার ও রূপসা রিভারফ্রন্ট",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "bagerhat",
    division_id: "khulna",
    name_en: "Bagerhat",
    name_bn: "বাগেরহাট",
    slug: "bagerhat",
    description_en: "UNESCO World Heritage Mosque City of Khan Jahan Ali with the monumental 15th-century Sixty Dome Mosque (Shat Gombuj).",
    description_bn: "ইউনেস্কো বিশ্ব ঐতিহ্য ঐতিহাসিক মসজিদের শহর এবং ১৫ শতকের ষাট গম্বুজ মসজিদ।",
    famous_for_en: "Sixty Dome Mosque (Shat Gombuj) & Shrine",
    famous_for_bn: "ঐতিহাসিক ষাট গম্বুজ মসজিদ ও খানজাহান আলী মাজার",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "satkhira",
    division_id: "khulna",
    name_en: "Satkhira",
    name_bn: "সাতক্ষীরা",
    slug: "satkhira",
    description_en: "Western entryway to the Sundarbans, famous for Sundarban wild honey, tiger tracking points, and delicious Sandesh.",
    description_bn: "সুন্দরবনের পশ্চিম রেঞ্জ, খাঁটি সুন্দরবনের মধু, রয়েল বেঙ্গল টাইগার পয়েন্ট এবং সুস্বাদু সন্দেশ।",
    famous_for_en: "Sundarbans Wild Honey & Tiger Track Points",
    famous_for_bn: "সুন্দরবনের খাঁটি মধু ও সন্দেশ",
    image_url: "https://images.unsplash.com/photo-1535262412227-85541e910204?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "jashore",
    division_id: "khulna",
    name_en: "Jashore",
    name_bn: "যশোর",
    slug: "jashore",
    description_en: "First liberated district of Bangladesh, Michael Madhusudan Dutt memorial at Sagardari along the Kapotakkha river, and date molasses.",
    description_bn: "প্রথম মুক্ত জেলা, কপোতাক্ষ নদের তীরে মাইকেল মধুসূদন দত্তের স্মৃতিপল্লী সাগরদাঁড়ি ও খেজুরের গুড়।",
    famous_for_en: "Madhusudan Dutt Memorial & Date Palm Molasses",
    famous_for_bn: "সাগরদাঁড়ি মধুসূদন পল্লী ও খেজুর গুড়",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "kushtia",
    division_id: "khulna",
    name_en: "Kushtia",
    name_bn: "কুষ্টিয়া",
    slug: "kushtia",
    description_en: "Cultural beacon housing mystic philosopher Fakir Lalon Shah's Akhra shrine and Rabindranath Tagore's Shilaidaha Kuthibari.",
    description_bn: "বাউল সম্রাট ফকির লালন শাহের মাজার এবং বিশ্বকবি রবীন্দ্রনাথ ঠাকুরের শিলাইদহ কুঠিবাড়ি।",
    famous_for_en: "Lalon Shah Shrine & Tagore Kuthibari",
    famous_for_bn: "লালন শাহের মাজার ও শিলাইদহ কুঠিবাড়ি",
    image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "jhenaidah",
    division_id: "khulna",
    name_en: "Jhenaidah",
    name_bn: "ঝিনাইদহ",
    slug: "jhenaidah",
    description_en: "Known for the historic Naldanga Temple complex, Miyabari Mosque, and extensive banana and flower cultivation.",
    description_bn: "ঐতিহাসিক নলডাঙ্গা রাজবাড়ি ও মন্দির কমপ্লেক্স, মিয়া বাড়ি মসজিদ ও ফুলের রাজ্য।",
    famous_for_en: "Naldanga Royal Temple Complex",
    famous_for_bn: "নলডাঙ্গা রাজপ্রাসাদ ও মন্দির",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "magura",
    division_id: "khulna",
    name_en: "Magura",
    name_bn: "মাগুরা",
    slug: "magura",
    description_en: "Home of poet Farrukh Ahmad, Raja Sitaram Ray's historical traces, and the vibrant annual Katyayani festival.",
    description_bn: "ঐতিহাসিক কাত্যায়নী পূজা উৎসব, কবি ফররুখ আহমদের স্মৃতি ও রাজা সীতারাম রায়ের প্রাসাদাবশেষ।",
    famous_for_en: "Katyayani Festival & Historic Palaces",
    famous_for_bn: "কাত্যায়নী পূজা উৎসব ও ঐতিহ্যবাহী স্থাপনা",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "narail",
    division_id: "khulna",
    name_en: "Narail",
    name_bn: "নড়াইল",
    slug: "narail",
    description_en: "Birthplace of legendary painter SM Sultan and unique ancient fishing techniques utilizing trained otters (Dhond) on Chitra river.",
    description_bn: "চিত্রশিল্পী এস এম সুলতানের স্মৃতিবিজড়িত চিত্রা পাড় এবং বিরল ভোঁদড় দিয়ে মাছ শিকারের ঐতিহ্য।",
    famous_for_en: "SM Sultan Art Gallery & Otter Fishing Heritage",
    famous_for_bn: "এস এম সুলতান আর্ট গ্যালারি ও ভোঁদড় দিয়ে মাছ শিকার",
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "chuadanga",
    division_id: "khulna",
    name_en: "Chuadanga",
    name_bn: "চুয়াডাঙ্গা",
    slug: "chuadanga",
    description_en: "Historical Carew & Co distilleries established in 1897 and pristine mango and betel-nut groves.",
    description_bn: "১৮৯৭ সালে প্রতিষ্ঠিত কেরু অ্যান্ড কোং ডিস্টিলারি এবং প্রাচীন নীলকুঠির ইতিহাস।",
    famous_for_en: "Carew & Co Industrial Heritage",
    famous_for_bn: "কেরু অ্যান্ড কোং ও প্রাচীন নীলকুঠি",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "meherpur",
    division_id: "khulna",
    name_en: "Meherpur",
    name_bn: "মেহেরপুর",
    slug: "meherpur",
    description_en: "Historical birthplace of the government of Bangladesh with the iconic Mujibnagar Memorial Complex where the declaration of independence was sworn.",
    description_bn: "স্বাধীন বাংলাদেশের প্রথম সরকার শপথ গ্রহণের ঐতিহাসিক তীর্থস্থান মুজিবনগর স্মৃতিসৌধ।",
    famous_for_en: "Mujibnagar Independence Memorial Complex",
    famous_for_bn: "ঐতিহাসিক মুজিবনগর স্মৃতিসৌধ কমপ্লেক্স",
    image_url: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=600&q=80",
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
    description_en: "The Silk Capital with Varendra Research Museum (oldest museum in BD), Puthia Royal Terracotta Temple Complex, and sweet mango orchards.",
    description_bn: "রেশম শিল্প, বরেন্দ্র গবেষণা জাদুঘর, পুঠিয়ার রাজবাড়ি ও টেরাকোটা মন্দির এবং আমের রাজ্য।",
    famous_for_en: "Puthia Temple Complex, Varendra Museum & Silk",
    famous_for_bn: "পুঠিয়া রাজবাড়ি মন্দির, বরেন্দ্র জাদুঘর ও সিল্ক",
    image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "bogura",
    division_id: "rajshahi",
    name_en: "Bogura",
    name_bn: "বগুড়া",
    slug: "bogura",
    description_en: "Ancient Pundranagar at Mahasthangarh dating to the 3rd century BCE and the internationally famous Bogurar Doi (sweet curd).",
    description_bn: "আড়াই হাজার বছরের প্রাচীন মহাস্থানগড়, ভাসু বিহার এবং বিশ্বখ্যাত সুস্বাদু বগুড়ার দই।",
    famous_for_en: "Mahasthangarh Ancient Citadel & Bogurar Doi",
    famous_for_bn: "ঐতিহাসিক মহাস্থানগড় ও ঐতিহ্যবাহী বগুড়ার দই",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "naogaon",
    division_id: "rajshahi",
    name_en: "Naogaon",
    name_bn: "নওগাঁ",
    slug: "naogaon",
    description_en: "Home of UNESCO World Heritage Somapura Mahavihara at Paharpur, one of the largest Buddhist monasteries in Asia, and Kusumba Mosque.",
    description_bn: "ইউনেস্কো বিশ্ব ঐতিহ্য পাহাড়পুর সোমপুর মহাবিহার এবং ঐতিহাসিক কুসুম্বা মসজিদ।",
    famous_for_en: "Somapura Mahavihara (Paharpur) & Kusumba Mosque",
    famous_for_bn: "পাহাড়পুর বৌদ্ধবিহার ও কুসুম্বা মসজিদ",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "natore",
    division_id: "rajshahi",
    name_en: "Natore",
    name_bn: "নাটোর",
    slug: "natore",
    description_en: "The palace city of Rani Bhabani, Uttara Ganabhaban, the huge Chalan Beel wetland, and mouthwatering Kachagolla sweet.",
    description_bn: "নাটোর রাজবাড়ি, উত্তরা গণভবন, চলন বিল এবং সুস্বাদু কাঁচাগোল্লা।",
    famous_for_en: "Uttara Ganabhaban, Rani Bhabani Palace & Kachagolla",
    famous_for_bn: "উত্তরা গণভবন, রানী ভবানী রাজবাড়ি ও কাঁচাগোল্লা",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "pabna",
    division_id: "rajshahi",
    name_en: "Pabna",
    name_bn: "পাবনা",
    slug: "pabna",
    description_en: "Hardinge Bridge, Lalon Shah Bridge over Padma, historic Jor Bangla temple, mental healthcare heritage, and Hoseni Dalan.",
    description_bn: "পদ্মার ওপর ঐতিহাসিক হার্ডিঞ্জ ব্রিজ, লালন শাহ সেতু, জোড় বাংলা মন্দির ও সুচিত্রা সেনের বাড়ি।",
    famous_for_en: "Hardinge Bridge & Suchitra Sen Memorial",
    famous_for_bn: "হার্ডিঞ্জ ব্রিজ ও সুচিত্রা সেন স্মৃতিবাড়ি",
    image_url: "https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "sirajganj",
    division_id: "rajshahi",
    name_en: "Sirajganj",
    name_bn: "সিরাজগঞ্জ",
    slug: "sirajganj",
    description_en: "Gateway of the Bangabandhu Jamuna Multipurpose Bridge, Navaratna Temple, and traditional handloom saree weaving clusters.",
    description_bn: "যমুনা বহুমুখী সেতু, ঐতিহাসিক নবরত্ন মন্দির এবং ঐতিহ্যবাহী তাঁত শিল্পের প্রধান কেন্দ্র।",
    famous_for_en: "Jamuna Eco Park & Handloom Weaving",
    famous_for_bn: "যমুনা ইকোপার্ক ও তাঁত শিল্প",
    image_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "chapainawabganj",
    division_id: "rajshahi",
    name_en: "Chapainawabganj",
    name_bn: "চাঁপাইনবাবগঞ্জ",
    slug: "chapainawabganj",
    description_en: "The Mango Capital of Bangladesh, Choto Sona Mosque (Small Golden Mosque) built in the Bengal Sultanate, and Kansat mango hub.",
    description_bn: "বাংলাদেশের আমের রাজধানী, সুলতানি আমলের ঐতিহাসিক ছোট সোনা মসজিদ ও কানসাট।",
    famous_for_en: "Choto Sona Mosque & Fazli / Khirsapat Mangoes",
    famous_for_bn: "ছোট সোনা মসজিদ ও হিমসাগর/ফজলি আম",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "joypurhat",
    division_id: "rajshahi",
    name_en: "Joypurhat",
    name_bn: "জয়পুরহাট",
    slug: "joypurhat",
    description_en: "Historic Locke Pathor, Pagla Dewan Mass Grave, and ancient terracotta artifacts.",
    description_bn: "ঐতিহাসিক লকমা রাজবাড়ি, পাগলা দেওয়ান এবং নান্দনিক প্রত্নতাত্ত্বিক নিদর্শন।",
    famous_for_en: "Lokma Rajbari & Archaeological Relics",
    famous_for_bn: "লকমা রাজবাড়ি ও প্রত্নস্থান",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
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
    description_en: "Known as the Venice of Bengal, famous for backwater cruising, floating guava markets of Bhimruli, and Durga Sagar lake.",
    description_bn: "বাংলার ভেনিস, ভিমরুলির বিখ্যাত ভাসমান পেয়ারা বাজার, ব্যাকওয়াটার ক্রুজ ও দুর্গাসাগর দিঘি।",
    famous_for_en: "Floating Guava Market (Bhimruli) & Durga Sagar",
    famous_for_bn: "ভিমরুলির ভাসমান পেয়ারা বাজার ও দুর্গাসাগর",
    image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "patuakhali",
    division_id: "barishal",
    name_en: "Patuakhali",
    name_bn: "পটুয়াখালী",
    slug: "patuakhali",
    description_en: "The Daughter of the Sea (Sagor Konna) Kuakata, where both sunrise and sunset can be watched over the Bay of Bengal, Rakhine Buddhist temples, and Fatrar Bon.",
    description_bn: "সাগরকন্যা কুয়াকাটা, যেখান থেকে একই সৈকতে সূর্যোদয় ও সূর্যাস্ত দেখা যায় এবং রাখাইন বৌদ্ধ মন্দির।",
    famous_for_en: "Kuakata Sea Beach (Sunrise & Sunset) & Rakhine Villages",
    famous_for_bn: "কুয়াকাটা সমুদ্র সৈকত ও রাখাইন পল্লী",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "bhola",
    division_id: "barishal",
    name_en: "Bhola",
    name_bn: "ভোলা",
    slug: "bhola",
    description_en: "The largest offshore island of Bangladesh surrounded by Meghna and Bay of Bengal, Monpura Island, Char Kukri Mukri wildlife sanctuary.",
    description_bn: "বাংলাদেশের বৃহত্তম দ্বীপ জেলা, স্বপ্নময় মনপুরা দ্বীপ এবং চিত্রা হরিণের অভয়ারণ্য চর কুকরি মুকরি।",
    famous_for_en: "Monpura Island & Char Kukri Mukri Wildlife Reserve",
    famous_for_bn: "মনপুরা দ্বীপ ও চর কুকরি মুকরি অভয়ারণ্য",
    image_url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "pirojpur",
    division_id: "barishal",
    name_en: "Pirojpur",
    name_bn: "পিরোজপুর",
    slug: "pirojpur",
    description_en: "Rayerkathi Zamindar Bari, Kuriana floating markets, and scenic river canals leading toward the Sundarbans.",
    description_bn: "কুড়িয়ানা পেয়ারা বাগান ও খাল, রায়েরকাঠি জমিদার বাড়ি ও বলেশ্বর নদী।",
    famous_for_en: "Kuriana Guava Orchards & Rayerkathi Estate",
    famous_for_bn: "কুড়িয়ানা পেয়ারা বাজার ও জমিদার বাড়ি",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "barguna",
    division_id: "barishal",
    name_en: "Barguna",
    name_bn: "বরগুনা",
    slug: "barguna",
    description_en: "Shonar Char beach, Haringhata Eco-Forest where the river meets the Bay of Bengal, and coastal mangrove flora.",
    description_bn: "হরিণঘাটা ইকোট্যুরিজম বন, সোনাকাটা ইকোপার্ক ও পায়রা নদীর মোহনার সমুদ্র সৈকত।",
    famous_for_en: "Haringhata Mangrove Forest & Shonar Char",
    famous_for_bn: "হরিণঘাটা বন ও সোনার চর সৈকত",
    image_url: "https://images.unsplash.com/photo-1535262412227-85541e910204?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "jhalakathi",
    division_id: "barishal",
    name_en: "Jhalakathi",
    name_bn: "ঝালকাঠি",
    slug: "jhalakathi",
    description_en: "The primary canal network hub for the floating guava markets, Atghor and Kuriana canals, and Sreemanta Jamidar Bari.",
    description_bn: "আটঘর-কুড়িয়ানা খালের ভাসমান হাট, পেয়ারার চাষ ও শ্রীমন্ত রাজবাড়ির ঐতিহাসিক স্মৃতি।",
    famous_for_en: "Canal Backwaters & Floating Markets",
    famous_for_bn: "খাল ও আটঘরের ভাসমান বাজার",
    image_url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80",
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
    description_en: "The neoclassical Tajhat Palace, Carmichael College heritage campus, and exquisite Haribhanga sweet mangoes.",
    description_bn: "অনুপম তাজহাট রাজবাড়ি, শতবর্ষী কারমাইকেল কলেজ ক্যাম্পাস এবং সুমিষ্ট হাঁড়িভাঙা আম।",
    famous_for_en: "Tajhat Palace & Haribhanga Mangoes",
    famous_for_bn: "তাজহাট রাজপ্রাসাদ ও হাঁড়িভাঙা আম",
    image_url: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "dinajpur",
    division_id: "rangpur",
    name_en: "Dinajpur",
    name_bn: "দিনাজপুর",
    slug: "dinajpur",
    description_en: "Famous for the 18th-century Kantajew Temple with finest terracotta murals, Ramsagar Dighi, and sweet Lychees (Madraji and Bedana).",
    description_bn: "১৮ শতকের বিশ্ববিখ্যাত কান্তজিউ মন্দির (টেরাকোটা), সুবিশাল রামসাগর দিঘি ও বেদানা লিচু।",
    famous_for_en: "Kantajew Temple & Ramsagar National Park",
    famous_for_bn: "কান্তজিউ মন্দির ও রামসাগর দিঘি",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "panchagarh",
    division_id: "rangpur",
    name_en: "Panchagarh",
    name_bn: "পঞ্চগড়",
    slug: "panchagarh",
    description_en: "Northernmost tip of Bangladesh at Tentulia (Zero Point), flatland tea gardens, views of Mt. Kanchenjunga in autumn, and Rocks Museum.",
    description_bn: "তেঁতুলিয়া জিরো পয়েন্ট, সমতলের সবুজ চা বাগান, শরৎ-হেমন্তে বরফাবৃত কাঞ্চনজঙ্ঘার দৃশ্য ও রক্স মিউজিয়াম।",
    famous_for_en: "Tentulia Tea Gardens & Kanchenjunga Viewpoint",
    famous_for_bn: "তেঁতুলিয়া সমতল চা বাগান ও কাঞ্চনজঙ্ঘা দর্শন",
    image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "thakurgaon",
    division_id: "rangpur",
    name_en: "Thakurgaon",
    name_bn: "ঠাকুরগাঁও",
    slug: "thakurgaon",
    description_en: "Historic Ballia Mosque, Haripur Rajbari, and lush sugarcane and mango orchards near the Indian border.",
    description_bn: "ঐতিহাসিক বলিয়া মসজিদ, হরিপুর রাজবাড়ি এবং কুলিক নদীর মনোলোভা প্রকৃতি।",
    famous_for_en: "Ballia Mosque & Haripur Royal Palace",
    famous_for_bn: "বলিয়া মসজিদ ও হরিপুর রাজবাড়ি",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "gaibandha",
    division_id: "rangpur",
    name_en: "Gaibandha",
    name_bn: "গাইবান্ধা",
    slug: "gaibandha",
    description_en: "Historic Vardhan Kuthi, Dreamland Park, and vast Brahmaputra river island eco-tourism.",
    description_bn: "বর্ধনকুঠি রাজবাড়ি, ব্রহ্মপুত্র নদীর চরাঞ্চল ও ঐতিহ্যবাহী রসমঞ্জরি মিষ্টি।",
    famous_for_en: "Vardhan Kuthi & Gaibandha Rasmanjari",
    famous_for_bn: "বর্ধনকুঠি ও সুস্বাদু রসমঞ্জরি",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "kurigram",
    division_id: "rangpur",
    name_en: "Kurigram",
    name_bn: "কুড়িগ্রাম",
    slug: "kurigram",
    description_en: "Dharla Bridge, historic Chandamari Mosque, and crossing point of major northern rivers Dharla and Brahmaputra.",
    description_bn: "ধরলা সেতু, ঐতিহাসিক চান্দামারী মসজিদ এবং ব্রহ্মপুত্র ও ধরলা নদীর মোহনা।",
    famous_for_en: "Dharla Riverfront & Chandamari Mosque",
    famous_for_bn: "ধরলা নদী তীর ও চান্দামারী মসজিদ",
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 2
  },
  {
    id: "lalmonirhat",
    division_id: "rangpur",
    name_en: "Lalmonirhat",
    name_bn: "লালমনিরহাট",
    slug: "lalmonirhat",
    description_en: "Teesta Barrage (largest irrigation project), Tin Bigha Corridor, and Harano Masjid (ancient lost mosque).",
    description_bn: "তিস্তা ব্যারেজ প্রকল্প, তিন বিঘা করিডোর এবং ৬৯ হিজরির হারানো মসজিদ।",
    famous_for_en: "Teesta Barrage Project & Tin Bigha Corridor",
    famous_for_bn: "তিস্তা ব্যারেজ ও তিন বিঘা করিডোর",
    image_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 3
  },
  {
    id: "nilphamari",
    division_id: "rangpur",
    name_en: "Nilphamari",
    name_bn: "নীলফামারী",
    slug: "nilphamari",
    description_en: "Historic Chini Mosque (China porcelain mosaic tiles), Teesta Barrage northern point, and Saidpur railway heritage.",
    description_bn: "চীনা মাটির টুকরোয় তৈরি অপরূপ চিনি মসজিদ এবং সৈয়দপুর রেলওয়ে ওয়ার্কশপ।",
    famous_for_en: "Chini Porcelain Mosque & Railway Heritage",
    famous_for_bn: "চিনি মসজিদ ও ঐতিহাসিক সৈয়দপুর",
    image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80",
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
    description_en: "Alexander Castle, Shashi Lodge, Agricultural University botanical garden, Brahmaputra park, and Mymensingh Gitika folklore.",
    description_bn: "শশী লজ, আলেকজান্ডার ক্যাসেল, বাংলাদেশ কৃষি বিশ্ববিদ্যালয় বোটানিক্যাল গার্ডেন ও ব্রহ্মপুত্র পার্ক।",
    famous_for_en: "Shashi Lodge Palace & Brahmaputra Riverfront",
    famous_for_bn: "শশী লজ ও ব্রহ্মপুত্র রিভারফ্রন্ট পার্ক",
    image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 5
  },
  {
    id: "netrokona",
    division_id: "mymensingh",
    name_en: "Netrokona",
    name_bn: "নেত্রকোনা",
    slug: "netrokona",
    description_en: "Famous for the breathtaking Birishiri White Ceramic Hills, emerald-blue waters of Someshwari River, and Durgapur Garo Hills.",
    description_bn: "বিরিশিরির চীনামাটির পাহাড়, নীল জলের সোমেশ্বরী নদী, বিজয়পুর সীমান্ত ও সুসং দুর্গাপুর।",
    famous_for_en: "Birishiri Ceramic Hills & Someshwari River",
    famous_for_bn: "বিরিশিরি চীনামাটির পাহাড় ও সোমেশ্বরী নদী",
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 6
  },
  {
    id: "sherpur",
    division_id: "mymensingh",
    name_en: "Sherpur",
    name_bn: "শেরপুর",
    slug: "sherpur",
    description_en: "Ghazni Holiday Center, Madhutila Eco Park on the green Garo foothills, and tribal culture along the border.",
    description_bn: "গারো পাহাড়ের পাদদেশে গজনী অবকাশ কেন্দ্র ও মধুটিলা ইকোপার্ক।",
    famous_for_en: "Ghazni Vacation Center & Madhutila Eco Park",
    famous_for_bn: "গজনী অবকাশ ও মধুটিলা ইকোপার্ক",
    image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    is_published: true,
    popular_spots_count: 4
  },
  {
    id: "jamalpur",
    division_id: "mymensingh",
    name_en: "Jamalpur",
    name_bn: "জামালপুর",
    slug: "jamalpur",
    description_en: "Famous for the hand-stitched Nakshi Kantha craft, historic Dayarampur mosque, and the scenic Jamuna riverside embankment.",
    description_bn: "ঐতিহ্যবাহী বিশ্ববিখ্যাত নকশিকাঁথা শিল্প, যমুনা রিভারফ্রন্ট ও হযরত শাহ জামালের (রহ.) মাজার।",
    famous_for_en: "Nakshi Kantha Hand Embroidery Heritage",
    famous_for_bn: "হাতে বোনা নকশিকাঁথা ও যমুনা তীর",
    image_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
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

