-- Run this entire script in Supabase SQL Editor


-- 1. USERS
create table if not exists users (
  email text primary key,
  sid text,
  name text,
  password text not null,
  is_temp boolean default true,
  role text default 'student'
);

-- 2. COURSES
create table if not exists courses (
  id text primary key,
  code text, title text, section text, sem text,
  grading text default 'lab_only',
  mt_weight numeric default 0.5,
  ft_weight numeric default 0.5,
  lab_weight numeric default 1.0,
  lec_weight numeric default 0.0,
  passing_grade numeric default 75
);

-- 3. ENROLLMENTS
create table if not exists enrollments (
  student_email text references users(email) on delete cascade,
  course_id text references courses(id) on delete cascade,
  admin_remarks text default '',
  primary key (student_email, course_id)
);

-- 4. SCORE COLUMNS (what columns exist per course+term+component)
create table if not exists score_cols (
  id uuid primary key default gen_random_uuid(),
  course_id text references courses(id) on delete cascade,
  term text not null,       -- mt | ft
  component text not null,  -- lab | lec
  type text not null,       -- att | act | asgn | cp | exam
  label text not null,
  max_score numeric default 1,
  position int default 0
);

-- 5. SCORES
create table if not exists scores (
  student_email text references users(email) on delete cascade,
  col_id uuid references score_cols(id) on delete cascade,
  value numeric default 0,
  primary key (student_email, col_id)
);

-- COURSES
insert into courses (id,code,title,section,sem,grading,mt_weight,ft_weight,lab_weight,lec_weight) values ('ICT09_1BSCEA','ICT 09','Computer Programming','1BSCE-A','2nd Sem 2025-2026','lab_only',0.5,0.5,1.0,0.0) on conflict (id) do nothing;
insert into courses (id,code,title,section,sem,grading,mt_weight,ft_weight,lab_weight,lec_weight) values ('CpE15_3BSCpEB','CpE 15','Microprocessors','3BSCpE-B','1st Sem 2025-2026','both',0.5,0.5,0.4,0.6) on conflict (id) do nothing;
insert into courses (id,code,title,section,sem,grading,mt_weight,ft_weight,lab_weight,lec_weight) values ('CpE14_3BSCpEB','CpE 14','Basic Occupational Health and Safety','3BSCpE-B','1st Sem 2025-2026','lec_only',0.5,0.5,0.0,1.0) on conflict (id) do nothing;
insert into courses (id,code,title,section,sem,grading,mt_weight,ft_weight,lab_weight,lec_weight) values ('CpE08_2BSCpEB','CpE 08','Computer Engineering Drafting and Design','2BSCpE-B','2nd Sem 2025-2026','lab_only',0.3333,0.6667,1.0,0.0) on conflict (id) do nothing;

