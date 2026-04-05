import { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import app from '../firebase/firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const ANDROID_CLIENT_ID = '477414873813-i1snu5ia8vd4lthf5hhpipeq2kfv9jfg.apps.googleusercontent.com';
const WEB_CLIENT_ID     = '477414873813-7cj3no3r4uukea006glcjd87sercbmus.apps.googleusercontent.com';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Add redirectUri (CRITICAL for Expo)
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });

  // ✅ Auth state persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        console.log('✅ User logged in:', currentUser.email || currentUser.displayName);
      } else {
        console.log('ℹ️ No user logged in');
      }
    });
    return unsubscribe;
  }, []);

  // ✅ FIX: safer response handling
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response?.params?.id_token;

      if (!idToken) {
        console.error('❌ No ID token received');
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);

      signInWithCredential(auth, credential)
        .then((result) => {
          console.log('✅ Google sign-in (native):', result.user.email);
        })
        .catch((error) => {
          console.error('❌ Google credential error:', error.message);
        });
    }
  }, [response]);

  // Email/Password Sign Up
  const signUp = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Account created:', result.user.email);
      return { success: true };
    } catch (error) {
      console.error('❌ Sign up error:', error.message);
      return { success: false, error: getErrorMessage(error.code) };
    }
  };

  // Email/Password Login
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Logged in:', result.user.email);
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return { success: false, error: getErrorMessage(error.code) };
    }
  };

  // ✅ Google Sign In
  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'web') {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('✅ Google sign-in (web):', result.user.email);
        return { success: true };
      } else {
        const result = await promptAsync();

        if (result?.type === 'success') {
          return { success: true };
        } else if (result?.type === 'cancel' || result?.type === 'dismiss') {
          return { success: false, error: 'Sign-in cancelled. Please try again.' };
        } else {
          return { success: false, error: 'Google Sign-In failed. Please try again.' };
        }
      }
    } catch (error) {
      console.error('❌ Google sign-in error:', error.message);
      return { success: false, error: getErrorMessage(error.code) };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Logged out');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use': return 'This email is already registered. Try logging in instead.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/user-not-found': return 'No account found with this email. Try signing up.';
      case 'auth/wrong-password': return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests': return 'Too many failed attempts. Please try again later.';
      case 'auth/popup-closed-by-user': return 'Sign-in cancelled. Please try again.';
      default: return 'Something went wrong. Please try again.';
    }
  };

  const value = { user, loading, signUp, login, signInWithGoogle, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}