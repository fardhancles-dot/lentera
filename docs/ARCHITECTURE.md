# Arsitektur

## Ringkasan

Lentera adalah SPA berbasis Vite + TypeScript. Halaman aplikasi dirender dengan DOM/CSS;
Phaser hanya dipakai untuk area bermain 2D dan dimuat lazy. Backend adalah Supabase
(PostgreSQL + Auth), dengan penilaian dan reward dijalankan oleh RPC PostgreSQL.

```text
Browser
├── HTML/CSS pages ── router ── guards ── session store
│                                │
│                                ├── auth.service
│                                ├── profile.service
│                                ├── curriculum.service
│                                └── lesson.service
│                                        │
│                                        ▼
│                                  repositories
│                                        │
├── Phaser canvas (lazy)                 ▼
│                                 Supabase JS client
│                                 ├── Auth (GoTrue)
│                                 └── PostgREST → PostgreSQL + RLS
│                                                  └── RPC lesson engine
└── scripts/ (build-time only) → generator seed → migration SQL
```

## Lapisan aplikasi

| Lapisan | Lokasi | Tanggung jawab |
| --- | --- | --- |
| Entry | `src/main.ts` | Style, boot splash, router, sinkron reduced-motion. |
| Routing | `src/app/router.ts` | Match path, guard, lazy page, cleanup, intercept link internal. |
| Halaman | `src/pages/*` | Merakit DOM, memanggil service, menampilkan loading/error. |
| Layout | `src/layouts/*` | Shell navigasi desktop/mobile dan split layout auth. |
| Komponen | `src/components/*` | Field, tombol, toast, ikon SVG, avatar, ilustrasi. |
| State | `src/stores/session.store.ts` | Sumber kebenaran sesi + profil + pengaturan + role. |
| Service | `src/services/*` | Validasi, aturan bisnis, pemetaan error, parsing payload RPC. |
| Repository | `src/repositories/*` | Query Supabase bertipe; satu-satunya akses tabel/RPC. |
| Tipe | `src/types/*` | Tipe `Database` dan tipe sesi. |
| Game | `src/game/*` | Scene Phaser dan renderer mini-game DOM; tidak mengenal Supabase. |
| Config | `src/config/*` | Brand, env, katalog avatar. |
| Scripts | `scripts/*` | Validasi konten, generator seed, smoke test SQL. |

Aturan dependensi: **page → service → repository → Supabase**. Komponen dan util tidak
mengimpor service. Game tidak mengimpor Supabase; hasil attempt dikirim oleh halaman
melalui `lesson.service`.

## Alur boot

1. `main.ts` memasang splash dan style.
2. `Router.start()` memanggil `sessionStore.init()`.
3. Tanpa env Supabase → status `unconfigured`; halaman publik/guest tetap dapat dibuka.
4. Dengan env → client dibuat, subscription auth dipasang, sesi dibaca, lalu profil +
   pengaturan + role dimuat paralel.
5. Route dirender setelah guard selesai, sehingga tidak ada kedipan halaman privat.

## Routing dan guard

History API dipakai agar URL bersih. Vercel rewrite mengarahkan semua path ke `index.html`.

| Guard | Perilaku |
| --- | --- |
| `public` | Boleh diakses siapa saja (landing, reset password, setup, 404). |
| `guest` | Pengguna login diarahkan ke `/app` atau `/onboarding`. |
| `authenticated` | Butuh sesi; tamu diarahkan ke `/login?next=…`. |
| `onboarded` | Butuh sesi dan `profiles.onboarding_completed = true`. |

Setiap render memakai token urutan; render lama dibatalkan bila pengguna berpindah halaman.
Cleanup halaman dijalankan router sebelum render berikutnya (mematikan instance Phaser).

Route belajar:

```text
/learn
/learn/:subject
/learn/:subject/lesson/:lessonSlug
/learn/:subject/lesson/:lessonSlug/play
```

## Sesi

