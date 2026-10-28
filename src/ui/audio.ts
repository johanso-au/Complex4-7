// Synthesised sound: room hum, alarms, switches, radio, teletype, the clang.
// Everything is generated with WebAudio, so there are no audio files to ship.

export class Audio {
  ctx: AudioContext | null = null;
  master!: GainNode;
  private humGain!: GainNode;
  private ttGain!: GainNode;
  private klaxon: OscillatorNode | null = null;
  private klaxonGain: GainNode | null = null;
  muted = false;
  private noiseBuf!: AudioBuffer;

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }

    // Room tone: ventilation rumble plus mains hum.
    this.humGain = ctx.createGain();
    this.humGain.gain.value = 0;
    this.humGain.connect(this.master);
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.noiseBuf; rumble.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
    const rg = ctx.createGain(); rg.gain.value = 0.55;
    rumble.connect(lp).connect(rg).connect(this.humGain);
    rumble.start();
    for (const [f, a] of [[60, 0.05], [120, 0.035], [180, 0.012]] as const) {
      const o = ctx.createOscillator(); o.frequency.value = f;
      const gg = ctx.createGain(); gg.gain.value = a;
      o.connect(gg).connect(this.humGain); o.start();
    }
    // Teletype bed, gated on while printing.
    this.ttGain = ctx.createGain(); this.ttGain.gain.value = 0; this.ttGain.connect(this.master);
    const tt = ctx.createBufferSource(); tt.buffer = this.noiseBuf; tt.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 1.2;
    const am = ctx.createGain(); am.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 11;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.5;
    lfo.connect(lfoG).connect(am.gain); lfo.start();
    tt.connect(bp).connect(am).connect(this.ttGain); tt.start();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.05);
  }

  /** Room hum: level falls with the number of fans running; silence when the bus is dead. */
  setHum(level: number) {
    if (!this.ctx) return;
    this.humGain.gain.setTargetAtTime(0.25 * level, this.ctx.currentTime, level === 0 ? 0.4 : 1.2);
  }

  setTeletype(on: boolean) {
    if (!this.ctx) return;
    this.ttGain.gain.setTargetAtTime(on ? 0.18 : 0, this.ctx.currentTime, 0.02);
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, glideTo?: number) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol: number, f: number, q = 1, when = 0, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime + when;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(flt).connect(g).connect(this.master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  play(name: string) {
    if (!this.ctx) return;
    switch (name) {
      case 'key': this.noise(0.03, 0.25, 3500, 2); break;
      case 'switch': this.noise(0.05, 0.6, 1800, 3); this.tone(140, 0.06, 'square', 0.08); break;
      case 'tick': this.noise(0.04, 0.35, 5000, 4); break;
      case 'stamp': this.noise(0.12, 0.9, 400, 1, 0, 'lowpass'); break;
      case 'paper': this.noise(0.25, 0.25, 3000, 0.6); break;
      case 'clunk': this.tone(70, 0.25, 'sine', 0.5); this.noise(0.15, 0.4, 300, 1, 0, 'lowpass'); break;
      case 'relay': this.noise(0.03, 0.6, 2600, 5); this.noise(0.03, 0.5, 2200, 5, 0.06); break;
      case 'ack': this.tone(880, 0.05, 'square', 0.06); break;
      case 'alarm-amber': for (let i = 0; i < 2; i++) this.tone(720, 0.22, 'square', 0.09, i * 0.32); break;
      case 'alarm-red': for (let i = 0; i < 4; i++) this.tone(i % 2 ? 620 : 930, 0.16, 'square', 0.11, i * 0.18); break;
      case 'rebeep-amber': this.tone(720, 0.18, 'square', 0.05); break;
      case 'rebeep-red': this.tone(930, 0.14, 'square', 0.07); this.tone(620, 0.14, 'square', 0.07, 0.17); break;
      case 'squelch': this.noise(0.18, 0.35, 1500, 0.7); this.noise(0.05, 0.3, 1500, 0.7, 0.2); break;
      case 'voice': this.noise(0.04, 0.12, 900, 1); break;
      case 'phone': for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) { this.tone(1100, 0.03, 'triangle', 0.06, r * 0.6 + i * 0.035); } break;
      case 'buzzer': this.tone(110, 0.7, 'sawtooth', 0.12); this.tone(113, 0.7, 'sawtooth', 0.1); break;
      case 'door': this.tone(55, 0.6, 'sine', 0.5); this.noise(0.5, 0.3, 200, 1, 0, 'lowpass'); break;
      case 'pa': this.tone(660, 0.2, 'sine', 0.12); this.tone(520, 0.3, 'sine', 0.12, 0.22); break;
      case 'diesel': this.noise(1.6, 0.5, 120, 1, 0, 'lowpass'); this.tone(45, 1.4, 'sawtooth', 0.08); break;
      case 'strike': this.tone(200, 0.35, 'sawtooth', 0.05); break;
      case 'clang': {
        // Metal on metal, heard through a radio: inharmonic partials, band-limited.
        for (const [f, a, d] of [[523, 0.22, 1.4], [1337, 0.14, 1.0], [2186, 0.1, 0.7], [3011, 0.06, 0.5]] as const) this.tone(f, d, 'sine', a);
        this.noise(0.06, 0.6, 2500, 1);
        break;
      }
      case 'power-off': this.tone(120, 0.9, 'sawtooth', 0.08, 0, 30); break;
      case 'power-on': this.noise(0.08, 0.4, 900, 1); break;
      case 'klaxon': this.startKlaxon(); break;
    }
  }

  startKlaxon() {
    const ctx = this.ctx; if (!ctx || this.klaxon) return;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const lfo = ctx.createOscillator(); lfo.frequency.value = 1.1; lfo.type = 'square';
    const lg = ctx.createGain(); lg.gain.value = 130;
    o.frequency.value = 480;
    lfo.connect(lg).connect(o.frequency);
    const g = ctx.createGain(); g.gain.value = 0.09;
    o.connect(g).connect(this.master); o.start(); lfo.start();
    this.klaxon = o; this.klaxonGain = g;
  }

  stopKlaxon() {
    if (!this.klaxon || !this.ctx) return;
    this.klaxonGain!.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    const k = this.klaxon; setTimeout(() => k.stop(), 400);
    this.klaxon = null;
  }

  stopAll() {
    this.stopKlaxon();
    this.setTeletype(false);
    this.setHum(0);
  }
}
