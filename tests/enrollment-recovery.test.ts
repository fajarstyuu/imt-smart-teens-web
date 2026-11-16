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
 let failure='',status=503,authenticated=true,mismatch=false,csrfFailure=false,lateSwitch=false,meReads=0;
 const sendFailure:{value:Error|null}={value:null};
 vi.spyOn(http,'get').mockImplementation(async(path)=>{
  requests.push({path,method:'GET'});
  if(path===failure)throw new ApiError('Projection unavailable',status,'PROJECTION_FAILURE');
  if(path==='/student/me'){if(!authenticated)throw new ApiError('Expired',401,'UNAUTHORIZED');meReads++;return lateSwitch&&meReads>1?{...profile,student:{...profile.student,id:'changed-session'}}:profile;}
  if(path==='/admin/me')return {admin:null};
  if(path==='/student/progress')return {...progress,enrollment_id:mismatch?'other-enrollment':progress.enrollment_id};
  if(path==='/student/attempts/attempt')return attempt;
  throw Error('Unexpected GET '+path);
 });
 vi.spyOn(http,'send').mockImplementation(async(path,method,_body,key)=>{requests.push({path,method,key});if(sendFailure.value)throw sendFailure.value;return {...profile,csrf_token:'rotated-memory-only'};});
 vi.spyOn(http,'csrf').mockImplementation(async()=>{requests.push({path:'/csrf',method:'GET'});if(csrfFailure)throw new ApiError('CSRF unavailable',503,'UNAVAILABLE');http.rotate('rebound-memory-only');return http.token();});
 http.rotate('original-memory-only');
 const load=async()=> (await import('../src/services/api')).api;
 return {load,requests,fail:(path:string,code=503)=>{failure=path;status=code;},expire:()=>{authenticated=false;},authenticate:()=>{authenticated=true;},mismatch:()=>{mismatch=true;},switchLate:()=>{lateSwitch=true;meReads=0;},failCsrf:()=>{csrfFailure=true;},sendFailure};
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
test('bootstrap authenticated profile cannot release a reloaded unknown journal before composition',async()=>{
 sessionStorage.setItem('imt-pending-enrollment-v1',JSON.stringify({identity,key:'original-key'}));
 const h=await harness();const api=await h.load();h.fail('/student/progress',422);
 await expect(api.bootstrap()).rejects.toThrow();expect(api.student.pendingEnrollment()).toEqual(identity);
 h.fail('');const restored=await api.student.refresh();expect(restored.id).toBe('student-original');
 expect(h.requests.filter(r=>r.method==='POST')).toHaveLength(0);expect(api.student.pendingEnrollment()).toBeNull();
});
test('failed CSRF rebind after complete read model retains operation until recovery finishes',async()=>{
 const h=await harness();const api=await h.load();h.fail('/student/progress');await expect(api.student.register(identity)).rejects.toThrow();
 h.fail('');h.failCsrf();await expect(api.student.refresh()).rejects.toThrow('CSRF unavailable');
 expect(api.student.pendingEnrollment()).toEqual(identity);await expect(api.student.register(identity)).rejects.toThrow('CSRF unavailable');
 expect(h.requests.filter(r=>r.method==='POST')).toHaveLength(1);
});
test('session changes during required reads cannot publish a partial successful recovery',async()=>{
 const h=await harness();const api=await h.load();h.fail('/student/progress');await expect(api.student.register(identity)).rejects.toThrow();
 h.fail('');h.switchLate();await expect(api.student.refresh()).rejects.toThrow(/sesi/i);
 expect(api.student.pendingEnrollment()).toEqual(identity);expect(h.requests.filter(r=>r.path==='/csrf')).toHaveLength(0);
});
test('failed unauthenticated recovery does not disable deliberate original-context unknown POST retry',async()=>{
 const h=await harness();const api=await h.load();h.sendFailure.value=Error('Lost POST');
 await expect(api.student.register(identity)).rejects.toThrow('Lost POST');h.expire();
 await expect(api.student.refresh()).rejects.toThrow('Expired');expect(api.student.enrollmentBlocked()).toBe(false);
 h.authenticate();h.sendFailure.value=null;await api.student.register(identity);
 const posts=h.requests.filter(r=>r.method==='POST');expect(posts).toHaveLength(2);expect(posts[0].key).toBe(posts[1].key);
 expect(h.requests.filter(r=>r.path==='/csrf')).toHaveLength(0);
});
