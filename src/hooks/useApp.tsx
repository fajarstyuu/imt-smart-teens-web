import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppServices } from '../services/contracts';
import type { Bootstrap, Student, Teacher } from '../domain/types';
const fallback: Bootstrap = {config:{brand:'Imt Smart Teens',program:'Pembelajaran gizi siswa',mode:'development'},student:null,teacher:null};
interface AppContext { services: AppServices; data: Bootstrap; loading: boolean; error: string; reload(): Promise<void>; setStudent(s: Student | null): void; setTeacher(t: Teacher | null): void }
const Context = createContext<AppContext | null>(null);
export function AppProvider({services,children}:{services:AppServices;children:ReactNode}) {
  const [data,setData] = useState(fallback); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  const reload = async () => {setError('');setLoading(true);try {setData(await services.bootstrap());}catch(e){setError((e as Error).message);}finally{setLoading(false);}};
  useEffect(() => {void reload();},[services]);
  return <Context.Provider value={{services,data,loading,error,reload,setStudent:s=>setData(d=>({...d,student:s})),setTeacher:t=>setData(d=>({...d,teacher:t}))}}>{children}</Context.Provider>;
}
export function useApp() { const value=useContext(Context); if(!value) throw new Error('AppProvider required'); return value; }
