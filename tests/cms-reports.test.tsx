import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
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
