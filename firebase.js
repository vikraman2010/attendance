// Firebase initialization (modular SDK) used by login.html and attendance.html
// Placed at project root so Vite can import it from HTML via module scripts.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAowym6LDOJruwod7fYCo6SCAOBvaP57c",
  authDomain: "attendance-d2e4a.firebaseapp.com",
  projectId: "attendance-d2e4a",
  storageBucket: "attendance-d2e4a.firebasestorage.app",
  messagingSenderId: "668354991573",
  appId: "1:668354991573:web:1a7de4d0cd0523a958d95c",
  measurementId: "G-BK2T5KKTQG",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


