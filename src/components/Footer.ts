/**
 * Reusable Footer Component
 * Brand introduction, Quick links, Division links, Contact information,
 * Social media links, Privacy Policy modal trigger, and official copyright
 */

import { Language } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';

export function renderFooter(lang: Language): string {
  const isBn = lang === 'bn';

  return `
    <footer class="site-footer bg-dark text-white pt-5 pb-4 mt-5 border-top border-success-subtle">
      <div class="container">
        <div class="row g-4 mb-4">
          <!-- Col 1: Brand Introduction -->
          <div class="col-lg-4 col-md-6">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="fs-3 text-warning"><i class="bi bi-compass-fill" aria-hidden="true"></i></span>
              <h2 class="h5 text-white mb-0 fw-bold" id="footer-brand-title">
                ${isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh'}
              </h2>
            </div>
            <p class="small text-white-50 lh-base" id="footer-about-desc">
              ${isBn 
                ? 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের পর্যটন তথ্যভাণ্ডার। দেশের সমৃদ্ধ ঐতিহ্য, ৮টি প্রশাসনিক বিভাগ, ৬৪টি জেলা, ম্যানগ্রোভ বন, বিশ্বের দীর্ঘতম সমুদ্র সৈকত এবং পাহাড়ি উপত্যকার খাঁটি ভ্রমণ নির্দেশিকা।' 
                : 'Official tourism portal of Bangladesh. Your comprehensive gateway to exploring 8 administrative divisions, 64 districts, UNESCO World Heritage sites, and curated travel itineraries.'}
            </p>
            <div class="d-flex gap-2 flex-wrap mb-3">
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">৮ বিভাগ</span>
              <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">৬৪ জেলা</span>
              <span class="badge bg-light text-dark px-2 py-1">Bilingual / দ্বিভাষিক</span>
            </div>
            <!-- Social Media Links -->
            <div class="d-flex gap-3 align-items-center mt-3">
              <span class="small text-white-50">${isBn ? 'সোশ্যাল মিডিয়া:' : 'Follow Us:'}</span>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="text-warning fs-5 hover-lift" aria-label="Facebook">
                <i class="bi bi-facebook"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="text-warning fs-5 hover-lift" aria-label="Twitter / X">
                <i class="bi bi-twitter-x"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="text-warning fs-5 hover-lift" aria-label="Instagram">
                <i class="bi bi-instagram"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="text-warning fs-5 hover-lift" aria-label="YouTube">
                <i class="bi bi-youtube"></i>
              </a>
            </div>
          </div>

          <!-- Col 2: Quick Links -->
          <div class="col-lg-2 col-md-6 col-6">
            <h3 class="h6 footer-heading text-warning fw-bold mb-3">
              ${isBn ? 'গুরুত্বপূর্ণ লিংক' : 'Quick Links'}
            </h3>
            <ul class="list-unstyled d-flex flex-column gap-2 small">
              <li><a href="/" class="footer-link text-white-50 text-decoration-none" data-nav="home">${isBn ? 'মূলপাতা' : 'Home'}</a></li>
              <li><a href="/divisions/" class="footer-link text-white-50 text-decoration-none" data-nav="divisions">${isBn ? 'বিভাগসমূহ (৮)' : '8 Divisions'}</a></li>
              <li><a href="/districts/" class="footer-link text-white-50 text-decoration-none" data-nav="districts">${isBn ? '৬৪ জেলা গাইড' : '64 Districts'}</a></li>
              <li><a href="/places/" class="footer-link text-white-50 text-decoration-none" data-nav="spots">${isBn ? 'সকল দর্শনীয় স্থান' : 'All Destinations'}</a></li>
              <li><a href="/categories/" class="footer-link text-white-50 text-decoration-none" data-nav="categories">${isBn ? 'ক্যাটাগরি সমূহ' : 'Categories'}</a></li>
              <li><a href="/travel-guides/" class="footer-link text-white-50 text-decoration-none" data-nav="guides">${isBn ? 'ভ্রমণ নির্দেশিকা' : 'Travel Guides'}</a></li>
              <li><a href="/search/" class="footer-link text-white-50 text-decoration-none" data-nav="search">${isBn ? 'গ্লোবাল অনুসন্ধান' : 'Global Search'}</a></li>
              <li><a href="/about/" class="footer-link text-white-50 text-decoration-none">${isBn ? 'আমাদের সম্পর্কে' : 'About Us'}</a></li>
              <li><a href="/contact/" class="footer-link text-white-50 text-decoration-none">${isBn ? 'যোগাযোগ' : 'Contact Us'}</a></li>
            </ul>
          </div>

          <!-- Col 3: Division Links -->
          <div class="col-lg-2 col-md-6 col-6">
            <h3 class="h6 footer-heading text-warning fw-bold mb-3">
              ${isBn ? '৮ প্রশাসনিক বিভাগ' : '8 Divisions'}
            </h3>
            <ul class="list-unstyled d-flex flex-column gap-2 small">
              <li><a href="/divisions/dhaka/" class="footer-link text-white-50 text-decoration-none" data-division-slug="dhaka">${isBn ? 'ঢাকা বিভাগ' : 'Dhaka Division'}</a></li>
              <li><a href="/divisions/chattogram/" class="footer-link text-white-50 text-decoration-none" data-division-slug="chattogram">${isBn ? 'চট্টগ্রাম বিভাগ' : 'Chattogram Division'}</a></li>
              <li><a href="/divisions/sylhet/" class="footer-link text-white-50 text-decoration-none" data-division-slug="sylhet">${isBn ? 'সিলেট বিভাগ' : 'Sylhet Division'}</a></li>
              <li><a href="/divisions/khulna/" class="footer-link text-white-50 text-decoration-none" data-division-slug="khulna">${isBn ? 'খুলনা বিভাগ' : 'Khulna Division'}</a></li>
              <li><a href="/divisions/rajshahi/" class="footer-link text-white-50 text-decoration-none" data-division-slug="rajshahi">${isBn ? 'রাজশাহী বিভাগ' : 'Rajshahi Division'}</a></li>
              <li><a href="/divisions/barishal/" class="footer-link text-white-50 text-decoration-none" data-division-slug="barishal">${isBn ? 'বরিশাল বিভাগ' : 'Barishal Division'}</a></li>
              <li><a href="/divisions/rangpur/" class="footer-link text-white-50 text-decoration-none" data-division-slug="rangpur">${isBn ? 'রংপুর বিভাগ' : 'Rangpur Division'}</a></li>
              <li><a href="/divisions/mymensingh/" class="footer-link text-white-50 text-decoration-none" data-division-slug="mymensingh">${isBn ? 'ময়মনসিংহ বিভাগ' : 'Mymensingh Division'}</a></li>
            </ul>
          </div>

          <!-- Col 4: Contact Information & Emergency -->
          <div class="col-lg-4 col-md-6">
            <h3 class="h6 footer-heading text-warning fw-bold mb-3">
              ${isBn ? 'যোগাযোগ ও হেল্পলাইন' : 'Contact & Helplines'}
            </h3>
            <div class="small mb-2 text-white-50">
              <i class="bi bi-geo-alt-fill text-warning me-2"></i>
              <span>${isBn ? 'পর্যটন ভবন, প্লট ই-৫/সি-১, আগারগাঁও, ঢাকা-১২০৭' : 'Tourism Bhaban, Plot E-5/C-1, Agargaon, Dhaka-1207'}</span>
            </div>
            <div class="small mb-2 text-white-50">
              <i class="bi bi-envelope-fill text-warning me-2"></i>
              <a href="mailto:info@tourism.gov.bd" class="text-white-50 text-decoration-none">info@tourism.gov.bd</a>
            </div>
            <div class="small mb-2 text-white-50">
              <i class="bi bi-telephone-fill text-warning me-2"></i>
              <span>${isBn ? 'জাতীয় জরুরি সেবা: ৯৯৯' : 'National Emergency: 999'}</span>
            </div>
            <div class="small mb-2 text-white-50">
              <i class="bi bi-shield-shaded text-warning me-2"></i>
              <span>${isBn ? 'ট্যুরিস্ট পুলিশ হেল্পলাইন: ০১৩২০-১৬৩৫৯৯' : 'Tourist Police Helpline: 01320-163599'}</span>
            </div>
            <div class="mt-2">
              <a href="/contact/" class="btn btn-outline-warning btn-sm rounded-pill px-3">
                <i class="bi bi-chat-dots-fill me-1"></i>${isBn ? 'অনলাইন যোগাযোগ ফর্ম' : 'Send Us a Message'}
              </a>
            </div>

            <div class="p-2 rounded mt-3" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
              <div class="d-flex align-items-center gap-2">
                <span class="spinner-grow spinner-grow-sm text-success" aria-hidden="true"></span>
                <span class="small text-white fw-semibold">
                  ${isBn ? 'ক্লাউড ফায়ারস্টোর ডাটাবেস সচল' : 'Cloud Firestore Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-secondary my-4">

        <!-- Bottom Copyright & Legal Links -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 small text-white-50">
          <div>
            ${isBn 
              ? '© ২০২৬ অপরূপ বাংলাদেশ। গণপ্রজাতন্ত্রী বাংলাদেশ পর্যটন পোর্টাল। সর্বস্বত্ব সংরক্ষিত।' 
              : '© 2026 Beautiful Bangladesh. Official Tourism Portal. All rights reserved.'}
          </div>
          <div class="d-flex flex-wrap gap-3 align-items-center justify-content-center">
            <a href="/about/" class="footer-link text-white-50 text-decoration-none small" id="footer-about-link">
              ${isBn ? 'আমাদের সম্পর্কে' : 'About'}
            </a>
            <span>•</span>
            <a href="/contact/" class="footer-link text-white-50 text-decoration-none small" id="footer-contact-link">
              ${isBn ? 'যোগাযোগ' : 'Contact'}
            </a>
            <span>•</span>
            <a href="/privacy-policy/" class="footer-link text-white-50 text-decoration-none small" id="btn-privacy-policy">
              ${isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </a>
            <span>•</span>
            <a href="/terms-and-conditions/" class="footer-link text-white-50 text-decoration-none small" id="btn-terms-service">
              ${isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms & Conditions'}
            </a>
          </div>
        </div>
      </div>
    </footer>
  `;
}
