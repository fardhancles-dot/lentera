import { fill, matching, picture, sentenceBuilder, wordBank } from './helpers';
import type { SeedQuestion, SeedSubject } from './types';

/**
 * Playable samples for the first five mini-games. They live in the English
 * beginner lesson so a single lesson demonstrates every new mechanic while the
 * existing math/science/coding lessons keep their multiple-choice and text work.
 */
const ADDITIONS: Array<{ subject: string; lesson: string; questions: SeedQuestion[] }> = [
  {
    subject: 'bahasa-inggris',
    lesson: 'greetings-vocabulary',
    questions: [
      wordBank(
        'en-wordbank-daily-routine',
        'Word Bank',
        'Susun kalimat: "Dia pergi ke sekolah setiap hari."',
        ['She', 'goes', 'to', 'school', 'every', 'day', 'go'],
        ['She goes to school every day'],
        'Kalimat simple present untuk she memakai goes. Kata "go" adalah pengecoh yang tidak diperlukan.',
        'Pola: subjek + kata kerja + tempat + keterangan waktu.',
      ),
      sentenceBuilder(
        'en-builder-daily-routine',
        'Sentence Builder',
        'Susun kata acak menjadi kalimat yang benar.',
        ['every', 'She', 'day', 'school', 'goes', 'to'],
        ['She goes to school every day'],
        'Urutan baku kalimat adalah subjek + kata kerja + tempat + keterangan waktu.',
        'Mulai dari subjek "She".',
      ),
      fill(
        'en-fill-daily-routine',
        'Grammar',
        'She __ to school every day.',
        ['goes'],
        'Subjek "She" memakai bentuk goes pada simple present.',
        'Perhatikan akhiran kata kerja untuk subjek orang ketiga tunggal.',
      ),
      matching(
        'en-matching-vocabulary',
        'Vocabulary',
        'Cocokkan kata bahasa Inggris dengan artinya.',
        [
          { left: 'apple', right: 'apel' },
          { left: 'book', right: 'buku' },
          { left: 'house', right: 'rumah' },
          { left: 'water', right: 'air' },
        ],
        'apple = apel, book = buku, house = rumah, dan water = air.',
        'Ingat kosakata benda sehari-hari.',
      ),
      picture(
        'en-picture-book',
        'Vocabulary',
        'Gambar ini menunjukkan benda apa?',
        { url: '/assets/pictures/book.svg', alt: 'Buku hijau dalam keadaan tertutup' },
        ['book', 'globe', 'laptop', 'clock'],
        0,
        'Gambar menunjukkan buku, sehingga jawaban yang benar adalah book.',
      ),
      picture(
        'en-picture-globe',
        'Vocabulary',
        'Gambar ini menunjukkan benda apa?',
        { url: '/assets/pictures/globe.svg', alt: 'Bola dunia biru dengan daratan hijau' },
        ['book', 'globe', 'laptop', 'phone'],
        1,
        'Gambar menunjukkan globe atau bola dunia, sehingga jawabannya globe.',
      ),
      picture(
        'en-picture-laptop',
        'Vocabulary',
        'Gambar ini menunjukkan benda apa?',
        { url: '/assets/pictures/laptop.svg', alt: 'Laptop abu-abu dengan layar biru' },
        ['calculator', 'book', 'laptop', 'globe'],
        2,
        'Gambar menunjukkan laptop, sehingga jawaban yang benar adalah laptop.',
      ),
    ],
  },
];

export function applyMiniGameQuestions(subjects: SeedSubject[]): void {
  for (const addition of ADDITIONS) {
    const subject = subjects.find((item) => item.slug === addition.subject);
    const target = subject?.levels
      .flatMap((level) => level.units)
      .flatMap((unit) => unit.lessons)
      .find((lessonItem) => lessonItem.slug === addition.lesson);

    if (!target) {
      throw new Error(`Mini-game lesson not found: ${addition.subject}/${addition.lesson}`);
    }

    target.questions.push(...addition.questions);
  }
}
