import { describe, expect, it } from 'vitest';
import { Game } from '../sim/game';
import { runAutopilot } from '../sim/autopilot';
import { tAt } from '../sim/time';
import { bannerHTML, newMUI, pageHTML, sheetHTML, tabsHTML, topHTML, type MCtx, type MPage } from './views';

function ctx(g: Game) {
  const acts = new Map<string, () => void>();
  const ui = newMUI();
  const c: MCtx = { g, ui, say: () => {}, act: (id, fn) => { acts.set(id, fn); return ` data-act="${id}"`; } };
  return { c, acts, ui };
}

describe('mobile views', () => {
  it('every page and the chrome render at several points in the shift', () => {
    for (const at of ['0900', '1030', '1725', '0215']) {
      const g = new Game();
      runAutopilot(g, tAt(at));
      g.procOpen('TO 4-3');
      const { c, ui } = ctx(g);
      expect(topHTML(g)).toContain('LCC 4-7');
      bannerHTML(c);
      tabsHTML(c);
      ui.sheetOpen = true;
      expect(sheetHTML(c)).toContain('TO 4-3');
      for (const p of ['F1', 'F2', 'F3', 'F4', 'F6', 'F8', 'F9'] as MPage[]) {
        ui.page = p;
        expect(pageHTML(c).length).toBeGreaterThan(50);
      }
      for (const s of ['power', 'prop', 'vent'] as const) { ui.page = 'F3'; ui.plant = s; pageHTML(c); }
      ui.page = 'F8'; ui.binderSel = 5; expect(pageHTML(c)).toContain('OPEN AS ACTIVE CHECKLIST');
      ui.page = 'F9'; ui.woSel = 'WO 7-113'; pageHTML(c);
    }
  });

  it('buttons drive the simulation', () => {
    const g = new Game();
    g.begin();
    const { c, acts, ui } = ctx(g);
    ui.page = 'F3';
    ui.plant = 'vent';
    pageHTML(c);
    acts.get('FAN L4-A:sel:OFF')!();
    expect(g.fans['FAN L4-A'].sel).toBe('OFF');
    acts.get('DMP L2-2:c')!();
    expect(g.dampers['DMP L2-2'].cmdOpen).toBe(false);
    tabsHTML(c);
    acts.get('tab:F4')!();
    expect(ui.page).toBe('F4');
  });

  it('escapes text from the simulation', () => {
    const g = new Game();
    g.begin();
    g.say('LCC', '<b>not markup</b>');
    for (let i = 0; i < 40; i++) g.advance(0.25);
    const { c, ui } = ctx(g);
    ui.page = 'F6';
    expect(pageHTML(c)).not.toContain('<b>not markup');
  });
});
