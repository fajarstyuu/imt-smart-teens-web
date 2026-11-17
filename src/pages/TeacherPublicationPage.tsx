/** One review and confirmation surface. Draft publication is atomic on the server, not chained in UI. */
import {useState} from 'react';
import {useResource} from '../hooks/useResource';
import {adminApi} from '../services/admin';
import {loadReleaseReview,reviewedCommand,type ReleaseReview} from '../services/publication';
import {Button,ConfirmDialog,Dialog,ErrorState,StatusBadge,useAction} from '../components/ui';
import {History,ReadState} from '../components/AdminControls';
import type {PathEditor} from '../services/dto';
export function TeacherPublicationPage({navigate}:{navigate:(path:string)=>void}){
 const model=useResource(loadReleaseReview);const action=useAction();
 const [confirm,setConfirm]=useState<ReleaseReview|null>(null),[preview,setPreview]=useState(false),[history,setHistory]=useState(false),[needsReview,setNeedsReview]=useState(false),[receipt,setReceipt]=useState<PathEditor|null>(null);
 const review=model.data;
 const refresh=()=>{setConfirm(null);setNeedsReview(false);setReceipt(null);action.setError('');model.reload();};
 const publish=()=>void action.run(async()=>{
  if(!confirm)return;
  try{
   const saved=await adminApi.release(reviewedCommand(confirm));
   // A network error can hide a committed response. Never retry the same POST blindly;
   // the path revision rejects replay, and an explicit fresh review reconciles uncertainty.
   const readback=await adminApi.path();
   if(readback.published?.id!==saved.published?.id)throw Error('Publikasi tersimpan, tetapi paket aktif berubah. Muat ulang tinjauan untuk memeriksa.');
   setReceipt(saved);setConfirm(null);setNeedsReview(true);
  }catch(error){setNeedsReview(true);setConfirm(null);throw error;}
 });
 return <><div className="teacher-page-heading"><div><span className="eyebrow">PENERBITAN / PEMBELAJARAN</span><h1>Publikasi pembelajaran</h1><p>Periksa materi dan soal. Terbitkan ketika semuanya siap.</p></div><Button variant="ghost" disabled={!review||action.busy} onClick={()=>setHistory(true)}>Riwayat publikasi</Button></div>
 <ReadState loading={model.loading} error={model.error} retry={model.reload}/>
 {receipt&&<p className="cms-success" role="status">Pembelajaran versi {receipt.published?.version} berhasil diterbitkan. Pendaftaran baru akan memakai paket ini.</p>}
 {action.error&&<ErrorState message={action.error}/>}
 {needsReview&&!receipt&&<p className="cms-note">Jangan mengulang publikasi sebelum memeriksa status terbaru. Jika respons terputus, publikasi mungkin sudah tersimpan.</p>}
 {review&&<div className="cms-publication-layout"><div className="cms-panel">
 <section className="cms-release-step"><h2><span className="cms-number">1</span>Materi yang akan digunakan</h2>{review.lessons.length?review.lessons.map((lesson,i)=><div className="cms-release-row" key={lesson.id}><div><strong>{i+1}. {lesson.draft.title}</strong><p>{lesson.draft.sections.length} subbab · {lesson.state==='draft'?'Perubahan draf':'Sudah terbit'}</p><details><summary>Periksa isi materi</summary><p>{lesson.draft.description}</p>{lesson.draft.sections.map(s=><section key={s.id}><h3>{s.title}</h3><p className="plain-text">{s.body}</p><small>{s.required?'Wajib dikunjungi':'Opsional'}</small></section>)}</details></div><Button variant="ghost" disabled={action.busy} onClick={()=>navigate(`/admin/materi/${lesson.id}`)}>Edit</Button></div>):<p>Belum ada materi. Tambahkan materi terlebih dahulu.</p>}</section>
 <section className="cms-release-step"><h2><span className="cms-number">2</span>Soal yang akan digunakan</h2>{review.banks.map(({bank,questions})=><div className="cms-release-row" key={bank.id}><div><strong>{bank.kind==='paired'?'Pre-test & post-test':'Quiz'}</strong><p>{questions.length} soal aktif</p><details><summary>Periksa pertanyaan & kunci</summary>{questions.map(q=><section key={q.id}><h3>{q.position}. {q.draft.text}</h3><ul>{q.draft.options.map(o=><li key={o.id}>{o.text}{q.draft.correct_option_ids.includes(o.id)?' · Kunci jawaban':''}</li>)}</ul></section>)}</details></div><Button variant="ghost" disabled={action.busy} onClick={()=>navigate(`/admin/soal?bank=${bank.id}`)}>Edit</Button></div>)}</section>
 <section className="cms-release-step"><h2><span className="cms-number">3</span>Siapa yang menerima perubahan?</h2><p>Siswa yang <strong>mendaftar setelah publikasi</strong> menerima paket ini. Siswa yang sedang belajar tetap memakai versi saat mendaftar; progres dan jawabannya tidak berubah.</p></section></div>
 <aside className="cms-release-summary"><span className="eyebrow">RINGKASAN</span><h2>{review.issues.length?'Masih perlu dilengkapi':'Siap untuk diterbitkan'}</h2><ul className="cms-readiness"><li>{review.lessons.length} materi tersusun berurutan</li>{review.banks.map(({bank,questions})=><li key={bank.id}>{questions.length} soal {bank.kind==='paired'?'pre-test & post-test':'quiz'}</li>)}</ul>{review.issues.length?<ul className="cms-issues">{review.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul>:<StatusBadge status="success">Materi dan soal siap</StatusBadge>}<p className="cms-note">Materi, soal, dan jalur belajar diterbitkan bersama. Jika konten berubah sejak ditinjau, publikasi dibatalkan.</p><Button variant="secondary" disabled={action.busy} onClick={()=>setPreview(true)}>Pratinjau paket</Button><Button busy={action.busy} disabled={!!review.issues.length||needsReview} onClick={()=>{action.setError('');setConfirm(review);}}>Terbitkan pembelajaran</Button><Button variant="ghost" disabled={action.busy} onClick={refresh}>Muat ulang tinjauan</Button></aside></div>}
 <ConfirmDialog open={!!confirm} title="Terbitkan pembelajaran?" description="Paket yang sudah ditinjau akan digunakan untuk pendaftaran siswa baru. Progres siswa yang sedang belajar tetap aman." busy={action.busy} error={action.error} label="Ya, terbitkan" onClose={()=>setConfirm(null)} onConfirm={publish}/>
 <Dialog open={preview} onClose={()=>setPreview(false)} title="Pratinjau paket pembelajaran"><p>Urutan yang akan diterima siswa baru.</p><ol className="cms-preview-sequence"><li>Pre-test</li>{review?.lessons.map(l=><li key={l.id}>{l.draft.title}</li>)}<li>Quiz</li><li>Kalkulator IMT</li><li>Post-test</li></ol><p>Kunci jawaban tidak ditampilkan kepada siswa.</p></Dialog>
 <Dialog open={history} onClose={()=>setHistory(false)} title="Riwayat publikasi">{review&&<History versions={review.path.versions}/>}</Dialog></>;
}
