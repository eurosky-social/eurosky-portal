/**
 * Make `fetch` fail, as if offline; preload with `--import`.
 */
globalThis.fetch = (): Promise<Response> => Promise.reject(new Error('Offline'))
