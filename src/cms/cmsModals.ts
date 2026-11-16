/**
 * CMS Reusable Form Modals & Field Validation
 * Modules 1-6 CRUD Forms with Shared Upload, SEO, Rich Text Preview, and Duplicate Prevention
 */

import {
  cmsStore,
  getMediaReferences,
  saveDivision,
  saveDistrict,
  saveCategory,
  saveTouristSpot,
  saveArticle,
  saveMediaItem,
  saveLegalPages,
  canWriteAdmin
} from './cmsState';
import { DEFAULT_LEGAL_PAGES, type LegalPagesConfig } from '../services/legalPagesDefaults';
import { escapeHtml } from '../utils/formatUtils';

import {
  ARTICLE_CATEGORIES,
  type Division,
  type District,
  type Category,
  type TouristSpot,
  type Article,
  type MediaItem
} from '../data/bangladeshData';

import { type Language } from '../i18n';
import { uploadImageFile, validateImageFile } from '../firebase';
import { showToast, generateSlug } from './cmsViews';

function getBsModal(id: string): any {
  const el = document.getElementById(id);
  if (!el) return null;
  const bs = (window as any).bootstrap;
  if (bs && bs.Modal) {
    return bs.Modal.getOrCreateInstance(el);
  }
  return null;
}

// ============================================================================
// Reusable Validation & Field Helpers
// ============================================================================

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120;
}

function isValidHttpUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidImageSourceUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  return isValidHttpUrl(url);
}

function showModalFormError(errorContainerId: string, message: string): void {
  const box = document.getElementById(errorContainerId);
  if (box) {
    box.classList.remove('d-none');
    box.innerHTML = `<i class="bi bi-exclamation-octagon-fill me-2"></i><span>${escapeHtml(message)}</span>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  showToast(message, 'error');
}

function clearModalFormError(errorContainerId: string): void {
  const box = document.getElementById(errorContainerId);
  if (box) {
    box.classList.add('d-none');
    box.innerHTML = '';
  }
}

function renderImageUploadFieldHtml(options: {
  idPrefix: string;
  label: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
}): string {
  const val = options.value || '';
  return `
    <label class="form-label fw-bold small text-primary-bd" for="${options.idPrefix}-img-url">
      ${escapeHtml(options.label)} ${options.required ? '<span class="text-danger">*</span>' : ''}
    </label>
    <div class="input-group">
      <input
        type="url"
        class="form-control"
        id="${options.idPrefix}-img-url"
        value="${escapeHtml(val)}"
        ${options.required ? 'required' : ''}
        placeholder="${escapeHtml(options.placeholder || 'https://images.unsplash.com/...')}"
      >
      <input
        type="file"
        id="${options.idPrefix}-file-input"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        class="d-none"
      >
      <button type="button" class="btn btn-outline-secondary" id="${options.idPrefix}-browse-btn">
        <i class="bi bi-upload me-1"></i>Upload File
      </button>
    </div>
    <div class="small text-muted mt-1">Allowed: JPEG, PNG, WEBP, GIF, SVG (Max 5MB)</div>
    <div id="${options.idPrefix}-img-preview" class="mt-2 ${val ? '' : 'd-none'}">
      ${val ? `<img src="${escapeHtml(val)}" class="rounded-2 border" style="max-height: 110px; max-width: 100%; object-fit: cover;" alt="Preview">` : ''}
    </div>
  `;
}

function bindImageUploadField(idPrefix: string, folder: string): void {
  const fileInput = document.getElementById(`${idPrefix}-file-input`) as HTMLInputElement | null;
  const browseBtn = document.getElementById(`${idPrefix}-browse-btn`) as HTMLButtonElement | null;
  const imgUrlInput = document.getElementById(`${idPrefix}-img-url`) as HTMLInputElement | null;
  const imgPreview = document.getElementById(`${idPrefix}-img-preview`);

  const updatePreview = (url: string) => {
    if (!imgPreview) return;
    if (url && isValidImageSourceUrl(url)) {
      imgPreview.classList.remove('d-none');
      imgPreview.innerHTML = `<img src="${escapeHtml(url)}" class="rounded-2 border" style="max-height: 110px; max-width: 100%; object-fit: cover;" alt="Preview">`;
    } else {
      imgPreview.classList.add('d-none');
      imgPreview.innerHTML = '';
    }
  };

  imgUrlInput?.addEventListener('input', () => {
    updatePreview(imgUrlInput.value.trim());
  });

  browseBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    if (!fileInput.files || !fileInput.files[0]) return;
    const file = fileInput.files[0];
    const check = validateImageFile(file);
    if (!check.valid) {
      showToast(check.error || 'Invalid image file.', 'error');
      fileInput.value = '';
      return;
    }

    try {
      if (browseBtn) {
        browseBtn.disabled = true;
        browseBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Uploading...';
      }
      const url = await uploadImageFile(file, folder);
      if (imgUrlInput) imgUrlInput.value = url;
      updatePreview(url);
      showToast('Image uploaded to Firebase Storage.', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Image upload failed.', 'error');
    } finally {
      if (browseBtn) {
        browseBtn.disabled = false;
        browseBtn.innerHTML = '<i class="bi bi-upload me-1"></i>Upload File';
      }
      fileInput.value = '';
    }
  });
}

function renderSeoFieldsHtml(options: {
  idPrefix: string;
  seo_title_en?: string;
  seo_title_bn?: string;
  seo_description_en?: string;
  seo_description_bn?: string;
  isBn: boolean;
}): string {
  const { idPrefix, isBn } = options;
  return `
    <div class="p-3 rounded-3 bg-light border">
      <h6 class="fw-bold text-primary-bd mb-2 small">
        <i class="bi bi-search me-1"></i>${isBn ? 'এসইও মেটাডাটা কনফিগারেশন (বাংলা ও ইংরেজি)' : 'SEO Metadata Configuration (EN & BN)'}
      </h6>
      <div class="row g-2">
        <div class="col-md-6">
          <label class="form-label small text-muted mb-1" for="${idPrefix}-seo-title-en">SEO Title (English)</label>
          <input type="text" class="form-control form-control-sm" id="${idPrefix}-seo-title-en" value="${escapeHtml(options.seo_title_en || '')}" maxlength="160" placeholder="Custom meta title in English">
        </div>
        <div class="col-md-6">
          <label class="form-label small text-muted mb-1" for="${idPrefix}-seo-title-bn">এসইও শিরোনাম (বাংলা)</label>
          <input type="text" class="form-control form-control-sm" id="${idPrefix}-seo-title-bn" value="${escapeHtml(options.seo_title_bn || '')}" maxlength="160" placeholder="বাংলা মেটা শিরোনাম">
        </div>
        <div class="col-md-6">
          <label class="form-label small text-muted mb-1" for="${idPrefix}-seo-desc-en">Meta Description (English)</label>
          <textarea class="form-control form-control-sm" id="${idPrefix}-seo-desc-en" rows="2" maxlength="320" placeholder="Concise search summary (max 160 chars recommended)">${escapeHtml(options.seo_description_en || '')}</textarea>
        </div>
        <div class="col-md-6">
          <label class="form-label small text-muted mb-1" for="${idPrefix}-seo-desc-bn">মেটা বিবরণ (বাংলা)</label>
          <textarea class="form-control form-control-sm" id="${idPrefix}-seo-desc-bn" rows="2" maxlength="320" placeholder="অনুসন্ধান ইঞ্জিনের জন্য সংক্ষিপ্ত বিবরণ">${escapeHtml(options.seo_description_bn || '')}</textarea>
        </div>
      </div>
    </div>
  `;
}

function readSeoFields(idPrefix: string): {
  seo_title_en?: string;
  seo_title_bn?: string;
  seo_description_en?: string;
  seo_description_bn?: string;
} {
  const titleEn = (document.getElementById(`${idPrefix}-seo-title-en`) as HTMLInputElement | null)?.value.trim() || '';
  const titleBn = (document.getElementById(`${idPrefix}-seo-title-bn`) as HTMLInputElement | null)?.value.trim() || '';
  const descEn = (document.getElementById(`${idPrefix}-seo-desc-en`) as HTMLTextAreaElement | null)?.value.trim() || '';
  const descBn = (document.getElementById(`${idPrefix}-seo-desc-bn`) as HTMLTextAreaElement | null)?.value.trim() || '';

  return {
    seo_title_en: titleEn || undefined,
    seo_title_bn: titleBn || undefined,
    seo_description_en: descEn || undefined,
    seo_description_bn: descBn || undefined
  };
}

function renderRichTextPreview(markdown: string): string {
  const escaped = escapeHtml(markdown || '');
  if (!escaped.trim()) {
    return '<p class="text-muted small mb-0">Nothing to preview yet.</p>';
  }
  const lines = escaped.split(/\r?\n/);
  const blocks: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) {
        blocks.push('</ul>');
        inList = false;
      }
      continue;
    }

    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    if (line.startsWith('### ')) {
      if (inList) { blocks.push('</ul>'); inList = false; }
      blocks.push(`<h6 class="fw-bold text-primary-bd mt-3 mb-1">${formatted.slice(4)}</h6>`);
    } else if (line.startsWith('## ')) {
      if (inList) { blocks.push('</ul>'); inList = false; }
      blocks.push(`<h5 class="fw-bold text-primary-bd mt-3 mb-2">${formatted.slice(3)}</h5>`);
    } else if (line.startsWith('&gt; ')) {
      if (inList) { blocks.push('</ul>'); inList = false; }
      blocks.push(`<blockquote class="border-start border-3 ps-3 text-muted fst-italic my-2">${formatted.slice(5)}</blockquote>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        blocks.push('<ul class="mb-2 ps-3">');
        inList = true;
      }
      blocks.push(`<li>${formatted.slice(2)}</li>`);
    } else {
      if (inList) { blocks.push('</ul>'); inList = false; }
      blocks.push(`<p class="mb-2">${formatted}</p>`);
    }
  }
  if (inList) blocks.push('</ul>');
  return blocks.join('');
}

