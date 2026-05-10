// pages/api/auth.js
import { getUsers, setUsers } from "../../lib/kv.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "cklcaoile@usm.edu.ph";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin123";
const EXCLUDED = ["jpserquina@usm.edu.ph", "cklcaoile@usm.edu.ph"];

export default async function handler(req, res) {
  const { action } = req.query;

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (action === "login" && req.method === "POST") {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required." });

    const emailLow = email.toLowerCase().trim();
    if (!emailLow.endsWith("@usm.edu.ph"))
      return res.status(401).json({ error: "Only @usm.edu.ph accounts allowed." });

    // Admin login
    if (EXCLUDED.includes(emailLow)) {
      if (password !== ADMIN_SECRET)
        return res.status(401).json({ error: "Incorrect admin password." });
      return res.status(200).json({ role: "admin", email: emailLow, name: "Clark Kneil Caoile" });
    }

    const users = await getUsers();
    const user = users[emailLow];
    if (!user) return res.status(401).json({ error: "Account not found." });
    if (user.password !== password)
      return res.status(401).json({ error: "Incorrect password." });

    return res.status(200).json({
      role: "student",
      email: emailLow,
      sid: user.sid,
      name: user.name,
      courses: user.courses,
      is_temp_pass: user.is_temp_pass || false,
    });
  }

  // ── CHANGE PASSWORD ───────────────────────────────────────────────────────
  if (action === "change_password" && req.method === "POST") {
    const { email, old_password, new_password } = req.body;
    if (!email || !old_password || !new_password)
      return res.status(400).json({ error: "All fields required." });
    if (new_password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters." });

    const users = await getUsers();
    const user = users[email.toLowerCase()];
    if (!user || user.password !== old_password)
      return res.status(401).json({ error: "Incorrect current password." });

    user.password = new_password;
    user.is_temp_pass = false;
    await setUsers(users);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end("Method Not Allowed");
}
