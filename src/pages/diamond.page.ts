import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { playerStore, type PlayerStoreState } from '../stores/player.store';
import { rewardsStore } from '../stores/rewards.store';
import { sessionStore } from '../stores/session.store';
import type { PlayerWallet, WalletTransaction } from '../types/player';
import type { Quest } from '../types/rewards';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Coin & Diamond Shop' };

const HISTORY_LIMIT = 12;

const SOURCE_LABELS: Record<string, string> = {
  quest_reward: 'Hadiah misi',
  diamond_exchange: 'Tukar Diamond ke Koin',
  diamond_grant: 'Hadiah Diamond',
  developer_grant: 'Hadiah developer',
  lesson: 'Lesson selesai',
  practice: 'Sesi latihan',
  level_reward: 'Hadiah level',
  streak_milestone: 'Milestone Streak',
  heart_refill: 'Isi Hearts',
  shop_purchase: 'Pembelian toko',
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

type HistoryEntry = WalletTransaction & { currency: 'coin' | 'diamond' };

function historyEntries(wallet: PlayerWallet): HistoryEntry[] {
  const coins = wallet.transactions.map((entry) => ({ ...entry, currency: 'coin' as const }));
  const diamonds = wallet.diamondTransactions.map((entry) => ({
    ...entry,
    currency: 'diamond' as const,
  }));

  return [...coins, ...diamonds]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, HISTORY_LIMIT);
}

function historyRow(entry: HistoryEntry): HTMLElement {
  const positive = entry.amount > 0;
  return el('li', { class: 'wallet-tx' }, [
    el(
      'span',
      { class: `wallet-tx__icon wallet-tx__icon--${positive ? 'in' : 'out'}` },
      [icon(entry.currency === 'diamond' ? 'diamond' : 'coin', 16)],
    ),
    el('span', { class: 'wallet-tx__meta' }, [
      el('span', { class: 'wallet-tx__label', text: sourceLabel(entry.source) }),
      el('span', { class: 'wallet-tx__date', text: transactionDate(entry.createdAt) }),
    ]),
    el('span', {
      class: `wallet-tx__amount${positive ? ' wallet-tx__amount--in' : ' wallet-tx__amount--out'}`,
      text: `${positive ? '+' : ''}${formatNumber(entry.amount)} ${
        entry.currency === 'diamond' ? 'Diamond' : 'Koin'
      }`,
    }),
  ]);
}

function hero(wallet: PlayerWallet): HTMLElement {
  return el('section', { class: 'diamond-hero' }, [
    el('div', { class: 'diamond-hero__head' }, [
      el('span', { class: 'diamond-hero__eyebrow' }, [icon('diamond', 16), 'Coin & Diamond Shop']),
      el('h2', { class: 'diamond-hero__title', text: 'Wallet Saya' }),
      el('p', {
        class: 'diamond-hero__hint',
        text: 'Diamond didapat dari misi pilihan. Tukarkan Diamond menjadi Koin kapan saja — saldo diproses server.',
      }),
    ]),
    el('div', { class: 'diamond-balances' }, [
      el('div', { class: 'diamond-balance diamond-balance--diamond' }, [
        el('span', { class: 'diamond-balance__label' }, [icon('diamond', 18), 'Diamond']),
        el('strong', { class: 'diamond-balance__value', text: formatNumber(wallet.diamonds) }),
        el('span', { class: 'diamond-balance__note', text: 'Mata uang hadiah misi' }),
      ]),
      el('div', { class: 'diamond-balance diamond-balance--coin' }, [
        el('span', { class: 'diamond-balance__label' }, [icon('coin', 18), 'Koin']),
        el('strong', { class: 'diamond-balance__value', text: formatNumber(wallet.coins) }),
        el('span', { class: 'diamond-balance__note', text: 'Dipakai untuk item & Hearts' }),
      ]),
    ]),
  ]);
}

