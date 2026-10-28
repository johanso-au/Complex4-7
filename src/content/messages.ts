// Teletype traffic for the prototype shift. All codes and formats are invented.
// Each message is at most 8 lines (see Limits in the design doc).

export type Verdict = 'ACT' | 'EXERCISE' | 'INVALID' | 'RETRANSMIT' | 'FILE';

export const VERDICT_LABEL: Record<Verdict, string> = {
  ACT: 'VALID - ACT',
  EXERCISE: 'VALID - EXERCISE ONLY',
  INVALID: 'INVALID - REPORT',
  RETRANSMIT: 'GARBLED - REQUEST RETRANSMIT',
  FILE: 'FILE',
};

export interface MsgDef {
  id: string;
  /** Arrival time, hhmm Z. Omitted for messages that only arrive on request (retransmits). */
  at?: string;
  kind: 'traffic' | 'info';
  subject: string;
  lines: string[];
  correct: Verdict;
  /** Which rule decides it; quoted in the debrief. */
  rule: string;
  /** Sent 6 minutes after the player requests a retransmit. */
  retransmit?: string;
}

export const MESSAGES: MsgDef[] = [
  {
    id: '0412',
    at: '0805',
    kind: 'traffic',
    subject: 'STA SHIFT CHANGE',
    lines: [
      'ZCZC 0412',
      'FM WING CP   TO LCC 4-7',
      'DTG 170803Z SEP 80',
      'TYPE STA     AUTH KV 2207',
      'SHIFT CHANGE ACKNOWLEDGED. 4-7 REMAINS',
      'ON STRATEGIC ALERT. NO TRAFFIC PENDING.',
      'NNNN',
    ],
    correct: 'ACT',
    rule: 'DTG current, KV series valid 0000-1159Z, type STA.',
  },
  {
    id: '0413',
    at: '0930',
    kind: 'info',
    subject: 'NEWS SUMMARY',
    lines: [
      'ZCZC 0413',
      'FM WING INFO   TO ALL LCC',
      'NEWS SUMMARY 170925Z',
      'POLAND: STRIKE COMMITTEES MEET IN GDANSK',
      'TO FORM A NATIONAL UNION. BAGHDAD SAYS',
      'IT RENOUNCES 1975 BORDER ACCORD W/ IRAN.',
      'NNNN',
    ],
    correct: 'FILE',
    rule: 'Unauthenticated information traffic: file.',
  },
  {
    id: '0414',
    at: '1108',
    kind: 'traffic',
    subject: 'DSP WO 7-121',
    lines: [
      'ZCZC 0414',
      'FM MAINT CTL   TO LCC 4-7',
      'DTG 171106Z SEP 80',
      'TYPE DSP     AUTH KV 6631',
      'WO 7-121 PTS TEAM CONFIRMED 0200Z-0400Z',
      'HASKINS E 44718 / TEAGUE R 45102. LVL 4.',
      'NNNN',
    ],
    correct: 'ACT',
    rule: 'DTG current, KV series valid 0000-1159Z, type DSP.',
  },
  {
    id: '0415',
    at: '1215',
    kind: 'traffic',
    subject: 'EXR EXERCISE',
    lines: [
      'ZCZC 0415',
      'FM WING CP   TO LCC 4-7',
      'DTG 161212Z SEP 80',
      'TYPE EXR     AUTH RL 4410',
      'EXERCISE EXERCISE EXERCISE. ACKNOWLEDGE',
      'RECEIPT OF EXERCISE TRAFFIC. NO ACTION.',
      'NNNN',
    ],
    correct: 'INVALID',
    rule: 'R1: DTG 161212Z is a day old, outside the 2-hour window.',
  },
  {
    id: '0416',
    at: '1405',
    kind: 'traffic',
    subject: 'EXR EXERCISE',
    lines: [
      'ZCZC 0416',
      'FM WING CP   TO LCC 4-7',
      'DTG 1714▒2Z SEP 80',
      'TYPE EXR     AUTH R▒ 0937',
      'EXERCISE EXERCISE EXERCISE. ACK▒▒▒EDGE',
      'RECEIPT OF EXERCISE TRAFFIC. NO ACTION.',
      'NNNN',
    ],
    correct: 'RETRANSMIT',
    rule: 'R4: unreadable characters in DTG and AUTH.',
    retransmit: '0417',
  },
  {
    id: '0417',
    kind: 'traffic',
    subject: 'EXR RETRANSMISSION',
    lines: [
      'ZCZC 0417   RETRANSMISSION OF 0416',
      'FM WING CP   TO LCC 4-7',
      'DTG 171402Z SEP 80',
      'TYPE EXR     AUTH RL 0937',
      'EXERCISE EXERCISE EXERCISE. ACKNOWLEDGE',
      'RECEIPT OF EXERCISE TRAFFIC. NO ACTION.',
      'NNNN',
    ],
    correct: 'EXERCISE',
    rule: 'DTG current, RL series valid 1200-2359Z, type EXR.',
  },
  {
    id: '0418',
    at: '1610',
    kind: 'traffic',
    subject: 'EXR EXERCISE',
    lines: [
      'ZCZC 0418',
      'FM WING CP   TO LCC 4-7',
      'DTG 171608Z SEP 80',
      'TYPE EXR     AUTH KV 5521',
      'EXERCISE EXERCISE EXERCISE. CONFIRM',
      'ALERT STATUS BY RETURN. NO OTHER ACTION.',
      'NNNN',
    ],
    correct: 'INVALID',
    rule: 'R2: KV series expired at 1159Z; 1608Z needs RL.',
  },
  {
    id: '0419',
    at: '1810',
    kind: 'traffic',
    subject: 'STA UTILITY',
    lines: [
      'ZCZC 0419',
      'FM WING CP   TO LCC 4-7',
      'DTG 171807Z SEP 80',
      'TYPE STA     AUTH RL 3018',
      'UTILITY REPORTS LINE FAULT CLEARED.',
      'COMMERCIAL POWER AVAILABLE AT 4-7.',
      'RETRANSFER AT CREW DISCRETION.  NNNN',
    ],
    correct: 'ACT',
    rule: 'DTG current, RL series valid 1200-2359Z, type STA.',
  },
  {
    id: '0420',
    at: '1930',
    kind: 'info',
    subject: 'WING NOTICES',
    lines: [
      'ZCZC 0420',
      'FM WING INFO   TO ALL LCC',
      'NOTICES 171925Z',
      'WX: CLEAR TONIGHT, LOW 54F, WINDS S 5KT.',
      'BASE EXCHANGE CLOSED 18 SEP, INVENTORY.',
      'NNNN',
    ],
    correct: 'FILE',
    rule: 'Unauthenticated information traffic: file.',
  },
  {
    id: '0421',
    at: '0115',
    kind: 'traffic',
    subject: 'STA PTS TEAM',
    lines: [
      'ZCZC 0421',
      'FM MAINT CTL   TO LCC 4-7',
      'DTG 180112Z SEP 80',
      'TYPE STA     AUTH TM 7751',
      'WO 7-121 PTS TEAM DEPARTED BASE 0050Z.',
      'ETA 4-7 0200Z.',
      'NNNN',
    ],
    correct: 'ACT',
    rule: 'DTG current, TM series valid 18 SEP 0000-1159Z, type STA.',
  },
];

export const MSG_BY_ID: Record<string, MsgDef> = Object.fromEntries(MESSAGES.map((m) => [m.id, m]));
