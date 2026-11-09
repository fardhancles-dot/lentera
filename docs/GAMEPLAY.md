# Gameplay

> **Status: lesson engine, Practice Hub, dan 20 dari 20 mini-game berjalan.**
> Listening memakai audio tersimpan atau text-to-speech browser; Speaking memakai Web
> Speech Recognition dengan alternatif menulis dan tanpa skor pengucapan palsu.
> Conversation memakai dialog bertahap dengan respons NPC berbeda, Story meminta pilihan
> respons sebelum lanjut, dan Fill in the Blank mendukung beberapa rumpang. Tujuh mode
> latihan memakai sesi server dengan timer, combo, dan XP idempoten. **Friends Quest**
> tersedia sebagai co-op berbasis kode undangan; graf teman penuh tetap Tahap 7.
> **Hearts, Streak, level akun, wallet, reward level, milestone Streak, quest,
> achievement, toko, dan inventory** sudah aktif dan dihitung di server. Mastery belum
> dibuat.

## Yang benar-benar ada sekarang

- Maskot Kiko di landing, halaman auth, hasil lesson, dan sidebar: vector Phaser dengan
  idle, blink, wave, celebrate.
- Katalog mapel dari database, termasuk status pengembangan bahasa daerah.
- Learning path per mapel: level → unit → node, dengan status selesai/aktif/terkunci.
- Detail lesson: topik, jenis soal, tujuan unit, XP/Koin, syarat mulai.
- Layar lesson: progress bar, hint, pilihan ganda, input teks, word bank, sentence
  builder, matching pairs, fill in the blank inline (satu atau banyak rumpang), picture
  identification, tombol periksa, feedback benar/salah, penjelasan, jawaban benar, dan
  tombol lanjut.
- Hasil lesson: akurasi, jumlah benar, durasi, poin, XP/Koin yang benar-benar diberikan,
  serta pesan bila hadiah tidak diberikan karena replay.
- Penilaian, progres, dan reward ditulis RPC server. Browser tidak menerima kunci jawaban.

## Alur lesson yang berjalan

```text
Klik node
  → start_lesson(node_id)
      validasi mapel/lesson aktif + urutan unlock
      buat attempt unik, kirim soal tanpa kunci
  → render satu soal per layar
  → submit_attempt_answer(attempt, question, answer)
      nilai di server, simpan sekali, kirim feedback
  → ulangi sampai semua soal terjawab
  → complete_lesson_attempt(attempt)
      hitung akurasi, simpan progres node/course
      XP + Koin hanya saat lulus pertama kali
  → halaman hasil
```

Aturan yang sudah ditegakkan:

1. **Attempt idempotent.** Satu attempt hanya menghasilkan reward sekali.
2. **Server otoritatif.** Client hanya mengirim jawaban; tidak pernah XP, Koin, atau status.
3. **Bank soal adalah sumber kunci jawaban.** Tidak ada AI yang boleh mengubah kunci.
4. **Progres per mata pelajaran.** `user_course_progress` dan `user_node_progress` terpisah.
5. **Replay.** Lesson selesai boleh dimainkan lagi, tetapi tidak memberi XP/Koin tambahan.
6. **Lulus.** Akurasi minimal 60% dari jumlah soal; gagal tetap menyimpan attempt.

## Dua puluh mini-game

