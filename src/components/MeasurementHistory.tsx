/** Current enrollment's bounded server measurement history, never a client BMI calculation. */
import {useState} from 'react';
import {useResource} from '../hooks/useResource';
import {http,query} from '../services/http';
import type {MeasurementDto} from '../services/dto';
import {Pager,ReadState} from './AdminControls';
export function MeasurementHistory({refreshKey}:{refreshKey?:string}){
 const [offset,setOffset]=useState(0);const model=useResource(()=>http.page<MeasurementDto>('/student/measurements'+query({limit:25,offset})),[refreshKey,offset]);
 return <section className="measurement-history"><h2>Riwayat pengukuran</h2><ReadState loading={model.loading} error={model.error} retry={model.reload}/>{model.data&&<>{model.data.data.map(row=><p key={row.id}>{row.created_at} · {row.weight_kg} kg / {row.height_cm} cm · IMT {row.bmi_display}</p>)}{!model.data.data.length&&<p>Belum ada pengukuran pada halaman ini.</p>}<Pager page={model.data} offset={offset} onChange={setOffset}/></>}</section>;
}
