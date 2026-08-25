import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ================= HELPER ================= */

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(0) + " KB";
  return (kb / 1024).toFixed(1) + " MB";
}

function formatDate(ts) {
  if (!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function iconFor(namaFile) {
  const ext = (namaFile.split(".").pop() || "").toLowerCase();
  if (["pdf"].includes(ext)) return "📕";
  if (["doc", "docx"].includes(ext)) return "📘";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📗";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "🖼️";
  if (["zip", "rar"].includes(ext)) return "🗜️";
  return "📄";
}

/* ================= UPLOAD KE CLOUDINARY (raw, terima semua jenis file) ================= */

async function uploadKeCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    { method: "POST", body: formData }
  );

  const data = await response.json();

  if (!data.secure_url) {
    console.error(data);
    throw new Error("Upload gagal");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id
  };
}

/* ================= INIT ================= */

let allDokumen = [];
let editingDocId = null;

window.addEventListener("DOMContentLoaded", () => {
  renderDokumen();

  const editModal = document.getElementById("editModal");
  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditModal();
  });
});

/* ================= RENDER LIST ================= */

async function renderDokumen() {
  const listEl = document.getElementById("dokumenList");
  if (!listEl) return;

  listEl.innerHTML = '<p class="dokumen-empty">Memuat...</p>';

  const snap = await getDocs(collection(db, "dokumen"));

  allDokumen = [];
  snap.forEach(d => allDokumen.push({ id: d.id, ...d.data() }));

  allDokumen.sort((a, b) => {
    const tA = a.uploadedAt && a.uploadedAt.seconds ? a.uploadedAt.seconds : 0;
    const tB = b.uploadedAt && b.uploadedAt.seconds ? b.uploadedAt.seconds : 0;
    return tB - tA;
  });

  renderList(allDokumen);
}

function renderList(items) {
  const listEl = document.getElementById("dokumenList");
  if (!listEl) return;

  if (items.length === 0) {
    listEl.innerHTML = '<p class="dokumen-empty">Belum ada dokumen</p>';
    return;
  }

  let html = "";
  items.forEach(item => {
    html += `
      <div class="dokumen-item">
        <div class="dokumen-icon">${iconFor(item.namaFile || "")}</div>
        <div class="dokumen-info">
          <h4>${item.keterangan || item.namaFile || "Tanpa nama"}</h4>
          <p>${item.namaFile || ""} · ${formatSize(item.ukuran)} · ${formatDate(item.uploadedAt)}</p>
        </div>
        <div class="dokumen-actions">
          <a class="btn-download" href="${item.url}" download="${item.namaFile || ""}" target="_blank" rel="noopener">⬇ Unduh</a>
          <button class="btn-edit" onclick="openEditModal('${item.id}')">Edit</button>
          <button class="btn-ganti" onclick="gantiFile('${item.id}')">Ganti File</button>
          <button class="btn-delete" onclick="hapusDokumen('${item.id}')">Hapus</button>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

/* ================= SEARCH ================= */

window.filterDokumen = function () {
  const keyword = document.getElementById("searchDokumen").value.toLowerCase();
  const filtered = allDokumen.filter(item =>
    (item.keterangan || "").toLowerCase().includes(keyword) ||
    (item.namaFile || "").toLowerCase().includes(keyword)
  );
  renderList(filtered);
};

/* ================= UPLOAD ================= */

window.uploadDokumen = async function () {
  const fileInput = document.getElementById("docFile");
  const keteranganInput = document.getElementById("docKeterangan");
  const progressWrap = document.getElementById("docProgressWrap");
  const progressBar = document.getElementById("docProgressBar");
  const progressText = document.getElementById("docProgressText");

  const files = Array.from(fileInput.files || []);
  const keteranganDasar = keteranganInput.value.trim();

  if (files.length === 0) {
    showToast("⚠️ Pilih file dulu!");
    return;
  }

  progressWrap.style.display = "block";

  let berhasil = 0;
  let gagal = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    progressText.innerText = `Mengupload file ${i + 1}/${files.length}...`;
    progressBar.style.width = Math.round((i / files.length) * 100) + "%";

    try {
      const { url, publicId } = await uploadKeCloudinary(file);

      const keterangan = files.length > 1
        ? `${keteranganDasar || "Dokumen"} - ${file.name}`
        : (keteranganDasar || file.name);

      await addDoc(collection(db, "dokumen"), {
        namaFile: file.name,
        keterangan,
        url,
        publicId,
        ukuran: file.size,
        tipe: file.type || "",
        uploadedAt: serverTimestamp()
      });

      berhasil++;

    } catch (err) {
      console.error(err);
      gagal++;
    }
  }

  fileInput.value = "";
  keteranganInput.value = "";
  progressWrap.style.display = "none";
  progressBar.style.width = "0%";

  await renderDokumen();

  let pesan = `${berhasil} dokumen berhasil diupload ✅`;
  if (gagal > 0) pesan += ` (${gagal} gagal)`;
  showToast(pesan);
};

/* ================= EDIT KETERANGAN ================= */

window.openEditModal = function (docId) {
  const item = allDokumen.find(d => d.id === docId);
  if (!item) return;

  editingDocId = docId;
  document.getElementById("editKeterangan").value = item.keterangan || "";
  document.getElementById("editModal").style.display = "flex";
};

window.closeEditModal = function () {
  editingDocId = null;
  document.getElementById("editModal").style.display = "none";
};

window.saveEditDokumen = async function () {
  if (!editingDocId) return;

  const newKeterangan = document.getElementById("editKeterangan").value.trim();

  if (!newKeterangan) {
    showToast("⚠️ Keterangan tidak boleh kosong!");
    return;
  }

  await updateDoc(doc(db, "dokumen", editingDocId), {
    keterangan: newKeterangan
  });

  closeEditModal();
  await renderDokumen();
  showToast("Keterangan diperbarui ✅");
};

/* ================= GANTI FILE ================= */

window.gantiFile = function (docId) {
  const input = document.createElement("input");
  input.type = "file";

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    showToast("Mengganti file...");

    try {
      const { url, publicId } = await uploadKeCloudinary(file);

      await updateDoc(doc(db, "dokumen", docId), {
        namaFile: file.name,
        url,
        publicId,
        ukuran: file.size,
        tipe: file.type || "",
        uploadedAt: serverTimestamp()
      });

      await renderDokumen();
      showToast("File berhasil diganti ✅");

    } catch (err) {
      console.error(err);
      showToast("Gagal mengganti file ❌");
    }
  };

  input.click();
};

/* ================= HAPUS ================= */

window.hapusDokumen = async function (docId) {
  const item = allDokumen.find(d => d.id === docId);
  if (!item) return;

  if (!confirm(`Hapus dokumen "${item.keterangan || item.namaFile}"? Tindakan ini tidak bisa dibatalkan.`)) return;

  try {
    await deleteDoc(doc(db, "dokumen", docId));

    await renderDokumen();
    showToast("Dokumen dihapus 🗑️");

  } catch (err) {
    console.error(err);
    showToast("Gagal menghapus dokumen ❌");
  }
};
