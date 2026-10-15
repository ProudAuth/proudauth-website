import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {publicText} from './publication.mjs';

const require = createRequire(import.meta.url);
const { marked } = require('../vendor/marked.cjs');
const yaml = require('../vendor/js-yaml.cjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteOutput = path.join(root, 'dist');
const output = path.join(siteOutput, 'docs');
const homeOutput = siteOutput;
const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const releaseUrl = `${config.serviceRepository}/releases/tag/v${config.releaseVersion}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = value => String(value).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-');
const sourcePath = relative => path.join(root, relative.startsWith('docs-site/assets/') ? relative.replace('docs-site/assets/','src/assets/') : relative.startsWith('docs-site/content/') ? relative.replace('docs-site/content/','src/content/') : relative.startsWith('docs-site/vendor/') ? relative.replace('docs-site/vendor/','vendor/') : 'content/snapshot/'+relative);
const read = relative => fs.readFileSync(sourcePath(relative), 'utf8');
const lock = JSON.parse(fs.readFileSync(path.join(root,'content.lock.json'),'utf8'));
if (!/^\/[a-z0-9/-]+$/.test(config.docsBasePath) || config.docsBasePath.endsWith('/')) throw new Error('docsBasePath must be an absolute path without a trailing slash');
if (config.docsOrigin !== config.homeOrigin + config.docsBasePath) throw new Error('docsOrigin must equal homeOrigin + docsBasePath');
const docsPath = route => config.docsBasePath + route;
const baseHtml = html => html.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_,attribute,value) => value === config.docsBasePath.slice(1) || value.startsWith(config.docsBasePath.slice(1)+'/') ? `${attribute}="/${value}"` : `${attribute}="${config.docsBasePath}/${value}"`);
const files = dir => fs.readdirSync(sourcePath(dir), {withFileTypes:true}).filter(x => x.isFile() && x.name.endsWith('.md')).map(x => `${dir}/${x.name}`).sort();
const pages = [];
const groups = [
  ['Start here', 'getting-started'], ['SDKs', 'sdks'], ['Protocols', 'protocols'],
  ['Integrations', 'integrations'], ['Operations', 'operations'], ['Architecture', 'architecture'],
  ['Security', 'security'], ['Reference', 'reference'], ['API reference', 'api']
];
const revision = lock.source.head.slice(0,12) + (lock.source.dirty ? ' · workspace snapshot' : '');
const builtAt = new Date().toISOString();

function add(source, route, group, title) {
  const markdown = read(source);
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1] || path.basename(source, '.md');
  pages.push({source, route, group, title:title || heading.replace(/`/g,''), markdown});
}
for (const file of files('docs-site/content/getting-started')) add(file, `/getting-started/${path.basename(file,'.md')}/`, 'getting-started');
for (const file of files('docs-site/content/sdks')) add(file, `/sdks/${path.basename(file,'.md')}/`, 'sdks');
for (const file of files('docs-site/content/reference')) add(file, `/reference/${path.basename(file,'.md')}/`, 'reference');
for (const [folder,group] of [['protocols','protocols'],['integrations','integrations'],['operations','operations'],['architecture-decisions','architecture'],['threat-models','security']]) {
  for (const file of files(`docs/${folder}`)) {
    add(file, `/${group}/${path.basename(file,'.md') === 'README' ? '' : path.basename(file,'.md')+'/'}`, group);
  }
}
for (const [lang,title] of [['go','Go SDK reference'],['node','Node.js & TypeScript'],['dart','Dart'],['php','PHP'],['dotnet','C# & ASP.NET Core']]) add(`sdk/${lang}/README.md`,`/sdks/${lang === 'go' ? 'go-reference' : lang}/`,'sdks',title);
add('CHANGELOG.md','/reference/changelog/','reference','Changelog');
add('api/events/README.md','/reference/events/','reference','Event schemas');
add('api/hooks/README.md','/reference/hooks/','reference','Hook schemas');
const sourceRoutes = new Map(pages.map(p => [p.source,p.route]));
sourceRoutes.set('README.md','/getting-started/overview/');
sourceRoutes.set('docs/plan.md','/reference/capabilities/');
sourceRoutes.set('docs/requirements-traceability.md','/reference/capabilities/');
sourceRoutes.set('deploy/README.md','/getting-started/quickstart/');

