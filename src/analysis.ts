// ============================================================
// Neon Beats VR — Game Analysis System
// Detailed post-game analysis with timing graphs,
// accuracy breakdown, improvement suggestions
// ============================================================

import { getAccuracy, getGrade, getGradeColor, type GameState } from './game';
import { calculateStars, getStarDisplay } from './rating';
import { playMenuSelect } from './audio';

export interface TimingData {
  time: number;     // song time
  offset: number;   // ms early (negative) or late (positive)
  quality: 'perfect' | 'great' | 'good' | 'miss';
  lane: number;
}

export class GameAnalyzer {
  private timingData: TimingData[] = [];
  private comboHistory: number[] = []; // combo at each note
  private scoreHistory: number[] = [];  // score at each note

  reset() {
    this.timingData = [];
    this.comboHistory = [];
    this.scoreHistory = [];
  }

  recordHit(time: number, offsetMs: number, quality: 'perfect' | 'great' | 'good' | 'miss', lane: number, combo: number, score: number) {
    this.timingData.push({ time, offset: offsetMs, quality, lane });
    this.comboHistory.push(combo);
    this.scoreHistory.push(score);
  }

  getTimingDistribution(): { early: number; onTime: number; late: number } {
    let early = 0, onTime = 0, late = 0;
    for (const d of this.timingData) {
      if (d.quality === 'miss') continue;
      if (d.offset < -30) early++;
      else if (d.offset > 30) late++;
      else onTime++;
    }
    return { early, onTime, late };
  }

  getAverageOffset(): number {
    const hits = this.timingData.filter(d => d.quality !== 'miss');
    if (hits.length === 0) return 0;
    return hits.reduce((s, d) => s + d.offset, 0) / hits.length;
  }

  getLaneAccuracy(): number[] {
    const lanes = new Map<number, { hits: number; total: number }>();
    for (const d of this.timingData) {
      if (!lanes.has(d.lane)) lanes.set(d.lane, { hits: 0, total: 0 });
      const l = lanes.get(d.lane)!;
      l.total++;
      if (d.quality !== 'miss') l.hits++;
    }
    const result: number[] = [];
    for (let i = 0; i < 4; i++) {
      const l = lanes.get(i);
      result.push(l ? (l.hits / l.total * 100) : 0);
    }
    return result;
  }

  getLongestStreak(): { type: 'perfect' | 'great' | 'good' | 'any'; count: number } {
    let bestPerfect = 0, bestAny = 0;
    let curPerfect = 0, curAny = 0;

    for (const d of this.timingData) {
      if (d.quality !== 'miss') {
        curAny++;
        bestAny = Math.max(bestAny, curAny);
        if (d.quality === 'perfect') {
          curPerfect++;
          bestPerfect = Math.max(bestPerfect, curPerfect);
        } else {
          curPerfect = 0;
        }
      } else {
        curAny = 0;
        curPerfect = 0;
      }
    }

    return bestPerfect > bestAny / 2
      ? { type: 'perfect', count: bestPerfect }
      : { type: 'any', count: bestAny };
  }

  getSuggestions(state: GameState): string[] {
    const suggestions: string[] = [];
    const timing = this.getTimingDistribution();
    const avgOffset = this.getAverageOffset();
    const accuracy = getAccuracy(state);
    const laneAcc = this.getLaneAccuracy();

    if (Math.abs(avgOffset) > 20) {
      if (avgOffset < 0) suggestions.push('You tend to hit early — try waiting a tiny bit longer');
      else suggestions.push('You tend to hit late — try anticipating the beat');
    }

    if (timing.early > timing.late * 2) {
      suggestions.push('Most misses are from hitting too early — watch the hit zone line');
    } else if (timing.late > timing.early * 2) {
      suggestions.push('Most misses are from hitting too late — try to match the rhythm');
    }

    const weakLane = laneAcc.indexOf(Math.min(...laneAcc));
    if (laneAcc[weakLane] < 70) {
      const laneNames = ['D (left)', 'F (center-left)', 'J (center-right)', 'K (right)'];
      suggestions.push(`Lane ${weakLane + 1} (${laneNames[weakLane]}) is your weakest — practice that finger`);
    }

    if (accuracy < 60) {
      suggestions.push('Try an easier difficulty to build rhythm fundamentals');
    } else if (accuracy > 95 && state.misses <= 2) {
      suggestions.push('Amazing! Try a harder difficulty or add challenge modifiers');
    }

    if (state.maxCombo < 10 && this.timingData.length > 20) {
      suggestions.push('Focus on consistency — even Good hits are better than misses');
    }

    return suggestions.slice(0, 3);
  }

