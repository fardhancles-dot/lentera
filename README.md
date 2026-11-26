# Lentera

Game edukasi 2D berbasis web untuk jenjang SMA/SMK. Materi sekolah dirancang menjadi
petualangan: peta belajar, lesson interaktif, mini-game, XP, Koin, streak, quest, dan
Developer Dashboard.

Maskot: **Kiko**, roh daun penjaga Lentera. Identitas, warna, dan teks brand terpusat di
`frontend/src/config/brand.ts` dan dapat ditimpa lewat environment variable.

> **Status proyek: Tahap 1–8 selesai.**
> Lesson, latihan, dan **20 dari 20 mini-game** punya mekanik bermain nyata. Dua belas tipe
> soal dinilai di server (termasuk Listening, Speaking, Translation, Conversation, Story),
> tujuh mode latihan berjalan di atas sesi practice dengan XP idempoten, dan **Friends Quest**
> tersedia sebagai co-op berbasis kode undangan. Tahap 5 menambahkan **Hearts, Streak, level,
> wallet, reward level, milestone Streak, quest harian/mingguan, achievement, toko, dan
> inventory** yang seluruhnya dihitung server. Tahap 5 juga menambahkan **mastery per soal,
> jadwal review terjadwal, dan node hadiah di akhir setiap level**. Tahap 6 menambahkan
> **peta petualangan Phaser responsif**, **karakter Kiko reusable dengan 13 state animasi**,
> **audio sintetis** (musik, SFX, volume, mute), dan **pipeline aset**; daftar lesson DOM
> tetap dipakai sebagai jalur aksesibel. Tahap 7 menambahkan **pertemanan, notifikasi,
> 10 tier liga mingguan, leaderboard global/teman, event mingguan, dan privasi profil**.
> Tahap 8 menambahkan **Developer Dashboard staff-only: overview metrik, pencarian pemain,
> Reward Center satu akun, broadcast notifikasi, dan audit log append-only**. Lima belas
> migration sudah diterapkan ke Supabase nyata; 262 smoke check SQL dan 83 verifikasi API
> lulus. Full E2E **14 test lulus**, termasuk dashboard staff, hadiah ke akun sementara,
> audit log, dan penolakan pemain biasa. Rincian di
> **[docs/PROJECT_HANDOFF.md](docs/PROJECT_HANDOFF.md)**.

---

## Deployment

