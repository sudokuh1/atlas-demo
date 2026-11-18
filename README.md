# Project Atlas – Interaktive Demo

Diese öffentliche Repository enthält **ausschließlich eine Demo-Oberfläche** für Project Atlas. Die eigentliche Atlas-Anwendung wird separat entwickelt und bleibt privat.

## Live-Vorschau

Nach Aktivierung von GitHub Pages erscheint die Demo unter:

https://sudokuh1.github.io/atlas-demo/

**Wichtig:** Der Link funktioniert erst, nachdem unter **Settings → Pages → Build and deployment → Source: GitHub Actions** gewählt und der Workflow erfolgreich ausgeführt wurde.

## Was zeigt die Demo?

Ein fiktives Spielprojekt mit Modulen für Charaktere, Outfits, Bewegungen, Welt, Terrain, Gebäude und Steuerrad. Es gibt Ansichten für Projektstruktur, Abhängigkeiten und Aufgabenfortschritt. Module lassen sich auswählen, Aufgabenstatus ändern und neue Ideen ergänzen.

Die Daten sind vollständig erfunden. **Es gibt keine Backend-Anbindung, keine Git-Zugriffstokens und keine tatsächliche Projektcodeanalyse.** Änderungen werden ausschließlich lokal im Browser gespeichert und können zurückgesetzt werden.

## Lokale Entwicklung

Voraussetzungen: Node.js 22 und npm.

```sh
npm install
npm run dev
# http://127.0.0.1:5173/
```

Zum Prüfen des statischen Builds:

```sh
npm run build
# Ausgabe: dist/
```

## Veröffentlichung

Ein GitHub-Actions-Workflow baut auf jedem Push zu `main` ausschließlich die Demo-Dateien und veröffentlicht sie über GitHub Pages, sobald Pages für GitHub Actions eingerichtet ist. Die Website ist öffentlich; deshalb dürfen hier keine internen Projektdaten eingecheckt werden.

## Lizenz

Für diese Demo wurde **noch keine Open-Source-Lizenz** festgelegt. Bis eine Lizenz ausdrücklich ausgewählt wird, wird keine Nutzungserlaubnis über die gesetzlichen Rechte hinaus eingeräumt.

## Architektur und mobile Nutzung

Die Demo trennt das fachliche Beispielmodell (`src/model/`) von Positionen und
Canvas-Darstellung (`src/ui/`) sowie vom Browser-Speicheradapter (`src/storage/`).
Ein Austausch von UI-Bibliothek oder Theme soll deshalb keine fachlichen Daten ändern.
Der Browser-Speicher kann frühere Versionen der Demo übernehmen.

Auf Smartphones stehen **Module**, **Karte** und **Details** als separate,
touchfreundliche Bereiche zur Verfügung. Ein Modul in der Liste öffnet seine Details;
die Karte lässt sich horizontal/vertikal verschieben und zoomt unabhängig davon.
Auf Tablets werden Karte und Inspektor untereinander angeordnet; am Desktop
erscheinen sie nebeneinander. Alle Symbole sind einheitliche SVG-Icons, keine Emojis.

Automatisierte Builds prüfen TypeScript und das statische Bundle. Die tatsächliche
Touch-Bedienung sollte zusätzlich auf echten iOS-/Android-Geräten erprobt werden.

## Überarbeiteter Workspace-Einstieg

Beim Öffnen erscheint nun **die Projektübersicht**, nicht direkt ein
fest verdrahtetes Projekt. Das mitgelieferte Beispielspiel ist ein Projekt
unter mehreren; weitere lokale Testprojekte können im Browser angelegt
werden. Jedes Projekt hat einen getrennten Graphen und eigene
Projekteinstellungen. Es werden **keine** Git-Repositories oder Konten erstellt.

Im Projekt sind die Module nach `contains`-Beziehungen einklappbar.
Eine Modulwahl öffnet zunächst eine **Kurzinfo**, nicht die vollständige
Detailansicht. Erst `Details öffnen` zeigt Aufgaben, Beziehungen und
Quelldateien ausführlich.

Die Karte unterstützt `Einpassen`, Zoom von **20 % bis 200 %**,
Plus/Minus und Touch-Gesten für Verschieben/Pinch-Zoom. Auf dem Smartphone
kann zwischen Modulliste und Canvas gewechselt werden; die Info-Karte
überdeckt nicht dauerhaft die Projektkarte.

Die Demo-Einstellungen unterscheiden bisher browserweite
Darstellungsoptionen (Hell/Dunkel, Dichte) von
projektbezogenen Voreinstellungen (Standardansicht, Aufgabenkennzahlen).
Alle Einstellungen bleiben lokal im Browser. Rollen, Serverrichtlinien,
Integrations-Credentials und synchronisierte Einstellungen sind
**noch nicht implementiert**.

Das Design verwendet neutrale Tokens und zentral verwaltete SVG-Symbole.
Ein späteres Theme oder ein anderer Canvas-Renderer soll den
fachlichen Projektgraphen unverändert lassen.

## Überprüfung

`npm run test:architecture` prüft die Trennung von fachlichen
Projektdaten, Hierarchie und Darstellung sowie Settings-Scopes.
`npm run build` prüft TypeScript und erzeugt das statische Bundle.
Die Gesten sollten zusätzlich auf echten Handys und Tablets getestet werden.

## Mehrere lokale Canvas-Layouts

Die öffentliche Demo bildet jetzt die serverseitige Atlas-Ansichtsverwaltung
als **getrennte, rein browserlokale Vorschau** nach. Im Projekt können
benannte Layouts aus der aktuellen Anordnung kopiert, gewechselt,
umbenannt oder gelöscht werden. Die Standardansicht ist geschützt.

Der fachliche Graph bleibt bei allen Layouts identisch.
Um den Unterschied auf dem Handy nachvollziehen zu können, lässt sich
die Position des ausgewählten Moduls in seiner Kurzinfo mit vier
Richtungstasten verändern. Nach einem Layoutwechsel sind die
unterschiedlichen Positionen weiterhin erhalten.

Die Darstellungstabs `Architektur`, `Abhängigkeiten` und `Fortschritt`
filtern Beziehungen bzw. Kennzahlen; sie sind **nicht** dasselbe wie
die benannten Layouts. Alles wird ausschließlich im Browser
gespeichert. Es wird **keine Verbindung** zur privaten PostgreSQL-API
hergestellt. Browserdaten können gelöscht werden, ohne dass das
echte Atlas-Projekt verändert wird.
