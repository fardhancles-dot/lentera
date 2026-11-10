import type { PageModule } from '../app/router';
import { avatar } from '../components/avatar';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { developerService } from '../services/developer.service';
import type {
  AuditLogEntry,
  DeveloperOverview,
  DeveloperUser,
} from '../types/developer';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Developer Dashboard' };

const ROLE_LABEL = {
  player: 'Pemain',
  admin: 'Admin',
  developer: 'Developer',
} as const;

const ACTION_LABEL: Record<string, string> = {
  reward_grant: 'Hadiah dikirim',
  broadcast_notification: 'Broadcast',
};

function metricCard(
  label: string,
  value: string,
  note: string,
  iconName: Parameters<typeof icon>[0],
): HTMLElement {
  return el('div', { class: 'dev-metric' }, [
    el('span', { class: 'dev-metric__icon' }, [icon(iconName, 20)]),
    el('span', { class: 'dev-metric__label', text: label }),
    el('strong', { class: 'dev-metric__value', text: value }),
    el('span', { class: 'dev-metric__note', text: note }),
  ]);
}

function metrics(overview: DeveloperOverview): HTMLElement {
  return el('div', { class: 'dev-metrics' }, [
    metricCard(
      'Pemain',
      formatNumber(overview.players.total),
      `${formatNumber(overview.players.onboarded)} onboarded · ${formatNumber(overview.players.new7d)} baru 7 hari`,
      'users',
    ),
    metricCard(
      'Staff',
      formatNumber(overview.players.staff),
      'Developer dan admin',
      'shield',
    ),
    metricCard(
      'XP diberikan',
      formatNumber(overview.activity.xpAwarded),
      `${formatNumber(overview.activity.lessonsCompleted)} lesson selesai`,
      'sparkles',
    ),
    metricCard(
      'Koin beredar',
      formatNumber(overview.activity.coinsCirculating),
      `${formatNumber(overview.activity.activeStreaks)} streak aktif`,
      'coin',
    ),
    metricCard(
      'Latihan',
      formatNumber(overview.activity.practicesCompleted),
      'Sesi latihan selesai',
      'target',
    ),
    metricCard(
      'Konten',
      formatNumber(overview.content.questions),
      `${formatNumber(overview.content.lessons)} lesson · ${formatNumber(overview.content.nodes)} node`,
      'book',
    ),
  ]);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function detailsText(details: Record<string, unknown>): string {
  const entries = Object.entries(details).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  );
  if (entries.length === 0) return 'Tanpa detail';
  return entries
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

function auditRow(entry: AuditLogEntry): HTMLElement {
  const details = entry.details && typeof entry.details === 'object' && !Array.isArray(entry.details)
    ? (entry.details as Record<string, unknown>)
    : {};
  return el('li', { class: 'audit-row' }, [
    el('span', { class: 'audit-row__dot' }),
    el('div', { class: 'audit-row__body' }, [
      el('div', { class: 'audit-row__head' }, [
        el('strong', { text: ACTION_LABEL[entry.action] ?? entry.action }),
        el('span', { class: 'badge badge--muted', text: ROLE_LABEL[entry.actorRole] }),
        el('span', { class: 'audit-row__time', text: formatDateTime(entry.createdAt) }),
      ]),
      el('p', {
        class: 'audit-row__meta',
        text: `${entry.actorName}${entry.actorUsername ? ` (@${entry.actorUsername})` : ''} · ${entry.targetType}${
          entry.targetId ? ` ${entry.targetId.slice(0, 8)}…` : ''
        }`,
      }),
      el('p', { class: 'audit-row__details', text: detailsText(details) }),
    ]),
  ]);
}

function field(label: string, control: HTMLElement, hint?: string): HTMLElement {
  return el('label', { class: 'dev-field' }, [
    el('span', { class: 'dev-field__label', text: label }),
    control,
    hint ? el('span', { class: 'form-hint', text: hint }) : null,
  ]);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  let disposed = false;
  let selected: DeveloperUser | null = null;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const overviewSlot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat ringkasan…' }),
  ]);
  const usersSlot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat pemain…' }),
  ]);
  const auditSlot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat audit log…' }),
  ]);
  const selectedSlot = el('div', { class: 'dev-selected dev-selected--empty' }, [
    icon('user', 16),
    'Pilih pemain dari daftar di atas.',
  ]);

  const searchInput = el('input', {
    class: 'input',
    attrs: {
      type: 'search',
      name: 'developer-search',
      placeholder: 'Cari email, username, atau nama…',
      'aria-label': 'Cari pemain untuk developer',
      autocomplete: 'off',
    },
  });
  const searchButton = el('button', { class: 'btn btn--sm', attrs: { type: 'submit' } }, [
    icon('eye', 16),
    'Cari',
  ]);
  const searchForm = el('form', { class: 'dev-search' }, [searchInput, searchButton]);

  const coinsInput = el('input', {
    class: 'input',
    attrs: {
      type: 'number',
      name: 'reward-coins',
      min: '0',
      max: '10000',
      value: '0',
      inputmode: 'numeric',
    },
  });
  const xpInput = el('input', {
    class: 'input',
    attrs: {
      type: 'number',
      name: 'reward-xp',
      min: '0',
      max: '100000',
      value: '0',
      inputmode: 'numeric',
    },
  });
  const reasonInput = el('input', {
    class: 'input',
    attrs: {
      type: 'text',
      name: 'reward-reason',
      minlength: '3',
      maxlength: '160',
      placeholder: 'Contoh: hadiah acara komunitas',
    },
  });
  const grantButton = el('button', { class: 'btn', attrs: { type: 'submit' } }, [
    icon('gift', 16),
    'Kirim hadiah',
  ]);
  const rewardForm = el('form', { class: 'dev-form' }, [
    selectedSlot,
    el('div', { class: 'dev-form__row' }, [
      field('Koin', coinsInput),
      field('XP', xpInput),
    ]),
    field('Alasan', reasonInput, 'Wajib 3–160 karakter dan tercatat di audit log.'),
    grantButton,
  ]);

  const broadcastTitle = el('input', {
    class: 'input',
    attrs: {
      type: 'text',
      name: 'broadcast-title',
      minlength: '3',
      maxlength: '80',
      placeholder: 'Judul notifikasi',
    },
  });
  const broadcastBody = el('textarea', {
    class: 'input dev-textarea',
    attrs: {
      name: 'broadcast-body',
      maxlength: '300',
      rows: '3',
      placeholder: 'Isi singkat untuk semua pemain onboarded…',
    },
  });
  const broadcastLink = el('input', {
    class: 'input',
    attrs: {
      type: 'text',
      name: 'broadcast-link',
      maxlength: '200',
      value: '/app',
      placeholder: '/app',
    },
  });
  const broadcastButton = el('button', { class: 'btn btn--secondary', attrs: { type: 'submit' } }, [
    icon('bell', 16),
    'Kirim broadcast',
  ]);
  const broadcastForm = el('form', { class: 'dev-form' }, [
    field('Judul', broadcastTitle),
    field('Isi', broadcastBody, 'Maksimal 300 karakter.'),
    field('Tautan', broadcastLink, 'Path internal, contoh /app atau /leaderboard.'),
    broadcastButton,
  ]);

  const loadOverview = () => {
    overviewSlot.className = 'loading-screen';
    overviewSlot.replaceChildren(
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat ringkasan…' }),
    );
    void developerService
      .getOverview()
      .then((overview) => {
        if (disposed || !overviewSlot.isConnected) return;
        overviewSlot.className = '';
        overviewSlot.replaceChildren(metrics(overview));
      })
      .catch((error: unknown) => {
        if (disposed || !overviewSlot.isConnected) return;
        overviewSlot.className = '';
        overviewSlot.replaceChildren(
          el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
            icon('alert', 18),
            el('span', {
              text: error instanceof Error ? error.message : 'Ringkasan gagal dimuat.',
            }),
          ]),
        );
      });
  };

  const paintUsers = (users: DeveloperUser[]) => {
    usersSlot.className = '';
    if (users.length === 0) {
      usersSlot.replaceChildren(
        el('p', { class: 'form-hint', text: 'Tidak ada pemain yang cocok.' }),
      );
      return;
    }

    usersSlot.replaceChildren(
      el(
        'ul',
        { class: 'dev-user-list' },
        users.map((user) =>
          el('li', { class: 'dev-user' }, [
            avatar(user.avatarKey, 'sm'),
            el('span', { class: 'dev-user__meta' }, [
              el('strong', { text: user.displayName }),
              el('span', { class: 'dev-user__handle', text: `@${user.username} · ${user.email}` }),
              el('span', {
                class: 'dev-user__stats',
                text: `${formatNumber(user.totalXp)} XP · ${formatNumber(user.coins)} Koin · ${
                  user.onboardingCompleted ? 'onboarded' : 'belum onboarding'
                }`,
              }),
            ]),
            el('span', { class: 'badge badge--muted', text: ROLE_LABEL[user.role] }),
            el('button', {
              class: 'btn btn--secondary btn--sm',
              attrs: { type: 'button' },
              text: selected?.userId === user.userId ? 'Dipilih' : 'Pilih',
              events: {
                click: (event) => {
                  const button = event.currentTarget as HTMLButtonElement;
                  selected = user;
                  selectedSlot.className = 'dev-selected';
                  selectedSlot.replaceChildren(
                    icon('user', 16),
                    el('span', {}, [
                      el('strong', { text: user.displayName }),
                      ' ',
                      el('span', { class: 'muted', text: `@${user.username}` }),
                    ]),
                  );
                  for (const buttonElement of usersSlot.querySelectorAll('button')) {
                    buttonElement.textContent = 'Pilih';
                  }
                  button.textContent = 'Dipilih';
                },
              },
            }),
          ]),
        ),
      ),
    );
  };

  const loadUsers = (query: string) => {
    usersSlot.className = 'loading-screen';
    usersSlot.replaceChildren(
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat pemain…' }),
    );
    void developerService
      .getUsers(query)
      .then((users) => {
        if (disposed || !usersSlot.isConnected) return;
        paintUsers(users);
      })
      .catch((error: unknown) => {
        if (disposed || !usersSlot.isConnected) return;
        usersSlot.className = '';
        usersSlot.replaceChildren(
          el('p', {
            class: 'form-error',
            text: error instanceof Error ? error.message : 'Pemain gagal dimuat.',
          }),
        );
      });
  };

  const loadAudit = () => {
    auditSlot.className = 'loading-screen';
    auditSlot.replaceChildren(
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat audit log…' }),
    );
    void developerService
      .getAuditLogs(30)
      .then((entries) => {
        if (disposed || !auditSlot.isConnected) return;
        auditSlot.className = '';
        auditSlot.replaceChildren(
          entries.length > 0
            ? el('ul', { class: 'audit-list' }, entries.map(auditRow))
            : el('p', { class: 'form-hint', text: 'Belum ada aksi staff yang tercatat.' }),
        );
      })
      .catch((error: unknown) => {
        if (disposed || !auditSlot.isConnected) return;
        auditSlot.className = '';
        auditSlot.replaceChildren(
          el('p', {
            class: 'form-error',
            text: error instanceof Error ? error.message : 'Audit log gagal dimuat.',
          }),
        );
      });
  };

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loadUsers(searchInput.value);
  });

  rewardForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!selected) {
      showToast('Pilih pemain terlebih dahulu.', 'error');
      return;
    }

    grantButton.disabled = true;
    grantButton.replaceChildren(el('span', { class: 'btn__spinner' }), 'Mengirim…');
    void developerService
      .grantReward(
        selected.userId,
        Number(coinsInput.value) || 0,
        Number(xpInput.value) || 0,
        reasonInput.value.trim(),
      )
      .then((result) => {
        if (disposed) return;
        showToast(
          `Hadiah terkirim ke @${selected?.username ?? 'pemain'}: +${formatNumber(
            result.coinsAwarded,
          )} Koin, +${formatNumber(result.xpAwarded)} XP.`,
          'success',
        );
        coinsInput.value = '0';
        xpInput.value = '0';
        reasonInput.value = '';
        loadOverview();
        loadUsers(searchInput.value);
        loadAudit();
      })
      .catch((error: unknown) => {
        if (!disposed) {
          showToast(error instanceof Error ? error.message : 'Hadiah gagal dikirim.', 'error');
        }
      })
      .finally(() => {
        if (!disposed) {
          grantButton.disabled = false;
          grantButton.replaceChildren(icon('gift', 16), 'Kirim hadiah');
        }
      });
  });

  broadcastForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!window.confirm('Kirim notifikasi ini ke semua pemain onboarded (maksimal 500)?')) {
      return;
    }

    broadcastButton.disabled = true;
    broadcastButton.replaceChildren(el('span', { class: 'btn__spinner' }), 'Mengirim…');
    void developerService
      .broadcast(broadcastTitle.value.trim(), broadcastBody.value.trim(), broadcastLink.value.trim())
      .then((result) => {
        if (disposed) return;
        showToast(`Broadcast terkirim ke ${formatNumber(result.recipients)} pemain.`, 'success');
        broadcastTitle.value = '';
        broadcastBody.value = '';
        loadOverview();
        loadAudit();
      })
      .catch((error: unknown) => {
        if (!disposed) {
          showToast(error instanceof Error ? error.message : 'Broadcast gagal dikirim.', 'error');
        }
      })
      .finally(() => {
        if (!disposed) {
          broadcastButton.disabled = false;
          broadcastButton.replaceChildren(icon('bell', 16), 'Kirim broadcast');
        }
      });
  });

  const refresh = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
    icon('refresh', 16),
    'Muat ulang',
  ]);
  refresh.addEventListener('click', () => {
    loadOverview();
    loadUsers(searchInput.value);
    loadAudit();
  });

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Tahap 8 · staff',
      title: 'Developer Dashboard',
      subtitle:
        'Ringkasan pemain, Reward Center satu akun, broadcast, dan audit log. Semua aksi diverifikasi role di server.',
      actions: [refresh],
    }),
    overviewSlot,
    el('div', { class: 'dev-grid' }, [
      el('section', { class: 'card dev-panel' }, [
        el('h2', { class: 'card__title', text: 'Cari pemain' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Cari berdasarkan email, username, atau nama tampilan. Maksimal 25 hasil terbaru.',
        }),
        searchForm,
        usersSlot,
      ]),
      el('section', { class: 'card dev-panel' }, [
        el('h2', { class: 'card__title', text: 'Reward Center' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Kirim Koin dan/atau XP ke satu pemain. Setiap hadiah masuk ledger dan audit log.',
        }),
        rewardForm,
      ]),
    ]),
    el('section', { class: 'card dev-panel' }, [
      el('h2', { class: 'card__title', text: 'Broadcast notifikasi' }),
      el('p', {
        class: 'card__subtitle',
        text: 'Notifikasi masuk ke inbox pemain onboarded. Tidak memberi Koin atau XP.',
      }),
      broadcastForm,
    ]),
    el('section', { class: 'card dev-panel' }, [
      el('div', { class: 'dev-panel__head' }, [
        el('div', {}, [
          el('h2', { class: 'card__title', text: 'Audit log' }),
          el('p', {
            class: 'card__subtitle',
            text: 'Append-only: hanya RPC staff yang menulis, pemain tidak dapat membaca atau mengubahnya.',
          }),
        ]),
      ]),
      auditSlot,
    ]),
  ]);

  renderAppLayout(ctx, { active: 'developer', title: 'Developer Dashboard', content });
  loadOverview();
  loadUsers('');
  loadAudit();
}

export { meta, render };
