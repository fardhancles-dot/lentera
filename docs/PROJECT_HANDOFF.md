# Project Handoff — Stage 8

Diperbarui: 11 November 2026.

## Status ringkas

Stage 1–7 tetap utuh. Stage 8 menambahkan **Developer Dashboard staff-only**, **Reward
Center satu akun**, **broadcast notifikasi**, dan **audit log append-only**. Seluruh kode
lolos typecheck, **78 unit test**, build produksi, **262 smoke check SQL**, **83 verifikasi
API Supabase**, serta **14 test browser lulus** tanpa skip. Migration
`20261111110000_developer_dashboard.sql` sudah diterapkan ke project Supabase nyata.

## Yang selesai

- **Developer Dashboard** di `/developer`, hanya untuk role `developer`/`admin`:
  - overview jumlah pemain/onboarded/baru 7 hari, staff, lesson/latihan selesai, XP
    diberikan, Koin beredar, streak aktif, dan statistik konten;
  - pencarian maksimal 25 pemain berdasarkan email, username, atau nama tampilan;
  - form Reward Center untuk satu akun: 0–10.000 Koin dan/atau 0–100.000 XP, alasan wajib
    3–160 karakter;
  - form broadcast notifikasi `info` ke maksimal 500 pemain onboarded dengan tautan
    internal;
  - daftar audit log 30 entri terbaru dengan aktor, role, target, detail, dan waktu.
- **Audit log append-only** (`audit_logs`): aktor diambil dari `auth.uid()`, role dari
  `user_roles`; hanya SELECT staff yang di-grant. INSERT/UPDATE/DELETE tidak diberikan ke
  `anon`/`authenticated`. Penulisan hanya lewat helper internal `log_audit` yang dipanggil
  RPC `security definer`.
- **Reward atomik**: `grant_reward` menulis wallet, transaksi Koin, ledger XP, dan audit
  dalam satu transaksi. Source ledger/transaksi adalah `developer_grant`.
- **Otorisasi server**: semua RPC memanggil `public.is_staff()`; UI staff-only adalah
  lapisan kedua. Router mengalihkan pemain biasa dari `/developer` ke `/app`.
- **Integrasi**: route `/developer`, nav sidebar staff-only, ikon topbar staff-only, dan
  `src/styles/developer.css`. Bottom nav tetap enam item.
- **Cakupan yang sengaja belum dibangun**: CRUD konten (mapel/lesson/soal) dan editor
  Bahasa Sambas. Iterasi ini fokus dashboard, audit, dan reward.

## File utama

- `supabase/migrations/20261111110000_developer_dashboard.sql`
- `src/types/developer.ts`, `src/types/database.ts`
- `src/repositories/developer.repository.ts`, `src/services/developer.service.ts`
- `src/pages/developer.page.ts`, `src/styles/developer.css`
- `src/app/router.ts`, `src/layouts/appLayout.ts`, `src/main.ts`
- `src/pages/wallet.page.ts` (label transaksi `developer_grant`)
- `tests/e2e/developer.spec.ts`
- `scripts/test-sql.mjs`, `scripts/verify-supabase.mjs`

## Verifikasi terakhir (11 November 2026)

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus, 0 error |
| `npm test` | 78 test lulus (11 file) |
| `npm run build` | Lulus (peringatan ukuran chunk Phaser tetap ada, bukan error) |
| `npm run test:e2e` | **14 lulus**; dashboard 15,4 dtk |
| `npm run test:sql` | **262 check lulus** di PGlite |
| `npm run verify:supabase` | **83 check lulus** di project `xvrnmxbrxhtzzavmrlvy` |
| Migration nyata | `20261111110000_developer_dashboard.sql` diterapkan lewat Management API; RPC Stage 8 terbaca akun QA staff |

Alur E2E dashboard membuktikan: staff membuka `/developer` dan melihat enam metrik; mencari
akun pemain sementara lewat email; memilih akun; mengirim 3 Koin + 5 XP dengan alasan;
toast sukses; audit log memuat aksi `reward_grant`; wallet pemain menampilkan saldo dan
transaksi `Hadiah developer`; pemain biasa dialihkan dari `/developer` ke `/app` dan tidak
melihat tautan developer. Akun sementara dihapus dan baris audit uji dibersihkan lewat
service role setelah test.

## Catatan pengujian

- **Uji dengan akun pemilik: SKIP (disepakati 11 November 2026).** Password akun pemilik
  tidak diminta lewat chat. E2E memakai akun staff QA di `.env` dan akun pemain sementara
  lewat Admin API yang dihapus di `finally`.
- **Broadcast valid tidak dikirim dari E2E** agar tidak membuat notifikasi untuk seluruh
  pemain asli. Yang diuji: keberadaan form dan penolakan tautan eksternal lewat API;
  pengiriman nyata diverifikasi di PGlite.
- Audit log nyata dibaca staff; akses anon dan pemain biasa ditolak di SQL/API test.
- Uji browser tidak menjalankan grant kedua atau broadcast massal; race/idempotensi
  klaim lain tetap diuji di PGlite.
- Panduan UI belum ditinjau pembaca layar; overflow dashboard belum diuji pada viewport
  390px.
- Build masih menghasilkan peringatan chunk Phaser > 500 kB; bukan error.

## Sisa pekerjaan

1. **Uji dengan akun pemilik** — isi kredensial di `.env` langsung, jangan lewat chat.
2. **Content management** — CRUD mapel/lesson/soal dan editor Bahasa Sambas.
3. **Broadcast lanjutan** — preferensi notifikasi, paginasi target, dan konfirmasi
   dua langkah untuk audiens besar.
4. **Deployment produksi** (Vercel) dan peninjauan CSP/rate limit.
5. **Aksesibilitas dan viewport** dashboard di 390px serta pembaca layar.

## Langkah berikutnya

1. Tinjau visual `/developer` di desktop 1280px dan ponsel 390px.
2. Putuskan apakah CRUD konten masuk Stage 9.
3. Siapkan antrean broadcast/Edge Function bila audiens melebihi 500 atau butuh
   penjadwalan.
