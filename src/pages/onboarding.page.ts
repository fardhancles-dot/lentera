import type { PageModule } from '../app/router';
import { AVATAR_KEYS, AVATAR_LABELS, avatarMarkup, isAvatarKey } from '../components/avatar';
import { createButton, createField } from '../components/forms';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { lampMarkup } from '../components/brandArt';
import { brand } from '../config/brand';
import { profileService } from '../services/profile.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';
import {
  DAILY_GOAL_OPTIONS,
  TIMEZONE_OPTIONS,
  suggestUsername,
  validateDisplayName,
  validateUsername,
} from '../utils/validation';

const meta = { title: 'Kenalan dulu' };
const TOTAL_STEPS = 3;

async function render(ctx: Parameters<PageModule['render']>[0]): Promise<void> {
  const user = sessionStore.getState().user;
  if (!user) return;

  const defaultUsername =
    user.profile.username.startsWith('player_') && !user.profile.onboarding_completed
      ? suggestUsername(user.email)
      : user.profile.username;

  const state = {
    step: 0,
    username: defaultUsername,
    displayName: user.profile.display_name || defaultUsername,
    avatarKey: isAvatarKey(user.profile.avatar_key) ? user.profile.avatar_key : 'sprout',
    dailyGoal: user.settings.daily_goal_minutes,
    timezone: user.settings.timezone,
    error: '',
  };

  const logout = el(
    'button',
    {
      class: 'btn btn--ghost btn--sm',
      attrs: { type: 'button' },
      events: {
        click: () => {
          void (async () => {
            await sessionStore.signOut();
            ctx.navigate('/login', { replace: true });
          })();
        },
      },
    },
    [icon('logout', 16), 'Keluar'],
  );

  const stepsEl = el(
    'div',
    { class: 'onboarding__steps', attrs: { 'aria-label': `Langkah 1 dari ${TOTAL_STEPS}` } },
    Array.from({ length: TOTAL_STEPS }, (_, index) =>
      el('span', { class: 'onboarding__step-dot', dataset: { active: String(index === 0) } }),
    ),
  );

  const card = el('div', { class: 'onboarding__card card' });

  const root = el('div', { class: 'onboarding' }, [
    el('div', { class: 'onboarding__top' }, [
      el('a', { class: 'brand', attrs: { href: '/' } }, [
        el('span', { class: 'brand__mark', html: lampMarkup(30) }),
        el('span', { class: 'brand__text' }, [
          el('span', { class: 'brand__name', text: brand.name }),
          el('span', { class: 'brand__tag', text: 'Profil awal' }),
        ]),
      ]),
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' } }, [
        stepsEl,
        logout,
      ]),
    ]),
    card,
  ]);

  ctx.outlet.append(root);

  const updateSteps = () => {
    stepsEl.setAttribute('aria-label', `Langkah ${state.step + 1} dari ${TOTAL_STEPS}`);
    stepsEl.querySelectorAll<HTMLElement>('.onboarding__step-dot').forEach((dot, index) => {
      dot.dataset.active = String(index === state.step);
    });
  };

  const renderStepOne = () => {
    updateSteps();
    const usernameField = createField({
      label: 'Username',
      name: 'username',
      placeholder: 'contoh: kiko_belajar',
      value: state.username,
      autocomplete: 'username',
      hint: '3–20 karakter. Huruf kecil, angka, atau garis bawah.',
      maxLength: 20,
      required: true,
    });

    const displayField = createField({
      label: 'Nama tampilan',
      name: 'displayName',
      placeholder: 'Nama yang dilihat pemain lain',
      value: state.displayName,
      autocomplete: 'nickname',
      maxLength: 40,
      required: true,
    });

    const avatarGrid = el(
      'div',
      { class: 'onboarding__avatar-grid', attrs: { role: 'group', 'aria-label': 'Pilih avatar' } },
      AVATAR_KEYS.map((key) => {
        const button = el(
          'button',
          {
            class: 'avatar-option',
            attrs: {
              type: 'button',
              'aria-label': `Avatar ${AVATAR_LABELS[key]}`,
              'aria-pressed': String(state.avatarKey === key),
            },
          },
          [el('span', { html: avatarMarkup(key, 64) })],
        );

        button.addEventListener('click', () => {
          state.avatarKey = key;
          avatarGrid.querySelectorAll<HTMLElement>('.avatar-option').forEach((option) => {
            option.setAttribute(
              'aria-pressed',
              String(option.getAttribute('aria-label') === `Avatar ${AVATAR_LABELS[key]}`),
            );
          });
        });

        return button;
      }),
    );

    const errorSlot = el('div');
    const next = createButton({ label: 'Lanjut', size: 'lg' });
    const back = createButton({ label: 'Kembali', variant: 'ghost', size: 'lg' });
    back.button.style.visibility = 'hidden';

    card.replaceChildren(
      el('span', { class: 'onboarding__step-label', text: `Langkah 1 dari ${TOTAL_STEPS}` }),
      el('h1', { class: 'onboarding__title', text: 'Kenalan dulu, yuk' }),
      el('p', {
        class: 'onboarding__subtitle',
        text: 'Pilih avatar dan nama yang akan menemani perjalanan belajarmu.',
      }),
      el('div', { class: 'onboarding__body' }, [
        state.error
          ? el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
              icon('alert', 18),
              el('span', { text: state.error }),
            ])
          : null,
        el('p', { class: 'field__label', text: 'Avatar' }),
        avatarGrid,
        usernameField.root,
        displayField.root,
        errorSlot,
        devNote(),
      ]),
      el('div', { class: 'onboarding__actions' }, [back.button, next.button]),
    );

    next.button.addEventListener('click', () => {
      usernameField.setError();
      displayField.setError();
      errorSlot.replaceChildren();
      state.error = '';

      const username = validateUsername(usernameField.value());
      const displayName = validateDisplayName(displayField.value());
      if (!username.ok) {
        usernameField.setError(username.message);
        usernameField.input.focus();
        return;
      }
      if (!displayName.ok) {
        displayField.setError(displayName.message);
        displayField.input.focus();
        return;
      }

      state.username = username.value;
      state.displayName = displayName.value;
      state.error = '';
      state.step = 1;
      renderStepTwo();
    });

    usernameField.input.addEventListener('input', () => {
      state.username = usernameField.input.value;
    });
    displayField.input.addEventListener('input', () => {
      state.displayName = displayField.input.value;
    });

    next.button.focus({ preventScroll: true });
  };

  const renderStepTwo = () => {
    updateSteps();
    const goalGrid = el(
      'div',
      { class: 'choice-grid', attrs: { role: 'group', 'aria-label': 'Target belajar harian' } },
      DAILY_GOAL_OPTIONS.map((option) => {
        const button = el(
          'button',
          {
            class: 'choice',
            attrs: {
              type: 'button',
              'aria-pressed': String(state.dailyGoal === option.minutes),
              'aria-label': `${option.title}, ${option.description}`,
            },
          },
          [
            el('span', { class: 'choice__title', text: option.title }),
            el('span', { class: 'choice__meta', text: option.description }),
          ],
        );

        button.addEventListener('click', () => {
          state.dailyGoal = option.minutes;
          goalGrid.querySelectorAll<HTMLElement>('.choice').forEach((choice) => {
            choice.setAttribute(
              'aria-pressed',
              String(choice.getAttribute('aria-label') === `${option.title}, ${option.description}`),
            );
          });
        });

        return button;
      }),
    );

    const timezoneSelect = el(
      'select',
      { class: 'select', attrs: { id: 'timezone', name: 'timezone' } },
      TIMEZONE_OPTIONS.map((option) =>
        el(
          'option',
          { attrs: { value: option.value, selected: option.value === state.timezone } },
          [option.label],
        ),
      ),
    );

    if (!TIMEZONE_OPTIONS.some((option) => option.value === state.timezone)) {
      state.timezone = 'Asia/Jakarta';
      timezoneSelect.value = state.timezone;
    } else {
      timezoneSelect.value = state.timezone;
    }

    timezoneSelect.addEventListener('change', () => {
      state.timezone = timezoneSelect.value;
    });

    const back = createButton({ label: 'Kembali', variant: 'ghost', size: 'lg' });
    const next = createButton({ label: 'Lanjut', size: 'lg' });

    back.button.addEventListener('click', () => {
      state.step = 0;
      renderStepOne();
    });

    next.button.addEventListener('click', () => {
      state.step = 2;
      renderStepThree();
    });

    card.replaceChildren(
      el('span', { class: 'onboarding__step-label', text: `Langkah 2 dari ${TOTAL_STEPS}` }),
      el('h1', { class: 'onboarding__title', text: 'Atur ritme belajarmu' }),
      el('p', {
        class: 'onboarding__subtitle',
        text: 'Target yang realistis membuat kebiasaan belajar lebih mudah dijaga.',
      }),
      el('div', { class: 'onboarding__body' }, [
        goalGrid,
        el('div', { class: 'field' }, [
          el('label', { class: 'field__label', attrs: { for: 'timezone' } }, ['Zona waktu']),
          timezoneSelect,
          el('p', {
            class: 'field__hint',
            text: 'Dipakai untuk menghitung streak dan reset quest harian nanti.',
          }),
        ]),
      ]),
      el('div', { class: 'onboarding__actions' }, [back.button, next.button]),
    );

    next.button.focus({ preventScroll: true });
  };

  const renderStepThree = () => {
    updateSteps();
    const summary = el('div', { class: 'summary-list' }, [
      summaryRow('Username', `@${state.username}`),
      summaryRow('Nama tampilan', state.displayName),
      summaryRow(
        'Avatar',
        isAvatarKey(state.avatarKey) ? AVATAR_LABELS[state.avatarKey] : 'Tunas',
      ),
      summaryRow(
        'Target harian',
        `${state.dailyGoal} menit · ${
          DAILY_GOAL_OPTIONS.find((option) => option.minutes === state.dailyGoal)?.title ?? ''
        }`,
      ),
      summaryRow('Zona waktu', state.timezone.replace('_', ' ')),
    ]);

    const back = createButton({ label: 'Kembali', variant: 'ghost', size: 'lg' });
    const save = createButton({ label: 'Simpan & mulai', size: 'lg', icon: 'check' });
    const errorSlot = el('div');

    const avatarPreview = el('div', {
      html: avatarMarkup(state.avatarKey, 96),
      style: { width: '96px' },
    });

    back.button.addEventListener('click', () => {
      state.step = 1;
      renderStepTwo();
    });

    save.button.addEventListener('click', () => {
      errorSlot.replaceChildren();
      void (async () => {
        save.setLoading(true);
        const result = await profileService.completeOnboarding(user, {
          username: state.username,
          displayName: state.displayName,
          avatarKey: state.avatarKey,
          dailyGoalMinutes: state.dailyGoal,
          timezone: state.timezone,
        });

        if (!result.ok) {
          save.setLoading(false);
          if (result.field === 'username') {
            state.error = result.message;
            state.step = 0;
            renderStepOne();
            return;
          }
          errorSlot.append(
            el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
              icon('alert', 18),
              el('span', { text: result.message }),
            ]),
          );
          return;
        }

        sessionStore.setProfile(result.data);
        await sessionStore.refresh();
        showToast('Profil siap. Selamat datang di Lentera!', 'success');
        ctx.navigate('/app', { replace: true });
      })();
    });

    card.replaceChildren(
      el('span', { class: 'onboarding__step-label', text: `Langkah 3 dari ${TOTAL_STEPS}` }),
      el('h1', { class: 'onboarding__title', text: 'Semuanya siap' }),
      el('p', {
        class: 'onboarding__subtitle',
        text: 'Periksa sekali lagi. Semua ini bisa diubah nanti di halaman profil dan pengaturan.',
      }),
      el('div', { class: 'onboarding__body' }, [
        el('div', { style: { display: 'flex', justifyContent: 'center' } }, [avatarPreview]),
        summary,
        el('div', { class: 'banner banner--info' }, [
          icon('info', 18),
          el('div', {}, [
            el('p', { class: 'banner__title', text: 'Tahap berikutnya' }),
            el('p', {
              class: 'banner__body',
              text: 'Peta petualangan dan lesson akan muncul di beranda setelah kurikulum serta bank soal dibangun.',
            }),
          ]),
        ]),
        errorSlot,
      ]),
      el('div', { class: 'onboarding__actions' }, [back.button, save.button]),
    );

    save.button.focus({ preventScroll: true });
  };

  updateSteps();
  renderStepOne();
}

function summaryRow(label: string, value: string): HTMLElement {
  return el('div', { class: 'summary-list__row' }, [
    el('span', { class: 'summary-list__label', text: label }),
    el('span', { class: 'summary-list__value', text: value }),
  ]);
}

function devNote(): HTMLElement {
  return el('div', { class: 'banner banner--info' }, [
    icon('info', 18),
    el('div', {}, [
      el('p', { class: 'banner__title', text: 'Satu akun, banyak petualangan' }),
      el('p', {
        class: 'banner__body',
        text: 'Progres tiap mata pelajaran akan disimpan terpisah, jadi pindah mapel tidak menghapus progres.',
      }),
    ]),
  ]);
}

export { meta, render };
