/* ============================================================
   Shared front-end behaviour: theme toggling + page loader
   Used on public pages (index, login, register).
   ============================================================ */

(function () {
  const THEME_KEY = "taskflow-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const icon = document.querySelector("#themeToggle i");
    if (icon) {
      icon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    const btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", toggleTheme);

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Hide loader once DOM is ready
    const loader = document.getElementById("pageLoader");
    if (loader) {
      setTimeout(() => loader.classList.add("hidden"), 250);
    }
  });
})();
