# Lentera

Game edukasi 2D berbasis web untuk jenjang SMA/SMK. Materi sekolah dirancang menjadi
petualangan: peta belajar, lesson interaktif, mini-game, XP, Koin, streak, quest, dan
Developer Dashboard.

Maskot: **Kiko**, roh daun penjaga Lentera. Identitas, warna, dan teks brand terpusat di
`src/config/brand.ts` dan dapat ditimpa lewat environment variable.

> **Status proyek: Tahap 1–6 selesai.**
> Lesson, latihan, dan **20 dari 20 mini-game** punya mekanik bermain nyata. Dua belas tipe
> soal dinilai di server (termasuk Listening, Speaking, Translation, Conversation, Story),
> tujuh mode latihan berjalan di atas sesi practice dengan XP idempoten, dan **Friends Quest**
> tersedia sebagai co-op berbasis kode undangan. Tahap 5 menambahkan **Hearts, Streak, level,
> wallet, reward level, milestone Streak, quest harian/mingguan, achievement, toko, dan
> inventory** yang seluruhnya dihitung server. Tahap 5 juga menambahkan **mastery per soal,
> jadwal review terjadwal, dan node hadiah di akhir setiap level**. Tahap 6 menambahkan
> **peta petualangan Phaser responsif**, **karakter Kiko reusable dengan 13 state animasi**,
> **audio sintetis** (musik, SFX, volume, mute), dan **pipeline aset**; daftar lesson DOM
> tetap dipakai sebagai jalur aksesibel. Dua smoke test Playwright lulus: maskot landing
> dan peta berakun (pemilih level keyboard, status live, mute, serta layout ponsel 390px).
> Rincian di **[docs/PROJECT_HANDOFF.md](docs/PROJECT_HANDOFF.md)** dan
> **[docs/STAGE4_COMPLETION.md](docs/STAGE4_COMPLETION.md)**.

---

## Status implementasi

| Area | Status | Keterangan |
| --- | --- | --- |
| Fondasi Vite + TypeScript + Phaser 4 | **Implemented · Tested (build)** | Phaser dimuat lazy hanya saat stage maskot atau peta petualangan tampil. |
| Design system & layout responsif | **Implemented · Verified (browser smoke)** | Token warna, komponen, sidebar desktop, bottom nav mobile. |
| Landing page + maskot interaktif | **Implemented · Verified** | Kiko digambar vector dengan Phaser, idle/blink/celebrate. |
| Peta petualangan Phaser + animasi Kiko | **Implemented · Tested (unit + build + browser berakun)** | `createKiko` dengan 13 state animasi dipakai ulang oleh maskot dan peta; peta di `/learn/:subject` punya pemilih level tombol DOM yang aksesibel, penanda posisi, layout wide/compact, dan dukungan `prefers-reduced-motion`. |
| Sistem audio | **Implemented · Tested (unit + browser smoke); pemutaran belum diverifikasi telinga** | Musik dan SFX disintesis Web Audio, volume mengikuti pengaturan pemain, mute lokal di topbar, autoplay-safe. |
| Pipeline aset | **Implemented · Tested (unit)** | `src/game/assets/manifest.ts` + loader Phaser, lisensi tercatat di `docs/ASSETS.md`. |
| Register / login / logout | **Implemented · E2E verified** | Login API, payload lesson, grading, dan Practice Hub diuji ke project Supabase nyata. |
| Verifikasi email & lupa password | **Implemented · Lupa password E2E; verifikasi email belum** | Tautan reset diuji lewat tautan resmi Supabase (dibuat Admin API, tanpa kotak surat) sampai password baru bisa dipakai login. Konfirmasi pendaftaran masih butuh kotak surat uji. |
| Onboarding profil | **Implemented · E2E (via helper akun uji)** | Username, avatar, nama, target harian, zona waktu. Atomik via RPC. |
| Profil & pengaturan cloud | **Implemented · E2E verified** | Simpan nama tampilan/bio dan preferensi reduced motion ± persist setelah reload diuji browser. |
| Database & RLS | **Implemented · Tested (PGlite + Supabase API)** | 13 migration diterapkan ke project Supabase; 206 SQL smoke check + 61 verifikasi API lulus. |
| Kurikulum & bank soal | **Implemented · Tested (SQL smoke)** | 10 mapel, 22 level, 57 lesson, 231 soal, 12 tipe soal, 7 jenis node; 7 mapel inti + Bahasa Sambas. |
| Learning path & progres per mapel | **Implemented · Tested (SQL smoke)** | Node selesai/aktif/terkunci, unlock ditegakkan server, progres per course/node. |
| Lesson engine & halaman hasil | **Implemented · Tested (SQL smoke + E2E)** | Kunci jawaban tidak dikirim ke browser; XP/Koin idempoten per attempt. Halaman lesson menampilkan lima riwayat percobaan terakhir milik pemain (akurasi, skor, benar/total) dari `lesson_attempts` dengan RLS. |
| Gameplay 20 mini-game | **20/20 implemented · Tested (SQL + API + E2E alur jawab)** | 12 tipe soal punya layar; 7 mode latihan; Conversation bertahap dan Story dengan pilihan respons. E2E menjawab satu soal lesson dan satu soal latihan sampai feedback; 20 mekanik belum dijelajahi satu per satu di browser. |
| Practice Hub & sesi latihan | **Implemented · Tested (SQL + E2E)** | Sesi server, timer, combo, bonus kecepatan, XP idempoten, unit chooser. E2E memulai sesi nyata dan memeriksa feedback penilaian. |
| Friends Quest | **Implemented · Tested (SQL + API + E2E dua akun)** | Co-op lewat kode undangan, target XP gabungan, kontribusi dari XP lesson/latihan server, klaim sekali per anggota. E2E membuat quest, bergabung dengan akun kedua, dan memeriksa 2/8 anggota; butuh `E2E_EMAIL_2`/`E2E_PASSWORD_2`. Graf teman penuh tetap Tahap 7. |
| XP, Koin, Hearts, Streak & level | **Implemented · Tested (SQL + Supabase API)** | Ledger XP/Koin, Hearts dengan regenerasi/refill, Streak harian, 30 level akun, dan halaman `/wallet` dengan riwayat transaksi. Semua angka berasal dari RPC server. |
| Reward level, milestone Streak, quest & achievement | **Implemented · Tested (SQL + Supabase API)** | Hadiah level dan milestone Streak otomatis lewat trigger; 3 quest harian + 3 mingguan dan 8 achievement dihitung dari ledger XP. Halaman `/quests` dan `/wallet`; UI belum diuji browser dengan akun nyata. |
| Toko & inventory | **Implemented · Tested (SQL + Supabase API)** | Katalog dua item consumable, pembelian atomik, tas, Ramuan Hati, dan Perisai Streak (maksimal 2). Halaman `/shop`; UI belum diuji browser. |
| Mastery, review terjadwal & node hadiah | **Implemented · Tested (SQL + Supabase API + unit)** | `user_question_mastery` per soal, interval 1/3/7/14/30 hari, halaman `/mastery`, mode Review Terjadwal, dan 22 node hadiah level dengan klaim idempoten. UI belum diuji browser. |
| Leaderboard, Liga, Teman, Event | **Not implemented** | Tahap 7. |
| Developer Dashboard | **Not implemented** | Tahap 8; role developer dan mode pratinjau sudah ada. |
| PWA / offline / AI / monetisasi | **Not implemented** | Direncanakan setelah gameplay stabil. |

