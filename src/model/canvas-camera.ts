// Infinite 2D canvas camera. World coordinates have no page origin or bounds.
// This module deliberately depends on neither React nor the project data model.
export type CanvasPoint={x:number;y:number};
export type Camera={x:number;y:number;zoom:number};
export const MIN_ZOOM=0.08;
export const MAX_ZOOM=4;
export const NODE_WIDTH=190;
export const NODE_HEIGHT=86;
export const INITIAL_CAMERA:Camera={x:0,y:0,zoom:1};

export function clampZoom(zoom:number):number{
  return Number.isFinite(zoom)?Math.min(MAX_ZOOM,Math.max(MIN_ZOOM,zoom)):1;
}
export function screenToWorld(point:CanvasPoint,camera:Camera):CanvasPoint{
  return {x:(point.x-camera.x)/camera.zoom,y:(point.y-camera.y)/camera.zoom};
}
export function worldToScreen(point:CanvasPoint,camera:Camera):CanvasPoint{
  return {x:camera.x+point.x*camera.zoom,y:camera.y+point.y*camera.zoom};
}
export function panCamera(camera:Camera,dx:number,dy:number):Camera{
  return {...camera,x:camera.x+dx,y:camera.y+dy};
}
// Keep the world position under the gesture cursor/finger stationary.
export function zoomCameraAt(camera:Camera,nextZoom:number,anchor:CanvasPoint):Camera{
  const zoom=clampZoom(nextZoom);
  if(Math.abs(zoom-camera.zoom)<1e-9)return camera;
  const world=screenToWorld(anchor,camera);
  return {x:anchor.x-world.x*zoom,y:anchor.y-world.y*zoom,zoom};
}
export function centerCameraOn(camera:Camera,world:CanvasPoint,width:number,height:number):Camera{
  return {...camera,x:width/2-world.x*camera.zoom,y:height/2-world.y*camera.zoom};
}
export function fitCamera(
  positions:Record<string,CanvasPoint>,
  nodeIDs:string[],
  width:number,height:number,
  padding=64
):Camera{
  if(width<=0||height<=0)return INITIAL_CAMERA;
  const points=nodeIDs.map(id=>positions[id]).filter((p):p is CanvasPoint=>
    !!p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(points.length===0)return {x:width/2,y:height/2,zoom:1};
  const minX=Math.min(...points.map(p=>p.x));
  const minY=Math.min(...points.map(p=>p.y));
  const maxX=Math.max(...points.map(p=>p.x+NODE_WIDTH));
  const maxY=Math.max(...points.map(p=>p.y+NODE_HEIGHT));
  const graphWidth=Math.max(1,maxX-minX),graphHeight=Math.max(1,maxY-minY);
  const availableWidth=Math.max(1,width-padding*2);
  const availableHeight=Math.max(1,height-padding*2);
  const zoom=clampZoom(Math.min(1.5,availableWidth/graphWidth,availableHeight/graphHeight));
  return {
    zoom,
    x:(width-graphWidth*zoom)/2-minX*zoom,
    y:(height-graphHeight*zoom)/2-minY*zoom
  };
}
