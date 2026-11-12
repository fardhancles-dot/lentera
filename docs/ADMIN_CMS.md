# Admin CMS Lentera

Dokumen ini mencatat implementasi Admin Dashboard, batas keamanan, hasil pengujian,
dan langkah penerapan. Sumber kebenaran tetap skema database dan kode aktual.

## Status

- **Kode frontend selesai** untuk modul yang tercantum di bawah.
- **Migration sudah diuji di PGlite dan diterapkan ke project Supabase remote**
  pada 13 November 2026 (5 migration admin, termasuk maintenance mode).
- `/developer` tetap tersedia sebagai dashboard lama. Navigasi pemain sekarang
  mengarah ke `/admin`.
- **Sisi pemain sudah membaca konten CMS**: brand, logo, favicon, warna utama,
  hero landing, footer, halaman informasi `/p/:slug`, dan banner pengumuman aktif
  memakai RPC publik `get_public_site_content`, `get_public_page`, dan
  `get_active_announcements`. Tidak ada lagi pengaturan CMS yang hanya tersimpan
  tanpa dipakai pemain.

## Rute

| Rute | Akses | Keterangan |
| --- | --- | --- |
| `/admin` | staff | Ringkasan |
| `/admin/:section` | staff | `curriculum`, `map`, `questions`, `media`, `gamification`, `website`, `users`, `social`, `analytics`, `system` |
| `/developer` | staff | Dashboard lama dipertahankan |
| `/p/:slug` | publik | Halaman informasi terbit dari CMS, blok terstruktur |

Route guard hanya lapisan UX. Setiap RPC memeriksa `auth.uid()`, role staff, dan
permission granular di server.

## Modul yang berfungsi (UI + RPC + otorisasi + validasi + audit)

1. **Ringkasan** — `admin_get_overview`, `admin_get_analytics`, `admin_get_content_health`.
2. **Kurikulum** — baca pohon lengkap dan simpan mapel, kursus, level, unit, lesson,
   node. Draft/publish, arsip melalui status/nonaktif, audit per perubahan.
3. **Bank soal** — daftar/filter/pagination, editor 12 tipe yang benar-benar punya
   renderer, kunci jawaban hanya melalui RPC admin, simpan atomik, arsip/aktifkan.
4. **Map editor** — node `learning_nodes` yang sama dengan gameplay; tipe, urutan,
   lesson, reward, status aktif.
5. **Media library** — upload ke bucket `content-media`, validasi server MIME/ukuran,
   alt text wajib untuk gambar, metadata `media_assets`, arsip.
6. **Pengguna** — direktori, detail aktivitas, role, Reward Center melalui ledger.
7. **Gamifikasi** — quest, achievement, toko, level pemain, streak, tier liga, event.
   Heart ditampilkan **read-only** karena masih konstanta server.
8. **Konten website** — identitas/brand, blok halaman terstruktur, pengumuman
   terjadwal, broadcast inbox dengan estimasi audiens dan konfirmasi.
9. **Sosial** — daftar pertemanan, moderasi hapus relasi dengan alasan, Friend Quest
   aktif (target/hadiah).
10. **Analytics** — agregasi server 7/30/90 hari.
11. **Sistem** — audit log, matriks izin admin/developer, kesehatan konten.
12. **Integrasi pemain** — halaman informasi `/p/:slug`, banner pengumuman aktif
    di layout pemain, brand/logo/favicon/warna/hero/footer runtime. Draft dan
    pengumuman staff-only diuji tidak bocor ke publik.
13. **Reorder** — tombol naik/turun memakai RPC `admin_reorder` pada mapel,
    kursus, level, unit, lesson, node, dan soal (soal hanya saat satu lesson
    terpilih dalam satu halaman).
14. **Media picker** — editor soal dan blok gambar halaman memilih media dari
    library, bukan mengetik URL manual.

## Keamanan

- Tabel `questions`, `question_options`, `question_answers`, `question_pairs` tetap
  dicabut dari pemain; admin memakai RPC `security definer`.
- Permission: `dashboard.read`, `curriculum.read/edit/publish`, `questions.read/edit`,
  `media.manage`, `users.read/manage/suspend`, `roles.manage`, `gamification.manage`,
  `social.moderate`, `content.manage`, `announcements.manage`, `analytics.read`,
  `system.manage`, `audit.read`.
