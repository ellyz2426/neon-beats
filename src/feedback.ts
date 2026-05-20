// ============================================================
// Neon Beats VR — Input Feedback & Visual Polish
// Controller vibration, visual input indicators, screen effects
// ============================================================

// ---- Input Timing Display ----

export class TimingMeter {
  private container: HTMLDivElement;
  private indicator: HTMLDivElement;
  private ticks: HTMLDivElement[] = [];
  private history: { pos: number; quality: string; time: number }[] = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      width: 200px; height: 8px; background: rgba(255,255,255,0.05);
      border-radius: 4px; z-index: 60; pointer-events: none; overflow: visible;
    `;

    // Center line (perfect zone)
    const center = document.createElement('div');
    center.style.cssText = `
      position: absolute; left: 50%; top: -2px; width: 2px; height: 12px;
      background: #00ffff; transform: translateX(-50%);
    `;
    this.container.appendChild(center);

    // Zone markers
    const zones = [
      { width: '10%', color: 'rgba(0,255,255,0.1)' },   // perfect
      { width: '20%', color: 'rgba(0,255,136,0.05)' },   // great
      { width: '36%', color: 'rgba(255,204,0,0.03)' },   // good
    ];
    for (const zone of zones) {
      const el = document.createElement('div');
      el.style.cssText = `
        position: absolute; left: 50%; top: 0; height: 100%;
        width: ${zone.width}; transform: translateX(-50%);
        background: ${zone.color}; border-radius: 4px;
      `;
      this.container.appendChild(el);
    }

    this.indicator = document.createElement('div');
    this.indicator.style.cssText = `
      position: absolute; top: -1px; width: 3px; height: 10px;
      background: #fff; border-radius: 1px; opacity: 0;
      transition: opacity 0.05s;
    `;
    this.container.appendChild(this.indicator);

    document.body.appendChild(this.container);
  }

  showTiming(timeDiff: number, quality: string) {
    // Map timeDiff to position: -0.25s to +0.25s → 0% to 100%
    const pos = 50 + (timeDiff / 0.25) * 50;
    this.indicator.style.left = `${Math.max(0, Math.min(100, pos))}%`;
    this.indicator.style.opacity = '1';

    const colors: Record<string, string> = {
      perfect: '#00ffff',
      great: '#00ff88',
      good: '#ffcc00',
      miss: '#ff0044',
    };
    this.indicator.style.background = colors[quality] || '#fff';

    // Add tick mark
    const tick = document.createElement('div');
    tick.style.cssText = `
      position: absolute; top: -1px; width: 2px; height: 10px;
      background: ${colors[quality]}; border-radius: 1px;
      opacity: 0.6; left: ${pos}%;
      transition: opacity 0.5s;
    `;
    this.container.appendChild(tick);
    this.ticks.push(tick);

    // Fade out after a bit
    setTimeout(() => { tick.style.opacity = '0'; }, 200);
    setTimeout(() => { tick.remove(); }, 700);

    // Clean up old ticks
    while (this.ticks.length > 10) {
      this.ticks.shift()?.remove();
    }

    setTimeout(() => { this.indicator.style.opacity = '0'; }, 200);
  }

  show() { this.container.style.display = 'block'; }
  hide() { this.container.style.display = 'none'; }
}

// ---- Early/Late indicator ----

export function getTimingLabel(timeDiff: number): string {
  if (Math.abs(timeDiff) < 0.03) return '';
  return timeDiff < 0 ? 'EARLY' : 'LATE';
}

// ---- Screen flash effect ----

export class ScreenFlash {
  private overlay: HTMLDivElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 2; opacity: 0;
      transition: opacity 0.05s;
    `;
    document.body.appendChild(this.overlay);
  }

  flash(color: string, intensity: number = 0.3, duration: number = 100) {
    this.overlay.style.background = color;
    this.overlay.style.opacity = String(intensity);
    setTimeout(() => {
      this.overlay.style.opacity = '0';
    }, duration);
  }
}

// ---- Controller Haptic Feedback ----

export function triggerHaptic(gamepad: Gamepad | null, intensity: number = 0.5, duration: number = 50) {
  if (!gamepad) return;
  try {
    if ('hapticActuators' in gamepad && (gamepad as any).hapticActuators?.length > 0) {
      (gamepad as any).hapticActuators[0].pulse(intensity, duration);
    }
    if ('vibrationActuator' in gamepad && (gamepad as any).vibrationActuator) {
      (gamepad as any).vibrationActuator.playEffect('dual-rumble', {
        duration,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.5,
      });
    }
  } catch {
    // Not all gamepads support haptics
  }
}
