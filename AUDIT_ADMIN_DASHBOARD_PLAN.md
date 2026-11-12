# AUDIT MENYELURUH SISTEM WEBSITE & PERENCANAAN ADMIN DASHBOARD CMS

**Proyek:** Lentera — platform game edukasi 2D berbasis web
**Tanggal audit:** 12 November 2026
**Jenis pekerjaan:** audit, analisis, dan perencanaan; **bukan implementasi**
**Status dokumen:** final audit read-only
**Deliverable:** dokumen ini, `AUDIT_ADMIN_DASHBOARD_PLAN.md`

> **Batas kerja yang dipatuhi:** audit ini tidak mengubah source code, struktur folder, database, migrasi, konfigurasi, UI/UX, backend/frontend, dependency, atau menjalankan refactor/bugfix. Satu-satunya file yang dibuat adalah dokumen laporan ini. Implementasi belum dimulai dan menunggu instruksi berikutnya.

---

## Metode audit dan batas verifikasi

Audit dilakukan dengan membaca langsung repository, bukan hanya dokumentasi:

1. Menelusuri 28 definisi route di `src/app/router.ts`, 29 modul halaman di `src/pages/`, layout `src/layouts/appLayout.ts`, komponen, service, repository, store, dan tipe data.
2. Membaca 15 migration di `supabase/migrations/`, seluruh RPC, RLS policy, grant tabel, trigger, dan seed kurikulum.
3. Memutar ulang seluruh migration beserta seed ke PostgreSQL lokal melalui PGlite untuk mendapatkan skema dan angka data yang dapat diverifikasi. Database ini bukan database Supabase live.
4. Membandingkan dokumentasi lama (`README.md`, `docs/*`) dengan kode dan skema aktual.
5. Tidak menjalankan E2E, login ke Supabase live, atau query database produksi pada audit ini. Hasil verifikasi terakhir sebelum audit dicatat terpisah sebagai konteks, bukan sebagai hasil audit ulang.

**Belum terverifikasi:** jumlah pengguna, aktivitas, dan data produksi di Supabase live; konfigurasi environment produksi; kebijakan MFA/rate limit di dashboard Supabase; tampilan admin pada 390 px dan pembaca layar; kesesuaian seluruh migration yang sudah diterapkan di project live dengan folder migration. Angka database di laporan ini berasal dari replika migration + seed lokal.

---

## 1. Ringkasan kondisi proyek

### 1.1 Identitas teknis

Lentera adalah SPA (single-page application) Vite + TypeScript dengan Phaser untuk elemen game, Supabase sebagai Auth/PostgreSQL/API, dan tidak memiliki backend Node sendiri. Browser memanggil Supabase langsung memakai anon key. Semua operasi istimewa yang sudah ada memakai RPC `security definer`, bukan grant tulis langsung ke tabel.

| Aspek | Kondisi aktual |
| --- | --- |
| Frontend | Vite 8, TypeScript strict, HTML/CSS/Phaser 4 |
| Routing | History router buatan sendiri, 28 route, lazy import halaman |
| Backend | Tidak ada server aplikasi; Supabase Auth + PostgREST + RPC |
| Database | 51 tabel publik, 2 view, 85 fungsi publik |
| Migration | 15 file migration, termasuk seed kurikulum |
| Otorisasi | Route guard `staff`, RPC `is_staff()`, RLS |
| Peran | `player`, `admin`, `developer` |
| Admin saat ini | Hanya `/developer`; operasional pemain, bukan CMS |
| Media | URL file statis; belum memakai Supabase Storage |
| Konten publik | Sebagian besar kurikulum di database; teks situs dan katalog aset masih di kode |

### 1.2 Angka kunci dari replika database

Angka berikut berasal dari PGlite setelah seluruh migration dan seed dijalankan. Ini menggambarkan isi seed yang dapat direproduksi, bukan data produksi.

| Entitas | Jumlah | Catatan |
| --- | ---: | --- |
| Mata pelajaran | 10 | 8 berstatus aktif, 2 berstatus development |
| Kursus | 8 | Satu kursus untuk setiap mapel yang punya level |
| Level/bab | 22 | Tersebar pada 8 kursus |
| Unit | 22 | Rata-rata satu unit per level |
| Lesson | 57 | 22 lesson, 14 review, 7 practice, 7 challenge, 7 legendary |
| Learning node | 79 | 22 lesson, 7 review, 7 practice, 7 challenge, 7 checkpoint, 7 legendary, 22 reward |
| Reward node | 22 | Total 650 Koin dan 255 XP pada node reward |
| Soal | 231 | 12 tipe soal |
| Opsi jawaban | 681 | Terbanyak pada soal pilihan ganda |
| Kunci jawaban teks | 68 | Untuk typing, fill blank, translation, dan sejenisnya |
| Pasangan soal | 19 | Matching pairs |
| Media soal | 3 | Hanya tiga URL SVG di `public/assets/pictures/` |
| Quest definition | 6 | 3 harian dan 3 mingguan |
| Achievement | 8 | Katalog tetap |
| Item toko | 2 | Katalog kecil |
| Tier liga | 10 | Katalog tetap |
| Streak milestone | 6 | Katalog tetap |
| Level pemain | 30 | Ambang XP tetap |
| Event mingguan | 0 baris | Dibuat otomatis oleh `ensure_week_event()` saat dipanggil |
| Profil/pemain | 0 | Replika seed tidak memiliki akun; angka live tidak diketahui |

Sebaran soal: 155 multiple choice, 46 fill blank, 11 typing, 4 matching pairs, 3 listening, 3 picture identification, 2 speaking, 2 conversation, 2 story, 1 word bank, 1 sentence builder, 1 translation. Sebaran kesulitan: 98 beginner, 77 elementary, 56 intermediate.

Sebaran mapel:

| Mapel | Status | Level | Lesson | Soal | Catatan |
| --- | --- | ---: | ---: | ---: | --- |
| Pemrograman Web | active | 3 | 8 | 30 | Mapel inti |
| Basis Data | active | 3 | 8 | 30 | Mapel inti |
| PPB — Flutter & Dart | active | 3 | 8 | 30 | Mapel inti |
| Bahasa Inggris | active | 3 | 8 | 45 | Mapel inti |
| Bahasa Indonesia | active | 3 | 8 | 36 | Mapel inti |
| Pendidikan Pancasila | active | 3 | 8 | 30 | Mapel inti |
| Matematika | active | 3 | 8 | 30 | Mapel inti |
| Bahasa Sambas | active | 1 | 1 | 0 | Aktif tetapi bank soal kosong |
| Bahasa Jawa | development | 0 | 0 | 0 | Belum punya course/level |
| Bahasa Sunda | development | 0 | 0 | 0 | Belum punya course/level |

### 1.3 Arsitektur data dan alur baca

Alur utama yang ditemukan:

```text
Browser
  ├─ Supabase Auth (login, sesi, reset password)
  ├─ PostgREST SELECT langsung untuk katalog dan data yang diizinkan RLS
  └─ RPC security definer untuk data sensitif dan aksi tulis istimewa
        ├─ lesson engine, practice engine, reward, quest, shop
        ├─ sosial, liga, notifikasi
        └─ developer dashboard (overview, cari pemain, grant, broadcast, audit)
```

Kurikulum memakai rantai:

```text
subjects → courses → course_levels → units → lessons
                                      └→ learning_nodes → questions
                                                           ├→ question_options
                                                           ├→ question_answers
                                                           ├→ question_media
                                                           └→ question_pairs
```

Halaman peta belajar sekarang menurunkan level perjalanan dari `learning_nodes` yang playable dan node `reward`; tidak membuat data reward baru. Model ini sudah benar sebagai fondasi CMS karena level, urutan, status, dan reward berasal dari database.

### 1.4 Temuan eksekutif

1. **Admin Dashboard yang ada bukan CMS.** `/developer` hanya menampilkan ringkasan, mencari pemain, mengirim Koin/XP, broadcast notifikasi, dan membaca audit log. Tidak ada CRUD mata pelajaran, level, lesson, soal, media, pengguna, role, quest, toko, event, atau halaman situs.
2. **Model konten sudah kuat, tetapi belum ada bidang kendali tulis.** Tabel kurikulum, soal, reward, quest, toko, liga, dan event sudah ada. Masalahnya bukan kekurangan skema dasar, melainkan tidak adanya API admin untuk menulis dan tidak adanya UI pengelolaan.
3. **Tabel konten sengaja tertutup rapat.** `questions`, `question_options`, `question_answers`, `question_media`, dan `question_pairs` memiliki RLS aktif tetapi **0 policy** dan tidak diberi akses SELECT ke pemain. Pemain membaca soal melalui RPC yang menyaring jawaban. Artinya, menambahkan grant CRUD langsung kepada `authenticated` akan merusak proteksi kunci jawaban. Solusinya harus RPC admin khusus.
4. **Admin saat ini juga tidak bisa membaca draft.** Policy `courses`, `course_levels`, `units`, dan `lessons` hanya mengizinkan baris `is_published`. Jadi walaupun admin ingin mengedit, data draft tidak terlihat lewat query biasa. Diperlukan RPC baca admin yang dapat melihat draft tanpa membukanya ke pemain.
5. **Teks situs, brand, ikon, avatar, dan katalog aset masih hardcoded.** Mengubah nama situs, tagline, copyright, fitur landing, roadmap beranda, ikon mapel, avatar, atau pilihan target harian masih memerlukan edit kode dan build/deploy.
6. **Media belum terkelola.** Hanya ada tiga media soal berupa URL SVG. Tidak ada bucket Supabase Storage, tabel aset, upload, alt text terkelola, atau pembersihan file yatim.
7. **Materi pembelajaran belum berbentuk konten panjang.** Yang ada adalah `lessons.title`, `lessons.description`, `units.objectives`, dan `questions.explanation`. Tidak ada tabel badan materi, bagian bacaan, atau blok konten yang bisa ditulis admin. Ini gap penting bila “materi” berarti bahan bacaan, bukan hanya bank soal.
8. **Manajemen pengguna masih sangat terbatas.** Admin dapat mencari pemain dan memberi hadiah, tetapi tidak dapat mengubah role, menonaktifkan akun, mereset password, atau melihat riwayat aktivitas per pengguna. Operasi akun sensitif memerlukan Edge Function dengan service role; tidak boleh dari browser.
9. **Belum ada revisi, preview publik, scheduled publish, atau bulk import.** Untuk CMS yang dipakai banyak editor, ini risiko operasional, bukan sekadar fitur tambahan.
10. **Dokumentasi sudah stale di beberapa tempat.** `README.md` masih menyebut peta Phaser sebagai status utama, sedangkan working tree sudah memiliki peta DOM native-scroll. Beranda juga masih menulis “6 jenis node” padahal skema memiliki 7 tipe node. Dokumentasi tidak boleh dijadikan satu-satunya sumber kebenaran.

### 1.5 Kesiapan CMS per lapisan

| Lapisan | Status | Alasan |
| --- | --- | --- |
| Model data kurikulum | **Siap** | Rantai subject sampai question sudah ternormalisasi |
| Model data gamifikasi | **Siap sebagian** | Katalog ada, tetapi sebagian nilai awal berasal dari seed/SQL |
| API baca publik | **Siap** | View dan RPC sudah membatasi data sensitif |
| API tulis admin | **Belum ada** | Tidak ada RPC admin konten dan tidak ada grant tulis |
| UI admin konten | **Belum ada** | Hanya `/developer` operasional |
| Media dan aset | **Belum ada** | Tidak ada Storage, metadata aset, atau upload |
| Konten halaman situs | **Belum ada** | Teks dan brand ada di source |
| IAM granular | **Sebagian** | Ada role, tetapi `admin` dan `developer` disamakan oleh `is_staff()` |
| Audit | **Sebagian** | Append-only sudah ada, tetapi baru dua jenis aksi yang tercatat |
| Tata kelola konten | **Belum ada** | Tidak ada revisi, jadwal terbit, atau alur draft-review-publish |

**Kesimpulan ringkas:** fondasi database untuk CMS sudah lebih matang daripada tampilan adminnya. Pekerjaan terbesar bukan membuat ulang kurikulum, melainkan membangun **admin plane**: izin granular, RPC tulis yang aman, media, UI pengelolaan, dan tata kelola konten.

---

## 2. Daftar seluruh fitur website yang ditemukan

Tabel ini memetakan fitur yang benar-benar ada di kode, sumber datanya, dan status pengelolaan admin. “Tidak” berarti tidak ada jalur pengelolaan di dashboard, bukan berarti data tidak ada di database.

