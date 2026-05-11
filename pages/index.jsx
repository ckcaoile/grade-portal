import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { calcComponent, calcFinalGrade, getEG, getRemark } from "../lib/calc.js";

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "";

function n(v,d=2){if(v==null||v==="")return"—";return typeof v==="number"?d===0?String(Math.round(v)):v.toFixed(d):String(v);}
function pct(v){return v==null?"—":Number(v).toFixed(2)+"%";}

async function api(path, opts={}) {
  const r = await fetch(path, { ...opts, headers:{"Content-Type":"application/json",...(opts.headers||{})} });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error||"Error");
  return j;
}

// ── DISCLAIMER ───────────────────────────────────────────────────────────────
const DISCLAIMER = `⚠️ DISCLAIMER — This application is developed solely for the personal use of Mr. Clark Kneil Caoile as a supplementary tool to help students view their academic activities and scores. It is NOT an official system of the University of Southern Mindanao (USM). Grades shown here are for reference only. This app has no affiliation with, endorsement by, or authorization from USM. All official grades are reflected in the university's official records.`;

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("login");
  const [session, setSession] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const adminKey = useRef("");

  function showToast(msg, type="ok") { setToast({msg,type}); setTimeout(()=>setToast(null),3000); }

  function afterLogin(sess, secret="") {
    setSession(sess);
    adminKey.current = secret;
    if (sess.role==="admin") { setPage("admin"); return; }
    if (sess.is_temp) { setPage("change_pass"); return; }
    if (sess.courses?.length===1) { setSelectedCourse(sess.courses[0]); setPage("dashboard"); }
    else setPage("pick_subject");
  }

  function logout() { setSession(null); setPage("login"); adminKey.current=""; setSelectedCourse(null); }

  return (<>
    <Head><title>USM Grade Portal</title><meta name="viewport" content="width=device-width,initial-scale=1"/></Head>
    <Styles/>
    {toast && <div className={`toast ${toast.type==="err"?"toast-err":""}`}>{toast.msg}</div>}

    {page==="login" && <LoginPage onLogin={afterLogin}/>}
    {page==="change_pass" && <ChangePass session={session} onDone={()=>{
      setSession(s=>({...s,is_temp:false}));
      if (session?.courses?.length===1){setSelectedCourse(session.courses[0]);setPage("dashboard");}
      else setPage("pick_subject");
    }} showToast={showToast}/>}
    {page==="pick_subject" && <PickSubject session={session} onPick={id=>{setSelectedCourse(id);setPage("dashboard");}} onLogout={logout}/>}
    {page==="dashboard" && <StudentDash session={session} courseId={selectedCourse} onBack={()=>setPage("pick_subject")} onLogout={logout} onChangePass={()=>setPage("change_pass")} adminKey={adminKey}/>}
    {page==="admin" && <AdminDash session={session} onLogout={logout} adminKey={adminKey} showToast={showToast}/>}
  </>);
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginPage({onLogin}) {
  const [email,setEmail] = useState("");
  const [pass,setPass] = useState("");
  const [err,setErr] = useState("");
  const [busy,setBusy] = useState(false);
  const [showDisc,setShowDisc] = useState(false);

  async function submit() {
    setErr("");
    if (!email.includes("@usm.edu.ph")) return setErr("Use your @usm.edu.ph email address.");
    setBusy(true);
    try {
      const sess = await api("/api/auth?action=login",{method:"POST",body:JSON.stringify({email:email.trim().toLowerCase(),password:pass})});
      onLogin(sess, pass);
    } catch(e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-inner">
        <div className="logo">USM</div>
        <h1 className="school-name">University of Southern Mindanao</h1>
        <p className="school-sub">Grade Activity Portal · Clark Kneil Caoile</p>

        <div className="login-box">
          <h2>Sign In</h2>
          <div className="fw"><label className="fl">USM Email</label>
            <input className="inp" value={email} onChange={e=>setEmail(e.target.value)} placeholder="yourname@usm.edu.ph" type="email" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <div className="fw"><label className="fl">Password</label>
            <input className="inp" value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <button className="btn-main" onClick={submit} disabled={busy}>{busy?"Signing in…":"Sign In"}</button>
          {err && <div className="err-box">{err}</div>}
          <p className="hint">First time? Password = your <b>email + student ID</b><br/><span style={{fontSize:".68rem",color:"#999"}}>e.g. yourname@usm.edu.ph25-12345</span></p>
          <button onClick={()=>setShowDisc(!showDisc)} style={{width:"100%",marginTop:".75rem",background:"none",border:"1px solid #DDD",borderRadius:6,padding:".4rem",fontSize:".72rem",color:"#999",cursor:"pointer"}}>
            {showDisc?"Hide":"Read"} Disclaimer ⚠️
          </button>
          {showDisc && <div className="disc-box">{DISCLAIMER}</div>}
        </div>
      </div>
    </div>
  );
}

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
function ChangePass({session, onDone, showToast}) {
  const [old,setOld] = useState(session?.is_temp ? session.email+(session.sid||"") : "");
  const [n1,setN1] = useState(""); const [n2,setN2] = useState("");
  const [err,setErr] = useState(""); const [busy,setBusy] = useState(false);

  async function submit() {
    setErr("");
    if (n1!==n2) return setErr("Passwords don't match.");
    if (n1.length<6) return setErr("Min 6 characters.");
    setBusy(true);
    try {
      await api("/api/auth?action=change_password",{method:"POST",body:JSON.stringify({email:session.email,old_password:old,new_password:n1})});
      showToast("Password updated!");
      onDone();
    } catch(e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-inner">
        <div className="logo">USM</div>
        <div className="login-box">
          <h2>{session?.is_temp?"Set Your Password":"Change Password"}</h2>
          {session?.is_temp && <p style={{fontSize:".8rem",color:"var(--mu)",marginBottom:"1rem",lineHeight:1.6}}>Welcome! You're on a temporary password. Set a new one to continue.</p>}
          <div className="fw"><label className="fl">Current Password</label><input className="inp" value={old} onChange={e=>setOld(e.target.value)} type="password"/></div>
          <div className="fw"><label className="fl">New Password</label><input className="inp" value={n1} onChange={e=>setN1(e.target.value)} type="password" placeholder="Min 6 characters"/></div>
          <div className="fw"><label className="fl">Confirm</label><input className="inp" value={n2} onChange={e=>setN2(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          <button className="btn-main" onClick={submit} disabled={busy}>{busy?"Saving…":"Save Password"}</button>
          {err && <div className="err-box">{err}</div>}
        </div>
      </div>
    </div>
  );
}

// ── SUBJECT PICKER ────────────────────────────────────────────────────────────
function PickSubject({session, onPick, onLogout}) {
  const [courses,setCourses] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      const all = await api("/api/grades?action=courses",{headers:{"x-admin":process.env.NEXT_PUBLIC_ADMIN_SECRET||""}});
      const mine = all.filter(c => session.courses.includes(c.id));
      setCourses(mine); setLoading(false);
    })();
  },[]);

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <div className="topbar"><div><div className="tt">USM Grade Portal</div><div className="ts">University of Southern Mindanao</div></div><button className="btn-sm" onClick={onLogout}>Logout</button></div>
      <div style={{padding:"1.25rem",maxWidth:640,margin:"0 auto"}}>
        <div className="banner" style={{borderRadius:12,marginBottom:"1.1rem"}}><h2>{session.name}</h2><p>{session.email}</p></div>
        <h3 style={{fontSize:".8rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:".8rem"}}>Your Subjects</h3>
        {loading ? <p style={{color:"var(--mu)"}}>Loading…</p> : courses.map(c=>(
          <button key={c.id} className="subject-card" onClick={()=>onPick(c.id)}>
            <div style={{fontWeight:800,color:"var(--m)",fontSize:"1rem"}}>{c.code}</div>
            <div style={{fontWeight:600,marginTop:".15rem"}}>{c.title}</div>
            <div style={{fontSize:".74rem",color:"var(--mu)",marginTop:".25rem"}}>{c.section} · {c.sem}</div>
            <div style={{fontSize:".72rem",color:"var(--mu)",marginTop:".45rem"}}>Tap to view your grades →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── STUDENT DASHBOARD ─────────────────────────────────────────────────────────
const STU_TABS = ["Overview","Midterm Lab","Final Lab","Final Grade"];

function StudentDash({session, courseId, onBack, onLogout, onChangePass}) {
  const [data,setData] = useState(null);
  const [tab,setTab] = useState(0);
  const [popup,setPopup] = useState(null); // {title, rows, color}

  async function load() {
    try {
      const r = await api(`/api/grades?action=my_grades&course_id=${courseId}&email=${encodeURIComponent(session.email)}`);
      setData(r);
    } catch(e) { console.error(e); }
  }

  useEffect(()=>{ load(); const t=setInterval(load,30000); return()=>clearInterval(t); },[courseId]);

  if (!data) return <Spinner/>;

  const {course, student, grades, remarks} = data;
  const {mtLab, mtLec, ftLab, ftLec, final, cols, vals} = grades;
  const multiCourse = session.courses?.length > 1;

  function showDetail(title, comp, color) {
    const rows = [];
    if (comp.att?.total !== undefined) rows.push({label:`Attendance (${comp.att.weight})`, detail:`${comp.att.present}/${comp.att.total} days`, pts:comp.att.pts});
    if (comp.act?.max > 0) rows.push({label:`Activities/Quizzes (${comp.act.weight})`, detail:`${n(comp.act.sum,0)}/${comp.act.max}`, pts:comp.act.pts});
    if (comp.asgn?.max > 0) rows.push({label:`Assignments (${comp.asgn.weight})`, detail:`${n(comp.asgn.sum,0)}/${comp.asgn.max}`, pts:comp.asgn.pts});
    if (comp.cp?.max > 0) rows.push({label:`Class Participation (${comp.cp.weight})`, detail:`${n(comp.cp.sum,0)}/${comp.cp.max}`, pts:comp.cp.pts});
    if (comp.exam?.max > 0) rows.push({label:`Exam/Project (${comp.exam.weight})`, detail:`${n(comp.exam.sum,0)}/${comp.exam.max}`, pts:comp.exam.pts});
    setPopup({title, rows, grade:comp.grade, color});
  }

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div className="topbar">
        <div><div className="tt">{course.code} · {course.section}</div><div className="ts">{course.title}</div></div>
        <div style={{display:"flex",gap:".4rem"}}>
          <button className="btn-sm" onClick={onChangePass}>🔑</button>
          {multiCourse && <button className="btn-sm" onClick={onBack}>◀ Subjects</button>}
          <button className="btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>
      <div className="banner"><h2>{student.name}</h2><p>ID: {student.sid} · {session.email}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:".7rem",marginTop:".5rem"}}>
          <span style={{fontSize:".7rem",opacity:.75}}>{course.sem}</span>
          <span style={{fontSize:".7rem",opacity:.75}}>MT {Math.round((course.mt_weight||.5)*100)}% + FT {Math.round((course.ft_weight||.5)*100)}%</span>
        </div>
      </div>
      {remarks && <div className="remarks-banner">📝 Note from instructor: {remarks}</div>}
      <div className="tabs">{STU_TABS.map((t,i)=><button key={i} className={"tab"+(tab===i?" on":"")} onClick={()=>setTab(i)}>{t}</button>)}</div>

      <div className="content">
        {tab===0 && <StuOverview final={final} course={course} mtLab={mtLab} mtLec={mtLec} ftLab={ftLab} ftLec={ftLec} onDetail={showDetail}/>}
        {tab===1 && <StuComponent comp={mtLab} title="Midterm Laboratory" cols={cols.filter(c=>c.term==="mt"&&c.component==="lab")} vals={vals} onDetail={()=>showDetail("Midterm Lab Breakdown",mtLab,"#1A6B35")}/>}
        {tab===2 && <StuComponent comp={ftLab} title="Final Laboratory" cols={cols.filter(c=>c.term==="ft"&&c.component==="lab")} vals={vals} onDetail={()=>showDetail("Final Lab Breakdown",ftLab,"#7B1C1C")}/>}
        {tab===3 && <StuFinalGrade final={final} course={course}/>}
      </div>

      {popup && <Popup {...popup} onClose={()=>setPopup(null)}/>}
    </div>
  );
}

function StuOverview({final, course, mtLab, mtLec, ftLab, ftLec, onDetail}) {
  const cards = [
    {label:"Midterm Grade", val:final.mt, eg:final.mt_eg, comp:mtLab, color:"#1A6B35"},
    {label:"Final Grade", val:final.fg, eg:final.fg_eg, comp:null, color:"#7B1C1C"},
  ];
  return (<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".85rem",marginBottom:"1rem"}}>
      {cards.map(({label,val,eg,comp,color})=>(
        <div key={label} className="grade-card" style={{borderColor:color+"33",cursor:comp?"pointer":"default"}} onClick={()=>comp&&onDetail(label+" Breakdown",comp,color)}>
          <div style={{fontSize:".7rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".4px"}}>{label}</div>
          <div style={{fontSize:"2.8rem",fontWeight:900,color,lineHeight:1,margin:".25rem 0"}}>{n(val,2)}<span style={{fontSize:"1rem"}}>%</span></div>
          <div style={{fontSize:".82rem",fontWeight:600}}>EG: {n(eg,2)}</div>
          <Bdg v={getRemark(val)}/>
          {comp && <div style={{fontSize:".68rem",color,marginTop:".3rem",opacity:.7}}>Tap for details →</div>}
        </div>
      ))}
    </div>
    <div className="card"><div className="card-hd">📊 Grade Breakdown</div><div className="card-bd">
      {[["Midterm Lab",mtLab?.grade,"mt","lab"],["Midterm Lec",mtLec?.grade,"mt","lec"],["Final Lab",ftLab?.grade,"ft","lab"],["Final Lec",ftLec?.grade,"ft","lec"]]
        .filter(([,v])=>v!=null&&v>0)
        .map(([l,v])=>(
          <div key={l} style={{marginBottom:".5rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:".78rem",marginBottom:".18rem"}}><span style={{color:"var(--mu)"}}>{l}</span><span style={{fontWeight:700}}>{pct(v)}</span></div>
            <div style={{height:7,background:"#EEE",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",background:"var(--m)",borderRadius:4,width:Math.min(v||0,100)+"%"}}/></div>
          </div>
        ))}
      <div style={{marginTop:".9rem",background:"#F8F5F2",borderRadius:7,padding:".6rem .8rem",fontSize:".74rem",color:"var(--mu)"}}>
        <b>Formula:</b> FG = (MT × {Math.round((course.mt_weight||.5)*100)}%) + (FT × {Math.round((course.ft_weight||.5)*100)}%) &nbsp;|&nbsp; <b>Passing:</b> {course.passing_grade||75}%
      </div>
    </div></div>
  </>);
}

function StuComponent({comp, title, cols, vals, onDetail}) {
  if (!comp) return null;
  const types = {att:"Attendance",act:"Activities/Quizzes",asgn:"Assignments",cp:"Class Participation",exam:"Exam/Project"};
  const weights = {att:"10%",act:"40%",asgn:"10%",cp:"20%",exam:"40%"};

  return (<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".85rem"}}>
      <div><div style={{fontWeight:800,fontSize:"1.1rem",color:"var(--m)"}}>{pct(comp.grade)}</div><div style={{fontSize:".75rem",color:"var(--mu)"}}>{title}</div></div>
      <button className="btn-detail" onClick={onDetail}>View Breakdown</button>
    </div>
    {Object.entries(types).map(([type,label])=>{
      const c = comp[type];
      if (!c||c.max===0) return null;
      const typeCols = cols.filter(col=>col.type===type);
      return (
        <div key={type} className="card">
          <div className="card-hd">{label} <span style={{opacity:.7,fontWeight:400,fontSize:".72rem"}}>({weights[type]})</span>
            <span style={{marginLeft:"auto",fontWeight:700,fontSize:".88rem"}}>{n(c.pts,2)} pts</span>
          </div>
          <div className="card-bd">
            {type==="att" ? (
              <div style={{display:"flex",flexWrap:"wrap",gap:".3rem",marginBottom:".6rem"}}>
                {typeCols.map(col=>{
                  const v=vals[col.id]; const s=v===1||v==="P"?"P":v==="E"?"E":"A";
                  return <div key={col.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".1rem"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:s==="P"?"var(--gr)":s==="E"?"var(--g)":"var(--rd)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:".7rem"}}>{s}</div>
                    <div style={{fontSize:".58rem",color:"var(--mu)"}}>{col.label.slice(0,5)}</div>
                  </div>;
                })}
              </div>
            ) : (
              typeCols.map(col=>(
                <div key={col.id} className="row-item">
                  <span style={{color:"var(--mu)"}}>{col.label}</span>
                  <span style={{fontWeight:700}}>{n(vals[col.id]||0,0)} / {col.max_score}</span>
                </div>
              ))
            )}
            <div style={{display:"flex",gap:".5rem",marginTop:".6rem",fontSize:".75rem"}}>
              {type==="att"?<span style={{color:"var(--mu)"}}>{c.present}/{c.total} present → {pct(c.avg)}</span>:<span style={{color:"var(--mu)"}}>{n(c.sum,0)}/{c.max} → {pct(c.avg)}</span>}
            </div>
          </div>
        </div>
      );
    })}
  </>);
}

function StuFinalGrade({final, course}) {
  return (<>
    <div className="grade-card" style={{textAlign:"center",padding:"2rem",marginBottom:"1rem"}}>
      <div style={{fontSize:".72rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".5px"}}>Final Grade</div>
      <div style={{fontSize:"5rem",fontWeight:900,color:"var(--m)",lineHeight:1}}>{n(final.fg,3)}</div>
      <div style={{fontSize:".9rem",color:"var(--mu)"}}>%</div>
      <div style={{fontSize:"1.1rem",fontWeight:700,marginTop:".5rem"}}>Equivalent Grade: {n(final.fg_eg,2)}</div>
      <Bdg v={getRemark(final.fg)}/>
    </div>
    <div className="card"><div className="card-hd">📋 Computation</div><div className="card-bd">
      <table className="tbl"><thead><tr><th>Period</th><th className="r">Grade</th><th className="r">Weight</th><th className="r">Weighted</th></tr></thead>
      <tbody>
        <tr><td style={{color:"var(--mu)"}}>Midterm</td><td className="r">{pct(final.mt)}</td><td className="r">{Math.round((course.mt_weight||.5)*100)}%</td><td className="r">{n((final.mt||0)*(course.mt_weight||.5),3)}</td></tr>
        <tr><td style={{color:"var(--mu)"}}>Final Term</td><td className="r">{pct(final.ft)}</td><td className="r">{Math.round((course.ft_weight||.5)*100)}%</td><td className="r">{n((final.ft||0)*(course.ft_weight||.5),3)}</td></tr>
        <tr style={{fontWeight:700}}><td colSpan={3}>Final Grade</td><td className="r">{n(final.fg,3)}</td></tr>
      </tbody></table>
    </div></div>
  </>);
}

function Popup({title, rows, grade, color, onClose}) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <h3 style={{fontSize:"1rem",fontWeight:700,color}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"var(--mu)"}}>×</button>
        </div>
        {rows.map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:".45rem 0",borderBottom:"1px solid #F0EDE8",fontSize:".83rem"}}>
            <div><div style={{fontWeight:600}}>{r.label}</div><div style={{fontSize:".72rem",color:"var(--mu)"}}>{r.detail}</div></div>
            <div style={{fontWeight:800,color,textAlign:"right"}}>{n(r.pts,2)}<div style={{fontSize:".68rem",color:"var(--mu)",fontWeight:400}}>pts</div></div>
          </div>
        ))}
        <div style={{marginTop:"1rem",padding:".75rem",background:"#F8F5F2",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:".9rem"}}>Total Grade</span>
          <span style={{fontWeight:900,fontSize:"1.4rem",color}}>{n(grade,2)}%</span>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
const ADM_TABS = ["Overview","Grade Book","Add Subject"];

function AdminDash({session, onLogout, adminKey, showToast}) {
  const [tab,setTab] = useState(0);
  const [courses,setCourses] = useState([]);
  const [selId,setSelId] = useState(null);

  async function loadCourses() {
    const c = await api("/api/grades?action=courses",{headers:{"x-admin":adminKey.current}});
    setCourses(c||[]);
    if (!selId && c?.length) setSelId(c[0].id);
  }

  useEffect(()=>{ loadCourses(); },[]);

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div className="topbar">
        <div><div className="tt">Admin Panel · Grade Book</div><div className="ts">Clark Kneil Caoile · {session.email}</div></div>
        <button className="btn-sm" onClick={onLogout}>Logout</button>
      </div>
      <div className="tabs">{ADM_TABS.map((t,i)=><button key={i} className={"tab"+(tab===i?" on":"")} onClick={()=>setTab(i)}>{t}</button>)}</div>
      <div className="content">
        {tab===0 && <AdminOverview courses={courses} onSelect={id=>{setSelId(id);setTab(1);}} adminKey={adminKey}/>}
        {tab===1 && <AdminGradeBook courses={courses} selId={selId} setSelId={setSelId} adminKey={adminKey} showToast={showToast} reload={loadCourses}/>}
        {tab===2 && <AdminAddCourse adminKey={adminKey} showToast={showToast} onAdded={()=>{loadCourses();setTab(0);}}/>}
      </div>
    </div>
  );
}

function AdminOverview({courses, onSelect, adminKey}) {
  const [details,setDetails] = useState({});

  useEffect(()=>{
    courses.forEach(async c=>{
      try {
        const r = await api(`/api/grades?action=course_grades&course_id=${c.id}`,{headers:{"x-admin":adminKey.current}});
        setDetails(d=>({...d,[c.id]:r}));
      } catch{}
    });
  },[courses]);

  return (
    <div>
      <div style={{display:"flex",gap:".6rem",flexWrap:"wrap",marginBottom:"1.1rem"}}>
        {[["Total Subjects",courses.length,"var(--m)"],["Total Students",courses.reduce((s,c)=>s+(details[c.id]?.students?.length||0),0),"var(--m)"],
          ["Passed",Object.values(details).reduce((s,d)=>s+(d?.students||[]).filter(st=>getRemark(st.final?.fg)==="PASSED").length,0),"var(--gr)"],
          ["Failed",Object.values(details).reduce((s,d)=>s+(d?.students||[]).filter(st=>getRemark(st.final?.fg)==="FAILED").length,0),"var(--rd)"],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:"var(--card)",border:"1px solid var(--bd)",borderRadius:9,padding:".5rem .9rem",textAlign:"center",minWidth:90}}>
            <div style={{fontSize:"1.4rem",fontWeight:900,color:c}}>{v}</div>
            <div style={{fontSize:".65rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".4px"}}>{l}</div>
          </div>
        ))}
      </div>
      {courses.map(c=>{
        const d=details[c.id]; const total=d?.students?.length||0;
        const passed=(d?.students||[]).filter(s=>getRemark(s.final?.fg)==="PASSED").length;
        const avg=total>0?(d?.students||[]).reduce((s,st)=>s+(st.final?.fg||0),0)/total:0;
        return (
          <button key={c.id} className="subject-card" onClick={()=>onSelect(c.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><div style={{fontWeight:800,color:"var(--m)",fontSize:"1rem"}}>{c.code}</div>
                <div style={{fontWeight:600,fontSize:".87rem"}}>{c.title}</div>
                <div style={{fontSize:".73rem",color:"var(--mu)",marginTop:".2rem"}}>{c.section} · {c.sem} · {c.grading==="lab_only"?"Lab Only":c.grading==="lec_only"?"Lec Only":"Lec+Lab"}</div>
              </div>
              <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:"1.2rem",color:"var(--m)"}}>{avg.toFixed(2)}%</div><div style={{fontSize:".7rem",color:"var(--mu)"}}>class avg</div></div>
            </div>
            <div style={{display:"flex",gap:".75rem",marginTop:".6rem",fontSize:".73rem"}}>
              <span><b style={{color:"var(--gr)"}}>{passed}</b> passed</span>
              <span><b style={{color:"var(--rd)"}}>{total-passed}</b> failed</span>
              <span style={{marginLeft:"auto",color:"var(--m)",fontWeight:600}}>Open Grade Book →</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── ADMIN GRADE BOOK ──────────────────────────────────────────────────────────
function AdminGradeBook({courses, selId, setSelId, adminKey, showToast, reload}) {
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(false);
  const [editing,setEditing] = useState(null);
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState("");
  const [remarksStu,setRemarksStu] = useState(null); // {email, name, current}
  const [term,setTerm] = useState("mt");

  async function loadData(id) {
    if (!id) return;
    setLoading(true);
    try {
      const r = await api(`/api/grades?action=course_grades&course_id=${id}`,{headers:{"x-admin":adminKey.current}});
      setData(r);
    } catch(e) { showToast(e.message,"err"); }
    setLoading(false);
  }

  useEffect(()=>{ loadData(selId); },[selId]);

  async function saveScore(email, colId, value) {
    await api("/api/grades?action=save_score",{method:"POST",headers:{"x-admin":adminKey.current},body:JSON.stringify({secret:adminKey.current,student_email:email,col_id:colId,value})});
    showToast("✓ Saved");
    loadData(selId);
    setEditing(null);
  }

  async function addCol(type, component) {
    const labels = {att:"Date (e.g. 05/12/2026)",act:"Activity name (e.g. Lab 5)",asgn:"Assignment name (e.g. Ex 4)",exam:"Exam name (e.g. Final Exam)",cp:"Participation label"};
    const label = prompt(labels[type]||"Label:");
    if (!label) return;
    const maxDef = {att:1,act:50,asgn:10,exam:100,cp:20};
    const max = type==="att" ? 1 : Number(prompt(`Max score for "${label}":`)||maxDef[type]);
    await api("/api/grades?action=add_col",{method:"POST",headers:{"x-admin":adminKey.current},body:JSON.stringify({secret:adminKey.current,course_id:selId,term,component,type,label,max_score:max})});
    showToast("Column added!");
    loadData(selId);
  }

  async function saveRemarks() {
    await api("/api/grades?action=save_remarks",{method:"POST",headers:{"x-admin":adminKey.current},body:JSON.stringify({secret:adminKey.current,student_email:remarksStu.email,course_id:selId,remarks:remarksStu.current})});
    showToast("Remarks saved!");
    setRemarksStu(null);
    loadData(selId);
  }

  if (!data && !loading) return <p style={{color:"var(--mu)"}}>Select a subject.</p>;
  if (loading) return <Spinner/>;
  if (!data) return null;

  const {course, cols, students} = data;
  const termCols = cols.filter(c=>c.term===term);
  const labCols = termCols.filter(c=>c.component==="lab");
  const lecCols = termCols.filter(c=>c.component==="lec");
  const showLec = course.grading==="lec_only"||course.grading==="both";
  const showLab = course.grading==="lab_only"||course.grading==="both";

  const filtered = students.filter(s=>{
    const q=search.toLowerCase();
    const rem=getRemark(s.final?.fg);
    return (!q||(s.name||"").toLowerCase().includes(q)||(s.sid||"").includes(q))&&(!filter||rem===filter);
  });

  return (
    <div>
      {/* Toolbar */}
      <div style={{display:"flex",gap:".5rem",flexWrap:"wrap",alignItems:"center",marginBottom:"1rem"}}>
        <select className="inp" style={{maxWidth:200}} value={selId||""} onChange={e=>{setSelId(e.target.value);}}>
          {courses.map(c=><option key={c.id} value={c.id}>{c.code} {c.section}</option>)}
        </select>
        <select className="inp" style={{maxWidth:120}} value={term} onChange={e=>setTerm(e.target.value)}>
          <option value="mt">Midterm</option><option value="ft">Final Term</option>
        </select>
        <input className="inp" style={{maxWidth:180}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"/>
        <select className="inp" style={{maxWidth:130}} value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="">All</option><option value="PASSED">Passed</option><option value="FAILED">Failed</option>
        </select>
        <span style={{fontSize:".73rem",color:"var(--mu)",background:"#F2EEE9",border:"1px solid var(--bd)",borderRadius:6,padding:".28rem .6rem"}}>{filtered.length} students</span>
      </div>

      {/* Add column buttons */}
      <div style={{display:"flex",gap:".4rem",flexWrap:"wrap",marginBottom:".75rem"}}>
        {showLab && <>
          <button className="btn-add" onClick={()=>addCol("att","lab")}>+ Attendance</button>
          <button className="btn-add" onClick={()=>addCol("act","lab")}>+ Activity/Quiz</button>
          <button className="btn-add" onClick={()=>addCol("asgn","lab")}>+ Assignment</button>
          <button className="btn-add" onClick={()=>addCol("exam","lab")}>+ Exam Item</button>
        </>}
        {showLec && <>
          <button className="btn-add" onClick={()=>addCol("att","lec")}>+ Lec Attendance</button>
          <button className="btn-add" onClick={()=>addCol("asgn","lec")}>+ Lec Quiz/Asgn</button>
          <button className="btn-add" onClick={()=>addCol("cp","lec")}>+ Class Part.</button>
          <button className="btn-add" onClick={()=>addCol("exam","lec")}>+ Lec Exam</button>
        </>}
      </div>

      {/* Grade book table */}
      <div style={{overflowX:"auto",borderRadius:11,border:"1px solid var(--bd)",background:"#fff",marginBottom:"1rem"}}>
        <table style={{borderCollapse:"collapse",fontSize:".73rem",minWidth:700,width:"100%"}}>
          <thead>
            <tr>
              <th className="th-fix">#</th>
              <th className="th-fix" style={{minWidth:55}}>ID</th>
              <th className="th-fix" style={{minWidth:160,textAlign:"left"}}>Name</th>
              {showLab && labCols.map(col=>(
                <th key={col.id} style={{background:"#2d5a3d",color:"#fff",padding:".4rem .4rem",whiteSpace:"nowrap",textAlign:"center",fontSize:".65rem"}}>
                  <div>{col.label}</div>
                  {col.type!=="att"&&<div style={{opacity:.6}}>/{col.max_score}</div>}
                </th>
              ))}
              {showLab && <th style={{background:"var(--m)",color:"#fff",padding:".4rem",whiteSpace:"nowrap",minWidth:60}}>Lab%</th>}
              {showLec && lecCols.map(col=>(
                <th key={col.id} style={{background:"#1a3a5c",color:"#fff",padding:".4rem",whiteSpace:"nowrap",textAlign:"center",fontSize:".65rem"}}>
                  <div>{col.label}</div>
                  {col.type!=="att"&&<div style={{opacity:.6}}>/{col.max_score}</div>}
                </th>
              ))}
              {showLec && <th style={{background:"var(--m)",color:"#fff",padding:".4rem",whiteSpace:"nowrap",minWidth:60}}>Lec%</th>}
              <th style={{background:"#2a0a0a",color:"var(--g)",padding:".4rem",minWidth:70}}>Grade%</th>
              <th style={{background:"#2a0a0a",color:"var(--g)",padding:".4rem",minWidth:50}}>EG</th>
              <th style={{background:"#2a0a0a",color:"var(--g)",padding:".4rem"}}>Remarks</th>
              <th style={{background:"#2a0a0a",color:"var(--g)",padding:".4rem"}}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s,ri)=>{
              const labComp = calcComponent(labCols, s.vals||{});
              const lecComp = calcComponent(lecCols, s.vals||{});
              const termGrade = labComp.grade*(course.lab_weight||1) + lecComp.grade*(course.lec_weight||0);
              const fg = s.final?.fg;
              const isPassed = getRemark(fg)==="PASSED";
              return (
                <tr key={s.email} style={{background:ri%2===0?"#fff":"#FAF7F5"}}>
                  <td style={{padding:".3rem .4rem",textAlign:"center",color:"var(--mu)",fontWeight:600,position:"sticky",left:0,background:ri%2===0?"#fff":"#FAF7F5"}}>{ri+1}</td>
                  <td style={{padding:".3rem .4rem",fontSize:".68rem",color:"var(--mu)"}}>{s.sid}</td>
                  <td style={{padding:".3rem .4rem",fontWeight:600,position:"sticky",left:0,background:ri%2===0?"#fff":"#FAF7F5"}}>{s.name}</td>
                  {showLab && labCols.map(col=>{
                    const val = s.vals?.[col.id] ?? (col.type==="att"?0:0);
                    const eKey = s.email+"|"+col.id;
                    if (col.type==="att") {
                      const st = val===1||val==="P"?"P":val==="E"?"E":"A";
                      return <td key={col.id} style={{padding:".2rem",textAlign:"center"}}>
                        <button className={"att-t "+st} onClick={async()=>{
                          const next=st==="P"?"A":st==="A"?"E":1;
                          await saveScore(s.email,col.id,next==="E"?"E":next);
                        }}>{st}</button>
                      </td>;
                    }
                    return <td key={col.id} style={{padding:".2rem",textAlign:"center",cursor:"text"}} onClick={()=>setEditing(eKey)}>
                      {editing===eKey
                        ?<NumInput val={val} max={col.max_score} onSave={v=>saveScore(s.email,col.id,v)} onCancel={()=>setEditing(null)}/>
                        :<span style={{cursor:"text",fontWeight:600,color:"var(--m)"}}>{n(val,0)}</span>}
                    </td>;
                  })}
                  {showLab && <td style={{textAlign:"center",fontWeight:700,color:"#1a6b35",background:"#f0f8f3",padding:".3rem .4rem"}}>{n(labComp.grade,2)}</td>}
                  {showLec && lecCols.map(col=>{
                    const val=s.vals?.[col.id]??0; const eKey=s.email+"|"+col.id;
                    if(col.type==="att"){const st=val===1||val==="P"?"P":val==="E"?"E":"A";return<td key={col.id} style={{padding:".2rem",textAlign:"center"}}><button className={"att-t "+st} onClick={async()=>{const next=st==="P"?"A":st==="A"?"E":1;await saveScore(s.email,col.id,next==="E"?"E":next);}}>{st}</button></td>;}
                    return<td key={col.id} style={{padding:".2rem",textAlign:"center",cursor:"text"}} onClick={()=>setEditing(eKey)}>{editing===eKey?<NumInput val={val} max={col.max_score} onSave={v=>saveScore(s.email,col.id,v)} onCancel={()=>setEditing(null)}/>:<span style={{cursor:"text",fontWeight:600,color:"#1a3a5c"}}>{n(val,0)}</span>}</td>;
                  })}
                  {showLec && <td style={{textAlign:"center",fontWeight:700,color:"#1a3a5c",background:"#f0f4f8",padding:".3rem .4rem"}}>{n(lecComp.grade,2)}</td>}
                  <td style={{textAlign:"center",fontWeight:800,color:"var(--m)",fontSize:".85rem",background:"#FBF8F8",padding:".3rem .4rem"}}>{n(fg,3)}</td>
                  <td style={{textAlign:"center",fontWeight:700,color:"var(--m)",padding:".3rem .4rem"}}>{n(s.final?.fg_eg,2)}</td>
                  <td style={{textAlign:"center",padding:".3rem .4rem"}}><Bdg v={getRemark(fg)}/></td>
                  <td style={{padding:".3rem .4rem",textAlign:"center"}}>
                    <button style={{background:"none",border:"1px solid var(--bd)",borderRadius:5,padding:".18rem .5rem",fontSize:".68rem",cursor:"pointer",color:s.remarks?"var(--m)":"var(--mu)"}} onClick={()=>setRemarksStu({email:s.email,name:s.name,current:s.remarks||""})}>
                      {s.remarks?"✏️":"+ Note"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Remarks modal */}
      {remarksStu && (
        <div className="popup-overlay" onClick={()=>setRemarksStu(null)}>
          <div className="popup-box" onClick={e=>e.stopPropagation()}>
            <h3 style={{marginBottom:".75rem",fontSize:".95rem"}}>Notes for {remarksStu.name}</h3>
            <textarea className="inp" rows={4} style={{resize:"vertical"}} value={remarksStu.current} onChange={e=>setRemarksStu(r=>({...r,current:e.target.value}))} placeholder="Type a note (visible to student)…"/>
            <div style={{display:"flex",gap:".5rem",marginTop:".75rem"}}>
              <button className="btn-main" style={{flex:1}} onClick={saveRemarks}>Save Note</button>
              <button onClick={()=>setRemarksStu(null)} style={{flex:1,padding:".72rem",border:"1px solid var(--bd)",borderRadius:8,background:"none",cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NumInput({val, max, onSave, onCancel}) {
  const [v,setV] = useState(String(val??0));
  const ref = useRef();
  useEffect(()=>{ ref.current?.focus(); ref.current?.select(); },[]);
  const commit = () => onSave(Math.min(Math.max(parseFloat(v)||0,0),max||999));
  return <input ref={ref} style={{width:52,border:"2px solid var(--m)",borderRadius:4,padding:".15rem .25rem",textAlign:"center",fontWeight:700,color:"var(--m)",outline:"none"}} value={v} onChange={e=>setV(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")onCancel();}}/>;
}

function AdminAddCourse({adminKey, showToast, onAdded}) {
  const [f,setF] = useState({id:"",code:"",title:"",section:"",sem:"2nd Sem 2025-2026",grading:"lab_only",mt_weight:0.5,ft_weight:0.5,lab_weight:1,lec_weight:0,passing_grade:75});
  const [busy,setBusy] = useState(false);
  const set = (k,v) => setF(x=>({...x,[k]:v}));

  async function submit() {
    if (!f.code||!f.title||!f.section) return showToast("Fill required fields","err");
    const id = f.id || (f.code.replace(/\s+/g,"")+"_"+f.section.replace(/\s+/g,""));
    setBusy(true);
    try {
      await api("/api/grades?action=add_course",{method:"POST",headers:{"x-admin":adminKey.current},body:JSON.stringify({secret:adminKey.current,course:{...f,id}})});
      showToast("Subject added!");
      onAdded();
    } catch(e) { showToast(e.message,"err"); }
    setBusy(false);
  }

  return (
    <div style={{maxWidth:580}}>
      <div className="card"><div className="card-hd">➕ Add New Subject</div><div className="card-bd">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".7rem"}}>
          <div className="fw"><label className="fl">Course Code *</label><input className="inp" value={f.code} onChange={e=>set("code",e.target.value)} placeholder="e.g. ICT 09"/></div>
          <div className="fw"><label className="fl">Section *</label><input className="inp" value={f.section} onChange={e=>set("section",e.target.value)} placeholder="e.g. 1BSCE-A"/></div>
          <div className="fw" style={{gridColumn:"1/-1"}}><label className="fl">Course Title *</label><input className="inp" value={f.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Computer Programming"/></div>
          <div className="fw"><label className="fl">Semester</label>
            <select className="inp" value={f.sem} onChange={e=>set("sem",e.target.value)}>
              <option>1st Sem 2025-2026</option><option>2nd Sem 2025-2026</option>
              <option>1st Sem 2026-2027</option><option>2nd Sem 2026-2027</option>
            </select>
          </div>
          <div className="fw"><label className="fl">Grading Type</label>
            <select className="inp" value={f.grading} onChange={e=>{
              const g=e.target.value;
              set("grading",g);
              if(g==="lab_only"){set("lab_weight",1);set("lec_weight",0);}
              else if(g==="lec_only"){set("lab_weight",0);set("lec_weight",1);}
              else{set("lab_weight",0.4);set("lec_weight",0.6);}
            }}>
              <option value="lab_only">Laboratory Only</option>
              <option value="lec_only">Lecture Only</option>
              <option value="both">Lecture (60%) + Lab (40%)</option>
            </select>
          </div>
          <div className="fw"><label className="fl">Midterm Weight</label>
            <select className="inp" value={f.mt_weight} onChange={e=>{const v=parseFloat(e.target.value);set("mt_weight",v);set("ft_weight",Math.round((1-v)*10000)/10000);}}>
              <option value={0.5}>50%</option><option value={0.3333}>33.33%</option>
              <option value={0.4}>40%</option><option value={0.6}>60%</option>
            </select>
          </div>
          <div className="fw"><label className="fl">Final Term Weight</label>
            <input className="inp" value={Math.round(f.ft_weight*10000)/100+"%"} readOnly style={{background:"#F5F1EE"}}/>
          </div>
        </div>
        <button className="btn-main" onClick={submit} disabled={busy} style={{marginTop:".6rem"}}>{busy?"Adding…":"Add Subject"}</button>
      </div></div>
    </div>
  );
}

// ── SHARED ────────────────────────────────────────────────────────────────────
function Bdg({v}) {
  if(!v) return null;
  const p=(v||"").toUpperCase()==="PASSED";
  return <span className={"badge "+(p?"pass":"fail")}>{v}</span>;
}
function Spinner() {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"50vh"}}>
    <div style={{width:40,height:40,border:"4px solid #EEE",borderTopColor:"var(--m)",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}

function Styles() {
  return <style global jsx>{`
*{box-sizing:border-box;margin:0;padding:0}
:root{--m:#7B1C1C;--md:#4E0F0F;--ml:#A33030;--g:#C9A227;--bg:#F4F1ED;--card:#fff;--tx:#1A1A1A;--mu:#6E6E6E;--bd:#DDD8D0;--gr:#1A6B35;--grbg:#E6F4EC;--rd:#991B1B;--rdbg:#FEE8E8}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--tx);min-height:100vh;font-size:14px}
input,select,button,textarea{font-family:inherit;font-size:14px}button{cursor:pointer}
.topbar{background:var(--m);color:#fff;padding:.6rem 1.1rem;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:300;gap:.5rem}
.tt{font-size:.85rem;font-weight:700}.ts{font-size:.68rem;opacity:.72;margin-top:.1rem}
.btn-sm{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.22);color:#fff;padding:.3rem .7rem;border-radius:6px;font-size:.73rem;font-weight:600;white-space:nowrap}
.btn-sm:hover{background:rgba(255,255,255,.26)}
.banner{background:linear-gradient(130deg,var(--md),var(--ml));color:#fff;padding:1rem 1.1rem .8rem}
.banner h2{font-size:1.1rem;font-weight:700}.banner p{font-size:.75rem;opacity:.82;margin-top:.18rem}
.tabs{background:var(--md);padding:0 .9rem;display:flex;overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{padding:.52rem .85rem;color:rgba(255,255,255,.5);border:none;background:none;font-size:.74rem;font-weight:600;white-space:nowrap;border-bottom:3px solid transparent;transition:all .16s}
.tab.on{color:#fff;border-bottom-color:#F0C040}.tab:hover{color:rgba(255,255,255,.85)}
.content{padding:.95rem 1.1rem;max-width:1200px;margin:0 auto}
.login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1.5rem;background:var(--bg)}
.login-inner{width:100%;max-width:390px;text-align:center}
.logo{width:76px;height:76px;background:var(--m);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:900;color:#fff;margin:0 auto .9rem;letter-spacing:-2px}
.school-name{font-size:1.15rem;color:var(--m);font-weight:700}
.school-sub{font-size:.78rem;color:var(--mu);margin-top:.22rem;margin-bottom:1.5rem}
.login-box{background:var(--card);border-radius:16px;padding:1.65rem;border:1px solid var(--bd);box-shadow:0 6px 26px rgba(123,28,28,.08);text-align:left}
.login-box h2{font-size:.95rem;font-weight:700;color:var(--m);margin-bottom:1.2rem;text-align:center}
.fl{display:block;font-size:.68rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.3rem}
.fw{margin-bottom:.9rem}
.inp{width:100%;padding:.62rem .82rem;border:1.5px solid var(--bd);border-radius:8px;font-size:.86rem;color:var(--tx);background:#fff;outline:none;transition:border-color .18s;-webkit-appearance:none;appearance:none}
.inp:focus{border-color:var(--m)}
.btn-main{width:100%;padding:.7rem;background:var(--m);color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;transition:background .18s}
.btn-main:hover{background:var(--md)}.btn-main:disabled{opacity:.6}
.err-box{background:var(--rdbg);color:var(--rd);border-radius:6px;padding:.48rem .82rem;font-size:.78rem;margin-top:.65rem;text-align:center}
.hint{font-size:.7rem;color:var(--mu);margin-top:.8rem;line-height:1.6;text-align:center}
.disc-box{background:#FFF8E8;border:1px solid #E0C060;border-radius:7px;padding:.65rem .75rem;font-size:.7rem;color:#7A6000;line-height:1.6;margin-top:.5rem;text-align:left}
.card{background:var(--card);border-radius:11px;border:1px solid var(--bd);margin-bottom:.95rem;overflow:hidden}
.card-hd{background:var(--m);color:#fff;padding:.52rem 1rem;font-size:.75rem;font-weight:700;letter-spacing:.3px;display:flex;align-items:center;gap:.4rem}
.card-bd{padding:.95rem 1rem}
.badge{display:inline-block;padding:.22rem .8rem;border-radius:20px;font-size:.7rem;font-weight:700;margin-top:.3rem}
.pass{background:var(--grbg);color:var(--gr)}.fail{background:var(--rdbg);color:var(--rd)}
.tbl{width:100%;border-collapse:collapse;font-size:.8rem}
.tbl th{text-align:left;padding:.4rem .62rem;background:#F5F1EE;color:var(--mu);font-size:.67rem;text-transform:uppercase;letter-spacing:.4px;border-bottom:1px solid var(--bd)}
.tbl td{padding:.43rem .62rem;border-bottom:1px solid #F0EDE8}
.tbl tr:last-child td{border-bottom:none}
.tbl .r{text-align:right;font-weight:700;color:var(--m)}
.row-item{display:flex;justify-content:space-between;padding:.36rem 0;border-bottom:1px solid #F0EDE8;font-size:.8rem}
.row-item:last-child{border-bottom:none}
.grade-card{background:var(--card);border-radius:11px;border:1.5px solid #EDD;padding:.95rem 1rem}
.subject-card{width:100%;text-align:left;background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:.95rem 1.05rem;cursor:pointer;transition:all .16s;border-left:4px solid var(--m);margin-bottom:.65rem;display:block}
.subject-card:hover{box-shadow:0 3px 14px rgba(123,28,28,.1)}
.btn-add{background:transparent;border:1.5px dashed var(--bd);border-radius:7px;color:var(--mu);padding:.28rem .65rem;font-size:.72rem;font-weight:600;transition:all .18s}
.btn-add:hover{border-color:var(--m);color:var(--m)}
.btn-detail{background:transparent;border:1.5px solid var(--m);border-radius:7px;color:var(--m);padding:.3rem .7rem;font-size:.74rem;font-weight:600}
.att-t{width:26px;height:26px;border-radius:50%;border:2px solid currentColor;font-size:.66rem;font-weight:800;display:flex;align-items:center;justify-content:center}
.att-t.P{background:var(--gr);color:#fff;border-color:var(--gr)}
.att-t.A{background:transparent;color:var(--rd);border-color:var(--rd)}
.att-t.E{background:var(--g);color:#fff;border-color:var(--g)}
.th-fix{background:var(--m);color:#fff;padding:.4rem .45rem;white-space:nowrap;text-align:center;font-size:.67rem;position:sticky;top:0;z-index:10}
.remarks-banner{background:#FFF8E8;border-left:4px solid var(--g);padding:.55rem 1.1rem;font-size:.78rem;color:#7A6000}
.popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:500;padding:1rem}
.popup-box{background:#fff;border-radius:14px;padding:1.5rem;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.toast{position:fixed;bottom:1.2rem;right:1.2rem;background:var(--gr);color:#fff;padding:.58rem 1.1rem;border-radius:8px;font-size:.8rem;font-weight:600;z-index:999;animation:fadeup .3s ease}
.toast-err{background:var(--rd)!important}
@keyframes fadeup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:580px){.content{padding:.85rem}}
  `}</style>;
}
