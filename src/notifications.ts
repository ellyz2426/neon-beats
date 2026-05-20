// ============================================================
// Neon Beats VR — Notification System
// In-game toast notifications for events
// Queue system to prevent overlap
// Configurable position and duration
// ============================================================

interface ToastNotification {
  message: string;
  color: string;
  icon: string;
  duration: number;
  el: HTMLDivElement | null;
}

export class NotificationSystem {
  private queue: ToastNotification[] = [];
  private active: ToastNotification | null = null;
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
      z-index: 90; pointer-events: none; font-family: monospace;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Queue a notification
   */
  notify(message: string, color: string = '#00ffff', icon: string = '◆', duration: number = 2500) {
    this.queue.push({ message, color, icon, duration, el: null });
    if (!this.active) this.showNext();
  }

  private showNext() {
    if (this.queue.length === 0) {
      this.active = null;
      return;
    }

    const notification = this.queue.shift()!;
    this.active = notification;

    const el = document.createElement('div');
    el.style.cssText = `
      background: rgba(0,0,0,0.85); border: 1px solid ${notification.color};
      padding: 8px 20px; border-radius: 4px;
      color: ${notification.color}; font-size: 13px;
      text-shadow: 0 0 8px ${notification.color};
      box-shadow: 0 0 15px rgba(0,0,0,0.5);
      opacity: 0; transform: translateY(-10px);
      transition: opacity 0.3s, transform 0.3s;
      white-space: nowrap;
    `;
    el.textContent = `${notification.icon} ${notification.message}`;
    notification.el = el;
    this.container.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    // Animate out after duration
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        el.remove();
        this.showNext();
      }, 300);
    }, notification.duration);
  }

  /**
   * Quick notification presets
   */
  achievement(name: string) {
    this.notify(`Achievement: ${name}`, '#ffd700', '🏆', 3000);
  }

  comboMilestone(combo: number) {
    this.notify(`${combo}x Combo!`, '#ff00ff', '🔥', 2000);
  }

  stageChange(stageName: string) {
    this.notify(`Stage: ${stageName}`, '#00ffff', '🌟', 2000);
  }

  modeChange(mode: string) {
    this.notify(mode, '#88ff00', '◆', 2000);
  }

  warning(message: string) {
    this.notify(message, '#ff0044', '⚠', 3000);
  }
}
