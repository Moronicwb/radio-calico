import { defineConfig, defineProject } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'backend',
          environment: 'node',
          include: ['tests/api/**/*.test.ts'],
          globalSetup: './tests/setup/db-global.ts',
          setupFiles: ['./tests/setup/db-each.ts'],
          env: {
            DATABASE_URL: 'postgresql://radiocalico:localdev@localhost:5432/radiocalico_test',
          },
        },
      }),
      defineProject({
        test: {
          name: 'frontend',
          environment: 'jsdom',
          include: ['tests/frontend/**/*.test.ts'],
        },
      }),
    ],
  },
})