| # | Route/area | Fitur | Sumber data | Bisa dikelola admin? |
| ---: | --- | --- | --- | --- |
| 1 | `/` | Landing page, hero, fitur, CTA, maskot Kiko Phaser, footer | Teks hardcoded + aset prosedural | Tidak |
| 2 | `/login` | Login email/password, redirect, pesan konfigurasi | Supabase Auth | Tidak; konfigurasi dilakukan di luar aplikasi |
| 3 | `/register` | Registrasi akun, pembuatan profil/settings/role otomatis | Supabase Auth + trigger | Tidak |
| 4 | `/forgot-password` | Permintaan reset dan verifikasi OTP 6 angka | Supabase Auth | Tidak |
| 5 | `/reset-password` | Pembuatan password baru setelah recovery | Supabase Auth | Tidak |
| 6 | `/onboarding` | Username, nama tampilan, avatar, target harian, zona waktu | `profiles`, `user_settings`, RPC onboarding | Tidak; hanya pemain mengelola miliknya |
| 7 | `/app` | Beranda pemain, sapaan, target harian, roadmap, status sistem, tip | Profil/settings DB + teks hardcoded | Tidak |
| 8 | `/learn` | Katalog mapel, statistik mapel, kartu status | `subject_overview`, `subjects` | Tidak ada editor; data DB |
| 9 | `/learn/:subject` | Peta perjalanan, node selesai/aktif/terkunci, reward, auto-scroll | `learning_nodes`, progres, RPC path | Tidak ada editor; data DB |
| 10 | `/learn/:subject/lesson/:lessonSlug` | Detail lesson, tujuan unit, statistik soal, riwayat attempt, preview developer | `lessons`, `units`, `lesson_question_stats`, `lesson_attempts` | Tidak ada editor; data DB |
| 11 | `/learn/:subject/lesson/:lessonSlug/play` | Lesson engine, 12 tipe soal, penilaian server, hasil | RPC `start_lesson`, `submit_attempt_answer`, `complete_lesson_attempt` | Tidak ada editor soal |
| 12 | `/learn/:subject/reward/:nodeSlug` | Halaman reward level dan klaim Koin/XP | `learning_nodes`, RPC `claim_reward_node` | Tidak ada editor reward |
| 13 | `/practice` | Practice Hub, 8 mode, pemilih unit, rekomendasi mastery | `PRACTICE_MODES` hardcoded + RPC | Tidak; mode dan copy hardcoded |
| 14 | `/mastery` | Penguasaan per soal, jadwal review, mulai review | `user_question_mastery`, RPC mastery | Tidak |
| 15 | `/practice/play` | Sesi latihan, timer, combo, jawaban, hasil | RPC practice engine | Tidak |
| 16 | `/wallet` | Saldo Koin/XP, riwayat transaksi, hearts | `user_wallets`, ledger, RPC | Tidak; admin hanya bisa grant hadiah |
| 17 | `/quests` | Quest harian/mingguan, progres, klaim | `quest_definitions`, RPC rewards | Tidak |
| 18 | `/shop` | Katalog item, pembelian, inventory, pemakaian item | `shop_items`, RPC toko | Tidak |
| 19 | `/friends-quest` | Co-op quest, kode undangan, target XP, klaim | Tabel `friend_quest*`, RPC | Tidak |
| 20 | `/friends` | Cari pemain, permintaan, daftar teman, aktivitas | `friendships`, `profiles`, RPC sosial | Tidak |
| 21 | `/leaderboard` | Liga mingguan, global/teman, event, klaim hadiah | `league_*`, `game_events`, RPC | Tidak |
| 22 | `/notifications` | Inbox notifikasi, tandai dibaca | `notifications`, RPC | Sebagian: hanya broadcast dari `/developer` |
| 23 | `/players/:username` | Profil publik pemain sesuai visibilitas | `profiles`, sosial RPC | Tidak |
| 24 | `/profile` | Edit profil, bio, avatar, statistik | `profiles`, `player_state` | Tidak; pemain mengelola miliknya |
| 25 | `/settings` | Target harian, zona waktu, locale, audio, reduced motion, privasi, email opt-in | `user_settings` | Tidak |
| 26 | `/developer` | Overview metrik, cari pemain, grant Koin/XP, broadcast, audit log | RPC developer | **Ya, terbatas pada lima aksi operasional** |
| 27 | `/setup` | Panduan konfigurasi Supabase | Teks hardcoded | Tidak |
| 28 | `/404` | Halaman tidak ditemukan | Teks hardcoded | Tidak |
| 29 | Lintas halaman | Navigasi desktop/mobile/drawer, resource chip, toast, modal, audio, reduced motion | `NAV_ITEMS` dan komponen hardcoded | Tidak |
| 30 | Lintas halaman | Aset game, Kiko, peta lama Phaser, audio sintetis, manifest lisensi | `src/game/**` | Tidak; aset teknis sebaiknya tetap di kode |

### 2.1 Fitur yang sudah berjalan dan relevan untuk CMS

- Kurikulum terstruktur sampai bank soal dan media soal.
- Peta belajar yang diturunkan dari database dan menghormati status progres.
- Lesson engine yang menilai di server dan tidak mengirim kunci jawaban ke browser.
- Latihan, mastery, reward, quest, achievement, toko, liga, event, dan notifikasi.
- Sosial: teman, profil publik, aktivitas, Friends Quest.
- Admin operasional: metrik, pencarian pemain, grant, broadcast, audit.
- RLS dan RPC security definer sudah menjadi pola yang konsisten untuk data sensitif.

### 2.2 Fitur yang belum ada tetapi diminta oleh visi CMS

- CRUD mapel, kursus, level, unit, lesson, node, dan soal.
- Pengelolaan media dan ikon.
- Pengelolaan teks, halaman, FAQ, banner, dan SEO.
- Manajemen pengguna, role, status akun, dan reset password oleh staff.
- Pengelolaan quest, achievement, toko, level pemain, streak, liga, dan event.
- Draft, preview, publish, jadwal terbit, revisi, dan rollback.
- Feature flag, navigasi dinamis, bulk import/export, dan content health.

## 3. Daftar seluruh konten yang masih hardcoded

### 3.1 Cara membaca bagian ini

Tidak semua string di source code perlu menjadi CMS. Tombol “Simpan”, label aksesibilitas, pesan validasi, dan nama state internal sebaiknya tetap di kode agar tidak mudah rusak. Yang masuk daftar berikut adalah **konten yang memengaruhi isi publik, identitas, katalog, atau aturan yang wajar diubah oleh pemilik produk**, ditambah katalog yang saat ini mengunci admin pada pilihan tertentu.

### 3.2 Inventaris konten hardcoded

| # | Konten | Lokasi | Bentuk saat ini | Dampak | Rekomendasi |
| ---: | --- | --- | --- | --- | --- |
| 1 | Nama produk, tagline, versi, URL dukungan, nama copyright, warna brand, nama dan peran maskot | `src/config/brand.ts:9-46`; override `VITE_GAME_NAME`, `VITE_GAME_TAGLINE`, `VITE_GAME_VERSION`, `VITE_SUPPORT_URL` | Konstanta build-time; hanya bisa diubah lewat edit kode atau environment lalu rebuild | Brand tidak bisa diubah admin; setiap perubahan butuh deploy | Pindahkan identitas runtime ke `site_settings`; pertahankan fallback build-time untuk boot pertama |
| 2 | Judul dokumen, meta description, theme color, color scheme, favicon | `index.html:5-11` | HTML statis | SEO dan tampilan awal tidak dapat diubah dari dashboard | Simpan nilai SEO di `site_settings`; update `document.title`/meta saat boot; untuk SEO sebenarnya perlu pre-render atau edge rendering |
| 3 | Judul tab per halaman | `const meta = { title: ... }` di 29 file `src/pages/*.ts`, misalnya `welcome.page.ts:8`, `home.page.ts:8`, `settings.page.ts:11` | Konstanta per modul | Admin tidak bisa mengubah nama halaman | Pertahankan sebagai fallback; tambahkan override `page_meta` di `content_pages`/`site_settings` |
| 4 | Hero landing: eyebrow, judul, lede, CTA, trust badge | `src/pages/welcome.page.ts:77-116` | JSX-like `el()` dengan teks literal | Copy marketing tidak bisa diubah tanpa deploy | Modelkan sebagai `landing_sections` atau blok `content_pages` dengan field per bagian |
| 5 | Fitur landing dan deskripsinya | `src/pages/welcome.page.ts:10-29` | Array `FEATURES` berisi 4 item | Menambah/mengubah fitur unggulan butuh kode | Gunakan blok konten berurutan; batasi jumlah dan tipe ikon lewat skema |
| 6 | Roadmap pembangunan beranda | `src/pages/home.page.ts:10-50` | Array `ROADMAP` 8 item dan status `done/active/todo` | Status produk bisa stale dan tidak bisa dikoreksi admin | Pindahkan ke tabel `content_pages`/`site_roadmap` atau tampilkan dari status fitur yang dikelola |
| 7 | Status sistem, tip Kiko, copy target harian | `src/pages/home.page.ts:108-205` | Teks literal di dalam render | Informasi ke pemain tidak bisa diperbarui | Jadikan `announcements`/`site_blocks`; status sistem sebaiknya dihitung dari feature flag, bukan teks |
| 8 | Item navigasi desktop: label, urutan, ikon, href, visibilitas staff | `src/layouts/appLayout.ts:33-51` | Array `NAV_ITEMS` 12 item | Admin tidak bisa menambah menu atau mengubah label | Simpan label/urutan/visibilitas di `navigation_items`; route key tetap harus divalidasi kode |
| 9 | Navigasi mobile dan drawer | `src/layouts/appLayout.ts:53-67` | Array `MOBILE_NAV_KEYS`, `DRAWER_NAV_KEYS` | Perubahan IA butuh rilis | Jadikan konfigurasi terpisah dari daftar route; jangan biarkan admin memasukkan href sembarang |
| 10 | Label role dan label aksi audit | `src/pages/developer.page.ts:16-27`; `src/pages/home.page.ts:52-56` | Objek `ROLE_LABEL`, `ACTION_LABEL` | Aksi admin baru tidak tampil ramah | Tambahkan label dari registry aksi yang diperluas; tetap fallback ke kode aksi mentah |
| 11 | Registry ikon mapel | `src/components/subjectIcon.ts:3-18` | 10 key ikon; key tak dikenal jatuh ke `book` | Mapel/ikon baru bisa tampil salah tanpa error | Tambahkan `icon_media_id`/`icon_url` pada subjek atau registry ikon yang tervalidasi; jangan biarkan string bebas |
| 12 | Avatar dan palet avatar | `src/config/avatars.ts:1-14`; `src/components/avatar.ts:16-70` | 5 key, 5 palet, aksesori digambar SVG | Admin tidak bisa menambah avatar; key asing jatuh ke `sprout` | Buat `avatar_definitions` dan media; atau batasi avatar sebagai aset teknis yang dikelola developer |
| 13 | Pilihan target harian dan zona waktu | `src/utils/validation.ts:20-34`; constraint `user_settings` di `20261108090000_identity.sql:54-60` | Array 4 target, 6 zona; constraint SQL mengunci 5/10/15/20 | Admin tidak bisa menambah paket target atau zona | Pindahkan katalog target ke `site_settings`/`learning_options`; validasi RPC dan constraint perlu diselaraskan |
| 14 | Delapan mode latihan, judul, deskripsi, ikon, meta | `src/services/practice.service.ts:30-85` | Array `PRACTICE_MODES` | Mode dan copy tidak bisa diatur; menambah mode butuh kode dan RPC | Mode adalah bagian mesin; pertahankan di kode. Copy bisa dipindah ke label terkelola jika perlu |
| 15 | Label tingkat kesulitan, label status, teks halaman lesson | `src/pages/learn-lesson.page.ts:12-18`; `src/pages/learn-reward.page.ts:14-22`; `src/pages/learn.page.ts:180-270` | Objek dan teks literal | Istilah bisa tidak konsisten dengan konten | Simpan label yang benar-benar editorial di `content_pages`; label enum tetap di kode |
| 16 | Copy autentikasi, pesan setup, error, empty state | `src/pages/login.page.ts`, `register.page.ts`, `forgot-password.page.ts`, `setup.page.ts`, `error.page.ts`, `not-found.page.ts` | Teks literal | Tidak perlu sering diubah, tetapi beberapa pesan adalah komunikasi publik | Biarkan di kode; hanya pesan kebijakan/dukungan yang perlu CMS |
| 17 | Manifest aset game dan lisensi | `src/game/assets/manifest.ts:19-75` | 6 record, 3 file SVG, sisanya prosedural | Menambah aset game butuh kode dan build | Pertahankan untuk aset game; pisahkan `content_media` untuk media soal dan halaman |
| 18 | Pola musik/SFX dan palet area peta lama | `src/game/audio/audioEngine.ts:12-18`; `src/game/adventure/types.ts:77+` | Frekuensi dan palet hardcoded | Tidak relevan untuk CMS; bagian dari desain game | Jangan jadikan CMS. Peta DOM baru memakai CSS, bukan palet Phaser lama |
| 19 | Konstanta layout peta perjalanan dan warna aksen fallback | `src/game/journey/model.ts:110-160`; `src/components/learningJourney.ts:277`; `src/styles/journey.css` | `step=112`, `top=128`, `bottom=150`, fallback `#58CC02` | Desain peta tidak bisa diubah admin | Biarkan sebagai design token; warna aksen mapel sudah berasal dari DB |
| 20 | Seluruh isi kurikulum seed: mapel, level, unit, lesson, soal, opsi, jawaban, pasangan, scene, media | `scripts/content/types.ts`, `scripts/content/index.ts`, `scripts/content/subjects/*.ts`, `scripts/content/extensions.ts`, `minigames.ts`, `reviews.ts`, `stage4.ts` | Source TypeScript; bukan data runtime | Menambah/mengubah konten harus edit kode lalu build seed | Jadikan seed sebagai baseline saja; setelah CMS aktif, perubahan konten dilakukan di DB melalui admin |
| 21 | SQL seed kurikulum | `supabase/migrations/20261108110000_curriculum_seed.sql` (dihasilkan `scripts/generate-curriculum-sql.ts`) | INSERT ... ON CONFLICT DO UPDATE untuk seluruh konten | Menjalankan ulang seed dapat menimpa hasil edit admin | Bekukan seed setelah go-live; dokumentasikan bahwa seed bukan alat edit produksi |
| 22 | Katalog gamifikasi awal: quest, achievement, shop, league tier, streak milestone, player level | Seed di `20261110130000_tahap5_rewards.sql`, `20261110120000_progression_economy.sql`, `20261111100000_social_league.sql` | Nilai awal berupa baris seed SQL | Admin belum bisa mengubah target, hadiah, harga, atau status | Tabelnya sudah ada; tambahkan API dan UI admin, lalu jangan menimpa dengan seed |
| 23 | Event mingguan default: “Festival Lentera”, target 100 XP, hadiah 25 Koin | `20261111100000_social_league.sql:1119-1152` (`ensure_week_event`) | Teks dan angka hardcoded di fungsi; baris event baru dibuat saat dipanggil | Admin tidak bisa mengganti tema/target event mingguan | Buat event melalui admin atau sediakan override baris `game_events`; ubah default hanya sebagai fallback |
| 24 | Validasi konten seed: aturan slug, jumlah opsi benar, tipe soal per kategori, node wajib | `scripts/content/index.ts` `validateCurriculum()` | Validasi hanya saat build; tidak ada validasi setara di server | CMS dapat menyimpan konten tidak valid jika hanya mengandalkan client | Implementasikan validasi yang sama di RPC/Edge Function dan constraint DB; jangan percaya validasi UI |
| 25 | Daftar username terlarang, panjang password, pola email/username | `src/utils/validation.ts:5-18` | Konstanta validasi | Kebijakan akun berubah hanya lewat deploy | Sebagian wajar tetap di kode; kebijakan yang sering berubah bisa masuk `site_settings` dengan validasi server |
| 26 | Halaman FAQ, tentang, kebijakan privasi, syarat penggunaan, kontak | Tidak ditemukan route, tabel, atau komponen | Tidak ada | Permintaan “mengelola halaman informasi” belum terpenuhi | Buat `content_pages` + route `/p/:slug`; FAQ dapat memakai tabel terpisah agar terstruktur |
| 27 | Dokumentasi status produk | `README.md`, `docs/AUDIT.md`, `docs/PROJECT_HANDOFF.md`, `docs/GAMEPLAY.md`, `docs/TESTING.md` | Markdown statis, sebagian sudah stale | Konten dokumentasi tidak konsisten dengan kode terbaru | Dokumentasi bukan CMS; perbarui pada setiap rilis. Jangan jadikan sumber kebenaran tunggal |

