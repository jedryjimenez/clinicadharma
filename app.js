// ====== Local DB & Session ======
const DB_KEY = 'clinic_demo_db_v4_1';
const SESS_KEY = 'clinic_demo_session';
const app = document.getElementById('app');

const uid = (p='id') => p + '_' + Math.random().toString(36).slice(2,8) + Date.now().toString(36);
function loadDB(){ let db = localStorage.getItem(DB_KEY); if(!db){ db = JSON.stringify(seedDB()); localStorage.setItem(DB_KEY, db); } return JSON.parse(localStorage.getItem(DB_KEY)); }
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function seedDB(){
  const db = {
    users: [{id:uid('usr'), email:'admin@demo.com', pass:'admin', name:'Admin Demo', role:'admin'}],
    doctors: [
      {id:uid('doc'), name:'Dr. Pérez', specialty:'Medicina General'},
      {id:uid('doc'), name:'Dra. Gómez', specialty:'Medicina Interna'},
      {id:uid('doc'), name:'Dr. Ruiz', specialty:'Radiología'}
    ],
    patients: [
      {id:uid('pat'), document:'001-111111-0000', name:'Juan Pérez', dob:'1990-05-12', phone:'+505 8888 1111', address:'Managua', allergies:['-'], coverage:'Plan X'},
      {id:uid('pat'), document:'001-222222-0000', name:'María López', dob:'1986-11-20', phone:'+505 8888 2222', address:'León', allergies:['Penicilina'], coverage:'Plan X'},
      {id:uid('pat'), document:'001-333333-0000', name:'Luis Ruiz', dob:'1978-03-08', phone:'+505 8888 3333', address:'Masaya', allergies:[], coverage:'Particular'}
    ],
    appointments: [], encounters: [], orders: [], prescriptions: [], invoices: [], metrics: {}
  };
  const times=['08:30','09:15','10:00','11:30'], services=['Consulta general','Control','Ecografía','Consulta'];
  for(let i=0;i<4;i++){
    const t=times[i].split(':'), dt=new Date(); dt.setHours(+t[0], +t[1],0,0);
    db.appointments.push({id:uid('ap'), datetime:dt.toISOString(), doctorId:db.doctors[i%db.doctors.length].id, patientId:db.patients[i%db.patients.length].id, service:services[i], status:'scheduled', priority:'Media'});
  }
  return db;
}
const getSession=()=>{ const s=localStorage.getItem(SESS_KEY); return s? JSON.parse(s): null; }
const setSession=u=> localStorage.setItem(SESS_KEY, JSON.stringify({id:u.id,name:u.name,email:u.email,role:u.role}));
const clearSession=()=> localStorage.removeItem(SESS_KEY);

// ====== Utils ======
const views=[...document.querySelectorAll('.view')];
function showView(id){ views.forEach(v=>v.classList.toggle('hidden', v.id!==id)); app.setAttribute('data-auth', id==='login' ? 'false':'true'); ensureLoginDemoCTA(); }
function toast(msg){ let t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t) } t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); }
const sleep = ms => new Promise(r=>setTimeout(r,ms));

// ====== Role-based menu ======
function applyRole(role){
  app.dataset.role = role;
  document.querySelectorAll('.menu .menu-item').forEach(b => {
    const roles=(b.getAttribute('data-roles')||'').split(' ');
    b.style.display = roles.includes(role) ? '' : 'none';
  });
}

