import { useState } from "react";
import { connectedRelations } from "../model/demo-model";
import type { DemoGraph, DemoNode, Status } from "../model/demo-model";
import { NodeIcon, DemoIcon } from "./DemoIcons";

const statusText: Record<Status,string> = {
  planned:"Geplant",active:"In Arbeit",blocked:"Blockiert",done:"Erledigt"
};
const kindText = {project:"Projekt",area:"Bereich",module:"Modul",idea:"Idee"};
export function ModuleDetails({node,graph,onTask,onNavigate,onAddIdea,onClose}:{
  node:DemoNode;graph:DemoGraph;
  onTask:(nodeId:string,taskId:string,status:Status)=>void;
  onNavigate:(id:string)=>void;
  onAddIdea:(nodeId:string,title:string)=>void;
  onClose:()=>void;
}) {
  const [idea,setIdea]=useState("");
  const relations=connectedRelations(graph,node.id);
  return <div className="atlas-modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section className="atlas-details" role="dialog" aria-modal="true" aria-labelledby="atlas-detail-title">
      <header className="atlas-details-header">
        <span className="atlas-overline">MODUL / INSPEKTOR</span>
        <button className="atlas-icon-button" onClick={onClose} aria-label="Details schließen">Schließen</button>
      </header>
      <div className="atlas-detail-heading">
        <span className="atlas-detail-symbol"><NodeIcon id={node.id} kind={node.kind} size={25}/></span>
        <div><h2 id="atlas-detail-title">{node.title}</h2><p>{kindText[node.kind]} · {statusText[node.status]}</p></div>
      </div>
      <p className="atlas-detail-description">{node.description}</p>
      <div className="atlas-detail-section">
        <h3>Architekturregel</h3><p>{node.rule}</p>
      </div>
      <div className="atlas-detail-section">
        <h3>Beziehungen <span>{relations.length}</span></h3>
        {relations.map((r,i)=>{
          const peer=graph.nodes.find(n=>n.id===(r.from===node.id?r.to:r.from));
          return peer?<button key={i} className="atlas-detail-relation" onClick={()=>onNavigate(peer.id)}>
            <NodeIcon id={peer.id} kind={peer.kind} size={17}/>
            <span>{peer.title}</span><small>{r.kind==="contains"?"enthält":r.kind==="uses"?"verwendet":"benötigt"}</small>
          </button>:null;
        })}
        {!relations.length&&<p className="atlas-muted">Noch keine Beziehungen vorhanden.</p>}
      </div>
      <div className="atlas-detail-section">
        <h3>Quelldateien <span>{node.files.length}</span></h3>
        {node.files.map(f=><div key={f} className="atlas-file"><DemoIcon name="folder" size={16}/><code>{f}</code></div>)}
        {!node.files.length&&<p className="atlas-muted">Keine Quelldateien verknüpft.</p>}
      </div>
      <div className="atlas-detail-section">
        <h3>Aufgaben <span>{node.tasks.length}</span></h3>
        {node.tasks.map(t=><label key={t.id} className="atlas-task-row">
          <span>{t.title}</span>
          <select aria-label={"Status von "+t.title} value={t.status}
            onChange={e=>onTask(node.id,t.id,e.target.value as Status)}>
            {(["planned","active","blocked","done"] as Status[]).map(status=>
              <option key={status} value={status}>{statusText[status]}</option>)}
          </select>
        </label>)}
        {!node.tasks.length&&<p className="atlas-muted">Keine Aufgaben vorhanden.</p>}
      </div>
      <div className="atlas-detail-section">
        <h3>Idee hinzufügen</h3>
        <form className="atlas-idea-form" onSubmit={e=>{
          e.preventDefault();if(idea.trim()){onAddIdea(node.id,idea);setIdea("");}
        }}>
          <input aria-label="Neue Idee" placeholder="Name der neuen Idee" value={idea}
            maxLength={60} onChange={e=>setIdea(e.target.value)}/>
          <button type="submit" disabled={!idea.trim()}>Hinzufügen</button>
        </form>
      </div>
      <p className="atlas-detail-note">Demo: Änderungen werden nur im aktuellen Browser gespeichert.</p>
    </section>
  </div>;
}
