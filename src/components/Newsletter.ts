/**
 * Reusable Newsletter Subscription Component
 * Form validation, Firestore subscription registration, and responsive design
 */

import { Language } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';

export function renderNewsletter(lang: Language): string {
  const isBn = lang === 'bn';
  const heading = isBn 
    ? 'বাংলাদেশের পর্যটন আপডেট ও ভ্রমণ টিপস পেতে সাবস্ক্রাইব করুন' 
    : 'Subscribe for Bangladesh Travel Guides & Destination Updates';
  const subheading = isBn
    ? 'নতুন দর্শনীয় স্থান, ট্রাভেল অফার এবং মৌসুমী ভ্রমণ নির্দেশিকা সরাসরি আপনার ইনবক্সে পান।'
    : 'Get seasonal itineraries, hidden gem alerts, and official travel tips delivered straight to your inbox.';
  const placeholder = isBn ? 'আপনার ইমেইল ঠিকানা লিখুন...' : 'Enter your email address...';
  const buttonText = isBn ? 'সাবস্ক্রাইব করুন' : 'Subscribe Now';
  const privacyNote = isBn 
    ? 'আমরা আপনার গোপনীয়তা রক্ষা করি। কোনো স্প্যাম পাঠানো হবে না।' 
    : 'We respect your privacy. Unsubscribe at any time. No spam ever.';

  return `
    <section class="container my-5" id="newsletter-section">
      <div class="newsletter-card p-4 p-md-5 rounded-4 shadow-sm position-relative overflow-hidden text-white" style="background: linear-gradient(135deg, #123C32 0%, #1C5948 60%, #174235 100%);">
        <!-- Decorative Background Circle -->
        <div class="position-absolute end-0 top-0 translate-middle-y rounded-circle d-none d-md-block pointer-events-none" style="width: 380px; height: 380px; background: radial-gradient(circle, rgba(217,164,65,0.15) 0%, transparent 70%);"></div>

        <div class="row align-items-center g-4 position-relative" style="z-index: 2;">
          <div class="col-lg-6">
            <span class="badge bg-warning text-dark px-3 py-1 rounded-pill mb-2 fw-semibold">
              <i class="bi bi-envelope-heart-fill me-1"></i>${isBn ? 'সংযুক্ত থাকুন' : 'Stay Connected'}
            </span>
            <h2 class="fw-bold mb-2">${escapeHtml(heading)}</h2>
            <p class="text-white-50 mb-0">${escapeHtml(subheading)}</p>
          </div>

          <div class="col-lg-6">
            <form id="newsletter-form" class="newsletter-form-wrapper" novalidate>
              <div class="input-group input-group-lg shadow-sm">
                <span class="input-group-text bg-white border-0 text-muted ps-3">
                  <i class="bi bi-envelope"></i>
                </span>
                <input 
                  type="email" 
                  class="form-control border-0 py-3" 
                  id="newsletter-email-input" 
                  placeholder="${escapeHtml(placeholder)}" 
                  required
                  aria-label="${isBn ? 'ইমেইল ঠিকানা' : 'Email address'}"
                >
                <button class="btn btn-accent px-4 fw-bold text-dark" type="submit" id="newsletter-submit-btn">
                  <span id="newsletter-btn-text">${escapeHtml(buttonText)}</span>
                  <span id="newsletter-btn-spinner" class="spinner-border spinner-border-sm ms-2 d-none" aria-hidden="true"></span>
                </button>
              </div>
              <div id="newsletter-feedback-msg" class="small mt-2" style="min-height: 22px;" role="status" aria-live="polite"></div>
              <div class="small text-white-50 mt-1 d-flex align-items-center gap-1">
                <i class="bi bi-shield-check text-warning"></i>
                <span>${escapeHtml(privacyNote)}</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;
}
