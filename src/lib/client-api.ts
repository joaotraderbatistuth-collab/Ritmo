/** Chamada simples à API do app: devolve { ok, status, data } e nunca lança erro de rede. */
export async function callApi<T = any>(url: string, body?: Record<string, unknown>): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const res = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Sem conexão. Verifique a internet e tente de novo.' } as any };
  }
}
