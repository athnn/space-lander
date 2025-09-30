export function createKeyboardController({
  keysMap,
  onControlChange,
  onQuickReset,
  onGoAround,
}) {
  const activeKeys = new Set();

  function handleKeyDown(event) {
    const control = keysMap[event.code];
    if (!control) return;
    event.preventDefault();
    if (control === "quickReset") {
      if (!activeKeys.has(event.code)) {
        onQuickReset?.();
      }
      activeKeys.add(event.code);
      return;
    }
    if (control === "goAround") {
      if (!activeKeys.has(event.code)) {
        onGoAround?.();
      }
      activeKeys.add(event.code);
      return;
    }
    if (!activeKeys.has(event.code)) {
      activeKeys.add(event.code);
      onControlChange?.(control, true);
    }
  }

  function handleKeyUp(event) {
    const control = keysMap[event.code];
    if (!control) return;
    event.preventDefault();
    if (control === "quickReset" || control === "goAround") {
      activeKeys.delete(event.code);
      return;
    }
    if (activeKeys.has(event.code)) {
      activeKeys.delete(event.code);
      onControlChange?.(control, false);
    }
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  function dispose() {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    activeKeys.clear();
  }

  return {
    dispose,
  };
}
