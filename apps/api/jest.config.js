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
