import { defineConfig } from 'vitest/config';
export default defineConfig({define:{'import.meta.env.VITE_API_URL':JSON.stringify('http://127.0.0.1:4176/api')},test:{environment:'jsdom',include:['tests/components.test.tsx'],setupFiles:['tests/setup.ts'],maxWorkers:1,testTimeout:30000,hookTimeout:15000,environmentOptions:{jsdom:{url:'http://127.0.0.1:4176/'}}}});
