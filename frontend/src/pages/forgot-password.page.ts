import type { PageModule } from '../app/router';
import { createButton, createField } from '../components/forms';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { renderAuthLayout } from '../layouts/authLayout';
import { authService } from '../services/auth.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Lupa password' };

/** Seconds before the user may request another code. */
const RESEND_COOLDOWN = 60;
/** Wrong codes allowed for a single code before a new one is required. */
const MAX_ATTEMPTS = 5;

async function render(ctx: Parameters<PageModule['render']>[0]): Promise<void> {
  let email = '';
  let attempts = 0;
  let cooldown = 0;
  let cooldownTimer: number | null = null;

  const stopCooldown = () => {
    if (cooldownTimer !== null) window.clearInterval(cooldownTimer);
    cooldownTimer = null;
  };

  ctx.onCleanup(stopCooldown);

  const card = el('div', { class: 'auth-card card' });

  const startCooldown = (onTick: (remaining: number) => void) => {
    stopCooldown();
    cooldown = RESEND_COOLDOWN;
    onTick(cooldown);
    cooldownTimer = window.setInterval(() => {
      cooldown -= 1;
      onTick(cooldown);
      if (cooldown <= 0) stopCooldown();
    }, 1000);
  };

  const renderEmailStep = (options: { message?: string } = {}) => {
    stopCooldown();

    const emailField = createField({
      label: 'Email akun',
      name: 'email',
      type: 'email',
      placeholder: 'nama@email.com',
      autocomplete: 'email',
      inputMode: 'email',
      value: email,
      required: true,
    });

    const submit = createButton({
      label: 'Kirim kode',
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

    const children: Node[] = [
      el('h1', { class: 'auth-card__title', text: 'Atur ulang password' }),
      el('p', {
        class: 'auth-card__subtitle',
        text: 'Masukkan email akunmu. Kami akan mengirim email verifikasi untuk membuat password baru.',
      }),
    ];

    if (options.message) {
      children.push(
        el('div', { style: { marginTop: '1rem' } }, [
          el('div', { class: 'banner banner--info', attrs: { role: 'status' } }, [
            icon('info', 20),
            el('span', { text: options.message }),
          ]),
        ]),
      );
    }

    children.push(
      form,
      el('p', { class: 'auth-footer' }, [
        'Ingat passwordmu? ',
        el('a', { attrs: { href: '/login' } }, ['Kembali masuk']),
      ]),
    );

    card.replaceChildren(...children);

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

        email = emailField.value().trim().toLowerCase();
        renderCodeStep();
      })();
    });
  };

  const renderCodeStep = () => {
    attempts = 0;

    const codeField = createField({
      label: 'Kode verifikasi',
      name: 'code',
      placeholder: '483921',
      autocomplete: 'one-time-code',
      inputMode: 'numeric',
      maxLength: 6,
      hint: 'Kode berupa 6 angka dan hanya bisa dipakai satu kali.',
      required: true,
    });

    const submit = createButton({
      label: 'Verifikasi kode',
      type: 'submit',
      block: true,
      size: 'lg',
    });

    const resend = createButton({
      label: 'Kirim ulang kode',
      variant: 'secondary',
      block: true,
    });

    const bannerSlot = el('div', { class: 'banner-slot' });

    const form = el('form', { class: 'form-stack auth-card__form', attrs: { novalidate: true } }, [
      codeField.root,
      bannerSlot,
      submit.button,
      resend.button,
    ]);

    const showBanner = (variant: 'info' | 'error', message: string) => {
      bannerSlot.replaceChildren(
        el('div', { class: `banner banner--${variant}`, attrs: { role: 'status' } }, [
          icon(variant === 'error' ? 'alert' : 'info', 20),
          el('span', { text: message }),
        ]),
      );
    };

    const renderResendLabel = (remaining: number) => {
      if (resend.button.getAttribute('aria-busy') === 'true') return;
      resend.button.textContent =
        remaining > 0 ? `Kirim ulang kode (${remaining} dtk)` : 'Kirim ulang kode';
      resend.button.disabled = remaining > 0 || submit.button.disabled;
    };

    card.replaceChildren(
      el('div', { class: 'auth-success' }, [
        el('span', { class: 'auth-success__icon' }, [icon('mail', 30)]),
        el('h1', { class: 'auth-card__title', text: 'Masukkan kode verifikasi' }),
        el('p', {
          class: 'auth-card__subtitle',
          text: `Kami mengirim email ke ${email}. Masukkan kode 6 angka dari email tersebut. Jika email hanya berisi tautan, buka tautan itu untuk langsung membuat password baru.`,
        }),
      ]),
      form,
      el('p', { class: 'field__hint', text: 'Tidak menemukan emailnya? Periksa folder spam.' }),
      el('button', {
        class: 'btn btn--ghost btn--block btn--sm',
        attrs: { type: 'button' },
        text: 'Gunakan email lain',
        events: {
          click: () => renderEmailStep(),
        },
      }),
      el('p', { class: 'auth-footer' }, [
        el('a', { attrs: { href: '/login' } }, ['Kembali ke halaman masuk']),
      ]),
    );

    startCooldown(renderResendLabel);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      codeField.setError();
      bannerSlot.replaceChildren();

      if (submit.button.disabled) return;

      void (async () => {
        submit.setLoading(true);
        const result = await authService.verifyRecoveryOtp(email, codeField.value());

        if (!result.ok) {
          submit.setLoading(false);
          attempts += 1;

          if (attempts >= MAX_ATTEMPTS) {
            submit.button.disabled = true;
            resend.button.disabled = cooldown > 0;
            showBanner(
              'error',
              'Terlalu banyak percobaan. Minta kode baru, lalu coba lagi.',
            );
            return;
          }

          if (result.field) codeField.setError(result.message);
          else showBanner('error', result.message);
          return;
        }

        // Make sure the recovery session is loaded before the reset page renders.
        await sessionStore.sync();
        showToast('Kode terverifikasi. Buat password baru.', 'success');
        ctx.navigate('/reset-password', { replace: true });
      })();
    });

    resend.button.addEventListener('click', () => {
      void (async () => {
        resend.setLoading(true);
        const result = await authService.requestPasswordReset(email);
        resend.setLoading(false);

        if (!result.ok) {
          showBanner('error', result.message);
          return;
        }

        attempts = 0;
        submit.button.disabled = false;
        codeField.setError();
        codeField.input.value = '';
        codeField.input.focus();
        showBanner('info', 'Kode baru sudah dikirim. Gunakan kode terbaru dari emailmu.');
        startCooldown(renderResendLabel);
      })();
    });
  };

  await renderAuthLayout(ctx, card);
  renderEmailStep();
}

export { meta, render };
