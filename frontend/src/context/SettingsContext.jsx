
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/client";
import { makeMoney } from "../utils/format";

const SettingsContext = createContext(null);

const DEFAULTS = {
  shopName: "Caffe & Food",
  logoUrl: null,
};

const SETTINGS_CACHE_KEY = "cafe-pos-shop-settings";

// Get the backend origin from the configured API URL.
const getApiOrigin = () => {
  try {
    return new URL(
      api.defaults.baseURL || "/",
      window.location.origin
    ).origin;
  } catch {
    return window.location.origin;
  }
};

// Convert a stored logo path to an absolute image URL.
const resolveLogoUrl = (url) => {
  if (typeof url !== "string" || !url.trim()) {
    return null;
  }

  const trimmed = url.trim();

  // Preserve absolute image URLs.
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Resolve backend-uploaded images.
  if (
    trimmed.startsWith("/uploads/") ||
    trimmed.startsWith("uploads/")
  ) {
    const pathname = trimmed.startsWith("/")
      ? trimmed
      : `/${trimmed}`;

    return `${getApiOrigin()}${pathname}`;
  }

  return null;
};

// Read the last saved display settings from the browser cache.
const readCachedSettings = () => {
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);

    if (!cached) {
      return DEFAULTS;
    }

    const parsed = JSON.parse(cached);

    return {
      shopName: parsed.shopName || DEFAULTS.shopName,
      logoUrl: resolveLogoUrl(parsed.logoUrl),
      currency: parsed.currency || "USD",
    };
  } catch {
    return DEFAULTS;
  }
};

// Save settings locally for immediate display on the next page load.
const cacheSettings = (settings) => {
  try {
    localStorage.setItem(
      SETTINGS_CACHE_KEY,
      JSON.stringify({
        shopName: settings.shopName,
        logoUrl: settings.logoUrl,
        currency: settings.currency,
      })
    );
  } catch (error) {
    console.error("Failed to cache shop settings:", error);
  }
};

export function SettingsProvider({ children }) {
  // Load the cached logo on the first render.
  const [settings, setSettingsState] = useState(readCachedSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Apply settings after an admin saves them.
  const applySettings = useCallback((data = {}) => {
    setSettingsState((previous) => {
      const next = {
        ...previous,
        ...data,
        shopName:
          data.shopName?.trim() ||
          previous.shopName ||
          DEFAULTS.shopName,
        logoUrl:
          data.logoUrl !== undefined
            ? resolveLogoUrl(data.logoUrl)
            : previous.logoUrl,
      };

      cacheSettings(next);

      return next;
    });

    if (data.shopName?.trim()) {
      document.title = `${data.shopName.trim()} · POS`;
    }
  }, []);

  // Load the latest settings from the backend.
  const refreshSettings = useCallback(async () => {
    try {
      const response = await api.get("/settings");
      const data = response.data?.data ?? response.data;

      if (!data) {
        return;
      }

      setSettingsState((previous) => {
        const next = {
          ...previous,
          shopName:
            data.shopName?.trim() ||
            data.shop_name?.trim() ||
            previous.shopName ||
            DEFAULTS.shopName,

          // Support both camelCase and database-style field names.
          logoUrl:
            data.logoUrl !== undefined
              ? resolveLogoUrl(data.logoUrl)
              : data.logo_url !== undefined
                ? resolveLogoUrl(data.logo_url)
                : previous.logoUrl,

          currency: data.currency || previous.currency || "USD",
        };

        cacheSettings(next);

        return next;
      });

      const name =
        data.shopName?.trim() || data.shop_name?.trim();

      if (name) {
        document.title = `${name} · POS`;
      }
    } catch (error) {
      // Keep the cached logo if the backend request fails.
      console.error("Failed to load shop settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // Load settings when the app starts or the browser refreshes.
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const value = useMemo(
    () => ({
      ...settings,
      money: makeMoney(settings.currency),
      loadingSettings,
      refreshSettings,
      setSettings: applySettings,
    }),
    [
      settings,
      loadingSettings,
      refreshSettings,
      applySettings,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext);
