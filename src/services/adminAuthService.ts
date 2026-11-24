/**
 * Secure Administrator Authentication & Session Verification Service
 * Uses Firebase Email/Password Auth + Custom Claims / Trusted Backend Verification
 * Never trusts localStorage or frontend role flags for admin authorization.
 */

import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onIdTokenChanged,
  type User
} from 'firebase/auth';
import { auth } from '../firebase';
import type { Language } from '../utils/langUtils';

export interface VerifiedAdminSession {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  role: 'admin';
  authSource: 'custom_claim' | 'firestore_admin_doc' | 'verified_admin_email';
  expiresAt: number;
  verifiedAt: number;
}

export type AdminVerificationOutcome =
  | { status: 'authenticated'; session: VerifiedAdminSession }
  | { status: 'unauthenticated'; reason?: string }
  | { status: 'expired'; message: string }
  | { status: 'unauthorized'; code?: 'NOT_AUTHORIZED' | 'EMAIL_NOT_VERIFIED'; message: string }
  | { status: 'error'; message: string };

export class AdminAuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AdminAuthError';
    this.code = code;
  }
}

// Module-scoped in-memory verified session only (never persisted to localStorage)
let activeVerifiedSession: VerifiedAdminSession | null = null;
let sessionExpiryTimer: number | null = null;
let pendingVerificationPromise: Promise<AdminVerificationOutcome> | null = null;

function clearExpiryTimer(): void {
  if (sessionExpiryTimer !== null) {
    window.clearTimeout(sessionExpiryTimer);
    sessionExpiryTimer = null;
  }
}

function clearInMemorySession(): void {
  clearExpiryTimer();
  activeVerifiedSession = null;
}

function scheduleExpirationMonitor(expiresAt: number, onExpired: () => void): void {
  clearExpiryTimer();
  const msRemaining = Math.max(0, expiresAt - Date.now());
  // Trigger re-verification slightly before hard token expiry
  const delay = Math.min(Math.max(msRemaining - 15000, 1000), 2147483647);
  sessionExpiryTimer = window.setTimeout(() => {
    onExpired();
  }, delay);
}

export function getVerifiedAdminSession(): VerifiedAdminSession | null {
  const user = auth.currentUser;
  if (!user || !activeVerifiedSession) {
    if (activeVerifiedSession) clearInMemorySession();
    return null;
  }
  if (activeVerifiedSession.uid !== user.uid) {
    clearInMemorySession();
    return null;
  }
  if (Date.now() >= activeVerifiedSession.expiresAt) {
    clearInMemorySession();
    return null;
  }
  return activeVerifiedSession;
}

export function isVerifiedAdminActive(): boolean {
  return getVerifiedAdminSession() !== null;
}

