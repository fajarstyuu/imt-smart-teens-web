import {defineConfig} from '@playwright/test';
import {resolveRunnerEnvironment} from './scripts/playwright-env.mjs';
const runnerEnvironment=resolveRunnerEnvironment();
// Separate sequential gate: native zoom requires full Chromium + an isolated
// persistent extension context, not Headless Shell or viewport/DPR emulation.
export default defineConfig({testDir:'./tests',testMatch:'**/zoom.spec.ts',outputDir:'test-results/zoom-run',fullyParallel:false,workers:1,timeout:180000,reporter:'list',use:{actionTimeout:15000,baseURL:runnerEnvironment.testOrigin,trace:'off',screenshot:'off',video:'off'},webServer:{command:'npm run dev',url:runnerEnvironment.testOrigin+'/app.html',reuseExistingServer:false,timeout:20000,env:{RUST_API_ORIGIN:runnerEnvironment.rustApiOrigin,VITE_DEV_PORT:String(runnerEnvironment.vitePort)}}});
