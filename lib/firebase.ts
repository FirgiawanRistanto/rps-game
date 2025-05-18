// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCBkcY4foFpUnd1BQ3zLKyaYXNhfiB-VoE",
  authDomain: "rps-game-26b84.firebaseapp.com",
  projectId: "rps-game-26b84",
  storageBucket: "rps-game-26b84.firebasestorage.app",
  messagingSenderId: "759180823150",
  appId: "1:759180823150:web:bba35a7d6c748c5a76347f",
  measurementId: "G-TP873KQCR8",
};

// Cek apakah sudah pernah inisialisasi Firebase (penting supaya gak double init)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Optional, inisialisasi analytics hanya di client (jika ingin pakai)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Dapatkan Firestore db
const db = getFirestore(app);

export { app, analytics, db };
