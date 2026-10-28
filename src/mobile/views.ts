// Mobile views. Each returns an HTML string from game state; buttons carry data-act ids
// registered through ctx.act. Pure: no DOM access, so they can be unit-tested.
import type { Game, SysPage, TrendKey } from '../sim/game';
import { textLen } from '../sim/game';
import { PROC_BY_ID, PROCEDURES } from '../content/procedures';
import { VERDICT_LABEL, type Verdict } from '../content/messages';
import { BANDS, CODE_BINDER, DISPATCH } from '../content/binder';
import { clockStr, hhmmZ, hhmmssZ } from '../sim/time';

export type MPage = 'F1' | 'F2' | 'F3' | 'F4' | 'F6' | 'F8' | 'F9';

export interface MUI {
  page: MPage;
  plant: SysPage;
  trendSet: number;
  trendWin: '2H' | '10M';
  inboxSel: string | null;
  comms: 'radio' | 'phone';
  binderSel: number | null;
  woSel: string | null;
  sheetOpen: boolean;
  feedback: string;
  feedbackT: number;
  seenComms: number;
}

export function newMUI(): MUI {
  return {
    page: 'F1', plant: 'vent', trendSet: 0, trendWin: '2H', inboxSel: null, comms: 'radio', binderSel: null, woSel: null,
    sheetOpen: false, feedback: '', feedbackT: 0, seenComms: 0,
  };
}

export interface MCtx {
  g: Game;
  ui: MUI;
  /** Register an action; returns the attribute string to put on the element. */
  act: (id: string, fn: () => void) => string;
  say: (s: string) => void;
}

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const lamp = (on: boolean, sev: 'on' | 'amb' | 'red' = 'on') => `<i class="lamp${on ? ` ${sev}` : ''}"></i>`;
const val = (v: number, d: number, warn = false, alarm = false) => `<b class="${alarm ? 'red' : warn ? 'amb' : ''}">${v.toFixed(d)}</b>`;
const btn = (c: MCtx, id: string, label: string, fn: () => void, cls = '') => `<button class="btn ${cls}"${c.act(id, fn)}>${esc(label)}</button>`;
const HB = ['|', '/', '-', '\\'];

export const TABS: [MPage, string][] = [['F1', 'OVR'], ['F2', 'TRND'], ['F3', 'PLANT'], ['F4', 'INBOX'], ['F6', 'COMMS'], ['F8', 'BNDR'], ['F9', 'WORK']];

// ───────────────────────── chrome ─────────────────────────

export function topHTML(g: Game): string {
  const cls = g.status === 'STRATEGIC ALERT' ? 'ok' : g.status === 'EVACUATION' ? 'red blink' : 'amb';
  return `<span class="cx">LCC 4-7</span><span class="clock">${clockStr(g.t)}</span><span class="ff">${g.calm && g.started ? '&#9654;&#9654;' : ''}</span>`
    + `<span class="status ${cls}">${esc(g.status)}</span>`;
}

export function bannerHTML(c: MCtx): string {
  const { g, ui } = c;
  const b = g.bannerAlarm();
  const un = g.alarms.filter((a) => !a.acked).length;
  const unread = Math.max(0, g.comms.length - ui.seenComms);
  if (b) {
    const sev = b.sev === 'red' ? 'red' : 'amb';
    return `<button class="banner ${sev}"${c.act('ack', () => g.ack())}>`
      + `<span class="bl blink">${lamp(true, sev)} ${hhmmssZ(b.tOn)}</span><span class="bt">${esc(b.text)}${b.active ? '' : ' (RTN)'}</span>`
      + `<span class="bk">${un > 1 ? `${un} UNACK - ` : ''}TAP TO ACK</span></button>`;
  }
  const standing = g.alarms.filter((a) => a.active).length;
  return `<div class="banner quiet"><span>${standing ? `NO UNACK ALARMS - ${standing} STANDING` : 'NO UNACKNOWLEDGED ALARMS'}</span>`
    + (unread && ui.page !== 'F6' ? `<button class="chip"${c.act('radio-chip', () => { ui.page = 'F6'; })}>RADIO ${unread}</button>` : '')
    + '</div>';
}

export function tabsHTML(c: MCtx): string {
  const { g, ui } = c;
  return TABS.map(([id, name]) => {
    let badge = '';
    if (id === 'F4') { const n = g.messages.filter((m) => !m.verdict).length; if (n) badge = `<em>${n}</em>`; }
    if (id === 'F6') { const n = g.comms.length - ui.seenComms; if (n > 0 && ui.page !== 'F6') badge = `<em class="dim">${n}</em>`; }
    if (id === 'F9') { if (Object.values(g.teams).some((t) => t.loc === 'PORTAL')) badge = '<em>!</em>'; }
    return `<button class="tab${ui.page === id ? ' cur' : ''}"${c.act(`tab:${id}`, () => { ui.page = id; })}><small>${id}</small>${name}${badge}</button>`;
  }).join('');
}

