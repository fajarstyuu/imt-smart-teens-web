/** Real Rust adapter; owns role restoration and composes only the current student's public data. */
import type {AppServices} from './contracts';
import type {Student,AssessmentType} from '../domain/types';
import type {Admin,Profile,Progress,AttemptDto,LessonBody,MeasurementDto,SavedAnswer} from './dto';
import {http,ApiError,query} from './http';
import {EnrollmentOperation} from './enrollment';
import {OperationKeys} from './operations';
import {kind,attemptModel,studentModel} from './mapping';
// Storage failure is surfaced at mutation time, not replaced by unsafe new operations.
const storage={getItem:(k:string)=>sessionStorage.getItem(k),setItem:(k:string,v:string)=>sessionStorage.setItem(k,v),removeItem:(k:string)=>sessionStorage.removeItem(k)};
const enrollment=new EnrollmentOperation(storage),operations=new OperationKeys(storage);
let current:Student|null=null;
const config={brand:'Imt Smart Teens',program:'Pembelajaran gizi siswa',mode:'development' as const};
async function optional<T>(load:()=>Promise<T>):Promise<T|null>{try{return await load();}catch(e){if(e instanceof ApiError&&e.status===401)return null;throw e;}}
async function compose(profile?:Profile):Promise<Student>{
 const me=profile??await http.get<Profile>('/student/me');
 const p=await http.get<Progress>('/student/progress');
 const attempts:Student['attempts']={};
 for(const type of ['pre','quiz','post'] as const){const id=p.active_attempt_ids[kind[type]]??(current?.enrollmentId===me.enrollment.id?current.attempts[type]?.id:undefined);if(id)attempts[type]=attemptModel(await http.get<AttemptDto>(`/student/attempts/${id}`),type);}
 const measurements=p.latest_measurement_id?(await http.page<MeasurementDto>('/student/measurements?limit=25&offset=0')).data:[];
 const next=studentModel(me,p,attempts,measurements);
 // Keep already fetched permitted lesson bodies only within the same pinned enrollment.
 if(current?.enrollmentId===next.enrollmentId)next.lessons=next.lessons.map(l=>{const previous=current!.lessons.find(x=>x.id===l.id);return previous?{...l,sections:previous.sections,visited:previous.visited,description:previous.description}:l;});
 current=next;return next;
}
const need=()=>{if(!current)throw new ApiError('Sesi siswa tidak tersedia.',401,'UNAUTHORIZED');return current;};
export const api:AppServices={
 async bootstrap(){
  const [profile,admin]=await Promise.all([optional(()=>http.get<Profile>('/student/me')),optional(()=>http.get<{admin:Admin}>('/admin/me'))]);
  if(profile)enrollment.recovered();
  // A fresh CSRF GET cannot prove that an expired enrollment-context cookie survived.
  if(!enrollment.pending()&&!enrollment.isBlocked())await http.csrf();
  current=profile?await compose(profile):null;
  return {config,student:current,teacher:admin?.admin??null};
 },
 student:{
  async register(identity){
   if(!http.token()&&!enrollment.pending())await http.csrf();
   await enrollment.run(identity,http.token(),async(form,key,csrf)=>{
    const response=await http.send<Profile&{csrf_token:string}>('/student/sessions','POST',{name:form.name,school_id:form.school,form_date:form.date},key,csrf);
    http.rotate(response.csrf_token);return response;
   });return compose();
  },
  async signOut(){await http.send('/student/sessions/current','DELETE');current=null;},
  refresh:()=>compose(),
  async attempt(type){const s=need();let id=s.serverProgress.active_attempt_ids[kind[type]];
   if(!id){const payload={assessment_type:kind[type]};const created=await operations.run(`${s.enrollmentId}:attempt:${type}`,payload,key=>http.send<{attempt_id:string}>('/student/attempts','POST',payload,key));id=created.attempt_id;}
   const a=attemptModel(await http.get<AttemptDto>(`/student/attempts/${id}`),type);s.attempts[type]=a;return a;
  },
  saveAnswer(type,questionId,revision,value){const id=need().attempts[type]?.id;if(!id)throw Error('Muat asesmen terlebih dahulu.');return http.send<SavedAnswer>(`/student/attempts/${id}/answers/${questionId}`,'PUT',{option_ids:value,expected_revision:revision});},
  async submit(type){const s=need(),id=s.attempts[type]!.id;await operations.run(`${s.enrollmentId}:submit:${id}`,{},key=>http.send(`/student/attempts/${id}/submission`,'POST',{},key));return compose();},
  async loadLesson(id){const detail=await http.get<LessonBody>(`/student/lessons/${id}`);const s=need();s.lessons=s.lessons.map(l=>l.id===id?{...l,description:detail.description,sections:detail.sections,visited:detail.visited_section_ids}:l);return {...s};},
  async visitLesson(id,sectionId){const result=await http.send<{visited_section_ids:string[];opened_at:string}>(`/student/lessons/${id}/opened`,'POST',sectionId?{section_id:sectionId}:{});const s=need();s.lessons=s.lessons.map(l=>l.id===id?{...l,visited:result.visited_section_ids,openedAt:result.opened_at}:l);return {...s};},
  async completeLesson(id){await http.send(`/student/lessons/${id}/completion`,'POST',{});return compose();},
  async recordMeasurement(weight,height){const s=need(),payload={weight_kg:weight,height_cm:height};return operations.run(`${s.enrollmentId}:measurement`,payload,async key=>{await http.send('/student/measurements','POST',payload,key);return compose();});},
  schools:(q,offset=0)=>http.page('/schools'+query({q,limit:25,offset})),
  pendingEnrollment:()=>enrollment.pending(),enrollmentBlocked:()=>enrollment.isBlocked()
 },
 teacher:{
  async signIn(email,password){if(enrollment.pending())throw Error('Selesaikan pemulihan pendaftaran siswa sebelum mengganti konteks autentikasi.');if(!http.token())await http.csrf();const result=await http.send<{admin:Admin;csrf_token:string}>('/admin/sessions','POST',{email,password});http.rotate(result.csrf_token);return result.admin;},
  async signOut(){await http.send('/admin/sessions/current','DELETE');}
 }
};
