// pages/api/grades.js
import { db } from '../../lib/db.js';
import { calcComponent, calcFinalGrade, getEG, getRemark } from '../../lib/calc.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';
function isAdmin(req) { return req.headers['x-admin']===ADMIN_SECRET || req.body?.secret===ADMIN_SECRET; }

async function buildGrade(courseId, studentEmail, course) {
  // Get all columns for this course
  const { data: cols } = await db().from('score_cols').select('*').eq('course_id', courseId).order('position');
  // Get all scores for this student
  const { data: sc } = await db().from('scores').select('*').eq('student_email', studentEmail);
  const vals = {};
  (sc||[]).forEach(s => { vals[s.col_id] = s.value; });

  const byCombination = (term, comp) => (cols||[]).filter(c => c.term===term && c.component===comp);

  const mtLab = calcComponent(byCombination('mt','lab'), vals);
  const mtLec = calcComponent(byCombination('mt','lec'), vals);
  const ftLab = calcComponent(byCombination('ft','lab'), vals);
  const ftLec = calcComponent(byCombination('ft','lec'), vals);
  const final = calcFinalGrade(mtLab, mtLec, ftLab, ftLec, course);

  return { cols, vals, mtLab, mtLec, ftLab, ftLec, final };
}

export default async function handler(req, res) {
  const { action } = req.query;

  // GET: student's own grades
  if (action === 'my_grades' && req.method === 'GET') {
    const { course_id, email } = req.query;
    // Verify enrolled
    const { data: enr } = await db().from('enrollments').select('*,courses(*)').eq('student_email', email).eq('course_id', course_id).single();
    if (!enr) return res.status(403).json({ error: 'Not enrolled' });

    const course = enr.courses;
    const { data: student } = await db().from('users').select('sid,name').eq('email', email).single();
    const grades = await buildGrade(course_id, email, course);

    return res.json({ course, student: {...student, email}, grades, remarks: enr.admin_remarks });
  }

  // GET: admin - all grades for a course
  if (action === 'course_grades' && req.method === 'GET') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { course_id } = req.query;
    const { data: course } = await db().from('courses').select('*').eq('id', course_id).single();
    const { data: cols } = await db().from('score_cols').select('*').eq('course_id', course_id).order('position');
    const { data: enrolled } = await db().from('enrollments').select('student_email,admin_remarks,users(sid,name)').eq('course_id', course_id);
    const { data: allScores } = await db().from('scores').select('*').in('student_email', (enrolled||[]).map(e=>e.student_email));

    const students = (enrolled||[]).map(enr => {
      const vals = {};
      (allScores||[]).filter(s=>s.student_email===enr.student_email).forEach(s=>{ vals[s.col_id]=s.value; });
      const byComb = (term,comp) => (cols||[]).filter(c=>c.term===term&&c.component===comp);
      const mtLab = calcComponent(byComb('mt','lab'), vals);
      const mtLec = calcComponent(byComb('mt','lec'), vals);
      const ftLab = calcComponent(byComb('ft','lab'), vals);
      const ftLec = calcComponent(byComb('ft','lec'), vals);
      const final = calcFinalGrade(mtLab, mtLec, ftLab, ftLec, course);
      return { email:enr.student_email, sid:enr.users?.sid, name:enr.users?.name, vals, final, remarks:enr.admin_remarks };
    });

    return res.json({ course, cols, students });
  }

  // GET: list all courses (admin)
  if (action === 'courses' && req.method === 'GET') {
    if (!isAdmin(req)) return res.status(401).json({ error:'Unauthorized' });
    const { data } = await db().from('courses').select('*');
    return res.json(data||[]);
  }

  // POST: save a single score
  if (action === 'save_score' && req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error:'Unauthorized' });
    const { student_email, col_id, value } = req.body;
    await db().from('scores').upsert({ student_email, col_id, value }, { onConflict: 'student_email,col_id' });
    return res.json({ ok: true });
  }

  // POST: add column (attendance date, activity, etc.)
  if (action === 'add_col' && req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error:'Unauthorized' });
    const { course_id, term, component, type, label, max_score } = req.body;
    // Get max position
    const { data: existing } = await db().from('score_cols').select('position').eq('course_id',course_id).eq('term',term).eq('component',component).order('position',{ascending:false}).limit(1);
    const pos = (existing?.[0]?.position ?? -1) + 1;
    const { data: col } = await db().from('score_cols').insert({ course_id, term, component, type, label, max_score, position:pos }).select().single();
    return res.json({ ok:true, col });
  }

  // POST: delete column
  if (action === 'del_col' && req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error:'Unauthorized' });
    await db().from('score_cols').delete().eq('id', req.body.col_id);
    return res.json({ ok:true });
  }

  // POST: save remarks
  if (action === 'save_remarks' && req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error:'Unauthorized' });
    const { student_email, course_id, remarks } = req.body;
    await db().from('enrollments').update({ admin_remarks: remarks }).eq('student_email',student_email).eq('course_id',course_id);
    return res.json({ ok:true });
  }

  // POST: add course
  if (action === 'add_course' && req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error:'Unauthorized' });
    const { course } = req.body;
    await db().from('courses').upsert(course, { onConflict:'id' });
    return res.json({ ok:true });
  }

  res.status(404).end();
}
