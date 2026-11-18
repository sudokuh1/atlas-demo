import { useEffect, useState } from "react";
import { appendIdea, changeTaskStatus, connectedRelations, freshDemoState, openTaskCount } from "./model/demo-model";
import type { DemoState, Status, View, NodeKind } from "./model/demo-model";
import { loadDemoState, saveDemoState } from "./storage/demo-storage";
import { DemoCanvas } from "./ui/DemoCanvas";
import { DemoIcon, NodeIcon } from "./ui/DemoIcons";
import { createRoot } from "react-dom/client";
import "./demo.css";

const statusText: Record<Status,string> = {
  planned: "Geplant", active: "In Arbeit", blocked: "Blockiert", done: "Erledigt"
};
const titleText: Record<View,string> = {
  architecture: "Projektstruktur", dependencies: "Abhängigkeiten", progress: "Fortschritt"
};
const kindName: Record<NodeKind,string> = {project:"Projekt",area:"Bereich",module:"Modul",idea:"Idee"};
function Demo() {
  const [data,setData] = useState<DemoState>(loadDemoState);
  const graph = data.graph;
  const [selected,setSelected] = useState("wheel");
  const [view,setView] = useState<View>("architecture");
  const [zoom,setZoom] = useState(1);
  const [newTitle,setNewTitle] = useState("");
  const [showIdea,setShowIdea] = useState(false);
  const [persisted,setPersisted] = useState(true);
  const [mobilePanel,setMobilePanel] = useState<"modules"|"map"|"details">("modules");
  const [filter,setFilter] = useState("");
  function chooseNode(id:string) {setSelected(id);setMobilePanel("details");}
  const current = graph.nodes.find(n=>n.id===selected) || graph.nodes[0];
  const related = connectedRelations(graph,current.id);
  useEffect(()=>{
    setPersisted(saveDemoState(data));
  },[data]);
  function updateTask(nodeId:string,id:string,status:Status){
    setData(previous=>({...previous,graph:changeTaskStatus(previous.graph,nodeId,id,status)}));
  }
  function addIdea(){
    const title=newTitle.trim();
    if(!title) return;
    const id=crypto.randomUUID();
    setData(previous=>appendIdea(previous,selected,id,title));
    setSelected(id);setNewTitle("");setShowIdea(false);setView("architecture");
  }
  function reset(){
    if(!confirm("Alle Änderungen an dieser Demokarte zurücksetzen?"))return;
    setData(freshDemoState());setSelected("wheel");setView("architecture");setNewTitle("");setShowIdea(false);setMobilePanel("modules");
  }
  const openTasks=openTaskCount(graph);
  return <div className="demo-shell">
    <header className="demo-header">
      <div className="demo-brand">
        <div className="demo-emblem"><DemoIcon name="network" size={26}/></div>
        <div><div className="demo-eyebrow">PROJECT ATLAS <span>· Interaktive Demo</span></div><h1>Beispielspiel</h1></div>
      </div>
      <div className="demo-summary"><span>{graph.nodes.length} Module</span><span>{openTasks} offene Aufgaben</span><span className="demo-safe">Ohne Backend</span></div>
    </header>
    <div className="demo-intro">
      <strong>Ein Spielprojekt als verständliche Landkarte.</strong> Wähle Module, wechsle die Ansicht, ändere Aufgabenstatus oder ergänze eine Idee.
      Alles sind fiktive Daten. Die Demo sendet keine Anfragen an eine API.
    </div>
    <nav className="demo-tabs" aria-label="Kartenansicht">
      {(["architecture","dependencies","progress"] as View[]).map(name=>
        <button key={name} className={view===name?"chosen":""} onClick={()=>setView(name)} aria-pressed={view===name}>{titleText[name]}</button>)}
    </nav>
    <nav className="demo-mobile-tabs" aria-label="Arbeitsbereich auswählen">
      {([["modules","Module"],["map","Karte"],["details","Details"]] as const).map(([id,label])=>
        <button key={id} onClick={()=>setMobilePanel(id)} aria-pressed={mobilePanel===id}
          className={mobilePanel===id?"chosen":""}>{label}</button>)}
    </nav>
    <div className={`demo-layout panel-${mobilePanel}`}>
      <section className="demo-module-browser" aria-label="Module durchsuchen">
        <label className="demo-search-label">Module durchsuchen
          <input type="search" placeholder="Modul suchen" value={filter} onChange={e=>setFilter(e.target.value)}/>
        </label>
        <div className="demo-module-list">
          {graph.nodes.filter(n=>n.title.toLocaleLowerCase("de").includes(filter.toLocaleLowerCase("de"))).map(n=>
            <button key={n.id} onClick={()=>chooseNode(n.id)} className={n.id===selected?"selected":""}>
              <span className="demo-list-icon"><NodeIcon id={n.id} kind={n.kind}/></span>
              <span><strong>{n.title}</strong><small>{kindName[n.kind]} · {statusText[n.status]}</small></span>
              <span className="demo-chevron" aria-hidden="true">›</span>
            </button>)}
          {graph.nodes.every(n=>!n.title.toLocaleLowerCase("de").includes(filter.toLocaleLowerCase("de"))) &&
            <p className="demo-faded">Keine Module gefunden.</p>}
        </div>
      </section>
      <DemoCanvas graph={graph} layout={data.layout} view={view} selected={selected} zoom={zoom}
        onSelect={chooseNode} onZoom={setZoom} active={mobilePanel==="map"}/>
      <aside className="demo-inspector">
        <div className="demo-inspector-title">MODULINSPEKTOR</div>
        <div className="demo-selected-icon"><NodeIcon id={current.id} kind={current.kind} size={28}/></div>
        <h2>{current.title}</h2>
        <p className="demo-kind">{kindName[current.kind]} · {statusText[current.status]}</p>
        <p className="demo-description">{current.description}</p>
        <div className="demo-divider"/>
        <h3>Architekturregel</h3>
        <div className="demo-note">{current.rule}</div>
        <h3>Beziehungen ({related.length})</h3>
        {related.length===0?<p className="demo-faded">Keine Beziehungen erfasst.</p>:
          related.map((r,i)=>{const target=graph.nodes.find(n=>n.id===(r.from===current.id?r.to:r.from));
            return <button key={i} className="demo-relation" onClick={()=>target&&chooseNode(target.id)}>
              <span>{r.from===current.id?"→":"←"} {target?.title}</span><small>{r.kind==="contains"?"enthält":r.kind==="uses"?"verwendet":"benötigt"}</small>
            </button>;
          })}
        <h3>Quellreferenzen ({current.files.length})</h3>
        {current.files.length?current.files.map(f=><div className="demo-file" key={f}><DemoIcon name="folder" size={16}/> <span>{f}</span></div>):<p className="demo-faded">Noch keine Quellen zugeordnet</p>}
        <h3>Aufgaben ({current.tasks.length})</h3>
        {current.tasks.length?current.tasks.map(t=><label className="demo-task" key={t.id}><span>{t.title}</span>
            <select aria-label={`Status: ${t.title}`} value={t.status} onChange={e=>updateTask(current.id,t.id,e.target.value as Status)}>
              {(["planned","active","blocked","done"] as Status[]).map(s=><option value={s} key={s}>{statusText[s]}</option>)}
            </select>
          </label>):<p className="demo-faded">Noch keine Aufgaben</p>}
        <div className="demo-divider"/>
        <button className="demo-idea-trigger" onClick={()=>setShowIdea(v=>!v)}>+ Idee zu diesem Modul hinzufügen</button>
        {showIdea && <form onSubmit={e=>{e.preventDefault();addIdea();}} className="demo-idea-form">
          <label>Neue Idee<input maxLength={60} value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="z. B. Charaktereditor" autoFocus/></label>
          <button disabled={!newTitle.trim()} type="submit">Anlegen</button>
        </form>}
      </aside>
    </div>
    <footer className="demo-footer">
      <span>{persisted?"Änderungen nur in diesem Browser gespeichert":"Browser-Speicherung nicht verfügbar – Änderungen bleiben nur bis zum Schließen."} · Keine echten Git-Repositories</span>
      <button onClick={reset}>Demo zurücksetzen</button>
    </footer>
  </div>;
}

createRoot(document.getElementById("root")!).render(<Demo/>);
