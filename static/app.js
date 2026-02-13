// ======================
// Query params
// ======================
let timeScale = 1; // for "time stop"
function qp(name){
  const u = new URL(location.href);
  return u.searchParams.get(name) || "";
}
const NAME = decodeURIComponent(qp("name") || "❤️");
const CUSTOM = decodeURIComponent(qp("text") || "").trim();
document.getElementById("name").textContent = NAME;

// ======================
// Modal helpers
// ======================
const modal = document.getElementById("modal");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");

function openModal(text){
  modalText.textContent = text;
  modal.classList.remove("hidden");
}
function closeModal(){
  modal.classList.add("hidden");
}
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e)=>{ if(e.target === modal) closeModal(); });

// ======================
// DPR
// ======================
let dpr = 1;

// ======================
// Stars canvas (starry sky)
// ======================
const stars = document.getElementById("stars");
const sctx2 = stars.getContext("2d");
let starField = [];
let starsReady = false;
let skyIntensity = 0.35; // stronger in final
let ourStar = null;      // special star

function resizeStars(){
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  stars.width = Math.floor(innerWidth * dpr);
  stars.height = Math.floor(innerHeight * dpr);
  stars.style.width = innerWidth + "px";
  stars.style.height = innerHeight + "px";

  // create stars
  const count = Math.floor((innerWidth * innerHeight) / 9000);
  starField = new Array(count).fill(0).map(() => ({
    x: Math.random()*stars.width,
    y: Math.random()*stars.height,
    r: (0.7 + Math.random()*1.8) * dpr,
    a: 0.4 + Math.random()*0.6,
    tw: Math.random()*Math.PI*2,
    sp: 0.003 + Math.random()*0.008
  }));

  // choose "our" star (top-right-ish)
  ourStar = {
    x: stars.width * (0.72 + Math.random()*0.08),
    y: stars.height * (0.18 + Math.random()*0.08),
    r: 3.4 * dpr,
    a: 0.95,
    tw: Math.random()*Math.PI*2,
    sp: 0.01,
    glow: 0
  };

  starsReady = true;
}
resizeStars();

// ======================
// FX canvas: confetti hearts
// ======================
const fx = document.getElementById("fx");
const fctx = fx.getContext("2d");

function resizeFx(){
  fx.width = Math.floor(innerWidth * dpr);
  fx.height = Math.floor(innerHeight * dpr);
  fx.style.width = innerWidth + "px";
  fx.style.height = innerHeight + "px";
}
resizeFx();

// ======================
// BACKGROUND HEARTS (behind letter)
// ======================
let heartsBg = document.getElementById("heartsBg");
if(!heartsBg){
  heartsBg = document.createElement("canvas");
  heartsBg.id = "heartsBg";
  heartsBg.style.position = "fixed";
  heartsBg.style.inset = "0";
  heartsBg.style.zIndex = "0";
  heartsBg.style.pointerEvents = "none";
  document.body.appendChild(heartsBg);
}
const hb = heartsBg.getContext("2d");
let bgHearts = [];
let bgOn = true;

function newBgHeart(){
  const x = Math.random()*heartsBg.width;
  const y = Math.random()*heartsBg.height;
  return {
    x, y,
    s: (0.5 + Math.random()*1.3) * dpr,
    vy: (0.25 + Math.random()*0.8) * dpr,
    vx: (-0.2 + Math.random()*0.4) * dpr,
    rot: Math.random()*Math.PI*2,
    vr: (-0.004 + Math.random()*0.008),
    a: 0.10 + Math.random()*0.18
  };
}
function resizeHeartsBg(){
  heartsBg.width = Math.floor(innerWidth * dpr);
  heartsBg.height = Math.floor(innerHeight * dpr);
  heartsBg.style.width = innerWidth + "px";
  heartsBg.style.height = innerHeight + "px";

  const count = Math.max(18, Math.floor((innerWidth*innerHeight)/42000));
  bgHearts = new Array(count).fill(0).map(() => newBgHeart());
}
resizeHeartsBg();

