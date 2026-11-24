import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {
  getStoredMediaAsset,
  handleApiRequest,
  type ApiResponseOutput
} from './src/server/portalApiCore.ts';

const PORT = 3000;
const HOST = '0.0.0.0';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function resolveRequestBaseUrl(req: Request): string {
  const configured = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto =
    typeof protoHeader === 'string' && protoHeader
      ? protoHeader.split(',')[0].trim()
      : req.protocol || 'https';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function sendApiResponse(res: Response, out: ApiResponseOutput): void {
  if (out.headers) {
    for (const [k, v] of Object.entries(out.headers)) {
      res.setHeader(k, v);
    }
  }
  res.status(out.status).json(out.body);
}

function normalizeExpressHeaders(req: Request): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const [key, val] of Object.entries(req.headers)) {
    result[key] = Array.isArray(val) ? val[0] : val;
  }
  return result;
}

function normalizeExpressQuery(req: Request): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const [key, val] of Object.entries(req.query)) {
    if (typeof val === 'string') {
      result[key] = val;
    } else if (Array.isArray(val) && typeof val[0] === 'string') {
      result[key] = val[0];
    }
  }
  return result;
}

async function dispatchApi(req: Request, res: Response): Promise<void> {
  const out = await handleApiRequest({
    method: req.method,
    path: req.path,
    query: normalizeExpressQuery(req),
    headers: normalizeExpressHeaders(req),
    body: req.body,
    clientIp: getClientIp(req)
  });
  sendApiResponse(res, out);
}

async function createServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api/admin/media/upload', express.json({ limit: '1500kb' }));
  app.use(express.json({ limit: '64kb' }));

  // Baseline security headers (preserve iframe embeddability for preview hosts)
  app.use((req: Request, res: Response, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });

  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = resolveRequestBaseUrl(req);
    res.type('text/plain; charset=utf-8').send(
      `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = resolveRequestBaseUrl(req);
    const sitemapFile = path.resolve(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapFile)) {
      const xml = fs
        .readFileSync(sitemapFile, 'utf8')
        .replaceAll('https://bangladesh-tourism.netlify.app', baseUrl);
      res.type('application/xml; charset=utf-8').send(xml);
      return;
    }
    res.status(404).send('Sitemap not found');
  });

  app.get('/api/health', dispatchApi);
  app.post('/api/admin/verify', dispatchApi);
  app.post('/api/admin/logout', dispatchApi);
  app.get('/api/admin/geography/report', dispatchApi);
  app.post('/api/admin/geography/import', dispatchApi);
  app.post('/api/admin/media/upload', dispatchApi);
  app.delete('/api/admin/media/:id', dispatchApi);
  app.get('/api/media/:id', (req: Request, res: Response) => {
    const asset = getStoredMediaAsset(String(req.params.id || ''));
    if (!asset) {
      res.status(404).send('Media not found');
      return;
    }
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (asset.mimeType === 'image/svg+xml') {
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    }
    res.send(asset.buffer);
  });
  app.post('/api/contact', dispatchApi);

  const httpServer = http.createServer(app);
  const disableHmr = process.env.DISABLE_HMR === 'true' || Boolean(process.env.APPLET_ID);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: { server: httpServer },
        hmr: !disableHmr,
        ...(disableHmr ? { ws: false as const } : {})
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.use((req: Request, res: Response) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ success: false, message: 'API route not found' });
        return;
      }
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
