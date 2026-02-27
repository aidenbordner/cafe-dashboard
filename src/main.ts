import * as Sentry from "@sentry/browser";
import { fetchWeeks, fetchWeekHistory } from "./api.js";
import { renderWeekHistory, populateWeekSelect } from "./render.js";

// Initialize Sentry
Sentry.init({
  dsn: "https://fb56b72a2efa33e69fa44b6069cbeb52@o4510064609591296.ingest.us.sentry.io/4510959478112256",
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  integrations: [Sentry.browserTracingIntegration()],
});

const weekSelect = document.getElementById("week-select") as HTMLSelectElement;
const loadingEl = document.getElementById("loading") as HTMLElement;
const errorEl = document.getElementById("error") as HTMLElement;
const errorMessageEl = document.getElementById("error-message") as HTMLElement;
const weekContentEl = document.getElementById("week-content") as HTMLElement;
const emptyEl = document.getElementById("empty") as HTMLElement;

// Tracks which meal cards are currently expanded
const expandedIds = new Set<string>();

function showLoading(): void {
  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  weekContentEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
}

function showError(message: string): void {
  loadingEl.classList.add("hidden");
  errorEl.classList.remove("hidden");
  weekContentEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  errorMessageEl.textContent = message;
}

function showContent(): void {
  loadingEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  weekContentEl.classList.remove("hidden");
  emptyEl.classList.add("hidden");
}

function showEmpty(): void {
  loadingEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  weekContentEl.classList.add("hidden");
  emptyEl.classList.remove("hidden");
}

async function loadWeek(weekStart: string): Promise<void> {
  showLoading();
  await Sentry.startSpan({ name: `Load week ${weekStart}`, op: "ui.action" }, async () => {
    try {
      const data = await fetchWeekHistory(weekStart);
      renderWeekHistory(weekContentEl, data, expandedIds);
      showContent();
      attachExpandListeners();
      Sentry.addBreadcrumb({ message: `Loaded week ${weekStart}`, category: "navigation" });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      showError(`Failed to load week: ${error.message}`);
      Sentry.captureException(error);
    }
  });
}

function attachExpandListeners(): void {
  weekContentEl.querySelectorAll<HTMLButtonElement>("[data-expand-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-expand-id")!;
      if (expandedIds.has(id)) {
        expandedIds.delete(id);
      } else {
        expandedIds.add(id);
      }
      // Re-render with updated expanded state
      const currentWeek = weekSelect.value;
      if (currentWeek) {
        void loadWeek(currentWeek);
      }
    });
  });
}

async function init(): Promise<void> {
  try {
    const weeks = await fetchWeeks();

    if (weeks.length === 0) {
      showEmpty();
      weekSelect.innerHTML = '<option value="">No archived weeks</option>';
      return;
    }

    populateWeekSelect(weekSelect, weeks, weeks[0]);

    weekSelect.addEventListener("change", () => {
      const selected = weekSelect.value;
      if (selected) {
        expandedIds.clear();
        void loadWeek(selected);
      } else {
        showEmpty();
      }
    });

    // Load the most recent week by default
    await loadWeek(weeks[0]);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    showError(`Failed to load week list: ${error.message}`);
    Sentry.captureException(error);
  }
}

void init();
