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

let storageBucketAvailablePromise: Promise<boolean> | null = null;

async function isFirebaseStorageAvailable(): Promise<boolean> {
  if (!storageBucketAvailablePromise) {
    const bucket = storage?.app?.options?.storageBucket;
    if (!bucket) {
      storageBucketAvailablePromise = Promise.resolve(false);
    } else {
      storageBucketAvailablePromise = fetch(
        `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?maxResults=1`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(3500)
        }
      )
        .then(resp => resp.status !== 404)
        .catch(() => false);
    }
  }
  return storageBucketAvailablePromise;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to decode image for upload optimization.'));
    img.src = objectUrl;
  });
}

async function optimizeImageForPortalUpload(file: File, folder: string): Promise<string> {
  const MAX_DATA_URL_LENGTH = 920_000;

  if (file.type === 'image/svg+xml' || (file.type === 'image/gif' && file.size <= 680 * 1024)) {
    const rawDataUrl = await readFileAsDataUrl(file);
    if (rawDataUrl.length <= MAX_DATA_URL_LENGTH) {
      return rawDataUrl;
    }
    throw new Error('Selected GIF/SVG file exceeds the 680 KB upload limit.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const maxDim = folder === 'settings' ? 1920 : 1400;
    let width = img.naturalWidth || maxDim;
    let height = img.naturalHeight || Math.round((maxDim * 9) / 16);

    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const fallbackUrl = await readFileAsDataUrl(file);
      if (fallbackUrl.length <= MAX_DATA_URL_LENGTH) return fallbackUrl;
      throw new Error('Image is too large and browser canvas optimization is unavailable.');
    }

    const candidateFormats = file.type === 'image/png' ? ['image/webp', 'image/jpeg'] : ['image/webp', 'image/jpeg'];
    const qualities = [0.86, 0.76, 0.64, 0.5];

    for (let scale = 1; scale >= 0.6; scale -= 0.2) {
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      for (const fmt of candidateFormats) {
        for (const q of qualities) {
          const dataUrl = canvas.toDataURL(fmt, q);
          if (dataUrl.startsWith(`data:${fmt};base64,`) && dataUrl.length <= MAX_DATA_URL_LENGTH) {
            return dataUrl;
          }
        }
      }
    }

    throw new Error('Image could not be compressed under the 900 KB limit. Please choose a smaller image.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function uploadViaPortalApi(
  file: File,
  folder: string,
  cleanName: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Administrator authentication is required before uploading images.');
  }
  onProgress?.(25);
  const dataUrl = await optimizeImageForPortalUpload(file, folder);
  onProgress?.(60);

  const idToken = await user.getIdToken();
  const resp = await fetch('/api/admin/media/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      fileName: cleanName,
      mimeType: file.type,
      folder,
      dataUrl
    }),
    signal: AbortSignal.timeout(25000)
  });

  const payload = (await resp.json().catch(() => ({}))) as {
    success?: boolean;
    url?: string;
    message?: string;
  };

  if (!resp.ok || !payload.success || !payload.url) {
    throw new Error(payload.message || `Image upload failed (${resp.status}).`);
  }

  onProgress?.(100);
  if (payload.url.startsWith('http://') || payload.url.startsWith('https://')) {
    return payload.url;
  }
  return `${window.location.origin}${payload.url.startsWith('/') ? payload.url : `/${payload.url}`}`;
}

function uploadToFirebaseStorageWithTimeout(
  file: File,
  storagePath: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  storage.maxUploadRetryTime = 5000;
  storage.maxOperationRetryTime = 5000;
  const storageRef = ref(storage, storagePath);

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedByUid: auth.currentUser?.uid || '',
        uploadedAt: new Date().toISOString()
      }
    });

    const stallTimer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          uploadTask.cancel();
        } catch {
          // ignore cancel errors
        }
        reject(new Error('STORAGE_TIMEOUT'));
      }
    }, 10000);

    uploadTask.on(
      'state_changed',
      snapshot => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (storageError: any) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(stallTimer);
        reject(storageError);
      },
      async () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(stallTimer);
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (urlError) {
          reject(urlError);
        }
      }
    );
  });
}

/**
 * Upload an image safely to Firebase Storage, automatically falling back to the
 * authenticated portal media endpoint when Firebase Storage is not provisioned.
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
    throw new Error('Administrator authentication is required before uploading files.');
  }

  const timestamp = Date.now();
  const cleanName = sanitizeUploadFilename(file.name);
  const safeFolder = normalizeStorageFolder(folder);
  const storagePath = `${safeFolder}/${timestamp}_${cleanName}`;

  const bucketAvailable = await isFirebaseStorageAvailable();
  if (bucketAvailable) {
    try {
      return await uploadToFirebaseStorageWithTimeout(file, storagePath, onProgress);
    } catch (storageError: any) {
      const code = typeof storageError?.code === 'string' ? storageError.code : '';
      const msg = typeof storageError?.message === 'string' ? storageError.message : '';
      const shouldFallback =
        msg === 'STORAGE_TIMEOUT' ||
        code === 'storage/bucket-not-found' ||
        code === 'storage/project-not-found' ||
        code === 'storage/retry-limit-exceeded' ||
        code === 'storage/unauthorized' ||
        code === 'storage/unknown' ||
        code === 'storage/canceled';
      if (!shouldFallback) {
        throw new Error(msg || 'Firebase Storage upload failed.');
      }
      storageBucketAvailablePromise = Promise.resolve(false);
    }
  }

  return uploadViaPortalApi(file, safeFolder, cleanName, onProgress);
}

export async function deleteStorageFile(fileUrl: string): Promise<void> {
  try {
    if (!fileUrl) return;
    const portalMediaMatch = fileUrl.match(/\/api\/media\/([a-zA-Z0-9_-]{1,128})$/);
    if (portalMediaMatch && auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`/api/admin/media/${encodeURIComponent(portalMediaMatch[1])}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` }
      }).catch(() => {});
      return;
    }
    if (fileUrl.includes('firebasestorage.googleapis.com') || fileUrl.startsWith('gs://')) {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    }
  } catch (e) {
    console.warn('Could not delete from storage, continuing:', e);
  }
}
