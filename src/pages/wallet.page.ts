import type { PageModule } from '../app/router';
import { icon, type IconName } from '../components/icons';
import { formatRefillCountdown } from '../components/playerSummary';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { playerStore, type PlayerStoreState } from '../stores/player.store';
import { sessionStore } from '../stores/session.store';
import type { PlayerState, PlayerWallet, WalletTransaction } from '../types/player';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Wallet' };

// The wallet RPC returns up to 30 entries for future-proofing. The page only
// shows the five newest; older rows stay untouched in the database.
const HISTORY_LIMIT = 5;

const SOURCE_LABELS: Record<string, string> = {
  lesson: 'Lesson selesai',
  practice: 'Sesi latihan',
  friend_quest_reward: 'Hadiah Friends Quest',
  heart_refill: 'Isi Hearts',
  level_reward: 'Hadiah level',
  streak_milestone: 'Milestone Streak',
  quest_reward: 'Hadiah misi',
  shop_purchase: 'Pembelian toko',
  quest: 'Hadiah quest',
  daily: 'Hadiah harian',
  developer_grant: 'Hadiah developer',
};

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source.replaceAll('_', ' ');
}

function transactionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function transactionRow(transaction: WalletTransaction, iconName: IconName): HTMLElement {
  const positive = transaction.amount > 0;
  return el('li', { class: 'wallet-tx' }, [
    el('span', { class: `wallet-tx__icon wallet-tx__icon--${positive ? 'in' : 'out'}` }, [
      icon(iconName, 16),
    ]),
    el('span', { class: 'wallet-tx__meta' }, [
      el('span', { class: 'wallet-tx__label', text: sourceLabel(transaction.source) }),
      el('span', { class: 'wallet-tx__date', text: transactionDate(transaction.createdAt) }),
    ]),
    el('span', {
      class: `wallet-tx__amount${positive ? ' wallet-tx__amount--in' : ' wallet-tx__amount--out'}`,
      text: `${positive ? '+' : ''}${formatNumber(transaction.amount)}`,
    }),
  ]);
}

function transactionList(
  transactions: WalletTransaction[],
  iconName: IconName,
  emptyText: string,
): HTMLElement {
  if (transactions.length === 0) {
    return el('p', { class: 'wallet-empty', text: emptyText });
  }

  return el(
    'ul',
    { class: 'wallet-tx-list' },
    transactions.map((transaction) => transactionRow(transaction, iconName)),
  );
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function streakStrip(state: PlayerState): HTMLElement {
  const activeDays = new Set(state.streak.activityDays);
  const parsed = /^\\d{4}-\\d{2}-\\d{2}$/.test(state.streak.todayDate)
    ? new Date(`${state.streak.todayDate}T12:00:00`)
    : new Date();
  const today = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  today.setHours(12, 0, 0, 0);
  const todayKey = dateKey(today);

  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));
    const key = dateKey(date);
    const isToday = key === todayKey;
    return el(
      'span',
      {
        class: `streak-day${activeDays.has(key) ? ' streak-day--active' : ''}${
          isToday ? ' streak-day--today' : ''
        }`,
        attrs: {
          title: `${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' }).format(date)}${
            activeDays.has(key) ? ' · ada aktivitas' : ''
          }`,
          'aria-label': `${key}${activeDays.has(key) ? ', ada aktivitas' : ', tidak ada aktivitas'}`,
        },
      },
      [el('span', { class: 'streak-day__dot' }), el('span', { class: 'streak-day__label', text: String(date.getDate()) })],
    );
  });

  return el('div', { class: 'streak-strip', attrs: { role: 'list' } }, days);
}

function heartPips(state: PlayerState): HTMLElement {
  return el(
    'div',
    { class: 'heart-pips', attrs: { 'aria-label': `${state.hearts.current} dari ${state.hearts.max} Hearts` } },
    Array.from({ length: state.hearts.max }, (_, index) =>
      el(
        'span',
        {
          class: `heart-pip${index < state.hearts.current ? ' heart-pip--on' : ''}`,
          attrs: { 'aria-hidden': 'true' },
        },
        [icon('heart', 22)],
      ),
    ),
  );
}

