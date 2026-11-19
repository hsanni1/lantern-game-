import * as THREE from 'three';
import { V, TAU, random, range, pick, group, beam, box, rock, triangles } from './geometry.js';

export const lawn = .36, waterY = .04;
export const river = z => .8 + .85*Math.sin(z*.42+.8) - .11*z + Math.max(0,Math.abs(z)-8)*.16*Math.sin(z*.12);
export const breadth = z => .98 + .16*Math.cos(.85*z) + .1*Math.sin(z*1.4) + .8*THREE.MathUtils.smoothstep(Math.abs(z), 6, 23);
const shore = (z,side) => river(z)+side*breadth(z);

function wave(x,z) {
  return Math.sin(x*.27+Math.cos(z*.29))*Math.cos(z*.31)+.32*Math.sin(x*.74+z*.63);
}

// A level floodplain beneath the houses grades into rolling foothills in every direction.
export function groundHeight(x,z) {
  const distance = Math.hypot(x,z);
  const rise = THREE.MathUtils.smoothstep(distance, 23, 59);
  const hills = 7 + 3.5*Math.sin(x*.115)*Math.cos(z*.083) + 2.1*wave(x*.62,z*.62);
  const bank = THREE.MathUtils.smoothstep(Math.abs(x-river(z))-breadth(z), 0, .35);
  return THREE.MathUtils.lerp(waterY-.06, lawn+rise*hills, bank);
}

function groundMaterial(kind) {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  const dirt=kind==='earth';
  ctx.fillStyle=dirt?'#b8a284':'#a9b083';ctx.fillRect(0,0,256,256);
  // Low-frequency patches under fine grit prevent the paths from reading as flat ribbons.
  for(let i=0;i<110;i++){
    const x=range(0,256),z=range(0,256),r=range(4,26);
    const tone=pick(dirt?['106,82,60','231,218,172']:['84,99,61','199,191,130']);
    for(const dx of [-256,0,256])for(const dz of [-256,0,256]){
      const grad=ctx.createRadialGradient(x+dx,z+dz,0,x+dx,z+dz,r);
      grad.addColorStop(0,'rgba('+tone+',.28)');grad.addColorStop(1,'rgba('+tone+',0)');
      ctx.fillStyle=grad;ctx.fillRect(x+dx-r,z+dz-r,2*r,2*r);
    }
  }
  for(let i=0;i<9500;i++){
    ctx.fillStyle=pick(dirt?['#6e634d66','#f4e9c975','#d8c5a788']:['#47593955','#ebe2a85c','#7e90567a']);
    ctx.fillRect(range(0,256),range(0,256),range(.5,2.8),range(.5,dirt?2:4));
  }
  const map=new THREE.CanvasTexture(canvas);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return new THREE.MeshStandardMaterial({map,roughness:.97,vertexColors:true,side:THREE.DoubleSide});
}

function surface(parent,positions,indices,colors,uvs,material) {
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material);
  mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

