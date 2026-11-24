/* Lettore di disegni · versione 4 (fogli piccoli su tappetino da taglio verde)
   Misure in millimetri, origine nell'angolo in alto a sinistra del tappetino.

   Com'è sul tavolo di Tobia (foto del 24 Nov 2026):
     tappetino da taglio verde A4 in verticale (220 x 300), niente base in cartone e niente marker
     in alto la matrice (striscia larga come il foglio, 210 x 52,5 = 4:1, 16 x 4 caselle quadrate da 13,1 mm)
     sotto il foglio A5 orizzontale 210 x 148
   La camera trova i due fogli dai loro bordi bianchi sul verde, quindi non serve che siano precisi:
   possono essere un po' storti, spostati o tagliati a mano.

   Nel gemello sullo schermo i comandi (START · STOP, RESTART, SPEED e i muti) stanno in una colonna accanto
   al tappetino. Sono comandi sullo schermo: in questa versione la camera non li legge. */
function LAYOUT_V4(hand) {
  hand = hand == 'left' ? 'left' : 'right';
  /* tappetino 220 x 300; i comandi sullo schermo stanno in una colonna FUORI dal tappetino, dal lato della mano forte,
     così il gemello resta largo quanto basta e il tappetino è come quello vero */
  var MW = 220, MH = 300, COLW = 80, GAP = 8, right = hand == 'right';
  var OX = right ? 0 : COLW + GAP, SX = OX + 5, MY = 12, MATH = 52.5, shY = MY + MATH + 8;
  var CX = right ? MW + GAP : 0, cc = CX + COLW / 2;
  var L = {
    version: 'v4', hand: hand,
    board: { w: MW + GAP + COLW, h: MH },
    content: { x: SX, y: MY, w: 210, h: 148 + MATH + 8 },
    markers: [],
    mat: { x: OX, y: 0, w: MW, h: MH },
    sheet: { x: SX, y: shY, w: 210, h: 148 },
    read: { x: SX + 4, y: shY + 4, w: 202, h: 140 },
    matrixCard: { x: SX, y: MY, w: 210, h: MATH },
    matrix: { x: SX, y: MY, w: 210, h: MATH, rows: 4, cols: 16 },
    controls: { x: CX, y: MY, w: COLW, h: MH - 2 * MY },
    /* nomi della v2 che alcune funzioni comuni cercano */
    panel: { x: CX, y: MY, w: COLW, h: MH - 2 * MY },
    rail: { x: CX, y: 180, w: COLW, h: MH - MY - 180 },
    matrixBase: { x: SX, y: MY, w: 210, h: MATH },
    pads: {
      restart: { x: cc, y: 104, r: 15, name: 'RESTART' },
      play:    { x: cc, y: 152, r: 15, name: 'START · STOP' }
    },
    knobs: { speed: { x: cc, y: 50, r: 17, dot: 11, name: 'SPEED' } },
    speedRange: [50, 480], transposeRange: 6
  };
  ['drums', 'instruments', 'scales'].forEach(function (k) { L[k] = LAYOUT[k]; });
  L.matrix.rowY = function (i) { return L.matrix.y + (i + 0.5) * L.matrix.h / L.matrix.rows; };
  L.matrix.colX = function (j) { return L.matrix.x + (j + 0.5) * L.matrix.w / L.matrix.cols; };
  /* muti: colori a sinistra (dall'acuto in alto al grave in basso, come sul foglio), percussioni a destra (come le righe della matrice) */
  L.muteC = L.instruments.map(function (ins, i) { return { i: i, x: cc - 17, y: 196 + i * 19, r: 6 }; });
  L.muteD = L.drums.map(function (d, i) { return { i: i, x: cc + 17, y: 205 + i * 19, r: 6, icon: { x: cc + 17, y: 205 + i * 19 } }; });
  return L;
}
