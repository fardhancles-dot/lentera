# Testing

## Bukti eksekusi terakhir — 11 November 2026

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| TypeScript strict | `npm run typecheck` | Lulus, 0 error. |
| Unit test | `npm test` | **78 test lulus (11 file)**, termasuk audio, aset, layout compact, dan status learning path. |
| Migration + RPC + RLS + practice + Friends Quest + progression + reward + mastery + sosial/liga + developer | `npm run test:sql` | **262 smoke check lulus** di PGlite, termasuk akses `subject_overview` sebagai `authenticated`, pertemanan, liga, event, notifikasi, RLS, serta overview/pencarian/Reward Center/audit/broadcast. |
| Build produksi | `npm run build` | Lulus; Phaser, Friends Quest, quest, shop, dan wallet menjadi chunk terpisah. |
| Browser smoke | Chrome headless | Landing, auth, guard route, 404 (sesi 1). |
| Supabase nyata | `npm run verify:supabase` | **83 check lulus** (view katalog, lesson 20 soal, 4 scene, Practice Hub, Friends Quest, progression, reward/quest/achievement/toko, mastery/review/node hadiah, sosial/liga/event/notifikasi/privasi, developer overview/pencarian/audit, XP idempoten, RLS) di project `xvrnmxbrxhtzzavmrlvy`. |
| Playwright/E2E | `npm run test:e2e` | **14 lulus** (9 rute, alur lesson, latihan, konfirmasi email, reset password, profil/pengaturan, overflow 390px, reduced motion, maskot, audio, peta, Friends Quest dua akun, sosial/liga/privasi dua akun, Developer Dashboard staff). |

PGlite membuktikan SQL dan RPC konsisten. Verifikasi Supabase nyata kini juga sudah
dijalankan lewat Auth + PostgREST. UI browser diuji Playwright memakai akun QA di `.env`
(Chrome terpasang, bukan unduhan Playwright); email verifikasi dan redirect email belum.
Kelima belas migration sudah diterapkan ke project nyata, termasuk
`20261110140000_mastery_review_rewards.sql` (mastery, review terjadwal, node hadiah),
`20261110150000_subject_overview_owner.sql` (perbaikan view katalog),
`20261111100000_social_league.sql` (pertemanan, liga, event, notifikasi, privasi), dan
`20261111110000_developer_dashboard.sql` (Developer Dashboard, Reward Center, broadcast,
audit log).
Migration sosial diterapkan lewat Management API dengan pola `db:apply-catalog-fix`
karena project tidak ter-link ke Supabase CLI di mesin pengembangan.

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
Hearts langsung. Untuk reward Tahap 5, skrip memanggil `get_my_quests`,
`get_my_achievements`, `get_shop_catalog`, dan `get_my_inventory`; memastikan enam misi,
delapan achievement, dua item toko, dan penolakan item/quest palsu; lalu memastikan
`user_inventory` tidak dapat diubah langsung. Sesi 11 menambahkan check `get_my_mastery`,
`start_scheduled_review`, 22 node hadiah aktif, penolakan `claim_reward_node` untuk node
tidak dikenal, serta penolakan tulis langsung ke `user_question_mastery` dan
`user_reward_claims`. Sesi 16 menambahkan check `search_players`, `get_my_friends`,
`get_friend_activity`, `get_friend_profile` (profil sendiri), `get_leaderboard`
global/teman + penolakan scope palsu, `get_my_league`, `get_active_event`,
`get_my_notifications`, `mark_notifications_read`, 10 tier liga, dan RLS `friendships` /
`notifications`. Sesi 17 menambahkan check `get_developer_overview`,
`get_developer_users` lewat email staff, `get_audit_logs`, penolakan reward kosong, dan
penolakan tautan broadcast eksternal. Broadcast valid sengaja tidak dijalankan agar tidak
mengirim notifikasi ke seluruh pemain nyata; pengiriman valid diuji di PGlite. Ini menguji
Auth + PostgREST + RPC nyata, **bukan** tampilan browser; uji klik tetap harus dilakukan
terpisah.

