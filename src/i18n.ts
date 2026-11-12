/**
 * Bilingual i18n Translation Dictionary
 * Bengali (Default) & English
 */

export type Language = 'bn' | 'en';

export interface Translations {
  [key: string]: {
    bn: string;
    en: string;
  };
}

export const I18N: Translations = {
  // Brand & Meta
  site_title: {
    bn: "অপরূপ বাংলাদেশ - অফিসিয়াল পর্যটন পোর্টাল",
    en: "Beautiful Bangladesh - Official Tourism Portal"
  },
  site_tagline: {
    bn: "নদী, পাহাড় ও সবুজের চিরন্তন রূপকথা",
    en: "Land of Rivers, Clouds, and Living Heritage"
  },
  
  // Navigation
  nav_home: {
    bn: "মূলপাতা",
    en: "Home"
  },
  nav_divisions: {
    bn: "বিভাগসমূহ (৮)",
    en: "Divisions (8)"
  },
  nav_districts: {
    bn: "৬৪ জেলা গাইড",
    en: "64 Districts"
  },
  nav_spots: {
    bn: "দর্শনীয় স্থান",
    en: "Attractions"
  },
  nav_guides: {
    bn: "ভ্রমণ নির্দেশিকা",
    en: "Travel Guides"
  },
  nav_planner: {
    bn: "ট্যুর প্ল্যানার",
    en: "Trip Planner"
  },
  nav_saved: {
    bn: "পছন্দের তালিকা",
    en: "Saved Places"
  },
  nav_admin: {
    bn: "অ্যাডমিন পোর্টাল",
    en: "Admin Portal"
  },
  nav_switch_lang: {
    bn: "English",
    en: "বাংলা"
  },
  
  // Hero section
  hero_badge: {
    bn: "অফিসিয়াল বাংলাদেশ পর্যটন গাইড",
    en: "Official Bangladesh Tourism Guide"
  },
  hero_title_1: {
    bn: "চিরসবুজ বাংলাদেশের",
    en: "Discover the Soul of"
  },
  hero_title_2: {
    bn: "অনুপম সৌন্দর্য আবিষ্কার করুন",
    en: "Beautiful Bangladesh"
  },
  hero_subtitle: {
    bn: "৮টি বিভাগ এবং ৬৪টি জেলার নদী, পাহাড়, অরণ্য, প্রাচীন প্রত্নতত্ত্ব ও ঐতিহাসিক স্থানসমূহের তথ্যবহুল ডিজিটাল মানচিত্র।",
    en: "An authentic travel companion covering natural wonders, historical heritage, and cultural journeys across all 8 divisions and 64 districts."
  },
  
  // Search & Filter
  search_placeholder: {
    bn: "জেলা, পর্যটন স্পট বা বিভাগ খুঁজুন (যেমন: সাজেক, সুন্দরবন, কক্সবাজার)...",
    en: "Search district, tourist spot, or division (e.g. Sajek, Sundarbans, Cox's Bazar)..."
  },
  search_btn: {
    bn: "অনুসন্ধান",
    en: "Search"
  },
  filter_all_divisions: {
    bn: "সকল বিভাগ",
    en: "All Divisions"
  },
  filter_all_categories: {
    bn: "সকল ক্যাটাগরি",
    en: "All Categories"
  },
  search_results_for: {
    bn: "অনুসন্ধান ফলাফল:",
    en: "Search Results for:"
  },
  clear_search: {
    bn: "মুছে ফেলুন",
    en: "Clear"
  },

  // Stats
  stat_divisions: {
    bn: "প্রশাসনিক বিভাগ",
    en: "Divisions"
  },
  stat_districts: {
    bn: "ঐতিহাসিক জেলা",
    en: "Districts"
  },
  stat_spots: {
    bn: "শীর্ষ পর্যটন আকর্ষণ",
    en: "Curated Spots"
  },
  stat_beach: {
    bn: "কিমি দীর্ঘ অবিচ্ছিন্ন সৈকত",
    en: "km Unbroken Sea Beach"
  },

  // Section Headers
  section_divisions_title: {
    bn: "৮টি প্রশাসনিক বিভাগ অন্বেষণ করুন",
    en: "Explore the 8 Administrative Divisions"
  },
  section_divisions_desc: {
    bn: "পদ্মা-মেঘনা-যমুনার অববাহিকা থেকে পাহাড়ি উপত্যকা ও বঙ্গোপসাগরের সৈকত পর্যন্ত বাংলাদেশের প্রতিটি বিভাগীয় বৈচিত্র্য।",
    en: "From the riverine delta to misty hill summits and the Bay of Bengal, experience the geographical diversity of Bangladesh."
  },
  section_featured_spots_title: {
    bn: "শীর্ষ পর্যটন আকর্ষণসমূহ",
    en: "Top Tourist Attractions"
  },
  section_featured_spots_desc: {
    bn: "আন্তর্জাতিকভাবে প্রশংসিত ইউনেস্কো বিশ্ব ঐতিহ্য ও অবিস্মরণীয় প্রাকৃতিক গন্তব্যসমূহ।",
    en: "Internationally renowned UNESCO World Heritage sites and unforgettable natural landmarks."
  },
  section_districts_title: {
    bn: "৬৪ জেলার ঐতিহ্য ও পর্যটন তথ্যভাণ্ডার",
    en: "All 64 Districts Directory"
  },
  section_districts_desc: {
    bn: "প্রত্যেক জেলার স্বতন্ত্র ঐতিহ্যবাহী খাবার, দর্শনীয় স্থান ও ভৌগোলিক বৈশিষ্ট্য জানুন।",
    en: "Browse all 64 official districts with authentic heritage, iconic delicacies, and local attractions."
  },
  section_guides_title: {
    bn: "বিশেষ ভ্রমণ সহায়িকা ও ফিচার",
    en: "Travel Guides & Cultural Stories"
  },
  section_guides_desc: {
    bn: "ভ্রমণ পরিকল্পনার নিখুঁত রুটিন, জেলাভিত্তিক রসনা বিলাস ও দায়িত্বশীল পর্যটন টিপস।",
    en: "Essential itineraries, regional cuisine chronicles, and sustainable tourism tips."
  },

  // Card & Detail Labels
  view_details: {
    bn: "বিস্তারিত তথ্য",
    en: "View Details"
  },
  view_districts: {
    bn: "জেলাসমূহ দেখুন",
    en: "View Districts"
  },
  save_place: {
    bn: "সংরক্ষণ",
    en: "Bookmark"
  },
  saved_place: {
    bn: "সংরক্ষিত",
    en: "Saved"
  },
  districts_count_label: {
    bn: "জেলা সংখ্যা",
    en: "Districts"
  },
  headquarters: {
    bn: "সদর দপ্তর",
    en: "Headquarters"
  },
  area_sqkm: {
    bn: "বর্গ কিমি",
    en: "sq km"
  },
  famous_for: {
    bn: "বিখ্যাত",
    en: "Famous For"
  },
  division_label: {
    bn: "বিভাগ",
    en: "Division"
  },
  district_label: {
    bn: "জেলা",
    en: "District"
  },
  overview_heading: {
    bn: "সংক্ষিপ্ত পরিচিতি ও তাৎপর্য",
    en: "Overview & Significance"
  },
  history_heading: {
    bn: "ইতিহাস ও ঐতিহ্য",
    en: "History & Heritage"
  },
  how_to_reach: {
    bn: "কীভাবে পৌঁছাবেন (যোগাযোগ ব্যবস্থা)",
    en: "How to Reach (Transportation)"
  },
  best_time: {
    bn: "ভ্রমণের সর্বোত্তম সময়",
    en: "Best Visiting Season"
  },
  travel_tips: {
    bn: "পর্যটকদের জন্য জরুরি পরামর্শ ও সতর্কতা",
    en: "Essential Travel Tips & Guidelines"
  },
  share_btn: {
    bn: "শেয়ার করুন",
    en: "Share"
  },
  link_copied: {
    bn: "লিংক কপি করা হয়েছে!",
    en: "Link copied to clipboard!"
  },
  close: {
    bn: "বন্ধ করুন",
    en: "Close"
  },

  // Trip planner tool
  planner_title: {
    bn: "ইন্টারেক্টিভ ট্যুর প্ল্যানার",
    en: "Smart Trip Planner"
  },
  planner_desc: {
    bn: "আপনার পছন্দ অনুযায়ী নিখুঁত বাংলাদেশ ভ্রমণ রুট তৈরি করুন।",
    en: "Generate an authentic customized itinerary based on your days and travel style."
  },
  planner_days: {
    bn: "ভ্রমণের মেয়াদ",
    en: "Duration"
  },
  planner_vibe: {
    bn: "ভ্রমণের ধরন",
    en: "Travel Vibe"
  },
  vibe_nature: {
    bn: "প্রকৃতি, বন ও বন্যপ্রাণী",
    en: "Nature & Wildlife"
  },
  vibe_beach: {
    bn: "সমুদ্র ও অবকাশযাপন",
    en: "Beaches & Relaxation"
  },
  vibe_hills: {
    bn: "পাহাড়, ট্র্যাকিং ও মেঘ",
    en: "Hills & Trekking"
  },
  vibe_heritage: {
    bn: "ইতিহাস ও প্রাচীন সংস্কৃতি",
    en: "History & Architecture"
  },
  generate_plan: {
    bn: "পরিকল্পনা তৈরি করুন",
    en: "Generate Itinerary"
  },

  // States
  loading: {
    bn: "তথ্য লোড হচ্ছে...",
    en: "Loading information..."
  },
  no_results_title: {
    bn: "কোনো তথ্য পাওয়া যায়নি",
    en: "No destinations found"
  },
  no_results_desc: {
    bn: "আপনার অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো ফলাফল নেই। অন্য শব্দ দিয়ে চেষ্টা করুন।",
    en: "No results matched your search or filters. Please try alternative keywords."
  },
  error_title: {
    bn: "সাময়িক সমস্যা দেখা দিয়েছে",
    en: "A temporary error occurred"
  },
  try_again: {
    bn: "পুনরায় চেষ্টা করুন",
    en: "Try Again"
  },

  // Admin Portal & Firebase
  admin_title: {
    bn: "বাংলাদেশ পর্যটন নিয়ন্ত্রণ কেন্দ্র (অ্যাডমিন)",
    en: "Bangladesh Tourism Admin Dashboard"
  },
  admin_desc: {
    bn: "ফায়ারবেস ক্লাউড ফায়ারস্টোর ডাটাবেস ব্যবস্থাপনা ও লাইভ সিঙ্ক।",
    en: "Manage Firebase Cloud Firestore live records and synchronization."
  },
  admin_login_btn: {
    bn: "গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন করুন",
    en: "Sign in with Google"
  },
  admin_logged_in: {
    bn: "অ্যাডমিন হিসেবে লগইন আছেন:",
    en: "Signed in as Administrator:"
  },
  admin_logout: {
    bn: "লগআউট",
    en: "Sign Out"
  },
  admin_sync_title: {
    bn: "ফায়ারবেস ক্লাউড ফায়ারস্টোর ডাটা সিঙ্ক্রোনাইজেশন",
    en: "Firebase Cloud Firestore Data Sync"
  },
  admin_sync_desc: {
    bn: "৮টি বিভাগ ও ৬৪টি জেলার অফিসিয়াল রেকর্ড ফায়ারস্টোরে সিঙ্ক করুন।",
    en: "Sync official records for 8 divisions and 64 districts directly into Firestore collections."
  },
  admin_sync_btn: {
    bn: "ফায়ারস্টোরে ডাটা সিঙ্ক করুন",
    en: "Seed / Sync Data to Firestore"
  },
  syncing: {
    bn: "সিঙ্ক করা হচ্ছে...",
    en: "Syncing data to Firestore..."
  },
  sync_success: {
    bn: "ডাটাবেস সফলভাবে আপডেট হয়েছে!",
    en: "Firestore successfully populated!"
  },
  firestore_status_active: {
    bn: "ফায়ারস্টোর সক্রিয়",
    en: "Firestore Connected"
  },

  // Footer & Emergency
  footer_about_heading: {
    bn: "বাংলাদেশ পর্যটন সম্পর্কে",
    en: "About Bangladesh Tourism"
  },
  footer_about_text: {
    bn: "অফিসিয়াল তথ্যভাণ্ডার যার মাধ্যমে দেশি ও বিদেশি পর্যটকরা বাংলাদেশের সমৃদ্ধ সংস্কৃতি, ঐতিহ্য এবং অনুপম প্রাকৃতিক রূপ স্বাচ্ছন্দ্যে ঘুরে দেখতে পারেন।",
    en: "An official repository helping local and global travelers discover Bangladesh's rich culture, timeless heritage, and untouched natural wonders."
  },
  footer_emergency_heading: {
    bn: "জরুরি সেবা ও হটলাইন",
    en: "Emergency Hotlines"
  },
  emergency_national: {
    bn: "জাতীয় জরুরি সেবা (পুলিশ, অ্যাম্বুলেন্স, ফায়ার): ৯৯৯",
    en: "National Emergency (Police, Medical, Fire): 999"
  },
  emergency_tourist_police: {
    bn: "ট্যুরিস্ট পুলিশ বাংলাদেশ হেল্পলাইন: ০১৩২০-১৬৩৫৯৯",
    en: "Tourist Police Bangladesh: +880 1320-163599"
  },
  emergency_info: {
    bn: "তথ্য বাতায়ন: ৩৩৩",
    en: "Government Services Info: 333"
  },
  copyright: {
    bn: "© ২০২৬ অপরূপ বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।",
    en: "© 2026 Beautiful Bangladesh. All rights reserved."
  },

  // CMS Dashboard & CRUD Modules
  cms_title: {
    bn: "ট্যুরিজম কনটেন্ট ম্যানেজমেন্ট সিস্টেম (সিএমএস)",
    en: "Tourism Content Management System (CMS)"
  },
  cms_subtitle: {
    bn: "বিভাগ, জেলা, দর্শনীয় স্থান, ভ্রমণ গাইড ও মিডিয়া লাইব্রেরি নিয়ন্ত্রণ কেন্দ্র",
    en: "Management portal for divisions, districts, spots, guides & media assets"
  },
  cms_tab_overview: {
    bn: "ড্যাশবোর্ড ওভারভিউ",
    en: "Dashboard Overview"
  },
  cms_tab_divisions: {
    bn: "বিভাগসমূহ (Module 1)",
    en: "Divisions (Module 1)"
  },
  cms_tab_districts: {
    bn: "জেলাসমূহ (Module 2)",
    en: "Districts (Module 2)"
  },
  cms_tab_categories: {
    bn: "ক্যাটাগরি (Module 3)",
    en: "Categories (Module 3)"
  },
  cms_tab_spots: {
    bn: "দর্শনীয় স্থান (Module 4)",
    en: "Tourist Spots (Module 4)"
  },
  cms_tab_articles: {
    bn: "ভ্রমণ গাইড (Module 5)",
    en: "Travel Guides (Module 5)"
  },
  cms_tab_media: {
    bn: "ছবি ও মিডিয়া (Module 6)",
    en: "Image Manager (Module 6)"
  },
  cms_view_website: {
    bn: "ওয়েবসাইট দেখুন",
    en: "View Public Site"
  },
  cms_add_new: {
    bn: "নতুন যোগ করুন",
    en: "Add New"
  },
  cms_edit: {
    bn: "সম্পাদনা",
    en: "Edit"
  },
  cms_delete: {
    bn: "মুছে ফেলুন",
    en: "Delete"
  },
  cms_status_published: {
    bn: "প্রকাশিত",
    en: "Published"
  },
  cms_status_draft: {
    bn: "খসড়া",
    en: "Draft"
  },
  cms_status_scheduled: {
    bn: "নির্ধারিত",
    en: "Scheduled"
  },
  cms_toggle_status: {
    bn: "অবস্থা পরিবর্তন",
    en: "Toggle Status"
  },
  cms_actions: {
    bn: "কার্যক্রম",
    en: "Actions"
  },
  cms_save_record: {
    bn: "তথ্য সংরক্ষণ করুন",
    en: "Save Record"
  },
  cms_cancel: {
    bn: "বাতিল",
    en: "Cancel"
  },
  cms_confirm_delete: {
    bn: "মুছে ফেলার নিশ্চিতকরণ",
    en: "Confirm Deletion"
  },
  cms_delete_prompt: {
    bn: "আপনি কি নিশ্চিতভাবে এই রেকর্ডটি মুছে ফেলতে চান? এটি স্থায়ীভাবে মুছে যাবে।",
    en: "Are you sure you want to delete this record? This action cannot be undone."
  },
  cms_delete_blocked: {
    bn: "মুছে ফেলা অসম্ভব (সম্পর্ক বিদ্যমান)",
    en: "Deletion Blocked (Relationship Exists)"
  },
  cms_search_records: {
    bn: "রেকর্ড খুঁজুন...",
    en: "Search records..."
  },
  cms_prev_page: {
    bn: "পূর্ববর্তী পাতা",
    en: "Previous"
  },
  cms_next_page: {
    bn: "পরবর্তী পাতা",
    en: "Next"
  },
  cms_total_records: {
    bn: "মোট রেকর্ড:",
    en: "Total records:"
  },
  cms_showing_page: {
    bn: "পাতা:",
    en: "Page:"
  },
  cms_validation_error: {
    bn: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন।",
    en: "Please properly fill in all required fields."
  },
  cms_slug_exists: {
    bn: "এই স্লাগটি (slug) ইতিমধ্যে ব্যবহৃত হয়েছে। নতুন স্লাগ দিন।",
    en: "This unique slug is already taken. Please choose another."
  },
  cms_demo_admin_banner: {
    bn: "অ্যাডমিন সুবিধা সক্রিয়: আপনি সরাসরি ডাটা তৈরি, সম্পাদনা, মুছে ফেলা ও সিঙ্ক করতে পারবেন।",
    en: "Admin mode active: You can create, edit, delete, and synchronize Firestore live data."
  }
};

export function getTranslation(key: string, lang: Language): string {
  if (I18N[key]) {
    return I18N[key][lang] || I18N[key]['bn'];
  }
  return key;
}

export function getCurrentLanguage(): Language {
  const saved = localStorage.getItem('bd_tourism_lang');
  if (saved === 'en' || saved === 'bn') {
    return saved;
  }
  return 'bn'; // Bengali is default as required
}

export function setLanguagePreference(lang: Language): void {
  localStorage.setItem('bd_tourism_lang', lang);
}
