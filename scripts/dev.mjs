import { spawn } from 'node:child_process';
// app.html is Vite's editable source entry; App immediately redirects its
// filename path to the BrowserRouter home route after the module mounts.
const sourceEntry='/app.html';
let existing=false;
try {const response=await fetch('http://127.0.0.1:4174/api/bootstrap');const body=await response.json();existing=response.ok&&body.config?.brand==='Imt Smart Teens';}catch{}
const processes = [...(existing?[]:[spawn(process.execPath, ['server/development.mjs'], { stdio: 'inherit' })]), spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--open', sourceEntry], { stdio: 'inherit' })];
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { processes.forEach(p => p.kill()); process.exit(); });
