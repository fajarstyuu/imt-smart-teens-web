import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {expect,test} from 'vitest';
import {resolveRunnerEnvironment} from '../scripts/playwright-env.mjs';

const root=resolve(import.meta.dirname,'..');
const configs=['playwright.config.ts','playwright.zoom.config.ts'];
const matrix=[
 {name:'defaults',env:{},expected:{vitePort:5173,testOrigin:'http://127.0.0.1:5173',rustApiOrigin:'http://127.0.0.1:4180'}},
 {name:'explicit canonical values',env:{E2E_ORIGIN:'http://127.0.0.1:5281',VITE_DEV_PORT:'5281',RUST_API_ORIGIN:'http://127.0.0.1:4181'},expected:{vitePort:5281,testOrigin:'http://127.0.0.1:5281',rustApiOrigin:'http://127.0.0.1:4181'}},
 {name:'QA aliases',env:{PORT:'5282',RUST_API_URL:'http://127.0.0.1:4182'},expected:{vitePort:5282,testOrigin:'http://127.0.0.1:5282',rustApiOrigin:'http://127.0.0.1:4182'}},
];

test('both normal and native-zoom configs consume the same resolved test origin, readiness URL, and child Vite/API values',()=>{
 for(const name of configs){
  const source=readFileSync(resolve(root,name),'utf8');
  expect(source,`${name} should use shared runner resolution`).toContain('resolveRunnerEnvironment');
  expect(source,`${name} page base must use the resolved origin`).toContain('baseURL:runnerEnvironment.testOrigin');
  expect(source,`${name} readiness must use the resolved origin`).toContain("url:runnerEnvironment.testOrigin+'/app.html'");
  expect(source,`${name} must pass resolved Vite and Rust values to Vite`).toContain('runnerEnvironment.vitePort');
  expect(source,`${name} must pass the canonical Rust origin to the child`).toContain('runnerEnvironment.rustApiOrigin');
 }
});

test('browser specs consume preloaded secrets without changing runner origins after module initialization',()=>{
 for(const name of ['tests/rust.spec.ts','tests/zoom.spec.ts']){
  const source=readFileSync(resolve(root,name),'utf8');
  expect(source,`${name} must not load env after resolving its origin`).not.toContain('process.loadEnvFile');
  expect(source,`${name} must use the shared resolved origin`).toContain('resolveRunnerEnvironment().testOrigin');
 }
});

test.each(matrix)('resolves $name consistently',({env,expected})=>{
 expect(resolveRunnerEnvironment(env)).toEqual(expected);
});

test('rejects conflicting explicit origin/port settings instead of silently picking one',()=>{
 expect(()=>resolveRunnerEnvironment({E2E_ORIGIN:'http://127.0.0.1:5188',VITE_DEV_PORT:'5173'})).toThrow(/Conflicting frontend port settings/);
 expect(()=>resolveRunnerEnvironment({RUST_API_ORIGIN:'http://127.0.0.1:4180',RUST_API_URL:'http://127.0.0.1:4183'})).toThrow(/Conflicting API origin settings/);
});

test('accepts an explicit HTTPS Rust proxy origin while keeping the frontend origin HTTP-only',()=>{
 expect(resolveRunnerEnvironment({VITE_DEV_PORT:'5284',RUST_API_ORIGIN:'https://api.example.test'})).toEqual({vitePort:5284,testOrigin:'http://127.0.0.1:5284',rustApiOrigin:'https://api.example.test'});
 expect(()=>resolveRunnerEnvironment({RUST_API_ORIGIN:'https://user:pass@api.example.test'})).toThrow(/without credentials/);
 expect(()=>resolveRunnerEnvironment({E2E_ORIGIN:'https://frontend.example.test'})).toThrow(/E2E_ORIGIN must be an HTTP origin/);
});

async function freePort(){
 const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const address=server.address();if(!address||typeof address==='string')throw new Error('Could not reserve an ephemeral port');
 const port=address.port;await new Promise<void>((done,reject)=>server.close(error=>error?reject(error):done()));return port;
}

async function waitForFrontend(child,origin){
 for(let attempt=0;attempt<80;attempt++){
  if(child.exitCode!==null)throw new Error(`Vite exited before readiness with code ${child.exitCode}`);
  try{const response=await fetch(origin+'/app.html',{signal:AbortSignal.timeout(250)});if(response.status===200)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 throw new Error(`Frontend did not become ready at ${origin}/app.html`);
}

for(const name of ['explicit canonical values','QA aliases'])test(`Vite starts and serves the app under ${name} resolution (frontend-only; no API integration)`,async()=>{
 const port=await freePort();
 const env=name==='explicit canonical values'
  ?{E2E_ORIGIN:`http://127.0.0.1:${port}`,VITE_DEV_PORT:String(port),RUST_API_ORIGIN:'http://127.0.0.1:9'}
  :{PORT:String(port),RUST_API_URL:'http://127.0.0.1:9'};
 const runner=resolveRunnerEnvironment(env);expect(runner.vitePort).toBe(port);
 const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1'],{cwd:root,stdio:'ignore',env:{PATH:process.env.PATH??'',HOME:process.env.HOME??'',NODE_ENV:'test',VITE_DEV_PORT:String(runner.vitePort),RUST_API_ORIGIN:runner.rustApiOrigin}});
 try{await waitForFrontend(child,runner.testOrigin);}
 finally{child.kill('SIGTERM');await once(child,'exit').catch(()=>{});}
});
