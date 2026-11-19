import * as THREE from 'three';
import {TAU, V, range, pick, group, beam} from './geometry.js';
import {lawn} from './valley.js';

function bladeGeometry(){
  // The raised midrib divides two tapered, slightly cupped halves.
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0, -.23,.02,.39, -.15,.035,.69, 0,-.055,1, .15,.035,.69, .23,.02,.39, 0,.116,.45
  ],3));
  geo.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);geo.computeVertexNormals();return geo;
}
// Cutouts retain the notched petals and the gaps between individual needles even
// at close range. Each flower and sprig still has its own position and orientation.
function sprigMaterial(type){
  const c=document.createElement('canvas');c.width=c.height=128;
  const ctx=c.getContext('2d');
  if(type==='flower'){
    ctx.translate(64,64);
    for(let i=0;i<5;i++){
      ctx.save();ctx.rotate(TAU*i/5);
      const shade=ctx.createLinearGradient(0,0,0,-58);
      shade.addColorStop(0,'#eaa4b8');shade.addColorStop(.4,'#ffe1e1');shade.addColorStop(1,'#fff8ed');
      ctx.fillStyle=shade;ctx.beginPath();ctx.moveTo(0,3);
      ctx.bezierCurveTo(-17,-8,-30,-43,-12,-57);ctx.quadraticCurveTo(-6,-61,0,-54);
      ctx.bezierCurveTo(17,-73,36,-39,12,-9);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#da9fa26b';ctx.lineWidth=.9;
      for(const k of [-1,0,1]){ctx.beginPath();ctx.moveTo(0,-6);ctx.quadraticCurveTo(k*11,-27,k*10,-46);ctx.stroke();}
      ctx.restore();
    }
    for(let k=0;k<12;k++){
      const a=k*2.4,r=5+4*(k%2);ctx.fillStyle='#d69748';ctx.beginPath();ctx.arc(r*Math.sin(a),r*Math.cos(a),2.1,0,TAU);ctx.fill();
    }
  }else{
    ctx.strokeStyle='#8a815b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(64,0);ctx.lineTo(64,127);ctx.stroke();
    for(let i=0;i<29;i++)for(const s of [-1,1]){
      const y=3+i*3.9,span=(48-.27*y)*range(.83,1.14);
      ctx.strokeStyle=pick(['#f1eecf','#c5d2b1','#e3e9c6','#b6c6a6']);ctx.lineWidth=2.0;
      ctx.beginPath();ctx.moveTo(64,y);ctx.quadraticCurveTo(64+s*span*.63,y+4,64+s*span,y+range(12,27));ctx.stroke();
    }
  }
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return new THREE.MeshLambertMaterial({map,alphaTest:.27,side:THREE.DoubleSide});
}

export function foliage(){
  const batches={leaf:[],flower:[],pine:[]},dummy=new THREE.Object3D();
  function put(type,matrix,x,y,z,yaw,pitch,roll,length,width,tint){
    dummy.position.set(x,y,z);dummy.rotation.set(pitch,yaw,roll,'YXZ');
    dummy.scale.set(width,length,length);dummy.updateMatrix();
    batches[type].push([new THREE.Matrix4().multiplyMatrices(matrix,dummy.matrix),tint]);
  }
  function finish(scene){
    const geos={leaf:bladeGeometry(),flower:new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2),
      pine:new THREE.PlaneGeometry(.85,1).rotateX(-Math.PI/2).translate(0,0,.5)};
    for(const [type,batch] of Object.entries(batches)){
      const material=type==='leaf'?new THREE.MeshLambertMaterial({side:THREE.DoubleSide}):sprigMaterial(type);
      // Cull nearby orchards separately when the camera moves into a lane.
      const plots=new Map();
      for(const instance of batch){
        const pos=instance[0].elements,key=Math.floor(pos[12]/6)+','+Math.floor(pos[14]/6);
        if(!plots.has(key))plots.set(key,[]);
        plots.get(key).push(instance);
      }
      const color=new THREE.Color();
      for(const plot of plots.values()){
        const mesh=new THREE.InstancedMesh(geos[type],material,plot.length);
        plot.forEach(([m,tint],i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,color.setHex(tint));});
        mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
      }
      batch.length=0;
    }
  }
  return {put,finish};
}

const bark=0x5b443b, twig=0x795b49;
const greens=[0x5d803f,0x78954e,0x8aa45a,0xabc173,0x718f4b];
const springLeaves=[0xb7a06a,0xba9470,0x94a166,0xadba76,0x928751];
const pinks=[0xf1bfd0,0xffd7df,0xffe4e4,0xf5c5d1,0xffede6,0xf8d2d3];
const needles=[0x3f634c,0x527853,0x67885c,0x54775b,0x779264];

