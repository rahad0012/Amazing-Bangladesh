/**
 * Static Information & Legal Pages
 * - /about/
 * - /contact/
 * - /privacy-policy/
 * - /terms-and-conditions/
 *
 * All four pages support bilingual Bengali ('bn') & English ('en') content,
 * structured SEO schemas, and reuse global Breadcrumbs, Navbar, and Footer.
 * Legal pages are editable via Firestore (site_settings/legal_pages) & CMS
 * and display explicit pre-publication review notices until approved.
 */

import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';
import { renderBreadcrumbs } from '../components';
import { parseSafeArticleContent } from './ArticleDetailsPage';
import { type LegalPagesConfig } from '../services/legalPagesDefaults';

export interface AboutPageProps {
  lang: Language;
  divisionsCount: number;
  districtsCount: number;
  spotsCount: number;
  categoriesCount: number;
  articlesCount: number;
}

export interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  isSubmitting: boolean;
  submittedReferenceId: string | null;
  submittedMessage: string | null;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

export interface ContactPageProps {
  lang: Language;
  contactEmail: string;
  formState: ContactFormState;
}

export interface LegalDocumentPageProps {
  lang: Language;
  docType: 'privacy' | 'terms';
  legalPages: LegalPagesConfig;
}

function formatIsoDate(isoString: string | undefined, lang: Language): string {
  if (!isoString) return lang === 'bn' ? 'নির্ধারিত নয়' : 'Not specified';
  const parsed = Date.parse(isoString);
  if (Number.isNaN(parsed)) return isoString;
  return new Date(parsed).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ============================================================================
// 1. ABOUT PAGE (/about/)
// ============================================================================
export function renderAboutPage(props: AboutPageProps): string {
  const {
    lang,
    divisionsCount,
    districtsCount,
    spotsCount,
    categoriesCount,
    articlesCount
  } = props;
  const isBn = lang === 'bn';

  const breadcrumbs = renderBreadcrumbs([
    { labelBn: 'আমাদের সম্পর্কে', labelEn: 'About Us' }
  ], lang);

  const discoverCards = [
    {
      icon: 'bi-grid-1x2-fill',
      titleBn: `${formatLocalizedNumber(divisionsCount, 'bn')}টি প্রশাসনিক বিভাগ`,
      titleEn: `${divisionsCount} Administrative Divisions`,
      descBn: 'ঢাকা, চট্টগ্রাম, রাজশাহী, খুলনা, বরিশাল, সিলেট, রংপুর ও ময়মনসিংহের সম্পূর্ণ ভৌগোলিক ও ঐতিহাসিক পরিচিতি।',
      descEn: 'Complete geographical and cultural overviews across Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, and Mymensingh.',
      href: '/divisions/'
    },
    {
      icon: 'bi-geo-alt-fill',
      titleBn: `${formatLocalizedNumber(districtsCount, 'bn')}টি জেলার ডিরেক্টরি`,
      titleEn: `${districtsCount} Districts Directory`,
      descBn: 'প্রতিটি জেলার ঐতিহ্যবাহী খাবার, লোকজ সংস্কৃতি, অবস্থান ও স্থানীয় দর্শনীয় স্থানের সুশৃঙ্খল তথ্য।',
      descEn: 'District-level guides featuring local heritage, culinary specialties, coordinates, and regional landmarks.',
      href: '/districts/'
    },
    {
      icon: 'bi-compass-fill',
      titleBn: `${formatLocalizedNumber(spotsCount, 'bn')}+ দর্শনীয় স্থান`,
      titleEn: `${spotsCount}+ Tourist Destinations`,
      descBn: 'সমুদ্র সৈকত, পাহাড়, জলপ্রপাত, প্রত্নতাত্ত্বিক নিদর্শন, ম্যানগ্রোভ অরণ্য এবং যাওয়ার নির্ভরযোগ্য নির্দেশনা।',
      descEn: 'Curated places spanning beaches, hill valleys, waterfalls, mangrove forests, and heritage monuments.',
      href: '/places/'
    },
    {
      icon: 'bi-tags-fill',
      titleBn: `${formatLocalizedNumber(categoriesCount, 'bn')}টি পর্যটন ক্যাটাগরি`,
      titleEn: `${categoriesCount} Tourism Categories`,
      descBn: 'আগ্রহ অনুযায়ী সৈকত, পাহাড়, বন, ঐতিহাসিক স্থান, দ্বীপ, হ্রদ ও বন্যপ্রাণী অভয়ারণ্য খুঁজে নিন।',
      descEn: 'Browse destinations effortlessly by landscape and interest—from coastlines and rivers to ancient sites.',
      href: '/categories/'
    },
    {
      icon: 'bi-journal-richtext',
      titleBn: `${formatLocalizedNumber(articlesCount, 'bn')}+ ভ্রমণ নির্দেশিকা ও ব্লগ`,
      titleEn: `${articlesCount}+ Travel Guides & Stories`,
      descBn: 'বাজেট পরিকল্পনা, পারিবারিক ভ্রমণ, মৌসুমি পরামর্শ ও রুট-ভিত্তিক ভ্রমণ প্রবন্ধ বাংলা ও ইংরেজিতে।',
      descEn: 'Practical editorial handbooks covering budget planning, family trips, seasonal travel, and safety advice.',
      href: '/travel-guides/'
    },
    {
      icon: 'bi-search',
      titleBn: 'দ্বিভাষিক গ্লোবাল অনুসন্ধান',
      titleEn: 'Bilingual Global Search',
      descBn: 'বাংলা বা ইংরেজি যেকোনো ভাষায় বিভাগ, জেলা, দর্শনীয় স্থান, ক্যাটাগরি ও গাইড একসাথে অনুসন্ধান।',
      descEn: 'Unified indexed search across divisions, districts, attractions, categories, and travel guides.',
      href: '/search/'
    }
  ];

  return `
    <div class="bg-light-subtle pb-5">
      <div class="bg-white border-bottom py-2">
        <div class="container">
          ${breadcrumbs}
        </div>
      </div>
      <div class="bg-primary-bd text-white py-5 mb-4 position-relative overflow-hidden">
        <div class="container position-relative z-1 py-2">
          <div class="row align-items-center g-4">
            <div class="col-lg-8">
              <span class="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill mb-3">
                <i class="bi bi-info-circle-fill me-1"></i>
                ${isBn ? 'আমাদের সম্পর্কে • পোর্টাল পরিচিতি' : 'About Beautiful Bangladesh'}
              </span>
              <h1 class="display-5 fw-bold text-white mb-3">
                ${isBn
                  ? 'বাংলাদেশের প্রতিটি প্রান্তের নির্ভুল ও দ্বিভাষিক ভ্রমণ নির্দেশিকা'
                  : 'Your Verified Bilingual Gateway to Exploring Bangladesh'}
              </h1>
              <p class="lead text-white-50 mb-0 lh-lg">
                ${isBn
                  ? 'অপরূপ বাংলাদেশ একটি তথ্যভিত্তিক ডিজিটাল পর্যটন পোর্টাল—যা দেশি ও বিদেশি ভ্রমণকারীদের জন্য বাংলাদেশের ৮টি বিভাগ, ৬৪টি জেলা, প্রাকৃতিক বৈচিত্র্য এবং হাজার বছরের ঐতিহ্যকে সহজ, গোছানো ও নির্ভরযোগ্যভাবে উপস্থাপন করে।'
                  : 'Beautiful Bangladesh is an informative bilingual tourism directory built to help local and international travelers explore all 8 divisions, 64 districts, natural landscapes, and living cultural heritage with clarity and accuracy.'}
              </p>
            </div>
            <div class="col-lg-4">
              <div class="card border-0 rounded-4 shadow-lg text-white p-4" style="background: rgba(255,255,255,0.08); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.16) !important;">
                <div class="row g-3 text-center">
                  <div class="col-6">
                    <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(divisionsCount, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'প্রশাসনিক বিভাগ' : 'Divisions'}</div>
                  </div>
                  <div class="col-6">
                    <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(districtsCount, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'অফিসিয়াল জেলা' : 'Districts'}</div>
                  </div>
                  <div class="col-6">
                    <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(spotsCount, lang)}+</div>
                    <div class="small text-white-50">${isBn ? 'দর্শনীয় স্থান' : 'Destinations'}</div>
                  </div>
                  <div class="col-6">
                    <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(categoriesCount, lang)}</div>
                    <div class="small text-white-50">${isBn ? 'ক্যাটাগরি' : 'Categories'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Mission & Vision -->
        <div class="row g-4 mb-5">
          <div class="col-md-6">
            <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
              <div class="d-inline-flex align-items-center justify-content-center rounded-3 bg-success-subtle text-success mb-3" style="width: 52px; height: 52px;">
                <i class="bi bi-bullseye fs-4"></i>
              </div>
              <h2 class="h4 fw-bold text-primary-bd mb-3">
                ${isBn ? 'আমাদের লক্ষ্য (Mission)' : 'Our Mission'}
              </h2>
              <p class="text-secondary lh-lg mb-0">
                ${isBn
                  ? 'বাংলাদেশের সুপরিচিত গন্তব্যের পাশাপাশি প্রতিটি জেলার অনাবিষ্কৃত প্রাকৃতিক সৌন্দর্য, ঐতিহাসিক নিদর্শন এবং ভ্রমণ নির্দেশিকা বাংলা ও ইংরেজি উভয় ভাষায় সহজলভ্য করা—যাতে ভ্রমণকারীরা নিরাপদ, দায়িত্বশীল ও পরিকল্পিত ভ্রমণের সিদ্ধান্ত নিতে পারেন।'
                  : 'To make structured, trustworthy travel knowledge about every region of Bangladesh—from iconic landmarks to lesser-known district treasures—freely accessible in both Bengali and English so travelers can plan safer, richer journeys.'}
              </p>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
              <div class="d-inline-flex align-items-center justify-content-center rounded-3 bg-warning-subtle text-warning-emphasis mb-3" style="width: 52px; height: 52px;">
                <i class="bi bi-eye-fill fs-4"></i>
              </div>
              <h2 class="h4 fw-bold text-primary-bd mb-3">
                ${isBn ? 'আমাদের দৃষ্টিভঙ্গি (Vision)' : 'Our Vision'}
              </h2>
              <p class="text-secondary lh-lg mb-0">
                ${isBn
                  ? 'বাংলাদেশের জন্য একটি বিশ্বমানের, তথ্য-সঠিক এবং পরিবেশবান্ধব ডিজিটাল পর্যটন সহায়ক গড়ে তোলা, যা দেশীয় ও আন্তর্জাতিক পর্যটকদের কাছে দেশের প্রকৃতি, সংস্কৃতি ও আতিথেয়তার মর্যাদাপূর্ণ প্রতিনিধিত্ব করবে।'
                  : 'To establish a benchmark digital travel companion for Bangladesh that champions sustainable tourism, local cultural preservation, and transparent, verifiable destination reporting.'}
              </p>
            </div>
          </div>
        </div>

        <!-- Why the platform exists -->
        <div class="card border-0 shadow-sm rounded-4 p-4 p-lg-5 bg-white mb-5">
          <div class="row align-items-center g-4">
            <div class="col-lg-7">
              <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 mb-2">
                ${isBn ? 'কেন এই প্ল্যাটফর্ম' : 'Why This Platform Exists'}
              </span>
              <h2 class="h3 fw-bold text-primary-bd mb-3">
                ${isBn
                  ? 'বিক্ষিপ্ত তথ্যের পরিবর্তে একক, সুবিন্যস্ত ভ্রমণ মানচিত্র'
                  : 'Replacing Fragmented Travel Rumors with One Structured Reference'}
              </h2>
              <p class="text-secondary lh-lg">
                ${isBn
                  ? 'ভ্রমণকারীরা প্রায়ই বিভিন্ন ব্লগ ও সোশ্যাল মিডিয়ায় অসম্পূর্ণ, অপ্রমাণিত বা মেয়াদোত্তীর্ণ তথ্যের সম্মুখীন হন—যেমন ভুল প্রবেশ ফি, অজানা যাতায়াত রুট বা জেলার সঠিক অবস্থান বিভ্রাট। অপরূপ বাংলাদেশ এই শূন্যতা পূরণের জন্য নির্মিত হয়েছে।'
                  : 'Travelers planning trips across Bangladesh often encounter scattered social posts with outdated transport claims, misattributed districts, or unverified pricing. Beautiful Bangladesh brings all 8 divisions and 64 districts together in one clean, searchable, bilingual structure.'}
              </p>
              <p class="text-secondary lh-lg mb-0">
                ${isBn
                  ? 'প্রতিটি দর্শনীয় স্থানকে প্রশাসনিক বিভাগ, জেলা এবং নির্দিষ্ট পর্যটন ক্যাটাগরির সাথে যুক্ত করা হয়েছে, যাতে যেকোনো ভ্রমণকারী সহজেই কাছাকাছি গন্তব্য ও প্রাসঙ্গিক ভ্রমণ নির্দেশিকা খুঁজে পেতে পারেন।'
                  : 'Every destination is linked to its official division, district, and category taxonomy—connecting maps, travel guidance, nearby attractions, and editorial guides into a coherent discovery experience.'}
              </p>
            </div>
            <div class="col-lg-5">
              <div class="bg-light rounded-4 p-4 border">
                <h3 class="h6 fw-bold text-primary-bd mb-3">
                  <i class="bi bi-check2-square text-success me-2"></i>
                  ${isBn ? 'প্ল্যাটফর্মের মূল ভিত্তি' : 'Core Editorial Pillars'}
                </h3>
                <ul class="list-unstyled d-flex flex-column gap-3 mb-0 small text-secondary">
                  <li class="d-flex gap-2">
                    <i class="bi bi-translate text-warning fs-5 flex-shrink-0"></i>
                    <span>
                      <strong class="text-primary-bd d-block">${isBn ? 'সম্পূর্ণ দ্বিভাষিক উপস্থাপনা' : 'Native Bengali & English Support'}</strong>
                      ${isBn ? 'এক ক্লিকে সম্পূর্ণ পোর্টাল বাংলা ও ইংরেজি ভাষায় পরিবর্তনযোগ্য।' : 'Seamless switching across every division, district, spot, and policy page.'}
                    </span>
                  </li>
                  <li class="d-flex gap-2">
                    <i class="bi bi-diagram-3-fill text-success fs-5 flex-shrink-0"></i>
                    <span>
                      <strong class="text-primary-bd d-block">${isBn ? 'ভৌগোলিক নির্ভুলতা' : 'Administrative Accuracy'}</strong>
                      ${isBn ? '৮ বিভাগ ও ৬৪ জেলার সঠিক প্রশাসনিক বিন্যাস সংরক্ষিত।' : 'Maintains official relationships between all 8 divisions and 64 districts.'}
                    </span>
                  </li>
                  <li class="d-flex gap-2">
                    <i class="bi bi-tree-fill text-success fs-5 flex-shrink-0"></i>
                    <span>
                      <strong class="text-primary-bd d-block">${isBn ? 'দায়িত্বশীল ও নিরাপদ পর্যটন' : 'Responsible Tourism'}</strong>
                      ${isBn ? 'পরিবেশ সুরক্ষা ও স্থানীয় জরুরি হেল্পলাইন তথ্যের ওপর গুরুত্ব।' : 'Highlights conservation ethics, local advisories, and emergency helplines.'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- What visitors can discover -->
        <div class="mb-5">
          <div class="text-center mb-4">
            <h2 class="h3 fw-bold text-primary-bd mb-2">
              ${isBn ? 'দর্শনার্থীরা যা আবিষ্কার করতে পারবেন' : 'What Visitors Can Discover'}
            </h2>
            <p class="text-secondary mx-auto" style="max-width: 680px;">
              ${isBn
                ? 'বাংলাদেশের ভ্রমণ পরিকল্পনা সহজ করতে পোর্টালে সংযুক্ত প্রধান বিভাগ ও সুবিধাসমূহ:'
                : 'Explore every corner of the portal designed to guide your journey across Bangladesh:'}
            </p>
          </div>
          <div class="row g-4">
            ${discoverCards.map(card => `
              <div class="col-md-6 col-lg-4">
                <a href="${card.href}" class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white text-decoration-none hover-lift d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary-bd mb-3" style="width: 48px; height: 48px;">
                      <i class="bi ${card.icon} fs-4"></i>
                    </div>
                    <h3 class="h5 fw-bold text-primary-bd mb-2">${isBn ? card.titleBn : card.titleEn}</h3>
                    <p class="small text-secondary lh-base mb-3">${isBn ? card.descBn : card.descEn}</p>
                  </div>
                  <div class="small fw-semibold text-secondary-bd">
                    ${isBn ? 'অন্বেষণ করুন' : 'Explore Section'} <i class="bi bi-arrow-right ms-1"></i>
                  </div>
                </a>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Commitment to Accurate Travel Information -->
        <div class="card border-0 shadow-sm rounded-4 p-4 p-lg-5 bg-white border-start border-4 border-warning">
          <div class="row align-items-center g-4">
            <div class="col-lg-8">
              <h2 class="h4 fw-bold text-primary-bd mb-3">
                <i class="bi bi-patch-check-fill text-warning me-2"></i>
                ${isBn ? 'সঠিক ও যাচাইকৃত ভ্রমণ তথ্যের প্রতি আমাদের অঙ্গীকার' : 'Our Commitment to Accurate Travel Information'}
              </h2>
              <p class="text-secondary lh-lg mb-3">
                ${isBn
                  ? 'ভ্রমণকারীদের আস্থা আমাদের কাছে সবচেয়ে গুরুত্বপূর্ণ। এই পোর্টালে কখনোই মনগড়া প্রবেশ ফি, কাল্পনিক যাতায়াত খরচ, অনুমাননির্ভর সময়সূচি বা ভুয়া রেটিং তৈরি করা হয় না। কোনো স্থানের আনুষ্ঠানিক তথ্য যাচাইকৃত না থাকলে সেখানে স্পষ্টভাবে "তথ্য উপলব্ধ নয়" উল্লেখ করা হয়।'
                  : 'Traveler trust comes first. We never fabricate entry fees, estimated budgets, opening hours, transport timetables, or artificial visitor ratings. Whenever official data for a destination is unverified or unavailable, the portal states so transparently.'}
              </p>
              <div class="d-flex flex-wrap gap-2">
                <a href="/places/" class="btn btn-accent rounded-pill px-4">
                  <i class="bi bi-compass me-1"></i>${isBn ? 'সকল দর্শনীয় স্থান দেখুন' : 'Browse All Destinations'}
                </a>
                <a href="/contact/" class="btn btn-outline-bd rounded-pill px-4">
                  <i class="bi bi-envelope me-1"></i>${isBn ? 'তথ্য সংশোধন বা যোগাযোগ' : 'Submit Correction / Contact'}
                </a>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="p-3 rounded-4 bg-light border small text-secondary">
                <div class="fw-bold text-primary-bd mb-2">
                  <i class="bi bi-file-earmark-text me-1"></i>
                  ${isBn ? 'নীতিমালা ও স্বচ্ছতা' : 'Policies & Transparency'}
                </div>
                <ul class="list-unstyled mb-0 d-flex flex-column gap-2">
                  <li>
                    <a href="/privacy-policy/" class="text-secondary-bd text-decoration-none fw-semibold">
                      <i class="bi bi-shield-check me-1"></i>${isBn ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
                    </a>
                  </li>
                  <li>
                    <a href="/terms-and-conditions/" class="text-secondary-bd text-decoration-none fw-semibold">
                      <i class="bi bi-journal-check me-1"></i>${isBn ? 'ব্যবহারের শর্তাবলী (Terms)' : 'Terms & Conditions'}
                    </a>
                  </li>
                  <li>
                    <a href="/contact/" class="text-secondary-bd text-decoration-none fw-semibold">
                      <i class="bi bi-chat-dots me-1"></i>${isBn ? 'যোগাযোগ পাতা' : 'Contact Form'}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// 2. CONTACT PAGE (/contact/)
// ============================================================================
export function renderContactPage(props: ContactPageProps): string {
  const { lang, contactEmail, formState } = props;
  const isBn = lang === 'bn';

  const breadcrumbs = renderBreadcrumbs([
    { labelBn: 'যোগাযোগ', labelEn: 'Contact Us' }
  ], lang);

  const quickSubjects = isBn
    ? ['দর্শনীয় স্থানের তথ্য সংশোধন', 'ভ্রমণ নির্দেশিকা পরামর্শ', 'সাধারণ জিজ্ঞাসা', 'কারিগরি সহায়তা']
    : ['Destination Information Correction', 'Travel Guide Inquiry', 'General Question', 'Technical Issue'];

  return `
    <div class="bg-light-subtle pb-5">
      <div class="bg-white border-bottom py-2">
        <div class="container">
          ${breadcrumbs}
        </div>
      </div>
      <div class="bg-primary-bd text-white py-5 mb-4">
        <div class="container py-2">
          <span class="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill mb-3">
            <i class="bi bi-envelope-paper-fill me-1"></i>
            ${isBn ? 'যোগাযোগ ও মতামত' : 'Contact & Editorial Desk'}
          </span>
          <h1 class="display-5 fw-bold text-white mb-2">
            ${isBn ? 'আমাদের সাথে যোগাযোগ করুন' : 'Get in Touch with Our Team'}
          </h1>
          <p class="lead text-white-50 mb-0" style="max-width: 760px;">
            ${isBn
              ? 'ভ্রমণ সংক্রান্ত কোনো প্রশ্ন, দর্শনীয় স্থানের তথ্য হালনাগাদ, কিংবা পোর্টাল সম্পর্কে আপনার মূল্যবান মতামত জানাতে নিচের নিরাপদ ফর্মটি পূরণ করুন।'
              : 'Have a travel question, destination update, editorial correction, or partnership inquiry? Send us a message securely using the form below.'}
          </p>
        </div>
      </div>

      <div class="container">
        <div class="row g-4">
          <!-- Contact Form Column -->
          <div class="col-lg-7">
            <div class="card border-0 shadow-sm rounded-4 p-4 p-lg-5 bg-white">
              <h2 class="h4 fw-bold text-primary-bd mb-1">
                ${isBn ? 'বার্তা প্রেরণ ফর্ম' : 'Send a Message'}
              </h2>
              <p class="small text-secondary mb-4">
                ${isBn
                  ? 'আপনার বার্তা নিরাপদ সার্ভার এন্ডপয়েন্টের মাধ্যমে প্রেরিত হয়। তারকাচিহ্নিত (*) ঘরগুলো পূরণ করা বাধ্যতামূলক।'
                  : 'All submissions are validated and routed securely through our backend service. Fields marked with (*) are required.'}
              </p>

              ${formState.submittedReferenceId ? `
                <div class="alert alert-success border-0 rounded-4 p-4 mb-4 shadow-sm" id="contact-success-box" role="status" aria-live="polite">
                  <div class="d-flex align-items-start gap-3">
                    <i class="bi bi-check-circle-fill fs-2 text-success flex-shrink-0"></i>
                    <div>
                      <h3 class="h5 fw-bold text-success-emphasis mb-1">
                        ${isBn ? 'আপনার বার্তাটি সফলভাবে গৃহীত হয়েছে!' : 'Message Sent Successfully!'}
                      </h3>
                      <p class="small mb-2 text-dark">
                        ${escapeHtml(formState.submittedMessage || (isBn ? 'আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।' : 'Our team will review your inquiry and reply soon.'))}
                      </p>
                      <div class="d-inline-block px-3 py-1 rounded bg-white border small fw-semibold text-primary-bd mb-3">
                        ${isBn ? 'রেফারেন্স আইডি:' : 'Reference ID:'} <code>${escapeHtml(formState.submittedReferenceId)}</code>
                      </div>
                      <div>
                        <button type="button" class="btn btn-outline-success btn-sm rounded-pill px-3" id="contact-reset-success-btn">
                          <i class="bi bi-plus-circle me-1"></i>${isBn ? 'আরেকটি বার্তা পাঠান' : 'Send Another Message'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              ${formState.errorMessage ? `
                <div class="alert alert-danger border-0 rounded-4 p-3 mb-4 d-flex align-items-start gap-2" id="contact-error-box" role="alert">
                  <i class="bi bi-exclamation-octagon-fill fs-5 mt-1 flex-shrink-0"></i>
                  <div>
                    <div class="fw-bold small">${isBn ? 'বার্তা পাঠাতে সমস্যা হয়েছে' : 'Submission Failed'}</div>
                    <div class="small">${escapeHtml(formState.errorMessage)}</div>
                  </div>
                </div>
              ` : ''}

              <form id="contact-form" novalidate class="${formState.submittedReferenceId ? 'd-none' : ''}">
                <!-- Honeypot field for bot mitigation (hidden visually & from assistive tech) -->
                <div class="position-absolute overflow-hidden" style="width: 1px; height: 1px; opacity: 0; pointer-events: none;" aria-hidden="true">
                  <label for="contact-website">Website</label>
                  <input type="text" id="contact-website" name="website" tabindex="-1" autocomplete="off" value="">
                </div>

                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="contact-name" class="form-label fw-semibold small text-primary-bd">
                      ${isBn ? 'আপনার নাম' : 'Full Name'} <span class="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      class="form-control ${formState.fieldErrors.name ? 'is-invalid' : ''}"
                      value="${escapeHtml(formState.name)}"
                      placeholder="${isBn ? 'যেমন: রফিকুল ইসলাম' : 'e.g. Rafiqul Islam'}"
                      minlength="2"
                      maxlength="120"
                      required
                      aria-describedby="contact-name-error"
                    >
                    <div id="contact-name-error" class="invalid-feedback">
                      ${escapeHtml(formState.fieldErrors.name || '')}
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="contact-email" class="form-label fw-semibold small text-primary-bd">
                      ${isBn ? 'ইমেইল ঠিকানা' : 'Email Address'} <span class="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      name="email"
                      class="form-control ${formState.fieldErrors.email ? 'is-invalid' : ''}"
                      value="${escapeHtml(formState.email)}"
                      placeholder="name@example.com"
                      maxlength="180"
                      required
                      aria-describedby="contact-email-error"
                    >
                    <div id="contact-email-error" class="invalid-feedback">
                      ${escapeHtml(formState.fieldErrors.email || '')}
                    </div>
                  </div>

                  <div class="col-12">
                    <label for="contact-subject" class="form-label fw-semibold small text-primary-bd">
                      ${isBn ? 'বিষয়' : 'Subject'} <span class="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="contact-subject"
                      name="subject"
                      class="form-control ${formState.fieldErrors.subject ? 'is-invalid' : ''}"
                      value="${escapeHtml(formState.subject)}"
                      placeholder="${isBn ? 'আপনার বার্তার মূল বিষয় লিখুন...' : 'Brief subject of your inquiry...'}"
                      minlength="3"
                      maxlength="180"
                      required
                      aria-describedby="contact-subject-error"
                    >
                    <div id="contact-subject-error" class="invalid-feedback">
                      ${escapeHtml(formState.fieldErrors.subject || '')}
                    </div>
                    <div class="d-flex flex-wrap gap-1 mt-2">
                      ${quickSubjects.map(subj => `
                        <button type="button" class="btn btn-light btn-sm border text-secondary contact-subject-chip" data-subject="${escapeHtml(subj)}" style="font-size: 0.78rem;">
                          ${escapeHtml(subj)}
                        </button>
                      `).join('')}
                    </div>
                  </div>

                  <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <label for="contact-message" class="form-label fw-semibold small text-primary-bd mb-0">
                        ${isBn ? 'বিস্তারিত বার্তা' : 'Message'} <span class="text-danger">*</span>
                      </label>
                      <small class="text-muted" id="contact-char-count">${formState.message.length} / 4000</small>
                    </div>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows="6"
                      class="form-control ${formState.fieldErrors.message ? 'is-invalid' : ''}"
                      placeholder="${isBn ? 'গন্তব্যের নাম, প্রশ্ন বা পরামর্শ বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)...' : 'Write your travel question, destination update, or feedback (at least 10 characters)...'}"
                      minlength="10"
                      maxlength="4000"
                      required
                      aria-describedby="contact-message-error"
                    >${escapeHtml(formState.message)}</textarea>
                    <div id="contact-message-error" class="invalid-feedback">
                      ${escapeHtml(formState.fieldErrors.message || '')}
                    </div>
                  </div>

                  <div class="col-12">
                    <div class="small text-muted mb-3">
                      <i class="bi bi-shield-lock me-1 text-success"></i>
                      ${isBn
                        ? 'এই ফর্মটি ব্যবহার করার মাধ্যমে আপনি আমাদের '
                        : 'By submitting this form, you acknowledge our '}
                      <a href="/privacy-policy/" class="text-secondary-bd fw-semibold">${isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</a>.
                    </div>
                    <button
                      type="submit"
                      id="contact-submit-btn"
                      class="btn btn-accent btn-lg rounded-pill px-5 fw-semibold"
                      ${formState.isSubmitting ? 'disabled' : ''}
                    >
                      ${formState.isSubmitting
                        ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${isBn ? 'পাঠানো হচ্ছে...' : 'Sending Message...'}`
                        : `<i class="bi bi-send-fill me-2"></i>${isBn ? 'বার্তা পাঠান' : 'Send Message'}`}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Contact Information Sidebar -->
          <div class="col-lg-5">
            <div class="d-flex flex-column gap-4">
              <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h2 class="h5 fw-bold text-primary-bd mb-3">
                  <i class="bi bi-building text-warning me-2"></i>
                  ${isBn ? 'অফিসিয়াল যোগাযোগ ঠিকানা' : 'Official Contact Information'}
                </h2>
                <ul class="list-unstyled d-flex flex-column gap-3 mb-0 small text-secondary">
                  <li class="d-flex gap-3">
                    <i class="bi bi-geo-alt-fill text-success fs-5 flex-shrink-0"></i>
                    <div>
                      <strong class="text-primary-bd d-block">${isBn ? 'কার্যালয়' : 'Office Address'}</strong>
                      ${isBn
                        ? 'পর্যটন ভবন, প্লট ই-৫/সি-১, আগারগাঁও, শেরেবাংলা নগর, ঢাকা-১২০৭, বাংলাদেশ'
                        : 'Tourism Bhaban, Plot E-5/C-1, Agargaon, Sher-e-Bangla Nagar, Dhaka-1207, Bangladesh'}
                    </div>
                  </li>
                  <li class="d-flex gap-3">
                    <i class="bi bi-envelope-fill text-success fs-5 flex-shrink-0"></i>
                    <div>
                      <strong class="text-primary-bd d-block">${isBn ? 'ইমেইল' : 'Email'}</strong>
                      <a href="mailto:${escapeHtml(contactEmail)}" class="text-secondary-bd fw-semibold text-decoration-none">${escapeHtml(contactEmail)}</a>
                    </div>
                  </li>
                  <li class="d-flex gap-3">
                    <i class="bi bi-clock-fill text-success fs-5 flex-shrink-0"></i>
                    <div>
                      <strong class="text-primary-bd d-block">${isBn ? 'অফিস সময়সূচি' : 'Editorial Hours'}</strong>
                      ${isBn ? 'রবিবার – বৃহস্পতিবার (সকাল ৯:০০ – বিকাল ৫:০০ BST)' : 'Sunday – Thursday (9:00 AM – 5:00 PM BST)'}
                    </div>
                  </li>
                </ul>
              </div>

              <div class="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-4 border-danger">
                <h3 class="h6 fw-bold text-danger mb-2">
                  <i class="bi bi-shield-exclamation me-2"></i>
                  ${isBn ? 'জরুরি পর্যটক সহায়তা হটলাইন' : 'Emergency Traveler Helplines'}
                </h3>
                <p class="small text-secondary mb-3">
                  ${isBn
                    ? 'ভ্রমণকালে তাৎক্ষণিক নিরাপত্তা বা জরুরি সাহায্যের জন্য সরাসরি সরকারি হেল্পলাইনে কল করুন:'
                    : 'For urgent field safety or travel assistance inside Bangladesh, contact official hotlines directly:'}
                </p>
                <div class="d-flex flex-column gap-2 small">
                  <div class="p-2 rounded bg-light border d-flex justify-content-between">
                    <span class="fw-semibold">${isBn ? 'জাতীয় জরুরি সেবা' : 'National Emergency'}</span>
                    <span class="fw-bold text-danger">999</span>
                  </div>
                  <div class="p-2 rounded bg-light border d-flex justify-content-between">
                    <span class="fw-semibold">${isBn ? 'ট্যুরিস্ট পুলিশ বাংলাদেশ' : 'Tourist Police Helpline'}</span>
                    <span class="fw-bold text-primary-bd">01320-163599</span>
                  </div>
                  <div class="p-2 rounded bg-light border d-flex justify-content-between">
                    <span class="fw-semibold">${isBn ? 'সরকারি তথ্য বাতায়ন' : 'National Info Helpline'}</span>
                    <span class="fw-bold text-primary-bd">333</span>
                  </div>
                </div>
              </div>

              <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h3 class="h6 fw-bold text-primary-bd mb-2">
                  <i class="bi bi-compass text-warning me-2"></i>
                  ${isBn ? 'সম্পর্কিত তথ্য ও নীতিমালা' : 'Helpful Portal Pages'}
                </h3>
                <div class="d-flex flex-wrap gap-2">
                  <a href="/about/" class="btn btn-outline-bd btn-sm rounded-pill px-3">${isBn ? 'আমাদের সম্পর্কে' : 'About Us'}</a>
                  <a href="/privacy-policy/" class="btn btn-outline-bd btn-sm rounded-pill px-3">${isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</a>
                  <a href="/terms-and-conditions/" class="btn btn-outline-bd btn-sm rounded-pill px-3">${isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms & Conditions'}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// 3 & 4. EDITABLE LEGAL PAGES (/privacy-policy/ & /terms-and-conditions/)
// ============================================================================
export function renderLegalDocumentPage(props: LegalDocumentPageProps): string {
  const { lang, docType, legalPages } = props;
  const isBn = lang === 'bn';
  const isPrivacy = docType === 'privacy';

  const pageTitle = isPrivacy
    ? (isBn ? legalPages.privacy_title_bn : legalPages.privacy_title_en)
    : (isBn ? legalPages.terms_title_bn : legalPages.terms_title_en);

  const rawMarkdown = isPrivacy
    ? (isBn ? legalPages.privacy_content_bn : legalPages.privacy_content_en)
    : (isBn ? legalPages.terms_content_bn : legalPages.terms_content_en);

  const isReviewed = isPrivacy ? legalPages.privacy_reviewed : legalPages.terms_reviewed;
  const reviewedBy = isPrivacy ? legalPages.privacy_reviewed_by : legalPages.terms_reviewed_by;
  const reviewedAt = isPrivacy ? legalPages.privacy_reviewed_at : legalPages.terms_reviewed_at;

  const parsed = parseSafeArticleContent(rawMarkdown);
  const formattedUpdated = formatIsoDate(legalPages.updated_at, lang);
  const formattedReviewedDate = reviewedAt ? formatIsoDate(reviewedAt, lang) : '';

  const breadcrumbs = renderBreadcrumbs([
    {
      labelBn: isPrivacy ? 'গোপনীয়তা নীতি' : 'ব্যবহারের শর্তাবলী',
      labelEn: isPrivacy ? 'Privacy Policy' : 'Terms and Conditions'
    }
  ], lang);

  return `
    <div class="bg-light-subtle pb-5">
      <div class="bg-white border-bottom py-2">
        <div class="container">
          ${breadcrumbs}
        </div>
      </div>
      <div class="bg-primary-bd text-white py-5 mb-4">
        <div class="container py-2">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span class="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill">
              <i class="bi ${isPrivacy ? 'bi-shield-check' : 'bi-file-earmark-text'} me-1"></i>
              ${isBn ? 'আইনি নথি ও নীতিমালা' : 'Legal & Policy Documentation'}
            </span>
            <span class="badge ${isReviewed ? 'bg-success text-white' : 'bg-danger-subtle text-danger-emphasis'} px-3 py-2 rounded-pill">
              <i class="bi ${isReviewed ? 'bi-patch-check-fill' : 'bi-exclamation-triangle-fill'} me-1"></i>
              ${isReviewed
                ? (isBn ? 'পর্যালোচিত ও অনুমোদিত' : 'Reviewed for Publication')
                : (isBn ? 'প্রকাশ-পূর্ব আইনি পর্যালোচনা প্রয়োজন' : 'Requires Legal Review Before Publication')}
            </span>
          </div>

          <h1 class="display-5 fw-bold text-white mb-2">${escapeHtml(pageTitle)}</h1>
          <div class="d-flex flex-wrap align-items-center gap-3 small text-white-50">
            <span>
              <i class="bi bi-calendar3 me-1 text-warning"></i>
              ${isBn ? 'সর্বশেষ হালনাগাদ:' : 'Last Updated:'} ${escapeHtml(formattedUpdated)}
            </span>
            ${isReviewed && reviewedBy ? `
              <span>
                <i class="bi bi-person-check me-1 text-warning"></i>
                ${isBn ? 'পর্যালোচক:' : 'Reviewed by:'} ${escapeHtml(reviewedBy)}${formattedReviewedDate ? ` (${escapeHtml(formattedReviewedDate)})` : ''}
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Pre-publication review banner & editorial controls -->
        ${!isReviewed ? `
          <div class="alert alert-warning border border-warning-subtle shadow-sm rounded-4 p-4 mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3" role="note">
            <div class="d-flex align-items-start gap-3">
              <i class="bi bi-exclamation-triangle-fill fs-3 text-warning-emphasis flex-shrink-0"></i>
              <div>
                <h2 class="h6 fw-bold text-dark mb-1">
                  ${isBn ? 'প্রকাশ-পূর্ব আইনি পর্যালোচনা নোটিশ' : 'Pre-Publication Legal Review Notice'}
                </h2>
                <p class="small text-dark mb-0">
                  ${isBn
                    ? 'এই আইনি পাতাটি খসড়া টেমপ্লেট হিসেবে সংরক্ষিত এবং সিএমএস থেকে সম্পূর্ণ সম্পাদনাযোগ্য। আনুষ্ঠানিকভাবে প্রকাশের পূর্বে একজন অনুমোদিত আইনজীবী বা নীতিনির্ধারকের মাধ্যমে বিষয়বস্তু যাচাই করে অনুমোদন করুন।'
                    : 'This legal document is currently a structured draft and is fully editable via the CMS. It should be reviewed and approved by an authorized legal or compliance reviewer prior to formal publication.'}
                </p>
              </div>
            </div>
            <button type="button" class="btn btn-dark btn-sm rounded-pill px-4 text-nowrap legal-edit-trigger" data-legal-doc="${docType}">
              <i class="bi bi-pencil-square me-1"></i>${isBn ? 'সম্পাদনা ও পর্যালোচনা করুন' : 'Edit & Review'}
            </button>
          </div>
        ` : ''}

        <div class="row g-4">
          <!-- Main Legal Content -->
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm rounded-4 p-4 p-lg-5 bg-white">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-4 border-bottom">
                <div class="small text-muted">
                  <i class="bi bi-translate me-1 text-primary-bd"></i>
                  ${isBn ? 'ভাষা: বাংলা (স্বয়ংক্রিয়ভাবে ইংরেজিতেও পরিবর্তনযোগ্য)' : 'Language: English (Bilingual Bengali version available)'}
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <button type="button" class="btn btn-outline-bd btn-sm rounded-pill px-3 legal-edit-trigger" data-legal-doc="${docType}">
                    <i class="bi bi-pencil-square me-1"></i>${isBn ? 'সিএমএস-এ সম্পাদনা' : 'Edit in CMS'}
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3" id="legal-copy-url-btn">
                    <i class="bi bi-link-45deg me-1"></i>${isBn ? 'লিংক কপি' : 'Copy Link'}
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3" id="legal-print-btn">
                    <i class="bi bi-printer me-1"></i>${isBn ? 'প্রিন্ট' : 'Print'}
                  </button>
                </div>
              </div>

              <article class="legal-document-body">
                ${parsed.html}
              </article>
            </div>
          </div>

          <!-- Sidebar Navigation & Quick Links -->
          <div class="col-lg-4">
            <div class="d-flex flex-column gap-4 sticky-lg-top" style="top: 90px;">
              ${parsed.toc.length > 0 ? `
                <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h2 class="h6 fw-bold text-primary-bd mb-3">
                    <i class="bi bi-list-ul text-warning me-2"></i>
                    ${isBn ? 'নথির সূচিপত্র' : 'Document Contents'}
                  </h2>
                  <nav aria-label="${isBn ? 'নথির সূচিপত্র' : 'Table of contents'}">
                    <ul class="list-unstyled d-flex flex-column gap-2 mb-0 small">
                      ${parsed.toc.map(item => `
                        <li>
                          <a href="#${escapeHtml(item.id)}" class="text-secondary-bd text-decoration-none legal-toc-link d-flex align-items-start gap-2">
                            <i class="bi bi-chevron-right small mt-1"></i>
                            <span>${escapeHtml(item.text)}</span>
                          </a>
                        </li>
                      `).join('')}
                    </ul>
                  </nav>
                </div>
              ` : ''}

              <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h2 class="h6 fw-bold text-primary-bd mb-3">
                  <i class="bi bi-folder2-open text-warning me-2"></i>
                  ${isBn ? 'অন্যান্য গুরুত্বপূর্ণ পাতা' : 'Related Portal Pages'}
                </h2>
                <div class="d-flex flex-column gap-2 small">
                  <a href="${isPrivacy ? '/terms-and-conditions/' : '/privacy-policy/'}" class="btn btn-light border text-start fw-semibold text-primary-bd">
                    <i class="bi ${isPrivacy ? 'bi-journal-check' : 'bi-shield-check'} me-2 text-success"></i>
                    ${isPrivacy
                      ? (isBn ? 'ব্যবহারের শর্তাবলী পড়ুন' : 'Read Terms & Conditions')
                      : (isBn ? 'গোপনীয়তা নীতি পড়ুন' : 'Read Privacy Policy')}
                  </a>
                  <a href="/about/" class="btn btn-light border text-start fw-semibold text-primary-bd">
                    <i class="bi bi-info-circle me-2 text-success"></i>
                    ${isBn ? 'আমাদের সম্পর্কে' : 'About Beautiful Bangladesh'}
                  </a>
                  <a href="/contact/" class="btn btn-light border text-start fw-semibold text-primary-bd">
                    <i class="bi bi-envelope me-2 text-success"></i>
                    ${isBn ? 'যোগাযোগ ও প্রশ্ন পাঠান' : 'Contact Our Team'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderPrivacyPolicyPage(props: Omit<LegalDocumentPageProps, 'docType'>): string {
  return renderLegalDocumentPage({ ...props, docType: 'privacy' });
}

export function renderTermsAndConditionsPage(props: Omit<LegalDocumentPageProps, 'docType'>): string {
  return renderLegalDocumentPage({ ...props, docType: 'terms' });
}
