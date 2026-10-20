import { Loader2 } from "lucide-react";

export default function Spinner({ label = "Loading…", className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-16 text-sm text-stone-500 ${className}`}>
      <Loader2 className="size-5 animate-spin text-brand-600" />
      {label}
    </div>
  );
}
