import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./demo.css";

type View = "architecture" | "dependencies" | "progress";
type Status = "planned" | "active" | "blocked" | "done";
type NodeKind = "project" | "area" | "module" | "idea";
type Task = { id: string; title: string; status: Status };
type DemoNode = {
  id: string; title: string; icon: string; kind: NodeKind;
  x: number; y: number; description: string; status: Status;
  files: string[]; rule: string; tasks: Task[];
};
type Relation = { from: string; to: string; kind: "contains" | "uses" | "depends_on" };
type DemoGraph = { nodes: DemoNode[]; relations: Relation[] };
const KEY = "atlas-public-example-v1";
const statusText: Record<Status,string> = {
  planned: "Geplant", active: "In Arbeit", blocked: "Blockiert", done: "Erledigt"
};
const titleText: Record<View,string> = {
  architecture: "Projektstruktur", dependencies: "Abhängigkeiten", progress: "Fortschritt"
};
const initialGraph: DemoGraph = {
  nodes: [
    { id:"game", title:"Beispielspiel", icon:"🎮", kind:"project", x:460, y:24,
      description:"Ein fiktives Open-World-Spiel: Die Karte trennt fachliche Module von Dateien und ihrer visuellen Darstellung.",
      status:"active", files:["README.md"], rule:"Komponenten bleiben unabhängig von einzelnen Spielräumen.",
      tasks:[{id:"game-1",title:"Modularchitektur prüfen",status:"active"}]},
    { id:"character", title:"Charaktere", icon:"🧍", kind:"area", x:85, y:186,
      description:"Figur, Animation und Erscheinungsbild sind eigenständige Bereiche.",
      status:"active", files:["src/characters/"], rule:"Charakterzustände überleben Raumwechsel.",
      tasks:[{id:"char-1",title:"Charakterzustand zentralisieren",status:"active"}]},
    { id:"world", title:"Spielwelt", icon:"🌍", kind:"area", x:460, y:186,
      description:"Welt, Terrain und Gebäude mit eigener Inhaltsstruktur.",
      status:"planned", files:["src/world/"], rule:"Objekte dürfen nicht direkt auf das UI zugreifen.",
      tasks:[{id:"world-1",title:"Landschaftssystem planen",status:"planned"}]},
    { id:"interface", title:"Interface", icon:"🎛️", kind:"area", x:835, y:186,
      description:"HUD, Menü und das wiederverwendbare Steuerrad.",
      status:"active", files:["src/ui/"], rule:"Menüs konsumieren Spielzustände, besitzen sie aber nicht.",
      tasks:[{id:"ui-1",title:"UI-Baukasten aufbauen",status:"active"}]},
    { id:"outfits", title:"Outfits", icon:"👕", kind:"module", x:20, y:360,
      description:"Kleidung, Presets und kosmetische Änderungen des Charakters.",
      status:"blocked", files:["src/characters/outfits/","assets/clothing/"],
      rule:"Outfits sind an den Charakter gebunden, niemals an den aktuellen Raum.",
      tasks:[{id:"out-1",title:"Outfits vom Raum entkoppeln",status:"blocked"},{id:"out-2",title:"Kleidungs-Presets",status:"planned"}]},
    { id:"motion", title:"Bewegungen", icon:"🏃", kind:"module", x:235, y:360,
      description:"Animationen und Bewegungszustände als austauschbares Modul.",
      status:"active", files:["src/characters/motion/"], rule:"Bewegungslogik muss ohne UI funktionieren.",
      tasks:[{id:"mot-1",title:"Animationsübergänge testen",status:"active"}]},
    { id:"terrain", title:"Terrain", icon:"🌲", kind:"module", x:450, y:360,
      description:"Boden, Landschaft, Bäume und Büsche als kombinierbare Assets.",
      status:"planned", files:["src/world/terrain/","assets/vegetation/"],
      rule:"Assetdaten und Terrain-Rendering bleiben getrennt.",
      tasks:[{id:"terr-1",title:"Terrain-Baukasten entwerfen",status:"planned"}]},
    { id:"buildings", title:"Gebäude", icon:"🏠", kind:"module", x:665, y:360,
      description:"Gebäude, Innenräume und wiederverwendbare Bauteile.",
      status:"planned", files:["src/world/buildings/"], rule:"Gebäude enthalten keine Charaktersteuerung.",
      tasks:[{id:"build-1",title:"Prefab-Schema festlegen",status:"planned"}]},
    { id:"wheel", title:"Steuerrad", icon:"🕹️", kind:"module", x:880, y:360,
      description:"Ein globales Radialmenü für Karte, Inventar, Smartphone und Einstellungen.",
      status:"active", files:["src/ui/radial-wheel.ts","src/ui/radial-wheel.css"],
      rule:"Das Steuerrad ist in jedem Raum erreichbar und kann von anderen Systemen verwendet werden.",
      tasks:[{id:"wheel-1",title:"Gamepad-Steuerung prüfen",status:"planned"},{id:"wheel-2",title:"Globale UI-Integration",status:"active"}]}
  ],
  relations: [
    {from:"game",to:"character",kind:"contains"},
    {from:"game",to:"world",kind:"contains"},
    {from:"game",to:"interface",kind:"contains"},
    {from:"character",to:"outfits",kind:"contains"},
    {from:"character",to:"motion",kind:"contains"},
    {from:"world",to:"terrain",kind:"contains"},
    {from:"world",to:"buildings",kind:"contains"},
    {from:"interface",to:"wheel",kind:"contains"},
    {from:"character",to:"motion",kind:"uses"},
    {from:"character",to:"outfits",kind:"uses"},
    {from:"interface",to:"wheel",kind:"uses"},
    {from:"wheel",to:"character",kind:"depends_on"}
  ]
};
const clone = (): DemoGraph => JSON.parse(JSON.stringify(initialGraph)) as DemoGraph;
function savedGraph(): DemoGraph {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (typeof value === "object" && value !== null && "nodes" in value && "relations" in value &&
        Array.isArray(value.nodes) && Array.isArray(value.relations) && value.nodes.length < 50) {
        return value as DemoGraph;
      }
    }
  } catch { /* restricted storage: use in-memory data */ }
  return clone();
}
const kindName: Record<NodeKind,string> = {project:"Projekt",area:"Bereich",module:"Modul",idea:"Idee"};
const relatedTo = (r: Relation,id: string) => r.from===id || r.to===id;
function Demo() {
  const [graph,setGraph] = useState<DemoGraph>(savedGraph);
  const [selected,setSelected] = useState("wheel");
  const [view,setView] = useState<View>("architecture");
  const [zoom,setZoom] = useState(1);
  const [newTitle,setNewTitle] = useState("");
  const [showIdea,setShowIdea] = useState(false);
  const [persisted,setPersisted] = useState(true);
  const current = graph.nodes.find(n=>n.id===selected) || graph.nodes[0];
  const related = useMemo(()=>graph.relations.filter(r=>relatedTo(r,current.id)),[graph,current.id]);
  const selectedPeers = new Set(related.flatMap(r=>[r.from,r.to]));
  useEffect(()=>{
    try {localStorage.setItem(KEY,JSON.stringify(graph));setPersisted(true);}
    catch {setPersisted(false);}
  },[graph]);
  function updateTask(nodeId:string,id:string,status:Status){
    setGraph(g=>({...g,nodes:g.nodes.map(n=>n.id===nodeId?
      {...n,tasks:n.tasks.map(t=>t.id===id?{...t,status}:t)}:n)}));
  }
  function addIdea(){
    const title=newTitle.trim();
    if(!title) return;
    const id=crypto.randomUUID();
    const index=graph.nodes.filter(n=>n.kind==="idea").length;
    const node: DemoNode={
      id,title:title.slice(0,60),icon:"💡",kind:"idea",
      x:40+(index%5)*215,y:540+Math.floor(index/5)*125,
      description:"Neue Idee aus dem Demo-Modus. Im echten Atlas kann daraus ein geplanter Projektbaustein werden.",
      status:"planned",files:[],rule:"Noch keine Architekturregel festgelegt.",tasks:[]
    };
    setGraph(g=>({...g,nodes:[...g.nodes,node],relations:[...g.relations,{from:selected,to:id,kind:"contains"}]}));
    setSelected(id);setNewTitle("");setShowIdea(false);setView("architecture");
  }
  function reset(){
    if(!confirm("Alle Änderungen an dieser Demokarte zurücksetzen?"))return;
    setGraph(clone());setSelected("wheel");setView("architecture");setNewTitle("");setShowIdea(false);
  }
  const canvasHeight=640+Math.ceil(graph.nodes.filter(n=>n.kind==="idea").length/5)*125;
  const links=graph.relations.filter(r=>view==="dependencies"?r.kind!=="contains":r.kind==="contains");
  const openTasks=graph.nodes.reduce((sum,n)=>sum+n.tasks.filter(t=>t.status!=="done").length,0);
  return <div className="demo-shell">
    <header className="demo-header">
      <div className="demo-brand">
        <div className="demo-emblem">◈</div>
        <div><div className="demo-eyebrow">PROJECT ATLAS <span>· Interaktive Demo</span></div><h1>Beispielspiel</h1></div>
      </div>
      <div className="demo-summary"><span>9+ Module</span><span>{openTasks} offene Aufgaben</span><span className="demo-safe">Ohne Backend</span></div>
    </header>
    <div className="demo-intro">
      <strong>Ein Spielprojekt als verständliche Landkarte.</strong> Klicke auf Module, wechsle die Ansicht, ändere Aufgabenstatus oder ergänze eine Idee.
      Alles sind fiktive Daten. Die Demo sendet keine Anfragen an eine API.
    </div>
    <nav className="demo-tabs" aria-label="Kartenansicht">
      {(["architecture","dependencies","progress"] as View[]).map(name=>
        <button key={name} className={view===name?"chosen":""} onClick={()=>setView(name)} aria-pressed={view===name}>{titleText[name]}</button>)}
    </nav>
    <div className="demo-layout">
      <div className="demo-canvas-pane">
        <div className="demo-map-scroller">
          <div className="demo-scaled" style={{width:1090*zoom,height:canvasHeight*zoom}}>
            <div className="demo-board" style={{height:canvasHeight,transform:`scale(${zoom})`}}>
              <svg viewBox={`0 0 1090 ${canvasHeight}`} width="1090" height={canvasHeight} aria-hidden="true">
                <defs><marker id="demo-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#90afd5"/></marker></defs>
                {links.map((r,i)=>{
                  const a=graph.nodes.find(n=>n.id===r.from),b=graph.nodes.find(n=>n.id===r.to);
                  if(!a||!b)return null;
                  const chosen = relatedTo(r,current.id);
                  const x1=a.x+95,x2=b.x+95;
                  const y1=r.kind==="contains"?a.y+85:a.y+42;
                  const y2=r.kind==="contains"?b.y:b.y+42;
                  const mid=(y1+y2)/2;
                  return <path key={i} d={`M ${x1} ${y1} C ${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`}
                    fill="none" stroke={chosen?"#b4dcff":"#54718f"} strokeWidth={chosen?2.9:1.6}
                    opacity={view==="dependencies" && !chosen ? 0.16 : 1} strokeDasharray={r.kind==="contains"?"none":"6 5"} markerEnd="url(#demo-arrow)"/>;
                })}
              </svg>
              {graph.nodes.map(n=>{
                const dim=view==="dependencies" && n.id!==current.id && !selectedPeers.has(n.id);
                const open=n.tasks.filter(t=>t.status!=="done").length;
                return <button type="button" key={n.id}
                  className={["demo-node",n.kind,n.id===selected?"selected":"",dim?"dimmed":""].join(" ")}
                  style={{left:n.x,top:n.y}} onClick={()=>setSelected(n.id)}
                  aria-pressed={n.id===selected}>
                  <span className="demo-node-icon" aria-hidden="true">{n.icon}</span>
                  <span className="demo-node-copy"><small>{kindName[n.kind]}</small><b>{n.title}</b><em className={`status-${n.status}`}>{statusText[n.status]}</em></span>
                  {view==="progress" && open>0 && <span className="demo-task-count">{open}</span>}
                </button>;
              })}
            </div>
          </div>
        </div>
        <div className="demo-canvas-footer">
          <span>{view==="dependencies"?"Hervorgehoben: direkte Beziehungen des gewählten Moduls":view==="progress"?"Zahlen zeigen offene Aufgaben":"Klicke auf einen Bereich, um die Verbindungen zu untersuchen"}</span>
          <div className="demo-zoom">
            <button onClick={()=>setZoom(v=>Math.max(.65,Number((v-.15).toFixed(2))))} aria-label="Verkleinern">−</button>
            <span>{Math.round(zoom*100)} %</span>
            <button onClick={()=>setZoom(v=>Math.min(1.3,Number((v+.15).toFixed(2))))} aria-label="Vergrößern">+</button>
          </div>
        </div>
      </div>
      <aside className="demo-inspector">
        <div className="demo-inspector-title">MODULINSPEKTOR</div>
        <div className="demo-selected-icon">{current.icon}</div>
        <h2>{current.title}</h2>
        <p className="demo-kind">{kindName[current.kind]} · {statusText[current.status]}</p>
        <p className="demo-description">{current.description}</p>
        <div className="demo-divider"/>
        <h3>Architekturregel</h3>
        <div className="demo-note">{current.rule}</div>
        <h3>Beziehungen ({related.length})</h3>
        {related.length===0?<p className="demo-faded">Keine Beziehungen erfasst.</p>:
          related.map((r,i)=>{const target=graph.nodes.find(n=>n.id===(r.from===current.id?r.to:r.from));
            return <button key={i} className="demo-relation" onClick={()=>target&&setSelected(target.id)}>
              <span>{r.from===current.id?"→":"←"} {target?.title}</span><small>{r.kind==="contains"?"enthält":r.kind==="uses"?"verwendet":"benötigt"}</small>
            </button>;
          })}
        <h3>Quellreferenzen ({current.files.length})</h3>
        {current.files.length?current.files.map(f=><div className="demo-file" key={f}>▤ {f}</div>):<p className="demo-faded">Noch keine Quellen zugeordnet</p>}
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
