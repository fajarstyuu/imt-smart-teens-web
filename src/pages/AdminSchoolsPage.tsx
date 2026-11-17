/** School catalog CRUD. Grants for historical reports are assigned separately by an operator. */
import {useState} from 'react';
import {useApp} from '../hooks/useApp';
import {useResource} from '../hooks/useResource';
import {adminApi} from '../services/admin';
import type {School} from '../services/dto';
import {Button,ConfirmDialog,ErrorState,Field,StatusBadge,useAction} from '../components/ui';
import {Pager,ReadState,Select} from '../components/AdminControls';
export function AdminSchoolsPage(){
 const {data}=useApp();if(!data.teacher)return <ErrorState message="Tidak memiliki izin mengelola katalog sekolah."/>;
 return <SchoolCatalog/>;
}
function SchoolCatalog(){
 const [q,setQ]=useState(''),[status,setStatus]=useState('active'),[offset,setOffset]=useState(0),[editor,setEditor]=useState<School|'new'|null>(null),[name,setName]=useState(''),[archive,setArchive]=useState<School|null>(null),[notice,setNotice]=useState('');
 const model=useResource(()=>adminApi.schools(q,status,offset),[q,status,offset]);const action=useAction();
 const edit=(school:School|'new')=>{setEditor(school);setName(school==='new'?'':school.name);action.setError('');};
 const save=()=>void action.run(async()=>{if(!name.trim())throw Error('Nama sekolah wajib diisi.');const saved=await adminApi.saveSchool(editor==='new'?null:(editor as School).id,name.trim(),editor==='new'?undefined:(editor as School).revision);setEditor(null);setNotice(`Sekolah ${saved.name} tersimpan.`);model.reload();});
 return <><div className="teacher-page-heading"><div><span className="eyebrow">KATALOG SEKOLAH</span><h1>Sekolah</h1><p>Arsip menghapus sekolah dari pilihan pendaftaran, bukan riwayat siswa.</p></div><Button disabled={action.busy} onClick={()=>edit('new')}>Tambah sekolah</Button></div>
 <div className="results-toolbar"><Field id="school-q" label="Cari sekolah" value={q} onChange={e=>{setQ(e.target.value);setOffset(0);}}/><Select id="school-status" label="Status sekolah" value={status} onChange={v=>{setStatus(v);setOffset(0);}}><option value="active">Aktif</option><option value="archived">Diarsipkan</option><option value="all">Semua</option></Select></div>
 {notice&&<p role="status">{notice}</p>}{action.error&&<ErrorState message={action.error}/>}
 {editor&&<section className="section-editor"><h2>{editor==='new'?'Tambah sekolah':'Edit sekolah'}</h2><Field id="school-name" label="Nama sekolah" value={name} disabled={action.busy} required maxLength={200} onChange={e=>setName(e.target.value)}/>{editor!=='new'&&<p>Revisi {editor.revision} · {editor.status}</p>}<div className="od-row"><Button busy={action.busy} onClick={save}>Simpan sekolah</Button><Button variant="secondary" disabled={action.busy} onClick={()=>setEditor(null)}>Batal</Button>{editor!=='new'&&action.error&&<Button variant="ghost" onClick={()=>void action.run(async()=>{const latest=await adminApi.school(editor.id);setEditor(latest);setNotice('Revisi terbaru dimuat; nama dalam formulir dipertahankan. Periksa sebelum menyimpan ulang.');})}>Muat revisi terbaru</Button>}</div><p className="editor-note">Sekolah baru tidak otomatis memberi akses laporan. Operator harus menetapkan cakupan sekolah secara terpisah.</p></section>}
 <ReadState loading={model.loading} error={model.error} retry={model.reload}/>{model.data&&<div className="data-table"><div className="table-scroll" role="region" aria-label="Daftar sekolah" tabIndex={0}><table><thead><tr><th>Nama sekolah</th><th>Status / revisi</th><th>Tindakan</th></tr></thead><tbody>{model.data.data.map(row=><tr key={row.id}><td><strong>{row.name}</strong></td><td><StatusBadge>{row.status==='active'?'Aktif':'Diarsipkan'}</StatusBadge> · {row.revision}</td><td><Button variant="ghost" disabled={action.busy||row.status==='archived'} onClick={()=>edit(row)}>Edit {row.name}</Button><Button variant="ghost" aria-label={`Arsipkan ${row.name}`} disabled={action.busy||row.status==='archived'} onClick={()=>{action.setError('');setArchive(row);}}>Arsipkan</Button></td></tr>)}</tbody></table>{!model.data.data.length&&<p className="table-empty">Tidak ada sekolah sesuai filter.</p>}</div><Pager page={model.data} offset={offset} onChange={setOffset} disabled={action.busy}/></div>}
 <ConfirmDialog error={action.error} open={!!archive} title="Arsipkan sekolah?" description={`${archive?.name??''} tidak tersedia untuk pendaftaran baru. Riwayat siswa tetap tersimpan.`} busy={action.busy} onClose={()=>setArchive(null)} label="Ya, arsipkan" onConfirm={()=>void action.run(async()=>{await adminApi.archiveSchool(archive!.id,archive!.revision);setArchive(null);setNotice('Sekolah diarsipkan.');model.reload();})}/></>;
}
