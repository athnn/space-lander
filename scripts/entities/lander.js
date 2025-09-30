import {
  DEG,
  PIXELS_TO_FEET,
  TWO_PI,
  WORLD,
} from "../config/constants.js";
import {
  normalizeAngle,
  rotatePoint,
  shortestAngleBetween,
} from "../utils/math.js";
import { getEffectiveMass, getEffectiveThrust } from "../config/tuning.js";

export class Lander {
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

  reset(viewWidth, viewHeight) {
    const randomBetween = (min, max) => min + Math.random() * (max - min);
    const width = viewWidth ?? 1280;
    const startX = width * 0.33;
    const endX = width * 0.66;
    const velocityRange = WORLD.mainThrust * (width / 10);

    this.position = {
      x: randomBetween(startX, endX),
      y: this.height * 2,
    };
    this.velocity = {
      x: randomBetween(-velocityRange, velocityRange),
      y: randomBetween(0, velocityRange),
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
      verticalSpeed: 0,
    };
  }

  applyInput(inputState, dt) {
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

    const altitudeFeet = Number.isFinite(this.altitudeFt)
      ? this.altitudeFt
      : Number.POSITIVE_INFINITY;
    const deployThreshold = 420;
    const retractThreshold = deployThreshold * 1.5;
    const wantsDeploy =
      altitudeFeet <= deployThreshold &&
      (inputState.thrust || inputState.rotateLeft || inputState.rotateRight);

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

    if (inputState.thrust && this.fuel > 0) {
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

    if (inputState.auxThrust && this.fuel > 0) {
      this.velocity.x += deltaMultiplier * auxPower * Math.cos(this.angle);
      this.velocity.y += deltaMultiplier * auxPower * Math.sin(this.angle);
      this.fuel = Math.max(
        0,
        this.fuel - WORLD.fuelBurnAux * deltaMultiplier
      );
      this.auxThrusting = true;
    }

    // Calculate moment of inertia based on current mass (fuel affects mass distribution)
    const momentOfInertia = currentMass * (this.width * this.width + this.height * this.height) / 12;

    let rotationInput = 0;
    if (inputState.rotateLeft && this.fuel > 0) {
      rotationInput -= 1;
      this.rightThrusterActive = true;
    }
    if (inputState.rotateRight && this.fuel > 0) {
      rotationInput += 1;
      this.leftThrusterActive = true;
    }

    if (rotationInput !== 0) {
      // Apply torque to angular momentum (conservation of angular momentum)
      const torque = rotationInput * WORLD.rotationStep * 100;
      this.angularMomentum += torque * deltaMultiplier;

      if (this.fuel > 0) {
        this.fuel = Math.max(
          0,
          this.fuel - WORLD.fuelBurnRotate * deltaMultiplier
        );
      }
    }

    // Calculate rotation velocity from angular momentum and moment of inertia
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

    // Apply gravity (mass affects acceleration due to gravity but cancels out in F=ma)
    const currentMass = this.getCurrentMass();
    this.velocity.y += deltaMultiplier * WORLD.gravity;

    // Apply drag (air resistance) proportional to velocity squared and inversely to mass
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    if (speed > 0) {
      const dragForce = WORLD.dragCoefficient * speed * speed;
      const dragAcceleration = dragForce / currentMass;
      const dragX = (this.velocity.x / speed) * dragAcceleration;
      const dragY = (this.velocity.y / speed) * dragAcceleration;
      this.velocity.x -= dragX * deltaMultiplier;
      this.velocity.y -= dragY * deltaMultiplier;
    }

    // Update position
    this.position.x += this.velocity.x * deltaMultiplier;
    this.position.y += this.velocity.y * deltaMultiplier;

    const boundWidth = bounds?.width ?? 1280;
    if (boundWidth > 0) {
      this.position.x = ((this.position.x % boundWidth) + boundWidth) % boundWidth;
    }

    const minY = -((bounds?.height ?? 720) * 2);
    if (this.position.y < minY) {
      this.position.y = minY;
      if (this.velocity.y < 0) {
        this.velocity.y = 0;
      }
    }

    // Apply rotation damping for realistic control feel (angular momentum conservation with damping)
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
      this.stats.rotationAccumulator %=
        TWO_PI * Math.sign(this.stats.rotationAccumulator);
    }

    const deltaTime = Math.max(0, dt);
    this.thrustPhase = (this.thrustPhase + deltaTime * 6) % TWO_PI;
  }