- `developer` selalu memiliki semua permission secara implisit.
- Audit append-only memuat before/after dan alasan.
- Registrasi dapat dinonaktifkan dan **ditegakkan trigger database** pada `auth.users`.
- Maintenance mode **ditegakkan trigger database** pada tabel state pemain.
  Selama aktif, semua statement tulis non-staff ditolak dengan pesan
  `Lentera sedang dalam mode pemeliharaan…`; staff, seed, dan service-role tetap
  diizinkan. Baca tetap tersedia.

## Migration

1. `supabase/migrations/20261112110000_admin_foundation.sql`
   Permission, konteks admin, overview, pengguna, role, analytics, matriks izin.
2. `supabase/migrations/20261112120000_admin_curriculum.sql`
   CRUD kurikulum, reorder, bank soal, validasi 12 tipe, status soal.
3. `supabase/migrations/20261112130000_admin_content.sql`
   Site settings, halaman blok, pengumuman, notifikasi, media, bucket storage,
   trigger registrasi.
4. `supabase/migrations/20261112140000_admin_gamification.sql`
   Katalog gamifikasi, sosial, Friend Quest, kesehatan konten.
5. `supabase/migrations/20261112150000_maintenance_mode.sql`
   Helper `site_maintenance_active`, trigger `enforce_maintenance_mode`, dan
   guard statement-level pada tabel state pemain (attempt, wallet/ledger,
   mastery, quest, toko, sosial, notifikasi, liga).

Urutan penerapan mengikuti nama file. Kelima migration ini **sudah diterapkan** ke
project remote pada 13 November 2026 (target CLI berlabel production, atas izin
eksplisit pemilik). Backup `pg_dump` lokal gagal karena Docker tidak tersedia;
backup otomatis Supabase tetap perlu diperiksa di dashboard sebelum perubahan
berikutnya.

```bash
npx supabase db push --include-all --remote --password "$SUPABASE_DB_PASSWORD" --yes
```

## Pengujian

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus |
| `npm test` | 108 test lulus |
| `npm run build` | Lulus |
| `npm run test:sql` | 318 smoke check lulus, termasuk seluruh RPC admin di atas |
| `node --env-file=.env scripts/verify-admin-deploy.mjs` | Lulus terhadap project remote |
| `node scripts/verify-public-pages.mjs http://localhost:5199` | Lulus di Chrome headless |
| `node --env-file=.env scripts/verify-admin-browser.mjs http://localhost:5199` | Lulus: akun staff sementara, CRUD mapel, halaman CMS, lalu cleanup |
| `node --env-file=.env scripts/verify-admin-deep.mjs http://localhost:5199` | Lulus: soal/media, pengguna, gamifikasi, sosial, matriks developer, maintenance production |

Smoke check baru memverifikasi kontrak integrasi pemain: draft page tidak
publik, page terbit dapat dibaca publik, `get_public_site_content` memuat
settings dan tautan page terbit, pengumuman publik terlihat anonim, dan
pengumuman staff-only tidak terlihat anonim tetapi terlihat staff. Maintenance
diuji: admin dapat mengaktifkan, tulis pemain ditolak, baca tetap jalan, tulis
staff tetap diizinkan, dan tulis pemain pulih setelah mode dimatikan.

Verifikasi remote 13 November 2026:

- 5 migration admin terpasang; 6 tabel CMS, 15 fungsi admin/publik, dan 30 trigger
  maintenance terdeteksi di database remote.
- RLS `questions` aktif, tabel jawaban tetap tanpa policy publik, anon tidak dapat
  mengeksekusi RPC admin, sedangkan `authenticated` dapat.
- `get_public_site_content`, `get_public_page`, dan `get_active_announcements`
  berjalan dengan anon key; pengaturan situs mengembalikan nama `Lentera`.
- Jalur otorisasi staff diuji read-only dengan JWT subject akun staff yang sudah
  ada: `admin_get_context` mengembalikan developer dan `admin_get_overview`
  mengembalikan data. Tidak ada akun atau data uji yang dibuat.
- Browser headless: landing memakai nama situs dari CMS, route `/p/:slug` merender
  blok heading/paragraf/daftar/callout (respons RPC dimock agar tidak menulis
  konten uji ke produksi), halaman tidak dikenal menampilkan status tidak
  ditemukan, `/admin` mengarahkan anon ke login, dan tidak ada console error.

Verifikasi browser penuh (13 November 2026) memakai akun staff sementara dengan
password acak yang dibuat dan dihapus dalam satu skrip:

