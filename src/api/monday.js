import mondaySdk from "monday-sdk-js";

// Instância única do SDK, compartilhada por todo o widget.
export const monday = mondaySdk();

// Versão da API GraphQL fixada para o widget não quebrar em upgrades da monday.
export const API_VERSION = "2026-07";
monday.setApiVersion(API_VERSION);

/**
 * Executa uma consulta GraphQL com o token da sessão do usuário.
 * Lança erro se a API devolver `errors` ou `error_message`.
 */
export async function runQuery(query, variables = {}) {
  const res = await monday.api(query, { variables });
  if (res?.errors?.length) {
    throw new Error(res.errors.map((e) => e.message).join("; "));
  }
  if (res?.error_message) {
    throw new Error(res.error_message);
  }
  return res.data;
}