## Cakupan `npm run test:e2e`

`playwright.config.ts` menjalankan Vite di port 4173 lalu menguji dengan Chrome terpasang
(channel `chrome`). Test memakai `E2E_EMAIL`/`E2E_PASSWORD` dari `.env` dan skip sendiri
bila kredensial tidak ada. Test dua akun (Friends Quest dan sosial/liga) memakai
`E2E_FRIEND_*` bila diisi, atau membuat dua akun sementara lewat Admin API bila
`SUPABASE_ACCESS_TOKEN` tersedia; akun sementara dihapus di `finally`. Tanpa keduanya test
skip dengan alasan jelas, bukan gagal.

| Test | Cakupan |
| --- | --- |
| `every app route renders without page errors` | Login, lalu 9 rute (`/app`, `/learn`, `/practice`, `/wallet`, `/quests`, `/shop`, `/mastery`, `/profile`, `/settings`): `main#main`, heading, judul topbar, dan nol error konsol. |
| `lesson starts, answers, shows feedback, and advances` | Klik node lesson di peta → kartu “Riwayat percobaan” tampil → `Mulai lesson` → jawab soal → feedback benar/salah → tombol lanjut. |
| `mobile layout has no horizontal overflow` | Viewport 390×844 pada 5 rute + frame peta; `scrollWidth - clientWidth ≤ 2px`. |
| `reduced motion keeps the map usable` | `prefers-reduced-motion: reduce`: kanvas peta, tombol level, dan judul tetap tampil. |
| `practice hub starts a session and grades an answer` | `/practice?subject=bahasa-inggris` → mode nyata → jawab satu soal → `Periksa jawaban` → feedback dan tombol lanjut. Skip bila mekanik soal pertama butuh mikrofon. |
| `profile and settings save and persist after reload` | Ubah nama tampilan → toast → reload → nilai tersimpan; ubah preferensi reduced motion → reload → tetap; keduanya dikembalikan ke nilai awal. |
| `recovery link lets a player set a new password` | Akun sementara + tautan recovery resmi dibuat lewat Admin API, halaman `/reset-password` menyimpan password baru, kartu sukses tidak tertimpa form, lalu login API dengan password itu diverifikasi. Akun dihapus setelah test. Butuh `SUPABASE_ACCESS_TOKEN`. |
| `signup confirmation link activates a new account` | Akun dibuat belum terkonfirmasi, tautan `signup` resmi dibuka, halaman berakhir di `/app` atau `/onboarding`, `email_confirmed_at` terisi, dan login API berhasil. Akun dihapus setelah test. Butuh `SUPABASE_ACCESS_TOKEN`. |
| `two accounts contribute, sync, and claim one Friends Quest reward each` | Dua akun sementara: membuat quest, bergabung lewat kode, dua sesi Match Madness per akun, progres 24/20 XP, klaim bersamaan hanya satu hadiah, klaim ulang idempoten, persistensi refresh/login, non-anggota ditolak, manipulasi `contribution_xp` ditolak, dan XSS judul quest tidak dieksekusi. |
| `league, friends, notifications, and profile privacy work across two accounts` | Dua akun sementara: bottom nav 5 item, hamburger berisi 4 navigasi, liga/event tampil, tab Global, cari + kirim permintaan, notifikasi masuk, terima teman, notifikasi penerimaan + tandai semua dibaca, statistik teman, privat menyembunyikan statistik, `friends` membukanya, hapus teman menutupnya lagi, dan `public` membuka untuk non-teman. |
| `developer dashboard grants a reward and keeps audit staff-only` | Akun staff QA + akun pemain sementara: enam metrik tampil, pencarian lewat email, pilih pemain, kirim 3 Koin + 5 XP, toast sukses, audit `Hadiah dikirim` tercatat, wallet pemain berisi saldo dan transaksi `Hadiah developer`, pemain biasa dialihkan dari `/developer` ke `/app`, dan tidak ada tautan developer. Baris audit uji dibersihkan lewat service role; akun sementara dihapus. |
| `landing mascot canvas mounts and reacts to a click` | Maskot landing (kanvas/SVG fallback) dan reaksi klik. |
| `audio engine starts and schedules sound after a user gesture` | Bungkus `AudioContext` sebelum halaman dimuat; setelah login, konteks dibuat, berstatus `running`, dan minimal 4 osilator dijadwalkan (musik + SFX). Bukan pengujian pendengaran. |
| `map renders, level buttons work with the keyboard, and the canvas resizes` | Peta berakun, pemilih area via keyboard (`aria-pressed`, status live), label “Area n dari m”, legenda status, resize 390px, kanvas compact 420, dan 5 item bottom nav minimal 44px. |

