// Firebase initialization (modular SDK) used by login.html and attendance.html
// Keep only project configuration here to avoid duplication across pages.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Your web app's Firebase configuration
// Note: These values come from your Firebase console (shown in your screenshot)
export const firebaseConfig = {
  apiKey: "AIzaSyAowym6LDOJruwod7fYCo6SCAOBvaP57c",
  authDomain: "attendance-d2e4a.firebaseapp.com",
  projectId: "attendance-d2e4a",
  storageBucket: "attendance-d2e4a.firebasestorage.app",
  messagingSenderId: "668354991573",
  appId: "1:668354991573:web:1a7de4d0cd0523a958d95c",
  measurementId: "G-BK2T5KKTQG",
};

// Initialize Firebase and export Auth instance for reuse
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


