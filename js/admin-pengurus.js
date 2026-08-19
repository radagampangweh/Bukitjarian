import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/* ================= CLOUDINARY ================= */

const CLOUD_NAME = "doyshrjad";
const UPLOAD_PRESET = "bukitjarian";

let editDocId = null;

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

function initPage() {

  render();

  loadHeaderPengurus();

  initModal();

  initPreviewFoto();
}

/* ================= HEADER ================= */

async function loadHeaderPengurus() {

  const docSnap =
    await getDoc(
      doc(db, "konten", "pengurusHeader")
    );

  if (docSnap.exists()) {

    const data = docSnap.data();

    document.getElementById(
      "judulPengurus"
    ).value = data.title || "";

    document.getElementById(
      "descPengurus"
    ).value = data.desc || "";
  }
}

window.simpanHeaderPengurus =
async function() {

  const data = {

    title:
      document.getElementById(
        "judulPengurus"
      ).value,

    desc:
      document.getElementById(
        "descPengurus"
      ).value
  };

  await setDoc(
    doc(db, "konten", "pengurusHeader"),
    data
  );

  showToast("Header berhasil disimpan ✅");
};

/* ================= MODAL ================= */

function initModal() {

  const modal =
    document.getElementById("modal");

  modal.addEventListener(
    "click",
    function(e) {

      if (e.target === modal) {

        closeModal();
      }
    }
  );
}

window.openAdd = function() {

  editDocId = null;

  resetForm();

  document.getElementById(
    "modalTitle"
  ).innerText = "Tambah Pengurus";

  document.getElementById(
    "modal"
  ).style.display = "flex";
};

window.closeModal = function() {

  document.getElementById(
    "modal"
  ).style.display = "none";

  resetForm();
};

/* ================= SAVE ================= */

window.simpanPengurus =
async function() {

  const nama =
    document.getElementById(
      "namaInput"
    ).value.trim();

  const jabatan =
    document.getElementById(
      "jabatanInput"
    ).value.trim();

  const contact =
    document.getElementById(
      "contactInput"
    ).value.trim();

  const imageFile =
    document.getElementById(
      "imageFile"
    );

  const file =
    imageFile.files[0];

  if (!nama || !jabatan || !file) {

    showToast(
      "⚠️ Lengkapi data terlebih dahulu!"
    );

    return;
  }

  try {

    showToast("Mengupload foto...");

    /* =========================
       UPLOAD KE CLOUDINARY
    ========================= */

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

    const data =
      await response.json();

    if (!data.secure_url) {

      console.error(data);

      showToast("Upload gagal ❌");

      return;
    }

    /* =========================
       AUTO OPTIMIZE IMAGE
    ========================= */

    let imageUrl =
      data.secure_url;

    imageUrl = imageUrl.replace(
      "/upload/",
      "/upload/f_auto,q_auto/"
    );

    const item = {

      nama,
      jabatan,
      contact,
      foto: imageUrl
    };

    /* =========================
       SAVE FIREBASE
    ========================= */

    if (editDocId === null) {

      const snapshot =
        await getDocs(
          collection(db, "pengurus")
        );

      item.urutan =
        snapshot.size;

      await addDoc(
        collection(db, "pengurus"),
        item
      );

    } else {

      await updateDoc(
        doc(db, "pengurus", editDocId),
        item
      );
    }

    render();

    closeModal();

    showToast(
      "Data pengurus berhasil disimpan ✅"
    );

  } catch (err) {

    console.error(err);

    showToast("Upload gagal ❌");
  }
};

/* ================= EDIT ================= */

window.editPengurus =
async function(docId) {

  const docSnap =
    await getDoc(
      doc(db, "pengurus", docId)
    );

  if (!docSnap.exists()) return;

  const item = docSnap.data();

  document.getElementById(
    "namaInput"
  ).value = item.nama;

  document.getElementById(
    "jabatanInput"
  ).value = item.jabatan;

  document.getElementById(
    "contactInput"
  ).value = item.contact || "";

  const preview =
    document.getElementById(
      "previewFoto"
    );

  preview.src = item.foto;

  preview.style.display = "block";

  editDocId = docId;

  document.getElementById(
    "modalTitle"
  ).innerText = "Edit Pengurus";

  document.getElementById(
    "modal"
  ).style.display = "flex";
};

/* ================= DELETE ================= */

window.hapusPengurus =
async function(docId) {

  if (!confirm(
    "Hapus pengurus ini?"
  )) return;

  await deleteDoc(
    doc(db, "pengurus", docId)
  );

  render();

  showToast(
    "Pengurus berhasil dihapus 🗑️"
  );
};

/* ================= RENDER ================= */

