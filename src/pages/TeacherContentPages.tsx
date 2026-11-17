/** Bounded admin catalogs. Draft editing, ordering and publication have distinct surfaces. */
import {useState} from 'react';
import {useParams,useSearchParams} from 'react-router-dom';
import {useApp} from '../hooks/useApp';
import {useResource} from '../hooks/useResource';
import {adminApi} from '../services/admin';
import {Button,ErrorState,StatusBadge,useAction} from '../components/ui';
import {ReadState,Pager,Select} from '../components/AdminControls';
import {LessonEditor,QuestionEditor} from '../components/ContentEditors';
const contentLabel={draft:'Draf',published:'Terbit',archived:'Diarsipkan'};
export function TeacherLessonsPage({editId,navigate}:{editId?:string;navigate:(path:string)=>void}){
 const {data}=useApp();if(!data.teacher)return <ErrorState message="Tidak memiliki izin mengelola konten."/>;
 return editId?<LessonRoute key={editId} id={editId} navigate={navigate}/>:<LessonCatalog navigate={navigate}/>;
}
function LessonRoute({id,navigate}:{id:string;navigate:(p:string)=>void}){
 const model=useResource(async()=>id==='baru'?{editor:null,position:(await adminApi.path()).lesson_ids.length+1}:{editor:await adminApi.lesson(id),position:1},[id]);
 return <><Button variant="ghost" onClick={()=>navigate('/admin/materi')}>Kembali ke materi</Button><ReadState loading={model.loading} error={model.error} retry={model.reload}/>{model.data&&<LessonEditor initial={model.data.editor} position={model.data.position} navigate={navigate} onCreated={created=>navigate(`/admin/materi/${created}`)}/>}</>;
}
function LessonCatalog({navigate}:{navigate:(p:string)=>void}){
 const [status,setStatus]=useState(''),[offset,setOffset]=useState(0);const model=useResource(()=>adminApi.lessons(status,offset),[status,offset]);
 return <><div className="teacher-page-heading"><div><span className="eyebrow">KONTEN / MATERI</span><h1>Materi</h1><p>Siapkan isi materi di sini. Semua perubahan diterbitkan lewat halaman Publikasi.</p></div><div className="cms-actions"><Button variant="secondary" onClick={()=>navigate('/admin/publikasi')}>Ke publikasi</Button><Button onClick={()=>navigate('/admin/materi/baru')}>Tambah materi</Button></div></div>
 <div className="cms-catalog-filter"><Select id="lesson-status" label="Status materi" value={status} onChange={v=>{setStatus(v);setOffset(0);}}><option value="">Semua</option><option value="draft">Draf</option><option value="published">Terbit</option><option value="archived">Diarsipkan</option></Select></div>
 <ReadState loading={model.loading} error={model.error} retry={model.reload}/>{model.data&&<div className="data-table"><div className="table-scroll" role="region" aria-label="Daftar materi" tabIndex={0}><table><thead><tr><th>Urutan</th><th>Judul materi</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>{model.data.data.map(row=><tr key={row.id}><td>{row.position??'—'}</td><td><strong>{row.draft.title}</strong><p className="cms-note">{row.draft.sections.length} subbab</p></td><td><StatusBadge status={row.state==='published'?'success':'neutral'}>{contentLabel[row.state]}</StatusBadge></td><td><Button variant="ghost" onClick={()=>navigate(`/admin/materi/${row.id}`)}>Edit {row.draft.title}</Button></td></tr>)}</tbody></table>{!model.data.data.length&&<p className="table-empty">Belum ada materi sesuai filter.</p>}</div><Pager page={model.data} offset={offset} onChange={setOffset}/></div>}
 <PathOrder onChanged={model.reload}/></>;
}
function PathOrder({onChanged}:{onChanged:()=>void}){
 const [open,setOpen]=useState(false);const model=useResource(async()=>{if(!open)return null;const path=await adminApi.path();const lessons=[];for(const id of path.lesson_ids)lessons.push(await adminApi.lesson(id));return {path,lessons};},[open]);const action=useAction();
 const move=(index:number,direction:number)=>void action.run(async()=>{const current=model.data;if(!current)return;const ids=[...current.path.lesson_ids];[ids[index],ids[index+direction]]=[ids[index+direction],ids[index]];const path=await adminApi.order(ids,current.path.revision);model.setData({...current,path});onChanged();});
 return <details className="cms-order" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Atur urutan materi</summary><p className="cms-note">Urutan ini masih draf. Tinjau dan terbitkan setelah selesai.</p>{open&&<><ReadState loading={model.loading} error={model.error} retry={model.reload}/>{action.error&&<ErrorState message={action.error} retry={model.reload}/>}<ol className="path-order">{model.data?.path.lesson_ids.map((id,i)=><li key={id}><span>{model.data?.lessons.find(l=>l.id===id)?.draft.title}</span><Button variant="ghost" aria-label={`Naikkan materi ${i+1}`} disabled={action.busy||i===0} onClick={()=>move(i,-1)}>Naik</Button><Button variant="ghost" aria-label={`Turunkan materi ${i+1}`} disabled={action.busy||i===model.data!.path.lesson_ids.length-1} onClick={()=>move(i,1)}>Turun</Button></li>)}</ol></>}</details>;
}
export function TeacherQuestionsPage({editId,navigate}:{editId?:string;navigate:(p:string)=>void}){
 const {data}=useApp();const {bankId}=useParams();if(!data.teacher)return <ErrorState message="Tidak memiliki izin mengelola konten."/>;
 return editId&&bankId?<QuestionRoute key={`${bankId}:${editId}`} bank={bankId} id={editId} navigate={navigate}/>:<QuestionCatalog navigate={navigate}/>;
}
function QuestionRoute({bank,id,navigate}:{bank:string;id:string;navigate:(p:string)=>void}){
 const model=useResource(async()=>({editor:id==='baru'?null:await adminApi.question(bank,id)}),[bank,id]);
 return <><div className="cms-actions"><Button variant="ghost" onClick={()=>navigate(`/admin/soal?bank=${bank}`)}>Kembali ke bank soal</Button><Button variant="secondary" onClick={()=>navigate('/admin/publikasi')}>Ke publikasi</Button></div><ReadState loading={model.loading} error={model.error} retry={model.reload}/>{model.data&&<QuestionEditor bank={bank} initial={model.data.editor} onCreated={created=>navigate(`/admin/soal/${bank}/${created}`)}/>}</>;
}
function QuestionCatalog({navigate}:{navigate:(p:string)=>void}){
 const banks=useResource(adminApi.banks),[params,setParams]=useSearchParams();const selected=params.get('bank')??banks.data?.data[0]?.id;const bank=banks.data?.data.find(b=>b.id===selected);
 const [status,setStatus]=useState(''),[offset,setOffset]=useState(0);
 const questions=useResource(()=>selected?adminApi.questions(selected,status,offset):Promise.resolve(null),[selected,status,offset]);
 return <><div className="teacher-page-heading"><div><span className="eyebrow">KONTEN / ASESMEN</span><h1>Bank soal</h1><p>Kelola pertanyaan dan kunci jawaban. Urusan terbit ada di satu tempat.</p></div><div className="cms-actions"><Button variant="secondary" onClick={()=>navigate('/admin/publikasi')}>Ke publikasi</Button><Button disabled={!bank} onClick={()=>navigate(`/admin/soal/${selected}/baru`)}>Tambah pertanyaan</Button></div></div>
 <ReadState loading={banks.loading} error={banks.error} retry={banks.reload}/><div className="content-tabs" role="tablist" aria-label="Jenis bank soal">{banks.data?.data.map(b=><button key={b.id} type="button" role="tab" aria-selected={b.id===selected} onClick={()=>{setParams({bank:b.id});setOffset(0);}}>{b.kind==='paired'?'Pre-test / Post-test':'Quiz'}</button>)}</div>
 <p className="cms-note">{bank?.kind==='paired'?'Pre-test & post-test memakai bank soal yang sama.':'Quiz memakai kumpulan soal terpisah.'} Kunci jawaban hanya tersedia untuk admin.</p>
 <div className="cms-catalog-filter"><Select id="question-status" label="Status pertanyaan" value={status} onChange={v=>{setStatus(v);setOffset(0);}}><option value="">Semua</option><option value="draft">Draf</option><option value="published">Terbit</option><option value="archived">Diarsipkan</option></Select></div>
 <ReadState loading={questions.loading} error={questions.error} retry={questions.reload}/>{questions.data&&<div className="data-table"><div className="table-scroll" role="region" aria-label="Daftar soal" tabIndex={0}><table><thead><tr><th>Urutan</th><th>Pertanyaan</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>{questions.data.data.map(q=><tr key={q.id}><td>{q.position}</td><td><strong>{q.draft.text}</strong><p className="cms-note">{q.draft.type==='single'?'Pilihan tunggal':'Pilihan majemuk'} · {q.draft.options.length} pilihan</p></td><td>{contentLabel[q.state]}</td><td><Button variant="ghost" onClick={()=>navigate(`/admin/soal/${selected}/${q.id}`)}>Edit pertanyaan {q.position}</Button></td></tr>)}</tbody></table>{!questions.data.data.length&&<p className="table-empty">Belum ada pertanyaan sesuai filter.</p>}</div><Pager page={questions.data} offset={offset} onChange={setOffset}/></div>}</>;
}
