import type { PageModule } from '../app/router';
import { icon, iconName } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { rewardsStore } from '../stores/rewards.store';
import { sessionStore } from '../stores/session.store';
import type { Achievement, Quest } from '../types/rewards';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Misi & Pencapaian' };

const METRIC_LABELS: Record<string, string> = {
  xp: 'XP',
  lesson: 'lesson',
  practice: 'latihan',
  streak: 'hari Streak',
  level: 'level',
};

function metricLabel(metric: string): string {
  return METRIC_LABELS[metric] ?? metric;
}

function cadenceLabel(cadence: Quest['cadence']): string {
  return cadence === 'weekly' ? 'Mingguan' : 'Harian';
}

function progressBar(progress: number, target: number, label: string): HTMLElement {
  const percent = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
  const fill = el('span', { class: 'progress__bar' });
  fill.style.width = `${percent}%`;

  return el(
    'div',
    {
      class: 'progress',
      attrs: {
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': '0',
        'aria-valuemax': String(target),
        'aria-valuenow': String(Math.min(progress, target)),
      },
    },
    [fill],
  );
}

function questCard(quest: Quest, onClaim: (quest: Quest) => Promise<void>): HTMLElement {
  const claimed = Boolean(quest.claimedAt);
  const claim = el('button', { class: 'btn btn--block', attrs: { type: 'button' } }, [
    icon('gift', 18),
    claimed
      ? 'Hadiah sudah diterima'
      : quest.canClaim
        ? `Klaim +${formatNumber(quest.rewardCoins)} Koin`
        : 'Belum selesai',
  ]);
  claim.disabled = claimed || !quest.canClaim;

  claim.addEventListener('click', () => {
    if (claim.disabled) return;
    claim.disabled = true;
    claim.replaceChildren(el('span', { class: 'btn__spinner' }), 'Mengklaim…');
    void onClaim(quest).catch(() => {
      claim.disabled = false;
      claim.replaceChildren(icon('gift', 18), 'Klaim hadiah');
    });
  });

  return el('article', { class: 'card reward-card' }, [
    el('div', { class: 'reward-card__top' }, [
      el('span', { class: 'reward-card__icon' }, [icon(iconName(quest.icon), 22)]),
      el('span', {
        class: `badge ${quest.cadence === 'weekly' ? 'badge--blue' : 'badge--warm'}`,
        text: cadenceLabel(quest.cadence),
      }),
    ]),
    el('h3', { class: 'reward-card__title', text: quest.title }),
    el('p', { class: 'reward-card__body', text: quest.description }),
    el('div', { class: 'reward-card__meta' }, [
      el('span', {
        text: `${formatNumber(Math.min(quest.progress, quest.target))} / ${formatNumber(quest.target)} ${metricLabel(quest.metric)}`,
      }),
      el('span', { text: `${formatNumber(quest.rewardCoins)} Koin` }),
    ]),
    progressBar(quest.progress, quest.target, `Progres ${quest.title}`),
    claimed
      ? el('p', { class: 'reward-card__status', text: 'Hadiah sudah masuk ke wallet.' })
      : null,
    claim,
  ]);
}

function achievementCard(achievement: Achievement): HTMLElement {
  const unlocked = Boolean(achievement.unlockedAt);
  const percent =
    achievement.target > 0
      ? Math.min(100, Math.round((achievement.progress / achievement.target) * 100))
      : 0;
  const fill = el('span', { class: 'progress__bar' });
  fill.style.width = `${percent}%`;

  return el(
    'article',
    { class: `card achievement-card${unlocked ? ' achievement-card--unlocked' : ''}` },
    [
      el('div', { class: 'achievement-card__top' }, [
        el('span', { class: 'achievement-card__icon' }, [
          icon(iconName(achievement.icon, 'trophy'), 22),
        ]),
        el('span', {
          class: `badge ${unlocked ? '' : 'badge--muted'}`,
          text: unlocked ? 'Terbuka' : 'Terkunci',
        }),
      ]),
      el('h3', { class: 'achievement-card__title', text: achievement.title }),
      el('p', { class: 'achievement-card__body', text: achievement.description }),
      el('div', { class: 'achievement-card__meta' }, [
        el('span', {
          text: `${formatNumber(achievement.progress)} / ${formatNumber(achievement.target)} ${metricLabel(achievement.metric)}`,
        }),
        el('span', { text: `${percent}%` }),
      ]),
      el(
        'div',
        {
          class: 'progress',
          attrs: {
            role: 'progressbar',
            'aria-label': `Progres ${achievement.title}`,
            'aria-valuemin': '0',
            'aria-valuemax': '100',
            'aria-valuenow': String(percent),
          },
        },
        [fill],
      ),
    ],
  );
}

