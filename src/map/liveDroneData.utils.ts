import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { DroneSimulator } from "../simulation/droneSimulator";
import type { Drone } from "../simulation/droneSimulator.types";
import { dronesToGeoJSON, linesToGeoJSON, pilotsToGeoJSON } from "./geojson.utils";

const TICK_INTERVAL_MS = 1000;

type LiveMap = Pick<MapLibreMap, "getSource">;

function updateSources(map: LiveMap, drones: Drone[]): void {
  map.getSource<GeoJSONSource>("drones")?.setData(dronesToGeoJSON(drones));
  map.getSource<GeoJSONSource>("pilots")?.setData(pilotsToGeoJSON(drones));
  map.getSource<GeoJSONSource>("lines")?.setData(linesToGeoJSON(drones));
}

/**
 * Runs the simulation and hands each update straight to the map, so a tick never re-renders React.
 * Returns a function that stops it.
 */
export function startLiveDroneData(map: LiveMap): () => void {
  const simulator = new DroneSimulator();

  updateSources(map, simulator.getDrones());
  const interval = setInterval(() => updateSources(map, simulator.tick()), TICK_INTERVAL_MS);

  return () => clearInterval(interval);
}
