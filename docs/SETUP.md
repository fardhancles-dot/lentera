# Setup

Panduan ini ditulis untuk pemilik proyek yang belum familiar dengan Supabase. Ikuti
berurutan.

## 1. Kebutuhan

- Node.js 22 atau lebih baru (`node -v`).
- npm (`npm -v`).
- Akun Supabase gratis.
- Akun Vercel (untuk deploy).

## 2. Install dependency

```bash
npm install
```

## 3. Buat project Supabase

1. Buka <https://supabase.com/dashboard> → **New project**.
2. Nama bebas, misalnya `lentera`.
3. **Region:** pilih **Southeast Asia (Singapore)** bila tersedia — latensi paling baik
   untuk Indonesia. Jika tidak tersedia, pilih region terdekat.
4. Simpan database password di tempat aman.
5. Tunggu provisioning selesai.

> Paket gratis punya kuota database, bandwidth, storage, dan monthly active users. Periksa
> halaman **Settings → Billing** sebelum menganggap kapasitas tak terbatas.

## 4. Atur Auth

Di dashboard Supabase → **Authentication → Providers**:

- **Email**: aktifkan.
- **Confirm email**: **nonaktifkan**. Pendaftaran tidak boleh meminta verifikasi email;
  akun baru langsung mendapat sesi dan bisa bermain. Jika opsi ini aktif, halaman registrasi
  menampilkan peringatan bahwa project masih mewajibkan konfirmasi.
- **Minimum password length**: `6`. **Password requirements**: kosongkan (jangan wajibkan
  huruf besar, angka, atau simbol). Aturan ini sudah dipasang di project dan berlaku sama
  dengan validasi frontend.
- **Email OTP expiration**: `300` detik (5 menit). **Email OTP length**: `6`.
- **Google**: biarkan nonaktif sampai Client ID/Secret tersedia. Aplikasi belum
  menampilkan tombol Google, jadi tidak ada tombol mati.

### Template email reset password (wajib untuk OTP)

Halaman lupa password memakai OTP 6 angka resmi Supabase (`verifyOtp` tipe `recovery`).
Agar kode ikut terkirim, template **Reset Password** harus memuat `{{ .Token }}`, misalnya:

```html
<p>Kode verifikasi Anda: {{ .Token }}</p>
<p><a href="{{ .ConfirmationURL }}">Atur ulang password</a></p>
```

Pada paket gratis dengan email bawaan Supabase, perubahan template ditolak
(`Email template modification is not available for free tier projects using the default
email provider`). Konfigurasi yang diperlukan:

1. **Authentication → Emails → SMTP Settings**: pasang SMTP kustom (Resend, Postmark,
   Brevo, dsb.), lalu verifikasi domain pengirim.
2. Buka **Authentication → Emails → Reset Password**, tambahkan baris `{{ .Token }}`, simpan.
3. Kirim satu email uji dan pastikan kode 6 angka terlihat. Selama langkah ini belum
   selesai, email reset bawaan hanya berisi tautan; halaman reset tetap bisa dipakai lewat
   tautan tersebut, tetapi input kode belum bisa diisi.

**Status project pengembangan ini:** SMTP produksi memakai **Brevo** dan sudah diuji
dengan email sungguhan ke Gmail: kode 6 angka diterima, password baru bisa dipakai login,
dan kode yang sama ditolak saat dipakai ulang. Konfigurasi yang dipakai:

- Host `smtp-relay.brevo.com`, port `587`.
- **Login** disalin dari **Settings → SMTP & API → SMTP → Login**, formatnya
  `...@smtp-brevo.com` — **bukan** email akun Brevo.
- **Password** adalah SMTP key (`xsmtpsib-...`), bukan API key (`xkeysib-...`).
- Pengirim harus sudah diverifikasi di **Senders**.
- **Settings → Security → Authorized IPs**: pembatasan IP untuk **SMTP keys** harus
  nonaktif. Server Supabase memakai IP yang berubah, dan bila pembatasan aktif pengiriman
  gagal dengan `525 Unauthorized IP address`.
