import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // The app lives in frontend/, but env files and the deployment output stay at
  // the repository root so scripts and both hosting targets keep working.
  root: frontendRoot,
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: fileURLToPath(new URL('../dist', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Phaser is only fetched when a gameplay/mascot surface mounts.
        manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
      },
    },
  },
});
