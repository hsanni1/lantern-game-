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
