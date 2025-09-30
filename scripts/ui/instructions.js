export function createInstructionsOverlay({ overlay, checklistInputs }) {
  if (!overlay) {
    throw new Error("Instructions overlay element required");
  }

  function show() {
    overlay.classList.add("overlay--visible");
  }

  function hide() {
    overlay.classList.remove("overlay--visible");
  }

  function updateChecklist(state) {
    if (!checklistInputs) return;
    if ("engine" in state && checklistInputs.engine) {
      checklistInputs.engine.checked = state.engine;
    }
    if ("left" in state && checklistInputs.left) {
      checklistInputs.left.checked = state.left;
    }
    if ("right" in state && checklistInputs.right) {
      checklistInputs.right.checked = state.right;
    }
    if ("combo" in state && checklistInputs.combo) {
      checklistInputs.combo.checked = state.combo;
    }
  }

  return {
    show,
    hide,
    updateChecklist,
  };
}
