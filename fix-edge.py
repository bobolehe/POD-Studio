from pathlib import Path
p=Path(r'D:\codex\聚鼎设计页功能调研\index.html');s=p.read_text(encoding='utf-8-sig')
a=s.index('function drawWarp(p)');b=s.index('function render()',a)
s=s[:a]+'''// One coverage mask and one compositing pass: never clip the already
// antialiased raster a second time. Bottom contour follows the source edge.
function drawWarp(p){
 const src=sc.getImageData(0,0,p.w,p.h).data;
 const base=ctx.getImageData(0,0,1000,1000),dst=base.data;
 const faces=[{quad:p.quad,side:false}];if($('#wrap').checked)faces.unshift({quad:p.side,side:true});
 for(const face of faces){
  const q=face.quad,m=homography(q);
  const x0=Math.max(0,Math.floor(Math.min(...q.map(v=>v[0])))-1),x1=Math.min(999,Math.ceil(Math.max(...q.map(v=>v[0])))+1),y0=Math.max(0,Math.floor(Math.min(...q.map(v=>v[1])))-1),y1=Math.min(999,Math.ceil(Math.max(...q.map(v=>v[1])))+3);
  function uv(x,y){const a=m[0]-x*m[6],b=m[1]-x*m[7],c=m[3]-y*m[6],d=m[4]-y*m[7],e=x-m[2],f=y-m[5],det=a*d-b*c;return [(e*d-b*f)/det,(a*f-e*c)/det]}
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   let [u,v]=uv(x+.5,y+.5);
   // Smoothly cover the bevel transition, tapering to zero at the corners.
   const edge=face.side?0:1.5*Math.sin(Math.PI*Math.max(0,Math.min(1,u)));
   const height=Math.hypot(q[3][0]-q[0][0],q[3][1]-q[0][1]);
   const vmax=1+edge/height;
   if(u<-.004||u>1.004||v<-.004||v>vmax+.004)continue;
   const width=Math.hypot(q[1][0]-q[0][0],q[1][1]-q[0][1]);
   let coverage=1;
   if(Math.min(u*width,(1-u)*width,v*height,(vmax-v)*height)<1.5){
    let hits=0;for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){const [uu,vv]=uv(x+(sx+.5)/4,y+(sy+.5)/4);const extra=face.side?0:1.5*Math.sin(Math.PI*Math.max(0,Math.min(1,uu)))/height;if(uu>=0&&uu<=1&&vv>=0&&vv<=1+extra)hits++}coverage=hits/16;
   }
   if(!coverage)continue;
   u=Math.max(0,Math.min(1,u));v=Math.max(0,Math.min(1,v));
   const sx=face.side?(1-u)*p.wrapWidth:u*(p.w-1),sy=v*(p.h-1),ix=Math.floor(sx),iy=Math.floor(sy),jx=Math.min(ix+1,p.w-1),jy=Math.min(iy+1,p.h-1),fx=sx-ix,fy=sy-iy,k=(y*1000+x)*4;
   for(let t=0;t<3;t++){
    const color=src[(iy*p.w+ix)*4+t]*(1-fx)*(1-fy)+src[(iy*p.w+jx)*4+t]*fx*(1-fy)+src[(jy*p.w+ix)*4+t]*(1-fx)*fy+src[(jy*p.w+jx)*4+t]*fx*fy;
    dst[k+t]=dst[k+t]*(1-coverage+coverage*color/255);
   }
  }
 }
 ctx.putImageData(base,0,0);
}
''' +s[b:]
a=s.index('ctx.save();ctx.beginPath();p.quad.forEach');b=s.index("$('#quality').textContent=scale",a)
s=s[:a]+'drawWarp(p);'+s[b:]
p.write_text(s,encoding='utf-8')
