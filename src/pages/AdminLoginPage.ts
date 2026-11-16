/**
 * Secure Admin Login Page (/admin/login/)
 * Uses Firebase Email/Password Authentication + Trusted Backend Verification
 */

import type { Language } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';

export interface AdminLoginFeedback {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

export interface AdminLoginViewOptions {
  lang: Language;
  email: string;
  rememberSession: boolean;
  isSubmitting: boolean;
  showPassword: boolean;
  feedback: AdminLoginFeedback | null;
}

export function renderAdminLoginPage(options: AdminLoginViewOptions): string {
  const { lang, email, rememberSession, isSubmitting, showPassword, feedback } = options;
  const isBn = lang === 'bn';

  const brandTitle = isBn ? 'অপরূপ বাংলাদেশ' : 'Beautiful Bangladesh';
  const portalLabel = isBn ? 'অ্যাডমিনিস্ট্রেটর পোর্টাল' : 'Administrator Portal';
  const heading = isBn ? 'নিরাপদ অ্যাডমিন সাইন-ইন' : 'Secure Admin Sign In';
  const subheading = isBn
    ? 'বাংলাদেশ পর্যটন সিএমএস এবং ডাটাবেস ড্যাশবোর্ডে প্রবেশ করতে আপনার অনুমোদিত অ্যাডমিন ইমেইল ও পাসওয়ার্ড ব্যবহার করুন।'
    : 'Sign in with your authorized administrator email and password to manage divisions, districts, destinations, and travel guides.';

  const emailLabel = isBn ? 'অ্যাডমিন ইমেইল ঠিকানা' : 'Administrator Email';
  const emailPlaceholder = 'admin@example.com';
  const passwordLabel = isBn ? 'পাসওয়ার্ড' : 'Password';
  const passwordPlaceholder = isBn ? 'আপনার পাসওয়ার্ড লিখুন' : 'Enter your password';
  const showPwdLabel = showPassword
    ? (isBn ? 'পাসওয়ার্ড লুকান' : 'Hide password')
    : (isBn ? 'পাসওয়ার্ড দেখুন' : 'Show password');
  const rememberLabel = isBn ? 'এই ডিভাইসে সেশন মনে রাখুন' : 'Remember session on this device';
  const rememberHint = isBn
    ? 'শেয়ার্ড বা পাবলিক কম্পিউটার ব্যবহার করলে এটি আনচেক রাখুন।'
    : 'Leave unchecked on shared or public computers.';
  const submitLabel = isSubmitting
    ? (isBn ? 'পরিচয় যাচাই করা হচ্ছে...' : 'Verifying Credentials...')
    : (isBn ? 'অ্যাডমিন ড্যাশবোর্ডে লগইন করুন' : 'Sign In to Admin Dashboard');
  const backLabel = isBn ? 'পাবলিক পোর্টালে ফিরুন' : 'Back to Public Portal';
  const langToggleLabel = isBn ? 'English' : 'বাংলা';

  let alertClass = 'alert-danger';
  let alertIcon = 'bi-exclamation-octagon-fill';
  if (feedback?.type === 'warning') {
    alertClass = 'alert-warning';
    alertIcon = 'bi-clock-history';
  } else if (feedback?.type === 'info') {
    alertClass = 'alert-info';
    alertIcon = 'bi-info-circle-fill';
  } else if (feedback?.type === 'success') {
    alertClass = 'alert-success';
    alertIcon = 'bi-check-circle-fill';
  }

  return `
    <div class="admin-login-shell">
      <div class="admin-login-topbar">
        <div class="container d-flex justify-content-between align-items-center gap-3">
          <a href="/" class="admin-login-back-link text-decoration-none d-inline-flex align-items-center gap-2" id="admin-login-back-link">
            <i class="bi bi-arrow-left"></i>
            <span>${escapeHtml(backLabel)}</span>
          </a>

          <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-2" id="admin-login-lang-btn" aria-label="Switch Language">
            <i class="bi bi-translate"></i>
            <span>${escapeHtml(langToggleLabel)}</span>
          </button>
        </div>
      </div>

      <div class="container py-4 py-lg-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div class="admin-login-card row g-0 w-100 overflow-hidden">
          <!-- Brand & Security Panel -->
          <div class="col-lg-5 admin-login-brand-panel d-flex flex-column justify-content-between p-4 p-lg-5 text-white">
            <div>
              <a href="/" class="d-inline-flex align-items-center gap-3 text-decoration-none text-white mb-4" aria-label="${escapeHtml(brandTitle)}">
                <span class="admin-login-logo-mark">
                  <i class="bi bi-compass-fill"></i>
                </span>
                <div class="lh-sm">
                  <div class="fw-bold fs-4 text-white">${escapeHtml(brandTitle)}</div>
                  <div class="small text-white-50">${escapeHtml(portalLabel)}</div>
                </div>
              </a>

              <h1 class="h3 fw-bold text-white mt-2 mb-3">
                ${isBn ? 'অফিসিয়াল পর্যটন কন্টেন্ট ও ডাটাবেস নিয়ন্ত্রণ' : 'Official Tourism Content & Registry Control'}
              </h1>
              <p class="small text-white-50 lh-lg mb-4">
                ${isBn
                  ? 'এই সুরক্ষিত প্রবেশদ্বারটি শুধুমাত্র যাচাইকৃত অ্যাডমিনিস্ট্রেটরদের জন্য সংরক্ষিত। সকল অ্যাডমিন রুট এবং ডাটাবেস পরিবর্তন সার্ভার-সাইড ও ফায়ারবেস নিরাপত্তা নীতি দ্বারা সুরক্ষিত।'
                  : 'This protected gateway is restricted to verified administrators. All CMS routes and Firestore updates require verified server-side authorization.'}
              </p>
            </div>

            <div class="admin-login-security-notes pt-3 border-top border-white border-opacity-10">
              <div class="d-flex align-items-start gap-2 small text-white-50 mb-2">
                <i class="bi bi-shield-lock text-warning mt-1"></i>
                <span>${isBn ? 'ফায়ারবেস ইমেইল ও পাসওয়ার্ড প্রমাণীকরণ' : 'Firebase Email & Password authentication'}</span>
              </div>
              <div class="d-flex align-items-start gap-2 small text-white-50 mb-2">
                <i class="bi bi-patch-check text-warning mt-1"></i>
                <span>${isBn ? 'বিশ্বস্ত সার্ভার-সাইড অ্যাডমিন ভূমিকা যাচাইকরণ' : 'Trusted backend & custom-claim role verification'}</span>
              </div>
              <div class="d-flex align-items-start gap-2 small text-white-50">
                <i class="bi bi-clock text-warning mt-1"></i>
                <span>${isBn ? 'স্বয়ংক্রিয় সেশন মেয়াদোত্তীর্ণ সুরক্ষা' : 'Automatic session expiration & revocation checks'}</span>
              </div>
            </div>
          </div>

          <!-- Login Form Panel -->
          <div class="col-lg-7 bg-white p-4 p-sm-5 d-flex flex-column justify-content-center">
            <div class="mb-4">
              <div class="d-flex align-items-center gap-2 mb-2 d-lg-none">
                <span class="admin-login-logo-mark-sm">
                  <i class="bi bi-compass-fill"></i>
                </span>
                <span class="fw-bold text-primary-bd">${escapeHtml(brandTitle)}</span>
              </div>
              <h2 class="h4 fw-bold text-primary-bd mb-1">${escapeHtml(heading)}</h2>
              <p class="text-muted small mb-0">${escapeHtml(subheading)}</p>
            </div>

            ${feedback ? `
              <div class="alert ${alertClass} d-flex align-items-start gap-2 py-2 px-3 small mb-4" role="alert" id="admin-login-alert">
                <i class="bi ${alertIcon} mt-1 flex-shrink-0"></i>
                <div>${escapeHtml(feedback.message)}</div>
              </div>
            ` : `
              <div class="alert alert-danger d-none py-2 px-3 small mb-4" role="alert" id="admin-login-alert"></div>
            `}

            <form id="admin-login-form" novalidate>
              <div class="mb-3">
                <label for="admin-login-email" class="form-label fw-semibold small text-dark">
                  ${escapeHtml(emailLabel)} <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 text-muted">
                    <i class="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    class="form-control border-start-0 ps-0"
                    id="admin-login-email"
                    name="email"
                    value="${escapeHtml(email)}"
                    placeholder="${escapeHtml(emailPlaceholder)}"
                    autocomplete="email"
                    inputmode="email"
                    required
                    ${isSubmitting ? 'disabled' : ''}
                  />
                </div>
              </div>

              <div class="mb-3">
                <label for="admin-login-password" class="form-label fw-semibold small text-dark">
                  ${escapeHtml(passwordLabel)} <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 text-muted">
                    <i class="bi bi-key"></i>
                  </span>
                  <input
                    type="${showPassword ? 'text' : 'password'}"
                    class="form-control border-start-0 border-end-0 ps-0"
                    id="admin-login-password"
                    name="password"
                    placeholder="${escapeHtml(passwordPlaceholder)}"
                    autocomplete="current-password"
                    required
                    ${isSubmitting ? 'disabled' : ''}
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary border-start-0 bg-light text-muted"
                    id="admin-toggle-password"
                    aria-label="${escapeHtml(showPwdLabel)}"
                    aria-pressed="${showPassword ? 'true' : 'false'}"
                    title="${escapeHtml(showPwdLabel)}"
                    ${isSubmitting ? 'disabled' : ''}
                  >
                    <i class="bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}"></i>
                  </button>
                </div>
              </div>

              <div class="mb-4">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="admin-remember-session"
                    ${rememberSession ? 'checked' : ''}
                    ${isSubmitting ? 'disabled' : ''}
                  />
                  <label class="form-check-label small fw-medium text-dark" for="admin-remember-session">
                    ${escapeHtml(rememberLabel)}
                  </label>
                </div>
                <div class="form-text small text-muted ms-4">
                  ${escapeHtml(rememberHint)}
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-primary-bd w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                id="btn-admin-login-submit"
                ${isSubmitting ? 'disabled' : ''}
              >
                ${isSubmitting
                  ? `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`
                  : `<i class="bi bi-box-arrow-in-right"></i>`}
                <span>${escapeHtml(submitLabel)}</span>
              </button>

              <div class="d-flex align-items-center my-3">
                <hr class="flex-grow-1 m-0">
                <span class="px-2 small text-muted">${isBn ? 'অথবা' : 'OR'}</span>
                <hr class="flex-grow-1 m-0">
              </div>

              <button
                type="button"
                class="btn btn-outline-secondary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                id="btn-admin-google-login"
                ${isSubmitting ? 'disabled' : ''}
              >
                <i class="bi bi-google"></i>
                <span>${isBn ? 'গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করুন' : 'Sign in with Google'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderAdminVerifyingGate(lang: Language): string {
  const isBn = lang === 'bn';
  return `
    <div class="admin-login-shell d-flex align-items-center justify-content-center p-4">
      <div class="bg-white border rounded-4 p-4 p-sm-5 text-center shadow-sm" style="max-width: 440px; width: 100%;">
        <div class="spinner-border text-success mb-3" role="status" style="width: 2.5rem; height: 2.5rem;">
          <span class="visually-hidden">Verifying...</span>
        </div>
        <h2 class="h5 fw-bold text-primary-bd mb-2">
          ${isBn ? 'অ্যাডমিন সেশন যাচাই করা হচ্ছে...' : 'Verifying Administrator Session...'}
        </h2>
        <p class="small text-muted mb-0">
          ${isBn
            ? 'নিরাপদ প্রবেশাধিকার নিশ্চিত করতে আপনার পরিচয় ও অনুমতি পরীক্ষা করা হচ্ছে।'
            : 'Confirming authentication token and administrator privileges with the server.'}
        </p>
      </div>
    </div>
  `;
}
