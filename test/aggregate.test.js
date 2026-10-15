// Teste da agregação com os dados da imagem de referência. Rodar: npm run test:aggregate
import assert from "node:assert/strict";
import { aggregateGroups, formatDate, formatPct } from "../src/domain/aggregate";
import { resolveColumns, configFromColumns } from "../src/domain/settings";

const boardColumns = [
  { id: "tl_base", title: "Linha Base", type: "timeline" },
  { id: "d_real_ini", title: "Estimado Real Início", type: "date" },
  { id: "d_real_fim", title: "Estimado Real Final", type: "date" },
  { id: "n_base", title: "% Linha Base", type: "numbers" },
  { id: "f_real", title: "% Real", type: "formula" },
];

const tl = (from, to) => ({ id: "tl_base", type: "timeline", text: "", value: JSON.stringify({ from, to }), from: `${from}T00:00:00+00:00`, to: `${to}T00:00:00+00:00` });
const dt = (id, date) => ({ id, type: "date", text: date, value: JSON.stringify({ date }), date });
const num = (id, n) => ({ id, type: "numbers", text: String(n), value: JSON.stringify(String(n)), number: n });
const frm = (id, v) => ({ id, type: "formula", text: null, value: null, display_value: String(v) });

const item = (gid, bs, be, rs, re, pb, pr) => ({
  id: Math.random().toString(36).slice(2),
  group: { id: gid },
  column_values: [tl(bs, be), dt("d_real_ini", rs), dt("d_real_fim", re), num("n_base", pb), frm("f_real", pr)],
});

const groups = [
  { id: "g7", title: "07-GERAL", position: "70" },
  { id: "g1", title: "01-Detalhamento Projeto", position: "10" },
  { id: "g3", title: "03-Fabricação", position: "30" },
  { id: "g9", title: "Arquivo", position: "90" },
];

const items = [
  // 01: dois itens, datas agregadas por min/max, % ponderado pela duração base
  item("g1", "2022-09-21", "2023-03-31", "2022-09-21", "2023-05-10", 100, 1.0),
  item("g1", "2023-04-01", "2023-10-06", "2023-05-11", "2023-12-20", 100, 0.8),
  // 03: um item
  item("g3", "2024-03-22", "2024-04-26", "2024-03-22", "2024-06-13", 47, 0.45),
  // 07-GERAL é um grupo do quadro
  item("g7", "2022-09-21", "2024-10-05", "2022-09-21", "2024-10-19", 68, 0.56),
];

// 1) Settings vazias -> colunas achadas pelo título; Timeline serve de início e fim
const cols = resolveColumns({}, boardColumns);
assert.equal(cols.baseStart.id, "tl_base");
assert.equal(cols.baseEnd.id, "tl_base");
assert.equal(cols.realStart.id, "d_real_ini");
assert.equal(cols.realEnd.id, "d_real_fim");
assert.equal(cols.basePct, undefined); // % não dependem de colunas

// 2) Settings explícitas no formato { columnId: true } têm prioridade
const cols2 = resolveColumns({ realEndColumn: { d_real_ini: true } }, boardColumns);
assert.equal(cols2.realEnd.id, "d_real_ini");

// 3) Datas e % calculados pelas datas, hoje = 09/04/2024
const rows = aggregateGroups({ groups, items, columns: cols, hiddenGroups: "Arquivo", today: "2024-04-09" });
assert.deepEqual(rows.map((r) => r.etapa), ["01-Detalhamento Projeto", "03-Fabricação", "07-GERAL"]);

const [r1, r3, rG] = rows;
assert.equal(formatDate(r1.baseInicio), "21/09/22");
assert.equal(formatDate(r1.baseFim), "06/10/23");
assert.equal(formatDate(r1.realInicio), "21/09/22");
assert.equal(formatDate(r1.realFim), "20/12/23");
// etapa 01 já terminou nas duas datas
assert.equal(formatPct(r1.pctBase), "100%");
assert.equal(formatPct(r1.pctReal), "100%");
// 03: base 22/03 a 26/04 (36 dias), passaram 18 -> 50%
assert.equal(formatPct(r3.pctBase), "50%");
// 03: real 22/03 a 13/06 (84 dias), passaram 18 -> 21%
assert.equal(formatPct(r3.pctReal), "21%");
assert.equal(rG.isTotal, true);
// GERAL: base 21/09/22 a 05/10/24 (746 dias), passaram 566 -> 76%
assert.equal(formatPct(rG.pctBase), "76%");
// GERAL: real 21/09/22 a 19/10/24 (760 dias), passaram 566 -> 74%
assert.equal(formatPct(rG.pctReal), "74%");

// 4) Antes do início = 0%; grupo sem itens aparece com traços
const rows2 = aggregateGroups({ groups, items, columns: cols, today: "2022-01-01" });
assert.equal(formatPct(rows2.find((r) => r.groupId === "g3").pctBase), "0%");
const vazio = rows2.find((r) => r.groupId === "g9");
assert.equal(formatDate(vazio.baseInicio), "–");
assert.equal(formatPct(vazio.pctReal), "–");

// 5) Menu do widget tem prioridade: Linha Base por datas, Real por timeline
const cols3 = [
  ...boardColumns,
  { id: "d_base_ini", title: "Início planejado", type: "date" },
  { id: "d_base_fim", title: "Fim planejado", type: "date" },
  { id: "tl_real", title: "Cronograma real", type: "timeline" },
];
const cfg = { base: { mode: "date", startId: "d_base_ini", endId: "d_base_fim" }, real: { mode: "timeline", timelineId: "tl_real" } };
const r5 = resolveColumns({ baseStartColumn: "tl_base" }, cols3, cfg);
assert.equal(r5.baseStart.id, "d_base_ini");
assert.equal(r5.baseEnd.id, "d_base_fim");
assert.equal(r5.realStart.id, "tl_real");
assert.equal(r5.realEnd.id, "tl_real");
// coluna de tipo errado na configuração é ignorada (cai no fallback)
const r6 = resolveColumns({}, cols3, { base: { mode: "timeline", timelineId: "d_base_ini" } });
assert.equal(r6.baseStart.id, "tl_base");
// configuração inicial do menu reflete as colunas em uso
assert.deepEqual(configFromColumns(r5).real, { mode: "timeline", timelineId: "tl_real", startId: "", endId: "" });
assert.equal(configFromColumns(r5).base.mode, "date");

console.log("OK: datas e % calculados conferem");
for (const r of rows) {
  console.log([r.etapa.padEnd(26), formatDate(r.baseInicio), formatDate(r.baseFim), formatDate(r.realInicio), formatDate(r.realFim), formatPct(r.pctBase).padStart(5), formatPct(r.pctReal).padStart(5)].join("  "));
}
