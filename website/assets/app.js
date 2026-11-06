/* eo website — highlighter, hero demo, how-it-works, docs, playground */
(() => {
'use strict';
document.documentElement.classList.add('js');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ───────── highlighter (same rules as the VS Code extension colors) ─────────
const KW = new Set('var const func return if elif else for in while break continue import from lambda prc and or not'.split(' '));
const BI = new Set('print len range map filter reduce sort input int float string bool type keys values items has get remove sum min max abs round sqrt pow random split join upper lower trim replace reverse append pop sleep exit'.split(' '));
const PROPS = new Set('status time ms process memory'.split(' '));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function tokenize(line) {
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(@\([^)]*\)|@[A-Za-z_]+|(?<=[\p{L}\p{N}_] )!\([^)]*\)|(?<=[\p{L}\p{N}_] )![A-Za-z_]+)|((?<=\s)[-$][sm](?=\s))|(\d+(?:\.\d+)?(?:mb|kb|gb)?(?![\p{L}_]))|([\p{L}_][\p{L}\p{N}_]*)|(\s+)|(.)/gu;
  const out = []; let m; let prevWord = '';
  while ((m = re.exec(line))) {
    let cls = '';
    if (m[1]) cls = 'c'; else if (m[2]) cls = 's'; else if (m[3]) cls = 't'; else if (m[4]) cls = 'k';
    else if (m[5]) cls = 'n';
    else if (m[6]) {
      const w = m[6]; const prevCh = line[m.index - 1]; const next = line[m.index + w.length];
      if (KW.has(w) && prevWord !== 'func') cls = 'k';
      else if (w === 'true' || w === 'false') cls = 'n';
      else if (prevCh === '.' && PROPS.has(w)) cls = 'pr';
      else if (prevWord === 'func') cls = 'f';
      else if (BI.has(w)) cls = 'b';
      else if (next === '(' || next === '.') cls = 'f';
      prevWord = w;
    }
    out.push([m[0], cls]);
  }
  return out;
}
function highlight(src, limit = Infinity, caret = false) {
  let left = limit, html = '';
  const lines = src.split('\n');
  for (let i = 0; i < lines.length && left > 0; i++) {
    for (const [txt, cls] of tokenize(lines[i])) {
      if (left <= 0) break;
      const part = txt.slice(0, left); left -= part.length;
      html += cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part);
    }
    if (i < lines.length - 1 && left > 0) { html += '\n'; left--; }
  }
  return html + (caret ? '<span class="caret"></span>' : '');
}

// ───────── toast / copy ─────────
const toast = $('#toast'); let toastT;
function say(msg) { toast.textContent = msg; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 1600); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); say('تم النسخ'); }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); say('تم النسخ'); } catch (e2) { say('ما قدرت أنسخ، انسخه يدوي'); }
    ta.remove();
  }
}

// ───────── background squares ─────────
(function tiles() {
  const cv = $('#tiles'); const ctx = cv.getContext('2d'); const G = 60;
  const COL = ['#FDE7E4', '#FBD5D0', '#FECACA'];
  let W, H, list = [];
  function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = Math.ceil(W / G), rows = Math.ceil(H / G);
    const n = Math.round(cols * rows * .045);
    list = Array.from({ length: n }, (_, i) => ({ c: Math.floor(rnd(i) * cols), r: Math.floor(rnd(i + 99) * rows), ph: rnd(i + 7) * 6.28, sp: .25 + rnd(i + 3) * .4, col: COL[i % 3] }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const f of list) {
      const a = reduced ? .5 : Math.max(0, Math.sin(t / 1000 * f.sp + f.ph) * .9);
      if (a <= 0) continue;
      ctx.globalAlpha = a * .75; ctx.fillStyle = f.col;
      ctx.fillRect(f.c * G + 2, f.r * G + 2, G - 3, G - 3);
    }
    if (!reduced) requestAnimationFrame(draw);
  }
  size(); addEventListener('resize', size); requestAnimationFrame(draw);
})();

// ───────── nav ─────────
const menu = $('#menu'), links = $('#links');
menu.addEventListener('click', () => { const o = links.classList.toggle('open'); menu.setAttribute('aria-expanded', o); });
$$('#links a').forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
const navMap = new Map($$('#links a').map(a => [a.getAttribute('href').slice(1), a]));
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { navMap.forEach(a => a.classList.remove('on')); const a = navMap.get(e.target.id); if (a) a.classList.add('on'); }
}), { rootMargin: '-45% 0px -50% 0px' });
navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });

