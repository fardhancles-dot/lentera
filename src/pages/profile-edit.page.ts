import type { PageModule } from '../app/router';
import { AVATAR_KEYS, AVATAR_LABELS, avatarMarkup, isAvatarKey } from '../components/avatar';
import { createButton, createField } from '../components/forms';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { profileService } from '../services/profile.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Edit Profile' };

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const { profile, settings } = user;
  let avatarKey = isAvatarKey(profile.avatar_key) ? profile.avatar_key : 'sprout';
  let avatarUrl: string | null = profile.avatar_url ?? null;
  let pendingFile: File | null = null;
  let previewObjectUrl: string | null = null;

  const preview = el('div', { class: 'profile-photo-editor__preview' });
  const photoHint = el('p', { class: 'field__hint' });

  const paintPreview = () => {
    if (pendingFile && previewObjectUrl) {
      preview.replaceChildren(
        el('img', { attrs: { src: previewObjectUrl, alt: 'Pratinjau foto profil' } }),
      );
    } else if (avatarUrl) {
      preview.replaceChildren(
        el('img', { attrs: { src: avatarUrl, alt: 'Foto profil saat ini' } }),
      );
    } else {
      preview.innerHTML = avatarMarkup(avatarKey, 160);
    }

    photoHint.textContent = pendingFile
      ? 'Foto baru akan diunggah saat kamu menyimpan.'
      : avatarUrl
        ? 'Foto profil sedang digunakan.'
        : 'Belum ada foto. Avatar bawaan dipakai sampai kamu mengunggah foto.';
  };

  const fileInput = el('input', {
    attrs: {
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp',
      class: 'profile-photo-editor__file',
      'aria-label': 'Pilih foto profil',
    },
  });

  const choosePhoto = createButton({
    label: 'Pilih Foto',
    icon: 'plus',
    variant: 'secondary',
    size: 'sm',
  });

  const removePhoto = createButton({
    label: 'Hapus Foto',
    icon: 'close',
    variant: 'ghost',
    size: 'sm',
  });

  choosePhoto.button.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0] ?? null;
    fileInput.value = '';
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      showToast('Gunakan foto JPG, PNG, atau WebP.', 'error');
      return;
    }
    if (file.size <= 0 || file.size > MAX_AVATAR_BYTES) {
      showToast('Ukuran foto maksimal 5 MB.', 'error');
      return;
    }

    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    pendingFile = file;
    previewObjectUrl = URL.createObjectURL(file);
    paintPreview();
  });

  removePhoto.button.addEventListener('click', () => {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
    pendingFile = null;
    avatarUrl = null;
    paintPreview();
  });

  ctx.onCleanup(() => {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  });

  const avatarGrid = el(
    'div',
    {
      class: 'onboarding__avatar-grid profile-avatar-grid',
      attrs: { role: 'group', 'aria-label': 'Pilih avatar bawaan' },
    },
    AVATAR_KEYS.map((key) => {
      const button = el(
        'button',
        {
          class: 'avatar-option',
          attrs: {
            type: 'button',
            'aria-label': `Avatar ${AVATAR_LABELS[key]}`,
            'aria-pressed': String(!avatarUrl && avatarKey === key),
          },
        },
        [el('span', { html: avatarMarkup(key, 56) })],
      );

      button.addEventListener('click', () => {
        avatarKey = key;
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
        pendingFile = null;
        avatarUrl = null;
        avatarGrid.querySelectorAll<HTMLElement>('.avatar-option').forEach((option) => {
          option.setAttribute(
            'aria-pressed',
            String(option.getAttribute('aria-label') === `Avatar ${AVATAR_LABELS[key]}`),
          );
        });
        paintPreview();
      });

      return button;
    }),
  );

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

  const bioCounter = el('p', {
    class: 'field__hint',
    text: `${profile.bio.length}/280 karakter`,
  });
  bioInput.addEventListener('input', () => {
    bioCounter.textContent = `${bioInput.value.length}/280 karakter`;
  });

  const privacyChoices = el('div', { class: 'privacy-choice' });

  const privacyOption = (
    value: 'public' | 'private',
    title: string,
    description: string,
  ): HTMLElement => {
    const input = el('input', {
      attrs: { type: 'radio', name: 'following-privacy', value },
    });
    input.checked = settings.following_privacy === value;

    return el('label', { class: 'privacy-choice__option' }, [
      input,
      el('span', { class: 'privacy-choice__copy' }, [
        el('span', { class: 'privacy-choice__title', text: title }),
        el('span', { class: 'privacy-choice__description', text: description }),
      ]),
    ]);
  };

  privacyChoices.append(
    privacyOption('public', 'Public', 'Semua pemain boleh melihat daftar Following-mu.'),
    privacyOption(
      'private',
      'Privat',
      'Hanya kamu yang boleh melihat daftar Following. Jumlahnya tetap tampil.',
    ),
  );

  const bannerSlot = el('div');
  const save = createButton({
    label: 'Simpan perubahan',
    icon: 'check',
    type: 'submit',
    size: 'lg',
  });

  const form = el('form', { class: 'form-stack profile-edit-form', attrs: { novalidate: true } }, [
    el('section', { class: 'card card--padded' }, [
      el('h2', { class: 'card__title', text: 'Foto profil' }),
      el('p', {
        class: 'card__subtitle',
        text: 'Unggah foto JPG, PNG, atau WebP maksimal 5 MB. Foto ini tampil di profil, daftar teman, dan kotak masuk.',
      }),
      el('div', { class: 'profile-photo-editor' }, [
        preview,
        el('div', { class: 'profile-photo-editor__actions' }, [
          choosePhoto.button,
          removePhoto.button,
          fileInput,
          photoHint,
        ]),
      ]),
      el('p', { class: 'form-hint', text: 'Atau pilih avatar bawaan:' }),
      avatarGrid,
    ]),
    el('section', { class: 'card card--padded' }, [
      el('h2', { class: 'card__title', text: 'Identitas' }),
      el('p', {
        class: 'card__subtitle',
        text: 'Username unik dan tidak dapat dipakai pemain lain.',
      }),
      el('div', { class: 'form-stack', style: { marginTop: '1.25rem' } }, [
        el('div', { class: 'form-row' }, [usernameField.root, displayField.root]),
        el('div', { class: 'field' }, [
          el('label', { class: 'field__label', attrs: { for: 'profile-bio' } }, ['Bio']),
          bioInput,
          bioCounter,
        ]),
      ]),
    ]),
    el('section', { class: 'card card--padded' }, [
      el('h2', { class: 'card__title', text: 'Privasi Following' }),
      el('p', {
        class: 'card__subtitle',
        text: 'Pengaturan ini hanya berlaku untuk daftar akun yang kamu ikuti. Kamu tetap bisa Follow dan Unfollow seperti biasa.',
      }),
      privacyChoices,
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
      let nextAvatarUrl = avatarUrl;

      if (pendingFile) {
        const uploaded = await profileService.uploadAvatar(user.id, pendingFile);
        if (!uploaded.ok) {
          save.setLoading(false);
          bannerSlot.append(
            el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
              icon('alert', 18),
              el('span', { text: uploaded.message }),
            ]),
          );
          return;
        }
        nextAvatarUrl = uploaded.data;
      }

      const result = await profileService.saveProfile(user, {
        username: usernameField.value(),
        displayName: displayField.value(),
        avatarKey,
        avatarUrl: nextAvatarUrl,
        bio: bioInput.value,
      });

      if (!result.ok) {
        save.setLoading(false);
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

      const privacyValue = privacyChoices.querySelector<HTMLInputElement>(
        'input[name="following-privacy"]:checked',
      )?.value;
      const privacy = await profileService.saveFollowingPrivacy(
        user.id,
        privacyValue === 'private' ? 'private' : 'public',
      );
      save.setLoading(false);

      if (!privacy.ok) {
        bannerSlot.append(
          el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
            icon('alert', 18),
            el('span', { text: privacy.message }),
          ]),
        );
        return;
      }

      sessionStore.setSettings(privacy.data);
      showToast('Profil berhasil disimpan.', 'success');
      ctx.navigate('/profile');
    })();
  });

  const back = el('a', {
    class: 'back-link',
    attrs: { href: '/profile' },
  }, [icon('arrow-left', 16), 'Kembali ke profil']);

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Akun',
      title: 'Edit Profile',
      subtitle: 'Kelola foto, identitas, bio, dan privasi daftar Following.',
      actions: [back],
    }),
    form,
  ]);

  renderAppLayout(ctx, { active: 'profile', title: 'Edit Profile', content });
  paintPreview();
}

export { meta, render };
