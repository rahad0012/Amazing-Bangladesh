/**
 * URL Handling & Deep Linking Utilities
 * Manages hash routing, canonical links, and shareable URLs
 */

import { Language } from './langUtils';

export interface ParsedRoute {
  type: 'home' | 'spot' | 'division' | 'districts' | 'divisions' | 'spots' | 'guides' | 'planner' | 'cms';
  id?: string;
}

export function parseCurrentRoute(): ParsedRoute {
  const hash = window.location.hash.trim().replace(/^#/, '');
  if (!hash) return { type: 'home' };

  if (hash === 'cms') return { type: 'cms' };
  if (hash === 'districts') return { type: 'districts' };
  if (hash === 'divisions') return { type: 'divisions' };
  if (hash === 'spots') return { type: 'spots' };
  if (hash === 'guides') return { type: 'guides' };
  if (hash === 'planner') return { type: 'planner' };

  if (hash.startsWith('spot-')) {
    return { type: 'spot', id: hash.replace('spot-', '') };
  }

  if (hash.startsWith('division-')) {
    return { type: 'division', id: hash.replace('division-', '') };
  }

  return { type: 'home' };
}

export function setRouteHash(hash: string, replace: boolean = true): void {
  const target = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  if (replace) {
    history.replaceState(null, '', target || window.location.pathname);
  } else {
    window.location.hash = target;
  }
}

export function updateCanonicalAndSeo(
  title: string,
  description: string,
  routeHash?: string
): void {
  document.title = title;

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', description);

  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute('content', title);

  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.setAttribute('content', description);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const base = 'https://bangladesh-tourism.netlify.app/';
    canonical.setAttribute('href', routeHash ? `${base}#${routeHash}` : base);
  }
}

export function getShareableUrl(routeHash?: string): string {
  const base = window.location.origin + window.location.pathname;
  return routeHash ? `${base}#${routeHash}` : base;
}
