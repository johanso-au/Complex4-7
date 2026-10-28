// Full-screen documents: title, manual, changeover log, debrief, endings.
import type { Game } from '../sim/game';
import { buildDebrief } from '../sim/debrief';
import { hhmmssZ, hhmmZ, mss } from '../sim/time';
import { C, COLS, ROWS, Screen } from './screen';
import type { Opt } from './pages';

export interface DocLine { text: string; c?: number; x?: number }

/** Draw a document: terminal style (phosphor) or paper style. */
export function renderDoc(s: Screen, lines: DocLine[], opts: Opt[], acts: Map<string, () => void>, paper = false, scroll = 0) {
  s.clear();
  acts.clear();
  const v = s.view(0, 0, COLS, ROWS);
  if (paper) v.fill(6, 0, COLS - 12, ROWS - 2, ' ', C.BLACK, { bg: C.PAPER });
  const x0 = paper ? 10 : 6;
  const body = lines.slice(scroll, scroll + ROWS - 4);
  body.forEach((l, i) => {
    v.put(x0 + (l.x ?? 0), 1 + i, l.text, l.c ?? (paper ? C.BLACK : C.GREEN), paper ? { bg: C.PAPER } : {});
  });
  if (lines.length > ROWS - 4) v.put(COLS - 22, ROWS - 3, `[UP/DOWN] ${scroll + 1}-${Math.min(lines.length, scroll + ROWS - 4)}/${lines.length}`, paper ? C.DIM : C.DARK, paper ? { bg: C.PAPER } : {});
  let px = 2;
  opts.forEach((o) => {
    const label = `${o.key} ${o.label}`;
    v.put(px, ROWS - 1, o.key, C.WHITE);
    v.put(px + o.key.length + 1, ROWS - 1, o.label, C.GREEN);
    v.click(px, ROWS - 1, label.length, `doc:${o.key}`);
    acts.set(`doc:${o.key}`, o.fn);
    px += label.length + 4;
  });
}

export const TITLE: DocLine[] = [
  { text: '' }, { text: '' }, { text: '' },
  { text: 'C O M P L E X   4 - 7', c: C.WHITE, x: 30 },
  { text: '' },
  { text: 'LAUNCH COMPLEX 4-7  -  TITAN II  -  17 SEPTEMBER 1980', c: C.CYAN, x: 18 },
  { text: '' }, { text: '' },
  { text: 'You command a launch crew, deep underground. For twenty-four hours', x: 14 },
  { text: 'you decide what is real: the orders, the alarms, the people, and', x: 14 },
  { text: 'the machine itself.', x: 14 },
  { text: '' },
  { text: 'PROTOTYPE SHIFT  -  TERMINAL HMI BUILD (MILESTONE 1)', c: C.DIM, x: 18 },
  { text: 'Best with sound and a keyboard. About 15-20 minutes.', c: C.DIM, x: 18 },
  { text: '' }, { text: '' },
  { text: 'Content: nuclear weapons, industrial accident, injury (reported, never shown).', c: C.DARK, x: 10 },
  { text: 'All codes, procedures and people are invented.', c: C.DARK, x: 10 },
];

export function changeoverLines(src: string[]): DocLine[] {
  return src.map((t, i) => ({ text: t, c: i === 0 ? C.BLACK : t.startsWith('  WO') || t.startsWith('  S1') ? C.BLACK : C.BLACK }));
}

export function debriefLines(g: Game): DocLine[] {
  const d = buildDebrief(g);
  const out: DocLine[] = [];
  const R = C.RED;
  out.push({ text: 'STRATEGIC AIR COMMAND' });
  out.push({ text: 'MISSILE COMBAT CREW PERFORMANCE REPORT                    AF FORM 4-7' });
  out.push({ text: 'LAUNCH COMPLEX 4-7     ALERT 17-18 SEP 80     CREW: MCCC (YOU), LT WHITLOCK' });
  out.push({ text: '─'.repeat(78) });
  out.push({ text: 'AREA              GRADE' });
  for (const [k, gr] of Object.entries(d.grades)) {
    out.push({ text: `${k.padEnd(18)}${gr}`, c: gr === 'SATISFACTORY' ? C.BLACK : R });
  }
  out.push({ text: '' });
  out.push({ text: `STANDING: ${d.standing}`, c: d.strikes ? R : C.BLACK });
  out.push({ text: `STRIKES ON RECORD: ${d.strikes}${g.commendations ? `   COMMENDATIONS: ${g.commendations}` : ''}` });
  if (g.flags.jumped) out.push({ text: '(PLAYTEST JUMP: GRADES COVER ONLY THE PART OF THE SHIFT YOU PLAYED.)', c: C.DIM });
  out.push({ text: '─'.repeat(78) });
  out.push({ text: 'REMARKS (EVALUATOR)' });
  if (!d.marks.length) out.push({ text: '  None. A clean alert.' });
  for (const m of d.marks) {
    const tag = m.level === 'strike' ? 'CITATION' : m.level === 'commend' ? 'COMMEND ' : 'NOTED   ';
    const c = m.level === 'commend' ? C.BLACK : R;
    out.push({ text: `  ${hhmmZ(m.t)} ${tag}  ${m.text}`.slice(0, 80), c });
    if (m.evidence) out.push({ text: `                  Evidence: ${m.evidence}`.slice(0, 80), c: C.DIM });
  }
  if (d.socketLines.length) {
    out.push({ text: '─'.repeat(78) });
    out.push({ text: 'INCIDENT TIMELINE  -  S1 FUEL TANK, LEVEL 4' });
    for (const l of d.socketLines) out.push({ text: `  ${l}`.slice(0, 80), c: l.includes('YOU OPENED') ? R : C.BLACK });
    const s = g.socket!;
    if (s.outcome === 'contained') out.push({ text: '  Leak contained. Tank drained under supervision. 4-7 off alert pending repair.' });
    if (s.outcome === 'late') out.push({ text: '  Leak reported by the maintenance team, not the crew.', c: R });
  }
  out.push({ text: '─'.repeat(78) });
  const farmers = g.messages.filter((m) => m.def.correct === 'INVALID');
  void farmers;
  out.push({ text: 'NEXT SHIFT: 19 SEP 80. (NOT IN THIS PROTOTYPE.)', c: C.DIM });
  return out;
}

