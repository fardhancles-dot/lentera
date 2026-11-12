# Database

Database: PostgreSQL di Supabase. Migration ada di `supabase/migrations/`.

> **Status:** kelima belas migration sudah diterapkan ke project Supabase nyata
> (`xvrnmxbrxhtzzavmrlvy`, region Singapura), termasuk perbaikan view katalog
> `20261110150000_subject_overview_owner.sql`, migration sosial/liga
> `20261111100000_social_league.sql`, dan migration Developer Dashboard
> `20261111110000_developer_dashboard.sql` yang diterapkan lewat Management API. Smoke test
> PGlite (262 check) dan verifikasi API Supabase (83 check) lulus, termasuk Friends Quest,
> progression/economy, reward/quest/achievement/toko, pertemanan, liga, event, notifikasi,
> privasi profil, serta overview/pencarian/Reward Center/audit log staff. Pengujian UI
> browser terpisah.
>
> Untuk menerapkan migration baru tanpa CLI ter-link, gunakan
> `SUPABASE_ACCESS_TOKEN=sbp_xxx npm run db:apply-catalog-fix` (`--dry-run` untuk melihat
> SQL target); skrip menerapkan file lalu memverifikasi view lewat PostgREST.

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
| `20261110130000_tahap5_rewards.sql` | Reward level, milestone Streak + freeze, quest, achievement, katalog toko, inventory, RPC klaim/pembelian/pakai, RLS. |
| `20261110140000_mastery_review_rewards.sql` | Mastery per soal, jadwal review, mode `scheduled_review`, node `reward` per level, RPC klaim hadiah, RLS. |
| `20261110150000_subject_overview_owner.sql` | Menjalankan `subject_overview` dengan hak owner agar katalog tidak gagal saat `questions` di-revoke dari pemain. |
| `20261111100000_social_league.sql` | Pertemanan, notifikasi, 10 tier liga + grup/ hasil mingguan, leaderboard, event mingguan, privasi profil, RPC sosial, trigger XP liga, dan RLS. |
| `20261111110000_developer_dashboard.sql` | `audit_logs` append-only, helper `log_audit`, overview/pencarian staff, Reward Center satu akun, broadcast notifikasi (maks. 500), dan RLS staff-only. |
| `20261113100000_auto_levels.sql` | `learning_nodes.question_id` + `level_number`, backfill 8 level lama, RPC `admin_create_question_level`, start lesson memakai soal level, statistik katalog berbasis level. |

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
| `learning_nodes` | `node_type` 7 jenis (semua terisi: lesson, review, challenge, practice, checkpoint, legendary, reward), opsional `lesson_id`, urutan dalam unit, plus `reward_coins`/`reward_xp` untuk node reward. |
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
- `user_question_mastery` — level mastery, hitungan benar/salah, interval, dan
  `next_review_at` per `(user_id, question_id)`; ditulis hanya oleh trigger jawaban.
- `user_reward_claims` — penanda node hadiah yang sudah diklaim; unik per
  `(user_id, node_id)`, dengan jumlah Koin/XP yang diberikan.

### Friends Quest (co-op minimal)

- `friend_quests` — kode unik 6 karakter, judul, target XP, hadiah XP/Koin, maksimal
  anggota, pembuat, status (`active`/`completed`/`expired`), waktu mulai/berakhir.
- `friend_quest_members` — keanggotaan dan `contribution_xp` per pemain; PK
  `(quest_id, user_id)`.
- `friend_quest_claims` — klaim hadiah per anggota; PK `(quest_id, user_id)` mencegah klaim
  ganda.

### Sosial dan liga

- `friendships` — satu baris per pasangan (`least`/`greatest`), status `pending`/
  `accepted`/`declined`, `requester_id`, `addressee_id`, waktu dibuat/direspons.
- `notifications` — notifikasi per pemain (`friend_request`, `friend_accepted`,
  `league_result`, `info`), tautan internal, dan `read_at`.
