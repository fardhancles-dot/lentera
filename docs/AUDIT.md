# Audit Proyek — 9 November 2026

Laporan ini dibuat dengan membaca kode aktual, bukan hanya nama file atau catatan lama.
Semua angka diambil dari migration seed dan eksekusi test pada tanggal tersebut.

> **Pembaruan sesi 5:** lima mini-game prioritas sudah dibangun dengan soal nyata:
> Word Bank, Sentence Builder, Matching Pairs, Fill in the Blank, dan Picture
> Identification. Angka terkini: 57 lesson, 217 soal, 645 opsi, 62 jawaban isian,
> 4 pasangan matching, 3 media gambar, 7 tipe soal, 6 jenis node playable. Node `reward`
> tetap menunggu Tahap 5.

## Metode dan bukti eksekusi

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| TypeScript strict | `npm run typecheck` | Lulus, 0 error. |
| Unit test | `npm test` | 30 test lulus (2 file). |
| Migration + RPC + RLS | `npm run test:sql` | 68 smoke check lulus di PGlite. |
| Build produksi | `npm run build` | Lulus; Phaser tetap chunk terpisah. |
| Supabase nyata | — | **Belum diuji**; kredensial belum tersedia. |
| Git | `git status` | Folder ini bukan repository Git, jadi tidak ada riwayat untuk diperiksa. |

PGlite adalah PostgreSQL yang berjalan di Node. Hasilnya membuktikan SQL, RPC, dan policy
konsisten secara logika, tetapi **bukan** bukti bahwa migration sudah diterapkan ke project
Supabase milik pemilik produk.

## Status 8 prioritas

| # | Prioritas | Status nyata |
| --- | --- | --- |
| 1 | Fondasi HTML5, Phaser, TypeScript, Supabase | **Selesai** (kecuali kredensial Supabase belum diisi). |
| 2 | Registrasi, login, profil, penyimpanan progres | **Selesai di kode**; penyimpanan progres menyusul di Tahap 3 dan sudah ada. Belum E2E. |
| 3 | Mapel, level, unit, learning path, bank soal | **Inti selesai**; 6 dari 7 jenis node dan 3 dari 6 tingkat kesulitan terisi. |
| 4 | Gameplay dan 20 mini-game | **Sebagian**: lesson engine + 7 tipe soal dapat dimainkan, termasuk 5 mini-game prioritas. 13 mini-game belum. |
| 5 | XP, Koin, Hearts, Streak, reward | **Fondasi XP/Koin selesai** (ledger, wallet, reward idempoten). Hearts, streak, level akun, quest belum. |
| 6 | Karakter, animasi, audio, adventure map | **Sebagian**: maskot Kiko vector + animasi dasar; peta berbasis DOM, bukan Phaser; audio belum. |
| 7 | Leaderboard, teman, Quest, sosial | **Belum dikerjakan.** |
| 8 | Developer Dashboard dan administrasi | **Belum dikerjakan.** Role `developer` dan mode pratinjau sudah disiapkan. |

---

## A. Sudah selesai (berfungsi dan terverifikasi)

### A1. Fondasi (Prioritas 1)

- Vite 8 + TypeScript strict + Phaser 4.2.1 + Supabase JS.
- Design system: token warna, tipografi Nunito, tombol, kartu, field, badge, progress,
  dialog, toast, empty/error state.
- Layout responsif: sidebar desktop, topbar, bottom nav mobile, split layout auth.
- Router history API dengan guard `public`/`guest`/`authenticated`/`onboarded`, lazy page,
  pembatalan render, cleanup, intercept link internal, halaman 404 dan error.
- Branding terpusat di `src/config/brand.ts` + favicon orisinal.
- Maskot Kiko digambar vector dengan Phaser (idle, blink, wave, celebrate) dan dimuat lazy.
- Ikon SVG orisinal, tanpa emoji.

### A2. Akun dan profil (Prioritas 2)

