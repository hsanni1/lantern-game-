import {box} from './geometry.js';

// Wall meshes also define the walk and camera colliders for an open doorway.
export function openRoom(parent,width,depth,bottom,top,opening,color){
  const y=(bottom+top)/2,height=top-bottom,t=.12;
  const wing=(width-opening)/2;
  const walls=[
    box(parent,0,y,-depth/2,width,height,t,color),
    box(parent,-width/2,y,0,t,height,depth,color),
    box(parent,width/2,y,0,t,height,depth,color)
  ];
  for(const sign of [-1,1]){
    walls.push(box(parent,sign*(width-wing)/2,y,depth/2,wing,height,t,color));
  }
  parent.userData.walls=walls;
}