// ───────── static code blocks ─────────
$$('pre.eo').forEach(p => { p.dataset.src = p.textContent; p.innerHTML = highlight(p.textContent); });

// ───────── hero demo ─────────
const HERO = [
  { file: 'main.eo', src: 'var name @string = "Ali"\nprint "Hello " + name', out: 'Hello Ali' },
  { file: 'math.eo', src: 'func add a @int, b @int {\n    return a + b\n}\n\nprint add 2, 3', out: '5' },
  { file: 'limits.eo', src: 'slow = prc -s 0.5 {\n    while true {\n    }\n}\nprint slow.status\nprint "still running"', out: '<span class="r">[ProcessError: Execution timed out after 500ms]</span>\nTerminated (Limit Exceeded)\nstill running' },
  { file: 'types.eo', src: 'var n @int = "hello"', out: '<span class="r">Error (line 1): \'n\' is @int but got a string: "hello"</span>' },
];
(function hero() {
  const code = $('#heroCode'), out = $('#heroOut'), file = $('#heroFile'), dots = $('#heroDots');
  let idx = 0, timer;
  dots.innerHTML = HERO.map((_, i) => `<button aria-label="مثال ${i + 1}"></button>`).join('');
  const btns = $$('button', dots);
  btns.forEach((b, i) => b.addEventListener('click', () => play(i)));
  function play(i) {
    clearTimeout(timer); idx = i;
    btns.forEach((b, k) => b.classList.toggle('on', k === i));
    const ex = HERO[i]; file.textContent = ex.file;
    const cmd = `<span class="p">&gt;</span> ./eo.exe ${ex.file}`;
    if (reduced) { code.innerHTML = highlight(ex.src); out.innerHTML = cmd + '\n' + ex.out; return; }
    let n = 0; out.innerHTML = '';
    const step = () => {
      n += 1; code.innerHTML = highlight(ex.src, n, true);
      if (n < ex.src.length) { timer = setTimeout(step, ex.src[n - 1] === '\n' ? 180 : 38); return; }
      timer = setTimeout(() => {
        out.innerHTML = cmd;
        timer = setTimeout(() => {
          out.innerHTML = cmd + '\n' + ex.out; code.innerHTML = highlight(ex.src);
          timer = setTimeout(() => play((idx + 1) % HERO.length), 3600);
        }, 550);
      }, 350);
    };
    step();
  }
  play(0);
})();

