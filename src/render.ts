import type { HistoryResponse, DayMenu } from "./types.js";

function stars(rating: number): string {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) =>
    i < full
      ? '<span class="text-yellow-400">★</span>'
      : '<span class="text-purple-800">★</span>'
  ).join("");
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatCommentTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const mealLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  happyHour: "Happy Hour",
};

type MealKey = "breakfast" | "lunch" | "happyHour";

function getMealCount(day: DayMenu): number {
  let count = 0;
  if (day.breakfast) count++;
  if (day.lunch) count++;
  if (day.happyHour) count++;
  return count;
}

function gridColsClass(count: number): string {
  if (count >= 3) return "sm:grid-cols-3";
  if (count === 2) return "sm:grid-cols-2";
  return "";
}

export function renderOverview(container: HTMLElement, data: HistoryResponse): void {
  const { menu, ratings, comments } = data;
  const sortedDates = Object.keys(menu.days).sort();

  if (sortedDates.length === 0) {
    container.innerHTML =
      '<p class="text-center text-purple-500 text-sm py-10">No menu data for this week.</p>';
    return;
  }

  container.innerHTML = sortedDates
    .map((date) => {
      const day = menu.days[date];
      const dayRatings = ratings[date] ?? {};
      const dayComments = comments[date] ?? {};

      const meals: { key: MealKey; label: string }[] = [];
      if (day.breakfast) meals.push({ key: "breakfast", label: "Breakfast" });
      if (day.lunch) meals.push({ key: "lunch", label: "Lunch" });
      if (day.happyHour) meals.push({ key: "happyHour", label: "Happy Hour" });

      if (meals.length === 0) return "";

      const colClass = gridColsClass(getMealCount(day));

      const cardsHtml = meals
        .map(({ key, label }) => {
          const rating = dayRatings[key];
          const mealComments = dayComments[key];
          const commentCount = mealComments?.length ?? 0;

          const ratingHtml = rating
            ? `<div class="text-sm">${stars(rating.averageRating)} <span class="text-purple-300 text-xs">${rating.averageRating.toFixed(1)} avg · ${rating.voteCount} rating${rating.voteCount === 1 ? "" : "s"}</span></div>`
            : '<div class="text-xs text-purple-600">No ratings yet</div>';

          const commentHtml =
            commentCount > 0
              ? `<div class="text-xs text-purple-400 mt-1">💬 ${commentCount} comment${commentCount === 1 ? "" : "s"}</div>`
              : "";

          return `
            <div
              class="bg-purple-950/20 rounded-lg border border-purple-900/30 p-4 cursor-pointer hover:border-sentry-blurple/50 hover:bg-purple-950/40 transition-all"
              data-meal-date="${date}"
              data-meal-type="${key}"
            >
              <div class="font-medium text-sm text-purple-200 mb-2">${label}</div>
              ${ratingHtml}
              ${commentHtml}
            </div>
          `;
        })
        .join("");

      return `
        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white border-b border-purple-900/30 pb-2">
            ${formatDate(date)}
          </h2>
          <div class="grid grid-cols-1 ${colClass} gap-3">
            ${cardsHtml}
          </div>
        </section>
      `;
    })
    .join("");
}

export function renderDetail(
  container: HTMLElement,
  data: HistoryResponse,
  date: string,
  mealType: MealKey
): void {
  const day = data.menu.days[date];
  if (!day) {
    container.innerHTML = '<p class="text-center text-purple-500 text-sm py-10">Day not found.</p>';
    return;
  }

  const meal = day[mealType];
  const label = mealLabels[mealType] ?? mealType;
  const rating = data.ratings[date]?.[mealType];
  const mealComments = data.comments[date]?.[mealType] ?? [];

  // Header with back button
  const headerHtml = `
    <div class="mb-6">
      <button data-action="back" class="text-sm text-sentry-lt-blurple hover:text-white transition-colors mb-4 flex items-center gap-1">
        ← Back to overview
      </button>
      <h2 class="text-xl font-semibold text-white">${label} — ${formatDate(date)}</h2>
    </div>
  `;

  // Rating section
  const ratingHtml = rating
    ? `<div class="mb-6 text-sm">${stars(rating.averageRating)} <span class="text-purple-300">${rating.averageRating.toFixed(1)} avg · ${rating.voteCount} rating${rating.voteCount === 1 ? "" : "s"}</span></div>`
    : '<div class="mb-6 text-xs text-purple-600">No ratings yet</div>';

  // Menu items
  let itemsHtml = "";
  if (meal && meal.items.length > 0) {
    itemsHtml = `
      <div class="space-y-3 mb-6">
        ${meal.items
          .map(
            (item) => `
          <div class="bg-purple-950/20 rounded-lg border border-purple-900/30 p-3">
            <div class="flex items-start gap-2 mb-1">
              <span class="text-sm text-white font-medium capitalize">${escapeHtml(item.name)}</span>
              <div class="flex gap-1 mt-0.5">
                ${item.isVegan ? '<span class="text-xs bg-green-900/60 text-green-300 px-1.5 py-0.5 rounded">VG</span>' : ""}
                ${!item.isVegan && item.isVegetarian ? '<span class="text-xs bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded">V</span>' : ""}
                ${item.isGlutenFree ? '<span class="text-xs bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded">GF</span>' : ""}
              </div>
            </div>
            ${item.description ? `<p class="text-xs text-gray-400">${escapeHtml(item.description)}</p>` : ""}
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } else {
    itemsHtml = '<p class="text-sm text-purple-600 mb-6">No menu items available.</p>';
  }

  // Comments section
  let commentsHtml = "";
  if (mealComments.length > 0) {
    commentsHtml = `
      <div class="border-t border-purple-900/30 pt-4">
        <h3 class="text-sm font-medium text-purple-300 mb-3">💬 ${mealComments.length} Comment${mealComments.length === 1 ? "" : "s"}</h3>
        <div class="space-y-2">
          ${mealComments
            .map(
              (c) => `
            <div class="bg-purple-950/40 rounded p-3">
              <p class="text-sm text-gray-300">${escapeHtml(c.body)}</p>
              <p class="text-xs text-purple-600 mt-1">${formatCommentTime(c.createdAt)}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  container.innerHTML = headerHtml + ratingHtml + itemsHtml + commentsHtml;
}

export function populateWeekSelect(
  select: HTMLSelectElement,
  weeks: string[],
  selectedWeek: string | null
): void {
  select.innerHTML = weeks
    .map((w) => {
      const d = new Date(w + "T12:00:00");
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `<option value="${w}" ${w === selectedWeek ? "selected" : ""}>Week of ${label}</option>`;
    })
    .join("");
}
