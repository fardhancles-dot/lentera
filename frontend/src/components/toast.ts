import { iconMarkup } from './icons';

type ToastVariant = 'default' | 'success' | 'error';

let region: HTMLElement | null = null;

function getRegion(): HTMLElement {
  if (region?.isConnected) return region;
  region = document.createElement('div');
  region.className = 'toast-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.append(region);
  return region;
}

export function showToast(
  message: string,
  variant: ToastVariant = 'default',
  timeout = 4200,
): void {
  const toast = document.createElement('div');
  toast.className = `toast${variant === 'default' ? '' : ` toast--${variant}`}`;
  const glyph = variant === 'error' ? 'alert' : variant === 'success' ? 'check' : 'info';
  const iconSlot = document.createElement('span');
  iconSlot.className = 'toast__icon';
  iconSlot.innerHTML = iconMarkup(glyph, 18);
  const textSlot = document.createElement('span');
  // Pesan dapat memuat judul quest atau pesan server; jangan pernah jadi HTML.
  textSlot.textContent = message;
  toast.append(iconSlot, textSlot);

  getRegion().append(toast);

  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    toast.style.transition = 'opacity .2s ease, transform .2s ease';
    window.setTimeout(() => toast.remove(), 220);
  }, timeout);
}
