import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'site.config.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.yaml':'application/yaml','.txt':'text/plain; charset=utf-8','.tsv':'text/tab-separated-values'};
export function createPreviewServer(directory=path.join(root,'dist')){
  return http.createServer((request,response)=>{
    response.setHeader('Cache-Control','no-cache');
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('X-Frame-Options','DENY');
    response.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    response.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'");
    if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{Allow:'GET, HEAD'});response.end();return;}
    let url,decoded;
    try{url=new URL(request.url,'http://localhost');decoded=decodeURIComponent(url.pathname);}catch{response.writeHead(400);response.end();return;}
    const host=(request.headers.host||'').split(':')[0].toLowerCase();
    if(host==='www.proudauth.com'||host==='docs.proudauth.com'){
      const location=host.startsWith('www.')?config.homeOrigin+url.pathname+url.search:config.docsOrigin+(url.pathname==='/'?'/':url.pathname)+url.search;
      response.writeHead(308,{Location:location});response.end();return;
    }
    if(decoded.split('/').some(part=>part.startsWith('.')||part==='..')||decoded.includes('\\')){response.writeHead(404);response.end();return;}
    if(decoded===config.docsBasePath){response.writeHead(308,{Location:decoded+'/'+url.search});response.end();return;}
    let file=path.resolve(directory,'.'+decoded);
    if(!file.startsWith(path.resolve(directory)+path.sep)&&file!==path.resolve(directory)){response.writeHead(404);response.end();return;}
    try{
      if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      if(!fs.statSync(file).isFile())throw new Error('not a file');
      response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
      response.end(request.method==='HEAD'?'':fs.readFileSync(file));
    }catch{
      const fallback=path.join(directory,'docs/404.html');
      response.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
      response.end(request.method==='HEAD'?'':fs.existsSync(fallback)?fs.readFileSync(fallback):'Not found');
    }
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||3000);
  const server=createPreviewServer();
  server.listen(port,'127.0.0.1',()=>console.log(`ProudAuth preview: http://127.0.0.1:${server.address().port}/`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