export function sheetHTML(c: MCtx): string {
  const { g, ui, say } = c;
  if (!g.procs.length) return '';
  const p = g.procs[g.procFocus];
  const def = PROC_BY_ID[p.id];
  const st = def.steps[p.step];
  const tick = st && st.kind !== 'wait'
    ? `<button class="btn tick"${c.act('tick', () => say(g.procTick()))}>TICK ${p.step + 1}</button>`
    : '<span class="btn tick waiting blink">WAIT</span>';
  const kind = (k: string) => (k === 'action' ? 'DO' : k === 'confirm' ? 'CHK' : k === 'wait' ? 'WT' : 'NB');
  const bar = `<div class="sbar"><button class="sinfo"${c.act('sheet', () => { ui.sheetOpen = !ui.sheetOpen; })}>`
    + `<span class="sid">${esc(def.id)} &middot; ${Math.min(p.step + 1, def.steps.length)}/${def.steps.length}${g.procs.length > 1 ? ` &middot; LIST ${g.procFocus + 1}/${g.procs.length}` : ''} ${ui.sheetOpen ? '&#9660;' : '&#9650;'}</span>`
    + `<span class="scur">${st ? `<b>${kind(st.kind)}</b> ${esc(st.text)}` : ''}</span></button>${tick}</div>`;
  if (!ui.sheetOpen) return bar;
  const steps = def.steps.map((s, i) => {
    const cls = i < p.step ? 'done' : i === p.step ? 'cur' : '';
    const box = i < p.step ? '[X]' : i === p.step ? '[&gt;]' : '[ ]';
    return `<li class="${cls}"><span class="box">${box}</span><span class="k">${kind(s.kind)}</span><span>${i + 1}. ${esc(s.text)}</span></li>`;
  }).join('');
  const title = def.title.startsWith(def.id) ? def.title : `${def.id} ${def.title}`;
  return bar + `<div class="sbody" data-scroll="sheet"><div class="stitle">${esc(title)}</div><ol class="steps">${steps}</ol>`
    + `<div class="btns">${g.procs.length > 1 ? btn(c, 'pcyc', 'NEXT LIST', () => g.procCycle()) : ''}${btn(c, 'pclose', 'CLOSE LIST', () => say(g.procClose()), 'warn')}</div></div>`;
}

// ───────────────────────── pages ─────────────────────────

export function pageHTML(c: MCtx): string {
  switch (c.ui.page) {
    case 'F1': return overview(c);
    case 'F2': return trends(c);
    case 'F3': return plant(c);
    case 'F4': return inbox(c);
    case 'F6': return comms(c);
    case 'F8': return binder(c);
    case 'F9': return work(c);
  }
}

const zoneVmax = (g: Game, z: number) => Math.max(...g.zones[z].sensors.map((id) => (g.sensors[id].tagged ? 0 : g.ind.VD[id])));
const vcls = (v: number) => (v > 25 ? 'red' : v > 10 ? 'amb' : '');

