/**
 * Editable Bilingual Legal Pages Defaults & Configuration Schema
 * Persisted in Firestore at site_settings/legal_pages and editable via CMS.
 * Note: Legal documents carry explicit pre-publication review flags until approved.
 */

export interface LegalPagesConfig {
  id: 'legal_pages';
  privacy_title_en: string;
  privacy_title_bn: string;
  privacy_content_en: string;
  privacy_content_bn: string;
  privacy_reviewed: boolean;
  privacy_reviewed_by?: string;
  privacy_reviewed_at?: string;
  terms_title_en: string;
  terms_title_bn: string;
  terms_content_en: string;
  terms_content_bn: string;
  terms_reviewed: boolean;
  terms_reviewed_by?: string;
  terms_reviewed_at?: string;
  contact_email: string;
  updated_at: string;
}

export const DEFAULT_LEGAL_PAGES: LegalPagesConfig = {
  id: 'legal_pages',
  privacy_title_en: 'Privacy Policy',
  privacy_title_bn: 'গোপনীয়তা নীতি (Privacy Policy)',
  privacy_reviewed: false,
  privacy_reviewed_by: '',
  privacy_reviewed_at: '',
  privacy_content_en: `## 1. Information Collection

Beautiful Bangladesh ("the Portal") is designed primarily as an open informational travel guide across all 8 divisions and 64 districts of Bangladesh. Visitors can browse destinations, district directories, categories, and travel guides without creating an account.

We only collect personal information when you voluntarily provide it through:
- **Contact Form Submissions:** Your name, email address, subject, and message submitted on the [Contact Page](/contact/).
- **Newsletter Subscriptions:** Your email address and preferred display language when you choose to subscribe to tourism updates.
- **Administrative Sign-In (CMS):** Authorized content editors signing in via Google Authentication store standard session identity details required for access control.

---

## 2. Cookies and Local Storage

We do not use invasive advertising cookies or third-party behavioral tracking pixels. To deliver a responsive bilingual experience, the Portal uses browser **localStorage** solely for essential functionality:
- Remembering your preferred interface language (\`bn\` for Bengali or \`en\` for English).
- Saving your bookmarked tourist destinations locally on your device.
- Retaining temporary CMS editorial drafts when offline or awaiting database synchronization.

You can clear browser storage at any time through your browser settings.

---

## 3. Newsletter Subscriptions

When you subscribe to our newsletter, your email address and language preference are stored securely in our database (\`newsletter_subscribers\`) solely to send periodic Bangladesh travel guides, seasonal destination highlights, and cultural event updates.

We never sell, rent, or trade subscriber lists to commercial marketers. To request removal from our newsletter list at any time, please submit an unsubscribe request via our [Contact Page](/contact/).

---

## 4. Third-Party Services

To operate reliably and provide helpful travel context, the Portal integrates select third-party infrastructure and outbound references:
- **Google Firebase / Cloud Firestore:** Used for cloud content hosting, database queries, and authorized administrator authentication.
- **Google Maps Links:** Destination pages provide outbound links to Google Maps coordinates. Opening those links takes you to Google Maps under Google's own privacy terms.
- **External Media Hosting:** Curated photographic assets may be served from vetted image CDNs over HTTPS.

---

## 5. Data Protection

We follow strict technical safeguards to protect user submissions:
- Contact form submissions are transmitted directly to our backend endpoint over HTTPS and processed without exposing email service credentials or secret keys in client-side code.
- Database write operations are governed by strict schema and role-based Firestore security rules.
- We retain contact inquiries only as long as needed to respond to your question, verify editorial corrections, or meet legal record-keeping obligations.

---

## 6. Contact Information

If you have questions about this Privacy Policy, wish to correct or delete information you submitted, or want to report a privacy concern, please reach out through our [Contact Page](/contact/) or write directly to **info@tourism.gov.bd**.`,

  privacy_content_bn: `## ১. তথ্য সংগ্রহ (Information Collection)

অপরূপ বাংলাদেশ পোর্টালটি মূলত বাংলাদেশের ৮টি বিভাগ ও ৬৪টি জেলার পর্যটন তথ্য সবার জন্য উন্মুক্ত রাখার উদ্দেশ্যে নির্মিত। সাধারণ দর্শনার্থীরা কোনো অ্যাকাউন্ট তৈরি না করেই দর্শনীয় স্থান, জেলা গাইড, ক্যাটাগরি এবং ভ্রমণ নির্দেশিকা দেখতে পারেন।

আমরা কেবল তখনই ব্যক্তিগত তথ্য সংগ্রহ করি যখন আপনি স্বেচ্ছায় নিচের মাধ্যমগুলোতে তথ্য প্রদান করেন:
- **যোগাযোগ ফর্ম (Contact Form):** [যোগাযোগ পাতায়](/contact/) আপনার নাম, ইমেইল ঠিকানা, বিষয় ও বার্তা প্রেরণ করলে।
- **নিউজলেটার সাবস্ক্রিপশন:** ভ্রমণ বিষয়ক আপডেট পেতে আপনার ইমেইল ও পছন্দের ভাষা প্রদান করলে।
- **অ্যাডমিনিস্ট্রেটিভ সাইন-ইন (CMS):** অনুমোদিত সম্পাদকদের প্রবেশাধিকার যাচাইয়ের জন্য গুগল অথেনটিকেশন সংক্রান্ত মৌলিক তথ্য ব্যবহৃত হয়।

---

## ২. কুকিজ ও লোকাল স্টোরেজ (Cookies and Local Storage)

এই পোর্টালে কোনো বিজ্ঞাপননির্ভর ট্র্যাকিং কুকি বা তৃতীয় পক্ষের আচরণগত ট্র্যাকার ব্যবহার করা হয় না। আপনার ব্রাউজিং অভিজ্ঞতা সহজ রাখতে ব্রাউজারের **localStorage** কেবল নিচের প্রয়োজনীয় কাজে ব্যবহৃত হয়:
- আপনার পছন্দের ভাষা (**বাংলা** বা **English**) মনে রাখা।
- আপনার সংরক্ষিত (Bookmarked) প্রিয় দর্শনীয় স্থানগুলো নিজের ডিভাইসে সংরক্ষণ করা।
- অফলাইন বা সিঙ্ক-পূর্ব অবস্থায় সিএমএস-এর খসড়া তথ্য অস্থায়ীভাবে ধরে রাখা।

আপনি যেকোনো সময় ব্রাউজারের সেটিংস থেকে লোকাল স্টোরেজ মুছে ফেলতে পারেন।

---

## ৩. নিউজলেটার সাবস্ক্রিপশন (Newsletter Subscriptions)

আপনি নিউজলেটারে নিবন্ধন করলে কেবল বাংলাদেশের নতুন ভ্রমণ গাইড, মৌসুমি গন্তব্য ও সাংস্কৃতিক আয়োজন সংক্রান্ত তথ্য পাঠানোর উদ্দেশ্যে আপনার ইমেইল এবং ভাষার পছন্দ ডাটাবেসে (\`newsletter_subscribers\`) সংরক্ষিত হয়।

আমরা কখনোই ব্যবহারকারীদের ইমেইল তালিকা কোনো বাণিজ্যিক প্রতিষ্ঠান বা তৃতীয় পক্ষের কাছে বিক্রি বা হস্তান্তর করি না। যেকোনো সময় সাবস্ক্রিপশন বাতিল করতে [যোগাযোগ পাতার](/contact/) মাধ্যমে অনুরোধ পাঠাতে পারেন।

---

## ৪. তৃতীয় পক্ষের সেবা (Third-Party Services)

পোর্টালটি সচল ও নির্ভুল রাখতে নির্দিষ্ট কিছু নির্ভরযোগ্য প্রযুক্তি সেবা ও বহিঃসংযোগ ব্যবহৃত হয়:
- **Google Firebase / Cloud Firestore:** ক্লাউড ডাটাবেস থেকে পর্যটন তথ্য সরবরাহ এবং অনুমোদিত অ্যাডমিন যাচাইয়ের জন্য ব্যবহৃত হয়।
- **Google Maps লিংক:** দর্শনীয় স্থানের অবস্থান দেখাতে গুগল ম্যাপের বহিঃসংযোগ দেওয়া হয়, যা নিজ নিজ নীতিমালা অনুযায়ী পরিচালিত।
- **ছবি ও মিডিয়া হোস্টিং:** অনুমোদিত ও নিরাপদ HTTPS মিডিয়া সার্ভার থেকে ভ্রমণ আলোকচিত্র প্রদর্শিত হয়।

---

## ৫. তথ্য সুরক্ষা (Data Protection)

ব্যবহারকারীর তথ্যের গোপনীয়তা ও নিরাপত্তা নিশ্চিত করতে আমরা নিম্নোক্ত ব্যবস্থা গ্রহণ করি:
- যোগাযোগ ফর্মের তথ্য নিরাপদ HTTPS সংযোগের মাধ্যমে সরাসরি সার্ভার-সাইড এন্ডপয়েন্টে পাঠানো হয়; ফ্রন্টএন্ড কোডে কোনো গোপন কী বা মেইল সার্ভিস ক্রেডেনশিয়াল রাখা হয় না।
- ডাটাবেসের প্রতিটি সংগ্রহ কঠোর ফায়ারস্টোর নিরাপত্তা বিধি (Security Rules) দ্বারা সুরক্ষিত।
- আপনার প্রশ্নের উত্তর দেওয়া বা তথ্যের সংশোধন সম্পন্ন হওয়ার পর অপ্রয়োজনীয় ব্যক্তিগত বার্তা দীর্ঘদিন সংরক্ষণ করা হয় না।

---

## ৬. যোগাযোগের তথ্য (Contact Information)

এই গোপনীয়তা নীতি সম্পর্কে কোনো প্রশ্ন থাকলে, পূর্বে প্রেরিত কোনো তথ্য সংশোধন বা মুছে ফেলতে চাইলে অথবা গোপনীয়তা সংক্রান্ত কোনো অভিযোগ জানাতে অনুগ্রহ করে আমাদের [যোগাযোগ পাতা](/contact/) ব্যবহার করুন অথবা **info@tourism.gov.bd** ঠিকানায় ইমেইল করুন।`,

  terms_title_en: 'Terms and Conditions',
  terms_title_bn: 'ব্যবহারের শর্তাবলী (Terms and Conditions)',
  terms_reviewed: false,
  terms_reviewed_by: '',
  terms_reviewed_at: '',
  terms_content_en: `## 1. Website Usage

By accessing and using Beautiful Bangladesh ("the Portal"), you agree to use this website solely for lawful, personal, educational, and non-commercial travel planning purposes.

You agree not to:
- Attempt unauthorized access to administrative CMS controls, backend endpoints, or database collections.
- Submit automated spam, malicious payloads, or misleading corrections through the contact or newsletter forms.
- Scrape, mirror, or republish substantial portions of the directory database for commercial resale without prior written permission.

---

## 2. Content Accuracy Disclaimer

We strive to maintain verified, up-to-date bilingual descriptions across Bangladesh's 8 divisions, 64 districts, tourist spots, and travel guides. However, information is provided strictly on an informational **"as available"** basis.

Where entry fees, opening hours, estimated costs, or transport timings have not been officially verified, the Portal explicitly marks them as unavailable rather than estimating or inventing figures.

---

## 3. Travel Information Disclaimer

Travel conditions in Bangladesh can change rapidly due to seasonal weather, monsoon river levels, local administrative directives, festival schedules, and regional permit rules (such as hill district checkpoints or Sundarbans Forest Department regulations).

Before finalizing travel arrangements:
- Always confirm current entry fees, boat/bus/rail schedules, accommodation availability, and special permit requirements with local authorities or official operators.
- Follow local safety advisories, Tourist Police instructions (**01320-163599**), and National Emergency (**999**) guidelines during emergencies.

---

## 4. Copyright & Intellectual Property

Unless otherwise noted, all original bilingual editorial copy, district summaries, travel guides, interface layouts, and curated structure published on this Portal are protected by applicable copyright laws.

Photographic assets, maps, and third-party cultural references remain the intellectual property of their respective creators and institutions. Brief excerpts with proper attribution and direct links back to the Portal are permitted for non-commercial informational reference.

---

## 5. External Links

This Portal includes outbound links to third-party resources such as Google Maps, heritage institutions, and external reference pages for traveler convenience. We do not control the availability, security, or content accuracy of external websites, and linking does not imply endorsement.

---

## 6. Limitation of Liability

To the fullest extent permitted by applicable law, Beautiful Bangladesh and its editorial contributors shall not be liable for any direct, indirect, incidental, or consequential loss, travel disruption, personal injury, or financial expense arising from reliance on information published on this Portal or from visiting any listed destination.

Travelers remain solely responsible for their personal safety, travel permits, health precautions, and itinerary decisions. If you spot outdated or inaccurate destination data, please notify us via the [Contact Page](/contact/).`,

  terms_content_bn: `## ১. ওয়েবসাইট ব্যবহারের নিয়মাবলী (Website Usage)

অপরূপ বাংলাদেশ পোর্টাল ব্যবহারের মাধ্যমে আপনি সম্মত হচ্ছেন যে এই ওয়েবসাইটটি কেবল বৈধ, ব্যক্তিগত, শিক্ষামূলক এবং অবাণিজ্যিক ভ্রমণ পরিকল্পনার উদ্দেশ্যে ব্যবহার করবেন।

ব্যবহারকারীদের জন্য নিষিদ্ধ কার্যক্রম:
- পোর্টালের অ্যাডমিনিস্ট্রেটিভ সিএমএস, সার্ভার এন্ডপয়েন্ট বা ডাটাবেসে অননুমোদিত প্রবেশের চেষ্টা করা।
- যোগাযোগ ফর্ম বা নিউজলেটারের মাধ্যমে স্প্যাম, ক্ষতিকর কোড বা মিথ্যা তথ্য প্রেরণ করা।
- পূর্বানুমতি ছাড়া বাণিজ্যিক উদ্দেশ্যে এই ডিরেক্টরির তথ্যবস্তু স্বয়ংক্রিয়ভাবে সংগ্রহ (Scraping) বা পুনঃপ্রকাশ করা।

---

## ২. তথ্যের নির্ভুলতা সংক্রান্ত ঘোষণা (Content Accuracy Disclaimer)

বাংলাদেশের ৮টি বিভাগ, ৬৪টি জেলা, দর্শনীয় স্থান ও ভ্রমণ নির্দেশিকার নির্ভরযোগ্য ও হালনাগাদ দ্বিভাষিক তথ্য উপস্থাপনে আমরা সর্বোচ্চ সতর্কতা অবলম্বন করি। তবুও পোর্টালের সকল তথ্য কেবল সাধারণ তথ্যসহায়তা হিসেবে প্রকাশিত।

যেসব দর্শনীয় স্থানের প্রবেশ ফি, খোলা-বন্ধের সময়সূচি, আনুমানিক খরচ বা পরিবহন সময় আনুষ্ঠানিকভাবে যাচাইকৃত নয়, সেগুলোর ক্ষেত্রে কাল্পনিক কোনো সংখ্যা যোগ না করে স্পষ্টভাবে "তথ্য পাওয়া যায়নি" বা "যাচাইকৃত নয়" হিসেবে প্রদর্শন করা হয়।

---

## ৩. ভ্রমণ তথ্য সংক্রান্ত সতর্কতা (Travel Information Disclaimer)

মৌসুমি আবহাওয়া, বর্ষা ও নদীর নাব্যতা, স্থানীয় প্রশাসনিক নির্দেশনা, সরকারি ছুটি এবং পার্বত্য জেলা বা সুন্দরবন বন বিভাগের মতো সংরক্ষিত এলাকার অনুমতি নিয়মের কারণে ভ্রমণ পরিস্থিতি যেকোনো সময় পরিবর্তিত হতে পারে।

ভ্রমণে বের হওয়ার আগে অনুগ্রহ করে:
- সংশ্লিষ্ট স্থানীয় প্রশাসন, পরিবহন সংস্থা বা বন/পর্যটন দপ্তরের কাছ থেকে সর্বশেষ প্রবেশ ফি, সময়সূচি ও ভ্রমণ অনুমতি যাচাই করে নিন।
- জরুরি প্রয়োজনে **ট্যুরিস্ট পুলিশ হেল্পলাইন (০১৩২০-১৬৩৫৯৯)** এবং **জাতীয় জরুরি সেবা (৯৯৯)**-এর সহায়তা ও নির্দেশনা অনুসরণ করুন।

---

## ৪. কপিরাইট ও মেধাস্বত্ব (Copyright)

ভিন্নভাবে উল্লেখ না থাকলে, এই পোর্টালে প্রকাশিত মৌলিক বাংলা ও ইংরেজি বিবরণ, জেলা পরিচিতি, ভ্রমণ নির্দেশিকা ও উপস্থাপনার স্বত্ব পোর্টাল কর্তৃপক্ষের অধীনে সংরক্ষিত।

ব্যবহৃত আলোকচিত্র, মানচিত্র এবং তৃতীয় পক্ষের তথ্যসূত্রের মেধাস্বত্ব সংশ্লিষ্ট আলোকচিত্রী বা প্রতিষ্ঠানের। অবাণিজ্যিক ও শিক্ষামূলক রেফারেন্স হিসেবে পোর্টালের মূল লিংক ও কৃতজ্ঞতা উল্লেখসহ সংক্ষিপ্ত উদ্ধৃতি ব্যবহার করা যাবে।

---

## ৫. বহিঃসংযোগ বা এক্সটার্নাল লিংক (External Links)

ভ্রমণকারীদের সুবিধার্থে পোর্টালে গুগল ম্যাপস ও সংশ্লিষ্ট প্রতিষ্ঠানের বহিঃসংযোগ যুক্ত থাকতে পারে। তৃতীয় পক্ষের ওয়েবসাইটের বিষয়বস্তু, প্রাপ্যতা বা নিরাপত্তা নীতিমালার ওপর আমাদের কোনো নিয়ন্ত্রণ নেই এবং লিংক যুক্ত থাকা মানেই উক্ত বাহ্যিক সাইটের সম্পূর্ণ দায়ভার গ্রহণ নয়।

---

## ৬. দায়বদ্ধতার সীমাবদ্ধতা (Limitation of Liability)

প্রযোজ্য আইনের সর্বোচ্চ সীমা অনুযায়ী, এই পোর্টালে প্রকাশিত কোনো তথ্যের ওপর নির্ভর করে সৃষ্ট ভ্রমণ বিলম্ব, আর্থিক ক্ষতি, পরোক্ষ বা আনুষঙ্গিক কোনো অসুবিধা কিংবা কোনো গন্তব্য ভ্রমণজনিত ক্ষতির জন্য অপরূপ বাংলাদেশ বা এর সম্পাদকমণ্ডলী দায়ী থাকবে না।

ভ্রমণের নিরাপত্তা, প্রয়োজনীয় অনুমতি ও চূড়ান্ত পরিকল্পনা গ্রহণের দায়িত্ব সম্পূর্ণভাবে ভ্রমণকারীর নিজস্ব। কোনো তথ্য হালনাগাদ বা সংশোধনের প্রয়োজন মনে করলে অনুগ্রহ করে আমাদের [যোগাযোগ পাতায়](/contact/) জানান।`,

  contact_email: 'info@tourism.gov.bd',
  updated_at: '2026-03-01T00:00:00.000Z'
};

