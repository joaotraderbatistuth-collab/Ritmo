// Service worker do Ritmo — cache simples para uso como PWA.
// Importante: nunca armazena em cache chamadas de API (/api/*), que carregam
// dados privados e autenticados do usuário — essas sempre vão direto à rede.

const CACHE_VERSION = 'ritmo-v7'; // troque a cada atualização grande: limpa o cache antigo de quem já tem o app instalado
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nunca interceptar chamadas de API — sempre dados frescos do servidor.
  if (url.pathname.startsWith('/api/')) return;

  // Navegação (HTML): tenta rede primeiro, cai para cache se offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Só arquivos versionados do build (/assets/) e ícones entram no cache; o resto vai direto à rede.
  const cacheable = url.pathname.startsWith('/assets/') || /\/(icon-|apple-touch-icon|favicon)/.test(url.pathname);
  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// ---------------- Notificações (Web Push) ----------------
// O servidor manda { title, body, tab }. Tocar na notificação abre o app na aba indicada.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Ritmo', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Ritmo';
  const url = `/app?tab=${encodeURIComponent(data.tab || 'hoje')}`;
  // Ritmo do som da marca na vibração: tum-tum-tiiim
  const vibrate = [70, 70, 70, 90, 220];
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const visible = list.filter((c) => c.visibilityState === 'visible');
      // App aberto na tela: ele mesmo mostra o aviso no topo e toca o som do Ritmo.
      for (const c of visible) c.postMessage({ type: 'ritmo-push', title, body: data.body || '', tab: data.tab || 'hoje', url });
      const silent = visible.length > 0;
      const options = {
        body: data.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag || 'ritmo',
        renotify: Boolean(data.tag && String(data.tag).startsWith('ritmo-admin')),
        // com o app aberto o som da marca já toca lá dentro: a notificação do sistema fica sem som.
        // Atenção: o Chrome RECUSA notificação silenciosa com vibração, por isso só vibra quando não é silenciosa.
        silent,
        timestamp: Date.now(),
        data: { url },
      };
      if (!silent) options.vibrate = vibrate;
      return self.registration
        .showNotification(title, options)
        // se o aparelho recusar alguma opção, mostra a versão mais simples (nunca deixa de aparecer)
        .catch(() => self.registration.showNotification(title, { body: data.body || '', icon: '/icon-192.png', tag: data.tag || 'ritmo', data: { url } }));
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (new URL(c.url).pathname.startsWith('/app') && 'focus' in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
