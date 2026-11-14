/**
 * Safe Public Firebase Configuration & Service Initialization
 * Technology Stack: Firebase Authentication, Firebase Firestore, Firebase Storage
 */

import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseApp, FIRESTORE_DATABASE_ID, db } from './firebaseDb';

export { firebaseApp, FIRESTORE_DATABASE_ID, db };

// Initialize Firebase Authentication & Google Provider
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firebase Storage
export const storage = getStorage(firebaseApp);

export default firebaseApp;
