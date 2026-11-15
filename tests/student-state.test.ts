import {expect,test,vi} from 'vitest';
import {ApiError} from '../src/services/http';
import {OperationKeys} from '../src/services/operations';
import {stageUnlocked,stageComplete} from '../src/domain/learning';
import type {Student} from '../src/domain/types';
test('authenticated uncertain actions keep operation keys across reload and reject changed payloads',async()=>{
 let value:string|null=null;const storage={getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;},removeItem:()=>{value=null;}};
 const first=new OperationKeys(storage);const send=vi.fn().mockRejectedValueOnce(Error('lost')).mockResolvedValue({});
 await expect(first.run('measurement',{weight_kg:40},send)).rejects.toThrow('lost');
 const restored=new OperationKeys(storage);
 await expect(restored.run('measurement',{weight_kg:41},send)).rejects.toThrow(/sebelumnya/);
 await restored.run('measurement',{weight_kg:40},send);expect(send.mock.calls[0]).toEqual(send.mock.calls[1]);
});
test('route permissions follow Rust stage projection, not inferred client records',()=>{
 const s={lessons:[],attempts:{},serverProgress:{stages:[{id:'pre_test',status:'completed'},{id:'lessons',status:'in_progress'},{id:'quiz',status:'locked'}]}} as unknown as Student;
 expect(stageComplete(s,'pre')).toBe(true);expect(stageUnlocked(s,'lessons')).toBe(true);expect(stageUnlocked(s,'quiz')).toBe(false);
});

test('authenticated uncertainty survives a later 422 and reload without releasing its key',async()=>{
 let value:string|null=null;const storage={getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;},removeItem:()=>{value=null;}};
 const send=vi.fn().mockRejectedValueOnce(Error('lost')).mockRejectedValueOnce(new ApiError('rejected',422,'INVALID_MEASUREMENT')).mockResolvedValue({});
 await expect(new OperationKeys(storage).run('measurement',{weight_kg:40},send)).rejects.toThrow();
 await expect(new OperationKeys(storage).run('measurement',{weight_kg:40},send)).rejects.toThrow();
 await new OperationKeys(storage).run('measurement',{weight_kg:40},send);expect(send.mock.calls[2][0]).toBe(send.mock.calls[0][0]);
});