- Batas kirim email auth dinaikkan ke 30/jam.

Kunci SMTP hanya disimpan di konfigurasi Supabase — jangan commit ke repo. Saat SMTP
diganti, template reset dapat kembali ke default sehingga `{{ .Token }}` perlu
ditambahkan lagi.

Di **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:5173`
- **Redirect URLs** (tambahkan semuanya):
  - `http://localhost:5173/**`
  - `https://domain-produksi-kamu.vercel.app/**`
  - `https://domain-kustom-kamu/**` (jika ada)

Tanpa redirect URL yang benar, tautan verifikasi/reset akan ditolak.

## 5. Ambil kredensial

**Project Settings → API**:

- `Project URL` → `VITE_SUPABASE_URL`
- `anon` / `publishable` key → `VITE_SUPABASE_ANON_KEY`

Jangan pernah memakai `service_role` di frontend. Kunci itu melewati RLS dan hanya boleh
hidup di server/Edge Function.

## 6. Buat file `.env`

```bash
cp .env.example .env
```

Isi:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Opsional:

```env
VITE_GAME_NAME=Lentera
VITE_GAME_TAGLINE=Petualangan belajar yang seru
VITE_GAME_VERSION=0.1.0
VITE_SUPPORT_URL=
VITE_APP_URL=http://localhost:5173
```

`VITE_APP_URL` dipakai untuk redirect email. Jika kosong, aplikasi memakai origin browser.

Restart dev server setiap kali `.env` berubah.

## 7. Jalankan migration

### Cara otomatis (satu perintah)

Jika Anda punya akun Supabase, seluruh langkah berikut bisa dijalankan otomatis: buat
project, tunggu aktif, dorong 10 migration, ambil API key, buat akun QA terverifikasi,
jadikan developer, tulis `.env`, lalu jalankan verifikasi lesson, Practice Hub, dan
progression.

Prasyarat:

- Personal Access Token dari **Dashboard Supabase → Account → Access Tokens**, dibuat
  dengan **Create legacy token** (akses penuh). Token scoped yang hanya diberi akses ke
  project yang sudah ada tidak dapat membuat organization/project baru.

Jika memakai token scoped, pilih resource **Organization**, bukan **Project**. Project
belum ada, jadi pilihan Project akan kosong; token organization yang dapat membuat project
baru. Beri akses penuh pada organization tersebut (minimal: projects write, database
write, API keys read). Jika daftar organization kosong, kembali dan pakai
**Create legacy token**.
- Kuota project paket gratis masih tersedia.

Halaman Access Tokens bersifat **akun**, bukan project. Project tidak perlu dibuat dulu —
script yang membuatnya. Jika akun belum punya organization, script membuat satu otomatis
(nama default `Lentera`, bisa diganti lewat `SUPABASE_ORG_NAME`).

Tambahkan ke `.env` (file ini di-ignore Git):

```env
SUPABASE_ACCESS_TOKEN=sbp_...
# opsional, otomatis bila akun hanya punya satu organisasi
SUPABASE_ORG_ID=
SUPABASE_REGION=ap-southeast-1
SUPABASE_PROJECT_NAME=lentera
# opsional; dipakai hanya bila akun belum punya organization
SUPABASE_ORG_NAME=Lentera
# opsional; bila kosong, password database dibuat otomatis
SUPABASE_DB_PASSWORD=
```

Lalu:

```bash
npm run setup:supabase -- --dry-run   # lihat rencana tanpa mengubah apa pun
npm run setup:supabase                # jalankan sungguhan
```

Perintah ini membuat project **nyata** (paket gratis, region default Singapura). Gunakan
`--skip-verify` bila hanya ingin menyiapkan project. Untuk memakai project yang sudah ada,
isi `SUPABASE_PROJECT_REF` dan `SUPABASE_DB_PASSWORD`, lalu jalankan perintah yang sama.
Token dan password tidak ditampilkan di output; `.env` ditulis dengan permission terbatas.

Tanpa token, otomasi tidak dapat membuat project karena pembuatan akun/project memerlukan
identitas pemilik akun.

