import { FullGestureState, Gesture } from "@use-gesture/vanilla";
import { inertia } from "popmotion";
import { Tilemap } from "./tilemap";

/** @internal */
export class TilemapGesture {
  _tilemap: Tilemap;
  _initialScale = 0;
  _lastPinchTime = 0;
  _lastWheelTime = 0;
  _lastClickTime = 0;
  _lastDragTime = 0;

  _scaleAnimation = inertia({});
  _offsetAnimation = [inertia({}), inertia({})];
  _velocity = [new Average(), new Average()];
  _wheelVelocity = new Average();
  _velocityScale = new Average();

  constructor(tilemap: Tilemap) {
    this._tilemap = tilemap;
    new Gesture(tilemap._element, {
      onWheel: this._onWheel.bind(this),
      onPinchStart: () => (this._initialScale = this._tilemap._scale),
      onPinch: this._onPinch.bind(this),
      onPinchEnd: this._onPinchEnd.bind(this),
      onDragStart: this._onDragStart.bind(this),
      onDrag: this._onDrag.bind(this),
      onDragEnd: this._onDragEnd.bind(this),
      onClick: this._onClick.bind(this),
    });
  }

  _onWheel({
    direction,
    event,
    timeStamp,
    velocity,
    first,
  }: FullGestureState<"wheel">) {
    if (timeStamp == this._lastWheelTime) return;
    if (first) {
      this._wheelVelocity.clear();
    }

    this._offsetAnimation[0]?.stop();
    this._offsetAnimation[1]?.stop();
    this._scaleAnimation?.stop();
    this._lastWheelTime = timeStamp;
    const lastScale = this._tilemap._scale;
    this._wheelVelocity.add(velocity[1]);
    const v = Math.max(this._wheelVelocity.value, 0.1);
    this._scaleAnimation = inertia({
      velocity: Math.log2(1 + Math.abs(v) / 10),
      timeConstant: 50,
      restDelta: 0.001,
      onUpdate: (value) => {
        const zoom = Math.log2(lastScale) - direction[1] * value;
        this._tilemap._scaleTo(2 ** zoom, [event.x, event.y]);
      },
    });
  }

  _onPinch(state: FullGestureState<"pinch">) {
    const { origin, da, initial, touches, timeStamp } = state;
    if (touches != 2) return;

    this._lastPinchTime = timeStamp;
    const newScale = (da[0] / initial[0]) * this._initialScale;
    this._velocityScale.add(newScale - this._tilemap._scale);
    this._tilemap._scaleTo(newScale, origin);
  }

  _onPinchEnd({ origin }: FullGestureState<"pinch">) {
    const value = this._velocityScale.value;
    const direction = value > 0 ? -1 : 1;
    this._initialScale = this._tilemap._scale;
    const velocity = Math.log10(1 + Math.abs(this._velocityScale.value)) * 50;
    this._scaleAnimation?.stop();
    this._scaleAnimation = inertia({
      velocity: velocity,
      timeConstant: 50,
      restDelta: 0.001,
      onUpdate: (value) => {
        const zoom = Math.log2(this._initialScale) - direction * value;
        this._tilemap._scaleTo(2 ** zoom, origin);
      },
    });
  }

  _onDragStart() {
    this._offsetAnimation[0]?.stop();
    this._offsetAnimation[1]?.stop();
    this._scaleAnimation?.stop();
    this._velocity[0].clear();
    this._velocity[1].clear();
  }

  _onDrag(state: FullGestureState<"drag">) {
    const { pinching, wheeling, timeStamp, velocity, delta } = state;
    if (pinching || wheeling || timeStamp - this._lastPinchTime < 200) {
      return;
    }

    this._velocity[0].add(velocity[0]);
    this._velocity[1].add(velocity[1]);
    this._tilemap._setOffset([
      this._tilemap._offset[0] - delta[0],
      this._tilemap._offset[1] - delta[1],
    ]);
  }

  async _onDragEnd(state: FullGestureState<"drag">) {
    const { direction, timeStamp, distance } = state;
    if (timeStamp - this._lastPinchTime < 200) return;

    const initialOffset = [...this._tilemap._offset];
    const velocity = [this._velocity[0].value, this._velocity[1].value];
    const v = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2);
    if (v != 0) {
      this._offsetAnimation[0] = inertia({
        velocity: v,
        power: 200,
        timeConstant: 200,
        onUpdate: (value) => {
          this._tilemap._setOffset([
            initialOffset[0] - direction[0] * value * (velocity[0] / v),
            initialOffset[1] - direction[1] * value * (velocity[1] / v),
          ]);
        },
      });
    }
    if (distance[0] > 2 || distance[1] > 2) {
      this._lastDragTime = timeStamp;
    }
  }

  _onClick({ event }: { event: MouseEvent }) {
    if (event.timeStamp == this._lastDragTime) return;

    const doubleClickDelay = 200;
    if (event.timeStamp - this._lastClickTime < doubleClickDelay) {
      const lastScale = this._tilemap._scale;
      this._scaleAnimation?.stop();
      this._scaleAnimation = inertia({
        velocity: 1,
        power: 1,
        timeConstant: 100,
        restDelta: 0.001,
        onUpdate: (value) => {
          const zoom = Math.log2(lastScale) + value;
          this._tilemap._scaleTo(2 ** zoom, [event.x, event.y]);
        },
      });
    } else {
      setTimeout(() => {
        if (event.timeStamp == this._lastClickTime) {
          this._onClickTilemap([event.x, event.y]);
        }
      }, doubleClickDelay);
    }
    this._lastClickTime = event.timeStamp;
  }

  _onClickTilemap(position: [number, number]) {
    // const result = this.map.findMarker(position);
    // if (result) {
    //   result?.[0].options.onClick?.(result[1]);
    //   this.map.options.onClick?.({ target: result[0], index: result[1] });
    //   return;
    // }
    // this.map.options.onClick?.();
  }
}

class Average {
  _count = 0;
  _length = 0;
  _values: number[] = [];

  constructor(length = 3) {
    this._length = length;
  }

  add(value: number) {
    this._values[this._count % this._length] = value;
    this._count += 1;
  }

  clear() {
    this._values = Array(length);
  }

  get value() {
    const values = this._values.filter((i) => i != undefined);
    if (values.length == 0) {
      return 0;
    } else {
      return values.reduce((value, i) => value + i, 0) / values.length;
    }
  }
}
