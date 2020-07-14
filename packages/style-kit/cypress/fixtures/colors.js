import Color from 'color';

// Because cypress colours typically are in rgba we use Color to convert nicely from known hex
export const meecoRed = Color('#e61e3d').toString();
export const meecoCharcoal = Color('#555555').toString();
export const meecoCharcoalShade = Color('#444444').toString();
export const meecoWhite = Color('#ffffff').toString();
export const meecoPink = Color('#fde9ec').toString();
export const meecoTransparent = Color('transparent').toString();
