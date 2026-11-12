// Empty shim for the Next.js `server-only` package when running under Vitest.
// The real package exists only to throw if accidentally imported from a client
// component; in a Node test runner that assertion has no meaning.
export {};
