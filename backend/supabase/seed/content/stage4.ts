import { conversation, fill, listening, matching, speaking, story, translation } from './helpers';
import type { SeedQuestion, SeedSubject } from './types';

/**
 * Stage 4 content for the dialogue-driven and production mini-games. English
 * content opts into en-US; Indonesian content opts into id-ID so listening,
 * speaking, and recognition use the right locale. None of the scene data
 * contains a graded answer.
 */
const ADDITIONS: Array<{ subject: string; lesson: string; questions: SeedQuestion[] }> = [
  {
    subject: 'bahasa-inggris',
    lesson: 'greetings-vocabulary',
    questions: [
      listening(
        'en-listening-classroom',
        'Listening',
        'Apa instruksi yang kamu dengar?',
        'Please open your book to page ten.',
        [
          'Tolong buka bukumu ke halaman sepuluh.',
          'Tolong tutup bukumu dan dengarkan.',
          'Tolong tulis namamu di papan tulis.',
          'Tolong baca halaman dua puluh.',
        ],
        0,
        'Instruksi yang diucapkan adalah "Please open your book to page ten", yaitu membuka buku ke halaman sepuluh.',
        'Perhatikan kata "open" dan angka "ten".',
        'en-US',
      ),
      listening(
        'en-listening-greeting',
        'Listening',
        'Sapaan apa yang kamu dengar?',
        'Good morning, how are you today?',
        [
          'Selamat pagi, apa kabar hari ini?',
          'Selamat malam, sampai jumpa besok.',
          'Selamat siang, terima kasih banyak.',
          'Selamat pagi, siapa namamu?',
        ],
        0,
        'Kalimat "Good morning, how are you today?" berarti selamat pagi, apa kabar hari ini.',
        'Fokus pada "Good morning" dan "how are you".',
        'en-US',
      ),
      speaking(
        'en-speaking-greeting',
        'Speaking',
        'Ucapkan sapaan: "Good morning, how are you?"',
        'Good morning, how are you?',
        ['good morning how are you', 'good morning, how are you?'],
        'Sapaan yang benar adalah "Good morning, how are you?". Penilaian memeriksa apakah ucapan dikenali, bukan memberi skor pengucapan buatan.',
        'Ucapkan dengan jelas dan perlahan.',
        'en-US',
      ),
      translation(
        'en-translation-library',
        'Translation',
        'Terjemahkan ke bahasa Inggris: "Saya membaca buku di perpustakaan."',
        ['I', 'read', 'a', 'book', 'in', 'the', 'library', 'reads'],
        ['I read a book in the library'],
        'Kalimat "Saya membaca buku di perpustakaan" menjadi "I read a book in the library". Kata "reads" adalah pengecoh karena subjeknya "I".',
        'Gunakan bentuk dasar "read" untuk subjek "I".',
      ),
      conversation(
        'en-conversation-teacher',
        'Conversation',
        'Kamu bertemu gurumu di pagi hari. Pilih respons yang paling sopan.',
        { name: 'Bu Rani', role: 'Guru bahasa Inggris' },
        [{ speaker: 'Bu Rani', line: 'Good morning, students. How are you today?' }],
        [
          'Good morning, Ma\'am. We are fine, thank you.',
          'Good night, Ma\'am. See you tomorrow.',
          'I am a student in this class.',
          'How are you, book?',
        ],
        0,
        'Respons sopan membalas sapaan pagi dan menjawab pertanyaan kabar: "Good morning, Ma\'am. We are fine, thank you."',
        'Balas sapaan terlebih dahulu, lalu jawab pertanyaan kabarnya.',
        [
          'Bu Rani smiles. "I am fine too, thank you. Please sit down."',
          'Bu Rani frowns. "It is still morning, not night."',
          'Bu Rani waits. "I asked how you are, not who you are."',
          'Bu Rani looks puzzled. "A book cannot answer me."',
        ],
        'en-US',
      ),
      story(
        'en-story-kiko-garden',
        'Reading',
        'Mengapa Kiko membawa lentera ke taman?',
        [
          {
            narration:
              'Setiap sore Kiko menyiram tanaman di taman sekolah. Hari itu langit mendung dan lampu taman mati.',
          },
          {
            speaker: 'Kiko',
            line: 'Taman ini terlalu gelap. Teman-teman tidak bisa membaca nama tanaman.',
            choices: [
              {
                label: 'Bantu Kiko mencari lampu',
                reply:
                  'Kamu menyalakan lampu taman bersama Kiko. Taman kembali terang dan nama tanaman bisa dibaca.',
              },
              {
                label: 'Tunggu sampai besok',
                reply: 'Kiko menghela napas. "Besok taman akan lebih gelap lagi."',
              },
            ],
          },
          {
            narration:
              'Kiko mengambil lentera kecil dari kelas, lalu menggantungnya di pagar taman. Taman kembali terang.',
          },
        ],
        [
          'Karena lampu taman mati dan taman menjadi gelap.',
          'Karena Kiko ingin menjual lentera itu.',
          'Karena taman sekolah akan ditutup.',
          'Karena Kiko lupa membawa buku.',
        ],
        0,
        'Cerita menyebut langit mendung dan lampu taman mati, sehingga Kiko membawa lentera agar taman terang kembali.',
        'Perhatikan alasan yang Kiko ucapkan sendiri.',
        'id-ID',
      ),
      matching(
        'en-matching-school',
        'Vocabulary',
        'Cocokkan benda dan tempat di sekolah dengan artinya.',
        [
          { left: 'pencil', right: 'pensil' },
          { left: 'teacher', right: 'guru' },
          { left: 'classroom', right: 'ruang kelas' },
          { left: 'homework', right: 'pekerjaan rumah' },
          { left: 'library', right: 'perpustakaan' },
          { left: 'chair', right: 'kursi' },
        ],
        'pencil = pensil, teacher = guru, classroom = ruang kelas, homework = pekerjaan rumah, library = perpustakaan, chair = kursi.',
        'Ingat kosakata yang sering muncul di sekolah.',
      ),
      matching(
        'en-matching-verbs',
        'Vocabulary',
        'Cocokkan kata kerja bahasa Inggris dengan artinya.',
        [
          { left: 'read', right: 'membaca' },
          { left: 'write', right: 'menulis' },
          { left: 'listen', right: 'mendengarkan' },
          { left: 'speak', right: 'berbicara' },
          { left: 'study', right: 'belajar' },
        ],
        'read = membaca, write = menulis, listen = mendengarkan, speak = berbicara, study = belajar.',
        'Kata kerja dasar yang sering dipakai di kelas.',
      ),
    ],
  },
  {
    subject: 'bahasa-indonesia',
    lesson: 'ejaan-dasar',
    questions: [
      listening(
        'id-listening-ejaan',
        'Listening',
        'Apa instruksi yang kamu dengar?',
        'Bacalah buku itu dengan saksama.',
        [
          'Membaca buku dengan saksama',
          'Menutup buku dan keluar kelas',
          'Menulis judul buku di papan tulis',
          'Mengembalikan buku ke lemari',
        ],
        0,
        'Instruksi "Bacalah buku itu dengan saksama" meminta kita membaca buku dengan teliti.',
        'Perhatikan kata "bacalah" dan "saksama".',
        'id-ID',
      ),
      speaking(
        'id-speaking-perpustakaan',
        'Speaking',
        'Ucapkan kalimat: "Saya membaca buku di perpustakaan."',
        'Saya membaca buku di perpustakaan.',
        ['saya membaca buku di perpustakaan', 'saya membaca buku di perpustakaan.'],
        'Kalimat yang benar adalah "Saya membaca buku di perpustakaan". Penilaian memeriksa apakah ucapan dikenali, bukan memberi skor pengucapan buatan.',
        'Ucapkan setiap kata dengan jelas.',
        'id-ID',
      ),
      fill(
        'id-fill-dua-rumpang',
        'Kalimat',
        'Ani __ buku di perpustakaan dan __ catatan di rumah.',
        ['membaca menulis'],
        'Kata kerja yang tepat adalah membaca untuk buku dan menulis untuk catatan. Kedua rumpang diisi sesuai kegiatan yang dilakukan.',
        'Gunakan kata kerja yang sesuai dengan objeknya.',
      ),
      conversation(
        'id-conversation-guru',
        'Conversation',
        'Bu Sari menanyakan tugas membaca. Pilih respons yang paling tepat.',
        { name: 'Bu Sari', role: 'Guru bahasa Indonesia' },
        [
          {
            speaker: 'Bu Sari',
            line: 'Selamat pagi. Apakah kamu sudah membaca teks tentang ejaan?',
          },
        ],
        [
          'Sudah, Bu. Saya sudah membaca dan mencatat kata bakunya.',
          'Belum, Bu. Saya tidak membawa buku.',
          'Selamat malam, Bu. Sampai jumpa.',
          'Teks itu sangat panjang.',
        ],
        0,
        'Respons yang tepat menjawab pertanyaan guru dengan jujur dan menyebut kegiatan membaca serta mencatat kata baku.',
        'Jawab pertanyaan "apakah sudah membaca" terlebih dahulu.',
        [
          'Bu Sari tersenyum. "Bagus. Sekarang jelaskan satu kata baku yang kamu temukan."',
          'Bu Sari mengangguk. "Baik, baca sekarang, lalu kita bahas bersama."',
          'Bu Sari mengingatkan. "Ini masih pagi, bukan malam."',
          'Bu Sari menanggapi. "Panjang bukan alasan untuk tidak membaca."',
        ],
        'id-ID',
      ),
      story(
        'id-story-kalimat-efektif',
        'Reading',
        'Mengapa Rani menulis ulang kalimatnya?',
        [
          {
            narration:
              'Rani menulis kalimat "para siswa-siswa berkumpul di lapangan" di papan tulis.',
          },
          {
            speaker: 'Rani',
            line: 'Guruku bilang kata "para" sudah menunjukkan banyak. Kenapa kalimatku masih terasa berlebihan?',
            choices: [
              {
                label: 'Hapus salah satu penanda jamak',
                reply:
                  'Rani menghapus bentuk ulang "siswa-siswa". Kalimatnya menjadi "Para siswa berkumpul di lapangan."',
              },
              {
                label: 'Tambahkan kata "sangat"',
                reply: 'Rani menambahkan "sangat", tetapi kalimatnya justru makin berlebihan.',
              },
              {
                label: 'Ubah menjadi kalimat tanya',
                reply: 'Rani mengubahnya menjadi pertanyaan, padahal maksudnya memberi informasi.',
              },
            ],
          },
          {
            narration:
              'Rani menulis ulang kalimat menjadi "Para siswa berkumpul di lapangan." Kalimat itu ringkas dan tidak mengulang makna jamak.',
          },
        ],
        [
          'Karena kata "para" dan "siswa-siswa" sama-sama menyatakan jamak.',
          'Karena kalimatnya terlalu pendek.',
          'Karena Rani ingin membuat puisi.',
          'Karena guru meminta semua kalimat dihapus.',
        ],
        0,
        'Kata "para" dan bentuk ulang "siswa-siswa" sama-sama menandai jamak, sehingga salah satunya harus dihilangkan agar kalimat efektif.',
        'Perhatikan dua penanda jamak dalam kalimat Rani.',
        'id-ID',
      ),
      matching(
        'id-matching-ejaan',
        'Ejaan',
        'Cocokkan istilah dengan keterangannya.',
        [
          { left: 'praktik', right: 'bentuk baku' },
          { left: 'praktek', right: 'bentuk tidak baku' },
          { left: 'karena', right: 'konjungsi sebab' },
          { left: 'titik', right: 'akhir kalimat berita' },
        ],
        'Praktik adalah bentuk baku, praktek tidak baku, karena menandai sebab, dan titik mengakhiri kalimat berita.',
        'Gunakan KBBI sebagai acuan bentuk baku.',
      ),
    ],
  },
];

export function applyStageFourQuestions(subjects: SeedSubject[]): void {
  for (const addition of ADDITIONS) {
    const subject = subjects.find((item) => item.slug === addition.subject);
    const target = subject?.levels
      .flatMap((level) => level.units)
      .flatMap((unit) => unit.lessons)
      .find((lessonItem) => lessonItem.slug === addition.lesson);

    if (!target) {
      throw new Error(`Stage 4 lesson not found: ${addition.subject}/${addition.lesson}`);
    }

    target.questions.push(...addition.questions);
  }
}
