/** @type {import("jest").Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // Resolve workspace packages from TS source so unit tests never depend on a
    // prior `pnpm build` of packages/*.
    "^@nexahaus/(config|types|validation)$": "<rootDir>/../../../packages/$1/src/index.ts",
    // packages/* use "Bundler" module resolution, so their own source imports
    // each other with explicit ".js" specifiers (e.g. "./enums.js") that
    // resolve to the sibling ".ts" file. ts-jest's CommonJS resolver doesn't
    // do that remapping on its own, so strip the extension and let
    // moduleFileExtensions find the ".ts" file instead.
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  coverageThreshold: {
    global: { lines: 60, branches: 50 },
    "./modules/finance/": { lines: 90, branches: 85 },
    "./modules/authz/": { lines: 90, branches: 85 },
    "./modules/property-health/": { lines: 90, branches: 85 },
  },
};
