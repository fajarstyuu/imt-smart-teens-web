import {defineConfig} from '@playwright/test';
// Separate sequential gate: native zoom requires full Chromium + an isolated
// persistent extension context, not Headless Shell or viewport/DPR emulation.
export default defineConfig({testDir:'./tests',testMatch:'**/zoom.spec.ts',outputDir:'test-results/zoom-run',fullyParallel:false,workers:1,timeout:180000,reporter:'list',use:{actionTimeout:15000,trace:'off',screenshot:'off',video:'off'},webServer:{command:'npm run dev',url:'http://127.0.0.1:5173/app.html',reuseExistingServer:false,timeout:20000}});
