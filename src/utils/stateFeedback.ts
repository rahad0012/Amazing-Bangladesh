/**
 * State Feedback Components & Utilities
 * Reusable Loading States, Empty States, Error States, and Toast Notifications
 */

import { Language } from './langUtils';
import { escapeHtml } from './formatUtils';

export function renderLoadingSpinner(message?: string): string {
  return `
    <div class="text-center py-5 my-4" role="status" aria-live="polite">
      <div class="spinner-border text-success" style="width: 3rem; height: 3rem;" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      ${message ? `<p class="text-muted mt-3 fw-medium">${escapeHtml(message)}</p>` : ''}
    </div>
  `;
}

export function renderEmptyState(options: {
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  actionTextBn?: string;
  actionTextEn?: string;
  actionId?: string;
  icon?: string;
  lang: Language;
}): string {
  const isBn = options.lang === 'bn';
  const icon = options.icon || 'bi-compass';

  return `
    <div class="text-center py-5 px-3 bg-white rounded-4 border my-4">
      <div class="mb-3 text-secondary" style="font-size: 3.5rem;">
        <i class="bi ${icon}"></i>
      </div>
      <h4 class="fw-bold text-primary-bd mb-2">
        ${escapeHtml(isBn ? options.titleBn : options.titleEn)}
      </h4>
      <p class="text-muted mx-auto mb-4" style="max-width: 480px;">
        ${escapeHtml(isBn ? options.descBn : options.descEn)}
      </p>
      ${options.actionTextBn && options.actionId ? `
        <button class="btn btn-outline-bd btn-sm px-4 py-2" id="${options.actionId}">
          ${escapeHtml(isBn ? options.actionTextBn : options.actionTextEn || options.actionTextBn)}
        </button>
      ` : ''}
    </div>
  `;
}

export function renderErrorState(options: {
  title?: string;
  message: string;
  retryActionId?: string;
  lang: Language;
}): string {
  const isBn = options.lang === 'bn';
  const defaultTitle = isBn ? 'একটি সমস্যা দেখা দিয়েছে' : 'Something went wrong';
  const retryLabel = isBn ? 'পুনরায় চেষ্টা করুন' : 'Try Again';

  return `
    <div class="p-4 rounded-4 border border-danger-subtle bg-danger-subtle text-danger my-4" role="alert">
      <div class="d-flex align-items-center gap-3">
        <i class="bi bi-exclamation-triangle-fill fs-3"></i>
        <div class="flex-grow-1">
          <h5 class="fw-bold mb-1">${escapeHtml(options.title || defaultTitle)}</h5>
          <p class="small mb-0 text-dark">${escapeHtml(options.message)}</p>
        </div>
        ${options.retryActionId ? `
          <button class="btn btn-danger btn-sm text-white" id="${options.retryActionId}">
            <i class="bi bi-arrow-clockwise me-1"></i>${retryLabel}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

export function showToastNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
  const container = document.getElementById('cmsToastContainer');
  if (!container) return;

  const toastId = 'toast_' + Date.now();
  const bgClass = type === 'success' ? 'bg-success text-white' :
                  type === 'error' ? 'bg-danger text-white' :
                  type === 'warning' ? 'bg-warning text-dark' : 'bg-primary text-white';

  const iconClass = type === 'success' ? 'bi-check-circle-fill' :
                    type === 'error' ? 'bi-x-circle-fill' :
                    type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${bgClass} border-0 shadow-lg mb-2`;
  toastEl.id = toastId;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="d-flex p-3">
      <div class="toast-body d-flex align-items-center gap-2 font-medium">
        <i class="bi ${iconClass} fs-5"></i>
        <span>${escapeHtml(message)}</span>
      </div>
      <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);
  const bootstrap = (window as any).bootstrap;
  if (bootstrap && bootstrap.Toast) {
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  } else {
    setTimeout(() => toastEl.remove(), 4000);
  }
}
