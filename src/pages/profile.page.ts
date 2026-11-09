import type { PageModule } from '../app/router';
import { AVATAR_KEYS, AVATAR_LABELS, avatar, avatarMarkup, isAvatarKey } from '../components/avatar';
import { createButton, createField } from '../components/forms';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { profileService } from '../services/profile.service';
import { sessionStore } from '../stores/session.store';
import { el, formatDate } from '../utils/dom';

const meta = { title: 'Profil' };

const ROLE_LABEL = {
  player: 'Pemain',
  admin: 'Admin',
  developer: 'Developer',
} as const;

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const { profile, settings, email, role } = user;

  const nameEl = el('h2', { class: 'profile-hero__name', text: profile.display_name || profile.username });
  const handleEl = el('p', { class: 'profile-hero__handle', text: `@${profile.username}` });
  const bioEl = el('p', {
    class: 'profile-hero__bio',
    text: profile.bio || 'Belum ada bio. Ceritakan sedikit tentang dirimu.',
  });
  const avatarSlot = el('div', { class: 'profile-hero__avatar' }, [avatar(profile.avatar_key, 'xl')]);

  const hero = el('section', { class: 'profile-hero' }, [
    el('div', { class: 'profile-hero__banner' }),
    el('div', { class: 'profile-hero__body' }, [
      avatarSlot,
      el('div', { class: 'profile-hero__identity' }, [
        el('div', {}, [
          nameEl,
          handleEl,
          el('div', { class: 'profile-hero__badges' }, [
            el('span', { class: 'badge badge--muted', text: ROLE_LABEL[role] }),
            el('span', { class: 'badge badge--blue' }, [
              icon('clock', 12),
              `Bergabung ${formatDate(profile.created_at)}`,
            ]),
          ]),
        ]),
      ]),
      bioEl,
      el('div', { class: 'profile-meta' }, [
        el('div', { class: 'profile-meta__item' }, [
          el('span', { class: 'profile-meta__label', text: 'Email' }),
          el('span', { class: 'profile-meta__value', text: email }),
        ]),
        el('div', { class: 'profile-meta__item' }, [
          el('span', { class: 'profile-meta__label', text: 'Target harian' }),
          el('span', { class: 'profile-meta__value', text: `${settings.daily_goal_minutes} menit` }),
        ]),
        el('div', { class: 'profile-meta__item' }, [
          el('span', { class: 'profile-meta__label', text: 'Zona waktu' }),
          el('span', { class: 'profile-meta__value', text: settings.timezone.replace('_', ' ') }),
        ]),
      ]),
    ]),
  ]);

  const usernameField = createField({
    label: 'Username',
    name: 'username',
    value: profile.username,
    autocomplete: 'username',
    maxLength: 20,
    hint: '3–20 karakter. Huruf kecil, angka, atau garis bawah.',
    required: true,
  });

  const displayField = createField({
    label: 'Nama tampilan',
    name: 'displayName',
    value: profile.display_name,
    autocomplete: 'nickname',
    maxLength: 40,
    required: true,
  });

  let avatarKey = isAvatarKey(profile.avatar_key) ? profile.avatar_key : 'sprout';

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
            'aria-pressed': String(avatarKey === key),
          },
        },
        [el('span', { html: avatarMarkup(key, 56) })],
      );

      button.addEventListener('click', () => {
        avatarKey = key;
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

  const bioInput = el('textarea', {
    class: 'textarea',
    attrs: {
      id: 'profile-bio',
      name: 'bio',
      maxlength: 280,
      placeholder: 'Ceritakan hal yang sedang kamu pelajari…',
    },
    text: profile.bio,
  });

  const bioCounter = el('p', { class: 'field__hint', text: `${profile.bio.length}/280 karakter` });
  bioInput.addEventListener('input', () => {
    bioCounter.textContent = `${bioInput.value.length}/280 karakter`;
  });

  const bannerSlot = el('div');
  const save = createButton({ label: 'Simpan perubahan', icon: 'check', type: 'submit' });

  const form = el('form', { class: 'form-stack', attrs: { novalidate: true } }, [
    avatarGrid,
    el('div', { class: 'form-row' }, [usernameField.root, displayField.root]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label', attrs: { for: 'profile-bio' } }, ['Bio']),
      bioInput,
      bioCounter,
    ]),
    bannerSlot,
    el('div', { class: 'settings-actions' }, [save.button]),
  ]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    usernameField.setError();
    displayField.setError();
    bannerSlot.replaceChildren();

    void (async () => {
      save.setLoading(true);
      const result = await profileService.saveProfile(user, {
        username: usernameField.value(),
        displayName: displayField.value(),
        avatarKey,
        bio: bioInput.value,
      });

      save.setLoading(false);

      if (!result.ok) {
        if (result.field === 'username') usernameField.setError(result.message);
        else if (result.field === 'displayName') displayField.setError(result.message);
        else {
          bannerSlot.append(
            el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
              icon('alert', 18),
              el('span', { text: result.message }),
            ]),
          );
        }
        return;
      }

      sessionStore.setProfile(result.data);
      nameEl.textContent = result.data.display_name || result.data.username;
      handleEl.textContent = `@${result.data.username}`;
      bioEl.textContent =
        result.data.bio || 'Belum ada bio. Ceritakan sedikit tentang dirimu.';
      avatarSlot.replaceChildren(avatar(result.data.avatar_key, 'xl'));
      showToast('Profil berhasil disimpan.', 'success');
    })();
  });

  const accountCard = el('section', { class: 'card card--padded' }, [
    el('h2', { class: 'card__title', text: 'Informasi akun' }),
    el('p', { class: 'card__subtitle', text: 'Data ini dipakai untuk masuk ke akunmu.' }),
    el('div', { class: 'summary-list', style: { marginTop: '1rem' } }, [
      infoRow('Email', email),
      infoRow('ID akun', el('code', { class: 'code', text: profile.id.slice(0, 8) + '…' })),
      infoRow('Peran', el('span', { class: 'badge badge--muted', text: ROLE_LABEL[role] })),
      infoRow('Diperbarui', formatDate(profile.updated_at)),
    ]),
  ]);

  const privacyCard = el('section', { class: 'card card--padded' }, [
    el('h2', { class: 'card__title', text: 'Privasi profil' }),
    el('p', {
      class: 'card__subtitle',
      text: 'Pemain lain hanya dapat melihat username, nama tampilan, avatar, dan bio. Email tidak pernah dibagikan.',
    }),
  ]);

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Akun',
      title: 'Profil',
      subtitle: 'Kelola identitas pemainmu. Perubahan langsung tersimpan ke database.',
    }),
    hero,
    el('div', { class: 'dashboard-grid', style: { marginTop: '1.25rem' } }, [
      el('div', { class: 'dashboard-main' }, [
        el('section', { class: 'card card--padded' }, [
          el('h2', { class: 'card__title', text: 'Edit profil' }),
          el('p', {
            class: 'card__subtitle',
            text: 'Username unik dan tidak dapat dipakai pemain lain.',
          }),
          el('div', { style: { marginTop: '1.25rem' } }, [form]),
        ]),
      ]),
      el('div', { class: 'dashboard-aside' }, [accountCard, privacyCard]),
    ]),
  ]);

  renderAppLayout(ctx, { active: 'profile', title: 'Profil', content });
}

function infoRow(label: string, value: Node | string): HTMLElement {
  return el('div', { class: 'summary-list__row' }, [
    el('span', { class: 'summary-list__label', text: label }),
    el('span', { class: 'summary-list__value' }, [value]),
  ]);
}

export { meta, render };
