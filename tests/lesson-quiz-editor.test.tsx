import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LessonEditor} from '../src/components/LessonContentEditor';
import {adminApi} from '../src/services/admin';
import type {LessonEditor as LessonDto} from '../src/services/dto';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
const initial:LessonDto={id:'l1',position:1,revision:1,state:'draft',draft:{title:'Materi',description:'',sections:[{id:'s1',title:'Bagian',body:'Isi',required:true}],quiz:{text:'Pertanyaan lama',options:[{id:'a',text:'A lama'},{id:'b',text:'B lama'}],correct_option_id:'a'}},versions:[]};
test('lesson editor keeps exactly two ordered quiz options and saves the private correct key with its lesson draft',async()=>{
 const save=vi.spyOn(adminApi,'saveLesson').mockImplementation(async(_id,draft)=>({...initial,revision:2,draft}));
 render(<LessonEditor initial={initial} onCreated={()=>{}}/>);const user=userEvent.setup();
 expect(screen.getAllByLabelText(/Pilihan kuis/)).toHaveLength(2);
 await user.clear(screen.getByLabelText('Pertanyaan kuis'));await user.type(screen.getByLabelText('Pertanyaan kuis'),'Baru');
 await user.click(screen.getByLabelText('Kunci jawaban pilihan B'));
 await user.click(screen.getByRole('button',{name:'Simpan draf'}));
 await waitFor(()=>expect(save).toHaveBeenCalled());
 expect(save).toHaveBeenCalledWith('l1',expect.objectContaining({quiz:expect.objectContaining({text:'Baru',correct_option_id:'b',options:[{id:'a',text:'A lama'},{id:'b',text:'B lama'}]})}),1,1);
});