### Cara manual

Buka **SQL Editor** di Supabase, lalu jalankan file berikut **berurutan**. Jangan melewati
`question_pairs`, karena seed matching membutuhkannya.

1. `20261108090000_identity.sql`
2. `20261108100000_curriculum.sql`
3. `20261108105000_curriculum_overview.sql`
4. `20261108107000_question_pairs.sql`
5. `20261108109000_question_scenes.sql`
6. `20261108110000_curriculum_seed.sql`
7. `20261108120000_lesson_engine.sql`
8. `20261109100000_practice_engine.sql`
9. `20261110100000_friends_quest.sql`
10. `20261110120000_progression_economy.sql`

Migration identity membuat enum `app_role`, tabel `profiles`, `user_roles`,
`user_settings`, trigger profil otomatis, fungsi onboarding/role/bootstrap developer, serta
RLS + grant kolom. Migration berikutnya membuat kurikulum, view katalog, pasangan matching,
seed konten, lesson engine, practice engine, Friends Quest, lalu Hearts/Streak/level/wallet.

Verifikasi di **Table Editor** bahwa tabel utama muncul dan **RLS enabled**, lalu cek:

```sql
select count(*) from public.lessons;   -- 57
select count(*) from public.questions; -- 231
select count(*) from public.practice_sessions; -- 0 (tabel siap)
select count(*) from public.friend_quests; -- 0 (tabel siap)
select count(*) from public.user_roles where role = 'developer'; -- 1 setelah setup otomatis
```

Alternatif CLI (mendorong seluruh 10 migration tanpa membuka SQL Editor):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --include-all --yes
```

Untuk mesin CI tanpa login interaktif, isi `SUPABASE_ACCESS_TOKEN` lalu:

```bash
npx supabase db push --remote <project-ref> --password <db-password> --include-all --yes
```

Jangan menaruh token atau password database di frontend; `VITE_*` hanya untuk URL dan
anon key publik. Periksa dulu dengan `npx supabase db push --dry-run --include-all`.

## 8. Uji registrasi

```bash
npm run dev
```

1. Buka `http://localhost:5173/register`.
2. Isi nama, email, password minimal 6 karakter (tidak wajib huruf besar, angka, atau
   simbol), lalu ulangi password.
3. Kirim. Akun langsung aktif tanpa verifikasi email dan kamu diarahkan ke onboarding.
4. Onboarding muncul: avatar, username, target harian, zona waktu.
5. Selesai → beranda. Profil dan pengaturan tersimpan di database.
6. Uji lupa password: `/forgot-password` → email → kode 6 angka (setelah template email
   dikonfigurasi seperti bagian 4) → password baru minimal 6 karakter → login ulang.

Jika registrasi gagal dengan pesan profil belum siap, migration belum dijalankan.

## 9. Jadikan akunmu Developer

Setelah akun terverifikasi:

```sql
select public.bootstrap_developer('email-kamu@contoh.com');
```

Logout dan login lagi. Role akan termuat dari `user_roles`. Setelah role aktif, buka
`/developer` untuk Developer Dashboard (overview, Reward Center, broadcast, dan audit log).
Pemain biasa tidak melihat menu atau ikon developer dan dialihkan ke `/app` bila membuka
rute itu.

Untuk menambah developer lain setelahnya:

```sql
select public.promote_developer('email-lain@contoh.com');
```

Kedua fungsi sengaja tidak dapat dipanggil dari browser.

## 10. Jalankan test

```bash
npm test
npm run build
npm run test:sql
```

Untuk verifikasi ke project Supabase nyata, tambahkan akun uji developer ke `.env`:

```env
E2E_EMAIL=akun-developer@contoh.com
E2E_PASSWORD=password-akun-uji
```

Lalu jalankan:

```bash
npm run verify:supabase
```

