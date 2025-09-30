import { DEG, Modes, WORLD } from "../config/constants.js";
import { mphFromPixels } from "../utils/math.js";

export function createHud({
  fuel,
  speed,
  vertical,
  horizontal,
  angle,
  altitude,
  time,
  status,
}) {
  function update({ lander, altitudeFt, missionTime, mode }) {
    const currentSpeed = Math.hypot(lander.velocity.x, lander.velocity.y);
    const verticalSpeed = lander.velocity.y;
    const horizontalSpeed = lander.velocity.x;
    const angleDeviation = Math.abs((lander.angle + Math.PI / 2) * DEG);
    const safeMissionTime = Number.isFinite(missionTime) ? missionTime : 0;

    // Check if approaching unsafe limits
    const speedMph = mphFromPixels(currentSpeed);
    const crashSpeedMph = mphFromPixels(WORLD.crashVelocity);
    const speedDanger = currentSpeed > WORLD.crashVelocity * 0.7;
    const angleDanger = angleDeviation > WORLD.safeAngle * 0.7;
    const fuelCritical = lander.fuel < 15;
    const isApproaching = altitudeFt < 300 && mode === Modes.PLAYING;

    fuel.textContent = `${Math.round(lander.fuel)}%`;
    fuel.parentElement.style.color = fuelCritical ? "#ff5555" : "";

    speed.textContent = `${speedMph.toFixed(1)} mph`;
    speed.parentElement.style.color = speedDanger && isApproaching ? "#ff9944" : "";

    vertical.textContent = `${mphFromPixels(verticalSpeed).toFixed(1)} mph`;
    horizontal.textContent = `${mphFromPixels(horizontalSpeed).toFixed(1)} mph`;

    // More granular altitude display at low heights
    if (altitudeFt < 100) {
      altitude.textContent = `${altitudeFt.toFixed(1)} ft`;
    } else {
      altitude.textContent = `${Math.round(altitudeFt)} ft`;
    }
    altitude.parentElement.style.color = altitudeFt < 100 && isApproaching ? "#ffdd55" : "";

    angle.textContent = `${angleDeviation.toFixed(1)}°`;
    angle.parentElement.style.color = angleDanger && isApproaching ? "#ff9944" : "";

    time.textContent = `${safeMissionTime.toFixed(1)} s`;

    if (lander.landed) {
      status.textContent = "Landed";
      status.className = "success";
    } else if (lander.crashed) {
      status.textContent = "Crashed";
      status.className = "fail";
    } else if (mode === Modes.PLAYING) {
      status.textContent = altitudeFt < 120 ? "Final Approach" : "In Flight";
      status.className = "";
    } else {
      status.textContent = "Standby";
      status.className = "";
    }
  }

  return { update };
}
