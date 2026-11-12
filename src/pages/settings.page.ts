import type { PageModule } from '../app/router';
import { createButton } from '../components/forms';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { audioEngine } from '../game/audio/audioEngine';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';
import { DAILY_GOAL_OPTIONS, TIMEZONE_OPTIONS } from '../utils/validation';

const meta = { title: 'Pengaturan' };

interface SliderHandle {
  root: HTMLElement;
  value: () => number;
}

function sliderRow(
  label: string,
  description: string,
  initial: number,
  id: string,
): SliderHandle {
  const output = el('span', { class: 'range-row__value', text: `${initial}%` });

  const input = el('input', {
    attrs: {
      type: 'range',
      id,
      min: '0',
      max: '100',
      step: '5',
      value: String(initial),
      'aria-label': label,
    },
  });

  input.value = String(initial);
  input.addEventListener('input', () => {
    output.textContent = `${input.value}%`;
  });

  return {
    root: el('div', { class: 'range-row' }, [
      el('div', { class: 'range-row__top' }, [
        el('label', { attrs: { for: id } }, [
          el('span', { style: { fontWeight: '800', display: 'block' }, text: label }),
          el('span', { class: 'small muted', text: description }),
        ]),
        output,
      ]),
      input,
    ]),
    value: () => Number(input.value),
  };
}