- Halaman: landing, login, register, lupa password, reset password, onboarding, beranda,
  profil, pengaturan, setup, 404, error.
- Register: validasi, konfirmasi password, meter kekuatan, state verifikasi email.
- Login: pesan error Bahasa Indonesia, dukungan `?next=`, deteksi tautan kedaluwarsa.
- Reset password: deteksi sesi recovery dan tautan tidak valid.
- Onboarding 3 langkah lewat RPC atomik.
- Profil dan pengaturan tersimpan di PostgreSQL, bukan hanya browser.
- Session store: deduplikasi load, sinkronisasi event auth, recovery mode.
- Database identity: `profiles`, `user_roles`, `user_settings`, trigger `handle_new_user`,
  RPC `complete_onboarding`, bootstrap developer, RLS + column-level grants.

### A3. Kurikulum, learning path, dan bank soal (Prioritas 3)

Migration:

- `20261108100000_curriculum.sql` — struktur kurikulum + bank soal + view statistik.
- `20261108105000_curriculum_overview.sql` — view `subject_overview`.
- `20261108107000_question_pairs.sql` — pasangan kiri/kanan untuk matching, tanpa grant.
- `20261108110000_curriculum_seed.sql` — seed generated, idempoten (UUID deterministik).
- `20261108120000_lesson_engine.sql` — attempt, grading, reward, progres.

Isi seed yang benar-benar tersimpan:

| Mata pelajaran | Status | Level | Lesson | Soal |
| --- | --- | --- | --- | --- |
| Pemrograman Web | aktif | 3 | 8 | 30 |
| Basis Data | aktif | 3 | 8 | 30 |
| PPB — Flutter & Dart | aktif | 3 | 8 | 30 |
| Bahasa Inggris | aktif | 3 | 8 | 37 |
| Bahasa Indonesia | aktif | 3 | 8 | 30 |
| Pendidikan Pancasila (PPK) | aktif | 3 | 8 | 30 |
| Matematika | aktif | 3 | 8 | 30 |
| Bahasa Sambas | aktif, bank soal kosong | 1 | 1 | 0 |
| Bahasa Jawa | development | 0 | 0 | 0 |
| Bahasa Sunda | development | 0 | 0 | 0 |

Total: 22 level, 22 unit, 57 lesson, 217 soal, 645 opsi, 62 jawaban isian, 4 pasangan
matching, 3 media gambar. Komposisi tipe soal: 155 pilihan ganda, 45 melengkapi rumpang,
11 mengetik, 1 word bank, 1 sentence builder, 1 matching pairs, 3 picture identification.
Node: 22 `lesson`, 7 `review`, 7 `challenge`, 7 `practice`, 7 `checkpoint`,
7 `legendary`.

Yang berfungsi di UI:

- `/learn` — katalog mapel dengan jumlah level/lesson/soal dan progres per mapel.
- Modal "Fitur bahasa daerah ini sedang dikembangkan oleh developer." untuk Jawa/Sunda.
- `/learn/:subject` — learning path per level dan unit, status selesai/aktif/terkunci,
  pratinjau developer, progres unit dan course.
- `/learn/:subject/lesson/:slug` — detail lesson, topik, jenis soal, tujuan unit, tombol mulai.
- `/learn/:subject/lesson/:slug/play` — layar lesson, progress bar, hint, feedback,
  penjelasan, jawaban benar, halaman hasil.
- Generator seed tervalidasi (`npm run seed:build`) menolak soal tanpa jawaban benar,
  opsi ganda benar, slug duplikat, dan mapel aktif tanpa level.

### A4. Lesson engine dan reward dasar (Prioritas 4–5, sebagian)

RPC `security definer`:

- `start_lesson(node_id)` — memeriksa akses, urutan unlock, membuat attempt unik, dan
  mengembalikan soal **tanpa** `is_correct` atau kunci jawaban.
