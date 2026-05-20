// ============================================================
// Neon Beats VR — Accessibility Helpers
// Screen reader announcements, focus management, ARIA labels
// Reduced motion detection, high contrast support
// ============================================================

// Check if user prefers reduced motion at OS level
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Check if user prefers high contrast
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

// Screen reader announcement
let announceEl: HTMLDivElement | null = null;

export function initAccessibility() {
  if (announceEl) return;
  announceEl = document.createElement('div');
  announceEl.setAttribute('role', 'status');
  announceEl.setAttribute('aria-live', 'polite');
  announceEl.setAttribute('aria-atomic', 'true');
  announceEl.style.cssText = `
    position: absolute; left: -9999px; width: 1px; height: 1px;
    overflow: hidden; white-space: nowrap;
  `;
  document.body.appendChild(announceEl);
}

export function announce(message: string) {
  if (!announceEl) initAccessibility();
  if (announceEl) {
    announceEl.textContent = '';
    // Force re-announcement
    requestAnimationFrame(() => {
      if (announceEl) announceEl.textContent = message;
    });
  }
}

// Keyboard navigation focus trap for modal screens
export function trapFocus(container: HTMLElement) {
  const focusable = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;

  const first = focusable[0] as HTMLElement;
  const last = focusable[focusable.length - 1] as HTMLElement;

  container.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  first.focus();
}

// High visibility hit quality labels
export function getAccessibleQualityLabel(quality: string): string {
  switch (quality) {
    case 'perfect': return '★ PERFECT';
    case 'great': return '● GREAT';
    case 'good': return '○ GOOD';
    case 'miss': return '✗ MISS';
    default: return quality.toUpperCase();
  }
}

// Haptic feedback for supported devices
export function triggerHaptic(intensity: number = 0.5, duration: number = 50) {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(Math.round(duration * intensity));
    }
  } catch { /* ignore */ }
}

// XR haptic feedback
export function triggerXRHaptic(
  hand: 'left' | 'right',
  intensity: number = 0.5,
  duration: number = 50
) {
  try {
    const session = (navigator as any).xr?.session;
    if (!session) return;
    const sources = session.inputSources;
    for (const source of sources) {
      if (source.handedness === hand && source.gamepad?.hapticActuators?.length) {
        source.gamepad.hapticActuators[0].pulse(intensity, duration);
      }
    }
  } catch { /* ignore */ }
}

// Key mapping descriptions for accessibility
export function describeKeyBindings(laneKeys: string[]): string {
  const names = laneKeys.map((k, i) => {
    const keyName = k.replace('Key', '').replace('Digit', '');
    return `Lane ${i + 1}: ${keyName}`;
  });
  return names.join(', ');
}

// Color contrast checker (WCAG 2.0)
function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const sR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const sG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const sB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

export function contrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastMinimum(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = contrastRatio(foreground, background);
  return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
}

// Performance monitoring for accessibility
export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private maxSamples = 60;
  private lastWarnTime = 0;

  addFrame(dt: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length > this.maxSamples) this.frameTimes.shift();
  }

  getAverageFPS(): number {
    if (this.frameTimes.length === 0) return 60;
    const avg = this.frameTimes.reduce((s, t) => s + t, 0) / this.frameTimes.length;
    return 1 / avg;
  }

  isPerformancePoor(): boolean {
    return this.getAverageFPS() < 30;
  }

  // Suggest reduced visuals if performance is poor
  shouldReduceEffects(): boolean {
    const now = performance.now();
    if (now - this.lastWarnTime < 5000) return false;
    if (this.isPerformancePoor()) {
      this.lastWarnTime = now;
      return true;
    }
    return false;
  }
}
