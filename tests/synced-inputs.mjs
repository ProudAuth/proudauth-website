// Expected website contents derived from the synced inputs (content.lock.json and
// the OpenAPI contract), so a release that adds or removes an endpoint, a guide or
// a schema needs no test edit. The tests pair these with floors so that an empty
// or partial sync still fails.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const yaml=require('../vendor/js-yaml.cjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const snapshot='content/snapshot/';
export const lock=JSON.parse(fs.readFileSync(path.join(root,'content.lock.json'),'utf8'));
const locked=pattern=>lock.files.map(item=>item.path).filter(item=>item.startsWith(snapshot)&&pattern.test(item.slice(snapshot.length)));

// Every path+method operation of the synced contract, using all OpenAPI 3.1
// path-item methods so that the build cannot silently skip one.
const contract=yaml.load(fs.readFileSync(path.join(root,snapshot,'api/openapi/proudauth.yaml'),'utf8'));
export const contractOperations=Object.entries(contract.paths||{}).flatMap(([route,item])=>
  ['get','put','post','delete','options','head','patch','trace'].filter(method=>item[method]).map(method=>({method,route,tag:item[method].tags?.[0]||'Other'})));
export const contractTags=new Set(contractOperations.map(op=>op.tag));

// Markdown that scripts/build.mjs publishes as guides: the locked service documents
// (including the history and per-release decision records), changelog, schema
// READMEs and SDK READMEs, plus the website's own pages.
export const lockedGuides=locked(/^(?:docs\/(?:protocols|integrations|operations|architecture-decisions|threat-models|history|releases)\/[^/]+\.md|sdk\/[a-z]+\/README\.md|CHANGELOG\.md|api\/(?:events|hooks)\/README\.md)$/);
export const localGuides=['getting-started','sdks','reference'].flatMap(directory=>
  fs.readdirSync(path.join(root,'src/content',directory)).filter(name=>name.endsWith('.md')).map(name=>`src/content/${directory}/${name}`));
// Pages generated besides the guides: one per API group, the API overview, schema
// definitions, license & notices and the documentation welcome page.
export const expectedPages=lockedGuides.length+localGuides.length+contractTags.size+4;

// Downloads published for every build: each locked event, hook, schema, plugin and
// workflow JSON document, at /docs/downloads/<source path>.
export const lockedSchemas=locked(/^api\/(?:events|hooks|schemas|plugins|workflows)\/[^/]+\.json$/).map(item=>item.slice(snapshot.length));
export const lockedSnapshotPaths=new Set(lock.files.map(item=>item.path).filter(item=>item.startsWith(snapshot)).map(item=>item.slice(snapshot.length)));
