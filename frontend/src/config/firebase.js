import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged 
} from "firebase/auth";
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  query,
  getDocs
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// RentIQ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACiUq6kcAc8W8IyBZaDtydkZRBcZwEKzg",
  authDomain: "workspace-project-32409.firebaseapp.com",
  projectId: "workspace-project-32409",
  storageBucket: "workspace-project-32409.firebasestorage.app",
  messagingSenderId: "137897175499",
  appId: "1:137897175499:web:793fd708146e6655886e4e",
  measurementId: "G-W54LLLXKF5"
};

// Initialize Firebase services
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use auto-detect long polling to prevent "client is offline" connection drops on localhost/browsers
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
  });
} catch {
  firestoreInstance = getFirestore(app);
}
export const db = firestoreInstance;
export const googleProvider = new GoogleAuthProvider();
// Force account selection every time (avoids silent cached-account failures in dev)
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Initialize analytics safely if supported
let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch {
    // Analytics is optional in dev / local environments
  }
}
export { analytics };

/**
 * Fetch or initialize a user's Firestore profile safely with offline resilience
 */
export async function syncUserProfile(firebaseUser, additionalData = {}) {
  if (!firebaseUser) return null;

  const isDefaultAdmin = firebaseUser.email?.toLowerCase() === "admin@rentiq.com";
  const defaultRole = additionalData.role || (isDefaultAdmin ? "ADMIN" : "BORROWER");

  const baseProfile = {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: additionalData.name || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "User"),
    role: defaultRole,
    photoURL: firebaseUser.photoURL || "",
    status: "ACTIVE"
  };

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    // Timeout after 3.5s so login is never blocked if Firestore is offline or unprovisioned
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore offline timeout")), 3500));
    const snap = await Promise.race([getDoc(userRef), timeoutPromise]);

    if (snap && snap.exists()) {
      const existing = snap.data();
      // Update last seen
      updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        ...(additionalData.role ? { role: additionalData.role } : {})
      }).catch(() => {});
      return { ...baseProfile, ...existing, ...additionalData };
    } else {
      const newProfile = {
        ...baseProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      setDoc(userRef, newProfile).catch(() => {});
      return newProfile;
    }
  } catch (err) {
    console.warn("Firestore sync skipped (client offline or database not yet created in console):", err.message);
    // Return baseProfile directly from authenticated Firebase User so sign-in always succeeds
    return baseProfile;
  }
}
