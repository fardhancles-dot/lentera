# Deployment ganda: Vercel + GitHub Pages

Satu repository, satu backend, satu database, dua alamat website.

## Arsitektur

```text
GitHub repository (branch main)
├── GitHub Actions  → build base /lentera/ → GitHub Pages (statis)
└── Integrasi Vercel → build base /        → Vercel (statis)
                                   │
                                   └── keduanya memakai Supabase yang sama
                                       (Auth + Postgres + RLS)
```

**Catatan penting:** proyek ini tidak punya server API sendiri. Frontend memanggil
Supabase langsung memakai anon key, dan otorisasi data ditegakkan oleh RLS di database.
Karena itu:

- Tidak ada backend yang berjalan di GitHub Pages (Pages hanya menyajikan file statis).
- Tidak perlu membuat API terpisah di Vercel; backend bersama adalah project Supabase
  `xvrnmxbrxhtzzavmrlvy`.
- Kedua website otomatis memakai database dan sistem akun yang sama.

## Alamat

| Target | URL |
| --- | --- |
| GitHub Pages | `https://fardhancles-dot.github.io/lentera/` |
| Vercel | `https://lentera-phi.vercel.app` |

## Perbedaan build

| Target | Perintah | Base path | Fallback route |
| --- | --- | --- | --- |
| Vercel | `npm run build` | `/` | `vercel.json` rewrite ke `index.html` |
| GitHub Pages | `npm run build:pages` | `/lentera/` | `dist/404.html` hasil salinan `index.html` |

`npm run build:pages` menjalankan `vite build --base=/lentera/` lalu
`scripts/pages-fallback.mjs` yang menyalin `index.html` menjadi `404.html` dan menulis
`.nojekyll`. Router aplikasi memakai helper di `src/app/basePath.ts` untuk membuang prefix
saat mencocokkan route dan menambahkannya lagi saat menulis URL, sehingga tautan, refresh,
dan redirect email tetap benar di sub-path.

Jika nama repository berubah, ganti `/lentera/` di `package.json` (`build:pages`) dan di
`.github/workflows/deploy-pages.yml`.

## Environment variables

| Variabel | Dipakai | Rahasia? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | build Vercel + GitHub Actions | tidak |
| `VITE_SUPABASE_ANON_KEY` | build Vercel + GitHub Actions | tidak (anon key publik, dilindungi RLS) |
| `VITE_APP_URL` | opsional, override URL redirect auth | tidak |

Di build GitHub Pages, `VITE_APP_URL` harus memuat sub-path (`https://fardhancles-dot.github.io/lentera`)
atau dibiarkan kosong agar dihitung otomatis dari origin + base.

Jangan pernah menaruh service role key atau kunci SMTP di variabel `VITE_*`; semua nilai
`VITE_*` ikut terkirim ke browser.

### Vercel

Tambahkan kedua variabel di **Project Settings → Environment Variables** untuk
Production, Preview, dan Development, lalu redeploy.

### GitHub Actions

Tambahkan sebagai **repository variables** (Settings → Secrets and variables → Actions →
Variables): `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`. Workflow juga menerima
nama yang sama dari Secrets sebagai fallback.

## CI/CD

- **GitHub Pages:** `.github/workflows/deploy-pages.yml` berjalan pada setiap push ke
  `main` (dan bisa dijalankan manual). Workflow membangun ulang dari commit terbaru,
  mengunggah `dist` sebagai artifact, lalu men-deploy lewat `actions/deploy-pages`.
- **Vercel:** hubungkan repository GitHub ke project Vercel. Setiap push ke `main`
  memicu build dan deployment production otomatis.
- Kedua pipeline independen: kegagalan salah satu tidak membatalkan yang lain, dan
  masing-masing punya log sendiri. Tidak ada loop deployment karena workflow Pages hanya
  bereaksi pada push ke `main`, bukan pada hasil deployment.

## Konfigurasi Supabase

Redirect URL yang sudah didaftarkan (Authentication → URL Configuration):

- `https://fardhancles-dot.github.io/lentera/**`
- `https://lentera-phi.vercel.app/**`
- `https://lentera-*.vercel.app/**` (preview deployment)
- `http://localhost:5173/**`
- `http://localhost:4173/**`
- `http://localhost:3000/**`

