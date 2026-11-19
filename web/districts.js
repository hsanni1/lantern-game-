import {V,box,beam,quad,triangles,range,pick} from './geometry.js';

export const districts={
  market:{name:'Adventure Market',hint:'Find the mandarin stall',spawn:[11.6,4.35],yaw:3.28,sky:[0x60a5ce,0xd4e4df],sun:0xffecd0,fill:1.28,power:2.2,direction:[-15,21,9],fog:.012},
  festival:{name:'Lantern Festival',hint:'Walk beneath the lanterns',spawn:[.6,7.4],yaw:Math.PI,sky:[0x151932,0x383748],sun:0x9da7e5,fill:.36,power:.78,direction:[-8,14,-12],fog:.016},
  minka:{name:'Minka Valley',hint:'Explore the paddy lane',spawn:[-8.6,5.25],yaw:4.3,sky:[0x57a4db,0xc9e5ed],sun:0xfff0cb,fill:1.38,power:2.3,direction:[16,25,8],fog:.014},
  golden:{name:'Golden-Hour Village',hint:'Follow the western road',spawn:[-18,4.85],yaw:1.95,sky:[0xeaa174,0xffd797],sun:0xffbe73,fill:1.1,power:3,direction:[-19,10,5],fog:.018}
};

// High straw eaves, exposed gable timbers, woven straw courses and shoji screens.
export function minkaHouse(g,w,d){
  const wall=1.75,top=wall+1.9,depth=d*.5+.43,half=w*.5+.43;
  box(g,0,.13,0,w+.18,.26,d+.16,0x918775);
  box(g,0,.99,0,w,1.53,d,0xe1cda5);
  for(const sign of [-1,1]){
    const z=sign*d/2;
    triangles(g,[[-w/2,wall,z],[w/2,wall,z],[0,top-.16,z]],[0xc9b88e]);
    for(let k=-3;k<=3;k++){
      const x=k*w/6;box(g,x,.99,z,.085,1.55,.11,0x59463c);
      const h=(top-wall)*(1-Math.abs(k)/3);
      if(h>.01)box(g,x,wall+h/2,z,.075,h,.1,0x59463c);
    }
    for(const y of [.28,.68,wall,wall+.57])box(g,0,y,z,y>wall?w*.60:w+.07,.09,.13,0x76503d);
    for(let i=0;i<10;i++)box(g,(i-4.5)*w/12,.97,z+.05,.025,.50,.055,0x76503d);
    const make=(x,y,z)=>[sign*x,y,z];
    quad(g,make(half,wall-.18,-depth),make(half,wall-.18,depth),make(0,top,depth),make(0,top,-depth),0xb79b65);
    for(let j=0;j<8;j++){
      const t=j/8,n=(j+1)/8;
      quad(g,make(half*t,top-(top-wall+.18)*t+.055,-depth),make(half*t,top-(top-wall+.18)*t+.055,depth),make(half*n,top-(top-wall+.18)*n+.09,depth),make(half*n,top-(top-wall+.18)*n+.09,-depth),pick([0xbda470,0xc6ac74,0xc1a56f,0xb89b68]));
    }
    const pts=[],cols=[];
    for(let i=0;i<1300;i++){
      const t=range(0,.965),z=range(-depth,depth),u=Math.min(1,t+range(.03,.16));
      const y=t=>top-(top-wall+.18)*t+.10;
      pts.push(make(t*half,y(t),z),make(u*half,y(u),z-.012),make(u*half,y(u),z+.012));
      cols.push(pick([0xcfb57e,0xb39863,0xa68a5a,0xd7be88]));
    }
    triangles(g,pts,cols);
    box(g,sign*half,wall-.15,0,.18,.22,2*depth,0x9b8053);
  }
  for(const side of [-1,1]){
    const x=side*w*.5;
    for(let i=0;i<4;i++)box(g,x,1.0,(i/3-.5)*d,.095,1.58,.09,0x59463c);
    for(const y of [.35,.64,1.71])box(g,x,y,0,.12,.085,d+.09,0x76503d);
    box(g,x+side*.04,1.18,0,.07,.72,d*.43,0xebd8b7);
    for(let i=-3;i<=3;i++)box(g,x+side*.09,1.18,i*d*.068,.045,.77,.035,0x76503d);
    for(const y of [.81,1.2,1.55])box(g,x+side*.09,y,0,.045,.035,d*.46,0x76503d);
  }
  for(let z=-depth+.1;z<=depth;z+=.4)beam(g,V(-.21,top-.1,z),V(.18,top+.17,z),.035,0x76503d);
  beam(g,V(0,top+.06,-depth),V(0,top+.06,depth),.09,0x967a56);
}
