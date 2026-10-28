// Desktop front end: the 100x36 terminal on a canvas, keyboard first.
import type { Game } from './sim/game';
import { CHANGEOVER, MANUAL } from './content/binder';
import { Screen } from './ui/screen';
import { Renderer } from './ui/renderer';
import { Audio } from './ui/audio';
import { goBack, newUI, renderGame, type PageId, type UIState } from './ui/pages';
import { TITLE, damascusLines, debriefLines, reliefLines, renderDoc, type DocLine } from './ui/docs';
import { bootJump, driveSounds, jumpGame, newGame, params, type SoundState } from './shell';

type Mode = 'title' | 'manual' | 'changeover' | 'play' | 'klaxon' | 'ending' | 'debrief' | 'relief';

export function startDesktop() {
  const canvas = document.getElementById('screen') as HTMLCanvasElement;
  const glow = document.getElementById('glow') as HTMLCanvasElement;
  const screen = new Screen();
  const renderer = new Renderer(canvas, glow);
  const audio = new Audio();
  const snd: SoundState = { lastRebeep: 0, haptics: false };

  let g: Game = newGame();
  let ui: UIState = newUI();
  let mode: Mode = 'title';
  let docScroll = 0;
  let klaxonT = 0;
  let hover: string | null = null;
  const docActs = new Map<string, () => void>();

  function restart(jump?: string) {
    audio.stopAll();
    g = jump ? jumpGame(jump) : newGame();
    ui = newUI();
    docScroll = 0;
    if (jump) { ui.seenComms = g.comms.length; mode = 'play'; } else mode = 'changeover';
  }

  const j = bootJump();
  if (j) {
    restart(j);
    const p = params.get('page');
    if (p && /^F[1-9]$/.test(p)) ui.page = p as PageId;
  }

  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    const blinkOn = Math.floor(now / 450) % 2 === 0;

    if (mode === 'play' || mode === 'klaxon') {
      g.advance(mode === 'play' ? dt : 0);
      driveSounds(audio, g, now, snd);
      if (mode === 'play' && g.ending) {
        if (g.ending.kind === 'damascus') { mode = 'klaxon'; klaxonT = now; }
        else { audio.stopAll(); mode = g.netStrikes() >= 3 ? 'relief' : 'debrief'; docScroll = 0; }
      }
      if (mode === 'klaxon' && now - klaxonT > 7000) {
        audio.stopAll();
        mode = 'ending';
        docScroll = 0;
      }
      if (mode === 'play' || mode === 'klaxon') renderGame(g, ui, screen, blinkOn);
    }
    if (mode !== 'play' && mode !== 'klaxon') drawDoc();
    renderer.draw(screen, blinkOn, hover);
    requestAnimationFrame(frame);
  }

  function drawDoc() {
    const opts: { key: string; label: string; fn: () => void }[] = [];
    let lines: DocLine[] = [];
    let paper = false;
    switch (mode) {
      case 'title':
        lines = TITLE;
        opts.push({ key: 'ENTER', label: 'TAKE THE CHAIR', fn: () => { audio.start(); mode = 'manual'; } });
        opts.push({ key: '2', label: 'PLAYTEST: JUMP TO 0145Z (NIGHT WORK ORDER)', fn: () => { audio.start(); restart('0145'); } });
        break;
      case 'manual':
        lines = MANUAL.map((t, i) => ({ text: t, c: i === 0 ? 5 : undefined }));
        opts.push({ key: 'ENTER', label: 'CONTINUE TO CHANGEOVER', fn: () => { mode = 'changeover'; } });
        break;
      case 'changeover':
        lines = CHANGEOVER.map((t) => ({ text: t }));
        paper = true;
        opts.push({ key: 'ENTER', label: 'ACCEPT THE SHIFT (0800Z)', fn: () => { mode = 'play'; g.begin(); audio.setHum(1); } });
        break;
      case 'debrief':
        lines = debriefLines(g);
        paper = true;
        opts.push({ key: '1', label: 'RESTART SHIFT', fn: () => restart() }, { key: '2', label: 'TITLE', fn: () => { mode = 'title'; } });
        break;
      case 'relief':
        lines = reliefLines(g);
        paper = true;
        opts.push({ key: '1', label: 'READ PERFORMANCE REPORT', fn: () => { mode = 'debrief'; docScroll = 0; } }, { key: '2', label: 'RESTART SHIFT', fn: () => restart() });
        break;
      case 'ending':
        lines = damascusLines(g);
        paper = true;
        opts.push({ key: '1', label: 'RESTART SHIFT', fn: () => restart() }, { key: '2', label: 'RESTART AT 0145Z', fn: () => restart('0145') }, { key: '3', label: 'PERFORMANCE REPORT', fn: () => { mode = 'debrief'; docScroll = 0; } });
        break;
    }
    docScroll = Math.max(0, Math.min(docScroll, Math.max(0, lines.length - 32)));
    renderDoc(screen, lines, opts, docActs, paper, docScroll);
  }

  const PAGE_KEYS: Record<string, PageId> = { F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4', F6: 'F6', F8: 'F8', F9: 'F9' };
  const ORDER: PageId[] = ['F1', 'F2', 'F3', 'F4', 'F6', 'F8', 'F9'];
  const say = (msg: string) => { if (msg) { ui.feedback = msg; ui.feedbackT = performance.now(); } };

  window.addEventListener('keydown', (e) => {
    audio.start();
    const k = e.key;
    if (/^F\d+$/.test(k)) e.preventDefault();
    if (k === 'm' || k === 'M') { audio.setMuted(!audio.muted); return; }
    if (mode !== 'play' && mode !== 'klaxon') {
      if (k === 'ArrowDown' || k === 'PageDown') { docScroll += k === 'PageDown' ? 20 : 1; return; }
      if (k === 'ArrowUp' || k === 'PageUp') { docScroll -= k === 'PageUp' ? 20 : 1; return; }
      const id = k === 'Enter' || k === ' ' ? 'doc:ENTER' : `doc:${k}`;
      const fn = docActs.get(id) ?? (k === 'Enter' ? docActs.get('doc:1') : undefined);
      if (fn) { audio.play('key'); fn(); }
      return;
    }
    if (mode === 'klaxon') return;
    if (PAGE_KEYS[k]) { ui.page = PAGE_KEYS[k]; audio.play('key'); return; }
    if (k === '[' || k === ']') {
      const i = ORDER.indexOf(ui.page);
      ui.page = ORDER[(i + (k === ']' ? 1 : ORDER.length - 1)) % ORDER.length];
      audio.play('key');
      return;
    }
    if (/^[0-9]$/.test(k)) {
      const o = ui.opts.find((x) => x.key === k);
      if (o) { audio.play('key'); o.fn(); } else if (k === '0') goBack(ui);
      return;
    }
    if (k === 'Escape' || k === 'Backspace') {
      const o = ui.opts.find((x) => x.key === '0');
      if (o) o.fn(); else goBack(ui);
      return;
    }
    const lower = k.toLowerCase();
    if (lower === 'a') { g.ack(); return; }
    if (lower === 't') { say(g.procTick()); return; }
    if (lower === 'p') { g.procCycle(); return; }
    if (lower === 'x') { say(g.procClose()); return; }
  });

  canvas.addEventListener('mousemove', (e) => {
    const c = renderer.cellAt(e.clientX, e.clientY);
    hover = c ? screen.act[c.y * 100 + c.x] : null;
    canvas.style.cursor = hover ? 'pointer' : 'default';
  });
  canvas.addEventListener('click', (e) => {
    audio.start();
    const c = renderer.cellAt(e.clientX, e.clientY);
    if (!c) return;
    const id = screen.act[c.y * 100 + c.x];
    if (!id) return;
    audio.play('key');
    const fn = id.startsWith('doc:') ? docActs.get(id) : ui.actions.get(id);
    fn?.();
  });
  canvas.addEventListener('wheel', (e) => { if (mode !== 'play') docScroll += Math.sign(e.deltaY) * 2; }, { passive: true });
  window.addEventListener('resize', () => renderer.resize());

  document.fonts.load('20px "VT323"').finally(() => requestAnimationFrame(frame));
}