Site URL diarahkan ke `https://lentera-phi.vercel.app`. Kedua domain tetap dapat memakai
reset password karena aplikasi mengirim `redirect_to` sesuai origin yang sedang dibuka.

## Akun lintas domain

Kedua website memakai project Supabase yang sama, sehingga akun, profil, progres, XP,
koin, dan leaderboard konsisten. Sesi Supabase disimpan di `localStorage` per origin,
jadi pengguna perlu login sekali di masing-masing domain — ini perilaku yang diizinkan
dan tidak memisahkan akun. Logout di satu domain tidak menghapus akun atau data.

Jangan menyalin sesi antar domain lewat query string atau iframe; itu menambah risiko
keamanan tanpa manfaat.

## CORS dan keamanan

Supabase mengizinkan request browser dari origin mana pun pada endpoint Auth/PostgREST,
dan pengaturan itu tidak bisa dibatasi per domain dari dashboard. Origin yang diizinkan
bukan kontrol keamanan di sini: setiap request tetap membawa JWT pengguna, dan RLS
menentukan baris mana yang boleh dibaca/ditulis. Anon key aman dipublikasikan; service
role key tidak boleh pernah masuk ke frontend.

## Status deployment

- Repository dibuat publik agar GitHub Pages tersedia pada paket GitHub saat ini.
- Pages sudah diaktifkan dengan source **GitHub Actions**.
- Repository variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah diisi.
- Workflow berhasil membangun dan men-deploy; situs live di
  `https://fardhancles-dot.github.io/lentera/`.
- Project Vercel `dhancles/lentera` dibuat, environment variables diisi untuk
  Production/Preview/Development, dan production live di
  `https://lentera-phi.vercel.app`. Domain ini juga sudah masuk redirect URL Supabase.

## Langkah manual yang masih diperlukan

**Hubungkan repository GitHub ke project Vercel** agar push ke `main` otomatis
men-deploy Vercel (saat ini deployment Vercel dibuat lewat CLI). Buka dashboard Vercel →
project `lentera` → **Settings → Git → Connect Git Repository**, lalu izinkan akses ke
`fardhancles-dot/lentera`. CLI mencoba `vercel git connect` tetapi ditolak karena integrasi
GitHub belum diberi akses ke repository tersebut.

Setelah terhubung, satu push ke `main` akan memicu dua pipeline: Vercel dan GitHub Pages.

## Verifikasi yang sudah dilakukan

- `npm run typecheck` lulus.
- 10 unit test `tests/basePath.test.ts` lulus.
- `npm run build` (Vercel) dan `npm run build:pages` (GitHub Pages) lulus.
- Simulasi lokal GitHub Pages di `/lentera/`: landing page tampil, 10 aset memakai prefix
  `/lentera/assets/`, klik tautan menghasilkan `/lentera/login`, deep link
  `/lentera/forgot-password` memuat halaman yang benar, dan request reset mengirim
  `redirect_to=http://localhost:4180/lentera/reset-password`.
- Simulasi lokal Vercel di root: aset di `/assets/`, navigasi ke `/login`, deep link
  `/forgot-password`, dan `redirect_to=http://localhost:4181/reset-password` benar.
- **Live Vercel:** aset dimuat dari `/assets/`, deep link `/profile` merespons 200,
  login akun uji berhasil, dan request reset mengirim
  `redirect_to=https://lentera-phi.vercel.app/reset-password`.
- **Lintas situs:** login dengan akun yang sama di Vercel dan GitHub Pages menghasilkan
  data identik — `@qaxvrnmxbrxhtzzavm`, Lv 4, 556 XP, 110 Koin, 5/5 Hearts, Streak 2 hari —
  tanpa error console di kedua situs.
- **Live GitHub Pages:** aset dimuat dari `/lentera/assets/`; login akun uji berhasil dan
  diarahkan ke `/lentera/app`; deep link `/lentera/profile` menampilkan halaman Profil
  dengan sesi yang bertahan; request reset mengirim
  `redirect_to=https://fardhancles-dot.github.io/lentera/reset-password`; tidak ada error
  console. Respons HTTP 404 untuk dokumen deep link adalah perilaku normal GitHub Pages
  karena `404.html` yang menyajikan aplikasi.
