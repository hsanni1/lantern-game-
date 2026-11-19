import * as THREE from 'three';
import {V, TAU, pick, range, random, group, box, beam, post, triangles} from './geometry.js';
import {lawn, river, breadth, groundHeight} from './valley.js';

// A cloud mask sampled in sky direction stays at the horizon as the camera orbits.
function cloudMask(){
  const size=256, canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'), img=ctx.createImageData(size,size);
  const field=Array.from({length:32*32},random);
  function noise(x,y){
    const ix=Math.floor(x),iy=Math.floor(y);
    const a=x-ix,b=y-iy,s=a*a*(3-2*a),t=b*b*(3-2*b);
    const sample=(j,k)=>field[(k%32)*32+j%32];
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(ix,iy),sample(ix+1,iy),s),
      THREE.MathUtils.lerp(sample(ix,iy+1),sample(ix+1,iy+1),s),t);
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size*32,v=y/size*32;
    const value=noise(u,v)*.55+noise(u*2,v*2)*.28+noise(u*4,v*4)*.13+noise(u*8,v*8)*.04;
    const i=(y*size+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=Math.round(value*255);img.data[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;return tex;
}

export function sky(scene){
  const uniforms={zenith:{value:new THREE.Color()},horizon:{value:new THREE.Color()},mask:{value:cloudMask()},cloudLight:{value:.5}};
  const material=new THREE.ShaderMaterial({uniforms,side:THREE.BackSide,depthWrite:false,
    vertexShader:`varying vec3 direction;
      void main(){direction=position;vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position,1.);gl_Position=p.xyww;}`,
    fragmentShader:`uniform float cloudLight;uniform vec3 zenith,horizon;uniform sampler2D mask;varying vec3 direction;
      void main(){
        vec3 d=normalize(direction);
        vec3 base=mix(horizon,zenith,sqrt(smoothstep(-.015,.54,d.y)));
        vec2 uv=d.xz/max(.09,d.y+.06)*.046;
        float cloud=smoothstep(.44,.72,texture2D(mask,uv).r)*smoothstep(.01,.16,d.y);
        gl_FragColor=vec4(mix(base,mix(horizon,vec3(1.),cloudLight),cloud*.85),1.);
        #include <colorspace_fragment>
      }`});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1,40,20),material);
  dome.frustumCulled=false;dome.renderOrder=-1000;scene.add(dome);
  scene.fog=new THREE.FogExp2(0xd7dfca,.014);
  return (top,haze,night=false)=>{
    uniforms.cloudLight.value=night?.013:.5;
    uniforms.zenith.value.set(top);uniforms.horizon.value.set(haze);scene.fog.color.set(haze);
  };
}

function forestCard(broadleaf){
  const c=document.createElement('canvas');c.width=100;c.height=160;
  const p=c.getContext('2d');
  p.fillStyle='#564f40';p.fillRect(48,broadleaf?102:9,4,broadleaf?55:148);
  if(broadleaf){
    const twigs=[];
    function branch(x,y,a,len,level){
      const xx=x+Math.sin(a)*len,yy=y-Math.cos(a)*len;
      p.strokeStyle=level>1?'#625d4f':'#72755a';p.lineWidth=level*.74+.35;
      p.beginPath();p.moveTo(x,y);p.lineTo(xx,yy);p.stroke();
      if(level>0){
        branch(xx,yy,a*.49-range(.35,.84),len*range(.66,.86),level-1);
        branch(xx,yy,a*.49+range(.35,.84),len*range(.66,.86),level-1);
      }
      if(level<=1)twigs.push([x,y,xx,yy]);
    }
    for(let j=0;j<7;j++)branch(50,128-j*4.1,(j%2?1:-1)*range(.17,.98),range(18,30),3);
    for(const [x,y,xx,yy] of twigs){
      for(let k=0;k<42;k++){
        const t=random(),dx=range(-5,5),dy=range(-7,5);
        p.fillStyle=dy+dx*.4<0?pick(['#8e9f72','#a1ad80','#91a576']):pick(['#5f795e','#778a61','#839569']);
        p.beginPath();p.ellipse(x+(xx-x)*t+dx,y+(yy-y)*t+dy,range(.8,2),range(1.3,2.8),range(-1,1),0,TAU);p.fill();
      }
    }
  }else{
    for(let j=0;j<42;j++){
      const y=12+j*2.9,w=(3+j*.98)*(.83+.17*Math.sin(j*3.8));
      for(const s of [-1,1]){
        const endX=50+s*w,endY=y+range(5,11);
        p.strokeStyle=pick(['#485e50','#546959','#4b6254','#637662']);
        p.lineWidth=range(1.5,4);p.beginPath();p.moveTo(50,y);p.quadraticCurveTo(50+s*w*.5,endY+2,endX,endY-3);p.stroke();
        for(let k=0;k<16;k++){
          const t=k/16,x=50+s*w*t;
          p.beginPath();p.moveTo(x,y+(endY-y)*t);p.lineTo(x+s*range(1,5),y+(endY-y)*t+range(3,9));p.stroke();
        }
      }
    }
  }
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({map:tex,alphaTest:.37,side:THREE.DoubleSide});
}

