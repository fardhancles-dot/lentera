# Game Design

## Identitas

| Elemen | Nilai |
| --- | --- |
| Nama | **Lentera** |
| Tagline | Petualangan belajar yang seru |
| Maskot | **Kiko**, roh daun penjaga Lentera |
| Genre visual | 2D cartoon, playful educational, colorful vector |
| Suasana | Hangat, ramah, tidak kekanak-kanakan, tidak meniru merek lain |

Lentera adalah nama benda (lampu genggam) yang menjadi metafora belajar: menerangi jalan
sedikit demi sedikit. Kiko membawa lentera kecil sebagai penanda identitas.

Semua nama, maskot, ikon, dan ilustrasi dibuat orisinal. Tidak ada aset, karakter, logo,
atau teks milik Duolingo yang dipakai.

## Palet

| Token | Hex | Pemakaian |
| --- | --- | --- |
| Primary Green | `#58CC02` | Tombol utama, progres, aksen. |
| Dark Green | `#2F8F24` | Bayangan tombol, detail maskot. |
| Light Green | `#E9F9DC` | Latar lembut, badge, highlight. |
| Yellow | `#FFC83D` | Lentera, reward, sorotan. |
| White | `#FFFFFF` | Permukaan kartu. |
| Background | `#F7FAF5` | Latar aplikasi. |
| Primary Text | `#303A32` | Teks utama. |
| Secondary Text | `#89928A` | Teks pendukung. |
| Border | `#E5EBE2` | Garis kartu/input. |
| Blue Accent | `#4CA8E8` | Informasi, tautan sekunder. |
| Error Red | `#EA5B5B` | Kesalahan. |

Warna dipakai berlapis: hijau untuk aksi, kuning untuk hadiah, biru untuk informasi, merah
hanya untuk kesalahan. Latar tidak pernah seluruhnya hijau.

Token didefinisikan di `src/styles/tokens.css`.

## Tipografi

- **Nunito Variable** (self-hosted lewat `@fontsource-variable/nunito`).
- Heading 800, tracking negatif tipis; body 600–700.
- Ukuran responsif memakai `clamp()`.
- Tidak memakai font eksternal CDN agar tetap cepat dan tidak bergantung pihak ketiga.

## Maskot Kiko

Anatomi vector:

- Badan bulat hijau dengan perut krem.
- Dua daun telinga.
- Mata besar dengan pupil gelap dan highlight.
- Pipi merah muda samar.
- Kaki hijau tua.
- Lentera kuning di tangan kanan.

Animasi yang **sudah berjalan** di Phaser:

1. Idle (naik-turun halus).
2. Blink (interval acak 2,2–4,4 detik).
3. Wave (lengan kiri).
4. Ear wiggle.
5. Lantern sway.
6. Celebrate (lompat + ledakan sparkle) saat diketuk.

Animasi yang direncanakan untuk gameplay: walking, jumping, thinking, surprised, sad,
encouraging, speaking, disappointed. Animasi tersebut membutuhkan sprite sheet/rig dan
belum dibuat. Saat ini semua digambar prosedural agar tidak ada klaim aset yang tidak ada.

Aturan: jangan memakai emoji sebagai karakter atau ikon UI. Ikon memakai SVG orisinal di
`src/components/icons.ts`.

## Avatar pemain

Lima varian orisinal dengan bentuk sama, palet berbeda: Tunas, Bara, Ombak, Bintang, Beri.
Tersimpan sebagai `avatar_key` di database. Avatar adalah bagian karakter, bukan emoji.

## Layout

- **Mobile first**: navigasi bawah, target sentuh minimal 48 px, safe-area iOS.
- **Tablet**: satu kolom nyaman dengan kartu lebar terbatas.
- **Desktop**: sidebar 248 px, konten maksimum 1080 px, tip Kiko di sidebar.
- Area Phaser selalu berada dalam kontainer ber-aspect-ratio, tidak menutupi form.

## Gerak dan efek

- Durasi UI 150–350 ms, easing `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- Tombol memiliki “kedalaman” 3–5 px yang turun saat ditekan.
- Progress bar bergerak 600 ms.
- Animasi halaman masuk 350 ms, 8 px.
- `prefers-reduced-motion` dan pengaturan pemain (`reduced_motion`) mematikan animasi.

Efek gameplay (confetti, screen shake, floating XP) belum ada karena gameplay belum ada.

## Audio

Rencana:

- Musik latar lembut, loop, volume terpisah.
- SFX: klik, benar, salah, level up, reward, hitungan waktu.
- Suara karakter memakai rekaman atau TTS yang benar-benar tersedia; tidak ada audio palsu.
- Audio tidak diputar sebelum interaksi pengguna (kebijakan browser).

Status: **belum ada aset audio**. Pengaturan volume sudah tersimpan di database agar siap
dipakai. Jangan menampilkan tombol putar yang tidak menghasilkan suara.

## Pipeline aset

Saat ini:

```text
public/assets/        (belum dibuat; belum ada file gambar/audio)
```

Karakter, ikon, dan ilustrasi HTML dibuat sebagai SVG inline/Phaser Graphics supaya build
ringan dan tajam di semua resolusi.

Saat aset raster/audio ditambahkan:

1. Simpan di `public/assets/{characters,sprites,backgrounds,audio,icons}`.
2. Gunakan nama file huruf kecil dan deskriptif.
3. Optimalkan gambar (WebP/AVIF) dan audio (OGG/MP3).
4. Muat hanya aset scene yang aktif.
5. Tandai aset placeholder secara eksplisit di dokumentasi.

## Prinsip desain

1. Belajar terasa seperti bermain, bukan formulir soal.
2. Satu aksi utama per layar.
3. Umpan balik jelas: benar, salah, tersimpan, gagal.
4. Tidak ada tombol hiasan.
5. Karakter tidak menutupi teks atau kontrol.
