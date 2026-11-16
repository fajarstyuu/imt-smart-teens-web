/** Enrollment uncertainty journal. Persist only the operation/form, never CSRF or credentials.
 * A reloaded instance cannot prove that HttpOnly context cookies survived: fail closed.
 */
import type { Identity } from '../domain/types';
import { ApiError } from './http';
type StoragePort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const journalKey='imt-pending-enrollment-v1';
export class EnrollmentOperation {
  private operation:{identity:Identity;key:string}|null=null;
  private originalCsrf:string|null=null;
  private blocked=false;
  private uncertain=false;
  constructor(private storage:StoragePort) {
    try {const raw=storage.getItem(journalKey);if(raw){this.operation=JSON.parse(raw);this.blocked=true;}}catch{this.blocked=true;}
  }
  pending(){return this.operation?.identity??null;}
  isBlocked(){return this.blocked;}
  /** A successful POST is not a completed UI operation: required reads may still fail.
   * Block enrollment writes until authenticated projection + CSRF recovery finishes.
   * The journal remains credential-free and reload always starts blocked anyway.
   */
  committed(){if(this.operation)this.blocked=true;}
  recovered(){this.operation=null;this.originalCsrf=null;this.blocked=false;this.uncertain=false;try{this.storage.removeItem(journalKey);}catch{/* No identity/session is recovered from storage. */}}
  async run<T>(identity:Identity,csrf:string,send:(identity:Identity,key:string,csrf:string)=>Promise<T>):Promise<T>{
    if(this.blocked)throw new Error('Konteks pendaftaran tidak dapat dipastikan setelah muat ulang. Jangan membuat identitas baru. Coba pulihkan sesi tersimpan atau hubungi admin.');
    const normalized={...identity,name:identity.name.normalize('NFC').trim().replace(/\s+/gu,' ')};
    if(this.operation&&JSON.stringify(this.operation.identity)!==JSON.stringify(normalized))throw new Error('Operasi sebelumnya belum pasti. Pertahankan identitas semula untuk mencoba lagi.');
    if(!this.operation){
      this.operation={identity:normalized,key:crypto.randomUUID()};this.originalCsrf=csrf;
      try{this.storage.setItem(journalKey,JSON.stringify(this.operation));}catch{this.operation=null;throw new Error('Penyimpanan operasi tidak tersedia. Pendaftaran diblokir agar aman saat muat ulang.');}
    }
    try {const result=await send(this.operation.identity,this.operation.key,this.originalCsrf!);this.committed();return result;}
    catch(error){
      // Only a definitive INITIAL validation/availability rejection proves no identity committed.
      // A later 4xx/429 says nothing about a previous lost response; never release its key.
      const initialRejection=!this.uncertain&&error instanceof ApiError&&
        ([400,422].includes(error.status)||(error.status===409&&error.code==='CONTENT_NOT_AVAILABLE'));
      if(initialRejection)this.recovered();else this.uncertain=true;
      throw error;
    }
  }
}
