import type { ProjectEntry } from "./workspace";

export type TimelineStatus="done"|"active"|"planned"|"blocked";
export type TimelineCategory="origin"|"step"|"problem"|"milestone";
export type TimelineReference={label:string;url:string};
export type TimelineEntry={
 id:string;
 phase:string;
 category:TimelineCategory;
 status:TimelineStatus;
 title:string;
 goal:string;
 result:string;
 problem:string;
 solution:string;
 recordedAt:string|null;
 criteria?:string[];
 reference?:TimelineReference;
};
export type TimelineDocument={version:1;entries:TimelineEntry[]};
export type TimelineDraft=Pick<TimelineEntry,
 "category"|"status"|"title"|"goal"|"result"|"problem"|"solution">;

const statuses=new Set<TimelineStatus>(["done","active","planned","blocked"]);
const categories=new Set<TimelineCategory>(["origin","step","problem","milestone"]);
export const TIMELINE_ENTRY_LIMIT=150;
export function validTimelineEntry(value:unknown):value is TimelineEntry{
 if(!value||typeof value!=="object")return false;
 const v=value as Partial<TimelineEntry>;
 return typeof v.id==="string"&&v.id.length>0&&v.id.length<=100 &&
  typeof v.phase==="string"&&v.phase.length<=12 &&
  typeof v.category==="string"&&categories.has(v.category as TimelineCategory) &&
  typeof v.status==="string"&&statuses.has(v.status as TimelineStatus) &&
  typeof v.title==="string"&&v.title.trim().length>0&&v.title.length<=100 &&
  typeof v.goal==="string"&&v.goal.length<=1000 &&
  typeof v.result==="string"&&v.result.length<=1500 &&
  typeof v.problem==="string"&&v.problem.length<=1000 &&
  typeof v.solution==="string"&&v.solution.length<=1000 &&
  (v.recordedAt===null||(typeof v.recordedAt==="string"&&
    v.recordedAt.length>0&&v.recordedAt.length<=40&&!Number.isNaN(Date.parse(v.recordedAt)))) &&
  (v.criteria===undefined||(Array.isArray(v.criteria)&&v.criteria.length<=12&&
    v.criteria.every(s=>typeof s==="string"&&s.length<=500))) &&
  (v.reference===undefined||(v.reference!==null && typeof v.reference==="object" && typeof v.reference.label==="string" &&
    typeof v.reference.url==="string" &&
    v.reference.url.startsWith("https://github.com/sudokuh1/")));
}
export function validTimeline(value:unknown):value is TimelineDocument{
 if(!value||typeof value!=="object")return false;
 const v=value as Partial<TimelineDocument>;
 if(v.version!==1||!Array.isArray(v.entries)||v.entries.length>TIMELINE_ENTRY_LIMIT)return false;
 const ids=new Set<string>();
 for(const entry of v.entries){
  if(!validTimelineEntry(entry)||ids.has(entry.id))return false;
  ids.add(entry.id);
 }
 return true;
}
export function timelineCounts(doc:TimelineDocument){
 return {
  done:doc.entries.filter(e=>e.status==="done").length,
  active:doc.entries.filter(e=>e.status==="active").length,
  planned:doc.entries.filter(e=>e.status==="planned").length,
  blocked:doc.entries.filter(e=>e.status==="blocked").length
 };
}
export function appendTimelineEntry(
 doc:TimelineDocument,draft:TimelineDraft,id:string,recordedAt:string
):TimelineDocument{
 if(doc.entries.length>=TIMELINE_ENTRY_LIMIT)throw new Error("Maximalzahl der Schritte erreicht.");
 const title=draft.title.trim(),goal=draft.goal.trim();
 if(!title||!goal)throw new Error("Titel und Ziel sind erforderlich.");
 const event:TimelineEntry={
  id,phase:"",category:draft.category,status:draft.status,title,goal,
  result:draft.result.trim(),problem:draft.problem.trim(),
  solution:draft.solution.trim(),recordedAt
 };
 if(!validTimelineEntry(event)||doc.entries.some(e=>e.id===id))
  throw new Error("Ungültiger Eintrag oder bereits vorhandene ID.");
 return {...doc,entries:[...doc.entries,event]};
}
export function updateTimelineEntry(
 doc:TimelineDocument,id:string,draft:TimelineDraft
):TimelineDocument{
 const current=doc.entries.find(e=>e.id===id);
 if(!current)throw new Error("Eintrag nicht gefunden.");
 const title=draft.title.trim(),goal=draft.goal.trim();
 const updated:TimelineEntry={...current,title,goal,
  category:draft.category,status:draft.status,
  result:draft.result.trim(),problem:draft.problem.trim(),solution:draft.solution.trim()};
 if(!validTimelineEntry(updated))throw new Error("Titel, Ziel oder Feldlänge ungültig.");
 return {...doc,entries:doc.entries.map(e=>e.id===id?updated:e)};
}
export function removeTimelineEntry(doc:TimelineDocument,id:string):TimelineDocument{
 return {...doc,entries:doc.entries.filter(e=>e.id!==id)};
}
export function defaultProjectTimeline(project:ProjectEntry):TimelineDocument{
 if(project.kind==="example"){
  return {version:1,entries:[
   {id:"ex-origin",phase:"",category:"origin",status:"done",
    title:"Grundgedanke: modulare Spielwelt",goal:"Spielwelt, Charakter und Oberfläche unabhängig entwickeln.",
    result:"Beispielprojekt mit eigenem Modulgraphen und klaren Bereichen angelegt.",
    problem:"",solution:"",recordedAt:"2026-11-01"},
   {id:"ex-character",phase:"",category:"step",status:"done",
    title:"Charakter und Outfits trennen",goal:"Kleidung darf nicht vom aktuellen Raum abhängig sein.",
    result:"Architekturregel dokumentiert und Aufgaben für Outfits erstellt.",
    problem:"Outfit-Zustand war konzeptionell zu eng mit der Raumlogik verbunden.",
    solution:"Kleidung als eigenes, dem Charakter zugeordnetes Modul geplant.",
    recordedAt:"2026-11-05"},
   {id:"ex-interface",phase:"",category:"step",status:"active",
    title:"Steuerrad und Oberfläche",goal:"Globale Bedienung über Räume hinweg vereinheitlichen.",
    result:"Radialmenü und erste UI-Module konzipiert.",
    problem:"Gamepad-Steuerung und Anbindung sind noch nicht durchgängig geprüft.",
    solution:"Als offener Testschritt festgehalten.",
    recordedAt:"2026-11-10"},
   {id:"ex-mvp",phase:"",category:"milestone",status:"planned",
    title:"Spielprototyp",goal:"Eine durchgängige Demonstration von Charakter, Welt und Oberfläche.",
    result:"",problem:"",solution:"",recordedAt:null}
  ]};
 }
 return {version:1,entries:[{
  id:"origin-"+project.id,phase:"",category:"origin",status:"done",
  title:"Projekt angelegt",goal:"Grundgedanken, Schritte und Entscheidungen festhalten.",
  result:"Lokales Projekt im Browser erstellt.",problem:"",solution:"",
  recordedAt:project.createdAt
 }]};
}
