# Project Handoff — Stage 6

Diperbarui: 10 November 2026.

## Status ringkas

Stage 1–5 tetap utuh. Stage 6 (karakter, animasi, audio, adventure map, responsif,
pipeline aset) sudah diimplementasikan dan lolos typecheck, 72 unit test, build, serta
9 test browser: rute aplikasi, alur lesson dan latihan, profil/pengaturan, Friends Quest
dua akun, maskot landing, dan peta dengan akun QA (pemilih level keyboard, status live,
mute, dan breakpoint ponsel 390px).

## Yang selesai

- **Karakter Kiko** (`src/game/characters/kiko.ts`): satu factory untuk landing,
  hasil lesson, dan peta; 13 state animasi; `prefers-reduced-motion` dihormati.
- **Animasi**: idle/blink di landing, celebrate saat diklik, menang/kalah di halaman
  hasil lesson, berjalan ke node peta, denied/disappointed untuk node terkunci,
  transisi fade antarlevel peta.
- **Audio** (`src/game/audio/`): SFX sintetis (klik, langkah, benar, salah, selesai,
  hadiah, terkunci), musik latar sintetis, volume dari pengaturan pemain, mute lokal
  di topbar, autoplay-safe (unlock setelah gesture), berhenti saat tab disembunyikan.
- **Adventure Map**: level picker DOM yang aksesibel, status node, penanda “Kamu”,
  Kiko berjalan, retry unlock, layout wide (900×460) dan compact (420×620) dengan
  remount otomatis saat breakpoint berubah.
- **Pipeline aset**: manifest + loader + `docs/ASSETS.md`; lisensi tercatat; unit test
  memvalidasi path file.
- **UI responsif**: peta compact memakai dua kolom dan label 15px sehingga tidak hanya
  diperkecil; frame memakai rasio dari viewport aktif.
- **Riwayat percobaan**: halaman lesson menampilkan lima penyelesaian terakhir milik pemain
  (tanggal, akurasi, benar/total, poin) dari `lesson_attempts` dengan RLS select own.

## File utama

- `src/game/characters/kiko.ts`
- `src/game/mascot/createMascotStage.ts`
- `src/game/audio/audioEngine.ts`, `patterns.ts`, `speech.ts`
- `src/game/adventure/{types,layout,createAdventureMap}.ts`
- `src/game/scenes/adventureMapScene.ts`
- `src/game/assets/{manifest,load}.ts`
- `src/pages/learn-subject.page.ts`, `lesson-play.page.ts`, `learn-reward.page.ts`
- `src/layouts/appLayout.ts`, `src/main.ts`, `src/components/icons.ts`
- `src/styles/pages.css`
- `tests/{adventure-map,audio,assets}.test.ts`, `tests/e2e/stage6.spec.ts`
- `playwright.config.ts`, `docs/ASSETS.md`

## Verifikasi terakhir

| Perintah | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus |
| `npm test` | 72 test lulus (10 file) |
| `npm run build` | Lulus |
| `npm run test:e2e` | 9 lulus, 1 skip (9 rute, alur lesson, latihan, reset password, profil/pengaturan, overflow ponsel, reduced motion, maskot landing, peta berakun; Friends Quest butuh akun kedua) |
| `npm run test:sql` | 206 check lulus (termasuk akses view katalog sebagai `authenticated`) |
| `npm run verify:supabase` | 61 check lulus (termasuk view katalog terbaca pemain) |

## Catatan pengujian

- Katalog sempat gagal dengan `permission denied for table questions` dari view
  `subject_overview` (`security_invoker = true` sementara `questions` di-revoke).
  `curriculumRepository.listSubjects` kini punya fallback agregat dari tabel terpublikasi
  + `lesson_question_stats`, jadi `/learn` dan `/practice` tidak lagi error.
- Perbaikan permanen ada di
  `supabase/migrations/20261110150000_subject_overview_owner.sql` dan **sudah diterapkan**
  ke project nyata lewat `npm run db:apply-catalog-fix` (Management API + token di `.env`).
  View kembali menjadi sumber katalog dan log 403 hilang; fallback client tetap ada sebagai
  jaring aman untuk database yang belum menjalankan migration terbaru.
- Login browser sempat gagal karena listener submit dipasang setelah `await`; sudah
  diperbaiki di login, register, dan lupa password (listener dipasang sebelum menunggu
  layout). Ini juga menutup celah password muncul di query string.
- Akun QA di `.env` menyelesaikan onboarding sekali saat pengujian (data aditif pada akun
  uji, bukan data pengguna lain).
- Test Friends Quest memerlukan `E2E_EMAIL_2`/`E2E_PASSWORD_2`; alur dua akun sudah
  diverifikasi memakai akun sementara yang dibuat lewat Admin API lalu dihapus lagi.
  Quest uji berjudul `E2E Quest …` dibersihkan otomatis bila `SUPABASE_ACCESS_TOKEN` ada.
- Audio belum diverifikasi dengan telinga; headless hanya memastikan tidak ada error dan
  mute berubah `aria-pressed`.

## Sisa pekerjaan (audit 10 November 2026)

Belum selesai, berurutan dari yang paling cepat ditutup:

1. **Verifikasi manual audio** — klik, jawaban benar/salah, hadiah, mute, dan slider volume.
2. **Pembaca layar sungguhan** untuk pemilih level peta dan form latihan.
3. **Konfirmasi pendaftaran lewat email** — satu-satunya alur Auth yang masih butuh kotak
   surat uji; alur lupa password sudah E2E memakai tautan resmi dari Admin API.
4. **E2E akun kedua permanen** — isi `E2E_EMAIL_2`/`E2E_PASSWORD_2` di `.env` agar test
   Friends Quest berjalan di setiap run, bukan skip.
5. **E2E transaksi** — beli item toko, klaim quest/achievement, mastery/review.
6. **Cakupan 20 mekanik mini-game** — saat ini browser baru menguji dua alur jawab.
7. **Mapel multi-course** — katalog masih memakai `courses[0]`; perlu redesign bila mapel
   punya lebih dari satu course.
8. **Deployment produksi** (Vercel) dan **Tahap 7** (graf teman/liga/leaderboard).

## Langkah berikutnya

1. Uji audio secara manual di browser (klik, jawaban, hadiah, mute, volume).
2. Tambahkan sprite sheet/audio final bila tersedia, daftarkan di manifest.
3. Uji pemilih level dengan pembaca layar sungguhan.
4. Isi kredensial akun kedua agar test Friends Quest tidak skip.
5. Lanjut Stage 7 (leaderboard/liga/teman) hanya setelah verifikasi manual di atas.
