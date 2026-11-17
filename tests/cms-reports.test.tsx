import {afterEach,expect,test,vi} from 'vitest';
import {act,cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Link,MemoryRouter} from 'react-router-dom';
import type {StudentResults,QuestionAnswer} from '../src/services/dto';
import {AppProvider} from '../src/hooks/useApp';
import {TeacherResultsPage} from '../src/pages/TeacherResultsPage';
import {adminApi} from '../src/services/admin';
import type {AppServices} from '../src/services/contracts';
const services={bootstrap:async()=>({config:{brand:'IMT',mode:'development'},student:null,teacher:{id:'a',name:'Admin',email:'',can_manage_schools:false,can_manage_content:false,school_ids:[]}})} as AppServices;
afterEach(()=>{cleanup();vi.restoreAllMocks();});
test('student summary shows server scores without treating missing as zero or exposing UTC text controls',async()=>{
 vi.spyOn(adminApi,'schools').mockResolvedValue({data:[],meta:{limit:25,offset:0,total:0}});
 const students=vi.spyOn(adminApi,'students').mockResolvedValue({data:[{student_id:'s',name:'Siswa hasil',enrollment_id:'e',school_id:'school',school_name_at_enrollment:'Sekolah contoh',form_date:'2026-11-17',created_at:'2026-11-17T00:00:42Z',completed_at:null,current_stage:'lessons',path_version_id:'v',latest_submitted_at:'2026-11-17T02:30:42.817Z',pre_test_score:0,post_test_score:null,latest_activity_at:'2026-11-17T02:30:42.817Z'}],meta:{total:1,limit:25,offset:0}});
 render(<MemoryRouter><AppProvider services={services}><TeacherResultsPage navigate={()=>{}}/></AppProvider></MemoryRouter>);
 await screen.findByText('Siswa hasil');expect(screen.getByText('0/100')).toBeDefined();expect(screen.getByText('Belum')).toBeDefined();expect(screen.getByText('17 Nov 2026, 09.30 WIB')).toBeDefined();
 expect(screen.queryByText(/UTC RFC3339/)).toBeNull();
 await userEvent.type(screen.getByLabelText('Cari nama siswa'),'Alya');
 await waitFor(()=>expect(students).toHaveBeenLastCalledWith(expect.objectContaining({q:'Alya'}),0));
});
test('student detail starts with assessment summary and keeps measurements behind a focused tab',async()=>{
 vi.spyOn(adminApi,'results').mockResolvedValue({student:{id:'s',name:'Siswa detail'},enrollment:{id:'e',school_id:'school',school_name_at_enrollment:'Sekolah',form_date:'2026-11-17',path_version_id:'v',created_at:'2026-11-17T00:00:00Z',completed_at:null},current_stage:'pre_test',latest_submitted_at:null,attempts:[],lessons:[],measurements:[]});
 render(<MemoryRouter initialEntries={['/admin/hasil/s?enrollment_id=e']}><AppProvider services={services}><TeacherResultsPage selectedId="s" navigate={()=>{}}/></AppProvider></MemoryRouter>);
 await screen.findByRole('heading',{name:'Siswa detail'});
 expect(screen.getByRole('tab',{name:'Ringkasan',exact:true}).getAttribute('aria-selected')).toBe('true');
 expect(screen.queryByRole('heading',{name:'Riwayat pengukuran',exact:true})).toBeNull();
 await userEvent.click(screen.getByRole('tab',{name:'Pengukuran IMT',exact:true}));await screen.findByText('Belum ada pengukuran.');
});

const enrollmentResult=(enrollment:string):StudentResults=>({student:{id:'same-student',name:'Siswa yang sama'},enrollment:{id:enrollment,school_id:'school',school_name_at_enrollment:enrollment==='first'?'Sekolah pertama':'Sekolah kedua',form_date:'2026-11-17',path_version_id:'path',created_at:'2026-11-17T00:00:00Z',completed_at:null},current_stage:'lessons',latest_submitted_at:'2026-11-17T00:00:00Z',lessons:[],measurements:[],attempts:[{id:enrollment+'-attempt',snapshot_id:enrollment+'-snapshot',assessment_type:'pre_test',attempt_number:1,status:'submitted',created_at:'2026-11-17T00:00:00Z',submitted_at:'2026-11-17T00:00:00Z',earned_points:1,max_points:1,score_percent:100}]});
const enrollmentAnswers=(enrollment:string)=>({data:[{student_id:'same-student',student_name:'Siswa yang sama',enrollment_id:enrollment,school_id:'school',school_name_at_enrollment:'Sekolah '+enrollment,bank_id:'bank',bank_version_id:'bank-version',snapshot_id:enrollment+'-snapshot',snapshot_question_id:enrollment+'-question',question_id:'question',question_version_id:'version',position:1,text:enrollment==='first'?'Jawaban lama harus hilang':'Jawaban pendaftaran kedua',type:'single',assessment_type:'pre_test',attempt_id:enrollment+'-attempt',attempt_number:1,attempt_status:'submitted',answer_revision:1,saved_at:null,submitted_at:null,options:[],selected_option_ids:[],selected_options:[],answer_state:'correct',correctness:true,earned_points:1,max_points:1} as QuestionAnswer],meta:{total:1,limit:25,offset:0}});
for(const delayed of [false,true])test(`same-student enrollment navigation resets answer context (${delayed?'late response':'loaded answers'})`,async()=>{
 vi.spyOn(adminApi,'results').mockImplementation(async(_student,enrollment)=>enrollmentResult(enrollment));
 let resolveOld!:(value:ReturnType<typeof enrollmentAnswers>)=>void;
 const pending=new Promise<ReturnType<typeof enrollmentAnswers>>(resolve=>{resolveOld=resolve;});
 const answers=vi.spyOn(adminApi,'answers').mockImplementation(async attempt=>attempt==='first-attempt'?(delayed?pending:enrollmentAnswers('first')):enrollmentAnswers('second'));
 render(<MemoryRouter initialEntries={['/admin/hasil/same-student?enrollment_id=first']}><AppProvider services={services}><Link to="/admin/hasil/same-student?enrollment_id=second">Pendaftaran kedua</Link><TeacherResultsPage selectedId="same-student" navigate={()=>{}}/></AppProvider></MemoryRouter>);
 await userEvent.click(await screen.findByRole('button',{name:'Lihat jawaban Pre-test',exact:true}));
 await waitFor(()=>expect(answers).toHaveBeenCalledWith('first-attempt',0));
 if(!delayed)await screen.findByText('Jawaban lama harus hilang');
 await userEvent.click(screen.getByRole('link',{name:'Pendaftaran kedua'}));await screen.findByText(/Sekolah kedua · Daftar/);
 if(delayed)await act(async()=>{resolveOld(enrollmentAnswers('first'));await pending;});
 expect(screen.queryByText('Jawaban lama harus hilang')).toBeNull();
 expect(screen.getByRole('tab',{name:'Ringkasan',exact:true}).getAttribute('aria-selected')).toBe('true');
 await userEvent.click(screen.getByRole('button',{name:'Lihat jawaban Pre-test',exact:true}));await screen.findByText('Jawaban pendaftaran kedua');
 expect(answers.mock.calls.map(([attempt])=>attempt)).toEqual(['first-attempt','second-attempt']);
});
