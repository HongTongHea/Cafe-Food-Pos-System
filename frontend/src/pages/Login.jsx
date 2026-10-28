
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  BarChart3,
  Coffee,
  Eye,
  EyeOff,
  Loader2,
  Package,
  Zap,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { errorMessage } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const { t } = useLanguage();
  const { user, login } = useAuth();

  const {
    shopName,
    logoUrl,
    loadingSettings,
  } = useSettings();

  const [logoFailed, setLogoFailed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayShopName = shopName || "Caffee & Food";

  // Reset image error only when the saved logo URL changes.
  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const FEATURES = [
    { icon: Zap, title: t("title1"), text: t("text1") },
    { icon: Package, title: t("title2"), text: t("text2") },
    { icon: BarChart3, title: t("title3"), text: t("text3") },
  ];

  if (user) {
    return <Navigate to="/" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        errorMessage(err, "Unable to sign in. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Reusable shop logo.
  // A cached logo remains visible while the backend refreshes.
  const BrandLogo = ({ mobile = false }) => {
    const imageSize = mobile ? "size-11" : "size-10";

    const imageClass = mobile
      ? "size-11 shrink-0 rounded-xl bg-white object-contain p-1"
      : "size-10 shrink-0 rounded-xl bg-white object-contain p-1 shadow-lg shadow-brand-900/40";

    const fallbackClass = mobile
      ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"
      : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-900/40";

    // Display the saved logo immediately when available.
    if (logoUrl && !logoFailed) {
      return (
        <img
          key={logoUrl}
          src={logoUrl}
          alt={`${displayShopName} logo`}
          onError={() => {
            console.error("Failed to load shop logo:", logoUrl);
            setLogoFailed(true);
          }}
          className={imageClass}
        />
      );
    }

    // Only show a loading placeholder if no cached logo exists yet.
    if (loadingSettings && !logoUrl) {
      return (
        <div
          className={`${imageSize} shrink-0 animate-pulse rounded-xl bg-stone-200`}
          aria-label="Loading shop logo"
        />
      );
    }

    // No saved logo is available.
    return (
      <div className={fallbackClass}>
        <Coffee className={mobile ? "size-6" : "size-5"} />
      </div>
    );
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1.2fr]">
      {/* Desktop brand panel */}
      <div className="relative hidden overflow-hidden bg-espresso p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3 px-2">
          <BrandLogo />

          <div className="min-w-0">
            <div className="truncate font-display text-base font-extrabold tracking-tight text-white">
              {displayShopName}
            </div>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="font-display text-5xl leading-[1.1] font-extrabold tracking-tight">
            {t("slogan_shop1")}
            <br />
            <span className="text-brand-400">
              {t("slogan_shop2")}
            </span>
          </h1>

          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="size-5 text-brand-300" />
                </div>

                <div>
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-stone-400">
                    {text}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-stone-500">
          © {new Date().getFullYear()} {displayShopName}. All rights reserved.
        </p>
      </div>

      {/* Login form */}
      <div className="flex items-center justify-center bg-stone-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand header */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <BrandLogo mobile />

            <span className="min-w-0 truncate font-display text-xl font-extrabold">
              {displayShopName}
            </span>
          </div>

          <h2 className="text-center text-3xl font-extrabold tracking-tight text-stone-900 md:text-left">
            {t("welcome_back")}
          </h2>

          <p className=" text-center mt-2 text-sm text-stone-500 md:text-left">
            {t("sign_note")}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200"
              >
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
                onChange={(event) => setEmail(event.target.value)}
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
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-stone-400 hover:text-stone-700"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary flex w-full items-center justify-center gap-2 py-3"
              disabled={loading || !email.trim() || !password}
            >
              {loading && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {loading ? "Signing in..." : t("sign_in")}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-stone-400">
            <p>
              {displayShopName} © {new Date().getFullYear()}. All rights reserved.
            </p>

            <p className="mt-1">
              Development by{" "}
              <a
                href="https://t.me/Tonghear"
                className="cursor-pointer text-blue-500 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Mr. Tong Hea v 1.1.0
              </a>
            </p>

            <p className="mt-1">
              <a
                href="https://t.me/Tonghear"
                className="cursor-pointer text-blue-500 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Contact support
              </a>
              {" | "}
              <a
                href="https://t.me/Tonghear"
                className="cursor-pointer text-blue-500 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Help center
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