// ============================================================================
// 1. Division Form Modal
// ============================================================================
export function openDivisionFormModal(division?: Division, lang: Language = 'bn', onSaved?: () => void): void {
  if (!canWriteAdmin()) return;
  const container = document.getElementById('cmsCrudModalContent');
  if (!container) return;

  const isEdit = !!division;
  const isBn = lang === 'bn';

  container.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold text-white mb-0">
        <i class="bi bi-grid-1x2 me-2 text-warning"></i>
        ${isEdit ? (isBn ? 'বিভাগ সম্পাদনা করুন' : 'Edit Division') : (isBn ? 'নতুন প্রশাসনিক বিভাগ যোগ করুন' : 'Add New Division')}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <form id="form-cms-division" novalidate>
      <div class="modal-body p-4" style="max-height: 72vh; overflow-y: auto;">
        <div id="div-form-error" class="alert alert-danger d-none small d-flex align-items-center mb-3" role="alert"></div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="div-name-en">
              English Name <span class="text-danger">*</span>
              <span class="bilingual-badge-en">English</span>
            </label>
            <input type="text" class="form-control" id="div-name-en" value="${escapeHtml(division?.name_en || '')}" required maxlength="100" placeholder="e.g. Sylhet">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="div-name-bn">
              বাংলা নাম <span class="text-danger">*</span>
              <span class="bilingual-badge-bn">বাংলা</span>
            </label>
            <input type="text" class="form-control" id="div-name-bn" value="${escapeHtml(division?.name_bn || '')}" required maxlength="100" placeholder="যেমন: সিলেট">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="div-slug">
              Unique Slug <span class="text-danger">*</span>
            </label>
            <input type="text" class="form-control font-mono" id="div-slug" value="${escapeHtml(division?.slug || '')}" required maxlength="120" placeholder="e.g. sylhet">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              Headquarters (EN / BN) <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <input type="text" class="form-control" id="div-hq-en" value="${escapeHtml(division?.headquarters_en || '')}" required placeholder="Sylhet">
              <input type="text" class="form-control" id="div-hq-bn" value="${escapeHtml(division?.headquarters_bn || '')}" required placeholder="সিলেট">
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="div-area">Area (sq km) <span class="text-danger">*</span></label>
            <input type="number" step="any" min="1" class="form-control" id="div-area" value="${division?.area_sq_km ?? 15000}" required>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="div-order">Display Order</label>
            <input type="number" min="1" class="form-control" id="div-order" value="${division?.order ?? (cmsStore.divisions.length + 1)}">
          </div>

          <div class="col-12">
            ${renderImageUploadFieldHtml({
              idPrefix: 'div',
              label: 'Cover Image URL (Optional)',
              value: division?.image_url,
              required: false
            })}
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd" for="div-desc-en">
              Description (English) <span class="text-danger">*</span>
              <span class="bilingual-badge-en">English</span>
            </label>
            <textarea class="form-control" id="div-desc-en" rows="2" required placeholder="Summary of division...">${escapeHtml(division?.description_en || '')}</textarea>
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd" for="div-desc-bn">
              বিবরণ (বাংলা) <span class="text-danger">*</span>
              <span class="bilingual-badge-bn">বাংলা</span>
            </label>
            <textarea class="form-control" id="div-desc-bn" rows="2" required placeholder="বিভাগের সংক্ষিপ্ত পরিচিতি...">${escapeHtml(division?.description_bn || '')}</textarea>
          </div>

          <div class="col-12">
            ${renderSeoFieldsHtml({
              idPrefix: 'div',
              seo_title_en: division?.seo_title_en,
              seo_title_bn: division?.seo_title_bn,
              seo_description_en: division?.seo_description_en,
              seo_description_bn: division?.seo_description_bn,
              isBn
            })}
          </div>

          <div class="col-12">
            <div class="form-check form-switch mt-2">
              <input class="form-check-input" type="checkbox" id="div-published" ${(!division || division.is_published) ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="div-published">Publish on Public Portal</label>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4" id="div-submit-btn">
          <i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Create Division'}
        </button>
      </div>
    </form>
  `;

  const nameEnInput = document.getElementById('div-name-en') as HTMLInputElement;
  const slugInput = document.getElementById('div-slug') as HTMLInputElement;
  nameEnInput?.addEventListener('input', () => {
    if (!isEdit && !slugInput.dataset.manual) {
      slugInput.value = generateSlug(nameEnInput.value);
    }
  });
  slugInput?.addEventListener('input', () => {
    slugInput.dataset.manual = 'true';
  });

  bindImageUploadField('div', 'divisions');

  const form = document.getElementById('form-cms-division');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalFormError('div-form-error');

    const nameEn = nameEnInput.value.trim();
    const nameBn = (document.getElementById('div-name-bn') as HTMLInputElement).value.trim();
    const slug = generateSlug(slugInput.value.trim());
    slugInput.value = slug;
    const hqEn = (document.getElementById('div-hq-en') as HTMLInputElement).value.trim();
    const hqBn = (document.getElementById('div-hq-bn') as HTMLInputElement).value.trim();
    const areaSqKm = parseFloat((document.getElementById('div-area') as HTMLInputElement).value);
    const orderVal = parseInt((document.getElementById('div-order') as HTMLInputElement).value, 10) || 1;
    const imgUrl = (document.getElementById('div-img-url') as HTMLInputElement).value.trim();
    const descEn = (document.getElementById('div-desc-en') as HTMLTextAreaElement).value.trim();
    const descBn = (document.getElementById('div-desc-bn') as HTMLTextAreaElement).value.trim();

    if (!nameEn || !nameBn || !hqEn || !hqBn || !descEn || !descBn) {
      showModalFormError('div-form-error', 'Please fill in all required Bengali and English fields.');
      return;
    }
    if (!isValidSlug(slug)) {
      showModalFormError('div-form-error', 'Slug must contain only lowercase letters, numbers, and hyphens.');
      return;
    }
    if (!Number.isFinite(areaSqKm) || areaSqKm <= 0) {
      showModalFormError('div-form-error', 'Area (sq km) must be a positive number.');
      return;
    }
    if (imgUrl && !isValidImageSourceUrl(imgUrl)) {
      showModalFormError('div-form-error', 'Please provide a valid cover image URL or leave it blank.');
      return;
    }

    const duplicateSlug = cmsStore.divisions.some(
      d => d.id !== division?.id && (d.slug.toLowerCase() === slug || d.id === `div_${slug}`)
    );
    if (duplicateSlug) {
      showModalFormError('div-form-error', `A division with slug "${slug}" already exists.`);
      return;
    }
    const duplicateName = cmsStore.divisions.some(
      d => d.id !== division?.id && d.name_en.trim().toLowerCase() === nameEn.toLowerCase()
    );
    if (duplicateName) {
      showModalFormError('div-form-error', `A division named "${nameEn}" already exists.`);
      return;
    }

    const divSeoFields = readSeoFields('div');

    const newDiv: Division = {
      id: division?.id || `div_${slug}`,
      name_en: nameEn,
      name_bn: nameBn,
      slug,
      headquarters_en: hqEn,
      headquarters_bn: hqBn,
      area_sq_km: areaSqKm,
      districts_count: division?.districts_count || cmsStore.districts.filter(d => d.division_id === (division?.id || `div_${slug}`)).length,
      order: orderVal,
      image_url: imgUrl,
      thumbnail_url: division?.thumbnail_url ?? imgUrl,
      description_en: descEn,
      description_bn: descBn,
      ...divSeoFields,
      is_published: (document.getElementById('div-published') as HTMLInputElement).checked,
      created_at: division?.created_at
    };

    const submitBtn = document.getElementById('div-submit-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
    }

    try {
      await saveDivision(newDiv);
      showToast(isEdit ? 'Division updated successfully!' : 'Division created successfully!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showModalFormError('div-form-error', err?.message || 'Error saving division.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Create Division'}`;
      }
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ============================================================================
// 2. District Form Modal
// ============================================================================
export function openDistrictFormModal(district?: District, lang: Language = 'bn', onSaved?: () => void): void {
  if (!canWriteAdmin()) return;
  const container = document.getElementById('cmsCrudModalContent');
  if (!container) return;

  const isEdit = !!district;
  const isBn = lang === 'bn';

  container.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold text-white mb-0">
        <i class="bi bi-geo-alt me-2 text-warning"></i>
        ${isEdit ? (isBn ? 'জেলা সম্পাদনা করুন' : 'Edit District') : (isBn ? 'নতুন জেলা যোগ করুন' : 'Add New District')}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <form id="form-cms-district" novalidate>
      <div class="modal-body p-4" style="max-height: 72vh; overflow-y: auto;">
        <div id="dist-form-error" class="alert alert-danger d-none small d-flex align-items-center mb-3" role="alert"></div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-division-id">
              Division <span class="text-danger">*</span>
            </label>
            <select class="form-select" id="dist-division-id" required>
              ${cmsStore.divisions.map(d => `
                <option value="${escapeHtml(d.id)}" ${district?.division_id === d.id ? 'selected' : ''}>
                  ${escapeHtml(isBn ? d.name_bn : d.name_en)}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-slug">
              Unique Slug <span class="text-danger">*</span>
            </label>
            <input type="text" class="form-control font-mono" id="dist-slug" value="${escapeHtml(district?.slug || '')}" required maxlength="120" placeholder="e.g. coxs-bazar">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-name-en">
              English Name <span class="text-danger">*</span>
              <span class="bilingual-badge-en">English</span>
            </label>
            <input type="text" class="form-control" id="dist-name-en" value="${escapeHtml(district?.name_en || '')}" required maxlength="100" placeholder="District Name">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-name-bn">
              বাংলা নাম <span class="text-danger">*</span>
              <span class="bilingual-badge-bn">বাংলা</span>
            </label>
            <input type="text" class="form-control" id="dist-name-bn" value="${escapeHtml(district?.name_bn || '')}" required maxlength="100" placeholder="জেলার নাম">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-famous-en">Famous For (English)</label>
            <input type="text" class="form-control" id="dist-famous-en" value="${escapeHtml(district?.famous_for_en || '')}" placeholder="e.g. Coral beach, Sea fish">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-famous-bn">বিখ্যাত পণ্য বা ঐতিহ্য (বাংলা)</label>
            <input type="text" class="form-control" id="dist-famous-bn" value="${escapeHtml(district?.famous_for_bn || '')}" placeholder="যেমন: শুঁটকি, সমুদ্র সৈকত">
          </div>

          <!-- Location Coordinates -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-lat">
              <i class="bi bi-pin-map text-warning me-1"></i>Latitude (-90 to 90)
            </label>
            <input type="number" step="any" min="-90" max="90" class="form-control" id="dist-lat" value="${district?.latitude ?? 23.8103}" placeholder="e.g. 23.8103">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-long">
              <i class="bi bi-pin-map text-warning me-1"></i>Longitude (-180 to 180)
            </label>
            <input type="number" step="any" min="-180" max="180" class="form-control" id="dist-long" value="${district?.longitude ?? 90.4125}" placeholder="e.g. 90.4125">
          </div>

          <div class="col-12">
            ${renderImageUploadFieldHtml({
              idPrefix: 'dist',
              label: 'Cover Image URL (Optional)',
              value: district?.image_url,
              required: false
            })}
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-desc-en">Description (English) <span class="text-danger">*</span></label>
            <textarea class="form-control" id="dist-desc-en" rows="2" required>${escapeHtml(district?.description_en || '')}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-desc-bn">বিবরণ (বাংলা) <span class="text-danger">*</span></label>
            <textarea class="form-control" id="dist-desc-bn" rows="2" required>${escapeHtml(district?.description_bn || '')}</textarea>
          </div>

          <!-- Bilingual SEO Configuration -->
          <div class="col-12">
            ${renderSeoFieldsHtml({
              idPrefix: 'dist',
              seo_title_en: district?.seo_title_en,
              seo_title_bn: district?.seo_title_bn,
              seo_description_en: district?.seo_description_en,
              seo_description_bn: district?.seo_description_bn,
              isBn
            })}
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="dist-status-select">Publication Status</label>
            <select class="form-select" id="dist-status-select">
              <option value="published" ${(!district || district.is_published) ? 'selected' : ''}>Published (Publicly visible)</option>
              <option value="draft" ${(district && !district.is_published) ? 'selected' : ''}>Save as Draft</option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4" id="dist-submit-btn">
          <i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Create District'}
        </button>
      </div>
    </form>
  `;

  const nameInput = document.getElementById('dist-name-en') as HTMLInputElement;
  const slugInput = document.getElementById('dist-slug') as HTMLInputElement;
  nameInput?.addEventListener('input', () => {
    if (!isEdit && !slugInput.dataset.manual) {
      slugInput.value = generateSlug(nameInput.value);
    }
  });
  slugInput?.addEventListener('input', () => {
    slugInput.dataset.manual = 'true';
  });

  bindImageUploadField('dist', 'districts');

  const form = document.getElementById('form-cms-district');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalFormError('dist-form-error');

    const divisionId = (document.getElementById('dist-division-id') as HTMLSelectElement).value;
    const nameEn = nameInput.value.trim();
    const nameBn = (document.getElementById('dist-name-bn') as HTMLInputElement).value.trim();
    const slug = generateSlug(slugInput.value.trim());
    slugInput.value = slug;
    const imgUrl = (document.getElementById('dist-img-url') as HTMLInputElement).value.trim();
    const descEn = (document.getElementById('dist-desc-en') as HTMLTextAreaElement).value.trim();
    const descBn = (document.getElementById('dist-desc-bn') as HTMLTextAreaElement).value.trim();
    const latRaw = (document.getElementById('dist-lat') as HTMLInputElement).value.trim();
    const lngRaw = (document.getElementById('dist-long') as HTMLInputElement).value.trim();
    const lat = latRaw ? parseFloat(latRaw) : undefined;
    const lng = lngRaw ? parseFloat(lngRaw) : undefined;

    if (!divisionId) {
      showModalFormError('dist-form-error', 'Please select a parent division.');
      return;
    }
    if (!nameEn || !nameBn || !descEn || !descBn) {
      showModalFormError('dist-form-error', 'Please provide English and Bengali names and descriptions.');
      return;
    }
    if (!isValidSlug(slug)) {
      showModalFormError('dist-form-error', 'Slug must contain only lowercase letters, numbers, and hyphens.');
      return;
    }
    if (lat !== undefined && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
      showModalFormError('dist-form-error', 'Latitude must be between -90 and 90.');
      return;
    }
    if (lng !== undefined && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
      showModalFormError('dist-form-error', 'Longitude must be between -180 and 180.');
      return;
    }
    if (imgUrl && !isValidImageSourceUrl(imgUrl)) {
      showModalFormError('dist-form-error', 'Please provide a valid cover image URL or leave it blank.');
      return;
    }

    const duplicateSlug = cmsStore.districts.some(
      d => d.id !== district?.id && (d.slug.toLowerCase() === slug || d.id === `dist_${slug}`)
    );
    if (duplicateSlug) {
      showModalFormError('dist-form-error', `A district with slug "${slug}" already exists.`);
      return;
    }
    const duplicateName = cmsStore.districts.some(
      d => d.id !== district?.id && d.name_en.trim().toLowerCase() === nameEn.toLowerCase()
    );
    if (duplicateName) {
      showModalFormError('dist-form-error', `District "${nameEn}" already exists.`);
      return;
    }

    const seoFields = readSeoFields('dist');
    const isPublished = (document.getElementById('dist-status-select') as HTMLSelectElement).value === 'published';

    const newDist: District = {
      id: district?.id || `dist_${slug}`,
      division_id: divisionId,
      name_en: nameEn,
      name_bn: nameBn,
      slug,
      famous_for_en: (document.getElementById('dist-famous-en') as HTMLInputElement).value.trim(),
      famous_for_bn: (document.getElementById('dist-famous-bn') as HTMLInputElement).value.trim(),
      latitude: lat,
      longitude: lng,
      image_url: imgUrl,
      description_en: descEn,
      description_bn: descBn,
      ...seoFields,
      is_published: isPublished,
      popular_spots_count: district?.popular_spots_count || 0,
      created_at: district?.created_at
    };

    const submitBtn = document.getElementById('dist-submit-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
    }

    try {
      await saveDistrict(newDist);
      showToast(isEdit ? 'District updated successfully!' : 'District created successfully!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showModalFormError('dist-form-error', err?.message || 'Error saving district.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Create District'}`;
      }
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ============================================================================
// 3. Category Form Modal
// ============================================================================
export function openCategoryFormModal(category?: Category, lang: Language = 'bn', onSaved?: () => void): void {
  if (!canWriteAdmin()) return;
  const container = document.getElementById('cmsCrudModalContent');
  if (!container) return;

  const isEdit = !!category;
  const isBn = lang === 'bn';

  container.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold text-white mb-0">
        <i class="bi bi-tags me-2 text-warning"></i>
        ${isEdit ? (isBn ? 'ক্যাটাগরি সম্পাদনা' : 'Edit Category') : (isBn ? 'নতুন ক্যাটাগরি যোগ করুন' : 'Add New Category')}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <form id="form-cms-category" novalidate>
      <div class="modal-body p-4" style="max-height: 72vh; overflow-y: auto;">
        <div id="cat-form-error" class="alert alert-danger d-none small d-flex align-items-center mb-3" role="alert"></div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="cat-name-en">Category Label (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="cat-name-en" value="${escapeHtml(category?.name_en || '')}" required maxlength="80" placeholder="e.g. Waterfalls & Streams">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="cat-name-bn">ক্যাটাগরি লেবেল (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="cat-name-bn" value="${escapeHtml(category?.name_bn || '')}" required maxlength="80" placeholder="যেমন: ঝর্ণা ও জলপ্রপাত">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="cat-slug">Slug <span class="text-danger">*</span></label>
            <input type="text" class="form-control font-mono" id="cat-slug" value="${escapeHtml(category?.slug || '')}" required maxlength="100" placeholder="waterfalls">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="cat-icon">Icon Class (Bootstrap Icons)</label>
            <select class="form-select" id="cat-icon">
              <option value="bi-bank" ${category?.icon === 'bi-bank' ? 'selected' : ''}>bi-bank (Historical)</option>
              <option value="bi-water" ${category?.icon === 'bi-water' ? 'selected' : ''}>bi-water (Beach/Sea)</option>
              <option value="bi-triangle" ${category?.icon === 'bi-triangle' ? 'selected' : ''}>bi-triangle (Hills)</option>
              <option value="bi-droplet" ${category?.icon === 'bi-droplet' ? 'selected' : ''}>bi-droplet (Rivers/Waterfalls)</option>
              <option value="bi-tree" ${category?.icon === 'bi-tree' ? 'selected' : ''}>bi-tree (Forests/Tea)</option>
              <option value="bi-compass" ${category?.icon === 'bi-compass' ? 'selected' : ''}>bi-compass (Eco/Mangrove)</option>
              <option value="bi-stars" ${category?.icon === 'bi-stars' ? 'selected' : ''}>bi-stars (Spiritual/Shrines)</option>
              <option value="bi-palette" ${category?.icon === 'bi-palette' ? 'selected' : ''}>bi-palette (Culture/Crafts)</option>
            </select>
          </div>

          <div class="col-12">
            ${renderImageUploadFieldHtml({
              idPrefix: 'cat',
              label: 'Category Image URL',
              value: category?.image_url,
              required: false,
              placeholder: 'https://images.unsplash.com/...'
            })}
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="cat-desc-en">Description (English)</label>
            <textarea class="form-control" id="cat-desc-en" rows="2">${escapeHtml(category?.description_en || '')}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="cat-desc-bn">বিবরণ (বাংলা)</label>
            <textarea class="form-control" id="cat-desc-bn" rows="2">${escapeHtml(category?.description_bn || '')}</textarea>
          </div>

          <div class="col-12">
            <div class="form-check form-switch mt-1">
              <input class="form-check-input" type="checkbox" id="cat-published" ${(!category || category.is_published) ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="cat-published">Published (Visible on portal)</label>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4" id="cat-submit-btn">
          <i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Create Category'}
        </button>
      </div>
    </form>
  `;

  const nameInput = document.getElementById('cat-name-en') as HTMLInputElement;
  const slugInput = document.getElementById('cat-slug') as HTMLInputElement;
  nameInput?.addEventListener('input', () => {
    if (!isEdit && !slugInput.dataset.manual) {
      slugInput.value = generateSlug(nameInput.value);
    }
  });
  slugInput?.addEventListener('input', () => {
    slugInput.dataset.manual = 'true';
  });

  bindImageUploadField('cat', 'categories');

  const form = document.getElementById('form-cms-category');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalFormError('cat-form-error');

    const nameEn = nameInput.value.trim();
    const nameBn = (document.getElementById('cat-name-bn') as HTMLInputElement).value.trim();
    const slug = generateSlug(slugInput.value.trim());
    slugInput.value = slug;
    const imgUrl = (document.getElementById('cat-img-url') as HTMLInputElement).value.trim();

    if (!nameEn || !nameBn) {
      showModalFormError('cat-form-error', 'Both English and Bengali category labels are required.');
      return;
    }
    if (!isValidSlug(slug)) {
      showModalFormError('cat-form-error', 'Slug must contain only lowercase letters, numbers, and hyphens.');
      return;
    }
    if (imgUrl && !isValidImageSourceUrl(imgUrl)) {
      showModalFormError('cat-form-error', 'Category image URL must be a valid HTTP(S) URL or uploaded image.');
      return;
    }

    const duplicateSlug = cmsStore.categories.some(
      c => c.id !== category?.id && (c.slug.toLowerCase() === slug || c.id === `cat_${slug}`)
    );
    if (duplicateSlug) {
      showModalFormError('cat-form-error', `Category with slug "${slug}" already exists.`);
      return;
    }
    const duplicateName = cmsStore.categories.some(
      c => c.id !== category?.id && c.name_en.trim().toLowerCase() === nameEn.toLowerCase()
    );
    if (duplicateName) {
      showModalFormError('cat-form-error', `Category "${nameEn}" already exists.`);
      return;
    }

    const newCat: Category = {
      id: category?.id || `cat_${slug}`,
      name_en: nameEn,
      name_bn: nameBn,
      slug,
      icon: (document.getElementById('cat-icon') as HTMLSelectElement).value,
      image_url: imgUrl || undefined,
      description_en: (document.getElementById('cat-desc-en') as HTMLTextAreaElement).value.trim(),
      description_bn: (document.getElementById('cat-desc-bn') as HTMLTextAreaElement).value.trim(),
      is_published: (document.getElementById('cat-published') as HTMLInputElement).checked,
      created_at: category?.created_at
    };

    const submitBtn = document.getElementById('cat-submit-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
    }

    try {
      await saveCategory(newCat);
      showToast(isEdit ? 'Category updated!' : 'Category created!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showModalFormError('cat-form-error', err?.message || 'Error saving category.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Create Category'}`;
      }
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ============================================================================
// 4. Tourist Spot Form Modal
// ============================================================================
export function openSpotFormModal(spot?: TouristSpot, lang: Language = 'bn', onSaved?: () => void): void {
  if (!canWriteAdmin()) return;
  const container = document.getElementById('cmsCrudModalContent');
  if (!container) return;

  const isEdit = !!spot;
  const isBn = lang === 'bn';
  const initialDivisionId = spot?.division_id || cmsStore.divisions[0]?.id || 'dhaka';
  let galleryUrlsState: string[] = Array.isArray(spot?.gallery_urls) ? [...spot.gallery_urls] : [];

  container.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold text-white mb-0">
        <i class="bi bi-compass me-2 text-warning"></i>
        ${isEdit ? (isBn ? 'দর্শনীয় স্থান সম্পাদনা করুন' : 'Edit Tourist Spot') : (isBn ? 'নতুন দর্শনীয় স্থান যোগ করুন' : 'Add New Tourist Spot')}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <form id="form-cms-spot" novalidate>
      <div class="modal-body p-4" style="max-height: 74vh; overflow-y: auto;">
        <div id="spot-form-error" class="alert alert-danger d-none small d-flex align-items-center mb-3" role="alert"></div>

        <div class="row g-3">
          <!-- Geography Selectors -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-division-id">Division <span class="text-danger">*</span></label>
            <select class="form-select" id="spot-division-id" required>
              ${cmsStore.divisions.map(d => `
                <option value="${escapeHtml(d.id)}" ${initialDivisionId === d.id ? 'selected' : ''}>
                  ${escapeHtml(isBn ? d.name_bn : d.name_en)}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-district-id">District <span class="text-danger">*</span></label>
            <select class="form-select" id="spot-district-id" required></select>
          </div>

          <!-- Multi-Category Select -->
          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">Categories (Select one or more) <span class="text-danger">*</span></label>
            <div class="d-flex flex-wrap gap-2 p-2 rounded bg-light border" id="spot-categories-container">
              ${cmsStore.categories.map(c => `
                <div class="form-check form-check-inline me-3">
                  <input class="form-check-input spot-cat-cb" type="checkbox" value="${escapeHtml(c.id)}" id="cat-cb-${escapeHtml(c.id)}" ${(spot?.category_ids || []).includes(c.id) ? 'checked' : ''}>
                  <label class="form-check-label small" for="cat-cb-${escapeHtml(c.id)}">${escapeHtml(isBn ? c.name_bn : c.name_en)}</label>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Names & Slug -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-name-en">Spot Name (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="spot-name-en" value="${escapeHtml(spot?.name_en || '')}" required maxlength="120" placeholder="e.g. Inani Beach">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-name-bn">স্থানের নাম (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="spot-name-bn" value="${escapeHtml(spot?.name_bn || '')}" required maxlength="120" placeholder="যেমন: ইনানী পাথুরে সৈকত">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-slug">Slug <span class="text-danger">*</span></label>
            <input type="text" class="form-control font-mono" id="spot-slug" value="${escapeHtml(spot?.slug || '')}" required maxlength="120" placeholder="inani-beach">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-rating">Rating (1.0 to 5.0)</label>
            <input type="number" step="0.1" min="1" max="5" class="form-control" id="spot-rating" value="${spot?.rating ?? 4.8}">
          </div>

          <!-- Short descriptions -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-short-en">Short Tagline (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="spot-short-en" value="${escapeHtml(spot?.short_desc_en || '')}" required placeholder="One line summary...">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-short-bn">এক লাইনে বর্ণনা (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="spot-short-bn" value="${escapeHtml(spot?.short_desc_bn || '')}" required placeholder="সংক্ষিপ্ত এক লাইন...">
          </div>

          <!-- Full Overview -->
          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd" for="spot-overview-en">Detailed Overview (English)</label>
            <textarea class="form-control" id="spot-overview-en" rows="3">${escapeHtml(spot?.overview_en || '')}</textarea>
          </div>
          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd" for="spot-overview-bn">বিস্তারিত বিবরণ (বাংলা)</label>
            <textarea class="form-control" id="spot-overview-bn" rows="3">${escapeHtml(spot?.overview_bn || '')}</textarea>
          </div>

          <!-- History & Heritage -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-history-en">History & Heritage (English)</label>
            <textarea class="form-control" id="spot-history-en" rows="2">${escapeHtml(spot?.history_en || '')}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-history-bn">ইতিহাস ও ঐতিহ্য (বাংলা)</label>
            <textarea class="form-control" id="spot-history-bn" rows="2">${escapeHtml(spot?.history_bn || '')}</textarea>
          </div>

          <!-- Logistics: How to go & Best season -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-how-en">How to Reach (Transportation guide)</label>
            <textarea class="form-control" id="spot-how-en" rows="2">${escapeHtml(spot?.how_to_go_en || '')}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-how-bn">কীভাবে যাবেন (যাতায়াত গাইড)</label>
            <textarea class="form-control" id="spot-how-bn" rows="2">${escapeHtml(spot?.how_to_go_bn || '')}</textarea>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-best-en">Best Visiting Time / Season</label>
            <input type="text" class="form-control" id="spot-best-en" value="${escapeHtml(spot?.best_time_en || '')}" placeholder="e.g. October to March">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-best-bn">ভ্রমণের সেরা সময় (বাংলা)</label>
            <input type="text" class="form-control" id="spot-best-bn" value="${escapeHtml(spot?.best_time_bn || '')}" placeholder="যেমন: অক্টোবর থেকে মার্চ">
          </div>

          <!-- Safety & Travel Tips -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-tips-en">Essential Travel Tips (English)</label>
            <textarea class="form-control" id="spot-tips-en" rows="2">${escapeHtml(spot?.tips_en || '')}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-tips-bn">জরুরি পরামর্শ ও সতর্কতা (বাংলা)</label>
            <textarea class="form-control" id="spot-tips-bn" rows="2">${escapeHtml(spot?.tips_bn || '')}</textarea>
          </div>

          <!-- Cover Image & Multiple Gallery Images -->
          <div class="col-12">
            ${renderImageUploadFieldHtml({
              idPrefix: 'spot',
              label: 'Cover Image URL',
              value: spot?.image_url,
              required: true
            })}
          </div>

          <div class="col-12">
            <div class="p-3 rounded-3 bg-light border">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <label class="form-label fw-bold small text-primary-bd mb-0">
                  <i class="bi bi-images me-1"></i>Gallery Images (${galleryUrlsState.length})
                </label>
                <div>
                  <input type="file" id="spot-gallery-file-input" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" multiple class="d-none">
                  <button type="button" class="btn btn-outline-bd btn-sm" id="spot-gallery-upload-btn">
                    <i class="bi bi-cloud-arrow-up me-1"></i>Upload Multiple Images
                  </button>
                </div>
              </div>
              <div class="input-group input-group-sm mb-2">
                <input type="url" class="form-control" id="spot-gallery-add-url" placeholder="Paste image URL to add to gallery (https://...)">
                <button type="button" class="btn btn-outline-secondary" id="spot-gallery-add-btn">Add URL</button>
              </div>
              <div id="spot-gallery-list" class="d-flex flex-wrap gap-2 mt-2"></div>
            </div>
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd" for="spot-maps-url">Google Maps URL / Coordinates Link</label>
            <input type="url" class="form-control" id="spot-maps-url" value="${escapeHtml(spot?.google_maps_url || '')}" placeholder="https://maps.google.com/?q=...">
          </div>

          <!-- Verified Practical Details (Optional) -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-cost-en">Estimated Travel Cost (English, if verified)</label>
            <input type="text" class="form-control" id="spot-cost-en" value="${escapeHtml(spot?.estimated_cost_en || '')}" placeholder="Leave blank if unverified">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-cost-bn">সম্ভাব্য ভ্রমণ ব্যয় (বাংলা, যাচাইকৃত হলে)</label>
            <input type="text" class="form-control" id="spot-cost-bn" value="${escapeHtml(spot?.estimated_cost_bn || '')}" placeholder="যাচাইকৃত না হলে ফাঁকা রাখুন">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-fee-en">Entry Fee (English, if verified)</label>
            <input type="text" class="form-control" id="spot-fee-en" value="${escapeHtml(spot?.entry_fee_en || '')}" placeholder="Leave blank if unverified">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-fee-bn">প্রবেশ ফি (বাংলা, যাচাইকৃত হলে)</label>
            <input type="text" class="form-control" id="spot-fee-bn" value="${escapeHtml(spot?.entry_fee_bn || '')}" placeholder="যাচাইকৃত না হলে ফাঁকা রাখুন">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-hours-en">Opening Hours (English, if verified)</label>
            <input type="text" class="form-control" id="spot-hours-en" value="${escapeHtml(spot?.opening_hours_en || '')}" placeholder="Leave blank if unverified">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-hours-bn">পরিদর্শন সময়সূচি (বাংলা, যাচাইকৃত হলে)</label>
            <input type="text" class="form-control" id="spot-hours-bn" value="${escapeHtml(spot?.opening_hours_bn || '')}" placeholder="যাচাইকৃত না হলে ফাঁকা রাখুন">
          </div>

          <!-- SEO Metadata -->
          <div class="col-12">
            ${renderSeoFieldsHtml({
              idPrefix: 'spot',
              seo_title_en: spot?.seo_title_en,
              seo_title_bn: spot?.seo_title_bn,
              seo_description_en: spot?.seo_description_en,
              seo_description_bn: spot?.seo_description_bn,
              isBn
            })}
          </div>

          <!-- Featured & Publication Status -->
          <div class="col-md-6 d-flex align-items-center">
            <div class="form-check form-switch mt-2">
              <input class="form-check-input" type="checkbox" id="spot-featured" ${spot?.is_featured ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="spot-featured">Mark as Featured on Home</label>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="spot-status-select">Publication Status</label>
            <select class="form-select" id="spot-status-select">
              <option value="published" ${(!spot || spot.is_published) ? 'selected' : ''}>Published (Publicly visible)</option>
              <option value="draft" ${(spot && !spot.is_published) ? 'selected' : ''}>Save as Draft</option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4" id="spot-submit-btn">
          <i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Create Tourist Spot'}
        </button>
      </div>
    </form>
  `;

  // Populate districts dynamically based on selected division
  const divSelect = document.getElementById('spot-division-id') as HTMLSelectElement;
  const distSelect = document.getElementById('spot-district-id') as HTMLSelectElement;

  function updateDistrictOptions(selectedDivId: string) {
    const matchingDistricts = cmsStore.districts.filter(d => d.division_id === selectedDivId);
    if (matchingDistricts.length === 0) {
      distSelect.innerHTML = `<option value="">${isBn ? 'এই বিভাগে কোনো জেলা নেই' : 'No districts in this division'}</option>`;
      return;
    }
    distSelect.innerHTML = matchingDistricts.map(d => `
      <option value="${escapeHtml(d.id)}" ${spot?.district_id === d.id ? 'selected' : ''}>
        ${escapeHtml(isBn ? d.name_bn : d.name_en)}
      </option>
    `).join('');
  }

  updateDistrictOptions(divSelect.value);
  divSelect.addEventListener('change', () => updateDistrictOptions(divSelect.value));

  // Auto-slug
  const nameInput = document.getElementById('spot-name-en') as HTMLInputElement;
  const slugInput = document.getElementById('spot-slug') as HTMLInputElement;
  nameInput?.addEventListener('input', () => {
    if (!isEdit && !slugInput.dataset.manual) {
      slugInput.value = generateSlug(nameInput.value);
    }
  });
  slugInput?.addEventListener('input', () => {
    slugInput.dataset.manual = 'true';
  });

  bindImageUploadField('spot', 'spots');

  // Multiple Gallery Manager
  const galleryListEl = document.getElementById('spot-gallery-list');
  const galleryFileInput = document.getElementById('spot-gallery-file-input') as HTMLInputElement;
  const galleryUploadBtn = document.getElementById('spot-gallery-upload-btn') as HTMLButtonElement;
  const galleryAddUrlInput = document.getElementById('spot-gallery-add-url') as HTMLInputElement;
  const galleryAddBtn = document.getElementById('spot-gallery-add-btn');

  const renderGalleryThumbnails = () => {
    if (!galleryListEl) return;
    if (galleryUrlsState.length === 0) {
      galleryListEl.innerHTML = '<span class="small text-muted">No gallery images added yet.</span>';
      return;
    }
    galleryListEl.innerHTML = galleryUrlsState
      .map(
        (url, idx) => `
      <div class="position-relative border rounded-2 bg-white p-1" style="width: 92px;">
        <img src="${escapeHtml(url)}" class="rounded-1 w-100" style="height: 64px; object-fit: cover;" alt="Gallery ${idx + 1}">
        <button
          type="button"
          class="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
          style="width: 20px; height: 20px; transform: translate(30%, -30%); border-radius: 50%;"
          data-remove-gallery-idx="${idx}"
          aria-label="Remove gallery image ${idx + 1}"
        >
          <i class="bi bi-x" style="font-size: 0.85rem;"></i>
        </button>
      </div>
    `
      )
      .join('');

    galleryListEl.querySelectorAll('[data-remove-gallery-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-remove-gallery-idx') || '-1', 10);
        if (idx >= 0) {
          galleryUrlsState.splice(idx, 1);
          renderGalleryThumbnails();
        }
      });
    });
  };
  renderGalleryThumbnails();

  galleryAddBtn?.addEventListener('click', () => {
    const url = galleryAddUrlInput.value.trim();
    if (!isValidImageSourceUrl(url)) {
      showToast('Please enter a valid image URL (https://...)', 'warning');
      return;
    }
    if (!galleryUrlsState.includes(url)) {
      galleryUrlsState.push(url);
      renderGalleryThumbnails();
    }
    galleryAddUrlInput.value = '';
  });

  galleryUploadBtn?.addEventListener('click', () => galleryFileInput?.click());
  galleryFileInput?.addEventListener('change', async () => {
    const files = Array.from(galleryFileInput.files || []);
    if (files.length === 0) return;

    for (const f of files) {
      const check = validateImageFile(f);
      if (!check.valid) {
        showToast(`${f.name}: ${check.error}`, 'error');
        galleryFileInput.value = '';
        return;
      }
    }

    galleryUploadBtn.disabled = true;
    galleryUploadBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Uploading (${files.length})...`;

    try {
      for (const f of files) {
        const url = await uploadImageFile(f, 'spots/gallery');
        if (!galleryUrlsState.includes(url)) {
          galleryUrlsState.push(url);
        }
      }
      renderGalleryThumbnails();
      showToast(`${files.length} gallery image(s) uploaded!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gallery upload error.', 'error');
    } finally {
      galleryUploadBtn.disabled = false;
      galleryUploadBtn.innerHTML = '<i class="bi bi-cloud-arrow-up me-1"></i>Upload Multiple Images';
      galleryFileInput.value = '';
    }
  });

  // Submit Handler
  const form = document.getElementById('form-cms-spot');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalFormError('spot-form-error');

    const divisionId = divSelect.value;
    const districtId = distSelect.value;
    const nameEn = nameInput.value.trim();
    const nameBn = (document.getElementById('spot-name-bn') as HTMLInputElement).value.trim();
    const slug = generateSlug(slugInput.value.trim());
    slugInput.value = slug;
    const ratingVal = parseFloat((document.getElementById('spot-rating') as HTMLInputElement).value);
    const shortEn = (document.getElementById('spot-short-en') as HTMLInputElement).value.trim();
    const shortBn = (document.getElementById('spot-short-bn') as HTMLInputElement).value.trim();
    const imgUrl = (document.getElementById('spot-img-url') as HTMLInputElement).value.trim();
    const mapsUrl = (document.getElementById('spot-maps-url') as HTMLInputElement).value.trim();

    const selectedCats: string[] = [];
    document.querySelectorAll('.spot-cat-cb:checked').forEach((cb: any) => {
      selectedCats.push(cb.value);
    });

    if (!divisionId || !districtId) {
      showModalFormError('spot-form-error', 'Please select both a Division and a District.');
      return;
    }
    if (selectedCats.length === 0) {
      showModalFormError('spot-form-error', 'Please select at least one category.');
      return;
    }
    if (!nameEn || !nameBn || !shortEn || !shortBn) {
      showModalFormError('spot-form-error', 'Please fill in required English and Bengali spot names and taglines.');
      return;
    }
    if (!isValidSlug(slug)) {
      showModalFormError('spot-form-error', 'Slug must contain only lowercase letters, numbers, and hyphens.');
      return;
    }
    if (!Number.isFinite(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      showModalFormError('spot-form-error', 'Rating must be between 1.0 and 5.0.');
      return;
    }
    if (!isValidImageSourceUrl(imgUrl)) {
      showModalFormError('spot-form-error', 'Please provide a valid cover image URL or upload an image file.');
      return;
    }
    if (mapsUrl && !isValidHttpUrl(mapsUrl)) {
      showModalFormError('spot-form-error', 'Google Maps URL must be a valid HTTP or HTTPS link.');
      return;
    }

    const duplicateSlug = cmsStore.spots.some(
      s => s.id !== spot?.id && (s.slug.toLowerCase() === slug || s.id === `spot_${slug}`)
    );
    if (duplicateSlug) {
      showModalFormError('spot-form-error', `A tourist spot with slug "${slug}" already exists.`);
      return;
    }
    const duplicateName = cmsStore.spots.some(
      s => s.id !== spot?.id && s.district_id === districtId && s.name_en.trim().toLowerCase() === nameEn.toLowerCase()
    );
    if (duplicateName) {
      showModalFormError('spot-form-error', `"${nameEn}" already exists in the selected district.`);
      return;
    }

    const seoFields = readSeoFields('spot');
    const isPublished = (document.getElementById('spot-status-select') as HTMLSelectElement).value === 'published';

    const newSpot: TouristSpot = {
      id: spot?.id || `spot_${slug}`,
      division_id: divisionId,
      district_id: districtId,
      category_ids: selectedCats,
      name_en: nameEn,
      name_bn: nameBn,
      slug,
      rating: ratingVal,
      short_desc_en: shortEn,
      short_desc_bn: shortBn,
      overview_en: (document.getElementById('spot-overview-en') as HTMLTextAreaElement).value.trim(),
      overview_bn: (document.getElementById('spot-overview-bn') as HTMLTextAreaElement).value.trim(),
      history_en: (document.getElementById('spot-history-en') as HTMLTextAreaElement).value.trim(),
      history_bn: (document.getElementById('spot-history-bn') as HTMLTextAreaElement).value.trim(),
      how_to_go_en: (document.getElementById('spot-how-en') as HTMLTextAreaElement).value.trim(),
      how_to_go_bn: (document.getElementById('spot-how-bn') as HTMLTextAreaElement).value.trim(),
      best_time_en: (document.getElementById('spot-best-en') as HTMLInputElement).value.trim(),
      best_time_bn: (document.getElementById('spot-best-bn') as HTMLInputElement).value.trim(),
      tips_en: (document.getElementById('spot-tips-en') as HTMLTextAreaElement).value.trim(),
      tips_bn: (document.getElementById('spot-tips-bn') as HTMLTextAreaElement).value.trim(),
      image_url: imgUrl,
      gallery_urls: galleryUrlsState,
      google_maps_url: mapsUrl || undefined,
      estimated_cost_en: (document.getElementById('spot-cost-en') as HTMLInputElement).value.trim() || undefined,
      estimated_cost_bn: (document.getElementById('spot-cost-bn') as HTMLInputElement).value.trim() || undefined,
      entry_fee_en: (document.getElementById('spot-fee-en') as HTMLInputElement).value.trim() || undefined,
      entry_fee_bn: (document.getElementById('spot-fee-bn') as HTMLInputElement).value.trim() || undefined,
      opening_hours_en: (document.getElementById('spot-hours-en') as HTMLInputElement).value.trim() || undefined,
      opening_hours_bn: (document.getElementById('spot-hours-bn') as HTMLInputElement).value.trim() || undefined,
      ...seoFields,
      is_featured: (document.getElementById('spot-featured') as HTMLInputElement).checked,
      is_published: isPublished,
      created_at: spot?.created_at || new Date().toISOString()
    };

    const submitBtn = document.getElementById('spot-submit-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
    }

    try {
      await saveTouristSpot(newSpot);
      showToast(isEdit ? 'Tourist Spot updated!' : 'Tourist Spot created!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showModalFormError('spot-form-error', err?.message || 'Error saving tourist spot.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Create Tourist Spot'}`;
      }
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ============================================================================
// 5. Travel Guide / Article Form Modal with Rich Text Editor & Preview
// ============================================================================
export function openArticleFormModal(article?: Article, lang: Language = 'bn', onSaved?: () => void): void {
  if (!canWriteAdmin()) return;
  const container = document.getElementById('cmsCrudModalContent');
  if (!container) return;

  const isEdit = !!article;
  const isBn = lang === 'bn';

  container.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold text-white mb-0">
        <i class="bi bi-journal-text me-2 text-warning"></i>
        ${isEdit ? (isBn ? 'ভ্রমণ গাইড সম্পাদনা' : 'Edit Travel Guide') : (isBn ? 'নতুন ভ্রমণ গাইড তৈরি করুন' : 'Write New Travel Guide')}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <form id="form-cms-article" novalidate>
      <div class="modal-body p-4" style="max-height: 74vh; overflow-y: auto;">
        <div id="art-form-error" class="alert alert-danger d-none small d-flex align-items-center mb-3" role="alert"></div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="art-title-en">Title (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="art-title-en" value="${escapeHtml(article?.title_en || '')}" required maxlength="160" placeholder="Guide Title">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="art-title-bn">শিরোনাম (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="art-title-bn" value="${escapeHtml(article?.title_bn || '')}" required maxlength="160" placeholder="গাইডের শিরোনাম">
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-primary-bd" for="art-slug">Slug <span class="text-danger">*</span></label>
            <input type="text" class="form-control font-mono" id="art-slug" value="${escapeHtml(article?.slug || '')}" required maxlength="120" placeholder="travel-guide-slug">
          </div>
          <div class="col-md-4">
            <label class="form-label fw-bold small text-primary-bd">Author (EN / BN)</label>
            <div class="input-group">
              <input type="text" class="form-control" id="art-author-en" value="${escapeHtml(article?.author_en || 'Travel Desk')}" placeholder="Author (EN)">
              <input type="text" class="form-control" id="art-author-bn" value="${escapeHtml(article?.author_bn || 'ভ্রমণ ডেস্ক')}" placeholder="লেখক (বাংলা)">
            </div>
          </div>
          <div class="col-md-4">
            <label class="form-label fw-bold small text-primary-bd">Read Time (EN / BN)</label>
            <div class="input-group">
              <input type="text" class="form-control" id="art-read-en" value="${escapeHtml(article?.read_time_en || '6 min read')}" placeholder="6 min read">
              <input type="text" class="form-control" id="art-read-bn" value="${escapeHtml(article?.read_time_bn || '৬ মিনিট পঠন')}" placeholder="৬ মিনিট পঠন">
            </div>
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-primary-bd" for="art-category-id">${isBn ? 'নিবন্ধের ক্যাটাগরি' : 'Article Category'}</label>
            <select class="form-select" id="art-category-id">
              <option value="">${isBn ? 'স্বয়ংক্রিয় / সাধারণ গাইড' : 'Auto / General Guide'}</option>
              ${ARTICLE_CATEGORIES.map(cat => `
                <option value="${escapeHtml(cat.id)}" ${article?.category_id === cat.id ? 'selected' : ''}>
                  ${escapeHtml(isBn ? `${cat.name_bn} (${cat.name_en})` : `${cat.name_en} (${cat.name_bn})`)}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label fw-bold small text-primary-bd" for="art-district-id">Related District</label>
            <select class="form-select" id="art-district-id">
              <option value="">${isBn ? 'সমগ্র বাংলাদেশ (সাধারণ গাইড)' : 'All Bangladesh (General Guide)'}</option>
              ${cmsStore.districts.map(d => `
                <option value="${escapeHtml(d.id)}" ${article?.related_district_id === d.id ? 'selected' : ''}>
                  ${escapeHtml(isBn ? d.name_bn : d.name_en)}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label fw-bold small text-primary-bd" for="art-spot-id">Related Tourist Spot</label>
            <select class="form-select" id="art-spot-id">
              <option value="">${isBn ? 'কোনো নির্দিষ্ট স্থান নয়' : 'None / General Region'}</option>
              ${cmsStore.spots.map(s => `
                <option value="${escapeHtml(s.id)}" ${article?.related_spot_id === s.id ? 'selected' : ''}>
                  ${escapeHtml(isBn ? s.name_bn : s.name_en)}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="art-tags">Tags (Comma-separated)</label>
            <input type="text" class="form-control" id="art-tags" value="${escapeHtml((article?.tags || []).join(', '))}" placeholder="Sundarbans, Wildlife, Tips">
          </div>
          <div class="col-md-6">
            ${renderImageUploadFieldHtml({
              idPrefix: 'art',
              label: 'Cover Image URL',
              value: article?.image_url,
              required: true
            })}
          </div>

          <!-- Excerpt -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="art-excerpt-en">Summary / Excerpt (English) <span class="text-danger">*</span></label>
            <textarea class="form-control" id="art-excerpt-en" rows="2" required>${escapeHtml(article?.excerpt_en || '')}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="art-excerpt-bn">সংক্ষিপ্ত সারসংক্ষেপ (বাংলা) <span class="text-danger">*</span></label>
            <textarea class="form-control" id="art-excerpt-bn" rows="2" required>${escapeHtml(article?.excerpt_bn || '')}</textarea>
          </div>

          <!-- Rich Text Content Editor (English) -->
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="form-label fw-bold small text-primary-bd mb-0" for="art-content-en">Article Body (English Content) <span class="text-danger">*</span></label>
              <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" data-toggle-preview="en">Preview</button>
            </div>
            <div class="cms-editor-toolbar">
              <button type="button" class="cms-editor-btn" data-insert-tag="en,**bold**"><b>B</b></button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,*italic*"><i>I</i></button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,## Heading">H2</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,### Subheading">H3</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,[Link text](https://)">Link</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,\n- List item">• List</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,\n> Quote">Quote</button>
            </div>
            <textarea class="form-control cms-editor-textarea" id="art-content-en" rows="5" required placeholder="Write full article in Markdown...">${escapeHtml(article?.content_en || '')}</textarea>
            <div id="art-preview-en" class="p-3 border rounded-bottom bg-light d-none" style="min-height: 120px;"></div>
          </div>

          <!-- Rich Text Content Editor (Bengali) -->
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="form-label fw-bold small text-primary-bd mb-0" for="art-content-bn">আর্টিকেল মূল বিষয়বস্তু (বাংলা কনটেন্ট) <span class="text-danger">*</span></label>
              <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" data-toggle-preview="bn">প্রিভিউ</button>
            </div>
            <div class="cms-editor-toolbar">
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,**গাঢ় লেখা**"><b>B</b></button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,*বাঁকা লেখা*"><i>I</i></button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,## প্রধান শিরোনাম">H2</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,### উপ-শিরোনাম">H3</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,[লিংক টেক্সট](https://)">লিংক</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,\n- তালিকা পয়েন্ট">• তালিকা</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,\n> উদ্ধৃতি">উদ্ধৃতি</button>
            </div>
            <textarea class="form-control cms-editor-textarea" id="art-content-bn" rows="5" required placeholder="সম্পূর্ণ ভ্রমণ গাইড বাংলায় লিখুন...">${escapeHtml(article?.content_bn || '')}</textarea>
            <div id="art-preview-bn" class="p-3 border rounded-bottom bg-light d-none" style="min-height: 120px;"></div>
          </div>

          <!-- SEO Metadata -->
          <div class="col-12">
            ${renderSeoFieldsHtml({
              idPrefix: 'art',
              seo_title_en: article?.seo_title_en,
              seo_title_bn: article?.seo_title_bn,
              seo_description_en: article?.seo_description_en,
              seo_description_bn: article?.seo_description_bn,
              isBn
            })}
          </div>

          <!-- Status & Scheduling -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="art-status">Publication Status</label>
            <select class="form-select" id="art-status">
              <option value="published" ${article?.status === 'published' || (!article && true) || article?.is_published ? 'selected' : ''}>Published Now</option>
              <option value="draft" ${article?.status === 'draft' || (article && !article.is_published && article.status !== 'scheduled') ? 'selected' : ''}>Save as Draft</option>
              <option value="scheduled" ${article?.status === 'scheduled' ? 'selected' : ''}>Schedule for Future Date</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="art-scheduled-at">Schedule Date & Time</label>
            <input type="datetime-local" class="form-control" id="art-scheduled-at" value="${escapeHtml(article?.scheduled_at || '')}">
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4" id="art-submit-btn">
          <i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Save Travel Guide'}
        </button>
      </div>
    </form>
  `;

  const nameInput = document.getElementById('art-title-en') as HTMLInputElement;
  const slugInput = document.getElementById('art-slug') as HTMLInputElement;
  nameInput?.addEventListener('input', () => {
    if (!isEdit && !slugInput.dataset.manual) {
      slugInput.value = generateSlug(nameInput.value);
    }
  });
  slugInput?.addEventListener('input', () => {
    slugInput.dataset.manual = 'true';
  });

  // Rich text toolbar inserter
  document.querySelectorAll('[data-insert-tag]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-insert-tag') || '';
      const commaIdx = val.indexOf(',');
      const langCode = val.slice(0, commaIdx);
      const snippet = val.slice(commaIdx + 1);
      const textarea = document.getElementById(langCode === 'en' ? 'art-content-en' : 'art-content-bn') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const current = textarea.value;
        textarea.value = current.substring(0, start) + snippet + current.substring(end);
        textarea.focus();
      }
    });
  });

  // Rich text write/preview toggle
  document.querySelectorAll('[data-toggle-preview]').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-toggle-preview');
      const textarea = document.getElementById(`art-content-${code}`) as HTMLTextAreaElement | null;
      const preview = document.getElementById(`art-preview-${code}`);
      if (!textarea || !preview) return;
      const showingPreview = !preview.classList.contains('d-none');
      if (showingPreview) {
        preview.classList.add('d-none');
        textarea.classList.remove('d-none');
        btn.textContent = code === 'bn' ? 'প্রিভিউ' : 'Preview';
      } else {
        preview.innerHTML = renderRichTextPreview(textarea.value);
        textarea.classList.add('d-none');
        preview.classList.remove('d-none');
        btn.textContent = code === 'bn' ? 'সম্পাদনা' : 'Edit';
      }
    });
  });

  bindImageUploadField('art', 'articles');

  const form = document.getElementById('form-cms-article');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalFormError('art-form-error');

    const titleEn = nameInput.value.trim();
    const titleBn = (document.getElementById('art-title-bn') as HTMLInputElement).value.trim();
    const slug = generateSlug(slugInput.value.trim());
    slugInput.value = slug;
    const imgUrl = (document.getElementById('art-img-url') as HTMLInputElement).value.trim();
    const excerptEn = (document.getElementById('art-excerpt-en') as HTMLTextAreaElement).value.trim();
    const excerptBn = (document.getElementById('art-excerpt-bn') as HTMLTextAreaElement).value.trim();
    const contentEn = (document.getElementById('art-content-en') as HTMLTextAreaElement).value.trim();
    const contentBn = (document.getElementById('art-content-bn') as HTMLTextAreaElement).value.trim();
    const statusVal = (document.getElementById('art-status') as HTMLSelectElement).value as 'published' | 'draft' | 'scheduled';
    const scheduledAt = (document.getElementById('art-scheduled-at') as HTMLInputElement).value.trim();

    if (!titleEn || !titleBn || !excerptEn || !excerptBn || !contentEn || !contentBn) {
      showModalFormError('art-form-error', 'Please complete English and Bengali titles, excerpts, and article bodies.');
      return;
    }
    if (!isValidSlug(slug)) {
      showModalFormError('art-form-error', 'Slug must contain only lowercase letters, numbers, and hyphens.');
      return;
    }
    if (!isValidImageSourceUrl(imgUrl)) {
      showModalFormError('art-form-error', 'Please provide a valid cover image URL or upload a cover image.');
      return;
    }
    if (statusVal === 'scheduled' && !scheduledAt) {
      showModalFormError('art-form-error', 'Please select a future Schedule Date & Time for scheduled articles.');
      return;
    }

    const duplicateSlug = cmsStore.articles.some(
      a => a.id !== article?.id && (a.slug.toLowerCase() === slug || a.id === `art_${slug}`)
    );
    if (duplicateSlug) {
      showModalFormError('art-form-error', `An article with slug "${slug}" already exists.`);
      return;
    }
    const duplicateTitle = cmsStore.articles.some(
      a => a.id !== article?.id && a.title_en.trim().toLowerCase() === titleEn.toLowerCase()
    );
    if (duplicateTitle) {
      showModalFormError('art-form-error', `An article titled "${titleEn}" already exists.`);
      return;
    }

    const tagsArr = (document.getElementById('art-tags') as HTMLInputElement).value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const categoryId = (document.getElementById('art-category-id') as HTMLSelectElement)?.value || '';
    const spotId = (document.getElementById('art-spot-id') as HTMLSelectElement)?.value || '';
    const authorEn = (document.getElementById('art-author-en') as HTMLInputElement).value.trim() || 'Travel Desk';
    const authorBn = (document.getElementById('art-author-bn') as HTMLInputElement).value.trim() || authorEn;
    const readEn = (document.getElementById('art-read-en') as HTMLInputElement).value.trim() || '5 min read';
    const readBn = (document.getElementById('art-read-bn') as HTMLInputElement).value.trim() || '৫ মিনিট পঠন';
    const seoFields = readSeoFields('art');

    const newArt: Article = {
      id: article?.id || `art_${slug}`,
      title_en: titleEn,
      title_bn: titleBn,
      slug,
      author_en: authorEn,
      author_bn: authorBn,
      read_time_en: readEn,
      read_time_bn: readBn,
      excerpt_en: excerptEn,
      excerpt_bn: excerptBn,
      content_en: contentEn,
      content_bn: contentBn,
      category_id: categoryId || undefined,
      related_district_id: (document.getElementById('art-district-id') as HTMLSelectElement).value,
      related_spot_id: spotId || undefined,
      image_url: imgUrl,
      tags: tagsArr,
      ...seoFields,
      status: statusVal,
      scheduled_at: statusVal === 'scheduled' ? scheduledAt : undefined,
      is_published: statusVal === 'published',
      published_at: article?.published_at || new Date().toISOString().split('T')[0],
      created_at: article?.created_at
    };

    const submitBtn = document.getElementById('art-submit-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
    }

    try {
      await saveArticle(newArt);
      showToast(isEdit ? 'Travel guide updated!' : 'Travel guide saved!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showModalFormError('art-form-error', err?.message || 'Error saving article.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Save Travel Guide'}`;
      }
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ============================================================================
// 6. Image Manager Modals (Upload, Edit Bilingual Alt Text & Preview)
// ============================================================================
export function openMediaUploadModal(lang: Language = 'bn', onUploaded?: () => void): void {
  if (!canWriteAdmin()) return;
  const container = document.getElementById('cmsCrudModalContent');
  if (!container) return;

  const isBn = lang === 'bn';

  container.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold text-white mb-0">
        <i class="bi bi-cloud-arrow-up me-2 text-warning"></i>
        ${isBn ? 'নতুন ছবি আপলোড ও নিবন্ধন' : 'Upload Image to Storage Library'}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <form id="form-cms-media-upload" novalidate>
      <div class="modal-body p-4">
        <div id="media-form-error" class="alert alert-danger d-none small d-flex align-items-center mb-3" role="alert"></div>

        <div class="mb-3">
          <label class="form-label fw-bold small text-primary-bd" for="media-upload-input">Select Image File (Max 5MB) <span class="text-danger">*</span></label>
          <input type="file" id="media-upload-input" class="form-control" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" required>
          <div class="small text-muted mt-1">Allowed types: JPEG, PNG, WEBP, GIF, SVG. Max file size: 5 Megabytes.</div>
        </div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="media-alt-en">Alternative Text (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="media-alt-en" required maxlength="200" placeholder="Describe the image...">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="media-alt-bn">অল্ট-টেক্সট বিবরণ (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="media-alt-bn" required maxlength="200" placeholder="ছবির বিবরণ বাংলায়...">
          </div>
        </div>

        <div id="media-preview-box" class="mt-3 p-2 rounded bg-light border text-center d-none">
          <img id="media-preview-img" src="" class="rounded" style="max-height: 180px; max-width: 100%;" alt="Upload preview">
          <div id="media-file-meta" class="small text-muted mt-1"></div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4" id="media-submit-btn">
          <i class="bi bi-cloud-check me-1"></i>Upload & Save Asset
        </button>
      </div>
    </form>
  `;

  const fileInput = document.getElementById('media-upload-input') as HTMLInputElement;
  const previewBox = document.getElementById('media-preview-box');
  const previewImg = document.getElementById('media-preview-img') as HTMLImageElement;
  const metaBox = document.getElementById('media-file-meta');

  fileInput.addEventListener('change', () => {
    clearModalFormError('media-form-error');
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const check = validateImageFile(file);
      if (!check.valid) {
        showModalFormError('media-form-error', check.error || 'Invalid image file.');
        fileInput.value = '';
        if (previewBox) previewBox.classList.add('d-none');
        return;
      }

      if (previewBox && previewImg) {
        previewBox.classList.remove('d-none');
        previewImg.src = URL.createObjectURL(file);
        if (metaBox) {
          metaBox.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB, ${file.type})`;
        }
      }
    }
  });

  const form = document.getElementById('form-cms-media-upload');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalFormError('media-form-error');

    if (!fileInput.files || !fileInput.files[0]) {
      showModalFormError('media-form-error', 'Please select a valid image file.');
      return;
    }

    const file = fileInput.files[0];
    const check = validateImageFile(file);
    if (!check.valid) {
      showModalFormError('media-form-error', check.error || 'Invalid image file.');
      return;
    }

    const altEn = (document.getElementById('media-alt-en') as HTMLInputElement).value.trim();
    const altBn = (document.getElementById('media-alt-bn') as HTMLInputElement).value.trim();
    if (!altEn || !altBn) {
      showModalFormError('media-form-error', 'Please enter alternative text in both English and Bengali.');
      return;
    }

    const submitBtn = document.getElementById('media-submit-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Uploading...';
    }

    try {
      const downloadUrl = await uploadImageFile(file, 'media_library');
      const now = new Date().toISOString();
      const newItem: MediaItem = {
        id: `media_${Date.now()}`,
        url: downloadUrl,
        file_name: file.name,
        alt_en: altEn,
        alt_bn: altBn,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: now,
        updated_at: now
      };

      await saveMediaItem(newItem);
      showToast('Image uploaded and registered successfully!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onUploaded) onUploaded();
    } catch (err: any) {
      showModalFormError('media-form-error', err?.message || 'Image upload error.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-cloud-check me-1"></i>Upload & Save Asset';
      }
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

export function openMediaEditModal(item: MediaItem, lang: Language = 'bn', onSaved?: () => void): void {
  if (!canWriteAdmin()) return;
  const container = document.getElementById('cmsCrudModalContent');
  if (!container) return;

  const isBn = lang === 'bn';
  const refs = getMediaReferences(item.url);

  container.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold text-white mb-0">
        <i class="bi bi-pencil-square me-2 text-warning"></i>
        ${isBn ? 'ছবির অল্ট-টেক্সট ও তথ্য সম্পাদনা' : 'Edit Image Alt Text & Details'}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <form id="form-cms-media-edit" novalidate>
      <div class="modal-body p-4">
        <div id="media-edit-error" class="alert alert-danger d-none small d-flex align-items-center mb-3" role="alert"></div>

        <div class="text-center mb-3 p-2 bg-light rounded border">
          <img src="${escapeHtml(item.url)}" class="rounded" style="max-height: 160px; max-width: 100%; object-fit: cover;" alt="${escapeHtml(item.alt_en)}">
          <div class="small text-muted mt-2 font-mono">${escapeHtml(item.file_name)}</div>
        </div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="media-edit-alt-en">Alternative Text (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="media-edit-alt-en" value="${escapeHtml(item.alt_en)}" required maxlength="200">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd" for="media-edit-alt-bn">অল্ট-টেক্সট বিবরণ (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="media-edit-alt-bn" value="${escapeHtml(item.alt_bn)}" required maxlength="200">
          </div>
        </div>

        <div class="mt-3 p-3 rounded bg-light border small">
          <div class="fw-bold text-primary-bd mb-1">
            ${isBn ? `ব্যবহারের তালিকা (${refs.length})` : `Content References (${refs.length})`}
          </div>
          ${
            refs.length === 0
              ? `<span class="text-muted">${isBn ? 'এই ছবিটি বর্তমানে কোনো পেজে ব্যবহৃত হচ্ছে না (নিরাপদে মুছে ফেলা যাবে)।' : 'Unused — not currently referenced by any division, district, spot, category, or guide.'}</span>`
              : `<ul class="mb-0 ps-3">${refs.map(r => `<li><strong>${escapeHtml(r.entityType)}:</strong> ${escapeHtml(r.title)}</li>`).join('')}</ul>`
          }
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4" id="media-edit-submit-btn">
          <i class="bi bi-save me-1"></i>Save Alt Text
        </button>
      </div>
    </form>
  `;

  document.getElementById('form-cms-media-edit')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalFormError('media-edit-error');

    const altEn = (document.getElementById('media-edit-alt-en') as HTMLInputElement).value.trim();
    const altBn = (document.getElementById('media-edit-alt-bn') as HTMLInputElement).value.trim();

    if (!altEn || !altBn) {
      showModalFormError('media-edit-error', 'Alternative text is required in both English and Bengali.');
      return;
    }

    const submitBtn = document.getElementById('media-edit-submit-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
    }

    try {
      await saveMediaItem({
        ...item,
        alt_en: altEn,
        alt_bn: altBn,
        updated_at: new Date().toISOString()
      });
      showToast('Image alt text updated!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showModalFormError('media-edit-error', err?.message || 'Error updating image.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Save Alt Text';
      }
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ----------------------------------------------------------------------------
// 7. Full Image Preview Zoom Modal (XSS-safe)
// ----------------------------------------------------------------------------
export function openImagePreviewModal(imageUrl: string, item?: MediaItem): void {
  const container = document.getElementById('cmsImagePreviewContent');
  if (!container) return;

  container.innerHTML = `
    <div class="d-flex justify-content-end mb-2">
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <img src="${escapeHtml(imageUrl)}" class="img-fluid rounded" style="max-height: 78vh;" alt="${escapeHtml(item?.alt_en || 'Preview')}">
    ${
      item
        ? `<div class="mt-2 small text-white">${escapeHtml(item.alt_en)} · ${escapeHtml(item.alt_bn)}</div>`
        : ''
    }
    <div class="mt-1 small text-white-50 text-break">${escapeHtml(imageUrl)}</div>
  `;

  const modal = getBsModal('cmsImagePreviewModal');
  if (modal) modal.show();
}

// ----------------------------------------------------------------------------
// 8. Editable Legal Pages Modal (Privacy Policy & Terms and Conditions)
// ----------------------------------------------------------------------------
export function openLegalPagesModal(
  initialSection: 'privacy' | 'terms' = 'privacy',
  lang: Language = 'bn',
  onSaved?: () => void
): void {
  if (!canWriteAdmin()) return;
  const container = document.getElementById('cmsCrudModalContent');
  if (!container) return;

  const isBn = lang === 'bn';
  const current = cmsStore.legalPages;

  container.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold text-white mb-0">
        <i class="bi bi-file-earmark-lock2 me-2 text-warning"></i>
        ${isBn ? 'আইনি নীতিমালা সম্পাদনা ও পর্যালোচনা' : 'Edit & Review Legal Pages'}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <form id="form-cms-legal-pages">
      <div class="modal-body p-4" style="max-height: 74vh; overflow-y: auto;">
        <div class="alert alert-warning d-flex align-items-start gap-2 small mb-3">
          <i class="bi bi-exclamation-triangle-fill mt-1"></i>
          <div>
            ${isBn
              ? 'প্রকাশের পূর্বে একজন অনুমোদিত কর্মকর্তা বা আইন বিশেষজ্ঞের মাধ্যমে উভয় ভাষার (বাংলা ও ইংরেজি) বিষয়বস্তু পর্যালোচনা করে অনুমোদন টিক চিহ্ন দিন।'
              : 'Review both Bengali and English Markdown content before formal publication. Check the review boxes below once verified.'}
          </div>
        </div>

        <ul class="nav nav-pills mb-3 gap-2" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link ${initialSection === 'privacy' ? 'active' : ''}"
              id="legal-tab-privacy"
              data-bs-toggle="pill"
              data-bs-target="#legal-pane-privacy"
              type="button"
              role="tab"
            >
              <i class="bi bi-shield-check me-1"></i>${isBn ? 'গোপনীয়তা নীতি (Privacy)' : 'Privacy Policy'}
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link ${initialSection === 'terms' ? 'active' : ''}"
              id="legal-tab-terms"
              data-bs-toggle="pill"
              data-bs-target="#legal-pane-terms"
              type="button"
              role="tab"
            >
              <i class="bi bi-journal-check me-1"></i>${isBn ? 'ব্যবহারের শর্তাবলী (Terms)' : 'Terms & Conditions'}
            </button>
          </li>
        </ul>

        <div class="tab-content">
          <!-- Privacy Policy Tab -->
          <div class="tab-pane fade ${initialSection === 'privacy' ? 'show active' : ''}" id="legal-pane-privacy" role="tabpanel">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold small text-primary-bd">Title (English)</label>
                <input type="text" class="form-control" id="legal-privacy-title-en" value="${escapeHtml(current.privacy_title_en)}" required>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold small text-primary-bd">শিরোনাম (বাংলা)</label>
                <input type="text" class="form-control" id="legal-privacy-title-bn" value="${escapeHtml(current.privacy_title_bn)}" required>
              </div>
              <div class="col-12">
                <label class="form-label fw-bold small text-primary-bd">
                  Content (English Markdown)
                  <span class="bilingual-badge-en">English</span>
                </label>
                <textarea class="form-control font-monospace small" id="legal-privacy-content-en" rows="8" required>${escapeHtml(current.privacy_content_en)}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label fw-bold small text-primary-bd">
                  বিষয়বস্তু (বাংলা মার্কডাউন)
                  <span class="bilingual-badge-bn">বাংলা</span>
                </label>
                <textarea class="form-control font-monospace small" id="legal-privacy-content-bn" rows="8" required>${escapeHtml(current.privacy_content_bn)}</textarea>
              </div>
              <div class="col-md-7">
                <div class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" id="legal-privacy-reviewed" ${current.privacy_reviewed ? 'checked' : ''}>
                  <label class="form-check-label fw-bold text-primary-bd" for="legal-privacy-reviewed">
                    ${isBn ? 'গোপনীয়তা নীতি প্রকাশের পূর্বে পর্যালোচিত ও অনুমোদিত' : 'Privacy Policy reviewed & approved for publication'}
                  </label>
                </div>
              </div>
              <div class="col-md-5">
                <input type="text" class="form-control form-control-sm" id="legal-privacy-reviewer" value="${escapeHtml(current.privacy_reviewed_by || '')}" placeholder="${isBn ? 'পর্যালোচকের নাম / পদবি' : 'Reviewer name / title'}">
              </div>
            </div>
          </div>

          <!-- Terms & Conditions Tab -->
          <div class="tab-pane fade ${initialSection === 'terms' ? 'show active' : ''}" id="legal-pane-terms" role="tabpanel">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold small text-primary-bd">Title (English)</label>
                <input type="text" class="form-control" id="legal-terms-title-en" value="${escapeHtml(current.terms_title_en)}" required>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold small text-primary-bd">শিরোনাম (বাংলা)</label>
                <input type="text" class="form-control" id="legal-terms-title-bn" value="${escapeHtml(current.terms_title_bn)}" required>
              </div>
              <div class="col-12">
                <label class="form-label fw-bold small text-primary-bd">
                  Content (English Markdown)
                  <span class="bilingual-badge-en">English</span>
                </label>
                <textarea class="form-control font-monospace small" id="legal-terms-content-en" rows="8" required>${escapeHtml(current.terms_content_en)}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label fw-bold small text-primary-bd">
                  বিষয়বস্তু (বাংলা মার্কডাউন)
                  <span class="bilingual-badge-bn">বাংলা</span>
                </label>
                <textarea class="form-control font-monospace small" id="legal-terms-content-bn" rows="8" required>${escapeHtml(current.terms_content_bn)}</textarea>
              </div>
              <div class="col-md-7">
                <div class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" id="legal-terms-reviewed" ${current.terms_reviewed ? 'checked' : ''}>
                  <label class="form-check-label fw-bold text-primary-bd" for="legal-terms-reviewed">
                    ${isBn ? 'ব্যবহারের শর্তাবলী প্রকাশের পূর্বে পর্যালোচিত ও অনুমোদিত' : 'Terms & Conditions reviewed & approved for publication'}
                  </label>
                </div>
              </div>
              <div class="col-md-5">
                <input type="text" class="form-control form-control-sm" id="legal-terms-reviewer" value="${escapeHtml(current.terms_reviewed_by || '')}" placeholder="${isBn ? 'পর্যালোচকের নাম / পদবি' : 'Reviewer name / title'}">
              </div>
            </div>
          </div>
        </div>

        <hr class="my-3">
        <div class="row g-2 align-items-center">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd mb-1">
              ${isBn ? 'অফিসিয়াল যোগাযোগ ইমেইল' : 'Official Contact Email'}
            </label>
            <input type="email" class="form-control form-control-sm" id="legal-contact-email" value="${escapeHtml(current.contact_email)}" required>
          </div>
          <div class="col-md-6 text-md-end pt-md-4">
            <button type="button" class="btn btn-outline-secondary btn-sm" id="legal-reset-defaults-btn">
              <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? 'ডিফল্ট টেমপ্লেট ফিরিয়ে আনুন' : 'Restore Default Templates'}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">${isBn ? 'বাতিল' : 'Cancel'}</button>
        <button type="submit" class="btn btn-accent btn-sm px-4" id="legal-submit-btn">
          <i class="bi bi-save me-1"></i>${isBn ? 'আইনি তথ্য সংরক্ষণ করুন' : 'Save Legal Pages'}
        </button>
      </div>
    </form>
  `;

  document.getElementById('legal-reset-defaults-btn')?.addEventListener('click', () => {
    (document.getElementById('legal-privacy-title-en') as HTMLInputElement).value = DEFAULT_LEGAL_PAGES.privacy_title_en;
    (document.getElementById('legal-privacy-title-bn') as HTMLInputElement).value = DEFAULT_LEGAL_PAGES.privacy_title_bn;
    (document.getElementById('legal-privacy-content-en') as HTMLTextAreaElement).value = DEFAULT_LEGAL_PAGES.privacy_content_en;
    (document.getElementById('legal-privacy-content-bn') as HTMLTextAreaElement).value = DEFAULT_LEGAL_PAGES.privacy_content_bn;
    (document.getElementById('legal-terms-title-en') as HTMLInputElement).value = DEFAULT_LEGAL_PAGES.terms_title_en;
    (document.getElementById('legal-terms-title-bn') as HTMLInputElement).value = DEFAULT_LEGAL_PAGES.terms_title_bn;
    (document.getElementById('legal-terms-content-en') as HTMLTextAreaElement).value = DEFAULT_LEGAL_PAGES.terms_content_en;
    (document.getElementById('legal-terms-content-bn') as HTMLTextAreaElement).value = DEFAULT_LEGAL_PAGES.terms_content_bn;
    (document.getElementById('legal-contact-email') as HTMLInputElement).value = DEFAULT_LEGAL_PAGES.contact_email;
    showToast(isBn ? 'ডিফল্ট টেমপ্লেট লোড করা হয়েছে। সংরক্ষণ করতে Save চাপুন।' : 'Default templates loaded. Click Save to apply.', 'warning');
  });

  document.getElementById('form-cms-legal-pages')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const privacyReviewed = (document.getElementById('legal-privacy-reviewed') as HTMLInputElement).checked;
    const termsReviewed = (document.getElementById('legal-terms-reviewed') as HTMLInputElement).checked;
    const nowIso = new Date().toISOString();

    const updated: LegalPagesConfig = {
      id: 'legal_pages',
      privacy_title_en: (document.getElementById('legal-privacy-title-en') as HTMLInputElement).value.trim(),
      privacy_title_bn: (document.getElementById('legal-privacy-title-bn') as HTMLInputElement).value.trim(),
      privacy_content_en: (document.getElementById('legal-privacy-content-en') as HTMLTextAreaElement).value.trim(),
      privacy_content_bn: (document.getElementById('legal-privacy-content-bn') as HTMLTextAreaElement).value.trim(),
      privacy_reviewed: privacyReviewed,
      privacy_reviewed_by: (document.getElementById('legal-privacy-reviewer') as HTMLInputElement).value.trim(),
      privacy_reviewed_at: privacyReviewed ? (current.privacy_reviewed_at || nowIso) : '',
      terms_title_en: (document.getElementById('legal-terms-title-en') as HTMLInputElement).value.trim(),
      terms_title_bn: (document.getElementById('legal-terms-title-bn') as HTMLInputElement).value.trim(),
      terms_content_en: (document.getElementById('legal-terms-content-en') as HTMLTextAreaElement).value.trim(),
      terms_content_bn: (document.getElementById('legal-terms-content-bn') as HTMLTextAreaElement).value.trim(),
      terms_reviewed: termsReviewed,
      terms_reviewed_by: (document.getElementById('legal-terms-reviewer') as HTMLInputElement).value.trim(),
      terms_reviewed_at: termsReviewed ? (current.terms_reviewed_at || nowIso) : '',
      contact_email: (document.getElementById('legal-contact-email') as HTMLInputElement).value.trim(),
      updated_at: nowIso
    };

    const submitBtn = document.getElementById('legal-submit-btn') as HTMLButtonElement | null;
    if (submitBtn) {
      submitBtn.disabled = true;
    }

    const res = await saveLegalPages(updated);
    if (res.syncedToFirestore) {
      showToast(isBn ? 'আইনি পাতাগুলো সফলভাবে ফায়ারস্টোরে সংরক্ষিত হয়েছে।' : 'Legal pages saved and synced to Firestore.', 'success');
    } else {
      showToast(isBn ? 'লোকাল স্টোরেজে সংরক্ষিত হয়েছে (ফায়ারস্টোর সিঙ্কের জন্য অ্যাডমিন লগইন প্রয়োজন)।' : 'Saved locally (sign in as Firestore admin to sync to cloud).', 'warning');
    }

    const modal = getBsModal('cmsCrudModal');
    if (modal) modal.hide();
    if (onSaved) onSaved();
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}