function overview(c: MCtx): string {
  const { g } = c;
  const L = g.ind.lamps;
  let h = `<h1>SILO MIMIC <span class="dim">SCAN ${HB[g.scanCount % 4]}</span></h1>`;
  h += `<div class="mimic"><div class="mrow head"><span class="dim">CLOSURE DOOR</span>${lamp(true, 'on')} CLSD ${lamp(false)} OPEN</div>`;
  for (const z of g.zones) {
    const vm = zoneVmax(g, z.idx);
    const occ = g.zoneOccupancy(z.idx);
    const levels = [0, 1, 2].map((k) => {
      const lv = z.idx * 3 + k + 1;
      return `<div class="lv"><span>L${lv}</span><i class="msl${lv === 1 ? ' nose' : ''}"></i>${k === 0 && occ.length ? `<span class="occ blinkif${vm > 25 ? ' blink' : ''}">&#9679;${occ.length}</span>` : ''}</div>`;
    }).join('');
    const fan = g.fans[z.fan];
    const dmp = g.dampers[z.damper];
    const af = g.ind.AF[z.idx];
    const vds = z.sensors.map((id) => {
      const s = g.sensors[id];
      const r = g.ind.VD[id];
      return `<span>${id.slice(-1)} ${s.tagged ? '<b class="dim">TAG</b>' : `<b class="${vcls(r)}">${r.toFixed(1)}</b>`}</span>`;
    }).join(' ');
    h += `<div class="mz v-${vcls(vm) || 'ok'}"><div class="levels">${levels}</div><div class="zd">`
      + `<div class="zh">${z.name} ${z.levels}${fan.tag || dmp.tag ? ' <b class="amb">TAGGED</b>' : ''}</div>`
      + `<div class="r"><span>${z.fan.slice(4)} ${lamp(L[`${z.fan} RUN`])} RUN</span><span>${z.damper.slice(4)} ${lamp(L[`${z.damper} OPEN`])} OPN</span></div>`
      + `<div class="r"><span>FLOW ${val(af, 0, af < 1500)} <small>CFM</small></span><span>SEL <b class="${fan.sel === 'RUN' ? '' : 'amb'}">${fan.sel}</b></span></div>`
      + `<div class="r"><span class="dim">VAPOUR %LEL</span><span>${vds}</span></div>`
      + (occ.length ? `<div class="r amb">${esc(occ.join(', '))}</div>` : '')
      + '</div></div>';
  }
  const leaving = Object.values(g.teams).filter((t) => t.loc === 'LEAVING').reduce((n, t) => n + t.names.length, 0) + (g.pruitt.loc === 'TRANSIT' ? 1 : 0);
  h += `<div class="mrow"><span>CABLEWAY ${leaving ? `<b class="amb">&#9679;${leaving}</b>` : ''}</span><span>BLAST DOORS ${lamp(true)} ${lamp(true)} CLSD</span></div></div>`;

  h += '<h2>PROPELLANTS</h2><table class="t">';
  const tanks: ['S1F' | 'S2F' | 'S1O' | 'S2O', string][] = [['S1F', 'S1 FUEL'], ['S2F', 'S2 FUEL'], ['S1O', 'S1 OXID'], ['S2O', 'S2 OXID']];
  for (const [k, label] of tanks) {
    const tk = g.tanks[k];
    const v = g.ind[k];
    h += `<tr><td>${label}</td><td class="n">${val(v, 2, v < tk.lo || v > tk.hi)}</td><td class="dim">${tk.lo.toFixed(1)}-${tk.hi.toFixed(1)}</td></tr>`;
  }
  h += `<tr><td>N2 SUPPLY</td><td class="n">${val(g.ind.N2, 0, g.ind.N2 < 1200)}</td><td class="dim">PSIG</td></tr></table>`;
  h += `<div class="r">VLV N2-F1 ${lamp(L['VLV N2-F1 OPEN'])} OPEN<span>VLV N2-F2 ${lamp(L['VLV N2-F2 OPEN'])} OPEN</span></div>`;

  h += '<h2>POWER</h2>';
  h += `<div class="r"><span>COMMERCIAL ${val(g.ind.COMMV, 0, false, g.ind.COMMV < 400)} V</span><span>BUS ${val(g.ind.BUSV, 0, false, g.ind.BUSV < 456)} V ${val(g.ind.BUSHZ, 2, false, Math.abs(g.ind.BUSHZ - 60) > 0.5)} HZ</span></div>`;
  h += `<div class="r"><span>CB-1 ${lamp(L['CB-1 CLOSED'])} CB-2 ${lamp(L['CB-2 CLOSED'])}</span><span>DG-1 <b class="${g.power.dgSel === 'AUTO' ? '' : 'amb'}">${g.power.dgSel}</b> ${lamp(L['DG-1 RUN'])} RUN</span></div>`;

  h += '<h2>ALARM SUMMARY</h2>';
  const list = [...g.alarms].reverse();
  h += list.length
    ? `<ul class="alist">${list.slice(0, 30).map((a) => `<li class="${a.active ? (a.sev === 'red' ? 'red' : 'amb') : 'dim'}${a.acked ? '' : ' blink'}"><span class="dim">${hhmmZ(a.tOn)}</span> ${esc(a.text)}${a.active ? '' : ' (RTN)'}</li>`).join('')}</ul>`
    : '<p class="dim">NO ALARMS</p>';
  return h;
}

interface TrendSpec { key: TrendKey; also?: TrendKey; label: string; unit: string; lo: number; hi: number; band: [number, number]; dec: number; rate?: boolean }
const TREND_SETS: { name: string; specs: TrendSpec[] }[] = [
  { name: 'PROP', specs: [
    { key: 'S1F', label: 'S1 FUEL', unit: 'PSIG', lo: 8, hi: 16, band: [11, 15], dec: 2, rate: true },
    { key: 'S2F', label: 'S2 FUEL', unit: 'PSIG', lo: 8, hi: 16, band: [11, 15], dec: 2, rate: true },
    { key: 'S1O', label: 'S1 OXID', unit: 'PSIG', lo: 13, hi: 23, band: [16, 20], dec: 2 },
  ] },
  { name: 'VAPOUR', specs: [
    { key: 'VD L2-A', also: 'VD L2-B', label: 'VAPOUR L2 A/B', unit: '%LEL', lo: 0, hi: 40, band: [0, 10], dec: 1 },
    { key: 'VD L4-A', also: 'VD L4-B', label: 'VAPOUR L4 A/B', unit: '%LEL', lo: 0, hi: 40, band: [0, 10], dec: 1 },
    { key: 'VD L7-A', also: 'VD L7-B', label: 'VAPOUR L7 A/B', unit: '%LEL', lo: 0, hi: 40, band: [0, 10], dec: 1 },
  ] },
  { name: 'AIRFLOW', specs: [
    { key: 'AF1', label: 'Z1 L1-3 AIRFLOW', unit: 'CFM', lo: 0, hi: 3000, band: [1500, 3000], dec: 0 },
    { key: 'AF2', label: 'Z2 L4-6 AIRFLOW', unit: 'CFM', lo: 0, hi: 3000, band: [1500, 3000], dec: 0 },
    { key: 'AF3', label: 'Z3 L7-9 AIRFLOW', unit: 'CFM', lo: 0, hi: 3000, band: [1500, 3000], dec: 0 },
  ] },
  { name: 'PWR/N2', specs: [
    { key: 'BUSV', label: 'MAIN BUS', unit: 'V', lo: 0, hi: 600, band: [456, 504], dec: 0 },
    { key: 'BUSHZ', label: 'BUS FREQ', unit: 'HZ', lo: 50, hi: 65, band: [59.5, 60.5], dec: 2 },
    { key: 'N2', label: 'N2 SUPPLY', unit: 'PSIG', lo: 0, hi: 3000, band: [1200, 3000], dec: 0 },
  ] },
];