export function highlands(scene){
  // Layer distant ridgelines outside the wooded foothills, with a distinct saddle in each range.
  for(let layer=0;layer<3;layer++){
    const verts=[],idx=[],colors=[],count=240;
    for(let i=0;i<=count;i++){
      const a=TAU*i/count,phase=layer*1.93;
      const r=58+layer*16+5*Math.sin(4*a+phase);
      const h=9+layer*5.3+3*Math.sin(3*a+phase)+4.8*Math.sin(7*a+phase)+1.15*Math.sin(16*a-.5)+.58*Math.sin(41*a+phase);
      for(let j=0;j<5;j++){
        const t=j/4,rad=r+t*16;
        verts.push(rad*Math.cos(a),t*h+Math.sin(a*32+t*3)*t*.8,rad*Math.sin(a));
        const col=new THREE.Color([0x66866e,0x738e86,0x8d9b9c][layer]);
        col.multiplyScalar(.82+.16*t+.09*Math.sin(a*27));colors.push(col.r,col.g,col.b);
        if(i&&j){const k=i*5+j;idx.push(k-6,k-1,k,k-6,k,k-5);}
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(idx);
    scene.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide})));
  }
  const stands=[[],[]],dummy=new THREE.Object3D();
  for(let i=0;i<370;i++){
    const a=range(0,TAU),d=range(25,65),cx=d*Math.cos(a),cz=d*Math.sin(a);
    const broadleaf=random()<.63,baseHeight=range(2.6,5.1),stand=stands[Number(broadleaf)];
    for(let j=0;j<13;j++){
      const x=cx+range(-3.8,3.8),z=cz+range(-3.8,3.8);
      if(Math.hypot(x,z)<22||Math.abs(x-river(z))<breadth(z)+1)continue;
      const h=baseHeight*range(.63,1.26),w=h*(broadleaf?range(.78,1.03):range(.38,.57)),y=groundHeight(x,z);
      const turn=range(0,Math.PI),color=pick([0xc1c8a4,0xa4b49d,0xbdc6ad,0xa7bcb1]);
      for(const rot of [turn,turn+Math.PI/2]){
        dummy.position.set(x,y+h*.49,z);dummy.rotation.set(0,rot,0);dummy.scale.set(w,h,1);dummy.updateMatrix();
        stand.push([dummy.matrix.clone(),color]);
      }
    }
  }
  stands.forEach((stand,i)=>{
    const woods=new THREE.InstancedMesh(new THREE.PlaneGeometry(),forestCard(i===1),stand.length),color=new THREE.Color();
    stand.forEach(([m,tint],j)=>{woods.setMatrixAt(j,m);woods.setColorAt(j,color.setHex(tint));});scene.add(woods);
  });
}

function paddy(g,x,z,w,d,turn,flooded){
  const plot=group(g,x,lawn,z,turn),ridge=0x8f9563;
  box(plot,0,.022,0,w,.05,d,flooded?0x8fa99a:0x857050);
  for(const side of [-1,1])for(const long of [true,false]){
    const len=long?w:d,edge=(long?d:w)*side*.5,pts=[],cols=[];
    const count=Math.ceil(len/.34);
    let prev;
    for(let i=0;i<=count;i++){
      const l=len*(i/count-.5),h=range(.085,.145),e=edge+range(-.026,.026);
      const at=(s,y)=>long?[l,y,s]:[s,y,l];
      const row=[at(e-.16,.016),at(e-.044,h),at(e+.039,h),at(e+.16,.016)];
      if(prev)for(let k=0;k<3;k++){
        pts.push(prev[k],row[k],row[k+1],prev[k],row[k+1],prev[k+1]);
        const tint=pick([ridge,0x929766,0x8b8f61]);cols.push(tint,tint);
      }
      prev=row;
    }
    triangles(plot,pts,cols,true);
  }
  const pts=[],cs=[];
  for(let row=-d/2+.23;row<d/2-.15;row+=.38){
    for(let col=-w/2+.23;col<w/2-.17;col+=.3){
      const xx=col+range(-.035,.035),zz=row+range(-.035,.035);
      for(let n=0;n<3;n++){
        const h=flooded?range(.07,.18):range(.16,.31),bend=range(-.1,.1);
        pts.push([xx-.018,.046,zz],[xx+.018,.046,zz+.015],[xx+bend,h,zz+range(-.06,.06)]);
        cs.push(pick([0x79904e,0x94a654,0x607c41]));
      }
      if(flooded&&random()<.06){
        pts.push([xx,.051,zz],[xx+.23,.051,zz+.008],[xx+.08,.051,zz+.02]);cs.push(0xb8c9b0);
      }
    }
  }
  triangles(plot,pts,cs);
}

export function farms(g){
  for(const [x,z,w,d,a,wet] of [[8.3,7.1,4.8,2.75,-.07,true],[8.6,10.4,5.1,3.2,-.07,true],
    [14.4,7.4,5.9,3.4,.035,false],[-10.6,7.7,6.2,3.5,.12,true],[-12,11.4,5.8,3,.12,false],
    [-15,-2.8,6.2,3.3,-.04,true],[6.2,-16,4.4,4.4,.08,true],[-4.7,-15,5.6,3.4,.12,false]]){
    paddy(g,x,z,w,d,a,wet);
  }
  // A second timber crossing connects the lane behind the shrine to the upstream houses.
  const z=-9.7,x=river(z),span=2*breadth(z)+1.3;
  for(let j=0;j<22;j++)box(g,x-span/2+(j+.5)*span/22,.55,z,span/22-.012,.15,.94,pick([0x967a56,0x9d8464,0xa38a66]));
  for(const side of [-1,1]){
    const zz=z+side*.42;
    for(const xx of [x-span/2,x,x+span/2])post(g,xx,.67,zz,.051,.047,1.11,0x72634b);
    beam(g,V(x-span/2,1.12,zz),V(x+span/2,1.12,zz),.042,0x927957);
  }
}
