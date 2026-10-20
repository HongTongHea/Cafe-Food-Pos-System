import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Users as UsersIcon } from "lucide-react";
import api, { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fmtDateTime, initials } from "../utils/format";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import UserFormModal from "../components/UserFormModal";

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Could not load staff."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (form) => {
    const body = { ...form };
    if (!body.password) delete body.password;
    try {
      if (editing) await api.put(`/users/${editing.id}`, body);
      else await api.post("/users", body);
    } catch (err) {
      throw new Error(errorMessage(err));
    }
    toast.success(editing ? "Staff member updated" : "Staff member created");
    setFormOpen(false);
    await load();
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/users/${deleting.id}`);
      toast.success("Staff member deleted");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-12xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Staff"
        subtitle="Who can sign in to the POS"
        actions={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="size-4" /> Add staff
          </button>
        }
      />

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading staff…" />
        ) : error ? (
          <EmptyState icon={UsersIcon} title="Couldn't load staff" hint={error} action={<button className="btn btn-primary" onClick={load}>Try again</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-155">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                          {initials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-stone-900">
                            {u.name} {u.id === me.id && <span className="ml-1 text-xs font-medium text-stone-400">(you)</span>}
                          </div>
                          <div className="truncate text-xs text-stone-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={u.role === "admin" ? "brand" : "stone"}>{u.role === "admin" ? "Admin" : "Cashier"}</Badge>
                    </td>
                    <td>
                      <Badge tone={u.status === "active" ? "green" : "red"}>{u.status === "active" ? "Active" : "Disabled"}</Badge>
                    </td>
                    <td className="whitespace-nowrap text-stone-500">{fmtDateTime(u.created_at)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="btn-icon" aria-label={`Edit ${u.name}`} onClick={() => { setEditing(u); setFormOpen(true); }}>
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className="btn-icon hover:text-red-600"
                          aria-label={`Delete ${u.name}`}
                          disabled={u.id === me.id}
                          title={u.id === me.id ? "You can't delete yourself" : undefined}
                          onClick={() => setDeleting(u)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserFormModal open={formOpen} user={editing} onClose={() => setFormOpen(false)} onSave={save} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete staff member?"
        message={`${deleting?.name} will no longer be able to sign in. Their past orders stay in the history. To keep the account but block access, set it to Disabled instead.`}
        confirmText="Delete"
        danger
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
