/** Real 200% browser zoom acceptance, not CSS zoom, pinch or device-scale emulation.
 * Primary references: developer.chrome.com/docs/extensions/reference/api/tabs
 * (setZoom/getZoom/setZoomSettings), playwright.dev/docs/chrome-extensions
 * (persistent context + chromium channel enables headless extension support).
 * The extension requests NO permissions. Profile is private scratch and removed.
 */
import {test,expect,chromium,type BrowserContext,type Page,type Locator} from '@playwright/test';
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const origin='http://127.0.0.1:5173';
const evidence=resolve('test-results/zoom-evidence');
async function data(context:BrowserContext,path:string){const r=await context.request.get(origin+'/api/v1'+path);expect(r.status(),`GET ${path}`).toBe(200);return (await r.json()).data;}
async function reachable(page:Page,control:Locator){
 await control.scrollIntoViewIfNeeded();await control.focus();await expect(control).toBeFocused();
 const box=await control.boundingBox();expect(box).not.toBeNull();
 const size=await page.evaluate(()=>({w:innerWidth,h:innerHeight}));
 expect(box!.x).toBeGreaterThanOrEqual(-1);expect(box!.y).toBeGreaterThanOrEqual(-1);
 expect(box!.x+box!.width).toBeLessThanOrEqual(size.w+1);expect(box!.y+box!.height).toBeLessThanOrEqual(size.h+1);
}
const button=(p:Page,name:string)=>p.getByRole('button',{name,exact:true});
test('native 200 percent zoom keeps student editor report and error dialog usable',async()=>{
 // Honor the real limiter; no backend mutation retry or policy override.
 await new Promise(resolve=>setTimeout(resolve,61000));mkdirSync(evidence,{recursive:true});
 const profile=mkdtempSync(join(process.env.TMPDIR||tmpdir(),'imt-zoom-'));
 const extension=resolve('tests/support/browser-zoom-extension');
 const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,viewport:null,baseURL:origin,args:['--window-size=1440,1000',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]}).catch(error=>{rmSync(profile,{recursive:true,force:true});throw error;});
 const page=context.pages()[0]??await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');
 // This worker has one app tab. No tabs/host/debugger permission is requested.
 const zoom=async(factor?:number)=>worker.evaluate(async(factor)=>{
  const chrome=(globalThis as any).chrome;const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(factor!==undefined){await chrome.tabs.setZoomSettings(tab.id,{mode:'automatic',scope:'per-tab'});await chrome.tabs.setZoom(tab.id,factor);}
  return {factor:await chrome.tabs.getZoom(tab.id),settings:await chrome.tabs.getZoomSettings(tab.id)};
 },factor);
 const metrics=()=>page.evaluate(()=>({innerWidth,innerHeight,outerWidth,outerHeight,dpr:devicePixelRatio,visualScale:visualViewport?.scale,visualWidth:visualViewport?.width,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,cssZoom:getComputedStyle(document.documentElement).zoom,bodyZoom:getComputedStyle(document.body).zoom}));
 const records:unknown[]=[];
 const cdp=await context.newCDPSession(page);
 const capture=async(name:string,position:'top'|'bottom'|'current'='top')=>{
  const state=await zoom();expect(state.factor).toBe(2);expect(state.settings.mode).toBe('automatic');expect(state.settings.scope).toBe('per-tab');
  const layout=await metrics();expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth+1);expect(layout.visualScale).toBe(1);expect(layout.cssZoom).toBe('1');expect(layout.bodyZoom).toBe('1');
  if(position!=='current')await page.evaluate(position=>scrollTo(0,position==='top'?0:document.documentElement.scrollHeight),position);
  await page.evaluate(async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  // Playwright's full-page clip uses the zoomed CSS width as physical pixels in
  // this no-emulation context, cropping half the native surface. Capture the
  // actual browser viewport via CDP with NO clip or device emulation instead.
  const image=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64');
  const width=image.readUInt32BE(16),height=image.readUInt32BE(20);
  expect(width).toBe(layout.innerWidth*layout.dpr);expect(Math.abs(height-layout.innerHeight*layout.dpr)).toBeLessThanOrEqual(2);
  writeFileSync(resolve(evidence,name+'.png'),image);
  records.push({screen:name,zoom:state,...layout,screenshotWidth:width,screenshotHeight:height});
 };
 try{
  if(!process.env.E2E_PRIVATE_ENV)throw Error('Private synthetic environment required');process.loadEnvFile(process.env.E2E_PRIVATE_ENV);
  const csrf=await data(context,'/csrf');const login=await context.request.post(origin+'/api/v1/admin/sessions',{headers:{Origin:origin,'X-CSRF-Token':csrf.token},data:{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}});expect(login.status()).toBe(201);
  const school=(await data(context,'/schools?q='+encodeURIComponent('Synthetic frontend integration school')))[0];expect(school).toBeTruthy();
  const name='Siswa sintetis zoom '+Date.now().toString(36);
  await page.goto('/');await page.getByLabel('Nama lengkap',{exact:false}).fill(name);await page.getByLabel('Cari sekolah aktif').fill(school.name);await expect(page.getByRole('option',{name:school.name,exact:true})).toBeAttached();await page.getByLabel('Asal sekolah',{exact:false}).selectOption(school.id);await page.getByLabel('Tanggal pengisian',{exact:false}).fill('2026-11-16');await button(page,'Mulai pre-test').click();await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();
  const baseline={zoom:await zoom(),...await metrics()};expect(baseline.zoom.factor).toBe(1);
  await zoom(2);await expect.poll(async()=> (await metrics()).dpr).toBe(baseline.dpr*2);
  const doubled=await metrics();expect(doubled.innerWidth).toBeCloseTo(baseline.innerWidth/2,0);expect(doubled.outerWidth).toBe(baseline.outerWidth);
  records.push({screen:'baseline-100-percent',...baseline});
  await reachable(page,page.locator('.answer-option input').first());await page.keyboard.press('Space');await expect(page.locator('.save-status')).toContainText('Jawaban tersimpan');
  await reachable(page,button(page,'Berikutnya'));await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();await capture('student-200');await capture('student-actions-200','bottom');
  // Real CMS editor, including scroll-to-field and keyboard-save at native zoom.
  await page.goto('/admin/materi/baru');await zoom(2);const title=page.getByLabel('Judul materi',{exact:false});await reachable(page,title);await title.fill('Materi sintetis zoom '+Date.now().toString(36));await page.getByLabel('Judul bagian 1',{exact:true}).fill('Bagian yang dapat dibaca');const body=page.getByLabel('Isi materi 1',{exact:true});await reachable(page,body);await body.fill('Teks materi sintetis untuk pemeriksaan zoom browser dua ratus persen.');
  await reachable(page,button(page,'Simpan draf'));await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/admin\/materi\/[a-f\d-]{36}$/);const lessonId=new URL(page.url()).pathname.split('/').pop()!;await capture('editor-200');await reachable(page,page.getByLabel('Judul materi',{exact:false}));await capture('editor-fields-200','current');await capture('editor-actions-200','bottom');
  // Real scoped report + stored answer detail (not a fabricated table).
  await page.goto('/admin/hasil?school_id='+school.id);await zoom(2);const details=button(page,'Lihat hasil '+name);await reachable(page,details);await page.keyboard.press('Enter');await reachable(page,button(page,'Lihat jawaban Pre-test'));await page.keyboard.press('Enter');await expect(page.locator('.student-answers')).toContainText('Pilihan pertama sintetis');await capture('report-200');await capture('report-answers-200','bottom');
  // The active confirmation receives a real backend409, so alert and both actions
  // must remain reachable within the zoomed, possibly scrollable dialog.
  await page.goto('/admin/materi/'+lessonId);await zoom(2);await button(page,'Arsipkan materi').click();await expect(page.getByRole('dialog')).toBeVisible();
  const lesson=await data(context,'/admin/lessons/'+lessonId),token=await data(context,'/csrf');
  const concurrent=await context.request.put(origin+'/api/v1/admin/lessons/'+lessonId,{headers:{Origin:origin,'X-CSRF-Token':token.token},data:{...lesson.draft,position:lesson.position,expected_revision:lesson.revision}});expect(concurrent.status()).toBe(200);
  await reachable(page,button(page,'Ya, arsipkan'));await page.keyboard.press('Enter');const alert=page.getByRole('dialog').getByRole('alert');await expect(alert).toBeVisible();await capture('dialog-error-200','current');
  await reachable(page,button(page,'Kembali'));await page.keyboard.press('Tab');await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(button(page,'Arsipkan materi')).toBeFocused();
  // Explicit cleanup of our synthetic draft via the UI; no destructive DB reset.
  await button(page,'Muat revisi terbaru').click();await expect(page.getByRole('status').filter({hasText:'Revisi dan posisi terbaru dimuat'})).toBeVisible();await button(page,'Arsipkan materi').click();await button(page,'Ya, arsipkan').click();await expect(button(page,'Simpan draf')).toBeDisabled();expect((await data(context,'/admin/lessons/'+lessonId)).state).toBe('archived');
  expect(errors).toEqual([]);
  await zoom(1);expect((await zoom()).factor).toBe(1);records.push({screen:'reset-100-percent',zoom:await zoom(),...await metrics()});
  writeFileSync(resolve(evidence,'metrics.json'),JSON.stringify({browser:context.browser()?.version(),method:'chrome.tabs.setZoom automatic per-tab; getZoom readback',records,interactions:['student keyboard answer/save/next','editor scroll/fill/keyboard-save','report keyboard detail/answer','real409 dialog keyboard actions/Escape/focus restoration'],pageErrors:errors},null,2));
  console.log('Native browser zoom verified',{factor:2,layoutWidth:doubled.innerWidth,dpr:doubled.dpr,visualScale:doubled.visualScale,screens:4,reset:1});
 }finally{
  await zoom(1).catch(()=>{});await context.close();rmSync(profile,{recursive:true,force:true});
 }
});
