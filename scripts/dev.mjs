/** Start only the frontend; never replace Rust with legacy fixtures. */
import {spawn} from 'node:child_process';
const origin=process.env.RUST_API_ORIGIN||'http://127.0.0.1:4180';
try{const response=await fetch(`${origin}/health/ready`,{signal:AbortSignal.timeout(3000)});if(!response.ok||(await response.json()).data?.status!=='ready')throw Error('Rust is not ready');}catch{console.error('Rust API is not ready. Start the reviewed Rust service separately; no fixture fallback is available.');process.exit(1);}
const child=spawn(process.execPath,['node_modules/vite/bin/vite.js'],{stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??1));
