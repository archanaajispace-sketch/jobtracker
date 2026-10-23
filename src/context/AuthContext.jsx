import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';

// Create React Context for Auth
const AuthContext = createContext();

/**
 * useAuth Hook — helper for components to access authentication data & methods.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * AuthProvider — wraps the application to share authentication state.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up a new user with Email and Password
  const signup = (email, password) => {
    if (!auth || !isFirebaseConfigured) {
      return Promise.reject(new Error('Firebase is not configured yet. Please paste your Firebase credentials into .env.'));
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Log in an existing user
  const login = (email, password) => {
    if (!auth || !isFirebaseConfigured) {
      return Promise.reject(new Error('Firebase is not configured yet. Please paste your Firebase credentials into .env.'));
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Log out current user
  const logout = () => {
    if (!auth || !isFirebaseConfigured) {
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
    isFirebaseConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
