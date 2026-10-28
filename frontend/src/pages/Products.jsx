import { useCallback, useEffect, useMemo, useState } from "react";
import { Package, Pencil, Plus, Search, Tags, Trash2 } from "lucide-react";
import api, { errorMessage } from "../api/client";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import Pager, { usePaged } from "../components/ui/Pager";
import ProductArt from "../components/ui/ProductArt";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ProductFormModal from "../components/ProductFormModal";
import CategoriesModal from "../components/CategoriesModal";
import { useLanguage } from "../context/LanguageContext";
import { makeDual } from "../utils/format";

export default function Products() {
  const { t } = useLanguage();
  const { exchangeRate } = useSettings();
  const fmt = useMemo(() => makeDual(exchangeRate), [exchangeRate]);
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [catsOpen, setCatsOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.get("/products"), api.get("/categories")]);
      setProducts(p.data);
      setCategories(c.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Could not load products."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!q || p.product_name.toLowerCase().includes(q)) &&
        (!catFilter || String(p.category_id) === catFilter) &&
        (!statusFilter || (statusFilter === "active" ? p.is_active === 1 : p.is_active === 0))
    );
  }, [products, query, catFilter, statusFilter]);

  const paged = usePaged(filtered, 10);

  const save = async (data) => {
    try {
      if (editing) await api.put(`/products/${editing.id}`, data);
      else await api.post("/products", data);
    } catch (err) {
      throw new Error(errorMessage(err));
    }
    toast.success(editing ? "Product updated" : "Product added");
    setFormOpen(false);
    await load();
  };

  const toggleActive = async (p) => {
    try {
      await api.put(`/products/${p.id}`, { ...p, is_active: p.is_active !== 1 });
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/products/${deleting.id}`);
      toast.success("Product deleted");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-12xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={t("products")}
        subtitle={`${products.length} ${t("itemsOnMenu")} · $1 = ${Math.round(fmt.rate).toLocaleString("en-US")} ៛`}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setCatsOpen(true)}>
              <Tags className="size-4" /> {t("categories")}
            </button>
            <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="size-4" /> {t("addProduct")}
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 p-4">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400" />
            <input className="input py-2 pl-10" placeholder={t("searchProduct")} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="input w-auto py-2" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Category">
            <option value=""> {t("allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="input w-auto py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
            <option value="">{t("allStatuses")}</option>
            <option value="active">{t("available")}</option>
            <option value="inactive">{t("hidden")}</option>
          </select>
        </div>

        {loading ? (
          <Spinner label="Loading products…" />
        ) : error ? (
          <EmptyState icon={Package} title="Couldn't load products" hint={error} action={<button className="btn btn-primary" onClick={load}>Try again</button>} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={products.length ? "No matching products" : "No products yet"}
            hint={products.length ? "Try changing the filters." : "Add your first menu item to get started."}
            action={!products.length && <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="size-4" /> Add product</button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base min-w-190">
                <thead>
                  <tr>
                    <th>{t("products")}</th>
                    <th>{t("categories")}</th>
                    <th>{t("price")}</th>
                    <th>{t("stock")}</th>
                    <th>{t("available")}</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {paged.slice.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <ProductArt product={p} className="size-11 shrink-0 rounded-xl" iconClass="size-5" />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-stone-900">{p.product_name}</div>
                            {p.description && <div className="max-w-xs truncate text-xs text-stone-500">{p.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{p.category || <span className="text-stone-400">—</span>}</td>
                      <td className="tabular-nums">
                        <div className="font-bold">{fmt.usd(p.price)}</div>
                        <div className="text-xs font-medium text-stone-500">≈ {fmt.khr(p.price)}</div>
                      </td>
                      <td>
                        {p.track_stock ? (
                          <Badge tone={p.stock_quantity === 0 ? "red" : p.stock_quantity <= 5 ? "amber" : "green"}>
                            {p.stock_quantity === 0 ? "Sold out" : `${p.stock_quantity} in stock`}
                          </Badge>
                        ) : (
                          <span className="text-xs text-stone-400">Not tracked</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={p.is_active === 1}
                          aria-label={`${p.product_name} available`}
                          onClick={() => toggleActive(p)}
                          className={`relative h-6 w-11 rounded-full transition ${p.is_active ? "bg-emerald-500" : "bg-stone-300"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition ${p.is_active ? "translate-x-5" : ""}`} />
                        </button>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button className="btn-icon" aria-label={`Edit ${p.product_name}`} onClick={() => { setEditing(p); setFormOpen(true); }}>
                            <Pencil className="size-4" />
                          </button>
                          <button className="btn-icon hover:text-red-600" aria-label={`Delete ${p.product_name}`} onClick={() => setDeleting(p)}>
                            <Trash2 className="size-4" />
                          </button>
                        </div>
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

      <ProductFormModal open={formOpen} product={editing} categories={categories} onClose={() => setFormOpen(false)} onSave={save} />
      <CategoriesModal open={catsOpen} categories={categories} onClose={() => setCatsOpen(false)} onChanged={load} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title={t("deleteProduct")}
        message={`"${deleting?.product_name}" ${t("notedeleteProduct")}`}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        danger
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}