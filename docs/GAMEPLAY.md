# Gameplay

> **Status: lesson engine dan Practice Hub berjalan; 12 tipe soal punya layar bermain.**
> Sembilan belas dari 20 mini-game sudah punya mekanik nyata. Listening memakai audio
> tersimpan atau text-to-speech browser; Speaking memakai Web Speech Recognition dengan
> alternatif menulis dan tanpa skor pengucapan palsu. Conversation dan Story memakai scene
> dialog dari database. Tujuh mode latihan memakai sesi server dengan timer, combo, dan XP
> idempoten. **Friends Quest belum dibuat** karena membutuhkan sistem teman Tahap 7.
> Hearts, Streak, level akun, dan quest belum ada.

## Yang benar-benar ada sekarang

- Maskot Kiko di landing, halaman auth, hasil lesson, dan sidebar: vector Phaser dengan
  idle, blink, wave, celebrate.
- Katalog mapel dari database, termasuk status pengembangan bahasa daerah.
- Learning path per mapel: level → unit → node, dengan status selesai/aktif/terkunci.
- Detail lesson: topik, jenis soal, tujuan unit, XP/Koin, syarat mulai.
- Layar lesson: progress bar, hint, pilihan ganda, input teks, word bank, sentence
  builder, matching pairs, fill in the blank inline, picture identification, tombol
  periksa, feedback benar/salah, penjelasan, jawaban benar, dan tombol lanjut.
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
| 9 | Fill in the Blank | Isi satu rumpang pada kalimat. | **Implemented · Tested (SQL)** (input inline `__`/`___`) |
| 10 | Translation Challenge | Dua arah; susun token atau tulis sendiri, dinilai sebagai teks. | **Implemented · Tested (SQL)** |
| 11 | Conversation Challenge | NPC, bubble dialog, audio per baris, pilihan respons dinilai server. | **Implemented · Tested (SQL)** · satu keputusan per soal, belum pohon cabang |
| 12 | Story Mode | Layar cerita berurutan, audio, lalu pertanyaan pemahaman. | **Implemented · Tested (SQL)** |
| 13 | Match Madness | Ronde matching berbatas 90 detik + combo + poin kecepatan. | **Implemented · Tested (SQL)** (mode latihan) |
| 14 | Ramp Up | Soal makin sulit; 20 detik per soal; combo. | **Implemented · Tested (SQL)** (mode latihan) |
| 15 | Timed Challenge | Countdown total 120 detik, 10 soal, bonus waktu. | **Implemented · Tested (SQL)** (mode latihan) |
| 16 | Mistakes Review | Ulangi soal yang pernah dijawab salah. | **Implemented · Tested (SQL)** (riwayat lesson + latihan) |
| 17 | Personalized Practice | Soal dari topik yang sering salah, fallback soal belum dicoba. | **Implemented · Tested (SQL)** |
| 18 | Unit Review | Campuran soal satu unit, maksimal 12 soal. | **Implemented · Tested (SQL)** + unit chooser |
| 19 | Legendary Challenge | Soal dari lesson legendary, XP hingga 30. | **Implemented · Tested (SQL)** |
| 20 | Friends Quest | Target gabungan, kontribusi tiap anggota. | **Not implemented** — butuh graf teman & quest (Tahap 7) |

Catatan implementasi: lima mini-game baru berada di `src/game/minigames/` dan dipilih
lewat registry `createMiniGame`. Halaman lesson tidak lagi memilih renderer berdasarkan
tipe; ia hanya menampilkan `view.prompt`/`view.answer`, mengirim `view.getAnswer()`,
memanggil `setDisabled`, lalu `markResult`. Tipe yang belum punya renderer memakai layar
`unsupported` dengan tombol lewati, bukan input teks yang menyamar sebagai mekanik lain.

Konten contoh kelima mini-game ada di lesson `bahasa-inggris/greetings-vocabulary`:
1 word bank, 1 sentence builder, 1 fill in the blank, 1 matching (4 pasangan), dan
3 picture identification dengan SVG di `public/assets/pictures/`.

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
- **Conversation** menyimpan NPC dan baris dialog di `scene`; percakapan saat ini satu
  keputusan respons yang dinilai, belum pohon cabang multi-langkah.

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
   `user_xp_ledger` (`practice_session_id` unik). Koin, Hearts, dan mastery belum diberikan
   oleh practice.

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
dapat dimainkan dan ikut mengunci node berikutnya. Node hadiah (reward) belum dibuat karena
belum ada mekanisme pemberian hadiah khusus; membuatnya sekarang akan menjadi tombol mati.

## Aturan konten

- Setiap soal punya ID, mapel, level, unit, lesson, tipe, topik, kesulitan, instruksi,
  pertanyaan, opsi/kunci, penjelasan, hint, bobot, media, dan status aktif.
- Generator menolak pilihan ganda tanpa tepat satu jawaban benar, soal isian tanpa jawaban,
  slug duplikat, mapel aktif tanpa level, dan lesson tanpa soal (peringatan).
- Soal hitungan diverifikasi dengan perhitungan; soal pemrograman dengan sintaks/output.
- Bahasa Sambas **tidak** dibuat otomatis; strukturnya ada, bank soalnya diisi pemilik.
- Tidak ada duplikasi soal hanya untuk memenuhi kuota.

## Yang belum ada di scoring

- Hearts dan pengurangan nyawa.
- Level akun, kurva XP, dan reward level.
- Koin dari practice (practice hanya memberi XP).
- Quest, achievement, dan mastery.
- Reward khusus legendary di luar XP latihan.
- Friends Quest (butuh sistem teman Tahap 7).

## Batasan konten yang perlu diketahui

- Delapan soal baru (listening, speaking, translation, conversation, story, dua matching)
  hanya ada di lesson `bahasa-inggris/greetings-vocabulary`. Mata pelajaran lain masih
  dominan pilihan ganda dan isian.
- Belum ada aset audio rekaman; model audio memakai text-to-speech browser.
- Conversation belum punya cabang dialog bertingkat; baru satu respons yang dinilai.
- Match Madness bergantung pada jumlah soal matching per course (saat ini 3 di Bahasa
  Inggris). Mapel tanpa cukup soal matching akan menampilkan pesan bahwa soal belum cukup.
