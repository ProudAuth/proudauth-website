import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lock=JSON.parse(fs.readFileSync(path.join(root,'content.lock.json'),'utf8'));
const allowed=/^(?:content\/snapshot\/(?:docs\/(?:protocols|integrations|operations|architecture-decisions|threat-models)\/[^/]+\.md|docs\/operations\/bench-results\/[\w./-]+\.(?:json|txt|tsv|yaml)|docs\/integrations\/sdk-repositories\.json|sdk\/(?:go|node|dart|php|dotnet)\/README\.md|api\/(?:events|hooks|schemas|plugins|workflows)\/[^/]+\.(?:json|md)|api\/openapi\/proudauth\.yaml|CHANGELOG\.md|LICENSE|NOTICE)|vendor\/(?:marked\.cjs|marked\.LICENSE\.md|js-yaml\.cjs|js-yaml\.LICENSE|swagger-ui\/[a-zA-Z0-9._-]+))$/;
const seen=new Set();
for(const item of lock.files){
  if(!allowed.test(item.path)||item.path.split('/').includes('..')||/(?:seed|credentials|secrets|support-bundle|initial-attempt)[^/]*\.(?:json|txt|tsv|yaml)$/i.test(item.path)||/(?:^|\/)\.state(?:\/|$)/.test(item.path))throw new Error(`Disallowed imported path: ${item.path}`);
  if(seen.has(item.path))throw new Error(`Duplicate input: ${item.path}`);
  seen.add(item.path);
  const data=fs.readFileSync(path.join(root,item.path));
  if(crypto.createHash('sha256').update(data).digest('hex')!==item.sha256)throw new Error(`Snapshot hash mismatch: ${item.path}`);
  if(!/^[a-f0-9]{64}$/.test(item.sourceSha256))throw new Error(`Missing source-byte provenance: ${item.path}`);
  if(item.upstream?.commitPinned && (!/^[a-f0-9]{40}$/.test(item.upstream.commit)||!/^https:\/\/github\.com\/proudbase\/proudauth(?:-sdk-(?:go|node|dart|php|dotnet))?$/.test(item.upstream.repository)))throw new Error(`Invalid upstream commit provenance: ${item.path}`);
  const text=data.toString('utf8');
  if(item.path.startsWith('content/') && /\/Users\/[A-Za-z0-9_.-]+\//.test(text))throw new Error(`Private local path: ${item.path}`);
}
function walk(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(directory,item.name)):[path.join(directory,item.name)]);}
for(const file of walk(path.join(root,'content/snapshot'))){
  const relative=path.relative(root,file).split(path.sep).join('/');
  if(!seen.has(relative))throw new Error(`Unmanifested imported file: ${relative}`);
}
if(lock.source.dirty && lock.source.commitPinned)throw new Error('A dirty source snapshot must not claim commit-pinned provenance');
console.log(`Verified ${lock.files.length} imported files; ${lock.state}, commitPinned=${lock.source.commitPinned}`);
