/**
 * Data Formatting Utilities
 * Handles numbers, currency, area, ratings, dates, and media optimizations
 */

import { Language, toBengaliNumerals, formatLocalizedNumber } from './langUtils';

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatAreaSqKm(area: number, lang: Language): string {
  const numStr = formatLocalizedNumber(area, lang);
  return lang === 'bn' ? `${numStr} বর্গ কিমি` : `${numStr} sq km`;
}

export function formatRating(rating: number, lang: Language): string {
  const val = rating.toFixed(1);
  return lang === 'bn' ? toBengaliNumerals(val) : val;
}

export function formatBdtCurrency(amount: number, lang: Language): string {
  const numStr = formatLocalizedNumber(amount, lang);
  return lang === 'bn' ? `৳ ${numStr}` : `BDT ${numStr}`;
}

export function formatRelativeDate(isoString: string, lang: Language): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export function optimizeImageUrl(url: string, width: number = 800): string {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', '80');
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
}
