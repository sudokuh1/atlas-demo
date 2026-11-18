import type { DemoGraph, DemoNode } from "./demo-model";
export type TreeEntry = {node: DemoNode; depth: number; hasChildren: boolean};
// Only "contains" establishes hierarchy; dependency edges never change navigation.
export function moduleTree(graph:DemoGraph,expanded:Set<string>,search:string):TreeEntry[]{
  const byId=new Map(graph.nodes.map(n=>[n.id,n]));
  const children=new Map<string,string[]>();
  const parent=new Map<string,string>();
  for(const r of graph.relations){
    if(r.kind!=="contains"||r.from===r.to||!byId.has(r.from)||!byId.has(r.to)||parent.has(r.to))continue;
    parent.set(r.to,r.from);
    children.set(r.from,[...(children.get(r.from)??[]),r.to]);
  }
  const query=search.trim().toLocaleLowerCase("de");
  if(query){
    return graph.nodes.filter(n=>n.title.toLocaleLowerCase("de").includes(query)).map(node=>({
      node,depth:0,hasChildren:(children.get(node.id)?.length??0)>0
    }));
  }
  const result:TreeEntry[]=[];
  const visited=new Set<string>();
  function walk(id:string,depth:number){
    if(visited.has(id)||depth>100)return;
    const node=byId.get(id);if(!node)return;
    visited.add(id);
    const kids=children.get(id)??[];
    result.push({node,depth,hasChildren:kids.length>0});
    if(expanded.has(id))kids.forEach(child=>walk(child,depth+1));
  }
  graph.nodes.filter(n=>!parent.has(n.id)).forEach(n=>walk(n.id,0));
  return result;
}
