export type Child = Node | string | number | null | undefined | false;

export interface ElOptions {
  class?: string;
  text?: string;
  /** Only pass static, trusted markup (icons and brand art). */
  html?: string;
  attrs?: Record<string, string | number | boolean | null | undefined>;
  dataset?: Record<string, string>;
  events?: Partial<Record<string, (event: Event) => void>>;
  style?: Partial<CSSStyleDeclaration>;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: ElOptions = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);

  if (options.class) node.className = options.class;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.html !== undefined) node.innerHTML = options.html;

  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      if (value === false || value === null || value === undefined) continue;
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }

  if (options.dataset) {
    for (const [key, value] of Object.entries(options.dataset)) {
      node.dataset[key] = value;
    }
  }

  if (options.style) Object.assign(node.style, options.style);

  if (options.events) {
    for (const [event, handler] of Object.entries(options.events)) {
      if (handler) node.addEventListener(event, handler);
    }
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return node;
}

export function clear(node: Element): void {
  node.replaceChildren();
}

export function fragment(children: Child[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    frag.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return frag;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatDate(value: string | Date, locale = 'id-ID'): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function formatNumber(value: number, locale = 'id-ID'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Focus trap used by dialogs; returns a cleanup function. */
export function trapFocus(container: HTMLElement): () => void {
  const selector =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
      (item) => item.offsetParent !== null,
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', onKeyDown);
  return () => container.removeEventListener('keydown', onKeyDown);
}
