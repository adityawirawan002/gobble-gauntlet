// Original procedural Web Audio API sound effects and autumn bluegrass/kitchen music loop.

export class HarvestAudioSynth {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicAccum = 0;
    this.stepIndex = 0;
    this.noiseBuffer = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.34;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.buildNoiseBuffer(this.ctx);
    } catch {
      this.ctx = null;
    }
  }

  buildNoiseBuffer(ctx) {
    const length = Math.floor(ctx.sampleRate * 0.45);
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let seed = 1337;
    for (let i = 0; i < length; i += 1) {
      seed = (seed * 16807) % 2147483647;
      data[i] = (seed / 1073741823.5) - 1;
    }
    return buf;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.34, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  ready() {
    return Boolean(this.ctx && this.master && !this.muted && this.ctx.state === 'running');
  }

  playTone(type, freqStart, freqEnd, duration, gainPeak = 0.22, delay = 0) {
    if (!this.ready()) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(25, freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playFilteredNoise(duration, filterFreq, q, gainPeak, filterType = 'bandpass', delay = 0) {
    if (!this.ready() || !this.noiseBuffer) return;
    const now = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  playGobble(pitchScale = 1) {
    if (!this.ready()) return;
    const base = 360 * pitchScale;
    for (let i = 0; i < 4; i += 1) {
      const t = i * 0.052;
      this.playTone('triangle', base * (1 + (i % 2) * 0.24), base * 0.78, 0.055, 0.22, t);
    }
    this.playTone('sawtooth', base * 0.65, base * 0.92, 0.16, 0.06, 0.02);
  }

  playJump() {
    this.playTone('triangle', 260, 560, 0.12, 0.2);
    this.playFilteredNoise(0.08, 1300, 1.4, 0.1, 'bandpass');
  }

  playFlutter() {
    this.playFilteredNoise(0.07, 1600, 1.8, 0.09, 'bandpass');
  }

  playDash() {
    this.playGobble(1.18);
    this.playFilteredNoise(0.18, 950, 0.9, 0.22, 'bandpass');
  }

  playHideRustle() {
    this.playFilteredNoise(0.16, 720, 1.2, 0.18, 'bandpass');
    this.playTone('sine', 190, 125, 0.09, 0.12);
  }

  playDecoyBounce() {
    this.playTone('triangle', 540, 290, 0.09, 0.18);
    this.playTone('sine', 980, 1240, 0.07, 0.1, 0.04);
  }

  playCornChime(combo = 1) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const root = scale[Math.min(scale.length - 1, Math.max(0, combo - 1))];
    this.playTone('triangle', root, root * 1.02, 0.11, 0.2);
    this.playTone('sine', root * 1.5, root * 1.52, 0.14, 0.12, 0.04);
  }

  playBerryHeal() {
    this.playTone('triangle', 523.25, 659.25, 0.12, 0.2, 0);
    this.playTone('triangle', 659.25, 783.99, 0.14, 0.2, 0.08);
    this.playTone('sine', 1046.5, 1046.5, 0.2, 0.18, 0.16);
  }

  playCloseShave() {
    this.playTone('sine', 660, 1320, 0.16, 0.2);
    this.playTone('triangle', 990, 1480, 0.14, 0.15, 0.05);
  }

  playKnifeWhoosh() {
    this.playFilteredNoise(0.16, 2600, 2.2, 0.18, 'bandpass');
    this.playTone('sine', 1950, 1320, 0.12, 0.09);
  }

  playOvenRoar() {
    this.playFilteredNoise(0.32, 340, 0.8, 0.24, 'lowpass');
    this.playTone('sawtooth', 98, 62, 0.28, 0.11);
  }

  playAlertSting() {
    this.playTone('sawtooth', 440, 460, 0.08, 0.14, 0);
    this.playTone('sawtooth', 622.25, 659.25, 0.16, 0.16, 0.08);
  }

  playBouncePad() {
    this.playTone('sine', 210, 690, 0.19, 0.24);
    this.playTone('triangle', 320, 820, 0.12, 0.14, 0.04);
  }

  playHitThud() {
    this.playTone('sawtooth', 165, 58, 0.24, 0.26);
    this.playFilteredNoise(0.18, 600, 0.9, 0.24, 'lowpass');
    this.playGobble(0.76);
  }

  playStageClear() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.playTone('triangle', f, f, 0.18, 0.2, i * 0.09));
  }

  playVictoryFanfare() {
    const notes = [523.25, 659.25, 783.99, 659.25, 1046.5];
    const times = [0, 0.1, 0.2, 0.31, 0.42];
    notes.forEach((f, i) => this.playTone('triangle', f, f * 1.01, 0.24, 0.22, times[i]));
    this.playGobble(1.25);
  }

  playCaughtJingle() {
    const notes = [392, 369.99, 349.23, 277.18];
    notes.forEach((f, i) => this.playTone('sawtooth', f, f * 0.94, 0.22, 0.14, i * 0.14));
  }

  tickMusic(dt, active, stageIndex = 0, chased = false) {
    if (!active || !this.ready()) return;
    const bpm = (stageIndex === 2 ? 148 : stageIndex === 1 ? 134 : 122) + (chased ? 14 : 0);
    const stepDur = 60 / bpm / 2;
    this.musicAccum += dt;
    if (this.musicAccum < stepDur) return;
    this.musicAccum -= stepDur;

    // Cheerful D-major harvest banjo bounce in farmyard; urgent D-minor rhythm in kitchen.
    const farmRiff = [293.66, 369.99, 440, 587.33, 493.88, 440, 369.99, 329.63];
    const kitchenRiff = [293.66, 349.23, 440, 466.16, 440, 349.23, 329.63, 261.63];
    const riff = stageIndex === 2 ? kitchenRiff : farmRiff;
    const bass = [146.83, 146.83, 110, 110, 146.83, 146.83, 164.81, 110];
    const idx = this.stepIndex % 8;
    this.stepIndex += 1;

    this.playTone('triangle', riff[idx], riff[idx] * 0.995, 0.11, chased ? 0.085 : 0.065);
    if (idx % 2 === 0) {
      this.playTone('sine', bass[idx], bass[idx] * 0.98, 0.16, 0.075);
    } else if (chased) {
      this.playFilteredNoise(0.04, 2100, 2.0, 0.045, 'highpass');
    }
  }
}
