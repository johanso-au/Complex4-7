// Terminal HMI pages. Each page draws into the main view and adds numbered options
// to the prompt line. Colour is reserved for state.
import type { Game, SysPage, TrendKey } from '../sim/game';
import { textLen } from '../sim/game';
import { PROC_BY_ID, PROCEDURES } from '../content/procedures';
import { VERDICT_LABEL, type Verdict } from '../content/messages';
import { BANDS, CODE_BINDER, DISPATCH, MANUAL } from '../content/binder';
import { clockStr, hhmmZ, hhmmssZ } from '../sim/time';
import { C, COLS, Screen, View, wrapText } from './screen';

export type PageId = 'F1' | 'F2' | 'F3' | 'F4' | 'F6' | 'F8' | 'F9';
export interface Opt { key: string; label: string; fn: () => void }

export interface UIState {
  page: PageId;
  f3: SysPage | null;
  f3sel: string | null;
  f3det: boolean;
  trendSet: number;
  trendWin: '2H' | '10M';
  inboxSel: string | null;
  comms: null | 'radio' | 'phone';
  binderSel: number | null;
  woSel: string | null;
  feedback: string;
  feedbackT: number;
  opts: Opt[];
  actions: Map<string, () => void>;
  seenComms: number;
}

export function newUI(): UIState {
  return {
    page: 'F1', f3: null, f3sel: null, f3det: false, trendSet: 0, trendWin: '2H', inboxSel: null, comms: null,
    binderSel: null, woSel: null, feedback: '', feedbackT: 0, opts: [], actions: new Map(), seenComms: 0,
  };
}

const HB = ['|', '/', '-', '\\'];
export const PAGES: [PageId | 'F5' | 'F7', string][] = [
  ['F1', 'OVERVIEW'], ['F2', 'TRENDS'], ['F3', 'FACILITY'], ['F4', 'INBOX'], ['F5', 'DOOR'], ['F6', 'COMMS'], ['F7', 'LAUNCH'], ['F8', 'BINDER'], ['F9', 'WORK'],
];

const lampCh = (_on: boolean) => '■';
const lampC = (on: boolean, c: number = C.GREEN) => (on ? c : C.DARK);
const f = (v: number, d: number, w = 0) => v.toFixed(d).padStart(w);

/** Context passed to every page. */
interface Ctx { g: Game; ui: UIState; v: View; side: View; opts: Opt[]; say: (s: string) => void; act: (id: string, fn: () => void) => string }

// ─────────────────────────────── frame ───────────────────────────────

export function renderGame(g: Game, ui: UIState, s: Screen, blinkOn: boolean) {
  s.clear();
  ui.actions.clear();
  const opts: Opt[] = [];
  const act = (id: string, fn: () => void) => { ui.actions.set(id, fn); return id; };
  const say = (msg: string) => { if (msg) { ui.feedback = msg; ui.feedbackT = performance.now(); } };
  const full = s.view(0, 0, COLS, 36);

  // Top bar
  full.fill(0, 0, COLS, 1, ' ', C.BLACK, { bg: C.BAND });
  full.put(1, 0, 'LCC 4-7', C.CYAN, { bg: C.BAND });
  full.put(10, 0, clockStr(g.t), C.WHITE, { bg: C.BAND });
  full.put(33, 0, g.calm && g.started ? '▶▶' : '  ', C.DIM, { bg: C.BAND });
  const pname = PAGES.find((p) => p[0] === ui.page);
  full.put(37, 0, `${ui.page} ${pname ? pname[1] : ''}`, C.WHITE, { bg: C.BAND });
  const stC = g.status === 'STRATEGIC ALERT' ? C.GREEN : g.status === 'EVACUATION' ? C.RED : C.AMBER;
  full.put(COLS - g.status.length - 2, 0, g.status, stC, { bg: C.BAND, blink: g.status === 'EVACUATION' });

  // Tabs
  let x = 0;
  for (const [id, name] of PAGES) {
    const avail = id !== 'F5' && id !== 'F7';
    let label = avail ? `${id} ${name}` : id;
    if (id === 'F4') { const n = g.messages.filter((m) => !m.verdict).length; if (n) label += `(${n})`; }
    if (id === 'F6') { const n = g.comms.length - ui.seenComms; if (n > 0 && ui.page !== 'F6') label += `(${n})`; }
    const cur = id === ui.page;
    const col = !avail ? C.DARK : cur ? C.BLACK : C.GREEN;
    full.put(x, 1, ` ${label} `, col, { bg: cur ? C.GREEN : 0 });
    if (avail) full.click(x, 1, label.length + 2, act(`tab:${id}`, () => { ui.page = id as PageId; }));
    x += label.length + 3;
  }
  full.hline(0, 2, COLS);
  full.put(64, 2, '┬', C.DIM);
  full.vline(64, 3, 29);
  full.hline(0, 32, COLS);
  full.put(64, 32, '┴', C.DIM);

  const v = s.view(0, 3, 64, 29);
  const side = s.view(65, 3, 35, 29);
  const ctx: Ctx = { g, ui, v, side, opts, say, act };

  switch (ui.page) {
    case 'F1': pageOverview(ctx); break;
    case 'F2': pageTrends(ctx); break;
    case 'F3': pageFacility(ctx); break;
    case 'F4': pageInbox(ctx); break;
    case 'F6': pageComms(ctx); break;
    case 'F8': pageBinder(ctx); break;
    case 'F9': pageWork(ctx); break;
  }
  if (g.procs.length) procPane(ctx);
  else sideDefault(ctx);

  // Alarm banner
  const b = g.bannerAlarm();
  const nUn = g.alarms.filter((a) => !a.acked).length;
  if (b) {
    const bc = b.sev === 'red' ? C.RED : C.AMBER;
    const bbg = b.sev === 'red' ? C.REDBG : C.AMBERBG;
    full.fill(0, 33, COLS, 1, ' ', bc, { bg: bbg });
    full.put(1, 33, '[A] ACK', C.WHITE, { bg: bbg });
    full.put(10, 33, `■ ${hhmmssZ(b.tOn)}  ${b.text}${b.active ? '' : '  (RETURNED TO NORMAL)'}`, bc, { bg: bbg, blink: true });
    full.put(78, 33, `${nUn} UNACK`.padStart(10), C.WHITE, { bg: bbg });
    full.click(0, 33, 77, act('ack', () => g.ack()));
  } else {
    const nAct = g.alarms.filter((a) => a.active).length;
    full.put(1, 33, nAct ? `NO UNACKNOWLEDGED ALARMS  -  ${nAct} STANDING (F1)` : 'NO UNACKNOWLEDGED ALARMS', C.DIM);
  }
  const unread = g.comms.length - ui.seenComms;
  if (unread > 0 && ui.page !== 'F6') full.put(90, 33, `RADIO ${unread}`.padStart(9), C.CYAN, { bg: b ? (b.sev === 'red' ? C.REDBG : C.AMBERBG) : 0 });

  // Prompt line
  let px = 1;
  for (const o of opts) {
    const label = `${o.key} ${o.label}`;
    if (px + label.length > COLS - 1) break;
    full.put(px, 34, o.key, C.WHITE);
    full.put(px + o.key.length + 1, 34, o.label, C.GREEN);
    full.click(px, 34, label.length, act(`opt:${o.key}`, o.fn));
    px += label.length + 3;
  }
  if (!opts.length) full.put(1, 34, '_', C.GREEN, { blink: true });
  ui.opts = opts;

  // Feedback or hint line
  const recent = performance.now() - ui.feedbackT < 5000 && ui.feedback;
  if (recent) full.put(1, 35, `> ${ui.feedback}`, C.WHITE);
  else full.put(1, 35, 'F1-F9 PAGES  1-9 SELECT  0 BACK  A ACK  T TICK STEP  P NEXT LIST  X CLOSE LIST  M MUTE', C.DARK);
  void blinkOn;
}