function drawTinyHeart(ctx, x,y,scale,rot,alpha){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.bezierCurveTo(0, 2, -7, 2, -7, -2);
  ctx.bezierCurveTo(-7, -7, -2, -9, 0, -5);
  ctx.bezierCurveTo(2, -9, 7, -7, 7, -2);
  ctx.bezierCurveTo(7, 2, 0, 2, 0, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function heartsBgTick(){
  hb.clearRect(0,0,heartsBg.width,heartsBg.height);

  if(!bgOn){
    requestAnimationFrame(heartsBgTick);
    return;
  }

  const dawn = document.body.classList.contains("dawn");
  hb.fillStyle = dawn ? "rgba(255,210,122,.9)" : "rgba(255,77,166,.95)";

  for(const h of bgHearts){
    h.y -= h.vy * timeScale;
    h.x += h.vx * timeScale;
    h.rot += h.vr * timeScale;

    if(h.y < -40*dpr) { h.y = heartsBg.height + 40*dpr; h.x = Math.random()*heartsBg.width; }
    if(h.x < -60*dpr) { h.x = heartsBg.width + 60*dpr; }
    if(h.x > heartsBg.width + 60*dpr) { h.x = -60*dpr; }

    const alpha = h.a * (0.75 + Math.sin((h.y+h.x)*0.003)*0.25);
    drawTinyHeart(hb, h.x, h.y, h.s, h.rot, alpha);
  }

  hb.globalAlpha = 1;
  requestAnimationFrame(heartsBgTick);
}
heartsBgTick();

// ======================
// Resize handler (SAFE)
// ======================
window.addEventListener("resize", () => {
  resizeStars();
  resizeFx();
  resizeHeartsBg();
});

// ======================
// CONFETTI SYSTEM
// ======================
const pieces = [];

let quietMode = false;

function spawnBurst(x, y, count=160){
  if(quietMode) count = Math.floor(count*0.35);
  for(let i=0;i<count;i++){
    const a = Math.random()*Math.PI*2;
    const sp = 2 + Math.random()*6;
    pieces.push({
      x, y,
      vx: Math.cos(a)*sp,
      vy: Math.sin(a)*sp - (2+Math.random()*2),
      g: 0.12 + Math.random()*0.16,
      r: 6 + Math.random()*10,
      rot: Math.random()*Math.PI,
      vr: (-0.12 + Math.random()*0.24),
      life: 180 + Math.random()*110,
      t: 0,
      kind: Math.random() < 0.85 ? "heart" : "spark"
    });
  }
}

function drawHeart(x,y,s,rot){
  fctx.save();
  fctx.translate(x,y);
  fctx.rotate(rot);
  fctx.scale(s,s);
  fctx.beginPath();
  fctx.moveTo(0, 0.35);
  fctx.bezierCurveTo(0, 0.12, -0.35, 0.12, -0.35, -0.10);
  fctx.bezierCurveTo(-0.35, -0.32, -0.12, -0.42, 0, -0.25);
  fctx.bezierCurveTo(0.12, -0.42, 0.35, -0.32, 0.35, -0.10);
  fctx.bezierCurveTo(0.35, 0.12, 0, 0.12, 0, 0.35);
  fctx.closePath();
  fctx.fill();
  fctx.restore();
}

function fxTick(){
  fctx.clearRect(0,0,fx.width,fx.height);

  for(let i=pieces.length-1;i>=0;i--){
    const p = pieces[i];
    p.t += 1 * timeScale;

    p.vy += p.g * timeScale;
    p.x += p.vx * timeScale;
    p.y += p.vy * timeScale;
    p.rot += p.vr * timeScale;

    const alpha = Math.max(0, 1 - (p.t / p.life));
    if(alpha <= 0){ pieces.splice(i,1); continue; }

    fctx.globalAlpha = alpha * (quietMode ? 0.45 : 1);
    if(p.kind === "heart"){
      const hue = 330 + Math.sin((p.t+p.x)*0.02)*12;
      fctx.fillStyle = `hsla(${hue}, 92%, 66%, ${alpha})`;
      drawHeart(p.x, p.y, p.r * dpr * 0.06, p.rot);
    } else {
      fctx.fillStyle = `rgba(255,210,122,${alpha})`;
      fctx.beginPath();
      fctx.arc(p.x, p.y, p.r*dpr*0.05, 0, Math.PI*2);
      fctx.fill();
    }
  }
  fctx.globalAlpha = 1;
  requestAnimationFrame(fxTick);
}
fxTick();

function burstFromElement(el, count=160){
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width/2) * dpr;
  const y = (r.top + r.height/2) * dpr;
  spawnBurst(x,y,count);
}

// ======================
// Music (manual)
// ======================
const musicBtn = document.getElementById("musicBtn");
const musicLabel = document.getElementById("musicLabel");
const music = document.getElementById("music");
let playing = false;

musicBtn.addEventListener("click", async () => {
  try{
    if(!playing){
      await music.play();
      playing = true;
      musicBtn.classList.add("playing");
      musicLabel.textContent = "музыка играет";
    } else {
      music.pause();
      playing = false;
      musicBtn.classList.remove("playing");
      musicLabel.textContent = "включить нашу музыку";
    }
  }catch(e){
    console.log(e);
    musicLabel.textContent = "нажми ещё раз";
  }
});

// ======================
// Scenes
// ======================
const body = document.body;
const sceneEnvelope = document.getElementById("sceneEnvelope");
const sceneLetter = document.getElementById("sceneLetter");
const envelope = document.getElementById("envelope");
const seal = document.getElementById("seal");
const letter = document.getElementById("letter");

// ===== HARD FIX: ensure seal drag always works =====
seal.style.touchAction = "none"; // just in case
seal.style.webkitUserSelect = "none";
seal.style.userSelect = "none";

// Seal swipe (robust)
let dragging = false;
let startX = 0;
let sealX = 0;

function beginSealDrag(e){
  // IMPORTANT: block scroll/pinch and any bubbling
  e.preventDefault();
  e.stopPropagation();

  dragging = true;
  startX = e.clientX;
  sealX = 0;

  // ensure pointer capture when possible
  try { seal.setPointerCapture(e.pointerId); } catch(_){}

  document.body.style.userSelect = "none";
  document.body.style.cursor = "grabbing";
}

function moveSealDrag(e){
  if(!dragging) return;
  e.preventDefault();

  const dx = e.clientX - startX;
  sealX = Math.max(0, Math.min(150, dx));
  seal.style.transform = `translate(calc(-50% + ${sealX}px), -50%)`;

  if(sealX > 120){
    finishSealDrag(true);
  }
}

function finishSealDrag(openIt){
  if(!dragging && !openIt) return;

  dragging = false;
  document.body.style.userSelect = "";
  document.body.style.cursor = "";

  if(openIt){
    seal.classList.add("broken");
    burstFromElement(seal, 220);
    envelope.classList.add("open");

    setTimeout(() => {
      sceneEnvelope.classList.remove("active");
      sceneLetter.classList.add("active");
      spawnBurst(innerWidth*dpr*0.5, innerHeight*dpr*0.18, 130);
      window.scrollTo({top:0, behavior:"smooth"});
    }, 950);
  } else {
    sealX = 0;
    seal.style.transform = `translate(-50%, -50%)`;
  }
}

seal.addEventListener("pointerdown", beginSealDrag, {passive:false});
seal.addEventListener("pointermove", moveSealDrag, {passive:false});
seal.addEventListener("pointerup", ()=>finishSealDrag(false), {passive:true});
seal.addEventListener("pointercancel", ()=>finishSealDrag(false), {passive:true});

// страховка: если pointercapture не сработал — двигаем и на window
window.addEventListener("pointermove", moveSealDrag, {passive:false});
window.addEventListener("pointerup", ()=>finishSealDrag(false), {passive:true});
window.addEventListener("pointercancel", ()=>finishSealDrag(false), {passive:true});

// ======================
// Story: typewriter
// ======================
const storyEl = document.getElementById("story");
const tapToContinue = document.getElementById("tapToContinue");

const scratchBlock = document.getElementById("scratchBlock");
const scratchHidden = document.getElementById("scratchHidden");

const miniGame = document.getElementById("miniGame");
const holdReveal = document.getElementById("holdReveal");
const final = document.getElementById("final");

const PARAS = [
  "Я хотел сделать не просто открытку… а письмо, которое оживает у тебя в руках.",
  "И пусть это звучит просто, но это правда: рядом с тобой внутри становится спокойно и тепло.",
  "Я люблю в тебе всё: твою улыбку, твой взгляд, твои маленькие привычки…",
  CUSTOM ? `А самое главное — ${CUSTOM}` : "А самое главное — ты делаешь мой мир ярче. Спасибо, что ты есть ❤️",
  "Есть строка, которую видно только тебе. Сотри туман — и она появится ✨"
];

let step = 0;
let typing = false;
let scratchDone = false;
let gameDone = false;
let finalDone = false;

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function typeParagraph(text){
  const p = document.createElement("p");
  storyEl.appendChild(p);
  typing = true;
  for(let i=0;i<text.length;i++){
    p.textContent += text[i];
    await sleep(18 + Math.random()*18);
  }
  typing = false;
  burstFromElement(letter, 60);
}

letter.addEventListener("click", async (e) => {
  if(e.target.closest("button")) return;
  if(typing) return;

  if(step < PARAS.length){
    await typeParagraph(PARAS[step]);
    step++;

    if(step === PARAS.length){
      tapToContinue.classList.add("hidden");
      scratchHidden.textContent = "Я тебя люблю. Очень. И это письмо — только начало. 💖";
      scratchBlock.classList.remove("hidden");
      initScratch();

      setTimeout(()=> scratchBlock.scrollIntoView({behavior:"smooth", block:"center"}), 350);
    }
  }
});

// ======================
// Пасхалка 1: 7 тапов по штампу
// ======================
const stampBtn = document.getElementById("stampBtn");
const secretBadge = document.getElementById("secretBadge");
let stampTaps = 0;
let lastTapAt = 0;

stampBtn.addEventListener("click", () => {
  const now = Date.now();
  if(now - lastTapAt > 1600) stampTaps = 0;
  lastTapAt = now;
  stampTaps++;

  if(stampTaps === 7){
    secretBadge.classList.remove("hidden");
    spawnBurst(innerWidth*dpr*0.72, innerHeight*dpr*0.12, 160);
    openModal("Ты нашла секрет ❤️\n\nЯ бы выбрал тебя снова. И снова. И снова.");
  }
});

// Пасхалка 2: long-press на подпись
const signature = document.getElementById("signature");
let sigHoldTimer = null;
signature.addEventListener("pointerdown", ()=>{
  sigHoldTimer = setTimeout(()=>{
    openModal("Секрет №2 🤫\n\nЕсли бы мне дали одну фразу навсегда — я бы оставил(а):\n«Я рядом».");
  }, 900);
});
function clearSigHold(){
  if(sigHoldTimer){ clearTimeout(sigHoldTimer); sigHoldTimer = null; }
}
signature.addEventListener("pointerup", clearSigHold);
signature.addEventListener("pointerleave", clearSigHold);
signature.addEventListener("pointercancel", clearSigHold);

// ======================
// Scratch to reveal
// ======================
const scratchCanvas = document.getElementById("scratchCanvas");
const sctx = scratchCanvas.getContext("2d");
let scratched = 0;
let scratching = false;

function resizeScratch(){
  const wrap = scratchCanvas.parentElement.getBoundingClientRect();
  scratchCanvas.width = Math.floor(wrap.width * dpr);
  scratchCanvas.height = Math.floor(wrap.height * dpr);
  scratchCanvas.style.width = wrap.width + "px";
  scratchCanvas.style.height = wrap.height + "px";
}
function paintFog(){
  sctx.clearRect(0,0,scratchCanvas.width,scratchCanvas.height);
  const g = sctx.createLinearGradient(0,0,scratchCanvas.width,scratchCanvas.height);
  g.addColorStop(0, "rgba(255,255,255,0.30)");
  g.addColorStop(0.5, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0.26)");
  sctx.fillStyle = g;
  sctx.fillRect(0,0,scratchCanvas.width,scratchCanvas.height);

  sctx.globalAlpha = 0.35;
  for(let i=0;i<900;i++){
    const x = Math.random()*scratchCanvas.width;
    const y = Math.random()*scratchCanvas.height;
    const r = Math.random()*1.8*dpr;
    sctx.fillStyle = "rgba(255,255,255,0.22)";
    sctx.beginPath(); sctx.arc(x,y,r,0,Math.PI*2); sctx.fill();
  }
  sctx.globalAlpha = 1;
}
function initScratch(){
  resizeScratch();
  paintFog();
  scratched = 0;

  scratchCanvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    scratching = true;
    try { scratchCanvas.setPointerCapture(e.pointerId); } catch(_){}
    eraseAt(e);
  }, {passive:false});

  scratchCanvas.addEventListener("pointermove", (e) => {
    if(!scratching) return;
    e.preventDefault();
    eraseAt(e);
  }, {passive:false});

  function stop(){ scratching = false; }
  scratchCanvas.addEventListener("pointerup", stop);
  scratchCanvas.addEventListener("pointercancel", stop);
}
function eraseAt(e) {
  const rect = scratchCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * dpr;
  const y = (e.clientY - rect.top) * dpr;

  sctx.globalCompositeOperation = "destination-out";
  sctx.beginPath();
  sctx.arc(x, y, 22 * dpr, 0, Math.PI * 2);
  sctx.fill();
  sctx.globalCompositeOperation = "source-over";

  scratched++;
  if (!scratchDone && scratched > 140) {
    scratchDone = true;

    // ✅ показываем скрытую строку
    scratchBlock.classList.add("revealed");

    spawnBurst((rect.left + rect.width / 2) * dpr, (rect.top + rect.height / 2) * dpr, 220);
    setTimeout(() => {
      miniGame.classList.remove("hidden");
      initMiniGame();
      miniGame.scrollIntoView({behavior: "smooth", block: "center"});
    }, 450);
  }


// ======================
// Mini-game
// ======================
  const dropZone = document.getElementById("dropZone");
  const piecesEls = Array.from(document.querySelectorAll(".piece"));
  let placed = new Set();

  function initMiniGame() {
    piecesEls.forEach(el => enableDrag(el));
  }

  function enableDrag(el) {
    let drag = false;
    let sx = 0, sy = 0;
    let ox = 0, oy = 0;

    el.addEventListener("pointerdown", (e) => {
      if (gameDone) return;
      e.preventDefault();
      drag = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {
      }
      const r = el.getBoundingClientRect();
      sx = e.clientX;
      sy = e.clientY;
      ox = r.left;
      oy = r.top;
      el.style.position = "fixed";
      el.style.left = ox + "px";
      el.style.top = oy + "px";
      el.style.zIndex = 9999;
    }, {passive: false});

    el.addEventListener("pointermove", (e) => {
      if (!drag) return;
      e.preventDefault();
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      el.style.left = (ox + dx) + "px";
      el.style.top = (oy + dy) + "px";
    }, {passive: false});

    el.addEventListener("pointerup", () => {
      if (!drag) return;
      drag = false;

      const dz = dropZone.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      if (cx > dz.left && cx < dz.right && cy > dz.top && cy < dz.bottom) {
        const centerX = dz.left + dz.width / 2 - r.width / 2;
        const centerY = dz.top + dz.height / 2 - r.height / 2;
        el.style.left = centerX + "px";
        el.style.top = centerY + "px";
        el.style.transform = "scale(.92)";
        el.style.opacity = "0.95";

        placed.add(el.dataset.piece);
        spawnBurst((dz.left + dz.width / 2) * dpr, (dz.top + dz.height / 2) * dpr, 130);

        if (placed.size >= 3 && !gameDone) {
          gameDone = true;
          setTimeout(() => {
            miniGame.classList.add("hidden");
            holdReveal.classList.remove("hidden");
            spawnBurst(innerWidth * dpr * 0.5, innerHeight * dpr * 0.25, 160);
            holdReveal.scrollIntoView({behavior: "smooth", block: "center"});
          }, 450);
        }
      } else {
        el.style.position = "";
        el.style.left = "";
        el.style.top = "";
        el.style.zIndex = "";
      }
    });

    el.addEventListener("pointercancel", () => {
      drag = false;
      el.style.position = "";
      el.style.left = "";
      el.style.top = "";
      el.style.zIndex = "";
    });
  }

// ======================
// Hold-to-reveal
// ======================
  const holdBtn = document.getElementById("holdBtn");
  const holdFill = document.getElementById("holdFill");
  let holding = false;
  let holdStart = 0;
  let holdRaf = null;

  function holdLoop() {
    if (!holding) return;
    const t = performance.now() - holdStart;
    const p = Math.max(0, Math.min(1, t / 2000));
    holdFill.style.width = (p * 100).toFixed(1) + "%";

    if (p >= 1) {
      holding = false;
      holdFill.style.width = "100%";
      revealFinal();
      return;
    }
    holdRaf = requestAnimationFrame(holdLoop);
  }

  holdBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    holding = true;
    holdStart = performance.now();
    holdFill.style.width = "0%";
    holdLoop();
  }, {passive: false});

  function stopHold() {
    if (!holding) return;
    holding = false;
    cancelAnimationFrame(holdRaf);
    holdFill.style.width = "0%";
  }

  holdBtn.addEventListener("pointerup", stopHold);
  holdBtn.addEventListener("pointerleave", stopHold);
  holdBtn.addEventListener("pointercancel", stopHold);

