import * as THREE from 'three';
import { V, group, piece, box, rock, post, beam, quad, triangles, pick, range } from './geometry.js';
import {openRoom} from './rooms.js';
import { lawn } from './valley.js';

const wood=0x76503d, dark=0x59463c, vermilion=0xb44934, cream=0xf2dfb4;
const blue=[0x526575,0x586b7b,0x607486,0x556a7c];
const teal=[0x647e76,0x698880,0x647e76,0x72928a];
const clay=[0xa97058,0xb77d62,0xa96e56,0xb87c61];

// Four pitched surfaces share a curved eave and sweep up at the hip corners.
function roof(g,y,w,d,h,colors=blue) {
  const ridge=Math.max(.09,(w-d*.79)/2), pts=[],cs=[];
  const cap=colors===clay?0x815b4c:colors===teal?0x49655f:0x435a69;
  for(let side=0;side<4;side++){
    const long=side%2===0, s=side<2?1:-1;
    const count=Math.max(7,Math.round((long?w:d)/.145));
    const at=(u,t)=>{
      const x=long?u*(w/2*(1-t)+ridge*t):s*(w/2*(1-t)+ridge*t);
      const z=long?s*d/2*(1-t):u*d/2*(1-t);
      return [x,y+h*(.55*t+.45*t*t)+.15*(1-t)**2*Math.abs(u)**4,z];
    };
    for(let j=0;j<count;j++){
      const u=j/count*2-1, v=(j+1)/count*2-1;
      const courses=Math.max(5,Math.round(d/.46));
      for(let k=0;k<courses;k++){
        const lo=k/courses,hi=(k+1)/courses,color=pick(colors);
        const a=at(u,lo),b=at(v,lo),c=at(v,hi),end=at(u,hi);
        const lower=at(u+(v-u)*.27,lo),upper=at(u+(v-u)*.27,hi);
        // The lower edge of each fired tile overlaps the course below it.
        const underA=[...a],underB=[...b];
        a[1]+=.026;b[1]+=.026;lower[1]+=.042;upper[1]+=.016;
        pts.push(underA,underB,b,underA,b,a);cs.push(cap,cap);
        pts.push(a,lower,upper,a,upper,end,lower,b,c,lower,c,upper);cs.push(color,color,color,color);
      }
      const a=at(u,0),b=at(v,0);
      pts.push(a,b,[b[0],b[1]-.108,b[2]],a,[b[0],b[1]-.108,b[2]],[a[0],a[1]-.108,a[2]]);
      cs.push(cap,cap);
    }
    // Timber fascia visible below the slate.
    for(let k=0;k<8;k++){
      const a=at(k/4-1,0),b=at((k+1)/4-1,0);
      beam(g,V(a[0]*.988,a[1]-.123,a[2]*.988),V(b[0]*.988,b[1]-.123,b[2]*.988),.046,wood);
    }
  }
  triangles(g,pts,cs,true);
  beam(g,V(-ridge-.13,y+h+.045,0),V(ridge+.13,y+h+.045,0),.088,cap,.088,10);
  for(const s of [-1,1])post(g,s*(ridge+.10),y+h+.095,0,.075,.052,.17,cap);
}

function sign(g,x,y,z,w,h,chars,bg,ink) {
  const c=document.createElement('canvas');c.width=256;c.height=192;
  const p=c.getContext('2d');p.fillStyle=bg;p.fillRect(0,0,c.width,c.height);
  p.strokeStyle=ink;p.lineWidth=4;p.strokeRect(8,8,240,176);
  p.fillStyle=ink;p.font='bold 92px serif';p.textAlign='center';p.textBaseline='middle';
  const lines=chars.split('\n');
  lines.forEach((line,i)=>p.fillText(line,128,((i+.5)*172/lines.length)+10,218));
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:t}));
  m.position.set(x,y,z);g.add(m);
}

export function lantern(g,x,y,z,r=.18,c=0xe76e47){
  post(g,x,y,z,r,r,r*1.45,c,12);
  for(const s of [-1,1]){
    post(g,x,y+s*r*.82,z,r*(s>0?.94:.7),r*(s>0?.7:.94),r*.26,c,12);
    post(g,x,y+s*r,z,r*.69,r*.69,.05,0x60483d,10);
  }
  for(const d of [-.49,0,.49])post(g,x,y+d*r,z,r*1.015,r*1.015,.014,0xc75b42,12);
  post(g,x,y-r*1.24,z,.022,.018,.1,0xc28540);
}