- `submit_attempt_answer(attempt, question, answer)` — menilai di server, menyimpan sekali
  per soal, mengembalikan penjelasan dan jawaban benar untuk feedback.
- `complete_lesson_attempt(attempt)` — menghitung akurasi, menyimpan progres node/course,
  memberi XP dan Koin **tepat satu kali**, dilindungi advisory lock dan unique ledger.

Progres per mata pelajaran terpisah lewat `user_course_progress` (per course) dan
`user_node_progress` (per node). Replay lesson yang sudah selesai tidak menambah XP.
RLS menyembunyikan attempt dan wallet pemain lain; pemain tidak bisa mengubah wallet.

---

## B. Sedang dikerjakan (implementasi sudah dimulai, belum selesai)

1. **Gameplay per tipe soal.** Tujuh tipe punya layar: pilihan ganda, input teks,
   word bank, sentence builder, matching pairs, fill blank inline, dan picture
   identification. Tipe tanpa renderer kini jatuh ke layar `unsupported` dengan tombol
   lewati, bukan input teks yang menyamar sebagai mekanik lain. Tiga belas mini-game lain
   belum dibangun.
2. **Jenis node learning path.** Sudah 6 dari 7: `lesson`, `review`, `challenge`,
   `practice`, `checkpoint`, `legendary`. `reward` masih menunggu Tahap 5.
3. **Level kesulitan materi.** Baru `beginner`, `elementary`, `intermediate`.
   `upper_intermediate`, `advanced`, `expert` belum punya konten.
4. **Pemilihan course/unit.** Belum ada halaman terpisah; semuanya digabung di peta belajar
   dan service memakai `courses[0]`. Subject dengan lebih dari satu course belum didukung.
5. **Pemilihan bahasa daerah.** Belum ada halaman khusus; pilihan tampil di katalog mapel
   dan modal pengembangan. Fungsinya ada, bentuk halamannya belum.
6. **Riwayat percobaan.** Data `lesson_attempts` dan `answer_attempts` tersimpan dan dapat
   dibaca pemiliknya, tetapi belum ada UI riwayat/skor terbaik per lesson.
7. **Dokumentasi.** README, DATABASE, GAMEPLAY, TESTING, dan ARCHITECTURE masih menyatakan
   proyek berhenti di Tahap 1–2. Sudah diperbaiki pada sesi audit ini.

---

## C. Belum dikerjakan

### Prioritas 3 — sisa

- Node `reward` beserta mekanisme hadiahnya (menunggu sistem reward Tahap 5).
- Konten tingkat `upper_intermediate`, `advanced`, `expert`.
- Halaman pemilihan course/unit dan pemilihan bahasa daerah sebagai halaman sendiri.
- Dukungan lebih dari satu course per mata pelajaran.

### Prioritas 4 — mini-game

13 mini-game belum ada: Listening, Speaking, Translation (masih fallback input teks),
Conversation bercabang, Story Mode, Match Madness, Ramp Up, Timed Challenge, Mistakes
Review, Personalized Practice, Unit Review, Legendary Challenge, Friends Quest.
(Lima prioritas — Word Bank, Sentence Builder, Matching Pairs, Fill in the Blank, Picture
Identification — sudah selesai; pilihan ganda dan input teks sudah ada sebelumnya.)

### Prioritas 5 — ekonomi dan retensi

- Player level, kurva XP, level up, reward level.
- Hearts: saldo, pengurangan, pemulihan, timer, refill.
- Streak: kalender, milestone, freeze, repair, pengingat, zona waktu.
- Wallet UI, riwayat transaksi, saldo Koin yang terlihat.
- Crown/mastery, spaced repetition, error tracking.
- Daily/weekly/monthly quest, Friends Quest, reward claim, achievement.
- Shop, inventory, item kosmetik.

### Prioritas 6 — karakter dan presentasi