- `league_tiers` — 10 tier dari Benih sampai Lentera beserta accent.
- `league_groups`, `league_members` — grup mingguan per tier (maks. 30 pemain) dan XP
  mingguan anggota; tanpa grant baca langsung ke pemain.
- `league_results` — hasil finalisasi per pemain/minggu: rank, jumlah anggota, outcome,
  tier berikutnya, hadiah, dan waktu klaim.
- `game_events`, `user_event_claims` — event mingguan (100 XP → 25 Koin) dan klaim
  idempoten per pemain/event.

### Developer dan audit

- `audit_logs` — aktor (`auth.uid()`), role saat aksi, action, target, detail JSONB, waktu.
  Append-only: hanya SELECT staff yang di-grant; INSERT/UPDATE/DELETE tidak diberikan ke
  `anon`/`authenticated`. Penulisan hanya lewat helper internal `log_audit` yang dipanggil
  RPC `security definer`.

### Ekonomi dan progres pemain

- `user_xp_ledger` — setiap pemberian XP, unik per `lesson_attempt_id`, unik per
  `practice_session_id`, unik per `(friend_quest_id, user_id)` untuk hadiah quest, dan unik
  per `reward_claim_id` untuk hadiah node.
- `coin_transactions` — mutasi Koin, unik per `lesson_attempt_id`, unik per
  `(friend_quest_id, user_id)` untuk hadiah quest, `reference_id` unik per
  `(user_id, source)` untuk reward baru, dan unik per `reward_claim_id` untuk hadiah node.
  Refill Hearts menulis transaksi negatif dengan `source = 'heart_refill'`.
- `user_wallets` — saldo Koin, check `coins >= 0`.
- `player_levels` — 30 ambang level, judul, dan `reward_coins`; level 1 = 0 XP, level 2 = 100
  XP, level 7+ memakai kurva `1000 + (level - 6) × 350`. Tabel ini data katalog, bukan state
  pemain.
- `user_hearts` — `current_hearts`/`max_hearts` (default 5/5), `last_refill_at`. Satu Heart
  pulih per 30 menit; refill manual biaya 10 Koin per Heart yang hilang.
- `user_streaks` — `current_streak`, `longest_streak`, `last_activity_date`,
  `last_activity_at`, dan `freezes` (0–2); hari aktivitas dihitung dari XP
  `lesson`/`practice` yang ditulis server, memakai `user_settings.timezone`.
- `user_level_rewards` — penanda level yang hadiah Koin-nya sudah diberikan; unik per
  `(user_id, level)`.

### Reward, misi, achievement, dan toko

- `streak_milestones` — katalog hari 3/7/14/30/60/100 dan hadiah Koin.
- `user_streak_milestones` — penanda milestone yang sudah diklaim; unik per
  `(user_id, milestone_id)`.
- `quest_definitions` — 3 misi harian + 3 mingguan (cadence, metric, target, hadiah).
- `user_quest_claims` — klaim unik per `(user_id, quest_id, period_start)`.
- `achievement_definitions` — 8 pencapaian (lesson, practice, XP, Streak, level).
- `user_achievements` — pencapaian yang terbuka; PK `(user_id, achievement_id)`.
- `shop_items` — katalog consumable, harga, dan `max_stack`.
- `user_inventory` — jumlah item per pemain; unik per `(user_id, item_id)`.
- `shop_purchases` — catatan pembelian dengan `price_coins` dan `quantity`.

Mastery disimpan per soal (bukan per lesson) agar jadwal review bisa presisi. Belum ada
tabel mastery per topik terpisah; agregasi topik diturunkan dari `questions.topic`.

## View

| View | Kegunaan |
| --- | --- |
| `lesson_question_stats` | Jumlah soal, topik, dan tipe per lesson. Tidak memuat kunci. |
| `subject_overview` | Agregat level/unit/lesson/soal per mapel untuk katalog. |

