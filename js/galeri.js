import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/* ================= HELPER URL ================= */

function getUrl(item) {
  if (!item) return "";
  if (typeof item === "string") return item.trim();
  return (item.url || item.imageUrl || item.path || "").trim();
}

/* ================= GLOBAL ================= */

let currentPhotos = [];
let currentIndex = 0;
let currentVideos = [];
let currentVideoIndex = 0;
let allAlbums = [];

/* ================= INIT ================= */

window.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
  await renderAlbums();
  initModal();
  initVideoModal();
  const params = new URLSearchParams(window.location.search);
  const albumId = params.get("album");
  if (albumId) openAlbum(albumId);
}

/* ================= ANIMASI ================= */

function animateContainer(direction = "right") {
  const container = document.getElementById("galeriContainer");
  if (!container) return;
  container.style.animation = "none";
  container.offsetHeight;
  container.style.animation =
    direction === "right"
      ? "slideInRight 0.35s ease"
      : "slideInLeft 0.35s ease";
}

/* ================= MODAL FOTO ================= */

function initModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (modal.style.display !== "flex") return;
    if (e.key === "ArrowRight") nextPhoto();
    if (e.key === "ArrowLeft") prevPhoto();
    if (e.key === "Escape") closeModal();
  });
}

window.openImage = function (index) {
  if (!Array.isArray(currentPhotos) || currentPhotos.length === 0) return;
  if (index < 0 || index >= currentPhotos.length) return;
  const selectedImg = currentPhotos[index];
  if (!selectedImg || selectedImg === "undefined") return;
  currentIndex = index;
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modalImg");
  if (!modal || !modalImg) return;
  modal.style.display = "flex";
  modalImg.src = selectedImg;
  document.getElementById("modalCounter").innerText =
    (index + 1) + " / " + currentPhotos.length;
};

window.nextPhoto = function () {
  if (currentPhotos.length === 0) return;
  currentIndex = (currentIndex + 1) % currentPhotos.length;
  const img = currentPhotos[currentIndex];
  if (!img) return;
  document.getElementById("modalImg").src = img;
  document.getElementById("modalCounter").innerText =
    (currentIndex + 1) + " / " + currentPhotos.length;
};

window.prevPhoto = function () {
  if (currentPhotos.length === 0) return;
  currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
  const img = currentPhotos[currentIndex];
  if (!img) return;
  document.getElementById("modalImg").src = img;
  document.getElementById("modalCounter").innerText =
    (currentIndex + 1) + " / " + currentPhotos.length;
};

window.closeModal = function () {
  const modal = document.getElementById("modal");
  if (modal) modal.style.display = "none";
  currentIndex = 0;
};

/* ================= MODAL VIDEO ================= */

function initVideoModal() {
  if (document.getElementById("videoModal")) return;

  const modalEl = document.createElement("div");
  modalEl.id = "videoModal";
  modalEl.style.cssText = `
    display:none;
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.95);
    z-index:9999;
    align-items:center;
    justify-content:center;
    flex-direction:column;
  `;

  modalEl.innerHTML = `
    <button id="videoModalClose" style="
      position:absolute;
      top:16px;
      right:16px;
      background:rgba(255,255,255,0.15);
      border:none;
      color:#fff;
      font-size:22px;
      width:44px;
      height:44px;
      border-radius:50%;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:10000;
    ">✕</button>
    <button id="videoModalPrev" style="
      position:absolute;
      left:8px;
      top:50%;
      transform:translateY(-50%);
      background:rgba(255,255,255,0.15);
      border:none;
      color:#fff;
      font-size:32px;
      width:48px;
      height:48px;
      border-radius:50%;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:10000;
    ">&#8249;</button>
    <video id="videoModalPlayer" controls playsinline style="
      width:100%;
      max-width:100vw;
      max-height:90vh;
      background:#000;
      outline:none;
    "></video>
    <button id="videoModalNext" style="
      position:absolute;
      right:8px;
      top:50%;
      transform:translateY(-50%);
      background:rgba(255,255,255,0.15);
      border:none;
      color:#fff;
      font-size:32px;
      width:48px;
      height:48px;
      border-radius:50%;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:10000;
    ">&#8250;</button>
    <div id="videoModalCounter" style="
      position:absolute;
      bottom:16px;
      left:50%;
      transform:translateX(-50%);
      color:#fff;
      font-size:13px;
      background:rgba(0,0,0,0.5);
      padding:4px 12px;
      border-radius:12px;
      z-index:10000;
    "></div>
  `;

  document.body.appendChild(modalEl);

  modalEl.addEventListener("click", function (e) {
    if (e.target === modalEl) closeVideoModal();
  });

  document.getElementById("videoModalClose").addEventListener("click", closeVideoModal);
  document.getElementById("videoModalPrev").addEventListener("click", prevVideo);
  document.getElementById("videoModalNext").addEventListener("click", nextVideo);

  document.addEventListener("keydown", function (e) {
    const modal = document.getElementById("videoModal");
    if (modal && modal.style.display === "flex") {
      if (e.key === "Escape") closeVideoModal();
      if (e.key === "ArrowRight") nextVideo();
      if (e.key === "ArrowLeft") prevVideo();
    }
  });
}

