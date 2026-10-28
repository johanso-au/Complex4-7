// Simulation core: plant, clock, traffic, crew, procedures, scoring. No graphics.
// The UI reads this state and sends player actions back through the command methods.
import { mulberry32 } from './rng';
import { CALM_RATE, SHIFT_LENGTH, hhmmZ, tAt } from './time';
import { MSG_BY_ID, MESSAGES, type MsgDef, type Verdict } from '../content/messages';
import { PROC_BY_ID } from '../content/procedures';
import { installScript } from '../content/script';

export type Sel = 'OFF' | 'AUTO' | 'RUN';
export type Status = 'STRATEGIC ALERT' | 'OFF ALERT (MAINTENANCE)' | 'EVACUATION';
export type Area = 'PROCEDURE' | 'VERIFICATION' | 'PLANT' | 'TIMELINESS';
export type NoteLevel = 'info' | 'marginal' | 'strike' | 'commend';
export type SysPage = 'power' | 'prop' | 'vent';
export type Person = 'whitlock' | 'ortiz' | 'pruitt' | 'haskins';

export interface Fan { id: string; zone: number; sel: Sel; latched: boolean; running: boolean; spin: number; tag: string | null }
export interface Damper { id: string; zone: number; cmdOpen: boolean; pos: number; stuck: boolean; tag: string | null }
export interface Valve { id: string; cmdOpen: boolean; pos: number; failedChannel: boolean; channelTagged: boolean; tag: string | null }
export interface Sensor { id: string; zone: number; offset: number; filt: number; drifting: boolean; driftVal: number; tagged: boolean }
export interface Zone { idx: number; name: string; levels: string; fan: string; damper: string; sensors: string[]; airflow: number; vapour: number; share: number }
export interface Tank { id: 'S1F' | 'S2F' | 'S1O' | 'S2O'; label: string; p: number; lo: number; hi: number; creep: number; punctured: boolean; ruptured: boolean; valve: string | null; overN2: number }
export interface Power { commercial: boolean; cb1: boolean; cb2: boolean; dgSel: Sel; dgRunning: boolean; dgCrank: number; xfer: number; cooldown: number; busLive: boolean }
export interface AlarmInst { key: string; text: string; sev: 'amber' | 'red'; tOn: number; acked: boolean; active: boolean; tAck?: number }
export interface MsgInst { def: MsgDef; tArrive: number; printed: number; read: boolean; verdict: Verdict | null; tVerdict?: number }
export interface CommsLine { t: number; ch: string; text: string; shown: number; phone: boolean }
export interface ProcInst { id: string; step: number; ticks: { t: number; ok: boolean }[]; tOpen: number }
export type TeamLoc = 'NONE' | 'PORTAL' | 'SILO' | 'LEAVING' | 'GONE';
export interface Team {
  id: string; wo: string; names: string[]; badges: string[]; zone: number; loc: TeamLoc;
  tArrive: number; tAdmit: number; tLeave: number; working: boolean; tWorkEnd: number; exposure: number; injured: boolean;
}
export type WOState = 'OPEN' | 'TEAM AT PORTAL' | 'ISOLATING' | 'IN WORK' | 'RESTORE' | 'CLOSED' | 'DEFERRED' | 'CANCELLED';
export interface WorkOrder {
  id: string; equip: string; task: string; team: string | null; window: string; zone: number | null;
  isolation: string[]; restore: string[]; tags: string[]; proc: string | null; state: WOState; tagsOn: boolean; tClosed?: number;
}
export interface Note { t: number; area: Area; level: NoteLevel; text: string; evidence?: string }
export interface SocketLog {
  dropT: number; reportDelay: number; active: boolean;
  vapourAmberT?: number; lowLampT?: number; reportT?: number; reportHow?: 'team' | 'query';
  valveT?: number; evacT?: number; cpT?: number; resolvedT?: number; outcome?: 'contained' | 'late';
  pressureAtDrop: number;
}
export interface Ending { kind: 'complete' | 'damascus'; cause?: 'rupture' | 'ignition'; zone?: number; t: number }
export interface Ind {
  S1F: number; S2F: number; S1O: number; S2O: number; FT: number; OT: number; N2: number;
  AF: number[]; VD: Record<string, number>; BUSV: number; BUSHZ: number; BATT: number; COMMV: number;
  lamps: Record<string, boolean>;
}
interface AlarmDef { key: string; text: string; sev: 'amber' | 'red'; page: SysPage | 'none'; on: (g: Game) => boolean; off: (g: Game) => boolean; inhibit?: (g: Game) => boolean }
interface Sched { t: number; fn: () => void; seq: number }

/** Signals kept for trends and rate-of-change. */
export const TREND_KEYS = ['S1F', 'S2F', 'S1O', 'S2O', 'N2', 'AF1', 'AF2', 'AF3', 'VD L2-A', 'VD L2-B', 'VD L4-A', 'VD L4-B', 'VD L7-A', 'VD L7-B', 'BUSV', 'BUSHZ'] as const;
export type TrendKey = (typeof TREND_KEYS)[number];

class Trend {
  // High resolution: last 900 s at 1 s. Low resolution: whole shift at 10 s.
  hiV = new Float32Array(900); hiT = new Float64Array(900); hiN = 0; hiIdx = 0;
  loV: number[] = []; loT: number[] = []; lastLo = -1e9;
  push(t: number, v: number) {
    this.hiV[this.hiIdx] = v; this.hiT[this.hiIdx] = t;
    this.hiIdx = (this.hiIdx + 1) % 900; this.hiN = Math.min(900, this.hiN + 1);
    if (t - this.lastLo >= 10) { this.loV.push(v); this.loT.push(t); this.lastLo = t; }
  }
  /** Samples newer than t0, oldest first. */
  since(t0: number): { t: number; v: number }[] {
    const out: { t: number; v: number }[] = [];
    const hiOldest = this.hiN ? this.hiT[(this.hiIdx - this.hiN + 900) % 900] : Infinity;
    if (t0 < hiOldest) {
      for (let i = 0; i < this.loT.length; i++) if (this.loT[i] >= t0 && this.loT[i] < hiOldest) out.push({ t: this.loT[i], v: this.loV[i] });
    }
    for (let k = 0; k < this.hiN; k++) {
      const i = (this.hiIdx - this.hiN + k + 900) % 900;
      if (this.hiT[i] >= t0) out.push({ t: this.hiT[i], v: this.hiV[i] });
    }
    return out;
  }
  valueAt(t: number): number | undefined {
    let best: number | undefined; let bestDt = Infinity;
    for (let k = 0; k < this.hiN; k++) {
      const d = Math.abs(this.hiT[k] - t);
      if (d < bestDt) { bestDt = d; best = this.hiV[k]; }
    }
    return bestDt <= 3 ? best : undefined;
  }
}

const SENSOR_LAG = 25; // s, sampling-line delay on vapour detectors
const LEAK_G0 = 1.0; // %LEL/s vapour generation at the moment of puncture
const LEAK_TAU = 900; // s, leak decays as the fuel level drops past the hole
const IGNITION = 100; // %LEL

export class Game {
  t = 0;
  started = false;
  calm = false;
  calmRate = CALM_RATE;
  rng: () => number;
  status: Status = 'STRATEGIC ALERT';
  scanCount = 0;
  private scanAcc = 0;
  private seq = 0;

  power: Power = { commercial: true, cb1: true, cb2: false, dgSel: 'AUTO', dgRunning: false, dgCrank: 0, xfer: 0, cooldown: 0, busLive: true };
  fans: Record<string, Fan> = {};
  dampers: Record<string, Damper> = {};
  valves: Record<string, Valve> = {};
  sensors: Record<string, Sensor> = {};
  zones: Zone[] = [];
  tanks: Record<Tank['id'], Tank>;
  n2Supply = 2400;
  temps = { fuel: 60.2, ox: 59.7 };
  ind: Ind;
  private lampsTrue: Record<string, boolean> = {};
  pointTest: Record<SysPage, { until: number; done: boolean; failedSeen: string[] }> = {
    power: { until: -1, done: false, failedSeen: [] },
    prop: { until: -1, done: false, failedSeen: [] },
    vent: { until: -1, done: false, failedSeen: [] },
  };

  alarms: AlarmInst[] = [];
  private alarmDefs: AlarmDef[] = [];
  private alarmOn: Record<string, boolean> = {};