function switchRow(
  label: string,
  description: string,
  initial: boolean,
  id: string,
): { root: HTMLElement; value: () => boolean } {
  const input = el('input', {
    attrs: { type: 'checkbox', id, 'aria-label': label },
  });
  input.checked = initial;

  return {
    root: el('label', { class: 'switch', attrs: { for: id } }, [
      el('span', { class: 'switch__copy' }, [
        el('span', { class: 'switch__title', text: label }),
        el('span', { class: 'switch__description', text: description }),
      ]),
      el('span', { class: 'switch__control' }, [input, el('span', { class: 'switch__track' })]),
    ]),
    value: () => input.checked,
  };
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const { settings, email, profile } = user;

  const goalSelect = el(
    'select',
    { class: 'select', attrs: { id: 'daily-goal' } },
    DAILY_GOAL_OPTIONS.map((option) =>
      el('option', { attrs: { value: String(option.minutes) } }, [
        `${option.title} — ${option.description}`,
      ]),
    ),
  );
  goalSelect.value = String(settings.daily_goal_minutes);

  const timezoneValues = TIMEZONE_OPTIONS.map((option) => option.value as string);
  const timezoneSelect = el(
    'select',
    { class: 'select', attrs: { id: 'timezone' } },
    TIMEZONE_OPTIONS.map((option) =>
      el('option', { attrs: { value: option.value } }, [option.label]),
    ),
  );
  if (!timezoneValues.includes(settings.timezone)) {
    timezoneSelect.append(
      el('option', { attrs: { value: settings.timezone } }, [settings.timezone.replace('_', ' ')]),
    );
  }
  timezoneSelect.value = settings.timezone;

  const localeSelect = el(
    'select',
    { class: 'select', attrs: { id: 'locale' } },
    [
      el('option', { attrs: { value: 'id' } }, ['Bahasa Indonesia']),
      el('option', { attrs: { value: 'en' } }, ['English']),
    ],
  );
  localeSelect.value = settings.locale;

  const visibilitySelect = el(
    'select',
    { class: 'select', attrs: { id: 'profile-visibility' } },
    [
      el('option', { attrs: { value: 'friends' } }, ['Teman saja']),
      el('option', { attrs: { value: 'public' } }, ['Semua pemain']),
      el('option', { attrs: { value: 'private' } }, ['Privat']),
    ],
  );
  visibilitySelect.value = settings.profile_visibility;

  const music = sliderRow(
    'Musik latar',
    'Mengatur volume musik saat berada di permainan.',
    settings.music_volume,
    'music-volume',
  );
  const sfx = sliderRow(
    'Efek suara',
    'Suara tombol, jawaban benar, dan notifikasi.',
    settings.sfx_volume,
    'sfx-volume',
  );
  const voice = sliderRow(
    'Suara karakter',
    'Volume dialog Kiko dan karakter cerita.',
    settings.voice_volume,
    'voice-volume',
  );
  const muteAudio = switchRow(
    'Bisukan semua suara',
    'Matikan musik dan efek suara di perangkat ini tanpa mengubah volume tersimpan.',
    audioEngine.isMuted(),
    'audio-muted',
  );
  const muteAudioInput = muteAudio.root.querySelector<HTMLInputElement>('input');
  muteAudioInput?.addEventListener('change', () => {
    audioEngine.setMuted(Boolean(muteAudioInput.checked));
  });

  const reducedMotion = switchRow(
    'Kurangi animasi',
    'Matikan animasi besar dan efek gerak saat menjelajah.',
    settings.reduced_motion,
    'reduced-motion',
  );
  const emailOptIn = switchRow(
    'Info lewat email',
    'Terima pengumuman dan hadiah melalui email jika layanan email aktif.',
    settings.email_opt_in,
    'email-opt-in',
  );

  const bannerSlot = el('div');
  const save = createButton({ label: 'Simpan pengaturan', icon: 'check', type: 'submit' });

  const form = el('form', { class: 'settings-layout', attrs: { novalidate: true } }, [
    el('section', { class: 'card settings-section' }, [
      el('h2', { class: 'settings-section__title', text: 'Belajar' }),
      el('p', {
        class: 'settings-section__description',
        text: 'Sesuaikan ritme dan zona waktu yang dipakai untuk streak serta quest harian.',
      }),
      el('div', { class: 'form-stack' }, [
        el('div', { class: 'field' }, [
          el('label', { class: 'field__label', attrs: { for: 'daily-goal' } }, ['Target harian']),
          goalSelect,
        ]),
        el('div', { class: 'form-row' }, [
          el('div', { class: 'field' }, [
            el('label', { class: 'field__label', attrs: { for: 'timezone' } }, ['Zona waktu']),
            timezoneSelect,
          ]),
          el('div', { class: 'field' }, [
            el('label', { class: 'field__label', attrs: { for: 'locale' } }, ['Bahasa antarmuka']),
            localeSelect,
          ]),
        ]),
      ]),
    ]),

    el('section', { class: 'card settings-section' }, [
      el('h2', { class: 'settings-section__title', text: 'Audio' }),
      el('p', {
        class: 'settings-section__description',
        text: 'Musik latar, efek suara, dan suara dialog memakai volume ini. Perubahan berlaku setelah disimpan dan tersimpan di akunmu.',
      }),
      music.root,
      sfx.root,
      voice.root,
      muteAudio.root,
    ]),

    el('section', { class: 'card settings-section' }, [
      el('h2', { class: 'settings-section__title', text: 'Privasi' }),
      el('p', {
        class: 'settings-section__description',
        text: 'Atur siapa yang boleh melihat XP, streak, lesson selesai, dan pencapaianmu. Nama dan avatar tetap tampil di papan peringkat publik.',
      }),
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', attrs: { for: 'profile-visibility' } }, ['Visibilitas statistik']),
        visibilitySelect,
        el('p', {
          class: 'form-hint',
          text: 'Privat menyembunyikan statistik dan aktivitas dari semua pemain lain.',
        }),
      ]),
    ]),

    el('section', { class: 'card settings-section' }, [
      el('h2', { class: 'settings-section__title', text: 'Aksesibilitas & notifikasi' }),
      el('p', {
        class: 'settings-section__description',
        text: 'Kontrol kecil yang membuat permainan lebih nyaman.',
      }),
      reducedMotion.root,
      emailOptIn.root,
    ]),

    bannerSlot,
    el('div', { class: 'settings-actions' }, [save.button]),
  ]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    bannerSlot.replaceChildren();

    void (async () => {
      save.setLoading(true);
      const result = await profileService.saveSettings(user.id, {
        locale: localeSelect.value === 'en' ? 'en' : 'id',
        timezone: timezoneSelect.value,
        dailyGoalMinutes: Number(goalSelect.value),
        musicVolume: music.value(),
        sfxVolume: sfx.value(),
        voiceVolume: voice.value(),
        reducedMotion: reducedMotion.value(),
        emailOptIn: emailOptIn.value(),
        profileVisibility:
          visibilitySelect.value === 'public' || visibilitySelect.value === 'private'
            ? visibilitySelect.value
            : 'friends',
      });
      save.setLoading(false);

      if (!result.ok) {
        bannerSlot.append(
          el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
            icon('alert', 18),
            el('span', { text: result.message }),
          ]),
        );
        return;
      }

      sessionStore.setSettings(result.data);
      document.documentElement.dataset.reducedMotion = String(result.data.reduced_motion);
      showToast('Pengaturan tersimpan.', 'success');
    })();
  });

  const resendPassword = createButton({
    label: 'Kirim tautan ubah password',
    variant: 'secondary',
    size: 'sm',
  });
  resendPassword.button.addEventListener('click', () => {
    void (async () => {
      resendPassword.setLoading(true);
      const result = await authService.requestPasswordReset(email);
      resendPassword.setLoading(false);
      if (result.ok) {
        showToast('Tautan dikirim jika email terdaftar. Periksa kotak masuk.', 'success');
      } else {
        showToast(result.message, 'error');
      }
    })();
  });

  const logout = createButton({
    label: 'Keluar dari akun',
    variant: 'danger',
    size: 'sm',
    icon: 'logout',
  });
  logout.button.addEventListener('click', () => {
    void (async () => {
      logout.setLoading(true);
      await sessionStore.signOut();
      showToast('Kamu sudah keluar.', 'success');
      ctx.navigate('/login', { replace: true });
    })();
  });

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Akun',
      title: 'Pengaturan',
      subtitle: 'Atur cara Lentera menemani belajar dan bermainmu.',
    }),
    form,
    el('div', { class: 'settings-layout', style: { marginTop: '1.25rem' } }, [
      el('section', { class: 'card settings-section' }, [
        el('h2', { class: 'settings-section__title', text: 'Keamanan akun' }),
        el('p', {
          class: 'settings-section__description',
          text: `Email terdaftar: ${email}`,
        }),
        el('div', { class: 'banner banner--info' }, [
          icon('shield', 18),
          el('div', {}, [
            el('p', { class: 'banner__title', text: 'Ganti password dengan aman' }),
            el('p', {
              class: 'banner__body',
              text: 'Kami mengirim tautan resmi Supabase. Password tidak pernah disimpan di aplikasi ini.',
            }),
          ]),
        ]),
        el('div', { class: 'settings-actions', style: { justifyContent: 'flex-start' } }, [
          resendPassword.button,
        ]),
      ]),
      el('section', { class: 'card settings-section' }, [
        el('h2', { class: 'settings-section__title', text: 'Akun' }),
        el('p', { class: 'settings-section__description' }, [
          `Masuk sebagai @${profile.username}. Sesi tersimpan di perangkat ini dan diperbarui otomatis.`,
        ]),
        el('div', { class: 'settings-actions', style: { justifyContent: 'flex-start' } }, [
          logout.button,
        ]),
      ]),
    ]),
  ]);

  renderAppLayout(ctx, { active: 'settings', title: 'Pengaturan', content });
}

export { meta, render };
