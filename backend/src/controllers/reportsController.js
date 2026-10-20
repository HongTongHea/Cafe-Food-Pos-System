const Reports = require("../models/reportsModel");
const { shop } = require("../config/env");

const RANGES = { "7d": 7, "30d": 30, "90d": 90 };

// date helpers work on 'YYYY-MM-DD' strings in UTC so there are no timezone surprises
const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const pctChange = (current, previous) => (previous ? ((current - previous) / previous) * 100 : null);

// GET /api/reports/dashboard?range=7d|30d|90d   (admin)
exports.dashboard = async (req, res) => {
  const days = RANGES[req.query.range] || 30;
  const today = await Reports.today();

  const from = addDays(today, -(days - 1));
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));

  const [current, previous, todayStats, daily, topProducts, payments, lowStock] = await Promise.all([
    Reports.totals(from, today),
    Reports.totals(prevFrom, prevTo),
    Reports.totals(today, today),
    Reports.dailyRevenue(from, today),
    Reports.topProducts(from, today),
    Reports.paymentBreakdown(from, today),
    Reports.lowStock(),
  ]);

  // fill days with no sales so the chart has no gaps
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = Array.from({ length: days }, (_, i) => {
    const day = addDays(from, i);
    const hit = byDay.get(day);
    return { day, revenue: hit ? hit.revenue : 0, orders: hit ? hit.orders : 0 };
  });

  const avg = (t) => (t.orders ? t.revenue / t.orders : 0);

  res.json({
    range: { from, to: today, days },
    today: todayStats,
    kpis: {
      revenue: { value: current.revenue, change: pctChange(current.revenue, previous.revenue) },
      orders: { value: current.orders, change: pctChange(current.orders, previous.orders) },
      avg_order: { value: avg(current), change: pctChange(avg(current), avg(previous)) },
      items_sold: { value: current.items_sold, change: pctChange(current.items_sold, previous.items_sold) },
    },
    series,
    top_products: topProducts,
    payments,
    low_stock: lowStock,
    low_stock_threshold: shop.lowStockThreshold,
  });
};
