import test from "node:test";
import assert from "node:assert/strict";

import { computeScore, formatMissionSummary } from "../scripts/scoring/mission.js";

const baseStats = {
  landed: true,
  fuel: 80,
  speed: 5,
  angle: 2,
  time: 18,
  flips: 1,
};

test("successful landing scores higher than crash", () => {
  const success = computeScore(baseStats);
  const crash = computeScore({ ...baseStats, landed: false });
  assert.ok(success > crash);
});

test("formatMissionSummary includes key fields", () => {
  const summary = formatMissionSummary({
    safe: true,
    score: "1,200",
    outcomeLabel: "mission points",
    stats: {
      time: "20.0 s",
      fuel: "50%",
      maxSpeed: "40.0 mph",
      maxAltitude: "1000 ft",
      flips: "2",
    },
    touchdown: {
      speed: "10.0 mph",
      angle: "5.0°",
    },
    padLabel: "Pad-1 (Standard)",
    playUrl: "https://example.com",
  });

  assert.ok(summary.includes("Mission Success"));
  assert.ok(summary.includes("Score: 1,200 mission points"));
  assert.ok(summary.includes("Fuel Remaining: 50%"));
  assert.ok(summary.includes("Landing Pad: Pad-1"));
  assert.ok(summary.includes("Play at: https://example.com"));
});