function seg(c: MCtx, id: string, items: [string, boolean, () => void][]): string {
  return `<div class="seg">${items.map(([label, on, fn], i) => `<button class="${on ? 'on' : ''}"${c.act(`${id}:${i}`, fn)}>${esc(label)}</button>`).join('')}</div>`;
}

function graphSVG(g: Game, sp: TrendSpec, win: number): string {
  const W = 300;
  const H = 72;
  const y = (v: number) => (H - ((Math.max(sp.lo, Math.min(sp.hi, v)) - sp.lo) / (sp.hi - sp.lo)) * H).toFixed(1);
  const pts = (key: TrendKey) => {
    const s = g.trends[key].since(g.t - win);
    const step = Math.max(1, Math.floor(s.length / 300));
    const out: string[] = [];
    for (let i = 0; i < s.length; i += step) out.push(`${(((s[i].t - (g.t - win)) / win) * W).toFixed(1)},${y(s[i].v)}`);
    if (s.length) out.push(`${(((s[s.length - 1].t - (g.t - win)) / win) * W).toFixed(1)},${y(s[s.length - 1].v)}`);
    return out.join(' ');
  };
  const by0 = Number(y(sp.band[1]));
  const by1 = Number(y(sp.band[0]));
  return `<svg class="graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">`
    + `<rect class="band" x="0" y="${by0}" width="${W}" height="${Math.max(0, by1 - by0)}"/>`
    + [0.25, 0.5, 0.75].map((f) => `<line class="grid" x1="${W * f}" y1="0" x2="${W * f}" y2="${H}"/>`).join('')
    + (sp.also ? `<polyline class="ln2" points="${pts(sp.also)}"/>` : '')
    + `<polyline class="ln" points="${pts(sp.key)}"/></svg>`;
}

function trends(c: MCtx): string {
  const { g, ui } = c;
  const set = TREND_SETS[ui.trendSet];
  const win = ui.trendWin === '2H' ? 7200 : 600;
  let h = seg(c, 'tset', TREND_SETS.map((s, i) => [s.name, i === ui.trendSet, () => { ui.trendSet = i; }]));
  h += seg(c, 'twin', [['2 HOURS', ui.trendWin === '2H', () => { ui.trendWin = '2H'; }], ['10 MIN', ui.trendWin === '10M', () => { ui.trendWin = '10M'; }]]);
  for (const sp of set.specs) {
    const cur = g.trends[sp.key].since(g.t - 3);
    const last = cur.length ? cur[cur.length - 1].v : 0;
    let head = `<span>${sp.label}</span><span>${val(last, sp.dec, last < sp.band[0] || last > sp.band[1])} <small>${sp.unit}</small>`;
    if (sp.also) {
      const c2 = g.trends[sp.also].since(g.t - 3);
      head += ` <span class="cy">B ${(c2.length ? c2[c2.length - 1].v : 0).toFixed(sp.dec)}</span>`;
    }
    head += '</span>';
    let rate = '';
    if (sp.rate) {
      const r = g.rate(sp.key);
      rate = `<div class="r small"><span class="dim">RATE</span><b class="${r < -0.1 ? 'red' : ''}">${r >= 0 ? '+' : ''}${r.toFixed(3)} PSI/MIN</b></div>`;
    }
    h += `<div class="trend"><div class="r">${head}</div>${rate}<div class="gwrap"><span class="ax top">${sp.hi}</span><span class="ax bot">${sp.lo}</span>${graphSVG(g, sp, win)}</div>`
      + `<div class="r small dim"><span>-${ui.trendWin === '2H' ? '2H' : '10M'}</span><span>BAND ${sp.band[0]}-${sp.band[1]}</span><span>NOW</span></div></div>`;
  }
  return h;
}

