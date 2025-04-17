/** @type {import('jest').Config} */
module.exports = {
  // Preset can sometimes conflict, let's define manually for clarity
  // preset: 'ts-jest', // Try removing preset temporarily

  // Explicitly define extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test environment
  testEnvironment: 'node',

  // Transformation using ts-jest for ESM
  transform: {
    // Use Babel for JS/JSX if needed, but focus on TS first
    // '^.+\\.[tj]sx?$': 'babel-jest', // Only if you use Babel alongside TS

    // Process TypeScript files using ts-jest in ESM mode
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true,
    }]
  },

  // Module resolution and mapping
  moduleNameMapper: {
    // Handle module aliases (confirm this path is correct)
    '^@/(.*)$': '<rootDir>/src/$1',

    // Needed for ts-jest ESM support to map '.js' imports from '.ts' files
    '^(\\.{1,2}/.*)\\.js$': '$1',

    // Explicitly map chalk's internal #ansi-styles import
    // Adjust path based on your actual node_modules structure if needed
    '#ansi-styles': '<rootDir>/node_modules/chalk/source/vendor/ansi-styles/index.js',
  },

  // Tell Jest NOT to ignore these ESM packages for transformation
  transformIgnorePatterns: [
    // Match node_modules EXCEPT the specified ESM packages
    '/node_modules/(?!(chalk|globby|@modelcontextprotocol|zod)/)',
    // Alternatively, a simpler pattern if the above is tricky:
    // 'node_modules/(?!chalk|globby|@modelcontextprotocol|zod)',
  ],

  // Setup files for test environment
  // setupFilesAfterEnv: ['<rootDir>/jest.config.cjs'], // <-- COMMENT THIS OUT for now
  // If you have a real setup file, use its correct path: e.g., '<rootDir>/jest.setup.js'

  // Required by ts-jest when useESM is true
  extensionsToTreatAsEsm: ['.ts'],

  // --- Optional: Node experimental flag (if the above still fails) ---
  // You might need to run Jest with the Node flag:
  // NODE_OPTIONS=--experimental-vm-modules npx jest
  // This tells Node itself to handle ESM more natively, which ts-jest hooks into.

  // Coverage configuration (can keep this)
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov']
};