function levelRewardList(state: PlayerWallet): HTMLElement {
  const first = Math.max(2, state.level.level - 2);
  const last = Math.min(30, state.level.level + 3);
  const rewards = state.levelRewards.filter(
    (reward) => reward.level >= first && reward.level <= last,
  );

  return el(
    'ul',
    { class: 'level-reward-list' },
    rewards.map((reward) =>
      el(
        'li',
        { class: `level-reward${reward.awardedAt ? ' level-reward--awarded' : ''}` },
        [
          el('span', { class: 'level-reward__badge', text: `Lv ${reward.level}` }),
          el('span', { class: 'level-reward__meta' }, [
            el('span', { class: 'level-reward__title', text: reward.title }),
            el('span', {
              class: 'level-reward__xp',
              text: `${formatNumber(reward.xpRequired)} XP`,
            }),
          ]),
          el('span', {
            class: `level-reward__coins${reward.awardedAt ? ' level-reward__coins--claimed' : ''}`,
            text: reward.awardedAt
              ? `+${formatNumber(reward.rewardCoins)} diterima`
              : `${formatNumber(reward.rewardCoins)} Koin`,
          }),
        ],
      ),
    ),
  );
}

function streakMilestoneList(state: PlayerWallet): HTMLElement {
  return el(
    'ul',
    { class: 'streak-milestones' },
    state.streakMilestones.map((milestone) =>
      el(
        'li',
        {
          class: `streak-milestone${milestone.awardedAt ? ' streak-milestone--awarded' : ''}`,
          attrs: { title: `${milestone.title} · ${milestone.rewardCoins} Koin` },
        },
        [
          icon(milestone.awardedAt ? 'check' : 'flame', 14),
          el('span', { class: 'streak-milestone__days', text: `${milestone.days}h` }),
          el('span', {
            class: 'streak-milestone__coins',
            text: `+${formatNumber(milestone.rewardCoins)}`,
          }),
        ],
      ),
    ),
  );
}

