import {afterEach,expect,test,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import {AppProvider} from '../src/hooks/useApp';
import {useAssessment} from '../src/hooks/useAssessment';
import {useNavigation} from '../src/hooks/useNavigation';
import {useUnsaved,navigationAllowed} from '../src/hooks/useUnsaved';
import {ApiError} from '../src/services/http';
import {LessonEditor} from '../src/components/ContentEditors';
import {adminApi} from '../src/services/admin';
import type {AppServices} from '../src/services/contracts';
import type {LessonEditor as LessonDto} from '../src/services/dto';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.clearAllMocks();window.history.replaceState({idx:0},'','/');});
const attempt={id:'attempt',type:'quiz',number:1,questions:[{id:'q',version:99,text:'Pertanyaan',type:'single',options:[{id:'choice',text:'Pilihan'}]}],answers:{}};
function Answers(){const a=useAssessment('quiz');const {navigate}=useNavigation();return <><input aria-label="Pilihan" type="checkbox" checked={!!a.draft.q?.includes('choice')} onChange={()=>void a.save('q',['choice'])}/><p>{a.error}</p><p>{a.status}</p><output data-testid="revision">{a.attempt?.answers.q?.revision??0}</output><button onClick={a.retry}>Coba lagi</button><button onClick={()=>navigate('/away')}>Menu</button></>;}
function mountAnswers(saveAnswer:AppServices['student']['saveAnswer']){window.history.replaceState({idx:0},'','/quiz');vi.spyOn(window,'scrollTo').mockImplementation(()=>{});const services={bootstrap:async()=>({config:{brand:'Test',program:'Test',mode:'development'},student:null,teacher:null}),student:{attempt:async()=>attempt,saveAnswer}} as unknown as AppServices;return render(<BrowserRouter><AppProvider services={services}><Routes><Route path="/quiz" element={<Answers/>}/><Route path="/away" element={<h1>Autre page</h1>}/></Routes></AppProvider></BrowserRouter>);}
test('failed revision-conflict answer survives canceled menu navigation and deliberate retry clears its guard',async()=>{
 const save=vi.fn().mockRejectedValueOnce(new ApiError('Konflik',409,'ANSWER_REVISION_CONFLICT',{latest_answer:{snapshot_question_id:'q',option_ids:[],revision:7,saved_at:null}})).mockResolvedValueOnce({snapshot_question_id:'q',option_ids:['choice'],revision:8,saved_at:'now'});
 mountAnswers(save);const user=userEvent.setup();await screen.findByLabelText('Pilihan');await user.click(screen.getByLabelText('Pilihan'));await screen.findByText(/Jawaban diubah/);
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);await user.click(screen.getByRole('button',{name:'Menu'}));
 expect(confirm).toHaveBeenCalledTimes(1);expect(window.location.pathname).toBe('/quiz');expect(screen.getByLabelText('Pilihan')).toHaveProperty('checked',true);expect(screen.getByTestId('revision').textContent).toBe('7');expect(screen.getByText(/Jawaban diubah/)).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'Coba lagi'}));await screen.findByText('Jawaban tersimpan');expect(save).toHaveBeenLastCalledWith('quiz','q',7,['choice']);expect(screen.getByTestId('revision').textContent).toBe('8');await user.click(screen.getByRole('button',{name:'Menu'}));expect(window.location.pathname).toBe('/away');expect(confirm).toHaveBeenCalledTimes(1);
});
test('in-flight and unknown-ack answer guard unload, cancellation and explicit discard without claiming persistence',async()=>{
 let reject!:(error:Error)=>void;mountAnswers(()=>new Promise((_resolve,r)=>{reject=r;}));const user=userEvent.setup();await screen.findByLabelText('Pilihan');await user.click(screen.getByLabelText('Pilihan'));await screen.findByText('Menyimpan jawaban…');
 const unload=new Event('beforeunload',{cancelable:true});window.dispatchEvent(unload);expect(unload.defaultPrevented).toBe(true);
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);await user.click(screen.getByRole('button',{name:'Menu'}));expect(window.location.pathname).toBe('/quiz');expect(screen.getByLabelText('Pilihan')).toHaveProperty('checked',true);
 await act(async()=>reject(new Error('Acknowledgement unknown')));await screen.findByText('Acknowledgement unknown');expect(screen.getByTestId('revision').textContent).toBe('0');confirm.mockReturnValue(true);await user.click(screen.getByRole('button',{name:'Menu'}));expect(window.location.pathname).toBe('/away');expect(navigationAllowed()).toBe(true);
});
const lesson:LessonDto={id:'lesson',position:1,revision:1,state:'draft',draft:{title:'A',description:'Visible A',sections:[{id:'section',title:'Section A',body:'Body A',required:true}]},versions:[]};
for(const dirty of [false,true])test(`lesson refresh acknowledges server baseline without publishing undisplayed content (${dirty?'dirty':'clean'} local A)`,async()=>{
 const latest={...lesson,revision:2,draft:{...lesson.draft,title:'B',description:'Server B'}};vi.spyOn(adminApi,'lesson').mockResolvedValue(latest);vi.spyOn(adminApi,'saveLesson').mockImplementation(async(_id,draft)=>({...latest,revision:3,draft}));const publish=vi.spyOn(adminApi,'publishLesson').mockResolvedValue({...latest,revision:4});
 render(<LessonEditor initial={lesson} onCreated={()=>{}}/>);const user=userEvent.setup();if(dirty)await user.type(screen.getByLabelText(/Judul materi/),' local');await user.click(screen.getByRole('button',{name:'Muat revisi terbaru'}));await screen.findByText(/Revisi dan posisi terbaru/);
 expect(screen.getByLabelText(/Judul materi/)).toHaveProperty('value',dirty?'A local':'A');expect(screen.getByRole('button',{name:'Terbitkan materi'})).toHaveProperty('disabled',true);expect(screen.getByText('Perubahan belum disimpan')).toBeTruthy();expect(publish).not.toHaveBeenCalled();
 await user.click(screen.getByRole('button',{name:'Simpan draf'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Terbitkan materi'})).toHaveProperty('disabled',false));expect(adminApi.saveLesson).toHaveBeenCalledWith('lesson',expect.objectContaining({title:dirty?'A local':'A'}),1,2);
});
test('one saved/unmounted guard does not clear a separate dirty editor',()=>{
 function Owner({dirty}:{dirty:boolean}){useUnsaved(dirty);return null;}
 const view=render(<><Owner dirty/><Owner dirty={false}/></>);const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);expect(navigationAllowed()).toBe(false);view.rerender(<Owner dirty/>);expect(navigationAllowed()).toBe(false);expect(confirm).toHaveBeenCalledTimes(2);
});
