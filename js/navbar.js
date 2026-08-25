import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const navBtn = document.getElementById("navLoginBtn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Tambahkan link Admin di navbar
    const adminLink = document.createElement("a");
    adminLink.href = "admin.html";
    adminLink.textContent = "Admin";
    adminLink.style.marginRight = "10px";
    navBtn.parentNode.insertBefore(adminLink, navBtn);

    // Tambahkan link Dokumen di navbar (hanya untuk admin yang login)
    const dokumenLink = document.createElement("a");
    dokumenLink.href = "dokumen.html";
    dokumenLink.textContent = "Dokumen";
    dokumenLink.style.marginRight = "10px";
    navBtn.parentNode.insertBefore(dokumenLink, navBtn);

    // Ubah tombol jadi Logout
    navBtn.textContent = `Logout (${user.email})`;
    navBtn.href = "#";
    navBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await signOut(auth);
      window.location.href = "index.html";
    });
  } else {
    // Belum login
    navBtn.textContent = "Login";
    navBtn.href = "login.html";
  }
});