import { TWO_PI } from "../config/constants.js";

export class Starfield {
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
      twinkle: Math.random() * TWO_PI,
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

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#030613";
    ctx.fillRect(0, 0, this.width, this.height);
    this.stars.forEach((star) => {
      const size = 1.1 + star.z * 1.8;
      const alpha = 0.4 + Math.abs(Math.sin(star.twinkle)) * 0.6;
      ctx.fillStyle = `rgba(186, 214, 255, ${alpha.toFixed(3)})`;
      ctx.fillRect(star.x, star.y, size, size);
    });
    ctx.restore();
  }
}
