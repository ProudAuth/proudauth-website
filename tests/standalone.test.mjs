import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {once} from 'node:events';
import http from 'node:http';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createPreviewServer} from '../scripts/preview.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const config=JSON.parse(fs.readFileSync(path.join(root,'site.config.json'),'utf8'));
const read=relative=>fs.readFileSync(path.join(output,relative),'utf8');

test('landing, canonical guide URLs and every search result use the merged website',()=>{
  const home=read('index.html');
  assert(home.includes('href="/docs"'));
  assert(home.includes('href="/docs/api/"'));
  assert(home.includes('https://api.proudauth.com/realms/main/.well-known/openid-configuration'));
  const overview=read('docs/getting-started/overview/index.html');
  assert(overview.includes('href="https://proudauth.com/docs/getting-started/overview/"'));
  assert(overview.includes('src="/docs/assets/site.js"'));
  assert(overview.includes('data-docs-base="/docs"'));
  const search=JSON.parse(read('docs/search-index.json'));
  for(const page of search){
    assert(page.url.startsWith('/docs/'),`Search result escapes docs path: ${page.url}`);
    const [route,fragment]=page.url.split('#');
    const file=path.join(output,route,'index.html');
    assert(fs.existsSync(file),`Missing search destination: ${page.url}`);
    if(fragment)assert(fs.readFileSync(file,'utf8').includes(`id="${fragment}"`),`Missing operation anchor: ${page.url}`);
  }
  const javascript=read('docs/assets/site.js');
  assert(javascript.includes('`${doc.dataset.docsBase}/search-index.json`'));
  assert(!javascript.includes("fetch('/search-index.json')"));
  const sitemap=read('docs/sitemap.xml');
  assert(!sitemap.includes('docs.proudauth.com'));
  assert(sitemap.includes('https://proudauth.com/docs/'));
});

test('Swagger, source provenance and downloads remain local and credentials-free',()=>{
  const html=read('docs/api/explorer/index.html');
  for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    assert(url.startsWith('/docs/'),`Explorer dependency must use the documentation base: ${url}`);
    const candidate=path.join(output,url);
    assert(fs.existsSync(candidate),`Missing explorer dependency: ${url}`);
  }
  const init=read('docs/api/explorer/initialize.js');
  assert(init.includes("url:'/docs/api/openapi.json'"));
  assert(init.includes('supportedSubmitMethods:[]'));
  assert(init.includes('persistAuthorization:false'));
  const info=JSON.parse(read('docs/build-info.json'));
  const inputLock=JSON.parse(fs.readFileSync(path.join(root,'content.lock.json'),'utf8'));
  assert.deepEqual(info.source,inputLock.source);
  if(info.source.dirty)assert.equal(info.source.commitPinned,false);
  assert.equal(info.guides,101);
  assert.equal(info.apiOperations,603);
  const lock=JSON.parse(read('docs/content.lock.json'));
  assert.equal(lock.source.head,info.source.head);
  for(const input of lock.files){
    const data=fs.readFileSync(path.join(root,input.path));
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'),input.sha256);
  }
  assert(fs.existsSync(path.join(output,'docs/api/explorer/LICENSE')));
  assert(fs.existsSync(path.join(output,'docs/api/explorer/swagger-ui-standalone-preset.js.LICENSE.txt')));
});

test('preview serves the real merged paths and preserves canonical redirect paths and queries',async t=>{
  const server=createPreviewServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin=`http://127.0.0.1:${server.address().port}`;
  for(const route of ['/','/docs/','/docs/api/','/docs/api/explorer/','/docs/assets/site.js','/docs/search-index.json','/docs/api/openapi.yaml']){
    const response=await fetch(origin+route);
    assert.equal(response.status,200,route);
    assert.equal(response.headers.get('x-content-type-options'),'nosniff');
    await response.body?.cancel();
  }
  let response=await fetch(origin+'/docs?lang=en',{redirect:'manual'});
  assert.equal(response.status,308);assert.equal(response.headers.get('location'),'/docs/?lang=en');
  const requestHost=(pathname,host)=>new Promise((resolve,reject)=>{
    http.get(origin+pathname,{headers:{Host:host}},result=>{result.resume();resolve(result);}).on('error',reject);
  });
  response=await requestHost('/docs/api/?view=compact','www.proudauth.com');
  assert.equal(response.statusCode,308);assert.equal(response.headers.location,'https://proudauth.com/docs/api/?view=compact');
  response=await requestHost('/sdks/go/?version=0.2','docs.proudauth.com');
  assert.equal(response.statusCode,308);assert.equal(response.headers.location,'https://proudauth.com/docs/sdks/go/?version=0.2');
  assert.equal((await fetch(origin+'/.env')).status,404);
  assert.equal((await fetch(origin+'/.state/backup.dump')).status,404);
  assert.equal((await fetch(origin+'/%2eenv')).status,404);
  assert.equal((await fetch(origin+'/docs/',{method:'POST'})).status,405);
});

test('snapshot verifier rejects a changed imported document',t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pa-website-snapshot-check-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  for(const directory of ['content','vendor'])fs.cpSync(path.join(root,directory),path.join(temp,directory),{recursive:true});
  fs.mkdirSync(path.join(temp,'scripts'));fs.copyFileSync(path.join(root,'scripts/verify-content.mjs'),path.join(temp,'scripts/verify-content.mjs'));
  fs.copyFileSync(path.join(root,'content.lock.json'),path.join(temp,'content.lock.json'));
  let result=spawnSync(process.execPath,['scripts/verify-content.mjs'],{cwd:temp,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  fs.appendFileSync(path.join(temp,'content/snapshot/sdk/node/README.md'),'\nUNREVIEWED CHANGE\n');
  result=spawnSync(process.execPath,['scripts/verify-content.mjs'],{cwd:temp,encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert(result.stderr.includes('Snapshot hash mismatch: content/snapshot/sdk/node/README.md'));
});
