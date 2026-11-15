/** Real Rust/PostgreSQL acceptance. No fixture server, database resets or teaching SQL.
 * Operator provides E2E_PRIVATE_ENV and optionally E2E_GRANT_HELPER for the owned synthetic DB.
 * Credentials are loaded only in the Node worker and injected via its request context.
 */
import {test,expect,type BrowserContext,type Page} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const origin='http://127.0.0.1:5173';
const evidence=resolve('test-results/evidence');
async function data(context:BrowserContext,path:string){const response=await context.request.get('/api/v1'+path);expect(response.status(),`GET ${path}`).toBe(200);return (await response.json()).data;}
async function login(context:BrowserContext){
 if(!process.env.E2E_PRIVATE_ENV)throw Error('E2E_PRIVATE_ENV must reference an operator-owned synthetic integration environment.');
 process.loadEnvFile(process.env.E2E_PRIVATE_ENV);
 const csrf=await data(context,'/csrf');
 const response=await context.request.post('/api/v1/admin/sessions',{headers:{Origin:origin,'X-CSRF-Token':csrf.token},data:{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}});
 expect(response.status(),'private Node-side admin login').toBe(201);
}
async function click(page:Page,name:string){await page.getByRole('button',{name,exact:true}).click();}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);}
async function answer(page:Page,type:'pre-test'|'quiz'|'post-test',clear=false){
 await expect(page.getByRole('heading',{name:type==='quiz'?'Quiz':type==='pre-test'?'Pre-test':'Post-test',exact:true})).toBeVisible();
 const count=await page.locator('.question-navigation button').count()||await page.locator('.question-nav button').count();
 // The question count comes from the rendered assessment progress, not a fixture assumption.
 const progress=page.getByRole('progressbar',{name:'Pertanyaan terjawab'});const total=Number(await progress.getAttribute('max'));
 expect(total).toBeGreaterThan(0);
 for(let i=0;i<total;i++){
  if(await page.locator('.answer-option input').first().isChecked()){await click(page,'Kosongkan jawaban');await expect(page.locator('.save-status')).toContainText('Jawaban tersimpan');}
  await page.locator('.answer-option input').first().check();await expect(page.locator('.save-status')).toContainText('Jawaban tersimpan');
  if(clear&&i===0){await click(page,'Kosongkan jawaban');await expect(page.locator('.save-status')).toContainText('Jawaban tersimpan');await expect(page.locator('.answer-option input').first()).not.toBeChecked();await page.locator('.answer-option input').first().check();await expect(page.locator('.save-status')).toContainText('Jawaban tersimpan');}
  if(i<total-1)await click(page,'Berikutnya');
 }
 await click(page,`Kirim ${type}`);await expect(page.getByRole('dialog')).toBeVisible();await click(page,'Kirim jawaban');
 await expect(page.getByRole('heading',{name:/Jawabanmu sudah terkirim|Seluruh tahap telah selesai/})).toBeVisible();
}
test('real CMS publications, full student journey, scoped historical reporting and archive',async({browser})=>{
 mkdirSync(evidence,{recursive:true});
 const admin=await browser.newContext({baseURL:origin,viewport:{width:1440,height:1000}});await login(admin);
 const page=await admin.newPage();const errors:string[]=[];const urls:string[]=[];
 const observe=(p:Page)=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('401')&&!m.text().includes('403')&&!m.text().includes('409'))errors.push(m.text());});p.on('request',r=>{urls.push(r.url());expect(r.headers().authorization).toBeUndefined();});};observe(page);
 const initialLessons=await data(admin,'/admin/lessons?limit=25&offset=0');const banks=await data(admin,'/admin/question-banks');const initialPath=await data(admin,'/admin/learning-path');
 console.log('Real CMS initial state',{lessons:initialLessons.length,banks:banks.length,pathPublished:!!initialPath.published});
 const suffix=Date.now().toString(36),schoolName=`Sekolah sintetis UI ${suffix}`;
 await page.goto('/admin/sekolah');await expect(page.getByRole('heading',{name:'Sekolah',exact:true})).toBeVisible();
 await click(page,'Tambah sekolah');await page.getByLabel('Nama sekolah',{exact:false}).fill(schoolName);
 const created=page.waitForResponse(r=>r.url().endsWith('/api/v1/admin/schools')&&r.request().method()==='POST');await click(page,'Simpan sekolah');const schoolResponse=await created;expect(schoolResponse.status()).toBe(201);const school=(await schoolResponse.json()).data;
 if(!process.env.E2E_GRANT_HELPER)throw Error('Operator must supply E2E_GRANT_HELPER to grant the new synthetic school to this admin.');
 execFileSync('python3',[process.env.E2E_GRANT_HELPER,school.id],{stdio:'pipe'});
 await page.reload();await page.getByLabel('Cari sekolah',{exact:true}).fill(schoolName);await expect(page.getByText(schoolName,{exact:true})).toBeVisible();
 await page.screenshot({path:resolve(evidence,'admin-schools-desktop.png'),fullPage:true});
 // Author via browser CMS. On retries, inspect and reuse this test's already-authored drafts, never wipe data.
 for(let i=1;i<=2;i++){
  const title=`Materi sintetis integrasi ${i}`;const existing=(await data(admin,'/admin/lessons?limit=100&offset=0')).find((l:any)=>l.draft.title===title&&l.state!=='archived');
  await page.goto(existing?`/admin/materi/${existing.id}`:'/admin/materi/baru');await expect(page.getByLabel('Judul materi',{exact:false})).toBeVisible();
  await page.getByLabel('Judul materi',{exact:false}).fill(title);await page.getByLabel('Deskripsi',{exact:true}).fill('Materi pengukuran sintetis untuk verifikasi integrasi.');
  await page.getByLabel('Judul bagian 1',{exact:true}).fill('Pengukuran yang tercatat');await page.getByLabel('Isi materi 1',{exact:true}).fill('Gunakan alat pengukuran sesuai petunjuk pendamping. Catat hasil pengukuran dengan satuan yang tepat.');
  await click(page,'Simpan draf');await expect(page.getByRole('button',{name:'Terbitkan materi',exact:true})).toBeEnabled();await click(page,'Terbitkan materi');await expect(page.getByRole('status').filter({hasText:'Versi materi diterbitkan'})).toBeVisible();
 }
 for(const bank of banks){
  for(let i=1;i<=2;i++){
   const text=`Soal sintetis ${bank.kind} ${i}`;const questions=await data(admin,`/admin/question-banks/${bank.id}/questions?limit=100&offset=0`);const existing=questions.find((q:any)=>q.draft.text===text&&q.state!=='archived');
   await page.goto(`/admin/soal/${bank.id}/${existing?.id??'baru'}`);await page.getByLabel('Pertanyaan',{exact:true}).fill(text);await page.getByLabel('Jenis pertanyaan',{exact:true}).selectOption(i===1?'single':'multiple');
   await page.getByLabel('Urutan soal',{exact:true}).fill(String(i));await page.getByLabel('Pilihan 1',{exact:true}).fill('Pilihan pertama sintetis');await page.getByLabel('Pilihan 2',{exact:true}).fill('Pilihan kedua sintetis');
   if(i===2)await page.getByLabel('Kunci pilihan 1',{exact:true}).check();await page.getByLabel('Kunci pilihan 2',{exact:true}).check();
   await click(page,'Simpan draf');await expect(page.getByRole('heading',{name:'Edit pertanyaan',exact:true})).toBeVisible();
  }
  await page.goto(`/admin/soal?bank=${bank.id}`);await click(page,'Terbitkan bank soal');await expect(page.getByRole('status').filter({hasText:'Bank soal diterbitkan'})).toBeVisible();
 }
 await page.goto('/admin/materi');await click(page,'Terbitkan jalur belajar');await expect(page.getByRole('status').filter({hasText:'Jalur belajar diterbitkan'})).toBeVisible();
 await page.screenshot({path:resolve(evidence,'admin-content-desktop.png'),fullPage:true});
 const student=await browser.newContext({baseURL:origin,viewport:{width:1440,height:1000}});const pupil=await student.newPage();observe(pupil);
 await pupil.goto('/');await pupil.getByLabel('Nama lengkap',{exact:false}).fill(`Siswa sintetis ${suffix}`);await pupil.getByLabel('Cari sekolah aktif').fill(schoolName);await expect(pupil.getByRole('option',{name:schoolName,exact:true})).toBeAttached();await pupil.getByLabel('Asal sekolah',{exact:false}).selectOption(school.id);await pupil.getByLabel('Tanggal pengisian',{exact:false}).fill('2026-11-16');
 const enrolled=pupil.waitForResponse(r=>r.url().endsWith('/api/v1/student/sessions')&&r.request().method()==='POST');await click(pupil,'Mulai pre-test');const registration=await enrolled;expect(registration.status()).toBe(201);const profile=(await registration.json()).data;
 await expect(pupil.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();expect(profile.enrollment.form_date).toBe('2026-11-16');
 await pupil.locator('.answer-option input').first().check();await expect(pupil.locator('.save-status')).toContainText('Jawaban tersimpan');await pupil.reload();await expect(pupil.locator('.answer-option input').first()).toBeChecked();
 await pupil.goto('/materi/'+(await data(student,'/student/progress')).lessons[0].lesson_id);await expect(pupil.getByRole('heading',{name:'Satu langkah dulu.'})).toBeVisible();expect(await pupil.locator('.lesson-body').count()).toBe(0);
 await pupil.goto('/pre-test');await answer(pupil,'pre-test',true);expect(await pupil.locator('.score-display').count()).toBe(0);
 // Admin sees grading while student pre-test score is still null.
 const preResults=await data(admin,`/admin/students/${profile.student.id}/results?enrollment_id=${profile.enrollment.id}`);expect(preResults.attempts[0].score_percent).toBe(0);
 const first=preResults.attempts.find((a:any)=>a.assessment_type==='pre_test').id;expect((await data(student,`/student/attempts/${first}`)).score).toBeNull();
 await click(pupil,'Mulai belajar');await click(pupil,'Buka materi');
 const lessons=(await data(student,'/student/progress')).lessons;
 for(let i=0;i<lessons.length;i++){
  await expect(pupil.locator('.lesson-body')).toBeVisible();const next=pupil.getByRole('button',{name:'Bagian berikutnya',exact:true});while(await next.count()&&await next.isVisible()){await expect(next).toBeEnabled();await next.click();}
  await expect(pupil.getByRole('button',{name:'Selesai & lanjut',exact:true})).toBeEnabled();await click(pupil,'Selesai & lanjut');
 }
 await answer(pupil,'quiz');await expect(pupil.locator('.score-display')).toContainText('0');await click(pupil,'Buka kalkulator IMT');await pupil.getByLabel('Berat badan (kg)',{exact:false}).fill('45,5');await pupil.getByLabel('Tinggi badan (cm)',{exact:false}).fill('155');await click(pupil,'Hitung IMT');await expect(pupil.locator('.bmi-number')).toContainText('18.9');await pupil.reload();await expect(pupil.locator('.bmi-number')).toContainText('18.9');
 await click(pupil,'Lanjut ke post-test');const progress=await data(student,'/student/progress');await expect(pupil.getByRole('heading',{name:'Post-test',exact:true})).toBeVisible();const postId=(await data(student,'/student/progress')).active_attempt_ids.post_test;const pre=await data(student,`/student/attempts/${first}`),post=await data(student,`/student/attempts/${postId}`);expect(post.questions).toEqual(pre.questions);
 await answer(pupil,'post-test');await click(pupil,'Lihat ringkasan');await expect(pupil.getByRole('heading',{name:'Perjalanan yang tuntas.'})).toBeVisible();await expect(pupil.locator('.summary-stats strong')).toHaveText(['0/100','0/100','0/100']);
 for(const width of [360,768,1024,1440]){await pupil.setViewportSize({width,height:1000});await noOverflow(pupil);await pupil.screenshot({path:resolve(evidence,`student-summary-${width}.png`),fullPage:true});}
 // Rename and archive school after enrollment; report and student identity retain historical label.
 await page.goto('/admin/sekolah');await page.getByLabel('Cari sekolah',{exact:true}).fill(schoolName);await click(page,`Edit ${schoolName}`);await page.getByLabel('Nama sekolah',{exact:false}).fill(schoolName+' baru');await click(page,'Simpan sekolah');await expect(page.getByText(schoolName+' baru',{exact:true})).toBeVisible();await page.getByRole('button',{name:`Arsipkan ${schoolName} baru`,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await click(page,'Ya, arsipkan');await expect(page.getByRole('dialog')).not.toBeVisible();
 const publicSchools=await data(student,'/schools?q='+encodeURIComponent(schoolName));expect(publicSchools.some((s:any)=>s.id===school.id)).toBe(false);await pupil.reload();await expect(pupil.locator('.summary-page')).toContainText(schoolName);expect((await data(student,'/student/me')).enrollment.school_name_at_enrollment).toBe(schoolName);
 await page.goto(`/admin/hasil?school_id=${school.id}&stage=completed&assessment_type=post_test&form_date_from=2026-11-16&form_date_to=2026-11-16`);await click(page,`Lihat hasil Siswa sintetis ${suffix}`);await click(page,'Lihat jawaban Pre-test');await expect(page.locator('.student-answers')).toContainText('Pilihan pertama sintetis');await expect(page.locator('.student-answers')).toContainText('Salah');
 await page.screenshot({path:resolve(evidence,'admin-results-desktop.png'),fullPage:true});
 const question=(await data(admin,`/admin/question-banks/${banks[0].id}/questions?limit=25&offset=0`))[0];
 await page.goto(`/admin/hasil?tab=questions&school_id=${school.id}&question_id=${question.id}&question_version_id=${question.versions[0].id}`);await expect(page.locator('.student-answers')).toContainText('Soal sintetis paired');await expect(page.getByLabel('Versi pertanyaan terbit',{exact:true})).toHaveValue(question.versions[0].id);
 for(const width of [360,768,1024,1440]){await page.setViewportSize({width,height:1000});await noOverflow(page);await page.screenshot({path:resolve(evidence,`admin-question-report-${width}.png`),fullPage:true});}
 expect((await student.request.get('/api/v1/admin/students')).status()).toBe(401);
 expect((await student.request.post(`/api/v1/student/attempts/${first}/submission`,{headers:{Origin:origin},data:{}})).status()).toBe(403);
 expect(urls.some(url=>/:(4174|4175|4176)\//.test(url))).toBe(false);expect(urls.filter(url=>url.includes('/api/')).every(url=>url.includes('/api/v1/'))).toBe(true);
 expect(await pupil.evaluate(()=>Object.keys(localStorage).filter(k=>/token/i.test(k)))).toEqual([]);expect(errors).toEqual([]);
 await admin.close();await student.close();
});