// ======================
// Final reveal + effects
// ======================
  const finalHand = document.getElementById("finalHand");
  const confettiBtn = document.getElementById("confettiBtn");
  const restartBtn = document.getElementById("restartBtn");

  function timeStopEffect() {
    const prev = timeScale;
    timeScale = 0.18;

    let prevVol = music.volume;
    if (playing) music.volume = Math.max(0, prevVol * 0.55);

    document.body.classList.add("breath");
    setTimeout(() => document.body.classList.remove("breath"), 1200);

    setTimeout(() => {
      timeScale = prev;
      if (playing) music.volume = prevVol;
    }, 1600);
  }

  function revealFinal() {
    if (finalDone) return;
    finalDone = true;

    holdReveal.classList.add("hidden");
    final.classList.remove("hidden");

    skyIntensity = 1.0;
    body.classList.add("dawn");

    spawnBurst(innerWidth * dpr * 0.5, innerHeight * dpr * 0.30, 320);
    timeStopEffect();
    setTimeout(() => spawnBurst(innerWidth * dpr * 0.5, innerHeight * dpr * 0.18, 180), 260);

    setTimeout(() => {
      finalHand.classList.add("show");
      finalHand.classList.add("shiver");
      document.getElementById("finalPrint").classList.add("hidePrint");
      setTimeout(() => finalHand.classList.remove("shiver"), 1200);
    }, 650);

    buildPhotoTables();
    setTimeout(() => final.scrollIntoView({behavior: "smooth", block: "start"}), 350);

    heartBtn.classList.add("pulse");

    document.body.classList.add("dawnEmotion");
    setTimeout(() => document.body.classList.remove("dawnEmotion"), 2400);
  }