### 3.3 Temuan hardcoded yang sudah menimbulkan ketidaksesuaian

- `src/pages/home.page.ts:23` menyebut **“6 jenis node”**, sedangkan enum `node_kind` dan data seed memiliki **7 tipe**: lesson, review, practice, challenge, checkpoint, legendary, reward.
- `src/pages/home.page.ts:38` masih menyebut **“peta Phaser”** sebagai status selesai. Working tree saat audit sudah memiliki `src/components/learningJourney.ts`, `src/game/journey/model.ts`, dan `src/styles/journey.css` yang menggantikan peta Phaser di halaman mapel. Kode Phaser lama masih ada tetapi bukan jalur utama halaman tersebut.
- `README.md` masih menyebut 20 mini-game, 7 mode latihan, peta Phaser, 14 E2E, dan 83 verifikasi API. Sebagian angka ini adalah snapshot lama; `PRACTICE_MODES` saat ini berisi 8 mode. Ini contoh nyata mengapa copy status produk sebaiknya tidak ditanam di beberapa tempat.
- `src/pages/welcome.page.ts:19` menulis “Dua puluh tipe mini-game”, sedangkan yang dimaksud sistem adalah 20 mekanik mini-game dan 12 tipe soal. Istilah “tipe” dan “mini-game” bercampur dan berpotensi membingungkan.
- `src/pages/learn.page.ts` dan `learn-subject.page.ts` sudah memakai data DB, tetapi copy “Bank soal aman” dan penjelasan RLS adalah teks statis. Jika kebijakan keamanan berubah, teks ini bisa menyesatkan.
- `index.html` masih memakai title/description statis yang tidak mengikuti brand env. Jika `VITE_GAME_NAME` diubah, title dokumen awal tetap “Lentera” sampai halaman menggantinya setelah boot.

### 3.4 Konten yang sebaiknya tetap di kode

Kategori berikut **tidak perlu** dipindahkan ke CMS karena bersifat mekanik, aksesibilitas, atau keamanan: label tombol inti, `aria-label`, pesan validasi form, nama mode practice, nama tipe soal, nama event analytics, konstanta fisika/animasi Phaser, pola audio sintetis, dan struktur route. Memaksakan semuanya ke database akan menambah risiko tanpa manfaat produk.

---

## 4. Fitur yang saat ini sudah bisa dikelola admin

Admin dashboard yang ada hanya `/developer`, dengan guard `staff` (`src/app/router.ts:322-331`). Nav “Developer” hanya terlihat untuk role `admin` atau `developer` (`src/layouts/appLayout.ts:208-210`). Semua aksi memakai RPC security definer di `src/repositories/developer.repository.ts`.

| Fitur | Fungsi | Data | Status | Lokasi | Catatan |
| --- | --- | --- | --- | --- | --- |
| Overview metrik | Menampilkan jumlah pemain, onboarded, staff, aktivitas, konten, audit | Agregat dari `profiles`, `lesson_attempts`, `practice_sessions`, ledger, wallet, streak, `subjects`, `lessons`, `questions`, `learning_nodes` | **Berfungsi, read-only** | `get_developer_overview()`, `src/pages/developer.page.ts` | Hanya menghitung konten aktif/published, bukan draft |
| Pencarian pemain | Cari maksimal 25 pemain berdasarkan email, username, atau nama tampilan | `profiles` + `auth.users` + `user_roles` + saldo/XP | **Berfungsi, read-only** | `get_developer_users(p_query)` | Tidak ada pagination, filter role, atau detail per pengguna |
| Reward Center | Menambah Koin dan/atau XP satu pemain dengan alasan | `user_wallets`, `user_xp_ledger`, `coin_transactions`, `audit_logs` | **Berfungsi, tulis** | `grant_reward(...)` | Validasi 0–10.000 Koin, 0–100.000 XP, alasan 3–160 karakter |
| Broadcast notifikasi | Mengirim notifikasi ke pemain onboarded | `notifications`, `audit_logs` | **Berfungsi, tulis** | `broadcast_notification(...)` | Judul 3–80, body maksimal 300, link internal; maksimal 500 penerima |
| Audit log | Melihat 30–100 aksi staff terakhir | `audit_logs` | **Berfungsi, read-only** | `get_audit_logs(p_limit)` | Append-only; hanya staff yang boleh SELECT |
| Akses halaman staff | Menjaga route dan nav developer | `user_roles`, `is_staff()` | **Berfungsi** | Router, `appLayout.ts` | Guard UI bukan pengganti otorisasi server |

**Tidak ada** fitur admin untuk mapel, kursus, level, unit, lesson, node, soal, media, pengguna, role, status akun, quest, achievement, toko, level pemain, liga, event, halaman situs, FAQ, banner, navigasi, atau feature flag.

---

## 5. Fitur yang belum bisa dikelola admin

### 5.1 Matriks kesenjangan

| Domain | Data saat ini | Sudah di DB? | Bisa dikelola admin? | Kesenjangan utama |
| --- | --- | --- | --- | --- |
| Mata pelajaran | `subjects` | Ya | Tidak | Tidak ada RPC/UI tulis; icon dan kategori terkait kode |
| Kategori mapel | Kolom teks `subjects.category`; enum seed di `scripts/content/types.ts` | Sebagian | Tidak | Tidak ada tabel kategori, label, urutan, atau validasi |
| Kursus | `courses` | Ya | Tidak | Tidak ada UI; service masih memakai `courses[0]` |
| Level/bab | `course_levels` | Ya | Tidak | Tidak ada reorder/publish UI; draft tidak terbaca admin |
| Unit | `units` | Ya | Tidak | Tidak ada editor tujuan pembelajaran, hadiah, atau urutan |
| Lesson | `lessons` | Ya | Tidak | Tidak ada editor; tidak ada badan materi panjang |
| Peta dan node | `learning_nodes` | Ya | Tidak | Tidak ada editor tipe node, link lesson, urutan, reward, atau aktif/nonaktif |
| Soal | `questions` dan tabel anak | Ya | Tidak | Tabel sengaja tanpa grant/policy; harus lewat RPC admin |
| Tipe soal dan scene | Enum `question_type`, `questions.scene` | Ya | Tidak | Editor JSON kompleks; tipe baru butuh kode game |
| Media soal | `question_media.url` | Ya, hanya 3 baris | Tidak | Tidak ada storage, upload, metadata, alt text, atau validasi file |
| Reward level | `learning_nodes.reward_coins/reward_xp` | Ya | Tidak | Tidak ada editor; klaim sudah RPC |
| Quest | `quest_definitions` | Ya | Tidak | Target, hadiah, cadence, ikon, aktif hanya bisa lewat seed |
| Achievement | `achievement_definitions` | Ya | Tidak | Metric dan target terikat fungsi SQL |
| Toko | `shop_items` | Ya | Tidak | Harga, stok, ikon, aktif tidak bisa diatur |
| Level pemain | `player_levels` | Ya | Tidak | Ambang XP dan hadiah tidak bisa diatur |
| Streak milestone | `streak_milestones` | Ya | Tidak | RLS tabel ini bahkan tidak aktif; hanya dibaca RPC |
| Liga | `league_tiers` | Ya | Tidak | Nama, aksen, urutan tidak bisa diatur |
| Event mingguan | `game_events` | Ya, 0 baris | Tidak | Default dibuat hardcoded oleh `ensure_week_event()` |
| Brand dan teks situs | Source code + env | Tidak | Tidak | Tidak ada `site_settings` runtime |
| Halaman informasi/FAQ | Tidak ada | Tidak | Tidak | Tidak ada tabel maupun route |
| Pengumuman/banner | `notifications` untuk inbox | Sebagian | Hanya broadcast | Tidak ada banner, jadwal, audiens, edit, atau arsip |
| Navigasi | `NAV_ITEMS` | Tidak | Tidak | Tidak ada konfigurasi menu |
| Avatar/ikon | Registry kode | Sebagian | Tidak | Key asing jatuh ke default; tidak ada upload |
| Pengguna | `profiles`, `auth.users` | Ya | Read-only terbatas | Tidak ada role management, suspend, reset, atau detail aktivitas |
| Role dan izin | `user_roles`, `is_staff()` | Ya | Tidak | Tidak ada write grant/RPC; admin = developer secara efektif |
| Feature flag | Tidak ada | Tidak | Tidak | Tidak ada cara mematikan fitur tanpa deploy |
| Revisi/rollback | Tidak ada | Tidak | Tidak | Tidak ada snapshot konten |
| Bulk import/export | Seed script | Tidak | Tidak | Tidak ada impor soal massal dari dashboard |

### 5.2 Arti kesenjangan ini secara operasional

Saat ini pemilik produk yang ingin mengubah satu kata pada landing page, menambah satu soal, mengganti ikon mapel, membuat event, atau menonaktifkan akun harus menyentuh kode/SQL dan melakukan deploy. Dashboard hanya berguna untuk memberi hadiah dan mengirim pengumuman. Itu adalah **dashboard operasional**, bukan **content management system**.

## 6. Rekomendasi fitur Admin Dashboard secara menyeluruh

### 6.1 Skala prioritas yang dipakai

| Prioritas | Arti | Kriteria |
| --- | --- | --- |
| **Tinggi (P0)** | Harus ada agar konten yang sudah berjalan dapat dikelola penuh dan aman | Menyangkut data inti, keamanan, atau menghilangkan ketergantungan deploy |
| **Menengah (P1)** | Penting untuk kenyamanan dan kelengkapan CMS | Memperluas cakupan ke konten situs, pengguna, dan gamifikasi |
| **Rendah (P2)** | Peningkatan lanjutan | Efisiensi, tata kelola, skala, dan analitik |

