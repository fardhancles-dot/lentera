import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { audioEngine } from '../game/audio/audioEngine';
import { renderAppLayout } from '../layouts/appLayout';
import { curriculumService, type RewardDetail } from '../services/curriculum.service';
import { rewardsService } from '../services/rewards.service';
import { playerStore } from '../stores/player.store';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Hadiah level' };

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Pemula',
  elementary: 'Dasar',
  intermediate: 'Menengah',
  upper_intermediate: 'Menengah atas',
  advanced: 'Mahir',
  expert: 'Ahli',
};

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'stat' }, [
    el('span', { class: 'stat__value', text: value }),
    el('span', { class: 'stat__label', text: label }),
  ]);
}

function rewardChip(iconName: 'coin' | 'sparkles', label: string, value: string): HTMLElement {
  return el('div', { class: 'reward-chip' }, [
    icon(iconName, 20),
    el('span', { class: 'reward-chip__value', text: value }),
    el('span', { class: 'reward-chip__label', text: label }),
  ]);
}

function buildDetail(detail: RewardDetail, onClaim: () => Promise<void>): HTMLElement {
  const { subject, level, unit, node } = detail;
  const claimed = node.rewardClaimed;
  const locked = node.status === 'locked';
  const remaining = Math.max(0, level.nodeCount - level.completedCount);

  const claimButton = el(
    'button',
    { class: 'btn btn--block btn--lg', attrs: { type: 'button', disabled: claimed || locked } },
    [
      icon(claimed ? 'check' : locked ? 'lock' : 'gift', 18),
      claimed ? 'Hadiah sudah diklaim' : locked ? 'Selesaikan semua lesson' : 'Ambil hadiah',
    ],
  );

  claimButton.addEventListener('click', () => {
    if (claimButton.disabled) return;
    claimButton.disabled = true;
    claimButton.replaceChildren(el('span', { class: 'btn__spinner' }), 'Mengambil hadiah…');
    void onClaim().catch(() => {
      claimButton.disabled = false;
      claimButton.replaceChildren(icon('gift', 18), 'Ambil hadiah');
    });
  });

  const statusBanner = claimed
    ? el('div', { class: 'banner banner--success' }, [
        icon('check', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Hadiah sudah diterima' }),
          el('p', {
            class: 'banner__body',
            text: 'Koin dan XP dari node ini sudah masuk ke akunmu. Hadiah tidak dapat diklaim dua kali.',
          }),
        ]),
      ])
    : locked
      ? el('div', { class: 'banner banner--warning' }, [
          icon('lock', 18),
          el('div', {}, [
            el('p', { class: 'banner__title', text: 'Hadiah masih terkunci' }),
            el('p', {
              class: 'banner__body',
              text: `Selesaikan ${remaining} lesson lagi di ${level.title} untuk membuka hadiah ini.`,
            }),
          ]),
        ])
      : el('div', { class: 'banner banner--success' }, [
          icon('gift', 18),
          el('div', {}, [
            el('p', { class: 'banner__title', text: 'Hadiah siap diambil' }),
            el('p', {
              class: 'banner__body',
              text: 'Semua lesson di level ini sudah selesai. Klaim hadiah satu kali untuk menambah Koin dan XP.',
            }),
          ]),
        ]);

  const progressBar = el('span', { class: 'progress__bar' });
  progressBar.style.width = `${
    level.nodeCount > 0 ? Math.round((level.completedCount / level.nodeCount) * 100) : 100
  }%`;

  const hero = el('section', { class: 'reward-hero card' }, [
    el('span', { class: 'reward-hero__icon' }, [icon('gift', 40)]),
    el('div', { class: 'reward-hero__body' }, [
      el('div', { class: 'reward-hero__badges' }, [
        el('span', { class: 'badge badge--muted', text: DIFFICULTY_LABEL[level.difficulty] ?? level.difficulty }),
        el('span', {
          class: `badge${claimed ? '' : locked ? ' badge--muted' : ' badge--yellow'}`,
          text: claimed ? 'Diterima' : locked ? 'Terkunci' : 'Siap diambil',
        }),
      ]),
      el('p', { class: 'reward-hero__eyebrow', text: `${level.title} · ${unit.title}` }),
      el('h1', { class: 'reward-hero__title', text: node.title }),
      el('p', { class: 'reward-hero__description', text: node.description }),
      el('div', { class: 'reward-hero__rewards' }, [
        rewardChip('coin', 'Koin', `+${node.rewardCoins}`),
        rewardChip('sparkles', 'XP', `+${node.rewardXp}`),
      ]),
    ]),
  ]);

  const levelCard = el('section', { class: 'card card--padded' }, [
    el('h2', { class: 'card__title', text: 'Progres level' }),
    el('p', {
      class: 'card__subtitle',
      text: `${level.completedCount} dari ${level.nodeCount} lesson selesai di level ini.`,
    }),
    el(
      'div',
      {
        class: 'progress',
        attrs: {
          role: 'progressbar',
          'aria-label': `Progres ${level.title}`,
          'aria-valuemin': '0',
          'aria-valuemax': String(level.nodeCount),
          'aria-valuenow': String(level.completedCount),
        },
      },
      [progressBar],
    ),
    el('div', { class: 'reward-level-stats' }, [
      stat('Lesson selesai', String(level.completedCount)),
      stat('Total lesson', String(level.nodeCount)),
      stat('Sisa', String(remaining)),
    ]),
  ]);

  const ruleCard = el('section', { class: 'card card--padded' }, [
    el('h2', { class: 'card__title', text: 'Cara kerja hadiah level' }),
    el('ul', { class: 'reward-rules' }, [
      el('li', {}, [icon('check', 14), el('span', { text: 'Satu node hadiah di akhir setiap level.' })]),
      el('li', {}, [
        icon('check', 14),
        el('span', { text: 'Terbuka setelah semua lesson playable di level itu selesai.' }),
      ]),
      el('li', {}, [
        icon('check', 14),
        el('span', { text: 'Koin dan XP ditulis server serta hanya bisa diklaim sekali.' }),
      ]),
    ]),
  ]);

  return el('div', { class: 'reward-detail' }, [
    el('a', { class: 'back-link', attrs: { href: `/learn/${subject.slug}` } }, [
      icon('arrow-left', 16),
      `Kembali ke ${subject.name}`,
    ]),
    hero,
    statusBanner,
    el('div', { class: 'reward-layout' }, [
      el('div', { class: 'reward-layout__main' }, [levelCard, ruleCard]),
      el('div', { class: 'reward-layout__aside' }, [
        el('section', { class: 'card card--padded reward-claim-card' }, [
          el('h2', { class: 'card__title', text: 'Klaim hadiah' }),
          el('p', {
            class: 'card__subtitle',
            text: claimed
              ? 'Hadiah ini sudah masuk ke wallet dan XP akunmu.'
              : 'Klaim hanya dapat dilakukan setelah level selesai. Server memeriksa ulang progres sebelum menulis Koin dan XP.',
          }),
          claimButton,
        ]),
      ]),
    ]),
  ]);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const subjectSlug = ctx.params.subject ?? '';
  const rewardSlug = ctx.params.nodeSlug ?? '';
  const host = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat hadiah level…' }),
  ]);

  const content = el('div', {}, [host]);
  renderAppLayout(ctx, { active: 'learn', title: 'Hadiah level', content });

  const load = () => {
    host.className = 'loading-screen';
    host.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Memuat hadiah level…' }));

    void (async () => {
      try {
        const detail = await curriculumService.loadRewardDetail(subjectSlug, rewardSlug, user.id, {
          developerPreview: user.role === 'developer',
        });
        if (!host.isConnected) return;

        if (!detail) {
          host.className = '';
          host.replaceChildren(
            el('div', { class: 'card empty-state' }, [
              el('span', { class: 'empty-state__art' }, [icon('gift', 34)]),
              el('h2', { class: 'empty-state__title', text: 'Hadiah tidak ditemukan' }),
              el('p', {
                class: 'empty-state__body',
                text: 'Node hadiah ini tidak ada di mata pelajaran tersebut, atau sudah tidak dipublikasikan.',
              }),
              el('a', { class: 'btn', attrs: { href: `/learn/${subjectSlug}` } }, [
                icon('arrow-left', 18),
                'Kembali ke peta belajar',
              ]),
            ]),
          );
          return;
        }

        const claim = async () => {
          try {
            const outcome = await rewardsService.claimRewardNode(detail.node.id);
            if (!host.isConnected) return;
            if (outcome.alreadyClaimed) {
              showToast('Hadiah ini sudah pernah diklaim.', 'default');
            } else {
              audioEngine.play('reward');
              showToast(
                `Hadiah diterima: +${outcome.coinsAwarded} Koin, +${outcome.xpAwarded} XP.`,
                'success',
              );
            }
            void playerStore.load(true);
            load();
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Hadiah gagal diklaim.', 'error');
            throw error;
          }
        };

        host.className = '';
        host.replaceChildren(buildDetail(detail, claim));
      } catch (error) {
        console.error('[learn] failed to load reward', error);
        if (!host.isConnected) return;
        host.className = '';
        const message = error instanceof Error ? error.message : 'Hadiah gagal dimuat.';
        const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
          icon('refresh', 18),
          'Coba lagi',
        ]);
        retry.addEventListener('click', load);
        host.replaceChildren(
          el('div', { class: 'card empty-state' }, [
            el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Hadiah gagal dimuat' }),
            el('p', { class: 'empty-state__body', text: message }),
            retry,
          ]),
        );
      }
    })();
  };

  load();
}

export { meta, render };
