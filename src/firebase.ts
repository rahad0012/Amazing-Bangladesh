/**
 * Firebase Client Unified Entrypoint
 * Re-exports the single initialized Firebase App, Firestore, Auth, and Storage instances
 * without creating any duplicate Firebase initialization.
 */

import {
  signInWithPopup,
  signOut,
  type User
} from 'firebase/auth';
import {
  firebaseApp,
  FIRESTORE_DATABASE_ID,
  db,
  auth,
  googleAuthProvider as googleProvider,
  storage,
  testConnection
} from './config/firebaseConfig';
import {
  OperationType,
  handleFirestoreError,
  registerAuthInfoProvider,
  type FirestoreErrorInfo
} from './services/firestoreBase';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_FILE_SIZE_BYTES,
  validateImageFile,
  uploadImageFile,
  deleteStorageFile
} from './services/storageService';

// Register live Auth user context provider for structured Firestore permission diagnostics
registerAuthInfoProvider(() => {
  const user = auth.currentUser;
  if (!user) return undefined;
  return {
    userId: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    tenantId: user.tenantId,
    providerInfo:
      user.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
  };
});

export {
  firebaseApp,
  FIRESTORE_DATABASE_ID,
  db,
  auth,
  storage,
  googleProvider,
  testConnection,
  OperationType,
  handleFirestoreError,
  type FirestoreErrorInfo,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_FILE_SIZE_BYTES,
  validateImageFile,
  uploadImageFile,
  deleteStorageFile
};

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