| # | Mini-game | Mekanik inti | Status |
| --- | --- | --- | --- |
| 1 | Multiple Choice | Pilih satu dari 2–4 opsi. | **Implemented · Tested (SQL)** |
| 2 | Word Bank | Susun jawaban dari kata yang disediakan dengan mengetuk kata. | **Implemented · Tested (SQL)** |
| 3 | Sentence Builder | Acak kata, susun urutan kalimat. | **Implemented · Tested (SQL)** |
| 4 | Listening Challenge | Putar audio, ulangi, versi lambat, volume, lalu pilih jawaban. | **Implemented · Tested (SQL)** · audio = media atau TTS browser |
| 5 | Speaking Challenge | Rekaman mikrofon + Speech Recognition + alternatif menulis. | **Implemented · Tested (SQL)** · tanpa skor pengucapan palsu |
| 6 | Typing Challenge | Input teks, validasi ejaan/format. | **Implemented · Tested (SQL)** |
| 7 | Matching Pairs | Cocokkan dua kolom, animasi benar/salah. | **Implemented · Tested (SQL)** |
| 8 | Picture Identification | Pilih nama objek dari gambar. | **Implemented · Tested (SQL)** (3 soal + media) |
| 9 | Fill in the Blank | Isi satu atau beberapa rumpang pada kalimat. | **Implemented · Tested (SQL)** (input inline `__`/`___`, multi-rumpang) |
| 10 | Translation Challenge | Dua arah; susun token atau tulis sendiri, dinilai sebagai teks. | **Implemented · Tested (SQL)** |
| 11 | Conversation Challenge | NPC, bubble dialog, audio per baris, dialog bertahap, respons NPC berbeda per pilihan. | **Implemented · Tested (SQL)** · cabang terbatas pada respons yang ditulis di scene |
| 12 | Story Mode | Layar cerita berurutan, audio, pilihan respons, lalu pertanyaan pemahaman. | **Implemented · Tested (SQL)** |
| 13 | Match Madness | Ronde matching berbatas 90 detik + combo + poin kecepatan. | **Implemented · Tested (SQL)** (mode latihan) |
| 14 | Ramp Up | Soal makin sulit; 20 detik per soal; combo. | **Implemented · Tested (SQL)** (mode latihan) |
| 15 | Timed Challenge | Countdown total 120 detik, 10 soal, bonus waktu. | **Implemented · Tested (SQL)** (mode latihan) |
| 16 | Mistakes Review | Ulangi soal yang pernah dijawab salah. | **Implemented · Tested (SQL)** (riwayat lesson + latihan) |
| 17 | Personalized Practice | Soal dari topik yang sering salah, fallback soal belum dicoba. | **Implemented · Tested (SQL)** |
| 18 | Unit Review | Campuran soal satu unit, maksimal 12 soal. | **Implemented · Tested (SQL)** + unit chooser |
| 19 | Legendary Challenge | Soal dari lesson legendary, XP hingga 30. | **Implemented · Tested (SQL)** |
| 20 | Friends Quest | Target XP gabungan, kontribusi tiap anggota, klaim hadiah sekali. | **Implemented · Tested (SQL + Supabase API)** — co-op kode undangan; UI belum diuji browser |

Catatan implementasi: lima mini-game baru berada di `src/game/minigames/` dan dipilih
lewat registry `createMiniGame`. Halaman lesson tidak lagi memilih renderer berdasarkan
tipe; ia hanya menampilkan `view.prompt`/`view.answer`, mengirim `view.getAnswer()`,
memanggil `setDisabled`, lalu `markResult`. Tipe yang belum punya renderer memakai layar
`unsupported` dengan tombol lewati, bukan input teks yang menyamar sebagai mekanik lain.

Konten contoh tersebar di `bahasa-inggris/greetings-vocabulary` dan beberapa lesson
Bahasa Indonesia. Bahasa Inggris memuat word bank, sentence builder, fill in the blank,
matching, picture identification, listening, speaking, translation, conversation, dan
story. Bahasa Indonesia memuat listening, speaking, fill in the blank dua rumpang,
conversation, story, dan matching. Total seed saat ini **231 soal** dengan 12 tipe soal.

Perbedaan implementasi yang ditegakkan:

- **Ramp Up** mengurutkan soal dari mudah ke sulit dan memberi 20 detik per soal;
  **Timed Challenge** memakai satu countdown total 120 detik dengan 10 soal acak.
