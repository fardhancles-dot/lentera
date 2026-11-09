import type { PageModule } from '../app/router';
import { createButton, createField, createPasswordMeter } from '../components/forms';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { appEnv } from '../config/env';
import { renderAuthLayout } from '../layouts/authLayout';
import { authService } from '../services/auth.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Daftar' };

async function render(ctx: Parameters<PageModule['render']>[0]): Promise<void> {
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
    placeholder: 'Minimal 8 karakter',
    autocomplete: 'new-password',
    hint: 'Gunakan minimal 8 karakter berisi huruf dan angka.',
    withPasswordToggle: true,
    required: true,
  });

  const meter = createPasswordMeter();
  passwordField.root.append(meter.root);
  passwordField.input.addEventListener('input', () => meter.update(passwordField.input.value));

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
        showEmailConfirmation(card, emailField.value().trim());
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

function showEmailConfirmation(card: HTMLElement, email: string): void {
  const resend = createButton({
    label: 'Kirim ulang email',
    variant: 'secondary',
    block: true,
  });

  const panel = el('div', { class: 'auth-success' }, [
    el('span', { class: 'auth-success__icon' }, [icon('mail', 30)]),
    el('h1', { class: 'auth-card__title', text: 'Cek kotak masukmu' }),
    el('p', {
      class: 'auth-card__subtitle',
      text: `Kami mengirim tautan verifikasi ke ${email}. Buka tautan tersebut, lalu masuk ke akunmu.`,
    }),
    el('div', { style: { width: '100%', marginTop: '1rem' } }, [resend.button]),
    el('a', { class: 'small', attrs: { href: '/login' } }, ['Kembali ke halaman masuk']),
  ]);

  resend.button.addEventListener('click', () => {
    void (async () => {
      resend.setLoading(true);
      const result = await authService.resendConfirmation(email);
      resend.setLoading(false);
      if (result.ok) showToast('Email verifikasi dikirim ulang.', 'success');
      else showToast(result.message, 'error');
    })();
  });

  card.replaceChildren(panel);
}

export { meta, render };