Catatan bug katalog: view `subject_overview` sempat memakai `security_invoker = true`
sementara `questions` di-revoke dari `authenticated`, sehingga view mengembalikan
`permission denied for table questions`. Migration
`20261110150000_subject_overview_owner.sql` sudah diterapkan ke project nyata, jadi view
kembali menjadi sumber katalog dan log 403 hilang. `npm run test:sql` menjalankan view itu
sebagai role `authenticated` sebagai penjaga regresi; sebelum perbaikan query tersebut
gagal dengan error yang sama seperti di produksi. `scripts/verify-supabase.mjs` membaca
view yang sama lewat PostgREST dengan akun uji.

Repositori tetap punya fallback agregat di `curriculumRepository.listSubjects` bila view
ditolak (misalnya database baru yang belum menjalankan migration terbaru); fallback tidak
aktif pada project saat ini. Test rute E2E menuntut minimal satu `.subject-card` tampil di
`/learn`, dan error konsol apa pun menggagalkan test, supaya katalog kosong atau 403 tidak
lolos hanya karena shell halaman berhasil dimuat.

## Cakupan `npm run test:sql`

`scripts/test-sql.mjs` membuat database PostgreSQL in-memory, lalu:

1. Menjalankan kelima belas migration berurutan, termasuk `question_scenes`,
   `practice_engine`, `friends_quest`, `progression_economy`, `tahap5_rewards`,
   `mastery_review_rewards`, `subject_overview_owner`, `social_league`, dan
   `developer_dashboard`.
2. Memeriksa 8 mapel aktif, 57 lesson, 231 soal, 12 tipe soal, 19 pasangan matching,
   3 media gambar, dan 7 jenis node.
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
38. Reward level: XP melewati ambang level memberi Koin sekali, `get_my_wallet` memuat
    katalog hadiah level, dan transaksi `level_reward` tidak dibuat dua kali.
39. Milestone Streak: hari ke-3/7 memberi hadiah sesuai katalog dan transaksi masing-masing;
    penggunaan Perisai Streak menambah `freezes` lalu menghabiskan item.
40. Quest dan achievement: 3 harian + 3 mingguan muncul, progres dihitung dari ledger XP,
    klaim memberi Koin tepat sekali, dan achievement pertama terbuka otomatis.
41. Toko dan inventory: katalog membaca harga server, pembelian memotong Koin dan menambah
    quantity, item tidak dimiliki ditolak, Ramuan Hati memulihkan Hearts, dan pemain tidak
    dapat mengubah `user_inventory` langsung.
42. Sosial: pencarian menolak query pendek, permintaan/terima/hapus teman bekerja dua arah,
    statistik mengikuti `private`/`friends`/`public`, leaderboard global/teman memakai XP
    mingguan, dan pemain tidak dapat menulis `friendships`/`notifications` langsung.
