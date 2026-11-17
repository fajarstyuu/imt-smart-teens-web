import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AppProvider} from '../src/hooks/useApp';
import {LessonEditor} from '../src/components/ContentEditors';
import {TeacherPublicationPage} from '../src/pages/TeacherPublicationPage';
import {adminApi} from '../src/services/admin';
import type {AppServices} from '../src/services/contracts';
import type {LessonEditor as LessonDto,PathEditor,BankEditor} from '../src/services/dto';
const services={bootstrap:async()=>({config:{brand:'Imt Smart Teens',program:'Gizi',mode:'development'},student:null,teacher:{id:'a',name:'Admin',email:'',can_manage_content:false,can_manage_schools:false,school_ids:[]}})} as AppServices;
afterEach(()=>{cleanup();vi.restoreAllMocks();});
const lesson:LessonDto={id:'lesson',state:'draft',revision:3,position:1,draft:{title:'Materi asli',description:'Deskripsi',sections:[{id:'section',title:'Subbab asli',body:'Isi asli',required:false}]},versions:[]};
const path:PathEditor={id:'path',revision:4,lesson_ids:['lesson'],paired_bank_id:'paired',quiz_bank_id:'quiz',versions:[],published:null};
const banks:BankEditor[]=[{id:'paired',kind:'paired',state:'draft',revision:2,versions:[]},{id:'quiz',kind:'quiz',state:'draft',revision:5,versions:[]}];
function publication(){vi.spyOn(adminApi,'path').mockResolvedValue(path);vi.spyOn(adminApi,'lesson').mockResolvedValue(lesson);vi.spyOn(adminApi,'banks').mockResolvedValue({data:banks,meta:{total:2,limit:25,offset:0}});vi.spyOn(adminApi,'questions').mockImplementation(async bank=>({data:[{id:bank+'q',bank_id:bank,state:'draft',revision:1,position:1,draft:{text:'Pertanyaan '+bank,type:'single',options:[{id:'a',text:'Satu'},{id:'b',text:'Dua'}],correct_option_ids:['a'],required:true},versions:[]}],meta:{total:1,limit:25,offset:0}}));render(<AppProvider services={services}><TeacherPublicationPage navigate={()=>{}}/></AppProvider>);}
test('simple new lesson has one title and saves a valid section without forcing a second heading',async()=>{
 const save=vi.spyOn(adminApi,'saveLesson').mockImplementation(async(_id,draft)=>({...lesson,draft}));
 render(<LessonEditor initial={null} onCreated={()=>{}}/>);const user=userEvent.setup();
 await user.type(screen.getByLabelText(/Judul materi/),'Judul tunggal');await user.type(screen.getByLabelText('Isi materi',{exact:true}),'Isi yang baru');
 expect(screen.queryByLabelText('Judul bagian 1')).toBeNull();
 await user.click(screen.getByRole('button',{name:'Simpan draf',exact:true}));
 await waitFor(()=>expect(save).toHaveBeenCalled());
 expect(save.mock.calls[0][1].sections[0]).toMatchObject({title:'Judul tunggal',body:'Isi yang baru',required:true});
 expect(screen.queryByRole('button',{name:'Terbitkan materi'})).toBeNull();
});
test('editing preserves existing custom section title identity and optional completion policy',async()=>{
 const save=vi.spyOn(adminApi,'saveLesson').mockImplementation(async(_id,draft)=>({...lesson,draft}));
 render(<LessonEditor initial={lesson} onCreated={()=>{}}/>);
 await userEvent.clear(screen.getByLabelText(/Judul materi/));await userEvent.type(screen.getByLabelText(/Judul materi/),'Judul berubah');
 await userEvent.click(screen.getByRole('button',{name:'Simpan draf',exact:true}));
 await waitFor(()=>expect(save).toHaveBeenCalled());expect(save.mock.calls[0][1].sections[0]).toEqual(lesson.draft.sections[0]);
});
test('publication confirms the exact reviewed revision set, and failure keeps the review visible',async()=>{
 const release=vi.spyOn(adminApi,'release').mockRejectedValue(Error('Konten berubah. Muat ulang tinjauan.'));
 publication();await screen.findByRole('button',{name:'Terbitkan pembelajaran',exact:true});
 await userEvent.click(screen.getByRole('button',{name:'Terbitkan pembelajaran',exact:true}));expect(release).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:'Ya, terbitkan',exact:true}));
 await screen.findAllByText('Konten berubah. Muat ulang tinjauan.');
 expect(release).toHaveBeenCalledWith({expected_revision:4,lessons:[{id:'lesson',expected_revision:3}],banks:[{id:'paired',expected_revision:2},{id:'quiz',expected_revision:5}]});
 expect(screen.queryByRole('heading',{name:'Terbitkan pembelajaran?',exact:true})).toBeNull();expect(screen.getByRole('button',{name:'Terbitkan pembelajaran',exact:true})).toHaveProperty('disabled',true);
});
test('empty content blocks publication rather than showing mock readiness',async()=>{
 vi.spyOn(adminApi,'path').mockResolvedValue({...path,lesson_ids:[]});
 vi.spyOn(adminApi,'banks').mockResolvedValue({data:banks,meta:{total:2,limit:25,offset:0}});
 vi.spyOn(adminApi,'questions').mockResolvedValue({data:[],meta:{total:0,limit:25,offset:0}});
 render(<AppProvider services={services}><TeacherPublicationPage navigate={()=>{}}/></AppProvider>);
 await screen.findByText(/Tambahkan minimal satu materi/);
 expect(screen.getByRole('button',{name:'Terbitkan pembelajaran',exact:true})).toHaveProperty('disabled',true);
});
