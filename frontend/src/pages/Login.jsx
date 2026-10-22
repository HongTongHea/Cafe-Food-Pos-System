import { useState } from "react";
import { Navigate } from "react-router-dom";
import { BarChart3, Coffee, Eye, EyeOff, Loader2, Package, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { errorMessage } from "../api/client";
import { useLanguage } from "../context/LanguageContext";


export default function Login() {
  const { t } = useLanguage();
  const FEATURES = [
    { icon: Zap, title: t("title1"), text: t("text1") },
    { icon: Package, title: t("title2"), text: t("text2") },
    { icon: BarChart3, title: t("title3"), text: t("text3") },
  ];
  const { user, login } = useAuth();
  const { shopName } = useSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err, "Unable to sign in. Please try again."));
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1.2fr]">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden bg-espresso p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-900/40">
            <Coffee className="size-6" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight">Caffee & Food</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="font-display text-5xl leading-[1.1] font-extrabold tracking-tight">
            {t("slogan_shop1")}
            <br />
            <span className="text-brand-400"> {t("slogan_shop2")}</span>
          </h1>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="size-5 text-brand-300" />
                </div>
                <div>
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-stone-400">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-stone-500">© 2026 Caffee & Food. All rights reserved.</p>
      </div>

      {/* form */}
      <div className="flex items-center justify-center bg-stone-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Coffee className="size-6" />
            </div>
            <span className="font-display text-xl font-extrabold">Caffee & Food</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">{t("welcome_back")}</h2>
          <p className="mt-2 text-sm text-stone-500">{t("sign_note")}</p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                {t("email")}
              </label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="username"
                placeholder="you@cafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                {t("password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="input pr-11"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-stone-400 hover:text-stone-700"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full py-3" disabled={loading || !email || !password}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {t("sign_in")}
            </button>
          </form>
          {/* 
          {import.meta.env.DEV && (
            <div className="mt-8 rounded-xl border border-dashed border-stone-300 p-4 text-xs text-stone-500">
              <div className="mb-1 font-semibold text-stone-600">Demo accounts (dev only)</div>
              admin@cafe.com / admin123
              <br />
              cashier@cafe.com / cashier123
            </div>
          )} */}
          <div className="mt-8 text-center text-xs text-stone-400">
            <p>
              {shopName} &copy; 2026. All rights reserved.
            </p>
            <p className="mt-1">
              Development  <span className="text-red-500"></span> by{" "}
              <a className="text-blue-500 cursor-pointer hover:underline">
                Mr. Tong Hea v 1.1.0
              </a>
              .
            </p>
            <p className="mt-1">
              <a href="https://t.me/Tonghear" className="text-blue-500 cursor-pointer hover:underline">
                Contact support
              </a>{" "}
              |{" "}
              <a href="https://t.me/Tonghear" className="text-blue-500 cursor-pointer hover:underline">
                Help center
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
