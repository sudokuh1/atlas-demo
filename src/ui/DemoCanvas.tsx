import { useEffect, useRef } from "react";
import type { DemoGraph, DemoLayout, View } from "../model/demo-model";
import { connectedRelations, visibleRelations } from "../model/demo-model";
import { NodeIcon } from "./DemoIcons";

const kindName = {project:"Projekt",area:"Bereich",module:"Modul",idea:"Idee"};
const statusText = {planned:"Geplant",active:"In Arbeit",blocked:"Blockiert",done:"Erledigt"};

export function DemoCanvas({graph,layout,view,selected,zoom,onSelect,onZoom,active}:
  {graph:DemoGraph;layout:DemoLayout;view:View;selected:string;zoom:number;
   onSelect:(id:string)=>void;onZoom:(v:number)=>void;active:boolean}) {
  const viewport=useRef<HTMLDivElement>(null);
  const current=graph.nodes.find(n=>n.id===selected) ?? graph.nodes[0];
  const related=connectedRelations(graph,current.id);
  const selectedPeers=new Set(related.flatMap(r=>[r.from,r.to]));
  const links=visibleRelations(graph,view);
  const canvasHeight=640+Math.ceil(graph.nodes.filter(n=>n.kind==="idea").length/5)*125;
  useEffect(()=>{
    if (!active) return;
    const pos=layout.positions[selected];
    const el=viewport.current;
    if (!pos||!el) return;
    el.scrollTo({
      left:Math.max(0,(pos.x+95)*zoom-el.clientWidth/2),
      top:Math.max(0,(pos.y+43)*zoom-el.clientHeight/2),
      behavior:"smooth"
    });
  },[selected,zoom,active,layout]);
  return <section className="demo-canvas-pane" aria-label="Interaktive Projektkarte">
    <div className="demo-map-scroller" ref={viewport} tabIndex={0} aria-label="Verschiebbare Projektkarte">
      <div className="demo-scaled" style={{width:1090*zoom,height:canvasHeight*zoom}}>
        <div className="demo-board" style={{height:canvasHeight,transform:`scale(${zoom})`}}>
          <svg viewBox={`0 0 1090 ${canvasHeight}`} width="1090" height={canvasHeight} aria-hidden="true">
            <defs><marker id="demo-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 Z" fill="#90afd5"/>
            </marker></defs>
            {links.map((r,i)=>{
              const a=layout.positions[r.from],b=layout.positions[r.to];
              if(!a||!b)return null;
              const chosen=r.from===selected||r.to===selected;
              const x1=a.x+95,x2=b.x+95;
              const y1=r.kind==="contains"?a.y+85:a.y+42;
              const y2=r.kind==="contains"?b.y:b.y+42;
              const mid=(y1+y2)/2;
              return <path key={i} d={`M ${x1} ${y1} C ${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`}
                fill="none" stroke={chosen?"#b4dcff":"#54718f"} strokeWidth={chosen?2.9:1.6}
                opacity={view==="dependencies"&&!chosen?0.16:1}
                strokeDasharray={r.kind==="contains"?"none":"6 5"} markerEnd="url(#demo-arrow)"/>;
            })}
          </svg>
          {graph.nodes.map(n=>{
            const pos=layout.positions[n.id];if(!pos)return null;
            const dim=view==="dependencies"&&n.id!==current.id&&!selectedPeers.has(n.id);
            const open=n.tasks.filter(t=>t.status!=="done").length;
            return <button type="button" key={n.id}
              className={["demo-node",n.kind,n.id===selected?"selected":"",dim?"dimmed":""].join(" ")}
              style={{left:pos.x,top:pos.y}} onClick={()=>onSelect(n.id)}
              aria-pressed={n.id===selected}>
              <span className="demo-node-icon"><NodeIcon id={n.id} kind={n.kind}/></span>
              <span className="demo-node-copy"><small>{kindName[n.kind]}</small><b>{n.title}</b><em className={`status-${n.status}`}>{statusText[n.status]}</em></span>
              {view==="progress"&&open>0&&<span className="demo-task-count">{open}</span>}
            </button>;
          })}
        </div>
      </div>
    </div>
    <div className="demo-canvas-footer">
      <span>{view==="dependencies"?"Hervorgehoben: direkte Beziehungen des gewählten Moduls":
        view==="progress"?"Zahlen zeigen offene Aufgaben":"Karte verschieben oder ein Modul auswählen"}</span>
      <div className="demo-zoom">
        <button onClick={()=>onZoom(Math.max(.65,Number((zoom-.15).toFixed(2))))} aria-label="Verkleinern">−</button>
        <span>{Math.round(zoom*100)} %</span>
        <button onClick={()=>onZoom(Math.min(1.3,Number((zoom+.15).toFixed(2))))} aria-label="Vergrößern">+</button>
      </div>
    </div>
  </section>;
}