Legenda status: **Implemented** (kode ada), **Tested** (ada bukti eksekusi), **Configured**
(kredensial/opsi sudah diisi), **Pending credential**, **Placeholder**, **Not implemented**.

---

## Teknologi

- **HTML5 + CSS3** — halaman aplikasi, formulir, profil, pengaturan.
- **TypeScript** (strict) — seluruh logic aplikasi dan game.
- **Vite 8** — dev server dan build.
- **Phaser 4.2.1** — area gameplay 2D (stage maskot dan peta petualangan).
- **Supabase** — PostgreSQL, Auth, dan nanti Storage/Realtime/Edge Functions.
- **Vitest** — unit test.
- **Playwright** — smoke test browser (landing); test peta membutuhkan akun E2E.

Node.js **22+** diperlukan (Phaser 4 mensyaratkan Node 22 saat build).

---

## Menjalankan proyek

```bash
npm install
cp .env.example .env   # isi kredensial Supabase
npm run dev
```

Buka `http://localhost:5173`.

Tanpa kredensial Supabase, aplikasi tetap menampilkan landing page, halaman masuk/daftar
dengan peringatan, dan panduan setup di `/setup`. Form akun tidak akan mengirim request.

Panduan lengkap Supabase, migrasi, dan deployment: **[docs/SETUP.md](docs/SETUP.md)**.

### Scripts

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server Vite. |
| `npm run build` | Typecheck + build produksi ke `dist/`. |
| `npm run preview` | Menyajikan hasil build. |
| `npm run typecheck` | TypeScript tanpa emit. |
| `npm test` | Unit test Vitest. |
| `npm run test:watch` | Unit test mode watch. |
| `npm run test:e2e` | Smoke test browser via Playwright (memakai Chrome terpasang; butuh `.env` untuk test berakun). |
| `npm run test:sql` | Smoke test migration, RPC, reward, dan RLS di PGlite. |
| `npm run verify:supabase` | Verifikasi login, payload 20 soal, grading, hasil lesson, Practice Hub, Friends Quest, dan idempotensi reward di Supabase nyata. |
| `npm run db:apply-catalog-fix` | Menerapkan migration view katalog lewat Supabase Management API (`SUPABASE_ACCESS_TOKEN`); `-- --dry-run` untuk pratinjau. |
| `npm run seed:build` | Validasi konten dan regenerasi migration seed kurikulum. |

