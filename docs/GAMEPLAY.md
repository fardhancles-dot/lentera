# Gameplay

> **Status: lesson engine berjalan; 7 tipe soal punya layar bermain.**
> Lima mini-game prioritas — Word Bank, Sentence Builder, Matching Pairs, Fill in the
> Blank, dan Picture Identification — sudah implemented dengan soal nyata. Pilihan ganda
> dan input teks tetap tersedia. 13 mini-game lain belum dibangun. Data XP/Koin sudah
> tercatat di database, tetapi Hearts, Streak, level akun, dan quest belum ada.

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
| 1 | Multiple Choice | Pilih satu dari 2–4 opsi. | **Implemented** (ada soal) |
| 2 | Word Bank | Susun jawaban dari kata yang disediakan dengan mengetuk kata. | **Implemented · Tested (SQL)** |
| 3 | Sentence Builder | Acak kata, susun urutan kalimat. | **Implemented · Tested (SQL)** |
| 4 | Listening Challenge | Audio + replay/slow, pilih atau ketik jawaban. | Not implemented |
| 5 | Speaking Challenge | Rekaman mikrofon + Speech Recognition bila tersedia. | Not implemented |
| 6 | Typing Challenge | Input teks, validasi ejaan/format. | **Implemented** (input teks) |
| 7 | Matching Pairs | Cocokkan dua kolom, animasi benar/salah. | **Implemented · Tested (SQL)** |
| 8 | Picture Identification | Pilih nama objek dari gambar. | **Implemented · Tested (SQL)** (3 soal + media) |
| 9 | Fill in the Blank | Isi satu rumpang pada kalimat. | **Implemented · Tested (SQL)** (input inline `__`/`___`) |
| 10 | Translation Challenge | Dua arah terjemahan, word bank/input. | Not implemented (fallback input teks, belum mekanik khusus) |
| 11 | Conversation Challenge | Dialog bercabang dengan NPC. | Not implemented |
| 12 | Story Mode | Cerita, audio, pilihan, pertanyaan pemahaman. | Not implemented |
| 13 | Match Madness | Dua kolom + timer + combo + multiplier. | Not implemented |
| 14 | Ramp Up | Kesulitan meningkat, batas waktu per soal. | Not implemented |
| 15 | Timed Challenge | Countdown total, skor, bonus waktu. | Not implemented |
| 16 | Mistakes Review | Ulangi jawaban salah dari riwayat. | Not implemented |
| 17 | Personalized Practice | Latihan dari mastery + error tracking. | Not implemented |
| 18 | Unit Review | Campuran tipe soal satu unit. | Not implemented |
| 19 | Legendary Challenge | Soal sulit, multi tipe, reward khusus. | Not implemented |
| 20 | Friends Quest | Target gabungan, kontribusi tiap anggota. | Not implemented |

Catatan implementasi: lima mini-game baru berada di `src/game/minigames/` dan dipilih
lewat registry `createMiniGame`. Halaman lesson tidak lagi memilih renderer berdasarkan
tipe; ia hanya menampilkan `view.prompt`/`view.answer`, mengirim `view.getAnswer()`,
memanggil `setDisabled`, lalu `markResult`. Tipe yang belum punya renderer memakai layar
`unsupported` dengan tombol lewati, bukan input teks yang menyamar sebagai mekanik lain.

Konten contoh kelima mini-game ada di lesson `bahasa-inggris/greetings-vocabulary`:
1 word bank, 1 sentence builder, 1 fill in the blank, 1 matching (4 pasangan), dan
3 picture identification dengan SVG di `public/assets/pictures/`.

Perbedaan wajib saat dibangun:

- **Ramp Up** menaikkan kesulitan per jawaban benar dan memberi bonus waktu;
  **Timed Challenge** memakai satu countdown total dengan komposisi soal tetap.
- **Matching Pairs** bukan pilihan ganda: dua kolom, seleksi berpasangan.
- **Speaking** tanpa dukungan browser harus menampilkan alternatif jujur, bukan skor palsu.

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
- Combo, multiplier, timer, bonus kecepatan.
- XP bonus akurasi dan level akun.
- Quest, achievement, mastery, dan reward khusus legendary (saat ini legendary memberi
  XP/Koin standar lesson).
