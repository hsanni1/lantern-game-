import * as THREE from 'three';

const price=3;
export function marketTrade(scene,boy,button,purse,message,reduced){
  const fruit=new THREE.Mesh(
    new THREE.SphereGeometry(.095,14,10),
    new THREE.MeshLambertMaterial({color:0xf39834})
  );
  fruit.scale.y=.86;
  const leaf=new THREE.Mesh(
    new THREE.SphereGeometry(.034,8,5),
    new THREE.MeshLambertMaterial({color:0x698247})
  );
  leaf.scale.set(1,.25,.5);leaf.position.set(.015,.095,0);fruit.add(leaf);
  scene.add(fruit);
  const counter=new THREE.Vector3(12.0,1.25,2.05);
  const hand=new THREE.Vector3();
  let coins=10,items=0,start=null;
  function nearCounter(){
    return Math.hypot(boy.position.x-11.8,boy.position.z-2.65)<2.2;
  }
  function purchaseHint(){
    if(items===0)return null;
    return coins<price?'Mandarin collected · 3 mon needed for another':'Mandarin collected';
  }
  function update(now){
    const near=nearCounter();
    button.hidden=!near;
    button.disabled=coins<price || start!==null;
    if(start!==null){
      const t=Math.min(1,(now-start)/520);
      hand.set(.22,.5,.12).applyAxisAngle(THREE.Object3D.DEFAULT_UP,boy.rotation.y).add(boy.position);
      fruit.position.lerpVectors(counter,hand,t);
      fruit.position.y+=Math.sin(t*Math.PI)*.25;
      if(t>=1){start=null;button.disabled=coins<price;}
    }
    if(start===null)fruit.position.copy(counter);
    fruit.visible=start!==null||coins>=price;
  }
  function buy(now){
    if(!nearCounter()||coins<price||start!==null)return false;
    coins-=price;items++;
    purse.textContent=coins+' mon · '+items+(items===1?' mandarin':' mandarins');
    message.textContent=purchaseHint();
    start=reduced.matches?null:now;update(now);
    return true;
  }
  purse.textContent='10 mon';
  return {buy,update,purchaseHint};
}
