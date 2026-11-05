// Consentimentos da LGPD: o que cada um cobre e a versão atual dos documentos. Regras PURAS.

/** Mude esta data sempre que os Termos ou a Política de Privacidade mudarem: todos aceitam de novo. */
export const LEGAL_VERSION = '2026-11-05';

export type ConsentKind = 'termos' | 'saude' | 'gps' | 'voz';

export const CONSENT_KINDS: ConsentKind[] = ['termos', 'saude', 'gps', 'voz'];

export const CONSENT_TEXT: Record<ConsentKind, { title: string; body: string }> = {
  termos: {
    title: 'Termos de Uso e Política de Privacidade',
    body: 'Aceite dos Termos de Uso e da Política de Privacidade do Ritmo.',
  },
  saude: {
    title: 'Dados de bem-estar',
    body: 'Hábitos, treinos, diário e humor que você registrar podem revelar informações de saúde. O Ritmo usa esses dados só para fazer o app funcionar para você (lembretes, progresso, pontos) e nunca os vende ou mostra a outras pessoas sem você publicar.',
  },
  gps: {
    title: 'Localização nos treinos',
    body: 'Durante um treino, o Ritmo usa o GPS do aparelho para medir distância e desenhar a rota. A localização só é lida com o treino aberto, fica guardada na sua conta e só aparece para outras pessoas se você compartilhar (com o começo e o fim escondidos, se preferir).',
  },
  voz: {
    title: 'Comando de voz',
    body: 'Quando você toca no microfone, o seu navegador (Google no Chrome, Apple no Safari) transforma a fala em texto. O Ritmo recebe só o texto, para entender o pedido, e não grava o áudio.',
  },
};

export function isConsentKind(v: unknown): v is ConsentKind {
  return typeof v === 'string' && (CONSENT_KINDS as string[]).includes(v);
}

/** Precisa aceitar de novo? (nunca aceitou ou aceitou uma versão anterior dos documentos) */
export function needsLegalAcceptance(granted: { kind: string; version: string; revokedAt?: string | null }[]): boolean {
  const t = granted.find((g) => g.kind === 'termos' && !g.revokedAt);
  return !t || t.version !== LEGAL_VERSION;
}
