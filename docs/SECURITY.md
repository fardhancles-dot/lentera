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
| Privasi profil | Semua pemain dapat melihat profil dasar | Tambahkan pengaturan privasi + view terbatas saat fitur sosial dibuat. |
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
