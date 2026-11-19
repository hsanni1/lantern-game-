import {river,breadth,walkSurface} from './valley.js';

// The view box uses world X/Z units. Negative Z (north) is up.
export function initMap(svg, buildings) {
  const ns = 'http://www.w3.org/2000/svg';
  const ground = svg.querySelector('.map-ground');
  function shape(type, attrs) {
    const el = document.createElementNS(ns,type);
    for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
    ground.append(el);
  }
  const banks = [[],[]];
  for (let z=-22; z<=22; z+=.4) {
    banks[0].push([river(z)-breadth(z),z]);
    banks[1].unshift([river(z)+breadth(z),z]);
  }
  shape('polygon',{points:banks.flat().map(p=>p.join(',')).join(' '),fill:'#89b8b4'});
  // Path stamps follow the very same sampled trails used for grass exclusion.
  const trail = walkSurface.map(([x,z,r]) =>
    `M${x-r} ${z}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0`).join('');
  shape('path',{d:trail,fill:'#e8d6ae'});
  for (const {min,max} of buildings) {
    shape('rect',{x:min.x,y:min.z,width:max.x-min.x,height:max.z-min.z,rx:.25,fill:'#ac9875'});
  }
  for (const [z,width] of [[2.58,3.8],[-9.7,2*breadth(-9.7)+1.3]]) {
    shape('rect',{x:river(z)-width/2,y:z-.46,width,height:.92,fill:'#9a664a'});
  }
  const marker=svg.querySelector('.map-player');
  let lastX,lastZ,lastYaw;
  return (position,yaw)=>{
    if (position.x===lastX && position.z===lastZ && yaw===lastYaw) return;
    lastX=position.x;lastZ=position.z;lastYaw=yaw;
    marker.setAttribute('transform',`translate(${lastX} ${lastZ}) rotate(${-yaw*180/Math.PI})`);
  };
}
