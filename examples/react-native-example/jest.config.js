const base = require("../../jest.config");

const name = require("./package.json").name;

module.exports = {
  ...base,
  name,
  displayName: name,
  preset: "react-native",
  testEnvironment: "./__tests__/detox-environment",
  testRunner: "jest-circus/runner",
  testTimeout: 120000,
  testMatch: ["**/*.e2e.ts"],
  reporters: ["detox/runners/jest/streamlineReporter"],
  verbose: true,
};
