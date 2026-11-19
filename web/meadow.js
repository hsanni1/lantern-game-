import * as THREE from 'three';
import {random,range,pick} from './geometry.js';
import {walkSurface,groundHeight,river,breadth} from './valley.js';
const plots=[[8.3,7.1,4.8,2.75,-.07],[8.6,10.4,5.1,3.2,-.07],[14.4,7.4,5.9,3.4,.035],[-10.6,7.7,6.2,3.5,.12],[-12,11.4,5.8,3,.12],[-15,-2.8,6.2,3.3,-.04],[6.2,-16,4.4,4.4,.08],[-4.7,-15,5.6,3.4,.12],[-3.7,-3.78,6.32,4.7,0]];
export function shortMeadow(scene,homes){
  const positions=[],colors=[],col=new THREE.Color();
  const paths=new Map();
  for(const [x,z,r] of walkSurface)for(let i=Math.floor(x-r);i<=x+r;i++)for(let j=Math.floor(z-r);j<=z+r;j++){
    const key=i+':'+j;if(!paths.has(key))paths.set(key,[]);paths.get(key).push([x,z,r]);
  }
  for(let i=-175;i<177;i++)for(let j=-131;j<143;j++){
    const x=(i+random())*.165,z=(j+random())*.165;
    if(Math.abs(x-river(z))<breadth(z)+.13)continue;
    if(homes.some(b=>x>=b.min.x&&x<=b.max.x&&z>=b.min.z&&z<=b.max.z))continue;
    if((paths.get(Math.floor(x)+':'+Math.floor(z))||[]).some(p=>(x-p[0])**2+(z-p[1])**2<p[2]*p[2]))continue;
    if(plots.some(([cx,cz,w,d,t])=>Math.abs((x-cx)*Math.cos(t)-(z-cz)*Math.sin(t))<w*.5+.13&&Math.abs((z-cz)*Math.cos(t)+(x-cx)*Math.sin(t))<d*.5+.13))continue;
    const y=groundHeight(x,z)-.004;
    const ht=range(.058,.122),tint=pick([0x96a464,0x9da86c,0x8f9f60,0xa1aa6d,0xa7ae72]);
    for(let k=0;k<4;k++){
      const a=random()*6.283,xx=x+range(-.04,.04),zz=z+range(-.04,.04),width=range(.008,.017),dx=Math.cos(a),dz=Math.sin(a);
      positions.push(xx-dz*width,y,zz+dx*width,xx+dz*width,y,zz-dx*width,xx+dx*.033+.016,y+ht*range(.68,1.15),zz+dz*.046);
      col.setHex(tint);colors.push(col.r*.74,col.g*.81,col.b*.79,col.r*.87,col.g*.9,col.b*.89,col.r*1.14,col.g*1.1,col.b*.98);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));scene.add(mesh);
}