// ─────────────────────────────── checklist pane ───────────────────────────────

function procPane({ g, side, act, say }: Ctx) {
  const p = g.procs[g.procFocus];
  const def = PROC_BY_ID[p.id];
  side.put(0, 0, `ACTIVE CHECKLIST ${g.procFocus + 1}/${g.procs.length}`, C.CYAN);
  if (g.procs.length > 1) { side.put(28, 0, '[P]', C.DIM); side.click(28, 0, 3, act('pcyc', () => g.procCycle())); }
  let y = 1;
  y += side.wrap(0, y, 35, `${def.id} ${def.title}`, C.WHITE);
  side.hline(0, y++, 35);
  const rows: { text: string[]; c: number; cur: boolean }[] = [];
  def.steps.forEach((st, i) => {
    const done = i < p.step;
    const cur = i === p.step;
    const box = done ? '[X]' : cur ? '[>]' : '[ ]';
    const tag = st.kind === 'action' ? 'DO ' : st.kind === 'confirm' ? 'CHK' : st.kind === 'wait' ? 'WT ' : 'NB ';
    const lines = wrapText(`${box}${String(i + 1).padStart(2)} ${tag} ${st.text}`, 35, 11);
    rows.push({ text: lines, c: done ? C.DIM : cur ? C.WHITE : C.GREEN, cur });
  });
  // Scroll so the current step is visible.
  const avail = 29 - y - 2;
  let start = 0;
  const curIdx = Math.min(p.step, rows.length - 1);
  const heightFrom = (a: number, b: number) => rows.slice(a, b + 1).reduce((n, r) => n + r.text.length, 0);
  while (start < curIdx && heightFrom(start, Math.min(rows.length - 1, curIdx + 2)) > avail) start++;
  for (let i = start; i < rows.length && y < 29 - 2; i++) {
    const r = rows[i];
    for (const line of r.text) {
      if (y >= 29 - 2) break;
      side.put(0, y, line, r.c);
      if (r.cur) side.click(0, y, 35, act('tick', () => say(g.procTick())));
      y++;
    }
  }
  side.hline(0, 27, 35);
  const st = def.steps[p.step];
  if (st && st.kind === 'wait') side.put(0, 28, 'WAITING...', C.DIM, { blink: true });
  else if (st) { side.put(0, 28, `[T] TICK ${p.step + 1}`, C.WHITE); side.click(0, 28, 12, act('tick2', () => say(g.procTick()))); }
  side.put(24, 28, '[X] CLOSE', C.DIM);
  side.click(24, 28, 9, act('pclose', () => say(g.procClose())));
}

function sideDefault({ g, ui, side, act }: Ctx) {
  switch (ui.page) {
    case 'F1': {
      side.put(0, 0, 'ALARM SUMMARY', C.CYAN);
      const list = [...g.alarms].reverse();
      if (!list.length) side.put(0, 2, 'NO ALARMS', C.DIM);
      list.slice(0, 26).forEach((a, i) => {
        const c = a.sev === 'red' ? C.RED : C.AMBER;
        side.put(0, 2 + i, hhmmZ(a.tOn), C.DIM);
        side.put(6, 2 + i, '■', a.active ? c : C.DIM, { blink: !a.acked });
        side.put(8, 2 + i, a.text.slice(0, 27), a.active ? c : C.DIM);
      });
      break;
    }
    case 'F2': case 'F3': BANDS.forEach((l, i) => side.put(0, i, l, i === 0 ? C.CYAN : C.GREEN)); break;
    case 'F4': CODE_BINDER.forEach((l, i) => side.put(0, i, l, i === 0 ? C.CYAN : l.startsWith(' R') ? C.WHITE : C.GREEN)); break;
    case 'F6': {
      side.put(0, 0, 'PERSONNEL', C.CYAN);
      const rows: [string, string][] = [
        ['LT WHITLOCK', 'LCC'], ['SSGT ORTIZ', 'LCC'],
        ['A1C PRUITT', g.pruitt.loc === 'SILO' ? `SILO ${g.zones[g.pruitt.zone ?? 0].levels}` : g.pruitt.loc],
      ];
      for (const tm of Object.values(g.teams)) {
        if (tm.loc === 'NONE') continue;
        const where = tm.loc === 'SILO' ? `SILO ${g.zones[tm.zone].levels}` : tm.loc === 'LEAVING' ? 'CABLEWAY' : tm.loc;
        rows.push([`${tm.wo} TEAM`, where]);
      }
      rows.forEach(([n, w], i) => { side.put(0, 2 + i, n, C.GREEN); side.put(18, 2 + i, w, w.startsWith('SILO') ? C.AMBER : C.WHITE); });
      side.put(0, 12, 'LINES', C.CYAN);
      side.put(0, 13, 'RADIO NET    ', C.GREEN); side.put(13, 13, g.power.busLive ? 'UP' : 'DOWN (NO POWER)', g.power.busLive ? C.WHITE : C.RED);
      side.put(0, 14, 'PHONE (HARDENED)', C.GREEN); side.put(18, 14, 'UP', C.WHITE);
      side.put(0, 15, 'TELETYPE     ', C.GREEN); side.put(13, 15, g.power.busLive ? 'UP' : 'DOWN (NO POWER)', g.power.busLive ? C.WHITE : C.RED);
      break;
    }
    case 'F8': BANDS.forEach((l, i) => side.put(0, i, l, i === 0 ? C.CYAN : C.GREEN)); break;
    case 'F9': DISPATCH.forEach((l, i) => side.put(0, i, l, i === 0 ? C.CYAN : C.GREEN)); break;
  }
  void act;
}

// ─────────────────────────────── F1 overview ───────────────────────────────