window.openVideo = function (index) {
  if (!Array.isArray(currentVideos) || currentVideos.length === 0) return;
  if (index < 0 || index >= currentVideos.length) return;
  currentVideoIndex = index;
  const modal = document.getElementById("videoModal");
  const player = document.getElementById("videoModalPlayer");
  const counter = document.getElementById("videoModalCounter");
  const prevBtn = document.getElementById("videoModalPrev");
  const nextBtn = document.getElementById("videoModalNext");
  if (!modal || !player) return;
  player.src = currentVideos[index];
  modal.style.display = "flex";
  player.play().catch(() => {});
  if (counter) counter.innerText = (index + 1) + " / " + currentVideos.length;
  const showNav = currentVideos.length > 1;
  if (prevBtn) prevBtn.style.display = showNav ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = showNav ? "flex" : "none";
};

window.nextVideo = function () {
  if (currentVideos.length === 0) return;
  currentVideoIndex = (currentVideoIndex + 1) % currentVideos.length;
  openVideo(currentVideoIndex);
};

window.prevVideo = function () {
  if (currentVideos.length === 0) return;
  currentVideoIndex = (currentVideoIndex - 1 + currentVideos.length) % currentVideos.length;
  openVideo(currentVideoIndex);
};

window.closeVideoModal = function () {
  const modal = document.getElementById("videoModal");
  const player = document.getElementById("videoModalPlayer");
  if (!modal || !player) return;
  player.pause();
  player.src = "";
  modal.style.display = "none";
  currentVideoIndex = 0;
};

/* ================= SHARE ================= */

window.toggleSharePanel = function () {
  const panel = document.getElementById("sharePanel");
  if (!panel) return;
  panel.classList.toggle("open");
};

window.copyShareLink = function (url) {
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("btnCopyLink");
    if (btn) { btn.textContent = "✓ Disalin!"; btn.classList.add("copied"); }
    showShareToast("Link berhasil disalin! 🎉");
    setTimeout(() => {
      if (btn) { btn.textContent = "Salin"; btn.classList.remove("copied"); }
    }, 2500);
  });
};

window.shareNative = async function (url, title) {
  if (navigator.share) {
    try { await navigator.share({ title: title + " – Bukit Jarian", url }); return; } catch (_) {}
  }
  copyShareLink(url);
};