Keduanya hanya diberi grant ke `authenticated`. `lesson_question_stats` berjalan dengan
hak owner sejak awal; `subject_overview` sempat memakai `security_invoker = true` sehingga
membaca `questions` sebagai pemain dan gagal dengan `permission denied`. Migration
`20261110150000` mengembalikannya ke hak owner karena view hanya mengembalikan agregat.

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
| `get_my_wallet()` | RPC wallet: state pemain + 30 transaksi Koin + 30 transaksi XP terakhir + katalog hadiah level/milestone. |
| `get_my_quests()` | Misi aktif dengan progres dari `user_xp_ledger` dan status klaim. |
| `claim_quest_reward(quest)` | Klaim sekali per periode; menulis Koin/wallet secara atomik. |
| `get_my_achievements()` | Delapan pencapaian + progres + waktu terbuka. |
| `get_shop_catalog()` | Katalog item, jumlah dimiliki, dan `canBuy` dari server. |
| `purchase_shop_item(item)` | Membeli item, memotong Koin, dan menambah inventory secara atomik. |
| `get_my_inventory()` | Tas pemain dan jumlah Perisai Streak. |
| `use_inventory_item(item)` | Memakai Ramuan Hati/Perisai Streak dan mengembalikan state terbaru. |
| `grant_level_rewards(user)` | Memberi hadiah Koin tiap level baru sekali; internal. |
| `grant_streak_milestones(user)` | Memberi hadiah milestone Streak sekali; internal. |
| `evaluate_achievements(user)` | Membuka achievement yang targetnya tercapai; internal. |
| `sync_player_rewards()` | Trigger `user_xp_ledger`: memanggil reward level, milestone, dan achievement. |
| `refill_hearts()` | Mengisi Hearts yang hilang, memotong Koin, dan menulis transaksi secara atomik. |
| `spend_heart_for_wrong_answer()` | Trigger `AFTER INSERT answer_attempts`: kurangi Heart hanya untuk jawaban salah yang benar-benar tersimpan. |
| `enforce_hearts_before_lesson()` | Trigger `BEFORE INSERT lesson_attempts`: tolak attempt lesson baru bila Hearts 0. |
| `track_user_streak()` | Trigger `AFTER INSERT user_xp_ledger`: perbarui Streak dari XP lesson/practice. |
| `record_question_mastery(user, question, correct)` | Hitung level mastery dan `next_review_at`; internal, dipanggil trigger. |
| `track_lesson_mastery()`, `track_practice_mastery()` | Trigger `AFTER INSERT answer_attempts`/`practice_answers`. |
| `create_practice_session_from_ids(...)` | Membuat sesi latihan dari daftar soal eksplisit; internal. |
| `start_scheduled_review(course_id)` | Membuat sesi dari maksimal 10 soal yang jatuh tempo; menolak `practice_no_due_reviews`. |
| `get_my_mastery()` | RPC mastery: ringkasan + agregat per course (terlacak, dikuasai, jatuh tempo, akurasi). |
| `claim_reward_node(node_id)` | Memeriksa seluruh lesson level selesai, lalu menulis Koin/XP sekali; idempoten. |
| `search_players(query)` | Cari maksimal 10 pemain (kecuali diri sendiri) + status relasi; query minimal 2 karakter. |
| `send_friend_request(username)` | Membuat/mengaktifkan relasi `pending`, menolak diri sendiri dan relasi yang sudah ada; mengirim notifikasi. |
| `respond_friend_request(request_id, accept)` | Hanya addressee; mengubah status `accepted`/`declined` dan memberi notifikasi ke pengirim bila diterima. |
| `remove_friend(user_id)` | Menghapus relasi dua arah; idempoten. |
| `get_my_friends()` | Teman (XP mingguan, total XP, level, streak bersama) + permintaan masuk/keluar. |
| `get_friend_profile(username)` | Profil + statistik yang difilter `profile_visibility` dan relasi teman. |
| `get_friend_activity(limit)` | Aktivitas XP/pencapaian terbaru teman yang statistiknya terlihat. |
| `get_leaderboard(scope)` | 50 peringkat XP mingguan global/teman + posisi pemain; privat dikecualikan dari global. |
| `get_my_league()` | Membuat/membaca grup mingguan, finalisasi minggu lalu, peringkat anggota, zona promosi/degradasi, hasil terakhir, dan riwayat. |
| `claim_league_reward(week_start)` | Membayar hadiah hasil liga sekali; klaim kedua `alreadyClaimed`. |
| `get_active_event()` | Event mingguan berjalan, progres XP terbatas target, status klaim. |
| `claim_event_reward()` | Membayar Koin event sekali setelah target XP tercapai; idempoten. |
| `get_my_notifications()` | 30 notifikasi terbaru + jumlah belum dibaca. |
| `mark_notifications_read(id)` | Menandai satu atau semua notifikasi milik sendiri sebagai dibaca. |
| `log_audit(action, target_type, target_id, details)` | Helper internal append-only; aktor dari `auth.uid()`, di-revoke dari API. |
| `get_developer_overview()` | Ringkasan pemain, aktivitas, konten, dan jumlah audit; staff-only. |
| `get_developer_users(query)` | Cari maksimal 25 pemain berdasarkan email/username/nama; staff-only. |
| `get_audit_logs(limit)` | 1–100 entri audit terbaru; staff-only. |
| `grant_reward(user, coins, xp, reason)` | Reward Center satu akun: validasi 0–10.000 Koin/0–100.000 XP, tulis ledger + wallet + audit atomik. |
| `broadcast_notification(title, body, link)` | Notifikasi `info` ke maksimal 500 pemain onboarded, tautan internal, audit; staff-only. |

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
   pemain; XP `friend_quest_reward` tidak memperpanjang Streak. Bila satu hari terlewat dan
   `freezes > 0`, satu Perisai Streak dikonsumsi; jika tidak, Streak kembali 1.