function exchangeSection(wallet: PlayerWallet): HTMLElement {
  const grid = el('div', { class: 'exchange-grid' });

  if (wallet.exchangeRates.length === 0) {
    grid.append(
      el('p', {
        class: 'wallet-panel__note',
        text: 'Nilai tukar sedang tidak tersedia. Coba lagi nanti.',
      }),
    );
  }

  for (const rate of wallet.exchangeRates) {
    const affordable = wallet.diamonds >= rate.diamonds;
    const exchange = el(
      'button',
      {
        class: 'btn btn--block',
        attrs: { type: 'button', disabled: !affordable },
      },
      [icon('diamond', 16), `Tukar ${formatNumber(rate.diamonds)} Diamond`],
    );

    exchange.addEventListener('click', () => {
      if (exchange.disabled) return;
      exchange.disabled = true;
      exchange.replaceChildren(el('span', { class: 'btn__spinner' }), 'Menukar…');

      void (async () => {
        try {
          const outcome = await playerStore.exchangeDiamonds(rate.diamonds);
          showToast(
            `${formatNumber(outcome.diamondsSpent)} Diamond ditukar menjadi ${formatNumber(
              outcome.coinsAwarded,
            )} Koin.`,
            'success',
          );
        } catch (error) {
          showToast(
            error instanceof Error ? error.message : 'Penukaran Diamond gagal.',
            'error',
          );
          exchange.disabled = false;
          exchange.replaceChildren(
            icon('diamond', 16),
            `Tukar ${formatNumber(rate.diamonds)} Diamond`,
          );
        }
      })();
    });

    grid.append(
      el(
        'article',
        { class: `exchange-card${affordable ? '' : ' exchange-card--locked'}` },
        [
          el('div', { class: 'exchange-card__rate' }, [
            el('span', { class: 'exchange-card__diamonds' }, [
              icon('diamond', 20),
              formatNumber(rate.diamonds),
            ]),
            el('span', { class: 'exchange-card__arrow' }, [icon('arrow-right', 16)]),
            el('span', { class: 'exchange-card__coins' }, [
              icon('coin', 18),
              formatNumber(rate.coins),
            ]),
          ]),
          el('p', { class: 'exchange-card__note', text: 'Diamond menjadi Koin' }),
          exchange,
        ],
      ),
    );
  }

  return el('section', { class: 'card card--padded diamond-section' }, [
    el('div', { class: 'wallet-panel__head' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: 'Tukar Diamond menjadi Koin' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Nilai tukar ditentukan server. Penukaran diproses atomik dan tercatat di riwayat.',
        }),
      ]),
      el('span', { class: 'badge' }, [icon('refresh', 12), 'Instan']),
    ]),
    grid,
    el('p', {
      class: 'wallet-panel__note',
      text: 'Koin hasil penukaran tidak menambah XP atau Streak. Diamond tidak dapat ditukar kembali menjadi Diamond.',
    }),
  ]);
}

function earnSection(slot: HTMLElement): HTMLElement {
  return el('section', { class: 'card card--padded diamond-section' }, [
    el('div', { class: 'wallet-panel__head' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: 'Dapatkan Diamond' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Misi harian dan mingguan tertentu memberi Diamond saat hadiah diklaim.',
        }),
      ]),
      el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/quests' } }, [
        icon('flag', 16),
        'Buka misi',
      ]),
    ]),
    slot,
    el('p', {
      class: 'wallet-panel__note',
      text: 'Progres misi dihitung dari aktivitas belajar di server. Hadiah hanya masuk setelah misi selesai dan diklaim.',
    }),
  ]);
}

function questRow(quest: Quest): HTMLElement {
  const claimed = Boolean(quest.claimedAt);
  return el(
    'article',
    { class: `diamond-quest${claimed ? ' diamond-quest--claimed' : ''}` },
    [
      el('span', { class: 'diamond-quest__icon' }, [icon('diamond', 18)]),
      el('span', { class: 'diamond-quest__meta' }, [
        el('strong', { class: 'diamond-quest__title', text: quest.title }),
        el('span', {
          class: 'diamond-quest__desc',
          text:
            quest.rewardCoins > 0
              ? `+${formatNumber(quest.rewardCoins)} Koin dan +${formatNumber(
                  quest.rewardDiamonds,
                )} Diamond`
              : `+${formatNumber(quest.rewardDiamonds)} Diamond`,
        }),
      ]),
      el('span', {
        class: 'diamond-quest__status',
        text: claimed ? 'Sudah diklaim' : quest.canClaim ? 'Siap diklaim' : 'Belum selesai',
      }),
    ],
  );
}

