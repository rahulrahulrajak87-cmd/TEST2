import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVne-B3rZPZ_4VgbbgmvmsC4rVdEEU-P4",
  authDomain: "the-hero-investor.firebaseapp.com",
  projectId: "the-hero-investor",
  storageBucket: "the-hero-investor.firebasestorage.app",
  messagingSenderId: "850117319342",
  appId: "1:850117319342:web:7ef02f9a6035ea54b9eb3f",
  measurementId: "G-EH4FNEW6VN"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
