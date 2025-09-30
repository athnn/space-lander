import { TWO_PI, VELOCITY_MULTIPLIER } from "../config/constants.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function fraction(value, min, max) {
  if (max - min === 0) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

export function normalizeAngle(angle) {
  let a = angle % TWO_PI;
  if (a > Math.PI) {
    a -= TWO_PI;
  }
  if (a < -Math.PI) {
    a += TWO_PI;
  }
  return a;
}

export function shortestAngleBetween(a, b) {
  let delta = b - a;
  while (delta > Math.PI) delta -= TWO_PI;
  while (delta < -Math.PI) delta += TWO_PI;
  return delta;
}

export function rotatePoint(point, angle, origin) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const x = point.x * cos - point.y * sin;
  const y = point.x * sin + point.y * cos;
  return {
    x: origin.x + x,
    y: origin.y + y,
  };
}

export function mphFromPixels(velocityUnits, multiplier = VELOCITY_MULTIPLIER) {
  return velocityUnits * multiplier;
}