function buildWallet(state: PlayerWallet): HTMLElement {
  const { level, hearts, streak } = state;
  const missing = Math.max(0, hearts.max - hearts.current);
  const canAfford = state.coins >= hearts.refillCostCoins;
  const countdown = el('span', {
    class: 'wallet-hearts__timer',
    dataset: { heartCountdown: 'true' },
    text: missing > 0 ? `Pulih dalam ${formatRefillCountdown(hearts.nextRefillSeconds)}` : 'Hearts penuh',
  });

  const refill = el('button', {
    class: 'btn btn--block',
    attrs: { type: 'button', disabled: missing === 0 || !canAfford },
  }, [
    icon('heart', 18),
    missing === 0
      ? 'Hearts penuh'
      : `Isi ${missing} Hearts · ${formatNumber(hearts.refillCostCoins)} Koin`,
  ]);

  refill.addEventListener('click', () => {
    if (refill.disabled) return;
    refill.disabled = true;
    refill.replaceChildren(el('span', { class: 'btn__spinner' }), 'Mengisi Hearts…');

    void (async () => {
      try {
        const outcome = await playerStore.refill();
        if (outcome.alreadyFull) {
          showToast('Hearts kamu sudah penuh.', 'success');
        } else {
          showToast(
            `${outcome.heartsRestored} Hearts dipulihkan dengan ${formatNumber(outcome.coinsSpent)} Koin.`,
            'success',
          );
        }
        await playerStore.loadWallet(true);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Hearts gagal diisi.', 'error');
        await playerStore.loadWallet(true);
      }
    })();
  });

  const xpBar = el('span', { class: 'xp-bar__fill' });
  xpBar.style.width = `${level.progressPercent}%`;

  return el('div', {}, [
    el('section', { class: 'wallet-hero' }, [
      el('div', { class: 'wallet-hero__balance' }, [
        el('span', { class: 'wallet-hero__eyebrow' }, [icon('coin', 16), 'Saldo Koin']),
        el('p', { class: 'wallet-hero__value', text: formatNumber(state.coins) }),
        el('p', {
          class: 'wallet-hero__hint',
          text: 'Koin didapat dari lesson, latihan, dan hadiah quest. Koin dipakai untuk mengisi Hearts.',
        }),
      ]),
      el('div', { class: 'wallet-hero__level' }, [
        el('span', { class: 'wallet-hero__eyebrow' }, [icon('star', 16), 'Level akun']),
        el('p', { class: 'wallet-hero__level-value', text: `Lv ${level.level} · ${level.title}` }),
        el('p', {
          class: 'wallet-hero__hint',
          text:
            level.nextLevelXp === null
              ? `${formatNumber(state.totalXp)} XP · level maksimal`
              : `${formatNumber(state.totalXp)} XP · ${formatNumber(level.xpToNext)} XP lagi ke Lv ${level.level + 1}`,
        }),
        el(
          'div',
          {
            class: 'xp-bar',
            attrs: {
              role: 'progressbar',
              'aria-label': `Progres level ${level.level}`,
              'aria-valuemin': '0',
              'aria-valuemax': '100',
              'aria-valuenow': String(level.progressPercent),
            },
          },
          [xpBar],
        ),
      ]),
    ]),

    el('div', { class: 'wallet-grid' }, [
      el('section', { class: 'card card--padded wallet-panel' }, [
        el('div', { class: 'wallet-panel__head' }, [
          el('div', {}, [
            el('h2', { class: 'card__title', text: 'Hearts' }),
            el('p', { class: 'card__subtitle', text: `${hearts.current}/${hearts.max} Hearts tersedia` }),
          ]),
          el('span', { class: `badge${hearts.current <= 1 ? ' badge--red' : ''}` }, [
            icon('heart', 12),
            `${hearts.current}/${hearts.max}`,
          ]),
        ]),
        heartPips(state),
        countdown,
        el('p', {
          class: 'wallet-panel__note',
          text: `Satu Heart pulih setiap ${hearts.regenMinutes} menit. Isi ulang hanya untuk Hearts yang hilang.`,
        }),
        !canAfford && missing > 0
          ? el('p', { class: 'wallet-panel__note wallet-panel__note--warning' }, [
              'Koin belum cukup. Selesaikan lesson atau latihan untuk menambah Koin.',
            ])
          : null,
        refill,
      ]),

      el('section', { class: 'card card--padded wallet-panel' }, [
        el('div', { class: 'wallet-panel__head' }, [
          el('div', {}, [
            el('h2', { class: 'card__title', text: 'Streak' }),
            el('p', { class: 'card__subtitle', text: 'Hari dengan XP lesson atau latihan.' }),
          ]),
          el('span', { class: 'badge badge--warm' }, [icon('flame', 12), `${streak.current} hari`]),
        ]),
        el('div', { class: 'wallet-streak__numbers' }, [
          el('div', {}, [
            el('span', { class: 'wallet-streak__value', text: String(streak.current) }),
            el('span', { class: 'wallet-streak__label', text: 'Streak sekarang' }),
          ]),
          el('div', {}, [
            el('span', { class: 'wallet-streak__value', text: String(streak.longest) }),
            el('span', { class: 'wallet-streak__label', text: 'Terpanjang' }),
          ]),
        ]),
        streakStrip(state),
        el('div', { class: 'streak-shield-line' }, [
          icon('shield', 16),
          el('span', {
            text: `${streak.freezes}/2 perisai tersedia`,
          }),
          el('a', { attrs: { href: '/shop' }, text: 'Isi perisai' }),
        ]),
        el('div', { class: 'streak-milestone-head' }, [
          el('span', { text: 'Milestone' }),
          el('span', { class: 'wallet-panel__note', text: 'Hadiah otomatis' }),
        ]),
        streakMilestoneList(state),
        el('p', {
          class: 'wallet-panel__note',
          text: 'Streak dihitung dari aktivitas belajar di zona waktu akunmu. Perisai melindungi satu hari yang terlewat. XP hadiah quest tidak memperpanjang Streak.',
        }),
      ]),
    ]),

    el('section', { class: 'card card--padded wallet-level-rewards' }, [
      el('div', { class: 'wallet-panel__head' }, [
        el('div', {}, [
          el('h2', { class: 'card__title', text: 'Hadiah Level' }),
          el('p', {
            class: 'card__subtitle',
            text: 'Diberikan otomatis saat total XP melewati ambang level.',
          }),
        ]),
        el('span', { class: 'badge' }, [icon('gift', 12), 'Otomatis']),
      ]),
      levelRewardList(state),
      el('div', { class: 'wallet-quick-links' }, [
        el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/quests' } }, [
          icon('flag', 16),
          'Lihat misi',
        ]),
        el('a', { class: 'btn btn--ghost btn--sm', attrs: { href: '/shop' } }, [
          icon('gift', 16),
          'Buka toko',
        ]),
      ]),
    ]),

    el('div', { class: 'wallet-history' }, [
      el('section', { class: 'card card--padded wallet-history__card' }, [
        el('h2', { class: 'card__title', text: 'Riwayat Koin' }),
        el('p', { class: 'card__subtitle', text: '5 aktivitas terbaru.' }),
        transactionList(
          state.transactions.slice(0, HISTORY_LIMIT),
          'coin',
          'Belum ada transaksi Koin.',
        ),
      ]),
      el('section', { class: 'card card--padded wallet-history__card' }, [
        el('h2', { class: 'card__title', text: 'Riwayat XP' }),
        el('p', { class: 'card__subtitle', text: '5 aktivitas terbaru.' }),
        transactionList(
          state.xpTransactions.slice(0, HISTORY_LIMIT),
          'sparkles',
          'Belum ada XP tercatat.',
        ),
      ]),
    ]),
  ]);
}