function pageOverview({ g, v }: Ctx) {
  v.put(0, 0, 'SILO MIMIC  LAUNCH COMPLEX 4-7', C.CYAN);
  v.put(55, 0, `SCAN ${HB[g.scanCount % 4]}`, C.DIM);
  const L = g.ind.lamps;
  v.segs(0, 1, [['CLOSURE DOOR ', C.GREEN], ['■', C.WHITE], [' CLSD ', C.GREEN], ['■', C.DARK], [' OPEN', C.GREEN]]);
  // Silo column
  v.put(3, 2, '┌─────────────────┐', C.DIM);
  const zoneRows = [3, 7, 11];
  for (let lv = 1; lv <= 9; lv++) {
    const z = lv <= 3 ? 0 : lv <= 6 ? 1 : 2;
    const y = zoneRows[z] + ((lv - 1) % 3);
    const zone = g.zones[z];
    const vmax = Math.max(...zone.sensors.map((id) => (g.sensors[id].tagged ? 0 : g.ind.VD[id])));
    const bg = vmax > 25 ? C.REDBG : vmax > 10 ? C.AMBERBG : 0;
    v.put(0, y, `L${lv}`, C.GREEN);
    v.put(3, y, '│', C.DIM);
    v.fill(4, y, 17, 1, ' ', C.GREEN, { bg });
    v.put(9, y, lv === 1 ? ' ▲ ' : lv <= 3 ? '▐█▌' : '▐█▌', C.DIM, { bg });
    v.put(21, y, '│', C.DIM);
  }
  v.put(3, 6, '├─────────────────┤', C.DIM);
  v.put(3, 10, '├─────────────────┤', C.DIM);
  v.put(3, 14, '└────────┬────────┘', C.DIM);
  // Occupancy markers on the level the people are on.
  for (const z of g.zones) {
    const occ = g.zoneOccupancy(z.idx);
    if (occ.length) {
      const vmax = Math.max(...z.sensors.map((id) => (g.sensors[id].tagged ? 0 : g.ind.VD[id])));
      const bg = vmax > 25 ? C.REDBG : vmax > 10 ? C.AMBERBG : 0;
      v.put(14, zoneRows[z.idx], `▪${occ.length}`, C.AMBER, { bg, blink: vmax > 25 });
    }
  }
  const leaving = Object.values(g.teams).filter((t) => t.loc === 'LEAVING').reduce((n, t) => n + t.names.length, 0) + (g.pruitt.loc === 'TRANSIT' ? 1 : 0);
  v.put(0, 15, 'CABLEWAY', C.GREEN);
  v.put(12, 15, '│', C.DIM);
  v.put(13, 15, leaving ? `▪${leaving}` : '  ', C.AMBER);
  v.put(0, 16, 'LCC  BLAST DOOR 1 ', C.GREEN); v.put(18, 16, '■', C.WHITE); v.put(20, 16, 'CLSD', C.GREEN);
  v.put(5, 17, 'BLAST DOOR 2 ', C.GREEN); v.put(18, 17, '■', C.WHITE); v.put(20, 17, 'CLSD', C.GREEN);

  // Zone table
  for (const z of g.zones) {
    const y = zoneRows[z.idx];
    const fan = g.fans[z.fan];
    const dmp = g.dampers[z.damper];
    v.segs(24, y, [
      [`${z.name} ${z.levels} `, C.CYAN], [z.fan, C.GREEN], [' ', C.GREEN], [lampCh(L[`${z.fan} RUN`]), lampC(L[`${z.fan} RUN`])], [' RUN ', C.GREEN],
      [z.damper, C.GREEN], [' ', C.GREEN], [lampCh(L[`${z.damper} OPEN`]), lampC(L[`${z.damper} OPEN`])], [' OPN', C.GREEN],
    ]);
    if (fan.tag || dmp.tag) v.put(58, y + 2, 'TAGGED', C.AMBER);
    const af = g.ind.AF[z.idx];
    v.segs(24, y + 1, [['FLOW ', C.GREEN], [f(af, 0, 4), af < 1500 ? C.AMBER : C.WHITE], [' CFM SEL ', C.GREEN], [fan.sel.padEnd(4), fan.sel === 'RUN' ? C.WHITE : C.AMBER]]);
    let vx = 49;
    for (const id of z.sensors) {
      const r = g.ind.VD[id];
      const tg = g.sensors[id].tagged;
      const c = tg ? C.DIM : r > 25 ? C.RED : r > 10 ? C.AMBER : C.WHITE;
      v.put(vx, y + 1, `${id.slice(-1)} ${tg ? ' TAG' : f(r, 1, 4)}`, c);
      vx += 8;
    }
    const occ = g.zoneOccupancy(z.idx);
    v.put(24, y + 2, `OCC ${occ.length ? occ.join(', ') : '--'}`.slice(0, 33), occ.length ? C.AMBER : C.DIM);
  }
  v.put(49, 2, 'VAPOUR %LEL', C.DIM);

  // Propellants and power summary
  v.hline(0, 19, 64);
  v.put(0, 20, 'PROPELLANTS        PSIG  BAND', C.CYAN);
  const tanks: ['S1F' | 'S2F' | 'S1O' | 'S2O', string][] = [['S1F', 'S1 FUEL'], ['S2F', 'S2 FUEL'], ['S1O', 'S1 OXID'], ['S2O', 'S2 OXID']];
  tanks.forEach(([k, label], i) => {
    const tk = g.tanks[k];
    const val = g.ind[k];
    const out = val < tk.lo || val > tk.hi;
    v.segs(0, 21 + i, [[label.padEnd(16), C.GREEN], [f(val, 2, 7), out ? C.AMBER : C.WHITE], [`  ${tk.lo.toFixed(1)}-${tk.hi.toFixed(1)}`, C.DIM]]);
  });
  v.segs(0, 25, [['N2 SUPPLY       ', C.GREEN], [f(g.ind.N2, 0, 7), g.ind.N2 < 1200 ? C.AMBER : C.WHITE]]);
  v.segs(0, 26, [['VLV N2-F1 ', C.GREEN], ['■', lampC(L['VLV N2-F1 OPEN'])], [' OPEN  VLV N2-F2 ', C.GREEN], ['■', lampC(L['VLV N2-F2 OPEN'])], [' OPEN', C.GREEN]]);
  v.vline(34, 20, 8);
  v.put(36, 20, 'POWER', C.CYAN);
  v.segs(36, 21, [['COMMERCIAL ', C.GREEN], [f(g.ind.COMMV, 0, 4), g.ind.COMMV < 400 ? C.RED : C.WHITE], [' V', C.GREEN]]);
  v.segs(36, 22, [['CB-1 ', C.GREEN], ['■', lampC(L['CB-1 CLOSED'])], [' CLSD  CB-2 ', C.GREEN], ['■', lampC(L['CB-2 CLOSED'])], [' CLSD', C.GREEN]]);
  v.segs(36, 23, [['DG-1 ', C.GREEN], [g.power.dgSel.padEnd(5), g.power.dgSel === 'AUTO' ? C.WHITE : C.AMBER], ['■', lampC(L['DG-1 RUN'])], [' RUN', C.GREEN]]);
  v.segs(36, 24, [['BUS ', C.GREEN], [f(g.ind.BUSV, 0, 4), g.ind.BUSV < 456 ? C.RED : C.WHITE], [' V ', C.GREEN], [f(g.ind.BUSHZ, 2, 5), Math.abs(g.ind.BUSHZ - 60) > 0.5 ? C.RED : C.WHITE], [' HZ', C.GREEN]]);
  v.segs(36, 25, [['BATT ', C.GREEN], [f(g.ind.BATT, 1, 5), C.WHITE], [' VDC', C.GREEN]]);
  v.hline(0, 28, 64);
}

// ─────────────────────────────── F2 trends ───────────────────────────────

