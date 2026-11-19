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
  for(const file of ["demo-model","module-tree","workspace","canvas-views","canvas-camera"]){
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
  const camera=await import(pathToFileURL(path.join(temp,"canvas-camera.mjs")));
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
  const free={x:-1430,y:3650,zoom:0.4};
  const world={x:-700,y:4900};
  const screen=camera.worldToScreen(world,free);
  assert.deepEqual(camera.screenToWorld(screen,free),world,
    "world-to-screen coordinates must work in every direction, including negative positions");
  const center={x:180,y:220};
  const before=camera.screenToWorld(center,free);
  const zoomed=camera.zoomCameraAt(free,1.8,center);
  const after=camera.screenToWorld(center,zoomed);
  assert.ok(Math.abs(before.x-after.x)<1e-8 && Math.abs(before.y-after.y)<1e-8,
    "zooming must keep the pointer's world position anchored");
  assert.equal(camera.clampZoom(0),camera.MIN_ZOOM);
  assert.equal(camera.clampZoom(100),camera.MAX_ZOOM);
  const panned=camera.panCamera(free,-100000,200000);
  assert.equal(panned.x,free.x-100000,"camera must not have a left boundary");
  assert.equal(panned.y,free.y+200000,"camera must not have a bottom boundary");
  const nodes={a:{x:-2600,y:-1400},b:{x:5000,y:3600}};
  const fitted=camera.fitCamera(nodes,["a","b"],390,550);
  for(const point of Object.values(nodes)){
    const topLeft=camera.worldToScreen(point,fitted);
    const bottomRight=camera.worldToScreen({
      x:point.x+camera.NODE_WIDTH,y:point.y+camera.NODE_HEIGHT
    },fitted);
    assert.ok(topLeft.x>=-1 && topLeft.y>=-1 &&
      bottomRight.x<=391 && bottomRight.y<=551,
      "fit must include remote nodes and negative coordinates");
  }
  const focus=camera.centerCameraOn(fitted,{x:-2000,y:-1000},390,550);
  const centered=camera.worldToScreen({x:-2000,y:-1000},focus);
  assert.ok(Math.abs(centered.x-195)<1e-8 && Math.abs(centered.y-275)<1e-8);
  assert.equal(graph.graph.nodes[0].id,"game",
    "camera operations must never change canonical module IDs");
  const css=fs.readFileSync(new URL("../src/demo.css",import.meta.url),"utf8");
  const canvasMarkup=fs.readFileSync(new URL("../src/ui/DemoCanvas.tsx",import.meta.url),"utf8");
  assert.match(canvasMarkup,/className="atlas-connections"/,"connection SVG needs explicit class");
  assert.doesNotMatch(css,/\.atlas-board\s+svg\s*\{/,
    "SVG selector must not absolutely position icons inside graph nodes");
  assert.match(css,/\.atlas-board\s*>\s*svg\.atlas-connections\s*\{/,
    "SVG positioning must only affect the connection layer");
  assert.match(css,/\.atlas-graph-icon\s*>\s*svg\s*\{/,
    "graph icons must retain their centered layout");
  console.log("Demo graph, hierarchy, project, settings, layouts and unbounded camera OK");
}finally{
  fs.rmSync(temp,{recursive:true,force:true});
}
