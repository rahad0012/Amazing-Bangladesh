/**
 * Reusable Firebase Auth & Storage Initialization
 * Shares the single firebaseApp and db instance from ./firebaseDb (no duplicate initialization).
 */

import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseApp, FIRESTORE_DATABASE_ID, db, testConnection } from './firebaseDb';

export { firebaseApp, FIRESTORE_DATABASE_ID, db, testConnection };

export const auth: Auth = getAuth(firebaseApp);

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export const storage: FirebaseStorage = getStorage(firebaseApp);

export default firebaseApp;
