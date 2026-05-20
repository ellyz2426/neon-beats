// ============================================================
// Neon Beats VR — Score Card Generator
// Generate a shareable results image using Canvas API
// Shows song name, score, accuracy, grade, combo, stars
// ============================================================

import { getGrade, getAccuracy, type GameState } from './game';
import { calculateStars } from './rating';
import { getSongInfo, type SongInfo } from './songs';

export class ScoreCardGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600;
    this.canvas.height = 340;
    this.ctx = this.canvas.getContext('2d')!;
  }

  generate(state: GameState, songInfo: SongInfo): string {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const accuracy = getAccuracy(state);
    const grade = getGrade(state);
    const stars = calculateStars(state);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0018');
    grad.addColorStop(0.5, '#120030');
    grad.addColorStop(1, '#0a0018');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Border glow
    ctx.strokeStyle = songInfo.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = songInfo.color;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.shadowBlur = 0;

    // Title: "NEON BEATS"
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.fillText('◆ NEON BEATS VR ◆', W / 2, 40);

    // Song name
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = songInfo.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = songInfo.color;
    ctx.fillText(songInfo.name.toUpperCase(), W / 2, 80);
    ctx.shadowBlur = 0;

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`by ${songInfo.artist} • ${songInfo.bpm} BPM`, W / 2, 100);

    // Score
    ctx.font = 'bold 42px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ffff';
    ctx.fillText(state.score.toLocaleString(), W / 2, 155);
    ctx.shadowBlur = 0;

    // Grade circle
    const gradeColors: Record<string, string> = {
      'S+': '#ffd700', 'S': '#ffd700', 'A': '#00ff88',
      'B': '#00ffff', 'C': '#ffcc00', 'D': '#ff6600', 'F': '#ff0044',
    };
    const gradeColor = gradeColors[grade] || '#ffffff';
    ctx.beginPath();
    ctx.arc(100, 210, 35, 0, Math.PI * 2);
    ctx.strokeStyle = gradeColor;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = gradeColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = gradeColor;
    ctx.textAlign = 'center';
    ctx.fillText(grade, 100, 220);

    // Stars
    const starY = 210;
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < stars ? '#ffd700' : '#333';
      ctx.fillText('★', 230 + i * 35, starY);
    }

    // Stats columns
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    const statsX = 60;
    const statsY = 270;
    const stats = [
      ['ACCURACY', `${(accuracy * 100).toFixed(1)}%`],
      ['MAX COMBO', `${state.maxCombo}x`],
      ['PERFECT', `${state.perfects}`],
      ['GREAT', `${state.greats}`],
      ['GOOD', `${state.goods}`],
      ['MISS', `${state.misses}`],
    ];

    for (let i = 0; i < stats.length; i++) {
      const x = statsX + (i % 3) * 180;
      const y = statsY + Math.floor(i / 3) * 25;
      ctx.fillStyle = '#666';
      ctx.fillText(stats[i][0], x, y);
      ctx.fillStyle = '#fff';
      ctx.fillText(stats[i][1], x + 80, y);
    }

    // Footer
    ctx.font = '11px monospace';
    ctx.fillStyle = '#444';
    ctx.textAlign = 'center';
    ctx.fillText('ellyz2426.github.io/neon-beats', W / 2, H - 15);

    return this.canvas.toDataURL('image/png');
  }

  /**
   * Trigger download of the score card
   */
  download(state: GameState, songInfo: SongInfo) {
    const dataUrl = this.generate(state, songInfo);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `neonbeats-${songInfo.id}-${state.score}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Copy to clipboard
   */
  async copyToClipboard(state: GameState, songInfo: SongInfo) {
    this.generate(state, songInfo);
    try {
      const blob = await new Promise<Blob>((resolve) =>
        this.canvas.toBlob(b => resolve(b!), 'image/png')
      );
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    } catch {
      return false;
    }
  }
}
