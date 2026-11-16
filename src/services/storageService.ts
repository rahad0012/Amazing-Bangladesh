/**
 * Safe Firebase Storage Image Upload & Deletion Service
 * Enforces MIME allowlist, file size limits, magic-byte inspection,
 * allowlisted folder paths, and authenticated admin upload checks.
 */

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable
} from 'firebase/storage';
import { auth, storage } from '../config/firebaseConfig';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
] as const;

export const ALLOWED_STORAGE_FOLDERS = [
  'divisions',
  'districts',
  'categories',
  'spots',
  'destinations',
  'articles',
  'media',
  'media_library',
  'settings'
] as const;

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No image file selected.' };
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
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

/**
 * Inspect file header bytes to verify file contents match declared image format.
 */
async function verifyImageSignature(file: File): Promise<ImageValidationResult> {
  try {
    const headerBuffer = await file.slice(0, 64).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);

    if (file.type === 'image/jpeg') {
      if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid JPEG file signature.' };
    }

    if (file.type === 'image/png') {
      if (
        bytes.length >= 4 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      ) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid PNG file signature.' };
    }

    if (file.type === 'image/gif') {
      const sig = String.fromCharCode(...bytes.slice(0, 4));
      if (sig === 'GIF8') return { valid: true };
      return { valid: false, error: 'Invalid GIF file signature.' };
    }

    if (file.type === 'image/webp') {
      const riff = String.fromCharCode(...bytes.slice(0, 4));
      const webp = String.fromCharCode(...bytes.slice(8, 12));
      if (riff === 'RIFF' && webp === 'WEBP') return { valid: true };
      return { valid: false, error: 'Invalid WEBP file signature.' };
    }

    if (file.type === 'image/svg+xml') {
      const text = await file.text();
      const lower = text.toLowerCase();
      if (!lower.includes('<svg')) {
        return { valid: false, error: 'Invalid SVG image markup.' };
      }
      if (/<script\b|javascript:|on\w+\s*=/i.test(lower)) {
        return { valid: false, error: 'SVG contains disallowed active script content.' };
      }
      return { valid: true };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Unable to read image file for safety verification.' };
  }
}

export function normalizeStorageFolder(folder: string): string {
  const clean = (folder || 'destinations').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if ((ALLOWED_STORAGE_FOLDERS as readonly string[]).includes(clean)) {
    return clean;
  }
  return 'destinations';
}

export function sanitizeUploadFilename(name: string): string {
  const clean = (name || 'image').replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 120);
  return clean || 'image';
}

/**
 * Upload an image safely to Firebase Storage.
 * Strictly requires an authenticated Firebase user (admin privileges enforced by storage.rules).
 */
export async function uploadImageFile(
  file: File,
  folder: string = 'destinations',
  onProgress?: (percent: number) => void
): Promise<string> {
  const check = validateImageFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid image file.');
  }

  const signatureCheck = await verifyImageSignature(file);
  if (!signatureCheck.valid) {
    throw new Error(signatureCheck.error || 'Image file failed security signature verification.');
  }

  if (!auth.currentUser) {
    throw new Error('Administrator authentication is required before uploading files to Firebase Storage.');
  }

  const timestamp = Date.now();
  const cleanName = sanitizeUploadFilename(file.name);
  const safeFolder = normalizeStorageFolder(folder);
  const storagePath = `${safeFolder}/${timestamp}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedByUid: auth.currentUser?.uid || '',
        uploadedAt: new Date(timestamp).toISOString()
      }
    });

    uploadTask.on(
      'state_changed',
      snapshot => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (storageError: any) => {
        const code = typeof storageError?.code === 'string' ? storageError.code : '';
        if (code === 'storage/unauthorized') {
          reject(
            new Error(
              'Firebase Storage permission denied. Ensure you are signed in as an authorized admin and storage.rules are deployed.'
            )
          );
          return;
        }
        reject(
          new Error(
            storageError?.message ||
              'Firebase Storage upload failed. Please check your connection and Storage configuration.'
          )
        );
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (urlError: any) {
          reject(new Error(urlError?.message || 'Uploaded image but could not retrieve download URL.'));
        }
      }
    );
  });
}

export async function deleteStorageFile(fileUrl: string): Promise<void> {
  try {
    if (fileUrl && (fileUrl.includes('firebasestorage.googleapis.com') || fileUrl.startsWith('gs://'))) {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    }
  } catch (e) {
    console.warn('Could not delete from storage, continuing:', e);
  }
}
