/**
 * Reusable Footer Component
 * Emergency helplines, official links, system status, and bilingual copyright
 */

import { Language } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';

export function renderFooter(lang: Language): string {
  const isBn = lang === 'bn';

  return `
    <footer class="site-footer">
      <div class="container">
        <div class="row g-4 mb-4">
          <div class="col-lg-4 col-md-6">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="fs-3 text-warning"><i class="bi bi-compass-fill"></i></span>
              <h5 class="text-white mb-0 fw-bold" id="footer-brand-title">
                ${isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh'}
              </h5>
            </div>
            <p class="small text-white-50" id="footer-about-desc">
              ${isBn 
                ? 'অফিসিয়াল তথ্যভাণ্ডার যার মাধ্যমে দেশি ও বিদেশি পর্যটকরা বাংলাদেশের সমৃদ্ধ সংস্কৃতি, ঐতিহ্য এবং অনুপম প্রাকৃতিক রূপ স্বাচ্ছন্দ্যে ঘুরে দেখতে পারেন।' 
                : 'Official information platform for domestic and international travelers discovering the rich culture, heritage, and pristine landscapes of Bangladesh.'}
            </p>
            <div class="d-flex gap-2 flex-wrap">
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">৮ বিভাগ</span>
              <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">৬৪ জেলা</span>
              <span class="badge bg-light text-dark px-2 py-1">Bilingual / দ্বিভাষিক</span>
            </div>
          </div>

          <div class="col-lg-2 col-md-6">
            <h6 class="footer-heading" id="footer-nav-heading">
              ${isBn ? 'গুরুত্বপূর্ণ লিংক' : 'Quick Navigation'}
            </h6>
            <a href="#divisions" class="footer-link">${isBn ? '৮ প্রশাসনিক বিভাগ' : '8 Divisions'}</a>
            <a href="#districts" class="footer-link">${isBn ? '৬৪ জেলা নির্দেশিকা' : '64 Districts'}</a>
            <a href="#spots" class="footer-link">${isBn ? 'শীর্ষ দর্শনীয় স্থান' : 'Top Attractions'}</a>
            <a href="#guides" class="footer-link">${isBn ? 'ভ্রমণ ব্লগ ও টিপস' : 'Travel Guides'}</a>
            <a href="#planner" class="footer-link">${isBn ? 'ট্যুর প্ল্যানার' : 'Trip Planner'}</a>
          </div>

          <div class="col-lg-3 col-md-6">
            <h6 class="footer-heading" id="footer-emergency-title">
              ${isBn ? 'জরুরি হেল্পলাইন' : 'Emergency Helplines'}
            </h6>
            <div class="small mb-2 text-white-50">
              <i class="bi bi-telephone-fill text-warning me-2"></i>
              <span>${isBn ? 'জাতীয় জরুরি সেবা: ৯৯৯' : 'National Emergency: 999'}</span>
            </div>
            <div class="small mb-2 text-white-50">
              <i class="bi bi-shield-shaded text-warning me-2"></i>
              <span>${isBn ? 'ট্যুরিস্ট পুলিশ: ০১৩২০-১৬৩৫৯৯' : 'Tourist Police: 01320-163599'}</span>
            </div>
            <div class="small mb-2 text-white-50">
              <i class="bi bi-info-circle-fill text-warning me-2"></i>
              <span>${isBn ? 'সরকারি তথ্য সেবা: ৩৩৩' : 'Citizen Information: 333'}</span>
            </div>
            <div class="small text-white-50">
              <i class="bi bi-hospital-fill text-warning me-2"></i>
              <span>${isBn ? 'স্বাস্থ্য বাতায়ন: ১৬২৬৩' : 'Health Helpline: 16263'}</span>
            </div>
          </div>

          <div class="col-lg-3 col-md-6">
            <h6 class="footer-heading" id="footer-db-status-title">
              ${isBn ? 'সিস্টেম ও ডাটাবেস' : 'System & Cloud Storage'}
            </h6>
            <div class="p-3 rounded-3" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="spinner-grow spinner-grow-sm text-success" role="status"></span>
                <span class="small text-white fw-semibold">
                  ${isBn ? 'ক্লাউড ফায়ারস্টোর সচল' : 'Cloud Firestore Active'}
                </span>
              </div>
              <p class="small text-white-50 mb-0" style="font-size: 0.8rem;">
                Database ID: ai-studio-bangladeshtouris
              </p>
            </div>
          </div>
        </div>

        <hr class="border-secondary my-4">

        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-white-50">
          <div>
            ${isBn 
              ? '© ২০২৬ অপরূপ বাংলাদেশ। গণপ্রজাতন্ত্রী বাংলাদেশ পর্যটন পোর্টাল। সর্বস্বত্ব সংরক্ষিত।' 
              : '© 2026 Beautiful Bangladesh. Official Tourism Portal. All rights reserved.'}
          </div>
          <div>
            Built with HTML5, CSS3, Bootstrap 5, Vanilla TypeScript & Firebase
          </div>
        </div>
      </div>
    </footer>
  `;
}
