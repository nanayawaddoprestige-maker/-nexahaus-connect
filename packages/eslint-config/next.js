import base from "./index.js";
import globals from "globals";

/**
 * Next.js apps additionally wire in `eslint-config-next` via their own
 * `eslint.config.mjs` (it is app-scoped). This layer just adds browser globals
 * and relaxes a couple of rules that fight the App Router.
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
];