- Login staff berhasil dan dashboard menampilkan 8 kartu metrik.
- Mapel: create lewat UI, tersimpan `active` di database, edit nama tersimpan,
  lalu status diarsipkan menjadi `inactive` lewat UI.
- Halaman CMS: create + publish lewat UI dengan 2 blok, tampil nyata di
  `/p/:slug`, diedit, dan perubahan langsung terlihat publik.
- Tidak ada console error.
- Akun staff, mapel uji, dan halaman uji dihapus; query verifikasi menunjukkan
  `0` baris tersisa untuk semuanya, dan tidak ada halaman terbit yang tertinggal.

Verifikasi browser mendalam (13 November 2026) memakai satu akun `developer` dan
satu akun `player` sementara, dengan hierarki kurikulum draft terisolasi:

- Media: upload PNG lewat UI masuk ke bucket `content-media` dan `media_assets`,
  lalu dipakai lewat media picker pada editor soal; arsip media berhasil.
- Bank soal: create soal pilihan ganda lewat UI (2 pilihan, 1 kunci, 1 media),
  edit prompt, lalu arsip; semua tersimpan dan terbaca dari database.
- Pengguna: pencarian dan detail pengguna berhasil; Reward Center menulis 3 Koin
  dan 7 XP ke ledger pemain uji.
- Gamifikasi: tujuh tab katalog dirender, dan quest nonaktif berhasil dibuat
  lewat UI (kode quest hanya menerima huruf kecil, angka, dan tanda hubung).
- Sosial: relasi pertemanan uji dimoderasi lewat UI dan terhapus dari database.
- Matriks izin: akun `developer` melihat checkbox admin aktif; izin
  `analytics.read` dicabut lalu dikembalikan lewat UI, dan audit log menampilkan
  aktivitas developer uji.
- Maintenance production: diaktifkan lewat UI, tulis `user_settings` pemain
  ditolak HTTP 400 dengan pesan pemeliharaan, RPC konten publik tetap 200,
  banner maintenance tampil di `/app`, lalu mode dimatikan dan tulis pemain
  kembali 200/204. Tidak ada console error.
- Cleanup terverifikasi: maintenance `false`, 0 subjek/soal/quest/pertemanan/
  media/akun uji tersisa, objek storage dihapus, dan izin analytics admin = 1.

Aksi uji tetap meninggalkan entri audit log (append-only). Backup `pg_dump` lokal
tidak dapat dibuat karena Docker/pg_dump tidak tersedia di mesin ini. Modul yang
belum diuji browser: suspend/reset password (belum ada Edge Function), broadcast
notifikasi, dan edit katalog gamifikasi yang sudah ada.

## Keterbatasan yang disengaja

- **Belum ada Edge Function** untuk suspend akun, reset password, atau backup/restore.
  Dashboard tidak menampilkan tombol palsu untuk operasi tersebut.
- **Heart** masih konstanta di RPC gameplay; dashboard hanya membaca nilai aktual.
- **Audio runtime** belum punya konfigurasi server; menu audio tidak ditampilkan.
- **Reorder drag-and-drop** belum ada; yang tersedia adalah tombol naik/turun.
- **Media usage/orphan check** belum ada; media yang sedang dipakai belum dapat
  dilacak otomatis dan media yatim belum terdeteksi.
- **Bulk import/export, feature flag, revisi/rollback, backup/restore** belum dibuat.
- **Maintenance mode** memblokir tulis di daftar tabel pemain yang tercantum pada
  migration; tabel pemain baru harus ditambahkan ke daftar trigger saat dibuat.
- **Pemakaian logo di Admin Dashboard** masih memakai lamp bawaan; logo CMS sudah
  dipakai di landing, auth, layout pemain, dan halaman informasi.
- Statistik yang tidak tersedia di skema ditampilkan sebagai ketiadaan data, bukan
  angka contoh.

## Riwayat perubahan sesi lanjutan (13 November 2026)

Pekerjaan sebelumnya berhenti setelah admin plane selesai tetapi belum tersambung
ke pemain. Sesi ini tidak membuat ulang fondasi; yang dilanjutkan adalah bagian yang
masih setengah jadi dan rantai integrasi yang belum tertutup.

### Diselesaikan

1. **Reorder benar-benar berfungsi** — `adminService.reorder` memanggil RPC
   `admin_reorder` yang sudah ada. Tombol naik/turun dipasang pada mapel, kursus,
   level, unit, lesson, node, dan soal. Reorder menuangkan ulang `sort_order`
   sebagai 0..n-1 untuk daftar sibling yang dikirim.
