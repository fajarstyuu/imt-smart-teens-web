import {expect,test,vi} from 'vitest';
import {renderHook,act,render,cleanup,within} from '@testing-library/react';
import {useAction,Dialog,ConfirmDialog} from '../src/components/ui';
test('pending action guard is synchronous for two submissions before React rerenders',async()=>{
 let complete!:()=>void;const pending=new Promise<void>(resolve=>{complete=resolve;});const callback=vi.fn(()=>pending);const {result}=renderHook(()=>useAction());
 let first:Promise<void>,second:Promise<void>;
 act(()=>{first=result.current.run(callback);second=result.current.run(callback);});
 expect(callback).toHaveBeenCalledTimes(1);await act(async()=>{complete();await Promise.all([first!,second!]);});
});

test('coexisting dialogs have distinct accessible title associations',()=>{
 const {container}=render(<><Dialog open={false} title="Menu" onClose={()=>{}}>Menu</Dialog><Dialog open={false} title="Aide" onClose={()=>{}}>Aide</Dialog></>);
 const ids=[...container.querySelectorAll('dialog')].map(d=>d.getAttribute('aria-labelledby'));
 expect(new Set(ids).size).toBe(2);ids.forEach(id=>expect(container.querySelector(`[id="${id}"]`)).not.toBeNull());cleanup();
});

test('a failed confirmed mutation exposes its error inside the active modal',()=>{
 const {getByRole}=render(<ConfirmDialog open title="Arsipkan?" description="Konfirmasi arsip" error="Revisi telah berubah. Muat ulang data." onClose={()=>{}} onConfirm={()=>{}}/>);
 expect(within(getByRole('dialog')).getByRole('alert').textContent).toContain('Revisi telah berubah');cleanup();
});