Skrip ini login sebagai akun uji, memverifikasi lesson 20 soal (termasuk scene listening,
speaking, conversation, story dan kebocoran kunci), lalu memulai Practice Hub mode match
madness, menjawab semua soal, menyelesaikan sesi, dan memastikan penyelesaian ulang tidak
menambah XP. Skrip juga membuat Friends Quest, menjalankan beberapa sesi latihan sampai
target tercapai, memastikan kontribusi dihitung server, mengklaim hadiah, dan memastikan
klaim kedua tidak menambah hadiah. Tanpa `.env` skrip berhenti dengan pesan konfigurasi,
bukan lulus palsu.

Perintah ini menguji login, payload soal, grading, penyelesaian lesson, Friends Quest, dan
penolakan akses `question_pairs` tanpa sesi. Tampilan browser tetap perlu diuji manual
karena skrip ini memanggil API, bukan mengklik UI.

## 11. Deploy ke Vercel dan GitHub Pages

Proyek ini bisa berjalan di dua alamat sekaligus dengan satu backend Supabase. Panduan
lengkap, arsitektur, dan daftar environment variables ada di
**[DEPLOYMENT.md](DEPLOYMENT.md)**.

### Vercel

1. Push repository ke GitHub.
2. Vercel → **Add New → Project** → import repository.
3. Framework preset: **Vite**.
4. Build command: `npm run build`. Output directory: `dist`.
5. Tambahkan environment variables yang sama seperti `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - opsional `VITE_APP_URL` = URL produksi
6. Deploy.
7. Tambahkan domain Vercel ke **Redirect URLs** Supabase.
8. Uji register (langsung masuk), lupa password dengan OTP, dan login ulang di domain
   produksi.

`vercel.json` sudah berisi rewrite SPA agar refresh di `/profile` tidak 404.

### GitHub Pages

1. Settings → Pages → Source: **GitHub Actions** (repository privat butuh GitHub Pro).
2. Tambahkan repository variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
3. Push ke `main`; workflow `.github/workflows/deploy-pages.yml` membangun dengan base
   `/lentera/`, menyalin `index.html` ke `404.html` untuk deep link, lalu men-deploy.
4. Pastikan `https://fardhancles-dot.github.io/lentera/**` ada di Redirect URLs Supabase.

Jangan memakai `npm run build` biasa untuk GitHub Pages: build itu memakai base `/` dan
aset akan 404 di sub-path.

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| Halaman `/setup` muncul | env belum terisi | Isi `.env`, restart `npm run dev`. |
| “Profil belum dapat dimuat” setelah login | migration belum dijalankan / trigger gagal | Jalankan migration; cek log Postgres. |
| Email reset tidak berisi kode 6 angka | Template memakai email bawaan paket gratis | Pasang SMTP kustom, lalu tambahkan `{{ .Token }}` ke template Reset Password. |
| Email reset gagal, log `525 Unauthorized IP address` | Pembatasan Authorized IPs aktif untuk SMTP | **Settings → Security → Authorized IPs → Deactivate for SMTP keys**. |
| Email reset gagal, log `535 Authentication failed` | Login memakai email akun atau key yang salah | Salin **Login** `...@smtp-brevo.com` dan **SMTP key** (bukan API key). |
| Kode reset “salah atau kedaluwarsa” | kode salah, sudah dipakai, atau lewat 5 menit | Minta kode baru; satu kode hanya berlaku sekali. |
| Tautan reset “tidak valid” | redirect URL tidak terdaftar / tautan kedaluwarsa | Perbaiki Redirect URLs, minta kode baru. |
| Registrasi meminta konfirmasi email | `Confirm email` masih aktif di dashboard | Matikan **Authentication → Providers → Email → Confirm email**. |
| `npm run build` gagal di Node lama | Phaser 4 butuh Node 22+ | Upgrade Node. |
| Role developer tidak berubah | sesi lama | Logout lalu login. |

## Biaya dan batasan

- Paket gratis cukup untuk pengembangan. Email auth memakai SMTP Brevo dengan batas
  kirim 30/jam; naikkan bila pemakaian nyata menuntut, dan pantau kuota harian Brevo.
- Push notification, pembayaran, dan AI belum dikonfigurasi. Jangan mengklaim aktif
  sebelum kredensial dan provider benar-benar terpasang.
