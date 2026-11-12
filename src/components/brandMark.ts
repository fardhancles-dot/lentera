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
    return el('span', { class: className }, [
      el('img', {
        attrs: {
          src: logo,
          alt: '',
          width: size,
          height: size,
          style: `width:${size}px;height:${size}px;object-fit:contain;`,
        },
      }),
    ]);
  }
  return el('span', { class: className, html: lampMarkup(size) });
}
