import type { PageModule } from '../app/router';
import { avatar } from '../components/avatar';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { socialService } from '../services/social.service';
import type {
  ActiveEvent,
  LeaderboardPayload,
  LeaguePayload,
  LeagueResultSummary,
} from '../types/social';
import { el, formatDate, formatNumber } from '../utils/dom';

const meta = { title: 'Liga & Peringkat' };

type Mode = 'league' | 'friends' | 'global';

const OUTCOME_LABEL: Record<LeagueResultSummary['outcome'], string> = {
  promoted: 'Naik liga',
  stayed: 'Tetap',
  demoted: 'Turun liga',
};

function errorCard(message: string, retry: () => void): HTMLElement {
  const button = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
    icon('refresh', 18),
    'Coba lagi',
  ]);
  button.addEventListener('click', retry);
  return el('div', { class: 'card empty-state' }, [
    el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
    el('h2', { class: 'empty-state__title', text: 'Data belum dapat dimuat' }),
    el('p', { class: 'empty-state__body', text: message }),
    button,
  ]);
}

function progressBar(value: number, target: number, label: string): HTMLElement {
  const fill = el('span', { class: 'progress__bar' });
  fill.style.width = `${target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0}%`;
  return el(
    'div',
    {
      class: 'progress',
      attrs: {
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': '0',
        'aria-valuemax': String(target),
        'aria-valuenow': String(Math.min(value, target)),
      },
    },
    [fill],
  );
}

function resultLine(result: LeagueResultSummary | null): HTMLElement | null {
  if (!result) return null;
  return el('div', { class: 'league-result' }, [
    el('span', { class: 'league-result__icon' }, [icon('trophy', 20)]),
    el('div', {}, [
      el('p', {
        class: 'league-result__title',
        text: `Minggu lalu: #${result.rank} dari ${result.memberCount}`,
      }),
      el('p', {
        class: 'league-result__body',
        text: `${OUTCOME_LABEL[result.outcome]} · hadiah ${formatNumber(result.rewardCoins)} Koin`,
      }),
    ]),
    result.claimed
      ? el('span', { class: 'badge badge--muted', text: 'Sudah diklaim' })
      : null,
  ]);
}

function leagueCard(
  league: LeaguePayload,
  onClaim: () => Promise<void>,
): HTMLElement {
  const claim = el('button', { class: 'btn btn--sm', attrs: { type: 'button' } }, [
    icon('gift', 16),
    'Klaim hadiah liga',
  ]);
  claim.disabled = !league.canClaimReward || !league.previousResult;
  claim.addEventListener('click', () => {
    if (claim.disabled) return;
    claim.disabled = true;
    claim.replaceChildren(el('span', { class: 'btn__spinner' }), 'Mengklaim…');
    void onClaim().finally(() => {
      claim.replaceChildren(icon('gift', 16), 'Klaim hadiah liga');
    });
  });

  const viewerRow = league.members.find((member) => member.isViewer);
  const rankLabel = viewerRow
    ? `#${viewerRow.rank} dari ${league.memberCount}`
    : `#${league.rank} dari ${league.memberCount}`;

  return el('div', { class: 'league' }, [
    el(
      'div',
      { class: 'league__hero', style: { borderColor: league.accent } },
      [
        el('div', { class: 'league__badge', style: { background: league.accent } }, [
          icon('trophy', 26),
        ]),
        el('div', { class: 'league__copy' }, [
          el('p', { class: 'league__eyebrow', text: 'Liga mingguan' }),
          el('h2', { class: 'league__title', text: league.tierName }),
          el('p', {
            class: 'league__meta',
            text: `${rankLabel} · ${formatNumber(league.weeklyXp)} XP minggu ini`,
          }),
        ]),
        el('div', { class: 'league__countdown' }, [
          el('span', { class: 'small muted', text: 'Berakhir' }),
          el('strong', { text: formatDate(league.endsAt) }),
        ]),
      ],
    ),
    el('div', { class: 'league__zones' }, [
      el('span', { class: 'badge badge--green' }, [
        icon('arrow-right', 13),
        `${league.promotionCount} teratas naik liga`,
      ]),
      league.demotionCount > 0
        ? el('span', { class: 'badge badge--warm' }, [
            icon('arrow-left', 13),
            `${league.demotionCount} terbawah turun liga (min. 10 pemain)`,
          ])
        : el('span', { class: 'badge badge--muted', text: 'Liga tertinggi' }),
    ]),
    el(
      'ol',
      { class: 'league__members', attrs: { 'aria-label': 'Peringkat liga' } },
      league.members.map((member) =>
        el(
          'li',
          {
            class: `league-row${member.isViewer ? ' league-row--viewer' : ''}${
              member.rank <= league.promotionCount && league.tier < 10
                ? ' league-row--promote'
                : ''
            }`,
          },
          [
            el('span', { class: 'league-row__rank', text: `#${member.rank}` }),
            avatar(member.avatarKey, 'sm'),
            el('a', {
              class: 'league-row__name',
              attrs: { href: `/players/${encodeURIComponent(member.username)}` },
              text: member.displayName,
            }),
            el('span', {
              class: 'league-row__xp',
              text: `${formatNumber(member.weeklyXp)} XP`,
            }),
          ],
        ),
      ),
    ),
    resultLine(league.previousResult),
    league.canClaimReward ? claim : null,
    league.history.length > 0
      ? el('details', { class: 'league__history' }, [
          el('summary', { text: 'Riwayat liga' }),
          el(
            'ul',
            { class: 'league__history-list' },
            league.history.map((item) =>
              el('li', {}, [
                el('span', { text: formatDate(item.weekStart) }),
                el('span', {
                  text: `#${item.rank} · ${item.tierName ?? `Tier ${item.tier}`} · ${
                    OUTCOME_LABEL[item.outcome]
                  }`,
                }),
              ]),
            ),
          ),
        ])
      : null,
  ]);
}

