import '@testing-library/jest-dom';

// Mock Web Crypto API if needed in jsdom
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = {};
}
if (!globalThis.crypto.subtle) {
  // @ts-ignore
  globalThis.crypto.subtle = {
    digest: async (_algo: string, _data: ArrayBuffer) => {
      // Mock SHA-256 returns 32 bytes
      return new Uint8Array(32).buffer;
    },
  };
}
