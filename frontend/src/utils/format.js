export function makeMoney(currency = "USD") {
  const code = String(currency || "USD").toUpperCase();

  return (value) => {
    const amount = Number(value) || 0;

    if (code === "KHR") {
      return (
        new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(Math.round(amount)) + " ៛"
      );
    }

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
      }).format(amount);
    } catch {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    }
  };
}

export const DEFAULT_KHR_PER_USD = 4000;

// Prices are stored in USD. fmt.usd() is the main price,
// fmt.khr() is the riel equivalent (rounded to the nearest 100 ៛).
export function makeDual(rate = DEFAULT_KHR_PER_USD) {
  const r = Number(rate) > 0 ? Number(rate) : DEFAULT_KHR_PER_USD;
  const usdFmt = makeMoney("USD");
  const khrFmt = makeMoney("KHR");
  const roundKhr = (v) => Math.round((Number(v) || 0) / 100) * 100;

  return {
    rate: r,
    usd: (v) => usdFmt(v),
    khr: (v) => khrFmt(roundKhr((Number(v) || 0) * r)),
    toKhr: (usd) => roundKhr((Number(usd) || 0) * r),
    toUsd: (khr) => (Number(khr) || 0) / r,
    roundKhr,
  };
}

export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

export const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

// 'YYYY-MM-DD' <-> shift helpers (pure string maths in UTC, no timezone surprises)
export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const fmtShortDay = (dateStr) =>
  new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

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