  messages: MsgInst[] = [];
  comms: CommsLine[] = [];
  private commsQueue: { ch: string; text: string; phone: boolean; hold: number }[] = [];
  private commsHold = 0;
  commsUnread = 0;
  procs: ProcInst[] = [];
  procFocus = 0;
  wos: Record<string, WorkOrder> = {};
  teams: Record<string, Team> = {};
  pruitt: { loc: 'LCC' | 'SILO' | 'TRANSIT'; zone: number | null; task: null | { sensor: string; phase: 'out' | 'inspect' | 'back'; until: number }; injured: boolean } = {
    loc: 'LCC', zone: null, task: null, injured: false,
  };
  private scheduled: Sched[] = [];
  notes: Note[] = [];
  strikes = 0;
  commendations = 0;
  hidden = { readiness: 70, integrity: 60, trust: { whitlock: 60, ortiz: 60, pruitt: 60, haskins: 60 } as Record<Person, number> };
  socket: SocketLog | null = null;
  ending: Ending | null = null;
  /** Sound cues for the presentation layer to play. */
  sfx: string[] = [];
  trends: Record<string, Trend> = {};
  flags: Record<string, unknown> = {};
  ackTimes: number[] = [];

  constructor(seed = 4719) {
    this.rng = mulberry32(seed);
    const zoneDefs: [string, string, string, string, number][] = [
      ['Z1', 'L1-3', 'FAN L2-A', 'DMP L2-2', 0],
      ['Z2', 'L4-6', 'FAN L4-A', 'DMP L4-2', 0.6],
      ['Z3', 'L7-9', 'FAN L7-A', 'DMP L7-2', 0.4],
    ];
    zoneDefs.forEach(([name, levels, fan, damper, share], idx) => {
      const lv = fan.slice(4, 6); // L2, L4, L7
      const sensors = [`VD ${lv}-A`, `VD ${lv}-B`];
      this.zones.push({ idx, name, levels, fan, damper, sensors, airflow: 2400, vapour: 0.3, share });
      this.fans[fan] = { id: fan, zone: idx, sel: 'RUN', latched: true, running: true, spin: 3, tag: null };
      this.dampers[damper] = { id: damper, zone: idx, cmdOpen: true, pos: 1, stuck: false, tag: null };
      sensors.forEach((id, k) => {
        this.sensors[id] = { id, zone: idx, offset: k ? 0.1 : 0, filt: 0.3, drifting: false, driftVal: 0, tagged: false };
      });
    });
    this.valves['N2-F1'] = { id: 'N2-F1', cmdOpen: false, pos: 0, failedChannel: false, channelTagged: false, tag: null };
    this.valves['N2-F2'] = { id: 'N2-F2', cmdOpen: false, pos: 0, failedChannel: true, channelTagged: false, tag: null };
    this.tanks = {
      S1F: { id: 'S1F', label: 'S1 FUEL', p: 12.0, lo: 11.0, hi: 15.0, creep: -0.2 / 3600, punctured: false, ruptured: false, valve: 'N2-F1', overN2: 0 },
      S2F: { id: 'S2F', label: 'S2 FUEL', p: 13.4, lo: 11.0, hi: 15.0, creep: -0.02 / 3600, punctured: false, ruptured: false, valve: 'N2-F2', overN2: 0 },
      S1O: { id: 'S1O', label: 'S1 OXID', p: 18.1, lo: 16.0, hi: 20.0, creep: 0, punctured: false, ruptured: false, valve: null, overN2: 0 },
      S2O: { id: 'S2O', label: 'S2 OXID', p: 17.8, lo: 16.0, hi: 20.0, creep: 0, punctured: false, ruptured: false, valve: null, overN2: 0 },
    };
    this.ind = {
      S1F: 0, S2F: 0, S1O: 0, S2O: 0, FT: 0, OT: 0, N2: 0, AF: [0, 0, 0], VD: {}, BUSV: 0, BUSHZ: 0, BATT: 0, COMMV: 0, lamps: {},
    };
    for (const k of TREND_KEYS) this.trends[k] = new Trend();
    this.buildAlarms();
    this.buildWorkOrders();
    installScript(this);
    this.scan();
  }

  // ───────────────────────────── setup ─────────────────────────────

  private buildAlarms() {
    const A = (d: AlarmDef) => this.alarmDefs.push(d);
    for (const tk of Object.values(this.tanks)) {
      const id = tk.id;
      A({ key: `${id}_LO`, text: `${tk.label} PRESS LOW`, sev: 'amber', page: 'prop', on: (g) => g.ind[id] < tk.lo, off: (g) => g.ind[id] > tk.lo + 0.15 });
      A({ key: `${id}_LOLO`, text: `${tk.label} PRESS LOW-LOW`, sev: 'red', page: 'prop', on: (g) => g.ind[id] < tk.lo - 1.5, off: (g) => g.ind[id] > tk.lo - 1.3 });
      A({ key: `${id}_HI`, text: `${tk.label} PRESS HIGH`, sev: 'amber', page: 'prop', on: (g) => g.ind[id] > tk.hi, off: (g) => g.ind[id] < tk.hi - 0.15 });
    }
    A({ key: 'N2_LO', text: 'N2 SUPPLY PRESS LOW', sev: 'amber', page: 'prop', on: (g) => g.ind.N2 < 1200, off: (g) => g.ind.N2 > 1250 });
    for (const s of Object.values(this.sensors)) {
      A({ key: `${s.id}_HI`, text: `VAPOUR ${s.id.slice(3)} HIGH`, sev: 'amber', page: 'vent', on: (g) => g.ind.VD[s.id] > 10, off: (g) => g.ind.VD[s.id] < 8, inhibit: () => s.tagged });
      A({ key: `${s.id}_HIHI`, text: `VAPOUR ${s.id.slice(3)} HIGH-HIGH`, sev: 'red', page: 'vent', on: (g) => g.ind.VD[s.id] > 25, off: (g) => g.ind.VD[s.id] < 22, inhibit: () => s.tagged });
    }
    for (const z of this.zones) {
      A({
        key: `AF${z.idx + 1}_LO`, text: `${z.name} ${z.levels} AIRFLOW LOW`, sev: 'amber', page: 'vent',
        on: (g) => g.ind.AF[z.idx] < 1500, off: (g) => g.ind.AF[z.idx] > 1700, inhibit: (g) => g.zoneTagged(z.idx),
      });
    }
    A({ key: 'COMM_LOST', text: 'COMMERCIAL POWER LOST', sev: 'red', page: 'power', on: (g) => g.ind.COMMV < 400, off: (g) => g.ind.COMMV > 440 });
    A({ key: 'BUS_DEAD', text: 'MAIN BUS DEAD', sev: 'red', page: 'power', on: (g) => g.ind.BUSV < 100, off: (g) => g.ind.BUSV > 400 });
    A({ key: 'ON_DG', text: 'BUS ON DIESEL DG-1', sev: 'amber', page: 'power', on: (g) => g.ind.lamps['CB-2 CLOSED'], off: (g) => !g.ind.lamps['CB-2 CLOSED'] });
    A({
      key: 'PORTAL', text: 'PORTAL: TEAM WAITING FOR ENTRY', sev: 'amber', page: 'none',
      on: (g) => Object.values(g.teams).some((t) => t.loc === 'PORTAL'), off: (g) => !Object.values(g.teams).some((t) => t.loc === 'PORTAL'),
    });
  }

  private buildWorkOrders() {
    this.wos['WO 7-100'] = {
      id: 'WO 7-100', equip: 'ALL SYSTEMS, F3 PAGES 1-3', task: 'DAILY POINT TESTS', team: null, window: '0800Z-2000Z', zone: null,
      isolation: ['NONE'], restore: ['RUN POINT TEST ON F3 POWER, PROPELLANTS, VENT', 'TAG ANY FAILED INPUT CHANNEL', 'CLOSE WO'],
      tags: [], proc: null, state: 'OPEN', tagsOn: false,
    };
    this.wos['WO 7-113'] = {
      id: 'WO 7-113', equip: 'VENTILATION, FAN L7-A', task: 'BEARING INSPECTION', team: 'T113', window: '1000Z-1200Z', zone: 2,
      isolation: ['FAN L7-A SELECTOR OFF', 'DMP L7-2 CLOSED', 'BOTH TAGGED'],
      restore: ['REMOVE TAGS', 'DMP L7-2 OPEN', 'FAN L7-A RUN + START', 'CONFIRM FAN RUN AND L7 AIRFLOW'],
      tags: ['FAN L7-A', 'DMP L7-2'], proc: 'WO 7-113', state: 'OPEN', tagsOn: false,
    };
    this.wos['WO 7-121'] = {
      id: 'WO 7-121', equip: 'PROPELLANTS, S1 FUEL TANK', task: 'PRESSURISATION CAP LEAK CHECK', team: 'T121', window: '0200Z-0400Z', zone: 1,
      isolation: ['NONE. TEAM ON L4: CONFIRM FAN L4-A RUN, Z2 AIRFLOW'],
      restore: ['TEAM REPORTS COMPLETE', 'CLOSE WO'], tags: [], proc: 'WO 7-121', state: 'OPEN', tagsOn: false,
    };
    const team = (id: string, wo: string, names: string[], badges: string[], zone: number): Team => ({
      id, wo, names, badges, zone, loc: 'NONE', tArrive: 0, tAdmit: 0, tLeave: 0, working: false, tWorkEnd: 0, exposure: 0, injured: false,
    });
    this.teams.T113 = team('T113', 'WO 7-113', ['HASKINS E', 'MORENO J'], ['44718', '45233'], 2);
    this.teams.T121 = team('T121', 'WO 7-121', ['HASKINS E', 'TEAGUE R'], ['44718', '45102'], 1);
  }

