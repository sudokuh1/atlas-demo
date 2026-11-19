import type { ProjectEntry } from "../model/workspace";
import type { TimelineDocument } from "../model/project-timeline";
import { defaultProjectTimeline,validTimeline } from "../model/project-timeline";

// Separate browser adapter: timeline entries never become graph nodes or layouts.
// The backend will later provide its own project-scoped, versioned API.
const KEY="atlas-demo-project-timeline-v1-";
export function loadProjectTimeline(project:ProjectEntry):TimelineDocument {
 try{
  const raw=localStorage.getItem(KEY+project.id);
  if(raw){
   const value:unknown=JSON.parse(raw);
   if(validTimeline(value))return value;
  }
 }catch{/* browser storage may be blocked or malformed */}
 return defaultProjectTimeline(project);
}
export function saveProjectTimeline(projectId:string,document:TimelineDocument):boolean {
 if(!validTimeline(document))return false;
 try{
  localStorage.setItem(KEY+projectId,JSON.stringify(document));
  return true;
 }catch{return false;}
}
