import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx/xlsx.mjs';
import {readFileSync} from 'node:fs';
import {electionWorkbook} from '../lib/voting-workbook.ts';
test('Excel report preserves result cells and embeds school logo with drawing relationships',()=>{
 const logo=readFileSync(new URL('../public/school-logo.png',import.meta.url));const bytes=electionWorkbook([['Belhaveen'],['Candidate','Votes'],['Example',7]],logo);
 const wb=XLSX.read(bytes,{type:'array'});assert.equal(wb.Sheets['Election results'].B3.v,7);
 const zip=XLSX.CFB.read(Buffer.from(bytes),{type:'buffer'});assert.deepEqual(Buffer.from(XLSX.CFB.find(zip,'/xl/media/school-logo.png').content),logo);
 assert.match(Buffer.from(XLSX.CFB.find(zip,'/xl/worksheets/sheet1.xml').content).toString(),/drawing r:id="rIdLogo"/);
});
