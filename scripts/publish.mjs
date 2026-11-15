import { cp, readFile, writeFile } from 'node:fs/promises';
await cp('dist/assets', 'assets', { recursive: true });
// Vite preview serves dist/index.html; static publishing retains the root index entry.
const html=await readFile('dist/app.html','utf8');
await writeFile('dist/index.html',html);
await writeFile('index.html',html);
console.log('Runnable entry: index.html');
