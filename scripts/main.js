import { LANDING_GUIDE_LABELS, Modes, Keys, WORLD } from "./config/constants.js";
import { createHud } from "./ui/hud.js";
import { createInstructionsOverlay } from "./ui/instructions.js";
import { createEndOverlay } from "./ui/endOverlay.js";
import { createTouchControls } from "./ui/touchControls.js";
import { createToast } from "./ui/toast.js";
import { createKeyboardController } from "./input/keyboard.js";
import { createLanguageSelector } from "./ui/languageSelector.js";
import { i18n } from "./utils/i18n.js";
import { Starfield } from "./systems/starfield.js";
import { Terrain } from "./systems/terrain.js";
import { ParticleSystem } from "./systems/particleSystem.js";
import { DebrisField } from "./systems/debrisField.js";
import { Lander } from "./entities/lander.js";
import { computeScore, formatMissionSummary } from "./scoring/mission.js";
import { DEG } from "./config/constants.js";
import { mphFromPixels } from "./utils/math.js";
import { createPhysicsControls } from "./ui/physicsControls.js";
import { createApproachIndicator } from "./ui/approachIndicator.js";
import {
  createLanderSprite,
  createStarBackground,
  createExplosionSprites,
  createParticleSprite,
  createDustSprite
} from "./utils/pixelArt.js";
import { assetLoader } from "./utils/assetLoader.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load pixel art sprites from web assets
await assetLoader.loadImages({
  'lander': './assets/lander-sprite.png',
  'background': './assets/star-background.png',
  'explosionSheet': './assets/explosion-frames.png',
  'particle': './assets/particle-sprite.png',
  'dust': './assets/dust-particle.png'
});

// Wait for all assets to load
const assetsLoaded = await assetLoader.waitForAll();

// Extract explosion frames from sprite sheet (4 frames, 48x48 each)
function extractExplosionFrames() {
  const sheet = assetLoader.get('explosionSheet');
  const frames = [];
  for (let i = 0; i < 4; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sheet, i * 48, 0, 48, 48, 0, 0, 48, 48);
    frames.push(canvas);
  }
  return frames;
}

// Load pixel art assets
const gameAssets = {
  landerSprite: assetLoader.get('lander'), // Use pixel art sprite from the web!
  starBackground: assetLoader.get('background'),
  explosionFrames: assetsLoaded ? extractExplosionFrames() : createExplosionSprites(),
  particleSprite: assetLoader.get('particle'),
  dustSprite: assetLoader.get('dust'),
};

// Disable image smoothing for crisp pixel art
ctx.imageSmoothingEnabled = false;

let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

const hud = createHud({
  fuel: document.getElementById("hudFuel"),
  speed: document.getElementById("hudSpeed"),
  vertical: document.getElementById("hudVertical"),
  horizontal: document.getElementById("hudHorizontal"),
  angle: document.getElementById("hudAngle"),
  altitude: document.getElementById("hudAltitude"),
  time: document.getElementById("hudTime"),
  status: document.getElementById("hudStatus"),
});

const instructionsOverlay = createInstructionsOverlay({
  overlay: document.getElementById("instructionsOverlay"),
  checklistInputs: {
    engine: document.querySelector('[data-control-check="engine"]'),
    left: document.querySelector('[data-control-check="left"]'),
    right: document.querySelector('[data-control-check="right"]'),
    combo: document.querySelector('[data-control-check="combo"]'),
  },
});

const endOverlay = createEndOverlay({
  overlay: document.getElementById("endOverlay"),
  elements: {
    title: document.getElementById("endTitle"),
    score: document.getElementById("endScore"),
    outcome: document.getElementById("endOutcome"),
    subtitle: document.getElementById("endSubtitle"),
    meterSpeed: document.getElementById("meterSpeed"),
    meterSpeedValue: document.getElementById("meterSpeedValue"),
    meterAngle: document.getElementById("meterAngle"),
    meterAngleValue: document.getElementById("meterAngleValue"),
    time: document.getElementById("statTime"),
    fuel: document.getElementById("statFuel"),
    maxSpeed: document.getElementById("statMaxSpeed"),
    maxAltitude: document.getElementById("statMaxAltitude"),
    flips: document.getElementById("statFlips"),
    pad: document.getElementById("statPad"),
  },
});

