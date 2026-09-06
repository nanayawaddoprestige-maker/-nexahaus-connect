import config from "@nexahaus/eslint-config";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Nest DI relies on parameter decorators + class metadata.
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
    },
  },
];
