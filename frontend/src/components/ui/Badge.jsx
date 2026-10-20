const TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15",
  red: "bg-red-50 text-red-700 ring-1 ring-red-600/15",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20",
  brand: "bg-brand-50 text-brand-800 ring-1 ring-brand-600/20",
  stone: "bg-stone-100 text-stone-600 ring-1 ring-stone-500/10",
  blue: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/15",
};

export default function Badge({ tone = "stone", children, className = "" }) {
  return <span className={`badge ${TONES[tone]} ${className}`}>{children}</span>;
}
