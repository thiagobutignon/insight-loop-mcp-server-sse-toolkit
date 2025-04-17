/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }]
  },
  moduleNameMapper: {
    // Handle module aliases (if you're using them in your project)
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // Handle ESM imports
  transformIgnorePatterns: [
    'node_modules/(?!(@modelcontextprotocol|zod)/)'
  ],
  // Setup files for test environment
  setupFilesAfterEnv: ['<rootDir>/jest.config.cjs'],
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov']
};
