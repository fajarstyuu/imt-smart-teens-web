/** Build a complete, revision-pinned review from real admin reads; never a single catalog page. */
import {adminApi} from './admin';
import type {BankEditor,LessonEditor,PathEditor,QuestionEditor} from './dto';
export interface ReleaseReview {path:PathEditor;lessons:LessonEditor[];banks:{bank:BankEditor;questions:QuestionEditor[]}[];issues:string[]}
async function allQuestions(bank:string):Promise<QuestionEditor[]>{
 const rows:QuestionEditor[]=[];let expected:number|undefined;
 for(let offset=0;;){
  const page=await adminApi.questions(bank,'',offset);
  if(page.meta.offset!==offset||page.meta.limit<1||(expected!==undefined&&page.meta.total!==expected))throw Error('Daftar soal berubah. Muat ulang tinjauan.');
  expected=page.meta.total;rows.push(...page.data);
  if(rows.length>=expected)break;
  if(!page.data.length)throw Error('Daftar soal belum lengkap. Muat ulang tinjauan.');
  offset+=page.meta.limit;
 }
 if(rows.length!==expected||new Set(rows.map(q=>q.id)).size!==rows.length)throw Error('Daftar soal berubah. Muat ulang tinjauan.');
 return rows.filter(q=>q.state!=='archived');
}
export async function loadReleaseReview():Promise<ReleaseReview>{
 const path=await adminApi.path();const catalog=await adminApi.banks();
 const lessons:LessonEditor[]=[];
 for(const id of path.lesson_ids)lessons.push(await adminApi.lesson(id));
 const banks=[];const issues:string[]=[];
 if(!lessons.length)issues.push('Tambahkan minimal satu materi sebelum menerbitkan.');
 for(const lesson of lessons){if(lesson.state==='archived'||!lesson.draft.title.trim()||!lesson.draft.sections.length||lesson.draft.sections.some(s=>!s.title.trim()||!s.body.trim()))issues.push(`Lengkapi isi materi: ${lesson.draft.title||'Tanpa judul'}.`);}
 for(const [id,kind] of [[path.paired_bank_id,'paired'],[path.quiz_bank_id,'quiz']] as const){
  const bank=catalog.data.find(b=>b.id===id&&b.kind===kind);
  if(!bank)throw Error('Konfigurasi bank soal belum lengkap.');
  const questions=await allQuestions(id);const label=kind==='paired'?'Pre-test & post-test':'Quiz';
  if(!questions.length)issues.push(`Tambahkan minimal satu soal ${label}.`);
  const positions=new Set<number>();
  for(const q of questions){const d=q.draft;const optionIds=new Set(d.options.map(o=>o.id));if(!d.text.trim()||d.options.length<2||d.options.some(o=>!o.text.trim())||!d.correct_option_ids.length||d.correct_option_ids.some(id=>!optionIds.has(id))||(d.type==='single'&&d.correct_option_ids.length!==1)||q.position<1||positions.has(q.position))issues.push(`Periksa soal ${label} urutan ${q.position}.`);positions.add(q.position);}
  banks.push({bank,questions});
 }
 return {path,lessons,banks,issues};
}
export function reviewedCommand(review:ReleaseReview){return {expected_revision:review.path.revision,lessons:review.lessons.map(l=>({id:l.id,expected_revision:l.revision})),banks:review.banks.map(({bank})=>({id:bank.id,expected_revision:bank.revision}))};}