  // ───────────────────────────── scheduling ─────────────────────────────

  at(t: number, fn: () => void) {
    this.scheduled.push({ t, fn, seq: this.seq++ });
    this.scheduled.sort((a, b) => a.t - b.t || a.seq - b.seq);
  }
  in(dt: number, fn: () => void) { this.at(this.t + dt, fn); }

  begin() { this.started = true; }

  /** Advance by real seconds. Calm periods are compressed; anything needing the player runs at 1x. */
  advance(realDt: number) {
    this.updateStreams(realDt);
    if (!this.started || this.ending) return;
    let real = Math.min(realDt, 0.25);
    let guard = 0;
    while (real > 1e-9 && !this.ending && guard++ < 5000) {
      const engaged = this.isEngaged();
      this.calm = !engaged;
      if (engaged) {
        const d = Math.min(real, 0.05);
        this.tick(d);
        real -= d;
      } else {
        const next = this.scheduled.length ? this.scheduled[0].t - this.t : Infinity;
        const toEnd = SHIFT_LENGTH - this.t;
        const d = Math.max(0.001, Math.min(real * this.calmRate, 2, next, toEnd));
        this.tick(d);
        real -= d / this.calmRate;
      }
    }
  }

  isEngaged(): boolean {
    if (this.alarms.some((a) => !a.acked)) return true;
    if (this.messages.some((m) => !m.verdict)) return true;
    if (this.commsQueue.some((l) => l.phone) || this.comms.some((l) => l.phone && l.shown < l.text.length)) return true;
    if (Object.values(this.teams).some((t) => t.loc === 'PORTAL' || (t.loc === 'SILO' && !t.working && this.wos[t.wo].state === 'ISOLATING'))) return true;
    if (this.moving()) return true;
    if ((Object.keys(this.pointTest) as SysPage[]).some((k) => this.pointTest[k].until > this.t)) return true;
    if (this.socket?.active) return true;
    if (!this.power.busLive || (this.power.dgCrank > 0 && !this.power.dgRunning)) return true;
    for (const p of this.procs) {
      const s = PROC_BY_ID[p.id].steps[p.step];
      if (s && s.kind !== 'wait') return true;
    }
    if ((this.flags.realtimeUntil as number | undefined ?? -1) > this.t) return true;
    return false;
  }

  moving(): boolean {
    for (const d of Object.values(this.dampers)) {
      const target = d.cmdOpen && !d.stuck ? 1 : d.cmdOpen ? d.pos : 0;
      if (Math.abs(d.pos - target) > 1e-6) return true;
    }
    for (const v of Object.values(this.valves)) if (Math.abs(v.pos - (v.cmdOpen ? 1 : 0)) > 1e-6) return true;
    for (const f of Object.values(this.fans)) if (f.spin > 0 && !f.running) return true;
    return false;
  }

  tick(dt: number) {
    this.t += dt;
    this.stepPower(dt);
    this.stepActuators(dt);
    this.stepAir(dt);
    this.stepTanks(dt);
    this.stepCrew(dt);
    while (this.scheduled.length && this.scheduled[0].t <= this.t + 1e-9) {
      const s = this.scheduled.shift()!;
      s.fn();
    }
    this.scanAcc += dt;
    if (this.scanAcc >= 1) {
      this.scanAcc %= 1;
      this.scan();
      this.evalAlarms();
      this.autoSteps();
      this.watchSocket();
    }
    this.checkEndings();
  }

  // ───────────────────────────── plant ─────────────────────────────

  private stepPower(dt: number) {
    const p = this.power;
    if (!p.commercial && p.cb1) { p.cb1 = false; this.sfx.push('relay'); }
    const want = p.dgSel === 'RUN' || (p.dgSel === 'AUTO' && (!p.commercial || p.cb2 || p.cooldown > 0));
    if (want && !p.dgRunning) {
      p.dgCrank += dt;
      if (p.dgCrank >= 10) { p.dgRunning = true; p.dgCrank = 0; this.sfx.push('diesel'); }
    }
    if (!want) {
      if (p.dgRunning) this.sfx.push('relay');
      p.dgRunning = false; p.dgCrank = 0;
      if (p.cb2) p.cb2 = false;
    }
    if (p.dgRunning && !p.commercial && !p.cb1 && !p.cb2 && p.dgSel !== 'OFF') {
      p.xfer += dt;
      if (p.xfer >= 2) { p.cb2 = true; p.xfer = 0; this.sfx.push('relay'); }
    } else p.xfer = 0;
    if (p.cooldown > 0) p.cooldown = Math.max(0, p.cooldown - dt);
    const live = (p.cb1 && p.commercial) || (p.cb2 && p.dgRunning);
    if (p.busLive && !live) {
      for (const f of Object.values(this.fans)) { f.latched = false; f.running = false; f.spin = 0; }
      this.sfx.push('power-off');
      this.flags.lastBusDrop = this.t;
    }
    if (!p.busLive && live) this.sfx.push('power-on');
    p.busLive = live;
  }

  private stepActuators(dt: number) {
    for (const d of Object.values(this.dampers)) {
      const target = d.cmdOpen ? (d.stuck ? d.pos : 1) : 0;
      d.pos = approach(d.pos, target, dt / 6);
    }
    for (const v of Object.values(this.valves)) {
      const before = v.pos;
      v.pos = approach(v.pos, v.cmdOpen ? 1 : 0, dt / 3);
      if (before !== v.pos && (v.pos === 1 || v.pos === 0)) this.sfx.push('clunk');
    }
    for (const f of Object.values(this.fans)) {
      const call = f.sel === 'RUN' || (f.sel === 'AUTO' && this.zoneVapourCall(f.zone));
      const should = this.power.busLive && f.sel !== 'OFF' && f.latched && call;
      if (should) {
        f.spin += dt;
        if (!f.running && f.spin >= 3) f.running = true;
      } else {
        f.spin = 0; f.running = false;
      }
    }
  }

  private zoneVapourCall(zone: number) {
    return this.zones[zone].sensors.some((id) => !this.sensors[id].tagged && this.ind.VD[id] > 10);
  }

  leakGen(): number {
    if (!this.socket || !this.tanks.S1F.punctured) return 0;
    return LEAK_G0 * Math.exp(-(this.t - this.socket.dropT) / LEAK_TAU);
  }

  private stepAir(dt: number) {
    const leak = this.leakGen();
    for (const z of this.zones) {
      const fan = this.fans[z.fan];
      const d = this.dampers[z.damper];
      const target = fan.running ? 120 + 2280 * d.pos : 120 * (0.5 + 0.5 * d.pos);
      z.airflow += (target - z.airflow) * (1 - Math.exp(-dt / 20));
      const gen = 0.00525 + leak * z.share;
      const k = z.airflow / 2400 / 60 + 1 / 1200;
      const eq = gen / k;
      z.vapour = eq + (z.vapour - eq) * Math.exp(-k * dt);
    }
    for (const s of Object.values(this.sensors)) {
      s.filt += (this.zones[s.zone].vapour - s.filt) * (1 - Math.exp(-dt / SENSOR_LAG));
      if (s.drifting) s.driftVal = approach(s.driftVal, 14.5, dt * 0.06);
    }
  }

  private stepTanks(dt: number) {
    for (const tk of Object.values(this.tanks)) {
      tk.p += tk.creep * dt;
      const v = tk.valve ? this.valves[tk.valve] : null;
      if (v && v.pos > 0.05 && this.n2Supply > 300) {
        tk.p += 0.03 * v.pos * dt;
        this.n2Supply -= 0.6 * v.pos * dt;
      }
      if (tk.punctured) {
        tk.p -= 0.015 * dt;
        if (v && v.pos > 0.5) {
          tk.overN2 += dt;
          if (this.socket && this.socket.valveT === undefined) this.socket.valveT = this.t;
          if (tk.overN2 >= 2 && !tk.ruptured) { tk.ruptured = true; }
        }
      }
      tk.p = Math.max(0, tk.p);
    }
  }

  // ───────────────────────────── crew and teams ─────────────────────────────

