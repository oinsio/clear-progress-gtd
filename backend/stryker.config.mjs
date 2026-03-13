/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
const config = {
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
  },
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/types/**/*.ts',
  ],
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
  timeoutMS: 10000,
  concurrency: 4,
};

export default config;
