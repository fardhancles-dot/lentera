# Project History

Catatan ini adalah log pengembangan, bukan bukti bahwa fitur bekerja. Selalu cocokkan
dengan kode dan database aktual.

---

## Sesi 1 — 8 November 2026

**Fokus:** Prioritas #1 (fondasi) dan #2 (registrasi, login, profil, penyimpanan).

### Hasil

#### Fondasi

- Inisialisasi proyek Vite + TypeScript strict + Phaser 4.2.1 + Supabase JS.
- Design system: token warna, tipografi Nunito, tombol berkedalaman, kartu, field, badge,
  avatar, progress, switch, slider, toast, dialog, state kosong/error.
- Layout responsif: sidebar desktop, topbar, bottom nav mobile, split layout auth.
- Router history API dengan guard `public`/`guest`/`authenticated`/`onboarded`, lazy page,
  pembatalan render, cleanup, intercept link internal, dan halaman 404.
- Branding terpusat (`src/config/brand.ts`) + favicon orisinal.
- Maskot **Kiko** digambar vector di Phaser: idle, blink, wave, lantern sway, celebrate.
  Dimuat lazy sehingga Phaser tidak masuk bundle awal.
- Avatar pemain orisinal: Tunas, Bara, Ombak, Bintang, Beri.
- Ikon SVG orisinal (tanpa emoji).

#### Akun & profil

- Halaman: landing, login, register, lupa password, reset password, onboarding, beranda,
  profil, pengaturan, setup, 404, error.
- Register dengan validasi, konfirmasi password, meter kekuatan, state verifikasi email,
  kirim ulang verifikasi.
- Login dengan pesan error Bahasa Indonesia, dukungan `?next=`, deteksi tautan kedaluwarsa.
- Lupa password dengan pesan netral (anti-enumerasi akun).
- Reset password mendeteksi sesi recovery, menangani tautan tidak valid.
- Onboarding 3 langkah: avatar, username unik, nama, target harian, zona waktu.
- Profil: edit nama/username/avatar/bio dengan pembaruan langsung ke database dan store.
- Pengaturan: target harian, zona waktu, bahasa, volume musik/SFX/suara, reduced motion,
  opt-in email, kirim tautan ubah password, logout.
- Session store: deduplikasi pemuatan, sinkronisasi event auth, recovery mode, refresh
  setelah simpan.

#### Database

- Migration `20261108090000_identity.sql`:
  - tabel `profiles`, `user_roles`, `user_settings`;
  - enum `app_role`;
  - trigger `handle_new_user` (profil + settings + role otomatis);
  - trigger `updated_at`;
  - `current_user_role`, `has_role`, `is_staff`;
  - RPC `complete_onboarding` (atomik, security invoker);
  - `bootstrap_developer`, `promote_developer` (revoke dari API);
  - RLS + column-level grants.

#### Dokumentasi & konfigurasi

- README, ARCHITECTURE, DATABASE, SETUP, SECURITY, TESTING, GAME_DESIGN, GAMEPLAY,
  PROJECT_HISTORY.
- `.env.example`, `.gitignore`, `vercel.json` (rewrite SPA).

### Pengujian yang dijalankan

| Perintah | Hasil |
| --- | --- |
| `npx tsc --noEmit` | Lulus. |
| `npm run build` | Lulus; chunk Phaser terpisah ~1,37 MB. |
| `npm test` | 30 test lulus. |
| Chrome headless smoke | Landing + canvas Phaser; login/register tampil; `/app` tanpa sesi → `/setup`; route asing → 404. |

### Belum selesai / belum dapat diuji

- **Kredensial Supabase belum ada.** Migration belum dijalankan; auth, RLS, onboarding, dan
  penyimpanan profil belum diuji end-to-end.
- Belum ada kurikulum, lesson, bank soal, mini-game, XP, Koin, Hearts, streak, quest,
  leaderboard, toko, sosial, event, atau Developer Dashboard.
- Belum ada PWA, audio, sprite sheet karakter, Playwright, Edge Function.
- Email verifikasi masih memakai layanan bawaan Supabase (batas kirim).

### Konfigurasi yang masih dibutuhkan

