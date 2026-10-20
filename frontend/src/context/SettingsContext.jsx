import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { makeMoney } from "../utils/format";

const SettingsContext = createContext(null);

const DEFAULTS = { shopName: "Caffee & Food", currency: "USD", taxRate: 0, today: new Date().toISOString().slice(0, 10) };

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => {
        setSettings({ ...DEFAULTS, ...res.data });
        document.title = res.data.shopName ? `${res.data.shopName} · POS` : "Caffee & Food";
      })
      .catch(() => { }); // fall back to defaults if the API is unreachable
  }, []);

  const value = useMemo(() => ({ ...settings, money: makeMoney(settings.currency) }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext);