function shoji(g,x,y,z,w,h){
  box(g,x,y,z,w,h,.055,0xf3dfb3);
  for(let j=0;j<=4;j++)box(g,x-w/2+j*w/4,y,z+.036,.029,h+.04,.048,wood);
  for(let j=0;j<=3;j++)box(g,x,y-h/2+j*h/3,z+.038,w,.03,.048,wood);
}
function porch(g,w,d) {
  box(g,0,.12,0,w+.2,.24,d+.2,0x908879);
  box(g,0,.29,.15,w+.4,.15,d+.57,wood);
  for(let j=0;j<4;j++)box(g,0,.37,d/2-.04+j*.12,w+.44,.045,.11,0xa17952);
}
function house(g,{x,z,y=lawn,w=3,d=2,h=1.78,turn=0,tiles=blue,banner,shop}){
  const b=group(g,x,y,z,turn);porch(b,w,d);
  const bottom=.37,top=bottom+h;
  box(b,0,bottom+h/2,0,w,h,d,cream);
  for(const s of [-1,1]){
    for(const xx of [-w/2,0,w/2])box(b,xx,bottom+h/2,s*d/2,.104,h,.12,wood);
    for(const yy of [bottom+.12,bottom+.43,top-.07])box(b,0,yy,s*d/2,w+.14,.09,.12,wood);
    for(const zz of [-d/2,0,d/2])box(b,s*w/2,bottom+h/2,zz,.12,h,.09,wood);
    for(const yy of [bottom+.12,bottom+.43,top-.07])box(b,s*w/2,yy,0,.12,.09,d,wood);
    const side=group(b,s*(w/2+.014),bottom+h*.59,0,s*Math.PI/2);
    shoji(side,0,0,.016,d*.61,h*.43);
    shoji(b,s*w*.283,bottom+h*.58,d/2+.025,w*.28,h*.49);
  }
  box(b,0,bottom+h*.4,d/2+.05,w*.24,h*.81,.09,dark);
  for(let k=0;k<6;k++)box(b,(k-2.5)*w*.035,bottom+h*.4,d/2+.107,.022,h*.73,.035,0xad8f66);
  if(shop){
    const rr=top-.28,front=d/2+.13;
    for(let j=0;j<5;j++) {
      const bw=w*.76/5, xx=(j-2)*bw;
      const flap=box(b,xx,rr-.19,front+.12,bw-.018,.39,.035,banner);
      flap.rotation.x=range(-.07,.07);
      box(b,xx,rr-.33,front+.15,bw-.035,.021,.01,0xe6d4b2);
    }
    beam(b,V(-w*.43,rr+.04,front+.14),V(w*.43,rr+.04,front+.14),.039,dark);
    sign(b,0,top+.06,front+.12,.65,.28,shop,'#674b3a','#fff2cf');
    lantern(b,-w*.43,rr-.32,front+.08,.16);
    // Shop bench, serving bowls, and a step up to the porch.
    box(b,w*.27,.58,front+.48,w*.44,.08,.28,wood);
    for(const s of [-1,1])box(b,w*.27+s*w*.17,.43,front+.48,.064,.28,.19,dark);
    for(let j=0;j<3;j++)post(b,w*(.15+.1*j),.657,front+.48,.045,.064,.077,0xc7d2c0);
    const lip=front+.63,awningW=w*.78;
    for(let j=0;j<5;j++){
      const left=-awningW/2+j*awningW/5,right=left+awningW/5-.012;
      quad(b,[left,rr+.045,front],[right,rr+.045,front],[right,rr-.21,lip],[left,rr-.21,lip],banner,true);
      box(b,(left+right)/2,rr-.34,lip,awningW/5-.015,.26,.026,banner);
      box(b,(left+right)/2,rr-.421,lip+.017,awningW/5-.04,.021,.016,0xf5ddaf);
    }
    for(const s of [-1,1]){
      post(b,s*awningW/2,(rr-.16)/2,lip,.035,.030,rr-.16,wood,6);
      beam(b,V(s*awningW/2,rr-.52,lip),V(s*awningW/2,rr-.01,front),.026,wood);
    }
    const flag=group(b,-w*.51,0,front+.47,.24);
    post(flag,0,1.04,0,.03,.022,2.08,0x987a4e);
    beam(flag,V(-.05,2.04,0),V(.48,2.04,0),.021,0x815f3f);
    box(flag,.23,1.57,0,.39,.85,.025,banner);
    sign(flag,.23,1.57,.02,.32,.74,shop.split('').join('\n'),banner===0x466d74?'#476c71':'#a84e3a','#f7e6c3');
  }
  roof(b,top+.25,w+.9,d+.86,Math.min(1.32,w*.36),tiles);
  box(b,0,.12,d/2+.62,w*.37,.23,.35,0xb4ab94);
  return b;
}

