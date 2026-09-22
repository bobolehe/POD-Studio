(async()=>{
 const images={},tests=[];
 const assert=(name,pass,detail={})=>{tests.push({name,pass,...detail});if(!pass)throw Error(name)};
 function source(kind){const c=document.createElement('canvas');c.width=1800;c.height=1200;const g=c.getContext('2d');if(kind==='checker'){for(let y=0;y<1200;y+=60)for(let x=0;x<1800;x+=60){g.fillStyle=((x+y)/60)%2?'#111':'#fff';g.fillRect(x,y,60,60)}g.strokeStyle='#f03';g.lineWidth=40;g.strokeRect(20,20,1760,1160)}else{g.fillStyle=kind==='black'?'#000':'#f00000';g.fillRect(0,0,1800,1200)}return c}
 for(const key of ['landscape','portrait']){
  document.querySelector('[data-product='+key+']').click();
  const p=products[key],t=TemplateRenderer.build(p),background=t.bg.getContext('2d').getImageData(0,0,1000,1000).data;
  for(const kind of ['black','red','checker']){
   setArt(source(kind),'验收-'+kind);images[key+'-'+kind]=canvas.toDataURL();
   const d=ctx.getImageData(0,0,1000,1000).data;let outside=0,inside=0;
   for(let k=0;k<d.length;k+=4){if(t.alpha[k+3]===0&&(d[k]!==background[k]||d[k+1]!==background[k+1]||d[k+2]!==background[k+2]))outside++;
    if(t.alpha[k+3]===255&&((kind==='black'&&(d[k]||d[k+1]||d[k+2]))||(kind==='red'&&(d[k+1]||d[k+2]))))inside++;
   }
   assert(key+'/'+kind+'/遮罩外无图案',outside===0,{badPixels:outside});
   if(kind!=='checker')assert(key+'/'+kind+'/内部无灰白漏点',inside===0,{badPixels:inside});
  }
  document.querySelector('#demo').click();images[key]=canvas.toDataURL();const initial=images[key];
  document.querySelector('#zoom').value='1.6';document.querySelector('#zoom').dispatchEvent(new Event('input'));assert(key+'/缩放',canvas.toDataURL()!==initial);
  document.querySelector('#rotate').click();assert(key+'/旋转',angle===90);
  document.querySelector('#reset').click();assert(key+'/复位',canvas.toDataURL()===initial);
  for(const view of ['mask','light','shadow']){document.querySelector('#layerView').value=view;render();images[key+'-'+view]=canvas.toDataURL()}
  document.querySelector('#layerView').value='effect';render();
  // Export must contain the effect even when a diagnostic layer is displayed.
  document.querySelector('#layerView').value='mask';render();
  const original=HTMLAnchorElement.prototype.click;let finish;const pending=new Promise(r=>finish=r);
  HTMLAnchorElement.prototype.click=function(){fetch(this.href).then(r=>r.blob()).then(blob=>{const reader=new FileReader();reader.onload=()=>finish({url:reader.result,name:this.download});reader.readAsDataURL(blob)})};
  try{document.querySelector('#export').click();const exported=await pending;assert(key+'/导出是效果非遮罩',exported.url===initial);images[key+'-export']=exported.url;assert(key+'/导出版本名',exported.name.includes('v5'))}finally{HTMLAnchorElement.prototype.click=original}
  assert(key+'/查看图层恢复',document.querySelector('#layerView').value==='mask');document.querySelector('#layerView').value='effect';render();
 }
 return {images,tests};
})()
