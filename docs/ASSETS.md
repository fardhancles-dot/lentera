# Assets

## Prinsip

Lentera tidak memakai aset bajakan dan tidak menyembunyikan placeholder. Karakter,
peta, dan seluruh efek suara dibuat oleh proyek sendiri:

| Aset | Bentuk | Sumber | Lisensi |
| --- | --- | --- | --- |
| Kiko, maskot daun | Vektor Phaser, 13 state animasi | `src/game/characters/kiko.ts` | Karya orisinal untuk Lentera |
| Peta petualangan | Digambar per level (langit, bukit, jalan, pohon, node) | `src/game/scenes/adventureMapScene.ts` | Karya orisinal untuk Lentera |
| SFX & musik latar | Disintesis Web Audio (osilator) | `src/game/audio/patterns.ts`, `audioEngine.ts` | Karya orisinal, tanpa sampel pihak ketiga |
| Ilustrasi soal | SVG | `public/assets/pictures/*.svg` | Karya orisinal untuk Lentera |
| Avatar pemain | SVG | `src/components/avatar.ts` | Karya orisinal untuk Lentera |
| Ikon UI | SVG | `src/components/icons.ts` | Karya orisinal untuk Lentera |
| Suara model bahasa | Browser Speech Synthesis | API browser | Mengikuti lisensi browser/pengguna |

Tidak ada file audio atau sprite sheet eksternal yang diunduh. Karena itu tidak ada
kewajiban atribusi pihak ketiga dan tidak ada aset yang diam-diam berupa placeholder
kosong.

## Struktur folder

```text
public/assets/
├── pictures/          # ilustrasi soal (SVG) — satu-satunya file aset saat ini
└── (sprites/)         # disiapkan untuk sprite sheet final bila nanti ditambahkan
```

Kalau nanti sprite sheet atau file audio final ditambahkan:

1. Simpan file di `public/assets/sprites/` atau `public/assets/audio/`.
2. Daftarkan di `src/game/assets/manifest.ts` (key unik, scene pemakai, path, lisensi).
3. Panggil `preloadSceneAssets(scene, '<scene-key>')` di `preload()` scene terkait.
4. Tambahkan entri lisensi ke tabel di atas.

## Manifest dan loader

- `src/game/assets/manifest.ts` — daftar aset, scene pemakai, sumber, dan lisensi.
  Modul ini murni (tanpa Phaser) sehingga bisa diuji di Node.
- `src/game/assets/load.ts` — memuat aset file lewat Phaser Loader, mencatat
  `FILE_LOAD_ERROR`, dan tidak memblokir scene: pemanggil tetap punya fallback
  prosedural.
- Aset prosedural (`source.type === 'procedural'`) tidak pernah dimuat sebagai file;
  keterangannya menjelaskan di mana kode pembuatnya berada.

Unit test `tests/assets.test.ts` memastikan key unik, setiap aset punya lisensi, dan
setiap path file benar-benar ada di `public/`.
