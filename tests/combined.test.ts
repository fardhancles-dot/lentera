import { describe, expect, it } from 'vitest';
import {
  countPromptBlanks,
  describeMechanics,
  parseCombinedConfig,
} from '../src/utils/combinedQuestion';

describe('parseCombinedConfig', () => {
  it('reads presentation elements and the answer shape', () => {
    const config = parseCombinedConfig({
      kind: 'combined',
      elements: [
        { kind: 'image' },
        { kind: 'text', text: 'Hello! I am from ______.' },
        { kind: 'story', title: 'My Day', body: 'I wake up early.' },
        {
          kind: 'conversation',
          lines: [{ speaker: 'Ani', line: 'Hi!' }, { speaker: 'Budi', line: 'Hello.' }],
        },
      ],
      answer: { mode: 'choice', grading: 'weighted', display: 'bank' },
    });

    expect(config.elements.map((element) => element.kind)).toEqual([
      'image',
      'text',
      'story',
      'conversation',
    ]);
    expect(config.answer.mode).toBe('choice');
    expect(config.answer.grading).toBe('weighted');
    expect(config.answer.display).toBe('bank');
  });

  it('defaults an empty scene to a usable choice answer', () => {
    const config = parseCombinedConfig({});

    expect(config.elements).toEqual([]);
    expect(config.answer).toEqual({
      mode: 'choice',
      grading: 'all',
      display: 'bank',
      partLabels: [],
    });
  });

  it('drops empty elements and unknown kinds instead of rendering blanks', () => {
    const config = parseCombinedConfig({
      elements: [
        { kind: 'text', text: '   ' },
        { kind: 'nonsense', text: 'abaikan' },
        { kind: 'story', body: '' },
        { kind: 'hint', text: 'Baca pelan-pelan.' },
      ],
    });

    expect(config.elements).toEqual([{ kind: 'hint', text: 'Baca pelan-pelan.' }]);
  });

  it('keeps only the supported answer modes and grading values', () => {
    const config = parseCombinedConfig({
      answer: { mode: 'essay', grading: 'partial', display: 'grid' },
    });

    expect(config.answer.mode).toBe('choice');
    expect(config.answer.grading).toBe('all');
    expect(config.answer.display).toBe('bank');
  });
});

describe('countPromptBlanks', () => {
  it('counts each __ marker as one blank', () => {
    expect(countPromptBlanks('Hello! I am from ______.')).toBe(1);
    expect(countPromptBlanks('Ani __ buku dan ___ catatan.')).toBe(2);
    expect(countPromptBlanks('Tidak ada rumpang di sini.')).toBe(0);
  });
});

describe('describeMechanics', () => {
  it('reports only the mechanisms the config really uses', () => {
    const config = parseCombinedConfig({
      elements: [{ kind: 'image' }, { kind: 'text', text: 'Hello! I am from ______.' }],
      answer: { mode: 'choice', display: 'bank' },
    });

    expect(describeMechanics(config)).toEqual([
      'picture_identification',
      'fill_blank',
      'multiple_choice',
      'word_bank',
    ]);
  });

  it('lists typing, ordering, and matching when those answers are selected', () => {
    expect(describeMechanics(parseCombinedConfig({ answer: { mode: 'text' } }))).toEqual([
      'typing',
      'fill_blank',
    ]);
    expect(describeMechanics(parseCombinedConfig({ answer: { mode: 'order' } }))).toEqual([
      'sentence_builder',
      'word_bank',
    ]);
    expect(describeMechanics(parseCombinedConfig({ answer: { mode: 'match' } }))).toEqual([
      'matching_pairs',
    ]);
  });

  it('keeps choice-only mechanics when a plain option list is used', () => {
    expect(
      describeMechanics(parseCombinedConfig({ answer: { mode: 'choice', display: 'choices' } })),
    ).toEqual(['multiple_choice']);
  });
});
