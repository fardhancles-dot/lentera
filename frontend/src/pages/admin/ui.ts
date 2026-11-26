import { icon, type IconName } from '../../components/icons';
import { el } from '../../utils/dom';

export interface AdminSectionContext {
  root: HTMLElement;
  reload: () => void;
  permissions: string[];
  navigate: (section: string) => void;
}

export function can(ctx: AdminSectionContext, permission: string): boolean {
  return ctx.permissions.includes(permission);
}

export function loading(text = 'Memuat data…'): HTMLElement {
  return el('div', { class: 'admin-loading' }, [
    el('span', { class: 'spinner' }),
    el('p', { text }),
  ]);
}

export function errorState(message: string, retry?: () => void): HTMLElement {
  return el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
    icon('alert', 18),
    el('span', { text: message }),
    retry
      ? el('button', {
          class: 'btn btn--sm btn--secondary',
          attrs: { type: 'button' },
          text: 'Coba lagi',
          events: { click: retry },
        })
      : null,
  ]);
}

export function panel(
  title: string,
  subtitle: string | null,
  children: Array<Node | string | null | false>,
  actions: HTMLElement[] = [],
): HTMLElement {
  return el('section', { class: 'card admin-panel' }, [
    el('div', { class: 'admin-panel__head' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: title }),
        subtitle ? el('p', { class: 'card__subtitle', text: subtitle }) : null,
      ]),
      actions.length ? el('div', { class: 'admin-panel__actions' }, actions) : null,
    ]),
    ...children,
  ]);
}

export function metric(label: string, value: string, note: string, name: IconName): HTMLElement {
  return el('div', { class: 'admin-metric' }, [
    el('span', { class: 'admin-metric__icon' }, [icon(name, 20)]),
    el('span', { class: 'admin-metric__label', text: label }),
    el('strong', { class: 'admin-metric__value', text: value }),
    el('span', { class: 'admin-metric__note', text: note }),
  ]);
}

export function button(
  label: string,
  name: IconName | null,
  onClick: () => void,
  variant: 'primary' | 'secondary' | 'danger' = 'secondary',
  small = true,
): HTMLButtonElement {
  return el(
    'button',
    {
      class: `btn${variant === 'secondary' ? ' btn--secondary' : ''}${
        variant === 'danger' ? ' btn--danger' : ''
      }${small ? ' btn--sm' : ''}`,
      attrs: { type: 'button' },
      events: { click: onClick },
    },
    [...(name ? [icon(name, 16)] : []), label],
  );
}

export function badge(text: string, tone: 'ok' | 'muted' | 'warn' | 'bad' = 'muted'): HTMLElement {
  return el('span', { class: `badge badge--${tone === 'ok' ? 'success' : tone === 'warn' ? 'warning' : tone === 'bad' ? 'danger' : 'muted'}`, text });
}

export function table(headers: string[], rows: Array<Array<Node | string | null>>): HTMLElement {
  return el('div', { class: 'admin-table-wrap' }, [
    el('table', { class: 'admin-table' }, [
      el('thead', {}, [
        el('tr', {}, headers.map((header) => el('th', { text: header }))),
      ]),
      el('tbody', {}, rows.map((row) => el('tr', {}, row.map((cell) => el('td', {}, [cell]))))),
    ]),
  ]);
}

export function field(label: string, control: HTMLElement, hint?: string): HTMLElement {
  return el('label', { class: 'admin-field' }, [
    el('span', { class: 'admin-field__label', text: label }),
    control,
    hint ? el('span', { class: 'form-hint', text: hint }) : null,
  ]);
}

export function input(
  name: string,
  value: string | number = '',
  type = 'text',
  attrs: Record<string, string | number | boolean | null> = {},
): HTMLInputElement {
  return el('input', {
    class: 'input',
    attrs: {
      type,
      name,
      value: String(value),
      ...attrs,
    },
  });
}

export function textarea(
  name: string,
  value = '',
  rows = 3,
  attrs: Record<string, string | number | boolean | null> = {},
): HTMLTextAreaElement {
  const control = el('textarea', {
    class: 'input admin-textarea',
    attrs: { name, rows, ...attrs },
  });
  control.value = value;
  return control;
}

export function select(
  name: string,
  options: Array<{ value: string; label: string }>,
  value = '',
): HTMLSelectElement {
  const control = el('select', { class: 'input', attrs: { name } });
  for (const option of options) {
    const node = el('option', { attrs: { value: option.value }, text: option.label });
    if (option.value === value) node.selected = true;
    control.append(node);
  }
  return control;
}

export function checkbox(name: string, checked: boolean, label: string): HTMLElement {
  const control = el('input', { attrs: { type: 'checkbox', name } });
  control.checked = checked;
  return el('label', { class: 'admin-check' }, [control, el('span', { text: label })]);
}

export function formGrid(children: Array<Node | null>): HTMLElement {
  return el('div', { class: 'admin-form-grid' }, children);
}

export interface DialogOptions {
  title: string;
  subtitle?: string;
  content: HTMLElement;
  submitLabel: string;
  onSubmit: (form: HTMLFormElement) => Promise<void>;
}

