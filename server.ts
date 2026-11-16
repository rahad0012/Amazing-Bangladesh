import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DISTRICTS, DIVISIONS } from './src/data/bangladeshData';
import {
  executeGeographyImport,
  inspectGeographyAgainstFirestore,
  type ImportStatusMode
} from './src/server/firestoreAdminRest';

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  lang?: unknown;
  website?: unknown;
}

interface StoredContactRecord {
  referenceId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  lang: 'bn' | 'en';
  receivedAt: string;
  deliveryMode: 'webhook' | 'email-api' | 'recorded';
}

const PORT = 3000;
const HOST = '0.0.0.0';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const ADMIN_VERIFY_MAX_REQUESTS = 120;
const MAX_RATE_LIMIT_KEYS = 2000;

const rateLimitMap = new Map<string, number[]>();
const adminRateLimitMap = new Map<string, number[]>();
const recentContactQueue: StoredContactRecord[] = [];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const GOOGLE_SECURE_TOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface PublicFirebaseServerConfig {
  projectId: string;
  firestoreDatabaseId: string;
}

function loadPublicFirebaseConfig(): PublicFirebaseServerConfig {
  let projectId = (process.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  let firestoreDatabaseId = '(default)';

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
        projectId?: string;
        firestoreDatabaseId?: string;
      };
      if (parsed.projectId) projectId = parsed.projectId.trim();
      if (parsed.firestoreDatabaseId) firestoreDatabaseId = parsed.firestoreDatabaseId.trim();
    }
  } catch (err) {
    console.warn('[auth] Could not parse firebase-applet-config.json:', err instanceof Error ? err.message : err);
  }

  return { projectId, firestoreDatabaseId };
}

const PUBLIC_FIREBASE_CONFIG = loadPublicFirebaseConfig();

const BOOTSTRAPPED_ADMIN_EMAILS = new Set<string>([
  'mdrahad0529@gmail.com',
  'bluesky90987@gmail.com',
  ...(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
]);

let cachedGoogleCerts: { certs: Record<string, string>; expiresAt: number } = {
  certs: {},
  expiresAt: 0
};

async function getGooglePublicCerts(forceRefresh: boolean = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && Object.keys(cachedGoogleCerts.certs).length > 0 && now < cachedGoogleCerts.expiresAt) {
    return cachedGoogleCerts.certs;
  }

  const resp = await fetch(GOOGLE_SECURE_TOKEN_CERTS_URL, {
    method: 'GET',
    signal: AbortSignal.timeout(8000)
  });

  if (!resp.ok) {
    throw new Error(`Unable to fetch Google public certificates (${resp.status})`);
  }

  const certs = (await resp.json()) as Record<string, string>;
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Math.max(60, parseInt(maxAgeMatch[1], 10)) : 3600;

  cachedGoogleCerts = {
    certs,
    expiresAt: now + maxAgeSeconds * 1000
  };
  return certs;
}

interface VerifiedFirebaseTokenPayload {
  aud: string;
  iss: string;
  sub: string;
  exp: number;
  iat: number;
  auth_time: number;
  email?: string;
  email_verified?: boolean;
  admin?: unknown;
  isAdmin?: unknown;
  role?: unknown;
  [key: string]: unknown;
}

class TokenVerificationError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseTokenPayload> {
  if (!PUBLIC_FIREBASE_CONFIG.projectId) {
    throw new TokenVerificationError(500, 'SERVER_MISCONFIGURED', 'Firebase project ID is not configured.');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Malformed authentication token.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header: { alg?: string; kid?: string };
  let payload: VerifiedFirebaseTokenPayload;

  try {
    header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Unable to decode authentication token.');
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Unsupported token algorithm or key ID.');
  }

  let certs = await getGooglePublicCerts(false);
  let certPem = certs[header.kid];
  if (!certPem) {
    certs = await getGooglePublicCerts(true);
    certPem = certs[header.kid];
  }
  if (!certPem) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Unrecognized token signing certificate.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const signatureValid = verifier.verify(certPem, Buffer.from(encodedSignature, 'base64url'));
  if (!signatureValid) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Invalid token signature.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${PUBLIC_FIREBASE_CONFIG.projectId}`;

  if (payload.aud !== PUBLIC_FIREBASE_CONFIG.projectId || payload.iss !== expectedIssuer) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Token audience or issuer mismatch.');
  }

  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Token subject is invalid.');
  }

  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new TokenVerificationError(401, 'SESSION_EXPIRED', 'Your administrator session has expired. Please sign in again.');
  }

  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 60) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Token issued-at timestamp is invalid.');
  }

  if (typeof payload.auth_time !== 'number' || payload.auth_time > nowSec + 60) {
    throw new TokenVerificationError(401, 'INVALID_TOKEN', 'Token authentication timestamp is invalid.');
  }

  return payload;
}

async function checkFirestoreAdminDocument(uid: string, idToken: string): Promise<boolean> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) return false;

  const projectId = encodeURIComponent(PUBLIC_FIREBASE_CONFIG.projectId);
  const databaseId = encodeURIComponent(PUBLIC_FIREBASE_CONFIG.firestoreDatabaseId || '(default)');
  const docId = encodeURIComponent(uid);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/admins/${docId}`;

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!resp.ok) {
      return false;
    }

