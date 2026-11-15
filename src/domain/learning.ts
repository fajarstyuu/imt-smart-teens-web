import type { Student, StageId } from './types';
export const stages: { id: StageId; label: string; path: string }[] = [
  { id: 'pre', label: 'Pre-test', path: '/pre-test' }, { id: 'lessons', label: 'Materi', path: '/materi' }, { id: 'quiz', label: 'Quiz', path: '/quiz' }, { id: 'calculator', label: 'Kalkulator IMT', path: '/kalkulator' }, { id: 'post', label: 'Post-test', path: '/post-test' }
];
export const stageComplete = (s: Student, id: StageId): boolean => id === 'lessons' ? s.lessons.length > 0 && s.lessons.every(l => !!l.completedAt) : id === 'calculator' ? !!s.measurement : !!s.attempts[id]?.submittedAt;
export function stageUnlocked(s: Student, id: StageId) { const i = stages.findIndex(x => x.id === id); return i <= 0 || stages.slice(0, i).every(x => stageComplete(s, x.id)); }
export const currentStage = (s: Student) => stages.find(x => !stageComplete(s, x.id)) || stages[stages.length - 1];
export const progress = (s: Student) => Math.round(stages.filter(x => stageComplete(s, x.id)).length / stages.length * 100);
export function lessonUnlocked(s: Student, id: string) { const i = s.lessons.findIndex(x => x.id === id); return !!s.attempts.pre?.submittedAt && i >= 0 && (i === 0 || !!s.lessons[i - 1].completedAt); }
export const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const formatDate = (s?: string) => s ? new Intl.DateTimeFormat('id-ID', {day:'numeric', month:'long', year:'numeric'}).format(new Date(s.length === 10 ? `${s}T12:00:00` : s)) : '—';
export const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', {maximumFractionDigits:1,minimumFractionDigits:1}).format(n);
