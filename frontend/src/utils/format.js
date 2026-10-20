export function makeMoney(currency = "USD") {
  let formatter;
  try {
    formatter = new Intl.NumberFormat(undefined, { style: "currency", currency });
  } catch {
    formatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
  }
  return (value) => formatter.format(Number(value) || 0);
}

export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";

export const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";

// 'YYYY-MM-DD' <-> shift helpers (pure string maths in UTC, no timezone surprises)
export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const fmtShortDay = (dateStr) =>
  new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const ORDER_TYPE_LABEL = { dine_in: "Dine in", takeaway: "Takeaway" };
export const PAYMENT_LABEL = { cash: "Cash", card: "Card", qr: "QR pay" };