function eventCard(
  event: ActiveEvent,
  onClaim: () => Promise<void>,
): HTMLElement {
  const claim = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
    icon('gift', 16),
    event.claimed
      ? 'Hadiah event sudah diklaim'
      : event.canClaim
        ? `Klaim ${formatNumber(event.rewardCoins)} Koin`
        : 'Belum mencapai target',
  ]);
  claim.disabled = event.claimed || !event.canClaim;
  claim.addEventListener('click', () => {
    if (claim.disabled) return;
    claim.disabled = true;
    claim.replaceChildren(el('span', { class: 'btn__spinner' }), 'Mengklaim…');
    void onClaim().finally(() => {
      claim.replaceChildren(icon('gift', 16), 'Hadiah event');
    });
  });

  return el('section', { class: 'card event-card' }, [
    el('div', { class: 'event-card__top' }, [
      el('span', { class: 'event-card__icon' }, [icon('sparkles', 22)]),
      el('div', {}, [
        el('p', { class: 'event-card__eyebrow', text: 'Event mingguan' }),
        el('h2', { class: 'event-card__title', text: event.title }),
        el('p', { class: 'event-card__body', text: event.description }),
      ]),
    ]),
    el('div', { class: 'event-card__progress' }, [
      el('span', {
        text: `${formatNumber(event.progress)} / ${formatNumber(event.targetXp)} XP`,
      }),
      el('span', { text: `${formatNumber(event.rewardCoins)} Koin` }),
    ]),
    progressBar(event.progress, event.targetXp, `Progres ${event.title}`),
    claim,
  ]);
}

