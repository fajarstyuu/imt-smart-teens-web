import {useCallback,useLayoutEffect,useRef} from 'react';

// Each mounted editor owns its guard: saving or unmounting one must not clear another.
const owners=new Set<symbol>();
export const navigationAllowed=()=>owners.size===0||window.confirm('Perubahan belum disimpan. Tinggalkan halaman dan abaikan perubahan?');
export function useUnsaved(value:boolean){
 const owner=useRef(Symbol('unsaved'));
 const clear=useCallback(()=>{owners.delete(owner.current);},[]);
 useLayoutEffect(()=>{
  const key=owner.current;
  if(value)owners.add(key);else owners.delete(key);
  const warn=(event:BeforeUnloadEvent)=>{if(owners.has(key)){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',warn);
  return()=>{owners.delete(key);window.removeEventListener('beforeunload',warn);};
 },[value]);
 return clear;
}
