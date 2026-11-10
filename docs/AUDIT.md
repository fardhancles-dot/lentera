# Audit Proyek — 9 November 2026

Laporan ini dibuat dengan membaca kode aktual, bukan hanya nama file atau catatan lama.
Semua angka diambil dari migration seed dan eksekusi test pada tanggal tersebut.

> **Catatan status (10 November 2026):** laporan ini adalah snapshot sebelum Tahap 4
> ditutup. Untuk status final Tahap 4, bukti pengujian, dan batasan terbaru, lihat
> **[STAGE4_COMPLETION.md](STAGE4_COMPLETION.md)**. Tahap 5 (Hearts, Streak, level, wallet)
> sudah ditambahkan setelah snapshot ini; lihat bagian Sesi 9 di
> **[PROJECT_HISTORY.md](PROJECT_HISTORY.md)** dan ringkasan di README/DATABASE.

> **Pembaruan sesi 6 — Tahap 4 hampir tuntas:** 19 dari 20 mini-game punya mekanik nyata.
> Lima tipe soal baru ditambahkan (Listening, Speaking, Translation, Conversation, Story)
> beserta scene dialog di database, dan tujuh mode latihan berjalan lewat sesi server
> (`Match Madness`, `Ramp Up`, `Timed Challenge`, `Mistakes Review`, `Personalized Practice`,
> `Unit Review`, `Legendary Challenge`). Seed kini 225 soal dan 12 tipe soal. Hanya
> **Friends Quest** yang belum dibuat karena bergantung pada graf teman Tahap 7.
>
> **Pembaruan sesi 5 (historis):** lima mini-game prioritas dibangun dengan soal nyata:
> Word Bank, Sentence Builder, Matching Pairs, Fill in the Blank, dan Picture
> Identification. Angka saat itu: 57 lesson, 217 soal, 645 opsi, 62 jawaban isian,
> 4 pasangan matching, 3 media gambar, 7 tipe soal, 6 jenis node playable. Node `reward`
> tetap menunggu Tahap 5. Angka terbaru ada di bagian G.

## Metode dan bukti eksekusi

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| TypeScript strict | `npm run typecheck` | Lulus, 0 error. |
| Unit test | `npm test` | 34 test lulus (3 file). |
| Migration + RPC + RLS + practice | `npm run test:sql` | 106 smoke check lulus di PGlite. |
| Build produksi | `npm run build` | Lulus; Phaser tetap chunk terpisah. |
| Supabase nyata | `npm run verify:supabase` | **29 check lulus** (login, lesson 20 soal, 12 tipe, Practice Hub, RLS) di project `xvrnmxbrxhtzzavmrlvy`. |
| Git | `git status` | Repository Git lokal sudah ada; riwayat singkat dan commit masih lokal. |

PGlite adalah PostgreSQL yang berjalan di Node. Hasilnya membuktikan SQL, RPC, dan policy
konsisten secara logika. Sejak 9 November 2026 seluruh 8 migration juga sudah diterapkan ke
project Supabase nyata (`xvrnmxbrxhtzzavmrlvy`), dan verifikasi API lulus. Pengujian UI di
browser masih terpisah.

## Status 8 prioritas

| # | Prioritas | Status nyata |
| --- | --- | --- |
| 1 | Fondasi HTML5, Phaser, TypeScript, Supabase | **Selesai** (kecuali kredensial Supabase belum diisi). |
| 2 | Registrasi, login, profil, penyimpanan progres | **Selesai dan diuji**; konfirmasi email, reset password, profil, dan pengaturan punya E2E. |
| 3 | Mapel, level, unit, learning path, bank soal | **Inti selesai**; 6 dari 7 jenis node dan 3 dari 6 tingkat kesulitan terisi. |
| 4 | Gameplay dan 20 mini-game | **Selesai**: 12 tipe soal + 7 mode latihan + Friends Quest; dinilai di server. |
| 5 | XP, Koin, Hearts, Streak, reward | **Selesai**: ledger, wallet, Hearts, Streak, level, quest, achievement, toko, mastery, dan node hadiah. |
| 6 | Karakter, animasi, audio, adventure map | **Selesai**: Kiko 13 state, peta Phaser responsif, audio sintetis, dan pipeline aset. |
| 7 | Leaderboard, teman, Quest, sosial | **Selesai**: pertemanan, notifikasi, liga, leaderboard, event, dan privasi profil. |
| 8 | Developer Dashboard dan administrasi | **Dashboard selesai dan diuji**: overview, pencarian, Reward Center, broadcast, audit log. CRUD konten/editor Bahasa Sambas belum. |

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
| Bahasa Inggris | aktif | 3 | 8 | 45 |
| Bahasa Indonesia | aktif | 3 | 8 | 30 |
| Pendidikan Pancasila (PPK) | aktif | 3 | 8 | 30 |
| Matematika | aktif | 3 | 8 | 30 |
| Bahasa Sambas | aktif, bank soal kosong | 1 | 1 | 0 |
| Bahasa Jawa | development | 0 | 0 | 0 |
| Bahasa Sunda | development | 0 | 0 | 0 |