function boardRows(payload: LeaderboardPayload): HTMLElement {
  if (payload.entries.length === 0) {
    return el('div', { class: 'card empty-state' }, [
      el('span', { class: 'empty-state__art' }, [icon('trophy', 34)]),
      el('h2', { class: 'empty-state__title', text: 'Belum ada XP minggu ini' }),
      el('p', {
        class: 'empty-state__body',
        text:
          payload.scope === 'friends'
            ? 'Ajak teman belajar atau selesaikan satu lesson untuk membuka peringkat.'
            : 'Selesaikan lesson atau latihan untuk masuk papan peringkat.',
      }),
    ]);
  }

  const inTop = payload.entries.some((entry) => entry.isViewer);
  return el('div', {}, [
    el(
      'ol',
      { class: 'board', attrs: { 'aria-label': 'Papan peringkat mingguan' } },
      payload.entries.map((entry) =>
        el(
          'li',
          {
            class: `board-row${entry.isViewer ? ' board-row--viewer' : ''}`,
          },
          [
            el('span', {
              class: `board-row__rank${entry.rank <= 3 ? ` board-row__rank--${entry.rank}` : ''}`,
              text: `#${entry.rank}`,
            }),
            avatar(entry.avatarKey, 'sm'),
            el('span', { class: 'board-row__meta' }, [
              el('a', {
                class: 'board-row__name',
                attrs: { href: `/players/${encodeURIComponent(entry.username)}` },
                text: entry.displayName,
              }),
              el('span', {
                class: 'board-row__handle',
                text: `@${entry.username}${entry.isFriend ? ' · teman' : ''}`,
              }),
            ]),
            el('span', {
              class: 'board-row__xp',
              text: `${formatNumber(entry.weeklyXp)} XP`,
            }),
          ],
        ),
      ),
    ),
    !inTop && payload.viewer
      ? el('div', { class: 'board-viewer' }, [
          el('span', { text: `Posisimu #${payload.viewer.rank}` }),
          el('strong', { text: `${formatNumber(payload.viewer.weeklyXp)} XP` }),
        ])
      : null,
  ]);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  let mode: Mode = 'league';
  let disposed = false;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const leagueTab = el('button', {
    class: 'segmented__item',
    attrs: { type: 'button', 'aria-pressed': 'true' },
    text: 'Liga',
  });
  const friendsTab = el('button', {
    class: 'segmented__item',
    attrs: { type: 'button', 'aria-pressed': 'false' },
    text: 'Teman',
  });
  const globalTab = el('button', {
    class: 'segmented__item',
    attrs: { type: 'button', 'aria-pressed': 'false' },
    text: 'Global',
  });
  const tabs = el(
    'div',
    { class: 'segmented', attrs: { role: 'group', 'aria-label': 'Jenis peringkat' } },
    [leagueTab, friendsTab, globalTab],
  );

  const slot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat liga…' }),
  ]);

  const setActive = () => {
    for (const [key, button] of [
      ['league', leagueTab],
      ['friends', friendsTab],
      ['global', globalTab],
    ] as const) {
      button.setAttribute('aria-pressed', String(mode === key));
    }
  };

  const loadLeague = () => {
    slot.className = 'loading-screen';
    slot.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Memuat liga…' }));
    void Promise.all([socialService.getMyLeague(), socialService.getActiveEvent()])
      .then(([league, event]) => {
        if (disposed || !slot.isConnected) return;
        slot.className = '';
        slot.replaceChildren(
          leagueCard(league, async () => {
            if (!league.previousResult) return;
            try {
              const result = await socialService.claimLeagueReward(
                league.previousResult.weekStart,
              );
              if (disposed) return;
              showToast(
                result.alreadyClaimed
                  ? 'Hadiah liga ini sudah kamu klaim.'
                  : `Hadiah liga diterima: +${formatNumber(result.coinsAwarded)} Koin.`,
                result.alreadyClaimed ? 'default' : 'success',
              );
              loadLeague();
            } catch (error) {
              showToast(error instanceof Error ? error.message : 'Klaim liga gagal.', 'error');
            }
          }),
          eventCard(event, async () => {
            try {
              const result = await socialService.claimEventReward();
              if (disposed) return;
              showToast(
                result.alreadyClaimed
                  ? 'Hadiah event ini sudah kamu klaim.'
                  : `Hadiah event diterima: +${formatNumber(result.coinsAwarded)} Koin.`,
                result.alreadyClaimed ? 'default' : 'success',
              );
              loadLeague();
            } catch (error) {
              showToast(error instanceof Error ? error.message : 'Klaim event gagal.', 'error');
            }
          }),
        );
      })
      .catch((error: unknown) => {
        if (disposed || !slot.isConnected) return;
        slot.className = '';
        slot.replaceChildren(
          errorCard(
            error instanceof Error ? error.message : 'Liga gagal dimuat.',
            loadLeague,
          ),
        );
      });
  };

  const loadBoard = (scope: 'friends' | 'global') => {
    slot.className = 'loading-screen';
    slot.replaceChildren(
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat peringkat…' }),
    );
    void socialService
      .getLeaderboard(scope)
      .then((payload) => {
        if (disposed || !slot.isConnected) return;
        slot.className = '';
        slot.replaceChildren(
          el('p', {
            class: 'board-week',
            text: `Minggu ${formatDate(payload.weekStart)} — XP dari lesson dan latihan dihitung otomatis.`,
          }),
          boardRows(payload),
        );
      })
      .catch((error: unknown) => {
        if (disposed || !slot.isConnected) return;
        slot.className = '';
        slot.replaceChildren(
          errorCard(
            error instanceof Error ? error.message : 'Peringkat gagal dimuat.',
            () => loadBoard(scope),
          ),
        );
      });
  };

  const load = () => {
    setActive();
    if (mode === 'league') loadLeague();
    else loadBoard(mode);
  };

  leagueTab.addEventListener('click', () => {
    mode = 'league';
    load();
  });
  friendsTab.addEventListener('click', () => {
    mode = 'friends';
    load();
  });
  globalTab.addEventListener('click', () => {
    mode = 'global';
    load();
  });

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Tahap 7 · sosial',
      title: 'Liga & Peringkat',
      subtitle:
        'Naik liga lewat XP mingguan, bandingkan dengan teman, dan klaim hadiah periode sebelum minggu berganti.',
      actions: [
        el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/friends' } }, [
          icon('users', 16),
          'Teman',
        ]),
      ],
    }),
    tabs,
    slot,
  ]);

  renderAppLayout(ctx, { active: 'leaderboard', title: 'Liga & Peringkat', content });
  load();
}

export { meta, render };
