import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBbamwD1s-1WXmCk3jJT8nRi0Kyb1FTPFk",
  authDomain: "g-house-d458c.firebaseapp.com",
  projectId: "g-house-d458c",
  storageBucket: "g-house-d458c.firebasestorage.app",
  messagingSenderId: "660134540946",
  appId: "1:660134540946:web:104eb7ffca0544807ed84b",
  measurementId: "G-LDFT7C8KJJ",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
