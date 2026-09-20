import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build as buildMain } from 'esbuild';
import { build as buildRenderer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(new URL('../dist/main/', import.meta.url), { recursive: true });
await buildMain({
  absWorkingDir: root,
  entryPoints: ['src/main/main.ts', 'src/main/preload.ts'],
  outdir: 'dist/main',
  outExtension: { '.js': '.cjs' },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: ['electron'],
  sourcemap: true,
});
await buildRenderer({ root, configFile: new URL('../vite.config.ts', import.meta.url).pathname });
