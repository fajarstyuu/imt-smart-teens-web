import { afterEach, expect, test, vi } from 'vitest';
import { createHttp, ApiError } from '../src/services/http';
afterEach(()=>vi.restoreAllMocks());
test('cookies, memory CSRF, envelopes, pagination and bodyless logout use Rust contracts',async()=>{
 const calls:RequestInit[]=[];
 const fetcher=vi.fn(async(_url:unknown,init?:RequestInit)=>{calls.push(init!);return calls.length===1?new Response(JSON.stringify({data:{token:'memory-csrf'}})):calls.length===2?new Response(JSON.stringify({data:[{id:'school'}],meta:{limit:25,offset:0,total:1}})):new Response(null,{status:204});});
 const http=createHttp(fetcher as typeof fetch); await http.csrf();
 expect(await http.page('/schools')).toEqual({data:[{id:'school'}],meta:{limit:25,offset:0,total:1}});
 expect(await http.send('/student/sessions/current','DELETE')).toBeUndefined();
 expect(calls.every(c=>c.credentials==='include')).toBe(true);
 expect(new Headers(calls[2].headers).get('X-CSRF-Token')).toBe('memory-csrf');
 expect(new Headers(calls[2].headers).has('Authorization')).toBe(false);
});
test('structured error retains revision facts and request identity without retry',async()=>{
 const fetcher=vi.fn(async()=>new Response(JSON.stringify({error:{code:'ANSWER_REVISION_CONFLICT',message:'Konflik',details:{latest_answer:{revision:3}}},request_id:'request-1'}),{status:409}));
 const http=createHttp(fetcher as typeof fetch);
 await expect(http.get('/student/me')).rejects.toMatchObject({status:409,code:'ANSWER_REVISION_CONFLICT',details:{latest_answer:{revision:3}},requestId:'request-1'});
 expect(fetcher).toHaveBeenCalledTimes(1); expect(ApiError).toBeDefined();
});
