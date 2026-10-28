// Tech-order checklists. Each action step is paired with a confirm step.
// Ticking a step is a claim: `check` runs at the moment of the tick, and a false
// claim is recorded as a false confirmation. All procedures are invented.
import type { Game } from '../sim/game';

export type StepKind = 'action' | 'confirm' | 'note' | 'wait';

export interface StepDef {
  kind: StepKind;
  text: string;
  /** True when the claim is honest. Wait steps tick themselves when this turns true. */
  check?: (g: Game) => boolean;
  /** What the debrief shows next to a false tick. */
  evidence?: (g: Game) => string;
}

export interface ProcDef {
  id: string;
  title: string;
  /** Reference-only pages can be read but not opened as an active checklist. */
  reference?: boolean;
  intro?: string[];
  steps: StepDef[];
  onComplete?: (g: Game) => void;
}

const lampEv = (lamp: string) => (g: Game) => `${lamp} lamp was ${g.lamp(lamp) ? 'LIT' : 'DARK'}`;

export const PROCEDURES: ProcDef[] = [
  {
    id: 'TO 4-1',
    title: 'OPERATE AND CONFIRM A VALVE OR DAMPER',
    reference: true,
    intro: [
      'Lamps report what the hardware is doing, never what you commanded.',
      'A dark lamp means closed, a failed channel or lost instrument power.',
    ],
    steps: [
      { kind: 'action', text: 'Command the valve or damper OPEN (or CLOSE).' },
      { kind: 'note', text: 'Wait for travel time: valve about 3 s, damper about 6 s.' },
      { kind: 'confirm', text: 'Confirm the OPEN lamp lit (or dark for CLOSE).' },
      { kind: 'note', text: 'If the lamp does not change after travel: command the opposite position, wait, then command again (one cycle).' },
      { kind: 'note', text: 'If two cycles fail, dispatch a technician for manual operation.' },
    ],
  },
  {
    id: 'TO 4-2',
    title: 'POINT TEST (SYSTEM SELF-TEST)',
    reference: true,
    intro: ['Run on each F3 system page. Required before critical procedures and once a shift (WO 7-100).'],
    steps: [
      { kind: 'action', text: 'On the F3 system page, select POINT TEST.' },
      { kind: 'confirm', text: 'Every lamp on the page lights; every analog point reads 50% of span.' },
      { kind: 'note', text: 'A point that stays dark or at zero is a FAILED INPUT CHANNEL.' },
      { kind: 'action', text: 'Select the component and TAG CHANNEL FAILED. Report to maintenance control.' },
    ],
  },
  {
    id: 'TO 4-3',
    title: 'NITROGEN TOP-UP, STAGE 1 FUEL TANK',
    intro: ['Use when S1 FUEL pressure creeps below 11.0 PSIG.', 'All three conditions must be met before opening the valve.'],
    steps: [
      {
        kind: 'confirm',
        text: 'Confirm no VAPOUR HIGH alarm on any level (F1).',
        check: (g) => !g.anyVapourHigh(),
        evidence: (g) => `Vapour alarm active: ${g.vapourHighList().join(', ')}`,
      },
      {
        kind: 'confirm',
        text: 'Confirm no maintenance team or crew on missile levels L4-L6 (F1 OCC, F9).',
        check: (g) => g.zoneOccupancy(1).length === 0,
        evidence: (g) => `On L4-L6: ${g.zoneOccupancy(1).join(', ')}`,
      },
      {
        kind: 'confirm',
        text: 'Confirm S1 FUEL fall rate is normal, slower than 0.10 PSI/MIN (F2).',
        check: (g) => g.rate('S1F') > -0.1,
        evidence: (g) => `S1 FUEL rate was ${g.rate('S1F').toFixed(2)} PSI/MIN`,
      },
      { kind: 'action', text: 'Command VLV N2-F1 OPEN (F3 > 2 PROPELLANTS).', check: (g) => g.valves['N2-F1'].cmdOpen },
      {
        kind: 'confirm',
        text: 'Confirm VLV N2-F1 OPEN lamp lit.',
        check: (g) => g.lamp('VLV N2-F1 OPEN'),
        evidence: lampEv('VLV N2-F1 OPEN'),
      },
      {
        kind: 'action',
        text: 'When S1 FUEL reads 13.0 +/-0.3 PSIG, command VLV N2-F1 CLOSE.',
        check: (g) => !g.valves['N2-F1'].cmdOpen,
      },
      {
        kind: 'confirm',
        text: 'Confirm VLV N2-F1 OPEN lamp dark.',
        check: (g) => !g.lamp('VLV N2-F1 OPEN'),
        evidence: lampEv('VLV N2-F1 OPEN'),
      },
      {
        kind: 'confirm',
        text: 'Confirm S1 FUEL within band 11.0-15.0 PSIG.',
        check: (g) => g.ind.S1F >= 11 && g.ind.S1F <= 15,
        evidence: (g) => `S1 FUEL read ${g.ind.S1F.toFixed(2)} PSIG`,
      },
    ],
    onComplete: (g) => g.onTopUpComplete(),
  },
  {
    id: 'TO 4-4',
    title: 'VAPOUR ALARM RESPONSE',
    intro: ['Every critical vapour point has two detectors. Cross-check before you act.'],
    steps: [
      {
        kind: 'confirm',
        text: 'Confirm airflow in the alarmed zone above 1500 CFM (F1).',
        check: (g) => g.alarmedZones().every((z) => g.ind.AF[z] > 1500),
        evidence: (g) => g.alarmedZones().map((z) => `Z${z + 1} ${Math.round(g.ind.AF[z])} CFM`).join(', ') || 'no zone in alarm',
      },
      {
        kind: 'note',
        text: 'Compare the paired detectors. If BOTH read above 10 %LEL, stop: go to TO 4-6 PROPELLANT LEAK. If ONE reads high, continue.',
      },
      {
        kind: 'action',
        text: 'Radio a technician to inspect the high detector (F6 > RADIO).',
        check: (g) => g.flags.inspectOrdered === true,
      },
      { kind: 'wait', text: 'Technician reports.', check: (g) => g.flags.inspectReported === true },
      {
        kind: 'action',
        text: 'If the detector is faulty: tag it out (F3 > 3 VENT > 7 DETECTORS).',
        check: (g) => Object.values(g.sensors).some((s) => s.tagged),
      },
      {
        kind: 'action',
        text: 'Report the detector to maintenance control (F6 > PHONE).',
        check: (g) => g.flags.detectorReported === true,
      },
    ],
  },
  {
    id: 'TO 4-5',
    title: 'POWER TRANSFER AND EQUIPMENT RESTART',
    intro: ['After any loss of bus power, motors do NOT restart on their own.'],
    steps: [
      { kind: 'confirm', text: 'Confirm DG-1 RUN lamp lit.', check: (g) => g.lamp('DG-1 RUN'), evidence: lampEv('DG-1 RUN') },
      { kind: 'confirm', text: 'Confirm CB-2 CLOSED lamp lit.', check: (g) => g.lamp('CB-2 CLOSED'), evidence: lampEv('CB-2 CLOSED') },
      {
        kind: 'confirm',
        text: 'Confirm bus 480 V +/-5%, 60.0 HZ +/-0.5 (F3 > 1 POWER).',
        check: (g) => Math.abs(g.ind.BUSV - 480) <= 24 && Math.abs(g.ind.BUSHZ - 60) <= 0.5,
        evidence: (g) => `Bus read ${g.ind.BUSV.toFixed(0)} V, ${g.ind.BUSHZ.toFixed(1)} HZ`,
      },
      { kind: 'action', text: 'Command FAN L2-A START.', check: (g) => g.fans['FAN L2-A'].latched },
      { kind: 'confirm', text: 'Confirm FAN L2-A RUN lamp lit.', check: (g) => g.lamp('FAN L2-A RUN'), evidence: lampEv('FAN L2-A RUN') },
      { kind: 'action', text: 'Command FAN L4-A START.', check: (g) => g.fans['FAN L4-A'].latched },
      { kind: 'confirm', text: 'Confirm FAN L4-A RUN lamp lit.', check: (g) => g.lamp('FAN L4-A RUN'), evidence: lampEv('FAN L4-A RUN') },
      {
        kind: 'action',
        text: 'Command FAN L7-A START (skip if tagged out under a work order).',
        check: (g) => g.fans['FAN L7-A'].latched || g.fans['FAN L7-A'].tag !== null,
      },
      {
        kind: 'confirm',
        text: 'Confirm FAN L7-A RUN lamp lit (or tagged out).',
        check: (g) => g.lamp('FAN L7-A RUN') || g.fans['FAN L7-A'].tag !== null,
        evidence: lampEv('FAN L7-A RUN'),
      },
      {
        kind: 'confirm',
        text: 'Confirm airflow above 1500 CFM in every zone not tagged out.',
        check: (g) => g.zones.every((z) => g.ind.AF[z.idx] > 1500 || g.zoneTagged(z.idx)),
        evidence: (g) => g.zones.map((z) => `Z${z.idx + 1} ${Math.round(g.ind.AF[z.idx])}`).join(', ') + ' CFM',
      },
      { kind: 'action', text: 'Report the transfer to command post (F6 > PHONE).', check: (g) => g.flags.powerReported === true },
    ],
  },
  {
    id: 'TO 4-6',
    title: 'PROPELLANT LEAK RESPONSE',
    intro: ['A falling tank pressure with a vapour alarm is a leak until proven otherwise.', 'NEVER pressurise a leaking tank.'],
    steps: [
      { kind: 'action', text: 'Order all silo personnel to the LCC (F6 > RADIO > PA: EVACUATE SILO).', check: (g) => g.flags.evacOrdered === true },
      {
        kind: 'confirm',
        text: 'Confirm VLV N2-F1 and VLV N2-F2 OPEN lamps dark.',
        check: (g) => !g.lamp('VLV N2-F1 OPEN') && !g.lamp('VLV N2-F2 OPEN'),
        evidence: lampEv('VLV N2-F1 OPEN'),
      },
      {
        kind: 'confirm',
        text: 'Confirm FAN L4-A and FAN L7-A RUN lamps lit.',
        check: (g) => g.lamp('FAN L4-A RUN') && g.lamp('FAN L7-A RUN'),
        evidence: (g) => `FAN L4-A ${g.lamp('FAN L4-A RUN') ? 'LIT' : 'DARK'}, FAN L7-A ${g.lamp('FAN L7-A RUN') ? 'LIT' : 'DARK'}`,
      },
      {
        kind: 'confirm',
        text: 'Confirm DMP L4-2 and DMP L7-2 OPEN lamps lit.',
        check: (g) => g.lamp('DMP L4-2 OPEN') && g.lamp('DMP L7-2 OPEN'),
        evidence: (g) => `DMP L4-2 ${g.lamp('DMP L4-2 OPEN') ? 'LIT' : 'DARK'}, DMP L7-2 ${g.lamp('DMP L7-2 OPEN') ? 'LIT' : 'DARK'}`,
      },
      { kind: 'action', text: 'Report the leak to command post (F6 > PHONE).', check: (g) => g.flags.leakReported === true },
      {
        kind: 'confirm',
        text: 'Confirm silo occupancy clear, all levels (F1).',
        check: (g) => g.silOccupants().length === 0,
        evidence: (g) => `Still in silo: ${g.silOccupants().join(', ')}`,
      },
      {
        kind: 'confirm',
        text: 'Confirm vapour below 25 %LEL on every untagged detector.',
        check: (g) => Object.values(g.sensors).every((s) => s.tagged || g.ind.VD[s.id] < 25),
        evidence: (g) =>
          Object.values(g.sensors)
            .filter((s) => !s.tagged && g.ind.VD[s.id] >= 25)
            .map((s) => `${s.id} ${g.ind.VD[s.id].toFixed(1)}`)
            .join(', '),
      },
    ],
  },
  // Work-order checklists. Opened from F9.
  {
    id: 'WO 7-113',
    title: 'WO 7-113 FAN L7-A BEARING INSPECTION',
    intro: ['Isolate, release the team, then restore and test.'],
    steps: [
      { kind: 'action', text: 'Check team against dispatch sheet; ADMIT (F9).', check: (g) => g.teams.T113.loc !== 'PORTAL' && g.teams.T113.loc !== 'NONE' },
      { kind: 'action', text: 'Command FAN L7-A selector OFF (F3 > 3 VENT).', check: (g) => g.fans['FAN L7-A'].sel === 'OFF' },
      { kind: 'confirm', text: 'Confirm FAN L7-A RUN lamp dark.', check: (g) => !g.lamp('FAN L7-A RUN'), evidence: lampEv('FAN L7-A RUN') },
      { kind: 'action', text: 'Command DMP L7-2 CLOSE.', check: (g) => !g.dampers['DMP L7-2'].cmdOpen },
      { kind: 'confirm', text: 'Confirm DMP L7-2 OPEN lamp dark.', check: (g) => !g.lamp('DMP L7-2 OPEN'), evidence: lampEv('DMP L7-2 OPEN') },
      { kind: 'action', text: 'APPLY TAGS to FAN L7-A and DMP L7-2 (F9).', check: (g) => g.wos['WO 7-113'].tagsOn },
      { kind: 'action', text: 'RELEASE TEAM TO WORK (F9).', check: (g) => g.wos['WO 7-113'].state !== 'ISOLATING' },
      { kind: 'wait', text: 'Team reports work complete.', check: (g) => ['RESTORE', 'CLOSED'].includes(g.wos['WO 7-113'].state) },
      { kind: 'action', text: 'REMOVE TAGS (F9).', check: (g) => !g.wos['WO 7-113'].tagsOn },
      { kind: 'action', text: 'Command DMP L7-2 OPEN.', check: (g) => g.dampers['DMP L7-2'].cmdOpen },
      {
        kind: 'confirm',
        text: 'Confirm DMP L7-2 OPEN lamp lit. (No lamp after travel: cycle per TO 4-1.)',
        check: (g) => g.lamp('DMP L7-2 OPEN'),
        evidence: lampEv('DMP L7-2 OPEN'),
      },
      {
        kind: 'action',
        text: 'Command FAN L7-A selector RUN, then START.',
        check: (g) => g.fans['FAN L7-A'].sel === 'RUN' && g.fans['FAN L7-A'].latched,
      },
      {
        kind: 'confirm',
        text: 'Confirm FAN L7-A RUN lamp lit and L7 airflow rising.',
        check: (g) => g.lamp('FAN L7-A RUN') && (g.ind.AF[2] > 1500 || g.trendRising('AF3')),
        evidence: (g) => `FAN L7-A ${g.lamp('FAN L7-A RUN') ? 'LIT' : 'DARK'}, Z3 airflow ${Math.round(g.ind.AF[2])} CFM`,
      },
      { kind: 'action', text: 'CLOSE WO (F9).', check: (g) => g.wos['WO 7-113'].state === 'CLOSED' },
    ],
  },
  {
    id: 'WO 7-121',
    title: 'WO 7-121 S1 FUEL TANK CAP LEAK CHECK',
    intro: ['PTS team works on the missile at level 4. People in the silo need ventilation.'],
    steps: [
      { kind: 'action', text: 'Check team against dispatch sheet; ADMIT (F9).', check: (g) => g.teams.T121.loc !== 'PORTAL' && g.teams.T121.loc !== 'NONE' },
      {
        kind: 'confirm',
        text: 'Confirm FAN L4-A RUN lamp lit and Z2 airflow above 1500 CFM.',
        check: (g) => g.lamp('FAN L4-A RUN') && g.ind.AF[1] > 1500,
        evidence: (g) => `FAN L4-A ${g.lamp('FAN L4-A RUN') ? 'LIT' : 'DARK'}, Z2 ${Math.round(g.ind.AF[1])} CFM`,
      },
      { kind: 'action', text: 'RELEASE TEAM TO WORK (F9).', check: (g) => g.wos['WO 7-121'].state !== 'ISOLATING' },
      { kind: 'wait', text: 'Team reports work complete.', check: (g) => ['RESTORE', 'CLOSED', 'CANCELLED'].includes(g.wos['WO 7-121'].state) },
      { kind: 'action', text: 'CLOSE WO (F9).', check: (g) => ['CLOSED', 'CANCELLED'].includes(g.wos['WO 7-121'].state) },
    ],
  },
];

export const PROC_BY_ID: Record<string, ProcDef> = Object.fromEntries(PROCEDURES.map((p) => [p.id, p]));
