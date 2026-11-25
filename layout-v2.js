/* Lettore di disegni · versione 2 (interfaccia del workshop, base in cartone)
   Misure in millimetri, origine nell'angolo in alto a sinistra della base.

   Moduli (dati da Tobia):
     colonna comandi 70 x 325 · foglio A4 orizzontale 297 x 210 · base matrice 95 mm (20 mm sotto il foglio)
     con dentro la matrice stampata: striscia di A4 alta 74,25 mm, 16 x 4 caselle quadrate da 18,56 mm
   Aggiunto in v2: un binario dei muti largo 36 mm sul lato dove comincia il tempo (sinistra del foglio
   e della matrice). In alto 5 muti colore (ordinati per registro: flauto in alto, basso in basso),
   in basso 4 muti percussioni allineati alle righe della matrice.

   Mano:  'right' (destrimano) = colonna comandi a DESTRA, la mano che disegna non passa sopra il foglio
          'left'  (mancino)    = colonna comandi a SINISTRA
   Il tempo va sempre da sinistra a destra, quindi il binario dei muti resta sempre a sinistra del foglio.

   Conti (destrimano):
     binario 36 + foglio 297 + spazio 10 + colonna 70 = 413 mm
     foglio 210 + spazio 20 + matrice 95             = 325 mm = altezza della colonna
     margine 60 mm per i marker                       ->  base 533 x 445 mm (base vecchia, fino al 25 Nov)

   25 Nov 2026 · base nuova di Tobia (quella vera, in cartone con angoli neri, senza binario dei muti):
     dall'alto (lato della camera): matrice stampata 297 x 74,25 · foglio A4 orizzontale 297 x 210 · pulsantiera.
     La camera guarda dal lato della matrice, i bambini stanno dal lato della pulsantiera: nell'immagine tutto è
     girato di 180° e il programma lo raddrizza da solo (la matrice deve stare "sopra" il foglio).
     striscia comandi: START · STOP e RESTART (quadrati 58 mm con cornice nera) dal lato dove comincia
     il tempo, SPEED (disco con un pallino nero a 3/4 del raggio) dall'altro lato.
     Mano: 'right' = SPEED a destra (come nella foto), 'left' = SPEED a sinistra, pulsanti a destra.
     Spazi tra i pezzi 15 mm (gli angoli neri), margine 50 mm. I muti restano sullo schermo. */

function LAYOUT_V2(hand) {
  hand = hand == 'left' ? 'left' : 'right';
  /* misure prese dalla foto della camera di Tobia (25 Nov, 18:01): matrice a 40 mm dal foglio, comandi a ~38 mm dal
     bordo del foglio, pulsanti neri 45 mm con icone bianche, SPEED disco nero da 34 mm con segno bianco */
  /* misurate sulla foto riproiettata nel piano del foglio: matrice 41 mm sopra il foglio, pulsantiera da 25 a 82 mm sotto,
     START · STOP al centro x 40, RESTART x 96 (quadrati ~48 mm), SPEED x 278 (disco r 18,5) */
  var M = 40, GAPM = 41, GAPC = 25, MATH = 74.25, CTLH = 57, BW = M * 2 + 297, BH = M * 2 + MATH + GAPM + 210 + GAPC + CTLH;
  var sx = M, my = M, sy = my + MATH + GAPM, cy = sy + 210 + GAPC;
  var PS = 48, padY = sy + 210 + 53, R = hand == 'right';
  var xPlay = R ? sx + 40 : sx + 297 - 40, xRestart = R ? sx + 96 : sx + 297 - 96, xSpeed = R ? sx + 278 : sx + 297 - 278;
  var L = {
    version: 'v2', hand: hand,
    board: { w: BW, h: BH },
    content: { x: M, y: M, w: 297, h: BH - 2 * M },
    markers: [
      { id: 0, x: 20, y: 20, size: 30, name: 'in alto a sinistra' },
      { id: 1, x: BW - 20, y: 20, size: 30, name: 'in alto a destra' },
      { id: 2, x: BW - 20, y: BH - 20, size: 30, name: 'in basso a destra' },
      { id: 3, x: 20, y: BH - 20, size: 30, name: 'in basso a sinistra' }
    ],
    panel: { x: sx, y: cy, w: 297, h: CTLH },
    rail: null,
    sheet: { x: sx, y: sy, w: 297, h: 210 },
    read: { x: sx + 6, y: sy + 6, w: 285, h: 198 },
    matrixBase: { x: sx, y: my, w: 297, h: MATH },
    matrixCard: { x: sx, y: my, w: 297, h: MATH },
    matrix: { x: sx, y: my, w: 297, h: MATH, rows: 4, cols: 16 },
    pads: {
      play:    { x: xPlay, y: padY, r: 20, size: PS, name: 'START · STOP' },
      restart: { x: xRestart, y: padY, r: 20, size: PS, name: 'RESTART' }
    },
    knobs: { speed: { x: xSpeed, y: sy + 210 + 60, r: 18.5, dot: 13.9, name: 'SPEED' } },
    speedRange: [60, 240], transposeRange: 6
  };
  /* copio da layout.js quello che non cambia */
  ['drums', 'instruments', 'scales'].forEach(function (k) { L[k] = LAYOUT[k]; });
  L.matrix.rowY = function (i) { return L.matrix.y + (i + 0.5) * L.matrix.h / L.matrix.rows; };
  L.matrix.colX = function (j) { return L.matrix.x + (j + 0.5) * L.matrix.w / L.matrix.cols; };
  /* niente binario dei muti sulla base nuova: i muti si comandano dallo schermo */
  L.muteC = []; L.muteD = [];
  return L;
}
