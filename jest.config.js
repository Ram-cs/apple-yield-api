module.exports = {
   preset: 'ts-jest',
   testEnvironment: 'node',
   transform: {
      '^.+\\.ts$': 'ts-jest',
   },
   testMatch: ['**/tests/**/*.test.ts'], // test files location
};
