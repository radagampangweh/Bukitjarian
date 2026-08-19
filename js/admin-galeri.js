import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/* ================= CLOUDINARY ================= */

const CLOUD_NAME = "doyshrjad";
const UPLOAD_PRESET = "bukitjarian";

/* ================= TOAST ================= */

function showToast(msg) {

  let toast = document.getElementById("toast");

  if (!toast) {

    toast = document.createElement("div");

    toast.id = "toast";

    toast.className = "toast";

    document.body.appendChild(toast);
  }

  toast.innerText = msg;

  toast.classList.add("show");

  setTimeout(() => {

    toast.classList.remove("show");

  }, 3000);
}

/* ================= INIT ================= */

window.addEventListener(
  "DOMContentLoaded",
  initPage
);

let allAlbumsAdmin = [];

async function initPage() {

  await renderAlbums();

  await loadSelect();

  initModal();
}

/* ================= MODAL ================= */

function initModal() {

  const modal =
    document.getElementById("modal");

  if (!modal) return;

  modal.addEventListener(
    "click",
    function(e) {

      if (e.target === modal) {

        closeModal();
      }
    }
  );
}

window.openImage = function(img) {

  const modal =
    document.getElementById("modal");

  const modalImg =
    document.getElementById("modalImg");

  modal.style.display = "flex";

  modalImg.src = img;
};

window.closeModal = function() {

  document.getElementById("modal")
    .style.display = "none";
};

/* ================= BUAT ALBUM ================= */

window.buatAlbum = async function() {

  const input =
    document.getElementById("albumName");

  const dateInput =
    document.getElementById("albumDate");

  const name = input.value.trim();

  const tanggal = dateInput.value;

  if (!name) {

    showToast("⚠️ Nama album wajib diisi!");

    return;
  }

  if (!tanggal) {

    showToast("⚠️ Tanggal kegiatan wajib diisi!");

    return;
  }

  await addDoc(
    collection(db, "galeri"),
    {
      album: name,
      images: [],
      videos: [],
      tanggalKegiatan: tanggal
    }
  );

  input.value = "";

  dateInput.value = "";

  await renderAlbums();

  await loadSelect();

  showToast("Album berhasil dibuat ✅");
};

/* ================= EDIT ALBUM ================= */

window.editAlbum = async function(docId) {

  const docSnap =
    await getDoc(doc(db, "galeri", docId));

  if (!docSnap.exists()) return;

  const data = docSnap.data();

  const name = prompt(
    "Edit nama album:",
    data.album
  );

  if (!name || !name.trim()) return;

  const tanggal = prompt(
    "Edit tanggal kegiatan (YYYY-MM-DD):",
    data.tanggalKegiatan || ""
  );

  await updateDoc(
    doc(db, "galeri", docId),
    {
      album: name.trim(),
      tanggalKegiatan:
        tanggal || data.tanggalKegiatan || ""
    }
  );

  await renderAlbums();

  await loadSelect();

  showToast("Album berhasil diperbarui ✅");
};

/* ================= DELETE ALBUM ================= */

window.hapusAlbum = async function(docId) {

  if (!confirm("Hapus album ini?")) return;

  await deleteDoc(
    doc(db, "galeri", docId)
  );

  await renderAlbums();

  await loadSelect();

  showToast("Album berhasil dihapus 🗑️");
};

/* ================= TAMBAH FOTO ================= */

