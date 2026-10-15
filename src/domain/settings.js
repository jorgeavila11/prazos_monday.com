// Resolve as colunas do quadro a partir das settings do widget (Decisões, item 9).
//
// Campos de settings esperados (ids definidos no Developer Center, ver WIDGET.md):
//   title, baseStartColumn, baseEndColumn, realStartColumn, realEndColumn,
//   hiddenGroups
//
// Cada campo de data aceita uma coluna Timeline ou Data.

export const DATE_FIELDS = ["baseStart", "baseEnd", "realStart", "realEnd"];
// Os % são calculados pelas datas (não dependem de colunas).
export const REQUIRED_FIELDS = [...DATE_FIELDS];

export const FIELD_LABELS = {
  baseStart: "Linha Base Início",
  baseEnd: "Linha Base Final",
  realStart: "Estimado Real Início",
  realEnd: "Estimado Real Final",
};

const DATE_TYPES = ["timeline", "date"];

/**
 * O campo "Column" das settings da monday pode chegar como string,
 * array de ids ou objeto { columnId: true }. Normaliza para um id.
 */
export function pickColumnId(raw) {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0] ? String(raw[0]) : null;
  if (typeof raw === "object") {
    const keys = Object.keys(raw).filter((k) => raw[k]);
    return keys[0] || null;
  }
  return null;
}

const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Fallback: procura a coluna pelo título quando a setting está vazia.
 * Cada regra = [tipos aceitos, padrões que o título precisa ter]; vale a primeira que achar.
 */
function findByTitle(columns, rules) {
  for (const [types, patterns] of rules) {
    const col = columns.find((c) => types.includes(c.type) && patterns.every((p) => p.test(norm(c.title))));
    if (col) return col;
  }
  return null;
}

const BASE = /base/;
const REAL = /real|estimad/;
const START = /inic/;
const END = /fim|final|termino/;

const TITLE_FALLBACK = {
  baseStart: [[DATE_TYPES, [BASE, START]], [["timeline"], [BASE]]],
  baseEnd: [[DATE_TYPES, [BASE, END]], [["timeline"], [BASE]]],
  realStart: [[DATE_TYPES, [REAL, START]], [["timeline"], [REAL]]],
  realEnd: [[DATE_TYPES, [REAL, END]], [["timeline"], [REAL]]],
};

const SETTING_KEYS = {
  baseStart: "baseStartColumn",
  baseEnd: "baseEndColumn",
  realStart: "realStartColumn",
  realEnd: "realEndColumn",
};

/**
 * Configuração do menu do widget (prioridade máxima):
 * { base: { mode: "timeline", timelineId } | { mode: "date", startId, endId }, real: {...} }
 * Devolve só os campos de data que ela define com colunas válidas do quadro.
 */
export function columnsFromConfig(config, boardColumns = []) {
  const out = {};
  if (!config) return out;
  const byId = new Map(boardColumns.map((c) => [c.id, c]));
  const pair = (cfg, startKey, endKey) => {
    if (!cfg) return;
    if (cfg.mode === "timeline") {
      const col = byId.get(cfg.timelineId);
      if (col?.type === "timeline") {
        out[startKey] = col;
        out[endKey] = col;
      }
    } else if (cfg.mode === "date") {
      const s = byId.get(cfg.startId);
      const e = byId.get(cfg.endId);
      if (s?.type === "date") out[startKey] = s;
      if (e?.type === "date") out[endKey] = e;
    }
  };
  pair(config.base, "baseStart", "baseEnd");
  pair(config.real, "realStart", "realEnd");
  return out;
}

/**
 * Devolve { baseStart: {id,title,type} | null, ... }.
 * Prioridade: menu do widget > settings do Developer Center > título da coluna.
 */
export function resolveColumns(settings = {}, boardColumns = [], config = null) {
  const byId = new Map(boardColumns.map((c) => [c.id, c]));
  const fromConfig = columnsFromConfig(config, boardColumns);
  const result = {};
  for (const [field, settingKey] of Object.entries(SETTING_KEYS)) {
    if (fromConfig[field]) {
      result[field] = fromConfig[field];
      continue;
    }
    const id = pickColumnId(settings?.[settingKey]);
    let col = id ? byId.get(id) || null : null;
    if (!col) {
      col = findByTitle(boardColumns, TITLE_FALLBACK[field]);
    }
    result[field] = col;
  }
  return result;
}

export function requiredMissing(columns) {
  return REQUIRED_FIELDS.filter((f) => !columns[f]).map((f) => FIELD_LABELS[f]);
}

/** "Grupo A, Grupo B" ou ["Grupo A"] -> Set de nomes normalizados. */
export function parseHiddenGroups(raw) {
  if (!raw) return new Set();
  const list = Array.isArray(raw) ? raw : String(raw).split(/[,;\n]/);
  return new Set(list.map((s) => norm(s).trim()).filter(Boolean));
}

export { norm };

/** Monta a configuração inicial do menu a partir das colunas em uso. */
export function configFromColumns(columns) {
  const pair = (start, end) => {
    if (start && start.type === "timeline" && (!end || end.id === start.id)) {
      return { mode: "timeline", timelineId: start.id, startId: "", endId: "" };
    }
    return {
      mode: start?.type === "date" || end?.type === "date" ? "date" : "timeline",
      timelineId: "",
      startId: start?.type === "date" ? start.id : "",
      endId: end?.type === "date" ? end.id : "",
    };
  };
  return { base: pair(columns?.baseStart, columns?.baseEnd), real: pair(columns?.realStart, columns?.realEnd) };
}
