import { cp, readFile, writeFile } from 'node:fs/promises';
await cp('dist/assets', 'assets', { recursive: true });
await writeFile('index.html', await readFile('dist/app.html', 'utf8'));
console.log('Runnable entry: index.html');
