import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email    = document.querySelector('input[type="email"]').value.trim();
  const password = document.querySelector('input[type="password"]').value.trim();

  if (!email || !password) {
    alert("Email dan password harus diisi!");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const adminDoc = await getDoc(doc(db, "admins", user.uid));

    if (!adminDoc.exists()) {
      await signOut(auth);
      alert("Akses ditolak. Hanya admin yang bisa login.");
      return;
    }

    localStorage.setItem("isLogin", "true");
    localStorage.setItem("namaAdmin", user.displayName || user.email);
    alert("Login berhasil! Selamat datang, " + (user.displayName || user.email));
    window.location.href = "index.html";

  } catch (error) {
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      alert("Email atau password salah!");
    } else {
      alert("Gagal login: " + error.message);
    }
  }
});