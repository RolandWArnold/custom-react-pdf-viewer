// Avoid hard require() in ESM/bundlers; guard carefully.
export function assertPdfjsInstalled() {
  try {
    const req = (globalThis as any)?.require;
    if (req?.resolve) req.resolve('pdfjs-dist');
    else {
      // In ESM/bundlers, a missing pdfjs will be caught at build/first import anyway.
      return;
    }
  } catch {
    const msg =
      '[custom-react-pdf-viewer] Missing peer dependency "pdfjs-dist". ' +
      'Install it with: npm i pdfjs-dist@4.2.67 --no-optional';
    const isProd =
      // Node / webpack define plugin cases
      (typeof process !== 'undefined' && (process as any)?.env?.NODE_ENV === 'production') ||
      // Vite/Rspack/etc. (import.meta.env.MODE or PROD)
      (typeof import.meta !== 'undefined' &&
        (import.meta as any)?.env &&
        (((import.meta as any).env.PROD === true) ||
         ((import.meta as any).env.MODE === 'production')));
    if (!isProd) {
      // Be loud in dev
      // eslint-disable-next-line no-console
      console.error(msg);
    }
    throw new Error(msg);
  }
}