export function reliefLines(g: Game): DocLine[] {
  return [
    { text: 'DEPARTMENT OF THE AIR FORCE' },
    { text: 'HEADQUARTERS, 4-7 STRATEGIC MISSILE WING' },
    { text: '' },
    { text: `18 SEPTEMBER 1980` },
    { text: '' },
    { text: 'MEMORANDUM FOR: MISSILE COMBAT CREW COMMANDER, LC 4-7' },
    { text: 'SUBJECT: RELIEF FROM ALERT DUTY' },
    { text: '' },
    { text: `1. Effective on changeover, you are relieved of missile combat crew duty. You` },
    { text: `   received ${g.netStrikes()} citations during the alert of 17-18 SEP 80, as recorded` },
    { text: '   in the attached performance report.' },
    { text: '2. You will surrender your launch key and authenticator access to the oncoming' },
    { text: '   commander and report to the wing standardization office at 0900.' },
    { text: '3. The relief crew has the console. You will be escorted to the portal.' },
    { text: '' },
    { text: '                                        FOR THE COMMANDER' },
    { text: '' },
    { text: 'The relief crew takes your chair. The door you have guarded all shift opens', c: C.DIM },
    { text: 'for you, and closes behind you.', c: C.DIM },
  ];
}

export function damascusLines(g: Game): DocLine[] {
  const e = g.ending!;
  const s = g.socket;
  const out: DocLine[] = [];
  out.push({ text: 'INCIDENT REPORT  -  PRELIMINARY' });
  out.push({ text: 'LAUNCH COMPLEX 4-7   18 SEP 80' });
  out.push({ text: '─'.repeat(78) });
  if (e.cause === 'rupture') {
    out.push({ text: `${hhmmssZ(e.t)}  STAGE 1 FUEL TANK RUPTURED UNDER NITROGEN PRESSURE.` });
    out.push({ text: '          TANK HAD BEEN PIERCED BY A DROPPED SOCKET AT LEVEL 4.' });
  } else {
    out.push({ text: `${hhmmssZ(e.t)}  FUEL VAPOUR IGNITED IN ZONE ${(e.zone ?? 0) + 1} (${g.zones[e.zone ?? 0].levels}).` });
    out.push({ text: `          ZONE ${(e.zone ?? 0) + 1} EXHAUST ${g.fans[g.zones[e.zone ?? 0].fan].running ? 'RUNNING' : 'NOT RUNNING'} AT TIME OF IGNITION.` });
  }
  out.push({ text: '          SILO FIRE. COMPLEX EVACUATED. MISSILE LOST.' });
  out.push({ text: '' });
  out.push({ text: 'PERSONNEL ACCOUNTING' });
  for (const p of g.accounting()) {
    out.push({ text: `  ${p.name.padEnd(22)}${p.status}`, c: p.status.startsWith('NOT') ? C.RED : C.BLACK });
  }
  if (s) {
    out.push({ text: '' });
    out.push({ text: 'WHERE IT COULD HAVE BEEN CAUGHT' });
    const d = buildDebrief(g);
    for (const l of d.socketLines) out.push({ text: `  ${l}`.slice(0, 80), c: l.includes('YOU OPENED') ? C.RED : C.BLACK });
    if (e.cause === 'rupture') {
      out.push({ text: '' });
      out.push({ text: 'TO 4-3 STEP 2: "Confirm no maintenance team or crew on missile levels L4-L6."' });
      out.push({ text: 'TO 4-3 STEP 3: "Confirm S1 FUEL fall rate is normal, slower than 0.10 PSI/MIN."' });
      out.push({ text: `The fall rate at the time was about ${(0.015 * 60).toFixed(1)} PSI/MIN. The conditions were printed every time.`, c: C.RED });
    } else {
      const z = g.zones[e.zone ?? 0];
      out.push({ text: '' });
      out.push({ text: `${z.fan} airflow fed straight into this. Gauge history for ${z.name}:` });
      const tr = g.trends[`AF${z.idx + 1}` as 'AF1'].since(s.dropT - 7200);
      const marks = [s.dropT - 7200, s.dropT - 3600, s.dropT - 600, s.dropT, e.t];
      for (const t of marks) {
        const near = tr.reduce<{ t: number; v: number } | null>((b, x) => (!b || Math.abs(x.t - t) < Math.abs(b.t - t) ? x : b), null);
        if (near) out.push({ text: `  ${hhmmZ(near.t)}  ${z.name} AIRFLOW ${near.v.toFixed(0).padStart(5)} CFM${near.v < 1500 ? '   (BELOW 1500)' : ''}`, c: near.v < 1500 ? C.RED : C.BLACK });
      }
    }
    out.push({ text: '' });
    out.push({ text: `Fuel leak began ${mss(e.t - s.dropT)} before the end.` });
  }
  return out;
}
