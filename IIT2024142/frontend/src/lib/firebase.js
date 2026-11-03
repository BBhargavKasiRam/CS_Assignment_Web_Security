import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, FacebookAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvLydrddU5MSGjMfjURUd12WNB09LpVRU",
  authDomain: "login-project-64597.firebaseapp.com",
  projectId: "login-project-64597",
  storageBucket: "login-project-64597.firebasestorage.app",
  messagingSenderId: "700168561340",
  appId: "1:700168561340:web:83c026c6ff4ef86eaa66b9",
  measurementId: "G-T7GV32L0B6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider('microsoft.com');
export const facebookProvider = new FacebookAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

export const signInWithMicrosoft = async () => {
  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    return result.user;
  } catch (error) {
    console.error("Microsoft Sign-In Error:", error);
    throw error;
  }
};

export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return result.user;
  } catch (error) {
    console.error("Facebook Sign-In Error:", error);
    throw error;
  }
};
