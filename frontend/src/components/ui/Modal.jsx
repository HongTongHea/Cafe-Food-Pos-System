import { useEffect } from "react";
import { X } from "lucide-react";

const SIZES = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

export default function Modal({ open, onClose, title, children, footer, size = "md", closeOnBackdrop = true }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-espresso/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && closeOnBackdrop && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`anim-pop flex max-h-[92dvh] w-full ${SIZES[size]} flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-bold text-stone-900">{title}</h2>
          <button type="button" className="btn-icon -mr-2" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
