// Background music controller for Profile Selection screen
// Always plays; mute/unmute just fades volume between 0 and normal level.
// Uses window to survive Vite HMR (avoids re-creating Audio on hot reload).
class BgMusicController {
  private audio: HTMLAudioElement | null = null;
  public enabled = true;
  private readonly NORMAL_VOLUME = 1.0;
  private readonly MUTED_VOLUME = 0;

  constructor() {
    const saved = localStorage.getItem("pakde-bgmusic");
    this.enabled = saved !== "false";
    this.initAudio();
  }

  private initAudio() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.load();
    }
    try {
      this.audio = new Audio("/audio/bg.mp3");
      this.audio.loop = true;
      this.audio.volume = this.enabled ? this.NORMAL_VOLUME : this.MUTED_VOLUME;

      // Fallback loop handling for environments where native loop property fails or gets interrupted
      this.audio.addEventListener("ended", () => {
        if (this.audio && this.enabled) {
          this.audio.currentTime = 0;
          this.audio.play().catch(() => {});
        }
      });

      this.audio.play().catch(() => {});
    } catch {
      // Audio init may fail if user hasn't interacted yet
    }
  }

  /** Call on first user interaction to start playback (browser autoplay policy). */
  resume() {
    if (!this.audio) {
      this.initAudio();
    }
    if (this.audio && (this.audio.paused || this.audio.ended)) {
      if (this.audio.ended) this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    }
  }

  pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  toggleMusic(forceState?: boolean): boolean {
    this.enabled = forceState !== undefined ? forceState : !this.enabled;
    localStorage.setItem("pakde-bgmusic", this.enabled.toString());

    if (!this.audio) this.initAudio();
    if (!this.audio) return this.enabled;

    if (this.enabled) {
      if (this.audio.paused || this.audio.ended) {
        if (this.audio.ended) this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      }
      this.audio.volume = this.NORMAL_VOLUME;
    } else {
      this.audio.volume = this.MUTED_VOLUME;
    }
    return this.enabled;
  }

  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.load();
      this.audio = null;
    }
  }
}

// HMR-safe singleton: reuse existing instance on hot reload
const KEY = "__pakde_bgmusic__";
const win = window as typeof window & { [KEY]?: BgMusicController };
if (!win[KEY]) {
  win[KEY] = new BgMusicController();
} else {
  // Restore volume state (enabled flag may have changed via localStorage)
  const saved = localStorage.getItem("pakde-bgmusic");
  win[KEY].enabled = saved !== "false";
}
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const bgMusic: BgMusicController = win[KEY]!;
