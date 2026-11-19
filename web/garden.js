import * as THREE from 'three';
import {V,range,group,post,rock,beam,triangles} from './geometry.js';
import {lawn,river,waterY} from './valley.js';
import {deciduous,conifer} from './grove.js';

function fence(g,points){
  let prev;
  for(const [x,z] of points){
    post(g,x,lawn+.32,z,.057,.051,.64,0x987f4f,7);
    if(prev)for(const y of [.22,.47]){
      beam(g,V(prev[0],lawn+y,prev[1]),V(x,lawn+y,z),.034,0xb49a60,.035);
      post(g,x,lawn+y,z,.065,.065,.085,0x64593f);
    }
    prev=[x,z];
  }
}
export function garden(g,f){
  deciduous(g,f,-7.28,-1.54,1.07,true,.18);
  deciduous(g,f,-8.7,3.8,.82,true,.26);
  deciduous(g,f,.12,-6.8,1.08,true,2.1);
  deciduous(g,f,1.9,-2.1,.74,true,.31);
  deciduous(g,f,23.4,-3.12,.96,true,.45);
  deciduous(g,f,14.9,-8,.86,true,.92);
  deciduous(g,f,-14.8,7.3,.65,false,-1.24);
  conifer(g,f,-9.81,-5.52,1.2,true,.3);
  conifer(g,f,-1.46,-5.65,.93,true,1);
  conifer(g,f,8.4,-4.62,.64,false,1.2);
  conifer(g,f,-15.2,-5,.85,false,.4);
  fence(g,[[-10.6,3.45],[-9.8,3.45],[-9,3.45],[-8.2,3.45],[-7.4,3.45],[-6.6,3.45]]);
  fence(g,[[7.25,5.85],[8.02,5.85],[8.79,5.85],[9.56,5.85],[10.33,5.85]]);
  // Small pale koi just under the highlights.
  for(const [z,k] of [[4.49,.22],[5.06,-.36],[-1.21,.37]]){
    const f=group(g,river(z)+k,waterY+.009,z,.26+k);
    rock(f,0,0,0,.078,.02,.21,0xffe3bb);
    rock(f,-.005,.013,.064,.068,.014,.071,0xe08a55);
    triangles(f,[[0,.009,-.14],[-.092,.01,-.28],[.07,.011,-.25]],[0xe5b28a]);
  }

}

export function driftingPetals(){
  const geo=new THREE.CircleGeometry(1,5), mat=new THREE.MeshBasicMaterial({color:0xf5b1c4,side:THREE.DoubleSide});
  const data=Array.from({length:61},()=>({x:range(-8.6,8),z:range(-5.8,5.8),offset:range(0,7),s:range(.025,.056),speed:range(.21,.43)}));
  const object=new THREE.InstancedMesh(geo,mat,data.length), dummy=new THREE.Object3D();
  object.frustumCulled=false;
  return {object,update(time){
    data.forEach((p,i)=>{
      const fall=(time*p.speed+p.offset)%6.3;
      dummy.position.set(p.x+.26*fall+.22*Math.sin(time*.62+i),6.49-fall,p.z+.22*Math.cos(time*.53+i));
      dummy.rotation.set(time*.7+i,time*.54+i,fall*1.41);dummy.scale.set(p.s,p.s*.52,p.s);
      dummy.updateMatrix();object.setMatrixAt(i,dummy.matrix);
    });object.instanceMatrix.needsUpdate=true;
  }};
}