export function normalizeLegalPagesConfig(raw?: Partial<LegalPagesConfig> | null): LegalPagesConfig {
  const source = raw || {};
  return {
    id: 'legal_pages',
    privacy_title_en: (source.privacy_title_en || '').trim() || DEFAULT_LEGAL_PAGES.privacy_title_en,
    privacy_title_bn: (source.privacy_title_bn || '').trim() || DEFAULT_LEGAL_PAGES.privacy_title_bn,
    privacy_content_en: (source.privacy_content_en || '').trim() || DEFAULT_LEGAL_PAGES.privacy_content_en,
    privacy_content_bn: (source.privacy_content_bn || '').trim() || DEFAULT_LEGAL_PAGES.privacy_content_bn,
    privacy_reviewed: Boolean(source.privacy_reviewed),
    privacy_reviewed_by: (source.privacy_reviewed_by || '').trim(),
    privacy_reviewed_at: (source.privacy_reviewed_at || '').trim(),
    terms_title_en: (source.terms_title_en || '').trim() || DEFAULT_LEGAL_PAGES.terms_title_en,
    terms_title_bn: (source.terms_title_bn || '').trim() || DEFAULT_LEGAL_PAGES.terms_title_bn,
    terms_content_en: (source.terms_content_en || '').trim() || DEFAULT_LEGAL_PAGES.terms_content_en,
    terms_content_bn: (source.terms_content_bn || '').trim() || DEFAULT_LEGAL_PAGES.terms_content_bn,
    terms_reviewed: Boolean(source.terms_reviewed),
    terms_reviewed_by: (source.terms_reviewed_by || '').trim(),
    terms_reviewed_at: (source.terms_reviewed_at || '').trim(),
    contact_email: (source.contact_email || '').trim() || DEFAULT_LEGAL_PAGES.contact_email,
    updated_at: (source.updated_at || '').trim() || DEFAULT_LEGAL_PAGES.updated_at
  };
}
