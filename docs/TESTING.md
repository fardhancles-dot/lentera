# Testing

## Bukti eksekusi terakhir — 9 November 2026

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| TypeScript strict | `npm run typecheck` | Lulus, 0 error. |
| Unit test | `npm test` | 34 test lulus (3 file). |
| Migration + RPC + RLS + practice | `npm run test:sql` | 106 smoke check lulus di PGlite. |
| Build produksi | `npm run build` | Lulus; Phaser menjadi chunk terpisah. |
| Browser smoke | Chrome headless | Landing, auth, guard route, 404 (sesi 1). |
| Supabase nyata | `npm run verify:supabase` | **29 check lulus** (lesson 20 soal, 4 scene, Practice Hub, XP idempoten, RLS) di project `xvrnmxbrxhtzzavmrlvy`. |
| Playwright/E2E | — | Belum ada. |

PGlite membuktikan SQL dan RPC konsisten. Verifikasi Supabase nyata kini juga sudah
dijalankan lewat Auth + PostgREST, tetapi belum mencakup UI browser, email, dan redirect.

## Verifikasi API Supabase nyata

Setelah migration diterapkan, isi `.env` dan tambahkan akun uji:

```env
E2E_EMAIL=akun-developer@contoh.com
E2E_PASSWORD=password-akun-uji
```

Akun harus punya role `developer` agar bisa membuka lesson di luar urutan unlock. Jalankan:

```bash
npm run verify:supabase
```

Skrip `scripts/verify-supabase.mjs` login dengan akun uji, memeriksa role, mencari lesson
`greetings-vocabulary`, memulai attempt, memeriksa payload (20 soal, tanpa kunci/relasi
atau scene yang membocorkan jawaban),
menjawab seluruh soal dengan kunci uji, menyelesaikan lesson, dan memastikan
`question_pairs` tidak bisa dibaca tanpa sesi. Ini menguji Auth + PostgREST + RPC nyata,
**bukan** tampilan browser; uji klik tetap harus dilakukan terpisah.

## Cakupan `npm run test:sql`

`scripts/test-sql.mjs` membuat database PostgreSQL in-memory, lalu:

1. Menjalankan kedelapan migration berurutan, termasuk `question_scenes` dan
   `practice_engine`.
2. Memeriksa 8 mapel aktif, 57 lesson, 225 soal, 12 tipe soal, 15 pasangan matching,
   3 media gambar, dan 6 jenis node.
3. Memeriksa 7 node practice, 7 checkpoint, dan 7 legendary; semuanya punya lesson
   dengan minimal 3 soal aktif.
4. Memastikan tidak ada node playable pada mapel inti yang kehabisan soal.
5. Memeriksa urutan `practice → checkpoint → legendary` dan penempatannya di Level 2/3.
6. Memeriksa agregat `subject_overview` (Pemrograman Web: 8 lesson, 30 soal).
7. Membuat dua pengguna lewat trigger dan memastikan profil otomatis terbentuk.
8. Menolak node kedua sebelum node pertama selesai (`lesson_locked`).
9. Memastikan payload `start_lesson` berisi 5 soal dan tidak membocorkan `is_correct`
   atau tabel jawaban.
10. Menilai jawaban salah dan benar, memastikan penjelasan + jawaban benar dikembalikan.
11. Memastikan jawaban duplikat idempoten (`alreadyAnswered`).
12. Menyelesaikan lesson dengan akurasi 80%, XP 10, Koin 2.
13. Memastikan penyelesaian ulang tidak menambah XP dan ledger tetap satu baris.
14. Memastikan progres node dan course tersimpan serta node berikutnya terbuka.
15. Menolak penyelesaian sebelum semua soal dijawab.
16. Menyelesaikan review dengan akurasi 100% dan total XP 20.
17. Memastikan replay lesson selesai tidak menambah ledger.
18. Memastikan RLS menyembunyikan attempt pemain lain.
19. Memastikan pemain tidak bisa mengubah wallet langsung (`permission denied`).
20. Memastikan pemain tidak bisa membaca tabel `question_pairs`.
21. Memastikan pemain biasa bukan staff.
22. Menguji grading kelima mini-game: matching lengkap benar, pasangan tertukar,
    set tidak lengkap, dan id duplikat ditolak; fill blank peka kapitalisasi/spasi;
    word bank dan sentence builder menolak urutan salah; picture identification menolak
    opsi palsu.
