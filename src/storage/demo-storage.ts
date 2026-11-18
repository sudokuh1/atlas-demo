import { freshDemoState } from "../model/demo-model";
import type { DemoState, DemoGraph, DemoNode, DemoLayout, Point } from "../model/demo-model";

const KEY = "atlas-public-example-v2";
const OLD_KEY = "atlas-public-example-v1";
export function loadDemoState(): DemoState {
  const fallback = freshDemoState();
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      const value: unknown = JSON.parse(stored);
      if (validState(value)) return value;
    }
    // One-way migration from the first demo format, which mixed canvas coordinates
    // and emoji icons into the canonical nodes. Keep edited tasks and ideas.
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const legacy: unknown = JSON.parse(old);
      if (validGraph(legacy)) {
        const oldGraph = legacy as DemoGraph;
        const positions: Record<string, Point> = { ...fallback.layout.positions };
        const nodes: DemoNode[] = oldGraph.nodes.map(n => {
          const raw = n as DemoNode & {x?:number;y?:number;icon?:string};
          if (Number.isFinite(raw.x) && Number.isFinite(raw.y)) {
            positions[n.id] = {x:raw.x!,y:raw.y!};
          }
          const { x: _x, y: _y, icon: _icon, ...node } = raw;
          return node;
        });
        return { graph:{nodes,relations:oldGraph.relations}, layout:{positions} };
      }
    }
  } catch { /* Browser storage can be unavailable or invalid. */ }
  return fallback;
}
export function saveDemoState(state: DemoState): boolean {
  try { localStorage.setItem(KEY,JSON.stringify(state)); return true; }
  catch { return false; }
}
function validGraph(v: unknown): v is DemoGraph {
  if (!v || typeof v !== "object") return false;
  const g = v as Partial<DemoGraph>;
  return Array.isArray(g.nodes) && Array.isArray(g.relations) && g.nodes.length > 0 && g.nodes.length < 50 &&
    g.nodes.every(n => n && typeof n.id === "string" && typeof n.title === "string" &&
      typeof n.kind === "string" && typeof n.description === "string" &&
      typeof n.status === "string" && Array.isArray(n.files) && Array.isArray(n.tasks)) &&
    g.relations.every(r => r && typeof r.from === "string" && typeof r.to === "string");
}
function validState(v: unknown): v is DemoState {
  if (!v || typeof v !== "object") return false;
  const s=v as {graph?:unknown;layout?:unknown};
  if (!validGraph(s.graph)||!s.layout||typeof s.layout!=="object")return false;
  const l=s.layout as DemoLayout;
  return !!l.positions && typeof l.positions==="object" &&
    s.graph.nodes.every(n => {const p=l.positions[n.id];return p && Number.isFinite(p.x) && Number.isFinite(p.y);});
}
