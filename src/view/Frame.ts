import { Assets, Container, Graphics, NineSliceSprite } from 'pixi.js';

/** The gold frame picture, used around the reels and the pop-ups. */
export const FRAME_URL = 'assets/board/frame.png';
/**
 * In the frame picture (px): where its see-through opening starts, from the left and right and from
 * the top and bottom, and how big the corner pieces are, which never stretch.
 */
const ART = { insetX: 91, insetY: 104, corner: 150 };

/**
 * The gold frame around a `width` × `height` area whose top left is at (0, 0): stretched to fit,
 * `thickness` thick at the top and bottom (its inner rim just overlaps the area's edges).
 */
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

/** A pop-up panel centred on (0, 0): a dark `color` fill inside the gold frame. */
export function framedPanel(width: number, height: number, thickness: number, color: number, alpha = 0.95) {
  const panel = new Container();
  const frame = goldFrame(width, height, thickness);
  panel.addChild(new Graphics().roundRect(-8, -8, width + 16, height + 16, 24).fill({ color, alpha }), frame);
  panel.position.set(-width / 2, -height / 2);
  return panel;
}

/** The plain gold-rimmed panel picture (purple inside), behind the big win count-up. */
export const PANEL_URL = 'assets/board/panel.png';
/** In the panel picture (px): how wide its gold band is, and how big the corners are, which never stretch. */
const PANEL_ART = { band: 50, corner: 90 };

/** The panel, `width` × `height` inside its gold band and centred on (0, 0), the band `band` thick. */
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
