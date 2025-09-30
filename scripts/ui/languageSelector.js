// Language selector UI component
import { i18n } from "../utils/i18n.js";

export function createLanguageSelector(container) {
  if (!container) {
    throw new Error("Language selector container element required");
  }

  const languages = i18n.getAvailableLanguages();
  const currentLang = i18n.getLanguage();

  // Create selector HTML
  container.innerHTML = `
    <div class="languageSelector__wrapper">
      <label class="languageSelector__label" data-i18n="languageLabel">${i18n.t("languageLabel")}</label>
      <select class="languageSelector__select" id="languageSelect">
        ${languages
          .map(
            (lang) =>
              `<option value="${lang.code}" ${
                lang.code === currentLang ? "selected" : ""
              }>${lang.name}</option>`
          )
          .join("")}
      </select>
    </div>
  `;

  const select = container.querySelector("#languageSelect");

  function handleChange(event) {
    const newLang = event.target.value;
    i18n.setLanguage(newLang);
  }

  function updateLanguage() {
    const label = container.querySelector('[data-i18n="languageLabel"]');
    if (label) {
      label.textContent = i18n.t("languageLabel");
    }
    select.value = i18n.getLanguage();
  }

  select.addEventListener("change", handleChange);

  // Listen for language changes from other sources
  const unsubscribe = i18n.onChange(updateLanguage);

  return {
    dispose: () => {
      select.removeEventListener("change", handleChange);
      unsubscribe();
    },
  };
}