// ======================
// Final buttons
// ======================
  confettiBtn.addEventListener("click", () => {
    spawnBurst(innerWidth * dpr * 0.5, innerHeight * dpr * 0.18, 240);
  });
  restartBtn.addEventListener("click", () => location.reload());

// ======================
// Photos only in final
// ======================
  const tableYou = document.getElementById("photoTable");
  const tableUs = document.getElementById("photoTableUs");

  function buildPhotoTables() {
    const youCaps = ["самая красивая", "моя радость", "ты — вау", "люблю тебя", "моё сердце"];
    const usCaps = ["наш момент", "вместе", "люблю это", "счастье", "навсегда"];

    tableYou.innerHTML = "";
    tableUs.innerHTML = "";

    for (let i = 1; i <= 5; i++) {
      tableYou.appendChild(makeThumb(`/static/photos/you/${i}.jpg`, `это ты • ${youCaps[i - 1]}`));
    }
    for (let i = 1; i <= 5; i++) {
      tableUs.appendChild(makeThumb(`/static/photos/us/${i}.jpg`, `мы • ${usCaps[i - 1]}`));
    }
  }

  function makeThumb(src, caption) {
    const div = document.createElement("div");
    div.className = "thumb";
    div.innerHTML = `<img src="${src}" alt="photo"><div class="cap">${caption}</div>`;
    return div;
  }