// ====== Charts (canvas vanilla) ======
function drawBarChart(id, labels, data){
  const c=document.getElementById(id); if(!c) return; const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
  const W=c.width,H=c.height,pad=30,max=Math.max(1,...data),bw=(W-pad*2)/labels.length*.7;
  ctx.font='12px Inter';
  labels.forEach((lab,i)=>{
    const x=pad + i*((W-pad*2)/labels.length)+10, h=(H-pad*2)*(data[i]/max), y=H-pad-h;
    const g=ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#6366F1'); g.addColorStop(1,'#0F766E');
    ctx.fillStyle=g; ctx.fillRect(x,y,bw,h);
    ctx.fillStyle='#94A3B8'; ctx.fillText(lab, x, H-pad+14);
    ctx.fillStyle='#1F2937'; ctx.fillText(data[i], x, y-4);
  });
}
function drawLineChart(id, labels, data){
  const c=document.getElementById(id); if(!c) return; const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
  const W=c.width,H=c.height,pad=30,max=Math.max(1,...data);
  ctx.strokeStyle='#6366F1'; ctx.lineWidth=2; ctx.beginPath();
  labels.forEach((_,i)=>{ const x=pad+i*((W-pad*2)/(labels.length-1)); const y=H-pad-(H-pad*2)*(data[i]/max); i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
  ctx.stroke();
  ctx.fillStyle='#64748B'; ctx.font='12px Inter';
  labels.forEach((lab,i)=>{ const x=pad+i*((W-pad*2)/(labels.length-1)); ctx.fillText(lab, x-8, H-pad+14); });
}

// ====== Confetti ======
function confetti(){
  const cvs=document.getElementById('fxConfetti'); if(!cvs) return;
  const ctx=cvs.getContext('2d'); cvs.width=innerWidth; cvs.height=innerHeight;
  const parts=Array.from({length:120},()=>({x:Math.random()*cvs.width,y:-10,s:2+Math.random()*4,v:2+Math.random()*3,c:`hsl(${Math.random()*360},90%,60%)`}));
  let t=0; (function tick(){ ctx.clearRect(0,0,cvs.width,cvs.height);
    parts.forEach(p=>{ p.y+=p.v; p.x+=Math.sin((p.y+p.s)*0.02); ctx.fillStyle=p.c; ctx.fillRect(p.x,p.y,p.s,p.s*2); });
    t++; if(t<120) requestAnimationFrame(tick); else ctx.clearRect(0,0,cvs.width,cvs.height);
  })();
}

// ====== Navigation ======
document.querySelectorAll('.menu .menu-item').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.menu .menu-item').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const target=btn.dataset.target; showView(target);
    if(target==='dashboard') renderDashboard();
    if(target==='pacientes') renderPacientes();
    if(target==='agenda') renderAgenda();
    if(target==='sala') renderSalaEspera();
    if(target==='consulta') prepareConsulta();
    if(target==='ordenes') renderOrdenes();
    if(target==='recetas') renderReceta();
    if(target==='facturacion') renderFactura();
    closeDrawer();
  });
});

// ====== Auth init ======
(function initAuth(){
  const s=getSession();
  if(s){ document.getElementById('userBadge').textContent=s.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    app.setAttribute('data-auth','true'); showView('dashboard'); applyRole(s.role||'admin'); renderDashboard();
  } else { showView('login'); }
})();

// Topbar quick actions
document.getElementById('tbNewAppt')?.addEventListener('click',()=>{ document.querySelector('[data-target="agenda"]').click(); document.getElementById('btnNuevaCita').click(); });
document.getElementById('tbNewPatient')?.addEventListener('click',()=>{ document.querySelector('[data-target="pacientes"]').click(); showView('newPatient'); });

// Role switch
document.getElementById('roleSwitch').addEventListener('change',e=>{ applyRole(e.target.value); toast('Vista por rol: '+e.target.value); });

// Dark mode toggle
const root=document.documentElement;
document.getElementById('toggleDark').addEventListener('click',()=>{ const d=root.classList.toggle('dark'); toast(d?'Tema oscuro':'Tema claro'); });

// Tour
document.getElementById('btnTour')?.addEventListener('click',()=> document.getElementById('tour').classList.remove('hidden'));
document.getElementById('btnTourOk')?.addEventListener('click',()=> document.getElementById('tour').classList.add('hidden'));

// ====== Login/Signup/Forgot ======
btnDoLogin?.addEventListener('click',()=>{
  const email=loginEmail.value.trim(), pass=loginPass.value.trim();
  const db=loadDB(); const user=db.users.find(u=>u.email===email && u.pass===pass);
  if(user){ setSession(user); userBadge.textContent=user.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    showView('dashboard'); applyRole(user.role||'admin'); renderDashboard(); toast('Bienvenido');
  } else toast('Credenciales no válidas (usa admin@demo.com / admin)');
});
loginPass?.addEventListener('keydown',e=>{ if(e.key==='Enter') btnDoLogin?.click(); });
btnGoSignup?.addEventListener('click',()=> showView('signup'));
btnGoForgot?.addEventListener('click',()=> showView('forgot'));
btnSendReset?.addEventListener('click',()=>{ toast('Si el email existe, recibirás un enlace (demo)'); showView('login'); });
btnCreateUser?.addEventListener('click',()=>{
  const name=suName.value.trim(), email=suEmail.value.trim(), pass=suPass.value.trim(), role=suRole.value;
  if(!email||!pass){ toast('Completa email y contraseña'); return; }
  const db=loadDB(); if(db.users.find(u=>u.email===email)){ toast('Email ya registrado'); return; }
  db.users.push({id:uid('usr'),name,email,pass,role}); saveDB(db); toast('Usuario creado. Inicia sesión.'); showView('login');
});
btnLogout?.addEventListener('click',()=>{ clearSession(); toast('Sesión cerrada'); showView('login'); });

