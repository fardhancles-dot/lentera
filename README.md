# Lentera

Game edukasi 2D berbasis web untuk jenjang SMA/SMK. Materi sekolah dirancang menjadi
petualangan: peta belajar, lesson interaktif, mini-game, XP, Koin, streak, quest, dan
Developer Dashboard.

Maskot: **Kiko**, roh daun penjaga Lentera. Identitas, warna, dan teks brand terpusat di
`src/config/brand.ts` dan dapat ditimpa lewat environment variable.

> **Status proyek: Tahap 1–3 selesai untuk alur inti; Tahap 4 dimulai; Tahap 5 sebagian.**
> Lesson sudah dapat dimainkan dan dinilai di server, dengan XP/Koin tercatat di database.
> Tujuh tipe soal punya layar bermain, termasuk lima mini-game prioritas (Word Bank,
> Sentence Builder, Matching Pairs, Fill in the Blank, Picture Identification).
> 13 dari 20 mini-game belum dibangun. Rincian bukti dan sisa pekerjaan:
> **[docs/AUDIT.md](docs/AUDIT.md)**.

---

## Status implementasi

| Area | Status | Keterangan |
| --- | --- | --- |
| Fondasi Vite + TypeScript + Phaser 4 | **Implemented · Tested (build)** | Phaser dimuat lazy hanya saat stage maskot tampil. |
| Design system & layout responsif | **Implemented · Verified (browser smoke)** | Token warna, komponen, sidebar desktop, bottom nav mobile. |
| Landing page + maskot interaktif | **Implemented · Verified** | Kiko digambar vector dengan Phaser, idle/blink/wave/celebrate. |
| Register / login / logout | **Implemented · Unit tested, E2E pending** | Membutuhkan project Supabase aktif untuk uji end-to-end. |
| Verifikasi email & lupa password | **Implemented · Belum E2E** | Memakai Supabase Auth; tautan reset memakai redirect `/reset-password`. |
| Onboarding profil | **Implemented · Belum E2E** | Username, avatar, nama, target harian, zona waktu. Atomik via RPC. |
| Profil & pengaturan cloud | **Implemented · Belum E2E** | Disimpan di PostgreSQL dengan RLS + column-level grants. |
| Database & RLS | **Implemented · Tested di PGlite, belum di Supabase nyata** | 6 migration; 68 SQL smoke check lulus. |
| Kurikulum & bank soal | **Implemented · Tested (SQL smoke)** | 10 mapel, 22 level, 57 lesson, 217 soal, 7 tipe soal, 6 jenis node; 7 mapel inti + Bahasa Sambas. |
| Learning path & progres per mapel | **Implemented · Tested (SQL smoke)** | Node selesai/aktif/terkunci, unlock ditegakkan server, progres per course/node. |
| Lesson engine & halaman hasil | **Implemented · Tested (SQL smoke)** | Kunci jawaban tidak dikirim ke browser; XP/Koin idempoten per attempt. |
| Gameplay 20 mini-game | **Sebagian** | 7 punya layar: pilihan ganda, word bank, sentence builder, matching pairs, fill blank inline, picture identification, dan input teks. 13 mini-game belum. |
| XP & Koin | **Sebagian** | Ledger, wallet, dan reward lesson sudah bekerja; UI saldo dan level akun belum. |
| Hearts, Streak, Quest, Achievement, Shop | **Not implemented** | Tahap 5. |
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
- **Phaser 4.2.1** — area gameplay 2D (saat ini: stage maskot).
- **Supabase** — PostgreSQL, Auth, dan nanti Storage/Realtime/Edge Functions.
- **Vitest** — unit test. Playwright direncanakan pada tahap QA.

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
| `npm run test:sql` | Smoke test migration, RPC, reward, dan RLS di PGlite. |
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
│   │   ├── mascot/              # scene Phaser Kiko (lazy loaded)
│   │   └── minigames/           # renderer DOM per tipe soal + registry
│   ├── layouts/                 # auth layout, app shell
│   ├── pages/                   # auth, onboarding, beranda, belajar, lesson, profil
│   ├── repositories/            # akses data Supabase
│   ├── services/                # aturan bisnis, lesson engine client, pemetaan error
│   ├── stores/                  # session store observable
│   ├── styles/                  # tokens, base, components, layout, pages
│   ├── types/                   # tipe database & sesi
│   ├── utils/                   # DOM, validasi
│   └── main.ts
├── supabase/
│   └── migrations/
│       ├── 20261108090000_identity.sql
│       ├── 20261108100000_curriculum.sql
│       ├── 20261108105000_curriculum_overview.sql
│       ├── 20261108107000_question_pairs.sql
│       ├── 20261108110000_curriculum_seed.sql
│       └── 20261108120000_lesson_engine.sql
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
- [PROJECT_HISTORY.md](docs/PROJECT_HISTORY.md) — catatan per sesi pengembangan.

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
