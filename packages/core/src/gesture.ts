import { FullGestureState, Gesture } from "@use-gesture/vanilla";
import { animate, easeInOut, inertia } from "popmotion";
import { CanvaskitMap } from "./map";

/** @internal */
export class MapGesture {
  _map: CanvaskitMap;
  _initialScale = 0;
  _lastPinchTime = 0;
  _lastWheelTime = 0;
  _lastClickTime = 0;
  _lastDragTime = 0;
  _lastOrigin = [0, 0];

  _scaleAnimation = inertia({});
  _offsetAnimation = inertia({});
  _scaleVelocity = 0;

  constructor(map: CanvaskitMap) {
    this._map = map;
    new Gesture(map._element, {
      onWheelStart: this._onWheelStart.bind(this),
      onWheel: this._onWheel.bind(this),
      onWheelEnd: this._onWheelEnd.bind(this),
      onPinchStart: ({ origin }) => {
        this._initialScale = this._map._scale;
        this._lastOrigin = origin;
      },
      onPinch: this._onPinch.bind(this),
      onPinchEnd: this._onPinchEnd.bind(this),
      onDragStart: this._onDragStart.bind(this),
      onDrag: this._onDrag.bind(this),
      onDragEnd: this._onDragEnd.bind(this),
      onClick: this._onClick.bind(this),
    });
  }

  _onWheelStart(state: FullGestureState<"wheel">) {
    this._offsetAnimation?.stop();
  }

  _onWheel({ direction, event, velocity }: FullGestureState<"wheel">) {
    this._scaleAnimation?.stop();
    const lastZoom = Math.log2(this._map._scale);
    this._scaleAnimation = inertia({
      velocity: velocity[1] + 1,
      restDelta: 0.001,
      onUpdate: (value) => {
        const zoom = lastZoom - direction[1] * value;
        this._map._scaleTo(2 ** zoom, event.x, event.y);
      },
    });
  }

  _onWheelEnd({ velocity, direction, event }: FullGestureState<"wheel">) {
    this._scaleAnimation?.stop();
    const initial = Math.log2(this._map._scale);
    this._scaleAnimation = inertia({
      velocity: Math.log2(velocity[1] + 1.2),
      power: 0.2,
      timeConstant: 100,
      restDelta: 0.001,
      onUpdate: (value) => {
        const zoom = initial - direction[1] * value;
        this._map._scaleTo(2 ** zoom, event.x, event.y);
      },
    });
  }

  _onPinch(state: FullGestureState<"pinch">) {
    const { origin, da, initial, touches, timeStamp } = state;
    if (touches != 2) return;

    this._lastPinchTime = timeStamp;
    const newScale = (da[0] / initial[0]) * this._initialScale;
    this._scaleVelocity = newScale - this._map._scale;
    this._map._setOffset(
      this._map.offset[0] - (origin[0] - this._lastOrigin[0]),
      this._map.offset[1] - (origin[1] - this._lastOrigin[1])
    );
    this._map._scaleTo(newScale, ...origin);
    this._lastOrigin = origin;
  }

  _onPinchEnd({ origin }: FullGestureState<"pinch">) {
    let velocity = this._scaleVelocity;
    const direction = velocity > 0 ? -1 : 1;
    velocity = Math.min(Math.log2(1 + Math.abs(this._scaleVelocity)), 0.05);
    this._initialScale = this._map._scale;
    this._scaleAnimation?.stop();
    this._scaleAnimation = inertia({
      velocity,
      power: 50,
      timeConstant: 100,
      restDelta: 0.005,
      onUpdate: (value) => {
        const zoom = Math.log2(this._initialScale) - direction * value;
        this._map._scaleTo(2 ** zoom, ...origin);
      },
    });
  }

  _onDragStart() {
    this._offsetAnimation?.stop();
    this._scaleAnimation?.stop();
  }

  _onDrag(state: FullGestureState<"drag">) {
    const { pinching, wheeling, timeStamp, delta } = state;
    if (pinching || wheeling || timeStamp - this._lastPinchTime < 200) {
      return;
    }

    this._map._setOffset(
      this._map._offset[0] - delta[0],
      this._map._offset[1] - delta[1]
    );
  }

  _onDragEnd(state: FullGestureState<"drag">) {
    const { direction, timeStamp, distance, velocity } = state;
    if (timeStamp - this._lastPinchTime < 200) return;

    const initialOffset = [...this._map._offset];
    const v = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2);
    if (v != 0) {
      this._offsetAnimation = inertia({
        velocity: v,
        power: 200,
        timeConstant: 200,
        onUpdate: (value) => {
          this._map._setOffset(
            initialOffset[0] - direction[0] * value * (velocity[0] / v),
            initialOffset[1] - direction[1] * value * (velocity[1] / v)
          );
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
          this._map._scaleTo(2 ** zoom, event.x, event.y);
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
