import {expect,test,vi,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {TeacherResultsPage} from '../src/pages/TeacherResultsPage';
import {adminApi} from '../src/services/admin';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
test('result detail back action preserves the selected report filters without accepting an external return URL',async()=>{
 vi.spyOn(adminApi,'results').mockResolvedValue({student:{id:'student',name:'Siswa'},enrollment:{school_name_at_enrollment:'School',form_date:'2026-11-16'},lessons:[],measurements:[],attempts:[]} as never);
 const back='/admin/hasil?school_id=school&stage=completed';const navigate=vi.fn();
 const view=render(<MemoryRouter initialEntries={['/admin/hasil/student?enrollment_id=enrollment&return_to='+encodeURIComponent(back)]}><TeacherResultsPage selectedId="student" navigate={navigate}/></MemoryRouter>);
 await userEvent.click(screen.getByRole('button',{name:'Kembali ke hasil siswa'}));expect(navigate).toHaveBeenCalledWith(back);view.unmount();navigate.mockClear();
 render(<MemoryRouter initialEntries={['/admin/hasil/student?return_to='+encodeURIComponent('https://invalid.example/')]}><TeacherResultsPage selectedId="student" navigate={navigate}/></MemoryRouter>);await userEvent.click(screen.getByRole('button',{name:'Kembali ke hasil siswa'}));expect(navigate).toHaveBeenCalledWith('/admin/hasil');
});
