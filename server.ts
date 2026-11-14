import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const rateLimitMap = new Map<string, number[]>();
const recentContactQueue: StoredContactRecord[] = [];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const history = (rateLimitMap.get(ip) || []).filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (history.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitMap.set(ip, history);
    return true;
  }
  history.push(now);
  rateLimitMap.set(ip, history);
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

async function createServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'beautiful-bangladesh-portal' });
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
