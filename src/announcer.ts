// ============================================================
// Neon Beats VR — Combo Announcer
// Big flashy on-screen announcements for combo milestones
// ============================================================

export class ComboAnnouncer {
  private container: HTMLDivElement;
  private currentAnnounce: HTMLDivElement | null = null;
  private hideTimeout: number | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; top: 35%; left: 50%; transform: translate(-50%, -50%);
      z-index: 85; pointer-events: none; text-align: center;
      font-family: 'Courier New', monospace;
    `;
    document.body.appendChild(this.container);
  }

  announce(text: string, color: string, size: number = 48, duration: number = 1500) {
    if (this.currentAnnounce) {
      this.currentAnnounce.remove();
      if (this.hideTimeout) clearTimeout(this.hideTimeout);
    }

    const el = document.createElement('div');
    el.style.cssText = `
      font-size: ${size}px; color: ${color}; font-weight: bold;
      letter-spacing: ${size > 40 ? '6px' : '3px'};
      text-shadow: 0 0 30px ${color}, 0 0 60px ${color}40;
      animation: announceIn 0.3s ease-out, announcePulse 0.6s ease-in-out 0.3s;
      opacity: 1;
    `;
    el.textContent = text;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes announceIn {
        from { transform: scale(2); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes announcePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes announceOut {
        to { transform: scale(0.8) translateY(-20px); opacity: 0; }
      }
    `;
    el.appendChild(style);

    this.container.innerHTML = '';
    this.container.appendChild(el);
    this.currentAnnounce = el;

    this.hideTimeout = window.setTimeout(() => {
      el.style.animation = 'announceOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (el.parentNode) el.remove();
        if (this.currentAnnounce === el) this.currentAnnounce = null;
      }, 300);
    }, duration);
  }

  checkComboMilestone(combo: number) {
    if (combo === 10) this.announce('10 COMBO!', '#ffcc00', 32, 1000);
    else if (combo === 25) this.announce('25 COMBO!', '#ff00ff', 38, 1200);
    else if (combo === 50) this.announce('50 COMBO!', '#ff6600', 44, 1500);
    else if (combo === 100) this.announce('100 COMBO!!', '#ff0044', 52, 2000);
    else if (combo === 200) this.announce('200 COMBO!!!', '#ffd700', 60, 2500);
    else if (combo === 500) this.announce('★ 500 ★', '#ffffff', 72, 3000);
    else if (combo > 0 && combo % 100 === 0 && combo > 200) {
      this.announce(`${combo} COMBO!`, '#ffd700', 56, 2000);
    }
  }

  announceGrade(grade: string) {
    const colors: Record<string, string> = {
      'SS': '#ffd700',
      'S': '#ff00ff',
      'A': '#00ffff',
      'B': '#00ff88',
      'C': '#ffcc00',
      'D': '#ff6600',
      'F': '#ff0044',
    };
    this.announce(grade, colors[grade] || '#ffffff', 72, 3000);
  }

  announceText(text: string, color: string = '#00ffff') {
    this.announce(text, color, 36, 1500);
  }

  clear() {
    if (this.currentAnnounce) {
      this.currentAnnounce.remove();
      this.currentAnnounce = null;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}

// ---- Screen Shake ----

export class ScreenShakeSystem {
  private intensity = 0;
  private decay = 10;
  public offset = { x: 0, y: 0 };

  trigger(intensity: number = 0.5) {
    this.intensity = Math.max(this.intensity, intensity);
  }

  update(dt: number) {
    if (this.intensity <= 0.001) {
      this.offset.x = 0;
      this.offset.y = 0;
      this.intensity = 0;
      return;
    }

    this.offset.x = (Math.random() - 0.5) * this.intensity * 0.1;
    this.offset.y = (Math.random() - 0.5) * this.intensity * 0.1;
    this.intensity *= Math.max(0, 1 - this.decay * dt);
  }

  setDecay(decay: number) { this.decay = decay; }
}

// ---- FPS Counter ----

export class FPSCounter {
  private el: HTMLDivElement;
  private frames: number[] = [];
  private lastTime = performance.now();

  constructor() {
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position: fixed; top: 5px; left: 5px; z-index: 100;
      font-family: monospace; font-size: 11px; color: #00ff88;
      background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 3px;
      pointer-events: none;
    `;
    document.body.appendChild(this.el);
  }

  update() {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;
    this.frames.push(dt);
    if (this.frames.length > 60) this.frames.shift();
    const avg = this.frames.reduce((s, t) => s + t, 0) / this.frames.length;
    const fps = Math.round(1000 / avg);
    const color = fps >= 60 ? '#00ff88' : fps >= 30 ? '#ffcc00' : '#ff0044';
    this.el.style.color = color;
    this.el.textContent = `${fps} FPS`;
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; }
}