const contract = yaml.load(read('api/openapi/proudauth.yaml'));
contract.servers[0].variables.origin.default = config.exampleIdentityOrigin;
contract.info.license.url = `${config.docsOrigin}/reference/license/`;
const methods = ['get','post','put','patch','delete','options','head'];
const operations = [];
for (const [route,item] of Object.entries(contract.paths)) for (const method of methods) {
  if (item[method]) operations.push({route, method, item, ...item[method]});
}
const tagGroups = new Map();
for (const op of operations) {
  const tag = op.tags?.[0] || 'Other';
  if (!tagGroups.has(tag)) tagGroups.set(tag,[]);
  tagGroups.get(tag).push(op);
}
const copied = new Set();
const omitted = new Set();
function publishFile(relative) {
  // Publish only contracts and explicitly linked, already-published measurement
  // artifacts. Never recurse over the checkout, deployment or benchmark folders.
  const safe = /^api\/(events|hooks|schemas|plugins|workflows)\/[^/]+\.json$/.test(relative)
    || /^docs\/operations\/bench-results\/[\w./-]+\.(json|txt|tsv|yaml)$/.test(relative)
      && !/(?:seed|credentials|secrets|support-bundle|initial-attempt)/i.test(relative)
    || relative === 'docs/integrations/sdk-repositories.json'
    || /^(LICENSE|NOTICE)$/.test(relative);
  if (!safe || !fs.existsSync(sourcePath(relative))) return null;
  const target = `/downloads/${relative}`;
  if (!copied.has(relative)) {
    const data = fs.readFileSync(sourcePath(relative),'utf8');
    // Keep local usernames, absolute source paths and network identifiers out of
    // public downloads. The private checkout preserves the original evidence.
    const publicData = publicText(data,{temporaryPaths:relative.startsWith('docs/operations/bench-results/')});
    write(target.slice(1), publicData);
    copied.add(relative);
  }
  return target;
}

function resolveLink(href, source) {
  if (/^(https?:|mailto:)/i.test(href)) return {href,external:true};
  if (href.startsWith('#') || href.startsWith('/')) return {href};
  if (/^[a-z]+:/i.test(href)) return {text:true};
  const [file,fragment] = href.split('#');
  const [clean] = file.split('?');
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(source),clean));
  const route = sourceRoutes.get(relative);
  if (route) return {href:route+(fragment && !['README.md','docs/plan.md','docs/requirements-traceability.md','deploy/README.md'].includes(relative) ? '#'+fragment : '')};
  const asset = publishFile(relative);
  if (asset) return {href:asset};
  omitted.add(relative);
  return {text:true};
}