function showShareToast(msg) {
  const t = document.getElementById("shareToast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

/* ================= CLEANUP ================= */

function cleanupListeners() {}

/* ================= HISTORY ================= */

window.addEventListener("popstate", function () {
  const modal = document.getElementById("modal");
  if (modal && modal.style.display === "flex") {
    closeModal();
    return;
  }
  cleanupListeners();
  renderAlbums("back");
});

/* ================= RENDER ALBUMS ================= */

async function renderAlbums(from = "init") {
  const container = document.getElementById("galeriContainer");
  if (!container) return;

  cleanupListeners();
  history.replaceState({ page: "home" }, "", "galeri.html");
  animateContainer(from === "back" ? "left" : "right");
  container.className = "galeri-grid";

  const snapshot = await getDocs(collection(db, "galeri"));

  if (snapshot.empty) {
    container.innerHTML = '<p class="empty-text">Belum ada album galeri</p>';
    return;
  }

  allAlbums = [];
  snapshot.forEach(docu => {
    allAlbums.push({ id: docu.id, ...docu.data() });
  });

  allAlbums.sort((a, b) => {
    const tA = a.tanggalKegiatan || "";
    const tB = b.tanggalKegiatan || "";
    return tB.localeCompare(tA);
  });

  renderAlbumList(allAlbums);
}

window.renderAlbums = renderAlbums;

/* ================= RENDER LIST ================= */

function renderAlbumList(albums) {
  const container = document.getElementById("galeriContainer");
  if (!container) return;

  container.className = "galeri-grid";

  if (albums.length === 0) {
    container.innerHTML = '<p class="empty-text">Album tidak ditemukan</p>';
    return;
  }

  let html = "";
  albums.forEach(a => {
    let thumb = "https://via.placeholder.com/400";
    if (a.images && a.images.length > 0) {
      const firstImg = getUrl(a.images[0]);
      if (firstImg) thumb = firstImg;
    }
    const jumlahFoto = Array.isArray(a.images) ? a.images.length : 0;
    const jumlahVideo = Array.isArray(a.videos) ? a.videos.length : 0;

    html += `
      <div class="galeri-card" onclick="openAlbum('${a.id}')">
        <img src="${thumb}" loading="lazy" alt="thumbnail">
        <div class="galeri-info">
          <h4>${a.album || "Tanpa Judul"}</h4>
          <p>${jumlahFoto} foto · ${jumlahVideo} video</p>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* ================= SEARCH ================= */

window.filterAlbum = function () {
  const keyword = document.getElementById("searchAlbum").value.toLowerCase();
  const filtered = allAlbums.filter(a =>
    (a.album || "").toLowerCase().includes(keyword)
  );
  renderAlbumList(filtered);
};

/* ================= OPEN ALBUM ================= */

window.openAlbum = async function (docId) {
  history.pushState({ page: "album", id: docId }, "", "?album=" + docId);
  animateContainer("right");

  const container = document.getElementById("galeriContainer");
  if (!container) return;

  const docSnap = await getDoc(doc(db, "galeri", docId));

  if (!docSnap.exists()) {
    container.innerHTML = '<p class="empty-text">Album tidak ditemukan</p>';
    return;
  }

  const album = docSnap.data();
  container.className = "album-view";

  currentPhotos = (album.images || [])
    .map(getUrl)
    .filter(img => img && img !== "undefined" && img.startsWith("http"));

  currentVideos = (album.videos || [])
    .filter(v => v && v.startsWith("http"));

  const jumlahFoto = currentPhotos.length;
  const jumlahVideo = currentVideos.length;

  const shareUrl = `${location.origin}${location.pathname}?album=${docId}`;
  const shareText = encodeURIComponent(`Lihat album "${album.album || "Galeri"}" di Bukit Jarian: ${shareUrl}`);

  let html = `
    <div class="album-header">
      <button class="btn-back" onclick="renderAlbums('back')">← Kembali</button>
      <div class="album-title">
        <h2>${album.album || "Tanpa Judul"}</h2>
        ${album.tanggalKegiatan ? `<p>${album.tanggalKegiatan}</p>` : ""}
        <p>${jumlahFoto} foto · ${jumlahVideo} video</p>
      </div>
    </div>

    <!-- SHARE BUTTON -->
    <div class="share-wrapper">
      <button class="btn-share" onclick="toggleSharePanel()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Bagikan Album
      </button>

      <div class="share-panel" id="sharePanel">
        <p class="share-label">Salin link album</p>
        <div class="share-url-row">
          <input class="share-url-input" id="shareUrlInput" readonly value="${shareUrl}">
          <button class="btn-copy-link" id="btnCopyLink" onclick="copyShareLink('${shareUrl}')">Salin</button>
        </div>
        <div class="share-socials">
          <a class="share-social-btn wa" href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener">
            <span>💬</span> WhatsApp
          </a>
          <a class="share-social-btn fb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">
            <span>📘</span> Facebook
          </a>
          <a class="share-social-btn tw" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(album.album || "Galeri Bukit Jarian")}" target="_blank" rel="noopener">
            <span>🐦</span> Twitter
          </a>
          <button class="share-social-btn other" onclick="shareNative('${shareUrl}', '${(album.album || "Galeri").replace(/'/g,"\\'")}')">
            <span>📤</span> Lainnya
          </button>
        </div>
      </div>
    </div>

    <div id="shareToast" class="share-toast"></div>
  `;

  /* -------- VIDEO (tampil duluan) -------- */
  html += `<h3 style="margin:16px 0 8px; font-size:15px; color:#374151;">🎬 Video</h3>`;
  html += `<div class="photo-grid">`;

  if (jumlahVideo === 0) {
    html += `<p class="empty-text">Belum ada video</p>`;
  } else {
    currentVideos.forEach((vid, vIdx) => {
      html += `
        <div class="photo-card" onclick="openVideo(${vIdx})" style="cursor:pointer; position:relative;">
          <video preload="metadata" style="width:100%; border-radius:8px; pointer-events:none; display:block;">
            <source src="${vid}#t=0.1">
          </video>
          <div style="
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            background:rgba(0,0,0,0.3);
            border-radius:8px;
          ">
            <div style="
              width:52px;
              height:52px;
              background:rgba(255,255,255,0.9);
              border-radius:50%;
              display:flex;
              align-items:center;
              justify-content:center;
            ">
              <span style="font-size:22px; margin-left:5px;">▶</span>
            </div>
          </div>
        </div>
      `;
    });
  }

  html += `</div>`;

  /* -------- FOTO (tampil setelah video) -------- */
  html += `<h3 style="margin:20px 0 8px; font-size:15px; color:#374151;">📷 Foto</h3>`;
  html += `<div class="photo-grid">`;

  if (jumlahFoto === 0) {
    html += `<p class="empty-text">Belum ada foto</p>`;
  } else {
    currentPhotos.forEach((img, idx) => {
      html += `
        <div class="photo-card">
          <img src="${img}" loading="lazy" alt="foto" onclick="openImage(${idx})">
        </div>
      `;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
};