// ======================
// Heart interactive (speed reaction усиленный)
// ======================
  const heartBtn = document.getElementById("heartBtn");
  const heartHint = document.getElementById("heartHint");
  let heartTaps = 0;
  let heartCooldown = 0;
  let heartClicks = [];

  heartBtn.addEventListener("click", () => {
    const now = Date.now();
    if (now - heartCooldown < 90) return;
    heartCooldown = now;

    heartTaps++;
    burstFromElement(heartBtn, 90);

    heartClicks.push(now);
    heartClicks = heartClicks.filter(t => now - t < 1000);
    const speed = heartClicks.length;

    if (speed >= 6) {
      heartBtn.classList.add("fast");
    } else {
      heartBtn.classList.remove("fast");
    }

    if (heartTaps === 5) {
      heartHint.textContent = "ещё чуть-чуть… 💞";
    }
    if (heartTaps === 9) {
      heartHint.textContent = "оно бьётся так только рядом с тобой.";
      spawnBurst(innerWidth * dpr * 0.5, innerHeight * dpr * 0.18, 220);
      timeStopEffect();
    }
    if (heartTaps >= 14) {
      heartHint.textContent = "и я выбираю тебя. всегда.";
    }
  });

// ======================
// Our star: click near the star (top-right)
// ======================
  function ourStarScreenPos() {
    const x = ourStar.x / dpr;
    const y = ourStar.y / dpr;
    return {x, y};
  }

  window.addEventListener("pointerdown", (e) => {
    if (!finalDone) return;
    const p = ourStarScreenPos();
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (Math.hypot(dx, dy) < 34) {
      ourStar.glow = 1.0;
      openModal("🌌 Наша звезда\n\nПусть она будет напоминанием:\nкуда бы ни шёл день — я рядом.");
      spawnBurst((p.x) * dpr, (p.y) * dpr, 180);
      timeStopEffect();
    }
  });

