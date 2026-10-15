import { useEffect, useState } from "react";
import { monday } from "../api/monday";

/** Settings do widget, definidas no Developer Center (ver WIDGET.md). */
export function useMondaySettings() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const unsubscribe = monday.listen("settings", (res) => setSettings(res.data || {}));
    return () => unsubscribe?.();
  }, []);

  return settings;
}
