// Authentication Context
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  logOut,
  resetPassword,
  onAuthStateChange,
  getErrorMessage
} from '../firebase/firebaseService';

// Create Auth Context
const AuthContext = createContext({});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        // User is signed in
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        });
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Sign up with email
  const signUp = async (email, password, displayName) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signUpWithEmail(email, password, displayName);
      return result;
    } catch (error) {
      const message = getErrorMessage(error.code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithEmail(email, password);
      return result;
    } catch (error) {
      const message = getErrorMessage(error.code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInGoogle = async (idToken, accessToken) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithGoogle(idToken, accessToken);
      return result;
    } catch (error) {
      const message = getErrorMessage(error.code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOutUser = async () => {
    try {
      setError(null);
      await logOut();
    } catch (error) {
      const message = getErrorMessage(error.code);
      setError(message);
      throw new Error(message);
    }
  };

  // Reset password
  const resetUserPassword = async (email) => {
    try {
      setError(null);
      await resetPassword(email);
      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      const message = getErrorMessage(error.code);
      setError(message);
      throw new Error(message);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInGoogle,
    signOut: signOutUser,
    resetPassword: resetUserPassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
