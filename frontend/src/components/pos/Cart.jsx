import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import ProductArt from "../ui/ProductArt";
import { useLanguage } from "../../context/LanguageContext";

function Segmented({ options, value, onChange }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col rounded-xl bg-stone-100 p-1">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${value === option.key
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-800"
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// One totals row: label on the left, USD on top and ≈ KHR below on the right.
function DualRow({ label, usd, khr, className = "", prefix = "" }) {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <dt>{label}</dt>
      <dd className="text-right tabular-nums">
        <div>
          {prefix}
          {usd}
        </div>
        <div className="text-xs font-medium opacity-70">
          ≈ {prefix}
          {khr}
        </div>
      </dd>
    </div>
  );
}

export default function Cart({
  lines,
  totals,
  fmt,
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

  const discounts = [
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
          <button
            type="button"
            onClick={onClear}
            className="btn btn-ghost btn-sm bg-red-100 text-red-600 hover:bg-red-200"
          >
            <Trash2 className="size-3.5" />
            {t("deleteall")}
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
            placeholder={`${t("tableNo")} (optional)`}
            value={tableNo}
            maxLength={20}
            onChange={(event) => setTableNo(event.target.value)}
          />
        )}
      </div>

      {/* Cart items */}
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
                <ProductArt
                  product={product}
                  className="size-12 shrink-0 rounded-xl"
                  iconClass="size-5"
                />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-stone-800">
                    {product.product_name}
                  </div>
                  <div className="text-xs text-stone-500 tabular-nums">
                    {fmt.usd(product.price)} · ≈ {fmt.khr(product.price)}
                  </div>
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

                <div className="w-24 text-right tabular-nums">
                  <div className="text-sm font-bold">{fmt.usd(product.price * qty)}</div>
                  <div className="text-xs text-stone-500">≈ {fmt.khr(product.price * qty)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Totals and discount */}
      <div className="space-y-3 border-t border-stone-100 bg-stone-50/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-stone-500">
            {t("Discount")}
          </span>

          <div className="flex-1">
            <Segmented
              options={discounts}
              value={discountType}
              onChange={(key) => {
                setDiscountType(key);
                if (key === "none") setDiscountValue("");
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
            onChange={(event) => setDiscountValue(event.target.value)}
          />
        )}

        <dl className="space-y-1.5 text-sm">
          <DualRow
            label={t("Subtotal")}
            usd={fmt.usd(totals.subtotal)}
            khr={fmt.khr(totals.subtotal)}
            className="text-stone-600"
          />

          {totals.discount > 0 && (
            <DualRow
              label={t("Discount")}
              usd={fmt.usd(totals.discount)}
              khr={fmt.khr(totals.discount)}
              prefix="− "
              className="text-emerald-700"
            />
          )}

          {taxRate > 0 && (
            <DualRow
              label={`${t("Tax")} (${taxRate}%)`}
              usd={fmt.usd(totals.tax)}
              khr={fmt.khr(totals.tax)}
              className="text-stone-600"
            />
          )}

          <div className="flex items-start justify-between border-t border-dashed border-stone-300 pt-2 text-stone-900">
            <dt className="text-lg font-extrabold">{t("total")}</dt>
            <dd className="text-right tabular-nums">
              <div className="text-lg font-extrabold">{fmt.usd(totals.total)}</div>
              <div className="text-sm font-bold text-stone-500">≈ {fmt.khr(totals.total)}</div>
            </dd>
          </div>
        </dl>

        <button
          type="button"
          className="btn btn-primary w-full py-3.5 text-base"
          disabled={empty}
          onClick={onCharge}
        >
          {t("charge")} {fmt.usd(totals.total)} · ≈ {fmt.khr(totals.total)}
        </button>
      </div>
    </div>
  );
}