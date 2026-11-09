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