// ======================
// QUIET MODE: hotkey Q
// ======================
  function setQuiet(on) {
    quietMode = on;
    document.body.classList.toggle("quiet", on);
    bgOn = !on;
    if (playing) {
      music.volume = on ? 0.25 : 1.0;
    }
  }

  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "q") {
      setQuiet(!quietMode);
      openModal(quietMode ? "🕯 Тишина\n\nПобудь здесь чуть-чуть…" : "Тишина отпущена ✨");
    }
  });

// ======================
// Hidden bottom line
// ======================
  let bottomSecret = document.getElementById("bottomSecret");
  if (!bottomSecret) {
    bottomSecret = document.createElement("div");
    bottomSecret.id = "bottomSecret";
    bottomSecret.className = "bottomSecret hidden";
    bottomSecret.textContent = "…и если ты это читаешь — значит, ты дошла до самого конца 🤍";
    const actions = document.querySelector(".actions");
    if (actions && actions.parentElement) {
      actions.parentElement.appendChild(bottomSecret);
    }
  }

  function checkBottom() {
    const y = window.scrollY + window.innerHeight;
    const h = document.documentElement.scrollHeight;
    if (y >= h - 6) {
      bottomSecret.classList.remove("hidden");
    }
  }

  window.addEventListener("scroll", checkBottom, {passive: true});
  setTimeout(checkBottom, 800);

