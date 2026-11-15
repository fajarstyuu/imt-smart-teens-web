import { useEffect } from 'react';
let dirty=false;
export const clearUnsaved=()=>{dirty=false;};
export const navigationAllowed=()=>!dirty||window.confirm('Perubahan belum disimpan. Tinggalkan halaman dan abaikan perubahan?');
export function useUnsaved(value:boolean) {useEffect(()=>{dirty=value;const warn=(e:BeforeUnloadEvent)=>{if(value){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>{dirty=false;window.removeEventListener('beforeunload',warn);};},[value]);}
