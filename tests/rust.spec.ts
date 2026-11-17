/** Real Rust/PostgreSQL acceptance. No fixture server, database resets or teaching SQL.
 * Operator provides E2E_PRIVATE_ENV for the owned synthetic DB.
 * Credentials are loaded only in the Node worker and injected via its request context.
 */
import {test,expect,type BrowserContext,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const origin='http://127.0.0.1:5173';
const evidence=resolve('test-results/evidence');
let testsRun=0;
// Honor the real per-IP 300 requests/60s policy. Do not disable it or retry business writes.
// The full CMS journey is one budget; the remaining small tests share the next window.
// Large correction scenarios each start a fresh real limiter window; no API retries/bypass.
test.beforeEach(async({},info)=>{if(testsRun===0||info.title.startsWith('enrollment transport')||info.title.startsWith('dirty Rust'))await new Promise(resolve=>setTimeout(resolve,61000));testsRun++;});
async function data(context:BrowserContext,path:string){const response=await context.request.get('/api/v1'+path);expect(response.status(),`GET ${path}`).toBe(200);return (await response.json()).data;}
async function command(context:BrowserContext,path:string,method:'POST'|'PUT',body:unknown,status=200){const csrf=await data(context,'/csrf');const response=await context.request.fetch('/api/v1'+path,{method,headers:{Origin:origin,'X-CSRF-Token':csrf.token},data:body});expect(response.status(),`${method} ${path}`).toBe(status);return (await response.json()).data;}
async function login(context:BrowserContext){
 if(!process.env.E2E_PRIVATE_ENV)throw Error('E2E_PRIVATE_ENV must reference an operator-owned synthetic integration environment.');
 process.loadEnvFile(process.env.E2E_PRIVATE_ENV);
 const csrf=await data(context,'/csrf');
 const response=await context.request.post('/api/v1/admin/sessions',{headers:{Origin:origin,'X-CSRF-Token':csrf.token},data:{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}});
 expect(response.status(),'private Node-side admin login').toBe(201);
}
async function click(page:Page,name:string){await page.getByRole('button',{name,exact:true}).click();}
async function capture(page:Page,name:string){await page.evaluate(async()=>{window.scrollTo(0,0);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});await page.screenshot({path:resolve(evidence,name),fullPage:true});}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);}
async function answer(page:Page,type:'pre-test'|'quiz'|'post-test',clear=false){
 await expect(page.getByRole('heading',{name:type==='quiz'?'Quiz':type==='pre-test'?'Pre-test':'Post-test',exact:true})).toBeVisible();
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
async function failedQuizNavigation(page:Page,context:BrowserContext){
 await expect(page.getByRole('heading',{name:'Quiz',exact:true})).toBeVisible();
 const progress=await data(context,'/student/progress');const id=progress.active_attempt_ids.quiz;const initial=await data(context,'/student/attempts/'+id);const question=initial.questions[0];
 let fault=true;const pattern='**/api/v1/student/attempts/*/answers/*';
 await page.route(pattern,async route=>{if(!fault){await route.continue();return;}fault=false;const response=await route.fetch();expect(response.status()).toBe(200);await route.fulfill({response,body:'{'});});
 await page.locator('.answer-option input').first().check();await expect(page.locator('.save-status')).toHaveText('Jawaban belum tersimpan');await expect(page.locator('.answer-option input').first()).toBeChecked();
 const stable={href:page.url(),index:await page.evaluate(()=>history.state.idx)};let prompts=0;const dismiss=(dialog:import('@playwright/test').Dialog)=>{prompts++;void dialog.dismiss();};page.on('dialog',dismiss);
 await click(page,'Beranda');expect(prompts).toBe(1);await expect(page).toHaveURL(stable.href);
 await page.evaluate(()=>history.back());await expect.poll(()=>prompts).toBe(2);await expect.poll(()=>page.evaluate(()=>({href:location.href,index:history.state.idx}))).toEqual(stable);
 await click(page,'Keluar');expect(prompts).toBe(3);expect((await context.request.get('/api/v1/student/me')).status()).toBe(200);await expect(page.locator('.answer-option input').first()).toBeChecked();await expect(page.locator('.save-status')).toHaveText('Jawaban belum tersimpan');await capture(page,'quiz-unknown-ack-navigation-canceled.png');
 page.off('dialog',dismiss);await page.unroute(pattern);
 // Lost acknowledgement really committed in Rust. Deliberate retry first reconciles its real409.
 const committed=await data(context,'/student/attempts/'+id);expect(committed.answers.find((a:any)=>a.snapshot_question_id===question.id).revision).toBe(1);
 await click(page,'Coba lagi');await expect(page.getByRole('alert')).toContainText('Jawaban diubah di tempat lain');await expect(page.locator('.answer-option input').first()).toBeChecked();await click(page,'Coba lagi');await expect(page.locator('.save-status')).toContainText('Jawaban tersimpan');
 const saved=await data(context,'/student/attempts/'+id);const answer=saved.answers.find((a:any)=>a.snapshot_question_id===question.id);expect(answer.revision).toBe(2);expect(answer.option_ids).toEqual([question.options[0].id]);
 await click(page,'Beranda');await expect(page).toHaveURL(/\/beranda$/);await click(page,'Quiz');await expect(page).toHaveURL(/\/quiz$/);await expect(page.locator('.answer-option input').first()).toBeChecked();await page.reload();await expect(page.locator('.answer-option input').first()).toBeChecked();expect(prompts).toBe(3);
 console.log('I1 Rust unknown acknowledgement',{canceledNavigationPrompts:prompts,confirmedAnswerRevision:answer.revision,restoredSelection:true});
}
test('real CMS publications, full student journey, scoped historical reporting and archive',async({browser})=>{
 mkdirSync(evidence,{recursive:true});
 const admin=await browser.newContext({baseURL:origin,viewport:{width:1440,height:1000}});await login(admin);
 const page=await admin.newPage();const errors:string[]=[];const urls:string[]=[];
 const observe=(p:Page)=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{const favicon=m.location().url===origin+'/favicon.ico'&&m.text().includes('404');if(favicon){console.log('Baseline development-only favicon404 observed (no API failure)');return;}if(m.type()==='error'&&!m.text().includes('401')&&!m.text().includes('403')&&!m.text().includes('409'))errors.push(m.text());});p.on('response',response=>{if(response.status()===404)console.log('Observed 404 path',new URL(response.url()).pathname);});p.on('request',r=>{urls.push(r.url());expect(r.headers().authorization).toBeUndefined();});};observe(page);
 const initialLessons=await data(admin,'/admin/lessons?limit=25&offset=0');const banks=await data(admin,'/admin/question-banks');const initialPath=await data(admin,'/admin/learning-path');
 console.log('Real CMS initial state',{lessons:initialLessons.length,banks:banks.length,pathPublished:!!initialPath.published});
 const suffix=Date.now().toString(36),schoolName=`Sekolah sintetis UI ${suffix}`;
 await page.goto('/admin/sekolah');await expect(page.getByRole('heading',{name:'Sekolah',exact:true})).toBeVisible();
 await click(page,'Tambah sekolah');await page.getByLabel('Nama sekolah',{exact:false}).fill(schoolName);
 const created=page.waitForResponse(r=>r.url().endsWith('/api/v1/admin/schools')&&r.request().method()==='POST');await click(page,'Simpan sekolah');const schoolResponse=await created;expect(schoolResponse.status()).toBe(201);const school=(await schoolResponse.json()).data;
 // Every active admin sees new schools immediately without grant mutations.
 await page.reload();await page.getByLabel('Cari sekolah',{exact:true}).fill(schoolName);await expect(page.getByText(schoolName,{exact:true})).toBeVisible();
 await capture(page,'admin-schools-desktop.png');await page.setViewportSize({width:360,height:1000});await noOverflow(page);await capture(page,'admin-schools-360.png');await page.setViewportSize({width:1440,height:1000});
 // Author via browser CMS. On retries, inspect and reuse this test's already-authored drafts, never wipe data.
 const reviewedLessons:{id:string;draft:{title:string;description:string;sections:{id:string;title:string;body:string;required:boolean}[]}}[]=[];
 for(let i=1;i<=2;i++){
  const title=`Materi sintetis integrasi ${i}`;const existing=(await data(admin,'/admin/lessons?limit=100&offset=0')).find((l:any)=>l.draft.title===title&&l.state!=='archived');
  await page.goto(existing?`/admin/materi/${existing.id}`:'/admin/materi/baru');await expect(page.getByLabel('Judul materi',{exact:false})).toBeVisible();
  await page.getByLabel('Judul materi',{exact:false}).fill(title);await page.getByLabel('Deskripsi',{exact:true}).fill('Materi pengukuran sintetis untuk verifikasi integrasi.');
  await page.getByLabel('Judul bagian 1',{exact:true}).fill('Pengukuran yang tercatat');await page.getByLabel('Isi materi 1',{exact:true}).fill('Gunakan alat pengukuran sesuai petunjuk pendamping. Catat hasil pengukuran dengan satuan yang tepat.');
  await click(page,'Simpan draf');await expect(page.getByRole('button',{name:'Terbitkan materi',exact:true})).toBeEnabled();
  const id=new URL(page.url()).pathname.split('/').pop()!;const savedA=await data(admin,'/admin/lessons/'+id);
  // A clean editor and a dirty editor both keep visible A while independent editor B saves.
  const localDescription=i===2?'Draf lokal A yang harus ditinjau.':savedA.draft.description;
  if(i===2)await page.getByLabel('Deskripsi',{exact:true}).fill(localDescription);
  const serverB={...savedA.draft,title:'Server B tidak ditampilkan '+i,description:'Deskripsi server B',sections:savedA.draft.sections.map((s:any)=>({...s,body:'Isi server B tidak ditinjau.'}))};
  await command(admin,'/admin/lessons/'+id,'PUT',{...serverB,position:savedA.position,expected_revision:savedA.revision});
  await click(page,'Muat revisi terbaru');await expect(page.getByRole('status').filter({hasText:'Revisi dan posisi terbaru dimuat'})).toBeVisible();
  await expect(page.getByLabel('Judul materi',{exact:false})).toHaveValue(title);await expect(page.getByLabel('Deskripsi',{exact:true})).toHaveValue(localDescription);await expect(page.getByLabel('Isi materi 1',{exact:true})).toHaveValue(savedA.draft.sections[0].body);
  await expect(page.getByRole('button',{name:'Terbitkan materi',exact:true})).toBeDisabled();await expect(page.getByText('Perubahan belum disimpan',{exact:true})).toBeVisible();
  await click(page,'Pratinjau');await expect(page.locator('.lesson-preview')).toContainText(title);await expect(page.locator('.lesson-preview')).not.toContainText(serverB.title);await capture(page,`lesson-refresh-${i===1?'clean':'dirty'}-divergence.png`);
  await click(page,'Simpan draf');await expect(page.getByRole('button',{name:'Terbitkan materi',exact:true})).toBeEnabled();
  const reviewed=await data(admin,'/admin/lessons/'+id);expect(reviewed.draft).toEqual({...savedA.draft,description:localDescription});reviewedLessons.push({id,draft:reviewed.draft});
  await click(page,'Terbitkan materi');await expect(page.getByRole('status').filter({hasText:'Versi materi diterbitkan'})).toBeVisible();
 }
 for(const bank of banks){
  for(let i=1;i<=2;i++){
   const text=`Soal sintetis ${bank.kind} ${i}`;const questions=await data(admin,`/admin/question-banks/${bank.id}/questions?limit=100&offset=0`);const existing=questions.find((q:any)=>q.draft.text.startsWith(text)&&q.state!=='archived');
   await page.goto(`/admin/soal/${bank.id}/${existing?.id??'baru'}`);await page.getByLabel('Pertanyaan',{exact:true}).fill(text);await page.getByLabel('Jenis pertanyaan',{exact:true}).selectOption(i===1?'single':'multiple');
   await page.getByLabel('Urutan soal',{exact:true}).fill(String(i));await page.getByLabel('Pilihan 1',{exact:true}).fill('Pilihan pertama sintetis');await page.getByLabel('Pilihan 2',{exact:true}).fill('Pilihan kedua sintetis');
   if(i===2)await page.getByLabel('Kunci pilihan 1',{exact:true}).check();await page.getByLabel('Kunci pilihan 2',{exact:true}).check();
   await click(page,'Simpan draf');await expect(page.getByRole('heading',{name:'Edit pertanyaan',exact:true})).toBeVisible();
  }
  await page.goto(`/admin/soal?bank=${bank.id}`);await click(page,'Terbitkan bank soal');await expect(page.getByRole('status').filter({hasText:'Bank soal diterbitkan'})).toBeVisible();
 }
 await page.goto('/admin/materi');await click(page,'Turunkan materi 1');await expect(page.getByRole('status').filter({hasText:'Urutan draf tersimpan'})).toBeVisible();await click(page,'Naikkan materi 2');await click(page,'Terbitkan jalur belajar');await expect(page.getByRole('status').filter({hasText:'Jalur belajar diterbitkan'})).toBeVisible();
 await capture(page,'admin-content-desktop.png');await page.setViewportSize({width:360,height:1000});await noOverflow(page);await capture(page,'admin-content-360.png');await page.setViewportSize({width:1440,height:1000});
 const student=await browser.newContext({baseURL:origin,viewport:{width:1440,height:1000}});const pupil=await student.newPage();observe(pupil);
 await pupil.goto('/');await pupil.getByLabel('Nama lengkap',{exact:false}).fill(`Siswa sintetis ${suffix}`);await pupil.getByLabel('Cari sekolah aktif').fill(schoolName);await expect(pupil.getByRole('option',{name:schoolName,exact:true})).toBeAttached();await pupil.getByLabel('Asal sekolah',{exact:false}).selectOption(school.id);await pupil.getByLabel('Tanggal pengisian',{exact:false}).fill('2026-11-16');
 const enrolled=pupil.waitForResponse(r=>r.url().endsWith('/api/v1/student/sessions')&&r.request().method()==='POST');await click(pupil,'Mulai pre-test');const registration=await enrolled;expect(registration.status()).toBe(201);const profile=(await registration.json()).data;
 await expect(pupil.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();expect(profile.enrollment.form_date).toBe('2026-11-16');for(const width of [360,768,1024,1440]){await pupil.setViewportSize({width,height:1000});await noOverflow(pupil);await capture(pupil,`student-pre-${width}.png`);}
 await pupil.locator('.answer-option input').first().check();await expect(pupil.locator('.save-status')).toContainText('Jawaban tersimpan');await pupil.reload();await expect(pupil.locator('.answer-option input').first()).toBeChecked();
 await pupil.goto('/materi/'+(await data(student,'/student/progress')).lessons[0].lesson_id);await expect(pupil.getByRole('heading',{name:'Satu langkah dulu.'})).toBeVisible();expect(await pupil.locator('.lesson-body').count()).toBe(0);
 await pupil.goto('/pre-test');await answer(pupil,'pre-test',true);expect(await pupil.locator('.score-display').count()).toBe(0);
 // Admin sees grading while student pre-test score is still null.
 const preResults=await data(admin,`/admin/students/${profile.student.id}/results?enrollment_id=${profile.enrollment.id}`);expect(preResults.attempts[0].score_percent).toBe(0);
 const first=preResults.attempts.find((a:any)=>a.assessment_type==='pre_test').id;expect((await data(student,`/student/attempts/${first}`)).score).toBeNull();
 const historicalPre=await data(student,`/student/attempts/${first}`);
 // Publish a genuinely new question/bank/path after enrollment. The existing cohort remains pinned.
 const historicalQuestion=historicalPre.questions[0];await page.goto(`/admin/soal/${banks[0].id}/${historicalQuestion.question_id}`);await page.getByLabel('Pertanyaan',{exact:true}).fill('Soal sintetis paired 1 draf berikutnya');await click(page,'Simpan draf');await page.goto(`/admin/soal?bank=${banks[0].id}`);await click(page,'Terbitkan bank soal');await expect(page.getByRole('status').filter({hasText:'Bank soal diterbitkan'})).toBeVisible();await page.goto('/admin/materi');await click(page,'Terbitkan jalur belajar');await expect(page.getByRole('status').filter({hasText:'Jalur belajar diterbitkan'})).toBeVisible();

 await click(pupil,'Mulai belajar');await click(pupil,'Buka materi');await expect(pupil.locator('.lesson-body')).toBeVisible();await pupil.setViewportSize({width:360,height:1000});await noOverflow(pupil);await capture(pupil,'student-lesson-360.png');await pupil.setViewportSize({width:1440,height:1000});
 const lessons=(await data(student,'/student/progress')).lessons;
 for(let i=0;i<lessons.length;i++){
  const pinned=await data(student,'/student/lessons/'+lessons[i].lesson_id);const reviewed=reviewedLessons.find(l=>l.id===lessons[i].lesson_id);expect(reviewed).toBeTruthy();expect(pinned.title).toBe(reviewed!.draft.title);expect(pinned.description).toBe(reviewed!.draft.description);expect(pinned.sections.map(({title,body,required}:any)=>({title,body,required}))).toEqual(reviewed!.draft.sections.map(({title,body,required})=>({title,body,required})));expect(pinned.lesson_version_id).toBe(lessons[i].lesson_version_id);
  await expect(pupil.locator('.lesson-body')).toBeVisible();const next=pupil.getByRole('button',{name:'Bagian berikutnya',exact:true});while(await next.count()&&await next.isVisible()){await expect(next).toBeEnabled();await next.click();}
  await expect(pupil.getByRole('button',{name:'Selesai & lanjut',exact:true})).toBeEnabled();await click(pupil,'Selesai & lanjut');
 }
 await failedQuizNavigation(pupil,student);
 console.log('I2 Rust publication readback',{visibleDraftsPublished:reviewedLessons.length,pinnedLessonTextAndSectionsMatch:true,cleanAndDirtyRefreshBlocked:true});
 await answer(pupil,'quiz');await expect(pupil.locator('.score-display')).toContainText('0');await click(pupil,'Buka kalkulator IMT');await pupil.getByLabel('Berat badan (kg)',{exact:false}).fill('45,5');await pupil.getByLabel('Tinggi badan (cm)',{exact:false}).fill('155');await click(pupil,'Hitung IMT');await expect(pupil.locator('.bmi-number')).toContainText('18.9');await pupil.setViewportSize({width:360,height:1000});await noOverflow(pupil);await capture(pupil,'student-calculator-360.png');await pupil.setViewportSize({width:1440,height:1000});await pupil.reload();await expect(pupil.locator('.bmi-number')).toContainText('18.9');
 await click(pupil,'Lanjut ke post-test');const progress=await data(student,'/student/progress');await expect(pupil.getByRole('heading',{name:'Post-test',exact:true})).toBeVisible();const postId=(await data(student,'/student/progress')).active_attempt_ids.post_test;const pre=await data(student,`/student/attempts/${first}`),post=await data(student,`/student/attempts/${postId}`);expect(post.questions).toEqual(pre.questions);
 await answer(pupil,'post-test');await click(pupil,'Lihat ringkasan');await expect(pupil.getByRole('heading',{name:'Perjalanan yang tuntas.'})).toBeVisible();await expect(pupil.locator('.summary-stats strong')).toHaveText(['0/100','0/100','0/100']);await expect(pupil.locator('.answer-review details')).toHaveCount(pre.questions.length*2);
 for(const width of [360,768,1024,1440]){await pupil.setViewportSize({width,height:1000});await noOverflow(pupil);await capture(pupil,`student-summary-${width}.png`);}
 // Rename and archive school after enrollment; report and student identity retain historical label.
 await page.goto('/admin/sekolah');await page.getByLabel('Cari sekolah',{exact:true}).fill(schoolName);await click(page,`Edit ${schoolName}`);await page.getByLabel('Nama sekolah',{exact:false}).fill(schoolName+' baru');await click(page,'Simpan sekolah');await expect(page.getByText(schoolName+' baru',{exact:true})).toBeVisible();await page.getByRole('button',{name:`Arsipkan ${schoolName} baru`,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await click(page,'Ya, arsipkan');await expect(page.getByRole('dialog')).not.toBeVisible();
 const publicSchools=await data(student,'/schools?q='+encodeURIComponent(schoolName));expect(publicSchools.some((s:any)=>s.id===school.id)).toBe(false);await pupil.reload();await expect(pupil.locator('.summary-page')).toContainText(schoolName);expect((await data(student,'/student/me')).enrollment.school_name_at_enrollment).toBe(schoolName);
 await page.goto(`/admin/hasil?school_id=${school.id}&stage=completed&assessment_type=post_test&form_date_from=2026-11-16&form_date_to=2026-11-16`);await click(page,`Lihat hasil Siswa sintetis ${suffix}`);await click(page,'Lihat jawaban Pre-test');await expect(page.locator('.student-answers')).toContainText('Pilihan pertama sintetis');await expect(page.locator('.student-answers')).toContainText('Salah');
 await capture(page,'admin-results-desktop.png');
 const question=await data(admin,`/admin/question-banks/${banks[0].id}/questions/${historicalQuestion.question_id}`);const reportVersion=historicalQuestion.question_version_id;expect(question.versions[0].id).not.toBe(reportVersion);
 await page.goto(`/admin/hasil?tab=questions&school_id=${school.id}&question_id=${question.id}&question_version_id=${reportVersion}`);await expect(page.locator('.student-answers')).toContainText('Soal sintetis paired');await expect(page.getByLabel('Versi pertanyaan terbit',{exact:true})).toHaveValue(reportVersion);
 for(const width of [360,768,1024,1440]){await page.setViewportSize({width,height:1000});await noOverflow(page);await capture(page,`admin-question-report-${width}.png`);}
 expect((await student.request.get('/api/v1/admin/students')).status()).toBe(401);
 expect((await student.request.post(`/api/v1/student/attempts/${first}/submission`,{headers:{Origin:origin},data:{}})).status()).toBe(403);
 expect(urls.some(url=>/:(4174|4175|4176)\//.test(url))).toBe(false);expect(urls.filter(url=>url.includes('/api/')).every(url=>url.includes('/api/v1/'))).toBe(true);
 expect(await pupil.evaluate(()=>Object.keys(localStorage).filter(k=>/token/i.test(k)))).toEqual([]);expect(errors).toEqual([]);
 await admin.close();await student.close();
});

async function enrollmentForm(page:Page,school:{id:string;name:string},name:string){
 await page.goto('/');await page.getByLabel('Nama lengkap',{exact:false}).fill(name);await page.getByLabel('Cari sekolah aktif').fill(school.name);await expect(page.getByRole('option',{name:school.name,exact:true})).toBeAttached();await page.getByLabel('Asal sekolah',{exact:false}).selectOption(school.id);await page.getByLabel('Tanggal pengisian',{exact:false}).fill('2026-11-16');
}
test('enrollment transport failure retains original action and blocks new context after reload',async({browser})=>{
 const context=await browser.newContext({baseURL:origin});const page=await context.newPage();const school=(await data(context,'/schools?limit=25&offset=0'))[0];
 const sent:{key:string|undefined;body:string|null}[]=[];let fail=true;let csrfReads=0;
 page.on('request',r=>{if(r.url().endsWith('/api/v1/csrf'))csrfReads++;});
 await page.route('**/api/v1/student/sessions',async route=>{sent.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()});if(fail){fail=false;await route.abort('failed');}else await route.continue();});
 await enrollmentForm(page,school,'Siswa sintetis retry');await click(page,'Mulai pre-test');await expect(page.getByRole('alert').filter({hasText:'Koneksi terputus'})).toBeVisible();expect(sent).toHaveLength(1);expect(sent[0].key).toBeTruthy();await expect(page.getByLabel('Nama lengkap',{exact:false})).toBeDisabled();
 const beforeRetry=csrfReads;await click(page,'Coba lagi');await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();expect(sent).toHaveLength(2);expect(sent[1]).toEqual(sent[0]);expect(csrfReads).toBe(beforeRetry);
 await context.close();
 const blocked=await browser.newContext({baseURL:origin});const other=await blocked.newPage();let posts=0,reads=0;
 other.on('request',r=>{if(r.url().endsWith('/api/v1/csrf'))reads++;});await other.route('**/api/v1/student/sessions',async route=>{posts++;await route.abort('failed');});
 await enrollmentForm(other,school,'Siswa sintetis uncertain');await click(other,'Mulai pre-test');await expect(other.getByRole('alert').filter({hasText:'Koneksi terputus'})).toBeVisible();const initialReads=reads;
 await blocked.clearCookies();await other.reload();await expect(other.getByRole('button',{name:'Pulihkan sesi tersimpan'})).toBeVisible();await expect(other.getByLabel('Nama lengkap',{exact:false})).toHaveValue('Siswa sintetis uncertain');await expect(other.getByRole('button',{name:'Mulai pre-test',exact:true})).toBeDisabled();await expect(other.getByRole('alert').filter({hasText:'Konteks pendaftaran'})).toBeVisible();expect(posts).toBe(1);expect(reads).toBe(initialReads);
 await capture(other,'enrollment-uncertain-blocked.png');await blocked.close();
});
test('committed enrollment with lost response body recovers only through authenticated me and rebinds CSRF',async({browser})=>{
 const context=await browser.newContext({baseURL:origin});const page=await context.newPage();const school=(await data(context,'/schools?limit=25&offset=0'))[0];let posts=0;
 await page.route('**/api/v1/student/sessions',async route=>{posts++;const response=await route.fetch();expect(response.status()).toBe(201);await route.fulfill({response,body:'{'});});
 await enrollmentForm(page,school,'Siswa sintetis committed recovery');await click(page,'Mulai pre-test');await expect(page.getByRole('alert').filter({hasText:'Koneksi terputus'})).toBeVisible();await click(page,'Pulihkan sesi tersimpan');await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();await page.locator('.answer-option input').first().check();await expect(page.locator('.save-status')).toContainText('Jawaban tersimpan');expect(posts).toBe(1);
 await page.reload();await expect(page.locator('.answer-option input').first()).toBeChecked();await context.close();
});
test('committed enrollment projection failure retries and reloads read-only without a second POST',async({browser})=>{
 const context=await browser.newContext({baseURL:origin});const page=await context.newPage();
 const school=(await data(context,'/schools?limit=25&offset=0'))[0];let posts=0,csrfReads=0,fail=true;
 let original:{student:{id:string};enrollment:{id:string}}|undefined;
 page.on('request',r=>{if(r.url().endsWith('/api/v1/csrf'))csrfReads++;});
 await page.route('**/api/v1/student/sessions',async route=>{posts++;const response=await route.fetch();expect(response.status()).toBe(201);original=(await response.json()).data;await route.fulfill({response});});
 // Only the required read is faulted. The POST and all persistence remain real Rust/PostgreSQL.
 await page.route('**/api/v1/student/progress',async route=>{if(fail)await route.abort('failed');else await route.continue();});
 await enrollmentForm(page,school,'Siswa sintetis projection recovery');await click(page,'Mulai pre-test');
 await expect(page.getByRole('alert').filter({hasText:'Koneksi terputus'})).toBeVisible();
 const journal=await page.evaluate(()=>sessionStorage.getItem('imt-pending-enrollment-v1'));
 expect(journal).toBeTruthy();expect(posts).toBe(1);const initialCsrf=csrfReads;
 await expect(page.getByLabel('Nama lengkap',{exact:false})).toHaveValue('Siswa sintetis projection recovery');
 await expect(page.getByRole('button',{name:'Mulai pre-test',exact:true})).toBeDisabled();
 await click(page,'Pulihkan sesi tersimpan');await expect(page.getByRole('alert').filter({hasText:'Koneksi terputus'})).toBeVisible();
 expect(posts).toBe(1);expect(csrfReads).toBe(initialCsrf);expect(await page.evaluate(()=>sessionStorage.getItem('imt-pending-enrollment-v1'))).toBe(journal);
 await page.reload();await expect(page.getByRole('button',{name:'Coba lagi',exact:true})).toBeVisible();
 expect(posts).toBe(1);expect(csrfReads).toBe(initialCsrf);expect(await page.evaluate(()=>sessionStorage.getItem('imt-pending-enrollment-v1'))).toBe(journal);
 fail=false;await click(page,'Coba lagi');await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();
 const recovered=await data(context,'/student/me');expect(recovered.student.id).toBe(original!.student.id);expect(recovered.enrollment.id).toBe(original!.enrollment.id);
 expect(await page.evaluate(()=>sessionStorage.getItem('imt-pending-enrollment-v1'))).toBeNull();
 await page.locator('.answer-option input').first().check();await expect(page.locator('.save-status')).toContainText('Jawaban tersimpan');
 await page.reload();await expect(page.locator('.answer-option input').first()).toBeChecked();expect(posts).toBe(1);
 console.log('Committed projection recovery',{enrollmentPosts:posts,originalIdentityRestored:true,journalRetainedUntilProjection:true});
 await context.close();
});
test('coexisting admin/student cookies restore independently, enforce ownership and logout only the target role',async({browser})=>{
 const context=await browser.newContext({baseURL:origin});await login(context);const school=(await data(context,'/schools?limit=25&offset=0'))[0];const page=await context.newPage();await enrollmentForm(page,school,'Siswa sintetis coexisting');await click(page,'Mulai pre-test');await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();
 const profile=await data(context,'/student/me');const first=(await data(context,'/student/progress')).active_attempt_ids.pre_test;expect((await context.request.get('/api/v1/admin/me')).status()).toBe(200);await page.reload();await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();
 const stranger=await browser.newContext({baseURL:origin});const second=await stranger.newPage();await enrollmentForm(second,school,'Siswa sintetis other owner');await click(second,'Mulai pre-test');await expect(second.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();expect((await stranger.request.get(`/api/v1/student/attempts/${first}`)).status()).toBe(404);await stranger.close();
 await page.goto('/admin/hasil');await expect(page.getByRole('heading',{name:'Hasil siswa',exact:true})).toBeVisible();await page.locator('.teacher-account').click();await click(page,'Keluar ruang admin');await expect(page.getByRole('heading',{name:'Masuk ruang admin.'})).toBeVisible();expect((await context.request.get('/api/v1/admin/me')).status()).toBe(401);expect((await data(context,'/student/me')).student.id).toBe(profile.student.id);
 await login(context);await page.goto('/pre-test');await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();await click(page,'Keluar');await expect(page.getByRole('heading',{name:'Selamat datang.'})).toBeVisible();expect((await context.request.get('/api/v1/student/me')).status()).toBe(401);expect((await context.request.get('/api/v1/admin/me')).status()).toBe(200);
 await context.close();
});

test('global admin immediately reads a new school without a grant or re-login',async({browser})=>{
 const admin=await browser.newContext({baseURL:origin});await login(admin);const csrf=await data(admin,'/csrf');const schoolResponse=await admin.request.post('/api/v1/admin/schools',{headers:{Origin:origin,'X-CSRF-Token':csrf.token},data:{name:`Sekolah tanpa cakupan ${Date.now().toString(36)}`}});expect(schoolResponse.status()).toBe(201);const school=(await schoolResponse.json()).data;
 const student=await browser.newContext({baseURL:origin});const page=await student.newPage();await enrollmentForm(page,school,'Siswa sintetis outside reporting scope');await click(page,'Mulai pre-test');await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();const profile=await data(student,'/student/me');
 expect((await admin.request.get('/api/v1/admin/students?school_id='+school.id)).status()).toBe(200);expect((await admin.request.get(`/api/v1/admin/students/${profile.student.id}/results?enrollment_id=${profile.enrollment.id}`)).status()).toBe(200);
 const view=await admin.newPage();await view.goto('/admin/hasil?school_id='+school.id);await expect(view.locator('.data-table tbody tr')).toHaveCount(1);await expect(view.getByRole('option',{name:school.name,exact:true})).toBeAttached();await expect(view.getByLabel('Sekolah laporan',{exact:true})).toHaveValue(school.id);await capture(view,'global-admin-new-school-desktop.png');await view.setViewportSize({width:390,height:844});await noOverflow(view);await capture(view,'global-admin-new-school-mobile.png');await admin.close();await student.close();
});
test('real revision conflict preserves CMS input; draft archive confirms and preserves history',async({browser})=>{
 const context=await browser.newContext({baseURL:origin});await login(context);const lesson=(await data(context,'/admin/lessons?limit=25&offset=0'))[0];const page=await context.newPage();await page.goto('/admin/materi/'+lesson.id);await page.getByLabel('Deskripsi',{exact:true}).fill('Draf lokal dipertahankan setelah konflik nyata.');
 const csrf=await data(context,'/csrf');const concurrent=await context.request.put('/api/v1/admin/lessons/'+lesson.id,{headers:{Origin:origin,'X-CSRF-Token':csrf.token},data:{...lesson.draft,position:lesson.position,expected_revision:lesson.revision}});expect(concurrent.status()).toBe(200);
 await click(page,'Simpan draf');await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByLabel('Deskripsi',{exact:true})).toHaveValue('Draf lokal dipertahankan setelah konflik nyata.');await click(page,'Muat revisi terbaru');await click(page,'Simpan draf');await expect(page.getByRole('status').filter({hasText:'Draf tersimpan. Belum diterbitkan.'})).toBeVisible();
 await page.goto('/admin/materi/baru');await page.getByLabel('Judul materi',{exact:false}).fill('Draf arsip sintetis '+Date.now().toString(36));await page.getByLabel('Judul bagian 1',{exact:true}).fill('Bagian arsip');await page.getByLabel('Isi materi 1',{exact:true}).fill('Konten draf arsip sintetis.');await click(page,'Simpan draf');await expect(page).toHaveURL(/\/admin\/materi\/[a-f\d-]{36}$/);const id=new URL(page.url()).pathname.split('/').pop()!;
 await click(page,'Arsipkan materi');await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.getByRole('button',{name:'Arsipkan materi',exact:true})).toBeFocused();await click(page,'Arsipkan materi');
 const beforeArchive=await data(context,'/admin/lessons/'+id);const archiveCsrf=await data(context,'/csrf');const changed=await context.request.put('/api/v1/admin/lessons/'+id,{headers:{Origin:origin,'X-CSRF-Token':archiveCsrf.token},data:{...beforeArchive.draft,position:beforeArchive.position,expected_revision:beforeArchive.revision}});expect(changed.status()).toBe(200);
 await click(page,'Ya, arsipkan');await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();await capture(page,'admin-archive-conflict-dialog.png');await click(page,'Kembali');await click(page,'Muat revisi terbaru');await expect(page.getByRole('status').filter({hasText:'Revisi dan posisi terbaru dimuat'})).toBeVisible();await click(page,'Arsipkan materi');await click(page,'Ya, arsipkan');await expect(page.getByRole('button',{name:'Simpan draf',exact:true})).toBeDisabled();const archived=await data(context,'/admin/lessons/'+id);expect(archived.state).toBe('archived');expect((await data(context,'/admin/learning-path')).lesson_ids).not.toContain(id);
 await context.close();
});
test('dirty Rust lesson and question editors preserve canceled fragment/multistep history and role logout',async({browser})=>{
 mkdirSync(evidence,{recursive:true});
 for(const kind of ['lesson','question'] as const){
  const context=await browser.newContext({baseURL:origin});await login(context);const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  let original:string;let field:import('@playwright/test').Locator;
  if(kind==='lesson'){
   const lesson=(await data(context,'/admin/lessons?limit=25&offset=0')).find((l:any)=>l.state!=='archived');original=lesson.draft.title;await page.goto('/admin/materi');await click(page,'Edit '+original);field=page.getByLabel('Judul materi',{exact:false});
  }else{
   const bank=(await data(context,'/admin/question-banks'))[0];const question=(await data(context,`/admin/question-banks/${bank.id}/questions?limit=25&offset=0`)).find((q:any)=>q.state!=='archived');original=question.draft.text;await page.goto('/admin/soal?bank='+bank.id);await click(page,'Edit pertanyaan '+question.position);field=page.getByLabel('Pertanyaan',{exact:true});
  }
  await field.fill('Draf navigasi '+kind);const editorUrl=page.url();const editorIndex=await page.evaluate(()=>history.state.idx);
  const skip=page.getByRole('link',{name:'Lewati ke konten utama'});await skip.focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(editorUrl+'#main-content');await expect.poll(()=>page.evaluate(()=>history.state.idx)).toBe(editorIndex+1);
  let prompts=0;let accept=false;const handle=(dialog:import('@playwright/test').Dialog)=>{prompts++;void (accept?dialog.accept():dialog.dismiss());};page.on('dialog',handle);
  const canceled=async(delta:number,expected:number,stable:{href:string;index:number})=>{await page.evaluate(n=>history.go(n),delta);await expect.poll(()=>prompts).toBe(expected);await expect.poll(()=>page.evaluate(()=>({href:location.href,index:history.state.idx}))).toEqual(stable);await expect(field).toHaveValue('Draf navigasi '+kind);};
  await canceled(-1,1,{href:editorUrl+'#main-content',index:editorIndex+1});
  await page.evaluate(()=>{const target=document.createElement('div');target.id='history-regression-target';document.body.append(target);const link=document.createElement('a');link.id='history-regression-link';link.href='#history-regression-target';link.textContent='Fragment history regression';document.body.append(link);});
  await page.locator('#history-regression-link').focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(editorUrl+'#history-regression-target');await expect.poll(()=>page.evaluate(()=>history.state.idx)).toBe(editorIndex+2);
  const stable={href:page.url(),index:editorIndex+2};await canceled(-1,2,stable);await canceled(-1,3,stable);await canceled(-2,4,stable);await canceled(-3,5,stable);
  await page.locator('.teacher-account').click();await click(page,'Keluar ruang admin');expect(prompts).toBe(6);expect((await context.request.get('/api/v1/admin/me')).status()).toBe(200);await expect(field).toHaveValue('Draf navigasi '+kind);await expect(page.getByRole('dialog',{name:'Akun admin'})).toBeVisible();await page.keyboard.press('Escape');await capture(page,`dirty-${kind}-history-canceled.png`);
  const target=kind==='lesson'?'Bank soal':'Materi';const targetUrl=kind==='lesson'?'/admin/soal':'/admin/materi';await click(page,target);expect(prompts).toBe(7);await expect(page).toHaveURL(stable.href);await expect(field).toHaveValue('Draf navigasi '+kind);
  accept=true;await click(page,target);await expect(page).toHaveURL(origin+targetUrl);await expect(page.getByRole('heading',{name:target,exact:true})).toBeVisible();expect(prompts).toBe(8);
  await page.goBack();await expect(page).toHaveURL(stable.href);await expect(field).toHaveValue(original);
  await page.goBack();await expect(page).toHaveURL(editorUrl+'#main-content');await expect(field).toHaveValue(original);await page.goBack();await expect(page).toHaveURL(editorUrl);await expect(field).toHaveValue(original);
  await page.goForward();await expect(page).toHaveURL(editorUrl+'#main-content');await page.goForward();await expect(page).toHaveURL(stable.href);await expect(field).toHaveValue(original);await page.goForward();await expect(page).toHaveURL(origin+targetUrl);await expect(page.getByRole('heading',{name:target,exact:true})).toBeVisible();expect(prompts).toBe(8);
  await page.goBack();await expect(field).toHaveValue(original);await field.fill('Draf logout '+kind);await page.locator('.teacher-account').click();accept=false;await click(page,'Keluar ruang admin');expect(prompts).toBe(9);expect((await context.request.get('/api/v1/admin/me')).status()).toBe(200);await expect(field).toHaveValue('Draf logout '+kind);
  accept=true;await click(page,'Keluar ruang admin');await expect(page.getByRole('heading',{name:'Masuk ruang admin.'})).toBeVisible();await expect(page).toHaveURL(stable.href);expect(prompts).toBe(10);expect((await context.request.get('/api/v1/admin/me')).status()).toBe(401);
  await login(context);await page.reload();await expect(page).toHaveURL(stable.href);await expect(field).toHaveValue(original);expect(prompts).toBe(10);expect(errors).toEqual([]);
  console.log('I3 Rust navigation',{editor:kind,cancelAndAcceptPrompts:prompts,sessionPreservedOnCancel:true,sessionRevokedOnAccept:true,backForwardCoherent:true});await context.close();
 }
});
test('clean and legacy routes, denied localStorage, mobile keyboard forms and reduced motion',async({browser})=>{
 const context=await browser.newContext({baseURL:origin,reducedMotion:'reduce'});await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}});});const page=await context.newPage();
 await page.goto('/#/guru/materi/existing-id');await expect(page.getByRole('heading',{name:'Masuk ruang admin.'})).toBeVisible();expect(new URL(page.url()).pathname).toBe('/admin/materi/existing-id');expect(new URL(page.url()).hash).toBe('');
 await page.goto('/not-a-real-route');await expect(page.getByRole('heading',{name:'Halaman tidak ditemukan.'})).toBeVisible();
 await page.goto('/');await expect(page.getByRole('heading',{name:'Selamat datang.'})).toBeVisible();
 for(const width of [360,768,1024,1440]){await page.setViewportSize({width,height:1000});await noOverflow(page);await capture(page,`login-${width}.png`);}
 await page.getByLabel('Nama lengkap',{exact:false}).focus();await page.keyboard.press('Tab');await expect(page.getByLabel('Cari sekolah aktif')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.getByLabel('Nama lengkap',{exact:false})).toBeFocused();
 await click(page,'Mulai pre-test');await expect(page.getByLabel('Nama lengkap',{exact:false})).toBeFocused();await expect(page.locator('#name-hint')).toContainText('wajib');await context.close();
});
