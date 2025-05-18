// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBkcY4foFpUnd1BQ3zLKyaYXNhfiB-VoE",
  authDomain: "rps-game-26b84.firebaseapp.com",
  projectId: "rps-game-26b84",
  storageBucket: "rps-game-26b84.firebasestorage.app",
  messagingSenderId: "759180823150",
  appId: "1:759180823150:web:bba35a7d6c748c5a76347f",
  measurementId: "G-TP873KQCR8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
