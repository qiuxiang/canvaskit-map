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
  scale: number,
  anchor: [number, number],
  translate: [number, number]
) {
  const scos = scale;
  const ssin = 0;
  return [
    scos,
    ssin,
    translate[0] + -scos * anchor[0] + ssin * anchor[1],
    translate[1] + -scos * anchor[0] + ssin * anchor[1],
  ];
}

/** @internal */
export function alongSize(
  align: [number, number],
  size: [number, number]
): [number, number] {
  const centerX = size[0] / 2.0;
  const centerY = size[1] / 2.0;
  return [centerX + align[0] * centerX, centerY + align[1] * centerY];
}
