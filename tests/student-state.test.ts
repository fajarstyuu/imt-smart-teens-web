import {expect,test,vi} from 'vitest';
import {ApiError} from '../src/services/http';
import {OperationKeys} from '../src/services/operations';
import {stageUnlocked,stageComplete,stages,currentStage} from '../src/domain/learning';
import type {Student} from '../src/domain/types';
test('authenticated uncertain actions keep operation keys across reload and reject changed payloads',async()=>{
 let value:string|null=null;const storage={getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;},removeItem:()=>{value=null;}};
 const first=new OperationKeys(storage);const send=vi.fn().mockRejectedValueOnce(Error('lost')).mockResolvedValue({});
 await expect(first.run('measurement',{weight_kg:40},send)).rejects.toThrow('lost');
 const restored=new OperationKeys(storage);
 await expect(restored.run('measurement',{weight_kg:41},send)).rejects.toThrow(/sebelumnya/);
 await restored.run('measurement',{weight_kg:40},send);expect(send.mock.calls[0]).toEqual(send.mock.calls[1]);
});
test('student progression has no legacy global quiz stage',()=>{
 expect(stages.map(x=>x.id)).toEqual(['pre','lessons','calculator','post']);
 const s={lessons:[],attempts:{},serverProgress:{current_stage:'calculator',stages:[{id:'pre_test',status:'completed'},{id:'lessons',status:'completed'},{id:'calculator',status:'in_progress'}]}} as unknown as Student;
 expect(currentStage(s).id).toBe('calculator');
});

test('authenticated uncertainty survives a later 422 and reload without releasing its key',async()=>{
 let value:string|null=null;const storage={getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;},removeItem:()=>{value=null;}};
 const send=vi.fn().mockRejectedValueOnce(Error('lost')).mockRejectedValueOnce(new ApiError('rejected',422,'INVALID_MEASUREMENT')).mockResolvedValue({});
 await expect(new OperationKeys(storage).run('measurement',{weight_kg:40},send)).rejects.toThrow();
 await expect(new OperationKeys(storage).run('measurement',{weight_kg:40},send)).rejects.toThrow();
 await new OperationKeys(storage).run('measurement',{weight_kg:40},send);expect(send.mock.calls[2][0]).toBe(send.mock.calls[0][0]);
});
