import{useState,useEffect,useCallback,useRef}from"react";
import Head from"next/head";
import{getEG,getRemark}from"../lib/seed.js";

// ─── HELPERS ────────────────────────────────────────────────────────────────
function n(v,d=2){if(v==null||v==="")return"—";return typeof v==="number"?d===0?Math.round(v).toString():v.toFixed(d):String(v);}
function pct(v){return v==null?"—":Number(v).toFixed(2)+"%";}
function Bdg({v}){if(v==null)return null;const p=(v||"").toUpperCase()==="PASSED";return<span className={"badge "+(p?"pass":"fail")}>{v}</span>;}

async function api(path,opts={}){
  const r=await fetch(path,{...opts,headers:{"Content-Type":"application/json",...(opts.headers||{})}});
  const j=await r.json();
  if(!r.ok)throw new Error(j.error||"Request failed");
  return j;
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App(){
  const[page,setPage]=useState("login");// login|subject_picker|dashboard|admin|change_pass
  const[session,setSession]=useState(null);// {role,email,sid,name,courses,is_temp_pass}
  const[selectedCourse,setSelectedCourse]=useState(null);
  const[toast,setToast]=useState(null);
  const[adminSecret,setAdminSecret]=useState("");

  function showToast(msg,type="success"){setToast({msg,type});setTimeout(()=>setToast(null),3000);}

  function handleLogin(sess,secret=""){
    setSession(sess);
    if(sess.role==="admin"){setAdminSecret(secret);setPage("admin");}
    else if(sess.is_temp_pass){setPage("change_pass");}
    else if(sess.courses.length===1){setSelectedCourse(sess.courses[0]);setPage("dashboard");}
    else{setPage("subject_picker");}
  }

  function handleLogout(){setSession(null);setSelectedCourse(null);setPage("login");setAdminSecret("");}

  return(
    <>
      <Head><title>USM Grade Portal</title><meta name="viewport" content="width=device-width,initial-scale=1"/></Head>
      <Styles/>
      {toast&&<div className={"toast "+(toast.type==="error"?"toast-err":"toast-ok")}>{toast.msg}</div>}
      {page==="login"&&<LoginPage onLogin={handleLogin}/>}
      {page==="subject_picker"&&<SubjectPicker session={session} onPick={id=>{setSelectedCourse(id);setPage("dashboard");}} onLogout={handleLogout}/>}
      {page==="dashboard"&&<Dashboard session={session} courseId={selectedCourse} onBack={()=>setPage("subject_picker")} onLogout={handleLogout} onChangePass={()=>setPage("change_pass")}/>}
      {page==="change_pass"&&<ChangePassPage session={session} onDone={sess=>{setSession(s=>({...s,...sess}));if(session?.courses?.length===1){setSelectedCourse(session.courses[0]);setPage("dashboard");}else setPage("subject_picker");}} showToast={showToast}/>}
      {page==="admin"&&<AdminPage session={session} onLogout={handleLogout} adminSecret={adminSecret} showToast={showToast}/>}
    </>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginPage({onLogin}){
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);

  async function submit(){
    setErr("");
    if(!email.trim()||!pass)return setErr("Enter your USM email and password.");
    if(!email.includes("@usm.edu.ph"))return setErr("Please use your @usm.edu.ph email.");
    setLoading(true);
    try{
      const sess=await api("/api/auth?action=login",{method:"POST",body:JSON.stringify({email:email.trim().toLowerCase(),password:pass})});
      onLogin(sess,pass);
    }catch(e){setErr(e.message);}
    setLoading(false);
  }

  return(
    <div className="login-wrap">
      <div className="login-center">
        <div className="logo-ring">USM</div>
        <h1 className="login-school">University of Southern Mindanao</h1>
        <p className="login-sub">Grade Portal · Clark Kneil Caoile</p>
        <div className="login-box">
          <h2>Sign In</h2>
          <div className="fwrap"><label className="flbl">USM Email</label>
            <input className="inp" value={email} onChange={e=>setEmail(e.target.value)} placeholder="yourname@usm.edu.ph" type="email" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <div className="fwrap"><label className="flbl">Password</label>
            <input className="inp" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <button className="btn-main" onClick={submit} disabled={loading}>{loading?"Signing in…":"Sign In"}</button>
          {err&&<div className="err-box">{err}</div>}
          <p className="login-hint">First login? Use your <b>full email + student ID</b> as password.<br/>e.g. <code>yourname@usm.edu.ph25-XXXXX</code></p>
        </div>
      </div>
    </div>
  );
}

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────
function ChangePassPage({session,onDone,showToast}){
  const[old,setOld]=useState(session?.is_temp_pass?(session.email+(session.sid||"")):"");
  const[n1,setN1]=useState("");
  const[n2,setN2]=useState("");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);

  async function submit(){
    setErr("");
    if(!n1||!n2)return setErr("Fill in all fields.");
    if(n1!==n2)return setErr("Passwords do not match.");
    if(n1.length<6)return setErr("Password must be at least 6 characters.");
    setLoading(true);
    try{
      await api("/api/auth?action=change_password",{method:"POST",body:JSON.stringify({email:session.email,old_password:old,new_password:n1})});
      showToast("Password changed successfully!");
      onDone({is_temp_pass:false});
    }catch(e){setErr(e.message);}
    setLoading(false);
  }

  return(
    <div className="login-wrap">
      <div className="login-center">
        <div className="logo-ring">USM</div>
        <div className="login-box">
          <h2>{session?.is_temp_pass?"Set Your Password":"Change Password"}</h2>
          {session?.is_temp_pass&&<p style={{fontSize:".8rem",color:"var(--mu)",marginBottom:"1rem",lineHeight:1.5}}>Welcome! You're using a temporary password. Please set a new one to continue.</p>}
          <div className="fwrap"><label className="flbl">Current Password</label>
            <input className="inp" value={old} onChange={e=>setOld(e.target.value)} type="password" placeholder="Current password"/>
          </div>
          <div className="fwrap"><label className="flbl">New Password</label>
            <input className="inp" value={n1} onChange={e=>setN1(e.target.value)} type="password" placeholder="Min. 6 characters"/>
          </div>
          <div className="fwrap"><label className="flbl">Confirm New Password</label>
            <input className="inp" value={n2} onChange={e=>setN2(e.target.value)} type="password" placeholder="Repeat new password" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <button className="btn-main" onClick={submit} disabled={loading}>{loading?"Saving…":"Save Password"}</button>
          {err&&<div className="err-box">{err}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── SUBJECT PICKER ───────────────────────────────────────────────────────────
function SubjectPicker({session,onPick,onLogout}){
  const[courses,setCourses]=useState({});
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    api("/api/courses?action=list").then(setCourses).catch(console.error).finally(()=>setLoading(false));
  },[]);

  const myCourses=(session.courses||[]).map(id=>courses[id]).filter(Boolean);

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <div className="topbar">
        <div><div className="tb-title">USM Grade Portal</div><div className="tb-sub">University of Southern Mindanao</div></div>
        <button className="btn-sm" onClick={onLogout}>Logout</button>
      </div>
      <div style={{padding:"1.5rem",maxWidth:700,margin:"0 auto"}}>
        <div className="banner" style={{borderRadius:12,marginBottom:"1.25rem"}}>
          <h2 style={{fontSize:"1.1rem"}}>{session.name}</h2>
          <p>{session.email}</p>
        </div>
        <h3 style={{fontSize:".9rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"1rem"}}>Your Enrolled Subjects</h3>
        {loading?<p style={{color:"var(--mu)"}}>Loading…</p>:myCourses.length===0?<p style={{color:"var(--mu)"}}>No subjects found.</p>:(
          <div style={{display:"grid",gap:".75rem"}}>
            {myCourses.map(c=>(
              <button key={c.id} className="subject-card" onClick={()=>onPick(c.id)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:"1rem",color:"var(--m)"}}>{c.code}</div>
                    <div style={{fontSize:".88rem",fontWeight:600,marginTop:".15rem"}}>{c.title}</div>
                    <div style={{fontSize:".75rem",color:"var(--mu)",marginTop:".3rem"}}>{c.section} · {c.sem}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:".72rem",color:"var(--mu)",background:"#F5F1EE",borderRadius:6,padding:".2rem .55rem",border:"1px solid var(--bd)"}}>{c.grading==="lab_only"?"Lab Only":c.grading==="lec_only"?"Lecture Only":"Lec + Lab"}</div>
                  </div>
                </div>
                <div style={{marginTop:".6rem",fontSize:".75rem",color:"var(--mu)"}}>MT {Math.round((c.mt_weight||.5)*100)}% · FT {Math.round((c.ft_weight||.5)*100)}% → tap to view grades →</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────
function Dashboard({session,courseId,onBack,onLogout,onChangePass}){
  const[data,setData]=useState(null);
  const[tab,setTab]=useState(0);
  const[loading,setLoading]=useState(true);
  const multiCourse=session.courses.length>1;

  useEffect(()=>{
    if(!courseId)return;
    setLoading(true);
    api(`/api/courses?action=student_grade&course_id=${courseId}&email=${encodeURIComponent(session.email)}`)
      .then(setData).catch(console.error).finally(()=>setLoading(false));
    const t=setInterval(()=>{
      api(`/api/courses?action=student_grade&course_id=${courseId}&email=${encodeURIComponent(session.email)}`).then(setData).catch(()=>{});
    },30000);
    return()=>clearInterval(t);
  },[courseId,session.email]);

  if(loading)return<Spinner/>;
  if(!data)return<div style={{padding:"2rem",textAlign:"center",color:"var(--mu)"}}>Failed to load grades.</div>;

  const{course,student}=data;
  const g=student.grades||{};
  const TABS=getCourseTabs(course.grading);

  return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div className="topbar">
        <div>
          <div className="tb-title">{course.code} · {course.section}</div>
          <div className="tb-sub">{course.title} · {course.sem}</div>
        </div>
        <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
          <button className="btn-sm" onClick={onChangePass}>🔑 Password</button>
          {multiCourse&&<button className="btn-sm" onClick={onBack}>◀ Subjects</button>}
          <button className="btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>
      <div className="banner">
        <h2>{student.name}</h2>
        <p>ID: {student.sid} · {session.email}</p>
        <div className="chips">
          <span className="chip">{course.code} {course.grading==="lab_only"?"(Lab Only)":course.grading==="lec_only"?"(Lecture Only)":"(Lec + Lab)"}</span>
          <span className="chip">MT {Math.round((course.mt_weight||.5)*100)}% + FT {Math.round((course.ft_weight||.5)*100)}%</span>
          <span className="chip">Instructor: Clark Kneil Caoile</span>
        </div>
      </div>
      <div className="tabs">
        {TABS.map((t,i)=><button key={i} className={"tab"+(tab===i?" on":"")} onClick={()=>setTab(i)}>{t}</button>)}
      </div>
      <div className="content">
        {TABS[tab]==="Overview"&&<StuOverview g={g} course={course}/>}
        {TABS[tab]==="Midterm Grade"&&<StuGradeDetail g={g} term="mt" course={course}/>}
        {TABS[tab]==="Final Grade"&&<StuGradeDetail g={g} term="ft" course={course}/>}
        {TABS[tab]==="Final Summary"&&<StuFinalSummary g={g} course={course}/>}
      </div>
    </div>
  );
}

function getCourseTabs(){return["Overview","Midterm Grade","Final Grade","Final Summary"];}

function StuOverview({g,course}){
  const mt=g.mt_pct; const ft=g.ft_pct;
  const fg=g.fg;
  return(<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".85rem",marginBottom:"1rem"}}>
      <div className="grade-hl">
        <div className="gunit">Midterm</div>
        <div className="gnum">{n(mt,2)}</div><div className="gunit">%</div>
        <div className="geq">EG: {n(getEG(mt),2)}</div>
        <Bdg v={getRemark(mt)}/>
      </div>
      <div className="grade-hl">
        <div className="gunit">Final Grade</div>
        <div className="gnum">{n(fg,3)}</div><div className="gunit">%</div>
        <div className="geq">EG: {n(getEG(fg),2)}</div>
        <Bdg v={getRemark(fg)}/>
      </div>
    </div>
    <div className="card"><div className="card-hd">📊 Grade Summary</div><div className="card-bd">
      <table className="tbl"><thead><tr><th>Period</th><th className="r">Score</th><th className="r">Weight</th><th className="r">Weighted</th></tr></thead>
      <tbody>
        <tr><td className="mu">Midterm</td><td className="r">{pct(mt)}</td><td className="r">{Math.round((course.mt_weight||.5)*100)}%</td><td className="r">{n((mt||0)*(course.mt_weight||.5),3)}</td></tr>
        <tr><td className="mu">Final Term</td><td className="r">{pct(ft)}</td><td className="r">{Math.round((course.ft_weight||.5)*100)}%</td><td className="r">{n((ft||0)*(course.ft_weight||.5),3)}</td></tr>
        <tr style={{fontWeight:700}}><td colSpan={3}>Final Grade</td><td className="r">{n(fg,3)}</td></tr>
      </tbody></table>
      <div className="info-box"><b>Passing:</b> 75% &nbsp;|&nbsp; <b>Type:</b> {course.grading==="lab_only"?"Laboratory Only":course.grading==="lec_only"?"Lecture Only":"Lecture + Laboratory"}</div>
    </div></div>
    <div className="card"><div className="card-hd">📈 Progress</div><div className="card-bd">
      {[["Midterm",mt],["Final Term",ft],["Overall",fg]].map(([l,v])=>(
        <div key={l} style={{marginBottom:".5rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:".78rem",marginBottom:".2rem"}}><span>{l}</span><span style={{fontWeight:700}}>{pct(v)}</span></div>
          <div className="prog-bar"><div className="prog-fill" style={{width:Math.min(v||0,100)+"%"}}/></div>
        </div>
      ))}
    </div></div>
  </>);
}

function StuGradeDetail({g,term,course}){
  const isPassed=getRemark(term==="mt"?g.mt_pct:g.ft_pct)==="PASSED";
  const pctVal=term==="mt"?g.mt_pct:g.ft_pct;
  const label=term==="mt"?"Midterm":"Final Term";
  const lec_pct=g[term+"_lec_pct"];
  const lab_pct=g[term+"_lab_pct"];
  const lec_w=course.grading==="lab_only"?0:course.grading==="lec_only"?1:0.6;
  const lab_w=1-lec_w;

  return(<>
    <div className="grade-hl" style={{marginBottom:"1rem"}}>
      <div className="gunit">{label} Grade</div>
      <div className="gnum" style={{fontSize:"3.8rem"}}>{pct(pctVal)}</div>
      <div className="geq">Equivalent Grade: {n(getEG(pctVal),2)}</div>
      <Bdg v={getRemark(pctVal)}/>
    </div>
    <div className="card"><div className="card-hd">📋 {label} Composition</div><div className="card-bd">
      <table className="tbl"><thead><tr><th>Component</th><th className="r">Score</th><th className="r">Weight</th><th className="r">Weighted</th></tr></thead>
      <tbody>
        {course.grading!=="lab_only"&&<tr><td className="mu">Lecture</td><td className="r">{pct(lec_pct)}</td><td className="r">{Math.round(lec_w*100)}%</td><td className="r">{n((lec_pct||0)*lec_w,3)}</td></tr>}
        {course.grading!=="lec_only"&&<tr><td className="mu">Laboratory</td><td className="r">{pct(lab_pct)}</td><td className="r">{Math.round(lab_w*100)}%</td><td className="r">{n((lab_pct||0)*lab_w,3)}</td></tr>}
        <tr style={{fontWeight:700}}><td colSpan={3}>{label} Grade</td><td className="r">{n(pctVal,3)}</td></tr>
      </tbody></table>
      <div style={{marginTop:".65rem"}}>
        <div style={{fontSize:".72rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".4px",marginBottom:".4rem"}}>Breakdown</div>
        {[["Attendance (10%)",g[term+"_att_pts"]],["Activities/Quizzes (40%)",g[term+"_act_pts"]],["Assignments (10%)",g[term+"_asgn_pts"]],["Exam/Project (40%)",g[term+"_exam_pts"]]].filter(([,v])=>v!=null).map(([l,v])=>(
          <div key={l} className="row-item"><span className="rl">{l}</span><span className="rv">{n(v,2)}</span></div>
        ))}
      </div>
    </div></div>
  </>);
}

function StuFinalSummary({g,course}){
  const fg=g.fg; const eg=getEG(fg);
  return(<>
    <div className="grade-hl">
      <div className="gunit">Final Grade</div>
      <div className="gnum" style={{fontSize:"4.5rem"}}>{n(fg,3)}</div>
      <div className="gunit">%</div>
      <div className="geq" style={{fontSize:"1.4rem"}}>Equivalent Grade: {n(eg,2)}</div>
      <Bdg v={getRemark(fg)}/>
    </div>
    <div className="card"><div className="card-hd">📋 Final Grade Computation</div><div className="card-bd">
      <table className="tbl"><thead><tr><th>Period</th><th className="r">Score</th><th className="r">Weight</th><th className="r">Weighted</th></tr></thead>
      <tbody>
        <tr><td className="mu">Midterm</td><td className="r">{pct(g.mt_pct)}</td><td className="r">{Math.round((course.mt_weight||.5)*100)}%</td><td className="r">{n((g.mt_pct||0)*(course.mt_weight||.5),3)}</td></tr>
        <tr><td className="mu">Final Term</td><td className="r">{pct(g.ft_pct)}</td><td className="r">{Math.round((course.ft_weight||.5)*100)}%</td><td className="r">{n((g.ft_pct||0)*(course.ft_weight||.5),3)}</td></tr>
        <tr style={{fontWeight:700,fontSize:".95rem"}}><td colSpan={3}>Final Grade</td><td className="r">{n(fg,3)}</td></tr>
      </tbody></table>
      <div className="info-box"><b>Formula:</b> FG = (Midterm × {Math.round((course.mt_weight||.5)*100)}%) + (Final × {Math.round((course.ft_weight||.5)*100)}%) &nbsp;|&nbsp; <b>Passing:</b> 75%</div>
    </div></div>
  </>);
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
const ADMIN_TABS=["Overview","Grade Book","Add Subject"];
function AdminPage({session,onLogout,adminSecret,showToast}){
  const[tab,setTab]=useState(0);
  const[courses,setCourses]=useState({});
  const[loading,setLoading]=useState(true);
  const[selCourse,setSelCourse]=useState(null);

  async function loadCourses(){
    try{
      const r=await api("/api/courses?action=admin_course",{headers:{"x-admin-secret":adminSecret}});
      setCourses(r);
      if(!selCourse&&Object.keys(r).length>0) setSelCourse(Object.keys(r)[0]);
    }catch(e){console.error(e);}
    setLoading(false);
  }

  useEffect(()=>{loadCourses();},[]);

  return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div className="topbar">
        <div><div className="tb-title">Admin Panel · Grade Portal</div><div className="tb-sub">Clark Kneil Caoile · {session.email}</div></div>
        <button className="btn-sm" onClick={onLogout}>Logout</button>
      </div>
      <div className="tabs">
        {ADMIN_TABS.map((t,i)=><button key={i} className={"tab"+(tab===i?" on":"")} onClick={()=>setTab(i)}>{t}</button>)}
      </div>
      <div className="content">
        {tab===0&&<AdminOverview courses={courses} loading={loading} onSelect={id=>{setSelCourse(id);setTab(1);}}/>}
        {tab===1&&<AdminGradeBook courses={courses} selCourse={selCourse} setSelCourse={setSelCourse} adminSecret={adminSecret} showToast={showToast} reload={loadCourses}/>}
        {tab===2&&<AddSubject adminSecret={adminSecret} showToast={showToast} onAdded={()=>{loadCourses();setTab(0);}}/>}
      </div>
    </div>
  );
}

function AdminOverview({courses,loading,onSelect}){
  const list=Object.values(courses);
  const allStudents=list.reduce((s,c)=>s+(c.students||[]).length,0);
  const allPassed=list.reduce((s,c)=>s+(c.students||[]).filter(st=>getRemark(st.grades?.fg)==="PASSED").length,0);

  return(<>
    <div className="adm-stat-row">
      <div className="sp"><div className="sp-n">{list.length}</div><div className="sp-l">Subjects</div></div>
      <div className="sp"><div className="sp-n">{allStudents}</div><div className="sp-l">Students</div></div>
      <div className="sp"><div className="sp-n" style={{color:"var(--gr)"}}>{allPassed}</div><div className="sp-l">Passed</div></div>
      <div className="sp"><div className="sp-n" style={{color:"var(--rd)"}}>{allStudents-allPassed}</div><div className="sp-l">Failed</div></div>
    </div>
    <div style={{display:"grid",gap:".75rem",marginTop:"1rem"}}>
      {loading?<p style={{color:"var(--mu)"}}>Loading…</p>:list.map(c=>{
        const total=(c.students||[]).length;
        const passed=(c.students||[]).filter(s=>getRemark(s.grades?.fg)==="PASSED").length;
        const avg=total>0?(c.students||[]).reduce((s,st)=>s+(st.grades?.fg||0),0)/total:0;
        return(
          <div key={c.id} className="subject-card" onClick={()=>onSelect(c.id)} style={{cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:800,fontSize:"1rem",color:"var(--m)"}}>{c.code}</div>
                <div style={{fontSize:".87rem",fontWeight:600}}>{c.title}</div>
                <div style={{fontSize:".74rem",color:"var(--mu)",marginTop:".2rem"}}>{c.section} · {c.sem} · {c.grading==="lab_only"?"Lab Only":c.grading==="lec_only"?"Lec Only":"Lec + Lab"}</div>
              </div>
              <div style={{textAlign:"right",minWidth:100}}>
                <div style={{fontWeight:800,fontSize:"1.2rem",color:"var(--m)"}}>{avg.toFixed(2)}%</div>
                <div style={{fontSize:".72rem",color:"var(--mu)"}}>avg grade</div>
              </div>
            </div>
            <div style={{display:"flex",gap:".75rem",marginTop:".65rem",fontSize:".74rem"}}>
              <span><b style={{color:"var(--gr)"}}>{passed}</b> passed</span>
              <span><b style={{color:"var(--rd)"}}>{total-passed}</b> failed</span>
              <span><b>{total}</b> total</span>
              <span style={{marginLeft:"auto",color:"var(--m)",fontWeight:600}}>View Grade Book →</span>
            </div>
          </div>
        );
      })}
    </div>
  </>);
}

function AdminGradeBook({courses,selCourse,setSelCourse,adminSecret,showToast,reload}){
  const[editing,setEditing]=useState(null);
  const[search,setSearch]=useState("");
  const[filter,setFilter]=useState("");
  const course=courses[selCourse];

  async function saveGrade(sid,field,value){
    try{
      await api(`/api/courses?action=update_grade`,{
        method:"POST",
        headers:{"x-admin-secret":adminSecret},
        body:JSON.stringify({course_id:selCourse,sid,field,value,adminSecret})
      });
      showToast("✓ Saved");
      reload();
    }catch(e){showToast(e.message,"error");}
    setEditing(null);
  }

  if(!course)return<p style={{color:"var(--mu)"}}>Select a subject above or from Overview.</p>;

  const students=(course.students||[]).filter(s=>{
    const q=search.toLowerCase();
    const rem=getRemark(s.grades?.fg);
    return(!q||(s.name||"").toLowerCase().includes(q)||(s.sid||"").includes(q))&&(!filter||rem===filter);
  });

  const GRADE_FIELDS=course.grading==="lab_only"
    ?[["mt_pct","MT Grade %"],["ft_pct","FT Grade %"],["fg","Final Grade"]]
    :course.grading==="lec_only"
    ?[["mt_pct","MT Grade %"],["ft_pct","FT Grade %"],["fg","Final Grade"]]
    :[["mt_lec_pct","MT Lec %"],["mt_lab_pct","MT Lab %"],["mt_pct","MT Grade %"],["ft_lec_pct","FT Lec %"],["ft_lab_pct","FT Lab %"],["ft_pct","FT Grade %"],["fg","Final Grade"]];

  return(<>
    <div style={{display:"flex",gap:".65rem",flexWrap:"wrap",alignItems:"center",marginBottom:"1rem"}}>
      <select className="inp" style={{maxWidth:260}} value={selCourse} onChange={e=>setSelCourse(e.target.value)}>
        {Object.values(courses).map(c=><option key={c.id} value={c.id}>{c.code} {c.section}</option>)}
      </select>
      <input className="inp" style={{maxWidth:200}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or ID…"/>
      <select className="inp" style={{maxWidth:140}} value={filter} onChange={e=>setFilter(e.target.value)}>
        <option value="">All</option><option value="PASSED">Passed</option><option value="FAILED">Failed</option>
      </select>
      <span style={{fontSize:".75rem",color:"var(--mu)",background:"#F2EEE9",border:"1px solid var(--bd)",borderRadius:6,padding:".28rem .6rem"}}>{students.length} students</span>
    </div>
    <div style={{overflow:"auto",borderRadius:11,border:"1px solid var(--bd)",background:"#fff",marginBottom:"1rem"}}>
      <table style={{borderCollapse:"collapse",fontSize:".76rem",minWidth:700,width:"100%"}}>
        <thead><tr>
          <th style={{background:"var(--m)",color:"#fff",padding:".45rem .55rem",textAlign:"left",whiteSpace:"nowrap",position:"sticky",left:0,zIndex:10}}>#</th>
          <th style={{background:"var(--m)",color:"#fff",padding:".45rem .55rem",textAlign:"left",whiteSpace:"nowrap",minWidth:60}}>ID</th>
          <th style={{background:"var(--m)",color:"#fff",padding:".45rem .55rem",textAlign:"left",whiteSpace:"nowrap",minWidth:160}}>Name</th>
          {GRADE_FIELDS.map(([f,l])=><th key={f} style={{background:"var(--md)",color:"#fff",padding:".45rem .55rem",whiteSpace:"nowrap",textAlign:"center"}}>{l}</th>)}
          <th style={{background:"var(--md)",color:"#fff",padding:".45rem .55rem",whiteSpace:"nowrap",textAlign:"center"}}>EG</th>
          <th style={{background:"var(--md)",color:"#fff",padding:".45rem .55rem",textAlign:"center"}}>Remarks</th>
        </tr></thead>
        <tbody>
          {students.map((s,i)=>{
            const g=s.grades||{};
            const fg=g.fg; const eg=getEG(fg); const rem=getRemark(fg);
            return(<tr key={s.sid} style={{background:i%2===0?"#fff":"#FAF7F5"}}>
              <td style={{padding:".35rem .5rem",fontWeight:600,color:"var(--mu)",position:"sticky",left:0,background:i%2===0?"#fff":"#FAF7F5"}}>{i+1}</td>
              <td style={{padding:".35rem .5rem",fontSize:".72rem",color:"var(--mu)"}}>{s.sid}</td>
              <td style={{padding:".35rem .5rem",fontWeight:600}}>{s.name}</td>
              {GRADE_FIELDS.map(([f])=>{
                const eKey=s.sid+"|"+f;
                const isEd=editing===eKey;
                return(<td key={f} style={{padding:".3rem .45rem",textAlign:"center",color:"var(--m)",fontWeight:700,cursor:"text"}} onClick={()=>!isEd&&setEditing(eKey)}>
                  {isEd
                    ?<GradeCell value={g[f]} onSave={v=>saveGrade(s.sid,f,parseFloat(v)||0)} onCancel={()=>setEditing(null)}/>
                    :<span style={{cursor:"text"}} title="Click to edit">{n(g[f],f==="fg"?3:2)}{f!=="eg"&&f.includes("pct")||f==="fg"?"%":""}</span>
                  }
                </td>);
              })}
              <td style={{padding:".3rem .45rem",textAlign:"center",fontWeight:700,color:"var(--m)"}}>{n(eg,2)}</td>
              <td style={{padding:".3rem .45rem",textAlign:"center"}}><Bdg v={rem}/></td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>
  </>);
}

function GradeCell({value,onSave,onCancel}){
  const[v,setV]=useState(String(value??0));
  const ref=useRef();
  useEffect(()=>{ref.current?.focus();ref.current?.select();},[]);
  return<input ref={ref} style={{width:70,border:"2px solid var(--m)",borderRadius:4,padding:".15rem .3rem",textAlign:"center",fontWeight:700,color:"var(--m)",outline:"none"}}
    value={v} onChange={e=>setV(e.target.value)} onBlur={()=>onSave(v)}
    onKeyDown={e=>{if(e.key==="Enter")onSave(v);if(e.key==="Escape")onCancel();}}/>;
}

// ─── ADD SUBJECT ──────────────────────────────────────────────────────────────
function AddSubject({adminSecret,showToast,onAdded}){
  const[form,setForm]=useState({id:"",code:"",title:"",section:"",sem:"2nd Sem 2025-2026",grading:"lab_only",mt_weight:0.5,ft_weight:0.5});
  const[students,setStudents]=useState("");// CSV: sid,name,email per line
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");

  function set(k,v){setForm(f=>({...f,[k]:v}));}

  async function submit(){
    setErr("");
    if(!form.code||!form.title||!form.section)return setErr("Fill in all required fields.");
    const id=form.id||form.code.replace(/\s+/g,"_")+"_"+form.section.replace(/\s+/g,"");
    
    const studentList=students.trim().split("\n").filter(Boolean).map(line=>{
      const parts=line.split(",").map(s=>s.trim());
      return{sid:parts[0],name:parts[1],email:parts[2],grades:{}};
    }).filter(s=>s.sid&&s.name);

    setLoading(true);
    try{
      await api("/api/courses?action=add_course",{
        method:"POST",
        headers:{"x-admin-secret":adminSecret},
        body:JSON.stringify({adminSecret,course:{...form,id,students:studentList}})
      });
      showToast("Subject added successfully!");
      setForm({id:"",code:"",title:"",section:"",sem:"2nd Sem 2025-2026",grading:"lab_only",mt_weight:0.5,ft_weight:0.5});
      setStudents("");
      onAdded();
    }catch(e){setErr(e.message);}
    setLoading(false);
  }

  return(
    <div style={{maxWidth:640}}>
      <div className="card"><div className="card-hd">➕ Add New Subject</div><div className="card-bd">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".75rem"}}>
          <div className="fwrap"><label className="flbl">Course Code *</label><input className="inp" value={form.code} onChange={e=>set("code",e.target.value)} placeholder="e.g. ICT 09"/></div>
          <div className="fwrap"><label className="flbl">Section *</label><input className="inp" value={form.section} onChange={e=>set("section",e.target.value)} placeholder="e.g. 1BSCE-A"/></div>
          <div className="fwrap" style={{gridColumn:"1/-1"}}><label className="flbl">Course Title *</label><input className="inp" value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Computer Programming"/></div>
          <div className="fwrap"><label className="flbl">Semester</label>
            <select className="inp" value={form.sem} onChange={e=>set("sem",e.target.value)}>
              <option>1st Sem 2025-2026</option><option>2nd Sem 2025-2026</option>
              <option>1st Sem 2026-2027</option><option>2nd Sem 2026-2027</option>
            </select>
          </div>
          <div className="fwrap"><label className="flbl">Grading Type</label>
            <select className="inp" value={form.grading} onChange={e=>set("grading",e.target.value)}>
              <option value="lab_only">Laboratory Only</option>
              <option value="lec_only">Lecture Only</option>
              <option value="both">Lecture + Laboratory</option>
            </select>
          </div>
          <div className="fwrap"><label className="flbl">Midterm Weight</label>
            <select className="inp" value={form.mt_weight} onChange={e=>{const v=parseFloat(e.target.value);set("mt_weight",v);set("ft_weight",Math.round((1-v)*10000)/10000);}}>
              <option value={0.5}>50% (default)</option>
              <option value={0.3333}>33.33%</option>
              <option value={0.4}>40%</option>
              <option value={0.6}>60%</option>
            </select>
          </div>
          <div className="fwrap"><label className="flbl">Final Weight</label>
            <input className="inp" value={Math.round(form.ft_weight*10000)/100+"%"} readOnly style={{background:"#F5F1EE"}}/>
          </div>
        </div>
        <div className="fwrap" style={{marginTop:".5rem"}}>
          <label className="flbl">Students (one per line: StudentID, Full Name, email@usm.edu.ph)</label>
          <textarea className="inp" rows={8} style={{resize:"vertical"}} value={students} onChange={e=>setStudents(e.target.value)} placeholder={"25-00001, DELA CRUZ, Juan, s.jcdelacruz@usm.edu.ph\n25-00002, SANTOS, Maria, s.mrsantos@usm.edu.ph"}/>
          <div style={{fontSize:".72rem",color:"var(--mu)",marginTop:".3rem"}}>Students will be created with email+ID as temporary password. Leave blank to add later.</div>
        </div>
        {err&&<div className="err-box">{err}</div>}
        <button className="btn-main" onClick={submit} disabled={loading} style={{marginTop:".5rem"}}>{loading?"Adding…":"Add Subject"}</button>
      </div></div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Spinner(){return<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}><div style={{width:44,height:44,border:"4px solid #EEE",borderTopColor:"#7B1C1C",borderRadius:"50%",animation:"spin 1s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;}

// ─── STYLES ───────────────────────────────────────────────────────────────────
function Styles(){return<style global jsx>{`
*{box-sizing:border-box;margin:0;padding:0}
:root{--m:#7B1C1C;--md:#4E0F0F;--ml:#A33030;--g:#C9A227;--bg:#F4F1ED;--card:#fff;--tx:#1A1A1A;--mu:#6E6E6E;--bd:#DDD8D0;--gr:#1A6B35;--grbg:#E6F4EC;--rd:#991B1B;--rdbg:#FEE8E8}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--tx);min-height:100vh;font-size:14px}
input,select,button,textarea{font-family:inherit;font-size:14px}button{cursor:pointer}
.topbar{background:var(--m);color:#fff;padding:.6rem 1.2rem;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:300;gap:.5rem}
.tb-title{font-size:.88rem;font-weight:700}.tb-sub{font-size:.7rem;opacity:.75;margin-top:.1rem}
.btn-sm{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:#fff;padding:.3rem .75rem;border-radius:6px;font-size:.74rem;font-weight:600;white-space:nowrap}
.btn-sm:hover{background:rgba(255,255,255,.28)}
.banner{background:linear-gradient(130deg,var(--md),var(--ml));color:#fff;padding:1.1rem 1.2rem .8rem}
.banner h2{font-size:1.1rem;font-weight:700}.banner p{font-size:.78rem;opacity:.82;margin-top:.2rem}
.chips{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:.6rem}.chip{font-size:.7rem;opacity:.75}
.tabs{background:var(--md);padding:0 1rem;display:flex;overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{padding:.55rem .9rem;color:rgba(255,255,255,.5);border:none;background:none;font-size:.76rem;font-weight:600;white-space:nowrap;border-bottom:3px solid transparent;transition:all .18s}
.tab.on{color:#fff;border-bottom-color:#F0C040}.tab:hover{color:rgba(255,255,255,.85)}
.content{padding:1rem 1.2rem;max-width:1200px;margin:0 auto}
.login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1.5rem;background:var(--bg)}
.login-center{width:100%;max-width:400px;text-align:center}
.logo-ring{width:80px;height:80px;background:var(--m);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.7rem;font-weight:900;color:#fff;margin:0 auto 1rem;letter-spacing:-2px}
.login-school{font-size:1.2rem;color:var(--m);font-weight:700}
.login-sub{font-size:.8rem;color:var(--mu);margin-top:.25rem;margin-bottom:1.75rem}
.login-box{background:var(--card);border-radius:16px;padding:1.75rem;border:1px solid var(--bd);box-shadow:0 6px 28px rgba(123,28,28,.09);text-align:left}
.login-box h2{font-size:1rem;font-weight:700;color:var(--m);margin-bottom:1.25rem;text-align:center}
.flbl{display:block;font-size:.7rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.32rem}
.fwrap{margin-bottom:.95rem}
.inp{width:100%;padding:.65rem .85rem;border:1.5px solid var(--bd);border-radius:8px;font-size:.88rem;color:var(--tx);background:#fff;outline:none;transition:border-color .2s;-webkit-appearance:none;appearance:none}
.inp:focus{border-color:var(--m)}
.btn-main{width:100%;padding:.72rem;background:var(--m);color:#fff;border:none;border-radius:8px;font-size:.9rem;font-weight:700;transition:background .2s}
.btn-main:hover{background:var(--md)}.btn-main:disabled{opacity:.6}
.err-box{background:var(--rdbg);color:var(--rd);border-radius:6px;padding:.5rem .85rem;font-size:.8rem;margin-top:.7rem;text-align:center}
.login-hint{font-size:.71rem;color:var(--mu);margin-top:.85rem;line-height:1.6;text-align:center}
.login-hint code{background:#F0EDE8;border-radius:4px;padding:.1rem .35rem;font-size:.68rem;word-break:break-all}
.card{background:var(--card);border-radius:11px;border:1px solid var(--bd);margin-bottom:1rem;overflow:hidden}
.card-hd{background:var(--m);color:#fff;padding:.55rem 1.1rem;font-size:.77rem;font-weight:700;letter-spacing:.3px}
.card-bd{padding:1rem 1.1rem}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:.55rem;margin-bottom:.85rem}
.stat{background:#F8F5F2;border-radius:8px;padding:.6rem;text-align:center;border:1px solid var(--bd)}
.sl{font-size:.65rem;color:var(--mu);text-transform:uppercase;letter-spacing:.4px;margin-bottom:.22rem}
.sv{font-size:1.25rem;font-weight:800;color:var(--m)}
.grade-hl{text-align:center;padding:1.4rem 1rem;background:#FBF8F8;border:1px solid #EDD;border-radius:10px;margin-bottom:1rem}
.gnum{font-size:3.2rem;font-weight:900;color:var(--m);line-height:1}
.gunit{font-size:.72rem;color:var(--mu);text-transform:uppercase;letter-spacing:.5px}
.geq{font-size:1.05rem;font-weight:700;margin-top:.4rem}
.badge{display:inline-block;padding:.25rem .85rem;border-radius:20px;font-size:.73rem;font-weight:700;margin-top:.35rem}
.pass{background:var(--grbg);color:var(--gr)}.fail{background:var(--rdbg);color:var(--rd)}
.tbl{width:100%;border-collapse:collapse;font-size:.81rem}
.tbl th{text-align:left;padding:.42rem .65rem;background:#F5F1EE;color:var(--mu);font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;border-bottom:1px solid var(--bd)}
.tbl td{padding:.45rem .65rem;border-bottom:1px solid #F0EDE8}
.tbl tr:last-child td{border-bottom:none}
.tbl .r{text-align:right;font-weight:700;color:var(--m)}.tbl .mu{color:var(--mu)}
.row-item{display:flex;justify-content:space-between;padding:.38rem 0;border-bottom:1px solid #F0EDE8;font-size:.81rem}
.row-item:last-child{border-bottom:none}.rl{color:var(--mu)}.rv{font-weight:700}
.info-box{margin-top:.7rem;background:#F8F5F2;border-radius:6px;padding:.5rem .7rem;font-size:.73rem;color:var(--mu)}
.prog-bar{height:6px;background:#EEE;border-radius:3px;overflow:hidden;margin-top:.22rem}
.prog-fill{height:100%;background:var(--m);border-radius:3px}
.subject-card{width:100%;text-align:left;background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:1rem 1.1rem;cursor:pointer;transition:all .18s;border-left:4px solid var(--m)}
.subject-card:hover{border-color:var(--ml);box-shadow:0 3px 16px rgba(123,28,28,.1)}
.adm-stat-row{display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:1rem}
.sp{background:var(--card);border:1px solid var(--bd);border-radius:8px;padding:.5rem .9rem;text-align:center;min-width:80px}
.sp-n{font-size:1.3rem;font-weight:800;color:var(--m)}.sp-l{font-size:.65rem;color:var(--mu);text-transform:uppercase;letter-spacing:.4px}
.toast{position:fixed;bottom:1.2rem;right:1.2rem;background:var(--gr);color:#fff;padding:.6rem 1.2rem;border-radius:8px;font-size:.82rem;font-weight:600;z-index:999;animation:fadeup .3s ease}
.toast-err{background:var(--rd)!important}
@keyframes fadeup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:580px){.content{padding:.9rem}.topbar{padding:.5rem .9rem}}
`}</style>;}