23. Memeriksa payload mini-game lewat pratinjau staff: 20 soal, tanpa `is_correct`,
    tanpa tabel jawaban, tanpa baris pasangan, dua kolom matching terpisah, media gambar,
    penanda `__` pada fill blank, transkrip listening, NPC conversation, dan tiga layar
    story.
24. Menguji grading tipe baru: listening/conversation/story memilih opsi benar dan
    menolak opsi salah; speaking menerima ucapan yang dikenali dan menolak kalimat lain;
    translation menerima kalimat benar dan menolak yang salah.
25. Memulai sesi `timed`: 10 soal, batas 120 detik, payload tanpa kunci. Semua soal
    dijawab benar, lalu penyelesaian memberi skor di atas poin dasar (bonus kecepatan dan
    combo), akurasi 100, dan XP 20.
26. Memastikan penyelesaian latihan kedua kali tidak menambah XP dan ledger practice
    hanya satu baris.
27. Memastikan `match_madness` hanya memakai soal matching (3 ronde, 90 detik),
    `unit_review` menolak tanpa unit dan mengembalikan soal unit yang dipilih, serta
    `mistakes` menemukan jawaban salah sebelumnya.
28. Memastikan RLS menyembunyikan sesi latihan pemain lain dan pemain tidak dapat
    menulis `practice_sessions` langsung.

## Unit test Vitest

- `tests/validation.test.ts` — email, password, kekuatan password, konfirmasi, username,
  nama tampilan, bio, target harian, zona waktu, volume, saran username.
- `tests/authErrors.test.ts` — pemetaan error Supabase ke pesan Indonesia dan pencegahan
  kebocoran pesan backend mentah.
- `tests/practice.test.ts` — format countdown latihan, batas bawah nol, dan multiplier
  combo untuk tampilan. Skor sebenarnya tetap dihitung server.

## Yang belum dapat diuji

- Registrasi lewat UI, verifikasi email, reset password, onboarding, simpan profil, dan
  simpan pengaturan belum diuji di browser. Login API sudah diuji.
- RLS Practice Hub dan `question_pairs` sudah diuji lewat PostgREST; RLS tabel lain baru
  diuji di PGlite.
- Gameplay dan Practice Hub belum diuji di browser dengan sesi nyata; RPC sudah diuji
  di database.
- Belum ada Playwright, uji responsif otomatis, atau audit performa.
- Audio memakai text-to-speech browser; belum ada pengujian suara nyata di perangkat.
- Speaking belum diuji dengan mikrofon sungguhan; Web Speech Recognition berbeda tiap
  browser.
- Friends Quest belum ada sehingga tidak dapat diuji.
- Belum ada PWA.

## Checklist manual setelah Supabase aktif

### Akun

- [ ] Register email baru → profil + settings + role `player` otomatis.
- [ ] Register email yang sama → pesan “sudah terdaftar”, bukan akun kedua.
- [ ] Login benar/salah → pesan jelas, tidak bocor detail server.
- [ ] Refresh halaman → sesi bertahan.
- [ ] Forgot password → email masuk → `/reset-password` → password baru berlaku.
- [ ] Tautan reset kedaluwarsa → halaman “Tautan tidak valid”.
- [ ] Logout → halaman privat tidak dapat dibuka.

### Profil & pengaturan

- [ ] Onboarding menyimpan username, avatar, nama, target, zona waktu.
- [ ] Username duplikat dan tidak valid ditolak UI + database.
- [ ] Profil dan pengaturan bertahan setelah logout dan ganti browser.
- [ ] Pemain tidak dapat mengubah role/ID lewat REST client.

### Kurikulum dan gameplay

