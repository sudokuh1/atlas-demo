import { freshDemoState } from "./demo-model";
import type { DemoState, View } from "./demo-model";

export type ProjectEntry = {
  id: string; title: string; summary: string; kind: "example" | "local";
  createdAt: string;
};
export type WorkspaceCatalog = { version: 1; projects: ProjectEntry[] };
export const EXAMPLE_PROJECT = "example-game";
export const initialCatalog: WorkspaceCatalog = {
  version: 1,
  projects: [{
    id: EXAMPLE_PROJECT,
    title: "Beispielspiel",
    summary: "Spielwelt, Charaktere, UI und technische Abhängigkeiten",
    kind: "example",
    createdAt: "2026-11-01"
  }]
};
export function newProjectEntry(id: string, title: string): ProjectEntry {
  return {
    id, title: title.trim().slice(0,100), kind: "local",
    summary: "Leeres Projekt im Browser", createdAt: new Date().toISOString()
  };
}
export function blankProjectState(title: string, rootId: string): DemoState {
  return {
    graph: {
      nodes: [{
        id: rootId, title, kind: "project",
        description: "Lokales Beispielprojekt. Nur in diesem Browser gespeichert.",
        status: "planned", files: [], rule: "Hier können Module und Aufgaben geplant werden.", tasks: []
      }],
      relations: []
    },
    layout: {positions: {[rootId]: {x: 450,y:80}}}
  };
}
export function defaultProjectState(entry: ProjectEntry): DemoState {
  return entry.kind==="example" ? freshDemoState() : blankProjectState(entry.title,entry.id+"-root");
}
export type AppearanceSettings = {
  theme: "dark" | "light";
  density: "comfortable" | "compact";
};
export type ProjectSettings = {
  defaultView: View;
  showTaskCounts: boolean;
};
export type SettingsState = {
  version: 1;
  appearance: AppearanceSettings;
  project: Record<string, ProjectSettings>;
};
export const defaultSettings: SettingsState = {
  version: 1,
  appearance: {theme: "dark", density: "comfortable"},
  project: {}
};
export function projectSettings(settings: SettingsState, projectId: string): ProjectSettings {
  return settings.project[projectId] ?? {defaultView:"architecture",showTaskCounts:true};
}
export function updateProjectSettings(settings: SettingsState, projectId: string, patch: Partial<ProjectSettings>): SettingsState {
  return {...settings,project:{...settings.project,[projectId]:{...projectSettings(settings,projectId),...patch}}};
}
