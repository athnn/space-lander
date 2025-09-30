import { TWO_PI } from "../config/constants.js";

export class ParticleSystem {
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
        type: 'engine',
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
        type: 'dust',
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

  draw(ctx, sprites = null) {
    if (this.particles.length === 0) return;
    ctx.save();

    this.particles.forEach((p) => {
      const progress = Math.min(1, p.age / p.life);
      const radius = p.size * (0.65 + (1 - progress) * 0.6);
      const coreRadius = Math.max(0.4, p.core * (1 - progress * 0.4));

      // Use sprite if available
      if (sprites) {
        const sprite = p.type === 'dust' ? sprites.dustSprite : sprites.particleSprite;
        if (sprite) {
          ctx.globalAlpha = p.opacity * (1 - progress);
          ctx.save();
          ctx.translate(p.x, p.y);
          const scale = radius / (sprite.width / 2);
          ctx.drawImage(sprite, -sprite.width * scale / 2, -sprite.height * scale / 2, sprite.width * scale, sprite.height * scale);
          ctx.restore();
          ctx.globalAlpha = 1.0;
          return;
        }
      }

      // Fallback to gradient rendering
      if (p.type === 'dust') {
        ctx.globalCompositeOperation = "source-over";
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        const innerAlpha = Math.max(0, p.opacity * (1 - progress)).toFixed(3);
        gradient.addColorStop(0, `rgba(180, 160, 140, ${innerAlpha})`);
        gradient.addColorStop(0.5, `rgba(140, 120, 100, ${innerAlpha * 0.5})`);
        gradient.addColorStop(1, `rgba(100, 80, 60, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, TWO_PI);
        ctx.fill();
      } else {
        ctx.globalCompositeOperation = "lighter";
        const gradient = ctx.createRadialGradient(p.x, p.y, coreRadius, p.x, p.y, radius);
        const innerAlpha = Math.min(1, p.opacity).toFixed(3);
        const midAlpha = Math.max(0, p.opacity * 0.6).toFixed(3);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 95%, ${innerAlpha})`);
        gradient.addColorStop(0.35, `hsla(${p.hue + 8}, 100%, 65%, ${midAlpha})`);
        gradient.addColorStop(1, `hsla(${p.hue + 18}, 100%, 50%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, TWO_PI);
        ctx.fill();

        if (p.spark) {
          ctx.fillStyle = `hsla(${p.hue}, 100%, 92%, ${Math.max(0, p.opacity - 0.2).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, coreRadius * 0.6, 0, TWO_PI);
          ctx.fill();
        }
      }
    });
    ctx.restore();
  }

  reset() {
    this.particles = [];
  }
}
