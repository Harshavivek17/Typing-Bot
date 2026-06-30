import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      $: "/src",
    },
  },
  esbuild: {
    /* Need these two properties to enable JSX in a typescript environment */
    jsx: "automatic",
    jsxImportSource: "@kitajs/html",
  },
});
