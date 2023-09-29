/** @internal */
export function safeCeil(n: number) {
  return Math.ceil(parseFloat(n.toFixed(3)));
}

/** @internal */
export function makeRect(x: number, y: number, width: number, height: number) {
  return [x, y, x + width, y + height];
}

/** @internal */
export function makeRSXform(
  rotation: number,
  scale: number,
  anchor: [number, number],
  translate: [number, number]
) {
  const scos = Math.cos(rotation) * scale;
  const ssin = Math.sin(rotation) * scale;
  return [
    scos,
    ssin,
    translate[0] + -scos * anchor[0] + ssin * anchor[1],
    translate[1] + -ssin * anchor[0] + scos * anchor[1],
  ];
}

/** @internal */
export function overlays(rect: number[], other: number[]) {
  if (rect[2] <= other[0] || other[2] <= rect[0]) {
    return false;
  }
  if (rect[3] <= other[1] || other[3] <= rect[1]) {
    return false;
  }
  return true;
}
