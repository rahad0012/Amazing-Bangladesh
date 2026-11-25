/**
 * URL Handling & Deep Linking Utilities
 * Manages clean path routing (/divisions/, /divisions/:slug/), hash routing, canonical links, and SEO metadata
 */

export interface ParsedRoute {
  type:
    | 'home'
    | 'spot'
    | 'spot-detail'
    | 'division'
    | 'district'
    | 'districts'
    | 'divisions'
    | 'spots'
    | 'categories'
    | 'category-detail'
    | 'guides'
    | 'guide-detail'
    | 'search'
    | 'about'
    | 'contact'
    | 'privacy-policy'
    | 'terms'
    | 'planner'
    | 'saved'
    | 'cms'
    | 'admin-login';
  id?: string;
}

export function getAdminRouteForTab(tab: string): string {
  switch (tab) {
    case 'divisions':
      return '/admin/divisions/';
    case 'districts':
      return '/admin/districts/';
    case 'categories':
      return '/admin/categories/';
    case 'spots':
      return '/admin/spots/';
    case 'articles':
      return '/admin/travel-guides/';
    case 'media':
      return '/admin/media/';
    case 'hero-banners':
      return '/admin/hero-banners/';
    case 'seo-settings':
      return '/admin/seo-settings/';
    case 'website-settings':
      return '/admin/website-settings/';
    case 'ads-settings':
      return '/admin/ads-settings/';
    case 'overview':
    default:
      return '/admin/dashboard/';
  }
}

