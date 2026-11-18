import {afterEach,expect,test,vi} from 'vitest';
import {act,cleanup,render,screen,waitFor} from '@testing-library/react';
import {useState} from 'react';
import userEvent from '@testing-library/user-event';
import {BrowserRouter} from 'react-router-dom';
import {AppProvider,useApp} from '../src/hooks/useApp';
import {navigationAllowed} from '../src/hooks/useUnsaved';
import {LessonQuizPage} from '../src/pages/LessonQuizPage';
import type {AppServices} from '../src/services/contracts';
import type {LessonQuizView} from '../src/services/dto';
import type {Student} from '../src/domain/types';

afterEach(()=>{cleanup();vi.restoreAllMocks();window.history.replaceState({idx:0},'','/');});
const wrong='jawablah dengan benar untuk melanjutkan materi selanjutnya';
const view:LessonQuizView={lesson_id:'l1',lesson_version_id:'v1',question:'Pilih jawaban yang benar',options:[{id:'a',text:'A answer'},{id:'b',text:'B answer'}],first_answer_option_id:'a',attempt_count:1,revision:1,mastered:false};
const masteredView:LessonQuizView={...view,first_answer_option_id:'b',attempt_count:2,revision:2,mastered:true};
const studentFixture={id:'s',enrollmentId:'e1',identity:{name:'Siswa',school:'Sekolah',date:'2026-11-18'},createdAt:'now',lessons:[{id:'l1',title:'Lesson 1'},{id:'l2',title:'Lesson 2'}],attempts:{},measurements:[],serverProgress:{current_stage:'lessons',stages:[{id:'pre_test',status:'completed'},{id:'lessons',status:'in_progress'},{id:'calculator',status:'in_progress'}],lessons:[{lesson_id:'l1',status:'completed'},{lesson_id:'l2',status:'not_started'}]}} as unknown as Student;
const twoLessonStudent=(unlocked=false)=>({...studentFixture,lessons:[{id:'l1',title:'Lesson 1'},{id:'l2',title:'Lesson 2'}],serverProgress:{current_stage:'lessons',stages:[{id:'pre_test',status:'completed'},{id:'lessons',status:'in_progress'},{id:'calculator',status:'locked'}],lessons:[{lesson_id:'l1',status:'completed'},{lesson_id:'l2',status:unlocked?'not_started':'locked'}]}} as unknown as Student);
function mount(lessonQuiz=vi.fn().mockResolvedValue(view),answer=vi.fn(),refresh=vi.fn().mockResolvedValue(studentFixture),student=studentFixture,navigate=vi.fn()) {
 const services={bootstrap:async()=>({config:{brand:'Test',program:'Test',mode:'development'},student,teacher:null}),student:{lessonQuiz,answerLessonQuiz:answer,refresh}} as unknown as AppServices;
 render(<BrowserRouter><AppProvider services={services}><LessonQuizPage id="l1" navigate={navigate}/></AppProvider></BrowserRouter>);
 return {lessonQuiz,answer,refresh,navigate};
}
test('reload retains red retry feedback without selecting immutable first answer as if correct',async()=>{
 mount();expect((await screen.findByRole('alert')).textContent).toBe(wrong);
 expect((screen.getByLabelText('A. A answer') as HTMLInputElement).checked).toBe(false);
});
test('wrong selection is explicit, stays retryable and reports the exact feedback',async()=>{
 const answer=vi.fn().mockResolvedValue({correct:false,feedback:wrong,first_answer_option_id:'a',attempt_count:2,revision:2,mastered:false});let reads=0;const lessonQuiz=vi.fn(async()=>++reads<=1?view:{...view,attempt_count:2,revision:2});
 const user=userEvent.setup();mount(lessonQuiz,answer);await screen.findByText(view.question);
 await user.click(screen.getByLabelText('B. B answer'));expect(answer).not.toHaveBeenCalled();
 await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await waitForText(wrong);expect(answer).toHaveBeenCalledWith('l1','b',1);
});
test('correct retry clears the old wrong choice and never highlights the immutable first answer',async()=>{
 const answer=vi.fn().mockResolvedValue({correct:true,feedback:null,first_answer_option_id:'a',attempt_count:2,revision:2,mastered:true});let reads=0;const lessonQuiz=vi.fn(async()=>++reads<=1?view:{...view,attempt_count:2,revision:2,mastered:true});
 const user=userEvent.setup();mount(lessonQuiz,answer);await screen.findByText(view.question);
 await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await waitFor(()=>expect(screen.getByText('Jawaban benar. Materi berikutnya sudah terbuka.')).toBeTruthy());
 expect(screen.queryByRole('alert')).toBeNull();expect((screen.getByLabelText('A. A answer') as HTMLInputElement).checked).toBe(false);
});
test('a stale cached wrong response cannot regress server-confirmed mastery',async()=>{
 const answer=vi.fn().mockResolvedValue({correct:false,feedback:wrong,first_answer_option_id:'a',attempt_count:1,revision:1,mastered:false});let reads=0;
 const lessonQuiz=vi.fn(async()=>++reads<=1?view:{...view,attempt_count:2,revision:2,mastered:true});const user=userEvent.setup();mount(lessonQuiz,answer);
 await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await screen.findByText('Jawaban benar. Materi berikutnya sudah terbuka.');expect(screen.queryByRole('alert')).toBeNull();expect(answer).toHaveBeenCalledTimes(1);
});
test('failed submission remains visible after a successful projection read and retains selected retry',async()=>{
 const answer=vi.fn().mockRejectedValue(Error('network timeout'));const lessonQuiz=vi.fn().mockResolvedValue(view);const user=userEvent.setup();mount(lessonQuiz,answer);
 await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 expect((await screen.findByText('network timeout')).textContent).toBe('network timeout');expect((screen.getByLabelText('B. B answer') as HTMLInputElement).checked).toBe(true);expect(lessonQuiz).toHaveBeenCalledTimes(2);
});
test('committed answer with lost acknowledgement reconciles revision and disables duplicate retry',async()=>{
 const answer=vi.fn().mockRejectedValue(Error('acknowledgement lost'));let reads=0;const lessonQuiz=vi.fn(async()=>++reads<=1?view:{...view,attempt_count:2,revision:2});const user=userEvent.setup();mount(lessonQuiz,answer);
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
test('selected and pending quiz answers block navigation until the committed outcome is reconciled',async()=>{
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);let resolveAnswer!:(value:{correct:boolean;feedback:string|null;first_answer_option_id:string;attempt_count:number;revision:number;mastered:boolean})=>void;
 const answer=vi.fn(()=>new Promise<Awaited<ReturnType<typeof answer>> extends never?never:any>(resolve=>{resolveAnswer=resolve;}));const user=userEvent.setup();mount(vi.fn().mockResolvedValue(view),answer as never);
 await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));
 expect(navigationAllowed()).toBe(false);expect(confirm).toHaveBeenCalledTimes(1);
 await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));expect(answer).toHaveBeenCalledTimes(1);
 expect(navigationAllowed()).toBe(false);expect(confirm).toHaveBeenCalledTimes(2);
 resolveAnswer({correct:false,feedback:wrong,first_answer_option_id:'b',attempt_count:2,revision:2,mastered:false});
 await screen.findByRole('alert');await waitFor(()=>expect(navigationAllowed()).toBe(true));
 expect(confirm).toHaveBeenCalledTimes(2);
});
test('lost acknowledgement plus failed quiz reconciliation keeps the owner guard until deliberate discard',async()=>{
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);confirm.mockClear();let reads=0;const lessonQuiz=vi.fn(async()=>{reads++;if(reads>1)throw Error('reconciliation GET failed');return view;});const answer=vi.fn().mockRejectedValue(Error('acknowledgement lost'));const user=userEvent.setup();
 mount(lessonQuiz,answer);await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 expect(await screen.findByText('acknowledgement lost')).toBeTruthy();expect((screen.getByLabelText('B. B answer') as HTMLInputElement).checked).toBe(true);
 expect(navigationAllowed()).toBe(false);expect(confirm).toHaveBeenCalledTimes(1);confirm.mockReturnValue(true);confirm.mockClear();expect(navigationAllowed()).toBe(true);expect(confirm).toHaveBeenCalledTimes(1);
 cleanup();confirm.mockReturnValue(false);confirm.mockClear();expect(navigationAllowed()).toBe(true);expect(confirm).not.toHaveBeenCalled();
});
test('confirmed mastery releases quiz navigation ownership only after progress reconciliation',async()=>{
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);confirm.mockClear();let releaseRefresh!:(value:Student)=>void;const refresh=vi.fn(()=>new Promise<Student>(resolve=>{releaseRefresh=resolve;}));const answer=vi.fn().mockResolvedValue({correct:true,feedback:null,first_answer_option_id:'b',attempt_count:2,revision:2,mastered:true});const lessonQuiz=vi.fn().mockResolvedValueOnce(view).mockResolvedValueOnce({...view,first_answer_option_id:'a',attempt_count:2,revision:1,mastered:false});const user=userEvent.setup();
 mount(lessonQuiz,answer,refresh);await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));expect(navigationAllowed()).toBe(false);await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await waitFor(()=>expect(refresh).toHaveBeenCalledTimes(1));expect(screen.queryByText('Jawaban benar. Materi berikutnya sudah terbuka.')).toBeNull();expect(navigationAllowed()).toBe(false);confirm.mockClear();
 await act(async()=>{releaseRefresh(studentFixture);await Promise.resolve();});await screen.findByText('Jawaban benar. Materi berikutnya sudah terbuka.');expect(navigationAllowed()).toBe(true);expect(confirm).not.toHaveBeenCalled();
});
test('lost correct acknowledgement reconciles mastered GET and retries failed student progress before continuation',async()=>{
 let reads=0;const lessonQuiz=vi.fn(async()=>++reads<=1?view:masteredView);const answer=vi.fn().mockRejectedValue(Error('malformed acknowledgement body'));let refreshCalls=0;const fresh=twoLessonStudent(true);const refresh=vi.fn(async()=>{refreshCalls++;if(refreshCalls===1)throw Error('student progress unavailable');return fresh;});const navigate=vi.fn();const user=userEvent.setup();
 mount(lessonQuiz,answer,refresh,twoLessonStudent(false),navigate);await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await screen.findByRole('button',{name:'Muat ulang status'});expect(answer).toHaveBeenCalledTimes(1);expect(refresh).toHaveBeenCalledTimes(1);expect(screen.queryByText('Jawaban benar. Materi berikutnya sudah terbuka.')).toBeNull();expect(screen.queryByRole('button',{name:'Lanjut ke materi berikutnya'})).toBeNull();
 await user.click(screen.getByRole('button',{name:'Muat ulang status'}));await screen.findByText('Jawaban benar. Materi berikutnya sudah terbuka.');expect(refresh).toHaveBeenCalledTimes(2);expect(answer).toHaveBeenCalledTimes(1);
 await user.click(screen.getByRole('button',{name:'Lanjut ke materi berikutnya'}));expect(navigate).toHaveBeenCalledWith('/materi/l2');expect(answer).toHaveBeenCalledTimes(1);
});
test('a newer mastered GET after a stale wrong replay refreshes the current student projection',async()=>{
 let reads=0;const lessonQuiz=vi.fn(async()=>++reads<=1?view:{...masteredView,revision:3});const answer=vi.fn().mockResolvedValue({correct:false,feedback:wrong,first_answer_option_id:'a',attempt_count:2,revision:2,mastered:false});const refresh=vi.fn().mockResolvedValue(twoLessonStudent(true));const user=userEvent.setup();
 mount(lessonQuiz,answer,refresh,twoLessonStudent(false));await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));
 await screen.findByText('Jawaban benar. Materi berikutnya sudah terbuka.');expect(refresh).toHaveBeenCalledTimes(1);expect(answer).toHaveBeenCalledTimes(1);
});
test('an initially mastered quiz reconciles route progress before showing continuation',async()=>{
 const refresh=vi.fn().mockResolvedValue(twoLessonStudent(true));mount(vi.fn().mockResolvedValue(masteredView),vi.fn(),refresh,twoLessonStudent(false));
 await screen.findByText('Jawaban benar. Materi berikutnya sudah terbuka.');expect(refresh).toHaveBeenCalledTimes(1);
});
test.each(['unmount','logout','enrollment change'] as const)('late progress refresh after %s cannot restore or overwrite student identity',async(action)=>{
 let resolveRefresh!:(value:Student)=>void,activeEnrollment='e1',reads=0;const refresh=vi.fn(()=>new Promise<Student>(resolve=>{resolveRefresh=resolve;}));const lessonQuiz=vi.fn(async()=>activeEnrollment==='e2'?view:++reads<=1?view:masteredView);const answer=vi.fn().mockResolvedValue({correct:true,feedback:null,first_answer_option_id:'b',attempt_count:2,revision:2,mastered:true});const user=userEvent.setup();
 const services={bootstrap:async()=>({config:{brand:'Test',program:'Test',mode:'development'},student:studentFixture,teacher:null}),student:{lessonQuiz,answerLessonQuiz:answer,refresh}} as unknown as AppServices;
 function OwnerHarness(){const {data,setStudent}=useApp();const [showQuiz,setShowQuiz]=useState(true);return <><output data-testid="student-owner">{data.student?`${data.student.identity.name}|${data.student.enrollmentId}`:'signed out'}</output><button onClick={()=>setShowQuiz(false)}>Unmount quiz</button><button onClick={()=>{setStudent(null);setShowQuiz(false);}}>Logout</button><button onClick={()=>{activeEnrollment='e2';setStudent({...studentFixture,enrollmentId:'e2',identity:{...studentFixture.identity,name:'Enrollment two'}});}}>Change enrollment</button>{showQuiz&&data.student&&<LessonQuizPage id="l1" navigate={()=>{}}/>}</>;}
 render(<BrowserRouter><AppProvider services={services}><OwnerHarness/></AppProvider></BrowserRouter>);await screen.findByText(view.question);await user.click(screen.getByLabelText('B. B answer'));await user.click(screen.getByRole('button',{name:'Periksa jawaban'}));await waitFor(()=>expect(refresh).toHaveBeenCalledTimes(1));
 if(action==='unmount')await user.click(screen.getByRole('button',{name:'Unmount quiz'}));else if(action==='logout')await user.click(screen.getByRole('button',{name:'Logout'}));else{await user.click(screen.getByRole('button',{name:'Change enrollment'}));await screen.findByText('Enrollment two|e2');}
 const stale={...studentFixture,identity:{...studentFixture.identity,name:'Late old refresh'}} as Student;await act(async()=>{resolveRefresh(stale);await Promise.resolve();});
 if(action==='logout')expect(screen.getByTestId('student-owner').textContent).toBe('signed out');else if(action==='unmount')expect(screen.getByTestId('student-owner').textContent).toBe('Siswa|e1');else expect(screen.getByTestId('student-owner').textContent).toBe('Enrollment two|e2');
});
async function waitForText(text:string){return screen.findByRole('alert').then(el=>expect(el.textContent).toBe(text));}
