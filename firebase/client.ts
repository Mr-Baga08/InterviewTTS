// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjfea363k54WFOIfgz0xbmN583eG_Etjg",
  authDomain: "thetruthschool-de615.firebaseapp.com",
  projectId: "thetruthschool-de615",
  storageBucket: "thetruthschool-de615.firebasestorage.app",
  messagingSenderId: "13713892620",
  appId: "1:13713892620:web:c4146632d6e7a5cffbd529",
  measurementId: "G-ZHP3BZZSRZ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
