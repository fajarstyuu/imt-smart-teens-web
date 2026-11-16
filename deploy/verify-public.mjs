// Public, anonymous browser proof only: never create accounts or teaching fixtures.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const base='https://imtsmartteens.my.id';
const evidence='test-results/deployment-public';
await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  const errors=[];const mutations=[];const consoleErrors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push({message:message.text(),url:message.location().url});});
  page.on('request',request=>{if(request.url().startsWith(base)&&!['GET','HEAD','OPTIONS'].includes(request.method()))mutations.push(request.method());});
  await page.goto(base,{waitUntil:'networkidle'});
  await expect(page.getByRole('heading',{name:'Selamat datang.',exact:true})).toBeVisible();
  await expect(page).toHaveTitle(/Imt Smart Teens/i);
  const images=await page.locator('img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0));
  if(!images)throw new Error('A deployed image did not load');
  await page.screenshot({path:`${evidence}/student-desktop.png`,fullPage:true});
  await page.getByRole('button',{name:'Ruang admin',exact:true}).click();
  await expect(page).toHaveURL(`${base}/admin/masuk`);
  await expect(page.getByRole('heading',{name:'Masuk ruang admin.',exact:true})).toBeVisible();
  await page.locator('form').evaluate(form=>form.requestSubmit());
  await expect(page.getByText('Kolom ini wajib diisi.',{exact:true}).first()).toBeVisible();
  await page.screenshot({path:`${evidence}/admin-desktop.png`,fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:`${evidence}/admin-mobile.png`,fullPage:true});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Mobile admin overflows horizontally');
  await page.goto(base,{waitUntil:'networkidle'});
  await expect(page.getByRole('heading',{name:'Selamat datang.',exact:true})).toBeVisible();
  await page.locator('form').evaluate(form=>form.requestSubmit());
  await expect(page.getByText('Kolom ini wajib diisi.',{exact:true}).first()).toBeVisible();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Mobile student overflows horizontally');
  await page.screenshot({path:`${evidence}/student-mobile.png`,fullPage:true});
  if(errors.length||mutations.length)throw new Error('Unexpected page exception or production mutation');
  const report={url:base,hostOriginated:true,pageErrors:errors,productionMutations:mutations,consoleErrors,screenshots:4,imagesLoaded:images,mobileHorizontalOverflow:false};
  await writeFile(`${evidence}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  await context.close();
} finally {await browser.close();}