async function uploadSatuFoto(file) {

  const formData = new FormData();

  formData.append("file", file);

  formData.append(
    "upload_preset",
    UPLOAD_PRESET
  );

  const response = await fetch(

    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  if (!data.secure_url) {

    console.error(data);

    throw new Error("Upload gagal");
  }

  return data.secure_url.replace(
    "/upload/",
    "/upload/f_auto,q_auto/"
  );
}

window.tambahFoto = async function() {

  const albumSelect =
    document.getElementById("albumSelect");

  const imageFile =
    document.getElementById("imageFile");

  const progressWrap =
    document.getElementById("fotoProgressWrap");

  const progressBar =
    document.getElementById("fotoProgressBar");

  const progressText =
    document.getElementById("fotoProgressText");

  const docId = albumSelect.value;

  const files = Array.from(imageFile.files || []);

  if (!docId || files.length === 0) {

    showToast("⚠️ Pilih album dan foto!");

    return;
  }

  const docSnap =
    await getDoc(doc(db, "galeri", docId));

  if (!docSnap.exists()) {

    showToast("Album tidak ditemukan!");

    return;
  }

  const images =
    docSnap.data().images || [];

  let berhasil = 0;
  let gagal = 0;

  if (progressWrap) progressWrap.style.display = "block";

  for (let i = 0; i < files.length; i++) {

    const file = files[i];

    if (progressText) {

      progressText.innerText =
        `Mengupload foto ${i + 1}/${files.length}...`;
    }

    if (progressBar) {

      progressBar.style.width =
        Math.round((i / files.length) * 100) + "%";
    }

    try {

      const imageUrl = await uploadSatuFoto(file);

      images.push(imageUrl);

      berhasil++;

    } catch (err) {

      console.error(err);

      gagal++;
    }
  }

  await updateDoc(
    doc(db, "galeri", docId),
    { images }
  );

  imageFile.value = "";

  if (progressBar) progressBar.style.width = "100%";

  if (progressWrap) progressWrap.style.display = "none";

  await renderAlbums();

  if (gagal === 0) {

    showToast(`${berhasil} foto berhasil ditambahkan ✅`);

  } else {

    showToast(`${berhasil} foto berhasil, ${gagal} gagal ⚠️`);
  }
};

/* ================= TAMBAH VIDEO (BARU) ================= */

function uploadSatuVideo(file, onProgress) {

  return new Promise((resolve, reject) => {

    const formData = new FormData();

    formData.append("file", file);

    formData.append("upload_preset", UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`
    );

    xhr.upload.addEventListener("progress", (e) => {

      if (e.lengthComputable && onProgress) {

        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.onload = () => {

      const data = JSON.parse(xhr.responseText);

      if (data.secure_url) {

        resolve(data.secure_url);

      } else {

        reject(new Error("Upload gagal"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));

    xhr.send(formData);
  });
}

window.tambahVideo = async function() {

  const albumSelect =
    document.getElementById("albumSelectVideo");

  const videoFileInput =
    document.getElementById("videoFile");

  const progressWrap =
    document.getElementById("videoProgressWrap");

  const progressBar =
    document.getElementById("videoProgressBar");

  const progressText =
    document.getElementById("videoProgressText");

  const docId = albumSelect.value;

  const allFiles = Array.from(videoFileInput.files || []);

  if (!docId || allFiles.length === 0) {

    showToast("⚠️ Pilih album dan video!");

    return;
  }

  // Batas ukuran: 100MB per file
  const MAX_SIZE = 100 * 1024 * 1024;

  const files = allFiles.filter(f => f.size <= MAX_SIZE);

  const dilewati = allFiles.length - files.length;

  if (files.length === 0) {

    showToast("⚠️ Semua video melebihi 100MB!");

    return;
  }

  const docSnap =
    await getDoc(doc(db, "galeri", docId));

  if (!docSnap.exists()) {

    showToast("Album tidak ditemukan!");

    return;
  }

  const videos = docSnap.data().videos || [];

  let berhasil = 0;
  let gagal = 0;

  progressWrap.style.display = "block";

  for (let i = 0; i < files.length; i++) {

    const file = files[i];

    try {

      const videoUrl = await uploadSatuVideo(file, (pct) => {

        progressBar.style.width = pct + "%";

        progressText.innerText =
          `Video ${i + 1}/${files.length} — ${pct}%`;
      });

      videos.push(videoUrl);

      berhasil++;

      // Simpan progresif tiap video selesai supaya tidak hilang kalau ada yang gagal
      await updateDoc(
        doc(db, "galeri", docId),
        { videos }
      );

    } catch (err) {

      console.error(err);

      gagal++;
    }
  }

  videoFileInput.value = "";

  progressWrap.style.display = "none";

  progressBar.style.width = "0%";

  await renderAlbums();

  let pesan = `${berhasil} video berhasil ditambahkan ✅`;

  if (gagal > 0) pesan += ` (${gagal} gagal)`;

  if (dilewati > 0) pesan += ` — ${dilewati} dilewati (>100MB)`;

  showToast(pesan);
};

/* ================= LOAD SELECT ================= */

async function loadSelect() {

  const snapshot =
    await getDocs(collection(db, "galeri"));

  let albums = [];

  if (!snapshot.empty) {

    snapshot.forEach(docu => {

      albums.push({ id: docu.id, ...docu.data() });
    });

    albums.sort((a, b) => {

      const tA = a.tanggalKegiatan || "";

      const tB = b.tanggalKegiatan || "";

      return tB.localeCompare(tA);
    });
  }

  // Isi select foto
  const selectFoto =
    document.getElementById("albumSelect");

  if (selectFoto) {

    if (albums.length === 0) {

      selectFoto.innerHTML =
        '<option value="">Belum ada album</option>';

    } else {

      selectFoto.innerHTML = albums.map(a => {

        let label = a.album;

        if (a.tanggalKegiatan) label += ` (${a.tanggalKegiatan})`;

        return `<option value="${a.id}">${label}</option>`;

      }).join("");
    }
  }

  // Isi select video
  const selectVideo =
    document.getElementById("albumSelectVideo");

  if (selectVideo) {

    if (albums.length === 0) {

      selectVideo.innerHTML =
        '<option value="">Belum ada album</option>';

    } else {

      selectVideo.innerHTML = albums.map(a => {

        let label = a.album;

        if (a.tanggalKegiatan) label += ` (${a.tanggalKegiatan})`;

        return `<option value="${a.id}">${label}</option>`;

      }).join("");
    }
  }
}

/* ================= RENDER ALBUM ================= */

async function renderAlbums() {

  const container =
    document.getElementById("albumContainer");

  if (!container) return;

  container.className = "album-grid";

  const snapshot =
    await getDocs(collection(db, "galeri"));

  if (snapshot.empty) {

    container.innerHTML =
      '<p class="empty-text">Belum ada album galeri</p>';

    return;
  }

  allAlbumsAdmin = [];

  snapshot.forEach(docu => {

    allAlbumsAdmin.push({
      id: docu.id,
      ...docu.data()
    });
  });

  allAlbumsAdmin.sort((a, b) => {

    const tA = a.tanggalKegiatan || "";

    const tB = b.tanggalKegiatan || "";

    return tB.localeCompare(tA);
  });

  renderAlbumListAdmin(allAlbumsAdmin);
}

window.renderAlbums = renderAlbums;

/* ================= RENDER LIST ================= */

function renderAlbumListAdmin(albums) {

  const container =
    document.getElementById("albumContainer");

  container.className = "album-grid";

  if (albums.length === 0) {

    container.innerHTML =
      '<p class="empty-text">Album tidak ditemukan</p>';

    return;
  }

  let html = "";

  albums.forEach(a => {

    const id = a.id;

    const fotoCount = a.images ? a.images.length : 0;

    const videoCount = a.videos ? a.videos.length : 0;

    const thumb =
      a.images && a.images.length > 0
      ? a.images[0]
      : "https://via.placeholder.com/300";

    html += '<div class="album-card">';

    html +=
      '<img src="' + thumb + '" loading="lazy" onclick="openAlbum(\'' + id + '\')">';

    html += '<h4>' + a.album + '</h4>';

    html +=
      '<p>' +
      (a.tanggalKegiatan || "Tanggal belum diisi") +
      '</p>';

    html +=
      '<p>' + fotoCount + ' foto · ' + videoCount + ' video</p>';

    html += '<div class="action-row">';

    html +=
      '<button class="btn btn-primary" onclick="editAlbum(\'' + id + '\')">Edit</button>';

    html +=
      '<button class="btn btn-primary" onclick="hapusAlbum(\'' + id + '\')">Hapus</button>';

    html += '</div>';

    html += '</div>';
  });

  container.innerHTML = html;
}

/* ================= SEARCH ================= */

window.filterAlbumAdmin = function() {

  const keyword =
    document.getElementById("searchAlbumAdmin")
    .value
    .toLowerCase();

  const filtered =
    allAlbumsAdmin.filter(a =>
      a.album.toLowerCase().includes(keyword)
    );

  renderAlbumListAdmin(filtered);
};

/* ================= OPEN ALBUM ================= */

window.openAlbum = async function(docId) {

  const container =
    document.getElementById("albumContainer");

  if (!container) return;

  const docSnap =
    await getDoc(doc(db, "galeri", docId));

  if (!docSnap.exists()) return;

  const album = docSnap.data();

  const fotoCount = album.images ? album.images.length : 0;

  const videoCount = album.videos ? album.videos.length : 0;

  container.className = "album-detail";

  let html = "";

  html += '<div class="album-header">';

  html +=
    '<button class="btn btn-primary" onclick="renderAlbums()">← Kembali</button>';

  html += '<div class="album-title">';

  html += '<h2>' + album.album + '</h2>';

  html +=
    '<p>' +
    (album.tanggalKegiatan || "") +
    ' · ' + fotoCount + ' foto · ' + videoCount + ' video</p>';

  html += '</div>';

  html += '</div>';

  /* -------- FOTO -------- */

  html += '<h3 style="margin:16px 0 8px;">📷 Foto</h3>';

  html += '<div class="photo-grid">';

  if (!album.images || album.images.length === 0) {

    html += '<p class="empty-text">Belum ada foto</p>';

  } else {

    album.images.forEach((img, idx) => {

      html += '<div class="photo-card">';

      html +=
        '<img src="' + img + '" loading="lazy" onclick="openImage(\'' + img + '\')">';

      html += '<div class="action-row">';

      html +=
        '<button class="btn-mini btn-delete" onclick="hapusFoto(\'' + docId + '\',' + idx + ')">Hapus</button>';

      html += '</div>';

      html += '</div>';
    });
  }

  html += '</div>';

  /* -------- VIDEO (BARU) -------- */

  html += '<h3 style="margin:20px 0 8px;">🎬 Video</h3>';

  html += '<div class="photo-grid">';

  if (!album.videos || album.videos.length === 0) {

    html += '<p class="empty-text">Belum ada video</p>';

  } else {

    album.videos.forEach((vid, idx) => {

      html += '<div class="photo-card">';

      html +=
        '<video controls preload="metadata" style="width:100%;border-radius:8px;">' +
        '<source src="' + vid + '">' +
        '</video>';

      html += '<div class="action-row">';

      html +=
        '<button class="btn-mini btn-delete" onclick="hapusVideo(\'' + docId + '\',' + idx + ')">Hapus</button>';

      html += '</div>';

      html += '</div>';
    });
  }

  html += '</div>';

  container.innerHTML = html;
};

/* ================= DELETE FOTO ================= */

window.hapusFoto = async function(
  docId,
  fotoIndex
) {

  if (!confirm("Hapus foto ini?")) return;

  const docSnap =
    await getDoc(doc(db, "galeri", docId));

  if (!docSnap.exists()) return;

  const images =
    docSnap.data().images || [];

  images.splice(fotoIndex, 1);

  await updateDoc(
    doc(db, "galeri", docId),
    { images }
  );

  await openAlbum(docId);

  showToast("Foto berhasil dihapus 🗑️");
};

/* ================= DELETE VIDEO (BARU) ================= */

window.hapusVideo = async function(
  docId,
  videoIndex
) {

  if (!confirm("Hapus video ini?")) return;

  const docSnap =
    await getDoc(doc(db, "galeri", docId));

  if (!docSnap.exists()) return;

  const videos =
    docSnap.data().videos || [];

  videos.splice(videoIndex, 1);

  await updateDoc(
    doc(db, "galeri", docId),
    { videos }
  );

  await openAlbum(docId);

  showToast("Video berhasil dihapus 🗑️");
};
