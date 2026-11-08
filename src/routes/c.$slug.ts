import { createFileRoute } from '@tanstack/react-router';
import { getPublicShare, getShareImage } from '../lib/share-db.js';
import { escapeHtml } from '../lib/share-card.js';

// Página pública de uma conquista compartilhada: /c/<código>
// Mostra a conquista (com a prévia que o WhatsApp exibe) e leva ao cadastro com o código de indicação
// de quem compartilhou. /c/<código>?img=1 devolve a imagem da prévia.
const BOT = /bot|crawl|spider|facebookexternalhit|whatsapp|telegram|slack|discord|preview/i;

function page(origin: string, s: NonNullable<Awaited<ReturnType<typeof getPublicShare>>>): string {
  const url = `${origin}/c/${s.slug}`;
  const ref = encodeURIComponent(s.referralCode);
  const signup = `${origin}/login?modo=cadastro&ref=${ref}`;
  const about = `${origin}/?ref=${ref}`;
  const name = escapeHtml(s.name);
  const title = escapeHtml(`${s.name} conquistou: ${s.title}`);
  const desc = escapeHtml(`${s.subtitle ? `${s.subtitle} ` : ''}Entre no Ritmo e teste 7 dias grátis, sem cartão.`);
  const img = s.hasImage ? `${url}?img=1` : `${origin}/icon-512.png`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Ritmo</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ritmo">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0d1117">
<style>
  *{box-sizing:border-box;margin:0}
  body{min-height:100vh;background:radial-gradient(circle at 50% 0%,#064e3b 0%,#0d1117 55%);color:#f0f6fc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;justify-content:center;padding:24px 16px 40px}
  main{width:100%;max-width:420px;text-align:center}
  .brand{font-weight:900;letter-spacing:.2em;color:#34d399;font-size:14px}
  .card{margin:18px 0;border:1px solid #30363d;border-radius:28px;overflow:hidden;background:#161b22;box-shadow:0 20px 60px rgba(16,185,129,.18)}
  .card img{display:block;width:100%;height:auto}
  .fallback{padding:40px 20px}
  .emoji{font-size:84px;line-height:1}
  h1{font-size:24px;font-weight:800;margin-top:14px}
  p.sub{color:#8b949e;margin-top:8px;font-size:15px}
  .who{color:#c9d1d9;font-size:15px;margin-top:4px}
  .cta{display:block;margin-top:16px;padding:16px;border-radius:16px;background:#10b981;color:#052e1f;font-weight:900;font-size:17px;text-decoration:none;box-shadow:0 10px 30px rgba(16,185,129,.35)}
  .ghost{display:block;margin-top:10px;padding:12px;color:#8b949e;text-decoration:none;font-size:14px}
  ul{list-style:none;padding:0;margin:18px 0 0;text-align:left;color:#c9d1d9;font-size:14px}
  li{padding:6px 0}
  small{display:block;margin-top:18px;color:#6e7681;font-size:12px}
</style>
</head>
<body>
<main>
  <div class="brand">RITMO</div>
  <p class="who"><strong>${name}</strong> · Nível ${s.level} (${escapeHtml(s.levelName)}) compartilhou uma conquista</p>
  <div class="card">
    ${s.hasImage ? `<img src="${escapeHtml(img)}" alt="${title}" width="540" height="960">` : `<div class="fallback"><div class="emoji">${escapeHtml(s.emoji)}</div><h1>${escapeHtml(s.title)}</h1>${s.subtitle ? `<p class="sub">${escapeHtml(s.subtitle)}</p>` : ''}</div>`}
  </div>
  <a class="cta" href="${escapeHtml(signup)}">Quero entrar no Ritmo com ${name}</a>
  <a class="ghost" href="${escapeHtml(about)}">Conhecer o Ritmo primeiro</a>
  <ul>
    <li>✅ Hábitos, tarefas, foco e finanças num lugar só</li>
    <li>🎮 Pontos, níveis, temporada e desafios com amigos</li>
    <li>🎙️ Fale e o Ritmo anota para você</li>
    <li>🎁 7 dias grátis, sem cartão</li>
  </ul>
  <small>Um pouco melhor a cada dia.</small>
</main>
</body>
</html>`;
}

export const Route = createFileRoute('/c/$slug')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const slug = (params as any).slug;
        if (url.searchParams.get('img')) {
          const bytes = await getShareImage(slug).catch(() => null);
          if (!bytes) return new Response('Imagem não encontrada.', { status: 404 });
          return new Response(new Uint8Array(bytes), {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg', 'Content-Length': String(bytes.length), 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' },
          });
        }
        const isBot = BOT.test(request.headers.get('user-agent') || '');
        const share = await getPublicShare(slug, !isBot).catch(() => null);
        if (!share) return Response.redirect(`${url.origin}/`, 302);
        return new Response(page(url.origin, share), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' },
        });
      },
    },
  },
});
