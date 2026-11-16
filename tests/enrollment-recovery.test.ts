/** Adapter-level regressions: projection failures must never reopen enrollment POST. */
import {beforeEach,afterEach,expect,test,vi} from 'vitest';
const identity={name:'Synthetic recovery',school:'school',date:'2026-11-16'};
const profile={student:{id:'student-original',name:identity.name},enrollment:{id:'enrollment-original',school_id:'school',school_name_at_enrollment:'Synthetic school',form_date:identity.date,created_at:'now',path_version_id:'path',completed_at:null}};
const progress={enrollment_id:profile.enrollment.id,path_version_id:'path',current_stage:'pre_test',stages:[{id:'pre_test',status:'in_progress'}],lessons:[],active_attempt_ids:{pre_test:'attempt'},latest_measurement_id:null};
const attempt={id:'attempt',assessment_type:'pre_test',attempt_number:1,status:'in_progress',snapshot_id:'snapshot',submitted_at:null,score:null,questions:[],answers:[]};
beforeEach(()=>{vi.resetModules();sessionStorage.clear();});
afterEach(()=>vi.restoreAllMocks());
async function harness(requests:{path:string;method:string;key?:string}[]=[]){
 const {http,ApiError}=await import('../src/services/http');
 let failure='',status=503,authenticated=true,mismatch=false;
 vi.spyOn(http,'get').mockImplementation(async(path)=>{
  requests.push({path,method:'GET'});
  if(path===failure)throw new ApiError('Projection unavailable',status,'PROJECTION_FAILURE');
  if(path==='/student/me'){if(!authenticated)throw new ApiError('Expired',401,'UNAUTHORIZED');return profile;}
  if(path==='/admin/me')return {admin:null};
  if(path==='/student/progress')return {...progress,enrollment_id:mismatch?'other-enrollment':progress.enrollment_id};
  if(path==='/student/attempts/attempt')return attempt;
  throw Error('Unexpected GET '+path);
 });
 vi.spyOn(http,'send').mockImplementation(async(path,method,_body,key)=>{requests.push({path,method,key});return {...profile,csrf_token:'rotated-memory-only'};});
 vi.spyOn(http,'csrf').mockImplementation(async()=>{requests.push({path:'/csrf',method:'GET'});http.rotate('rebound-memory-only');return http.token();});
 http.rotate('original-memory-only');
 const load=async()=> (await import('../src/services/api')).api;
 return {load,requests,fail:(path:string,code=503)=>{failure=path;status=code;},expire:()=>{authenticated=false;},mismatch:()=>{mismatch=true;}};
}
for(const path of ['/student/me','/student/progress','/student/attempts/attempt']){
 test(`committed POST followed by failed ${path} retains guard/key through retry and reload`,async()=>{
  const h=await harness();let api=await h.load();h.fail(path,422);
  await expect(api.student.register(identity)).rejects.toThrow('Projection unavailable');
  const saved=sessionStorage.getItem('imt-pending-enrollment-v1');
  expect(api.student.pendingEnrollment()).toEqual(identity);expect(api.student.enrollmentBlocked()).toBe(true);
  expect(saved).toBeTruthy();expect(saved).not.toMatch(/memory-only/);
  h.fail('/student/progress',429);
  await expect(api.student.register(identity)).rejects.toThrow();
  expect(sessionStorage.getItem('imt-pending-enrollment-v1')).toBe(saved);
  expect(h.requests.filter(r=>r.method==='POST')).toHaveLength(1);
  expect(h.requests.filter(r=>r.path==='/csrf')).toHaveLength(0);
  // Reset actual singleton modules, retaining only the browser journal and authenticated server truth.
  vi.resetModules();const reloaded=await harness(h.requests);api=await reloaded.load();
  reloaded.fail('/student/attempts/attempt',403);await expect(api.bootstrap()).rejects.toThrow();
  expect(sessionStorage.getItem('imt-pending-enrollment-v1')).toBe(saved);
  reloaded.fail('');const restored=await api.student.register(identity);
  expect(restored.id).toBe(profile.student.id);expect(restored.enrollmentId).toBe(profile.enrollment.id);
  expect(api.student.pendingEnrollment()).toBeNull();expect(api.student.enrollmentBlocked()).toBe(false);
  expect(h.requests.filter(r=>r.method==='POST')).toHaveLength(1);
  expect(h.requests.filter(r=>r.path==='/csrf')).toHaveLength(1);
 });
}
test('bootstrap composition failure and later expired recovery cannot release an existing operation',async()=>{
 const h=await harness();const api=await h.load();h.fail('/student/progress');
 await expect(api.student.register(identity)).rejects.toThrow();const saved=sessionStorage.getItem('imt-pending-enrollment-v1');
 h.fail('/student/attempts/attempt',403);await expect(api.bootstrap()).rejects.toThrow();
 expect(api.student.pendingEnrollment()).toEqual(identity);expect(sessionStorage.getItem('imt-pending-enrollment-v1')).toBe(saved);
 h.expire();h.fail('');await expect(api.student.refresh()).rejects.toThrow('Expired');
 await expect(api.student.register(identity)).rejects.toThrow();
 expect(h.requests.filter(r=>r.method==='POST')).toHaveLength(1);expect(h.requests.filter(r=>r.path==='/csrf')).toHaveLength(0);
});
test('recovery refuses profile/progress from different authenticated sessions',async()=>{
 const h=await harness();const api=await h.load();h.fail('/student/progress');await expect(api.student.register(identity)).rejects.toThrow();
 h.fail('');h.mismatch();await expect(api.student.refresh()).rejects.toThrow(/sesi/i);
 expect(api.student.pendingEnrollment()).toEqual(identity);expect(h.requests.filter(r=>r.method==='POST')).toHaveLength(1);
});
