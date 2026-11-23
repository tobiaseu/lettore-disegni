# Lettore di disegni

Web app per il prototipo in cartone del lettore di disegni musicale (Design by Components, PoliTo 2026-27, gruppo 6).

La fotocamera del telefono (o di un computer che usa il telefono come webcam) guarda la base dall'alto, raddrizza l'immagine grazie a 4 marker ArUco e suona in tempo reale il foglio A3 e la matrice percussioni 4×16.

- **App**: https://tobiaseu.github.io/lettore-disegni/
- **Modello da stampare (A3, al 100%)**: [modello-A3.pdf](modello-A3.pdf) · sorgente [modello.html](modello.html)
- **Misure della base**: tutte in [layout.js](layout.js). Se cambi una misura, ristampa il modello.

## Regole
Altezza = nota (61 tasti Do2–Do7, oppure 8 note per la scheda 1). Colore = strumento: nero basso, blu piano, rosso chitarra, giallo violino, verde flauto. Matrice: charleston, battimani, rullante, cassa.

## Comandi
PLAY/STOP, GIRO/1 VOLTA, REC, velocità, trasporta, scala, muto per colore e per riga. Si comandano dalla camera (dito sui cerchi, tappi sui mute, dischi con pallino nero), dalla tastiera o con Makey Makey (Spazio, W, A, frecce, S, 1–9) oppure sullo schermo.

Rilevamento marker: [js-aruco2](https://github.com/damianofalcioni/js-aruco2) (MIT), in `vendor/`.
