import { useEffect, useState } from "react";
import {
  fallbackShopSettings,
  getPublicShopSettings,
  type PublicShopSettings
} from "../Services/publicShopSettingsService";

export function useShopSettings() {
  const [settings, setSettings] =
    useState<PublicShopSettings>(fallbackShopSettings);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const data = await getPublicShopSettings();

        if (active) {
          setSettings(data);
        }
      } catch {
        if (active) {
          setSettings(fallbackShopSettings);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  return {
    settings,
    loading
  };
}
