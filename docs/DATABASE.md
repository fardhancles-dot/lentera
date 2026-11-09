# Database

Database: PostgreSQL di Supabase. Migration ada di `supabase/migrations/`.

> **Status:** kesepuluh migration sudah diterapkan ke project Supabase nyata
> (`xvrnmxbrxhtzzavmrlvy`, region Singapura) dan `supabase migration list` menunjukkan
> local = remote. Smoke test PGlite (167 check) dan verifikasi API Supabase (43 check)
> lulus, termasuk Friends Quest serta progression/economy. Pengujian UI di browser masih
> terpisah.

## Daftar migration

| File | Isi |
| --- | --- |
| `20261108090000_identity.sql` | Profil, role, pengaturan, trigger akun, RPC onboarding, RLS. |
| `20261108100000_curriculum.sql` | Mapel → course → level → unit → lesson/node → soal; progres baca-saja. |
| `20261108105000_curriculum_overview.sql` | View `subject_overview` untuk katalog mapel. |
| `20261108107000_question_pairs.sql` | Tabel pasangan kiri/kanan untuk soal `matching_pairs`; tanpa grant ke pemain. |
| `20261108109000_question_scenes.sql` | Kolom `scene` untuk dialog, narasi, dan transkrip audio soal. |
| `20261108110000_curriculum_seed.sql` | Seed generated: 10 mapel, 22 level, 22 unit, 57 lesson, 231 soal, 57 node. |
| `20261108120000_lesson_engine.sql` | Attempt, grading server, XP/Koin ledger, wallet, progres; payload menyertakan `scene`. |
| `20261109100000_practice_engine.sql` | Sesi latihan, jawaban latihan, 7 mode, combo/timer scoring, XP latihan idempoten. |
| `20261110100000_friends_quest.sql` | Friends Quest co-op: quest, anggota, klaim, trigger kontribusi XP, RPC create/join/list/claim, RLS. |
| `20261110120000_progression_economy.sql` | Level akun, Hearts, Streak, wallet RPC, trigger Hearts/Streak, backfill, dan RLS. |

Seed dihasilkan dari `scripts/content/**/*.ts` dengan `npm run seed:build`. Jangan mengedit
file seed secara manual; ubah sumber TypeScript lalu regenerasi. UUID bersifat deterministik
sehingga seed aman dijalankan ulang (`on conflict do update`).

## Tabel

### Akun

- `profiles` — satu baris per `auth.users`, dibuat trigger; username unik (citext),
  display name, avatar, bio, `onboarding_completed`.
- `user_roles` — `player`, `admin`, `developer`; hanya SQL Editor/service role yang menulis.
- `user_settings` — locale, timezone, target harian, volume, reduced motion, opt-in email.

Email tidak disimpan di `profiles`; email hidup di `auth.users` dan hanya dibaca pemilik.

### Kurikulum

| Tabel | Catatan |
| --- | --- |
| `subjects` | `status` (`active`/`development`/`inactive`), `is_primary`, kategori, ikon, accent. |
| `courses` | Satu course per mapel saat ini; unique `(subject_id, slug)`. |
| `course_levels` | `difficulty` enum 6 tingkat; unique `(course_id, slug)`. |
| `units` | Tujuan pembelajaran (`text[]`), reward koin, unique `(course_level_id, slug)`. |
| `lessons` | `kind`, estimasi menit, XP/Koin, `hearts_enabled`, unique `(unit_id, slug)`. |
| `learning_nodes` | `node_type` 7 jenis (6 terisi: lesson, review, challenge, practice, checkpoint, legendary), opsional `lesson_id`, urutan dalam unit. |
| `questions` | Tipe, topik, kesulitan, instruksi, prompt, penjelasan, hint, poin, `scene` (dialog/narasi/transkrip). |
| `question_options` | Pilihan + `is_correct`; hanya dibaca server. |
| `question_answers` | Jawaban alternatif untuk tipe isian; `is_case_sensitive`. |
| `question_media` | Gambar/audio/video per soal. |
| `question_pairs` | Pasangan `left_id`/`right_id` + label untuk `matching_pairs`; unik per sisi dan urutan. |

