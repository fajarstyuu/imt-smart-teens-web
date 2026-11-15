import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {BrowserRouter} from 'react-router-dom';
import {AppProvider} from '../src/hooks/useApp';
import {LoginPage} from '../src/pages/LoginPage';
import {useAssessment} from '../src/hooks/useAssessment';
import {ApiError} from '../src/services/http';
import type {AppServices} from '../src/services/contracts';
afterEach(cleanup);
const base={bootstrap:async()=>({config:{brand:'Imt Smart Teens',program:'Gizi',mode:'development'},student:null,teacher:null}),student:{pendingEnrollment:()=>null,enrollmentBlocked:()=>false,schools:async()=>({data:[{id:'school-uuid',name:'Sekolah aktif'}],meta:{limit:25,offset:0,total:1}})},teacher:{}} as unknown as AppServices;
const mount=(element:React.ReactNode,services=base)=>render(<BrowserRouter><AppProvider services={services}>{element}</AppProvider></BrowserRouter>);
test('school picker submits canonical UUID and date-only value instead of a free-text school',async()=>{
 const register=vi.fn().mockResolvedValue({});const navigate=vi.fn();const services={...base,student:{...base.student,register}};
 mount(<LoginPage navigate={navigate}/>,services);const user=userEvent.setup();
 await user.type(screen.getByLabelText(/Nama lengkap/),'Siswa sintetis');
 await screen.findByRole('option',{name:'Sekolah aktif'});await user.selectOptions(screen.getByLabelText(/Asal sekolah/),'school-uuid');
 const date=screen.getByLabelText(/Tanggal pengisian/) as HTMLInputElement;await user.clear(date);await user.type(date,'2026-11-16');
 await user.click(screen.getByRole('button',{name:'Mulai pre-test',exact:true}));
 await waitFor(()=>expect(register).toHaveBeenCalledWith({name:'Siswa sintetis',school:'school-uuid',date:'2026-11-16'}));
});
function Answers(){const a=useAssessment('pre');return <><button onClick={()=>void a.save('snapshot-q',['choice'])}>Pilih</button><button onClick={()=>void a.save('snapshot-q',[])}>Kosongkan</button><button onClick={a.retry}>Coba lagi</button><output>{JSON.stringify({draft:a.draft,attempt:a.attempt,status:a.status})}</output></>;}
test('stale answer preserves unsaved input, reconciles latest answer revision, and empty array clears',async()=>{
 const attempt={id:'attempt',type:'pre',number:1,questions:[{id:'snapshot-q',version:99,text:'Pertanyaan',type:'single',options:[{id:'choice',text:'Pilihan'}]}],answers:{}};
 const saveAnswer=vi.fn().mockRejectedValueOnce(new ApiError('Konflik',409,'ANSWER_REVISION_CONFLICT',{latest_answer:{snapshot_question_id:'snapshot-q',option_ids:[],revision:7,saved_at:null}})).mockResolvedValueOnce({snapshot_question_id:'snapshot-q',option_ids:['choice'],revision:8,saved_at:'now'}).mockResolvedValueOnce({snapshot_question_id:'snapshot-q',option_ids:[],revision:9,saved_at:'later'});
 mount(<Answers/>,{...base,student:{...base.student,attempt:async()=>attempt,saveAnswer}});const user=userEvent.setup();await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('snapshot-q'));
 await user.click(screen.getByRole('button',{name:'Pilih'}));await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('choice'));expect(saveAnswer).toHaveBeenNthCalledWith(1,'pre','snapshot-q',0,['choice']);
 await user.click(screen.getByRole('button',{name:'Coba lagi'}));await waitFor(()=>expect(saveAnswer).toHaveBeenNthCalledWith(2,'pre','snapshot-q',7,['choice']));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('Jawaban tersimpan'));await user.click(screen.getByRole('button',{name:'Kosongkan'}));await waitFor(()=>expect(saveAnswer).toHaveBeenNthCalledWith(3,'pre','snapshot-q',8,[]));
});
