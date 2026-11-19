import { useRef,useState } from "react";
import type { FormEvent } from "react";
import type { TimelineEntry,TimelineDraft,TimelineStatus,TimelineCategory } from "../model/project-timeline";
import { timelineCounts } from "../model/project-timeline";
import { DemoIcon } from "./DemoIcons";
import "./ProjectTimeline.css";

const statusNames:Record<TimelineStatus,string>={
 done:"Abgeschlossen",active:"In Arbeit",planned:"Geplant",blocked:"Blockiert"
};
const categoryNames:Record<TimelineCategory,string>={
 origin:"Ursprung",step:"Entwicklung",problem:"Problem",milestone:"Meilenstein"
};
const EMPTY_DRAFT:TimelineDraft={
 category:"step",status:"active",title:"",goal:"",result:"",problem:"",solution:""
};
function dateLabel(value:string|null):string {
 if(value===null)return "Ohne Termin";
 const date=new Date(value.length===7?value+"-01":value);
 if(Number.isNaN(date.getTime()))return "Ohne Termin";
 return value.length===7?
  date.toLocaleDateString("de-DE",{month:"long",year:"numeric"}):
  date.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
}
type Props={
 title:string;
 description:string;
 entries:TimelineEntry[];
 note:string;
 onAdd?:(draft:TimelineDraft)=>string|null;
 onUpdate?:(id:string,draft:TimelineDraft)=>string|null;
 onRemove?:(id:string)=>void;
};
export function ProjectTimeline({title,description,entries,note,onAdd,onUpdate,onRemove}:Props){
 const scroller=useRef<HTMLOListElement>(null);
 const [draft,setDraft]=useState<TimelineDraft>({...EMPTY_DRAFT});
 const [editingID,setEditingID]=useState<string|null>(null);
 const [error,setError]=useState("");
 const [showForm,setShowForm]=useState(false);
 const counts=timelineCounts({version:1,entries});
 const current=entries.find(entry=>entry.status==="active")??
   entries.find(entry=>entry.status==="blocked")??null;
 function showCurrent(){
  if(!current||!scroller.current)return;
  const node=[...scroller.current.querySelectorAll<HTMLElement>("[data-timeline-id]")].
    find(item=>item.dataset.timelineId===current.id);
  node?.scrollIntoView({
   behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",
   block:"nearest",inline:"center"
  });
 }
 function edit(entry:TimelineEntry){
  setDraft({
   title:entry.title,goal:entry.goal,result:entry.result,problem:entry.problem,
   solution:entry.solution,status:entry.status,category:entry.category
  });
  setEditingID(entry.id);setShowForm(true);setError("");
  window.requestAnimationFrame(()=>{
   document.getElementById("atlas-timeline-entry-title")?.focus();
  });
 }
 function stopEditing(){
  setDraft({...EMPTY_DRAFT});setEditingID(null);setShowForm(false);setError("");
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!draft.title.trim()||!draft.goal.trim()){
   setError("Titel und Ziel sind erforderlich.");return;
  }
  if(!onAdd)return;
  const issue=editingID?
   (onUpdate?onUpdate(editingID,draft):"Bearbeitung nicht verfügbar."):
   onAdd(draft);
  if(issue){setError(issue);return;}
  stopEditing();
 }
 return <section className="atlas-timeline" aria-label={title}>
  <div className="atlas-timeline-header">
   <div>
    <span className="atlas-overline">PROJEKT / ZEITSTRAHL</span>
    <h2>{title}</h2>
    <p>{description}</p>
    {current&&<div className="atlas-timeline-current">
      <span>AKTUELL</span>
      <strong>{current.phase?current.phase+" · ":""}{current.title}</strong>
      <button type="button" onClick={showCurrent}>Aktuellen Schritt anzeigen</button>
    </div>}
   </div>
   <div className="atlas-timeline-counters" aria-label="Schrittstatus">
    <span>{counts.done} abgeschlossen</span>
    <span>{counts.active} in Arbeit</span>
    <span>{counts.planned+counts.blocked} offen</span>
   </div>
  </div>
  <div className="atlas-timeline-navigation">
   <small>Chronologischer Entwicklungsweg: Ziele, Ergebnisse, Probleme und Lösungen</small>
   <div className="atlas-timeline-scrollbuttons" role="group" aria-label="Zeitstrahl verschieben">
    <button type="button" onClick={()=>scroller.current?.scrollBy({left:-340,behavior:"smooth"})}
     aria-label="Frühere Schritte anzeigen">←</button>
    <button type="button" onClick={()=>scroller.current?.scrollBy({left:340,behavior:"smooth"})}
     aria-label="Spätere Schritte anzeigen">→</button>
   </div>
  </div>
  <ol className="atlas-timeline-track" ref={scroller} tabIndex={0} aria-label="Meilensteine in zeitlicher Reihenfolge">
   {entries.map((entry,i)=><li className={"atlas-timeline-step status-"+entry.status} data-timeline-id={entry.id} key={entry.id}>
    <div className="atlas-timeline-dot" aria-hidden="true"/>
    <article className="atlas-timeline-card">
     <div className="atlas-timeline-metadata">
      <span className="atlas-timeline-phase">{entry.phase||String(i+1).padStart(2,"0")}</span>
      <span className="atlas-timeline-state">{statusNames[entry.status]}</span>
     </div>
     <div className="atlas-timeline-category">{categoryNames[entry.category]} · {dateLabel(entry.recordedAt)}</div>
     <h3>{entry.title}</h3>
     <div className="atlas-timeline-field">
      <strong>Ziel</strong>
      <p>{entry.goal}</p>
     </div>
     {entry.result&&<div className="atlas-timeline-field">
      <strong>Was umgesetzt wurde</strong><p>{entry.result}</p>
     </div>}
     {(entry.problem||entry.solution)&&<details className="atlas-timeline-incident">
      <summary>{entry.problem?"Problem und Behandlung":"Erkenntnis / Lösung"}</summary>
      {entry.problem&&<div><strong>Problem</strong><p>{entry.problem}</p></div>}
      {entry.solution&&<div><strong>Behandlung / Lösung</strong><p>{entry.solution}</p></div>}
      {!entry.solution&&entry.problem&&<p className="atlas-timeline-warning">Noch nicht abschließend gelöst.</p>}
     </details>}
     {!!entry.criteria?.length&&<details className="atlas-timeline-criteria">
      <summary>Akzeptanzkriterien ({entry.criteria.length})</summary>
      <ul>{entry.criteria.map((item,j)=><li key={j}>{item}</li>)}</ul>
     </details>}
     {entry.reference&&<a className="atlas-timeline-source" href={entry.reference.url}
      target="_blank" rel="noopener noreferrer">{entry.reference.label}</a>}
     {onUpdate&&onRemove&&<div className="atlas-timeline-card-actions">
      <button type="button" onClick={()=>edit(entry)}>Bearbeiten</button>
      <button type="button" onClick={()=>{
       if(confirm('Zeitstrahl-Eintrag "'+entry.title+'" löschen?'))onRemove(entry.id);
      }}>Löschen</button>
     </div>}
    </article>
   </li>)}
   {entries.length===0&&<li className="atlas-timeline-empty">Noch keine dokumentierten Schritte.</li>}
  </ol>
  <p className="atlas-timeline-note">{note}</p>
  {onAdd&&<section className="atlas-timeline-editor">
   <button type="button" className="atlas-timeline-toggle"
    aria-expanded={showForm} onClick={()=>showForm?stopEditing():(setShowForm(true),setEditingID(null))}>
    <DemoIcon name="idea" size={17}/>
    <span>{showForm?"Eingabe schließen":"Entwicklungsschritt dokumentieren"}</span>
   </button>
   {showForm&&<form onSubmit={submit} className="atlas-timeline-form">
    <h3>{editingID?"Eintrag überarbeiten":"Neuen Schritt hinzufügen"}</h3>
    <div className="atlas-timeline-form-grid">
     <label>Typ
      <select value={draft.category} onChange={e=>setDraft(v=>({...v,category:e.target.value as TimelineCategory}))}>
       <option value="origin">Ursprung</option><option value="step">Entwicklungsschritt</option>
       <option value="problem">Problem / Erkenntnis</option><option value="milestone">Meilenstein</option>
      </select>
     </label>
     <label>Status
      <select value={draft.status} onChange={e=>setDraft(v=>({...v,status:e.target.value as TimelineStatus}))}>
       <option value="planned">Geplant</option><option value="active">In Arbeit</option>
       <option value="done">Abgeschlossen</option><option value="blocked">Blockiert</option>
      </select>
     </label>
    </div>
    <label>Titel
     <input id="atlas-timeline-entry-title" value={draft.title} maxLength={100}
      required onChange={e=>setDraft(v=>({...v,title:e.target.value}))}
      placeholder="Beispiel: Authentifizierung ergänzen"/>
    </label>
    <label>Ziel
     <textarea required maxLength={1000} value={draft.goal}
      onChange={e=>setDraft(v=>({...v,goal:e.target.value}))}
      placeholder="Was soll dieser Schritt erreichen?"/>
    </label>
    <label>Umsetzung / Ergebnis
     <textarea maxLength={1500} value={draft.result}
      onChange={e=>setDraft(v=>({...v,result:e.target.value}))}
      placeholder="Was ist tatsächlich entstanden?"/>
    </label>
    <label>Problem oder Fehler
     <textarea maxLength={1000} value={draft.problem}
      onChange={e=>setDraft(v=>({...v,problem:e.target.value}))}
      placeholder="Was hat nicht funktioniert?"/>
    </label>
    <label>Behandlung oder Lösung
     <textarea maxLength={1000} value={draft.solution}
      onChange={e=>setDraft(v=>({...v,solution:e.target.value}))}
      placeholder="Wie wurde der Fehler behoben oder eingegrenzt?"/>
    </label>
    {error&&<p className="atlas-timeline-form-error" role="alert">{error}</p>}
    <div className="atlas-timeline-form-actions">
     <button type="button" onClick={stopEditing}>Abbrechen</button>
     <button className="atlas-primary" type="submit">
      {editingID?"Änderungen speichern":"Schritt hinzufügen"}
     </button>
    </div>
   </form>}
  </section>}
 </section>;
}
