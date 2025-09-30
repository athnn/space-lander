import { TWO_PI, WORLD } from "../config/constants.js";

export class DebrisField {
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
        color,
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

  draw(ctx) {
    if (this.shards.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.shards.forEach((s) => {
      const alpha = 1 - s.age / s.life;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.fillStyle = `rgba(255, 140, 90, ${alpha.toFixed(3)})`;
      ctx.fillRect(-s.size * 0.5, -s.size * 0.5, s.size, s.size * 1.4);
      ctx.restore();
    });
    ctx.restore();
  }

  reset() {
    this.shards = [];
  }
}
