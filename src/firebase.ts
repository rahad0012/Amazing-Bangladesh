/**
 * Firebase Client Initialization & Utilities
 * Bangladesh Tourism Platform
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection, 
  getDocs, 
  setDoc,
  deleteDoc,
  query,
  where 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Startup connection verification
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('Firebase Firestore connection test successful.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check connection.');
      return false;
    }
    // Non-fatal if test collection doesn't exist yet
    return true;
  }
}

// Authentication helpers
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Auth login error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Auth logout error:', error);
    throw error;
  }
}

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
] as const;

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No image file selected.' };
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || 'unknown'}). Allowed formats: JPEG, PNG, WEBP, GIF, SVG.`
    };
  }
  if (file.size <= 0) {
    return { valid: false, error: 'Selected image file is empty.' };
  }
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB limit.`
    };
  }
  return { valid: true };
}

// Upload file to Firebase Storage with guarded DataURL fallback for small offline previews
export async function uploadImageFile(file: File, folder: string = 'destinations'): Promise<string> {
  const check = validateImageFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid image file.');
  }

  try {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_') || 'destinations';
    const storageRef = ref(storage, `${safeFolder}/${timestamp}_${cleanName}`);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (storageError: any) {
    console.warn('Storage upload encountered restriction:', storageError);
    // Only fall back to DataURL for compact files so Firestore 1MB document limit is respected
    if (file.size > 650 * 1024) {
      throw new Error(
        storageError?.message ||
          'Firebase Storage upload failed. Please ensure Firebase Storage is enabled and you are signed in as an admin.'
      );
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}

export async function deleteStorageFile(fileUrl: string): Promise<void> {
  try {
    if (fileUrl.includes('firebasestorage.googleapis.com')) {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    }
  } catch (e) {
    console.warn('Could not delete from storage, continuing:', e);
  }
}