### Progres

- `user_course_progress` — XP course dan jumlah lesson selesai (PK `user_id, course_id`).
- `user_node_progress` — status node, skor terbaik, jumlah attempt, waktu selesai.
- `lesson_attempts` — satu attempt per pengerjaan; unique index menjaga hanya satu attempt
  `in_progress` per pemain dan lesson.
- `answer_attempts` — jawaban per soal; unique `(attempt_id, question_id)` mencegah hitung ganda.
- `practice_sessions` — sesi latihan per pemain + course, mode, jumlah soal, skor, combo
  terbaik, batas waktu, akurasi, status.
- `practice_session_questions` — daftar soal yang sah untuk satu sesi; mencegah pemain
  mengirim soal di luar sesi.
- `practice_answers` — jawaban latihan, poin, combo, waktu menjawab; unique
  `(session_id, question_id)`.

### Friends Quest (co-op minimal)

- `friend_quests` — kode unik 6 karakter, judul, target XP, hadiah XP/Koin, maksimal
  anggota, pembuat, status (`active`/`completed`/`expired`), waktu mulai/berakhir.
- `friend_quest_members` — keanggotaan dan `contribution_xp` per pemain; PK
  `(quest_id, user_id)`.
- `friend_quest_claims` — klaim hadiah per anggota; PK `(quest_id, user_id)` mencegah klaim
  ganda.

Tabel ini sengaja belum menjadi graf pertemanan penuh. Friend request, friendships,
activity feed, dan leaderboard tetap Tahap 7.

### Ekonomi dan progres pemain

- `user_xp_ledger` — setiap pemberian XP, unik per `lesson_attempt_id`, unik per
  `practice_session_id`, dan unik per `(friend_quest_id, user_id)` untuk hadiah quest.
- `coin_transactions` — mutasi Koin, unik per `lesson_attempt_id`, dan unik per
  `(friend_quest_id, user_id)` untuk hadiah quest. Refill Hearts menulis transaksi negatif
  dengan `source = 'heart_refill'`.
- `user_wallets` — saldo Koin, check `coins >= 0`.
- `player_levels` — 30 ambang level dan judul; level 1 = 0 XP, level 2 = 100 XP, level 7+
  memakai kurva `1000 + (level - 6) × 350`. Tabel ini data katalog, bukan state pemain.
- `user_hearts` — `current_hearts`/`max_hearts` (default 5/5), `last_refill_at`. Satu Heart
  pulih per 30 menit; refill manual biaya 10 Koin per Heart yang hilang.
- `user_streaks` — `current_streak`, `longest_streak`, `last_activity_date`, dan
  `last_activity_at`; hari aktivitas dihitung dari XP `lesson`/`practice` yang ditulis
  server, memakai `user_settings.timezone`.

Mastery, quest harian/mingguan, achievement, shop, dan inventory **belum dibuat**.

## View

| View | Kegunaan |
| --- | --- |
| `lesson_question_stats` | Jumlah soal, topik, dan tipe per lesson. Tidak memuat kunci. |
| `subject_overview` | Agregat level/unit/lesson/soal per mapel untuk katalog. |

Keduanya `security_invoker` dan hanya diberi grant ke `authenticated`.

## Fungsi

