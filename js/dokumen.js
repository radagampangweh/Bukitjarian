import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let allDokumenPublik = [];

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

async function renderDokumenPublik() {
  const listEl = document.getElementById("dokumenListPublik");
  if (!listEl) return;

  listEl.innerHTML = '<p class="dokumen-empty-publik">Memuat...</p>';

  try {
    const snap = await getDocs(collection(db, "dokumen"));

    allDokumenPublik = [];
    snap.forEach(d => allDokumenPublik.push({ id: d.id, ...d.data() }));

    allDokumenPublik.sort((a, b) => {
      const tA = a.uploadedAt && a.uploadedAt.seconds ? a.uploadedAt.seconds : 0;
      const tB = b.uploadedAt && b.uploadedAt.seconds ? b.uploadedAt.seconds : 0;
      return tB - tA;
    });

    renderListPublik(allDokumenPublik);

  } catch (err) {
    console.error(err);
    listEl.innerHTML = '<p class="dokumen-empty-publik">Gagal memuat dokumen. Pastikan kamu login sebagai admin.</p>';
  }
}

function renderListPublik(items) {
  const listEl = document.getElementById("dokumenListPublik");
  if (!listEl) return;

  if (items.length === 0) {
    listEl.innerHTML = '<p class="dokumen-empty-publik">Belum ada dokumen</p>';
    return;
  }

  let html = "";
  items.forEach(item => {
    html += `
      <div class="dokumen-item-publik">
        <div class="dokumen-icon-publik">${iconFor(item.namaFile || "")}</div>
        <div class="dokumen-info-publik">
          <h4>${item.keterangan || item.namaFile || "Tanpa nama"}</h4>
          <p>${item.namaFile || ""} · ${formatSize(item.ukuran)} · ${formatDate(item.uploadedAt)}</p>
        </div>
        <a class="dokumen-unduh-btn" href="${item.url}" download="${item.namaFile || ""}" target="_blank" rel="noopener">⬇ Unduh</a>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

window.filterDokumenPublik = function () {
  const keyword = document.getElementById("searchDokumenPublik").value.toLowerCase();
  const filtered = allDokumenPublik.filter(item =>
    (item.keterangan || "").toLowerCase().includes(keyword) ||
    (item.namaFile || "").toLowerCase().includes(keyword)
  );
  renderListPublik(filtered);
};

window.addEventListener("DOMContentLoaded", renderDokumenPublik);