// ====== Dashboard ======
function renderDashboard(){
  const db=loadDB(); const start=new Date(); start.setHours(0,0,0,0); const end=new Date(); end.setHours(23,59,59,999);
  const todayAp=db.appointments.filter(a=>new Date(a.datetime)>=start && new Date(a.datetime)<=end);
  kpiCitas.textContent=todayAp.length;
  kpiNoShow.textContent=todayAp.filter(a=>a.status==='no_show').length;
  kpiEspera.textContent=todayAp.filter(a=>['checked_in','triage'].includes(a.status)).length;
  kpiAtendidos.textContent=todayAp.filter(a=>a.status==='completed').length;

  drawBarChart('chartEstados',['Prog','Check','Triage','Cons','OK','NoShow'],[
    todayAp.filter(a=>a.status==='scheduled').length,
    todayAp.filter(a=>a.status==='checked_in').length,
    todayAp.filter(a=>a.status==='triage').length,
    todayAp.filter(a=>a.status==='in_consult').length,
    todayAp.filter(a=>a.status==='completed').length,
    todayAp.filter(a=>a.status==='no_show').length,
  ]);
  const week=['L','M','X','J','V','S','D'], trend=week.map(()=>12+Math.floor(Math.random()*8));
  drawLineChart('chartSemana',week,trend);

  const tb=tbCitasHoy; tb.innerHTML='';
  todayAp.sort((a,b)=>new Date(a.datetime)-new Date(b.datetime)).forEach(a=>{
    const p=db.patients.find(x=>x.id===a.patientId)?.name||'—';
    const d=db.doctors.find(x=>x.id===a.doctorId)?.name||'—';
    const tr=document.createElement('div'); tr.className='tr'; tr.style.gridTemplateColumns='140px 1fr 1fr 1fr 140px 200px';
    const hora=new Date(a.datetime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const badge=st=>`<span class="chip" style="border-color:transparent;background:color-mix(in srgb,var(--secondary),transparent 85%);">${st}</span>`;
    tr.innerHTML=`<div>${hora}</div><div>${p}</div><div>${d}</div><div>${a.service}</div><div>${badge(a.status)}</div>
      <div><button class="btn btn-outline" data-checkin="${a.id}">Check-in</button>
      <button class="btn" data-cancel="${a.id}">No-show</button></div>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll('[data-checkin]').forEach(b=> b.addEventListener('click',()=> changeApptStatus(b.dataset.checkin,'checked_in')));
  tb.querySelectorAll('[data-cancel]').forEach(b=> b.addEventListener('click',()=> changeApptStatus(b.dataset.cancel,'no_show')));

  btnQuickAppt.onclick=()=>{ document.querySelector('[data-target="agenda"]').click(); btnNuevaCita.click(); };
  btnBoostData.onclick=boostDemoData;
}
function changeApptStatus(id,status){
  const db=loadDB(); const ap=db.appointments.find(a=>a.id===id); if(!ap) return;
  ap.status=status; saveDB(db); toast(`Cita ${status}`); renderDashboard(); renderSalaEspera();
}

// ====== Pacientes ======
function renderPacientes(){
  const db=loadDB(), tb=tbPacientes; tb.innerHTML='';
  db.patients.forEach(p=>{
    const tr=document.createElement('div'); tr.className='tr'; tr.style.gridTemplateColumns='200px 1fr 160px 1fr 200px';
    tr.innerHTML=`<div>${p.document}</div><div>${p.name}</div><div>${p.phone||'—'}</div><div>${p.coverage||'—'}</div>
      <div><button class="btn" data-ver="${p.id}">Ver</button></div>`;
    tb.appendChild(tr);
  });
  btnNewPatientTop.onclick=()=> showView('newPatient');
  tb.querySelectorAll('[data-ver]').forEach(b=> b.addEventListener('click',()=>{ const db2=loadDB(); alert(JSON.stringify(db2.patients.find(x=>x.id===b.dataset.ver),null,2)) }));
}
btnSavePatient?.addEventListener('click',()=>{
  const db=loadDB();
  const p={ id:uid('pat'), document:pDoc.value.trim(), dob:pDob.value, name:pName.value.trim(),
    phone:pPhone.value.trim(), address:pAddr.value.trim(), allergies:(pAllergies.value||'').split(',').map(s=>s.trim()).filter(Boolean), coverage:pCoverage.value.trim() };
  if(!p.name){ toast('Nombre es requerido'); return; }
  db.patients.push(p); saveDB(db); toast('Paciente registrado'); showView('pacientes'); renderPacientes();
});

// ====== Agenda ======
function renderAgenda(){
  const db=loadDB(), cols=agendaCols; cols.innerHTML='';
  agDoctor.innerHTML='<option value="">Todos los médicos</option>'+db.doctors.map(d=>`<option value="${d.id}">${d.name} — ${d.specialty}</option>`).join('');
  db.doctors.forEach(d=>{
    const col=document.createElement('div'); col.className='agenda-col';
    col.innerHTML=`<div class="agenda-col-title">${d.name}</div>`;
    const list=db.appointments.filter(a=>a.doctorId===d.id).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
    list.forEach(a=>{
      const hour=new Date(a.datetime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      const patient=db.patients.find(p=>p.id===a.patientId)?.name||'—';
      const slot=document.createElement('div'); slot.className='slot'+(a.status!=='scheduled'?' booked':'');
      slot.textContent=`${hour} — ${patient} (${a.service}) [${a.status}]`;
      col.appendChild(slot);
    });
    cols.appendChild(col);
  });
}
btnNuevaCita?.addEventListener('click',()=>{
  const db=loadDB(); citaDoctor.innerHTML=db.doctors.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
  citaFecha.value=new Date(Date.now()+3600000).toISOString().slice(0,16);
  modalCita.classList.remove('hidden');
});
closeModalCita?.addEventListener('click',()=> modalCita.classList.add('hidden'));
cancelModalCita?.addEventListener('click',()=> modalCita.classList.add('hidden'));
btnPickPaciente?.addEventListener('click',()=>{
  const q=citaPaciente.value.toLowerCase(); const db=loadDB();
  const match=db.patients.find(p=>(p.name||'').toLowerCase().includes(q)||(p.document||'').toLowerCase().includes(q));
  if(match){ citaPaciente.value=`${match.name} (${match.document})`; citaPaciente.dataset.pid=match.id; toast('Paciente seleccionado'); } else toast('No encontrado');
});
btnGuardarCita?.addEventListener('click',()=>{
  const db=loadDB(); const pid=citaPaciente.dataset.pid; if(!pid){ toast('Selecciona paciente'); return; }
  const ap={ id:uid('ap'), datetime:new Date(citaFecha.value).toISOString(), doctorId:citaDoctor.value, patientId:pid, service:citaServicio.value||'Consulta', status:'scheduled', priority:'Media' };
  db.appointments.push(ap); saveDB(db); toast('Cita creada'); modalCita.classList.add('hidden'); renderDashboard(); renderAgenda();
});

// ====== Sala de espera & Triage ======
let triageTarget=null;
function renderSalaEspera(){
  const db=loadDB(), tb=tbEspera; tb.innerHTML='';
  const list=db.appointments.filter(a=>['checked_in','triage','in_consult'].includes(a.status)).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
  list.forEach(a=>{
    const p=db.patients.find(p=>p.id===a.patientId)?.name||'—';
    const hora=new Date(a.datetime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const tr=document.createElement('div'); tr.className='tr'; tr.style.gridTemplateColumns='120px 1fr 120px 140px 240px';
    tr.innerHTML=`<div>${hora}</div><div>${p}</div><div>${a.priority||'-'}</div><div>${a.status}</div>
      <div><button class="btn" data-triage="${a.id}">Triage</button> <button class="btn btn-primary" data-consulta="${a.id}">Llamar</button> <button class="btn" data-complete="${a.id}">Completar</button></div>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll('[data-triage]').forEach(b=> b.addEventListener('click',()=>{ triageTarget=b.dataset.triage; toast('Completa el panel de triage y pulsa "Enviar a consulta"'); }));
  tb.querySelectorAll('[data-consulta]').forEach(b=> b.addEventListener('click',()=>{ changeApptStatus(b.dataset.consulta,'in_consult'); prepareConsulta(b.dataset.consulta); showView('consulta'); }));
  tb.querySelectorAll('[data-complete]').forEach(b=> b.addEventListener('click',()=> changeApptStatus(b.dataset.complete,'completed')));
}
btnEnviarConsulta?.addEventListener('click',()=>{
  if(!triageTarget){ toast('Selecciona primero un paciente en la tabla'); return; }
  const db=loadDB(); const ap=db.appointments.find(a=>a.id===triageTarget); if(!ap) return;
  ap.status='triage'; ap.priority=tPriority.value;
  let enc=db.encounters.find(e=>e.appointmentId===ap.id);
  if(!enc){ enc={id:uid('enc'), appointmentId:ap.id, patientId:ap.patientId, doctorId:ap.doctorId, vitals:{}, notes:{S:'',O:'',A:'',P:''}, dx:[], signed:false}; db.encounters.push(enc); }
  enc.vitals={TA:tTA.value,FC:tFC.value,FR:tFR.value,Temp:tTemp.value,SpO2:tSpO2.value,IMC:tIMC.value,Obs:tObs.value};
  saveDB(db); toast('Triage guardado y enviado a consulta'); changeApptStatus(ap.id,'in_consult'); prepareConsulta(ap.id); showView('consulta');
});

// ====== Consulta (SOAP) ======
let currentApptId=null;
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); tab.classList.add('active');
    document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active')); document.getElementById(tab.dataset.pane).classList.add('active');
  });
});
function prepareConsulta(apptId){
  const db=loadDB(); let ap=apptId? db.appointments.find(a=>a.id===apptId): db.appointments.find(a=>a.status==='in_consult');
  if(!ap){ encabezadoEncuentro.textContent='No hay paciente en consulta'; return; }
  currentApptId=ap.id;
  const p=db.patients.find(x=>x.id===ap.patientId), d=db.doctors.find(x=>x.id===ap.doctorId);
  encabezadoEncuentro.textContent=`${p.name} • ${d.name} • ${new Date(ap.datetime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} • ${ap.status}`;
  let enc=db.encounters.find(e=>e.appointmentId===ap.id);
  if(!enc){ enc={id:uid('enc'), appointmentId:ap.id, patientId:ap.patientId, doctorId:ap.doctorId, vitals:{}, notes:{S:'',O:'',A:'',P:''}, dx:[], signed:false}; db.encounters.push(enc); saveDB(db); }
  soapS.value=enc.notes.S||''; soapO.value=enc.notes.O||''; soapA.value=enc.notes.A||''; soapP.value=enc.notes.P||'';
  const vitals=enc.vitals||{}; panelVitals.innerHTML=''; Object.entries(vitals).forEach(([k,v])=>{ if(v){ const s=document.createElement('span'); s.className='chip'; s.textContent=`${k} ${v}`; panelVitals.appendChild(s); } });
  chipsDx.innerHTML=''; (enc.dx||[]).forEach(code=>{ const s=document.createElement('span'); s.className='chip'; s.textContent=code; chipsDx.appendChild(s); });
}
btnAddDx?.addEventListener('click',()=>{
  if(!currentApptId) return; const db=loadDB(); const enc=db.encounters.find(e=>e.appointmentId===currentApptId);
  const code=dxInput.value.trim(); if(!code) return; enc.dx=enc.dx||[]; enc.dx.push(code); saveDB(db); prepareConsulta(currentApptId);
});
btnFirmarCerrar?.addEventListener('click',()=>{
  if(!currentApptId) return; const db=loadDB(); const enc=db.encounters.find(e=>e.appointmentId===currentApptId); const ap=db.appointments.find(a=>a.id===currentApptId);
  enc.notes={S:soapS.value,O:soapO.value,A:soapA.value,P:soapP.value}; enc.signed=true; ap.status='completed'; saveDB(db); toast('Consulta firmada'); confetti(); renderDashboard();
});
btnImprimirNota?.addEventListener('click',()=>{
  if(!currentApptId) return; const db=loadDB(); const enc=db.encounters.find(e=>e.appointmentId===currentApptId); const ap=db.appointments.find(a=>a.id===currentApptId);
  const p=db.patients.find(x=>x.id===ap.patientId), d=db.doctors.find(x=>x.id===ap.doctorId);
  const w=window.open('','_blank'); w.document.write(`
  <html><head><title>Nota SOAP</title><style>
    body{font-family:Inter,Arial,sans-serif;padding:24px}
    h2{margin:0 0 6px} .muted{color:#6b7280} hr{margin:12px 0}
    .box{border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:10px}
  </style></head><body>
    <h2>Nota SOAP</h2><div class="muted">${new Date().toLocaleString()}</div><hr/>
    <div><strong>Paciente:</strong> ${p.name} &nbsp; <strong>Médico:</strong> ${d.name}</div>
    <div class="box"><strong>S:</strong> ${enc.notes?.S||''}</div>
    <div class="box"><strong>O:</strong> ${enc.notes?.O||''}</div>
    <div class="box"><strong>A:</strong> ${enc.notes?.A||''}</div>
    <div class="box"><strong>P:</strong> ${enc.notes?.P||''}</div>
    <div><strong>Dx:</strong> ${(enc.dx||[]).join(', ')||'—'}</div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`); w.document.close();
});