export function land(scene,details) {
  const earth=groundMaterial('meadow');
  const offsets=[0,.10,.26,.42,.8,1.3,2,3,4,5,6,7,8,9,11,13,15,18,21,24,27,30,34,38,42,46,51,56,62,70,80,95,115,145];
  for(const side of [-1,1]){
    const positions=[],indices=[],colors=[],uvs=[];
    for(let i=0;i<=340;i++){
      const z=(i-170)*.8;
      for(const [j,offset] of offsets.entries()){
        const x=shore(z,side)+side*offset, y=groundHeight(x,z);
        positions.push(x,y,z);uvs.push(x*.48,z*.48);
        const c=new THREE.Color(offset<.26?0x989b87:0xe2e8b6);
        c.multiplyScalar(.94+.055*wave(x,z)+.05*Math.sin(x*.42-z*.24));
        colors.push(c.r,c.g,c.b);
        if(i&&j){
          const k=i*offsets.length+j, a=k-offsets.length;
          if(side===1)indices.push(a-1,k-1,k,a-1,k,a);
          else indices.push(a-1,k,k-1,a-1,a,k);
        }
      }
    }
    surface(scene,positions,indices,colors,uvs,earth);
  }

  const positions=[],indices=[],colors=[],uvs=[];
  const palette=[0xb2b591,0x89aaa0,0x5d9898,0x528a8f,0x63979a,0x8daea0,0xadad87];
  for(let i=0;i<=544;i++){
    const z=-136+i*.5;
    for(let j=0;j<7;j++){
      const x=river(z)+(j/3-1)*breadth(z);
      positions.push(x,waterY,z);uvs.push(x,z);
      const color=new THREE.Color(palette[j]).multiplyScalar(1+.045*wave(x,z));
      colors.push(color.r,color.g,color.b);
      const k=i*7+j;
      if(i&&j)indices.push(k-8,k-1,k,k-8,k,k-7);
    }
  }
  const clock={value:0},water=new THREE.MeshPhongMaterial({vertexColors:true,shininess:85,specular:0x95afad});
  water.onBeforeCompile=shader=>{
    shader.uniforms.flowTime=clock;
    shader.vertexShader='varying vec2 flowPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nflowPosition=position.xz;');
    shader.fragmentShader='varying vec2 flowPosition;uniform float flowTime;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      vec2 p=flowPosition;
      float drift=flowTime*.82;
      float longWave=sin(p.y*6.-p.x*2.1-drift+sin(p.x*3.7+p.y*.61));
      float wave=sin(p.y*24.+p.x*3.6-drift*2.+longWave*2.4+sin(p.x*6.4));
      float viewAngle=abs(normalize(cameraPosition-vec3(p.x,.04,p.y)).y);
      float reflected=(1.-viewAngle)*(.16+.11*longWave+.05*wave);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.57,.70,.73),reflected);
      float ripple=smoothstep(.83,.99,wave)*smoothstep(.20,.84,longWave)*(.5+.5*sin(p.x*15.+p.y*3.));
      diffuseColor.rgb+=vec3(.115,.13,.122)*ripple;
    `);
  };
  surface(scene,positions,indices,colors,uvs,water);
  const pebble=[0x758a79,0x999c87,0xb6b19a,0x879483];
  for(let i=0;i<390;i++){
    const z=range(-26,26),side=pick([-1,1]),x=shore(z,side)+range(-.19,.08);
    const size=range(.055,.28);
    rock(details,x,waterY+.025,z,size,size*.68,size*range(.7,1.7),pick(pebble));
  }
  const reeds=[],tints=[];
  for(let j=0;j<115;j++){
    const z=range(-18,20),side=pick([-1,1]),x=shore(z,side)+side*range(-.09,.28);
    for(let k=0;k<16;k++){
      const xx=x+range(-.11,.11),zz=z+range(-.15,.15),h=range(.10,.22);
      const y=groundHeight(xx,zz)-.015,a=range(0,TAU),dx=Math.sin(a),dz=Math.cos(a);
      const base=[xx,y,zz],l=[xx+dx*.043-dz*.018,y+h*.59,zz+dz*.043+dx*.018];
      const r=[xx+dx*.043+dz*.018,y+h*.59,zz+dz*.043-dx*.018],end=[xx+dx*.21,y+h,zz+dz*.21];
      reeds.push(base,l,r,l,end,r);tints.push(0x78945b,pick([0x98aa6c,0xb1b878,0x91a366]));
    }
  }
  triangles(details,reeds,tints);
  return time=>{clock.value=time;};
}

export const walkSurface=[];
export function trail(scene,g,points,width,material,y=lawn+.022){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>V(x,y,z)));
  const length=curve.getLength(),steps=Math.ceil(length/.28),positions=[],indices=[],colors=[],uvs=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps,p=curve.getPointAt(t),tangent=curve.getTangentAt(t),normal=V(tangent.z,0,-tangent.x);
    walkSurface.push([p.x,p.z,width*.53]);
    for(const side of [-1,1]){
      const v=p.clone().addScaledVector(normal,side*width*.5*range(.95,1.04));
      positions.push(v.x,v.y,v.z);uvs.push(v.x*.62,v.z*.62);colors.push(1,1,1);
      if(random()<.31)rock(g,v.x,y,v.z,range(.045,.11),.028,range(.055,.13),pick([0x96917e,0xb4a592,0x888b79]));
    }
    const k=2*i;
    if(i)indices.push(k-2,k,k+1,k-2,k+1,k-1);
  }
  surface(scene,positions,indices,colors,uvs,material);
}

export function lanes(scene,g){
  const mat=groundMaterial('earth');
  const routes=[
    [[[-3.6,12],[-3.6,7],[-3.65,4.9],[-3.58,2.55],[-3.6,-.45]],1.53],
    [[[3.15,2.85],[7.2,2.88],[11.9,2.81],[15.1,3.0],[19.3,3.02],[22.7,3.92]],2.18],
    [[[-4.5,20],[-3.85,15.6],[-2.78,10.1],[-2.54,7.45],[-2.92,4.3],[-2.8,2.95]],1.42],
    [[[-21,5.3],[-11,4.15],[-6.4,3.63],[-4.43,3.52],[-2.82,2.89],[-.99,2.58]],1.03],
    [[[-3.4,3.09],[-3.01,2.0],[-3.57,.12]],.93],
    [[[2.42,2.64],[3.17,2.54],[4.44,3.19],[6.06,3.15],[12,4],[17,3.1],[22,2.1]],1.2],
    [[[2.94,2.6],[2.87,1.36],[2.68,-.38],[3.2,-1.75],[7.8,-1.8],[10,-3.8],[11,-9],[11.5,-18]],.83],
    [[[-8.7,4],[-9,1],[-9.2,-5],[-8.8,-10],[-9.8,-19]],.94],
    [[[-20,-7.3],[-14,-6.8],[-9,-7],[-6,-7.5],[-2.2,-8.8],[.3,-9.5]],.94],
    [[[3.2,-10.1],[5.6,-11.1],[11.4,-9.8],[17,-10]],.93]
  ];
  for(const [points,width] of routes)trail(scene,g,points,width,mat);
  // Irregular cut-stone pavement at the shrine approach, with recessed earth joints.
  for(let row=0;row<12;row++){
    const z=.04+row*.235,x=-3.58+.55*Math.sin(row*.17);
    for(let j=0;j<3;j++){
      const stone=rock(g,x+(j-1)*.244,lawn+.029,z+range(-.025,.025),range(.142,.19),.044,range(.117,.155),pick([0xa4a298,0x929789,0xb9b3a1]));
      stone.rotation.y=range(-.35,.35);
    }
  }
}

export function terrace(g) {
  const x=-3.7,z=-3.78,w=6.15,d=4.55,h=1.02;
  box(g,x,lawn+h/2,z,w,h,d,0x918d78);
  for(const side of [-1,1]){
    for(let tier=0;tier<3;tier++){
      const row=(length,alongX)=>{
        const count=Math.ceil(length/.64);
        for(let k=0;k<count;k++){
          const dist=(k+.5)*length/count-length/2;
          const b=box(g,x+(alongX?dist:side*w/2),lawn+(tier+.5)*h/3,z+(alongX?side*d/2:dist),
            alongX?length/count-.016:.18,h/3-.018,alongX?.18:length/count-.016,pick([0x999e8b,0xa7a58e,0x8a9483,0xa7a18b,0x979985]));
          b.rotation.z=range(-.025,.025);
        }
      };
      row(w,true);row(d,false);
    }
  }
  box(g,x,lawn+h+.015,z,w+.1,.12,d+.09,0xa8b479);
  for(let j=0;j<6;j++)box(g,-3.6,lawn+(j+1)*.09,-.02-j*.25,1.45,(j+1)*.18,.38,0xb4b09c);
}

export function bridge(g) {
  const z=2.58, span=3.8, root=group(g,river(z),lawn,z,-.05), half=span/2;
  const rise=x=>.11+.57*(1-(x/half)**2);
  for(let i=0;i<23;i++){
    const x=-half+(i+.5)*span/23;
    const b=box(root,x,rise(x),0,span/23-.006,.14,1.34,pick([0xa9523d,0xb76545,0xb25c41]));
    b.rotation.z=Math.atan(-1.14*x/(half*half));
  }
  for(const s of [-1,1]){
    for(let i=0;i<=6;i++){
      const x=-half+i*span/6,y=rise(x);
      box(root,x,y+.31,s*.65,.105,.86,.105,0xb44330);
      box(root,x,y+.76,s*.65,.15,.07,.15,0x494541);
      if(i<6){
        const xx=x+span/6;
        for(const hh of [.29,.63])beam(root,V(x,y+hh,s*.65),V(xx,rise(xx)+hh,s*.65),hh>.5?.068:.045,0xc04d37,.06);
        beam(root,V(x,y-.12,s*.59),V(xx,rise(xx)-.12,s*.59),.11,0x783f34);
      }
    }
  }
}

export function ripples() {
  const g=new THREE.Group(),segments=[],speeds=[];
  for(let i=0;i<79;i++) {
    const z=range(-6.75,6.7),x=river(z)+range(-.82,.82)*breadth(z),length=range(.08,.38);
    segments.push(x-length,waterY+.019,z,x,waterY+.02,z+.035,x+length*.3,waterY+.019,z-.013);
    speeds.push(range(.4,1.3));
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(segments,3));
  g.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xd6eee0,side:THREE.DoubleSide})));
  return {object:g,update(time){
    const attr=geo.attributes.position;
    for(let i=0;i<speeds.length;i++)for(let k=0;k<3;k++)attr.setZ(i*3+k,segments[i*9+k*3+2]+.11*Math.sin(time*speeds[i]+i));
    attr.needsUpdate=true;
  }};
}
