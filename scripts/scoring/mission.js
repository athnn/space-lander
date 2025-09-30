import { mphFromPixels } from "../utils/math.js";

export function computeScore({ landed, fuel, speed, angle, time, flips }) {
  const base = landed ? 1500 : 200;
  const fuelBonus = fuel * 4;
  const speedPenalty = Math.pow(mphFromPixels(speed), 1.4) * 2.2;
  const anglePenalty = Math.pow(angle, 1.2) * 3.2;
  const timePenalty = Math.max(0, time - 20) * 6;
  const flipBonus = flips * 120;
  const score = base + fuelBonus + flipBonus - speedPenalty - anglePenalty - timePenalty;
  return Math.max(0, score);
}

export function formatMissionSummary({
  safe,
  score,
  outcomeLabel,
  stats,
  touchdown,
  padLabel,
  playUrl,
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
