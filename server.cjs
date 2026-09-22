const http=require('http'),fs=require('fs'),path=require('path');
const resolve=require('./server/public-path.cjs');
http.createServer((req,res)=>{let file;try{const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);file=resolve(__dirname,p==='/'?'/index.html':p)}catch{res.writeHead(403).end();return}
fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end('Not found');return}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b)})}).listen(8766,'127.0.0.1',()=>console.log('http://127.0.0.1:8766'));
