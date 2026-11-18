import type { Student, StageId } from './types';
export const stages: { id: StageId; label: string; path: string }[] = [
  { id: 'pre', label: 'Pre-test', path: '/pre-test' }, { id: 'lessons', label: 'Materi', path: '/materi' }, { id: 'calculator', label: 'Kalkulator IMT', path: '/kalkulator' }, { id: 'post', label: 'Post-test', path: '/post-test' }
];
// Stage/lock policy belongs to Rust. Presentation only maps its explicit statuses.
const wireStage={pre:'pre_test',lessons:'lessons',calculator:'calculator',post:'post_test'} as const;
export const stageComplete=(s:Student,id:StageId)=>s.serverProgress.stages.find(x=>x.id===wireStage[id])?.status==='completed';
export const stageUnlocked=(s:Student,id:StageId)=>{const status=s.serverProgress.stages.find(x=>x.id===wireStage[id])?.status;return !!status&&status!=='locked';};
export const currentStage=(s:Student)=>stages.find(x=>wireStage[x.id]===s.serverProgress.current_stage)||stages[stages.length-1];
export const progress=(s:Student)=>Math.round(stages.filter(x=>stageComplete(s,x.id)).length/stages.length*100);
export const lessonUnlocked=(s:Student,id:string)=>{const row=s.serverProgress.lessons.find(x=>x.lesson_id===id);return !!row&&row.status!=='locked';};
export const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const formatDate = (s?: string) => s ? new Intl.DateTimeFormat('id-ID', {day:'numeric', month:'long', year:'numeric'}).format(new Date(s.length === 10 ? `${s}T12:00:00` : s)) : '—';
export const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', {maximumFractionDigits:1,minimumFractionDigits:1}).format(n);
