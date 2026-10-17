import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {join,extname,normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT)||4173;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const clean=normalize(pathname).replace(/^([.][.][/\\])+/, '');let path=join(base,clean);if(!path.startsWith(base))return end(res,403,'禁止访问');let file=path;if(pathname==='/'||pathname==='/index.html')file=join(base,'index.html');let s;try{s=await stat(file);}catch{res.writeHead(404);return res.end('文件不存在');}if(s.isDirectory())return end(res,403,'目录不可浏览');const bytes=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(bytes);}catch(e){end(res,500,'运行失败');}}).listen(port,'0.0.0.0',()=>console.log(`安心药盒 Web 原型：http://localhost:${port}`));
function end(res,status,text){res.writeHead(status,{'content-type':'text/plain; charset=utf-8'});res.end(text);}
