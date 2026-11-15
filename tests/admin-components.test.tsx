import {afterEach,expect,test,vi} from 'vitest';
import {render,screen,cleanup,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AppProvider} from '../src/hooks/useApp';
import {AdminSchoolsPage} from '../src/pages/AdminSchoolsPage';
import {adminApi} from '../src/services/admin';
import type {AppServices} from '../src/services/contracts';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
const services=(allowed:boolean)=>({bootstrap:async()=>({config:{brand:'Imt Smart Teens',program:'Gizi',mode:'development'},student:null,teacher:{id:'a',name:'Admin',email:'',can_manage_schools:allowed,can_manage_content:false,school_ids:[]}})}) as AppServices;
test('school-catalog permission does not imply access; denied UI makes no catalog calls',async()=>{
 const list=vi.spyOn(adminApi,'schools');render(<AppProvider services={services(false)}><AdminSchoolsPage/></AppProvider>);
 await screen.findByText(/Tidak memiliki izin/);expect(list).not.toHaveBeenCalled();
});
test('school create 409 preserves name and archive requires confirmation',async()=>{
 const row={id:'school',name:'Sekolah',revision:1,status:'active',created_at:'',updated_at:'',archived_at:null} as const;
 vi.spyOn(adminApi,'schools').mockResolvedValue({data:[row],meta:{limit:25,offset:0,total:1}});
 const save=vi.spyOn(adminApi,'saveSchool').mockRejectedValue(Error('Nama sekolah sudah digunakan.'));
 const archive=vi.spyOn(adminApi,'archiveSchool').mockResolvedValue({});
 render(<AppProvider services={services(true)}><AdminSchoolsPage/></AppProvider>);const user=userEvent.setup();
 await screen.findByText('Sekolah',{selector:'strong'});await user.click(screen.getByRole('button',{name:'Tambah sekolah'}));await user.type(screen.getByLabelText(/Nama sekolah/),'Nama tetap');await user.click(screen.getByRole('button',{name:'Simpan sekolah'}));await screen.findByRole('alert');expect(screen.getByLabelText(/Nama sekolah/)).toHaveProperty('value','Nama tetap');expect(save).toHaveBeenCalled();
 await user.click(screen.getByRole('button',{name:'Batal'}));await user.click(screen.getByRole('button',{name:'Arsipkan Sekolah'}));expect(archive).not.toHaveBeenCalled();await user.click(screen.getByRole('button',{name:'Ya, arsipkan'}));await waitFor(()=>expect(archive).toHaveBeenCalledWith('school',1));
});
