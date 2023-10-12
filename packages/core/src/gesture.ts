import { FullGestureState, Gesture } from "@use-gesture/vanilla";
import { inertia, animate, easeOut, easeInOut } from "popmotion";
import { Tilemap } from "./tilemap";

/** @internal */
export class MapGesture {
  _map: Tilemap;
  _initialScale = 0;
  _lastPinchTime = 0;
  _lastWheelTime = 0;
  _lastClickTime = 0;
  _lastDragTime = 0;

  _scaleAnimation = inertia({});
  _offsetAnimation = [inertia({}), inertia({})];
  _scaleVelocity = 0;

  constructor(map: Tilemap) {
    this._map = map;
    new Gesture(map._element, {
      onWheel: this._onWheel.bind(this),
      onPinchStart: () => (this._initialScale = this._map._scale),
      onPinch: this._onPinch.bind(this),
      onPinchEnd: this._onPinchEnd.bind(this),
      onDragStart: this._onDragStart.bind(this),
      onDrag: this._onDrag.bind(this),
      onDragEnd: this._onDragEnd.bind(this),
      onClick: this._onClick.bind(this),
    });
  }

  _onWheel(state: FullGestureState<"wheel">) {
    const { direction, event, timeStamp, velocity } = state;
    if (timeStamp == this._lastWheelTime) return;

    this._offsetAnimation[0]?.stop();
    this._offsetAnimation[1]?.stop();
    this._scaleAnimation?.stop();
    this._lastWheelTime = timeStamp;
    const lastScale = this._map._scale;
    const v = Math.max(velocity[1], 0.01);
    this._scaleAnimation = inertia({
      velocity: Math.log2(1 + Math.abs(v) / 10),
      timeConstant: 50,
      restDelta: 0.001,
      onUpdate: (value) => {
        const zoom = Math.log2(lastScale) - direction[1] * value;
        this._map._scaleTo(2 ** zoom, [event.x, event.y]);
      },
    });
  }

  _onPinch(state: FullGestureState<"pinch">) {
    const { origin, da, initial, touches, timeStamp } = state;
    if (touches != 2) return;

    this._lastPinchTime = timeStamp;
    const newScale = (da[0] / initial[0]) * this._initialScale;
    this._scaleVelocity = newScale - this._map._scale;
    this._map._scaleTo(newScale, origin);
  }

  _onPinchEnd({ origin }: FullGestureState<"pinch">) {
    let velocity = this._scaleVelocity;
    const direction = velocity > 0 ? -1 : 1;
    velocity = Math.log2(1 + Math.abs(this._scaleVelocity));
    this._initialScale = this._map._scale;
    this._scaleAnimation?.stop();
    this._scaleAnimation = inertia({
      velocity,
      power: 50,
      timeConstant: 100,
      restDelta: 0.005,
      onUpdate: (value) => {
        const zoom = Math.log2(this._initialScale) - direction * value;
        this._map._scaleTo(2 ** zoom, origin);
      },
    });
  }

  _onDragStart() {
    this._offsetAnimation[0]?.stop();
    this._offsetAnimation[1]?.stop();
    this._scaleAnimation?.stop();
  }

  _onDrag(state: FullGestureState<"drag">) {
    const { pinching, wheeling, timeStamp, delta } = state;
    if (pinching || wheeling || timeStamp - this._lastPinchTime < 200) {
      return;
    }

    this._map._setOffset([
      this._map._offset[0] - delta[0],
      this._map._offset[1] - delta[1],
    ]);
  }

  async _onDragEnd(state: FullGestureState<"drag">) {
    const { direction, timeStamp, distance, velocity } = state;
    if (timeStamp - this._lastPinchTime < 200) return;

    const initialOffset = [...this._map._offset];
    const v = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2);
    if (v != 0) {
      this._offsetAnimation[0] = inertia({
        velocity: v,
        power: 200,
        timeConstant: 200,
        onUpdate: (value) => {
          this._map._setOffset([
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
      const lastScale = this._map._scale;
      this._scaleAnimation?.stop();
      this._scaleAnimation = animate({
        ease: easeInOut,
        onUpdate: (value) => {
          const zoom = Math.log2(lastScale) + value;
          this._map._scaleTo(2 ** zoom, [event.x, event.y]);
        },
      });
    } else {
      setTimeout(() => {
        if (event.timeStamp == this._lastClickTime) {
          this._map._onClick(event.x, event.y);
        }
      }, doubleClickDelay);
    }
    this._lastClickTime = event.timeStamp;
  }
}
