import { fill, lesson, mc, typing } from './helpers';
import type { SeedLesson, SeedSubject } from './types';

/**
 * Review and challenge lessons for the first unit of each primary subject.
 * They use fresh questions (not copies) so the path has real review and
 * challenge nodes instead of decorative labels. Additional units will follow
 * the same pattern as content is expanded.
 */
const REVIEW_LESSONS: Record<string, SeedLesson[]> = {
  'pemrograman-web': [
    lesson(
      'html-review',
      'Review HTML',
      'Periksa kembali pemahaman struktur dan tag semantik HTML.',
      [
        mc(
          'review-html-main',
          'HTML Semantik',
          'Tag yang menandai konten utama halaman adalah…',
          ['<main>', '<section>', '<footer>', '<nav>'],
          0,
          '<main> membungkus konten utama yang unik untuk halaman tersebut. <nav> khusus navigasi.',
        ),
        mc(
          'review-html-alt',
          'Aksesibilitas',
          'Apa fungsi atribut alt pada elemen gambar?',
          [
            'Memberi deskripsi gambar untuk pembaca layar',
            'Mengatur ukuran gambar',
            'Menentukan alamat gambar',
            'Membuat gambar dapat diklik',
          ],
          0,
          'Alt adalah teks alternatif yang menjelaskan gambar ketika gambar tidak tampil atau dibaca oleh pembaca layar.',
        ),
        typing(
          'review-html-ol',
          'HTML',
          'Tulis tag pembuka HTML untuk membuat daftar berurutan.',
          ['<ol>', 'ol'],
          '<ol> membuat ordered list atau daftar bernomor. <ul> dipakai untuk daftar tanpa urutan.',
        ),
      ],
      5,
      'review',
    ),
    lesson(
      'html-challenge',
      'Tantangan HTML',
      'Latihan lebih menantang tentang pemilihan elemen dan atribut.',
      [
        mc(
          'challenge-html-article',
          'HTML Semantik',
          'Elemen paling tepat untuk membungkus tulisan mandiri seperti artikel blog adalah…',
          ['<article>', '<div>', '<span>', '<thead>'],
          0,
          '<article> menandai konten mandiri yang masih bermakna jika dipisahkan dari halaman.',
        ),
        fill(
          'challenge-html-target',
          'HTML',
          'Agar tautan terbuka di tab baru, isi atribut target dengan "___".',
          ['_blank'],
          'target="_blank" membuka tautan di tab atau jendela baru. Sertakan rel="noopener" untuk keamanan.',
        ),
        mc(
          'challenge-html-aside',
          'HTML Semantik',
          'Konten pelengkap di samping artikel utama paling tepat dibungkus dengan…',
          ['<aside>', '<header>', '<footer>', '<main>'],
          0,
          '<aside> dipakai untuk konten yang berkaitan tetapi bukan bagian utama, misalnya catatan atau tautan terkait.',
        ),
      ],
      6,
      'challenge',
    ),
  ],
  'basis-data': [
    lesson(
      'database-review',
      'Review Dasar Database',
      'Ulangi konsep kunci, query, dan penyaringan data.',
      [
        mc(
          'review-db-primary-key',
          'Primary Key',
          'Nilai pada kolom primary key harus…',
          ['Unik dan tidak null', 'Boleh berulang', 'Selalu berupa teks', 'Selalu diisi angka nol'],
          0,
          'Primary key mengidentifikasi setiap baris secara unik, sehingga tidak boleh duplikat atau kosong.',
        ),
        mc(
          'review-db-select',
          'SQL',
          'Perintah SQL untuk mengambil data dari tabel adalah…',
          ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
          0,
          'SELECT membaca data. INSERT menambah, UPDATE mengubah, dan DELETE menghapus.',
        ),
        typing(
          'review-db-where',
          'SQL',
          'Tulis klausa SQL yang digunakan untuk menyaring baris berdasarkan kondisi.',
          ['where'],
          'Klausa WHERE ditempatkan setelah FROM untuk membatasi baris yang dikembalikan.',
        ),
      ],
      5,
      'review',
    ),
    lesson(
      'database-challenge',
      'Tantangan Basis Data',
      'Uji pemahaman relasi, JOIN, dan perubahan data.',
      [
        mc(
          'challenge-db-foreign-key',
          'Foreign Key',
          'Apa fungsi foreign key?',
          [
            'Menghubungkan baris ke primary key tabel lain',
            'Menghapus tabel secara otomatis',
            'Mengurutkan hasil query',
            'Menyimpan gambar di database',
          ],
          0,
          'Foreign key menjaga relasi antar tabel dengan merujuk primary key pada tabel lain.',
        ),
        mc(
          'challenge-db-join',
          'JOIN',
          'JOIN digunakan untuk…',
          [
            'Menggabungkan baris dari dua tabel berdasarkan relasi',
            'Membuat tabel baru tanpa data',
            'Mengubah tipe data kolom',
            'Menghapus duplikasi otomatis',
          ],
          0,
          'JOIN mencocokkan baris antar tabel memakai kolom relasi yang ditentukan pada kondisi ON.',
        ),
        fill(
          'challenge-db-update',
          'SQL',
          'Perintah SQL untuk mengubah data yang sudah ada adalah ___',
          ['update'],
          'UPDATE mengubah nilai kolom pada baris yang memenuhi klausa WHERE.',
        ),
      ],
      6,
      'challenge',
    ),
  ],
  'ppb-flutter-dart': [
    lesson(
      'flutter-review',
      'Review Dart dan Flutter',
      'Ulangi titik masuk program, widget, dan dependensi.',
      [
        mc(
          'review-dart-main',
          'Dart',
          'Fungsi yang menjadi titik masuk program Dart adalah…',
          ['main()', 'start()', 'init()', 'run()'],
          0,
          'Program Dart dimulai dari fungsi main(). Flutter memanggil runApp() di dalamnya.',
        ),
        mc(
          'review-flutter-stateless',
          'Widget',
          'StatelessWidget cocok untuk widget yang…',
          [
            'Tampilannya tidak berubah setelah dibuat',
            'Selalu menyimpan data sementara',
            'Hanya dapat digunakan sekali',
            'Tidak memiliki anak widget',
          ],
          0,
          'StatelessWidget tidak memiliki state yang berubah. Jika tampilan perlu berubah, gunakan StatefulWidget.',
        ),
        typing(
          'review-flutter-pubspec',
          'Flutter',
          'Tulis nama file konfigurasi dependensi dan metadata proyek Flutter.',
          ['pubspec.yaml'],
          'pubspec.yaml menyimpan nama proyek, versi, aset, dan daftar dependency Flutter.',
        ),
      ],
      5,
      'review',
    ),
    lesson(
      'flutter-challenge',
      'Tantangan Dart dan Flutter',
      'Latihan state, immutability, dan widget dasar.',
      [
        mc(
          'challenge-flutter-setstate',
          'State',
          'Apa fungsi setState() pada StatefulWidget?',
          [
            'Memberi tahu Flutter bahwa state berubah dan UI perlu dibangun ulang',
            'Menyimpan data ke database',
            'Menutup aplikasi',
            'Mengubah tema secara permanen',
          ],
          0,
          'setState menandai widget kotor sehingga Flutter menjadwalkan pembangunan ulang UI dengan nilai terbaru.',
        ),
        mc(
          'challenge-dart-final',
          'Dart',
          'Kata kunci final pada variabel berarti…',
          [
            'Nilainya tidak dapat diubah setelah diinisialisasi',
            'Nilai selalu null',
            'Variabel bersifat global',
            'Variabel hanya dapat dipakai sekali',
          ],
          0,
          'final menetapkan nilai sekali. const lebih ketat karena nilainya harus diketahui saat kompilasi.',
        ),
        fill(
          'challenge-flutter-text',
          'Widget',
          'Widget Flutter untuk menampilkan teks adalah ___',
          ['text', 'Text'],
          'Widget Text menampilkan string. Atribut style mengatur ukuran, warna, dan bobot huruf.',
        ),
      ],
      6,
      'challenge',
    ),
  ],
  'bahasa-inggris': [
    lesson(
      'english-review',
      'English Review',
      'Review simple present, past tense, and everyday vocabulary.',
      [
        mc(
          'review-english-third-person',
          'Grammar',
          'She ___ to school every day.',
          ['goes', 'go', 'going', 'gone'],
          0,
          'Subjek orang ketiga tunggal (she) memakai bentuk goes pada simple present.',
        ),
        mc(
          'review-english-past-go',
          'Tenses',
          'What is the past tense of "go"?',
          ['went', 'goed', 'gone', 'going'],
          0,
          'Bentuk past tense dari go adalah went. Gone adalah past participle.',
        ),
        typing(
          'review-english-book',
          'Vocabulary',
          'Write the English word for "buku".',
          ['book'],
          '"Buku" dalam Bahasa Inggris adalah book.',
        ),
      ],
      5,
      'review',
    ),
    lesson(
      'english-challenge',
      'English Challenge',
      'Tantangan present perfect, preposition, dan struktur kalimat.',
      [
        mc(
          'challenge-english-present-perfect',
          'Tenses',
          'They ___ lived here since 2020.',
          ['have', 'has', 'had', 'having'],
          0,
          'Subjek they memakai have pada present perfect: have + past participle (lived).',
        ),
        fill(
          'challenge-english-interested',
          'Preposition',
          'I am interested ___ learning English.',
          ['in'],
          'Ungkapan yang benar adalah interested in, bukan interested on atau at.',
        ),
        mc(
          'challenge-english-negative',
          'Grammar',
          'Choose the correct sentence.',
          [
            "He doesn't like coffee.",
            "He don't like coffee.",
            "He not likes coffee.",
            'He no like coffee.',
          ],
          0,
          'Untuk he/she/it pada simple present, bentuk negatifnya memakai doesn\'t + verb dasar.',
        ),
      ],
      6,
      'challenge',
    ),
  ],
  'bahasa-indonesia': [
    lesson(
      'indonesia-review',
      'Review Bahasa Indonesia',
      'Ulangi ejaan, kalimat efektif, dan kata baku.',
      [
        mc(
          'review-indonesia-preposition',
          'Ejaan',
          'Penulisan kata depan "di" yang benar adalah…',
          ['di rumah', 'dirumah', 'di-rumah', 'DiRumah'],
          0,
          'Kata depan di ditulis terpisah dari kata yang mengikutinya, seperti di rumah. Awalan di- ditulis serangkai, seperti ditulis.',
        ),
        mc(
          'review-indonesia-effective',
          'Kalimat Efektif',
          'Kalimat yang paling efektif adalah…',
          [
            'Para siswa mengikuti upacara.',
            'Para siswa-siswa mengikuti upacara.',
            'Semua para siswa mengikuti upacara.',
            'Para semua siswa mengikuti upacara.',
          ],
          0,
          'Kata para sudah bermakna jamak, sehingga tidak perlu diulang dengan semua atau siswa-siswa.',
        ),
        typing(
          'review-indonesia-aktivitas',
          'Kata Baku',
          'Tulis bentuk baku dari kata "aktifitas".',
          ['aktivitas'],
          'Bentuk baku yang tercatat adalah aktivitas, bukan aktifitas.',
        ),
      ],
      5,
      'review',
    ),
    lesson(
      'indonesia-challenge',
      'Tantangan Bahasa Indonesia',
      'Latihan struktur teks, konjungsi, dan ketepatan ejaan.',
      [
        mc(
          'challenge-indonesia-procedure',
          'Teks Prosedur',
          'Struktur teks prosedur yang tepat adalah…',
          [
            'Tujuan, alat dan bahan, langkah-langkah',
            'Orientasi, komplikasi, resolusi',
            'Pernyataan umum, deretan penjelas, interpretasi',
            'Abstraksi, krisis, koda',
          ],
          0,
          'Teks prosedur memuat tujuan, alat/bahan bila diperlukan, lalu langkah-langkah yang berurutan.',
        ),
        fill(
          'challenge-indonesia-karena',
          'Konjungsi',
          'Hubungan sebab-akibat dapat ditandai dengan konjungsi ___',
          ['karena'],
          'Karena menandai sebab. Akibatnya dapat ditandai dengan sehingga atau maka.',
        ),
        mc(
          'challenge-indonesia-spelling',
          'Ejaan',
          'Kalimat dengan ejaan yang benar adalah…',
          [
            'Saya membeli buku di toko.',
            'Saya membeli buku ditoko.',
            'saya membeli buku di toko.',
            'Saya membeli buku di-toko.',
          ],
          0,
          'Huruf pertama kalimat diawali kapital, dan kata depan di ditulis terpisah.',
        ),
      ],
      6,
      'challenge',
    ),
  ],
  'pendidikan-pancasila': [
    lesson(
      'pancasila-review',
      'Review Pancasila',
      'Ulangi nilai sila, dasar hukum, dan kewarganegaraan.',
      [
        mc(
          'review-pancasila-first',
          'Pancasila',
          'Sila pertama Pancasila berbunyi…',
          [
            'Ketuhanan Yang Maha Esa',
            'Kemanusiaan yang adil dan beradab',
            'Persatuan Indonesia',
            'Keadilan sosial bagi seluruh rakyat Indonesia',
          ],
          0,
          'Sila pertama menegaskan Ketuhanan Yang Maha Esa sebagai dasar kehidupan beragama bangsa.',
        ),
        mc(
          'review-pancasila-constitution',
          'Konstitusi',
          'Dasar hukum tertulis utama negara Indonesia adalah…',
          ['UUD 1945', 'Pancasila', 'Keputusan Presiden', 'Peraturan Daerah'],
          0,
          'UUD 1945 adalah konstitusi tertulis. Pancasila adalah dasar negara dan sumber nilai.',
        ),
        fill(
          'review-pancasila-fifth',
          'Pancasila',
          'Sila ke-___ berbunyi "Keadilan sosial bagi seluruh rakyat Indonesia".',
          ['5', 'lima'],
          'Sila kelima menekankan keadilan sosial bagi seluruh rakyat Indonesia.',
        ),
      ],
      5,
      'review',
    ),
    lesson(
      'pancasila-challenge',
      'Tantangan Pancasila',
      'Latihan demokrasi, hak, kewajiban, dan gotong royong.',
      [
        mc(
          'challenge-pancasila-democracy',
          'Demokrasi',
          'Prinsip utama demokrasi adalah…',
          [
            'Kedaulatan berada di tangan rakyat',
            'Kekuasaan dipegang satu orang',
            'Rakyat tidak perlu memilih pemimpin',
            'Hukum hanya berlaku bagi pejabat',
          ],
          0,
          'Demokrasi menempatkan kedaulatan rakyat sebagai dasar, diwujudkan melalui pemilu dan partisipasi publik.',
        ),
        mc(
          'challenge-pancasila-obligation',
          'Hak dan Kewajiban',
          'Contoh kewajiban warga negara adalah…',
          ['Membayar pajak', 'Mendapat pelayanan kesehatan', 'Memilih sekolah', 'Menerima upah'],
          0,
          'Membayar pajak adalah kewajiban. Pelayanan kesehatan dan pendidikan lebih tepat disebut hak.',
        ),
        fill(
          'challenge-pancasila-gotong-royong',
          'Keberagaman',
          'Bekerja sama tanpa pamrih untuk kepentingan bersama disebut ___',
          ['gotong royong'],
          'Gotong royong mencerminkan kerja sama sukarela dan kebersamaan dalam masyarakat.',
        ),
      ],
      6,
      'challenge',
    ),
  ],
  matematika: [
    lesson(
      'math-review',
      'Review Matematika',
      'Ulangi operasi bilangan, aljabar dasar, dan perhitungan.',
      [
        mc(
          'review-math-multiply',
          'Operasi Bilangan',
          'Hasil dari 12 × 8 adalah…',
          ['96', '86', '108', '92'],
          0,
          '12 × 8 = 96. Periksa dengan 10 × 8 = 80 ditambah 2 × 8 = 16.',
        ),
        mc(
          'review-math-algebra',
          'Aljabar',
          'Bentuk sederhana dari 2x + 3x adalah…',
          ['5x', '6x', '5x²', 'x + 5'],
          0,
          'Suku sejenis dapat dijumlahkan koefisiennya: 2 + 3 = 5, sehingga hasilnya 5x.',
        ),
        typing(
          'review-math-add',
          'Operasi Bilangan',
          'Berapa hasil dari 15 + 27?',
          ['42'],
          '15 + 27 = 42.',
        ),
      ],
      5,
      'review',
    ),
    lesson(
      'math-challenge',
      'Tantangan Matematika',
      'Latihan persamaan, rata-rata, dan geometri.',
      [
        mc(
          'challenge-math-linear',
          'Persamaan',
          'Jika 2x + 4 = 12, maka nilai x adalah…',
          ['4', '6', '8', '3'],
          0,
          'Kurangi kedua ruas dengan 4: 2x = 8. Bagi dengan 2: x = 4.',
        ),
        mc(
          'challenge-math-mean',
          'Statistik',
          'Rata-rata dari 4, 6, 8, dan 10 adalah…',
          ['7', '6', '8', '9'],
          0,
          'Jumlah data 4 + 6 + 8 + 10 = 28. Dibagi 4 data menghasilkan 7.',
        ),
        fill(
          'challenge-math-area',
          'Geometri',
          'Luas persegi panjang dengan panjang 8 cm dan lebar 5 cm adalah ___ cm².',
          ['40'],
          'Luas persegi panjang = panjang × lebar = 8 × 5 = 40 cm².',
        ),
      ],
      6,
      'challenge',
    ),
  ],
};

export function applyReviewLessons(subjects: SeedSubject[]): void {
  for (const subject of subjects) {
    const extra = REVIEW_LESSONS[subject.slug];
    if (!extra || extra.length === 0) continue;

    const unit = subject.levels[0]?.units[0];
    if (!unit) continue;

    for (const item of extra) {
      if (!unit.lessons.some((lessonItem) => lessonItem.slug === item.slug)) {
        unit.lessons.push(item);
      }
    }
  }
}
