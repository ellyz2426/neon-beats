// ============================================================
// Neon Beats VR — XR Controller Input System
// Maps VR controller actions to game inputs:
//   - Controller ray direction → lane selection
//   - Trigger → hit block in aimed lane
//   - Grip → secondary action (bomb dodge / slide confirm)
//   - Thumbstick → menu navigation
//   - Haptic feedback on hits
// Uses IWSDK's XRInputManager and StatefulGamepad
// ============================================================

import type { World } from '@iwsdk/core';
import { Vector3, Quaternion, type Group } from '@iwsdk/core';

// ---- Types ----

export interface XRInputState {
  enabled: boolean;
  leftLane: number;
  rightLane: number;
  leftTriggerDown: boolean;
  rightTriggerDown: boolean;
  leftGripDown: boolean;
  rightGripDown: boolean;
  leftTriggerJustPressed: boolean;
  rightTriggerJustPressed: boolean;
  leftGripJustPressed: boolean;
  rightGripJustPressed: boolean;
  leftThumbstickX: number;
  leftThumbstickY: number;
  rightThumbstickX: number;
  rightThumbstickY: number;
  leftThumbstickJustMoved: { x: boolean; y: boolean };
  rightThumbstickJustMoved: { x: boolean; y: boolean };
  leftVelocity: Vector3;
  rightVelocity: Vector3;
  leftSwing: boolean;
  rightSwing: boolean;
}

interface ControllerTracking {
  prevPosition: Vector3;
  prevThumbX: number;
  prevThumbY: number;
}

// ---- Constants ----

const SWING_VELOCITY_THRESHOLD = 1.5;

// ---- XR Input Manager ----

export class XRInputManager {
  private world: World | null = null;
  private state: XRInputState;
  private leftTrack: ControllerTracking;
  private rightTrack: ControllerTracking;
  private tempVec = new Vector3();
  private tempQuat = new Quaternion();

  private numLanes = 4;
  private lanePositions: number[] = [];
  private laneSpacing = 0.4;
  private hitZoneZ = -3;

  constructor() {
    this.state = this.createDefaultState();
    this.leftTrack = { prevPosition: new Vector3(), prevThumbX: 0, prevThumbY: 0 };
    this.rightTrack = { prevPosition: new Vector3(), prevThumbX: 0, prevThumbY: 0 };
  }

  private createDefaultState(): XRInputState {
    return {
      enabled: false,
      leftLane: -1,
      rightLane: -1,
      leftTriggerDown: false,
      rightTriggerDown: false,
      leftGripDown: false,
      rightGripDown: false,
      leftTriggerJustPressed: false,
      rightTriggerJustPressed: false,
      leftGripJustPressed: false,
      rightGripJustPressed: false,
      leftThumbstickX: 0,
      leftThumbstickY: 0,
      rightThumbstickX: 0,
      rightThumbstickY: 0,
      leftThumbstickJustMoved: { x: false, y: false },
      rightThumbstickJustMoved: { x: false, y: false },
      leftVelocity: new Vector3(),
      rightVelocity: new Vector3(),
      leftSwing: false,
      rightSwing: false,
    };
  }

  init(world: World, numLanes: number, laneSpacing: number, hitZoneZ: number) {
    this.world = world;
    this.numLanes = numLanes;
    this.laneSpacing = laneSpacing;
    this.hitZoneZ = hitZoneZ;
    this.recalcLanePositions();
  }

  recalcLanePositions() {
    this.lanePositions = [];
    const totalWidth = (this.numLanes - 1) * this.laneSpacing;
    const startX = -totalWidth / 2;
    for (let i = 0; i < this.numLanes; i++) {
      this.lanePositions.push(startX + i * this.laneSpacing);
    }
  }

  setNumLanes(n: number) {
    this.numLanes = n;
    this.recalcLanePositions();
  }

  getState(): XRInputState { return this.state; }
  isActive(): boolean { return this.state.enabled; }