| Target | Status | Pantau |
| --- | --- | --- |
| GitHub Pages | ![Deploy GitHub Pages](https://github.com/fardhancles-dot/lentera/actions/workflows/deploy-pages.yml/badge.svg?branch=main) | [Workflow runs](https://github.com/fardhancles-dot/lentera/actions/workflows/deploy-pages.yml) · [Situs](https://fardhancles-dot.github.io/lentera/) |
| Vercel | Production otomatis dari push ke `main`; branch lain menjadi Preview | [Deployments](https://vercel.com/dhancles/lentera/deployments) · [Check commit](https://github.com/fardhancles-dot/lentera/commits/main) · [Situs](https://lentera-phi.vercel.app) |

Badge GitHub Pages menampilkan hasil workflow terakhir untuk `main`. Vercel tidak
menyediakan badge status publik tanpa autentikasi; status build-nya tampil sebagai check
**Vercel** pada commit di GitHub dan di halaman Deployments project. Detail alur deploy ada
di **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

---

## Status implementasi

| Area | Status | Keterangan |
| --- | --- | --- |
| Fondasi Vite + TypeScript + Phaser 4 | **Implemented · Tested (build)** | Phaser dimuat lazy hanya saat stage maskot atau peta petualangan tampil. |
| Design system & layout responsif | **Implemented · Verified (browser smoke)** | Token warna, komponen, sidebar desktop, bottom nav mobile. |
| Landing page + maskot interaktif | **Implemented · Verified** | Kiko digambar vector dengan Phaser, idle/blink/celebrate. |
| Peta petualangan Phaser + animasi Kiko | **Implemented · Tested (unit + build + browser berakun)** | `createKiko` dengan 13 state animasi dipakai ulang oleh maskot dan peta; peta di `/learn/:subject` punya status selesai/sedang dikerjakan/siap/terkunci/pratinjau, pemilih area DOM yang aksesibel, penanda posisi, palet berbeda per area, layout wide/compact dengan koordinat terpisah, dan dukungan `prefers-reduced-motion`. |
| Sistem audio | **Implemented · Tested (unit + browser smoke); pemutaran belum diverifikasi telinga** | Musik dan SFX disintesis Web Audio, volume mengikuti pengaturan pemain, mute lokal di topbar, autoplay-safe. |
| Pipeline aset | **Implemented · Tested (unit)** | `frontend/src/game/assets/manifest.ts` + loader Phaser, lisensi tercatat di `docs/ASSETS.md`. |
| Register / login / logout | **Implemented · E2E verified** | Login API, payload lesson, grading, dan Practice Hub diuji ke project Supabase nyata. |
| Registrasi tanpa verifikasi email & lupa password | **Implemented · E2E + API + real-email verified** | Registrasi dengan password minimal 6 karakter langsung mendapat sesi (Confirm email dimatikan di project). Reset password memakai OTP 6 angka resmi Supabase: kode benar/salah, pemakaian ulang, password baru 6 karakter, dan login ulang diuji lewat API; alur tautan reset diuji E2E. SMTP produksi Brevo terpasang: email reset sungguhan terkirim ke Gmail, kode 6 angka diterima, password baru bisa dipakai login, dan kode yang sama ditolak saat dipakai ulang. |
| Onboarding profil | **Implemented · E2E (via helper akun uji)** | Username, avatar, nama, target harian, zona waktu. Atomik via RPC. |
| Profil & pengaturan cloud | **Implemented · E2E verified** | Simpan nama tampilan/bio dan preferensi reduced motion ± persist setelah reload diuji browser. |
| Database & RLS | **Implemented · Tested (PGlite + Supabase API)** | 15 migration diterapkan ke project Supabase; 262 SQL smoke check + 83 verifikasi API lulus. |
| Kurikulum & bank soal | **Implemented · Tested (SQL + E2E)** | 10 mapel, 56 level aktif, 57 lesson, 231 soal, 12 tipe soal, 7 jenis node; 7 mapel inti + Bahasa Sambas. |
| Learning path & progres per mapel | **Implemented · Tested (SQL smoke)** | Node selesai/aktif/terkunci, unlock ditegakkan server, progres per course/node. |
| Lesson engine & halaman hasil | **Implemented · Tested (SQL smoke + E2E)** | Kunci jawaban tidak dikirim ke browser; XP/Koin idempoten per attempt. Halaman lesson menampilkan lima riwayat percobaan terakhir milik pemain (akurasi, skor, benar/total) dari `lesson_attempts` dengan RLS. |
| Gameplay 20 mini-game | **20/20 implemented · Tested (SQL + API + E2E alur jawab)** | 12 tipe soal punya layar; 7 mode latihan; Conversation bertahap dan Story dengan pilihan respons. E2E menjawab satu soal lesson dan satu soal latihan sampai feedback; 20 mekanik belum dijelajahi satu per satu di browser. |
| Practice Hub & sesi latihan | **Implemented · Tested (SQL + E2E)** | Sesi server, timer, combo, bonus kecepatan, XP idempoten, unit chooser. E2E memulai sesi nyata dan memeriksa feedback penilaian. |
| Friends Quest | **Implemented · Tested (SQL + API + E2E dua akun)** | Co-op lewat kode undangan, target XP gabungan, kontribusi dari XP lesson/latihan server, klaim sekali per anggota. E2E membuat quest, bergabung dengan akun kedua, memeriksa 2/8 anggota, klaim bersamaan, persistensi, dan penolakan non-anggota. |
| XP, Koin, Hearts, Streak & level | **Implemented · Tested (SQL + Supabase API)** | Ledger XP/Koin, Hearts dengan regenerasi/refill, Streak harian, 30 level akun, dan halaman `/wallet` dengan riwayat transaksi. Semua angka berasal dari RPC server. |
| Reward level, milestone Streak, quest & achievement | **Implemented · Tested (SQL + Supabase API)** | Hadiah level dan milestone Streak otomatis lewat trigger; 3 quest harian + 3 mingguan dan 8 achievement dihitung dari ledger XP. Halaman `/quests` dan `/wallet`; UI belum diuji browser dengan akun nyata. |
| Toko & inventory | **Implemented · Tested (SQL + Supabase API)** | Katalog dua item consumable, pembelian atomik, tas terpisah, Ramuan Hati, dan Perisai Streak (maksimal 2). Halaman `/shop` dan `/inventory`; UI belum diuji browser dengan akun nyata. |
| Mastery, review terjadwal & node hadiah | **Implemented · Tested (SQL + Supabase API + unit)** | `user_question_mastery` per soal, interval 1/3/7/14/30 hari, halaman `/mastery`, mode Review Terjadwal, dan 22 node hadiah level dengan klaim idempoten. UI belum diuji browser. |
| Teman, notifikasi & privasi profil | **Implemented · Tested (SQL + API + E2E dua akun)** | Pencarian pemain, permintaan/terima/hapus teman, notifikasi, dan visibilitas statistik `private`/`friends`/`public`. Statistik hanya dibuka server sesuai relasi dan pengaturan. |
| Liga, leaderboard & event mingguan | **Implemented · Tested (SQL + API + E2E dua akun)** | 10 tier, grup mingguan maksimal 30 pemain, promosi 5 teratas, degradasi 5 terbawah bila minimal 10 pemain, hadiah `10 + tier × 5` Koin, leaderboard global/teman, event mingguan 100 XP → 25 Koin, dan klaim idempoten. |
| Developer Dashboard | **Implemented · Tested (SQL + API + E2E)** | `/developer` staff-only: overview, pencarian pemain, Reward Center satu akun, broadcast maksimal 500 penerima, dan audit log append-only. E2E mengirim hadiah ke akun sementara dan memastikan pemain biasa ditolak. |
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
Deployment ganda Vercel + GitHub Pages: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

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
| `npm run verify:supabase` | Verifikasi login, payload satu soal per level, grading, hasil lesson, Practice Hub, Friends Quest, sosial/liga/event, notifikasi, privasi, dan idempotensi reward di Supabase nyata. |
| `npm run verify:auto-levels` | Verifikasi browser: tambah soal per mapel, level otomatis, peta publik, gameplay satu soal, edit/arsip, dan cleanup. |
| `npm run db:apply-catalog-fix` | Menerapkan migration view katalog lewat Supabase Management API (`SUPABASE_ACCESS_TOKEN`); `-- --dry-run` untuk pratinjau. |
| `npm run seed:build` | Validasi konten dan regenerasi migration seed kurikulum. |

---

## Struktur proyek

```text
.
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── public/
│   │   └── favicon.svg + assets/pictures/
│   └── src/
│       ├── app/                 # history router + guard akses + cleanup halaman
│       ├── components/          # ikon SVG, avatar, form, toast, brand art
│       ├── config/              # brand, env, katalog avatar
│       ├── game/
│       │   ├── characters/      # factory Kiko + 13 state animasi
│       │   ├── adventure/       # layout peta + mount helper Phaser (lazy loaded)
│       │   ├── scenes/          # scene Phaser peta petualangan
│       │   ├── mascot/          # stage maskot landing (memakai createKiko)
│       │   ├── audio/           # text-to-speech untuk model audio
│       │   ├── practice/        # helper tampilan timer & combo
│       │   └── minigames/       # renderer DOM per tipe soal + registry
│       ├── layouts/             # auth layout, app shell
│       ├── pages/               # auth, onboarding, beranda, belajar, lesson, latihan, profil
│       ├── repositories/        # akses data Supabase
│       ├── services/            # aturan bisnis, lesson engine client, pemetaan error
│       ├── stores/              # session, player, dan rewards store observable
│       ├── styles/              # tokens, base, components, layout, pages, practice, social
│       ├── types/               # tipe database & sesi
│       ├── utils/               # DOM, validasi
│       └── main.ts
├── backend/
│   └── supabase/
│       ├── migrations/          # seluruh migration database
│       ├── seed/                # sumber + generator seed kurikulum
│       └── .temp/               # cache Supabase CLI (di-ignore)
├── tests/
│   ├── unit/                    # unit test Vitest
│   └── e2e/                     # smoke test Playwright
├── scripts/                     # verifikasi Supabase, admin, dan smoke test SQL
├── docs/                        # dokumentasi teknis + laporan audit
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── vercel.json
└── .github/workflows/           # deploy GitHub Pages
```

Build tetap menghasilkan `dist/` di root, sehingga konfigurasi Vercel dan GitHub Pages tidak
berubah. `.env` juga tetap di root: Vite membacanya lewat `envDir` dan skrip Node memakai
`--env-file=.env`. Perintah Supabase CLI dijalankan dari `backend/` (skrip
`npm run setup:supabase` sudah mengarahkan sendiri).

---

## Dokumentasi

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — arsitektur, alur data, keputusan teknis.
- [DATABASE.md](docs/DATABASE.md) — skema, RLS, fungsi, cara menambah tabel.
- [SETUP.md](docs/SETUP.md) — Supabase, email, migrasi, Vercel, troubleshooting.
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — deployment ganda Vercel + GitHub Pages, CI/CD, environment.
- [SECURITY.md](docs/SECURITY.md) — model keamanan dan batasan yang diketahui.
- [GAME_DESIGN.md](docs/GAME_DESIGN.md) — identitas visual, maskot, motion.
- [GAMEPLAY.md](docs/GAMEPLAY.md) — rencana lesson engine & 20 mini-game, status nyata.
- [TESTING.md](docs/TESTING.md) — test yang ada, checklist manual, gap.
- [AUDIT.md](docs/AUDIT.md) — laporan audit kondisi nyata, temuan, dan rencana lanjutan.
- [AUDIT_STAGE4.md](docs/AUDIT_STAGE4.md) — snapshot audit Tahap 4 sebelum perbaikan.
- [STAGE4_COMPLETION.md](docs/STAGE4_COMPLETION.md) — laporan akhir Tahap 4 dan bukti pengujian.
- [PROJECT_HISTORY.md](docs/PROJECT_HISTORY.md) — catatan per sesi pengembangan.
- [SESSION_2026-11-09.md](docs/SESSION_2026-11-09.md) — catatan percakapan dan status sesi lima mini-game.

Dokumentasi sistem reward lanjutan, audit log, dan Developer Dashboard diperbarui bersama
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
