import { describe, expect, it } from 'vitest';
import { parseMasteryBoard } from '../src/services/mastery.service';

describe('mastery payload parsing', () => {
  it('parses the summary and course rows', () => {
    const board = parseMasteryBoard({
      summary: {
        totalQuestions: 231,
        tracked: 12,
        mastered: 3,
        due: 2,
        accuracy: 75,
      },
      courses: [
        {
          courseId: 'course-1',
          subjectSlug: 'bahasa-inggris',
          subjectName: 'Bahasa Inggris',
          totalQuestions: 45,
          tracked: 12,
          mastered: 3,
          due: 2,
          accuracy: 75,
          masteryPercent: 7,
        },
      ],
    });

    expect(board.summary).toEqual({
      totalQuestions: 231,
      tracked: 12,
      mastered: 3,
      due: 2,
      accuracy: 75,
    });
    expect(board.courses).toHaveLength(1);
    expect(board.courses[0]?.subjectSlug).toBe('bahasa-inggris');
    expect(board.courses[0]?.masteryPercent).toBe(7);
  });

  it('clamps negative or oversized numbers to valid ranges', () => {
    const board = parseMasteryBoard({
      summary: { tracked: -4, accuracy: 180, due: 'rusak', mastered: 2.6 },
      courses: [
        {
          courseId: 'course-1',
          subjectSlug: 'matematika',
          totalQuestions: -10,
          tracked: 4,
          due: 0,
          accuracy: -20,
          masteryPercent: 900,
        },
      ],
    });

    expect(board.summary.tracked).toBe(0);
    expect(board.summary.accuracy).toBe(100);
    expect(board.summary.due).toBe(0);
    expect(board.summary.mastered).toBe(3);
    expect(board.courses[0]?.totalQuestions).toBe(0);
    expect(board.courses[0]?.accuracy).toBe(0);
    expect(board.courses[0]?.masteryPercent).toBe(100);
    expect(board.courses[0]?.subjectName).toBe('matematika');
  });

  it('drops courses without identity and survives a malformed payload', () => {
    expect(
      parseMasteryBoard({ courses: [{ subjectSlug: 'tanpa-id' }, null, 'rusak'] }).courses,
    ).toEqual([]);

    expect(parseMasteryBoard(null).summary).toEqual({
      totalQuestions: 0,
      tracked: 0,
      mastered: 0,
      due: 0,
      accuracy: 0,
    });
  });
});
