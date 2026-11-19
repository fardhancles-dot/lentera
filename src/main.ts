import '@fontsource-variable/nunito/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';
import './styles/journey.css';
import './styles/practice.css';
import './styles/social.css';
import './styles/developer.css';
import './styles/admin.css';

import { Router } from './app/router';
import { kikoMarkup, lampMarkup } from './components/brandArt';
import { brand } from './config/brand';
import { installAudioUnlock } from './game/audio/audioEngine';
import { backgroundMusic } from './game/audio/backgroundMusic';
import { contentService } from './services/content.service';
import { sessionStore } from './stores/session.store';

const rootElement = document.querySelector<HTMLElement>('#app');
if (!rootElement) throw new Error('Elemen #app tidak ditemukan.');
const root: HTMLElement = rootElement;

root.innerHTML = `
  <div class="boot-splash">
    <div class="boot-splash__mark">${lampMarkup(44)}</div>
    <p class="boot-splash__name">${brand.name}</p>
    <p class="boot-splash__tag">${brand.tagline}</p>
    <div class="boot-splash__art">${kikoMarkup(120)}</div>
    <div class="boot-splash__loader" aria-label="Memuat aplikasi"><span></span></div>
  </div>
`;

document.documentElement.dataset.reducedMotion = String(
  window.matchMedia('(prefers-reduced-motion: reduce)').matches,
);

installAudioUnlock();
// Starts in the background so the first paint is never blocked by the audio
// configuration request. The player arms a first-gesture retry if the browser
// blocks autoplay.
backgroundMusic.start();

sessionStore.subscribe((state) => {
  if (state.user) {
    document.documentElement.dataset.reducedMotion = String(state.user.settings.reduced_motion);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[app] unhandled rejection', event.reason);
});

const router = new Router(root);

async function boot(): Promise<void> {
  try {
    // Public CMS content is applied before the first route so the landing page
    // and document title use runtime branding. Failure keeps build defaults.
    await contentService.init();
    await router.start();
  } catch (error) {
    console.error('[app] boot failed', error);
    root.innerHTML = '';
    const { render } = await import('./pages/error.page');
    await render({
      outlet: root,
      path: window.location.pathname,
      params: {},
      query: new URLSearchParams(window.location.search),
      navigate: (url) => {
        window.location.assign(url);
      },
      onCleanup: () => undefined,
    });
  }
}

void boot();
