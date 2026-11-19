import type { TimelineDocument,TimelineEntry } from "./project-timeline";

// Curated, public snapshot of the private MVP_ROADMAP and PROJECT_JOURNAL.
// It is not an automatically synchronized feed or audit log.
export const ATLAS_ROADMAP_UPDATED="2026-11-19";
export const atlasMilestones:TimelineEntry[]=[
 {
  id:"A00",phase:"A00",category:"origin",status:"done",
  title:"Grundgedanke und Zielbild",
  goal:"Komplexe, KI-gestützt entwickelte Projekte strukturell verständlich machen.",
  result:"Vision, Modul-IDs und Grenzen des lokalen MVP definiert.",
  problem:"Fachliche Daten durften nicht vom späteren UI-Design abhängen.",
  solution:"Graph, Canvas-Layout und Präsentation als getrennte Ebenen festgelegt.",
  recordedAt:"2026-11",
  criteria:["Vision und MVP-Umfang dokumentiert"]
 },
 {
  id:"A01",phase:"A01",category:"step",status:"done",
  title:"Persistente Projektgrundlage",
  goal:"Module, Projekte und Beziehungen mit stabilen IDs speichern.",
  result:"React-Editor, Go-API und PostgreSQL-Datenmodell mit Integrationstests.",
  problem:"",solution:"",recordedAt:"2026-11",
  criteria:["Daten über Neustarts hinweg in PostgreSQL","Projektgebundene Graph-Beziehungen"]
 },
 {
  id:"A02",phase:"A02",category:"step",status:"done",
  title:"Aufgaben und Quellen",
  goal:"Arbeit und Dokumentation mit konkreten Modulen verknüpfen.",
  result:"Aufgaben, Dokumentation und manuelle Git-Webreferenzen sind implementiert.",
  problem:"Referenzen sind noch keine automatische Git-Synchronisierung.",
  solution:"Manuelle Herkunft klar von zukünftiger Live-Integration abgegrenzt.",
  recordedAt:"2026-11"
 },
 {
  id:"A03",phase:"A03",category:"step",status:"done",
  title:"Mehrere Canvas-Ansichten",
  goal:"Fachgraph und visuelle Anordnung unabhängig verwalten.",
  result:"Benannte Views mit eigenen Layouts, Revisionen und getrennten API-Schreibwegen.",
  problem:"Die alte API mischte Positionen mit Modul- und Beziehungsdaten.",
  solution:"Neue Graph-/Layout-Endpunkte eingeführt; alte /map-API bleibt kompatibel.",
  recordedAt:"2026-11",
  reference:{label:"PR #8",url:"https://github.com/sudokuh1/atlas/pull/8"}
 },
 {
  id:"A04",phase:"A04",category:"step",status:"done",
  title:"Workspace und Einstellungen",
  goal:"Projekte sinnvoll organisieren und die eigene Codebasis modular halten.",
  result:"Projektordner, eigenständige Settings und entkoppelte Editorsteuerung.",
  problem:"Projektstart war festgelegt; der React-Einstieg bündelte zu viele Aufgaben.",
  solution:"Projektverzeichnis und getrennte Domain-/API-/UI-Controller eingeführt.",
  recordedAt:"2026-11",
  reference:{label:"PR #10",url:"https://github.com/sudokuh1/atlas/pull/10"}
 },
 {
  id:"A05",phase:"A05",category:"problem",status:"active",
  title:"Freier, berührungssicherer Canvas",
  goal:"Unbegrenztes Pan/Zoom und freies Verschieben hinter einer Sperre.",
  result:"Öffentliche Demo mit Kameramodell und Drag-Sperre aktualisiert.",
  problem:"Feste Pyramidenfläche; nach Kamera-Umbau waren SVG-Icons verrutscht.",
  solution:"Verbindungslinien und Icons per CSS getrennt. Übertragung auf privaten Editor und echte Touchtests noch offen.",
  recordedAt:"2026-11-19",
  reference:{label:"Issue #12",url:"https://github.com/sudokuh1/atlas/issues/12"},
  criteria:["Privaten Canvas übertragen","Handy/Tablet/PC mit echten Gesten prüfen"]
 },
 {
  id:"A06",phase:"A06",category:"milestone",status:"planned",
  title:"Projektzeitstrahl",
  goal:"Jeder Projektabschnitt hat Ziel, Status, Ergebnis, Problem und Lösung.",
  result:"",problem:"",solution:"",
  recordedAt:null,
  criteria:["Eigener Projekt-Datenvertrag mit Revisionsschutz","In PostgreSQL gespeichert",
   "Desktop quer, Smartphone vertikal"]
 },
 {
  id:"A07",phase:"A07",category:"milestone",status:"planned",
  title:"Audit und Wiederherstellung",
  goal:"Änderungen nachvollziehen und kontrolliert rückgängig machen.",
  result:"",problem:"",solution:"",recordedAt:null,
  criteria:["Nachvollziehbare Änderungseinträge","Konfliktsichere Wiederherstellung"]
 },
 {
  id:"A08",phase:"A08",category:"milestone",status:"planned",
  title:"KI-Kontext exportieren",
  goal:"Projektkontext gezielt exportieren, ohne geheime Daten mitzuschicken.",
  result:"",problem:"",solution:"",recordedAt:null,
  criteria:["Modul-/Aufgaben-/Quellenauswahl","Lesbarer Kontext mit Herkunft"]
 },
 {
  id:"A09",phase:"A09",category:"milestone",status:"planned",
  title:"MVP-Qualität und Bedienbarkeit",
  goal:"Installation, Backup und alle Kernabläufe reproduzierbar prüfen.",
  result:"",problem:"",solution:"",recordedAt:null,
  criteria:["Frontend, Go, PostgreSQL und End-to-End","Desktop-/Tablet-/Handy-Prüfung","Backup-/Restore-Anleitung"]
 },
 {
  id:"MVP",phase:"MVP",category:"milestone",status:"planned",
  title:"Lokales Atlas-MVP abnehmen",
  goal:"Vom Projektstart bis zum wiederaufgenommenen Arbeitsstand durchgängig nutzbar.",
  result:"",problem:"",solution:"",recordedAt:null,
  criteria:["Alle MVP-Kernfälle bestanden","Keine offene kritische Datenverlustfunktion"]
 }
];
export const atlasRoadmap:TimelineDocument={version:1,entries:atlasMilestones};
