import type { PageModule } from '../app/router';
import { avatar } from '../components/avatar';
import { createField } from '../components/forms';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import {
  friendsQuestService,
  type FriendQuest,
} from '../services/friendsQuest.service';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Friends Quest' };

function statusBadge(quest: FriendQuest): HTMLElement {
  if (quest.status === 'completed') {
    return el('span', { class: 'badge', text: 'Selesai' });
  }
  if (quest.status === 'expired') {
    return el('span', { class: 'badge badge--red', text: 'Kedaluwarsa' });
  }
  return el('span', { class: 'badge badge--blue', text: 'Aktif' });
}

function copyCode(code: string): void {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(code).then(
      () => showToast(`Kode ${code} disalin.`, 'success'),
      () => showToast(`Kode quest: ${code}`),
    );
    return;
  }
  showToast(`Kode quest: ${code}`);
}

function questCard(quest: FriendQuest, onClaim: (quest: FriendQuest) => Promise<void>): HTMLElement {
  const bar = el('span', { class: 'progress__bar' });
  bar.style.width = `${quest.progressPercent}%`;

  const members = el(
    'ul',
    { class: 'friend-quest__members' },
    quest.members.map((member) =>
      el('li', { class: 'friend-quest__member' }, [
        avatar(member.avatarKey, 'sm'),
        el('span', { class: 'friend-quest__member-meta' }, [
          el('span', { class: 'friend-quest__member-name' }, [
            member.displayName,
            member.isCreator
              ? el('span', { class: 'friend-quest__owner', text: 'Pembuat' })
              : null,
          ]),
          el('span', {
            class: 'friend-quest__member-handle',
            text: `@${member.username}`,
          }),
        ]),
        el('span', {
          class: 'friend-quest__member-xp',
          text: `${formatNumber(member.contributionXp)} XP`,
        }),
      ]),
    ),
  );

  const claimButton = el('button', { class: 'btn btn--block', attrs: { type: 'button' } }, [
    icon('gift', 18),
    quest.viewerClaimed
      ? 'Hadiah sudah diklaim'
      : quest.canClaim
        ? 'Klaim hadiah'
        : 'Belum bisa diklaim',
  ]);
  claimButton.disabled = !quest.canClaim || quest.viewerClaimed;
  claimButton.addEventListener('click', () => {
    if (claimButton.disabled) return;
    claimButton.disabled = true;
    claimButton.replaceChildren(el('span', { class: 'btn__spinner' }), 'Mengklaim…');
    void onClaim(quest).catch(() => {
      claimButton.disabled = false;
      claimButton.replaceChildren(icon('gift', 18), 'Klaim hadiah');
    });
  });

  const note =
    quest.status === 'completed'
      ? 'Target gabungan tercapai. Setiap anggota dapat mengklaim hadiahnya sendiri satu kali.'
      : quest.status === 'expired'
        ? 'Quest ini berakhir sebelum target tercapai.'
        : `Kontribusimu ${formatNumber(quest.viewerContribution)} XP. XP dari lesson dan latihan otomatis dihitung.`;

  return el('article', { class: 'card friend-quest' }, [
    el('div', { class: 'friend-quest__top' }, [
      el('div', {}, [
        el('p', { class: 'friend-quest__eyebrow', text: `Kode ${quest.code}` }),
        el('h2', { class: 'friend-quest__title', text: quest.title }),
      ]),
      statusBadge(quest),
    ]),
    el('div', { class: 'friend-quest__code-row' }, [
      el('span', {
        class: 'friend-quest__code',
        text: quest.code,
        attrs: { 'aria-label': `Kode undangan ${quest.code}` },
      }),
      el(
        'button',
        {
          class: 'btn btn--secondary btn--sm',
          attrs: { type: 'button' },
          events: { click: () => copyCode(quest.code) },
        },
        [icon('key', 16), 'Salin kode'],
      ),
      el('span', {
        class: 'friend-quest__count',
        text: `${quest.memberCount}/${quest.maxMembers} anggota`,
      }),
    ]),
    el('div', { class: 'friend-quest__progress-head' }, [
      el('span', {
        text: `${formatNumber(quest.totalXp)} / ${formatNumber(quest.targetXp)} XP`,
      }),
      el('span', { text: `${quest.progressPercent}%` }),
    ]),
    el('div', {
      class: 'progress',
      attrs: {
        role: 'progressbar',
        'aria-label': `Progres ${quest.title}`,
        'aria-valuemin': '0',
        'aria-valuemax': String(quest.targetXp),
        'aria-valuenow': String(Math.min(quest.totalXp, quest.targetXp)),
      },
    }, [bar]),
    members,
    el('div', { class: 'friend-quest__rewards' }, [
      el('span', { class: 'friend-quest__reward' }, [
        icon('sparkles', 16),
        `+${formatNumber(quest.rewardXp)} XP`,
      ]),
      el('span', { class: 'friend-quest__reward' }, [
        icon('coin', 16),
        `+${formatNumber(quest.rewardCoins)} Koin`,
      ]),
    ]),
    el('p', { class: 'friend-quest__note', text: note }),
    claimButton,
  ]);
}

