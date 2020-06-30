import Color from 'color';

// Because cypress colours typically are in rgba we use Color to convert nicely from known hex
export const meecoRed = Color('#e61e3d').toString();
export const meecoWhite = Color('#ffffff').toString();
export const meecoPink = Color('#e61e3d')
  .alpha(0.1)
  .toString();
export const meecoTransparent = Color('transparent').toString();
