import {Box3,CanvasTexture,RepeatWrapping,SRGBColorSpace,Float32BufferAttribute} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function loadCharacter(url){
  const {scene}=await new GLTFLoader().loadAsync(url);
  scene.traverse(part=>{
    if(!part.isMesh)return;
    part.material.fog=false;
    part.material.toneMapped=false;
  });
  return scene;
}

// Blender procedural colors are absent from several exported PBR materials.
const pigments={
  DarkWood:0x4b322b,CrateWood:0x996947,StallWood:0x805434,ClayPot:0xbc784f,
  RoofTile:0x44495b,Sidewalk:0x777379,Foliage:0x51683c, Cobblestone:0x999599,
  Plaster_0:0xc4aa8b,Plaster_1:0xd7c0a6,Plaster_2:0xb6aa9d,Plaster_3:0xb98f7a,Plaster_4:0xcbb79b
};

function cobbles(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#575459';ctx.fillRect(0,0,256,256);
  for(let row=0;row<8;row++)for(let col=-1;col<4;col++){
    const x=col*64+(row%2)*32, y=row*32;
    const shade=145+Math.round(12*Math.sin((col+4)%4*36+row*19));
    ctx.beginPath();ctx.roundRect(x+1,y+1,62,30,[4,5,3,5]);
    ctx.fillStyle='rgb('+shade+','+(shade-2)+','+shade+')';ctx.fill();
    ctx.strokeStyle='#77747a';ctx.stroke();
  }
  const map=new CanvasTexture(canvas);
  map.colorSpace=SRGBColorSpace;map.wrapS=map.wrapT=RepeatWrapping;map.anisotropy=4;
  return map;
}

export async function loadStreet(url){
  const {scene:model}=await new GLTFLoader().loadAsync(url);
  const obstacles=[];
  const pavement=cobbles();
  model.updateMatrixWorld(true);
  model.traverse(part=>{
    if(/^(Stall_|House_|Barrel|Crate|Sack|Potted|TallPlant)/.test(part.name)&&part.parent===model){
      obstacles.push(new Box3().setFromObject(part));
    }
    if(part.isMesh){
      const mat=part.material;
      if(Object.hasOwn(pigments,mat.name))mat.color.setHex(pigments[mat.name]);
      if(mat.name==='Cobblestone'){
        const pos=part.geometry.attributes.position, uv=[];
        for(let i=0;i<pos.count;i++)uv.push(pos.getX(i)/2.4,pos.getZ(i)/2.4);
        part.geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));
        mat.map=mat.bumpMap=pavement;mat.bumpScale=.035;mat.roughness=.48;
      }
    }
    if(part.isDirectionalLight)part.visible=false;
    if(part.isPointLight){
      // Keep the Blender export's warm paper-lantern pools within the street.
      part.intensity*=.009;
      part.distance=12;
    }
  });
  return {
    model,obstacles,height:x=>Math.abs(x)>3?.15:0,
    canEnter(x,z){
      if(Math.abs(x)>5.25||z>11||z<-39.4)return false;
      return !obstacles.some(({min,max})=>x>min.x-.2&&x<max.x+.2&&z>min.z-.2&&z<max.z+.2);
    }
  };
}
