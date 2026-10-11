# Foventra ONE API · @foventra/api

Foventra Uptime, Minecraft izleme, Foventra Pulse, bildirimler ve API kullanımı için sunucu tarafı Node.js SDK'sı.

[Website](https://www.foventra.com) · [English documentation](README.md)

> **Durum: yayımlanmamış beta · 0.1.0-beta.1.** Paket henüz npm'de yayımlanmadı. npm kurulumu ilk beta erişilebilir olana kadar planlanan komuttur. Kullanıma izin veren özel lisans [LICENSE.txt](LICENSE.txt) dosyasındadır.

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

**Yayımlandıktan sonra** planlanan npm komutu:

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

[Foventra SDK Use-Only License](LICENSE.txt), değiştirilmemiş resmi SDK'yı kişisel/ticari uygulamalarda kullanmaya ve entegrasyon örneklerini uyarlamaya izin verir. SDK uygulamasını değiştirmek, değiştirilmiş SDK dağıtmak veya ayrı bir paket olarak yeniden yayımlamak yazılı izin olmadan yasaktır. SDK'nın uygulamaya değiştirilmeden dahil edilmesi lisans şartlarına göre mümkündür. Bu özel kısıtlamalı bir lisanstır; MIT veya açık kaynak lisansı değildir. Tam metni okuyun.

Plan: SDK npm'de; GitHub'da sadece kullanım dokümanı ve entegrasyon örnekleri. npm JavaScript dosyaları okunabilir; GitHub'a kaynak koymamak npm kodunu teknik olarak değiştirilemez yapmaz. Lisans izinleri belirler, kopya koruması sağlamaz.