2. **Media picker** — `pickMedia()` di `src/pages/admin/media.ts` menampilkan
   library `content-media`; editor soal mengisi jenis, URL, dan alt text, sedangkan
   blok gambar halaman CMS mengisi URL dan alt text.
3. **Konten website dipakai pemain** — RPC publik yang sebelumnya tidak pernah
   dipanggil kini dipakai:
   - `get_public_site_content` → nama situs, tagline, deskripsi, copyright,
     support URL, warna utama, favicon, logo, hero, CTA, footer, dan tautan halaman.
   - `get_public_page` → route publik `/p/:slug` dengan renderer blok
     heading/paragraph/list/image/callout/faq tanpa HTML bebas.
   - `get_active_announcements` → banner pengumuman aktif di layout pemain,
     menghormati audiens all/onboarded/staff.
4. **Logo CMS** dipakai lewat `src/components/brandMark.ts`; lamp tetap menjadi
   fallback ketika logo kosong.
5. **Pengujian SQL baru** membuktikan draft page tidak publik, page terbit publik,
   pengumuman publik terlihat anonim, dan pengumuman staff-only tidak.

### File yang ditambahkan

- `src/types/siteContent.ts`
- `src/repositories/content.repository.ts`
- `src/services/content.service.ts`
- `src/pages/info.page.ts`
- `src/pages/admin/reorder.ts`
- `src/components/brandMark.ts`

### File yang diubah

- `src/app/router.ts` — route `/p/:slug`, judul dokumen memakai nama situs runtime.
- `src/main.ts` — memuat konten publik sebelum route pertama.
- `src/layouts/appLayout.ts` — brand runtime dan banner pengumuman.
- `src/layouts/authLayout.ts` — brand dan copyright runtime.
- `src/pages/welcome.page.ts` — hero, CTA, brand, footer, tautan halaman.
- `src/pages/onboarding.page.ts`, `src/pages/not-found.page.ts` — brand dan logo runtime.
- `src/pages/register.page.ts` — menampilkan penutupan registrasi dari site settings
  (penegakan tetap trigger database).
- `src/services/content.service.ts` — turunan warna hover/pressed dari warna brand.
- `src/pages/admin/curriculum.ts` — kontrol reorder.
- `src/pages/admin/questions.ts` — reorder dan media picker.
- `src/pages/admin/website.ts` — media picker untuk blok gambar.
- `src/pages/admin/media.ts` — picker library.
- `src/repositories/admin.repository.ts`, `src/services/admin.service.ts` — `reorder`.
- `src/styles/admin.css`, `src/styles/pages.css` — gaya picker, banner, halaman info.
- `scripts/test-sql.mjs` — lima smoke check integrasi publik.

### Masih terbuka

Lihat bagian "Keterbatasan yang disengaja" di atas. Prioritas berikutnya yang
paling masuk akal: penegakan maintenance mode di backend, media usage/orphan
check, lalu riwayat revisi dan rollback berbasis snapshot audit yang sudah ada.

## Maintenance mode (lanjutan)

`site_settings.maintenance_mode` kini ditegakkan di database, bukan hanya disimpan.

- `public.site_maintenance_active()` membaca flag sebagai `security definer`.
- `public.enforce_maintenance_mode()` dipasang sebagai trigger **statement-level**
  `BEFORE INSERT/UPDATE/DELETE` pada tabel state pemain: profil/settings, attempt
  lesson & latihan, mastery, heart, streak, wallet/ledger, quest, achievement,
  progres, toko/inventory, pertemanan, Friend Quest, notifikasi, dan liga.
- Request tanpa identitas pengguna (migration, seed, service role) selalu lolos.
- Staff (`admin`/`developer`) selalu lolos agar moderasi dan reward tetap bisa
  dilakukan, dan agar mode dapat dimatikan kembali.
- Pesan error: `Lentera sedang dalam mode pemeliharaan. Aksi tulis dinonaktifkan sementara.`
- Baca tetap tersedia; layout pemain menampilkan banner peringatan saat flag aktif.
- Toggle di Admin → Konten website → Identitas kini aktif dan tersimpan lewat
  `admin_save_site_settings`.

Catatan operasional: bila menambah tabel state pemain baru, tambahkan namanya ke
daftar tabel pada migration `20261112150000_maintenance_mode.sql`. Tabel sistem yang
ditulis saat pembacaan (mis. `game_events` dari `ensure_week_event`) sengaja tidak
diblokir agar halaman baca tidak ikut gagal.
