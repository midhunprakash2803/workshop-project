import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  syncUserProfile 
} from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rentiq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('rentiq_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase Auth state & attach real-time Firestore profile listener
  useEffect(() => {
    let unsubscribeFirestore = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('rentiq_token', idToken);

          // Synchronize / ensure profile document exists in Firestore
          await syncUserProfile(firebaseUser);

          // Real-time Firestore listener for live user data management
          const userRef = doc(db, 'users', firebaseUser.uid);
          unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const profile = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                role: data.role || (firebaseUser.email?.toLowerCase() === 'admin@rentiq.com' ? 'ADMIN' : 'BORROWER'),
                photoURL: data.photoURL || firebaseUser.photoURL || null,
                ...data
              };
              setUser(profile);
              localStorage.setItem('rentiq_user', JSON.stringify(profile));
            }
          }, (err) => {
            console.warn('Firestore onSnapshot listener offline/paused:', err.message);
          });
        } catch (err) {
          console.error('Error synchronizing Firebase user profile:', err);
        }
      } else {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('rentiq_token');
        localStorage.removeItem('rentiq_user');
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  /**
   * Email & Password Sign In
   */
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();
      const profile = await syncUserProfile(firebaseUser);

      setToken(idToken);
      setUser(profile);
      localStorage.setItem('rentiq_token', idToken);
      localStorage.setItem('rentiq_user', JSON.stringify(profile));
      return { success: true, user: profile };
    } catch (err) {
      let friendlyMessage = 'Sign in failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Invalid email format.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many attempts. Please try again in a few moments.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }
      throw new Error(friendlyMessage);
    }
  };

  /**
   * Google Sign-In with Popup
   */
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();
      const profile = await syncUserProfile(firebaseUser);

      setToken(idToken);
      setUser(profile);
      localStorage.setItem('rentiq_token', idToken);
      localStorage.setItem('rentiq_user', JSON.stringify(profile));
      return { success: true, user: profile };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        throw new Error('Google sign-in was cancelled. Please try again.');
      }
      if (err.code === 'auth/unauthorized-domain') {
        const host = window.location.hostname;
        throw new Error(
          `This domain (${host}) is not authorized in Firebase Console. ` +
          `Go to Firebase Console → Authentication → Settings → Authorized domains → Add "${host}".`
        );
      }
      if (err.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site.');
      }
      throw new Error(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  /**
   * Register new user with Email, Password and Role
   */
  const register = async (name, email, password, role = 'BORROWER') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth display name
      if (name) {
        await updateProfile(firebaseUser, { displayName: name.trim() }).catch(() => {});
      }

      // Create profile in Firestore
      const profile = await syncUserProfile(firebaseUser, {
        name: name.trim(),
        role: role.toUpperCase()
      });

      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);
      setUser(profile);
      localStorage.setItem('rentiq_token', idToken);
      localStorage.setItem('rentiq_user', JSON.stringify(profile));
      return { success: true, user: profile };
    } catch (err) {
      let friendlyMessage = 'Account creation failed.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be at least 6 characters long.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Invalid email address.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }
      throw new Error(friendlyMessage);
    }
  };

  /**
   * Send Password Reset Email
   */
  const resetPassword = async (email) => {
    if (!email) throw new Error('Please enter your email address.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err) {
      throw new Error(err.message || 'Could not send password reset email.');
    }
  };

  /**
   * Create or Ensure Primary Admin Credentials in Firebase
   */
  const createAdminUser = async (password = 'Admin@123') => {
    const adminEmail = 'admin@rentiq.com';
    try {
      // Try logging in first
      try {
        return await login(adminEmail, password);
      } catch (loginErr) {
        // If user doesn't exist, create it
        if (loginErr.message?.includes('Invalid') || loginErr.message?.includes('not-found')) {
          const res = await register('System Administrator', adminEmail, password, 'ADMIN');
          return res;
        }
        throw loginErr;
      }
    } catch (err) {
      throw new Error(`Admin setup: ${err.message}`);
    }
  };

  /**
   * Switch Role in Firestore (Updates user permission in real-time)
   */
  const switchRole = async (targetRole) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        role: targetRole,
        updatedAt: serverTimestamp()
      });
      setUser(prev => prev ? ({ ...prev, role: targetRole }) : prev);
    } catch (err) {
      console.warn('Could not switch role in Firestore:', err);
    }
  };

  /**
   * Sign Out
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('rentiq_token');
      localStorage.removeItem('rentiq_user');
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    loginWithGoogle,
    register,
    resetPassword,
    createAdminUser,
    switchRole,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
