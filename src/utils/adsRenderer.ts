/**
 * Public Advertisement Injection & Slot Rendering Engine
 * Safely renders AdSense, Adsterra (Standard Banner, Native, Social Bar, Popunder),
 * custom HTML/JS ad units, and direct image banners ONLY on public portal routes
 * (never in Admin CMS or Admin Login views).
 */

import type { Language } from './langUtils';
import type { AdSlotConfig, AdSlotKey, AdsSettingsConfig } from '../services/siteSettingsService';
import { escapeHtml, optimizeImageUrl } from './formatUtils';

let activeGlobalAdsSignature = '';

function isSafeHttpOrLocalAssetUrl(raw: string): boolean {
  const val = (raw || '').trim();
  if (!val) return false;
  return val.startsWith('https://') || val.startsWith('http://') || val.startsWith('/api/media/');
}

function isSafeNavigationUrl(raw: string): boolean {
  const val = (raw || '').trim();
  if (!val) return false;
  return val.startsWith('https://') || val.startsWith('http://') || val.startsWith('/');
}

function isValidAdSenseClientId(clientId: string): boolean {
  return /^ca-pub-\d{8,24}$/i.test((clientId || '').trim());
}

function extractAdSenseClientId(ads: AdsSettingsConfig): string {
  const direct = (ads.adsense_client_id || '').trim();
  if (isValidAdSenseClientId(direct)) return direct;

  const headMatch = (ads.custom_head_script || '').match(/ca-pub-\d{8,24}/i);
  if (headMatch) return headMatch[0];

  for (const slot of Object.values(ads.slots || {})) {
    const slotMatch = (slot?.code || '').match(/ca-pub-\d{8,24}/i);
    if (slotMatch) return slotMatch[0];
  }
  return '';
}

function isSlotEligibleToRender(slotKey: AdSlotKey, ads?: AdsSettingsConfig | null): slotKey is AdSlotKey {
  if (!ads || !ads.ads_enabled) return false;
  const slot = ads.slots?.[slotKey];
  if (!slot || !slot.enabled) return false;

  if (slot.network === 'adsense') {
    return ads.adsense_enabled && slot.code.trim().length > 0;
  }
  if (slot.network === 'adsterra') {
    return ads.adsterra_enabled && slot.code.trim().length > 0;
  }
  if (slot.network === 'custom_code') {
    return slot.code.trim().length > 0;
  }
  if (slot.network === 'banner_image') {
    return isSafeHttpOrLocalAssetUrl(slot.image_url);
  }
  return false;
}

/**
 * Mounts arbitrary HTML containing <script> tags into a target container so that
 * external and inline ad scripts execute in the SPA lifecycle.
 */
function mountHtmlFragmentWithScripts(
  target: HTMLElement,
  rawHtml: string,
  managedMarker?: string
): void {
  const template = document.createElement('template');
  template.innerHTML = rawHtml;
  const fragment = document.createDocumentFragment();

  const cloneNodeExecutable = (node: Node): Node => {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() === 'script') {
      const origScript = node as HTMLScriptElement;
      const execScript = document.createElement('script');
      for (const attr of Array.from(origScript.attributes)) {
        execScript.setAttribute(attr.name, attr.value);
      }
      if (managedMarker) {
        execScript.setAttribute('data-bd-managed-ad', managedMarker);
      }
      if (origScript.textContent) {
        execScript.textContent = origScript.textContent;
      }
      return execScript;
    }

    const cloned = node.cloneNode(false);
    if (managedMarker && cloned.nodeType === Node.ELEMENT_NODE) {
      (cloned as Element).setAttribute('data-bd-managed-ad', managedMarker);
    }
    node.childNodes.forEach(child => {
      cloned.appendChild(cloneNodeExecutable(child));
    });
    return cloned;
  };

  template.content.childNodes.forEach(child => {
    fragment.appendChild(cloneNodeExecutable(child));
  });

  target.appendChild(fragment);
}

/**
 * Adsterra & synchronous script-based banners use `document.write(...)` and global `atOptions`.
 * Rendering them inside a fresh `srcdoc` iframe lets `document.write()` execute natively
 * and isolates `atOptions` per ad slot so multiple banners render simultaneously.
 */
