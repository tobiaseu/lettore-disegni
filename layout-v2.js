/* Lettore di disegni · versione 2 (interfaccia del workshop, base in cartone)
   Misure in millimetri, origine nell'angolo in alto a sinistra della base.

   Moduli (dati da Tobia):
     colonna comandi 70 x 325 · foglio A4 orizzontale 297 x 210 · matrice 297 x 95 (20 mm sotto il foglio)
   Aggiunto in v2: un binario dei muti largo 36 mm sul lato dove comincia il tempo (sinistra del foglio
   e della matrice). In alto 5 muti colore (ordinati per registro: flauto in alto, basso in basso),
   in basso 4 muti percussioni allineati alle righe della matrice.

   Mano:  'right' (destrimano) = colonna comandi a DESTRA, la mano che disegna non passa sopra il foglio
          'left'  (mancino)    = colonna comandi a SINISTRA
   Il tempo va sempre da sinistra a destra, quindi il binario dei muti resta sempre a sinistra del foglio.

   Conti (destrimano):
     binario 36 + foglio 297 + spazio 10 + colonna 70 = 413 mm
     foglio 210 + spazio 20 + matrice 95             = 325 mm = altezza della colonna
     margine 60 mm per i marker                       ->  base 533 x 445 mm */
function LAYOUT_V2(hand) {
  hand = hand == 'left' ? 'left' : 'right';
  var M = 60, RAIL = 36, COL = 70, GAP = 10, BW = M * 2 + RAIL + 297 + GAP + COL, BH = 445;
  var colX = hand == 'right' ? M + RAIL + 297 + GAP : M;
  var railX = hand == 'right' ? M : M + COL + GAP;
  var sx = railX + RAIL, top = M;
  var L = {
    version: 'v2', hand: hand,
    board: { w: BW, h: BH },
    content: { x: M, y: M, w: BW - 2 * M, h: 325 },
    markers: [
      { id: 0, x: 30, y: 30, size: 40, name: 'in alto a sinistra' },
      { id: 1, x: BW - 30, y: 30, size: 40, name: 'in alto a destra' },
      { id: 2, x: BW - 30, y: BH - 30, size: 40, name: 'in basso a destra' },
      { id: 3, x: 30, y: BH - 30, size: 40, name: 'in basso a sinistra' }
    ],
    panel: { x: colX, y: top, w: COL, h: 325 },
    rail: { x: railX, y: top, w: RAIL, h: 325 },
    sheet: { x: sx, y: top, w: 297, h: 210 },
    read: { x: sx + 6, y: top + 6, w: 285, h: 198 },
    matrixBase: { x: railX, y: top + 230, w: RAIL + 297, h: 95 },
    matrixCard: { x: sx, y: top + 230, w: 297, h: 95 },
    matrix: { x: sx + 6, y: top + 236, w: 285, h: 83, rows: 4, cols: 16 },
    pads: {
      play:    { x: colX + COL / 2, y: top + 270, r: 27, name: 'START · STOP' },
      restart: { x: colX + COL / 2, y: top + 180, r: 27, name: 'RESTART' }
    },
    knobs: { speed: { x: colX + COL / 2, y: top + 72, r: 27, dot: 18, name: 'SPEED' } },
    speedRange: [50, 160], transposeRange: 6
  };
  /* copio da layout.js quello che non cambia */
  ['drums', 'instruments', 'scales'].forEach(function (k) { L[k] = LAYOUT[k]; });
  L.matrix.rowY = function (i) { return L.matrix.y + (i + 0.5) * L.matrix.h / L.matrix.rows; };
  L.matrix.colX = function (j) { return L.matrix.x + (j + 0.5) * L.matrix.w / L.matrix.cols; };
  /* muti colore: un bottone per strumento, dall'alto in basso per registro (flauto ... basso) */
  L.muteC = L.instruments.map(function (ins, i) { return { i: i, x: railX + RAIL / 2, y: top + 210 * (i + 0.5) / 5, r: 10 }; });
  /* muti percussioni: allineati alle righe della matrice */
  L.muteD = L.drums.map(function (d, i) { return { i: i, x: railX + RAIL - 11, y: L.matrix.rowY(i), r: 7, icon: { x: railX + 9, y: L.matrix.rowY(i) } }; });
  return L;
}
