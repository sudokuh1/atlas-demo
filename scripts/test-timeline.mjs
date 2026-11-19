// Browser-independent chronology, persistence and responsive-layout contract tests.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import ts from "typescript";
const root=fileURLToPath(new URL("../src/",import.meta.url));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"atlas-timeline-"));
function compile(file,dest){
 const source=fs.readFileSync(path.join(root,file),"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
 }}).outputText.replaceAll('from "../model/project-timeline"','from "../model/project-timeline.mjs"');
 const output=path.join(tmp,dest);fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,js);
}
try{
 compile("model/project-timeline.ts","model/project-timeline.mjs");
 compile("model/atlas-roadmap.ts","model/atlas-roadmap.mjs");
 compile("storage/project-timeline.ts","storage/project-timeline.mjs");
 const domain=await import(pathToFileURL(path.join(tmp,"model/project-timeline.mjs")));
 const atlas=await import(pathToFileURL(path.join(tmp,"model/atlas-roadmap.mjs")));
 const storage=await import(pathToFileURL(path.join(tmp,"storage/project-timeline.mjs")));
 const example={id:"example-game",title:"Beispielspiel",summary:"Fiktiv",
  kind:"example",createdAt:"2026-11-01"};
 const another={id:"project-2",title:"Testplan",summary:"Lokal",
  kind:"local",createdAt:"2026-11-19T08:00:00Z"};
 const demo=domain.defaultProjectTimeline(example);
 const local=domain.defaultProjectTimeline(another);
 assert.ok(domain.validTimeline(demo));
 assert.ok(domain.validTimeline(local));
 assert.equal(demo.entries.length,4);
 assert.equal(local.entries.length,1);
 assert.equal(local.entries[0].category,"origin");
 assert.equal(local.entries[0].title,"Projekt angelegt");
 const draft={category:"problem",status:"active",title:"  Fehler in Komponente  ",
  goal:"  Verhalten verstehen  ",result:"Test reproduziert",
  problem:"SVG überschneidet Texte",solution:"Styles eingegrenzt"};
 const added=domain.appendTimelineEntry(local,draft,"event-1","2026-11-19T09:30:00Z");
 assert.equal(local.entries.length,1,"model operations must not mutate previous entries");
 assert.equal(added.entries.length,2);
 assert.equal(added.entries[1].title,"Fehler in Komponente");
 assert.equal(added.entries[1].problem,"SVG überschneidet Texte");
 assert.equal(added.entries[1].solution,"Styles eingegrenzt");
 assert.throws(()=>domain.appendTimelineEntry(added,draft,"event-1","2026-11-19T09:30:00Z"));
 assert.throws(()=>domain.appendTimelineEntry(added,{...draft,title:""},"event-2","2026-11-19T09:30:00Z"));
 assert.equal(domain.validTimeline({version:1,entries:[added.entries[0],added.entries[0]]}),false);
 assert.equal(domain.validTimeline({version:1,entries:[{...added.entries[1],status:"invalid"}]}),false);
 assert.equal(domain.validTimeline({version:1,entries:[{...added.entries[1],reference:null}]}),false);
 const changed=domain.updateTimelineEntry(added,"event-1",{
  ...draft,status:"done",result:"Korrektur verifiziert",solution:"Selektor korrigiert"
 });
 assert.equal(changed.entries[1].status,"done");
 assert.equal(added.entries[1].status,"active","history edits must be immutable");
 assert.equal(changed.entries[1].recordedAt,added.entries[1].recordedAt,
  "editing should preserve the original recorded timestamp");
 const removed=domain.removeTimelineEntry(changed,"event-1");
 assert.equal(removed.entries.length,1);
 assert.equal(changed.entries.length,2);
 assert.equal(domain.timelineCounts(added).active,1);
 const phases=atlas.atlasRoadmap.entries.map(e=>e.phase);
 assert.deepEqual(phases,["A00","A01","A02","A03","A04","A05","A06","A07","A08","A09","MVP"]);
 assert.ok(domain.validTimeline(atlas.atlasRoadmap),"curated roadmap must match the generic project timeline schema");
 assert.deepEqual(atlas.atlasRoadmap.entries.slice(0,5).map(e=>e.status),Array(5).fill("done"));
 assert.equal(atlas.atlasRoadmap.entries[5].status,"active",
  "private app canvas migration cannot be marked done just because demo works");
 assert.ok(atlas.atlasRoadmap.entries.slice(6).every(e=>e.status==="planned"));
 assert.ok(atlas.atlasRoadmap.entries.some(e=>e.problem&&e.solution),
  "project history must document problems and their handling");
 assert.ok(atlas.atlasRoadmap.entries.some(e=>e.reference),
  "completed work should cite evidence where available");

 const previousStorage=globalThis.localStorage;
 const stored=new Map();
 globalThis.localStorage={
  getItem:key=>stored.get(key)??null,
  setItem:(key,value)=>stored.set(key,value)
 };
 try{
  assert.equal(storage.loadProjectTimeline(another).entries.length,1);
  assert.equal(storage.saveProjectTimeline(another.id,added),true);
  assert.deepEqual(storage.loadProjectTimeline(another),added);
  assert.equal(storage.loadProjectTimeline(example).entries.length,4,
   "different projects cannot share the same local history key");
  stored.set("atlas-demo-project-timeline-v1-"+another.id,"malformed json");
  assert.equal(storage.loadProjectTimeline(another).entries.length,1,
   "malformed local storage must not crash project opening");
  assert.equal(storage.saveProjectTimeline(another.id,{version:1,entries:[{id:"bad"}]}),false);
 }finally{globalThis.localStorage=previousStorage;}
 const css=fs.readFileSync(path.join(root,"ui/ProjectTimeline.css"),"utf8");
 assert.match(css,/\.atlas-timeline-track\s*\{[^}]*display:flex/,
  "desktop timeline must be horizontally composed");
 assert.match(css,/@media\(max-width:700px\)\s*\{[\s\S]*?\.atlas-timeline-track\s*\{[^}]*flex-direction:column/,
  "mobile timeline must be vertical");
 const app=fs.readFileSync(path.join(root,"demo.tsx"),"utf8");
 assert.match(app,/screen==="roadmap"/);
 assert.match(app,/onAdd=\{addTimelineStep\}/);
 assert.match(app,/onUpdate=\{editTimelineStep\}/);
 console.log("Timeline model, chronology, editable events, storage and desktop/mobile layout contracts OK");
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
