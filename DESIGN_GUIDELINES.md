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
