// Date helpers — all server-local time.

export function currentMonth(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function rangeStart(range, d = new Date()) {
  const x = startOfDay(d);
  if (range === "day") return x;
  if (range === "week") {
    const day = x.getDay(); // 0=Sun
    const diff = (day + 6) % 7; // make Monday the start
    x.setDate(x.getDate() - diff);
    return x;
  }
  // month
  x.setDate(1);
  return x;
}

export function monthBounds(month) {
  // month "YYYY-MM" -> [start, endExclusive)
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return [start, end];
}
