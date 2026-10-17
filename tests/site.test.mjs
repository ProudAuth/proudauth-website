import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {searchText} from '../scripts/search-text.mjs';
import {contractOperations,expectedPages,lockedGuides} from './synced-inputs.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(output);
const htmlFiles=files.filter(f=>f.endsWith('.html'));
const decode=value=>value.replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"');

test('all published guide links and section anchors resolve',()=>{
  const failures=[];
  for(const file of htmlFiles){
    const html=fs.readFileSync(file,'utf8');
    for(const match of html.matchAll(/href="([^"\s]+)"/g)){
      const href=decode(match[1]);
      if(/^(https?:|mailto:)/.test(href))continue;
      const [pathname,fragment]=href.split('#');
      const base=pathname?path.join(output,pathname):file;
      const target=fs.existsSync(base)&&fs.statSync(base).isDirectory()?path.join(base,'index.html'):base;
      if(!fs.existsSync(target)){failures.push(`${path.relative(output,file)}: missing ${href}`);continue;}
      if(fragment&&target.endsWith('.html')){
        const body=target===file?html:fs.readFileSync(target,'utf8');
        if(!body.includes(`id="${decodeURIComponent(fragment)}"`))failures.push(`${path.relative(output,file)}: missing anchor ${href}`);
      }
    }
  }
  assert.deepEqual(failures,[]);
});
test('API operations exactly match the synced contract',()=>{
  // The source of truth is the synced OpenAPI document, not a fixed number.
  assert(contractOperations.length>=300,`The synced contract lists only ${contractOperations.length} operations`);
  const spec=JSON.parse(fs.readFileSync(path.join(output,'docs/api/openapi.json'),'utf8'));
  const published=Object.values(spec.paths).reduce((n,item)=>n+['get','put','post','delete','options','head','patch','trace'].filter(m=>item[m]).length,0);
  assert.equal(published,contractOperations.length,'The published contract keeps every operation');
  const rendered=htmlFiles.reduce((n,f)=>n+(fs.readFileSync(f,'utf8').match(/class="operation"/g)||[]).length,0);
  assert.equal(rendered,contractOperations.length,'Every operation is rendered once');
  const search=JSON.parse(fs.readFileSync(path.join(output,'docs/search-index.json'),'utf8'));
  assert.deepEqual(search.filter(p=>p.group.startsWith('API · ')).map(p=>p.title).sort(),
    contractOperations.map(op=>`${op.method.toUpperCase()} ${op.route}`).sort(),'Every operation is searchable');
  assert.equal(spec.servers[0].variables.origin.default,'https://identity.example.com');
  assert.equal(spec.info.license.url,'https://proudauth.com/docs/reference/license/');
});
test('publication excludes deployment secrets, source code and private seed material',()=>{
  const disallowed=files.filter(f=>/(?:^|\/)(?:\.env|\.git|secrets|images)(?:\/|$)|(?:seed|credentials|support-bundle).*\.json$/i.test(path.relative(output,f)));
  assert.deepEqual(disallowed,[]);
  for(const file of files){
    const data=fs.readFileSync(file,'utf8');
    assert(!data.match(/\/Users\/[A-Za-z0-9_.-]+\//),`private local path in ${path.relative(output,file)}`);
  }
  const routes=JSON.parse(fs.readFileSync(path.join(output,'docs/search-index.json'),'utf8'));
  assert(lockedGuides.length>=50,`content.lock.json lists only ${lockedGuides.length} guides`);
  assert.equal(routes.length,expectedPages+contractOperations.length,'One search entry per page and per API operation');
  assert(routes.some(p=>p.title==='C# & ASP.NET Core'));
  assert(routes.some(p=>p.title==='Go SDK'));
});
test('schema download dependencies resolve locally',()=>{
  for(const file of files.filter(f=>f.includes('/docs/downloads/api/')&&f.endsWith('.json'))){
    const document=JSON.parse(fs.readFileSync(file,'utf8'));
    const refs=JSON.stringify(document).matchAll(/"\$ref":"([^"#]+)(?:#[^"]*)?"/g);
    for(const [,ref] of refs){
      if(/^https?:/.test(ref))continue;
      assert(fs.existsSync(path.resolve(path.dirname(file),ref)),`schema dependency missing: ${path.relative(output,file)} -> ${ref}`);
    }
  }
});
test('search text includes table cells, list items and escaped identifiers',()=>{
  const text=searchText('# Title\n\nIntro with `code` & [a link](x.md).\n\n| Variable | Meaning |\n| --- | --- |\n| `PROUDAUTH_EXAMPLE` | Table cell |\n\n'
    +'- First item\n  - Nested **item**\n\n1. Ordered PROUDAUTH\\_ESCAPED\\_NAME\n\n> Quoted\n>\n> text\n');
  for(const phrase of ['Title Intro with code & a link.','Variable Meaning PROUDAUTH_EXAMPLE Table cell','First item Nested item','Ordered PROUDAUTH_ESCAPED_NAME','Quoted text'])
    assert(text.includes(phrase),`Missing "${phrase}" in: ${text}`);
  assert(!/x\.md|&amp;|\|/.test(text),`Markup left in: ${text}`);
});
test('search index finds the environment variables documented in a table',()=>{
  const search=JSON.parse(fs.readFileSync(path.join(output,'docs/search-index.json'),'utf8'));
  const environment=search.find(p=>p.url==='/docs/operations/environment/');
  assert(environment,'The environment guide is indexed');
  for(const name of ['PROUDAUTH_TRUSTED_PROXIES','PROUDAUTH_SMTP_TLS'])assert(environment.text.includes(name),`Search cannot find ${name}`);
  // Every variable the synced guide names, in its table or prose, is searchable on that page.
  const source=fs.readFileSync(path.join(root,'content/snapshot/docs/operations/environment.md'),'utf8');
  for(const name of new Set(source.match(/\bPROUDAUTH_[A-Z0-9_]+/g)))assert(environment.text.includes(name),`Search cannot find ${name}`);
});