| Fungsi | Kegunaan |
| --- | --- |
| `set_updated_at()` | Trigger `updated_at`. |
| `current_user_role()`, `has_role()`, `is_staff()` | Otoritas role dari tabel, bukan metadata. |
| `handle_new_user()` | Trigger `auth.users` → profil, settings, role `player`. |
| `complete_onboarding(...)` | Atomik: profil + target/zona waktu + flag onboarding. |
| `bootstrap_developer(email)`, `promote_developer(email)` | Hanya SQL Editor. |
| `normalize_answer_text(text)` | Normalisasi spasi/kapital untuk penilaian teks. |
| `grade_question(question_id, answer)` | Penilaian server berdasarkan tipe soal. |
| `start_lesson(node_id)` | Validasi akses/unlock, buat attempt, kirim soal tanpa kunci. |
| `submit_attempt_answer(attempt, question, answer)` | Nilai, simpan sekali, kembalikan feedback. |
| `complete_lesson_attempt(attempt)` | Hitung hasil, tulis progres, XP, Koin tepat sekali. |
| `difficulty_rank(difficulty)` | Urutan kesulitan untuk Ramp Up dan fallback legendary. |
| `course_question_ids(course_id)` | Scope soal published untuk semua mode latihan; tidak dapat dipanggil pemain. |
| `correct_answer_text(question_id)` | Teks jawaban benar untuk feedback; tidak pernah dikirim sebelum menjawab. |
| `start_practice(mode, course_id, unit_id)` | Pilih soal sesuai mode, buat sesi, kirim soal tanpa kunci. |
| `submit_practice_answer(session, question, answer, elapsed)` | Nilai, hitung combo + bonus kecepatan, simpan sekali. |
| `complete_practice_session(session)` | Hitung akurasi/skor, tulis XP latihan tepat sekali. |
| `track_friend_quest_progress()` | Trigger `user_xp_ledger`: menambah kontribusi ke semua quest aktif anggota; XP hadiah quest dikecualikan. |
| `friend_quest_payload(quest, viewer)` | Menyusun progres, anggota, kontribusi, status klaim; internal. |
| `create_friend_quest(title, target, reward_xp, reward_coins)` | Membuat kode unik, quest, dan keanggotaan pembuat; maksimal 3 quest aktif. |
| `join_friend_quest(code)` | Bergabung dengan kode; idempoten bila sudah menjadi anggota. |
| `get_my_friend_quests()` | Daftar quest yang diikuti pemain, terbaru lebih dulu. |
| `claim_friend_quest_reward(quest)` | Klaim sekali per anggota; menulis XP/Koin dan wallet secara atomik. |
| `is_friend_quest_member`, `is_my_friend_quest_member` | Helper RLS; varian `is_my_...` di-grant ke `authenticated`. |
| `ensure_player_progress(user)` | Membuat baris Hearts/Streak bila belum ada; internal. |
| `refresh_hearts(user)` | Menerapkan regenerasi 30 menit dan mengembalikan snapshot Hearts; internal. |
| `player_level_for_xp(xp)` | Menghitung level, judul, ambang berikutnya, dan persentase dari total XP. |
| `get_player_state()` | RPC baca pemain: total XP, XP hari ini, Koin, Hearts, Streak, dan level. |
| `get_my_wallet()` | RPC wallet: state pemain + 30 transaksi Koin + 30 transaksi XP terakhir. |
| `refill_hearts()` | Mengisi Hearts yang hilang, memotong Koin, dan menulis transaksi secara atomik. |
| `spend_heart_for_wrong_answer()` | Trigger `AFTER INSERT answer_attempts`: kurangi Heart hanya untuk jawaban salah yang benar-benar tersimpan. |
| `enforce_hearts_before_lesson()` | Trigger `BEFORE INSERT lesson_attempts`: tolak attempt lesson baru bila Hearts 0. |
| `track_user_streak()` | Trigger `AFTER INSERT user_xp_ledger`: perbarui Streak dari XP lesson/practice. |

Semua fungsi `security definer` memakai `set search_path` eksplisit. Fungsi engine di-revoke
dari `public`/`anon` dan hanya dapat dieksekusi `authenticated`.

## Alur penilaian dan reward

1. `start_lesson` memeriksa node aktif, lesson dipublikasikan, mapel aktif, dan urutan unlock.
   Staff boleh membuka di luar urutan untuk pratinjau.
2. Payload soal berisi id, tipe, instruksi, prompt, hint, poin, opsi (tanpa `is_correct`),
   media, serta `leftItems`/`rightItems` terpisah untuk matching. Relasi pasangan tidak
   pernah dikirim sebagai baris berpasangan; kolom kanan diurutkan dengan `md5(right_id)`
   agar urutan tidak membocorkan jawaban.
