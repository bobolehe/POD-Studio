from pathlib import Path
p=Path(r'D:\codex\聚鼎设计页功能调研\index.html')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("quad:[[79,198],[957,214],[956,785],[79,802]]", "quad:[[79,198],[957,214],[956,785],[79,802]],side:[[59,203],[79,198],[79,802],[59,805]],wrapWidth:20")
s=s.replace("quad:[[269,100],[790,120],[789,882],[269,906]]", "quad:[[269,100],[790,120],[789,882],[269,906]],side:[[258,103],[269,100],[269,906],[258,908]],wrapWidth:14")
s=s.replace('<label>缩放', '<label style="font-size:14px"><input id="wrap" type="checkbox" checked> 镜像包边（可见左侧）</label><p>包边跟随当前裁切同步更新；取消勾选可对比旧版灰边。</p><label>缩放')
s=s.replace('侧边保留底图灰边；尺寸与光影为近似模板效果。','含可见左侧镜像包边；透视、侧面宽度及光影按实测近似，不代表生产包边尺寸。')
start=s.index('function drawWarp(p)')
end=s.index('function render()',start)
s=s[:start]+'''// Each visible face has its own projective mapping. Mirror the first strip of
// the current front crop into the thickness face; both meet at source x = 0.
function drawWarp(p){
 const source=sc.getImageData(0,0,p.w,p.h).data,out=new ImageData(1000,1000),dst=out.data;
 const faces=[{quad:p.quad,side:false}];if($('#wrap').checked)faces.unshift({quad:p.side,side:true});
 for(const face of faces){
  const q=face.quad,m=homography(q);
  const minX=Math.max(0,Math.floor(Math.min(...q.map(v=>v[0])))),maxX=Math.min(999,Math.ceil(Math.max(...q.map(v=>v[0])))),minY=Math.max(0,Math.floor(Math.min(...q.map(v=>v[1])))),maxY=Math.min(999,Math.ceil(Math.max(...q.map(v=>v[1]))));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const a=m[0]-x*m[6],b=m[1]-x*m[7],c=m[3]-y*m[6],d=m[4]-y*m[7],e=x-m[2],f=y-m[5],det=a*d-b*c,u=(e*d-b*f)/det,v=(a*f-e*c)/det;
   if(u<0||u>1||v<0||v>1)continue;
   const sx=face.side?(1-u)*p.wrapWidth:u*(p.w-1),sy=v*(p.h-1),ix=Math.floor(sx),iy=Math.floor(sy),jx=Math.min(ix+1,p.w-1),jy=Math.min(iy+1,p.h-1),fx=sx-ix,fy=sy-iy,k=(y*1000+x)*4;
   for(let t=0;t<4;t++)dst[k+t]=source[(iy*p.w+ix)*4+t]*(1-fx)*(1-fy)+source[(iy*p.w+jx)*4+t]*fx*(1-fy)+source[(jy*p.w+ix)*4+t]*(1-fx)*fy+source[(jy*p.w+jx)*4+t]*fx*fy;
  }
 }
 const w=document.createElement('canvas');w.width=w.height=1000;w.getContext('2d').putImageData(out,0,0);ctx.drawImage(w,0,0);
}
''' + s[end:]
s=s.replace('sc.save();sc.translate', "sc.fillStyle='#fff';sc.fillRect(0,0,p.w,p.h);sc.save();sc.translate")
s=s.replace("p.quad.forEach((v,i)=>ctx[i?'lineTo':'moveTo'](...v));ctx.closePath();ctx.clip();", "p.quad.forEach((v,i)=>ctx[i?'lineTo':'moveTo'](...v));ctx.closePath();if($('#wrap').checked){p.side.forEach((v,i)=>ctx[i?'lineTo':'moveTo'](...v));ctx.closePath()}ctx.clip();")
s=s.replace("$('#zoom').oninput=", "$('#wrap').onchange=render;\n$('#zoom').oninput=")
p.write_text(s,encoding='utf-8')
print('Patched front + mirrored side mapping')
