import { useRef, useState } from 'react';
import { Calculator, Check, Ruler, Scale } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { Button, Field, ErrorState, ErrorSummary, useAction } from '../components/ui';
import { formatNumber } from '../domain/learning';
const parse=(v:string)=>{const text=v.trim().replace(',','.');return /^\d+(\.\d+)?$/.test(text)?Number(text):NaN;};
export function CalculatorPage({navigate}:{navigate:(p:string)=>void}) {
  const {data,services,setStudent}=useApp();const s=data.student!,m=s.measurement;const action=useAction();const formRef=useRef<HTMLFormElement>(null);const [weight,setWeight]=useState(m?String(m.weight):''),[height,setHeight]=useState(m?String(m.height):'');const [errors,setErrors]=useState<Record<string,string>>({});const final=!!s.attempts.post?.submittedAt;const dirty=!m||parse(weight)!==m.weight||parse(height)!==m.height;
  const calculate=()=>{
    // Read the submitted controls at the action boundary so a blur validation
    // update cannot make a valid, just-edited value stale for this save.
    const formData=formRef.current?new FormData(formRef.current):null;
    const submittedWeight=parse(String(formData?.get('weight')??weight));
    const submittedHeight=parse(String(formData?.get('height')??height));
    const nextErrors={
      weight:!Number.isFinite(submittedWeight)||submittedWeight<=0?'Berat badan harus berupa angka positif, lebih besar dari nol.':'',
      height:!Number.isFinite(submittedHeight)||submittedHeight<=0?'Tinggi badan harus berupa angka positif, lebih besar dari nol.':''
    };
    setErrors(nextErrors);
    if(nextErrors.weight||nextErrors.height)return;
    setWeight(String(submittedWeight));setHeight(String(submittedHeight));
    void action.run(async()=>setStudent(await services.student.recordMeasurement(submittedWeight,submittedHeight)));
  };
  const changeWeight=(value:string)=>{setWeight(value);if(errors.weight){const parsed=parse(value);setErrors(current=>({...current,weight:Number.isFinite(parsed)&&parsed>0?'':'Berat badan harus berupa angka positif, lebih besar dari nol.'}));}};
  const changeHeight=(value:string)=>{setHeight(value);if(errors.height){const parsed=parse(value);setErrors(current=>({...current,height:Number.isFinite(parsed)&&parsed>0?'':'Tinggi badan harus berupa angka positif, lebih besar dari nol.'}));}};
  return <section className="calculator-page"><span className="eyebrow">PRAKTIK PENGUKURAN</span><h1>Kalkulator IMT</h1><p className="page-description">Gunakan hasil pengukuranmu untuk menghitung Indeks Massa Tubuh.</p><div className="calculator-grid"><div className="calculator-form"><div className="panel-heading"><Calculator className="od-icon"/><h2>Masukkan pengukuran</h2></div><form ref={formRef} onSubmit={e=>{e.preventDefault();calculate();}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();calculate();}}}><ErrorSummary errors={errors}/><Field id="weight" name="weight" label="Berat badan (kg)" inputMode="decimal" placeholder="Contoh: 45,5" value={weight} onChange={e=>changeWeight(e.target.value)} required error={errors.weight} disabled={final}/><Field id="height" name="height" label="Tinggi badan (cm)" inputMode="decimal" placeholder="Contoh: 155" value={height} onChange={e=>changeHeight(e.target.value)} required error={errors.height} disabled={final}/><p className="muted small">Gunakan koma atau titik untuk angka desimal.</p>{action.error&&<ErrorState message={action.error} retry={calculate}/>}<Button type="submit" busy={action.busy} disabled={final} className="full-width">{action.busy?'Menyimpan hasil…':'Hitung IMT'}</Button>{final&&<p className="muted small">Pembelajaran selesai. Hasil pengukuran tersimpan dan tidak dapat diubah.</p>}</form></div><div className={`calculator-result ${m&&!dirty?'calculator-result--ready':''}`} aria-live="polite">{m&&!dirty?<><span className="eyebrow">HASIL PERHITUNGANMU</span><div className="bmi-number">{m.bmiDisplay}<span>kg/m²</span></div><div className="measurement-values"><span><Scale className="od-icon"/>{formatNumber(m.weight)} kg</span><span><Ruler className="od-icon"/>{formatNumber(m.height)} cm</span></div><span className="recorded-label"><Check className="od-icon"/>Hasil pengukuran tersimpan</span><Button variant="secondary" onClick={()=>navigate(final?'/ringkasan':'/post-test')} forward>{final?'Lihat ringkasan':'Lanjut ke post-test'}</Button></>:<><span className="result-icon"><Calculator className="od-icon"/></span><h2>{m?'Pengukuran diubah':'Hasil perhitungan'}</h2><p>{m?'Hitung dan simpan kembali untuk melanjutkan ke post-test.':'Isi berat dan tinggi badan, lalu pilih Hitung IMT untuk melihat hasilnya.'}</p></>}</div></div><div className="formula-note"><span className="eyebrow">CARA MENGHITUNG</span><p>IMT = berat badan (kg) ÷ tinggi badan (m)²</p><span>Hasil ditampilkan sebagai angka untuk kegiatan pembelajaran, tanpa kategori tubuh atau penilaian “ideal”.</span></div><section className="measurement-history"><h2>Riwayat pengukuran</h2>{s.measurements.map(row=><p key={row.id}>{row.createdAt} · {row.weight} kg / {row.height} cm · IMT {row.bmiDisplay}</p>)}</section></section>;
}
