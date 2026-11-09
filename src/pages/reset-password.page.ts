import type { PageModule } from '../app/router';
import { createButton, createField, createPasswordMeter } from '../components/forms';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { renderAuthLayout } from '../layouts/authLayout';
import { authService } from '../services/auth.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Password baru' };

async function render(ctx: Parameters<PageModule['render']>[0]): Promise<void> {
  const card = el('div', { class: 'auth-card card' });
  await renderAuthLayout(ctx, card);

  let unsubscribe: (() => void) | null = null;
  ctx.onCleanup(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  const renderLoading = () => {
    card.replaceChildren(
      el('div', { class: 'auth-success' }, [
        el('span', { class: 'spinner' }),
        el('p', { class: 'auth-card__subtitle', text: 'Memeriksa tautan reset…' }),
      ]),
    );
  };

  const renderInvalid = () => {
    card.replaceChildren(
      el('div', { class: 'auth-success' }, [
        el('span', { class: 'auth-success__icon' }, [icon('key', 30)]),
        el('h1', { class: 'auth-card__title', text: 'Tautan tidak valid' }),
        el('p', {
          class: 'auth-card__subtitle',
          text: 'Tautan reset sudah kedaluwarsa atau sudah dipakai. Minta tautan baru untuk melanjutkan.',
        }),
        el('div', { style: { marginTop: '1rem', width: '100%' } }, [
          el('a', { class: 'btn btn--block', attrs: { href: '/forgot-password' } }, [
            'Minta tautan baru',
          ]),
        ]),
        el('a', { class: 'small', attrs: { href: '/login' } }, ['Kembali ke halaman masuk']),
      ]),
    );
  };

  const renderForm = () => {
    const passwordField = createField({
      label: 'Password baru',
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
      label: 'Ulangi password baru',
      name: 'confirmPassword',
      type: 'password',
      placeholder: 'Ketik ulang password baru',
      autocomplete: 'new-password',
      withPasswordToggle: true,
      required: true,
    });

    const submit = createButton({
      label: 'Simpan password baru',
      type: 'submit',
      block: true,
      size: 'lg',
    });

    const bannerSlot = el('div', { class: 'banner-slot' });

    const form = el('form', { class: 'form-stack auth-card__form', attrs: { novalidate: true } }, [
      passwordField.root,
      confirmField.root,
      bannerSlot,
      submit.button,
    ]);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      passwordField.setError();
      confirmField.setError();
      bannerSlot.replaceChildren();

      void (async () => {
        submit.setLoading(true);
        const result = await authService.updatePassword(
          passwordField.value(),
          confirmField.value(),
        );

        if (!result.ok) {
          submit.setLoading(false);
          if (result.field === 'password') passwordField.setError(result.message);
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

        sessionStore.clearRecoveryMode();
        const state = sessionStore.getState();
        const target =
          state.status === 'authenticated' && state.user?.profile.onboarding_completed
            ? '/app'
            : '/onboarding';

        showToast('Password berhasil diperbarui.', 'success');
        card.replaceChildren(
          el('div', { class: 'auth-success' }, [
            el('span', { class: 'auth-success__icon' }, [icon('check', 32)]),
            el('h1', { class: 'auth-card__title', text: 'Password tersimpan' }),
            el('p', {
              class: 'auth-card__subtitle',
              text: 'Kamu bisa melanjutkan belajar dengan password baru.',
            }),
            el('div', { style: { marginTop: '1rem', width: '100%' } }, [
              el('a', { class: 'btn btn--block', attrs: { href: target } }, ['Lanjutkan']),
            ]),
          ]),
        );
      })();
    });

    card.replaceChildren(
      el('h1', { class: 'auth-card__title', text: 'Buat password baru' }),
      el('p', {
        class: 'auth-card__subtitle',
        text: 'Password baru akan menggantikan password lama untuk akun ini.',
      }),
      form,
    );
  };

  const update = () => {
    const state = sessionStore.getState();
    if (state.status === 'authenticated') {
      renderForm();
      return;
    }
    if (state.status === 'loading' || state.recoveryMode) {
      renderLoading();
      return;
    }
    renderInvalid();
  };

  unsubscribe = sessionStore.subscribe(update);
  update();
}

export { meta, render };
