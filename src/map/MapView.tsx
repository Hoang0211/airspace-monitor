import { useEffect, useRef } from "react";
import { Map as MapLibreMap, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppStore } from "../state/store";
import { addMapIcons } from "./icons.utils";
import { addStaticLayers, applyLayerVisibility } from "./layers.utils";

setWorkerUrl(workerUrl);

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = new MapLibreMap({
      container: containerRef.current!,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [24.97, 60.3],
      zoom: 11,
    });

    let unsubscribe = () => {};

    map.on("load", () => {
      addMapIcons(map);
      addStaticLayers(map);
      applyLayerVisibility(map, useAppStore.getState().layers);

      unsubscribe = useAppStore.subscribe((state, previousState) => {
        if (state.layers !== previousState.layers) {
          applyLayerVisibility(map, state.layers);
        }
      });
    });

    return () => {
      unsubscribe();
      map.remove();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
