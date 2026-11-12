/**
 * Search & Filtering Utilities
 * Provides bilingual search across Bengali and English content
 */

export function normalizeSearchTerm(str: string): string {
  if (!str) return '';
  return str.trim().toLowerCase();
}

export function matchesBilingualQuery(
  query: string,
  fields: Array<string | undefined | null>
): boolean {
  const q = normalizeSearchTerm(query);
  if (!q) return true;

  for (const field of fields) {
    if (field && normalizeSearchTerm(field).includes(q)) {
      return true;
    }
  }
  return false;
}

export function filterArrayByQuery<T>(
  items: T[],
  query: string,
  extractFields: (item: T) => Array<string | undefined | null>
): T[] {
  if (!query.trim()) return items;
  return items.filter(item => matchesBilingualQuery(query, extractFields(item)));
}
