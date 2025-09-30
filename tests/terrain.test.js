import test from "node:test";
import assert from "node:assert/strict";

import { Terrain } from "../scripts/systems/terrain.js";

test("terrain generates landing pads within bounds", () => {
  const terrain = new Terrain(1200, 800);
  assert.ok(terrain.landingPads.length >= 2);
  terrain.landingPads.forEach((pad) => {
    assert.ok(pad.x1 >= 0 && pad.x1 < 1200);
    assert.ok(pad.x2 > pad.x1 && pad.x2 <= 1200);
    assert.ok(pad.y > 0 && pad.y <= 800);
  });
});

test("setShowPads toggles visualization flag", () => {
  const terrain = new Terrain(800, 600);
  terrain.setShowPads(true);
  assert.strictEqual(terrain.showPads, true);
  terrain.setShowPads(false);
  assert.strictEqual(terrain.showPads, false);
});

test("getSurfaceAt returns plausible heights", () => {
  const terrain = new Terrain(1000, 700);
  const sample = terrain.getSurfaceAt(terrain.width / 2);
  assert.ok("y" in sample);
  assert.ok(sample.y > 0 && sample.y <= 700);
});
