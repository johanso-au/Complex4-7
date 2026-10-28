// Game time is seconds since the start of the shift. The shift runs 0800Z 17 SEP 80 to 0800Z 18 SEP 80.

export const SHIFT_START = 8 * 3600;
export const START_DAY = 17;
export const SHIFT_LENGTH = 24 * 3600;

/** Game seconds that pass per real second while nothing needs the player. Tunable (?rate= in the URL). */
export const CALM_RATE = 240;

export const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0');

export function zParts(t: number) {
  const a = SHIFT_START + Math.floor(t);
  const day = START_DAY + Math.floor(a / 86400);
  const s = ((a % 86400) + 86400) % 86400;
  return { day, hh: Math.floor(s / 3600), mm: Math.floor(s / 60) % 60, ss: s % 60 };
}

export function hhmmZ(t: number): string {
  const p = zParts(t);
  return `${pad(p.hh)}${pad(p.mm)}Z`;
}

export function hhmmssZ(t: number): string {
  const p = zParts(t);
  return `${pad(p.hh)}:${pad(p.mm)}:${pad(p.ss)}Z`;
}

export function clockStr(t: number): string {
  const p = zParts(t);
  return `${p.day} SEP 80 ${pad(p.hh)}:${pad(p.mm)}:${pad(p.ss)}Z`;
}

/** "1300" -> game seconds. Times before 0800 are the next morning. */
export function tAt(hhmm: string): number {
  const hh = Number(hhmm.slice(0, 2));
  const mm = Number(hhmm.slice(2, 4));
  let s = hh * 3600 + mm * 60 - SHIFT_START;
  if (s < 0) s += 86400;
  return s;
}

/** Duration as m:ss, for debrief timelines. */
export function mss(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
