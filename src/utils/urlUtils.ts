/**
 * URL Handling & Deep Linking Utilities
 * Manages clean path routing (/divisions/, /divisions/:slug/), hash routing, canonical links, and SEO metadata
 */

export interface ParsedRoute {
  type: 'home' | 'spot' | 'division' | 'district' | 'districts' | 'divisions' | 'spots' | 'guides' | 'planner' | 'saved' | 'cms';
  id?: string;
}

export function parseCurrentRoute(): ParsedRoute {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const hash = window.location.hash.trim().replace(/^#/, '');

  // Clean URL path routing
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
  if (pathname === '/places' || pathname.startsWith('/places/')) {
    return { type: 'spots' };
  }

  // Hash routing fallback
  if (!hash) return { type: 'home' };

  if (hash === 'cms') return { type: 'cms' };
  if (hash === 'districts') return { type: 'districts' };
  if (hash === 'divisions') return { type: 'divisions' };
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

  return { type: 'home' };
}

export function navigateToPath(path: string, replace: boolean = false): void {
  if (window.location.pathname + window.location.hash === path) return;
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

export function updateCanonicalAndSeo(
  title: string,
  description: string,
  routePath?: string
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

  const normalizedRoute = routePath
    ? (routePath.startsWith('/') || routePath.startsWith('#') ? routePath : `/#${routePath}`)
    : '/';
  const fullUrl = `${window.location.origin}${normalizedRoute}`;

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', fullUrl);
  }

  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', fullUrl);
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
