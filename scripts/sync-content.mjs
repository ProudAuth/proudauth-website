// Explicit, reviewable import; the website build itself never fetches content.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {publicText} from './publication.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=new Map(process.argv.slice(2).map(arg=>{
  const match=arg.match(/^--(service|sdk-root|service-commit|release)=(.+)$/);
  if(!match)throw new Error('Usage: node scripts/sync-content.mjs --service=PATH --sdk-root=PATH [--release=vX.Y.Z | --service-commit=SHA]');
  return [match[1],match[2]];
}));
if(!args.has('service')||!args.has('sdk-root'))throw new Error('Both explicit source paths are required.');
const service=path.resolve(args.get('service'));
const sdkRoot=path.resolve(args.get('sdk-root'));
const git=(directory,...parameters)=>execFileSync('git',['-C',directory,...parameters],{maxBuffer:32*1024*1024});
// A release tag is the normal input: its commit is pinned and the tag becomes
// the website's version, so pages never carry a hand-edited version number.
const release=args.get('release');
if(release&&!/^v[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$/.test(release))throw new Error('Release must be a tag such as v1.2.3 or v1.2.3-alpha.1.');
if(release&&args.has('service-commit'))throw new Error('Use either --release or --service-commit.');
const serviceCommit=release?git(service,'rev-parse',`${release}^{commit}`).toString('utf8').trim():args.get('service-commit');
if(serviceCommit&&!/^[a-f0-9]{40}$/.test(serviceCommit))throw new Error('Service commit must be a full SHA.');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const lock=JSON.parse(fs.readFileSync(path.join(root,'content.lock.json'),'utf8'));
const prefix='content/snapshot/';
const imported=new Map(lock.files.map(item=>[item.path,item]));
const approved=/^(?:docs\/(?:protocols|integrations|operations|architecture-decisions|threat-models)\/[^/]+\.md|docs\/integrations\/sdk-repositories\.json|docs\/operations\/bench-results\/[\w./-]+\.(?:json|txt|tsv|yaml)|api\/(?:events|hooks|schemas|plugins|workflows)\/[^/]+\.(?:json|md)|api\/openapi\/proudauth\.yaml|CHANGELOG\.md|LICENSE|NOTICE)$/;
const privateInput=/(?:seed|credentials|secrets|support-bundle|initial-attempt)[^/]*\.(?:json|txt|tsv|yaml)$/i;
// The release tree decides which documents exist: every allowlisted document
// and contract in it is imported, so a document the release adds or renames
// appears and one it removed leaves the snapshot instead of failing the sync.
// Benchmark result files stay curated: those already in the lock plus the ones
// named here, and only while the release still has them.
const previous=lock.files.filter(item=>item.path.startsWith(prefix)&&!item.path.startsWith(prefix+'sdk/')).map(item=>item.path.slice(prefix.length));
const isBench=relative=>relative.startsWith('docs/operations/bench-results/');
const curatedBench=[...previous.filter(isBench),
  ...['artifact-sha256.json','environment.json','postgres/settings.tsv','proudauth-config.yaml','summary.json']
    .map(name=>`docs/operations/bench-results/2026-10-18-laptop-alpha5-baselines/${name}`)];
let serviceFiles;
if(serviceCommit){
  const tree=new Set(git(service,'ls-tree','-r','--name-only',serviceCommit).toString('utf8').split('\n').filter(Boolean));
  serviceFiles=[...tree].filter(relative=>approved.test(relative)&&!isBench(relative)&&!privateInput.test(relative));
  serviceFiles.push(...curatedBench.filter(relative=>tree.has(relative)));
  for(const relative of previous){
    if(tree.has(relative))continue;
    imported.delete(prefix+relative);
    fs.rmSync(path.join(root,prefix+relative),{force:true});
    console.log(`Dropped ${relative}: not in ${release||serviceCommit}`);
  }
}else{
  serviceFiles=[...previous,'docs/operations/docker-compose.md','docs/operations/environment.md','docs/integrations/sdk-repositories.json','docs/protocols/api-conventions.md',
    ...curatedBench.filter(relative=>fs.existsSync(path.join(service,relative)))];
}
for(const relative of new Set(serviceFiles)){
  if(!approved.test(relative)||relative.split('/').includes('..')||/(?:seed|credentials|secrets|support-bundle|initial-attempt)[^/]*\.(?:json|txt|tsv|yaml)$/i.test(relative))throw new Error(`Disallowed source: ${relative}`);
  const bytes=serviceCommit?git(service,'show',`${serviceCommit}:${relative}`):fs.readFileSync(path.join(service,relative));
  const sanitized=Buffer.from(publicText(bytes.toString('utf8'),{temporaryPaths:relative.startsWith('docs/operations/bench-results/')}));
  const target=prefix+relative;
  const previous=imported.get(target);
  fs.mkdirSync(path.dirname(path.join(root,target)),{recursive:true});
  fs.writeFileSync(path.join(root,target),sanitized);
  imported.set(target,{
    path:target,source:relative,sourceSha256:hash(bytes),sha256:hash(sanitized),
    matchesHead:!!serviceCommit&&bytes.equals(sanitized),redacted:!bytes.equals(sanitized),
    initialSourceSha256:previous?.initialSourceSha256||previous?.previousSourceSha256||previous?.sourceSha256||hash(bytes),
    upstream:{repository:'https://github.com/proudauth/proudauth',commit:serviceCommit||null,path:relative,commitPinned:!!serviceCommit},
    ...(previous?.sourceSha256&&previous.sourceSha256!==hash(bytes)?{previousSourceSha256:previous.sourceSha256}:previous?.previousSourceSha256?{previousSourceSha256:previous.previousSourceSha256}:{})
  });
}
lock.sdkSources={};
for(const language of ['go','node','dart','php','dotnet']){
  const directory=path.join(sdkRoot,`proudauth-sdk-${language}`);
  const commit=git(directory,'rev-parse','HEAD').toString('utf8').trim();
  const remoteCommit=git(directory,'rev-parse','refs/remotes/origin/main').toString('utf8').trim();
  if(commit!==remoteCommit)throw new Error(`SDK ${language} must match its reviewed published origin/main snapshot.`);
  const repository=`https://github.com/proudauth/proudauth-sdk-${language}`;
  const remote=git(directory,'remote','get-url','origin').toString('utf8').trim().replace(/\.git$/,'');
  if(remote.toLowerCase()!==repository)throw new Error(`Unexpected SDK upstream: ${language}`);
  const bytes=git(directory,'show',`${commit}:README.md`);
  const target=`${prefix}sdk/${language}/README.md`;
  fs.mkdirSync(path.dirname(path.join(root,target)),{recursive:true});
  fs.writeFileSync(path.join(root,target),bytes);
  imported.set(target,{path:target,source:'README.md',sourceSha256:hash(bytes),sha256:hash(bytes),matchesHead:true,redacted:false,upstream:{repository,commit,path:'README.md',commitPinned:true}});
  lock.sdkSources[language]={repository,commit,commitPinned:true};
}
lock.createdAt=new Date().toISOString();
lock.state=serviceCommit?'commit-pinned-service-and-sdks':'service-workspace-and-commit-pinned-sdks';
lock.source={description:release?`Published service release ${release}`:serviceCommit?'Published service source commit':'Prepared service workspace; not yet pinned to a published service commit',head:serviceCommit||lock.source.head,dirty:!serviceCommit,commitPinned:!!serviceCommit,...(release?{release}:{})};
lock.files=[...imported.values()].sort((a,b)=>a.path.localeCompare(b.path));
fs.writeFileSync(path.join(root,'content.lock.json'),JSON.stringify(lock,null,2)+'\n');
console.log(`Imported ${lock.files.length} allowlisted inputs; service commitPinned=${!!serviceCommit}; five SDK commits pinned.`);
