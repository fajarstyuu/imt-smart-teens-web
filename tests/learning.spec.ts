import { test, expect, type Page } from '@playwright/test';
test.beforeEach(async({page})=>{await page.route('http://127.0.0.1:4174/api/**',route=>route.continue({url:route.request().url().replace(':4174',':4175')}));});
async function register(page:Page){await page.goto('/');await page.getByLabel('Nama lengkap').fill('Siswa pengujian');await page.getByLabel('Asal sekolah').fill('Sekolah pengujian');await page.getByRole('button',{name:'Mulai pre-test'}).click();await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();}
async function answer(page:Page,count:number){for(let i=0;i<count;i++){const option=page.locator('.answer-option').first();await option.click();await expect(page.getByRole('status')).toContainText('Jawaban tersimpan');if(i<count-1)await page.getByRole('button',{name:'Berikutnya',exact:true}).click();}await page.getByRole('button',{name:/^Kirim (pre-test|quiz|post-test)$/}).click();await page.getByRole('button',{name:'Kirim jawaban',exact:true}).click();await expect(page.getByRole('heading',{name:/Jawabanmu sudah terkirim|Seluruh tahap telah selesai/})).toBeVisible();}
async function noOverflow(page:Page,width:number){await page.setViewportSize({width,height:960});await page.waitForTimeout(100);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
test('responsive login, validation, full learning sequence, refresh and teacher results',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('heading',{name:'Selamat datang.'})).toBeVisible();
  for(const width of [360,768,1024,1440])await noOverflow(page,width);
  await page.getByRole('button',{name:'Mulai pre-test'}).click();await expect(page.locator('#name-hint')).toHaveText('Kolom ini wajib diisi.');
  await register(page);await page.reload();await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();
  await page.goto('/materi/materi-2');await expect(page.getByRole('heading',{name:'Satu langkah dulu.'})).toBeVisible();await page.getByRole('button',{name:'Kembali ke Pre-test'}).click();
  await answer(page,5);await page.getByRole('button',{name:'Mulai belajar',exact:true}).click();await expect(page.locator('.editorial-hero h1')).toBeVisible();
  for(const width of [360,768,1024,1440])await noOverflow(page,width);
  for(let lesson=0;lesson<3;lesson++){if(lesson===0)await page.getByRole('button',{name:'Buka materi',exact:true}).click();await expect(page.getByRole('button',{name:'Bagian berikutnya',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Bagian berikutnya',exact:true}).click();await expect(page.getByRole('button',{name:'Selesai & lanjut',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Selesai & lanjut',exact:true}).click();}
  await expect(page.getByRole('heading',{name:'Quiz',exact:true})).toBeVisible();await answer(page,4);await expect(page.locator('.score-display')).toBeVisible();await page.getByRole('button',{name:'Buka kalkulator IMT',exact:true}).click();
  await page.getByLabel('Berat badan (kg)').fill('45,5');await page.getByLabel('Tinggi badan (cm)').fill('0');await page.getByRole('button',{name:'Hitung IMT',exact:true}).click();await expect(page.locator('#height-hint')).toContainText('lebih besar dari nol');await page.getByLabel('Tinggi badan (cm)').fill('155');const requests:string[]=[];page.on('request',request=>{if(request.url().includes('measurement'))requests.push(`${request.method()} ${request.url()}`);});const measurementResponse=page.waitForResponse(response=>response.url().includes('measurement'),{timeout:10000}).catch(()=>null);await page.getByRole('button',{name:'Hitung IMT',exact:true}).click();const measured=await measurementResponse;expect(measured,`Measurement request observed: ${requests.join(', ')||'none'}`).not.toBeNull();expect(measured!.status()).toBe(200);expect((await measured!.json()).measurement.bmi).toBeCloseTo(18.9386,3);await expect(page.locator('.bmi-number')).toContainText('18,9');await page.reload();await expect(page.locator('.bmi-number')).toContainText('18,9');
  await page.getByRole('button',{name:'Lanjut ke post-test',exact:true}).click();await answer(page,5);await page.getByRole('button',{name:'Lihat ringkasan',exact:true}).click();await expect(page.getByRole('heading',{name:'Perjalanan yang tuntas.'})).toBeVisible();await expect(page.locator('.summary-stats .od-stat')).toHaveCount(3);await noOverflow(page,360);
  await page.goto('/#/guru/hasil');await expect(page.getByRole('heading',{name:'Masuk ruang guru.'})).toBeVisible();await page.getByLabel('Email guru').fill('guru@ruanggizi.local');await page.getByLabel('Kata sandi').fill('BelajarGizi2026!');await page.getByRole('button',{name:'Masuk ruang guru',exact:true}).click();await expect(page.getByRole('heading',{name:'Hasil siswa',exact:true})).toBeVisible();
  for(const width of [360,768,1024,1440])await noOverflow(page,width);
  await page.getByLabel('Cari siswa').fill('Siswa pengujian');await page.getByRole('button',{name:'Lihat jawaban',exact:false}).click();await expect(page.getByRole('heading',{name:'Siswa pengujian',exact:true})).toBeVisible();await expect(page.locator('.teacher-answer')).toHaveCount(5);await page.getByRole('button',{name:'Kembali ke hasil siswa'}).click();await expect(page.getByLabel('Cari siswa')).toHaveValue('Siswa pengujian');await page.getByRole('tab',{name:'Per pertanyaan'}).click();await expect(page.getByLabel('Pertanyaan · Pre-test')).toBeVisible();expect(errors).toEqual([]);
});
test('save failure retains answer and supports retry, unanswered submission stays in assessment',async({page})=>{await register(page);let failed=false;await page.route('http://127.0.0.1:4174/api/attempts/pre/answers',route=>{if(!failed){failed=true;return route.abort();}return route.continue({url:route.request().url().replace(':4174',':4175')});});await page.locator('.answer-option').first().click();await expect(page.locator('.save-status')).toHaveText('Jawaban belum tersimpan');await expect(page.locator('.answer-option input').first()).toBeChecked();await page.getByRole('button',{name:'Coba lagi',exact:true}).click();await expect(page.locator('.save-status')).toContainText('Jawaban tersimpan');await page.getByRole('button',{name:'Pertanyaan 5, belum dijawab',exact:true}).click();await page.getByRole('button',{name:'Kirim pre-test',exact:true}).click();await expect(page.getByRole('alert')).toContainText('belum dijawab');await expect(page.getByRole('heading',{name:'Pre-test',exact:true})).toBeVisible();});
test('clean teacher editor route guards unsaved changes and supports browser history',async({page})=>{
  test.setTimeout(25000);
  await test.step('sign in to the direct teacher editor route and create a draft',async()=>{
  await page.goto('/guru/materi/baru');
  await expect(page.getByRole('heading',{name:'Masuk ruang guru.'})).toBeVisible();
  await page.getByLabel('Email guru').fill('guru@ruanggizi.local');
  await page.getByLabel('Kata sandi').fill('BelajarGizi2026!');
  await page.getByRole('button',{name:'Masuk ruang guru',exact:true}).click();
  await expect(page.getByLabel('Judul materi')).toBeVisible();
  await page.getByLabel('Judul materi').fill('Draf belum disimpan');
  });
  await test.step('cancel browser Back from the skip-link fragment',async()=>{
  const skipLink=page.getByRole('link',{name:'Lewati ke konten utama'});
  await skipLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/);
  await expect.poll(()=>page.evaluate(()=>window.history.state?.idx)).toBeGreaterThan(1);
  page.once('dialog',dialog=>dialog.dismiss());
  await page.evaluate(()=>window.history.back());
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.getByLabel('Judul materi')).toBeVisible();

  await page.evaluate(()=>{
    const target=document.createElement('div');target.id='history-regression-target';document.body.append(target);
    const link=document.createElement('a');link.id='history-regression-link';link.href='#history-regression-target';link.textContent='Fragment history regression';document.body.append(link);
  });
  const secondFragment=page.locator('#history-regression-link');
  await secondFragment.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#history-regression-target$/);
  const stableEntry={href:page.url(),index:await page.evaluate(()=>window.history.state?.idx)};
  expect(stableEntry.index).toBe(3);
  let promptCount=0;
  const dismissHistoryPrompt=(dialog:import('@playwright/test').Dialog)=>{promptCount++;void dialog.dismiss();};
  page.on('dialog',dismissHistoryPrompt);
  const assertCanceledBack=async(delta:number,expectedPrompts:number)=>{
    await page.evaluate((steps)=>window.history.go(steps),delta);
    await expect.poll(()=>promptCount).toBe(expectedPrompts);
    await expect.poll(()=>page.evaluate(()=>({href:window.location.href,index:window.history.state?.idx}))).toEqual(stableEntry);
    await expect(page.getByLabel('Judul materi')).toHaveValue('Draf belum disimpan');
  };
  await assertCanceledBack(-1,1);
  await assertCanceledBack(-1,2);
  await assertCanceledBack(-2,3);
  page.off('dialog',dismissHistoryPrompt);
  });
  await test.step('cancel logout without clearing the draft or session',async()=>{
  await page.getByRole('button',{name:/Guru Pengelola/}).click();
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Keluar ruang guru',exact:true}).click();
  await expect(page.getByLabel('Judul materi')).toBeVisible();
  await expect(page.getByRole('dialog',{name:'Akun guru'})).toBeVisible();
  });
  await test.step('confirm logout and restore the protected URL after sign-in',async()=>{
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Keluar ruang guru',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Masuk ruang guru.'})).toBeVisible();
  await page.getByLabel('Email guru').fill('guru@ruanggizi.local');
  await page.getByLabel('Kata sandi').fill('BelajarGizi2026!');
  await page.getByRole('button',{name:'Masuk ruang guru',exact:true}).click();
  await expect(page.getByLabel('Judul materi')).toBeVisible();
  await page.getByLabel('Judul materi').fill('Draf setelah masuk kembali');
  });
  await test.step('confirm guarded route navigation and browser Back/Forward',async()=>{
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Bank soal',exact:true}).click();
  await expect(page.getByLabel('Judul materi')).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Bank soal',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Bank soal',exact:true})).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel('Judul materi')).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading',{name:'Bank soal',exact:true})).toBeVisible();
  });
});
test('teacher editors validate, save, preview, and preserve snapshot versions',async({page})=>{await page.goto('/#/guru/masuk');await page.getByLabel('Email guru').fill('guru@ruanggizi.local');await page.getByLabel('Kata sandi').fill('BelajarGizi2026!');await page.getByRole('button',{name:'Masuk ruang guru',exact:true}).click();await page.getByRole('button',{name:'Materi',exact:true}).click();await page.getByRole('button',{name:'Tambah materi',exact:true}).click();await page.getByRole('button',{name:'Simpan perubahan',exact:true}).click();await expect(page.locator('.field-error').first()).toHaveText('Judul materi wajib diisi.');await page.getByLabel('Judul materi').fill('Materi uji draf');await page.getByLabel('Judul bagian').fill('Bagian uji');await page.getByLabel('Isi materi').fill('Isi materi uji untuk validasi editor.');await page.getByRole('button',{name:'Pratinjau',exact:true}).click();await expect(page.locator('.lesson-preview')).toContainText('Bagian uji');await page.getByRole('button',{name:'Simpan perubahan',exact:true}).click();await expect(page.getByRole('heading',{name:'Materi',exact:true})).toBeVisible();await expect(page.getByText('Materi uji draf',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Bank soal',exact:true}).click();await expect(page.getByText('Pre-test & post-test memakai bank soal yang sama.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Tambah pertanyaan',exact:true}).click();await page.getByRole('button',{name:'Simpan perubahan',exact:true}).click();await expect(page.getByText('Pilih satu kunci untuk soal pilihan tunggal.',{exact:true})).toBeVisible();});