-- USERS & ENROLLMENTS
insert into users (email,sid,name,password,is_temp) values ('s.rxnabogho@usm.edu.ph','25-62260','ABOGHO, Ralph Xedrick,  Napao','s.rxnabogho@usm.edu.ph25-62260',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jkpagrabio@usm.edu.ph','25-00655','AGRABIO, John Kenneth,  Palma','s.jkpagrabio@usm.edu.ph25-00655',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.fdmamihan@usm.edu.ph','25-94621','AMIHAN, Fritz Daniel,  Marcos','s.fdmamihan@usm.edu.ph25-94621',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.matanino@usm.edu.ph','25-08770','ANINO, Ma. Anthonette,  Tayabas','s.matanino@usm.edu.ph25-08770',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.emasoy@usm.edu.ph','25-05182','ASOY, Elizabeth,  Montealto','s.emasoy@usm.edu.ph25-05182',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.djlbayot@usm.edu.ph','25-01761','BAYOT, Doxcy Jean,  Loredo','s.djlbayot@usm.edu.ph25-01761',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.lrbesanes@usm.edu.ph','25-70074','BESAÑES, LARRY,  Raganas','s.lrbesanes@usm.edu.ph25-70074',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.cljcabila@usm.edu.ph','25-96164','CABILA, Cedric Lyoid,  Jawod','s.cljcabila@usm.edu.ph25-96164',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.hdtcedeno@usm.edu.ph','25-44915','CEDEÑO, Harcel Drake,  Tabano','s.hdtcedeno@usm.edu.ph25-44915',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.maaconti@usm.edu.ph','25-47337','CONTI, Meg Angelique,  Antonio','s.maaconti@usm.edu.ph25-47337',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.bkdumato@usm.edu.ph','25-99668','DUMATO, Benjamen,  Kamid','s.bkdumato@usm.edu.ph25-99668',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.sqespela@usm.edu.ph','25-65088','ESPELA, Shyn,  Quitor','s.sqespela@usm.edu.ph25-65088',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.lkrganancial@usm.edu.ph','25-84175','GANANCIAL, Luke kyro,  Rivera','s.lkrganancial@usm.edu.ph25-84175',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.dbgarancho@usm.edu.ph','25-29054','GARANCHO, Diofelle,  Balansag','s.dbgarancho@usm.edu.ph25-29054',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.djlgumaso@usm.edu.ph','25-25248','GUMASO, Dee Jay,  Linghon','s.djlgumaso@usm.edu.ph25-25248',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.rmblabandero@usm.edu.ph','25-93169','LABANDERO, Reitchin Mae,  Bacus','s.rmblabandero@usm.edu.ph25-93169',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.djalanzar@usm.edu.ph','25-84738','LANZAR, Daryll Jayze,  Alapan','s.djalanzar@usm.edu.ph25-84738',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.nialasco@usm.edu.ph','25-98485','LASCO, Niel Ivan,  Anino','s.nialasco@usm.edu.ph25-98485',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.lajmosquera@usm.edu.ph','25-83688','MOSQUERA, LOUISE ANGELA,  Jasmin','s.lajmosquera@usm.edu.ph25-83688',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.sfnarciso@usm.edu.ph','25-94569','NARCISO, Shanalee,  Fernando','s.sfnarciso@usm.edu.ph25-94569',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.ghmnavarro@usm.edu.ph','25-10064','NAVARRO, Gwynyth Humer,  Mangaoang','s.ghmnavarro@usm.edu.ph25-10064',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.etocumen@usm.edu.ph','25-86840','OCUMEN, Emmanuel,  Tesoro','s.etocumen@usm.edu.ph25-86840',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.kpbpacete@usm.edu.ph','25-68587','PACETE, Kristan Paul,  Banalo','s.kpbpacete@usm.edu.ph25-68587',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.cacpanigas@usm.edu.ph','25-10055','PANIGAS, Cristah Angelic,  Canja','s.cacpanigas@usm.edu.ph25-10055',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.kcpenaranda@usm.edu.ph','25-36602','PEÑARANDA, Kyan,  Cantomayor','s.kcpenaranda@usm.edu.ph25-36602',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.kquibingco@usm.edu.ph','25-76282','QUIBINGCO, Kent,','s.kquibingco@usm.edu.ph25-76282',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.rbrama@usm.edu.ph','25-92884','RAMA, Ronalyn,  Baroy','s.rbrama@usm.edu.ph25-92884',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.josamillano@usm.edu.ph','25-12850','SAMILLANO, Jay,  Orbidalla','s.josamillano@usm.edu.ph25-12850',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.mvgseveses@usm.edu.ph','25-93705','SEVESES, Marc Vincent,  Gavino','s.mvgseveses@usm.edu.ph25-93705',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.gbtambo@usm.edu.ph','25-99417','TAMBO, Gian,  Barcenilla','s.gbtambo@usm.edu.ph25-99417',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.cdtrenuela@usm.edu.ph','25-83342','TRENUELA, Charles,  Degracia','s.cdtrenuela@usm.edu.ph25-83342',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jcudani@usm.edu.ph','25-84726','UDANI, Jomarie,  Caramihan','s.jcudani@usm.edu.ph25-84726',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.wevillacrusis@usm.edu.ph','25-78214','VILLACRUSIS, Wareyn,  Embang','s.wevillacrusis@usm.edu.ph25-78214',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.mgtagcaracar@usm.edu.ph','23-57615','AGCARACAR, Mark Gerald,  Torres','s.mgtagcaracar@usm.edu.ph23-57615',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('egaaquino@usm.edu.ph','23-84661','AQUINO, El Gerald,  Albaño','egaaquino@usm.edu.ph23-84661',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.mgpasuncion@usm.edu.ph','23-61869','ASUNCION, Mellyn Grace,  Paring','s.mgpasuncion@usm.edu.ph23-61869',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.pacalzado@usm.edu.ph','23-75892','CALZADO, Pia,  Arisgado','s.pacalzado@usm.edu.ph23-75892',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('zbacarorocan@usm.edu.ph','23-93633','CAROROCAN, Znie Babe,  Asugas','zbacarorocan@usm.edu.ph23-93633',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.pcpcoscos@usm.edu.ph','23-93586','COSCOS, Peter Clarence,  Pancho','s.pcpcoscos@usm.edu.ph23-93586',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.lcdava@usm.edu.ph','23-14140','DAVA, Lyca,  Cagape','s.lcdava@usm.edu.ph23-14140',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.clobdelsocorro@usm.edu.ph','23-48100','DEL SOCORRO, Clarizza,  Obeñita','s.clobdelsocorro@usm.edu.ph23-48100',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jvcdugeno@usm.edu.ph','23-11422','DUGENO, John Vincent,  Cuico','s.jvcdugeno@usm.edu.ph23-11422',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.areran@usm.edu.ph','23-52398','ERAN, Ashly Jade,  Rabino','s.areran@usm.edu.ph23-52398',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.lrcespela@usm.edu.ph','23-61750','ESPELA, Leander Rafael,  Capino','s.lrcespela@usm.edu.ph23-61750',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.btagarcia@usm.edu.ph','23-24696','GARCIA, Bea Trisha,  Acosta','s.btagarcia@usm.edu.ph23-24696',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.vgherbilla@usm.edu.ph','23-34669','HERBILLA, Vladimir,  Gonzales','s.vgherbilla@usm.edu.ph23-34669',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.blhortilano@usm.edu.ph','23-03147','HORTILANO, Barbeluz,  Langub','s.blhortilano@usm.edu.ph23-03147',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jtlaniohan@usm.edu.ph','23-44455','LANIOHAN, James,  Tingas','s.jtlaniohan@usm.edu.ph23-44455',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.rbmagbanua@usm.edu.ph','23-69164','MAGBANUA, Rovel,  Bajalan','s.rbmagbanua@usm.edu.ph23-69164',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jvmangendra@usm.edu.ph','23-02477','MANGENDRA, Jane,  Victorio','s.jvmangendra@usm.edu.ph23-02477',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.lejapumencias@usm.edu.ph','23-42108','MENCIAS, Leen Jandy,  Puno','s.lejapumencias@usm.edu.ph23-42108',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.sspalencia@usm.edu.ph','23-54945','PALENCIA, Shane,  Salvaloza','s.sspalencia@usm.edu.ph23-54945',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.ebopanaguiton@usm.edu.ph','23-46017','PANAGUITON, Ec Benedict,  Ogatis','s.ebopanaguiton@usm.edu.ph23-46017',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.kspaparon@usm.edu.ph','23-24475','PAPARON, Kobe,  Sinangote','s.kspaparon@usm.edu.ph23-24475',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.dlaperalta@usm.edu.ph','23-47563','PERALTA, Dave Lawrence,  Abanilla','s.dlaperalta@usm.edu.ph23-47563',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.nrrajahmuda@usm.edu.ph','23-03874','RAJAHMUDA, Norhasan,  Rajahmuda','s.nrrajahmuda@usm.edu.ph23-03874',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.rgcroxas@usm.edu.ph','23-86544','ROXAS, Ryzza Glearose,  Cañonero','s.rgcroxas@usm.edu.ph23-86544',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.hkrsabio@usm.edu.ph','23-98539','SABIO, Heart Krysteljen,  Ruiz','s.hkrsabio@usm.edu.ph23-98539',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jrcsarait@usm.edu.ph','23-95163','SARAIT, John Rodge,  Corda','s.jrcsarait@usm.edu.ph23-95163',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.aadsusada@usm.edu.ph','23-12341','SUSADA, Alex Ajhaiezer,  Dauz','s.aadsusada@usm.edu.ph23-12341',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('vbtadena@usm.edu.ph','22-82095','TADENA, VINCENTH,  Bocao','vbtadena@usm.edu.ph22-82095',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.mdtapuli@usm.edu.ph','23-68073','TAPULI, Mohamad,  Dangka','s.mdtapuli@usm.edu.ph23-68073',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('mmtorentera@usm.edu.ph','23-30293','TORENTERA, Mike,  Manayaga','mmtorentera@usm.edu.ph23-30293',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.ajrtorres@usm.edu.ph','23-85373','TORRES, Ashly Jade,  Rufino','s.ajrtorres@usm.edu.ph23-85373',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('bgalbarracin@usm.edu.ph','22-86503','ALBARRACIN, BRAIN,  Guirin','bgalbarracin@usm.edu.ph22-86503',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jamfanagon@usm.edu.ph','23-17804','ANAGON, Justine Allan Mar,  Fonacier','s.jamfanagon@usm.edu.ph23-17804',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.spacordovero@usm.edu.ph','23-37170','CORDOVERO, Sean Paulo,  Alonio','s.spacordovero@usm.edu.ph23-37170',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.sudiya@usm.edu.ph','23-12292','DIYA, Samrod,  Usman','s.sudiya@usm.edu.ph23-12292',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.epguialaludin@usm.edu.ph','23-23544','GUIALALUDIN, Emrhan,  Pantog','s.epguialaludin@usm.edu.ph23-23544',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.clglmepotot@usm.edu.ph','23-83776','POTOT, Clarrence Glenn,  Mendoza','s.clglmepotot@usm.edu.ph23-83776',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.aaabuel@usm.edu.ph','24-71390','ABUEL, Ar-jay,  Apostol','s.aaabuel@usm.edu.ph24-71390',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.kbaantonio@usm.edu.ph','24-12538','ANTONIO, Kristine Bernadette,  Alba','s.kbaantonio@usm.edu.ph24-12538',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.kjparroyo@usm.edu.ph','24-67088','ARROYO, Kenrich Jy,  Palermo','s.kjparroyo@usm.edu.ph24-67088',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jrabarcebal@usm.edu.ph','24-47510','BARCEBAL, John Ray,  Acejo','s.jrabarcebal@usm.edu.ph24-47510',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jdtbautista@usm.edu.ph','24-92972','BAUTISTA, Joed,  Dela Torre','s.jdtbautista@usm.edu.ph24-92972',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.mbtbelmis@usm.edu.ph','24-96004','BELMIS, Mark Bryan,  Tenizo','s.mbtbelmis@usm.edu.ph24-96004',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.bene@usm.edu.ph','24-52145','BENE, Eugene,  Bayhon','s.bene@usm.edu.ph24-52145',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jmbutanas@usm.edu.ph','24-10458','BUTANAS, JEZREL,  Magalay','s.jmbutanas@usm.edu.ph24-10458',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.djdcastillo@usm.edu.ph','24-75792','CASTILLO, Dave Jacob,  Davao','s.djdcastillo@usm.edu.ph24-75792',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.kddacones@usm.edu.ph','24-68218','DACONES, Kate,  Dumlao','s.kddacones@usm.edu.ph24-68218',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.mjedelossantos@usm.edu.ph','24-71708','DELOS SANTOS, Marco John,  Espartero','s.mjedelossantos@usm.edu.ph24-71708',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.lelespartero@usm.edu.ph','24-37563','ESPARTERO, Leroy Emmanuel,  Lima','s.lelespartero@usm.edu.ph24-37563',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.rmferrer@usm.edu.ph','24-67221','FERRER, RACHEL,  Moquete','s.rmferrer@usm.edu.ph24-67221',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jdlhapay@usm.edu.ph','24-10955','HAPAY, Jhayneo,  De Leon','s.jdlhapay@usm.edu.ph24-10955',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.kksibarra@usm.edu.ph','24-44394','IBARRA, Khurt Kirby,  Sarsalejo','s.kksibarra@usm.edu.ph24-44394',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.kcgjinon@usm.edu.ph','24-69297','JINON, Keith Cedryk,  Gonzales','s.kcgjinon@usm.edu.ph24-69297',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.jcbloria@usm.edu.ph','23-15986','LORIA, John Carlo,  Bunda','s.jcbloria@usm.edu.ph23-15986',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.cjamaco@usm.edu.ph','24-78351','MACO, Ceazar Jay,  Aldamar','s.cjamaco@usm.edu.ph24-78351',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.crdlcmatarab@usm.edu.ph','24-53805','MATARAB, Charles Rossenjer,  De La Cerna','s.crdlcmatarab@usm.edu.ph24-53805',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.klrmilanes@usm.edu.ph','24-83569','MILANES, Kent Lenard,  Roda','s.klrmilanes@usm.edu.ph24-83569',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.ddnonesa@usm.edu.ph','24-80765','NONESA, Dalton,  Depaur','s.ddnonesa@usm.edu.ph24-80765',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.sfaogmena@usm.edu.ph','24-38853','OGMENA, Shandiel Faith,  Atilano','s.sfaogmena@usm.edu.ph24-38853',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.acolimba@usm.edu.ph','24-15330','OLIMBA, Aesel,  Cahilig','s.acolimba@usm.edu.ph24-15330',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.mpquinones@usm.edu.ph','24-10234','QUIÑONES, McAldrich,  Pocot','s.mpquinones@usm.edu.ph24-10234',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('dpsilangan@usm.edu.ph','23-16164','SILANGAN, Delmark,  Palate','dpsilangan@usm.edu.ph23-16164',true) on conflict (email) do nothing;
insert into users (email,sid,name,password,is_temp) values ('s.ndvillafuerte@usm.edu.ph','24-84320','VILLAFUERTE, Nelmark,  Dumanda','s.ndvillafuerte@usm.edu.ph24-84320',true) on conflict (email) do nothing;

insert into enrollments (student_email,course_id) values ('s.rxnabogho@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jkpagrabio@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.fdmamihan@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.matanino@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.emasoy@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.djlbayot@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lrbesanes@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.cljcabila@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.hdtcedeno@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.maaconti@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.bkdumato@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.sqespela@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lkrganancial@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.dbgarancho@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.djlgumaso@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.rmblabandero@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.djalanzar@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.nialasco@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lajmosquera@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.sfnarciso@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.ghmnavarro@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.etocumen@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kpbpacete@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.cacpanigas@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kcpenaranda@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kquibingco@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.rbrama@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.josamillano@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mvgseveses@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.gbtambo@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.cdtrenuela@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jcudani@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.wevillacrusis@usm.edu.ph','ICT09_1BSCEA') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mgtagcaracar@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('egaaquino@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mgpasuncion@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.pacalzado@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('zbacarorocan@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.pcpcoscos@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lcdava@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.clobdelsocorro@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jvcdugeno@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.areran@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lrcespela@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.btagarcia@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.vgherbilla@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.blhortilano@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jtlaniohan@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.rbmagbanua@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jvmangendra@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lejapumencias@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.sspalencia@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.ebopanaguiton@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kspaparon@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.dlaperalta@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.nrrajahmuda@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.rgcroxas@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.hkrsabio@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jrcsarait@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.aadsusada@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('vbtadena@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mdtapuli@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('mmtorentera@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.ajrtorres@usm.edu.ph','CpE15_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mgtagcaracar@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('bgalbarracin@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jamfanagon@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('egaaquino@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mgpasuncion@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.pacalzado@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('zbacarorocan@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.spacordovero@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.pcpcoscos@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lcdava@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.clobdelsocorro@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.sudiya@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jvcdugeno@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.areran@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lrcespela@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.btagarcia@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.epguialaludin@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.vgherbilla@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.blhortilano@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jtlaniohan@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.rbmagbanua@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jvmangendra@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lejapumencias@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.sspalencia@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.ebopanaguiton@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kspaparon@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.dlaperalta@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.clglmepotot@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.nrrajahmuda@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.rgcroxas@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.hkrsabio@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jrcsarait@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.aadsusada@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('vbtadena@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mdtapuli@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('mmtorentera@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.ajrtorres@usm.edu.ph','CpE14_3BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.aaabuel@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kbaantonio@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kjparroyo@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jrabarcebal@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jdtbautista@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mbtbelmis@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.bene@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jmbutanas@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.djdcastillo@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kddacones@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mjedelossantos@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.lelespartero@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.rmferrer@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jdlhapay@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kksibarra@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.kcgjinon@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.jcbloria@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.cjamaco@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.crdlcmatarab@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.klrmilanes@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.ddnonesa@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.sfaogmena@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.acolimba@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.mpquinones@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('dpsilangan@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;
insert into enrollments (student_email,course_id) values ('s.ndvillafuerte@usm.edu.ph','CpE08_2BSCpEB') on conflict do nothing;

-- PRE-LOAD FINAL GRADES (from Excel)
-- We'll insert via the app's seed endpoint instead