43. Liga dan event: grup mingguan dibuat per tier, promosi/degradasi dihitung saat
    finalisasi, hadiah `10 + tier × 5` Koin dibayar sekali, event 100 XP → 25 Koin klaim
    idempoten, notifikasi hasil liga/pertemanan terbentuk, dan RLS hanya membuka baris
    sendiri. Seed XP minggu lalu ditulis ke ledger agar peringkat deterministik setelah
    `finalize_league_group` menghitung ulang XP dari sumber kebenaran.
44. Developer: overview berisi total pemain/aktivitas/konten; pencarian menemukan pemain
    lewat email; grant 7 Koin + 13 XP menulis wallet/ledger/audit; broadcast membuat
    notifikasi pemain onboarded; pemain biasa tidak dapat membaca overview, grant, broadcast,
    atau audit; insert audit langsung dan helper `log_audit` ditolak; reward kosong/negatif
    dan tautan eksternal ditolak.

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
- `tests/rewards.test.ts` — parsing quest, achievement, katalog toko, inventory, klaim,
  pembelian, dan efek item; clamp progres/quantity serta fallback payload rusak.

## Yang belum dapat diuji

- Registrasi lewat form UI dan onboarding belum diuji penuh di browser; konfirmasi email
  dan reset password sudah diuji memakai tautan resmi Supabase. Login API sudah diuji.
- RLS Practice Hub dan `question_pairs` sudah diuji lewat PostgREST; RLS tabel lain baru
  diuji di PGlite.
- Gameplay dan Practice Hub belum diuji di browser dengan sesi nyata; RPC sudah diuji
  di database.
- E2E browser mencakup rute utama, alur lesson dan latihan, simpan profil/pengaturan,
  konfirmasi email, reset password, Friends Quest dua akun, overflow ponsel, reduced
  motion, peta, maskot, dan penjadwalan audio. Audio belum diuji dengan telinga, belum
  ada pembaca layar sungguhan, dan belum ada audit performa.
- Pembelian toko, klaim quest/achievement, mastery/review, dan 20 mekanik mini-game belum
  dijelajahi satu per satu di browser; alur server-nya sudah diuji lewat SQL dan API.
- Konfirmasi pendaftaran lewat email belum diuji karena butuh kotak surat uji; alur reset
  password sudah diuji memakai tautan resmi dari Admin API, bukan email.
- Audio memakai text-to-speech browser; belum ada pengujian suara nyata di perangkat.
- Speaking belum diuji dengan mikrofon sungguhan; Web Speech Recognition berbeda tiap
  browser.
- Friends Quest, alur sosial/liga, dan Developer Dashboard sudah diuji lewat PGlite, API
  Supabase, dan E2E akun sementara. **Uji dengan akun pemilik di-skip** (disepakati 11
  November 2026) karena password tidak tersedia; isi `E2E_FRIEND_*` bila ingin memakai
  akun nyata.
- Broadcast valid tidak dikirim dari E2E agar pemain asli tidak menerima notifikasi uji;
  hanya validasi API dan pengiriman di PGlite yang diuji. Dashboard belum ditinjau pembaca
  layar atau viewport 390px.
- Halaman sosial belum diuji dengan pembaca layar atau pada data liga yang benar-benar
  berisi 30 pemain; promosi/degradasi penuh diuji di PGlite.
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

### Teman, liga, event, dan privasi

- [ ] Cari pemain dengan username/nama; hasil kosong menampilkan pesan jelas.
- [ ] Kirim permintaan; penerima melihat notifikasi dan daftar permintaan masuk.
- [ ] Terima/tolak permintaan; pengirim mendapat notifikasi hanya saat diterima.
- [ ] Hapus teman; kedua pihak kehilangan akses statistik teman.
- [ ] `/leaderboard` menampilkan tier, peringkat, zona promosi/degradasi, dan event.
- [ ] Tab Global/Teman memuat papan yang sesuai; baris pemain sendiri ditandai.
- [ ] Klaim hadiah liga/event sekali; klik kedua menampilkan “sudah diklaim”.
- [ ] `/notifications` menampilkan notifikasi, tandai satu/semua dibaca, dan jumlah
      belum dibaca kembali nol setelah reload.
