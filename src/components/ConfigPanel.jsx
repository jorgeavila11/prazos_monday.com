import React, { useMemo, useState } from "react";
import { Button } from "@vibe/core";
import { configFromColumns } from "../domain/settings";

const PAIRS = [
  { key: "base", label: "Linha Base", start: "Linha Base Início", end: "Linha Base Final" },
  { key: "real", label: "Estimado Real", start: "Estimado Real Início", end: "Estimado Real Final" },
];

function ColumnSelect({ id, label, value, options, onChange }) {
  return (
    <label className="cfg-field" htmlFor={id}>
      <span className="cfg-label">{label}</span>
      <select id={id} className="cfg-select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione…</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Menu de configurações: para Linha Base e Estimado Real, escolhe entre
 * uma coluna Timeline (início e fim) ou duas colunas Data.
 */
const ConfigPanel = ({ boardColumns = [], currentColumns, onSave, onReset, onCancel, saving, error }) => {
  const timelineCols = useMemo(() => boardColumns.filter((c) => c.type === "timeline"), [boardColumns]);
  const dateCols = useMemo(() => boardColumns.filter((c) => c.type === "date"), [boardColumns]);
  const [draft, setDraft] = useState(() => configFromColumns(currentColumns));

  const update = (pairKey, patch) => setDraft((d) => ({ ...d, [pairKey]: { ...d[pairKey], ...patch } }));

  const pairValid = (p) => (p.mode === "timeline" ? !!p.timelineId : !!p.startId && !!p.endId);
  const valid = PAIRS.every((p) => pairValid(draft[p.key]));

  return (
    <form
      className="cfg-panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave({ version: 1, ...draft });
      }}
    >
      <p className="cfg-intro">
        Escolha de onde vêm as datas. Use uma coluna <strong>Timeline</strong> (início e fim na mesma coluna) ou duas
        colunas <strong>Data</strong>.
      </p>

      <div className="cfg-grid">
        {PAIRS.map((p) => {
          const cfg = draft[p.key];
          return (
            <fieldset key={p.key} className="cfg-group">
              <legend className="cfg-legend">{p.label}</legend>
              <div className="cfg-mode" role="radiogroup" aria-label={`Tipo de coluna para ${p.label}`}>
                <label>
                  <input
                    type="radio"
                    name={`${p.key}-mode`}
                    checked={cfg.mode === "timeline"}
                    onChange={() => update(p.key, { mode: "timeline" })}
                  />{" "}
                  Timeline
                </label>
                <label>
                  <input
                    type="radio"
                    name={`${p.key}-mode`}
                    checked={cfg.mode === "date"}
                    onChange={() => update(p.key, { mode: "date" })}
                  />{" "}
                  Colunas de data
                </label>
              </div>

              {cfg.mode === "timeline" ? (
                timelineCols.length ? (
                  <ColumnSelect
                    id={`${p.key}-timeline`}
                    label="Coluna Timeline (início e fim)"
                    value={cfg.timelineId}
                    options={timelineCols}
                    onChange={(v) => update(p.key, { timelineId: v })}
                  />
                ) : (
                  <p className="cfg-empty">O quadro não tem colunas Timeline.</p>
                )
              ) : dateCols.length ? (
                <>
                  <ColumnSelect
                    id={`${p.key}-start`}
                    label={p.start}
                    value={cfg.startId}
                    options={dateCols}
                    onChange={(v) => update(p.key, { startId: v })}
                  />
                  <ColumnSelect
                    id={`${p.key}-end`}
                    label={p.end}
                    value={cfg.endId}
                    options={dateCols}
                    onChange={(v) => update(p.key, { endId: v })}
                  />
                </>
              ) : (
                <p className="cfg-empty">O quadro não tem colunas Data.</p>
              )}
            </fieldset>
          );
        })}
      </div>

      {error && <p className="cfg-error">Não foi possível salvar: {error}</p>}

      <div className="cfg-actions">
        <Button kind="tertiary" size="small" onClick={onReset} type="button">
          Restaurar automático
        </Button>
        <div className="prazo-spacer" />
        {onCancel && (
          <Button kind="secondary" size="small" onClick={onCancel} type="button">
            Cancelar
          </Button>
        )}
        <Button kind="primary" size="small" type="submit" disabled={!valid} loading={saving}>
          Salvar
        </Button>
      </div>
    </form>
  );
};

export default ConfigPanel;