- **Match Madness** hanya memakai soal `matching_pairs` (maksimal 3 ronde) dan berbatas
  90 detik; jika mapel tidak punya cukup soal matching, server menolak dengan pesan jelas.
- **Matching Pairs** bukan pilihan ganda: dua kolom, seleksi berpasangan.
- **Listening** memakai `question_media` audio bila ada; jika tidak, transkrip di
  `scene.speech` dibacakan browser. Jika browser tidak mendukung TTS, transkrip ditampilkan
  agar soal tetap jujur, bukan audio palsu.
- **Speaking** memakai Web Speech Recognition. Penilaian hanya memeriksa apakah ucapan
  dikenali, bukan memberi skor pengucapan buatan. Tanpa dukungan browser, pemain memakai
  input alternatif; server tetap menilai teksnya.
- **Conversation** menyimpan NPC, baris dialog, dan respons di `scene`. Dialog berjalan
  bertahap; setiap pilihan menampilkan reaksi NPC yang berbeda sebelum layar berikutnya.
  Cabang mengikuti respons yang ditulis di konten, bukan pohon tak terbatas.
- **Story** menampilkan beberapa layar; layar tertentu mewajibkan pemain memilih respons
  sebelum tombol lanjut aktif. Pertanyaan pemahaman tetap dinilai server.
- **Fill in the Blank** memecah prompt pada setiap penanda `__`/`___`, menampilkan input
  inline sebanyak rumpang, lalu menggabungkan jawaban berurutan untuk dinilai server.
- **Listening/Speaking** memakai `scene.lang` (`en-US` atau `id-ID`) agar pengenalan dan
  pelafalan tidak dipaku ke satu bahasa. Volume slider juga memengaruhi text-to-speech.

## Practice Hub

Route `/practice` menampilkan tujuh mode. Setiap sesi dibuat oleh RPC `start_practice`,
soal dikirim tanpa kunci, dan penyelesaian dihitung server:

| Mode | Seleksi soal | Batas waktu | XP maksimum |
| --- | --- | --- | --- |
| Timed Challenge | 10 soal acak satu course | 120 detik total | 20 |
| Ramp Up | 10 soal urut kesulitan | 20 detik per soal | 20 |
| Match Madness | hingga 3 soal matching | 90 detik total | 20 |
| Mistakes Review | soal yang pernah salah | — | 20 |
| Personalized Practice | topik sering salah / soal belum dicoba | — | 20 |
| Unit Review | maksimal 12 soal satu unit | — | 20 |
| Legendary Challenge | soal lesson legendary (fallback tersulit) | — | 30 |

Aturan practice:

1. Skor dasar berasal dari poin soal; mode berwaktu menambah bonus kecepatan (maksimal 2
   poin bila dijawab ≤ 6 detik) dan bonus combo (maksimal 5). Semua dihitung ulang oleh
   database dari jawaban tersimpan, bukan dari angka kiriman browser.
2. Timeout saat feedback menampilkan tombol lanjut; Ramp Up mengirim jawaban kosong yang
   dinilai salah oleh server.
3. Sesi boleh diselesaikan dengan sebagian jawaban bila waktu habis. Akurasi dihitung dari
   total soal sesi, bukan hanya yang terjawab.
4. XP hanya diberikan bila akurasi ≥ 60% dan ditulis satu kali per sesi di
   `user_xp_ledger` (`practice_session_id` unik). Practice tidak memakai Hearts dan belum
   memberi Koin atau mastery.

## Friends Quest

Route `/friends-quest` menyediakan mini-game co-op #20. Ini bukan graf pertemanan penuh:
undangan memakai **kode enam karakter**, dan kontribusi dihitung dari XP yang sudah ditulis
server, bukan dari angka kiriman browser.

- Pemain membuat quest (judul, target 20–10.000 XP, hadiah XP/Koin) atau bergabung dengan
  kode. Maksimal 3 quest aktif per pemain dan 8 anggota per quest.
