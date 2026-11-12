import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` is a Next.js marker that throws when imported outside RSC.
      // Vitest can't resolve it; shim it to an empty module so lib files that
      // import it (e.g. council-rates) can be tested in Node.
      "server-only": path.resolve(__dirname, "./vitest.server-only-shim.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
