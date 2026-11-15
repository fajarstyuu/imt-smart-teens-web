import {afterEach,expect,test,vi} from 'vitest';
import {render,screen,cleanup,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LessonEditor,QuestionEditor} from '../src/components/ContentEditors';
import {adminApi} from '../src/services/admin';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
test('lesson draft save is not publication; revision conflict retains text and stable section identity',async()=>{
 const initial={id:'lesson',state:'draft',revision:2,position:1,draft:{title:'Judul',description:'',sections:[{id:'stable-section',title:'Bagian',body:'Isi',required:true}]},versions:[]} as const;
 const save=vi.spyOn(adminApi,'saveLesson').mockRejectedValueOnce(Error('Revisi konflik'));
 const publish=vi.spyOn(adminApi,'publishLesson');render(<LessonEditor initial={initial} onCreated={()=>{}}/>);const user=userEvent.setup();
 await user.clear(screen.getByLabelText(/Judul materi/));await user.type(screen.getByLabelText(/Judul materi/),'Judul tetap');await user.click(screen.getByRole('button',{name:'Simpan draf'}));await screen.findByRole('alert');
 expect(screen.getByLabelText(/Judul materi/)).toHaveProperty('value','Judul tetap');expect(save).toHaveBeenCalledWith('lesson',expect.objectContaining({title:'Judul tetap',sections:[{id:'stable-section',title:'Bagian',body:'Isi',required:true}]}),1,2);expect(publish).not.toHaveBeenCalled();
});
test('new question allocates option UUIDs before selecting private keys',async()=>{
 const save=vi.spyOn(adminApi,'saveQuestion').mockImplementation(async(_bank,_id,draft,position)=>({id:'created',bank_id:'bank',revision:1,state:'draft',position,draft,versions:[]}));
 render(<QuestionEditor bank="bank" initial={null} onCreated={()=>{}}/>);const user=userEvent.setup();
 await user.type(screen.getByLabelText('Pertanyaan'),'Soal sintetis');await user.type(screen.getByLabelText('Pilihan 1'),'Satu');await user.type(screen.getByLabelText('Pilihan 2'),'Dua');await user.click(screen.getByLabelText('Kunci pilihan 1'));await user.click(screen.getByRole('button',{name:'Simpan draf'}));
 await waitFor(()=>expect(save).toHaveBeenCalled());const draft=save.mock.calls[0][2];expect(draft.options[0].id).toMatch(/^[a-f\d-]{36}$/);expect(draft.correct_option_ids).toEqual([draft.options[0].id]);
});