function walletError(message: string, onRetry: () => void): HTMLElement {
  const retry = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
    icon('refresh', 16),
    'Coba lagi',
  ]);
  retry.addEventListener('click', onRetry);

  return el('div', { class: 'state-card' }, [
    el('span', { class: 'state-card__icon' }, [icon('alert', 30)]),
    el('h1', { class: 'state-card__title', text: 'Wallet gagal dimuat' }),
    el('p', { class: 'state-card__body', text: message }),
    retry,
  ]);
}

export function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  let secondsLeft = 0;
  let countdownEl: HTMLElement | null = null;
  let timer = 0;
  let refreshPending = false;

  const host = el('div', { class: 'wallet-page' });
  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Progres',
      title: 'Wallet',
      subtitle: 'Saldo, level, Hearts, dan Streak dari server — bukan angka yang bisa diubah browser.',
    }),
    host,
  ]);

  renderAppLayout(ctx, { active: 'wallet', title: 'Wallet', content });

  const paint = (state: PlayerStoreState) => {
    const wallet = state.wallet ?? (state.data as PlayerWallet | null);

    if (state.walletStatus === 'error' && !state.wallet) {
      host.replaceChildren(
        walletError(state.walletError ?? 'Wallet gagal dimuat.', () => {
          void playerStore.loadWallet(true);
        }),
      );
      return;
    }

    if (!wallet || !Array.isArray(wallet.transactions)) {
      host.replaceChildren(
        el('div', { class: 'player-progress player-progress--loading' }, [
          el('span', { class: 'spinner' }),
          el('p', { class: 'small muted', text: 'Memuat wallet…' }),
        ]),
      );
      return;
    }

    secondsLeft = wallet.hearts.nextRefillSeconds;
    host.replaceChildren(buildWallet(wallet));
    countdownEl = host.querySelector<HTMLElement>('[data-heart-countdown=\"true\"]');
  };

  ctx.onCleanup(playerStore.subscribe(paint));
  ctx.onCleanup(() => {
    if (timer) window.clearInterval(timer);
  });

  paint(playerStore.getState());
  void playerStore.loadWallet();

  timer = window.setInterval(() => {
    if (!countdownEl?.isConnected) return;
    const current = playerStore.getState().data;
    if (!current || current.hearts.current >= current.hearts.max) {
      countdownEl.textContent = 'Hearts penuh';
      return;
    }

    secondsLeft = Math.max(0, secondsLeft - 1);
    countdownEl.textContent = `Pulih dalam ${formatRefillCountdown(secondsLeft)}`;
    if (secondsLeft === 0 && !refreshPending) {
      refreshPending = true;
      void playerStore.loadWallet(true).finally(() => {
        refreshPending = false;
      });
    }
  }, 1000);
}

export { meta };
