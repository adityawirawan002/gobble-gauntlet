// Zero-dependency procedural Web Audio Thanksgiving SFX & adaptive harvest music synth.

export class HarvestAudioSynth {
  constructor() {
    this.ctx = null; this.master = null; this.noiseBuffer = null;
    this.muted = false; this.musicAccum = 0; this.stepIndex = 0;
  }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.28;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0, s = 1337; i < len; i += 1) { s = (s * 1664525 + 1013904223) >>> 0; data[i] = (s / 4294967296) * 2 - 1; }
    } catch { this.ctx = null; }
  }
  setMuted(flag) {
    this.muted = Boolean(flag);
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime, 0.02);
  }
  toggleMute() { this.setMuted(!this.muted); return this.muted; }
  ready() { return Boolean(this.ctx && this.master && !this.muted && this.ctx.state === 'running'); }
  tone(type, f0, f1, dur, peak = 0.24, delay = 0) {
    if (!this.ready()) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f0, now);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur);
    g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(peak, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g); g.connect(this.master); osc.start(now); osc.stop(now + dur + 0.02);
  }
  noise(dur, freq, q, peak, type = 'bandpass', delay = 0) {
    if (!this.ready() || !this.noiseBuffer) return;
    const now = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    src.buffer = this.noiseBuffer; f.type = type; f.frequency.setValueAtTime(freq, now); f.Q.value = q;
    g.gain.setValueAtTime(peak, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f); f.connect(g); g.connect(this.master); src.start(now); src.stop(now + dur + 0.02);
  }
  playGobble(p = 1) {
    const b = 365 * p;
    for (let i = 0; i < 4; i += 1) this.tone('triangle', b * (1 + (i & 1) * 0.24), b * 0.78, 0.055, 0.22, i * 0.052);
    this.tone('sawtooth', b * 0.65, b * 0.92, 0.16, 0.06, 0.02);
  }
  playJump() { this.tone('triangle', 270, 580, 0.12, 0.2); this.noise(0.08, 1300, 1.4, 0.1); }
  playFlutter() { this.noise(0.07, 1650, 1.8, 0.09); }
  playUpdraft() { this.noise(0.24, 920, 0.7, 0.14); this.tone('sine', 240, 420, 0.22, 0.08); }
  playDash() { this.playGobble(1.18); this.noise(0.18, 950, 0.9, 0.22); }
  playHideRustle() { this.noise(0.16, 720, 1.2, 0.18); this.tone('sine', 190, 125, 0.09, 0.12); }
  playDecoyBounce() { this.tone('triangle', 540, 290, 0.09, 0.18); this.tone('sine', 980, 1240, 0.07, 0.1, 0.04); }
  playDogBark() { this.tone('sawtooth', 290, 145, 0.11, 0.2); this.tone('sawtooth', 330, 165, 0.12, 0.2, 0.14); }
  playNetWhoosh() { this.noise(0.2, 1400, 1.3, 0.18); this.tone('sine', 420, 230, 0.16, 0.1); }
  playCornChime(c = 1) {
    const r = [523.25, 587.33, 659.25, 783.99, 880, 1046.5][Math.min(5, Math.max(0, c - 1))];
    this.tone('triangle', r, r * 1.02, 0.11, 0.2); this.tone('sine', r * 1.5, r * 1.52, 0.14, 0.12, 0.04);
  }
  playBerryHeal() { [523.25, 659.25, 1046.5].forEach((f, i) => this.tone('triangle', f, f * 1.04, 0.15, 0.2, i * 0.08)); }
  playCloseShave() { this.tone('sine', 660, 1320, 0.16, 0.2); this.tone('triangle', 990, 1480, 0.14, 0.15, 0.05); }
  playKnifeWhoosh() { this.noise(0.16, 2600, 2.2, 0.18); this.tone('sine', 1950, 1320, 0.12, 0.09); }
  playOvenRoar() { this.noise(0.32, 340, 0.8, 0.24, 'lowpass'); this.tone('sawtooth', 98, 62, 0.28, 0.11); }
  playAlertSting() { this.tone('sawtooth', 440, 460, 0.08, 0.14); this.tone('sawtooth', 622.25, 659.25, 0.16, 0.16, 0.08); }
  playBouncePad() { this.tone('sine', 210, 720, 0.19, 0.24); this.tone('triangle', 320, 840, 0.12, 0.14, 0.04); }
  playHitThud() { this.tone('sawtooth', 165, 58, 0.24, 0.26); this.noise(0.18, 600, 0.9, 0.24, 'lowpass'); this.playGobble(0.76); }
  playStageClear() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone('triangle', f, f, 0.18, 0.2, i * 0.09)); }
  playVictoryFanfare() {
    [[523.25, 0], [659.25, 0.1], [783.99, 0.2], [659.25, 0.31], [1046.5, 0.42]]
      .forEach(([f, t]) => this.tone('triangle', f, f * 1.01, 0.24, 0.22, t));
    this.playGobble(1.25);
  }
  playCaughtJingle() { [392, 369.99, 349.23, 277.18].forEach((f, i) => this.tone('sawtooth', f, f * 0.94, 0.22, 0.14, i * 0.14)); }
  tickMusic(dt, active, stageIdx = 0, chased = false) {
    if (!active || !this.ready()) return;
    const stepDur = 30 / ((stageIdx === 2 ? 148 : stageIdx === 1 ? 134 : 122) + (chased ? 14 : 0));
    this.musicAccum += dt;
    if (this.musicAccum < stepDur) return;
    this.musicAccum -= stepDur;
    const riff = stageIdx === 2
      ? [293.66, 349.23, 440, 466.16, 440, 349.23, 329.63, 261.63]
      : [293.66, 369.99, 440, 587.33, 493.88, 440, 369.99, 329.63];
    const bass = [146.83, 146.83, 110, 110, 146.83, 146.83, 164.81, 110];
    const idx = this.stepIndex++ & 7;
    this.tone('triangle', riff[idx], riff[idx] * 0.995, 0.11, chased ? 0.085 : 0.065);
    if ((idx & 1) === 0) this.tone('sine', bass[idx], bass[idx] * 0.98, 0.16, 0.075);
    else if (chased) this.noise(0.04, 2100, 2.0, 0.045, 'highpass');
  }
}
