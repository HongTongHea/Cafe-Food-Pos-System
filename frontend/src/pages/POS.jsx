import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronUp, Search, ShoppingBag, X } from "lucide-react";
import api, { errorMessage } from "../api/client";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";
import { computeTotals } from "../utils/totals";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import ProductArt from "../components/ui/ProductArt";
import Cart from "../components/pos/Cart";
import CheckoutModal from "../components/pos/CheckoutModal";
import ReceiptModal from "../components/pos/Receipt";
import { useLanguage } from "../context/LanguageContext";
import { makeDual } from "../utils/format";

const MAX_PER_LINE = 99;

function ProductCard({ product, qtyInCart, onAdd, fmt }) {
  const soldOut = product.track_stock === 1 && product.stock_quantity <= 0;
  const low = product.track_stock === 1 && product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => onAdd(product)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-[0_1px_2px_rgba(28,20,16,0.04)] transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      <ProductArt product={product} className="h-24 w-full sm:h-28" iconClass="size-9" />

      {qtyInCart > 0 && (
        <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow">
          {qtyInCart}
        </span>
      )}
      {soldOut && (
        <span className="absolute top-2 left-2 rounded-full bg-stone-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">
          Sold out
        </span>
      )}
      {low && (
        <span className="absolute top-2 left-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
          {product.stock_quantity} left
        </span>
      )}

      <div className="flex flex-1 flex-col justify-between gap-2 p-3">
        <div className="line-clamp-2 text-sm leading-snug font-semibold text-stone-800">{product.product_name}</div>
        <div>
          <div className="font-display text-base font-extrabold text-brand-700 tabular-nums">
            {fmt.usd(product.price)}
          </div>
          <div className="text-xs font-semibold text-stone-500 tabular-nums">≈ {fmt.khr(product.price)}</div>
        </div>
      </div>
    </button>
  );
}