  private stepCrew(dt: number) {
    for (const tm of Object.values(this.teams)) {
      if (tm.loc === 'LEAVING' && this.t >= tm.tLeave) { tm.loc = 'GONE'; }
      if (tm.loc === 'SILO' && this.zones[tm.zone].vapour > 25) {
        tm.exposure += dt;
        if (tm.exposure > 120 && !tm.injured) {
          tm.injured = true;
          this.say(tm.id === 'T121' ? 'L4 TEAM' : 'TEAM', '[coughing] ...LCC, Teague is down. He breathed it. I\'m dragging him.');
          this.note('PLANT', 'strike', `${tm.names.join(' and ')} overcome by vapour on ${this.zones[tm.zone].levels} before evacuation.`);
        }
      }
    }
    const pr = this.pruitt;
    if (pr.task && this.t >= pr.task.until) {
      const task = pr.task;
      if (task.phase === 'out') {
        pr.loc = 'SILO'; pr.zone = this.sensors[task.sensor].zone;
        task.phase = 'inspect'; task.until = this.t + 180;
      } else if (task.phase === 'inspect') {
        const s = this.sensors[task.sensor];
        if (s.drifting) {
          this.say('PRUITT', `LCC, Pruitt at ${task.sensor.slice(3, 5)}. ${task.sensor}'s sample line is cracked and the cell's drifting. The portable reads clean and ${s.id.slice(0, -1)}${s.id.endsWith('A') ? 'B' : 'A'} agrees. It's the detector, sir.`);
        } else {
          this.say('PRUITT', `LCC, Pruitt. Portable reads ${this.zones[s.zone].vapour.toFixed(0)} percent LEL here. It's real.`);
        }
        this.flags.inspectReported = true;
        this.adjustTrust('pruitt', 3);
        task.phase = 'back'; task.until = this.t + 360; pr.loc = 'TRANSIT'; pr.zone = null;
      } else {
        pr.loc = 'LCC'; pr.task = null;
      }
    }
  }

  teamArrive(id: string) {
    const tm = this.teams[id];
    if (tm.loc !== 'NONE') return;
    tm.loc = 'PORTAL'; tm.tArrive = this.t;
    this.wos[tm.wo].state = 'TEAM AT PORTAL';
    this.say('SECURITY', `LCC, topside security. Maintenance team at the portal, two men, for ${tm.wo}.`);
    this.sfx.push('buzzer');
  }

  // ───────────────────────────── scan and indications ─────────────────────────────

  scan() {
    this.scanCount++;
    const n = () => (this.rng() - 0.5) * 2;
    const ind = this.ind;
    const T = this.tanks;
    ind.S1F = T.S1F.p + n() * 0.012;
    ind.S2F = T.S2F.p + n() * 0.012;
    ind.S1O = T.S1O.p + n() * 0.012;
    ind.S2O = T.S2O.p + n() * 0.012;
    ind.FT = this.temps.fuel + n() * 0.05;
    ind.OT = this.temps.ox + n() * 0.05;
    ind.N2 = this.n2Supply + n() * 2;
    ind.AF = this.zones.map((z) => Math.max(0, z.airflow * (1 + n() * 0.008)));
    for (const s of Object.values(this.sensors)) {
      const base = s.drifting ? s.driftVal : s.filt + s.offset;
      ind.VD[s.id] = Math.max(0, base + n() * 0.08);
    }
    const p = this.power;
    ind.COMMV = p.commercial ? 481 + n() * 2 : 0;
    ind.BUSV = p.busLive ? (p.cb2 ? 478 : 481) + n() * (p.cb2 ? 4 : 2) : 0;
    ind.BUSHZ = p.busLive ? 60 + n() * (p.cb2 ? 0.15 : 0.02) : 0;
    ind.BATT = (p.busLive ? 129.5 : 124.8) + n() * 0.2;

    const L: Record<string, boolean> = {};
    for (const f of Object.values(this.fans)) L[`${f.id} RUN`] = f.running;
    for (const d of Object.values(this.dampers)) L[`${d.id} OPEN`] = d.pos >= 0.98;
    for (const v of Object.values(this.valves)) L[`VLV ${v.id} OPEN`] = v.failedChannel ? false : v.pos >= 0.98;
    L['CB-1 CLOSED'] = p.cb1;
    L['CB-2 CLOSED'] = p.cb2;
    L['DG-1 RUN'] = p.dgRunning;
    this.lampsTrue = { ...L };

    // Point test drives every point on the page to a known pattern; failed channels stay dark.
    if (this.pointTest.power.until > this.t) {
      for (const k of ['CB-1 CLOSED', 'CB-2 CLOSED', 'DG-1 RUN']) L[k] = true;
      ind.COMMV = 300; ind.BUSV = 300; ind.BUSHZ = 37.5; ind.BATT = 75;
    }
    if (this.pointTest.prop.until > this.t) {
      for (const v of Object.values(this.valves)) L[`VLV ${v.id} OPEN`] = !v.failedChannel;
      ind.S1F = ind.S2F = ind.S1O = ind.S2O = 15; ind.FT = ind.OT = 75; ind.N2 = 1500;
    }
    if (this.pointTest.vent.until > this.t) {
      for (const f of Object.values(this.fans)) L[`${f.id} RUN`] = true;
      for (const d of Object.values(this.dampers)) L[`${d.id} OPEN`] = true;
      ind.AF = [2500, 2500, 2500];
      for (const s of Object.values(this.sensors)) ind.VD[s.id] = 50;
    }
    ind.lamps = L;

    // Trends record what the instruments show (not during a point test: tests are tagged and excluded).
    const tv: Record<TrendKey, number> = {
      S1F: T.S1F.p + n() * 0.012, S2F: T.S2F.p, S1O: T.S1O.p, S2O: T.S2O.p, N2: this.n2Supply,
      AF1: this.zones[0].airflow, AF2: this.zones[1].airflow, AF3: this.zones[2].airflow,
      'VD L2-A': 0, 'VD L2-B': 0, 'VD L4-A': 0, 'VD L4-B': 0, 'VD L7-A': 0, 'VD L7-B': 0,
      BUSV: p.busLive ? 480 : 0, BUSHZ: p.busLive ? 60 : 0,
    };
    for (const s of Object.values(this.sensors)) tv[s.id as TrendKey] = s.drifting ? s.driftVal : s.filt + s.offset;
    for (const k of TREND_KEYS) this.trends[k].push(this.t, tv[k]);

    for (const k of Object.keys(this.pointTest) as SysPage[]) {
      const pt = this.pointTest[k];
      if (pt.until > 0 && pt.until <= this.t && !pt.done) {
        pt.done = true;
        this.sfx.push('relay');
      }
    }
  }

  /** The true lamp state as of the last scan (point-test pattern excluded). */
  lamp(name: string): boolean { return !!this.lampsTrue[name]; }

  /** PSI per minute over the last minute, from the trend record. */
  rate(key: TrendKey): number {
    const tr = this.trends[key];
    const s = tr.since(this.t - 60);
    if (s.length < 2) return 0;
    const a = s[0];
    const b = s[s.length - 1];
    if (b.t - a.t < 10) return 0;
    return ((b.v - a.v) / (b.t - a.t)) * 60;
  }

  trendRising(key: TrendKey): boolean {
    const s = this.trends[key].since(this.t - 15);
    return s.length >= 2 && s[s.length - 1].v > s[0].v + 20;
  }

  anyVapourHigh(): boolean { return this.vapourHighList().length > 0; }
  vapourHighList(): string[] {
    return this.alarms.filter((a) => a.active && a.key.startsWith('VD ')).map((a) => a.key.replace(/_HI(HI)?$/, ''));
  }
  alarmedZones(): number[] {
    const zs = new Set<number>();
    for (const s of Object.values(this.sensors)) if (!s.tagged && this.ind.VD[s.id] > 10) zs.add(s.zone);
    return [...zs];
  }
  zoneTagged(zone: number): boolean {
    const z = this.zones[zone];
    return this.fans[z.fan].tag !== null || this.dampers[z.damper].tag !== null;
  }
  zoneOccupancy(zone: number): string[] {
    const out: string[] = [];
    for (const tm of Object.values(this.teams)) if (tm.loc === 'SILO' && tm.zone === zone) out.push(...tm.names);
    if (this.pruitt.loc === 'SILO' && this.pruitt.zone === zone) out.push('PRUITT L');
    return out;
  }
  silOccupants(): string[] {
    return this.zones.flatMap((z) => this.zoneOccupancy(z.idx)).concat(
      Object.values(this.teams).filter((t) => t.loc === 'LEAVING').flatMap((t) => t.names.map((n) => `${n} (CABLEWAY)`)),
    );
  }

  // ───────────────────────────── alarms ─────────────────────────────

  private evalAlarms() {
    for (const d of this.alarmDefs) {
      if (d.page !== 'none' && this.pointTest[d.page].until > this.t) continue;
      if (d.inhibit && d.inhibit(this)) {
        if (this.alarmOn[d.key]) this.clearAlarm(d.key);
        this.alarmOn[d.key] = false;
        continue;
      }
      const was = !!this.alarmOn[d.key];
      const now = was ? !d.off(this) : d.on(this);
      if (now && !was) {
        this.alarms.push({ key: d.key, text: d.text, sev: d.sev, tOn: this.t, acked: false, active: true });
        this.sfx.push(d.sev === 'red' ? 'alarm-red' : 'alarm-amber');
        this.onAlarm(d.key);
      }
      if (!now && was) this.clearAlarm(d.key);
      this.alarmOn[d.key] = now;
    }
  }