function shouldUseIsolatedIframe(slot: AdSlotConfig): boolean {
  const code = (slot.code || '').trim();
  if (!code) return false;
  if (slot.network === 'adsense' || /adsbygoogle/i.test(code)) {
    return false;
  }
  if (slot.network === 'adsterra') {
    return /<script[\s>]/i.test(code);
  }
  return /atOptions|document\.write/i.test(code);
}

function parseAtOptionsDimensions(code: string): { width?: number; height?: number } {
  const widthMatch = code.match(/['"]?width['"]?\s*:\s*(\d{2,4})/i);
  const heightMatch = code.match(/['"]?height['"]?\s*:\s*(\d{2,4})/i);
  const width = widthMatch ? Number(widthMatch[1]) : undefined;
  const height = heightMatch ? Number(heightMatch[1]) : undefined;
  return {
    width: width && Number.isFinite(width) && width > 0 ? width : undefined,
    height: height && Number.isFinite(height) && height > 0 ? height : undefined
  };
}

function mountIsolatedAdIframe(target: HTMLElement, code: string): void {
  const { width, height } = parseAtOptionsDimensions(code);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Advertisement');
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');
  iframe.style.border = '0';
  iframe.style.display = 'block';
  iframe.style.margin = '0 auto';
  iframe.style.background = 'transparent';
  iframe.style.overflow = 'hidden';
  iframe.style.maxWidth = '100%';
  iframe.style.width = width ? `${width}px` : '100%';
  iframe.style.height = height ? `${height}px` : '100px';

  iframe.srcdoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <base target="_blank">
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100%;
        width: 100%;
      }
    </style>
  </head>
  <body>${code}</body>
</html>`;

  const syncFrameSize = () => {
    try {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;
      const measuredHeight = Math.max(
        doc.body.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0
      );
      if (measuredHeight > 10) {
        iframe.style.height = `${Math.min(measuredHeight, 900)}px`;
      }
    } catch {
      // Ignore cross-origin frame measurements
    }
  };

  iframe.addEventListener('load', () => {
    syncFrameSize();
    window.setTimeout(syncFrameSize, 600);
    window.setTimeout(syncFrameSize, 1800);
    try {
      const body = iframe.contentDocument?.body;
      if (body && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => syncFrameSize());
        ro.observe(body);
      }
    } catch {
      // Ignore observer errors
    }
  });

  target.appendChild(iframe);
}

export function clearManagedGlobalAdScripts(): void {
  document.querySelectorAll('[data-bd-managed-ad]').forEach(el => el.remove());
  activeGlobalAdsSignature = '';
}

export function syncGlobalAdScripts(ads: AdsSettingsConfig | null | undefined, isPublicView: boolean): void {
  if (!isPublicView || !ads || !ads.ads_enabled) {
    if (activeGlobalAdsSignature !== '' || document.querySelector('[data-bd-managed-ad]')) {
      clearManagedGlobalAdScripts();
    }
    return;
  }

  const cleanClientId = extractAdSenseClientId(ads);
  const hasEnabledAdsenseSlot = Object.values(ads.slots || {}).some(
    s => s.enabled && s.network === 'adsense' && s.code.trim().length > 0
  );
  const shouldLoadAdSense =
    ads.adsense_enabled &&
    isValidAdSenseClientId(cleanClientId) &&
    (ads.adsense_auto_ads || hasEnabledAdsenseSlot);

  const adsterraGlobal = ads.adsterra_enabled ? (ads.adsterra_global_script || '').trim() : '';
  const customHead = (ads.custom_head_script || '').trim();

  const nextSignature = JSON.stringify({
    shouldLoadAdSense,
    cleanClientId: shouldLoadAdSense ? cleanClientId : '',
    adsterraGlobal,
    customHead
  });

  if (nextSignature === activeGlobalAdsSignature) {
    return;
  }

  clearManagedGlobalAdScripts();
  activeGlobalAdsSignature = nextSignature;

  if (shouldLoadAdSense) {
    const meta = document.createElement('meta');
    meta.name = 'google-adsense-account';
    meta.content = cleanClientId;
    meta.setAttribute('data-bd-managed-ad', 'adsense-meta');
    document.head.appendChild(meta);

    const adsbygoogleScript = document.createElement('script');
    adsbygoogleScript.async = true;
    adsbygoogleScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cleanClientId)}`;
    adsbygoogleScript.crossOrigin = 'anonymous';
    adsbygoogleScript.setAttribute('data-bd-managed-ad', 'adsense-lib');
    document.head.appendChild(adsbygoogleScript);
  }

  if (customHead) {
    mountHtmlFragmentWithScripts(document.head, customHead, 'custom-head');
  }

  if (adsterraGlobal) {
    mountHtmlFragmentWithScripts(document.body, adsterraGlobal, 'adsterra-global');
  }
}

export function renderAdSlotHtml(
  slotKey: AdSlotKey,
  ads: AdsSettingsConfig | null | undefined,
  lang: Language,
  options?: { compact?: boolean }
): string {
  if (!isSlotEligibleToRender(slotKey, ads) || !ads) {
    return '';
  }

  const slot: AdSlotConfig = ads.slots[slotKey];
  const isBn = lang === 'bn';
  const compactClass = options?.compact ? 'my-3' : 'my-4';

  const labelHtml = ads.show_ad_label
    ? `<div class="bd-ad-slot-label">${isBn ? 'বিজ্ঞাপন • Advertisement' : 'Advertisement'}</div>`
    : '';

  if (slot.network === 'banner_image') {
    const imgSrc = optimizeImageUrl(slot.image_url, 1200);
    const alt = escapeHtml(slot.alt_text || (isBn ? 'স্পন্সরড বিজ্ঞাপন' : 'Sponsored Advertisement'));
    const hasLink = isSafeNavigationUrl(slot.link_url);
    const imgTag = `<img src="${escapeHtml(imgSrc)}" alt="${alt}" class="bd-ad-banner-img img-fluid rounded-3" loading="lazy" decoding="async">`;

    return `
      <aside class="container ${compactClass} bd-ad-slot-section" aria-label="${isBn ? 'বিজ্ঞাপন' : 'Advertisement'}">
        <div class="bd-ad-slot-box">
          ${labelHtml}
          <div class="bd-ad-slot-mount text-center">
            ${
              hasLink
                ? `<a href="${escapeHtml(slot.link_url.trim())}" target="_blank" rel="noopener noreferrer sponsored" class="d-inline-block text-decoration-none">${imgTag}</a>`
                : imgTag
            }
          </div>
        </div>
      </aside>
    `;
  }

  return `
    <aside class="container ${compactClass} bd-ad-slot-section" aria-label="${isBn ? 'বিজ্ঞাপন' : 'Advertisement'}">
      <div class="bd-ad-slot-box">
        ${labelHtml}
        <div class="bd-ad-slot-mount" data-ad-slot-key="${slotKey}"></div>
      </div>
    </aside>
  `;
}

export function hydrateRenderedAdSlots(
  ads: AdsSettingsConfig | null | undefined,
  isPublicView: boolean
): void {
  syncGlobalAdScripts(ads, isPublicView);

  if (!isPublicView || !ads || !ads.ads_enabled) {
    return;
  }

  const slotNodes = document.querySelectorAll<HTMLElement>('[data-ad-slot-key]');
  slotNodes.forEach(node => {
    if (node.dataset.adMounted === '1') return;
    const key = node.getAttribute('data-ad-slot-key') as AdSlotKey | null;
    if (!key || !isSlotEligibleToRender(key, ads)) return;

    const slot = ads.slots[key];
    if (!slot || slot.network === 'banner_image' || !slot.code.trim()) return;

    node.dataset.adMounted = '1';
    node.innerHTML = '';

    if (shouldUseIsolatedIframe(slot)) {
      mountIsolatedAdIframe(node, slot.code);
      return;
    }

    mountHtmlFragmentWithScripts(node, slot.code);

    if (slot.network === 'adsense' || slot.code.includes('adsbygoogle')) {
      const hasIns = node.querySelector('ins.adsbygoogle');
      const alreadyHasPush = /adsbygoogle\s*=\s*window\.adsbygoogle[\s\S]*\.push\(/i.test(slot.code);
      if (hasIns && !alreadyHasPush) {
        try {
          const w = window as unknown as { adsbygoogle?: unknown[] };
          w.adsbygoogle = w.adsbygoogle || [];
          w.adsbygoogle.push({});
        } catch {
          // Ignore duplicate push or ad-blocker interception
        }
      }
    }
  });
}
