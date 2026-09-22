import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const root=new URL('.',import.meta.url);const schema=JSON.parse(await fs.readFile(new URL('source-schema.json',root),'utf8'));
const w=await SpreadsheetFile.importXlsx(await FileBlob.load(fileURLToPath(new URL('source-excerpt.xlsm',root))));
console.log((await w.inspect({kind:'table',range:'Template!A4:F9',tableMaxRows:6,tableMaxCols:6,maxChars:1600})).ndjson);
const p=await w.render({sheetName:'Template',range:'A4:F9',scale:1});await fs.writeFile(new URL('source-preview.png',root),new Uint8Array(await p.arrayBuffer()));