---

## Struktur proyek

```text
.
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   └── router.ts            # history router + guard akses + cleanup halaman
│   ├── components/              # ikon SVG, avatar, form, toast, brand art
│   ├── config/                  # brand, env, katalog avatar
│   ├── game/
│   │   ├── characters/          # factory Kiko + 13 state animasi
│   │   ├── adventure/           # layout peta + mount helper Phaser (lazy loaded)
│   │   ├── scenes/              # scene Phaser peta petualangan
│   │   ├── mascot/              # stage maskot landing (memakai createKiko)
│   │   ├── audio/               # text-to-speech untuk model audio
│   │   ├── practice/            # helper tampilan timer & combo
│   │   └── minigames/           # renderer DOM per tipe soal + registry
│   ├── layouts/                 # auth layout, app shell
│   ├── pages/                   # auth, onboarding, beranda, belajar, lesson, latihan, profil
│   ├── repositories/            # akses data Supabase
│   ├── services/                # aturan bisnis, lesson engine client, pemetaan error
│   ├── stores/                  # session, player, dan rewards store observable
│   ├── styles/                  # tokens, base, components, layout, pages, practice
│   ├── types/                   # tipe database & sesi
│   ├── utils/                   # DOM, validasi
│   └── main.ts
├── supabase/
│   └── migrations/
│       ├── 20261108090000_identity.sql
│       ├── 20261108100000_curriculum.sql
│       ├── 20261108105000_curriculum_overview.sql
│       ├── 20261108107000_question_pairs.sql
│       ├── 20261108109000_question_scenes.sql
│       ├── 20261108110000_curriculum_seed.sql
│       ├── 20261108120000_lesson_engine.sql
│       ├── 20261109100000_practice_engine.sql
│       ├── 20261110100000_friends_quest.sql
│       ├── 20261110120000_progression_economy.sql
│       ├── 20261110130000_tahap5_rewards.sql
│       └── 20261110140000_mastery_review_rewards.sql
├── scripts/                     # generator + validasi seed kurikulum, SQL smoke test
├── tests/                       # unit test Vitest
├── docs/                        # dokumentasi teknis + laporan audit
├── index.html
├── vite.config.ts
├── tsconfig.json
└── vercel.json
```

Folder `features/`, `game/scenes/`, dan `supabase/functions/` akan ditambahkan ketika tahap
terkait dikerjakan — bukan folder kosong yang dibuat lebih awal.

---

## Dokumentasi

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — arsitektur, alur data, keputusan teknis.
- [DATABASE.md](docs/DATABASE.md) — skema, RLS, fungsi, cara menambah tabel.
- [SETUP.md](docs/SETUP.md) — Supabase, email, migrasi, Vercel, troubleshooting.
- [SECURITY.md](docs/SECURITY.md) — model keamanan dan batasan yang diketahui.
- [GAME_DESIGN.md](docs/GAME_DESIGN.md) — identitas visual, maskot, motion.
- [GAMEPLAY.md](docs/GAMEPLAY.md) — rencana lesson engine & 20 mini-game, status nyata.
- [TESTING.md](docs/TESTING.md) — test yang ada, checklist manual, gap.
- [AUDIT.md](docs/AUDIT.md) — laporan audit kondisi nyata, temuan, dan rencana lanjutan.
- [AUDIT_STAGE4.md](docs/AUDIT_STAGE4.md) — snapshot audit Tahap 4 sebelum perbaikan.
- [STAGE4_COMPLETION.md](docs/STAGE4_COMPLETION.md) — laporan akhir Tahap 4 dan bukti pengujian.
- [PROJECT_HISTORY.md](docs/PROJECT_HISTORY.md) — catatan per sesi pengembangan.
- [SESSION_2026-11-09.md](docs/SESSION_2026-11-09.md) — catatan percakapan dan status sesi lima mini-game.

Dokumentasi sistem reward lanjutan dan Developer Dashboard akan dibuat bersamaan dengan
implementasinya agar tidak berisi janji kosong.

---

## Prinsip kerja

1. Functionality sebelum tampilan.
2. Reward dan progres tidak boleh hanya hidup di frontend.
3. Setiap fitur diberi status jujur: implemented, tested, configured, pending, atau
   not implemented.
4. Jangan membuat tombol atau halaman yang tidak berfungsi.
5. RLS dan grant kolom adalah garis pertahanan utama, bukan menyembunyikan tombol.

Dibangun bertahap sesuai prioritas pemilik proyek.