3. `submit_attempt_answer` menilai lewat `grade_question`, menyimpan `answer_attempts`
   dengan `unique (attempt_id, question_id)`, dan mengembalikan penjelasan + jawaban benar.
4. `complete_lesson_attempt` menolak bila masih ada soal belum dijawab. Attempt yang sudah
   `completed` mengembalikan `alreadyCompleted` tanpa reward tambahan.
5. XP/Koin hanya diberikan saat node **pertama kali** lulus (akurasi ≥ 60%). Reward masuk
   ledger dan wallet dalam transaksi yang sama, dilindungi advisory lock per user+node.
6. Replay lesson yang sudah selesai menambah `attempts` dan skor terbaik, tetapi tidak
   menambah XP/Koin.

## Alur Hearts, Streak, dan level

1. `start_lesson` membuat baris `lesson_attempts`; trigger `BEFORE INSERT` menyegarkan Hearts
   dan menolak attempt baru dengan `hearts_empty` bila lesson memakai Hearts dan saldo 0.
   Attempt yang sudah berjalan tetap dapat dijawab/diselesaikan.
2. `submit_attempt_answer` menyimpan jawaban sekali. Trigger `AFTER INSERT answer_attempts`
   mengurangi satu Heart hanya untuk jawaban salah yang benar-benar masuk; duplicate answer
   yang ditolak `ON CONFLICT DO NOTHING` tidak mengurangi Heart lagi. Practice tidak memakai
   Hearts.
3. Setiap XP `lesson`/`practice` memicu `track_user_streak`. Hari dihitung memakai zona waktu
   pemain; XP `friend_quest_reward` tidak memperpanjang Streak. Hari yang terlewat membuat
   Streak kembali 1 saat aktivitas berikutnya.
4. Level tidak disimpan sebagai angka yang bisa dikirim client. `get_player_state` menjumlahkan
   `user_xp_ledger` lalu menghitung level dari `player_levels`.
5. `refill_hearts` menghitung biaya di server (10 Koin × Heart yang hilang), mengunci wallet,
   memotong saldo, menulis `coin_transactions`, dan mengisi Hearts dalam satu transaksi.

## Alur latihan (practice)

1. `start_practice` memvalidasi pemain, course published, mapel aktif, dan unit bila mode
   `unit_review`. Soal dipilih dari `course_question_ids`, disimpan ke
   `practice_session_questions`, lalu dikirim tanpa `is_correct`.
2. Mode berwaktu menyimpan `time_limit_seconds` (120 timed, 90 match madness). Ramp Up
   memakai batas 20 detik per soal di UI; server tetap menilai jawaban kosong sebagai salah.
3. `submit_practice_answer` menilai lewat `grade_question`, menyimpan satu jawaban per soal,
   menghitung combo dari jawaban sebelumnya, menambah bonus kecepatan (≤ 2 poin bila
   dijawab ≤ 6 detik) dan bonus combo (≤ 5).
4. `complete_practice_session` menghitung akurasi dari jumlah soal sesi (bukan hanya yang
   terjawab), lalu memberi XP bila akurasi ≥ 60%: maksimal 20 untuk mode biasa, 30 untuk
   legendary. XP ditulis ke `user_xp_ledger` dengan `practice_session_id` unik sehingga
   penyelesaian ulang tidak menambah XP.
5. Sesi boleh selesai dengan sebagian jawaban (timeout), tetapi sesi tanpa jawaban sama
   sekali ditolak.

## Alur Friends Quest

1. `create_friend_quest` memvalidasi judul, target (20–10.000), hadiah (0–1.000), dan batas
   3 quest aktif. Kode 6 karakter dibuat dari UUID dengan retry bila bentrok.
2. `join_friend_quest` mengunci baris quest, menolak quest selesai/kedaluwarsa/penuh, dan
   mengembalikan payload yang sama bila pemain sudah menjadi anggota. Maksimal 8 anggota.
3. Setiap XP baru dari `lesson` atau `practice` memicu `track_friend_quest_progress` dan
   menambah `contribution_xp` pemain ke semua quest aktif yang diikuti. XP dari
   `friend_quest_reward` tidak dihitung.
