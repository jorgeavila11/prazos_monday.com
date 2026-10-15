import { useCallback, useEffect, useState } from "react";
import { runQuery } from "../api/monday";
import { BOARD_STRUCTURE, ITEMS_FIRST_PAGE, ITEMS_NEXT_PAGE } from "../api/queries";
import { resolveColumns, requiredMissing } from "../domain/settings";
import { aggregateGroups } from "../domain/aggregate";

const MAX_PAGES = 40; // 40 x 500 = 20.000 itens, proteção contra laço infinito

/**
 * Busca estrutura + itens do quadro e devolve as linhas do cartão.
 * status: idle | loading | ready | error | missing-settings | empty
 */
export function useBoardData(boardId, settings, config) {
  const [state, setState] = useState({ status: "idle", rows: [], board: null, columns: null, error: null, missing: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const settingsKey = JSON.stringify({ settings: settings || {}, config: config || null });

  useEffect(() => {
    if (!boardId) return undefined;
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, status: "loading", error: null }));
      try {
        const structure = await runQuery(BOARD_STRUCTURE, { boardIds: [boardId] });
        const board = structure?.boards?.[0];
        if (!board) throw new Error("Quadro não encontrado ou sem permissão de leitura.");

        const columns = resolveColumns(settings, board.columns, config);
        const missing = requiredMissing(columns);
        if (missing.length) {
          if (!cancelled) setState({ status: "missing-settings", rows: [], board, columns, error: null, missing });
          return;
        }

        const colIds = [...new Set(Object.values(columns).filter(Boolean).map((c) => c.id))];
        const first = await runQuery(ITEMS_FIRST_PAGE, { boardIds: [boardId], colIds });
        let page = first?.boards?.[0]?.items_page;
        const items = [...(page?.items || [])];
        let cursor = page?.cursor;
        let pages = 1;
        while (cursor && pages < MAX_PAGES) {
          const next = await runQuery(ITEMS_NEXT_PAGE, { cursor, colIds });
          page = next?.next_items_page;
          items.push(...(page?.items || []));
          cursor = page?.cursor;
          pages += 1;
        }

        const rows = aggregateGroups({
          groups: board.groups,
          items,
          columns,
          hiddenGroups: settings?.hiddenGroups,
        });
        if (!cancelled) setState({ status: rows.length ? "ready" : "empty", rows, board, columns, error: null, missing: [] });
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, status: "error", error: err?.message || String(err) }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, settingsKey, reloadKey]);

  return { ...state, reload };
}
