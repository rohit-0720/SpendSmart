// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

let auth;

try {
  const AsyncStorage =
    require('@react-native-async-storage/async-storage').default;

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

export { auth };

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
