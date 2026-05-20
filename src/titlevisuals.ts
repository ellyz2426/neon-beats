// ============================================================
// Neon Beats VR — Title Visuals
// Animated background for the title screen
// ============================================================

export class TitleVisuals {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number }[] = [];
  private animFrame: number | null = null;
  private active = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 199; pointer-events: none;
    `;
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    this.active = true;
    document.body.appendChild(this.canvas);
    this.particles = [];
    const colors = ['#ff0066', '#00ffff', '#ff00ff', '#ffff00', '#9933ff', '#00ff88'];
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3 - Math.random() * 0.5,
        size: 1 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.3 + Math.random() * 0.5,
      });
    }
    this.animate();
  }

  stop() {
    this.active = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.canvas.remove();
  }

  private animate = () => {
    if (!this.active) return;
    const { ctx, canvas, particles } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connection lines
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const alpha = (1 - dist / 150) * 0.15;
          ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    this.animFrame = requestAnimationFrame(this.animate);
  };
}

// ---- Combo Color Gradient ----

export function getComboColor(combo: number): string {
  if (combo < 10) return '#ffffff';
  if (combo < 25) return '#00ffff';
  if (combo < 50) return '#00ff88';
  if (combo < 75) return '#ffcc00';
  if (combo < 100) return '#ff6600';
  if (combo < 150) return '#ff00ff';
  if (combo < 200) return '#ff0044';
  return '#ffff00'; // gold
}

// ---- FPS Counter ----

export class FPSCounter {
  private frames = 0;
  private lastTime = performance.now();
  private fps = 0;
  private element: HTMLDivElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: fixed; bottom: 5px; right: 10px;
      font-family: 'Courier New', monospace; font-size: 11px;
      color: rgba(255,255,255,0.3); z-index: 1000;
      pointer-events: none;
    `;
    document.body.appendChild(this.element);
  }

  update() {
    this.frames++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastTime = now;
      this.element.textContent = `${this.fps} FPS`;
    }
  }

  show() { this.element.style.display = 'block'; }
  hide() { this.element.style.display = 'none'; }
}
