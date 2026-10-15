import { useCallback, useEffect, useState } from "react";
import { monday } from "../api/monday";

// Configuração feita no menu do próprio widget, salva no storage da instância
// (cada widget instalado tem a sua; vale para todos que veem o dashboard).
const STORAGE_KEY = "prazo-config-v1";

function readValue(res) {
  return res?.data?.value ?? res?.value ?? null;
}

export function useWidgetConfig() {
  const [config, setConfig] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    monday.storage.instance
      .getItem(STORAGE_KEY)
      .then((res) => {
        const raw = readValue(res);
        if (!cancelled && raw) setConfig(typeof raw === "string" ? JSON.parse(raw) : raw);
      })
      .catch((err) => console.warn("[Widget PRAZO] Não foi possível ler a configuração:", err))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  /** Salva (ou apaga, com null) a configuração. Retorna true se deu certo. */
  const saveConfig = useCallback(async (next) => {
    setSaveError(null);
    try {
      if (next) {
        await monday.storage.instance.setItem(STORAGE_KEY, JSON.stringify(next));
      } else if (monday.storage.instance.deleteItem) {
        await monday.storage.instance.deleteItem(STORAGE_KEY);
      } else {
        await monday.storage.instance.setItem(STORAGE_KEY, "");
      }
      setConfig(next);
      return true;
    } catch (err) {
      setSaveError(err?.message || String(err));
      return false;
    }
  }, []);

  return { config, loaded, saveConfig, saveError };
}
