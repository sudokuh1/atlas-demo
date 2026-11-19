# Project Atlas – Gestaltungsgrundsätze

Status: verbindliche Arbeitsregel für Code, Dokumentation und Benutzeroberfläche.
Das endgültige Designsystem und die konkrete Komponentenbibliothek sind noch nicht gewählt.

## Symbole und Bildsprache

- **Keine Emojis** als UI-Symbole, Statusmarker, Platzhalter oder Dekoration.
- Ebenso keine Emojis in Dokumentation, Beispieldaten, Quelltext-Kommentaren oder generierten Projektdaten.
- Stattdessen werden lokal eingebundene, konsistente SVG-Icons verwendet. Für Spiel- und Architekturmodule kommen bei Bedarf eigens erstellte Pixel-Icons infrage.
- Einheitlicher Stil, Strichstärke, Raster, Größe, Kontrast und semantische Bedeutung.
- Icons benötigen verständliche Beschriftungen oder barrierefreie Alternativtexte; ein Icon allein darf keine sicherheits- oder statusrelevante Information tragen.
- Keine Laufzeitabhängigkeit von extern geladenen Icon-Diensten. Vor Übernahme einer Bibliothek Lizenz und Herkunft prüfen.

## Oberfläche

- Ein produktiv-nüchterner Editor statt dekorativem Dashboard: Projektliste/Navigation links, Canvas als Hauptfläche, Inspektor rechts.
- Gut unterscheidbare Hierarchie, klare Abstände, sparsame Akzentfarben, lesbare Typografie.
- Keine unnötigen Farbverläufe, übermäßige Schatten, Glaseffekte oder wahllos gemischten Komponentenstile.
- Funktion, Bedienbarkeit, Nachvollziehbarkeit und Barrierefreiheit haben Vorrang vor kosmetischer Ausarbeitung.
- Dark/Light-Mode und mobile Bedienung berücksichtigen, aber keinen unaufgeforderten Komplettumbau vornehmen.
- Bestehende Demo-Emojis werden bei der nächsten gezielten UI-Aktualisierung durch SVG-Icons ersetzt; keine neuen Emojis hinzufügen.

## Noch offen

Für die vorläufige UI kommen als Referenz shadcn/ui Dashboard/Sidebar, Mantine UI und Tabler infrage. Wir übernehmen keine komplette Designvorlage ohne Entscheidung und Lizenzprüfung.

## Freier Canvas und Interaktionsschutz

Die Kamera (Pan/Zoom/Focus/Fit) ist ein eigenständiger, reiner
Darstellungsadapter und darf niemals Modul-IDs, Beziehungen, Aufgaben
oder Diagrammpositionen allein wegen einer Kameraänderung neu
speichern. Es gibt keine feste Canvas-Grenze; auch negative
Weltkoordinaten sind zulässig.

Die Interaktion unterscheidet ausdrücklich zwischen
**Navigation** (immer zugänglich) und **Modulbearbeitung**
(nur nach Entsperren). Im gesperrten Modus dürfen weder Dragging
noch Richtungssteuerung Layoutpositionen verändern. Beim
Projekt-/Ansichtswechsel wird die Bearbeitung wieder gesperrt.
Eine gewählte Layoutstruktur ist keine verpflichtende Baum- oder
Pyramidenform. Der Fit-Befehl berücksichtigt aktuelle Koordinaten.

## Entwicklungs- und Projektzeitstrahl

Projektverlauf ist eine eigenständige Projektdomäne, **kein**
Canvas-Graph und keine automatisch erzeugte Git-Commit-Liste.
Titel, Ziel, Ergebnis, Problem, Lösung und Nachweise sind Datenfelder;
das Layout kennt diese Felder nur als Darstellung.

Die Timeline-UI verwendet dieselben Daten auf Desktop und Mobil,
ordnet sie aber am Desktop horizontal und auf kleinen Bildschirmen
vertikal an. Längere Berichte sind aufklappbar; Status und Ziele
bleiben ohne Interaktion sichtbar. Geplante Schritte haben klaren
Status, aber keine fingierte Umsetzung oder Datierung.

Die kuratierte öffentliche Atlas-MVP-Roadmap ist ausdrücklich als
Momentaufnahme gekennzeichnet. Eine echte auditierbare Historie
benötigt später serverseitige Ereignisse, Zeitbelege und Revisionsschutz.
