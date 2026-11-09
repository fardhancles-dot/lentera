import type { PageModule } from '../app/router';
import { createButton, createField } from '../components/forms';
import { icon } from '../components/icons';
import { renderAuthLayout } from '../layouts/authLayout';
import { authService } from '../services/auth.service';
import { el } from '../utils/dom';

const meta = { title: 'Lupa password' };

async function render(ctx: Parameters<PageModule['render']>[0]): Promise<void> {
  const emailField = createField({
    label: 'Email akun',
    name: 'email',
    type: 'email',
    placeholder: 'nama@email.com',
    autocomplete: 'email',
    inputMode: 'email',
    required: true,
  });

  const submit = createButton({
    label: 'Kirim tautan reset',
    type: 'submit',
    block: true,
    size: 'lg',
  });

  const bannerSlot = el('div', { class: 'banner-slot' });

  const form = el('form', { class: 'form-stack auth-card__form', attrs: { novalidate: true } }, [
    emailField.root,
    bannerSlot,
    submit.button,
  ]);

  const card = el('div', { class: 'auth-card card' }, [
    el('h1', { class: 'auth-card__title', text: 'Atur ulang password' }),
    el('p', {
      class: 'auth-card__subtitle',
      text: 'Masukkan email akunmu. Kami akan mengirim tautan untuk membuat password baru.',
    }),
    form,
    el('p', { class: 'auth-footer' }, [
      'Ingat passwordmu? ',
      el('a', { attrs: { href: '/login' } }, ['Kembali masuk']),
    ]),
  ]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    emailField.setError();
    bannerSlot.replaceChildren();

    void (async () => {
      submit.setLoading(true);
      const result = await authService.requestPasswordReset(emailField.value());
      submit.setLoading(false);

      if (!result.ok) {
        if (result.field === 'email') emailField.setError(result.message);
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

      card.replaceChildren(
        el('div', { class: 'auth-success' }, [
          el('span', { class: 'auth-success__icon' }, [icon('mail', 30)]),
          el('h1', { class: 'auth-card__title', text: 'Periksa emailmu' }),
          el('p', {
            class: 'auth-card__subtitle',
            text: 'Jika alamat tersebut terdaftar, tautan atur ulang password sudah dikirim. Tautan berlaku selama 60 menit.',
          }),
          el('p', {
            class: 'field__hint',
            text: 'Tidak menemukan emailnya? Periksa folder spam atau tunggu beberapa menit.',
          }),
          el('div', { class: 'auth-footer' }, [
            'Sudah selesai? ',
            el('a', { attrs: { href: '/login' } }, ['Masuk']),
          ]),
        ]),
      );
    })();
  });

  await renderAuthLayout(ctx, card);
}

export { meta, render };
