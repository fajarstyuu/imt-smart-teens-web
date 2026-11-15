import {expect,test,vi,afterEach} from 'vitest';
import {render,screen,cleanup,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MeasurementHistory} from '../src/components/MeasurementHistory';
import {http} from '../src/services/http';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
test('measurement history reads bounded pages and displays server bmi_display without recalculating',async()=>{
 const page=vi.spyOn(http,'page').mockResolvedValueOnce({data:[{id:'m',weight_kg:45.5,height_cm:155,bmi:999,bmi_display:'18.9',created_at:'recorded'}],meta:{limit:25,offset:0,total:26}}).mockResolvedValueOnce({data:[],meta:{limit:25,offset:25,total:26}});
 render(<MeasurementHistory refreshKey="m"/>);await screen.findByText(/IMT 18.9/);expect(screen.queryByText(/999/)).toBeNull();await userEvent.click(screen.getByRole('button',{name:'Berikutnya',exact:true}));await waitFor(()=>expect(page).toHaveBeenLastCalledWith('/student/measurements?limit=25&offset=25'));
});
