// Architecture regression tests without DOM, browser storage or React rendering.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {pathToFileURL,fileURLToPath} from "node:url";
import ts from "typescript";

const base=fileURLToPath(new URL("../src/model/",import.meta.url));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"atlas-demo-tests-"));
try {
  for(const file of ["demo-model","module-tree","workspace","canvas-views"]){
    const input=fs.readFileSync(path.join(base,file+".ts"),"utf8");
    const js=ts.transpileModule(input,{compilerOptions:{
      module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
    }}).outputText.replaceAll('from "./demo-model"','from "./demo-model.mjs"');
    fs.writeFileSync(path.join(temp,file+".mjs"),js);
  }
  const model=await import(pathToFileURL(path.join(temp,"demo-model.mjs")));
  const tree=await import(pathToFileURL(path.join(temp,"module-tree.mjs")));
  const workspace=await import(pathToFileURL(path.join(temp,"workspace.mjs")));
  const views=await import(pathToFileURL(path.join(temp,"canvas-views.mjs")));
  const graph=model.freshDemoState();
  assert.ok(graph.graph.nodes.length>=9);
  assert.deepEqual(Object.keys(graph.graph.nodes[0]).includes("x"),false,"positions cannot leak into module");
  assert.deepEqual(Object.keys(graph.graph.nodes[0]).includes("icon"),false,"icons cannot leak into module");
  assert.ok(graph.layout.positions.game);
  const initialTree=tree.moduleTree(graph.graph,new Set(["game"]),"");
  assert.deepEqual(initialTree.map(x=>x.node.id),["game","character","world","interface"]);
  const expanded=tree.moduleTree(graph.graph,new Set(["game","character"]),"");
  assert.ok(expanded.some(x=>x.node.id==="outfits"));
  assert.ok(!expanded.some(x=>x.node.id==="terrain"),"collapsed areas remain collapsed");
  assert.deepEqual(tree.moduleTree(graph.graph,new Set(),"outfit").map(x=>x.node.id),["outfits"]);
  const original=model.openTaskCount(graph.graph);
  const changed=model.changeTaskStatus(graph.graph,"outfits","out-1","done");
  assert.equal(model.openTaskCount(graph.graph),original,"graph remains immutable");
  assert.equal(model.openTaskCount(changed),original-1);
  const another=workspace.newProjectEntry("test-project","Beispiel zwei");
  const blank=workspace.defaultProjectState(another);
  assert.equal(blank.graph.nodes.length,1);
  assert.equal(blank.graph.nodes[0].title,"Beispiel zwei");
  assert.notEqual(blank.graph.nodes[0].id,"game");
  const setting=workspace.updateProjectSettings(workspace.defaultSettings,"first",{defaultView:"progress"});
  assert.equal(workspace.projectSettings(setting,"first").defaultView,"progress");
  assert.equal(workspace.projectSettings(setting,"second").defaultView,"architecture");
  assert.equal(workspace.defaultSettings.project.first,undefined,"defaults remain immutable");
  const initial=views.initialLayouts(graph.layout);
  assert.equal(initial.views.length,1);
  const copy=views.addLayout(initial,"development","Entwicklung",graph.layout);
  assert.equal(copy.activeId,"development");
  assert.deepEqual(copy.views[0].layout.positions.game,initial.views[0].layout.positions.game);
  const moved=structuredClone(copy.views[1].layout);
  moved.positions.game.x=789;
  const revised=views.withActiveLayout(copy,moved);
  assert.equal(revised.views[1].layout.positions.game.x,789);
  assert.equal(revised.views[0].layout.positions.game.x,460);
  assert.equal(graph.graph.nodes[0].id,"game","layouts must not change module identities");
  assert.equal(views.selectedLayout(revised,"overview",graph.graph,moved).positions.game.x,460);
  const renamed=views.renameLayout(revised,"development","Architekturdiagramm");
  assert.equal(renamed.views[1].title,"Architekturdiagramm");
  assert.throws(()=>views.renameLayout(renamed,"overview","No"),/geschützt/);
  const deleted=views.removeLayout(renamed,"development");
  assert.equal(deleted.activeId,"overview");
  assert.equal(deleted.views.length,1);
  assert.throws(()=>views.removeLayout(deleted,"overview"),/nicht gelöscht/);
  console.log("Demo graph, hierarchy, project, settings and independent canvas layouts OK");
}finally{
  fs.rmSync(temp,{recursive:true,force:true});
}
