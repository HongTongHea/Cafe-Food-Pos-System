import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "./ui/Modal";
import { useLanguage } from "../context/LanguageContext";

const EMPTY = { name: "", email: "", password: "", role: "cashier", status: "active" };

export default function UserFormModal({ open, user, onClose, onSave }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(user);

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(user ? { name: user.name, email: user.email, password: "", role: user.role, status: user.status } : EMPTY);
  }, [open, user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Please enter a name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Please enter a valid email.");
    if (!editing && form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (editing && form.password && form.password.length < 6) return setError("New password must be at least 6 characters.");
    setSaving(true);
    setError("");
    try {
      await onSave(form);
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
      title={editing ? t("editStaff") : t("newStaff")}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}> {t("cancel")}</button>
          <button type="submit" form="user-form" className="btn btn-primary" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {editing ? t("saveChanges") : t("createAccount")}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4" noValidate>
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</div>}
        <div>
          <label className="label" htmlFor="uf-name">{t("full_name")}</label>
          <input id="uf-name" className="input" placeholder={t("enterFullName")} value={form.name} onChange={set("name")} autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="uf-email">{t("email")}</label>
          <input id="uf-email" className="input" type="email" placeholder={t("enterEmail")} value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className="label" htmlFor="uf-pass">{editing ? t("newPassword") : t("password")}</label>
          <input id="uf-pass" className="input" type="password" autoComplete="new-password" placeholder={editing ? t("newPassword") : t("enterPassword")} value={form.password} onChange={set("password")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="uf-role">{t("role")}</label>
            <select id="uf-role" className="input" value={form.role} onChange={set("role")}>
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="uf-status">{t("status")}</label>
            <select id="uf-status" className="input" value={form.status} onChange={set("status")}>
              <option value="active">Active</option>
              <option value="inactive">Disabled</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-stone-500">{t("note")}</p>
      </form>
    </Modal>
  );
}
