import firebaseAppletConfig from '../../firebase-applet-config.json';
import { handleApiRequest } from '../../src/server/portalApiCore.ts';

function normalizeApiPath(pathname: string): string {
  if (pathname.startsWith('/.netlify/functions/api')) {
    const suffix = pathname.slice('/.netlify/functions/api'.length);
    return `/api${suffix.startsWith('/') ? suffix : suffix ? `/${suffix}` : ''}`;
  }
  return pathname;
}

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const apiPath = normalizeApiPath(url.pathname);

  const query: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const headers: Record<string, string | undefined> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const forwarded = headers['x-nf-client-connection-ip'] || headers['x-forwarded-for'] || '';
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  let parsedBody: unknown = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contentLength = Number(headers['content-length'] || '0');
    if (contentLength > 65536) {
      return new Response(
        JSON.stringify({ success: false, message: 'Request payload too large.' }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }
    const rawText = await req.text().catch(() => '');
    if (rawText.length > 65536) {
      return new Response(
        JSON.stringify({ success: false, message: 'Request payload too large.' }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }
    if (rawText.trim()) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid JSON request body.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          }
        );
      }
    }
  }

  const out = await handleApiRequest({
    method: req.method,
    path: apiPath,
    query,
    headers,
    body: parsedBody,
    clientIp,
    fallbackFirebaseConfig: {
      projectId: firebaseAppletConfig.projectId,
      firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId
    }
  });

  const respHeaders: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    ...(out.headers || {})
  };

  return new Response(JSON.stringify(out.body), {
    status: out.status,
    headers: respHeaders
  });
};
