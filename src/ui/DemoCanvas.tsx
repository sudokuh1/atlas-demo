import { useEffect,useRef,useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { DemoGraph,DemoLayout,View } from "../model/demo-model";
import { connectedRelations,visibleRelations } from "../model/demo-model";
import {
  INITIAL_CAMERA,MIN_ZOOM,MAX_ZOOM,NODE_WIDTH,NODE_HEIGHT,
  clampZoom,centerCameraOn,fitCamera,panCamera,zoomCameraAt
} from "../model/canvas-camera";
import type { Camera,CanvasPoint } from "../model/canvas-camera";
import { DemoIcon,NodeIcon } from "./DemoIcons";

const kinds={project:"Projekt",area:"Bereich",module:"Modul",idea:"Idee"};
const statuses={planned:"Geplant",active:"In Arbeit",blocked:"Blockiert",done:"Erledigt"};

type Props={
 graph:DemoGraph;layout:DemoLayout;view:View;selected:string;
 onSelect:(id:string)=>void;
 onMoveNode:(id:string,position:CanvasPoint)=>void;
 editing:boolean;onEditingChange:(editing:boolean)=>void;
 active:boolean;focusToken:number;showTaskCounts:boolean;
};
type NodeDrag={
 pointerId:number;id:string;start:CanvasPoint;position:CanvasPoint;moved:boolean;
};
export function DemoCanvas({
 graph,layout,view,selected,onSelect,onMoveNode,editing,onEditingChange,
 active,focusToken,showTaskCounts
}:Props){
 const viewport=useRef<HTMLDivElement>(null);
 const [camera,setCamera]=useState<Camera>(INITIAL_CAMERA);
 const cameraRef=useRef(camera);
 cameraRef.current=camera;
 const pointers=useRef(new Map<number,CanvasPoint>());
 const nodeDrag=useRef<NodeDrag|null>(null);
 const moved=useRef(false);
 const panTravel=useRef(0);
 const skipClick=useRef(false);
 const fitted=useRef(false);
 const peers=new Set(connectedRelations(graph,selected).flatMap(r=>[r.from,r.to]));

 function commit(next:Camera){
  cameraRef.current=next;
  setCamera(next);
 }
 function viewportPoint(clientX:number,clientY:number):CanvasPoint{
  const bounds=viewport.current?.getBoundingClientRect();
  return {x:clientX-(bounds?.left??0),y:clientY-(bounds?.top??0)};
 }
 function fit(){
  const el=viewport.current;
  if(!el||!el.clientWidth||!el.clientHeight)return;
  commit(fitCamera(layout.positions,graph.nodes.map(n=>n.id),el.clientWidth,el.clientHeight));
  fitted.current=true;
 }
 function zoomAt(value:number,point?:CanvasPoint){
  const el=viewport.current;
  if(!el)return;
  commit(zoomCameraAt(cameraRef.current,value,point??{
   x:el.clientWidth/2,y:el.clientHeight/2
  }));
 }
 useEffect(()=>{
  // The canvas may initially be display:none inside the mobile "Module" tab.
  // Only fit after it has real dimensions, never reset the camera on a pan.
  const el=viewport.current;if(!el)return;
  const observer=new ResizeObserver(()=>{
   if(!fitted.current&&el.clientWidth>0&&el.clientHeight>0)fit();
  });
  observer.observe(el);
  if(!fitted.current&&el.clientWidth>0&&el.clientHeight>0)fit();
  return ()=>observer.disconnect();
 },[active]);
 useEffect(()=>{
  if(!active||focusToken===0)return;
  const frame=requestAnimationFrame(()=>{
   const el=viewport.current;
   const p=layout.positions[selected];
   if(!el||!p||!el.clientWidth)return;
   const nextZoom=clampZoom(Math.max(cameraRef.current.zoom,.6));
   const current={...cameraRef.current,zoom:nextZoom};
   commit(centerCameraOn(current,{
    x:p.x+NODE_WIDTH/2,y:p.y+NODE_HEIGHT/2
   },el.clientWidth,el.clientHeight));
  });
  return ()=>cancelAnimationFrame(frame);
 },[active,focusToken]);

 useEffect(()=>{
  const el=viewport.current;if(!el)return;
  // Passive wheel listeners cannot prevent page scroll. A native non-passive
  // listener keeps trackpad gestures inside the canvas without global traps.
  const onWheel=(event:WheelEvent)=>{
   if(!el.clientWidth||!el.clientHeight)return;
   event.preventDefault();
   const unit=event.deltaMode===1?16:event.deltaMode===2?el.clientHeight:1;
   const dx=event.deltaX*unit,dy=event.deltaY*unit;
   if(event.ctrlKey||event.metaKey||event.altKey){
    const anchor=viewportPoint(event.clientX,event.clientY);
    commit(zoomCameraAt(cameraRef.current,
      cameraRef.current.zoom*Math.exp(-dy*.008),anchor));
   }else{
    commit(panCamera(cameraRef.current,-dx,-dy));
   }
  };
  el.addEventListener("wheel",onWheel,{passive:false});
  return ()=>el.removeEventListener("wheel",onWheel);
 },[]);

 function panStart(event:ReactPointerEvent<HTMLDivElement>){
  if(event.pointerType==="mouse"&&event.button!==0)return;
  if(pointers.current.size===0){moved.current=false;skipClick.current=false;panTravel.current=0;}
  pointers.current.set(event.pointerId,viewportPoint(event.clientX,event.clientY));
  // Capture background gestures. Node taps retain their native click target.
  if(event.target===event.currentTarget){
   try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* optional */}
  }
 }
 function panMove(event:ReactPointerEvent<HTMLDivElement>){
  const previous=pointers.current.get(event.pointerId);
  if(!previous)return;
  const next=viewportPoint(event.clientX,event.clientY);
  const before=[...pointers.current.values()];
  pointers.current.set(event.pointerId,next);
  const after=[...pointers.current.values()];
  if(before.length>=2&&after.length>=2){
   const [p0,p1]=before,[q0,q1]=after;
   const beforeMid={x:(p0.x+p1.x)/2,y:(p0.y+p1.y)/2};
   const afterMid={x:(q0.x+q1.x)/2,y:(q0.y+q1.y)/2};
   const beforeDistance=Math.hypot(p1.x-p0.x,p1.y-p0.y);
   const afterDistance=Math.hypot(q1.x-q0.x,q1.y-q0.y);
   const panned=panCamera(cameraRef.current,afterMid.x-beforeMid.x,
     afterMid.y-beforeMid.y);
   if(beforeDistance>0&&afterDistance>0){
    commit(zoomCameraAt(panned,panned.zoom*afterDistance/beforeDistance,afterMid));
   }else commit(panned);
   moved.current=true;
  }else{
   const dx=next.x-previous.x,dy=next.y-previous.y;
   if(Math.abs(dx)+Math.abs(dy)>=1){
    commit(panCamera(cameraRef.current,dx,dy));
    panTravel.current+=Math.hypot(dx,dy);
    if(panTravel.current>4){
     moved.current=true;
     try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* capture optional */}
    }
   }
  }
 }
 function panEnd(event:ReactPointerEvent<HTMLDivElement>){
  pointers.current.delete(event.pointerId);
 }
 function dragStart(event:ReactPointerEvent<HTMLButtonElement>,id:string){
  if(!editing)return; // Locked nodes can still be selected or used to pan.
  if(event.pointerType==="mouse"&&event.button!==0)return;
  const position=layout.positions[id];
  if(!position)return;
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);
  nodeDrag.current={
   id,pointerId:event.pointerId,
   start:{x:event.clientX,y:event.clientY},
   position:{...position},moved:false
  };
  skipClick.current=false;
 }
 function dragMove(event:ReactPointerEvent<HTMLButtonElement>){
  const drag=nodeDrag.current;
  if(!drag||drag.pointerId!==event.pointerId)return;
  event.stopPropagation();
  const dx=event.clientX-drag.start.x,dy=event.clientY-drag.start.y;
  if(!drag.moved&&Math.abs(dx)+Math.abs(dy)<4)return;
  drag.moved=true;
  onMoveNode(drag.id,{
   x:Math.round(drag.position.x+dx/cameraRef.current.zoom),
   y:Math.round(drag.position.y+dy/cameraRef.current.zoom)
  });
 }
 function dragEnd(event:ReactPointerEvent<HTMLButtonElement>){
  const drag=nodeDrag.current;
  if(!drag||drag.pointerId!==event.pointerId)return;
  event.stopPropagation();
  if(drag.moved)skipClick.current=true;
  nodeDrag.current=null;
 }
 function chooseNode(id:string){
  if(skipClick.current||moved.current){
   skipClick.current=false;moved.current=false;return;
  }
  onSelect(id);
 }
 const gridSize=Math.max(18,40*camera.zoom);
 return <section className="atlas-canvas" aria-label="Frei verschiebbare Projektkarte">
  <div className="atlas-canvas-controls" role="group" aria-label="Canvas-Zoom">
   <button onClick={()=>zoomAt(cameraRef.current.zoom/1.3)}
     disabled={camera.zoom<=MIN_ZOOM+.0001} aria-label="Herauszoomen">−</button>
   <output aria-label="Zoomstufe">{Math.round(camera.zoom*100)} %</output>
   <button onClick={()=>zoomAt(cameraRef.current.zoom*1.3)}
     disabled={camera.zoom>=MAX_ZOOM-.0001} aria-label="Hineinzoomen">+</button>
   <button className="atlas-fit" onClick={fit} aria-label="Alle Module einpassen">Einpassen</button>
  </div>
  <button type="button" className={"atlas-canvas-edit"+(editing?" unlocked":"")}
   aria-pressed={editing} onClick={()=>onEditingChange(!editing)}
   title={editing?"Modulpositionen sperren":"Modulpositionen zum freien Verschieben entsperren"}>
   <DemoIcon name={editing?"unlock":"lock"} size={17}/>
   <span>{editing?"Sperren":"Gesperrt"}</span>
  </button>
  <div className="atlas-canvas-viewport" ref={viewport} tabIndex={0}
   aria-label="Unbegrenzter Canvas: ziehen zum Verschieben, zwei Finger zum Zoomen. Schloss entsperren, um Module zu bewegen."
   style={{backgroundPosition:`${camera.x}px ${camera.y}px`,
    backgroundSize:`${gridSize}px ${gridSize}px`}}
   onPointerDown={panStart} onPointerMove={panMove}
   onPointerUp={panEnd} onPointerCancel={panEnd}>
   <div className="atlas-board" style={{
    transform:`translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.zoom})`
   }}>
    <svg className="atlas-connections" width="1" height="1" aria-hidden="true">
     {visibleRelations(graph,view).map((r,i)=>{
      const a=layout.positions[r.from],b=layout.positions[r.to];
      if(!a||!b)return null;
      const x1=a.x+NODE_WIDTH/2,x2=b.x+NODE_WIDTH/2;
      const y1=r.kind==="contains"?a.y+NODE_HEIGHT:a.y+NODE_HEIGHT/2;
      const y2=r.kind==="contains"?b.y:b.y+NODE_HEIGHT/2;
      const mid=(y1+y2)/2,chosen=r.from===selected||r.to===selected;
      return <path key={i} d={`M${x1} ${y1} C${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`}
       fill="none" stroke={chosen?"var(--atlas-accent)":"var(--atlas-graph-line)"}
       strokeWidth={chosen?2.5:1.5} strokeDasharray={r.kind==="contains"?"none":"5 4"}
       opacity={view==="dependencies"&&!chosen?0.18:1}/>;
     })}
    </svg>
    {graph.nodes.map(n=>{
     const p=layout.positions[n.id];if(!p)return null;
     const count=n.tasks.filter(t=>t.status!=="done").length;
     return <button key={n.id} type="button"
      className={"atlas-graph-node"+(editing?" movable":"")+(n.id===selected?" selected":"")+
       (view==="dependencies"&&n.id!==selected&&!peers.has(n.id)?" dimmed":"")}
      style={{left:p.x,top:p.y}} aria-pressed={selected===n.id}
      onPointerDown={event=>dragStart(event,n.id)}
      onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}
      onClick={()=>chooseNode(n.id)}>
      <span className="atlas-graph-icon"><NodeIcon id={n.id} kind={n.kind} size={21}/></span>
      <span className="atlas-graph-copy"><small>{kinds[n.kind]}</small><strong>{n.title}</strong>
       <em data-status={n.status}>{statuses[n.status]}</em></span>
      {showTaskCounts&&view==="progress"&&count>0&&
       <span className="atlas-graph-count">{count}</span>}
     </button>;
    })}
   </div>
  </div>
  <div className="atlas-canvas-caption">
   Karte: ziehen · Zoom: zwei Finger oder ± · Module: Schloss entsperren, dann frei platzieren
  </div>
 </section>;
}
