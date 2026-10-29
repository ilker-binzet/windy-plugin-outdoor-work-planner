import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['bundle-tests/**/*.test.ts'] } });
