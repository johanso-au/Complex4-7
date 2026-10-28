// End-of-shift performance report. Grades four areas; explains every miss.
import type { Area, Game, Note } from './game';
import { textLen } from './game';
import { hhmmssZ, mss } from './time';

export type Grade = 'SATISFACTORY' | 'MARGINAL' | 'UNSATISFACTORY';

export interface Debrief {
  grades: Record<Area, Grade>;
  marks: Note[];
  standing: string;
  strikes: number;
  relieved: boolean;
  socketLines: string[];
  farmer?: string;
}

export function buildDebrief(g: Game): Debrief {
  const extra: Note[] = [];
  const add = (area: Area, level: Note['level'], text: string) => extra.push({ t: g.t, area, level, text });

  // Unfinished business at changeover.
  for (const m of g.messages) {
    if (!m.verdict && m.printed >= textLen(m.def)) add('VERIFICATION', 'marginal', `MSG ${m.def.id} left unanswered at changeover.`);
  }
  for (const wo of Object.values(g.wos)) {
    if (!['CLOSED', 'CANCELLED'].includes(wo.state)) add('PLANT', 'marginal', `${wo.id} still open at changeover (${wo.state}).`);
  }
  if (!g.pointTest.power.done || !g.pointTest.prop.done || !g.pointTest.vent.done) add('PLANT', 'marginal', 'Daily point tests not all run.');
  if (g.valves['N2-F2'].failedChannel && !g.valves['N2-F2'].channelTagged) add('PLANT', 'marginal', 'Failed input channel VLV N2-F2 never found.');
  if (g.sensors['VD L7-A'].drifting && !g.sensors['VD L7-A'].tagged) add('PLANT', 'marginal', 'Faulty detector VD L7-A left in service.');
  for (const f of Object.values(g.fans)) {
    if (!f.running && !f.tag) add('PLANT', 'marginal', `${f.id} not running at changeover.`);
  }
  const avgAck = g.ackTimes.length ? g.ackTimes.reduce((a, b) => a + b, 0) / g.ackTimes.length : 0;
  if (avgAck > 60) add('TIMELINESS', 'marginal', `Alarms took ${Math.round(avgAck)} s on average to acknowledge.`);

  const marks = [...g.notes, ...extra];
  const grade = (area: Area): Grade => {
    const ns = marks.filter((n) => n.area === area);
    if (ns.some((n) => n.level === 'strike')) return 'UNSATISFACTORY';
    const m = ns.filter((n) => n.level === 'marginal').length;
    if (m >= 3) return 'UNSATISFACTORY';
    if (m >= 1) return 'MARGINAL';
    return 'SATISFACTORY';
  };

  const socketLines: string[] = [];
  const s = g.socket;
  if (s) {
    const rel = (t?: number) => (t === undefined ? '  --  ' : `+${mss(t - s.dropT)}`.padEnd(6));
    socketLines.push(`${hhmmssZ(s.dropT)}  +0:00  [clang] on the L4 radio channel, then silence`);
    socketLines.push(`${hhmmssZ(s.dropT + 20)}  +0:20  S1 FUEL falling ~0.9 PSI/MIN (usual creep 0.003)`);
    if (s.vapourAmberT !== undefined) socketLines.push(`${hhmmssZ(s.vapourAmberT)}  ${rel(s.vapourAmberT)}  VAPOUR L4 HIGH alarm`);
    if (s.lowLampT !== undefined) socketLines.push(`${hhmmssZ(s.lowLampT)}  ${rel(s.lowLampT)}  S1 FUEL PRESS LOW (same alarm as every top-up)`);
    if (s.reportT !== undefined) socketLines.push(`${hhmmssZ(s.reportT)}  ${rel(s.reportT)}  Team reported the socket (${s.reportHow === 'query' ? 'you radioed them' : `unprompted, after ${mss(s.reportDelay)}`})`);
    if (s.valveT !== undefined) socketLines.push(`${hhmmssZ(s.valveT)}  ${rel(s.valveT)}  YOU OPENED VLV N2-F1 ON A PIERCED TANK`);
    if (s.evacT !== undefined) socketLines.push(`${hhmmssZ(s.evacT)}  ${rel(s.evacT)}  Silo evacuation ordered`);
    if (s.cpT !== undefined) socketLines.push(`${hhmmssZ(s.cpT)}  ${rel(s.cpT)}  Leak reported to command post`);
    socketLines.sort();
  }

  const strikes = g.netStrikes();
  return {
    grades: { PROCEDURE: grade('PROCEDURE'), VERIFICATION: grade('VERIFICATION'), PLANT: grade('PLANT'), TIMELINESS: grade('TIMELINESS') },
    marks: marks.filter((n) => n.level !== 'info'),
    standing: g.standing(),
    strikes,
    relieved: strikes >= 3,
    socketLines,
  };
}