export function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  let disposed = false;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const titleField = createField({
    label: 'Judul quest',
    name: 'quest-title',
    placeholder: 'Contoh: Belajar Bersama',
    maxLength: 80,
    required: true,
  });
  const targetField = createField({
    label: 'Target XP gabungan',
    name: 'quest-target',
    type: 'number',
    value: '100',
    inputMode: 'numeric',
    required: true,
    hint: 'Antara 20 dan 10.000 XP.',
  });
  const rewardXpField = createField({
    label: 'Hadiah XP per anggota',
    name: 'quest-reward-xp',
    type: 'number',
    value: '20',
    inputMode: 'numeric',
    required: true,
  });
  const rewardCoinField = createField({
    label: 'Hadiah Koin per anggota',
    name: 'quest-reward-coins',
    type: 'number',
    value: '5',
    inputMode: 'numeric',
    required: true,
  });
  targetField.input.min = '20';
  targetField.input.max = '10000';
  rewardXpField.input.min = '0';
  rewardXpField.input.max = '1000';
  rewardCoinField.input.min = '0';
  rewardCoinField.input.max = '1000';

  const createButton = el('button', { class: 'btn btn--block', attrs: { type: 'submit' } }, [
    icon('users', 18),
    'Buat quest',
  ]);

  const createForm = el('form', { class: 'card friend-quest-form' }, [
    el('h2', { class: 'friend-quest-form__title', text: 'Buat quest baru' }),
    el('p', {
      class: 'friend-quest-form__body',
      text: 'Kamu menjadi anggota pertama. Bagikan kode undangan agar teman bisa bergabung.',
    }),
    titleField.root,
    targetField.root,
    el('div', { class: 'friend-quest-form__row' }, [rewardXpField.root, rewardCoinField.root]),
    createButton,
  ]);

  createForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (createButton.disabled) return;

    const title = titleField.value().trim();
    const target = Number(targetField.value());
    const rewardXp = Number(rewardXpField.value());
    const rewardCoins = Number(rewardCoinField.value());

    if (title.length < 3) {
      titleField.setError('Judul minimal 3 karakter.');
      return;
    }
    if (!Number.isInteger(target) || target < 20 || target > 10000) {
      targetField.setError('Target XP harus antara 20 dan 10.000.');
      return;
    }
    if (!Number.isInteger(rewardXp) || rewardXp < 0 || rewardXp > 1000) {
      rewardXpField.setError('Hadiah XP harus antara 0 dan 1.000.');
      return;
    }
    if (!Number.isInteger(rewardCoins) || rewardCoins < 0 || rewardCoins > 1000) {
      rewardCoinField.setError('Hadiah Koin harus antara 0 dan 1.000.');
      return;
    }

    createButton.disabled = true;
    createButton.replaceChildren(el('span', { class: 'btn__spinner' }), 'Membuat quest…');

    void friendsQuestService
      .create(title, target, rewardXp, rewardCoins)
      .then((quest) => {
        if (disposed) return;
        showToast(`Quest dibuat. Bagikan kode ${quest.code}.`, 'success');
        titleField.input.value = '';
        void load();
      })
      .catch((error: unknown) => {
        if (disposed) return;
        showToast(error instanceof Error ? error.message : 'Quest gagal dibuat.', 'error');
      })
      .finally(() => {
        if (disposed) return;
        createButton.disabled = false;
        createButton.replaceChildren(icon('users', 18), 'Buat quest');
      });
  });

  const codeField = createField({
    label: 'Kode undangan',
    name: 'quest-code',
    placeholder: 'Contoh: A1B2C3',
    maxLength: 6,
    required: true,
  });
  codeField.input.style.textTransform = 'uppercase';
  codeField.input.autocomplete = 'off';

  const joinButton = el('button', { class: 'btn btn--secondary btn--block', attrs: { type: 'submit' } }, [
    icon('arrow-right', 18),
    'Gabung quest',
  ]);

  const joinForm = el('form', { class: 'card friend-quest-form' }, [
    el('h2', { class: 'friend-quest-form__title', text: 'Gabung dengan kode' }),
    el('p', {
      class: 'friend-quest-form__body',
      text: 'Masukkan kode enam karakter dari pembuat quest. Kontribusimu dihitung dari XP yang kamu peroleh setelah bergabung.',
    }),
    codeField.root,
    joinButton,
  ]);

  joinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (joinButton.disabled) return;

    const code = codeField.value().trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      codeField.setError('Kode undangan harus 6 huruf atau angka.');
      return;
    }

    joinButton.disabled = true;
    joinButton.replaceChildren(el('span', { class: 'btn__spinner' }), 'Bergabung…');

    void friendsQuestService
      .join(code)
      .then((quest) => {
        if (disposed) return;
        showToast(`Kamu bergabung ke ${quest.title}.`, 'success');
        codeField.input.value = '';
        void load();
      })
      .catch((error: unknown) => {
        if (disposed) return;
        showToast(error instanceof Error ? error.message : 'Gagal bergabung.', 'error');
      })
      .finally(() => {
        if (disposed) return;
        joinButton.disabled = false;
        joinButton.replaceChildren(icon('arrow-right', 18), 'Gabung quest');
      });
  });

  const listSlot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat Friends Quest…' }),
  ]);

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Mini-game #20',
      title: 'Friends Quest',
      subtitle:
        'Kerjakan target XP bersama teman. Setiap kontribusi dihitung dari XP lesson dan latihan yang ditulis server, bukan dari angka yang dikirim browser.',
    }),
    el('div', { class: 'banner banner--info' }, [
      icon('shield', 18),
      el('div', {}, [
        el('p', { class: 'banner__title', text: 'Progres dan hadiah dijaga server' }),
        el('p', {
          class: 'banner__body',
          text: 'Quest selesai saat total XP anggota mencapai target. Hadiah hanya bisa diklaim sekali oleh masing-masing anggota sebelum quest berakhir.',
        }),
      ]),
    ]),
    el('div', { class: 'friend-quest-forms' }, [createForm, joinForm]),
    el('div', { class: 'friend-quest-list-head' }, [
      el('h2', { class: 'friend-quest-list-title', text: 'Quest kamu' }),
      el('span', { class: 'friend-quest-list-hint', text: 'Maksimal 3 quest aktif' }),
    ]),
    listSlot,
  ]);

  renderAppLayout(ctx, { active: 'practice', title: 'Friends Quest', content });

  const load = () => {
    listSlot.className = 'loading-screen';
    listSlot.replaceChildren(
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat Friends Quest…' }),
    );

    void friendsQuestService
      .list()
      .then((quests) => {
        if (disposed || !listSlot.isConnected) return;
        listSlot.className = '';
        if (quests.length === 0) {
          listSlot.append(
            el('div', { class: 'card empty-state' }, [
              el('span', { class: 'empty-state__art' }, [icon('users', 34)]),
              el('h2', { class: 'empty-state__title', text: 'Belum ada Friends Quest' }),
              el('p', {
                class: 'empty-state__body',
                text: 'Buat quest baru atau masukkan kode undangan dari temanmu.',
              }),
            ]),
          );
          return;
        }

        const claim = async (quest: FriendQuest) => {
          try {
            const result = await friendsQuestService.claim(quest.id);
            if (disposed) return;
            if (result.alreadyClaimed) {
              showToast('Hadiah quest ini sudah kamu klaim.', 'default');
            } else {
              showToast(
                `Hadiah diterima: +${result.xpAwarded} XP, +${result.coinsAwarded} Koin.`,
                'success',
              );
            }
            load();
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Klaim gagal.', 'error');
            throw error;
          }
        };

        listSlot.append(
          el(
            'div',
            { class: 'friend-quest-grid' },
            quests.map((quest) => questCard(quest, claim)),
          ),
        );
      })
      .catch((error: unknown) => {
        if (disposed || !listSlot.isConnected) return;
        listSlot.className = '';
        const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
          icon('refresh', 18),
          'Coba lagi',
        ]);
        retry.addEventListener('click', load);
        listSlot.append(
          el('div', { class: 'card empty-state' }, [
            el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Friends Quest gagal dimuat' }),
            el('p', {
              class: 'empty-state__body',
              text: error instanceof Error ? error.message : 'Periksa koneksi lalu coba lagi.',
            }),
            retry,
          ]),
        );
      });
  };

  load();
}

export { meta };
