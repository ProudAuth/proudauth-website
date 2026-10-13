import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(const ready of [true,false])test(`public summary is sanitized and ${ready?'operational':'degraded'}`,async t=>{
  let calls=0;
  const fake=http.createServer((request,response)=>{
    calls++;
    response.setHeader('Content-Type','application/json');
    response.end(JSON.stringify({status:ready?'ready':'draining',private:'PRIVATE_OPERATOR_SENTINEL'}));
  });
  fake.listen(0,'127.0.0.1');await once(fake,'listening');
  t.after(()=>new Promise(resolve=>fake.close(resolve)));
  const target=`http://127.0.0.1:${fake.address().port}/`;
  const reservation=http.createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');
  const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pa-docs-status-'));
  fs.copyFileSync(path.join(root,'scripts/status.mjs'),path.join(temp,'status.mjs'));
  for(const file of ['status.html','status.js','site.css','favicon.svg'])fs.copyFileSync(path.join(root,'src/assets',file),path.join(temp,file));
  const child=spawn(process.execPath,[path.join(temp,'status.mjs')],{env:{...process.env,STATUS_PORT:String(port),IDENTITY_HEALTH_URL:target,DOCS_HEALTH_URL:target,HOME_HEALTH_URL:target},stdio:'ignore'});
  t.after(async()=>{
    const done=once(child,'exit');child.kill('SIGTERM');await done;
    fs.rmSync(temp,{recursive:true,force:true});
  });
  const origin=`http://127.0.0.1:${port}`;
  let response;
  for(let n=0;n<40;n++){
    try {response=await fetch(origin+'/health.json',{signal:AbortSignal.timeout(500)});break;}catch{await delay(50);}
  }
  assert(response?.ok,'status process must become ready');
  const text=await response.text(),body=JSON.parse(text);
  assert.equal(body.status,ready?'operational':'degraded');
  assert.equal(body.components[0].status,ready?'operational':'unavailable');
  assert.equal(body.components.length,3);
  assert(!text.includes('PRIVATE_OPERATOR_SENTINEL'));
  assert(!text.includes(target));
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal((await fetch(origin+'/.env')).status,404);
  assert.equal((await fetch(origin+'/status?url='+encodeURIComponent(target))).status,404);
  assert.equal((await fetch(origin+'/health.json',{method:'POST'})).status,405);
  assert.equal(calls,3,'unknown routes must not fetch an arbitrary target');
});
