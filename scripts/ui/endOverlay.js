import { fraction, mphFromPixels } from "../utils/math.js";

export function createEndOverlay({ overlay, elements }) {
  const {
    title,
    score,
    outcome,
    subtitle,
    meterSpeed,
    meterSpeedValue,
    meterAngle,
    meterAngleValue,
    time,
    fuel,
    maxSpeed,
    maxAltitude,
    flips,
    pad,
  } = elements;

  function hide() {
    overlay.classList.remove("overlay--visible");
  }

  function show({
    safe,
    scoreValue,
    reason,
    contactPad,
    touchdownSpeed,
    touchdownAngle,
    stats,
  }) {
    overlay.classList.add("overlay--visible");
    title.textContent = safe ? "Touchdown Confirmed" : "Vehicle Lost";
    score.textContent = Intl.NumberFormat().format(Math.round(scoreValue));
    outcome.textContent = safe ? "mission points" : "salvage rating";
    subtitle.textContent = safe
      ? `Telemetry nominal. ${contactPad?.id ?? "Unknown pad"} secured.`
      : reason || "Structural integrity failure recorded.";

    const speedMph = mphFromPixels(touchdownSpeed);
    meterSpeed.style.setProperty("--percent", `${fraction(speedMph, 0, 40) * 100}%`);
    meterSpeedValue.textContent = `${speedMph.toFixed(1)} mph`;

    const anglePercent = fraction(touchdownAngle, 0, 45);
    meterAngle.style.setProperty("--percent", `${anglePercent * 100}%`);
    meterAngleValue.textContent = `${touchdownAngle.toFixed(1)}°`;

    time.textContent = `${stats.time.toFixed(1)} s`;
    fuel.textContent = `${Math.round(stats.fuel)}%`;
    maxSpeed.textContent = `${mphFromPixels(stats.maxSpeed).toFixed(1)} mph`;
    maxAltitude.textContent = `${Math.round(stats.maxAltitude)} ft`;
    flips.textContent = `${stats.flips}`;
    pad.textContent = contactPad
      ? `${contactPad.id} (${contactPad.difficulty})`
      : "No pad";
  }

  return {
    show,
    hide,
  };
}