Total: 22 level, 22 unit, 57 lesson, 225 soal, 669 opsi, 65 jawaban isian, 15 pasangan
matching, 3 media gambar. Komposisi tipe soal: 155 pilihan ganda, 45 melengkapi rumpang,
11 mengetik, 3 matching pairs, 3 picture identification, 2 listening, 1 speaking,
1 translation, 1 conversation, 1 story, 1 word bank, 1 sentence builder.
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

1. **Gameplay per tipe soal.** Kedua belas tipe pada enum `question_type` punya layar:
   pilihan ganda, input teks, word bank, sentence builder, matching pairs, fill blank
   inline, picture identification, listening, speaking, translation, conversation, dan
   story. Layar `unsupported` tetap tersedia sebagai jaring pengaman jika data soal tidak
   valid, bukan sebagai mekanik palsu. Mode latihan berwaktu berada di halaman terpisah.
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

Satu mini-game belum ada: **Friends Quest**. Fitur ini membutuhkan graf pertemanan,
undangan, dan quest bersama yang baru masuk Tahap 7; membuatnya sekarang akan menjadi
tombol mati atau data palsu. Sembilan belas mini-game lain sudah punya mekanik nyata:
seluruh tipe soal (termasuk Listening, Speaking, Translation, Conversation, Story) dan
tujuh mode latihan (Match Madness, Ramp Up, Timed Challenge, Mistakes Review, Personalized
Practice, Unit Review, Legendary Challenge).

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

- **Sudah**: Developer Dashboard, pencarian pemain, Reward Center satu akun, broadcast
  notifikasi maksimal 500 penerima, dan audit log append-only.
- **Belum**: CRUD konten (mapel, course, level, unit, lesson, soal, media, Bahasa Sambas),
  inbox admin, pengelolaan quest/achievement/shop/event, dan konfigurasi game.
- **Belum**: Edge Functions untuk rate limit/antrean operasi istimewa.

### Lintas tahap

- PWA/offline, Supabase Storage/Realtime/Edge Functions.
- AI provider abstraction dan fitur AI.
- Premium/entitlement/pembayaran (belum ada provider).
- Playwright/E2E, pengujian responsif otomatis, audit performa.
- Deployment Vercel dan pengujian browser E2E.

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
| 8 | Migration dan E2E API Supabase sudah dijalankan; browser E2E belum. | UI belum diuji dengan sesi nyata. | Tambahkan Playwright pada QA akhir. |
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
2. **Tahap 4** — selesai kecuali Friends Quest. Sisa pekerjaan: uji browser/Supabase
   nyata, sebarkan konten tipe baru ke mapel lain, dan perdalam Conversation menjadi
   dialog bercabang. Friends Quest menunggu Tahap 7 (graf teman + quest bersama).
3. **Tahap 5** — Hearts, streak, player level, wallet UI, mastery, quest, achievement,
   shop, inventory. Semua penulisan lewat RPC dengan idempotensi.
4. **Tahap 6** — sprite/animasi karakter, adventure map Phaser, audio, efek.
5. **Tahap 7** — leaderboard, liga, teman, activity feed, event.
6. **Tahap 8** — selesai untuk Developer Dashboard, Reward Center, broadcast, dan audit
   log. Content management, inbox admin, dan konfigurasi game masih tersisa.
7. **QA** — Playwright/browser E2E, responsif, performa, deploy Vercel.

Aturan kerja yang dipertahankan: jangan menulis ulang fondasi, jangan mengganti stack,
jangan menghapus progres, dan jangan menyatakan fitur selesai tanpa bukti eksekusi.

---

## G. Status Tahap 4 secara rinci (sesi 6)

Legenda: **COMPLETED** sudah berfungsi dan diuji, **IN PROGRESS** sebagian, **NOT
STARTED** belum, **NEEDS FIX** ada tetapi bermasalah.

