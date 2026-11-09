import { developmentSubject, lesson, stage } from '../helpers';
import type { SeedSubject } from '../types';

/**
 * Bahasa Sambas sengaja dibuka sebagai mata pelajaran aktif, tetapi bank soalnya
 * belum diisi otomatis. Pemilik konten akan mengisi soal melalui Developer
 * Dashboard pada tahap berikutnya, sehingga lesson ini tampil dengan jumlah soal 0.
 */
const sambas: SeedSubject = {
  slug: 'bahasa-sambas',
  name: 'Bahasa Sambas',
  shortName: 'Sambas',
  description:
    'Mengenal kosakata dan percakapan Bahasa Sambas. Bank soal disiapkan oleh pemilik konten.',
  category: 'bahasa-daerah',
  iconKey: 'globe',
  accentColor: '#E9A23B',
  status: 'active',
  isPrimary: false,
  sortOrder: 10,
  levels: [
    stage({
      slug: 'beginner',
      title: 'Level 1 · Kosakata Sehari-hari',
      difficulty: 'beginner',
      description: 'Kosakata dasar untuk sapaan dan percakapan sehari-hari.',
      unitSlug: 'sapaan-sambas',
      unitTitle: 'Sapaan dan Salam',
      unitDescription:
        'Unit pembuka Bahasa Sambas. Materi dan soal akan diisi oleh pemilik konten.',
      objectives: [
        'Mengenal sapaan dasar Bahasa Sambas',
        'Menggunakan kosakata sehari-hari dalam konteks sederhana',
      ],
      lesson: lesson(
        'sapaan-dasar',
        'Sapaan Dasar',
        'Kerangka lesson pertama Bahasa Sambas. Soal belum tersedia.',
        [],
        5,
      ),
    }),
  ],
};

const javanese = developmentSubject({
  slug: 'bahasa-jawa',
  name: 'Bahasa Jawa',
  shortName: 'Jawa',
  description:
    'Mata pelajaran Bahasa Jawa sedang dikembangkan oleh developer dan belum dapat dimainkan.',
  category: 'bahasa-daerah',
  iconKey: 'globe',
  accentColor: '#C7A15A',
  sortOrder: 11,
});

const sundanese = developmentSubject({
  slug: 'bahasa-sunda',
  name: 'Bahasa Sunda',
  shortName: 'Sunda',
  description:
    'Mata pelajaran Bahasa Sunda sedang dikembangkan oleh developer dan belum dapat dimainkan.',
  category: 'bahasa-daerah',
  iconKey: 'globe',
  accentColor: '#7FB069',
  sortOrder: 12,
});

export const regionalSubjects: SeedSubject[] = [sambas, javanese, sundanese];
