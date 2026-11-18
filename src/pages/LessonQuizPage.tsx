import {useEffect,useState} from 'react';
import {ArrowLeft,CheckCircle2} from 'lucide-react';
import {useApp} from '../hooks/useApp';
import {Button,ErrorState,LoadingState} from '../components/ui';
import type {LessonQuizView} from '../services/dto';

const WRONG='jawablah dengan benar untuk melanjutkan materi selanjutnya';
export function LessonQuizPage({id,navigate}:{id:string;navigate:(path:string)=>void}){
 const {data,services,setStudent}=useApp();const [quiz,setQuiz]=useState<LessonQuizView|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [feedback,setFeedback]=useState('');const [busy,setBusy]=useState(false);
 const lesson=data.student?.lessons.find(item=>item.id===id);
 const load=async()=>{setLoading(true);setError('');try{setQuiz(await services.student.lessonQuiz(id));}catch(e){setError((e as Error).message);}finally{setLoading(false);}};
 useEffect(()=>{void load();},[id]);
 const answer=async(optionId:string)=>{if(!quiz||busy||quiz.mastered)return;setBusy(true);setError('');try{const result=await services.student.answerLessonQuiz(id,optionId,quiz.revision);setQuiz(await services.student.lessonQuiz(id));setFeedback(result.correct?'':WRONG);if(result.mastered){setFeedback('');setStudent(await services.student.refresh());}}catch(e){setError((e as Error).message);await load();}finally{setBusy(false);}};
 const continueLearning=()=>{const s=data.student!;const index=s.lessons.findIndex(item=>item.id===id);const next=s.lessons[index+1];navigate(next?`/materi/${next.id}`:'/kalkulator');};
 if(loading)return <LoadingState label="Menyiapkan kuis materi…"/>;
 if(error&&!quiz)return <section className="lesson-quiz"><Button variant="ghost" onClick={()=>navigate('/materi')}><ArrowLeft aria-hidden="true"/>Kembali ke materi</Button><ErrorState message={error} retry={()=>void load()}/></section>;
 if(!quiz)return null;
 return <section className="lesson-quiz" aria-labelledby="lesson-quiz-title">
  <Button variant="ghost" onClick={()=>navigate(`/materi/${id}`)}><ArrowLeft aria-hidden="true"/>Kembali membaca</Button>
  <span className="eyebrow">PEMAHAMAN MATERI</span><h1 id="lesson-quiz-title">{lesson?.title??'Kuis materi'}</h1>
  <p className="muted">Jawab satu pertanyaan dengan memilih A atau B. Kamu bisa mencoba lagi sampai benar.</p>
  {error&&<ErrorState message={error} retry={()=>void load()}/>}
  <fieldset className="lesson-quiz-options" disabled={busy||quiz.mastered}>
   <legend>{quiz.question.text}</legend>
   {quiz.options.map((option,index)=><label className="lesson-quiz-option" key={option.id}><input type="radio" name="lesson-quiz-answer" checked={quiz.first_answer_option_id===option.id&&quiz.mastered} onChange={()=>void answer(option.id)}/><span><b>{String.fromCharCode(65+index)}.</b> {option.text}</span></label>)}
  </fieldset>
  {feedback===WRONG&&<p className="lesson-quiz-feedback" role="alert" aria-live="assertive">{WRONG}</p>}
  <p className="muted" aria-live="polite">{quiz.attempt_count?`Percobaan tercatat: ${quiz.attempt_count}`:'Belum ada jawaban tersimpan.'}</p>
  {quiz.mastered&&<div className="lesson-quiz-mastered" role="status"><CheckCircle2 aria-hidden="true"/><p>Jawaban benar. Materi berikutnya sudah terbuka.</p><Button forward onClick={continueLearning}>{lesson&&data.student!.lessons.at(-1)?.id!==id?'Lanjut ke materi berikutnya':'Lanjut ke kalkulator IMT'}</Button></div>}
 </section>;
}
