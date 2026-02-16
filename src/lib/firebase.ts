import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCjXUIlDvdaG_8KknLMOuNU4XhZiIAzBnY",
  authDomain: "internly-12.firebaseapp.com",
  projectId: "internly-12",
  storageBucket: "internly-12.firebasestorage.app",
  messagingSenderId: "574019615807",
  appId: "1:574019615807:web:beeab2dd72a5cbeeeecc8a",
  measurementId: "G-XWMLM31L80",
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
