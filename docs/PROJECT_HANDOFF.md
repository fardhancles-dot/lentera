# Project Handoff — Stage 7

Diperbarui: 11 November 2026.

## Status ringkas

Stage 1–6 tetap utuh. Stage 7 (sosial, liga, leaderboard, event mingguan, notifikasi,
privasi profil) diimplementasikan dan lolos typecheck, **78 unit test**, build produksi,
**245 smoke check SQL**, **76 verifikasi API Supabase**, serta **13 test browser lulus**
tanpa skip. Migration `20261111100000_social_league.sql` sudah diterapkan ke project
Supabase nyata.

## Yang selesai

- **Pertemanan**: pencarian pemain (minimal 2 karakter), kirim/terima/tolak/batalkan/hapus
  teman, daftar teman dengan XP mingguan/level/streak bersama, dan activity feed dari
  XP/pencapaian teman.
- **Notifikasi**: permintaan teman, penerimaan pertemanan, dan hasil liga; halaman
  `/notifications`, tandai satu/semua dibaca, jumlah belum dibaca.
- **Liga mingguan**: 10 tier (Benih → Lentera), grup maksimal 30 pemain, finalisasi minggu
  lalu saat dibaca, promosi 5 teratas, degradasi 5 terbawah bila grup ≥ 10 pemain, hadiah
  `10 + tier × 5` Koin, riwayat 8 minggu, dan klaim idempoten.
- **Leaderboard**: tab Liga/Teman/Global, 50 peringkat XP mingguan, posisi pemain, dan
  pengecualian profil `private` dari papan global.
- **Event mingguan**: Festival Lentera (100 XP → 25 Koin), progres dari XP lesson/latihan,
  klaim idempoten.
- **Privasi profil**: `private`/`friends`/`public` di `/settings`; `/players/:username`
  hanya membuka statistik sesuai relasi + pengaturan. Email tidak pernah dibagikan.
- **Integrasi UI**: route `/friends`, `/leaderboard`, `/notifications`, `/players/:username`;
  item nav Teman/Liga/Kabar; kartu Komunitas di beranda; CSS `social.css`.
- **Keamanan**: RLS + grant terbatas untuk semua tabel baru, penulisan hanya lewat RPC,
  `auth.uid()` sebagai otoritas, dan perbaikan XSS toast (`textContent`) yang diuji E2E.

## File utama

- `supabase/migrations/20261111100000_social_league.sql`
- `src/types/social.ts`, `src/types/database.ts`
- `src/repositories/social.repository.ts`, `src/services/social.service.ts`
- `src/pages/leaderboard.page.ts`, `friends.page.ts`, `notifications.page.ts`, `player.page.ts`
- `src/pages/home.page.ts`, `settings.page.ts`, `src/layouts/appLayout.ts`, `src/app/router.ts`
- `src/styles/social.css`
- `tests/e2e/social.spec.ts`, `tests/e2e/friends-quest.spec.ts`
- `scripts/verify-supabase.mjs`, `scripts/test-sql.mjs`

## Verifikasi terakhir (11 November 2026)

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus, 0 error |
| `npm test` | 78 test lulus (11 file) |
| `npm run build` | Lulus (peringatan ukuran chunk Phaser tetap ada, bukan error) |
| `npm run test:e2e` | **13 lulus**, termasuk sosial/liga/privasi dua akun (38,4 dtk) dan Friends Quest (30,9 dtk) |
| `npm run test:sql` | **245 check lulus** di PGlite |
| `npm run verify:supabase` | **76 check lulus** di project `xvrnmxbrxhtzzavmrlvy` |
| Migration nyata | `20261111100000_social_league.sql` diterapkan lewat Management API; RPC sosial/liga/event/notifikasi terbaca akun QA |

Alur E2E sosial membuktikan: liga + event tampil, tab Global memuat baris pemain, pencarian
dan permintaan teman, notifikasi masuk, penerimaan, notifikasi penerimaan + tandai semua
dibaca, statistik teman, `private` menyembunyikan statistik, `friends` membukanya, hapus
teman menutupnya, dan `public` membuka untuk non-teman.

## Catatan pengujian

- **Uji dengan akun pemilik: SKIP (disepakati 11 November 2026).** Password akun pemilik
  tidak diminta lewat chat; alur dua akun diverifikasi memakai akun sementara lewat Admin
  API yang dihapus di `finally`. Isi `E2E_FRIEND_*` bila uji akun nyata ingin dilanjutkan.
- Full E2E berjalan dengan akun QA di `.env`; onboarding akun QA menambah data aditif pada
  akun uji, bukan data pengguna lain.
- Liga dengan 30 pemain, promosi/degradasi penuh, dan event kedaluwarsa diuji di PGlite;
  browser memakai grup baru berisi 1 anggota.
- Audio tetap hanya diuji sebagai penjadwalan osilator, belum didengar manusia.
- Pembaca layar sungguhan dan audit performa belum dilakukan.

## Sisa pekerjaan

1. **Uji dengan akun pemilik** — isi `E2E_FRIEND_EMAIL`, `E2E_FRIEND_PASSWORD`,
   `E2E_FRIEND_EMAIL_2`, `E2E_FRIEND_PASSWORD_2` di `.env` (jangan lewat chat).
2. **Uji liga dengan grup penuh** — butuh 10–30 akun atau seed terkontrol untuk melihat
   promosi/degradasi di browser.
3. **Paginasi notifikasi/aktivitas** — saat ini 30 notifikasi dan 20 aktivitas terakhir.
4. **Deployment produksi** (Vercel) dan **Stage 8** (Developer Dashboard, audit log,
   Reward Center).
5. **Audio dengan telinga** dan **pembaca layar** untuk halaman sosial.

## Langkah berikutnya

1. Isi kredensial dua akun pemilik bila ingin E2E memakai akun nyata.
2. Tinjau tampilan `/friends`, `/leaderboard`, `/notifications`, `/players/:username` di
   ponsel 390px dan desktop 1280px (sudah lolos overflow, belum ditinjau visual).
3. Lanjut Stage 8 setelah keputusan cakupan Developer Dashboard.
