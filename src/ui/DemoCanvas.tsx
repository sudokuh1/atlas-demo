import { useEffect, useRef } from "react";
import type { PointerEvent as Pointer } from "react";
import type { DemoGraph, DemoLayout, View } from "../model/demo-model";
import { connectedRelations, visibleRelations } from "../model/demo-model";
import { NodeIcon } from "./DemoIcons";

const kinds={project:"Projekt",area:"Bereich",module:"Modul",idea:"Idee"};
const statuses={planned:"Geplant",active:"In Arbeit",blocked:"Blockiert",done:"Erledigt"};
const WIDTH=1090,MIN=.2,MAX=2;
const clamp=(v:number)=>Math.max(MIN,Math.min(MAX,Math.round(v*100)/100));
type Point={x:number;y:number};
export function DemoCanvas({graph,layout,view,selected,zoom,onSelect,onZoom,active,focusToken,showTaskCounts}:{
  graph:DemoGraph;layout:DemoLayout;view:View;selected:string;zoom:number;
  onSelect:(id:string)=>void;onZoom:(n:number)=>void;active:boolean;focusToken:number;showTaskCounts:boolean;
}){
  const viewport=useRef<HTMLDivElement>(null);
  const fingers=useRef(new Map<number,Point>());
  const last=useRef<Point|null>(null);
  const oldDistance=useRef(0),moved=useRef(false),zoomRef=useRef(zoom),wasActive=useRef(false);
  zoomRef.current=zoom;
  const peers=new Set(connectedRelations(graph,selected).flatMap(r=>[r.from,r.to]));
  const height=640+Math.ceil(graph.nodes.filter(n=>n.kind==="idea").length/5)*125;
  function setZoomAt(value:number,anchor?:Point){
    const el=viewport.current,old=zoomRef.current,next=clamp(value);
    if(!el||Math.abs(next-old)<.005)return;
    const p=anchor??{x:el.clientWidth/2,y:el.clientHeight/2};
    const x=(el.scrollLeft+p.x)/old*next-p.x;
    const y=(el.scrollTop+p.y)/old*next-p.y;
    zoomRef.current=next;
    onZoom(next);
    requestAnimationFrame(()=>{el.scrollLeft=Math.max(0,x);el.scrollTop=Math.max(0,y);});
  }
  function fit(){
    const el=viewport.current;if(!el||!el.clientWidth)return;
    const value=clamp(Math.min((el.clientWidth-24)/WIDTH,(el.clientHeight-24)/height));
    zoomRef.current=value;onZoom(value);
    requestAnimationFrame(()=>el.scrollTo(0,0));
  }
  useEffect(()=>{
    if(active&&!wasActive.current&&window.matchMedia("(max-width:800px)").matches&&focusToken===0)fit();
    wasActive.current=active;
  },[active,focusToken,height]);
  useEffect(()=>{
    if(!active||focusToken===0)return;
    const p=layout.positions[selected],el=viewport.current;
    if(!p||!el)return;
    const frame=requestAnimationFrame(()=>el.scrollTo({
      left:Math.max(0,(p.x+95)*zoomRef.current-el.clientWidth/2),
      top:Math.max(0,(p.y+43)*zoomRef.current-el.clientHeight/2),
      behavior:"smooth"
    }));
    return ()=>cancelAnimationFrame(frame);
  },[focusToken,active,selected]);
  function local(e:Pointer<HTMLDivElement>):Point{
    const r=e.currentTarget.getBoundingClientRect();
    return {x:e.clientX-r.left,y:e.clientY-r.top};
  }
  function start(e:Pointer<HTMLDivElement>){
    if(e.pointerType!=="touch")return;
    if(fingers.current.size===0)moved.current=false;
    fingers.current.set(e.pointerId,local(e));
    const values=[...fingers.current.values()];
    if(values.length===1){last.current=values[0];oldDistance.current=0;}
    else if(values.length>=2){oldDistance.current=Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);last.current=null;}
  }
  function move(e:Pointer<HTMLDivElement>){
    if(e.pointerType!=="touch"||!fingers.current.has(e.pointerId))return;
    const p=local(e),el=viewport.current;if(!el)return;
    fingers.current.set(e.pointerId,p);
    const points=[...fingers.current.values()];
    if(points.length>=2){
      const [a,b]=points;
      const d=Math.hypot(a.x-b.x,a.y-b.y);
      if(oldDistance.current>0&&d>0){
        setZoomAt(zoomRef.current*d/oldDistance.current,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});
        moved.current=true;
      }
      oldDistance.current=d;
    } else if(last.current){
      const dx=p.x-last.current.x,dy=p.y-last.current.y;
      if(Math.abs(dx)+Math.abs(dy)>1){
        el.scrollLeft-=dx;el.scrollTop-=dy;moved.current=true;
      }
      last.current=p;
    }
  }
  function end(e:Pointer<HTMLDivElement>){
    if(e.pointerType!=="touch")return;
    fingers.current.delete(e.pointerId);
    const values=[...fingers.current.values()];
    last.current=values.length===1?values[0]:null;
    oldDistance.current=values.length>=2?Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y):0;
  }
  return <section className="atlas-canvas" aria-label="Projektkarte">
    <div className="atlas-canvas-controls" role="group" aria-label="Zoom">
      <button onClick={()=>setZoomAt(zoomRef.current/1.3)} disabled={zoom<=MIN} aria-label="Herauszoomen">−</button>
      <output aria-label="Zoomstufe">{Math.round(zoom*100)} %</output>
      <button onClick={()=>setZoomAt(zoomRef.current*1.3)} disabled={zoom>=MAX} aria-label="Hineinzoomen">+</button>
      <button className="atlas-fit" onClick={fit} aria-label="Gesamte Karte anzeigen">Einpassen</button>
    </div>
    <div className="atlas-canvas-viewport" ref={viewport} tabIndex={0}
      aria-label="Karte mit einem Finger verschieben, mit zwei Fingern zoomen"
      onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <div className="atlas-scaled" style={{width:WIDTH*zoom,height:height*zoom}}>
        <div className="atlas-board" style={{height,transform:`scale(${zoom})`}}>
          <svg viewBox={`0 0 ${WIDTH} ${height}`} width={WIDTH} height={height} aria-hidden="true">
            {visibleRelations(graph,view).map((r,i)=>{
              const a=layout.positions[r.from],b=layout.positions[r.to];if(!a||!b)return null;
              const x1=a.x+95,x2=b.x+95,y1=r.kind==="contains"?a.y+86:a.y+43,y2=r.kind==="contains"?b.y:b.y+43;
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
              className={"atlas-graph-node"+(n.id===selected?" selected":"")+
                (view==="dependencies"&&n.id!==selected&&!peers.has(n.id)?" dimmed":"")}
              style={{left:p.x,top:p.y}} aria-pressed={selected===n.id}
              onClick={()=>{if(!moved.current)onSelect(n.id);moved.current=false;}}>
              <span className="atlas-graph-icon"><NodeIcon id={n.id} kind={n.kind} size={21}/></span>
              <span className="atlas-graph-copy"><small>{kinds[n.kind]}</small><strong>{n.title}</strong>
                <em data-status={n.status}>{statuses[n.status]}</em></span>
              {showTaskCounts&&view==="progress"&&count>0&&<span className="atlas-graph-count">{count}</span>}
            </button>;
          })}
        </div>
      </div>
    </div>
    <div className="atlas-canvas-caption">Verschieben: ein Finger · Zoomen: zwei Finger oder die Steuerelemente</div>
  </section>;
}
