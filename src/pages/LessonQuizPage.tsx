/** Student-owned lesson quiz: reconcile immutable attempts with route progress before offering continuation. */
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,CheckCircle2} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {useUnsaved} from '../hooks/useUnsaved';
import {lessonUnlocked,stageUnlocked} from '../domain/learning';
import {Button,ErrorState,LoadingState} from '../components/ui';
import type {Student} from '../domain/types';
import type {LessonQuizView} from '../services/dto';

const WRONG='jawablah dengan benar untuk melanjutkan materi selanjutnya';
const committedNotice='Jawaban tersimpan, tetapi status terbaru belum dapat dimuat. Coba muat ulang; jawaban tidak akan dikirim ulang.';
const progressNotice='Jawaban tersimpan, tetapi progres belajar belum dapat diperbarui. Coba muat ulang status; jawaban tidak akan dikirim ulang.';

/** Keep a server-confirmed mastery even if an older cached projection arrives later. */
function newestQuiz(current:LessonQuizView|null,next:LessonQuizView):LessonQuizView{
 if(!current)return next;
 const newest=next.revision>=current.revision?next:current;
 return {...newest,mastered:current.mastered||next.mastered};
}

/** Route continuation is available only when the refreshed student projection unlocks it. */
function continuationUnlocked(student:Student,lessonId:string):boolean{
 const index=student.lessons.findIndex(lesson=>lesson.id===lessonId);
 if(index<0)return false;
 const next=student.lessons[index+1];
 return next?lessonUnlocked(student,next.id):stageUnlocked(student,'calculator');
}