  private clearAlarm(key: string) {
    for (const a of this.alarms) if (a.key === key && a.active) a.active = false;
    this.alarms = this.alarms.filter((a) => a.active || !a.acked);
  }

  private onAlarm(key: string) {
    const s = this.socket;
    if (s && s.active) {
      if (key.startsWith('VD L4') && s.vapourAmberT === undefined) s.vapourAmberT = this.t;
      if (key === 'S1F_LO' && s.lowLampT === undefined) s.lowLampT = this.t;
    }
    if (key === 'S1F_LO' && !this.flags.firstLowSaid) {
      this.flags.firstLowSaid = true;
      this.in(4, () => this.say('LCC', "ORTIZ: S1 fuel's under the band again, Commander. Same as always."));
    }
  }

  /** Acknowledge the newest unacknowledged alarm (the one in the banner). */
  ack(): boolean {
    const un = this.alarms.filter((a) => !a.acked);
    if (!un.length) return false;
    const a = un[un.length - 1];
    a.acked = true; a.tAck = this.t;
    this.ackTimes.push(this.t - a.tOn);
    if (!a.active) this.alarms = this.alarms.filter((x) => x !== a);
    this.sfx.push('ack');
    return true;
  }

  bannerAlarm(): AlarmInst | undefined {
    const un = this.alarms.filter((a) => !a.acked);
    return un[un.length - 1];
  }

  // ───────────────────────────── comms and traffic ─────────────────────────────

  say(ch: string, text: string, opts: { phone?: boolean; hold?: number } = {}) {
    this.commsQueue.push({ ch, text, phone: !!opts.phone, hold: opts.hold ?? 0.6 });
  }

  commsBusy(): boolean { return this.commsQueue.some((l) => l.phone) || this.comms.some((l) => l.phone && l.shown < l.text.length); }

  /** Radio and phone stream at speaking pace; the teletype prints at its own pace. Real time. */
  private updateStreams(realDt: number) {
    const live = this.power.busLive;
    const cur = this.comms[this.comms.length - 1];
    if (cur && cur.shown < cur.text.length) {
      if (live || cur.phone) cur.shown = Math.min(cur.text.length, cur.shown + realDt * 32);
      if (cur.shown >= cur.text.length) this.commsHold = 0;
    } else if (this.commsQueue.length) {
      this.commsHold += realDt;
      const nxt = this.commsQueue[0];
      if (this.commsHold >= nxt.hold && (live || nxt.phone)) {
        this.commsQueue.shift();
        this.comms.push({ t: this.t, ch: nxt.ch, text: nxt.text, shown: 0, phone: nxt.phone });
        this.commsUnread++;
        if (!nxt.phone) this.sfx.push(nxt.ch === 'LCC' ? 'voice' : 'squelch');
      }
    }
    // Teletype: one message prints at a time, and only with bus power.
    const printing = this.messages.find((m) => m.printed < textLen(m.def));
    if (printing && live) {
      const before = printing.printed;
      printing.printed = Math.min(textLen(printing.def), printing.printed + realDt * 90);
      if (before === 0) this.sfx.push('teletype');
      if (printing.printed >= textLen(printing.def)) this.sfx.push('teletype-stop');
    }
  }

  deliver(id: string) {
    const def = MSG_BY_ID[id];
    if (!def || this.messages.some((m) => m.def.id === id)) return;
    this.messages.push({ def, tArrive: this.t, printed: 0, read: false, verdict: null });
  }

  answer(id: string, v: Verdict): string {
    const m = this.messages.find((x) => x.def.id === id);
    if (!m || m.verdict) return 'NO SUCH MESSAGE';
    if (m.printed < textLen(m.def)) return 'MESSAGE STILL PRINTING';
    m.verdict = v; m.tVerdict = this.t; m.read = true;
    const c = m.def.correct;
    const tag = `MSG ${m.def.id} (${m.def.subject})`;
    if (v === c) {
      this.note('VERIFICATION', 'info', `${tag}: correct, ${v}.`);
    } else if (c === 'INVALID' && (v === 'ACT' || v === 'EXERCISE')) {
      this.note('VERIFICATION', 'strike', `${tag}: accepted invalid traffic as valid.`, m.def.rule);
      this.adjustTrust('whitlock', -8);
    } else {
      this.note('VERIFICATION', 'marginal', `${tag}: judged ${v}, correct was ${c}.`, m.def.rule);
    }
    if (v === 'RETRANSMIT' && m.def.retransmit) {
      const r = m.def.retransmit;
      this.in(360, () => this.deliver(r));
    }
    if (v === 'INVALID') this.sfx.push('stamp');
    else this.sfx.push('stamp');
    return `${m.def.id} STAMPED ${v}`;
  }

  // ───────────────────────────── player commands: plant ─────────────────────────────

  private tagBlock(tag: string | null): string | null {
    return tag ? `TAGGED OUT UNDER ${tag}. REMOVE TAGS FIRST (F9).` : null;
  }

  fanSel(id: string, sel: Sel): string {
    const f = this.fans[id];
    const b = this.tagBlock(f.tag);
    if (b) return b;
    f.sel = sel;
    if (sel === 'OFF') f.latched = false;
    this.sfx.push('switch');
    return `${id} SELECTOR ${sel}`;
  }

  fanStart(id: string): string {
    const f = this.fans[id];
    const b = this.tagBlock(f.tag);
    if (b) return b;
    this.sfx.push('switch');
    if (f.sel === 'OFF') return `${id} START: NO RESPONSE (SELECTOR OFF)`;
    if (this.power.busLive) f.latched = true;
    return `${id} START COMMANDED`;
  }

  fanStop(id: string): string {
    const f = this.fans[id];
    const b = this.tagBlock(f.tag);
    if (b) return b;
    f.latched = false;
    this.sfx.push('switch');
    return `${id} STOP COMMANDED`;
  }

  damperCmd(id: string, open: boolean): string {
    const d = this.dampers[id];
    const b = this.tagBlock(d.tag);
    if (b) return b;
    if (!open && d.stuck) d.stuck = false; // cycling frees a sticky actuator
    d.cmdOpen = open;
    this.sfx.push('switch');
    return `${id} ${open ? 'OPEN' : 'CLOSE'} COMMANDED`;
  }

  valveCmd(id: string, open: boolean): string {
    const v = this.valves[id];
    const b = this.tagBlock(v.tag);
    if (b) return b;
    v.cmdOpen = open;
    this.sfx.push('switch');
    if (open && id === 'N2-F1') {
      const inProc = this.procs.some((p) => p.id === 'TO 4-3');
      if (!inProc && !this.flags.n2OutsideNoted) {
        this.flags.n2OutsideNoted = true;
        this.note('PROCEDURE', 'marginal', 'VLV N2-F1 opened without TO 4-3 open as the active checklist.');
      }
      if (this.socket && this.tanks.S1F.punctured && this.socket.valveT === undefined) this.socket.valveT = this.t;
    }
    if (open && id === 'N2-F2') this.note('PLANT', 'marginal', 'VLV N2-F2 opened; S2 fuel did not need pressurising.');
    return `VLV ${id} ${open ? 'OPEN' : 'CLOSE'} COMMANDED`;
  }

  tagChannel(id: string): string {
    const v = this.valves[id];
    if (v.channelTagged) return `VLV ${id} CHANNEL ALREADY TAGGED`;
    v.channelTagged = true;
    if (v.failedChannel) {
      this.note('PLANT', 'info', `Failed input channel VLV ${id} OPEN found and tagged.`);
      this.hidden.integrity += 2;
    } else {
      this.note('PLANT', 'marginal', `VLV ${id} channel tagged as failed, but it responds normally.`);
    }
    return `VLV ${id} POSITION CHANNEL TAGGED FAILED`;
  }

  sensorTag(id: string, tagged: boolean): string {
    const s = this.sensors[id];
    s.tagged = tagged;
    if (tagged && !s.drifting && this.zones[s.zone].vapour > 8) {
      this.note('PLANT', 'strike', `${id} tagged out while reading a real vapour hazard.`);
    }
    this.sfx.push('switch');
    return `${id} ${tagged ? 'TAGGED OUT' : 'RETURNED TO SERVICE'}`;
  }

  breaker(id: 'CB-1' | 'CB-2', close: boolean): string {
    const p = this.power;
    this.sfx.push('switch');
    if (close && id === 'CB-1' && p.cb2) return 'INTERLOCK: CB-2 CLOSED. USE RETRANSFER.';
    if (close && id === 'CB-2' && p.cb1) return 'INTERLOCK: CB-1 CLOSED.';
    if (close && id === 'CB-2' && !p.dgRunning) return 'CB-2 CLOSE BLOCKED: DG-1 NOT RUNNING.';
    if (id === 'CB-1') p.cb1 = close; else p.cb2 = close;
    if (!close) this.note('PLANT', 'marginal', `${id} opened by operator.`);
    return `${id} ${close ? 'CLOSE' : 'OPEN'} COMMANDED`;
  }

