# Lettore di disegni

Web app per il prototipo in cartone del lettore di disegni musicale (Design by Components, PoliTo 2026-27, gruppo 6).

La fotocamera del telefono (o di un computer che usa il telefono come webcam) guarda la base dall'alto, raddrizza l'immagine grazie a 4 marker ArUco e suona in tempo reale il foglio A3 e la matrice percussioni 4×16.

- **App**: https://tobiaseu.github.io/lettore-disegni/
- **Modello da stampare (A3, al 100%)**: [modello-A3.pdf](modello-A3.pdf) · sorgente [modello.html](modello.html)
- **Cosa legge la camera**: [schema.html](https://tobiaseu.github.io/lettore-disegni/schema.html)
- **Misure della base**: tutte in [layout.js](layout.js). Se cambi una misura, ristampa il modello.

## Base v2
Colonna comandi 70 × 325 a sinistra, foglio A4 orizzontale 297 × 210 in alto a destra, matrice 297 × 95 sotto (20 mm di spazio), 4 marker ArUco agli angoli. Base 497 × 445.

## Regole
Altezza = nota (di base 3 ottave Do3–Do6, scala pentatonica; si cambia dal computer). Colore = strumento: nero basso, blu piano, rosso chitarra, giallo violino, verde flauto. Matrice: charleston, battimani, rullante, cassa.

## Comandi
Sulla base: START · STOP e RESTART (dito sul cerchio), SPEED (disco girevole con pallino nero). Sul computer: volume, giro/una volta, REC, trasporta, scala, muto. Tastiera o Makey Makey: Spazio start/stop, R restart, frecce su/giù velocità.

Rilevamento marker: [js-aruco2](https://github.com/damianofalcioni/js-aruco2) (MIT), in `vendor/`.
