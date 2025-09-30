import { fraction, mphFromPixels } from "../utils/math.js";
import { i18n } from "../utils/i18n.js";

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
    title.textContent = safe ? i18n.t("endTitleSuccess") : i18n.t("endTitleFailure");
    score.textContent = Intl.NumberFormat().format(Math.round(scoreValue));
    outcome.textContent = safe ? i18n.t("endOutcomePoints") : i18n.t("endOutcomeSalvage");
    
    const padName = contactPad?.id ?? i18n.t("endSubtitleUnknownPad");
    subtitle.textContent = safe
      ? i18n.t("endSubtitleSuccess", { pad: padName })
      : reason || i18n.t("endSubtitleFailure");

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
      : i18n.t("endLabelNoPad");
  }

  return {
    show,
    hide,
  };
}
