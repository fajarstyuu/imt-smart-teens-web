/** Completed student projection: public selections and server scores, never private answer keys. */
import {useEffect,useState} from 'react';
import {useApp} from '../hooks/useApp';
import {Button,ErrorState} from '../components/ui';
import {formatDate} from '../domain/learning';
import {http} from '../services/http';
import type {MeasurementDto,Progress,Profile} from '../services/dto';
export function SummaryPage({navigate}:{navigate:(p:string)=>void}){
 const {data}=useApp();const s=data.student!;const [summary,setSummary]=useState<(Profile&{scores:{pre_test:number;quiz:number;post_test:number};latest_measurement:MeasurementDto;progress:Progress})|null>(null),[error,setError]=useState('');
 const load=async()=>{try{setSummary(await http.get('/student/summary'));setError('');}catch(e){setError((e as Error).message);}};useEffect(()=>{void load();},[]);
 return <section className="summary-page"><span className="eyebrow">RANGKUMAN PEMBELAJARAN</span><h1>Perjalanan yang tuntas.</h1><p className="page-description">Terima kasih, {s.identity.name}. {s.identity.school} · {formatDate(s.identity.date)}</p>{error&&<ErrorState message={error} retry={()=>void load()}/>}<div className="summary-stats">{(['pre_test','quiz','post_test'] as const).map(type=><div className="od-stat" key={type}><span>{type==='pre_test'?'Pre-test':type==='post_test'?'Post-test':'Quiz'}</span><strong>{summary?.scores[type]??'—'}<small>/100</small></strong></div>)}</div>{summary&&<section><h2>Aktivitas pengukuran</h2><p>{summary.latest_measurement.weight_kg} kg · {summary.latest_measurement.height_cm} cm · IMT {summary.latest_measurement.bmi_display}</p></section>}<section><h2>Materi yang diselesaikan</h2>{s.lessons.map(l=><p key={l.id}>{l.title} · {l.completedAt?'Selesai':'—'}</p>)}</section><section className="answer-review"><h2>Jawaban pre-test & post-test</h2><p>Pilihan tersimpan pada versi asesmenmu. Kunci jawaban tidak ditampilkan.</p>{(['pre','post'] as const).map(type=><section key={type}><h3>{type==='pre'?'Pre-test':'Post-test'}</h3>{s.attempts[type]?.questions.map(q=><details key={q.id}><summary>{q.text}</summary><p>{q.options.filter(o=>s.attempts[type]?.answers[q.id]?.value.includes(o.id)).map(o=>o.text).join('; ')||'Tidak ada jawaban'}</p></details>)}</section>)}</section><Button onClick={()=>navigate('/materi')}>Buka kembali materi</Button></section>;
}
