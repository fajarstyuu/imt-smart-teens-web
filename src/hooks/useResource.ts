/** Cancellable read lifecycle: discard stale responses and clear private data on denial. */
import {useEffect,useState,type DependencyList} from 'react';
export function useResource<T>(load:()=>Promise<T>,dependencies:DependencyList=[]){
 const [data,setData]=useState<T|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{let live=true;setLoading(true);setData(null);setError('');load().then(result=>{if(live)setData(result);}).catch(e=>{if(live)setError((e as Error).message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[...dependencies,revision]);
 return {data,loading,error,reload:()=>setRevision(v=>v+1),setData};
}
