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
    if (process.env.NODE_ENV !== 'production') {
      // Be loud in dev
      // eslint-disable-next-line no-console
      console.error(msg);
    }
    throw new Error(msg);
  }
}
