import * as THREE from 'three';
import {V,bake} from './geometry.js';
import {land,lanes,terrace,bridge,ripples,groundHeight} from './valley.js';
import {buildings} from './architecture.js';
import {garden,driftingPetals} from './garden.js';
import {foliage} from './grove.js';
import {farms,highlands,sky} from './countryside.js';
import {shortMeadow} from './meadow.js';
import {districts,minkaHouse} from './districts.js';
import {walkHeight,canEnter,followCamera} from './navigation.js';
import {marketTrade} from './market.js';
import {initMap} from './minimap.js';
import {loadCharacter} from './models.js';

const $=s=>document.querySelector(s);
async function start(){
  const host=$('#village'),scene=new THREE.Scene();
  const valley=new THREE.Group();scene.add(valley);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.append(renderer.domElement);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  const cam=new THREE.PerspectiveCamera(53,1,.045,220),setSky=sky(scene);
  const sun=new THREE.DirectionalLight(),ambient=new THREE.HemisphereLight();scene.add(sun,ambient,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-27,right:27,top:23,bottom:-23,near:.1,far:90});
  sun.shadow.bias=-.00016;sun.shadow.normalBias=.015;
  const work=new THREE.Group(),crowns=foliage(),flow=land(valley,work);
  lanes(valley,work);terrace(work);const {footprints,obstacles}=buildings(work,minkaHouse);
  const updateMap=initMap($('#minimap'),footprints);
  bridge(work);farms(work);garden(work,crowns);valley.add(bake(work));work.clear();
  crowns.finish(valley);highlands(valley);shortMeadow(valley,footprints);
  const water=ripples(),petals=driftingPetals();valley.add(water.object,petals.object);
  const boy=await loadCharacter(host.dataset.kimonoModel);
  boy.scale.setScalar(.8);
  scene.add(boy);
  const groundShadow=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0x3f392e,transparent:true,opacity:.26,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  groundShadow.rotation.x=-Math.PI/2;groundShadow.scale.set(.20,.13,1);scene.add(groundShadow);

  const keys=new Set(),forward=V(),eye=V(),target=V(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let world='market',floor=.36,stride=0,drag=null,last=0,dirty=true;
  const trade=marketTrade(scene,boy,$('#buy'),$('#purse'),$('#hint'),reduced);
  // Give the supplied rigid glTF a small alternating step, weighted from ankle to hip.
  const feet=[];
  boy.updateWorldMatrix(true,true);
  boy.traverse(m=>{
    if(!m.isMesh)return;
    const geom=m.geometry.clone(),pos=geom.attributes.position;
    const rootInverse=boy.matrixWorld.clone().invert(),local=rootInverse.multiply(m.matrixWorld),back=local.clone().invert();
    const offsets=new Float32Array(pos.count*3),v=V(),step=V();
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i).applyMatrix4(local);
      const weight=THREE.MathUtils.clamp((.56-v.y)/.45,0,1),side=Math.tanh(v.x*26);
      step.copy(v);step.z+=side*weight*.14;step.y+=weight*.03;step.applyMatrix4(back);
      offsets.set([step.x-pos.getX(i),step.y-pos.getY(i),step.z-pos.getZ(i)],i*3);
    }
    geom.morphTargetsRelative=true;geom.morphAttributes.position=[new THREE.Float32BufferAttribute(offsets,3)];
    m.geometry=geom;m.updateMorphTargets();feet.push(m);
  });

  function camera(snap,dt=.016){
    forward.set(Math.sin(boy.rotation.y),0,Math.cos(boy.rotation.y));
    const urban=world==='market';
    eye.copy(boy.position).addScaledVector(forward,urban?-3.7:-4.25);eye.y+=urban?1.65:1.88;


    target.copy(boy.position).addScaledVector(forward,urban?1.54:1.8);target.y+=.90;
    if(!snap)eye.lerp(cam.position,Math.exp(-dt*8));
    followCamera(boy.position,eye,obstacles,.90);
    cam.position.copy(eye);cam.lookAt(target);
  }
  function travel(key){
    const d=districts[key];world=key;keys.clear();drag=null;dirty=true;
    host.dataset.world=key;document.body.dataset.world=key;
    $('#place').textContent=d.name;
    $('#hint').textContent=key==='market'?(trade.purchaseHint()??d.hint):d.hint;
    const [x,z]=d.spawn;floor=walkHeight(x,z)??groundHeight(x,z);
    boy.position.set(x,floor+.022,z);boy.rotation.y=d.yaw;
    feet.forEach(m=>m.morphTargetInfluences[0]=0);camera(true);
    sun.position.set(...d.direction);sun.color.set(d.sun);sun.intensity=d.power;
    ambient.color.set(0xfff0da);ambient.groundColor.set(0xcab99a);ambient.intensity=d.fill;
    setSky(...d.sky,false);scene.fog.density=d.fog;
    petals.object.visible=key==='market';
    for(const b of document.querySelectorAll('button[data-world]'))b.setAttribute('aria-pressed',String(b.dataset.world===key));
    renderer.shadowMap.needsUpdate=true;host.focus({preventScroll:true});
  }
  function buy(){if(trade.buy(performance.now()))dirty=true;}
  $('#buy').onclick=buy;
  document.querySelectorAll('button[data-world]').forEach(b=>b.onclick=()=>travel(b.dataset.world));
  const motion=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
  document.addEventListener('keydown',e=>{if(e.code==='KeyE'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey)buy();if(!motion.has(e.code)||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();keys.add(e.code);dirty=true;});
  document.addEventListener('keyup',e=>{keys.delete(e.code);dirty=true;});
  function clear(){keys.clear();drag=null;dirty=true;}
  window.addEventListener('blur',clear);
  document.addEventListener('visibilitychange',clear);
  host.onpointerdown=e=>{
    if(drag || e.button!==0)return;
    host.setPointerCapture(e.pointerId);
    host.focus({preventScroll:true});
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,walk:0,turn:0};
  };
  host.onpointermove=e=>{
    if(drag?.id!==e.pointerId)return;
    if(e.pointerType==='mouse'){
      boy.rotation.y-=(e.clientX-drag.x)*.009;
      drag.x=e.clientX;
    }else{
      // Drag away from the touch origin and hold to keep walking or turning.
      const axis=distance=>Math.sign(distance)*Math.min(1,Math.max(0,Math.abs(distance)-8)/42);
      drag.walk=axis(drag.y-e.clientY);
      drag.turn=axis(drag.x-e.clientX);
    }
    dirty=true;
  };
  host.onlostpointercapture=e=>{if(e.pointerId===drag?.id){drag=null;dirty=true;}};
  function resize(){cam.aspect=innerWidth/innerHeight;cam.fov=cam.aspect<1?64:53;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);dirty=true;}
  addEventListener('resize',resize);resize();
  const initial=location.hash.slice(1);travel(Object.hasOwn(districts,initial)?initial:'market');
  $('#status').hidden=true;
  const pressed=(a,b)=>Number(keys.has(a)||keys.has(b));
  renderer.setAnimationLoop(now=>{
    if(document.hidden)return;
    if(reduced.matches&&!dirty&&!keys.size&&!drag)return;
    if(now-last<1000/40&&!dirty)return;
    const dt=Math.min(.1,(now-last)/1000);last=now;
    const turn=pressed('KeyA','ArrowLeft')-pressed('KeyD','ArrowRight')+(drag?.turn??0);
    const dir=pressed('KeyW','ArrowUp')-pressed('KeyS','ArrowDown')+(drag?.walk??0);
    boy.rotation.y+=turn*dt*1.85;
    const dist=dir*dt*(pressed('ShiftLeft','ShiftRight')?3.6:2.15),p=boy.position;
    const x=p.x+Math.sin(boy.rotation.y)*dist,z=p.z+Math.cos(boy.rotation.y)*dist;
    const oldX=p.x,oldZ=p.z;
    if(canEnter(x,p.z,floor,obstacles))p.x=x;
    if(canEnter(p.x,z,floor,obstacles))p.z=z;
    floor=walkHeight(p.x,p.z)??floor;
    const moved=Math.hypot(p.x-oldX,p.z-oldZ);stride+=moved*7;
    const gait=moved&&!reduced.matches?Math.sin(stride):0;
    feet.forEach(m=>m.morphTargetInfluences[0]=gait);
    p.y=floor+.022+Math.abs(gait)*.021;groundShadow.position.set(p.x,floor+.019,p.z);
    camera(false,dt);
    trade.update(now);
    const t=reduced.matches?0:now/1000;water.update(t);flow(t);if(petals.object.visible)petals.update(t);
    updateMap(p,boy.rotation.y);
    renderer.render(scene,cam);dirty=false;
  });
}
start().catch(e=>{console.error(e);$('#status').textContent='The village could not open. Try a browser with WebGL enabled.';});