- Sprite sheet/animasi 13 gerakan karakter yang benar-benar terhubung.
- Adventure map berbasis Phaser; saat ini peta DOM yang rapi tetapi bukan scene game.
- NPC, dialog bercabang, story scene, conversation.
- Audio: musik, SFX, voice, pengaturan volume, replay/slow audio.
- Efek partikel, confetti, floating XP, screen shake, reduced motion untuk gameplay.
- Aset karakter/ilustrasi produksi; saat ini vector prosedural.

### Prioritas 7 — sosial dan kompetisi

- Leaderboard, 10 liga, grup liga, promosi/degradasi, reward periode.
- Friends, friend request, friend streak, activity feed, privasi.
- Profil publik terbatas dan statistik lanjutan.
- Event dan notifikasi.

### Prioritas 8 — developer

- Developer Dashboard dan seluruh CRUD konten (mapel, course, level, unit, lesson, soal,
  media, Bahasa Sambas).
- Reward Center (satu akun dan broadcast), inbox pemain, claim reward, audit log.
- Pengelolaan quest, achievement, shop, event, konfigurasi game.
- Edge Functions untuk operasi istimewa.

### Lintas tahap

- PWA/offline, Supabase Storage/Realtime/Edge Functions.
- AI provider abstraction dan fitur AI.
- Premium/entitlement/pembayaran (belum ada provider).
- Playwright/E2E, pengujian responsif otomatis, audit performa.
- Deployment Vercel dan penerapan migration ke Supabase nyata.

---

## D. Perlu diperbaiki

| # | Temuan | Dampak | Tindakan |
| --- | --- | --- | --- |
| 1 | Banner `/learn` menulis "105 soal awal" padahal saat audit database punya 147 soal dan 36 lesson. | Klaim tidak akurat. | Diganti angka dinamis dari query. |
| 2 | Peta pembangunan di beranda menulis "22 lesson, 105 soal" dan menandai Tahap 3 selesai, Tahap 4 "berikutnya". | Menyesatkan; gameplay sudah dapat dimainkan. | Roadmap diperbarui. |
| 3 | README/GAMEPLAY/TESTING/DATABASE/ARCHITECTURE menyatakan belum ada kurikulum dan lesson. | Melanggar aturan "jangan klaim palsu" dan menyesatkan sesi berikutnya. | Diperbarui pada sesi ini. |
| 4 | Tipe soal yang belum punya layar kini jatuh ke layar `unsupported`, bukan input teks. | Pemain tidak bisa mengira mekanik yang salah sebagai fitur jadi. | Layar jujur + tombol lewati; renderer baru didaftarkan di `src/game/minigames/index.ts`. |
| 5 | `subject_overview` menghasilkan satu baris per course; katalog memakai `courses[0]`. | Mapel dengan >1 course akan tampil ganda / course lain tak terjangkau. | Perlu redesign katalog saat course ganda ditambahkan. |
| 6 | Riwayat attempt belum ditampilkan. | Data ada tetapi tidak berguna bagi pemain. | Tambahkan di Tahap 5 (statistik). |
| 7 | `buildPathNode` punya format indentasi rusak (bukan bug perilaku). | Keterbacaan. | Dirapikan saat menyentuh file tersebut. |
| 8 | Migration belum diterapkan ke Supabase nyata. | Auth, RLS, dan gameplay belum diuji end-to-end. | Butuh kredensial; lihat SETUP.md. |
| 9 | Folder bukan repository Git. | Tidak ada riwayat perubahan/rollback. | Inisialisasi Git sebelum perubahan besar berikutnya. |

---

## E. Kondisi Tahap 3 secara rinci

Checklist persyaratan Tahap 3 (mata pelajaran, kategori, regional language, Bahasa Sambas,
course, level, unit, lesson, learning path, unlock system):

