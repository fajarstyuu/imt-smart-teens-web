/** Bounded global school filtering. Catalog pages never change the selected report scope. */
import {useState} from 'react';
import {adminApi} from '../services/admin';
import {useResource} from '../hooks/useResource';
import {Button,Field} from './ui';
import {ReadState,Select} from './AdminControls';

export function ReportSchoolFilter({selected,onChange}:{selected:string;onChange:(id:string)=>void}) {
 const [query,setQuery]=useState(''),[status,setStatus]=useState('all'),[offset,setOffset]=useState(0);
 const catalog=useResource(()=>adminApi.schools(query,status,offset),[query,status,offset]);
 // Resolve an independently selected/archived URL ID even if it is not in this page.
 const detail=useResource(()=>selected?adminApi.school(selected):Promise.resolve(null),[selected]);
 const rows=catalog.data?.data??[];
 const absent=selected&&!rows.some(s=>s.id===selected);
 const retained=detail.data?.id===selected?detail.data:null;
 const label=(school:{name:string;status:string})=>school.name+(school.status==='archived'?' (arsip)':'');
 const retry=()=>{catalog.reload();detail.reload();};
 return <div className="report-school-filter">
  <Field id="report-school-search" label="Cari sekolah laporan" value={query} maxLength={300} onChange={e=>{setQuery(e.target.value);setOffset(0);}}/>
  <Select id="report-school-status" label="Status sekolah laporan" value={status} onChange={value=>{setStatus(value);setOffset(0);}}><option value="all">Aktif dan arsip</option><option value="active">Aktif</option><option value="archived">Arsip</option></Select>
  <Select id="report-school" label="Sekolah laporan" value={selected} onChange={onChange}>
   <option value="">Semua sekolah</option>
   {absent&&<option value={selected}>{retained?label(retained):'Sekolah tersimpan (nama belum tersedia)'}</option>}
   {rows.map(s=><option key={s.id} value={s.id}>{label(s)}</option>)}
  </Select>
  <ReadState loading={catalog.loading||!!selected&&detail.loading} error={catalog.error||detail.error} retry={retry}/>
  {catalog.data&&<div className="pagination"><span>{catalog.data.meta.total} sekolah · halaman {Math.floor(offset/25)+1}</span><div>
   <Button variant="ghost" disabled={catalog.loading||offset===0} onClick={()=>setOffset(Math.max(0,offset-25))} aria-label="Halaman sekolah sebelumnya">Sebelumnya</Button>
   <Button variant="ghost" disabled={catalog.loading||offset+25>=catalog.data.meta.total} onClick={()=>setOffset(offset+25)} aria-label="Halaman sekolah berikutnya">Berikutnya</Button>
  </div></div>}
 </div>;
}
