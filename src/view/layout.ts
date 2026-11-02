export const MAX_CELL = 200;

export type Orientation = 'landscape' | 'portrait';

export const orientationFor = (width: number, height: number): Orientation =>
  height >= width * 1.25 ? 'portrait' : 'landscape';

export const SCENES = {
  landscape: {
    size: { width: 1600, height: 900 },
    logo: { x: 276, y: 105, height: 170, maxWidth: 446 },
    character: { x: 271, y: 434, scale: 0.82 },
    board: { x: 581, y: 82, cell: 177 },
    message: { x: 800, y: 715 },
    hud: { top: 755, metersY: 0 },
    floor: 680,
    splash: { top: 20, bottom: 695, dotsY: 715, logoHeight: 170 },
  },
  portrait: {
    size: { width: 900, height: 1600 },
    logo: { x: 450, y: 239, height: 230, maxWidth: 860 },
    character: { x: 162, y: 600, scale: 0.62 },
    board: { x: 364, y: 458, cell: 98 },
    message: { x: 450, y: 826 },
    hud: { top: 1220, metersY: 1043 },
    floor: 786,
    splash: { top: 332, bottom: 1232, dotsY: 1272, logoHeight: 260 },
  },
};

export type Scene = (typeof SCENES)[Orientation];
