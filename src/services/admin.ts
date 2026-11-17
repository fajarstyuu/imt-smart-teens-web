/** Admin-only commands. Bounded report reads never compose a private all-students bootstrap. */
import {http,query} from './http';
import type {School,LessonDraft,LessonEditor,QuestionDraft,QuestionEditor,BankEditor,PathEditor,StudentSummary,StudentResults,QuestionAnswer} from './dto';
type Filters=Record<string,string|number|undefined>;
export const adminApi={
 schools:(q='',status='active',offset=0)=>http.page<School>('/admin/schools'+query({q,status,limit:25,offset})),
 school:(id:string)=>http.get<School>(`/admin/schools/${id}`),
 saveSchool:(id:string|null,name:string,revision?:number)=>http.send<School>(id?`/admin/schools/${id}`:'/admin/schools',id?'PUT':'POST',id?{name,expected_revision:revision}:{name}),
 archiveSchool:(id:string,revision:number)=>http.send(`/admin/schools/${id}`+query({expected_revision:revision}),'DELETE'),
 lessons:(status='',offset=0)=>http.page<LessonEditor>('/admin/lessons'+query({status,limit:25,offset})),
 lesson:(id:string)=>http.get<LessonEditor>(`/admin/lessons/${id}`),
 saveLesson:(id:string|null,draft:LessonDraft,position:number,revision?:number)=>http.send<LessonEditor>(id?`/admin/lessons/${id}`:'/admin/lessons',id?'PUT':'POST',{...draft,position,...(id?{expected_revision:revision}:{})}),
 publishLesson:(id:string,revision:number)=>http.send<LessonEditor>(`/admin/lessons/${id}/publication`,'POST',{expected_revision:revision}),
 archiveLesson:(id:string,revision:number)=>http.send<LessonEditor>(`/admin/lessons/${id}/archive`,'POST',{expected_revision:revision}),
 path:()=>http.get<PathEditor>('/admin/learning-path'),
 release:(review:{expected_revision:number;lessons:{id:string;expected_revision:number}[];banks:{id:string;expected_revision:number}[]})=>http.send<PathEditor>('/admin/learning-path/release','POST',review),
 order:(ids:string[],revision:number)=>http.send<PathEditor>('/admin/learning-path/order','PUT',{lesson_ids:ids,expected_revision:revision}),
 publishPath:(revision:number)=>http.send<PathEditor>('/admin/learning-path/publication','POST',{expected_revision:revision}),
 banks:()=>http.page<BankEditor>('/admin/question-banks'),
 questions:(bank:string,status='',offset=0)=>http.page<QuestionEditor>(`/admin/question-banks/${bank}/questions`+query({status,limit:25,offset})),
 question:(bank:string,id:string)=>http.get<QuestionEditor>(`/admin/question-banks/${bank}/questions/${id}`),
 saveQuestion:(bank:string,id:string|null,draft:QuestionDraft,position:number,revision?:number)=>http.send<QuestionEditor>(`/admin/question-banks/${bank}/questions${id?'/'+id:''}`,id?'PUT':'POST',{...draft,position,...(id?{expected_revision:revision}:{})}),
 archiveQuestion:(bank:string,id:string,revision:number)=>http.send<QuestionEditor>(`/admin/question-banks/${bank}/questions/${id}/archive`,'POST',{expected_revision:revision}),
 publishBank:(bank:string,revision:number)=>http.send<BankEditor>(`/admin/question-banks/${bank}/publication`,'POST',{expected_revision:revision}),
 students:(filters:Filters,offset=0)=>http.page<StudentSummary>('/admin/students'+query({...filters,limit:25,offset})),
 results:(student:string,enrollment:string)=>http.get<StudentResults>(`/admin/students/${student}/results`+query({enrollment_id:enrollment})),
 answers:(attempt:string,offset=0)=>http.page<QuestionAnswer>(`/admin/attempts/${attempt}/answers`+query({limit:25,offset})),
 async questionAnswers(filters:Filters,offset=0){if(!filters.question_version_id)throw Error('Pilih versi pertanyaan terbit terlebih dahulu.');return http.page<QuestionAnswer>('/admin/reports/question-answers'+query({...filters,limit:25,offset}));}
};