### 6.2 A. Manajemen pembelajaran dan kurikulum

| ID | Nama fitur | Fungsi | Data yang dikelola | Status saat ini | Lokasi terkait | Kebutuhan DB/API | Prioritas | Catatan teknis dan dependensi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Manajemen mata pelajaran | Tambah, ubah, arsipkan, urutkan, dan atur status mapel | `subjects`: slug, nama, short name, deskripsi, kategori, icon, accent, status, is_primary, sort_order | Data DB; belum ada UI/API admin | `src/repositories/curriculum.repository.ts`, `src/services/curriculum.service.ts`, `subjects` | `admin_list_subjects`, `admin_save_subject`, `admin_reorder_subjects`, `admin_archive_subject`; validasi slug unik | Tinggi | Jangan hard delete. Arsipkan dengan `inactive`. Slug sebaiknya immutable setelah dipublikasikan. Depends: IAM, media untuk ikon/cover, audit |
| A2 | Manajemen kategori mapel | Mengatur label, slug, urutan, dan visibilitas kategori | `subjects.category` saat ini teks bebas; enum `SeedCategory` di source | Teks bebas; tidak ada tabel kategori | `scripts/content/types.ts`, `subjects.category` | Tabel `subject_categories`; validasi FK dari `subjects.category` atau `category_id` | Menengah | Diperlukan bila kategori ingin tampil sebagai filter. Jika tetap teks, sediakan dropdown terbatas agar tidak ada typo. Depends: A1 |
| A3 | Manajemen kursus | Mengubah kursus, deskripsi, ikon, urutan, dan status publish | `courses` | Data DB; belum ada UI/API admin | `courses`, `curriculum.repository.ts` | `admin_save_course`, `admin_reorder_courses`, `admin_publish_course` | Tinggi | Saat ini satu subject satu course. Service mengambil `courses[0]` di `curriculum.service.ts:140`; multi-course belum didukung. Depends: A1 |
| A4 | Manajemen level/bab | Tambah, ubah, urutkan, publikasikan level | `course_levels`: slug, judul, deskripsi, difficulty, sort_order, is_published | Data DB; draft tidak terlihat admin | `course_levels`, policy `courses_select_published` dan `course_levels_select_published` | `admin_list_levels`, `admin_save_level`, `admin_reorder_levels`; RPC baca draft | Tinggi | Publish harus memvalidasi minimal satu unit. Draft read tidak boleh memakai policy publik. Depends: A3, A5 |
| A5 | Manajemen unit/bab materi | Mengatur unit, deskripsi, tujuan pembelajaran, reward, urutan | `units` | Data DB; belum ada editor | `units`, `units.objectives` | `admin_save_unit`, `admin_reorder_units`; validasi array tujuan | Tinggi | `objectives` adalah array teks; editor perlu daftar baris, bukan textarea bebas. Depends: A4 |
| A6 | Manajemen lesson dan materi | Mengatur lesson, jenis, estimasi durasi, XP/Koin, hearts, urutan, publish | `lessons`; belum ada badan materi panjang | Data DB untuk metadata; materi panjang tidak ada | `lessons`, `learn-lesson.page.ts`, `lesson.service.ts` | `admin_save_lesson`, `admin_reorder_lessons`, `admin_publish_lesson`; tabel baru `lesson_sections` untuk bahan bacaan | Tinggi | Saat ini “materi” hanya deskripsi dan bank soal. Jika materi bacaan diinginkan, perlu tabel blok dan halaman reader. Depends: A5, A8 |
| A7 | Manajemen peta, node, urutan, dan penguncian | Mengatur node playable, tipe, link lesson, reward, urutan, aktif, dan aturan unlock | `learning_nodes`: node_type, lesson_id, sort_order, is_active, reward_coins, reward_xp | Data DB; peta sudah menurunkan struktur dari DB | `learning_nodes`, `src/game/journey/model.ts`, `src/services/learningPath.ts` | `admin_save_node`, `admin_reorder_nodes`, `admin_toggle_node`; validasi link lesson dan satu reward per unit | Tinggi | `buildJourneyStops()` menganggap reward sebagai stop tersendiri. Jangan biarkan node playable tanpa lesson. Depends: A6, B1 |
| A8 | Manajemen bank soal | CRUD soal, opsi, jawaban, pasangan, topik, difficulty, poin, penjelasan, hint, aktif | `questions`, `question_options`, `question_answers`, `question_pairs` | Data DB; RLS 0 policy; tanpa grant; tanpa UI | `supabase/migrations/20261108100000_curriculum.sql`, `src/types/database.ts`, `lesson.service.ts` | `admin_list_questions`, `admin_get_question`, `admin_save_question` atomik, `admin_archive_question`, `admin_reorder_questions` | Tinggi | Jangan beri SELECT/CRUD langsung ke `authenticated`. RPC admin harus mengembalikan kunci hanya kepada staff dan menulis audit. Depends: IAM, A6, validasi |
| A9 | Editor tipe soal dan scene | Mengedit prompt instruksi, media, opsi, dan scene JSON untuk listening, speaking, conversation, story | `questions.scene` JSONB, enum `question_type`, `question_media` | Data DB; editor belum ada | `src/game/minigames/*`, `scripts/content/types.ts` | Skema validasi scene per tipe; RPC `admin_save_question` dengan payload tervalidasi | Menengah | Tipe soal baru tetap butuh renderer kode. Jangan tampilkan pilihan tipe yang belum didukung game. Depends: A8, A10 |
| A10 | Manajemen media soal | Upload gambar/audio/video, alt text, urutan, ganti, hapus/arsip | `question_media` saat ini hanya URL | Hanya 3 URL SVG; tidak ada Storage | `question_media`, `public/assets/pictures/*.svg`, `ASSET_MANIFEST` | Bucket `content-media`, tabel `media_assets`, `admin_register_media`, `admin_archive_media`; signed upload | Tinggi | Validasi MIME, ukuran, dimensi, dan sanitasi SVG. Jangan izinkan HTML/JS. Depends: media library C7 |
| A11 | Validasi, preview, dan publish | Cek slug duplikat, opsi benar, tipe soal, node wajib, lalu preview sebelum terbit | Validasi konten dan status publish | Validasi hanya saat build di `validateCurriculum()` | `scripts/content/index.ts`, `curriculum.service.ts`, halaman learn | `admin_validate_content`, `admin_preview_content`, `admin_publish_content`; preview staff-only | Tinggi | Validasi harus dieksekusi server, bukan client. Preview memakai RPC draft read, bukan policy publik. Depends: A1–A10, IAM |

### 6.3 B. Manajemen gamifikasi dan reward

| ID | Nama fitur | Fungsi | Data yang dikelola | Status saat ini | Lokasi terkait | Kebutuhan DB/API | Prioritas | Catatan teknis dan dependensi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | Manajemen reward level | Mengatur hadiah Koin/XP pada node reward dan memastikan klaim idempoten | `learning_nodes` reward_coins, reward_xp | Data DB; belum ada editor | `learning_nodes`, `claim_reward_node()` | `admin_save_reward_node`, validasi nilai dan satu reward per unit | Tinggi | Reward node adalah bagian peta. Perubahan hadiah tidak boleh mengubah klaim lama. Depends: A7, audit |
| B2 | Manajemen quest | Mengatur quest harian/mingguan, metric, target, hadiah, ikon, urutan, aktif | `quest_definitions` | Data DB; seed-only | `quest_definitions`, `get_my_quests()`, `quest_metric_value()` | `admin_list_quests`, `admin_save_quest`, `admin_toggle_quest` | Menengah | Metric harus cocok dengan fungsi SQL yang tersedia; jangan izinkan metric bebas. Depends: analytics/ledger |
| B3 | Manajemen achievement | Mengatur judul, deskripsi, metric, target, ikon, urutan, aktif | `achievement_definitions` | Data DB; seed-only | `achievement_definitions`, `evaluate_achievements()` | `admin_save_achievement`, validasi metric yang didukung | Menengah | Achievement baru tidak otomatis dievaluasi jika metric tidak ada di fungsi. Perlu daftar metric tertutup. Depends: B2 |
| B4 | Manajemen toko | Mengatur item, harga, stok, ikon, urutan, aktif | `shop_items` | Data DB; hanya 2 item | `shop_items`, `purchase_shop_item()` | `admin_save_shop_item`, `admin_toggle_shop_item`; validasi harga dan max stack | Menengah | Mengubah harga tidak boleh mengubah pembelian lama. Gunakan arsip, bukan delete, jika item pernah dibeli. Depends: inventory |
| B5 | Manajemen level, streak, dan liga | Mengatur ambang XP level, hadiah level, milestone streak, nama tier liga | `player_levels`, `streak_milestones`, `league_tiers` | Data DB; seed-only | `player_levels`, `streak_milestones`, `league_tiers` | `admin_save_player_level`, `admin_save_streak_milestone`, `admin_save_league_tier` | Menengah | Perubahan ambang level dapat memicu grant massal; butuh analisis dampak dan audit. `streak_milestones` belum RLS. Depends: ledger |
| B6 | Manajemen event mingguan | Membuat, menjadwalkan, mengubah, dan menonaktifkan event | `game_events`; default dibuat `ensure_week_event()` | 0 baris; default hardcoded | `game_events`, `ensure_week_event()`, `get_active_event()` | `admin_list_events`, `admin_save_event`, `admin_publish_event`; fallback default tetap ada | Menengah | Admin perlu bisa override event tanpa mengubah fungsi. Event yang sudah berjalan jangan diubah targetnya secara retroaktif. Depends: liga/event claim |

### 6.4 C. Manajemen konten website

| ID | Nama fitur | Fungsi | Data yang dikelola | Status saat ini | Lokasi terkait | Kebutuhan DB/API | Prioritas | Catatan teknis dan dependensi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | Pengaturan situs dan brand | Mengubah nama, tagline, versi, copyright, URL dukungan, warna utama, maskot, dan teks footer | `brand.ts` dan `index.html` | Hardcoded/build-time | `src/config/brand.ts`, `index.html`, `src/styles/tokens.css` | Tabel `site_settings`; API `admin_get_site_settings`, `admin_update_site_settings`; service settings saat boot | Menengah | Perubahan runtime tidak mengubah HTML awal/SEO. Butuh fallback build-time agar aplikasi tetap tampil jika settings gagal dimuat. Depends: IAM, caching |
| C2 | Manajemen copy landing dan beranda | Mengubah hero, fitur, CTA, trust badge, roadmap, status sistem, tip | `welcome.page.ts`, `home.page.ts` | Hardcoded | `src/pages/welcome.page.ts`, `src/pages/home.page.ts` | `content_blocks` atau `content_pages` dengan blok terstruktur; API simpan/terbitkan | Menengah | Jangan simpan HTML mentah. Gunakan blok bertipe: heading, paragraf, CTA, ikon, daftar. Depends: C1, C3 |
| C3 | Manajemen halaman informasi dan FAQ | Membuat halaman tentang, privasi, syarat, kontak, FAQ, dan halaman statis lain | Tidak ada tabel/route | Belum ada | Tidak ditemukan | `content_pages`, `faqs`; route `/p/:slug`; API CRUD/publish | Menengah | Sanitasi konten wajib. FAQ sebaiknya terstruktur (pertanyaan/jawaban) agar bisa dicari. Depends: C1, routing |
| C4 | Manajemen pengumuman | Membuat banner/inbox, memilih audiens, jadwal tayang, tautan, aktif/nonaktif | `notifications` untuk inbox; tidak ada banner | Hanya broadcast 500 penerima | `broadcast_notification()`, `notifications`, `notifications.page.ts` | Tabel `announcements`; API CRUD, publish, archive; integrasi push notifikasi | Menengah | Bedakan pengumuman persisten (banner) dari notifikasi inbox. Broadcast massal >500 perlu Edge Function/antrean. Depends: profiles, notifikasi |
| C5 | Manajemen SEO dan metadata | Mengatur title, description, Open Graph, canonical, favicon per halaman | `index.html`, `meta` halaman | Hardcoded | `index.html`, setiap `src/pages/*.ts` | Field SEO di `content_pages`/`site_settings`; API baca publik | Rendah | SPA hanya mengubah meta setelah JS berjalan; crawler tertentu tidak melihatnya. Perlu pre-render bila SEO adalah tujuan serius. Depends: C1, C3 |
| C6 | Manajemen navigasi | Mengatur label, urutan, grup, ikon, visibilitas role, dan tautan | `NAV_ITEMS`, `MOBILE_NAV_KEYS`, `DRAWER_NAV_KEYS` | Hardcoded | `src/layouts/appLayout.ts` | Tabel `navigation_items`; API list/save/reorder; validasi route key | Rendah | Jangan izinkan URL eksternal atau route yang tidak terdaftar. Route key tetap milik kode. Depends: IAM, route registry |
| C7 | Pustaka media | Upload, cari, ganti, arsipkan, dan gunakan aset untuk soal, ikon, cover, banner, avatar, halaman | Tidak ada storage; hanya URL statis | Belum ada | `public/assets/pictures/`, `question_media`, `ASSET_MANIFEST` | Bucket `content-media`, `media_assets`, signed upload, API metadata/arsip | Tinggi | Validasi tipe/ukuran, sanitasi SVG, alt text wajib, cegah file yatim. Aset game prosedural tetap di kode. Depends: IAM, A10 |
| C8 | Manajemen ikon dan avatar | Menambah ikon mapel/avatar tanpa deploy | Registry kode `subjectIcon.ts`, `avatars.ts`, `avatar.ts` | Hardcoded; key asing jatuh ke default | `src/components/subjectIcon.ts`, `src/config/avatars.ts`, `src/components/avatar.ts` | Tabel `avatar_definitions`; `subjects.icon_media_id` atau registry ikon tervalidasi | Menengah | Avatar saat ini digambar sebagai SVG dengan palet dan aksesori yang dipilih kode. Menambah avatar upload memerlukan perubahan renderer dan validasi. Depends: C7 |

