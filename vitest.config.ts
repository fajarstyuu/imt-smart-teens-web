import { defineConfig } from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',include:['tests/**/*.test.ts','tests/**/*.test.tsx'],setupFiles:['tests/setup.ts'],maxWorkers:1,testTimeout:30000,hookTimeout:15000,environmentOptions:{jsdom:{url:'http://127.0.0.1:5173/'}}}});