function plant(c: MCtx): string {
  const { g, ui, say } = c;
  const L = g.ind.lamps;
  let h = seg(c, 'sys', [['POWER', ui.plant === 'power', () => { ui.plant = 'power'; }], ['PROP / N2', ui.plant === 'prop', () => { ui.plant = 'prop'; }], ['VENT', ui.plant === 'vent', () => { ui.plant = 'vent'; }]]);
  const pt = g.pointTest[ui.plant];
  const testing = pt.until > g.t;
  h += `<div class="ptest ${testing ? 'on' : pt.done ? '' : 'due'}"><span>${testing ? '<b class="blink">POINT TEST RUNNING - CHECK EVERY POINT</b>' : `POINT TEST: ${pt.done ? 'RUN THIS SHIFT' : 'NOT RUN (WO 7-100)'}`}</span>`
    + (testing ? '' : btn(c, `pt:${ui.plant}`, 'RUN TEST', () => say(g.startPointTest(ui.plant)), 'small'))
    + `<span class="dim">SCAN ${HB[g.scanCount % 4]}</span></div>`;
  const sel3 = (id: string, cur: string, set: (s: 'OFF' | 'AUTO' | 'RUN') => string) =>
    `<div class="btns sel3">${(['OFF', 'AUTO', 'RUN'] as const).map((s) => btn(c, `${id}:sel:${s}`, s, () => say(set(s)), cur === s ? 'on' : '')).join('')}</div>`;

  if (ui.plant === 'power') {
    const p = g.power;
    h += `<div class="card"><div class="ch">MAIN BUS</div><div class="big">${val(g.ind.BUSV, 0, false, g.ind.BUSV < 456)}<small>V</small> ${val(g.ind.BUSHZ, 2, false, Math.abs(g.ind.BUSHZ - 60) > 0.5)}<small>HZ</small></div>`
      + `<div class="r"><span>COMMERCIAL ${val(g.ind.COMMV, 0, false, g.ind.COMMV < 400)} V</span><span>BATT ${val(g.ind.BATT, 1)} VDC</span></div>`
      + `<div class="r"><span class="dim">SOURCE</span><b>${g.ind.BUSV < 100 ? '<span class="red">NONE</span>' : p.cb2 ? 'DIESEL DG-1' : 'COMMERCIAL'}</b></div></div>`;
    for (const id of ['CB-1', 'CB-2'] as const) {
      h += `<div class="card"><div class="ch">${id} <span class="dim">${id === 'CB-1' ? 'COMMERCIAL' : 'DIESEL'} BREAKER</span></div><div class="r"><span>${lamp(L[`${id} CLOSED`])} CLOSED</span></div>`
        + `<div class="btns">${btn(c, `${id}:c`, 'CLOSE', () => say(g.breaker(id, true)))}${btn(c, `${id}:o`, 'OPEN', () => say(g.breaker(id, false)), 'warn')}</div></div>`;
    }
    h += `<div class="card"><div class="ch">DG-1 <span class="dim">DIESEL GENERATOR</span></div><div class="r"><span>${lamp(L['DG-1 RUN'])} RUN</span>${p.dgCrank > 0 && !p.dgRunning ? '<b class="amb blink">CRANKING</b>' : ''}</div>`
      + sel3('dg', p.dgSel, (s) => g.dgSelect(s)) + '</div>';
    h += `<div class="card"><div class="ch">RETRANSFER</div><p class="dim">Closed transition back to commercial. No dropout.</p><div class="btns">${btn(c, 'xfer', 'RETRANSFER TO COMMERCIAL', () => say(g.retransfer()))}</div></div>`;
  }

  if (ui.plant === 'prop') {
    const r = g.rate('S1F');
    h += `<div class="card"><div class="ch">N2 STORAGE</div><div class="big">${val(g.ind.N2, 0, g.ind.N2 < 1200)}<small>PSIG</small></div></div>`;
    const valves: [string, 'S1F' | 'S2F', string][] = [['N2-F1', 'S1F', 'S1 FUEL'], ['N2-F2', 'S2F', 'S2 FUEL']];
    for (const [id, tank, label] of valves) {
      const v = g.valves[id];
      const tk = g.tanks[tank];
      const pv = g.ind[tank];
      h += `<div class="card"><div class="ch">VLV ${id} <span class="dim">N2 TO ${label}</span></div>`
        + `<div class="r"><span>${lamp(L[`VLV ${id} OPEN`])} OPEN</span><span class="dim">CMD ${v.cmdOpen ? 'OPEN' : 'CLOSED'}</span></div>`
        + `<div class="r"><span>${label}</span><span>${val(pv, 2, pv < tk.lo || pv > tk.hi)} <small>PSIG</small></span></div>`
        + (tank === 'S1F' ? `<div class="r"><span>RATE</span><b class="${r < -0.1 ? 'red' : ''}">${r >= 0 ? '+' : ''}${r.toFixed(3)} PSI/MIN</b></div>` : '')
        + (v.channelTagged ? '<div class="r amb">POSITION CHANNEL TAGGED FAILED</div>' : '')
        + `<div class="btns">${btn(c, `${id}:o`, 'OPEN', () => say(g.valveCmd(id, true)), 'warn')}${btn(c, `${id}:c`, 'CLOSE', () => say(g.valveCmd(id, false)))}${btn(c, `${id}:t`, 'TAG CHANNEL', () => say(g.tagChannel(id)), 'small')}</div></div>`;
    }
    h += `<div class="card"><div class="ch">OXIDISER AND TEMPS</div>`
      + `<div class="r"><span>S1 OXID ${val(g.ind.S1O, 2)}</span><span>S2 OXID ${val(g.ind.S2O, 2)}</span></div>`
      + `<div class="r"><span>FUEL ${val(g.ind.FT, 1)} F</span><span>OXID ${val(g.ind.OT, 1)} F</span></div></div>`;
  }

  if (ui.plant === 'vent') {
    for (const z of g.zones) {
      const fan = g.fans[z.fan];
      const d = g.dampers[z.damper];
      const af = g.ind.AF[z.idx];
      h += `<div class="card"><div class="ch">${z.name} ${z.levels} <span>FLOW ${val(af, 0, af < 1500)} <small>CFM</small></span></div>`
        + `<div class="r"><span>${z.fan} ${lamp(L[`${z.fan} RUN`])} RUN</span>${fan.tag ? `<b class="amb">TAG ${fan.tag}</b>` : ''}</div>`
        + `<div class="btns row5">${(['OFF', 'AUTO', 'RUN'] as const).map((s) => btn(c, `${z.fan}:sel:${s}`, s, () => say(g.fanSel(z.fan, s)), fan.sel === s ? 'on' : '')).join('')}`
        + `<span class="gap"></span>${btn(c, `${z.fan}:start`, 'START', () => say(g.fanStart(z.fan)))}${btn(c, `${z.fan}:stop`, 'STOP', () => say(g.fanStop(z.fan)), 'warn')}</div>`
        + `<div class="r ctl"><span>${z.damper} ${lamp(L[`${z.damper} OPEN`])} OPEN<br><small>CMD ${d.cmdOpen ? 'OPEN' : 'CLOSED'}${d.tag ? ' &middot; TAGGED' : ''}</small></span>`
        + `<span class="btns">${btn(c, `${z.damper}:o`, 'OPEN', () => say(g.damperCmd(z.damper, true)))}${btn(c, `${z.damper}:c`, 'CLOSE', () => say(g.damperCmd(z.damper, false)), 'warn')}</span></div></div>`;
    }
    h += '<div class="card"><div class="ch">VAPOUR DETECTORS <span class="dim">%LEL</span></div>';
    for (const s of Object.values(g.sensors)) {
      const r = g.ind.VD[s.id];
      h += `<div class="r det"><span>${s.id}</span>${s.tagged ? '<b class="dim">TAGGED OUT</b>' : `<b class="${vcls(r)}">${r.toFixed(1)}</b>`}`
        + (s.tagged ? btn(c, `${s.id}:rtn`, 'RETURN', () => say(g.sensorTag(s.id, false)), 'small') : btn(c, `${s.id}:tag`, 'TAG OUT', () => say(g.sensorTag(s.id, true)), 'small warn'))
        + '</div>';
    }
    h += '</div>';
  }
  return h;
}

