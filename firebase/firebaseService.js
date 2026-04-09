// Firebase Authentication Service
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

let GoogleSignin = null;
if (Platform.OS !== 'web' && !IS_EXPO_GO) {
  ({ GoogleSignin } = require('@react-native-google-signin/google-signin'));
}

/**
 * Sign up with Email and Password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name (optional)
 * @returns {Promise} - Firebase user credential
 */
export const signUpWithEmail = async (email, password, displayName = null) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }

    return userCredential;
  } catch (error) {
    throw error;
  }
};

/**
 * Sign in with Email and Password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Firebase user credential
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (idToken = null, accessToken = null) => {
  try {
    if (Platform.OS === 'web' && !idToken) {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await signInWithPopup(auth, provider);
      return result;
    }

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    return await signInWithCredential(auth, credential);
  } catch (error) {
    throw error;
  }
};

/**
 * Sign out current user
 * @returns {Promise}
 */
export const logOut = async () => {
  try {
    if (Platform.OS !== 'web' && GoogleSignin) {
      try {
        const hasGoogleSession = await GoogleSignin.hasPreviousSignIn();
        if (hasGoogleSession) {
          await GoogleSignin.signOut();
        }
      } catch (googleError) {
      }
    }

    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

/**
 * Get current user
 * @returns {Object|null} - Current user or null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 * @param {Function} callback - Callback function to handle auth state
 * @returns {Function} - Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get user-friendly error message
 * @param {string} errorCode - Firebase error code
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/google-signin-not-configured': 'Google sign-in still needs Android OAuth client setup.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/popup-closed-by-user': 'The Google sign-in popup was closed before completing sign-in.',
    'auth/popup-blocked': 'The popup was blocked by your browser. Allow popups and try again.',
    'auth/cancelled-popup-request': 'Another popup request is already in progress.',
    'auth/unauthorized-domain': 'This web domain is not authorized in Firebase Authentication.',
    'auth/operation-not-supported-in-this-environment':
      'Google popup sign-in is not supported in this browser environment.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid credentials. Please try again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'This operation is not allowed.',
    'default': 'An error occurred. Please try again.'
  };

  return errorMessages[errorCode] || errorMessages['default'];
};

const userDocRef = (userId) => doc(db, 'users', userId);

export const loadExpensesFromFirebase = async (userId) => {
  if (!userId) return [];

  const snapshot = await getDoc(userDocRef(userId));
  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.data();
  return Array.isArray(data.expenses) ? data.expenses : [];
};

export const saveExpensesToFirebase = async (expenses, userId) => {
  if (!userId) return;

  await setDoc(
    userDocRef(userId),
    {
      expenses: Array.isArray(expenses) ? expenses : [],
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
};

export const loadBudgetsFromFirebase = async (userId) => {
  if (!userId) {
    return { totalBudget: 0, budgets: [] };
  }

  const snapshot = await getDoc(userDocRef(userId));
  if (!snapshot.exists()) {
    return { totalBudget: 0, budgets: [] };
  }

  const data = snapshot.data();
  return {
    totalBudget: typeof data.totalBudget === 'number' ? data.totalBudget : 0,
    budgets: Array.isArray(data.budgets) ? data.budgets : data.budgets || [],
  };
};

export const saveBudgetsToFirebase = async (totalBudget, budgets, userId) => {
  if (!userId) return;

  await setDoc(
    userDocRef(userId),
    {
      totalBudget: Number(totalBudget) || 0,
      budgets: Array.isArray(budgets) ? budgets : [],
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
};