4. Level tidak disimpan sebagai angka yang bisa dikirim client. `get_player_state` menjumlahkan
   `user_xp_ledger` lalu menghitung level dari `player_levels`.
5. `refill_hearts` menghitung biaya di server (10 Koin × Heart yang hilang), mengunci wallet,
   memotong saldo, menulis `coin_transactions`, dan mengisi Hearts dalam satu transaksi.
6. Trigger `AFTER INSERT user_xp_ledger` (`sync_player_rewards`) memberi hadiah level baru dan
   milestone Streak sekali, lalu membuka achievement yang targetnya tercapai.

## Alur reward, misi, dan toko

1. Progres quest dihitung dari `user_xp_ledger` pada periode harian/mingguan (zona waktu
   pemain). XP `friend_quest_reward` tidak dihitung. `claim_quest_reward` mengunci baris
   klaim, memvalidasi target, menulis `user_quest_claims`, `coin_transactions`, dan wallet.
2. `purchase_shop_item` mengunci wallet, memvalidasi harga/stok, menulis `shop_purchases`,
   `coin_transactions`, dan menambah `user_inventory` dalam satu transaksi.
3. `use_inventory_item` mengurangi quantity, memulihkan Hearts (maksimal `max_hearts`) atau
   menambah `user_streaks.freezes` (maksimal 2). Item yang tidak dimiliki ditolak.
4. Achievement dan reward level/milestone tidak memberi hadiah yang bisa dikirim client;
   semuanya dipicu dari ledger XP dan idempoten dengan kunci unik.

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

## Alur sosial, liga, dan event

1. `search_players` hanya mengembalikan username, nama tampilan, avatar, dan bio pendek;
   email tidak pernah dibaca dari `auth.users`. Status relasi dihitung dari `friendships`.
