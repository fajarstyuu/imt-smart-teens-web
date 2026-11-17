/** Admin workspace approved independently of the student shell. Server auth remains authoritative. */
import type {ReactNode} from 'react';
import {useState} from 'react';
import {ChevronDown,LogOut,FileText,BookOpen,ClipboardList,Upload,School} from 'lucide-react';
import {Brand,Button,Dialog,ErrorState,useAction} from './ui';
import {useApp} from '../hooks/useApp';
import {navigationAllowed} from '../hooks/useUnsaved';
const destinations=[{label:'Hasil siswa',path:'/admin/hasil',icon:ClipboardList},{label:'Materi',path:'/admin/materi',icon:BookOpen},{label:'Bank soal',path:'/admin/soal',icon:FileText},{label:'Publikasi',path:'/admin/publikasi',icon:Upload},{label:'Sekolah',path:'/admin/sekolah',icon:School}];
export function TeacherShell({path,navigate,children}:{path:string;navigate:(p:string)=>void;children:ReactNode}){
 const {data,services,setTeacher}=useApp();const [account,setAccount]=useState(false);const action=useAction();
 const current=destinations.find(item=>path.startsWith(item.path));
 const initials=(data.teacher?.name??'Admin').trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase();
 const logout=()=>{if(!navigationAllowed())return;void action.run(async()=>{await services.teacher.signOut();setTeacher(null);});};
 return <div className="teacher-app cms-workspace"><a className="skip-link" href="#main-content">Lewati ke konten utama</a><aside className="cms-sidebar"><Brand/><p className="cms-nav-caption">RUANG ADMIN</p><nav aria-label="Navigasi admin">{destinations.map(item=><button key={item.path} type="button" onClick={()=>navigate(item.path)} aria-current={path.startsWith(item.path)?'page':undefined}><item.icon className="od-icon" aria-hidden="true"/>{item.label}</button>)}</nav><p className="cms-sidebar-note">Pengelolaan pembelajaran<br/>Administrator global</p></aside><div className="cms-main-frame"><header className="cms-topbar"><p>Ruang admin <span aria-hidden="true">/</span> <strong>{current?.label??'Pengelolaan'}</strong></p><button type="button" className="teacher-account" onClick={()=>setAccount(true)}><span className="avatar">{initials}</span><span>{data.teacher?.name}</span><ChevronDown className="od-icon" aria-hidden="true"/></button></header><main id="main-content" tabIndex={-1} className="teacher-main">{children}</main><footer className="teacher-footer"><span>{data.config.brand} / Pengelolaan pembelajaran</span><span>Akses terbatas untuk admin</span></footer></div><Dialog open={account} onClose={()=>setAccount(false)} title="Akun admin"><p>{data.teacher?.name}<br/>{data.teacher?.email}</p>{action.error&&<ErrorState message={action.error}/>}<Button variant="secondary" busy={action.busy} onClick={logout}><LogOut className="od-icon"/>Keluar ruang admin</Button></Dialog></div>;
}
