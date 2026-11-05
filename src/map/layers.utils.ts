import type { Map as MapLibreMap } from "maplibre-gl";
import type { LayerToggle, LayerVisibility } from "../state/store.types";
import { STATIC_LAYERS, STATIC_SOURCES, TOGGLE_LAYERS } from "./layers";

export function addStaticLayers(map: Pick<MapLibreMap, "addSource" | "addLayer">): void {
  for (const [id, source] of Object.entries(STATIC_SOURCES)) {
    map.addSource(id, source);
  }
  for (const layer of STATIC_LAYERS) {
    map.addLayer(layer);
  }
}

export function applyLayerVisibility(
  map: Pick<MapLibreMap, "setLayoutProperty">,
  visibility: LayerVisibility,
): void {
  for (const [toggle, layerIds] of Object.entries(TOGGLE_LAYERS)) {
    const value = visibility[toggle as LayerToggle] ? "visible" : "none";
    for (const layerId of layerIds) {
      map.setLayoutProperty(layerId, "visibility", value);
    }
  }
}
