// pages/api/courses.js
import { getCourses, setCourses, getUsers, setUsers } from "../../lib/kv.js";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin123";

function authAdmin(req) {
  return req.headers["x-admin-secret"] === ADMIN_SECRET ||
    req.body?.adminSecret === ADMIN_SECRET;
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── GET COURSES (public – students only see their enrolled courses) ────────
  if (req.method === "GET" && action === "list") {
    const courses = await getCourses();
    // Strip student lists for public view (return metadata only)
    const meta = {};
    for (const [id, c] of Object.entries(courses)) {
      meta[id] = {
        id, code: c.code, title: c.title,
        section: c.section, sem: c.sem, grading: c.grading,
        mt_weight: c.mt_weight, ft_weight: c.ft_weight,
        student_count: (c.students || []).length,
      };
    }
    return res.status(200).json(meta);
  }

  // ── GET STUDENT GRADE for a specific course ───────────────────────────────
  if (req.method === "GET" && action === "student_grade") {
    const { course_id, email } = req.query;
    const courses = await getCourses();
    const course = courses[course_id];
    if (!course) return res.status(404).json({ error: "Course not found" });

    const student = (course.students || []).find(s => s.email === email);
    if (!student) return res.status(403).json({ error: "Not enrolled" });

    // Return student's own data + course meta
    return res.status(200).json({
      course: {
        id: course_id, code: course.code, title: course.title,
        section: course.section, sem: course.sem, grading: course.grading,
        mt_weight: course.mt_weight, ft_weight: course.ft_weight,
      },
      student,
    });
  }

  // ── ADMIN: GET FULL COURSE DATA ───────────────────────────────────────────
  if (req.method === "GET" && action === "admin_course") {
    if (!authAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { course_id } = req.query;
    const courses = await getCourses();
    if (course_id) return res.status(200).json(courses[course_id] || null);
    return res.status(200).json(courses);
  }

  // ── ADMIN: UPDATE STUDENT GRADE ───────────────────────────────────────────
  if (req.method === "POST" && action === "update_grade") {
    if (!authAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { course_id, sid, field, value } = req.body;

    const courses = await getCourses();
    const course = courses[course_id];
    if (!course) return res.status(404).json({ error: "Course not found" });

    const student = (course.students || []).find(s => s.sid === sid);
    if (!student) return res.status(404).json({ error: "Student not found" });

    if (!student.grades) student.grades = {};
    student.grades[field] = value;

    await setCourses(courses);
    return res.status(200).json({ ok: true });
  }

  // ── ADMIN: ADD NEW COURSE ─────────────────────────────────────────────────
  if (req.method === "POST" && action === "add_course") {
    if (!authAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { course } = req.body;
    if (!course || !course.id || !course.code)
      return res.status(400).json({ error: "Invalid course data" });

    const courses = await getCourses();
    if (courses[course.id]) return res.status(409).json({ error: "Course ID already exists" });
    courses[course.id] = { ...course, students: course.students || [] };

    // Add students to users
    const users = await getUsers();
    for (const s of (course.students || [])) {
      if (s.email) {
        if (!users[s.email]) {
          users[s.email] = {
            sid: s.sid, name: s.name, email: s.email,
            password: s.email + (s.sid || ""), is_temp_pass: true, courses: [course.id],
          };
        } else {
          if (!users[s.email].courses.includes(course.id))
            users[s.email].courses.push(course.id);
        }
      }
    }

    await setCourses(courses);
    await setUsers(users);
    return res.status(200).json({ ok: true });
  }

  // ── ADMIN: DELETE COURSE ──────────────────────────────────────────────────
  if (req.method === "POST" && action === "delete_course") {
    if (!authAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { course_id } = req.body;
    const courses = await getCourses();
    delete courses[course_id];
    await setCourses(courses);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end("Method Not Allowed");
}
