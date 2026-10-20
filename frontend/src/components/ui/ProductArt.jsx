import { Coffee, CupSoda, Croissant, Sandwich, Leaf, Cookie, UtensilsCrossed } from "lucide-react";

const TINTS = [
  "from-amber-100 to-orange-200 text-amber-800",
  "from-emerald-100 to-teal-200 text-emerald-800",
  "from-sky-100 to-blue-200 text-sky-800",
  "from-rose-100 to-pink-200 text-rose-800",
  "from-violet-100 to-purple-200 text-violet-800",
  "from-stone-100 to-stone-300 text-stone-700",
];

const iconFor = (category) => {
  const c = (category || "").toLowerCase();
  if (/(coffee|espresso|latte)/.test(c)) return Coffee;
  if (/(tea|matcha)/.test(c)) return Leaf;
  if (/(cold|juice|drink|soda|smoothie|water)/.test(c)) return CupSoda;
  if (/(pastr|bake|bread|croissant|cake|dessert)/.test(c)) return Croissant;
  if (/(sandwich|toast|burger|meal)/.test(c)) return Sandwich;
  if (/(snack|cookie|biscuit)/.test(c)) return Cookie;
  return UtensilsCrossed;
};

// Shows the product photo if there is one, otherwise a coloured tile with a category icon.
export default function ProductArt({ product, className = "", iconClass = "size-8" }) {
  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.product_name}
        loading="lazy"
        className={`object-cover ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  const Icon = iconFor(product.category);
  const tint = TINTS[(product.category_id || 0) % TINTS.length];
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${tint} ${className}`}>
      <Icon className={`${iconClass} opacity-80`} strokeWidth={1.6} />
    </div>
  );
}