function historySection(wallet: PlayerWallet): HTMLElement {
  const entries = historyEntries(wallet);
  return el('section', { class: 'card card--padded diamond-section' }, [
    el('div', { class: 'wallet-panel__head' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: 'Riwayat Transaksi' }),
        el('p', {
          class: 'card__subtitle',
          text: `${HISTORY_LIMIT} aktivitas terbaru Koin dan Diamond.`,
        }),
      ]),
      el('a', { class: 'btn btn--ghost btn--sm', attrs: { href: '/wallet' } }, [
        icon('bag', 16),
        'Wallet',
      ]),
    ]),
    entries.length === 0
      ? el('p', { class: 'wallet-empty', text: 'Belum ada transaksi Koin atau Diamond.' })
      : el(
          'ul',
          { class: 'wallet-tx-list' },
          entries.map(historyRow),
        ),
  ]);
}

function errorCard(message: string, retry: () => void): HTMLElement {
  const button = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
    icon('refresh', 16),
    'Coba lagi',
  ]);
  button.addEventListener('click', retry);

  return el('div', { class: 'state-card' }, [
    el('span', { class: 'state-card__icon' }, [icon('alert', 30)]),
    el('h1', { class: 'state-card__title', text: 'Coin & Diamond gagal dimuat' }),
    el('p', { class: 'state-card__body', text: message }),
    button,
  ]);
}

export function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const host = el('div', { class: 'diamond-page' });
  const earnSlot = el('div', { class: 'diamond-earn-list' });
  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Coin & Diamond Shop',
      title: 'Diamond',
      subtitle:
        'Diamond adalah mata uang hadiah misi. Tukar Diamond menjadi Koin dengan nilai tukar yang diatur admin.',
    }),
    host,
  ]);

  renderAppLayout(ctx, { active: 'diamond', title: 'Coin & Diamond', content });

  const paintEarn = () => {
    const state = rewardsStore.getState();
    earnSlot.replaceChildren();

    if (state.questsStatus === 'error') {
      earnSlot.append(
        el('p', {
          class: 'wallet-panel__note wallet-panel__note--warning',
          text: state.questsError ?? 'Misi berhadiah Diamond gagal dimuat.',
        }),
      );
      return;
    }

    if (!state.quests) {
      earnSlot.append(
        el('div', { class: 'player-progress player-progress--loading' }, [
          el('span', { class: 'spinner' }),
          el('p', { class: 'small muted', text: 'Memuat misi Diamond…' }),
        ]),
      );
      return;
    }

    const quests = state.quests.quests.filter((quest) => quest.rewardDiamonds > 0);
    if (quests.length === 0) {
      earnSlot.append(
        el('p', {
          class: 'wallet-panel__note',
          text: 'Belum ada misi yang memberi Diamond saat ini.',
        }),
      );
      return;
    }

    earnSlot.append(...quests.map(questRow));
  };

  const paint = (state: PlayerStoreState) => {
    const wallet = state.wallet ?? (state.data as PlayerWallet | null);

    if (state.walletStatus === 'error' && !state.wallet) {
      host.replaceChildren(
        errorCard(state.walletError ?? 'Coin & Diamond gagal dimuat.', () => {
          void playerStore.loadWallet(true);
        }),
      );
      return;
    }

    if (!wallet || !Array.isArray(wallet.diamondTransactions)) {
      host.replaceChildren(
        el('div', { class: 'player-progress player-progress--loading' }, [
          el('span', { class: 'spinner' }),
          el('p', { class: 'small muted', text: 'Memuat Coin & Diamond…' }),
        ]),
      );
      return;
    }

    host.replaceChildren(
      hero(wallet),
      exchangeSection(wallet),
      earnSection(earnSlot),
      historySection(wallet),
    );
    paintEarn();
  };

  ctx.onCleanup(playerStore.subscribe(paint));
  ctx.onCleanup(rewardsStore.subscribe(paintEarn));

  paint(playerStore.getState());
  paintEarn();
  void playerStore.loadWallet();
  void rewardsStore.loadQuests();
}

export { meta };
