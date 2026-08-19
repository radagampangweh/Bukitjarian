import { db } from "./firebase.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", initPage);

async function initPage(){
  await loadHeader();
  await renderPengurus();
}

/* ================= HEADER ================= */
async function loadHeader(){
  const docSnap = await getDoc(doc(db, "konten", "pengurusHeader"));
  const data = docSnap.exists() ? docSnap.data() : {};

  document.getElementById("judulPengurus").innerText =
    data.title || "Struktur Pengurus";

  document.getElementById("descPengurus").innerText =
    data.desc || "Daftar pengurus organisasi";
}

/* ================= RENDER ================= */
async function renderPengurus(){
  const container = document.getElementById("pengurusContainer");
  if(!container) return;

  const snapshot = await getDocs(collection(db, "pengurus"));

  if(snapshot.empty){
    container.innerHTML = '<p class="empty-text">Belum ada data pengurus</p>';
    return;
  }

  var items = [];
  snapshot.forEach(docu => {
    items.push({ id: docu.id, ...docu.data() });
  });

  items.sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999));

  var html = "";
  items.forEach(p => {
    var contactHTML = "";
    if(p.contact){
      var nomor = p.contact.replace(/\D/g, "");
      contactHTML = '<a class="contact-btn" href="https://wa.me/' + nomor + '" target="_blank">📞 ' + p.contact + '</a>';
    }
    html += '<div class="pengurus-card">';
    html += '<img src="' + p.foto + '" alt="' + p.nama + '" loading="lazy" onclick="bukaFoto(\'' + p.foto + '\')" style="cursor:pointer">';
    html += '<div class="pengurus-info">';
    html += '<h3>' + p.nama + '</h3>';
    html += '<p class="jabatan">' + p.jabatan + '</p>';
    html += contactHTML;
    html += '</div></div>';
  });

  container.innerHTML = html;
}

window.bukaFoto = function(src){
  document.getElementById("modalFotoImg").src = src;
  document.getElementById("modalFoto").style.display = "flex";
};

window.closeFoto = function(){
  document.getElementById("modalFoto").style.display = "none";
};