// ───────── how it works ─────────
const SAMPLE = 'var total = 0\nfor i in range(5) {\n    total += i\n}\nprint total';
const TOKENS = (() => {
  const out = [];
  SAMPLE.split('\n').forEach(line => {
    for (const [txt, cls] of tokenize(line)) {
      if (/^\s+$/.test(txt)) continue;
      const kind = { k: 'KEYWORD', b: 'NAME', n: 'NUMBER', s: 'STRING', t: 'TYPE', f: 'NAME', c: 'COMMENT' }[cls] || (/^[\p{L}_]/u.test(txt) ? 'NAME' : 'OP');
      out.push(`<span>${esc(txt)}<small>${kind}</small></span>`);
    }
    out.push('<span class="nl">⏎<small>NEWLINE</small></span>');
  });
  return out.join('');
})();
const STAGES = [
  { h: 'الكود <code>main.eo</code>', p: 'كل شي يبدأ من ملف نص عادي. تكتبه بأي محرر، والأفضل VS Code مع إضافة eo عشان التلوين والاقتراحات.',
    li: ['ملف واحد أو أكثر مع import', 'الأسماء تقدر تكون بالعربي', 'بدون فواصل منقوطة'],
    code: () => `<div class="cardbar"><i></i><i></i><i></i><span>main.eo</span></div><pre class="eo">${highlight(SAMPLE)}</pre>` },
  { h: 'Lexer: تقطيع النص', p: 'الـ Lexer يقرأ النص حرف حرف ويقطّعه لقطع صغيرة اسمها tokens: كلمة محجوزة، اسم، رقم، رمز، نهاية سطر.',
    li: ['يتجاهل المسافات والتعليقات', 'يعرف النص المفتوح اللي ما تسكّر', 'كل قطعة معها رقم سطرها عشان رسائل الأخطاء'],
    code: () => `<div class="cardbar"><i></i><i></i><i></i><span>tokens</span></div><div class="toks">${TOKENS}</div>` },
  { h: 'Parser: ترتيب في شجرة', p: 'الـ Parser ياخذ القطع ويرتبها في شجرة (AST) تفهم منها اللغة وش تبي: تعريف متغير، حلقة، استدعاء، وترتيب العمليات الحسابية.',
    li: ['هنا تطلع أخطاء SyntaxError قبل ما يشتغل أي سطر', 'يفهم الاستدعاء بدون أقواس', 'المفسّر يمشي على هذي الشجرة مباشرة لما تكتب eo main.eo'],
    code: () => `<div class="cardbar"><i></i><i></i><i></i><span>AST</span></div><pre class="eo">${esc(`Program
├─ VarDecl  total
│  └─ Number  0
├─ For  i
│  ├─ Call  range
│  │  └─ Number  5
│  └─ Block
│     └─ Assign  total +=
│        └─ Name  i
└─ Print
   └─ Name  total`)}</pre>` },
  { h: 'Bytecode: تعليمات مختصرة', p: 'مع eo build أو eo --vm، الشجرة تتحول لقائمة تعليمات بسيطة تشغّلها آلة صغيرة (VM). هذا الناتج الحقيقي من eo dis:',
    li: ['كل تعليمة معها رقم سطرها', 'المكتبات تتحول بعد وتنحط معه', 'تقدر تشوفها بنفسك: eo dis main.eo'],
    code: () => `<div class="cardbar"><i></i><i></i><i></i><span>eo dis main.eo</span></div><pre class="out">${esc(`== module main.eo() ==
   1  CONST          0
   2  DECL           total        line 1
   4  CONST          5
   5  CALL           range argc=1 line 2
   6  ITER_NEW       i            line 2
   7  ITER_NEXT      -> 14        line 2
   8  SET_ENV
  10  LOAD           i            line 3
  11  ASSIGN_OP      total +=     line 3
  12  POP_ENV
  13  JUMP           -> 7
  14  ITER_END
  16  LOAD           total        line 5
  17  PRINT
  18  PRINT_NL
  19  RETURN_NONE`)}</pre>` },
  { h: 'main.exe: برنامج جاهز', p: 'الـ bytecode ينضغط ويتموّه، وينلصق في آخر نسخة من مشغّل eo. لما تشغّل main.exe، يقرأ نفسه، يلقى البرنامج في آخره، ويشغّله.',
    li: ['يشتغل لحاله: بدون eo وبدون Go', 'حجمه حوالي 2.8 ميقا لأن المشغّل كامل داخله', 'البناء ياخذ أجزاء من الثانية'],
    code: () => `<div class="cardbar"><i></i><i></i><i></i><span>main.exe</span></div><div style="padding:22px;direction:ltr;display:grid;gap:8px;font-family:var(--mono);font-size:15px">
      <div style="padding:22px 18px;background:var(--tile);border:2px solid var(--line)">eo runtime <span style="color:var(--muted)">· المشغّل (Go)</span></div>
      <div style="padding:14px 18px;background:var(--soft);border:2px solid var(--rose)">bytecode <span style="color:var(--muted)">· gob + gzip + تمويه</span></div>
      <div style="padding:10px 18px;background:var(--accent);color:#fff">footer <span style="opacity:.85">· الحجم + EOBYTE01</span></div>
    </div><pre class="out"><span class="p">&gt;</span> ./eo.exe build main.eo
<span class="g">Built main.exe (2.8 MB) in 21ms</span>
<span class="p">&gt;</span> ./main.exe
10</pre>` },
];
(function how() {
  const stages = $$('.stage'), linksEl = $$('#pipe .link'), text = $('#howText'), code = $('#howCode');
  function show(i) {
    stages.forEach((s, k) => { s.classList.toggle('on', k === i); s.setAttribute('aria-selected', k === i); });
    linksEl.forEach((l, k) => l.classList.toggle('lit', k < i));
    const st = STAGES[i];
    text.innerHTML = `<h3>${st.h}</h3><p>${st.p}</p><ul>${st.li.map(x => `<li>${x}</li>`).join('')}</ul>`;
    code.innerHTML = st.code();
  }
  stages.forEach((s, i) => s.addEventListener('click', () => show(i)));
  show(0);
})();