function inbox(c: MCtx): string {
  const { g, ui, say } = c;
  const msgs = g.messages;
  if (!ui.inboxSel || !msgs.some((m) => m.def.id === ui.inboxSel)) {
    const un = msgs.find((m) => !m.verdict);
    ui.inboxSel = un ? un.def.id : msgs.length ? msgs[msgs.length - 1].def.id : null;
  }
  let h = `<h1>TELETYPE <span class="${g.power.busLive ? 'dim' : 'red'}">${g.power.busLive ? 'ON LINE' : 'NO POWER'}</span></h1>`;
  if (!msgs.length) return h + '<p class="dim">NO TRAFFIC THIS SHIFT</p>';
  h += '<ul class="mlist">' + [...msgs].reverse().map((m) => {
    const printing = m.printed < textLen(m.def);
    const st = printing ? '<b class="blink">PRINTING</b>' : m.verdict ? `<span class="dim">${VERDICT_LABEL[m.verdict]}</span>` : '<b>UNANSWERED</b>';
    return `<li class="${m.def.id === ui.inboxSel ? 'sel' : ''}${m.verdict ? ' done' : ''}"${c.act(`msg:${m.def.id}`, () => { ui.inboxSel = m.def.id; })}>`
      + `<span>${m.def.id} <span class="dim">${hhmmZ(m.tArrive)}</span> ${esc(m.def.subject)}</span>${st}</li>`;
  }).join('') + '</ul>';
  const m = msgs.find((x) => x.def.id === ui.inboxSel);
  if (!m) return h;
  let left = m.printed;
  const lines = m.def.lines.map((l) => {
    const part = left > 0 ? l.slice(0, Math.max(0, Math.floor(left))) : '';
    left -= l.length + 1;
    return esc(part);
  });
  const stamp = m.verdict ? `<span class="stamp ${m.verdict === 'INVALID' || m.verdict === 'RETRANSMIT' ? 'r' : ''}">${m.verdict === 'FILE' ? 'FILED' : m.verdict}</span>` : '';
  h += `<div class="paper tty">${stamp}<pre>${lines.join('\n')}</pre></div>`;
  h += `<div class="binderbox"><div class="ch">CODE BINDER</div><pre>${esc(CODE_BINDER.slice(2, 6).join('\n'))}</pre>`
    + `<pre class="dim">${esc(['R4 Unreadable DTG/TYPE/AUTH: GARBLED', 'R1 DTG not future, not over 2 HR old', 'R2 AUTH prefix = series for DTG', 'Fail R1/R2: INVALID - REPORT', 'STA, DSP: ACT   EXR: EXERCISE ONLY', 'No AUTH (info): FILE'].join('\n'))}</pre></div>`;
  if (m.printed >= textLen(m.def) && !m.verdict) {
    const verdicts: Verdict[] = m.def.kind === 'info' ? ['FILE'] : ['ACT', 'EXERCISE', 'INVALID', 'RETRANSMIT'];
    h += `<div class="btns col">${verdicts.map((v) => btn(c, `vd:${m.def.id}:${v}`, VERDICT_LABEL[v], () => say(g.answer(m.def.id, v)), v === 'INVALID' || v === 'RETRANSMIT' ? 'warn' : '')).join('')}</div>`;
  } else if (m.verdict) {
    h += `<p class="dim">STAMPED ${VERDICT_LABEL[m.verdict]} AT ${hhmmZ(m.tVerdict!)}</p>`;
  }
  return h;
}