  renderAnalysis(state: GameState, songName: string): HTMLDivElement {
    const screen = document.createElement('div');
    screen.id = 'gameAnalysis';
    screen.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: radial-gradient(ellipse at center, rgba(5,2,15,0.97) 0%, rgba(0,0,0,0.99) 100%);
      z-index: 210; font-family: 'Courier New', monospace; color: #fff;
      pointer-events: auto; overflow-y: auto;
    `;

    const accuracy = getAccuracy(state);
    const grade = getGrade(accuracy);
    const gradeColor = getGradeColor(grade);
    const stars = calculateStars(state);
    const timing = this.getTimingDistribution();
    const avgOffset = this.getAverageOffset();
    const laneAcc = this.getLaneAccuracy();
    const streak = this.getLongestStreak();
    const suggestions = this.getSuggestions(state);

    // Timing bar chart
    const maxTiming = Math.max(timing.early, timing.onTime, timing.late, 1);
    const earlyPct = (timing.early / maxTiming * 100);
    const onTimePct = (timing.onTime / maxTiming * 100);
    const latePct = (timing.late / maxTiming * 100);

    screen.innerHTML = `
      <div style="max-width: 550px; width: 90%; padding: 20px 0;">
        <h2 style="text-align: center; font-size: 14px; opacity: 0.4; letter-spacing: 2px; margin-bottom: 5px;">
          ANALYSIS
        </h2>
        <h3 style="text-align: center; font-size: 22px; color: ${gradeColor}; margin-bottom: 20px;">
          ${songName} — ${grade}
        </h3>

        <!-- Score summary -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; opacity: 0.4;">SCORE</div>
            <div style="font-size: 20px; color: #00ffff;">${state.score.toLocaleString()}</div>
          </div>
          <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; opacity: 0.4;">ACCURACY</div>
            <div style="font-size: 20px; color: ${accuracy >= 90 ? '#00ff88' : accuracy >= 70 ? '#ffcc00' : '#ff6600'};">
              ${accuracy.toFixed(1)}%
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; opacity: 0.4;">MAX COMBO</div>
            <div style="font-size: 20px; color: #ff00ff;">${state.maxCombo}</div>
          </div>
        </div>

        <!-- Stars -->
        <div style="text-align: center; font-size: 28px; color: #ffd700; margin-bottom: 15px;">
          ${getStarDisplay(stars)}
        </div>

        <!-- Timing distribution -->
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <div style="font-size: 11px; opacity: 0.4; letter-spacing: 1px; margin-bottom: 8px;">TIMING</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="width: 50px; font-size: 11px; color: #ffcc00;">Early</span>
            <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
              <div style="width: ${earlyPct}%; height: 100%; background: #ffcc00; border-radius: 4px;"></div>
            </div>
            <span style="font-size: 11px; width: 25px; text-align: right;">${timing.early}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="width: 50px; font-size: 11px; color: #00ff88;">On time</span>
            <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
              <div style="width: ${onTimePct}%; height: 100%; background: #00ff88; border-radius: 4px;"></div>
            </div>
            <span style="font-size: 11px; width: 25px; text-align: right;">${timing.onTime}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 50px; font-size: 11px; color: #ff6600;">Late</span>
            <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
              <div style="width: ${latePct}%; height: 100%; background: #ff6600; border-radius: 4px;"></div>
            </div>
            <span style="font-size: 11px; width: 25px; text-align: right;">${timing.late}</span>
          </div>
          <div style="font-size: 11px; opacity: 0.4; margin-top: 6px;">
            Avg offset: ${avgOffset > 0 ? '+' : ''}${avgOffset.toFixed(1)}ms
          </div>
        </div>

        <!-- Lane accuracy -->
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <div style="font-size: 11px; opacity: 0.4; letter-spacing: 1px; margin-bottom: 8px;">LANE ACCURACY</div>
          <div style="display: flex; gap: 8px;">
            ${laneAcc.map((acc, i) => {
              const colors = ['#ff0044', '#00ff88', '#0088ff', '#ff8800'];
              return `
                <div style="flex: 1; text-align: center;">
                  <div style="height: 60px; background: rgba(255,255,255,0.05); border-radius: 4px;
                    display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden;">
                    <div style="height: ${acc}%; background: ${colors[i]}; border-radius: 4px 4px 0 0;
                      transition: height 0.5s;"></div>
                  </div>
                  <div style="font-size: 11px; margin-top: 4px; color: ${colors[i]};">${acc.toFixed(0)}%</div>
                  <div style="font-size: 9px; opacity: 0.3;">L${i + 1}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Hit breakdown -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 15px;">
          <div style="background: rgba(0,255,255,0.05); padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 16px; color: #00ffff;">${state.perfects}</div>
            <div style="font-size: 9px; opacity: 0.5;">PERFECT</div>
          </div>
          <div style="background: rgba(0,255,136,0.05); padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 16px; color: #00ff88;">${state.greats}</div>
            <div style="font-size: 9px; opacity: 0.5;">GREAT</div>
          </div>
          <div style="background: rgba(255,204,0,0.05); padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 16px; color: #ffcc00;">${state.goods}</div>
            <div style="font-size: 9px; opacity: 0.5;">GOOD</div>
          </div>
          <div style="background: rgba(255,0,68,0.05); padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 16px; color: #ff0044;">${state.misses}</div>
            <div style="font-size: 9px; opacity: 0.5;">MISS</div>
          </div>
        </div>

        <!-- Longest streak -->
        <div style="text-align: center; font-size: 12px; opacity: 0.5; margin-bottom: 15px;">
          Longest ${streak.type === 'perfect' ? 'perfect' : ''} streak: 
          <span style="color: #ffd700;">${streak.count}</span>
        </div>

        <!-- Suggestions -->
        ${suggestions.length > 0 ? `
          <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px;
            margin-bottom: 20px; border-left: 3px solid #00ffff;">
            <div style="font-size: 11px; opacity: 0.4; letter-spacing: 1px; margin-bottom: 6px;">TIPS</div>
            ${suggestions.map(s => `
              <div style="font-size: 12px; opacity: 0.6; padding: 3px 0;">💡 ${s}</div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Actions -->
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="analysisClose" style="
            background: transparent; border: 2px solid #00ffff; color: #00ffff;
            padding: 10px 30px; font-size: 14px; font-family: 'Courier New', monospace;
            cursor: pointer; border-radius: 4px; letter-spacing: 1px;
          ">CONTINUE</button>
        </div>
      </div>
    `;

    return screen;
  }

  showAnalysis(state: GameState, songName: string, onClose: () => void): HTMLDivElement {
    const existing = document.getElementById('gameAnalysis');
    if (existing) existing.remove();

    const screen = this.renderAnalysis(state, songName);
    document.body.appendChild(screen);

    screen.querySelector('#analysisClose')?.addEventListener('click', () => {
      playMenuSelect();
      screen.remove();
      onClose();
    });

    return screen;
  }
}