  dgSelect(sel: Sel): string {
    this.power.dgSel = sel;
    this.sfx.push('switch');
    return `DG-1 SELECTOR ${sel}`;
  }

  retransfer(): string {
    const p = this.power;
    if (!p.commercial) return 'RETRANSFER BLOCKED: NO COMMERCIAL VOLTAGE.';
    if (!p.cb2) return 'BUS ALREADY ON COMMERCIAL.';
    p.cb1 = true; p.cb2 = false; p.cooldown = 300;
    this.sfx.push('relay');
    this.flags.retransferred = true;
    return 'CLOSED-TRANSITION RETRANSFER TO COMMERCIAL COMPLETE';
  }

  startPointTest(page: SysPage): string {
    const pt = this.pointTest[page];
    if (pt.until > this.t) return 'POINT TEST RUNNING';
    pt.until = this.t + 5;
    this.sfx.push('relay');
    return `POINT TEST ${page.toUpperCase()} RUNNING`;
  }

  // ───────────────────────────── player commands: comms ─────────────────────────────

  radioOptions(): { label: string; fn: () => string }[] {
    const out: { label: string; fn: () => string }[] = [];
    const inSilo = Object.values(this.teams).filter((t) => t.loc === 'SILO');
    out.push({ label: 'PA: EVACUATE SILO, ALL PERSONNEL TO LCC', fn: () => this.evacuate() });
    for (const tm of inSilo) {
      out.push({ label: `${tm.zone === 1 ? 'L4' : 'L7'} TEAM: REPORT STATUS`, fn: () => this.queryTeam(tm.id) });
    }
    const high = Object.values(this.sensors).filter((s) => !s.tagged && this.ind.VD[s.id] > 10);
    if (!this.pruitt.task) {
      for (const s of high) out.push({ label: `PRUITT: INSPECT ${s.id}`, fn: () => this.dispatchPruitt(s.id) });
    } else {
      out.push({ label: 'PRUITT: REPORT STATUS', fn: () => this.queryPruitt() });
    }
    return out;
  }

  phoneOptions(): { label: string; fn: () => string }[] {
    const out: { label: string; fn: () => string }[] = [];
    if (this.commsBusy()) return out;
    out.push({ label: 'COMMAND POST: REPORT PROPELLANT LEAK', fn: () => this.reportLeak() });
    if (this.flags.lastBusDrop !== undefined) out.push({ label: 'COMMAND POST: REPORT POWER TRANSFER', fn: () => this.reportPower() });
    out.push({ label: 'COMMAND POST: ROUTINE CHECK-IN', fn: () => this.checkIn() });
    if (Object.values(this.sensors).some((s) => s.tagged) || this.flags.inspectReported) {
      out.push({ label: 'MAINT CONTROL: REPORT FAULTY DETECTOR', fn: () => this.reportDetector() });
    }
    if (Object.values(this.valves).some((v) => v.channelTagged)) {
      out.push({ label: 'MAINT CONTROL: REPORT FAILED CHANNEL', fn: () => this.reportChannel() });
    }
    return out;
  }

  private phone(lines: [string, string][]) {
    this.sfx.push('phone');
    for (const [ch, text] of lines) this.say(ch, text, { phone: true, hold: 0.8 });
  }

  evacuate(): string {
    this.flags.evacOrdered = true;
    this.sfx.push('pa');
    this.say('LCC', 'PA: "All personnel clear the silo. Report to the LCC. All personnel clear the silo."', { hold: 0 });
    let any = false;
    for (const tm of Object.values(this.teams)) {
      if (tm.loc === 'SILO') {
        any = true;
        tm.loc = 'LEAVING'; tm.tLeave = this.t + 150; tm.working = false;
        this.say(tm.id === 'T121' ? 'L4 TEAM' : 'TEAM', 'Copy, clearing the level. Moving to the cableway.');
      }
    }
    if (this.pruitt.loc !== 'LCC') {
      any = true;
      if (this.pruitt.task) { this.pruitt.task.phase = 'back'; this.pruitt.task.until = this.t + 150; }
      this.pruitt.loc = 'TRANSIT'; this.pruitt.zone = null;
    }
    if (this.socket && this.socket.evacT === undefined && any) this.socket.evacT = this.t;
    if (!any && !(this.socket?.active)) this.note('PLANT', 'marginal', 'Silo evacuation ordered with nobody in the silo.');
    return 'EVACUATION ORDERED';
  }

  queryTeam(id: string): string {
    const tm = this.teams[id];
    const ch = id === 'T121' ? 'L4 TEAM' : 'TEAM';
    if (this.socket?.active && id === 'T121' && this.socket.reportT === undefined) {
      this.socket.reportT = this.t; this.socket.reportHow = 'query';
      this.say(ch, "...LCC, L4. Uh. Sir, we dropped a socket. It went down past the work platform and hit the stage 1 fuel tank. There's fuel spraying out of the skin, sir.", { hold: 3 });
      this.adjustTrust('haskins', 4);
      return `RADIO: ${ch}`;
    }
    if (this.socket?.active && id === 'T121') {
      this.say(ch, "It's still coming out, sir. What do you want us to do?");
      return `RADIO: ${ch}`;
    }
    this.say(ch, tm.working ? 'LCC, all good down here. Working.' : 'LCC, standing by for your isolation.');
    return `RADIO: ${ch}`;
  }

  dispatchPruitt(sensor: string): string {
    if (this.pruitt.task) return 'PRUITT ALREADY DISPATCHED';
    this.pruitt.task = { sensor, phase: 'out', until: this.t + 360 };
    this.pruitt.loc = 'TRANSIT';
    this.flags.inspectOrdered = true;
    this.say('PRUITT', `Copy, heading down to check ${sensor}. Taking the portable.`);
    return `PRUITT DISPATCHED TO ${sensor}`;
  }

  queryPruitt(): string {
    const task = this.pruitt.task;
    this.say('PRUITT', task?.phase === 'inspect' ? 'On it, sir. Give me a couple of minutes.' : 'In the cableway, sir. Moving.');
    return 'RADIO: PRUITT';
  }

  reportLeak(): string {
    const known = this.socket && (this.socket.reportT !== undefined || this.socket.vapourAmberT !== undefined);
    if (this.socket?.active || (this.socket && this.leakGen() > 0.05)) {
      if (this.socket.cpT === undefined) this.socket.cpT = this.t;
      this.flags.leakReported = true;
      this.phone([
        ['CP', 'Command post.'],
        ['YOU', '4-7. We have a propellant leak, stage 1 fuel, level 4. A dropped socket pierced the tank.'],
        ['CP', "Copy, 4-7. Clear the silo, keep the fans running, and do not pressurise that tank. Wing's sending the propellant transfer team. 4-7 is off alert as of now."],
      ]);
      this.in(8, () => { if (this.status === 'STRATEGIC ALERT') { this.status = 'OFF ALERT (MAINTENANCE)'; this.sfx.push('relay'); } });
      if (!known) this.note('PLANT', 'info', 'Leak reported before any clue was confirmed.');
      return 'CALLING COMMAND POST';
    }
    this.phone([
      ['CP', 'Command post.'],
      ['YOU', '4-7. Reporting a possible propellant leak.'],
      ['CP', "4-7, what are you seeing? ...We show nothing from your site. Check your instruments and call back with something firm."],
    ]);
    this.note('PLANT', 'marginal', 'Leak reported to command post without evidence of a leak.');
    this.hidden.readiness -= 5;
    return 'CALLING COMMAND POST';
  }

  reportPower(): string {
    this.flags.powerReported = true;
    const onDg = this.power.cb2;
    this.phone([
      ['CP', 'Command post.'],
      ['YOU', `4-7. Lost commercial power at ${hhmmZ(this.flags.lastBusDrop as number)}. ${onDg ? "We're on the diesel" : "We're back on commercial"}. Equipment restarted.`],
      ['CP', 'Copy, 4-7. Utility has a line fault in your county. Advise any change.'],
    ]);
    return 'CALLING COMMAND POST';
  }

  checkIn(): string {
    this.phone([
      ['CP', 'Command post.'],
      ['YOU', '4-7, routine check-in.'],
      ['CP', '4-7, read you loud and clear. Nothing for you.'],
    ]);
    return 'CALLING COMMAND POST';
  }

  reportDetector(): string {
    this.flags.detectorReported = true;
    this.phone([
      ['MAINT', 'Maintenance control, Sergeant Bell.'],
      ['YOU', '4-7. Vapour detector VD L7-A is faulty; sample line cracked. Tagged out. Need a repair order.'],
      ['MAINT', 'Copy, VD L7-A. Raising a corrective order for the day shift.'],
    ]);
    return 'CALLING MAINTENANCE CONTROL';
  }

