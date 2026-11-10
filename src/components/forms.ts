import { iconMarkup } from './icons';
import { MIN_PASSWORD_LENGTH } from '../utils/validation';

export interface FieldOptions {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  autocomplete?: string;
  hint?: string;
  value?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  inputMode?: 'text' | 'email' | 'numeric';
  withPasswordToggle?: boolean;
}

export interface FieldHandle {
  root: HTMLDivElement;
  input: HTMLInputElement;
  setError: (message?: string) => void;
  value: () => string;
}

let fieldCounter = 0;

export function createField(options: FieldOptions): FieldHandle {
  fieldCounter += 1;
  const id = `field-${options.name}-${fieldCounter}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const root = document.createElement('div');
  root.className = 'field';

  const label = document.createElement('label');
  label.className = 'field__label';
  label.htmlFor = id;
  label.textContent = options.label;
  root.append(label);

  const inputWrap = document.createElement('div');
  inputWrap.className = 'input-wrap';

  const input = document.createElement('input');
  input.id = id;
  input.name = options.name;
  input.className = 'input';
  input.type = options.type ?? 'text';
  if (options.placeholder) input.placeholder = options.placeholder;
  if (options.autocomplete) input.setAttribute('autocomplete', options.autocomplete);
  if (options.value) input.value = options.value;
  if (options.required) input.required = true;
  if (options.minLength) input.minLength = options.minLength;
  if (options.maxLength) input.maxLength = options.maxLength;
  if (options.inputMode) input.inputMode = options.inputMode;
  input.setAttribute('aria-describedby', errorId);

  inputWrap.append(input);

  if (options.withPasswordToggle) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'input-wrap__action';
    toggle.setAttribute('aria-label', 'Tampilkan password');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.innerHTML = iconMarkup('eye', 20);
    toggle.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      toggle.setAttribute('aria-label', showing ? 'Tampilkan password' : 'Sembunyikan password');
      toggle.setAttribute('aria-pressed', String(!showing));
      toggle.innerHTML = iconMarkup(showing ? 'eye' : 'eye-off', 20);
    });
    inputWrap.append(toggle);
  }

  root.append(inputWrap);

  if (options.hint) {
    const hint = document.createElement('p');
    hint.className = 'field__hint';
    hint.id = hintId;
    hint.textContent = options.hint;
    root.append(hint);
  }

  const error = document.createElement('p');
  error.className = 'field__error';
  error.id = errorId;
  error.hidden = true;
  error.setAttribute('role', 'alert');
  root.append(error);

  const setError = (message?: string) => {
    if (message) {
      error.hidden = false;
      error.textContent = message;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', `${errorId}${options.hint ? ` ${hintId}` : ''}`);
    } else {
      error.hidden = true;
      error.textContent = '';
      input.removeAttribute('aria-invalid');
      input.setAttribute('aria-describedby', options.hint ? hintId : errorId);
    }
  };

  input.addEventListener('input', () => setError());

  return { root, input, setError, value: () => input.value };
}

/**
 * Keeps the password hint in sync with the only rule we enforce: length.
 * Shows the green valid state as soon as the minimum is reached.
 */
export function bindPasswordLengthHint(
  field: FieldHandle,
  minLength = MIN_PASSWORD_LENGTH,
): void {
  const hint = field.root.querySelector<HTMLParagraphElement>('.field__hint');
  if (!hint) return;

  const update = () => {
    const valid = field.input.value.length >= minLength;
    hint.dataset.valid = String(valid);
    hint.textContent = valid
      ? `Panjang password sudah memenuhi syarat (minimal ${minLength} karakter).`
      : `Password minimal ${minLength} karakter.`;
  };

  field.input.addEventListener('input', update);
  update();
}

export interface ButtonOptions {
  label: string;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  icon?: string;
}

export interface ButtonHandle {
  button: HTMLButtonElement;
  setLoading: (loading: boolean) => void;
}

export function createButton(options: ButtonOptions): ButtonHandle {
  const button = document.createElement('button');
  button.type = options.type ?? 'button';
  button.className = [
    'btn',
    options.variant && options.variant !== 'primary' ? `btn--${options.variant}` : '',
    options.size && options.size !== 'md' ? `btn--${options.size}` : '',
    options.block ? 'btn--block' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const label = document.createElement('span');
  label.textContent = options.label;
  if (options.icon) {
    const icon = document.createElement('span');
    icon.innerHTML = iconMarkup(options.icon as Parameters<typeof iconMarkup>[0], 18);
    button.append(icon.firstElementChild!);
  }
  button.append(label);

  let loading = false;

  const setLoading = (next: boolean) => {
    if (loading === next) return;
    loading = next;
    button.disabled = next;
    button.setAttribute('aria-busy', String(next));
    if (next) {
      const spinner = document.createElement('span');
      spinner.className = 'btn__spinner';
      spinner.setAttribute('aria-hidden', 'true');
      button.replaceChildren(spinner, document.createTextNode('Memproses…'));
    } else {
      button.replaceChildren();
      if (options.icon) {
        const icon = document.createElement('span');
        icon.innerHTML = iconMarkup(options.icon as Parameters<typeof iconMarkup>[0], 18);
        button.append(icon.firstElementChild!);
      }
      button.append(label);
    }
  };

  return { button, setLoading };
}
