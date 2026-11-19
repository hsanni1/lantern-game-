import {Box3, Ray, Vector3} from 'three';
import {river,breadth,lawn,groundHeight} from './valley.js';
export function walkHeight(x,z){
  const archedX=x-river(2.58);
  if(Math.abs(archedX)<1.99&&Math.abs(z-2.58-archedX*.05)<.64)
    return lawn+.18+.57*Math.max(0,1-(archedX/1.9)**2);
  if(Math.abs(z+9.7)<.44&&Math.abs(x-river(-9.7))<breadth(-9.7)+.68)return .625;
  if(Math.abs(x-river(z))<breadth(z)+.13)return null;
  // Surfaces of the open house, shrine porch and its intermediate step.
  if(Math.abs(x+13)<1.74&&Math.abs(z-1.4)<1.35)return lawn+.29;
  const porchZ=z+3.87;
  if(Math.abs(x+3.7)<1.94&&porchZ>-1.46&&porchZ<1.72)return lawn+1.10+.39;
  if(Math.abs(x+3.7)<.67&&porchZ>=1.72&&porchZ<2.08)return lawn+1.10+.19;
  if(Math.abs(x+3.7)<3.15&&Math.abs(z+3.78)<2.32)return lawn+1.10;
  if(Math.abs(x+3.6)<.76&&z<.16&&z>-1.52)return lawn+.18*Math.min(6,Math.max(1,1+Math.floor((.13-z)/.25)));
  return groundHeight(x,z);
}
export function canEnter(x,z,height,buildings){
  if(Math.abs(x)>24||z<-18||z>18)return false;
  const floor=walkHeight(x,z);
  if(floor===null||Math.abs(height-floor)>.36)return false;
  return !buildings.some(({min,max})=>x>min.x-.05&&x<max.x+.05&&z>min.z-.05&&z<max.z+.05);
}

// Shorten the follow arm before an obstruction can hide the character.
const arm=new Ray(),expanded=new Box3(),intersection=new Vector3();
export function followCamera(player,eye,obstacles,pivotHeight=1.12){
  arm.origin.copy(player);arm.origin.y+=pivotHeight;
  arm.direction.subVectors(eye,arm.origin);
  let length=arm.direction.length();
  if(length===0)return;
  arm.direction.divideScalar(length);
  for(const obstacle of obstacles){
    expanded.copy(obstacle).expandByScalar(.055);
    if(arm.intersectBox(expanded,intersection))
      length=Math.min(length,Math.max(.08,arm.origin.distanceTo(intersection)-.08));
  }
  arm.at(length,eye);
}
