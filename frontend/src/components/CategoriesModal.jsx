import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import api, { errorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import Modal from "./ui/Modal";

export default function CategoriesModal({ open, categories, onClose, onChanged }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn, okMessage) => {
    setBusy(true);
    try {
      await fn();
      if (okMessage) toast.success(okMessage);
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await run(() => api.post("/categories", { name }), "Category added");
    setName("");
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    await run(() => api.put(`/categories/${editingId}`, { name: editName }), "Category renamed");
    setEditingId(null);
  };

  const remove = (c) => {
    const msg = c.product_count
      ? `Delete "${c.name}"? Its ${c.product_count} product(s) will become uncategorised.`
      : `Delete "${c.name}"?`;
    if (window.confirm(msg)) run(() => api.delete(`/categories/${c.id}`), "Category deleted");
  };

  return (
    <Modal open={open} onClose={onClose} title="Categories" footer={<button className="btn btn-primary" onClick={onClose}>Done</button>}>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input className="input" placeholder="New category name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          <Plus className="size-4" /> Add
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-400">No categories yet</p>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2 px-3 py-2.5">
              {editingId === c.id ? (
                <>
                  <input
                    className="input py-1.5"
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button className="btn-icon" onClick={saveEdit} disabled={busy} aria-label="Save"><Check className="size-4 text-emerald-600" /></button>
                  <button className="btn-icon" onClick={() => setEditingId(null)} aria-label="Cancel"><X className="size-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <span className="text-xs text-stone-400">{c.product_count} items</span>
                  <button className="btn-icon" onClick={() => { setEditingId(c.id); setEditName(c.name); }} aria-label={`Rename ${c.name}`}>
                    <Pencil className="size-4" />
                  </button>
                  <button className="btn-icon hover:text-red-600" onClick={() => remove(c)} disabled={busy} aria-label={`Delete ${c.name}`}>
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
