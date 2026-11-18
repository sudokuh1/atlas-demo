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
