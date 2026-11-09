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
- **Confirm email**: disarankan aktif agar alamat email terverifikasi. Jika aktif,
  pengguna baru menerima email verifikasi sebelum bisa login.
- **Google**: biarkan nonaktif sampai Client ID/Secret tersedia. Aplikasi belum
  menampilkan tombol Google, jadi tidak ada tombol mati.

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

Buka **SQL Editor** di Supabase, salin isi
`supabase/migrations/20261108090000_identity.sql`, lalu **Run**.

Yang dibuat:

- enum `app_role`
- tabel `profiles`, `user_roles`, `user_settings`
- trigger profil otomatis untuk setiap user baru
- fungsi onboarding, role helper, bootstrap developer
- RLS + grant kolom

Verifikasi di **Table Editor** bahwa ketiga tabel muncul dan **RLS enabled**.

Alternatif CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## 8. Uji registrasi

```bash
npm run dev
```

1. Buka `http://localhost:5173/register`.
2. Isi nama, email, password (minimal 8 karakter, ada huruf dan angka).
3. Kirim. Jika konfirmasi email aktif, buka tautan di email lalu login.
4. Setelah login pertama, onboarding muncul: avatar, username, target harian, zona waktu.
5. Selesai → beranda. Profil dan pengaturan tersimpan di database.

Jika registrasi gagal dengan pesan profil belum siap, migration belum dijalankan.

## 9. Jadikan akunmu Developer

Setelah akun terverifikasi:

```sql
select public.bootstrap_developer('email-kamu@contoh.com');
```

Logout dan login lagi. Role akan termuat dari `user_roles`. Dashboard developer belum
dibangun; role disiapkan untuk tahap 8.

Untuk menambah developer lain setelahnya:

```sql
select public.promote_developer('email-lain@contoh.com');
```

Kedua fungsi sengaja tidak dapat dipanggil dari browser.

## 10. Jalankan test

```bash
npm test
npm run build
```

## 11. Deploy ke Vercel

1. Push repository ke GitHub.
2. Vercel → **Add New → Project** → import repository.
3. Framework preset: **Vite**.
4. Build command: `npm run build`. Output directory: `dist`.
5. Tambahkan environment variables yang sama seperti `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - opsional `VITE_APP_URL` = URL produksi
6. Deploy.
7. Tambahkan domain Vercel ke **Redirect URLs** Supabase, lalu set **Site URL** ke domain
   produksi.
8. Uji register, verifikasi email, reset password di domain produksi.

`vercel.json` sudah berisi rewrite SPA agar refresh di `/profile` tidak 404.

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| Halaman `/setup` muncul | env belum terisi | Isi `.env`, restart `npm run dev`. |
| “Profil belum dapat dimuat” setelah login | migration belum dijalankan / trigger gagal | Jalankan migration; cek log Postgres. |
| Email verifikasi tidak masuk | SMTP bawaan Supabase dibatasi | Cek spam; atur SMTP kustom di Auth → SMTP jika perlu. |
| Tautan reset “tidak valid” | redirect URL tidak terdaftar / tautan kedaluwarsa | Perbaiki Redirect URLs, minta tautan baru. |
| Email sudah terdaftar tetapi tidak bisa login | konfirmasi email belum diklik | Kirim ulang verifikasi dari halaman registrasi. |
| `npm run build` gagal di Node lama | Phaser 4 butuh Node 22+ | Upgrade Node. |
| Role developer tidak berubah | sesi lama | Logout lalu login. |

## Biaya dan batasan

- Paket gratis cukup untuk pengembangan. Email bawaan Supabase memiliki batas kirim per
  jam; untuk produksi gunakan SMTP sendiri (Resend, Postmark, dsb.) setelah tersedia.
- Push notification, pembayaran, dan AI belum dikonfigurasi. Jangan mengklaim aktif
  sebelum kredensial dan provider benar-benar terpasang.
