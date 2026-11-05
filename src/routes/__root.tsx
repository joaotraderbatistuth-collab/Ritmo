import * as React from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

const siteName = 'Ritmo — Foco, Hábitos & Finanças'
const siteDescription = 'Plataforma completa de produtividade, ciclos de foco estilo Modo Caverna, acompanhamento de hábitos e gestão financeira pessoal equilibrada.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: siteName,
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:title',
        content: siteName,
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'theme-color',
        content: '#0d1117',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'Ritmo',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icon-512.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootError,
})

/** Tela amigável quando algo quebra; o erro vai para a aba Erros do painel admin. */
function RootError({ error }: { error: any }) {
  React.useEffect(() => {
    try {
      ;(window as any).__ritmoReportError?.(error?.message || String(error), error?.stack)
    } catch {}
  }, [error])
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#f0f6fc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 380, textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Ops, algo deu errado nesta tela.</h1>
        <p style={{ color: '#8b949e', fontSize: 14, marginTop: 8 }}>Já fomos avisados do problema. Seus dados estão salvos.</p>
        <button type="button" onClick={() => location.reload()} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 12, background: '#10b981', color: '#0d1117', fontWeight: 700, border: 0 }}>
          Recarregar
        </button>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <script
          // Guarda o convite de instalação do Android/Chrome assim que ele chega (antes do app carregar),
          // para o botão "App" instalar com um toque em vez de mostrar o passo a passo.
          dangerouslySetInnerHTML={{
            __html: `
              // De onde a pessoa veio (primeiro contato, guardado por 60 dias): utm_source, indicação ou Ritus.
              (function () {
                try {
                  var q = new URLSearchParams(location.search);
                  var src = q.get('utm_source') ? 'utm:' + q.get('utm_source') + (q.get('utm_campaign') ? '/' + q.get('utm_campaign') : '')
                    : q.get('ritus') || q.get('equipe') ? 'ritus'
                    : q.get('ref') ? 'indicacao'
                    : (document.referrer && document.referrer.indexOf(location.host) < 0 ? 'site:' + new URL(document.referrer).hostname.replace(/^www\./, '') : '');
                  var old = JSON.parse(localStorage.getItem('ritmo_source') || 'null');
                  if (src && (!old || Date.now() - old.at > 60 * 86400000)) localStorage.setItem('ritmo_source', JSON.stringify({ src: src.slice(0, 60), at: Date.now() }));
                } catch (e) {}
              })();
              // Alerta de erros: manda para o painel admin os erros que acontecerem no app.
              (function () {
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
                var sent = 0;
                function report(message, stack) {
                  try {
                    if (sent >= 10 || !message) return;
                    sent++;
                    var body = JSON.stringify({ message: String(message).slice(0, 500), stack: String(stack || '').slice(0, 4000), url: location.pathname + location.search.replace(/token=[^&]*/g, '') });
                    if (navigator.sendBeacon) navigator.sendBeacon('/api/erros', new Blob([body], { type: 'application/json' }));
                    else fetch('/api/erros', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
                  } catch (e) {}
                }
                window.__ritmoReportError = report;
                window.addEventListener('error', function (e) { if (e && e.message) report(e.message, e.error && e.error.stack); });
                window.addEventListener('unhandledrejection', function (e) { var r = e && e.reason; report(r && r.message ? r.message : String(r), r && r.stack); });
              })();
              window.addEventListener('beforeinstallprompt', function (e) {
                e.preventDefault();
                window.__ritmoInstallPrompt = e;
                window.dispatchEvent(new Event('ritmo:installable'));
              });
              window.addEventListener('appinstalled', function () {
                window.__ritmoInstallPrompt = null;
                try { localStorage.setItem('ritmo_app_installed', '1'); } catch (e) {}
                window.dispatchEvent(new Event('ritmo:installable'));
              });
            `,
          }}
        />
        {children}
        <script
          // Service worker só em produção (https). No localhost ele é DESREGISTRADO e o cache é
          // apagado, para o desenvolvimento nunca servir arquivos antigos.
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (!('serviceWorker' in navigator)) return;
                var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
                if (isLocal) {
                  navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); });
                  if (window.caches) caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); });
                  return;
                }
                navigator.serviceWorker.register('/sw.js').catch(function () {});
              })();
            `,
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}