interface TrendSpec { key: TrendKey; label: string; unit: string; lo: number; hi: number; band: [number, number]; dec: number; rate?: boolean; also?: TrendKey }
const TREND_SETS: { name: string; specs: TrendSpec[] }[] = [
  {
    name: 'PROPELLANT', specs: [
      { key: 'S1F', label: 'S1 FUEL PRESS', unit: 'PSIG', lo: 8, hi: 16, band: [11, 15], dec: 2, rate: true },
      { key: 'S2F', label: 'S2 FUEL PRESS', unit: 'PSIG', lo: 8, hi: 16, band: [11, 15], dec: 2, rate: true },
      { key: 'S1O', label: 'S1 OXID PRESS', unit: 'PSIG', lo: 13, hi: 23, band: [16, 20], dec: 2 },
    ],
  },
  {
    name: 'VAPOUR', specs: [
      { key: 'VD L2-A', also: 'VD L2-B', label: 'VAPOUR L2 A/B', unit: '%LEL', lo: 0, hi: 40, band: [0, 10], dec: 1 },
      { key: 'VD L4-A', also: 'VD L4-B', label: 'VAPOUR L4 A/B', unit: '%LEL', lo: 0, hi: 40, band: [0, 10], dec: 1 },
      { key: 'VD L7-A', also: 'VD L7-B', label: 'VAPOUR L7 A/B', unit: '%LEL', lo: 0, hi: 40, band: [0, 10], dec: 1 },
    ],
  },
  {
    name: 'AIRFLOW', specs: [
      { key: 'AF1', label: 'Z1 L1-3 AIRFLOW', unit: 'CFM', lo: 0, hi: 3000, band: [1500, 3000], dec: 0 },
      { key: 'AF2', label: 'Z2 L4-6 AIRFLOW', unit: 'CFM', lo: 0, hi: 3000, band: [1500, 3000], dec: 0 },
      { key: 'AF3', label: 'Z3 L7-9 AIRFLOW', unit: 'CFM', lo: 0, hi: 3000, band: [1500, 3000], dec: 0 },
    ],
  },
  {
    name: 'POWER/N2', specs: [
      { key: 'BUSV', label: 'MAIN BUS', unit: 'V', lo: 0, hi: 600, band: [456, 504], dec: 0 },
      { key: 'BUSHZ', label: 'MAIN BUS FREQ', unit: 'HZ', lo: 50, hi: 65, band: [59.5, 60.5], dec: 2 },
      { key: 'N2', label: 'N2 SUPPLY', unit: 'PSIG', lo: 0, hi: 3000, band: [1200, 3000], dec: 0 },
    ],
  },
];

function pageTrends({ g, ui, v, opts }: Ctx) {
  const set = TREND_SETS[ui.trendSet];
  const win = ui.trendWin === '2H' ? 7200 : 600;
  v.put(0, 0, `TRENDS  ${set.name}`, C.CYAN);
  v.put(30, 0, `WINDOW ${ui.trendWin === '2H' ? '2 HR' : '10 MIN'}`, C.WHITE);
  v.put(55, 0, `SCAN ${HB[g.scanCount % 4]}`, C.DIM);
  const W = 54;
  const H = 6;
  set.specs.forEach((sp, gi) => {
    const y0 = 2 + gi * 9;
    const tr = g.trends[sp.key];
    const cur = tr.since(g.t - 3);
    const last = cur.length ? cur[cur.length - 1].v : 0;
    const head: [string, number][] = [[sp.label.padEnd(16), C.GREEN], [f(last, sp.dec, 7), last < sp.band[0] || last > sp.band[1] ? C.AMBER : C.WHITE], [` ${sp.unit}`, C.GREEN]];
    if (sp.also) {
      const c2 = g.trends[sp.also].since(g.t - 3);
      const l2 = c2.length ? c2[c2.length - 1].v : 0;
      head.push(['  B', C.GREEN], [f(l2, sp.dec, 6), C.CYAN]);
    }
    if (sp.rate) {
      const r = g.rate(sp.key);
      head.push(['  RATE ', C.GREEN], [`${r >= 0 ? '+' : ''}${r.toFixed(3)}/MIN`, r < -0.1 ? C.RED : C.WHITE]);
    }
    v.segs(0, y0, head);
    // Axis labels
    v.put(0, y0 + 1, f(sp.hi, sp.dec > 1 ? 0 : sp.dec, 6), C.DIM);
    v.put(0, y0 + H, f(sp.lo, sp.dec > 1 ? 0 : sp.dec, 6), C.DIM);
    const px = 8;
    // Band shading
    for (let r = 0; r < H; r++) {
      const vTop = sp.hi - ((sp.hi - sp.lo) * r) / H;
      const vBot = sp.hi - ((sp.hi - sp.lo) * (r + 1)) / H;
      const inBand = vBot >= sp.band[0] - 1e-9 && vTop <= sp.band[1] + 1e-9;
      v.fill(px, y0 + 1 + r, W, 1, ' ', C.GREEN, { bg: inBand ? C.BAND : 0 });
      v.put(px - 1, y0 + 1 + r, '│', C.DARK);
    }
    v.put(px - 1, y0 + 1 + H, '└' + '─'.repeat(W), C.DARK);
    v.put(px, y0 + 2 + H, `-${ui.trendWin === '2H' ? '2H' : '10M'}`, C.DIM);
    v.put(px + W - 3, y0 + 2 + H, 'NOW', C.DIM);
    const plot = (key: TrendKey, col: number) => {
      const samples = g.trends[key].since(g.t - win);
      const buckets: (number | undefined)[] = new Array(W).fill(undefined);
      for (const s of samples) {
        const b = Math.min(W - 1, Math.floor(((s.t - (g.t - win)) / win) * W));
        if (b >= 0) buckets[b] = s.v;
      }
      for (let c = 0; c < W; c++) {
        const val = buckets[c];
        if (val === undefined) continue;
        const frac = (sp.hi - Math.max(sp.lo, Math.min(sp.hi, val))) / (sp.hi - sp.lo);
        const half = Math.min(H * 2 - 1, Math.floor(frac * H * 2));
        const row = Math.floor(half / 2);
        const r = y0 + 1 + row;
        const i = (v.y + r) * COLS + v.x + px + c;
        const existing = v.s.ch[i];
        const ch = half % 2 === 0 ? '▀' : '▄';
        const merged = (existing === '▀' && ch === '▄') || (existing === '▄' && ch === '▀') ? '█' : ch;
        v.s.ch[i] = merged;
        v.s.fg[i] = col;
      }
    };
    if (sp.also) plot(sp.also, C.CYAN);
    plot(sp.key, val0Colour(last, sp));
  });
  opts.push(
    { key: '1', label: 'PROPELLANT', fn: () => { ui.trendSet = 0; } },
    { key: '2', label: 'VAPOUR', fn: () => { ui.trendSet = 1; } },
    { key: '3', label: 'AIRFLOW', fn: () => { ui.trendSet = 2; } },
    { key: '4', label: 'POWER/N2', fn: () => { ui.trendSet = 3; } },
    { key: '5', label: ui.trendWin === '2H' ? 'ZOOM 10 MIN' : 'WIDEN 2 HR', fn: () => { ui.trendWin = ui.trendWin === '2H' ? '10M' : '2H'; } },
  );
}

const val0Colour = (v: number, sp: TrendSpec) => (v < sp.band[0] || v > sp.band[1] ? C.AMBER : C.GREEN);

// ─────────────────────────────── F3 facility ───────────────────────────────

