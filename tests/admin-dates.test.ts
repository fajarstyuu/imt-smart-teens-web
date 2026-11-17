import {expect,test} from 'vitest';
import {formatAdminTimestamp,formatCalendarDate,toWibInput,fromWibInput} from '../src/presentation/dates';
test('admin dates stop at minutes and explicitly use WIB, independent of browser timezone',()=>{
 expect(formatAdminTimestamp('2026-11-17T02:30:42.817Z')).toBe('17 Nov 2026, 09.30 WIB');
 expect(formatAdminTimestamp(null)).toBe('—');expect(formatAdminTimestamp('invalid')).toBe('—');
 expect(formatAdminTimestamp('2026-11-16T18:01:59Z')).toBe('17 Nov 2026, 01.01 WIB');
});
test('calendar dates never cross days and malformed inputs are not normalized',()=>{
 expect(formatCalendarDate('2026-11-17')).toBe('17 Nov 2026');expect(formatCalendarDate('2026-02-30')).toBe('—');
});
test('WIB datetime-local controls round trip UTC without relying on host timezone',()=>{
 expect(toWibInput('2026-11-16T18:30:20.900Z')).toBe('2026-11-17T01:30');
 expect(fromWibInput('2026-11-17T01:30')).toBe('2026-11-16T18:30:00.000Z');
 expect(fromWibInput('')).toBe('');expect(()=>fromWibInput('2026-02-30T01:30')).toThrow();
});