function temple(g){
  const b=group(g,-3.7,lawn+1.10,-3.87);
  porch(b,3.45,2.62);
  openRoom(b,2.98,2.10,.37,2.28,1.16,0xf0d8a3);
  // One low entry step bridges the terrace and the raised timber porch.
  box(b,0,.095,1.87,1.28,.19,.39,wood);
  box(b,0,.44,-.68,1.45,.15,.37,wood);
  for(const s of [-1,1]){
    for(const xx of [-1.5,1.5])box(b,xx,1.35,s*1.08,.13,1.99,.14,vermilion);
    shoji(b,s*.95,1.47,1.075,.77,.91);
    for(const zz of [-.61,.61]){
      const a=group(b,s*1.52,1.45,zz,s*Math.PI/2);shoji(a,0,0,0,.76,.92);
    }
    for(const zz of [-1.32,1.32]){
      post(b,s*1.73,1.34,zz,.105,.099,1.98,vermilion);
      box(b,s*1.73,2.22,zz,.40,.12,.32,wood);
    }
    box(b,0,2.28,s*1.32,3.8,.17,.16,vermilion);
    lantern(b,s*1.32,1.93,1.4,.19);
  }
  shoji(b,-1.05,1.18,1.16,.72,1.56);
  sign(b,0,2.24,1.427,.62,.26,'神社','#3e544f','#f6d389');
  roof(b,2.52,4.68,3.76,1.12,blue);
  box(b,0,3.70,0,2.1,.97,1.48,cream);
  for(const s of [-1,1]){
    for(const xx of [-1.06,-.52,0,.52,1.06])box(b,xx,3.73,s*.75,.09,.98,.09,vermilion);
    box(b,0,3.98,s*.76,2.18,.085,.10,wood);
    for(const xx of [-.54,.54])shoji(b,xx,3.71,s*.77,.65,.48);
  }
  roof(b,4.26,3.35,2.53,1.12,blue);
  post(b,0,5.53,0,.13,.10,.44,0x665c4a);
  for(let i=0;i<4;i++)post(b,0,5.72+i*.105,0,.15-i*.019,.11-i*.015,.055,0xb19757);
  post(b,0,6.10,0,.052,0,.34,0x8b805e);
}
export function torii(g,x,z,y=lawn,s=1){
  const t=group(g,x,y,z);t.scale.setScalar(s);
  for(const k of [-1,1]){
    post(t,k*.88,1.13,0,.126,.103,2.27,vermilion);
    post(t,k*.88,.16,0,.149,.144,.32,0x514d45);
  }
  box(t,0,1.78,0,2.42,.14,.17,vermilion);
  box(t,0,2.16,0,2.70,.15,.21,vermilion);
  box(t,0,1.98,0,.18,.36,.16,vermilion);
  for(let i=-6;i<6;i++){
    const x=i*.255,b=x+.255;
    beam(t,V(x,2.28+.13*(Math.abs(x)/1.53)**3,0),V(b,2.28+.13*(Math.abs(b)/1.53)**3,0),.113,0x414b48,.113,6);
  }
}
export function stoneLamp(g,x,z,y=lawn){
  post(g,x,y+.08,z,.22,.24,.16,0x8c9386,6);
  post(g,x,y+.35,z,.127,.11,.52,0xa7aa9a,6);
  box(g,x,y+.67,z,.38,.12,.38,0x939d8e);
  box(g,x,y+.86,z,.25,.28,.25,0xd4bd8c);
  for(const a of [-1,1])for(const b of [-1,1])box(g,x+a*.13,y+.86,z+b*.13,.054,.29,.054,0x909a8d);
  post(g,x,y+1.1,z,.31,.10,.24,0x949c8c,4).rotation.y=Math.PI/4;
  rock(g,x,y+1.25,z,.09,.11,.09,0xa9ad9a);
}
const fruitForm=new THREE.SphereGeometry(1,12,8);
function teaJar(g,x,y,z,s,color){
  const profile=[[.07,0],[.11,.015],[.135,.08],[.14,.18],[.12,.225],[.072,.25],[.082,.26],[.08,.275],[.06,.275],[.058,.245]];
  piece(g,new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r,h)),20),color,x,y,z,s,s,s);
  post(g,x,y+.248*s,z,.065*s,.065*s,.008*s,0x3d453e,16);
}
function counter(g,x,z,w){
  box(g,x,.49,z,w,.10,.68,0x967a56);
  for(const a of [-1,1])for(const b of [-1,1])box(g,x+a*(w*.5-.09),.24,z+b*.24,.07,.48,.07,dark);
  for(let i=0;i<Math.ceil(w/.14);i++)box(g,x-w*.5+.06+i*.14,.39,z+.303,.128,.18,.045,0xa17952);
}
function marketShop(homes,x,z,kind){
  const config=[
    [4.2,2.6,2.02,-.11,teal,0x416f66,'茶舗'],
    [4.55,2.65,2.32,.10,blue,0x9e4d38,'青果'],
    [3.9,2.4,2.10,.26,clay,0x444e73,'染物'],
    [3.9,2.55,1.95,-.12,teal,0x766541,'陶器']
  ][kind];
  const [w,d,h,turn,tiles,banner,shop]=config;
  const b=house(homes,{x,z,w,d,h,turn,tiles,banner,shop}),front=d/2;
  // Vertical wooden lattice at either side of an open sales bay.
  for(const side of [-1,1]){
    box(b,side*w*.37,1.08,front+.076,w*.18,1.25,.08,0x5d5040);
    for(let j=0;j<10;j++)box(b,side*w*.37+(j-4.5)*.078,1.08,front+.139,.025,1.24,.053,0xa17952);
    for(const y of [.55,1.12,1.67])box(b,side*w*.37,y,front+.14,w*.19,.04,.06,wood);
  }
  // A deep timber transom and closely spaced rafter tails under the tile eaves.
  for(let i=0;i<23;i++)box(b,(i-11)*w/24,h+.53,front+.115,.062,.10,.33,wood);
  // Woven split noren with a different dyed crest for each trade.
  const rr=.37+h-.28,lip=d/2+.76,clothW=w*.78;
  const shades=['#365f59','#a34c35','#495779','#776349'];
  const names=['御茶','みかん','染物','陶器'];
  for(let j=0;j<5;j++){
    const c=document.createElement('canvas');c.width=192;c.height=128;
    const ctx=c.getContext('2d');ctx.fillStyle=shades[kind];ctx.fillRect(0,0,192,128);
    for(let u=0;u<192;u+=3){ctx.fillStyle='rgba(255,225,195,.055)';ctx.fillRect(u,0,1,128);}
    for(let v=0;v<128;v+=3){ctx.fillStyle='rgba(51,40,27,.05)';ctx.fillRect(0,v,192,1);}
    ctx.fillStyle='#ebddba';ctx.strokeStyle='#ebddba';ctx.lineWidth=2;
    ctx.fillRect(0,113,192,3);ctx.fillRect(0,119,192,1);
    if(j>0&&j<=names[kind].length){
      ctx.font='bold 67px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(names[kind][j-1],96,57);
    }else{
      ctx.beginPath();ctx.arc(96,56,23,0,2*Math.PI);ctx.stroke();
      for(let k=0;k<3;k++){const a=k*Math.PI*2/3;ctx.beginPath();ctx.ellipse(96+8*Math.cos(a),56+8*Math.sin(a),7,10,a,0,Math.PI*2);ctx.fill();}
    }
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(clothW/5-.024,.39),new THREE.MeshLambertMaterial({map,side:THREE.DoubleSide}));
    panel.position.set((j-2)*clothW/5,rr-.402,lip+.022);b.add(panel);
  }
  box(b,0,h+.48,front+.353,1.18,.27,.10,0x59463c);
  sign(b,0,h+.48,front+.409,1.11,.22,['山のお茶','丸吉青果','藍染','陶房'][kind],'#534236','#f4e2ad');
  const cz=front+.98;
  counter(b,0,cz,3.05);
  const displayY=.553;
  if(kind===1||kind===0){
    for(const side of [-1,1]){
      const xx=side*(w*.40);
      beam(b,V(xx,rr+.24,front+.4),V(xx,rr+.24,front+.86),.029,dark);
      beam(b,V(xx,rr+.24,front+.86),V(xx,rr+.02,front+.86),.012,wood);
      lantern(b,xx,rr-.16,front+.86,.154,kind===1?0xd79866:0xe7d797);
    }
  }
  if(kind===1){
    // Slatted trays of mikan, with stems, leaves and a folded paper price card.
    for(let i=0;i<4;i++){
      const xx=-1.085+i*.71;
      box(b,xx,displayY,cz,.667,.055,.57,0xb1966c);
      for(const side of [-1,1]){
        box(b,xx,displayY+.066,cz+side*.27,.685,.12,.034,0xc4aa79);
        box(b,xx+side*.323,displayY+.066,cz,.029,.13,.54,0xb69a70);
      }
      const c=i<3?[0xeb8c30,0xe7a03a,0xe58231,0xe3a343]:[0xa4a44f,0xafac54,0xa0aa59];
      for(let row=0;row<3;row++)for(let k=0;k<4;k++){
        const fx=xx+(k-1.5)*.148+range(-.016,.016),fz=cz+(row-1)*.148+range(-.016,.016),fy=displayY+.14+range(-.009,.018);
        piece(b,fruitForm,pick(c),fx,fy,fz,.085,.073,.085);
        piece(b,fruitForm,0x4f713c,fx+.012,fy+.067,fz,.031,.007,.016);
        if(k<3&&row<2){
          piece(b,fruitForm,pick(c),fx+.071,fy+.105,fz+.067,.083,.072,.083);
          piece(b,fruitForm,0x586f3a,fx+.088,fy+.171,fz+.067,.029,.007,.013);
        }
      }
    }
    sign(b,.89,.87,cz+.32,.36,.22,'三文','#ead9ad','#493d31');
  }else if(kind===2){
    for(let i=0;i<12;i++){
      const c=[0x6a8298,0x384965,0xb6826a,0xe1ccaa,0x688d8c][i%5];
      const xx=-1+i%5*.44,yy=.61+Math.floor(i/5)*.1;
      box(b,xx,yy,cz,.41,.09,.50,c);
      for(let j=-2;j<=2;j++)box(b,xx+j*.058,yy+.048,cz,.012,.008,.46,0xe1d6aa);
    }
  }else{
    for(let i=0;i<10;i++)teaJar(b,-1.21+i%5*.56,.55,cz+(Math.floor(i/5)-.5)*.31,i%4===0?1.36:1,[0x5d817c,0x9e724b,0xc5bb99,0x6e7776][i%4]);
  }
  return b;
}

