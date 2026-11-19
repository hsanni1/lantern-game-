import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let seed = 73318;
export const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
export const range = (a, b) => a + (b - a) * random();
export const pick = a => a[Math.floor(random() * a.length)];
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TAU = Math.PI * 2;

// Batch static meshes by material once the village is built.
const surface = new THREE.MeshLambertMaterial({vertexColors:true, side:THREE.DoubleSide});
const cube = new THREE.BoxGeometry();
const stone = new THREE.IcosahedronGeometry(1, 0);
const blank = new THREE.MeshBasicMaterial();
export function group(parent, x=0, y=0, z=0, turn=0) {
  const g = new THREE.Group(); g.position.set(x,y,z); g.rotation.y=turn; parent.add(g); return g;
}
export function piece(parent, geo, color, x=0, y=0, z=0, sx=1, sy=1, sz=1) {
  const m = new THREE.Mesh(geo,blank);
  m.userData.tint=color; m.position.set(x,y,z); m.scale.set(sx,sy,sz); parent.add(m); return m;
}
const timberTints=new Set([0x76503d,0x59463c,0xb44934,0xa17952,0xad8f66,0xa28764,0x9d8464,0x967a56,0xa38a66,
  0xa9523d,0xb76545,0xb25c41,0xb44330,0x514d45,0xc04d37,0x5b443b,0x795b49,0x987f4f,0xb49a60]);
let timber;
function timberMaterial(){
  if(timber)return timber;
  const c=document.createElement('canvas');c.width=512;c.height=128;
  const ctx=c.getContext('2d'),data=ctx.createImageData(c.width,c.height);
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const a=x/c.width*TAU,b=y/c.height*TAU;
    const grain=b*27+1.34*Math.sin(a*2)+.71*Math.cos(3*a+b);
    const knot=Math.cos(b-1.7)+.55*Math.cos(a*2-1);
    const v=222+12*Math.sin(grain)+6*Math.cos(grain*2.4)+7*Math.sin(3*b)+5*Math.sin(knot*42)*Math.max(0,knot);
    const i=4*(y*c.width+x);data.data[i]=v;data.data[i+1]=v-2;data.data[i+2]=v-5;data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  const map=new THREE.CanvasTexture(c);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  timber=new THREE.MeshLambertMaterial({map,vertexColors:true,side:THREE.DoubleSide});return timber;
}
export const box = (g,x,y,z,w,h,d,c) => {
  const mesh=piece(g,cube,c,x,y,z,w,h,d);
  if(timberTints.has(c))mesh.material=timberMaterial();
  return mesh;
};
export function rock(g,x,y,z,w,h,d,c) {
  const m=piece(g,stone,c,x,y,z,w,h,d); m.rotation.set(range(-.15,.15),range(0,TAU),range(-.1,.1)); return m;
}
const cylinders = new Map();
function cylinder(ratio, sides) {
  const key = ratio + '/' + sides;
  if(!cylinders.has(key)) cylinders.set(key,new THREE.CylinderGeometry(ratio,1,1,sides));
  return cylinders.get(key);
}
export function post(g,x,y,z,r,rt,h,c,n=8) {
  const mesh=piece(g,cylinder(rt/r,n),c,x,y,z,r,h,r);
  if(timberTints.has(c))mesh.material=timberMaterial();
  return mesh;
}
export function beam(g,a,b,r,c,rt=r,n=7) {
  const delta=b.clone().sub(a), mid=a.clone().lerp(b,.5);
  const m=post(g,mid.x,mid.y,mid.z,r,rt,delta.length(),c,n);
  m.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize()); return m;
}
export function triangles(g,pts,cols,faceUp=false) {
  if(faceUp)for(let i=0;i<pts.length;i+=3){
    const [a,b,c]=[pts[i],pts[i+1],pts[i+2]];
    if((b[2]-a[2])*(c[0]-a[0])<(b[0]-a[0])*(c[2]-a[2]))[pts[i+1],pts[i+2]]=[c,b];
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pts.flat(),3));
  geo.computeVertexNormals();
  if(cols) {
    const rgb=[];
    for(const col of cols){const c=new THREE.Color(col);for(let k=0;k<3;k++)rgb.push(c.r,c.g,c.b);}
    geo.setAttribute('color',new THREE.Float32BufferAttribute(rgb,3));
  }
  return piece(g,geo,0xffffff);
}
export function quad(g,a,b,c,d,col,faceUp=false) {return triangles(g,[a,b,d,b,c,d],[col,col],faceUp);}
export function bake(root) {
  root.updateMatrixWorld(true);
  const batches=new Map(), painted=new THREE.Group();
  root.traverse(m=>{
    if(!m.isMesh)return;
    if(m.material.map && m.userData.tint===undefined){
      const panel=m.clone();
      m.matrixWorld.decompose(panel.position,panel.quaternion,panel.scale);
      painted.add(panel);return;
    }
    const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();
    if(timber && m.material===timber){
      const pos=geo.attributes.position,uv=geo.attributes.uv;
      const axis=m.geometry===cube?(m.scale.x>=m.scale.y&&m.scale.x>=m.scale.z?'x':m.scale.y>=m.scale.z?'y':'z'):'y';
      for(let j=0;j<pos.count;j++){
        const x=pos.getX(j)*m.scale.x,y=pos.getY(j)*m.scale.y,z=pos.getZ(j)*m.scale.z;
        const u=axis==='x'?x:axis==='y'?y:z;
        const v=m.geometry===cube?(axis==='x'?y+z:axis==='y'?x+z:x+y):uv.getX(j)*m.scale.x*TAU;
        uv.setXY(j,u*.82+m.position.x*.31,v*3.1+m.position.z*.43);
      }
    }
    geo.applyMatrix4(m.matrixWorld);
    const mat=m.material.map?m.material:surface;
    if(!mat.map)geo.deleteAttribute('uv');
    if(!geo.getAttribute('color')){
      const values=new Float32Array(geo.attributes.position.count*3);
      const col=new THREE.Color(m.userData.tint);
      for(let i=0;i<values.length;i+=3)col.toArray(values,i);
      geo.setAttribute('color',new THREE.BufferAttribute(values,3));
    }
    if(!batches.has(mat))batches.set(mat,[]);
    batches.get(mat).push(geo);
  });
  for(const [mat,geos] of batches){
    const result=new THREE.Mesh(mergeGeometries(geos,false),mat);
    result.castShadow=result.receiveShadow=true;painted.add(result);
    for(const geo of geos)geo.dispose();
  }
  return painted;
}
