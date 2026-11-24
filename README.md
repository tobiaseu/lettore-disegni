# Lettore di disegni

Web app per il prototipo in cartone del lettore di disegni musicale (Design by Components, PoliTo 2026-27, gruppo 6).

La fotocamera del telefono (o di un computer che usa il telefono come webcam) guarda la base dall'alto, raddrizza l'immagine grazie a 4 marker ArUco e suona in tempo reale il foglio A3 e la matrice percussioni 4×16.

- **App v1**: https://tobiaseu.github.io/lettore-disegni/
- **App v2 · interfaccia del workshop**: https://tobiaseu.github.io/lettore-disegni/v2.html (misure in [layout-v2.js](layout-v2.js))
- **Modello da stampare (A3, al 100%)**: [modello-A3.pdf](modello-A3.pdf) · sorgente [modello.html](modello.html)
- **Cosa legge la camera**: [schema.html](https://tobiaseu.github.io/lettore-disegni/schema.html)
- **Misure della base**: tutte in [layout.js](layout.js). Se cambi una misura, ristampa il modello.

## Versione 2 (workshop)
Pagina separata [v2.html](v2.html). A sinistra la visione del computer (camera, zone lette, dati tecnici, registro eventi), a destra il prototipo in cartone interattivo, sotto le funzioni del prototipo e le funzioni secondarie.
- Base 533 × 445: colonna comandi 70 × 325 (SPEED in alto, RESTART, START · STOP in basso), foglio A4, base della matrice alta 95 con dentro la matrice stampata 297 × 74,25, e un binario dei muti largo 36 mm a sinistra del foglio.
- Muti: sportellini che coprono un bollino colorato (5 colori, in ordine di altezza) o nero (4 percussioni, accanto alla loro riga). Aperto = suona, chiuso = muto. La camera li legge.
- Destrimano: comandi a destra. Mancino: comandi a sinistra. I marker restano negli stessi posti.
- Matrice stampata (modello in PDF): striscia di A4 alta 74,25 mm, 16 × 4 caselle quadrate da 18,56 mm, righe dall'alto cerchio (cassa), triangolo (battimani), rombo (charleston), rettangolo (rullante), forme tratteggiate e una barra ogni 4 passi. Una forma colorata di nero suona. Il programma aggancia il modello sulla foto (anche se la striscia è capovolta o spostata di qualche mm) e guarda solo l'interno di ogni forma: un tratto o uno scarabocchio dentro non basta, serve colorarla almeno per metà circa. Con una striscia disegnata a mano (con la legenda) usa la lettura a macchie qui sotto.
- Lettura della matrice (base e striscia, stesso motore): la matrice viene raddrizzata, le ombre morbide si tolgono dividendo per il bianco della carta vicino, le righe della griglia vengono "ricucite" e ogni macchia vale un solo colpo nella casella dove cade il suo centro (un simbolo che sborda non diventa 2 o 3 colpi). Le macchie enormi (mano, ombra netta) lasciano ferme solo le caselle che coprono, che si vedono grigie. Ogni casella cambia solo se lo vede per 2 letture di fila. Camera e cartone mostrano lo stesso stato confermato; un cerchio tratteggiato sulla camera vuol dire "visto, in conferma".

## Base v1
Colonna comandi 70 × 325 a sinistra, foglio A4 orizzontale 297 × 210 in alto a destra, matrice 297 × 95 sotto (20 mm di spazio), 4 marker ArUco agli angoli. Base 497 × 445.

## Regole
Altezza = nota (di base 3 ottave per strumento, contate sul pianoforte a 88 tasti: basso Do1–Do4, chitarra e piano Do3–Do6, flauto e violino Do4–Do7; scala pentatonica; si cambia dal computer). Colore = strumento: nero basso, blu piano, rosso chitarra, giallo violino, verde flauto. Matrice, righe dall'alto: cassa (cerchio), battimani (triangolo), charleston (rombo), rullante (rettangolo).

## Prova veloce: foglio A4 + matrice (senza base né marker)
Il programma trova da solo il foglio A4 e la matrice dai loro bordi (retta su 28 punti per lato, a piena risoluzione). Il foglio A4 viene letto come 297 × 210. La matrice stampata si riconosce dalle proporzioni 4:1 (297 × 74,25) ed è divisa esattamente in 16 × 4 dai suoi bordi; dal modello si prende solo il verso (dritta o capovolta). Nella v2 ci sono tre pulsanti: Cerca tutti e due, Solo A4, Solo matrice. Se uno dei due è già agganciato si può ricercare solo l'altro, e ciascuno suona anche da solo.
Vale ancora anche la striscia disegnata a mano con la griglia 4 × 16 e la legenda:
- La prima casella di ogni riga è la legenda e non suona: il simbolo lì dice il suono della riga (cerchio = cassa, triangolo = battimani, rombo = charleston, rettangolo = rullante).
- Ogni simbolo nero nella griglia suona il suono della sua riga. Il tempo parte dal lato della legenda, insieme al foglio.
- Sul foglio, una linea continua storta suona come un glissando (l'altezza scivola senza fermarsi sui tasti). Punti, trattini e linee piatte suonano come prima.
- Funziona meglio su un fondo più scuro della carta e opaco (cartone, legno). Su un tavolo chiaro e lucido trova lo stesso la striscia dai bordi, ma serve più luce uniforme.

## Comandi
Sulla base: START · STOP e RESTART (dito sul cerchio), SPEED (disco girevole con pallino nero). Sul computer: volume, giro/una volta, REC, trasporta, scala, muto. Tastiera o Makey Makey: Spazio start/stop, R restart, frecce su/giù velocità.

Rilevamento marker: [js-aruco2](https://github.com/damianofalcioni/js-aruco2) (MIT), in `vendor/`.