// ======================
// Send to future: download small text file
// ======================
  function ensureFutureBtn() {
    if (document.getElementById("futureBtn")) return;
    if (!final) return;

    const wrap = document.createElement("div");
    wrap.className = "futureWrap";
    wrap.innerHTML = `
    <div style="margin-top:12px">
      <button class="btn" id="futureBtn">Отправить в будущее ⏳</button>
    </div>
  `;
    const actions = final.querySelector(".actions");
    actions?.insertAdjacentElement("beforebegin", wrap);

    const btn = document.getElementById("futureBtn");
    btn.addEventListener("click", () => {
      const dt = new Date();
      const text = [
        "Письмо — момент во времени",
        `Дата: ${dt.toLocaleString()}`,
        `Для: ${NAME}`,
        "",
        "Если ты читаешь это потом:",
        "я всё ещё люблю тебя.",
        CUSTOM ? `И помни: ${CUSTOM}` : "И помни: ты делаешь мой мир ярче.",
        "",
        "🤍"
      ].join("\n");

      const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "moment.txt";
      a.click();
      URL.revokeObjectURL(a.href);

      spawnBurst(innerWidth * dpr * 0.5, innerHeight * dpr * 0.18, 220);
    });
  }

  const observer = new MutationObserver(() => {
    if (!final.classList.contains("hidden")) {
      ensureFutureBtn();
    }
  });
  observer.observe(final, {attributes: true, attributeFilter: ["class"]});

