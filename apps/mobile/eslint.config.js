import config from "@nexahaus/eslint-config/react-library";

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
  },
  { ignores: [".expo/**", "babel.config.js"] },
];
