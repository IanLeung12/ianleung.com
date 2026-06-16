// Shared theme controller: toggle, persistence, and OS-change following.
// The no-flash <head> script in each page has already set
// document.documentElement.dataset.theme before this module runs.

type Theme = "light" | "dark";
const STORAGE_KEY = "theme";
const root = document.documentElement;

function current(): Theme {
  return root.dataset.theme === "dark" ? "dark" : "light";
}

function apply(theme: Theme): void {
  root.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}

const toggle = document.querySelector<HTMLButtonElement>(".theme-toggle");
toggle?.addEventListener("click", () => {
  const next: Theme = current() === "dark" ? "light" : "dark";
  apply(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable — choice simply won't persist */
  }
});

// Follow OS preference only when the user has not made an explicit choice.
const mq = window.matchMedia("(prefers-color-scheme: dark)");
mq.addEventListener("change", (e) => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (stored) return;
  apply(e.matches ? "dark" : "light");
});