export function buildings(g, farmhouse){
  const homes=group(g);
  temple(homes);
  marketShop(homes,4.95,-.45,0);
  marketShop(homes,11.55,-.2,1);
  marketShop(homes,17.95,.4,2);
  marketShop(homes,18.2,-8.9,3);
  torii(g,-3.6,-.92,lawn+.54,.88);
  for(const z of [-.25,2.3,5.9])for(const s of [-1,1])stoneLamp(g,-3.68+s*1.23,z);
  // A braided shimenawa and folded paper shide hang from the gate lintel.
  const z=-.82,base=lawn+.54+1.55;
  for(let strand=0;strand<3;strand++){
    const pos=t=>V(-4.37+t*1.55,base-.19*Math.sin(t*Math.PI)+.016*Math.cos(t*80+strand*2.094),z+.023*Math.sin(t*80+strand*2.094));
    for(let k=0;k<64;k++)beam(g,pos(k/64),pos((k+1)/64),.018,[0xb6a17a,0xccb889,0x9f865c][strand],.019,5);
  }
  for(const t of [.14,.32,.5,.68,.86]){
    const x=-4.37+t*1.55,y=base-.19*Math.sin(t*Math.PI);
    for(let j=0;j<3;j++)box(g,x+(j%2)*.026,y-.058-.061*j,z+.032,.065,.089,.008,0xf3eacd);
  }
  for(let j=0;j<13;j++){
    const z=2.91+j*.30;
    for(let k=-1;k<=1;k++){
      const slab=rock(g,-3.63+k*.36+range(-.03,.03),lawn+.035,z+range(-.025,.025),.205,.04,.155,pick([0x989b88,0xaaab95,0xa7a997,0xb4af9a]));
      slab.rotation.y=range(-.19,.19);
    }
  }
  const cottages=[
    [-13,1.4,3.35,2.55,.22],[-21,-2.5,3.65,2.6,-.11],[-11.4,-8.5,2.95,2.45,2.8],
    [-4.2,-14.5,3.25,2.2,.21],[-19.2,-12.4,3.2,2.5,-.22],
    [6.7,-11.3,3.7,2.3,.18],[13.1,-17,3.1,2.4,.14],
    [-19.3,8.1,2.9,1.95,2.8]
  ];
  for(const [i,[x,z,w,d,turn]] of cottages.entries()){
    const home=i===0;
    const building=group(homes,x,lawn,z,home?0:turn);
    if(x<0)farmhouse(building,w,d,home);
    else cottage(building,w,d,i);
  }
  homes.updateWorldMatrix(true,true);
  const footprints=[],obstacles=[];
  for(const home of homes.children){
    const bounds=new THREE.Box3().setFromObject(home);
    footprints.push(bounds);
    if(home.userData.walls){
      for(const wall of home.userData.walls)obstacles.push(new THREE.Box3().setFromObject(wall));
    }else obstacles.push(bounds);
  }
  return {footprints,obstacles};
}