- [ ] `/learn` menampilkan 10 mapel dan angka yang cocok dengan database.
- [ ] Jawa/Sunda membuka modal pengembangan; Sambas membuka peta dengan 0 soal.
- [ ] Peta menampilkan status selesai/aktif/terkunci sesuai progres.
- [ ] Node practice di Level 2 terbuka setelah seluruh node Level 1 selesai.
- [ ] Checkpoint terbuka setelah practice; legendary di Level 3 terbuka setelah checkpoint.
- [ ] Ketiga node baru menampilkan soal, penilaian, dan hasil seperti lesson biasa.
- [ ] Node terkunci tidak bisa dibuka lewat URL langsung.
- [ ] Lesson pilihan ganda: pilih, periksa, feedback, lanjut, hasil.
- [ ] Lesson isian/mengetik: jawaban benar dan alternatif dinilai benar.
- [ ] Word Bank: ketuk kata, hapus chip, dan susun ulang.
- [ ] Sentence Builder: geser urutan kata dan kembalikan kata ke bank.
- [ ] Matching Pairs: pilih dua kolom, batalkan pasangan, dan reset.
- [ ] Fill in the Blank: input inline pada `__`, jawaban benar/salah ditandai.
- [ ] Picture Identification: gambar tampil, pilih nama, opsi benar ditandai saat salah.
- [ ] Hint, penjelasan, dan jawaban benar tampil.
- [ ] Pindah mapel tidak menghapus progres mapel lain.
- [ ] Replay lesson selesai tidak menambah XP/Koin.
- [ ] Gagal (<60%) tidak memberi hadiah tetapi progres attempt tercatat.
- [ ] Refresh di tengah lesson tidak menggandakan reward.

### Latihan (Practice Hub)

- [ ] `/practice` menampilkan tujuh mode dan selector mata pelajaran.
- [ ] Timed Challenge: countdown 120 detik berjalan, waktu habis langsung menilai.
- [ ] Ramp Up: soal makin sulit, timer 20 detik per soal berjalan.
- [ ] Match Madness: 90 detik, hanya soal matching, combo tampil.
- [ ] Mistakes Review menampilkan pesan jelas bila belum ada jawaban salah.
- [ ] Personalized Practice memakai soal dari topik yang pernah salah.
- [ ] Unit Review menampilkan pilihan unit sebelum mulai.
- [ ] Legendary Challenge memberi XP lebih besar (maksimal 30).
- [ ] Menyelesaikan mode yang sama dua kali tidak menambah XP kedua kali.
- [ ] Timer berhenti saat feedback dan lanjut saat menekan Lanjut.
- [ ] Listening: putar, ulangi, versi lambat, dan volume bekerja (media atau TTS).
- [ ] Speaking: izin mikrofon, transkrip muncul, alternatif menulis saat tidak didukung.
- [ ] Conversation/Story: bubble dan audio tampil, pilihan respons dinilai.

### RLS

- [ ] Akun A tidak dapat `select` settings/attempt/wallet milik B.
- [ ] Akun A tidak dapat `update` profil B meski tahu UUID B.
- [ ] Akun A tidak dapat menulis `user_roles`, `user_wallets`, atau tabel soal.
- [ ] `complete_lesson_attempt` milik pengguna lain ditolak.

### Responsif dan aksesibilitas

- [ ] 360 px: bottom nav, form, tombol, dan layar lesson tidak terpotong.
- [ ] 768 px: layout tablet; peta dan kartu tetap nyaman.
- [ ] 1280 px+: sidebar dan konten maksimum nyaman.
- [ ] Keyboard: Tab mencapai semua kontrol; Enter mengirim jawaban teks.
- [ ] `prefers-reduced-motion`: animasi Phaser dan CSS berhenti.
- [ ] Progress bar dan feedback terbaca pembaca layar (`aria-live`).

## Konvensi

- Setiap bug yang diperbaiki diberi test regresi bila memungkinkan.
- Jangan menurunkan assertion atau menonaktifkan test untuk membuat build hijau.
- Laporkan test yang gagal atau tidak dapat dijalankan secara eksplisit.
- Jalankan `npm run test:sql` setiap kali migration berubah.
