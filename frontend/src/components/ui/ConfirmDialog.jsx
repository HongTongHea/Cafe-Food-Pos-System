import { Loader2 } from "lucide-react";
import Modal from "./Modal";

// Generic confirmation. Pass `children` to add extra inputs (e.g. a reason field).
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  danger = false,
  loading = false,
  disabled = false,
  onConfirm,
  onClose,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading || disabled}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmText}
          </button>
        </>
      }
    >
      {message && <p className="text-sm leading-relaxed text-stone-600">{message}</p>}
      {children}
    </Modal>
  );
}