// ───────── docs ─────────
(function docs() {
  const arts = $$('#doc article'), toc = $('#toc');
  toc.innerHTML = arts.map((a, i) => `<button data-i="${i}"><span class="num">${String(i + 1).padStart(2, '0')}</span>${a.dataset.t}</button>`).join('');
  const btns = $$('button', toc);
  arts.forEach((a, i) => {
    const nav = document.createElement('div'); nav.className = 'docnav';
    nav.innerHTML = (i > 0 ? `<button class="btn small alt" data-go="${i - 1}">→ ${arts[i - 1].dataset.t}</button>` : '<span></span>') +
      (i < arts.length - 1 ? `<button class="btn small" data-go="${i + 1}">${arts[i + 1].dataset.t} ←</button>` : '');
    a.appendChild(nav);
  });
  function show(i, scroll) {
    arts.forEach((a, k) => a.classList.toggle('on', k === i));
    btns.forEach((b, k) => b.classList.toggle('on', k === i));
    if (scroll) $('#doc').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
  toc.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.i, innerWidth < 1020); });
  $('#doc').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) show(+b.dataset.go, true); });
  show(0);

  // copy + try buttons on every snippet
  $$('.snip').forEach(s => {
    const pre = $('pre.eo', s);
    const bar = document.createElement('div'); bar.className = 'cardbar';
    bar.innerHTML = '<i></i><i></i><i></i><span>eo</span><button class="copy">نسخ</button>' + (pre.hasAttribute('data-run') ? '<button class="copy tryit">جرّب ▶</button>' : '');
    s.prepend(bar);
    $$('.copy', bar)[0].addEventListener('click', () => copyText(pre.dataset.src));
    const t = $('.tryit', bar);
    if (t) t.addEventListener('click', () => { loadIntoPlay(pre.dataset.src, pre.dataset.stdin); });
  });
})();

// ───────── playground ─────────
const EXAMPLES = [
  ['مرحبا', 'var name = input("Your name: ")\nprint "Hello " + name\n\nfor i in range(3) {\n    print i, "=" * (i + 1)\n}', 'Sara'],
  ['الدوال و fib', 'func fib n @int {\n    if n < 2 {\n        return n\n    }\n    return fib(n - 1) + fib(n - 2)\n}\n\nfor i in range(10) {\n    print i, fib(i)\n}', ''],
  ['prc والحدود', 'p = prc -s 1 -m 50mb {\n    var total = 0\n    for i in range(100000) {\n        total += i\n    }\n    print total\n}\nprint p.status, p.time\n\nslow = prc -s 0.5 {\n    while true {\n    }\n}\nprint slow.status\nprint "still running"', ''],
  ['قواميس و lambda', 'var users = [\n    {"name": "Sara", "age": 25},\n    {"name": "Ali", "age": 20},\n    {"name": "Noor", "age": 31},\n]\n\nvar sorted = sort(users, lambda u { u["age"] })\nfor u in sorted {\n    print u["name"], u["age"]\n}\n\nvar ages = map(users, lambda u { u["age"] })\nprint "total:", reduce(ages, lambda a, b { a + b })', ''],
  ['الأنواع والأخطاء', 'var v @(int string) = 5\nv = "ok"\nprint v\n\nvar s !int = "Hello"\nprint s\ns = 5', ''],
];
const ed = $('#ed'), hl = $('#edHl'), gut = $('#gut'), outEl = $('#out'), st = $('#st'), stText = $('#stText'), stdin = $('#stdin');
const runBtn = $('#run'), stopBtn = $('#stop'), sel = $('#examples');
sel.innerHTML = EXAMPLES.map((e, i) => `<option value="${i}">${e[0]}</option>`).join('');
function syncEd() {
  hl.innerHTML = highlight(ed.value) + '\n';
  const n = ed.value.split('\n').length;
  gut.innerHTML = Array.from({ length: n }, (_, i) => `<div>${i + 1}</div>`).join('');
  hl.scrollTop = ed.scrollTop; hl.scrollLeft = ed.scrollLeft; gut.scrollTop = ed.scrollTop;
}
ed.addEventListener('input', syncEd);
ed.addEventListener('scroll', () => { hl.scrollTop = ed.scrollTop; hl.scrollLeft = ed.scrollLeft; gut.scrollTop = ed.scrollTop; });
ed.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); return; }
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = ed.selectionStart, en = ed.selectionEnd;
    ed.setRangeText('    ', s, en, 'end'); syncEd();
  } else if (e.key === 'Enter') {
    // keep indentation, add one level after "{"
    const s = ed.selectionStart; const lineStart = ed.value.lastIndexOf('\n', s - 1) + 1;
    const line = ed.value.slice(lineStart, s); let ind = line.match(/^\s*/)[0];
    if (/\{\s*$/.test(line)) ind += '    ';
    e.preventDefault(); ed.setRangeText('\n' + ind, s, ed.selectionEnd, 'end'); syncEd();
  }
});
sel.addEventListener('change', () => { const ex = EXAMPLES[+sel.value]; ed.value = ex[1]; stdin.value = ex[2]; syncEd(); });
$('#copyEd').addEventListener('click', () => copyText(ed.value));
function loadIntoPlay(src, input) {
  ed.value = src; stdin.value = input || ''; syncEd();
  $('#play').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  setTimeout(run, reduced ? 0 : 450);
}