### 6.5 D. Manajemen pengguna

| ID | Nama fitur | Fungsi | Data yang dikelola | Status saat ini | Lokasi terkait | Kebutuhan DB/API | Prioritas | Catatan teknis dan dependensi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | Direktori pengguna | Daftar, cari, filter, pagination, lihat profil, status onboarding, role, saldo, aktivitas | `profiles`, `auth.users`, `user_roles`, `user_wallets`, `user_settings` | Hanya pencarian 25 hasil | `get_developer_users()`, `developer.page.ts` | `admin_list_users` dengan pagination/filter; `admin_get_user_detail` | Menengah | Email adalah PII; batasi akses dan audit setiap pembacaan detail. Depends: IAM |
| D2 | Manajemen role dan izin | Mengubah role, memberi/mencabut izin, mencegah eskalasi | `user_roles`, `role_permissions` baru | Tidak ada write; role hanya lewat SQL | `user_roles`, `is_staff()`, `AppRole` | `admin_set_role`, `admin_set_permission`; permission table; guard terhadap self-demotion | Tinggi | `admin` dan `developer` saat ini identik lewat `is_staff()`. Hanya developer yang boleh memberi developer. Semua perubahan role harus audit. Depends: IAM, MFA |
| D3 | Status dan suspensi akun | Menonaktifkan akun, membatasi login, memberi alasan dan masa berlaku | Belum ada status akun aplikasi | Belum ada | `profiles`, Supabase Auth | Tabel `account_suspensions`; Edge Function `admin_set_account_status` memakai Admin API | Menengah | Jangan hanya menyembunyikan UI; blokir akses di server. Perlu kebijakan banding dan audit. Depends: Edge Function, IAM |
| D4 | Tindakan dukungan akun | Kirim reset password, paksa logout, verifikasi email, buka akun | Supabase Auth | Tidak ada | `auth.service.ts` hanya untuk pemain | Edge Function `admin_send_password_reset`, `admin_revoke_sessions`; service role di server | Rendah | Service role tidak boleh ada di browser. Untuk MVP, arahkan pengguna ke reset mandiri agar risiko berkurang. Depends: Edge Function, D3 |
| D5 | Aktivitas dan progres pengguna | Melihat lesson, latihan, mastery, reward, quest, dan riwayat transaksi per pengguna | `lesson_attempts`, `practice_sessions`, `user_*`, ledger | Hanya agregat overview | `get_developer_overview()`, tabel progres | `admin_get_user_activity` read-only; filter tanggal | Menengah | Read-only. Jangan menyediakan edit progres langsung; koreksi ekonomi harus lewat grant/ledger dengan alasan. Depends: D1, audit |

### 6.6 E. Manajemen sistem dan tata kelola

| ID | Nama fitur | Fungsi | Data yang dikelola | Status saat ini | Lokasi terkait | Kebutuhan DB/API | Prioritas | Catatan teknis dan dependensi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E1 | Feature flag | Menyalakan/mematikan fitur, membatasi ke role atau sebagian pengguna | Tidak ada | Belum ada | Router, nav, halaman fitur | Tabel `feature_flags`; API `admin_toggle_feature`; guard di route dan RPC | Rendah | Flag tidak boleh menjadi pengganti otorisasi. Default aman: mati. Depends: IAM |
| E2 | Audit log yang diperluas | Mencatat semua aksi admin, before/after, request id, filter, ekspor | `audit_logs` | Append-only; dua aksi | `audit_logs`, `log_audit()`, `developer.page.ts` | Perluas action/target; `admin_list_audit` dengan filter; index tambahan | Tinggi | `log_audit` hanya internal; jangan beri insert ke pemain. Simpan snapshot secukupnya, jangan PII berlebihan. Depends: semua fitur tulis |
| E3 | Revisi dan rollback konten | Menyimpan versi, membandingkan, memulihkan versi sebelumnya | Belum ada | Belum ada | Tidak ditemukan | Tabel `content_revisions`; API list/diff/restore | Rendah | Snapshot JSON per entity. Rollback harus membuat revisi baru, bukan menghapus histori. Depends: E2 |
| E4 | Bulk import/export | Impor soal CSV/JSON, ekspor konten, duplikasi lesson/mapel | Seed script | Hanya lewat `scripts/content` | `scripts/generate-curriculum-sql.ts` | RPC/Edge `admin_import_questions`, `admin_export_content`; job status | Rendah | Impor harus transaksional per batch, validasi per baris, dan laporan error. Depends: A8, A11 |
| E5 | Content health dan analytics | Menemukan lesson tanpa soal, node tanpa lesson, media yatim, mapel kosong, draft menua | Turunan dari tabel konten | Tidak ada | `get_developer_overview()` hanya agregat | View/RPC `admin_content_health`; dashboard peringatan | Rendah | Bermanfaat setelah volume konten bertambah. Bisa dimulai read-only tanpa tabel baru. Depends: A11 |

### 6.7 Ringkasan fitur yang direkomendasikan untuk MVP CMS

Jika ingin versi pertama yang benar-benar berguna tanpa menunggu seluruh visi selesai, urutan MVP yang disarankan adalah: **D2 (izin) → A1/A3/A4/A5/A6/A7 → A8/A10 → A11 → C7 → C1/C2 → C4 → D1/D5**. Quest, toko, liga, FAQ, revisi, dan feature flag dapat menyusul setelah alur konten inti stabil.

---

## 7. Rekomendasi struktur menu Admin Dashboard

### 7.1 Prinsip struktur

- **Satu tempat kendali, dua level kedalaman.** Menu utama untuk pekerjaan harian; submenu untuk entitas yang saling bergantung.
- **Navigasi mengikuti alur konten**, bukan nama tabel. “Mata Pelajaran” membuka struktur kursus, level, unit, lesson, dan peta dalam satu konteks.
- **Aksi berisiko dipisahkan.** Publikasi, penghapusan/arsip, role, dan broadcast tidak ditempatkan sebagai tombol utama yang mudah terklik salah.
- **Menu mengikuti izin.** Editor konten tidak melihat manajemen role; support tidak melihat tombol publish.
- **Route admin terpisah dari aplikasi pemain.** Shell admin tidak memuat bottom nav pemain, resource chip, atau audio game.

### 7.2 Struktur yang diusulkan

```text
/admin
├── Ringkasan
│   ├── Kesehatan konten
│   ├── Aktivitas terbaru
│   └── Aksi cepat (buat mapel, buat soal, kirim pengumuman)
├── Pembelajaran
│   ├── Mata Pelajaran
│   │   ├── Identitas dan status
│   │   ├── Kursus
│   │   ├── Level dan Bab
│   │   ├── Unit dan Tujuan
│   │   ├── Lesson
│   │   ├── Peta dan Node
│   │   └── Pratinjau
│   ├── Bank Soal
│   │   ├── Daftar soal per lesson
│   │   ├── Editor soal
│   │   ├── Media soal
│   │   └── Validasi dan terbit
│   ├── Kategori
│   └── Impor/Ekspor
├── Gamifikasi
│   ├── Reward Level
│   ├── Quest
│   ├── Achievement
│   ├── Toko
│   ├── Level Pemain dan Streak
│   ├── Liga
│   └── Event Mingguan
├── Konten Website
│   ├── Pengaturan Situs
│   ├── Landing dan Beranda
│   ├── Halaman Informasi
│   ├── FAQ
│   ├── Pengumuman
│   ├── Navigasi
│   └── Media
├── Pengguna
│   ├── Daftar Pengguna
│   ├── Role dan Izin
│   ├── Status Akun
│   ├── Aktivitas
│   └── Reward Center
└── Sistem
    ├── Audit Log
    ├── Feature Flag
    ├── Revisi Konten
    └── Pengaturan Teknis
```

### 7.3 Pemetaan menu ke route dan fase

Route di bawah adalah **usulan**, bukan route yang sudah ada. Route `/developer` yang sekarang sebaiknya dipertahankan sebagai alias/redirect ke `/admin` agar tautan lama tidak rusak.

| Grup | Menu | Route usulan | Role minimum | Fase |
| --- | --- | --- | --- | --- |
| Ringkasan | Dashboard | `/admin` | admin | 0 |
| Pembelajaran | Mata pelajaran | `/admin/curriculum/subjects` | admin | 1 |
| Pembelajaran | Detail mapel dan struktur | `/admin/curriculum/subjects/:id` | admin | 1 |
| Pembelajaran | Bank soal | `/admin/curriculum/questions` | admin | 2 |
| Pembelajaran | Editor soal | `/admin/curriculum/questions/:id` | admin | 2 |
| Pembelajaran | Media soal | `/admin/media?scope=question` | admin | 2 |
| Pembelajaran | Kategori | `/admin/curriculum/categories` | admin | 1 |
| Pembelajaran | Validasi dan terbit | `/admin/curriculum/publish` | admin | 1 |
| Gamifikasi | Reward level | `/admin/gamification/rewards` | admin | 3 |
| Gamifikasi | Quest | `/admin/gamification/quests` | admin | 4 |
| Gamifikasi | Achievement | `/admin/gamification/achievements` | admin | 4 |
| Gamifikasi | Toko | `/admin/gamification/shop` | admin | 4 |
| Gamifikasi | Level, streak, liga | `/admin/gamification/progression` | admin | 4 |
| Gamifikasi | Event | `/admin/gamification/events` | admin | 4 |
| Konten Website | Pengaturan situs | `/admin/site/settings` | admin | 3 |
| Konten Website | Landing/beranda | `/admin/site/landing` | admin | 3 |
| Konten Website | Halaman dan FAQ | `/admin/site/pages` | admin | 3 |
| Konten Website | Pengumuman | `/admin/site/announcements` | admin | 3 |
| Konten Website | Navigasi | `/admin/site/navigation` | developer | 5 |
| Konten Website | Media | `/admin/media` | admin | 2 |
| Pengguna | Daftar pengguna | `/admin/users` | admin | 3 |
| Pengguna | Detail pengguna | `/admin/users/:id` | admin | 3 |
| Pengguna | Role dan izin | `/admin/users/roles` | developer | 2 |
| Pengguna | Status akun | `/admin/users/status` | admin | 4 |
| Pengguna | Reward Center | `/admin/users/rewards` | admin | 0 |
| Sistem | Audit log | `/admin/system/audit` | admin | 0 |
| Sistem | Feature flag | `/admin/system/features` | developer | 5 |
| Sistem | Revisi | `/admin/system/revisions` | admin | 5 |

### 7.4 Prinsip UX admin yang perlu dipertahankan

- Gunakan tabel dengan pencarian, filter status, dan pagination server; jangan memuat seluruh konten ke browser.
- Form panjang dipecah per tab: identitas, struktur, media, publish, riwayat.
- Tampilkan pratinjau di samping form untuk lesson dan soal, bukan halaman terpisah yang kehilangan konteks.
- Aksi destruktif memakai konfirmasi yang menyebut nama entitas dan dampaknya; default-nya arsip, bukan hapus permanen.
- Tampilkan status “draft, terbit, diarsipkan” secara konsisten dan jangan mencampur dengan “aktif/nonaktif” milik gamifikasi.
- Semua form wajib menampilkan error per field, bukan hanya toast global.

---

## 8. Kebutuhan perubahan database dan backend

### 8.1 Fondasi yang sudah ada dan tetap dipakai

Tidak perlu membuat ulang tabel kurikulum. Tabel berikut sudah mendukung CMS dan sebaiknya dipertahankan:

