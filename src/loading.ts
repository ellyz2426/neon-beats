// ============================================================
// Neon Beats VR — Loading Screen & Error Handling
// Animated loading state with progress bar
// Error boundary for graceful failure
// ============================================================

// ---- Loading Screen ----

let loadingEl: HTMLDivElement | null = null;
let progressBar: HTMLDivElement | null = null;
let loadingText: HTMLDivElement | null = null;
let loadingSubtext: HTMLDivElement | null = null;

export function showLoadingScreen(message: string = 'Loading...') {
  if (!loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #000; display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 500;
      font-family: monospace;
    `;

    // Title
    const title = document.createElement('div');
    title.style.cssText = `
      color: #00ffff; font-size: 28px; font-weight: bold;
      text-shadow: 0 0 20px rgba(0,255,255,0.5);
      margin-bottom: 30px; letter-spacing: 4px;
    `;
    title.textContent = '◆ NEON BEATS VR ◆';
    loadingEl.appendChild(title);

    // Progress bar container
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
      width: 300px; height: 4px; background: rgba(255,255,255,0.1);
      border-radius: 2px; overflow: hidden; margin-bottom: 20px;
    `;
    progressBar = document.createElement('div');
    progressBar.style.cssText = `
      height: 100%; width: 0%; background: linear-gradient(90deg, #00ffff, #ff00ff);
      border-radius: 2px; transition: width 0.3s ease;
    `;
    barContainer.appendChild(progressBar);
    loadingEl.appendChild(barContainer);

    // Text
    loadingText = document.createElement('div');
    loadingText.style.cssText = 'color: #888; font-size: 14px; margin-bottom: 5px;';
    loadingText.textContent = message;
    loadingEl.appendChild(loadingText);

    // Subtext
    loadingSubtext = document.createElement('div');
    loadingSubtext.style.cssText = 'color: #444; font-size: 11px;';
    loadingSubtext.textContent = '';
    loadingEl.appendChild(loadingSubtext);

    // Animated dots
    const dots = document.createElement('div');
    dots.style.cssText = `
      display: flex; gap: 8px; margin-top: 25px;
    `;
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 6px; height: 6px; border-radius: 50%;
        background: #00ffff; opacity: 0.3;
        animation: pulse-dot 1.2s infinite ease-in-out ${i * 0.2}s;
      `;
      dots.appendChild(dot);
    }
    loadingEl.appendChild(dots);

    // Inject animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-dot {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(loadingEl);
  }

  loadingEl.style.display = 'flex';
  if (loadingText) loadingText.textContent = message;
}

export function updateLoadingProgress(progress: number, message?: string, subtext?: string) {
  if (progressBar) progressBar.style.width = `${Math.min(100, progress)}%`;
  if (message && loadingText) loadingText.textContent = message;
  if (subtext && loadingSubtext) loadingSubtext.textContent = subtext;
}

export function hideLoadingScreen() {
  if (loadingEl) {
    loadingEl.style.opacity = '1';
    loadingEl.style.transition = 'opacity 0.5s';
    loadingEl.style.opacity = '0';
    setTimeout(() => {
      if (loadingEl) loadingEl.style.display = 'none';
    }, 500);
  }
}

// ---- Error Handler ----

let errorEl: HTMLDivElement | null = null;

export function showError(title: string, message: string, recoverable: boolean = true) {
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 600;
      font-family: monospace;
    `;
    document.body.appendChild(errorEl);
  }

  errorEl.innerHTML = `
    <div style="max-width: 500px; text-align: center;">
      <div style="color: #ff0044; font-size: 48px; margin-bottom: 20px;">⚠</div>
      <div style="color: #ff0044; font-size: 20px; font-weight: bold; margin-bottom: 10px;">${title}</div>
      <div style="color: #888; font-size: 14px; margin-bottom: 25px;">${message}</div>
      ${recoverable ? `
        <button onclick="location.reload()" style="
          background: #00ffff; color: #000; border: none; padding: 10px 30px;
          cursor: pointer; font-family: monospace; font-weight: bold; font-size: 14px;
        ">RELOAD</button>
      ` : ''}
    </div>
  `;
  errorEl.style.display = 'flex';
}

// ---- Global Error Boundary ----

export function setupErrorBoundary() {
  window.addEventListener('error', (e) => {
    console.error('Uncaught error:', e.error);
    // Don't show error UI for minor issues
    if (e.error?.message?.includes('ResizeObserver')) return;
    if (e.error?.message?.includes('Cannot read properties of null')) return;
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
  });
}

// ---- WebXR Availability Check ----

export async function checkWebXRSupport(): Promise<{
  supported: boolean;
  vrSupported: boolean;
  arSupported: boolean;
}> {
  const result = {
    supported: false,
    vrSupported: false,
    arSupported: false,
  };

  if (!('xr' in navigator)) return result;

  try {
    result.vrSupported = await (navigator as any).xr.isSessionSupported('immersive-vr');
    result.supported = result.vrSupported;
  } catch {}

  try {
    result.arSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');
    if (result.arSupported) result.supported = true;
  } catch {}

  return result;
}
