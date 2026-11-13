/**
 * All 64 Districts Directory Page Controller
 * URL: /districts/
 * Displays all 64 official districts of Bangladesh retrieved from Firestore with bilingual search,
 * division filter dropdown, reset filters, pagination, loading skeletons, empty & error states.
 */

import {
  type Division,
  type District,
  type TouristSpot
} from '../data/bangladeshData';
import { type Language, formatLocalizedNumber } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';
import {
  renderBreadcrumbs,
  renderDistrictCard
} from '../components';
import {
  renderCardSkeleton,
  renderEmptyState,
  renderErrorState
} from '../utils/stateFeedback';

export const DISTRICTS_PER_PAGE = 16;

export interface DistrictsDirectoryPageProps {
  lang: Language;
  divisions: Division[];
  districts: District[];
  spots: TouristSpot[];
  searchQuery: string;
  divisionFilter: string;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

const HERO_BG_IMAGE =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80';

function matchesDistrictDivision(district: District, divisionFilter: string, divisions: Division[]): boolean {
  if (!divisionFilter || divisionFilter === 'all') return true;
  const target = divisionFilter.trim().toLowerCase();
  const distDiv = (district.division_id || '').trim().toLowerCase();
  if (distDiv === target) return true;
  const matchedDiv = divisions.find(
    d => d.id.toLowerCase() === target || (d.slug || '').toLowerCase() === target
  );
  if (!matchedDiv) return false;
  return (
    distDiv === matchedDiv.id.toLowerCase() ||
    (!!matchedDiv.slug && distDiv === matchedDiv.slug.toLowerCase())
  );
}

export function getFilteredDistricts(
  districts: District[],
  divisions: Division[],
  searchQuery: string,
  divisionFilter: string
): District[] {
  const publishedDistricts = districts.filter(d => d.is_published !== false);
  const q = searchQuery.trim().toLowerCase();

  return publishedDistricts.filter(dist => {
    if (!matchesDistrictDivision(dist, divisionFilter, divisions)) {
      return false;
    }
    if (q) {
      const matchBn = dist.name_bn.toLowerCase().includes(q);
      const matchEn = dist.name_en.toLowerCase().includes(q);
      const matchSlug = (dist.slug || '').toLowerCase().includes(q);
      const matchFamous =
        (dist.famous_for_bn || '').toLowerCase().includes(q) ||
        (dist.famous_for_en || '').toLowerCase().includes(q);
      if (!matchBn && !matchEn && !matchSlug && !matchFamous) {
        return false;
      }
    }
    return true;
  });
}

function renderPaginationControls(
  currentPage: number,
  totalPages: number,
  lang: Language
): string {
  if (totalPages <= 1) return '';
  const isBn = lang === 'bn';

  const pages: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    pages.push(p);
  }

  return `
    <nav aria-label="${isBn ? 'জেলা পাতা নেভিগেশন' : 'Districts pagination'}" class="mt-4 pt-2 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
      <div class="small text-secondary fw-medium">
        ${isBn
          ? `পাতা ${formatLocalizedNumber(currentPage, lang)} / ${formatLocalizedNumber(totalPages, lang)}`
          : `Page ${currentPage} of ${totalPages}`}
      </div>
      <ul class="pagination pagination-md mb-0 flex-wrap justify-content-center gap-1">
        <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
          <button
            type="button"
            class="page-link rounded-3 px-3"
            id="districts-page-prev"
            ${currentPage <= 1 ? 'disabled aria-disabled="true"' : ''}
            aria-label="${isBn ? 'পূর্ববর্তী পাতা' : 'Previous page'}"
          >
            <i class="bi bi-chevron-left me-1"></i>${isBn ? 'পূর্ববর্তী' : 'Prev'}
          </button>
        </li>
        ${pages
          .map(
            p => `
              <li class="page-item ${p === currentPage ? 'active' : ''}">
                <button
                  type="button"
                  class="page-link rounded-3 px-3 district-page-btn ${p === currentPage ? 'bg-primary-bd border-success text-white fw-bold' : ''}"
                  data-page="${p}"
                  aria-current="${p === currentPage ? 'page' : 'false'}"
                >
                  ${formatLocalizedNumber(p, lang)}
                </button>
              </li>
            `
          )
          .join('')}
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
          <button
            type="button"
            class="page-link rounded-3 px-3"
            id="districts-page-next"
            ${currentPage >= totalPages ? 'disabled aria-disabled="true"' : ''}
            aria-label="${isBn ? 'পরবর্তী পাতা' : 'Next page'}"
          >
            ${isBn ? 'পরবর্তী' : 'Next'}<i class="bi bi-chevron-right ms-1"></i>
          </button>
        </li>
      </ul>
    </nav>
  `;
}

