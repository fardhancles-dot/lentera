# Keamanan

## Prinsip

1. **Server adalah otoritas.** Frontend tidak pernah dipercaya untuk menentukan role,
   saldo, XP, atau kepemilikan reward.
2. **Defense in depth.** RLS membatasi baris, grant kolom membatasi kolom, validasi UI
   hanya untuk kenyamanan.
3. **Secret tidak pernah ke browser.** Hanya anon/publishable key yang boleh ada di
   `VITE_*`. `service_role` hanya untuk server/Edge Function.
4. **Role dari tabel.** Otoritas role dibaca dari `public.user_roles`, bukan
   `user_metadata` yang dapat diubah pengguna.

## Yang sudah diterapkan

### Autentikasi

- Supabase Auth (email + password), session dipersist dan di-refresh otomatis.
- Konfirmasi email dapat diaktifkan; UI menampilkan status “cek email”.
- Reset password memakai tautan resmi Supabase. Pesan permintaan reset selalu netral
  untuk mengurangi account enumeration.
- Error backend dipetakan ke pesan aman; detail mentah hanya masuk console.
- Tautan internal divalidasi (`/` dan bukan `//`) sebelum redirect.

### Otorisasi database

- RLS aktif pada `profiles`, `user_settings`, `user_roles`.
- `profiles`: pemain hanya dapat mengubah barisnya sendiri; `INSERT`/`DELETE` tidak
  diberikan ke API.
- `user_settings`: hanya baris sendiri.
- `user_roles`: hanya baca (sendiri atau staff), tanpa grant tulis.
- Grant kolom memastikan pemain tidak dapat mengubah `id` atau kolom di masa depan.
- Tabel bank soal (`questions`, `question_options`, `question_answers`, `question_media`,
  `question_pairs`) tidak diberi grant baca ke pemain; soal dan penilaian hanya lewat RPC.
- `question_pairs` menyimpan relasi kiri/kanan dan tidak pernah dikirim sebagai baris
  berpasangan. Payload hanya mengirim dua kolom terpisah.
- Fungsi `security definer` memakai `search_path` tetap.
- Fungsi bootstrap developer di-revoke dari `public`, `anon`, dan `authenticated`.
- Tabel sosial/liga (`friendships`, `notifications`, `league_*`, `game_events`,
  `user_event_claims`) di-revoke dari `anon`; hanya `authenticated` yang mendapat grant baca
  terbatas. `league_groups` dan `league_members` tidak diberi grant langsung sama sekali.
- `friendships` RLS hanya membuka relasi yang melibatkan pemanggil; `notifications` dan
  `league_results` hanya baris sendiri. Semua penulisan lewat RPC, bukan PostgREST.
- Profil publik hanya membagikan username, nama tampilan, avatar, dan bio. Email tetap di
  `auth.users` dan tidak pernah dibaca RPC sosial.
- Statistik pemain difilter `profile_visibility`: `private` selalu tertutup untuk pemain
  lain, `friends` hanya untuk relasi `accepted`, `public` untuk semua. Leaderboard global
  mengecualikan profil `private`.
- Aksi sensitif sosial memakai `auth.uid()` dari sesi, bukan ID dari body request:
  hanya addressee yang dapat menerima/menolak permintaan, klaim liga/event memakai baris
  milik pemanggil, dan hadiah ditulis dengan kunci unik agar idempoten.
- Toast merender teks dengan `textContent`, bukan `innerHTML`, sehingga judul quest/nama
  pemain yang memuat HTML tidak dieksekusi (diuji E2E).

### Frontend

- Tidak ada `service_role` atau secret di bundle.
- Halaman privat tidak dirender sebelum guard sesi selesai.
- Hanya halaman yang relevan dimuat (lazy route), mengurangi permukaan yang tidak perlu.
- `noopener` tidak diperlukan saat ini karena tidak ada `target=_blank` dinamis.

## Belum diterapkan / batasan

Ini harus diselesaikan sebelum fitur terkait dinyatakan selesai:

| Area | Status | Rencana |
| --- | --- | --- |
| Otoritas XP/Koin/Hearts/Streak/level | XP, Koin, Hearts, Streak, dan level dihitung RPC/trigger server | Client hanya membaca snapshot; tidak ada grant tulis ke Hearts/Streak/wallet. Level diturunkan dari total XP. |
| Idempotensi reward | Lesson sudah idempoten | `lesson_attempt_id` unik + unique `answer_attempts`; reward lain memakai pola yang sama. |
| Rate limiting | Hanya bawaan Supabase Auth | Batasi aksi sensitif di Edge Function. |
| Anti-cheat gameplay | Penilaian dan attempt sudah di server; timer belum | Tambah batas waktu wajar dan deteksi request berulang saat mode timed dibuat. |
| Audit log developer | Belum ada | Tabel append-only + aktor dari `auth.uid()`, bukan input form. |
| Privasi profil | Profil dasar (username, nama, avatar, bio) publik; statistik mengikuti `private`/`friends`/`public` lewat RPC | Email tidak pernah dibagikan; audit ulang bila menambah kolom profil baru. |
| CSRF | SPA + Bearer token Supabase, tanpa cookie sesi aplikasi | Tidak ada form server-rendered. Tinjau ulang jika cookie dipakai. |
| CSP | Belum diatur | Tambahkan header CSP di Vercel setelah daftar origin final. |
| Email provider | Mengandalkan email bawaan Supabase | Konfigurasi SMTP saat produksi. |
| PWA/offline write | Belum ada | Antrian attempt lokal + validasi server saat sync. |

## Operasional

- Jangan commit `.env`.
- Rotasi kunci jika pernah terekspos. Anon key boleh publik, tetapi tetap ikuti kebijakan
  project.
- Batasi akses SQL Editor ke pemilik project.
- Backup database sebelum migration besar.
- Tinjau policy setiap kali menambah tabel.
- Untuk pengujian isolasi, buat dua akun dan pastikan akun A tidak dapat membaca/mengubah
  data akun B.

## Pelaporan

Jika menemukan celah, jangan buka issue publik berisi detail eksploitasi. Catat langkah
reproduksi dan hubungi pemilik proyek.
