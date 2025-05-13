module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/tests/',
    '/src/config/',
    '/src/scripts/'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  verbose: true
}; 