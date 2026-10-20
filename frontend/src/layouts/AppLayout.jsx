import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Coffee, LayoutDashboard, LogOut, Menu, Package, ReceiptText, ShoppingBag, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { initials } from "../utils/format";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, admin: true },
  { to: "/pos", label: "Point of Sale", icon: ShoppingBag },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/products", label: "Products", icon: Package, admin: true },
  { to: "/users", label: "Staff", icon: Users, admin: true },
];

function Brand({ name }) {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-900/40">
        <Coffee className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-base font-extrabold tracking-tight text-white">{name}</div>
        <div className="text-[11px] font-medium tracking-widest text-stone-500 uppercase">Point of sale</div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  const { shopName } = useSettings();
  const [confirmOut, setConfirmOut] = useState(false);
  const items = NAV.filter((n) => !n.admin || isAdmin);

  return (
    <div className="flex h-full flex-col bg-espresso px-3 py-5">
      <Brand name={shopName} />

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-widest text-stone-600 uppercase">Menu</div>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon className="size-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl bg-espresso-soft p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
            <div className="truncate text-xs text-stone-400 capitalize">{user?.role}</div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOut(true)}
            className="flex size-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOut}
        title="Sign out?"
        message="You will need to sign in again to take orders."
        confirmText="Sign out"
        onConfirm={logout}
        onClose={() => setConfirmOut(false)}
      />
    </div>
  );
}

export default function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const { shopName } = useSettings();

  useEffect(() => setDrawer(false), [location.pathname]);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="anim-fade absolute inset-0 bg-espresso/60" onClick={() => setDrawer(false)} />
          <aside className="anim-pop absolute inset-y-0 left-0 w-72 max-w-[85%]">
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-3 lg:hidden">
          <button className="btn-icon" onClick={() => setDrawer(true)} aria-label="Open menu">
            {drawer ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span className="font-display text-base font-extrabold text-stone-900">{shopName}</span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
