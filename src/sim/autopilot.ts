// A diligent stand-in crew. Used by tests and by the playtest "jump ahead" option:
// it acks, answers traffic correctly, works the orders and keeps the plant in band.
// It never touches the socket beat; that is the player's.
import type { Game } from './game';
import { textLen } from './game';

export function autopilot(g: Game) {
  while (g.ack());
  for (const m of g.messages) if (!m.verdict && m.printed >= textLen(m.def)) g.answer(m.def.id, m.def.correct);

  for (const k of ['power', 'prop', 'vent'] as const) if (!g.pointTest[k].done && g.pointTest[k].until < 0) g.startPointTest(k);
  if (g.pointTest.prop.done && !g.valves['N2-F2'].channelTagged) g.tagChannel('N2-F2');
  if (g.pointTest.power.done && g.pointTest.prop.done && g.pointTest.vent.done && g.wos['WO 7-100'].state === 'OPEN') g.woClose('WO 7-100');

  const w113 = g.wos['WO 7-113'];
  if (w113.state === 'TEAM AT PORTAL') g.woAdmit('WO 7-113');
  if (w113.state === 'ISOLATING') {
    g.fanSel('FAN L7-A', 'OFF');
    g.damperCmd('DMP L7-2', false);
    if (!g.dampers['DMP L7-2'].pos && !w113.tagsOn) g.woApplyTags('WO 7-113');
    if (w113.tagsOn) g.woRelease('WO 7-113');
  }
  if (w113.state === 'RESTORE') {
    if (w113.tagsOn) g.woRemoveTags('WO 7-113');
    const d = g.dampers['DMP L7-2'];
    if (!d.cmdOpen) g.damperCmd('DMP L7-2', true);
    else if (d.stuck && !g.moving()) g.damperCmd('DMP L7-2', false);
    if (g.fans['FAN L7-A'].sel !== 'RUN') g.fanSel('FAN L7-A', 'RUN');
    if (!g.fans['FAN L7-A'].latched) g.fanStart('FAN L7-A');
    if (g.lamp('FAN L7-A RUN') && g.lamp('DMP L7-2 OPEN')) g.woClose('WO 7-113');
  }
  const w121 = g.wos['WO 7-121'];
  if (w121.state === 'TEAM AT PORTAL') g.woAdmit('WO 7-121');
  if (w121.state === 'ISOLATING') g.woRelease('WO 7-121');
  g.procs.splice(0, g.procs.length);
  g.procFocus = 0;

  if (!g.socket && g.ind.S1F < 11 && !g.valves['N2-F1'].cmdOpen) g.valveCmd('N2-F1', true);
  if (g.valves['N2-F1'].cmdOpen && g.ind.S1F >= 13) g.valveCmd('N2-F1', false);

  for (const f of Object.values(g.fans)) {
    if (!f.tag && !f.latched && g.power.busLive) {
      if (f.sel === 'OFF') g.fanSel(f.id, 'RUN');
      g.fanStart(f.id);
    }
  }
  if (g.flags.lastBusDrop !== undefined && !g.flags.powerReported && !g.commsBusy()) g.reportPower();
  for (const s of Object.values(g.sensors)) if (s.drifting && !s.tagged && g.ind.VD[s.id] > 10) g.sensorTag(s.id, true);
  if (g.sensors['VD L7-A'].tagged && !g.flags.detectorReported && !g.commsBusy()) g.reportDetector();
}

/** Run the stand-in crew until game time `until` (seconds since shift start). */
export function runAutopilot(g: Game, until: number) {
  let acc = 0;
  g.begin();
  while (g.t < until && !g.ending) {
    g.advance(0.05);
    acc += 0.05;
    if (acc >= 0.5) { acc = 0; autopilot(g); }
  }
  // Leave the record clean: the stand-in's shift is not the player's.
  g.notes = [];
  g.strikes = 0;
  g.commendations = 0;
  g.ackTimes = [];
  g.sfx = [];
  g.flags.jumped = true;
}