| Tabel | Peran | Catatan untuk CMS |
| --- | --- | --- |
| `subjects` | Identitas mapel | Perlu media/cover/icon dan kategori terstruktur |
| `courses` | Kursus dalam mapel | Saat ini satu per mapel; multi-course perlu perubahan service |
| `course_levels` | Level/bab | Sudah punya difficulty dan is_published |
| `units` | Unit dan tujuan | `objectives` berupa array; butuh editor baris |
| `lessons` | Metadata lesson | Belum ada badan materi |
| `learning_nodes` | Peta dan reward | Sumber utama peta; butuh reorder dan validasi link |
| `questions` | Soal | RLS 0 policy; akses hanya RPC |
| `question_options` | Opsi | Butuh validasi tepat satu benar |
| `question_answers` | Jawaban teks | Case sensitivity perlu eksplisit di UI |
| `question_pairs` | Pasangan | Editor pasangan kiri-kanan |
| `question_media` | Media soal | Perlu FK ke `media_assets` |
| `quest_definitions`, `achievement_definitions`, `shop_items` | Katalog gamifikasi | Sudah cukup untuk editor dasar |
| `player_levels`, `streak_milestones`, `league_tiers` | Progresi | Perubahan butuh analisis dampak |
| `game_events` | Event mingguan | Default masih dibuat fungsi |
| `audit_logs` | Audit | Append-only; perlu aksi baru |

### 8.2 Tabel baru yang diusulkan

| Tabel | Kolom inti | Fungsi | Prioritas |
| --- | --- | --- | --- |
| `media_assets` | id, bucket, path, mime, bytes, width, height, alt, checksum, uploaded_by, created_at, archived_at | Metadata aset dan referensi aman | Tinggi |
| `site_settings` | key, value jsonb, updated_by, updated_at | Brand, SEO, opsi global, feature copy | Tinggi |
| `content_pages` | id, slug, title, excerpt, body jsonb, seo_title, seo_description, og_media_id, status, published_at, updated_by | Halaman informasi, landing, kebijakan | Menengah |
| `faqs` | id, question, answer, category, sort_order, is_active | FAQ terstruktur | Menengah |
| `announcements` | id, title, body, link, audience, starts_at, ends_at, is_active, created_by | Banner dan pengumuman terjadwal | Menengah |
| `lesson_sections` | id, lesson_id, title, body jsonb, sort_order, is_published | Badan materi/bacaan per lesson | Menengah |
| `content_revisions` | id, entity_type, entity_id, snapshot jsonb, action, actor_id, created_at | Riwayat dan rollback | Rendah |
| `role_permissions` | role app_role, permission text, granted_by, granted_at | Izin granular tanpa mengubah enum | Tinggi |
| `feature_flags` | key, description, enabled, audience jsonb, updated_by, updated_at | Kontrol fitur | Rendah |
| `navigation_items` | key, label, href, parent_key, sort_order, icon, roles, is_active | Menu dinamis | Rendah |
| `subject_categories` | slug, label, description, sort_order, is_active | Kategori mapel terstruktur | Menengah |
| `account_suspensions` | user_id, reason, starts_at, ends_at, created_by, lifted_at | Status akun dan pembatasan | Menengah |

Catatan: `site_settings` sebaiknya memakai key yang terdaftar, bukan key bebas, agar tipe nilai dan validasi tetap terkendali. `content_pages.body` sebaiknya berupa blok JSON (heading, paragraph, list, image, callout), bukan HTML mentah.

### 8.3 Perubahan pada tabel yang sudah ada

| Tabel | Perubahan yang disarankan | Alasan |
| --- | --- | --- |
| `subjects` | `cover_media_id`, `icon_media_id` atau relasi ke `media_assets`, `seo_title`, `seo_description` | Cover, ikon, dan metadata publik |
| `courses` | `cover_media_id`, `seo_description` | Konsistensi halaman katalog |
| `lessons` | Relasi ke `lesson_sections`, `updated_by`, `published_at` | Materi dan jejak perubahan |
| `learning_nodes` | Validasi unik reward per unit, index `(unit_id, sort_order)` | Mencegah peta ganda/urutan kacau |
| `question_media` | `media_id` nullable FK ke `media_assets`; pertahankan `url` untuk migrasi | Menghindari URL yatim dan memungkinkan alt text terpusat |
| `questions` | `updated_by`, `version` opsional | Audit dan revisi |
| `streak_milestones` | Aktifkan RLS dan grant hanya lewat RPC | Saat ini RLS tidak aktif |
| `game_events` | `created_by`, `updated_by`, `is_template` opsional | Membedakan event default dan event buatan admin |
| `profiles` | Jangan menambah kolom role; tetap di `user_roles`. Status akun di tabel terpisah | Menghindari duplikasi otorisasi |
| `audit_logs` | Index `(target_type, target_id, created_at)`, action yang lebih kaya | Pencarian audit per entitas |

### 8.4 Keputusan backend: RPC-first, Edge Function hanya bila perlu

**Rekomendasi utama: RPC-first.** Semua operasi tulis konten memakai fungsi `security definer` yang memanggil pemeriksaan izin, validasi, transaksi, dan `log_audit()`. Ini konsisten dengan pola `grant_reward`, `broadcast_notification`, dan `claim_reward_node` yang sudah ada.

Alasannya:

1. Tidak perlu menambah server baru untuk CRUD biasa.
2. Browser tidak pernah memegang service role.
3. Transaksi multi-tabel (soal + opsi + jawaban + pasangan + media) dapat atomik di satu RPC.
4. Otorisasi tetap di server dan dapat diuji dengan SQL smoke test.

**Edge Function diperlukan untuk operasi yang tidak dapat dilakukan anon/authenticated key:** reset password pengguna, revoke session, ban/unban Auth, pencarian auth.users yang aman, upload bertanda tangan untuk file besar, dan antrean broadcast lebih dari 500 penerima. Service role hanya boleh hidup di Edge Function, bukan di `VITE_*`.

### 8.5 Grant dan RLS: aturan yang tidak boleh dilanggar

- Jangan memberi `INSERT/UPDATE/DELETE` langsung pada `questions` dan tabel anaknya kepada `authenticated`.
- Jangan menambah policy SELECT publik ke tabel soal hanya agar admin bisa mengedit. Admin harus memakai RPC yang memeriksa `is_staff()`/permission.
- Pertahankan RLS pada semua tabel konten. `security definer` harus menetapkan `search_path` secara eksplisit, seperti pola yang sudah ada.
- Setiap RPC tulis wajib memeriksa izin di dalam fungsi, bukan hanya menyembunyikan tombol di UI.
- RPC baca draft harus mengembalikan data yang belum terbit hanya untuk staff dan mencatat akses bila datanya sensitif.
- `audit_logs` tetap append-only: tidak ada grant insert/update/delete untuk pemain.

### 8.6 Siklus hidup data dan seed

Setelah CMS aktif, `scripts/content/**` dan `20261108110000_curriculum_seed.sql` harus diperlakukan sebagai **baseline instalasi**, bukan alat edit harian. Menjalankan ulang `seed:build` lalu menerapkan seed ke database yang sudah diedit dapat menimpa konten admin karena generator memakai `ON CONFLICT DO UPDATE`.

Aturan yang disarankan:

1. Seed hanya untuk instalasi baru atau reset lingkungan pengembangan.
2. Produksi memakai CMS/import, bukan seed.
3. Sebelum rilis besar, ekspor konten dan simpan sebagai backup.
4. Tandai entitas hasil seed agar admin tahu mana yang baseline; jangan otomatis menimpanya.
5. Perubahan struktur (enum, kolom wajib) tetap lewat migration; perubahan isi lewat CMS.

### 8.7 Index, constraint, dan integritas

- Tambah index untuk pencarian admin: `subjects(status, sort_order)`, `course_levels(course_id, sort_order)`, `units(course_level_id, sort_order)`, `lessons(unit_id, sort_order)`, `learning_nodes(unit_id, sort_order)`, `questions(lesson_id, sort_order)`.
- Tambah index `question_media(question_id, sort_order)`, `content_pages(slug)`, `announcements(starts_at, ends_at, is_active)`, `media_assets(created_at)`.
- Validasi “tepat satu opsi benar” sebaiknya dilakukan di RPC dan/atau trigger, bukan hanya di UI.
- Cegah dua node reward aktif dalam satu unit, dan cegah node playable tanpa `lesson_id`.
- Jangan mengandalkan `sort_order` unik; normalisasi ulang saat reorder agar tidak ada celah.
- Untuk penghapusan, gunakan arsip (`inactive`, `is_published=false`, `archived_at`) karena relasi progres dan mastery dapat ikut terhapus oleh cascade.

### 8.8 Storage dan aset

- Buat bucket terpisah, misalnya `content-media`, untuk media soal, cover, banner, dan halaman. Jangan campur dengan aset game yang dilisensikan dan di-bundle.
- Upload sebaiknya melalui signed URL/Edge Function; metadata masuk `media_assets` setelah validasi.
- Wajib memeriksa MIME sebenarnya, ekstensi, ukuran, dan dimensi. SVG harus disanitasi atau ditolak karena dapat mengandung script.
- Alt text wajib untuk gambar konten; audio/video memerlukan transkrip bila dipakai untuk soal listening.
- Sediakan job pembersih untuk media yang tidak direferensikan, tetapi jangan hapus otomatis tanpa konfirmasi.

---

## 9. Kebutuhan API untuk pengelolaan konten

### 9.1 Aturan desain API

1. **Tidak ada CRUD tabel langsung dari browser admin.** Semua tulis lewat RPC `security definer` atau Edge Function.
2. **Satu aksi = satu transaksi.** Simpan soal harus atomik bersama opsi, jawaban, pasangan, media, dan audit.
3. **Validasi di server.** Client hanya membantu; validasi wajib diulang di RPC.
4. **Idempoten.** Buat dan publish mengembalikan hasil yang sama bila dipanggil ulang dengan kunci idempoten.
5. **Audit wajib.** Setiap tulis mencatat actor, action, target, before/after ringkas, dan request id.
6. **Response konsisten.** `{ ok, data, error: { code, message, fields } }`; error SQLSTATE dipetakan ke kode yang stabil.
7. **Pagination server.** Daftar konten memakai cursor/limit; jangan mengirim seluruh bank soal.
8. **Draft dan published dipisah.** Parameter `status` eksplisit; publish bukan efek samping dari save.

### 9.2 RPC baca admin

| API usulan | Fungsi | Input | Output | Izin | Catatan |
| --- | --- | --- | --- | --- | --- |
| `admin_get_dashboard` | Ringkasan admin | — | Metrik, peringatan konten, aktivitas | `admin` | Bisa memperluas `get_developer_overview` |
| `admin_list_content_tree` | Pohon mapel sampai lesson | filter status, parent id | Tree ringkas | `admin` | Untuk sidebar dan pemilih parent |
| `admin_get_subject` | Detail mapel + struktur | id/slug | Mapel, kursus, level, unit, lesson, node | `admin` | Termasuk draft |
| `admin_list_questions` | Daftar soal | lesson_id, query, cursor, limit | Ringkasan soal + status | `admin` | Tanpa kunci jawaban di daftar |
| `admin_get_question` | Detail soal untuk editor | id | Soal, opsi, jawaban, pasangan, media, scene | `admin` | Kunci hanya untuk staff |
| `admin_list_media` | Pustaka media | scope, query, cursor | Metadata aset | `admin` | URL bertanda tangan bila privat |
| `admin_list_users` | Direktori pengguna | query, role, status, cursor | Pengguna + ringkasan | `admin` | Jangan kembalikan password/hash |
| `admin_get_user_activity` | Aktivitas pengguna | user_id, rentang | Lesson, latihan, mastery, ledger | `admin` | Read-only |
| `admin_list_audit` | Audit dengan filter | actor, action, target, tanggal | Entri audit | `admin` | Jangan izinkan edit/hapus |
| `admin_content_health` | Deteksi konten bermasalah | — | Daftar peringatan | `admin` | Lesson tanpa soal, node tanpa lesson, media yatim |
| `admin_get_site_settings` | Baca pengaturan situs | — | Key/value tervalidasi | `admin` | Publik hanya subset yang aman |
| `admin_list_announcements` | Daftar pengumuman | status, tanggal | Pengumuman | `admin` | Termasuk jadwal |

### 9.3 RPC tulis kurikulum