function pageFacility(c: Ctx) {
  const { g, ui, v, opts, say } = c;
  if (!ui.f3) {
    v.put(0, 0, 'FACILITY  SYSTEM MENU', C.CYAN);
    const rows: [string, SysPage, string][] = [
      ['1', 'power', `ELECTRICAL POWER       BUS ${g.ind.BUSV.toFixed(0)} V  ${g.power.cb2 ? 'ON DIESEL' : 'COMMERCIAL'}`],
      ['2', 'prop', `PROPELLANTS AND N2     S1 FUEL ${g.ind.S1F.toFixed(2)} PSIG`],
      ['3', 'vent', 'VENTILATION AND VAPOUR'],
    ];
    rows.forEach(([k, id, label], i) => {
      v.put(2, 2 + i * 2, k, C.WHITE);
      v.put(5, 2 + i * 2, label, C.GREEN);
      v.click(0, 2 + i * 2, 64, c.act(`sys${k}`, () => { ui.f3 = id; ui.f3sel = null; }));
      const pt = g.pointTest[id];
      v.put(5, 3 + i * 2, `POINT TEST TODAY: ${pt.done ? 'DONE' : 'NOT RUN'}`, pt.done ? C.DIM : C.AMBER);
    });
    v.put(2, 10, '4  BLAST PROTECTION      ', C.DARK); v.put(27, 10, 'NOT IN THIS BUILD', C.DARK);
    v.put(2, 11, '5  FIRE AND DELUGE       ', C.DARK); v.put(27, 11, 'NOT IN THIS BUILD', C.DARK);
    v.put(2, 12, '6  HYDRAULICS / DOORS    ', C.DARK); v.put(27, 12, 'NOT IN THIS BUILD', C.DARK);
    opts.push(
      { key: '1', label: 'POWER', fn: () => { ui.f3 = 'power'; ui.f3sel = null; } },
      { key: '2', label: 'PROPELLANTS/N2', fn: () => { ui.f3 = 'prop'; ui.f3sel = null; } },
      { key: '3', label: 'VENT/VAPOUR', fn: () => { ui.f3 = 'vent'; ui.f3sel = null; } },
    );
    return;
  }
  const back = () => {
    if (ui.f3sel) ui.f3sel = null;
    else if (ui.f3det) ui.f3det = false;
    else ui.f3 = null;
  };
  const pt = g.pointTest[ui.f3];
  const testing = pt.until > g.t;
  v.put(55, 0, `SCAN ${HB[g.scanCount % 4]}`, C.DIM);
  if (testing) v.put(36, 0, 'POINT TEST', C.WHITE, { blink: true });
  if (ui.f3 === 'power') facPower(c);
  if (ui.f3 === 'prop') facProp(c);
  if (ui.f3 === 'vent') facVent(c);
  if (!ui.f3sel && !ui.f3det) {
    opts.push({ key: '9', label: 'POINT TEST', fn: () => say(g.startPointTest(ui.f3!)) });
  }
  opts.push({ key: '0', label: 'BACK', fn: back });
}

function compList(c: Ctx, y: number, items: [string, string, string][]) {
  const { v, ui, opts } = c;
  v.put(0, y, 'COMPONENTS', C.CYAN);
  items.forEach(([k, id, label], i) => {
    const sel = ui.f3sel === id;
    v.put(1, y + 1 + i, k, C.WHITE);
    v.put(4, y + 1 + i, label, sel ? C.BLACK : C.GREEN, { bg: sel ? C.GREEN : 0 });
    v.click(0, y + 1 + i, 50, c.act(`comp${id}`, () => { ui.f3sel = id; }));
    if (!ui.f3sel) opts.push({ key: k, label: id, fn: () => { ui.f3sel = id; } });
  });
}

function facPower(c: Ctx) {
  const { g, v, ui, opts, say } = c;
  const L = g.ind.lamps;
  v.put(0, 0, 'F3-1 ELECTRICAL POWER', C.CYAN);
  const live = g.ind.BUSV > 400;
  const lc = (on: boolean) => (on ? C.GREEN : C.DARK);
  v.put(0, 2, 'COMMERCIAL FEED', C.GREEN);
  v.put(16, 2, '──────', lc(g.ind.COMMV > 400));
  v.segs(22, 2, [['[CB-1 ', C.GREEN], ['■', lampC(L['CB-1 CLOSED'])], [']', C.GREEN]]);
  v.put(30, 2, '──────┬──', lc(L['CB-1 CLOSED'] && g.ind.COMMV > 400));
  v.put(39, 2, 'MAIN BUS 480V', live ? C.WHITE : C.RED);
  v.put(36, 3, '│', lc(live));
  v.put(0, 4, 'DG-1 DIESEL', C.GREEN);
  v.put(16, 4, '──────', lc(L['DG-1 RUN']));
  v.segs(22, 4, [['[CB-2 ', C.GREEN], ['■', lampC(L['CB-2 CLOSED'])], [']', C.GREEN]]);
  v.put(30, 4, '──────┘', lc(L['CB-2 CLOSED'] && L['DG-1 RUN']));
  v.put(39, 4, 'LOADS: FANS, PUMPS,', C.DIM);
  v.put(39, 5, 'COMMS, INSTRUMENTS', C.DIM);

  const rows: [string, [string, number][]][] = [
    ['COMMERCIAL', [[`${f(g.ind.COMMV, 0, 4)} V`, g.ind.COMMV < 400 ? C.RED : C.WHITE]]],
    ['CB-1', [['■', lampC(L['CB-1 CLOSED'])], [' CLOSED', C.GREEN]]],
    ['CB-2', [['■', lampC(L['CB-2 CLOSED'])], [' CLOSED', C.GREEN]]],
    ['DG-1', [['SEL ', C.GREEN], [g.power.dgSel.padEnd(5), g.power.dgSel === 'AUTO' ? C.WHITE : C.AMBER], ['■', lampC(L['DG-1 RUN'])], [' RUN', C.GREEN]]],
    ['MAIN BUS', [[`${f(g.ind.BUSV, 0, 4)} V  `, g.ind.BUSV < 456 ? C.RED : C.WHITE], [`${f(g.ind.BUSHZ, 2, 5)} HZ`, Math.abs(g.ind.BUSHZ - 60) > 0.5 ? C.RED : C.WHITE]]],
    ['DC BATTERY', [[`${f(g.ind.BATT, 1, 5)} VDC`, C.WHITE]]],
  ];
  rows.forEach(([k, segs], i) => { v.put(0, 7 + i, k, C.GREEN); v.segs(14, 7 + i, segs); });
  if (g.power.dgCrank > 0 && !g.power.dgRunning) v.put(34, 10, 'DG-1 CRANKING', C.AMBER, { blink: true });
  compList(c, 14, [['1', 'CB-1', 'CB-1  COMMERCIAL BREAKER'], ['2', 'CB-2', 'CB-2  DIESEL BREAKER'], ['3', 'DG-1', 'DG-1  DIESEL GENERATOR SELECTOR'], ['4', 'XFER', 'RETRANSFER TO COMMERCIAL (CLOSED TRANSITION)']]);
  if (ui.f3sel === 'CB-1' || ui.f3sel === 'CB-2') {
    const id = ui.f3sel as 'CB-1' | 'CB-2';
    opts.push({ key: '1', label: `${id} CLOSE`, fn: () => say(g.breaker(id, true)) }, { key: '2', label: `${id} OPEN`, fn: () => say(g.breaker(id, false)) });
  } else if (ui.f3sel === 'DG-1') {
    opts.push(
      { key: '1', label: 'SEL OFF', fn: () => say(g.dgSelect('OFF')) },
      { key: '2', label: 'SEL AUTO', fn: () => say(g.dgSelect('AUTO')) },
      { key: '3', label: 'SEL RUN', fn: () => say(g.dgSelect('RUN')) },
    );
  } else if (ui.f3sel === 'XFER') {
    opts.push({ key: '1', label: 'EXECUTE RETRANSFER', fn: () => say(g.retransfer()) });
  }
  ptStatus(c, 20);
}

