import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import type { MiniGameView } from './types';

export function createUnsupported(): MiniGameView {
  const notice = el('div', { class: 'banner banner--warning' }, [
    icon('info', 18),
    el('div', {}, [
      el('p', { class: 'banner__title', text: 'Layar mini-game belum tersedia' }),
      el('p', {
        class: 'banner__body',
        text: 'Tipe soal ini belum memiliki mekanik bermain. Gunakan tombol lewati untuk melanjutkan lesson tanpa hadiah untuk soal ini.',
      }),
    ]),
  ]);

  return {
    answer: notice,
    getAnswer: () => null,
    focus: () => undefined,
    setDisabled: () => undefined,
  };
}
