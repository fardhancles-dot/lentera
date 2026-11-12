import type { PageModule } from '../app/router';
import { brandMark } from '../components/brandMark';
import { contentService } from '../services/content.service';
import { el } from '../utils/dom';
import type { PublicContentPage } from '../types/siteContent';

const meta = { title: 'Informasi' };

function renderBlock(block: Record<string, unknown>): HTMLElement | null {
  const type = String(block.type ?? '');
  const text = (key: string) => String(block[key] ?? '').trim();

  if (type === 'heading') {
    const value = text('text');
    return value ? el('h2', { class: 'info-block__heading', text: value }) : null;
  }
  if (type === 'paragraph') {
    const value = text('text');
    return value ? el('p', { class: 'info-block__paragraph', text: value }) : null;
  }
  if (type === 'list') {
    const items = Array.isArray(block.items)
      ? block.items.map((item) => String(item).trim()).filter(Boolean)
      : [];
    return items.length
      ? el('ul', { class: 'info-block__list' }, items.map((item) => el('li', { text: item })))
      : null;
  }
  if (type === 'image') {
    const url = text('url');
    if (!url) return null;
    return el('figure', { class: 'info-block__figure' }, [
      el('img', { attrs: { src: url, alt: text('alt'), loading: 'lazy' } }),
      text('caption') ? el('figcaption', { class: 'admin-sub', text: text('caption') }) : null,
    ]);
  }
  if (type === 'callout') {
    const value = text('text');
    return value ? el('aside', { class: 'info-block__callout' }, [el('p', { text: value })]) : null;
  }
  if (type === 'faq') {
    const question = text('question');
    const answer = text('answer');
    if (!question || !answer) return null;
    return el('details', { class: 'info-block__faq' }, [
      el('summary', { text: question }),
      el('p', { text: answer }),
    ]);
  }
  return null;
}

function pageView(page: PublicContentPage): HTMLElement {
  const settings = contentService.settings;
  return el('div', { class: 'info-page' }, [
    el('header', { class: 'landing__nav' }, [
      el('a', { class: 'brand', attrs: { href: '/' } }, [
        brandMark(30),
        el('span', { class: 'brand__text' }, [
          el('span', { class: 'brand__name', text: settings.siteName }),
          el('span', { class: 'brand__tag', text: settings.tagline }),
        ]),
      ]),
      el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/' }, text: 'Kembali' }),
    ]),
    el('main', { class: 'info-page__main', attrs: { id: 'main' } }, [
      el('article', { class: 'info-page__article' }, [
        el('h1', { class: 'info-page__title', text: page.title }),
        page.summary ? el('p', { class: 'info-page__summary', text: page.summary }) : null,
        el('div', { class: 'info-blocks' }, page.blocks.map(renderBlock).filter((node): node is HTMLElement => Boolean(node))),
        page.updatedAt
          ? el('p', { class: 'info-page__updated', text: `Diperbarui ${new Date(page.updatedAt).toLocaleDateString('id-ID')}` })
          : null,
      ]),
    ]),
    el('footer', { class: 'landing__footer' }, [
      el('span', { text: settings.copyright }),
      settings.supportUrl
        ? el('a', { attrs: { href: settings.supportUrl }, text: 'Bantuan' })
        : null,
    ]),
  ]);
}

async function render(ctx: Parameters<PageModule['render']>[0]): Promise<void> {
  const slug = ctx.params.slug ?? '';
  ctx.outlet.replaceChildren(
    el('div', { class: 'info-page__loading' }, [el('p', { text: 'Memuat halaman…' })]),
  );
  const page = await contentService.getPage(slug);
  if (!page) {
    ctx.outlet.replaceChildren(
      el('div', { class: 'info-page__loading' }, [
        el('h1', { text: 'Halaman tidak ditemukan' }),
        el('p', { text: 'Halaman ini belum diterbitkan atau sudah diarsipkan.' }),
        el('a', { class: 'btn', attrs: { href: '/' }, text: 'Kembali ke beranda' }),
      ]),
    );
    return;
  }
  document.title = `${page.metaTitle || page.title} · ${contentService.settings.siteName}`;
  if (page.metaDescription) {
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = page.metaDescription;
  }
  ctx.outlet.replaceChildren(pageView(page));
}

export { meta, render };