- Setiap XP dari `lesson` dan `practice` setelah bergabung menambah kontribusi anggota ke
  semua quest aktifnya. XP hadiah quest tidak dihitung agar tidak menggelembungkan quest
  berikutnya.
- Quest selesai saat total kontribusi anggota mencapai target. Setiap anggota mengklaim
  hadiahnya sendiri satu kali; klaim ganda mengembalikan `alreadyClaimed` tanpa hadiah.
- Hadiah ditulis ke `user_xp_ledger`/`coin_transactions` dengan `friend_quest_id` unik dan
  masuk ke wallet dalam transaksi yang sama.
- RLS hanya mengizinkan anggota membaca quest dan anggotanya; non-anggota ditolak saat
  mencoba klaim.

## Hearts, Streak, level, dan wallet

Route `/wallet` menampilkan saldo Koin, level akun, Hearts, Streak 14 hari, dan riwayat
Koin/XP. Ringkasan Koin/Hearts/Streak juga muncul di topbar, beranda, dan profil. Semua
nilai berasal dari RPC `get_player_state`/`get_my_wallet`, bukan state lokal yang bisa
diubah pemain.

- **Hearts.** Maksimal 5, satu Heart pulih setiap 30 menit. Jawaban salah pertama pada
  sebuah soal mengurangi satu Heart; menjawab ulang soal yang sama tidak mengurangi lagi.
  Lesson dengan Hearts 0 tidak bisa dimulai (`hearts_empty`), tetapi attempt yang sudah
  berjalan tetap bisa diselesaikan. Practice tidak memakai Hearts.
- **Refill.** Pemain dapat mengisi Hearts yang hilang dengan 10 Koin per Heart. Biaya,
  saldo, transaksi, dan pengisian dihitung dalam satu RPC atomik; Hearts penuh tidak
  memotong Koin.
- **Streak.** Dihitung dari hari aktivitas XP `lesson`/`practice`, memakai zona waktu akun.
  XP hadiah Friends Quest tidak memperpanjang Streak. Hari yang terlewat mereset Streak ke 1
  saat aktivitas berikutnya; `longest_streak` tetap menyimpan rekor terbaik. Perisai Streak
  (maksimal 2) dikonsumsi otomatis untuk menutup satu hari yang terlewat.
- **Milestone Streak.** Hari ke-3, 7, 14, 30, 60, dan 100 memberi 20, 50, 100, 200, 400,
  dan 800 Koin secara otomatis. Hadiah hanya diberikan sekali per milestone.
- **Level akun.** Diturunkan dari total XP lewat tabel `player_levels` (30 level). Level 2
  dimulai pada 100 XP; tidak ada angka level yang bisa dikirim client. Setiap level 2–30
  memberi Koin otomatis (`25 + (level − 2) × 5`), sekali per level.
- **Koin.** Didapat dari lesson, latihan, hadiah quest, reward level, dan milestone Streak.
  Refill Hearts serta pembelian di toko memakai Koin dengan transaksi server.

## Reward, misi, achievement, dan toko

- **Misi harian/mingguan.** Tiga misi harian dan tiga misi mingguan dihitung dari
  `user_xp_ledger`, bukan dari state client. Progres, target, hadiah, dan status klaim
  berasal dari `get_my_quests`; klaim memakai `claim_quest_reward` dan unik per periode.
- **Achievement.** Delapan pencapaian (1/5 lesson, 1/10 sesi latihan, 500 XP, Streak 7/30
  hari, dan level 5) terbuka otomatis dari ledger. Achievement tidak memberi Koin;
  statusnya dapat dilihat di `/quests`.
- **Toko.** `/shop` menjual **Ramuan Hati** (80 Koin, memulihkan hingga 3 Hearts) dan
  **Perisai Streak** (120 Koin, maksimal 2). Harga dan saldo divalidasi server; pembelian
  ditulis ke `shop_purchases`, `coin_transactions`, dan `user_inventory` secara atomik.
