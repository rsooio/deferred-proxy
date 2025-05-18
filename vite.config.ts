import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "DeferredProxy",
      fileName: "deferred-proxy",
      formats: ["es", "umd"],
    },
    sourcemap: true,
    outDir: "dist",
    rollupOptions: {
      output: {
        exports: "named",
      },
    },
  },
  plugins: [dts()],
});
