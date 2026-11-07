import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { droneFeatureId } from "./geojson.utils";
import { pilotLinkFilter } from "./layers";

// A drone's trail shares its numeric feature ID, so one selection covers both sources.
const SELECTABLE_SOURCES = ["drones", "lines"];

type SelectionMap = Pick<MapLibreMap, "setFeatureState" | "setFilter">;
type ClickMap = Pick<MapLibreMap, "on" | "off" | "queryRenderedFeatures">;

/** Reports the drone under each click, or null for a click anywhere else on the map. */
export function enableDroneSelection(
  map: ClickMap,
  onSelect: (droneId: string | null) => void,
): () => void {
  const onClick = ({ point }: MapMouseEvent) => {
    const [feature] = map.queryRenderedFeatures(point, { layers: ["drones"] });
    onSelect(feature?.properties.droneId ?? null);
  };

  map.on("click", onClick);

  return () => {
    map.off("click", onClick);
  };
}

function setSelected(map: SelectionMap, droneId: string, selected: boolean): void {
  for (const source of SELECTABLE_SOURCES) {
    map.setFeatureState({ source, id: droneFeatureId(droneId) }, { selected });
  }
}

/** Moves the highlight and the pilot link from the previous selection to the new one. */
export function applyDroneSelection(
  map: SelectionMap,
  previousDroneId: string | null,
  droneId: string | null,
): void {
  if (previousDroneId) setSelected(map, previousDroneId, false);
  if (droneId) setSelected(map, droneId, true);

  map.setFilter("pilot-links", pilotLinkFilter(droneId));
}
