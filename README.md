# Foventra ONE API · @foventra/api

Official server-side Node.js SDK documentation. Uptime · Minecraft · Pulse · Notifications · Usage.

[English](#english) · [Türkçe](#turkce) · [Foventra](https://www.foventra.com) · [License](LICENSE)

This GitHub repository contains **documentation and a usage example**, not the SDK implementation. Install the SDK through npm when the beta is available. `index.js` is a read-only integration example; it does not contain server or SDK internals.

Bu GitHub deposunda **doküman ve kullanım örneği** bulunur; SDK uygulaması bulunmaz. `index.js` salt okunur bir entegrasyon örneğidir. SDK beta erişilebilir olduğunda npm üzerinden kurulur.

## Run the example / Örneği çalıştır

Requires Node.js 20.3+, an active Pro/Ultimate plan and a key with `uptime.read`.

```sh
npm install @foventra/api@beta
# Set FOVENTRA_API_KEY securely in your server environment first.
node index.js
```

The command is for the GitHub usage-example file; the npm SDK package does not automatically run it. It lists monitor counts and quota metadata, makes no writes and never prints the secret. For another trusted environment set `FOVENTRA_API_BASE_URL` on the server.

`index.js` GitHub'daki örnek dosyadır; npm paketi bu örneği kendiliğinden çalıştırmaz. Monitör adetleri ve kota metadata gösterilir, yazma yapılmaz ve gizli anahtar yazdırılmaz. Özel/güvenilir API ortamı için sunucuda `FOVENTRA_API_BASE_URL` ayarlanabilir.

<a id="english"></a>

## English

> **0.1.0-beta.1 · submitted to npm, processing pending.** npm accepted the beta publish after two-factor authentication. The registry currently shows a temporary holding version; the SDK beta is not installable yet. Use the installation command only once `0.1.0-beta.1` is available. The use-only license is included in [LICENSE](LICENSE).

## What you get

- ESM and CommonJS, TypeScript declarations, Node.js 20.3+.
- Native `fetch`; no runtime dependencies.
- Read/write monitor management, measurements and analytics.
- Pulse pages, incident updates and scheduled maintenance.
- Account-shared quota metadata, reset countdown and typed API errors.
- Ultimate bulk operations and signed webhooks.
- Bounded GET retries, cancellation and no automatic retries for writes.

This is a **Node.js SDK**, not a Python package or a browser SDK. Other languages can use the REST API. Vue, React and other browser applications must call their own authenticated backend; never ship a Foventra key to the browser.

## Installation and access

npm installation once the beta is available:

```sh
npm install @foventra/api@beta
```

For an authorized local preview, install a locally supplied SDK folder or tarball instead:

```sh
npm install "/absolute/path/to/foventra/packages/foventra-api"
# Or: npm install "/absolute/path/to/foventra-api-0.1.0-beta.1.tgz"
```

Both install the same package identity, `@foventra/api`. A documentation-only GitHub repository is not an installable SDK source repository.

Create a key in Dashboard → API. Keep it in the **server environment** as `FOVENTRA_API_KEY`. Use only the scopes your integration needs; optionally restrict IPs and expiration. A valid paid subscription is also required. A key cannot grant itself permissions or change other keys.

| Capability | Free | Pro | Ultimate |
| --- | --- | --- | --- |
| Authenticated API access | Locked | Read/write, subject to scopes | Read/write, subject to scopes |
| Active keys | 0 | 5 | 20 |
| Account quota units/minute | — | 60 | 300 |
| Request history retention | — | 30 days | 90 days |
| Bulk monitor operations | — | — | Up to 50 items/request |
| Webhook subscriptions | — | — | Up to 10 |

API access does not bypass monitor quotas, minimum intervals or other service-plan restrictions. Use the live `/limits` response as the authority if plans change.

## Quick start: read first

Save as `monitors.mjs` and run `node monitors.mjs` after configuring the server environment:

```js
import { FoventraClient, FoventraApiError } from '@foventra/api';

const client = new FoventraClient({
  apiKey: process.env.FOVENTRA_API_KEY,
  // Default: https://api.foventra.com/v1
  // Override only with your trusted Foventra API environment.
  baseUrl: process.env.FOVENTRA_API_BASE_URL || 'https://api.foventra.com/v1',
  timeout: 10_000,
  retries: 1
});

try {
  const { web, minecraft } = await client.monitors.list({ type: 'all', limit: 20 });
  console.log('Web monitors:', web.length, 'Minecraft monitors:', minecraft.length);
  console.log('Remaining units:', client.lastRateLimit?.remaining);
} catch (error) {
  if (!(error instanceof FoventraApiError)) throw error;
  console.error(error.code, error.status, error.requestId);
  console.error('Quota:', error.rateLimit, 'Retry after:', error.retryAfter);
  process.exitCode = 1;
}
```

Scope: `uptime.read`. `list()` defaults to a **web array**; `type:'minecraft'` returns a Minecraft array; `type:'all'` returns **{web, minecraft}**, not a flat array. Pagination uses `limit` and `offset`.

### CommonJS

```js
const { FoventraClient } = require('@foventra/api');
const client = new FoventraClient({ apiKey: process.env.FOVENTRA_API_KEY });
client.usage.limits()
  .then(limits => console.log(limits.plan, limits.rate_limit.remaining))
  .catch(error => { console.error(error.code, error.status); process.exitCode = 1; });
```

### TypeScript

```ts
import FoventraClient, { type Monitor, type Scope } from '@foventra/api';

const requiredScopes: Scope[] = ['uptime.read'];
const client = new FoventraClient();
const result = await client.monitors.list({ type: 'all' });
if (!Array.isArray(result)) {
  const web: Monitor[] = result.web;
  console.log(web.length, requiredScopes);
}
```

The default constructor reads `FOVENTRA_API_KEY`; it does not load a `.env` file. Use a server-side environment loader if needed.

## Client options

| Option | Default | Meaning |
| --- | --- | --- |
| `apiKey` | `process.env.FOVENTRA_API_KEY` | Required nonempty secret |
| `baseUrl` | `https://api.foventra.com/v1` | HTTPS API root, no credentials/query/fragment |
| `timeout` | 15000 | Milliseconds per transport attempt; 1–300000 |
| `retries` | 1 | Additional GET attempts; 0–3 |
| `maxRetryDelay` | 30000 | Maximum retry wait in milliseconds; 0–300000 |
| `fetch` | Native `fetch` | Optional compatible server transport |
| `onResponse` | None | Synchronous response metadata observer |

HTTP is allowed only for loopback development. Redirects are rejected. Your key is sent in the Authorization header, not a URL. Configure `baseUrl` only from trusted server configuration: any configured server receives the key.

Total elapsed time may include multiple attempts and waits. There is no automatic retry of transport failures, invalid JSON, or POST/PATCH/DELETE writes. GET retries only 429, 502, 503 and 504 JSON API responses, respecting `Retry-After` up to the configured maximum.

## Resource reference and scopes

| Resource | SDK methods | Scope |
| --- | --- | --- |
| Account | `account.me()` | `account.read` |
| Overview | `overview()` | `uptime.read` |
| Monitors: read | `list, get, status, checks, analytics` | `uptime.read` |
| Monitors: write | `create, createMinecraft, update, pause, resume, remove` | `uptime.write` |
| Monitors: bulk | `bulkCreate, bulkUpdate` | `uptime.write` + Ultimate |
| Pulse pages | `pulse.pages.list, get` / `create, update` | `pulse.read` / `pulse.write` |
| Pulse incidents | `pulse.incidents.list` / `create, addUpdate` | `pulse.read` / `pulse.write` |
| Pulse maintenance | `pulse.maintenance.list` / `create, update, addUpdate` | `pulse.read` / `pulse.write` |
| Notifications | `notifications.list` / `setRead` | `notifications.read` / `notifications.write` |
| Usage history | `usage.get` | `usage.read` |
| Current limits | `usage.limits` | Any valid paid key; no extra scope |
| Webhooks: read | `webhooks.list, deliveries` | `webhooks.read` + Ultimate |
| Webhooks: write | `webhooks.create, update, remove, rotateSecret` | `webhooks.write` + Ultimate |

All resource identifiers are strings. Methods returning paginated Pulse/notification/delivery lists use `{items, pagination:{page, limit, total, hasMore}}`. Their query arguments accept `page` and `limit`; list limits remain server-controlled.

Canonical endpoint details and schemas are available at your API root + `/docs` and `/openapi.json`. Use the matching environment's documentation.

## Measurements and analytics

```js
const monitorId = 'YOUR_MONITOR_ID'; // A monitor owned by your account
const monitor = await client.monitors.get(monitorId);
const checks = await client.monitors.checks(monitorId, { hours: 24, limit: 100 });
const analytics = await client.monitors.analytics(monitorId, { hours: 24 });
console.log(monitor.status, analytics.samples, analytics.p95, checks.length);
```

Analytics windows: 1, 6, 24, 168 or 720 hours, subject to service-plan permissions. Fields include sample count, success rate, average, p50, p95, p99 and `truncated`. p95 means 95% of included measured response times are at or below that value.

**No observations is not 100% uptime.** Missing uptime/latency/statistics are `null`; a newly created or resumed monitor may be `unknown` until actually measured. The SDK retrieves server observations; it does not independently probe websites, invent samples or guarantee availability.

## Writes: deliberate actions

The following changes create real resources and require write scopes. Do not automatically run these in a read-only diagnostic or retry a timed-out write without checking whether it succeeded.

```js
// uptime.write
const monitor = await client.monitors.create({
  name: 'Health endpoint',
  url: 'https://example.com/health',
  method: 'GET',
  interval_seconds: 60,
  timeout_ms: 10_000,
  advanced_checks: {
    acceptedStatusCodes: '200-299',
    keyword: 'ok',
    keywordMode: 'contains',
    failureThreshold: 3,
    recoveryThreshold: 2
  }
});
await client.monitors.pause(monitor.id);
await client.monitors.resume(monitor.id);
// Destructive, only if intended: await client.monitors.remove(monitor.id);
```

Advanced checks support HTTP bodies, JSON path/expected values, status ranges, SSL warnings and response-time thresholds. Available features, destinations and settings are validated by the server; forbidden/internal targets are not made valid by the SDK.

```js
// pulse.write
const page = await client.pulse.pages.create({
  title: 'Service status', slug: 'my-service', theme: 'dark', is_public: false
});
const incident = await client.pulse.incidents.create(page.id, {
  title: 'Investigating errors', impact: 'minor', body: 'We are checking the service.'
});
await client.pulse.incidents.addUpdate(incident.id, {
  status: 'resolved', message: 'Service recovered.'
});
const maintenance = await client.pulse.maintenance.create(page.id, {
  title: 'Scheduled update',
  scheduled_start: '2027-01-15T01:00:00Z',
  scheduled_end: '2027-01-15T02:00:00Z'
});
// Actual state change, only at the appropriate time:
// await client.pulse.maintenance.addUpdate(maintenance.id, {
//   status: 'in_progress', message: 'Maintenance started.'
// });
```

Incident states: investigating → identified → monitoring → resolved. Maintenance states: scheduled → in_progress → completed. Follow the server's transition rules.

## Quotas, usage and response metadata

```js
const limits = await client.usage.limits(); // Also consumes one quota unit
console.log(limits.rate_limit.remaining, limits.rate_limit.reset_at_iso);
console.log(limits.rate_limit.resets_in_seconds);

const response = await client.requestWithMeta('GET', '/monitors', {
  query: { type: 'web', limit: 10, offset: 0 }
});
console.log(response.data, response.status, response.requestId);
console.log(response.rateLimit, response.ipRateLimit, response.retryAfter);

const usage = await client.usage.get({ hours: 24, page: 1, limit: 20 }); // usage.read
console.log(usage.summary, usage.retentionDays);
```

Resource helpers return `data`, not the full wire envelope. `requestWithMeta` returns `{data, status, requestId, rateLimit, ipRateLimit, retryAfter}`. Quota mapping exposes `resetAt` (Unix seconds), `resetAtIso` (UTC) and server-calculated `resetsInSeconds`. Do not assume your local clock is synchronized.

Quota is **shared by all keys in the account**, not one independent allowance per key or a monthly credit balance. IP abuse limits are separate. Automatic GET retries each consume requests. Usage windows: 1, 24, 168, 720 or 2160 hours; 2160 requires Ultimate. History from this endpoint is scoped to the current key and bounded by the current plan.

History contains request metadata, not secrets or request bodies. Fully authenticated requests that fail scopes, IP restrictions, plans or quota can appear. Invalid secrets do not belong to your key's history. Logging is eventually persisted and starts at deployment; absence of a very recent entry is not proof that no request occurred.

## Errors and cancellation

```js
const controller = new AbortController();
const operation = client.monitors.list({ type: 'web' }, { signal: controller.signal });
// controller.abort(); // Cancel if your task is no longer needed
await operation;
```

`FoventraApiError` includes `code, status, requestId, rateLimit, ipRateLimit, retryAfter`. Local configuration/identifier errors can be `TypeError`.

| Situation | Typical result |
| --- | --- |
| Missing/invalid key | Constructor error or HTTP 401 |
| Missing write scope | HTTP 403, `missing_scope` |
| Free/expired paid entitlement | HTTP 403, `plan_api_locked` |
| Restricted plan feature | HTTP 403, `plan_feature_locked` |
| Foreign/missing resource | HTTP 404 |
| Quota exhausted | HTTP 429 with reset metadata |
| Network failure or timeout | `transport_error`, status 0 |
| Caller abort | `aborted`, status 0 |
| Invalid/incomplete JSON response | `invalid_response` |

If a write's response is lost, its outcome may be unknown. This beta has no server idempotency-key support. Inspect current state before an intentional manual retry.

## Ultimate bulk operations

```js
const batch = await client.monitors.bulkCreate([
  { kind: 'web', settings: { name: 'Health', url: 'https://example.com/health' } },
  { kind: 'minecraft', settings: { name: 'Minecraft', host: 'mc.example.com', port: 25565 } }
]);
for (const result of batch.results) {
  console.log(result.index, result.success, result.code);
}
// bulkUpdate([{ id: 'YOUR_MONITOR_ID', settings: { name: 'New name' } }])
```

Maximum 50 items. Each item costs one quota unit. Results preserve item order and support partial success: `atomic:false`. This is not an all-or-nothing transaction; retrying the entire batch can duplicate successful items.

## Signed webhooks

```js
const subscription = await client.webhooks.create({
  name: 'Service events',
  url: 'https://your-server.example/foventra/events',
  events: ['monitor.down', 'monitor.up']
});
// Save subscription.secret immediately in a secret store.
// list/update do not expose it again. rotateSecret returns a new secret.
```

Events: `monitor.up`, `monitor.down`, `pulse.incident.updated`, `pulse.maintenance.updated`.

Verify `X-Foventra-Signature` against **raw request bytes before JSON parsing**. Example verification, not a complete receiver:

```js
import { verifyWebhookSignature } from '@foventra/api';

const valid = verifyWebhookSignature(rawBody, signatureHeader, signingSecret);
// Default timestamp tolerance: 300 seconds.
// If valid is false, reject; otherwise parse and validate the event schema.
// Persist a deduplication record keyed by the JSON event's id before processing.
```

Keep your server clock synchronized. The helper rejects malformed, stale and tampered signatures and bodies over 16 KiB. Destination URLs must be public HTTPS/443; DNS/IPs are revalidated per attempt and redirects are not followed.

The queue supports retries (at most 5 attempts), so duplicate delivery is possible. Delivery is **not guaranteed**; handle missed events with reconciliation. Delivery records/event bodies are retained for 7 days. Current Pulse event production covers API mutations, not Dashboard Pulse mutations. Event creation and the source mutation are not transactional.

## Security and support

Keep keys on your server. Browser framework examples need a backend authenticated as your own user and proper resource authorization; a generic shared-account proxy is not safe for multiple customers. Never post keys, signing secrets, payment data or full sensitive responses in issues.

For a bug report include SDK version, Node version, error code, HTTP status, request ID and a redacted minimal example. Contact support through the [Foventra website](https://www.foventra.com). A request ID is more useful than a screenshot exposing an API key.

## License and distribution

The [Foventra SDK Use-Only License](LICENSE) permits personal/commercial use of an unmodified official SDK and adaptation of the integration examples. It prohibits changing the SDK implementation, distributing modified SDK versions, and republishing it as a standalone package without separate permission. Unmodified inclusion in your application is permitted as described in the license. This is a custom restricted license, not MIT or an open-source license. Read the full terms.

Distribution: npm contains the SDK; GitHub contains usage documentation and examples only. npm's JavaScript files are readable: omitting source from GitHub does not make npm code technically uneditable. License terms govern permitted use; they do not provide technical copy protection.

<details>
<summary><strong>Türkçe dokümantasyon</strong></summary>

<a id="turkce"></a>

## Türkçe

> **0.1.0-beta.1 · npm'e gönderildi, işlenmesi bekleniyor.** npm iki aşamalı doğrulama sonrasında beta yayınını kabul etti. Şu anda geçici bekleme sürümü gösteriliyor; SDK betası henüz kurulabilir değil. Kurulum komutunu `0.1.0-beta.1` erişilebilir olduğunda kullanın. Özel kullanım lisansı [LICENSE](LICENSE) dosyasındadır.

## Neler var?

- Node.js 20.3+, ESM/CommonJS ve TypeScript tipleri.
- Native fetch; çalışma zamanı bağımlılığı yok.
- Web/Minecraft monitörleri için okuma, oluşturma, düzenleme, durdurma/devam ettirme.
- Gerçek ölçüm kayıtları ve gelişmiş analitik.
- Pulse sayfaları, olay güncellemeleri, planlı bakım.
- Kalan hesap kotası, sunucu bazlı yenilenme süresi, tipli hatalar.
- Ultimate: toplu işlemler ve imzalı webhook abonelikleri.
- Sınırlı GET tekrarları, iptal desteği; yazma isteklerinde otomatik tekrar yok.

Bu bir **Node.js SDK'sıdır**. Python ve diğer diller REST API kullanır; ayrı bir Python SDK'sı varmış gibi düşünmeyin. Vue/React gibi tarayıcı uygulamalarında API anahtarı bulunmamalıdır; kendi kimlik doğrulamalı backend'inizi kullanın.

## Kurulum ve erişim

Beta erişilebilir olduktan sonra npm kurulumu:

```sh
npm install @foventra/api@beta
```

Yetkili yerel önizleme için size verilen paket klasörünü veya arşivini kurun:

```sh
npm install "/absolute/path/to/foventra/packages/foventra-api"
# Alternatif: npm install "/absolute/path/to/foventra-api-0.1.0-beta.1.tgz"
```

Kurulan paket kimliği `@foventra/api` olur. Dokümantasyon deposunu GitHub'dan klonlamak SDK kurmak değildir.

Dashboard → API bölümünde anahtar oluşturun. Anahtarı sunucu ortamında `FOVENTRA_API_KEY` olarak tutun; sadece gereken izinleri verin. İsteğe bağlı IP kısıtı ve sona erme tarihi ayarlayın. Anahtar kendi izinlerini yükseltemez veya başka anahtarları yönetemez.

| Özellik | Free | Pro | Ultimate |
| --- | --- | --- | --- |
| Kimlik doğrulamalı API | Kapalı | İzinlere bağlı okuma/yazma | İzinlere bağlı okuma/yazma |
| Aktif anahtar | 0 | 5 | 20 |
| Hesap genelinde dakika kotası | — | 60 birim | 300 birim |
| İstek geçmişi | — | 30 gün | 90 gün |
| Toplu monitör işlemleri | — | — | İstek başına en fazla 50 |
| Webhook aboneliği | — | — | En fazla 10 |

API erişimi monitör limitini, minimum kontrol aralığını veya diğer servis-plan kısıtlarını kaldırmaz. Güncel yetki/kota için canlı `/limits` yanıtına bakın.

## İlk kullanım: önce okuma

Sunucu ortam değişkenini ayarladıktan sonra `monitors.mjs` dosyasını `node monitors.mjs` ile çalıştırın:

```js
import { FoventraClient, FoventraApiError } from '@foventra/api';

const client = new FoventraClient({
  apiKey: process.env.FOVENTRA_API_KEY,
  baseUrl: process.env.FOVENTRA_API_BASE_URL || 'https://api.foventra.com/v1',
  timeout: 10_000,
  retries: 1
});

try {
  const { web, minecraft } = await client.monitors.list({ type: 'all', limit: 20 });
  console.log('Web:', web.length, 'Minecraft:', minecraft.length);
  console.log('Kalan birim:', client.lastRateLimit?.remaining);
} catch (error) {
  if (!(error instanceof FoventraApiError)) throw error;
  console.error(error.code, error.status, error.requestId);
  console.error(error.rateLimit, error.retryAfter);
  process.exitCode = 1;
}
```

İzin: `uptime.read`. Varsayılan `list()` web dizisi, `type:'minecraft'` Minecraft dizisi, `type:'all'` ise **{web, minecraft}** nesnesi döndürür. Monitör listesinde sayfalama `limit/offset` ile yapılır.

### CommonJS

```js
const { FoventraClient } = require('@foventra/api');
const client = new FoventraClient();
client.usage.limits()
  .then(limits => console.log(limits.plan, limits.rate_limit.remaining))
  .catch(error => { console.error(error.code, error.status); process.exitCode = 1; });
```

### TypeScript

```ts
import FoventraClient, { type Monitor, type Scope } from '@foventra/api';
const scopes: Scope[] = ['uptime.read'];
const client = new FoventraClient();
const result = await client.monitors.list({ type: 'all' });
if (!Array.isArray(result)) {
  const web: Monitor[] = result.web;
  console.log(web.length, scopes);
}
```

Constructor anahtarı `process.env.FOVENTRA_API_KEY` üzerinden okuyabilir; SDK kendiliğinden `.env` dosyası yüklemez.

## Ayarlar

| Ayar | Varsayılan | Açıklama |
| --- | --- | --- |
| apiKey | Sunucu ortamı | Boş olmayan gizli anahtar |
| baseUrl | https://api.foventra.com/v1 | HTTPS API kökü; kullanıcı bilgisi/query/hash olamaz |
| timeout | 15000 ms | Deneme başına 1–300000 ms |
| retries | 1 | GET için ek deneme, 0–3 |
| maxRetryDelay | 30000 ms | En uzun tekrar beklemesi, 0–300000 ms |
| fetch | Native fetch | Uyumlu sunucu transport'u |
| onResponse | Yok | Senkron metadata gözlemcisi |

HTTP sadece loopback geliştirmede kabul edilir; yönlendirmeler takip edilmez. Anahtar URL'ye değil Authorization başlığına gider. `baseUrl` yalnızca güvenilir sunucu ayarı olmalıdır: seçtiğiniz sunucu anahtarı alır.

GET yalnızca 429/502/503/504 JSON API yanıtlarında tekrar denenir. Retry-After beklemesi üst sınırı aşarsa hemen hata döner. Transport hatası, bozuk JSON ve POST/PATCH/DELETE yazmaları otomatik tekrarlanmaz. Toplam süre birden fazla deneme ve bekleme içerebilir.

## Metotlar ve izinler

| Kaynak | Metotlar | İzin |
| --- | --- | --- |
| Hesap | account.me | account.read |
| Genel görünüm | overview | uptime.read |
| Monitör okuma | list/get/status/checks/analytics | uptime.read |
| Monitör yazma | create/createMinecraft/update/pause/resume/remove | uptime.write |
| Toplu monitör | bulkCreate/bulkUpdate | uptime.write + Ultimate |
| pulse.pages | list/get · create/update | pulse.read · pulse.write |
| pulse.incidents | list · create/addUpdate | pulse.read · pulse.write |
| pulse.maintenance | list · create/update/addUpdate | pulse.read · pulse.write |
| notifications | list · setRead | notifications.read · notifications.write |
| usage.get | İstek geçmişi | usage.read |
| usage.limits | Anlık kota | Geçerli ücretli anahtar; ek izin gerekmez |
| webhooks | list/deliveries · create/update/remove/rotateSecret | webhooks.read · webhooks.write + Ultimate |

Kimlikler string olmalıdır. Pulse/bildirim/webhook geçmişi listeleri `{items,pagination:{page,limit,total,hasMore}}` döndürür; sorguda `page/limit` kullanılabilir. Kesin şemalar için kullandığınız API kökünde `/docs` ve `/openapi.json` bulunur.

## Gerçek ölçümler

```js
const monitorId = 'YOUR_MONITOR_ID'; // Kendi hesabınızın monitörü
const monitor = await client.monitors.get(monitorId);
const checks = await client.monitors.checks(monitorId, { hours: 24, limit: 100 });
const analytics = await client.monitors.analytics(monitorId, { hours: 24 });
console.log(monitor.status, analytics.samples, analytics.p95, checks.length);
```

Analitik aralıkları 1/6/24/168/720 saat; erişim servis planına bağlıdır. samples, successRate, avg, p50/p95/p99 ve truncated alanları bulunur. p95: dahil edilen ölçümlerin %95'inin yanıt süresi bu değerde veya daha düşüktür.

**Ölçüm yoksa %100 uptime gösterilmez.** Eksik uptime/gecikme/istatistik `null` olabilir. Yeni veya devam ettirilmiş monitör, gerçek kontrol yapılana kadar unknown olabilir. SDK sunucunun ölçümlerini getirir; kendisi kontrol yapmaz veya sahte örnek üretmez.

## Yazma işlemleri

Aşağıdakiler gerçek kaynakları değiştirir. Salt okunur testte otomatik çalıştırmayın; yanıtı kaybolmuş yazmayı durumu incelemeden yeniden göndermeyin.

```js
const monitor = await client.monitors.create({
  name: 'Health endpoint', url: 'https://example.com/health',
  method: 'GET', interval_seconds: 60, timeout_ms: 10_000,
  advanced_checks: {
    acceptedStatusCodes: '200-299', keyword: 'ok', keywordMode: 'contains',
    failureThreshold: 3, recoveryThreshold: 2
  }
}); // uptime.write
await client.monitors.pause(monitor.id);
await client.monitors.resume(monitor.id);
// Silme, yalnızca isteniyorsa: await client.monitors.remove(monitor.id);
```

Gelişmiş ayarlarda HTTP gövdesi, JSON yolu/beklenen değer, HTTP durum aralıkları, SSL uyarısı ve yanıt süresi eşiği vardır. Alanlar, hedefler ve plan yetkileri backend'de doğrulanır.

```js
const page = await client.pulse.pages.create({
  title: 'Servis durumu', slug: 'my-service', theme: 'dark', is_public: false
}); // pulse.write
const incident = await client.pulse.incidents.create(page.id, {
  title: 'Hataları inceliyoruz', impact: 'minor', body: 'Kontrol sürüyor.'
});
await client.pulse.incidents.addUpdate(incident.id, {
  status: 'resolved', message: 'Servis düzeldi.'
});
const maintenance = await client.pulse.maintenance.create(page.id, {
  title: 'Planlı güncelleme',
  scheduled_start: '2027-01-15T01:00:00Z',
  scheduled_end: '2027-01-15T02:00:00Z'
});
```

Olay durumları investigating/identified/monitoring/resolved; bakım durumları scheduled/in_progress/completed. Sunucunun durum geçişi kurallarını izleyin.

## Kota ve kullanım geçmişi

```js
const limits = await client.usage.limits(); // Bu sorgu da kota tüketir
console.log(limits.rate_limit.remaining, limits.rate_limit.reset_at_iso);
console.log(limits.rate_limit.resets_in_seconds);

const response = await client.requestWithMeta('GET', '/monitors', {
  query: { type: 'web', limit: 10, offset: 0 }
});
console.log(response.data, response.status, response.requestId);
console.log(response.rateLimit, response.ipRateLimit, response.retryAfter);

const usage = await client.usage.get({ hours: 24, page: 1, limit: 20 });
console.log(usage.summary, usage.retentionDays); // usage.read
```

Kaynak metotları direkt data döndürür. requestWithMeta ayrıca status/requestId/rateLimit/ipRateLimit/retryAfter döndürür. resetAt Unix saniye; resetAtIso UTC; resetsInSeconds sunucunun hesapladığı geri sayımdır.

Kota **hesaptaki tüm anahtarlar arasında ortaktır**; anahtar başına ayrı veya aylık kredi değildir. IP limiti ayrı değerlendirilir. GET tekrarları da istek tüketir. Geçmiş aralıkları 1/24/168/720/2160 saat; 2160 Ultimate gerektirir. Bu endpoint yalnızca kullanılan anahtarın geçmişini ve mevcut planın izin verdiği aralığı verir.

Geçmiş gizli anahtar veya istek gövdesi saklamaz. Doğrulanmış anahtarın izin/IP/plan/kota hataları kayıt olabilir; yanlış gizli anahtar sizin geçmişinize eklenmez. Kayıtlar sonradan kalıcılaşabilir; geçmiş deploy edildiğinde başlar, anlık kaydın görünmemesi isteğin olmadığını kanıtlamaz.

## Hatalar ve iptal

```js
const controller = new AbortController();
const operation = client.monitors.list({ type: 'web' }, { signal: controller.signal });
// Gerekirse: controller.abort();
await operation;
```

FoventraApiError: code/status/requestId/rateLimit/ipRateLimit/retryAfter. Yerel ayar/kimlik hataları TypeError olabilir.

| Durum | Tipik sonuç |
| --- | --- |
| Geçersiz anahtar | Constructor hatası veya 401 |
| Eksik izin | 403 missing_scope |
| Free/ücretli erişimin bitmesi | 403 plan_api_locked |
| Plan özelliği kapalı | 403 plan_feature_locked |
| Başkasının/olmayan kaynağı | 404 |
| Kota doldu | 429 + yenilenme metadata |
| Ağ/timeout | transport_error, status 0 |
| Kullanıcı iptali | aborted, status 0 |
| Bozuk/eksik JSON | invalid_response |

Bu betada idempotency-key desteği yoktur. Yazma timeout'unda sonucun bilinmediğini kabul edin; yeniden göndermeden mevcut kaynağı kontrol edin.

## Ultimate toplu işlemler

```js
const batch = await client.monitors.bulkCreate([
  { kind: 'web', settings: { name: 'Health', url: 'https://example.com/health' } },
  { kind: 'minecraft', settings: { name: 'Minecraft', host: 'mc.example.com', port: 25565 } }
]);
for (const result of batch.results) console.log(result.index, result.success, result.code);
// bulkUpdate([{ id: 'YOUR_MONITOR_ID', settings: { name: 'Yeni ad' } }])
```

En fazla 50 öğe; her öğe bir kota birimi. Sonuçlar giriş sırasındadır, kısmi başarı mümkündür ve atomic:false döner. Tümünü otomatik tekrar göndermek başarılı öğeleri çoğaltabilir.

## İmzalı webhook

```js
const subscription = await client.webhooks.create({
  name: 'Servis olayları', url: 'https://your-server.example/foventra/events',
  events: ['monitor.down', 'monitor.up']
});
// subscription.secret değerini hemen güvenli secret store'a kaydedin.
// list/update bunu tekrar göstermez; rotateSecret yeni secret üretir.
```

Olaylar: monitor.up/down, pulse.incident.updated, pulse.maintenance.updated.

X-Foventra-Signature başlığını JSON'a dönüştürmeden **ham istek baytlarıyla** doğrulayın:

```js
import { verifyWebhookSignature } from '@foventra/api';
const valid = verifyWebhookSignature(rawBody, signatureHeader, signingSecret);
// Geçersizse reddedin. Geçerliyse şemayı doğrulayın.
// JSON olayının id'siyle kalıcı tekrar engelleme kaydı tutun.
```

Bu sadece doğrulama örneğidir, tam receiver değildir. Sunucu saati doğru olmalı. Varsayılan tolerans 300 saniye; 16 KiB üstü, eski, bozuk veya değiştirilmiş imza reddedilir. Hedef public HTTPS/443 olmalıdır; DNS/IP her denemede doğrulanır, redirect izlenmez.

En fazla 5 teslim denemesi; aynı olay birden fazla gelebilir. **Garantili teslim yoktur**; kaçan olaylar için mevcut durumla uzlaştırma yapın. Teslim kayıtları/olay gövdeleri 7 gün saklanır. Mevcut sürüm Pulse olaylarını API değişikliklerinde üretir, Dashboard değişikliklerinde değil. Kaynak değişikliği ve olay üretimi tek transaction değildir.

## Güvenlik ve destek

Anahtarı frontend bundle, kaynak kontrolü, URL veya ekran görüntüsüne koymayın. Backend proxy kendi kullanıcı oturumunu ve kaynak erişimini doğrulamalıdır; farklı müşterilere tek hesabın verisini dönen proxy güvenli değildir.

Destek için SDK/Node sürümü, hata kodu, HTTP durum kodu, request ID ve gizlileri temizlenmiş minimal örnek paylaşın. Gizli anahtar, signing secret veya hassas yanıt paylaşmayın. [Foventra üzerinden destek](https://www.foventra.com).

## Lisans ve dağıtım

[Foventra SDK Use-Only License](LICENSE), değiştirilmemiş resmi SDK'yı kişisel/ticari uygulamalarda kullanmaya ve entegrasyon örneklerini uyarlamaya izin verir. SDK uygulamasını değiştirmek, değiştirilmiş SDK dağıtmak veya ayrı bir paket olarak yeniden yayımlamak yazılı izin olmadan yasaktır. SDK'nın uygulamaya değiştirilmeden dahil edilmesi lisans şartlarına göre mümkündür. Bu özel kısıtlamalı bir lisanstır; MIT veya açık kaynak lisansı değildir. Tam metni okuyun.

Dağıtım: SDK npm'de; GitHub'da sadece kullanım dokümanı ve entegrasyon örnekleri. npm JavaScript dosyaları okunabilir; GitHub'a kaynak koymamak npm kodunu teknik olarak değiştirilemez yapmaz. Lisans izinleri belirler, kopya koruması sağlamaz.

</details>

## Release notes / Sürüm notları

### 0.1.0-beta.1

- ESM, CommonJS and TypeScript support; no runtime dependencies.
- Uptime/Minecraft read-write management, real measurement analytics and Pulse lifecycle.
- Quota metadata, usage history, Ultimate bulk operations and signed webhooks.
- Fixed TypeScript ESM default-import constructor resolution.
- No automatic write retries or idempotency guarantee. Not a browser/Python SDK.
- Custom use-only license: official SDK use is permitted; SDK implementation modification is restricted.
- npm accepted the beta submission; registry processing is pending. GitHub contains documentation and a usage example only.
