export function createToast(element) {
  let timeoutId = null;

  function hide() {
    element.classList.remove("toast--visible");
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function show(message, duration = 1600) {
    element.textContent = message;
    element.classList.add("toast--visible");
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(hide, duration);
  }

  return { show, hide };
}
