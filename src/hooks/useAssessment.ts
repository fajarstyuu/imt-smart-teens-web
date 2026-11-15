import { useEffect, useState } from 'react';
import type { AssessmentType, Attempt } from '../domain/types';
import { useApp } from './useApp';
export function useAssessment(type:AssessmentType) {
  const {services,setStudent}=useApp();const [attempt,setAttempt]=useState<Attempt|null>(null);const [draft,setDraft]=useState<Record<string,string[]>>({});const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState('');const [failed,setFailed]=useState<string|null>(null);const [status,setStatus]=useState('');
  const load=async()=>{setLoading(true);setError('');try{const a=await services.student.attempt(type);setAttempt(a);setDraft(Object.fromEntries(Object.entries(a.answers).map(([id,a])=>[id,a.value])));}catch(e){setError((e as Error).message);}finally{setLoading(false);}};
  useEffect(()=>{void load();},[type]);
  const save=async(questionId:string,value:string[])=>{if(saving||!attempt)return;const q=attempt.questions.find(q=>q.id===questionId)!;setDraft(d=>({...d,[questionId]:value}));setSaving(true);setError('');setStatus('Menyimpan jawaban…');try{const s=await services.student.saveAnswer(type,questionId,q.version,value);setStudent(s);setAttempt(s.attempts[type]!);setFailed(null);setStatus('Jawaban tersimpan');}catch(e){setError((e as Error).message);setFailed(questionId);setStatus('Jawaban belum tersimpan');}finally{setSaving(false);}};
  return {attempt,draft,loading,saving,error,failed,status,load,save,retry:()=>{if(failed)void save(failed,draft[failed]);},setAttempt};
}
