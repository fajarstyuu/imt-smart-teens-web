import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,CheckCircle2} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {Button,ErrorState,LoadingState} from '../components/ui';
import type {LessonQuizView} from '../services/dto';

const WRONG='jawablah dengan benar untuk melanjutkan materi selanjutnya';
const committedNotice='Jawaban tersimpan, tetapi status terbaru belum dapat dimuat. Coba muat ulang; jawaban tidak akan dikirim ulang.';
export function LessonQuizPage({id,navigate}:{id:string;navigate:(path:string)=>void}){
 const {data,services,setStudent}=useApp();const enrollmentId=data.student?.enrollmentId??'';const lesson=data.student?.lessons.find(item=>item.id===id);
 const [quiz,setQuiz]=useState<LessonQuizView|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [selected,setSelected]=useState('');const [feedback,setFeedback]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const generation=useRef(0);
 useEffect(()=>{const request=++generation.current;let active=true;setQuiz(null);setSelected('');setFeedback('');setNotice('');setError('');setBusy(false);setLoading(true);
  services.student.lessonQuiz(id).then(view=>{if(!active||generation.current!==request)return;setQuiz(view);setFeedback(view.attempt_count>0&&!view.mastered?WRONG:'');}).catch(e=>{if(active&&generation.current===request)setError((e as Error).message);}).finally(()=>{if(active&&generation.current===request)setLoading(false);});
  return()=>{active=false;if(generation.current===request)generation.current++;};
 },[id,enrollmentId,services.student]);
 const reload=async()=>{const request=generation.current;setLoading(true);try{const view=await services.student.lessonQuiz(id);if(generation.current!==request)return;setQuiz(view);setSelected('');setFeedback(view.attempt_count>0&&!view.mastered?WRONG:'');setNotice('');}catch(e){if(generation.current===request)setError((e as Error).message);}finally{if(generation.current===request)setLoading(false);}};
 const submit=async()=>{if(!quiz||!selected||busy||quiz.mastered)return;const request=generation.current;const previousRevision=quiz.revision;const option=selected;setBusy(true);setError('');setNotice('');
  try{const result=await services.student.answerLessonQuiz(id,option,previousRevision);if(generation.current!==request)return;
   const acknowledged={...quiz,first_answer_option_id:result.first_answer_option_id,attempt_count:result.attempt_count,revision:result.revision,mastered:result.mastered};setQuiz(acknowledged);setSelected('');setFeedback(result.correct?'':(result.feedback||WRONG));
   try{const latest=await services.student.lessonQuiz(id);if(generation.current!==request)return;if(latest.revision>=result.revision){setQuiz(latest);setFeedback(latest.attempt_count>0&&!latest.mastered?WRONG:'');}else{setQuiz(acknowledged);setNotice(committedNotice);}}catch{setNotice(committedNotice);}
   if(result.mastered){try{setStudent(await services.student.refresh());}catch{setNotice(committedNotice);}}
  }catch(e){if(generation.current!==request)return;const message=(e as Error).message;setError(message);
   // A lost acknowledgement may hide a committed answer. Reconcile without erasing
   // the original failure; if revision advanced, never offer a blind duplicate.
   try{const latest=await services.student.lessonQuiz(id);if(generation.current!==request)return;setQuiz(latest);if(latest.revision>previousRevision){setSelected('');setFeedback(latest.attempt_count>0&&!latest.mastered?WRONG:'');setNotice(committedNotice);}else setFeedback(latest.attempt_count>0&&!latest.mastered?WRONG:'');}catch{/* preserve the uncertain request and the visible error */}
  }finally{if(generation.current===request)setBusy(false);}
 };
 const continueLearning=()=>{const s=data.student!;const index=s.lessons.findIndex(item=>item.id===id);const next=s.lessons[index+1];navigate(next?`/materi/${next.id}`:'/kalkulator');};
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
  {notice&&<p className="lesson-quiz-notice" role="status">{notice}<Button variant="ghost" busy={loading} onClick={()=>void reload()}>Muat ulang status</Button></p>}
  {quiz.attempt_count>0&&<p className="muted" aria-live="polite">Percobaan tercatat: {quiz.attempt_count}</p>}
  {!quiz.mastered&&<Button busy={busy} disabled={!selected||loading||!!notice} onClick={()=>void submit()}>Periksa jawaban</Button>}
  {quiz.mastered&&<div className="lesson-quiz-mastered" role="status"><CheckCircle2 aria-hidden="true"/><p>Jawaban benar. Materi berikutnya sudah terbuka.</p><Button forward onClick={continueLearning}>{lesson&&data.student!.lessons.at(-1)?.id!==id?'Lanjut ke materi berikutnya':'Lanjut ke kalkulator IMT'}</Button></div>}
 </section>;
}
