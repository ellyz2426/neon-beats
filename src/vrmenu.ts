// ============================================================
// Neon Beats VR — VR Menu Interaction
// Pointer-based menu interaction for XR mode
// Controller ray → intersect HTML overlay → click/hover
// Thumbstick navigation for menu items
// ============================================================

import type { World } from '@iwsdk/core';
import { Vector3, Raycaster, Quaternion } from '@iwsdk/core';
import type { XRInputState } from './xrinput';

// ---- Types ----

interface VRMenuButton {
  element: HTMLElement;
  action: () => void;
  label: string;
}

// ---- VR Menu Controller ----

export class VRMenuController {
  private buttons: VRMenuButton[] = [];
  private focusIndex = -1;
  private world: World | null = null;
  private enabled = false;
  private cooldown = 0;  // prevent rapid-fire navigation
  private readonly COOLDOWN_TIME = 0.25;  // seconds between nav steps

  constructor() {}

  init(world: World) {
    this.world = world;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.clearFocus();
    }
  }

  /**
   * Scan the current DOM for interactive elements that should be
   * navigable in VR. Call this when screens change.
   */
  scanButtons() {
    this.buttons = [];
    this.focusIndex = -1;

    // Find all clickable elements with data-vr-button attribute
    // or common button-like elements
    const candidates = document.querySelectorAll(
      '[data-vr-button], button, .menu-item, .song-item, .settings-row, [role="button"]'
    );

    candidates.forEach(el => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.offsetParent === null) return;  // skip hidden
      if (htmlEl.style.display === 'none') return;

      this.buttons.push({
        element: htmlEl,
        action: () => htmlEl.click(),
        label: htmlEl.textContent?.trim() || '',
      });
    });
  }

  /**
   * Update navigation from XR input.
   * Returns true if a button was activated this frame.
   */
  update(dt: number, xrState: XRInputState): boolean {
    if (!this.enabled || this.buttons.length === 0) return false;

    this.cooldown = Math.max(0, this.cooldown - dt);

    let activated = false;

    // Thumbstick navigation (either hand)
    if (this.cooldown <= 0) {
      const navY = xrState.rightThumbstickY || xrState.leftThumbstickY;
      const navX = xrState.rightThumbstickX || xrState.leftThumbstickX;

      const justMovedY = xrState.rightThumbstickJustMoved.y || xrState.leftThumbstickJustMoved.y;
      const justMovedX = xrState.rightThumbstickJustMoved.x || xrState.leftThumbstickJustMoved.x;

      if (justMovedY) {
        if (navY < -0.5) {
          // Up
          this.moveFocus(-1);
          this.cooldown = this.COOLDOWN_TIME;
        } else if (navY > 0.5) {
          // Down
          this.moveFocus(1);
          this.cooldown = this.COOLDOWN_TIME;
        }
      }

      if (justMovedX) {
        if (navX < -0.5) {
          // Left — could be used for tabs or horizontal nav
          this.moveFocus(-1);
          this.cooldown = this.COOLDOWN_TIME;
        } else if (navX > 0.5) {
          this.moveFocus(1);
          this.cooldown = this.COOLDOWN_TIME;
        }
      }
    }

    // Trigger press → activate focused button
    if (xrState.rightTriggerJustPressed || xrState.leftTriggerJustPressed) {
      if (this.focusIndex >= 0 && this.focusIndex < this.buttons.length) {
        this.buttons[this.focusIndex].action();
        activated = true;
      }
    }

    // A button (typically index 4) or grip can also confirm
    if (xrState.rightGripJustPressed || xrState.leftGripJustPressed) {
      if (this.focusIndex >= 0 && this.focusIndex < this.buttons.length) {
        this.buttons[this.focusIndex].action();
        activated = true;
      }
    }

    return activated;
  }

  private moveFocus(direction: number) {
    if (this.buttons.length === 0) return;

    // Remove old focus style
    if (this.focusIndex >= 0 && this.focusIndex < this.buttons.length) {
      this.buttons[this.focusIndex].element.classList.remove('vr-focused');
      this.buttons[this.focusIndex].element.style.outline = '';
      this.buttons[this.focusIndex].element.style.outlineOffset = '';
    }

    // Move
    if (this.focusIndex < 0) {
      this.focusIndex = direction > 0 ? 0 : this.buttons.length - 1;
    } else {
      this.focusIndex = (this.focusIndex + direction + this.buttons.length) % this.buttons.length;
    }

    // Apply focus style
    const btn = this.buttons[this.focusIndex];
    btn.element.classList.add('vr-focused');
    btn.element.style.outline = '2px solid #00ffff';
    btn.element.style.outlineOffset = '2px';
    btn.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  private clearFocus() {
    for (const btn of this.buttons) {
      btn.element.classList.remove('vr-focused');
      btn.element.style.outline = '';
      btn.element.style.outlineOffset = '';
    }
    this.focusIndex = -1;
  }

  getFocusedLabel(): string {
    if (this.focusIndex >= 0 && this.focusIndex < this.buttons.length) {
      return this.buttons[this.focusIndex].label;
    }
    return '';
  }

  dispose() {
    this.clearFocus();
    this.buttons = [];
  }
}

// ---- VR Focus Style Injection ----

let styleInjected = false;

export function injectVRMenuStyles() {
  if (styleInjected) return;
  styleInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    .vr-focused {
      outline: 2px solid #00ffff !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
      transition: outline 0.1s, box-shadow 0.1s !important;
    }
    .vr-focused::after {
      content: '◆';
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      color: #00ffff;
      font-size: 12px;
      text-shadow: 0 0 5px #00ffff;
    }
  `;
  document.head.appendChild(style);
}
