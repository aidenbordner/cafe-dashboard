import * as Sentry from "@sentry/browser";
import { fetchWeeks, fetchWeekHistory } from "./api.js";
import type { HistoryResponse, ViewState } from "./types.js";
import { renderOverview, renderDetail, populateWeekSelect } from "./render.js";

// Initialize Sentry
Sentry.init({
  dsn: "https://fb56b72a2efa33e69fa44b6069cbeb52@o4510064609591296.ingest.us.sentry.io/4510959478112256",
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  enableLogs: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
});

const weekSelect = document.getElementById("week-select") as HTMLSelectElement;
const loadingEl = document.getElementById("loading") as HTMLElement;
const errorEl = document.getElementById("error") as HTMLElement;
const errorMessageEl = document.getElementById("error-message") as HTMLElement;
const weekContentEl = document.getElementById("week-content") as HTMLElement;
const emptyEl = document.getElementById("empty") as HTMLElement;

let currentView: ViewState = { page: "overview" };
let cachedData: HistoryResponse | null = null;

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

function renderCurrentView(): void {
  if (!cachedData) return;
  if (currentView.page === "detail") {
    renderDetail(weekContentEl, cachedData, currentView.date, currentView.mealType);
  } else {
    renderOverview(weekContentEl, cachedData);
  }
  showContent();
}

async function loadWeek(weekStart: string): Promise<void> {
  showLoading();
  Sentry.logger.info(`Loading week ${weekStart}`);
  await Sentry.startSpan({ name: `Load week ${weekStart}`, op: "ui.action" }, async () => {
    try {
      cachedData = await fetchWeekHistory(weekStart);
      currentView = { page: "overview" };
      renderCurrentView();
      Sentry.logger.info(`Week loaded successfully`, { weekStart });
      Sentry.addBreadcrumb({ message: `Loaded week ${weekStart}`, category: "navigation" });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Sentry.logger.error(`Failed to load week`, { weekStart, error: error.message });
      showError(`Failed to load week: ${error.message}`);
      Sentry.captureException(error);
    }
  });
}

// Event delegation for navigation
weekContentEl.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  // Back button
  const backBtn = target.closest("[data-action='back']");
  if (backBtn) {
    currentView = { page: "overview" };
    renderCurrentView();
    return;
  }

  // Meal card click → navigate to detail
  const card = target.closest<HTMLElement>("[data-meal-date]");
  if (card) {
    const date = card.getAttribute("data-meal-date")!;
    const mealType = card.getAttribute("data-meal-type") as "breakfast" | "lunch" | "happyHour";
    currentView = { page: "detail", date, mealType };
    renderCurrentView();
    Sentry.addBreadcrumb({ message: `Navigated to ${mealType} on ${date}`, category: "navigation" });
  }
});

async function init(): Promise<void> {
  try {
    Sentry.logger.info("Initializing dashboard");
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
        void loadWeek(selected);
      } else {
        showEmpty();
      }
    });

    // Load the most recent week by default
    await loadWeek(weeks[0]);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    Sentry.logger.error("Failed to initialize dashboard", { error: error.message });
    showError(`Failed to load week list: ${error.message}`);
    Sentry.captureException(error);
  }
}

void init();
