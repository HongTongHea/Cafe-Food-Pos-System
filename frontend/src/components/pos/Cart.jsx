import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import ProductArt from "../ui/ProductArt";
import { useLanguage } from "../../context/LanguageContext";



function Segmented({ options, value, onChange }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col rounded-xl bg-stone-100 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${value === o.key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
            }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Cart({
  lines,
  totals,
  money,
  taxRate,
  orderType,
  setOrderType,
  tableNo,
  setTableNo,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  onQty,
  onClear,
  onCharge,
}) {
  const { t } = useLanguage();
  const DISCOUNTS = [
    { key: "none", label: t("none") },
    { key: "percent", label: t("percent") },
    { key: "amount", label: t("amount") },
  ];
  const empty = lines.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col items-start justify-between gap-3 px-5 pt-5 md:flex-row">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900">{t("currentOrder")}</h2>
          <p className="text-xs text-stone-500">
            {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        {!empty && (
          <button type="button" onClick={onClear} className="btn btn-ghost btn-sm text-red-600 bg-red-100 hover:bg-red-200">
            <Trash2 className="size-3.5" /> {t("deleteall")}
          </button>
        )}
      </div>

      <div className="space-y-3 px-5 pt-4">
        <Segmented
          options={[
            { key: "dine_in", label: t("dineIn") },
            { key: "takeaway", label: t("takeaway") },
          ]}
          value={orderType}
          onChange={setOrderType}
        />
        {orderType === "dine_in" && (
          <input
            className="input"
            placeholder={t("tableNo") + " (optional)"}
            value={tableNo}
            maxLength={20}
            onChange={(e) => setTableNo(e.target.value)}
          />
        )}
      </div>

      {/* lines */}
      <div className="scroll-thin mt-4 min-h-0 flex-1 overflow-y-auto px-5">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center text-stone-400">
            <ShoppingBag className="mb-3 size-10" strokeWidth={1.4} />
            <p className="text-sm font-medium text-stone-500">{t("no_items")}</p>
            <p className="text-xs">{t("tap_add_items")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {lines.map(({ product, qty }) => (
              <li key={product.id} className="flex items-center gap-3 py-3">
                <ProductArt product={product} className="size-12 shrink-0 rounded-xl" iconClass="size-5" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-stone-800">{product.product_name}</div>
                  <div className="text-xs text-stone-500">{money(product.price)}</div>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-0.5">
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-lg text-stone-600 hover:bg-white"
                    onClick={() => onQty(product, qty - 1)}
                    aria-label={`Remove one ${product.product_name}`}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-lg text-stone-600 hover:bg-white"
                    onClick={() => onQty(product, qty + 1)}
                    aria-label={`Add one ${product.product_name}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <div className="w-16 text-right text-sm font-bold tabular-nums">{money(product.price * qty)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* totals */}
      <div className="space-y-3 border-t border-stone-100 bg-stone-50/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-semibold tracking-wide text-stone-500 uppercase">{t("Discount")}</span>
          <div className="flex-1">
            <Segmented
              options={DISCOUNTS}
              value={discountType}
              onChange={(k) => {
                setDiscountType(k);
                if (k === "none") setDiscountValue("");
              }}
            />
          </div>
        </div>
        {discountType !== "none" && (
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min="0"
            max={discountType === "percent" ? 100 : undefined}
            step="any"
            placeholder={discountType === "percent" ? t("percentoff") : t("amountoff")}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
          />
        )}

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <dt>{t("Subtotal")}</dt>
            <dd className="tabular-nums">{money(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>{t("Discount")}</dt>
              <dd className="tabular-nums">− {money(totals.discount)}</dd>
            </div>
          )}
          {taxRate > 0 && (
            <div className="flex justify-between text-stone-600">
              <dt>{t("Tax")} ({taxRate}%)</dt>
              <dd className="tabular-nums">{money(totals.tax)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-dashed border-stone-300 pt-2 text-lg font-extrabold text-stone-900">
            <dt>{t("total")}</dt>
            <dd className="tabular-nums">{money(totals.total)}</dd>
          </div>
        </dl>

        <button type="button" className="btn btn-primary w-full py-3.5 text-base" disabled={empty} onClick={onCharge}>
          {t("charge")} {money(totals.total)}
        </button>
      </div>
    </div>
  );
}
