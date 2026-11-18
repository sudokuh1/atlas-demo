import type { DemoGraph, DemoLayout } from "./demo-model";

// This is a browser-local illustration of the server-side view model.
// Views contain only layouts. Modules and relationships remain canonical.
export type SavedLayout = { id:string; title:string; layout:DemoLayout };
export type SavedLayouts = { version:1; activeId:string; views:SavedLayout[] };
export const OVERVIEW_ID="overview";
export function initialLayouts(layout:DemoLayout):SavedLayouts {
  return {version:1,activeId:OVERVIEW_ID,
    views:[{id:OVERVIEW_ID,title:"Übersicht",layout:structuredClone(layout)}]};
}
export function withActiveLayout(all:SavedLayouts,layout:DemoLayout):SavedLayouts {
  return {...all,views:all.views.map(v=>v.id===all.activeId?
    {...v,layout:structuredClone(layout)}:v)};
}
export function normalizePositions(layout:DemoLayout,graph:DemoGraph,fallback:DemoLayout):DemoLayout {
  return {positions:Object.fromEntries(graph.nodes.map((n,i)=>[
    n.id,
    layout.positions[n.id]??fallback.positions[n.id]??{
      x:40+(i%5)*215,y:540+Math.floor(i/5)*125
    }
  ]))};
}
export function selectedLayout(all:SavedLayouts,id:string,graph:DemoGraph,fallback:DemoLayout):DemoLayout {
  const item=all.views.find(v=>v.id===id);
  return normalizePositions(item?.layout??all.views[0].layout,graph,fallback);
}
export function addLayout(all:SavedLayouts,id:string,title:string,layout:DemoLayout):SavedLayouts {
  const clean=title.trim();
  if(!clean||clean.length>80||all.views.length>=30||
    all.views.some(v=>v.title.toLocaleLowerCase("de")===clean.toLocaleLowerCase("de")))
    throw new Error("Name ungültig, bereits vorhanden oder Limit erreicht");
  return {...all,activeId:id,views:[...all.views,{id,title:clean,layout:structuredClone(layout)}]};
}
export function renameLayout(all:SavedLayouts,id:string,title:string):SavedLayouts {
  if(id===OVERVIEW_ID)throw new Error("Die Standardansicht ist geschützt");
  const clean=title.trim();
  if(!clean||clean.length>80||all.views.some(v=>v.id!==id&&v.title.toLocaleLowerCase("de")===clean.toLocaleLowerCase("de")))
    throw new Error("Name ungültig oder bereits vorhanden");
  return {...all,views:all.views.map(v=>v.id===id?{...v,title:clean}:v)};
}
export function removeLayout(all:SavedLayouts,id:string):SavedLayouts {
  if(id===OVERVIEW_ID)throw new Error("Die Standardansicht kann nicht gelöscht werden");
  return {...all,activeId:all.activeId===id?OVERVIEW_ID:all.activeId,
    views:all.views.filter(v=>v.id!==id)};
}