2. Permintaan teman disimpan satu baris per pasangan (unique pada pasangan `least`/
   `greatest`). Hanya addressee yang boleh menerima/menolak; `remove_friend` menghapus
   relasi sehingga kedua pihak langsung kehilangan akses statistik teman.
3. `get_friend_profile` membuka statistik bila pemain adalah dirinya sendiri, visibilitas
   `public`, atau visibilitas `friends` dan relasinya `accepted`. Mode `private` selalu
   menyembunyikan statistik dari pemain lain, termasuk teman.
4. `get_leaderboard` menghitung XP dari `user_xp_ledger` sumber `lesson`/`practice` pada
   minggu UTC berjalan. Cakupan global mengecualikan profil `private`; cakupan teman hanya
   memuat diri sendiri dan teman.
5. Liga memakai sepuluh tier (Benih sampai Lentera). `get_my_league` membuat grup maksimal
   30 pemain per tier/minggu dan memfinalisasi grup minggu lalu saat dibaca: 5 teratas naik
   tier (kecuali tier 10), 5 terbawah turun tier bila grup berisi minimal 10 pemain, dan
   hadiah Koin `10 + tier × 5` ditulis ke `league_results`. Klaim hadiah idempoten.
6. Event mingguan default adalah Festival Lentera: 100 XP → 25 Koin. Progres memakai XP
   mingguan yang sama; klaim idempoten lewat `user_event_claims` dan transaksi Koin.
7. Notifikasi dibuat trigger/RPC untuk permintaan teman, penerimaan, hasil liga, dan
   event; `mark_notifications_read` hanya menyentuh baris milik pemanggil.

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
| Wallet, ledger, Hearts, Streak & reward | baris sendiri | tidak ada; hanya RPC/trigger. |
| `player_levels`, `streak_milestones`, `quest_definitions`, `achievement_definitions`, `shop_items` | semua authenticated | tidak ada; katalog baca-saja. |
| `user_quest_claims`, `user_achievements`, `user_inventory`, `shop_purchases` | baris sendiri | tidak ada; hanya RPC. |
| `friend_quests`, `friend_quest_members` | hanya anggota quest | tidak ada; hanya RPC. |
| `friend_quest_claims` | hanya klaim sendiri | tidak ada; hanya RPC. |
| `friendships` | relasi yang melibatkan pemain | tidak ada; hanya RPC. |
| `notifications` | baris sendiri | tidak ada; hanya RPC/trigger. |
| `league_tiers` | semua authenticated | tidak ada; katalog baca-saja. |
| `league_results`, `user_event_claims` | baris sendiri | tidak ada; hanya RPC. |
| `league_groups`, `league_members` | **tidak ada** grant | server-side RPC saja. |
| `game_events` | semua authenticated untuk event aktif | tidak ada; server-side RPC. |

`anon` tidak punya akses ke tabel kurikulum, progres, ekonomi, Friends Quest, sosial,
liga, atau notifikasi.
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
11. `20261110130000_tahap5_rewards.sql`
12. `20261110140000_mastery_review_rewards.sql`
13. `20261110150000_subject_overview_owner.sql`
14. `20261111100000_social_league.sql`

Pastikan tidak ada error, lalu cek Table Editor: `subjects`, `lessons`, `questions`,
`lesson_attempts`, `user_wallets`, `user_hearts`, `user_streaks`, `player_levels`,
`practice_sessions`, `friend_quests`, `quest_definitions`, `shop_items`, `user_inventory`,
`friendships`, `notifications`, `league_tiers`, `league_groups`, `league_members`,
`league_results`, `game_events`, `user_event_claims`.

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

- Inbox/notifikasi lanjutan (paginasi, preferensi per jenis).
- Content management (mapel/lesson/soal) dan editor Bahasa Sambas; belum termasuk
  Developer Dashboard iterasi ini.
- Entitlement premium dan produk.