`sessionStore` menyimpan status (`loading`, `unconfigured`, `anonymous`, `authenticated`),
`user` (profil, settings, role), dan `recoveryMode`.

- `onAuthStateChange` menangani `SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`,
  `PASSWORD_RECOVERY`, `INITIAL_SESSION`.
- Pemuatan profil dideduplikasi lewat `loadPromise`.
- Setelah simpan profil/pengaturan, halaman memanggil `setProfile`/`setSettings`.

## Kurikulum dan learning path

`curriculum.service.loadSubjectPath()`:

1. Ambil subject berdasarkan slug.
2. Ambil course (saat ini course pertama).
3. Ambil level, unit, node, lesson, dan statistik soal.
4. Urutkan ulang level → unit → node karena API hanya mengurutkan per tabel.
5. Hitung status node dengan `resolveNodeStatuses` (completed/available/locked/preview).
6. Node non-lesson menjadi milestone: tersedia bila semua lesson sebelumnya selesai.
7. Hitung progres course dan unit untuk ditampilkan.

Developer mendapat `developerPreview`: semua node tampil `preview`, tetapi status progres
asli tetap dihitung dari data pemain. Unlock tetap ditegakkan ulang di server.

Katalog memakai view `subject_overview` (agregat level/unit/lesson/soal). Progres katalog
diambil dari `user_course_progress` per course.

## Lesson engine

```text
lesson-play.page
  → curriculumService.loadLessonDetail()      (cek status & jumlah soal)
  → lessonService.start(nodeId)
        rpc start_lesson
  → createMiniGame(question) → renderer sesuai tipe
  → lessonService.answer(attempt, question, answer)
        rpc submit_attempt_answer → penilaian + feedback
  → lessonService.complete(attemptId)
        rpc complete_lesson_attempt → progres + XP/Koin
  → halaman hasil
```

Batas kepercayaan:

- Browser **tidak pernah** menerima `is_correct`, tabel jawaban, relasi pasangan, atau
  saldo yang bisa dikirim balik.
- Browser tidak mengirim XP, Koin, Hearts, Streak, level, status lulus, atau flag
  achievement.
- Semua penulisan reward terjadi di RPC `security definer` dengan transaksi, unique
  constraint, dan advisory lock.
- Hearts dikurangi trigger database saat jawaban salah benar-benar tersimpan; attempt baru
  dicek trigger sebelum dibuat. Streak diperbarui trigger dari XP lesson/practice.
- RLS + grant kolom mencegah pemain mengubah tabel ekonomi/progresi secara langsung.

## Progression dan wallet

- `player.repository.ts` hanya memanggil RPC `get_player_state`, `get_my_wallet`, dan
  `refill_hearts`; tidak ada query tulis langsung.
- `player.service.ts` memvalidasi payload, meng-clamp Hearts/persentase, dan menyaring
  transaksi rusak sebelum masuk UI.
- `player.store.ts` menjadi cache bersama: topbar, beranda, profil, `/wallet`, dan HUD lesson
  membaca snapshot yang sama. Store di-reset saat `user_id` berubah.
- `/wallet` menampilkan level, Koin, Hearts/refill, Streak 14 hari, dan riwayat; layout
  menampilkan ringkasan Koin/Hearts/Streak.
- Level tidak disimpan di tabel pemain. `get_player_state` menjumlahkan XP ledger lalu
  memetakan ke `player_levels`, sehingga client tidak bisa mengubah level.

## Mini-game renderer

`src/game/minigames/` memisahkan mekanik dari halaman lesson:

| Modul | Tipe | Interaksi |
| --- | --- | --- |
| `multipleChoice.ts` | `multiple_choice` | Pilih satu opsi. |
| `typing.ts` | `typing`, `translation` | Input teks (translation masih fallback, belum mekanik khusus). |
| `wordBank.ts` | `word_bank` | Bank kata + strip jawaban + hapus/reset. |
| `sentenceBuilder.ts` | `sentence_builder` | Kata acak + geser urutan + kembalikan kata. |
| `matchingPairs.ts` | `matching_pairs` | Dua kolom terpisah, pasangan bisa dibatalkan. |
| `fillBlank.ts` | `fill_blank` | Input inline pada penanda `__`. |
| `pictureIdentification.ts` | `picture_identification` | Gambar media + opsi nama. |
| `unsupported.ts` | tipe lain | Status jujur + tombol lewati. |

