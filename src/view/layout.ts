export const MAX_CELL = 200;
export const DESIGN = { width: 1600, height: 900 };
const PORTRAIT_AT = 1.25;
const FLOOR = 0.755;
const MARGIN = 20;
const GAP = 40;
const MESSAGE_GAP = 40;
const HUD_GAP = 40;
const HUD_ROW = 125;
const SPIN_BLOCK = 360;
const SPIN_TOP = 92;
const METERS_ROOM = 190;
const LOGO_HEIGHT = { landscape: 170, portrait: 230 };
const SPLASH_LOGO_HEIGHT = { landscape: 170, portrait: 260 };
const LOGO_GAP = 10;
const LOGO_LIFT = 60;
const SIDE = 8;
const PORTRAIT_GAP = 10;
const PORTRAIT_SPLASH = 900;

export type Orientation = 'landscape' | 'portrait';

export interface LayoutInput {
  reels: number;
  rows: number;
  character: { x: number; y: number; width: number; height: number };
  pad: number;
}

export function sceneFor(width: number, height: number, input: LayoutInput) {
  const orientation: Orientation = height >= width * PORTRAIT_AT ? 'portrait' : 'landscape';
  if (orientation === 'landscape') return { orientation, size: DESIGN };
  const needed = 2 * MARGIN + LOGO_LIFT + LOGO_HEIGHT.portrait + LOGO_GAP
    + (input.rows + 2 * input.pad) * portraitCell(input) + 2 * MESSAGE_GAP + SPIN_BLOCK + METERS_ROOM;
  return { orientation, size: { width: DESIGN.height, height: Math.max(needed, Math.round((DESIGN.height * height) / width)) } };
}

function portraitCell({ reels, rows, pad, character }: LayoutInput) {
  const aspect = character.width / character.height;
  return Math.floor(Math.min(MAX_CELL, (DESIGN.height - 2 * SIDE - PORTRAIT_GAP) / (reels + 2 * pad + aspect * (rows + 2 * pad))));
}

export function layoutFor(orientation: Orientation, size: { width: number; height: number }, input: LayoutInput) {
  const { reels, rows, character: c } = input;
  const D = size;
  let cell: number, boardX: number, boardY: number, fit: number, feet: number, hudTop: number, metersY = 0;
  let logo: { x: number; y: number; width: number };
  let splash: { top: number; bottom: number; dotsY: number };
  if (orientation === 'landscape') {
    const below = MESSAGE_GAP + HUD_GAP + HUD_ROW;
    cell = Math.floor(Math.min(MAX_CELL,
      (D.width - 2 * MARGIN - c.width - GAP) / (reels + 2 * input.pad), (D.height - 2 * MARGIN - below) / (rows + 2 * input.pad)));
    const pad = input.pad * cell;
    boardY = (D.height - (2 * pad + rows * cell + below)) / 2 + pad;
    feet = FLOOR * D.height;
    fit = Math.min(1, (feet - (boardY - pad) - LOGO_HEIGHT.landscape - LOGO_GAP) / c.height);
    const left = (D.width - (c.width * fit + GAP + reels * cell + 2 * pad)) / 2;
    boardX = left + c.width * fit + GAP + pad;
    logo = { x: left + (c.width * fit) / 2, y: boardY - pad + LOGO_HEIGHT.landscape / 2, width: c.width * fit + GAP };
    const messageY = boardY + rows * cell + pad + MESSAGE_GAP;
    hudTop = messageY + HUD_GAP;
    splash = { top: MARGIN, bottom: messageY - MESSAGE_GAP / 2, dotsY: messageY };
  } else {
    cell = portraitCell(input);
    const pad = input.pad * cell;
    const frameHeight = rows * cell + 2 * pad;
    fit = frameHeight / c.height;
    hudTop = D.height - MARGIN - SPIN_BLOCK;
    const group = LOGO_HEIGHT.portrait + LOGO_GAP + frameHeight + 2 * MESSAGE_GAP;
    const top = MARGIN + (hudTop - METERS_ROOM - MARGIN - group) / 2;
    boardY = top + LOGO_HEIGHT.portrait + LOGO_GAP + pad;
    boardX = (D.width - (c.width * fit + PORTRAIT_GAP + reels * cell + 2 * pad)) / 2 + c.width * fit + PORTRAIT_GAP + pad;
    logo = { x: D.width / 2, y: Math.max(MARGIN, top - LOGO_LIFT) + LOGO_HEIGHT.portrait / 2, width: D.width - 2 * MARGIN };
    feet = boardY + rows * cell + pad;
    metersY = (feet + 2 * MESSAGE_GAP + hudTop) / 2;
    const spinTop = hudTop + SPIN_TOP;
    splash = { top: spinTop - 2 * MESSAGE_GAP - PORTRAIT_SPLASH, bottom: spinTop - 2 * MESSAGE_GAP, dotsY: spinTop - MESSAGE_GAP };
  }
  const pad = input.pad * cell;
  return {
    cell, feet, hudTop, metersY,
    board: { x: boardX, y: boardY, frameWidth: reels * cell + 2 * pad },
    message: { x: D.width / 2, y: boardY + rows * cell + pad + MESSAGE_GAP },
    centre: { x: D.width / 2, y: D.height / 2 },
    character: { x: boardX - pad - (orientation === 'landscape' ? GAP : PORTRAIT_GAP) - (c.x + c.width) * fit, y: feet - (c.y + c.height) * fit, scale: fit },
    logo: { ...logo, height: LOGO_HEIGHT[orientation] },
    splash: { width: D.width, ...splash, logoHeight: SPLASH_LOGO_HEIGHT[orientation] },
  };
}
