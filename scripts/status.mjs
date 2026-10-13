import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const targets=[
  ['Identity API',process.env.IDENTITY_HEALTH_URL,'ready'],
  ['Documentation',process.env.DOCS_HEALTH_URL],
  ['Service website',process.env.HOME_HEALTH_URL]
];
let summary={status:'checking',checkedAt:null,components:targets.map(([name])=>({name,status:'checking',latencyMs:null}))};
let checking=false;
async function check() {
  if(checking)return;
  checking=true;
  try {
    const components=await Promise.all(targets.map(async([name,url,expected])=>{
      const start=performance.now();
      try {
        const response=await fetch(url,{signal:AbortSignal.timeout(3000),redirect:'error'});
        let healthy=response.ok;
        if(expected)healthy=healthy && (await response.json()).status===expected;
        else await response.body?.cancel();
        return {name,status:healthy?'operational':'unavailable',latencyMs:Math.round(performance.now()-start)};
      } catch { return {name,status:'unavailable',latencyMs:null}; }
    }));
    summary={status:components.every(c=>c.status==='operational')?'operational':'degraded',checkedAt:new Date().toISOString(),components};
  } finally {checking=false;}
}
const assets=new Map([
  ['/', ['status.html','text/html; charset=utf-8']],
  ['/status.js',['status.js','application/javascript; charset=utf-8']],
  ['/assets/site.css',['site.css','text/css; charset=utf-8']],
  ['/assets/favicon.svg',['favicon.svg','image/svg+xml']]
]);
const server=http.createServer((request,response)=>{
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  response.setHeader('X-Frame-Options','DENY');
  response.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  response.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'");
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{Allow:'GET, HEAD'});response.end();return;}
  let route;
  try {route=new URL(request.url,'http://localhost').pathname;}catch{response.writeHead(400);response.end();return;}
  if(route==='/health.json') {
    response.setHeader('Content-Type','application/json');
    response.end(request.method==='HEAD'?'':JSON.stringify({...summary,scope:'Point-in-time checks from the same deployment; no historical uptime or SLA.'}));
    return;
  }
  const asset=assets.get(route);
  if(!asset){response.writeHead(404,{'Content-Type':'text/plain'});response.end('Not found');return;}
  response.setHeader('Content-Type',asset[1]);
  response.end(request.method==='HEAD'?'':fs.readFileSync(path.join(directory,asset[0])));
});
await check();
const timer=setInterval(check,30000);
server.listen(Number(process.env.STATUS_PORT || 8080),'0.0.0.0');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{clearInterval(timer);server.close(()=>process.exit(0));});
