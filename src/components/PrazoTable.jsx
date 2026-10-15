import React from "react";
import { formatDate, formatPct } from "../domain/aggregate";

const HEADERS = [
  { key: "etapa", label: "Etapa", className: "col-etapa" },
  { key: "baseInicio", label: "Linha Base Início", className: "col-date" },
  { key: "baseFim", label: "Linha Base Final", className: "col-date" },
  { key: "realInicio", label: "Estimado Real Início", className: "col-date" },
  { key: "realFim", label: "Estimado Real Final", className: "col-date" },
  { key: "pctBase", label: "% Linha Base", className: "col-pct" },
  { key: "pctReal", label: "% Real", className: "col-pct" },
];

const PrazoTable = ({ rows }) => (
  <div className="prazo-table-wrap">
    <table className="prazo-table">
      <thead>
        <tr>
          {HEADERS.map((h) => (
            <th key={h.key} className={h.className} scope="col">
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.groupId} className={r.isTotal ? "is-total" : undefined}>
            <th scope="row" className="col-etapa" title={`${r.itemCount} item(ns)`}>
              {r.etapa}
            </th>
            <td className="col-date">{formatDate(r.baseInicio)}</td>
            <td className="col-date">{formatDate(r.baseFim)}</td>
            <td className="col-date">{formatDate(r.realInicio)}</td>
            <td className="col-date">{formatDate(r.realFim)}</td>
            <td className="col-pct">{formatPct(r.pctBase)}</td>
            <td className="col-pct">{formatPct(r.pctReal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default PrazoTable;
