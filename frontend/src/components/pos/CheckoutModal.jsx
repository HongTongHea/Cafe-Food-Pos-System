import { useEffect, useMemo, useState } from "react";
import { Banknote, Loader2, QrCode } from "lucide-react";
import Modal from "../ui/Modal";
import { useLanguage } from "../../context/LanguageContext";

const KHR_NOTES = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000];
const USD_NOTES = [1, 5, 10, 20, 50, 100];

// First suggestion is always "exact", then the next notes above the amount due.
function getCashAmounts(exact, notes) {
  const suggestions = [exact];
  for (const n of notes) {
    if (n > exact) suggestions.push(n);
    if (suggestions.length >= 4) break;
  }
  return [...new Set(suggestions)];
}

export default function CheckoutModal({ open, total, fmt, onClose, onConfirm }) {
  const { t } = useLanguage();

  const methods = [
    { key: "cash", label: t("cash"), icon: Banknote },
    { key: "qr", label: t("qr"), icon: QrCode },
  ];

  const [method, setMethod] = useState("cash");
  const [cashCurrency, setCashCurrency] = useState("USD"); // currency the customer hands over
  const [received, setReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isKHR = cashCurrency === "KHR";

  // Amount due (USD is the stored currency; KHR is the rounded equivalent).
  const dueUsd = Math.round((Number(total) || 0) * 100) / 100;
  const dueKhr = fmt.toKhr(dueUsd);

  const num = Number(received) || 0;
  const receivedKhr = isKHR ? Math.round(num) : 0;
  const receivedCents = isKHR ? 0 : Math.round(num * 100);

  const enough = method !== "cash" || (isKHR ? receivedKhr >= dueKhr : receivedCents >= Math.round(dueUsd * 100));

  // Change in both currencies
  let changeUsd = 0;
  let changeKhr = 0;
  if (method === "cash" && enough) {
    if (isKHR) {
      changeKhr = Math.max(0, receivedKhr - dueKhr);
      changeUsd = changeKhr / fmt.rate;
    } else {
      changeUsd = Math.max(0, (receivedCents - Math.round(dueUsd * 100)) / 100);
      changeKhr = fmt.toKhr(changeUsd);
    }
  }

  const cashAmounts = useMemo(
    () => (isKHR ? getCashAmounts(dueKhr, KHR_NOTES) : getCashAmounts(dueUsd, USD_NOTES)),
    [isKHR, dueKhr, dueUsd]
  );

  const showAmount = (amount) => (isKHR ? fmt.khr(fmt.toUsd(amount)) : fmt.usd(amount));

  useEffect(() => {
    if (open) {
      setMethod("cash");
      setCashCurrency("USD");
      setReceived("");
      setSubmitting(false);
    }
  }, [open]);

  const submit = async () => {
    if (submitting || !enough) return;

    setSubmitting(true);

    try {
      // amount_paid is always sent in USD
      let paidUsd = dueUsd;
      if (method === "cash") {
        paidUsd = isKHR
          ? Math.max(dueUsd, Math.round(fmt.toUsd(receivedKhr) * 100) / 100)
          : receivedCents / 100;
      }
      await onConfirm({ payment_method: method, amount_paid: paidUsd });
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
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t("back")}
          </button>

          <button
            type="button"
            className="btn btn-primary min-w-40"
            onClick={submit}
            disabled={!enough || submitting}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("complatepayment")}
          </button>
        </>
      }
    >
      <div className="mb-5 rounded-2xl bg-espresso p-5 text-center text-white">
        <div className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
          {t("amountDue") === "amountDue" ? "Amount due" : t("amountDue")}
        </div>

        <div className="mt-1 font-display text-4xl font-extrabold tabular-nums">
          {fmt.usd(dueUsd)}
        </div>
        <div className="mt-1 text-xl font-bold text-stone-300 tabular-nums">
          ≈ {fmt.khr(dueUsd)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {methods.map(({ key, label, icon: Icon }) => (
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
          {/* Which currency is the customer paying in? */}
          <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1">
            {[
              { key: "USD", label: "$ Dollar" },
              { key: "KHR", label: "៛ Riel" },
            ].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  setCashCurrency(c.key);
                  setReceived("");
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${cashCurrency === c.key
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="cash-received">
              {t("cashReceived")} ({isKHR ? "៛" : "$"})
            </label>

            <input
              id="cash-received"
              className="input text-lg font-bold tabular-nums"
              type="number"
              inputMode="decimal"
              min="0"
              step={isKHR ? "100" : "0.01"}
              autoFocus
              placeholder={isKHR ? "0" : "0.00"}
              value={received}
              onChange={(event) => setReceived(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && enough && !submitting) submit();
              }}
            />

            {received !== "" && (
              <p className="mt-1 text-xs text-stone-500 tabular-nums">
                {isKHR
                  ? `= ${fmt.usd(fmt.toUsd(receivedKhr))}`
                  : `≈ ${fmt.khr(receivedCents / 100)}`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {cashAmounts.map((amount, index) => (
              <button
                key={`${cashCurrency}-${amount}-${index}`}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReceived(String(amount))}
              >
                {index === 0 ? "Exact" : isKHR ? fmt.khr(fmt.toUsd(amount)) : fmt.usd(amount)}
              </button>
            ))}
          </div>

          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${enough && received !== ""
                ? "bg-emerald-50 text-emerald-800"
                : "bg-stone-100 text-stone-500"
              }`}
          >
            <span>{t("change")}</span>
            <span className="text-right tabular-nums">
              <span className="block text-lg font-extrabold">{fmt.usd(changeUsd)}</span>
              <span className="block text-xs font-semibold opacity-80">
                ≈ {fmt.khr(changeUsd)}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-stone-100 p-4 text-center text-sm text-stone-600">
          {t("paymentnote")}
        </p>
      )}
    </Modal>
  );
}