function render(markdown, source='docs-site/content/getting-started/overview.md') {
  const toc = [], counts = new Map();
  const renderer = new marked.Renderer();
  renderer.heading = function({tokens,depth,text}) {
    const inner = this.parser.parseInline(tokens);
    const base = slug(text.replace(/`/g,''));
    const count = counts.get(base) || 0; counts.set(base,count+1);
    const id = base+(count ? '-'+count : '');
    if (depth === 2 || depth === 3) toc.push({depth,id,text:text.replace(/[*`]/g,'')});
    return `<h${depth} id="${esc(id)}">${inner}<a class="heading-anchor" href="#${esc(id)}" aria-label="Link to this section">#</a></h${depth}>`;
  };
  renderer.link = function({href,tokens}) {
    const text = this.parser.parseInline(tokens);
    const target = resolveLink(href,source);
    return target.text ? `<span class="source-reference" title="See the source repository">${text}</span>`
      : `<a href="${esc(target.href)}"${target.external ? ' rel="noopener noreferrer"' : ''}>${text}</a>`;
  };
  renderer.html = ({text}) => esc(text); // No embedded active HTML from Markdown.
  renderer.code = ({text,lang}) => `<div class="code-block"><div class="code-head"><span>${esc(lang || 'text')}</span><button type="button" class="copy-code" aria-label="Copy code">Copy</button></div><pre><code class="language-${esc(lang || 'text')}">${esc(text)}</code></pre></div>`;
  renderer.table = function(token) {
    const header = token.header.map(c => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
    const body = token.rows.map(row => `<tr>${row.map(c => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('');
    return `<div class="table-wrap" tabindex="0"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
  };
  const html = marked.parse(markdown,{renderer,gfm:true});
  const plain = marked.lexer(markdown).map(t => t.text || '').join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[`*#|]/g,'').replace(/\s+/g,' ');
  return {html,toc,plain};
}

const logo = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 5h13l7 7v15H6z" fill="currentColor"/><path d="M12 11h6a5 5 0 0 1 0 10h-3v5h-3zm3 3v4h3a2 2 0 0 0 0-4z" fill="var(--bg)"/></svg>`;
function nav(current) {
  return groups.map(([label,group]) => {
    const items = pages.filter(p=>p.group===group).sort((a,b)=>{
      const special = p=>p.route.endsWith('/overview/') ? -2 : p.route.endsWith('/quickstart/') ? -1 : p.route === `/${group}/` ? -3 : 0;
      return special(a)-special(b) || a.title.localeCompare(b.title);
    });
    if (!items.length) return '';
    return `<details class="nav-group"${current.group === group || group==='getting-started' || group==='sdks' ? ' open' : ''}><summary>${label}<span>⌄</span></summary>${items.map(p=>`<a href="${p.route}"${p.route===current.route ? ' class="active" aria-current="page"' : ''}>${esc(p.title)}</a>`).join('')}</details>`;
  }).join('');
}
function layout(page,html,toc=[],extra='') {
  const section = groups.find(g=>g[1]===page.group)?.[0] || 'Documentation';
  const peers = pages.filter(p=>p.group===page.group);
  const position = peers.indexOf(page);
  const previous = peers[position-1], next = page.route === '/' ? pages.find(p=>p.route==='/getting-started/overview/') : peers[position+1];
  const description = `${page.title} — ProudAuth documentation. Self-hosted identity, OAuth/OIDC, organizations and access control.`;
  return `<!doctype html><html lang="en" data-docs-base="${config.docsBasePath}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.title)} · ProudAuth Docs</title><meta name="description" content="${esc(description)}"><meta name="color-scheme" content="light dark"><link rel="canonical" href="${config.docsOrigin}${page.route}"><meta property="og:title" content="${esc(page.title)} · ProudAuth"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js" defer></script></head><body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="topbar"><a href="/" class="brand">${logo}<strong>ProudAuth</strong><span>Docs</span></a><nav aria-label="Top navigation"><a href="/getting-started/quickstart/">Guides</a><a href="/api/">API reference</a><a href="/sdks/overview/">SDKs</a></nav><div class="top-actions"><button class="search-open" type="button">⌕ <span>Search docs</span><kbd>⌘ K</kbd></button><button class="theme-toggle" type="button" aria-label="Toggle color theme">◐</button><button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button></div></header>
  <aside class="sidebar" id="navigation"><a class="workspace" href="/"><span class="workspace-mark">PA</span><span>Developer documentation<small>${esc(config.version)}</small></span></a><nav aria-label="Documentation navigation">${nav(page)}</nav><div class="sidebar-bottom"><a href="${config.homeOrigin}">Project website ↗</a><a href="${config.serviceRepository}">Source code ↗</a></div></aside>
  <div class="reader-layout"><main id="main" class="content ${extra}"><div class="breadcrumb"><span>Documentation</span><span>/</span><span>${esc(section)}</span></div><article>${html}</article><nav class="page-turns" aria-label="Adjacent pages">${previous ? `<a href="${previous.route}"><small>← Previous</small>${esc(previous.title)}</a>` : '<span></span>'}${next ? `<a href="${next.route}"><small>Next →</small>${esc(next.title)}</a>` : ''}</nav><footer class="page-footer"><span>ProudAuth · Self-hosted identity</span><span>Built ${builtAt.slice(0,10)} · ${esc(revision)} · content snapshot</span></footer></main><aside class="toc" aria-label="On this page"><strong>On this page</strong>${toc.slice(0,36).map(t=>`<a href="#${esc(t.id)}" class="toc-depth-${t.depth}">${esc(t.text)}</a>`).join('')}<a class="toc-bottom" href="/getting-started/troubleshooting/">Need a hand? Troubleshooting →</a></aside></div>
  <dialog id="search-dialog" aria-label="Search documentation"><div class="search-top"><span>⌕</span><input type="search" id="search-input" aria-label="Search documentation" placeholder="Search guides, SDKs and endpoints…" autocomplete="off"><button class="search-close" aria-label="Close search">Esc</button></div><div id="search-results" role="list" aria-live="polite"><p>Search all guides and the API contract.</p></div><div class="search-help">↑ ↓ to navigate <span>Enter to open · Esc to close</span></div></dialog><div id="notice" role="status" aria-live="polite"></div></body></html>`;
}
function write(relative,content,base=output) {
  const destination = path.join(base,relative);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,content);
}
function writePage(page,html,toc,extra) { write(page.route.slice(1)+'index.html',baseHtml(layout(page,html,toc,extra))); }

// Clean only the two generated directories owned by this build. Keep their
// directory inodes stable for running Docker bind mounts.
for (const dir of [siteOutput]) {
  fs.mkdirSync(dir,{recursive:true});
  for (const file of fs.readdirSync(dir)) fs.rmSync(path.join(dir,file),{recursive:true,force:true});
}
for (const name of ['site.css','site.js','favicon.svg']) write(`assets/${name}`,read(`docs-site/assets/${name}`));
for (const category of ['events','hooks','schemas','plugins','workflows']) {
  for (const file of fs.readdirSync(sourcePath('api/'+category)).filter(name=>name.endsWith('.json'))) publishFile(`api/${category}/${file}`);
}
const search = [];
function indexPage(page,plain) {
  search.push({title:page.title,group:groups.find(g=>g[1]===page.group)?.[0] || page.group,url:docsPath(page.route),text:plain});
}

function deref(value) {
  if (value?.$ref?.startsWith('#/')) return value.$ref.slice(2).split('/').reduce((p,k)=>p?.[k],contract) || value;
  return value || {};
}
function schemaTable(input) {
  const schema = deref(input);
  if (!schema.properties) return `<pre class="schema-code"><code>${esc(JSON.stringify(input,null,2))}</code></pre>`;
  return `<div class="table-wrap" tabindex="0"><table><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody>${Object.entries(schema.properties).map(([name,p])=>`<tr><td><code>${esc(name)}</code>${p['x-secret'] ? '<span class="secret-label">one-time secret</span>':''}</td><td>${esc(p.type || (p.$ref ? p.$ref.split('/').at(-1) : p.oneOf ? 'oneOf' : 'object'))}</td><td>${schema.required?.includes(name) ? 'Yes':'—'}</td><td>${esc(p.description || '')}${p.enum ? `<br><code>${esc(p.enum.join(' | '))}</code>`:''}</td></tr>`).join('')}</tbody></table></div>`;
}
function operationHtml(op) {
  const id = slug(op.operationId || op.method+' '+op.route);
  const params = [...(op.item.parameters || []),...(op.parameters || [])].map(deref);
  const body = deref(op.requestBody);
  const security = op.security ?? contract.security ?? [];
  const auth = security.length === 0 ? 'Public / endpoint-specific credentials' : security.map(s=>Object.keys(s).join(', ')).join(' or ');
  const description = render(op.description || '', 'api/openapi/proudauth.yaml').html;
  return `<details class="operation" id="${id}"><summary><span class="method ${op.method}">${op.method.toUpperCase()}</span><code>${esc(op.route)}</code><span class="op-chevron">+</span></summary><div class="operation-body"><h2>${esc(op.summary || op.operationId || op.method.toUpperCase())}</h2>${description}<div class="operation-meta"><span><strong>Authentication</strong>${esc(auth)}</span><span><strong>Trust class</strong>${esc(op['x-trust-class'] || 'See operation description')}</span><span><strong>Permissions</strong>${esc((op['x-permissions'] || []).join?.(', ') || op['x-permissions'] || 'See operation description')}</span></div>${params.length ? `<h3>Parameters</h3><div class="table-wrap" tabindex="0"><table><thead><tr><th>Name</th><th>Location</th><th>Required</th><th>Details</th></tr></thead><tbody>${params.map(p=>`<tr><td><code>${esc(p.name)}</code></td><td>${esc(p.in)}</td><td>${p.required?'Yes':'—'}</td><td>${esc(p.description || '')}<br><code>${esc(JSON.stringify(p.schema || {}))}</code></td></tr>`).join('')}</tbody></table></div>` : ''}${body.content ? `<h3>Request body</h3>${Object.entries(body.content).map(([type,v])=>`<h4>${esc(type)} ${body.required ? '· required':''}</h4>${schemaTable(v.schema)}<details class="schema-details"><summary>Complete request schema</summary><pre><code>${esc(JSON.stringify(deref(v.schema),null,2))}</code></pre></details>`).join('')}` : ''}<h3>Responses</h3>${Object.entries(op.responses || {}).map(([code,response])=>{const v=deref(response);return `<details class="response"><summary><code>${esc(code)}</code> ${esc(v.description || '')}</summary>${Object.entries(v.content || {}).map(([type,c])=>`<p><code>${esc(type)}</code></p>${schemaTable(c.schema)}`).join('')}${v.headers ? `<h4>Response headers</h4><pre><code>${esc(JSON.stringify(v.headers,null,2))}</code></pre>`:''}</details>`;}).join('')}<p class="small">Operation <code>${esc(op.operationId || id)}</code> · <a href="/api/schemas/">Schema definitions</a> · <a href="/api/openapi.yaml">OpenAPI contract</a></p></div></details>`;
}

for (const [tag,ops] of tagGroups) {
  const page = {route:`/api/${slug(tag)}/`,group:'api',title:tag,source:'api/openapi/proudauth.yaml'};
  page.html = `<h1>${esc(tag)}</h1><p class="lead">${esc(contract.tags?.find(t=>t.name===tag)?.description || 'HTTP API operations.')} <span class="count-pill">${ops.length} operations</span></p><p>Expand an endpoint for authentication, parameters, request fields and responses.</p>${ops.map(operationHtml).join('')}`;
  page.plain = ops.map(op=>`${op.method.toUpperCase()} ${op.route} ${op.summary || ''} ${op.description || ''}`).join(' ');
  page.toc = ops.slice(0,22).map(op=>({depth:2,id:slug(op.operationId || op.method+' '+op.route),text:`${op.method.toUpperCase()} ${op.route.split('/').at(-1)}`}));
  pages.push(page);
}
const api = {route:'/api/',group:'api',title:'API overview'};
pages.push(api);
api.html = `<h1>API reference</h1><p class="lead">One contract. Every endpoint.</p><p>The published OpenAPI 3.1 contract documents <strong>${operations.length} operations</strong> across <strong>${tagGroups.size} API groups</strong>. Custom APIs use <code>/api/v1/realms/{realm}</code>; protocol endpoints use <code>/realms/{realm}</code>.</p><div class="callout"><strong>Credentials stay with your application.</strong><p>The explorer is a reference viewer. Request execution is disabled; use the documented HTTP examples in your trusted environment.</p></div><div class="action-row"><a class="primary-button" href="/api/explorer/">Open API explorer ↗</a><a class="secondary-button" href="/api/openapi.yaml" download>Download OpenAPI</a><a class="secondary-button" href="/api/openapi.json" download>JSON contract</a></div>${render(contract.info.description,'api/openapi/proudauth.yaml').html}<h2 id="api-groups">Browse by area</h2><div class="card-grid">${[...tagGroups].map(([tag,ops])=>`<a class="guide-card" href="/api/${slug(tag)}/"><span class="card-icon">{ }</span><h3>${esc(tag)}</h3><p>${ops.length} operations</p><span class="card-arrow">→</span></a>`).join('')}</div><h2 id="example">Read public discovery</h2>${render('```sh\ncurl --fail '+config.exampleIdentityOrigin+'/realms/main/.well-known/openid-configuration\n```').html}`;
api.plain = 'OpenAPI HTTP endpoints parameters authentication errors idempotency ETag pagination '+contract.info.description;
api.toc = [{depth:2,id:'api-groups',text:'API groups'},{depth:2,id:'example',text:'Discovery example'}];
const schemas = {route:'/api/schemas/',group:'api',title:'Schema definitions'};
schemas.html = `<h1>Schema definitions</h1><p class="lead">Complete component schemas from the API contract.</p><p>Search field names with your browser's Find command. Referenced types link within the downloadable contract.</p>${Object.entries(contract.components?.schemas || {}).map(([name,schema])=>`<details class="schema-details" id="${slug(name)}"><summary>${esc(name)}</summary><pre><code>${esc(JSON.stringify(schema,null,2))}</code></pre></details>`).join('')}`;
schemas.plain = 'Schema definitions '+Object.keys(contract.components?.schemas || {}).join(' ');
pages.push(schemas);
const license = {route:'/reference/license/',group:'reference',title:'License & notices'};
license.html = `<h1>License & notices</h1><h2 id="license">ProudAuth license</h2><pre><code>${esc(read('LICENSE'))}</code></pre><h2 id="notice">Project notices</h2><pre><code>${esc(read('NOTICE'))}</code></pre><h2 id="site-dependencies">Documentation build dependencies</h2><p>Build-only marked 13.0.3 and js-yaml 4.3.2 are used under the MIT license. Neither parser runs in visitors' browsers.</p><details class="schema-details"><summary>marked MIT license</summary><pre>${esc(read('docs-site/vendor/marked.LICENSE.md'))}</pre></details><details class="schema-details"><summary>js-yaml MIT license</summary><pre>${esc(read('docs-site/vendor/js-yaml.LICENSE'))}</pre></details>`;
license.plain = 'Apache license notices documentation build MIT'; pages.push(license);

for (const page of pages) {
  if (page.markdown) {
    const rendered = render(page.markdown,page.source);
    page.html = rendered.html; page.toc = rendered.toc; page.plain = rendered.plain;
  }
  writePage(page,page.html,page.toc);
  indexPage(page,page.plain || page.title);
}
for (const op of operations) {
  const tag = op.tags?.[0] || 'Other';
  search.push({title:`${op.method.toUpperCase()} ${op.route}`,group:`API · ${tag}`,url:docsPath(`/api/${slug(tag)}/#${slug(op.operationId || op.method+' '+op.route)}`),text:`${op.summary || ''} ${op.description || ''} ${JSON.stringify(deref(op.requestBody))}`});
}

const welcome = {route:'/',group:'getting-started',title:'Developer documentation'};
const highlights = [
  ['01','Run your instance','From a local image to a production installation.','/getting-started/quickstart/'],
  ['02','Add sign-in','OIDC, PKCE and your own login experience.','/protocols/headless-authentication/'],
  ['03','Protect your API','Verify tokens and enforce tenant boundaries.','/integrations/resource-servers/'],
  ['04','Choose your SDK','Go, Node.js, Dart, PHP and .NET.','/sdks/overview/'],
  ['05','Connect your systems','Federation, SCIM, webhooks and workflows.','/integrations/'],
  ['06','Operate with confidence','Keys, monitoring, backups and restore.','/operations/']
];
const homepage = `<div class="eyebrow"><span class="live-dot"></span> PROUDAUTH DOCUMENTATION</div><h1 class="hero-title">Identity,<br>on your terms<span>.</span></h1><p class="hero-lead">Build secure sign-in and access control.<br>Keep your identity infrastructure in your hands.</p><div class="action-row"><a class="primary-button" href="/getting-started/quickstart/">Get started <span>→</span></a><a class="secondary-button" href="/api/">Explore the API</a></div><div class="hero-terminal"><div class="terminal-title"><span>● ● ●</span><span>Your first connection</span><span>HTTPS</span></div><pre><code><span class="token-comment"># Discover the identity provider</span>\ncurl --fail \\\n  ${config.exampleIdentityOrigin}/realms/main/.well-known/openid-configuration</code></pre><div class="terminal-foot">Self-hosted · Go + PostgreSQL · Headless by design</div></div><h2 id="start-building">Find your path</h2><p>Everything you need to integrate, deploy and operate ProudAuth.</p><div class="card-grid">${highlights.map(([n,title,text,href])=>`<a class="guide-card" href="${href}"><span class="card-icon">${n}</span><h3>${title}</h3><p>${text}</p><span class="card-arrow">→</span></a>`).join('')}</div><div class="docs-stats"><span><strong>${pages.filter(p=>p.markdown).length}</strong> complete guides</span><span><strong>${operations.length}</strong> API operations</span><span><strong>5</strong> first-party SDKs</span></div><div class="callout"><strong>Know what you're building on.</strong><p>ProudAuth ${esc(config.releaseVersion)} is a pre-release. You run the identity service on your own infrastructure; this website hosts documentation only. SDK registry packages remain unpublished. Read the <a href="/reference/capabilities/">capabilities and boundaries</a> before deployment.</p></div><h2 id="popular-guides">A few useful next stops</h2><div class="link-list"><a href="/protocols/oauth-oidc-profile/">OAuth & OpenID Connect profile <span>→</span></a><a href="/operations/configuration/">Full configuration reference <span>→</span></a><a href="/operations/benchmarks/">Measured benchmark results <span>→</span></a><a href="/operations/backup-restore/">Backup & disaster recovery <span>→</span></a></div>`;
writePage(welcome,homepage,[{depth:2,id:'start-building',text:'Find your path'},{depth:2,id:'popular-guides',text:'Popular guides'}],'welcome');
indexPage(welcome,'ProudAuth documentation getting started API SDK deployment integration');
write('search-index.json',JSON.stringify(search));
write('api/openapi.yaml',yaml.dump(contract,{lineWidth:120,noRefs:true}));
write('api/openapi.json',JSON.stringify(contract,null,2));
const sitemap = `<url><loc>${config.homeOrigin}/</loc></url>`+[welcome,...pages].map(p=>`<url><loc>${config.docsOrigin}${p.route}</loc></url>`).join('');
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap}</urlset>`);
write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${config.docsOrigin}/sitemap.xml\n`);
write('404.html',baseHtml(layout({title:'Page not found',group:'getting-started',route:'/404/'},'<h1>Page not found</h1><p>This address is not in the documentation. Search the guides or start from the overview.</p><a class="primary-button" href="/">Back to documentation →</a>')));
write('build-info.json',JSON.stringify({builtAt,revision,source:lock.source,contentManifest:'content.lock.json',docsBasePath:config.docsBasePath,version:config.version,guides:pages.filter(p=>p.markdown).length,apiOperations:operations.length,apiGroups:tagGroups.size,pages:pages.length+1,publishedFiles:copied.size},null,2));
const home = read('docs-site/assets/home.html').replaceAll('{{DOCS}}',config.docsBasePath).replaceAll('{{IDENTITY}}',config.exampleIdentityOrigin).replaceAll('{{SOURCE}}',config.serviceRepository).replaceAll('{{RELEASE}}',releaseUrl).replaceAll('{{VERSION}}',config.releaseVersion).replaceAll('{{OPERATIONS}}',String(operations.length));
write('index.html',home,homeOutput);
write('assets/site.css',read('docs-site/assets/site.css'),homeOutput);
write('assets/favicon.svg',read('docs-site/assets/favicon.svg'),homeOutput);
write('.nojekyll','',homeOutput);
write('CNAME',new URL(config.homeOrigin).hostname+'\n',homeOutput);
write('404.html',fs.readFileSync(path.join(output,'404.html'),'utf8'),homeOutput);
write('robots.txt','User-agent: *\nAllow: /\n',homeOutput);