Registry `index.ts` adalah satu-satunya tempat pemetaan tipe → renderer. Kontrak
`MiniGameView` berisi `prompt?`, `answer`, `ownsMedia?`, `getAnswer()`, `focus()`,
`setDisabled()`, dan `markResult()?`. Halaman tidak mengetahui detail mekanik; ia hanya
mengaktifkan tombol periksa saat `getAnswer()` tidak null, mengunci input saat menunggu
server, lalu meminta renderer menandai hasil. Karena itu menambah mekanik baru tidak
mengubah `lesson-play.page.ts`.

## Phaser dan DOM

- Phaser **tidak** membungkus seluruh website. Form, peta, dan panel tetap DOM.
- Stage maskot dimuat dengan `await import(...)`, sehingga `phaser` menjadi chunk terpisah.
- Scene digambar dari vector (`Graphics`), bukan emoji atau aset berhak cipta.
- `createMascotStage()` mengembalikan handle `destroy()` yang didaftarkan ke cleanup router.
- Adventure map saat ini DOM; migrasi ke scene Phaser direncanakan Tahap 6.

## Konfigurasi

- `src/config/env.ts` — validasi kredensial Supabase; hanya anon/publishable key.
- `src/config/brand.ts` — nama, tagline, versi, maskot, copyright, URL bantuan; dapat
  ditimpa environment variable.
- `appOrigin` dipakai untuk redirect email Supabase.

## Keputusan teknis

| Keputusan | Alasan |
| --- | --- |
| Tanpa framework UI | Bundle kecil, kontrol penuh markup/aksesibilitas. |
| Phaser 4.2.1 lazy | Game engine tidak memperberat halaman non-game. |
| `type` bukan `interface` untuk row Supabase | Syarat tipe generik Supabase. |
| Implicit auth flow | Tautan reset/verifikasi bekerja lintas perangkat. |
| Column-level grants | RLS membatasi baris; grant membatasi kolom. |
| RPC atomik untuk onboarding & lesson | Mengurangi state setengah jadi dan mencegah reward ganda. |
| Hearts/Streak lewat trigger | Aturan berlaku untuk semua jalur tulis dan tidak bergantung pada client. |
| Level dari ambang XP | Tidak ada angka level yang bisa dikirim atau diedit pemain. |
| Seed generated + UUID deterministik | Konten dapat direview di Git dan dijalankan ulang tanpa duplikasi. |
| Peta DOM dulu | Data dan unlock dapat diuji sebelum investasi scene Phaser. |

## Utang teknis yang disengaja

- Belum ada i18n; teks UI Indonesia. `user_settings.locale` sudah disiapkan.
- Belum ada PWA/service worker.
- Belum ada Edge Function; operasi istimewa saat ini cukup lewat RPC. Reward Center dan
  broadcast nanti wajib lewat Edge Function/RPC dengan verifikasi role.
- Satu course per mapel; UI memakai `courses[0]`.
- Seluruh 12 tipe soal punya renderer; `unsupported` hanya jaring pengaman data rusak.
- Friends Quest sudah ada sebagai co-op berbasis kode undangan; graf teman penuh
  (friend request, friendships, activity feed) tetap Tahap 7.
- Audio model memakai text-to-speech browser; belum ada aset rekaman.
- Timer latihan berjalan di client untuk tampilan; skor, combo, dan XP dihitung ulang
  server dari jawaban tersimpan (durasi menjawab dibatasi 0–600 detik).
- Belum ada E2E Playwright; lihat `docs/TESTING.md`.
