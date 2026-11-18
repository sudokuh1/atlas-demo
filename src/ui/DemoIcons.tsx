import type { ReactNode } from "react";
import type { NodeKind } from "../model/demo-model";

type IconName = "project" | "person" | "globe" | "interface" | "outfits" | "motion" | "tree" | "home" | "wheel" | "idea" | "module" | "folder" | "network";
const shapes: Record<IconName, ReactNode> = {
  project: <><rect x="3" y="8" width="18" height="11" rx="3"/><path d="M7 12h3m-1.5-1.5v3M16 11h.01M18 14h.01"/></>,
  person: <><circle cx="12" cy="5" r="2.3"/><path d="M8 20v-6l-2-3 2-2h8l2 2-2 3v6M9 14h6m-3 0v6"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18"/></>,
  interface: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-13 4h8m-8 4h5"/></>,
  outfits: <><path d="M8 3 5 5 2 8l4 4 2-2v11h8V10l2 2 4-4-3-3-3-2-4 4z"/></>,
  motion: <><circle cx="14.5" cy="4" r="2"/><path d="m12 8-3 4 3 2 2 6m-2-12 4 3 3 1m-7 2-4 2-3 4"/></>,
  tree: <><path d="m12 3-7 9h4l-5 6h16l-5-6h4zM12 18v3"/></>,
  home: <><path d="m3 11 9-8 9 8v10H3zM9 21v-7h6v7"/></>,
  wheel: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6m0 6v6M3 12h6m6 0h6"/></>,
  idea: <><path d="M9 18h6M10 21h4M8 14c-2-1.5-3-3.2-3-5a7 7 0 0 1 14 0c0 2-1.2 3.8-3 5l-1 3H9z"/></>,
  module: <><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></>,
  folder: <><path d="M3 6h7l2 2h9v12H3z"/></>,
  network: <><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/></>
};
const byId: Record<string,IconName> = {
  game:"project",character:"person",world:"globe",interface:"interface",
  outfits:"outfits",motion:"motion",terrain:"tree",buildings:"home",wheel:"wheel"
};
export function DemoIcon({name,size=24}:{name:IconName;size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {shapes[name]}
  </svg>;
}
export function NodeIcon({id,kind,size=24}:{id:string;kind:NodeKind;size?:number}) {
  return <DemoIcon name={byId[id] ?? (kind==="idea"?"idea":kind==="project"?"project":"module")} size={size}/>;
}
