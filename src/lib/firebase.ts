import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC07zjXOjAcdcpvOyHNAW3iRz2umsFwPos",
    authDomain: "nexusaii.firebaseapp.com",
    projectId: "nexusaii",
    storageBucket: "nexusaii.firebasestorage.app",
    messagingSenderId: "24608438986",
    appId: "1:24608438986:web:5502d72bf53cd7e1519233"
};


console.log("Firebase Config:", firebaseConfig);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Firestore
export const firestoreDb = getFirestore(app);
