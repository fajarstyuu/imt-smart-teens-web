/** Rust-only cookie transport. Never retries mutations or refreshes CSRF implicitly. */
export class ApiError extends Error {
  constructor(message:string, public status=0, public code='NETWORK_UNCERTAIN', public details?:unknown, public requestId?:string) { super(message); }
}
export interface Page<T> { data:T[]; meta:{limit:number;offset:number;total:number} }
export function createHttp(fetcher:typeof fetch=(...args)=>fetch(...args)) {
  let csrfToken='';
  const raw=async(path:string,method='GET',body?:unknown,key?:string,csrfOverride?:string):Promise<unknown>=>{
    const headers=new Headers({Accept:'application/json'});
    if(body!==undefined)headers.set('Content-Type','application/json');
    if(method!=='GET')headers.set('X-CSRF-Token',csrfOverride??csrfToken);
    if(key)headers.set('Idempotency-Key',key);
    try {
      const response=await fetcher(`/api/v1${path}`,{method,headers,credentials:'include',body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
      if(response.status===204)return undefined;
      const envelope=await response.json();
      if(!response.ok)throw new ApiError(envelope.error?.message||'Permintaan gagal.',response.status,envelope.error?.code||'HTTP_ERROR',envelope.error?.details,envelope.request_id);
      if(!Object.hasOwn(envelope,'data'))throw new ApiError('Respons layanan tidak sesuai kontrak.',502,'INVALID_ENVELOPE');
      return envelope;
    } catch(error) {
      if(error instanceof ApiError)throw error;
      throw new ApiError('Koneksi terputus. Hasil operasi belum dapat dipastikan. Gunakan Coba lagi untuk operasi yang sama.');
    }
  };
  return {
    async get<T>(path:string):Promise<T>{return (await raw(path) as {data:T}).data;},
    async page<T>(path:string):Promise<Page<T>>{return await raw(path) as Page<T>;},
    async send<T>(path:string,method:string,body?:unknown,key?:string,csrfOverride?:string):Promise<T>{const result=await raw(path,method,body,key,csrfOverride);return result===undefined?undefined as T:(result as {data:T}).data;},
    async csrf(){csrfToken=(await raw('/csrf') as {data:{token:string}}).data.token;return csrfToken;},
    token:()=>csrfToken,
    rotate:(token:string)=>{csrfToken=token;}
  };
}
export const http=createHttp();
export const query=(values:Record<string,string|number|undefined>)=>{const params=new URLSearchParams();Object.entries(values).forEach(([k,v])=>{if(v!==undefined&&v!=='')params.set(k,String(v));});return params.size?`?${params}`:'';};
