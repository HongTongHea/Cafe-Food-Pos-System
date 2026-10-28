import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Coffee, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import api, { errorMessage } from "../api/client";
import { useSettings } from "../context/SettingsContext";
import { fmtDateTime, fmtShortDay, makeDual, PAYMENT_LABEL } from "../utils/format";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import { useLanguage } from "../context/LanguageContext";

function Delta({ change }) {
  const { t } = useLanguage();

  if (change === null || change === undefined)
    return <span className="text-xs text-stone-400">{t("no_prior_data")}</span>;

  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-emerald-600" : "text-red-600"}`}>
      <Icon className="size-3.5" />
      {Math.abs(change).toFixed(1)}%
      <span className="ml-1 font-medium text-stone-400">{t("vs_previous")}</span>
    </span>
  );
}

// `sub` is an optional second line under the value (the ≈ KHR amount).
function Kpi({ icon: Icon, label, value, sub, change }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-500">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="size-4.5" />
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold tracking-tight text-stone-900 tabular-nums">{value}</div>
      {sub && <div className="text-sm font-semibold text-stone-500 tabular-nums">{sub}</div>}
      <div className="mt-1.5">
        <Delta change={change} />
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, fmt }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-lg">
      <div className="font-semibold text-stone-800">{fmtShortDay(p.day)}</div>
      <div className="text-brand-700 font-bold">{fmt.usd(p.revenue)}</div>
      <div className="text-xs font-semibold text-stone-500">≈ {fmt.khr(p.revenue)}</div>
      <div className="mt-1 text-xs text-stone-500">
        {p.orders} {p.orders === 1 ? "order" : "orders"}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLanguage();
  const RANGES = [
    { key: "7d", label: t("7d") },
    { key: "30d", label: t("30d") },
    { key: "90d", label: t("90d") },
  ];
  const { exchangeRate } = useSettings();
  const fmt = useMemo(() => makeDual(exchangeRate), [exchangeRate]);
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.get("/reports/dashboard", { params: { range } }), api.get("/orders", { params: { limit: 8 } })])
      .then(([d, o]) => {
        if (cancelled) return;
        setData(d.data);
        setRecent(o.data);
        setError("");
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Could not load the dashboard.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  const compact = (v) => new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  const maxTop = Math.max(1, ...(data?.top_products || []).map((p) => p.revenue));
  const payTotal = (data?.payments || []).reduce((s, p) => s + p.revenue, 0) || 1;

  return (
    <div className="mx-auto max-w-12xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={t("dashboard")}
        subtitle={
          data
            ? `${t("today")}: ${fmt.usd(data.today.revenue)} (≈ ${fmt.khr(data.today.revenue)}) from ${data.today.orders} ${data.today.orders === 1 ? t("order") : t("orders")} · $1 = ${Math.round(fmt.rate).toLocaleString("en-US")} ៛`
            : "Sales overview"
        }
        actions={
          <div className="flex rounded-xl bg-stone-200/70 p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${range === r.key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {loading && !data ? (
        <Spinner label="Crunching the numbers…" />
      ) : error ? (
        <div className="card">
          <EmptyState icon={AlertTriangle} title="Couldn't load the dashboard" hint={error} />
        </div>
      ) : (
        <div className={loading ? "opacity-60 transition" : "transition"}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              icon={Wallet}
              label={t("revenue")}
              value={fmt.usd(data.kpis.revenue.value)}
              sub={`≈ ${fmt.khr(data.kpis.revenue.value)}`}
              change={data.kpis.revenue.change}
            />
            <Kpi icon={ReceiptText} label={t("orders")} value={data.kpis.orders.value} change={data.kpis.orders.change} />
            <Kpi
              icon={TrendingUp}
              label={t("avgOrder")}
              value={fmt.usd(data.kpis.avg_order.value)}
              sub={`≈ ${fmt.khr(data.kpis.avg_order.value)}`}
              change={data.kpis.avg_order.change}
            />
            <Kpi icon={Coffee} label={t("itemsSold")} value={data.kpis.items_sold.value} change={data.kpis.items_sold.change} />
          </div>
          {/* Analytics Revenue */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h3 className="text-base font-bold text-stone-900">{t("revenue")}</h3>
              <p className="mb-4 text-sm text-stone-500">
                {t("paidOrders")} {t("perDay")}, {t("last")} {data.range.days} {t("days")}
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c25a16" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#c25a16" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f0eeec" />
                    <XAxis
                      dataKey="day"
                      tickFormatter={fmtShortDay}
                      tick={{ fontSize: 11, fill: "#a8a29e" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${compact(v)}`}
                      tick={{ fontSize: 11, fill: "#a8a29e" }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip content={<ChartTooltip fmt={fmt} />} />
                    <Area type="monotone" dataKey="revenue" stroke="#c25a16" strokeWidth={2.5} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* best sellers */}
            <div className="card p-5">
              <h3 className="text-base font-bold text-stone-900">{t("bestSellers")}</h3>
              <p className="mb-4 text-sm text-stone-500">{t("byRevenue")}</p>
              {data.top_products.length === 0 ? (
                <p className="py-10 text-center text-sm text-stone-400">No sales in this period</p>
              ) : (
                <ul className="space-y-4">
                  {data.top_products.map((p, i) => (
                    <li key={p.name}>
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-semibold text-stone-800">
                          <span className="mr-2 text-stone-400">{i + 1}</span>
                          {p.name}
                        </span>
                        <span className="text-right tabular-nums">
                          <span className="block font-bold">{fmt.usd(p.revenue)}</span>
                          <span className="block text-xs text-stone-500">≈ {fmt.khr(p.revenue)}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(p.revenue / maxTop) * 100}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-stone-500">{p.quantity} sold</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* Payment methods */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card p-5">
              <h3 className="text-base font-bold text-stone-900">{t("paymentMethods")}</h3>
              <p className="mb-4 text-sm text-stone-500">{t("shareOfRevenue")}</p>
              {data.payments.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-400">No sales in this period</p>
              ) : (
                <ul className="space-y-3">
                  {data.payments.map((p) => (
                    <li key={p.method}>
                      <div className="flex items-start justify-between text-sm">
                        <span className="font-semibold">{PAYMENT_LABEL[p.method]}</span>
                        <span className="text-right tabular-nums text-stone-500">
                          <span className="block">
                            {fmt.usd(p.revenue)} · {Math.round((p.revenue / payTotal) * 100)}%
                          </span>
                          <span className="block text-xs">≈ {fmt.khr(p.revenue)}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-espresso" style={{ width: `${(p.revenue / payTotal) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mt-7 flex items-center gap-2 text-base font-bold text-stone-900">
                <AlertTriangle className="size-4 text-amber-500" /> Low stock
              </h3>
              <p className="mb-3 text-sm text-stone-500">At or below {data.low_stock_threshold} left</p>
              {data.low_stock.length === 0 ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Everything is well stocked 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {data.low_stock.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                      <span className="truncate font-medium">{p.product_name}</span>
                      <Badge tone={p.stock_quantity === 0 ? "red" : "amber"}>
                        {p.stock_quantity === 0 ? "Sold out" : `${p.stock_quantity} left`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Recent orders table */}
            <div className="card overflow-hidden lg:col-span-2">
              <div className="flex items-center justify-between p-5 pb-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900">{t("recentOrders")}</h3>
                  <p className="text-sm text-stone-500"> {t("latestActivity")}</p>
                </div>
                <Link to="/orders" className="text-sm font-semibold text-brand-700 hover:underline">
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="py-10 text-center text-sm text-stone-400">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base min-w-120">
                    <thead>
                      <tr>
                        <th>{t("orders")}</th>
                        <th>{t("cashiers")}</th>
                        <th>{t("date")}</th>
                        <th>{t("total")}</th>
                        <th>{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((o) => (
                        <tr key={o.id}>
                          <td className="font-bold">{o.order_no}</td>
                          <td>{o.cashier_name || "—"}</td>
                          <td className="whitespace-nowrap text-stone-500">{fmtDateTime(o.created_at)}</td>
                          <td className="whitespace-nowrap tabular-nums">
                            <div className="font-bold">{fmt.usd(o.total)}</div>
                            <div className="text-xs font-medium text-stone-500">≈ {fmt.khr(o.total)}</div>
                          </td>
                          <td>
                            <Badge tone={o.status === "paid" ? "green" : "red"}>{o.status === "paid" ? "Paid" : "Void"}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}