4. Quest otomatis menjadi `completed` ketika total kontribusi anggota mencapai target.
   Status `expired` dihitung saat payload dibaca bila `ends_at` sudah lewat.
5. `claim_friend_quest_reward` hanya untuk anggota, hanya setelah target tercapai dan
   sebelum kedaluwarsa. Klaim ditulis ke `friend_quest_claims`, `user_xp_ledger`, dan
   `coin_transactions` dengan kunci unik; klaim kedua mengembalikan `alreadyClaimed: true`.

## RLS dan grant

| Tabel | SELECT | Tulis |
| --- | --- | --- |
| `profiles` | semua authenticated | baris sendiri, kolom terbatas (grant kolom). |
| `user_settings` | baris sendiri | baris sendiri, kolom preferensi. |
| `user_roles` | sendiri atau staff | tidak ada. |
| Tabel kurikulum | authenticated, hanya baris published/active | tidak ada. |
| `questions`, opsi, jawaban, media, pairs | **tidak ada** grant ke pemain | server-side RPC saja. |
| Progres & attempt | baris sendiri | tidak ada; hanya RPC. |
| `practice_sessions` / `practice_answers` | baris sendiri | tidak ada; hanya RPC. |
| `practice_session_questions` | **tidak ada** grant | server-side RPC saja. |
| Wallet, ledger, Hearts & Streak | baris sendiri | tidak ada; hanya RPC/trigger. |
| `player_levels` | semua authenticated | tidak ada; hanya migration/service. |
| `friend_quests`, `friend_quest_members` | hanya anggota quest | tidak ada; hanya RPC. |
| `friend_quest_claims` | hanya klaim sendiri | tidak ada; hanya RPC. |

`anon` tidak punya akses ke tabel kurikulum, progres, ekonomi, atau Friends Quest.
`service_role` dan secret key tidak boleh berada di browser.

## Menjalankan migration

### Opsi A — SQL Editor (pemula)

Jalankan berurutan sesuai nama file di `supabase/migrations/`:

1. `20261108090000_identity.sql`
2. `20261108100000_curriculum.sql`
3. `20261108105000_curriculum_overview.sql`
4. `20261108107000_question_pairs.sql`
5. `20261108109000_question_scenes.sql`
6. `20261108110000_curriculum_seed.sql`
7. `20261108120000_lesson_engine.sql`
8. `20261109100000_practice_engine.sql`
9. `20261110100000_friends_quest.sql`
10. `20261110120000_progression_economy.sql`

Pastikan tidak ada error, lalu cek Table Editor: `subjects`, `lessons`, `questions`,
`lesson_attempts`, `user_wallets`, `user_hearts`, `user_streaks`, `player_levels`,
`practice_sessions`, `friend_quests`.

### Opsi B — Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## Bootstrap developer

1. Daftar lewat aplikasi dan verifikasi email.
2. Di SQL Editor:

```sql
select public.bootstrap_developer('email-kamu@contoh.com');
```

3. Logout dan login lagi agar role dimuat ulang.

Jangan memberi role lewat form frontend atau menyimpan password developer di kode.

## Menambah tabel baru

1. Buat migration baru; jangan edit migration yang sudah dijalankan.
2. Aktifkan RLS dan tulis policy eksplisit.
3. Revoke grant default; beri grant kolom bila ada kolom yang tidak boleh diubah pemain.
4. Index foreign key dan kolom filter utama.
5. Perbarui tipe `Database` di `src/types/database.ts`.
6. Tambahkan smoke check RLS dua pengguna di `scripts/test-sql.mjs`.

## Rencana skema berikutnya

- Mastery, review schedule, mistake history.
- Quest harian/mingguan, achievement, shop, inventory, reward grant/claim.
- Graf pertemanan penuh (friend request, friendships, friend streak), activity feed,
  leaderboard, liga, event, notifikasi, inbox.
- Reward Center developer + audit log.
- Entitlement premium dan produk.
