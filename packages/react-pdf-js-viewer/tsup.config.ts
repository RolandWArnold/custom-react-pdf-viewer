import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/style.css'],
  format: ['esm'],                 // ESM only (fixes import.meta warning)
  dts: false,
  sourcemap: true,
  clean: true,
  bundle: true,
  minify: true,
  splitting: false,
  outDir: 'dist',
  external: ['react', 'react-dom', 'pdfjs-dist'],
  target: 'es2023',
});