  updateStats(dt, terrain) {
    if (this.landed || this.crashed) {
      return;
    }
    this.stats.time += dt;
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    this.stats.maxSpeed = Math.max(this.stats.maxSpeed, speed);
    const base = terrain.getSurfaceAt(this.position.x);
    const altitudePx = base.y - this.position.y;
    const altitudeFt = Math.max(0, altitudePx * PIXELS_TO_FEET);
    this.altitudeFt = altitudeFt;
    this.stats.maxAltitude = Math.min(
      WORLD.maxAltitudeTrack,
      Math.max(this.stats.maxAltitude, altitudeFt)
    );
  }

  captureTouchdown(terrain, contactInfo) {
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
      this.contactPad = terrain.getPad(contactInfo.padId);
    }
    this.legDeploy = 1;
  }

  getAltitude(terrain) {
    const base = terrain.getSurfaceAt(this.position.x);
    const altitudePx = base.y - this.position.y;
    return Math.max(0, altitudePx * PIXELS_TO_FEET);
  }

  getFootPositions() {
    const offsets = [
      { x: -this.legSpread * 0.5, y: this.height * 0.5 },
      { x: this.legSpread * 0.5, y: this.height * 0.5 },
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

  draw(ctx, particles, sprite = null) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle + Math.PI / 2);

    // If sprite is provided, use it instead of drawing manually
    if (sprite) {
      const scale = Math.max(this.width / sprite.width, this.height / sprite.height);
      const drawWidth = sprite.width * scale;
      const drawHeight = sprite.height * scale;
      ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

      // Still draw flames if thrusting
      const baseY = this.height * 0.5;
      const phase = this.thrustPhase ?? 0;
      const fuelRatio = this.fuel / WORLD.maxFuel;
      const pulse = 0.85 + Math.sin(phase * 2) * 0.2;

      if (this.thrusting && this.fuel > 0) {
        const flameWidth = this.width * (0.38 + 0.14 * pulse);
        const flameLength = this.height * (1 + 0.6 * fuelRatio) * pulse;
        const flameBaseY = baseY;

        const flameGradient = ctx.createLinearGradient(0, flameBaseY, 0, flameBaseY + flameLength);
        flameGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        flameGradient.addColorStop(0.25, "rgba(255, 230, 150, 0.92)");
        flameGradient.addColorStop(0.6, "rgba(255, 140, 50, 0.78)");
        flameGradient.addColorStop(1, "rgba(160, 40, 0, 0)");
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.moveTo(-flameWidth * 0.5, flameBaseY);
        ctx.quadraticCurveTo(-flameWidth * 0.2, flameBaseY + flameLength * 0.25, 0, flameBaseY + flameLength);
        ctx.quadraticCurveTo(flameWidth * 0.2, flameBaseY + flameLength * 0.25, flameWidth * 0.5, flameBaseY);
        ctx.closePath();
        ctx.fill();

        if (particles) {
          const nozzleWorld = this.getNozzlePosition();
          particles.spawn(
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

        const auxGradient = ctx.createLinearGradient(
          0,
          flameBaseY,
          0,
          flameBaseY + auxLength
        );
        auxGradient.addColorStop(0, "rgba(255, 255, 255, 0.85)");
        auxGradient.addColorStop(0.25, "rgba(210, 230, 255, 0.8)");
        auxGradient.addColorStop(0.7, "rgba(120, 160, 255, 0.55)");
        auxGradient.addColorStop(1, "rgba(80, 120, 220, 0)");
        ctx.fillStyle = auxGradient;
        ctx.beginPath();
        ctx.moveTo(-auxWidth * 0.45, flameBaseY);
        ctx.quadraticCurveTo(0, flameBaseY + auxLength * 0.4, auxWidth * 0.45, flameBaseY);
        ctx.lineTo(0, flameBaseY + auxLength);
        ctx.closePath();
        ctx.fill();

        if (particles) {
          const nozzleWorld = this.getNozzlePosition();
          particles.spawn(
            nozzleWorld.x,
            nozzleWorld.y,
            this.angle + Math.PI,
            Math.PI * 0.22,
            55
          );
        }
      }

      ctx.restore();
      return;
    }

    const bodyHeight = this.height * 0.9;
    const bodyWidth = this.width * 0.62;
    const baseY = this.height * 0.5;

    const hullGradient = ctx.createLinearGradient(0, -bodyHeight * 0.9, 0, bodyHeight * 0.6);
    hullGradient.addColorStop(0, "rgba(230, 240, 255, 0.96)");
    hullGradient.addColorStop(0.5, "rgba(140, 170, 235, 0.97)");
    hullGradient.addColorStop(1, "rgba(55, 80, 150, 0.98)");

    ctx.fillStyle = hullGradient;
    ctx.beginPath();
    ctx.moveTo(0, -bodyHeight);
    ctx.quadraticCurveTo(bodyWidth * 0.55, -bodyHeight * 0.35, bodyWidth * 0.46, bodyHeight * 0.42);
    ctx.lineTo(-bodyWidth * 0.46, bodyHeight * 0.42);
    ctx.quadraticCurveTo(-bodyWidth * 0.55, -bodyHeight * 0.35, 0, -bodyHeight);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(-bodyWidth * 0.1, -bodyHeight * 0.45, bodyWidth * 0.2, bodyHeight * 0.84);

    ctx.fillStyle = "rgba(255, 95, 125, 0.35)";
    ctx.fillRect(-bodyWidth * 0.5, -bodyHeight * 0.08, bodyWidth, bodyHeight * 0.1);

    const podGradient = ctx.createLinearGradient(0, -bodyHeight * 0.4, 0, bodyHeight * 0.5);
    podGradient.addColorStop(0, "rgba(190, 210, 255, 0.9)");
    podGradient.addColorStop(1, "rgba(90, 120, 200, 0.95)");

    ctx.fillStyle = podGradient;
    ctx.beginPath();
    ctx.moveTo(bodyWidth * 0.72, -bodyHeight * 0.25);
    ctx.quadraticCurveTo(bodyWidth * 1.05, 0, bodyWidth * 0.78, bodyHeight * 0.45);
    ctx.lineTo(bodyWidth * 0.55, bodyHeight * 0.38);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-bodyWidth * 0.72, -bodyHeight * 0.25);
    ctx.quadraticCurveTo(-bodyWidth * 1.05, 0, -bodyWidth * 0.78, bodyHeight * 0.45);
    ctx.lineTo(-bodyWidth * 0.55, bodyHeight * 0.38);
    ctx.closePath();
    ctx.fill();

    const windowGradient = ctx.createRadialGradient(0, -bodyHeight * 0.35, this.width * 0.05, 0, -bodyHeight * 0.35, this.width * 0.28);
    windowGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    windowGradient.addColorStop(0.35, "rgba(120, 200, 255, 0.9)");
    windowGradient.addColorStop(1, "rgba(40, 90, 160, 0.85)");
    ctx.fillStyle = windowGradient;
    ctx.beginPath();
    ctx.arc(0, -bodyHeight * 0.35, this.width * 0.26, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.moveTo(-bodyWidth * 0.42, bodyHeight * 0.05);
    ctx.lineTo(bodyWidth * 0.42, bodyHeight * 0.05);
    ctx.lineTo(bodyWidth * 0.35, bodyHeight * 0.32);
    ctx.lineTo(-bodyWidth * 0.35, bodyHeight * 0.32);
    ctx.closePath();
    ctx.fill();

    const bellGradient = ctx.createLinearGradient(0, bodyHeight * 0.28, 0, bodyHeight * 0.65);
    bellGradient.addColorStop(0, "rgba(60, 80, 140, 0.95)");
    bellGradient.addColorStop(1, "rgba(20, 30, 70, 0.9)");
    ctx.fillStyle = bellGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyWidth * 0.45, bodyHeight * 0.28);
    ctx.lineTo(bodyWidth * 0.45, bodyHeight * 0.28);
    ctx.quadraticCurveTo(bodyWidth * 0.55, bodyHeight * 0.65, bodyWidth * 0.25, bodyHeight * 0.7);
    ctx.lineTo(-bodyWidth * 0.25, bodyHeight * 0.7);
    ctx.quadraticCurveTo(-bodyWidth * 0.55, bodyHeight * 0.65, -bodyWidth * 0.45, bodyHeight * 0.28);
    ctx.closePath();
    ctx.fill();

    const deploy = Math.min(1, this.legDeploy);
    const legAngle = Math.PI / 4 * deploy;
    const legLength = this.height * (0.42 + 0.1 * deploy);
    const footOffset = this.width * 0.22 + deploy * this.width * 0.18;
    const footWidth = this.width * (0.3 + 0.1 * deploy);

    const drawLeg = (side) => {
      const direction = side > 0 ? 1 : -1;
      const baseX = this.width * 0.45 * direction;
      const baseY = bodyHeight * 0.22;
      const tipX = baseX + direction * Math.cos(legAngle) * legLength;
      const tipY = baseY + Math.sin(legAngle) * legLength;

      ctx.strokeStyle = "rgba(200, 220, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(
        baseX + direction * Math.cos(legAngle * 0.6) * legLength * 0.55,
        baseY + Math.sin(legAngle * 0.6) * legLength * 0.55
      );
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.fillStyle = "rgba(160, 200, 255, 0.58)";
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(direction === 1 ? legAngle * 0.6 : -legAngle * 0.6);
      ctx.beginPath();
      ctx.ellipse(0, 0, footWidth * 0.6, this.width * 0.06 + deploy * 2, 0, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
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

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.35 * (0.5 + fuelRatio * 0.5);
      ctx.beginPath();
      ctx.ellipse(0, flameBaseY + flameLength * 0.45, flameWidth * 0.95, flameLength * 0.55, 0, 0, TWO_PI);
      ctx.fillStyle = "rgba(120, 170, 255, 0.9)";
      ctx.fill();
      ctx.restore();

      const flameGradient = ctx.createLinearGradient(0, flameBaseY, 0, flameBaseY + flameLength);
      flameGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      flameGradient.addColorStop(0.25, "rgba(255, 230, 150, 0.92)");
      flameGradient.addColorStop(0.6, "rgba(255, 140, 50, 0.78)");
      flameGradient.addColorStop(1, "rgba(160, 40, 0, 0)");
      ctx.fillStyle = flameGradient;
      ctx.beginPath();
      ctx.moveTo(-flameWidth * 0.5, flameBaseY);
      ctx.quadraticCurveTo(-flameWidth * 0.2, flameBaseY + flameLength * 0.25, 0, flameBaseY + flameLength);
      ctx.quadraticCurveTo(flameWidth * 0.2, flameBaseY + flameLength * 0.25, flameWidth * 0.5, flameBaseY);
      ctx.closePath();
      ctx.fill();

      const coreGradient = ctx.createLinearGradient(0, flameBaseY, 0, flameBaseY + flameLength * 0.7);
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      coreGradient.addColorStop(1, "rgba(255, 190, 120, 0.75)");
      const coreWidth = flameWidth * 0.32;
      const coreLength = flameLength * 0.6;
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.moveTo(-coreWidth * 0.5, flameBaseY + coreLength * 0.05);
      ctx.quadraticCurveTo(0, flameBaseY + coreLength * 0.35, coreWidth * 0.5, flameBaseY + coreLength * 0.05);
      ctx.lineTo(0, flameBaseY + coreLength);
      ctx.closePath();
      ctx.fill();

      if (particles) {
        const nozzleWorld = this.getNozzlePosition();
        particles.spawn(
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

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = this.thrusting ? 0.45 : 0.75;
      ctx.beginPath();
      ctx.ellipse(
        0,
        flameBaseY + auxLength * 0.6,
        auxWidth * 0.75,
        auxLength * 0.65,
        0,
        0,
        TWO_PI
      );
      ctx.fillStyle = "rgba(120, 190, 255, 0.8)";
      ctx.fill();
      ctx.restore();

      const auxGradient = ctx.createLinearGradient(
        0,
        flameBaseY,
        0,
        flameBaseY + auxLength
      );
      auxGradient.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      auxGradient.addColorStop(0.25, "rgba(210, 230, 255, 0.8)");
      auxGradient.addColorStop(0.7, "rgba(120, 160, 255, 0.55)");
      auxGradient.addColorStop(1, "rgba(80, 120, 220, 0)");
      ctx.fillStyle = auxGradient;
      ctx.beginPath();
      ctx.moveTo(-auxWidth * 0.45, flameBaseY);
      ctx.quadraticCurveTo(0, flameBaseY + auxLength * 0.4, auxWidth * 0.45, flameBaseY);
      ctx.lineTo(0, flameBaseY + auxLength);
      ctx.closePath();
      ctx.fill();

      if (particles) {
        const nozzleWorld = this.getNozzlePosition();
        particles.spawn(
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
      ctx.save();
      ctx.translate(offsetX, sideBaseY);
      ctx.rotate(offsetX > 0 ? Math.PI / 2.2 : -Math.PI / 2.2);
      const sideGradient = ctx.createLinearGradient(0, 0, 0, sideLength);
      sideGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      sideGradient.addColorStop(0.3, "rgba(255, 220, 150, 0.85)");
      sideGradient.addColorStop(1, "rgba(200, 80, 0, 0)");
      ctx.fillStyle = sideGradient;
      ctx.beginPath();
      ctx.moveTo(-sideWidth * 0.4, 0);
      ctx.quadraticCurveTo(0, sideLength * 0.4, sideWidth * 0.4, 0);
      ctx.lineTo(0, sideLength);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawSideThruster(bodyWidth * 0.78, this.rightThrusterActive);
    drawSideThruster(-bodyWidth * 0.78, this.leftThrusterActive);

    ctx.restore();
  }
}
