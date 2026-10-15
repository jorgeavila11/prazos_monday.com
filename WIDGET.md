# Widget PRAZO — resumo de grupos para o One Page Report

Mostra, para o quadro em que o widget está instalado, uma linha por grupo com as datas de
Linha Base e Estimado Real e os percentuais de avanço. O grupo "07-GERAL" é um grupo do próprio
quadro e é calculado como os demais.

## 1. Criar a feature no Developer Center

1. Developer Center → seu app → **Build → Features → Create feature → Dashboard Widget**.
2. Em **OAuth & Permissions**, confirme o escopo `boards:read`.
3. Hospedagem:
   - Teste local: `npm start`, copie a URL do túnel (`https://….apps-tunnel.monday.app`) e use em *External hosting*.
   - Produção: `npm run deploy` e escolha *Client-side code via CLI*.

## 2. Menu de configurações do widget (⚙ Configurar)

No próprio cartão, o botão **⚙ Configurar** abre um menu para escolher as colunas de data:

- **Linha Base** e **Estimado Real**, cada um com duas opções:
  - **Timeline**: uma coluna Timeline; o início vira "Início" e o fim vira "Final".
  - **Colunas de data**: duas colunas Data, uma para início e outra para fim.
- **Salvar** grava a escolha no storage da instância do widget (vale para todos que veem esse dashboard).
- **Restaurar automático** apaga a escolha e volta para as settings abaixo / busca pelo título.

Prioridade: menu do widget > settings do Developer Center > título da coluna.

## 3. Settings do widget no Developer Center (opcional)

Crie os campos abaixo **com exatamente estes IDs** (o código lê por ID):

| ID do campo        | Rótulo sugerido            | Tipo de campo | Obrigatório |
|--------------------|----------------------------|---------------|-------------|
| `title`            | Título do cartão           | Text          | Não (padrão "PRAZO") |
| `baseStartColumn`  | Linha Base Início          | Column        | Sim |
| `baseEndColumn`    | Linha Base Final           | Column        | Sim |
| `realStartColumn`  | Estimado Real Início       | Column        | Sim |
| `realEndColumn`    | Estimado Real Final        | Column        | Sim |
| `hiddenGroups`     | Grupos ocultos (separados por vírgula) | Text | Não |

- Os campos de data aceitam coluna **Timeline** ou **Data**. Para Timeline, escolha a mesma coluna
  em "Início" e "Final": o widget usa o início da Timeline no primeiro e o fim no segundo.
- Se um campo obrigatório ficar vazio, o widget tenta achar a coluna pelo título
  (ex.: "Linha Base", "Estimado Real Início") e, se não achar, pede a configuração.

## 4. Regras de cálculo

- Datas do grupo: menor início e maior fim entre os itens.
- % Linha Base: quanto do período Linha Base Início → Final já passou até hoje (0% antes do início, 100% depois do fim).
- % Real: o mesmo cálculo com as datas Estimado Real Início → Final.
- % do grupo: média ponderada pela duração da linha base de cada item. Não há colunas de %.
- Subitens não entram. Só o quadro em que o widget está instalado é lido.
- Grupos sem itens aparecem com "–".

## 5. Estrutura do código

```
src/
  App.jsx                    estados (carregando, erro, sem configuração, pronto) e tema
  api/monday.js              instância do SDK + runQuery (versão da API fixada)
  api/queries.js             consultas GraphQL (estrutura, itens, paginação)
  hooks/useMondayContext.js  contexto do dashboard (boardIds, tema)
  hooks/useMondaySettings.js settings do widget
  hooks/useBoardData.js      busca + paginação + agregação
  hooks/useWidgetConfig.js   lê/salva a configuração do menu (monday.storage.instance)
  domain/settings.js         resolve as colunas escolhidas (ou pelo título)
  domain/columnValues.js     lê datas de colunas Timeline e Data
  domain/aggregate.js        agregação por grupo e formatação DD/MM/AA e %
  components/                PrazoCard (moldura), PrazoTable (tabela), ConfigPanel (menu)
test/aggregate.test.js       teste com os dados da imagem de referência (npm test)
```
