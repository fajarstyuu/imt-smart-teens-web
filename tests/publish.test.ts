import {expect,test} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
test('publish produces both root and preview index SPA entries with identical built markup',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'imt-publish-test-'));const html='<!doctype html><div id="root">built-entry</div>';
 try{await mkdir(join(directory,'dist/assets'),{recursive:true});await writeFile(join(directory,'dist/app.html'),html);await writeFile(join(directory,'dist/assets/app.js'),'/* build asset */');const run=spawnSync(process.execPath,[resolve('scripts/publish.mjs')],{cwd:directory,encoding:'utf8'});expect(run.status).toBe(0);expect(await readFile(join(directory,'index.html'),'utf8')).toBe(html);expect(await readFile(join(directory,'dist/index.html'),'utf8')).toBe(html);}
 finally{await rm(directory,{recursive:true,force:true});}
});