export default function POS() {
  const { t } = useLanguage();
  const { taxRate, exchangeRate } = useSettings();
  const fmt = useMemo(() => makeDual(exchangeRate), [exchangeRate]);
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  const [cart, setCart] = useState([]); // [{ id, qty }]
  const [orderType, setOrderType] = useState("dine_in");
  const [tableNo, setTableNo] = useState("");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.get("/products?active=1"), api.get("/categories")]);
      setProducts(p.data);
      setCategories(c.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Could not load the menu."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Cart lines always use live product data (price, stock) so nothing goes stale.
  const lines = useMemo(
    () => cart.map((c) => ({ product: byId.get(c.id), qty: c.qty })).filter((l) => l.product),
    [cart, byId]
  );
  const cartQty = useMemo(() => new Map(cart.map((c) => [c.id, c.qty])), [cart]);

  const totals = useMemo(
    () =>
      computeTotals({
        lines: lines.map((l) => ({ price: l.product.price, qty: l.qty })),
        discountType,
        discountValue,
        taxRate,
      }),
    [lines, discountType, discountValue, taxRate]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (activeCat === "all" || p.category_id === activeCat) &&
        (!q || p.product_name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q))
    );
  }, [products, activeCat, query]);

  const maxFor = (p) => (p.track_stock ? Math.min(p.stock_quantity, MAX_PER_LINE) : MAX_PER_LINE);

  const setQty = (product, qty) => {
    if (qty <= 0) {
      setCart((cur) => cur.filter((c) => c.id !== product.id));
      return;
    }
    const max = maxFor(product);
    if (qty > max) {
      toast.error(product.track_stock ? `Only ${product.stock_quantity} left in stock` : "Maximum quantity reached");
      return;
    }
    setCart((cur) =>
      cur.some((c) => c.id === product.id)
        ? cur.map((c) => (c.id === product.id ? { ...c, qty } : c))
        : [...cur, { id: product.id, qty }]
    );
  };

  const add = (product) => setQty(product, (cartQty.get(product.id) || 0) + 1);

  const resetOrder = () => {
    setCart([]);
    setTableNo("");
    setDiscountType("none");
    setDiscountValue("");
  };

  // amount_paid is always sent in USD (the currency prices are stored in).
  const confirmPayment = async ({ payment_method, amount_paid }) => {
    try {
      const res = await api.post("/orders", {
        items: cart.map((c) => ({ product_id: c.id, quantity: c.qty })),
        order_type: orderType,
        table_no: tableNo || undefined,
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        payment_method,
        amount_paid,
      });
      setCheckoutOpen(false);
      setCartOpen(false);
      setReceipt(res.data);
      resetOrder();
      load(); // refresh stock levels
    } catch (err) {
      toast.error(errorMessage(err, "Payment failed. Nothing was charged."));
      if (err.response?.status === 409 || err.response?.status === 400) load();
    }
  };

  const cartProps = {
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
    onQty: setQty,
    onClear: resetOrder,
    onCharge: () => setCheckoutOpen(true),
  };

  return (
    <div className="flex h-full">
      {/* ---------------- menu ---------------- */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="space-y-4 px-6 pt-6 sm:px-6 sm:pt-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">{t("pos")}</h1>
              <p className="text-sm text-stone-500">
                {t("tapItemsToAddToOrder")}
                <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600 tabular-nums">
                  $1 = {Math.round(fmt.rate).toLocaleString("en-US")} ៛
                </span>
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400" />
              <input
                className="input pl-10"
                placeholder={t("searchMenu")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-stone-400 hover:text-stone-700"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="scroll-thin -mx-1 flex gap-2 overflow-x-auto px-1 py-2 pb-1">
            {[{ id: "all", name: "All", product_count: products.length }, ...categories].map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${activeCat === c.id
                    ? "bg-espresso text-white shadow"
                    : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
                  }`}
              >
                {c.name}
                <span
                  className={`rounded-full px-1.5 text-xs ${activeCat === c.id ? "bg-white/15" : "bg-stone-100 text-stone-500"
                    }`}
                >
                  {c.id === "all" ? c.product_count : products.filter((p) => p.category_id === c.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-28 lg:pb-6">
          {loading ? (
            <Spinner label="Loading menu…" />
          ) : error ? (
            <EmptyState
              icon={ShoppingBag}
              title="Couldn't load the menu"
              hint={error}
              action={
                <button className="btn btn-primary" onClick={load}>
                  Try again
                </button>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title={products.length ? "No matching items" : "The menu is empty"}
              hint={products.length ? "Try another search or category." : "Ask an admin to add products."}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} qtyInCart={cartQty.get(p.id) || 0} onAdd={add} fmt={fmt} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- cart (desktop) ---------------- */}
      <aside className="hidden w-90 shrink-0 border-l border-stone-200 bg-white lg:block xl:w-100">
        <Cart {...cartProps} />
      </aside>

      {/* ---------------- cart (mobile / tablet) ---------------- */}
      {lines.length > 0 && !cartOpen && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="anim-pop fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-2xl bg-brand-600 px-5 py-4 text-white shadow-xl shadow-brand-900/30 lg:hidden"
        >
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingBag className="size-5" />
            {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"} · View order
            <ChevronUp className="size-4" />
          </span>
          <span className="text-right">
            <span className="block text-lg leading-tight font-extrabold tabular-nums">{fmt.usd(totals.total)}</span>
            <span className="block text-xs font-semibold text-white/80 tabular-nums">
              ≈ {fmt.khr(totals.total)}
            </span>
          </span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="anim-fade absolute inset-0 bg-espresso/50" onClick={() => setCartOpen(false)} />
          <div className="anim-slide-up absolute inset-x-0 bottom-0 flex h-[90dvh] flex-col rounded-t-3xl bg-white">
            <button
              type="button"
              className="absolute top-4 right-4 z-10 btn-icon"
              onClick={() => setCartOpen(false)}
              aria-label="Close order"
            >
              <X className="size-5" />
            </button>
            <Cart {...cartProps} />
          </div>
        </div>
      )}

      <CheckoutModal
        open={checkoutOpen}
        total={totals.total}
        fmt={fmt}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={confirmPayment}
      />

      <ReceiptModal order={receipt} onClose={() => setReceipt(null)} closeLabel="New order" />
    </div>
  );
}