/** Bounded active-school catalog. The form stores the selected UUID, never its label. */
import {useEffect,useState} from 'react';
import {useApp} from '../hooks/useApp';
import {Button,ErrorState,Field} from './ui';
import type {PublicSchool} from '../services/dto';
import type {Page} from '../services/http';
export function SchoolPicker({value,onChange,error,disabled=false}:{value:string;onChange:(id:string)=>void;error?:string;disabled?:boolean}){
 const {services}=useApp();const [q,setQ]=useState(''),[offset,setOffset]=useState(0),[page,setPage]=useState<Page<PublicSchool>|null>(null),[failure,setFailure]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
 const [selected,setSelected]=useState<PublicSchool|null>(null);
 useEffect(()=>{let live=true;setBusy(true);setFailure('');services.student.schools(q,offset).then(result=>{if(live)setPage(result);}).catch(e=>{if(live){setFailure(e.message);setPage(null);}}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};},[q,offset,retry,services]);
 return <div className="od-stack"><Field id="school-search" label="Cari sekolah aktif" value={q} disabled={disabled} onChange={e=>{setQ(e.target.value);setOffset(0);}}/><div className="field od-field"><label htmlFor="school">Asal sekolah *</label><select id="school" value={value} disabled={disabled||busy} required aria-invalid={!!error} aria-describedby={error?'school-hint':undefined} onChange={e=>{const row=page?.data.find(x=>x.id===e.target.value);if(row)setSelected(row);onChange(e.target.value);}}><option value="">{busy?'Memuat sekolah…':'Pilih sekolah aktif'}</option>{selected&&!page?.data.some(x=>x.id===selected.id)&&<option value={selected.id}>{selected.name}</option>}{page?.data.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select>{error&&<span id="school-hint" className="field-error">{error}</span>}</div>{failure&&<ErrorState message={failure} retry={()=>setRetry(v=>v+1)}/>}<div className="pagination"><span>{page?`${page.meta.total} sekolah aktif`:'Katalog sekolah'}</span><div><Button variant="ghost" disabled={disabled||busy||offset===0} onClick={()=>setOffset(Math.max(0,offset-25))}>Sebelumnya</Button><Button variant="ghost" disabled={disabled||busy||!page||offset+25>=page.meta.total} onClick={()=>setOffset(offset+25)}>Berikutnya</Button></div></div></div>;
}
