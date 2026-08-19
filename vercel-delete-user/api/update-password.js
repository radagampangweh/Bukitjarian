const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

module.exports = async function handler(req, res) {
  if (req.headers["x-secret-key"] !== process.env.SECRET_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "POST") return res.status(405).end();

  const { uid, newPassword } = req.body;

  if (!uid || !newPassword) {
    return res.status(400).json({ message: "uid dan newPassword wajib diisi" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }

  try {
    await admin.auth().updateUser(uid, { password: newPassword });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};