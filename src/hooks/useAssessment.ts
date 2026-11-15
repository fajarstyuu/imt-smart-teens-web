/** Answer saves use answer revisions, not question publication versions. Drafts survive conflicts. */
import {useEffect,useState,useRef} from 'react';
import type {AssessmentType,Attempt} from '../domain/types';
import type {SavedAnswer} from '../services/dto';
import {ApiError} from '../services/http';
import {useApp} from './useApp';
export function useAssessment(type:AssessmentType){
 const {services}=useApp();const [attempt,setAttempt]=useState<Attempt|null>(null),[draft,setDraft]=useState<Record<string,string[]>>({}),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[failed,setFailed]=useState<string|null>(null),[status,setStatus]=useState('');
 const inFlight=useRef(false);
 const load=async()=>{setLoading(true);setError('');try{const a=await services.student.attempt(type);setAttempt(a);setDraft(Object.fromEntries(Object.entries(a.answers).map(([id,answer])=>[id,answer.value])));}catch(e){setError((e as Error).message);}finally{setLoading(false);}};
 useEffect(()=>{void load();},[type]);
 const apply=(answer:SavedAnswer)=>setAttempt(a=>a?{...a,answers:{...a.answers,[answer.snapshot_question_id]:{value:answer.option_ids,revision:answer.revision,savedAt:answer.saved_at??''}}}:a);
 const save=async(questionId:string,value:string[])=>{
  if(inFlight.current||!attempt)return;inFlight.current=true;setDraft(d=>({...d,[questionId]:value}));setSaving(true);setError('');setStatus('Menyimpan jawaban…');
  try{const answer=await services.student.saveAnswer(type,questionId,attempt.answers[questionId]?.revision??0,value);apply(answer);setFailed(null);setStatus('Jawaban tersimpan');}
  catch(e){if(e instanceof ApiError&&e.code==='ANSWER_REVISION_CONFLICT'){const details=e.details as {latest_answer:SavedAnswer};apply(details.latest_answer);setError('Jawaban diubah di tempat lain. Pilihanmu tetap tersimpan di formulir. Coba lagi untuk mengganti jawaban terbaru secara sengaja.');}else setError((e as Error).message);setFailed(questionId);setStatus('Jawaban belum tersimpan');}
  finally{inFlight.current=false;setSaving(false);}
 };
 return {attempt,draft,loading,saving,error,failed,status,load,save,retry:()=>{if(failed)void save(failed,draft[failed]);},setAttempt};
}
