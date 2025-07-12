// Polyfill for server-side rendering
if (typeof self === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).self = global;
}

export {};
