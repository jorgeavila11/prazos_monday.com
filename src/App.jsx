import React, { useEffect, useState } from "react";
import "@vibe/core/tokens";
import { AttentionBox, Button, Loader } from "@vibe/core";
import "./App.css";
import { useMondayContext, getBoardId } from "./hooks/useMondayContext";
import { useMondaySettings } from "./hooks/useMondaySettings";
import { useWidgetConfig } from "./hooks/useWidgetConfig";
import { useBoardData } from "./hooks/useBoardData";
import PrazoCard from "./components/PrazoCard";
import PrazoTable from "./components/PrazoTable";
import ConfigPanel from "./components/ConfigPanel";

const THEMES = ["light", "dark", "black"];

const Center = ({ children }) => <div className="prazo-center">{children}</div>;

const App = () => {
  const context = useMondayContext();
  const settings = useMondaySettings();
  const { config, loaded: configLoaded, saveConfig, saveError } = useWidgetConfig();
  const boardId = getBoardId(context);
  // Só busca os dados depois de ler a configuração salva, para não carregar duas vezes
  const { status, rows, board, columns, error, missing, reload } = useBoardData(
    configLoaded ? boardId : null,
    settings,
    config
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const title = (settings?.title && String(settings.title).trim()) || "PRAZO";

  // Acompanha o tema do monday (claro, escuro, preto) usando as classes do Vibe
  useEffect(() => {
    const theme = THEMES.includes(context?.theme) ? context.theme : "light";
    document.body.classList.remove(...THEMES.map((t) => `${t}-app-theme`));
    document.body.classList.add(`${theme}-app-theme`);
  }, [context?.theme]);

  const handleSave = async (next) => {
    setSaving(true);
    const ok = await saveConfig(next);
    setSaving(false);
    if (ok) setConfigOpen(false);
  };

  const canConfigure = !!board?.columns;

  let content;
  if (!context || !configLoaded) {
    content = (
      <Center>
        <Loader size={32} />
      </Center>
    );
  } else if (!boardId) {
    content = (
      <AttentionBox
        title="Nenhum quadro conectado"
        text="Conecte um quadro a este widget nas configurações do dashboard."
        type="primary"
      />
    );
  } else if (configOpen && canConfigure) {
    content = (
      <ConfigPanel
        boardColumns={board.columns}
        currentColumns={columns}
        saving={saving}
        error={saveError}
        onSave={handleSave}
        onReset={() => handleSave(null)}
        onCancel={() => setConfigOpen(false)}
      />
    );
  } else if (status === "missing-settings") {
    content = (
      <div className="prazo-missing">
        <AttentionBox
          title="Configure as colunas do widget"
          text={`Falta escolher: ${missing.join(", ")}.`}
          type="warning"
        />
        <Button kind="primary" size="small" onClick={() => setConfigOpen(true)}>
          Escolher colunas
        </Button>
      </div>
    );
  } else if (status === "error") {
    const authHint = /not authenticated|unauthorized|missing.*scope/i.test(error || "")
      ? " Verifique se o app tem o escopo boards:read e reinstale/autorize o app na conta."
      : "";
    content = (
      <AttentionBox title="Não foi possível carregar o quadro" text={`${error}${authHint}`} type="danger" />
    );
  } else if (status === "empty") {
    content = <AttentionBox title="Quadro sem grupos" text="Nenhum grupo para exibir." type="primary" />;
  } else if (status === "ready" || (status === "loading" && rows.length)) {
    content = <PrazoTable rows={rows} />;
  } else {
    content = (
      <Center>
        <Loader size={32} />
      </Center>
    );
  }

  return (
    <div className="App">
      <PrazoCard
        title={configOpen ? `${title} · Configurações` : title}
        onReload={boardId ? reload : undefined}
        onConfigure={canConfigure ? () => setConfigOpen((o) => !o) : undefined}
        configOpen={configOpen}
        loading={status === "loading"}
      >
        {content}
      </PrazoCard>
    </div>
  );
};

export default App;
