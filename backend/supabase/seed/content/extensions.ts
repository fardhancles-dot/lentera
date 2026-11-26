import { fill, lesson, mc, nodeLesson, typing } from './helpers';
import type { SeedLesson, SeedSubject } from './types';

/**
 * Stage 3 extension: practice, checkpoint, and legendary nodes.
 *
 * Practice sits after the level-2 lesson, checkpoint closes the level-2 unit,
 * and legendary closes the level-3 unit. Every lesson uses fresh questions; no
 * question is copied from the base lesson or review pack.
 */
interface StageThreePack {
  practice: SeedLesson;
  checkpoint: SeedLesson;
  legendary: SeedLesson;
}

const PACKS: Record<string, StageThreePack> = {
  'pemrograman-web': {
    practice: nodeLesson(
      'practice',
      lesson(
        'latihan-css-layout',
        'Latihan CSS & Layout',
        'Latihan terarah untuk properti CSS yang paling sering dipakai.',
        [
          mc(
            'practice-web-padding',
            'CSS Box Model',
            'Properti CSS yang mengatur jarak di dalam batas elemen adalah…',
            ['padding', 'margin', 'border', 'outline'],
            0,
            'Padding memberi ruang antara konten dan border. Margin memberi jarak di luar border.',
            'Bayangkan bantalan di dalam kotak.',
          ),
          mc(
            'practice-web-flex-row',
            'Flexbox',
            'Pada container dengan display: flex, arah susunan default anak-anaknya adalah…',
            ['horizontal (row)', 'vertikal (column)', 'grid dua dimensi', 'posisi absolute'],
            0,
            'Flexbox memakai flex-direction: row secara default, sehingga anak tersusun horizontal.',
          ),
          typing(
            'practice-web-selector-p',
            'Selector CSS',
            'Tulis selector CSS untuk memilih semua elemen <p>.',
            ['p'],
            'Selector p memilih seluruh elemen paragraf tanpa tanda titik atau pagar.',
          ),
        ],
        6,
        'practice',
      ),
    ),
    checkpoint: nodeLesson(
      'checkpoint',
      lesson(
        'checkpoint-html-css',
        'Checkpoint HTML & CSS',
        'Periksa pemahaman struktur dan penataan sebelum masuk JavaScript.',
        [
          mc(
            'checkpoint-web-main',
            'HTML Semantik',
            'Tag yang menandai konten utama halaman adalah…',
            ['<main>', '<nav>', '<aside>', '<footer>'],
            0,
            '<main> membungkus konten utama yang unik. <nav> untuk navigasi, <aside> untuk konten samping, <footer> untuk penutup.',
          ),
          mc(
            'checkpoint-web-em',
            'Satuan CSS',
            'Satuan CSS yang relatif terhadap ukuran font elemen induk adalah…',
            ['em', 'px', 'vh', 'pt'],
            0,
            'em dihitung dari font-size induk. rem dihitung dari font-size root, px bersifat tetap, dan vh relatif terhadap tinggi viewport.',
          ),
          fill(
            'checkpoint-web-grid',
            'CSS Grid',
            'Lengkapi: .galeri { display: __; grid-template-columns: repeat(3, 1fr); }',
            ['grid'],
            'display: grid mengaktifkan tata letak dua dimensi; grid-template-columns menentukan jumlah kolom.',
          ),
        ],
        8,
        'review',
      ),
    ),
    legendary: nodeLesson(
      'legendary',
      lesson(
        'legendary-web-dom',
        'Legendary JavaScript DOM',
        'Tantangan lanjutan tentang DOM, event, dan perilaku browser.',
        [
          mc(
            'legendary-web-queryall',
            'DOM',
            'document.querySelectorAll(".item") mengembalikan…',
            [
              'NodeList statis berisi semua elemen yang cocok',
              'HTMLCollection yang berubah otomatis',
              'Array biasa',
              'Hanya elemen pertama yang cocok',
            ],
            0,
            'querySelectorAll mengembalikan NodeList statis. Perubahan DOM setelah pemanggilan tidak otomatis memperbarui daftar tersebut.',
          ),
          fill(
            'legendary-web-listener',
            'Event',
            'Lengkapi: tombol.__( "click", () => simpan() );',
            ['addEventListener'],
            'addEventListener memasang handler tanpa menimpa handler lain pada elemen yang sama.',
          ),
          mc(
            'legendary-web-prevent',
            'Event',
            'Apa efek event.preventDefault() pada handler submit form?',
            [
              'Membatalkan perilaku bawaan form, yaitu memuat ulang halaman',
              'Menghentikan semua event listener lain',
              'Menghapus seluruh isi form',
              'Mengirim form ke server',
            ],
            0,
            'preventDefault membatalkan aksi bawaan browser. stopPropagation berbeda: ia menghentikan perambatan event.',
          ),
        ],
        9,
        'legendary',
      ),
    ),
  },

  'basis-data': {
    practice: nodeLesson(
      'practice',
      lesson(
        'latihan-sql-dasar',
        'Latihan SQL Dasar',
        'Latihan perintah SQL yang menjadi dasar pengambilan data.',
        [
          mc(
            'practice-db-select',
            'SQL',
            'Perintah SQL untuk mengambil data dari tabel adalah…',
            ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
            0,
            'SELECT membaca data. INSERT menambah, UPDATE mengubah, dan DELETE menghapus.',
          ),
          mc(
            'practice-db-where',
            'SQL',
            'Klausa yang memfilter baris berdasarkan kondisi adalah…',
            ['WHERE', 'ORDER BY', 'GROUP BY', 'LIMIT'],
            0,
            'WHERE menentukan baris yang lolos. ORDER BY mengurutkan, GROUP BY mengelompokkan, dan LIMIT membatasi jumlah hasil.',
            'Klausa ini muncul sebelum ORDER BY.',
          ),
          fill(
            'practice-db-filter',
            'SQL',
            'Lengkapi: SELECT nama FROM siswa __ nilai > 80;',
            ['where'],
            'WHERE memfilter baris sehingga hanya siswa dengan nilai di atas 80 yang dikembalikan.',
          ),
        ],
        6,
        'practice',
      ),
    ),
    checkpoint: nodeLesson(
      'checkpoint',
      lesson(
        'checkpoint-kunci-dan-query',
        'Checkpoint Kunci & Query',
        'Pastikan pemahaman primary key, foreign key, dan pengurutan query.',
        [
          mc(
            'checkpoint-db-pk',
            'Primary Key',
            'Fungsi utama primary key adalah…',
            [
              'Menjadi identitas unik setiap baris',
              'Mengurutkan data secara otomatis',
              'Menyimpan password',
              'Menghapus data duplikat',
            ],
            0,
            'Primary key menjamin setiap baris dapat dibedakan dan tidak boleh duplikat atau null.',
          ),
          mc(
            'checkpoint-db-fk',
            'Foreign Key',
            'Foreign key berfungsi untuk…',
            [
              'Menghubungkan baris ke primary key tabel lain',
              'Menjadi identitas utama tabel sendiri',
              'Menyimpan data biner',
              'Mengunci seluruh tabel',
            ],
            0,
            'Foreign key menjaga integritas relasi: nilainya harus merujuk ke baris yang ada di tabel tujuan.',
          ),
          fill(
            'checkpoint-db-order',
            'SQL',
            'Lengkapi: SELECT * FROM siswa __ nama; agar hasil terurut menaik berdasarkan nama.',
            ['order by'],
            'ORDER BY nama mengurutkan menaik secara default; tambahkan DESC untuk menurun.',
          ),
        ],
        8,
        'review',
      ),
    ),
    legendary: nodeLesson(
      'legendary',
      lesson(
        'legendary-relasi-sql',
        'Legendary Relasi & SQL',
        'Tantangan lanjutan tentang JOIN, normalisasi, dan integritas data.',
        [
          mc(
            'legendary-db-inner',
            'JOIN',
            'INNER JOIN mengembalikan…',
            [
              'Baris yang memiliki pasangan di kedua tabel',
              'Semua baris tabel kiri saja',
              'Semua baris tabel kanan saja',
              'Semua baris tanpa syarat',
            ],
            0,
            'INNER JOIN hanya mempertahankan baris yang cocok di kedua sisi. LEFT JOIN mempertahankan seluruh tabel kiri.',
          ),
          mc(
            'legendary-db-2nf',
            'Normalisasi',
            'Bentuk normal kedua (2NF) terutama menghilangkan…',
            [
              'Ketergantungan parsial pada kunci komposit',
              'Seluruh foreign key',
              'Kolom bertipe teks',
              'Index pada tabel',
            ],
            0,
            '2NF mensyaratkan 1NF terpenuhi dan setiap atribut non-kunci bergantung penuh pada seluruh kunci komposit.',
          ),
          fill(
            'legendary-db-join',
            'SQL',
            'Lengkapi: SELECT * FROM siswa __ kelas ON siswa.kelas_id = kelas.id;',
            ['join'],
            'JOIN menggabungkan tabel berdasarkan kondisi relasi pada klausa ON.',
          ),
        ],
        9,
        'legendary',
      ),
    ),
  },

  'ppb-flutter-dart': {
    practice: nodeLesson(
      'practice',
      lesson(
        'latihan-widget-dasar',
        'Latihan Widget Dasar',
        'Latihan menyusun widget teks, kolom, dan jarak.',
        [
          mc(
            'practice-ppb-text',
            'Widget',
            'Widget Flutter untuk menampilkan teks adalah…',
            ['Text', 'Label', 'Span', 'Paragraph'],
            0,
            'Text menampilkan rangkaian karakter. Gaya diatur lewat parameter style.',
          ),
          mc(
            'practice-ppb-column',
            'Layout',
            'Widget yang menyusun anak secara vertikal adalah…',
            ['Column', 'Row', 'Stack', 'Container'],
            0,
            'Column menyusun anak dari atas ke bawah. Row menyusun dari kiri ke kanan.',
          ),
          fill(
            'practice-ppb-padding',
            'Layout',
            'Lengkapi: __( padding: EdgeInsets.all(16), child: Text("Halo") )',
            ['Padding'],
            'Padding membungkus anak dan menambahkan ruang di sekelilingnya.',
          ),
        ],
        6,
        'practice',
      ),
    ),
    checkpoint: nodeLesson(
      'checkpoint',
      lesson(
        'checkpoint-widget-flutter',
        'Checkpoint Widget Flutter',
        'Periksa pemahaman state dan method inti widget.',
        [
          mc(
            'checkpoint-ppb-stateful',
            'State',
            'Widget yang memiliki state dan dapat berubah saat runtime adalah…',
            ['StatefulWidget', 'StatelessWidget', 'InheritedWidget', 'PreferredSizeWidget'],
            0,
            'StatefulWidget memiliki objek State yang dapat memicu rebuild lewat setState.',
          ),
          mc(
            'checkpoint-ppb-build',
            'State',
            'Method yang wajib diimplementasikan pada kelas State adalah…',
            ['build', 'initState', 'dispose', 'setState'],
            0,
            'build mengembalikan widget yang akan dirender. Method lain opsional sesuai kebutuhan siklus hidup.',
          ),
          mc(
            'checkpoint-ppb-image',
            'Widget',
            'Constructor Image untuk menampilkan gambar dari aset aplikasi adalah…',
            ['Image.asset', 'Image.network', 'Image.file', 'Image.memory'],
            0,
            'Image.asset membaca gambar yang didaftarkan di pubspec.yaml. Image.network mengambil gambar dari URL.',
          ),
        ],
        8,
        'review',
      ),
    ),
    legendary: nodeLesson(
      'legendary',
      lesson(
        'legendary-state-navigasi',
        'Legendary State & Navigasi',
        'Tantangan lanjutan tentang rebuild, state, dan perpindahan halaman.',
        [
          mc(
            'legendary-ppb-setstate',
            'State',
            'Memanggil setState di dalam State akan…',
            [
              'Menjadwalkan rebuild widget tersebut',
              'Langsung mengganti halaman',
              'Menghapus state sebelumnya',
              'Menghentikan aplikasi',
            ],
            0,
            'setState memberi tahu framework bahwa state berubah sehingga build dijalankan ulang.',
          ),
          mc(
            'legendary-ppb-navigator',
            'Navigasi',
            'Cara membuka halaman baru di Flutter adalah…',
            [
              'Navigator.push dengan MaterialPageRoute',
              'Navigator.pop dengan MaterialPageRoute',
              'setState dengan MaterialPageRoute',
              'build dengan MaterialPageRoute',
            ],
            0,
            'Navigator.push menambahkan route baru ke tumpukan. Navigator.pop kembali ke route sebelumnya.',
          ),
          fill(
            'legendary-ppb-push',
            'Navigasi',
            'Lengkapi: Navigator.__(context, MaterialPageRoute(builder: (_) => HalamanBaru()));',
            ['push'],
            'push menempatkan halaman baru di atas halaman saat ini.',
          ),
        ],
        9,
        'legendary',
      ),
    ),
  },

  'bahasa-inggris': {
    practice: nodeLesson(
      'practice',
      lesson(
        'latihan-simple-present',
        'Latihan Simple Present',
        'Latihan membentuk kalimat simple present untuk rutinitas.',
        [
          mc(
            'practice-eng-goes',
            'Simple Present',
            'She ___ to school every day.',
            ['goes', 'go', 'going', 'gone'],
            0,
            'Subjek she memakai bentuk goes pada simple present. Go dipakai untuk I, you, we, dan they.',
          ),
          mc(
            'practice-eng-dont',
            'Simple Present',
            "They ___ like coffee.",
            ["don't", "doesn't", "isn't", 'not'],
            0,
            "They memakai don't. Doesn't hanya untuk he, she, dan it.",
          ),
          fill(
            'practice-eng-plays',
            'Simple Present',
            'My brother __ (play) football on Sundays.',
            ['plays'],
            'My brother setara dengan he, sehingga kata kerja mendapat akhiran -s: plays.',
          ),
        ],
        6,
        'practice',
      ),
    ),
    checkpoint: nodeLesson(
      'checkpoint',
      lesson(
        'checkpoint-simple-present',
        'Checkpoint Simple Present',
        'Pastikan aturan kata kerja dan pertanyaan simple present.',
        [
          mc(
            'checkpoint-eng-third',
            'Grammar',
            'Pada simple present, kata kerja untuk he/she/it…',
            [
              'Mendapat akhiran -s atau -es',
              'Selalu memakai -ing',
              'Tidak berubah',
              'Selalu didahului to',
            ],
            0,
            'He, she, dan it memakai bentuk kata kerja dengan -s/-es, misalnya works dan watches.',
          ),
          mc(
            'checkpoint-eng-do',
            'Grammar',
            '___ you speak English?',
            ['Do', 'Does', 'Are', 'Is'],
            0,
            'Pertanyaan simple present untuk you memakai Do. Does dipakai untuk he/she/it.',
          ),
          typing(
            'checkpoint-eng-watches',
            'Grammar',
            'Write the correct present form of "watch" for he/she/it.',
            ['watches'],
            'Kata kerja berakhiran -ch mendapat -es: watch menjadi watches.',
          ),
        ],
        8,
        'review',
      ),
    ),
    legendary: nodeLesson(
      'legendary',
      lesson(
        'legendary-past-tense',
        'Legendary Past Tense',
        'Tantangan lanjutan tentang kalimat lampau dan kata kerja bantu.',
        [
          mc(
            'legendary-eng-watched',
            'Past Tense',
            'Yesterday I ___ a movie.',
            ['watched', 'watch', 'watching', 'watches'],
            0,
            'Penanda waktu yesterday menuntut simple past: watched.',
          ),
          mc(
            'legendary-eng-didnt',
            'Past Tense',
            "She didn't ___ to the party.",
            ['go', 'goes', 'went', 'gone'],
            0,
            "Setelah didn't, kata kerja kembali ke bentuk dasar (go), bukan bentuk lampau.",
          ),
          fill(
            'legendary-eng-visited',
            'Past Tense',
            'They __ (visit) the museum last week.',
            ['visited'],
            'Last week menunjukkan simple past. Visit adalah kata kerja beraturan, sehingga menjadi visited.',
          ),
        ],
        9,
        'legendary',
      ),
    ),
  },

  'bahasa-indonesia': {
    practice: nodeLesson(
      'practice',
      lesson(
        'latihan-kalimat-efektif',
        'Latihan Kalimat Efektif',
        'Latihan menghilangkan pemborosan dan memilih bentuk baku.',
        [
          mc(
            'practice-id-para',
            'Kalimat Efektif',
            'Pilih kalimat efektif yang benar.',
            [
              'Para siswa mengikuti upacara.',
              'Para siswa-siswa mengikuti upacara.',
              'Para siswa-siswa semuanya mengikuti upacara.',
              'Semua para siswa-siswa mengikuti upacara.',
            ],
            0,
            'Kata para sudah bermakna jamak, sehingga tidak perlu diulang dengan siswa-siswa atau semuanya.',
          ),
          mc(
            'practice-id-baku',
            'Kata Baku',
            'Bentuk baku yang sesuai KBBI adalah…',
            ['praktik', 'praktek', 'praktiek', 'prakteq'],
            0,
            'Kata baku menurut KBBI adalah praktik, bukan praktek.',
          ),
          fill(
            'practice-id-analisis',
            'Kata Baku',
            "Bentuk baku dari kata 'analisa' adalah __.",
            ['analisis'],
            'KBBI mencatat analisis sebagai bentuk baku; analisa adalah bentuk tidak baku.',
          ),
        ],
        6,
        'practice',
      ),
    ),
    checkpoint: nodeLesson(
      'checkpoint',
      lesson(
        'checkpoint-ejaan-kalimat',
        'Checkpoint Ejaan & Kalimat',
        'Periksa unsur kalimat dan penulisan kata depan.',
        [
          mc(
            'checkpoint-id-unsur',
            'Struktur Kalimat',
            'Kalimat minimal memiliki…',
            ['subjek dan predikat', 'subjek dan objek', 'predikat dan keterangan', 'objek dan pelengkap'],
            0,
            'Subjek dan predikat adalah unsur minimal sebuah kalimat. Objek dan keterangan bersifat tambahan.',
          ),
          mc(
            'checkpoint-id-di',
            'Ejaan',
            'Penulisan "di" sebagai kata depan yang benar adalah…',
            ['di rumah', 'dirumah', 'di-rumah', 'dirumah-'],
            0,
            'Sebagai kata depan penunjuk tempat, di ditulis terpisah: di rumah. Sebagai awalan, ditulis serangkai: ditulis.',
          ),
          typing(
            'checkpoint-id-zaman',
            'Kata Baku',
            "Tulis bentuk baku dari kata 'jaman'.",
            ['zaman'],
            'Bentuk baku menurut KBBI adalah zaman, bukan jaman.',
          ),
        ],
        8,
        'review',
      ),
    ),
    legendary: nodeLesson(
      'legendary',
      lesson(
        'legendary-jenis-teks',
        'Legendary Jenis Teks',
        'Tantangan lanjutan membedakan tujuan dan struktur teks.',
        [
          mc(
            'legendary-id-argumentasi',
            'Teks Argumentasi',
            'Tujuan utama teks argumentasi adalah…',
            [
              'Meyakinkan pembaca dengan alasan dan bukti',
              'Menghibur pembaca dengan cerita',
              'Menjelaskan langkah membuat sesuatu',
              'Mendeskripsikan ciri fisik objek',
            ],
            0,
            'Teks argumentasi memuat pendapat yang didukung alasan dan bukti agar pembaca meyakini sudut pandang penulis.',
          ),
          mc(
            'legendary-id-prosedur',
            'Teks Prosedur',
            'Struktur teks prosedur yang tepat adalah…',
            [
              'Tujuan, alat dan bahan, langkah-langkah',
              'Orientasi, komplikasi, resolusi',
              'Tesis, argumen, penegasan ulang',
              'Identifikasi, deskripsi bagian, penutup',
            ],
            0,
            'Teks prosedur memandu pembaca melakukan sesuatu melalui tujuan, alat/bahan, dan langkah berurutan.',
          ),
          fill(
            'legendary-id-eksposisi',
            'Teks Eksposisi',
            'Teks yang menjelaskan gagasan atau proses secara informatif disebut teks __.',
            ['eksposisi'],
            'Teks eksposisi memaparkan informasi dan gagasan tanpa bertujuan memengaruhi pembaca seperti argumentasi.',
          ),
        ],
        9,
        'legendary',
      ),
    ),
  },

  'pendidikan-pancasila': {
    practice: nodeLesson(
      'practice',
      lesson(
        'latihan-norma-dan-hak',
        'Latihan Norma & Hak',
        'Latihan membedakan jenis norma dan contoh hak warga negara.',
        [
          mc(
            'practice-ppk-kesusilaan',
            'Norma',
            'Norma yang bersumber dari hati nurani manusia adalah norma…',
            ['kesusilaan', 'hukum', 'agama', 'kesopanan'],
            0,
            'Norma kesusilaan tumbuh dari hati nurani. Norma hukum bersumber dari negara, norma agama dari ajaran agama.',
          ),
          mc(
            'practice-ppk-hak',
            'Hak',
            'Contoh hak warga negara adalah…',
            [
              'Memperoleh pendidikan',
              'Membayar pajak',
              'Menaati hukum',
              'Menjaga ketertiban',
            ],
            0,
            'Pendidikan adalah hak. Membayar pajak, menaati hukum, dan menjaga ketertiban adalah kewajiban.',
          ),
          fill(
            'practice-ppk-hukum',
            'Norma',
            'Norma yang memiliki sanksi tegas dan tertulis dari negara adalah norma __.',
            ['hukum'],
            'Norma hukum bersifat mengikat dan sanksinya ditegakkan oleh negara.',
          ),
        ],
        6,
        'practice',
      ),
    ),
    checkpoint: nodeLesson(
      'checkpoint',
      lesson(
        'checkpoint-pancasila',
        'Checkpoint Pancasila',
        'Periksa pemahaman dasar negara dan lambang sila.',
        [
          mc(
            'checkpoint-ppk-dasar',
            'Pancasila',
            'Kedudukan Pancasila bagi Indonesia adalah…',
            ['dasar negara dan pandangan hidup', 'lagu kebangsaan', 'nama lembaga negara', 'bahasa resmi'],
            0,
            'Pancasila adalah dasar negara sekaligus pandangan hidup bangsa Indonesia.',
          ),
          mc(
            'checkpoint-ppk-sila3',
            'Pancasila',
            'Lambang sila ketiga Pancasila adalah…',
            ['pohon beringin', 'padi dan kapas', 'kepala banteng', 'rantai'],
            0,
            'Sila ketiga "Persatuan Indonesia" dilambangkan pohon beringin. Padi dan kapas melambangkan sila kelima.',
          ),
          typing(
            'checkpoint-ppk-sila2',
            'Pancasila',
            'Tulis bunyi sila kedua Pancasila.',
            ['Kemanusiaan yang adil dan beradab'],
            'Sila kedua berbunyi "Kemanusiaan yang adil dan beradab" dan dilambangkan rantai.',
          ),
        ],
        8,
        'review',
      ),
    ),
    legendary: nodeLesson(
      'legendary',
      lesson(
        'legendary-warga-negara',
        'Legendary Warga Negara',
        'Tantangan lanjutan tentang demokrasi, kewajiban, dan konstitusi.',
        [
          mc(
            'legendary-ppk-demokrasi',
            'Demokrasi',
            'Pengambilan keputusan dalam demokrasi Pancasila mengutamakan…',
            [
              'Musyawarah untuk mencapai mufakat',
              'Keputusan satu orang',
              'Kekuatan mayoritas tanpa diskusi',
              'Keputusan pihak asing',
            ],
            0,
            'Demokrasi Pancasila menempatkan musyawarah untuk mufakat sebagai jalan utama; pemungutan suara menjadi alternatif terakhir.',
          ),
          mc(
            'legendary-ppk-kewajiban',
            'Kewajiban',
            'Berikut yang termasuk kewajiban warga negara adalah…',
            [
              'Menaati hukum dan membayar pajak',
              'Memilih pemimpin favorit saja',
              'Menolak semua aturan',
              'Menuntut hak tanpa kewajiban',
            ],
            0,
            'Menaati hukum dan membayar pajak adalah kewajiban konstitusional warga negara.',
          ),
          fill(
            'legendary-ppk-mk',
            'Konstitusi',
            'Lembaga yang berwenang menguji undang-undang terhadap UUD 1945 adalah Mahkamah __.',
            ['Konstitusi'],
            'Mahkamah Konstitusi menguji undang-undang terhadap UUD 1945, sedangkan Mahkamah Agung menguji peraturan di bawah undang-undang.',
          ),
        ],
        9,
        'legendary',
      ),
    ),
  },

  matematika: {
    practice: nodeLesson(
      'practice',
      lesson(
        'latihan-pecahan-persen',
        'Latihan Pecahan & Persen',
        'Latihan mengubah pecahan, persen, dan desimal.',
        [
          mc(
            'practice-math-suma',
            'Pecahan',
            'Hasil dari 1/2 + 1/4 adalah…',
            ['3/4', '2/6', '1/6', '2/4'],
            0,
            'Samakan penyebut menjadi 4: 1/2 = 2/4, lalu 2/4 + 1/4 = 3/4.',
            'Penyebut terkecil yang sama adalah 4.',
          ),
          mc(
            'practice-math-persen',
            'Persen',
            '25% dari 80 adalah…',
            ['20', '15', '25', '32'],
            0,
            '25% = 1/4, sehingga 80 : 4 = 20.',
          ),
          fill(
            'practice-math-desimal',
            'Desimal',
            'Ubah 0,6 menjadi persen: __%',
            ['60'],
            'Kalikan desimal dengan 100: 0,6 × 100 = 60%.',
          ),
        ],
        6,
        'practice',
      ),
    ),
    checkpoint: nodeLesson(
      'checkpoint',
      lesson(
        'checkpoint-pecahan-persen',
        'Checkpoint Pecahan & Persen',
        'Pastikan kemampuan membandingkan dan menghitung persen.',
        [
          mc(
            'checkpoint-math-desimal',
            'Pecahan',
            'Bentuk desimal dari 3/5 adalah…',
            ['0,6', '0,35', '0,53', '1,6'],
            0,
            '3 : 5 = 0,6. Pembilang dibagi penyebut menghasilkan desimal.',
          ),
          mc(
            'checkpoint-math-banding',
            'Perbandingan',
            'Perbandingan yang benar antara 2/3 dan 3/5 adalah…',
            ['2/3 > 3/5', '2/3 < 3/5', '2/3 = 3/5', 'Tidak dapat dibandingkan'],
            0,
            '2/3 ≈ 0,667 dan 3/5 = 0,6, sehingga 2/3 lebih besar.',
          ),
          typing(
            'checkpoint-math-persen',
            'Persen',
            'Hitung 15% dari 200.',
            ['30'],
            '15% = 0,15; 0,15 × 200 = 30.',
          ),
        ],
        8,
        'review',
      ),
    ),
    legendary: nodeLesson(
      'legendary',
      lesson(
        'legendary-aljabar',
        'Legendary Aljabar',
        'Tantangan lanjutan menyelesaikan persamaan dan substitusi.',
        [
          mc(
            'legendary-math-linear',
            'Persamaan',
            'Jika 2x + 6 = 18, nilai x adalah…',
            ['6', '12', '24', '3'],
            0,
            'Kurangi 6 dari kedua sisi: 2x = 12, lalu bagi 2: x = 6.',
          ),
          mc(
            'legendary-math-distribusi',
            'Aljabar',
            'Bentuk sederhana dari 3(x + 2) adalah…',
            ['3x + 6', '3x + 2', 'x + 6', '3x + 5'],
            0,
            'Kalikan 3 dengan setiap suku di dalam kurung: 3x + 6.',
          ),
          fill(
            'legendary-math-substitusi',
            'Substitusi',
            'Jika x = 4, nilai 2x + 5 adalah __.',
            ['13'],
            'Substitusi x = 4: 2(4) + 5 = 8 + 5 = 13.',
          ),
        ],
        9,
        'legendary',
      ),
    ),
  },
};

export function applyStageThreeNodes(subjects: SeedSubject[]): void {
  for (const subject of subjects) {
    const pack = PACKS[subject.slug];
    if (!pack) continue;

    const elementary = subject.levels.find((level) => level.slug === 'elementary');
    const intermediate = subject.levels.find((level) => level.slug === 'intermediate');

    if (!elementary || !intermediate) {
      throw new Error(`Stage 3 nodes need elementary and intermediate levels: ${subject.slug}`);
    }

    elementary.units[0]!.lessons.push(pack.practice, pack.checkpoint);
    intermediate.units[0]!.lessons.push(pack.legendary);
  }
}
