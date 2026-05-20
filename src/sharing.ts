// ============================================================
// Neon Beats VR — Score Sharing & Social
// Generate shareable score images and export results
// ============================================================

import { getAccuracy, getGrade, getGradeColor, type GameState } from './game';
import { calculateStars, getStarDisplay } from './rating';
import type { SongInfo } from './songs';

/**
 * Generate a shareable score card as a canvas image
 */
export function generateShareCard(
  state: GameState,
  songInfo: SongInfo,
  difficulty: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 600, 400);
  grad.addColorStop(0, '#0a0018');
  grad.addColorStop(0.5, '#120030');
  grad.addColorStop(1, '#0a0018');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 400);

  // Border glow
  ctx.strokeStyle = songInfo.color;
  ctx.lineWidth = 3;
  ctx.shadowColor = songInfo.color;
  ctx.shadowBlur = 15;
  ctx.strokeRect(10, 10, 580, 380);
  ctx.shadowBlur = 0;

  // Title
  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('NEON BEATS', 300, 50);

  // Song name
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = songInfo.color;
  ctx.shadowColor = songInfo.color;
  ctx.shadowBlur = 10;
  ctx.fillText(songInfo.name, 300, 90);
  ctx.shadowBlur = 0;

  // Difficulty
  ctx.font = '14px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText(`${songInfo.artist} • ${difficulty.toUpperCase()} • ${songInfo.bpm} BPM`, 300, 115);

  // Score
  ctx.font = 'bold 40px monospace';
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 15;
  ctx.fillText(state.score.toLocaleString(), 300, 170);
  ctx.shadowBlur = 0;

  // Grade
  const accuracy = getAccuracy(state);
  const grade = getGrade(accuracy);
  const gradeColor = getGradeColor(grade);
  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = gradeColor;
  ctx.fillText(grade, 300, 220);

  // Stars
  const stars = calculateStars(state);
  ctx.font = '24px monospace';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(getStarDisplay(stars), 300, 255);

  // Stats grid
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  const statsY = 290;
  const cols = [100, 225, 375, 500];

  // Accuracy
  ctx.fillStyle = '#00ff88';
  ctx.fillText(`${accuracy.toFixed(1)}%`, cols[0], statsY);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('ACCURACY', cols[0], statsY + 16);

  // Max Combo
  ctx.font = '14px monospace';
  ctx.fillStyle = '#ff00ff';
  ctx.fillText(`${state.maxCombo}`, cols[1], statsY);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('MAX COMBO', cols[1], statsY + 16);

  // Perfects
  ctx.font = '14px monospace';
  ctx.fillStyle = '#00ffff';
  ctx.fillText(`${state.perfects}`, cols[2], statsY);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('PERFECTS', cols[2], statsY + 16);

  // Misses
  ctx.font = '14px monospace';
  ctx.fillStyle = '#ff0044';
  ctx.fillText(`${state.misses}`, cols[3], statsY);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('MISSES', cols[3], statsY + 16);

  // Hit breakdown bar
  const total = state.perfects + state.greats + state.goods + state.misses;
  if (total > 0) {
    const barY = 340;
    const barW = 400;
    const barX = 100;
    const barH = 12;

    const pW = (state.perfects / total) * barW;
    const grW = (state.greats / total) * barW;
    const goW = (state.goods / total) * barW;
    const mW = (state.misses / total) * barW;

    let x = barX;
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(x, barY, pW, barH); x += pW;
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(x, barY, grW, barH); x += grW;
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(x, barY, goW, barH); x += goW;
    ctx.fillStyle = '#ff0044';
    ctx.fillRect(x, barY, mW, barH);
  }

  // Watermark
  ctx.font = '10px monospace';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('ellyz2426.github.io/neon-beats', 300, 380);

  return canvas;
}

/**
 * Download the score card as PNG
 */
export function downloadShareCard(canvas: HTMLCanvasElement, songName: string) {
  const link = document.createElement('a');
  link.download = `neonbeats_${songName.toLowerCase().replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Copy score to clipboard as text
 */
export async function copyScoreToClipboard(state: GameState, songInfo: SongInfo, difficulty: string): Promise<boolean> {
  const accuracy = getAccuracy(state);
  const grade = getGrade(accuracy);
  const stars = calculateStars(state);

  const text = [
    `🎵 NEON BEATS — ${songInfo.name}`,
    `${songInfo.artist} • ${difficulty.toUpperCase()} • ${songInfo.bpm} BPM`,
    ``,
    `Score: ${state.score.toLocaleString()}`,
    `Grade: ${grade} ${getStarDisplay(stars)}`,
    `Accuracy: ${accuracy.toFixed(1)}%`,
    `Max Combo: ${state.maxCombo}`,
    `Perfect: ${state.perfects} | Great: ${state.greats} | Good: ${state.goods} | Miss: ${state.misses}`,
    ``,
    `🌐 Play: ellyz2426.github.io/neon-beats`,
  ].join('\n');

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a score summary for display
 */
export function getScoreSummaryText(state: GameState, songInfo: SongInfo): string {
  const accuracy = getAccuracy(state);
  const grade = getGrade(accuracy);
  return `${songInfo.name} — ${grade} — ${state.score.toLocaleString()} — ${accuracy.toFixed(1)}%`;
}
