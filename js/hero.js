import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function loadHero(){

  const docRef = doc(db, "konten", "hero");
  const docSnap = await getDoc(docRef);

  const data = docSnap.exists() ? docSnap.data() : {};

  document.getElementById("heroTitle").innerText =
    data.title || "Selamat Datang";

  document.getElementById("heroDesc").innerText =
    data.desc || "Website resmi Bukit Jarian";

  const heroImg = document.getElementById("heroImg");
  if(data.image){
    heroImg.src = data.image;
    heroImg.style.display = "block";
  } else {
    heroImg.style.display = "none";
  }
}

window.addEventListener("DOMContentLoaded", loadHero);