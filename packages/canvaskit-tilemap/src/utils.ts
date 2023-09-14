export function safeCeil(n: number) {
  return Math.ceil(parseFloat(n.toFixed(3)));
}

export function makeRect(x: number, y: number, width: number, height: number) {
  return [x, y, x + width, y + height];
}