// ======================
// Stars draw loop (with ourStar)
// ======================
  function starsTick() {
    if (!starsReady) {
      requestAnimationFrame(starsTick);
      return;
    }
    sctx2.clearRect(0, 0, stars.width, stars.height);

    const g = sctx2.createRadialGradient(
        stars.width * 0.5, stars.height * 0.35, 10,
        stars.width * 0.5, stars.height * 0.5, stars.width * 0.7
    );
    g.addColorStop(0, `rgba(255,255,255,${0.02 * skyIntensity})`);
    g.addColorStop(1, `rgba(0,0,0,${0.18 * skyIntensity})`);
    sctx2.fillStyle = g;
    sctx2.fillRect(0, 0, stars.width, stars.height);

    for (const st of starField) {
      st.tw += st.sp;
      const a = st.a * (0.70 + Math.sin(st.tw) * 0.30) * skyIntensity;
      sctx2.fillStyle = `rgba(255,255,255,${a})`;
      sctx2.beginPath();
      sctx2.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      sctx2.fill();
    }

    if (ourStar) {
      ourStar.tw += ourStar.sp;
      ourStar.glow *= 0.96;
      const pulse = 0.78 + Math.sin(ourStar.tw) * 0.22;
      const glow = (0.25 + ourStar.glow * 0.9) * skyIntensity;

      sctx2.save();
      sctx2.globalAlpha = glow;
      const rg = sctx2.createRadialGradient(ourStar.x, ourStar.y, 2 * dpr, ourStar.x, ourStar.y, 38 * dpr);
      rg.addColorStop(0, "rgba(255,210,122,0.95)");
      rg.addColorStop(1, "rgba(255,210,122,0.0)");
      sctx2.fillStyle = rg;
      sctx2.beginPath();
      sctx2.arc(ourStar.x, ourStar.y, 38 * dpr, 0, Math.PI * 2);
      sctx2.fill();
      sctx2.restore();

      sctx2.fillStyle = `rgba(255,210,122,${0.92 * pulse})`;
      sctx2.beginPath();
      sctx2.arc(ourStar.x, ourStar.y, ourStar.r, 0, Math.PI * 2);
      sctx2.fill();
    }

    requestAnimationFrame(starsTick);
  }

  starsTick();

// Ambient first tiny burst
  setTimeout(() => spawnBurst(innerWidth * dpr * 0.5, innerHeight * dpr * 0.14, 90), 600);
}