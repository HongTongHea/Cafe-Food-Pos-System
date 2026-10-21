import { useEffect, useState } from "react";
import { Banknote, CreditCard, Loader2, QrCode } from "lucide-react";
import Modal from "../ui/Modal";
import { quickCashAmounts } from "../../utils/totals";
import { useLanguage } from "../../context/LanguageContext";



export default function CheckoutModal({ open, total, money, onClose, onConfirm }) {
  const { t } = useLanguage();
  const METHODS = [
    { key: "cash", label: t("cash"), icon: Banknote },
    // { key: "card", label: t("card"), icon: CreditCard },
    { key: "qr", label: t("qr"), icon: QrCode },
  ];
  const [method, setMethod] = useState("cash");
  const [received, setReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // start fresh every time the modal opens
  useEffect(() => {
    if (open) {
      setMethod("cash");
      setReceived("");
      setSubmitting(false);
    }
  }, [open]);

  const receivedCents = Math.round((Number(received) || 0) * 100);
  const totalCents = Math.round(total * 100);
  const enough = method !== "cash" || receivedCents >= totalCents;
  const change = Math.max(0, receivedCents - totalCents) / 100;

  const submit = async () => {
    setSubmitting(true);
    try {
      await onConfirm({ payment_method: method, amount_paid: method === "cash" ? Number(received) : total });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title={t("takepayment")}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            {t("back")}
          </button>
          <button type="button" className="btn btn-primary min-w-40" onClick={submit} disabled={!enough || submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("complatepayment")}
          </button>
        </>
      }
    >
      <div className="mb-5 rounded-2xl bg-espresso p-5 text-center text-white">
        <div className="text-xs font-semibold tracking-widest text-stone-400 uppercase">Amount due</div>
        <div className="mt-1 font-display text-4xl font-extrabold tabular-nums">{money(total)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {METHODS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMethod(key)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${method === key
              ? "border-brand-600 bg-brand-50 text-brand-800"
              : "border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </div>

      {method === "cash" ? (
        <div className="mt-5 space-y-3">
          <div>
            <label className="label" htmlFor="cash-received">
              {t("cashReceived")}
            </label>
            <input
              id="cash-received"
              className="input text-lg font-bold tabular-nums"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              autoFocus
              placeholder="0.00"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enough && !submitting && submit()}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickCashAmounts(total).map((amount, i) => (
              <button
                key={amount}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReceived(String(amount))}
              >
                {i === 0 ? "Exact" : money(amount)}
              </button>
            ))}
          </div>

          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${enough && received ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-500"
              }`}
          >
            <span>{t("change")}</span>
            <span className="text-lg font-extrabold tabular-nums">{money(change)}</span>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-stone-100 p-4 text-center text-sm text-stone-600">
          {method === "card"
            ? "Process the card on your terminal, then tap Complete payment."
            : t("paymentnote")}
        </p>
      )}
    </Modal>
  );
}