| Item | Status | Catatan |
| --- | --- | --- |
| Tabel mapel/course/level/unit/lesson/node/soal | Selesai | Tabel kurikulum + opsi/jawaban/media/pairs/progres. |
| 7 mata pelajaran inti aktif | Selesai | Semua punya konten dan soal. |
| Mata pelajaran tambahan relevan | Sebagian | Hanya 7 inti; Informatika, Algoritma, PBO, Sistem Komputer, Jaringan, IPAS, Literasi Digital, UI/UX belum. |
| Kategori mapel | Selesai | `teknologi`, `bahasa`, `sosial`, `sains`, `bahasa-daerah`. |
| Bahasa Sambas aktif dan terstruktur | Selesai | Level/unit/lesson ada; bank soal 0 dan memang harus diisi pemilik. |
| Jawa/Sunda development + modal | Selesai | Tidak membuka gameplay. |
| Status mapel dari database | Selesai | Enum `active/development/inactive`; admin belum ada. |
| Course, level, unit, lesson | Selesai | Relasi FK, unique slug per parent, index, published flag. |
| Learning path + status node | Selesai (6 jenis node) | Selesai/aktif/terkunci, progres unit & course. |
| 7 jenis node wajib | Sebagian | 6 jenis terisi; hanya `reward` yang belum. |
| Unlock berurutan | Selesai | Ditegakkan lagi di server saat `start_lesson`. |
| Bank soal awal tiap level | Selesai | 30 soal per mapel inti, 3 level; practice/checkpoint/legendary masing-masing 3 soal. |
| Soal punya kunci, penjelasan, hint, bobot, tipe | Selesai | Seed divalidasi; kunci tidak dikirim ke browser. |
| Bahasa Sambas tidak di-auto-generate | Selesai | Lesson kosong, ada peringatan validasi. |
| Progres terpisah per mapel | Selesai | Course progress + node progress + attempt history. |
| Riwayat percobaan | Data selesai, UI belum | Tabel dan RLS siap. |
| 6 tingkat kesulitan terisi | Sebagian | 3 tingkat; 3 tingkat lanjutan belum. |

Kesimpulan Tahap 3: **struktur dan alur inti selesai dan dapat dimainkan**, tetapi belum
100% terhadap spesifikasi. Sisa yang harus ditutup sebelum menyebut Tahap 3 tuntas:
node `reward`, konten tingkat lanjutan, halaman pemilihan course/unit/bahasa daerah, dan
dukungan multi-course.

---

## F. Rencana melanjutkan (urutan yang disarankan)

1. **Tutup Tahap 3**
   - Tambah konten `upper_intermediate`/`advanced` untuk minimal satu mapel inti lebih dulu.
   - Tambah halaman pemilihan course/unit dan halaman bahasa daerah.
   - Tambah UI riwayat attempt dan skor terbaik per lesson.
   - Node `reward` menunggu sistem reward Tahap 5 agar tidak menjadi tombol mati.
2. **Tahap 4** — lanjutkan 13 mini-game tersisa (Listening, Speaking, Translation,
   Conversation, Story Mode, Match Madness, Ramp Up, Timed Challenge, Mistakes Review,
   Personalized Practice, Unit Review, Legendary Challenge, Friends Quest). Registry dan
   lima prioritas sudah selesai; tambahkan renderer + konten nyata per mekanik.
3. **Tahap 5** — Hearts, streak, player level, wallet UI, mastery, quest, achievement,
   shop, inventory. Semua penulisan lewat RPC dengan idempotensi.
4. **Tahap 6** — sprite/animasi karakter, adventure map Phaser, audio, efek.
5. **Tahap 7** — leaderboard, liga, teman, activity feed, event.
6. **Tahap 8** — Developer Dashboard, content management, Reward Center, inbox, audit log.
7. **QA** — Playwright, Supabase nyata, responsif, performa, deploy Vercel.

Aturan kerja yang dipertahankan: jangan menulis ulang fondasi, jangan mengganti stack,
jangan menghapus progres, dan jangan menyatakan fitur selesai tanpa bukti eksekusi.
