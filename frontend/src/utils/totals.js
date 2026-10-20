const toCents = (v) => Math.round((Number(v) || 0) * 100);

export function computeTotals({ lines, discountType = "none", discountValue = 0, taxRate = 0 }) {
  const subtotal = lines.reduce((sum, l) => sum + toCents(l.price) * l.qty, 0);

  let discount = 0;
  const dv = Number(discountValue) || 0;
  if (discountType === "percent") discount = Math.round((subtotal * Math.min(Math.max(dv, 0), 100)) / 100);
  if (discountType === "amount") discount = Math.min(subtotal, toCents(Math.max(dv, 0)));

  const taxable = subtotal - discount;
  const tax = Math.round((taxable * taxRate) / 100);
  const total = taxable + tax;

  return {
    subtotal: subtotal / 100,
    discount: discount / 100,
    tax: tax / 100,
    total: total / 100,
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
  };
}

// Handy "cash received" buttons: exact, then the next round notes above the total.
export function quickCashAmounts(total) {
  const options = new Set([Math.round(total * 100) / 100]);
  [1, 5, 10, 20, 50, 100].forEach((step) => {
    const rounded = Math.ceil(total / step) * step;
    if (rounded > total) options.add(rounded);
  });
  return [...options].sort((a, b) => a - b).slice(0, 4);
}
