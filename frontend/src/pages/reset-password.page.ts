import type { PageModule } from '../app/router';
import { bindPasswordLengthHint, createButton, createField } from '../components/forms';
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
  // Auth events (recovery session, cleared recovery flag) re-run update(); once
  // the password is saved they must not replace the success card with the form.
  let completed = false;
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
        el('h1', { class: 'auth-card__title', text: 'Sesi reset tidak valid' }),
        el('p', {
          class: 'auth-card__subtitle',
          text: 'Kode atau tautan reset sudah kedaluwarsa atau sudah dipakai. Minta kode baru untuk melanjutkan.',
        }),
        el('div', { style: { marginTop: '1rem', width: '100%' } }, [
          el('a', { class: 'btn btn--block', attrs: { href: '/forgot-password' } }, [
            'Minta kode baru',
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
      placeholder: 'Minimal 6 karakter',
      autocomplete: 'new-password',
      hint: 'Password minimal 6 karakter.',
      withPasswordToggle: true,
      required: true,
    });
    bindPasswordLengthHint(passwordField);

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

        completed = true;
        unsubscribe?.();
        unsubscribe = null;
        sessionStore.clearRecoveryMode();
        const state = sessionStore.getState();
        const target =
          state.status === 'authenticated' && state.user?.profile?.onboarding_completed
            ? '/app'
            : '/onboarding';

        showToast('Password berhasil diubah.', 'success');

        const signInAgain = el('button', {
          class: 'btn btn--ghost btn--block',
          attrs: { type: 'button' },
          text: 'Masuk dengan password baru',
        });
        signInAgain.addEventListener('click', () => {
          void (async () => {
            await sessionStore.signOut();
            ctx.navigate('/login?reset=1', { replace: true });
          })();
        });

        card.replaceChildren(
          el('div', { class: 'auth-success' }, [
            el('span', { class: 'auth-success__icon' }, [icon('check', 32)]),
            el('h1', { class: 'auth-card__title', text: 'Password berhasil diubah' }),
            el('p', {
              class: 'auth-card__subtitle',
              text: 'Password baru sudah tersimpan. Kamu bisa masuk kembali dengan password tersebut.',
            }),
            el('div', { style: { marginTop: '1rem', width: '100%', display: 'grid', gap: '0.5rem' } }, [
              el('a', { class: 'btn btn--block', attrs: { href: target } }, ['Lanjutkan']),
              signInAgain,
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
    if (completed) return;
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