function leafyTwig(f,matrix,start,end,flowers){
  const delta=end.clone().sub(start),heading=Math.atan2(delta.x,delta.z),count=flowers?7:10;
  for(let j=0;j<count;j++){
    const t=(j+.35)/count,p=start.clone().addScaledVector(delta,t);
    const a=heading+(j%2?1:-1)*range(.6,1.65),tilt=range(-.81,.46);
    const len=flowers?range(.087,.17):range(.13,.24);
    f.put('leaf',matrix,p.x,p.y,p.z,a,tilt,range(-.9,.9),len,len*1.24,pick(flowers?springLeaves:greens));
    if(flowers)for(let n=0;n<2;n++){
      const r=range(.043,.095),angle=a+n*2.4;
      f.put('flower',matrix,p.x+r*Math.sin(angle),p.y+range(-.04,.04),p.z+r*Math.cos(angle),
        angle,range(-1.2,1.2),range(-.9,.9),r,r,pick(pinks));
    }
  }
}

export function deciduous(parent,f,x,z,scale,flowers=true,angle=0){
  const g=group(parent,x,lawn,z,angle);g.scale.setScalar(scale);g.updateWorldMatrix(true,false);
  const origin=V(0,.02,0),b=V(.14,1.02,-.12),c=V(-.13,1.93,.07);
  beam(g,origin,b,.205,bark,.15,9);beam(g,b,c,.152,bark,.107,8);
  for(let j=0;j<5;j++){
    const a=j*TAU/5;
    beam(g,V(.46*Math.sin(a),0,.46*Math.cos(a)),V(.04,.32,0),.039,bark,.121,7);
  }
  for(let i=0;i<9;i++){
    const a=i*2.399+range(-.22,.22),upper=i>5,span=upper?range(.4,.89):range(1.15,1.77);
    const base=i%3===0?b:c,elbow=V(span*.57*Math.sin(a),upper?2.93:range(2.1,2.59),span*.57*Math.cos(a));
    const fork=V(span*Math.sin(a),upper?range(3.42,4.05):range(2.51,3.28),span*Math.cos(a));
    beam(g,base,elbow,.107,bark,.071,7);beam(g,elbow,fork,.072,bark,.049,7);
    for(let j=0;j<6;j++){
      const dir=a+(j-2.5)*.78+range(-.18,.18),rad=range(.41,.85);
      const start=j%3?fork:elbow,tip=start.clone().add(V(Math.sin(dir)*rad,range(.15,.76),Math.cos(dir)*rad));
      beam(g,start,tip,.043,twig,.015,6);
      for(let k=0;k<6;k++){
        const side=dir+(k%2?1:-1)*range(.55,1.65),size=range(.30,.57);
        const node=start.clone().lerp(tip,.23+k*.143);
        const end=node.clone().add(V(size*Math.sin(side),range(-.15,.33),size*Math.cos(side)));
        beam(g,node,end,.014,twig,.0048,4);leafyTwig(f,g.matrixWorld,node,end,flowers);
      }
    }
  }
}

export function conifer(parent,f,x,z,s,cedar,turn=0){
  const g=group(parent,x,lawn,z,turn);g.scale.setScalar(s);g.updateWorldMatrix(true,false);
  const h=cedar?4.25:3.1, lean=cedar?.05:.30;
  const trunk=t=>V(lean*Math.sin(t*5),h*t,lean*.52*Math.sin(t*7));
  for(let j=0;j<5;j++)beam(g,trunk(j/5),trunk((j+1)/5),.14*(1-j/5),bark,.14*(1-(j+.90)/5),7);
  const tiers=cedar?11:9;
  for(let i=0;i<tiers;i++){
    const t=.18+.78*i/tiers,count=cedar?6:4;
    for(let j=0;j<count;j++){
      const a=j*TAU/count+i*2.40+range(-.45,.45),r=(1-t*.88)*range(1.25,1.77);
      const base=trunk(t),end=base.clone().add(V(r*Math.sin(a),cedar?-r*.27:r*.12,r*Math.cos(a)));
      beam(g,base,end,(1-t)*.058+.009,bark,.012,5);
      for(let k=0;k<8;k++){
        const p=base.clone().lerp(end,.15+.114*k);
        for(const side of [-1,1]){
          const len=(.63-.036*k)*(cedar?.85:1)*(.99-.52*t);
          f.put('pine',g.matrixWorld,p.x,p.y,p.z,a+side*range(.40,1.32),range(-.36,.36),range(-.54,.54),len,len*1.2,pick(needles));
        }
      }
    }
  }
}

export function bush(parent,f,x,y,z,w,h,d,colors=greens){
  parent.updateWorldMatrix(true,false);
  for(let i=0;i<48;i++){
    const a=i*2.399,r=Math.sqrt((i+.5)/48),dx=Math.sin(a)*r,dz=Math.cos(a)*r;
    const yy=y+h*Math.sqrt(1-r*r),len=Math.max(.08,w*.37);
    f.put('leaf',parent.matrixWorld,x+dx*w,yy,z+dz*d,a,range(-.57,.73),range(-.6,.6),len,len*1.3,pick(colors));
  }
}
