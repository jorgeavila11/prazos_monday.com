// Agregação dos itens por grupo (funções puras, sem React nem SDK).
// Regras do briefing:
//  - Datas: menor início e maior fim dos itens do grupo.
//  - % Linha Base: tempo decorrido da linha base até hoje (datas Linha Base Início/Final).
//  - % Real: tempo decorrido do Estimado Real até hoje (datas Estimado Real Início/Final).
//  - % do grupo: média ponderada pela duração da linha base de cada item (Decisões, item 4).
//  - "07-GERAL" é um grupo do quadro e é calculado como os demais (Decisões, item 5).
//  - Subitens não entram (Decisões, item 8).
import dayjs from "dayjs";
import { readDate } from "./columnValues";
import { parseHiddenGroups, norm } from "./settings";

const minDate = (a, b) => (!a ? b : !b ? a : a < b ? a : b);
const maxDate = (a, b) => (!a ? b : !b ? a : a > b ? a : b);

/** Dias corridos entre duas datas ISO, incluindo o dia inicial (mínimo 1). */
export function durationDays(start, end) {
  if (!start || !end) return null;
  return Math.max(1, dayjs(end).diff(dayjs(start), "day") + 1);
}

/** % planejado (0–100) de um item numa data de referência. */
export function plannedPct(start, end, today) {
  if (!start || !end) return null;
  if (today < start) return 0;
  if (today >= end) return 100;
  const total = durationDays(start, end);
  const elapsed = dayjs(today).diff(dayjs(start), "day");
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function getCv(item, column) {
  if (!column) return null;
  return item.column_values?.find((cv) => cv.id === column.id) || null;
}

/**
 * @param groups  [{id,title,position}]
 * @param items   [{id, group:{id}, column_values:[...]}]
 * @param columns saída de resolveColumns
 * @param today   "YYYY-MM-DD" (injetável para testes)
 * @returns linhas [{groupId, etapa, isTotal, baseInicio, baseFim, realInicio, realFim, pctBase, pctReal, itemCount}]
 */
export function aggregateGroups({ groups = [], items = [], columns, hiddenGroups, today }) {
  const ref = today || dayjs().format("YYYY-MM-DD");
  const hidden = parseHiddenGroups(hiddenGroups);

  // 1) Lê os valores brutos de cada item
  const parsed = items.map((it) => ({
    groupId: it.group?.id,
    baseStart: readDate(getCv(it, columns.baseStart), "start"),
    baseEnd: readDate(getCv(it, columns.baseEnd), "end"),
    realStart: readDate(getCv(it, columns.realStart), "start"),
    realEnd: readDate(getCv(it, columns.realEnd), "end"),
  }));

  // 2) Agrupa
  const byGroup = new Map();
  for (const p of parsed) {
    if (!byGroup.has(p.groupId)) byGroup.set(p.groupId, []);
    byGroup.get(p.groupId).push(p);
  }

  const ordered = [...groups].sort((a, b) => Number(a.position) - Number(b.position));

  return ordered
    .filter((g) => !hidden.has(norm(g.title).trim()))
    .map((g) => {
      const list = byGroup.get(g.id) || [];
      let baseInicio = null;
      let baseFim = null;
      let realInicio = null;
      let realFim = null;
      let wBase = 0;
      let sBase = 0;
      let wReal = 0;
      let sReal = 0;

      for (const p of list) {
        baseInicio = minDate(baseInicio, p.baseStart);
        baseFim = maxDate(baseFim, p.baseEnd);
        realInicio = minDate(realInicio, p.realStart);
        realFim = maxDate(realFim, p.realEnd);

        const w = durationDays(p.baseStart, p.baseEnd) ?? 1;
        const pb = plannedPct(p.baseStart, p.baseEnd, ref);
        const pr = plannedPct(p.realStart, p.realEnd, ref);

        if (pb != null) {
          wBase += w;
          sBase += w * pb;
        }
        if (pr != null) {
          wReal += w;
          sReal += w * pr;
        }
      }

      return {
        groupId: g.id,
        etapa: g.title,
        isTotal: /geral|total/.test(norm(g.title)),
        itemCount: list.length,
        baseInicio,
        baseFim,
        realInicio,
        realFim,
        pctBase: wBase ? sBase / wBase : null,
        pctReal: wReal ? sReal / wReal : null,
      };
    });
}

/** "2023-10-06" -> "06/10/23" */
export function formatDate(iso) {
  if (!iso) return "–";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

/** 89.6 -> "90%" */
export function formatPct(v) {
  if (v == null || !Number.isFinite(v)) return "–";
  return `${Math.round(v)}%`;
}
