(() => {
  // scripts/config/constants.js
  var PIXELS_TO_FEET = 3.5;
  var DEG = 180 / Math.PI;
  var TWO_PI = Math.PI * 2;
  var VELOCITY_MULTIPLIER = 20;
  var FRAME_INTERVAL_MS = 1e3 / 120;
  var FRAME_INTERVAL_S = FRAME_INTERVAL_MS / 1e3;
  var WORLD = Object.freeze({
    gravity: 15e-4,
    // Reduced gravity for easier testing
    mainThrust: 0.012,
    auxThrust: 55e-4,
    rotationStep: 0.01,
    fuelBurnMain: 0.092,
    fuelBurnRotate: 0.028,
    fuelBurnAux: 0.05,
    maxFuel: 100,
    crashVelocity: 0.6,
    safeAngle: 11,
    maxAltitudeTrack: 9e3,
    frameInterval: FRAME_INTERVAL_S,
    dragCoefficient: 8e-4,
    rotationDamping: 0.985,
    fuelMass: 0.4,
    emptyMass: 0.6
  });
  var Modes = Object.freeze({
    INTRO: "intro",
    PLAYING: "playing",
    ENDED: "ended"
  });
  var Keys = Object.freeze({
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
    KeyR: "goAround"
  });
  var DEFAULT_VIEW = Object.freeze({
    width: 1280,
    height: 720
  });
  var LANDING_GUIDE_LABELS = Object.freeze({
    show: "Show Landing Guide",
    hide: "Hide Landing Guide"
  });

  // scripts/utils/math.js
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function fraction(value, min, max) {
    if (max - min === 0) return 0;
    return clamp((value - min) / (max - min), 0, 1);
  }
  function normalizeAngle(angle) {
    let a = angle % TWO_PI;
    if (a > Math.PI) {
      a -= TWO_PI;
    }
    if (a < -Math.PI) {
      a += TWO_PI;
    }
    return a;
  }
  function shortestAngleBetween(a, b) {
    let delta = b - a;
    while (delta > Math.PI) delta -= TWO_PI;
    while (delta < -Math.PI) delta += TWO_PI;
    return delta;
  }
  function rotatePoint(point, angle, origin) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const x = point.x * cos - point.y * sin;
    const y = point.x * sin + point.y * cos;
    return {
      x: origin.x + x,
      y: origin.y + y
    };
  }
  function mphFromPixels(velocityUnits, multiplier = VELOCITY_MULTIPLIER) {
    return velocityUnits * multiplier;
  }

  // scripts/ui/hud.js
  function createHud({
    fuel,
    speed,
    vertical,
    horizontal,
    angle,
    altitude,
    time,
    status
  }) {
    function update({ lander: lander2, altitudeFt, missionTime, mode: mode2 }) {
      const currentSpeed = Math.hypot(lander2.velocity.x, lander2.velocity.y);
      const verticalSpeed = lander2.velocity.y;
      const horizontalSpeed = lander2.velocity.x;
      const angleDeviation = Math.abs((lander2.angle + Math.PI / 2) * DEG);
      const safeMissionTime = Number.isFinite(missionTime) ? missionTime : 0;
      const speedMph = mphFromPixels(currentSpeed);
      const crashSpeedMph = mphFromPixels(WORLD.crashVelocity);
      const speedDanger = currentSpeed > WORLD.crashVelocity * 0.7;
      const angleDanger = angleDeviation > WORLD.safeAngle * 0.7;
      const fuelCritical = lander2.fuel < 15;
      const isApproaching = altitudeFt < 300 && mode2 === Modes.PLAYING;
      fuel.textContent = `${Math.round(lander2.fuel)}%`;
      fuel.parentElement.style.color = fuelCritical ? "#ff5555" : "";
      speed.textContent = `${speedMph.toFixed(1)} mph`;
      speed.parentElement.style.color = speedDanger && isApproaching ? "#ff9944" : "";
      vertical.textContent = `${mphFromPixels(verticalSpeed).toFixed(1)} mph`;
      horizontal.textContent = `${mphFromPixels(horizontalSpeed).toFixed(1)} mph`;
      if (altitudeFt < 100) {
        altitude.textContent = `${altitudeFt.toFixed(1)} ft`;
      } else {
        altitude.textContent = `${Math.round(altitudeFt)} ft`;
      }
      altitude.parentElement.style.color = altitudeFt < 100 && isApproaching ? "#ffdd55" : "";
      angle.textContent = `${angleDeviation.toFixed(1)}\xB0`;
      angle.parentElement.style.color = angleDanger && isApproaching ? "#ff9944" : "";
      time.textContent = `${safeMissionTime.toFixed(1)} s`;
      if (lander2.landed) {
        status.textContent = "Landed";
        status.className = "success";
      } else if (lander2.crashed) {
        status.textContent = "Crashed";
        status.className = "fail";
      } else if (mode2 === Modes.PLAYING) {
        status.textContent = altitudeFt < 120 ? "Final Approach" : "In Flight";
        status.className = "";
      } else {
        status.textContent = "Standby";
        status.className = "";
      }
    }
    return { update };
  }

  // scripts/ui/instructions.js
  function createInstructionsOverlay({ overlay, checklistInputs }) {
    if (!overlay) {
      throw new Error("Instructions overlay element required");
    }
    function show() {
      overlay.classList.add("overlay--visible");
    }
    function hide() {
      overlay.classList.remove("overlay--visible");
    }
    function updateChecklist(state) {
      if (!checklistInputs) return;
      if ("engine" in state && checklistInputs.engine) {
        checklistInputs.engine.checked = state.engine;
      }
      if ("left" in state && checklistInputs.left) {
        checklistInputs.left.checked = state.left;
      }
      if ("right" in state && checklistInputs.right) {
        checklistInputs.right.checked = state.right;
      }
      if ("combo" in state && checklistInputs.combo) {
        checklistInputs.combo.checked = state.combo;
      }
    }
    return {
      show,
      hide,
      updateChecklist
    };
  }

  // scripts/ui/endOverlay.js
  function createEndOverlay({ overlay, elements }) {
    const {
      title,
      score,
      outcome,
      subtitle,
      meterSpeed,
      meterSpeedValue,
      meterAngle,
      meterAngleValue,
      time,
      fuel,
      maxSpeed,
      maxAltitude,
      flips,
      pad
    } = elements;
    function hide() {
      overlay.classList.remove("overlay--visible");
    }
    function show({
      safe,
      scoreValue,
      reason,
      contactPad,
      touchdownSpeed,
      touchdownAngle,
      stats
    }) {
      overlay.classList.add("overlay--visible");
      title.textContent = safe ? "Touchdown Confirmed" : "Vehicle Lost";
      score.textContent = Intl.NumberFormat().format(Math.round(scoreValue));
      outcome.textContent = safe ? "mission points" : "salvage rating";
      subtitle.textContent = safe ? `Telemetry nominal. ${contactPad?.id ?? "Unknown pad"} secured.` : reason || "Structural integrity failure recorded.";
      const speedMph = mphFromPixels(touchdownSpeed);
      meterSpeed.style.setProperty("--percent", `${fraction(speedMph, 0, 40) * 100}%`);
      meterSpeedValue.textContent = `${speedMph.toFixed(1)} mph`;
      const anglePercent = fraction(touchdownAngle, 0, 45);
      meterAngle.style.setProperty("--percent", `${anglePercent * 100}%`);
      meterAngleValue.textContent = `${touchdownAngle.toFixed(1)}\xB0`;
      time.textContent = `${stats.time.toFixed(1)} s`;
      fuel.textContent = `${Math.round(stats.fuel)}%`;
      maxSpeed.textContent = `${mphFromPixels(stats.maxSpeed).toFixed(1)} mph`;
      maxAltitude.textContent = `${Math.round(stats.maxAltitude)} ft`;
      flips.textContent = `${stats.flips}`;
      pad.textContent = contactPad ? `${contactPad.id} (${contactPad.difficulty})` : "No pad";
    }
    return {
      show,
      hide
    };
  }

  // scripts/ui/touchControls.js
  function createTouchControls(container) {
    const buttons = Array.from(container?.querySelectorAll("[data-control]")) ?? [];
    const pointerMap = /* @__PURE__ */ new Map();
    let callback = () => {
    };
    function setCallback(fn) {
      callback = typeof fn === "function" ? fn : () => {
      };
    }
    function handlePointerDown(event) {
      const button = event.currentTarget;
      const controlName = button.dataset.control;
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      pointerMap.set(event.pointerId, button);
      button.dataset.active = "true";
      callback(controlName, true);
    }
    function handlePointerUp(event) {
      const button = pointerMap.get(event.pointerId) || event.currentTarget;
      if (!button) return;
      const controlName = button.dataset.control;
      pointerMap.delete(event.pointerId);
      button.dataset.active = "false";
      callback(controlName, false);
    }
    buttons.forEach((button) => {
      button.addEventListener("pointerdown", handlePointerDown);
      ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
        button.addEventListener(eventName, handlePointerUp);
      });
    });
    function reset() {
      buttons.forEach((button) => {
        button.dataset.active = "false";
      });
      pointerMap.clear();
    }
    return {
      setCallback,
      reset
    };
  }

  // scripts/ui/toast.js
  function createToast(element) {
    let timeoutId = null;
    function hide() {
      element.classList.remove("toast--visible");
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
    function show(message, duration = 1600) {
      element.textContent = message;
      element.classList.add("toast--visible");
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(hide, duration);
    }
    return { show, hide };
  }

  // scripts/input/keyboard.js
  function createKeyboardController({
    keysMap,
    onControlChange,
    onQuickReset,
    onGoAround
  }) {
    const activeKeys = /* @__PURE__ */ new Set();
    function handleKeyDown(event) {
      const control = keysMap[event.code];
      if (!control) return;
      event.preventDefault();
      if (control === "quickReset") {
        if (!activeKeys.has(event.code)) {
          onQuickReset?.();
        }
        activeKeys.add(event.code);
        return;
      }
      if (control === "goAround") {
        if (!activeKeys.has(event.code)) {
          onGoAround?.();
        }
        activeKeys.add(event.code);
        return;
      }
      if (!activeKeys.has(event.code)) {
        activeKeys.add(event.code);
        onControlChange?.(control, true);
      }
    }
    function handleKeyUp(event) {
      const control = keysMap[event.code];
      if (!control) return;
      event.preventDefault();
      if (control === "quickReset" || control === "goAround") {
        activeKeys.delete(event.code);
        return;
      }
      if (activeKeys.has(event.code)) {
        activeKeys.delete(event.code);
        onControlChange?.(control, false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    function dispose() {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      activeKeys.clear();
    }
    return {
      dispose
    };
  }

  // scripts/systems/starfield.js
  var Starfield = class {
    constructor(count) {
      this.count = count;
      this.stars = [];
      this.parallax = 0;
      this.resize(1, 1);
    }
    resize(width, height) {
      this.width = width;
      this.height = height;
      this.stars = Array.from({ length: this.count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() * TWO_PI
      }));
    }
    update(dt, velocity) {
      const vy = velocity?.y ?? 0;
      this.parallax = Math.min(1, Math.abs(vy) / 120);
      this.stars.forEach((star) => {
        star.twinkle += dt * (0.8 + star.z * 1.4);
        star.y += vy * dt * star.z * 0.2;
        if (star.y > this.height) {
          star.y -= this.height;
          star.x = Math.random() * this.width;
        }
        if (star.y < 0) {
          star.y += this.height;
          star.x = Math.random() * this.width;
        }
      });
    }
    draw(ctx2) {
      ctx2.save();
      ctx2.fillStyle = "#030613";
      ctx2.fillRect(0, 0, this.width, this.height);
      this.stars.forEach((star) => {
        const size = 1.1 + star.z * 1.8;
        const alpha = 0.4 + Math.abs(Math.sin(star.twinkle)) * 0.6;
        ctx2.fillStyle = `rgba(186, 214, 255, ${alpha.toFixed(3)})`;
        ctx2.fillRect(star.x, star.y, size, size);
      });
      ctx2.restore();
    }
  };

  // scripts/utils/random.js
  function mulberry32(seed) {
    return function() {
      let t = seed += 1831565813;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // scripts/systems/terrain.js
  var Terrain = class {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.points = [];
      this.segments = [];
      this.landingPads = [];
      this.showPads = false;
      this.glowPhase = 0;
      this.generate();
    }
    generate(seed = Math.random()) {
      const rng = mulberry32(Math.floor(seed * 1e9));
      const horizon = this.height * 0.62;
      const amplitude = this.height * 0.2;
      const segments = Math.max(18, Math.round(this.width / 110));
      const step = this.width / segments;
      const basePoints = [];
      for (let i = 0; i <= segments; i++) {
        const x = i * step;
        const wave = Math.sin(i * 0.45) * amplitude * 0.35 + Math.sin(i * 1.4) * amplitude * 0.18;
        const offset = (rng() - 0.5) * amplitude;
        const y = horizon + wave + offset;
        basePoints.push({ x, y });
      }
      const padSlots = new Array(segments).fill(null);
      this.landingPads = [];
      const desiredPadCount = Math.max(2, Math.min(4, Math.floor(this.width / 360) + 1));
      let guard = 0;
      while (this.landingPads.length < desiredPadCount && guard < 40) {
        guard++;
        let start = Math.floor(rng() * (segments - 5)) + 2;
        let spanSegments = rng() > 0.6 ? 3 : 2;
        if (start + spanSegments >= segments) {
          start = segments - spanSegments - 1;
        }
        let conflict = false;
        for (let i = start - 1; i <= start + spanSegments; i++) {
          if (i >= 0 && i < padSlots.length && padSlots[i] !== null) {
            conflict = true;
            break;
          }
        }
        if (conflict) continue;
        const padY = horizon - amplitude * (0.22 + rng() * 0.18);
        const padIndex = this.landingPads.length;
        const endIndex = Math.min(start + spanSegments, segments);
        for (let idx = start; idx <= endIndex; idx++) {
          if (idx < basePoints.length) {
            basePoints[idx].y = padY;
          }
          if (idx < padSlots.length && idx < endIndex) {
            padSlots[idx] = padIndex;
          }
        }
        const pad = {
          x1: basePoints[start].x,
          x2: basePoints[endIndex].x,
          y: padY,
          id: `Pad-${padIndex + 1}`,
          difficulty: spanSegments >= 3 ? "Precision" : "Standard"
        };
        this.landingPads.push(pad);
      }
      this.points = basePoints;
      this.segments = padSlots.map(
        (padId) => padId !== null ? { type: "pad", padId } : { type: "terrain", padId: null }
      );
    }
    resize(width, height) {
      this.width = width;
      this.height = height;
      this.generate(Math.random());
    }
    setShowPads(show) {
      this.showPads = show;
    }
    draw(ctx2, landerPosition = null, landerAltitude = null) {
      ctx2.save();
      ctx2.beginPath();
      ctx2.moveTo(0, this.height);
      this.points.forEach((p) => {
        ctx2.lineTo(p.x, p.y);
      });
      ctx2.lineTo(this.width, this.height);
      ctx2.closePath();
      const gradient = ctx2.createLinearGradient(0, this.height * 0.4, 0, this.height);
      gradient.addColorStop(0, "#0b132a");
      gradient.addColorStop(1, "#05070f");
      ctx2.fillStyle = gradient;
      ctx2.fill();
      this.glowPhase += 0.03;
      this.landingPads.forEach((pad) => {
        ctx2.save();
        let isNearby = false;
        let proximity = 0;
        if (landerPosition && landerAltitude !== null) {
          const padCenterX = (pad.x1 + pad.x2) / 2;
          const horizontalDist = Math.abs(landerPosition.x - padCenterX);
          const padWidth = pad.x2 - pad.x1;
          if (horizontalDist < padWidth * 3 && landerAltitude < 500) {
            isNearby = true;
            proximity = 1 - Math.min(1, horizontalDist / (padWidth * 3) * 0.5 + landerAltitude / 500 * 0.5);
          }
        }
        if (isNearby) {
          const pulse = Math.sin(this.glowPhase) * 0.3 + 0.7;
          const glowIntensity = proximity * pulse;
          ctx2.shadowBlur = 20 * glowIntensity;
          ctx2.shadowColor = `rgba(36, 245, 161, ${0.6 * glowIntensity})`;
          ctx2.fillStyle = `rgba(36, 245, 161, ${0.15 * glowIntensity})`;
          ctx2.fillRect(pad.x1 - 10, pad.y - 20, pad.x2 - pad.x1 + 20, 30);
          ctx2.shadowBlur = 0;
        }
        ctx2.fillStyle = this.showPads ? "rgba(36, 245, 161, 0.25)" : "rgba(255, 255, 255, 0.05)";
        ctx2.fillRect(pad.x1, pad.y - 4, pad.x2 - pad.x1, 6);
        ctx2.fillStyle = "#f5f9ff";
        ctx2.fillRect(pad.x1, pad.y - 2, pad.x2 - pad.x1, 2);
        if (this.showPads) {
          ctx2.font = '12px "Share Tech Mono"';
          ctx2.fillStyle = "rgba(200, 255, 240, 0.85)";
          ctx2.fillText(pad.id, pad.x1 + 6, pad.y - 10);
        }
        ctx2.restore();
      });
      ctx2.restore();
    }
    getSurfaceAt(x) {
      if (x <= 0) {
        return {
          y: this.points[1].y,
          type: this.segments[0]?.type ?? "terrain",
          padId: this.segments[0]?.padId ?? null
        };
      }
      if (x >= this.width) {
        const last2 = this.points.length - 1;
        return {
          y: this.points[last2].y,
          type: this.segments[last2 - 1]?.type ?? "terrain",
          padId: this.segments[last2 - 1]?.padId ?? null
        };
      }
      for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i + 1];
        if (x >= p1.x && x <= p2.x) {
          const t = (x - p1.x) / Math.max(1e-6, p2.x - p1.x);
          const y = p1.y + (p2.y - p1.y) * t;
          return {
            y,
            type: this.segments[i]?.type ?? "terrain",
            padId: this.segments[i]?.padId ?? null,
            slope: Math.atan2(p2.y - p1.y, p2.x - p1.x)
          };
        }
      }
      const last = this.points.length - 1;
      return { y: this.points[last].y, type: "terrain", padId: null };
    }
    getPad(padId) {
      return this.landingPads[padId] ?? null;
    }
  };

  // scripts/systems/particleSystem.js
  var ParticleSystem = class {
    constructor() {
      this.particles = [];
    }
    spawn(x, y, angle, spread, power) {
      const count = Math.round(2 + Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const speed = power * (0.4 + Math.random() * 0.6);
        this.particles.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          life: 0.25 + Math.random() * 0.2,
          age: 0,
          size: 4 + Math.random() * 4,
          core: 1 + Math.random() * 1.6,
          hue: 28 + Math.random() * 18,
          spark: Math.random() > 0.65,
          opacity: 1,
          type: "engine"
        });
      }
    }
    spawnDust(x, y, count = 10) {
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 1.5 + (Math.random() - 0.5) * Math.PI * 0.6;
        const speed = 10 + Math.random() * 30;
        this.particles.push({
          x: x + (Math.random() - 0.5) * 40,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.8 + Math.random() * 0.6,
          age: 0,
          size: 3 + Math.random() * 5,
          core: 0.5,
          hue: 30,
          spark: false,
          opacity: 0.6,
          type: "dust"
        });
      }
    }
    update(dt) {
      this.particles = this.particles.filter((p) => {
        p.age += dt;
        if (p.age >= p.life) {
          return false;
        }
        const t = p.age / p.life;
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.opacity = 1 - t;
        return true;
      });
    }
    draw(ctx2, sprites = null) {
      if (this.particles.length === 0) return;
      ctx2.save();
      this.particles.forEach((p) => {
        const progress = Math.min(1, p.age / p.life);
        const radius = p.size * (0.65 + (1 - progress) * 0.6);
        const coreRadius = Math.max(0.4, p.core * (1 - progress * 0.4));
        if (sprites) {
          const sprite = p.type === "dust" ? sprites.dustSprite : sprites.particleSprite;
          if (sprite) {
            ctx2.globalAlpha = p.opacity * (1 - progress);
            ctx2.save();
            ctx2.translate(p.x, p.y);
            const scale = radius / (sprite.width / 2);
            ctx2.drawImage(sprite, -sprite.width * scale / 2, -sprite.height * scale / 2, sprite.width * scale, sprite.height * scale);
            ctx2.restore();
            ctx2.globalAlpha = 1;
            return;
          }
        }
        if (p.type === "dust") {
          ctx2.globalCompositeOperation = "source-over";
          const gradient = ctx2.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          const innerAlpha = Math.max(0, p.opacity * (1 - progress)).toFixed(3);
          gradient.addColorStop(0, `rgba(180, 160, 140, ${innerAlpha})`);
          gradient.addColorStop(0.5, `rgba(140, 120, 100, ${innerAlpha * 0.5})`);
          gradient.addColorStop(1, `rgba(100, 80, 60, 0)`);
          ctx2.fillStyle = gradient;
          ctx2.beginPath();
          ctx2.arc(p.x, p.y, radius, 0, TWO_PI);
          ctx2.fill();
        } else {
          ctx2.globalCompositeOperation = "lighter";
          const gradient = ctx2.createRadialGradient(p.x, p.y, coreRadius, p.x, p.y, radius);
          const innerAlpha = Math.min(1, p.opacity).toFixed(3);
          const midAlpha = Math.max(0, p.opacity * 0.6).toFixed(3);
          gradient.addColorStop(0, `hsla(${p.hue}, 100%, 95%, ${innerAlpha})`);
          gradient.addColorStop(0.35, `hsla(${p.hue + 8}, 100%, 65%, ${midAlpha})`);
          gradient.addColorStop(1, `hsla(${p.hue + 18}, 100%, 50%, 0)`);
          ctx2.fillStyle = gradient;
          ctx2.beginPath();
          ctx2.arc(p.x, p.y, radius, 0, TWO_PI);
          ctx2.fill();
          if (p.spark) {
            ctx2.fillStyle = `hsla(${p.hue}, 100%, 92%, ${Math.max(0, p.opacity - 0.2).toFixed(3)})`;
            ctx2.beginPath();
            ctx2.arc(p.x, p.y, coreRadius * 0.6, 0, TWO_PI);
            ctx2.fill();
          }
        }
      });
      ctx2.restore();
    }
    reset() {
      this.particles = [];
    }
  };

  // scripts/systems/debrisField.js
  var DebrisField = class {
    constructor() {
      this.shards = [];
    }
    explode(origin, color = "#ff9f4d") {
      const count = 14 + Math.floor(Math.random() * 22);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * TWO_PI;
        const speed = 40 + Math.random() * 80;
        this.shards.push({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rotation: Math.random() * TWO_PI,
          vr: (Math.random() - 0.5) * 12,
          life: 1.2 + Math.random() * 0.6,
          age: 0,
          size: 3 + Math.random() * 6,
          color
        });
      }
    }
    update(dt) {
      this.shards = this.shards.filter((s) => {
        s.age += dt;
        if (s.age > s.life) {
          return false;
        }
        s.vy += WORLD.gravity * 0.4 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rotation += s.vr * dt;
        return true;
      });
    }
    draw(ctx2) {
      if (this.shards.length === 0) return;
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      this.shards.forEach((s) => {
        const alpha = 1 - s.age / s.life;
        ctx2.save();
        ctx2.translate(s.x, s.y);
        ctx2.rotate(s.rotation);
        ctx2.fillStyle = `rgba(255, 140, 90, ${alpha.toFixed(3)})`;
        ctx2.fillRect(-s.size * 0.5, -s.size * 0.5, s.size, s.size * 1.4);
        ctx2.restore();
      });
      ctx2.restore();
    }
    reset() {
      this.shards = [];
    }
  };

  // scripts/config/tuning.js
  var clamp2 = (value, min, max) => Math.max(min, Math.min(max, value));
  var physicsSettings = {
    thrustFactor: 0.3,
    // Reduced thrust for easier testing
    massFactor: 1
  };
  function setThrustFactor(value) {
    physicsSettings.thrustFactor = clamp2(value, 0.2, 2.5);
  }
  function setMassFactor(value) {
    physicsSettings.massFactor = clamp2(value, 0.2, 3);
  }
  function getEffectiveThrust() {
    return WORLD.mainThrust * physicsSettings.thrustFactor;
  }
  function getEffectiveMass() {
    return physicsSettings.massFactor;
  }

  // scripts/entities/lander.js
  var Lander = class {
    constructor() {
      this.width = 34;
      this.height = 46;
      this.legSpread = 30;
      this.rotationVelocity = 0;
      this.angularMomentum = 0;
      this.leftThrusterActive = false;
      this.rightThrusterActive = false;
      this.thrustPhase = 0;
      this.legDeploy = 0;
      this.auxThrusting = false;
      this.altitudeFt = Number.POSITIVE_INFINITY;
      this.reset(1280, 720);
    }
    reset(viewWidth2, viewHeight2) {
      const randomBetween = (min, max) => min + Math.random() * (max - min);
      const width = viewWidth2 ?? 1280;
      const startX = width * 0.33;
      const endX = width * 0.66;
      const velocityRange = WORLD.mainThrust * (width / 10);
      this.position = {
        x: randomBetween(startX, endX),
        y: this.height * 2
      };
      this.velocity = {
        x: randomBetween(-velocityRange, velocityRange),
        y: randomBetween(0, velocityRange)
      };
      this.angle = normalizeAngle(randomBetween(-Math.PI * 0.6, -Math.PI * 0.4));
      this.fuel = WORLD.maxFuel;
      this.landed = false;
      this.crashed = false;
      this.struck = false;
      this.contactPad = null;
      this.thrusting = false;
      this.leftThrusterActive = false;
      this.rightThrusterActive = false;
      this.rotationVelocity = randomBetween(-0.2, 0.2);
      this.angularMomentum = 0;
      this.thrustPhase = Math.random() * TWO_PI;
      this.legDeploy = 0;
      this.auxThrusting = false;
      this.altitudeFt = Number.POSITIVE_INFINITY;
      this.stats = {
        time: 0,
        maxSpeed: 0,
        maxAltitude: 0,
        flips: 0,
        rotationAccumulator: 0,
        touchdownSpeed: 0,
        touchdownAngle: 0,
        horizontalSpeed: 0,
        verticalSpeed: 0
      };
    }
    applyInput(inputState2, dt) {
      this.leftThrusterActive = false;
      this.rightThrusterActive = false;
      this.auxThrusting = false;
      if (this.landed || this.crashed) {
        this.thrusting = false;
        return;
      }
      const deltaMultiplier = dt > 0 ? dt / WORLD.frameInterval : 0;
      if (!Number.isFinite(deltaMultiplier) || deltaMultiplier <= 0) {
        this.thrusting = false;
        return;
      }
      const altitudeFeet = Number.isFinite(this.altitudeFt) ? this.altitudeFt : Number.POSITIVE_INFINITY;
      const deployThreshold = 420;
      const retractThreshold = deployThreshold * 1.5;
      const wantsDeploy = altitudeFeet <= deployThreshold && (inputState2.thrust || inputState2.rotateLeft || inputState2.rotateRight);
      if (wantsDeploy) {
        this.legDeploy = Math.min(1, this.legDeploy + deltaMultiplier * 0.12);
      } else if (altitudeFeet > retractThreshold && !this.landed) {
        this.legDeploy = Math.max(0, this.legDeploy - deltaMultiplier * 0.06);
      }
      const currentMass = this.getCurrentMass();
      const effectiveThrust = getEffectiveThrust();
      const effectiveMass = Math.max(0.2, getEffectiveMass()) * currentMass;
      const thrustPower = effectiveThrust / effectiveMass;
      const auxPower = WORLD.auxThrust / effectiveMass;
      if (inputState2.thrust && this.fuel > 0) {
        const thrustAngle = this.angle;
        const thrustAccelX = thrustPower * Math.cos(thrustAngle);
        const thrustAccelY = thrustPower * Math.sin(thrustAngle);
        this.velocity.x += deltaMultiplier * thrustAccelX;
        this.velocity.y += deltaMultiplier * thrustAccelY;
        this.fuel = Math.max(
          0,
          this.fuel - WORLD.fuelBurnMain * deltaMultiplier
        );
        this.thrusting = true;
      } else {
        this.thrusting = false;
      }
      if (inputState2.auxThrust && this.fuel > 0) {
        this.velocity.x += deltaMultiplier * auxPower * Math.cos(this.angle);
        this.velocity.y += deltaMultiplier * auxPower * Math.sin(this.angle);
        this.fuel = Math.max(
          0,
          this.fuel - WORLD.fuelBurnAux * deltaMultiplier
        );
        this.auxThrusting = true;
      }
      const momentOfInertia = currentMass * (this.width * this.width + this.height * this.height) / 12;
      let rotationInput = 0;
      if (inputState2.rotateLeft && this.fuel > 0) {
        rotationInput -= 1;
        this.rightThrusterActive = true;
      }
      if (inputState2.rotateRight && this.fuel > 0) {
        rotationInput += 1;
        this.leftThrusterActive = true;
      }
      if (rotationInput !== 0) {
        const torque = rotationInput * WORLD.rotationStep * 100;
        this.angularMomentum += torque * deltaMultiplier;
        if (this.fuel > 0) {
          this.fuel = Math.max(
            0,
            this.fuel - WORLD.fuelBurnRotate * deltaMultiplier
          );
        }
      }
      this.rotationVelocity = this.angularMomentum / momentOfInertia;
    }
    integrate(dt, bounds) {
      if (this.landed || this.crashed) {
        return;
      }
      const deltaMultiplier = dt > 0 ? dt / WORLD.frameInterval : 0;
      if (!Number.isFinite(deltaMultiplier) || deltaMultiplier <= 0) {
        return;
      }
      const currentMass = this.getCurrentMass();
      this.velocity.y += deltaMultiplier * WORLD.gravity;
      const speed = Math.hypot(this.velocity.x, this.velocity.y);
      if (speed > 0) {
        const dragForce = WORLD.dragCoefficient * speed * speed;
        const dragAcceleration = dragForce / currentMass;
        const dragX = this.velocity.x / speed * dragAcceleration;
        const dragY = this.velocity.y / speed * dragAcceleration;
        this.velocity.x -= dragX * deltaMultiplier;
        this.velocity.y -= dragY * deltaMultiplier;
      }
      this.position.x += this.velocity.x * deltaMultiplier;
      this.position.y += this.velocity.y * deltaMultiplier;
      const boundWidth = bounds?.width ?? 1280;
      if (boundWidth > 0) {
        this.position.x = (this.position.x % boundWidth + boundWidth) % boundWidth;
      }
      const minY = -((bounds?.height ?? 720) * 2);
      if (this.position.y < minY) {
        this.position.y = minY;
        if (this.velocity.y < 0) {
          this.velocity.y = 0;
        }
      }
      this.angularMomentum *= Math.pow(WORLD.rotationDamping, deltaMultiplier);
      this.rotationVelocity *= Math.pow(WORLD.rotationDamping, deltaMultiplier);
      const angleBefore = this.angle;
      this.angle = normalizeAngle(
        this.angle + deltaMultiplier * (this.rotationVelocity * (Math.PI / 180))
      );
      const deltaAngle = shortestAngleBetween(angleBefore, this.angle);
      this.stats.rotationAccumulator += deltaAngle;
      const fullRotations = Math.trunc(
        Math.abs(this.stats.rotationAccumulator) / TWO_PI
      );
      if (fullRotations > 0) {
        this.stats.flips += fullRotations;
        this.stats.rotationAccumulator %= TWO_PI * Math.sign(this.stats.rotationAccumulator);
      }
      const deltaTime = Math.max(0, dt);
      this.thrustPhase = (this.thrustPhase + deltaTime * 6) % TWO_PI;
    }
    updateStats(dt, terrain2) {
      if (this.landed || this.crashed) {
        return;
      }
      this.stats.time += dt;
      const speed = Math.hypot(this.velocity.x, this.velocity.y);
      this.stats.maxSpeed = Math.max(this.stats.maxSpeed, speed);
      const base = terrain2.getSurfaceAt(this.position.x);
      const altitudePx = base.y - this.position.y;
      const altitudeFt = Math.max(0, altitudePx * PIXELS_TO_FEET);
      this.altitudeFt = altitudeFt;
      this.stats.maxAltitude = Math.min(
        WORLD.maxAltitudeTrack,
        Math.max(this.stats.maxAltitude, altitudeFt)
      );
    }
    captureTouchdown(terrain2, contactInfo) {
      this.stats.touchdownSpeed = Math.hypot(
        this.velocity.x,
        this.velocity.y
      );
      this.stats.horizontalSpeed = Math.abs(this.velocity.x);
      this.stats.verticalSpeed = Math.abs(this.velocity.y);
      const desired = -Math.PI / 2;
      const deviation = Math.abs((this.angle - desired) * DEG);
      this.stats.touchdownAngle = deviation;
      if (contactInfo?.padId != null) {
        this.contactPad = terrain2.getPad(contactInfo.padId);
      }
      this.legDeploy = 1;
    }
    getAltitude(terrain2) {
      const base = terrain2.getSurfaceAt(this.position.x);
      const altitudePx = base.y - this.position.y;
      return Math.max(0, altitudePx * PIXELS_TO_FEET);
    }
    getFootPositions() {
      const offsets = [
        { x: -this.legSpread * 0.5, y: this.height * 0.5 },
        { x: this.legSpread * 0.5, y: this.height * 0.5 }
      ];
      return offsets.map((offset) => rotatePoint(offset, this.angle, this.position));
    }
    getNozzlePosition() {
      const offset = { x: 0, y: this.height * 0.55 };
      return rotatePoint(offset, this.angle, this.position);
    }
    getCurrentMass() {
      const fuelRatio = this.fuel / WORLD.maxFuel;
      return WORLD.emptyMass + WORLD.fuelMass * fuelRatio;
    }
    draw(ctx2, particles2, sprite = null) {
      ctx2.save();
      ctx2.translate(this.position.x, this.position.y);
      ctx2.rotate(this.angle + Math.PI / 2);
      if (sprite) {
        const scale = Math.max(this.width / sprite.width, this.height / sprite.height);
        const drawWidth = sprite.width * scale;
        const drawHeight = sprite.height * scale;
        ctx2.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        const baseY2 = this.height * 0.5;
        const phase2 = this.thrustPhase ?? 0;
        const fuelRatio2 = this.fuel / WORLD.maxFuel;
        const pulse2 = 0.85 + Math.sin(phase2 * 2) * 0.2;
        if (this.thrusting && this.fuel > 0) {
          const flameWidth = this.width * (0.38 + 0.14 * pulse2);
          const flameLength = this.height * (1 + 0.6 * fuelRatio2) * pulse2;
          const flameBaseY = baseY2;
          const flameGradient = ctx2.createLinearGradient(0, flameBaseY, 0, flameBaseY + flameLength);
          flameGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          flameGradient.addColorStop(0.25, "rgba(255, 230, 150, 0.92)");
          flameGradient.addColorStop(0.6, "rgba(255, 140, 50, 0.78)");
          flameGradient.addColorStop(1, "rgba(160, 40, 0, 0)");
          ctx2.fillStyle = flameGradient;
          ctx2.beginPath();
          ctx2.moveTo(-flameWidth * 0.5, flameBaseY);
          ctx2.quadraticCurveTo(-flameWidth * 0.2, flameBaseY + flameLength * 0.25, 0, flameBaseY + flameLength);
          ctx2.quadraticCurveTo(flameWidth * 0.2, flameBaseY + flameLength * 0.25, flameWidth * 0.5, flameBaseY);
          ctx2.closePath();
          ctx2.fill();
          if (particles2) {
            const nozzleWorld = this.getNozzlePosition();
            particles2.spawn(
              nozzleWorld.x,
              nozzleWorld.y,
              this.angle + Math.PI,
              Math.PI * 0.3,
              90 + pulse2 * 40
            );
          }
        }
        if (this.auxThrusting && this.fuel > 0) {
          const auxFuel = this.fuel / WORLD.maxFuel;
          const auxWidth = this.width * 0.28;
          const auxLength = this.height * (0.55 + auxFuel * 0.25);
          const flameBaseY = baseY2;
          const auxGradient = ctx2.createLinearGradient(
            0,
            flameBaseY,
            0,
            flameBaseY + auxLength
          );
          auxGradient.addColorStop(0, "rgba(255, 255, 255, 0.85)");
          auxGradient.addColorStop(0.25, "rgba(210, 230, 255, 0.8)");
          auxGradient.addColorStop(0.7, "rgba(120, 160, 255, 0.55)");
          auxGradient.addColorStop(1, "rgba(80, 120, 220, 0)");
          ctx2.fillStyle = auxGradient;
          ctx2.beginPath();
          ctx2.moveTo(-auxWidth * 0.45, flameBaseY);
          ctx2.quadraticCurveTo(0, flameBaseY + auxLength * 0.4, auxWidth * 0.45, flameBaseY);
          ctx2.lineTo(0, flameBaseY + auxLength);
          ctx2.closePath();
          ctx2.fill();
          if (particles2) {
            const nozzleWorld = this.getNozzlePosition();
            particles2.spawn(
              nozzleWorld.x,
              nozzleWorld.y,
              this.angle + Math.PI,
              Math.PI * 0.22,
              55
            );
          }
        }
        ctx2.restore();
        return;
      }
      const bodyHeight = this.height * 0.9;
      const bodyWidth = this.width * 0.62;
      const baseY = this.height * 0.5;
      const hullGradient = ctx2.createLinearGradient(0, -bodyHeight * 0.9, 0, bodyHeight * 0.6);
      hullGradient.addColorStop(0, "rgba(230, 240, 255, 0.96)");
      hullGradient.addColorStop(0.5, "rgba(140, 170, 235, 0.97)");
      hullGradient.addColorStop(1, "rgba(55, 80, 150, 0.98)");
      ctx2.fillStyle = hullGradient;
      ctx2.beginPath();
      ctx2.moveTo(0, -bodyHeight);
      ctx2.quadraticCurveTo(bodyWidth * 0.55, -bodyHeight * 0.35, bodyWidth * 0.46, bodyHeight * 0.42);
      ctx2.lineTo(-bodyWidth * 0.46, bodyHeight * 0.42);
      ctx2.quadraticCurveTo(-bodyWidth * 0.55, -bodyHeight * 0.35, 0, -bodyHeight);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx2.fillRect(-bodyWidth * 0.1, -bodyHeight * 0.45, bodyWidth * 0.2, bodyHeight * 0.84);
      ctx2.fillStyle = "rgba(255, 95, 125, 0.35)";
      ctx2.fillRect(-bodyWidth * 0.5, -bodyHeight * 0.08, bodyWidth, bodyHeight * 0.1);
      const podGradient = ctx2.createLinearGradient(0, -bodyHeight * 0.4, 0, bodyHeight * 0.5);
      podGradient.addColorStop(0, "rgba(190, 210, 255, 0.9)");
      podGradient.addColorStop(1, "rgba(90, 120, 200, 0.95)");
      ctx2.fillStyle = podGradient;
      ctx2.beginPath();
      ctx2.moveTo(bodyWidth * 0.72, -bodyHeight * 0.25);
      ctx2.quadraticCurveTo(bodyWidth * 1.05, 0, bodyWidth * 0.78, bodyHeight * 0.45);
      ctx2.lineTo(bodyWidth * 0.55, bodyHeight * 0.38);
      ctx2.closePath();
      ctx2.fill();
      ctx2.beginPath();
      ctx2.moveTo(-bodyWidth * 0.72, -bodyHeight * 0.25);
      ctx2.quadraticCurveTo(-bodyWidth * 1.05, 0, -bodyWidth * 0.78, bodyHeight * 0.45);
      ctx2.lineTo(-bodyWidth * 0.55, bodyHeight * 0.38);
      ctx2.closePath();
      ctx2.fill();
      const windowGradient = ctx2.createRadialGradient(0, -bodyHeight * 0.35, this.width * 0.05, 0, -bodyHeight * 0.35, this.width * 0.28);
      windowGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      windowGradient.addColorStop(0.35, "rgba(120, 200, 255, 0.9)");
      windowGradient.addColorStop(1, "rgba(40, 90, 160, 0.85)");
      ctx2.fillStyle = windowGradient;
      ctx2.beginPath();
      ctx2.arc(0, -bodyHeight * 0.35, this.width * 0.26, 0, TWO_PI);
      ctx2.fill();
      ctx2.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx2.beginPath();
      ctx2.moveTo(-bodyWidth * 0.42, bodyHeight * 0.05);
      ctx2.lineTo(bodyWidth * 0.42, bodyHeight * 0.05);
      ctx2.lineTo(bodyWidth * 0.35, bodyHeight * 0.32);
      ctx2.lineTo(-bodyWidth * 0.35, bodyHeight * 0.32);
      ctx2.closePath();
      ctx2.fill();
      const bellGradient = ctx2.createLinearGradient(0, bodyHeight * 0.28, 0, bodyHeight * 0.65);
      bellGradient.addColorStop(0, "rgba(60, 80, 140, 0.95)");
      bellGradient.addColorStop(1, "rgba(20, 30, 70, 0.9)");
      ctx2.fillStyle = bellGradient;
      ctx2.beginPath();
      ctx2.moveTo(-bodyWidth * 0.45, bodyHeight * 0.28);
      ctx2.lineTo(bodyWidth * 0.45, bodyHeight * 0.28);
      ctx2.quadraticCurveTo(bodyWidth * 0.55, bodyHeight * 0.65, bodyWidth * 0.25, bodyHeight * 0.7);
      ctx2.lineTo(-bodyWidth * 0.25, bodyHeight * 0.7);
      ctx2.quadraticCurveTo(-bodyWidth * 0.55, bodyHeight * 0.65, -bodyWidth * 0.45, bodyHeight * 0.28);
      ctx2.closePath();
      ctx2.fill();
      const deploy = Math.min(1, this.legDeploy);
      const legAngle = Math.PI / 4 * deploy;
      const legLength = this.height * (0.42 + 0.1 * deploy);
      const footOffset = this.width * 0.22 + deploy * this.width * 0.18;
      const footWidth = this.width * (0.3 + 0.1 * deploy);
      const drawLeg = (side) => {
        const direction = side > 0 ? 1 : -1;
        const baseX = this.width * 0.45 * direction;
        const baseY2 = bodyHeight * 0.22;
        const tipX = baseX + direction * Math.cos(legAngle) * legLength;
        const tipY = baseY2 + Math.sin(legAngle) * legLength;
        ctx2.strokeStyle = "rgba(200, 220, 255, 0.9)";
        ctx2.lineWidth = 3;
        ctx2.beginPath();
        ctx2.moveTo(baseX, baseY2);
        ctx2.lineTo(
          baseX + direction * Math.cos(legAngle * 0.6) * legLength * 0.55,
          baseY2 + Math.sin(legAngle * 0.6) * legLength * 0.55
        );
        ctx2.lineTo(tipX, tipY);
        ctx2.stroke();
        ctx2.fillStyle = "rgba(160, 200, 255, 0.58)";
        ctx2.save();
        ctx2.translate(tipX, tipY);
        ctx2.rotate(direction === 1 ? legAngle * 0.6 : -legAngle * 0.6);
        ctx2.beginPath();
        ctx2.ellipse(0, 0, footWidth * 0.6, this.width * 0.06 + deploy * 2, 0, 0, TWO_PI);
        ctx2.fill();
        ctx2.restore();
      };
      drawLeg(1);
      drawLeg(-1);
      const phase = this.thrustPhase ?? 0;
      const fuelRatio = this.fuel / WORLD.maxFuel;
      const pulse = 0.85 + Math.sin(phase * 2) * 0.2;
      if (this.thrusting && this.fuel > 0) {
        const flameWidth = this.width * (0.38 + 0.14 * pulse);
        const flameLength = this.height * (1 + 0.6 * fuelRatio) * pulse;
        const flameBaseY = baseY;
        ctx2.save();
        ctx2.globalCompositeOperation = "lighter";
        ctx2.globalAlpha = 0.35 * (0.5 + fuelRatio * 0.5);
        ctx2.beginPath();
        ctx2.ellipse(0, flameBaseY + flameLength * 0.45, flameWidth * 0.95, flameLength * 0.55, 0, 0, TWO_PI);
        ctx2.fillStyle = "rgba(120, 170, 255, 0.9)";
        ctx2.fill();
        ctx2.restore();
        const flameGradient = ctx2.createLinearGradient(0, flameBaseY, 0, flameBaseY + flameLength);
        flameGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        flameGradient.addColorStop(0.25, "rgba(255, 230, 150, 0.92)");
        flameGradient.addColorStop(0.6, "rgba(255, 140, 50, 0.78)");
        flameGradient.addColorStop(1, "rgba(160, 40, 0, 0)");
        ctx2.fillStyle = flameGradient;
        ctx2.beginPath();
        ctx2.moveTo(-flameWidth * 0.5, flameBaseY);
        ctx2.quadraticCurveTo(-flameWidth * 0.2, flameBaseY + flameLength * 0.25, 0, flameBaseY + flameLength);
        ctx2.quadraticCurveTo(flameWidth * 0.2, flameBaseY + flameLength * 0.25, flameWidth * 0.5, flameBaseY);
        ctx2.closePath();
        ctx2.fill();
        const coreGradient = ctx2.createLinearGradient(0, flameBaseY, 0, flameBaseY + flameLength * 0.7);
        coreGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        coreGradient.addColorStop(1, "rgba(255, 190, 120, 0.75)");
        const coreWidth = flameWidth * 0.32;
        const coreLength = flameLength * 0.6;
        ctx2.fillStyle = coreGradient;
        ctx2.beginPath();
        ctx2.moveTo(-coreWidth * 0.5, flameBaseY + coreLength * 0.05);
        ctx2.quadraticCurveTo(0, flameBaseY + coreLength * 0.35, coreWidth * 0.5, flameBaseY + coreLength * 0.05);
        ctx2.lineTo(0, flameBaseY + coreLength);
        ctx2.closePath();
        ctx2.fill();
        if (particles2) {
          const nozzleWorld = this.getNozzlePosition();
          particles2.spawn(
            nozzleWorld.x,
            nozzleWorld.y,
            this.angle + Math.PI,
            Math.PI * 0.3,
            90 + pulse * 40
          );
        }
      }
      if (this.auxThrusting && this.fuel > 0) {
        const auxFuel = this.fuel / WORLD.maxFuel;
        const auxWidth = this.width * 0.28;
        const auxLength = this.height * (0.55 + auxFuel * 0.25);
        const flameBaseY = baseY;
        ctx2.save();
        ctx2.globalCompositeOperation = "lighter";
        ctx2.globalAlpha = this.thrusting ? 0.45 : 0.75;
        ctx2.beginPath();
        ctx2.ellipse(
          0,
          flameBaseY + auxLength * 0.6,
          auxWidth * 0.75,
          auxLength * 0.65,
          0,
          0,
          TWO_PI
        );
        ctx2.fillStyle = "rgba(120, 190, 255, 0.8)";
        ctx2.fill();
        ctx2.restore();
        const auxGradient = ctx2.createLinearGradient(
          0,
          flameBaseY,
          0,
          flameBaseY + auxLength
        );
        auxGradient.addColorStop(0, "rgba(255, 255, 255, 0.85)");
        auxGradient.addColorStop(0.25, "rgba(210, 230, 255, 0.8)");
        auxGradient.addColorStop(0.7, "rgba(120, 160, 255, 0.55)");
        auxGradient.addColorStop(1, "rgba(80, 120, 220, 0)");
        ctx2.fillStyle = auxGradient;
        ctx2.beginPath();
        ctx2.moveTo(-auxWidth * 0.45, flameBaseY);
        ctx2.quadraticCurveTo(0, flameBaseY + auxLength * 0.4, auxWidth * 0.45, flameBaseY);
        ctx2.lineTo(0, flameBaseY + auxLength);
        ctx2.closePath();
        ctx2.fill();
        if (particles2) {
          const nozzleWorld = this.getNozzlePosition();
          particles2.spawn(
            nozzleWorld.x,
            nozzleWorld.y,
            this.angle + Math.PI,
            Math.PI * 0.22,
            55
          );
        }
      }
      const drawSideThruster = (offsetX, isActive) => {
        if (!isActive) return;
        const sideLength = this.height * 0.35;
        const sideWidth = this.width * 0.16;
        const sideBaseY = -this.height * 0.05;
        ctx2.save();
        ctx2.translate(offsetX, sideBaseY);
        ctx2.rotate(offsetX > 0 ? Math.PI / 2.2 : -Math.PI / 2.2);
        const sideGradient = ctx2.createLinearGradient(0, 0, 0, sideLength);
        sideGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        sideGradient.addColorStop(0.3, "rgba(255, 220, 150, 0.85)");
        sideGradient.addColorStop(1, "rgba(200, 80, 0, 0)");
        ctx2.fillStyle = sideGradient;
        ctx2.beginPath();
        ctx2.moveTo(-sideWidth * 0.4, 0);
        ctx2.quadraticCurveTo(0, sideLength * 0.4, sideWidth * 0.4, 0);
        ctx2.lineTo(0, sideLength);
        ctx2.closePath();
        ctx2.fill();
        ctx2.restore();
      };
      drawSideThruster(bodyWidth * 0.78, this.rightThrusterActive);
      drawSideThruster(-bodyWidth * 0.78, this.leftThrusterActive);
      ctx2.restore();
    }
  };

  // scripts/scoring/mission.js
  function computeScore({ landed, fuel, speed, angle, time, flips }) {
    const base = landed ? 1500 : 200;
    const fuelBonus = fuel * 4;
    const speedPenalty = Math.pow(mphFromPixels(speed), 1.4) * 2.2;
    const anglePenalty = Math.pow(angle, 1.2) * 3.2;
    const timePenalty = Math.max(0, time - 20) * 6;
    const flipBonus = flips * 120;
    const score = base + fuelBonus + flipBonus - speedPenalty - anglePenalty - timePenalty;
    return Math.max(0, score);
  }
  function formatMissionSummary({
    safe,
    score,
    outcomeLabel,
    stats,
    touchdown,
    padLabel,
    playUrl
  }) {
    const lines = [];
    lines.push(
      `Mission ${safe ? "Success" : "Failure"} | Score: ${score} ${outcomeLabel}`
    );
    lines.push(`Time: ${stats.time}`);
    lines.push(`Fuel Remaining: ${stats.fuel}`);
    lines.push(`Max Speed: ${stats.maxSpeed}`);
    lines.push(`Max Altitude: ${stats.maxAltitude}`);
    lines.push(`Flips: ${stats.flips}`);
    lines.push(`Landing Pad: ${padLabel}`);
    lines.push(`Touchdown Speed: ${touchdown.speed}`);
    lines.push(`Touchdown Angle: ${touchdown.angle}`);
    if (playUrl) {
      lines.push(`Play at: ${playUrl}`);
    } else {
      lines.push("Play again soon!");
    }
    return lines.join("\n");
  }

  // scripts/ui/physicsControls.js
  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }
  function formatMultiplier(value) {
    return `${value.toFixed(1)}x`;
  }
  function createPhysicsControls({
    container,
    thrustInput,
    thrustLabel,
    massInput,
    massLabel
  }) {
    if (!container || !thrustInput || !massInput) {
      throw new Error("Physics controls require container and inputs");
    }
    function updateThrust(value) {
      const numeric = Number.parseFloat(value);
      setThrustFactor(numeric);
      if (thrustLabel) {
        thrustLabel.textContent = formatPercent(numeric);
      }
    }
    function updateMass(value) {
      const numeric = Number.parseFloat(value);
      setMassFactor(numeric);
      if (massLabel) {
        massLabel.textContent = formatMultiplier(numeric);
      }
    }
    thrustInput.addEventListener("input", (event) => {
      updateThrust(event.target.value);
    });
    massInput.addEventListener("input", (event) => {
      updateMass(event.target.value);
    });
    updateThrust(thrustInput.value);
    updateMass(massInput.value);
    function getSettings() {
      return { ...physicsSettings };
    }
    return {
      getSettings,
      updateThrust,
      updateMass
    };
  }

  // scripts/ui/approachIndicator.js
  function createApproachIndicator(canvas2) {
    return {
      draw(ctx2, lander2, terrain2, viewHeight2) {
        const altitude = lander2.getAltitude(terrain2);
        if (altitude > 400 || lander2.landed || lander2.crashed) {
          return;
        }
        ctx2.save();
        const surface = terrain2.getSurfaceAt(lander2.position.x);
        const isPad = surface.type === "pad";
        if (isPad) {
          const pad = terrain2.getPad(surface.padId);
          if (pad) {
            const zoneWidth = pad.x2 - pad.x1;
            const zoneLeft = pad.x1;
            const zoneRight = pad.x2;
            ctx2.strokeStyle = "rgba(36, 245, 161, 0.4)";
            ctx2.lineWidth = 2;
            ctx2.setLineDash([5, 5]);
            ctx2.beginPath();
            ctx2.moveTo(zoneLeft, surface.y);
            ctx2.lineTo(zoneLeft, surface.y - 300);
            ctx2.moveTo(zoneRight, surface.y);
            ctx2.lineTo(zoneRight, surface.y - 300);
            ctx2.stroke();
            ctx2.setLineDash([]);
            const targetX = (zoneLeft + zoneRight) / 2;
            ctx2.strokeStyle = "rgba(36, 245, 161, 0.6)";
            ctx2.lineWidth = 2;
            ctx2.beginPath();
            ctx2.arc(targetX, surface.y - 10, 8, 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.beginPath();
            ctx2.moveTo(targetX - 12, surface.y - 10);
            ctx2.lineTo(targetX + 12, surface.y - 10);
            ctx2.moveTo(targetX, surface.y - 22);
            ctx2.lineTo(targetX, surface.y + 2);
            ctx2.stroke();
          }
        }
        const vectorScale = 30;
        const velocityEndX = lander2.position.x + lander2.velocity.x * vectorScale;
        const velocityEndY = lander2.position.y + lander2.velocity.y * vectorScale;
        ctx2.strokeStyle = "rgba(255, 200, 50, 0.8)";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.moveTo(lander2.position.x, lander2.position.y);
        ctx2.lineTo(velocityEndX, velocityEndY);
        ctx2.stroke();
        const angle = Math.atan2(lander2.velocity.y, lander2.velocity.x);
        const arrowSize = 8;
        ctx2.fillStyle = "rgba(255, 200, 50, 0.8)";
        ctx2.beginPath();
        ctx2.moveTo(velocityEndX, velocityEndY);
        ctx2.lineTo(
          velocityEndX - arrowSize * Math.cos(angle - Math.PI / 6),
          velocityEndY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx2.lineTo(
          velocityEndX - arrowSize * Math.cos(angle + Math.PI / 6),
          velocityEndY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx2.closePath();
        ctx2.fill();
        if (altitude < 300) {
          const timeToImpact = Math.max(0, altitude / Math.max(0.1, Math.abs(lander2.velocity.y)));
          const predictedX = lander2.position.x + lander2.velocity.x * timeToImpact * 50;
          const predictedSurface = terrain2.getSurfaceAt(predictedX);
          ctx2.strokeStyle = "rgba(255, 100, 100, 0.6)";
          ctx2.setLineDash([3, 3]);
          ctx2.beginPath();
          ctx2.moveTo(lander2.position.x, lander2.position.y);
          ctx2.lineTo(predictedX, predictedSurface.y - 10);
          ctx2.stroke();
          ctx2.setLineDash([]);
          ctx2.fillStyle = "rgba(255, 100, 100, 0.4)";
          ctx2.beginPath();
          ctx2.arc(predictedX, predictedSurface.y - 10, 6, 0, Math.PI * 2);
          ctx2.fill();
        }
        const landerAngleDeg = (lander2.angle + Math.PI / 2) * (180 / Math.PI);
        const angleOk = Math.abs(landerAngleDeg) < WORLD.safeAngle;
        ctx2.save();
        ctx2.translate(lander2.position.x, lander2.position.y - 40);
        ctx2.strokeStyle = angleOk ? "rgba(100, 255, 100, 0.8)" : "rgba(255, 100, 100, 0.8)";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.arc(0, 0, 20, -Math.PI / 2 - 0.3, -Math.PI / 2 + 0.3);
        ctx2.stroke();
        ctx2.rotate(lander2.angle + Math.PI / 2);
        ctx2.beginPath();
        ctx2.moveTo(0, -15);
        ctx2.lineTo(0, -25);
        ctx2.stroke();
        ctx2.restore();
        if (altitude < 300) {
          ctx2.save();
          ctx2.globalCompositeOperation = "lighter";
          ctx2.translate(lander2.position.x, lander2.position.y);
          ctx2.rotate(lander2.angle + Math.PI / 2);
          const gradient = ctx2.createRadialGradient(0, 25, 0, 0, 25, 150);
          gradient.addColorStop(0, "rgba(255, 255, 200, 0.3)");
          gradient.addColorStop(1, "rgba(255, 255, 200, 0)");
          ctx2.fillStyle = gradient;
          ctx2.beginPath();
          ctx2.moveTo(-20, 25);
          ctx2.lineTo(20, 25);
          ctx2.lineTo(40, 175);
          ctx2.lineTo(-40, 175);
          ctx2.closePath();
          ctx2.fill();
          ctx2.restore();
        }
        ctx2.restore();
      }
    };
  }

  // scripts/utils/pixelArt.js
  function createExplosionSprites() {
    const frames = [];
    const colors = ["#ff6600", "#ffaa00", "#ffff00", "#ff3300"];
    for (let frame = 0; frame < 4; frame++) {
      const canvas2 = document.createElement("canvas");
      canvas2.width = 48;
      canvas2.height = 48;
      const ctx2 = canvas2.getContext("2d");
      ctx2.imageSmoothingEnabled = false;
      const size = 8 + frame * 4;
      const particles2 = 6 + frame * 2;
      for (let i = 0; i < particles2; i++) {
        const angle = Math.PI * 2 * i / particles2;
        const dist = 4 + frame * 4;
        const x = 24 + Math.cos(angle) * dist;
        const y = 24 + Math.sin(angle) * dist;
        const particleSize = 3 - frame;
        ctx2.fillStyle = colors[frame % colors.length];
        ctx2.fillRect(x - particleSize, y - particleSize, particleSize * 2, particleSize * 2);
      }
      ctx2.fillStyle = colors[3];
      ctx2.fillRect(22, 22, 4, 4);
      frames.push(canvas2);
    }
    return frames;
  }
  function createStarBackground(width, height) {
    const canvas2 = document.createElement("canvas");
    canvas2.width = width;
    canvas2.height = height;
    const ctx2 = canvas2.getContext("2d");
    const gradient = ctx2.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#000510");
    gradient.addColorStop(1, "#000208");
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, width, height);
    ctx2.fillStyle = "#ffffff";
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() > 0.7 ? 2 : 1;
      ctx2.fillRect(x, y, size, size);
    }
    const starColors = ["#ffddaa", "#aaddff", "#ffaadd"];
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx2.fillStyle = starColors[Math.floor(Math.random() * starColors.length)];
      ctx2.fillRect(x, y, 2, 2);
    }
    return canvas2;
  }
  function createParticleSprite() {
    const canvas2 = document.createElement("canvas");
    canvas2.width = 8;
    canvas2.height = 8;
    const ctx2 = canvas2.getContext("2d");
    ctx2.imageSmoothingEnabled = false;
    ctx2.fillStyle = "#ffff00";
    ctx2.fillRect(3, 3, 2, 2);
    ctx2.fillStyle = "#ffaa00";
    ctx2.fillRect(2, 2, 4, 4);
    ctx2.fillStyle = "#ff6600";
    ctx2.fillRect(1, 1, 6, 6);
    return canvas2;
  }
  function createDustSprite() {
    const canvas2 = document.createElement("canvas");
    canvas2.width = 6;
    canvas2.height = 6;
    const ctx2 = canvas2.getContext("2d");
    ctx2.imageSmoothingEnabled = false;
    ctx2.fillStyle = "#8b7355";
    ctx2.fillRect(2, 2, 2, 2);
    ctx2.fillStyle = "#6b5335";
    ctx2.fillRect(1, 1, 4, 4);
    return canvas2;
  }

  // scripts/utils/assetLoader.js
  var AssetLoader = class {
    constructor() {
      this.assets = {};
      this.loaded = false;
      this.loadingPromises = [];
    }
    /**
     * Load a single image
     * @param {string} key - Unique identifier for the asset
     * @param {string} path - Path to the image file
     */
    loadImage(key, path) {
      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.assets[key] = img;
          console.log(`\u2705 Loaded: ${key} (${path})`);
          resolve(img);
        };
        img.onerror = () => {
          console.error(`\u274C Failed to load: ${key} (${path})`);
          reject(new Error(`Failed to load image: ${path}`));
        };
        img.src = path;
      });
      this.loadingPromises.push(promise);
      return promise;
    }
    /**
     * Load multiple images at once
     * @param {Object} assetMap - Object with key: path pairs
     */
    loadImages(assetMap) {
      Object.entries(assetMap).forEach(([key, path]) => {
        this.loadImage(key, path);
      });
    }
    /**
     * Wait for all assets to load
     * @returns {Promise} Resolves when all assets are loaded
     */
    async waitForAll() {
      try {
        await Promise.all(this.loadingPromises);
        this.loaded = true;
        console.log(`\u{1F3A8} All ${this.loadingPromises.length} assets loaded successfully!`);
        return true;
      } catch (error) {
        console.error("Failed to load some assets:", error);
        return false;
      }
    }
    /**
     * Get a loaded asset
     * @param {string} key - Asset identifier
     * @returns {HTMLImageElement|null}
     */
    get(key) {
      return this.assets[key] || null;
    }
    /**
     * Check if asset exists
     * @param {string} key - Asset identifier
     * @returns {boolean}
     */
    has(key) {
      return key in this.assets;
    }
    /**
     * Get all loaded assets
     * @returns {Object}
     */
    getAll() {
      return this.assets;
    }
    /**
     * Create a rocket sprite programmatically
     * @returns {HTMLCanvasElement}
     */
    createRocketSprite() {
      const canvas2 = document.createElement("canvas");
      canvas2.width = 200;
      canvas2.height = 300;
      const ctx2 = canvas2.getContext("2d");
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
      ctx2.save();
      ctx2.translate(100, 150);
      const bodyGradient = ctx2.createLinearGradient(-30, -80, 30, 80);
      bodyGradient.addColorStop(0, "#f0f0f5");
      bodyGradient.addColorStop(0.3, "#e0e5f0");
      bodyGradient.addColorStop(0.7, "#c0c8d8");
      bodyGradient.addColorStop(1, "#a0a8b8");
      ctx2.fillStyle = bodyGradient;
      ctx2.beginPath();
      ctx2.moveTo(0, -100);
      ctx2.bezierCurveTo(25, -80, 35, -40, 35, 50);
      ctx2.lineTo(35, 70);
      ctx2.lineTo(-35, 70);
      ctx2.lineTo(-35, 50);
      ctx2.bezierCurveTo(-35, -40, -25, -80, 0, -100);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx2.beginPath();
      ctx2.moveTo(-15, -90);
      ctx2.bezierCurveTo(-10, -70, -10, -30, -10, 60);
      ctx2.lineTo(-20, 60);
      ctx2.lineTo(-20, 50);
      ctx2.bezierCurveTo(-20, -40, -18, -80, -15, -90);
      ctx2.closePath();
      ctx2.fill();
      const windowGradient = ctx2.createRadialGradient(-5, -50, 5, 0, -45, 25);
      windowGradient.addColorStop(0, "#66aaff");
      windowGradient.addColorStop(0.5, "#4488dd");
      windowGradient.addColorStop(1, "#2266bb");
      ctx2.fillStyle = windowGradient;
      ctx2.beginPath();
      ctx2.ellipse(0, -45, 22, 30, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx2.beginPath();
      ctx2.ellipse(-8, -55, 10, 12, -0.3, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = "#e74c3c";
      ctx2.fillRect(-35, 10, 70, 12);
      const nozzleGradient = ctx2.createLinearGradient(0, 70, 0, 90);
      nozzleGradient.addColorStop(0, "#555555");
      nozzleGradient.addColorStop(1, "#222222");
      ctx2.fillStyle = nozzleGradient;
      ctx2.beginPath();
      ctx2.moveTo(-30, 70);
      ctx2.lineTo(-20, 90);
      ctx2.lineTo(20, 90);
      ctx2.lineTo(30, 70);
      ctx2.closePath();
      ctx2.fill();
      const finGradient = ctx2.createLinearGradient(0, 40, 0, 80);
      finGradient.addColorStop(0, "#c74c44");
      finGradient.addColorStop(1, "#a73c34");
      ctx2.fillStyle = finGradient;
      ctx2.beginPath();
      ctx2.moveTo(-35, 40);
      ctx2.lineTo(-70, 50);
      ctx2.lineTo(-70, 75);
      ctx2.lineTo(-35, 70);
      ctx2.closePath();
      ctx2.fill();
      ctx2.beginPath();
      ctx2.moveTo(35, 40);
      ctx2.lineTo(70, 50);
      ctx2.lineTo(70, 75);
      ctx2.lineTo(35, 70);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = "rgba(255, 100, 100, 0.3)";
      ctx2.beginPath();
      ctx2.moveTo(-35, 42);
      ctx2.lineTo(-65, 52);
      ctx2.lineTo(-65, 60);
      ctx2.lineTo(-35, 50);
      ctx2.closePath();
      ctx2.fill();
      ctx2.beginPath();
      ctx2.moveTo(35, 42);
      ctx2.lineTo(65, 52);
      ctx2.lineTo(65, 60);
      ctx2.lineTo(35, 50);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = "#8890a0";
      for (let y = -30; y < 60; y += 20) {
        ctx2.beginPath();
        ctx2.arc(-25, y, 2, 0, Math.PI * 2);
        ctx2.arc(25, y, 2, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.restore();
      this.assets["rocketSprite"] = canvas2;
      console.log("\u2705 Generated beautiful rocket sprite!");
      return canvas2;
    }
  };
  var assetLoader = new AssetLoader();

  // scripts/main.js
  var canvas = document.getElementById("gameCanvas");
  var ctx = canvas.getContext("2d");
  var beautifulRocketSprite = assetLoader.createRocketSprite();
  var gameAssets = {
    landerSprite: beautifulRocketSprite,
    // Use the beautiful new rocket sprite!
    starBackground: null,
    // Will be created on resize
    explosionFrames: createExplosionSprites(),
    particleSprite: createParticleSprite(),
    dustSprite: createDustSprite()
  };
  ctx.imageSmoothingEnabled = false;
  var viewWidth = window.innerWidth;
  var viewHeight = window.innerHeight;
  var hud = createHud({
    fuel: document.getElementById("hudFuel"),
    speed: document.getElementById("hudSpeed"),
    vertical: document.getElementById("hudVertical"),
    horizontal: document.getElementById("hudHorizontal"),
    angle: document.getElementById("hudAngle"),
    altitude: document.getElementById("hudAltitude"),
    time: document.getElementById("hudTime"),
    status: document.getElementById("hudStatus")
  });
  var instructionsOverlay = createInstructionsOverlay({
    overlay: document.getElementById("instructionsOverlay"),
    checklistInputs: {
      engine: document.querySelector('[data-control-check="engine"]'),
      left: document.querySelector('[data-control-check="left"]'),
      right: document.querySelector('[data-control-check="right"]'),
      combo: document.querySelector('[data-control-check="combo"]')
    }
  });
  var endOverlay = createEndOverlay({
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
      pad: document.getElementById("statPad")
    }
  });
  var toast = createToast(document.getElementById("toast"));
  var touchControls = createTouchControls(document.getElementById("touchControls"));
  var physicsControls = createPhysicsControls({
    container: document.getElementById("tuningPanel"),
    thrustInput: document.getElementById("thrustSlider"),
    thrustLabel: document.getElementById("thrustValue"),
    massInput: document.getElementById("massSlider"),
    massLabel: document.getElementById("massValue")
  });
  var approachIndicator = createApproachIndicator(canvas);
  var starfield = new Starfield(240);
  var terrain = new Terrain(viewWidth, viewHeight);
  var particles = new ParticleSystem();
  var debrisField = new DebrisField();
  var lander = new Lander();
  var inputState = {
    thrust: false,
    rotateLeft: false,
    rotateRight: false,
    auxThrust: false,
    autopilot: false
  };
  var controlChecklist = {
    engine: false,
    left: false,
    right: false,
    combo: false
  };
  var mode = Modes.INTRO;
  var showLandingPads = false;
  var missionStart = null;
  var lastFrame = performance.now();
  var frameRequestId = null;
  var latestShareData = null;
  var cameraShake = { x: 0, y: 0, intensity: 0 };
  var flashIntensity = 0;
  var slowMotionFactor = 1;
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
    gameAssets.starBackground = createStarBackground(viewWidth, viewHeight);
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
      mode
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
    const landedSafely = padContact && speedMagnitude <= WORLD.crashVelocity && angleDeviation <= WORLD.safeAngle;
    if (landedSafely) {
      lander.landed = true;
      lander.rotationVelocity = 0;
      lander.velocity.x = 0;
      lander.velocity.y = 0;
      lander.angle = -Math.PI / 2;
      lander.position.y = contactInfo.y - lander.height * 0.5;
      lander.captureTouchdown(terrain, contactInfo);
      cameraShake.intensity = 3;
      flashIntensity = 0.15;
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
    cameraShake.intensity = 15;
    flashIntensity = 0.4;
    concludeMission(false, contactInfo, reason);
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
      flips: lander.stats.flips
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
        flips: lander.stats.flips
      }
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
          flips: `${lander.stats.flips}`
        },
        touchdown: {
          speed: `${mphFromPixels(touchdownSpeed).toFixed(1)} mph`,
          angle: `${touchdownAngle.toFixed(1)}\xB0`
        },
        padLabel: lander.contactPad ? `${lander.contactPad.id} (${lander.contactPad.difficulty})` : "No pad",
        playUrl: getShareUrl()
      }
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
    }
    return null;
  }
  function handleShare() {
    if (!latestShareData?.summary) return;
    const summary = formatMissionSummary(latestShareData.summary);
    if (navigator.share) {
      navigator.share({
        title: "Space Lander Mission Report",
        text: summary
      }).catch(() => {
      });
    } else {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(summary).then(() => {
          toast.show("Stats copied");
        });
      }
    }
  }
  function handleCopy() {
    if (!latestShareData?.summary) return;
    const summary = formatMissionSummary(latestShareData.summary);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(() => {
        toast.show("Stats copied");
      });
    } else {
      toast.show("Clipboard unavailable");
    }
  }
  function togglePadGuide(button) {
    showLandingPads = !showLandingPads;
    terrain.setShowPads(showLandingPads);
    button.textContent = showLandingPads ? LANDING_GUIDE_LABELS.hide : LANDING_GUIDE_LABELS.show;
  }
  function animate(now) {
    frameRequestId = requestAnimationFrame(animate);
    let dt = Math.min(0.05, (now - lastFrame) / 1e3);
    lastFrame = now;
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
    if (flashIntensity > 0) {
      flashIntensity *= 0.92;
      if (flashIntensity < 0.01) flashIntensity = 0;
    }
    ctx.save();
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    ctx.translate(cameraShake.x, cameraShake.y);
    if (gameAssets.starBackground) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(gameAssets.starBackground, 0, 0, viewWidth, viewHeight);
      ctx.globalAlpha = 1;
    }
    starfield.draw(ctx);
    terrain.draw(ctx, lander.position, altitude);
    if (mode === Modes.PLAYING) {
      const effectiveInput = { ...inputState };
      if (inputState.autopilot && lander.fuel > 0) {
        const targetAngle = -Math.PI / 2;
        const angleError = lander.angle - targetAngle;
        if (Math.abs(angleError) > 0.05) {
          if (angleError > 0) effectiveInput.rotateLeft = true;
          else effectiveInput.rotateRight = true;
        } else if (Math.abs(lander.rotationVelocity) > 0.5) {
          if (lander.rotationVelocity > 0) effectiveInput.rotateRight = true;
          else effectiveInput.rotateLeft = true;
        }
        if (altitude < 200 && Math.abs(lander.velocity.y) > 0.3) {
          effectiveInput.auxThrust = true;
        }
      }
      lander.applyInput(effectiveInput, dt);
      lander.integrate(dt, { width: viewWidth, height: viewHeight });
      lander.updateStats(dt, terrain);
      if (altitude < 150 && !lander.landed && !lander.crashed) {
        const dustIntensity = Math.max(0, 1 - altitude / 150);
        const speed2 = Math.hypot(lander.velocity.x, lander.velocity.y);
        if (Math.random() < dustIntensity * 0.3 * (0.5 + speed2)) {
          const surface = terrain.getSurfaceAt(lander.position.x);
          particles.spawnDust(lander.position.x, surface.y, Math.floor(2 + dustIntensity * 4));
        }
      }
      evaluateContact();
    }
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
    if (flashIntensity > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
      ctx.fillRect(-cameraShake.x, -cameraShake.y, viewWidth, viewHeight);
    }
    ctx.restore();
    const missionTime = mode === Modes.PLAYING && missionStart ? (performance.now() - missionStart) / 1e3 : mode === Modes.ENDED ? lander.stats.time : 0;
    updateHud(missionTime);
  }
  window.addEventListener("resize", () => {
    cancelAnimationFrame(frameRequestId);
    resizeCanvas();
    lastFrame = performance.now();
    frameRequestId = requestAnimationFrame(animate);
  });
  var keyboardController = createKeyboardController({
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
    }
  });
  touchControls.setCallback(setControlState);
  document.getElementById("startMission").addEventListener("click", () => {
    setMode(Modes.PLAYING);
    resetMission(true);
  });
  var togglePadsButton = document.getElementById("togglePads");
  togglePadsButton.addEventListener("click", () => togglePadGuide(togglePadsButton));
  var playAgainButton = document.getElementById("playAgain");
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
  resizeCanvas();
  setMode(Modes.INTRO);
  togglePadsButton.textContent = LANDING_GUIDE_LABELS.show;
  frameRequestId = requestAnimationFrame(animate);
  window.addEventListener("beforeunload", () => {
    keyboardController.dispose();
    cancelAnimationFrame(frameRequestId);
  });
})();