// Plaster gable ends, staggered roof courses and a timber lean-to distinguish the
// farmhouses along the outer lanes from the hipped shop roofs in the square.
function cottage(g,w,d,i){
  const h=1.75+(i%3)*.30, peak=h+.78+(i%2)*.22,roofColor=[blue,teal,clay,blue][i%4];
  box(g,0,.14,0,w+.12,.28,d+.12,0x969388);
  box(g,0,h/2+.12,0,w,h-.23,d,pick([0xe8d5ae,0xe0cba3,0xe4d8bd]));
  for(const side of [-1,1]){
    const xx=side*w/2;
    triangles(g,[[xx,h,-d/2],[xx,h,d/2],[xx,peak,0]],[0xe6d6b9]);
    for(const zz of [-d/2,0,d/2])box(g,xx,h/2,zz,.09,h,.1,wood);
    box(g,xx,h,0,.13,.11,d,wood);
    const z=side*(d/2+.025);
    for(const x of [-w*.49,0,w*.49])box(g,x,h*.51,z,.095,h*.98,.08,wood);
    for(const y of [.34,.50,h-.08])box(g,0,y,z,w+.06,.084,.08,wood);
    shoji(g,-w*.26,h*.55,z,w*.32,.73);
    box(g,w*.23,.74,z,w*.22,1.21,.095,dark);
    for(let k=0;k<5;k++)box(g,w*(.146+k*.041),.74,z+side*.057,.041,1.13,.032,0xa28764);
    const eave=d/2+.38,half=w/2+.26;
    quad(g,[-half,peak+.07,0],[half,peak+.07,0],[half,h-.13,side*eave],[-half,h-.13,side*eave],roofColor[0],true);
    for(let k=0;k<Math.ceil(w/.14);k++){
      const x=-half+(k+.5)*2*half/Math.ceil(w/.14);
      beam(g,V(x,peak+.077,0),V(x,h-.12,side*eave),.028,pick(roofColor),.031,5);
    }
    for(let k=1;k<6;k++){
      const t=k/6,y=peak+.088+(h-.13-peak-.07)*t;
      beam(g,V(-half,y,side*eave*t),V(half,y,side*eave*t),.012,roofColor[0],.012,4);
    }
    box(g,0,h-.17,side*eave,w+.54,.11,.082,dark);
  }
  beam(g,V(-w/2-.37,peak+.11,0),V(w/2+.37,peak+.11,0),.078,roofColor[0]);
  for(const x of [-w*.44,w*.44])post(g,x,.75,d/2+.64,.049,.046,1.52,wood);
  quad(g,[-w*.49,1.73,d/2],[w*.49,1.73,d/2],[w*.49,1.49,d/2+.73],[-w*.49,1.49,d/2+.73],pick(roofColor),true);
  box(g,0,.19,d/2+.25,w*.99,.09,.65,wood);
}
