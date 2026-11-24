// 서비스 워커: 앱 전체를 미리 캐시해 오프라인에서 동작하게 한다.
// 아래 값은 scripts/postbuild.mjs가 빌드 결과에 맞춰 채운다.
const VERSION = "202611240842-1ca0b19d";
const ASSETS = ["assets/_foliate-unused-BvRk9kiK.js","assets/fixed-layout-fLOUqrT-.js","assets/index-BCx9tPkJ.js","assets/index-OIkMVp9i.css","assets/search-CmsudIUA.js","assets/tts-CwLbeXFM.js","calc/","calc/manifest.webmanifest","fonts/NOTICE.txt","fonts/OFL.txt","icons/calc-180.png","icons/calc-192.png","icons/calc-512.png","icons/memo-180.png","icons/memo-192.png","icons/memo-512.png","icons/unit-180.png","icons/unit-192.png","icons/unit-512.png","icons/viewer-180.png","icons/viewer-192.png","icons/viewer-512.png","icons/weather-180.png","icons/weather-192.png","icons/weather-512.png","./","manifest.webmanifest","memo/","memo/manifest.webmanifest","unit/","unit/manifest.webmanifest","weather/","weather/manifest.webmanifest"];
const FONTS = ["fonts/gowunbatang-400.b10bcc01.woff2","fonts/gowunbatang-700.597ce87e.woff2","fonts/maruburi-400.83f5ea90.woff2","fonts/maruburi-700.60261ad3.woff2","fonts/nanumbarungothic-400.78a101e4.woff2","fonts/nanumbarungothic-700.cbc069ef.woff2","fonts/nanumgothic-400.e15524d3.woff2","fonts/nanumgothic-700.30b7504d.woff2","fonts/nanummyeongjo-400.bf6a96b4.woff2","fonts/nanummyeongjo-700.a4578b7f.woff2","fonts/nanumsquareround-400.b88721e8.woff2","fonts/nanumsquareround-700.afcc58c5.woff2","fonts/notoserif-400.5f1768c5.woff2","fonts/notoserif-700.6d6bc109.woff2","fonts/pretendard-400.ae03a857.woff2","fonts/pretendard-700.001df0aa.woff2"];
// 이 버전까지 바뀐 점(src/changes.json). 적용을 기다리는 동안 앱이 물어 오면 알려 준다.
const CHANGES = [{"date":"2026-11-24","items":["TXT 파일도 넣을 수 있습니다. \"제1장\", \"1화\" 같은 줄로 목차를 만들고, 옛 윈도우 인코딩(CP949) 파일도 글자가 깨지지 않습니다.","안드로이드 크롬에서도 앱으로 설치할 수 있게 했습니다(시험 중).","갤럭시 폴드처럼 펼치는 폰을 펴면 만화는 좌우에 한 쪽씩, EPUB은 두 단으로 보입니다.","만화의 두 쪽 보기와 EPUB의 두 단 보기 설정 이름을 \"넓은 화면에서\"로 바꿨습니다.","쪽이 많은 만화도 처음 열 때 오래 기다리지 않습니다. 읽던 쪽부터 바로 보이고, 나머지 쪽 정보는 읽는 동안 뒤에서 읽습니다.","안드로이드에서 보기 설정 같은 창의 아래쪽 내용이 창 모서리 밖으로 튀어나오던 문제를 고쳤습니다.","안드로이드에서 책을 가져오거나 백업 파일을 저장할 때, 파일 고르는 창을 다녀와도 다시 비밀번호를 묻지 않습니다.","안드로이드에서 뒤로 가기를 하면 열린 창이나 앞 화면이 닫힙니다. 서재 첫 화면에서만 앱이 닫힙니다.","일부 기기에서 책갈피로 옮겨 가면 한 쪽 앞이 열리던 문제를 고쳤습니다."]},{"date":"2026-10-14","items":["새 버전이 나와도 바로 바뀌지 않습니다. 바뀐 점을 보고 적용할지 고를 수 있습니다.","설정 → 앱 정보에서 버전, 가져온 파일에 대한 안내, 오픈소스 라이선스를 볼 수 있습니다.","앱 이름을 \"만화방\"으로 바꾸고 기본 아이콘을 새로 그렸습니다."]},{"date":"2026-10-13","items":["화면 위쪽 상태 표시줄 자리에 본문이 겹쳐 흐려지던 문제를 고쳤습니다.","백업은 기본으로 읽은 기록만 담습니다. 책을 다시 가져오면 보관해 둔 기록이 자동으로 붙습니다.","백업 파일의 기본 크기를 2GB로 늘리고, 저장 옆에 내려받기를 늘 함께 둡니다."]}];
const CACHE = `app-${VERSION}`;
// 글꼴은 용량이 커서 버전과 상관없이 따로 오래 둔다. 받는 일은 앱 화면 쪽(fonts.svelte.ts)이 한다.
const FONT_CACHE = 'fonts';
const SCOPE_PATH = new URL('./', self.location.href).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        ASSETS.map(async (path) => {
          const res = await fetch(new Request(path, { cache: 'reload' }));
          if (!res.ok) throw new Error(`${path}: ${res.status}`);
          // 리다이렉트된 응답은 페이지 이동에 쓸 수 없어 새 응답으로 감싼다.
          const clean = res.redirected
            ? new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers })
            : res;
          await cache.put(path, clean);
        }),
      );
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE && key !== FONT_CACHE) await caches.delete(key);
      // 더는 쓰지 않는 글꼴 파일을 지운다.
      const fonts = await caches.open(FONT_CACHE);
      const wanted = new Set(FONTS.map((path) => new URL(path, self.location.href).href));
      for (const request of await fonts.keys()) if (!wanted.has(request.url)) await fonts.delete(request);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
  if (event.data === 'version') event.source?.postMessage({ version: VERSION });
  if (event.data === 'changes') event.source?.postMessage({ next: { version: VERSION, changes: CHANGES } });
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const key = url.origin + url.pathname.replace(/index\.html$/, '');
      return (await cache.match(key, { ignoreVary: true })) ?? (await caches.match(key, { cacheName: FONT_CACHE })) ?? fetch(req);
    })(),
  );
});
