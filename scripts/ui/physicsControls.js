import { setMassFactor, setThrustFactor, physicsSettings } from "../config/tuning.js";

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatMultiplier(value) {
  return `${value.toFixed(1)}x`;
}

export function createPhysicsControls({
  container,
  thrustInput,
  thrustLabel,
  massInput,
  massLabel,
}) {
  if (!container || !thrustInput || !massInput) {
    throw new Error("Physics controls require container and inputs");
  }

  function updateThrust(value) {
    const numeric = Number.parseFloat(value);
    setThrustFactor(numeric);
    if (thrustLabel) {
      thrustLabel.textContent = formatPercent(numeric);
    }
  }

  function updateMass(value) {
    const numeric = Number.parseFloat(value);
    setMassFactor(numeric);
    if (massLabel) {
      massLabel.textContent = formatMultiplier(numeric);
    }
  }

  thrustInput.addEventListener("input", (event) => {
    updateThrust(event.target.value);
  });

  massInput.addEventListener("input", (event) => {
    updateMass(event.target.value);
  });

  // Initialize labels with defaults
  updateThrust(thrustInput.value);
  updateMass(massInput.value);

  function getSettings() {
    return { ...physicsSettings };
  }

  return {
    getSettings,
    updateThrust,
    updateMass,
  };
}
