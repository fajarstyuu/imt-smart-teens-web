import {expect,test,vi} from 'vitest';
import {api} from '../src/services/api';
import {http} from '../src/services/http';
test('submitted attempts absent from active IDs retain their known IDs after refresh and fetch latest visibility',async()=>{
 const profile={student:{id:'student',name:'Synthetic'},enrollment:{id:'enrollment',school_id:'school',school_name_at_enrollment:'School',form_date:'2026-11-16',created_at:'now',path_version_id:'path',completed_at:null}};
 let submitted=false;
 const get=vi.spyOn(http,'get').mockImplementation(async(path)=>{
  if(path==='/student/me')return profile;
  if(path==='/admin/me')return {admin:null};
  if(path==='/student/progress')return {enrollment_id:'enrollment',path_version_id:'path',current_stage:submitted?'lessons':'pre_test',stages:[{id:'pre_test',status:submitted?'completed':'in_progress'}],lessons:[],active_attempt_ids:submitted?{}:{pre_test:'attempt'},latest_measurement_id:null};
  if(path==='/student/attempts/attempt')return {id:'attempt',assessment_type:'pre_test',attempt_number:1,status:submitted?'submitted':'in_progress',snapshot_id:'snapshot',submitted_at:submitted?'now':null,score:null,questions:[],answers:[]};
  throw Error('Unexpected endpoint');
 });
 vi.spyOn(http,'csrf').mockResolvedValue('memory');await api.bootstrap();submitted=true;
 const refreshed=await api.student.refresh();expect(refreshed.attempts.pre?.id).toBe('attempt');expect(refreshed.attempts.pre?.submittedAt).toBe('now');get.mockRestore();vi.restoreAllMocks();
});
