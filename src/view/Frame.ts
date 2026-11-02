import { Assets, Container, Graphics, NineSliceSprite } from 'pixi.js';

export const FRAME_URL = 'assets/board/frame.png';
/** In the frame picture (px): where its see-through opening starts on each side, and the non-stretching corner size. */
const ART = { insetX: 91, insetY: 104, corner: 150 };

/** Frame around a `width` × `height` area at (0, 0), `thickness` thick at the top and bottom. */
export function goldFrame(width: number, height: number, thickness: number) {
  const { insetX, insetY, corner } = ART;
  const scale = thickness / insetY;
  const frame = new NineSliceSprite({
    texture: Assets.get(FRAME_URL), leftWidth: corner, rightWidth: corner, topHeight: corner, bottomHeight: corner,
  });
  frame.scale.set(scale);
  frame.width = width / scale + 2 * insetX;
  frame.height = height / scale + 2 * insetY;
  frame.position.set(-insetX * scale, -insetY * scale);
  return frame;
}

/** Centred on (0, 0). */
export function framedPanel(width: number, height: number, thickness: number, color: number, alpha = 0.95) {
  const panel = new Container();
  const frame = goldFrame(width, height, thickness);
  panel.addChild(new Graphics().roundRect(-8, -8, width + 16, height + 16, 24).fill({ color, alpha }), frame);
  panel.position.set(-width / 2, -height / 2);
  return panel;
}

export const PANEL_URL = 'assets/board/panel.png';
/** In the panel picture (px): gold band width and non-stretching corner size. */
const PANEL_ART = { band: 50, corner: 90 };

/** `width` × `height` inside the band, centred on (0, 0). */
export function goldPanel(width: number, height: number, band: number) {
  const scale = band / PANEL_ART.band;
  const { corner } = PANEL_ART;
  const panel = new NineSliceSprite({
    texture: Assets.get(PANEL_URL), leftWidth: corner, rightWidth: corner, topHeight: corner, bottomHeight: corner,
  });
  panel.scale.set(scale);
  panel.width = width / scale + 2 * PANEL_ART.band;
  panel.height = height / scale + 2 * PANEL_ART.band;
  panel.position.set(-(width / 2 + band), -(height / 2 + band));
  return panel;
}
