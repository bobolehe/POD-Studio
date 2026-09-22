const path=require('path');
const routes=require('./public-paths.json');
module.exports=function resolvePublic(root,url){
 const name=url.replace(/^\/+/,''),mapped=routes[name]||name;
 const allowed=/^(web|assets|scenes|ui|tests)\//.test(mapped);
 if(!allowed||! /\.(html|js|css|json|png|jpg|jpeg|svg)$/i.test(mapped))throw Error('Not public');
 const file=path.resolve(root,mapped);if(!file.startsWith(root+path.sep))throw Error('Not public');return file;
};
