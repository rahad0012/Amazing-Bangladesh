import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getStoredMediaAsset, handleApiRequest } from '../src/server/portalApiCore.ts';

interface VercelIncomingRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

function loadFallbackFirebaseConfig(): { projectId?: string; firestoreDatabaseId?: string } {
  const candidatePaths: string[] = [path.resolve(process.cwd(), 'firebase-applet-config.json')];
  try {
    const metaUrl = typeof import.meta !== 'undefined' ? import.meta.url : undefined;
    if (typeof metaUrl === 'string' && metaUrl) {
      candidatePaths.push(path.resolve(path.dirname(new URL(metaUrl).pathname), '..', 'firebase-applet-config.json'));
    }
  } catch {
    // Ignore if bundled as CJS without import.meta.url
  }

  for (const configPath of candidatePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
          projectId?: string;
          firestoreDatabaseId?: string;
        };
        return {
          projectId: parsed.projectId,
          firestoreDatabaseId: parsed.firestoreDatabaseId
        };
      }
    } catch {
      // Try next candidate
    }
  }
  return {};
}

const fallbackFirebaseConfig = loadFallbackFirebaseConfig();

function normalizeHeaders(req: IncomingMessage): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const [key, val] of Object.entries(req.headers)) {
    result[key] = Array.isArray(val) ? val[0] : val;
  }
  return result;
}

function resolveApiPathAndQuery(req: VercelIncomingRequest): {
  apiPath: string;
  query: Record<string, string | undefined>;
} {
  const url = new URL(req.url || '/api', 'https://localhost');
  const query: Record<string, string | undefined> = {};

  url.searchParams.forEach((value, key) => {
    if (key !== '__api_path') {
      query[key] = value;
    }
  });

  if (req.query) {
    for (const [key, val] of Object.entries(req.query)) {
      if (key === '__api_path') continue;
      if (typeof val === 'string') query[key] = val;
      else if (Array.isArray(val) && typeof val[0] === 'string') query[key] = val[0];
    }
  }

  const rawOverride =
    url.searchParams.get('__api_path') ||
    (typeof req.query?.__api_path === 'string'
      ? req.query.__api_path
      : Array.isArray(req.query?.__api_path)
        ? req.query.__api_path[0]
        : '');

  let apiPath = url.pathname;
  if (rawOverride) {
    apiPath = `/api/${rawOverride.replace(/^\/+/, '')}`;
  } else if (!apiPath.startsWith('/api')) {
    apiPath = `/api${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  }

  return { apiPath, query };
}

async function readRequestBody(req: VercelIncomingRequest, maxBytes: number): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
        throw new Error('PAYLOAD_TOO_LARGE');
      }
      return req.body.trim() ? JSON.parse(req.body) : undefined;
    }
    if (Buffer.isBuffer(req.body)) {
      if (req.body.length > maxBytes) {
        throw new Error('PAYLOAD_TOO_LARGE');
      }
      const text = req.body.toString('utf8');
      return text.trim() ? JSON.parse(text) : undefined;
    }
    return req.body;
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;
    if (totalBytes > maxBytes) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(buf);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return undefined;
  return JSON.parse(raw);
}

export default async function handler(req: VercelIncomingRequest, res: ServerResponse): Promise<void> {
  const method = (req.method || 'GET').toUpperCase();
  const headers = normalizeHeaders(req);
  const { apiPath, query } = resolveApiPathAndQuery(req);

  const forwarded = headers['x-forwarded-for'] || headers['x-real-ip'] || '';
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';

  // Serve stored media assets if requested on GET /api/media/:id
  if (method === 'GET' && apiPath.startsWith('/api/media/')) {
    const assetId = apiPath.slice('/api/media/'.length).replace(/\/+$/, '');
    const asset = getStoredMediaAsset(assetId);
    if (!asset) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Media not found');
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (asset.mimeType === 'image/svg+xml') {
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    }
    res.end(asset.buffer);
    return;
  }

  let parsedBody: unknown = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const maxBytes = apiPath.startsWith('/api/admin/media/upload') ? 1600 * 1024 : 64 * 1024;
    try {
      parsedBody = await readRequestBody(req, maxBytes);
    } catch (err) {
      const isTooLarge = err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE';
      res.statusCode = isTooLarge ? 413 : 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          success: false,
          message: isTooLarge ? 'Request payload too large.' : 'Invalid JSON request body.'
        })
      );
      return;
    }
  }

  const out = await handleApiRequest({
    method,
    path: apiPath,
    query,
    headers,
    body: parsedBody,
    clientIp,
    fallbackFirebaseConfig
  });

  res.statusCode = out.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (out.headers) {
    for (const [k, v] of Object.entries(out.headers)) {
      res.setHeader(k, v);
    }
  }
  res.end(JSON.stringify(out.body));
}
