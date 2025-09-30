import { WORLD } from "./constants.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const physicsSettings = {
  thrustFactor: 0.3,  // Reduced thrust for easier testing
  massFactor: 1,
};

export function setThrustFactor(value) {
  physicsSettings.thrustFactor = clamp(value, 0.2, 2.5);
}

export function setMassFactor(value) {
  physicsSettings.massFactor = clamp(value, 0.2, 3);
}

export function getEffectiveThrust() {
  return WORLD.mainThrust * physicsSettings.thrustFactor;
}

export function getEffectiveMass() {
  return physicsSettings.massFactor;
}
