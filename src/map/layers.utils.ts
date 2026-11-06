import type { Map as MapLibreMap } from "maplibre-gl";
import type { LayerToggle, LayerVisibility } from "../state/store.types";
import { MAP_LAYERS, MAP_SOURCES, TOGGLE_LAYERS } from "./layers";

export function addMapLayers(map: Pick<MapLibreMap, "addSource" | "addLayer">): void {
  for (const [id, source] of Object.entries(MAP_SOURCES)) {
    map.addSource(id, source);
  }
  for (const layer of MAP_LAYERS) {
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
