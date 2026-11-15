import {expect,test,vi} from 'vitest';
import {adminApi} from '../src/services/admin';
import {http} from '../src/services/http';
test('school archive uses DELETE query revision; draft update and publication are distinct exact commands',async()=>{
 const send=vi.spyOn(http,'send').mockResolvedValue({});
 await adminApi.archiveSchool('school',4);expect(send).toHaveBeenLastCalledWith('/admin/schools/school?expected_revision=4','DELETE');
 const draft={title:'Materi',description:'',sections:[{id:'section',title:'Bagian',body:'Isi',required:true}]};
 await adminApi.saveLesson('lesson',draft,2,8);expect(send).toHaveBeenLastCalledWith('/admin/lessons/lesson','PUT',{...draft,position:2,expected_revision:8});
 await adminApi.publishLesson('lesson',9);expect(send).toHaveBeenLastCalledWith('/admin/lessons/lesson/publication','POST',{expected_revision:9});send.mockRestore();
});
test('question report requires explicitly selected immutable version, not question root or revision',async()=>{
 const page=vi.spyOn(http,'page').mockResolvedValue({data:[],meta:{limit:25,offset:0,total:0}});
 await expect(adminApi.questionAnswers({question_id:'root'})).rejects.toThrow(/versi/);expect(page).not.toHaveBeenCalled();
 await adminApi.questionAnswers({question_id:'root',question_version_id:'version'});expect(page).toHaveBeenCalledWith('/admin/reports/question-answers?question_id=root&question_version_id=version&limit=25&offset=0');page.mockRestore();
});
