// Background music controller for Profile Selection screen
class BgMusicController {
  private audio: HTMLAudioElement | null = null;
  public enabled = false;

  constructor() {
    const saved = localStorage.getItem("pakde-bgmusic");
    this.enabled = saved === "true";
    this.initAudio();
  }

  private initAudio() {
    try {
      this.audio = new Audio("/audio/bg.mp3");
      this.audio.loop = true;
      this.audio.volume = 0.12;
    } catch {
      // Audio init may fail if user hasn't interacted yet
    }
  }

  resume() {
    if (this.enabled && this.audio?.paused) {
      this.audio.play().catch(() => {});
    }
  }

  toggleMusic(forceState?: boolean): boolean {
    this.enabled = forceState !== undefined ? forceState : !this.enabled;
    localStorage.setItem("pakde-bgmusic", this.enabled.toString());

    if (!this.audio) this.initAudio();
    if (!this.audio) return this.enabled;

    if (this.enabled) {
      this.audio.play().catch(() => {});
    } else {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    return this.enabled;
  }
}

export const bgMusic = new BgMusicController();
