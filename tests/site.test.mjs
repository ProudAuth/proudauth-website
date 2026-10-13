import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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
test('API operations exactly match the source contract',()=>{
  const spec=JSON.parse(fs.readFileSync(path.join(output,'docs/api/openapi.json'),'utf8'));
  const expected=Object.values(spec.paths).reduce((n,item)=>n+['get','post','patch','put','delete','options','head'].filter(m=>item[m]).length,0);
  const actual=htmlFiles.reduce((n,f)=>n+(fs.readFileSync(f,'utf8').match(/class="operation"/g)||[]).length,0);
  assert.equal(actual,expected);
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
  assert(routes.length>100);
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
