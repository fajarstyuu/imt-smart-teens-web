import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {AppProvider,useApp} from '../src/hooks/useApp';
import {StudentShell} from '../src/components/StudentShell';
import {SummaryPage} from '../src/pages/SummaryPage';
import {http} from '../src/services/http';
import type {AppServices} from '../src/services/contracts';
import type {Student} from '../src/domain/types';

afterEach(()=>{cleanup();vi.restoreAllMocks();});

const student={
 id:'student-1',enrollmentId:'enrollment-1',identity:{name:'Alya Siswa',school:'Sekolah Contoh',date:'2026-11-18'},createdAt:'now',
 lessons:[{id:'lesson-1',title:'Materi Pengukuran',completedAt:'now'}],attempts:{},measurements:[],
 serverProgress:{current_stage:'completed',stages:[{id:'pre_test',status:'completed'},{id:'lessons',status:'completed'},{id:'calculator',status:'completed'},{id:'post_test',status:'completed'}],lessons:[{lesson_id:'lesson-1',status:'completed'}]}
} as unknown as Student;
const services={bootstrap:async()=>({config:{brand:'IMT',program:'Pembelajaran',mode:'development'},student,teacher:null}),student:{attempt:async(type:'pre'|'post')=>({id:type,number:1,submittedAt:'now',score:type==='pre'?0:72,questions:[],answers:{}})}} as unknown as AppServices;
function CompletedStudentScreen(){const {data,loading}=useApp();if(loading||!data.student)return null;return <StudentShell path="/ringkasan" navigate={()=>{}}><SummaryPage navigate={()=>{}}/></StudentShell>;}

test('completed student navigation does not expose a locked standalone Quiz menu item',async()=>{
 render(<MemoryRouter><AppProvider services={services}><CompletedStudentScreen/></AppProvider></MemoryRouter>);
 expect(await screen.findByRole('heading',{name:'Perjalanan yang tuntas.'})).toBeTruthy();
 expect(screen.queryByRole('button',{name:/Quiz/})).toBeNull();
});

test('student guidance points to per-lesson quizzes and the real calculator/post-test sequence',async()=>{
 render(<MemoryRouter><AppProvider services={services}><CompletedStudentScreen/></AppProvider></MemoryRouter>);
 await screen.findByRole('heading',{name:'Perjalanan yang tuntas.'});
 await userEvent.click(screen.getByRole('button',{name:'Buka panduan'}));
 expect(screen.queryByText(/Kerjakan Quiz/)).toBeNull();
 expect(screen.getByText(/kuis pada setiap materi/i)).toBeTruthy();
 expect(screen.getByText(/Kalkulator IMT.*Post-test/i)).toBeTruthy();
});

test('completed student summary displays only paired pre-test and post-test scores',async()=>{
 vi.spyOn(http,'get').mockResolvedValue({student:{id:'student-1',name:'Alya Siswa'},enrollment:{id:'enrollment-1'},scores:{pre_test:0,quiz:null,post_test:72},latest_measurement:{weight_kg:45.5,height_cm:155,bmi_display:'18,9'},progress:student.serverProgress} as never);
 render(<MemoryRouter><AppProvider services={services}><CompletedStudentScreen/></AppProvider></MemoryRouter>);
 await screen.findByRole('heading',{name:'Perjalanan yang tuntas.'});
 const cards=[...document.querySelectorAll<HTMLElement>('.summary-stats .od-stat')];await waitFor(()=>expect(cards.map(card=>card.textContent)).toEqual(['Pre-test0/100','Post-test72/100']));expect(cards).toHaveLength(2);
 expect(screen.queryByText(/Quiz/)).toBeNull();expect(screen.queryByText('—/100')).toBeNull();
 expect(screen.getByRole('heading',{name:'Jawaban pre-test & post-test'})).toBeTruthy();
 expect(screen.getByText('Materi Pengukuran · Selesai')).toBeTruthy();
});
