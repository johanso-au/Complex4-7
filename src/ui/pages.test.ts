import { describe, expect, it } from 'vitest';
import { Game } from '../sim/game';
import { runAutopilot } from '../sim/autopilot';
import { tAt } from '../sim/time';
import { COLS, ROWS, Screen } from './screen';
import { newUI, renderGame, type PageId } from './pages';
import { damascusLines, debriefLines, renderDoc } from './docs';

const DUMP = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.DUMP;

function dump(s: Screen): string {
  const rows: string[] = [];
  for (let y = 0; y < ROWS; y++) rows.push(s.ch.slice(y * COLS, (y + 1) * COLS).join('').trimEnd());
  return rows.join('\n');
}

describe('pages render', () => {
  it('every page renders mid-shift without throwing', () => {
    const g = new Game();
    runAutopilot(g, tAt('1030'));
    g.procOpen('TO 4-3');
    const s = new Screen();
    const ui = newUI();
    const out: string[] = [];
    for (const p of ['F1', 'F2', 'F3', 'F4', 'F6', 'F8', 'F9'] as PageId[]) {
      ui.page = p;
      renderGame(g, ui, s, true);
      out.push(dump(s));
    }
    ui.page = 'F3'; ui.f3 = 'vent'; renderGame(g, ui, s, true); out.push(dump(s));
    ui.f3 = 'power'; renderGame(g, ui, s, true); out.push(dump(s));
    ui.f3 = 'prop'; renderGame(g, ui, s, true); out.push(dump(s));
    ui.page = 'F9'; ui.woSel = 'WO 7-113'; renderGame(g, ui, s, true); out.push(dump(s));
    ui.page = 'F8'; ui.binderSel = 5; renderGame(g, ui, s, true); out.push(dump(s));
    if (DUMP) console.log(out.join('\n' + '='.repeat(100) + '\n'));
    expect(out.length).toBe(12);
  });

  it('debrief and ending documents render', () => {
    const g = new Game();
    runAutopilot(g, tAt('0300'));
    const s = new Screen();
    const acts = new Map<string, () => void>();
    renderDoc(s, debriefLines(g), [], acts, true);
    if (DUMP) console.log(dump(s));
    if (g.ending) renderDoc(s, damascusLines(g), [], acts, true);
    expect(dump(s)).toContain('PERFORMANCE REPORT');
  });
});
