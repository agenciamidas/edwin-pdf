const CACHE_NAME = 'estudio-leitor-ia-v3.0.0';

// Apenas os arquivos garantidos na raiz para não travar a instalação
const STATIC_ASSETS = [
  './',
  './index.html'
];

// 1. Instalação: salva o núcleo do aplicativo e assume controle imediato
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 2. Ativação: apaga qualquer cache antigo ("Mata Cache Zumbi")
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 3. Interceptação Inteligente: Cache Dinâmico (salva PDF.js, Mammoth.js, jsPDF e Tailwind no 1º acesso)
self.addEventListener('fetch', (event) => {
  // Ignora requisições POST (como o envio do feedback científico)
  if (event.request.method !== 'GET') return;

  // Ignora telemetria interna da Vercel para não interferir nas métricas reais
  if (event.request.url.includes('/_vercel/insights')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Valida se a resposta da rede é válida antes de clonar para o cache
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Fallback offline para navegação
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// Listener para atualização imediata quando solicitado
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
