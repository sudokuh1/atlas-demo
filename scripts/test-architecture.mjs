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
  for(const file of ["demo-model","module-tree","workspace"]){
    const input=fs.readFileSync(path.join(base,file+".ts"),"utf8");
    const js=ts.transpileModule(input,{compilerOptions:{
      module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
    }}).outputText.replaceAll('from "./demo-model"','from "./demo-model.mjs"');
    fs.writeFileSync(path.join(temp,file+".mjs"),js);
  }
  const model=await import(pathToFileURL(path.join(temp,"demo-model.mjs")));
  const tree=await import(pathToFileURL(path.join(temp,"module-tree.mjs")));
  const workspace=await import(pathToFileURL(path.join(temp,"workspace.mjs")));
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
  console.log("Demo graph, hierarchy, project and settings separation OK");
}finally{
  fs.rmSync(temp,{recursive:true,force:true});
}
