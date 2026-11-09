import { conversation, listening, matching, speaking, story, translation } from './helpers';
import type { SeedQuestion, SeedSubject } from './types';

/**
 * Stage 4 content for the dialogue-driven and production mini-games. It lives in
 * the English beginner unit so the mechanics can be played end to end, and the
 * stored scenes keep the transcript that browser text-to-speech reads aloud.
 * None of the scene data contains a graded answer.
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
      ),
      speaking(
        'en-speaking-greeting',
        'Speaking',
        'Ucapkan sapaan: "Good morning, how are you?"',
        'Good morning, how are you?',
        ['good morning how are you', 'good morning, how are you?'],
        'Sapaan yang benar adalah "Good morning, how are you?". Penilaian memeriksa apakah ucapan dikenali, bukan memberi skor pengucapan buatan.',
        'Ucapkan dengan jelas dan perlahan.',
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