export function renderAllDistrictsPage(props: DistrictsDirectoryPageProps): string {
  const {
    lang,
    divisions,
    districts,
    spots,
    searchQuery,
    divisionFilter,
    currentPage,
    isLoading,
    error
  } = props;

  const isBn = lang === 'bn';
  const publishedDivisions = divisions.filter(d => d.is_published !== false);
  const publishedDistricts = districts.filter(d => d.is_published !== false);
  const publishedSpots = spots.filter(s => s.is_published !== false);

  const filteredDistricts = getFilteredDistricts(
    publishedDistricts,
    publishedDivisions,
    searchQuery,
    divisionFilter
  );

  const totalItems = filteredDistricts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / DISTRICTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * DISTRICTS_PER_PAGE;
  const endIndex = Math.min(startIndex + DISTRICTS_PER_PAGE, totalItems);
  const paginatedDistricts = filteredDistricts.slice(startIndex, endIndex);

  const hasActiveFilters = searchQuery.trim().length > 0 || (divisionFilter !== 'all' && divisionFilter !== '');
  const selectedDivObj = publishedDivisions.find(
    d => d.id === divisionFilter || d.slug === divisionFilter
  );

  return `
    <!-- 1. Breadcrumb Navigation -->
    <div class="bg-white border-bottom">
      <div class="container py-2">
        ${renderBreadcrumbs(
          [{ labelBn: 'বাংলাদেশের ৬৪ জেলা', labelEn: '64 Districts' }],
          lang
        )}
      </div>
    </div>

    <!-- 2 & 3. Hero Page Heading (Bengali & English) + Introduction -->
    <section
      class="hero-wrapper"
      style="min-height: 360px; padding: 3.25rem 0 4.25rem; background: linear-gradient(135deg, rgba(18, 60, 50, 0.93) 0%, rgba(28, 89, 72, 0.84) 100%), url('${HERO_BG_IMAGE}') center/cover no-repeat;"
    >
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-8">
            <div class="hero-pill-badge">
              <i class="bi bi-geo-alt-fill"></i>
              <span>${isBn ? 'অফিসিয়াল জেলা ডিরেক্টরি' : 'Official 64 Districts Directory'}</span>
            </div>
            <h1 class="hero-title mb-2">
              ${isBn ? 'বাংলাদেশের ৬৪ জেলা' : 'All 64 Districts of Bangladesh'}
            </h1>
            <p class="fs-5 text-warning fw-semibold mb-3 opacity-90">
              ${isBn ? 'All 64 Districts of Bangladesh' : 'বাংলাদেশের ৬৪ জেলার সম্পূর্ণ তালিকা'}
            </p>
            <p class="hero-subtitle mb-0">
              ${isBn
                ? 'দেশের ৮টি প্রশাসনিক বিভাগের অধীন সকল ৬৪ জেলার বাংলা ও ইংরেজি নাম, ঐতিহ্যবাহী পরিচিতি, বিখ্যাত খাবার ও দর্শনীয় স্থানসমূহ সহজেই খুঁজুন এবং প্রতিটি জেলার বিস্তারিত গাইড অন্বেষণ করুন।'
                : 'Explore the complete official directory of all 64 administrative districts across Bangladesh’s 8 divisions—search seamlessly in Bengali or English, filter by division, and discover each district’s heritage and landmarks.'}
            </p>
          </div>

          <div class="col-lg-4">
            <div class="p-4 rounded-4 text-white" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(217, 164, 65, 0.35);">
              <div class="row g-3 text-center">
                <div class="col-4">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedDistricts.length || 64, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'জেলা' : 'Districts'}</div>
                </div>
                <div class="col-4">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedDivisions.length || 8, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'বিভাগ' : 'Divisions'}</div>
                </div>
                <div class="col-4">
                  <div class="fs-2 fw-bold text-warning">${formatLocalizedNumber(publishedSpots.length, lang)}</div>
                  <div class="small text-white-50">${isBn ? 'দর্শনীয় স্থান' : 'Spots'}</div>
                </div>
              </div>
              <hr class="border-light opacity-25 my-3">
              <div class="d-flex justify-content-between align-items-center small text-white-50">
                <span><i class="bi bi-database-check text-warning me-1"></i>${isBn ? 'তথ্যসূত্র' : 'Data Source'}</span>
                <span class="fw-semibold text-white">${isBn ? 'ক্লাউড ফায়ারস্টোর' : 'Cloud Firestore'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4 & 5. District Search Bar, Division Filter Dropdown & Reset Button -->
    <div class="container">
      <div class="search-card-wrapper">
        <div class="row g-3 align-items-end">
          <div class="col-lg-5">
            <label for="districts-search-input" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-search me-1"></i>${isBn ? 'জেলা অনুসন্ধান (বাংলা বা ইংরেজি নাম)' : 'Search District (Bengali or English Name)'}
            </label>
            <div class="search-input-group">
              <i class="bi bi-search search-icon-inside"></i>
              <input
                type="text"
                class="form-control"
                id="districts-search-input"
                placeholder="${isBn ? 'যেমন: কক্সবাজার, Cox\'s Bazar, সিলেট, বগুড়া...' : 'e.g., Cox\'s Bazar, কক্সবাজার, Sylhet, Bogura...'}"
                value="${escapeHtml(searchQuery)}"
                autocomplete="off"
                aria-label="${isBn ? 'বাংলা বা ইংরেজি নামে জেলা খুঁজুন' : 'Search district by Bengali or English name'}"
              >
            </div>
          </div>

          <div class="col-md-7 col-lg-4">
            <label for="districts-division-select" class="form-label small fw-bold text-primary-bd mb-1">
              <i class="bi bi-diagram-3 me-1"></i>${isBn ? 'বিভাগ অনুযায়ী ফিল্টার' : 'Filter by Division'}
            </label>
            <select
              class="form-select"
              id="districts-division-select"
              style="padding: 0.72rem 1rem; border-radius: 10px;"
              aria-label="${isBn ? 'বিভাগ নির্বাচন করুন' : 'Filter districts by division'}"
            >
              <option value="all" ${divisionFilter === 'all' ? 'selected' : ''}>
                ${isBn
                  ? `সকল বিভাগ (${formatLocalizedNumber(publishedDistricts.length, lang)}টি জেলা)`
                  : `All Divisions (${publishedDistricts.length} Districts)`}
              </option>
              ${publishedDivisions.map(div => {
                const count = publishedDistricts.filter(
                  d => d.division_id === div.id || (!!div.slug && d.division_id === div.slug)
                ).length;
                return `
                  <option value="${escapeHtml(div.id)}" ${divisionFilter === div.id ? 'selected' : ''}>
                    ${escapeHtml(isBn ? div.name_bn : div.name_en)} (${formatLocalizedNumber(count, lang)})
                  </option>
                `;
              }).join('')}
            </select>
          </div>

          <div class="col-md-5 col-lg-3 d-flex align-items-center gap-2">
            <button
              type="button"
              class="btn ${hasActiveFilters ? 'btn-accent' : 'btn-outline-bd'} w-100 py-2"
              style="min-height: 46px; border-radius: 10px;"
              id="districts-reset-filters-btn"
              ${!hasActiveFilters ? 'disabled' : ''}
            >
              <i class="bi bi-arrow-counterclockwise me-1"></i>${isBn ? 'ফিল্টার রিসেট' : 'Reset Filters'}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 6 & 7. District Grid + Pagination / Loading / Empty / Error States -->
    <section class="container py-5" id="districts-directory-grid">
      <div class="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div>
          <span class="badge bg-primary-bd text-white px-3 py-1 rounded-pill mb-2">
            ${selectedDivObj
              ? (isBn ? `${selectedDivObj.name_bn} বিভাগ` : `${selectedDivObj.name_en} Division`)
              : (isBn ? 'সমগ্র বাংলাদেশ' : 'Nationwide Coverage')}
          </span>
          <h2 class="fw-bold text-primary-bd mb-1">
            ${isBn ? 'জেলাসমূহের তালিকা ও পরিচিতি' : 'District Directory & Highlights'}
          </h2>
          <p class="text-muted mb-0">
            ${isLoading
              ? (isBn ? 'ফায়ারস্টোর থেকে ৬৪ জেলার তথ্য লোড হচ্ছে...' : 'Loading 64 districts from Firestore...')
              : totalItems === 0
                ? (isBn ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching districts found')
                : (isBn
                    ? `মোট ${formatLocalizedNumber(totalItems, lang)}টি জেলার মধ্যে ${formatLocalizedNumber(startIndex + 1, lang)}–${formatLocalizedNumber(endIndex, lang)}টি প্রদর্শিত হচ্ছে`
                    : `Showing ${startIndex + 1}–${endIndex} of ${totalItems} district${totalItems === 1 ? '' : 's'}`)}
          </p>
        </div>

        <a href="/divisions/" class="btn btn-outline-bd btn-sm rounded-pill px-3">
          <i class="bi bi-grid-fill me-1"></i>${isBn ? '৮টি বিভাগ দেখুন' : 'Explore 8 Divisions'}
        </a>
      </div>

      ${isLoading ? `
        <div class="row g-3 g-lg-4" aria-label="${isBn ? 'জেলা লোড হচ্ছে' : 'Loading districts'}">
          ${renderCardSkeleton(8, 'col-xl-3 col-lg-4 col-md-6 mb-4')}
        </div>
      ` : error ? `
        ${renderErrorState({
          title: isBn ? 'জেলাসমূহের তথ্য লোড করা যায়নি' : 'Could not load districts directory',
          message: error,
          retryActionId: 'districts-retry-btn',
          lang
        })}
      ` : paginatedDistricts.length === 0 ? `
        ${renderEmptyState({
          titleBn: 'কোনো জেলা খুঁজে পাওয়া যায়নি',
          titleEn: 'No Matching Districts Found',
          descBn: 'আপনার অনুসন্ধান বা নির্বাচিত বিভাগের সাথে মিল আছে এমন কোনো জেলা পাওয়া যায়নি। ফিল্টার রিসেট করে সকল ৬৪ জেলা দেখুন।',
          descEn: 'No districts matched your search query or selected division. Reset filters to view all 64 districts of Bangladesh.',
          actionTextBn: hasActiveFilters ? 'সব ফিল্টার রিসেট করুন' : 'পুনরায় লোড করুন',
          actionTextEn: hasActiveFilters ? 'Reset All Filters' : 'Reload Districts',
          actionId: hasActiveFilters ? 'districts-empty-reset-btn' : 'districts-retry-btn',
          icon: 'bi-geo-alt',
          lang
        })}
      ` : `
        <div class="row g-3 g-lg-4">
          ${paginatedDistricts
            .map(dist => {
              const div = publishedDivisions.find(
                d => d.id === dist.division_id || (!!d.slug && d.slug === dist.division_id)
              );
              const spotCount = publishedSpots.filter(s => s.district_id === dist.id).length;
              return renderDistrictCard({
                district: dist,
                division: div,
                spotCount,
                lang,
                mode: 'navigate',
                colClass: 'col-xl-3 col-lg-4 col-md-6 mb-4'
              });
            })
            .join('')}
        </div>

        ${renderPaginationControls(safePage, totalPages, lang)}
      `}
    </section>
  `;
}
