// Shared by the desktop and mobile front ends: game creation, URL options, sound cues.
import { Game, textLen } from './sim/game';
import { runAutopilot } from './sim/autopilot';
import { tAt } from './sim/time';
import type { Audio } from './ui/audio';

export const params = new URLSearchParams(location.search);

export function newGame(): Game {
  const game = new Game(Number(params.get('seed')) || 4719);
  const r = Number(params.get('rate'));
  if (r > 0) game.calmRate = r;
  return game;
}

/** A game the stand-in crew has played up to hhmm (playtest jump). */
export function jumpGame(hhmm: string): Game {
  const g = newGame();
  runAutopilot(g, tAt(hhmm));
  return g;
}

/** ?jump=0145 boots straight into play at that time (playtesting and screenshots). */
export function bootJump(): string | null {
  const j = params.get('jump');
  return j && /^\d{4}$/.test(j) ? j : null;
}

export interface SoundState { lastRebeep: number; haptics: boolean }

const VIBES: Record<string, number[]> = {
  'alarm-amber': [70],
  'alarm-red': [120, 60, 120, 60, 120],
  clang: [30],
  klaxon: [400, 200, 400, 200, 400],
  strike: [40, 40, 40],
};

/** Play the sim's queued sound cues and keep the room tone, teletype and alarm repeats going. */
export function driveSounds(audio: Audio, g: Game, now: number, st: SoundState) {
  for (const s of g.sfx) {
    audio.play(s);
    if (st.haptics && VIBES[s] && navigator.vibrate) {
      try { navigator.vibrate(VIBES[s]); } catch { /* unsupported */ }
    }
  }
  g.sfx.length = 0;
  const printing = g.messages.some((m) => m.printed > 0 && m.printed < textLen(m.def));
  audio.setTeletype(printing && g.power.busLive);
  const fans = Object.values(g.fans).filter((f) => f.running).length;
  audio.setHum(g.power.busLive ? 0.45 + 0.18 * fans : 0);
  const un = g.alarms.filter((a) => !a.acked);
  if (un.length && now - st.lastRebeep > 3000) {
    st.lastRebeep = now;
    audio.play(un.some((a) => a.sev === 'red') ? 'rebeep-red' : 'rebeep-amber');
  }
}