function facProp(c: Ctx) {
  const { g, v, ui, opts, say } = c;
  const L = g.ind.lamps;
  v.put(0, 0, 'F3-2 PROPELLANTS AND NITROGEN', C.CYAN);
  v.segs(0, 2, [['N2 STORAGE ', C.GREEN], [f(g.ind.N2, 0, 5), g.ind.N2 < 1200 ? C.AMBER : C.WHITE], [' PSIG ──┬──', C.GREEN]]);
  const valveRow = (y: number, id: string, tank: 'S1F' | 'S2F', label: string, first: boolean) => {
    const vl = g.valves[id];
    v.put(first ? 24 : 24, y, first ? '' : '└──', C.GREEN);
    v.segs(27, y, [['[VLV ', C.GREEN], [id, C.WHITE], [' ', C.GREEN], ['■', lampC(L[`VLV ${id} OPEN`])], [']──', C.GREEN]]);
    const val = g.ind[tank];
    const tk = g.tanks[tank];
    v.segs(43, y, [[label + ' ', C.GREEN], [f(val, 2, 5), val < tk.lo || val > tk.hi ? C.AMBER : C.WHITE]]);
    if (vl.channelTagged) v.put(27, y + 1, 'CHANNEL TAGGED FAILED', C.AMBER);
    void first;
  };
  v.put(24, 3, '│', C.GREEN);
  valveRow(3, 'N2-F1', 'S1F', 'S1 FUEL', true);
  v.put(24, 3, '├──', C.GREEN);
  valveRow(5, 'N2-F2', 'S2F', 'S2 FUEL', false);
  v.put(24, 4, '│', C.GREEN);
  v.put(43, 4, '      PSIG', C.DIM);
  v.segs(0, 8, [['S1 OXID ', C.GREEN], [f(g.ind.S1O, 2, 6), C.WHITE], ['   S2 OXID ', C.GREEN], [f(g.ind.S2O, 2, 6), C.WHITE], [' PSIG', C.GREEN]]);
  v.segs(0, 9, [['FUEL TEMP ', C.GREEN], [f(g.ind.FT, 1, 5), C.WHITE], [' F   OXID TEMP ', C.GREEN], [f(g.ind.OT, 1, 5), C.WHITE], [' F', C.GREEN]]);
  const r = g.rate('S1F');
  v.segs(0, 10, [['S1 FUEL RATE ', C.GREEN], [`${r >= 0 ? '+' : ''}${r.toFixed(3)} PSI/MIN`, r < -0.1 ? C.RED : C.WHITE]]);
  compList(c, 13, [['1', 'N2-F1', 'VLV N2-F1  NITROGEN TO S1 FUEL'], ['2', 'N2-F2', 'VLV N2-F2  NITROGEN TO S2 FUEL']]);
  if (ui.f3sel === 'N2-F1' || ui.f3sel === 'N2-F2') {
    const id = ui.f3sel;
    opts.push(
      { key: '1', label: 'OPEN', fn: () => say(g.valveCmd(id, true)) },
      { key: '2', label: 'CLOSE', fn: () => say(g.valveCmd(id, false)) },
      { key: '3', label: 'TAG CHANNEL FAILED', fn: () => say(g.tagChannel(id)) },
    );
    const vl = g.valves[id];
    v.put(0, 17, `${id}  COMMANDED ${vl.cmdOpen ? 'OPEN' : 'CLOSED'}`, C.DIM);
  }
  ptStatus(c, 20);
}

function facVent(c: Ctx) {
  const { g, v, ui, opts, say } = c;
  const L = g.ind.lamps;
  v.put(0, 0, 'F3-3 VENTILATION AND VAPOUR', C.CYAN);
  v.put(0, 2, 'ZONE      FAN       SEL  RUN  DAMPER    OPN  FLOW CFM', C.DIM);
  g.zones.forEach((z, i) => {
    const fan = g.fans[z.fan];
    const y = 3 + i;
    v.segs(0, y, [
      [`${z.name} ${z.levels}  `, C.CYAN], [z.fan.padEnd(10), C.GREEN], [fan.sel.padEnd(5), fan.sel === 'RUN' ? C.WHITE : C.AMBER],
      [' ■', lampC(L[`${z.fan} RUN`])], ['   ', C.GREEN], [z.damper.padEnd(10), C.GREEN], [' ■', lampC(L[`${z.damper} OPEN`])],
      ['  ', C.GREEN], [f(g.ind.AF[i], 0, 6), g.ind.AF[i] < 1500 ? C.AMBER : C.WHITE],
    ]);
    if (fan.tag) v.put(60, y, 'TAG', C.AMBER);
  });
  v.put(0, 7, 'DETECTOR   %LEL   DETECTOR   %LEL', C.DIM);
  g.zones.forEach((z, i) => {
    z.sensors.forEach((id, k) => {
      const s = g.sensors[id];
      const r = g.ind.VD[id];
      const col = s.tagged ? C.DIM : r > 25 ? C.RED : r > 10 ? C.AMBER : C.WHITE;
      v.segs(k * 19, 8 + i, [[id.padEnd(10), C.GREEN], [s.tagged ? '  TAG' : f(r, 1, 5), col]]);
    });
  });
  if (ui.f3det) {
    v.put(0, 13, 'DETECTORS', C.CYAN);
    const ids = Object.keys(g.sensors);
    ids.forEach((id, i) => {
      const sel = ui.f3sel === id;
      v.put(1, 14 + i, String(i + 1), C.WHITE);
      v.put(4, 14 + i, `${id}${g.sensors[id].tagged ? '  TAGGED OUT' : ''}`, sel ? C.BLACK : C.GREEN, { bg: sel ? C.GREEN : 0 });
      v.click(0, 14 + i, 40, c.act(`det${id}`, () => { ui.f3sel = id; }));
      if (!ui.f3sel) opts.push({ key: String(i + 1), label: id.slice(3), fn: () => { ui.f3sel = id; } });
    });
    if (ui.f3sel && g.sensors[ui.f3sel]) {
      const id = ui.f3sel;
      opts.push({ key: '1', label: 'TAG OUT', fn: () => say(g.sensorTag(id, true)) }, { key: '2', label: 'RETURN TO SERVICE', fn: () => say(g.sensorTag(id, false)) });
    }
  } else {
    compList(c, 12, [
      ['1', 'FAN L2-A', 'FAN L2-A  Z1 EXHAUST'], ['2', 'FAN L4-A', 'FAN L4-A  Z2 EXHAUST'], ['3', 'FAN L7-A', 'FAN L7-A  Z3 EXHAUST'],
      ['4', 'DMP L2-2', 'DMP L2-2  Z1 DAMPER'], ['5', 'DMP L4-2', 'DMP L4-2  Z2 DAMPER'], ['6', 'DMP L7-2', 'DMP L7-2  Z3 DAMPER'],
    ]);
    v.put(1, 19, '7', C.WHITE); v.put(4, 19, 'VAPOUR DETECTORS', C.GREEN);
    v.click(0, 19, 40, c.act('dets', () => { ui.f3det = true; ui.f3sel = null; }));
    if (!ui.f3sel) opts.push({ key: '7', label: 'DETECTORS', fn: () => { ui.f3det = true; } });
    const sel = ui.f3sel;
    if (sel && g.fans[sel]) {
      opts.push(
        { key: '1', label: 'SEL OFF', fn: () => say(g.fanSel(sel, 'OFF')) },
        { key: '2', label: 'SEL AUTO', fn: () => say(g.fanSel(sel, 'AUTO')) },
        { key: '3', label: 'SEL RUN', fn: () => say(g.fanSel(sel, 'RUN')) },
        { key: '4', label: 'START', fn: () => say(g.fanStart(sel)) },
        { key: '5', label: 'STOP', fn: () => say(g.fanStop(sel)) },
      );
      v.put(0, 21, `${sel}  SELECTOR ${g.fans[sel].sel}${g.fans[sel].tag ? `  TAGGED ${g.fans[sel].tag}` : ''}`, C.DIM);
    } else if (sel && g.dampers[sel]) {
      opts.push({ key: '1', label: 'OPEN', fn: () => say(g.damperCmd(sel, true)) }, { key: '2', label: 'CLOSE', fn: () => say(g.damperCmd(sel, false)) });
      const d = g.dampers[sel];
      v.put(0, 21, `${sel}  COMMANDED ${d.cmdOpen ? 'OPEN' : 'CLOSED'}${d.tag ? `  TAGGED ${d.tag}` : ''}`, C.DIM);
    }
  }
  ptStatus(c, 23);
}

