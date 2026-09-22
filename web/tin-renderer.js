/* Tin templates: original PSD paths, multiple subpaths/holes and ordered nested layers. */
const TinRenderer=(()=>{
 function frames(list){return list.flatMap(f=>[f,...frames(f.CF||[])])}
 function path(points,sx,sy){const p=new Path2D();for(let i=0;i<(points||[]).length;i++){const v=points[i];if(v.Type===0)p.moveTo(v.X*sx,v.Y*sy);else if(v.Type===1)p.lineTo(v.X*sx,v.Y*sy);else if(v.Type===3){const b=points[++i],c=points[++i];if(!b||!c||b.Type!==3||c.Type!==3)throw Error('Invalid cubic path');p.bezierCurveTo(v.X*sx,v.Y*sy,b.X*sx,b.Y*sy,c.X*sx,c.Y*sy)}else if(v.Type===4)p.closePath();else throw Error('Unsupported path segment '+v.Type)}return p}


 // Bicubic Photoshop 4x4 control grid, then original homography.
 function point(f,u,v,sx,sy){const b=t=>[(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3],bu=b(u),bv=b(v);let x=0,y=0;
 for(let j=0;j<4;j++)for(let i=0;i<4;i++){const q=f.PS[j*4+i],w=bu[i]*bv[j];x+=q.x*w;y+=q.y*w}
 const m=f.M,z=m[2]*x+m[5]*y+m[8];return [(m[0]*x+m[3]*y+m[6])/z*sx,(m[1]*x+m[4]*y+m[7])/z*sy,u,v]}
 function warpMap(f,sx,sy){if(f._warp)return f._warp;const n=72,grid=[];for(let j=0;j<=n;j++)for(let i=0;i<=n;i++)grid.push(point(f,i/n,j/n,sx,sy));
 const x0=Math.max(0,Math.floor(Math.min(...grid.map(q=>q[0])))),y0=Math.max(0,Math.floor(Math.min(...grid.map(q=>q[1])))),x1=Math.min(1000,Math.ceil(Math.max(...grid.map(q=>q[0])))),y1=Math.min(1000,Math.ceil(Math.max(...grid.map(q=>q[1])))),w=x1-x0,h=y1-y0,uv=new Float32Array(w*h*2);uv.fill(-1);
 function tri(a,b,c){const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<1e-8)return;
 for(let y=Math.max(y0,Math.floor(Math.min(a[1],b[1],c[1])));y<Math.min(y1,Math.ceil(Math.max(a[1],b[1],c[1])));y++)for(let x=Math.max(x0,Math.floor(Math.min(a[0],b[0],c[0])));x<Math.min(x1,Math.ceil(Math.max(a[0],b[0],c[0])));x++){
 const l=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/det,t=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/det,z=1-l-t;if(Math.min(l,t,z)<-1e-6)continue;const k=((y-y0)*w+x-x0)*2;uv[k]=l*a[2]+t*b[2]+z*c[2];uv[k+1]=l*a[3]+t*b[3]+z*c[3]}}
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=grid[j*(n+1)+i],b=grid[j*(n+1)+i+1],c=grid[(j+1)*(n+1)+i],d=grid[(j+1)*(n+1)+i+1];tri(a,b,d);tri(a,d,c)}return f._warp={x0,y0,w,h,uv};}
 function main(scene){const fs=frames(scene.psdFrames);return scene.mainFrameIndex!=null?fs[scene.mainFrameIndex]:fs.find(f=>f.T==='SmartObject')}
 function uv(scene,x,y){const f=main(scene);if(f.PS?.length===16){const w=warpMap(f,1000/scene.width,1000/scene.height),ix=Math.floor(x)-w.x0,iy=Math.floor(y)-w.y0;if(ix<0||iy<0||ix>=w.w||iy>=w.h)return [-1,-1];const k=(iy*w.w+ix)*2;return [w.uv[k],w.uv[k+1]]}const os=f.OS.split(',').map(Number),q=psdInverse(f.M,x*scene.width/1000,y*scene.height/1000);return [q[0]/os[0],q[1]/os[1]]}
 function draw(ctx,scene,source,p){
  const sx=1000/scene.width,sy=1000/scene.height;ctx.clearRect(0,0,1000,1000);ctx.fillStyle='#fff';ctx.fillRect(0,0,1000,1000);
  const src=source?.getContext('2d').getImageData(0,0,p.w,p.h).data;
  function paint(list){for(const f of list){if(f.IV===false)continue;ctx.save();ctx.globalAlpha=f.O??1;
   if(f.PPC?.length)ctx.clip(path(f.PPC,sx,sy),'evenodd');
   if(f.T==='Raster'){ctx.globalCompositeOperation=f.BM==='Multiply'?'multiply':'source-over';ctx.drawImage(f.img,f.X*sx,f.Y*sy,f.img.width*2*sx,f.img.height*2*sy)}
   else if(f.T==='Group')paint(f.CF||[]);
   else if(f.T==='SmartObject'&&src){
    const os=f.OS.split(',').map(Number),m=f.M;
    const warp=f.PS?.length===16?warpMap(f,sx,sy):null;
    const corners=[[0,0],[os[0],0],[os[0],os[1]],[0,os[1]]].map(([u,v])=>{const z=m[2]*u+m[5]*v+m[8];return [(m[0]*u+m[3]*v+m[6])/z*sx,(m[1]*u+m[4]*v+m[7])/z*sy]});
    const x0=warp?warp.x0:Math.max(0,Math.floor(Math.min(...corners.map(q=>q[0])))),x1=warp?warp.x0+warp.w:Math.min(1000,Math.ceil(Math.max(...corners.map(q=>q[0])))),y0=warp?warp.y0:Math.max(0,Math.floor(Math.min(...corners.map(q=>q[1])))),y1=warp?warp.y0+warp.h:Math.min(1000,Math.ceil(Math.max(...corners.map(q=>q[1]))));
    if(x1>x0&&y1>y0){const layer=document.createElement('canvas');layer.width=x1-x0;layer.height=y1-y0;const g=layer.getContext('2d'),im=g.createImageData(layer.width,layer.height);
    for(let y=0;y<layer.height;y++)for(let x=0;x<layer.width;x++){
     const q=warp?null:psdInverse(m,(x+x0+.5)/sx,(y+y0+.5)/sy),wi=(y*layer.width+x)*2,u=warp?warp.uv[wi]:q[0]/os[0],v=warp?warp.uv[wi+1]:q[1]/os[1];if(u<0||u>1||v<0||v>1)continue;
     const px=Math.max(0,Math.min(p.w-1,u*p.w-.5)),py=Math.max(0,Math.min(p.h-1,v*p.h-.5)),ix=Math.floor(px),iy=Math.floor(py),jx=Math.min(p.w-1,ix+1),jy=Math.min(p.h-1,iy+1),fx=px-ix,fy=py-iy,k=(y*layer.width+x)*4;
     for(let c=0;c<3;c++)im.data[k+c]=src[(iy*p.w+ix)*4+c]*(1-fx)*(1-fy)+src[(iy*p.w+jx)*4+c]*fx*(1-fy)+src[(jy*p.w+ix)*4+c]*(1-fx)*fy+src[(jy*p.w+jx)*4+c]*fx*fy;im.data[k+3]=255;
    }g.putImageData(im,0,0);ctx.globalCompositeOperation=f.BM==='Multiply'?'multiply':'source-over';ctx.drawImage(layer,x0,y0);}
   }ctx.restore();}}
  paint(scene.psdFrames);
 }
 return {frames,draw,uv};
})();
