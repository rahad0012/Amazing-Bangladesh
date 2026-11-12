/**
 * Reusable Breadcrumb Component
 * Compatible with Schema.org BreadcrumbList microdata
 */

import { Language } from '../utils/langUtils';
import { escapeHtml } from '../utils/formatUtils';

export interface BreadcrumbItem {
  labelBn: string;
  labelEn: string;
  url?: string;
}

export function renderBreadcrumbs(items: BreadcrumbItem[], lang: Language): string {
  const isBn = lang === 'bn';

  return `
    <nav aria-label="breadcrumb" class="breadcrumb-custom">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item">
          <a href="#" class="text-secondary-bd">${isBn ? 'মূলপাতা' : 'Home'}</a>
        </li>
        ${items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const label = isBn ? item.labelBn : item.labelEn;
          if (isLast) {
            return `<li class="breadcrumb-item active" aria-current="page">${escapeHtml(label)}</li>`;
          }
          return `<li class="breadcrumb-item"><a href="${item.url || '#'}" class="text-secondary-bd">${escapeHtml(label)}</a></li>`;
        }).join('')}
      </ol>
    </nav>
  `;
}