| API usulan | Fungsi | Input inti | Izin | Catatan |
| --- | --- | --- | --- | --- |
| `admin_save_subject` | Buat/ubah mapel | id opsional, slug, nama, deskripsi, kategori, icon, accent, status, primary, sort | `admin` | Slug unik; arsip bukan hapus |
| `admin_reorder_subjects` | Urutkan mapel | array id berurutan | `admin` | Normalisasi sort_order dalam transaksi |
| `admin_archive_subject` | Arsipkan mapel | id, alasan | `admin` | Tolak jika masih punya konten aktif? Beri opsi cascade terkontrol |
| `admin_save_course` | Buat/ubah kursus | id, subject_id, slug, judul, deskripsi, icon, published | `admin` | Satu kursus per mapel pada fase 1 |
| `admin_save_level` | Buat/ubah level | id, course_id, slug, judul, difficulty, published | `admin` | Publish butuh minimal satu unit |
| `admin_save_unit` | Buat/ubah unit | id, level_id, slug, judul, objectives, published | `admin` | Objectives array tervalidasi |
| `admin_save_lesson` | Buat/ubah lesson | id, unit_id, slug, judul, kind, durasi, XP, Koin, hearts, published | `admin` | Jenis lesson terbatas enum |
| `admin_save_node` | Buat/ubah node peta | id, unit_id, tipe, lesson_id, sort, aktif, reward | `admin` | Validasi link dan reward |
| `admin_reorder_curriculum` | Urutkan level/unit/lesson/node | parent, array id | `admin` | Satu transaksi per parent |
| `admin_save_lesson_section` | Simpan blok materi | id, lesson_id, judul, body, sort, published | `admin` | Body JSON tervalidasi, bukan HTML bebas |
| `admin_validate_content` | Validasi sebelum publish | entity_type, id | `admin` | Mengembalikan daftar error dan warning; aturannya harus sama dengan runtime |
| `admin_publish_content` | Terbitkan/ tarik konten | entity_type, id, status | `admin` | Cek dependensi dan validasi |

### 9.4 RPC tulis bank soal dan media

| API usulan | Fungsi | Input inti | Izin | Catatan |
| --- | --- | --- | --- | --- |
| `admin_save_question` | Simpan soal atomik | soal, opsi, jawaban, pasangan, media, scene | `admin` | Satu transaksi; validasi per tipe |
| `admin_archive_question` | Arsipkan soal | id, alasan | `admin` | Jangan hapus jika sudah ada attempt |
| `admin_reorder_questions` | Urutkan soal | lesson_id, array id | `admin` | Hanya soal aktif |
| `admin_register_media` | Daftarkan aset setelah upload | path, mime, bytes, dimensi, alt, checksum | `admin` | Verifikasi file benar-benar ada |
| `admin_archive_media` | Arsipkan aset | id, alasan | `admin` | Cek referensi sebelum arsip |
| `admin_create_upload_url` | URL upload bertanda tangan | filename, mime, size, scope | `admin` | Validasi tipe/ukuran |

### 9.5 RPC konten situs, pengguna, dan sistem

| API usulan | Fungsi | Input inti | Izin | Catatan |
| --- | --- | --- | --- | --- |
| `admin_update_site_settings` | Simpan pengaturan situs | key/value tervalidasi, versi | `admin` | Optimistic concurrency |
| `admin_save_page` | Simpan halaman | slug, judul, body, SEO, status | `admin` | Sanitasi blok |
| `admin_publish_page` | Terbitkan halaman | id, jadwal | `admin` | Bisa scheduled publish |
| `admin_save_faq` | Simpan FAQ | pertanyaan, jawaban, kategori, urutan | `admin` | Validasi panjang |
| `admin_save_announcement` | Simpan pengumuman | judul, body, link, audiens, jadwal | `admin` | Bisa terbit terjadwal |
| `admin_send_announcement` | Kirim inbox | id | `admin` | Bisa >500 lewat Edge/antrean |
| `admin_set_role` | Ubah role | user_id, role, alasan | `developer` | Tidak boleh self-demote; audit |
| `admin_set_account_status` | Suspensi/aktifkan | user_id, status, alasan, sampai | `admin` | Edge Function + Admin API |
| `admin_reset_user_password` | Kirim reset | user_id | `admin` | Edge Function, service role server |
| `admin_save_gamification` | Simpan katalog gamifikasi | entity, payload | `admin` | Validasi metric/hadiah |
| `admin_toggle_feature` | Nyalakan/matikan flag | key, enabled, audience | `developer` | Default aman |
| `admin_import_questions` | Impor batch | file/json, lesson_id | `admin` | Transaksi per batch + laporan baris |

### 9.6 Kontrak error dan validasi

Kode error yang disarankan: `unauthorized`, `forbidden`, `not_found`, `conflict`, `validation_failed`, `dependency_blocked`, `rate_limited`, `internal_error`. Jangan mengembalikan pesan SQL mentah ke UI. Untuk validasi, kembalikan `fields` agar form bisa menandai input spesifik.

Validasi minimal yang wajib ada di server:

- Slug unik dan formatnya aman; jangan mengizinkan perubahan slug yang memutus tautan publik tanpa redirect.
- Tepat satu opsi benar untuk tipe pilihan; minimal dua opsi.
- Tipe soal harus memiliki payload yang sesuai: media untuk picture/listening, pasangan untuk matching, scene untuk conversation/story.
- Lesson published harus punya minimal satu soal, atau diberi status eksplisit “materi tanpa kuis”.
- Node playable harus punya `lesson_id`; node reward harus punya hadiah valid.
- Mapel aktif harus punya kursus dan minimal satu level; level aktif harus punya unit.
- Media harus lolos validasi MIME/ukuran dan memiliki alt text bila gambar.
- Pengumuman harus punya jadwal yang masuk akal dan audiens yang dikenal.
- Role hanya boleh diberikan oleh aktor dengan izin lebih tinggi; developer tidak bisa dihapus oleh admin.

---

## 10. Sistem hak akses dan keamanan admin

### 10.1 Model yang berjalan sekarang

- `user_roles` menyimpan satu role per pengguna: `player`, `admin`, `developer`.
- `is_staff()` mengembalikan true untuk `admin` **atau** `developer`; saat ini tidak ada perbedaan hak di server antara keduanya.
- `user_roles` hanya diberi SELECT; tidak ada grant INSERT/UPDATE/DELETE untuk `authenticated`.
- `bootstrap_developer()` dan `promote_developer()` hanya dapat dijalankan dari SQL Editor, bukan dari aplikasi.
- Route `/developer` dijaga guard client, tetapi otorisasi sebenarnya ada di RPC/RLS.
- `audit_logs` hanya bisa dibaca staff; penulisan hanya lewat `log_audit()` internal.

### 10.2 Matriks izin yang disarankan

| Kemampuan | Player | Support | Content Editor | Admin | Developer |
| --- | --- | --- | --- | --- | --- |
| Baca konten terbit | Ya | Ya | Ya | Ya | Ya |
| Baca draft | Tidak | Tidak | Ya | Ya | Ya |
| Edit draft kurikulum/soal | Tidak | Tidak | Ya | Ya | Ya |
| Publish/tarik konten | Tidak | Tidak | Tidak | Ya | Ya |
| Hapus/arsip permanen | Tidak | Tidak | Tidak | Terbatas | Ya |
| Kelola media | Tidak | Tidak | Ya | Ya | Ya |
| Lihat pengguna dan aktivitas | Tidak | Ya | Tidak | Ya | Ya |
| Beri hadiah Koin/XP | Tidak | Ya | Tidak | Ya | Ya |
| Ubah role | Tidak | Tidak | Tidak | Terbatas | Ya |
| Suspend akun | Tidak | Tidak | Tidak | Ya | Ya |
| Broadcast/pengumuman | Tidak | Tidak | Tidak | Ya | Ya |
| Feature flag | Tidak | Tidak | Tidak | Tidak | Ya |
| Audit log | Tidak | Tidak | Tidak | Ya | Ya |

`Support` dan `Content Editor` belum ada di enum saat ini. Ada dua pilihan: menambah nilai enum (mengubah tipe dan UI) atau memakai `role_permissions` dengan role yang ada lebih dulu. Untuk fase awal, cara paling kecil risikonya adalah **permission table** dengan `admin`/`developer`, lalu menambah role baru saat kebutuhan operasional sudah jelas.

### 10.3 Pertahanan berlapis

1. **Route guard** hanya untuk UX; tidak boleh dianggap keamanan.
2. **RPC/Edge authorization** memeriksa role/permission di server untuk setiap aksi.
3. **RLS** tetap menjadi lapisan terakhir untuk akses tabel langsung.
4. **Storage policy** membatasi baca/tulis media; jangan mengandalkan URL acak.
5. **Audit** mencatat semua perubahan dan percobaan yang ditolak.
6. **Rate limit** untuk login, grant, broadcast, upload, dan impor.
7. **Backup/PITR** sebelum operasi besar; verifikasi ketersediaan di paket Supabase yang dipakai.

### 10.4 Ancaman dan mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Eskalasi role | Admin membuat developer atau mengubah role sendiri | Hanya developer yang bisa grant developer; larang self-demotion; audit; step-up MFA |
| XSS dari konten halaman | Pencurian sesi admin/pemain | Blok JSON tervalidasi, sanitasi, CSP, jangan simpan HTML mentah |
| SVG berbahaya | Script execution saat gambar ditampilkan | Sanitasi SVG atau hanya raster; MIME validation; header aman |
| Draft bocor | Konten belum siap terlihat publik | RPC draft hanya staff; policy publik tetap `is_published` |
| Hapus data tidak sengaja | Progres/mastery hilang karena cascade | Arsip, konfirmasi, dependency check, backup |
| Broadcast salah audiens | Spam ke seluruh pengguna | Preview audiens, batas 500, antrean, audit, undo terbatas |
| Seed menimpa CMS | Kehilangan edit produksi | Bekukan seed, backup, larang seed di produksi |
| Service role bocor | Seluruh database dapat diubah | Hanya di Edge Function/server; rotasi key; jangan pernah di `VITE_*` |
| Audit tidak lengkap | Tidak bisa investigasi | Wajib audit di setiap RPC tulis; before/after; request id |
| Akun staff lemah | Pengambilalihan admin | MFA wajib, sesi pendek, notifikasi login baru, review akses berkala |

### 10.5 Kontrol operasional yang wajib

- Aktifkan MFA/TOTP untuk semua staff dan step-up untuk aksi destruktif.
- Terapkan least privilege: admin tidak otomatis menjadi developer; content editor tidak bisa publish tanpa persetujuan.
- Wajibkan alasan pada grant, suspend, role change, dan archive.
- Tampilkan peringatan dependency sebelum menghapus mapel/level/lesson.
- Simpan audit minimum satu tahun atau sesuai kebijakan; jangan simpan data sensitif yang tidak perlu.
- Review akses staff setiap kuartal dan saat ada orang keluar.
- Sediakan runbook pemulihan: siapa yang boleh restore, dari backup mana, dan bagaimana audit tindakan restore.

---

## 11. Ketergantungan antarfitur

### 11.1 Rantai dependensi utama

```text
IAM / permission
   ├── seluruh RPC tulis admin
   ├── route dan menu admin
   └── audit setiap aksi

Media library
   ├── ikon/cover mapel dan kursus
   ├── media soal
   ├── banner dan halaman
   └── avatar (bila avatar upload diizinkan)

Subject
   └── Course
        └── Level
             └── Unit
                  └── Lesson
                       ├── Lesson section (materi)
                       └── Question
                            ├── Option
                            ├── Answer
                            ├── Pair
                            └── Media

Unit → Learning node → Reward node
                     └── Progress dan klaim pemain

User
   ├── Profile dan settings
   ├── Role/permission
   ├── Wallet, ledger, inventory
   └── Activity/progress

Site settings → landing, brand, SEO, navigasi
Content pages → route publik, footer, FAQ
Announcements → notifikasi dan banner
```

### 11.2 Dependensi yang mudah terlewat

| Fitur | Bergantung pada | Jika dependensi belum siap |
| --- | --- | --- |
| Edit media soal | Media library dan storage policy | URL manual tetap bisa, tetapi rawan file yatim dan alt text tidak konsisten |
| Publish lesson | Validasi soal dan node | Lesson terbit dengan bank soal kosong seperti Bahasa Sambas saat ini |
| Hapus mapel | Dependency check seluruh turunan | Cascade dapat menghapus level, lesson, soal, dan progres |
| Publish level | Unit dan lesson | Level kosong tampil di peta |
| Edit node | Lesson dan reward | Node playable tanpa lesson atau reward ganda |
| Ganti ikon mapel | Registry ikon atau media | Icon key asing jatuh ke `book` tanpa peringatan |
| Ubah avatar | Renderer avatar dan validasi key | Key asing jatuh ke `sprout` |
| Ubah brand/SEO | Settings runtime dan boot | Teks awal/HTML tetap memakai nilai lama |
| Halaman informasi | Route publik, sanitasi, SEO | Halaman tidak bisa diakses atau berisiko XSS |
| Pengumuman | Audiens, notifikasi, jadwal | Broadcast tetap manual dan tidak bisa diedit |
| Role management | IAM, MFA, audit | Eskalasi hak akses |
| Suspend akun | Edge Function/Admin API | Hanya UI yang berubah, akses tetap terbuka |
| Feature flag | Route/RPC guard | Flag hanya menyembunyikan tombol, bukan fitur |
| Revisi/rollback | Snapshot entity dan audit | Tidak ada cara aman membatalkan perubahan |
| Bulk import | Validasi, media, transaksi | Data setengah jadi dan sulit dibersihkan |

### 11.3 Aturan urutan hapus/arsip

