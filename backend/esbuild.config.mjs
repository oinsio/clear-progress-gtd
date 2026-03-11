import { build } from 'esbuild';

await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/bundle.js',
  platform: 'browser',
  target: 'es2019',
  treeShaking: true,
});