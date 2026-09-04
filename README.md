# SkipReceh

Lewati shortlink & safelink receh. Dua jalur bypass, satu repo, deploy ke Cloudflare Pages (gratis).

```
public/
  index.html            → landing + form paste-link
  skipreceh.user.js     → userscript (jalur kuat, client-side)
functions/api/bypass.js → API server-side (jalur ringan)
wrangler.toml
```

## Kenapa dua jalur

| | Userscript | API server |
|---|---|---|
| Cara pakai | Install sekali, otomatis bypass | Paste link tiap kali |
| Target berat (challenge/JS) | ✅ lolos (browser asli user) | ❌ sering gagal |
| User awam | Perlu install Tampermonkey | Langsung pakai |

## Jalan lokal

```bash
npm install
npm run dev        # http://localhost:8788
```

## Deploy

Cara cepat (CLI):

```bash
npx wrangler login
npm run deploy     # → https://skipreceh.pages.dev
```

Atau via dashboard: push repo ke GitHub → Cloudflare → Workers & Pages → Create → Pages → connect repo (build: none, output: `public`; folder `functions/` terdeteksi otomatis).

## Nambah rule

Buka `public/skipreceh.user.js`, tambah satu objek ke array `RULES`:

```js
{
  test: /domain-safelink\.com/i,          // cocokkan host/path
  run (doc) {                              // doc = document halaman
    const m = doc.querySelector('a.final').href;
    return m || null;                      // null = menyerah, biarkan
  },
},
```

Untuk halaman yang butuh klik tombol dulu, jalankan aksinya di `run()`:

```js
run (doc) {
  doc.querySelector('button#lanjut')?.click();
  return null;                             // redirect halaman itu sendiri
},
```

Rule server-side ada di `functions/api/bypass.js` (extractor: `ysmm`, meta refresh, param base64).

## Sebarkan

1. **Deploy:** `npx wrangler login && npm run deploy` → live di `https://skipreceh.pages.dev`.
2. **Publish ke [GreasyFork](https://greasyfork.org/en/script/new)** (login dulu) — kanal distribusi userscript terbesar; paste isi `skipreceh.user.js`. Salinan GreasyFork dipakai sendiri untuk update user, jadi **bump `@version` tiap ada perubahan** dan tetap upload versi terbaru ke Pages supaya dua-duanya sinkron.
3. **Sebar manual:** link + cara pakai 1 kalimat ke grup Telegram/Discord/Reddit tempat safelink receh sering muncul.

Ingin lihat seberapa ramai? Aktifkan **Cloudflare Web Analytics** (gratis, tanpa cookie) di dashboard Pages → tambah satu tag `<script>` ke `index.html`.

## Keterbatasan yang disengaja (ponytail)

- Belum ada KV cache & rate limit di API — tambah kalau sudah ramai.
- Target dengan enkripsi per-request (linkvertise-level) tidak didukung.
- Etika: untuk lewati iklan mengganggu, bukan paywall/konten berbayar.

## Referensi

- [adsbypasser](https://adsbypasser.github.io/) — arsitektur rule per-domain
- [FastForward](https://github.com/FastForwardTeam/FastForward) — database pattern ratusan shortlink
