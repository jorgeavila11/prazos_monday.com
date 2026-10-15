// Leitura de datas das colunas Timeline e Data da API monday.

const ISO_DATE = /^(\d{4}-\d{2}-\d{2})/;

function isoDay(v) {
  if (!v) return null;
  const m = String(v).match(ISO_DATE);
  return m ? m[1] : null;
}

function parseJson(v) {
  if (!v || typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

/**
 * Lê uma data de uma coluna Timeline ou Data.
 * edge = "start" usa o início da Timeline; edge = "end" usa o fim.
 * Retorna "YYYY-MM-DD" ou null.
 */
export function readDate(cv, edge) {
  if (!cv) return null;
  const raw = parseJson(cv.value);
  if (cv.type === "timeline") {
    const v = edge === "end" ? cv.to ?? raw?.to : cv.from ?? raw?.from;
    return isoDay(v);
  }
  // Coluna Data (ou outra com data no valor)
  return isoDay(cv.date ?? raw?.date ?? cv.text);
}