export function mapAdminAuthError(error: unknown, lang: Language): string {
  const isBn = lang === 'bn';
  const code =
    error instanceof AdminAuthError
      ? error.code
      : typeof (error as { code?: unknown })?.code === 'string'
        ? (error as { code: string }).code
        : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return isBn
        ? 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় পরীক্ষা করুন।'
        : 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/invalid-email':
      return isBn
        ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।'
        : 'Please enter a valid email address.';
    case 'auth/missing-password':
      return isBn
        ? 'অনুগ্রহ করে আপনার পাসওয়ার্ড লিখুন।'
        : 'Please enter your password.';
    case 'auth/user-disabled':
      return isBn
        ? 'এই অ্যাডমিনিস্ট্রেটর অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।'
        : 'This administrator account has been disabled.';
    case 'auth/too-many-requests':
    case 'RATE_LIMITED':
      return isBn
        ? 'অতিরিক্ত ব্যর্থ লগইন প্রচেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
        : 'Too many failed sign-in attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return isBn
        ? 'নেটওয়ার্ক সংযোগে সমস্যা হয়েছে। আপনার ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।'
        : 'Network error occurred. Please check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return isBn
        ? 'ফায়ারবেস অথেনটিকেশনে এই সাইন-ইন পদ্ধতি সক্রিয় নেই। ফায়ারবেস কনসোল থেকে এটি চালু করুন।'
        : 'This sign-in method is not enabled in Firebase Authentication. Enable it in the Firebase Console.';
    case 'auth/popup-closed-by-user':
      return isBn
        ? 'গুগল সাইন-ইন পপআপ সম্পন্ন হওয়ার আগেই বন্ধ করা হয়েছে।'
        : 'Google sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return isBn
        ? 'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে পপআপ অনুমতি দিয়ে আবার চেষ্টা করুন।'
        : 'Sign-in popup was blocked by the browser. Please allow popups and try again.';
    case 'auth/user-token-expired':
    case 'auth/id-token-expired':
    case 'SESSION_EXPIRED':
      return isBn
        ? 'আপনার অ্যাডমিন সেশনের মেয়াদ শেষ হয়েছে। নিরাপত্তা নিশ্চিত করতে অনুগ্রহ করে পুনরায় লগইন করুন।'
        : 'Your administrator session has expired. Please sign in again to continue.';
    case 'EMAIL_NOT_VERIFIED':
      return isBn
        ? 'আপনার ইমেইল ঠিকানাটি এখনও ভেরিফাই করা হয়নি। আপনার ইমেইল ইনবক্সে একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে—লিংকটি ক্লিক করে ভেরিফাই করার পর আবার লগইন করুন।'
        : 'Your email address is not verified yet. A verification link has been sent to your inbox—please verify your email and sign in again.';
    case 'NOT_AUTHORIZED':
      return isBn
        ? 'প্রবেশাধিকার প্রত্যাখ্যাত। এই অ্যাকাউন্টে অ্যাডমিনিস্ট্রেটর অনুমতি নেই।'
        : 'Access denied. This account does not have administrator privileges.';
    case 'VERIFICATION_UNAVAILABLE':
      return isBn
        ? 'সার্ভারের সাথে অ্যাডমিনিস্ট্রেটর অনুমতি যাচাই করা যায়নি। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।'
        : 'Could not verify administrator authorization with the server. Please try again shortly.';
    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return isBn
        ? 'লগইন সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
        : 'Authentication failed. Please try again.';
  }
}

async function performBackendVerification(
  user: User,
  forceRefresh: boolean,
  onSessionExpired?: () => void
): Promise<AdminVerificationOutcome> {
  try {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    const expMs = Date.parse(tokenResult.expirationTime);

    if (!Number.isFinite(expMs) || expMs <= Date.now()) {
      await secureAdminSignOut();
      return {
        status: 'expired',
        message: 'Your administrator session has expired. Please sign in again.'
      };
    }

    const response = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      cache: 'no-store'
    });

    const data = (await response.json().catch(() => ({}))) as {
      authorized?: boolean;
      code?: string;
      message?: string;
      uid?: string;
      email?: string | null;
      emailVerified?: boolean;
      role?: string;
      authSource?: VerifiedAdminSession['authSource'];
      expiresAt?: number;
      verifiedAt?: number;
    };

    if (response.status === 401) {
      await secureAdminSignOut();
      return {
        status: 'expired',
        message: data.message || 'Your administrator session has expired. Please sign in again.'
      };
    }

    if (response.status === 404) {
      return {
        status: 'error',
        message: 'Admin verification endpoint (/api/admin/verify) returned 404. Ensure serverless API routing is deployed.'
      };
    }

    if (response.status === 403 || !response.ok || !data.authorized) {
      if (response.status === 403 || data.code === 'NOT_AUTHORIZED') {
        if (!user.emailVerified) {
          try {
            await sendEmailVerification(user);
          } catch {
            // Non-fatal if rate-limited or already recently sent
          }
          await secureAdminSignOut();
          return {
            status: 'unauthorized',
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Your email address is not verified yet. Please check your inbox for a verification link.'
          };
        }
        await secureAdminSignOut();
        return {
          status: 'unauthorized',
          code: 'NOT_AUTHORIZED',
          message: data.message || 'Access denied. This account does not have administrator privileges.'
        };
      }
      return {
        status: 'error',
        message: data.message || 'Unable to verify administrator privileges.'
      };
    }

    const session: VerifiedAdminSession = {
      uid: data.uid || user.uid,
      email: data.email ?? user.email,
      emailVerified: data.emailVerified ?? user.emailVerified,
      role: 'admin',
      authSource: data.authSource || (tokenResult.claims?.admin === true ? 'custom_claim' : 'firestore_admin_doc'),
      expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : expMs,
      verifiedAt: typeof data.verifiedAt === 'number' ? data.verifiedAt : Date.now()
    };

    activeVerifiedSession = session;
    if (onSessionExpired) {
      scheduleExpirationMonitor(session.expiresAt, onSessionExpired);
    }

    return { status: 'authenticated', session };
  } catch (err: any) {
    const code = typeof err?.code === 'string' ? err.code : '';
    if (
      code === 'auth/user-token-expired' ||
      code === 'auth/id-token-expired' ||
      code === 'auth/user-disabled'
    ) {
      await secureAdminSignOut();
      return {
        status: 'expired',
        message: 'Your administrator session has expired. Please sign in again.'
      };
    }
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Unable to verify session.'
    };
  }
}

