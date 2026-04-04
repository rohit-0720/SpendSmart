// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBb00KchzC971qe7jDUVBsHKp6SmGvBKkE",
  authDomain: "spendsmart-59695.firebaseapp.com",
  projectId: "spendsmart-59695",
  storageBucket: "spendsmart-59695.firebasestorage.app",
  messagingSenderId: "477414873813",
  appId: "1:477414873813:web:dff88fe047e92a98d3605c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