export function openDialog(options: DialogOptions): void {
  const message = el('p', { class: 'admin-form-error', attrs: { role: 'alert' } });
  const submit = el('button', { class: 'btn', attrs: { type: 'submit' } }, [
    options.submitLabel,
  ]);
  const form = el('form', { class: 'admin-dialog__form' }, [
    options.content,
    message,
    el('div', { class: 'admin-dialog__actions' }, [
      el('button', {
        class: 'btn btn--secondary',
        attrs: { type: 'button' },
        text: 'Batal',
        events: { click: () => close() },
      }),
      submit,
    ]),
  ]);
  const overlay = el('div', { class: 'admin-dialog' }, [
    el('div', {
      class: 'admin-dialog__backdrop',
      attrs: { 'aria-hidden': 'true' },
      events: { click: () => close() },
    }),
    el(
      'div',
      {
        class: 'admin-dialog__panel',
        attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': options.title },
      },
      [
        el('div', { class: 'admin-dialog__head' }, [
          el('div', {}, [
            el('h2', { class: 'admin-dialog__title', text: options.title }),
            options.subtitle
              ? el('p', { class: 'card__subtitle', text: options.subtitle })
              : null,
          ]),
          el('button', {
            class: 'icon-btn',
            attrs: { type: 'button', 'aria-label': 'Tutup' },
            events: { click: () => close() },
          }, [icon('close', 18)]),
        ]),
        form,
      ],
    ),
  ]);

  function close(): void {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') close();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.textContent = '';
    submit.disabled = true;
    submit.textContent = 'Menyimpan…';
    void options
      .onSubmit(form)
      .then(() => close())
      .catch((error: unknown) => {
        message.textContent = error instanceof Error ? error.message : 'Penyimpanan gagal.';
        submit.disabled = false;
        submit.textContent = options.submitLabel;
      });
  });

  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  const first = form.querySelector<HTMLElement>('input, select, textarea, button');
  first?.focus();
}

export function askReason(title: string, message: string, actionLabel: string): Promise<string | null> {
  return new Promise((resolve) => {
    const error = el('p', { class: 'admin-form-error', attrs: { role: 'alert' } });
    const reason = textarea('reason', '', 3, {
      maxlength: '160',
      placeholder: 'Alasan tindakan (3–160 karakter)',
    });
    const confirm = el('button', { class: 'btn btn--danger', attrs: { type: 'submit' } }, [
      actionLabel,
    ]);
    const form = el('form', { class: 'admin-dialog__form' }, [
      el('p', { class: 'admin-dialog__message', text: message }),
      field('Alasan', reason, 'Alasan dicatat pada audit log.'),
      error,
      el('div', { class: 'admin-dialog__actions' }, [
        el('button', {
          class: 'btn btn--secondary',
          attrs: { type: 'button' },
          text: 'Batal',
          events: { click: () => finish(null) },
        }),
        confirm,
      ]),
    ]);
    const overlay = el('div', { class: 'admin-dialog' }, [
      el('div', {
        class: 'admin-dialog__backdrop',
        attrs: { 'aria-hidden': 'true' },
        events: { click: () => finish(null) },
      }),
      el('div', {
        class: 'admin-dialog__panel',
        attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      }, [
        el('div', { class: 'admin-dialog__head' }, [
          el('h2', { class: 'admin-dialog__title', text: title }),
        ]),
        form,
      ]),
    ]);

    function finish(value: string | null): void {
      overlay.remove();
      resolve(value);
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = reason.value.trim();
      if (value.length < 3) {
        error.textContent = 'Alasan minimal 3 karakter.';
        return;
      }
      finish(value);
    });

    document.body.append(overlay);
    reason.focus();
  });
}

export function askConfirm(title: string, message: string, actionLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = el('div', { class: 'admin-dialog' }, [
      el('div', {
        class: 'admin-dialog__backdrop',
        attrs: { 'aria-hidden': 'true' },
        events: { click: () => finish(false) },
      }),
      el('div', {
        class: 'admin-dialog__panel admin-dialog__panel--sm',
        attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      }, [
        el('div', { class: 'admin-dialog__head' }, [
          el('h2', { class: 'admin-dialog__title', text: title }),
        ]),
        el('p', { class: 'admin-dialog__message', text: message }),
        el('div', { class: 'admin-dialog__actions' }, [
          el('button', {
            class: 'btn btn--secondary',
            attrs: { type: 'button' },
            text: 'Batal',
            events: { click: () => finish(false) },
          }),
          el('button', {
            class: 'btn btn--danger',
            attrs: { type: 'button' },
            text: actionLabel,
            events: { click: () => finish(true) },
          }),
        ]),
      ]),
    ]);
    function finish(value: boolean): void {
      overlay.remove();
      resolve(value);
    }
    document.body.append(overlay);
  });
}

export function formatDate(value: string, withTime = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function toLocalInput(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function fromForm(form: HTMLFormElement): FormData {
  return new FormData(form);
}

export function valueOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export function numOf(data: FormData, name: string, fallback = 0): number {
  const value = Number(valueOf(data, name));
  return Number.isFinite(value) ? value : fallback;
}

export function boolOf(data: FormData, name: string): boolean {
  return data.get(name) !== null;
}
