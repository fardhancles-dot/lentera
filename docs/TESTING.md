# Testing

## Bukti eksekusi terakhir — 10 November 2026

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| TypeScript strict | `npm run typecheck` | Lulus, 0 error. |
| Unit test | `npm test` | **49 test lulus (5 file)**. |
| Migration + RPC + RLS + practice + Friends Quest + progression | `npm run test:sql` | **167 smoke check lulus** di PGlite. |
| Build produksi | `npm run build` | Lulus; Phaser, Friends Quest, dan wallet menjadi chunk terpisah. |
| Browser smoke | Chrome headless | Landing, auth, guard route, 404 (sesi 1). |
| Supabase nyata | `npm run verify:supabase` | **43 check lulus** (lesson 20 soal, 4 scene, Practice Hub, Friends Quest, progression, XP idempoten, RLS) di project `xvrnmxbrxhtzzavmrlvy`. |
| Playwright/E2E | — | Belum ada. |

PGlite membuktikan SQL dan RPC konsisten. Verifikasi Supabase nyata kini juga sudah
dijalankan lewat Auth + PostgREST, tetapi belum mencakup UI browser, email, dan redirect.
Sepuluh migration (termasuk progression/economy) dan seed 231 soal sudah diterapkan ke
project nyata.

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
atau scene yang membocorkan jawaban), menjawab seluruh soal dengan kunci uji,
menyelesaikan lesson, lalu membuat Friends Quest. Skrip menjalankan beberapa sesi Match
Madness sampai target XP quest tercapai, memastikan kontribusi dihitung server, mengklaim
hadiah, dan memastikan klaim kedua tidak menambah hadiah. Terakhir skrip memastikan
`question_pairs`, `practice_sessions`, dan `user_hearts` tidak bisa dibaca tanpa sesi. Skrip
juga memanggil `get_player_state`, `get_my_wallet`, membaca 30 baris `player_levels`, menguji
refill saat Hearts penuh tanpa memotong Koin, dan memastikan pemain tidak dapat mengubah
Hearts langsung. Ini menguji Auth + PostgREST + RPC nyata, **bukan** tampilan browser; uji
klik tetap harus dilakukan terpisah.

## Cakupan `npm run test:sql`

`scripts/test-sql.mjs` membuat database PostgreSQL in-memory, lalu:

1. Menjalankan kesepuluh migration berurutan, termasuk `question_scenes`,
   `practice_engine`, `friends_quest`, dan `progression_economy`.
2. Memeriksa 8 mapel aktif, 57 lesson, 231 soal, 12 tipe soal, 19 pasangan matching,
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
29. Menguji Fill in the Blank dua rumpang: jawaban berurutan diterima, urutan terbalik
    ditolak.
30. Memeriksa scene Conversation menyimpan reaksi NPC per opsi, Story menyimpan pilihan
    respons, dan locale listening Inggris `en-US` serta Indonesia `id-ID`.
31. Memeriksa lima soal Stage 4 Bahasa Indonesia masuk seed, termasuk conversation dengan
    empat reaksi dan story dengan tiga pilihan.
32. Friends Quest: kode undangan dibuat, pembuat menjadi anggota pertama, non-anggota
    tidak dapat melihat quest, anggota kedua bergabung dengan kode, XP practice dan lesson
    kedua anggota dijumlahkan, target 30 XP menyelesaikan quest, klaim memberi 25 XP + 10
    Koin, klaim kedua ditolak, ledger hadiah hanya satu baris, dan non-anggota ditolak.
33. Memastikan pemain biasa bukan staff dan payload pratinjau mini-game tetap tidak
    membocorkan kunci.
34. Progression: pemain baru mulai dengan 5 Hearts, Streak 0, dan Koin 0; 100 XP mencapai
    level 2 berjudul “Penjelajah”.
35. Hearts: 0 Hearts menolak `start_lesson` (`hearts_empty`); jawaban salah mengurangi satu
    Heart; duplicate answer dan jawaban benar tidak mengurangi lagi.
36. Streak dan level: XP ledger 100 menaikkan level dan membuat Streak 1; XP practice di hari
    yang sama tidak menggandakan Streak; XP `friend_quest_reward` masuk total XP tetapi tidak
    memperpanjang Streak; persentase level memakai jarak ambang berikutnya.
37. Wallet: refill tanpa Koin cukup ditolak, Hearts tidak berubah; refill 3 Hearts memotong
    30 Koin, menulis transaksi `heart_refill`, mengembalikan riwayat XP; refill saat penuh
    tidak memotong Koin; RLS hanya membuka Hearts/Streak sendiri dan menolak update langsung.

## Unit test Vitest

- `tests/validation.test.ts` — email, password, kekuatan password, konfirmasi, username,
  nama tampilan, bio, target harian, zona waktu, volume, saran username.
- `tests/authErrors.test.ts` — pemetaan error Supabase ke pesan Indonesia dan pencegahan
  kebocoran pesan backend mentah.
- `tests/practice.test.ts` — format countdown latihan, batas bawah nol, dan multiplier
  combo untuk tampilan. Skor sebenarnya tetap dihitung server.
- `tests/minigames.test.ts` — parsing prompt Fill in the Blank tanpa rumpang, satu, dua,
  dan tiga rumpang; penggabungan jawaban berurutan; penolakan jawaban kosong.
- `tests/player.test.ts` — parsing state/wallet dari RPC, clamp Hearts/persentase, fallback
  payload kosong, filter transaksi rusak, dan format countdown refill.

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
- Friends Quest sudah diuji lewat PGlite dan API Supabase, tetapi UI dua akun nyata
  (buat quest, salin kode, bergabung, klaim) belum diuji di browser.
- Wallet, HUD Hearts di lesson, kartu progres beranda/profil, dan countdown refill belum
  diuji di browser dengan akun nyata; RPC dan RLS-nya sudah diuji.
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

### Friends Quest

- [ ] Akun A membuat quest; kode 6 karakter muncul dan dapat disalin.
- [ ] Akun B membuka `/friends-quest`, memasukkan kode, dan melihat progres yang sama.
- [ ] XP lesson/latihan akun A dan B menambah kontribusi masing-masing di server.
- [ ] Quest berubah selesai saat total mencapai target.
- [ ] Tombol klaim memberi XP/Koin satu kali; klik kedua menolak klaim ganda.
- [ ] Akun C yang bukan anggota tidak melihat quest dan tidak dapat mengklaim.
- [ ] Pemain dengan 3 quest aktif mendapat pesan batas, bukan error mentah.

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

### Hearts, Streak, level, dan wallet

- [ ] Topbar, beranda, dan profil menampilkan Koin/Hearts/Streak yang sama dengan `/wallet`.
- [ ] Lesson dengan Hearts 0 menampilkan tautan “Isi Hearts” ke `/wallet`.
- [ ] Jawaban salah mengurangi satu Heart; jawaban ulang soal yang sama tidak mengurangi.
- [ ] Refill 3 Hearts memotong 30 Koin dan menambah riwayat transaksi.
- [ ] Refill saat Hearts penuh tidak memotong Koin.
- [ ] Refill tanpa Koin cukup menampilkan pesan, bukan error mentah.
- [ ] Streak bertambah setelah lesson/latihan di hari baru; hadiah quest tidak menambah.
- [ ] Naik level setelah total XP melewati ambang 100 XP.
- [ ] Countdown Heart berjalan dan menyegarkan state setelah habis.

### RLS

- [ ] Akun A tidak dapat `select` settings/attempt/wallet/Hearts/Streak milik B.
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