function errorCard(message: string, retry: () => void): HTMLElement {
  const button = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
    icon('refresh', 16),
    'Coba lagi',
  ]);
  button.addEventListener('click', retry);

  return el('div', { class: 'card empty-state' }, [
    el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
    el('h2', { class: 'empty-state__title', text: 'Misi gagal dimuat' }),
    el('p', { class: 'empty-state__body', text: message }),
    button,
  ]);
}

function loading(message: string): HTMLElement {
  return el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: message }),
  ]);
}

export function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  let disposed = false;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const questsSlot = el('div', {});
  const achievementsSlot = el('div', {});
  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Misi & pencapaian',
      title: 'Misi',
      subtitle:
        'Misi harian dan mingguan dihitung dari XP yang ditulis server. Pencapaian terbuka otomatis saat targetmu tercapai.',
    }),
    el('div', { class: 'banner banner--info' }, [
      icon('shield', 18),
      el('div', {}, [
        el('p', { class: 'banner__title', text: 'Hadiah tidak bisa dikirim dari browser' }),
        el('p', {
          class: 'banner__body',
          text: 'Server menghitung ulang progres dan nominal hadiah setiap kali kamu mengklaim misi.',
        }),
      ]),
    ]),
    el('section', { class: 'rewards-section' }, [
      el('div', { class: 'rewards-section__head' }, [
        el('h2', { class: 'rewards-section__title', text: 'Misi hari ini' }),
        el('span', { class: 'rewards-section__hint', text: 'Harian dan mingguan' }),
      ]),
      questsSlot,
    ]),
    el('section', { class: 'rewards-section' }, [
      el('div', { class: 'rewards-section__head' }, [
        el('h2', { class: 'rewards-section__title', text: 'Pencapaian' }),
        el('span', { class: 'rewards-section__hint', text: 'Terbuka otomatis' }),
      ]),
      achievementsSlot,
    ]),
  ]);

  renderAppLayout(ctx, { active: 'quests', title: 'Misi', content });

  const claimQuest = async (quest: Quest) => {
    try {
      const result = await rewardsStore.claimQuest(quest.id);
      if (disposed) return;
      if (result.alreadyClaimed) {
        showToast('Hadiah misi ini sudah kamu klaim.', 'default');
      } else {
        showToast(`Hadiah diterima: +${formatNumber(result.coinsAwarded)} Koin.`, 'success');
      }
      await load();
    } catch (error) {
      if (!disposed) {
        showToast(error instanceof Error ? error.message : 'Klaim misi gagal.', 'error');
      }
      throw error;
    }
  };

  const paintQuests = () => {
    const state = rewardsStore.getState();
    questsSlot.replaceChildren();

    if (state.questsStatus === 'error') {
      questsSlot.append(errorCard(state.questsError ?? 'Misi gagal dimuat.', load));
      return;
    }

    if (!state.quests) {
      questsSlot.append(loading('Memuat misi…'));
      return;
    }

    const daily = state.quests.quests.filter((quest) => quest.cadence === 'daily');
    const weekly = state.quests.quests.filter((quest) => quest.cadence === 'weekly');

    const group = (title: string, quests: Quest[]) =>
      el('div', { class: 'rewards-group' }, [
        el('h3', { class: 'rewards-group__title', text: title }),
        el(
          'div',
          { class: 'reward-grid' },
          quests.map((quest) => questCard(quest, claimQuest)),
        ),
      ]);

    questsSlot.append(
      group('Harian', daily),
      group('Mingguan', weekly),
      el('p', {
        class: 'rewards-reset-note',
        text: 'Misi harian disegarkan setiap hari; misi mingguan dimulai setiap Senin di zona waktu akunmu.',
      }),
    );
  };

  const paintAchievements = () => {
    const state = rewardsStore.getState();
    achievementsSlot.replaceChildren();

    if (state.achievementsStatus === 'error') {
      achievementsSlot.append(
        errorCard(state.achievementsError ?? 'Pencapaian gagal dimuat.', load),
      );
      return;
    }

    if (!state.achievements) {
      achievementsSlot.append(loading('Memuat pencapaian…'));
      return;
    }

    achievementsSlot.append(
      el('div', { class: 'achievement-summary' }, [
        icon('trophy', 18),
        `${formatNumber(state.achievements.unlockedCount)} dari ${formatNumber(state.achievements.total)} pencapaian terbuka`,
      ]),
      el(
        'div',
        { class: 'achievement-grid' },
        state.achievements.achievements.map(achievementCard),
      ),
    );
  };

  const load = async () => {
    questsSlot.replaceChildren(loading('Memuat misi…'));
    achievementsSlot.replaceChildren(loading('Memuat pencapaian…'));
    await Promise.all([
      rewardsStore.loadQuests(true),
      rewardsStore.loadAchievements(true),
    ]);
    if (disposed) return;
    paintQuests();
    paintAchievements();
  };

  paintQuests();
  paintAchievements();
  void load();
}

export { meta };
