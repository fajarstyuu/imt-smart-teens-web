import { vi } from 'vitest';
Object.defineProperty(window,'scrollTo',{value:vi.fn(),writable:true});
Object.defineProperty(window,'confirm',{value:vi.fn(()=>true),writable:true});
HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
// Node 25 exposes an unrelated experimental localStorage; use a DOM-like store.
const values=new Map<string,string>();
vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,String(value));},removeItem:(key:string)=>{values.delete(key);},clear:()=>values.clear(),key:(i:number)=>[...values.keys()][i]??null,get length(){return values.size;}});
