import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {BrowserRouter} from 'react-router-dom';
import {AppProvider} from '../src/hooks/useApp';
import {LessonQuizPage} from '../src/pages/LessonQuizPage';
import type {AppServices} from '../src/services/contracts';
import type {LessonQuizView} from '../src/services/dto';
import type {Student} from '../src/domain/types';

afterEach(()=>{cleanup();vi.restoreAllMocks();window.history.replaceState({idx:0},'','/');});
const wrong='jawablah dengan benar untuk melanjutkan materi selanjutnya';
const view:LessonQuizView={lesson_id:'l1',lesson_version_id:'v1',question:'Pilih jawaban yang benar',options:[{id:'a',text:'A answer'},{id:'b',text:'B answer'}],first_answer_option_id:'a',attempt_count:1,revision:1,mastered:false};
const studentFixture={id:'s',enrollmentId:'e1',identity:{name:'Siswa',school:'Sekolah',date:'2026-11-18'},createdAt:'now',lessons:[{id:'l1',title:'Lesson 1'}],attempts:{},measurements:[],serverProgress:{current_stage:'lessons',stages:[{id:'pre_test',status:'completed'},{id:'lessons',status:'in_progress'}],lessons:[]}} as unknown as Student;
function mount(lessonQuiz=vi.fn().mockResolvedValue(view),answer=vi.fn(),refresh=vi.fn().mockResolvedValue(studentFixture)) {
 const student=studentFixture;
 const services={bootstrap:async()=>({config:{brand:'Test',program:'Test',mode:'development'},student,teacher:null}),student:{lessonQuiz,answerLessonQuiz:answer,refresh}} as unknown as AppServices;
 render(<BrowserRouter><AppProvider services={services}><LessonQuizPage id="l1" navigate={()=>{}}/></AppProvider></BrowserRouter>);
 return {lessonQuiz,answer,refresh};
}
test('reload retains red retry feedback without selecting immutable first answer as if correct',async()=>{
 mount();expect((await screen.findByRole('alert')).textContent).toBe(wrong);
 expect((screen.getByLabelText('A. A answer') as HTMLInputElement).checked).toBe(false);
});
test('wrong selection is explicit, stays retryable and reports the exact feedback',async()=>{
 const answer=vi.fn().mockResolvedValue({correct:false,feedback:wrong,first_answer_option_id:'a',attempt_count:2,revision:2,mastered:false});let reads=0;const lessonQuiz=vi.fn(async()=>++reads<=2?view:{...view,attempt_count:2,revision:2});
 const user=userEvent.setup();mount(lessonQuiz,answer);await screen.findByText(view.question);
 await user.click(screen.getByLabelText('B. B answer'));expect(answer).not.toHaveBeenCalled();
 await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await waitForText(wrong);expect(answer).toHaveBeenCalledWith('l1','b',1);
});
test('correct retry clears the old wrong choice and never highlights the immutable first answer',async()=>{
 const answer=vi.fn().mockResolvedValue({correct:true,feedback:null,first_answer_option_id:'a',attempt_count:2,revision:2,mastered:true});let reads=0;const lessonQuiz=vi.fn(async()=>++reads<=2?view:{...view,attempt_count:2,revision:2,mastered:true});
 const user=userEvent.setup();mount(lessonQuiz,answer);await screen.findByText(view.question);
 await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await waitFor(()=>expect(screen.getByText('Jawaban benar. Materi berikutnya sudah terbuka.')).toBeTruthy());
 expect(screen.queryByRole('alert')).toBeNull();expect((screen.getByLabelText('A. A answer') as HTMLInputElement).checked).toBe(false);
});
test('a stale cached wrong response cannot regress server-confirmed mastery',async()=>{
 const answer=vi.fn().mockResolvedValue({correct:false,feedback:wrong,first_answer_option_id:'a',attempt_count:1,revision:1,mastered:false});let reads=0;
 const lessonQuiz=vi.fn(async()=>++reads<=2?view:{...view,attempt_count:2,revision:2,mastered:true});const user=userEvent.setup();mount(lessonQuiz,answer);
 await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await screen.findByText('Jawaban benar. Materi berikutnya sudah terbuka.');expect(screen.queryByRole('alert')).toBeNull();expect(answer).toHaveBeenCalledTimes(1);
});
test('failed submission remains visible after a successful projection read and retains selected retry',async()=>{
 const answer=vi.fn().mockRejectedValue(Error('network timeout'));const lessonQuiz=vi.fn().mockResolvedValue(view);const user=userEvent.setup();mount(lessonQuiz,answer);
 await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 expect((await screen.findByText('network timeout')).textContent).toBe('network timeout');expect((screen.getByLabelText('B. B answer') as HTMLInputElement).checked).toBe(true);expect(lessonQuiz).toHaveBeenCalledTimes(3);
});
test('committed answer with lost acknowledgement reconciles revision and disables duplicate retry',async()=>{
 const answer=vi.fn().mockRejectedValue(Error('acknowledgement lost'));let reads=0;const lessonQuiz=vi.fn(async()=>++reads<=2?view:{...view,attempt_count:2,revision:2});const user=userEvent.setup();mount(lessonQuiz,answer);
 await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await screen.findByText(/Jawaban tersimpan/);expect(screen.getByRole('button',{name:'Periksa jawaban'})).toHaveProperty('disabled',true);expect(answer).toHaveBeenCalledTimes(1);
});
test('late quiz read from a previous lesson scope cannot replace current lesson content',async()=>{
 let resolveOld!:(value:LessonQuizView)=>void;const old=new Promise<LessonQuizView>(resolve=>{resolveOld=resolve;});
 const next={...view,lesson_id:'l2',question:'Lesson two'};const lessonQuiz=vi.fn((id:string)=>id==='l1'?old:Promise.resolve(next));
 const student={id:'s',enrollmentId:'e1',identity:{name:'Siswa',school:'Sekolah',date:'2026-11-18'},createdAt:'now',lessons:[],attempts:{},measurements:[],serverProgress:{current_stage:'lessons',stages:[],lessons:[]}} as unknown as Student;
 const services={bootstrap:async()=>({config:{brand:'Test',program:'Test',mode:'development'},student,teacher:null}),student:{lessonQuiz,answerLessonQuiz:vi.fn(),refresh:vi.fn()}} as unknown as AppServices;
 const result=render(<BrowserRouter><AppProvider services={services}><LessonQuizPage id="l1" navigate={()=>{}}/></AppProvider></BrowserRouter>);
 result.rerender(<BrowserRouter><AppProvider services={services}><LessonQuizPage id="l2" navigate={()=>{}}/></AppProvider></BrowserRouter>);
 await screen.findByText('Lesson two');resolveOld({...view,question:'Stale lesson one'});await new Promise(resolve=>setTimeout(resolve,0));
 expect(screen.getByText('Lesson two')).toBeTruthy();expect(screen.queryByText('Stale lesson one')).toBeNull();
});
async function waitForText(text:string){return screen.findByRole('alert').then(el=>expect(el.textContent).toBe(text));}
