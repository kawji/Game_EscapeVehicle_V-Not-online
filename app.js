/** Road Safety — Dodge (HTML5) — v6 (inline login fallback + storage fallback) **/
(() => {
const $ = (q, el=document)=> el.querySelector(q);
const nav = document.getElementById("nav");
const view = document.getElementById("view");

/** Storage wrapper with in-memory fallback (handles Safari private / blocked storage) */
const MEM = { store:{} };
function _getLS(){ try{ return window.localStorage; }catch(e){ return null; } }
function _load(key){ const ls=_getLS(); try{ if(ls){ const s=ls.getItem(key); if(s!=null) return JSON.parse(s); } }catch(e){}; return MEM.store[key]; }
function _save(key, val){ const ls=_getLS(); try{ if(ls){ ls.setItem(key, JSON.stringify(val)); return; } }catch(e){}; MEM.store[key]=val; }
function load(key, def){ const v=_load(key); return (v===undefined? def : v); }
function save(key, val){ _save(key, val); }

function getDB(){ const db=load("rsd_db_v6", { users:{} }); if(!db.users) db.users={}; return db; }
function setDB(db){ save("rsd_db_v6", db); }
function currentUser(){ return load("rsd_current_v6", null); }
function setCurrentUser(u){ save("rsd_current_v6", u); }

/** Auth (demo only; plaintext) **/
function registerUser(username, password){
  const db=getDB(); if(db.users[username]) return { ok:false, error:"บัญชีนี้มีอยู่แล้ว" };
  db.users[username] = { password, profile:{ tier:1, stars:0 }, stats:{ dodge:{ bestTimeMs:0, bestScore:0 } } };
  setDB(db); return { ok:true };
}
function loginUser(username, password){
  const db=getDB(); const u=db.users[username];
  if(!u || u.password!==password) return { ok:false, error:"ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง" };
  setCurrentUser(username); return { ok:true };
}
function getUser(name){ const db=getDB(); return db.users[name]||null; }
function updateUser(name, fn){ const db=getDB(); const u=db.users[name]; if(!u) return; fn(u); db.users[name]=u; setDB(db); }

/** Leaderboard **/
function leaderboard(){
  const db=getDB();
  const rows = Object.entries(db.users).map(([name,u])=>({ name, tier:u.profile.tier, stars:u.profile.stars,
    bestTimeMs:u.stats.dodge.bestTimeMs||0, bestScore:u.stats.dodge.bestScore||0 }));
  rows.sort((a,b)=>{
    if(b.tier!==a.tier) return b.tier-a.tier;
    if(b.stars!==a.stars) return b.stars-a.stars;
    if(b.bestTimeMs!==a.bestTimeMs) return b.bestTimeMs-a.bestTimeMs;
    return b.bestScore-a.bestScore;
  });
  return rows.slice(0,50);
}

function Stars(n){ return "⭐".repeat(Math.max(0,n)); }

/** Boot-safe error pane */
window.addEventListener("error", e => {
  const pane=document.createElement("div");
  pane.className="card";
  pane.style.maxWidth="640px"; pane.style.margin="24px auto";
  pane.innerHTML = `<div class="h1">เกิดข้อผิดพลาด</div><div class="sep"></div><div class="notice error">${e.message}<br>${e.filename}:${e.lineno}</div>`;
  view.innerHTML=""; view.appendChild(pane);
});

/** Attach handlers to inline login (fallback) */
function attachLoginHandlers(){
  const btnLogin = $("#btn-login");
  const btnReg   = $("#btn-reg");
  const msgLogin = $("#msg-login");
  const msgReg   = $("#msg-reg");
  if(btnLogin){
    btnLogin.onclick = ()=>{
      const u=$("#login-user").value.trim(), p=$("#login-pass").value;
      const r=loginUser(u,p);
      if(!r.ok){ msgLogin.className="notice error"; msgLogin.textContent=r.error; return; }
      renderHome();
    };
  }
  if(btnReg){
    btnReg.onclick = ()=>{
      const u=$("#reg-user").value.trim(), p=$("#reg-pass").value;
      if(!u||!p){ msgReg.className="notice error"; msgReg.textContent="กรุณากรอกชื่อบัญชีและรหัสผ่าน"; return; }
      const r=registerUser(u,p);
      if(!r.ok){ msgReg.className="notice error"; msgReg.textContent=r.error; return; }
      msgReg.className="notice success"; msgReg.textContent="สมัครสำเร็จ! ล็อกอินได้ด้านบน";
    };
  }
}

/** Screens **/
function renderNav(){
  const user=currentUser();
  nav.innerHTML="";
  if(user){
    const badge=document.createElement("span"); badge.className="badge"; badge.textContent="👤 "+user; nav.appendChild(badge);
    const aHome=document.createElement("a"); aHome.href="javascript:void(0)"; aHome.textContent="หน้าแรก"; aHome.onclick=renderHome; nav.appendChild(aHome);
    const aLB=document.createElement("a"); aLB.href="javascript:void(0)"; aLB.textContent="จัดอันดับ"; aLB.onclick=renderLeaderboard; nav.appendChild(aLB);
    const btn=document.createElement("button"); btn.textContent="ออกจากระบบ"; btn.onclick=()=>{ setCurrentUser(null); renderLogin(); }; nav.appendChild(btn);
  }else{
    const aLogin=document.createElement("a"); aLogin.href="javascript:void(0)"; aLogin.textContent="เข้าสู่ระบบ"; aLogin.onclick=renderLogin; nav.appendChild(aLogin);
  }
}

function renderLogin(){
  renderNav();
  view.innerHTML = `
  <div class="grid" style="max-width:520px;margin:24px auto;">
    <div class="card">
      <div class="h1">เข้าสู่ระบบ</div>
      <div class="sep"></div>
      <div class="grid">
        <div id="msg-login"></div>
        <input id="login-user" class="input" placeholder="ชื่อบัญชี" />
        <input id="login-pass" class="input" placeholder="รหัสผ่าน" type="password" />
        <button id="btn-login" class="btn primary">เข้าสู่ระบบ</button>
      </div>
      <div class="sep"></div>
      <div class="help">ยังไม่พบบัญชี? ลงทะเบียนด้านล่าง</div>
    </div>
    <div class="card">
      <div class="h1">สร้างบัญชีใหม่</div>
      <div class="sep"></div>
      <div class="grid">
        <div id="msg-reg"></div>
        <input id="reg-user" class="input" placeholder="ตั้งชื่อบัญชี" />
        <input id="reg-pass" class="input" placeholder="ตั้งรหัสผ่าน" type="password" />
        <button id="btn-reg" class="btn">สมัครสมาชิก</button>
      </div>
      <div class="sep"></div>
      <div class="help">* ข้อมูลเก็บในเบราว์เซอร์ (หรือในหน่วยความจำ ถ้าเบราว์เซอร์ไม่อนุญาต)</div>
    </div>
  </div>`;
  attachLoginHandlers();
}

function renderHome(){
  const user=currentUser(); if(!user){ return renderLogin(); }
  const u=getUser(user);
  renderNav();
  view.innerHTML = `
  <div class="grid" style="gap:16px;">
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div>
          <div class="h1">สวัสดี, ${user}</div>
          <div class="help">แรงค์ปัจจุบัน: <span class="rank-pill">Tier ${u.profile.tier} • ${Stars(u.profile.stars)}${u.profile.tier<3?" / ⭐⭐⭐":""}</span></div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn" id="btn-devinfo">เกี่ยวกับนักพัฒนา</button>
        </div>
      </div>
      <div class="sep"></div>
      <div class="grid grid-2">
        <button class="btn primary" id="btn-play-general">เล่นโหมดทั่วไป</button>
        <button class="btn" id="btn-play-ranked">เล่นโหมดแรงค์</button>
      </div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="h2">สถิติของฉัน (Dodge)</div>
        <div class="sep"></div>
        <div class="badge">Best time: <b>${(u.stats.dodge.bestTimeMs/1000|0)}s</b></div>
        <div class="badge">Best score: <b>${u.stats.dodge.bestScore}</b></div>
      </div>
      <div class="card">
        <div class="h2">จัดอันดับ</div>
        <div class="sep"></div>
        <a class="btn" id="btn-lb">เปิดตารางอันดับ</a>
      </div>
    </div>

    <!-- Developer Info Modal -->
    <div class="modal" id="devinfo-modal" aria-hidden="true">
      <div class="card" style="position:relative;">
        <button class="close" id="devinfo-close">ปิด</button>
        <div class="h1">ข้อมูลนักพัฒนา</div>
        <div class="help">รายละเอียดเกี่ยวกับที่มาของโปรเจกต์นี้</div>
        <div class="sep"></div>
        <div class="section">เหตุผลการพัฒนา</div>
        <div class="notice">สวัสดีครับ วันนี้ผมอยากมาเล่าโปรเจกต์เกมที่เราพัฒนากันขึ้นมา ตัวเกมจะเป็นแนวจราจร มุมมองจากด้านบน ผู้เล่นจะได้ควบคุมรถแล้วคอยหลบสิ่งกีดขวางที่โผล่มาเรื่อย ๆ เหมือนเรากำลังขับรถอยู่ในสถานการณ์จริง เราเลือกทำเกมแบบนี้ เพราะบนท้องถนนจริง เหตุการณ์ไม่คาดคิดเกิดขึ้นได้ตลอด เช่น มีสิ่งกีดขวางกะทันหัน หรือรถคันอื่นเปลี่ยนเลน เกมนี้ก็เลยถูกออกแบบมาเพื่อฝึกไหวพริบ การตัดสินใจ และสมาธิของผู้เล่น ให้ได้ลองซ้อมสถานการณ์เหล่านี้ในแบบที่สนุก ปลอดภัย และไม่มีความเสี่ยงเหมือนในชีวิตจริง สำหรับคนเล่นก็จะได้ฝึกการตอบสนองที่ไวขึ้น ส่วนทีมพัฒนาก็ได้ฝึกเขียนโค้ด ออกแบบเกม และฝึกเขียนโค้ดร่วมกับ Ai ซึ่งทั้งหมดนี้เราหวังว่าจะทำให้เกมนี้ทั้งสนุกและมีประโยชน์ไปพร้อมกัน</div>
        <div class="section">ผู้พัฒนา</div>
        <div class="notice"><span class="placeholder">* รอใส่ชื่อผู้พัฒนา</span></div>
      </div>
    </div>
  </div>`;
  $("#btn-play-general").onclick=()=> renderGeneralSelect();
  $("#btn-play-ranked").onclick=()=> renderRankedIntro();
  $("#btn-lb").onclick=()=> renderLeaderboard();
  const modal=$("#devinfo-modal"), btn=$("#btn-devinfo"), close=$("#devinfo-close");
  btn.onclick=()=>{ modal.classList.add("show"); modal.setAttribute("aria-hidden","false"); };
  close.onclick=()=>{ modal.classList.remove("show"); modal.setAttribute("aria-hidden","true"); };
  modal.addEventListener("click", e=>{ if(e.target===modal){ modal.classList.remove("show"); modal.setAttribute("aria-hidden","true"); } });
}

function renderLeaderboard(){
  renderNav();
  const rows=leaderboard();
  view.innerHTML = `
  <div class="card">
    <div class="h1">ตารางจัดอันดับ (ภายในอุปกรณ์)</div>
    <div class="sep"></div>
    <table class="table">
      <thead><tr><th>#</th><th>ผู้เล่น</th><th>Tier</th><th>Stars</th><th>Best Time</th><th>Best Score</th></tr></thead>
      <tbody id="lb-body"></tbody>
    </table>
    <div class="sep"></div>
    <a class="btn" id="btn-back-home">กลับหน้าแรก</a>
  </div>`;
  const body=$("#lb-body");
  body.innerHTML = rows.map((r,i)=>`<tr>
    <td>${i+1}</td><td>${r.name}</td><td>Tier ${r.tier}</td><td>${Stars(r.stars)}</td>
    <td>${r.bestTimeMs? (r.bestTimeMs/1000).toFixed(1)+'s':'-'}</td><td>${r.bestScore}</td></tr>`).join("");
  $("#btn-back-home").onclick=renderHome;
}

function renderGeneralSelect(){
  const user=currentUser(); if(!user){ return renderLogin(); }
  renderNav();
  view.innerHTML = `
    <div class="card">
      <div class="h1">โหมดทั่วไป — เลือกระดับความยาก</div>
      <div class="sep"></div>
      <div class="grid grid-2">
        <button class="btn" id="g-easy">ง่าย</button>
        <button class="btn" id="g-medium">ปานกลาง</button>
        <button class="btn" id="g-hard">ยาก</button>
        <button class="btn danger" id="g-hell">นรก 🔥</button>
      </div>
      <div class="sep"></div>
      <div class="help">* นรก: ยากมากแต่ยังมีโอกาสชนะ</div>
      <div class="sep"></div>
      <a class="btn" id="btn-back">กลับหน้าแรก</a>
    </div>`;
  $("#g-easy").onclick   = ()=> startGame({ mode:"general", diff:"easy" });
  $("#g-medium").onclick = ()=> startGame({ mode:"general", diff:"medium" });
  $("#g-hard").onclick   = ()=> startGame({ mode:"general", diff:"hard" });
  $("#g-hell").onclick   = ()=> startGame({ mode:"general", diff:"hell" });
  $("#btn-back").onclick = renderHome;
}

function renderRankedIntro(){
  const user=currentUser(); if(!user){ return renderLogin(); }
  const u=getUser(user);
  const tier = u.profile.tier;
  const stars = u.profile.stars;
  const cfg = tierCfg(tier);
  renderNav();
  view.innerHTML = `
    <div class="card" style="max-width:760px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <div class="h1">โหมดแรงค์</div>
          <div class="help">แรงค์ปัจจุบันของคุณ & คู่มืออย่างย่อ</div>
        </div>
        <a class="btn" id="btn-back-home2">กลับหน้าแรก</a>
      </div>
      <div class="sep"></div>

      <div class="tabs">
        <div class="tab active" id="tab-overview">ภาพรวม</div>
        <div class="tab" id="tab-help">ช่วยเหลือ</div>
      </div>

      <div class="tabpanes">
        <div class="pane active" id="pane-overview">
          <div class="grid">
            <div class="badge">Tier: <b>Tier ${tier}</b></div>
            <div class="badge">Stars: <b>${"⭐".repeat(stars)}${tier<3?" / ⭐⭐⭐":""}</b></div>
            <div class="badge">เป้าหมาย: <b>${cfg.label}</b></div>
          </div>
          <div class="sep"></div>
          <div class="grid grid-2">
            <div class="note">ชนะหนึ่งครั้ง = +1 ดาว (Tier1–2 ครบ 3 ดาว ⇒ เลื่อน Tier, Tier3 สะสมดาวได้ไม่จำกัด)</div>
            <div class="note">พารามิเตอร์ความยาก: ความเร็วพื้นฐาน ~ ${cfg.speed}px/s, อัตราเกิด ~ ${cfg.spawnMs} ms, เพิ่มความเร็ว ~ ${cfg.accel}/s</div>
          </div>
          <div class="sep"></div>
          <div class="center">
            <button class="btn primary" id="btn-start-ranked">เริ่มเกม</button>
          </div>
        </div>

        <div class="pane" id="pane-help">
          <div class="grid">
            <div class="h2">วิธีเล่นโหมดแรงค์</div>
            <ul>
              <li>ควบคุมรถด้วยปุ่ม <b>←/→</b> หรือปุ่มบนจอ</li>
              <li>สิ่งกีดขวางมาเป็นคลื่น สุ่มแนวนอน แต่มีช่องให้ลอดเสมอ</li>
              <li>อยู่รอดให้ถึงเวลาเป้าหมายของ Tier เพื่อชนะ</li>
            </ul>
            <div class="h2">กติกาแรงค์ & ดาว</div>
            <ul>
              <li>ชนะ 1 ครั้ง = +1 ดาว</li>
              <li>Tier 1–2: ครบ 3 ดาว ⇒ เลื่อน Tier</li>
              <li>Tier 3: ดาวสะสมได้ไม่จำกัด</li>
            </ul>
            <div class="h2">ทริค</div>
            <ul>
              <li>เล็งช่องตั้งแต่ต้นคลื่นและไหลตามช่องนั้น</li>
              <li>เผื่อระยะกับรถบรรทุก เพราะยาวและบังนาน</li>
            </ul>
          </div>
          <div class="sep"></div>
          <div class="center"><button class="btn primary" id="btn-start-ranked-help">เริ่มเกม</button></div>
        </div>
      </div>
    </div>`;
  $("#btn-back-home2").onclick=renderHome;
  const tOver=$("#tab-overview"), tHelp=$("#tab-help"), pOver=$("#pane-overview"), pHelp=$("#pane-help");
  function act(tab){ tOver.classList.toggle("active", tab==="over"); tHelp.classList.toggle("active", tab==="help"); pOver.classList.toggle("active", tab==="over"); pHelp.classList.toggle("active", tab==="help"); }
  tOver.onclick=()=>act("over");
  tHelp.onclick=()=>act("help");
  $("#btn-start-ranked").onclick=()=> startGame({ mode:"ranked" });
  $("#btn-start-ranked-help").onclick=()=> startGame({ mode:"ranked" });
}

/** Sprites **/
function makeSprites(){
  const mk = (w,h,draw)=>{ const c=document.createElement("canvas"); c.width=w; c.height=h; const g=c.getContext("2d"); g.imageSmoothingEnabled=false; draw(g); return c; };
  const truck = mk(32,48, g=>{
    g.fillStyle="#3b3b3b"; g.fillRect(0,0,32,48);
    g.fillStyle="#8b5cf6"; g.fillRect(2,2,28,44);
    g.fillStyle="#0f172a"; g.fillRect(2,38,6,6); g.fillRect(24,38,6,6);
    g.fillStyle="#93c5fd"; g.fillRect(6,6,20,10);
    g.fillStyle="#a78bfa"; g.fillRect(4,18,24,18);
    g.fillStyle="#f59e0b"; g.fillRect(12,40,8,4);
  });
  const tree = mk(32,32, g=>{
    g.fillStyle="#0b3d2d"; g.fillRect(10,20,12,10);
    g.fillStyle="#115e3b"; g.fillRect(8,8,16,16);
    g.fillStyle="#22c55e"; g.fillRect(6,10,20,12);
    g.fillStyle="#6b421c"; g.fillRect(12,20,8,10);
  });
  const sign = mk(20,28, g=>{
    g.fillStyle="#0f172a"; g.fillRect(0,0,20,28);
    g.fillStyle="#fef3c7"; g.fillRect(2,2,16,16);
    g.fillStyle="#111827"; g.fillRect(9,18,2,8);
    g.fillStyle="#ef4444"; g.fillRect(6,6,8,8);
  });
  return { truck, tree, sign };
}
const SPRITE_META = {
  truck: { drawW:32, drawH:48, hitW:26, hitH:44 },
  tree:  { drawW:32, drawH:32, hitW:24, hitH:28 },
  sign:  { drawW:20, drawH:28, hitW:16, hitH:26 },
};

/** Game **/
let raf=0;
function startGame({ mode, diff }){
  const user=currentUser(); if(!user){ return renderLogin(); }
  const u=getUser(user);
  const tier = (mode==="ranked" ? u.profile.tier : 1);
  const cfg = (mode==="ranked" ? tierCfg(tier) : generalCfg(diff||"easy"));

  renderNav();
  view.innerHTML = `
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div class="h1">${mode==="ranked"?"โหมดแรงค์":"โหมดทั่วไป"} — Dodge</div>
        <div class="help">${mode==="ranked" ? "เป้า: อยู่รอด Tier "+tier+" • "+cfg.label : "โหมดทั่วไป • "+cfg.label}</div>
      </div>
      <div>
        <button class="btn" id="btn-mute">ปิด/เปิดเสียง</button>
        <a class="btn" id="btn-exit">ออกเกม</a>
      </div>
    </div>
    <div class="sep"></div>
    <div class="canvas-wrap">
      <div id="overlay" class="overlay">3</div>
      <div class="hud">
        <div class="pill">Tier ${tier} ${mode==="ranked" ? "• "+Stars(u.profile.stars)+(tier<3?" / ⭐⭐⭐":"" ):""}</div>
        <div class="pill" id="hud">เวลา 0.0s • คะแนน 0</div>
      </div>
      <canvas id="game" width="960" height="540"></canvas>
      <div class="ctrls">
        <button id="btn-left">⟵</button>
        <button id="btn-right">⟶</button>
      </div>
    </div>
  </div>`;

  $("#btn-exit").onclick=renderHome;

  const cvs=document.getElementById("game"), ctx=cvs.getContext("2d");
  const sWin=document.getElementById("sfx-win"), sLose=document.getElementById("sfx-lose"), sClick=document.getElementById("sfx-click");
  let muted=false; document.getElementById("btn-mute").onclick=()=>{ muted=!muted; [sWin,sLose,sClick].forEach(a=>a.muted=muted); };
  const keys=new Set();
  document.getElementById("btn-left").ontouchstart=()=>keys.add("ArrowLeft"); document.getElementById("btn-left").ontouchend=()=>keys.delete("ArrowLeft");
  document.getElementById("btn-right").ontouchstart=()=>keys.add("ArrowRight"); document.getElementById("btn-right").ontouchend=()=>keys.delete("ArrowRight");
  window.onkeydown = e=>{ if(["ArrowLeft","ArrowRight","a","d","A","D"].includes(e.key)) e.preventDefault(); keys.add(e.key); };
  window.onkeyup = e=>{ keys.delete(e.key); };

  const SPRITES = makeSprites();
  const overlay=document.getElementById("overlay");

  const state = {
    active:false, over:false,
    t0: performance.now(), t:0, score:0,
    car:{ x:cvs.width/2, y:cvs.height-72, w:26, h:40, vx:0 },
    obs:[], lastSpawn:0, spawnMs: cfg.spawnMs,
    baseSpeed: cfg.speed, accel: cfg.accel,
    mode, tier
  };

  // Countdown
  let count=3;
  const timer=setInterval(()=>{
    count--; overlay.textContent = count>0? String(count): "Start";
    if(count<=0){ clearInterval(timer); setTimeout(()=>{ overlay.remove(); state.active=true; }, 400); }
  },1000);

  function max1(v){ return Math.max(1, v); }
  function spawnWave(){
    const margin = 120;
    const roadW = cvs.width - margin*2;
    const carW = state.car.w;
    const gapMin = Math.max(48, Math.floor(carW * 1.8));
    const baseCount = 2;
    const extra = (state.baseSpeed > 220 ? 1 : 0) + (state.baseSpeed > 260 ? 1 : 0);
    const pieces = Math.min(6, baseCount + extra) + 1;
    const gapIndex = Math.floor(Math.random() * pieces);
    let xCursor = margin;
    const yStart = -40;

    for(let i=0;i<pieces;i++){
      const remain = margin + roadW - xCursor;
      const avg = Math.max(40, Math.floor(remain / (pieces - i)));
      const jitter = Math.floor(avg * 0.35);
      let segW = Math.max(30, Math.min(remain - (pieces-i-1)*30, avg + (Math.random()*2-1)*jitter));
      if(i===gapIndex){ segW = Math.max(segW, gapMin); xCursor += segW; continue; }
      const r = Math.random();
      const type = r < 0.45 ? "truck" : (r < 0.75 ? "tree" : "sign");
      const meta = SPRITE_META[type];
      const occW = meta.hitW;
      const pad = 6;
      const xMin = xCursor + pad;
      const xMax = xCursor + Math.max(pad, segW - occW - pad);
      const x = Math.max(margin, Math.min(margin + roadW - occW, Math.floor(xMin + Math.random() * max1(xMax - xMin))));
      state.obs.push({ type, x, y: yStart - Math.floor(Math.random()*18), w: meta.hitW, h: meta.hitH, drawW: meta.drawW, drawH: meta.drawH });
      xCursor += segW;
    }
  }

  function update(dt){
    if(state.over || !state.active) return;
    state.t += dt; state.score += dt*0.01;
    let vx=0; const mv=240;
    if(keys.has("ArrowLeft")||keys.has("a")||keys.has("A")) vx=-mv;
    if(keys.has("ArrowRight")||keys.has("d")||keys.has("D")) vx=mv;
    state.car.x = Math.max(110, Math.min(cvs.width-110, state.car.x + vx*dt/1000));

    const now=performance.now();
    if(now - state.lastSpawn >= state.spawnMs + ((Math.random()-0.5)*120)){ state.lastSpawn=now; spawnWave(); }
    const spd = state.baseSpeed + state.accel*(state.t/1000);
    for(const o of state.obs){ o.y += spd*dt/1000; }
    state.obs = state.obs.filter(o=>o.y < cvs.height+60);

    for(const o of state.obs){ if(hit(state.car,o)){ end(false); return; } }
    if(state.t >= cfg.targetMs){ end(true); return; }
    $("#hud").textContent = `เวลา ${(state.t/1000).toFixed(1)}s • คะแนน ${Math.floor(state.score)}`;
  }

  function hit(a,b){ return !(a.x+a.w < b.x || a.x > b.x+b.w || a.y+a.h < b.y || a.y > b.y+b.h); }

  function draw(){
    const ctx=cvs.getContext("2d");
    ctx.fillStyle="#0b1220"; ctx.fillRect(0,0,cvs.width,cvs.height);
    for(let i=0;i<5;i++){ const x=((i*180 + (state.t*0.12))%(cvs.width+220))-220; cloud(Math.round(x), 80+(i%2?-14:12)); }
    const margin=100, roadW=cvs.width-margin*2;
    ctx.fillStyle="#1f3323"; ctx.fillRect(0,0,cvs.width,cvs.height);
    ctx.fillStyle="black"; ctx.fillRect(margin-10,0,roadW+20,cvs.height);
    ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--road') || "#263541";
    ctx.fillRect(margin,0,roadW,cvs.height);
    ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--lane') || "#facc15";
    const d=14,g=18, offset= - ((state.t*0.18)%(d+g));
    for(let l=1;l<3;l++){ const x=Math.round(margin + l*(roadW/3)); for(let y=offset;y<cvs.height;y+=d+g){ ctx.fillRect(x-2,y,d,4);}}
    drawCar(ctx, state.car.x, state.car.y, state.car.w, state.car.h, "#22c55e");
    for(const o of state.obs){
      const sp=makeSprites()[o.type];
      if(sp){ ctx.imageSmoothingEnabled=false; ctx.drawImage(sp, Math.round(o.x - (o.drawW - o.w)/2), Math.round(o.y - (o.drawH - o.h)/2), o.drawW, o.drawH); }
      else{ ctx.fillStyle="#ef4444"; ctx.fillRect(o.x,o.y,o.w,o.h); }
    }
    ctx.fillStyle="#1b2c20"; ctx.fillRect(0,0,cvs.width,26); ctx.fillRect(0,cvs.height-26,cvs.width,26);
  }
  function cloud(x,y){ const g=cvs.getContext("2d"); g.fillStyle="#fff"; for(let i=0;i<6;i++){ g.fillRect(x+i*12,y,12,8); g.fillRect(x+i*12,y+8,12,8);} g.fillRect(x+12,y-8,48,8); }
  function drawCar(ctx,x,y,w,h,color){ x=Math.round(x); y=Math.round(y); ctx.save(); ctx.translate(x-w/2,y-h/2);
    ctx.fillStyle="#0b3d2d"; ctx.fillRect(1,1,w-2,h-2); ctx.fillStyle=color; ctx.fillRect(2,2,w-4,h-4);
    ctx.fillStyle="#0f172a"; ctx.fillRect(2,h-6,6,4); ctx.fillRect(w-8,h-6,6,4);
    ctx.fillStyle="#93c5fd"; ctx.fillRect(w/2-4,2,8,6); ctx.restore(); }

  function end(win){
    if(state.over) return; state.over=true; cancelAnimationFrame(raf); window.onkeydown=null; window.onkeyup=null;
    if(!muted) (win?sWin:sLose).play();
    const secs=(state.t/1000).toFixed(1), score=Math.floor(state.score);
    updateUser(user, u=>{
      u.stats.dodge.bestTimeMs = Math.max(u.stats.dodge.bestTimeMs||0, Math.floor(state.t));
      u.stats.dodge.bestScore  = Math.max(u.stats.dodge.bestScore||0, score);
      if(mode==="ranked" && win){
        if(u.profile.tier<3){
          let stars=u.profile.stars+1, tierNow=u.profile.tier;
          if(stars>=3){ tierNow=Math.min(3,tierNow+1); stars=(tierNow===3?0:0); }
          u.profile.tier=tierNow; u.profile.stars=stars;
        }else{ u.profile.stars=(u.profile.stars||0)+1; }
      }
    });
    const snap=getUser(user).profile;
    renderNav();
    view.innerHTML = `
    <div class="card center" style="max-width:560px;margin:0 auto;">
      <div class="h1 ${win?'win':'lose'}">${win? "ผ่านเป้าหมาย!":"ชนแล้ว!"}</div>
      <div class="sep"></div>
      <div class="badge">เวลา: <b>${secs}s</b></div>
      <div class="badge">คะแนน: <b>${score}</b></div>
      <div class="badge">โหมด: <b>${mode}</b></div>
      <div class="badge">Tier: <b>${state.tier}</b></div>
      ${mode==="ranked" && win ? `<div class="sep"></div><div class="note">แรงค์ตอนนี้: <b>Tier ${snap.tier}</b> • ${Stars(snap.stars)}${snap.tier<3?" / ⭐⭐⭐":""}</div>`:""}
      <div class="sep"></div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn primary" id="btn-retry">เล่นอีกครั้ง</button>
        <a class="btn" id="btn-home2">กลับหน้าแรก</a>
        <a class="btn" id="btn-lb2">ดูอันดับ</a>
      </div>
    </div>`;
    $("#btn-retry").onclick=()=>startGame({ mode, diff });
    $("#btn-home2").onclick=renderHome;
    $("#btn-lb2").onclick=renderLeaderboard;
  }

  let last=performance.now();
  function frame(now){ const dt=now-last; last=now; update(dt); draw(); raf=requestAnimationFrame(frame); }
  raf=requestAnimationFrame(frame);
}

function tierCfg(t){
  if(t===1) return { targetMs: 25000, spawnMs: 700, speed: 180, accel: 8,  label:"อยู่รอด ≥ 25s" };
  if(t===2) return { targetMs: 30000, spawnMs: 620, speed: 210, accel: 10, label:"อยู่รอด ≥ 30s" };
  return        { targetMs: 35000, spawnMs: 540, speed: 240, accel: 12, label:"อยู่รอด ≥ 35s" };
}
function generalCfg(diff){
  if(diff==="easy")   return { targetMs: 15000, spawnMs: 820, speed: 160, accel: 6,  label:"อยู่รอด ≥ 15s" };
  if(diff==="medium") return { targetMs: 25000, spawnMs: 680, speed: 190, accel: 9,  label:"อยู่รอด ≥ 25s" };
  if(diff==="hard")   return { targetMs: 35000, spawnMs: 540, speed: 230, accel: 12, label:"อยู่รอด ≥ 35s" };
  return              { targetMs: 60000, spawnMs: 380, speed: 320, accel: 22, label:"อยู่รอด ≥ 60s (โหดสุด)" };
}

/** Boot: render login immediately and attach handlers (no hash/router needed) */
document.addEventListener("DOMContentLoaded", ()=>{
  renderLogin();
});
})(); // IIFE
