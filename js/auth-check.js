import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem("isLogin", "true");
  } else {
    localStorage.removeItem("isLogin");

    // Cek apakah ada tujuan redirect khusus (misal saat logout)
    const redirect = localStorage.getItem("logoutRedirect") || "login.html";
    localStorage.removeItem("logoutRedirect");
    window.location.href = redirect;
  }
});