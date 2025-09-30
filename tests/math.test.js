import test from "node:test";
import assert from "node:assert/strict";

import {
  clamp,
  fraction,
  normalizeAngle,
  rotatePoint,
  shortestAngleBetween,
  mphFromPixels,
} from "../scripts/utils/math.js";
import { VELOCITY_MULTIPLIER } from "../scripts/config/constants.js";

const EPSILON = 1e-6;

function almostEqual(a, b, eps = EPSILON) {
  assert.ok(Math.abs(a - b) <= eps, `${a} is not close to ${b}`);
}

test("clamp bounds values", () => {
  assert.strictEqual(clamp(5, 0, 10), 5);
  assert.strictEqual(clamp(-5, 0, 10), 0);
  assert.strictEqual(clamp(15, 0, 10), 10);
});

test("fraction clamps to range", () => {
  almostEqual(fraction(5, 0, 10), 0.5);
  almostEqual(fraction(-5, 0, 10), 0);
  almostEqual(fraction(15, 0, 10), 1);
});

test("normalizeAngle wraps into -PI..PI", () => {
  const pos = normalizeAngle(Math.PI * 3);
  const neg = normalizeAngle(-Math.PI * 3);
  almostEqual(Math.abs(pos), Math.PI);
  almostEqual(Math.abs(neg), Math.PI);
});

test("shortestAngleBetween chooses minimal rotation", () => {
  const delta = shortestAngleBetween(0, Math.PI * 1.5);
  almostEqual(delta, -Math.PI / 2);
});

test("rotatePoint rotates around origin", () => {
  const rotated = rotatePoint({ x: 1, y: 0 }, Math.PI / 2, { x: 0, y: 0 });
  almostEqual(rotated.x, 0);
  almostEqual(rotated.y, 1);
});

test("mphFromPixels converts velocity", () => {
  const velocityUnits = 10;
  const expected = velocityUnits * VELOCITY_MULTIPLIER;
  almostEqual(mphFromPixels(velocityUnits), expected);
});