export async function verifyCurrentAdminSession(
  forceRefresh: boolean = false,
  onSessionExpired?: () => void
): Promise<AdminVerificationOutcome> {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }

  const user = auth.currentUser;
  if (!user) {
    clearInMemorySession();
    return { status: 'unauthenticated' };
  }

  // If we already have a fresh verified session in memory and forceRefresh is false,
  // verify it's still well within its token expiry window.
  const existing = getVerifiedAdminSession();
  if (!forceRefresh && existing && Date.now() < existing.expiresAt - 60_000 && Date.now() - existing.verifiedAt < 5 * 60_000) {
    return { status: 'authenticated', session: existing };
  }

  if (pendingVerificationPromise && !forceRefresh) {
    return pendingVerificationPromise;
  }

  const promise = performBackendVerification(user, forceRefresh, onSessionExpired).finally(() => {
    if (pendingVerificationPromise === promise) {
      pendingVerificationPromise = null;
    }
  });

  if (!forceRefresh) {
    pendingVerificationPromise = promise;
  }

  return promise;
}

export async function signInAdminWithEmailPassword(
  email: string,
  password: string,
  rememberSession: boolean,
  onSessionExpired?: () => void
): Promise<VerifiedAdminSession> {
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    throw new AdminAuthError('auth/invalid-email', 'Please enter your email address.');
  }
  if (!password) {
    throw new AdminAuthError('auth/missing-password', 'Please enter your password.');
  }

  clearInMemorySession();

  await setPersistence(auth, rememberSession ? browserLocalPersistence : browserSessionPersistence);
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);

  const outcome = await performBackendVerification(credential.user, true, onSessionExpired);
  if (outcome.status === 'authenticated') {
    return outcome.session;
  }

  if (outcome.status === 'unauthorized') {
    throw new AdminAuthError(outcome.code || 'NOT_AUTHORIZED', outcome.message);
  }
  if (outcome.status === 'expired') {
    throw new AdminAuthError('SESSION_EXPIRED', outcome.message);
  }
  if (outcome.status === 'error') {
    throw new AdminAuthError('VERIFICATION_UNAVAILABLE', outcome.message);
  }
  throw new AdminAuthError('UNAUTHENTICATED', 'Authentication session could not be established.');
}

export async function secureAdminSignOut(): Promise<void> {
  clearInMemorySession();
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store'
    });
  } catch {
    // Non-fatal if offline during logout cleanup
  }
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
}

export function subscribeAdminAuthLifecycle(handlers: {
  onTokenRefreshedOrSignedOut: (user: User | null) => void;
}): () => void {
  return onIdTokenChanged(auth, (user) => {
    if (!user) {
      clearInMemorySession();
    }
    handlers.onTokenRefreshedOrSignedOut(user);
  });
}
