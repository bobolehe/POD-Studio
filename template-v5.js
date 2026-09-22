/* V5: code-native, independently rebuilt template layers.
 * The JPG is a reference/thumbnail only. It is never blended into the output.
 * A single supersampled silhouette covers BOTH faces, preventing internal gaps.
 */
const TemplateRenderer = (() => {
 const SIZE=1000, cache=new Map();
 function canvas(){const c=document.createElement('canvas');c.width=c.height=SIZE;return c}
 function roundedPath(points,radii){
  const path=new Path2D();
  const near=(a,b,r)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]);const t=Math.min(r/d,.25);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]};
  for(let i=0;i<points.length;i++){
   const p=points[i],prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];
   const a=near(p,prev,radii[i]),b=near(p,next,radii[i]);
   if(!i)path.moveTo(...a);else path.lineTo(...a);
   path.quadraticCurveTo(...p,...b);
  }
  path.closePath();return path;
 }
 function inverseMatrix(m,x,y){const a=m[0]-x*m[6],b=m[1]-x*m[7],c=m[3]-y*m[6],d=m[4]-y*m[7],e=x-m[2],f=y-m[5],det=a*d-b*c;return [(e*d-b*f)/det,(a*f-e*c)/det]}
 const clamp=x=>Math.max(0,Math.min(1,x));
 function build(p){
  if(cache.has(p.id))return cache.get(p.id);
  const outline=[p.side[0],p.quad[0],p.quad[1],p.quad[2],p.quad[3],p.side[3]];
  const path=roundedPath(outline,[3,2,p.id==='MQ19201068'?1.5:5,5,2,3]);
  const hi=document.createElement('canvas');hi.width=hi.height=SIZE*4;
  const hg=hi.getContext('2d');hg.scale(4,4);hg.fillStyle='#fff';hg.fill(path);
  const mask=canvas(),mg=mask.getContext('2d');mg.imageSmoothingQuality='high';mg.drawImage(hi,0,0,SIZE,SIZE);
  const alpha=mg.getImageData(0,0,SIZE,SIZE).data;
  const shadow=canvas(),sg=shadow.getContext('2d');sg.save();sg.filter='blur(5px)';sg.globalAlpha=.24;sg.translate(-4,6);sg.fillStyle='#14202b';sg.fill(path);sg.restore();sg.globalCompositeOperation='destination-out';sg.drawImage(mask,0,0);
  const bg=canvas(),bgctx=bg.getContext('2d');bgctx.fillStyle='#fff';bgctx.fillRect(0,0,SIZE,SIZE);bgctx.drawImage(shadow,0,0);
  const fm=homography(p.quad),sm=homography(p.side),map=[];
  const light=canvas(),lg=light.getContext('2d'),ld=lg.createImageData(SIZE,SIZE);
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const k=(y*SIZE+x)*4,a=alpha[k+3]/255;if(!a)continue;
   const seam=p.quad[0][0]+(p.quad[3][0]-p.quad[0][0])*clamp((y-p.quad[0][1])/(p.quad[3][1]-p.quad[0][1]));
   const side=x+.5<seam;let [u,v]=inverseMatrix(side?sm:fm,x+.5,y+.5);u=clamp(u);v=clamp(v);
   let shade;
   if(side){shade=.68+.16*u-.025*v}
   else{
    const w=Math.hypot(p.quad[1][0]-p.quad[0][0],p.quad[1][1]-p.quad[0][1]);
    const h=Math.hypot(p.quad[3][0]-p.quad[0][0],p.quad[3][1]-p.quad[0][1]);
    // Top-edge bevel removed; retain bottom and right bevels only.
    const bevel=Math.min((1-v)*h,(1-u)*w);
    shade=(.978-.035*v+.006*u)*(1-.07*Math.exp(-Math.max(0,bevel)/1.25));
   }
   map.push({k,a,u:side?(1-u)*p.wrapWidth/(p.w-1):u,v,shade,side});
   ld.data[k]=ld.data[k+1]=ld.data[k+2]=Math.round(shade*255);ld.data[k+3]=Math.round(a*255);
  }
  lg.putImageData(ld,0,0);
  const result={mask,alpha,shadow,bg,light,map};cache.set(p.id,result);return result;
 }
 function draw(ctx,p,source,{wrap=true,view='effect'}={}){
  const t=build(p);ctx.clearRect(0,0,SIZE,SIZE);
  if(view==='mask'){ctx.fillStyle='#273448';ctx.fillRect(0,0,SIZE,SIZE);ctx.drawImage(t.mask,0,0);return}
  if(view==='shadow'){ctx.fillStyle='#fff';ctx.fillRect(0,0,SIZE,SIZE);ctx.drawImage(t.shadow,0,0);return}
  ctx.drawImage(t.bg,0,0);
  if(view==='light'){ctx.drawImage(t.light,0,0);return}
  const output=ctx.getImageData(0,0,SIZE,SIZE),data=output.data;
  const src=source?source.getContext('2d').getImageData(0,0,p.w,p.h).data:null;
  for(const m of t.map){
   const sx=m.u*(p.w-1),sy=m.v*(p.h-1),ix=Math.floor(sx),iy=Math.floor(sy),jx=Math.min(ix+1,p.w-1),jy=Math.min(iy+1,p.h-1),fx=sx-ix,fy=sy-iy;
   for(let channel=0;channel<3;channel++){
    let c=248;
    if(src&&(!m.side||wrap))c=src[(iy*p.w+ix)*4+channel]*(1-fx)*(1-fy)+src[(iy*p.w+jx)*4+channel]*fx*(1-fy)+src[(jy*p.w+ix)*4+channel]*(1-fx)*fy+src[(jy*p.w+jx)*4+channel]*fx*fy;
    data[m.k+channel]=c*m.shade*m.a+data[m.k+channel]*(1-m.a);
   }
  }
  ctx.putImageData(output,0,0);
 }
 return {draw,build};
})();



