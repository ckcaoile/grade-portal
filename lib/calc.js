// lib/calc.js — Grade formulas matching the Excel grading system

export const EG_TABLE = [
  [95.636,100,1],[91.181,95.625,1.25],[86.727,91.17,1.5],
  [82.272,86.716,1.75],[77.818,82.262,2],[73.363,77.807,2.25],
  [68.909,73.353,2.5],[64.454,68.898,2.75],[60,64.444,3],[0,59.99,5]
];

export function getEG(p) {
  if (p == null) return null;
  for (const [lo,hi,eg] of EG_TABLE) if (p>=lo && p<=hi) return eg;
  return 5;
}
export function getRemark(p) {
  return p == null ? null : p >= 75 ? "PASSED" : "FAILED";
}

// cols = [{id, type, label, max_score}]
// vals = {col_id: numeric_value}
export function calcComponent(cols, vals) {
  const g = (type) => cols.filter(c => c.type === type);

  // Attendance
  const att = g('att');
  const attPresent = att.reduce((s,c) => s + (vals[c.id]===1||vals[c.id]==='P'?1:0), 0);
  const attAvg = att.length > 0 ? (attPresent/att.length)*100 : 0;
  const attPts = attAvg * 0.10;

  // Activities/Quizzes (40% lab, 0% lec)
  const act = g('act');
  const actMax = act.reduce((s,c) => s+(c.max_score||0), 0);
  const actSum = act.reduce((s,c) => s+Math.min(vals[c.id]||0, c.max_score||0), 0);
  const actAvg = actMax > 0 ? (actSum/actMax)*100 : 0;
  const actPts = actAvg * 0.40;

  // Assignment (10% lab, 30% lec)
  const asgn = g('asgn');
  const asgnMax = asgn.reduce((s,c) => s+(c.max_score||0), 0);
  const asgnSum = asgn.reduce((s,c) => s+Math.min(vals[c.id]||0, c.max_score||0), 0);
  const asgnAvg = asgnMax > 0 ? (asgnSum/asgnMax)*100 : 0;
  const hasLec = g('cp').length > 0 || g('act').length === 0;
  const asgnPts = asgnAvg * (hasLec ? 0.30 : 0.10);

  // Class Participation (0% lab, 20% lec)
  const cp = g('cp');
  const cpMax = cp.reduce((s,c) => s+(c.max_score||0), 0);
  const cpSum = cp.reduce((s,c) => s+Math.min(vals[c.id]||0, c.max_score||0), 0);
  const cpAvg = cpMax > 0 ? (cpSum/cpMax)*100 : 0;
  const cpPts = cpAvg * 0.20;

  // Exam/Project (40%)
  const exam = g('exam');
  const examMax = exam.reduce((s,c) => s+(c.max_score||0), 0);
  const examSum = exam.reduce((s,c) => s+Math.min(vals[c.id]||0, c.max_score||0), 0);
  const examAvg = examMax > 0 ? (examSum/examMax)*100 : 0;
  const examPts = examAvg * 0.40;

  const grade = attPts + actPts + asgnPts + cpPts + examPts;

  return {
    att:  {present:attPresent, total:att.length, avg:attAvg, pts:attPts, weight:"10%"},
    act:  {sum:actSum, max:actMax, avg:actAvg, pts:actPts, weight:"40%"},
    asgn: {sum:asgnSum, max:asgnMax, avg:asgnAvg, pts:asgnPts, weight:hasLec?"30%":"10%"},
    cp:   {sum:cpSum, max:cpMax, avg:cpAvg, pts:cpPts, weight:"20%"},
    exam: {sum:examSum, max:examMax, avg:examAvg, pts:examPts, weight:"40%"},
    grade,
  };
}

export function calcFinalGrade(mtLab, mtLec, ftLab, ftLec, course) {
  const {lab_weight=1, lec_weight=0, mt_weight=0.5, ft_weight=0.5} = course;
  const mt = (mtLab?.grade||0)*lab_weight + (mtLec?.grade||0)*lec_weight;
  const ft = (ftLab?.grade||0)*lab_weight + (ftLec?.grade||0)*lec_weight;
  const fg = mt*mt_weight + ft*ft_weight;
  return {mt, ft, fg, mt_eg:getEG(mt), ft_eg:getEG(ft), fg_eg:getEG(fg)};
}
