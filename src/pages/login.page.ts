import type { PageModule } from '../app/router';
import { createButton, createField } from '../components/forms';
import { icon, type IconName } from '../components/icons';
import { showToast } from '../components/toast';
import { appEnv } from '../config/env';
import { renderAuthLayout } from '../layouts/authLayout';
import { authService } from '../services/auth.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Masuk' };

function notice(
  variant: 'info' | 'warning' | 'error',
  title: string,
  body: string,
  iconName: IconName = 'info',
): HTMLElement {
  return el('div', { class: `banner banner--${variant}`, attrs: { role: 'status' } }, [
    icon(iconName, 20),
    el('div', {}, [
      el('p', { class: 'banner__title', text: title }),
      el('p', { class: 'banner__body', text: body }),
    ]),
  ]);
}

function sanitizeNext(raw: string | null): string {
  if (!raw) return '/app';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/app';
  if (raw.startsWith('/login') || raw.startsWith('/register')) return '/app';
  return raw;
}

function readLinkError(): string | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const fromHash = hash.get('error_description');
  const fromQuery = new URLSearchParams(window.location.search).get('error_description');
  const message = fromHash ?? fromQuery;
  if (!message) return null;

  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return decodeURIComponent(message.replaceAll('+', ' '));
}

async function render(ctx: Parameters<PageModule['render']>[0]): Promise<void> {
  const next = sanitizeNext(ctx.query.get('next'));
  const linkError = readLinkError();

  const emailField = createField({
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'nama@email.com',
    autocomplete: 'email',
    inputMode: 'email',
    required: true,
  });

  const passwordField = createField({
    label: 'Password',
    name: 'password',
    type: 'password',
    placeholder: 'Masukkan password',
    autocomplete: 'current-password',
    withPasswordToggle: true,
    required: true,
  });

  const submit = createButton({ label: 'Masuk', type: 'submit', block: true, size: 'lg' });

  const form = el(
    'form',
    { class: 'form-stack auth-card__form', attrs: { novalidate: true } },
    [
      emailField.root,
      passwordField.root,
      el('div', { style: { display: 'flex', justifyContent: 'flex-end' } }, [
        el('a', { class: 'small', attrs: { href: '/forgot-password' } }, ['Lupa password?']),
      ]),
      el('div', { class: 'banner-slot' }),
      submit.button,
    ],
  );

  const bannerSlot = form.querySelector<HTMLElement>('.banner-slot')!;

  const showFormError = (message: string) => {
    bannerSlot.replaceChildren(notice('error', 'Belum bisa masuk', message, 'alert'));
  };

  const card = el('div', { class: 'auth-card card' }, [
    el('h1', { class: 'auth-card__title', text: 'Selamat datang kembali' }),
    el('p', {
      class: 'auth-card__subtitle',
      text: 'Masuk untuk melanjutkan petualangan belajarmu.',
    }),
    !appEnv.isSupabaseConfigured
      ? el('div', { style: { marginTop: '1rem' } }, [
          el('div', { class: 'banner banner--warning' }, [
            icon('alert', 20),
            el('div', {}, [
              el('p', { class: 'banner__title', text: 'Supabase belum dikonfigurasi' }),
              el('p', { class: 'banner__body' }, [
                'Isi ',
                el('code', { class: 'code', text: 'VITE_SUPABASE_URL' }),
                ' dan ',
                el('code', { class: 'code', text: 'VITE_SUPABASE_ANON_KEY' }),
                ', lalu jalankan migrasi. ',
                el('a', { attrs: { href: '/setup' } }, ['Lihat panduan']),
              ]),
            ]),
          ]),
        ])
      : null,
    ctx.query.get('reset') === '1'
      ? el('div', { style: { marginTop: '1rem' } }, [
          notice(
            'info',
            'Password berhasil diubah',
            'Masuk kembali menggunakan password baru kamu.',
            'check',
          ),
        ])
      : null,
    linkError
      ? el('div', { style: { marginTop: '1rem' } }, [
          notice('error', 'Tautan tidak berlaku', linkError, 'alert'),
        ])
      : null,
    form,
    el('p', { class: 'auth-footer' }, [
      'Belum punya akun? ',
      el('a', { attrs: { href: '/register' } }, ['Daftar gratis']),
    ]),
  ]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    emailField.setError();
    passwordField.setError();
    bannerSlot.replaceChildren();

    void (async () => {
      submit.setLoading(true);
      const result = await authService.login(emailField.value(), passwordField.value());

      if (!result.ok) {
        submit.setLoading(false);
        if (result.field === 'email') emailField.setError(result.message);
        else if (result.field === 'password') passwordField.setError(result.message);
        else showFormError(result.message);
        return;
      }

      await sessionStore.sync();
      const state = sessionStore.getState();

      if (state.status === 'authenticated' && state.user) {
        const target = state.user.profile.onboarding_completed ? next : '/onboarding';
        showToast('Selamat datang kembali!', 'success');
        ctx.navigate(target, { replace: true });
        return;
      }

      submit.setLoading(false);
      showFormError(
        'Login berhasil, tetapi profil belum dapat dimuat. Pastikan migrasi database sudah dijalankan.',
      );
    })();
  });

  await renderAuthLayout(ctx, card);
}

export { meta, render };
