/** Authenticated idempotency journal, scoped by enrollment and action. Never auto-retry. */
import {ApiError} from './http';
export class OperationKeys {
 constructor(private storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>){}
 async run<T>(scope:string,payload:unknown,send:(key:string)=>Promise<T>):Promise<T>{
  const name=`imt-operation:${scope}`,fingerprint=JSON.stringify(payload);let record:{key:string;fingerprint:string};let pendingBefore=false;
  try{const raw=this.storage.getItem(name);pendingBefore=!!raw;record=raw?JSON.parse(raw):{key:crypto.randomUUID(),fingerprint};if(record.fingerprint!==fingerprint)throw Error('Operasi sebelumnya belum pasti. Coba lagi dengan nilai sebelumnya sebelum mengubahnya.');this.storage.setItem(name,JSON.stringify(record));}catch(e){throw e instanceof Error?e:Error('Penyimpanan operasi tidak tersedia.');}
  try{const result=await send(record.key);this.storage.removeItem(name);return result;}
  // A later rejection cannot disprove an earlier commit whose response was lost.
  catch(error){if(!pendingBefore&&error instanceof ApiError&&[400,404,409,422].includes(error.status)&&error.code!=='IDEMPOTENCY_CONFLICT')this.storage.removeItem(name);throw error;}
 }
}
