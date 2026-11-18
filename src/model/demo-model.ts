// Canonical demo graph: no positions, icons, browser APIs, or React dependencies.
export type View = "architecture" | "dependencies" | "progress";
export type Status = "planned" | "active" | "blocked" | "done";
export type NodeKind = "project" | "area" | "module" | "idea";
export type Task = { id: string; title: string; status: Status };
export type DemoNode = {
  id: string; title: string; kind: NodeKind;
  description: string; status: Status;
  files: string[]; rule: string; tasks: Task[];
};
export type Relation = { from: string; to: string; kind: "contains" | "uses" | "depends_on" };
export type DemoGraph = { nodes: DemoNode[]; relations: Relation[] };
export type Point = { x: number; y: number };
export type DemoLayout = { positions: Record<string, Point> };
export type DemoState = { graph: DemoGraph; layout: DemoLayout };

export const initialGraph: DemoGraph = {
  nodes: [
    { id:"game", title:"Beispielspiel", kind:"project",
      description:"Ein fiktives Open-World-Spiel: Die Karte trennt fachliche Module von Dateien und ihrer visuellen Darstellung.",
      status:"active", files:["README.md"], rule:"Komponenten bleiben unabhängig von einzelnen Spielräumen.",
      tasks:[{id:"game-1",title:"Modularchitektur prüfen",status:"active"}]},
    { id:"character", title:"Charaktere", kind:"area",
      description:"Figur, Animation und Erscheinungsbild sind eigenständige Bereiche.",
      status:"active", files:["src/characters/"], rule:"Charakterzustände überleben Raumwechsel.",
      tasks:[{id:"char-1",title:"Charakterzustand zentralisieren",status:"active"}]},
    { id:"world", title:"Spielwelt", kind:"area",
      description:"Welt, Terrain und Gebäude mit eigener Inhaltsstruktur.",
      status:"planned", files:["src/world/"], rule:"Objekte dürfen nicht direkt auf das UI zugreifen.",
      tasks:[{id:"world-1",title:"Landschaftssystem planen",status:"planned"}]},
    { id:"interface", title:"Interface", kind:"area",
      description:"HUD, Menü und das wiederverwendbare Steuerrad.",
      status:"active", files:["src/ui/"], rule:"Menüs konsumieren Spielzustände, besitzen sie aber nicht.",
      tasks:[{id:"ui-1",title:"UI-Baukasten aufbauen",status:"active"}]},
    { id:"outfits", title:"Outfits", kind:"module",
      description:"Kleidung, Presets und kosmetische Änderungen des Charakters.",
      status:"blocked", files:["src/characters/outfits/","assets/clothing/"],
      rule:"Outfits sind an den Charakter gebunden, niemals an den aktuellen Raum.",
      tasks:[{id:"out-1",title:"Outfits vom Raum entkoppeln",status:"blocked"},{id:"out-2",title:"Kleidungs-Presets",status:"planned"}]},
    { id:"motion", title:"Bewegungen", kind:"module",
      description:"Animationen und Bewegungszustände als austauschbares Modul.",
      status:"active", files:["src/characters/motion/"], rule:"Bewegungslogik muss ohne UI funktionieren.",
      tasks:[{id:"mot-1",title:"Animationsübergänge testen",status:"active"}]},
    { id:"terrain", title:"Terrain", kind:"module",
      description:"Boden, Landschaft, Bäume und Büsche als kombinierbare Assets.",
      status:"planned", files:["src/world/terrain/","assets/vegetation/"],
      rule:"Assetdaten und Terrain-Rendering bleiben getrennt.",
      tasks:[{id:"terr-1",title:"Terrain-Baukasten entwerfen",status:"planned"}]},
    { id:"buildings", title:"Gebäude", kind:"module",
      description:"Gebäude, Innenräume und wiederverwendbare Bauteile.",
      status:"planned", files:["src/world/buildings/"], rule:"Gebäude enthalten keine Charaktersteuerung.",
      tasks:[{id:"build-1",title:"Prefab-Schema festlegen",status:"planned"}]},
    { id:"wheel", title:"Steuerrad", kind:"module",
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

export const initialLayout: DemoLayout = {
  positions: {
    "game": { x: 460, y: 24 },
    "character": { x: 85, y: 186 },
    "world": { x: 460, y: 186 },
    "interface": { x: 835, y: 186 },
    "outfits": { x: 20, y: 360 },
    "motion": { x: 235, y: 360 },
    "terrain": { x: 450, y: 360 },
    "buildings": { x: 665, y: 360 },
    "wheel": { x: 880, y: 360 }
  }
};

export function freshDemoState(): DemoState {
  return {
    graph: structuredClone(initialGraph),
    layout: structuredClone(initialLayout)
  };
}
export function connectedRelations(graph: DemoGraph, id: string): Relation[] {
  return graph.relations.filter(r => r.from === id || r.to === id);
}
export function visibleRelations(graph: DemoGraph, view: View): Relation[] {
  return graph.relations.filter(r => view === "dependencies" ? r.kind !== "contains" : r.kind === "contains");
}
export function openTaskCount(graph: DemoGraph): number {
  return graph.nodes.reduce((sum,n) => sum + n.tasks.filter(t => t.status !== "done").length, 0);
}
export function changeTaskStatus(graph: DemoGraph, nodeId: string, taskId: string, status: Status): DemoGraph {
  return { ...graph, nodes: graph.nodes.map(n => n.id === nodeId ?
    {...n, tasks: n.tasks.map(t => t.id === taskId ? {...t,status} : t)} : n) };
}
export function appendIdea(state: DemoState, parentId: string, id: string, title: string): DemoState {
  const index = state.graph.nodes.filter(n => n.kind === "idea").length;
  const node: DemoNode = {
    id, title: title.trim().slice(0,60), kind:"idea",
    description:"Neue Idee aus dem Demo-Modus. Im echten Atlas kann daraus ein geplanter Projektbaustein werden.",
    status:"planned", files:[], rule:"Noch keine Architekturregel festgelegt.", tasks:[]
  };
  return {
    graph: {
      nodes: [...state.graph.nodes,node],
      relations: [...state.graph.relations,{from:parentId,to:id,kind:"contains"}]
    },
    layout: {positions: {...state.layout.positions,[id]: {x:40+(index%5)*215,y:540+Math.floor(index/5)*125}}}
  };
}