// Crear orden desde consulta
btnCrearOrden?.addEventListener('click',()=>{
  if(!currentApptId){ toast('Sin encuentro'); return; }
  const db=loadDB(); const enc=db.encounters.find(e=>e.appointmentId===currentApptId);
  const o={id:uid('ord'),encounterId:enc.id,patientId:enc.patientId,type:ordTipo?.value||'Laboratorio',provider:ordProv?.value||'CLAB',notes:ordNotas?.value||'Hematología básica',result:{summary:'Resultado normal'},status:'created'};
  db.orders.push(o); saveDB(db); toast('Orden creada'); document.querySelector('[data-target="ordenes"]').click(); renderOrdenes();
});

// ====== Órdenes & Resultados ======
let selectedOrderId=null;
function renderOrdenes(){
  const db=loadDB(), tb=tbOrdenes; tb.innerHTML='';
  db.orders.forEach(o=>{
    const p=db.patients.find(x=>x.id===o.patientId)?.name||'—';
    const tr=document.createElement('div'); tr.className='tr'; tr.style.gridTemplateColumns='160px 140px 1fr 140px 200px';
    const fecha=new Date().toISOString().slice(0,10);
    tr.innerHTML=`<div>${fecha}</div><div>${o.type}</div><div>${p}</div><div>${o.status}</div>
      <div><button class="btn" data-verres="${o.id}">Ver</button></div>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll('[data-verres]').forEach(b=> b.addEventListener('click',()=> openResultado(b.dataset.verres)));
}
function openResultado(id){
  const db=loadDB(); const o=db.orders.find(x=>x.id===id); if(!o) return;
  selectedOrderId=id; resContenido.innerHTML=`<p><strong>Tipo:</strong> ${o.type}</p><p><strong>Proveedor:</strong> ${o.provider||'-'}</p><p><strong>Notas:</strong> ${o.notes||'-'}</p><hr/><p><strong>Resultado:</strong> ${o.result?.summary||'—'}</p>`;
  modalResultado.classList.remove('hidden');
}
closeModalRes?.addEventListener('click',()=> modalResultado.classList.add('hidden'));
btnMarcarEntregado?.addEventListener('click',()=>{
  if(!selectedOrderId) return; const db=loadDB(); const o=db.orders.find(x=>x.id===selectedOrderId); o.status='delivered'; saveDB(db);
  toast('Marcado como entregado'); modalResultado.classList.add('hidden'); renderOrdenes();
});
btnImprimirRes?.addEventListener('click',()=>{
  if(!selectedOrderId) return; const db=loadDB(); const o=db.orders.find(x=>x.id===selectedOrderId);
  const w=window.open('','_blank'); w.document.write(`
  <html><head><title>Resultado</title><style>
    body{font-family:Inter,Arial,sans-serif;padding:24px}
    h2{margin:0 0 6px} .muted{color:#6b7280} hr{margin:12px 0}
    .box{border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:10px}
  </style></head><body>
    <h2>Resultado de ${o.type}</h2><hr/><div class="box">${o.result?.summary||'—'}</div>
    <script>window.onload=()=>window.print()</script></body></html>`); w.document.close();
});

// ====== Receta ======
function renderReceta(){ const tb=tbReceta; tb.innerHTML=''; addMedRow('Paracetamol','500 mg','c/8h','5 días','Tomar con agua'); }
function addMedRow(a='',d='',f='',du='',i=''){
  const tb=tbReceta; const tr=document.createElement('div'); tr.className='tr'; tr.style.gridTemplateColumns='1fr 140px 140px 140px 1fr 80px';
  tr.innerHTML=`<div><input class="input" value="${a}"></div><div><input class="input" value="${d}"></div><div><input class="input" value="${f}"></div><div><input class="input" value="${du}"></div><div><input class="input" value="${i}"></div><div><button class="btn">✕</button></div>`;
  tr.querySelector('button').addEventListener('click',()=> tr.remove()); tb.appendChild(tr);
}
btnAddMed?.addEventListener('click',()=> addMedRow());
btnFirmarReceta?.addEventListener('click',()=> toast('Receta firmada (demo)'));
btnImprimirReceta?.addEventListener('click',()=>{
  const rows=[...document.querySelectorAll('#tbReceta .tr')].map(tr=>[...tr.querySelectorAll('input')].map(i=>i.value));
  const w=window.open('','_blank'); w.document.write(`
  <html><head><title>Receta</title><style>
    body{font-family:Inter,Arial,sans-serif;padding:24px}
    table{width:100%;border-collapse:collapse} td,th{border:1px solid #e5e7eb;padding:8px}
    h2{margin:0 0 6px}
  </style></head><body>
    <h2>Receta médica</h2>
    <table><thead><tr><th>Principio activo</th><th>Dosis</th><th>Frecuencia</th><th>Duración</th><th>Instrucciones</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v||''}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <br/><div>_________________________<br/>Firma y sello</div>
    <script>window.onload=()=>window.print()</script></body></html>`); w.document.close();
});

// ====== Facturación ======
function renderFactura(){
  const tb=tbFactura; tb.innerHTML=''; const items=[{c:'Consulta general',q:1,p:400},{c:'Procedimiento',q:1,p:250}]; let total=0;
  items.forEach(it=>{ const st=it.q*it.p; total+=st; const tr=document.createElement('div'); tr.className='tr'; tr.style.gridTemplateColumns='2fr 120px 140px 140px';
    tr.innerHTML=`<div>${it.c}</div><div>${it.q}</div><div>C$ ${it.p}</div><div>C$ ${st}</div>`; tb.appendChild(tr);
  });
  factTotal.textContent='C$ '+total;
}
btnRegistrarPago?.addEventListener('click',()=>{ toast('Pago registrado (demo)'); confetti(); });

// ====== Branding / Tema ======
btnApplyTheme?.addEventListener('click',()=>{
  const p=cPrimary.value, s=cSecondary.value; const st=document.createElement('style');
  st.textContent=`:root{--primary:${p};--secondary:${s}}`; document.head.appendChild(st); toast('Tema aplicado');
});
btnThemeReset?.addEventListener('click',()=> location.reload());

// ====== Seed & Boost Data ======
btnSeed?.addEventListener('click',()=>{ localStorage.removeItem(DB_KEY); loadDB(); toast('Base re-sembrada'); renderDashboard(); });
function boostDemoData(){
  const db=loadDB();
  for(let i=0;i<50;i++){
    const name=`Paciente ${String(i+1).padStart(2,'0')}`;
    db.patients.push({id:uid('pat'), document:`001-${(100000+i).toString().padStart(6,'0')}-0000`, name, dob:'1990-01-01', phone:'+505 8000 0000', address:'Nicaragua', allergies:[], coverage:['Plan X','Particular'][i%2]});
  }
  for(let i=0;i<30;i++){
    const dt=new Date(); dt.setHours(8+(i%9),(i%2)*30,0,0);
    db.appointments.push({id:uid('ap'), datetime:dt.toISOString(), doctorId:db.doctors[i%db.doctors.length].id, patientId:db.patients[(i%db.patients.length)].id, service:['Consulta','Control','Ecografía'][i%3], status:['scheduled','checked_in','triage','in_consult','completed','no_show'][i%6], priority:['Baja','Media','Alta'][i%3]});
  }
  saveDB(db); toast('Datos demo generados'); renderDashboard(); renderAgenda(); renderPacientes();
}
btnBoostData2?.addEventListener('click',boostDemoData);
btnBoostData?.addEventListener('click',boostDemoData);

// ====== Global search (demo) ======
globalSearch?.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    const q=e.target.value.toLowerCase(); const db=loadDB();
    const p=db.patients.find(p=>(p.name||'').toLowerCase().includes(q));
    if(p){ alert('Paciente encontrado: '+p.name); document.querySelector('[data-target="pacientes"]').click(); }
    else toast('Sin resultados');
  }
});

// ====== Autopilot Demo ======
btnRunDemo?.addEventListener('click',runDemo);
async function runDemo(){
  toast('Iniciando demo guiada...');
  boostDemoData(); await sleep(500);
  document.querySelector('[data-target="agenda"]').click(); await sleep(400);
  const db=loadDB(); const pid=db.patients[0].id, did=db.doctors[0].id;
  const dt=new Date(); dt.setHours(new Date().getHours()+1,0,0,0);
  db.appointments.push({id:uid('ap'), datetime:dt.toISOString(), doctorId:did, patientId:pid, service:'Consulta', status:'scheduled', priority:'Media'});
  saveDB(db); renderAgenda(); await sleep(400);
  document.querySelector('[data-target="dashboard"]').click(); await sleep(300);
  const apId=db.appointments[db.appointments.length-1].id;
  changeApptStatus(apId,'checked_in'); await sleep(300);
  document.querySelector('[data-target="sala"]').click(); await sleep(300);
  triageTarget=apId; tTA.value='120/80'; tFC.value='78'; tFR.value='14'; tTemp.value='37.0'; tSpO2.value='98%'; tIMC.value='24'; tObs.value='Sin hallazgos'; tPriority.value='Media';
  btnEnviarConsulta.click(); await sleep(600);
  dxInput.value='J06.9'; btnAddDx.click();
  soapS.value='Paciente con odinofagia leve'; soapO.value='TA 120/80, Temp 37, orofaringe congestiva'; soapA.value='Faringitis aguda probable'; soapP.value='Hidratación, paracetamol, reposo'; await sleep(400);
  btnCrearOrden.click(); await sleep(400);
  const firstViewBtn=document.querySelector('#tbOrdenes .tr .btn'); if(firstViewBtn) firstViewBtn.click(); await sleep(400);
  btnMarcarEntregado.click(); await sleep(400);
  document.querySelector('[data-target="recetas"]').click(); await sleep(300);
  btnFirmarReceta.click(); await sleep(300);
  document.querySelector('[data-target="facturacion"]').click(); await sleep(300);
  btnRegistrarPago.click(); await sleep(800);
  document.querySelector('[data-target="dashboard"]').click();
  toast('Demo finalizada ✨');
}

// ====== HOTFIX mobile: Demo CTA en login ======
function ensureLoginDemoCTA(){
  const isLogin=app.getAttribute('data-auth')==='false';
  const isSmall=window.innerWidth<768;
  const already=document.getElementById('btnRunDemoLogin');
  if(isLogin && isSmall && !already){
    const src=document.getElementById('btnRunDemo');
    if(src){ const clone=src.cloneNode(true); clone.id='btnRunDemoLogin'; clone.classList.add('btn-primary');
      const actions=document.querySelector('#login .actions'); actions?.insertBefore(clone, actions.firstChild); clone.addEventListener('click', runDemo);
    }
  }
}
window.addEventListener('resize', ensureLoginDemoCTA);
ensureLoginDemoCTA();

// ====== Drawer móvil ======
const sidebar=document.querySelector('.sidebar');
const scrim=document.getElementById('scrim');
const btnMenu=document.getElementById('btnMenu');
function openDrawer(){ sidebar?.classList.add('open'); scrim.classList.add('show'); document.body.style.overflow='hidden'; }
function closeDrawer(){ sidebar?.classList.remove('open'); scrim.classList.remove('show'); document.body.style.overflow=''; }
btnMenu?.addEventListener('click', openDrawer);
scrim?.addEventListener('click', closeDrawer);
window.addEventListener('resize',()=>{ if(window.innerWidth>1024) closeDrawer(); });
let startX=null;
sidebar?.addEventListener('touchstart',e=> startX=e.touches[0].clientX);
sidebar?.addEventListener('touchmove',e=>{ if(startX!==null){ const dx=e.touches[0].clientX-startX; if(dx<-40){ closeDrawer(); startX=null; } } });

// ====== Desktop safeguard ======
(function ensureDesktopLayout(){
  if(window.innerWidth>1024){ sidebar?.classList.remove('open'); scrim?.classList.remove('show'); document.body.style.overflow=''; }
})();
window.addEventListener('resize',()=>{ if(window.innerWidth>1024){ sidebar?.classList.remove('open'); scrim?.classList.remove('show'); document.body.style.overflow=''; } });

/* ==== POLISH PACK v1 ==== */
/* Mejora visual de charts sin librerías */
(function enhanceCharts(){
  const _drawBar = drawBarChart;
  drawBarChart = function(id, labels, data){
    const c = document.getElementById(id);
    if(!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,c.width,c.height);

    const W=c.width,H=c.height,pad=30,max=Math.max(1,...data),bw=(W-pad*2)/labels.length*.62;
    ctx.font='12px Inter';

    labels.forEach((lab,i)=>{
      const x = pad + i*((W-pad*2)/labels.length) + 14;
      const h = (H-pad*2) * (data[i]/max);
      const y = H - pad - h;

      // Degradado más vistoso
      const g = ctx.createLinearGradient(0,y,0,y+h);
      g.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#6366F1');
      g.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#0F766E');

      // Sombra suave
      ctx.save();
      ctx.shadowColor = 'rgba(2,6,23,.18)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = g;
      ctx.fillRect(x, y, bw, h);
      ctx.restore();

      ctx.fillStyle = '#94A3B8';
      ctx.fillText(lab, x, H-pad+14);
      ctx.fillStyle = '#1F2937';
      ctx.fillText(data[i], x, y-4);
    });
  };

  const _drawLine = drawLineChart;
  drawLineChart = function(id, labels, data){
    const c=document.getElementById(id); if(!c) return;
    const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);

    const W=c.width,H=c.height,pad=30,max=Math.max(1,...data);
    const points = labels.map((_,i)=>{
      const x = pad + i*((W-pad*2)/(labels.length-1));
      const y = H-pad - (H-pad*2)*(data[i]/max);
      return {x,y};
    });

    // Línea más suave
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#6366F1';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.lineCap  = 'round';

    ctx.beginPath();
    points.forEach((p,i)=> i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    ctx.stroke();

    // Puntos
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'rgba(99,102,241,.9)';
    points.forEach(p=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,3.5,0,Math.PI*2); ctx.fill(); ctx.stroke();
    });

    // Eje X
    ctx.fillStyle='#64748B'; ctx.font='12px Inter';
    labels.forEach((lab,i)=>{ const x=pad+i*((W-pad*2)/(labels.length-1)); ctx.fillText(lab, x-8, H-pad+14); });
  };
})();

/* En desktop, por si quedó abierto el drawer por navegación previa */
(function ensureDesktopLayout(){
  if (window.innerWidth > 1024) {
    const sidebar = document.querySelector('.sidebar');
    const scrim = document.getElementById('scrim');
    sidebar?.classList.remove('open');
    scrim?.classList.remove('show');
    document.body.style.overflow = '';
  }
})();
window.addEventListener('resize', () => {
  if (window.innerWidth > 1024) {
    const sidebar = document.querySelector('.sidebar');
    const scrim = document.getElementById('scrim');
    sidebar?.classList.remove('open');
    scrim?.classList.remove('show');
    document.body.style.overflow = '';
  }
});

// ====== Init ======
renderDashboard();