let worker = null, workerReady = false, runId = 0, pending = null, killT = null, startT = 0;
const LIMIT = 10000;
function setStatus(kind, txt) { st.className = 'st ' + kind; stText.textContent = txt; }
function makeWorker() {
  workerReady = false;
  worker = new Worker('assets/eo-worker.js');
  worker.onmessage = e => {
    const m = e.data;
    if (m.type === 'ready') { workerReady = true; if (pending) { worker.postMessage(pending); } return; }
    if (m.type === 'fail') { finish(); setStatus('bad', 'ما اشتغل المترجم'); outEl.innerHTML = '<span class="r">ما قدرت أحمّل المترجم. افتح الموقع من سيرفر (مو من الملف مباشرة).</span>'; return; }
    if (m.type === 'done' && m.id === runId) {
      const ms = Math.round(performance.now() - startT);
      let h = esc(m.out || '');
      h = h.replace(/^\[ProcessError:.*\]$/gm, s => `<span class="r">${s}</span>`);
      if (m.err) h += (h && !h.endsWith('\n') ? '\n' : '') + `<span class="r">${esc(m.err)}</span>`;
      if (!h) h = '<span class="d">(البرنامج ما طبع شي)</span>';
      outEl.innerHTML = h;
      finish();
      if (m.err) setStatus('bad', `خطأ · ${ms}ms`); else setStatus('ok', `خلص · ${ms}ms`);
    }
  };
  worker.onerror = () => { finish(); setStatus('bad', 'ما اشتغل المترجم'); outEl.innerHTML = '<span class="r">ما قدرت أحمّل المترجم. افتح الموقع من سيرفر (مو من الملف مباشرة).</span>'; };
}
function finish() { pending = null; clearTimeout(killT); runBtn.hidden = false; stopBtn.hidden = true; }
function run() {
  if (!worker) makeWorker();
  runId++;
  const msg = { id: runId, src: ed.value, stdin: stdin.value.replace(/\r/g, '') + '\n' };
  outEl.innerHTML = workerReady ? '' : '<span class="d">يحمّل المترجم…</span>';
  setStatus('run', 'يشتغل…'); runBtn.hidden = true; stopBtn.hidden = false; startT = performance.now();
  pending = msg;
  if (workerReady) worker.postMessage(msg);
  clearTimeout(killT);
  killT = setTimeout(() => stop(`وقف بعد ${LIMIT / 1000} ثواني. لو تبي برنامج يطوّل، حطه داخل prc أو شغّله على جهازك.`), LIMIT + 4000);
}
function stop(why) {
  if (worker) worker.terminate(); worker = null; workerReady = false;
  finish(); setStatus('bad', 'توقف');
  outEl.innerHTML += (outEl.innerHTML ? '\n' : '') + `<span class="r">${why || 'وقّفته.'}</span>`;
}
runBtn.addEventListener('click', run);
stopBtn.addEventListener('click', () => stop());
ed.value = EXAMPLES[0][1]; stdin.value = EXAMPLES[0][2]; syncEd();
// warm the interpreter when the playground gets close
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { if (!worker) makeWorker(); o.disconnect(); } }, { rootMargin: '400px' }).observe($('#play'));
})();
