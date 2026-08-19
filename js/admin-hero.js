import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/* ================= CLOUDINARY ================= */

const CLOUD_NAME = "doyshrjad";
const UPLOAD_PRESET = "bukitjarian";

const KEY = "hero";

/* ================= TOAST ================= */

function showToast(msg) {

  let toast =
    document.getElementById("toast");

  if (!toast) {

    toast =
      document.createElement("div");

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

/* ================= ELEMENT ================= */

const titleInput =
  document.getElementById("heroTitle");

const descInput =
  document.getElementById("heroDesc");

const imageInput =
  document.getElementById("imageFile");

const previewTitle =
  document.getElementById(
    "previewHeroTitle"
  );

const previewDesc =
  document.getElementById(
    "previewHeroDesc"
  );

const previewImg =
  document.getElementById(
    "previewHeroImg"
  );

/* ================= LOAD ================= */

async function loadHero() {

  const docRef =
    doc(db, "konten", KEY);

  const docSnap =
    await getDoc(docRef);

  if (docSnap.exists()) {

    const data =
      docSnap.data();

    titleInput.value =
      data.title || "";

    descInput.value =
      data.desc || "";

    /* =========================
       TAMPILKAN GAMBAR LAMA
    ========================= */

    if (data.image) {

      previewImg.src =
        data.image;

      previewImg.style.display =
        "block";

    } else {

      previewImg.style.display =
        "none";
    }
  }

  updatePreview();
}

/* ================= PREVIEW ================= */

function updatePreview() {

  previewTitle.innerText =
    titleInput.value ||
    "Preview Judul";

  previewDesc.innerText =
    descInput.value ||
    "Preview deskripsi";
}

/* ================= SAVE ================= */

window.saveHero =
async function() {

  const file =
    imageInput.files[0];

  let imageUrl = "";

  try {

    /* =========================
       UPLOAD FOTO
    ========================= */

    if (file) {

      showToast(
        "Mengupload gambar..."
      );

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "upload_preset",
        UPLOAD_PRESET
      );

      const response =
        await fetch(

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

        showToast(
          "Upload gagal ❌"
        );

        return;
      }

      imageUrl =
        data.secure_url;

      /* =========================
         AUTO OPTIMIZE
      ========================= */

      imageUrl =
        imageUrl.replace(
          "/upload/",
          "/upload/f_auto,q_auto/"
        );
    }

    /* =========================
       AMBIL IMAGE LAMA
    ========================= */

    const oldDoc =
      await getDoc(
        doc(db, "konten", KEY)
      );

    const oldData =
      oldDoc.exists()
      ? oldDoc.data()
      : {};

    /* =========================
       SAVE FIREBASE
    ========================= */

    const saveData = {

      title:
        titleInput.value,

      desc:
        descInput.value,

      image:
        imageUrl ||
        oldData.image ||
        ""
    };

    await setDoc(
      doc(db, "konten", KEY),
      saveData
    );

    /* =========================
       UPDATE PREVIEW
    ========================= */

    previewImg.src =
      saveData.image;

    previewImg.style.display =
      "block";

    updatePreview();

    showToast(
      "Hero berhasil disimpan ✅"
    );

  } catch (err) {

    console.error(err);

    showToast(
      "Terjadi kesalahan ❌"
    );
  }
};

/* ================= PREVIEW FOTO BARU ================= */

imageInput.addEventListener(
  "change",
  function() {

    const file =
      this.files[0];

    if (file) {

      previewImg.src =
        URL.createObjectURL(file);

      previewImg.style.display =
        "block";
    }
  }
);

/* ================= EVENT ================= */

titleInput.addEventListener(
  "input",
  updatePreview
);

descInput.addEventListener(
  "input",
  updatePreview
);

/* ================= INIT ================= */

window.addEventListener(
  "DOMContentLoaded",
  loadHero
);