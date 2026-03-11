module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.e2e.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
