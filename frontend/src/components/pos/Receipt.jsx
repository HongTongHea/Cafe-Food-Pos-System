import { useMemo } from "react";
import { Printer } from "lucide-react";
import Modal from "../ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import {
  fmtDateTime,
  makeDual,
  ORDER_TYPE_LABEL,
  PAYMENT_LABEL,
} from "../../utils/format";
import { useLanguage } from "../../context/LanguageContext";

// `sub` is an optional second line under the value (used for the ≈ KHR amount).
function Row({ label, value, sub, bold = false, className = "" }) {
  return (
    <div
      className={`flex justify-between gap-3 ${bold ? "text-base font-bold" : ""
        } ${className}`}
    >
      <span>{label}</span>
      <span className="text-right tabular-nums">
        <span className="block">{value}</span>
        {sub && (
          <span className="block text-xs font-normal text-stone-500">
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

export function ReceiptBody({ order }) {
  const { shopName, exchangeRate } = useSettings();
  const fmt = useMemo(() => makeDual(exchangeRate), [exchangeRate]);
  const { t } = useLanguage();
  const isVoid = order.status === "void";

  // Shorthand: USD value + "≈ KHR" sub line
  const dual = (v, prefix = "") => ({
    value: `${prefix}${fmt.usd(v)}`,
    sub: `≈ ${prefix}${fmt.khr(v)}`,
  });

  return (
    <div
      id="receipt-print"
      className="relative mx-auto w-full max-w-85 rounded-xl border border-dashed border-stone-300 bg-white p-5 font-mono text-[13px] leading-relaxed text-stone-800"
    >
      {isVoid && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="-rotate-12 rounded-lg border-4 border-red-500/70 px-4 py-1 text-4xl font-black tracking-widest text-red-500/70">
            VOID
          </span>
        </div>
      )}

      <div className="text-center">
        <div className="font-display text-lg font-extrabold">
          {shopName}
        </div>
        <div className="text-xs text-stone-500">
          {t("thank_you_visit")}
        </div>
      </div>

      <hr className="my-3 border-dashed border-stone-300" />

      <div className="space-y-0.5 text-xs">
        <Row label={t("orders")} value={order.order_no} bold />
        <Row
          label={t("date")}
          value={fmtDateTime(order.created_at)}
        />
        <Row
          label={t("cashiers")}
          value={order.cashier_name || "—"}
        />
        <Row
          label={t("type")}
          value={`${ORDER_TYPE_LABEL[order.order_type]}${order.table_no
            ? ` · ${t("table")} ${order.table_no}`
            : ""
            }`}
        />
      </div>

      <hr className="my-3 border-dashed border-stone-300" />

      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between gap-3">
              <span className="min-w-0 wrap-break-word">
                {item.product_name}
              </span>
              <span className="text-right tabular-nums">
                <span className="block">{fmt.usd(item.line_total)}</span>
                <span className="block text-xs text-stone-500">
                  ≈ {fmt.khr(item.line_total)}
                </span>
              </span>
            </div>

            <div className="text-xs text-stone-500">
              {item.quantity} × {fmt.usd(item.unit_price)}
            </div>
          </div>
        ))}
      </div>

      <hr className="my-3 border-dashed border-stone-300" />

      <div className="space-y-1">
        <Row label={t("Subtotal")} {...dual(order.subtotal)} />

        {order.discount > 0 && (
          <Row label={t("discount")} {...dual(order.discount, "− ")} />
        )}

        {order.tax > 0 && (
          <Row label={t("tax")} {...dual(order.tax)} />
        )}

        <Row
          label={t("total")}
          {...dual(order.total)}
          bold
          className="pt-1"
        />
      </div>

      <hr className="my-3 border-dashed border-stone-300" />

      <div className="space-y-1 text-xs">
        <Row
          label={t("payment")}
          value={PAYMENT_LABEL[order.payment_method]}
        />

        <Row label={t("paid")} {...dual(order.amount_paid)} />

        {order.change_amount > 0 && (
          <Row label={t("change")} {...dual(order.change_amount)} />
        )}
      </div>

      {isVoid && order.void_reason && (
        <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
          {t("void")}: {order.void_reason}
        </p>
      )}

      {order.note && (
        <p className="mt-3 text-xs text-stone-500">
          {t("note")}: {order.note}
        </p>
      )}

      <p className="mt-4 text-center text-[11px] text-stone-500 tabular-nums">
        $1 = {Math.round(fmt.rate).toLocaleString("en-US")} ៛
      </p>

      <p className="mt-2 text-center text-xs text-stone-400">
        - {t("see_you_again")} -
      </p>
    </div>
  );
}

// extraActions: extra buttons rendered in the footer (e.g. Void order)
export default function ReceiptModal({
  order,
  onClose,
  extraActions,
  closeLabel = "Close",
}) {
  const { t } = useLanguage();

  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={
        order
          ? `${t("receipt")} ${order.order_no}`
          : t("receipt")
      }
      size="sm"
      footer={
        <>
          {extraActions}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            {t("print")}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            {t("close")}
          </button>
        </>
      }
    >
      {order && <ReceiptBody order={order} />}
    </Modal>
  );
}