  /**
   * Call every frame. Returns lane indices that were just hit this frame.
   */
  update(dt: number): number[] {
    if (!this.world) return [];

    // Check if in XR — try xrSession property or session property  
    const w = this.world as any;
    this.state.enabled = !!(w.xrSession || w.session || w.renderer?.xr?.isPresenting);
    if (!this.state.enabled) return [];

    const hitsThisFrame: number[] = [];

    // Access gamepads through world.input.xr (IWSDK 0.4.x InputManager)
    const input = (this.world as any).input;
    const xrInput = input?.xr || input; // fallback for 0.3.x compat
    if (!xrInput?.gamepads) return hitsThisFrame;

    // Process left controller
    const leftGP = xrInput.gamepads.left;
    const rightGP = xrInput.gamepads.right;

    // ---- Left Controller ----
    if (leftGP) {
      const triggerDown = leftGP.getButtonPressed('xr-standard-trigger');
      const triggerJust = leftGP.getButtonDown('xr-standard-trigger');
      const gripDown = leftGP.getButtonPressed('xr-standard-squeeze');
      const gripJust = leftGP.getButtonDown('xr-standard-squeeze');

      this.state.leftTriggerDown = triggerDown;
      this.state.leftTriggerJustPressed = triggerJust;
      this.state.leftGripDown = gripDown;
      this.state.leftGripJustPressed = gripJust;

      // Thumbstick
      const thumbAxes = leftGP.getAxesValues('xr-standard-thumbstick');
      if (thumbAxes) {
        const justX = Math.abs(thumbAxes.x) > 0.6 && Math.abs(this.leftTrack.prevThumbX) <= 0.6;
        const justY = Math.abs(thumbAxes.y) > 0.6 && Math.abs(this.leftTrack.prevThumbY) <= 0.6;
        this.state.leftThumbstickX = thumbAxes.x;
        this.state.leftThumbstickY = thumbAxes.y;
        this.state.leftThumbstickJustMoved = { x: justX, y: justY };
        this.leftTrack.prevThumbX = thumbAxes.x;
        this.leftTrack.prevThumbY = thumbAxes.y;
      }
    }

    // ---- Right Controller ----
    if (rightGP) {
      const triggerDown = rightGP.getButtonPressed('xr-standard-trigger');
      const triggerJust = rightGP.getButtonDown('xr-standard-trigger');
      const gripDown = rightGP.getButtonPressed('xr-standard-squeeze');
      const gripJust = rightGP.getButtonDown('xr-standard-squeeze');

      this.state.rightTriggerDown = triggerDown;
      this.state.rightTriggerJustPressed = triggerJust;
      this.state.rightGripDown = gripDown;
      this.state.rightGripJustPressed = gripJust;

      const thumbAxes = rightGP.getAxesValues('xr-standard-thumbstick');
      if (thumbAxes) {
        const justX = Math.abs(thumbAxes.x) > 0.6 && Math.abs(this.rightTrack.prevThumbX) <= 0.6;
        const justY = Math.abs(thumbAxes.y) > 0.6 && Math.abs(this.rightTrack.prevThumbY) <= 0.6;
        this.state.rightThumbstickX = thumbAxes.x;
        this.state.rightThumbstickY = thumbAxes.y;
        this.state.rightThumbstickJustMoved = { x: justX, y: justY };
        this.rightTrack.prevThumbX = thumbAxes.x;
        this.rightTrack.prevThumbY = thumbAxes.y;
      }
    }

    // ---- Controller spatial tracking via playerSpaceEntities (0.4.x) or player (0.3.x) ----
    const spaces = (this.world as any).playerSpaceEntities;
    const player = (this.world as any).player;
    
    // Try 0.4.x path first, then 0.3.x fallback
    const leftRayObj = spaces?.raySpaces?.left?.getObject3D?.() || player?.raySpaces?.left;
    const rightRayObj = spaces?.raySpaces?.right?.getObject3D?.() || player?.raySpaces?.right;

    if (leftRayObj) {
      this.state.leftLane = this.getLaneFromController(leftRayObj);
      this.updateVelocity(leftRayObj, this.leftTrack, this.state.leftVelocity, dt);
      this.state.leftSwing = this.state.leftVelocity.length() > SWING_VELOCITY_THRESHOLD;
    }

    if (rightRayObj) {
      this.state.rightLane = this.getLaneFromController(rightRayObj);
      this.updateVelocity(rightRayObj, this.rightTrack, this.state.rightVelocity, dt);
      this.state.rightSwing = this.state.rightVelocity.length() > SWING_VELOCITY_THRESHOLD;
    }

    // ---- Determine hits: trigger press → hit the aimed lane ----
    if (this.state.leftTriggerJustPressed && this.state.leftLane >= 0) {
      hitsThisFrame.push(this.state.leftLane);
    }
    if (this.state.rightTriggerJustPressed && this.state.rightLane >= 0) {
      hitsThisFrame.push(this.state.rightLane);
    }

    // Swing hits (motion-based, no trigger needed)
    if (this.state.leftSwing && this.state.leftLane >= 0 && !this.state.leftTriggerDown) {
      if (this.state.leftVelocity.y < -0.5 || this.state.leftVelocity.z < -0.5) {
        hitsThisFrame.push(this.state.leftLane);
      }
    }
    if (this.state.rightSwing && this.state.rightLane >= 0 && !this.state.rightTriggerDown) {
      if (this.state.rightVelocity.y < -0.5 || this.state.rightVelocity.z < -0.5) {
        hitsThisFrame.push(this.state.rightLane);
      }
    }

    return [...new Set(hitsThisFrame)];
  }