1. `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
2. Jalankan migration identity.
3. Atur Auth redirect URLs (`localhost` dan domain produksi).
4. Bootstrap akun developer lewat SQL Editor.
5. Opsional: SMTP kustom, domain Vercel.

### Keputusan penting sesi ini

- Tanpa framework UI; DOM helper kecil dan eksplisit.
- Phaser 4.2.1, dimuat hanya untuk stage maskot.
- Router history + Vercel rewrite.
- Tipe row Supabase memakai `type`, bukan `interface`.
- Onboarding disimpan lewat RPC agar profil dan preferensi konsisten.
- Halaman publik dan guest tetap dapat dibuka tanpa Supabase, dengan peringatan; halaman
  privat dialihkan ke panduan setup.

### Langkah berikutnya

Sesuai prioritas pemilik proyek: **Tahap 3 — mata pelajaran, level, unit, learning path,
dan bank soal**, termasuk:

1. Migration kurikulum (subjects, courses, course_levels, units, learning_nodes, lessons,
   questions, question_options, question_media).
2. Seed 8 mata pelajaran utama + Bahasa Sambas aktif + bahasa daerah lain berstatus
   pengembangan.
3. Halaman pemilihan mata pelajaran + modal “sedang dikembangkan” untuk bahasa daerah lain.
4. Learning path per mata pelajaran dengan status node terkunci/aktif/selesai.
5. Bank soal awal per level yang benar-benar dapat dimuat dan dinilai.
6. Progress per mapel (user_course_progress, lesson_attempts, answer_attempts) dengan RLS.

---

## Sesi 2 — 9 November 2026

**Fokus:** Tahap 3 (kurikulum, learning path, bank soal) dan inti Tahap 4 (lesson engine).
Catatan ini direkonstruksi dari kode saat audit sesi 3 karena dokumentasi belum diperbarui.

### Hasil

#### Kurikulum dan bank soal

- Migration `20261108100000_curriculum.sql`: `subjects`, `courses`, `course_levels`,
  `units`, `lessons`, `learning_nodes`, `questions`, `question_options`,
  `question_answers`, `question_media`, `user_course_progress`, `user_node_progress`,
  view `lesson_question_stats`, RLS, index, dan trigger.
- Migration `20261108105000_curriculum_overview.sql`: view `subject_overview` untuk katalog.
- Migration `20261108110000_curriculum_seed.sql` (generated): 10 mapel, 22 level,
  22 unit, 36 lesson, 147 soal, 448 opsi, 39 jawaban isian.
- Generator konten di `scripts/content/**/*.ts` + validator; UUID deterministik dan
  `on conflict do update` agar seed idempoten.
- 7 mapel inti aktif dengan 3 level dan 21 soal masing-masing. Bahasa Sambas aktif dengan
  struktur level/unit/lesson tetapi bank soal kosong sesuai keputusan pemilik konten.
  Bahasa Jawa dan Sunda berstatus `development`.
- Komposisi soal: 112 pilihan ganda, 29 melengkapi rumpang, 6 mengetik. Review dan
  challenge memakai soal baru, bukan salinan.

#### Halaman

- `learn.page.ts` — katalog mapel, progres per mapel, modal pengembangan bahasa daerah.
- `learn-subject.page.ts` — learning path level → unit → node dengan status
  selesai/aktif/terkunci dan pratinjau developer.
- `learn-lesson.page.ts` — detail lesson, topik, tipe soal, tujuan unit, tombol mulai.
- `lesson-play.page.ts` — layar lesson, progress bar, hint, feedback, hasil.
- Route baru di `router.ts`; service `curriculum.service.ts` dan `lesson.service.ts`;
  repository `curriculum`, `lesson`, `progress`.

#### Lesson engine

- Migration `20261108120000_lesson_engine.sql`:
  - `lesson_attempts`, `answer_attempts` dengan unique constraint anti-duplikasi.
  - `user_wallets`, `user_xp_ledger`, `coin_transactions`.
  - `grade_question` + `normalize_answer_text`.
  - RPC `start_lesson`, `submit_attempt_answer`, `complete_lesson_attempt`.
  - RLS baca-saja untuk pemain; penulisan hanya lewat RPC.
- Kunci jawaban tidak dikirim ke browser; payload soal disanitasi.
- XP/Koin diberikan sekali saat node pertama kali lulus; replay tidak menambah reward.
- Progres course dan node disimpan terpisah per mata pelajaran.
- `scripts/test-sql.mjs` menguji migration, grading, unlock, idempoten reward, dan RLS.

### Pengujian yang dijalankan

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus. |
| `npm test` | 30 test lulus. |
| `npm run test:sql` | 39 smoke check lulus di PGlite. |
| `npm run build` | Lulus. |

### Belum selesai

- Node `practice`, `checkpoint`, `legendary`, `reward` belum ada.
- Konten tingkat `upper_intermediate`, `advanced`, `expert` belum ada.
- Mini-game selain pilihan ganda dan input teks belum dibangun.
- Hearts, streak, level akun, quest, achievement, shop, inventory belum ada.
- Developer Dashboard, admin soal, Reward Center, dan inbox belum ada.
- Migration belum diterapkan ke Supabase nyata; auth dan gameplay belum E2E.

---

## Sesi 3 — 9 November 2026 — Audit

**Fokus:** Audit menyeluruh, perbaikan klaim usang, dan sinkronisasi dokumentasi.
Tidak ada fitur baru yang diklaim selesai pada sesi ini.

### Hasil

- Audit kode, migration, seed, halaman, dan service; hasil lengkap di `docs/AUDIT.md`.
- Verifikasi ulang: typecheck lulus, 30 unit test lulus, 39 SQL smoke check lulus,
  build lulus. Supabase nyata tetap belum diuji.
- Memperbaiki angka dan klaim usang:
  - banner `/learn` memakai jumlah mapel/soal dinamis (sebelumnya hard-code 105 soal);
  - peta pembangunan di beranda diperbarui (147 soal, 36 lesson, status Tahap 3–5);
  - status sistem di beranda menambahkan penilaian server dan pencatatan XP/Koin.
- Memperbarui README, ARCHITECTURE, DATABASE, GAMEPLAY, TESTING, dan PROJECT_HISTORY
  agar cocok dengan implementasi aktual.
- Menambahkan `docs/AUDIT.md` berisi kategori A–F, status 8 prioritas, temuan yang perlu
  diperbaiki, dan rencana lanjutan.

### Langkah berikutnya

1. Tutup Tahap 3: node practice/legendary/checkpoint, konten tingkat lanjutan, halaman
   pemilihan course/unit dan bahasa daerah, UI riwayat attempt.
2. Tahap 4: registry mini-game dan layar untuk 20 tipe, dimulai dari Word Bank,
   Sentence Builder, Matching Pairs, Fill in the Blank, dan Picture Identification.
3. Tahap 5: Hearts, streak, player level, wallet UI, mastery, quest, achievement, shop.
4. Terapkan migration ke Supabase nyata lalu jalankan checklist E2E di `docs/TESTING.md`.

---

## Sesi 4 — 9 November 2026 — Menutup jenis node Tahap 3

**Fokus:** menambahkan node `practice`, `checkpoint`, dan `legendary` beserta soal baru.

### Hasil

- `scripts/content/types.ts`: tipe `SeedNodeType` dan properti opsional `nodeType` pada
  lesson, sehingga jenis node dapat berbeda dari jenis lesson.
- `scripts/content/helpers.ts`: helper `nodeLesson()` untuk memasang override node.
- `scripts/generate-curriculum-sql.ts`: generator memakai `nodeType ?? kind`.
- `scripts/content/extensions.ts` (baru): 21 lesson baru, 63 soal baru.
  - Setiap mapel inti mendapat 1 practice (3 soal) dan 1 checkpoint (3 soal) di unit
    Level 2, serta 1 legendary (3 soal sulit) di unit Level 3.
  - Semua soal baru ditulis khusus; tidak menyalin soal base/review.
- Seed diregenerasi: **57 lesson, 210 soal, 620 opsi, 59 jawaban isian**, 57 node dengan
  6 jenis playable (lesson, review, challenge, practice, checkpoint, legendary).
- `scripts/test-sql.mjs`: ekspektasi diperbarui dan ditambah pemeriksaan bahwa 7 practice,
  7 checkpoint, dan 7 legendary benar-benar punya lesson dengan minimal 3 soal aktif.
  Ditambah pemeriksaan urutan `practice → checkpoint → legendary`, total menjadi
  42 smoke check.
- Roadmap beranda, README, DATABASE, GAMEPLAY, TESTING, dan AUDIT diperbarui.
- Koreksi angka: dokumen sebelumnya menyebut “57 smoke check”, padahal jumlah sebenarnya
  39 sebelum sesi ini. Sekarang tertulis 40 sesuai output aktual.

### Pengujian yang dijalankan

| Perintah | Hasil |
| --- | --- |
| `npm run seed:build` | Lulus; 57 lesson, 210 soal, hanya peringatan lesson Sambas kosong. |
| `npm run test:sql` | 42 smoke check lulus. |
| `npm run typecheck` | Lulus. |
| `npm test` | 30 test lulus. |
| `npm run build` | Lulus. |

### Belum selesai

- Node `reward` (butuh sistem reward Tahap 5).
- Konten `upper_intermediate`, `advanced`, `expert`.
- Halaman pemilihan course/unit dan bahasa daerah; dukungan multi-course.
- Riwayat attempt dan skor terbaik di UI.
- Mini-game selain pilihan ganda dan input teks.

### Langkah berikutnya

1. Tahap 4: registry mini-game dan layar Word Bank, Sentence Builder, Matching Pairs,
   Fill in the Blank, Picture Identification.
2. Tahap 5: Hearts, streak, player level, wallet UI, mastery, quest, achievement, shop.
3. Terapkan migration ke Supabase nyata dan jalankan checklist E2E.

---

## Sesi 5 — 9 November 2026 — Lima mini-game prioritas

**Fokus:** membangun mekanik bermain nyata untuk Word Bank, Sentence Builder, Matching
Pairs, Fill in the Blank, dan Picture Identification, tanpa mengirim kunci ke browser.

### Hasil

#### Renderer modular

- `src/game/minigames/types.ts` — kontrak `MiniGameProps` dan `MiniGameView`
  (`prompt?`, `answer`, `ownsMedia?`, `getAnswer`, `focus`, `setDisabled`, `markResult?`).
- `shuffle.ts` — seeded shuffle deterministik agar urutan token stabil saat render ulang.
- `wordBank.ts` — bank kata, strip jawaban, hapus chip, reset.
- `sentenceBuilder.ts` — kata acak, geser kiri/kanan, kembalikan kata, reset.
- `matchingPairs.ts` — dua kolom terpisah, pilih kiri+kanan, batalkan pasangan, reset.
- `fillBlank.ts` — input inline pada penanda `__`, fokus otomatis.
- `pictureIdentification.ts` — gambar media besar + opsi nama; renderer memiliki media.
- `multipleChoice.ts`, `typing.ts`, `unsupported.ts` — renderer lama dipindahkan ke kontrak
  yang sama; tipe tanpa layar memakai status jujur + tombol lewati.
- `index.ts` — registry `createMiniGame` dan `isMiniGameSupported`.
- `lesson-play.page.ts` — tidak lagi berisi renderer per tipe; memakai `view.prompt`,
  `view.answer`, `view.getAnswer()`, `setDisabled`, `markResult`, dan `focus`.
- `src/styles/pages.css` — style bank, token, strip, chip, pasangan, gambar, input rumpang,
  hasil benar/salah, serta layout responsif.

#### Database dan konten

- Migration `20261108107000_question_pairs.sql`: tabel `question_pairs` dengan
  `left_id`/`right_id` terpisah, unique per sisi, RLS aktif, tanpa grant ke pemain.
- `grade_question` menilai matching dengan memeriksa jumlah, distinct sisi, dan setiap
  pasangan terhadap tabel; payload mengirim `leftItems`/`rightItems` terpisah dan kolom
  kanan diurutkan `md5(right_id)` agar relasi tidak terbaca dari urutan.
- Tipe seed/helper/generator diperluas untuk word bank, sentence builder, matching pairs,
  picture identification, media, dan pairs.
- 7 soal contoh di `bahasa-inggris/greetings-vocabulary`: 1 word bank, 1 sentence builder,
  1 fill in the blank, 1 matching (4 pasangan), 3 picture identification.
- 3 SVG orisinal di `public/assets/pictures/`: book, globe, laptop.
- Seed diregenerasi: **57 lesson, 217 soal, 645 opsi, 62 jawaban isian, 4 pasangan,
  3 media gambar**, 7 tipe soal.

### Pengujian yang dijalankan

| Perintah | Hasil |
| --- | --- |
| `npm run seed:build` | Lulus; 57 lesson, 217 soal; hanya peringatan lesson Sambas kosong. |
| `npm run test:sql` | 68 smoke check lulus di PGlite. |
| `npm run typecheck` | Lulus. |
| `npm test` | 30 test lulus (2 file). |
| `npm run build` | Lulus; Phaser tetap chunk terpisah. |

SQL test kini juga menjalankan migration pairs, menguji grading kelima mini-game,
memastikan payload tidak membocorkan kunci/relasi, dan memastikan pemain tidak dapat
membaca `question_pairs`.

### Belum selesai / belum dapat diuji

- Supabase nyata belum tersedia; mini-game baru diuji lewat payload RPC + PGlite, belum
  diklik end-to-end di browser dengan sesi nyata.
- 13 mini-game lain belum dibangun: Listening, Speaking, Translation, Conversation,
  Story Mode, Match Madness, Ramp Up, Timed Challenge, Mistakes Review, Personalized
  Practice, Unit Review, Legendary Challenge, Friends Quest.
- Node `reward`, konten tingkat lanjutan, riwayat attempt UI, Hearts, streak, quest,
  achievement, shop, dan Developer Dashboard tetap belum ada.

### Langkah berikutnya

1. Terapkan migration ke Supabase nyata lalu uji kelima mini-game di browser.
2. Lanjutkan mini-game tersisa sesuai prioritas pemilik produk.
3. Tahap 5: Hearts, streak, player level, wallet UI, mastery, quest, achievement, shop.

---

## Sesi 6 — 9 November 2026 — Menyelesaikan Tahap 4

**Fokus:** audit kondisi nyata, lalu menyelesaikan sisa gameplay Tahap 4 tanpa mengubah
fondasi Tahap 1–3.

### Audit singkat

- Tahap 1–3 terverifikasi ada dan berfungsi sesuai catatan: fondasi, akun/RLS, kurikulum,
  learning path, bank soal, lesson engine, dan 7 tipe soal.
- Tahap 4 yang sudah ada: pilihan ganda, input teks, word bank, sentence builder, matching
  pairs, fill in the blank, picture identification.
- Tahap 4 yang belum: listening, speaking, translation, conversation, story, serta mode
  berwaktu/targeted (match madness, ramp up, timed, mistakes, personalized, unit review,
  legendary) dan friends quest.

### Hasil

#### Tipe soal dan scene

- Migration `20261108109000_question_scenes.sql`: kolom `scene jsonb` pada `questions`
  untuk dialog, narasi, dan transkrip audio. `start_lesson` mengirim `scene` pada payload.
- Renderer baru: `listening.ts`, `speaking.ts`, `translation.ts`, `conversation.ts`,
  `story.ts`, dengan helper `src/game/audio/speech.ts` untuk text-to-speech.
- Registry kini memetakan seluruh 12 tipe `question_type`.
- `grade_question` diperluas: jawaban `optionId` berlaku untuk listening, conversation,
  dan story; teks tetap dinormalisasi untuk speaking/translation.
- Konten baru di `scripts/content/stage4.ts`: 2 listening, 1 speaking, 1 translation,
  1 conversation, 1 story, dan 2 matching (6 dan 5 pasangan). Seed menjadi 225 soal,
  12 tipe soal, 15 pasangan matching.

#### Practice engine

- Migration `20261109100000_practice_engine.sql`: enum `practice_mode`, tabel
  `practice_sessions`, `practice_session_questions`, `practice_answers`, kolom
  `accuracy`, dan `practice_session_id` unik pada `user_xp_ledger`.
- RPC `start_practice(mode, course, unit)`: timed (10 soal/120 detik), ramp up (urut
  kesulitan), match madness (matching, 90 detik), unit review (maks 12 soal), legendary
  (soal legendary), mistakes (riwayat salah), personalized (topik sering salah).
- `submit_practice_answer`: grading server, combo deterministik, bonus kecepatan ≤ 2,
  bonus combo ≤ 5, idempoten per soal.
- `complete_practice_session`: akurasi dari total soal, XP ≤ 20 (legendary ≤ 30) hanya bila
  akurasi ≥ 60%, ditulis sekali per sesi.
- RLS: sesi dan jawaban hanya terbaca pemilik; tidak ada grant tulis; soal sesi tidak
  dapat dibaca pemain.

#### UI

- `src/pages/practice.page.ts` — Practice Hub dengan selector mata pelajaran dan 7 kartu mode.
- `src/pages/practice-play.page.ts` — layar bermain: progress, timer total/per soal, combo,
  feedback, ringkasan, unit chooser untuk Unit Review.
- Route `/practice` dan `/practice/play`; item navigasi “Latihan”.
- `src/styles/practice.css` untuk audio, dialog, story, translation, speaking, dan hub.

#### Test dan dokumentasi

- `scripts/test-sql.mjs` diperluas menjadi 106 smoke check: scene, grading tipe baru,
  sesi latihan, combo/kecepatan, XP idempoten, unit review, mistakes, dan RLS practice.
- `tests/practice.test.ts` untuk helper tampilan timer/combo.
- README, AUDIT, GAMEPLAY, DATABASE, TESTING, dan SETUP diperbarui.

### Pengujian yang dijalankan

| Perintah | Hasil |
| --- | --- |
| `npm run seed:build` | Lulus; 57 lesson, 225 soal. |
| `npm run test:sql` | 106 smoke check lulus. |
| `npm test` | 34 test lulus (3 file). |
| `npm run typecheck` | Lulus. |
| `npm run build` | Lulus. |

### Status mini-game

19 dari 20 selesai. Friends Quest belum karena membutuhkan graf teman dan quest bersama
(Tahap 7); tidak dibuat sebagai tombol atau data palsu.

### Belum selesai / batasan

- Belum ada Supabase nyata sehingga auth dan gameplay belum E2E di browser.
- Konten tipe baru baru ada di satu lesson Bahasa Inggris.
- Conversation belum bercabang multi-langkah.
- Belum ada audio rekaman; model audio memakai TTS browser.
- Admin Panel soal belum ada (Tahap 8).
- Practice hanya memberi XP, belum Koin/Hearts/mastery.

### Langkah berikutnya

1. Terapkan 8 migration ke Supabase nyata, jalankan `npm run verify:supabase`, lalu uji
   `/practice` dan tipe soal baru di browser.
2. Sebarkan konten listening/speaking/translation/conversation/story ke mapel inti lain.
3. Tahap 5: Hearts, streak, player level, wallet UI, mastery, quest, achievement, shop.

---

## Sesi 7 — 9 November 2026 — Supabase nyata dan repositori GitHub

**Fokus:** membawa proyek dari verifikasi lokal ke project Supabase nyata dan repo GitHub.

### Hasil

- Project Supabase `xvrnmxbrxhtzzavmrlvy` (`lentera-0ea3`, region Singapura, paket gratis)
  dibuat lewat `npm run setup:supabase`.
- 8 migration diterapkan; `supabase migration list` menunjukkan local = remote.
- Akun QA terverifikasi `qa+xvrnmxbrxhtzzavmrlvy@example.com` dibuat dan diberi role
  `developer`.
- `.env` berisi URL, anon key, project ref, database password, dan kredensial E2E; file ini
  di-ignore Git.
- `npm run verify:supabase` lulus **29 check**: login, role, 20 soal, 12 tipe, 4 scene,
  grading, Practice Hub match madness, bonus skor, XP idempoten, dan RLS.
- Repo GitHub privat `fardhancles-dot/lentera` dibuat dan commit `00f7f58` di-push.

### Bug yang diperbaiki

- `spawnSync('npx.cmd')` gagal di Windows tanpa shell sehingga `db push` dari skrip tidak
  berjalan. Diganti `spawnSync('npx', { shell: true })` + logging error.
- Verifikasi lesson masih mengharapkan 12 soal; diperbarui ke 20 beserta tipe baru dan
  Practice Hub.

### Belum selesai

- UI browser belum diuji dengan sesi nyata (belum ada Playwright).
- Registrasi UI, verifikasi email, reset password, dan onboarding belum E2E.
- Legacy token Supabase masih aktif; hapus setelah setup selesai.
- Perubahan sesi 7 (perbaikan skrip setup + dokumentasi) belum di-push ke GitHub.

### Langkah berikutnya

1. Jalankan `npm run dev`, daftar akun, mainkan lesson dan `/practice` di browser.
2. Hapus legacy token Supabase dari Dashboard → Account → Access Tokens.
3. Push perubahan dokumentasi/skrip, lalu lanjut Tahap 5.

---

## Sesi 8 — 10 November 2026 — Menyelesaikan Tahap 4

**Fokus:** audit kondisi nyata Tahap 4, memperbaiki bagian yang belum sesuai spesifikasi,
menambahkan Friends Quest, menerapkan migration ke Supabase nyata, dan menutup tahap dengan
bukti eksekusi. Tahap 1–3 tidak dibangun ulang dan tidak ada reset data.

### Audit

- Audit lengkap ada di `docs/AUDIT_STAGE4.md`. Temuan utama: klaim lama “19/20” belum benar.
- Conversation belum bercabang, Story belum punya pilihan respons, Fill in the Blank hanya
  satu rumpang, Speaking dipaku `en-US`, dan Friends Quest belum ada.
- Baseline sebelum perubahan: typecheck lulus, 34 unit test, 106 SQL check, build lulus,
  29 check Supabase lulus.

### Perbaikan gameplay

- Kontrak `scene` diperluas: `lang`, `responses`, dan `screens[].choices`; parser
  `LessonScene` di client ikut diperbarui.
- Fill in the Blank sekarang mendukung banyak rumpang. Helper `parseBlankPrompt` dan
  `joinBlankAnswers` memecah prompt dan menggabungkan jawaban berurutan.
- Listening dan Speaking memakai locale dari `scene.lang` (`en-US`/`id-ID`); volume TTS
  mengikuti slider, bukan hanya elemen `<audio>`.
- Conversation menjadi dialog bertahap: setiap pilihan menampilkan reaksi NPC berbeda
  sebelum layar berikutnya. Story meminta pilihan respons sebelum tombol lanjut aktif.
- Pemetaan tipe soal per kategori mapel ditambahkan di generator, sehingga Listening/
  Speaking tidak dipaksakan ke Matematika dan tipe soal tetap relevan.

### Konten

- Enam soal Bahasa Indonesia baru: listening, speaking, fill dua rumpang, conversation,
  story, dan matching. Total seed menjadi **231 soal**; Bahasa Indonesia 36 soal,
  Bahasa Inggris 45 soal.
- Seed diregenerasi menjadi 8 mapel aktif, 22 level, 22 unit, 57 lesson, 231 soal, dan
  1.178 statement. Bahasa Sambas tetap kosong dan tidak di-auto-generate.

### Friends Quest

- Migration `20261110100000_friends_quest.sql`: tabel `friend_quests`,
  `friend_quest_members`, `friend_quest_claims`; kolom `friend_quest_id` pada ledger XP dan
  transaksi Koin; trigger kontribusi; RPC create/join/list/claim; RLS anggota-only.
- Kontribusi hanya dihitung dari XP `lesson`/`practice` yang ditulis server. XP hadiah quest
  dikecualikan agar tidak menggelembungkan quest berikutnya. Klaim sekali per anggota,
  idempoten, dan non-anggota ditolak.
- Client: repository, service, halaman `/friends-quest`, route, CTA di Practice Hub, dan CSS.
- Bug yang ditemukan saat verifikasi remote: policy RLS memanggil helper yang sudah
  di-revoke. Diperbaiki dengan helper `is_my_friend_quest_member(uuid)` yang di-grant ke
  `authenticated`. Bug lain: `replaceChildren` menolak `null` di renderer conversation;
  sudah dibatasi ke node yang valid.

### Pengujian yang dijalankan

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus, 0 error. |
| `npm test` | **42 test lulus (4 file)**; 8 test baru untuk Fill in the Blank. |
| `npm run test:sql` | **135 smoke check lulus** di PGlite, termasuk 22 check Friends Quest. |
| `npm run seed:build` | Lulus; 231 soal, 1.178 statement. |
| `npm run build` | Lulus; halaman Friends Quest menjadi chunk terpisah. |
| `npm run verify:supabase` | **33 check lulus** di project `xvrnmxbrxhtzzavmrlvy`. |

Migration Friends Quest diterapkan dengan `supabase db push --include-all --remote`.
Seed idempoten diterapkan ulang lewat `supabase db query --file`; query verifikasi
menunjukkan 231 soal dan 3 tabel Friends Quest. Verifikasi remote awalnya menemukan
kontribusi quest hanya 6 XP karena satu sesi Match Madness memang memberi 6 XP; skrip uji
diperbaiki agar menyelesaikan beberapa sesi sampai target 20 XP, bukan mengubah aturan produk.

### Batasan yang tetap jujur

- UI browser dua akun untuk Friends Quest belum diuji; alur server sudah diuji di PGlite dan
  Supabase.
- Graf teman penuh, friend request, activity feed, leaderboard, dan liga tetap Tahap 7.
- Admin Panel soal dan Bahasa Sambas tetap Tahap 8.
- Audio masih memakai media tersimpan atau TTS browser; belum ada rekaman produksi.
- Hearts, streak, level akun, quest harian/mingguan, achievement, shop, dan inventory belum
  dibuat (Tahap 5).
- Playwright/E2E browser belum ada.

### Status akhir

Tahap 4 selesai dan diuji pada level database/API. Laporan lengkap ada di
`docs/STAGE4_COMPLETION.md`. Pekerjaan berhenti di sini; Tahap 5 menunggu instruksi pemilik
proyek.

---

## Sesi 9 — 10 November 2026 — Tahap 5: Hearts, Streak, level, dan wallet

**Fokus:** mulai dan selesaikan slice Tahap 5 tanpa membangun ulang Tahap 1–4, tanpa
mengubah stack, dan tanpa membuat reward yang bisa diubah client.

### Database

- Migration baru `20261110120000_progression_economy.sql`:
  - `player_levels` berisi 30 ambang XP dan judul (level 2 = 100 XP; level 7+ memakai
    `1000 + (level - 6) × 350`).
  - `user_hearts` 5/5 dengan regenerasi 30 menit; `user_streaks` menyimpan Streak sekarang,
    rekor terpanjang, dan tanggal aktivitas terakhir.
  - Backfill Hearts/Streak dari `auth.users` dan XP lama; trigger `BEFORE INSERT` pada
    `lesson_attempts` menolak lesson baru saat Hearts 0.
  - Trigger `AFTER INSERT` pada `answer_attempts` mengurangi Heart hanya untuk jawaban salah
    yang benar-benar tersimpan, sehingga duplicate answer tidak mengurangi dua kali.
  - Trigger `AFTER INSERT` pada `user_xp_ledger` memperbarui Streak dari XP lesson/practice
    memakai zona waktu pemain; XP hadiah quest dikecualikan.
  - RPC `get_player_state`, `get_my_wallet`, `refill_hearts`, plus helper level/refill.
  - RLS: Hearts/Streak hanya baris sendiri, `player_levels` baca-saja untuk authenticated,
    tidak ada grant tulis langsung.
- Migration diterapkan ke project Supabase nyata; total menjadi 10 migration.

### Client dan UI

- `player.repository.ts`, `player.service.ts`, `player.store.ts`, dan tipe `PlayerState`/
  `PlayerWallet`; semua payload RPC divalidasi dan di-clamp sebelum ditampilkan.
- Halaman `/wallet` dengan saldo Koin, level dan progress bar, Hearts + refill, Streak 14
  hari, riwayat Koin/XP, dan countdown pemulihan.
- HUD Koin/Hearts/Streak di topbar; kartu progres di beranda dan profil; item navigasi
  Wallet di sidebar/bottom nav.
- Lesson menampilkan Hearts, menyegarkan state setelah jawaban salah, dan menampilkan error
  `hearts_empty` dengan tautan isi Hearts. Hasil lesson/practice menampilkan level dan
  Streak terbaru.

### Pengujian yang dijalankan

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus, 0 error. |
| `npm test` | **49 test lulus (5 file)**; 7 test baru untuk parser progression/wallet. |
| `npm run test:sql` | **167 smoke check lulus** di PGlite. |
| `npm run build` | Lulus; wallet dan player store menjadi chunk terpisah. |
| `npm run verify:supabase` | **43 check lulus** di project `xvrnmxbrxhtzzavmrlvy`. |

Verifikasi remote mencakup `get_player_state`, `get_my_wallet`, 30 baris level, refill saat
Hearts penuh tanpa memotong Koin, RLS Hearts/Streak, dan penolakan update Hearts langsung.

### Batasan yang tetap jujur

- Halaman wallet/HUD belum diuji lewat browser dengan akun nyata; belum ada Playwright.
- Reward saat naik level, quest harian/mingguan, achievement, shop, dan inventory belum ada.
- Practice tetap hanya memberi XP; tidak memakai Hearts dan belum memberi Koin.
- `node reward` belum dibuat.
- Admin Panel dan graf teman penuh tetap Tahap 7–8.

### Langkah berikutnya

1. Uji `/wallet`, HUD Hearts, refill, dan hasil lesson di browser dengan akun nyata.
2. Tambahkan reward naik level dan aturan Hearts premium bila pemilik produk memutuskan.
3. Lanjutkan quest harian/mingguan, achievement, shop, dan inventory sebagai slice berikutnya.

---

## Sesi 10 — 10 November 2026 — Tahap 5: reward, misi, achievement, toko, inventory

**Fokus:** menyelesaikan sisa slice reward Tahap 5 tanpa mengubah stack, tanpa mereset
pekerjaan Tahap 1–4, dan tanpa memberi client kendali atas Koin atau progres.

### Database

- Migration baru `20261110130000_tahap5_rewards.sql` menjadi migration kesebelas:
  - `player_levels.reward_coins` + `user_level_rewards`; hadiah level 2–30 diberikan sekali
    lewat trigger XP dengan formula `25 + (level − 2) × 5`.
  - `streak_milestones` + `user_streak_milestones` untuk hari 3/7/14/30/60/100.
  - `quest_definitions` + `user_quest_claims`: 3 misi harian dan 3 mingguan, progres dari
    `user_xp_ledger`, klaim unik per periode.
  - `achievement_definitions` + `user_achievements`: 8 pencapaian otomatis tanpa hadiah Koin.
  - `shop_items`, `user_inventory`, dan `shop_purchases`: Ramuan Hati 80 Koin dan Perisai
    Streak 120 Koin; pembelian serta pemakaian atomik.
  - `coin_transactions.reference_id` sebagai kunci idempotensi reward baru; `freezes` pada
    `user_streaks`; helper `grant_level_rewards`, `grant_streak_milestones`,
    `evaluate_achievements`, dan `sync_player_rewards`.
  - RPC `get_my_quests`, `claim_quest_reward`, `get_my_achievements`, `get_shop_catalog`,
    `purchase_shop_item`, `get_my_inventory`, `use_inventory_item`; `get_player_state`
    mengembalikan jumlah freeze dan `get_my_wallet` mengembalikan katalog hadiah.
- Migration diterapkan ke Supabase remote `xvrnmxbrxhtzzavmrlvy` dengan `db push`.

### Client dan UI

- Tipe, repository, service parser, dan store rewards; semua payload divalidasi dan di-clamp.
- `/quests` menampilkan misi harian/mingguan, progres, klaim, dan delapan achievement.
- `/shop` menampilkan saldo, dua item, tombol beli, tas, dan tombol pakai.
- `/wallet` menampilkan hadiah level di sekitar level aktif, milestone Streak, jumlah Perisai,
  dan tautan ke Misi/Toko; navigasi sidebar/bottom nav ditambah.
- Item memakai ikon yang sudah ada (`bag`, `gift`, `flag`, `shield`, `heart`, `coin`), sehingga
  tidak ada ikon wallet yang tidak valid.

### Pengujian yang dijalankan

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus, 0 error. |
| `npm test` | **57 test lulus (6 file)**; 8 test baru untuk parser reward/freeze/level. |
| `npm run test:sql` | **189 smoke check lulus** di PGlite. |
| `npm run build` | Lulus; quest/shop/wallet menjadi chunk terpisah. |
| `npm run verify:supabase` | **54 check lulus** di project `xvrnmxbrxhtzzavmrlvy`. |

Verifikasi remote mencakup reward level di `get_my_wallet`, enam quest, delapan achievement,
dua item toko, inventory, penolakan quest/item palsu, dan RLS inventory. Migration baru juga
lulus seluruh check lama, jadi progression, Friends Quest, practice, dan lesson tidak rusak.

### Batasan yang tetap jujur

- UI `/quests`, `/shop`, dan perluasan `/wallet` belum diuji lewat browser dengan akun nyata;
  belum ada Playwright.
- Mastery, review schedule, dan node reward kurikulum belum dibuat.
- Perisai Streak hanya menutup satu hari yang terlewat; tidak ada pembelian freeze permanent.
- Admin Panel, graf teman penuh, leaderboard, dan Tahap 6–8 tetap tidak dikerjakan.

### Status akhir

Sisa slice reward Tahap 5 selesai pada level database, API, tipe, UI, dan build. Klaim
“selesai” di sini berarti seluruh perintah di tabel pengujian di atas sudah dijalankan dan
lulus; pengujian klik browser tetap menjadi pekerjaan terpisah.

---

## Sesi 11 — 10 November 2026 — Menutup Tahap 5: mastery, review terjadwal, node hadiah

**Fokus:** melanjutkan pekerjaan yang terhenti di tengah slice terakhir Tahap 5. Sesi ini
tidak membangun ulang Tahap 1–4, tidak mengganti stack, tidak mereset database, dan tidak
mengubah UI yang sudah ada selain menautkan fitur baru.

### Kondisi saat sesi dimulai

- Working tree berisi pekerjaan belum di-commit: migration
  `20261110140000_mastery_review_rewards.sql`, halaman `/mastery`, halaman
  `/learn/:subject/reward/:nodeSlug`, service/repository/tipe mastery, mode latihan
  `scheduled_review`, dan tambahan CSS.
- `npm run typecheck` lulus, `npm test` lulus 57 test, `npm run build` lulus.
- `npm run test:sql` **crash** saat `claim_reward_node`:
  `there is no unique or exclusion constraint matching the ON CONFLICT specification`.
  Inilah titik terakhir pekerjaan sebelumnya. Penyebabnya `on conflict (reference_id)`
  padahal unique index yang ada adalah parsial pada `(user_id, source, reference_id)`.

### Perbaikan dan penyelesaian

- Migration diperbaiki memakai target indeks yang benar:
  `on conflict (user_id, source, reference_id) where reference_id is not null do nothing`.
  Idempotensi klaim tetap berlapis: `user_reward_claims` unik, unique index
  `user_xp_ledger.reward_claim_id`, unique index `coin_transactions.reward_claim_id`, dan
  `pg_advisory_xact_lock` per pemain+node.
- Seluruh blok smoke check baru (mastery, review terjadwal, node hadiah) kini berjalan:
  salah menjadwalkan ulang ±10 menit, benar menaikkan mastery dan interval menjadi 1 hari,
  review hanya mengembalikan soal jatuh tempo, node hadiah menolak klaim sebelum level
  selesai, klaim memberi Koin/XP tepat sekali, klaim kedua idempoten, dan RLS menyembunyikan
  data pemain lain.
- Unit test baru: `tests/mastery.test.ts` (3 test parser) dan satu test
  `parseRewardNodeClaim` di `tests/rewards.test.ts`.
- Dokumentasi diperbarui agar tidak lagi menyatakan mastery “Not implemented”: README,
  `docs/DATABASE.md`, `docs/GAMEPLAY.md`, `docs/TESTING.md`, dan catatan sesi ini.
- Migration diterapkan ke Supabase remote `xvrnmxbrxhtzzavmrlvy` (proyek production milik
  pemilik) dengan `supabase db push --include-all --remote`. Dry run lebih dulu menunjukkan
  tepat satu migration additive, dan CLI melaporkan “Finished” tanpa error.
- `scripts/verify-supabase.mjs` ditambah enam check nyata: `get_my_mastery`,
  `start_scheduled_review`, 22 node hadiah aktif dengan Koin/XP, penolakan
  `claim_reward_node` untuk node tidak dikenal, dan penolakan tulis langsung ke
  `user_question_mastery` serta `user_reward_claims`.

### Tidak ada perubahan pada

- Kode Tahap 1–4 (auth, kurikulum, lesson engine, 20 mini-game, Friends Quest).
- Skema/heart/streak/quest/toko yang sudah berjalan; migration baru hanya menambah tabel,
  kolom, fungsi, dan 22 node hadiah.
- `.env`, konfigurasi Vercel, dan `scripts/verify-supabase.mjs`.

### Pengujian yang dijalankan

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus, 0 error. |
| `npm test` | **61 test lulus (7 file)**. |
| `npm run test:sql` | **205 smoke check lulus** di PGlite. |
| `npm run build` | Lulus; halaman mastery dan reward menjadi chunk terpisah. |
| `npm run verify:supabase` | **60 check lulus** di project `xvrnmxbrxhtzzavmrlvy` setelah migration diterapkan (54 check lama + 6 check mastery/node hadiah). |

### Batasan yang tetap jujur

- UI `/mastery` dan `/learn/:subject/reward/:nodeSlug` belum diuji lewat browser dengan akun
  nyata; belum ada Playwright. Bukti yang ada: SQL smoke, unit test parser, build, dan RPC
  nyata lewat `verify:supabase`.
- Klaim node hadiah yang berhasil (bukan hanya penolakan node tidak dikenal) belum diuji
  lewat API remote karena akun uji belum menuntaskan seluruh lesson satu level; jalur
  tersebut diuji lengkap di PGlite.
- Seed Bahasa Sambas tetap kosong dan harus diisi pemilik lewat Admin Panel (Tahap 8).
- Tidak ada perubahan yang di-commit atau di-push pada sesi ini.

### Status Tahap 5

Seluruh cakupan prioritas 5 (XP, Koin, Hearts, Streak, dan reward) kini punya implementasi
nyata dan bukti eksekusi lokal: ledger XP/Koin, 30 level akun + hadiah level, Hearts dengan
regenerasi/refill, Streak dengan milestone dan Perisai, quest harian/mingguan, 8 achievement,
toko + inventory, mastery per soal, review terjadwal, serta 22 node hadiah level.
Monthly Challenge dan leaderboard/liga tetap milik Tahap 7 sesuai roadmap (Phase 7 —
Quest and Competition).

### Langkah berikutnya

1. Uji `/mastery`, klaim node hadiah, dan Review Terjadwal di browser dengan akun nyata
   (atau tambahkan Playwright).
2. Lanjut ke Tahap 6 (karakter, animasi, audio, adventure map Phaser) setelah pemilik proyek
   menyetujui laporan kesiapan.

---

## Sesi 12 — 10 November 2026 — Tahap 6: peta petualangan Phaser dan animasi Kiko

**Fokus:** Irisan pertama Tahap 6 — karakter Kiko reusable dengan animasi, peta
petualangan Phaser di halaman peta belajar, tanpa mengubah tampilan landing dan tanpa
menghapus daftar lesson DOM.

### Hasil

- `src/game/characters/kiko.ts`: factory `createKiko(scene, { reducedMotion, scale })`
  dengan 13 state animasi (idle, blink, happy, sad, excited, surprised, thinking,
  celebrating, encouraging, disappointed, speaking, jumping, walking), API `root`,
  `setAnimation`, `setFacing`, `getAnimation`, `destroy`, dan satu rig phaser untuk bob,
  kaki, telinga, lengan, serta lentera.
- `src/game/mascot/createMascotStage.ts` kini memakai `createKiko`; gambar, posisi, dan
  denyut idle maskot landing dipertahankan, hanya sumber kode karakternya yang dipusatkan.
- `src/game/adventure/`: tipe peta, `computeMapPositions` (serpentine tiga kolom dengan
  perapatan baris), dan `createAdventureMap` yang memasang/membersihkan Phaser game.
- `src/game/scenes/adventureMapScene.ts`: latar 2D deterministik per level, jalan berkelok,
  node status selesai/siap/terkunci/pratinjau/hadiah, Kiko berjalan antarnode sebelum
  navigasi, tooltip DOM-style di kanvas, animasi disappointed untuk node terkunci, dan
  dukungan `prefers-reduced-motion`.
- `/learn/:subject` menampilkan peta di atas daftar lesson lama. Pemilih level berupa
  tombol DOM di atas kanvas (grup `role="group"`, `aria-pressed`, status `aria-live`),
  sehingga bisa dioperasikan keyboard dan dibacakan pembaca layar; judul level, hitungan
  selesai, dan status pengumuman diperbarui lewat `onLevelChange`. Peta dimuat lazy,
  dihancurkan lewat `ctx.onCleanup`, dan tidak menggantikan tautan DOM yang aksesibel.
- `src/styles/pages.css`: gaya `.adventure-map*` (header, frame rasio 900×460, legenda).

### Pengujian

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus 0 error. |
| `npm test` | **65 test lulus** (8 file), termasuk 4 test baru `tests/adventure-map.test.ts`. |
| `npm run build` | Lulus; Phaser tetap chunk lazy (`phaser-*.js`). |
| `npm run test:sql` | Tidak dijalankan ulang: tidak ada perubahan SQL pada sesi ini. |
| `npm run verify:supabase` | Tidak dijalankan ulang: tidak ada perubahan remote pada sesi ini. |

### Batasan yang tetap jujur

- Peta dan animasi Kiko belum diuji di browser sungguhan; belum ada screenshot atau
  Playwright. Bukti baru sebatas typecheck, unit test layout, dan build.
- Di layar ponsel sempit peta 900×460 diperkecil sehingga label node kecil; daftar lesson
  DOM di bawahnya tetap jadi jalur utama. Peta yang bisa digulir/zoom per level belum ada.
- Peta menggambar satu level pada satu waktu. Perpindahan level lewat tombol DOM di atas
  kanvas atau daftar DOM; belum ada animasi transisi antarlevel dan belum ada gulir/zoom
  peta. Pemilih level dan status live belum diuji dengan pembaca layar sungguhan.
- Sprite sheet/audio karakter, ekspresi berbasis aset, dan scene petualangan lain belum
  dibuat (masih bagian Tahap 6).
- Tidak ada commit atau push Git pada sesi ini.

### Langkah berikutnya

1. Uji peta di browser (desktop dan ponsel) dengan akun nyata; perbaiki bila ada masalah
   interaksi kanvas.
2. Lanjutkan Tahap 6: audio/SFX karakter, scene petualangan berikutnya, dan aset sprite
   final bila tersedia.

---

## Sesi 13 — 10 November 2026 — Menuntaskan Stage 6: audio, animasi, peta responsif, aset

**Fokus:** Menuntaskan cakupan Stage 6 (karakter, animasi, audio, adventure map,
responsive UI, pipeline aset) tanpa mengubah sistem Stage 1–5.

### Hasil

- **Audio sintetis baru** (`src/game/audio/audioEngine.ts`, `patterns.ts`): tujuh SFX
  (klik, langkah, benar, salah, selesai, hadiah, terkunci) dan musik latar lembut dari
  osilator Web Audio. Volume mengikuti `music_volume`, `sfx_volume`, dan
  `voice_volume`; mute lokal di topbar (`aria-pressed`) tanpa mengubah database;
  AudioContext dibuka pada gesture pertama dan musik berhenti saat tab disembunyikan.
- **Animasi karakter di alur nyata**: hasil lesson memasang maskot Phaser dengan
  `celebrating` (lulus) atau `sad` (belum lulus), dengan fallback SVG bila kanvas gagal.
  Maskot landing kini memakai `createKiko` dan memutar suara hadiah saat diklik.
- **Peta responsif**: dua viewport logis — wide 900×460 tiga kolom dan compact 420×620
  dua kolom dengan label 15px. Frame memakai rasio sesuai viewport, dan peta di-remount
  (debounce 250ms) ketika breakpoint berubah. Penanda “Kamu” mengikuti Kiko, dan
  perpindahan level memakai fade singkat yang dimatikan pada reduced motion.
- **SFX terhubung ke gameplay**: jawaban benar/salah, hasil lesson, klaim hadiah,
  pemilihan level dan node peta, serta klik umum tombol/tautan.
- **Pipeline aset**: `src/game/assets/manifest.ts` (key, scene, sumber, lisensi),
  `load.ts` (Phaser loader + error logging), `docs/ASSETS.md`, dan unit test yang
  memvalidasi path file nyata.
- **Playwright ditambahkan** (`@playwright/test`, `playwright.config.ts`,
  `tests/e2e/stage6.spec.ts`). Dua test browser lulus: maskot landing dan peta
  (kanvas tampil, pemilih level via keyboard, aria-pressed/status, mute, resize 390px).
- **Bug lama diperbaiki (menghalangi Stage 6):** form login, register, dan lupa password
  sempat memasang listener submit setelah `await renderAuthLayout`, sehingga submit lebih
  awal bisa jatuh ke perilaku native dan menaruh email/password di query string. Listener
  kini dipasang sebelum layout di-await dan pengujian login browser berhasil.

### Pengujian

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus 0 error. |
| `npm test` | **72 test lulus** (10 file), termasuk test audio, aset, dan layout compact. |
| `npm run build` | Lulus; Phaser tetap chunk lazy. |
| `npm run test:e2e` | **2 test lulus** (maskot landing; peta: kanvas, pemilih level keyboard, status live, mute, resize 390px). |
| `npm run test:sql` | Tidak dijalankan ulang — tidak ada perubahan SQL. |
| `npm run verify:supabase` | Tidak dijalankan ulang — tidak ada perubahan remote. |

### Batasan yang tetap jujur

- Akun QA di `.env` sempat berstatus belum onboarding; pengujian browser menyelesaikan
  onboarding sekali untuk akun uji tersebut (perubahan data aditif pada akun QA, bukan
  data pengguna lain).
- Pemutaran audio belum diverifikasi secara audible (headless tidak bisa didengar);
  yang diuji adalah pola nada, pemetaan volume, integrasi kode, dan tidak ada error
  konsol pada smoke test.
- Pembaca layar sungguhan belum dipakai untuk menguji pemilih level.
- Sprite sheet/audio file final belum ada; semuanya masih prosedural dan didokumentasikan
  sebagai karya orisinal, bukan placeholder diam.
- Tidak ada commit atau push Git.

### Status Stage 6

Seluruh cakupan wajib A–F punya implementasi nyata, terhubung, dan lolos typecheck, 72
unit test, build, serta 6 test browser (termasuk peta berakun dan breakpoint ponsel).
Satu-satunya verifikasi yang belum dilakukan adalah mendengar audio secara langsung dan
menguji dengan pembaca layar sungguhan; keduanya dicatat sebagai batasan, bukan klaim
lulus.

## Sesi 15 — 10 November 2026 — Audit sisa pekerjaan dan E2E dua akun

### Yang dikerjakan

- **E2E Friends Quest dua akun** (`tests/e2e/friends-quest.spec.ts`): akun utama membuat
  quest lewat form, akun kedua bergabung memakai kode undangan, lalu kedua sisi memeriksa
  2/8 anggota dan tombol klaim yang masih nonaktif. Quest uji berjudul `E2E Quest …`
  dibersihkan sebelum/sesudah run supaya batas tiga quest aktif tidak menumpuk.
  Diverifikasi memakai akun sementara dari Admin API yang langsung dihapus setelah run.
  Test skip dengan alasan jelas bila `E2E_EMAIL_2`/`E2E_PASSWORD_2` tidak diisi.
- **E2E Practice Hub** (`tests/e2e/practice.spec.ts`): memilih mapel Bahasa Inggris, memulai
  mode latihan nyata, menjawab satu soal, lalu memeriksa feedback penilaian. Skip bila soal
  pertama memakai mekanik yang butuh mikrofon.
- **E2E profil & pengaturan** (`tests/e2e/account.spec.ts`): menyimpan nama tampilan dan
  preferensi reduced motion, memastikan nilainya bertahan setelah reload, lalu
  mengembalikan nilai awal akun QA.
- **Helper E2E bersama**: `answerFirstQuestion` dipindah ke `helpers.ts`, ditambah penanganan
  soal matching dua kolom (klik kolom kiri lalu kanan) dan `secondAccount()`.
- **E2E reset password** (`tests/e2e/password-reset.spec.ts`): akun sementara dibuat lewat
  Supabase Admin API (service role diambil dari Management API dengan token yang sudah ada),
  tautan recovery resmi dibuat lewat `generate_link`, halaman `/reset-password` menyimpan
  password baru, lalu login API dengan password itu diverifikasi. Akun dihapus di `finally`.
  Ini menutup alur lupa password tanpa kotak surat; konfirmasi pendaftaran lewat email tetap
  belum diuji.
- **Perapian format** `buildPathNode` di `curriculum.service.ts` (temuan audit Tahap 3,
  hanya indentasi, tanpa perubahan perilaku).

### Pengujian

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus 0 error. |
| `npm test` | 72 test lulus (10 file). |
| `npm run build` | Lulus. |
| `npm run test:e2e` | **9 lulus, 1 skip** (skip: Friends Quest tanpa kredensial akun kedua; alur dua akun sudah diverifikasi dengan akun sementara). |
| `npm run test:sql` | 206 check lulus. |
| `npm run verify:supabase` | 61 check lulus. |

### Sisa pekerjaan yang belum bisa ditutup sekarang

1. Konfirmasi pendaftaran lewat email butuh kotak surat uji.
2. Audio belum diverifikasi dengan telinga; pembaca layar sungguhan belum dipakai.
3. Pembelian toko, klaim quest/achievement, mastery/review, dan 20 mekanik mini-game belum
   dijelajahi satu per satu di browser (server-nya sudah diuji).
4. Mapel dengan lebih dari satu course belum didukung katalog (view memberi satu baris per
   course, katalog memakai `courses[0]`); perlu redesign saat fitur itu ditambahkan.
5. Riwayat attempt lesson belum ditampilkan ke pemain.
6. Deployment produksi dan fitur Tahap 7 (graf teman/sosial) belum dikerjakan.

## Sesi 14 — 10 November 2026 — Uji menyeluruh di browser dan bug katalog

### Yang dikerjakan

- **E2E diperluas** dengan `tests/e2e/helpers.ts` dan `tests/e2e/app-smoke.spec.ts`:
  sembilan rute aplikasi, alur lesson (peta → lesson → main → jawab → feedback → lanjut),
  overflow horizontal di 390×844, dan reduced motion. `stage6.spec.ts` memakai helper yang
  sama, sehingga totalnya enam test dan semuanya lulus.
- **Bug lama diperbaiki (menghalangi pengujian):** `/learn` dan `/practice` gagal memuat
  katalog karena `subject_overview` memakai `security_invoker = true` sementara `questions`
  di-revoke dari `authenticated`, menghasilkan `permission denied for table questions`.
  `curriculumRepository.listSubjects` kini mencoba view sekali per sesi; bila ditolak, ia
  menghitung agregat yang sama dari `subjects`, `courses`, `course_levels`, `units`,
  `lessons` terpublikasi plus view aman `lesson_question_stats` — tanpa membaca satu pun
  baris soal. Hasilnya: katalog, Practice Hub, dan rute lain kembali tanpa error halaman.
- **Migration perbaikan disiapkan:** `supabase/migrations/20261110150000_subject_overview_owner.sql`
  membuat ulang `subject_overview` dengan hak owner (`security_invoker = false`) tanpa
  mengubah definisi, komentar, atau grant. `scripts/test-sql.mjs` kini menjalankan view itu
  sebagai role `authenticated`; sebelum perbaikan, query tersebut gagal dengan
  `permission denied for table questions`, sesudahnya mengembalikan 8 lesson/30 soal.
  Migration ini **sudah diterapkan** ke project nyata lewat Management API
  (`npm run db:apply-catalog-fix`, token dari `.env`), lalu diverifikasi: view terbaca
  pemain dengan 8 lesson/30 soal, `verify:supabase` 61 check lulus, dan log 403 hilang dari
  browser.
- **Verifikasi ditambah:** `scripts/verify-supabase.mjs` membaca `subject_overview` lewat
  PostgREST dengan akun uji (8 lesson/30 soal). Test rute E2E kini menuntut satu
  `.subject-card` tampil di `/learn`, bukan hanya shell halaman, dan filter log 403 sementara
  di helper E2E sudah dihapus karena sumbernya sudah diperbaiki.
- **Otomatisasi penerapan:** `scripts/apply-catalog-fix.mjs` +
  `npm run db:apply-catalog-fix` memakai Supabase Management API
  (`POST /v1/projects/{ref}/database/query`) dengan `SUPABASE_ACCESS_TOKEN`, menerapkan 4
  statement migration secara berurutan, lalu memverifikasi hasilnya lewat PostgREST.
  `--dry-run` menampilkan target dan SQL tanpa menyentuh database; token tidak pernah dicetak.

### Pengujian

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus 0 error. |
| `npm test` | **72 test lulus** (10 file). |
| `npm run build` | Lulus. |
| `npm run test:e2e` | **6 test lulus**: 9 rute + alur lesson + overflow ponsel + reduced motion + maskot landing + peta berakun. |
| `npm run test:sql` | **206 smoke check lulus**, termasuk pengecekan akses view katalog sebagai `authenticated`. |
| `npm run verify:supabase` | **61 check lulus**, termasuk `view katalog bisa dibaca pemain (8 lesson, 30 soal)`. |

### Batasan

- Browser mencatat satu log `Failed to load resource` untuk request `subject_overview` yang
  ditolak sebelum fallback berjalan; helper E2E mengabaikan hanya log itu, error lain tetap
  dianggap gagal.
- Audio belum diverifikasi secara audible dan pembaca layar sungguhan belum dipakai.
- Tidak ada commit atau push Git.
