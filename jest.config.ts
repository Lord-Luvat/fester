import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
};

export default config;
