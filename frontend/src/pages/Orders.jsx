import { useEffect, useMemo, useState } from "react";
import { Ban, ReceiptText, Search } from "lucide-react";
import api, { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";
import { addDays, fmtDateTime, ORDER_TYPE_LABEL, PAYMENT_LABEL } from "../utils/format";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import Pager, { usePaged } from "../components/ui/Pager";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ReceiptModal from "../components/pos/Receipt";
import { useLanguage } from "../context/LanguageContext";



export default function Orders() {
  const { t } = useLanguage();
  const RANGES = [
    { key: "today", label: t("today") },
    { key: "7d", label: t("7d") },
    { key: "30d", label: t("30d") },
    { key: "90d", label: t("90d") },
    { key: "all", label: t("all") },
  ];
  const { isAdmin } = useAuth();
  const { money, today } = useSettings();
  const toast = useToast();

  const [range, setRange] = useState("today");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState(null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { from, to } = useMemo(() => {
    if (range === "today") return { from: today, to: today };
    if (range === "7d") return { from: addDays(today, -6), to: today };
    if (range === "30d") return { from: addDays(today, -29), to: today };
    if (range === "custom") return custom;
    return { from: "", to: "" };
  }, [range, today, custom]);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/orders", { params: { from: from || undefined, to: to || undefined, status: status || undefined, q: debounced || undefined, limit: 500 } })
      .then((res) => !cancelled && (setOrders(res.data), setError("")))
      .catch((err) => !cancelled && setError(errorMessage(err, "Could not load orders.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, to, status, debounced, reloadKey]);

  const summary = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid");
    return {
      count: paid.length,
      revenue: paid.reduce((s, o) => s + o.total, 0),
      voided: orders.length - paid.length,
    };
  }, [orders]);

  const paged = usePaged(orders, 12);

  const openOrder = async (id) => {
    try {
      const res = await api.get(`/orders/${id}`);
      setDetail(res.data);
    } catch (err) {
      toast.error(errorMessage(err, "Could not open this order."));
    }
  };

  const doVoid = async () => {
    setVoiding(true);
    try {
      const res = await api.post(`/orders/${detail.id}/void`, { reason: voidReason });
      toast.success(`Order ${res.data.order_no} voided`);
      setDetail(res.data);
      setVoidOpen(false);
      setVoidReason("");
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(errorMessage(err, "Could not void this order."));
    } finally {
      setVoiding(false);
    }
  };

  return (
    <div className="mx-auto max-w-12xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={t("orders")}
        subtitle={isAdmin ? t("everySaleAcrossTheShop") : t("yourSales")}
      />

      {/* summary */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: t("paidOrders"), value: summary.count },
          { label: t("revenue"), value: money(summary.revenue) },
          { label: t("voided"), value: summary.voided },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3 sm:px-5 sm:py-4">
            <div className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{s.label}</div>
            <div className="mt-1 font-display text-xl font-extrabold text-stone-900 tabular-nums sm:text-2xl">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 p-4">
          <div className="flex rounded-xl bg-stone-100 p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${range === r.key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input w-auto py-2"
              value={range === "custom" ? custom.from : from}
              max={to || undefined}
              onChange={(e) => {
                setCustom({ from: e.target.value, to: range === "custom" ? custom.to : to });
                setRange("custom");
              }}
              aria-label="From date"
            />
            <span className="text-stone-400">→</span>
            <input
              type="date"
              className="input w-auto py-2"
              value={range === "custom" ? custom.to : to}
              min={from || undefined}
              onChange={(e) => {
                setCustom({ from: range === "custom" ? custom.from : from, to: e.target.value });
                setRange("custom");
              }}
              aria-label="To date"
            />
          </div>

          <select className="input w-auto py-2" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">{t("allStatuses")}</option>
            <option value="paid">{t("paidOrders")}</option>
            <option value="void">{t("voided")}</option>
          </select>

          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400" />
            <input className="input py-2 pl-10" placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <Spinner label="Loading orders…" />
        ) : error ? (
          <EmptyState icon={ReceiptText} title="Couldn't load orders" hint={error} />
        ) : orders.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No orders found" hint="Try a different date range or filter." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base min-w-190">
                <thead>
                  <tr>
                    <th>{t("orders")}</th>
                    <th>{t("date")}</th>
                    <th>{t("cahiers")}</th>
                    <th>{t("type")}</th>
                    <th className="text-right">{t("items")}</th>
                    <th>{t("payment")}</th>
                    <th className="text-right">{t("total")}</th>
                    <th>{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.slice.map((o) => (
                    <tr key={o.id} className="row-click" onClick={() => openOrder(o.id)}>
                      <td className="font-bold text-stone-900">{o.order_no}</td>
                      <td className="whitespace-nowrap text-stone-500">{fmtDateTime(o.created_at)}</td>
                      <td>{o.cashier_name || "—"}</td>
                      <td>
                        {ORDER_TYPE_LABEL[o.order_type]}
                        {o.table_no && <span className="text-stone-400"> · T{o.table_no}</span>}
                      </td>
                      <td className="text-right tabular-nums">{o.item_count}</td>
                      <td>{PAYMENT_LABEL[o.payment_method]}</td>
                      <td className="text-right font-bold tabular-nums">{money(o.total)}</td>
                      <td>
                        <Badge tone={o.status === "paid" ? "green" : "red"}>{o.status === "paid" ? "Paid" : "Void"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager {...paged} />
          </>
        )}
      </div>

      <ReceiptModal
        order={detail}
        onClose={() => setDetail(null)}
        extraActions={
          isAdmin && detail?.status === "paid" ? (
            <button type="button" className="btn btn-secondary text-red-600" onClick={() => setVoidOpen(true)}>
              <Ban className="size-4" /> Void order
            </button>
          ) : null
        }
      />

      <ConfirmDialog
        open={voidOpen}
        title={`Void ${detail?.order_no || "order"}?`}
        message="The sale will be removed from revenue and stock will be returned. This can't be undone."
        confirmText="Void order"
        danger
        loading={voiding}
        disabled={!voidReason.trim()}
        onConfirm={doVoid}
        onClose={() => setVoidOpen(false)}
      >
        <label className="label mt-4" htmlFor="void-reason">
          Reason
        </label>
        <input
          id="void-reason"
          className="input"
          placeholder="e.g. Customer changed their mind"
          value={voidReason}
          maxLength={255}
          onChange={(e) => setVoidReason(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
