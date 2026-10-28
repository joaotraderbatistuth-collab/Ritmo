// ============================================================================
// Envio de e-mails transacionais via Resend (https://resend.com).
// Sem RESEND_API_KEY configurada, as funções retornam { sent: false } e quem
// chamar decide o que fazer — nunca finja que um e-mail foi enviado sem ter
// sido. Usado para: código de recuperação de senha e confirmação de pagamento.
// ============================================================================

const RESEND_API_URL = 'https://api.resend.com/emails';

interface SendEmailResult {
  sent: boolean;
  error?: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || 'Ritmo <nao-responda@meu-ritmo.netlify.app>';

  if (!apiKey) {
    return { sent: false, error: 'RESEND_API_KEY não configurada.' };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromAddress, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { sent: false, error: `Resend respondeu ${res.status}: ${body}` };
    }
    return { sent: true };
  } catch (e: any) {
    return { sent: false, error: e.message || 'Falha de rede ao enviar e-mail.' };
  }
}

export async function sendPasswordResetEmail(to: string, name: string, code: string): Promise<SendEmailResult> {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #059669;">Recuperação de senha — Ritmo</h2>
      <p>Olá, ${name || ''}!</p>
      <p>Use o código abaixo para redefinir sua senha. Ele expira em 1 hora e só pode ser usado uma vez.</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; background: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px;">${code}</p>
      <p style="font-size: 13px; color: #64748b;">Se você não pediu essa recuperação, pode ignorar este e-mail com segurança — sua senha não será alterada.</p>
    </div>
  `;
  return sendEmail(to, 'Seu código de recuperação de senha — Ritmo', html);
}

export async function sendPaymentConfirmationEmail(to: string, name: string, amountCents: number, renewalDate: string): Promise<SendEmailResult> {
  const amount = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #059669;">Pagamento confirmado — Ritmo</h2>
      <p>Olá, ${name || ''}!</p>
      <p>Recebemos seu pagamento de <strong>${amount}</strong>. Sua assinatura Ritmo PRO está ativa até <strong>${new Date(renewalDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>.</p>
      <p style="font-size: 13px; color: #64748b;">Você pode consultar suas faturas a qualquer momento em Perfil &gt; Assinatura dentro do app.</p>
    </div>
  `;
  return sendEmail(to, 'Pagamento confirmado — Ritmo PRO', html);
}

// Lembrete de vencimento: teste grátis acabando ou assinatura mensal vencendo.
export async function sendRenewalReminderEmail(
  to: string,
  name: string,
  kind: 'trial' | 'subscription',
  daysLeft: number
): Promise<SendEmailResult> {
  const appUrl = process.env.URL || 'https://meu-ritmo.netlify.app';
  const dias = daysLeft === 1 ? '1 dia' : `${daysLeft} dias`;
  const title = kind === 'trial' ? `Seu teste grátis acaba em ${dias}` : `Sua assinatura vence em ${dias}`;
  const body =
    kind === 'trial'
      ? 'Para continuar usando suas rotinas, quadros, hábitos e finanças sem interrupção, assine o Ritmo PRO (R$ 39,90/mês).'
      : 'A cobrança do Ritmo PRO é mensal e manual. Renove antes do vencimento para não perder o acesso.';
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #059669;">${title}</h2>
      <p>Olá, ${name || ''}!</p>
      <p>${body}</p>
      <p><a href="${appUrl}/checkout" style="display:inline-block;background:#10b981;color:#052e1f;font-weight:bold;padding:12px 20px;border-radius:8px;text-decoration:none;">${kind === 'trial' ? 'Assinar agora' : 'Renovar agora'}</a></p>
      <p style="font-size: 12px; color: #64748b;">Seus dados continuam guardados mesmo que o acesso seja pausado.</p>
    </div>
  `;
  return sendEmail(to, `${title} — Ritmo`, html);
}
