/**
 * CMS Reusable Form Modals & Field Validation
 * Modules 1-6 CRUD Forms
 */

import { 
  cmsStore, 
  saveDivision, 
  saveDistrict, 
  saveCategory, 
  saveTouristSpot, 
  saveArticle, 
  saveMediaItem 
} from './cmsState';

import { 
  type Division, 
  type District, 
  type Category, 
  type TouristSpot, 
  type Article, 
  type MediaItem 
} from '../data/bangladeshData';

import { type Language, getTranslation } from '../i18n';
import { uploadImageFile } from '../firebase';
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

// ----------------------------------------------------------------------------
// 1. Division Form Modal
// ----------------------------------------------------------------------------
export function openDivisionFormModal(division?: Division, lang: Language = 'bn', onSaved?: () => void): void {
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

    <form id="form-cms-division">
      <div class="modal-body p-4">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              English Name <span class="text-danger">*</span>
              <span class="bilingual-badge-en">English</span>
            </label>
            <input type="text" class="form-control" id="div-name-en" value="${division?.name_en || ''}" required placeholder="e.g. Sylhet">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              বাংলা নাম <span class="text-danger">*</span>
              <span class="bilingual-badge-bn">বাংলা</span>
            </label>
            <input type="text" class="form-control" id="div-name-bn" value="${division?.name_bn || ''}" required placeholder="যেমন: সিলেট">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              Unique Slug <span class="text-danger">*</span>
            </label>
            <input type="text" class="form-control" id="div-slug" value="${division?.slug || ''}" required placeholder="e.g. sylhet">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              Headquarters (EN / BN)
            </label>
            <div class="input-group">
              <input type="text" class="form-control" id="div-hq-en" value="${division?.headquarters_en || ''}" placeholder="Sylhet">
              <input type="text" class="form-control" id="div-hq-bn" value="${division?.headquarters_bn || ''}" placeholder="সিলেট">
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Area (sq km)</label>
            <input type="number" step="any" class="form-control" id="div-area" value="${division?.area_sq_km || 15000}">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Display Order</label>
            <input type="number" class="form-control" id="div-order" value="${division?.order || cmsStore.divisions.length + 1}">
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">
              Cover Image URL <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <input type="url" class="form-control" id="div-img-url" value="${division?.image_url || ''}" required placeholder="https://images.unsplash.com/...">
              <input type="file" id="div-file-input" accept="image/*" class="d-none">
              <button type="button" class="btn btn-outline-secondary" id="div-browse-btn">
                <i class="bi bi-upload me-1"></i>Upload File
              </button>
            </div>
            <div id="div-img-preview" class="mt-2 ${division?.image_url ? '' : 'd-none'}">
              <img src="${division?.image_url || ''}" class="rounded-2" style="max-height: 100px; object-fit: cover;">
            </div>
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">
              Description (English)
              <span class="bilingual-badge-en">English</span>
            </label>
            <textarea class="form-control" id="div-desc-en" rows="2" placeholder="Summary of division...">${division?.description_en || ''}</textarea>
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">
              বিবরণ (বাংলা)
              <span class="bilingual-badge-bn">বাংলা</span>
            </label>
            <textarea class="form-control" id="div-desc-bn" rows="2" placeholder="বিভাগের সংক্ষিপ্ত পরিচিতি...">${division?.description_bn || ''}</textarea>
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

  // Auto-generate slug from English name
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

  // Image Upload helper
  const fileInput = document.getElementById('div-file-input') as HTMLInputElement;
  const browseBtn = document.getElementById('div-browse-btn');
  const imgUrlInput = document.getElementById('div-img-url') as HTMLInputElement;
  const imgPreview = document.getElementById('div-img-preview');

  browseBtn?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      try {
        if (browseBtn) browseBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Uploading...';
        const url = await uploadImageFile(file, 'divisions');
        imgUrlInput.value = url;
        if (imgPreview) {
          imgPreview.classList.remove('d-none');
          imgPreview.innerHTML = `<img src="${url}" class="rounded-2" style="max-height: 100px; object-fit: cover;">`;
        }
        showToast('Image uploaded successfully', 'success');
      } catch (e: any) {
        showToast(e.message || 'Image upload error', 'error');
      } finally {
        if (browseBtn) browseBtn.innerHTML = '<i class="bi bi-upload me-1"></i>Upload File';
      }
    }
  });

  // Submit Handler
  const form = document.getElementById('form-cms-division');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const slug = slugInput.value.trim();

    // Slug duplication check
    const duplicate = cmsStore.divisions.some(d => d.slug === slug && d.id !== division?.id);
    if (duplicate) {
      showToast('Division slug already exists. Please enter a unique slug.', 'error');
      return;
    }

    const newDiv: Division = {
      id: division?.id || 'div_' + slug,
      name_en: nameEnInput.value.trim(),
      name_bn: (document.getElementById('div-name-bn') as HTMLInputElement).value.trim(),
      slug: slug,
      headquarters_en: (document.getElementById('div-hq-en') as HTMLInputElement).value.trim(),
      headquarters_bn: (document.getElementById('div-hq-bn') as HTMLInputElement).value.trim(),
      area_sq_km: parseFloat((document.getElementById('div-area') as HTMLInputElement).value) || 10000,
      districts_count: division?.districts_count || 0,
      order: parseInt((document.getElementById('div-order') as HTMLInputElement).value, 10) || 1,
      image_url: imgUrlInput.value.trim(),
      description_en: (document.getElementById('div-desc-en') as HTMLTextAreaElement).value.trim(),
      description_bn: (document.getElementById('div-desc-bn') as HTMLTextAreaElement).value.trim(),
      is_published: (document.getElementById('div-published') as HTMLInputElement).checked
    };

    const submitBtn = document.getElementById('div-submit-btn') as HTMLButtonElement;
    if (submitBtn) submitBtn.disabled = true;

    try {
      await saveDivision(newDiv);
      showToast(isEdit ? 'Division updated successfully!' : 'Division created successfully!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showToast(err.message || 'Error saving division', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ----------------------------------------------------------------------------
// 2. District Form Modal
// ----------------------------------------------------------------------------
export function openDistrictFormModal(district?: District, lang: Language = 'bn', onSaved?: () => void): void {
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

    <form id="form-cms-district">
      <div class="modal-body p-4">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              Division <span class="text-danger">*</span>
            </label>
            <select class="form-select" id="dist-division-id" required>
              ${cmsStore.divisions.map(d => `
                <option value="${d.id}" ${district?.division_id === d.id ? 'selected' : ''}>
                  ${isBn ? d.name_bn : d.name_en}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              Unique Slug <span class="text-danger">*</span>
            </label>
            <input type="text" class="form-control" id="dist-slug" value="${district?.slug || ''}" required placeholder="e.g. cox-bazar">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              English Name <span class="text-danger">*</span>
              <span class="bilingual-badge-en">English</span>
            </label>
            <input type="text" class="form-control" id="dist-name-en" value="${district?.name_en || ''}" required placeholder="District Name">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              বাংলা নাম <span class="text-danger">*</span>
              <span class="bilingual-badge-bn">বাংলা</span>
            </label>
            <input type="text" class="form-control" id="dist-name-bn" value="${district?.name_bn || ''}" required placeholder="জেলার নাম">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Famous For (English)</label>
            <input type="text" class="form-control" id="dist-famous-en" value="${district?.famous_for_en || ''}" placeholder="e.g. Coral beach, Sea fish">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">বিখ্যাত পণ্য বা ঐতিহ্য (বাংলা)</label>
            <input type="text" class="form-control" id="dist-famous-bn" value="${district?.famous_for_bn || ''}" placeholder="যেমন: শুঁটকি, সমুদ্র সৈকত">
          </div>

          <!-- Location Coordinates -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              <i class="bi bi-pin-map text-warning me-1"></i>Latitude
            </label>
            <input type="number" step="any" class="form-control" id="dist-lat" value="${district?.latitude || 23.81}" placeholder="e.g. 23.8103">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">
              <i class="bi bi-pin-map text-warning me-1"></i>Longitude
            </label>
            <input type="number" step="any" class="form-control" id="dist-long" value="${district?.longitude || 90.41}" placeholder="e.g. 90.4125">
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">
              Cover Image URL <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <input type="url" class="form-control" id="dist-img-url" value="${district?.image_url || ''}" required placeholder="https://...">
              <input type="file" id="dist-file-input" accept="image/*" class="d-none">
              <button type="button" class="btn btn-outline-secondary" id="dist-browse-btn">
                <i class="bi bi-upload me-1"></i>Upload
              </button>
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Description (English)</label>
            <textarea class="form-control" id="dist-desc-en" rows="2">${district?.description_en || ''}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">বিবরণ (বাংলা)</label>
            <textarea class="form-control" id="dist-desc-bn" rows="2">${district?.description_bn || ''}</textarea>
          </div>

          <!-- SEO Configuration -->
          <div class="col-12">
            <div class="p-3 rounded-3 bg-light border">
              <h6 class="fw-bold text-primary-bd mb-2 small"><i class="bi bi-search me-1"></i>SEO Configuration</h6>
              <div class="row g-2">
                <div class="col-md-6">
                  <input type="text" class="form-control form-control-sm" id="dist-seo-title" value="${district?.seo_title_en || ''}" placeholder="SEO Page Title (e.g. Travel Guide to Cox's Bazar)">
                </div>
                <div class="col-md-6">
                  <input type="text" class="form-control form-control-sm" id="dist-seo-desc" value="${district?.seo_description_en || ''}" placeholder="SEO Meta Description">
                </div>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="form-check form-switch mt-1">
              <input class="form-check-input" type="checkbox" id="dist-published" ${(!district || district.is_published) ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="dist-published">Published Status (Uncheck to save as draft)</label>
            </div>
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

  // Auto-slug
  const nameInput = document.getElementById('dist-name-en') as HTMLInputElement;
  const slugInput = document.getElementById('dist-slug') as HTMLInputElement;
  nameInput?.addEventListener('input', () => {
    if (!isEdit && !slugInput.dataset.manual) {
      slugInput.value = generateSlug(nameInput.value);
    }
  });

  // File upload
  const fileInput = document.getElementById('dist-file-input') as HTMLInputElement;
  const browseBtn = document.getElementById('dist-browse-btn');
  const imgUrlInput = document.getElementById('dist-img-url') as HTMLInputElement;
  browseBtn?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
      try {
        if (browseBtn) browseBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        const url = await uploadImageFile(fileInput.files[0], 'districts');
        imgUrlInput.value = url;
        showToast('Image uploaded', 'success');
      } catch (e: any) {
        showToast(e.message || 'Upload failed', 'error');
      } finally {
        if (browseBtn) browseBtn.innerHTML = '<i class="bi bi-upload me-1"></i>Upload';
      }
    }
  });

  // Submit
  const form = document.getElementById('form-cms-district');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const slug = slugInput.value.trim();

    const newDist: District = {
      id: district?.id || 'dist_' + slug,
      division_id: (document.getElementById('dist-division-id') as HTMLSelectElement).value,
      name_en: nameInput.value.trim(),
      name_bn: (document.getElementById('dist-name-bn') as HTMLInputElement).value.trim(),
      slug: slug,
      famous_for_en: (document.getElementById('dist-famous-en') as HTMLInputElement).value.trim(),
      famous_for_bn: (document.getElementById('dist-famous-bn') as HTMLInputElement).value.trim(),
      latitude: parseFloat((document.getElementById('dist-lat') as HTMLInputElement).value) || 23.8,
      longitude: parseFloat((document.getElementById('dist-long') as HTMLInputElement).value) || 90.4,
      image_url: imgUrlInput.value.trim(),
      description_en: (document.getElementById('dist-desc-en') as HTMLTextAreaElement).value.trim(),
      description_bn: (document.getElementById('dist-desc-bn') as HTMLTextAreaElement).value.trim(),
      seo_title_en: (document.getElementById('dist-seo-title') as HTMLInputElement).value.trim(),
      seo_description_en: (document.getElementById('dist-seo-desc') as HTMLInputElement).value.trim(),
      is_published: (document.getElementById('dist-published') as HTMLInputElement).checked,
      popular_spots_count: district?.popular_spots_count || 0
    };

    try {
      await saveDistrict(newDist);
      showToast(isEdit ? 'District updated successfully!' : 'District created successfully!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showToast(err.message || 'Error saving district', 'error');
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ----------------------------------------------------------------------------
// 3. Category Form Modal
// ----------------------------------------------------------------------------
export function openCategoryFormModal(category?: Category, lang: Language = 'bn', onSaved?: () => void): void {
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

    <form id="form-cms-category">
      <div class="modal-body p-4">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Category (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="cat-name-en" value="${category?.name_en || ''}" required placeholder="e.g. Waterfalls & Streams">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">ক্যাটাগরি (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="cat-name-bn" value="${category?.name_bn || ''}" required placeholder="যেমন: ঝর্ণা ও জলপ্রপাত">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Slug <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="cat-slug" value="${category?.slug || ''}" required placeholder="waterfalls">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Icon Class (Bootstrap Icons)</label>
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
            <label class="form-label fw-bold small text-primary-bd">Category Cover Image URL</label>
            <input type="url" class="form-control" id="cat-img-url" value="${category?.image_url || ''}" placeholder="https://...">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Description (English)</label>
            <textarea class="form-control" id="cat-desc-en" rows="2">${category?.description_en || ''}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">বিবরণ (বাংলা)</label>
            <textarea class="form-control" id="cat-desc-bn" rows="2">${category?.description_bn || ''}</textarea>
          </div>

          <div class="col-12">
            <div class="form-check form-switch mt-1">
              <input class="form-check-input" type="checkbox" id="cat-published" ${(!category || category.is_published) ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="cat-published">Active / Published</label>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4">
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

  const form = document.getElementById('form-cms-category');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const slug = slugInput.value.trim();

    const newCat: Category = {
      id: category?.id || 'cat_' + slug,
      name_en: nameInput.value.trim(),
      name_bn: (document.getElementById('cat-name-bn') as HTMLInputElement).value.trim(),
      slug: slug,
      icon: (document.getElementById('cat-icon') as HTMLSelectElement).value,
      image_url: (document.getElementById('cat-img-url') as HTMLInputElement).value.trim(),
      description_en: (document.getElementById('cat-desc-en') as HTMLTextAreaElement).value.trim(),
      description_bn: (document.getElementById('cat-desc-bn') as HTMLTextAreaElement).value.trim(),
      is_published: (document.getElementById('cat-published') as HTMLInputElement).checked
    };

    try {
      await saveCategory(newCat);
      showToast(isEdit ? 'Category updated!' : 'Category created!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showToast(err.message || 'Error saving category', 'error');
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ----------------------------------------------------------------------------
// 4. Tourist Spot Form Modal
// ----------------------------------------------------------------------------
export function openSpotFormModal(spot?: TouristSpot, lang: Language = 'bn', onSaved?: () => void): void {
  const container = document.getElementById('cmsCrudModalContent');
  if (!container) return;

  const isEdit = !!spot;
  const isBn = lang === 'bn';
  const initialDivisionId = spot?.division_id || cmsStore.divisions[0]?.id || 'dhaka';

  container.innerHTML = `
    <div class="modal-travel-header d-flex justify-content-between align-items-center">
      <h5 class="modal-title fw-bold text-white mb-0">
        <i class="bi bi-compass me-2 text-warning"></i>
        ${isEdit ? (isBn ? 'দর্শনীয় স্থান সম্পাদনা করুন' : 'Edit Tourist Spot') : (isBn ? 'নতুন দর্শনীয় স্থান যোগ করুন' : 'Add New Tourist Spot')}
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>

    <form id="form-cms-spot">
      <div class="modal-body p-4" style="max-height: 72vh; overflow-y: auto;">
        <div class="row g-3">
          <!-- Geography Selectors -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Division <span class="text-danger">*</span></label>
            <select class="form-select" id="spot-division-id" required>
              ${cmsStore.divisions.map(d => `
                <option value="${d.id}" ${initialDivisionId === d.id ? 'selected' : ''}>
                  ${isBn ? d.name_bn : d.name_en}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">District <span class="text-danger">*</span></label>
            <select class="form-select" id="spot-district-id" required>
              <!-- Filled dynamically by division filter -->
            </select>
          </div>

          <!-- Multi-Category Select -->
          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">Categories (Select one or more) <span class="text-danger">*</span></label>
            <div class="d-flex flex-wrap gap-2 p-2 rounded bg-light border" id="spot-categories-container">
              ${cmsStore.categories.map(c => `
                <div class="form-check form-check-inline me-3">
                  <input class="form-check-input spot-cat-cb" type="checkbox" value="${c.id}" id="cat-cb-${c.id}" ${(spot?.category_ids || []).includes(c.id) ? 'checked' : ''}>
                  <label class="form-check-label small" for="cat-cb-${c.id}">${isBn ? c.name_bn : c.name_en}</label>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Names & Slug -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Spot Name (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="spot-name-en" value="${spot?.name_en || ''}" required placeholder="e.g. Inani Beach">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">স্থানের নাম (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="spot-name-bn" value="${spot?.name_bn || ''}" required placeholder="যেমন: ইনানী পাথুরে সৈকত">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Slug <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="spot-slug" value="${spot?.slug || ''}" required placeholder="inani-beach">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Rating (1.0 to 5.0)</label>
            <input type="number" step="0.1" min="1" max="5" class="form-control" id="spot-rating" value="${spot?.rating || 4.8}">
          </div>

          <!-- Short descriptions -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Short Tagline (English)</label>
            <input type="text" class="form-control" id="spot-short-en" value="${spot?.short_desc_en || ''}" placeholder="One line summary...">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">এক লাইনে বর্ণনা (বাংলা)</label>
            <input type="text" class="form-control" id="spot-short-bn" value="${spot?.short_desc_bn || ''}" placeholder="সংক্ষিপ্ত এক লাইন...">
          </div>

          <!-- Full Overview -->
          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">Detailed Overview (English)</label>
            <textarea class="form-control" id="spot-overview-en" rows="3">${spot?.overview_en || ''}</textarea>
          </div>
          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">বিস্তারিত বিবরণ (বাংলা)</label>
            <textarea class="form-control" id="spot-overview-bn" rows="3">${spot?.overview_bn || ''}</textarea>
          </div>

          <!-- History & Heritage -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">History & Heritage (English)</label>
            <textarea class="form-control" id="spot-history-en" rows="2">${spot?.history_en || ''}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">ইতিহাস ও ঐতিহ্য (বাংলা)</label>
            <textarea class="form-control" id="spot-history-bn" rows="2">${spot?.history_bn || ''}</textarea>
          </div>

          <!-- Logistics: How to go & Best season -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">How to Reach (Transportation guide)</label>
            <textarea class="form-control" id="spot-how-en" rows="2">${spot?.how_to_go_en || ''}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">কীভাবে যাবেন (যাতায়াত গাইড)</label>
            <textarea class="form-control" id="spot-how-bn" rows="2">${spot?.how_to_go_bn || ''}</textarea>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Best Visiting Time / Season</label>
            <input type="text" class="form-control" id="spot-best-en" value="${spot?.best_time_en || ''}" placeholder="e.g. October to March">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">ভ্রমণের সেরা সময় (বাংলা)</label>
            <input type="text" class="form-control" id="spot-best-bn" value="${spot?.best_time_bn || ''}" placeholder="যেমন: অক্টোবর থেকে মার্চ">
          </div>

          <!-- Safety & Travel Tips -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Essential Travel Tips (English)</label>
            <textarea class="form-control" id="spot-tips-en" rows="2">${spot?.tips_en || ''}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">জরুরি পরামর্শ ও সতর্কতা (বাংলা)</label>
            <textarea class="form-control" id="spot-tips-bn" rows="2">${spot?.tips_bn || ''}</textarea>
          </div>

          <!-- Images & Google Maps -->
          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">Cover Image URL <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="url" class="form-control" id="spot-img-url" value="${spot?.image_url || ''}" required placeholder="https://...">
              <input type="file" id="spot-file-input" accept="image/*" class="d-none">
              <button type="button" class="btn btn-outline-secondary" id="spot-browse-btn">
                <i class="bi bi-upload me-1"></i>Upload
              </button>
            </div>
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">Photo Gallery URLs (Comma separated)</label>
            <textarea class="form-control" id="spot-gallery-urls" rows="2" placeholder="https://url1, https://url2">${(spot?.gallery_urls || []).join(', ')}</textarea>
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">Google Maps URL / Coordinates Link</label>
            <input type="url" class="form-control" id="spot-maps-url" value="${spot?.google_maps_url || ''}" placeholder="https://maps.google.com/?q=...">
          </div>

          <!-- Featured & Published Flags -->
          <div class="col-md-6">
            <div class="form-check form-switch mt-2">
              <input class="form-check-input" type="checkbox" id="spot-featured" ${spot?.is_featured ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="spot-featured">Mark as Featured on Home</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch mt-2">
              <input class="form-check-input" type="checkbox" id="spot-published" ${(!spot || spot.is_published) ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="spot-published">Published Status (Publicly visible)</label>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4">
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
    distSelect.innerHTML = matchingDistricts.map(d => `
      <option value="${d.id}" ${spot?.district_id === d.id ? 'selected' : ''}>
        ${isBn ? d.name_bn : d.name_en}
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

  // Image Upload helper
  const fileInput = document.getElementById('spot-file-input') as HTMLInputElement;
  const browseBtn = document.getElementById('spot-browse-btn');
  const imgUrlInput = document.getElementById('spot-img-url') as HTMLInputElement;
  browseBtn?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
      try {
        if (browseBtn) browseBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        const url = await uploadImageFile(fileInput.files[0], 'spots');
        imgUrlInput.value = url;
        showToast('Image uploaded', 'success');
      } catch (e: any) {
        showToast(e.message || 'Upload failed', 'error');
      } finally {
        if (browseBtn) browseBtn.innerHTML = '<i class="bi bi-upload me-1"></i>Upload';
      }
    }
  });

  // Submit Handler
  const form = document.getElementById('form-cms-spot');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const slug = slugInput.value.trim();

    // Collect selected categories
    const selectedCats: string[] = [];
    document.querySelectorAll('.spot-cat-cb:checked').forEach((cb: any) => {
      selectedCats.push(cb.value);
    });

    if (selectedCats.length === 0) {
      showToast('Please select at least one category tag.', 'warning');
      return;
    }

    const galleryText = (document.getElementById('spot-gallery-urls') as HTMLTextAreaElement).value;
    const galleryUrls = galleryText.split(',').map(u => u.trim()).filter(Boolean);

    const newSpot: TouristSpot = {
      id: spot?.id || 'spot_' + slug,
      division_id: divSelect.value,
      district_id: distSelect.value,
      category_ids: selectedCats,
      name_en: nameInput.value.trim(),
      name_bn: (document.getElementById('spot-name-bn') as HTMLInputElement).value.trim(),
      slug: slug,
      rating: parseFloat((document.getElementById('spot-rating') as HTMLInputElement).value) || 4.8,
      short_desc_en: (document.getElementById('spot-short-en') as HTMLInputElement).value.trim(),
      short_desc_bn: (document.getElementById('spot-short-bn') as HTMLInputElement).value.trim(),
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
      image_url: imgUrlInput.value.trim(),
      gallery_urls: galleryUrls,
      google_maps_url: (document.getElementById('spot-maps-url') as HTMLInputElement).value.trim(),
      is_featured: (document.getElementById('spot-featured') as HTMLInputElement).checked,
      is_published: (document.getElementById('spot-published') as HTMLInputElement).checked,
      created_at: spot?.created_at || new Date().toISOString()
    };

    try {
      await saveTouristSpot(newSpot);
      showToast(isEdit ? 'Tourist Spot updated!' : 'Tourist Spot created!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showToast(err.message || 'Error saving spot', 'error');
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ----------------------------------------------------------------------------
// 5. Travel Guide / Article Form Modal with Rich Text Toolbar
// ----------------------------------------------------------------------------
export function openArticleFormModal(article?: Article, lang: Language = 'bn', onSaved?: () => void): void {
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

    <form id="form-cms-article">
      <div class="modal-body p-4" style="max-height: 72vh; overflow-y: auto;">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Title (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="art-title-en" value="${article?.title_en || ''}" required placeholder="Guide Title">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">শিরোনাম (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="art-title-bn" value="${article?.title_bn || ''}" required placeholder="গাইডের শিরোনাম">
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Slug <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="art-slug" value="${article?.slug || ''}" required placeholder="travel-guide-slug">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Author & Read Time</label>
            <div class="input-group">
              <input type="text" class="form-control" id="art-author-en" value="${article?.author_en || 'Travel Desk'}" placeholder="Author">
              <input type="text" class="form-control" id="art-read-en" value="${article?.read_time_en || '6 min read'}" placeholder="Read time">
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Related District Destination</label>
            <select class="form-select" id="art-district-id">
              <option value="">${isBn ? 'সমগ্র বাংলাদেশ (কোনো নির্দিষ্ট জেলা নয়)' : 'All Bangladesh (General Guide)'}</option>
              ${cmsStore.districts.map(d => `
                <option value="${d.id}" ${article?.related_district_id === d.id ? 'selected' : ''}>
                  ${isBn ? d.name_bn : d.name_en}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Tags (Comma-separated)</label>
            <input type="text" class="form-control" id="art-tags" value="${(article?.tags || []).join(', ')}" placeholder="Sundarbans, Wildlife, Tips">
          </div>

          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">Cover Image URL <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="url" class="form-control" id="art-img-url" value="${article?.image_url || ''}" required placeholder="https://...">
              <input type="file" id="art-file-input" accept="image/*" class="d-none">
              <button type="button" class="btn btn-outline-secondary" id="art-browse-btn">
                <i class="bi bi-upload me-1"></i>Upload
              </button>
            </div>
          </div>

          <!-- Excerpt -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Summary / Excerpt (English)</label>
            <textarea class="form-control" id="art-excerpt-en" rows="2">${article?.excerpt_en || ''}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">সংক্ষিপ্ত সারসংক্ষেপ (বাংলা)</label>
            <textarea class="form-control" id="art-excerpt-bn" rows="2">${article?.excerpt_bn || ''}</textarea>
          </div>

          <!-- Rich Text Content Editor (English) -->
          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">Article Body (English Content)</label>
            <div class="cms-editor-toolbar">
              <button type="button" class="cms-editor-btn" data-insert-tag="en,**bold**"><b>B</b></button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,*italic*"><i>I</i></button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,### Heading">H3</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,\n- List item">• List</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="en,\n> Quote">Quote</button>
            </div>
            <textarea class="form-control cms-editor-textarea" id="art-content-en" rows="5" placeholder="Write full article in Markdown...">${article?.content_en || ''}</textarea>
          </div>

          <!-- Rich Text Content Editor (Bengali) -->
          <div class="col-12">
            <label class="form-label fw-bold small text-primary-bd">আর্টিকেল মূল বিষয়বস্তু (বাংলা কনটেন্ট)</label>
            <div class="cms-editor-toolbar">
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,**গাঢ় লেখা**"><b>B</b></button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,*বাঁকা লেখা*"><i>I</i></button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,### শিরোনাম">H3</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,\n- তালিকা পয়েন্ট">• তালিকা</button>
              <button type="button" class="cms-editor-btn" data-insert-tag="bn,\n> উদ্ধৃতি">উদ্ধৃতি</button>
            </div>
            <textarea class="form-control cms-editor-textarea" id="art-content-bn" rows="5" placeholder="সম্পূর্ণ ভ্রমণ গাইড বাংলায় লিখুন...">${article?.content_bn || ''}</textarea>
          </div>

          <!-- Status & Scheduling -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Publication Status</label>
            <select class="form-select" id="art-status">
              <option value="published" ${article?.status === 'published' || article?.is_published ? 'selected' : ''}>Published Now</option>
              <option value="draft" ${article?.status === 'draft' || (!article?.is_published && article?.status !== 'scheduled') ? 'selected' : ''}>Save as Draft</option>
              <option value="scheduled" ${article?.status === 'scheduled' ? 'selected' : ''}>Schedule for Future Date</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Schedule Date (Optional)</label>
            <input type="datetime-local" class="form-control" id="art-scheduled-at" value="${article?.scheduled_at || ''}">
          </div>
        </div>
      </div>

      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-accent btn-sm px-4">
          <i class="bi bi-save me-1"></i>${isEdit ? 'Save Changes' : 'Publish Article'}
        </button>
      </div>
    </form>
  `;

  // Auto-slug
  const nameInput = document.getElementById('art-title-en') as HTMLInputElement;
  const slugInput = document.getElementById('art-slug') as HTMLInputElement;
  nameInput?.addEventListener('input', () => {
    if (!isEdit && !slugInput.dataset.manual) {
      slugInput.value = generateSlug(nameInput.value);
    }
  });

  // Rich text toolbar inserter
  document.querySelectorAll('[data-insert-tag]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-insert-tag') || '';
      const [langCode, snippet] = val.split(',');
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

  // Image upload
  const fileInput = document.getElementById('art-file-input') as HTMLInputElement;
  const browseBtn = document.getElementById('art-browse-btn');
  const imgUrlInput = document.getElementById('art-img-url') as HTMLInputElement;
  browseBtn?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
      try {
        if (browseBtn) browseBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        const url = await uploadImageFile(fileInput.files[0], 'articles');
        imgUrlInput.value = url;
        showToast('Cover image uploaded', 'success');
      } catch (e: any) {
        showToast(e.message || 'Upload failed', 'error');
      } finally {
        if (browseBtn) browseBtn.innerHTML = '<i class="bi bi-upload me-1"></i>Upload';
      }
    }
  });

  // Submit Handler
  const form = document.getElementById('form-cms-article');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const slug = slugInput.value.trim();
    const statusVal = (document.getElementById('art-status') as HTMLSelectElement).value as any;
    const isPub = statusVal === 'published';

    const tagsArr = (document.getElementById('art-tags') as HTMLInputElement).value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newArt: Article = {
      id: article?.id || 'art_' + slug,
      title_en: nameInput.value.trim(),
      title_bn: (document.getElementById('art-title-bn') as HTMLInputElement).value.trim(),
      slug: slug,
      author_en: (document.getElementById('art-author-en') as HTMLInputElement).value.trim(),
      author_bn: isBn ? 'বাংলাদেশ ভ্রমণ ডেস্ক' : 'Tourism Board Travel Desk',
      read_time_en: (document.getElementById('art-read-en') as HTMLInputElement).value.trim(),
      read_time_bn: isBn ? '৫ মিনিট পঠন' : '5 min read',
      excerpt_en: (document.getElementById('art-excerpt-en') as HTMLTextAreaElement).value.trim(),
      excerpt_bn: (document.getElementById('art-excerpt-bn') as HTMLTextAreaElement).value.trim(),
      content_en: (document.getElementById('art-content-en') as HTMLTextAreaElement).value.trim(),
      content_bn: (document.getElementById('art-content-bn') as HTMLTextAreaElement).value.trim(),
      related_district_id: (document.getElementById('art-district-id') as HTMLSelectElement).value,
      image_url: imgUrlInput.value.trim(),
      tags: tagsArr,
      status: statusVal,
      scheduled_at: (document.getElementById('art-scheduled-at') as HTMLInputElement).value,
      is_published: isPub,
      published_at: article?.published_at || new Date().toISOString().split('T')[0]
    };

    try {
      await saveArticle(newArt);
      showToast(isEdit ? 'Article updated!' : 'Article published!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onSaved) onSaved();
    } catch (err: any) {
      showToast(err.message || 'Error saving article', 'error');
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ----------------------------------------------------------------------------
// 6. Image Manager Upload Modal with File Validation
// ----------------------------------------------------------------------------
export function openMediaUploadModal(lang: Language = 'bn', onUploaded?: () => void): void {
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

    <form id="form-cms-media-upload">
      <div class="modal-body p-4">
        <div class="mb-3">
          <label class="form-label fw-bold small text-primary-bd">Select Image File (Max 5MB) <span class="text-danger">*</span></label>
          <input type="file" id="media-upload-input" class="form-control" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" required>
          <div class="small text-muted mt-1">Allowed types: JPEG, PNG, WEBP, GIF, SVG. Max file size: 5 Megabytes.</div>
        </div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">Alternative Text (English) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="media-alt-en" required placeholder="Describe the image...">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold small text-primary-bd">অল্ট-টেক্সট বিবরণ (বাংলা) <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="media-alt-bn" required placeholder="ছবির বিবরণ বাংলায়...">
          </div>
        </div>

        <div id="media-preview-box" class="mt-3 p-2 rounded bg-light border text-center d-none">
          <img id="media-preview-img" src="" class="rounded" style="max-height: 180px; max-width: 100%;">
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
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      // File validation: Size <= 5MB
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit. Please select a smaller image.', 'error');
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
    if (!fileInput.files || !fileInput.files[0]) {
      showToast('Please select a valid image file.', 'warning');
      return;
    }

    const file = fileInput.files[0];
    const submitBtn = document.getElementById('media-submit-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Uploading...';
    }

    try {
      const downloadUrl = await uploadImageFile(file, 'media_library');
      const newItem: MediaItem = {
        id: 'media_' + Date.now(),
        url: downloadUrl,
        file_name: file.name,
        alt_en: (document.getElementById('media-alt-en') as HTMLInputElement).value.trim(),
        alt_bn: (document.getElementById('media-alt-bn') as HTMLInputElement).value.trim(),
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString()
      };

      await saveMediaItem(newItem);
      showToast('Image uploaded and registered successfully!', 'success');
      const modal = getBsModal('cmsCrudModal');
      if (modal) modal.hide();
      if (onUploaded) onUploaded();
    } catch (err: any) {
      showToast(err.message || 'Image upload error', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  const modal = getBsModal('cmsCrudModal');
  if (modal) modal.show();
}

// ----------------------------------------------------------------------------
// 7. Full Image Preview Zoom Modal
// ----------------------------------------------------------------------------
export function openImagePreviewModal(imageUrl: string): void {
  const container = document.getElementById('cmsImagePreviewContent');
  if (!container) return;

  container.innerHTML = `
    <div class="d-flex justify-content-end mb-2">
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <img src="${imageUrl}" class="img-fluid rounded" style="max-height: 80vh;" alt="Preview">
    <div class="mt-2 small text-white-50 word-break">${imageUrl}</div>
  `;

  const modal = getBsModal('cmsImagePreviewModal');
  if (modal) modal.show();
}
