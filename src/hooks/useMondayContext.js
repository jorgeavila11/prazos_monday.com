import { useEffect, useState } from "react";
import { monday } from "../api/monday";

/** Contexto do dashboard/quadro (boardIds, tema, usuário). */
export function useMondayContext() {
  const [context, setContext] = useState(null);

  useEffect(() => {
    monday.execute("valueCreatedForUser");
    const unsubscribe = monday.listen("context", (res) => setContext(res.data));
    return () => unsubscribe?.();
  }, []);

  return context;
}

/** O widget usa apenas um quadro: o primeiro conectado (Decisões, item 7). */
export function getBoardId(context) {
  if (!context) return null;
  if (Array.isArray(context.boardIds) && context.boardIds.length) return String(context.boardIds[0]);
  if (context.boardId) return String(context.boardId);
  return null;
}
