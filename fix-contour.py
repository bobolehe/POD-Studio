from pathlib import Path
p=Path(r'D:\codex\聚鼎设计页功能调研\index.html');s=p.read_text(encoding='utf-8-sig')
s=s.replace('function drawWarp(p){', '''function bottomContour(p){
 if(p.bottomContour)return p.bottomContour;
 const c=document.createElement('canvas');c.width=c.height=1000;
 const g=c.getContext('2d');g.drawImage(p.img,0,0,1000,1000);
 const pix=g.getImageData(0,0,1000,1000).data,points=new Float32Array(1000);
 const left=p.quad[3],right=p.quad[2];
 for(let x=Math.floor(left[0]);x<=Math.ceil(right[0]);x++){
  const line=left[1]+(right[1]-left[1])*(x-left[0])/(right[0]-left[0]);
  let min=Infinity,best=line;
  // Locate the darkest bevel/edge transition in a strictly bounded strip,
  // not an arbitrary expansion of the entire artwork.
  for(let y=Math.floor(line)-1;y<=Math.ceil(line)+5;y++){
   const k=(y*1000+x)*4,luma=(pix[k]+pix[k+1]+pix[k+2])/3;
   if(luma<min){min=luma;best=y+.5}
  }
  points[x]=best;
 }
 p.bottomContour=points;return points;
}
function drawWarp(p){''')
s=s.replace('const faces=[{quad:p.quad,side:false}];', 'const contour=bottomContour(p);\n const faces=[{quad:p.quad,side:false}];')
s=s.replace(')))+3);',')))+7);')
s=s.replace('const edge=face.side?0:1.5*Math.sin(Math.PI*Math.max(0,Math.min(1,u)));', 'const edge=face.side?0:6;')
s=s.replace('const vmax=1+edge/height;', '''const vmax=1+edge/height;
   function lower(xx){const ix=Math.max(Math.ceil(q[3][0]),Math.min(Math.floor(q[2][0])-1,Math.floor(xx))),t=Math.max(0,Math.min(1,xx-ix));return contour[ix]*(1-t)+contour[ix+1]*t}
   const lowerDistance=face.side?(vmax-v)*height:lower(x+.5)-(y+.5);''')
s=s.replace('(vmax-v)*height)<1.5)', 'lowerDistance)<1.5)')
s=s.replace("const extra=face.side?0:1.5*Math.sin(Math.PI*Math.max(0,Math.min(1,uu)))/height;if(uu>=0&&uu<=1&&vv>=0&&vv<=1+extra)hits++", "if(uu>=0&&uu<=1&&vv>=0&&(face.side?vv<=1:y+(sy+.5)/4<=lower(x+(sx+.5)/4)))hits++")
s=s.replace("a.download=products[current].id+'-mockup.png'", "a.download=products[current].id+'-mockup-v4.png'")
s=s.replace('>实时预览</span>', '>实时预览 · V4 底边校准</span>')
p.write_text(s,encoding='utf-8')
