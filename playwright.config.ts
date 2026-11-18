import {defineConfig} from '@playwright/test';
import {resolveRunnerEnvironment} from './scripts/playwright-env.mjs';
const runnerEnvironment=resolveRunnerEnvironment();
export default defineConfig({testDir:'./tests',testMatch:'**/rust.spec.ts',fullyParallel:false,workers:1,timeout:180000,reporter:'list',use:{actionTimeout:15000,baseURL:runnerEnvironment.testOrigin,headless:true,viewport:{width:1440,height:1000},trace:'off',screenshot:'off',video:'off',launchOptions:{executablePath:process.env.RG_CHROME_PATH||undefined}},webServer:{command:'npm run dev',url:runnerEnvironment.testOrigin+'/app.html',reuseExistingServer:false,timeout:20000,env:{RUST_API_ORIGIN:runnerEnvironment.rustApiOrigin,VITE_DEV_PORT:String(runnerEnvironment.vitePort)}}});
