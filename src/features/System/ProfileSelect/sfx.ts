// Web Audio API Retro 8-bit Synthesizer for Profile Selector
class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  constructor() {
    const saved = localStorage.getItem("pakde-splash-sfx");
    this.enabled = saved !== "false";
  }

  private init() {
    if (!this.ctx) {
      const WebkitAudioContext = (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
      const AudioCtx = window.AudioContext || WebkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playBleep(frequency = 750, duration = 0.015, type: OscillatorType = "sine") {
    if (!this.enabled) return;
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      // Resume on first interaction so subsequent calls work immediately
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext fails to initialize if user hasn't interacted yet.
    }
  }

  playSoftThud(frequency = 80, duration = 0.12) {
    // Louder, fuller thud for placing zones/shelves — triangle wave for warmth
    if (!this.enabled) return;
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  playClick(frequency = 350, duration = 0.04) {
    // Short square-wave snap for erase / assign
    if (!this.enabled) return;
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  playChime() {
    if (!this.enabled) return;
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }
      const now = ctx.currentTime;
      // Soft, pleasant C-major arpeggio (C5 -> E5 -> G5 -> C6) using triangle wave for warmth
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.05 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.25);
      });
    } catch (err) {
      console.error(err);
    }
  }

  playHoverChime() {
    if (!this.enabled) return;
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }
      const now = ctx.currentTime;
      // Ultra-short soft click slide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.07);
    } catch {
      // fails silently if context suspended
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  /** Descending two-tone — for cancel / close / back navigation. */
  playBack(frequency = 420, duration = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, now + duration);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // ignore
    }
  }

  /** Low buzz — for invalid input / errors. */
  playError(frequency = 140, duration = 0.18) {
    if (!this.enabled) return;
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(frequency, now);
      // Slight wobble so it reads as an error, not a tone.
      osc.frequency.linearRampToValueAtTime(frequency * 0.85, now + duration);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // ignore
    }
  }

  toggleSound(forceState?: boolean): boolean {
    this.enabled = forceState !== undefined ? forceState : !this.enabled;
    localStorage.setItem("pakde-splash-sfx", this.enabled.toString());
    return this.enabled;
  }
}

// HMR-safe singleton: reuse existing instance on hot reload
const SFX_KEY = "__pakde_sfx__";
const sfxWin = window as typeof window & { [SFX_KEY]?: RetroAudioEngine };
if (!sfxWin[SFX_KEY]) {
  sfxWin[SFX_KEY] = new RetroAudioEngine();
} else {
  const saved = localStorage.getItem("pakde-splash-sfx");
  sfxWin[SFX_KEY].enabled = saved !== "false";
}
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const sfx = sfxWin[SFX_KEY]!;
