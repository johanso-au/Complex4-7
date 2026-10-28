// Draws the character grid to a canvas. Box-drawing and block characters are drawn
// as rectangles so the grid stays exact whatever the font provides.
import { C, COLS, ROWS, Screen } from './screen';

export const PALETTE: Record<number, string> = {
  [C.BLACK]: '#050806',
  [C.GREEN]: '#4dff88',
  [C.AMBER]: '#ffb52e',
  [C.RED]: '#ff4a3d',
  [C.CYAN]: '#5fd8ff',
  [C.WHITE]: '#e6f2e8',
  [C.DIM]: '#5b8a68',
  [C.DARK]: '#22382a',
  [C.BAND]: '#0c2a17',
  [C.AMBERBG]: '#3a2804',
  [C.REDBG]: '#3d0c09',
  [C.PAPER]: '#d8d2bd',
};

const FONT = '"VT323", "Consolas", monospace';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  cw = 10;
  chH = 20;
  dpr = 1;

  constructor(public canvas: HTMLCanvasElement, public glow: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Cells are about 1:1.9; fit the whole grid in the viewport with a small margin.
    const cw = Math.max(4, Math.floor(Math.min((vw - 16) / COLS, (vh - 16) / (ROWS * 1.9))));
    const ch = Math.round(cw * 1.9);
    this.cw = cw;
    this.chH = ch;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [this.canvas, this.glow]) {
      c.width = COLS * cw * this.dpr;
      c.height = ROWS * ch * this.dpr;
      c.style.width = `${COLS * cw}px`;
      c.style.height = `${ROWS * ch}px`;
    }
  }

  cellAt(clientX: number, clientY: number): { x: number; y: number } | null {
    const r = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - r.left) / this.cw);
    const y = Math.floor((clientY - r.top) / this.chH);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
    return { x, y };
  }

  draw(s: Screen, blinkOn: boolean, hover: string | null) {
    const ctx = this.ctx;
    const d = this.dpr;
    const w = this.cw * d;
    const h = this.chH * d;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE[C.BLACK];
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(h * 0.92)}px ${FONT}`;
    const lw = Math.max(1, Math.round(w * 0.14));

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x;
        const px = x * w;
        const py = y * h;
        const bg = s.bg[i];
        const act = s.act[i];
        if (bg) { ctx.fillStyle = PALETTE[bg]; ctx.fillRect(px, py, w + 0.5, h + 0.5); }
        if (act && act === hover) { ctx.fillStyle = 'rgba(77,255,136,0.16)'; ctx.fillRect(px, py, w + 0.5, h + 0.5); }
        const c = s.ch[i];
        if (c === ' ' || (s.blink[i] && !blinkOn)) continue;
        ctx.fillStyle = PALETTE[s.fg[i]] ?? PALETTE[C.GREEN];
        if (!drawGlyph(ctx, c, px, py, w, h, lw)) ctx.fillText(c, px + w / 2, py + h / 2 + h * 0.04);
      }
    }
    // Glow layer: a blurred copy behind the crisp one (CSS applies the blur).
    const g = this.glow.getContext('2d')!;
    g.clearRect(0, 0, this.glow.width, this.glow.height);
    g.drawImage(this.canvas, 0, 0);
  }
}

/** Draws line and block characters as shapes. Returns false for ordinary text. */
function drawGlyph(ctx: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number, lw: number): boolean {
  const cx = Math.round(x + w / 2 - lw / 2);
  const cy = Math.round(y + h / 2 - lw / 2);
  const H = (x0: number, x1: number) => ctx.fillRect(x0, cy, x1 - x0, lw);
  const V = (y0: number, y1: number) => ctx.fillRect(cx, y0, lw, y1 - y0);
  const r = x + w + 0.5;
  const b = y + h + 0.5;
  switch (c) {
    case '─': H(x, r); return true;
    case '│': V(y, b); return true;
    case '┌': H(cx, r); V(cy, b); return true;
    case '┐': H(x, cx + lw); V(cy, b); return true;
    case '└': H(cx, r); V(y, cy + lw); return true;
    case '┘': H(x, cx + lw); V(y, cy + lw); return true;
    case '├': V(y, b); H(cx, r); return true;
    case '┤': V(y, b); H(x, cx + lw); return true;
    case '┬': H(x, r); V(cy, b); return true;
    case '┴': H(x, r); V(y, cy + lw); return true;
    case '┼': H(x, r); V(y, b); return true;
    case '█': ctx.fillRect(x, y, w + 0.5, h + 0.5); return true;
    case '▀': ctx.fillRect(x, y, w + 0.5, h / 2); return true;
    case '▄': ctx.fillRect(x, y + h / 2, w + 0.5, h / 2 + 0.5); return true;
    case '▌': ctx.fillRect(x, y, w / 2, h + 0.5); return true;
    case '▐': ctx.fillRect(x + w / 2, y, w / 2 + 0.5, h + 0.5); return true;
    case '░': case '▒': case '▓': {
      const a = c === '░' ? 0.25 : c === '▒' ? 0.5 : 0.75;
      ctx.globalAlpha = a; ctx.fillRect(x, y, w + 0.5, h + 0.5); ctx.globalAlpha = 1; return true;
    }
    case '■': { const s = Math.round(w * 0.78); ctx.fillRect(Math.round(x + (w - s) / 2), Math.round(y + (h - s) / 2), s, s); return true; }
    case '□': {
      const s = Math.round(w * 0.78); const x0 = Math.round(x + (w - s) / 2); const y0 = Math.round(y + (h - s) / 2);
      ctx.fillRect(x0, y0, s, lw); ctx.fillRect(x0, y0 + s - lw, s, lw); ctx.fillRect(x0, y0, lw, s); ctx.fillRect(x0 + s - lw, y0, lw, s); return true;
    }
    case '▪': { const s = Math.round(w * 0.4); ctx.fillRect(Math.round(x + (w - s) / 2), Math.round(y + (h - s) / 2), s, s); return true; }
    case '·': { const s = Math.max(1, Math.round(w * 0.2)); ctx.fillRect(Math.round(x + (w - s) / 2), Math.round(y + (h - s) / 2), s, s); return true; }
    case '▲': case '▼': case '▶': case '◀': {
      ctx.beginPath();
      const m = w * 0.15;
      if (c === '▲') { ctx.moveTo(x + w / 2, y + h * 0.3); ctx.lineTo(x + w - m, y + h * 0.7); ctx.lineTo(x + m, y + h * 0.7); }
      if (c === '▼') { ctx.moveTo(x + m, y + h * 0.3); ctx.lineTo(x + w - m, y + h * 0.3); ctx.lineTo(x + w / 2, y + h * 0.7); }
      if (c === '▶') { ctx.moveTo(x + m, y + h * 0.3); ctx.lineTo(x + w - m, y + h / 2); ctx.lineTo(x + m, y + h * 0.7); }
      if (c === '◀') { ctx.moveTo(x + w - m, y + h * 0.3); ctx.lineTo(x + m, y + h / 2); ctx.lineTo(x + w - m, y + h * 0.7); }
      ctx.closePath(); ctx.fill(); return true;
    }
    default: return false;
  }
}
