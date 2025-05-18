const CACHE_NAME = 'eat-1.0.4'; // 更新缓存名称
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/img/filter.svg',
    '/img/menu.svg',
    '/img/chat.svg'
];
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('打开缓存');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('从缓存中获取:', event.request.url);
                    return response;
                }
                console.log('请求网络:', event.request.url);
                return fetch(event.request);
            })
    );
});

// 监听 updatefound 事件
self.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
            // 发送消息给页面
            self.clients.claim().then(() => {
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({ type: 'UPDATE_AVAILABLE' });
                    });
                });
            });
        }
    });
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('install', event => {
    //self.skipWaiting(); // 跳过等待阶段
});

self.addEventListener('activate', event => {
    clients.claim(); // 立即控制所有客户端
});