export function LessonQuizPage({id,navigate}:{id:string;navigate:(path:string)=>void}){
 const {data,services,setStudent,loading:appLoading}=useApp();
 const enrollmentId=data.student?.enrollmentId??'';
 const studentId=data.student?.id??'';
 const lesson=data.student?.lessons.find(item=>item.id===id);
 const [quiz,setQuiz]=useState<LessonQuizView|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [selected,setSelected]=useState('');
 const [feedback,setFeedback]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const [uncertain,setUncertain]=useState(false);
 const [projectionReady,setProjectionReady]=useState(false);
 const [projectionLoading,setProjectionLoading]=useState(false);
 const generation=useRef(0);
 const identity=useRef({studentId,enrollmentId});
 const quizRef=useRef<LessonQuizView|null>(null);
 identity.current={studentId,enrollmentId};
 const useCurrentRequest=(request:number)=>generation.current===request
  &&identity.current.studentId===studentId&&identity.current.enrollmentId===enrollmentId;
 const storeQuiz=(next:LessonQuizView)=>{quizRef.current=next;setQuiz(next);};

 // A selected draft, an in-flight answer, or an unconfirmed write owns navigation.
 useUnsaved(Boolean(selected)||busy||uncertain);

 /** Refresh the actual same-enrollment student projection before promising a route unlock. */
 const reconcileProgress=async(request:number)=>{
  setProjectionReady(false);setProjectionLoading(true);setNotice('');
  try{
   const refreshed=await services.student.refresh();
   if(!useCurrentRequest(request))return;
   if(refreshed.id!==studentId||refreshed.enrollmentId!==enrollmentId)throw new Error('Sesi siswa berubah. Muat ulang sesi sebelum melanjutkan.');
   setStudent(refreshed);
   if(!continuationUnlocked(refreshed,id)){
    setNotice('Jawaban tersimpan, tetapi progres materi berikutnya belum terbuka. Coba muat ulang status.');
    return;
   }
   setProjectionReady(true);setError('');setNotice('');
  }catch{
   if(!useCurrentRequest(request))return;
   setError('');setNotice(progressNotice);
  }finally{if(useCurrentRequest(request))setProjectionLoading(false);}
 };

 /** Adopt a current quiz read and reconcile mastery without trusting stale route state. */
 const adoptQuiz=async(view:LessonQuizView,request:number)=>{
  if(!useCurrentRequest(request))return;
  const next=newestQuiz(quizRef.current,view);storeQuiz(next);
  setSelected('');setUncertain(false);setFeedback(next.attempt_count>0&&!next.mastered?WRONG:'');
  if(next.mastered){setError('');await reconcileProgress(request);}
  else{setProjectionReady(false);setNotice('');}
 };

 const hasStudent=Boolean(data.student);
 useEffect(()=>{
  if(appLoading||!hasStudent){setLoading(false);return;}
  const request=++generation.current;
  quizRef.current=null;setQuiz(null);setSelected('');setFeedback('');setNotice('');setError('');setBusy(false);setUncertain(false);setProjectionReady(false);setProjectionLoading(false);setLoading(true);
  const load=async()=>{
   try{const view=await services.student.lessonQuiz(id);if(!useCurrentRequest(request))return;await adoptQuiz(view,request);}
   catch(e){if(useCurrentRequest(request))setError((e as Error).message);}
   finally{if(useCurrentRequest(request))setLoading(false);}
  };
  void load();
  return()=>{if(generation.current===request)generation.current++;};
 },[id,enrollmentId,studentId,hasStudent,appLoading,services.student]);

 const reload=async()=>{
  const request=generation.current;setLoading(true);
  try{const view=await services.student.lessonQuiz(id);if(!useCurrentRequest(request))return;await adoptQuiz(view,request);}
  catch(e){if(useCurrentRequest(request))setError((e as Error).message);}
  finally{if(useCurrentRequest(request))setLoading(false);}
 };

 const submit=async()=>{
  const current=quizRef.current;
  if(!current||!selected||busy||current.mastered||notice)return;
  const request=generation.current,previousRevision=current.revision,option=selected;
  setBusy(true);setError('');setNotice('');setUncertain(false);
  try{
   const result=await services.student.answerLessonQuiz(id,option,previousRevision);
   if(!useCurrentRequest(request))return;
   const acknowledged:LessonQuizView={...current,first_answer_option_id:result.first_answer_option_id,attempt_count:result.attempt_count,revision:result.revision,mastered:result.mastered};
   storeQuiz(acknowledged);setSelected('');setFeedback(result.correct?'':WRONG);
   let reconciled=acknowledged;
   try{
    const latest=await services.student.lessonQuiz(id);
    if(!useCurrentRequest(request))return;
    reconciled=newestQuiz(acknowledged,latest);storeQuiz(reconciled);
   }catch{/* A positive POST acknowledgement remains authoritative if this read fails. */}
   if(reconciled.mastered){setFeedback('');await reconcileProgress(request);}
   else if(result.correct){setProjectionReady(false);setNotice(committedNotice);setUncertain(true);}
   else{
    setFeedback(WRONG);setProjectionReady(false);
    if(reconciled.revision>previousRevision&&reconciled.revision!==result.revision){setNotice(committedNotice);}
   }
  }catch(e){
   if(!useCurrentRequest(request))return;
   setError((e as Error).message);
   // A lost acknowledgement can hide a commit. Read the same lesson before allowing a retry.
   try{
    const latest=await services.student.lessonQuiz(id);
    if(!useCurrentRequest(request))return;
    const reconciled=newestQuiz(quizRef.current,latest);storeQuiz(reconciled);
    if(latest.revision>previousRevision||latest.mastered){
     setSelected('');setUncertain(false);setError('');setFeedback(reconciled.mastered?'':(reconciled.attempt_count>0?WRONG:''));
     if(reconciled.mastered){await reconcileProgress(request);}
     else{setNotice(committedNotice);setProjectionReady(false);}
    }else{
     setUncertain(true);setFeedback(reconciled.attempt_count>0&&!reconciled.mastered?WRONG:'');
    }
   }catch{if(useCurrentRequest(request))setUncertain(true);}
  }finally{if(useCurrentRequest(request))setBusy(false);}
 };

 const continueLearning=()=>{
  const student=data.student;
  if(!student||student.id!==studentId||student.enrollmentId!==enrollmentId||!projectionReady||!continuationUnlocked(student,id))return;
  const index=student.lessons.findIndex(item=>item.id===id),next=student.lessons[index+1];
  navigate(next?`/materi/${next.id}`:'/kalkulator');
 };

 if(loading&&!quiz)return <LoadingState label="Menyiapkan kuis materi…"/>;
 if(error&&!quiz)return <section className="lesson-quiz"><Button variant="ghost" onClick={()=>navigate('/materi')}><ArrowLeft aria-hidden="true"/>Kembali ke materi</Button><ErrorState message={error} retry={()=>void reload()}/></section>;
 if(!quiz)return null;
 return <section className="lesson-quiz" aria-labelledby="lesson-quiz-title">
  <Button variant="ghost" onClick={()=>navigate(`/materi/${id}`)}><ArrowLeft aria-hidden="true"/>Kembali membaca</Button>
  <span className="eyebrow">PEMAHAMAN MATERI</span><h1 id="lesson-quiz-title">{lesson?.title??'Kuis materi'}</h1>
  <p className="muted">Jawab satu pertanyaan dengan memilih A atau B. Kamu bisa mencoba lagi sampai benar.</p>
  {error&&<ErrorState message={error} retry={()=>void reload()}/>}
  <fieldset className="lesson-quiz-options" disabled={busy||quiz.mastered||!!notice}>
   <legend>{quiz.question}</legend>
   {quiz.options.map((option,index)=><label className="lesson-quiz-option" key={option.id}><input type="radio" name="lesson-quiz-answer" value={option.id} checked={selected===option.id} onChange={()=>setSelected(option.id)}/><span><b>{String.fromCharCode(65+index)}.</b> {option.text}</span></label>)}
  </fieldset>
  {feedback===WRONG&&<p className="lesson-quiz-feedback" role="alert" aria-live="assertive">{WRONG}</p>}
  {notice&&<p className="lesson-quiz-notice" role="status">{notice}<Button variant="ghost" busy={loading||busy} disabled={loading||busy} onClick={()=>void reload()}>Muat ulang status</Button></p>}
  {quiz.mastered&&!projectionReady&&!notice&&<p className="lesson-quiz-notice" role="status">{projectionLoading?'Memeriksa progres belajar…':'Progres belajar belum siap.'}</p>}
  {quiz.attempt_count>0&&<p className="muted" aria-live="polite">Percobaan tercatat: {quiz.attempt_count}</p>}
  {!quiz.mastered&&<Button busy={busy} disabled={!selected||loading||!!notice} onClick={()=>void submit()}>Periksa jawaban</Button>}
  {quiz.mastered&&!projectionReady&&!projectionLoading&&!notice&&<Button variant="ghost" disabled={loading||busy} onClick={()=>void reload()}>Muat ulang status</Button>}
  {quiz.mastered&&projectionReady&&<div className="lesson-quiz-mastered" role="status"><CheckCircle2 aria-hidden="true"/><p>Jawaban benar. Materi berikutnya sudah terbuka.</p><Button forward onClick={continueLearning}>{lesson&&data.student!.lessons.at(-1)?.id!==id?'Lanjut ke materi berikutnya':'Lanjut ke kalkulator IMT'}</Button></div>}
 </section>;
}