// Swagger assets and their licenses are checked in and hash-verified; no Docker or download is needed.
write('api/explorer/index.html',baseHtml(`<!doctype html><html lang="en" data-docs-base="${config.docsBasePath}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ProudAuth API explorer</title><link rel="stylesheet" href="/api/explorer/swagger-ui.css"><link rel="icon" href="/assets/favicon.svg"></head><body style="margin:0"><div style="padding:16px 24px;font:14px system-ui;background:#eff7f4;border-bottom:1px solid #c6ded5"><a href="/api/">← ProudAuth API reference</a> · Read-only explorer · Download <a href="/api/openapi.yaml">OpenAPI</a></div><div id="swagger-ui"></div><script src="/api/explorer/swagger-ui-bundle.js"></script><script src="/api/explorer/swagger-ui-standalone-preset.js"></script><script src="/api/explorer/initialize.js"></script></body></html>`));
write('api/explorer/initialize.js',`window.onload = () => { window.ui = SwaggerUIBundle({url:'${config.docsBasePath}/api/openapi.json',dom_id:'#swagger-ui',deepLinking:true,filter:true,displayRequestDuration:true,validatorUrl:null,supportedSubmitMethods:[],persistAuthorization:false,docExpansion:'none',presets:[SwaggerUIBundle.presets.apis,SwaggerUIStandalonePreset],layout:'StandaloneLayout'}); };\n`);
console.log(JSON.stringify({output,guides:pages.filter(p=>p.markdown).length,apiOperations:operations.length,pages:pages.length+1,publishedFiles:copied.size,checkoutOnlyReferences:omitted.size},null,2));

for (const file of fs.readdirSync(path.join(root,'vendor/swagger-ui'))) fs.copyFileSync(path.join(root,'vendor/swagger-ui',file),path.join(output,'api/explorer',file));
write('content.lock.json',JSON.stringify(lock,null,2));
write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${config.docsOrigin}/sitemap.xml\n`,homeOutput);