  private getLaneFromController(raySpace: Group): number {
    raySpace.getWorldPosition(this.tempVec);
    raySpace.getWorldQuaternion(this.tempQuat);

    const direction = new Vector3(0, 0, -1).applyQuaternion(this.tempQuat);
    if (Math.abs(direction.z) < 0.001) return -1;

    const t = (this.hitZoneZ - this.tempVec.z) / direction.z;
    if (t < 0) return -1;

    const hitX = this.tempVec.x + t * direction.x;

    let closestLane = -1;
    let closestDist = this.laneSpacing * 0.75;
    for (let i = 0; i < this.lanePositions.length; i++) {
      const dist = Math.abs(hitX - this.lanePositions[i]);
      if (dist < closestDist) {
        closestDist = dist;
        closestLane = i;
      }
    }

    return closestLane;
  }

  private updateVelocity(obj: Group, track: ControllerTracking, velocity: Vector3, dt: number) {
    obj.getWorldPosition(this.tempVec);
    if (dt > 0 && track.prevPosition.lengthSq() > 0) {
      velocity.copy(this.tempVec).sub(track.prevPosition).divideScalar(dt);
    } else {
      velocity.set(0, 0, 0);
    }
    track.prevPosition.copy(this.tempVec);
  }

  /**
   * Trigger haptic feedback
   */
  triggerHaptic(hand: 'left' | 'right' | 'both', intensity: number = 0.5, duration: number = 50) {
    if (!this.world || !this.state.enabled) return;

    const input = (this.world as any).input;
    const xrInput = input?.xr || input;
    if (!xrInput?.gamepads) return;

    const hands = hand === 'both' ? (['left', 'right'] as const) : ([hand] as const);
    for (const h of hands) {
      const gp = xrInput.gamepads[h];
      if (!gp) continue;

      try {
        const rawGP = gp.gamepad;
        if ('hapticActuators' in rawGP && (rawGP as any).hapticActuators?.length > 0) {
          (rawGP as any).hapticActuators[0].pulse(intensity, duration);
        }
        if ('vibrationActuator' in rawGP && (rawGP as any).vibrationActuator) {
          (rawGP as any).vibrationActuator.playEffect('dual-rumble', {
            duration,
            strongMagnitude: intensity,
            weakMagnitude: intensity * 0.5,
          });
        }
      } catch { /* Not all controllers support haptics */ }
    }
  }

  getHitHand(): 'left' | 'right' | 'both' | null {
    const l = this.state.leftTriggerJustPressed || this.state.leftSwing;
    const r = this.state.rightTriggerJustPressed || this.state.rightSwing;
    if (l && r) return 'both';
    if (l) return 'left';
    if (r) return 'right';
    return null;
  }
}
