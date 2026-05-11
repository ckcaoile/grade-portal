// pages/api/auth.js
import { db } from '../../lib/db.js';

const ADMINS = ['cklcaoile@usm.edu.ph'];
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';
const EXCLUDED = ['jpserquina@usm.edu.ph','cklcaoile@usm.edu.ph'];

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === 'login' && req.method === 'POST') {
    const { email, password } = req.body;
    if (!email?.endsWith('@usm.edu.ph'))
      return res.status(401).json({ error: 'Only @usm.edu.ph accounts allowed.' });

    const em = email.toLowerCase().trim();

    // Admin
    if (EXCLUDED.includes(em)) {
      if (password !== ADMIN_SECRET)
        return res.status(401).json({ error: 'Wrong admin password.' });
      return res.json({ role:'admin', email:em, name:'Clark Kneil Caoile' });
    }

    const { data: user, error } = await db().from('users').select('*').eq('email', em).single();
    if (error || !user) return res.status(401).json({ error: 'Account not found.' });
    if (user.password !== password) return res.status(401).json({ error: 'Wrong password.' });

    // Get enrolled courses
    const { data: enr } = await db().from('enrollments').select('course_id').eq('student_email', em);
    const courses = (enr||[]).map(e => e.course_id);

    return res.json({ role:'student', email:em, sid:user.sid, name:user.name, is_temp:user.is_temp, courses });
  }

  if (action === 'change_password' && req.method === 'POST') {
    const { email, old_password, new_password } = req.body;
    if (new_password?.length < 6) return res.status(400).json({ error: 'Min 6 characters.' });
    const { data: user } = await db().from('users').select('*').eq('email', email).single();
    if (!user || user.password !== old_password) return res.status(401).json({ error: 'Wrong current password.' });
    await db().from('users').update({ password: new_password, is_temp: false }).eq('email', email);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
