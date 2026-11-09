# Laporan Akhir Tahap 4 — Gameplay dan 20 Mini-game

Tanggal: 10 November 2026
Project: Lentera (`xvrnmxbrxhtzzavmrlvy`, region Singapura)
Ruang lingkup: Tahap 4 saja. Tahap 1–3 dipertahankan; Tahap 5–8 tidak dikerjakan.

## Status akhir

**Tahap 4 selesai pada level implementasi, database, dan API.** Seluruh 20 mini-game
mempunyai mekanik nyata dan diuji lewat PGlite serta Supabase. Pengujian browser
end-to-end dengan Playwright belum ada, jadi status UI adalah *implemented, belum E2E*.

| Kategori | Status |
| --- | --- |
| 20 mini-game | **20/20 implemented · 20/20 tested (SQL/API)** |
| Lesson engine + Practice Hub | **Implemented · Tested (SQL/API)** |
| Reward/XP idempoten | **Implemented · Tested (SQL/API)** |
| Friends Quest | **Implemented · Tested (SQL/API)**; UI belum diuji dua akun di browser |
| Bank soal | **231 soal**, 12 tipe, 8 mapel aktif |
| Migration | **9 migration**, local = remote |
| Browser E2E | **Not implemented** (Playwright belum ada) |
| Admin Panel / Bahasa Sambas editor | **Not implemented** (Tahap 8) |

Legenda: *Implemented* = kode ada; *Tested* = ada bukti eksekusi; *Configured* = kredensial
atau opsi sudah diisi; *Pending credential*; *Placeholder*; *Not implemented*.

## Yang diselesaikan

### 1. Kontrak scene dan tipe soal

- `scene` sekarang mendukung `lang`, `responses`, dan `screens[].choices`.
- Parser `LessonScene` di client membaca kontrak baru tanpa mengubah payload server.
- Listening/Speaking memakai locale dari konten (`en-US` atau `id-ID`).
- Volume text-to-speech mengikuti slider, bukan hanya elemen `<audio>`.

### 2. Fill in the Blank multi-rumpang

- `parseBlankPrompt` memecah prompt pada setiap penanda `__`/`___`.
- `joinBlankAnswers` menggabungkan jawaban berurutan dan menolak rumpang kosong.
- Renderer menampilkan input inline sebanyak rumpang; server menilai teks gabungan.
- 8 unit test baru di `tests/minigames.test.ts`.

### 3. Conversation dan Story

- Conversation berjalan bertahap: NPC berbicara, pemain memilih respons, NPC memberi
  reaksi berbeda, lalu layar berikutnya. Cabang mengikuti respons yang ditulis di konten.
- Story menampilkan beberapa layar; layar tertentu mewajibkan pilihan respons sebelum
  tombol lanjut aktif. Pertanyaan pemahaman tetap dinilai server.
- Konten contoh tersedia dalam Bahasa Inggris dan Bahasa Indonesia.

### 4. Pemetaan tipe soal per mapel

- Generator memetakan tipe soal sesuai kategori mapel, sehingga Listening/Speaking tidak
  dipaksakan ke Matematika dan tipe soal tetap relevan.
- Validasi konten menolak tipe yang tidak sesuai dan memastikan respons/pilihan scene
  lengkap.

### 5. Konten baru

Enam soal Bahasa Indonesia ditambahkan:

1. Listening dengan locale `id-ID`.
2. Speaking dengan locale `id-ID`.
3. Fill in the Blank dua rumpang.
4. Conversation dengan empat reaksi NPC.
5. Story dengan tiga pilihan respons.
6. Matching istilah–arti.

Seed final: **8 mapel aktif, 22 level, 22 unit, 57 lesson, 231 soal, 1.178 statement**.
Bahasa Sambas tetap kosong dan tidak di-auto-generate.

### 6. Friends Quest

Migration `20261110100000_friends_quest.sql` menambahkan:

- `friend_quests` — kode 6 karakter, target 20–10.000 XP, hadiah XP/Koin, maksimal 8
  anggota, status, waktu mulai/berakhir.
- `friend_quest_members` — keanggotaan dan `contribution_xp`.
- `friend_quest_claims` — klaim sekali per anggota.
- Kolom `friend_quest_id` pada `user_xp_ledger` dan `coin_transactions`, dengan unique index
  per `(friend_quest_id, user_id)`.
- Trigger `track_friend_quest_progress`: XP lesson/practice menambah kontribusi ke semua
  quest aktif; XP hadiah quest dikecualikan.
- RPC `create_friend_quest`, `join_friend_quest`, `get_my_friend_quests`,
  `claim_friend_quest_reward`, plus helper RLS `is_my_friend_quest_member`.
- RLS anggota-only; non-anggota tidak dapat membaca atau mengklaim.

Client: repository, service, halaman `/friends-quest`, route, CTA di Practice Hub, dan CSS.
Hadiah quest masuk ke ledger/wallet secara atomik dan tidak dapat diklaim dua kali.

### 7. Dokumentasi

- `README.md`, `docs/GAMEPLAY.md`, `docs/DATABASE.md`, `docs/TESTING.md`, `docs/SETUP.md`,
  `docs/ARCHITECTURE.md`, dan `docs/PROJECT_HISTORY.md` diperbarui.