  reportChannel(): string {
    this.flags.channelReported = true;
    this.phone([
      ['MAINT', 'Maintenance control.'],
      ['YOU', '4-7. Failed input channel, VLV N2-F2 position. Found on point test. Tagged.'],
      ['MAINT', 'Copy. That one again. Corrective order raised.'],
    ]);
    return 'CALLING MAINTENANCE CONTROL';
  }

  // ───────────────────────────── player commands: work orders ─────────────────────────────

  woAdmit(id: string): string {
    const wo = this.wos[id];
    const tm = wo.team ? this.teams[wo.team] : null;
    if (!tm || tm.loc !== 'PORTAL') return 'NO TEAM AT THE PORTAL';
    const wait = this.t - tm.tArrive;
    tm.loc = 'SILO'; tm.tAdmit = this.t;
    wo.state = 'ISOLATING';
    this.sfx.push('door');
    if (wait > 1800) { this.adjustTrust('haskins', -15); this.note('TIMELINESS', 'marginal', `${id} team waited ${Math.round(wait / 60)} min at the portal.`); }
    else if (wait > 600) this.adjustTrust('haskins', -5);
    else this.adjustTrust('haskins', 4);
    this.say(id === 'WO 7-121' ? 'L4 TEAM' : 'TEAM', id === 'WO 7-121'
      ? "Haskins. Thanks, LCC. We'll be on level 4, waiting on your go."
      : "Haskins. Morning, LCC. We'll be at L7 waiting on your isolation.");
    if (wo.proc && !this.procs.some((p) => p.id === wo.proc)) this.procOpen(wo.proc);
    return `${id}: TEAM ADMITTED`;
  }

  woDeny(id: string): string {
    const wo = this.wos[id];
    const tm = wo.team ? this.teams[wo.team] : null;
    if (!tm || tm.loc !== 'PORTAL') return 'NO TEAM AT THE PORTAL';
    tm.loc = 'GONE';
    wo.state = 'DEFERRED';
    this.adjustTrust('haskins', -20);
    this.note('VERIFICATION', 'marginal', `${id}: team on the dispatch sheet with matching badges was denied entry.`);
    this.say('SECURITY', `Copy, LCC. Sending them back to base. ${id} is deferred.`);
    return `${id}: ENTRY DENIED`;
  }

  woApplyTags(id: string): string {
    const wo = this.wos[id];
    if (wo.state !== 'ISOLATING') return 'TAGS ONLY DURING ISOLATION';
    if (!wo.tags.length) return 'NO TAGS ON THIS ORDER';
    for (const eq of wo.tags) {
      if (this.fans[eq]) this.fans[eq].tag = id;
      if (this.dampers[eq]) this.dampers[eq].tag = id;
    }
    wo.tagsOn = true;
    return `${id}: TAGS APPLIED TO ${wo.tags.join(', ')}`;
  }

  woRemoveTags(id: string): string {
    const wo = this.wos[id];
    if (!wo.tagsOn) return 'NO TAGS APPLIED';
    if (wo.state === 'IN WORK') {
      this.note('PROCEDURE', 'strike', `${id}: tags removed while the team was working on the equipment.`);
    }
    for (const eq of wo.tags) {
      if (this.fans[eq]) this.fans[eq].tag = null;
      if (this.dampers[eq]) this.dampers[eq].tag = null;
    }
    wo.tagsOn = false;
    return `${id}: TAGS REMOVED`;
  }

  woRelease(id: string): string {
    const wo = this.wos[id];
    if (wo.state !== 'ISOLATING') return 'TEAM NOT AWAITING RELEASE';
    const tm = this.teams[wo.team!];
    if (id === 'WO 7-113') {
      const f = this.fans['FAN L7-A'];
      const d = this.dampers['DMP L7-2'];
      if (f.running || d.pos > 0.02 || !wo.tagsOn) {
        this.note('PROCEDURE', 'strike', `${id}: team released before isolation was complete.`,
          `FAN L7-A ${f.running ? 'RUNNING' : 'STOPPED'}, DMP L7-2 ${d.pos > 0.02 ? 'NOT CLOSED' : 'CLOSED'}, tags ${wo.tagsOn ? 'on' : 'OFF'}`);
        this.adjustTrust('haskins', -15);
        this.adjustTrust('whitlock', -10);
      }
      tm.working = true; tm.tWorkEnd = this.t + 90 * 60;
      wo.state = 'IN WORK';
      this.say('TEAM', 'Copy, isolation confirmed. Starting on the bearings.');
      this.at(tm.tWorkEnd, () => this.finish113());
    } else if (id === 'WO 7-121') {
      if (!this.fans['FAN L4-A'].running || this.zones[1].airflow < 1500) {
        this.note('PROCEDURE', 'strike', `${id}: team sent to work on L4 without confirmed ventilation.`);
      }
      tm.working = true; tm.tWorkEnd = this.t + 120 * 60;
      wo.state = 'IN WORK';
      this.say('L4 TEAM', 'Copy. Going to work on the cap.');
      this.in(20 * 60, () => this.socketDrop());
    }
    this.sfx.push('switch');
    return `${id}: TEAM RELEASED TO WORK`;
  }

  private finish113() {
    const wo = this.wos['WO 7-113'];
    const tm = this.teams.T113;
    if (wo.state !== 'IN WORK') return;
    wo.state = 'RESTORE';
    tm.working = false; tm.loc = 'LEAVING'; tm.tLeave = this.t + 300;
    // Restoration fault: the damper linkage is stiff after the work and won't open on the first command.
    this.dampers['DMP L7-2'].stuck = true;
    this.say('TEAM', "LCC, Haskins. Fan L7-A's done. Bearings were fine, a little dry. We're clear of the equipment and heading out. She's yours to restore.");
  }

  woClose(id: string): string {
    const wo = this.wos[id];
    if (wo.state === 'CLOSED' || wo.state === 'CANCELLED') return 'ALREADY CLOSED';
    if (id === 'WO 7-100') {
      const all = (Object.keys(this.pointTest) as SysPage[]).every((k) => this.pointTest[k].done);
      const untagged = Object.values(this.valves).some((v) => v.failedChannel && !v.channelTagged);
      if (!all || untagged) {
        this.note('PROCEDURE', 'strike', 'WO 7-100 closed without completing point tests and tagging failed channels.',
          `Tests done: ${(Object.keys(this.pointTest) as SysPage[]).filter((k) => this.pointTest[k].done).join(', ') || 'none'}; untagged failed channel: ${untagged ? 'yes' : 'no'}`);
      }
      wo.state = 'CLOSED'; wo.tClosed = this.t;
      return 'WO 7-100 CLOSED';
    }
    if (wo.state !== 'RESTORE') return 'WORK NOT COMPLETE';
    if (id === 'WO 7-113') {
      const ok = this.lamp('FAN L7-A RUN') && this.lamp('DMP L7-2 OPEN') && !wo.tagsOn;
      if (!ok) {
        this.note('PROCEDURE', 'strike', 'WO 7-113 closed without confirmed restoration (false confirmation).',
          `FAN L7-A RUN ${this.lamp('FAN L7-A RUN') ? 'LIT' : 'DARK'}, DMP L7-2 OPEN ${this.lamp('DMP L7-2 OPEN') ? 'LIT' : 'DARK'}, tags ${wo.tagsOn ? 'ON' : 'off'}`);
        this.adjustTrust('whitlock', -8);
      } else {
        this.adjustTrust('haskins', 4);
      }
    }
    wo.state = 'CLOSED'; wo.tClosed = this.t;
    return `${id} CLOSED`;
  }

  // ───────────────────────────── procedures ─────────────────────────────

  procOpen(id: string): string {
    const def = PROC_BY_ID[id];
    if (!def || def.reference) return 'REFERENCE PAGE ONLY';
    const i = this.procs.findIndex((p) => p.id === id);
    if (i >= 0) { this.procFocus = i; return `${id} ALREADY ACTIVE`; }
    this.procs.push({ id, step: 0, ticks: [], tOpen: this.t });
    this.procFocus = this.procs.length - 1;
    this.sfx.push('paper');
    return `${id} OPENED AS ACTIVE CHECKLIST`;
  }

  procClose(): string {
    const p = this.procs[this.procFocus];
    if (!p) return '';
    const def = PROC_BY_ID[p.id];
    if (p.step < def.steps.length) this.note('PROCEDURE', 'marginal', `${p.id} abandoned at step ${p.step + 1} of ${def.steps.length}.`);
    this.procs.splice(this.procFocus, 1);
    this.procFocus = Math.max(0, Math.min(this.procFocus, this.procs.length - 1));
    return `${p.id} CLOSED`;
  }

  procCycle() { if (this.procs.length) this.procFocus = (this.procFocus + 1) % this.procs.length; }

