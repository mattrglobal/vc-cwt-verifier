const name = require("./package.json").name;

module.exports = {
  name,
  displayName: name,
  collectCoverage: true,
  coverageDirectory: "./jest_results/coverage/",
  coverageReporters: ["lcov", "text"],
  coveragePathIgnorePatterns: ["<rootDir>/__tests__"],
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/lib/"],
  silent: true,
  restoreMocks: true,
  clearMocks: true,
  resetMocks: false,
};
