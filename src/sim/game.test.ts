import { describe, expect, it } from 'vitest';
import { Game, textLen } from './game';
import { tAt } from './time';
import { buildDebrief } from './debrief';
import { autopilot, runAutopilot } from './autopilot';

describe('autopilot shift', () => {
  it('a diligent crew finishes the day with satisfactory grades before the socket', () => {
    const g = new Game();
    runAutopilot(g, tAt('0145'));
    expect(g.ending).toBeNull();
    expect(g.wos['WO 7-100'].state).toBe('CLOSED');
    expect(g.wos['WO 7-113'].state).toBe('CLOSED');
    expect(g.fans['FAN L7-A'].running).toBe(true);
    expect(g.tanks.S1F.p).toBeGreaterThan(11);
  });
});

/** Run game time in small steps, letting an optional player hook act every second. */
function run(g: Game, until: number, player?: (g: Game) => void) {
  let acc = 0;
  while (g.t < until && !g.ending) {
    g.advance(0.05); // real time; compressed automatically when calm
    acc += 0.05;
    if (acc >= 0.5) { acc = 0; player?.(g); }
  }
}

/** A diligent player: acks, answers traffic correctly, keeps the plant in band. Leaves the socket to the test. */
const diligent = autopilot;

describe('time model', () => {
  it('compresses calm periods and drops to real time for events', () => {
    const g = new Game();
    g.begin();
    g.advance(0.2); // first ticks
    // Nothing needs the player at 0800: a second of real time covers minutes of game time.
    const t0 = g.t;
    for (let i = 0; i < 4; i++) g.advance(0.25);
    expect(g.t - t0).toBeGreaterThan(200);
    run(g, tAt('0806'), () => {});
    // An unanswered message holds the clock at 1x.
    const t1 = g.t;
    g.advance(1);
    expect(g.t - t1).toBeLessThan(1.1);
  });
});

describe('plant', () => {
  it('stage 1 fuel creeps below band around 1300Z and top-up raises it', () => {
    const g = new Game();
    g.begin();
    run(g, tAt('1250'), diligent);
    expect(g.tanks.S1F.p).toBeLessThan(11.3);
    run(g, tAt('1400'), diligent);
    expect(g.tanks.S1F.p).toBeGreaterThan(12.5);
  });

  it('power loss trips the fans and the diesel picks up the bus', () => {
    const g = new Game();
    g.begin();
    run(g, tAt('1720') + 5, (x) => { while (x.ack()); for (const m of x.messages) if (!m.verdict && m.printed >= textLen(m.def)) x.answer(m.def.id, m.def.correct); });
    expect(g.power.busLive).toBe(false);
    run(g, tAt('1720') + 20, () => {});
    expect(g.power.busLive).toBe(true);
    expect(g.power.cb2).toBe(true);
    expect(Object.values(g.fans).every((f) => !f.running)).toBe(true);
  });
});

describe('the socket beat', () => {
  function toDrop(): Game {
    const g = new Game();
    g.begin();
    run(g, tAt('0300'), (x) => { diligent(x); });
    return g;
  }

  it('happens to a diligent player', () => {
    const g = toDrop();
    expect(g.socket).not.toBeNull();
    expect(g.tanks.S1F.punctured).toBe(true);
  });

  it('pressurising the pierced tank ruptures it', () => {
    const g = new Game();
    g.begin();
    run(g, tAt('0300'), (x) => {
      diligent(x);
      if (x.socket && x.t - x.socket.dropT > 30 && !x.valves['N2-F1'].cmdOpen) x.valveCmd('N2-F1', true);
    });
    expect(g.ending?.kind).toBe('damascus');
    expect(g.ending?.cause).toBe('rupture');
    expect(g.socket?.valveT).toBeDefined();
  });

  it('evacuate, ventilate and report: contained, shift completes', () => {
    const g = new Game();
    g.begin();
    run(g, tAt('0759') + 120, (x) => {
      diligent(x);
      if (x.socket?.active) {
        if (!x.flags.evacOrdered) x.queryTeam('T121');
        if (!x.flags.evacOrdered) x.evacuate();
        if (!x.flags.leakReported && !x.commsBusy()) x.reportLeak();
      }
    });
    expect(g.ending?.kind).toBe('complete');
    expect(g.socket?.outcome).toBe('contained');
    expect(g.status).toBe('OFF ALERT (MAINTENANCE)');
    const d = buildDebrief(g);
    expect(d.socketLines.length).toBeGreaterThan(3);
  });

  it('with the L7 fan never restored, vapour reaches ignition', () => {
    const g = new Game();
    g.begin();
    run(g, tAt('0759') + 120, (x) => {
      diligent(x);
      // Sabotage the restoration: fan L7-A stays off.
      if (x.wos['WO 7-113'].state === 'CLOSED' && !x.flags.sab) { x.flags.sab = true; x.fanSel('FAN L7-A', 'OFF'); }
      if (x.flags.sab) x.fans['FAN L7-A'].latched = false;
      if (x.socket?.active) {
        if (!x.flags.evacOrdered) x.evacuate();
        if (!x.flags.leakReported && !x.commsBusy()) x.reportLeak();
      }
    });
    expect(g.ending?.kind).toBe('damascus');
    expect(g.ending?.cause).toBe('ignition');
    expect(g.ending?.zone).toBe(2);
  });
});

describe('procedures', () => {
  it('ticking a confirm step against a dark lamp is a false confirmation strike', () => {
    const g = new Game();
    g.begin();
    g.procOpen('TO 4-3');
    g.procTick(); g.procTick(); g.procTick(); // conditions are true at 0800
    g.valveCmd('N2-F1', true);
    g.procTick(); // action: commanded
    const before = g.strikes;
    g.procTick(); // confirm OPEN lamp immediately: valve still travelling, lamp dark
    expect(g.strikes).toBe(before + 1);
    expect(g.notes.some((n) => n.text.startsWith('False confirmation'))).toBe(true);
  });

  it('verdict on invalid traffic as valid is a strike', () => {
    const g = new Game();
    g.begin();
    run(g, tAt('1216'), (x) => { while (x.ack()); for (const m of x.messages) if (!m.verdict && m.printed >= textLen(m.def) && m.def.id !== '0415') x.answer(m.def.id, m.def.correct); });
    const m = g.messages.find((x) => x.def.id === '0415')!;
    while (m.printed < textLen(m.def)) g.advance(0.1);
    const before = g.strikes;
    g.answer('0415', 'EXERCISE');
    expect(g.strikes).toBe(before + 1);
  });
});