const CH_CLS: Record<string, string> = { LCC: 'w', YOU: 'amb', CP: 'cy', MAINT: 'cy' };

function comms(c: MCtx): string {
  const { g, ui, say } = c;
  ui.seenComms = g.comms.length;
  let h = '<h1>RADIO AND PHONE LOG</h1>';
  h += '<div class="log" data-scroll="log">' + (g.comms.length ? g.comms.map((l) => {
    const typing = l.shown < l.text.length;
    return `<div class="ll ${CH_CLS[l.ch] ?? ''}"><span class="lh">${hhmmZ(l.t)} ${esc(l.ch)}</span><span class="lt">${esc(l.text.slice(0, Math.floor(l.shown)))}${typing ? '<i class="cur">_</i>' : ''}</span></div>`;
  }).join('') : '<p class="dim">NO TRAFFIC</p>') + '</div>';
  h += `<div class="r small dim"><span>RADIO NET ${g.power.busLive ? 'UP' : '<b class="red">DOWN</b>'}</span><span>PHONE UP</span></div>`;
  h += seg(c, 'cm', [['RADIO', ui.comms === 'radio', () => { ui.comms = 'radio'; }], [`PHONE${g.commsBusy() ? ' (ON CALL)' : ''}`, ui.comms === 'phone', () => { ui.comms = 'phone'; }]]);
  const list = ui.comms === 'radio' ? g.radioOptions() : g.phoneOptions();
  if (!list.length) h += `<p class="dim">${ui.comms === 'phone' ? 'LINE BUSY: CALL IN PROGRESS' : 'NO CALLS AVAILABLE'}</p>`;
  h += `<div class="btns col">${list.map((o) => btn(c, `com:${o.label}`, o.label, () => say(o.fn()), o.label.startsWith('PA') ? 'warn' : '')).join('')}</div>`;
  h += '<h2>PERSONNEL</h2><table class="t">';
  const rows: [string, string][] = [['LT WHITLOCK', 'LCC'], ['SSGT ORTIZ', 'LCC'], ['A1C PRUITT', g.pruitt.loc === 'SILO' ? `SILO ${g.zones[g.pruitt.zone ?? 0].levels}` : g.pruitt.loc]];
  for (const tm of Object.values(g.teams)) {
    if (tm.loc === 'NONE') continue;
    rows.push([`${tm.wo} TEAM`, tm.loc === 'SILO' ? `SILO ${g.zones[tm.zone].levels}` : tm.loc === 'LEAVING' ? 'CABLEWAY' : tm.loc]);
  }
  h += rows.map(([n, w]) => `<tr><td>${n}</td><td class="${w.startsWith('SILO') ? 'amb' : ''}">${w}</td></tr>`).join('') + '</table>';
  return h;
}

export const MOBILE_MANUAL: string[] = [
  'TRAINING MANUAL - READING THE LCC TERMINAL',
  '',
  'You are the Missile Combat Crew Commander, Launch Complex 4-7. Your shift is 24 hours. Quiet stretches pass quickly (the clock shows >>); time drops to real time whenever something needs you.',
  '',
  'CONTROLS',
  '- The tabs along the bottom change page.',
  '- The alarm banner at the top: tap to acknowledge the newest alarm.',
  '- An active checklist sits above the tabs. TICK claims the current step. Tap the bar to see every step.',
  '- Every button acts at once. There is no undo.',
  '',
  'PAGES',
  'OVR    silo mimic, occupancy, alarm summary',
  'TRND   trend graphs, tolerance bands, rate of change',
  'PLANT  power, propellants and nitrogen, ventilation',
  'INBOX  teletype traffic; judge each message against the code binder',
  'COMMS  radio log, radio calls, telephone',
  'BNDR   tech orders (checklists), code binder, bands',
  'WORK   work orders, the portal, the dispatch sheet',
  '',
  'THREE RULES',
  '1. Lamps show what the hardware is doing, not what you commanded.',
  '2. Ticking a CONFIRM step is a claim. It is checked, and remembered.',
  '3. Every alarm is acknowledged. Acknowledging is not the same as reading.',
];

function binder(c: MCtx): string {
  const { g, ui, say } = c;
  const procs = PROCEDURES.filter((p) => p.id.startsWith('TO'));
  const pages: { title: string; kind: 'text' | 'proc'; lines?: string[]; proc?: string }[] = [
    { title: 'HOW TO READ THIS TERMINAL', kind: 'text', lines: MOBILE_MANUAL },
    { title: 'CODE BINDER - AUTHENTICATORS', kind: 'text', lines: CODE_BINDER },
    { title: 'TOLERANCE BANDS', kind: 'text', lines: BANDS },
    ...procs.map((p) => ({ title: `${p.id} ${p.title}`, kind: 'proc' as const, proc: p.id })),
  ];
  if (ui.binderSel === null) {
    return '<h1>BINDER</h1><div class="btns col list">' + pages.map((p, i) => btn(c, `bp:${i}`, p.title, () => { ui.binderSel = i; }, 'left')).join('') + '</div>';
  }
  const p = pages[ui.binderSel];
  let h = `<div class="btns">${btn(c, 'bback', '< BINDER', () => { ui.binderSel = null; }, 'small')}</div>`;
  if (p.kind === 'text') {
    h += `<div class="doctext">${p.lines!.map((l, i) => `<p class="${i === 0 ? 'cy' : ''}">${esc(l) || '&nbsp;'}</p>`).join('')}</div>`;
  } else {
    const def = PROC_BY_ID[p.proc!];
    h += `<h1>${esc(def.id)} ${esc(def.title)}</h1>${(def.intro ?? []).map((l) => `<p>${esc(l)}</p>`).join('')}`;
    h += `<ol class="steps">${def.steps.map((s, i) => `<li><span class="k">${s.kind === 'action' ? 'DO' : s.kind === 'confirm' ? 'CHK' : s.kind === 'wait' ? 'WT' : 'NB'}</span><span>${i + 1}. ${esc(s.text)}</span></li>`).join('')}</ol>`;
    if (def.reference) h += '<p class="dim">REFERENCE PAGE</p>';
    else h += `<div class="btns col">${btn(c, `popen:${def.id}`, 'OPEN AS ACTIVE CHECKLIST', () => say(g.procOpen(def.id)))}</div>`;
  }
  return h;
}

