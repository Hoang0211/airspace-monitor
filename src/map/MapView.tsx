import { useEffect, useRef } from "react";
import {
  FullscreenControl,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppStore } from "../state/store";
import { enableDroneHover } from "./droneHover.utils";
import { applyDroneSelection, enableDroneSelection } from "./droneSelection.utils";
import { addMapIcons } from "./icons.utils";
import { addMapLayers, applyLayerVisibility } from "./layers.utils";
import { startLiveDroneData } from "./liveDroneData.utils";

setWorkerUrl(workerUrl);

// Close enough to show drone labels, without zooming back out if already closer.
const FLY_TO_MIN_ZOOM = 13;

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = new MapLibreMap({
      container: containerRef.current!,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [24.97, 60.3],
      zoom: 11,
    });

    map.addControl(new NavigationControl());
    // Fullscreen covers the whole page, so the side panel stays visible next to the map.
    map.addControl(new FullscreenControl({ container: document.documentElement }));
    map.addControl(new ScaleControl());

    let unsubscribe = () => {};
    let stopLiveData = () => {};
    let disableDroneHover = () => {};
    let disableDroneSelection = () => {};

    map.on("load", () => {
      addMapIcons(map);
      addMapLayers(map);
      applyLayerVisibility(map, useAppStore.getState().layers);

      const { playback, recordTick, selectDrone } = useAppStore.getState();
      const liveData = startLiveDroneData(map, playback, recordTick);
      stopLiveData = liveData.stop;
      disableDroneHover = enableDroneHover(map);
      disableDroneSelection = enableDroneSelection(map, selectDrone);

      unsubscribe = useAppStore.subscribe((state, previousState) => {
        if (state.layers !== previousState.layers) {
          applyLayerVisibility(map, state.layers);
        }
        if (state.playback !== previousState.playback) {
          liveData.setPlayback(state.playback);
        }
        if (state.selectedDroneId !== previousState.selectedDroneId) {
          applyDroneSelection(map, previousState.selectedDroneId, state.selectedDroneId);
        }
        if (state.flyTarget && state.flyTarget !== previousState.flyTarget) {
          map.flyTo({ center: state.flyTarget, zoom: Math.max(map.getZoom(), FLY_TO_MIN_ZOOM) });
        }
      });
    });

    return () => {
      unsubscribe();
      stopLiveData();
      disableDroneHover();
      disableDroneSelection();
      map.remove();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