function ptStatus({ g, ui, v }: Ctx, y: number) {
  const pt = g.pointTest[ui.f3!];
  v.put(0, y + 4, `POINT TEST: ${pt.until > g.t ? 'RUNNING - CHECK EVERY POINT' : pt.done ? 'RUN THIS SHIFT' : 'NOT RUN THIS SHIFT (WO 7-100)'}`, pt.until > g.t ? C.WHITE : pt.done ? C.DIM : C.AMBER);
}

// ─────────────────────────────── F4 inbox ───────────────────────────────

function pageInbox(c: Ctx) {
  const { g, ui, v, opts, say } = c;
  v.put(0, 0, 'TELETYPE INBOX', C.CYAN);
  v.put(40, 0, `TELETYPE ${g.power.busLive ? 'ON LINE' : 'NO POWER'}`, g.power.busLive ? C.DIM : C.RED);
  const msgs = [...g.messages];
  if (!ui.inboxSel || !msgs.some((m) => m.def.id === ui.inboxSel)) {
    const un = msgs.find((m) => !m.verdict);
    ui.inboxSel = un ? un.def.id : msgs.length ? msgs[msgs.length - 1].def.id : null;
  }
  const show = msgs.slice(-8);
  show.forEach((m, i) => {
    const sel = m.def.id === ui.inboxSel;
    const printing = m.printed < textLen(m.def);
    const st = printing ? 'PRINTING' : m.verdict ? VERDICT_LABEL[m.verdict] : 'UNANSWERED';
    const col = sel ? C.BLACK : m.verdict ? C.DIM : C.WHITE;
    v.put(0, 1 + i, ` ${m.def.id}  ${hhmmZ(m.tArrive)}  ${m.def.subject.padEnd(20)} ${st}`.padEnd(64), col, { bg: sel ? C.GREEN : 0, blink: !sel && printing });
    v.click(0, 1 + i, 64, c.act(`msg${m.def.id}`, () => { ui.inboxSel = m.def.id; }));
  });
  if (!msgs.length) v.put(1, 2, 'NO TRAFFIC THIS SHIFT', C.DIM);
  v.hline(0, 10, 64);
  const m = msgs.find((x) => x.def.id === ui.inboxSel);
  if (!m) return;
  // Paper: the printed portion of the message
  const lines = m.def.lines;
  let left = m.printed;
  v.fill(2, 11, 46, lines.length + 2, ' ', C.BLACK, { bg: C.PAPER });
  lines.forEach((l, i) => {
    if (left <= 0) return;
    const part = l.slice(0, Math.max(0, Math.floor(left)));
    v.put(4, 12 + i, part, C.BLACK, { bg: C.PAPER });
    left -= l.length + 1;
  });
  if (m.verdict) v.put(36, 12, m.verdict === 'FILE' ? 'FILED' : m.verdict, m.verdict === 'INVALID' || m.verdict === 'RETRANSMIT' ? C.RED : C.BLACK, { bg: C.PAPER });
  const idx = msgs.indexOf(m);
  if (m.printed >= textLen(m.def) && !m.verdict) {
    const verdicts: Verdict[] = m.def.kind === 'info' ? ['FILE'] : ['ACT', 'EXERCISE', 'INVALID', 'RETRANSMIT'];
    v.put(2, 21, 'STAMP:', C.CYAN);
    verdicts.forEach((vd, i) => {
      const k = String(i + 1);
      v.put(10, 21 + i, `${k} ${VERDICT_LABEL[vd]}`, C.WHITE);
      v.click(10, 21 + i, 34, c.act(`vd${vd}`, () => say(g.answer(m.def.id, vd))));
      opts.push({ key: k, label: VERDICT_LABEL[vd], fn: () => say(g.answer(m.def.id, vd)) });
    });
  } else if (m.verdict) {
    v.put(2, 21, `STAMPED ${VERDICT_LABEL[m.verdict]} AT ${hhmmZ(m.tVerdict!)}`, C.DIM);
  }
  if (idx > 0) opts.push({ key: '8', label: 'PREV', fn: () => { ui.inboxSel = msgs[idx - 1].def.id; } });
  if (idx < msgs.length - 1) opts.push({ key: '9', label: 'NEXT', fn: () => { ui.inboxSel = msgs[idx + 1].def.id; } });
}

// ─────────────────────────────── F6 comms ───────────────────────────────

const CH_COLOUR: Record<string, number> = { LCC: C.WHITE, YOU: C.AMBER, CP: C.CYAN, MAINT: C.CYAN, SECURITY: C.GREEN, PRUITT: C.GREEN, 'L4 TEAM': C.GREEN, TEAM: C.GREEN };

function pageComms(c: Ctx) {
  const { g, ui, v, opts, say } = c;
  ui.seenComms = g.comms.length;
  v.put(0, 0, 'COMMS  RADIO AND PHONE LOG', C.CYAN);
  // Build wrapped lines from the end until the log area is full.
  const area = ui.comms ? 15 : 24;
  const out: { text: string; c: number }[] = [];
  for (let i = g.comms.length - 1; i >= 0 && out.length < area; i--) {
    const l = g.comms[i];
    const body = l.text.slice(0, Math.floor(l.shown));
    const typing = l.shown < l.text.length;
    const head = `${hhmmZ(l.t)} ${l.ch}`.padEnd(15);
    const wrapped = wrapText(`${head}${body}${typing ? '_' : ''}`, 64, 15);
    for (let k = wrapped.length - 1; k >= 0 && out.length < area; k--) out.unshift({ text: wrapped[k], c: CH_COLOUR[l.ch] ?? C.GREEN });
  }
  out.forEach((l, i) => {
    v.put(0, 1 + i, l.text.slice(0, 15), C.DIM);
    v.put(15, 1 + i, l.text.slice(15), l.c);
  });
  if (!g.comms.length) v.put(0, 2, 'NO TRAFFIC', C.DIM);
  const y0 = area + 2;
  v.hline(0, y0 - 1, 64);
  if (!ui.comms) {
    v.put(0, y0, '1  RADIO   (SILO TEAMS, PA, CREW)', C.GREEN);
    v.put(0, y0 + 1, `2  PHONE   (COMMAND POST, MAINTENANCE CONTROL)${g.commsBusy() ? '  - ON A CALL' : ''}`, C.GREEN);
    opts.push({ key: '1', label: 'RADIO', fn: () => { ui.comms = 'radio'; } }, { key: '2', label: 'PHONE', fn: () => { ui.comms = 'phone'; } });
    return;
  }
  const list = ui.comms === 'radio' ? g.radioOptions() : g.phoneOptions();
  v.put(0, y0, ui.comms === 'radio' ? 'RADIO CALLS' : 'TELEPHONE', C.CYAN);
  if (!list.length) v.put(0, y0 + 1, ui.comms === 'phone' ? 'LINE BUSY: CALL IN PROGRESS' : 'NO CALLS AVAILABLE', C.DIM);
  list.slice(0, 8).forEach((o, i) => {
    const k = String(i + 1);
    v.put(1, y0 + 1 + i, `${k}  ${o.label}`, C.GREEN);
    const fn = () => { say(o.fn()); ui.comms = null; };
    v.click(0, y0 + 1 + i, 64, c.act(`com${i}`, fn));
    opts.push({ key: k, label: o.label.length > 22 ? o.label.slice(0, 21) + '.' : o.label, fn });
  });
  opts.push({ key: '0', label: 'BACK', fn: () => { ui.comms = null; } });
}

