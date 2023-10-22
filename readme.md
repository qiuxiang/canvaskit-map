# canvaskit-map

基于 canvaskit，高性能、丝滑的平面地图引擎。

## 快速上手

```typescript
import { CanvaskitMap, MarkerLayer, TileLayer } from "@canvaskit-map/core";
import initCanvaskit from "canvaskit-wasm";

const canvaskit = await initCanvaskit();
const map = new CanvaskitMap(canvaskit, {
  element: "#map",
  mapSize: [17408, 17408],
  origin: [3568 + 5888, 6286 + 2048],
  maxZoom: 1,
});
map.addLayer(
  new TileLayer({
    minZoom: 10,
    maxZoom: 13,
    offset: [-5888, -2048],
    getTileUrl(x, y, z) {
      return `https://assets.yuanshen.site/tiles_twt40/${z}/${x}_${y}.png`;
    },
  })
);
```

[试一试](https://code.juejin.cn/pen/7287881209227509821)

## React 组件

react 组件与 core 接口保持一致，例如 `<CanvaskitMap>` 组件对应
core 里的 `CanvaskitMap`，参数 options 对应组件的 props，各种
Layer 也如此。

`<CanvaskitMap>` 里的 Layer 会自动在 mount 时 `addLayer`，umount 时
`removeLayer`。

```tsx
import React, { useState, useEffect } from "react";
import { CanvaskitMap, TileLayer } from "@canvaskit-map/react";
import initCanvaskit from "canvaskit-wasm";

function Example() {
  const [canvaskit, setCanvaskit] = useState();

  useEffect(() => {
    initCanvaskit().then(setCanvaskit);
  }, []);

  if (!canvaskit) {
    return null;
  }

  const tileOffset = [-5888, -2048];
  return (
    <CanvaskitMap
      canvaskit={canvaskit}
      className="fixed w-full h-full left-0 top-0"
      mapSize={[17408, 17408]}
      origin={[3568 - tileOffset[0], 6286 - tileOffset[1]]}
      maxZoom={1}
    >
      <TileLayer
        minZoom={10}
        maxZoom={13}
        offset={tileOffset}
        getTileUrl={(x, y, z) => {
          return `https://assets.yuanshen.site/tiles_twt40/${z}/${x}_${y}.png`;
        }}
      />
    </CanvaskitMap>
  );
}
```

[试一试](https://code.juejin.cn/pen/7292445404124151846)

### MarkerLayer

与 core 不一样，react 的 MarkerLayer 用 children 作为 image，极大方便了复杂
image 的构建。

```tsx
<MarkerLayer items={[{ x, y }]} anchor={[0, 1]} className="p-1">
  <div className="w-6 h-6 flex justify-center items-center rounded-full border border-solid border-white bg-gray-700">
    <img className="w-11/12 h-11/12 object-cover" src={icon} />
  </div>
</MarkerLayer>
```

[试一试](https://code.juejin.cn/pen/7292631576842600498)

## Vue 组件

TODO