const toast = createToast(document.getElementById("toast"));
const touchControls = createTouchControls(document.getElementById("touchControls"));
const physicsControls = createPhysicsControls({
  container: document.getElementById("tuningPanel"),
  thrustInput: document.getElementById("thrustSlider"),
  thrustLabel: document.getElementById("thrustValue"),
  massInput: document.getElementById("massSlider"),
  massLabel: document.getElementById("massValue"),
});
const approachIndicator = createApproachIndicator(canvas);
const languageSelector = createLanguageSelector(document.getElementById("languageSelector"));

const starfield = new Starfield(240);
const terrain = new Terrain(viewWidth, viewHeight);
const particles = new ParticleSystem();
const debrisField = new DebrisField();
const lander = new Lander();

const inputState = {
  thrust: false,
  rotateLeft: false,
  rotateRight: false,
  auxThrust: false,
  autopilot: false,
};

const controlChecklist = {
  engine: false,
  left: false,
  right: false,
  combo: false,
};

let mode = Modes.INTRO;
let showLandingPads = false;
let missionStart = null;
let lastFrame = performance.now();
let frameRequestId = null;
let latestShareData = null;
let cameraShake = { x: 0, y: 0, intensity: 0 };
let flashIntensity = 0;
let slowMotionFactor = 1;

function resetChecklist() {
  controlChecklist.engine = false;
  controlChecklist.left = false;
  controlChecklist.right = false;
  controlChecklist.combo = false;
  instructionsOverlay.updateChecklist(controlChecklist);
}

