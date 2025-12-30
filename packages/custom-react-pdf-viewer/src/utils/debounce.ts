// packages/custom-react-pdf-viewer/src/utils/debounce.ts

export function debounce(func: Function, wait: number) {
  let timeout: any;
  const debounced = (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.clear = () => clearTimeout(timeout);
  return debounced;
}