import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const source = fs.readFileSync('app/api/admin/upload/route.js','utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
let writes=0; let authorized=true; let permitted=true;
const fakeFs = { access: async () => {}, mkdir: async () => {}, writeFile: async () => { writes++; } };
const factory = new Function('NextResponse','requireAuth','requirePermission','getCollection','uuidv4','fs','path','clientAddress','consumeRateLimit',source+'\nreturn POST;');
const POST = factory({json:(data,init)=>Response.json(data,init)},async()=>({authenticated:authorized,user:{id:'test-owner',email:'test@example.com'}}),async()=>({authorized:permitted}),async()=>({insertOne:async()=>{}}),()=> 'test-id',fakeFs,path,()=> 'test-ip',async()=>{});
function upload(type,bytes=new Uint8Array(8)) { const form=new FormData();form.append('file',new Blob([bytes],{type}),'test-file');return new Request('https://burhanstore.com/api/admin/upload',{method:'POST',body:form}); }
authorized=false;assert.equal((await POST(upload('image/png'))).status,401);authorized=true;
permitted=false;assert.equal((await POST(upload('image/png'))).status,403);permitted=true;
assert.equal((await POST(upload('image/svg+xml'))).status,415);
assert.equal((await POST(upload('image/png',new Uint8Array(3*1024*1024)))).status,413);
assert.equal((await POST(upload('image/png'))).status,415,'Malformed image bytes must never fall back to raw storage');
assert.equal(writes,0);
console.log('Upload security passed: auth/permission, type/size/decoder rejection, no raw-file fallback writes.');
