import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Modal from "./ui/Modal";
import ProductArt from "./ui/ProductArt";
import { useLanguage } from "../context/LanguageContext";

const EMPTY = {
  product_name: "",
  category_id: "",
  price: "",
  description: "",
  image_url: "",
  track_stock: false,
  stock_quantity: "0",
  is_active: true,
};

// Shrinks a photo in the browser (max 480px, JPEG) so it is small enough to store in the database.
function compressImage(file, maxSize = 480, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // JPEG has no transparency
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

export default function ProductFormModal({ open, product, categories, onClose, onSave }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const editing = Boolean(product);

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      product
        ? {
          product_name: product.product_name,
          category_id: product.category_id ?? "",
          price: String(product.price),
          description: product.description || "",
          image_url: product.image_url || "",
          track_stock: product.track_stock === 1,
          stock_quantity: String(product.stock_quantity),
          is_active: product.is_active === 1,
        }
        : EMPTY
    );
  }, [open, product]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const category = categories.find((c) => String(c.id) === String(form.category_id));

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (JPG, PNG, WebP).");
    if (file.size > 10 * 1024 * 1024) return setError("That image is over 10 MB. Please pick a smaller one.");
    setError("");
    try {
      const dataUrl = await compressImage(file);
      setForm((f) => ({ ...f, image_url: dataUrl }));
    } catch (err) {
      setError(err.message);
    }
  };

  const hasUpload = form.image_url.startsWith("data:");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.product_name.trim()) return setError("Please enter a product name.");
    if (form.price === "" || Number(form.price) < 0) return setError("Please enter a valid price.");
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        category_id: form.category_id || null,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity) || 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={editing ? t("editProduct") : t("newProduct")}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </button>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {editing ? t("saveChanges") : t("addProduct")}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-4" noValidate>
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</div>}

        <div>
          <label className="label" htmlFor="pf-name"> {t("name")}</label>
          <input id="pf-name" className="input" placeholder={t("newProductName")} value={form.product_name} onChange={set("product_name")} maxLength={150} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="pf-cat"> {t("categories")}</label>
            <select id="pf-cat" className="input" value={form.category_id} onChange={set("category_id")}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pf-price"> {t("price")}</label>
            <input id="pf-price" className="input" type="number" min="0" step="0.01" placeholder={t("enterPrice")} inputMode="decimal" value={form.price} onChange={set("price")} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="pf-desc"> {t("description")} (optional)</label>
          <input id="pf-desc" className="input" value={form.description} onChange={set("description")} maxLength={255} />
        </div>

        <div>
          <span className="label"> {t("photo")} (optional)</span>
          <div className="flex items-center gap-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
              onClick={() => fileInput.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
              aria-label="Upload product photo"
              className={`relative size-24 shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-2 ring-offset-2 transition ${dragging ? "ring-brand-500" : "ring-transparent hover:ring-brand-200"
                }`}
            >
              <ProductArt
                product={{ ...form, category: category?.name, category_id: category?.id }}
                className="size-24"
                iconClass="size-9"
              />
              <span className="absolute inset-x-0 bottom-0 bg-espresso/60 py-1 text-center text-[11px] font-semibold text-white">
                {form.image_url ? "Change" : "Upload"}
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = ""; // allow picking the same file again
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInput.current?.click()}>
                  <ImagePlus className="size-4" /> {form.image_url ? "Replace photo" : "Upload photo"}
                </button>
                {form.image_url && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                    onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                  >
                    <Trash2 className="size-4" /> Remove
                  </button>
                )}
              </div>
              <input
                className="input py-2 text-xs"
                type="url"
                aria-label="Image URL"
                placeholder={hasUpload ? "Using the uploaded photo" : "…or paste an image URL"}
                value={hasUpload ? "" : form.image_url}
                disabled={hasUpload}
                onChange={set("image_url")}
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-stone-500">JPG, PNG or WebP. Photos are resized automatically.</p>
        </div>

        <div className="space-y-3 rounded-xl bg-stone-50 p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" className="size-4 accent-brand-600" checked={form.track_stock} onChange={set("track_stock")} />
            {t("track_stock")}
            <span className="text-xs font-normal text-stone-500">(for pastries, bottles…)</span>
          </label>
          {form.track_stock && (
            <div>
              <label className="label" htmlFor="pf-stock">Quantity in stock</label>
              <input id="pf-stock" className="input" type="number" min="0" step="1" value={form.stock_quantity} onChange={set("stock_quantity")} />
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" className="size-4 accent-brand-600" checked={form.is_active} onChange={set("is_active")} />
            {t("available_for_sale")}
          </label>
        </div>
      </form>
    </Modal>
  );
}