| Pekerjaan Tahap 4 | Status | Bukti / catatan |
| --- | --- | --- |
| Database soal, kunci, opsi, jawaban, media, pasangan | COMPLETED | 5 migration kurikulum + scene; 106 smoke check. |
| Question Engine & Answer Validator | COMPLETED | `grade_question` menilai opsi, teks, dan pasangan; kunci tidak dikirim. |
| Penjelasan, hint, poin, bobot | COMPLETED | Kolom database + feedback UI. |
| Bank soal semua mapel utama | COMPLETED | 225 soal; 7 mapel inti + Sambas (kosong sesuai keputusan pemilik). |
| Pengelolaan soal via Admin Panel | NOT STARTED | Tahap 8. Saat ini konten lewat seed tervalidasi. |
| Multiple Choice, Typing | COMPLETED | Sejak Tahap 3. |
| Word Bank, Sentence Builder, Matching Pairs, Fill in the Blank, Picture ID | COMPLETED | Sesi 5. |
| Listening Challenge | COMPLETED | Renderer + scene speech + TTS/media + grading opsi. |
| Speaking Challenge | COMPLETED | Web Speech Recognition, fallback menulis, tanpa skor palsu. |
| Translation Challenge | COMPLETED | Token + mode menulis; dinilai sebagai teks. |
| Conversation Challenge | IN PROGRESS | NPC, bubble, audio, pilihan respons dinilai; belum pohon cabang. |
| Story Mode | COMPLETED | Layar berurutan + audio + pertanyaan pemahaman. |
| Match Madness | COMPLETED | Sesi 90 detik, combo, poin kecepatan, server-authoritative. |
| Ramp Up | COMPLETED | 10 soal urut kesulitan, 20 detik per soal. |
| Timed Challenge | COMPLETED | Countdown total 120 detik, 10 soal. |
| Mistakes Review | COMPLETED | RPC memilih soal salah dari lesson + latihan. |
| Personalized Practice | COMPLETED | Topik sering salah, fallback soal belum dicoba. |
| Unit Review | COMPLETED | Unit chooser + maksimal 12 soal satu unit. |
| Legendary Challenge | COMPLETED | Soal legendary + XP hingga 30. |
| Friends Quest | NOT STARTED | Butuh teman/quest Tahap 7. |
| Practice Hub | COMPLETED | Route `/practice`, 7 mode, subject selector, unit chooser. |
| Sesi latihan server + anti-reward ganda | COMPLETED | Tabel sesi/jawaban + XP unik per sesi. |

### File utama Tahap 4

- Migration: `20261108109000_question_scenes.sql`, `20261109100000_practice_engine.sql`;
  `20261108120000_lesson_engine.sql` mengirim `scene` pada payload.
- Konten: `scripts/content/stage4.ts`, `types.ts`, `helpers.ts`, `index.ts`, generator,
  seed diregenerasi.
- Renderer: `listening.ts`, `speaking.ts`, `translation.ts`, `conversation.ts`, `story.ts`,
  `index.ts`, `src/game/audio/speech.ts`.
- Latihan: `practice.repository.ts`, `practice.service.ts`, `practice.page.ts`,
  `practice-play.page.ts`, `src/game/practice/scoring.ts`, `src/styles/practice.css`.
- Navigasi: route `/practice` dan `/practice/play`, item nav “Latihan”.
- Test: `scripts/test-sql.mjs` (106 check), `tests/practice.test.ts`.

### Bukti eksekusi sesi 6

| Perintah | Hasil |
| --- | --- |
| `npm run seed:build` | Lulus; 57 lesson, 225 soal; warning Sambas kosong disengaja. |
| `npm run test:sql` | 106 smoke check lulus. |
| `npm test` | 34 test lulus (3 file). |
| `npm run typecheck` | Lulus, 0 error. |
| `npm run build` | Lulus; Phaser tetap chunk terpisah. |

### Batasan yang belum ditutup

1. Browser E2E sudah ada dan lulus 14 test, tetapi broadcast massal valid belum dijalankan
   di browser agar pemain asli tidak menerima notifikasi uji.
2. Konten lima mekanik baru baru ada di satu lesson Bahasa Inggris.
3. Belum ada aset audio rekaman; model audio memakai TTS browser.
4. Conversation belum bercabang multi-langkah.
5. Admin Panel pengelolaan soal belum ada; CRUD konten belum termasuk Stage 8.
6. Rate limit, retensi audit, dan paginasi notifikasi belum ada.
