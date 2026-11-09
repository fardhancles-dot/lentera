# Audit Tahap 4 — Gameplay dan 20 Mini-game

Tanggal audit: 10 November 2026. Laporan ini dibuat dari pembacaan kode, migration,
dan eksekusi test — bukan dari nama file atau catatan sesi sebelumnya.

> **Snapshot sebelum perbaikan.** Temuan di bawah sudah ditindaklanjuti. Status akhir,
bukti 42 unit test / 135 SQL check / 33 verifikasi Supabase, dan batasan yang tersisa ada di
> **[STAGE4_COMPLETION.md](STAGE4_COMPLETION.md)**.

## Ringkasan

Tahap 1–3 berjalan dan tidak diubah fondasinya. Tahap 4 ternyata **belum selesai**
meskipun dokumentasi lama menyebut “19/20”. Yang benar-benar berfungsi: bank soal,
penilaian server, lesson engine, tujuh mode latihan, dan dua belas layar tipe soal.
Yang belum sesuai spesifikasi: Friends Quest, percakapan bercabang, pilihan respons
di Story Mode, Fill in the Blank multi-rumpang, dan lokalisasi audio Speaking.

## Bukti eksekusi sebelum perbaikan

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| TypeScript strict | `npm run typecheck` | Lulus, 0 error. |
| Unit test | `npm test` | 34 test lulus (3 file). |
| SQL + RPC + RLS + practice | `npm run test:sql` | 106 smoke check lulus di PGlite. |
| Build produksi | `npm run build` | Lulus; Phaser tetap chunk terpisah. |
| Supabase nyata | `npm run verify:supabase` | 29 check lulus. |
| Seed | `npm run seed:build` | 8 mapel aktif, 22 level, 57 lesson, 225 soal. |

## A. COMPLETED — sudah berfungsi

| Pekerjaan | Bukti |
| --- | --- |
| Tabel soal, opsi, jawaban, media, pasangan, scene | 8 migration; 106 smoke check. |
| `grade_question` untuk opsi, teks, dan pasangan | Kunci tidak dikirim ke browser; diuji SQL + Supabase. |
| `start_lesson`, `submit_attempt_answer`, `complete_lesson_attempt` | Attempt unik, penilaian server, XP/Koin idempoten. |
| Bank soal 7 mapel inti + struktur Bahasa Sambas | 225 soal; Sambas sengaja kosong. |
| 12 layar tipe soal | Registry `src/game/minigames/index.ts`. |
| Multiple Choice, Word Bank, Sentence Builder, Matching Pairs, Picture ID, Fill Blank, Typing | Renderer + grading + test. |
| Listening, Speaking, Translation, Conversation, Story | Renderer + scene + grading + test. |
| Match Madness, Ramp Up, Timed, Mistakes, Personalized, Unit Review, Legendary | Sesi practice server, timer, combo, XP idempoten. |
| Practice Hub | Route `/practice`, pemilih mapel, unit chooser. |
| Anti-reward ganda | Unique ledger per attempt/sesi; diuji. |

## B. IN PROGRESS — sudah dimulai, belum sesuai spesifikasi

| Pekerjaan | Kondisi nyata | File |
| --- | --- | --- |
| Conversation Challenge | NPC, bubble, audio, dan pilihan sudah ada, tetapi semua pilihan hanya dinilai benar/salah tanpa respons NPC yang berbeda. Belum ada cabang dialog. | `src/game/minigames/conversation.ts`, `scripts/content/helpers.ts` |
| Story Mode | Layar berurutan dan pertanyaan pemahaman ada, tetapi belum ada pilihan respons di tengah cerita. | `src/game/minigames/story.ts` |
| Fill in the Blank | Hanya mendukung tepat satu rumpang (`parts.length === 2`). Spesifikasi meminta satu atau beberapa bagian kosong. | `src/game/minigames/fillBlank.ts` |
| Speaking Challenge | `recognition.lang` dipaku `en-US`, sehingga materi Bahasa Indonesia berisiko salah dikenali. | `src/game/minigames/speaking.ts` |
| Audio Listening | Slider volume hanya memengaruhi elemen `<audio>`, tidak memengaruhi text-to-speech. | `src/game/minigames/listening.ts`, `src/game/audio/speech.ts` |
| Pemetaan tipe soal per mapel | Belum ada aturan yang menjaga agar tipe mini-game dipakai sesuai karakter mapel. | `scripts/content/index.ts` |

## C. NOT STARTED — belum dibuat

| Pekerjaan | Alasan |
| --- | --- |
| Friends Quest | Mini-game #20; membutuhkan target gabungan dan kontribusi server. |
| Pengelolaan soal lewat Admin Panel | Sesuai prioritas pemilik proyek, ini Tahap 8. |
| Penyebaran tipe soal baru ke mapel selain Bahasa Inggris | Konten baru masih terpusat di satu lesson. |
| Browser E2E Playwright | Belum menjadi bagian Tahap 4; direncanakan pada QA akhir. |

## D. NEEDS FIX — ada tetapi bermasalah

| Temuan | Dampak | Tindakan |
| --- | --- | --- |
| Deskripsi Ramp Up berbunyi “naik tingkat setiap kali benar”, padahal server hanya mengurutkan soal dari mudah ke sulit. | Klaim menyesatkan. | Deskripsi diperbaiki agar sesuai perilaku nyata. |
| `speak()` memilih `en-US` hanya dari ada/tidaknya huruf Latin. | Bahasa Indonesia juga memakai huruf Latin, jadi locale salah. | Tambah `scene.lang` eksplisit. |
| `markResult` Listening menambahkan kelas salah ke input ketik meskipun input tidak dipakai. | Kosmetik, bukan penilaian. | Dibatasi ke kontrol yang aktif. |
| Conversation menampilkan seluruh layar sekaligus. | Tidak terasa seperti percakapan. | Renderer diubah menjadi alur bertahap. |
| `subject_overview` memakai satu baris per course; Practice Hub memakai `courses[0]`. | Mapel dengan lebih dari satu course belum didukung. | Tetap batasan Tahap 3; dicatat, bukan diperbaiki di Tahap 4. |

## Urutan pekerjaan yang dilanjutkan

1. Perbaiki kontrak `scene` (bahasa, respons cabang, pilihan cerita) dan parser-nya.
2. Perbaiki Fill in the Blank agar mendukung banyak rumpang.
3. Ubah Conversation menjadi alur bertahap dengan respons NPC berbeda.
4. Tambah pilihan respons di Story Mode.
5. Perbaiki locale dan volume audio.
6. Tambah pemetaan tipe soal per mapel dan validasinya.
7. Bangun Friends Quest dengan invite code, kontribusi XP server, reward idempoten.
8. Tambah test unit + SQL, jalankan seluruh verifikasi, perbarui dokumentasi.

## Batasan yang tetap jujur

- Friends Quest memakai invite code, bukan graf pertemanan penuh. Graf teman, friend
  request, activity feed, dan leaderboard tetap Tahap 7.
- Konten soal baru tetap melalui seed tervalidasi; Admin Panel tetap Tahap 8.
- Audio tetap memakai media tersimpan atau text-to-speech browser; belum ada rekaman
  suara produksi.

## Status setelah perbaikan

Seluruh item B (in progress) dan C (Friends Quest) sudah diimplementasikan; item D yang
berkaitan dengan Tahap 4 sudah diperbaiki. Rincian dan bukti ada di
`STAGE4_COMPLETION.md`. Batasan di atas tetap berlaku dan tidak diklaim selesai.
