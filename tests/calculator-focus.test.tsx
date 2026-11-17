import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {CalculatorPage} from '../src/pages/CalculatorPage';
import {AppProvider,useApp} from '../src/hooks/useApp';
import type {AppServices} from '../src/services/contracts';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
test('calculator focuses on the current result, not measurement history reads or deletion',async()=>{
 const services={bootstrap:async()=>({config:{brand:'IMT',mode:'development'},teacher:null,student:{identity:{name:'Siswa',school:'Sekolah',date:'2026-11-17'},measurement:null,attempts:{},lessons:{},serverProgress:{current_stage:'calculator',stages:[],lessons:[]}}})} as unknown as AppServices;
 render(<AppProvider services={services}><Ready/></AppProvider>);
 function Ready(){const {loading}=useApp();return loading?null:<CalculatorPage navigate={()=>{}}/>;}
 await screen.findByRole('heading',{name:'Kalkulator IMT',exact:true});
 expect(screen.queryByRole('heading',{name:'Riwayat pengukuran',exact:true})).toBeNull();
});
