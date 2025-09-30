export const PIXELS_TO_FEET = 3.5;
export const DEG = 180 / Math.PI;
export const TWO_PI = Math.PI * 2;
export const VELOCITY_MULTIPLIER = 20;

export const FRAME_INTERVAL_MS = 1000 / 120;
export const FRAME_INTERVAL_S = FRAME_INTERVAL_MS / 1000;

export const WORLD = Object.freeze({
  gravity: 0.0015,  // Reduced gravity for easier testing
  mainThrust: 0.012,
  auxThrust: 0.0055,
  rotationStep: 0.01,
  fuelBurnMain: 0.092,
  fuelBurnRotate: 0.028,
  fuelBurnAux: 0.05,
  maxFuel: 100,
  crashVelocity: 0.6,
  safeAngle: 11,
  maxAltitudeTrack: 9000,
  frameInterval: FRAME_INTERVAL_S,
  dragCoefficient: 0.0008,
  rotationDamping: 0.985,
  fuelMass: 0.4,
  emptyMass: 0.6,
});

export const Modes = Object.freeze({
  INTRO: "intro",
  PLAYING: "playing",
  ENDED: "ended",
});

export const Keys = Object.freeze({
  ArrowUp: "thrust",
  ArrowLeft: "rotateLeft",
  ArrowRight: "rotateRight",
  ArrowDown: "auxThrust",
  KeyW: "thrust",
  KeyA: "rotateLeft",
  KeyD: "rotateRight",
  KeyS: "auxThrust",
  Space: "quickReset",
  KeyZ: "autopilot",
  KeyR: "goAround",
});

export const DEFAULT_VIEW = Object.freeze({
  width: 1280,
  height: 720,
});

export const LANDING_GUIDE_LABELS = Object.freeze({
  show: "Show Landing Guide",
  hide: "Hide Landing Guide",
});
