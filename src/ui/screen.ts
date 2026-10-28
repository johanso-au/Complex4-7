// A fixed character grid. Pages write into it; the canvas renderer draws it.
export const COLS = 100;
export const ROWS = 36;

export const enum C {
  BLACK = 0,
  GREEN = 1,
  AMBER = 2,
  RED = 3,
  CYAN = 4,
  WHITE = 5,
  DIM = 6,
  DARK = 7,
  BAND = 8,
  AMBERBG = 9,
  REDBG = 10,
  PAPER = 11,
}

export interface CellOpts { bg?: number; blink?: boolean; act?: string | null }

export class Screen {
  ch: string[] = new Array(COLS * ROWS).fill(' ');
  fg = new Uint8Array(COLS * ROWS);
  bg = new Uint8Array(COLS * ROWS);
  blink = new Uint8Array(COLS * ROWS);
  act: (string | null)[] = new Array(COLS * ROWS).fill(null);

  clear() {
    this.ch.fill(' ');
    this.fg.fill(C.GREEN);
    this.bg.fill(0);
    this.blink.fill(0);
    this.act.fill(null);
  }

  set(x: number, y: number, c: string, fg: number, o: CellOpts = {}) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    const i = y * COLS + x;
    this.ch[i] = c;
    this.fg[i] = fg;
    if (o.bg !== undefined) this.bg[i] = o.bg;
    this.blink[i] = o.blink ? 1 : 0;
    if (o.act !== undefined) this.act[i] = o.act;
  }

  view(x: number, y: number, w: number, h: number): View {
    return new View(this, x, y, w, h);
  }
}

/** A clipped rectangle of the screen with relative coordinates. */
export class View {
  constructor(public s: Screen, public x: number, public y: number, public w: number, public h: number) {}

  put(x: number, y: number, text: string, fg: number = C.GREEN, o: CellOpts = {}): number {
    if (y < 0 || y >= this.h) return x + text.length;
    const chars = Array.from(text);
    for (let k = 0; k < chars.length; k++) {
      const cx = x + k;
      if (cx < 0 || cx >= this.w) continue;
      this.s.set(this.x + cx, this.y + y, chars[k], fg, o);
    }
    return x + chars.length;
  }

  /** Put a run of [text, colour] segments. */
  segs(x: number, y: number, parts: [string, number][], o: CellOpts = {}): number {
    let cx = x;
    for (const [t, c] of parts) cx = this.put(cx, y, t, c, o);
    return cx;
  }

  fill(x: number, y: number, w: number, h: number, ch: string, fg: number, o: CellOpts = {}) {
    for (let j = 0; j < h; j++) this.put(x, y + j, ch.repeat(Math.max(0, w)), fg, o);
  }

  hline(x: number, y: number, w: number, fg: number = C.DIM) { this.put(x, y, '─'.repeat(Math.max(0, w)), fg); }
  vline(x: number, y: number, h: number, fg: number = C.DIM) { for (let j = 0; j < h; j++) this.put(x, y + j, '│', fg); }

  box(x: number, y: number, w: number, h: number, fg: number = C.DIM, title?: string, tfg: number = C.CYAN) {
    this.put(x, y, '┌' + '─'.repeat(w - 2) + '┐', fg);
    for (let j = 1; j < h - 1; j++) { this.put(x, y + j, '│', fg); this.put(x + w - 1, y + j, '│', fg); }
    this.put(x, y + h - 1, '└' + '─'.repeat(w - 2) + '┘', fg);
    if (title) this.put(x + 2, y, ` ${title} `, tfg);
  }

  /** Mark a rectangle as clickable. */
  click(x: number, y: number, w: number, act: string) {
    for (let k = 0; k < w; k++) {
      const cx = x + k;
      if (cx < 0 || cx >= this.w || y < 0 || y >= this.h) continue;
      this.s.act[(this.y + y) * COLS + this.x + cx] = act;
    }
  }

  /** Word-wrap text into the given width; returns rows used. */
  wrap(x: number, y: number, w: number, text: string, fg: number = C.GREEN, indent = 0, o: CellOpts = {}): number {
    const lines = wrapText(text, w, indent);
    lines.forEach((l, k) => this.put(x, y + k, l, fg, o));
    return lines.length;
  }
}

export function wrapText(text: string, w: number, indent = 0): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = '';
  for (const word of words) {
    const lim = out.length ? w - indent : w;
    if ((line ? line.length + 1 : 0) + word.length > lim && line) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out.map((l, k) => (k ? ' '.repeat(indent) + l : l));
}
