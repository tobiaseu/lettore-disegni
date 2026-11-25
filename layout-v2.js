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
     dall'alto: matrice stampata 297 x 74,25 · foglio A4 orizzontale 297 x 210 · striscia comandi 297 x 75
     striscia comandi: START · STOP e RESTART (quadrati 58 mm con cornice nera) dal lato dove comincia
     il tempo, SPEED (disco con un pallino nero a 3/4 del raggio) dall'altro lato.
     Mano: 'right' = SPEED a destra (come nella foto), 'left' = SPEED a sinistra, pulsanti a destra.
     Spazi tra i pezzi 15 mm (gli angoli neri), margine 50 mm. I muti restano sullo schermo. */

function LAYOUT_V2(hand) {
  hand = hand == 'left' ? 'left' : 'right';
  var M = 50, GAP = 15, MATH = 74.25, CTLH = 75, BW = M * 2 + 297, BH = M * 2 + MATH + GAP + 210 + GAP + CTLH;
  var sx = M, my = M, sy = my + MATH + GAP, cy = sy + 210 + GAP;
  var PS = 58, padY = cy + CTLH / 2, R = hand == 'right';
  var xPlay = R ? sx + 8 + PS / 2 : sx + 297 - 8 - PS / 2, xRestart = R ? xPlay + PS + 10 : xPlay - PS - 10, xSpeed = R ? sx + 297 - 42 : sx + 42;
  var L = {
    version: 'v2', hand: hand,
    board: { w: BW, h: BH },
    content: { x: M, y: M, w: 297, h: BH - 2 * M },
    markers: [
      { id: 0, x: 24, y: 24, size: 34, name: 'in alto a sinistra' },
      { id: 1, x: BW - 24, y: 24, size: 34, name: 'in alto a destra' },
      { id: 2, x: BW - 24, y: BH - 24, size: 34, name: 'in basso a destra' },
      { id: 3, x: 24, y: BH - 24, size: 34, name: 'in basso a sinistra' }
    ],
    panel: { x: sx, y: cy, w: 297, h: CTLH },
    rail: null,
    sheet: { x: sx, y: sy, w: 297, h: 210 },
    read: { x: sx + 6, y: sy + 6, w: 285, h: 198 },
    matrixBase: { x: sx, y: my, w: 297, h: MATH },
    matrixCard: { x: sx, y: my, w: 297, h: MATH },
    matrix: { x: sx, y: my, w: 297, h: MATH, rows: 4, cols: 16 },
    pads: {
      play:    { x: xPlay, y: padY, r: 27, size: PS, name: 'START · STOP' },
      restart: { x: xRestart, y: padY, r: 27, size: PS, name: 'RESTART' }
    },
    knobs: { speed: { x: xSpeed, y: padY, r: 30, dot: 22.5, name: 'SPEED' } },
    speedRange: [50, 480], transposeRange: 6
  };
  /* copio da layout.js quello che non cambia */
  ['drums', 'instruments', 'scales'].forEach(function (k) { L[k] = LAYOUT[k]; });
  L.matrix.rowY = function (i) { return L.matrix.y + (i + 0.5) * L.matrix.h / L.matrix.rows; };
  L.matrix.colX = function (j) { return L.matrix.x + (j + 0.5) * L.matrix.w / L.matrix.cols; };
  /* niente binario dei muti sulla base nuova: i muti si comandano dallo schermo */
  L.muteC = []; L.muteD = [];
  return L;
}