    const docData = (await resp.json()) as {
      fields?: {
        role?: { stringValue?: string };
      };
    };

    const role = (docData.fields?.role?.stringValue || 'admin').toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'editor';
  } catch {
    return false;
  }
}

async function resolveAdminAuthorization(
  idToken: string,
  payload: VerifiedFirebaseTokenPayload
): Promise<{ authorized: true; authSource: 'custom_claim' | 'firestore_admin_doc' | 'verified_admin_email' } | { authorized: false }> {
  // 1. Firebase Custom Claims (cryptographically signed by Firebase Auth)
  if (
    payload.admin === true ||
    payload.isAdmin === true ||
    payload.role === 'admin' ||
    payload.role === 'super_admin'
  ) {
    return { authorized: true, authSource: 'custom_claim' };
  }

  // 2. Trusted Firestore admins/{uid} lookup via Firestore REST API using caller's verified ID token
  const hasFirestoreDoc = await checkFirestoreAdminDocument(payload.sub, idToken);
  if (hasFirestoreDoc) {
    return { authorized: true, authSource: 'firestore_admin_doc' };
  }

  // 3. Trusted server-side verified admin email allowlist (requires email_verified === true)
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (email && payload.email_verified === true && BOOTSTRAPPED_ADMIN_EMAILS.has(email)) {
    return { authorized: true, authSource: 'verified_admin_email' };
  }

  return { authorized: false };
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function pruneRateLimitStore(store: Map<string, number[]>, now: number): void {
  for (const [key, timestamps] of store.entries()) {
    const active = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    if (active.length === 0) {
      store.delete(key);
    } else if (active.length !== timestamps.length) {
      store.set(key, active);
    }
  }
  if (store.size > MAX_RATE_LIMIT_KEYS) {
    const excess = store.size - MAX_RATE_LIMIT_KEYS;
    let removed = 0;
    for (const key of store.keys()) {
      store.delete(key);
      removed += 1;
      if (removed >= excess) break;
    }
  }
}

function isRateLimited(ip: string, store: Map<string, number[]> = rateLimitMap, max: number = RATE_LIMIT_MAX_REQUESTS): boolean {
  const now = Date.now();
  if (store.size > 500) {
    pruneRateLimitStore(store, now);
  }
  const history = (store.get(ip) || []).filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (history.length >= max) {
    store.set(ip, history);
    return true;
  }
  history.push(now);
  store.set(ip, history);
  return false;
}

function generateReferenceId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BDM-${datePart}-${randomPart}`;
}

function sanitizeText(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
    : '';
}

async function forwardContactSubmission(record: StoredContactRecord): Promise<'webhook' | 'email-api' | 'recorded'> {
  const webhookUrl = (process.env.CONTACT_WEBHOOK_URL || '').trim();
  if (webhookUrl) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(webhookUrl);
    } catch {
      throw new Error('Configured CONTACT_WEBHOOK_URL is invalid.');
    }
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error('Configured CONTACT_WEBHOOK_URL must use http or https.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'BeautifulBangladeshPortal/1.0'
    };
    const token = (process.env.CONTACT_WEBHOOK_TOKEN || '').trim();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const resp = await fetch(parsedUrl.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: 'beautiful-bangladesh-portal',
        ...record
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!resp.ok) {
      throw new Error(`Upstream webhook responded with status ${resp.status}`);
    }
    return 'webhook';
  }

  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const recipientEmail = (process.env.CONTACT_RECIPIENT_EMAIL || '').trim();
  if (resendApiKey && recipientEmail) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || 'Beautiful Bangladesh <onboarding@resend.dev>',
        to: [recipientEmail],
        reply_to: record.email,
        subject: `[Portal Contact ${record.referenceId}] ${record.subject}`,
        text: [
          `Reference ID: ${record.referenceId}`,
          `Submitted At: ${record.receivedAt}`,
          `Language: ${record.lang}`,
          `Name: ${record.name}`,
          `Email: ${record.email}`,
          `Subject: ${record.subject}`,
          '',
          record.message
        ].join('\n')
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!resp.ok) {
      throw new Error(`Email service responded with status ${resp.status}`);
    }
    return 'email-api';
  }

  return 'recorded';
}

function resolveRequestBaseUrl(req: Request): string {
  const configured = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = typeof protoHeader === 'string' && protoHeader ? protoHeader.split(',')[0].trim() : req.protocol || 'https';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

async function createServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
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

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'beautiful-bangladesh-portal' });
  });

  app.post('/api/admin/verify', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp, adminRateLimitMap, ADMIN_VERIFY_MAX_REQUESTS)) {
      res.status(429).json({
        authorized: false,
        code: 'RATE_LIMITED',
        message: 'Too many authentication verification requests. Please wait a moment and try again.'
      });
      return;
    }

    const authHeader = req.headers.authorization || '';
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const idToken = tokenMatch?.[1]?.trim() || '';

    if (!idToken) {
      res.status(401).json({
        authorized: false,
        code: 'UNAUTHENTICATED',
        message: 'Missing administrator authentication token.'
      });
      return;
    }

    try {
      const payload = await verifyFirebaseIdToken(idToken);
      const authResult = await resolveAdminAuthorization(idToken, payload);

      if (!authResult.authorized) {
        res.status(403).json({
          authorized: false,
          code: 'NOT_AUTHORIZED',
          message: 'Access denied. This account does not have administrator privileges.'
        });
        return;
      }

      res.status(200).json({
        authorized: true,
        uid: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
        emailVerified: payload.email_verified === true,
        role: 'admin',
        authSource: authResult.authSource,
        expiresAt: payload.exp * 1000,
        verifiedAt: Date.now()
      });
    } catch (err) {
      if (err instanceof TokenVerificationError) {
        res.status(err.status).json({
          authorized: false,
          code: err.code,
          message: err.message
        });
        return;
      }
      console.error('[admin-verify] Unexpected verification failure:', err instanceof Error ? err.message : err);
      res.status(503).json({
        authorized: false,
        code: 'VERIFICATION_UNAVAILABLE',
        message: 'Unable to verify administrator credentials right now. Please try again.'
      });
    }
  });

  app.post('/api/admin/logout', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).json({ success: true });
  });

  app.get('/api/admin/geography/report', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp, adminRateLimitMap, ADMIN_VERIFY_MAX_REQUESTS)) {
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment and try again.'
      });
      return;
    }

    const authHeader = req.headers.authorization || '';
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const idToken = tokenMatch?.[1]?.trim() || '';

    if (!idToken) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Missing administrator authentication token.'
      });
      return;
    }

    try {
      const payload = await verifyFirebaseIdToken(idToken);
      const authResult = await resolveAdminAuthorization(idToken, payload);
      if (!authResult.authorized) {
        res.status(403).json({
          success: false,
          code: 'NOT_AUTHORIZED',
          message: 'Access denied. Administrator privileges are required.'
        });
        return;
      }

      const rawStatus = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : 'preserve';
      const statusMode: ImportStatusMode =
        rawStatus === 'published' || rawStatus === 'draft' ? rawStatus : 'preserve';

      const inspection = await inspectGeographyAgainstFirestore(DIVISIONS, DISTRICTS, idToken, statusMode);
      res.status(200).json({
        success: true,
        ...inspection
      });
    } catch (err) {
      if (err instanceof TokenVerificationError) {
        res.status(err.status).json({ success: false, code: err.code, message: err.message });
        return;
      }
      console.error('[geography-report] Failed:', err instanceof Error ? err.message : err);
      res.status(502).json({
        success: false,
        code: 'GEOGRAPHY_REPORT_FAILED',
        message: err instanceof Error ? err.message : 'Unable to generate geography validation report.'
      });
    }
  });

  app.post('/api/admin/geography/import', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp, adminRateLimitMap, ADMIN_VERIFY_MAX_REQUESTS)) {
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment and try again.'
      });
      return;
    }

    const authHeader = req.headers.authorization || '';
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const idToken = tokenMatch?.[1]?.trim() || '';

    if (!idToken) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Missing administrator authentication token.'
      });
      return;
    }

    try {
      const payload = await verifyFirebaseIdToken(idToken);
      const authResult = await resolveAdminAuthorization(idToken, payload);
      if (!authResult.authorized) {
        res.status(403).json({
          success: false,
          code: 'NOT_AUTHORIZED',
          message: 'Access denied. Administrator privileges are required.'
        });
        return;
      }

      const body = (req.body || {}) as {
        confirmImport?: unknown;
        confirmOverwrite?: unknown;
        statusMode?: unknown;
      };

      if (body.confirmImport !== true) {
        res.status(400).json({
          success: false,
          code: 'CONFIRMATION_REQUIRED',
          message: 'Explicit confirmation (confirmImport: true) is required after reviewing the validation report.'
        });
        return;
      }

      const statusMode: ImportStatusMode =
        body.statusMode === 'published' || body.statusMode === 'draft' ? body.statusMode : 'preserve';
      const confirmOverwrite = body.confirmOverwrite === true;

      const result = await executeGeographyImport({
        divisions: DIVISIONS,
        districts: DISTRICTS,
        bearerToken: idToken,
        confirmImport: true,
        confirmOverwrite,
        statusMode
      });

      console.info(
        `[geography-import] actor=${payload.email || payload.sub} createdDiv=${result.createdDivisions} createdDist=${result.createdDistricts} overwrittenDiv=${result.overwrittenDivisions} overwrittenDist=${result.overwrittenDistricts}`
      );

      res.status(200).json(result);
    } catch (err) {
      if (err instanceof TokenVerificationError) {
        res.status(err.status).json({ success: false, code: err.code, message: err.message });
        return;
      }
      console.error('[geography-import] Failed:', err instanceof Error ? err.message : err);
      res.status(502).json({
        success: false,
        code: 'GEOGRAPHY_IMPORT_FAILED',
        message: err instanceof Error ? err.message : 'Unable to execute geography import.'
      });
    }
  });

  app.post('/api/contact', async (req: Request, res: Response) => {
    const body = (req.body || {}) as ContactPayload;
    const lang: 'bn' | 'en' = body.lang === 'en' ? 'en' : 'bn';
    const isBn = lang === 'bn';

    // Honeypot check (bots fill hidden fields)
    const honeypot = sanitizeText(body.website);
    if (honeypot) {
      res.status(200).json({
        success: true,
        referenceId: generateReferenceId(),
        receivedAt: new Date().toISOString(),
        message: isBn
          ? 'আপনার বার্তাটি গ্রহণ করা হয়েছে।'
          : 'Your message has been received.'
      });
      return;
    }

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: isBn
          ? 'অল্প সময়ে অনেকগুলো অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : 'Too many requests from your connection. Please wait a few minutes before submitting again.'
      });
      return;
    }

    const name = sanitizeText(body.name);
    const email = sanitizeText(body.email).toLowerCase();
    const subject = sanitizeText(body.subject);
    const message = sanitizeText(body.message);

    const fieldErrors: Record<string, string> = {};

    if (name.length < 2 || name.length > 120) {
      fieldErrors.name = isBn
        ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (২ থেকে ১২০ অক্ষরের মধ্যে)।'
        : 'Please provide your name (between 2 and 120 characters).';
    }

    if (!email || email.length > 180 || !EMAIL_REGEX.test(email)) {
      fieldErrors.email = isBn
        ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।'
        : 'Please enter a valid email address.';
    }

    if (subject.length < 3 || subject.length > 180) {
      fieldErrors.subject = isBn
        ? 'অনুগ্রহ করে বার্তার বিষয় লিখুন (কমপক্ষে ৩ অক্ষর)।'
        : 'Please enter a subject (at least 3 characters).';
    }

    if (message.length < 10 || message.length > 4000) {
      fieldErrors.message = isBn
        ? 'অনুগ্রহ করে বিস্তারিত বার্তা লিখুন (১০ থেকে ৪০০০ অক্ষরের মধ্যে)।'
        : 'Please enter your message (between 10 and 4000 characters).';
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        fieldErrors,
        message: isBn
          ? 'অনুগ্রহ করে ফর্মের সকল তথ্য সঠিকভাবে পূরণ করুন।'
          : 'Please check the highlighted form fields and try again.'
      });
      return;
    }

    const referenceId = generateReferenceId();
    const receivedAt = new Date().toISOString();

    const record: StoredContactRecord = {
      referenceId,
      name,
      email,
      subject,
      message,
      lang,
      receivedAt,
      deliveryMode: 'recorded'
    };

    try {
      const deliveryMode = await forwardContactSubmission(record);
      record.deliveryMode = deliveryMode;
      recentContactQueue.push(record);
      if (recentContactQueue.length > 200) {
        recentContactQueue.shift();
      }

      console.info(
        `[contact] Accepted ${referenceId} (${deliveryMode}) subject="${subject.slice(0, 60)}"`
      );

      res.status(200).json({
        success: true,
        referenceId,
        receivedAt,
        deliveryMode,
        message: isBn
          ? 'আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। আমাদের টিম পর্যালোচনা করে শীঘ্রই যোগাযোগ করবে।'
          : 'Your message has been sent successfully. Our editorial team will review it and reply shortly.'
      });
    } catch (err) {
      console.error('[contact] Delivery failure:', err instanceof Error ? err.message : err);
      res.status(502).json({
        success: false,
        code: 'DELIVERY_FAILED',
        message: isBn
          ? 'সার্ভারের মাধ্যমে বার্তা পাঠাতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : 'We could not deliver your message right now due to a server relay issue. Please try again shortly.'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