- **Inventory.** Tas menampilkan item yang dimiliki. Ramuan Hati dan Perisai Streak dipakai
  dari `/shop`; Perisai Streak menambah `user_streaks.freezes`. Item habis tidak ditampilkan
  sebagai baris aktif.

## Pemetaan mini-game per mata pelajaran

| Mata pelajaran | Prioritas tipe |
| --- | --- |
| Bahasa Inggris | Listening, Speaking, Word Bank, Matching, Translation, Conversation, Story. |
| Bahasa Indonesia | Reading, Fill in the Blank, Sentence Builder, Typing, Story. |
| Matematika | Multiple Choice, Typing, Fill in the Blank, Timed, Ramp Up. |
| Pemrograman Web / Basis Data / PPB | Typing, code challenge, Fill in the Blank, Matching (istilah–arti). |
| PPK | Multiple Choice, Matching, Conversation, Story. |
| Bahasa Sambas | Kosakata, Matching, Word Bank, Listening — konten diisi pemilik, bukan auto-generate. |

## Jenis node learning path

| Jenis | Status |
| --- | --- |
| lesson | Ada (22 node). |
| review | Ada (7 node, lesson review dengan soal baru). |
| challenge | Ada (7 node, lesson tantangan). |
| practice | Ada (7 node, latihan terarah 3 soal). |
| checkpoint | Ada (7 node, review penutup Level 2, 3 soal). |
| legendary | Ada (7 node, tantangan penutup Level 3, 3 soal sulit). |
| reward | Belum; menunggu sistem reward Tahap 5. |

Semua node practice/checkpoint/legendary memiliki `lesson_id` dan soal aktif, sehingga
dapat dimainkan dan ikut mengunci node berikutnya. Node hadiah khusus kurikulum belum
dibuat; reward level, misi, dan toko sudah ada, tetapi node yang memberi hadiah khusus belum
didefinisikan.

## Aturan konten

- Setiap soal punya ID, mapel, level, unit, lesson, tipe, topik, kesulitan, instruksi,
  pertanyaan, opsi/kunci, penjelasan, hint, bobot, media, dan status aktif.
- Generator menolak pilihan ganda tanpa tepat satu jawaban benar, soal isian tanpa jawaban,
  slug duplikat, mapel aktif tanpa level, dan lesson tanpa soal (peringatan).
- Soal hitungan diverifikasi dengan perhitungan; soal pemrograman dengan sintaks/output.
- Bahasa Sambas **tidak** dibuat otomatis; strukturnya ada, bank soalnya diisi pemilik.
- Tidak ada duplikasi soal hanya untuk memenuhi kuota.

## Yang belum ada di scoring

- Koin dari practice (practice hanya memberi XP).
- Mastery dan review schedule.
- Reward khusus legendary di luar XP latihan.
- Graf teman penuh, friend request, activity feed, dan leaderboard (Tahap 7).

## Batasan konten yang perlu diketahui

- Enam soal Bahasa Indonesia baru (listening, speaking, fill dua rumpang, conversation,
  story, matching) sudah masuk seed, tetapi mata pelajaran lain masih dominan pilihan
  ganda dan isian. Penyebaran tipe soal ke semua mapel belum selesai.
- Belum ada aset audio rekaman; model audio memakai text-to-speech browser.
- Conversation memakai cabang respons yang ditulis di konten, bukan pohon dialog bebas.
- Match Madness bergantung pada jumlah soal matching per course (saat ini 3 di Bahasa
  Inggris dan 1 di Bahasa Indonesia). Mapel tanpa cukup soal matching akan menampilkan
  pesan bahwa soal belum cukup.
- Friends Quest belum diuji lewat UI browser dengan dua akun nyata; alur server sudah diuji
  di PGlite dan Supabase, termasuk kontribusi XP dan klaim ganda.