Urutan aman untuk menghapus atau mengarsipkan konten adalah dari daun ke akar: media yang tidak terpakai → soal → lesson → node → unit → level → course → subject. Jangan pernah menghapus parent lebih dulu. Untuk data yang sudah dimainkan, gunakan arsip dan pertahankan relasi progres. Untuk soal yang sudah memiliki attempt/mastery, jangan hard delete; nonaktifkan agar riwayat tetap valid.

---

## 12. Prioritas pengembangan

### 12.1 Prioritas tinggi (P0)

| Item | Alasan | Risiko jika ditunda | Dependensi |
| --- | --- | --- | --- |
| IAM dan permission granular | Semua tulis admin harus aman sebelum fitur dibuka | Eskalasi role atau konten rusak | MFA, audit |
| RPC baca draft + RPC tulis kurikulum inti | Tanpa ini admin tidak bisa mengelola mapel sampai lesson | CMS tidak berfungsi | Skema yang ada |
| Bank soal CRUD + validasi server | Ini inti produk dan data paling sensitif | Admin tetap bergantung seed/SQL | A8, media |
| Media library dan storage | Soal bergambar/audio membutuhkan aset terkelola | URL manual, file yatim, XSS | Storage policy |
| Peta/node/reward editor | Peta adalah pengalaman utama pemain | Perubahan level harus lewat SQL | A6, A7, B1 |
| Publish, preview, dependency check | Mencegah konten setengah jadi terbit | Lesson kosong atau mapel rusak tampil publik | A11 |
| Audit diperluas | Investigasi dan kepatuhan | Tidak ada jejak perubahan | Semua RPC tulis |

### 12.2 Prioritas menengah (P1)

| Item | Alasan | Dependensi |
| --- | --- | --- |
| Site settings, landing, beranda | Menghilangkan ketergantungan deploy untuk copy utama | Settings service, media |
| Halaman informasi dan FAQ | Melengkapi konten publik yang belum ada | Routing, sanitasi |
| Pengumuman terjadwal | Broadcast sekarang hanya inbox dan tidak bisa diedit | Notifikasi, audiens |
| Direktori dan detail pengguna | Operasional support dan komunitas | IAM, audit |
| Manajemen role/status akun | Dibutuhkan saat staff bertambah | Edge Function, MFA |
| Katalog gamifikasi | Quest, achievement, toko, level, event perlu diubah tanpa seed | Tabel yang sudah ada |
| Kategori mapel | Memudahkan katalog dan konsistensi | A1 |
| Lesson sections/materi bacaan | Melengkapi “materi” yang saat ini hanya deskripsi | A6, editor blok |

### 12.3 Prioritas rendah (P2)

| Item | Alasan |
| --- | --- |
| Revisi dan rollback | Penting saat editor banyak, belum untuk satu admin |
| Bulk import/export | Efisiensi setelah volume konten besar |
| Feature flag | Berguna untuk rilis bertahap, bukan penghalang CMS awal |
| Navigasi dinamis | Berisiko dan jarang berubah |
| SEO lanjutan/pre-render | Perlu keputusan arsitektur tersendiri |
| Content health analytics | Nilai tinggi setelah data bertambah |
| Avatar upload | Kompleks karena renderer saat ini berbasis kode |
| Multi-course penuh | Perubahan model dan UX yang besar; satu course per mapel sudah memadai untuk sekarang |

### 12.4 Definisi MVP CMS yang disarankan

MVP dianggap berhasil jika admin dapat, tanpa mengedit kode atau SQL:

1. Membuat mapel baru beserta satu kursus, minimal satu level, satu unit, dan satu lesson.
2. Menambahkan soal dari setiap tipe yang sudah didukung, termasuk opsi dan pembahasan.
3. Mengunggah media soal dan mengisi alt text.
4. Mengatur node peta, urutan, reward, dan status publish.
5. Melihat pratinjau dan menerbitkan mapel yang valid.
6. Mengubah nama situs, tagline, hero landing, dan pengumuman.
7. Mencari pengguna, memberi hadiah, dan melihat audit.
8. Semua aksi di atas tercatat dan ditolak dengan benar untuk non-staff.

---

## 13. Roadmap implementasi bertahap

Estimasi di bawah adalah perkiraan untuk satu full-stack engineer yang sudah mengenal codebase, bukan komitmen. Waktu dapat berubah setelah keputusan arsitektur dan desain UI. **Tidak ada pekerjaan implementasi yang dimulai pada audit ini.**

| Fase | Fokus | Deliverable | Exit criteria | Estimasi |
| --- | --- | --- | --- | ---: |
| 0 | Fondasi admin dan keamanan | Permission matrix, shell `/admin`, konvensi RPC, audit action, guard server | Non-staff ditolak di RPC; audit tulis berfungsi; route admin terpisah | 3–5 hari |
| 1 | Struktur kurikulum | CRUD subject, course, level, unit, lesson; reorder; draft read; arsip | Satu mapel lengkap dapat dibuat dan dipublikasikan tanpa SQL | 1–2 minggu |
| 2 | Bank soal dan media | Editor soal atomik, validasi per tipe, upload media, alt text, preview | Semua 12 tipe soal dapat diedit dan dipratinjau | 2–3 minggu |
| 3 | Peta dan reward | Editor node, reward, urutan, dependency check, preview peta | Peta berubah dari admin dan progres lama tetap aman | 1 minggu |
| 4 | Konten situs | Settings, landing/beranda, halaman, FAQ, pengumuman | Copy utama dan halaman informasi dapat diubah tanpa deploy | 1–2 minggu |
| 5 | Pengguna dan gamifikasi | User directory, role, status, quest, achievement, toko, level, event | Operasional harian tidak lagi menyentuh SQL | 2 minggu |
| 6 | Tata kelola lanjutan | Revisi, rollback, bulk import/export, feature flag, content health | Editor dapat bekerja aman dan perubahan dapat dipulihkan | 2 minggu+ |

### 13.1 Urutan yang tidak boleh dibalik

1. IAM/audit sebelum CRUD konten.
2. RPC draft read sebelum UI edit.
3. Validasi server sebelum publish.
4. Media/storage sebelum editor soal bergambar.
5. Dependency check sebelum tombol hapus.
6. Backup dan revisi sebelum bulk import atau operasi massal.

### 13.2 Milestone yang bisa dinilai

- **M1:** admin dapat membuat satu mapel utuh dan menerbitkannya.
- **M2:** admin dapat mengganti satu soal dan media tanpa deploy.
- **M3:** admin dapat mengubah landing page dan pengumuman tanpa deploy.
- **M4:** admin dapat mengelola pengguna dan role dengan audit.
- **M5:** admin dapat mengubah katalog gamifikasi tanpa seed.

---

## 14. Kesimpulan dan rekomendasi akhir

1. **Lentera sudah memiliki fondasi data yang layak untuk CMS.** Rantai subject → course → level → unit → lesson → node → question sudah ada, begitu pula reward, quest, toko, liga, dan event. Yang belum ada adalah bidang kendali admin yang aman di atasnya.
2. **Admin Dashboard saat ini adalah dashboard operasional, bukan CMS.** Fiturnya hanya overview, pencarian pemain, grant, broadcast, dan audit. Jangan menyebutnya CMS sampai CRUD konten, media, pengguna, dan publish tersedia.
3. **Jangan menambah grant CRUD langsung ke tabel konten.** Tabel soal sengaja tanpa policy dan tanpa SELECT grant. Membukanya untuk admin akan membuka kunci jawaban jika policy salah. Gunakan RPC admin `security definer` yang memeriksa izin dan mengembalikan data sesuai peran.
4. **Prioritas pertama adalah IAM, RPC draft read, CRUD kurikulum, bank soal, dan media.** Ini memberi nilai terbesar dan menutup ketergantungan pada seed/SQL.
5. **Konten situs adalah lapisan berikutnya.** Brand, landing, roadmap, FAQ, dan pengumuman saat ini hardcoded; memindahkannya membutuhkan `site_settings` dan `content_pages`, bukan sekadar form.
6. **Manajemen pengguna membutuhkan arsitektur server untuk operasi Auth.** Role dan profil bisa lewat RPC, tetapi reset password, ban, dan revoke session memerlukan Edge Function dengan service role yang tidak boleh berada di browser.
7. **Media harus dipisahkan dari aset game.** Aset Phaser/Kiko/audio tetap di kode; media soal dan halaman memakai bucket konten dengan metadata, alt text, dan sanitasi.
8. **Tata kelola konten tidak boleh ditunda terlalu lama.** Arsip, dependency check, audit before/after, dan backup adalah pengaman minimum sebelum admin diberi tombol hapus.
9. **Dokumentasi perlu diselaraskan.** README, beranda, dan docs masih memuat status peta Phaser, jumlah node, dan jumlah mode yang tidak lagi akurat. Jadikan kode dan skema sebagai sumber kebenaran, lalu perbarui dokumentasi pada setiap rilis.
10. **Rekomendasi langkah berikutnya:** setujui arah arsitektur RPC-first + Edge Function untuk operasi Auth, lalu mulai Fase 0 dan 1 pada instruksi terpisah. Jangan langsung membangun UI CRUD sebelum izin, audit, dan RPC draft-read siap.

### 14.1 Keputusan yang perlu diambil pemilik produk sebelum implementasi

- Apakah “materi” berarti bacaan panjang di dalam lesson, atau cukup deskripsi dan bank soal seperti sekarang?
- Apakah satu mapel tetap satu kursus, atau multi-course perlu didukung sejak awal?
- Apakah akan ada role `content_editor` dan `support`, atau cukup `admin`/`developer` dengan permission table?
- Apakah halaman publik memerlukan SEO nyata (pre-render) atau cukup SPA dengan meta runtime?
- Apakah avatar upload diperlukan, mengingat renderer avatar saat ini berbasis kode?
- Apakah data produksi boleh diakses untuk verifikasi live setelah izin diberikan?

---

## Lampiran A. Bukti dan rujukan utama

| Area | File/bukti |
| --- | --- |
| Routing dan guard | `src/app/router.ts`; 28 route; guard `staff` |
| Navigasi | `src/layouts/appLayout.ts`; `NAV_ITEMS` 12 item |
| Admin saat ini | `src/pages/developer.page.ts`; `src/services/developer.service.ts`; `src/repositories/developer.repository.ts` |
| Skema kurikulum | `supabase/migrations/20261108100000_curriculum.sql` |
| RPC developer | `supabase/migrations/20261111110000_developer_dashboard.sql` |
| IAM/role | `supabase/migrations/20261108090000_identity.sql` |
| Gamifikasi | `20261110120000_progression_economy.sql`, `20261110130000_tahap5_rewards.sql`, `20261110140000_mastery_review_rewards.sql` |
| Sosial/liga/event | `20261111100000_social_league.sql` |
| Seed konten | `scripts/content/**`, `supabase/migrations/20261108110000_curriculum_seed.sql` |
| Peta baru | `src/components/learningJourney.ts`, `src/game/journey/model.ts`, `src/styles/journey.css` |
| Peta lama | `src/game/scenes/adventureMapScene.ts`, `src/game/adventure/**` |
| Brand/SEO | `src/config/brand.ts`, `index.html` |
| Aset | `src/game/assets/manifest.ts`, `public/assets/pictures/` |
| Validasi | `src/utils/validation.ts`, `scripts/content/index.ts` |

## Lampiran B. Hal yang belum terverifikasi

1. Jumlah pengguna, konten, dan aktivitas di Supabase live tidak di-query. Angka pada laporan berasal dari replika migration dan seed lokal.
2. Kesesuaian migration yang sudah diterapkan di project live dengan 15 file migration tidak diperiksa langsung.
3. Konfigurasi produksi `VITE_GAME_NAME`, tagline, URL dukungan, dan `VITE_APP_URL` tidak diketahui.
4. MFA, rate limit, backup/PITR, dan kebijakan Supabase live belum diperiksa.
5. Tampilan admin pada 390 px, keyboard navigation, dan pembaca layar belum diuji.
6. E2E live dan API verification tidak dijalankan pada audit ini; hasil verifikasi terakhir sebelum audit tidak diulang.
7. Performa query admin untuk bank soal besar belum diukur karena UI/API admin belum ada.
8. Kualitas konten seed (kebenaran akademik, ejaan, dan kelayakan soal) tidak diaudit satu per satu; audit ini fokus pada struktur dan pengelolaan.

## Lampiran C. Definition of Done untuk CMS

Sebuah fitur admin baru dianggap selesai hanya jika:

- Ada RPC/Edge Function dengan otorisasi server dan validasi.
- Ada audit before/after untuk aksi tulis.
- Ada test SQL untuk izin, validasi, dan idempotensi.
- Ada test UI untuk alur utama dan penolakan non-staff.
- Draft tidak terlihat publik sebelum publish.
- Aksi hapus default-nya arsip dan memeriksa dependency.
- Error ditampilkan per field dan tidak membocorkan pesan SQL.
- Dokumentasi dan label menu diperbarui.
- Tidak ada service role atau secret di bundle browser.

---

**Akhir laporan.** Tidak ada implementasi yang dilakukan. Menunggu instruksi berikutnya.

