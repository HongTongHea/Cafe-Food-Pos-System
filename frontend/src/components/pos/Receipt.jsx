import { Printer } from "lucide-react";
import Modal from "../ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { fmtDateTime, ORDER_TYPE_LABEL, PAYMENT_LABEL } from "../../utils/format";
import { useLanguage } from "../../context/LanguageContext";

function Row({ label, value, bold = false, className = "" }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "text-base font-bold" : ""} ${className}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function ReceiptBody({ order }) {
  const { shopName, money } = useSettings();
  const isVoid = order.status === "void";

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
        <div className="font-display text-lg font-extrabold">{shopName}</div>
        <div className="text-xs text-stone-500">Thank you for your visit</div>
      </div>

      <hr className="my-3 border-dashed border-stone-300" />

      <div className="space-y-0.5 text-xs">
        <Row label="Order" value={order.order_no} bold />
        <Row label="Date" value={fmtDateTime(order.created_at)} />
        <Row label="Cashier" value={order.cashier_name || "—"} />
        <Row
          label="Type"
          value={`${ORDER_TYPE_LABEL[order.order_type]}${order.table_no ? ` · Table ${order.table_no}` : ""}`}
        />
      </div>

      <hr className="my-3 border-dashed border-stone-300" />

      <div className="space-y-1.5">
        {order.items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between gap-3">
              <span className="min-w-0 wrap-break-word">{item.product_name}</span>
              <span className="tabular-nums">{money(item.line_total)}</span>
            </div>
            <div className="text-xs text-stone-500">
              {item.quantity} × {money(item.unit_price)}
            </div>
          </div>
        ))}
      </div>

      <hr className="my-3 border-dashed border-stone-300" />

      <div className="space-y-0.5">
        <Row label="Subtotal" value={money(order.subtotal)} />
        {order.discount > 0 && <Row label="Discount" value={`− ${money(order.discount)}`} />}
        {order.tax > 0 && <Row label="Tax" value={money(order.tax)} />}
        <Row label="TOTAL" value={money(order.total)} bold className="pt-1" />
      </div>

      <hr className="my-3 border-dashed border-stone-300" />

      <div className="space-y-0.5 text-xs">
        <Row label="Payment" value={PAYMENT_LABEL[order.payment_method]} />
        <Row label="Paid" value={money(order.amount_paid)} />
        {order.change_amount > 0 && <Row label="Change" value={money(order.change_amount)} />}
      </div>

      {isVoid && order.void_reason && (
        <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">Voided: {order.void_reason}</p>
      )}
      {order.note && <p className="mt-3 text-xs text-stone-500">Note: {order.note}</p>}

      <p className="mt-4 text-center text-xs text-stone-400">— See you again —</p>
    </div>
  );
}

// extraActions: extra buttons rendered in the footer (e.g. "Void order")
export default function ReceiptModal({ order, onClose, extraActions, closeLabel = "Close" }) {
  const { t } = useLanguage();
  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={order ? `${t("receipt")} ${order.order_no}` : t("receipt")}
      size="sm"
      footer={
        <>
          {extraActions}
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {closeLabel}
          </button>
        </>
      }
    >
      {order && <ReceiptBody order={order} />}
    </Modal>
  );
}
