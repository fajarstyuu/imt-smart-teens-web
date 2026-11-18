/** Focused lesson drafting. A single body is still one stable backend section, not a new content model. */
import {useState} from 'react';
import {Button,Field,ErrorState,ConfirmDialog} from './ui';
import {History,TextArea} from './AdminControls';
import {useAction} from './ui';
import {useUnsaved} from '../hooks/useUnsaved';
import {adminApi} from '../services/admin';
import type {LessonEditor as LessonDto,LessonDraft,LessonQuizDraft,SectionDraft} from '../services/dto';
const newSection=():SectionDraft=>({id:crypto.randomUUID(),title:'',body:'',required:true});
const newQuiz=():LessonQuizDraft=>({text:'',options:[{id:crypto.randomUUID(),text:''},{id:crypto.randomUUID(),text:''}],correct_option_id:null});
const draftWithQuiz=(draft?:LessonDraft|null):LessonDraft=>({title:draft?.title??'',description:draft?.description??'',sections:draft?.sections??[newSection()],quiz:draft?.quiz??newQuiz()});
export function LessonEditor({initial,position=1,onCreated,navigate}:{initial:LessonDto|null;position?:number;onCreated:(id:string)=>void;navigate?:(path:string)=>void}){
 const [editor,setEditor]=useState(initial);
 const [draft,setDraft]=useState<LessonDraft>(()=>draftWithQuiz(initial?.draft));
 const [baseline,setBaseline]=useState(()=>JSON.stringify(draft));
 const [preview,setPreview]=useState(false),[archive,setArchive]=useState(false),[notice,setNotice]=useState('');
 const action=useAction(),dirty=JSON.stringify(draft)!==baseline,clearUnsaved=useUnsaved(dirty);
 const updateSection=(index:number,value:Partial<SectionDraft>)=>setDraft(d=>({...d,sections:d.sections.map((s,i)=>i===index?{...s,...value}:s)}));
 const save=()=>void action.run(async()=>{
  if(!draft.title.trim())throw Error('Judul materi wajib diisi.');
  const quiz=draft.quiz;if(!quiz||quiz.options.length!==2||quiz.options.some(o=>!o.id))throw Error('Setiap materi memerlukan tepat dua pilihan kuis berurutan. Isi pertanyaan dan kunci dapat dilengkapi sebelum publikasi.');
  // Only fill an unnamed default section. Never flatten existing content, regenerate IDs,
  // replace custom section headings, or change optional/required completion flags.
  const normalized={...draft,sections:draft.sections.map((s,i)=>({...s,title:s.title.trim()?s.title:i===0?draft.title:`Subbab ${i+1}`}))};
  const saved=await adminApi.saveLesson(editor?.id??null,normalized,editor?.position??position,editor?.revision);
  setEditor(saved);const savedDraft={...saved.draft,quiz:saved.draft.quiz??normalized.quiz};setDraft(savedDraft);setBaseline(JSON.stringify(savedDraft));clearUnsaved();setNotice('Draf tersimpan. Belum mengubah materi yang dipakai siswa.');if(!editor)onCreated(saved.id);
 });
 return <section className="content-editor"><div className="teacher-page-heading"><div><span className="eyebrow">KONTEN / MATERI</span><h1>{editor?'Edit materi':'Tambah materi'}</h1><p>Tulis materinya dulu. Publikasi dilakukan setelah konten siap.</p></div><Button variant="ghost" onClick={()=>setPreview(!preview)}>Pratinjau</Button></div>
 {notice&&<p className="cms-success" role="status">{notice}</p>}{action.error&&<ErrorState message={action.error}/>}
 <div className="cms-editor-layout"><div><fieldset disabled={action.busy||editor?.state==='archived'} className="editor-fields cms-panel cms-editor-body"><h2>Isi materi</h2>
 <Field id="lesson-title" label="Judul materi" helper="Judul utama yang muncul di daftar materi siswa." value={draft.title} maxLength={200} required onChange={e=>setDraft({...draft,title:e.target.value})}/>
 <TextArea id="lesson-description" label="Deskripsi singkat (opsional)" value={draft.description} onChange={description=>setDraft({...draft,description})}/>
 <TextArea id="section-body-0" label="Isi materi" value={draft.sections[0]?.body??''} onChange={body=>draft.sections.length?updateSection(0,{body}):setDraft({...draft,sections:[{...newSection(),body}]})}/>
 <p className="cms-note">Satu materi cukup satu judul dan isi. Subbab digunakan hanya bila diperlukan.</p>
 <details className="cms-subchapters" open={draft.sections.length>1?true:undefined}><summary>Subbab & pengaturan isi (opsional)</summary>
 {draft.sections.map((s,i)=><section key={s.id} className="section-editor"><h3>Subbab {i+1}</h3><Field id={`section-title-${i}`} label={`Judul subbab ${i+1}`} value={s.title} helper={i===0?'Jika kosong, judul materi digunakan otomatis.':undefined} onChange={e=>updateSection(i,{title:e.target.value})}/>{i>0&&<TextArea id={`section-body-${i}`} label={`Isi subbab ${i+1}`} value={s.body} onChange={body=>updateSection(i,{body})}/>}<label className="check-field"><input type="checkbox" checked={s.required} onChange={e=>updateSection(i,{required:e.target.checked})}/>Subbab wajib dikunjungi</label>{i>0&&<Button variant="ghost" onClick={()=>setDraft({...draft,sections:draft.sections.filter(x=>x.id!==s.id)})}>Hapus subbab {i+1}</Button>}</section>)}
 <Button variant="secondary" onClick={()=>setDraft({...draft,sections:[...draft.sections,newSection()]})}>Tambah subbab</Button></details>
 <fieldset className="lesson-quiz-editor"><legend>Pertanyaan pemahaman siswa</legend><p className="cms-note">Satu pertanyaan pilihan tunggal dengan dua pilihan berurutan A dan B. Kunci hanya terlihat oleh admin.</p><TextArea id="lesson-quiz-question" label="Pertanyaan kuis" value={draft.quiz?.text??''} onChange={text=>setDraft({...draft,quiz:{...(draft.quiz??newQuiz()),text}})}/>{draft.quiz?.options.map((o,i)=><div className="option-editor-row" key={o.id}><input type="radio" name="lesson-quiz-key" aria-label={`Kunci jawaban pilihan ${String.fromCharCode(65+i)}`} checked={draft.quiz?.correct_option_id===o.id} onChange={()=>setDraft({...draft,quiz:{...draft.quiz!,correct_option_id:o.id}})}/><Field id={`lesson-quiz-option-${i}`} label={`Pilihan kuis ${String.fromCharCode(65+i)}`} value={o.text} onChange={e=>setDraft({...draft,quiz:{...draft.quiz!,options:draft.quiz!.options.map(option=>option.id===o.id?{...option,text:e.target.value}:option)}})}/></div>)}</fieldset></fieldset>
 <div className="editor-save-bar"><div><strong>{dirty?'Perubahan belum disimpan':'Draf tersimpan'}</strong><p className="cms-note">Belum mengubah materi yang dipakai siswa.</p></div><div className="cms-actions"><Button variant="secondary" busy={action.busy} disabled={editor?.state==='archived'} onClick={save}>Simpan draf</Button><Button disabled={!navigate||action.busy} onClick={()=>navigate?.('/admin/publikasi')}>Ke publikasi</Button></div></div></div>
 <aside className="cms-editor-aside"><h2>Dua langkah yang jelas</h2><ol><li>Siapkan dan simpan konten.</li><li>Tinjau di halaman Publikasi.</li></ol>{editor&&<><p className="cms-note">{editor.state==='archived'?'Materi diarsipkan':`Urutan ${editor.position??'belum ditetapkan'}`}</p><History versions={editor.versions}/><details><summary>Pengaturan lanjutan</summary><p className="cms-note">Jika terjadi konflik, ambil revisi terbaru lalu periksa sebelum menyimpan ulang. Isi formulir tidak diganti.</p><Button variant="ghost" disabled={action.busy} onClick={()=>void action.run(async()=>{const latest=await adminApi.lesson(editor.id);const known=JSON.parse(baseline) as LessonDraft;const serverDraft={...latest.draft,quiz:latest.draft.quiz??known.quiz??draft.quiz};setEditor(latest);setBaseline(JSON.stringify(serverDraft));setNotice('Revisi dan posisi terbaru dimuat; isi formulir tetap dipertahankan. Periksa sebelum menyimpan ulang.');})}>Muat revisi terbaru</Button><Button variant="danger" disabled={action.busy||editor.state==='archived'} onClick={()=>{action.setError('');setArchive(true);}}>Arsipkan materi</Button></details></>}</aside></div>
 {preview&&<article className="lesson-preview"><h2>{draft.title}</h2><p>{draft.description}</p>{draft.sections.map(s=><section key={s.id}>{s.title&&<h3>{s.title}</h3>}<p className="plain-text">{s.body}</p></section>)}</article>}
 <ConfirmDialog error={action.error} open={archive} title="Arsipkan materi?" description="Materi dihapus dari jalur draf berikutnya. Riwayat siswa dan versi terbit tetap tersimpan." busy={action.busy} onClose={()=>setArchive(false)} label="Ya, arsipkan" onConfirm={()=>void action.run(async()=>{setEditor(await adminApi.archiveLesson(editor!.id,editor!.revision));setArchive(false);setNotice('Materi diarsipkan.');})}/></section>;
}
