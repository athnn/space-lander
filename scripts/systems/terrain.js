import { mulberry32 } from "../utils/random.js";

export class Terrain {
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
      const wave =
        Math.sin(i * 0.45) * amplitude * 0.35 +
        Math.sin(i * 1.4) * amplitude * 0.18;
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
        difficulty: spanSegments >= 3 ? "Precision" : "Standard",
      };
      this.landingPads.push(pad);
    }

    this.points = basePoints;
    this.segments = padSlots.map((padId) =>
      padId !== null ? { type: "pad", padId } : { type: "terrain", padId: null }
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

  draw(ctx, landerPosition = null, landerAltitude = null) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    this.points.forEach((p) => {
      ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, this.height * 0.4, 0, this.height);
    gradient.addColorStop(0, "#0b132a");
    gradient.addColorStop(1, "#05070f");
    ctx.fillStyle = gradient;
    ctx.fill();

    this.glowPhase += 0.03;

    this.landingPads.forEach((pad) => {
      ctx.save();

      // Calculate if lander is nearby for glow effect
      let isNearby = false;
      let proximity = 0;
      if (landerPosition && landerAltitude !== null) {
        const padCenterX = (pad.x1 + pad.x2) / 2;
        const horizontalDist = Math.abs(landerPosition.x - padCenterX);
        const padWidth = pad.x2 - pad.x1;

        if (horizontalDist < padWidth * 3 && landerAltitude < 500) {
          isNearby = true;
          proximity = 1 - Math.min(1, (horizontalDist / (padWidth * 3)) * 0.5 + (landerAltitude / 500) * 0.5);
        }
      }

      // Draw glow effect if nearby
      if (isNearby) {
        const pulse = Math.sin(this.glowPhase) * 0.3 + 0.7;
        const glowIntensity = proximity * pulse;

        // Outer glow
        ctx.shadowBlur = 20 * glowIntensity;
        ctx.shadowColor = `rgba(36, 245, 161, ${0.6 * glowIntensity})`;
        ctx.fillStyle = `rgba(36, 245, 161, ${0.15 * glowIntensity})`;
        ctx.fillRect(pad.x1 - 10, pad.y - 20, pad.x2 - pad.x1 + 20, 30);

        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = this.showPads
        ? "rgba(36, 245, 161, 0.25)"
        : "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(pad.x1, pad.y - 4, pad.x2 - pad.x1, 6);
      ctx.fillStyle = "#f5f9ff";
      ctx.fillRect(pad.x1, pad.y - 2, pad.x2 - pad.x1, 2);
      if (this.showPads) {
        ctx.font = '12px "Share Tech Mono"';
        ctx.fillStyle = "rgba(200, 255, 240, 0.85)";
        ctx.fillText(pad.id, pad.x1 + 6, pad.y - 10);
      }
      ctx.restore();
    });
    ctx.restore();
  }

  getSurfaceAt(x) {
    if (x <= 0) {
      return {
        y: this.points[1].y,
        type: this.segments[0]?.type ?? "terrain",
        padId: this.segments[0]?.padId ?? null,
      };
    }
    if (x >= this.width) {
      const last = this.points.length - 1;
      return {
        y: this.points[last].y,
        type: this.segments[last - 1]?.type ?? "terrain",
        padId: this.segments[last - 1]?.padId ?? null,
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
          slope: Math.atan2(p2.y - p1.y, p2.x - p1.x),
        };
      }
    }
    const last = this.points.length - 1;
    return { y: this.points[last].y, type: "terrain", padId: null };
  }

  getPad(padId) {
    return this.landingPads[padId] ?? null;
  }
}
