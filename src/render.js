function stars(rating) {
    const full = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => i < full
        ? '<span class="text-yellow-400">★</span>'
        : '<span class="text-purple-800">★</span>').join("");
}
function formatDate(isoDate) {
    const d = new Date(isoDate + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
function formatCommentTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
function renderMealCard(mealKey, mealLabel, meal, rating, comments, expandedIds) {
    const cardId = `${mealKey}-${mealLabel.replace(/\s/g, "")}`;
    const isExpanded = expandedIds.has(cardId);
    const hasContent = meal && meal.items.length > 0;
    const ratingHtml = rating
        ? `<div class="text-sm">${stars(rating.averageRating)} <span class="text-purple-300 text-xs">${rating.averageRating.toFixed(1)} avg · ${rating.voteCount} rating${rating.voteCount === 1 ? "" : "s"}</span></div>`
        : '<div class="text-xs text-purple-600">No ratings yet</div>';
    const commentCountHtml = comments && comments.length > 0
        ? `<div class="text-xs text-purple-400">💬 ${comments.length} comment${comments.length === 1 ? "" : "s"}</div>`
        : '<div class="text-xs text-purple-700">No comments</div>';
    const expandedContent = isExpanded && hasContent
        ? `
    <div class="mt-3 border-t border-purple-900/30 pt-3">
      <div class="space-y-1 mb-3">
        ${meal.items
            .map((item) => `
          <div class="flex items-start gap-2">
            <span class="text-sm text-white capitalize">${item.name}</span>
            <div class="flex gap-1 mt-0.5">
              ${item.isVegan ? '<span class="text-xs bg-green-900/60 text-green-300 px-1 rounded">VG</span>' : ""}
              ${!item.isVegan && item.isVegetarian ? '<span class="text-xs bg-green-900/40 text-green-400 px-1 rounded">V</span>' : ""}
              ${item.isGlutenFree ? '<span class="text-xs bg-yellow-900/40 text-yellow-400 px-1 rounded">GF</span>' : ""}
            </div>
          </div>
          ${item.description ? `<p class="text-xs text-gray-500 ml-0 mb-1">${item.description}</p>` : ""}
        `)
            .join("")}
      </div>
      ${comments && comments.length > 0
            ? `
        <div class="border-t border-purple-900/30 pt-3 space-y-2">
          ${comments
                .map((c) => `
            <div class="bg-purple-950/40 rounded p-2">
              <p class="text-xs text-gray-300">${escapeHtml(c.body)}</p>
              <p class="text-xs text-purple-600 mt-1">${formatCommentTime(c.createdAt)}</p>
            </div>
          `)
                .join("")}
        </div>
      `
            : ""}
    </div>
  `
        : "";
    const timeLabel = meal?.startTime && meal?.endTime
        ? `<span class="text-xs text-purple-500">${meal.startTime}–${meal.endTime}</span>`
        : "";
    return `
    <div class="bg-purple-950/20 rounded-lg border border-purple-900/30 p-3">
      <div class="font-medium text-sm text-purple-200 mb-2 flex items-center gap-2">
        ${mealLabel} ${timeLabel}
      </div>
      ${ratingHtml}
      ${commentCountHtml}
      ${hasContent
        ? `
        <button
          class="mt-2 text-xs text-sentry-lt-blurple hover:text-white transition-colors"
          data-expand-id="${cardId}"
        >
          ${isExpanded ? "▲ Collapse" : "▼ Expand " + mealLabel}
        </button>
        ${expandedContent}
      `
        : '<p class="text-xs text-purple-700 mt-2">Not available</p>'}
    </div>
  `;
}
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
export function renderWeekHistory(container, data, expandedIds) {
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
        return `
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-white border-b border-purple-900/30 pb-2">
          ${formatDate(date)}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${renderMealCard(date, "Breakfast", day.breakfast, dayRatings["breakfast"], dayComments["breakfast"], expandedIds)}
          ${renderMealCard(date, "Lunch", day.lunch, dayRatings["lunch"], dayComments["lunch"], expandedIds)}
          ${renderMealCard(date, "Happy Hour", day.happyHour, dayRatings["happyHour"], dayComments["happyHour"], expandedIds)}
        </div>
      </section>
    `;
    })
        .join("");
}
export function populateWeekSelect(select, weeks, selectedWeek) {
    select.innerHTML = weeks
        .map((w) => {
        const d = new Date(w + "T12:00:00");
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return `<option value="${w}" ${w === selectedWeek ? "selected" : ""}>Week of ${label}</option>`;
    })
        .join("");
}
