import { expect,test,vi } from 'vitest';
import { EnrollmentOperation } from '../src/services/enrollment';
const identity={name:'Siswa sintetis',school:'school-id',date:'2026-11-16'};
const memory=()=>{let v:string|null=null;return {getItem:()=>v,setItem:(_k:string,x:string)=>{v=x;},removeItem:()=>{v=null;}};};
test('response loss retains exact key, validated payload and original CSRF; changing payload cannot create a second action',async()=>{
 const send=vi.fn().mockRejectedValueOnce(new Error('response lost')).mockResolvedValueOnce({ok:true});
 const op=new EnrollmentOperation(memory());
 await expect(op.run(identity,'original',send)).rejects.toThrow('response lost');
 await expect(op.run({...identity,name:'Changed'},'new-token',send)).rejects.toThrow(/identitas/);
 await op.run(identity,'new-token',send);
 expect(send.mock.calls[0]).toEqual(send.mock.calls[1]);expect(send.mock.calls[1][2]).toBe('original');
});
test('reload leaves uncertain unauthenticated enrollment blocked even with freshly fetched CSRF',async()=>{
 const storage=memory();const first=new EnrollmentOperation(storage);
 await expect(first.run(identity,'old',async()=>{throw Error('lost');})).rejects.toThrow();
 const restored=new EnrollmentOperation(storage);const send=vi.fn();
 expect(restored.pending()).toEqual(identity);
 await expect(restored.run(identity,'fresh',send)).rejects.toThrow(/konteks/i);expect(send).not.toHaveBeenCalled();
 restored.recovered();expect(restored.pending()).toBeNull();
});