// ─────────────────────────────── F8 binder ───────────────────────────────

function binderPages(): { title: string; lines: string[]; proc?: string }[] {
  const pages: { title: string; lines: string[]; proc?: string }[] = [
    { title: 'HOW TO READ THIS TERMINAL', lines: MANUAL },
    { title: 'CODE BINDER - AUTHENTICATORS', lines: CODE_BINDER },
    { title: 'TOLERANCE BANDS', lines: BANDS },
  ];
  for (const p of PROCEDURES.filter((x) => x.id.startsWith('TO'))) {
    const lines = [`${p.id}  ${p.title}`, '', ...(p.intro ?? []), ''];
    p.steps.forEach((s, i) => {
      const tag = s.kind === 'action' ? 'DO ' : s.kind === 'confirm' ? 'CHK' : s.kind === 'wait' ? 'WT ' : 'NB ';
      lines.push(...wrapText(`${String(i + 1).padStart(2)}  ${tag}  ${s.text}`, 62, 9));
    });
    if (p.reference) lines.push('', '(REFERENCE PAGE)');
    pages.push({ title: `${p.id} ${p.title}`, lines, proc: p.reference ? undefined : p.id });
  }
  return pages;
}

function pageBinder(c: Ctx) {
  const { g, ui, v, opts, say } = c;
  const pages = binderPages();
  if (ui.binderSel === null) {
    v.put(0, 0, 'BINDER  CODE BINDER AND TECH ORDERS', C.CYAN);
    pages.slice(0, 9).forEach((p, i) => {
      const k = String(i + 1);
      v.put(1, 2 + i * 2, k, C.WHITE);
      v.put(4, 2 + i * 2, p.title, C.GREEN);
      v.click(0, 2 + i * 2, 64, c.act(`bp${i}`, () => { ui.binderSel = i; }));
      opts.push({ key: k, label: p.title.split(' ').slice(0, 2).join(' '), fn: () => { ui.binderSel = i; } });
    });
    return;
  }
  const p = pages[ui.binderSel];
  p.lines.slice(0, 28).forEach((l, i) => v.put(0, i, l, i === 0 ? C.CYAN : C.GREEN));
  if (p.proc) {
    const id = p.proc;
    opts.push({ key: '1', label: 'OPEN AS ACTIVE CHECKLIST', fn: () => say(g.procOpen(id)) });
  }
  opts.push({ key: '0', label: 'BACK', fn: () => { ui.binderSel = null; } });
}

// ─────────────────────────────── F9 work ───────────────────────────────

function pageWork(c: Ctx) {
  const { g, ui, v, opts, say } = c;
  v.put(0, 0, 'WORK ORDER BOARD', C.CYAN);
  const wos = Object.values(g.wos);
  wos.forEach((w, i) => {
    const sel = ui.woSel === w.id;
    const stc = ['CLOSED', 'CANCELLED'].includes(w.state) ? C.DIM : w.state === 'TEAM AT PORTAL' ? C.AMBER : C.WHITE;
    v.put(0, 1 + i, ` ${i + 1} ${w.id}  ${w.window}  ${w.task.padEnd(28).slice(0, 28)} `.padEnd(64), sel ? C.BLACK : C.GREEN, { bg: sel ? C.GREEN : 0 });
    v.put(55, 1 + i, w.state.slice(0, 9), sel ? C.BLACK : stc, { bg: sel ? C.GREEN : 0, blink: w.state === 'TEAM AT PORTAL' });
    v.click(0, 1 + i, 64, c.act(`wo${w.id}`, () => { ui.woSel = w.id; }));
    if (!ui.woSel) opts.push({ key: String(i + 1), label: w.id, fn: () => { ui.woSel = w.id; } });
  });
  v.hline(0, 5, 64);
  if (!ui.woSel) {
    v.put(0, 6, 'SELECT A WORK ORDER', C.DIM);
    return;
  }
  const w = g.wos[ui.woSel];
  const rows: [string, string][] = [
    ['ORDER', w.id], ['EQUIPMENT', w.equip], ['TASK', w.task], ['WINDOW', w.window],
    ['TEAM', w.team ? g.teams[w.team].names.join(' + ') : 'LCC CREW'], ['ISOLATION', w.isolation.join('; ')], ['RESTORE/TEST', w.restore.join('; ')],
    ['STATE', w.state + (w.tagsOn ? '   TAGS APPLIED' : '')],
  ];
  let y = 6;
  for (const [k, val] of rows) {
    v.put(0, y, k, C.DIM);
    y += v.wrap(14, y, 50, val, k === 'STATE' ? C.WHITE : C.GREEN);
  }
  if (w.id === 'WO 7-100') {
    y++;
    (['power', 'prop', 'vent'] as SysPage[]).forEach((k) => {
      v.put(2, y++, `POINT TEST ${k.toUpperCase().padEnd(6)} ${g.pointTest[k].done ? 'DONE' : 'NOT RUN'}`, g.pointTest[k].done ? C.DIM : C.AMBER);
    });
    if (w.state !== 'CLOSED') opts.push({ key: '1', label: 'CLOSE WO', fn: () => say(g.woClose(w.id)) });
  }
  const tm = w.team ? g.teams[w.team] : null;
  if (tm && tm.loc === 'PORTAL') {
    y++;
    v.put(0, y++, 'AT THE PORTAL (BADGES PRESENTED)', C.AMBER);
    tm.names.forEach((n, i) => v.put(2, y++, `${n.padEnd(14)} BADGE ${tm.badges[i]}   CURRENT`, C.WHITE));
    v.put(2, y++, `WAITING ${Math.floor((g.t - tm.tArrive) / 60)} MIN.  COMPARE WITH DISPATCH SHEET >`, C.DIM);
    opts.push({ key: '1', label: 'ADMIT', fn: () => say(g.woAdmit(w.id)) }, { key: '2', label: 'DENY', fn: () => say(g.woDeny(w.id)) });
  }
  if (w.state === 'ISOLATING') {
    if (w.tags.length) opts.push({ key: '3', label: 'APPLY TAGS', fn: () => say(g.woApplyTags(w.id)) });
    opts.push({ key: '4', label: 'RELEASE TEAM TO WORK', fn: () => say(g.woRelease(w.id)) });
  }
  if (w.tagsOn && (w.state === 'RESTORE' || w.state === 'IN WORK')) opts.push({ key: '5', label: 'REMOVE TAGS', fn: () => say(g.woRemoveTags(w.id)) });
  if (w.state === 'RESTORE') opts.push({ key: '6', label: 'CLOSE WO', fn: () => say(g.woClose(w.id)) });
  if (w.proc && !['CLOSED', 'CANCELLED', 'DEFERRED'].includes(w.state)) opts.push({ key: '7', label: 'OPEN CHECKLIST', fn: () => say(g.procOpen(w.proc!)) });
  opts.push({ key: '0', label: 'BACK', fn: () => { ui.woSel = null; } });
}

/** Esc / 0 when the page doesn't offer its own BACK. */
export function goBack(ui: UIState) {
  if (ui.page === 'F3') { if (ui.f3sel) ui.f3sel = null; else if (ui.f3det) ui.f3det = false; else ui.f3 = null; }
  if (ui.page === 'F6') ui.comms = null;
  if (ui.page === 'F8') ui.binderSel = null;
  if (ui.page === 'F9') ui.woSel = null;
}
