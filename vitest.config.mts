import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    testTimeout: 120_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    env: {
      DB_PATH: resolve(__dirname, "data", "tasks-test.db"),
    },
  },
});
