import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { appendIdea, changeTaskStatus, connectedRelations, openTaskCount } from "./model/demo-model";
import type { DemoState, Status, View, DemoNode } from "./model/demo-model";
import { moduleTree } from "./model/module-tree";
import { addLayout, initialLayouts, OVERVIEW_ID, removeLayout, renameLayout, selectedLayout, withActiveLayout } from "./model/canvas-views";
import type { SavedLayouts } from "./model/canvas-views";
import { defaultProjectState, newProjectEntry, projectSettings, updateProjectSettings } from "./model/workspace";
import type { ProjectEntry, SettingsState, WorkspaceCatalog } from "./model/workspace";
import { loadCatalog, loadProjectState, loadSettings, loadSavedLayouts, saveCatalog, saveProjectState, saveSavedLayouts, saveSettings } from "./storage/demo-storage";
import { DemoCanvas } from "./ui/DemoCanvas";
import { DemoIcon, NodeIcon } from "./ui/DemoIcons";
import { ModuleDetails } from "./ui/ModuleDetails";
import "./demo.css";

type Screen = "projects" | "project" | "settings";
const kinds={project:"Projekt",area:"Bereich",module:"Modul",idea:"Idee"};
const status={planned:"Geplant",active:"In Arbeit",blocked:"Blockiert",done:"Erledigt"};
const viewTitles:Record<View,string>={architecture:"Architektur",dependencies:"Abhängigkeiten",progress:"Fortschritt"};
function App(){
  const [catalog,setCatalog]=useState<WorkspaceCatalog>(loadCatalog);
  const [settings,setSettings]=useState<SettingsState>(loadSettings);
  const [screen,setScreen]=useState<Screen>("projects");
  const [project,setProject]=useState<ProjectEntry|null>(null);
  const [data,setData]=useState<DemoState|null>(null);
  const [layouts,setLayouts]=useState<SavedLayouts|null>(null);
  const [layoutTitle,setLayoutTitle]=useState("");
  const [layoutError,setLayoutError]=useState("");
  const [selected,setSelected]=useState("");
  const [peek,setPeek]=useState<string|null>(null);
  const [detail,setDetail]=useState<string|null>(null);
  const [panel,setPanel]=useState<"modules"|"map">("modules");
  const [view,setView]=useState<View>("architecture");
  const [editing,setEditing]=useState(false);
  const [focusToken,setFocusToken]=useState(0);
  const [expanded,setExpanded]=useState<Set<string>>(()=>new Set());
  const [filter,setFilter]=useState("");
  const [projectName,setProjectName]=useState("");
  const [persisted,setPersisted]=useState(true);
  const settingsReturn=useRef<"projects"|"project">("projects");
  useEffect(()=>{setPersisted(saveCatalog(catalog));},[catalog]);
  useEffect(()=>{setPersisted(saveSettings(settings));},[settings]);
  useEffect(()=>{
    if(project && data)setPersisted(saveProjectState(project.id,data));
  },[project,data]);
  useEffect(()=>{
    if(project && data && layouts){
      setPersisted(saveSavedLayouts(project.id,withActiveLayout(layouts,data.layout)));
    }
  },[project,data,layouts]);
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==="Escape"){setDetail(null);setPeek(null);}
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[]);
  function openProject(entry:ProjectEntry){
    const next=loadProjectState(entry);
    const saved=loadSavedLayouts(entry.id,next.layout);
    const activeLayout=selectedLayout(saved,saved.activeId,next.graph,next.layout);
    setLayouts(saved);setLayoutTitle("");setLayoutError("");
    setProject(entry);setData({...next,layout:activeLayout});
    setSelected(next.graph.nodes[0]?.id??"");
    setView(projectSettings(settings,entry.id).defaultView);
    setExpanded(new Set(next.graph.nodes.filter(n=>n.kind==="project").map(n=>n.id)));
    setFilter("");setPeek(null);setDetail(null);setEditing(false);setFocusToken(0);setPanel("modules");setScreen("project");
  }
  function home(){setScreen("projects");setPeek(null);setDetail(null);setEditing(false);}
  function openSettings(){
    settingsReturn.current=screen==="project"?"project":"projects";
    setScreen("settings");setPeek(null);setDetail(null);
  }
  function choose(id:string){setSelected(id);setPeek(id);setDetail(null);}
  function showOnMap(id:string){
    setSelected(id);setPanel("map");setPeek(null);setFocusToken(n=>n+1);

  }
  function createProject(){
    const title=projectName.trim();if(!title||catalog.projects.length>=40)return;
    const entry=newProjectEntry(crypto.randomUUID(),title);
    setCatalog(previous=>({...previous,projects:[...previous.projects,entry]}));
    setProjectName("");
    openProject(entry);
  }
  function updateTask(nodeId:string,taskId:string,next:Status){
    setData(old=>old?{...old,graph:changeTaskStatus(old.graph,nodeId,taskId,next)}:old);
  }
  function addIdea(nodeId:string,title:string){
    setData(old=>old?appendIdea(old,nodeId,crypto.randomUUID(),title):old);
    setDetail(null);setPeek(nodeId);
  }
  function reset(){
    if(!project||!confirm("Änderungen an diesem Beispielprojekt zurücksetzen?"))return;
    const next=defaultProjectState(project);
    setData(next);setLayouts(initialLayouts(next.layout));
    setPeek(null);setDetail(null);setLayoutError("");setEditing(false);setFocusToken(0);
  }
  function changeLayout(id:string) {
    if(!data||!layouts||!layouts.views.some(v=>v.id===id))return;
    const snapshot=withActiveLayout(layouts,data.layout);
    const next=selectedLayout(snapshot,id,data.graph,data.layout);
    setLayouts({...snapshot,activeId:id});
    setData({...data,layout:next});
    setPeek(null);setDetail(null);setLayoutError("");setEditing(false);setFocusToken(0);
  }
  function copyLayout() {
    if(!data||!layouts)return;
    try {
      const next=addLayout(withActiveLayout(layouts,data.layout),crypto.randomUUID(),layoutTitle,data.layout);
      setLayouts(next);setData({...data,layout:structuredClone(data.layout)});
      setLayoutTitle("");setLayoutError("");
    } catch(e){setLayoutError(String(e instanceof Error?e.message:e))}
  }
  function editLayoutTitle() {
    if(!layouts||layouts.activeId===OVERVIEW_ID)return;
    const target=layouts.views.find(v=>v.id===layouts.activeId);
    const title=prompt("Ansicht umbenennen",target?.title??"");
    if(title===null)return;
    try {setLayouts(renameLayout(withActiveLayout(layouts,data!.layout),layouts.activeId,title));setLayoutError("");}
    catch(e){setLayoutError(String(e instanceof Error?e.message:e))}
  }
  function deleteLayout() {
    if(!layouts||!data||layouts.activeId===OVERVIEW_ID)return;
    if(!confirm("Diese Layoutansicht entfernen? Module und Aufgaben bleiben bestehen."))return;
    const next=removeLayout(withActiveLayout(layouts,data.layout),layouts.activeId);
    setData({...data,layout:selectedLayout(next,next.activeId,data.graph,data.layout)});
    setLayouts(next);setPeek(null);setLayoutError("");setEditing(false);setFocusToken(0);
  }
  function shiftNode(id:string,dx:number,dy:number){
    if(!data||!editing)return;
    setData(previous=>{
      if(!previous)return previous;
      const p=previous.layout.positions[id]??{x:0,y:0};
      return {...previous,layout:{
        positions:{...previous.layout.positions,[id]:{x:p.x+dx,y:p.y+dy}}
      }};
    });
  }
  function toggleExpanded(id:string){
    setExpanded(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;});
  }
  const graph=data?.graph;
  const active=graph?.nodes.find(n=>n.id===(detail??peek??selected));
  const summary=graph?.nodes.find(n=>n.id===peek);
  const scope=project?projectSettings(settings,project.id):null;
  return <div className="atlas-app" data-theme={settings.appearance.theme} data-density={settings.appearance.density}>
    <header className="atlas-topbar">
      <button className="atlas-brand" onClick={home} aria-label="Zur Projektübersicht">
        <span className="atlas-brand-mark"><DemoIcon name="network" size={21}/></span>
        <span className="atlas-wordmark">ATLAS <small>Demo</small></span>
      </button>
      <div className="atlas-topbar-context">
        {screen==="project" && project && <>
          <button className="atlas-crumb" onClick={home}>Projekte</button>
          <span className="atlas-crumb-divider">/</span><strong>{project.title}</strong>
        </>}
        {screen==="settings"&&<span>Einstellungen</span>}
      </div>
      <div className="atlas-topbar-actions">
        <span className="atlas-offline">LOKALER DEMOMODUS</span>
        <button className="atlas-top-action" onClick={openSettings} aria-label="Einstellungen öffnen">
          <DemoIcon name="interface" size={19}/><span>Einstellungen</span>
        </button>
      </div>
    </header>

    {screen==="projects"&&<main className="atlas-home">
      <div className="atlas-page-heading">
        <span className="atlas-overline">WORKSPACE / PROJEKTE</span>
        <h1>Projektübersicht</h1>
        <p>Projekte sind der Einstiegspunkt. Jedes Projekt besitzt seinen eigenen Graphen, Ansichten und Einstellungen.</p>
      </div>
      <div className="atlas-section-heading"><h2>Deine Demo-Projekte</h2><span>{catalog.projects.length} Projekte</span></div>
      <div className="atlas-project-grid">
        {catalog.projects.map(entry=>{
          const state=loadProjectState(entry);
          return <button key={entry.id} className="atlas-project-card" onClick={()=>openProject(entry)}>
            <span className="atlas-project-avatar"><DemoIcon name={entry.kind==="example"?"project":"module"} size={23}/></span>
            <span className="atlas-project-info">
              <strong>{entry.title}</strong><small>{entry.summary}</small>
              <span className="atlas-project-meta">{state.graph.nodes.length} Module · {openTaskCount(state.graph)} offene Aufgaben · {entry.kind==="example"?"Beispielprojekt":"Lokal"}</span>
            </span>
            <span aria-hidden="true" className="atlas-card-arrow">›</span>
          </button>;
        })}
      </div>
      <form className="atlas-new-project" onSubmit={e=>{e.preventDefault();createProject();}}>
        <div><h2>Neues Testprojekt</h2><p>Ein leeres Projekt zum Ausprobieren – nur in diesem Browser.</p></div>
        <div className="atlas-new-project-input">
          <input maxLength={100} value={projectName} onChange={e=>setProjectName(e.target.value)}
            placeholder="Projektname" aria-label="Name des neuen Projekts"/>
          <button type="submit" disabled={!projectName.trim()||catalog.projects.length>=40}>Anlegen</button>
        </div>
      </form>
      <p className="atlas-home-note">Diese Website ist eine eigenständige Vorschau ohne Anmeldung, Datenbank oder Zugriff auf private Repositories.</p>
    </main>}

    {screen==="settings"&&<main className="atlas-settings">
      <button className="atlas-back-link" onClick={()=>setScreen(settingsReturn.current)}>← Zurück</button>
      <div className="atlas-page-heading">
        <span className="atlas-overline">WORKSPACE / EINSTELLUNGEN</span>
        <h1>Einstellungen</h1>
        <p>Die Demo speichert diese Einstellungen ausschließlich im Browser. Die produktive Atlas-API hat dafür noch keine Endpunkte.</p>
      </div>
      <section className="atlas-settings-section">
        <span className="atlas-settings-scope">GERÄT / ERSCHEINUNGSBILD</span>
        <div className="atlas-setting-row">
          <div><strong>Farbschema</strong><small>Nur die Darstellung, keine fachlichen Daten.</small></div>
          <select value={settings.appearance.theme} onChange={e=>setSettings(s=>({...s,appearance:{...s.appearance,theme:e.target.value as "light"|"dark"}}))}>
            <option value="dark">Dunkel</option><option value="light">Hell</option>
          </select>
        </div>
        <div className="atlas-setting-row">
          <div><strong>Informationsdichte</strong><small>Mehr oder weniger Platz pro Modulzeile.</small></div>
          <select value={settings.appearance.density} onChange={e=>setSettings(s=>({...s,appearance:{...s.appearance,density:e.target.value as "compact"|"comfortable"}}))}>
            <option value="comfortable">Komfortabel</option><option value="compact">Kompakt</option>
          </select>
        </div>
      </section>
      {project&&<section className="atlas-settings-section">
        <span className="atlas-settings-scope">PROJEKT / {project.title.toUpperCase()}</span>
        <div className="atlas-setting-row">
          <div><strong>Standardansicht</strong><small>Beim nächsten Öffnen dieses Projekts.</small></div>
          <select value={scope?.defaultView??"architecture"}
            onChange={e=>setSettings(s=>updateProjectSettings(s,project.id,{defaultView:e.target.value as View}))}>
            {(["architecture","dependencies","progress"] as View[]).map(k=><option key={k} value={k}>{viewTitles[k]}</option>)}
          </select>
        </div>
        <div className="atlas-setting-row">
          <div><strong>Offene Aufgaben im Canvas anzeigen</strong><small>Kleine Kennzahl neben den Modulen.</small></div>
          <input type="checkbox" checked={scope?.showTaskCounts??true}
            onChange={e=>setSettings(s=>updateProjectSettings(s,project.id,{showTaskCounts:e.target.checked}))}/>
        </div>
      </section>}
      <section className="atlas-settings-section">
        <span className="atlas-settings-scope">SPÄTER / PRODUKTIVE ANWENDUNG</span>
        <p className="atlas-muted">Geplant sind außerdem Berechtigungen, Integrationen und Zugangsdaten, Synchronisationsregeln, Ansichts-Voreinstellungen, Import/Export sowie Datenschutz und Audit. Diese Bereiche sind noch nicht implementiert.</p>
      </section>
    </main>}

    {screen==="project"&&project&&data&&graph&&<>
      <div className="atlas-project-heading">
        <div><span className="atlas-overline">PROJEKT / {project.kind==="example"?"BEISPIEL":"LOKAL"}</span>
          <h1>{project.title}</h1></div>
        <div className="atlas-heading-meta">
          <span>{graph.nodes.length} Module</span><span>{openTaskCount(graph)} offene Aufgaben</span>
          <button onClick={reset}>Beispiel zurücksetzen</button>
        </div>
      </div>
      <div className="atlas-workspace-toolbar">
        <nav className="atlas-view-tabs" aria-label="Ansicht wählen">
          {(["architecture","dependencies","progress"] as View[]).map(name=>
            <button key={name} aria-pressed={name===view} className={name===view?"chosen":""}
              onClick={()=>{setView(name);setPeek(null);}}>{viewTitles[name]}</button>)}
        </nav>
        <span className="atlas-toolbar-hint">Canvas und Modulliste zeigen denselben Projektgraphen.</span>
      </div>
      {layouts&&<div className="atlas-layout-toolbar">
        <label>Gespeichertes Layout
          <select value={layouts.activeId} onChange={e=>changeLayout(e.target.value)}>
            {layouts.views.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        <input maxLength={80} aria-label="Neues Layout benennen" value={layoutTitle}
          placeholder="Neue Ansicht, z. B. Entwicklung" onChange={e=>setLayoutTitle(e.target.value)}/>
        <button onClick={copyLayout} disabled={!layoutTitle.trim()||layouts.views.length>=30}>Kopie anlegen</button>
        <button onClick={editLayoutTitle} disabled={layouts.activeId===OVERVIEW_ID}>Umbenennen</button>
        <button onClick={deleteLayout} disabled={layouts.activeId===OVERVIEW_ID}>Entfernen</button>
        <small>Nur die Positionen sind ansichtsbezogen. Module und Beziehungen bleiben gemeinsam.</small>
        {layoutError&&<p className="atlas-layout-error" role="alert">{layoutError}</p>}
      </div>}
      <nav className="atlas-mobile-switch" aria-label="Projektbereich wählen">
        <button className={panel==="modules"?"chosen":""} aria-pressed={panel==="modules"}
          onClick={()=>{setPanel("modules");setPeek(null);}}>Module</button>
        <button className={panel==="map"?"chosen":""} aria-pressed={panel==="map"}
          onClick={()=>{setPanel("map");setPeek(null);}}>Canvas</button>
      </nav>
      <div className={"atlas-workspace panel-"+panel}>
        <aside className="atlas-module-panel" aria-label="Modulnavigator">
          <div className="atlas-panel-heading"><span>PROJEKTSTRUKTUR</span><strong>{graph.nodes.length}</strong></div>
          <label className="atlas-module-search">
            <span className="sr-only">Module suchen</span>
            <input type="search" value={filter} onChange={e=>setFilter(e.target.value)}
              placeholder="Module suchen …"/>
          </label>
          <div className="atlas-tree" role="tree" aria-label="Modulhierarchie">
            {moduleTree(graph,expanded,filter).map(({node,depth,hasChildren})=>
              <div key={node.id} className={"atlas-tree-row"+(selected===node.id?" active":"")}
                style={{paddingLeft:10+Math.min(depth,8)*15}}>
                {hasChildren&&!filter?<button className="atlas-tree-toggle" aria-label={expanded.has(node.id)?"Zuklappen":"Aufklappen"}
                  aria-expanded={expanded.has(node.id)} onClick={()=>toggleExpanded(node.id)}>
                  {expanded.has(node.id)?"−":"+"}
                </button>:<span className="atlas-tree-indent"/>}
                <button role="treeitem" aria-selected={selected===node.id}
                  className="atlas-tree-entry" onClick={()=>choose(node.id)}>
                  <NodeIcon id={node.id} kind={node.kind} size={17}/>
                  <span>{node.title}</span>
                  <small>{node.tasks.filter(t=>t.status!=="done").length||""}</small>
                </button>
              </div>)}
            {!moduleTree(graph,expanded,filter).length&&<p className="atlas-muted">Keine Module gefunden.</p>}
          </div>
          <div className="atlas-panel-footer">{filter?"Suchergebnisse":"Bereiche ausklappen, um Untermodule zu sehen"}</div>
        </aside>
        <div className="atlas-canvas-area">
          <DemoCanvas key={project.id+":"+(layouts?.activeId??"overview")}
            graph={graph} layout={data.layout} view={view} selected={selected}
            onSelect={choose} onMoveNode={(id,position)=>setData(previous=>previous?{
              ...previous,layout:{positions:{...previous.layout.positions,[id]:position}}
            }:previous)}
            editing={editing} onEditingChange={setEditing}
            active={panel==="map"} focusToken={focusToken}
            showTaskCounts={scope?.showTaskCounts??true}/>
        </div>
        {summary&&<section className="atlas-quick-card" aria-label={"Kurzinfo zu "+summary.title}>
          <div className="atlas-quick-head">
            <span className="atlas-quick-icon"><NodeIcon id={summary.id} kind={summary.kind} size={20}/></span>
            <div><small>{kinds[summary.kind]} · {status[summary.status]}</small><h2>{summary.title}</h2></div>
            <button className="atlas-quick-close" onClick={()=>setPeek(null)} aria-label="Kurzinfo schließen">×</button>
          </div>
          <p>{summary.description}</p>
          <div className="atlas-quick-metrics">
            <span>{summary.tasks.filter(t=>t.status!=="done").length} offene Aufgaben</span>
            <span>{connectedRelations(graph,summary.id).length} Beziehungen</span>
            <span>{summary.files.length} Quellen</span>
          </div>
          <div className="atlas-layout-nudge">
            <span>Feinjustierung (alternativ im entsperrten Canvas frei ziehen)</span>
            <div role="group" aria-label="Position des gewählten Moduls verschieben">
              <button disabled={!editing} aria-label="Nach links verschieben" onClick={()=>shiftNode(summary.id,-70,0)}>←</button>
              <button disabled={!editing} aria-label="Nach oben verschieben" onClick={()=>shiftNode(summary.id,0,-70)}>↑</button>
              <button disabled={!editing} aria-label="Nach unten verschieben" onClick={()=>shiftNode(summary.id,0,70)}>↓</button>
              <button disabled={!editing} aria-label="Nach rechts verschieben" onClick={()=>shiftNode(summary.id,70,0)}>→</button>
            </div>
          </div>
          <div className="atlas-quick-actions">
            <button className="atlas-secondary" onClick={()=>showOnMap(summary.id)}>Auf Karte</button>
            <button className="atlas-primary" onClick={()=>{setSelected(summary.id);setDetail(summary.id);setPeek(null);}}>Details öffnen</button>
          </div>
        </section>}
      </div>
    </>}

    {detail&&graph&&active&&screen==="project"&&<ModuleDetails key={detail} node={active} graph={graph}
      onTask={updateTask} onAddIdea={addIdea} onNavigate={id=>{setDetail(null);choose(id);}}
      onClose={()=>setDetail(null)}/>}
    <footer className="atlas-statusbar">
      <span>ATLAS DEMO <span className="atlas-status-separator">/</span> {screen==="project"?project?.title:"Workspace"}</span>
      <span>{persisted?"Browserdaten lokal gespeichert":"Browserspeicherung nicht verfügbar"} · Keine Backend-Verbindung</span>
    </footer>
  </div>;
}
createRoot(document.getElementById("root")!).render(<App/>);
