// Mobile front end: DOM layout, touch first. Same simulation as desktop.
import type { Game } from '../sim/game';
import { CHANGEOVER } from '../content/binder';
import { Audio } from '../ui/audio';
import { damascusLines, debriefLines, reliefLines, type DocLine } from '../ui/docs';
import { C } from '../ui/screen';
import { bootJump, driveSounds, jumpGame, newGame, params, type SoundState } from '../shell';
import { MOBILE_MANUAL, bannerHTML, esc, newMUI, pageHTML, sheetHTML, tabsHTML, topHTML, type MCtx, type MPage, type MUI } from './views';

type Mode = 'title' | 'manual' | 'changeover' | 'play' | 'klaxon' | 'ending' | 'debrief' | 'relief';
type Region = 'top' | 'banner' | 'page' | 'sheet' | 'tabs' | 'doc';

const COLOUR_CLASS: Record<number, string> = { [C.RED]: 'red', [C.DIM]: 'dim', [C.WHITE]: 'w', [C.CYAN]: 'cy', [C.AMBER]: 'amb', [C.DARK]: 'dim' };

export function startMobile() {
  document.body.classList.add('mobile');
  const root = document.createElement('div');
  root.id = 'm-app';
  root.innerHTML = `<header id="m-top"></header><div id="m-banner"></div><main id="m-page"><div id="m-body"></div></main>`
    + '<div id="m-sheet"></div><nav id="m-tabs"></nav><div id="m-toast" aria-live="polite"></div><div id="m-doc"></div>';
  document.body.appendChild(root);
  const el: Record<Region, HTMLElement> = {
    top: root.querySelector('#m-top')!, banner: root.querySelector('#m-banner')!, page: root.querySelector('#m-body')!,
    sheet: root.querySelector('#m-sheet')!, tabs: root.querySelector('#m-tabs')!, doc: root.querySelector('#m-doc')!,
  };
  const scroller = root.querySelector('#m-page') as HTMLElement;
  const toast = root.querySelector('#m-toast') as HTMLElement;

  const audio = new Audio();
  const snd: SoundState = { lastRebeep: 0, haptics: true };
  let g: Game = newGame();
  let ui: MUI = newMUI();
  let mode: Mode = 'title';
  let klaxonT = 0;
  let lastPage: MPage | null = null;
  let lastMode: Mode | null = null;
  const html: Partial<Record<Region, string>> = {};
  const acts: Record<Region, Map<string, () => void>> = {
    top: new Map(), banner: new Map(), page: new Map(), sheet: new Map(), tabs: new Map(), doc: new Map(),
  };
  let dirty = true;
  let lastPaint = 0;

  function restart(jump?: string) {
    audio.stopAll();
    g = jump ? jumpGame(jump) : newGame();
    ui = newMUI();
    if (jump) { ui.seenComms = g.comms.length; setMode('play'); } else setMode('changeover');
  }

  function setMode(m: Mode) {
    mode = m;
    dirty = true;
    if (m === 'play') { void keepAwake(); audio.setHum(1); }
  }

  const say = (s: string) => { if (s) { ui.feedback = s; ui.feedbackT = performance.now(); } };

  function ctxFor(region: Region): MCtx {
    const map = acts[region];
    map.clear();
    return {
      g, ui, say,
      act: (id, fn) => { map.set(id, fn); return ` data-act="${esc(id)}" data-r="${region}"`; },
    };
  }

  /** Replace a region's HTML only when it changed, keeping scroll positions of marked boxes. */
  function patch(r: Region, s: string) {
    if (html[r] === s) return;
    html[r] = s;
    const node = el[r];
    const saved = new Map<string, { top: number; bottom: boolean }>();
    node.querySelectorAll<HTMLElement>('[data-scroll]').forEach((n) => {
      saved.set(n.dataset.scroll!, { top: n.scrollTop, bottom: n.scrollTop + n.clientHeight >= n.scrollHeight - 12 });
    });
    node.innerHTML = s;
    node.querySelectorAll<HTMLElement>('[data-scroll]').forEach((n) => {
      const sv = saved.get(n.dataset.scroll!);
      if (!sv || (sv.bottom && n.dataset.scroll === 'log')) n.scrollTop = n.dataset.scroll === 'log' ? n.scrollHeight : 0;
      else n.scrollTop = sv.top;
    });
  }

  // ───────────────────────── painting ─────────────────────────

  function paintGame(now: number) {
    root.classList.remove('docmode');
    const pageChanged = lastPage !== ui.page;
    patch('top', topHTML(g));
    patch('banner', bannerHTML(ctxFor('banner')));
    patch('tabs', tabsHTML(ctxFor('tabs')));
    patch('sheet', sheetHTML(ctxFor('sheet')));
    root.classList.toggle('sheet-open', g.procs.length > 0 && ui.sheetOpen);
    root.classList.toggle('has-sheet', g.procs.length > 0);
    patch('page', pageHTML(ctxFor('page')));
    if (pageChanged) { scroller.scrollTop = 0; lastPage = ui.page; }
    const fresh = now - ui.feedbackT < 3500 && ui.feedback;
    toast.textContent = fresh ? ui.feedback : '';
    toast.classList.toggle('show', !!fresh);
    root.classList.toggle('klaxon', mode === 'klaxon');
  }

  function paintDoc() {
    root.classList.add('docmode');
    const c = ctxFor('doc');
    const b = (id: string, label: string, fn: () => void, cls = '') => `<button class="btn ${cls}"${c.act(id, fn)}>${esc(label)}</button>`;
    let body = '';
    let buttons = '';
    let paper = false;
    const lines = (ls: DocLine[]) => ls.map((l) => `<p class="${l.c !== undefined ? COLOUR_CLASS[l.c] ?? '' : ''}">${esc(l.text.replace(/─+/g, '────────────')) || '&nbsp;'}</p>`).join('');
    switch (mode) {
      case 'title':
        body = '<div class="title"><div class="logo">COMPLEX 4-7</div><div class="cy">LAUNCH COMPLEX 4-7 &middot; TITAN II<br>17 SEPTEMBER 1980</div>'
          + '<p>You command a launch crew, deep underground. For twenty-four hours you decide what is real: the orders, the alarms, the people, and the machine itself.</p>'
          + '<p class="dim">Prototype shift &middot; terminal build. Sound on. About 15-20 minutes. Your phone stays awake while you play.</p>'
          + '<p class="dim small">Nuclear weapons, industrial accident, injury (reported, never shown). All codes, procedures and people are invented.</p></div>';
        buttons = b('start', 'TAKE THE CHAIR', () => { audio.start(); setMode('manual'); }, 'primary')
          + b('jump', 'PLAYTEST: JUMP TO 0145Z', () => { audio.start(); restart('0145'); });
        break;
      case 'manual':
        body = `<div class="doctext">${MOBILE_MANUAL.map((l, i) => `<p class="${i === 0 ? 'cy' : /^[A-Z ]+$/.test(l) && l ? 'w' : ''}">${esc(l) || '&nbsp;'}</p>`).join('')}</div>`;
        buttons = b('cont', 'CONTINUE TO CHANGEOVER', () => setMode('changeover'), 'primary');
        break;
      case 'changeover':
        paper = true;
        body = lines(CHANGEOVER.map((t) => ({ text: t })));
        buttons = b('accept', 'ACCEPT THE SHIFT (0800Z)', () => { g.begin(); setMode('play'); }, 'primary');
        break;
      case 'debrief':
        paper = true;
        body = lines(debriefLines(g));
        buttons = b('rs', 'RESTART SHIFT', () => restart(), 'primary') + b('tt', 'TITLE', () => setMode('title'));
        break;
      case 'relief':
        paper = true;
        body = lines(reliefLines(g));
        buttons = b('rep', 'READ PERFORMANCE REPORT', () => setMode('debrief'), 'primary') + b('rs', 'RESTART SHIFT', () => restart());
        break;
      case 'ending':
        paper = true;
        body = lines(damascusLines(g));
        buttons = b('rs', 'RESTART SHIFT', () => restart(), 'primary') + b('rj', 'RESTART AT 0145Z', () => restart('0145')) + b('rep', 'PERFORMANCE REPORT', () => setMode('debrief'));
        break;
    }
    patch('doc', `<div class="docscroll" data-scroll="doc"><div class="${paper ? 'paper doc' : 'termdoc'}">${body}</div></div><div class="docbtns">${buttons}</div>`);
    if (lastMode !== mode) {
      const s = el.doc.querySelector<HTMLElement>('.docscroll');
      if (s) s.scrollTop = 0;
      lastMode = mode;
    }
  }

  // ───────────────────────── loop ─────────────────────────

  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (mode === 'play' || mode === 'klaxon') {
      g.advance(mode === 'play' ? dt : 0);
      driveSounds(audio, g, now, snd);
      if (mode === 'play' && g.ending) {
        if (g.ending.kind === 'damascus') { mode = 'klaxon'; klaxonT = now; ui.sheetOpen = false; }
        else { audio.stopAll(); setMode(g.netStrikes() >= 3 ? 'relief' : 'debrief'); }
      }
      if (mode === 'klaxon' && now - klaxonT > 7000) { audio.stopAll(); setMode('ending'); }
    }
    // Repaint at about 8 Hz, or at once after a tap.
    if (dirty || now - lastPaint > 120) {
      if (mode === 'play' || mode === 'klaxon') paintGame(now); else paintDoc();
      dirty = false;
      lastPaint = now;
    }
    requestAnimationFrame(frame);
  }

  // ───────────────────────── input ─────────────────────────
  // Taps are resolved on pointerup from the id captured at pointerdown, so a repaint
  // between finger-down and finger-up never loses the tap. Scrolling cancels it.

  let down: { id: string; r: Region; x: number; y: number; t: number; node: HTMLElement } | null = null;

  function run(r: Region, id: string) {
    const fn = acts[r].get(id);
    if (!fn) return;
    audio.start();
    audio.play('key');
    fn();
    dirty = true;
  }

  root.addEventListener('pointerdown', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!t) { down = null; return; }
    down = { id: t.dataset.act!, r: t.dataset.r as Region, x: e.clientX, y: e.clientY, t: performance.now(), node: t };
    t.classList.add('pressed');
  });
  root.addEventListener('pointermove', (e) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 14) { down.node.classList.remove('pressed'); down = null; }
  });
  root.addEventListener('pointerup', () => {
    if (!down) return;
    const d = down;
    down = null;
    d.node.classList.remove('pressed');
    if (performance.now() - d.t < 900) run(d.r, d.id);
  });
  root.addEventListener('pointercancel', () => { if (down) down.node.classList.remove('pressed'); down = null; });
  // Keyboard activation (external keyboards, accessibility): click with detail 0.
  root.addEventListener('click', (e) => {
    if ((e as MouseEvent).detail !== 0) return;
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (t) run(t.dataset.r as Region, t.dataset.act!);
  });
  window.addEventListener('keydown', (e) => {
    if (mode !== 'play') return;
    if (e.key === 'a' || e.key === 'A') { g.ack(); dirty = true; }
    if (e.key === 't' || e.key === 'T') { say(g.procTick()); dirty = true; }
  });

  // Keep the screen on while a shift is running.
  let lock: { release: () => Promise<void> } | null = null;
  async function keepAwake() {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
    if (!wl || lock) return;
    try { lock = await wl.request('screen'); (lock as unknown as EventTarget).addEventListener?.('release', () => { lock = null; }); } catch { lock = null; }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (mode === 'play' || mode === 'klaxon')) void keepAwake();
    last = performance.now(); // no catch-up after being backgrounded
  });

  const j = bootJump();
  if (j) {
    restart(j);
    const p = params.get('page');
    if (p && /^F[1-9]$/.test(p)) ui.page = p as MPage;
    if (params.get('sheet') === '1') ui.sheetOpen = true;
    const wo = params.get('wo');
    if (wo && g.wos[wo]) ui.woSel = wo;
    const proc = params.get('proc');
    if (proc) g.procOpen(proc);
    const doc = params.get('doc');
    if (doc === 'debrief' || doc === 'changeover') setMode(doc);
  }
  if (params.get('doc') === 'manual') setMode('manual');
  {
  }
  document.fonts.load('20px "VT323"').finally(() => requestAnimationFrame(frame));
}
