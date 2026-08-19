import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js"; // ← tambah ini

const firebaseConfig = {
  apiKey: "AIzaSyAz1LHSaWrGZsLshrUJsZBUCQsYMuXbs6Q",
  authDomain: "bukitjarian.firebaseapp.com",
  projectId: "bukitjarian",
  storageBucket: "bukitjarian.firebasestorage.app",
  messagingSenderId: "622138140857",
  appId: "1:622138140857:web:f13e0ff4d1a3dc34e7d368"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // ← tambah ini

export { db, auth }; // ← tambah auth di export