export function parseCurrentRoute(): ParsedRoute {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const hash = window.location.hash.trim().replace(/^#/, '');

  // Protected Admin Routes
  if (pathname === '/admin/login') {
    return { type: 'admin-login' };
  }
  if (pathname === '/admin' || pathname === '/admin/dashboard') {
    return { type: 'cms', id: 'overview' };
  }
  if (pathname === '/admin/divisions') {
    return { type: 'cms', id: 'divisions' };
  }
  if (pathname === '/admin/districts') {
    return { type: 'cms', id: 'districts' };
  }
  if (pathname === '/admin/categories') {
    return { type: 'cms', id: 'categories' };
  }
  if (pathname === '/admin/spots') {
    return { type: 'cms', id: 'spots' };
  }
  if (pathname === '/admin/travel-guides') {
    return { type: 'cms', id: 'articles' };
  }
  if (pathname === '/admin/media') {
    return { type: 'cms', id: 'media' };
  }
  if (pathname === '/admin/hero-banners') {
    return { type: 'cms', id: 'hero-banners' };
  }
  if (pathname === '/admin/seo-settings') {
    return { type: 'cms', id: 'seo-settings' };
  }
  if (pathname === '/admin/website-settings') {
    return { type: 'cms', id: 'website-settings' };
  }
  if (pathname === '/admin/ads-settings') {
    return { type: 'cms', id: 'ads-settings' };
  }
  if (pathname.startsWith('/admin/')) {
    return { type: 'cms', id: 'overview' };
  }

  // Clean URL path routing
  if (pathname === '/about') {
    return { type: 'about' };
  }
  if (pathname === '/contact') {
    return { type: 'contact' };
  }
  if (pathname === '/privacy-policy') {
    return { type: 'privacy-policy' };
  }
  if (pathname === '/terms-and-conditions') {
    return { type: 'terms' };
  }
  if (pathname === '/search') {
    return { type: 'search' };
  }
  if (pathname === '/divisions') {
    return { type: 'divisions' };
  }
  if (pathname.startsWith('/divisions/')) {
    const slug = pathname.replace('/divisions/', '').split('/')[0];
    if (slug) {
      return { type: 'division', id: decodeURIComponent(slug).toLowerCase() };
    }
    return { type: 'divisions' };
  }
  if (pathname === '/districts') {
    return { type: 'districts' };
  }
  if (pathname.startsWith('/districts/')) {
    const slug = pathname.replace('/districts/', '').split('/')[0];
    if (slug) {
      return { type: 'district', id: decodeURIComponent(slug).toLowerCase() };
    }
    return { type: 'districts' };
  }
  if (pathname === '/categories') {
    return { type: 'categories' };
  }
  if (pathname.startsWith('/categories/')) {
    const slug = pathname.replace('/categories/', '').split('/')[0];
    if (slug) {
      return { type: 'category-detail', id: decodeURIComponent(slug).toLowerCase() };
    }
    return { type: 'categories' };
  }
  if (pathname === '/places') {
    return { type: 'spots' };
  }
  if (pathname.startsWith('/places/')) {
    const slug = pathname.replace('/places/', '').split('/')[0];
    if (slug) {
      return { type: 'spot-detail', id: decodeURIComponent(slug).toLowerCase() };
    }
    return { type: 'spots' };
  }
  if (pathname === '/travel-guides') {
    return { type: 'guides' };
  }
  if (pathname.startsWith('/travel-guides/')) {
    const slug = pathname.replace('/travel-guides/', '').split('/')[0];
    if (slug) {
      return { type: 'guide-detail', id: decodeURIComponent(slug).toLowerCase() };
    }
    return { type: 'guides' };
  }

  // Hash routing fallback
  if (!hash) return { type: 'home' };

  if (hash === 'cms') return { type: 'cms' };
  if (hash === 'about') return { type: 'about' };
  if (hash === 'contact') return { type: 'contact' };
  if (hash === 'privacy-policy') return { type: 'privacy-policy' };
  if (hash === 'terms-and-conditions' || hash === 'terms') return { type: 'terms' };
  if (hash === 'search') return { type: 'search' };
  if (hash === 'districts') return { type: 'districts' };
  if (hash === 'divisions') return { type: 'divisions' };
  if (hash === 'categories') return { type: 'categories' };
  if (hash === 'spots') return { type: 'spots' };
  if (hash === 'guides') return { type: 'guides' };
  if (hash === 'planner') return { type: 'planner' };
  if (hash === 'saved') return { type: 'saved' };

  if (hash.startsWith('spot-')) {
    return { type: 'spot', id: hash.replace('spot-', '') };
  }

  if (hash.startsWith('division-')) {
    return { type: 'division', id: hash.replace('division-', '') };
  }

  if (hash.startsWith('district-')) {
    return { type: 'district', id: hash.replace('district-', '') };
  }

  if (hash.startsWith('article-')) {
    return { type: 'guide-detail', id: decodeURIComponent(hash.replace('article-', '')).toLowerCase() };
  }

  if (hash.startsWith('guide-')) {
    return { type: 'guide-detail', id: decodeURIComponent(hash.replace('guide-', '')).toLowerCase() };
  }

  return { type: 'home' };
}

export interface SearchUrlState {
  q?: string;
  type?: string;
  division?: string;
  category?: string;
  page?: number;
}

export function buildSearchRouteUrl(params: SearchUrlState): string {
  const searchParams = new URLSearchParams();
  const cleanQ = (params.q || '').trim();
  if (cleanQ) searchParams.set('q', cleanQ);
  if (params.type && params.type !== 'all') searchParams.set('type', params.type);
  if (params.division && params.division !== 'all') searchParams.set('division', params.division);
  if (params.category && params.category !== 'all') searchParams.set('category', params.category);
  if (params.page && params.page > 1) searchParams.set('page', String(params.page));

  const qs = searchParams.toString();
  return qs ? `/search/?${qs}` : '/search/';
}

export function navigateToPath(path: string, replace: boolean = false): void {
  if (window.location.pathname + window.location.search + window.location.hash === path) return;
  if (replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
}

export function setRouteHash(hash: string, replace: boolean = true): void {
  const target = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  if (replace) {
    history.replaceState(null, '', target || '/');
  } else {
    window.location.hash = target;
  }
}

export const DEFAULT_PORTAL_OG_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1200&q=80';

function upsertMetaProperty(attrName: 'property' | 'name', attrVal: string, content: string): void {
  let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertHreflangLink(hreflang: string, href: string): void {
  let el = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function buildLangVariantUrl(fullUrl: string, lang?: 'bn' | 'en'): string {
  try {
    const parsed = new URL(fullUrl);
    if (lang) {
      parsed.searchParams.set('lang', lang);
    } else {
      parsed.searchParams.delete('lang');
    }
    return parsed.toString();
  } catch {
    return fullUrl;
  }
}

export interface SeoUpdateOptions {
  ogType?: 'website' | 'article';
  imageUrl?: string;
  lang?: 'bn' | 'en';
}

export function updateCanonicalAndSeo(
  title: string,
  description: string,
  routePath?: string,
  options?: SeoUpdateOptions
): void {
  document.title = title;

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', description);

  upsertMetaProperty('property', 'og:title', title);
  upsertMetaProperty('property', 'og:description', description);
  upsertMetaProperty('name', 'twitter:title', title);
  upsertMetaProperty('name', 'twitter:description', description);

  const normalizedRoute = routePath
    ? (routePath.startsWith('/') || routePath.startsWith('#') ? routePath : `/${routePath}`)
    : '/';
  const fullUrl = `${window.location.origin}${normalizedRoute}`;

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', fullUrl);

  upsertMetaProperty('property', 'og:url', fullUrl);
  upsertMetaProperty('property', 'og:type', options?.ogType || 'website');

  const resolvedImage = (options?.imageUrl || '').trim() || DEFAULT_PORTAL_OG_IMAGE;
  upsertMetaProperty('property', 'og:image', resolvedImage);
  upsertMetaProperty('name', 'twitter:image', resolvedImage);

  const activeLang = options?.lang || (document.documentElement.lang === 'en' ? 'en' : 'bn');
  upsertMetaProperty('property', 'og:locale', activeLang === 'bn' ? 'bn_BD' : 'en_US');

  upsertHreflangLink('bn', buildLangVariantUrl(fullUrl, 'bn'));
  upsertHreflangLink('en', buildLangVariantUrl(fullUrl, 'en'));
  upsertHreflangLink('x-default', buildLangVariantUrl(fullUrl));
}

export function updateStructuredData(schemaPayload: Record<string, unknown> | null): void {
  const existing = document.getElementById('dynamic-page-schema');
  if (!schemaPayload) {
    existing?.remove();
    return;
  }

  const script = existing || document.createElement('script');
  script.id = 'dynamic-page-schema';
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(schemaPayload);
  if (!existing) {
    document.head.appendChild(script);
  }
}

export function getShareableUrl(routeHash?: string): string {
  const base = window.location.origin + window.location.pathname;
  return routeHash ? `${base}#${routeHash}` : base;
}
