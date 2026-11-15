import { beforeAll, afterAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BrowserRouter } from 'react-router-dom';
import App from '../src/App';
import { AppProvider } from '../src/hooks/useApp';
import { api } from '../src/services/api';
import { token } from '../src/services/http';
import type { AppServices } from '../src/services/contracts';
let server:ChildProcess;
beforeAll(async()=>{server=spawn(process.execPath,['server/development.mjs'],{env:{...process.env,PORT:'4176',RG_DATA_DIR:mkdtempSync(join(tmpdir(),'imt-smart-teens-dom-'))},stdio:'ignore'});for(let i=0;i<100;i++){try{const response=await fetch('http://127.0.0.1:4176/api/bootstrap');if(response.ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}throw new Error('Test API did not start');});
afterAll(()=>server?.kill());
beforeEach(()=>{localStorage.clear();window.history.replaceState({},'','/');});
afterEach(()=>cleanup());
const mount=(services:AppServices=api)=>render(<BrowserRouter><AppProvider services={services}><App/></AppProvider></BrowserRouter>);
async function register(services:AppServices=api){mount(services);await screen.findByRole('heading',{name:'Selamat datang.'});const user=userEvent.setup();await user.type(screen.getByLabelText(/Nama lengkap/),'Siswa pengujian DOM');await user.type(screen.getByLabelText(/Asal sekolah/),'Sekolah pengujian DOM');await user.click(screen.getByRole('button',{name:'Mulai pre-test'}));await screen.findByRole('heading',{name:'Pre-test',exact:true});return user;}
async function answer(type:string,count:number){const user=userEvent.setup();for(let i=0;i<count;i++){const option=document.querySelector('.answer-option input') as HTMLInputElement;await user.click(option);await waitFor(()=>expect(document.querySelector('.save-status')?.textContent).toContain('Jawaban tersimpan'));if(i<count-1)await user.click(screen.getByRole('button',{name:'Berikutnya',exact:true}));}await user.click(screen.getByRole('button',{name:`Kirim ${type}`,exact:true}));await user.click(screen.getByRole('button',{name:'Kirim jawaban',exact:true}));await screen.findByRole('heading',{name:/Jawabanmu sudah terkirim|Seluruh tahap telah selesai/});}
test('complete student sequence uses actual API saves and restores session on remount',async()=>{
  let user=await register();expect(document.querySelector('nav[aria-label="Navigasi siswa"]')).toBeNull();await answer('pre-test',5);await user.click(screen.getByRole('button',{name:'Mulai belajar',exact:true}));await screen.findByRole('button',{name:'Buka materi',exact:true});
  for(let i=0;i<3;i++){if(i===0)await user.click(screen.getByRole('button',{name:'Buka materi',exact:true}));await waitFor(()=>expect(screen.getByRole('button',{name:'Bagian berikutnya',exact:true})).toHaveProperty('disabled',false));await user.click(screen.getByRole('button',{name:'Bagian berikutnya',exact:true}));await waitFor(()=>expect(screen.getByRole('button',{name:'Selesai & lanjut',exact:true})).toHaveProperty('disabled',false));await user.click(screen.getByRole('button',{name:'Selesai & lanjut',exact:true}));}
  await screen.findByRole('heading',{name:'Quiz',exact:true});await answer('quiz',4);expect(document.querySelector('.score-display')).toBeTruthy();await user.click(screen.getByRole('button',{name:'Buka kalkulator IMT',exact:true}));await user.type(screen.getByLabelText(/Berat badan \(kg\)/),'45,5');await user.type(screen.getByLabelText(/Tinggi badan \(cm\)/),'0');await user.click(screen.getByRole('button',{name:'Hitung IMT',exact:true}));expect(document.querySelector('#height-hint')?.textContent).toContain('lebih besar dari nol');await user.clear(screen.getByLabelText(/Tinggi badan \(cm\)/));await user.type(screen.getByLabelText(/Tinggi badan \(cm\)/),'155');await user.click(screen.getByRole('button',{name:'Hitung IMT',exact:true}));await waitFor(()=>expect(document.querySelector('.bmi-number')?.textContent).toContain('18,9'));
  cleanup();mount();await screen.findByRole('heading',{name:'Kalkulator IMT',exact:true});expect(document.querySelector('.bmi-number')?.textContent).toContain('18,9');user=userEvent.setup();await user.click(screen.getByRole('button',{name:'Lanjut ke post-test',exact:true}));await screen.findByRole('heading',{name:'Post-test',exact:true});await answer('post-test',5);await user.click(screen.getByRole('button',{name:'Lihat ringkasan',exact:true}));await screen.findByRole('heading',{name:'Perjalanan yang tuntas.'});expect(document.querySelectorAll('.summary-stats .od-stat')).toHaveLength(3);await user.click(screen.getByText('Alat apa yang digunakan untuk mengukur berat badan?',{selector:'summary'}));expect(document.querySelector('.correct-answer')?.textContent).toContain('Timbangan');
});
test('development server serves the app shell for direct clean browser routes',async()=>{
  const response=await fetch('http://127.0.0.1:4176/guru/materi/materi-2',{headers:{accept:'text/html'}});
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('text/html');
  expect(await response.text()).toContain('<div id="root">');
  const apiResponse=await fetch('http://127.0.0.1:4176/api/unknown',{headers:{accept:'text/html'}});
  expect(apiResponse.headers.get('content-type')).toContain('application/json');
  const assetResponse=await fetch('http://127.0.0.1:4176/assets/stock/measurement.jpg',{headers:{accept:'text/html'}});
  expect(assetResponse.headers.get('content-type')).toContain('image/jpeg');
});
test('direct clean teacher editor route renders teacher sign-in',async()=>{
  window.history.replaceState({},'','/guru/materi/materi-2');
  mount();
  await screen.findByRole('heading',{name:'Masuk ruang guru.'});
});
test('legacy hash bookmarks are replaced with equivalent clean paths',async()=>{
  window.history.replaceState({},'','/#/guru/materi/materi-2');
  mount();
  await screen.findByRole('heading',{name:'Masuk ruang guru.'});
  expect(window.location.pathname).toBe('/guru/materi/materi-2');
  expect(window.location.hash).toBe('');
});
test('unknown browser routes show a clear not-found state',async()=>{
  window.history.replaceState({},'','/alamat-tidak-tersedia');
  mount();
  await screen.findByRole('heading',{name:'Halaman tidak ditemukan.'});
});
test('Vite source entry resolves to the application home route',async()=>{
  window.history.replaceState({},'','/app.html');
  mount();
  await screen.findByRole('heading',{name:'Selamat datang.'});
  expect(window.location.pathname).toBe('/');
});
test('legacy session tokens migrate to the Imt Smart Teens storage key',()=>{
  localStorage.setItem('rg-token-teacher','existing-teacher-session');
  expect(token.get('teacher')).toBe('existing-teacher-session');
  expect(localStorage.getItem('imt-smart-teens-token-teacher')).toBe('existing-teacher-session');
  expect(localStorage.getItem('rg-token-teacher')).toBeNull();
});
test('cleared browser storage does not restore a stale in-memory session',()=>{
  token.set('student','stale-session');
  localStorage.clear();
  expect(token.get('student')).toBe('');
  token.set('student','');
});
test('token keeps the latest memory value when persistence fails for empty or stored sessions',()=>{
  const key='imt-smart-teens-token-teacher';
  const originalSetItem=localStorage.setItem.bind(localStorage);
  const setItem=vi.spyOn(localStorage,'setItem').mockImplementation((storageKey,value)=>{
    if(storageKey===key)throw new Error('Storage quota exceeded.');
    originalSetItem(storageKey,value);
  });
  try {
    token.set('teacher','memory-session');
    expect(setItem).toHaveBeenCalledWith(key,'memory-session');
    expect(token.get('teacher')).toBe('memory-session');

    setItem.mockRestore();
    token.set('teacher','');
    localStorage.setItem(key,'persisted-session-A');
    const failedReplacement=vi.spyOn(localStorage,'setItem').mockImplementation((storageKey,value)=>{
      if(storageKey===key)throw new Error('Storage quota exceeded.');
      originalSetItem(storageKey,value);
    });
    token.set('teacher','memory-session-B');
    expect(failedReplacement).toHaveBeenCalledWith(key,'memory-session-B');
    expect(localStorage.getItem(key)).toBe('persisted-session-A');
    expect(token.get('teacher')).toBe('memory-session-B');
    failedReplacement.mockRestore();
  } finally {
    setItem.mockRestore();
    vi.restoreAllMocks();
    token.set('teacher','');
  }
});
test('failed answer retains selection, retries, and blocks incomplete submission',async()=>{
  let fail=true;const services:AppServices={...api,student:{...api.student,async saveAnswer(...args){if(fail){fail=false;throw new Error('Simpan gagal untuk pengujian.');}return api.student.saveAnswer(...args);}}};const user=await register(services);await user.click(document.querySelector('.answer-option input')!);await waitFor(()=>expect(document.querySelector('.save-status')?.textContent).toBe('Jawaban belum tersimpan'));expect(document.querySelector('.answer-option input')).toHaveProperty('checked',true);await user.click(screen.getByRole('button',{name:'Coba lagi',exact:true}));await waitFor(()=>expect(document.querySelector('.save-status')?.textContent).toBe('Jawaban tersimpan'));await user.click(screen.getByRole('button',{name:'Pertanyaan 5, belum dijawab',exact:true}));await user.click(screen.getByRole('button',{name:'Kirim pre-test',exact:true}));expect(screen.getByRole('alert').textContent).toContain('belum dijawab');
});
test('direct restricted URL is guarded before lesson content is rendered',async()=>{const user=await register();cleanup();window.history.replaceState({},'','/#/materi/materi-2');mount();await screen.findByRole('heading',{name:'Satu langkah dulu.'});expect(document.querySelector('.lesson-body')).toBeNull();await user.click(screen.getByRole('button',{name:'Kembali ke Pre-test',exact:true}));await screen.findByRole('heading',{name:'Pre-test',exact:true});});
test('teacher filtering, full answer detail, draft preview and bank validation',async()=>{
  window.history.replaceState({},'','/#/guru/masuk');mount();const user=userEvent.setup();await screen.findByRole('heading',{name:'Masuk ruang guru.'});await user.type(screen.getByLabelText(/Email guru/),'guru@ruanggizi.local');await user.type(screen.getByLabelText(/Kata sandi/),'BelajarGizi2026!');await user.click(screen.getByRole('button',{name:'Masuk ruang guru',exact:true}));await screen.findByRole('heading',{name:'Hasil siswa',exact:true});await user.type(screen.getByLabelText('Cari siswa'),'Alya');await user.click(screen.getByRole('button',{name:'Lihat jawaban',exact:false}));await screen.findByRole('heading',{name:'Alya Prameswari',exact:true});expect(document.querySelectorAll('.teacher-answer')).toHaveLength(5);await user.click(screen.getByRole('button',{name:'Kembali ke hasil siswa'}));expect(screen.getByLabelText('Cari siswa')).toHaveProperty('value','Alya');await user.click(screen.getByRole('tab',{name:'Per pertanyaan'}));expect(screen.getByLabelText('Pertanyaan · Pre-test')).toBeTruthy();
  await user.click(screen.getByRole('button',{name:'Materi',exact:true}));await screen.findByRole('heading',{name:'Materi',exact:true});await user.click(screen.getByRole('button',{name:'Tambah materi',exact:true}));await user.click(screen.getByRole('button',{name:'Simpan perubahan',exact:true}));expect(screen.getByText('Judul materi wajib diisi.')).toBeTruthy();await user.type(screen.getByLabelText(/Judul materi/),'Materi draf DOM');await user.type(screen.getByLabelText(/Judul bagian/),'Bagian contoh');await user.type(screen.getByLabelText(/Isi materi/),'Isi materi untuk pratinjau dan penyimpanan draf.');await user.click(screen.getByRole('button',{name:'Pratinjau',exact:true}));expect(document.querySelector('.lesson-preview')?.textContent).toContain('Bagian contoh');await user.click(screen.getByRole('button',{name:'Simpan perubahan',exact:true}));await screen.findByRole('heading',{name:'Materi',exact:true});expect(await screen.findByText('Materi draf DOM')).toBeTruthy();await user.click(screen.getByRole('button',{name:'Bank soal',exact:true}));await screen.findByRole('heading',{name:'Bank soal',exact:true});await user.click(screen.getByRole('button',{name:'Tambah pertanyaan',exact:true}));await user.click(screen.getByRole('button',{name:'Simpan perubahan',exact:true}));expect(screen.getByText('Pilih satu kunci untuk soal pilihan tunggal.')).toBeTruthy();
});
