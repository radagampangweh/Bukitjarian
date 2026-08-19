import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function cekNotif(){
  const badge = document.getElementById("notifBadge");
  if(!badge) return;

  try {
    const snapshot = await getDocs(collection(db, "kritik_saran"));
    let belumDibalas = 0;

    snapshot.forEach(doc => {
      const d = doc.data();
      const balasanList = d.balasanList || [];
      const balasan = d.balasan || "";
      if(balasanList.length === 0 && !balasan){
        belumDibalas++;
      }
    });

    if(belumDibalas > 0){
      badge.textContent = belumDibalas;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }

  } catch(e) {
    console.error(e);
  }
}

cekNotif();