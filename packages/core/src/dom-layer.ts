import { Layer, LayerOptions } from "./layer";

export interface DomLayerOptions extends LayerOptions {
  element: HTMLElement;
  x: number;
  y: number;
}

export class DomLayer extends Layer<DomLayerOptions> {
  /** @internal */
  _element?: HTMLElement;

  constructor(options: DomLayerOptions) {
    super(options);
  }

  async init() {
    this._element = document.createElement("div");
    this._element.style.position = "absolute";
    this._element.style.top = "0";
    this._element.style.left = "0";
    this._element.style.touchAction = "none";
    this._element.appendChild(this._options.element);
    this._element.addEventListener("click", (event) => {
      if (event.target != this._element) {
        event.stopPropagation();
      }
    });
    this.map!._element.appendChild(this._element);

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { blockSize, inlineSize } = entry.borderBoxSize[0];
      this._element!.style.width = `${inlineSize}px`;
      this._element!.style.height = `${blockSize}px`;
    });
    resizeObserver.observe(this._options.element);
  }

  dispose() {
    this.map!._element.removeChild(this._element!);
  }

  get options() {
    return this._options;
  }

  set options(options: DomLayerOptions) {
    if (options.hidden) {
      this._element!.style.zIndex = "-1";
    } else {
      this._element!.style.zIndex = "0";
    }
    this._options = options;
  }

  draw() {
    const position = this.map!._toOffset(this._options.x, this._options.y);
    position[0] -= this.map!._offset[0];
    position[1] -= this.map!._offset[1];
    this._element!.style.transform = `translate(${position[0]}px, ${position[1]}px)`;
  }
}