async function render() {

  const container =
    document.getElementById(
      "listPengurus"
    );

  const snapshot =
    await getDocs(
      collection(db, "pengurus")
    );

  if (snapshot.empty) {

    container.innerHTML = `

      <div class="empty-state">
        <h3>Belum Ada Pengurus</h3>
        <p>Tambahkan pengurus pertama</p>
      </div>

    `;

    return;
  }

  let items = [];

  snapshot.forEach(docu => {

    items.push({
      id: docu.id,
      ...docu.data()
    });
  });

  items.sort(
    (a, b) =>
      (a.urutan ?? 999)
      -
      (b.urutan ?? 999)
  );

  let html = '';

  html +=
  '<div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">';

  html +=
  '<p style="font-size:12px;color:#6b7280;">🔀 Tahan dan geser kartu untuk mengatur urutan</p>';

  html +=
  '<button class="btn btn-primary" onclick="simpanUrutan()">💾 Simpan Urutan</button>';

  html += '</div>';

  items.forEach((p, idx) => {

    html +=
    '<div class="thumb-card draggable" draggable="true" data-id="' + p.id + '" data-idx="' + idx + '">';

    html +=
    '<div class="drag-handle">⠿</div>';

    html +=
    '<img src="' + p.foto + '">';

    html +=
    '<h4>' + p.nama + '</h4>';

    html +=
    '<p>' + p.jabatan + '</p>';

    html +=
    '<p style="font-size:12px;color:#2563eb;">' +
    (p.contact ? '📞 ' + p.contact : '') +
    '</p>';

    html +=
    '<div class="action-buttons">';

    html +=
    '<button class="btn-mini btn-edit" onclick="editPengurus(\'' + p.id + '\')">Edit</button>';

    html +=
    '<button class="btn-mini btn-delete" onclick="hapusPengurus(\'' + p.id + '\')">Hapus</button>';

    html += '</div>';

    html += '</div>';
  });

  container.innerHTML = html;

  initDragDrop();
}

/* ================= DRAG DROP ================= */

function initDragDrop() {

  const container =
    document.getElementById(
      "listPengurus"
    );

  if (!container) return;

  let dragEl = null;

  container.addEventListener(
    "dragstart",
    e => {

      dragEl =
        e.target.closest(".draggable");

      if (dragEl) {

        dragEl.classList.add(
          "dragging"
        );

        e.dataTransfer.effectAllowed =
          "move";
      }
    }
  );

  container.addEventListener(
    "dragend",
    () => {

      if (dragEl) {

        dragEl.classList.remove(
          "dragging"
        );

        dragEl = null;
      }
    }
  );

  container.addEventListener(
    "dragover",
    e => {

      e.preventDefault();

      const target =
        e.target.closest(".draggable");

      if (
        target &&
        target !== dragEl
      ) {

        const rect =
          target.getBoundingClientRect();

        const midX =
          rect.left + rect.width / 2;

        if (e.clientX < midX) {

          container.insertBefore(
            dragEl,
            target
          );

        } else {

          container.insertBefore(
            dragEl,
            target.nextSibling
          );
        }
      }
    }
  );
}

/* ================= SIMPAN URUTAN ================= */

window.simpanUrutan =
async function() {

  const container =
    document.getElementById(
      "listPengurus"
    );

  const cards =
    container.querySelectorAll(
      ".draggable"
    );

  const updates = [];

  cards.forEach((card, idx) => {

    const id =
      card.getAttribute("data-id");

    updates.push(

      updateDoc(
        doc(db, "pengurus", id),
        { urutan: idx }
      )
    );
  });

  await Promise.all(updates);

  showToast(
    "Urutan berhasil disimpan ✅"
  );
};

/* ================= RESET ================= */

function resetForm() {

  document.getElementById(
    "namaInput"
  ).value = "";

  document.getElementById(
    "jabatanInput"
  ).value = "";

  document.getElementById(
    "contactInput"
  ).value = "";

  const imageFile =
    document.getElementById(
      "imageFile"
    );

  if (imageFile) {

    imageFile.value = "";
  }

  const preview =
    document.getElementById(
      "previewFoto"
    );

  preview.style.display = "none";

  preview.src = "";
}

/* ================= PREVIEW FOTO ================= */

function initPreviewFoto() {

  const imageFile =
    document.getElementById(
      "imageFile"
    );

  if (!imageFile) return;

  imageFile.addEventListener(
    "change",
    function() {

      const file =
        this.files[0];

      const preview =
        document.getElementById(
          "previewFoto"
        );

      if (file) {

        preview.src =
          URL.createObjectURL(file);

        preview.style.display =
          "block";

      } else {

        preview.style.display =
          "none";
      }
    }
  );
}