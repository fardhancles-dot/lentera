/**
 * GitHub Pages has no rewrite rules: a deep link such as
 * `/lentera/learn/ipa` would 404 instead of loading the SPA. Copying the built
 * index.html to 404.html lets Pages serve the app for those paths while the
 * router reads the original URL.
 */
import { copyFile, writeFile } from 'node:fs/promises';

await copyFile('dist/index.html', 'dist/404.html');
await writeFile('dist/.nojekyll', '');
console.log('[pages] wrote dist/404.html and dist/.nojekyll');
