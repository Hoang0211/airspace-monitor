import type { Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";

type HoverMap = Pick<MapLibreMap, "on" | "off" | "setFeatureState" | "getCanvas">;

/** Marks the drone under the mouse with feature-state. Returns a function that turns this off. */
export function enableDroneHover(map: HoverMap): () => void {
  let hoveredId: string | number | undefined;

  const setHovered = (id: string | number | undefined) => {
    if (id === hoveredId) return;

    if (hoveredId !== undefined) {
      map.setFeatureState({ source: "drones", id: hoveredId }, { hover: false });
    }
    if (id !== undefined) {
      map.setFeatureState({ source: "drones", id }, { hover: true });
    }

    hoveredId = id;
    map.getCanvas().style.cursor = id === undefined ? "" : "pointer";
  };

  const onMouseMove = (event: MapLayerMouseEvent) => setHovered(event.features?.[0]?.id);
  const onMouseLeave = () => setHovered(undefined);

  map.on("mousemove", "drones", onMouseMove);
  map.on("mouseleave", "drones", onMouseLeave);

  return () => {
    map.off("mousemove", "drones", onMouseMove);
    map.off("mouseleave", "drones", onMouseLeave);
  };
}