function work(c: MCtx): string {
  const { g, ui, say } = c;
  let h = '<h1>WORK ORDER BOARD</h1>';
  h += '<ul class="mlist">' + Object.values(g.wos).map((w) => {
    const done = ['CLOSED', 'CANCELLED'].includes(w.state);
    const portal = w.state === 'TEAM AT PORTAL';
    return `<li class="${ui.woSel === w.id ? 'sel' : ''}${done ? ' done' : ''}"${c.act(`wo:${w.id}`, () => { ui.woSel = ui.woSel === w.id ? null : w.id; })}>`
      + `<span>${w.id} <span class="dim">${w.window}</span><br>${esc(w.task)}</span><b class="${portal ? 'amb blink' : done ? 'dim' : ''}">${w.state}</b></li>`;
  }).join('') + '</ul>';
  if (!ui.woSel) return h + `<h2>DISPATCH SHEET</h2><pre class="pre">${esc(DISPATCH.slice(3).join('\n'))}</pre>`;
  const w = g.wos[ui.woSel];
  const tm = w.team ? g.teams[w.team] : null;
  const rows: [string, string][] = [
    ['EQUIPMENT', w.equip], ['TASK', w.task], ['WINDOW', w.window], ['TEAM', tm ? tm.names.join(' + ') : 'LCC CREW'],
    ['ISOLATION', w.isolation.join('; ')], ['RESTORE / TEST', w.restore.join('; ')], ['STATE', w.state + (w.tagsOn ? ' - TAGS APPLIED' : '')],
  ];
  h += `<div class="card"><div class="ch">${w.id}</div><dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
  if (w.id === 'WO 7-100') {
    h += (['power', 'prop', 'vent'] as SysPage[]).map((k) => `<div class="r"><span>POINT TEST ${k.toUpperCase()}</span><b class="${g.pointTest[k].done ? 'dim' : 'amb'}">${g.pointTest[k].done ? 'DONE' : 'NOT RUN'}</b></div>`).join('');
  }
  if (tm && tm.loc === 'PORTAL') {
    const disp = DISPATCH.join('\n');
    h += `<div class="portal"><div class="ch amb">AT THE PORTAL &middot; WAITING ${Math.floor((g.t - tm.tArrive) / 60)} MIN</div><table class="t"><tr><th>PRESENTED</th><th>BADGE</th><th>ON DISPATCH</th></tr>`
      + tm.names.map((n, i) => {
        const on = disp.includes(n) && disp.includes(tm.badges[i]);
        return `<tr><td>${n}</td><td>${tm.badges[i]}</td><td class="dim">${on ? 'SEE BELOW' : '-'}</td></tr>`;
      }).join('') + '</table>'
      + `<pre class="pre dim">${esc(DISPATCH.slice(3, 10).join('\n'))}</pre></div>`;
  }
  const b: string[] = [];
  if (tm && tm.loc === 'PORTAL') b.push(btn(c, 'admit', 'ADMIT', () => say(g.woAdmit(w.id))), btn(c, 'deny', 'DENY', () => say(g.woDeny(w.id)), 'warn'));
  if (w.state === 'ISOLATING') {
    if (w.tags.length) b.push(btn(c, 'tags', 'APPLY TAGS', () => say(g.woApplyTags(w.id))));
    b.push(btn(c, 'release', 'RELEASE TEAM TO WORK', () => say(g.woRelease(w.id)), 'warn'));
  }
  if (w.tagsOn && (w.state === 'RESTORE' || w.state === 'IN WORK')) b.push(btn(c, 'untag', 'REMOVE TAGS', () => say(g.woRemoveTags(w.id))));
  if (w.state === 'RESTORE' || (w.id === 'WO 7-100' && w.state === 'OPEN')) b.push(btn(c, 'close', 'CLOSE WO', () => say(g.woClose(w.id)), 'warn'));
  if (w.proc && !['CLOSED', 'CANCELLED', 'DEFERRED'].includes(w.state)) b.push(btn(c, 'wproc', 'OPEN CHECKLIST', () => say(g.procOpen(w.proc!))));
  h += `<div class="btns">${b.join('')}</div></div>`;
  return h;
}
