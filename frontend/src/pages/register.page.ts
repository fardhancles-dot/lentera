import type { PageModule } from '../app/router';
import { bindPasswordLengthHint, createButton, createField } from '../components/forms';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { appEnv } from '../config/env';
import { renderAuthLayout } from '../layouts/authLayout';
import { authService } from '../services/auth.service';
import { contentService } from '../services/content.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Daftar' };

async function render(ctx: Parameters<PageModule['render']>[0]): Promise<void> {
  if (!contentService.settings.registrationEnabled) {
    await renderAuthLayout(
      ctx,
      el('div', { class: 'auth-card card' }, [
        el('h1', { class: 'auth-card__title', text: 'Registrasi sedang ditutup' }),
        el('p', {
          class: 'auth-card__subtitle',
          text: 'Pendaftaran akun baru dinonaktifkan sementara oleh administrator. Masuk jika kamu sudah punya akun.',
        }),
        el('a', { class: 'btn', attrs: { href: '/login' }, text: 'Masuk' }),
      ]),
    );
    return;
  }

  const displayNameField = createField({
    label: 'Nama tampilan',
    name: 'displayName',
    placeholder: 'Nama yang dilihat pemain lain',
    autocomplete: 'nickname',
    maxLength: 40,
    required: true,
  });

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
    placeholder: 'Minimal 6 karakter',
    autocomplete: 'new-password',
    hint: 'Password minimal 6 karakter.',
    withPasswordToggle: true,
    required: true,
  });
  bindPasswordLengthHint(passwordField);

  const confirmField = createField({
    label: 'Ulangi password',
    name: 'confirmPassword',
    type: 'password',
    placeholder: 'Ketik ulang password',
    autocomplete: 'new-password',
    withPasswordToggle: true,
    required: true,
  });

  const submit = createButton({ label: 'Buat akun', type: 'submit', block: true, size: 'lg' });
  const bannerSlot = el('div', { class: 'banner-slot' });

  const form = el(
    'form',
    { class: 'form-stack auth-card__form', attrs: { novalidate: true } },
    [
      displayNameField.root,
      emailField.root,
      passwordField.root,
      confirmField.root,
      bannerSlot,
      submit.button,
      el('p', {
        class: 'field__hint',
        text: 'Dengan membuat akun, kamu menyetujui penggunaan data untuk menyimpan progres belajar.',
      }),
    ],
  );

  const card = el('div', { class: 'auth-card card' }, [
    el('h1', { class: 'auth-card__title', text: 'Mulai petualanganmu' }),
    el('p', {
      class: 'auth-card__subtitle',
      text: 'Buat akun gratis. Progres belajarmu akan tersimpan di cloud.',
    }),
    !appEnv.isSupabaseConfigured
      ? el('div', { style: { marginTop: '1rem' } }, [
          el('div', { class: 'banner banner--warning' }, [
            icon('alert', 20),
            el('div', {}, [
              el('p', { class: 'banner__title', text: 'Supabase belum dikonfigurasi' }),
              el('p', { class: 'banner__body' }, [
                'Pendaftaran membutuhkan backend. ',
                el('a', { attrs: { href: '/setup' } }, ['Ikuti panduan setup']),
              ]),
            ]),
          ]),
        ])
      : null,
    form,
    el('p', { class: 'auth-footer' }, [
      'Sudah punya akun? ',
      el('a', { attrs: { href: '/login' } }, ['Masuk']),
    ]),
  ]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    displayNameField.setError();
    emailField.setError();
    passwordField.setError();
    confirmField.setError();
    bannerSlot.replaceChildren();

    void (async () => {
      submit.setLoading(true);
      const result = await authService.register({
        displayName: displayNameField.value(),
        email: emailField.value(),
        password: passwordField.value(),
        confirmPassword: confirmField.value(),
      });

      if (!result.ok) {
        submit.setLoading(false);
        if (result.field === 'displayName') displayNameField.setError(result.message);
        else if (result.field === 'email') emailField.setError(result.message);
        else if (result.field === 'password') passwordField.setError(result.message);
        else {
          bannerSlot.append(
            el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
              icon('alert', 20),
              el('span', { text: result.message }),
            ]),
          );
        }
        return;
      }

      if (result.data.needsEmailConfirmation) {
        submit.setLoading(false);
        bannerSlot.append(
          el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
            icon('alert', 20),
            el('div', {}, [
              el('p', { class: 'banner__title', text: 'Konfirmasi email masih aktif' }),
              el('p', {
                class: 'banner__body',
                text: 'Akun dibuat, tetapi project Supabase masih meminta verifikasi email. Matikan opsi Confirm email di Dashboard Supabase agar pemain langsung bisa masuk.',
              }),
            ]),
          ]),
        );
        return;
      }

      await sessionStore.sync();
      if (sessionStore.getState().status === 'authenticated') {
        showToast('Akun berhasil dibuat. Yuk kenalan dulu!', 'success');
        ctx.navigate('/onboarding', { replace: true });
      } else {
        submit.setLoading(false);
        bannerSlot.append(
          el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
            icon('alert', 20),
            el('span', {
              text: 'Akun dibuat, tetapi profil belum siap. Pastikan migrasi database sudah dijalankan.',
            }),
          ]),
        );
      }
    })();
  });

  await renderAuthLayout(ctx, card);
}

export { meta, render };
