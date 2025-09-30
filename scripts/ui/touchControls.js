export function createTouchControls(container) {
  const buttons = Array.from(container?.querySelectorAll("[data-control]")) ?? [];
  const pointerMap = new Map();
  let callback = () => {};

  function setCallback(fn) {
    callback = typeof fn === "function" ? fn : () => {};
  }

  function handlePointerDown(event) {
    const button = event.currentTarget;
    const controlName = button.dataset.control;
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    pointerMap.set(event.pointerId, button);
    button.dataset.active = "true";
    callback(controlName, true);
  }

  function handlePointerUp(event) {
    const button = pointerMap.get(event.pointerId) || event.currentTarget;
    if (!button) return;
    const controlName = button.dataset.control;
    pointerMap.delete(event.pointerId);
    button.dataset.active = "false";
    callback(controlName, false);
  }

  buttons.forEach((button) => {
    button.addEventListener("pointerdown", handlePointerDown);
    ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
      button.addEventListener(eventName, handlePointerUp);
    });
  });

  function reset() {
    buttons.forEach((button) => {
      button.dataset.active = "false";
    });
    pointerMap.clear();
  }

  return {
    setCallback,
    reset,
  };
}