  /** Tick the next step of the focused checklist. Returns feedback for the prompt line. */
  procTick(): string {
    const p = this.procs[this.procFocus];
    if (!p) return 'NO ACTIVE CHECKLIST';
    const def = PROC_BY_ID[p.id];
    const step = def.steps[p.step];
    if (!step) return 'CHECKLIST COMPLETE';
    if (step.kind === 'wait') return 'WAITING: THIS STEP TICKS ITSELF';
    const ok = step.check ? step.check(this) : true;
    p.ticks.push({ t: this.t, ok });
    this.sfx.push('tick');
    if (!ok) {
      const ev = step.evidence ? step.evidence(this) : 'condition not met';
      const level: NoteLevel = 'strike';
      this.note('PROCEDURE', level, `False confirmation: ${p.id} step ${p.step + 1}, "${step.text}"`, ev);
      this.adjustTrust('whitlock', -6);
      this.hidden.integrity -= 5;
      this.flags.falseConfirms = ((this.flags.falseConfirms as number) ?? 0) + 1;
    }
    p.step++;
    this.finishIfDone(p);
    return ok ? `${p.id} STEP ${p.step} TICKED` : `${p.id} STEP ${p.step} TICKED`;
  }

  private autoSteps() {
    for (const p of [...this.procs]) {
      const def = PROC_BY_ID[p.id];
      const step = def.steps[p.step];
      if (step && step.kind === 'wait' && step.check && step.check(this)) {
        p.ticks.push({ t: this.t, ok: true });
        p.step++;
        this.finishIfDone(p);
      }
    }
  }

  private finishIfDone(p: ProcInst) {
    const def = PROC_BY_ID[p.id];
    if (p.step >= def.steps.length) {
      const clean = p.ticks.every((k) => k.ok);
      this.note('PROCEDURE', 'info', `${p.id} completed${clean ? ', all confirmations true' : ' with false confirmations'}.`);
      def.onComplete?.(this);
      this.flags[`done ${p.id}`] = true;
      const i = this.procs.indexOf(p);
      this.procs.splice(i, 1);
      this.procFocus = Math.max(0, Math.min(this.procFocus, this.procs.length - 1));
    }
  }

  onTopUpComplete() {
    const n = ((this.flags.topups as number) ?? 0) + 1;
    this.flags.topups = n;
    if (n === 1) {
      this.say('LCC', 'WHITLOCK: By the book. Nice.');
      this.adjustTrust('whitlock', 3);
    }
  }

  // ───────────────────────────── the socket beat ─────────────────────────────

  socketDrop() {
    const wo = this.wos['WO 7-121'];
    const tm = this.teams.T121;
    if (wo.state !== 'IN WORK' || tm.loc !== 'SILO') return;
    const trust = this.hidden.trust.haskins;
    const delay = trust >= 65 ? 45 : trust >= 45 ? 120 : 240;
    this.socket = { dropT: this.t, reportDelay: delay, active: true, pressureAtDrop: this.tanks.S1F.p };
    this.tanks.S1F.punctured = true;
    this.sfx.push('clang');
    this.say('L4 TEAM', 'Teague, hand me the... got it, now torque it down to-- [clang] [2s silence]', { hold: 0 });
    this.in(delay, () => {
      const s = this.socket!;
      if (s.reportT !== undefined || !s.active) return;
      s.reportT = this.t; s.reportHow = 'team';
      this.say('L4 TEAM', "LCC, L4. Sir... we dropped a socket. Nine-pound socket. It went down past the work platform and hit the stage 1 fuel tank. There's fuel spraying out, sir.", { hold: 0.2 });
    });
    // If nobody acts, the team clears out on its own and the wing calls in.
    this.in(600, () => {
      const s = this.socket!;
      if (!s.active) return;
      if (tm.loc === 'SILO') { tm.loc = 'LEAVING'; tm.tLeave = this.t + 150; tm.working = false; this.say('L4 TEAM', "LCC, we're getting out of here. Nobody's telling us anything."); }
      this.say('CP', "4-7, command post. The PTS team's supervisor called the wing. Why haven't we heard from you? You're off alert. Propellant team is en route.", { phone: true });
      this.status = 'OFF ALERT (MAINTENANCE)';
      s.active = false; s.resolvedT = this.t; s.outcome = 'late';
      this.note('PLANT', 'strike', 'Leak not reported to command post; the wing heard it from the team.');
      this.closeSocketWO();
    });
  }

  private closeSocketWO() {
    const wo = this.wos['WO 7-121'];
    if (wo.state !== 'CLOSED') { wo.state = 'CANCELLED'; wo.tClosed = this.t; }
  }

  private watchSocket() {
    const s = this.socket;
    if (!s || !s.active) return;
    const out = this.silOccupants().length === 0;
    const vapourOk = this.zones.every((z) => z.vapour < 25) || this.t - s.dropT > 300;
    if (s.cpT !== undefined && out && vapourOk) {
      s.active = false; s.resolvedT = this.t; s.outcome = 'contained';
      this.closeSocketWO();
      this.say('LCC', 'WHITLOCK: ...Okay. Okay. Fans are holding it. Transfer team will be here by dawn.');
      const clean = s.valveT === undefined && s.evacT !== undefined && s.evacT - s.dropT < 180 && s.cpT - s.dropT < 300;
      if (clean) {
        this.note('PLANT', 'commend', 'Leak recognised, silo cleared and reported promptly. Tank never pressurised.');
      }
    }
  }

  private checkEndings() {
    if (this.ending) return;
    if (this.tanks.S1F.ruptured) {
      this.ending = { kind: 'damascus', cause: 'rupture', zone: 1, t: this.t };
      this.status = 'EVACUATION';
      this.sfx.push('klaxon');
      return;
    }
    const hot = this.zones.find((z) => z.vapour >= IGNITION);
    if (hot) {
      this.ending = { kind: 'damascus', cause: 'ignition', zone: hot.idx, t: this.t };
      this.status = 'EVACUATION';
      this.sfx.push('klaxon');
      return;
    }
    if (this.t >= SHIFT_LENGTH) this.ending = { kind: 'complete', t: this.t };
  }

  // ───────────────────────────── scoring ─────────────────────────────

  note(area: Area, level: NoteLevel, text: string, evidence?: string) {
    this.notes.push({ t: this.t, area, level, text, evidence });
    if (level === 'strike') { this.strikes++; this.sfx.push('strike'); }
    if (level === 'commend') this.commendations++;
  }

  adjustTrust(who: Person, d: number) {
    this.hidden.trust[who] = Math.max(0, Math.min(100, this.hidden.trust[who] + d));
  }

  /** Strikes after at most one commendation clears one (once per act). */
  netStrikes(): number { return Math.max(0, this.strikes - Math.min(1, this.commendations)); }

  standing(): string {
    const s = this.netStrikes();
    if (s >= 3) return 'RELIEVED OF DUTY';
    if (s === 2) return 'FINAL WARNING';
    if (s === 1) return 'UNDER REVIEW';
    return this.commendations > 0 ? 'COMMENDED' : 'SATISFACTORY';
  }

  /** People on site when the shift ended in fire, with what happened to them. Reported, not shown. */
  accounting(): { name: string; status: string }[] {
    const out = [
      { name: 'COMMANDER (YOU)', status: 'WALKED OUT' },
      { name: 'LT D. WHITLOCK', status: 'WALKED OUT' },
      { name: 'SSGT R. ORTIZ', status: 'WALKED OUT' },
    ];
    const hitZone = this.ending?.zone ?? 1;
    const pr = this.pruitt;
    out.push({
      name: 'A1C L. PRUITT',
      status: pr.loc === 'SILO' ? (pr.zone === hitZone ? 'NOT ACCOUNTED FOR' : 'WALKED OUT, INJURED') : pr.loc === 'TRANSIT' ? 'WALKED OUT, INJURED' : 'WALKED OUT',
    });
    for (const tm of Object.values(this.teams)) {
      if (tm.loc === 'NONE' || (tm.loc === 'GONE' && tm.tAdmit === 0)) continue;
      for (const nm of tm.names) {
        if (out.some((o) => o.name === nm)) continue;
        let st = 'CLEAR OF SITE';
        if (tm.loc === 'SILO') st = tm.zone === hitZone ? 'NOT ACCOUNTED FOR' : 'CARRIED OUT, INJURED';
        else if (tm.loc === 'LEAVING') st = 'WALKED OUT, INJURED';
        else if (tm.injured) st = 'WALKED OUT, INJURED';
        out.push({ name: nm, status: st });
      }
    }
    return out;
  }

  allMessages(): MsgDef[] { return MESSAGES; }
}

function approach(v: number, target: number, step: number): number {
  if (v < target) return Math.min(target, v + step);
  if (v > target) return Math.max(target, v - step);
  return v;
}

export function textLen(def: MsgDef): number {
  return def.lines.reduce((n, l) => n + l.length + 1, 0);
}

export { tAt };