- `docs/AUDIT_STAGE4.md` dipertahankan sebagai snapshot audit sebelum perbaikan.

## Bukti pengujian

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| TypeScript strict | `npm run typecheck` | Lulus, 0 error. |
| Unit test | `npm test` | **42 test lulus (4 file)**. |
| SQL + RPC + RLS + practice + Friends Quest | `npm run test:sql` | **135 smoke check lulus** di PGlite. |
| Seed | `npm run seed:build` | 8 mapel aktif, 22 level, 57 lesson, 231 soal, 1.178 statement. |
| Build produksi | `npm run build` | Lulus; Phaser dan `friends-quest.page` menjadi chunk terpisah. |
| Supabase nyata | `npm run verify:supabase` | **33 check lulus** di project `xvrnmxbrxhtzzavmrlvy`. |

Verifikasi Supabase mencakup login, role developer, payload 20 soal tanpa kunci, scene
listening/speaking/conversation/story, penilaian 20 jawaban, hasil lesson, Practice Hub
Match Madness, XP idempoten, pembuatan Friends Quest, kontribusi XP dari beberapa sesi
latihan, klaim hadiah, klaim ganda, dan RLS `question_pairs`/`practice_sessions`.

Bukti database nyata:

- `select count(*) from questions` → **231**.
- Enam soal Bahasa Indonesia baru ditemukan.
- Tabel `friend_quest*` → **3 tabel**.
- Migration Friends Quest diterapkan dengan `supabase db push --include-all --remote`.
- Seed idempoten diterapkan ulang dengan `supabase db query --file` (bukan `db push`,
  karena versi seed lama sudah tercatat di remote).

## Regresi Tahap 1–4

| Area | Bukti | Status |
| --- | --- | --- |
| Fondasi Vite/TypeScript/Phaser | typecheck + build | Lulus |
| Auth, profil, lesson payload | `verify:supabase` login + role + lesson | Lulus |
| Kurikulum dan bank soal | 135 SQL check, seed 231 soal | Lulus |
| Lesson engine + reward | 20/20 jawaban, akurasi 100%, XP idempoten | Lulus |
| Practice Hub | Match Madness, skor bonus, XP idempoten | Lulus |
| Friends Quest | create, join, kontribusi, selesai, klaim, RLS | Lulus |
| UI browser | Chrome smoke sesi 1; belum ada Playwright | **Belum E2E** |

Tidak ada test yang dilewati, tidak ada assertion yang dilemahkan, dan tidak ada error yang
disembunyikan.

## Batasan dan pekerjaan yang belum selesai

1. **Browser E2E belum ada.** UI 20 mini-game, dua akun Friends Quest, registrasi,
   verifikasi email, reset password, onboarding, dan responsif belum diuji otomatis.
2. **Graf teman penuh belum ada.** Friends Quest memakai kode undangan; friend request,
   friendships, friend streak, activity feed, leaderboard, dan liga tetap Tahap 7.
3. **Admin Panel belum ada.** Pengelolaan soal dan konten Bahasa Sambas tetap Tahap 8.
4. **Audio belum produksi.** Listening memakai media tersimpan atau TTS browser; belum ada
   rekaman suara dan pengujian mikrofon nyata.
5. **Konten belum merata.** Enam soal baru ada di Bahasa Indonesia; mapel lain masih dominan
   pilihan ganda dan isian.
6. **Sistem Tahap 5 belum ada.** Hearts, streak, level akun, wallet UI, mastery, quest
   harian/mingguan, achievement, shop, dan inventory belum dibuat.
7. **Practice hanya memberi XP.** Koin, Hearts, dan mastery dari practice belum diberikan.
8. **Node `reward` belum ada.** Menunggu sistem reward Tahap 5.

## Berkas utama yang berubah

- `scripts/content/types.ts`, `helpers.ts`, `stage4.ts`, `mapping.ts`, `index.ts`
- `scripts/generate-curriculum-sql.ts`, `scripts/test-sql.mjs`, `scripts/verify-supabase.mjs`
- `supabase/migrations/20261108110000_curriculum_seed.sql`
- `supabase/migrations/20261110100000_friends_quest.sql`
- `src/services/lesson.service.ts`, `src/game/audio/speech.ts`
- `src/game/minigames/fillBlank.ts`, `blankPrompt.ts`, `listening.ts`, `speaking.ts`,
  `conversation.ts`, `story.ts`
- `src/repositories/friendsQuest.repository.ts`, `src/services/friendsQuest.service.ts`,
  `src/pages/friends-quest.page.ts`, `src/app/router.ts`, `src/pages/practice.page.ts`
- `src/types/database.ts`, `src/styles/practice.css`
- `tests/minigames.test.ts`
- `README.md`, `docs/GAMEPLAY.md`, `docs/DATABASE.md`, `docs/TESTING.md`, `docs/SETUP.md`,
  `docs/ARCHITECTURE.md`, `docs/PROJECT_HISTORY.md`

## Langkah berikutnya

Tahap 4 berhenti di sini. Tahap 5 (XP, Koin, Hearts, Streak, reward, mastery, quest,
achievement, shop, inventory) menunggu instruksi pemilik proyek. Jangan memulai Tahap 5–8
tanpa instruksi tersebut.