function setControlState(control, active) {
  if (control === "thrust") {
    inputState.thrust = active;
    if (active) controlChecklist.engine = true;
  }
  if (control === "rotateLeft") {
    inputState.rotateLeft = active;
    if (active) controlChecklist.left = true;
  }
  if (control === "rotateRight") {
    inputState.rotateRight = active;
    if (active) controlChecklist.right = true;
  }
  if (control === "auxThrust") {
    inputState.auxThrust = active;
  }
  if (control === "autopilot") {
    inputState.autopilot = active;
  }
  if (inputState.thrust && (inputState.rotateLeft || inputState.rotateRight)) {
    controlChecklist.combo = true;
  }
  if (mode === Modes.INTRO) {
    instructionsOverlay.updateChecklist(controlChecklist);
  }
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  viewWidth = window.innerWidth;
  viewHeight = window.innerHeight;
  canvas.width = Math.round(viewWidth * dpr);
  canvas.height = Math.round(viewHeight * dpr);
  canvas.style.width = `${viewWidth}px`;
  canvas.style.height = `${viewHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;

  // Keep using the loaded star background (it will be tiled/stretched to fit)
  // No need to recreate it on resize

  starfield.resize(viewWidth, viewHeight);
  terrain.resize(viewWidth, viewHeight);
  terrain.setShowPads(showLandingPads);
  lander.reset(viewWidth, viewHeight);
  particles.reset();
  debrisField.reset();
  missionStart = null;
  updateHud(0);
}

function updateHud(missionTime = 0) {
  const altitude = lander.getAltitude(terrain);
  hud.update({
    lander,
    altitudeFt: altitude,
    missionTime,
    mode,
  });
}

function setMode(nextMode) {
  mode = nextMode;
  if (mode === Modes.INTRO) {
    instructionsOverlay.show();
    endOverlay.hide();
    resetChecklist();
    missionStart = null;
  } else if (mode === Modes.PLAYING) {
    instructionsOverlay.hide();
    endOverlay.hide();
    missionStart = performance.now();
    lander.stats.time = 0;
  }
}

function resetMission(fullReset = false) {
  if (fullReset) {
    terrain.generate(Math.random());
    terrain.setShowPads(showLandingPads);
  }
  lander.reset(viewWidth, viewHeight);
  particles.reset();
  debrisField.reset();
  inputState.thrust = false;
  inputState.rotateLeft = false;
  inputState.rotateRight = false;
  inputState.auxThrust = false;
  missionStart = performance.now();
  touchControls.reset();
}

function evaluateContact() {
  if (lander.landed || lander.crashed) return;

  const altitude = lander.getAltitude(terrain);
  if (altitude > 50) {
    return;
  }

  const feet = lander.getFootPositions();
  const nozzle = lander.getNozzlePosition();
  let contactInfo = null;
  let padContact = false;

  for (const foot of feet) {
    const surface = terrain.getSurfaceAt(foot.x);
    if (foot.y >= surface.y) {
      contactInfo = surface;
      padContact = surface.type === "pad";
      break;
    }
  }

  if (!contactInfo) {
    const surface = terrain.getSurfaceAt(nozzle.x);
    if (nozzle.y >= surface.y) {
      contactInfo = surface;
      padContact = surface.type === "pad";
    }
  }

  if (!contactInfo) {
    if (lander.position.y > viewHeight + lander.height) {
      crashLander("Out of bounds", null);
    }
    return;
  }

  const speedMagnitude = Math.hypot(lander.velocity.x, lander.velocity.y);
  const angleDeviation = Math.abs((lander.angle + Math.PI / 2) * DEG);

  const landedSafely =
    padContact &&
    speedMagnitude <= WORLD.crashVelocity &&
    angleDeviation <= WORLD.safeAngle;

  if (landedSafely) {
    lander.landed = true;
    lander.rotationVelocity = 0;
    lander.velocity.x = 0;
    lander.velocity.y = 0;
    lander.angle = -Math.PI / 2;
    lander.position.y = contactInfo.y - lander.height * 0.5;
    lander.captureTouchdown(terrain, contactInfo);

    // Small camera shake and flash on successful landing
    cameraShake.intensity = 3;
    flashIntensity = 0.15;

    // Spawn landing dust burst
    for (let i = 0; i < 20; i++) {
      particles.spawnDust(lander.position.x + (Math.random() - 0.5) * 60, contactInfo.y, 1);
    }

    concludeMission(true, contactInfo);
  } else {
    crashLander("Impact detected", contactInfo);
  }
}

function crashLander(reason, contactInfo) {
  if (lander.crashed) return;
  lander.crashed = true;
  lander.captureTouchdown(terrain, contactInfo);
  debrisField.explode({ x: lander.position.x, y: lander.position.y });

  // Camera shake and flash on crash
  cameraShake.intensity = 15;
  flashIntensity = 0.4;

  // Translate crash reason if it's a standard one
  const translatedReason = reason === "Impact detected" ? i18n.t("crashImpact") : 
                           reason === "Out of bounds" ? i18n.t("crashOutOfBounds") : 
                           reason;
  concludeMission(false, contactInfo, translatedReason);
}

function concludeMission(safe, contactInfo, reason = "") {
  lander.captureTouchdown(terrain, contactInfo);
  const duration = lander.stats.time;
  const fuelRemaining = lander.fuel;
  const touchdownSpeed = lander.stats.touchdownSpeed;
  const touchdownAngle = lander.stats.touchdownAngle;

  const scoreValue = computeScore({
    landed: safe,
    fuel: fuelRemaining,
    speed: touchdownSpeed,
    angle: touchdownAngle,
    time: duration,
    flips: lander.stats.flips,
  });

  const overlayData = {
    safe,
    scoreValue,
    reason,
    contactPad: lander.contactPad,
    touchdownSpeed,
    touchdownAngle,
    stats: {
      time: duration,
      fuel: fuelRemaining,
      maxSpeed: lander.stats.maxSpeed,
      maxAltitude: lander.stats.maxAltitude,
      flips: lander.stats.flips,
    },
  };

  latestShareData = {
    overlay: overlayData,
    summary: {
      safe,
      score: Intl.NumberFormat().format(Math.round(scoreValue)),
      outcomeLabel: safe ? "mission points" : "salvage rating",
      stats: {
        time: `${duration.toFixed(1)} s`,
        fuel: `${Math.round(fuelRemaining)}%`,
        maxSpeed: `${mphFromPixels(lander.stats.maxSpeed).toFixed(1)} mph`,
        maxAltitude: `${Math.round(lander.stats.maxAltitude)} ft`,
        flips: `${lander.stats.flips}`,
      },
      touchdown: {
        speed: `${mphFromPixels(touchdownSpeed).toFixed(1)} mph`,
        angle: `${touchdownAngle.toFixed(1)}°`,
      },
      padLabel: lander.contactPad
        ? `${lander.contactPad.id} (${lander.contactPad.difficulty})`
        : "No pad",
      playUrl: getShareUrl(),
    },
  };

  endOverlay.show(overlayData);
  mode = Modes.ENDED;
  updateHud(duration);
  inputState.thrust = false;
  inputState.rotateLeft = false;
  inputState.rotateRight = false;
  touchControls.reset();
}

function getShareUrl() {
  try {
    const url = new URL(window.location.href);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

function handleShare() {
  if (!latestShareData?.summary) return;
  const summary = formatMissionSummary(latestShareData.summary);
  if (navigator.share) {
    navigator
      .share({
        title: "Space Lander Mission Report",
        text: summary,
      })
      .catch(() => {});
  } else {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(() => {
        toast.show(i18n.t("toastStatsCopied"));
      });
    }
  }
}

function handleCopy() {
  if (!latestShareData?.summary) return;
  const summary = formatMissionSummary(latestShareData.summary);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(summary).then(() => {
      toast.show(i18n.t("toastStatsCopied"));
    });
  } else {
    toast.show(i18n.t("toastClipboardUnavailable"));
  }
}

function togglePadGuide(button) {
  showLandingPads = !showLandingPads;
  terrain.setShowPads(showLandingPads);
  button.textContent = showLandingPads
    ? i18n.t("buttonHideGuide")
    : i18n.t("buttonShowGuide");
}

function animate(now) {
  frameRequestId = requestAnimationFrame(animate);
  let dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  // Check for slow motion trigger
  const altitude = lander.getAltitude(terrain);
  const speed = Math.hypot(lander.velocity.x, lander.velocity.y);
  if (mode === Modes.PLAYING && altitude < 50 && !lander.landed && !lander.crashed) {
    slowMotionFactor = 0.5;
  } else {
    slowMotionFactor = Math.min(1, slowMotionFactor + 0.02);
  }
  dt *= slowMotionFactor;

  starfield.update(dt, lander.velocity);
  particles.update(dt);
  debrisField.update(dt);

  // Update camera shake
  if (cameraShake.intensity > 0) {
    cameraShake.x = (Math.random() - 0.5) * cameraShake.intensity;
    cameraShake.y = (Math.random() - 0.5) * cameraShake.intensity;
    cameraShake.intensity *= 0.9;
    if (cameraShake.intensity < 0.1) {
      cameraShake.intensity = 0;
      cameraShake.x = 0;
      cameraShake.y = 0;
    }
  }

  // Update flash
  if (flashIntensity > 0) {
    flashIntensity *= 0.92;
    if (flashIntensity < 0.01) flashIntensity = 0;
  }

  ctx.save();
  ctx.clearRect(0, 0, viewWidth, viewHeight);

  // Apply camera shake
  ctx.translate(cameraShake.x, cameraShake.y);

  // Draw star background if available
  if (gameAssets.starBackground) {
    ctx.globalAlpha = 0.8;
    // Tile or stretch the background image to fill the screen
    const bgWidth = gameAssets.starBackground.width;
    const bgHeight = gameAssets.starBackground.height;
    const scaleX = viewWidth / bgWidth;
    const scaleY = viewHeight / bgHeight;
    const scale = Math.max(scaleX, scaleY);
    const drawWidth = bgWidth * scale;
    const drawHeight = bgHeight * scale;
    const offsetX = (viewWidth - drawWidth) / 2;
    const offsetY = (viewHeight - drawHeight) / 2;
    ctx.drawImage(gameAssets.starBackground, offsetX, offsetY, drawWidth, drawHeight);
    ctx.globalAlpha = 1.0;
  }

  starfield.draw(ctx);
  terrain.draw(ctx, lander.position, altitude);

  if (mode === Modes.PLAYING) {
    // Create temporary input state for autopilot
    const effectiveInput = { ...inputState };

    // Autopilot assist
    if (inputState.autopilot && lander.fuel > 0) {
      const targetAngle = -Math.PI / 2; // Upright
      const angleError = lander.angle - targetAngle;

      if (Math.abs(angleError) > 0.05) {
        if (angleError > 0) effectiveInput.rotateLeft = true;
        else effectiveInput.rotateRight = true;
      } else if (Math.abs(lander.rotationVelocity) > 0.5) {
        if (lander.rotationVelocity > 0) effectiveInput.rotateRight = true;
        else effectiveInput.rotateLeft = true;
      }

      // Auto-thrust to counter velocity
      if (altitude < 200 && Math.abs(lander.velocity.y) > 0.3) {
        effectiveInput.auxThrust = true;
      }
    }

    lander.applyInput(effectiveInput, dt);
    lander.integrate(dt, { width: viewWidth, height: viewHeight });
    lander.updateStats(dt, terrain);

    // Spawn dust particles when close to ground
    if (altitude < 150 && !lander.landed && !lander.crashed) {
      const dustIntensity = Math.max(0, 1 - altitude / 150);
      const speed = Math.hypot(lander.velocity.x, lander.velocity.y);
      if (Math.random() < dustIntensity * 0.3 * (0.5 + speed)) {
        const surface = terrain.getSurfaceAt(lander.position.x);
        particles.spawnDust(lander.position.x, surface.y, Math.floor(2 + dustIntensity * 4));
      }
    }

    evaluateContact();
  }

  // Draw shadow (altitude is already defined at top of animate function)
  if (!lander.landed && !lander.crashed && altitude < 500) {
    const surface = terrain.getSurfaceAt(lander.position.x);
    const shadowAlpha = Math.max(0, 1 - altitude / 500) * 0.4;
    const shadowSize = 30 + (500 - altitude) * 0.08;
    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.ellipse(lander.position.x, surface.y - 5, shadowSize, shadowSize * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  lander.draw(ctx, particles, gameAssets.landerSprite);
  approachIndicator.draw(ctx, lander, terrain, viewHeight);
  particles.draw(ctx, gameAssets);
  debrisField.draw(ctx);

  // Draw flash overlay
  if (flashIntensity > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
    ctx.fillRect(-cameraShake.x, -cameraShake.y, viewWidth, viewHeight);
  }

  ctx.restore();

  const missionTime =
    mode === Modes.PLAYING && missionStart
      ? (performance.now() - missionStart) / 1000
      : mode === Modes.ENDED
      ? lander.stats.time
      : 0;
  updateHud(missionTime);
}

window.addEventListener("resize", () => {
  cancelAnimationFrame(frameRequestId);
  resizeCanvas();
  lastFrame = performance.now();
  frameRequestId = requestAnimationFrame(animate);
});

const keyboardController = createKeyboardController({
  keysMap: Keys,
  onControlChange: setControlState,
  onQuickReset: () => {
    if (mode === Modes.PLAYING) {
      resetMission();
    }
  },
  onGoAround: () => {
    if (mode === Modes.PLAYING && !lander.landed && !lander.crashed) {
      resetMission(false);
    }
  },
});

touchControls.setCallback(setControlState);

document.getElementById("startMission").addEventListener("click", () => {
  setMode(Modes.PLAYING);
  resetMission(true);
});

const togglePadsButton = document.getElementById("togglePads");
togglePadsButton.addEventListener("click", () => togglePadGuide(togglePadsButton));

const playAgainButton = document.getElementById("playAgain");
playAgainButton.addEventListener("click", () => {
  setMode(Modes.PLAYING);
  resetMission(false);
});

document.getElementById("quitToBriefing").addEventListener("click", () => {
  setMode(Modes.INTRO);
  resetMission(true);
});

document.getElementById("shareStats").addEventListener("click", handleShare);
document.getElementById("copyStats").addEventListener("click", handleCopy);

// Function to update all translatable elements in the DOM
function updateTranslations() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    element.textContent = i18n.t(key);
  });

  // Update all elements with data-i18n-html attribute (allows HTML like <br>)
  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.getAttribute("data-i18n-html");
    element.innerHTML = i18n.t(key);
  });

  // Update toggle pads button
  togglePadsButton.textContent = showLandingPads
    ? i18n.t("buttonHideGuide")
    : i18n.t("buttonShowGuide");

  // Update page title
  document.title = i18n.t("pageTitle");

  // Force HUD update to refresh status text
  updateHud(mode === Modes.ENDED ? lander.stats.time : 
            mode === Modes.PLAYING && missionStart ? (performance.now() - missionStart) / 1000 : 0);
}

// Listen for language changes
i18n.onChange(() => {
  updateTranslations();
});

resizeCanvas();
setMode(Modes.INTRO);
togglePadsButton.textContent = i18n.t("buttonShowGuide");
// Initialize translations on load
updateTranslations();
frameRequestId = requestAnimationFrame(animate);

window.addEventListener("beforeunload", () => {
  keyboardController.dispose();
  languageSelector.dispose();
  cancelAnimationFrame(frameRequestId);
});
