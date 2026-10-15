import React from "react";
import { Button } from "@vibe/core";
import CalendarIcon from "./CalendarIcon";

/** Moldura do cartão: título, ícone e botões. O conteúdo vem em children. */
const PrazoCard = ({ title, onReload, onConfigure, configOpen, loading, children }) => (
  <section className="prazo-card" aria-label={title}>
    <header className="prazo-header">
      <h2 className="prazo-title">{title}</h2>
      <CalendarIcon />
      <div className="prazo-spacer" />
      {onConfigure && (
        <Button
          kind="tertiary"
          size="small"
          onClick={onConfigure}
          active={configOpen}
          ariaLabel="Configurar colunas"
        >
          ⚙ Configurar
        </Button>
      )}
      {onReload && !configOpen && (
        <Button kind="tertiary" size="small" onClick={onReload} loading={loading} ariaLabel="Atualizar dados">
          Atualizar
        </Button>
      )}
    </header>
    <div className="prazo-body">{children}</div>
  </section>
);

export default PrazoCard;
