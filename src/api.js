const BASE = "https://sentrymenuscraper.netlify.app";
export async function fetchWeeks() {
    const res = await fetch(`${BASE}/history`);
    if (!res.ok)
        throw new Error(`Failed to fetch weeks: ${res.status}`);
    const data = await res.json();
    return data.weeks;
}
export async function fetchWeekHistory(weekStart) {
    const res = await fetch(`${BASE}/history?weekStart=${encodeURIComponent(weekStart)}`);
    if (!res.ok)
        throw new Error(`Failed to fetch week ${weekStart}: ${res.status}`);
    return res.json();
}
