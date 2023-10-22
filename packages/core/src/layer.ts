import { Canvas } from "canvaskit-wasm";
import { CanvaskitMap } from "./map";

export interface LayerOptions {
  /**
   * 层级, 数值大的显示在上面, 默认 0
   */
  zIndex?: number;

  /**
   * 是否隐藏
   */
  hidden?: boolean;
}

/**
 * 所有 Layer 实现都应该继承该 class
 */
export abstract class Layer<O extends LayerOptions = LayerOptions> {
  /**
   * addLayer 时赋值，需要注意 constructor 里无法访问
   */
  map?: CanvaskitMap;
  constructor(public _options: O) {}

  /**
   * 实现该方法以实现 Layer 绘制
   */
  abstract draw(canvas: Canvas): void;

  /**
   * 记录是否已初始化，为了避免 init 重复调用
   */
  _initialized = false;

  /**
   * 地图初始化或 addLayer 时调用
   *
   * 重载这个方法可以初始化时访问 this.map
   */
  async init() {}

  /**
   * removeLayer 时调用，用于清理工作
   */
  dispose() {}

  get zIndex() {
    return this._options.zIndex ?? 0;
  }

  get options() {
    return this._options;
  }

  /**
   * 可以重载该方法以实现自定义 options 更新，需要注意
   * get options() 也要一起重载，即便没有做任何改动
   */
  set options(options: O) {
    this._options = options;
  }

  get canvaskit() {
    return this.map?.canvaskit;
  }
}
