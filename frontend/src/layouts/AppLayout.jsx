
import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Settings,
  Coffee,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useLanguage } from "../context/LanguageContext";
import { initials } from "../utils/format";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function getLocalToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Brand({ name }) {
  const { t } = useLanguage();
  const { logoUrl } = useSettings();
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  return (
    <div className="flex items-center gap-3 px-2">
      {logoUrl && !logoFailed ? (
        <img
          key={logoUrl}
          src={logoUrl}
          alt={`${name} logo`}
          onError={() => setLogoFailed(true)}
          className="size-10 shrink-0 rounded-xl bg-white object-contain shadow-lg shadow-brand-900/40"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-900/40">
          <Coffee className="size-5" />
        </div>
      )}

      <div className="min-w-0">
        <div className="truncate font-display text-base font-extrabold tracking-tight text-white">
          {name}
        </div>

        <div className="text-[11px] font-medium tracking-widest text-stone-500 uppercase">
          {t("point_of_sale")}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  const { shopName } = useSettings();
  const { t } = useLanguage();

  const [confirmOut, setConfirmOut] = useState(false);
  const [finishedOrderCount, setFinishedOrderCount] = useState(0);

  // Load today's paid orders.
  const loadFinishedOrders = useCallback(async () => {
    try {
      const today = getLocalToday();

      const response = await api.get("/orders", {
        params: {
          from: today,
          to: today,
          status: "paid",
          limit: 500,
        },
      });

      const result = response.data?.data ?? response.data;

      const orders = Array.isArray(result)
        ? result
        : Array.isArray(result?.orders)
          ? result.orders
          : [];

      const paidCount = orders.filter(
        (order) => String(order.status).toLowerCase() === "paid"
      ).length;

      setFinishedOrderCount(paidCount);
    } catch (error) {
      console.error("Failed to load today's paid orders:", error);
    }
  }, []);

  // Refresh the badge when the sidebar loads and every 15 seconds.
  useEffect(() => {
    loadFinishedOrders();

    const intervalId = setInterval(loadFinishedOrders, 15000);

    return () => clearInterval(intervalId);
  }, [loadFinishedOrders]);

  const NAV = [
    {
      to: "/dashboard",
      label: t("dashboard"),
      icon: LayoutDashboard,
      admin: true,
    },
    {
      to: "/pos",
      label: t("point_of_sale"),
      icon: ShoppingBag,
    },
    {
      to: "/orders",
      label: t("orders"),
      icon: ReceiptText,
    },
    {
      to: "/products",
      label: t("products"),
      icon: Package,
      admin: true,
    },
    {
      to: "/users",
      label: t("staff"),
      icon: Users,
      admin: true,
    },
    {
      to: "/settings",
      label: t("settings"),
      icon: Settings,
    },
  ];

  const items = NAV.filter((item) => !item.admin || isAdmin);

  return (
    <div className="flex h-full flex-col bg-espresso px-3 py-5">
      <Brand name={shopName} />

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-widest text-stone-600 uppercase">
          {t("menu")}
        </div>

        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <Icon className="size-4.5 shrink-0" />

            <span className="min-w-0 flex-1">{label}</span>

            {to === "/orders" && finishedOrderCount > 0 && (
              <span
                className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-bold leading-none text-white"
                title={`${finishedOrderCount} paid orders today`}
                aria-label={`${finishedOrderCount} paid orders today`}
              >
                {finishedOrderCount > 99
                  ? "99+"
                  : finishedOrderCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl bg-espresso-soft p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
            {initials(user?.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              {user?.name}
            </div>

            <div className="truncate text-xs text-stone-400 capitalize">
              {user?.role}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConfirmOut(true)}
            className="flex size-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white/10 hover:text-white"
            aria-label={t("signOut")}
            title={t("signOut")}
          >
            <LogOut className="size-4.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOut}
        title={t("signOutQuestion")}
        message={t("signOutMessage")}
        confirmText={t("signOut")}
        cancelText={t("cancel")}
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
  const { t } = useLanguage();

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="anim-fade absolute inset-0 bg-espresso/60"
            onClick={() => setDrawer(false)}
          />

          <aside className="anim-pop absolute inset-y-0 left-0 w-72 max-w-[85%]">
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-3 lg:hidden">
          <button
            className="btn-icon"
            onClick={() => setDrawer((open) => !open)}
            aria-label={drawer ? t("closeMenu") : t("openMenu")}
          >
            {drawer ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>

          <span className="font-display text-base font-extrabold text-stone-900">
            {shopName}
          </span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
