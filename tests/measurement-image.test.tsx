import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,test} from 'vitest';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {MeasurementPhoto} from '../src/components/MeasurementPhoto';

afterEach(cleanup);
const asset='assets/illustrations/measurement-scale-0da8acfb.jpg';

test('shared measurement image uses the supplied illustration with its true dimensions',()=>{
 render(<MeasurementPhoto/>);
 const image=screen.getByRole('img');
 expect(image.getAttribute('src')).toBe('/'+asset);
 expect(image.getAttribute('width')).toBe('1280');
 expect(image.getAttribute('height')).toBe('767');
 expect(image.getAttribute('alt')).toBe('Ilustrasi timbangan digital hijau dengan pita pengukur');
 expect(image.getAttribute('fetchpriority')).toBe('high');
 expect(screen.getByText('PENGUKURAN TUBUH')).toBeTruthy();
 // The printed illustration value is artwork, never an application measurement.
 expect(screen.queryByText(/52\.3/)).toBeNull();
});

test('the published illustration preserves the exact user-supplied JPEG bytes',()=>{
 const path=new URL('../public/'+asset,import.meta.url);
 expect(existsSync(path)).toBe(true);
 expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe('0da8acfb48031c5b516eef62636211f5ef050afdfa461d8bd17fa29eb17462d2');
});

test('existing compact image callers can still omit the caption',()=>{
 const {container}=render(<MeasurementPhoto caption={false}/>);
 expect(screen.getByRole('img')).toBeTruthy();
 expect(container.querySelector('figcaption')).toBeNull();
});
