/* Lettore di disegni · MVP cartone · base v2 (A4)
   Misure in millimetri, origine nell'angolo in alto a sinistra della base.
   Le usano l'app (index.html), lo schema (schema.html) e il modello da stampare (modello.html):
   se cambi una misura qui, ristampa il modello.

   Conti:
     colonna pulsanti 70 + spazio 10 + foglio/matrice 297 = 377 mm di larghezza
     foglio A4 210 + spazio 20 + matrice 95             = 325 mm = altezza della colonna
     intorno 60 mm di margine per i marker  ->  base 497 x 445 mm */
var LAYOUT = {
  version: 2,
  board: { w: 497, h: 445 },
  content: { x: 60, y: 60, w: 377, h: 325 },

  /* Marker ArUco (dizionario ARUCO_MIP_36h12), lato del quadrato nero = size.
     Ognuno sta in diagonale, a 30 mm dall'angolo della zona di gioco. */
  markers: [
    { id: 0, x: 30,  y: 30,  size: 40, name: 'in alto a sinistra' },
    { id: 1, x: 467, y: 30,  size: 40, name: 'in alto a destra' },
    { id: 2, x: 467, y: 415, size: 40, name: 'in basso a destra' },
    { id: 3, x: 30,  y: 415, size: 40, name: 'in basso a sinistra' }
  ],

  /* Colonna dei pulsanti a sinistra, 70 x 325 */
  panel: { x: 60, y: 60, w: 70, h: 325 },

  /* Foglio A4 orizzontale in alto a destra, 297 x 210 */
  sheet: { x: 140, y: 60, w: 297, h: 210 },
  /* Parte del foglio che suona: 6 mm di margine su ogni lato, per non leggere il bordo della carta */
  read: { x: 146, y: 66, w: 285, h: 198 },

  /* Matrice percussioni sotto il foglio, cartoncino 297 x 95.
     La griglia 4 x 16 ha le stesse colonne del foglio, cosi la barra del tempo e la stessa. */
  matrixCard: { x: 140, y: 290, w: 297, h: 95 },
  matrix: { x: 146, y: 296, w: 285, h: 83, rows: 4, cols: 16 },
  /* Righe dall'alto, nello stesso ordine della striscia disegnata: cerchio, triangolo, rombo, rettangolo */
  drums: [
    { key: 'kick',  name: 'Cassa',      short: 'CA', shape: 'circle' },
    { key: 'clap',  name: 'Battimani',  short: 'BM', shape: 'tri' },
    { key: 'hat',   name: 'Charleston', short: 'CH', shape: 'diamond' },
    { key: 'snare', name: 'Rullante',   short: 'RU', shape: 'rect' }
  ],

  instruments: [
    { key: 'flute',  name: 'Flauto',   color: '#16975A', label: 'verde' },
    { key: 'violin', name: 'Violino',  color: '#E8B90C', label: 'giallo' },
    { key: 'piano',  name: 'Piano',    color: '#1D4ED8', label: 'blu' },
    { key: 'guitar', name: 'Chitarra', color: '#E0322A', label: 'rosso' },
    { key: 'bass',   name: 'Basso',    color: '#111111', label: 'nero' }
  ],

  /* I 3 comandi nella colonna: dito sul cerchio = premi, disco girevole = manopola */
  pads: {
    /* dal basso: START · STOP, poi RESTART (stessa misura), in alto la manopola SPEED */
    play:    { x: 95, y: 335, r: 24, name: 'START · STOP' },
    restart: { x: 95, y: 245, r: 24, name: 'RESTART' }
  },
  knobs: {
    speed:   { x: 95, y: 130, r: 24, dot: 16, name: 'SPEED' }
  },

  /* Scale (si scelgono dal computer), da usare con la manopola in futuro */
  scales: [
    { name: 'Sole',       color: '#F2A900', steps: [0, 2, 4, 7, 9] },
    { name: 'Luna',       color: '#5B5BD6', steps: [0, 3, 5, 7, 10] },
    { name: 'Arcobaleno', color: '#E0322A', steps: [0, 2, 4, 5, 7, 9, 11] },
    { name: 'Pioggia',    color: '#2A8FBF', steps: [0, 2, 3, 5, 7, 8, 10] },
    { name: 'Libero',     color: '#777777', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
  ],
  transposeRange: 6,
  speedRange: [50, 160]     /* battiti al minuto, manopola da -135° (lento) a +135° (veloce) */
};
LAYOUT.matrix.rowY = function (i) { return LAYOUT.matrix.y + (i + 0.5) * LAYOUT.matrix.h / LAYOUT.matrix.rows; };
LAYOUT.matrix.colX = function (j) { return LAYOUT.matrix.x + (j + 0.5) * LAYOUT.matrix.w / LAYOUT.matrix.cols; };
