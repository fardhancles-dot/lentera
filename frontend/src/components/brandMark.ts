import { contentService } from '../services/content.service';
import { el } from '../utils/dom';
import { lampMarkup } from './brandArt';

/**
 * Renders the CMS logo when one is configured, otherwise the built-in lamp
 * artwork. Used by every player-facing brand header.
 */
export function brandMark(size: number, className = 'brand__mark'): HTMLElement {
  const logo = contentService.settings.logoUrl;
  if (logo) {
    const wrap = el('span', { class: className });
    const image = el('img', {
      attrs: {
        src: logo,
        alt: '',
        width: size,
        height: size,
        style: `width:${size}px;height:${size}px;object-fit:contain;`,
      },
    });
    // A deleted or unreachable upload must not leave a broken brand image.
    image.addEventListener('error', () => {
      wrap.innerHTML = lampMarkup(size);
    }, { once: true });
    wrap.append(image);
    return wrap;
  }
  return el('span', { class: className, html: lampMarkup(size) });
}
