export class DomainError extends Error { constructor(message, status=400) { super(message); this.status=status; } }
export const ensure = (condition,message,status=400) => { if(!condition) throw new DomainError(message,status); };
export function decimal(value,label) { const text=String(value).trim().replace(',','.'); ensure(/^\d+(\.\d+)?$/.test(text),`${label} harus berupa angka positif. Gunakan koma atau titik untuk desimal.`);const n=Number(text);ensure(Number.isFinite(n)&&n>0,`${label} harus lebih besar dari nol.`);return n; }
export function calculateBMI(weight,height) {const w=decimal(weight,'Berat badan'),h=decimal(height,'Tinggi badan');const bmi=w/((h/100)**2);ensure(Number.isFinite(bmi)&&bmi>0,'Hasil pengukuran tidak dapat dihitung. Periksa kembali angka yang dimasukkan.');return {weight:w,height:h,bmi};}
export const stages = ['pre','lessons','quiz','calculator','post'];
export const complete = (s,stage) => stage==='lessons'?s.lessons.length>0&&s.lessons.every(l=>!!l.completedAt):stage==='calculator'?!!s.measurement:!!s.attempts[stage]?.submittedAt;
export const unlocked = (s,stage) => {const i=stages.indexOf(stage);return i>=0&&stages.slice(0,i).every(x=>complete(s,x));};
export const lessonAllowed = (s,id) => {const i=s.lessons.findIndex(l=>l.id===id);return !!s.attempts.pre?.submittedAt&&i>=0&&(i===0||!!s.lessons[i-1].completedAt);};
export function grade(attempt) {return Math.round(attempt.questions.filter(q=>{const selected=attempt.answers[q.id]?.value||[];return selected.length===q.correct.length&&selected.every(v=>q.correct.includes(v));}).length/attempt.questions.length*100);}
export function publicStudent(s) {const result=structuredClone(s);for(const lesson of result.lessons) {if(!lessonAllowed(s,lesson.id)){lesson.sections=[];lesson.description='';}}for(const [type,attempt] of Object.entries(result.attempts)) {const reveal=type==='quiz'?!!attempt.submittedAt:!!s.attempts.post?.submittedAt;if(!reveal)delete attempt.score;for(const q of attempt.questions){if(!reveal)delete q.correct;}if(!reveal)delete attempt.results;}return result;}
export const progress = s => Math.round(stages.filter(x=>complete(s,x)).length/stages.length*100);
export const clone = value => structuredClone(value);
