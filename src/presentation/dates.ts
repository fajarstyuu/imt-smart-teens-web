/** Human presentation only. Persisted timestamps remain precise UTC, calendar dates stay dates. */
const timestampFormatter=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const calendarFormatter=new Intl.DateTimeFormat('id-ID',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric'});
export function formatAdminTimestamp(value:string|null|undefined):string{
 if(!value)return '—';const date=new Date(value);if(!Number.isFinite(date.getTime()))return '—';
 const parts=timestampFormatter.formatToParts(date),part=(type:string)=>parts.find(p=>p.type===type)?.value??'';
 return `${part('day')} ${part('month')} ${part('year')}, ${part('hour')}.${part('minute')} WIB`;
}
export function formatCalendarDate(value:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return '—';
 const date=new Date(value+'T00:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return '—';return calendarFormatter.format(date);
}
/** The control explicitly represents WIB, even when the browser runs in another timezone. */
export function toWibInput(value:string):string{
 if(!value)return '';const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 return new Date(date.getTime()+7*60*60*1000).toISOString().slice(0,16);
}
export function fromWibInput(value:string):string{
 if(!value)return '';if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Tanggal dan waktu tidak valid.');
 const date=new Date(value+':00+07:00');if(!Number.isFinite(date.getTime())||toWibInput(date.toISOString())!==value)throw Error('Tanggal dan waktu tidak valid.');return date.toISOString();
}