- [ ] Profil `private` menyembunyikan statistik dari semua pemain lain; `friends` hanya
      untuk teman; `public` untuk semua.
- [ ] `/players/:username` tidak bocor email dan menampilkan aksi sesuai relasi.

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

### Misi, achievement, dan toko

- [ ] `/quests` menampilkan 3 misi harian + 3 mingguan dan progres dari server.
- [ ] Klaim misi menambah Koin sekali; refresh tidak menggandakan hadiah.
- [ ] Achievement terbuka otomatis dan tidak memberi Koin.
- [ ] `/shop` menampilkan dua item, saldo Koin, dan quantity tas.
- [ ] Membeli Ramuan Hati memotong 80 Koin; memakainya memulihkan Hearts.
- [ ] Membeli Perisai Streak memotong 120 Koin; penggunaan dibatasi maksimal 2.
- [ ] Tombol beli/pakai nonaktif saat Koin, stok, atau item tidak mencukupi.

### Mastery, review, dan node hadiah

- [ ] `/mastery` menampilkan ringkasan dan kartu per mapel dari `get_my_mastery`.
- [ ] Jawaban benar menaikkan mastery dan memperpanjang interval review.
- [ ] Jawaban salah menjadwalkan soal kembali sekitar 10 menit kemudian.
- [ ] Tombol review nonaktif saat belum ada soal jatuh tempo; sesi review hanya berisi soal
      yang jatuh tempo.
- [ ] Node hadiah terkunci menampilkan sisa lesson yang harus diselesaikan.
- [ ] Klaim node hadiah menambah Koin/XP sekali; klik kedua menampilkan “sudah diklaim”.
- [ ] Saldo wallet dan riwayat Koin/XP cocok dengan hadiah yang diklaim.

### Developer Dashboard

- [ ] Staff melihat menu Developer dan ikon topbar; pemain biasa tidak melihatnya.
- [ ] `/developer` menampilkan enam metrik dan tidak error untuk akun staff.
- [ ] Pencarian email/username/nama mengembalikan maksimal 25 pemain.
- [ ] Grant 0/0, alasan terlalu pendek, atau angka melebihi batas ditolak dengan pesan jelas.
- [ ] Grant valid menambah Koin/XP satu akun dan muncul di wallet + audit log.
- [ ] Broadcast menolak tautan eksternal; pengiriman valid hanya ke maksimal 500 pemain
      onboarded dan tidak memberi Koin/XP.
- [ ] Pemain biasa yang membuka `/developer` dialihkan ke `/app`.
- [ ] Audit log tidak memiliki tombol edit/hapus dan tidak dapat dibaca pemain biasa.

### RLS

- [ ] Akun A tidak dapat `select` settings/attempt/wallet/Hearts/Streak milik B.
- [ ] Akun A tidak dapat `update` profil B meski tahu UUID B.
- [ ] Akun A tidak dapat menulis `user_roles`, `user_wallets`, `user_question_mastery`,
      atau `user_reward_claims`.
- [ ] `complete_lesson_attempt` milik pengguna lain ditolak.
- [ ] `user_reward_claims` akun B tidak terbaca dari akun A.

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

## Smoke test browser (Playwright)

`npm run test:e2e` menjalankan seluruh `tests/e2e/*.spec.ts` memakai Chrome yang terpasang
(channel `chrome`) dan dev server Vite di port 4173.

- Test landing selalu berjalan: kanvas maskot harus tampil, bisa diklik, dan tidak
  menghasilkan error Phaser/audio.
- Test peta membutuhkan `E2E_EMAIL` dan `E2E_PASSWORD`. Skrip memuat `.env` lewat
  `node --env-file=.env`, sehingga kredensial tidak pernah ditulis di test.
- Bila akun uji ditolak Supabase atau belum menyelesaikan onboarding, test peta
  **di-skip dengan alasan**, bukan dianggap lulus.
